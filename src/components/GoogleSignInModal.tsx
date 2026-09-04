import React, { useState } from 'react';
import { Eye, EyeOff, X, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { playSoundEffect } from '../utils/audio';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (googleData: {
    email: string;
    name: string;
    avatar?: string;
  }) => void;
  initialEmail?: string;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = 'blysamuel11@gmail.com',
}) => {
  const [step, setStep] = useState<'account_select' | 'email_input' | 'password'>('account_select');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAccount = (selectedEmail: string, selectedName: string) => {
    playSoundEffect('click');
    setEmail(selectedEmail);
    setStep('password');
    setError(null);
  };

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Saisissez une adresse e-mail Gmail valide.');
      playSoundEffect('fail');
      return;
    }
    playSoundEffect('select');
    setError(null);
    setStep('password');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Veuillez saisir votre mot de passe Google.');
      playSoundEffect('fail');
      return;
    }

    setIsLoading(true);
    playSoundEffect('select');

    setTimeout(() => {
      setIsLoading(false);
      playSoundEffect('success');
      // Extract a nice name from email or known account
      let displayName = 'Joueur Google';
      if (email.toLowerCase().includes('blysamuel')) {
        displayName = 'Samuel Bly';
      } else {
        const prefix = email.split('@')[0];
        displayName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }

      onSuccess({
        email: email.trim().toLowerCase(),
        name: displayName,
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-[450px] bg-[#ffffff] text-[#202124] rounded-2xl sm:rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-[#dadce0] overflow-hidden flex flex-col relative font-sans">
        {/* Top close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google Header Logo */}
        <div className="pt-8 px-6 sm:px-8 pb-4 flex flex-col items-center text-center">
          {/* Official Google 4-color Logo SVG */}
          <div className="mb-4">
            <svg className="w-20 h-7" viewBox="0 0 74 24" fill="none">
              <path
                d="M9.24 10.87v3.25h5.18c-.21 1.7-1.74 4.97-5.18 4.97-3.12 0-5.67-2.58-5.67-5.76s2.55-5.76 5.67-5.76c1.78 0 2.97.76 3.65 1.41l2.57-2.48C13.82 5.04 11.73 4.14 9.24 4.14 4.14 4.14 0 8.28 0 13.33s4.14 9.19 9.24 9.19c5.34 0 8.88-3.75 8.88-9.04 0-.61-.07-1.07-.15-1.53H9.24z"
                fill="#4285F4"
              />
              <path
                d="M25.5 13.33c0-3.32-2.5-5.78-5.72-5.78s-5.72 2.46-5.72 5.78c0 3.29 2.5 5.76 5.72 5.76s5.72-2.47 5.72-5.76zm-2.5 0c0 2.1-1.48 3.59-3.22 3.59s-3.22-1.49-3.22-3.59c0-2.13 1.48-3.61 3.22-3.61s3.22 1.48 3.22 3.61z"
                fill="#EA4335"
              />
              <path
                d="M37.84 13.33c0-3.32-2.5-5.78-5.72-5.78s-5.72 2.46-5.72 5.78c0 3.29 2.5 5.76 5.72 5.76s5.72-2.47 5.72-5.76zm-2.5 0c0 2.1-1.48 3.59-3.22 3.59s-3.22-1.49-3.22-3.59c0-2.13 1.48-3.61 3.22-3.61s3.22 1.48 3.22 3.61z"
                fill="#FBBC05"
              />
              <path
                d="M49.43 7.84v1.12h-.09c-.58-.69-1.68-1.41-3.29-1.41-3.36 0-6.02 2.94-6.02 6.58 0 3.61 2.66 6.53 6.02 6.53 1.61 0 2.71-.72 3.29-1.43h.09v.89c0 2.5-1.34 3.84-3.5 3.84-1.77 0-2.87-1.27-3.32-2.35l-2.17.91c.63 1.52 2.3 3.61 5.49 3.61 3.19 0 5.89-1.88 5.89-6.81V7.84h-2.4zm-3.08 10.37c-1.74 0-3.13-1.47-3.13-3.54 0-2.1 1.39-3.61 3.13-3.61 1.72 0 3.06 1.51 3.06 3.61 0 2.07-1.34 3.54-3.06 3.54z"
                fill="#4285F4"
              />
              <path d="M54.19 4.63h2.52v17.38h-2.52V4.63z" fill="#34A853" />
              <path
                d="M66.42 16.29c-1.66 0-2.82-.76-3.59-2.25l7.65-3.17-.26-.65c-.48-1.3-1.95-3.67-4.96-3.67-2.99 0-5.48 2.36-5.48 6.58 0 3.67 2.47 6.53 5.83 6.53 2.71 0 4.29-1.66 4.94-2.62l-2.02-1.35c-.68 1-1.59 1.6-2.61 1.6zm-.17-6.55c1.17 0 2.16.59 2.49 1.45l-5.63 2.33c0-2.61 1.87-3.78 3.14-3.78z"
                fill="#EA4335"
              />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-normal text-[#202124] mb-1">Connexion</h2>
          <p className="text-sm text-[#5f6368]">
            pour continuer vers <span className="font-medium text-[#202124]">Gbê ou Moument</span>
          </p>
        </div>

        {/* Content Box */}
        <div className="px-6 sm:px-8 pb-6 flex flex-col flex-1">
          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP A: Account selector (Gmail interface) */}
          {step === 'account_select' && (
            <div className="flex flex-col space-y-3">
              <div className="text-xs text-[#5f6368] font-medium mb-1">
                Choisissez un compte pour vous connecter
              </div>

              {/* Samuel Bly Account Chip */}
              <button
                type="button"
                onClick={() => handleSelectAccount('blysamuel11@gmail.com', 'Samuel Bly')}
                className="w-full p-3 rounded-xl border border-[#dadce0] hover:bg-[#f8fafd] hover:border-[#4285F4] flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-medium text-base shadow-sm shrink-0">
                    S
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-[#202124] block truncate group-hover:text-[#1a73e8]">
                      Samuel Bly
                    </span>
                    <span className="text-xs text-[#5f6368] truncate block">
                      blysamuel11@gmail.com
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#1a73e8] font-medium group-hover:underline shrink-0">
                  Sélectionner
                </span>
              </button>

              {/* Use Another Account */}
              <button
                type="button"
                onClick={() => {
                  setStep('email_input');
                  setEmail('');
                  setError(null);
                }}
                className="w-full p-3 rounded-xl border border-dashed border-[#dadce0] hover:bg-[#f8fafd] hover:border-[#1a73e8] flex items-center gap-3 text-left transition-all text-[#1a73e8]"
              >
                <div className="w-10 h-10 rounded-full border border-[#dadce0] flex items-center justify-center text-[#5f6368] shrink-0">
                  <span className="text-lg font-light">+</span>
                </div>
                <span className="text-sm font-medium">Utiliser un autre compte Gmail</span>
              </button>
            </div>
          )}

          {/* STEP B: Email input form */}
          {step === 'email_input' && (
            <form onSubmit={handleEmailNext} className="flex flex-col space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#5f6368] block">
                  Adresse e-mail ou téléphone
                </label>
                <input
                  type="email"
                  placeholder="votre.compte@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 rounded-lg border border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-sm text-[#202124] outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('account_select')}
                  className="text-xs text-[#1a73e8] font-medium hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tous les comptes</span>
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-6 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium rounded-lg shadow-sm transition-all"
                >
                  Suivant
                </button>
              </div>
            </form>
          )}

          {/* STEP C: Password form */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col space-y-4">
              {/* Account badge */}
              <div className="flex items-center justify-between p-2 rounded-full border border-[#dadce0] bg-[#f8fafd]">
                <div className="flex items-center gap-2 min-w-0 pl-1">
                  <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-medium shrink-0">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-[#3c4043] font-medium truncate">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('account_select')}
                  className="text-xs text-[#1a73e8] font-medium pr-2 hover:underline shrink-0"
                >
                  Changer
                </button>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#5f6368] block">
                  Saisissez votre mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                    placeholder="Mot de passe"
                    className="w-full px-3.5 py-3 rounded-lg border border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-sm text-[#202124] outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Show password checkbox */}
              <label className="flex items-center gap-2 text-xs text-[#3c4043] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                />
                <span>Afficher le mot de passe</span>
              </label>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('account_select')}
                  className="text-xs text-[#1a73e8] font-medium hover:underline"
                >
                  Retour
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2.5 px-6 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Connexion...</span>
                  ) : (
                    <>
                      <span>Connexion</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Privacy note */}
          <div className="mt-6 pt-4 border-t border-[#dadce0] text-[11px] text-[#5f6368] leading-relaxed">
            Pour continuer, Google partagera votre nom, votre adresse e-mail et votre photo de
            profil avec l'application Gbê ou Moument.
          </div>
        </div>

        {/* Google Footer */}
        <div className="px-6 py-3 bg-[#f8f9fa] border-t border-[#dadce0] flex items-center justify-between text-[11px] text-[#5f6368]">
          <span>Français (France) ▾</span>
          <div className="flex items-center gap-4">
            <span className="hover:underline cursor-pointer">Aide</span>
            <span className="hover:underline cursor-pointer">Confidentialité</span>
            <span className="hover:underline cursor-pointer">Conditions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
