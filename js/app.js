"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Main Orchestrator (app.js)                                   */
/*  ES‑module, vanilla JS. Handles routing, Service Worker registration,      */
/*  module initialization, global error handling, and bootstraps real content.*/
/* -------------------------------------------------------------------------- */

import { startGame, resetGame } from "./game.js";
import { renderBadges, checkAndUnlockBadges } from "./badges.js";
import { renderLeaderboard, addLeaderboardEntry } from "./leaderboard.js";
import { setupShare, shareMeme } from "./share.js";
import { data } from "./data.js";
import { showNetworkError, showToast } from "./utils.js";
import {
  openDb,
  getScore,
  setScore,
  getUnlockedBadgeIds,
  setBadgeUnlocked,
  getLeaderboardEntries,
  exportData,
} from "./db.js";

/* -------------------------------------------------------------------------- */
/*  Service Worker Registration                                               */
/* -------------------------------------------------------------------------- */
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {
        scope: "./",
      });
      console.log("[SW] Enregistré :", registration.scope);
    } catch (err) {
      console.error("[SW] Échec de l’enregistrement :", err);
      showNetworkError("Mode hors ligne indisponible.");
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Routing – Hash based navigation                                           */
/* -------------------------------------------------------------------------- */
const SECTION_IDS = [
  "home",
  "game",
  "badges",
  "leaderboard",
  "videos",
  "memes",
  "share",
  "offline",
];

const sections = {};
SECTION_IDS.forEach((id) => {
  const el = document.getElementById(id);
  if (el) sections[id] = el;
});

function showSection(hash) {
  const target = hash.replace("#", "") || "home";
  Object.values(sections).forEach((sec) => sec.hidden = true);
  if (sections[target]) {
    sections[target].hidden = false;
    window.scrollTo(0, 0);
  }
  // Trigger section‑specific initialization
  if (target === "badges") renderBadges();
  if (target === "leaderboard") renderLeaderboard();
  if (target === "videos") renderVideoFeed();
  if (target === "memes") renderMemeEditor();
}

window.addEventListener("hashchange", () => showSection(window.location.hash));
showSection(window.location.hash);

/* -------------------------------------------------------------------------- */
/*  Global Error Handling                                                     */
/* -------------------------------------------------------------------------- */
window.addEventListener("error", (evt) => {
  console.error("[Global] Erreur non gérée :", evt.error);
  showNetworkError("Une erreur inattendue s’est produite.");
});
window.addEventListener("unhandledrejection", (evt) => {
  console.error("[Global] Promesse rejetée :", evt.reason);
  showNetworkError("Une erreur asynchrone s’est produite.");
});

/* -------------------------------------------------------------------------- */
/*  Home – Start Game Button                                                  */
/* -------------------------------------------------------------------------- */
const startGameBtn = document.getElementById("startGameBtn");
if (startGameBtn) {
  startGameBtn.addEventListener("click", async () => {
    window.location.hash = "#game";
    // The game module will be started by the game section’s own logic
  });
}

/* -------------------------------------------------------------------------- */
/*  Game Section – Delegated to game.js                                       */
/* -------------------------------------------------------------------------- */
const restartGameBtn = document.getElementById("restartGameBtn");
if (restartGameBtn) {
  restartGameBtn.addEventListener("click", () => {
    resetGame();
    startGame(onGameComplete);
  });
}

/* Callback when the mini‑game finishes */
async function onGameComplete(context) {
  // context: { score, durationSec, gameCompleted }
  const timestamp = new Date().toLocaleString("fr-FR");
  showToast(`Jeu terminé ! Score : ${context.score} – ${timestamp}`);

  // Persist score
  try {
    await setScore(context.score);
    await addLeaderboardEntry("Joueur", context.score);
  } catch (err) {
    console.error("Échec sauvegarde score :", err);
  }

  // Badge unlocking
  try {
    await checkAndUnlockBadges(context);
  } catch (err) {
    console.error("Échec vérification badges :", err);
  }
}

/* -------------------------------------------------------------------------- */
/*  Videos – Render Testimonials                                              */
/* -------------------------------------------------------------------------- */
function renderVideoFeed() {
  const feed = document.getElementById("videoFeed");
  if (!feed) return;
  feed.innerHTML = "";
  data.testimonies.forEach((t) => {
    const article = document.createElement("article");
    article.className = "video-card";
    article.innerHTML = `
      <div class="video-wrapper" role="region" aria-label="Témoignage de ${t.author}">
        <video controls preload="none" poster="img/poster-${t.id}.jpg" aria-label="${t.quote}">
          <source src="video/${t.id}.webm" type="video/webm">
          <source src="video/${t.id}.mp4" type="video/mp4">
          Votre navigateur ne prend pas en charge la vidéo HTML5.
        </video>
      </div>
      <div class="video-meta">
        <p class="video-quote">« ${t.quote} »</p>
        <p class="video-author">${t.author}</p>
        <p class="video-context">${t.context}</p>
      </div>
    `;
    feed.appendChild(article);
  });
}

/* -------------------------------------------------------------------------- */
/*  Memes – Render Editor                                                     */
/* -------------------------------------------------------------------------- */
function renderMemeEditor() {
  const editor = document.getElementById("memeEditor");
  if (!editor) return;
  editor.innerHTML = `
    <div class="meme-editor" role="application" aria-label="Générateur de mèmes">
      <select id="memeTemplate" aria-label="Choisir un modèle">
        <option value="">– Modèle –</option>
        ${data.memeTemplates
          .map((tmpl) => `<option value="${tmpl.id}">${tmpl.top} / ${tmpl.bottom}</option>`)
          .join("")}
      </select>
      <div class="meme-preview" aria-live="polite">
        <img id="memeImage" src="" alt="Aperçu du mème" hidden>
        <div id="memeTopText" class="meme-text top" aria-hidden="true"></div>
        <div id="memeBottomText" class="meme-text bottom" aria-hidden="true"></div>
      </div>
      <div class="meme-controls">
        <label for="topText">Texte du haut</label>
        <input type="text" id="topText" maxlength="40" placeholder="Texte du haut" aria-label="Texte du haut">
        <label for="bottomText">Texte du bas</label>
        <input type="text" id="bottomText" maxlength="40" placeholder="Texte du bas" aria-label="Texte du bas">
        <button type="button" id="generateMemeBtn" class="btn-primary">Générer</button>
      </div>
    </div>
  `;

  const templateSelect = document.getElementById("memeTemplate");
  const topInput = document.getElementById("topText");
  const bottomInput = document.getElementById("bottomText");
  const generateBtn = document.getElementById("generateMemeBtn");
  const previewImg = document.getElementById("memeImage");
  const topTextEl = document.getElementById("memeTopText");
  const bottomTextEl = document.getElementById("memeBottomText");

  let currentTemplate = null;

  templateSelect.addEventListener("change", () => {
    const id = templateSelect.value;
    currentTemplate = data.memeTemplates.find((t) => t.id === id) || null;
    if (currentTemplate) {
      topInput.value = currentTemplate.top;
      bottomInput.value = currentTemplate.bottom;
      updatePreview();
    } else {
      topInput.value = "";
      bottomInput.value = "";
      previewImg.hidden = true;
      topTextEl.textContent = "";
      bottomTextEl.textContent = "";
    }
  });

  [topInput, bottomInput].forEach((input) =>
    input.addEventListener("input", updatePreview)
  );

  function updatePreview() {
    if (!currentTemplate) return;
    previewImg.src = currentTemplate.image;
    previewImg.hidden = false;
    topTextEl.textContent = topInput.value || currentTemplate.top;
    bottomTextEl.textContent = bottomInput.value || currentTemplate.bottom;
  }

  generateBtn.addEventListener("click", () => {
    if (!currentTemplate) return;
    const memeData = {
      image: currentTemplate.image,
      top: topInput.value || currentTemplate.top,
      bottom: bottomInput.value || currentTemplate.bottom,
    };
    // Store for sharing
    sessionStorage.setItem("currentMeme", JSON.stringify(memeData));
    showToast("Mème généré ! Prêt à partager.");
  });
}

/* -------------------------------------------------------------------------- */
/*  Share – Wire up share buttons                                             */
/* -------------------------------------------------------------------------- */
const shareMemeBtn = document.getElementById("shareMemeBtn");
if (shareMemeBtn) {
  shareMemeBtn.addEventListener("click", () => {
    const memeJson = sessionStorage.getItem("currentMeme");
    if (!memeJson) {
      showNetworkError("Aucun mème à partager. Générez‑en un d’abord.");
      return;
    }
    const meme = JSON.parse(memeJson);
    shareMeme(meme);
  });
}

// Initialize share module (sets up WhatsApp/Facebook/TikTok buttons)
setupShare();

/* -------------------------------------------------------------------------- */
/*  Offline / Settings – Export Data                                          */
/* -------------------------------------------------------------------------- */
const offlineSection = document.getElementById("offline");
if (offlineSection) {
  offlineSection.innerHTML = `
    <section aria-labelledby="offlineTitle">
      <h2 id="offlineTitle">Mode hors ligne & Données</h2>
      <p>L’application fonctionne hors ligne grâce au Service Worker.</p>
      <button type="button" id="exportDataBtn" class="btn-secondary">Exporter mes données (JSON)</button>
      <pre id="exportOutput" aria-live="polite" hidden></pre>
    </section>
  `;
  const exportBtn = document.getElementById("exportDataBtn");
  const output = document.getElementById("exportOutput");
  exportBtn.addEventListener("click", async () => {
    try {
      const json = await exportData();
      output.textContent = json;
      output.hidden = false;
      // Trigger download
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "youthpulse-data.json";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Données exportées et téléchargées.");
    } catch (err) {
      console.error("Export failed:", err);
      showNetworkError("Impossible d’exporter les données.");
    }
  });
}

/* -------------------------------------------------------------------------- */
/*  Boot – Initialize DB and load persisted data                              */
/* -------------------------------------------------------------------------- */
async function bootstrap() {
  try {
    await openDb();
    // Load score (if any) – could be used to pre‑fill UI
    const score = await getScore();
    if (score) console.log("[Boot] Score chargé :", score);
    // Badges are rendered on demand in renderBadges()
    // Leaderboard rendered on demand
  } catch (err) {
    console.error("[Boot] Échec initialisation DB :", err);
    showNetworkError("Impossible d’accéder au stockage local.");
  }
}

/* -------------------------------------------------------------------------- */
/*  Start                                                                     */
/* -------------------------------------------------------------------------- */
registerServiceWorker();
bootstrap();