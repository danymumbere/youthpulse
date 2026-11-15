/**
 * YouthPulse – IndexedDB helper module
 * Fournit des fonctions utilitaires pour la persistance locale des scores,
 * des badges et des données du tableau des leaders. Conçu pour être importé par
 * les modules badges.js, leaderboard.js et app.js.
 *
 * Exports (fonctions nommées) :
 *   • openDb()                 – retourne une promesse résolue avec l'instance de base de données
 *   • getScore()               – retourne le score actuel (ou 0 si absent)
 *   • setScore(value)          – stocke le score (nombre)
 *   • getUnlockedBadgeIds()    – retourne un tableau d'identifiants de badges débloqués
 *   • setBadgeUnlocked(id)     – marque un badge comme débloqué avec un horodatage
 *   • getLeaderboardEntries()  – retourne les entrées triées par score (tableau {name, score})
 *
 * Tous les accès à la base de vedettes sont encapsulés ici pour garantir une gestion cohé modernism
 * et une expérience hors ligne fluide.
 */

"use strict";

const DB_NAME = "YouthPulse";
const DB_VERSION = 2; // version incrémentée pour l'ajout du magasin de tableau des leaders
const STORE_SCORE = "scores";
const STORE_LEADERBOARD = "leaderboard";
const STORE_BADGES = "badges";

/**
 * Ouvre (ou crée) la base de données principale avec trois magasins :
 *   - scores : stocke le score actuel de l'utilisateur (clé unique "current")
 *   - leaderboard : stocke les entrées du tableau des leaders (clé primaire auto-incrémentée)
 *   - badges : stocke les badges débloqués (clé primaire = identifiant du badge)
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => {
      console.error("Erreur IndexedDB lors de l'ouverture de la base de données YouthPulse :", e.target.error);
      reject(e.target.error);
    };

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Magasin de scores (clé unique "current")
      if (!db.objectStoreNames.contains(STORE_SCORE)) {
        const scoreStore = db.createObjectStore(STORE_SCORE, { keyPath: "key" });
        scoreStore.createIndex("byKey", "key", { unique: true });
      }

      // Magasin de tableau des leaders (clé primaire auto-incrémentée)
      if (!db.objectStoreNames.contains(STORE_LEADERBOARD)) {
        db.createObjectStore(STORE_LEADERBOARD, { keyPath: "id", autoIncrement: true });
      }

      // Magasin de badges (clé primaire = identifiant du badge)
      if (!db.objectStoreNames.contains(STORE_BADGES)) {
        db.createObjectStore(STORE_BADGES, { keyPath: "id" });
      }
    };
  });
}

/**
 * Récupère le score actuel stocké. Retourne 0 si aucune donnée n'existe.
 */
async function getScore() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_SCORE, "readonly");
    const store = tx.objectStore(STORE_SCORE);
    const result = await store.get("current");
    return result ? result.value : 0;
  } catch (err) {
    console.error("Erreur lors de la récupération du score :", err);
    return 0;
  }
}

/**
 * Stocke le score actuel sous la clé "current".
 */
async function setScore(value) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_SCORE, "readwrite");
    const store = tx.objectStore(STORE_SCORE);
    await store.put({ key: "current", value: Math.max(0, Number(value) || 0) });
  } catch (err) {
    console.error("Erreur lors de l'écriture du score :", err);
  }
}

/**
 * Récupère tous les badges débloqués (tableau d'objets {id, unlockedAt}).
 */
async function getUnlockedBadgeIds() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_BADGES, "readonly");
    const store = tx.objectStore(STORE_BADGES);
    const all = await store.getAll();
    return all.map((rec) => rec.id);
  } catch (err) {
    console.error("Erreur lors de la récupération des badges :", err);
    return [];
  }
}

/**
 * Enregistre un badge comme débloqué avec un horodatage.
 */
async function setBadgeUnlocked(badgeId) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_BADGES, "readwrite");
    const store = tx.objectStore(STORE_BADGES);
    await store.put({ id: badgeId, unlockedAt: Date.now() });
  } catch (err) {
    console.error("Erreur lors du déblocage du badge :", err);
  }
}

/**
 * Récupère toutes les entrées du tableau des leaders, triées par score (décroissant).
 * Chaque entrée est un objet { name: string, score: number }.
 */
async function getLeaderboardEntries() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_LEADERBOARD, "readonly");
    const store = tx.objectStore(STORE_LEADERBOARD);
    const all = await store.getAll();

    // Trie par score décroissant, puis par nom alphabétique pour une stabilité déterministe
    return all
      .filter((e) => typeof e.score === "number")
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.name || "").localeCompare(b.name || "");
      });
  } catch (err) {
    console.error("Erreur lors de la récupération du tableau des leaders :", err);
    return [];
  }
}

/**
 * Ajoute une nouvelle entrée au tableau des leaders (utilisé après un partage réussi ou un jeu terminé).
 * Le nom est stocké de manière anonyme (ex. "Joueur 42") si non fourni.
 */
async function addLeaderboardEntry(name = "Joueur", score = 0) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_LEADERBOARD, "readwrite");
    const store = tx.objectStore(STORE_LEADERBOARD);
    await store.add({ name: String(name).trim() || "Joueur", score: Math.max(0, Number(score) || 0) });
  } catch (err) {
    console.error("Erreur lors de l'ajout d'une entrée au tableau des leaders :", err);
  }
}

/**
 * Exporte toutes les données persistantes de l'application sous forme de JSON blob.
 * Utile pour la sauvegarde ou le transfert vers un autre appareil.
 */
async function exportData() {
  try {
    const [score, badges, leaderboard] = await Promise.all([
      getScore(),
      getUnlockedBadgeIds(),
      getLeaderboardEntries(),
    ]);

    const data = {
      version: DB_VERSION,
      exportedAt: Date.now(),
      score,
      badges,
      leaderboard,
    };

    // Retourne une promesse résolue avec une chaîne JSON
    return Promise.resolve(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Erreur lors de l'exportation des données :", err);
    return Promise.reject(err);
  }
}

/**
 * Importe des données à partir d'un blob JSON, en remplaçant les magasins existants.
 * Retourne une promesse résolue lorsque l'importation est terminée.
 */
async function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const db = await openDb();

    // Vide les trois magasins avant d'importer
    await Promise.all([
      new Promise((resolve) => {
        const tx = db.transaction(STORE_SCORE, "readwrite");
        tx.objectStore(STORE_SCORE).clear();
        tx.onerror = (e) => console.error("Erreur lors du vidage du magasin de scores", e);
        tx.onsuccess = resolve;
      }),
      new Promise((resolve) => {
        const tx = db.transaction(STORE_LEADERBOARD, "readwrite");
        tx.objectStore(STORE_LEADERBOARD).clear();
        tx.onerror = (e) => console.error("Erreur lors du vidage du magasin de leaderboard", e);
        tx.onsuccess = resolve;
      }),
      new Promise((resolve) => {
        const tx = db.transaction(STORE_BADGES, "readwrite");
        tx.objectStore(STORE_BADGES).clear();
        tx.onerror = (e) => console.error("Erreur lors du vidage du magasin de badges", e);
        tx.onsuccess = resolve;
      }),
    ]);

    // Insère les nouvelles données
    if (data.score) {
      await setScore(data.score);
    }
    if (data.badges?.length) {
      const tx = db.transaction(STORE_BADGES, "readwrite");
      const store = tx.objectStore(STORE_BADGES);
      data.badges.forEach((id) => store.put({ id, unlockedAt: Date.now() }));
      await tx;
    }
    if (data.leaderboard?.length) {
      const tx = db.transaction(STORE_LEADERBOARD, probably a mistake: "readwrite");
      const store = tx.objectStore(STORE_LEADERBOARD);
      // Le magasin utilise une clé primaire auto-incrémentée, donc nous devons insérer sans spécifier 'id'
      data.leaderboard.forEach((entry) => store.add(entry));
      await tx;
    }

    return Promise.resolve();
  } catch (err) {
    console.error("Erreur lors de l'importation des données :", err);
    return Promise.reject(err);
  }
}

// ---------------------------------------------------------------------------
// Exports – rendent les fonctions disponibles pour les autres modules ES.
// ---------------------------------------------------------------------------
export {
  openDb,
  getScore,
  setScore,
  getUnlockedBadgeIds,
  setBadgeUnlocked,
  getLeaderboardEntries,
  addLeaderboardEntry,
  exportData,
  importData,
};