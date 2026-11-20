"use strict";

// ---------------------------------------------------------------------------
// YouthPulse – Application Orchestrator
// Gère la navigation, l'initialisation des modules, le Service Worker,
// le fallback offline et les écouteurs d’interaction.
// ---------------------------------------------------------------------------

import { initGame, startGame } from "./game.js";
import { initBadges, renderBadges } from "./badges.js";
import { initLeaderboard, renderLeaderboard } from "./leaderboard.js";
import { initShare, shareMeme, shareToApp } from "./share.js";
import { data } from "./data.js";
import { showNetworkError } from "./utils.js";
import { openDb, exportData } from "./db.js";
import { focusVisible } from "./ui.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Affiche ou masque les sections en fonction de l’identifiant ciblé.
 * @param {string} targetId – Id de la section à afficher.
 */
function showSection(targetId) {
  document.querySelectorAll("main > section").forEach((sec) => {
    sec.style.display = sec.id === targetId ? "block" : "none";
  });
}

/**
 * Crée un lien de téléchargement pour les données exportées.
 * @param {string} jsonStr – Chaîne JSON à télécharger.
 */
function triggerDownload(jsonStr) {
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "youthpulse-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Vidéos – remplissage du flux local
// ---------------------------------------------------------------------------

function populateVideoFeed() {
  const container = document.getElementById("video-container");
  if (!container) return;
  container.innerHTML = data.testimonies
    .map(
      (t) => `
    <article class="testimony">
      <video poster="img/placeholder.jpg" controls preload="metadata">
        <source src="videos/${t.id}.mp4" type="video/mp4">
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
      <h3>${t.author}</h3>
      <p>${t.context}</p>
      <blockquote>${t.quote}</blockquote>
    </article>`
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Mèmes – éditeur simple et partage
// ---------------------------------------------------------------------------

function initMemeEditor() {
  const editor = document.getElementById("meme-editor");
  if (!editor) return;

  // Canvas créé dynamiquement (sans id supplémentaire)
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 300;
  editor.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // Modèle par défaut
  let currentTemplate = data.memeTemplates[0];

  // Rendu du mème
  function renderMeme() {
    const img = new Image();
    img.src = currentTemplate.image;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";

      // Texte du haut
      ctx.fillText(currentTemplate.top, canvas.width / 2, 40);
      ctx.strokeText(currentTemplate.top, canvas.width / 2, 40);
      // Texte du bas
      ctx.fillText(currentTemplate.bottom, canvas.width / 2, canvas.height - 20);
      ctx.strokeText(currentTemplate.bottom, canvas.width / 2, canvas.height - 20);
    };
  }

  // Sélection du modèle (simple cycle au clic)
  editor.addEventListener("click", () => {
    const idx = data.memeTemplates.findIndex((t) => t.id === currentTemplate.id);
    currentTemplate = data.memeTemplates[(idx + 1) % data.memeTemplates.length];
    renderMeme();
  });

  renderMeme();

  // Bouton de partage du mème (génère un data‑URL puis utilise le Web Share API)
  const shareBtn = document.getElementById("share-meme");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        await shareMeme(dataUrl);
      } catch (e) {
        console.error(e);
        showNetworkError("Le partage du mème a échoué.");
      }
    });
  }

  // Partage via applications spécifiques
  const btnWhats = document.getElementById("share-whatsapp");
  const btnFb = document.getElementById("share-facebook");
  const btnTt = document.getElementById("share-tiktok");

  if (btnWhats) {
    btnWhats.addEventListener("click", () => shareToApp("whatsapp", canvas));
  }
  if (btnFb) {
    btnFb.addEventListener("click", () => shareToApp("facebook", canvas));
  }
  if (btnTt) {
    btnTt.addEventListener("click", () => shareToApp("tiktok", canvas));
  }
}

// ---------------------------------------------------------------------------
// Export des données locales
// ---------------------------------------------------------------------------

function initExportButton() {
  const btn = document.getElementById("export-data");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    try {
      const json = await exportData();
      triggerDownload(json);
    } catch (e) {
      console.error(e);
      showNetworkError("L’export des données a échoué.");
    }
  });
}

// ---------------------------------------------------------------------------
// Gestion du mode hors‑ligne
// ---------------------------------------------------------------------------

function initOfflineIndicator() {
  const offlineEl = document.getElementById("offline");
  if (!offlineEl) return;

  function updateStatus() {
    offlineEl.style.display = navigator.onLine ? "none" : "block";
  }

  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  updateStatus();
}

// ---------------------------------------------------------------------------
// Navigation principale
// ---------------------------------------------------------------------------

function initNavigation() {
  document.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("href").substring(1);
      showSection(target);
    });
  });
}

// ---------------------------------------------------------------------------
// Lancement du mini‑jeu
// ---------------------------------------------------------------------------

function initGameLaunch() {
  const btn = document.getElementById("launch-game");
  if (!btn) return;
  btn.addEventListener("click", () => {
    showSection("game");
    startGame(); // fonction fournie par game.js
  });
}

// ---------------------------------------------------------------------------
// Initialisation globale de l’application
// ---------------------------------------------------------------------------

async function initApp() {
  try {
    // Base de données locale
    await openDb();

    // Initialisation des modules métiers
    initGame();
    initBadges();
    initLeaderboard();
    initShare();

    // UI statique
    populateVideoFeed();
    initMemeEditor();
    initExportButton();
    initOfflineIndicator();
    initNavigation();
    initGameLaunch();

    // Affichage de la page d’accueil au chargement
    showSection("home");

    // Enregistrement du Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker enregistré :", reg))
        .catch((err) => console.error("Enregistrement SW échoué :", err));
    }

    // Gestion globale des erreurs
    window.addEventListener("error", (e) => {
      console.error("Erreur non gérée :", e.message, e.filename, e.lineno);
      showNetworkError("Une erreur technique est survenue.");
    });
  } catch (err) {
    console.error("Échec de l’initialisation :", err);
    showNetworkError("Impossible de démarrer l’application.");
  }
}

// ---------------------------------------------------------------------------
// Démarrage après le chargement du DOM
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", initApp);