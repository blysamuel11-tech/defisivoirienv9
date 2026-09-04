import React, { useState } from 'react';
import {
  Bell,
  Sliders,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Globe,
  LogOut,
  Sparkles,
  Gamepad2,
  Users,
  User,
  BookOpen,
  MoreHorizontal,
  Radio,
  ArrowRight,
  X,
} from 'lucide-react';
import { GameTab, AppNotification, AppSettings, UserProfile } from '../types';
import { playSoundEffect, toggleBackgroundMusic, triggerDeviceHaptic } from '../utils/audio';
import { TRANSLATIONS } from '../data/translations';
import { AppSettingsModal } from './AppSettingsModal';

interface HeaderProps {
  currentTab: GameTab;
  onSelectTab: (tab: GameTab) => void;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
  onDeleteNotification?: (id: string) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  user: UserProfile;
  onLogout: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  notifications,
  onMarkNotificationsRead,
  onDeleteNotification,
  settings,
  onUpdateSettings,
  user,
  onLogout,
  onOpenInstallModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const t = TRANSLATIONS[settings.language];
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleTabClick = (tab: GameTab) => {
    playSoundEffect('select');
    onSelectTab(tab);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    playSoundEffect('select');
    triggerDeviceHaptic(20);
    setShowNotifications(false);

    if (notif.unread) {
      onMarkNotificationsRead();
    }

    if (notif.actionType === 'open_settings') {
      setShowSettings(true);
    } else if (notif.actionType === 'open_install' && onOpenInstallModal) {
      onOpenInstallModal();
    } else if (notif.targetTab) {
      onSelectTab(notif.targetTab);
    } else {
      const text = (notif.title + ' ' + notif.description).toLowerCase();
      if (text.includes('multi') || text.includes('salon')) {
        onSelectTab('multi');
      } else if (text.includes('avatar') || text.includes('profil') || text.includes('aura')) {
        onSelectTab('avatar');
      } else if (text.includes('biblio') || text.includes('défi') || text.includes('favori')) {
        onSelectTab('biblio');
      } else if (text.includes('store') || text.includes('mise à jour') || text.includes('version')) {
        setShowSettings(true);
      } else {
        onSelectTab('plus');
      }
    }
  };

  const handleToggleSound = () => {
    const newState = !settings.soundEnabled;
    onUpdateSettings({ soundEnabled: newState });
    toggleBackgroundMusic(newState);
    if (newState) playSoundEffect('success');
  };

  return (
    <header className="relative w-full pt-3 sm:pt-5 pb-2 px-2 sm:px-4 flex flex-col items-center select-none" id="app-header">
      {/* Top Action Bar (Notifications, Language & Settings) - Visible only when logged in */}
      {user.isLoggedIn && (
        <div className="w-full max-w-4xl flex items-center justify-end gap-2 mb-2 px-1">
          {/* Right Corner: Language, Notification & Settings buttons */}
          <div className="flex items-center gap-2 relative">
            {/* Quick Language Toggle Pill */}
            <button
              id="language-quick-toggle-btn"
              onClick={() => {
                playSoundEffect('select');
                const nextLang = settings.language === 'FR' ? 'EN' : 'FR';
                onUpdateSettings({ language: nextLang });
              }}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-black font-mono transition-all duration-200 active:scale-95 ${
                settings.darkMode
                  ? 'bg-[#061D12] border border-[#133F28] text-emerald-300 hover:text-white shadow-sm'
                  : 'bg-white border border-gray-100 text-gray-800 shadow-md shadow-black/5 hover:bg-gray-50'
              }`}
              title={t.language}
            >
              <Globe className="w-3.5 h-3.5 text-[#E65A00]" />
              <span>{settings.language}</span>
            </button>

            {/* Quick Dark/Light Mode Toggle Button */}
            <button
              id="theme-quick-toggle-btn"
              onClick={() => {
                playSoundEffect('select');
                onUpdateSettings({ darkMode: !settings.darkMode });
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                settings.darkMode
                  ? 'bg-[#061D12] border border-[#133F28] text-[#E65A00] hover:text-white shadow-sm'
                  : 'bg-white border border-gray-100 text-[#E65A00] shadow-md shadow-black/5 hover:bg-gray-50'
              }`}
              title={settings.darkMode ? t.lightMode : t.darkMode}
              aria-label="Toggle theme"
            >
              {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                id="notifications-toggle-btn"
                onClick={() => {
                  playSoundEffect('click');
                  setShowNotifications(!showNotifications);
                  setShowSettings(false);
                  if (!showNotifications && unreadCount > 0) {
                    onMarkNotificationsRead();
                  }
                }}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  showNotifications
                    ? 'bg-[#E65A00] text-white shadow-[0_0_15px_rgba(230,90,0,0.5)]'
                    : settings.darkMode
                    ? 'bg-[#061D12] border border-[#133F28] text-emerald-300 hover:text-white shadow-sm'
                    : 'bg-white border border-gray-100 text-gray-800 shadow-md shadow-black/5 hover:bg-gray-50'
                }`}
                aria-label={t.notifications}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#E65A00] border-2 border-white rounded-full animate-pulse" />
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifications && (
                <>
                  {/* Backdrop to dismiss when clicking outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                    aria-hidden="true"
                  />

                  <div
                    className={`absolute right-0 top-12 w-72 sm:w-84 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl border ${
                      settings.darkMode
                        ? 'bg-[#071f14]/98 border-[#1b5337] text-white'
                        : 'bg-white/98 border-gray-100 text-gray-900 shadow-xl'
                    }`}
                  >
                    {/* Header with Title, Count and Close Cross Button */}
                    <div className="bg-gradient-to-r from-[#E65A00] to-[#C84A00] px-3.5 py-2.5 flex items-center justify-between text-white font-extrabold text-xs tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5" />
                        {t.notifications}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="bg-black/25 px-2 py-0.5 rounded-full text-[10px] font-mono">
                          {notifications.length}
                        </span>
                        {/* Bouton croix pour sortir / fermer */}
                        <button
                          type="button"
                          id="close-notifications-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSoundEffect('click');
                            setShowNotifications(false);
                          }}
                          className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-all cursor-pointer active:scale-90"
                          aria-label={settings.language === 'FR' ? 'Fermer les notifications' : 'Close notifications'}
                          title={settings.language === 'FR' ? 'Fermer' : 'Close'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs font-medium text-gray-400">
                          {settings.language === 'FR' ? 'Aucune notification pour le moment.' : 'No notifications at the moment.'}
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleNotificationClick(notif)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleNotificationClick(notif);
                              }
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer group active:scale-[0.98] ${
                              settings.darkMode
                                ? 'bg-[#05180f] hover:bg-[#0a2f1e] border-[#133c27] hover:border-[#FF7A1A]/70'
                                : 'bg-gray-50 hover:bg-orange-50/60 border-gray-200 hover:border-[#FF7A1A]/70 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <div className="flex items-center gap-1.5 text-xs font-black text-[#FF7A1A] truncate">
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{notif.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {notif.unread && (
                                  <span className="w-2 h-2 rounded-full bg-[#E65A00] shrink-0 animate-pulse" />
                                )}
                                {/* Bouton croix sur la notification individuelle */}
                                <button
                                  type="button"
                                  id={`dismiss-notif-${notif.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSoundEffect('click');
                                    triggerDeviceHaptic(15);
                                    if (onDeleteNotification) {
                                      onDeleteNotification(notif.id);
                                    } else {
                                      setShowNotifications(false);
                                    }
                                  }}
                                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                  title={settings.language === 'FR' ? 'Supprimer / Fermer' : 'Dismiss / Close'}
                                  aria-label="Fermer cette notification"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className={`text-xs leading-relaxed ${settings.darkMode ? 'text-emerald-100/85' : 'text-gray-700'}`}>
                              {notif.description}
                            </p>
                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5">
                              <span className={`text-[9px] font-mono block ${settings.darkMode ? 'text-emerald-500' : 'text-gray-400'}`}>
                                {notif.date}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF7A1A] group-hover:translate-x-0.5 transition-transform">
                                <span>{settings.language === 'FR' ? 'Accéder' : 'Go to'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Popover Footer with Quick Exit Button */}
                    <div className="px-3 py-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between bg-black/5 dark:bg-white/5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSoundEffect('click');
                          setShowNotifications(false);
                        }}
                        className="text-[11px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                        aria-label="Sortir des notifications"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{settings.language === 'FR' ? 'Sortir' : 'Close'}</span>
                      </button>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSoundEffect('click');
                            onMarkNotificationsRead();
                          }}
                          className="text-[11px] font-bold text-[#FF7A1A] hover:underline cursor-pointer"
                        >
                          {settings.language === 'FR' ? 'Tout marquer comme lu' : 'Mark all read'}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Settings Button */}
            <div className="relative">
              <button
                id="settings-toggle-btn"
                onClick={() => {
                  playSoundEffect('click');
                  setShowSettings(true);
                  setShowNotifications(false);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                  showSettings
                    ? 'bg-[#E65A00] text-white shadow-[0_0_15px_rgba(230,90,0,0.5)]'
                    : settings.darkMode
                    ? 'bg-[#061D12] border border-[#133F28] text-emerald-300 hover:text-white shadow-sm'
                    : 'bg-white border border-gray-100 text-gray-800 shadow-md shadow-black/5 hover:bg-gray-50'
                }`}
                aria-label={t.systemConfig}
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Full Settings Modal (Exact layout matching mockup) */}
              <AppSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                onLogout={onLogout}
                user={user}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Logo & Glowing Emblem (Dark/Light Modes) */}
      <div className="flex flex-col items-center text-center my-1 relative">
        {/* Emblem Frame with ambient backlight */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-3 flex items-center justify-center">
          {/* Ambient outer glow */}
          <div
            className={`absolute inset-0 rounded-3xl filter blur-xl animate-pulse ${
              settings.darkMode ? 'bg-[#E65A00]/25' : 'bg-[#E65A00]/15'
            }`}
          />
          
          {/* Emblem container */}
          <div
            className={`relative w-full h-full rounded-2xl sm:rounded-3xl flex items-center justify-center overflow-hidden transition-all ${
              settings.darkMode
                ? 'bg-[#072015] border border-[#195236] shadow-[0_0_30px_rgba(230,90,0,0.3)]'
                : 'bg-[#FFF9F3] border border-[#EADBCE] shadow-[0_10px_25px_rgba(230,90,0,0.12)]'
            }`}
          >
            {/* Concentric dashed ring & 4-pointed Star as seen in images */}
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-14 sm:h-14">
                {/* Orbit dashed ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="none"
                  stroke={settings.darkMode ? '#FF8A3D' : '#FF7A1A'}
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                  opacity="0.45"
                />
                {/* 4-pointed Star */}
                <path
                  d="M50 8 C50 32 68 50 92 50 C68 50 50 68 50 92 C50 68 32 50 8 50 C32 50 50 32 50 8 Z"
                  className="fill-[#FF6A00] drop-shadow-[0_0_12px_rgba(255,106,0,0.85)]"
                />
              </svg>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FFD180] rounded-full filter blur-[0.3px]" />
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-[#FF8C1A] rounded-full" />
            </div>
          </div>
        </div>

        {/* Title: GBÊ OU MOUMENT */}
        <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black tracking-tight flex items-center gap-1.5 sm:gap-2 leading-none font-display">
          <span className={settings.darkMode ? 'text-white text-glow-white' : 'text-[#0A1A12]'}>GBÊ</span>
          <span className="text-[#FF6A00] italic font-black text-glow-orange px-1">OU</span>
          <span className={settings.darkMode ? 'text-white text-glow-white' : 'text-[#0A1A12]'}>MOUMENT</span>
        </h1>

        {/* Tagline */}
        <p
          className={`mt-2 text-xs sm:text-sm max-w-md px-4 leading-relaxed font-medium italic ${
            settings.darkMode ? 'text-emerald-100/85' : 'text-[#164E35]'
          }`}
        >
          {t.tagline}
        </p>
      </div>

      {/* Navigation Pill Bar - Vibrant Warm Orange Capsule */}
      {user.isLoggedIn && (
        <nav
          className={`w-full max-w-xl mt-3 sm:mt-4 bg-gradient-to-r from-[#D85200] via-[#E65A00] to-[#C84500] rounded-full p-1 sm:p-1.5 flex items-center justify-between gap-1 relative overflow-hidden ${
            settings.darkMode
              ? 'shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(230,90,0,0.25)]'
              : 'shadow-[0_12px_28px_rgba(230,90,0,0.32)]'
          }`}
          id="main-navigation"
        >
          {/* TAB 1: SOLO */}
          <button
            id="tab-solo"
            onClick={() => handleTabClick('solo')}
            className={`relative flex-1 min-w-0 py-2 sm:py-2.5 px-2 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap overflow-hidden select-none active:scale-95 ${
              currentTab === 'solo'
                ? 'bg-[#8A3000]/90 text-white shadow-inner border border-black/20'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t.solo}</span>
          </button>

          {/* TAB 2: MULTI */}
          <button
            id="tab-multi"
            onClick={() => handleTabClick('multi')}
            className={`relative flex-1 min-w-0 py-2 sm:py-2.5 px-2 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap overflow-hidden select-none active:scale-95 ${
              currentTab === 'multi'
                ? 'bg-[#8A3000]/90 text-white shadow-inner border border-black/20'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t.multi}</span>
          </button>

          {/* TAB 3: AVATAR */}
          <button
            id="tab-avatar"
            onClick={() => handleTabClick('avatar')}
            className={`relative flex-1 min-w-0 py-2 sm:py-2.5 px-2 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap overflow-hidden select-none active:scale-95 ${
              currentTab === 'avatar'
                ? 'bg-[#8A3000]/90 text-white shadow-inner border border-black/20'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t.avatar}</span>
          </button>

          {/* TAB 4: BIBLIO */}
          <button
            id="tab-biblio"
            onClick={() => handleTabClick('biblio')}
            className={`relative flex-1 min-w-0 py-2 sm:py-2.5 px-2 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap overflow-hidden select-none active:scale-95 ${
              currentTab === 'biblio'
                ? 'bg-[#8A3000]/90 text-white shadow-inner border border-black/20'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t.biblio}</span>
          </button>

          {/* TAB 5: PLUS */}
          <button
            id="tab-plus"
            onClick={() => handleTabClick('plus')}
            className={`relative flex-1 min-w-0 py-2 sm:py-2.5 px-2 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all whitespace-nowrap overflow-hidden select-none active:scale-95 ${
              currentTab === 'plus'
                ? 'bg-[#8A3000]/90 text-white shadow-inner border border-black/20'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t.plus}</span>
          </button>
        </nav>
      )}
    </header>
  );
};


