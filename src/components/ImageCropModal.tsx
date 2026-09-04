import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Camera,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { playSoundEffect } from '../utils/audio';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  auraColor?: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  auraColor = 'orange',
  onConfirm,
  onCancel,
}) => {
  const [currentImageSrc, setCurrentImageSrc] = useState(imageUrl);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync internal src with prop
  useEffect(() => {
    if (imageUrl) {
      setCurrentImageSrc(imageUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    }
  }, [imageUrl, isOpen]);

  // Color mappings
  const auraHex =
    auraColor === 'green'
      ? '#10B981'
      : auraColor === 'teal'
      ? '#06B6D4'
      : auraColor === 'purple'
      ? '#A855F7'
      : '#E65A00';

  // Handle pointer drag
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    playSoundEffect('select');
    setZoom((prev) => Math.min(3.5, prev + 0.2));
  };

  const handleZoomOut = () => {
    playSoundEffect('select');
    setZoom((prev) => Math.max(0.6, prev - 0.2));
  };

  const handleRotate = () => {
    playSoundEffect('select');
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    playSoundEffect('click');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Handle new image from gallery or camera
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCurrentImageSrc(reader.result);
          setZoom(1);
          setPan({ x: 0, y: 0 });
          setRotation(0);
          playSoundEffect('success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Export cropped canvas
  const handleCropAndSave = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    try {
      const outputSize = 400; // High resolution square avatar
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Crop viewport dimension on screen (260px in UI)
      const viewportSize = 260;
      const scaleFactor = outputSize / viewportSize;

      // Fill background dark just in case
      ctx.fillStyle = '#04140D';
      ctx.fillRect(0, 0, outputSize, outputSize);

      ctx.save();
      // Move to center of canvas
      ctx.translate(outputSize / 2, outputSize / 2);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply pan scaled up
      const scaledPanX = pan.x * scaleFactor;
      const scaledPanY = pan.y * scaleFactor;

      // When rotated by 90 or 270, pan coordinates rotate too
      if (rotation === 90) {
        ctx.translate(scaledPanY, -scaledPanX);
      } else if (rotation === 180) {
        ctx.translate(-scaledPanX, -scaledPanY);
      } else if (rotation === 270) {
        ctx.translate(-scaledPanY, scaledPanX);
      } else {
        ctx.translate(scaledPanX, scaledPanY);
      }

      // Draw image scaled
      const baseScale = Math.max(
        (viewportSize * scaleFactor) / (img.naturalWidth || 1),
        (viewportSize * scaleFactor) / (img.naturalHeight || 1)
      );
      const totalScale = baseScale * zoom;

      const drawW = (img.naturalWidth || outputSize) * totalScale;
      const drawH = (img.naturalHeight || outputSize) * totalScale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const resultDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      playSoundEffect('success');
      onConfirm(resultDataUrl);
    } catch (err) {
      console.error('Error cropping image:', err);
      // Fallback directly to image src if canvas tainted by CORS
      onConfirm(currentImageSrc);
    }
  }, [currentImageSrc, pan, zoom, rotation, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#072015] border border-[#185337] rounded-2xl sm:rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#143B28] bg-[#04140D]">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-[#FF7A1A]" />
            <h3 className="text-xs sm:text-sm font-black text-white font-display uppercase tracking-wider">
              CADRER & REDIMENSIONNER L'IMAGE
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 rounded-full bg-[#0a271a] border border-[#16422d] text-emerald-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex flex-col items-center space-y-4">
          <p className="text-[11px] text-emerald-300/80 text-center font-mono">
            Glissez pour centrer, zoomez et pivotez pour un rendu optimal.
          </p>

          {/* Interactive Crop Frame Container */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-[260px] h-[260px] rounded-2xl sm:rounded-3xl bg-[#030d08] border-2 border-[#164830] overflow-hidden cursor-grab active:cursor-grabbing touch-none flex items-center justify-center shadow-inner"
          >
            {/* The Image inside */}
            <img
              ref={imgRef}
              src={currentImageSrc}
              alt="Crop Target"
              crossOrigin="anonymous"
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              className="pointer-events-none select-none"
            />

            {/* Framing Mask Overlay (Circle & Grid) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Darkened outer perimeter with circular cut-out */}
              <div
                style={{
                  boxShadow: '0 0 0 9999px rgba(3, 13, 8, 0.75)',
                  borderColor: auraHex,
                }}
                className="w-[200px] h-[200px] rounded-full border-2 border-dashed relative transition-all"
              >
                {/* Cyber corner brackets */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#FF7A1A]" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#FF7A1A]" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#FF7A1A]" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#FF7A1A]" />

                {/* Subtle Rule-of-thirds grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar: Zoom Slider + Buttons */}
          <div className="w-full space-y-2 bg-[#04140D] p-3 rounded-xl border border-[#143B28]">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-[#072015] border border-[#16422d] text-emerald-300 hover:text-white"
                title="Dézoomer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0.6"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[#FF7A1A] h-1.5 bg-[#0e3322] rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-[#072015] border border-[#16422d] text-emerald-300 hover:text-white"
                title="Zoomer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Rotate */}
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-lg bg-[#072015] border border-[#16422d] text-emerald-300 hover:text-white flex items-center gap-1"
                title="Pivoter 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-[#072015] border border-[#16422d] text-emerald-300 hover:text-white"
                title="Recentrer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Change image sources buttons inside the crop tool */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 py-1.5 px-2.5 bg-[#072015] border border-[#164830] hover:border-[#10B981] rounded-lg text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors uppercase font-mono"
              >
                <Camera className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Prendre photo</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 py-1.5 px-2.5 bg-[#072015] border border-[#164830] hover:border-[#FF7A1A] rounded-lg text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors uppercase font-mono"
              >
                <Upload className="w-3.5 h-3.5 text-[#FF7A1A]" />
                <span>Galerie</span>
              </button>

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="user"
                className="hidden"
              />
              <input
                type="file"
                ref={galleryInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Action Buttons: Save & Cancel */}
          <div className="w-full flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-3 bg-[#04140D] border border-[#16402C] hover:border-emerald-500 rounded-xl text-emerald-300 hover:text-white text-xs font-bold transition-colors uppercase font-mono"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleCropAndSave}
              className="flex-2 py-2.5 px-4 bg-gradient-to-r from-[#E65A00] via-[#FF6A00] to-[#E65A00] hover:from-[#FF7A1A] hover:to-[#E65A00] text-white font-black text-xs rounded-xl shadow-[0_4px_15px_rgba(230,90,0,0.4)] border border-[#FFA559]/40 flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider active:scale-95 transition-all whitespace-nowrap"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>VALIDER LE CADRAGE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
