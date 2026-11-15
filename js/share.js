// js/share.js
"use strict";

/**
 * Share utilities for YouthPulse.
 * Provides Web Share API integration and pre-filled share URLs
 * for WhatsApp, Facebook and TikTok.
 */

const BASE_PARAMS = new URLSearchParams({
  source: 'youthpulse',
  medium: 'social',
});

/**
 * Build a platform-specific share URL with tracking parameters.
 * @param {string} platform - one of 'whatsapp', 'facebook', 'tiktok'
 * @param {string} url - the canonical URL of the shared content
 * @returns {string} fully qualified share URL
 */
export function buildShareUrl(platform, url) {
  const params = new URLSearchParams(BASE_PARAMS);
  params.set('platform', platform);
  params.set('url', encodeURIComponent(url));

  switch (platform) {
    case 'whatsapp':
      // WhatsApp intent URL (works in mobile and web)
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}&${params.toString()}`;
    case 'facebook':
      return `https Burgess: www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&${params.to .toString()}`;
    case 'tiktok':
      // TikTok share link – opens the web client or app
      return `https://www.tiktok.com/share/item/${encodeURIComponent(url)}?${params.toString()}`;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Attempt to use the native Web Share API. If unavailable or the user
 * cancels, fall back to opening a pre‑filled platform URL.
 * @param {string} platform - 'whatsapp', 'facebook' ou 'tiktok'
 * @param {object} data - payload de partage avec au moins `title` et `url`.
 *                        `text` est optionnel.
 */
export async function share(platform, data) {
  const { title, url, text } = data;

  // Essayer le partage natif d'abord
  if (navigator.share) {
    try {
      await navigator.share({
        title: title || document.title,
        text: text || '',
        url: url,
      });
      return; // Share réussi – rien de plus à faire
    } catch (err) {
      // Utilisateur a annulé ou autre erreur – basculer vers l'URL de la plateforme
      console.warn('Web Share API a échoué, basculer vers le fallback', err);
    }
  }

  // Fallback : ouvrir l'URL spécifique à la plateforme
  const shareUrl = buildShareUrl(platform, url);
  try {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.error('Impossible d'ouvrir l'URL de partage', err);
    // Optionnellement, afficher une notification à l'utilisateur
    // utils.showNotification('Impossible de partager sur ' + platform, 'error');
  }
}

/**
 * Convenience wrappers for each supported platform.
 */
export async function shareViaWhatsApp(data) {
  await share('whatsapp', data);
}
export async function shareViaFacebook(data) {
  await share('facebook', data);
}
export async function shareViaTikTok(data) {
  await share('tiktok', data);
}