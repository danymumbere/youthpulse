// js/leaderboard.js
"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Leaderboard Module                                           */
/*  ES‑module, vanilla JS. Fournit l’agrégation des données du tableau des leaders   */
/*  depuis IndexedDB, le tri et le rendu pour la page du tableau des leaders.   */
/* -------------------------------------------------------------------------- */

import { showNetworkError } from './utils.js';
import { getLeaderboardEntries } from './db.js';

/* -------------------------------------------------------------------------- */
/*  Helpers internes                                                          */
/* -------------------------------------------------------------------------- */

async function fetchSortedEntries() {
  try {
    const entries = await getLeaderboardEntries(); // tableau {name, score}
    // Trier par score décroissant, puis par nom croissant pour les égalités
    return entries
      .slice()
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name, 'fr');
      });
  } catch (err) {
    console.error('Échec du chargement des entrées du tableau des leaders :', err);
    showNetworkError('Impossible de charger le classement.');
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Création d’un élément de liste pour une entrée                           */
/* -------------------------------------------------------------------------- */

function createLeaderboardItem(entry, index) {
  const li = document.createElement('li');
  li.className = 'leaderboard-item';
  li.setAttribute('role', 'listitem');
  li.innerHTML = `
    <span class="rank">${index + 1}</span>
    <span class="player">${entry.name}</span>
    <span class="score">${entry.score}</span>
  `;
  return li;
}

/* -------------------------------------------------------------------------- */
/*  Rendu du tableau des leaders dans le DOM                                    */
/* -------------------------------------------------------------------------- */

function renderLeaderboard(entries) {
  const listElement = document.getElementById('leaderboardList');
  if (!listElement) return;

  listElement.innerHTML = '';

  if (entries.length === 0) {
    listElement.innerHTML = '<li class="empty">Aucun score enregistré pour le moment.</li>';
    return;
  }

  entries.forEach((entry, idx) => {
    const li = createLeaderboardItem(entry, idx);
    listElement.appendChild(li);
  });
}

/* -------------------------------------------------------------------------- */
/*  API publique – fonctions exportées                                         */
/* -------------------------------------------------------------------------- */

export async function loadLeaderboardData() {
  return await fetchSortedEntries();
}

export function renderLeaderboardUI(entries) {
  renderLeaderboard(entries);
}

export async function initLeaderboard() {
  const sorted = await loadLeaderboardData();
  renderLeaderboardUI(sorted);
}