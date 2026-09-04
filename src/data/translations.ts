// Comprehensive bilingual dictionary (FR / EN) for Gbê ou Moument

export interface Dictionary {
  // Navigation
  solo: string;
  multi: string;
  avatar: string;
  biblio: string;
  plus: string;

  // Header & Settings
  notifications: string;
  systemConfig: string;
  darkMode: string;
  lightMode: string;
  cyberAudio: string;
  audioEnabled: string;
  audioMuted: string;
  language: string;
  logout: string;
  tagline: string;

  // Solo View
  chooseChallengeType: string;
  verite: string;
  action: string;
  intensity: string;
  simpleIntensity: string;
  simpleDesc: string;
  oseeIntensity: string;
  oseeDesc: string;
  yourConfession: string;
  confessionPlaceholder: string;
  proofRequired: string;
  uploadFile: string;
  openCamera: string;
  sendAnswer: string;
  passChallenge: string;
  earnedPoints: string;
  challengePassed: string;

  // Multi View
  roomCode: string;
  copyCode: string;
  copied: string;
  joinRoom: string;
  createRoom: string;
  enterCode: string;
  launchGame: string;
  turnOf: string;
  yourTurn: string;
  waitingTurn: string;
  waitingVotes: string;
  votePrompt: string;
  voteOk: string;
  voteNotOk: string;
  hostPowerTitle: string;
  hostValidate: string;
  hostRefuse: string;
  voteEqualityTie: string;
  chatPlaceholder: string;
  sendChat: string;
  playersList: string;
  online: string;
  pendingRequests: string;
  accept: string;
  refuse: string;
  deleteMessage: string;

  // Avatar View
  pseudo: string;
  pseudoPlaceholder: string;
  chooseAvatar: string;
  importPhoto: string;
  auraColor: string;
  resetProfile: string;
  confirmIdentity: string;
  linkedAccounts: string;
  googleAccount: string;
  emailAccount: string;
  phoneAccount: string;
  connected: string;
  notLinked: string;
  linkGoogle: string;

  // Biblio View
  globalRank: string;
  sessionRank: string;
  veritesAnswered: string;
  actionsCompleted: string;
  challengesPassedStat: string;
  popularChallenges: string;
  communityLibrary: string;
  proposeChallenge: string;
  generateWithAi: string;
  publishChallenge: string;
  actsHistory: string;
  noActsYet: string;

  // Plus View
  shareAdventure: string;
  giveFeedback: string;
  rateApp: string;
  submitNote: string;
  creatorAbout: string;
  creatorSubtitle: string;
  creatorToggleShow: string;
  creatorToggleHide: string;
  creatorBio: string;
  copyright: string;
}

export const TRANSLATIONS: Record<'FR' | 'EN', Dictionary> = {
  FR: {
    solo: 'SOLO',
    multi: 'MULTI',
    avatar: 'AVATAR',
    biblio: 'BIBLIO',
    plus: 'PLUS',

    notifications: 'NOTIFICATIONS',
    systemConfig: 'CONFIGURATION SYSTÈME',
    darkMode: 'MODE SOMBRE',
    lightMode: 'MODE CLAIR',
    cyberAudio: 'AUDIO & SONS',
    audioEnabled: 'Activé',
    audioMuted: 'Coupé',
    language: 'LANGUE',
    logout: 'DÉCONNEXION',
    tagline: 'Défie tes limites, découvre les secrets de tes amis dans un univers haut en couleurs.',

    chooseChallengeType: 'CHOISIS TON ÉPREUVE',
    verite: 'VÉRITÉ',
    action: 'ACTION',
    intensity: 'INTENSITÉ',
    simpleIntensity: 'Simple',
    simpleDesc: 'Amicale, drôle, réfléchir',
    oseeIntensity: 'Osée',
    oseeDesc: 'Intime, frivole, sans limite',
    yourConfession: 'Ta confession sincère',
    confessionPlaceholder: 'Raconte toute la vérité ici sans détours...',
    proofRequired: 'Envoie ta preuve (photo, vidéo, document ou sticker)',
    uploadFile: 'Importer un fichier',
    openCamera: 'Prendre une photo',
    sendAnswer: 'J’ai relevé le défi !',
    passChallenge: 'Passer',
    earnedPoints: 'Points remportés',
    challengePassed: 'Défi passé',

    roomCode: 'Code du Salon',
    copyCode: 'Copier',
    copied: 'Copié !',
    joinRoom: 'Rejoindre',
    createRoom: 'Créer un salon',
    enterCode: 'Saisis le code à 5 caractères',
    launchGame: 'Lancer la partie',
    turnOf: 'Tour de',
    yourTurn: 'C’est ton tour !',
    waitingTurn: 'En attente du joueur actif...',
    waitingVotes: 'Votes des participants',
    votePrompt: 'Ce défi a-t-il été valablement accompli ?',
    voteOk: 'OK',
    voteNotOk: 'Pas OK',
    hostPowerTitle: 'Arbitrage Prioritaire de l’Hôte',
    hostValidate: 'Décision Hôte : Valider (+pts)',
    hostRefuse: 'Décision Hôte : Refuser (0 pt)',
    voteEqualityTie: 'Égalité des votes ! Le joueur doit rejouer un nouveau défi !',
    chatPlaceholder: 'Message au salon...',
    sendChat: 'Envoyer',
    playersList: 'Joueurs réels',
    online: 'En ligne',
    pendingRequests: 'Demandes d’accès en attente',
    accept: 'Accepter',
    refuse: 'Refuser',
    deleteMessage: 'Supprimer ce message',

    pseudo: 'Pseudo du joueur',
    pseudoPlaceholder: 'Choisis ton pseudo...',
    chooseAvatar: 'Choisis ton avatar animal',
    importPhoto: 'Importer ma propre photo',
    auraColor: 'Couleur de ton Aura',
    resetProfile: 'Réinitialiser Profil',
    confirmIdentity: 'Confirmer mon Identité',
    linkedAccounts: 'Sécurité & Comptes Liés',
    googleAccount: 'Compte Google / Gmail',
    emailAccount: 'Adresse Email',
    phoneAccount: 'Numéro de téléphone',
    connected: 'Lié',
    notLinked: 'Non lié',
    linkGoogle: 'SE CONNECTER AVEC GOOGLE / GMAIL',

    globalRank: 'Rang Global',
    sessionRank: 'Rang de Session',
    veritesAnswered: 'Vérités répondues',
    actionsCompleted: 'Actions réalisées',
    challengesPassedStat: 'Défis passés',
    popularChallenges: 'Contenus populaires',
    communityLibrary: 'Bibliothèque communautaire',
    proposeChallenge: 'Proposer un défi',
    generateWithAi: 'Générer avec l’IA',
    publishChallenge: 'Publier dans la communauté',
    actsHistory: 'Historique des actes',
    noActsYet: 'Aucun acte pour le moment. Lance ta première partie !',

    shareAdventure: 'PARTAGER L’AVENTURE',
    giveFeedback: 'DONNE TON AVIS',
    rateApp: 'Note sur 5',
    submitNote: 'ENVOYER MA NOTE',
    creatorAbout: 'À PROPOS DU CRÉATEUR',
    creatorSubtitle: 'SAMUEL EZECKIEL BLY (S.E.B)',
    creatorToggleShow: 'Afficher la présentation du créateur',
    creatorToggleHide: 'Masquer la présentation',
    creatorBio: 'Application conçue et orchestrée par SAMUEL EZECKIEL BLY (S.E.B) pour transcender les soirées festives et révéler l’authenticité des liens humains avec fun, élégance et frissons.',
    copyright: '© 2026 Gbê ou Moument',
  },

  EN: {
    solo: 'SOLO',
    multi: 'MULTI',
    avatar: 'AVATAR',
    biblio: 'LIBRARY',
    plus: 'MORE',

    notifications: 'NOTIFICATIONS',
    systemConfig: 'SYSTEM SETTINGS',
    darkMode: 'DARK MODE',
    lightMode: 'LIGHT MODE',
    cyberAudio: 'AUDIO & SOUNDS',
    audioEnabled: 'Enabled',
    audioMuted: 'Muted',
    language: 'LANGUAGE',
    logout: 'LOGOUT',
    tagline: 'Defy your limits, discover your friends secrets in a vibrant colorful universe.',

    chooseChallengeType: 'CHOOSE YOUR CHALLENGE',
    verite: 'TRUTH',
    action: 'DARE',
    intensity: 'INTENSITY',
    simpleIntensity: 'Mild',
    simpleDesc: 'Friendly, funny, thoughtful',
    oseeIntensity: 'Spicy',
    oseeDesc: 'Intimate, bold, boundary-free',
    yourConfession: 'Your sincere confession',
    confessionPlaceholder: 'Tell the whole truth here without hesitation...',
    proofRequired: 'Send your proof (photo, video, doc or sticker)',
    uploadFile: 'Upload a file',
    openCamera: 'Take a photo',
    sendAnswer: 'I did the challenge!',
    passChallenge: 'Pass',
    earnedPoints: 'Earned points',
    challengePassed: 'Challenge passed',

    roomCode: 'Room Code',
    copyCode: 'Copy',
    copied: 'Copied!',
    joinRoom: 'Join',
    createRoom: 'Create a room',
    enterCode: 'Enter 5-character room code',
    launchGame: 'Start Game',
    turnOf: 'Turn of',
    yourTurn: 'It’s your turn!',
    waitingTurn: 'Waiting for active player...',
    waitingVotes: 'Player Votes',
    votePrompt: 'Was this challenge accomplished properly?',
    voteOk: 'OK',
    voteNotOk: 'Not OK',
    hostPowerTitle: 'Host Priority Verdict',
    hostValidate: 'Host Decision: Validate (+pts)',
    hostRefuse: 'Host Decision: Reject (0 pt)',
    voteEqualityTie: 'Vote Tie! The player must replay another challenge!',
    chatPlaceholder: 'Message the room...',
    sendChat: 'Send',
    playersList: 'Live Players',
    online: 'Online',
    pendingRequests: 'Pending Access Requests',
    accept: 'Accept',
    refuse: 'Refuse',
    deleteMessage: 'Delete this message',

    pseudo: 'Player Username',
    pseudoPlaceholder: 'Choose your username...',
    chooseAvatar: 'Choose your animal avatar',
    importPhoto: 'Upload custom photo',
    auraColor: 'Your Aura Color',
    resetProfile: 'Reset Profile',
    confirmIdentity: 'Confirm My Identity',
    linkedAccounts: 'Security & Linked Accounts',
    googleAccount: 'Google / Gmail Account',
    emailAccount: 'Email Address',
    phoneAccount: 'Phone Number',
    connected: 'Linked',
    notLinked: 'Not linked',
    linkGoogle: 'SIGN IN WITH GOOGLE / GMAIL',

    globalRank: 'Global Rank',
    sessionRank: 'Session Rank',
    veritesAnswered: 'Truths answered',
    actionsCompleted: 'Dares completed',
    challengesPassedStat: 'Challenges passed',
    popularChallenges: 'Popular challenges',
    communityLibrary: 'Community library',
    proposeChallenge: 'Suggest a challenge',
    generateWithAi: 'Generate with AI',
    publishChallenge: 'Publish to community',
    actsHistory: 'Activity History',
    noActsYet: 'No activity yet. Start your first game!',

    shareAdventure: 'SHARE THE ADVENTURE',
    giveFeedback: 'LEAVE A REVIEW',
    rateApp: 'Rating out of 5',
    submitNote: 'SUBMIT MY RATING',
    creatorAbout: 'ABOUT THE CREATOR',
    creatorSubtitle: 'SAMUEL EZECKIEL BLY (S.E.B)',
    creatorToggleShow: 'Show creator presentation',
    creatorToggleHide: 'Hide presentation',
    creatorBio: 'Crafted and orchestrated by SAMUEL EZECKIEL BLY (S.E.B) to elevate party games and reveal authentic human connections with fun, style, and excitement.',
    copyright: '© 2026 Gbê ou Moument',
  },
};

// Global Rank calculation according to Section 7.1 of Cahier des Charges:
// Novice : 0 à 99 pts — « Découvre le jeu »
// Initié : 100 à 299 pts — « Commence à s'ouvrir »
// Expert : 300 à 599 pts — « Ne recule devant rien »
// Maître : 600 à 999 pts — « La vérité n'a plus de secret »
// Légende : 1000 pts et plus — « Le boss incontesté »
export function getGlobalRank(score: number, lang: 'FR' | 'EN'): { key: string; title: string; tier: number; badge: string; quote: string; color: string } {
  if (score >= 1000) {
    return {
      key: 'LÉGENDE',
      title: lang === 'FR' ? 'LÉGENDE' : 'LEGEND',
      tier: 5,
      badge: lang === 'FR' ? 'Diamant / Feu' : 'Diamond / Fire',
      quote: lang === 'FR' ? 'Le boss incontesté' : 'The undisputed boss',
      color: '#FF6A00',
    };
  }
  if (score >= 600) {
    return {
      key: 'MAÎTRE',
      title: lang === 'FR' ? 'MAÎTRE' : 'MASTER',
      tier: 4,
      badge: lang === 'FR' ? 'Émeraude' : 'Emerald',
      quote: lang === 'FR' ? 'La vérité n’a plus de secret' : 'Truth holds no secrets',
      color: '#10B981',
    };
  }
  if (score >= 300) {
    return {
      key: 'EXPERT',
      title: lang === 'FR' ? 'EXPERT' : 'EXPERT',
      tier: 3,
      badge: lang === 'FR' ? 'Or' : 'Gold',
      quote: lang === 'FR' ? 'Ne recule devant rien' : 'Backs down from nothing',
      color: '#F59E0B',
    };
  }
  if (score >= 100) {
    return {
      key: 'INITIÉ',
      title: lang === 'FR' ? 'INITIÉ' : 'INITIATE',
      tier: 2,
      badge: lang === 'FR' ? 'Argent' : 'Silver',
      quote: lang === 'FR' ? 'Commence à s’ouvrir' : 'Beginning to open up',
      color: '#94A3B8',
    };
  }
  return {
    key: 'NOVICE',
    title: lang === 'FR' ? 'NOVICE' : 'NOVICE',
    tier: 1,
    badge: lang === 'FR' ? 'Bronze' : 'Bronze',
    quote: lang === 'FR' ? 'Découvre le jeu' : 'Discovering the game',
    color: '#D97706',
  };
}
