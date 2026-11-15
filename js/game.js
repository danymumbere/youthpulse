/* -------------------------------------------------------------------------- */
/*  YouthPulse – Mini‑Game Module (game.js)                                   */
/*  ES‑module, vanilla JS. Provides a 2‑3 minute “Instant Snapshot” mini‑game,   */
/*  client‑side scoring, badge unlocking, and a completion toast.             */
/* -------------------------------------------------------------------------- */

"use strict";

import { unlockBadge } from "./badges.js";
import * as utils from "./utils.js";
import { saveScore } from "./db.js";

/* -------------------------------------------------------------------------- */
/* 1. IDs (must match the static HTML)                                        */
/* -------------------------------------------------------------------------- */
const IDS = {
  HOME: "home",
  START_GAME_BTN: "startGameBtn",
  GAME: "game",
  GAME_PROMPT: "gamePrompt",
  GAME_AREA: "gameArea", // <canvas> element
  RESTART_BTN: "restartGameBtn",
  BADGES: "badges",
  BADGES_LIST: "badgesList",
  LEADERBOARD: "leaderboard",
  LEADERBOARD_LIST: "leaderboardList",
  VIDEOS: "videos",
  VIDEO_FEED: "videoFeed",
  MEMES: "memes",
  MEME_EDITOR: "memeEditor",
  SHARE_MEME_BTN: "shareMemeBtn",
  SHARE: "share",
  SHARE_BUTTONS: "shareButtons",
  OFFLINE: "offline",
};

/* -------------------------------------------------------------------------- */
/* 2. Game configuration & state                                            */
/* -------------------------------------------------------------------------- */
const GAME_DURATION_SEC = 180; // 3 minutes max
const TARGET_RADIUS = 20; // px
const SCORE_INCREMENT_MIN = 1;
const SCORE_INCREMENT_MAX = 5;

let secondsElapsed = 0;
let score = 0;
let gameActive = false;
let timerId = null;
let animationFrameId = null;
let lastTarget = { x: 0, y: 0 };

/* -------------------------------------------------------------------------- */
/* 3. Cached DOM elements                                                    */
/* -------------------------------------------------------------------------- */
const startBtn = document.getElementById(IDS.START_GAME_BTN);
const restartBtn = document.getElementById(IDS.RESTART_BTN);
const gameContainer = document.getElementById(IDS.GAME);
const gamePrompt = document.getElementById(IDS.GAME_PROMPT);
const canvas = document.getElementById(IDS.GAME_AREA);
const ctx = canvas ? canvas.getContext("2d") : null;

/* -------------------------------------------------------------------------- */
/* 4. Utility helpers                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Returns a random integer between min and max (inclusive).
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a new target position that stays fully inside the canvas.
 */
function generateTarget() {
  const maxX = canvas.width - TARGET_RADIUS * 2;
  const maxY = canvas.height - TARGET_RADIUS * 2;
  lastTarget.x = randomInt(0, maxX) + TARGET_RADIUS;
  lastTarget.y = randomInt(0, maxY) + TARGET_RADIUS;
}

/**
 * Draws the current frame: background, target, score & timer.
 */
function drawFrame() {
  if (!ctx) return;

  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw target
  ctx.fillStyle = "#e63946";
  ctx.beginPath();
  ctx.arc(lastTarget.x, lastTarget.y, TARGET_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // UI text
  ctx.fillStyle = "#333";
  ctx.font = "16px sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillText(`Temps : ${secondsElapsed}s`, 10, canvas.height - 10);
  ctx.fillText(`Score : ${score}`, canvas.width - 80, canvas.height - 10);
}

/**
 * Shows a toast that disappears after a short delay.
 */
function showCompletionToast() {
  const toast = document.createElement("div");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.style.cssText = `
    position:fixed;bottom:1rem;right:1rem;
    background:#333;color:#fff;padding:.75rem 1rem;
    border-radius:.4rem;box-shadow:0 2px 6px rgba(0,0,0,.3);
    font-size:.9rem;z-index:1000;
  `;
  const now = new Date();
  toast.textContent = `Jeu terminé ! ${now.toLocaleTimeString()}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/**
 * Persists the current score and unlocks relevant badges.
 */
async function finalizeGame() {
  // Persist score
  try {
    await saveScore({ score, durationSec: secondsElapsed, date: Date.now() });
  } catch (e) {
    utils.showNetworkError("Impossible d’enregistrer le score.");
  }

  // Unlock badges based on the final context
  const ctx = {
    gameCompleted: true,
    durationSec: secondsElapsed,
    score,
    sharesCount: 0, // updated elsewhere when a meme is shared
  };
  // Badges module decides internally which badge IDs match the condition.
  // We simply call unlockBadge for each possible badge; the module will ignore
  // those whose condition is not satisfied.
  const possibleIds = ["first_game", "speed_demon", "score_100", "perfect_run"];
  possibleIds.forEach((id) => unlockBadge(id, ctx));
}

/* -------------------------------------------------------------------------- */
/* 5. Core game flow                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Starts a new game session.
 */
function startGame() {
  if (!canvas || !ctx) {
    utils.showNetworkError("Canvas non disponible.");
    return;
  }

  // Reset state
  secondsElapsed = 0;
  score = 0;
  gameActive = true;
  generateTarget();

  // UI
  gamePrompt.style.display = "none";
  gameContainer.style.display = "block";

  // Timer (1 s granularity)
  timerId = setInterval(() => {
    secondsElapsed++;
    if (secondsElapsed >= GAME_DURATION_SEC) endGame();
  }, 1000);

  // Animation loop
  function loop() {
    if (!gameActive) return;
    drawFrame();
    animationFrameId = requestAnimationFrame(loop);
  }
  loop();
}

/**
 * Ends the current game, shows toast, unlocks badges and persists data.
 */
function endGame() {
  if (!gameActive) return;
  gameActive = false;

  // Stop timers
  clearInterval(timerId);
  cancelAnimationFrame(animationFrameId);

  // UI feedback
  showCompletionToast();

  // Persist & badge handling
  finalizeGame();

  // Reset UI after a short pause so the user can see the final frame
  setTimeout(() => {
    gameContainer.style.display = "none";
    gamePrompt.style.display = "block";
  }, 2000);
}

/**
 * Handles clicks on the canvas – awards points if the target is hit.
 */
function handleCanvasClick(event) {
  if (!gameActive) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const dx = clickX - lastTarget.x;
  const dy = clickY - lastTarget.y;
  if (dx * dx + dy * dy <= TARGET_RADIUS * TARGET_RADIUS) {
    // Hit – increase score and move target
    score += randomInt(SCORE_INCREMENT_MIN, SCORE_INCREMENT_MAX);
    generateTarget();
  }
}

/**
 * Restarts the game after a finished session.
 */
function restartGame() {
  if (gameActive) endGame(); // safety net
  startGame();
}

/* -------------------------------------------------------------------------- */
/* 6. Initialization (public)                                                */
/* -------------------------------------------------------------------------- */

/**
 * Attaches event listeners and prepares the mini‑game.
 * Should be called once from the main app entry point.
 */
function initGame() {
  if (!startBtn || !restartBtn || !canvas) {
    utils.showNetworkError("Éléments du jeu manquants dans le DOM.");
    return;
  }

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", restartGame);
  canvas.addEventListener("click", handleCanvasClick);

  // Ensure the canvas has a sensible size on mobile‑first layout
  function resizeCanvas() {
    const parent = canvas.parentElement;
    const size = Math.min(parent.clientWidth, window.innerHeight * 0.5);
    canvas.width = size;
    canvas.height = size;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
}

/* -------------------------------------------------------------------------- */
/* 7. Exported API                                                            */
/* -------------------------------------------------------------------------- */
export {
  initGame,
  startGame,
  endGame,
  restartGame,
  /** Returns the current score (read‑only). */
  () => score as getScore,
  /** Returns true while a game is running. */
  () => gameActive as isGameActive,
};