"use strict";

/**
 * YouthPulse – Main Orchestrator
 * Module ES, vanilla JS. Gère le routage, l'initialisation des modules,
 * l'enregistrement du Service Worker et la liaison des événements UI.
 */

import * as Game from './game.js';
import * as Badges from './badges.js';
import * as Leaderboard from './leaderboard.js';
import * as Share from './share.js';
import * as Data from './data.js';
import * as Utils from './utils.js';
import * as DB from './db.js';

// Liste des sections pour la navigation
const SECTIONS = ['home', 'game', 'badges', 'leaderboard', 'videos', 'memes', 'share'];

/**
 * Initialisation globale de l'application
 */
async function init() {
  try {
    // 1. Enregistrement du Service Worker pour le mode hors-ligne
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn("Service Worker non enregistré :", err);
      });
    }

    // 2. Initialisation de la base de données
    await DB.openDb();

    // 3. Initialisation des modules UI
    initNavigation();
    initVideoFeed();
    initGameModule();
    initBadgesModule();
    initLeaderboardModule();
    initShareModule();

    // 4. Affichage initial
    showSection('home');

  } catch (err) {
    console.error("Erreur critique lors de l'initialisation :", err);
  }
}

/**
 * Gestion de la navigation entre les sections
 */
function initNavigation() {
  document.querySelectorAll('nav button, .nav-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target.getAttribute('data-target');
      if (target && SECTIONS.includes(target)) {
        showSection(target);
      }
    });
  });
}

function showSection(sectionId) {
  SECTIONS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === sectionId) ? 'block' : 'none';
      el.setAttribute('aria-hidden', id !== sectionId);
    }
  });
}

/**
 * Chargement du flux vidéo depuis data.js
 */
function initVideoFeed() {
  const container = document.getElementById('videoFeed');
  if (!container) return;

  container.innerHTML = Data.testimonies.map(t => `
    <div class="video-item" role="article" aria-labelledby="title-${t.id}">
      <div class="video-placeholder" aria-label="Vidéo de ${t.author}">▶</div>
      <h3 id="title-${t.id}">${t.author}</h3>
      <p>« ${t.quote} »</p>
      <small>${t.context}</small>
    </div>
  `).join('');
}

/**
 * Initialisation du module de jeu
 */
function initGameModule() {
  const startBtn = document.getElementById('startGameBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      showSection('game');
      // Appel générique à l'initialisation du jeu
      if (typeof Game.init === 'function') {
        Game.init();
      }
    });
  }
}

/**
 * Initialisation des badges
 */
function initBadgesModule() {
  if (typeof Badges.render === 'function') {
    Badges.render(document.getElementById('badgesList'));
  }
}

/**
 * Initialisation du tableau des leaders
 */
function initLeaderboardModule() {
  if (typeof Leaderboard.render === 'function') {
    Leaderboard.render(document.getElementById('leaderboardList'));
  }
}

/**
 * Initialisation du partage
 */
function initShareModule() {
  const shareBtn = document.getElementById('shareMemeBtn');
  if (shareBtn && typeof Share.init === 'function') {
    Share.init();
  }
}

/**
 * Gestion globale des erreurs
 */
window.addEventListener('error', (event) => {
  console.error("Erreur non capturée :", event.message);
  const offlineEl = document.getElementById('offline');
  if (offlineEl) {
    offlineEl.textContent = "Une erreur est survenue. Veuillez rafraîchir la page.";
    offlineEl.style.display = 'block';
  }
});

// Lancement de l'application
document.addEventListener('DOMContentLoaded', init);