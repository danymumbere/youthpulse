"use strict";

// Imports
import { BADGES_CATALOG } from './badges.js';
import {
  getScore as dbGetScore,
  setScore as dbSetScore,
  getLeaderboardEntries as dbGetLeaderboardEntries,
  addLeaderboardEntry as dbAddLeaderboardEntry,
 probably also getUnlockedBadgeIds and setBadgeUnlocked from db.js
} from './db.js';
import { startGame, stopGame, onGameComplete } from './game.js';
import { renderBadges, renderLeaderboard } from './badges.js'; // maybe badges.js exports render functions
import { renderMemeEditor, shareMeme } from './share.js';
import { data } from './data.js';
import { showNetworkError, registerSW } from './utils.js';

// State
let currentScore = 0;
let unlockedBadgeIds = [];
let gameTimer = null;
let currentView = 'home';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Register Service Worker
  try {
    await registerSW();
  } catch (e) {
    console.error('SW registration failed', e);
  }

  // Load persisted data
  currentScore = await dbGetScore() || 0;
  unlockedBadgeIds = await dbGetUnlockedBadgeIds() || [];

  // Render initial view (home)
  showView('home');

  // Attach event listeners
  attachListeners();
});

function attachListeners() {
  // Home: start game button
  const startGameBtn = document.getElementById('startGameBtn');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      showView('game');
      startGameSession();
    });
  }

  // Game: restart button
  const restartGameBtn = document.getElementById('restartGameBtn');
  if (restartGameBtn) {
    restartGameBtn.addEventListener('click', () => {
      // reset game state
      stopGameSession();
      showView('game');
      startGameSession();
    });
  }

  // Badges navigation (maybe links)
  const badgesLink = document.getElementById('badges');
  if (badgesLink) {
    badgesLink.addEventListener('click', (e) => {
      e.preventDefault();
      showView('badges');
    });
  }

  // Leaderboard navigation
  const leaderboardLink = document.getElementById('leaderboard');
  if (leaderboardLink) {
    leaderboardLink.addEventListener('click', (e) => {
      e.preventDefault();
      showView('leaderboard');
    });
  }

  // Videos navigation
  const videosLink = document.getElementById('videos');
  if (videosLink) {
    videosLink.addEventListener('click', (e) => {
      e.preventDefault();
      showView('videos');
    });
  }

  // Memes navigation
  const memesLink = document.getElementById('memes');
  if (memesLink) {
    memesLink.addEventListener('click', (e) => {
      e.preventDefault();
      showView('memes');
    });
  }

  // Share meme button
  const shareMemeBtn = document.getElementById('shareMemeBtn');
  if (shareMemeBtn) {
    shareMemeBtn.addEventListener('click', shareCurrentMeme);
  }

  // Export data button (class)
  const exportBtn = document.querySelector('.export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }

  // Offline detection
  window.addEventListener('offline', () => showView('offline'));
  window.addEventListener('online', () => showView('home'));
}