"use strict";

import { data } from './data.js';
import { initGame, resetGame } from './game.js';
import { renderBadges } from './badges.js';
import { renderLeaderboard } from './leaderboard.js';
import { initMemeEditor } from './share.js';
import { showNetworkError } from './utils.js';
import * as db from './db.js';

/**
 * YouthPulse – Main Orchestrator
 * Gère le routage, l’initialisation des modules et l’interface utilisateur.
 */

const sections = [
  'home', 'game', 'badges', 'leaderboard', 'videos', 'memes', 'share'
];

/**
 * Affiche une section spécifique et masque les autres.
 */
function showSection(sectionId) {
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === sectionId) ? 'block' : 'none';
    }
  });
}

/**
 * Initialise le flux vidéo avec les données réelles.
 */
function initVideoFeed() {
  const feed = document.getElementById('videoFeed');
  if (!feed) return;

  feed.innerHTML = '';
  data.testimonies.forEach((t) => {
    const article = document.createElement('article');
    article.className = 'video-card';
    article.innerHTML = `
      <h3>${t.author}</h3>
      <p>“${t.quote}”</p>
      <small>${t.context}</small>
    `;
    feed.appendChild(article);
  });
}

/**
 * Initialisation globale de l’application.
 */
async function init() {
  try {
    // 1. Enregistrement du Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service Worker non enregistré :', err);
      });
    }

    // 2. Gestion de l’état hors-ligne
    window.addEventListener('offline', () => {
      const offlineEl = document.getElementById('offline');
      if (offlineEl) offlineEl.style.display = 'block';
    });
    window.addEventListener('online', () => {
      const offlineEl = document.getElementById('offline');
      if (offlineEl) offlineEl.style.display = 'none';
    });

    // 3. Initialisation des modules
    initVideoFeed();
    initMemeEditor();
    
    // 4. Écouteurs d’événements de navigation
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-nav');
        showSection(target);
        if (target === 'badges') renderBadges();
        if (target === 'leaderboard') renderLeaderboard();
      });
    });

    // 5. Initialisation du jeu
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
      startGameBtn.addEventListener('click', () => {
        showSection('game');
        initGame();
      });
    }

    const restartGameBtn = document.getElementById('restartGameBtn');
    if (restartGameBtn) {
      restartGameBtn.addEventListener('click', () => {
        resetGame();
      });
    }

    // 6. Initialisation par défaut
    showSection('home');

  } catch (err) {
    console.error('Erreur lors de l’initialisation de l’application :', err);
    showNetworkError('Une erreur est survenue au chargement de l’application.');
  }
}

// Lancement de l’application
document.addEventListener('DOMContentLoaded', init);

// Export pour usage global si nécessaire
export { showSection };