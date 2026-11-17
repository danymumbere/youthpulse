"use strict";

// js/app.js – Orchestrateur principal de YouthPulse
// Gestion du routage, du Service Worker, du chargement des modules UI et des erreurs globales.

import { initializeGame, startGame } from "./game.js";
import { initializeBadges, updateBadgeUI } from "./badges.js";
import { initializeLeaderboard, updateLeaderboardUI } from "./leaderboard.js";
import { initializeShare } from "./share.js";
import { data } from "./data.js";
import { showToast, showNetworkError } from "./utils.js";
import {
  openDb,
  getScore,
  setScore,
  exportData,
  importData,
} from "./db.js";

/* -------------------------------------------------------------------------- */
/*  Initialisation globale                                                    */
/* -------------------------------------------------------------------------- */
(async () => {
  try {
    await openDb(); // crée les magasins IndexedDB
    await registerServiceWorker();
    initRouting();
    initUIModules();
    loadInitialContent();
  } catch (err) {
    handleGlobalError(err);
  }
})();

/* -------------------------------------------------------------------------- */
/*  Service Worker                                                            */
/* -------------------------------------------------------------------------- */
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (e) {
      console.error("Enregistrement du Service Worker échoué :", e);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Routage et navigation                                                    */
/* -------------------------------------------------------------------------- */
function initRouting() {
  const sections = {
    home: document.getElementById("home"),
    game: document.getElementById("game"),
    badges: document.getElementById("badges"),
    leaderboard: document.getElementById("leaderboard"),
    videos: document.getElementById("videos"),
    memes: document.getElementById("memes"),
    share: document.getElementById("share"),
    settings: document.getElementById("settings"),
    offline: document.getElementById("offline"),
  };

  // liens de navigation (data-target = id de la section)
  document.querySelectorAll("nav a[data-target]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      displaySection(sections, target);
    });
  });

  // prise en charge du bouton Retour du navigateur
  window.addEventListener("popstate", () => {
    const hash = location.hash.slice(1) || "home";
    displaySection(sections, hash);
  });

  // affichage initial
  const initial = location.hash.slice(1) || "home";
  displaySection(sections, initial);
}

/**
 * Masque toutes les sections puis affiche celle demandée.
 * @param {Object} sections – tableau d’éléments DOM
 * @param {string} id – identifiant de la section à afficher
 */
function displaySection(sections, id) {
  Object.values(sections).forEach((el) => (el.style.display = "none"));
  if (sections[id]) {
    sections[id].style.display = "block";
    history.pushState(null, "", `#${id}`);
  }
}

/* -------------------------------------------------------------------------- */
/*  Initialisation des modules UI                                             */
/* -------------------------------------------------------------------------- */
function initUIModules() {
  initializeGame();
  initializeBadges();
  initializeLeaderboard();
  initializeShare();
  initMemeEditor();
  initVideoFeed();
  initEventHandlers();
}

/* -------------------------------------------------------------------------- */
/*  Chargement du contenu embarqué                                            */
/* -------------------------------------------------------------------------- */
function loadInitialContent() {
  renderVideoTestimonies(data.testimonies);
  updateBadgeUI(); // affichage des badges déjà débloqués
  updateLeaderboardUI(); // affichage du tableau des leaders
}

/* -------------------------------------------------------------------------- */
/*  Gestionnaire d’erreurs globales                                          */
/* -------------------------------------------------------------------------- */
function handleGlobalError(err) {
  console.error("Erreur globale :", err);
  showNetworkError("Une erreur est survenue. Veuillez réessayer.");
}

// capture d’erreurs non gérées
window.addEventListener("error", (e) => handleGlobalError(e.error));
window.addEventListener("unhandledrejection", (e) => handleGlobalError(e.reason));

/* -------------------------------------------------------------------------- */
/*  Éditeur de memes                                                         */
/* -------------------------------------------------------------------------- */
function initMemeEditor() {
  const imageInput = document.getElementById("memeImageInput");
  const topInput = document.getElementById("topTextInput");
  const bottomInput = document.getElementById("bottomTextInput");
  const previewBtn = document.getElementById("previewMemeBtn");
  const canvas = document.getElementById("memeCanvas");
  const shareBtn = document.getElementById("shareMemeBtn");
  const ctx = canvas.getContext("2d");
  let currentImg = null;

  // Chargement de l’image sélectionnée
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        // redimensionne le canvas à la taille de l’image
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Génération du preview
  previewBtn.addEventListener("click", () => {
    if (!currentImg) {
      showToast("Veuillez choisir une image.");
      return;
    }
    const topText = topInput.value.trim();
    const bottomText = bottomInput.value.trim();

    // dessin de base
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImg, 0, 0);

    // style texte
    const fontSize = Math.max(24, Math.floor(canvas.width / 12));
    ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = Math.max(2, Math.floor(fontSize / 20));
    ctx.textAlign = "center";

    // texte du haut
    if (topText) {
      ctx.fillText(topText, canvas.width / 2, fontSize + 10);
      ctx.strokeText(topText, canvas.width / 2, fontSize + 10);
    }

    // texte du bas
    if (bottomText) {
      ctx.fillText(
        bottomText,
        canvas.width / 2,
        canvas.height - 10
      );
      ctx.strokeText(
        bottomText,
        canvas.width / 2,
        canvas.height - 10
      );
    }
  });

  // Partage du meme via Web Share API
  shareBtn.addEventListener("click", async () => {
    if (!canvas) return;
    try {
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const file = new File([blob], "meme.png", { type: "image/png" });
      if (navigator.share) {
        await navigator.share({
          title: "Mon meme YouthPulse",
          text: "Découvre mon meme créé avec YouthPulse !",
          files: [file],
        });
      } else {
        showToast("Le partage n’est pas supporté sur cet appareil.");
      }
    } catch (e) {
      console.error("Erreur de partage du meme :", e);
      showToast("Impossible de partager le meme.");
    }
  });
}

/* -------------------------------------------------------------------------- */
/*  Flux vidéo local                                                          */
/* -------------------------------------------------------------------------- */
function initVideoFeed() {
  // rien de spécial ici ; le rendu est effectué dans loadInitialContent()
}

/**
 * Insère les témoignages vidéo dans #videoList.
 * @param {Array} testimonies – tableau d’objets provenant de data.testimonies
 */
function renderVideoTestimonies(testimonies) {
  const list = document.getElementById("videoList");
  if (!list) return;
  list.innerHTML = testimonies
    .map(
      (t) => `
    <section class="testimony">
      <video controls poster="img/placeholder.jpg" aria-label="${t.author} – ${t.context}">
        <source src="videos/${t.id}.mp4" type="video/mp4">
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
      <blockquote>
        <p>${t.quote}</p>
        <footer><strong>${t.author}</strong> — ${t.context}</footer>
      </blockquote>
    </section>
  `
    )
    .join("");
}

/* -------------------------------------------------------------------------- */
/*  Gestion des événements globaux                                            */
/* -------------------------------------------------------------------------- */
function initEventHandlers() {
  // Lancement du mini‑jeu
  const launchBtn = document.getElementById("launchGameBtn");
  if (launchBtn) {
    launchBtn.addEventListener("click", async () => {
      try {
        const { score, durationSec } = await startGame();
        showToast(
          `Jeu terminé ! Score : ${score} en ${durationSec}s`
        );
        await setScore(score);
        // mise à jour des badges et du tableau des leaders
        updateBadgeUI({
          gameCompleted: true,
          score,
          durationSec,
        });
        updateLeaderboardUI();
      } catch (e) {
        console.error("Erreur pendant le jeu :", e);
        showToast("Une erreur est survenue pendant le jeu.");
      }
    });
  }

  // Redémarrage du jeu (si le bouton existe)
  const restartBtn = document.getElementById("restartGameBtn");
  if (restartBtn) {
restartBtn.addEventListener("click", async () => {
      try {
        const { score, durationSec } = await startGame();
        showToast(
          `Jeu terminé ! Score : ${score} en ${durationSec}s`
        );
        await setScore(score);
        updateBadgeUI({
          gameCompleted: true,
          score,
          durationSec
        });
        updateLeaderboardUI();
      } catch (e) {
        console.error("Erreur pendant le redémarrage du jeu :", e);
      }
    });

    document.addEventListener("DOMContentLoaded", () => {
      loadInitialContent();
      initMemeGenerator();
      initVideoFeed();
      initEventHandlers();
    });