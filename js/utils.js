// js/utils.js
"use strict";

/**
 * Utilitaires pour YouthPulse.
 * Fournit des wrappers pour le stockage local, une boucle d'animation simple
 * et la détection de l'état hors ligne. Toutes les fonctions sont exportées
 * sous forme de valeurs nommées pour une utilisation dans d'autres modules.
 */

/**
 * ---------------------------------------------------------------------------
 * Stockage local sécurisé (localStorage) avec gestion des erreurs.
 * ---------------------------------------------------------------------------
 */

/**
 * Enregistre une valeur dans le stockage local après l'avoir sérialisée en JSON.
 * @param {string} key - Clé de l'élément.
 * @param {any} value - Valeur à stocker.
 * @throws {Error} Si l'écriture échoue (ex. stockage plein).
 */
export function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`YouthPulse (utils): impossible d'écrire dans localStorage pour la clé "${key}"`, err);
    throw new Error('Le stockage local est plein ou non disponible.');
  }
}

/**
 * Récupère une valeur depuis le stockage local et la parse en tant que JSON.
 * @param {string} key - Clé de l'élément.
 * @param {any} [defaultValue] - Valeur retournée si la clé est absente ou en cas d'erreur.
 * @returns {any} Données analysées ou defaultValue.
 */
export function getLocal(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`YouthPulse (utils): erreur de lecture depuis localStorage pour la clé "${key}"`, err);
    return defaultValue;
  }
}

/**
 * Supprime une clé du stockage local.
 * @param {string} key - Clé à supprimer.
 */
export function removeLocal(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`YouthPulse (utils): impossible de supprimer la clé "${key}" de localStorage`, err);
  }
}

/**
 * Efface l'intégralité du stockage local de l'origine.
 */
export function clearLocal() {
  try {
    localStorage.clear();
  } catch (err) {
    console.error('YouthPulse (utils): impossible de vider localStorage', err);
    throw new Error('Impossible de vider le stockage local.');
  }
}

/**
 * ---------------------------------------------------------------------------
 * Boucle d'animation légère basée sur requestAnimationFrame.
 * ---------------------------------------------------------------------------
 */

/**
 * Démarre une boucle d'animation réutilisable.
 * @param {function(number): void} callback - Appelé à chaque frame avec l'horodatage actuel.
 * @returns {function(): void} Fonction d'arrêt qui annule le frame request suivant.
 */
export function startAnimationLoop(callback) {
  let frameId = null;

  function loop(timestamp) {
    if (!frameId) return; // arrêté
    callback(timestamp);
    frameId = requestAnimationFrame(loop);
  }

  frameId = requestAnimationFrame(loop);

  return function stop() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };
}

/**
 * ---------------------------------------------------------------------------
 * Détection de l'état en ligne/hors ligne et affichage d'erreurs réseau.
 * ---------------------------------------------------------------------------
 */

/**
 * Retourne true si le navigateur signale une connectivité active.
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Enregistre un gestionnaire pour l'événement `online`.
 * @param {function(): void} handler - Exécuté lorsque la connexion est rétablie.
 */
export function onOnline(handler) {
  window.addEventListener('online', handler);
}

/**
 * Enregistre un gestionnaire pour l'événement `offline`.
 * @param {function(): void} handler - Exécuté lorsque la connexion est perdue.
 */
export function onOffline(handler) {
  window.addEventListener('offline', handler);
}

/**
 * Affiche un message d'erreur réseau accessible dans un conteneur donné (ou le body).
 * Crée un élément `<div role="alert">` avec un style simple et visible.
 * @param {string} message - Message d'erreur à afficher.
 * @param {HTMLElement|null} [container] - Élément dans lequel le message sera inséré.
 */
export function showNetworkError(message, container = document.body) {
  const errDiv = document.createElement('div');
  errDiv.setAttribute('role', 'alert');
  errDiv.className = 'network-error';
  errDiv.textContent = message;

  // Style de base pour une visibilité claire sur tous les fonds
  Object.assign(errDiv.style, {
    position: 'fixed',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 20px',
    backgroundColor: '#d93025',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: '1000',
    pointerEvents: 'none',
  });

  (container || document.body).appendChild(errDiv);

  // Auto-supprime après 5 secondes
  setTimeout(() => {
    errDiv.remove();
  }, 5000);
}