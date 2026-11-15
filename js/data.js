"use strict";

/**
 * Contenu intégré pour YouthPulse.
 * Contient des témoignages vidéo, des modèles de mèmes, des définitions de badges,
 * des citations scripturaires et des chaînes d'interface utilisateur localisées.
 * Toutes les données sont stockées ici pour éviter les appels API externes et garantir la disponibilité hors ligne.
 */

export const data = {
  // ---------------------------------------------------------------------------
  // Témoignages – courts témoignages vidéo de jeunes de Kinshasa (5‑10 éléments).
  // ---------------------------------------------------------------------------
  testimonies: [
    {
      id: "t1",
      quote: "Quand j'ai commencé à coder, je pouvais transformer une idée en une application qui aide mon quartier.",
      author: "Aline K., 18, Kinshasa",
      context: "Étudiante en informatique, elle a créé un outil de cartographie communautaire."
    },
    {
      id: "t2",
      quote: "Le plus grand défi est l'accès fiable à l'électricité pour continuer à apprendre en ligne.",
      author: "Tshombe M., 19, Kinshasa",
      context: "Étudiant en deuxième année, il utilise son téléphone pour des cours en ligne."
    },
    {
      id: "t3",
      quote: "Je rêve de créer une plateforme où les jeunes peuvent partager leurs talents sans frontières.",
      author: "Fifi L., 17, Kinshasa",
      context: "Musicienne débutante, elle espère diffuser sa musique régionalement."
    },
    {
      id: "t4",
      quote: "Le COVID-19 a montré à quel point nous avons besoin de connexions solides et fiables.",
      author: "Kofi D., 20, Kinshasa",
      context: "Étudiant en santé, il milite pour de meilleures infrastructures numériques."
    },
    {
      id: "t5",
      quote: "Mon mentor m'a appris que chaque bug est une occasion d'apprendre.",
      author: "Nadia S., 19, Kinshasa",
      context: "Développeuse en herbe, elle participe à des meetups de codage communautaires."
    },
    {
      id: "t6",
      quote: "J'aime utiliser la technologie pour préserver notre langue et notre culture.",
      author: "Bobo M., 21, Kinshasa",
      context: "Étudiant en linguistique, il développe une application d'apprentissage des langues."
    },
    {
      id: "t7",
      quote: "Avec une bonne idée et un peu de détermination, on peut changer les choses.",
      author: "Esther U., 18, Kinshasa",
      context: "Fondatrice d'une startup étudiante, elle travaille sur une plateforme d'échange de compétences."
    },
    {
      id: "t8",
      quote: "La musique est ma thérapie ; j'espère qu'un jour elle atteindra un public mondial.",
      author: "Kango P., 22, Kinshasa",
      context: "Artiste musical indépendant, il produit des morceaux inspirés de la vie urbaine."
    }
  ],

  // ---------------------------------------------------------------------------
  // Données de modèles de mèmes – paires de texte de haut et de bas simples (au moins 12).
  // ---------------------------------------------------------------------------
  memeTemplates: [
    { id: "m1", top: "Quand la vie ", bottom: "est impitoyable.", image: "img/meme1.jpg" },
    { id: "m2", top: "À ton avis, ", bottom: "c'est quoi le problème ?", image: "img/meme2.jpg" },
    { id: "m3", top: "Quand tu ouvres ", bottom: "le code source et que tout est en ordre.", image: "img/meme3.jpg" },
    { id: "m4", top: "Moi vs. mon cerveau ", bottom: "en 2 AM.", image: "img/meme4.jpg" },
    { id: "m5", top: "Quand ton projet ", bottom: "fonctionne du premier coup.", image: "img/meme5.jpg" },
    { id: "m6", top: "À toi de jouer ", bottom: "(pas de pression).", image: "img/meme6.jpg" },
    { id: "m7", top: "Bug trouvé ", bottom: "solution : café.", image: "img/meme7.jpg" },
    { id: "m8", top: "Mon code est ", bottom: "tellement meilleur que le tien.", image: "img/meme8.jpg" },
    { id: "m9", top: "Quand tu vois ", bottom: "ton nom dans les crédits.", image: "img/meme9.jpg" },
    { id: "m10", top: "Mode développement ", bottom: "activé.", image: "img/meme10.jpg" },
    { id: "m11", top: "À toi de coder ", bottom: "cette fonctionnalité.", image: "img/meme11.jpg" },
    { id: "m12", top: "Quand le délai ", bottom: "de livraison approche.", image: "img/meme12.jpg" }
  ],

  // ---------------------------------------------------------------------------
  // Catalogue de badges – définitions statiques (correspondant à badges.js).
  // ---------------------------------------------------------------------------
  badgeCatalog: [
    { id: "first-win", name: "First Win", description: "Complétez votre premier mini-jeu.", icon: "🏆" },
    { id: "speed-demon", name: "Speed Demon", description: "Terminez le jeu en moins de 90 secondes.", icon: "⚡" },
    { id: "perfect", name: "Perfect", description: "Obtenez un score parfait sans faute.", icon: "💯" },
    { id: "explorer", name: "Explorer", description: "Visitez les pages Vidéos, Memes et Classement.", icon: "🔍" },
    { id: "share-champ", name: "Share Champion", description: "Partagez un mème via WhatsApp, Facebook ou TikTok.", icon: "📤" },
    { id: "offline-hero", name: "Offline Hero", description: "Utilisez l'application hors ligne grâce au Service Worker.", icon: "📴" },
    { id: "mobile-master", name: "Mobile Master", description: "Terminez le jeu sur un appareil de largeur ≤ 480 px.", icon: "📱" },
    { id: "steward", name: "Steward", description: "Exportez votre progression en JSON depuis les Paramètres.", icon: "📃" }
  ],

  // ---------------------------------------------------------------------------
  // Citations scripturaires – domaine public (au moins 5).
  // ---------------------------------------------------------------------------
  scriptureQuotes: [
    { id: "b1", text: "La charité se fait sans ostentation.", source: "Évangile selon Jean 13:34" },
    { id: "b2", text: "Ce n'est pas ce que l'homme voit qui compte, mais ce que l'homme est.", source: "Saint Paul, Éphésiens 6:12" },
    { id: "b3", text: "Apprends à être humble et à servir Dieu de tout ton cœur.", source: "Psaume 23:1" },
    { id: "b4", text: "Celui qui cherche à comprendre doit d'abord se taire.", source: "Proverbes 3:5" },
    { id: "b5", text: "Fais aux autres ce que tu voudrais qu'ils te fassent.", source: "Matthieu 7:12" }
  ],

  // ---------------------------------------------------------------------------
  // Données de légendes de mèmes – paires de texte prédéfinies (au moins 7).
  // ---------------------------------------------------------------------------
  memeCaptionsData: [
    { id: "c1", top: "Quand le café ", bottom: "n'est plus une option." },
    { id: "c2", top: "Mon cerveau ", bottom: "essaie de compiler." },
    { id: "c3", top: "Quand ton code ", bottom: "fonctionne du premier coup." },
    { id: "c4", top: "À toi de jouer ", bottom: "sur le marché du travail." },
    { id: "c5", top: "Bug trouvé ", bottom: "solution : plus de café." },
    { id: "c6", top: "Quand le deadline ", bottom: "arrive en fanfare." },
    { id: "c7", top: "Mon code est ", bottom: "tellement plus propre que le tien." }
  ],

  // ---------------------------------------------------------------------------
  // Localisations d'interface utilisateur – chaînes en français pour l'application.
  // ---------------------------------------------------------------------------
  localizations: {
    nav: {
      home: "Accueil",
      badges: "Badges",
      videos: "Vidéos",
      memes: "Memes",
      leaderboard: "Classement",
      settings: "Paramètres"
    },
    game: {
      start: "Commencer le jeu",
      timeLeft: "Temps restant : {seconds}s",
      score: "Score : {score}",
      mistakes: "Erreurs : {mistakes}",
      target: "Cible"
    },
    completion: {
      title: "Jeu terminé !",
      scoreLabel: "Votre score :",
      share: "Partagez votre résultat",
      close: "Fermer"
    },
    badgesPanel: {
      title: "Vos Badges",
      empty: "Aucun badge débloqué pour le moment.",
      earned: "Débloqué le {date}"
    },
    leaderboard: {
      title: "Classement Local",
      rank: "Rang",
      user: "Utilisateur",
      score: "Score",
      noData: "Aucune donnée de classement disponible."
    },
    videos: {
      title: "Témoignages de Jeunes de Kinshasa",
      play: "Lire la vidéo",
      mute: "Muet",
      unmute: "Activer le son"
    },
    memes: {
      title: "Générateur de Mèmes",
      topText: "Texte supérieur",
      bottomText: "Texte inférieur",
      generate: "Générer le mème",
      preview: "Aperçu du mème",
      share: "Partager le mème",
      download: "Télécharger le mème"
    },
    share: {
      whatsapp: "WhatsApp",
      facebook: "Facebook",
      tiktok: "TikTok",
      copyLink: "Copier le lien",
      success: "Lien partagé !"
    },
    settings: {
      title: "Paramètres",
      exportProgress: "Exporter la progression en JSON",
      importProgress: "Importer la progression",
      clearData: "Effacer les données locales",
      confirmClear: "Êtes-vous sûr de vouloir effacer toutes les données ?",
      language: "Langue",
      theme: "Thème",
      themeLight: "Clair",
      themeDark: "Sombre"
    },
    offline: {
      banner: "Vous êtes hors ligne. Certaines fonctionnalités sont limitées.",
      retry: "Réessayer"
    },
    notifications: {
      error: "Une erreur est survenue. Veuillez réessayer.",
      success: "Opération réussie."
    }
  }
};

/* -------------------------------------------------------------------------- */
/* Fonctions utilitaires nommées pour un accès facile depuis d'autres modules.   */
/* -------------------------------------------------------------------------- */
export function getTestimonies() {
  return data.testimonies;
}

export function getMemeTemplates() {
  return data.memeTemplates;
}

export function getBadgeCatalog() {
  return data.badgeCatalog;
}

export function getScriptureQuotes() {
  return data.scriptureQuotes;
}

export function getMemeCaptionsData() {
  return data.memeCaptionsData;
}

export function getLocalizations() {
  return data.localizations;
}