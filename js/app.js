// js/app.js
"use strict";

import { data } from "./data.js";
import { getScore, setScore, exportData, importData } from "./db.js";
import { getUnlockedBadgeIds, checkAndUnlockBadges, renderBadges } from "./badges.js";
import { initGame, startGame, resetGame } from "./game.js";
import { initLeaderboard, renderLeaderboard } from "./leaderboard.js";
import { initShare } from "./share.js";
import { showNetworkError } from "./utils.js";

async function initApp() {
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
    }

    renderHomeContent();
    renderVideosContent();
    renderMemesContent();
    renderSettingsContent();

    initGameModule();
    initBadgesModule();
    initLeaderboardModule();
    initShareModule();
    initNavigation();
    initGlobalErrors();

    console.log("YouthPulse initialisé avec succès.");
  } catch (err) {
    console.error("Erreur lors de l'initialisation de l'application :", err);
    showNetworkError("Une erreur est survenue lors du chargement de l'application.");
  }
}

function renderHomeContent() {
  const homeTitle = document.getElementById("homeTitle");
  if (homeTitle) {
    homeTitle.textContent = "Bienvenue sur YouthPulse";
  }
}

function renderVideosContent() {
  const videosTitle = document.getElementById("videosTitle");
  const videoList = document.getElementById("videoList");
  if (videosTitle) {
    videosTitle.textContent = "Témoignages de Kinshasa";
  }
  if (videoList && data.testimonies) {
    videoList.innerHTML = "";
    data.testimonies.forEach((testimony) => {
      const item = document.createElement("div");
      item.className = "video-item";
      item.innerHTML = `
        <p class="testimony-quote">« ${testimony.quote} »</p>
        <p class="testimony-author"><strong>${testimony.author}</strong></p>
        <p class="testimony-context">${testimony.context}</p>
      `;
      videoList.appendChild(item);
    });
  }
}

function renderMemesContent() {
  const memesTitle = document.getElementById("memesTitle");
  if (memesTitle) {
    memesTitle.textContent = "Générateur de mèmes";
  }
}

function renderSettingsContent() {
  const settingsTitle = document.getElementById("settingsTitle");
  const exportBtn = document.getElementById("exportDataBtn");
  const importBtn = document.getElementById("importDataBtn");
  const importInput = document.getElementById("importDataInput");

  if (settingsTitle) {
    settingsTitle.textContent = "Paramètres et données";
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        const jsonString = await exportData();
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "youthpulse_data.json";
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Erreur lors de l'exportation :", err);
        showNetworkError("Impossible d'exporter les données.");
      }
    });
  }

  if (importBtn && importInput) {
    importBtn.addEventListener("click", async () => {
      const file = importInput.files[0];
      if (!file) {
        showNetworkError("Veuillez sélectionner un fichier JSON à importer.");
        return;
      }
      try {
        const text = await file.text();
        await importData(text);
        alert("Données importées avec succès !");
        window.location.reload();
      } catch (err) {
        console.error("Erreur lors de l'importation :", err);
        showNetworkError("Fichier de données invalide.");
      }
    });
  }
}

function initGameModule() {
  const launchBtn = document.getElementById("launchGameBtn");
  const restartBtn = document.getElementById("restartGameBtn");
  const gameTitle = document.getElementById("gameTitle");

  if (gameTitle) {
    gameTitle.textContent = "Mini-jeu instantané";
  }

  initGame();

  if (launchBtn) {
    launchBtn.addEventListener("click", () => {
      startGame();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      resetGame();
    });
  }
}

function initBadgesModule() {
  const badgesTitle = document.getElementById("badgesTitle");
  if (badgesTitle) {
    badgesTitle.textContent = "Vos badges";
  }
  renderBadges();
}

function initLeaderboardModule() {
  const leaderboardTitle = document.getElementById("leaderboardTitle");
  const leaderboardDesc = document.getElementById("leaderboardDesc");
  if (leaderboardTitle) {
    leaderboardTitle.textContent = "Tableau des scores";
  }
  if (leaderboardDesc) {
    leaderboardDesc.textContent = "Classement local basé sur vos performances.";
  }
  initLeaderboard();
  renderLeaderboard();
}

function initShareModule() {
  const shareTitle = document.getElementById("shareTitle");
  if (shareTitle) {
    shareTitle.textContent = "Partager l'application";
  }
  initShare();
}

function initNavigation() {
  const sections = ["home", "game", "badges", "leaderboard", "videos", "memes", "share", "settings", "offline"];
  
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace("#", "") || "home";
    sections.forEach((secId) => {
      const el = document.getElementById(secId);
      if (el) {
        if (secId === hash) {
          el.style.display = "block";
        } else {
          el.style.display = "none";
        }
      }
    });
  });

  const currentHash = window.location.hash.replace("#", "") || "home";
  sections.forEach((secId) => {
    const el = document.getElementById(secId);
    if (el) {
      if (secId === currentHash) {
        el.style.display = "block";
      } else {
        el.style.display = "none";
      }
    }
  });
}

function initGlobalErrors() {
  window.addEventListener("error", (event) => {
    console.error("Erreur globale capturée :", event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("Promesse rejetée non gérée :", event.reason);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});