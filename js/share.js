// js/share.js
"use strict";

/* -------------------------------------------------------------------------- */
/*  YouthPulse – Share Module                                                */
/*  ES‑module, vanilla JS. Provides Web Share API integration and pre‑filled   */
/*  share URLs for WhatsApp, Facebook and TikTok. All share functions handle  */
/*  errors gracefully and display user‑friendly messages via utils.          */
/* -------------------------------------------------------------------------- */

import { showNetworkError } from './utils.js';

/* -------------------------------------------------------------------------- */
/*  Constants & Helpers                                                      */
/* -------------------------------------------------------------------------- */

const TRACKING_SOURCE = 'YouthPulse';
const SHARE_PARAM_PREFIX = '?src=' + encodeURIComponent(TRACKING_SOURCE);

/**
 * Build a share‑ready URL for a given platform.
 * @param {string} platform - one of 'whatsapp', 'facebook', 'tiktok'
 * @param {string} content - the text or URL to share (already encoded if needed)
 * @returns {string} Full share URL
 */
function buildShareUrl(platform, content) {
  const encoded = encodeURIComponent(content);
  switch (platform) {
    case 'whatsapp':
      // WhatsApp uses the `text` query parameter for pre‑filled messages.
      return `https://api.whatsapp.com/send${SHARE_PARAM_PREFIX}&text=${encoded}`;
    case 'facebook':
      // Facebook sharer expects a `u` parameter (the URL to share).
      return `https://www.facebook.com/sharer/sharer.php${SHARE_PARAM_PREFIX}&u=${encoded}`;
    case 'tiktok':
      // TikTok share dialog (mobile/web) accepts a `url` parameter.
      return `https://www.tiktok.com/share/url${SHARE_PARAM_PREFIX}&url=${encoded}`;
    default:
      return '#';
  }
}

/* -------------------------------------------------------------------------- */
/*  Native Share API wrapper                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Attempt to use the native Web Share API. If unavailable, fall back to the
 * platform‑specific helpers.
 * @param {object} options - { title, text, url }
 */
export function shareViaWebShare({ title, text, url }) {
  try {
    if (navigator.share) {
      navigator.share({ title, text, url })
        probably .catch((err) => {
          console.warn('Web Share API share cancelled or failed:', err);
        });
      return;
    }
    // No native share API – show a friendly error.
    showNetworkError('Le partage natif n’est pas disponible sur cet appareil.');
  } catch (err) {
    console.error('Erreur lors de l’utilisation de l’API de partage :', err);
    showNetworkError('Impossible d’ouvrir le partage.');
  }
}

/* -------------------------------------------------------------------------- */
/*  Platform‑specific share helpers                                           */
/* -------------------------------------------------------------------------- */

/**
 * Open WhatsApp with a pre‑filled message.
 * @param {string} message - The message text to share.
 */
export function shareToWhatsApp(message) {
  try {
    const url = buildShareUrl('whatsapp', message);
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
    else throw new Error('Invalid platform');
  } catch (err) {
    console.error('Impossible d’ouvrir l’URL de partage WhatsApp :', err);
    showNetworkError('Impossible d’ouvrir WhatsApp.');
  }
}

/**
 * Open Facebook sharer dialog with the given URL.
 * @param {string} pageUrl - The URL of the page/content to share.
 */
export function shareToFacebook(pageUrl) {
  try {
    const url = buildShareUrl('facebook', pageUrl);
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
    else throw new Error('Invalid platform');
  } catch (err) {
    console.error('Impossible d’ouvrir l’URL de partage Facebook :', err);
    showNetworkError('Impossible d’ouvrir Facebook.');
  }
}

/**
 * Open TikTok share dialog with the given URL.
 * @param {string} pageUrl - The URL of the page/content to share.
 */
export function shareToTikTok(pageUrl) {
  try {
    const url = buildShareUrl('tiktok', pageUrl);
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
    else throw new Error('Invalid platform');
  } catch (err) {
    console.error('Impossible d’ouvrir l’URL de partage TikTok :', err);
    showNetworkError('Impossible d’ouvrir TikTok.');
  }
}

/* -------------------------------------------------------------------------- */
/*  High‑level meme sharing                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Prepare a meme for sharing. Builds a concise description that includes the
 * top and bottom text, then triggers the appropriate share flow.
 * @param {object} meme - Meme data from data.js (must contain `top`, `bottom`,
 *                        and `image` properties).
 */
export function shareMeme(meme) {
  if (!meme || typeof meme !== 'object') {
    showNetworkError('Données de meme invalides.');
    return;
  }

  const { top, bottom, image } = meme;
  const title = 'YouthPulse – Meme pour la communauté';
  const text = `${top} – ${bottom}`;
  const url = `${window.location.origin}/?meme=${encodeURIComponent(image)}&top=${encodeURIComponent(top)}&bottom=${encodeURIComponent(bottom)}`;

  // Prefer the native share sheet first.
  shareViaWebShare({ title, text, url });

  // If Web Share API is not available, fall back to platform‑specific buttons.
  // The UI will call shareToWhatsApp, shareToFacebook or shareToTikTok directly.
}