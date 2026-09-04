import React, { useState, useRef } from 'react';
import { ArrowLeft, ChevronDown, Check, Info, RotateCw, Camera, Video, Upload, Sparkles, Trophy, ArrowRight, AlertCircle, Volume2, User } from 'lucide-react';
import { Challenge, ChallengeType, Intensity, UserProfile, GameHistoryItem } from '../types';
import { playSoundEffect, speakVoice } from '../utils/audio';
import { TRANSLATIONS } from '../data/translations';
import { validateContentModeration } from '../utils/moderation';
import { compressAndResizeImage } from '../utils/imageCompressor';
import { CameraCaptureModal } from './CameraCaptureModal';

interface SoloViewProps {
  user: UserProfile;
  onUpdateScore: (points: number) => void;
  onLogHistory: (item: GameHistoryItem) => void;
  challenges: Challenge[];
  lang?: 'FR' | 'EN';
  darkMode?: boolean;
}

export const SoloView: React.FC<SoloViewProps> = ({
  user,
  onUpdateScore,
  onLogHistory,
  challenges,
  lang = 'FR',
  darkMode = true,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [intensity, setIntensity] = useState<Intensity>('simple');
  const [showIntensityDropdown, setShowIntensityDropdown] = useState(false);
  const [selectedType, setSelectedType] = useState<ChallengeType>('vérité');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [proofMedia, setProofMedia] = useState<string | null>(null);
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'approved' | 'passed';
    message: string;
    points: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];

  // Calculate points according to Section 5.4 & 7.1 of Cahier des Charges:
  // Simple = 15 pts, Osée = 30 pts
  const getChallengePoints = (inten: Intensity) => {
    return inten === 'osée' ? 30 : 15;
  };

  // Anti-repetition challenge selector (Section 5.3)
  const getRandomChallenge = (type: ChallengeType, inten: Intensity, excludeId?: string) => {
    const pool = challenges.filter((c) => c.type === type && c.intensity === inten && c.id !== excludeId);
    const candidates = pool.length > 0 ? pool : challenges.filter((c) => c.type === type && c.intensity === inten);
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return {
      id: `custom-${Date.now()}`,
      text: type === 'vérité'
        ? 'Quel est le secret que tu n’as jamais osé révéler à tes amis ?'
        : 'Fais 10 squats en chantant le refrain de ta chanson préférée !',
      textEn: type === 'vérité'
        ? 'What is the secret you never dared to tell your friends?'
        : 'Do 10 squats while singing the chorus of your favorite song!',
      type,
      intensity: inten,
    };
  };

  const handleStartChallenge = (type: ChallengeType) => {
    playSoundEffect('select');
    setSelectedType(type);
    const chosen = getRandomChallenge(type, intensity);
    setCurrentChallenge(chosen);
    setAnswerText('');
    setProofMedia(null);
    setModerationWarning(null);
    setCurrentStep(2);
    if (chosen) {
      const textToRead = lang === 'EN' && chosen.textEn ? chosen.textEn : chosen.text;
      speakVoice(textToRead, lang);
    }
  };

  // Passer : ne fait pas sortir l'utilisateur de l'écran ; charge immédiatement un nouveau défi du même type avec "Vérité passée 0 point" ou "Action passée 0 point"
  const handlePass = () => {
    playSoundEffect('pass');
    const isVerite = selectedType === 'vérité';
    const passMessage = isVerite
      ? (lang === 'FR' ? 'Vérité passée, 0 point' : 'Truth skipped, 0 points')
      : (lang === 'FR' ? 'Action passée, 0 point' : 'Action skipped, 0 points');

    setStatusFeedback({
      type: 'passed',
      message: passMessage,
      points: 0,
    });
    setTimeout(() => setStatusFeedback(null), 3500);

    if (currentChallenge) {
      const challengeDisplay = lang === 'EN' && currentChallenge.textEn ? currentChallenge.textEn : currentChallenge.text;
      onLogHistory({
        id: `hist-${Date.now()}`,
        challengeText: challengeDisplay,
        type: currentChallenge.type,
        status: 'passé',
        points: 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        answerText: passMessage,
      });
    }
    // Charge immédiatement un nouveau défi anti-répétition sans quitter l'écran
    const nextChallenge = getRandomChallenge(selectedType, intensity, currentChallenge?.id);
    setCurrentChallenge(nextChallenge);
    setAnswerText('');
    setProofMedia(null);
    setModerationWarning(null);
  };

  // Envoyer / J'ai relevé le défi (Section 5.4 : Simple = 15 pts, Osée = 30 pts)
  const handleComplete = () => {
    // Content moderation check (Section 9.1)
    if (selectedType === 'vérité' && answerText.trim()) {
      const modResult = validateContentModeration(answerText, lang);
      if (!modResult.isValid) {
        playSoundEffect('fail');
        setModerationWarning(modResult.warningMessage);
        return;
      }
    }

    // Chic bruit d'approbation et message dédié
    playSoundEffect('approval');
    const isVerite = selectedType === 'vérité';
    const earned = getChallengePoints(intensity);
    const approveMessage = isVerite
      ? (lang === 'FR' ? 'Vérité approuvée, point accordé' : 'Truth approved, points awarded')
      : (lang === 'FR' ? 'Action approuvée, point accordé' : 'Action approved, points awarded');

    setStatusFeedback({
      type: 'approved',
      message: approveMessage,
      points: earned,
    });
    setTimeout(() => setStatusFeedback(null), 3500);

    if (currentChallenge) {
      const challengeDisplay = lang === 'EN' && currentChallenge.textEn ? currentChallenge.textEn : currentChallenge.text;
      onUpdateScore(earned);
      onLogHistory({
        id: `hist-${Date.now()}`,
        challengeText: challengeDisplay,
        type: currentChallenge.type,
        status: 'relevé',
        points: earned,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        answerText: answerText.trim() || (proofMedia ? 'Preuve envoyée !' : t.sendAnswer),
        proofMedia: proofMedia || undefined,
      });
    }

    // Le champ de réponse doit être systématiquement vidé après chaque tour (Section 5.3)
    // Et un nouveau défi différent est proposé immédiatement
    const nextChallenge = getRandomChallenge(selectedType, intensity, currentChallenge?.id);
    setCurrentChallenge(nextChallenge);
    setAnswerText('');
    setProofMedia(null);
    setModerationWarning(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress & resize image automatically under 1MB (Section 4.2)
        const compressed = await compressAndResizeImage(file);
        setProofMedia(compressed);
        playSoundEffect('notification');
      } catch (err) {
        console.warn('Image upload error', err);
      }
    }
  };

  const handleStartCamera = () => {
    playSoundEffect('select');
    setIsCapturingCamera(true);
  };

  const displayedChallengeText = currentChallenge
    ? (lang === 'EN' && currentChallenge.textEn ? currentChallenge.textEn : currentChallenge.text)
    : '';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none pb-8" id="solo-screen">
      {/* Player Header Banner */}
      <div
        className={`w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 mb-3 sm:mb-4 flex items-center justify-between transition-all backdrop-blur-xl relative overflow-hidden ${
          darkMode
            ? 'bg-[#061D12] border border-[#133F28] shadow-lg'
            : 'bg-white border border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              borderColor: user.auraColor === 'green' ? '#10B981' : user.auraColor === 'teal' ? '#06B6D4' : user.auraColor === 'purple' ? '#A855F7' : '#E65A00',
              boxShadow: `0 0 12px ${user.auraColor === 'green' ? '#10B981' : user.auraColor === 'teal' ? '#06B6D4' : user.auraColor === 'purple' ? '#A855F7' : '#E65A00'}40`,
            }}
            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 p-0.5 overflow-hidden shrink-0 transition-all flex items-center justify-center ${
              darkMode ? 'bg-[#04140D]' : 'bg-gray-100'
            }`}
          >
            {user.avatar && user.avatar.trim() ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-6 h-6 text-emerald-400 opacity-60" />
            )}
          </div>
          <div className="min-w-0">
            <span
              className={`text-xs font-black block tracking-wider truncate ${
                darkMode ? 'text-emerald-400' : 'text-gray-500'
              }`}
            >
              {user.name || (lang === 'FR' ? 'JOUEUR' : 'PLAYER')}
            </span>
            <div
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-black font-mono ${
                darkMode ? 'text-white' : 'text-[#111827]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#FF7A1A] shrink-0" />
              <span>{user.score} PTS</span>
            </div>
          </div>
        </div>

        {/* Status Pill Badge as in reference image */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 select-none ${
            darkMode
              ? 'bg-[#0A3D24] text-[#10B981] border border-[#10B981]/40'
              : 'bg-[#10B981] text-white shadow-sm'
          }`}
        >
          <span className={`w-2 h-2 rounded-full animate-pulse ${darkMode ? 'bg-[#10B981]' : 'bg-white'}`} />
          <span>{lang === 'FR' ? 'Activé' : 'Active'}</span>
        </div>
      </div>

      {/* STEP 1: INTENSITY & VÉRITÉ/ACTION CARDS */}
      {currentStep === 1 && (
        <div className="w-full space-y-3 sm:space-y-4 animate-in fade-in duration-200">
          {/* Intensity Selector Card */}
          <div
            className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all relative ${
              darkMode
                ? 'bg-[#061D12] border border-[#133F28] shadow-lg'
                : 'bg-white border border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
            }`}
          >
            {/* Header label */}
            <div className="flex items-center justify-between mb-2.5">
              <div
                className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider font-mono ${
                  darkMode ? 'text-[#34D399]' : 'text-[#1F2937]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF7A1A] shrink-0" />
                <span>✦ {t.intensity.toUpperCase()}</span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  darkMode
                    ? 'bg-[#04140D] text-emerald-400 border border-[#143B28]'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {intensity === 'simple' ? '+15 PTS' : '+30 PTS'}
              </span>
            </div>

            {/* Glowing Orange Dropdown Pill Button */}
            <button
              type="button"
              id="intensity-dropdown-trigger"
              onClick={() => {
                playSoundEffect('click');
                setShowIntensityDropdown(!showIntensityDropdown);
              }}
              className="w-full bg-gradient-to-r from-[#D85200] via-[#E65A00] to-[#C84500] hover:from-[#E65A00] hover:to-[#FF6A00] text-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-md border border-[#FFA559]/50 transition-all cursor-pointer select-none active:scale-[0.99]"
            >
              <div className="text-left min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black tracking-wide font-display">
                    {intensity === 'simple' ? t.simpleIntensity : t.oseeIntensity}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/25">
                    {intensity === 'simple' ? '+15 PTS' : '+30 PTS'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider block opacity-95 mt-0.5 font-mono truncate">
                  {intensity === 'simple' ? t.simpleDesc : t.oseeDesc}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 shrink-0 transition-transform duration-200 text-white/90 ${
                  showIntensityDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Intensity Menu Dropdown */}
            {showIntensityDropdown && (
              <div
                className={`mt-2.5 rounded-xl sm:rounded-2xl p-2 space-y-1.5 border animate-in fade-in zoom-in-95 duration-150 ${
                  darkMode
                    ? 'bg-[#04140D] border-[#164830]'
                    : 'bg-gray-50 border-gray-200 shadow-lg'
                }`}
              >
                {/* Simple */}
                <button
                  type="button"
                  onClick={() => {
                    playSoundEffect('select');
                    setIntensity('simple');
                    setShowIntensityDropdown(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                    intensity === 'simple'
                      ? 'bg-[#E65A00] text-white font-bold'
                      : darkMode
                      ? 'hover:bg-[#092b1b] text-emerald-200'
                      : 'hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase font-display">{t.simpleIntensity}</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 font-bold">+15 PTS</span>
                    </div>
                    <span className="text-[10px] opacity-90 block">{t.simpleDesc}</span>
                  </div>
                  {intensity === 'simple' && <Check className="w-4 h-4 text-white shrink-0" />}
                </button>

                {/* Osée */}
                <button
                  type="button"
                  onClick={() => {
                    playSoundEffect('select');
                    setIntensity('osée');
                    setShowIntensityDropdown(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                    intensity === 'osée'
                      ? 'bg-[#E65A00] text-white font-bold'
                      : darkMode
                      ? 'hover:bg-[#092b1b] text-emerald-200'
                      : 'hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase font-display">{t.oseeIntensity}</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/20 font-bold">+30 PTS</span>
                    </div>
                    <span className="text-[10px] opacity-90 block">{t.oseeDesc}</span>
                  </div>
                  {intensity === 'osée' && <Check className="w-4 h-4 text-white shrink-0" />}
                </button>
              </div>
            )}
          </div>

          {/* 2 Big Mode Cards side-by-side: VÉRITÉ & ACTION */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
            {/* Vérité Card */}
            <button
              id="card-verite"
              type="button"
              onClick={() => handleStartChallenge('vérité')}
              className={`group relative rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col items-center text-center active:scale-[0.98] transition-all duration-200 overflow-hidden cursor-pointer ${
                darkMode
                  ? 'bg-[#061D12] border border-[#133F28] hover:border-[#FF7A1A]/70 shadow-lg hover:shadow-[0_0_25px_rgba(230,90,0,0.25)]'
                  : 'bg-white border border-gray-100 hover:border-gray-200 shadow-[0_12px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(230,90,0,0.12)]'
              }`}
            >
              {/* Info icon circle */}
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm ${
                  darkMode
                    ? 'bg-[#1A3325] border border-[#274E39] text-[#FF7A1A]'
                    : 'bg-[#FFF3EB] border border-[#FFE0CC] text-[#E65A00]'
                }`}
              >
                <Info className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3
                className={`text-base sm:text-xl font-black tracking-wide font-display whitespace-nowrap ${
                  darkMode ? 'text-white' : 'text-[#111827]'
                }`}
              >
                {t.verite}
              </h3>
              <p
                className={`text-[10px] sm:text-xs italic mt-1 font-medium leading-tight ${
                  darkMode ? 'text-emerald-300/80' : 'text-[#4B5563]'
                }`}
              >
                {lang === 'FR' ? 'Confesse-toi au monde !' : 'Speak your truth!'}
              </p>
            </button>

            {/* Action Card */}
            <button
              id="card-action"
              type="button"
              onClick={() => handleStartChallenge('action')}
              className={`group relative rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col items-center text-center active:scale-[0.98] transition-all duration-200 overflow-hidden cursor-pointer ${
                darkMode
                  ? 'bg-[#061D12] border border-[#133F28] hover:border-[#10B981]/70 shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]'
                  : 'bg-white border border-gray-100 hover:border-gray-200 shadow-[0_12px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(16,185,129,0.12)]'
              }`}
            >
              {/* RotateCw icon circle */}
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm ${
                  darkMode
                    ? 'bg-[#123826] border border-[#1B5037] text-[#10B981]'
                    : 'bg-[#EDFBF4] border border-[#D1F4E2] text-[#10B981]'
                }`}
              >
                <RotateCw className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3
                className={`text-base sm:text-xl font-black tracking-wide font-display whitespace-nowrap ${
                  darkMode ? 'text-white' : 'text-[#111827]'
                }`}
              >
                {t.action}
              </h3>
              <p
                className={`text-[10px] sm:text-xs italic mt-1 font-medium leading-tight ${
                  darkMode ? 'text-emerald-300/80' : 'text-[#4B5563]'
                }`}
              >
                {lang === 'FR' ? 'Relève le défi du moument !' : 'Take the bold dare!'}
              </p>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ACTIVE CHALLENGE & RESOLUTION */}
      {currentStep === 2 && currentChallenge && (
        <div
          className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative animate-in fade-in duration-200 space-y-4 backdrop-blur-xl ${
            darkMode
              ? 'bg-[#061D12]/98 border border-[#133F28] text-white shadow-2xl'
              : 'bg-white border border-gray-100 text-[#111827] shadow-[0_15px_40px_rgba(0,0,0,0.08)]'
          }`}
        >
          {/* Top category pill & Step Back icon */}
          <div className="flex items-center justify-between gap-2">
            <button
              id="challenge-back-btn"
              onClick={() => {
                playSoundEffect('click');
                setCurrentStep(1);
                setCurrentChallenge(null);
                setProofMedia(null);
                setModerationWarning(null);
              }}
              aria-label={lang === 'FR' ? 'Retour aux modes' : 'Back to categories'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                darkMode
                  ? 'bg-[#04140D] border border-[#143B28] text-emerald-300 hover:text-white'
                  : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span
              className={`px-3 sm:px-4 py-1 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap font-display text-white ${
                selectedType === 'vérité'
                  ? 'bg-gradient-to-r from-[#9E3500] to-[#C94700] shadow-md shadow-[#9E3500]/30'
                  : 'bg-gradient-to-r from-[#047857] to-[#10B981] shadow-md shadow-[#10B981]/30'
              }`}
            >
              {selectedType === 'vérité' ? t.verite : t.action} ({intensity === 'osée' ? t.oseeIntensity : t.simpleIntensity})
            </span>
          </div>

          {/* Real-time Status Feedback (Approuvée / Passée) */}
          {statusFeedback && (
            <div
              className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 animate-in slide-in-from-top-2 fade-in duration-200 shadow-xl ${
                statusFeedback.type === 'approved'
                  ? 'bg-[#0a2e1d] border-[#10B981] text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                  : 'bg-[#261007] border-[#FF7A1A]/80 text-orange-100 shadow-[0_0_20px_rgba(255,122,26,0.25)]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {statusFeedback.type === 'approved' ? (
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-black tracking-wide font-display">
                  {statusFeedback.message}
                </span>
              </div>
              <span
                className={`text-xs sm:text-sm font-black font-mono shrink-0 px-2.5 py-1 rounded-xl ${
                  statusFeedback.type === 'approved'
                    ? 'bg-[#10B981]/25 text-[#34D399] border border-[#10B981]/50'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/35'
                }`}
              >
                {statusFeedback.points > 0 ? `+${statusFeedback.points} PTS` : '0 PT'}
              </span>
            </div>
          )}

          {/* Moderation Warning */}
          {moderationWarning && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-tight">{moderationWarning}</p>
            </div>
          )}

          {/* Question or Dare Prompt */}
          <div className="my-3 sm:my-5 text-center flex flex-col items-center">
            <h2
              className={`text-lg sm:text-2xl md:text-3xl font-black italic font-display leading-snug tracking-tight px-1 sm:px-2 ${
                darkMode ? 'text-white' : 'text-[#111827]'
              }`}
            >
              “{displayedChallengeText}”
            </h2>
            <button
              type="button"
              onClick={() => {
                playSoundEffect('click');
                speakVoice(displayedChallengeText, lang);
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E65A00]/15 hover:bg-[#E65A00]/25 text-[#FF7A1A] border border-[#FF7A1A]/30 active:scale-95 transition-all cursor-pointer select-none"
              title={lang === 'FR' ? 'Lire à voix haute' : 'Read aloud'}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? 'Écouter la voix' : 'Listen voice'}</span>
            </button>
          </div>

          {/* Vérité Input Area */}
          {selectedType === 'vérité' && (
            <div className="space-y-1.5">
              <label
                className={`text-[10px] font-black uppercase tracking-wider block font-mono ${
                  darkMode ? 'text-emerald-400' : 'text-gray-600'
                }`}
              >
                {t.yourConfession} (OPTIONNELLE) :
              </label>
              <textarea
                placeholder={t.confessionPlaceholder}
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value);
                  if (moderationWarning) setModerationWarning(null);
                  playSoundEffect('typing');
                }}
                rows={3}
                className={`w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm outline-none resize-none shadow-inner transition-colors border ${
                  darkMode
                    ? 'bg-[#04140D] border-[#164830] text-white placeholder:text-emerald-700/80 focus:border-[#FF7A1A]'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#E65A00]'
                }`}
              />
            </div>
          )}

          {/* Action Proof Area (Photo, video, doc or sticker) */}
          {selectedType === 'action' && (
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*,.pdf,.doc,.docx"
                className="hidden"
              />

              {proofMedia && proofMedia.trim() ? (
                <div
                  className={`relative w-full rounded-2xl border-2 border-[#10B981] overflow-hidden max-h-56 flex items-center justify-center p-2 ${
                    darkMode ? 'bg-[#04140D]' : 'bg-gray-50'
                  }`}
                >
                  <img src={proofMedia} alt="Preuve de défi" className="max-h-52 object-contain rounded-xl" />
                  <button
                    onClick={() => {
                      setProofMedia(null);
                      playSoundEffect('select');
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-md uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <div
                  className={`w-full border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-colors ${
                    darkMode
                      ? 'border-[#184e33] bg-[#04140D]/70 hover:border-[#10B981]/70'
                      : 'border-gray-200 bg-gray-50/70 hover:border-gray-400'
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 mb-1.5 ${
                      darkMode ? 'text-emerald-400/80' : 'text-gray-500'
                    }`}
                  >
                    <Camera className="w-5 h-5 text-[#10B981]" />
                    <Video className="w-5 h-5 text-[#FF7A1A]" />
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-black tracking-wider block mb-2 font-mono ${
                      darkMode ? 'text-emerald-100' : 'text-gray-700'
                    }`}
                  >
                    {t.proofRequired}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-3 py-1.5 border font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap font-mono cursor-pointer ${
                        darkMode
                          ? 'bg-[#0a2e1d] hover:bg-[#0f442b] border-[#1a5337] text-white'
                          : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-800 shadow-sm'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-[#E65A00]" />
                      <span>{t.uploadFile}</span>
                    </button>
                    <button
                      onClick={handleStartCamera}
                      className={`px-3 py-1.5 border font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap font-mono cursor-pointer ${
                        darkMode
                          ? 'bg-[#0a2e1d] hover:bg-[#0f442b] border-[#1a5337] text-white'
                          : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-800 shadow-sm'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>{t.openCamera}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action / Complete Buttons */}
          <div
            className={`flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t ${
              darkMode ? 'border-[#143B28]' : 'border-gray-100'
            }`}
          >
            <button
              id="btn-pass"
              onClick={handlePass}
              className={`text-xs font-black uppercase tracking-wider py-2.5 px-3 text-center transition-colors whitespace-nowrap font-mono ${
                darkMode ? 'text-emerald-400/70 hover:text-emerald-300' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.passChallenge} (0 PT)
            </button>

            <button
              id="btn-complete"
              onClick={handleComplete}
              className={`py-3 sm:py-3.5 px-4 sm:px-6 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-xl active:scale-[0.98] transition-all text-white flex items-center justify-center gap-2 whitespace-nowrap select-none ${
                selectedType === 'vérité'
                  ? 'bg-gradient-to-r from-[#9E3500] via-[#C94700] to-[#9E3500] hover:from-[#B84000] hover:to-[#B84000] shadow-[0_4px_20px_rgba(201,71,0,0.4)] border border-[#FFA559]/50'
                  : 'bg-gradient-to-r from-[#047857] via-[#10B981] to-[#047857] hover:from-[#059669] hover:to-[#10B981] shadow-[0_4px_20px_rgba(16,185,129,0.4)] border border-[#6EE7B7]/50'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{t.sendAnswer}</span>
              <span className="opacity-95 font-mono text-[11px] sm:text-xs shrink-0">
                (+{getChallengePoints(intensity)} pts)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Live Device Camera Modal for Solo Challenge Proof */}
      <CameraCaptureModal
        isOpen={isCapturingCamera}
        onClose={() => setIsCapturingCamera(false)}
        onCapture={(dataUrl) => {
          setProofMedia(dataUrl);
          setIsCapturingCamera(false);
          playSoundEffect('success');
        }}
        title="Appareil photo - Preuve de défi"
        subtitle="Prends en photo la preuve de réalisation de ton défi"
        aspectRatio="video"
        darkMode={darkMode}
      />
    </div>
  );
};
