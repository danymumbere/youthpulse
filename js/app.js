"use strict";

// Import des modules nécessaires
import { initGame } from './game.js';
import { initBadges } from './badges.js';
import { initLeaderboard } from './leaderboard.js';
import { initShare } from './share.js';
import { data } from './data.js';
import { showNetworkError } from './utils.js';
import { openDb } from './db.js';

// Initialisation de l'application
async function initApp() {
  try {
    // Initialisation de la base de données
    await openDb();

    // Initialisation des modules
    initGame();
    initBadges();
    initLeaderboard();
    initShare();

    // Affichage du contenu réel dès l'ouverture
    displayTestimonies();
    displayMemeTemplates();

    // Enregistrement du Service Worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed – offline mode unavailable', error);
      }
    }

    // Gestion de la navigation entre sections
    const sections = ['home', 'game', 'badges', 'leaderboard', 'videos', 'memes', 'share', 'offline'];
    sections.forEach(section => {
      const element = document.getElementById(section);
      if (element) {
        element.style.display = 'none';
      }
    });

    document.getElementById('home').style.display = 'block';

    document.getElementById('startGameBtn').addEventListener('click', () => {
      document.getElementById('home').style.display = 'none';
      document.getElementById('game').style.display = 'block';
    });

    document.getElementById('restartGameBtn').addEventListener('click', () => {
      document.getElementById('game').style.display = 'none';
      document.getElementById('home').style.display = 'block';
    });

    // Gestion des erreurs globales
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      showNetworkError('Une erreur est survenue. Veuillez réessayer.');
    });

  } catch (error) {
    console.error('Initialization error:', error);
    showNetworkError('Échec de l’initialisation de l’application.');
  }
}

// Affichage des témoignages
function displayTestimonies() {
  const videoFeed = document.getElementById('videoFeed');
  videoFeed.innerHTML = data.testimonies.map(testimony => `
    <div class="testimony">
      <p class="quote">« ${testimony.quote} »</p>
      <p class="author">— ${testimony.author}</p>
      <p class="context">${testimony.context}</p>
    </div>
  `).join('');
}

// Affichage des modèles de mèmes
function displayMemeTemplates() {
  const memeEditor = document.getElementById('memeEditor');
  memeEditor.innerHTML = data.memeTemplates.map(template => `
    <div class="meme-template">
      <img src="${template.image}" alt="Modèle de meme">
      <p class="top-text">${template.top}</p>
      <p class="bottom-text">${template.bottom}</p>
    </div>
  `).join('');
}

// Initialisation de l'application au chargement de la page
document.addEventListener('DOMContentLoaded', initApp);