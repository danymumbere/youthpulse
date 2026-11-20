// js/ui.js
"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – UI Rendering Module                                          */
/*  Gère le rendu des composants d'interface utilisateur (mèmes, vidéos,      */
/*  leaderboard, badges) et met à jour l'affichage du score.                  */
/* -------------------------------------------------------------------------- */

import { data } from './data.js';
import { getUnlockedBadgeIds } from './badges.js';
import { getLeaderboardEntries } from './db.js';

/* -------------------------------------------------------------------------- */
/*  Rendu de l'éditeur de mèmes                                               */
/*  Affiche les modèles de mèmes et permet la saisie de texte.                */
/* -------------------------------------------------------------------------- */
export function renderMemeEditor(memeTemplatesElement, memeTextTopElement, memeTextBottomElement, memePreviewElement) {
  const templates = data.memeTemplates;
  memeTemplatesElement.innerHTML = templates.map((template, index) => `
    <button type="button" class="meme-template" data-index="${index}">
      <img src="${template.image}" alt="Modèle ${index + 1}" loading="lazy">
    </button>
  `).join('');

  // Mise à jour de l'aperçu en temps réel
  const updatePreview = () => {
    const topText = memeTextTopElement.value.trim() || 'Texte haut';
    const bottomText = memeTextBottomElement.value.trim() || 'Texte bas';
    const templateIndex = memeTemplatesElement.querySelector('.selected')?.dataset.index || 0;
    const template = templates[templateIndex];

    memePreviewElement.innerHTML = `
      <div class="meme-preview-image" style="background-image: url(${template.image})">
        <div class="meme-text top">${topText}</div>
        <div class="meme-text bottom">${bottomText}</div>
      </div>
    `;
  };

  memeTemplatesElement.addEventListener('click', (e) => {
    if (e.target.classList.contains('meme-template')) {
      memeTemplatesElement.querySelector('.selected')?.classList.remove('selected');
      e.target.classList.add('selected');
      updatePreview();
    }
  });

  memeTextTopElement.addEventListener('input', updatePreview);
  memeTextBottomElement.addEventListener('input', updatePreview);

  // Initialisation avec le premier modèle
  memeTemplatesElement.querySelector('button')?.click();
}

/* -------------------------------------------------------------------------- */
/*  Rendu des modèles de mèmes (déjà géré par renderMemeEditor)               */
/* -------------------------------------------------------------------------- */
export function renderMemeTemplates(memeTemplatesElement) {
  // Déjà géré par renderMemeEditor
}

/* -------------------------------------------------------------------------- */
/*  Rendu de la liste des vidéos de témoignages                               */
/* -------------------------------------------------------------------------- */
export async function renderVideoList(videoListElement) {
  const videos = data.testimonies;
  videoListElement.innerHTML = videos.map(video => `
    <div class="video-item">
      <video controls poster="${video.poster || 'placeholder.jpg'}">
        <source src="${video.src}" type="video/mp4">
        Votre navigateur ne supporte pas les vidéos.
      </video>
      <div class="video-caption">
        <strong>${video.author}</strong>
        <p>${video.context}</p>
      </div>
    </div>
  `).join('');
}

/* -------------------------------------------------------------------------- */
/*  Rendu du leaderboard local                                                */
/* -------------------------------------------------------------------------- */
export async function renderLeaderboard(leaderboardListElement) {
  const entries = await getLeaderboardEntries();
  leaderboardListElement.innerHTML = entries.map((entry, index) => `
    <div class="leaderboard-entry">
      <span class="rank">${index + 1}.</span>
      <span class="score">${entry.score}</span>
      <span class="timestamp">${new Date(entry.timestamp).toLocaleDateString()}</span>
    </div>
  `).join('');
}

/* -------------------------------------------------------------------------- */
/*  Rendu du panneau de badges                                                */
/* -------------------------------------------------------------------------- */
export async function renderBadgesPanel(badgeListElement) {
  const unlockedIds = await getUnlockedBadgeIds();
  badgeListElement.innerHTML = data.badges.filter(badge => 
    unlockedIds.includes(badge.id)
  ).map(badge => `
    <div class="badge-item">
      <span class="badge-icon">${badge.icon}</span>
      <div class="badge-info">
        <strong>${badge.name}</strong>
        <p>${badge.description}</p>
      </div>
    </div>
  `).join('');
}

/* -------------------------------------------------------------------------- */
/*  Mise à jour de l'affichage du score                                       */
/* -------------------------------------------------------------------------- */
export async function updateScoreDisplay(scoreDisplayElement) {
  const score = await getScore();
  scoreDisplayElement.textContent = `${score} points`;
}