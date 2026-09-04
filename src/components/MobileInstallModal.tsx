import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Apple,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  ExternalLink,
  Code2,
  ShieldCheck,
  Zap,
  Layers,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playSoundEffect } from '../utils/audio';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
  darkMode = true,
}) => {
  const { hasNativePrompt, isInstalled, isIOS, promptInstall, triggerHaptic } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'native'>(() => {
    if (typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())) {
      return 'ios';
    }
    return 'android';
  });
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    playSoundEffect('select');
    if (hasNativePrompt) {
      const ok = await promptInstall();
      if (ok) {
        setInstalledSuccess(true);
        playSoundEffect('success');
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl border ${
            darkMode
              ? 'bg-[#061910] border-[#133F28] text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Close button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 active:scale-95 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#E65A00] to-[#FF8A3D] flex items-center justify-center shadow-lg shadow-[#E65A00]/30">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display tracking-wide">
                Application Mobile
              </h2>
              <p className="text-xs text-emerald-400 font-mono">
                Installable sur Android & Apple iOS
              </p>
            </div>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-black/30 border border-emerald-950/60 mb-5 gap-1">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('android');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'android'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span>Android</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('ios');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ios'
                  ? 'bg-[#E65A00] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Apple className="w-4 h-4 text-orange-200" />
              <span>Apple (iOS)</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('native');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'native'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4 text-blue-200" />
              <span>Capacitor APK</span>
            </button>
          </div>

          {/* Already installed banner */}
          {isInstalled && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-900/40 border border-emerald-500/40 flex items-center gap-2 text-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>L’application est déjà installée en mode autonome sur cet appareil !</span>
            </div>
          )}

          {/* Tab 1: Android */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#082216] border border-[#14482E]">
                <div className="flex items-center gap-2 mb-2 text-emerald-300 font-bold text-sm">
                  <Zap className="w-4 h-4 text-[#E65A00]" />
                  <span>Installation Directe sur Android</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  Installez Gbê ou Moument comme une véritable application Android (WebAPK) sans passer par le store, avec icône sur l'écran d'accueil, mode plein écran fluide et notifications.
                </p>

                {hasNativePrompt ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-98 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Installer sur mon Android</span>
                  </button>
                ) : (
                  <div className="text-xs text-gray-400 bg-black/40 p-3 rounded-lg border border-white/5 space-y-2">
                    <p className="font-semibold text-emerald-400">Si le bouton automatique n'apparaît pas :</p>
                    <ol className="list-decimal list-inside space-y-1 pl-1">
                      <li>Ouvrez le menu du navigateur Chrome (<span className="font-mono text-white">⋮</span> trois points en haut à droite)</li>
                      <li>Appuyez sur <strong className="text-white">« Installer l’application »</strong> ou <strong className="text-white">« Ajouter à l’écran d’accueil »</strong></li>
                      <li>Validez : l'icône s'ajoute directement parmi vos applications Android</li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Compatible avec tous les téléphones Samsung, Xiaomi, Pixel, etc.</span>
              </div>
            </div>
          )}

          {/* Tab 2: Apple (iOS iPhone / iPad) */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#082216] border border-[#14482E]">
                <div className="flex items-center gap-2 mb-2 text-[#E65A00] font-bold text-sm">
                  <Apple className="w-4 h-4" />
                  <span>Installation sur iPhone & iPad (Safari)</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  Apple autorise l'installation d'applications PWA directement depuis Safari en 3 étapes simples :
                </p>

                <div className="space-y-2.5 text-xs text-gray-300">
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-black/30 border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-[#E65A00]/20 text-[#E65A00] font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <span className="font-semibold text-white">Touchez le bouton Partager</span>
                      <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                        (icône <Share className="w-3.5 h-3.5 text-[#E65A00] inline" /> en bas au centre dans Safari)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-black/30 border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-[#E65A00]/20 text-[#E65A00] font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <span className="font-semibold text-white">Faites défiler et sélectionnez</span>
                      <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                        <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> « Sur l'écran d'accueil »
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-black/30 border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-[#E65A00]/20 text-[#E65A00] font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <span className="font-semibold text-white">Appuyez sur « Ajouter »</span>
                      <p className="mt-0.5 text-gray-400">
                        L'application se lance ensuite en plein écran sans barre d'adresse Safari, avec retour haptique et sons.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-[#E65A00]" />
                <span>Prend en charge iOS 14, 15, 16, 17, 18 et iPadOS</span>
              </div>
            </div>
          )}

          {/* Tab 3: Native Build (Capacitor / Android Studio / Xcode) */}
          {activeTab === 'native' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#082216] border border-[#14482E]">
                <div className="flex items-center gap-2 mb-2 text-blue-300 font-bold text-sm">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Build Natif Android Studio & Apple Xcode</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  Le projet intègre également la configuration complète <strong className="text-blue-400">Capacitor</strong> pour compiler un fichier <strong className="text-white">.APK / .AAB</strong> (Google Play Store) ou un projet <strong className="text-white">Xcode</strong> (Apple App Store) :
                </p>

                <div className="bg-black/50 p-3 rounded-lg border border-white/10 font-mono text-[11px] text-emerald-300 space-y-1.5 overflow-x-auto">
                  <p className="text-gray-400"># 1. Compiler le projet web :</p>
                  <p className="text-white">npm run build</p>
                  <p className="text-gray-400 pt-1"># 2. Générer le projet Android natif :</p>
                  <p className="text-emerald-400">npx cap add android</p>
                  <p className="text-emerald-400">npx cap open android</p>
                  <p className="text-gray-400 pt-1"># 3. Générer le projet iOS Apple :</p>
                  <p className="text-orange-400">npx cap add ios</p>
                  <p className="text-orange-400">npx cap open ios</p>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Idéal pour publier directement sur le Google Play Store et l'Apple App Store avec votre compte développeur.
              </p>
            </div>
          )}

          {/* Close Action */}
          <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold transition-all text-gray-200"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
