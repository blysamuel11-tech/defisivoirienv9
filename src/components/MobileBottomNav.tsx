import React from 'react';
import { Gamepad2, Users, User, BookOpen, MoreHorizontal, Download } from 'lucide-react';
import { GameTab } from '../types';
import { playSoundEffect } from '../utils/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileBottomNavProps {
  currentTab: GameTab;
  onSelectTab: (tab: GameTab) => void;
  onOpenInstallModal?: () => void;
  darkMode?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenInstallModal,
  darkMode = true,
}) => {
  const { triggerHaptic, isInstalled } = usePWAInstall();

  const handleTab = (tab: GameTab) => {
    triggerHaptic('selection');
    playSoundEffect('select');
    onSelectTab(tab);
  };

  const navItems: { id: GameTab; label: string; icon: React.ReactNode }[] = [
    { id: 'solo', label: 'Solo', icon: <Gamepad2 className="w-5 h-5" /> },
    { id: 'multi', label: 'Multi', icon: <Users className="w-5 h-5" /> },
    { id: 'avatar', label: 'Avatar', icon: <User className="w-5 h-5" /> },
    { id: 'biblio', label: 'Défis', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'plus', label: 'Plus', icon: <MoreHorizontal className="w-5 h-5" /> },
  ];

  return (
    <nav
      id="mobile-bottom-bar"
      aria-label="Navigation mobile"
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 px-2 pt-2 border-t backdrop-blur-xl shadow-2xl transition-all select-none ${
        darkMode
          ? 'bg-[#04120B]/95 border-[#123D26] text-gray-300'
          : 'bg-white/95 border-gray-200 text-gray-600'
      }`}
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => handleTab(item.id)}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center relative rounded-xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-[#E65A00] font-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {isActive && (
                <div className="absolute -top-2 w-8 h-1 rounded-full bg-[#E65A00] shadow-[0_0_10px_#E65A00]" />
              )}
              <div
                className={`transition-transform duration-200 ${
                  isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(230,90,0,0.5)]' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Optional quick install button if not yet installed */}
        {!isInstalled && onOpenInstallModal && (
          <button
            id="bottom-nav-install"
            onClick={() => {
              triggerHaptic('medium');
              onOpenInstallModal();
            }}
            title="Installer l'application sur votre mobile"
            className="py-1 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform"
          >
            <Download className="w-4 h-4" />
            <span className="text-[9px] font-bold">App</span>
          </button>
        )}
      </div>
    </nav>
  );
};
