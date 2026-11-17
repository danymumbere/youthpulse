"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Mini-Game Module                                            */
/*  ES module, vanilla JS. Handles game logic, scoring, badge unlocking.      */
/* -------------------------------------------------------------------------- */

import { BADGES_CATALOG } from "./badges.js";
import { setScore, getScore } from "./db.js";
import { showToast } from "./utils.js";

let gameStartTime = null;
let gameInterval = null;
let currentScore = 0;
let currentQuestionIndex = 0;

// Questions inspirées de la réalité de Kinshasa et du codage
const QUIZ_QUESTIONS = [
  {
    prompt: "Quel langage utilise-t-on principalement pour structurer des pages Web statiques en HTML ?",
    options: ["CSS", "HTML", "Python", "SQL"],
    correct: 1
  },
  {
    prompt: "À Kinshasa, quel secteur technologique connaît la croissance la plus rapide chez les jeunes ?",
    options: ["Le développement mobile", "L'agriculture industrielle", "L'horlogerie", "La construction navale"],
    correct: 0
  },
  {
    prompt: "Que signifie l'acronyme API en programmation ?",
    options: [
      "Application Programming Interface",
      "Advanced Program Integration",
      "Automated Protocol Interaction",
      "Application Process Index"
    ],
    correct: 0
  },
  {
    prompt: "Quel outil de stockage local est utilisé dans cette application pour fonctionner hors ligne ?",
    options: ["IndexedDB", "Cloud distant", "Disquette", "Serveur FTP"],
    correct: 0
  },
  {
    prompt: "Quel est l'objectif principal de l'application YouthPulse ?",
    options: [
      "Partager des mini-jeux, témoignages et mèmes locaux",
      "Vendre des smartphones",
      "Diffuser des films internationaux",
      "Jouer à des jeux de casino"
    ],
    correct: 0
  }
];

export function initializeGame() {
  const launchBtn = document.getElementById("launchGameBtn");
  const restartBtn = document.getElementById("restartGameBtn");

  if (launchBtn) {
    launchBtn.addEventListener("click", () => {
      startGame();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      startGame();
    });
  }
}

export function startGame() {
  gameStartTime = Date.now();
  currentScore = 0;
  currentQuestionIndex = 0;

  const gameArea = document.getElementById("gameArea");
  const gamePrompt = document.getElementById("gamePrompt");
  const gameTitle = document.getElementById("gameTitle");
  const toast = document.getElementById("gameToast");

  if (toast) {
    toast.textContent = "";
    toast.style.display = "none";
  }

  if (gameTitle) {
    gameTitle.textContent = "Défi Jeunesse Kinshasa – En cours";
  }

  renderQuestion();
}

function renderQuestion() {
  const gameArea = document.getElementById("gameArea");
  const gamePrompt = document.getElementById("gamePrompt");

  if (!gameArea || !gamePrompt) return;

  if (currentQuestionIndex >= QUIZ_QUESTIONS.length) {
    endGame();
    return;
  }

  const q = QUIZ_QUESTIONS[currentQuestionIndex];
  gamePrompt.textContent = `Question ${currentQuestionIndex + 1} sur ${QUIZ_QUESTIONS.length} : ${q.prompt}`;

  gameArea.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "game-option-btn";
    btn.textContent = opt;
    btn.style.margin = "8px 0";
    btn.style.padding = "12px";
    btn.style.width = "100%";
    btn.style.border = "1px solid var(--border-color, #ccc)";
    btn.style.borderRadius = "8px";
    btn.style.background = "var(--bg-card, #fff)";
    btn.style.cursor = "pointer";
    btn.style.textAlign = "left";

    btn.addEventListener("click", () => {
      handleAnswer(idx === q.correct);
    });

    gameArea.appendChild(btn);
  });
}

function handleAnswer(isCorrect) {
  if (isCorrect) {
    currentScore += 20;
    showToast("Bonne réponse ! +20 points.");
  } else {
    showToast("Mauvaise réponse ! Continue.");
  }

  currentQuestionIndex++;
  renderQuestion();
}

function endGame() {
  const durationSec = Math.round((Date.now() - gameStartTime) / 1000);
  const gameArea = document.getElementById("gameArea");
  const gamePrompt = document.getElementById("gamePrompt");
  const gameTitle = document.getElementById("gameTitle");
  const toast = document.getElementById("gameToast");

  if (gameTitle) {
    gameTitle.textContent = "Défi Jeunesse Kinshasa – Terminé";
  }

  if (gamePrompt) {
    gamePrompt.textContent = `Bravo ! Vous avez terminé le mini-jeu en ${durationSec} secondes avec un score de ${currentScore} points.`;
  }

  if (gameArea) {
    gameArea.innerHTML = "";
  }

  if (toast) {
    const timestamp = new Date().toLocaleTimeString();
    toast.textContent = `Jeu complété à ${timestamp} (${durationSec}s). Score : ${currentScore}`;
    toast.style.display = "block";
  }

  const context = {
    gameCompleted: true,
    durationSec: durationSec,
    score: currentScore
  };

  processBadges(context);
  updateScore(currentScore);
}

function processBadges(context) {
  BADGES_CATALOG.forEach((badge) => {
    try {
      if (badge.condition && badge.condition(context)) {
        unlockBadge(badge.id);
      }
    } catch (err) {
      console.error(`Erreur lors de l'évaluation du badge ${badge.id}:`, err);
    }
  });
}

async function unlockBadge(badgeId) {
  try {
    const badgeKey = `badge_${badgeId}`;
    if (localStorage.getItem(badgeKey) !== "true") {
      localStorage.setItem(badgeKey, "true");
      showToast(`Badge débloqué : ${badgeId} !`);
    }
  } catch (e) {
    console.error("Échec du déblocage du badge :", e);
  }
}

async function updateScore(pointsToAdd) {
  try {
    const currentStoredScore = await getScore();
    const newTotal = (currentStoredScore || 0) + pointsToAdd;
    await setScore(newTotal);
  } catch (err) {
    console.error("Erreur lors de la mise à jour du score :", err);
  }
}