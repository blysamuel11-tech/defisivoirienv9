import { Challenge, AppNotification, UserProfile } from '../types';

export const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&auto=format&fit=crop&q=80';

export const INITIAL_USER: UserProfile = {
  id: 'user-default',
  name: '',
  avatar: DEFAULT_AVATAR,
  auraColor: 'orange',
  score: 0,
  rank: 'NOVICE',
  isLoggedIn: true,
  hasProfile: false,
};

export const INITIAL_AVATARS = [
  {
    id: 'cat-sunglasses',
    name: 'Cool Cat',
    url: DEFAULT_AVATAR,
    tags: ['Lunettes', 'Stylé', 'Félin']
  },
  {
    id: 'border-collie',
    name: 'Border Collie',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=80',
    tags: ['Loyal', 'Joueur', 'Canin']
  },
  {
    id: 'rabbit-garden',
    name: 'Lapin Zen',
    url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=300&auto=format&fit=crop&q=80',
    tags: ['Mignon', 'Agile', 'Nature']
  },
  {
    id: 'lion-king',
    name: 'Lion Majestueux',
    url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=300&auto=format&fit=crop&q=80',
    tags: ['Chef', 'Puissant', 'Sauvage']
  },
  {
    id: 'neon-panther',
    name: 'Panthère Noire',
    url: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=300&auto=format&fit=crop&q=80',
    tags: ['Mystère', 'Vitesse', 'Féroce']
  },
  {
    id: 'party-fox',
    name: 'Renard Rusé',
    url: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?w=300&auto=format&fit=crop&q=80',
    tags: ['Malin', 'Festif', 'Intelligent']
  }
];

export const INITIAL_CHALLENGES: Challenge[] = [
  // Simple Vérités
  {
    id: 'v-1',
    text: 'Si tu pouvais changer de prénom, lequel choisirais-tu ?',
    textEn: 'If you could change your first name, which one would you choose?',
    type: 'vérité',
    intensity: 'simple',
    playsCount: 1420,
    author: 'Gbê Master'
  },
  {
    id: 'v-2',
    text: 'Quelle est la chanson la plus honteuse que tu adores ?',
    textEn: 'What is the most embarrassing song you secretly love?',
    type: 'vérité',
    intensity: 'simple',
    playsCount: 1150,
    author: 'Samuel Bly'
  },
  {
    id: 'v-3',
    text: 'Quel est ton plus grand secret inavoué ?',
    textEn: 'What is your biggest unspoken secret?',
    type: 'vérité',
    intensity: 'simple',
    playsCount: 1240,
    author: 'Communauté'
  },
  {
    id: 'v-4',
    text: 'Quelle est ta plus grande phobie absurde ?',
    textEn: 'What is your most absurd irrational fear?',
    type: 'vérité',
    intensity: 'simple',
    playsCount: 780,
    author: 'Gbê Master'
  },
  {
    id: 'v-5',
    text: 'Quel est le pire cadeau que tu aies jamais reçu et qu’as-tu fait avec ?',
    textEn: 'What is the worst gift you have ever received and what did you do with it?',
    type: 'vérité',
    intensity: 'simple',
    playsCount: 650,
    author: 'Gbê Master'
  },

  // Osée Vérités
  {
    id: 'vo-1',
    text: 'As-tu déjà eu un crush secret sur quelqu’un présent dans cette pièce ?',
    textEn: 'Have you ever had a secret crush on someone currently in this room?',
    type: 'vérité',
    intensity: 'osée',
    playsCount: 2310,
    author: 'Gbê Master'
  },
  {
    id: 'vo-2',
    text: 'Quel est ton souvenir de premier baiser le plus gênant ou mémorable ?',
    textEn: 'What is your most awkward or memorable first kiss memory?',
    type: 'vérité',
    intensity: 'osée',
    playsCount: 1890,
    author: 'Samuel Bly'
  },
  {
    id: 'vo-3',
    text: 'Quel est le message le plus chaud ou risqué que tu aies envoyé par erreur au mauvais destinataire ?',
    textEn: 'What is the spiciest text you accidentally sent to the wrong person?',
    type: 'vérité',
    intensity: 'osée',
    playsCount: 1650,
    author: 'Gbê Master'
  },

  // Simple Actions
  {
    id: 'a-1',
    text: 'Raconte une blague et si personne ne rit, fais 5 pompes.',
    textEn: 'Tell a joke, and if nobody laughs, do 5 push-ups.',
    type: 'action',
    intensity: 'simple',
    playsCount: 1320,
    author: 'Gbê Master'
  },
  {
    id: 'a-2',
    text: 'Imite un professeur ou une célébrité connue pendant 1 minute.',
    textEn: 'Impersonate a teacher or famous celebrity for 1 minute.',
    type: 'action',
    intensity: 'simple',
    playsCount: 500,
    author: 'Samuel Bly'
  },
  {
    id: 'a-3',
    text: 'Fais 10 pompes d’une seule main (ou 15 pompes classiques bien propres).',
    textEn: 'Do 10 one-arm push-ups (or 15 clean standard push-ups).',
    type: 'action',
    intensity: 'simple',
    playsCount: 850,
    author: 'Gbê Master'
  },
  {
    id: 'a-4',
    text: 'Prends un selfie avec la grimace la plus bizarre possible et montre-le au groupe.',
    textEn: 'Take a selfie with the weirdest face possible and show it to everyone.',
    type: 'action',
    intensity: 'simple',
    playsCount: 940,
    author: 'Gbê Master'
  },

  // Osée Actions
  {
    id: 'ao-1',
    text: 'Chuchote une déclaration enflammée à l’oreille du joueur à ta gauche sans craquer ni rire.',
    textEn: 'Whisper a fiery declaration into the ear of the player to your left without laughing.',
    type: 'action',
    intensity: 'osée',
    playsCount: 1980,
    author: 'Gbê Master'
  },
  {
    id: 'ao-2',
    text: 'Fais une démonstration de danse sensuelle ou afrobeat au milieu de la pièce pendant 30 secondes.',
    textEn: 'Perform a sensual or afrobeat dance in the middle of the room for 30 seconds.',
    type: 'action',
    intensity: 'osée',
    playsCount: 1720,
    author: 'Samuel Bly'
  },
  {
    id: 'ao-3',
    text: 'Laisse la personne à ta droite choisir ta photo de profil pendant 1 tour.',
    textEn: 'Let the person on your right pick your profile picture for 1 round.',
    type: 'action',
    intensity: 'osée',
    playsCount: 1450,
    author: 'Gbê Master'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'MISE À JOUR STORE DISPONIBLE !',
    description: 'Une nouvelle version officielle v2.2.0 est prête sur Play Store et App Store. Clique pour vérifier !',
    date: 'Aujourd’hui',
    unread: true,
    targetTab: 'plus',
    actionType: 'open_settings',
  },
  {
    id: 'notif-2',
    title: 'MODE MULTIJOUEUR EN LIGNE',
    description: 'Crée un salon de jeu en direct avec tes amis et partagez vos confessions instantanées !',
    date: 'Aujourd’hui',
    unread: true,
    targetTab: 'multi',
    actionType: 'open_tab',
  },
  {
    id: 'notif-3',
    title: 'NOUVEAUX DÉFIS DANS LA BIBLIOTHÈQUE',
    description: 'Découvre les défis favoris et ajoute tes propres vérités et actions personnalisées !',
    date: 'Hier',
    unread: true,
    targetTab: 'biblio',
    actionType: 'open_tab',
  },
  {
    id: 'notif-4',
    title: 'PERSONNALISE TON AVATAR & AURA',
    description: 'Choisis ton style de profil, ton aura énergétique et brille lors de tes parties !',
    date: 'Il y a 2 jours',
    unread: false,
    targetTab: 'avatar',
    actionType: 'open_tab',
  },
];
