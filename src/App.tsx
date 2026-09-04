import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameTab, UserProfile, Challenge, GameHistoryItem, AppNotification, AppSettings } from './types';
import { INITIAL_USER, INITIAL_CHALLENGES, INITIAL_NOTIFICATIONS } from './data/initialData';
import { getGlobalRank } from './data/translations';
import { configureAudioSettings, setUserAudioSessionState, stopAllAudioAndVoice } from './utils/audio';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { SoloView } from './components/SoloView';
import { MultiView } from './components/MultiView';
import { AvatarView } from './components/AvatarView';
import { BiblioView } from './components/BiblioView';
import { PlusView } from './components/PlusView';
import { Footer } from './components/Footer';
import { MobileInstallModal } from './components/MobileInstallModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AppSettingsModal } from './components/AppSettingsModal';
import { initNativeMobileFeatures } from './utils/nativeMobile';

export default function App() {
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<GameTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('room')) return 'multi';
      }
      const saved = localStorage.getItem('gbe_current_tab');
      if (saved && ['solo', 'multi', 'avatar', 'biblio', 'plus'].includes(saved)) {
        return saved as GameTab;
      }
    } catch {}
    return 'solo';
  });

  // App persistent state - clean state for real users
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('gbe_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Wipe legacy mock profiles
        if (parsed.name === 'FF' || !parsed.hasProfile) {
          return INITIAL_USER;
        }
        if (!parsed.avatar || typeof parsed.avatar !== 'string' || !parsed.avatar.trim()) {
          parsed.avatar = INITIAL_USER.avatar;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_USER;
  });

  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const saved = localStorage.getItem('gbe_challenges');
    return saved ? JSON.parse(saved) : INITIAL_CHALLENGES;
  });

  const [history, setHistory] = useState<GameHistoryItem[]>(() => {
    const saved = localStorage.getItem('gbe_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('gbe_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('gbe_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          darkMode: parsed.darkMode !== undefined ? parsed.darkMode : true,
          soundEnabled: parsed.soundEnabled !== undefined ? parsed.soundEnabled : true,
          vibrationEnabled: parsed.vibrationEnabled !== undefined ? parsed.vibrationEnabled : true,
          popMusicEnabled: parsed.popMusicEnabled !== undefined ? parsed.popMusicEnabled : false,
          language: parsed.language || 'FR',
        };
      } catch {}
    }
    return {
      darkMode: true,
      soundEnabled: true,
      vibrationEnabled: true,
      popMusicEnabled: false,
      language: 'FR',
    };
  });

  // Keep Audio & Haptics in sync with settings
  useEffect(() => {
    configureAudioSettings({
      soundEnabled: settings.soundEnabled,
      vibrationEnabled: settings.vibrationEnabled,
      voiceEnabled: settings.soundEnabled,
    });
  }, [settings.soundEnabled, settings.vibrationEnabled]);

  // Keep Pop Ambient Music & session state in sync with setting and login status
  useEffect(() => {
    setUserAudioSessionState(Boolean(user.isLoggedIn), Boolean(settings.popMusicEnabled));
  }, [user.isLoggedIn, settings.popMusicEnabled]);

  // Save to localStorage on updates
  useEffect(() => {
    localStorage.setItem('gbe_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('gbe_challenges', JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem('gbe_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('gbe_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('gbe_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('gbe_current_tab', currentTab);
  }, [currentTab]);

  // Online / offline detection — the whole game (Solo, Multi, Avatars,
  // Bibliothèque and the local AI fallback) runs without any network.
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Native mobile initialization (Status bar, splash screen, hardware back button)
  useEffect(() => {
    initNativeMobileFeatures({
      onBackButton: () => {
        if (isSettingsModalOpen) {
          setIsSettingsModalOpen(false);
          return true;
        }
        if (isInstallModalOpen) {
          setIsInstallModalOpen(false);
          return true;
        }
        if (currentTab !== 'solo') {
          setCurrentTab('solo');
          return true;
        }
        return false;
      },
    });
  }, [isSettingsModalOpen, isInstallModalOpen, currentTab]);

  const handleUpdateScore = (points: number) => {
    setUser((prev) => {
      const newScore = Math.max(0, (prev.score || 0) + points);
      const rankInfo = getGlobalRank(newScore, settings.language);
      return {
        ...prev,
        score: newScore,
        rank: rankInfo.key,
      };
    });
  };

  const handleLogHistory = (item: GameHistoryItem) => {
    setHistory((prev) => [item, ...prev]);
  };

  const handleAddCustomChallenge = (ch: Challenge) => {
    setChallenges((prev) => [ch, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: settings.language === 'FR' ? 'Nouveau défi créé !' : 'New challenge created!',
        description: `${ch.text.substring(0, 30)}...`,
        date: settings.language === 'FR' ? 'À l’instant' : 'Just now',
        unread: true,
      },
      ...prev,
    ]);
  };

  const handleUpdateChallenge = (updated: Challenge) => {
    setChallenges((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteChallenge = (id: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleLogout = () => {
    stopAllAudioAndVoice();
    setUser((prev) => ({ ...prev, isLoggedIn: false }));
    setCurrentTab('solo');
  };

  const handleResetUser = () => {
    stopAllAudioAndVoice();
    localStorage.removeItem('gbe_user');
    localStorage.removeItem('gbe_user_profile');
    localStorage.removeItem('gbe_accounts');
    localStorage.removeItem('gbe_registered_accounts');
    localStorage.removeItem('gbe_history');
    localStorage.removeItem('gbe_game_history');
    setHistory([]);
    setUser({
      ...INITIAL_USER,
      id: `user-${Date.now()}`,
      name: '',
      avatar: '',
      auraColor: 'orange',
      hasProfile: false,
      isLoggedIn: false,
      score: 0,
      rank: 'NOVICE',
      email: '',
      phone: '',
      isGoogleLinked: false,
    });
    setCurrentTab('solo');
  };

  const handleLogin = (updated: Partial<UserProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...updated,
      isLoggedIn: true,
    }));
    setCurrentTab('solo');
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-start transition-colors duration-300 relative ${
        settings.darkMode ? 'bg-[#030e09] text-white cyber-grid-bg' : 'bg-[#F4F6F5] text-gray-900 light-grid-bg'
      }`}
    >
      {/* Background ambient radial gradients matching futuristic game theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {settings.darkMode ? (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] sm:w-[800px] h-[500px] bg-gradient-to-b from-[#FF6A00]/15 via-[#E65A00]/5 to-transparent rounded-full filter blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[450px] sm:w-[600px] h-[450px] bg-gradient-to-t from-[#10B981]/12 via-[#059669]/5 to-transparent rounded-full filter blur-[110px]" />
            <div className="absolute top-1/3 left-0 w-[350px] h-[350px] bg-gradient-to-r from-[#10B981]/8 to-transparent rounded-full filter blur-[90px]" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] sm:w-[800px] h-[400px] bg-gradient-to-b from-[#FF6A00]/10 via-transparent to-transparent rounded-full filter blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-t from-emerald-400/10 via-transparent to-transparent rounded-full filter blur-[110px]" />
          </>
        )}
      </div>

      {/* Offline pill — reassuring: the game remains fully playable offline */}
      {!isOnline && (
        <div
          role="status"
          className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium shadow-lg border ${
            settings.darkMode
              ? 'bg-[#0a1f16]/95 text-emerald-100 border-emerald-500/30'
              : 'bg-white/95 text-emerald-800 border-emerald-500/30'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          {settings.language === 'FR'
            ? 'Hors ligne — le jeu fonctionne sans connexion'
            : 'Offline — the game works without connection'}
        </div>
      )}

      {/* Main Responsive Wrapper */}
      <div className="relative z-10 w-full max-w-4xl px-3 sm:px-6 flex flex-col items-center min-h-screen">
        {/* Header with Navigation Pills, Audio and Settings */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          notifications={notifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onDeleteNotification={handleDeleteNotification}
          settings={settings}
          onUpdateSettings={(s) => setSettings((prev) => ({ ...prev, ...s }))}
          user={user}
          onLogout={handleLogout}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />

        {/* Dynamic Content View Container */}
        <main className="w-full px-1 sm:px-4 pt-1 pb-24 sm:pb-8 flex-1 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {/* If user clicked logout or needs initial login modal */}
            {!user.isLoggedIn ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full my-auto py-6 flex items-center justify-center"
              >
                <AuthModal
                  user={user}
                  onLogin={handleLogin}
                />
              </motion.div>
            ) : (
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                {currentTab === 'solo' && (
                  <SoloView
                    user={user}
                    onUpdateScore={handleUpdateScore}
                    onLogHistory={handleLogHistory}
                    challenges={challenges}
                    lang={settings.language}
                    darkMode={settings.darkMode}
                  />
                )}

                {currentTab === 'multi' && (
                  <MultiView
                    user={user}
                    challenges={challenges}
                    onUpdateScore={handleUpdateScore}
                    lang={settings.language}
                    darkMode={settings.darkMode}
                  />
                )}

                {currentTab === 'avatar' && (
                  <AvatarView
                    user={user}
                    onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
                    onResetUser={handleResetUser}
                    onLogout={handleLogout}
                    darkMode={settings.darkMode}
                  />
                )}

                {currentTab === 'biblio' && (
                  <BiblioView
                    user={user}
                    history={history}
                    challenges={challenges}
                    onAddCustomChallenge={handleAddCustomChallenge}
                    onUpdateChallenge={handleUpdateChallenge}
                    onDeleteChallenge={handleDeleteChallenge}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectTab={setCurrentTab}
                    lang={settings.language}
                    darkMode={settings.darkMode}
                  />
                )}

                {currentTab === 'plus' && (
                  <PlusView
                    lang={settings.language}
                    darkMode={settings.darkMode}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Global Footer */}
        <Footer />

        {/* Mobile Bottom Navigation Bar (Visible on mobile/tablets when logged in) */}
        {user.isLoggedIn && (
          <MobileBottomNav
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            darkMode={settings.darkMode}
          />
        )}

        {/* Mobile PWA & Native Install Modal (Android & Apple iOS) */}
        <MobileInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          darkMode={settings.darkMode}
        />

        {/* App Settings Modal (Global) */}
        <AppSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onUpdateSettings={(s) => setSettings((prev) => ({ ...prev, ...s }))}
          onLogout={handleLogout}
          user={user}
        />
      </div>
    </div>
  );
}
