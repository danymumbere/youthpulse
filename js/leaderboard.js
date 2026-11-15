// js/leaderboard.js
"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Module du tableau des scores (leaderboard.js)               */
/*  Module ES‑module, vanilla JS. Gère le stockage des scores via IndexedDB,   */
/*  agrège et trie les données, et affiche une interface locale du tableau des   */
/*  scores.                                                                  */
/* -------------------------------------------------------------------------- */

import { openDB } from './db.js';
import * as utils from './utils.js';

/* -------------------------------------------------------------------------- */
/* 1. Constantes et identifiants DOM (correspondant aux ID de la spécification) */
/* -------------------------------------------------------------------------- */
const DB_NAME = 'YouthPulseDB';
const STORE_NAME = 'scores'; // magasin d'objets pour les scores des joueurs

const IDS = {
  LEADERBOARD_LIST: 'leaderboardList', // conteneur pour la liste des scores
};

/* -------------------------------------------------------------------------- */
/* 2. Helpers IndexedDB                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Retourne un magasin d'objets accessible en lecture/écriture pour les scores.
 * @returns {Promise<IDBObjectStore>}
 */
async function getScoresStore() {
  try {
    const db = await openDB(DB_NAME);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    return tx.objectStore(STORE_NAME);
  } catch (err) {
    utils.showNotification('Impossible d’accéder à la base de données des scores.', 'error');
    throw err;
  }
}

/**
 * Récupère tous les scores depuis IndexedDB et les trie par ordre décroissant de score,
 * puis par ordre croissant de timestamp (pour les égalités).
 * @returns {Promise<Array<{playerName:string,score:number,timestamp:number}>>}
 */
export async function getAllScores() {
  try {
    const store = await getScoresStore();
    const all = await store.getAll();

    return all.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timestamp || 0) - (b.timestamp || 0);
    });
  } catch (err) {
    utils.showNotification('Impossible de charger le classement.', 'error');
    return [];
  }
}

/**
 * Enregistre un nouveau score dans IndexedDB.
 * @param {number} score – le score à enregistrer.
 * @param {string} [playerName='Joueur'] – nom optionnel du joueur.
 */
export async function addScore(score, playerName = 'Joueur') {
  try {
    const store = await getScoresStore();
    const entry = {
      playerName,
      score,
      timestamp: Date.now(),
    };
    await store.add(entry);
    // Actualiser l'interface après l'ajout
    renderLeaderboard();
  } catch (err) {
    utils.showNotification('Impossible d’enregistrer le score.', 'error');
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/* 3. Helpers de rendu d'interface                                           */
/* -------------------------------------------------------------------------- */

/**
 * Formate un timestamp numérique en une chaîne de caractères lisible.
 * @param {number} ts – timestamp en millisecondes.
 * @returns {string}
 */
function formatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

/**
 * Échappe les caractères HTML pour une insertion sécurisée dans le DOM.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Crée un élément DOM pour une seule entrée de classement.
 * @param {Object} entry – {playerName, score, timestamp}
 * @param {number} rank – position numérique (commençant à 1)
 * @returns {HTMLLIElement}
 */
function createLeaderboardEntry(entry, rank) {
  const li = document.createElement('li');
  li.className = 'leaderboard-entry';
  li.setAttribute('role', 'listitem');
  li.innerHTML = `
    <span class="rank" aria-label="Rang ${rank}">${rank}</span>
    <span class="player">${escapeHtml(entry.playerName)}</span>
    <span class="score" aria-label="Score ${entry.score}">${entry.score}</span>
    <span class="timestamp">${formatTimestamp(entry.timestamp)}</span>
  `;
  return li;
}

/**
 * Affiche le tableau des scores dans l'élément #leaderboardList.
 * Cette fonction est destinée à être appelée lorsque la page du tableau des scores
 * devient active ou après l'ajout d'un nouveau score.
 */
export function renderLeaderboard() {
  const container = document.getElementById(IDS.LEADERBOARD_LIST);
  if (!container) return;

  // Vider le conteneur existant
  container.innerHTML = '';

  getAllScores().then(entries => {
    if (entries.length === 0) {
      container.innerHTML = '<li class="leaderboard-entry">Aucun score enregistré pour le moment.</li>';
      return;
    }

    entries.forEach((entry, index) => {
      const li = createLeaderboardEntry(entry, index + 1);
      container.appendChild(li);
    });
  }).catch(() => {
    // Les erreurs sont déjà signalées dans getAllScores
  });
}

/* -------------------------------------------------------------------------- */
/* 4. API publique exportée                                                    */
/* -------------------------------------------------------------------------- */
export {
  renderLeaderboard,
  addScore,
  getAllScores,
};

/* -------------------------------------------------------------------------- */
/* 5. Initialisation – attacher le rendu au DOM prêt pour le leaderboard.      */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Si la page actuelle est le tableau des scores, afficher le classement.
  // (Le code d'initialisation de l'application peut appeler renderLeaderboard directement.)
  renderLeaderboard();
});