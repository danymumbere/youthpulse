"use strict";

import { BADGES_CATALOG } from './badges.js';
import { startGame, onGameComplete } from './game.js';
import { shareMeme } from './share.js';
import { data } from './data.js';
import { showNetworkError } from './utils.js';
import * as db from './db.js';

// Application state
const state = {
  unlockedBadgeIds: [],
  score: 0,
  sharesCount: 0,
  playerName: null,
};

// Initialize the app
async function init() {
  try {
    // Load persisted state
    state.score = await db.getScore();
    state.unlockedBadgeIds = await db.getUnlockedBadgeIds();
    state.playerName = localStorage.getItem('youthpulse_playerName') || 'Joueur';
    state.sharesCount = parseInt(localStorage.getItem('youthpulse_sharesCount') || '0', 10);

    // Setup routing
    document.addEventListener('hashchange', handleHashChange);
    // Initial navigation
    handleHashChange();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        probably .then(reg => console.log('SW registered', reg))
        .catch(err => {
          console.error('SW registration failed:', err);
          showSection('offline');
        });
    }

    // Show home page initially
    showSection('home');
  } catch (err) {
    console.error('Init error:', err);
    showNetworkError('Impossible de charger l’application.');
  }
}

// Hash change handler for client‑side navigation
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

// Show a section by its ID
function showSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('hidden');
  }
}

// Home page rendering
function renderHome() {
  // Ensure start button exists
  const startBtn = document.getElementById('startGameBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      location.hash = '#/game';
    });
  }

  // Optional export data button (could be moved to settings)
  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Exporter les données';
  exportBtn.className = 'secondary';
  exportBtn.setAttribute('aria-label', 'Exporter les données de l’application');
  exportBtn.addEventListener('click', exportData);
  // Append to home section if not already present
  const home = document.getElementById('home');
  if (home && !home.querySelector('button.secondary')) {
    home.appendChild(exportBtn);
  }
}

// Game page rendering and execution
async function renderGame() {
  const startBtn = document.getElementById('startGameBtn');
  const restartBtn = document.getElementById('restartGameBtn');
  const promptEl = document.getElementById('gamePrompt');
  const areaEl = document.getElementById('gameArea');

  // Hide start, show restart
  if (startBtn) startBtn.classList.add('hidden');
  if (restartBtn) restartBtn.classList.remove('hidden');

  try {
    // Launch the client‑side mini‑game
    const gameCtx = await startGame();
    // Show completion toast with timestamp
    showCompletionToast(gameCtx);
    // Update score
    state.score = gameCtx.score || 0;
    await db.setScore(state.score);
    // Ensure player name for leaderboard
    if (!state.playerName) {
      state.playerName = window.prompt('Entrez votre nom pour le tableau des leaders:') || 'Joueur';
      localStorage.setItem('youthpulse_playerName', state.playerName);
    }
    await db.addLeaderboardEntry(state.playerName, state.score);
    // Check and unlock badges based on game context
    await checkAndUnlockBadges(gameCtx);
    // Refresh badges panel if visible
    if (location.hash === '#/badges') {
      renderBadges();
    }
    // Return to home after a brief delay
    setTimeout(() => {
      location.hash = '#/home';
    }, 1500);
  } catch (err) {
    console.error('Game error:', err);
    showNetworkError('Une erreur est survenue pendant le jeu.');
  }
}

// Display a completion toast notification
function showCompletionToast(ctx) {
  const ts = new Date().toLocaleString();
  const msg = `Jeu terminé à ${ts} – Score : ${ctx.score}, Durée : ${ctx.durationSec}s`;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.textContent = msg;
  // Use existing toast container or body
  const container = document.getElementById('toastContainer') || document.body;
  container.appendChild(toast);
  // Remove after 3 seconds with fade out
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

// Badge rendering
function renderBadges() {
  const listEl = document.getElementById('badgesList');
  if (!listEl) return;
  listEl.innerHTML = '';
  BADGES_CATALOG.forEach(badge => {
    const unlocked = state.unlockedBadgeIds.includes(badge.id);
    const item = document.createElement('div');
    item.className = `badge ${unlocked ? 'unlocked' : 'locked'}`;
    item.innerHTML = `
      <span class="icon">${badge.icon}</span>
      <div class="info">
        <h3>${badge.name}</h3>
        <p>${badge.description}</p>
      </div>
    `;
    listEl.appendChild(item);
  });
}

// Leaderboard rendering
async function renderLeaderboard() {
  const listEl = document.getElementById('leaderboardList');
  if (!listEl) return;
  const entries = await db.getLeaderboardEntries();
  listEl.innerHTML = '';
  entries.forEach((entry, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank">${idx + 1}</span>
      <span class="name">${entry.name}</span>
      <span class="score">${entry.score}</span>
    `;
    listEl.appendChild(li);
  });
}

// Videos page rendering
function renderVideos() {
  const feedEl = document.getElementById('videoFeed');
  if (!feedEl) return;
  feedEl.innerHTML = '';
  data.testimonies.forEach(item => {
    const card = document.createElement('div');
    card.className = 'video-card';
    // Use a placeholder poster; video source is a local asset (assumed to exist)
    card.innerHTML = `
      <video poster="img/placeholder.jpg" controls preload="none">
        <source src="videos/${item.id}.mp4" type="video/mp4">
        Your browser does not support video.
      </video>
      <div class="caption">
        <p class="quote">“${item.quote}”</p>
        <p class="author">${item.author}</p>
        <p class="context">${item.context}</p>
      </div>
    `;
    feedEl.appendChild(card);
  });
}

// Meme editor page rendering
function renderMemes() {
  const editorEl = document.getElementById('memeEditor');
  if (!editorEl) return;
  editorEl.innerHTML = '';
  // Template selector
  const templateSelect = document.createElement('select');
  templateSelect.className = 'meme-template';
  data.memeTemplates.forEach(tmpl => {
    const opt = document.createElement('option');
    opt.value = tmpl.id;
    opt.textContent = tmpl.id;
    templateSelect.appendChild(opt);
  });
  editorEl.appendChild(templateSelect);

  // Text inputs
  const topInput = Object.assign(document.createElement('input'), {
    type: 'text',
    className: 'meme-top',
    placeholder: 'Texte supérieur',
  });
  const bottomInput = Object.assign(document.createElement('input'), {
    type: 'text',
    className: 'meme-bottom',
    placeholder: 'Texte inférieur',
  });

  // Preview canvas (using CSS background for simplicity)
  const preview = document.createElement('div');
  preview.className = 'meme-preview';
  preview.style.backgroundImage = `url('img/meme1.jpg')`; // default

  // Update preview when inputs or selection change
  const updatePreview = () => {
    const selectedId = templateSelect.value;
    const tmpl = data.memeTemplates.find(t => t.id === selectedId) || data.memeTemplates[0];
    const top = topInput.value || '';
    const bottom = bottomInput.value || '';
    // Build text overlay using CSS pseudo‑elements is tricky; we'll use a canvas for reliability
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(top, canvas.width / 2, 60);
      ctx.fillText(bottom, canvas.width / 2, canvas.height - 60);
      // Convert to data URL and set as background
      preview.style.backgroundImage = `url(${canvas.toDataURL()})`;
    };
    img.src = tmpl.image;
  };

  templateSelect.addEventListener('change', updatePreview);
  topInput.addEventListener('input', updatePreview);
  bottomInput.addEventListener('input', updatePreview);

  // Append controls
  editorEl.appendChild(templateSelect);
  editorEl.appendChild(topInput);
  editorEl.appendChild(bottomInput);
  editorEl.appendChild(preview);

  // Share button
  const shareBtn = document.createElement('button');
  shareBtn.id = 'shareMemeBtn';
  shareBtn.textContent = 'Partager le mème';
  shareBtn.addEventListener('click', async () => {
    const selectedId = templateSelect.value;
    const tmpl = data.memeTemplates.find(t => t.id === selectedId) || data.memeTemplates[0];
    const topText = topInput.value || '';
    const bottomText = bottomInput.value || '';
    await shareMeme(tmpl, topText, bottomText);
    // Increment share count
    state.sharesCount = (state.sharesCount || 0) + 1;
    localStorage.setItem('youthpulse_sharesCount', state.sharesCount.toString());
    // Refresh badges if needed
    if (location.hash === '#/badges') {
      renderBadges();
    }
  });
  editorEl.appendChild(shareBtn);
}

// Share page rendering (simple placeholder)
function renderShare() {
  const shareButtons = document.getElementById('shareButtons');
  if (!shareButtons) return;
  shareButtons.innerHTML = `
    <p>Vous pouvez aussi nous suivre sur les réseaux sociaux :</p>
    <div class="social-links">
      <a href="https://whatsapp.com" target="_blank" rel="noopener">WhatsApp</a>
      <a href="https://facebook.com" target="_blank" rel="noopener">Facebook</a>
      <a href="https://tiktok.com" target="_blank" rel="noopener">TikTok</a>
    </div>
  `;
}

// Export data to JSON file
async function exportData() {
  try {
    const json = await db.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'youthpulse-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export error:', err);
    showNetworkError('Impossible d’exporter les données.');
  }
}

// Check badge conditions and unlock if met
async function checkAndUnlockBadges(context) {
  const newlyUnlocked = [];
  BADGES_CATALOG.forEach(badge => {
    if (!state.unlockedBadgeIds.includes(badge.id) && badge.condition) {
      if (badge.condition(context)) {
        newlyUnlocked.push(badge.id);
        state.unlockedBadgeIds.push(badge.id);
        await db.setBadgeUnlocked(badge.id, context);
      }
    }
  });
  if (newlyUnlocked.length) {
    renderBadges(); // refresh UI
  }
}

// Global error handler
window.addEventListener('error', event => {
  console.error('Global error:', event.error);
  showNetworkError('Une erreur est survenue dans l’application.');
});

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);