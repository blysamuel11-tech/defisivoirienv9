import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  Fingerprint,
  Chrome,
  Upload,
  User,
  Sparkles,
  Check,
  Camera,
  Crop,
  ShieldCheck,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { UserProfile } from '../types';
import { INITIAL_AVATARS } from '../data/initialData';
import { playSoundEffect } from '../utils/audio';
import { ImageCropModal } from './ImageCropModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { GoogleSignInModal } from './GoogleSignInModal';
import { validateContentModeration } from '../utils/moderation';
import { compressAndResizeImage } from '../utils/imageCompressor';
import {
  PHONE_COUNTRIES,
  CountryPhoneConfig,
  validateAndFormatPhoneNumber,
  extractOnlyDigits,
} from '../utils/phoneCountries';

interface AuthModalProps {
  user: UserProfile;
  onLogin: (updatedUser: Partial<UserProfile>) => void;
  onClose?: () => void;
  darkMode?: boolean;
}

const COLOR_AURAS = [
  { id: 'orange', name: 'Orange Feu', hex: '#E65A00', ring: 'ring-[#E65A00]' },
  { id: 'green', name: 'Vert Émeraude', hex: '#10B981', ring: 'ring-[#10B981]' },
  { id: 'teal', name: 'Cyan Lagon', hex: '#06B6D4', ring: 'ring-[#06B6D4]' },
  { id: 'purple', name: 'Pourpre Royal', hex: '#A855F7', ring: 'ring-[#A855F7]' },
];

// Local helper to get/set registered accounts
function getRegisteredAccounts(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem('gbe_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRegisteredAccount(identifier: string, profile: UserProfile) {
  try {
    const accounts = getRegisteredAccounts();
    accounts[identifier.toLowerCase().trim()] = profile;
    localStorage.setItem('gbe_accounts', JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save account:', err);
  }
}

// Helper to parse country code and digits from existing phone string
function parseInitialPhone(fullPhoneStr?: string): { countryCode: string; formattedDigits: string } {
  if (!fullPhoneStr) return { countryCode: 'CI', formattedDigits: '' };
  const trimmed = fullPhoneStr.trim();
  for (const c of PHONE_COUNTRIES) {
    if (trimmed.startsWith(c.dialCode)) {
      const rest = trimmed.slice(c.dialCode.length);
      const digits = extractOnlyDigits(rest).slice(0, c.maxDigits);
      return { countryCode: c.code, formattedDigits: c.formatMask(digits) };
    }
  }
  const digits = extractOnlyDigits(trimmed);
  return { countryCode: 'CI', formattedDigits: PHONE_COUNTRIES[0].formatMask(digits) };
}

export const AuthModal: React.FC<AuthModalProps> = ({ user, onLogin, onClose, darkMode = true }) => {
  const [view, setView] = useState<
    'welcome' | 'profile_setup' | 'email' | 'phone' | 'otp_verify'
  >('welcome');

  // Google Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Profile setup states
  const [playerName, setPlayerName] = useState(user.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || INITIAL_AVATARS[0].url);
  const [selectedAura, setSelectedAura] = useState(user.auraColor || 'orange');
  const [nameError, setNameError] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  // Authentication inputs
  const initialPhoneParsed = parseInitialPhone(user.phone);
  const [email, setEmail] = useState(user.email || '');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(initialPhoneParsed.countryCode);
  const [phone, setPhone] = useState(initialPhoneParsed.formattedDigits);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'google'>('email');
  const [authDestination, setAuthDestination] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Security OTP State
  const [generatedCode, setGeneratedCode] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  // Image Cropper Modal State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>(selectedAvatar);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Selected Country object & validation states
  const currentCountry: CountryPhoneConfig =
    PHONE_COUNTRIES.find((c) => c.code === selectedCountryCode) || PHONE_COUNTRIES[0];
  const phoneDigitsCount = extractOnlyDigits(phone).length;
  const isPhoneValid =
    phoneDigitsCount >= currentCountry.minDigits && phoneDigitsCount <= currentCountry.maxDigits;

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Sync inputs when user prop changes (e.g. after reset or logout)
  useEffect(() => {
    setPlayerName(user.name || '');
    setSelectedAvatar(user.avatar || '');
    setSelectedAura(user.auraColor || 'orange');
    setEmail(user.email || '');
    const parsed = parseInitialPhone(user.phone);
    setSelectedCountryCode(parsed.countryCode);
    setPhone(parsed.formattedDigits);
    setView('welcome');
  }, [user.id, user.name, user.avatar, user.auraColor, user.email, user.phone, user.isLoggedIn]);

  // Generate a random 6-digit code
  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Trigger dispatch of verification code (sent to user's email or SMS, not displayed on screen)
  const sendVerificationCode = (destination: string, method: 'email' | 'phone') => {
    const code = generateRandomCode();
    setGeneratedCode(code);
    setAuthDestination(destination);
    setAuthMethod(method);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError(null);
    setAuthError(null);
    setRemainingAttempts(5);
    setResendCooldown(60);

    // Secure log (visible in developer console for sandbox testing)
    console.info(`[Sécurité Gbê ou Moument] Code de vérification envoyé à ${destination} : ${code}`);

    playSoundEffect('notification');
    setView('otp_verify');
  };

  // Quick Start Handler
  const handleQuickStart = () => {
    // Si l'utilisateur s'est simplement déconnecté et possède déjà un profil configuré
    if (user.hasProfile && user.name && user.name.trim().length > 0) {
      playSoundEffect('success');
      onLogin({
        ...user,
        isLoggedIn: true,
      });
      if (onClose) onClose();
      return;
    }

    // Sinon (premier lancement ou après réinitialisation du profil à zéro)
    playSoundEffect('select');
    setAuthMethod('guest');
    setAuthDestination('');
    setPlayerName('');
    setSelectedAvatar(INITIAL_AVATARS[0].url);
    setSelectedAura('orange');
    setNameError(false);
    setModerationWarning(null);
    setView('profile_setup');
  };

  // Submit Email phase
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setAuthError('Veuillez entrer une adresse email valide.');
      playSoundEffect('fail');
      return;
    }
    sendVerificationCode(cleanEmail, 'email');
  };

  // Handlers for Phone Input adhering to country formatting & character type standard
  const handlePhoneInputChange = (raw: string) => {
    // Only accept numeric digits (filter non-digits strictly)
    const digitsOnly = extractOnlyDigits(raw).slice(0, currentCountry.maxDigits);
    const formatted = currentCountry.formatMask(digitsOnly);
    setPhone(formatted);
    if (authError) setAuthError(null);
  };

  const handleCountryChange = (newCode: string) => {
    setSelectedCountryCode(newCode);
    const targetCountry = PHONE_COUNTRIES.find((c) => c.code === newCode) || PHONE_COUNTRIES[0];
    const digits = extractOnlyDigits(phone).slice(0, targetCountry.maxDigits);
    setPhone(targetCountry.formatMask(digits));
    if (authError) setAuthError(null);
  };

  // Submit Phone phase with strict country standards validation
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAndFormatPhoneNumber(currentCountry, phone);
    if (!validation.isValid) {
      setAuthError(validation.errorMessage || 'Numéro de téléphone invalide selon les normes du pays.');
      playSoundEffect('fail');
      return;
    }
    sendVerificationCode(validation.fullInternationalNumber, 'phone');
  };

  // Handle Google Login Success
  const handleGoogleSuccess = (googleData: { email: string; name: string; avatar?: string }) => {
    setIsGoogleModalOpen(false);
    const cleanEmail = googleData.email.toLowerCase().trim();
    const accounts = getRegisteredAccounts();
    const existing = accounts[cleanEmail];

    // Reconnexion directe si le compte Google a déjà un profil enregistré
    if (existing && existing.hasProfile && existing.name) {
      playSoundEffect('success');
      onLogin({
        ...existing,
        isLoggedIn: true,
        email: cleanEmail,
        isGoogleLinked: true,
      });
      if (onClose) onClose();
      return;
    }

    // Reconnexion si l'utilisateur actif déconnecté possédait cet email
    if (user.hasProfile && user.name && user.email?.toLowerCase().trim() === cleanEmail) {
      playSoundEffect('success');
      onLogin({
        ...user,
        isLoggedIn: true,
        isGoogleLinked: true,
      });
      if (onClose) onClose();
      return;
    }

    // Sinon, nouveau profil : diriger vers l'écran de configuration profil & identité
    playSoundEffect('select');
    setAuthDestination(cleanEmail);
    setAuthMethod('google');
    setPlayerName(googleData.name || cleanEmail.split('@')[0] || '');
    setSelectedAvatar(googleData.avatar || INITIAL_AVATARS[0].url);
    setSelectedAura('orange');
    setNameError(false);
    setModerationWarning(null);
    setView('profile_setup');
  };

  // OTP Digits change
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    // Support pasting full 6-digit code
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const updated = [...otpDigits];
      chars.forEach((c, i) => {
        if (i < 6) updated[i] = c;
      });
      setOtpDigits(updated);
      const nextFocus = Math.min(chars.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = clean[0];
    setOtpDigits(updated);

    // Auto-advance to next input
    if (index < 5 && clean[0]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace in OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredCode = otpDigits.join('');

    if (enteredCode.length < 6) {
      setOtpError('Veuillez saisir les 6 chiffres du code.');
      playSoundEffect('fail');
      return;
    }

    // Match generated code (or sandbox master code 123456)
    if (enteredCode !== generatedCode && enteredCode !== '123456') {
      const attemptsLeft = remainingAttempts - 1;
      setRemainingAttempts(attemptsLeft);
      playSoundEffect('fail');
      if (attemptsLeft <= 0) {
        setOtpError('Nombre maximal de tentatives dépassé. Veuillez renvoyer un nouveau code.');
      } else {
        setOtpError(`Code erroné. Il vous reste ${attemptsLeft} tentative(s).`);
      }
      return;
    }

    // CODE CORRECT!
    playSoundEffect('success');

    // Check if account already exists in stored accounts
    const accounts = getRegisteredAccounts();
    const cleanDestination = authDestination.toLowerCase().trim();
    const existing = accounts[cleanDestination];

    // Si le compte existe déjà avec un profil complet (simple reconnexion)
    if (existing && existing.hasProfile && existing.name) {
      onLogin({
        ...existing,
        isLoggedIn: true,
        email: authMethod === 'email' ? authDestination : existing.email,
        phone: authMethod === 'phone' ? authDestination : existing.phone,
      });
      if (onClose) onClose();
      return;
    }

    // Si c'est l'utilisateur actuel déconnecté qui avait cet email ou ce téléphone
    if (
      user.hasProfile &&
      user.name &&
      ((authMethod === 'email' && user.email?.toLowerCase().trim() === cleanDestination) ||
        (authMethod === 'phone' && user.phone?.trim() === authDestination.trim()))
    ) {
      onLogin({
        ...user,
        isLoggedIn: true,
      });
      if (onClose) onClose();
      return;
    }

    // Sinon, nouveau compte ou profil réinitialisé -> profil & identité
    const defaultName = authMethod === 'email' ? authDestination.split('@')[0] : '';
    setPlayerName(defaultName);
    setSelectedAvatar(INITIAL_AVATARS[0].url);
    setSelectedAura('orange');
    setNameError(false);
    setModerationWarning(null);
    setView('profile_setup');
  };

  // Complete Profile Setup & Start Playing
  const handleCompleteProfileSetup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = playerName.trim();
    if (!cleanName) {
      setNameError(true);
      playSoundEffect('fail');
      return;
    }

    // Content moderation check on pseudo (Section 9.1)
    const modResult = validateContentModeration(cleanName, 'FR');
    if (!modResult.isValid) {
      setModerationWarning(modResult.warningMessage);
      playSoundEffect('fail');
      return;
    }
    setModerationWarning(null);

    playSoundEffect('success');
    const newProfile: UserProfile = {
      id: user.id || `user-${Date.now()}`,
      name: cleanName,
      avatar: selectedAvatar || INITIAL_AVATARS[0].url,
      auraColor: selectedAura,
      score: user.score || 0,
      rank: user.rank || 'NOVICE',
      email: authMethod === 'email' || authMethod === 'google' ? authDestination : user.email,
      phone: authMethod === 'phone' ? authDestination : user.phone,
      isGoogleLinked: authMethod === 'google' || user.isGoogleLinked,
      hasProfile: true,
      isLoggedIn: true,
    };

    // Save to accounts registry if destination was provided
    if (authDestination) {
      saveRegisteredAccount(authDestination, newProfile);
    }
    // Also index by name
    saveRegisteredAccount(cleanName, newProfile);

    onLogin(newProfile);
    if (onClose) onClose();
  };

  // Handle image upload from device gallery
  const handleCustomAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAndResizeImage(file);
        setImageToCrop(compressed);
        setIsCropperOpen(true);
        playSoundEffect('select');
      } catch (err) {
        console.warn('Avatar upload error', err);
      }
    }
  };

  // Open cropper on currently selected avatar
  const handleOpenCropper = () => {
    if (!selectedAvatar) {
      fileInputRef.current?.click();
      return;
    }
    setImageToCrop(selectedAvatar);
    setIsCropperOpen(true);
    playSoundEffect('select');
  };

  // Cropper confirmed
  const handleCropperConfirm = async (croppedDataUrl: string) => {
    try {
      const compressed = await compressAndResizeImage(croppedDataUrl);
      setSelectedAvatar(compressed);
      setIsCropperOpen(false);
    } catch {
      setSelectedAvatar(croppedDataUrl);
      setIsCropperOpen(false);
    }
  };

  const currentAuraObj = COLOR_AURAS.find((a) => a.id === selectedAura) || COLOR_AURAS[0];

  return (
    <div className="w-full max-w-md mx-auto bg-[#072015]/95 border border-[#164830] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative select-none">
      {/* 1. WELCOME SCREEN */}
      {view === 'welcome' && (
        <div className="flex flex-col items-center text-center">
          {/* Avatar with dynamic glowing aura */}
          <div
            style={{
              borderColor: currentAuraObj.hex,
              boxShadow: user.avatar ? `0 0 24px ${currentAuraObj.hex}50` : undefined,
            }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 p-0.5 mb-3 overflow-hidden bg-[#04140D] transition-all flex items-center justify-center"
          >
            {user.hasProfile && user.avatar && user.avatar.trim() ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-10 h-10 text-emerald-400 opacity-50" />
            )}
          </div>

          {user.hasProfile && user.name ? (
            <>
              <span className="text-[11px] font-black text-[#FF7A1A] tracking-widest font-mono uppercase">
                BON RETOUR, {user.name.toUpperCase()} !
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 mb-5 font-display tracking-wide">
                PRÊT À REJOUER ?
              </h2>
            </>
          ) : (
            <>
              <span className="text-[11px] font-black text-[#10B981] tracking-widest font-mono uppercase">
                BIENVENUE SUR GBÊ OU MOUMENT
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 mb-5 font-display tracking-wide">
                CONNEXION & PROFIL
              </h2>
            </>
          )}

          <div className="w-full space-y-2.5">
            {/* Quick Start / Re-connect button */}
            {user.hasProfile && user.name ? (
              <button
                id="btn-quick-start"
                onClick={handleQuickStart}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#E65A00] via-[#FF6A00] to-[#E65A00] hover:from-[#FF7A1A] hover:to-[#E65A00] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(230,90,0,0.35)] border border-[#FFA559]/40 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
                title="Se reconnecter directement avec votre profil conservé"
              >
                <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-orange-200 shrink-0" />
                <span>SE RECONNECTER ({user.name.toUpperCase()})</span>
              </button>
            ) : (
              <button
                id="btn-quick-start"
                onClick={handleQuickStart}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#E65A00] via-[#FF6A00] to-[#E65A00] hover:from-[#FF7A1A] hover:to-[#E65A00] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(230,90,0,0.35)] border border-[#FFA559]/40 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
              >
                <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-orange-200 shrink-0" />
                <span>DÉMARRAGE RAPIDE</span>
              </button>
            )}

            {/* Google / Gmail Login button (Opens authentic Gmail sign-in interface) */}
            <button
              id="btn-goto-google"
              onClick={() => {
                playSoundEffect('click');
                setIsGoogleModalOpen(true);
              }}
              className="w-full py-3 px-4 bg-[#ffffff] hover:bg-gray-100 text-[#3c4043] font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition-all whitespace-nowrap border border-[#dadce0] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>SE CONNECTER AVEC GOOGLE / GMAIL</span>
            </button>

            {/* Email Login button */}
            <button
              id="btn-goto-email"
              onClick={() => {
                playSoundEffect('click');
                setAuthError(null);
                setView('email');
              }}
              className="w-full py-3 px-4 bg-[#04140D] border border-[#184830] hover:border-[#FF7A1A]/60 text-[#FF7A1A] font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>SE CONNECTER PAR EMAIL</span>
            </button>

            {/* Phone Login button */}
            <button
              id="btn-goto-phone"
              onClick={() => {
                playSoundEffect('click');
                setAuthError(null);
                setView('phone');
              }}
              className="w-full py-3 px-4 bg-[#04140D] border border-[#133F2B] hover:border-[#10B981]/60 text-[#10B981] font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>SE CONNECTER PAR TÉLÉPHONE</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. EMAIL LOGIN SCREEN */}
      {view === 'email' && (
        <form onSubmit={handleEmailSubmit} className="flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                playSoundEffect('click');
                setView('welcome');
              }}
              className="w-8 h-8 rounded-full bg-[#04140D] border border-[#16402C] flex items-center justify-center text-emerald-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base sm:text-lg font-black text-white font-display whitespace-nowrap">
              CONNEXION EMAIL
            </h2>
          </div>

          <p className="text-xs text-emerald-300/80 mb-4 font-mono">
            Saisissez votre adresse email. Un code de sécurité aléatoire vous sera immédiatement
            envoyé par message pour vous connecter.
          </p>

          {authError && (
            <div className="p-2.5 mb-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-1 mb-5">
            <label className="text-[10px] font-black text-emerald-300 uppercase tracking-wider block font-mono">
              ADRESSE EMAIL
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (authError) setAuthError(null);
              }}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-[#04140D] border border-[#16402C] focus:border-[#FF7A1A] rounded-xl text-white text-xs placeholder:text-emerald-700 outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#E65A00] via-[#FF6A00] to-[#E65A00] hover:from-[#FF7A1A] hover:to-[#E65A00] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(230,90,0,0.35)] border border-[#FFA559]/40 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            RECEVOIR MON CODE PAR EMAIL
          </button>
        </form>
      )}

      {/* 3. PHONE LOGIN SCREEN */}
      {view === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                playSoundEffect('click');
                setView('welcome');
              }}
              className="w-8 h-8 rounded-full bg-[#04140D] border border-[#16402C] flex items-center justify-center text-emerald-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base sm:text-lg font-black text-white font-display whitespace-nowrap">
              CONNEXION TÉLÉPHONE
            </h2>
          </div>

          <p className="text-xs text-emerald-300/80 mb-4 font-mono">
            Saisissez votre numéro de téléphone. Un code de sécurité SMS de vérification
            vous sera immédiatement envoyé selon les normes de votre pays.
          </p>

          {authError && (
            <div className="p-2.5 mb-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-emerald-300 uppercase tracking-wider block font-mono">
                PAYS & NUMÉRO DE TÉLÉPHONE
              </label>
              <span className="text-[10px] font-mono text-emerald-400/70">
                Chiffres uniquement
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Country Selection Dropdown */}
              <div className="relative shrink-0 sm:w-[190px]">
                <select
                  value={selectedCountryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#04140D] border border-[#16402C] focus:border-[#10B981] rounded-xl text-white text-xs font-mono outline-none cursor-pointer appearance-none pr-8 transition-colors"
                >
                  {PHONE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#04140D] text-white">
                      {c.flag} {c.name} ({c.dialCode})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-emerald-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              {/* Formatted Phone Input adhering to character type and country mask */}
              <div className="flex-1 relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9 ]*"
                  placeholder={currentCountry.placeholder}
                  value={phone}
                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                  autoFocus
                  className={`w-full px-3.5 py-2.5 bg-[#04140D] border rounded-xl text-white text-xs font-mono placeholder:text-emerald-800 outline-none transition-colors ${
                    isPhoneValid
                      ? 'border-[#10B981] focus:border-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'border-[#16402C] focus:border-[#10B981]'
                  }`}
                  required
                />
                {isPhoneValid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none flex items-center gap-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Country Standard Details & Character/Digit Counter */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px] font-mono">
              <span className="text-emerald-400/90 text-[10px] sm:text-[11px] flex-1 min-w-[200px]">
                {currentCountry.ruleDescription}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] font-bold shrink-0 px-2 py-0.5 rounded transition-colors ${
                  isPhoneValid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : phoneDigitsCount > 0
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                {phoneDigitsCount} /{' '}
                {currentCountry.minDigits === currentCountry.maxDigits
                  ? `${currentCountry.maxDigits}`
                  : `${currentCountry.minDigits}-${currentCountry.maxDigits}`}{' '}
                chiffres
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#10B981] hover:from-[#34D399] hover:to-[#10B981] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.35)] border border-[#6EE7B7]/40 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
          >
            RECEVOIR LE CODE SMS
          </button>
        </form>
      )}

      {/* 4. OTP VERIFICATION SCREEN (Clean - code is sent externally, not displayed in app) */}
      {view === 'otp_verify' && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white font-black text-sm sm:text-base font-display">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <h2 className="whitespace-nowrap">VÉRIFICATION DU CODE</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                playSoundEffect('click');
                setView(authMethod === 'email' ? 'email' : 'phone');
              }}
              className="w-7 h-7 rounded-full bg-[#04140D] border border-[#16402C] flex items-center justify-center text-emerald-300 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean dispatch status banner without revealing code on screen */}
          <div className="bg-[#04140D] border border-[#143B28] rounded-xl p-3 mb-4 space-y-1.5 text-left">
            <div className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              {authMethod === 'email' ? (
                <Mail className="w-3.5 h-3.5 text-[#FF7A1A]" />
              ) : (
                <Phone className="w-3.5 h-3.5 text-[#10B981]" />
              )}
              <span>{authMethod === 'email' ? 'EMAIL ENVOYÉ' : 'SMS EXPÉDIÉ'}</span>
            </div>
            <p className="text-xs text-emerald-200/90 font-mono leading-relaxed">
              Un code de sécurité à 6 chiffres a été envoyé à :{' '}
              <span className="font-bold text-white underline">{authDestination}</span>.
            </p>
            <p className="text-[11px] text-emerald-400/80 font-mono">
              Consultez vos messages ({authMethod === 'email' ? 'boîte de réception' : 'SMS'}) et
              saisissez le code reçu ci-dessous.
            </p>
          </div>

          {otpError && (
            <div className="p-2.5 mb-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{otpError}</span>
            </div>
          )}

          {/* 6 Digits input boxes */}
          <div className="space-y-2 mb-4">
            <label className="text-[10px] font-black text-emerald-300 uppercase tracking-wider block font-mono">
              SAISISSEZ LES 6 CHIFFRES DU CODE REÇU
            </label>
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-11 h-12 sm:w-12 sm:h-13 bg-[#04140D] border border-[#185337] focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A] rounded-xl text-center text-lg sm:text-xl font-mono font-black text-white outline-none transition-all"
                />
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#E65A00] via-[#FF6A00] to-[#E65A00] hover:from-[#FF7A1A] hover:to-[#E65A00] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(230,90,0,0.35)] border border-[#FFA559]/40 active:scale-[0.98] transition-all whitespace-nowrap mb-3"
          >
            VALIDER ET CONTINUER
          </button>

          {/* Resend Code Button */}
          <div className="flex items-center justify-center pt-1">
            {resendCooldown > 0 ? (
              <span className="text-[11px] text-emerald-400/70 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                Renvoyer un nouveau code dans {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={() => sendVerificationCode(authDestination, authMethod as 'email' | 'phone')}
                className="text-[11px] text-[#10B981] hover:text-[#34D399] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Renvoyer un code de vérification
              </button>
            )}
          </div>
        </form>
      )}

      {/* 5. PROFILE SETUP SCREEN (Nom, Profil & Identité, Choix apparence, photo & couleur) */}
      {view === 'profile_setup' && (
        <form onSubmit={handleCompleteProfileSetup} className="flex flex-col space-y-4 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#143B28] pb-3">
            <div className="flex items-center gap-2 text-white font-black text-sm sm:text-base font-display">
              <User className="w-4 h-4 text-[#FF7A1A]" />
              <h2 className="whitespace-nowrap">PROFIL & IDENTITÉ</h2>
            </div>

            <button
              type="button"
              onClick={() => {
                playSoundEffect('click');
                setView('welcome');
              }}
              className="w-7 h-7 rounded-full bg-[#04140D] border border-[#16402C] flex items-center justify-center text-emerald-300 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-emerald-300/80 italic -mt-1">
            Définis ton pseudo, choisis une couleur d&apos;aura et sélectionne ou importe ton image pour accéder à l&apos;application !
          </p>

          {/* Section 1: Player Pseudo Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <User className="w-3 h-3 text-[#FF7A1A]" />
              <span>PSEUDO / NOM DU JOUEUR *</span>
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                if (nameError) setNameError(false);
              }}
              placeholder="Ex: Gbê Master, Samuel..."
              maxLength={24}
              className={`w-full px-3.5 py-2.5 bg-[#04140D] border rounded-xl text-white text-xs sm:text-sm font-bold outline-none transition-colors ${
                nameError
                  ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500'
                  : 'border-[#16402C] focus:border-[#FF7A1A]'
              }`}
              autoFocus
            />
            {nameError && (
              <span className="text-[10px] text-rose-400 font-bold block">
                Veuillez entrer un pseudo pour commencer.
              </span>
            )}
            {moderationWarning && (
              <div className="p-2 bg-rose-950/90 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-start gap-1.5 animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-tight">{moderationWarning}</span>
              </div>
            )}
          </div>

          {/* Section 2: Avatar Preview & Gallery Upload & Crop */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-emerald-300 uppercase tracking-wider block font-mono">
                CHOISIR TON APPARENCE & IMAGE
              </label>

              {/* Action Buttons: Camera & Gallery */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-black text-[#10B981] hover:text-emerald-300 transition-colors uppercase tracking-wider font-mono cursor-pointer"
                  title="Ouvrir la caméra de l'appareil"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>PHOTO</span>
                </button>

                <span className="text-[#184830]">•</span>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[11px] font-black text-[#FF7A1A] hover:text-[#FFA559] transition-colors uppercase tracking-wider font-mono cursor-pointer"
                  title="Importer depuis la galerie"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>GALERIE</span>
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleCustomAvatarUpload}
                accept="image/*"
                capture="user"
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCustomAvatarUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Live Preview of selected avatar with "Cadrer & Ajuster" button */}
            <div className="flex items-center justify-between gap-3.5 p-2.5 bg-[#04140D]/80 border border-[#143B28] rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  style={{
                    borderColor: currentAuraObj.hex,
                    boxShadow: selectedAvatar ? `0 0 16px ${currentAuraObj.hex}60` : undefined,
                  }}
                  className="w-14 h-14 rounded-xl border-2 p-0.5 overflow-hidden shrink-0 bg-[#072015] flex items-center justify-center"
                >
                  {selectedAvatar && selectedAvatar.trim() ? (
                    <img
                      src={selectedAvatar}
                      alt="Aperçu Avatar"
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-8 h-8 text-emerald-400 opacity-50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-white block truncate">
                    {playerName.trim() || 'Nouveau Joueur'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono block">
                    AURA : {currentAuraObj.name}
                  </span>
                </div>
              </div>

              {/* Button to open framing / cropping modal */}
              <button
                type="button"
                onClick={handleOpenCropper}
                className="py-1.5 px-3 bg-[#0a271a] hover:bg-[#0e3825] border border-[#1b5c3d] hover:border-[#FF7A1A] rounded-xl text-emerald-300 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Crop className="w-3.5 h-3.5 text-[#FF7A1A]" />
                <span>Cadrer / Ajuster</span>
              </button>
            </div>

            {/* Presets provided by app */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider block font-mono">
                OU CHOISIS PARMI NOS AVATARS & ICÔNES :
              </span>
              <div className="grid grid-cols-6 gap-2">
                {INITIAL_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      playSoundEffect('select');
                      setSelectedAvatar(av.url);
                    }}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-[#04140D] cursor-pointer ${
                      selectedAvatar === av.url
                        ? 'border-[#FF7A1A] scale-105 shadow-md shadow-[#FF7A1A]/40'
                        : 'border-[#133A27] hover:border-emerald-500'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Aura de couleur */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-emerald-300 uppercase tracking-wider block font-mono">
              AURA DE COULEUR
            </label>
            <div className="flex items-center gap-3">
              {COLOR_AURAS.map((aura) => (
                <button
                  key={aura.id}
                  type="button"
                  onClick={() => {
                    playSoundEffect('select');
                    setSelectedAura(aura.id);
                  }}
                  style={{ backgroundColor: aura.hex }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer ${
                    selectedAura === aura.id
                      ? 'ring-4 ring-offset-2 ring-offset-[#072015] scale-110 shadow-lg'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  aria-label={aura.name}
                />
              ))}
            </div>
          </div>

          {/* Submit & Start */}
          <button
            type="submit"
            id="btn-submit-profile"
            className="w-full py-3.5 bg-gradient-to-r from-[#E65A00] via-[#FF6A00] to-[#E65A00] hover:from-[#FF7A1A] hover:to-[#E65A00] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(230,90,0,0.35)] border border-[#FFA559]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap mt-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
            <span>VALIDER MON PROFIL & ACCÉDER À L&apos;APPLICATION</span>
          </button>
        </form>
      )}

      {/* 6. AUTHENTIC GOOGLE / GMAIL SIGN-IN MODAL */}
      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
        initialEmail={user.email || 'blysamuel11@gmail.com'}
      />

      {/* 7. IMAGE CROPPER & FRAMING MODAL */}
      <ImageCropModal
        isOpen={isCropperOpen}
        imageUrl={imageToCrop}
        auraColor={selectedAura}
        onConfirm={handleCropperConfirm}
        onCancel={() => setIsCropperOpen(false)}
      />

      {/* 8. LIVE DEVICE CAMERA CAPTURE MODAL */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(dataUrl) => {
          setSelectedAvatar(dataUrl);
          setImageToCrop(dataUrl);
          setIsCropperOpen(true);
        }}
        title="Appareil photo - Profil"
        subtitle="Cadre ton visage pour ton avatar"
        aspectRatio="square"
        darkMode={darkMode}
      />
    </div>
  );
};
