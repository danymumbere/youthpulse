"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Badges Module                                               */
/*  ES‑module, vanilla JS. Provides a static badge catalog, local persistence */
/*  via IndexedDB, badge unlocking, and rendering for the Badges panel.       */
/* -------------------------------------------------------------------------- */

import { showNetworkError } from './utils.js';

/* -------------------------------------------------------------------------- */
/*  Badge Catalog – definitions of all possible badges.                       */
/*  Each entry includes an ID (used as key), a human‑readable name, a short    */
/*  description, an optional condition function, and a simple icon (Unicode). */
/* -------------------------------------------------------------------------- */
export const BADGES_CATALOG = [
  {
    id: "first_game",
    name: "Premier pas",
    description: "Termine le mini‑jeu pour la première fois.",
    icon: "🎮",
    condition: (ctx) => ctx.gameCompleted === true,
  },
  {
    id: "speed_demon",
    name: "Vitesse éclair",
    description: "Termine le jeu en moins de 60 secondes.",
    icon: "⚡",
    condition: (ctx) => typeof ctx.durationSec === "number" && ctx.durationSec < 60,
  },
  {
    id: "score_100",
    name: "Cent points",
    description: "Atteint un score de 100 points ou plus.",
    icon: "💯",
    condition: (ctx) => typeof ctx.score === "number" && ctx.score >= 100,
  },
  {
    id: "perfect_run",
    name: "Course parfaite",
    description: "Obtiens un score parfait (500 points).",
    icon: "🌟",
    condition: (ctx) => typeof ctx.score === "number" && ctx.score >= 500,
  },
  {
    id: "share_viral",
    name: "Partage viral",
    description: "Partage un meme via l'application native au moins une fois.",
    icon: "📤",
    condition: (ctx) => ctx.sharesCount && ctx.sharesCount >= 1,
  },
];

/* -------------------------------------------------------------------------- */
/*  IndexedDB helpers – badge persistence.                                    */
/*  Uses a separate DB name to avoid conflicts with the score/leaderboard DB.  */
/* -------------------------------------------------------------------------- */
const BADGES_DB = "YouthPulseBadges";
const STORE = "badges";

async function openBadgesDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BADGES_DB, 1);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => {
      console.error("IndexedDB open error (badges):", e.target.error);
      reject(e.target.error);
    };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

async function getUnlockedBadgeIds() {
  try {
    const db = await openBadgesDB();
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const all = await store.getAll();
    return all.map((rec) => rec.id);
  } catch (err) {
    console.error("Failed to read badges:", err);
    showNetworkError("Impossible de charger les badges.");
    return [];
  }
}

async function setBadgeUnlocked(badgeId, context) {
  try {
    const db = await openBadgesDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    await store.put({ id: badgeId, unlockedAt: Date.now(), context });
    await tx.done;
  } catch (err) {
    console.error("Failed to save badge:", err);
    showNetworkError("Impossible d'enregistrer le badge.");
  }
}

/* -------------------------------------------------------------------------- */
/*  Public API – functions exported for other modules.                         */
/* -------------------------------------------------------------------------- */

/**
 * Déverrouille un badge si sa condition est remplie.
 * @param {string} badgeId – ID du badge à déverrouiller.
 * @param {object} context – données de jeu actuelles (score, durée, etc.).
 * @returns {Promise<void>}
 */
export async function unlockBadge(badgeId, context) {
  // Trouver la définition du badge
  const definition = BADGES_CATALOG.find((b) => b.id === badgeId);
  if (!definition) {
    // Badge inconnu – ignorer silencieusement
    return;
  }

  // Vérifier si la condition est remplie
  if (!definition.condition || !definition.condition(context)) {
    return;
  }

  // Récupérer les badges déjà déverrouillés
  const unlocked = await getUnlockedBadgeIds();
  if (unlocked.includes(badgeId)) {
    // Déjà déverrouillé – pas de travail supplémentaire
    return;
  }

  // Déverrouiller et persister
  await setBadgeUnlocked(badgeId, context);

  // Rafraîchir l'interface utilisateur pour afficher immédiatement le nouveau badge
  renderBadges();
}

/**
 * Render the unlocked badges into the #badgesList element.
 * This reads the current badge state from IndexedDB and creates a visual
 * representation for each unlocked badge. Locked badges are shown in a
 * disabled state.
 */
export async function renderBadges() {
  const listEl = document.getElementById("badgesList");
  if (!listEl) return;

  const unlocked = await getUnlockedBadgeIds();

  // Vider le contenu précédent
  listEl.innerHTML = "";

  BADGES_CATALOG.forEach((badge) => {
    const isUnlocked = unlocked.includes(badge.id);
    const item = document.createElement("div");
    item.className = "badge-item";
    item.setAttribute("role", "listitem");
    item.setAttribute("aria-label", `${badge.name} ${isUnlocked ? "débloqué" : "verrouillé"}`);

    // Construire le HTML interne
    item.innerHTML = `
      <div class="badge-icon" aria-hidden="true">${badge.icon}</div>
      <div class="badge-info">
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.description}</div>
      </div>
    `;

    if (!isUnlocked) {
      item.classList.add("locked");
      // Ajouter un indicateur ARIA pour les utilisateurs d'assistance
      item.setAttribute("aria-disabled", "true");
    }

    listEl.appendChild(item);
  });
}