export type GameTab = 'solo' | 'multi' | 'avatar' | 'biblio' | 'plus';

export type ChallengeType = 'vérité' | 'action';
export type Intensity = 'simple' | 'osée';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  auraColor: string; // 'orange' | 'green' | 'teal' | 'purple'
  score: number;
  rank: string; // 'NOVICE', 'CONFIRMÉ', 'LÉGENDE DU GBÊ'
  email?: string;
  phone?: string;
  isGoogleLinked?: boolean;
  isLoggedIn?: boolean;
  isGuest?: boolean;
  hasProfile?: boolean;
}

export interface Challenge {
  id: string;
  text: string;
  textEn?: string;
  type: ChallengeType;
  intensity: Intensity;
  playsCount?: number;
  author?: string;
  isCustom?: boolean;
  createdAt?: string;
  isFavorite?: boolean;
}

export interface GameHistoryItem {
  id: string;
  challengeText: string;
  type: ChallengeType;
  status: 'relevé' | 'passé' | 'validé' | 'échec';
  points: number;
  time: string;
  answerText?: string;
  proofMedia?: string; // base64 / blob / placeholder url
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  auraColor: string;
  score: number;
  isHost: boolean;
  isTurn: boolean;
  status: string; // 'En ligne'
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  icon?: string;
  date: string;
  unread: boolean;
}

export interface AppSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  language: 'FR' | 'EN';
}
