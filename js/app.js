// js/app.js
"use strict";

import * as gameModule from './game.js';
import * as badgesModule from './badges.js';
import * as leaderboardModule from './leaderboard.js';
import * as shareModule from './share.js';
import { data } from './data.js';
import * as utils from './utils.js';
import * as dbModule from './db.js';

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Main Orchestrator                                            */
/*  ES‑module, vanilla JS. Handles routing, Service Worker registration,       */
/*  UI module loading, global error handling and local persistence.           */
/* -------------------------------------------------------------------------- */

// ---------------------------------------------------------------------------
//  State & Configuration
// ---------------------------------------------------------------------------
const PLAYER_NAME_KEY = 'youthPulsePlayerName';
const DEFAULT_PLAYER_NAME = 'Joueur';

// Récupère ou définit le nom du joueur (stocké localement)
let playerName = (() => {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || DEFAULT_PLAYER_NAME;
  } catch (e) {
    return DEFAULT_PLAYER_NAME;
  }
})();

// Référence au conteneur principal pour les notifications toast
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
toastContainer.setAttribute('aria-live', 'polite');
toastContainer.setAttribute('aria-atomic', 'true');
document.body.appendChild(toastContainer);

// ---------------------------------------------------------------------------
//  Service Worker – Fallback hors ligne pour les pages essentielles
// ---------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./sw.js')
    .catch(err => utils.showNetworkError('Échec de l’enregistrement du Service Worker : ' + err));
}

// ---------------------------------------------------------------------------
//  Gestionnaire d’erreurs global – affiche un message d’erreur réseau via utils
// ---------------------------------------------------------------------------
window.addEventListener('error', event => {
  console.error('Erreur globale capturée :', event.error);
  utils.showNetworkError('Une erreur inattendue est survenue. Veuillez réessayer plus tard.');
});

// ---------------------------------------------------------------------------
//  Affichage des sections – Masque toutes les sections et affiche celle demandée
// ---------------------------------------------------------------------------
function hideAllSections() {
  const sections = document.querySelectorAll('section[id]');
  sections.forEach(sec => {
    sec.style.display = 'none';
    sec.setAttribute('aria-hidden', 'true');
  });
}

function showSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'block';
    el.setAttribute('aria-hidden', 'false');
  }
}

// ---------------------------------------------------------------------------
//  Notifications toast – affiche un message avec un horodatage
// ---------------------------------------------------------------------------
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = `${new Date().toLocaleString()} – ${message}`;
  toastContainer.appendChild(toast);
  // Supprime automatiquement le toast après 3 secondes
  setTimeout(() => toast.remove(), 3000);
}

// ---------------------------------------------------------------------------
//  Gestion de la fin de partie – débloque les badges, met à jour le score et le tableau des leaders
// ---------------------------------------------------------------------------
async function onGameCompleted(context) {
  try {
    // Met à jour le score dans la base de données principale
    await dbModule.setScore(context.score);

    // Ajoute une entrée au tableau des leaders avec le nom du joueur et le score
    await dbModule.addLeaderboardEntry(playerName, context.score);

    // Vérifie chaque badge et débloque ceux dont la condition est remplie
    for (const badge of badgesModule.BADGES_CATALOG) {
      if (badge.condition && !await isBadgeUnlocked(badge.id)) {
        if (badge.condition(context)) {
          await badgesModule.setBadgeUnlocked(badge.id, context);
          showToast(`Badge débloqué : ${badge.name}`);
        }
      }
    }

    // Affiche le toast de completion avec horodatage
    showToast('Jeu terminé !');

    // Rafraîchit le panneau des badges pour refléter le nouveau badge
    renderBadgesPanel();
  } catch (err) {
    console.error('Erreur lors du traitement de la fin de partie :', err);
    utils.showNetworkError('Impossible de sauvegarder les résultats du jeu.');
  }
}

// ---------------------------------------------------------------------------
//  Badge helper – vérifie si un badge est déjà débloqué
// ---------------------------------------------------------------------------
async function isBadgeUnlocked(badgeId) {
  const unlocked = await badgesModule.getUnlockedBadgeIds();
  return unlocked.includes(badgeId);
}

// ---------------------------------------------------------------------------
//  Rendu du panneau des badges – utilise le catalogue de badges et la liste des badges débloqués
// ---------------------------------------------------------------------------
async function renderBadgesPanel() {
  const listEl = document.getElementById('badgesList');
  if (!listEl) return;
  listEl.innerHTML = '';

  const unlockedSet = new Set(await badgesModule.getUnlockedBadgeIds());

  badgesModule.BADGES_CATALOG.forEach(badge => {
    const li = document.create probably want to use backticks for HTML template.
    const li = document.createElement('li');
    li.className = 'badge-item';
    li.setAttribute('role', 'listitem');
    if (unlockedSet.has(badge.id)) {
      li.classList.add('unlocked');
    }
    li.innerHTML = `
      <span class="badge-icon" aria-hidden="true">${badge.icon}</span>
      <div class="badge-info">
        <h3 class="badge-name">${badge.name}</h3>
        <p class="badge-desc">${badge.description}</p>
      </div>
    `;
    listEl.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
//  Rendu du tableau des leaders – utilise dbModule.getLeaderboardEntries()
// ---------------------------------------------------------------------------
async function renderLeaderboardPanel() {
  const listEl = document.getElementById('leaderboardList');
  if (!listEl) return;
  listEl.innerHTML = '';

  const entries = await dbModule.getLeaderboardEntries();
  if (entries.length === 0) {
    listEl.innerHTML = '<li class="empty">Aucune entrée pour le moment.</li>';
    return;
  }

  entries.forEach((entry, idx) => {
    const li = document.createElement('li');
    li.className = 'leaderboard-entry';
    li.setAttribute('role', 'listitem');
    li.innerHTML = `
      <span class="rank">${idx + 1}.</span>
      <span class="player">${escapeHtml(entry.name)}</span>
      <span class="score">${entry.score}</span>
    `;
    listEl.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
//  Utile – échappe le HTML dans les chaînes affichées
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

// ---------------------------------------------------------------------------
//  Sections – initialise le contenu et les écouteurs d’événements pour chaque page
// ---------------------------------------------------------------------------

// Accueil – rien de spécial, juste afficher
function showHome() {
  showSection('home');
}

// Jeu – charge le module jeu et initialise l’interface
function showGame() {
  showSection('game');
  gameModule.initGameUI?.();
  // Attache le bouton de démarrage si présent
  const startBtn = document.getElementById('startGameBtn');
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      try {
        const ctx = await gameModule.startGame();
        // Le module jeu appelle onGameCompleted lorsque le jeu se termine
        if (typeof ctx === 'object') {
          onGameCompleted(ctx);
        }
      } catch (err) {
        console.error('Erreur lors du démarrage du jeu :', err);
        utils.showNetworkError('Impossible de démarrer le mini‑jeu.');
      }
    });
  }
  // Bouton de redémarrage
  const restartBtn = document.getElementById('restartGameBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      gameModule.restartGame?.();
    });
  }
}

// Panneau des badges – affiche la liste des badges
async function showBadges() {
  showSection('badges');
  await renderBadgesPanel();
}

// Tableau des leaders – affiche le classement
async function showLeaderboard() {
  showSection('leaderboard');
  await renderLeaderboardPanel();
}

// Flux vidéo – affiche les témoignages statiques
function showVideos() {
  showSection('videos');
  const feedEl = document.getElementById('videoFeed');
  if (!feedEl) return;
  feedEl.innerHTML = '';

  data.testimonies.forEach(item => {
    const article = document.createElement('article');
    article.className = 'video-item';
    article.setAttribute('role', 'listitem');
    article.innerHTML = `
      <div class="video-placeholder" aria-label="Vidéo de ${escapeHtml(item.author)}">
        <img src="img/placeholder-video.jpg" alt="" />
      </div>
      <div class="video-info">
        <p class="quote">${escapeHtml(item.quote)}</p>
        <p class="author">${escapeHtml(item.author)}</p>
        <p class="context">${escapeHtml(item.context)}</p>
      </div>
    `;
    feedEl.appendChild(article);
  });
}

// Générateur de mèmes – charge les modèles et initialise l’éditeur
function showMemes() {
  showSection('memes');
  shareModule.initMemeEditor?.(data.memeTemplates);
}

// Partage – configure le bouton de partage
function showShare() {
  showSection('share');
  shareModule.initShareUI?.();
}

// ---------------------------------------------------------------------------
//  Navigation – réagit aux changements de hash et charge la section appropriée
// ---------------------------------------------------------------------------
function navigate() {
  const hash = window.location.hash.slice(1) || 'home';
  hideAllSections();
  switch (hash) {
    case 'home': showHome(); break;
    case 'game': showGame(); break;
    case 'badges': showBadges(); break;
    case 'leaderboard': showLeaderboard(); break;
    case 'videos': showVideos(); break;
    case 'memes': showMemes(); break;
    case 'share': showShare(); break;
    default: showHome();
  }
}

// ---------------------------------------------------------------------------
//  Initialisation – configure la navigation et charge la section initiale
// ---------------------------------------------------------------------------
function init() {
  // Configure le bouton de partage social (WhatsApp, Facebook, TikTok) via shareModule
  const shareButtons = document.getElementById('shareButtons');
  if (shareButtons) {
    shareModule.attachShareButtons?.(shareButtons);
  }

  // Configure le générateur de mèmes (prévisualisation, téléchargement)
  const memeEditor = document.getElementById('memeEditor');
  if (memeEditor) {
    shareModule.attachMemeEditor?.(memeEditor);
  }

  // Configure le bouton de partage du meme
  const shareMemeBtn = document.getElementById('shareMemeBtn');
  if (shareMemeBtn) {
    shareMemeBtn.addEventListener('click', () => {
      shareModule.shareCurrentMeme?.();
    });
  }

  // Réagit aux changements de hash
  window.addEventListener('hashchange', navigate);
  // Charge la section initiale
  navigate();
}

// Démarre l’application lorsque le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}