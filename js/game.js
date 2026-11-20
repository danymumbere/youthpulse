"use strict";

// ---------------------------------------------------------------------------
// YouthPulse – Mini-Game Logic Module
// ES module, vanilla JS. Handles game mechanics, scoring, badge unlocking.
// ---------------------------------------------------------------------------

import { BADGES_CATALOG } from './badges.js';
import { updateLeaderboard } from './leaderboard.js';
import { showToast } from './ui.js';
import { saveGameResult } from './db.js';

// Game configuration
const GAME_DURATION = 180; // 3 minutes in seconds
const POINTS_PER_ACTION = 10;

// Game state
let gameStartTime;
let gameInterval;
let score = 0;
let actionsCompleted = 0;

// Initialize game
export function initGame() {
  const launchButton = document.getElementById('launch-game');
  launchButton.addEventListener('click', startGame);
}

// Start game sequence
function startGame() {
  resetGameState();
  showGameScreen();
  startGameTimer();
  startGameLoop();
}

// Reset all game variables
function resetGameState() {
  gameStartTime = Date.now();
  score = 0;
  actionsCompleted = 0;
  clearInterval(gameInterval);
}

// Show the game canvas and hide other elements
function showGameScreen() {
  const gameSection = document.getElementById('game');
  gameSection.style.display = 'block';

  // Create game elements dynamically (since IDs were missing)
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.innerHTML = `
    <canvas id="gameCanvas" width="300" height="300"></canvas>
    <div id="game-hud">
      <div id="timer">3:00</div>
      <div id="score">0</div>
    </div>
  `;
  gameSection.appendChild(gameContainer);

  // Initialize game canvas
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add event listeners
  canvas.addEventListener('click', handleGameAction);
}

// Start the game timer
function startGameTimer() {
  let remainingTime = GAME_DURATION;
  const timerElement = document.getElementById('timer');

  gameInterval = setInterval(() => {
    remainingTime--;
    timerElement.textContent = formatTime(remainingTime);

    if (remainingTime <= 0) {
      endGame();
    }
  }, 1000);
}

// Format time in MM:SS format
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Handle player actions (canvas clicks)
function handleGameAction() {
  actionsCompleted++;
  score += POINTS_PER_ACTION;
  updateScoreDisplay();

  // Simple visual feedback
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff0';
  ctx.beginPath();
  ctx.arc(
    Math.random() * canvas.width,
    Math.random() * canvas.height,
    20,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// Update the score display
function updateScoreDisplay() {
  const scoreElement = document.getElementById('score');
  scoreElement.textContent = score;
}

// End the game and process results
function endGame() {
  clearInterval(gameInterval);

  const durationSec = Math.floor((Date.now() - gameStartTime) / 1000);
  const gameResult = {
    score,
    durationSec,
    gameCompleted: true,
    actionsCompleted
  };

  processBadges(gameResult);
  updateLeaderboard(gameResult);
  saveGameResult(gameResult);
  showCompletionToast(gameResult);
}

// Check badge conditions and unlock if met
function processBadges(gameResult) {
  BADGES_CATALOG.forEach(badge => {
    if (badge.condition && badge.condition(gameResult)) {
      unlockBadge(badge.id);
    }
  });
}

// Unlock a badge (implementation in badges.js)
function unlockBadge(badgeId) {
  // This function should be implemented in badges.js
  // Example: badgesAPI.unlockBadge(badgeId);
}

// Show completion toast with timestamp
function showCompletionToast(result) {
  const timestamp = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  showToast(`Jeu terminé à ${timestamp} ! Score : ${result.score}`);

  // Cleanup game UI
  const gameSection = document.getElementById('game');
  gameSection.style.display = 'none';
  gameSection.innerHTML = ''; // Clear dynamically created elements
}