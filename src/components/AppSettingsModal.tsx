import React from 'react';
import {
  X,
  Languages,
  Moon,
  Volume2,
  Smartphone,
  Music,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import {
  playSoundEffect,
  toggleBackgroundMusic,
  triggerDeviceHaptic,
  speakVoice,
  configureAudioSettings,
} from '../utils/audio';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onLogout: () => void;
  user?: UserProfile;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onLogout,
}) => {
  if (!isOpen) return null;

  // 1. Language Toggle
  const handleToggleLanguage = () => {
    playSoundEffect('select');
    triggerDeviceHaptic(15);
    const nextLang = settings.language === 'FR' ? 'EN' : 'FR';
    onUpdateSettings({ language: nextLang });
  };

  // 2. Dark Mode Toggle
  const handleToggleDarkMode = () => {
    playSoundEffect('click');
    triggerDeviceHaptic(15);
    onUpdateSettings({ darkMode: !settings.darkMode });
  };

  // 3. Sound & Voice Toggle
  const handleToggleSoundAndVoice = () => {
    const nextVal = !settings.soundEnabled;
    onUpdateSettings({ soundEnabled: nextVal });
    configureAudioSettings({ soundEnabled: nextVal, voiceEnabled: nextVal });
    
    if (nextVal) {
      triggerDeviceHaptic([20, 40]);
      playSoundEffect('success');
      setTimeout(() => {
        speakVoice(
          settings.language === 'FR' ? 'Effets sonores et voix activés' : 'Sound effects and voice enabled',
          settings.language
        );
      }, 250);
    } else {
      triggerDeviceHaptic(10);
    }
  };

  // 4. Vibrations & Haptic Toggle
  const handleToggleVibrations = () => {
    const nextVal = !settings.vibrationEnabled;
    onUpdateSettings({ vibrationEnabled: nextVal });
    configureAudioSettings({ vibrationEnabled: nextVal });

    if (nextVal) {
      playSoundEffect('select');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 50, 40]);
      }
    } else {
      playSoundEffect('click');
    }
  };

  // 5. Pop Ambient Music Toggle
  const handleTogglePopMusic = () => {
    const nextVal = !settings.popMusicEnabled;
    onUpdateSettings({ popMusicEnabled: nextVal });
    triggerDeviceHaptic(20);
    toggleBackgroundMusic(nextVal);
    if (nextVal) {
      playSoundEffect('select');
    }
  };

  // 6. Logout
  const handleLogoutClick = () => {
    playSoundEffect('click');
    triggerDeviceHaptic(30);
    onClose();
    onLogout();
  };

  const isDark = settings.darkMode;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm sm:max-w-md rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5 relative animate-in zoom-in-95 duration-150 border transition-colors ${
          isDark
            ? 'bg-[#05180F] border-[#17462C] text-white shadow-[0_15px_50px_rgba(0,0,0,0.8)]'
            : 'bg-white border-gray-200 text-[#111827] shadow-[0_20px_60px_rgba(0,0,0,0.18)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <h2 className={`text-lg sm:text-xl font-black font-display tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {settings.language === 'FR' ? "Réglages de l'application" : 'Application Settings'}
          </h2>
          <button
            onClick={() => {
              playSoundEffect('click');
              onClose();
            }}
            aria-label="Fermer les réglages"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 border ${
              isDark
                ? 'bg-[#082215] hover:bg-[#0c311e] border-[#1a5033] text-gray-300 hover:text-white'
                : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings List */}
        <div className="space-y-3.5 sm:space-y-4">
          {/* Row 1: Langue (FR / EN) */}
          <div className={`flex items-center justify-between py-1 border-b ${isDark ? 'border-[#0f3422]/60' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2.5">
              <Languages className="w-5 h-5 text-[#FF7A1A] shrink-0" />
              <span className={`text-sm sm:text-base font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                Langue (FR / EN)
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleLanguage}
              className="px-4 py-2 bg-[#FF7A1A] hover:bg-[#FF882E] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer font-mono"
            >
              {settings.language}
            </button>
          </div>

          {/* Row 2: Mode Sombre */}
          <div className={`flex items-center justify-between py-1 border-b ${isDark ? 'border-[#0f3422]/60' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2.5">
              <Moon className="w-5 h-5 text-[#FF7A1A] shrink-0" />
              <span className={`text-sm sm:text-base font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                {settings.language === 'FR' ? 'Mode Sombre' : 'Dark Mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleDarkMode}
              className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                settings.darkMode ? 'bg-[#E65A00]' : isDark ? 'bg-[#1F3327]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  settings.darkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 3: Effets sonores & voix */}
          <div className={`flex items-center justify-between py-1 border-b ${isDark ? 'border-[#0f3422]/60' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-5 h-5 text-[#FF7A1A] shrink-0" />
              <span className={`text-sm sm:text-base font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                {settings.language === 'FR' ? 'Effets sonores & voix' : 'Sound Effects & Voice'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleSoundAndVoice}
              className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                settings.soundEnabled ? 'bg-[#E65A00]' : isDark ? 'bg-[#1F3327]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full shadow-md transition-transform duration-200 ${
                  settings.soundEnabled ? 'translate-x-6 bg-[#10B981]' : 'translate-x-0 bg-gray-400'
                }`}
              />
            </button>
          </div>

          {/* Row 4: Vibrations & retour haptique */}
          <div className={`flex items-center justify-between py-1 border-b ${isDark ? 'border-[#0f3422]/60' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-[#FF7A1A] shrink-0" />
              <span className={`text-sm sm:text-base font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                {settings.language === 'FR' ? 'Vibrations & retour haptique' : 'Haptic Vibrations'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleVibrations}
              className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                settings.vibrationEnabled ? 'bg-[#E65A00]' : isDark ? 'bg-[#1F3327]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full shadow-md transition-transform duration-200 ${
                  settings.vibrationEnabled ? 'translate-x-6 bg-[#10B981]' : 'translate-x-0 bg-gray-400'
                }`}
              />
            </button>
          </div>

          {/* Row 5: Musique d'ambiance pop */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <Music className="w-5 h-5 text-[#FF7A1A] shrink-0" />
              <span className={`text-sm sm:text-base font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                {settings.language === 'FR' ? "Musique d'ambiance pop" : 'Pop Ambient Music'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleTogglePopMusic}
              className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                settings.popMusicEnabled ? 'bg-[#E65A00]' : isDark ? 'bg-[#374151]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full shadow-md transition-transform duration-200 ${
                  settings.popMusicEnabled ? 'translate-x-6 bg-[#10B981]' : 'translate-x-0 bg-gray-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Direct Store Badges */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://play.google.com/store/apps/details?id=com.gbeoumoument.app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSoundEffect('click')}
              className={`py-3 px-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 ${
                isDark
                  ? 'bg-[#03150D] hover:bg-[#072417] border-[#133F28] text-emerald-300'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FF7A1A]" />
              <span>Google Play</span>
            </a>

            <a
              href="https://apps.apple.com/app/gbe-ou-moument/id6478901234"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSoundEffect('click')}
              className={`py-3 px-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 ${
                isDark
                  ? 'bg-[#03150D] hover:bg-[#072417] border-[#133F28] text-emerald-300'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FF7A1A]" />
              <span>App Store</span>
            </a>
          </div>

          {/* Button: Déconnexion */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full py-3 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-red-900/30 active:scale-98 transition-all cursor-pointer font-mono"
          >
            <LogOut className="w-4 h-4" />
            <span>{settings.language === 'FR' ? 'Déconnexion' : 'Log out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
