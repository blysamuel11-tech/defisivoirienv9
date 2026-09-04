import React, { useState, useRef, useEffect } from 'react';
import { User, RotateCcw, Upload, Shield, Chrome, Eye, EyeOff, Check, Sparkles, ArrowRight, ArrowLeft, Phone, Mail, Camera, Crop, AlertTriangle, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { INITIAL_AVATARS } from '../data/initialData';
import { playSoundEffect } from '../utils/audio';
import { ImageCropModal } from './ImageCropModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { GoogleSignInModal } from './GoogleSignInModal';
import { validateContentModeration } from '../utils/moderation';
import { compressAndResizeImage } from '../utils/imageCompressor';

interface AvatarViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onResetUser: () => void;
  onLogout?: () => void;
  darkMode?: boolean;
}

const COLOR_AURAS = [
  { id: 'orange', name: 'Orange Feu', hex: '#E65A00', ring: 'ring-[#E65A00]' },
  { id: 'green', name: 'Vert Émeraude', hex: '#10B981', ring: 'ring-[#10B981]' },
  { id: 'teal', name: 'Cyan Lagon', hex: '#06B6D4', ring: 'ring-[#06B6D4]' },
  { id: 'purple', name: 'Pourpre Royal', hex: '#A855F7', ring: 'ring-[#A855F7]' },
];

export const AvatarView: React.FC<AvatarViewProps> = ({ user, onUpdateUser, onResetUser, onLogout, darkMode = true }) => {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [selectedAura, setSelectedAura] = useState(user.auraColor || 'orange');
  const [emailInput, setEmailInput] = useState(user.email || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [phoneInput, setPhoneInput] = useState(user.phone || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  // Synchronize local input state with user profile changes or resets
  useEffect(() => {
    setName(user.name || '');
    setSelectedAvatar(user.avatar || '');
    setSelectedAura(user.auraColor || 'orange');
    setEmailInput(user.email || '');
    setPhoneInput(user.phone || '');
  }, [user.name, user.avatar, user.auraColor, user.email, user.phone]);

  // Cropper states
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>(selectedAvatar || '');

  // Google sign in modal state
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSaveIdentity = () => {
    // Moderation check on username (Section 9.1)
    if (name.trim()) {
      const modResult = validateContentModeration(name.trim());
      if (!modResult.isValid) {
        playSoundEffect('fail');
        setModerationWarning(modResult.warningMessage);
        return;
      }
    }
    setModerationWarning(null);
    playSoundEffect('success');
    const cleanName = name.trim() || user.name || 'Joueur';
    onUpdateUser({
      name: cleanName,
      avatar: selectedAvatar,
      auraColor: selectedAura,
      hasProfile: true,
    });
    triggerToast('Identité confirmée avec succès !');
  };

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

  const handleOpenCropper = () => {
    if (!selectedAvatar) {
      fileInputRef.current?.click();
      return;
    }
    setImageToCrop(selectedAvatar);
    setIsCropperOpen(true);
    playSoundEffect('select');
  };

  const handleCropperConfirm = async (croppedDataUrl: string) => {
    try {
      const compressed = await compressAndResizeImage(croppedDataUrl);
      setSelectedAvatar(compressed);
      setIsCropperOpen(false);
      onUpdateUser({ avatar: compressed });
      triggerToast('Photo recadrée et mise à jour !');
    } catch (err) {
      setSelectedAvatar(croppedDataUrl);
      setIsCropperOpen(false);
    }
  };

  const handleLinkGoogle = () => {
    playSoundEffect('click');
    setIsGoogleModalOpen(true);
  };

  const handleGoogleSuccess = (googleData: { email: string; name: string }) => {
    setIsGoogleModalOpen(false);
    playSoundEffect('success');
    setEmailInput(googleData.email);
    onUpdateUser({
      email: googleData.email,
      isGoogleLinked: true,
      hasProfile: true,
    });
    triggerToast(`Compte Gmail (${googleData.email}) lié avec succès !`);
  };

  const handleLinkEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    playSoundEffect('success');
    onUpdateUser({ email: emailInput });
    triggerToast('Email associé à votre profil !');
  };

  const handleLinkPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) return;
    playSoundEffect('success');
    onUpdateUser({ phone: phoneInput });
    triggerToast('Numéro de téléphone vérifié !');
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const confirmResetStats = () => {
    playSoundEffect('click');
    // Réinitialisation intégrale du profil, pseudo, nom et images à zéro
    setName('');
    setSelectedAvatar('');
    setSelectedAura('orange');
    setEmailInput('');
    setPasswordInput('');
    setPhoneInput('');
    setModerationWarning(null);

    // Réinitialise l'utilisateur dans l'état global et le stockage local
    onResetUser();
    setShowResetConfirm(false);
    triggerToast('Profil, pseudo, nom et images réinitialisés à zéro !');
  };

  const currentAuraObj = COLOR_AURAS.find((a) => a.id === selectedAura) || COLOR_AURAS[0];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none pb-8 space-y-3 sm:space-y-4" id="avatar-screen">
      {/* Toast alert */}
      {showToast && (
        <div className="fixed bottom-6 z-50 bg-[#04140D]/95 border border-[#10B981] text-white px-5 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.4)] backdrop-blur-xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4 text-[#10B981]" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Step Selector Buttons */}
      <div
        className={`w-full flex items-center rounded-xl sm:rounded-2xl p-1 gap-1 transition-all ${
          darkMode
            ? 'bg-[#061D12] border border-[#133F28] shadow-lg'
            : 'bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
        }`}
      >
        <button
          onClick={() => {
            playSoundEffect('select');
            setActiveStep(1);
          }}
          className={`flex-1 py-2 sm:py-2.5 px-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeStep === 1
              ? 'bg-[#E65A00] text-white shadow-md'
              : darkMode
              ? 'text-emerald-300/70 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>1. Profil & Avatar</span>
        </button>

        <button
          onClick={() => {
            playSoundEffect('select');
            setActiveStep(2);
          }}
          className={`flex-1 py-2 sm:py-2.5 px-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeStep === 2
              ? 'bg-[#E65A00] text-white shadow-md'
              : darkMode
              ? 'text-emerald-300/70 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>2. Sécurité & Compte</span>
        </button>
      </div>

      {/* STEP 1: PROFIL & AVATAR */}
      {activeStep === 1 && (
        <div
          className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-200 transition-all ${
            darkMode
              ? 'bg-[#061D12] border border-[#133F28] shadow-xl'
              : 'bg-white border border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div className={`flex items-center justify-between pb-3 border-b ${darkMode ? 'border-[#143B28]' : 'border-gray-100'}`}>
            <div className={`flex items-center gap-2 font-black text-sm sm:text-base font-display ${darkMode ? 'text-white' : 'text-[#111827]'}`}>
              <User className="w-4 h-4 text-[#FF7A1A]" />
              <h2 className="whitespace-nowrap">MON PROFIL & IDENTITÉ</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton Réinitialiser (supprime le profil à zéro) */}
              <button
                id="avatar-reset-profile-btn"
                onClick={() => {
                  playSoundEffect('click');
                  setShowResetConfirm(true);
                }}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider font-mono whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 border ${
                  darkMode
                    ? 'bg-gradient-to-r from-rose-950/70 via-red-950/50 to-rose-900/60 hover:from-rose-900/80 hover:to-red-800/80 border-rose-500/50 hover:border-rose-400 text-rose-200 hover:text-white shadow-md shadow-rose-950/50 ring-1 ring-rose-500/20'
                    : 'bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 hover:from-rose-100 hover:to-red-100 border-rose-300 hover:border-rose-400 text-rose-700 hover:text-rose-900 shadow-sm shadow-rose-200/60 ring-1 ring-rose-200'
                }`}
                title="Réinitialiser le profil à zéro pour en créer un nouveau"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400 group-hover:-rotate-180 transition-transform duration-500 shrink-0" />
                <span className="font-extrabold tracking-wide">Réinitialiser</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Left: Name & Aura */}
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label
                  className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 font-mono ${
                    darkMode ? 'text-emerald-300' : 'text-gray-600'
                  }`}
                >
                  <User className="w-3 h-3 text-[#FF7A1A]" />
                  <span>PSEUDO / NOM DU JOUEUR</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (moderationWarning) setModerationWarning(null);
                  }}
                  placeholder="Votre pseudo..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none transition-colors border ${
                    darkMode
                      ? 'bg-[#04140D] border-[#16402C] focus:border-[#FF7A1A] text-white placeholder:text-emerald-700'
                      : 'bg-gray-50 border-gray-200 focus:border-[#FF7A1A] text-gray-900 placeholder:text-gray-400'
                  }`}
                />
                {moderationWarning && (
                  <div className="p-2 bg-rose-50 border border-rose-300 text-rose-700 text-[11px] rounded-xl flex items-start gap-1.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="font-medium leading-tight">{moderationWarning}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  className={`text-[10px] font-black uppercase tracking-wider block font-mono ${
                    darkMode ? 'text-emerald-300' : 'text-gray-600'
                  }`}
                >
                  AURA DE COULEUR
                </label>
                <div className="flex items-center gap-2.5">
                  {COLOR_AURAS.map((aura) => (
                    <button
                      key={aura.id}
                      onClick={() => {
                        playSoundEffect('select');
                        setSelectedAura(aura.id);
                      }}
                      style={{ backgroundColor: aura.hex }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer ${
                        selectedAura === aura.id
                          ? `ring-4 ring-offset-2 ${darkMode ? 'ring-offset-[#072015]' : 'ring-offset-white'} scale-110 shadow-lg`
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      aria-label={aura.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Active Avatar preview with framing controls */}
            <div className="flex flex-col items-center sm:items-end space-y-2">
              <div className="relative group">
                <div
                  style={{
                    borderColor: currentAuraObj.hex,
                    boxShadow: selectedAvatar ? `0 0 20px ${currentAuraObj.hex}60` : undefined,
                  }}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl border-2 p-1 overflow-hidden transition-all duration-300 flex items-center justify-center ${
                    darkMode ? 'bg-[#04140D]' : 'bg-gray-100'
                  }`}
                >
                  {selectedAvatar && selectedAvatar.trim() ? (
                    <img
                      src={selectedAvatar}
                      alt="Selected Avatar"
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center rounded-xl sm:rounded-2xl bg-black/20 text-gray-400 p-2 text-center">
                      <User className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-[9px] font-mono text-gray-400 leading-tight">Aucune image</span>
                    </div>
                  )}
                </div>

                {/* Quick edit badge */}
                <button
                  type="button"
                  onClick={handleOpenCropper}
                  title="Cadrer et redimensionner l'image"
                  className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#E65A00] hover:bg-[#FF6A00] text-white flex items-center justify-center shadow-lg shadow-[#E65A00]/40 transition-transform active:scale-90 cursor-pointer"
                >
                  <Crop className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Photo & Crop action buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  title="Ouvrir la caméra de l'appareil"
                  className={`py-1 px-2 border rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    darkMode
                      ? 'bg-[#04140D] hover:bg-[#072517] border-[#164830] hover:border-[#10B981] text-emerald-300'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                  }`}
                >
                  <Camera className="w-3 h-3 text-[#10B981]" />
                  <span>Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Choisir depuis la galerie"
                  className={`py-1 px-2 border rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    darkMode
                      ? 'bg-[#04140D] hover:bg-[#072517] border-[#164830] hover:border-[#FF7A1A] text-[#FF7A1A]'
                      : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-[#E65A00]'
                  }`}
                >
                  <Upload className="w-3 h-3 text-[#FF7A1A]" />
                  <span>Galerie</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCropper}
                  title="Ajuster le cadrage"
                  className={`py-1 px-2 border rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    darkMode
                      ? 'bg-[#072418] hover:bg-[#0c3523] border-[#1e613f] hover:border-emerald-400 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                  }`}
                >
                  <Crop className="w-3 h-3 text-emerald-500" />
                  <span>Cadrer</span>
                </button>

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
            </div>
          </div>

          {/* Avatar selector gallery */}
          <div className="space-y-2">
            <span
              className={`text-[10px] font-black uppercase tracking-wider block font-mono ${
                darkMode ? 'text-emerald-400' : 'text-gray-600'
              }`}
            >
              CHOISIR UNE APPARENCE
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {INITIAL_AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => {
                    playSoundEffect('select');
                    setSelectedAvatar(av.url);
                  }}
                  className={`aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                    selectedAvatar === av.url
                      ? 'border-[#FF7A1A] scale-105 shadow-md shadow-[#FF7A1A]/30'
                      : darkMode
                      ? 'border-[#133A27] hover:border-emerald-500 bg-[#04140D]'
                      : 'border-gray-200 hover:border-orange-400 bg-gray-50'
                  }`}
                >
                  <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-lg sm:rounded-xl" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Step Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              id="btn-confirm-identity"
              onClick={handleSaveIdentity}
              className="py-3 px-4 bg-gradient-to-r from-[#E65A00] via-[#FF6A00] to-[#E65A00] hover:from-[#FF7A1A] hover:to-[#E65A00] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(230,90,0,0.35)] border border-[#FFA559]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>Confirmer mon Identité</span>
            </button>

            <button
              onClick={() => {
                handleSaveIdentity();
                setActiveStep(2);
              }}
              className={`py-3 px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer border ${
                darkMode
                  ? 'bg-[#04140D] hover:bg-[#0A2A1A] border-[#164D32] text-emerald-300 hover:text-white'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
              }`}
            >
              <span>Étape 2 : Sécurité</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SÉCURITÉ & CONNEXION */}
      {activeStep === 2 && (
        <div
          className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-200 transition-all ${
            darkMode
              ? 'bg-[#061D12] border border-[#133F28] shadow-xl'
              : 'bg-white border border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div className={`flex items-center justify-between pb-3 border-b ${darkMode ? 'border-[#143B28]' : 'border-gray-100'}`}>
            <div className={`flex items-center gap-2 font-black text-sm sm:text-base font-display ${darkMode ? 'text-white' : 'text-[#111827]'}`}>
              <Shield className="w-4 h-4 text-[#10B981]" />
              <h2 className="whitespace-nowrap">SÉCURITÉ & COMPTE</h2>
            </div>

            <button
              onClick={() => setActiveStep(1)}
              className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-500 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Retour</span>
            </button>
          </div>

          {/* Google SSO */}
          <div className="space-y-1.5">
            <span
              className={`text-[10px] font-black uppercase tracking-wider block font-mono ${
                darkMode ? 'text-emerald-400' : 'text-gray-600'
              }`}
            >
              AUTHENTIFICATION RAPIDE
            </span>
            <button
              onClick={handleLinkGoogle}
              className={`w-full py-3 px-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap border cursor-pointer ${
                darkMode
                  ? 'bg-[#04140D] border-[#16402C] hover:border-emerald-500 text-white'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Chrome className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="truncate">{user.isGoogleLinked ? 'COMPTE GOOGLE LIÉ AVEC SUCCÈS ✓' : 'LIER MON COMPTE GOOGLE'}</span>
            </button>
          </div>

          {/* Email form */}
          <form onSubmit={handleLinkEmail} className={`space-y-2.5 pt-2 border-t ${darkMode ? 'border-[#143B28]' : 'border-gray-100'}`}>
            <span
              className={`text-[10px] font-black uppercase tracking-wider block font-mono ${
                darkMode ? 'text-emerald-400' : 'text-gray-600'
              }`}
            >
              LIAISON PAR EMAIL
            </span>
            <input
              type="email"
              placeholder="votre.email@exemple.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border ${
                darkMode
                  ? 'bg-[#04140D] border-[#16402C] focus:border-[#FF7A1A] text-white placeholder:text-emerald-700'
                  : 'bg-gray-50 border-gray-200 focus:border-[#FF7A1A] text-gray-900 placeholder:text-gray-400'
              }`}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe sécurisé"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none pr-9 border ${
                  darkMode
                    ? 'bg-[#04140D] border-[#16402C] focus:border-[#FF7A1A] text-white placeholder:text-emerald-700'
                    : 'bg-gray-50 border-gray-200 focus:border-[#FF7A1A] text-gray-900 placeholder:text-gray-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-emerald-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#E65A00] hover:bg-[#FF6A00] text-white font-black text-xs rounded-xl shadow-md transition-colors uppercase tracking-wider font-mono whitespace-nowrap cursor-pointer"
            >
              ENREGISTRER L'EMAIL
            </button>
          </form>

          {/* Phone link form */}
          <form onSubmit={handleLinkPhone} className={`space-y-2.5 pt-2 border-t ${darkMode ? 'border-[#143B28]' : 'border-gray-100'}`}>
            <span
              className={`text-[10px] font-black uppercase tracking-wider block font-mono ${
                darkMode ? 'text-emerald-400' : 'text-gray-600'
              }`}
            >
              LIAISON PAR NUMÉRO DE TÉLÉPHONE
            </span>
            <input
              type="tel"
              placeholder="+225 07 00 00 00 00"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border ${
                darkMode
                  ? 'bg-[#04140D] border-[#16402C] focus:border-[#10B981] text-white placeholder:text-emerald-700'
                  : 'bg-gray-50 border-gray-200 focus:border-[#10B981] text-gray-900 placeholder:text-gray-400'
              }`}
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs rounded-xl shadow-md transition-colors uppercase tracking-wider font-mono whitespace-nowrap cursor-pointer"
            >
              ENREGISTRER LE NUMÉRO
            </button>
          </form>

          {/* Back button */}
          <div className="pt-2">
            <button
              onClick={() => setActiveStep(1)}
              className={`w-full py-3 rounded-xl sm:rounded-2xl font-black text-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap border cursor-pointer ${
                darkMode
                  ? 'bg-[#04140D] border-[#143B28] text-emerald-300 hover:text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>RETOURNER AU PROFIL</span>
            </button>
          </div>
        </div>
      )}

      {/* Image Cropping & Framing Modal */}
      <ImageCropModal
        isOpen={isCropperOpen}
        imageUrl={imageToCrop}
        auraColor={selectedAura}
        onConfirm={handleCropperConfirm}
        onCancel={() => setIsCropperOpen(false)}
      />

      {/* Live Device Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(dataUrl) => {
          setSelectedAvatar(dataUrl);
          setImageToCrop(dataUrl);
          setIsCropperOpen(true);
          triggerToast('Photo capturée avec succès !');
        }}
        title="Appareil photo - Avatar"
        subtitle="Cadre ton visage puis appuie sur le bouton pour capturer"
        aspectRatio="square"
        darkMode={darkMode}
      />

      {/* Google / Gmail Sign-In Modal */}
      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
        initialEmail={user.email || 'blysamuel11@gmail.com'}
      />

      {/* Profile, Name, Avatar & Stats Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border ${
              darkMode ? 'bg-[#072015] border-rose-600/60' : 'bg-white border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 text-rose-500 font-black text-sm font-display">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>RÉINITIALISER LE PROFIL À ZÉRO</span>
            </div>
            <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-emerald-100/90' : 'text-gray-600'}`}>
              Es-tu certain de vouloir supprimer ton profil et réinitialiser tout à zéro ?
              <span className={`mt-2.5 block space-y-1 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <span className="block">• Pseudo, nom et photos effacés à zéro</span>
                <span className="block">• Statistiques et score remis à zéro</span>
                <span className="block">• Session fermée pour reprendre un nouveau profil</span>
              </span>
              <span className="mt-3 block text-emerald-400 text-[11px] font-semibold bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2">
                ✨ Vous serez redirigé vers l&apos;écran d&apos;accueil pour créer un profil tout neuf (<strong>Démarrage rapide</strong>, <strong>Google</strong>, <strong>Email</strong> ou <strong>Téléphone</strong>).
              </span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                  darkMode ? 'bg-[#04140D] border-[#143B28] text-emerald-300 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={confirmResetStats}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirmer la réinitialisation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
