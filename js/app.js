// js/app.js
"use strict";

import { BADGES_CATALOG } from './badges.js';
import { startGame, onGameComplete } from './game.js'; // guess
import { shareMeme } from './share.js';
import { data } from './data.js';
import { showNetworkError } from './utils.js';
import * as db from './db.js';

// State
const state = {
  unlockedBadgeIds: [],
  score: 0,
  sharesCount: 0,
  playerName: null,
};

// Initialize
async function init() {
  try {
    // Load persisted state
    state.score = await db.getScore();
    state.unlockedBadgeIds = await db.getUnlockedBadgeIds();
    state.playerName = localStorage.getItem('youthpulse_playerName') || 'Joueur';
    // Load shares count from localStorage
    state.sharesCount = parseInt(localStorage.getItem('youthpulse_sharesCount') || '0', 10);

    // Setup routing
    document.addEventListener('hashchange', handleHashChange);
    // Initial navigation
    handleHashChange();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registered', reg))
        .catch(err => {
          console.error('SW registration failed:', err);
          // Show offline page maybe
          showOfflinePage();
        });
    }

    // Show home page initially
    showSection('home');
  } catch (err) {
    console.error('Init error:', err);
    showNetworkError('Impossible de charger l’application.');
  }
}

// Hash change handler
function handleHashChange() {
  const hash = location.hash || '#/home';
  // Hide all sections
  document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
  switch (hash) {
    case '#/home':
      showSection('home');
      renderHome();
      break;
    case '#/game':
      showSection('game');
      renderGame();
      break;
    case '#/badges':
      showSection('badges');
      renderBadges();
      break;
    case '#/leaderboard':
      showSection('leaderboard');
      renderLeaderboard();
      break;
    case '#/videos':
      showSection('videos');
      renderVideos();
      break;
    case '#/memes':
      showSection('memes');
      renderMemes();
      break;
    case '#/share':
      showSection('share');
      renderShare();
      break;
    case '#/offline':
      showSection('offline');
      break;
    default:
      showSection('offline');
  }
}

// Section helpers
function showSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('hidden');
  }
}

// Home rendering
function renderHome() {
  // Display player name and score
  const home = document.getElementById('home');
  // We can add dynamic content, but not required.
  // Add a button to start game if not already there
  const startBtn = document.getElementById('startGameBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      location.hash = '#/game';
    });
  }

  // Export data button (optional)
  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Exporter les données';
  exportBtn.className = 'secondary';
  exportBtn.setAttribute('aria-label', 'Exporter les données de l’application');
  exportBtn.addEventListener('click', exportData);
  // Append to home section (or maybe a settings area)
  home.appendChild(exportBtn);
}

// Game rendering and logic
async function renderGame() {
  const gameSection = document.getElementById('game');
  const startBtn = document.getElementById('startGameBtn');
  const restartBtn = document.getElementById('restartGameBtn');
  const promptEl = document.getElementById('gamePrompt');
  const areaEl = document.getElementById('gameArea');

  // Hide start button, show restart
  if (startBtn) startBtn.classList.add('hidden');
  if (restartBtn) restartBtn.classList.remove('hidden');

  // Start the game (client‑side)
  try {
    const gameCtx = await startGame(); // expects to return context after completion
    // Game completed
    showCompletionToast(gameCtx);
    // Update score
    state.score = gameCtx.score || 0;
    await db.setScore(state.score);
    // Add to leaderboard
    if (!state.playerName) {
      state.playerName = window.prompt('Entrez votre nom pour le tableau des leaders:') || 'Joueur';
      localStorage.setItem('youthpulse_playerName', state.playerName);
    }
    await db.addLeaderboardEntry(state.playerName, state.score);
    // Check badges
    await checkAndUnlockBadges(gameCtx);
    // Refresh badges panel if visible
    if (location.hash === '#/badges') {
      renderBadges();
    }
    // Return to home
    location.hash = '#/home';
  } catch (err) {
    console.error('Game error:', err);
    showNetworkError('Une erreur est survenue pendant le jeu.');
  }
}

// Completion toast
function showCompletionToast(ctx) {
  const ts = new Date().toLocaleString();
  const msg = `Jeu terminé à ${ts} – Score : ${ctx.score}, Durée : ${ctx.durationSec}s`;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
function showCompletionToast(ctx) {
  const ts = new Date().toLocaleString();
  const msg = `Jeu terminé à ${ts} – Score : ${ctx.score}, Durée : ${ctx.durationSec}s`;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.textContent = msg;
  const container = document.getElementById('toastContainer') || document.body;
  container.appendChild(toast);
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.textContent = msg;
  const container = document.getElementById('toastContainer') || document.body;
  container.appendChild(toast);
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}