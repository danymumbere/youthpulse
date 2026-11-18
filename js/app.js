// js/app.js
// YouthPulse – Main orchestrator (ES‑module, vanilla JS)
// Responsibilities : service‑worker registration, navigation, UI initialisation,
// global error handling and fallback UI for network errors.

"use strict";

import { data } from "./data.js";
import { exportData, importData } from "./db.js";
import {
  getUnlockedBadgeIds,
  renderBadges,
  // checkAndUnlockBadges is imported for side‑effects in other modules
  // but not used directly here.
} from "./badges.js";
import { initGame, startGame, resetGame } from "./game.js";
import { initLeaderboard, renderLeaderboard } from "./leaderboard.js";
import { initShare } from "./share.js";

/**
 * Simple UI fallback for network‑related errors.
 * The function is defined locally to avoid a dependency on utils.js
 * (which does not export a `showToast` function in the current build).
 */
function showNetworkError(message) {
  console.error(message);
  // Utilise un toast minimal si l’élément existe, sinon un alert.
  const toast = document.getElementById("gameToast");
  if (toast) {
    toast.textContent = message;
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 4000);
  } else {
    alert(message);
  }
}

/* -------------------------------------------------------------------------- */
/*  Application initialisation                                                */
/* -------------------------------------------------------------------------- */
async function initApp() {
  try {
    // Service‑worker registration (ultra‑light static hosting)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("./sw.js")
        .catch((err) => console.error("Service Worker registration failed:", err));
    }

    // Render static sections with embedded content
    renderHomeContent();
    renderVideosContent();
    renderMemesContent();
    renderSettingsContent();

    // Initialise functional modules
    initGameModule();
    initBadgesModule();
    initLeaderboardModule();
    initShareModule();

    // Navigation & global error handling
    initNavigation();
    initGlobalErrors();

    console.log("YouthPulse initialisé avec succès.");
  } catch (err) {
    console.error("Erreur lors de l'initialisation de l'application :", err);
    showNetworkError("Une erreur est survenue lors du chargement de l'application.");
  }
}

/* -------------------------------------------------------------------------- */
/*  Section renderers (static content)                                        */
/* -------------------------------------------------------------------------- */
function renderHomeContent() {
  const homeTitle = document.getElementById("homeTitle");
  if (homeTitle) homeTitle.textContent = "Bienvenue sur YouthPulse";
}

function renderVideosContent() {
  const videosTitle = document.getElementById("videosTitle");
  const videoList = document.getElementById("videoList");

  if (videosTitle) videosTitle.textContent = "Témoignages de Kinshasa";

  if (videoList && data.testimonies) {
    videoList.innerHTML = "";
    data.testimonies.forEach((t) => {
      const item = document.createElement("div");
      item.className = "video-item";
      item.innerHTML = `
        <p class="testimony-quote">« ${t.quote} »</p>
        <p class="testimony-author"><strong>${t.author}</strong></p>
        <p class="testimony-context">${t.context}</p>
      `;
      videoList.appendChild(item);
    });
  }
}

function renderMemesContent() {
  const memesTitle = document.getElementById("memesTitle");
  if (memesTitle) memesTitle.textContent = "Générateur de mèmes";
}

function renderSettingsContent() {
  const settingsTitle = document.getElementById("settingsTitle");
  const exportBtn = document.getElementById("exportDataBtn");
  const importBtn = document.getElementById("importDataBtn");
  const importInput = document.getElementById("importDataInput");

  if (settingsTitle) settingsTitle.textContent = "Paramètres et données";

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

/* -------------------------------------------------------------------------- */
/*  Module initialisation helpers                                            */
/* -------------------------------------------------------------------------- */
function initGameModule() {
  const launchBtn = document.getElementById("launchGameBtn");
  const restartBtn = document.getElementById("restartGameBtn");
  const gameTitle = document.getElementById("gameTitle");

  if (gameTitle) gameTitle.textContent = "Mini‑jeu instantané";

  initGame();

  if (launchBtn) launchBtn.addEventListener("click", () => startGame());
  if (restartBtn) restartBtn.addEventListener("click", () => resetGame());
}

function initBadgesModule() {
  const badgesTitle = document.getElementById("badgesTitle");
  if (badgesTitle) badgesTitle.textContent = "Vos badges";

  // Le rendu dépend des badges déjà débloqués dans IndexedDB
  renderBadges();
}

function initLeaderboardModule() {
  const leaderboardTitle = document.getElementById("leaderboardTitle");
  const leaderboardDesc = document.getElementById("leaderboardDesc");

  if (leaderboardTitle) leaderboardTitle.textContent = "Tableau des scores";
  if (leaderboardDesc) leaderboardDesc.textContent = "Classement local basé sur vos performances.";

  initLeaderboard();
  renderLeaderboard();
function initShareModule() {
  const shareTitle = document.getElementById("shareTitle");
  if (shareTitle) shareTitle.textContent = "Partager l’application";

  initShare();
}

/* -------------------------------------------------------------------------- */
/*  Navigation (hash‑based, mobile‑first)                                    */
/* -------------------------------------------------------------------------- */
function initNavigation() {}