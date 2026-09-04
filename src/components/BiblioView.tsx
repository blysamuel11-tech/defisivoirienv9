import React, { useState } from 'react';
import {
  Trophy,
  History,
  Sparkles,
  PlusCircle,
  BarChart3,
  Check,
  Radio,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Medal,
  Award,
  Crown,
  Users,
  User,
  Gamepad2,
} from 'lucide-react';
import { UserProfile, GameHistoryItem, Challenge, ChallengeType, Intensity, GameTab } from '../types';
import { playSoundEffect } from '../utils/audio';
import { TRANSLATIONS, getGlobalRank } from '../data/translations';
import { validateContentModeration } from '../utils/moderation';

interface BiblioViewProps {
  user: UserProfile;
  history: GameHistoryItem[];
  challenges: Challenge[];
  onAddCustomChallenge: (challenge: Challenge) => void;
  onUpdateChallenge?: (challenge: Challenge) => void;
  onDeleteChallenge?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onSelectTab?: (tab: GameTab) => void;
  lang?: 'FR' | 'EN';
  darkMode?: boolean;
}

export const BiblioView: React.FC<BiblioViewProps> = ({
  user,
  history,
  challenges,
  onAddCustomChallenge,
  onSelectTab,
  lang = 'FR',
  darkMode = true,
}) => {
  const t = TRANSLATIONS[lang];

  // Section 7 : L'écran Bibliothèque est composé de deux onglets uniquement :
  // « Proposer un défi » et « Stats & Historique ». Aucun autre onglet affichant une longue liste de questions ne doit être présent.
  const [activeTab, setActiveTab] = useState<'create' | 'stats'>('stats');

  // Creation form states (Section 7.2)
  const [createType, setCreateType] = useState<ChallengeType>('vérité');
  const [createLevel, setCreateLevel] = useState<Intensity>('simple');
  const [createInput, setCreateInput] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  // History pagination
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // Stats calculation strictly derived from real history (Section 10.10: Zero fake data)
  const veritesCount = history.filter((h) => h.type === 'vérité' && h.status === 'relevé').length;
  const actionsCount = history.filter((h) => h.type === 'action' && h.status === 'relevé').length;
  const veritesPassedCount = history.filter((h) => h.type === 'vérité' && h.status === 'passé').length;
  const actionsPassedCount = history.filter((h) => h.type === 'action' && h.status === 'passé').length;

  // Global Rank info based on score
  const globalRankInfo = getGlobalRank(user.score || 0, (lang === 'EN' ? 'EN' : 'FR'));

  // Détection de la salle de jeu dans un salon (Le classement ne s'affiche que lorsque l'utilisateur est dans une partie de salon)
  const activeRoomSession = (() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('gbe_multi_room_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (
            parsed &&
            (parsed.multiStep === 'lobby' || parsed.multiStep === 'game' || parsed.multiStep === 'evaluation') &&
            Array.isArray(parsed.players) &&
            parsed.players.length > 0
          ) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.debug(e);
    }
    return null;
  })();

  const isInRoomGame = Boolean(activeRoomSession);

  // Classement en direct des joueurs présents dans la salle du salon
  const roomLeaderboard = (() => {
    if (!activeRoomSession || !Array.isArray(activeRoomSession.players)) return [];

    return activeRoomSession.players
      .map((p: any) => {
        const isCurrent = p.id === 'p-host' || p.name === user.name;
        return {
          id: p.id || `p-${Math.random()}`,
          name: p.name || 'Joueur',
          avatar: p.avatar || user.avatar,
          score: isCurrent ? (user.score || p.score || 0) : (typeof p.score === 'number' ? p.score : 0),
          isCurrentUser: isCurrent,
          isHost: Boolean(p.isHost),
          status: p.status || (lang === 'FR' ? 'En partie' : 'In game'),
          room: `Salon ${activeRoomSession.roomCode || 'Privé'}`,
        };
      })
      .sort((a: any, b: any) => b.score - a.score);
  })();

  const userRoomRankIndex = roomLeaderboard.findIndex((p: any) => p.isCurrentUser);
  const userRoomRankNumber = userRoomRankIndex >= 0 ? userRoomRankIndex + 1 : 1;

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE));
  const paginatedHistory = history.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

  // AI idea generation helper for custom challenges
  const handleGenerateAiIdea = () => {
    setIsGeneratingAi(true);
    playSoundEffect('select');
    setTimeout(() => {
      const veriteIdeasFr = [
        'Quel est le plus gros mensonge que tu as dit à tes parents sans jamais te faire démasquer ?',
        'Si tu devais échanger ta vie avec l’un des joueurs présents pendant 24h, qui choisirais-tu et pourquoi ?',
        'Quelle est la chose la plus folle que tu as achetée sous le coup de l’émotion ?',
        'Quel est le message envoyé que tu regrettes le plus au monde ?',
      ];
      const actionIdeasFr = [
        'Envoie un message vocal de 10 secondes en imitant une voix de robot !',
        'Fais 15 secondes de danse sans musique avec le plus grand sérieux possible.',
        'Mets ton pull ou t-shirt à l’envers pour les 3 prochains tours.',
        'Imite la réplique culte d’un film connu jusqu’à ce que quelqu’un devine.',
      ];

      const veriteIdeasEn = [
        'What is the biggest lie you ever told your parents without ever getting caught?',
        'If you could swap lives with one player in this room for 24 hours, who would it be?',
        'What is the most ridiculous thing you ever bought on an impulse?',
      ];
      const actionIdeasEn = [
        'Send a 10-second voice note mimicking a robot!',
        'Do a 15-second completely serious dance without any music.',
        'Wear your shirt inside out for the next 3 rounds.',
      ];

      const pool =
        createType === 'vérité'
          ? lang === 'FR'
            ? veriteIdeasFr
            : veriteIdeasEn
          : lang === 'FR'
          ? actionIdeasFr
          : actionIdeasEn;

      const randomIdea = pool[Math.floor(Math.random() * pool.length)];
      setCreateInput(randomIdea);
      setIsGeneratingAi(false);
      playSoundEffect('notification');
    }, 450);
  };

  // Add custom challenge (Section 7.2)
  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createInput.trim()) return;

    // Content moderation check (Section 9.1)
    const modResult = validateContentModeration(createInput.trim(), lang);
    if (!modResult.isValid) {
      playSoundEffect('fail');
      setModerationWarning(modResult.warningMessage);
      return;
    }
    setModerationWarning(null);

    const newChallenge: Challenge = {
      id: `custom-${Date.now()}`,
      text: createInput.trim(),
      type: createType,
      intensity: createLevel,
      author: user.name || (lang === 'FR' ? 'Joueur' : 'Player'),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    onAddCustomChallenge(newChallenge);
    playSoundEffect('success');
    setCreateFeedback(
      lang === 'FR'
        ? 'Défi ajouté avec succès dans la bibliothèque !'
        : 'Challenge successfully saved to the library!'
    );
    setCreateInput('');
    setTimeout(() => setCreateFeedback(null), 3500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none pb-8" id="biblio-screen">
      {/* Top Banner */}
      <div
        className={`w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 mb-4 flex items-center justify-between transition-all relative overflow-hidden ${
          darkMode
            ? 'bg-[#061D12] border border-[#133F28] shadow-xl'
            : 'bg-white border border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-[#FF7A1A] shrink-0 border ${
              darkMode ? 'bg-[#0a2e1d] border-[#195236]' : 'bg-orange-50 border-orange-100'
            }`}
          >
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span
              className={`text-[10px] font-black uppercase tracking-widest block font-mono ${
                darkMode ? 'text-emerald-400' : 'text-gray-600'
              }`}
            >
              {lang === 'FR' ? 'ESPACE JOUEUR' : 'PLAYER HUB'}
            </span>
            <h2 className={`text-sm sm:text-base md:text-lg font-black font-display ${darkMode ? 'text-white' : 'text-[#111827]'}`}>
              {lang === 'FR' ? 'Bibliothèque & Statistiques' : 'Library & Statistics'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold text-[#FF7A1A] px-3 py-1.5 rounded-full border ${
              darkMode ? 'bg-[#04140D] border-[#143B28]' : 'bg-orange-50 border-orange-200'
            }`}
          >
            {challenges.length} {lang === 'FR' ? 'DÉFIS' : 'CARDS'}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Strictly 2 tabs per Section 7) */}
      <div
        className={`w-full flex items-center rounded-2xl p-1 mb-4 shadow-sm gap-1 border transition-all ${
          darkMode ? 'bg-[#061D12] border-[#133F28]' : 'bg-white border-gray-100'
        }`}
      >
        <button
          id="biblio-tab-stats"
          onClick={() => {
            playSoundEffect('click');
            setActiveTab('stats');
          }}
          className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all whitespace-nowrap font-mono cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-gradient-to-r from-[#E65A00] to-[#FF6A00] text-white shadow-md'
              : darkMode
              ? 'text-emerald-300/70 hover:text-white hover:bg-[#092c1d]/60'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>{lang === 'FR' ? 'STATS & HISTORIQUE' : 'STATS & HISTORY'}</span>
        </button>

        <button
          id="biblio-tab-create"
          onClick={() => {
            playSoundEffect('click');
            setActiveTab('create');
          }}
          className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all whitespace-nowrap font-mono cursor-pointer ${
            activeTab === 'create'
              ? 'bg-gradient-to-r from-[#E65A00] to-[#FF6A00] text-white shadow-md'
              : darkMode
              ? 'text-emerald-300/70 hover:text-white hover:bg-[#092c1d]/60'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>{t.proposeChallenge.toUpperCase()}</span>
        </button>
      </div>

      {/* TAB 1: PROPOSE A CUSTOM CHALLENGE (Section 7.2) */}
      {activeTab === 'create' && (
        <div
          className={`w-full max-w-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 animate-in fade-in duration-200 transition-all border ${
            darkMode
              ? 'bg-[#061D12] border-[#133F28] shadow-2xl'
              : 'bg-white border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div className="text-center mb-4">
            <span
              className={`text-[10px] font-black uppercase tracking-widest block font-mono ${
                darkMode ? 'text-emerald-400' : 'text-gray-600'
              }`}
            >
              CONTRIBUTION JOUEUR
            </span>
            <h3 className={`text-base sm:text-xl font-black font-display mt-0.5 ${darkMode ? 'text-white' : 'text-[#111827]'}`}>
              {t.proposeChallenge}
            </h3>
            <p className={`text-[11px] sm:text-xs mt-1 ${darkMode ? 'text-emerald-300/80' : 'text-gray-600'}`}>
              {lang === 'FR'
                ? 'Tes défis personnalisés sont enregistrés et enrichissent directement tes parties.'
                : 'Your custom challenges are saved and immediately enrich your games.'}
            </p>
          </div>

          {createFeedback && (
            <div
              className={`mb-3 p-3 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 border ${
                darkMode
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{createFeedback}</span>
            </div>
          )}

          <form onSubmit={handleCreateChallenge} className="space-y-4">
            {/* Type selector */}
            <div>
              <label
                className={`text-[10px] font-black uppercase tracking-wider block mb-1.5 font-mono ${
                  darkMode ? 'text-emerald-400' : 'text-gray-600'
                }`}
              >
                1. {lang === 'FR' ? 'TYPE DE DÉFI (OBLIGATOIRE)' : 'CHALLENGE TYPE (REQUIRED)'} :
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCreateType('vérité')}
                  className={`py-2.5 rounded-xl font-black text-xs font-mono transition-all cursor-pointer ${
                    createType === 'vérité'
                      ? 'bg-gradient-to-r from-[#E65A00] to-[#FF6A00] text-white shadow-md'
                      : darkMode
                      ? 'bg-[#04140D] border border-[#143B28] text-emerald-300 hover:text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {t.verite}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateType('action')}
                  className={`py-2.5 rounded-xl font-black text-xs font-mono transition-all cursor-pointer ${
                    createType === 'action'
                      ? 'bg-gradient-to-r from-[#047857] to-[#10B981] text-white shadow-md'
                      : darkMode
                      ? 'bg-[#04140D] border border-[#143B28] text-emerald-300 hover:text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {t.action}
                </button>
              </div>
            </div>

            {/* Intensity Level selector */}
            <div>
              <label
                className={`text-[10px] font-black uppercase tracking-wider block mb-1.5 font-mono ${
                  darkMode ? 'text-emerald-400' : 'text-gray-600'
                }`}
              >
                2. {lang === 'FR' ? 'NIVEAU D’INTENSITÉ' : 'INTENSITY LEVEL'} :
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCreateLevel('simple')}
                  className={`py-2.5 rounded-xl font-black text-xs font-mono transition-all cursor-pointer ${
                    createLevel === 'simple'
                      ? 'bg-[#047857] text-white shadow-md'
                      : darkMode
                      ? 'bg-[#04140D] border border-[#143B28] text-emerald-300 hover:text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {t.simpleIntensity} (+15 pts)
                </button>
                <button
                  type="button"
                  onClick={() => setCreateLevel('osée')}
                  className={`py-2.5 rounded-xl font-black text-xs font-mono transition-all cursor-pointer ${
                    createLevel === 'osée'
                      ? 'bg-[#C94700] text-white shadow-md'
                      : darkMode
                      ? 'bg-[#04140D] border border-[#143B28] text-emerald-300 hover:text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {t.oseeIntensity} (+30 pts)
                </button>
              </div>
            </div>

            {/* Prompt textarea & AI Assistant generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  className={`text-[10px] font-black uppercase tracking-wider font-mono ${
                    darkMode ? 'text-emerald-400' : 'text-gray-600'
                  }`}
                >
                  3. {lang === 'FR' ? 'ÉNONCÉ DU DÉFI' : 'CHALLENGE TEXT'} :
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiIdea}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-1 text-[10px] font-black text-[#FF8A3D] hover:underline font-mono cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isGeneratingAi ? 'Génération...' : t.generateWithAi}</span>
                </button>
              </div>
              <textarea
                required
                rows={3}
                placeholder={
                  createType === 'vérité'
                    ? (lang === 'FR' ? 'Ex: Raconte la vérité la plus inavouable de ta vie...' : 'Ex: Tell the deepest secret you never told anyone...')
                    : (lang === 'FR' ? 'Ex: Fais 15 pompes en chantant...' : 'Ex: Do 15 pushups while singing...')
                }
                value={createInput}
                onChange={(e) => {
                  setCreateInput(e.target.value);
                  if (moderationWarning) setModerationWarning(null);
                  playSoundEffect('typing');
                }}
                className={`w-full p-3 rounded-xl text-xs sm:text-sm outline-none resize-none border ${
                  darkMode
                    ? 'bg-[#04140D] border-[#164830] focus:border-[#FF7A1A] text-white placeholder:text-emerald-700'
                    : 'bg-gray-50 border-gray-200 focus:border-[#FF7A1A] text-gray-900 placeholder:text-gray-400'
                }`}
              />
              {moderationWarning && (
                <div className="mt-2 p-2.5 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-start gap-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="font-medium leading-tight">{moderationWarning}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#E65A00] via-[#FF6A00] to-[#E65A00] hover:from-[#FF7A1A] hover:to-[#E65A00] text-white font-black text-xs sm:text-sm rounded-xl shadow-lg border border-[#FFA559]/50 transition-all font-mono uppercase cursor-pointer"
            >
              {lang === 'FR' ? 'ENREGISTRER LE DÉFI' : 'SAVE CHALLENGE'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: STATS & ACTIVITY HISTORY (Section 7.1) */}
      {activeTab === 'stats' && (
        <div className="w-full space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          {/* Card 1: Player Profile with Double Rang System (Section 7.1) */}
          <div
            className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 transition-all border ${
              darkMode
                ? 'bg-[#061D12] border-[#133F28] shadow-2xl'
                : 'bg-white border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
            }`}
          >
            <div className={`flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-4 border-b ${darkMode ? 'border-[#143B28]' : 'border-gray-100'}`}>
              <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
                <div
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#FF7A1A] p-0.5 shadow-lg shadow-[#FF7A1A]/20 overflow-hidden shrink-0 ${
                    darkMode ? 'bg-[#04140D]' : 'bg-orange-50'
                  }`}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                  {isInRoomGame ? (
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 py-0.5 text-center text-[8px] font-black text-amber-400 uppercase font-mono">
                      #{userRoomRankNumber} SALON
                    </div>
                  ) : (
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 py-0.5 text-center text-[8px] font-black text-[#FF7A1A] uppercase font-mono">
                      {globalRankInfo.key}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className={`text-lg sm:text-xl font-black font-display ${darkMode ? 'text-white' : 'text-[#111827]'}`}>
                      {user.name || (lang === 'FR' ? 'Joueur' : 'Player')}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/30 font-mono">
                      {globalRankInfo.title}
                    </span>
                  </div>
                  <p className={`text-xs font-mono mt-0.5 ${darkMode ? 'text-emerald-400/80' : 'text-gray-600'}`}>
                    {lang === 'FR' ? 'Rang Personnel :' : 'Personal Rank :'}{' '}
                    <strong className={darkMode ? 'text-white' : 'text-gray-900'}>
                      {globalRankInfo.title}
                    </strong>
                    {isInRoomGame && (
                      <span className="ml-2 text-[10px] text-amber-400 font-bold">
                        (Salon #{userRoomRankNumber} {userRoomRankNumber === 1 ? '🥇' : ''})
                      </span>
                    )}
                  </p>
                  <p className={`text-[11px] italic mt-0.5 ${darkMode ? 'text-emerald-300/70' : 'text-gray-500'}`}>
                    « {globalRankInfo.quote} »
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-center sm:text-right border ${
                  darkMode ? 'bg-[#04140D] border-[#143B28]' : 'bg-orange-50/70 border-orange-100'
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-black uppercase block font-mono ${
                      darkMode ? 'text-emerald-400' : 'text-gray-500'
                    }`}
                  >
                    {lang === 'FR' ? 'TOTAL POINTS' : 'TOTAL SCORE'}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#FF8A3D] font-mono block">
                    {user.score || 0} PTS
                  </span>
                </div>
              </div>
            </div>

            {/* Double Rang Explanation Box */}
            <div
              className={`rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border ${
                darkMode ? 'bg-[#04140D] border-[#143B28]' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FF7A1A] shrink-0" />
                <div>
                  <span className={`font-black font-mono uppercase block text-[11px] ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {lang === 'FR' ? 'Paliers de Rang Global :' : 'Global Rank Tiers:'}
                  </span>
                  <span className={`text-[10px] font-mono ${darkMode ? 'text-emerald-300/80' : 'text-gray-600'}`}>
                    Novice (0-99) → Initié (100-299) → Expert (300-599) → Maître (600-999) → Légende (1000+)
                  </span>
                </div>
              </div>
              <div
                className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${
                  darkMode ? 'bg-[#0B2E1D] border-[#195236] text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {lang === 'FR' ? `Rang actuel : ${globalRankInfo.title}` : `Current rank: ${globalRankInfo.title}`}
              </div>
            </div>

            {/* Grid of detailed games performed strictly from real history */}
            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-widest block mb-2.5 font-mono ${
                  darkMode ? 'text-emerald-400' : 'text-gray-600'
                }`}
              >
                {lang === 'FR' ? 'BILAN DÉTAILLÉ DES JEUX EFFECTUÉS :' : 'DETAILED CHALLENGES RECORD :'}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* Vérité effectuée */}
                <div
                  className={`rounded-xl sm:rounded-2xl p-3 text-center transition-colors border ${
                    darkMode
                      ? 'bg-[#04140D] border-[#164830] hover:border-[#FF7A1A]'
                      : 'bg-orange-50/40 border-orange-200 hover:border-[#FF7A1A]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-[10px] font-black text-[#FF7A1A] uppercase font-mono mb-1">
                    <Check className="w-3 h-3" />
                    <span>{lang === 'FR' ? 'Vérité Relevée' : 'Truth Done'}</span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-black font-mono block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {veritesCount}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-mono">{lang === 'FR' ? 'effectuée' : 'completed'}</span>
                </div>

                {/* Action effectuée */}
                <div
                  className={`rounded-xl sm:rounded-2xl p-3 text-center transition-colors border ${
                    darkMode
                      ? 'bg-[#04140D] border-[#164830] hover:border-[#10B981]'
                      : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-[10px] font-black text-[#10B981] uppercase font-mono mb-1">
                    <Check className="w-3 h-3" />
                    <span>{lang === 'FR' ? 'Action Relevée' : 'Dare Done'}</span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-black font-mono block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {actionsCount}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-mono">{lang === 'FR' ? 'effectuée' : 'completed'}</span>
                </div>

                {/* Vérité passée */}
                <div
                  className={`rounded-xl sm:rounded-2xl p-3 text-center border ${
                    darkMode ? 'bg-[#04140D] border-[#164830]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-[10px] font-black text-amber-600 uppercase font-mono mb-1">
                    <span>{lang === 'FR' ? 'Vérité Passée' : 'Truth Skipped'}</span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-black font-mono block ${darkMode ? 'text-emerald-200' : 'text-gray-700'}`}>
                    {veritesPassedCount}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">0 pt</span>
                </div>

                {/* Action passée */}
                <div
                  className={`rounded-xl sm:rounded-2xl p-3 text-center border ${
                    darkMode ? 'bg-[#04140D] border-[#164830]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-[10px] font-black text-amber-600 uppercase font-mono mb-1">
                    <span>{lang === 'FR' ? 'Action Passée' : 'Dare Skipped'}</span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-black font-mono block ${darkMode ? 'text-emerald-200' : 'text-gray-700'}`}>
                    {actionsPassedCount}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">0 pt</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Affichage conditionnel - Classement de salon OU Statut Solo (Section demandée par l'utilisateur) */}
          {isInRoomGame && activeRoomSession ? (
            /* Cas 1 : L'utilisateur est dans une salle de jeu dans un salon -> Affichage du Classement en direct du salon */
            <div
              className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3 transition-all border ${
                darkMode
                  ? 'bg-[#061D12] border-[#133F28] shadow-2xl'
                  : 'bg-white border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
              }`}
            >
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pb-3 border-b ${darkMode ? 'border-[#143B28]' : 'border-gray-100'}`}>
                <div>
                  <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider font-mono ${darkMode ? 'text-emerald-300' : 'text-gray-800'}`}>
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>
                      {lang === 'FR'
                        ? `CLASSEMENT DU SALON • ${activeRoomSession.roomCode || 'SALON'}`
                        : `ROOM LEADERBOARD • ${activeRoomSession.roomCode || 'ROOM'}`}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-emerald-400/75' : 'text-gray-500'}`}>
                    {lang === 'FR'
                      ? `Partie en direct : vous êtes classé(e) #${userRoomRankNumber} sur ${roomLeaderboard.length} participant(s)`
                      : `Live match: you are ranked #${userRoomRankNumber} out of ${roomLeaderboard.length} player(s)`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                      darkMode ? 'bg-[#04140D] border-[#143B28] text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span>{roomLeaderboard.length} {lang === 'FR' ? 'dans la salle' : 'in room'}</span>
                  </div>

                  {onSelectTab && (
                    <button
                      type="button"
                      onClick={() => {
                        playSoundEffect('select');
                        onSelectTab('multi');
                      }}
                      className="text-[10px] font-mono font-bold text-[#FF7A1A] hover:underline cursor-pointer"
                    >
                      {lang === 'FR' ? 'Accéder au salon →' : 'Go to room →'}
                    </button>
                  )}
                </div>
              </div>

              {/* Lignes du classement des participants du salon */}
              <div className="space-y-2">
                {roomLeaderboard.map((item: any, idx: number) => {
                  const isUser = item.isCurrentUser;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                        isUser
                          ? darkMode
                            ? 'bg-gradient-to-r from-[#9E3500]/30 to-[#0A2E1D] border-[#FF7A1A] shadow-md shadow-[#FF7A1A]/20'
                            : 'bg-orange-50/70 border-[#FF7A1A] shadow-sm'
                          : idx === 0
                          ? darkMode
                            ? 'bg-[#0B2E1D] border-amber-500/50'
                            : 'bg-amber-50/60 border-amber-300'
                          : darkMode
                          ? 'bg-[#04140D] border-[#133A27]'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {/* Rang */}
                        <div className="w-7 sm:w-8 text-center shrink-0">
                          {idx === 0 ? (
                            <span className="text-base sm:text-lg" title="1er Place">🥇</span>
                          ) : idx === 1 ? (
                            <span className="text-base sm:text-lg" title="2e Place">🥈</span>
                          ) : idx === 2 ? (
                            <span className="text-base sm:text-lg" title="3e Place">🥉</span>
                          ) : (
                            <span className={`text-xs font-black font-mono ${darkMode ? 'text-emerald-400' : 'text-gray-600'}`}>
                              #{idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#FF7A1A]/60 overflow-hidden shrink-0">
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Pseudo et statut du salon */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs sm:text-sm font-black truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.name}
                            </span>
                            {isUser && (
                              <span className="px-1.5 py-0.2 bg-[#FF7A1A] text-white text-[8px] font-black rounded uppercase tracking-wider font-mono">
                                VOUS
                              </span>
                            )}
                            {item.isHost && (
                              <span className="text-[10px] text-amber-400 font-bold">
                                👑 Hôte
                              </span>
                            )}
                            {idx === 0 && !item.isHost && (
                              <span className="text-[10px] text-amber-500 font-bold hidden sm:inline">
                                Leader
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-mono block truncate ${darkMode ? 'text-emerald-400/80' : 'text-gray-500'}`}>
                            {item.room} • {item.status}
                          </span>
                        </div>
                      </div>

                      {/* Points & Position */}
                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-black font-mono text-[#FF8A3D] block">
                          {item.score} PTS
                        </span>
                        <span className={`text-[9px] font-mono uppercase ${darkMode ? 'text-emerald-500' : 'text-gray-500'}`}>
                          {idx === 0 ? '1er' : `${idx + 1}e rang`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Cas 2 : L'utilisateur joue en Solo -> Pas de classement, affichage de son rang et son score uniquement */
            <div
              className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all border ${
                darkMode
                  ? 'bg-[#061D12] border-[#133F28] shadow-xl'
                  : 'bg-white border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      darkMode ? 'bg-[#0B2E1D] text-emerald-400 border border-[#164830]' : 'bg-orange-50 text-[#FF7A1A] border border-orange-200'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest font-mono text-[#FF7A1A]">
                        {lang === 'FR' ? 'MODE SOLO' : 'SOLO MODE'}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          darkMode ? 'bg-[#04140D] border-[#164830] text-emerald-400' : 'bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        {lang === 'FR' ? 'Progression Personnelle' : 'Personal Progress'}
                      </span>
                    </div>
                    <h4 className={`text-sm sm:text-base font-black font-display mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {lang === 'FR' ? `Rang Actuel : ${globalRankInfo.title} (${user.score || 0} PTS)` : `Current Rank: ${globalRankInfo.title} (${user.score || 0} PTS)`}
                    </h4>
                    <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-emerald-300/80' : 'text-gray-600'}`}>
                      {lang === 'FR'
                        ? 'En jeu solo, aucun classement public n’est affiché : vous suivez uniquement votre rang et vos points personnels. Le classement en temps réel s’affiche exclusivement lorsque vous rejoignez ou créez une salle de jeu dans un salon avec d’autres participants.'
                        : 'In solo mode, no public leaderboard is displayed: you only track your personal rank and points. Live leaderboards are displayed exclusively when you join or create a game room in a salon with other participants.'}
                    </p>
                  </div>
                </div>

                {onSelectTab && (
                  <button
                    type="button"
                    onClick={() => {
                      playSoundEffect('select');
                      onSelectTab('multi');
                    }}
                    className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-gradient-to-r from-[#E65A00] to-[#FF6A00] hover:from-[#FF7A1A] hover:to-[#E65A00] text-white text-xs font-black rounded-xl font-mono uppercase shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>{lang === 'FR' ? 'Entrer dans un Salon' : 'Enter a Room'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity Log List */}
          <div
            className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all border ${
              darkMode
                ? 'bg-[#061D12] border-[#133F28] shadow-xl'
                : 'bg-white border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
            }`}
          >
            <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider mb-3 font-mono ${darkMode ? 'text-emerald-300' : 'text-gray-800'}`}>
              <History className="w-4 h-4 text-[#FF7A1A]" />
              <span>{t.actsHistory} ({history.length})</span>
            </div>

            {history.length === 0 ? (
              <p className={`text-xs italic text-center py-6 ${darkMode ? 'text-emerald-400/80' : 'text-gray-500'}`}>
                {t.noActsYet}
              </p>
            ) : (
              <div className="space-y-2.5">
                {paginatedHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl flex items-center justify-between gap-3 border ${
                      darkMode ? 'bg-[#04140D] border-[#133A27]' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                            item.type === 'vérité' ? 'bg-[#9E3500] text-white' : 'bg-[#047857] text-white'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className={`text-[10px] font-mono ${darkMode ? 'text-emerald-500' : 'text-gray-500'}`}>{item.time}</span>
                      </div>
                      <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>“{item.challengeText}”</p>
                      {item.answerText && (
                        <p className={`text-[11px] italic mt-0.5 truncate ${darkMode ? 'text-emerald-300/80' : 'text-gray-600'}`}>
                          ↳ {item.answerText}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-black font-mono block ${
                          item.points > 0 ? 'text-[#FF8A3D]' : darkMode ? 'text-emerald-600' : 'text-gray-500'
                        }`}
                      >
                        +{item.points} PTS
                      </span>
                      <span className={`text-[9px] uppercase font-bold ${darkMode ? 'text-emerald-400/70' : 'text-gray-500'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}

                {/* History Pagination */}
                {totalHistoryPages > 1 && (
                  <div className={`flex items-center justify-between pt-3 border-t ${darkMode ? 'border-[#133A27]' : 'border-gray-200'}`}>
                    <button
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className={`p-1 disabled:opacity-40 cursor-pointer ${darkMode ? 'text-emerald-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className={`text-[10px] font-mono ${darkMode ? 'text-emerald-400' : 'text-gray-600'}`}>
                      Page {historyPage} / {totalHistoryPages}
                    </span>
                    <button
                      onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                      disabled={historyPage === totalHistoryPages}
                      className={`p-1 disabled:opacity-40 cursor-pointer ${darkMode ? 'text-emerald-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
