/**
 * YouthPulse – Main Orchestrator
 * ES Module, Vanilla JS.
 * Handles routing, initialization, data binding, and global event management.
 */

import { data } from './data.js';
import * as game from './game.js';
import * as badges from './badges.js';
import * as leaderboard from './leaderboard.js';
import * as share from './share.js';
import * as utils from './utils.js';
import * as db from './db.js';

const APP_SECTIONS = [
  'home', 'game', 'badges', 'leaderboard', 'videos', 
  'memes', 'share', 'settings', 'offline'
];

/**
 * Navigation controller
 */
const navigate = (sectionId) => {
  APP_SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === sectionId) ? 'block' : 'none';
    }
  });
  window.scrollTo(0, 0);
};

/**
 * Initialize UI with real data
 */
const initUI = () => {
  // Populate Videos
  const videoList = document.getElementById('videoList');
  if (videoList) {
    videoList.innerHTML = data.testimonies.map((t) => `
      <div class="video-card" role="article">
        <p class="quote">« ${t.quote} »</p>
        <p class="author"><strong>${t.author}</strong></p>
        <p class="context">${t.context}</p>
      </div>
    `).join('');
  }

  // Setup Meme Preview
  const memeImageInput = document.getElementById('memeImageInput');
  const topTextInput = document.getElementById('topTextInput');
  const bottomTextInput = document.getElementById('bottomTextInput');
  const memeCanvas = document.getElementById('memeCanvas');

  const updateMemePreview = () => {
    const ctx = memeCanvas.getContext('2d');
    const img = new Image();
    img.src = memeImageInput.value;
    img.onload = () => {
      ctx.clearRect(0, 0, memeCanvas.width, memeCanvas.height);
      ctx.drawImage(img, 0, 0, memeCanvas.width, memeCanvas.height);
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(topTextInput.value.toUpperCase(), memeCanvas.width / 2, 40);
      ctx.fillText(topTextInput.value.toUpperCase(), memeCanvas.width / 2, 40);
      ctx.strokeText(bottomTextInput.value.toUpperCase(), memeCanvas.width / 2, memeCanvas.height - 20);
      ctx.fillText(bottomTextInput.value.toUpperCase(), memeCanvas.width / 2, memeCanvas.height - 20);
    };
  };

  [topTextInput, bottomTextInput, memeImageInput].forEach(el => {
    el.addEventListener('input', updateMemePreview);
  });
};

/**
 * Main Application Initialization
 */
const init = async () => {
  try {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
    }

    // 2. UI Setup
    initUI();
    navigate('home');

    // 3. Event Listeners
    document.getElementById('launchGameBtn').addEventListener('click', () => {
      navigate('game');
      game.start();
    });

    document.getElementById('restartGameBtn').addEventListener('click', () => {
      game.start();
    });

    document.getElementById('exportDataBtn').addEventListener('click', async () => {
      const jsonData = await db.exportData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'youthpulse_data.json';
      a.click();
    });

    // Navigation Links (Delegation)
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-nav]')) {
        navigate(e.target.getAttribute('data-nav'));
      }
    });

    // Offline Handling
    window.addEventListener('offline', () => {
      navigate('offline');
    });

    window.addEventListener('online', () => {
      navigate('home');
    });

    // Initialize Modules
    await badges.init();
    await leaderboard.init();

  } catch (error) {
    console.error('Application initialization failed:', error);
    utils.showNetworkError('Une erreur est survenue lors du chargement de l’application.');
  }
};

// Start App
document.addEventListener('DOMContentLoaded', init);

export { navigate };