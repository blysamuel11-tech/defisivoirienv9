import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, RotateCw, Check, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { playSoundEffect } from '../utils/audio';
import { compressAndResizeImage } from '../utils/imageCompressor';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
  subtitle?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  darkMode?: boolean;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = "Appareil photo",
  subtitle = "Cadre la photo puis appuie sur le bouton pour capturer",
  aspectRatio = 'square',
  darkMode = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Stop active media tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Check available video devices
  useEffect(() => {
    if (!isOpen) return;
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Start camera stream
  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    setIsLoading(true);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès à la caméra n'est pas supporté par ce navigateur.");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsLoading(false);
    } catch (err: unknown) {
      console.warn("Erreur d'accès à la caméra:", err);
      const errMsg = err instanceof Error ? err.name : '';
      if (errMsg === 'NotAllowedError' || errMsg === 'PermissionDeniedError') {
        setCameraError("Autorisation d'accès à la caméra refusée. Activez l'accès dans les paramètres du navigateur.");
      } else if (errMsg === 'NotFoundError' || errMsg === 'DevicesNotFoundError') {
        setCameraError("Aucun capteur caméra n'a été détecté sur cet appareil.");
      } else {
        setCameraError("Impossible d'activer la caméra. Vous pouvez utiliser le sélecteur photo de l'appareil.");
      }
      setIsLoading(false);
    }
  }, [stopStream]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedPhoto(null);
      setCameraError(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  // Switch between front and back camera
  const handleToggleFacingMode = () => {
    playSoundEffect('select');
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture photo from video feed
  const handleTakeSnap = async () => {
    if (!videoRef.current) return;
    playSoundEffect('click');
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      if (aspectRatio === 'square') {
        // Crop square from center
        const size = Math.min(vw, vh);
        const startX = (vw - size) / 2;
        const startY = (vh - size) / 2;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // If using selfie user camera, mirror it horizontally so it feels natural like a mirror
          if (facingMode === 'user') {
            ctx.translate(size, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        }
      } else {
        canvas.width = vw;
        canvas.height = vh;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (facingMode === 'user') {
            ctx.translate(vw, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, vw, vh);
        }
      }

      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      // Auto compress to keep app lightweight
      const compressed = await compressAndResizeImage(rawDataUrl, 800, 0.85);
      setCapturedPhoto(compressed);
      stopStream();
    } catch (err) {
      console.error("Erreur lors de la capture de photo:", err);
    }
  };

  // Confirm and validate photo
  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      playSoundEffect('success');
      onCapture(capturedPhoto);
      onClose();
    }
  };

  // Retake photo
  const handleRetake = () => {
    playSoundEffect('click');
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  // Fallback native photo picker
  const handleFallbackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeImage(file, 800, 0.85);
      setCapturedPhoto(compressed);
      stopStream();
    } catch (err) {
      console.warn("Erreur fallback fichier:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-md rounded-2xl sm:rounded-3xl border overflow-hidden shadow-2xl relative flex flex-col ${
            darkMode
              ? 'bg-[#05160E] border-[#184830] text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Shutter flash effect */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
          )}

          {/* Modal Header */}
          <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-[#143B28]/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#E65A00]/20 text-[#FF7A1A] border border-[#E65A00]/40">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-sm sm:text-base font-black tracking-wide uppercase">
                  {title}
                </h3>
                <p className={`text-[11px] font-mono line-clamp-1 ${darkMode ? 'text-emerald-400/80' : 'text-gray-500'}`}>
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSoundEffect('click');
                onClose();
              }}
              className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Camera Viewfinder Area */}
          <div className="p-3 sm:p-4 flex flex-col items-center justify-center">
            <div
              className={`relative w-full overflow-hidden rounded-2xl border-2 flex items-center justify-center bg-black ${
                aspectRatio === 'square'
                  ? 'aspect-square max-w-[340px]'
                  : 'aspect-[4/3] max-w-[380px]'
              } ${
                capturedPhoto
                  ? 'border-[#10B981]'
                  : darkMode
                  ? 'border-[#1A5438]'
                  : 'border-gray-300'
              }`}
            >
              {/* If user already captured a photo, preview it */}
              {capturedPhoto ? (
                <div className="relative w-full h-full">
                  <img
                    src={capturedPhoto}
                    alt="Capture"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#10B981]/90 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Check className="w-3 h-3" />
                    <span>Photo prête</span>
                  </div>
                </div>
              ) : cameraError ? (
                /* Camera Error Screen with fallback */
                <div className="p-5 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-mono text-gray-300 max-w-[260px] leading-relaxed">
                    {cameraError}
                  </p>
                  <div className="flex flex-col gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="w-full py-2 px-3 bg-[#0c3120] hover:bg-[#12442d] border border-[#1b633f] text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Réessayer la caméra</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileFallbackRef.current?.click()}
                      className="w-full py-2 px-3 bg-[#E65A00] hover:bg-[#FF7A1A] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Choisir une photo depuis l'appareil</span>
                    </button>
                    <input
                      type="file"
                      ref={fileFallbackRef}
                      onChange={handleFallbackFile}
                      accept="image/*"
                      capture="user"
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                /* Live Camera Video Viewfinder */
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-all ${
                      facingMode === 'user' ? '-scale-x-100' : ''
                    }`}
                  />

                  {/* Loading spinner */}
                  {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs gap-2 z-10">
                      <RotateCw className="w-7 h-7 text-[#FF7A1A] animate-spin" />
                      <span className="text-xs font-mono text-emerald-300 tracking-wider font-bold">
                        Activation de la caméra...
                      </span>
                    </div>
                  )}

                  {/* Camera Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-[#10B981] rounded-tl-lg" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-[#10B981] rounded-tr-lg" />
                    </div>
                    {/* Center crosshair */}
                    <div className="self-center w-10 h-10 border border-dashed border-emerald-400/40 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-[#FF7A1A] rounded-full" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-[#10B981] rounded-bl-lg" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-[#10B981] rounded-br-lg" />
                    </div>
                  </div>

                  {/* Switch Front/Rear Camera Button (if multiple cameras or on mobile) */}
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer z-20"
                    title="Changer de caméra (avant / arrière)"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action Bar / Controls */}
          <div className="p-3.5 sm:p-4 border-t border-[#143B28]/40 flex items-center justify-center gap-3">
            {capturedPhoto ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-3 px-4 bg-[#092215] hover:bg-[#0e3521] border border-[#1a5538] text-emerald-300 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors font-mono"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Reprendre</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#10B981] hover:to-[#34D399] text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95 transition-all font-mono"
                >
                  <Check className="w-4 h-4" />
                  <span>Valider la photo</span>
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full px-4">
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
                  title="Choisir depuis la galerie"
                >
                  <ImageIcon className="w-4 h-4 text-[#FF7A1A]" />
                  <span className="hidden sm:inline">Galerie</span>
                </button>
                <input
                  type="file"
                  ref={fileFallbackRef}
                  onChange={handleFallbackFile}
                  accept="image/*"
                  className="hidden"
                />

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={handleTakeSnap}
                  disabled={isLoading || !!cameraError}
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center border-4 shadow-xl active:scale-90 transition-all cursor-pointer ${
                    isLoading || !!cameraError
                      ? 'opacity-40 border-gray-600 bg-gray-800'
                      : 'border-white/80 bg-gradient-to-tr from-[#E65A00] to-[#FF7A1A] hover:brightness-110 shadow-[0_0_25px_rgba(230,90,0,0.5)]'
                  }`}
                  title="Prendre la photo"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/60 flex items-center justify-center bg-white/20">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>

                {/* Switch Camera Button */}
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  disabled={isLoading || !!cameraError}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
                  title="Changer de caméra"
                >
                  <RotateCw className="w-4 h-4 text-[#10B981]" />
                  <span className="hidden sm:inline">Changer</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
