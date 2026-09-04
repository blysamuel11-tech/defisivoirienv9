/**
 * Content moderation & anti-vulgarity filter
 * Section 9.1 of Cahier des Charges:
 * Automatically flags and blocks vulgar, hateful or inappropriate terms across
 * player usernames, solo confessions, custom challenges and multiplayer chat.
 */

const BLOCKED_TERMS = [
  // French offensive / vulgar terms
  'connard', 'connasse', 'salope', 'pute', 'putain', 'encule', 'enculer', 'fdp',
  'ntm', 'batard', 'merde', 'chienne', 'nique', 'niquer', 'salaud', 'abruti',
  'gueule', 'ta gueule', 'creve', 'suicide', 'pd', 'tapette', 'bouffon', 'trouduc',
  // English offensive terms
  'fuck', 'fucking', 'bitch', 'asshole', 'bastard', 'shit', 'cunt', 'dick',
  'motherfucker', 'nigger', 'nigga', 'whore', 'slut', 'fag', 'faggot', 'kill yourself'
];

export interface ModerationResult {
  isValid: boolean;
  blockedTerm?: string;
  warningMessage: string;
}

export function validateContentModeration(text: string, lang: string = 'FR'): ModerationResult {
  const isEn = lang?.toUpperCase() === 'EN';
  if (!text || typeof text !== 'string') {
    return {
      isValid: true,
      warningMessage: '',
    };
  }

  // Normalize text (lowercase, strip special chars/leetspeak)
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's');

  for (const term of BLOCKED_TERMS) {
    // Regex for word boundary or isolated segment
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(normalized) || normalized.includes(term)) {
      return {
        isValid: false,
        blockedTerm: term,
        warningMessage:
          isEn
            ? '⚠️ Warning: Your message contains inappropriate terms. Please rephrase in the spirit of friendly and respectful play.'
            : '⚠️ Attention : Votre texte contient des termes inappropriés. Merci de reformuler dans l’esprit convivial et respectueux du jeu.',
      };
    }
  }

  return {
    isValid: true,
    warningMessage: '',
  };
}
