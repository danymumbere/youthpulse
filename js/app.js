// js/app.js
"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Main Orchestrator (app.js)                                   */
/*  ES‑module, vanilla JS. Handles routing, Service Worker registration,       */
/*  UI module loading, global error handling and real‑world content display.   */
/* -------------------------------------------------------------------------- */

import { BADGES_CATALOG } from './badges.js';
import { data } from './data.js';
import {
  openDb,
  getScore,
  setScore,
  getUnlockedBadgeIds,
  setBadgeUnlocked,
  getLeaderboardEntries,
  addLeaderboardEntry,
  exportData,
  importData
} from './db.js';
import { showNetworkError } from './utils.js';
import { startGame } from './game.js';

/* -------------------------------------------------------------------------- */
/*  Global state & utilities                                                 */
/* -------------------------------------------------------------------------- */

const STATE = {
  currentUser: localStorage.getItem('youthpulse_username') || 'Anonyme',
  gameCompleted: false,
  durationSec: 0,
  score: 0,
  sharesCount: parseInt(localStorage.getItem('youthpulse_shares') || '0', 10)
};

function persistState() {
  try {
    localStorage.setItem('youthpulse_username', STATE.currentUser);
    localStorage.setItem('youthpulse_shares', String(STATE.sharesCount));
  } catch (e) {
    console.warn('LocalStorage unavailable', e);
  }
}

/* -------------------------------------------------------------------------- */
/*  Service Worker registration (offline fallback)                            */
/* -------------------------------------------------------------------------- */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./sw.js')
    .catch(err => {
      console.error('Service Worker registration failed – offline mode unavailable', err);
      showNetworkError('Le mode hors ligne ne peut pas être activé.');
    });
}

/* -------------------------------------------------------------------------- */
/*  Routing & section initialization                                          */
/* -------------------------------------------------------------------------- */

const sectionMap = {
  home: initHome,
  game: initGame,
  badges: initBadges,
  leaderboard: initLeaderboard,
  videos: initVideos,
  memes: initMemes,
  share: initShare,
  offline: initOffline
};

function showSection(id) {
  // hide all sections
  document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.remove('hidden');
    (sectionMap[id] || (() => {}))();
  } else {
    // fallback to home
    document.getElementById('home')?.classList.remove('hidden');
    initHome();
  }
}

function route() {
  const hash = window.location.hash || '#/home';
  showSection(hash.replace('#', ''));
}

// expose routing for hash changes
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

/* -------------------------------------------------------------------------- */
/*  Section initializers (UI setup)                                           */
/* -------------------------------------------------------------------------- */

function initHome() {
  const btn = document.getElementById('startGameBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.hash = '#/game';
      // start game after UI transition
      setTimeout(startGameSession, 120);
    });
  }
}

async function startGameSession() {
  try {
    // reveal game UI
    document.getElementById('game')?.classList.remove('hidden');
    // launch the 2‑3 minute mini‑game (client‑side only)
    const result = await startGame(); // expected { score: number, durationSec: number }
    // update global context
    STATE.gameCompleted = true;
    STATE.score = result.score;
    STATE.durationSec = result.durationSec;
    // persist score
    await setScore(result.score);
    // unlock badges based on new state
    await checkAndUnlockBadges();
    // add to leaderboard
    await addLeaderboardEntry(STATE.currentUser, result.score);
    // show completion toast with timestamp
    showCompletionToast(result.score, result.durationSec);
    // return to home after a brief pause
    setTimeout(() => {
      window.location.hash = '#/home';
    }, 3000);
  } catch (err) {
    console.error('Game session error', err);
    showNetworkError('Le jeu a rencontré une erreur.');
  }
}

function showCompletionToast(score, duration) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  const now = new Date();
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  toast.innerHTML = `<p>Jeu terminé ! Score : ${score} en ${duration} s (${timeStr})</p>`;
  document.body.appendChild(toast);
  // remove after 3 seconds
  setTimeout(() => toast.remove(), 3000);
}

async function checkAndUnlockBadges() {
  const unlockedIds = await getUnlockedBadgeIds();
  for (const badge of BADGES_CATALOG) {
    if (!unlockedIds.includes(badge.id) && badge.condition(STATE)) {
      await setBadgeUnlocked(badge.id, STATE);
    }
  }
}

async function initBadges() {
  const list = document.getElementById('badgesList');
  if (!list) return;
  list.innerHTML = '';
  const unlockedIds = await getUnlockedBadgeIds();
  BADGES_CATALOG.forEach(badge => {
    const item = document.createElement('div');
    item.className = 'badge';
    item.innerHTML = `
      <span class="badge-icon" aria-hidden="true">${badge.icon}</span>
      <div class="badge-info">
        <h3>${badge.name}</h3>
        <p>${badge.description}</p>
      </div>
    `;
    if (unlockedIds.includes(badge.id)) item.classList.add('unlocked');
    list.appendChild(item);
  });
}

async function initLeaderboard() {
  const list = document.getElementById('leaderboardList');
  if (!list) return;
  list.innerHTML = '';
  const entries = await getLeaderboardEntries();
  entries.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.name}: ${entry.score}`;
    list.appendChild(li);
  });
}

function initVideos() {
  const feed = document.getElementById('videoFeed');
  if (!feed) return;
  feed.innerHTML = '';
  data.testimonies.forEach(test => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
      <video poster="img/video-poster.jpg" controls preload="none">
        <source src="videos/${test.id}.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div class="caption">
        <p>“${test.quote}”</p>
        <p class="author">— ${test.author}</p>
        <p class="context">${test.context}</p>
      </div>
    `;
    feed.appendChild(card);
  });
}

function initMemes() {
  const editor = document.getElementById('memeEditor');
  if (!editor) return;
  editor.innerHTML = '';

  // template selector
  const select = Object.assign(document.createElement('select'), { className: 'meme-select' });
  select.innerHTML = '<option value="">Choisir un modèle</option>';
  data.memeTemplates.forEach(tmpl => {
    const opt = document.createElement('option');
    opt.value = tmpl.id;
    opt.textContent = `${tmpl.top} / ${tmpl.bottom}`;
    select.appendChild(opt);
  });
  editor.appendChild(select);

  const topInput = Object.assign(document.createElement('input'), {
    type: 'text',
    className: 'meme-input',
    placeholder: 'Texte supérieur'
  });
  const bottomInput = Object.assign(document.createElement('input'), {
    type: 'text',
    className: 'meme-input',
    placeholder: 'Texte inférieur'
  });
  const preview = Object.assign(document.createElement('img'), {
    className: 'meme-preview',
    alt: 'Aperçu du mème'
  });

  editor.appendChild(topInput);
  editor.appendChild(bottomInput);
  editor.appendChild(preview);

  select.addEventListener('change', () => {
    const tmpl = data.memeTemplates.find(t => t.id === select.value);
    if (tmpl) {
      topInput.value = tmpl.top;
      bottomInput.value = tmpl.bottom;
      preview.src = tmpl.image;
    }
  });

  const shareBtn = document.getElementById('shareMemeBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => shareMemeViaApp(topInput.value, bottomInput.value, select.value, preview.src));
  }
}

function shareMemeViaApp(topText, bottomText, templateId, imageUrl) {
// increment share counter
  STATE.sharesCount += 1;
  persistState();
// build
  const payload = {
    topText,
    bottomText,
    templateId,
    imageUrl,
    timestamp: Date.now()
  };
  // send to server via API
  shareMemePayload(payload);
  // show feedback
  showShareToast('Mème partagé !');