"use strict";

import { data } from "./data.js";
import { initGame, resetGame } from "./game.js";
import { renderBadges } from "./badges.js";
import { renderLeaderboard } from "./leaderboard.js";
import { initMemeEditor } from "./share.js";
import { showNetworkError } from "./utils.js";
import * as db from "./db.js";

const sections = ["home", "game", "badges", "leaderboard", "videos", "memes", "share"];

function showSection(sectionId) {
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = id === sectionId ? "block" : "none";
    }
  });
}

function initVideoFeed() {
  const feed = document.getElementById("videoFeed");
  if (!feed) return;
  feed.innerHTML = "";
  data.testimonies.forEach((t) => {
    const article = document.createElement("article");
    article.className = "video-card";
    article.innerHTML = `
      <h3>${t.author}</h3>
      <p>“${t.quote}”</p>
      <small>${t.context}</small>
    `;
    feed.appendChild(article);
  });
}

async function init() {
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service Worker non enregistré :", err);
      });
    }

    window.addEventListener("offline", () => {
      const offlineEl = document.getElementById("offline");
      if (offlineEl) offlineEl.style.display = "block";
    });
    window.addEventListener("online", () => {
      const offlineEl = document.getElementById("offline");
      if (offlineEl) offlineEl.style.display = "none";
    });

    initVideoFeed();
    initMemeEditor();

    document.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target.getAttribute("data-nav");
        showSection(target);
        if (target === "badges") renderBadges();
        if (target === "leaderboard") renderLeaderboard();
      });
    });

    const startGameBtn = document.getElementById("startGameBtn");
    if (startGameBtn) {
      startGameBtn.addEventListener("click", () => {
        showSection("game");
        initGame();
      });
    }

    const restartGameBtn = document.getElementById("restartGameBtn");
    if (restartGameBtn) {
      restartGameBtn.addEventListener("click", () => {
        resetGame();
      });
    }

    showSection("home");
  } catch (err) {
    console.error("Erreur lors de l’initialisation de l’application :", err);
    showNetworkError("Une erreur est survenue au chargement de l’application.");
  }
}

document.addEventListener("DOMContentLoaded", init);

export { showSection };