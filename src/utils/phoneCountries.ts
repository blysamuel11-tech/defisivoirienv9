export interface CountryPhoneConfig {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  minDigits: number;
  maxDigits: number;
  ruleDescription: string;
  formatMask: (digits: string) => string;
}

// Formatters helpers
const formatPairs = (digits: string): string => {
  return digits.match(/.{1,2}/g)?.join(' ') || digits;
};

const formatCI = (digits: string): string => {
  // Côte d'Ivoire: 10 chiffres -> 07 12 34 56 78
  return formatPairs(digits);
};

const formatFR = (digits: string): string => {
  // France: 10 chiffres -> 06 12 34 56 78 ou 9 chiffres -> 6 12 34 56 78
  if (digits.length <= 9 && !digits.startsWith('0')) {
    if (digits.length <= 1) return digits;
    const first = digits.slice(0, 1);
    const rest = digits.slice(1);
    const restPairs = rest.match(/.{1,2}/g)?.join(' ') || rest;
    return `${first} ${restPairs}`;
  }
  return formatPairs(digits);
};

const formatSN = (digits: string): string => {
  // Sénégal: 9 chiffres -> 77 123 45 67
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
};

const formatUS = (digits: string): string => {
  // USA / Canada: 10 chiffres -> (123) 456-7890
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const formatTN = (digits: string): string => {
  // Tunisie: 8 chiffres -> 20 123 456
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`;
};

const formatCM = (digits: string): string => {
  // Cameroun: 9 chiffres -> 6 71 23 45 67
  if (digits.length <= 1) return digits;
  const first = digits.slice(0, 1);
  const rest = digits.slice(1);
  return `${first} ${formatPairs(rest)}`;
};

const formatCD = (digits: string): string => {
  // RDC: 9 chiffres -> 81 234 5678
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
};

export const PHONE_COUNTRIES: CountryPhoneConfig[] = [
  // Afrique de l'Ouest
  {
    code: 'CI',
    name: "Côte d'Ivoire",
    dialCode: '+225',
    flag: '🇨🇮',
    placeholder: '07 12 34 56 78',
    minDigits: 10,
    maxDigits: 10,
    ruleDescription: "Norme ivoirienne : 10 chiffres obligatoires (ex: 01, 05, 07)",
    formatMask: formatCI,
  },
  {
    code: 'SN',
    name: 'Sénégal',
    dialCode: '+221',
    flag: '🇸🇳',
    placeholder: '77 123 45 67',
    minDigits: 9,
    maxDigits: 9,
    ruleDescription: 'Norme sénégalaise : 9 chiffres (ex: 70, 76, 77, 78)',
    formatMask: formatSN,
  },
  {
    code: 'BJ',
    name: 'Bénin',
    dialCode: '+229',
    flag: '🇧🇯',
    placeholder: '01 23 45 67 89',
    minDigits: 8,
    maxDigits: 10,
    ruleDescription: 'Norme béninoise : 8 ou 10 chiffres',
    formatMask: formatPairs,
  },
  {
    code: 'ML',
    name: 'Mali',
    dialCode: '+223',
    flag: '🇲🇱',
    placeholder: '76 12 34 56',
    minDigits: 8,
    maxDigits: 8,
    ruleDescription: 'Norme malienne : 8 chiffres',
    formatMask: formatPairs,
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    dialCode: '+226',
    flag: '🇧🇫',
    placeholder: '70 12 34 56',
    minDigits: 8,
    maxDigits: 8,
    ruleDescription: 'Norme burkinabè : 8 chiffres',
    formatMask: formatPairs,
  },
  {
    code: 'GN',
    name: 'Guinée',
    dialCode: '+224',
    flag: '🇬🇳',
    placeholder: '620 12 34 56',
    minDigits: 9,
    maxDigits: 9,
    ruleDescription: 'Norme guinéenne : 9 chiffres (ex: 620)',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      return `${d.slice(0, 3)} ${formatPairs(d.slice(3))}`;
    },
  },
  {
    code: 'TG',
    name: 'Togo',
    dialCode: '+228',
    flag: '🇹🇬',
    placeholder: '90 12 34 56',
    minDigits: 8,
    maxDigits: 8,
    ruleDescription: 'Norme togolaise : 8 chiffres',
    formatMask: formatPairs,
  },
  {
    code: 'NE',
    name: 'Niger',
    dialCode: '+227',
    flag: '🇳🇪',
    placeholder: '90 12 34 56',
    minDigits: 8,
    maxDigits: 8,
    ruleDescription: 'Norme nigérienne : 8 chiffres',
    formatMask: formatPairs,
  },
  {
    code: 'GH',
    name: 'Ghana',
    dialCode: '+233',
    flag: '🇬🇭',
    placeholder: '24 123 4567',
    minDigits: 9,
    maxDigits: 10,
    ruleDescription: 'Norme ghanéenne : 9 à 10 chiffres',
    formatMask: (d) => {
      if (d.length <= 2) return d;
      if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
    },
  },
  {
    code: 'NG',
    name: 'Nigéria',
    dialCode: '+234',
    flag: '🇳🇬',
    placeholder: '803 123 4567',
    minDigits: 10,
    maxDigits: 11,
    ruleDescription: 'Norme nigériane : 10 à 11 chiffres',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    },
  },

  // Afrique Centrale
  {
    code: 'CM',
    name: 'Cameroun',
    dialCode: '+237',
    flag: '🇨🇲',
    placeholder: '6 71 23 45 67',
    minDigits: 9,
    maxDigits: 9,
    ruleDescription: 'Norme camerounaise : 9 chiffres (ex: 6 5X, 6 7X, 6 9X)',
    formatMask: formatCM,
  },
  {
    code: 'GA',
    name: 'Gabon',
    dialCode: '+241',
    flag: '🇬🇦',
    placeholder: '062 12 34 56',
    minDigits: 8,
    maxDigits: 9,
    ruleDescription: 'Norme gabonaise : 8 ou 9 chiffres (ex: 062, 065)',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      return `${d.slice(0, 3)} ${formatPairs(d.slice(3))}`;
    },
  },
  {
    code: 'CG',
    name: 'Congo-Brazzaville',
    dialCode: '+242',
    flag: '🇨🇬',
    placeholder: '06 123 45 67',
    minDigits: 9,
    maxDigits: 9,
    ruleDescription: 'Norme congolaise : 9 chiffres (ex: 06)',
    formatMask: formatSN,
  },
  {
    code: 'CD',
    name: 'RD Congo (Kinshasa)',
    dialCode: '+243',
    flag: '🇨🇩',
    placeholder: '81 234 5678',
    minDigits: 9,
    maxDigits: 9,
    ruleDescription: 'Norme RDC : 9 chiffres (ex: 81, 82, 85, 99)',
    formatMask: formatCD,
  },
  {
    code: 'TD',
    name: 'Tchad',
    dialCode: '+235',
    flag: '🇹🇩',
    placeholder: '66 12 34 56',
    minDigits: 8,
    maxDigits: 8,
    ruleDescription: 'Norme tchadienne : 8 chiffres',
    formatMask: formatPairs,
  },
  {
    code: 'CF',
    name: 'Centrafrique',
    dialCode: '+236',
    flag: '🇨🇫',
    placeholder: '75 12 34 56',
    minDigits: 8,
    maxDigits: 8,
    ruleDescription: 'Norme centrafricaine : 8 chiffres',
    formatMask: formatPairs,
  },

  // Afrique du Nord
  {
    code: 'MA',
    name: 'Maroc',
    dialCode: '+212',
    flag: '🇲🇦',
    placeholder: '06 12 34 56 78',
    minDigits: 9,
    maxDigits: 10,
    ruleDescription: 'Norme marocaine : 9 ou 10 chiffres (ex: 06, 07)',
    formatMask: formatFR,
  },
  {
    code: 'DZ',
    name: 'Algérie',
    dialCode: '+213',
    flag: '🇩🇿',
    placeholder: '05 50 12 34 56',
    minDigits: 9,
    maxDigits: 10,
    ruleDescription: 'Norme algérienne : 9 ou 10 chiffres (ex: 05, 06, 07)',
    formatMask: formatFR,
  },
  {
    code: 'TN',
    name: 'Tunisie',
    dialCode: '+216',
    flag: '🇹🇳',
    placeholder: '20 123 456',
    minDigits: 8,
    maxDigits: 8,
    ruleDescription: 'Norme tunisienne : 8 chiffres (ex: 20, 50, 90)',
    formatMask: formatTN,
  },
  {
    code: 'MR',
    name: 'Mauritanie',
    dialCode: '+222',
    flag: '🇲🇷',
    placeholder: '45 12 34 56',
    minDigits: 8,
    maxDigits: 8,
    ruleDescription: 'Norme mauritanienne : 8 chiffres',
    formatMask: formatPairs,
  },

  // Afrique de l'Est & Océan Indien
  {
    code: 'MG',
    name: 'Madagascar',
    dialCode: '+261',
    flag: '🇲🇬',
    placeholder: '034 12 345 67',
    minDigits: 9,
    maxDigits: 10,
    ruleDescription: 'Norme malgache : 9 ou 10 chiffres (ex: 032, 034)',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
      if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
    },
  },
  {
    code: 'KM',
    name: 'Comores',
    dialCode: '+269',
    flag: '🇰🇲',
    placeholder: '321 23 45',
    minDigits: 7,
    maxDigits: 7,
    ruleDescription: 'Norme comorienne : 7 chiffres',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      return `${d.slice(0, 3)} ${formatPairs(d.slice(3))}`;
    },
  },
  {
    code: 'RW',
    name: 'Rwanda',
    dialCode: '+250',
    flag: '🇷🇼',
    placeholder: '788 123 456',
    minDigits: 9,
    maxDigits: 9,
    ruleDescription: 'Norme rwandaise : 9 chiffres (ex: 788)',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    },
  },
  {
    code: 'BI',
    name: 'Burundi',
    dialCode: '+257',
    flag: '🇧🇮',
    placeholder: '79 12 34 56',
    minDigits: 8,
    maxDigits: 8,
    ruleDescription: 'Norme burundaise : 8 chiffres',
    formatMask: formatPairs,
  },

  // Europe
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    flag: '🇫🇷',
    placeholder: '06 12 34 56 78',
    minDigits: 9,
    maxDigits: 10,
    ruleDescription: 'Norme française : 10 chiffres (avec 0) ou 9 chiffres (sans 0)',
    formatMask: formatFR,
  },
  {
    code: 'BE',
    name: 'Belgique',
    dialCode: '+32',
    flag: '🇧🇪',
    placeholder: '0470 12 34 56',
    minDigits: 9,
    maxDigits: 10,
    ruleDescription: 'Norme belge : 9 ou 10 chiffres (ex: 0470)',
    formatMask: (d) => {
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${formatPairs(d.slice(4))}`;
    },
  },
  {
    code: 'CH',
    name: 'Suisse',
    dialCode: '+41',
    flag: '🇨🇭',
    placeholder: '079 123 45 67',
    minDigits: 9,
    maxDigits: 10,
    ruleDescription: 'Norme suisse : 9 ou 10 chiffres (ex: 079)',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
    },
  },
  {
    code: 'GB',
    name: 'Royaume-Uni',
    dialCode: '+44',
    flag: '🇬🇧',
    placeholder: '07123 456789',
    minDigits: 10,
    maxDigits: 11,
    ruleDescription: 'Norme britannique : 10 ou 11 chiffres (ex: 07XXX)',
    formatMask: (d) => {
      if (d.length <= 5) return d;
      return `${d.slice(0, 5)} ${d.slice(5)}`;
    },
  },
  {
    code: 'DE',
    name: 'Allemagne',
    dialCode: '+49',
    flag: '🇩🇪',
    placeholder: '0151 1234567',
    minDigits: 10,
    maxDigits: 11,
    ruleDescription: 'Norme allemande : 10 ou 11 chiffres',
    formatMask: (d) => {
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4)}`;
    },
  },
  {
    code: 'ES',
    name: 'Espagne',
    dialCode: '+34',
    flag: '🇪🇸',
    placeholder: '612 34 56 78',
    minDigits: 9,
    maxDigits: 9,
    ruleDescription: 'Norme espagnole : 9 chiffres (ex: 6XX, 7XX)',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      return `${d.slice(0, 3)} ${formatPairs(d.slice(3))}`;
    },
  },
  {
    code: 'IT',
    name: 'Italie',
    dialCode: '+39',
    flag: '🇮🇹',
    placeholder: '320 123 4567',
    minDigits: 9,
    maxDigits: 10,
    ruleDescription: 'Norme italienne : 9 ou 10 chiffres (ex: 3XX)',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    },
  },
  {
    code: 'PT',
    name: 'Portugal',
    dialCode: '+351',
    flag: '🇵🇹',
    placeholder: '912 345 678',
    minDigits: 9,
    maxDigits: 9,
    ruleDescription: 'Norme portugaise : 9 chiffres (ex: 91, 92, 96)',
    formatMask: (d) => {
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    },
  },

  // Amériques
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    flag: '🇨🇦',
    placeholder: '(514) 234-5678',
    minDigits: 10,
    maxDigits: 10,
    ruleDescription: 'Norme nord-américaine (NANP) : 10 chiffres',
    formatMask: formatUS,
  },
  {
    code: 'US',
    name: 'États-Unis',
    dialCode: '+1',
    flag: '🇺🇸',
    placeholder: '(202) 555-0123',
    minDigits: 10,
    maxDigits: 10,
    ruleDescription: 'Norme nord-américaine (NANP) : 10 chiffres',
    formatMask: formatUS,
  },
];

// Helper to find country by dial code or country code
export const findCountryByCodeOrDial = (identifier: string): CountryPhoneConfig => {
  const found = PHONE_COUNTRIES.find(
    (c) => c.code.toUpperCase() === identifier.toUpperCase() || c.dialCode === identifier
  );
  return found || PHONE_COUNTRIES[0]; // default to Côte d'Ivoire
};

// Clean non-digits
export const extractOnlyDigits = (raw: string): string => {
  return raw.replace(/\D/g, '');
};

// Validate phone digits according to country standard
export interface PhoneValidationResult {
  isValid: boolean;
  errorMessage?: string;
  formattedNumber: string;
  fullInternationalNumber: string;
  digitsCount: number;
  expectedDigits: string;
}

export const validateAndFormatPhoneNumber = (
  country: CountryPhoneConfig,
  rawInput: string
): PhoneValidationResult => {
  const digits = extractOnlyDigits(rawInput).slice(0, country.maxDigits);
  const formattedNumber = country.formatMask(digits);
  const fullInternationalNumber = `${country.dialCode} ${formattedNumber}`.trim();
  const digitsCount = digits.length;

  const expectedDigits =
    country.minDigits === country.maxDigits
      ? `${country.minDigits} chiffres`
      : `${country.minDigits} à ${country.maxDigits} chiffres`;

  if (digitsCount === 0) {
    return {
      isValid: false,
      errorMessage: 'Veuillez saisir les chiffres de votre numéro de téléphone.',
      formattedNumber,
      fullInternationalNumber,
      digitsCount,
      expectedDigits,
    };
  }

  if (digitsCount < country.minDigits) {
    return {
      isValid: false,
      errorMessage: `Le numéro pour ${country.name} nécessite ${expectedDigits} (actuellement ${digitsCount}).`,
      formattedNumber,
      fullInternationalNumber,
      digitsCount,
      expectedDigits,
    };
  }

  // Specific country rules
  if (country.code === 'CI' && digitsCount !== 10) {
    return {
      isValid: false,
      errorMessage: "Le numéro ivoirien doit comporter exactement 10 chiffres selon la norme en vigueur (ex: 01, 05, 07).",
      formattedNumber,
      fullInternationalNumber,
      digitsCount,
      expectedDigits,
    };
  }

  return {
    isValid: true,
    formattedNumber,
    fullInternationalNumber,
    digitsCount,
    expectedDigits,
  };
};
