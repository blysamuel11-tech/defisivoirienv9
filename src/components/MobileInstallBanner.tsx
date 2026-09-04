import React, { useState } from 'react';
import { Smartphone, Apple, Download, Sparkles, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { MobileInstallModal } from './MobileInstallModal';

interface MobileInstallBannerProps {
  darkMode?: boolean;
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({
  darkMode = true,
}) => {
  const { isInstalled, isIOS, isAndroid, triggerHaptic } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('gbe_mobile_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // If already running standalone on phone, do not show banner
  if (isInstalled || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      sessionStorage.setItem('gbe_mobile_banner_dismissed', 'true');
    } catch {}
  };

  return (
    <>
      <div
        id="mobile-install-banner"
        onClick={() => {
          triggerHaptic('medium');
          setIsModalOpen(true);
        }}
        className={`w-full max-w-4xl mb-3 px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer shadow-lg transition-all duration-200 hover:border-[#E65A00]/80 group ${
          darkMode
            ? 'bg-gradient-to-r from-[#082417]/95 via-[#061B11]/90 to-[#120B04]/90 border-[#14482E] text-white shadow-black/40'
            : 'bg-gradient-to-r from-emerald-50 via-white to-orange-50 border-emerald-200 text-gray-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E65A00] to-[#FF8A3D] flex items-center justify-center shrink-0 shadow-md shadow-[#E65A00]/25">
            {isIOS ? (
              <Apple className="w-4 h-4 text-white" />
            ) : (
              <Smartphone className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black tracking-tight font-display">
                {isIOS ? 'Application iPhone & iPad' : isAndroid ? 'Application Android' : 'Application Mobile (Android & Apple)'}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PWA / Natif
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">
              Installez sur votre écran d’accueil pour jouer en plein écran
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-[#E65A00] hover:bg-[#FF6A00] text-white text-xs font-extrabold flex items-center gap-1 shadow-md shadow-[#E65A00]/30 transition-transform active:scale-95 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Installer l'app</span>
            <span className="sm:hidden">Installer</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <MobileInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        darkMode={darkMode}
      />
    </>
  );
};
