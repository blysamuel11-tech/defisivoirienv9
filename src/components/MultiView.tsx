import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Send,
  Users,
  Crown,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Radio,
  Gamepad2,
  ArrowRight,
  RotateCw,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  Shuffle,
  AlertCircle,
  Share2,
  UserMinus,
  UserPlus,
  LogOut,
  Trophy,
} from 'lucide-react';
import { UserProfile, RoomPlayer, ChatMessage, ChallengeType, Intensity, Challenge } from '../types';
import { playSoundEffect } from '../utils/audio';
import { TRANSLATIONS } from '../data/translations';
import { validateContentModeration } from '../utils/moderation';

interface PendingRequest {
  id: string;
  name: string;
  avatar: string;
  timestamp: string;
}

interface MultiViewProps {
  user: UserProfile;
  challenges?: Challenge[];
  onUpdateScore: (points: number) => void;
  lang?: 'FR' | 'EN';
  darkMode?: boolean;
}

export const MultiView: React.FC<MultiViewProps> = ({ user, challenges = [], onUpdateScore, lang = 'FR', darkMode = true }) => {
  const t = TRANSLATIONS[lang];

  // Helper to load persisted room session
  const loadSavedRoomSession = () => {
    try {
      const raw = localStorage.getItem('gbe_multi_room_session');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.debug('Failed to parse saved room session', e);
    }
    return null;
  };

  const savedSession = typeof window !== 'undefined' ? loadSavedRoomSession() : null;

  // Safe stable room code initializer
  const getInitialRoomCode = () => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const qCode = params.get('room');
        if (qCode && qCode.trim()) return qCode.trim().toUpperCase();
      }
      const activeCode = localStorage.getItem('gbe_active_room_code');
      if (activeCode && activeCode.trim()) return activeCode.trim().toUpperCase();
      if (savedSession?.roomCode) return savedSession.roomCode;
    } catch (e) {
      console.debug(e);
    }
    return 'GBE26';
  };

  // Room state
  const [roomCode, setRoomCode] = useState<string>(getInitialRoomCode);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [multiStep, setMultiStep] = useState<'selection' | 'lobby' | 'game' | 'evaluation'>(
    savedSession?.multiStep && savedSession.multiStep !== 'selection' ? savedSession.multiStep : 'selection'
  );
  // Turn phase in game: participant chooses type & intensity first, then question is posed
  const [turnPhase, setTurnPhase] = useState<'choose' | 'play'>(savedSession?.turnPhase || 'choose');
  const [mobileTab, setMobileTab] = useState<'arena' | 'players' | 'chat'>('arena');
  const [chatInput, setChatInput] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [playerAnswer, setPlayerAnswer] = useState(
    savedSession?.playerAnswer || (lang === 'FR' ? 'J’avoue toute la vérité sans détour !' : 'I confess the whole truth without hesitation!')
  );

  // Status feedback toast for approvals
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'approved' | 'refused';
    message: string;
    points: number;
  } | null>(null);

  // Challenge in current turn
  const [activeType, setActiveType] = useState<ChallengeType>(savedSession?.activeType || 'vérité');
  const [activeIntensity, setActiveIntensity] = useState<Intensity>(savedSession?.activeIntensity || 'simple');
  const [currentPrompt, setCurrentPrompt] = useState(
    savedSession?.currentPrompt ||
      (lang === 'FR'
        ? 'Quelle est la chanson la plus honteuse que tu adores ?'
        : 'What is the most embarrassing song you secretly love?')
  );

  // Community votes state
  const [votesOk, setVotesOk] = useState(1);
  const [votesNotOk, setVotesNotOk] = useState(1);
  const [userVoted, setUserVoted] = useState<'ok' | 'not_ok' | null>(null);
  const [tieNotice, setTieNotice] = useState(false);
  const [chatWarning, setChatWarning] = useState<string | null>(null);
  const [answerWarning, setAnswerWarning] = useState<string | null>(null);

  // Access requests for host approval
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(savedSession?.pendingRequests || []);

  // Players in the room - Initially host is ALONE
  const [players, setPlayers] = useState<RoomPlayer[]>(
    savedSession?.players && savedSession.players.length > 0
      ? savedSession.players
      : [
          {
            id: 'p-host',
            name: user.name || (lang === 'FR' ? 'Hôte' : 'Host'),
            avatar: user.avatar,
            auraColor: user.auraColor || 'orange',
            score: user.score || 0,
            isHost: true,
            isTurn: true,
            status: 'En ligne',
          },
        ]
  );

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    savedSession?.chatMessages || [
      {
        id: 'msg-1',
        senderId: 'system',
        senderName: 'Système',
        senderAvatar: '',
        text: lang === 'FR' ? 'Bienvenue dans le salon multijoueur Gbê ou Moument !' : 'Welcome to the Gbê ou Moument multiplayer room!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]
  );

  // Real-time rank calculation of all room participants
  const sortedRoomPlayers = [...players].sort((a, b) => b.score - a.score);
  const getPlayerRankInfo = (playerId: string) => {
    const idx = sortedRoomPlayers.findIndex((p) => p.id === playerId);
    if (idx === 0) return { rank: 1, label: lang === 'FR' ? '1er • Leader' : '1st • Leader', badge: '🥇' };
    if (idx === 1) return { rank: 2, label: lang === 'FR' ? '2e place' : '2nd place', badge: '🥈' };
    if (idx === 2) return { rank: 3, label: lang === 'FR' ? '3e place' : '3rd place', badge: '🥉' };
    return { rank: idx + 1, label: `${idx + 1}e place`, badge: `#${idx + 1}` };
  };

  // Sync room code to URL & localStorage to never lose the room code when switching tabs/apps
  useEffect(() => {
    if (typeof window !== 'undefined' && roomCode) {
      try {
        localStorage.setItem('gbe_active_room_code', roomCode);
        const url = new URL(window.location.href);
        if (multiStep !== 'selection') {
          url.searchParams.set('room', roomCode);
        } else {
          url.searchParams.delete('room');
        }
        window.history.replaceState(null, '', url.toString());
      } catch (e) {
        console.debug(e);
      }
    }
  }, [roomCode, multiStep]);

  // Persistence: do not reset room session if user navigates away until salon is closed
  useEffect(() => {
    if (multiStep !== 'selection') {
      const sessionData = {
        roomCode,
        multiStep,
        turnPhase,
        players,
        chatMessages,
        activeType,
        activeIntensity,
        currentPrompt,
        playerAnswer,
        pendingRequests,
      };
      try {
        localStorage.setItem('gbe_multi_room_session', JSON.stringify(sessionData));
        localStorage.setItem('gbe_active_room_code', roomCode);
      } catch (e) {
        console.debug('LocalStorage write failed', e);
      }
    }
  }, [roomCode, multiStep, turnPhase, players, chatMessages, activeType, activeIntensity, currentPrompt, playerAnswer, pendingRequests]);

  // Handle visibility & unload to guarantee room code and state remain strictly identical on tab/app return (Section 10.5)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (multiStep !== 'selection') {
          const sessionData = {
            roomCode,
            multiStep,
            turnPhase,
            players,
            chatMessages,
            activeType,
            activeIntensity,
            currentPrompt,
            playerAnswer,
            pendingRequests,
          };
          try {
            localStorage.setItem('gbe_multi_room_session', JSON.stringify(sessionData));
            localStorage.setItem('gbe_active_room_code', roomCode);
          } catch {}
        }
      } else if (document.visibilityState === 'visible') {
        // Restore roomCode reliably when returning from another tab or mobile app
        try {
          const savedCode = localStorage.getItem('gbe_active_room_code');
          if (savedCode && savedCode !== roomCode) {
            setRoomCode(savedCode);
          }
          const raw = localStorage.getItem('gbe_multi_room_session');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.roomCode && parsed.roomCode !== roomCode) {
              setRoomCode(parsed.roomCode);
            }
          }
        } catch (e) {
          console.debug(e);
        }
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleVisibility);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleVisibility);
    };
  }, [roomCode, multiStep, turnPhase, players, chatMessages, activeType, activeIntensity, currentPrompt, playerAnswer, pendingRequests]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Anti-repetition challenge selector based on chosen Type and Intensity
  const getRandomMultiChallenge = (type: ChallengeType, inten: Intensity, excludeText?: string) => {
    const pool = (challenges || []).filter((c) => c.type === type && c.intensity === inten && c.text !== excludeText);
    const candidates = pool.length > 0 ? pool : (challenges || []).filter((c) => c.type === type && c.intensity === inten);
    if (candidates.length > 0) {
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      return lang === 'EN' && picked.textEn ? picked.textEn : picked.text;
    }
    if (type === 'vérité') {
      return inten === 'simple'
        ? (lang === 'FR' ? 'Quelle est la chanson la plus honteuse que tu écoutes en secret ?' : 'What is the most embarrassing song you secretly love?')
        : (lang === 'FR' ? 'Quel est le secret ou mensonge le plus inavouable que tu gardes pour toi ?' : 'What is the biggest secret or lie you keep to yourself?');
    } else {
      return inten === 'simple'
        ? (lang === 'FR' ? 'Danse le Coupé-Décalé pendant 30 secondes sans musique devant tout le monde !' : 'Dance Coupé-Décalé for 30 seconds without music!')
        : (lang === 'FR' ? 'Imite la façon de parler ou la démarche d’un des participants pendant 1 minute chrono !' : 'Imitate the voice or walk of someone in the room for 1 minute!');
    }
  };

  // Host creates room: he is alone and shares link to others
  const handleCreateRoom = () => {
    const newCode = generateRandomCode();
    setRoomCode(newCode);
    const hostPlayer: RoomPlayer = {
      id: 'p-host',
      name: user.name || (lang === 'FR' ? 'Hôte' : 'Host'),
      avatar: user.avatar,
      auraColor: user.auraColor || 'orange',
      score: user.score || 0,
      isHost: true,
      isTurn: true,
      status: 'En ligne',
    };
    setPlayers([hostPlayer]);
    setPendingRequests([]);
    setChatMessages([
      {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Système',
        senderAvatar: '',
        text: lang === 'FR'
          ? `👑 Salon privé ${newCode} créé ! Vous êtes l'Hôte et seul dans ce salon. Partagez le lien avec vos amis pour qu'ils vous rejoignent !`
          : `👑 Private room ${newCode} created! You are the Host and alone in this room. Share the link with your friends to join!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
    playSoundEffect('success');
    setMultiStep('lobby');
  };

  // Share room link via Web Share API or Clipboard
  const handleShareRoomLink = async () => {
    const roomUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    const shareText = lang === 'FR'
      ? `Rejoins mon salon sur Gbê ou Moument ! Code : ${roomCode}`
      : `Join my room on Gbê ou Moument! Code: ${roomCode}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Gbê ou Moument',
          text: shareText,
          url: roomUrl,
        });
        playSoundEffect('notification');
        return;
      } catch (err) {
        // user cancelled or fallback
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\nLien : ${roomUrl}`);
      setIsCopied(true);
      playSoundEffect('notification');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy error', err);
    }
  };

  // Chat @mention autocomplete and formatting (Section 6.4)
  const handleChatInputChange = (val: string) => {
    setChatInput(val);
    if (chatWarning) setChatWarning(null);
    playSoundEffect('typing');

    // Detect if word currently being typed starts with @
    const match = val.match(/@([a-zA-Z0-9_\u00C0-\u017F]*)$/);
    if (match) {
      setMentionFilter(match[1].toLowerCase());
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleSelectMention = (playerName: string) => {
    playSoundEffect('select');
    const updated = chatInput.replace(/@([a-zA-Z0-9_\u00C0-\u017F]*)$/, `@${playerName} `);
    setChatInput(updated);
    setShowMentionDropdown(false);
  };

  const renderMessageContent = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_\u00C0-\u017F]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const isMe = user.name && part.slice(1).toLowerCase() === user.name.toLowerCase();
        return (
          <span
            key={i}
            className={`font-black px-1.5 py-0.5 rounded text-[11px] inline-block font-mono ${
              isMe
                ? 'bg-[#FF7A1A] text-white shadow-sm shadow-[#FF7A1A]/40'
                : 'bg-[#FF7A1A]/20 text-[#FFA559] border border-[#FF7A1A]/40'
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Host can remove/kick any participant at any time, even if they already played
  const handleKickPlayer = (playerId: string) => {
    const target = players.find((p) => p.id === playerId);
    if (!target) return;

    if (!confirm(lang === 'FR' ? `Voulez-vous vraiment supprimer ${target.name} du salon ?` : `Do you really want to remove ${target.name} from the room?`)) {
      return;
    }

    playSoundEffect('click');
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Système',
        senderAvatar: '',
        text: lang === 'FR'
          ? `🚪 ${target.name} a été supprimé(e) du salon par l'Hôte.`
          : `🚪 ${target.name} was removed from the room by the Host.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
  };

  // Modal confirmation for permanently closing and leaving the room
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);

  // Open modal on clicking Quitter
  const handleOpenLeaveModal = () => {
    playSoundEffect('click');
    setShowLeaveConfirmModal(true);
  };

  // Cancel action -> room stays 100% active, game continues without interruption
  const handleCancelLeaveRoom = () => {
    playSoundEffect('click');
    setShowLeaveConfirmModal(false);
  };

  // Confirm "Oui" -> room is permanently closed for all participants and resets to initial selection
  const handleConfirmCloseRoom = () => {
    playSoundEffect('click');
    try {
      localStorage.removeItem('gbe_multi_room_session');
      localStorage.removeItem('gbe_active_room_code');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.pathname);
      }
    } catch (e) {
      console.debug('Error clearing session', e);
    }

    // Generate fresh room code for next room
    const newCode = 'GBE' + Math.floor(10 + Math.random() * 90);
    setRoomCode(newCode);
    setJoinCodeInput('');
    setMultiStep('selection');
    setTurnPhase('choose');
    setPlayerAnswer('');
    setTieNotice(false);
    setUserVoted(null);
    setPendingRequests([]);
    setPlayers([
      {
        id: 'p-host',
        name: user.name || (lang === 'FR' ? 'Hôte' : 'Host'),
        avatar: user.avatar,
        auraColor: user.auraColor || 'orange',
        score: user.score || 0,
        isHost: true,
        isTurn: true,
        status: 'En ligne',
      },
    ]);
    setChatMessages([
      {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Système',
        senderAvatar: '',
        text: lang === 'FR' ? `🎉 Salon ${newCode} prêt ! Partage le code pour inviter tes amis.` : `🎉 Room ${newCode} ready! Share the code to invite friends.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
    setShowLeaveConfirmModal(false);
  };

  const handleCopyCode = () => {
    handleShareRoomLink();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Content moderation check (Section 9.1)
    const modResult = validateContentModeration(chatInput.trim(), lang);
    if (!modResult.isValid) {
      playSoundEffect('fail');
      setChatWarning(modResult.warningMessage);
      return;
    }
    setChatWarning(null);

    playSoundEffect('chat');
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const handleDeleteMessage = (msgId: string) => {
    playSoundEffect('click');
    setChatMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  const handleAcceptRequest = (req: PendingRequest) => {
    playSoundEffect('success');
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setPlayers((prev) => [
      ...prev,
      {
        id: req.id,
        name: req.name,
        avatar: req.avatar,
        auraColor: 'teal',
        score: 0,
        isHost: false,
        isTurn: false,
        status: 'En ligne',
      },
    ]);
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Système',
        senderAvatar: '',
        text: lang === 'FR' ? `👋 ${req.name} a rejoint le salon !` : `👋 ${req.name} joined the room!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
  };

  const handleRefuseRequest = (reqId: string) => {
    playSoundEffect('pass');
    setPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleStartGame = () => {
    playSoundEffect('success');
    setMultiStep('game');
    setTurnPhase('choose');
    setPlayerAnswer('');
    setTieNotice(false);
  };

  const handleConfirmTurnChoice = () => {
    playSoundEffect('approval');
    const drawn = getRandomMultiChallenge(activeType, activeIntensity);
    setCurrentPrompt(drawn);
    setTurnPhase('play');
    setPlayerAnswer('');
    setTieNotice(false);

    const activePlayer = players.find((p) => p.isTurn) || players[0];
    const typeLabel =
      activeType === 'vérité'
        ? (lang === 'FR' ? 'Gbê (Vérité)' : 'Truth')
        : (lang === 'FR' ? 'Moument (Action)' : 'Dare');
    const intenLabel =
      activeIntensity === 'simple'
        ? (lang === 'FR' ? 'Simple' : 'Soft')
        : (lang === 'FR' ? 'Osée' : 'Spicy');

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Système',
        senderAvatar: '',
        text: `🎯 ${activePlayer.name} a choisi ${typeLabel} [${intenLabel.toUpperCase()}] ! Question posée par l'application.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
  };

  const handleShuffleChallenge = () => {
    playSoundEffect('select');
    const nextDrawn = getRandomMultiChallenge(activeType, activeIntensity, currentPrompt);
    setCurrentPrompt(nextDrawn);
  };

  const handleChangeChoice = () => {
    playSoundEffect('select');
    setTurnPhase('choose');
  };

  const getPointsForTurn = (type: ChallengeType, inten: Intensity) => {
    if (type === 'vérité') return inten === 'osée' ? 30 : 10;
    return inten === 'osée' ? 50 : 20;
  };

  const handleSubmitPlayerAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerAnswer.trim()) return;

    // Content moderation check (Section 9.1)
    const modResult = validateContentModeration(playerAnswer.trim(), lang);
    if (!modResult.isValid) {
      playSoundEffect('fail');
      setAnswerWarning(modResult.warningMessage);
      return;
    }
    setAnswerWarning(null);

    playSoundEffect('select');
    // Start vote with simulated baseline votes
    setVotesOk(1);
    setVotesNotOk(1);
    setUserVoted(null);
    setTieNotice(false);
    setMultiStep('evaluation');
  };

  // Participant binary vote (OK / Pas OK)
  const handleVote = (vote: 'ok' | 'not_ok') => {
    if (userVoted) return;
    playSoundEffect('select');
    setUserVoted(vote);
    if (vote === 'ok') {
      setVotesOk((prev) => prev + 1);
    } else {
      setVotesNotOk((prev) => prev + 1);
    }
  };

  // Host priority arbitration: Validate
  const handleHostValidate = () => {
    playSoundEffect('approval');
    const earned = getPointsForTurn(activeType, activeIntensity);
    onUpdateScore(earned);

    // Update active player's score in real time so points and ranks update immediately!
    setPlayers((prev) =>
      prev.map((p) => (p.isTurn ? { ...p, score: p.score + earned } : p))
    );

    const approveMsg =
      activeType === 'vérité'
        ? (lang === 'FR' ? 'Vérité approuvée, point accordé' : 'Truth approved, points awarded')
        : (lang === 'FR' ? 'Action approuvée, point accordé' : 'Action approved, points awarded');

    setStatusFeedback({
      type: 'approved',
      message: approveMsg,
      points: earned,
    });
    setTimeout(() => setStatusFeedback(null), 4000);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Système',
        senderAvatar: '',
        text: `✨ ${approveMsg} (+${earned} pts) !`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
    nextTurn();
  };

  // Host priority arbitration: Refuse
  const handleHostRefuse = () => {
    playSoundEffect('fail');
    const refuseMsg =
      activeType === 'vérité'
        ? (lang === 'FR' ? 'Vérité refusée (0 pt)' : 'Truth rejected (0 pt)')
        : (lang === 'FR' ? 'Action refusée (0 pt)' : 'Action rejected (0 pt)');

    setStatusFeedback({
      type: 'refused',
      message: refuseMsg,
      points: 0,
    });
    setTimeout(() => setStatusFeedback(null), 3500);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Système',
        senderAvatar: '',
        text: `❌ ${refuseMsg}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      },
    ]);
    nextTurn();
  };

  // Check equality condition (Section 5.3):
  // "Si le vote aboutit à une égalité parfaite et que l'Hôte ne tranche pas : le joueur doit rejouer un nouveau défi obligatoire"
  const handleResolveByCommunityVotes = () => {
    if (votesOk === votesNotOk) {
      // Tie condition
      setTieNotice(true);
      playSoundEffect('pass');
      setCurrentPrompt(
        lang === 'FR'
          ? 'Égalité parfaite ! Défi imposé par la communauté : Raconte la vérité la plus osée de ta vie !'
          : 'Perfect tie! Mandatory replay: Tell the spiciest truth of your life!'
      );
      setMultiStep('game');
      setTurnPhase('play');
      setPlayerAnswer('');
      setVotesOk(1);
      setVotesNotOk(1);
      setUserVoted(null);
      return;
    }

    if (votesOk > votesNotOk) {
      handleHostValidate();
    } else {
      handleHostRefuse();
    }
  };

  const nextTurn = () => {
    setMultiStep('game');
    setTurnPhase('choose');
    setPlayerAnswer('');
    setTieNotice(false);
    setUserVoted(null);
    setVotesOk(1);
    setVotesNotOk(1);

    // Rotate turn to next player
    setPlayers((prev) => {
      if (prev.length <= 1) return prev;
      const curIndex = prev.findIndex((p) => p.isTurn);
      const nextIndex = curIndex >= 0 ? (curIndex + 1) % prev.length : 0;
      const nextPlayer = prev[nextIndex];

      setTimeout(() => {
        setChatMessages((c) => [
          ...c,
          {
            id: `msg-${Date.now()}`,
            senderId: 'system',
            senderName: 'Système',
            senderAvatar: '',
            text: `👑 ${lang === 'FR' ? "C'est au tour de" : "It's now the turn of"} ${nextPlayer.name} ! Choix du défi en cours...`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true,
          },
        ]);
      }, 500);

      return prev.map((p, idx) => ({
        ...p,
        isTurn: idx === nextIndex,
      }));
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none pb-8" id="multi-screen">
      {/* Top Banner */}
      <div
        className={`w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 mb-3 sm:mb-4 flex items-center justify-between transition-all backdrop-blur-xl relative overflow-hidden ${
          darkMode
            ? 'bg-[#061D12] border border-[#133F28] shadow-lg'
            : 'bg-white border border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#E65A00] p-0.5 shadow-md shadow-[#E65A00]/25 bg-[#04140D] overflow-hidden shrink-0">
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FF7A1A] uppercase tracking-wider font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A] animate-pulse shrink-0" />
              <span className="truncate">{lang === 'FR' ? 'SALON MULTIJOUEUR' : 'MULTIPLAYER ROOM'}</span>
            </div>
            <h2
              className={`text-xs sm:text-sm md:text-base font-black font-display truncate ${
                darkMode ? 'text-white' : 'text-[#111827]'
              }`}
            >
              {multiStep === 'selection' ? (lang === 'FR' ? 'Choisir un Salon' : 'Choose a Room') : `${t.roomCode} : ${roomCode}`}
            </h2>
          </div>
        </div>

        {/* Step Badge / Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {multiStep !== 'selection' && (
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black font-mono tracking-wider transition-all whitespace-nowrap ${
                darkMode
                  ? 'bg-[#04140D] border border-[#184830] hover:border-[#E65A00] text-[#FF7A1A]'
                  : 'bg-orange-50 border border-orange-200 hover:border-orange-400 text-[#D85200]'
              }`}
            >
              <span>{roomCode}</span>
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
            </button>
          )}

          {multiStep !== 'selection' && (
            <button
              onClick={handleOpenLeaveModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-black font-mono shadow-sm active:scale-95 whitespace-nowrap ${
                darkMode
                  ? 'bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white'
                  : 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700'
              }`}
              title={lang === 'FR' ? 'Quitter et fermer définitivement le salon' : 'Quit and permanently close room'}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{lang === 'FR' ? 'Quitter' : 'Leave'}</span>
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: CHOOSE OR CREATE A ROOM (Section 5.1) */}
      {multiStep === 'selection' && (
        <div className="w-full max-w-xl space-y-3 sm:space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Creation Card */}
            <div
              className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center transition-all ${
                darkMode
                  ? 'bg-[#061D12] border border-[#133F28] hover:border-[#FF7A1A]/70 shadow-lg'
                  : 'bg-white border border-gray-100 hover:border-gray-200 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl mb-3 shadow-inner font-mono ${
                  darkMode
                    ? 'bg-[#1A3325] border border-[#274E39] text-[#FF7A1A]'
                    : 'bg-[#FFF3EB] border border-[#FFE0CC] text-[#E65A00]'
                }`}
              >
                +
              </div>
              <h3
                className={`text-base sm:text-lg font-black font-display whitespace-nowrap ${
                  darkMode ? 'text-white' : 'text-[#111827]'
                }`}
              >
                {t.createRoom.toUpperCase()}
              </h3>
              <p
                className={`text-[11px] sm:text-xs italic mb-4 font-medium leading-snug ${
                  darkMode ? 'text-emerald-300/75' : 'text-[#4B5563]'
                }`}
              >
                {lang === 'FR'
                  ? 'Génère un salon privé avec code unique et contrôle les accès.'
                  : 'Generate a private room with a unique 5-char code and manage admissions.'}
              </p>

              <div
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed rounded-xl mb-4 ${
                  darkMode
                    ? 'bg-[#04140D] border-[#E65A00]/80'
                    : 'bg-orange-50/70 border-orange-300'
                }`}
              >
                <span className="text-sm sm:text-base font-black text-[#FF7A1A] tracking-widest font-mono">{roomCode}</span>
                <button onClick={handleCopyCode} title="Copier" className="text-emerald-500 hover:text-emerald-400 p-1">
                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    const newCode = generateRandomCode();
                    setRoomCode(newCode);
                    playSoundEffect('select');
                  }}
                  title={lang === 'FR' ? 'Changer de code' : 'New code'}
                  className="text-emerald-500/80 hover:text-emerald-400 p-1 ml-1"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                id="btn-create-room"
                onClick={() => {
                  playSoundEffect('success');
                  localStorage.setItem('gbe_active_room_code', roomCode);
                  setMultiStep('lobby');
                }}
                className="w-full py-3 px-3 bg-gradient-to-r from-[#9E3500] via-[#C94700] to-[#9E3500] hover:from-[#B84000] hover:to-[#B84000] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(201,71,0,0.35)] border border-[#FFA559]/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>{lang === 'FR' ? 'OUVRIR LE SALON' : 'OPEN ROOM'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Join Card */}
            <div
              className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center transition-all ${
                darkMode
                  ? 'bg-[#061D12] border border-[#133F28] hover:border-[#10B981]/70 shadow-lg'
                  : 'bg-white border border-gray-100 hover:border-gray-200 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl mb-3 shadow-inner ${
                  darkMode
                    ? 'bg-[#123826] border border-[#1B5037] text-[#10B981]'
                    : 'bg-[#EDFBF4] border border-[#D1F4E2] text-[#10B981]'
                }`}
              >
                👥
              </div>
              <h3
                className={`text-base sm:text-lg font-black font-display whitespace-nowrap ${
                  darkMode ? 'text-white' : 'text-[#111827]'
                }`}
              >
                {lang === 'FR' ? 'REJOINDRE UN SALON' : 'JOIN A ROOM'}
              </h3>
              <p
                className={`text-[11px] sm:text-xs italic mb-4 font-medium leading-snug ${
                  darkMode ? 'text-emerald-300/75' : 'text-[#4B5563]'
                }`}
              >
                {lang === 'FR'
                  ? 'Saisis le code du salon pour envoyer une demande d’accès à l’Hôte.'
                  : 'Enter the room code to request access admission from the Host.'}
              </p>

              <input
                type="text"
                maxLength={5}
                placeholder={t.enterCode}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className={`w-full px-3 py-2.5 rounded-xl text-center text-xs sm:text-sm font-black tracking-widest outline-none mb-4 font-mono uppercase border ${
                  darkMode
                    ? 'bg-[#04140D] border-[#164830] focus:border-[#10B981] text-white placeholder:text-emerald-700'
                    : 'bg-gray-50 border-gray-200 focus:border-[#10B981] text-gray-900 placeholder:text-gray-400'
                }`}
              />

              <button
                onClick={() => {
                  if (!joinCodeInput.trim()) return;
                  const c = joinCodeInput.trim().toUpperCase();
                  setRoomCode(c);
                  localStorage.setItem('gbe_active_room_code', c);
                  playSoundEffect('success');
                  setMultiStep('lobby');
                }}
                className={`w-full py-3 px-3 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap font-mono border cursor-pointer ${
                  darkMode
                    ? 'bg-[#04140D] border-[#10B981]/70 hover:border-[#10B981] hover:bg-[#0a2e1d] text-[#10B981]'
                    : 'bg-[#EDFBF4] border-[#10B981]/50 hover:bg-[#D1F4E2] text-[#047857]'
                }`}
              >
                <span>{t.joinRoom.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2, 3, 4: ACTIVE IN-ROOM EXPERIENCE */}
      {multiStep !== 'selection' && (
        <div className="w-full space-y-3 sm:space-y-4 animate-in fade-in duration-200">
          {/* Mobile sub-tab switcher */}
          <div className="lg:hidden flex items-center bg-[#072015]/90 border border-[#164830] rounded-xl sm:rounded-2xl p-1 gap-1 shadow-lg">
            <button
              onClick={() => setMobileTab('arena')}
              className={`flex-1 py-2 px-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                mobileTab === 'arena' ? 'bg-[#9E3500] text-white shadow-md' : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'FR' ? 'Arène' : 'Arena'}</span>
            </button>
            <button
              onClick={() => setMobileTab('players')}
              className={`flex-1 py-2 px-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                mobileTab === 'players' ? 'bg-[#9E3500] text-white shadow-md' : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{t.playersList} ({players.length})</span>
            </button>
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-2 px-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                mobileTab === 'chat' ? 'bg-[#9E3500] text-white shadow-md' : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Chat ({chatMessages.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Main Arena Area */}
            <div className={`lg:col-span-2 space-y-4 ${mobileTab !== 'arena' ? 'hidden lg:block' : 'block'}`}>
              {/* LOBBY / WAITING STATE (Section 5.1 & 5.2) */}
              {multiStep === 'lobby' && (
                <div className="bg-[#072015]/95 border border-[#164830] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-center space-y-4 sm:space-y-5 backdrop-blur-xl">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0a2e1d] border-2 border-[#FF7A1A] mx-auto flex items-center justify-center text-2xl shadow-lg shadow-[#FF7A1A]/25 animate-pulse">
                    👑
                  </div>

                  <div>
                    <span className="text-[10px] sm:text-xs font-black text-emerald-400 uppercase tracking-widest block font-mono">
                      {lang === 'FR' ? 'SALON PRIVÉ PRÊT' : 'PRIVATE ROOM READY'}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white font-display mt-1">
                      {players.length} {lang === 'FR' ? 'Joueurs Connectés' : 'Live Players'}
                    </h2>
                    <p className="text-xs text-emerald-300/80 mt-1">
                      {lang === 'FR' ? 'Partagez le code' : 'Share the code'}{' '}
                      <strong className="text-[#FF7A1A] font-black font-mono">{roomCode}</strong>{' '}
                      {lang === 'FR' ? 'pour inviter des amis.' : 'to invite friends.'}
                    </p>
                  </div>

                  {/* Pending Admission Requests for the Host (Section 5.1) */}
                  {pendingRequests.length > 0 && (
                    <div className="p-3 bg-[#04140D] border border-amber-500/40 rounded-2xl text-left space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 font-mono">
                        <ShieldAlert className="w-4 h-4" />
                        <span>{t.pendingRequests} ({pendingRequests.length})</span>
                      </div>
                      {pendingRequests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-2 bg-[#082216] rounded-xl border border-[#143E29]">
                          <div className="flex items-center gap-2">
                            <img src={req.avatar} alt={req.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <span className="text-xs font-black text-white block">{req.name}</span>
                              <span className="text-[10px] text-emerald-400/70 font-mono">{req.timestamp}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAcceptRequest(req)}
                              className="px-2.5 py-1 bg-gradient-to-r from-[#047857] to-[#10B981] text-white text-[10px] font-black rounded-lg shadow-sm"
                            >
                              {t.accept}
                            </button>
                            <button
                              onClick={() => handleRefuseRequest(req.id)}
                              className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-[10px] font-black rounded-lg"
                            >
                              {t.refuse}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3.5 sm:p-4 bg-[#04140D] border border-[#143B28] rounded-xl sm:rounded-2xl flex items-center justify-around text-center">
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-bold font-mono">{lang === 'FR' ? 'HÔTE' : 'HOST'}</span>
                      <span className="text-xs sm:text-sm font-black text-white">{user.name} 👑</span>
                    </div>
                    <div className="w-px h-8 bg-[#143B28]" />
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-bold font-mono">{lang === 'FR' ? 'MODE DE JEU' : 'GAME MODE'}</span>
                      <span className="text-xs sm:text-sm font-black text-[#FF7A1A]">Gbê ou Moument</span>
                    </div>
                  </div>

                  <button
                    id="btn-launch-game"
                    onClick={handleStartGame}
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-[#9E3500] via-[#C94700] to-[#9E3500] hover:from-[#B84000] hover:to-[#B84000] text-white font-black text-xs sm:text-sm md:text-base rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(201,71,0,0.35)] border border-[#FFA559]/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Gamepad2 className="w-5 h-5 shrink-0" />
                    <span>{t.launchGame.toUpperCase()}</span>
                  </button>
                </div>
              )}

              {/* GAME ACTIVE TURN STATE: STEP 1 (CHOOSE TYPE & INTENSITY) OR STEP 2 (QUESTION POSED & ANSWER) */}
              {multiStep === 'game' && turnPhase === 'choose' && (
                <div className="bg-[#072015]/95 border border-[#164830] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative animate-in fade-in duration-200 space-y-4 backdrop-blur-xl">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setMultiStep('lobby')}
                      className="flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-white px-3 py-1.5 rounded-full bg-[#04140D] border border-[#143B28] whitespace-nowrap transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'FR' ? 'Retour Salon' : 'Back to Lobby'}</span>
                    </button>
                    <span className="px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider bg-[#04140D] border border-[#1E5F3D] text-[#FF7A1A] font-mono">
                      {lang === 'FR' ? 'ÉTAPE 1/2 : SÉLECTION' : 'STEP 1/2 : SELECTION'}
                    </span>
                  </div>

                  {/* Active Player banner */}
                  <div className="p-3.5 bg-gradient-to-r from-[#04190F] via-[#08291A] to-[#04190F] border border-[#185335] rounded-2xl text-center space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#04140D] border border-[#1E5F3D]">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">
                        {lang === 'FR' ? "C'EST TON TOUR DE JOUER" : "CURRENT TURN"}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2.5">
                      <img
                        src={(players.find((p) => p.isTurn) || players[0]).avatar}
                        alt="Active Player"
                        className="w-9 h-9 rounded-full border-2 border-[#FF7A1A] object-cover shadow"
                      />
                      <h2 className="text-lg sm:text-xl font-black text-white font-display">
                        {(players.find((p) => p.isTurn) || players[0]).name}
                      </h2>
                    </div>
                    <p className="text-xs text-emerald-300/80 max-w-sm mx-auto">
                      {lang === 'FR'
                        ? "Choisis d'abord entre Action ou Vérité, puis définis l'intensité. L'application te posera ta question ensuite !"
                        : "First select Action or Truth, then choose the intensity. The app will pose your challenge next!"}
                    </p>
                  </div>

                  {/* 1. Choix du type : Action ou Vérité */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block font-mono">
                      1. {lang === 'FR' ? 'CHOISIS TON ÉPREUVE :' : 'CHOOSE CHALLENGE TYPE:'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Vérité / Gbê */}
                      <button
                        type="button"
                        onClick={() => {
                          playSoundEffect('select');
                          setActiveType('vérité');
                        }}
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all relative overflow-hidden ${
                          activeType === 'vérité'
                            ? 'bg-gradient-to-b from-[#7A2800]/90 to-[#B84000]/90 border-[#FFA559] shadow-[0_0_20px_rgba(230,90,0,0.35)] scale-[1.02]'
                            : 'bg-[#04140D] border-[#143B28] hover:border-[#E65A00]/50 text-emerald-300/80'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${activeType === 'vérité' ? 'bg-white/20 text-white' : 'bg-[#092B1B] text-[#FF8A3D]'}`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-white block font-display">
                            {lang === 'FR' ? 'GBÊ (VÉRITÉ)' : 'TRUTH'}
                          </span>
                          <span className="text-[10px] text-emerald-200/80 block mt-0.5">
                            {lang === 'FR' ? 'Confession sans filtre' : 'Honest confession'}
                          </span>
                        </div>
                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-black/40 text-amber-300">
                          +{getPointsForTurn('vérité', activeIntensity)} PTS
                        </span>
                      </button>

                      {/* Action / Moument */}
                      <button
                        type="button"
                        onClick={() => {
                          playSoundEffect('select');
                          setActiveType('action');
                        }}
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all relative overflow-hidden ${
                          activeType === 'action'
                            ? 'bg-gradient-to-b from-[#03523B]/90 to-[#059669]/90 border-[#34D399] shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.02]'
                            : 'bg-[#04140D] border-[#143B28] hover:border-[#10B981]/50 text-emerald-300/80'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${activeType === 'action' ? 'bg-white/20 text-white' : 'bg-[#092B1B] text-[#34D399]'}`}>
                          <Gamepad2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-white block font-display">
                            {lang === 'FR' ? 'MOUMENT (ACTION)' : 'DARE'}
                          </span>
                          <span className="text-[10px] text-emerald-200/80 block mt-0.5">
                            {lang === 'FR' ? 'Défi en direct' : 'Live action'}
                          </span>
                        </div>
                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-black/40 text-emerald-300">
                          +{getPointsForTurn('action', activeIntensity)} PTS
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Choix de l'intensité */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block font-mono">
                      2. {lang === 'FR' ? "CHOISIS L'INTENSITÉ :" : 'CHOOSE INTENSITY LEVEL:'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          playSoundEffect('select');
                          setActiveIntensity('simple');
                        }}
                        className={`py-3 px-3 rounded-xl border text-center transition-all ${
                          activeIntensity === 'simple'
                            ? 'bg-[#0E3823] border-[#10B981] text-white shadow-md'
                            : 'bg-[#04140D] border-[#143B28] text-emerald-300/70 hover:text-white'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black block">
                          {lang === 'FR' ? 'SIMPLE / TRANQUILLE' : 'SOFT / EASY'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                          +{getPointsForTurn(activeType, 'simple')} pts
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playSoundEffect('select');
                          setActiveIntensity('osée');
                        }}
                        className={`py-3 px-3 rounded-xl border text-center transition-all ${
                          activeIntensity === 'osée'
                            ? 'bg-[#471900] border-[#FF7A1A] text-white shadow-md'
                            : 'bg-[#04140D] border-[#143B28] text-emerald-300/70 hover:text-white'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black block text-[#FFA559]">
                          🔥 {lang === 'FR' ? 'OSÉE / PIMENTÉE' : 'SPICY / BOLD'}
                        </span>
                        <span className="text-[10px] text-orange-300 font-mono block mt-0.5">
                          +{getPointsForTurn(activeType, 'osée')} pts
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Bouton de confirmation pour révéler la question de l'app */}
                  <button
                    id="btn-discover-challenge"
                    type="button"
                    onClick={handleConfirmTurnChoice}
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-[#9E3500] via-[#C94700] to-[#9E3500] hover:from-[#B84000] hover:to-[#B84000] text-white font-black text-xs sm:text-sm md:text-base rounded-xl sm:rounded-2xl shadow-[0_4px_25px_rgba(201,71,0,0.4)] border border-[#FFA559]/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide font-display"
                  >
                    <span>
                      {lang === 'FR'
                        ? `OBTENIR LA QUESTION (${activeType === 'vérité' ? 'GBÊ' : 'MOUMENT'} • ${activeIntensity.toUpperCase()})`
                        : `GET QUESTION (${activeType.toUpperCase()} • ${activeIntensity.toUpperCase()})`}
                    </span>
                    <ArrowRight className="w-5 h-5 shrink-0" />
                  </button>
                </div>
              )}

              {/* GAME ACTIVE TURN STATE: STEP 2 (QUESTION POSED BY APP) */}
              {multiStep === 'game' && turnPhase === 'play' && (
                <div className="bg-[#072015]/95 border border-[#164830] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative animate-in fade-in duration-200 space-y-4 backdrop-blur-xl">
                  {tieNotice && (
                    <div className="p-3 bg-amber-500/20 border border-amber-500 rounded-xl text-amber-200 text-xs font-bold text-center animate-pulse">
                      ⚖️ {t.voteEqualityTie}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setMultiStep('lobby')}
                      className="flex items-center gap-1 text-xs font-black text-emerald-400 hover:text-white px-2.5 py-1 rounded-full bg-[#04140D] border border-[#143B28] whitespace-nowrap"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'FR' ? 'Salon' : 'Lobby'}</span>
                    </button>

                    {/* Turn Type & Intensity Badges + Modifier le choix */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                          activeType === 'vérité'
                            ? 'bg-gradient-to-r from-[#9E3500] to-[#C94700] text-white'
                            : 'bg-gradient-to-r from-[#047857] to-[#10B981] text-white'
                        }`}
                      >
                        {activeType === 'vérité' ? t.verite : t.action}
                      </span>

                      <span className="px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider bg-[#04140D] border border-[#184e33] text-emerald-300 font-mono">
                        {activeIntensity === 'simple' ? t.simpleIntensity : t.oseeIntensity}
                      </span>

                      <button
                        type="button"
                        onClick={handleChangeChoice}
                        title={lang === 'FR' ? 'Modifier mon choix' : 'Change choice'}
                        className="p-1 rounded-full bg-[#04140D] border border-[#184e33] text-emerald-400 hover:text-white"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="my-3 sm:my-4 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[10px] font-black text-emerald-400 tracking-wider block font-mono">
                        {t.turnOf} {(players.find((p) => p.isTurn) || players[0]).name.toUpperCase()} (+{getPointsForTurn(activeType, activeIntensity)} PTS) :
                      </span>
                    </div>
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#04170E] border border-[#184E31] shadow-inner">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono block mb-1">
                        {lang === 'FR' ? "QUESTION POSÉE PAR L'APPLICATION :" : "QUESTION FROM THE APP:"}
                      </span>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white italic font-display leading-snug">
                        “{currentPrompt}”
                      </h2>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitPlayerAnswer} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block font-mono">
                        {activeType === 'vérité' ? (lang === 'FR' ? 'TA CONFESSION OU RÉPONSE :' : 'YOUR CONFESSION / ANSWER:') : (lang === 'FR' ? 'VALIDATION DU DÉFI :' : 'DARE CONFIRMATION:')}
                      </label>
                      <textarea
                        placeholder={activeType === 'vérité' ? t.confessionPlaceholder : (lang === 'FR' ? 'Explique comment tu as réalisé le défi devant le groupe...' : 'Explain how you performed the dare...')}
                        value={playerAnswer}
                        onChange={(e) => {
                          setPlayerAnswer(e.target.value);
                          if (answerWarning) setAnswerWarning(null);
                          playSoundEffect('typing');
                        }}
                        rows={3}
                        className="w-full p-3.5 sm:p-4 bg-[#04140D] border border-[#164830] focus:border-[#FF7A1A] rounded-xl sm:rounded-2xl text-white text-xs sm:text-sm placeholder:text-emerald-700/80 outline-none resize-none shadow-inner transition-colors"
                        required
                      />
                      {answerWarning && (
                        <div className="mt-2 p-2 bg-rose-950/90 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-start gap-1.5 animate-in fade-in duration-150">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span className="font-medium leading-tight">{answerWarning}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[#143B28]">
                      <button
                        type="button"
                        onClick={handleShuffleChallenge}
                        className="text-xs font-black text-emerald-400/70 hover:text-emerald-300 uppercase tracking-wider py-2 text-center whitespace-nowrap font-mono flex items-center justify-center gap-1.5"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>{lang === 'FR' ? 'Autre question' : 'Another challenge'}</span>
                      </button>

                      <button
                        type="submit"
                        className="py-3 px-5 sm:px-6 bg-gradient-to-r from-[#9E3500] via-[#C94700] to-[#9E3500] hover:from-[#B84000] hover:to-[#B84000] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(201,71,0,0.35)] border border-[#FFA559]/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Send className="w-4 h-4 shrink-0" />
                        <span>{lang === 'FR' ? 'SOUMETTRE AUX VOTES' : 'SUBMIT FOR VOTING'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* EVALUATION & VOTING STATE (Section 5.3) */}
              {multiStep === 'evaluation' && (
                <div className="bg-[#072015]/95 border border-[#164830] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative animate-in fade-in duration-200 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setMultiStep('game')}
                      className="flex items-center gap-1 text-xs font-black text-emerald-400 hover:text-white px-2.5 py-1 rounded-full bg-[#04140D] border border-[#143B28] whitespace-nowrap"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'FR' ? 'Retour' : 'Back'}</span>
                    </button>
                    <span className="px-3 sm:px-4 py-1 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-wider bg-[#10B981] text-white shadow-md whitespace-nowrap font-mono">
                      {t.waitingVotes}
                    </span>
                  </div>

                  <div className="my-2 text-center">
                    <h3 className="text-sm sm:text-base md:text-lg font-black text-white italic font-display">
                      “{currentPrompt}”
                    </h3>
                  </div>

                  {/* Player Submitted Answer Card */}
                  <div className="bg-[#020B07] border border-[#123824] rounded-xl sm:rounded-2xl p-4 text-center">
                    <span className="text-[10px] text-emerald-500 font-bold block mb-1 font-mono">
                      {lang === 'FR' ? 'RÉPONSE DU JOUEUR :' : 'PLAYER ANSWER:'}
                    </span>
                    <p className="text-sm sm:text-base font-black text-white italic">“{playerAnswer}”</p>
                  </div>

                  {/* Community Binary Voting Section (OK / Pas OK) */}
                  <div className="bg-[#04140D] border border-[#15422D] rounded-xl sm:rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-emerald-300 font-mono">
                        {t.votePrompt}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {votesOk} OK / {votesNotOk} Pas OK
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleVote('ok')}
                        className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all ${
                          userVoted === 'ok'
                            ? 'bg-[#10B981] text-white border-white shadow-md'
                            : 'bg-[#082216] hover:bg-[#0c3120] text-emerald-300 border-[#143E29]'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4 text-emerald-400" />
                        <span>{t.voteOk} ({votesOk})</span>
                      </button>

                      <button
                        onClick={() => handleVote('not_ok')}
                        className={`py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all ${
                          userVoted === 'not_ok'
                            ? 'bg-red-600 text-white border-white shadow-md'
                            : 'bg-[#082216] hover:bg-[#1a0f0f] text-red-300 border-[#143E29]'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                        <span>{t.voteNotOk} ({votesNotOk})</span>
                      </button>
                    </div>

                    <button
                      onClick={handleResolveByCommunityVotes}
                      className="w-full py-2 bg-[#082216] hover:bg-[#0c3120] border border-[#143E29] text-xs font-black text-emerald-300 rounded-xl"
                    >
                      {lang === 'FR' ? 'Appliquer le résultat des votes' : 'Apply community votes result'}
                    </button>
                  </div>

                  {/* Host Priority Arbitration Section (Section 5.3) */}
                  <div className="p-4 bg-gradient-to-br from-[#140a02] to-[#082216] border border-[#E65A00]/50 rounded-xl sm:rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#FF8A3D] font-mono">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>{t.hostPowerTitle}</span>
                    </div>
                    <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                      {lang === 'FR'
                        ? 'En tant qu’Hôte, vous pouvez trancher immédiatement et primer sur le vote communautaire :'
                        : 'As the Host, you hold final priority power to validate or reject regardless of votes:'}
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        onClick={handleHostRefuse}
                        className="py-2.5 bg-red-950/70 hover:bg-red-900 border border-red-800/80 text-red-200 font-black text-xs rounded-xl transition-all"
                      >
                        {t.hostRefuse}
                      </button>

                      <button
                        onClick={handleHostValidate}
                        className="py-2.5 bg-gradient-to-r from-[#9E3500] to-[#C94700] hover:from-[#B84000] hover:to-[#B84000] text-white font-black text-xs rounded-xl shadow-[0_4px_16px_rgba(201,71,0,0.35)] transition-all"
                      >
                        {t.hostValidate}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Players List Column (Section 5.1) */}
            <div className={`space-y-4 ${mobileTab !== 'players' ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-[#072015]/90 border border-[#164830] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between text-xs font-black text-emerald-300 uppercase tracking-wider mb-3 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#FF7A1A]" />
                    <span>{t.playersList} ({players.length})</span>
                  </div>
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>

                <div className="space-y-2">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-xl sm:rounded-2xl flex items-center justify-between border transition-all ${
                        p.isTurn
                          ? 'bg-[#0B2D1D] border-[#FF7A1A] shadow-md shadow-[#FF7A1A]/20'
                          : 'bg-[#04140D] border-[#133A27]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#FF7A1A] overflow-hidden bg-[#04140D] shrink-0">
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black text-white truncate">{p.name}</span>
                            {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold font-mono">{p.score} pts</span>
                        </div>
                      </div>

                      {p.isTurn && (
                        <span className="px-2 py-0.5 bg-[#FF7A1A] text-white text-[9px] font-black rounded-full uppercase tracking-wider shrink-0 font-mono">
                          {lang === 'FR' ? 'TOUR' : 'TURN'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Column (Section 5.4 - can delete own messages and react) */}
            <div className={`space-y-4 ${mobileTab !== 'chat' ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-[#072015]/90 border border-[#164830] rounded-2xl sm:rounded-3xl p-4 shadow-xl flex flex-col min-h-[340px] lg:h-96 backdrop-blur-xl">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300 uppercase tracking-wider mb-2 border-b border-[#133A27] pb-2 font-mono">
                  <MessageSquare className="w-4 h-4 text-[#FF7A1A]" />
                  <span>{lang === 'FR' ? 'TCHAT EN DIRECT' : 'LIVE CHAT'}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                  {chatMessages.map((msg) => {
                    const isMentioned = !msg.isSystem && user.name && msg.text.toLowerCase().includes(`@${user.name.toLowerCase()}`);
                    return (
                      <div
                        key={msg.id}
                        className={`group relative p-2 sm:p-2.5 rounded-xl transition-all ${
                          msg.isSystem
                            ? 'bg-[#0A2E1D] text-emerald-300 border border-[#195236] text-center font-bold text-[11px]'
                            : isMentioned
                            ? 'bg-gradient-to-r from-[#FF7A1A]/20 via-[#FF7A1A]/10 to-[#04140D] border-2 border-[#FFA559] text-white shadow-[0_0_15px_rgba(255,122,26,0.3)]'
                            : msg.senderId === user.id
                            ? 'bg-[#E65A00]/20 border border-[#E65A00]/40 text-white ml-2'
                            : 'bg-[#04140D] border border-[#123A25] text-emerald-100 mr-2'
                        }`}
                      >
                        {!msg.isSystem && (
                          <div className="flex items-center justify-between mb-0.5 text-[10px] text-emerald-400 font-extrabold">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{msg.senderName}</span>
                              {isMentioned && (
                                <span className="text-[9px] font-black text-amber-300 bg-black/50 px-1.5 py-0.2 rounded border border-amber-500/40">
                                  🔔 {lang === 'FR' ? 'Mentionné' : 'Mentioned'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] opacity-60 font-mono">{msg.time}</span>
                              {/* Can delete own message (Section 6.4) */}
                              {msg.senderId === user.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  title={t.deleteMessage}
                                  className="opacity-70 hover:opacity-100 hover:text-red-400 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        <p className="leading-snug break-words">{renderMessageContent(msg.text)}</p>
                      </div>
                    );
                  })}
                </div>

                {chatWarning && (
                  <div className="mb-2 p-2 bg-rose-950/90 border border-rose-700 text-rose-200 text-[11px] rounded-xl flex items-start gap-1.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span className="font-medium leading-tight">{chatWarning}</span>
                  </div>
                )}

                {/* Auto-suggest dropdown for @mentions (Section 6.4) */}
                {showMentionDropdown && (
                  <div className="mb-1 p-1.5 bg-[#04140D] border border-[#195236] rounded-xl shadow-2xl max-h-32 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[10px] font-black text-emerald-400 px-2 py-0.5 uppercase tracking-wider font-mono">
                      {lang === 'FR' ? 'Mentionner un participant :' : 'Mention participant:'}
                    </div>
                    {players
                      .filter((p) => p.id !== user.id && p.name.toLowerCase().includes(mentionFilter))
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectMention(p.name)}
                          className="w-full px-2 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#0c2f1f] text-left transition-colors"
                        >
                          <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full object-cover border border-[#FF7A1A]" />
                          <span className="text-xs font-bold text-white truncate">@{p.name}</span>
                          <span className="text-[10px] text-emerald-400 font-mono ml-auto">{p.score} pts</span>
                        </button>
                      ))}
                    {players.filter((p) => p.id !== user.id && p.name.toLowerCase().includes(mentionFilter)).length === 0 && (
                      <div className="text-[11px] text-emerald-600 px-2 py-1 italic">
                        {lang === 'FR' ? 'Aucun joueur trouvé' : 'No player found'}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="mt-1 flex gap-1.5 relative">
                  <input
                    type="text"
                    placeholder={t.chatPlaceholder}
                    value={chatInput}
                    onChange={(e) => handleChatInputChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#04140D] border border-[#16402C] focus:border-[#FF7A1A] rounded-xl text-white text-xs placeholder:text-emerald-700 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-9 h-9 rounded-xl bg-[#9E3500] hover:bg-[#C94700] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#9E3500]/30 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal to permanently close and leave the room (Mandatory Confirmation) */}
      {showLeaveConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#072015] border-2 border-[#195236] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-center relative space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-950/60 border border-red-500/50 flex items-center justify-center text-red-400 shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-white font-display leading-snug">
                {lang === 'FR'
                  ? 'Voulez-vous vraiment fermer définitivement le salon ?'
                  : 'Do you really want to permanently close the room?'}
              </h3>
              <p className="text-xs text-emerald-300/80 leading-relaxed font-medium">
                {lang === 'FR'
                  ? 'Cette action fermera le salon pour tous les participants et mettra fin à la partie.'
                  : 'This action will permanently close the room for all participants and end the session.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelLeaveRoom}
                className="w-full py-3 px-4 rounded-xl bg-[#04140D] hover:bg-[#0c2f1f] border border-[#143B28] hover:border-[#1E5F3D] text-emerald-300 hover:text-white font-bold text-xs sm:text-sm transition-all active:scale-95"
              >
                {lang === 'FR' ? 'Non' : 'No'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseRoom}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#B82E00] to-[#E65A00] hover:from-[#C93300] hover:to-[#FF6A00] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#E65A00]/30 border border-[#FFA559]/50 transition-all active:scale-95"
              >
                {lang === 'FR' ? 'Oui' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
