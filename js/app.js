"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Orchestrateur principal (app.js)                             */
/*  Module ES, JavaScript vanilla.                                             */
/*  Rôle : initialisation, routage SPA, enregistrement du Service Worker,      */
/*  chargement des modules, gestion globale des erreurs et rendu du contenu.   */
/* -------------------------------------------------------------------------- */

import { data } from "./data.js";
import {
  startGame,
  restartGame,
  showGameToast,
  renderGamePrompt,
} from "./game.js";
import { renderBadges, checkAndUnlockBadges } from "./badges.js";
import { renderLeaderboard } from "./leaderboard.js";
import {
  renderMemePreview,
  shareMeme,
  resetMemeForm,
} from "./share.js";
import {
  getScore,
  setScore,
  getUnlockedBadgeIds,
  getLeaderboardEntries,
  addLeaderboardEntry,
  exportData,
  importData,
} from "./db.js";
import {
  $,
  $$,
  showNetworkError,
  showSuccess,
  showWarning,
  formatTimestamp,
  downloadJSON,
  clamp,
  escapeHtml,
} from "./utils.js";

/* -------------------------------------------------------------------------- */
/*  Constantes de configuration                                               */
/* -------------------------------------------------------------------------- */

const APP_NAME = "YouthPulse";
const NAV_ITEMS = [
  { id: "home", label: "Accueil", icon: "🏠" },
  { id: "game", label: "Jeu", icon: "🎮" },
  { id: "badges", label: "Badges", icon: "🏅" },
  { id: "leaderboard", label: "Classement", icon: "🏆" },
  { id: "videos", label: "Témoignages", icon: "🎥" },
  { id: "memes", label: "Mèmes", icon: "😂" },
  { id: "share", label: "Partager", icon: "📤" },
  { id: "settings", label: "Réglages", icon: "⚙️" },
];

const FEATURE_ITEMS = [
  { id: "ultraLight", label: "Ultra‑léger", icon: "🪶", desc: "Moins de 30 Ko gzippé, chargement en 2 s." },
  { id: "mobileUI", label: "Mobile d’abord", icon: "📱", desc: "Cibles tactiles ≥ 44 px, dès 320 px de large." },
  { id: "embeddedContent", label: "Contenu embarqué", icon: "📦", desc: "Aucun appel API, tout est local." },
];

const SOCIAL_LINKS = [
  { id: "whatsappShareBtn", label: "WhatsApp", icon: "💬", color: "var(--whatsapp)" },
  { id: "facebookShareBtn", label: "Facebook", icon: "📘", color: "var(--facebook)" },
  { id: "tiktokShareBtn", label: "TikTok", icon: "🎵", color: "var(--tiktok)" },
];

/* -------------------------------------------------------------------------- */
/*  État global de l’application                                              */
/* -------------------------------------------------------------------------- */

const state = {
  currentView: "home",
  isOnline: navigator.onLine,
  score: 0,
  unlockedBadges: [],
  leaderboard: [],
  lastGameResult: null,
  sharesCount: 0,
  swRegistered: false,
};

/* -------------------------------------------------------------------------- */
/*  Utilitaires internes                                                      */
/* -------------------------------------------------------------------------- */

function getViewElement(viewId) {
  return $(viewId);
}

function getNavButton(viewId) {
  return $(`nav-btn-${viewId}`);
}

function getNavList() {
  return $("#navList");
}

function getOfflineBanner() {
  return $("#offlineBanner");
}

function getGlobalToast() {
  return $("#globalToast");
}

function getGlobalToastMsg() {
  return $("#globalToastMsg");
}

function getGlobalToastClose() {
  return $("#globalToastClose");
}

function getNavToggle() {
  return $("#navToggle");
}

function getNav() {
  return $("#nav");
}

function getNavBackdrop() {
  return $("#navBackdrop");
}

function getNavBadgeCount() {
  return $("#navBadgeCount");
}

function getNavScore() {
  return $("#navScore");
}

/* -------------------------------------------------------------------------- */
/*  Toast global                                                              */
/* -------------------------------------------------------------------------- */

let toastTimer = null;

function showToast(message, type = "success", duration = 3200) {
  const toast = getGlobalToast();
  const msg = getGlobalToastMsg();
  const closeBtn = getGlobalToastClose();
  if (!toast || !msg) return;

  const icons = { success: "✅", error: "⚠️", warning: "⚠️", info: "ℹ️" };
  msg.textContent = `${icons[type] || "ℹ️"} ${message}`;
  toast.dataset.type = type;
  toast.classList.add("is-visible");
  toast.setAttribute("aria-hidden", "false");

  if (closeBtn) {
    closeBtn.onclick = () => hideToast();
  }

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, duration);
}

function hideToast() {
  const toast = getGlobalToast();
  if (!toast) return;
  toast.classList.remove("is-visible");
  toast.setAttribute("aria-hidden", "true");
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Navigation / routage SPA                                                  */
/* -------------------------------------------------------------------------- */

function buildNav() {
  const navList = getNavList();
  if (!navList) return;

  navList.innerHTML = NAV_ITEMS.map(
    (item) => `
      <li class="nav__item">
        <button
          type="button"
          class="nav__btn"
          data-view="${item.id}"
          id="nav-btn-${item.id}"
          aria-label="${item.label}"
        >
          <span class="nav__icon" aria-hidden="true">${item.icon}</span>
          <span class="nav__label">${item.label}</span>
          ${item.id === "badges" ? `<span class="nav__badge" id="navBadgeCount" hidden>0</span>` : ""}
        </button>
      </li>
    `
  ).join("");

  navList.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav__btn");
    if (!btn) return;
    const view = btn.dataset.view;
    if (view) navigateTo(view);
  });
}

function navigateTo(viewId) {
  const target = getViewElement(viewId);
  if (!target) {
    showWarning(`Section inconnue : ${viewId}`);
    return;
  }

  // Masquer toutes les vues
  $$(".view").forEach((v) => {
    v.classList.remove("is-active");
    v.setAttribute("aria-hidden", "true");
  });

  // Afficher la cible
  target.classList.add("is-active");
  target.setAttribute("aria-hidden", "false");

  // Mettre à jour l’aria-current de la navigation
  $$(".nav__btn").forEach((btn) => {
    if (btn.dataset.view === viewId) {
      btn.setAttribute("aria-current", "page");
      btn.classList.add("is-active");
    } else {
      btn.removeAttribute("aria-current");
      btn.classList.remove("is-active");
    }
  });

  state.currentView = viewId;

  // Fermer le menu mobile s’il est ouvert
  closeMobileNav();

  // Scroll vers le haut
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Rafraîchir le contenu de la vue
  refreshView(viewId);

  // Mettre à jour le titre
  const item = NAV_ITEMS.find((n) => n.id === viewId);
  if (item) {
    document.title = `${item.label} – ${APP_NAME}`;
  }

  // Focus sur le titre de la vue pour l’accessibilité
  const title = target.querySelector(".view__title");
  if (title) {
    title.setAttribute("tabindex", "-1");
    title.focus({ preventScroll: true });
  }
}

function refreshView(viewId) {
  switch (viewId) {
    case "home":
      renderHome();
      break;
    case "game":
      renderGameView();
/* -------------------------------------------------------------------------- */
/*  Gestion du menu mobile                                                    */
/* -------------------------------------------------------------------------- */

function toggleMobileNav() {
  const nav = getNav();
  const backdrop = getNavBackdrop();
  const isOpen = nav.classList.contains("is-open");

  if (isOpen) {
    closeMobileNav();
  } else {
    nav.classList.add("is-open");
    backdrop.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  }
}

function closeMobileNav() {
  const nav = getNav();
  const backdrop = getNavBackdrop();
  nav.classList.remove("is-open");
  backdrop.classList.remove("is-visible");
  document.body.style.overflow = "";
}

/* -------------------------------------------------------------------------- */
/*  Initialisation                                                            */
/* -------------------------------------------------------------------------- */

function initApp() {
  // Construction de la navigation
  buildNav();

  // Événements de navigation mobile
  const navToggle = getNavToggle();
  if (navToggle) navToggle.addEventListener("click", toggleMobileNav);
  const navBackdrop = getNavBackdrop();
  if (navBackdrop) navBackdrop.addEventListener("click", closeMobileNav);

  // Gestion de l'état en ligne/hors ligne
  window.addEventListener("online", () => {
    state.isOnline = true;
    getOfflineBanner().hidden = true;
    showToast("Connexion rétablie.", "success");
  });

  window.addEventListener("offline", () => {
    state.isOnline = false;
    getOfflineBanner().hidden = false;
    showToast("Vous êtes hors ligne.", "warning");
  });

  // Chargement des données initiales
  loadState();
  updateNavUI();

  // Navigation initiale
  navigateTo("home");

  // Enregistrement du Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        state.swRegistered = true;
      })
      .catch((err) => console.error("SW registration failed:", err));
  }
}

// Lancement au chargement du DOM
/* -------------------------------------------------------------------------- */
/*  Gestion du menu mobile                                                    */
/* -------------------------------------------------------------------------- */

function toggleMobileNav() {
  const nav = getNav();
  const backdrop = getNavBackdrop();
  const isOpen = nav.classList.contains("is-open");

  if (isOpen) {
    closeMobileNav();
  } else {
    nav.classList.add("is-open");
    backdrop.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  }
}

function closeMobileNav() {
  const nav = getNav();
  const backdrop = getNavBackdrop();
  nav.classList.remove("is-open");
  backdrop.classList.remove("is-visible");
  document.body.style.overflow = "";
}

/* -------------------------------------------------------------------------- */
/*  Initialisation                                                            */
/* -------------------------------------------------------------------------- */

function initApp() {
  // Construction de la navigation
  buildNav();

  // Événements de navigation mobile
  const navToggle = getNavToggle();
  if (navToggle) navToggle.addEventListener("click", toggleMobileNav);
  const navBackdrop = getNavBackdrop();
  if (navBackdrop) navBackdrop.addEventListener("click", closeMobileNav);

  // Gestion de l'état en ligne/hors ligne
  window.addEventListener("online", () => {
    state.isOnline = true;
    getOfflineBanner().hidden = true;
    showToast("Connexion rétablie.", "success");
  });

  window.addEventListener("offline", () => {
    state.isOnline = false;
    getOfflineBanner().hidden = false;
    showToast("Vous êtes hors ligne.", "warning");
  });

  // Chargement des données initiales
  loadState();
  updateNavUI();

  // Navigation initiale
  navigateTo("home");

  // Enregistrement du Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        state.swRegistered = true;
      })
      .catch((err) => console.error("SW registration failed:", err));
  }
}

// Lancement au chargement du DOM
document.addEventListener("DOMContentLoaded", initApp);