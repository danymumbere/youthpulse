// js/game.js
"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Mini‑Game Module                                            */
/*  ES‑module, vanilla JS. Fournit la logique du jeu instantané de 2 à 3 minutes, */
/*  le calcul du score, le déverrouillage des badges et l’interface utilisateur       */
/*  réactive et accessible. Toutes les données sont stockées localement via       */
/*  IndexedDB (db.js). Le jeu s’arrête automatiquement après 3 minutes et affiche   */
/*  un toast de fin avec un horodatage.                                        */
/* -------------------------------------------------------------------------- */

import { setScore, getScore, setBadgeUnlocked, getUnlockedBadgeIds } from './db.js';
import { BADGES_CATALOG } from './badges.js';
import { showNetworkError } from './utils.js';

/* -------------------------------------------------------------------------- */
/*  Constantes du jeu – ajustez la durée, les points, les délais si nécessaire.   */
/* -------------------------------------------------------------------------- */
const GAME_DURATION_MS = 3 * 60 * 1000; // 3 minutes
const POINTS_PER_HIT = 10;
const TARGET_SHOW_MS = 1500;
const MIN_SPAWN_DELAY_MS = 1000;
const MAX_SPAWN_DELAY_MS = 3000;

/* -------------------------------------------------------------------------- */
/*  Référence au DOM – IDs autorisés par le projet.                           */
/* -------------------------------------------------------------------------- */
const homeEl = document.getElementById('home');
const startGameBtnEl = document.getElementById('startGameBtn');
const gameEl = document.getElementById('game');
const gamePromptEl = document.getElementById('gamePrompt');
const gameAreaEl = document.getElementById('gameArea');
const restartGameBtnEl = document.getElementById('restartGameBtn');
const badgesListEl = document.getElementById('badgesList');

/* -------------------------------------------------------------------------- */
/*  État du jeu – persistant pendant une session.                              */
/* -------------------------------------------------------------------------- */
const gameState = {
  startTime: null,          // timestamp du début (ms)
  score: 0,                 // score actuel
  gameCompleted: false,     // true lorsque le temps est écoulé
  targetTimeout: null,      // handle pour masquer la cible
  gameLoopId: null,         // requestAnimationFrame id
};

/* -------------------------------------------------------------------------- */
/*  Initialise une nouvelle partie – réinitialise l’état, affiche l’écran du jeu   */
/*  et démarre la boucle principale.                                            */
/* -------------------------------------------------------------------------- */
function resetGame() {
  // Réinitialiser l’état
  gameState.startTime = null;
  gameState.score = 0;
  gameState.gameCompleted = false;
  if (gameState.targetTimeout) {
    clearTimeout(gameState.targetTimeout);
    gameState.targetTimeout = null;
  }
  if (gameState.gameLoopId) {
    cancelAnimationFrame(gameState.gameLoopId);
    gameState.gameLoopId = null;
  }

  // Masquer l’écran d’accueil et afficher l’écran du jeu
  homeEl.classList.add('hidden');
  gameEl.classList.remove('hidden');

  // Réinitialiser le prompt avec des instructions
  gamePromptEl.textContent = 'Attrapez la cible ! Cliquez dessus avant qu’elle ne disparaisse.';

  // Démarrer le jeu
  startGame();
}

/* -------------------------------------------------------------------------- */
/*  Démarre la boucle principale du jeu et le spawn aléatoire de la cible.      */
/* -------------------------------------------------------------------------- */
function startGame() {
  // Si une partie est déjà en cours, la réinitialiser d’abord
  if (gameState.startTime) {
    resetGame();
  }

  gameState.startTime = Date.now();
  gameState.gameCompleted = false;

  // Afficher le bouton de redémarrage (caché par défaut)
  restartGameBtnEl.classList.add('hidden');

  // Démarrer la boucle de jeu
  gameLoop();

  // Planifier le premier spawn de cible
  scheduleTargetSpawn();
}

/* -------------------------------------------------------------------------- */
/*  Boucle principale de jeu – met à jour le minuteur, le score et vérifie la fin. */
/* -------------------------------------------------------------------------- */
function gameLoop() {
  if (!gameState.startTime || gameState.gameCompleted) {
    return;
  }

  const elapsed = Date.now() - gameState.startTime;
  const remaining = GAME_DURATION_MS - elapsed;

  // Mettre à jour le texte du prompt avec le temps restant et le score
  const remainingSec = Math.ceil(remaining / 1000);
  gamePromptEl.textContent = `Temps restant : ${remainingSec}s | Score : ${gameState.score}`;

  if (remaining <= 0) {
    // Temps écoulé – terminer le jeu
    endGame();
    return;
  }

  // Planifier la prochaine frame
  gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

/* -------------------------------------------------------------------------- */
/*  Planifie l’apparition d’une cible à un moment aléatoire.                   */
/* -------------------------------------------------------------------------- */
function scheduleTargetSpawn() {
  if (gameState.gameCompleted) {
    return;
  }

  const delay = Math.random() * (MAX_SPAWN_DELAY_MS - MIN_SPAWN_DELAY_MS) + MIN_SPAWN_DELAY_MS;
  gameState.targetTimeout = setTimeout(() => {
    spawnTarget();
    // Planifier le prochain spawn après la cible actuelle
    scheduleTargetSpawn();
  }, delay);
}

/* -------------------------------------------------------------------------- */
/*  Crée une cible cliquable à une position aléatoire dans la zone de jeu.     */
/* -------------------------------------------------------------------------- */
function spawnTarget() {
  if (gameState.gameCompleted) {
    return;
  }

  const rect = gameAreaEl.getBoundingClientRect();
  const x = Math.floor(Math.random() * (rect.width - 50));
  const y = Math.floor(Math.random() * (rect.height - 50));

  const target = document.createElement('div');
  target.className = 'target';
  target.style.position = 'absolute';
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  target.style.width = '50px';
  target.style.height = '50px';
  target.style.backgroundColor = '#ff4d4d';
  target.style.borderRadius = '50%';
  target.style.cursor = 'pointer';
  target.style.display = 'block';
  target.setAttribute('role', 'button');
  target.setAttribute('aria-label', 'Cible');

  gameAreaEl.appendChild(target);

  // Masquer la cible après un court instant
  gameState.targetTimeout = setTimeout(() => {
    target.style.display = 'none';
  }, TARGET_SHOW_MS);
}

/* -------------------------------------------------------------------------- */
/*  Gère les clics sur la zone de jeu – incrémente le score si la cible est cliquée. */
/* -------------------------------------------------------------------------- */
function handleTargetClick(event) {
  if (gameState.gameCompleted) {
    return;
  }

  const target = event.target.closest('.target');
  if (!target) {
    return;
  }

  // Incrémenter le score
  gameState.score += POINTS_PER_HIT;

  // Masquer la cible immédiatement
  target.style.display = 'none';
  if (gameState.targetTimeout) {
    clearTimeout(gameState.targetTimeout);
    gameState.targetTimeout = null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Termine le jeu : stocke le score, vérifie les badges, affiche le toast de fin   */
/*  et montre le bouton de redémarrage.                                         */
/* -------------------------------------------------------------------------- */
async function endGame() {
  if (gameState.gameCompleted) {
    return;
  }

  gameState.gameCompleted = true;

  // Annuler tout spawn de cible en attente
  if (gameState.targetTimeout) {
    clearTimeout(gameState.targetTimeout);
    gameState.targetTimeout = null;
  }
  if (gameState.gameLoopId) {
    cancelAnimationFrame(gameState.gameLoopId);
    gameState.gameLoopId = null;
  }

  // Stocker le score final
  try {
    await setScore(gameState.score);
  } catch (err) {
    console.error('Erreur lors du stockage du score :', err);
    showNetworkError('Impossible de sauvegarder le score.');
  }

  const durationSec = Math.floor((Date.now() - gameState.startTime) / 1000);
  const context = {
    gameCompleted: true,
    durationSec,
    score: gameState.score,
  };

  // Vérifier chaque badge du catalogue
  try {
    const unlockedIds = await getUnlockedBadgeIds();

    for (const badge of BADGES_CATALOG) {
      if (!badge.condition) {
        continue;
      }
      if (unlockedIds.includes(badge.id)) {
        continue;
      }
      if (badge.condition(context)) {
        // Déverrouiller le badge
        await setBadgeUnlocked(badge.id, context);
        // Afficher le badge dans le panneau des badges
        renderBadge(badge);
      }
    }
  } catch (err) {
    console.error('Erreur lors de la vérification des badges :', err);
    showNetworkError('Impossible de charger les badges.');
  }

  // Afficher le toast de fin de jeu avec horodatage
  showCompletionToast();

  // Afficher le bouton de redémarrage
  restartGameBtnEl.classList.remove('hidden');
}

/* -------------------------------------------------------------------------- */
/*  Affiche un badge nouvellement déverrouillé dans la liste des badges.         */
/* -------------------------------------------------------------------------- */
function renderBadge(badge) {
  const li = document.createElement('li');
  li.innerHTML = `
    <span role="img" aria-label="${badge.name}" aria-hidden="true">${badge.icon}</span>
    <div>
      <strong>${badge.name}</strong>
      <p>${badge.description}</p>
    </div>
  `;
  badgesListEl.appendChild(li);
}

/* -------------------------------------------------------------------------- */
/*  Affiche un toast de notification avec l’horodatage de fin de jeu.          */
/* -------------------------------------------------------------------------- */
function showCompletionToast() {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.textContent = `Jeu terminé ! Score : ${gameState.score}, Horodatage : ${new Date().toLocaleString()}`;
  document.body.appendChild(toast);
  // Supprimer le toast après 3 secondes
  setTimeout(() => toast.remove(), 3000);
}

/* -------------------------------------------------------------------------- */
/*  Initialisation – lie les événements une fois le DOM prêt.                  */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  startGameBtnEl.addEventListener('click', startGame);
  restartGameBtnEl.addEventListener('click', resetGame);
  gameAreaEl.addEventListener('click', handleTargetClick);
});

/* -------------------------------------------------------------------------- */
/*  Exports – rendent les fonctions accessibles aux autres modules si nécessaire. */
/* -------------------------------------------------------------------------- */
export { startGame, resetGame, handleTargetClick, endGame };