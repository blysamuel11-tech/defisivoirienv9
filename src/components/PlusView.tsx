import React, { useState, useEffect } from 'react';
import {
  Share2,
  Star,
  Link,
  MessageCircle,
  Twitter,
  Facebook,
  Check,
  Heart,
  Sparkles,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { playSoundEffect } from '../utils/audio';
import { TRANSLATIONS } from '../data/translations';
import { validateContentModeration } from '../utils/moderation';

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  date: string;
}

interface PlusViewProps {
  lang?: 'FR' | 'EN';
  darkMode?: boolean;
  onOpenSettings?: () => void;
}

export const PlusView: React.FC<PlusViewProps> = ({ lang = 'FR', darkMode = true, onOpenSettings }) => {
  const t = TRANSLATIONS[lang];

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackWarning, setFeedbackWarning] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCreatorBio, setShowCreatorBio] = useState(false);

  // Reviews stored in localStorage (Section 8.2)
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem('gbe_reviews');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'rev-1',
        rating: 5,
        comment: lang === 'FR' ? 'Superbe ambiance avec mes amis ! Une vraie masterclass.' : 'Amazing vibe with my friends! A real masterclass.',
        date: '2026-02-14 20:30',
      },
      {
        id: 'rev-2',
        rating: 5,
        comment: lang === 'FR' ? 'Les vérités osées nous ont fait tellement rire !' : 'The spicy truths made us laugh so hard!',
        date: '2026-02-16 22:15',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('gbe_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://gbeoumoument.app';

  // Section 8.1 Native Web Share API or Clipboard fallback
  const handleNativeShare = async () => {
    playSoundEffect('click');
    const shareData = {
      title: 'Gbê ou Moument — Jeu Action ou Vérité',
      text: lang === 'FR'
        ? 'Rejoins-moi sur Gbê ou Moument ! Défie tes limites et découvre les secrets de tes amis ! 🔥'
        : 'Join me on Gbê ou Moument! Dare your friends and uncover their deepest secrets! 🔥',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        playSoundEffect('success');
      } catch (err) {
        // User cancelled or share dismissed
      }
    } else {
      handleCopyShareLink();
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    playSoundEffect('notification');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareSocial = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
    playSoundEffect('click');
    const text = encodeURIComponent(
      lang === 'FR'
        ? 'Rejoins-moi sur Gbê ou Moument, le meilleur jeu de Vérité ou Action party ! 🔥'
        : 'Join me on Gbê ou Moument, the ultimate Truth or Dare party game! 🔥'
    );
    const url = encodeURIComponent(shareUrl);

    let finalUrl = '';
    if (platform === 'whatsapp') {
      finalUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
    } else if (platform === 'facebook') {
      finalUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === 'twitter') {
      finalUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    }

    if (finalUrl) {
      window.open(finalUrl, '_blank');
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();

    if (feedbackText.trim()) {
      const modResult = validateContentModeration(feedbackText.trim(), lang);
      if (!modResult.isValid) {
        playSoundEffect('fail');
        setFeedbackWarning(modResult.warningMessage);
        return;
      }
    }
    setFeedbackWarning(null);

    playSoundEffect('success');
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      rating,
      comment: feedbackText.trim() || (lang === 'FR' ? 'Super application !' : 'Great game!'),
      date: new Date().toLocaleString(),
    };

    setReviews((prev) => [newRev, ...prev]);
    setHasSubmitted(true);
    setFeedbackText('');
  };

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none pb-8 space-y-3 sm:space-y-4" id="plus-screen">
      {/* Settings & System Preferences Card */}
      {onOpenSettings && (
        <div
          className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all border flex items-center justify-between gap-3 ${
            darkMode
              ? 'bg-[#061D12] border-[#133F28] shadow-xl'
              : 'bg-white border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                darkMode ? 'bg-[#04140D] text-[#E65A00] border border-[#16402C]' : 'bg-[#FFF3EB] text-[#E65A00] border border-[#FFE0CC]'
              }`}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`font-black text-sm sm:text-base font-display truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'FR' ? 'Paramètres & Audio' : 'Settings & Audio'}
              </h2>
              <p className={`text-[11px] truncate ${darkMode ? 'text-emerald-300/70' : 'text-gray-500'}`}>
                {lang === 'FR' ? 'Mode sombre, voix, vibrations, musique pop & store' : 'Dark mode, voice, haptics, pop music & store'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSoundEffect('click');
              onOpenSettings();
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF7A1A] to-[#E65A00] hover:from-[#FF8C33] hover:to-[#FF6A00] text-white text-xs font-black shrink-0 shadow-md shadow-[#E65A00]/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap font-display"
          >
            {lang === 'FR' ? 'Ouvrir' : 'Open'}
          </button>
        </div>
      )}

      {/* Card 1: Partager l'aventure (Section 8.1) */}
      <div
        className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3.5 transition-all border ${
          darkMode
            ? 'bg-[#061D12] border-[#133F28] shadow-xl'
            : 'bg-white border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 font-black text-sm sm:text-base font-display ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Share2 className="w-4 h-4 text-[#FF7A1A]" />
            <h2 className="whitespace-nowrap">{t.shareAdventure}</h2>
          </div>
          <button
            onClick={handleNativeShare}
            className="px-3 py-1 bg-gradient-to-r from-[#9E3500] to-[#C94700] text-white text-[11px] font-black rounded-lg shadow-sm cursor-pointer"
          >
            {lang === 'FR' ? 'Partager' : 'Share'}
          </button>
        </div>
        <p className={`text-xs italic mt-0.5 ${darkMode ? 'text-emerald-300/70' : 'text-gray-500'}`}>
          {lang === 'FR'
            ? 'Invite tes amis à rejoindre Gbê ou Moument en un clin d’œil !'
            : 'Invite your friends to join Gbê ou Moument in one tap!'}
        </p>

        {/* Social Share Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          {/* WhatsApp */}
          <button
            onClick={() => handleShareSocial('whatsapp')}
            className={`p-3 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center shadow-sm active:scale-95 transition-all group border cursor-pointer ${
              darkMode
                ? 'bg-[#04140D] border-[#16402C] hover:border-[#10B981]'
                : 'bg-emerald-50/40 border-emerald-200 hover:border-[#10B981]'
            }`}
          >
            <MessageCircle className="w-5 h-5 text-[#10B981] mb-1.5 group-hover:scale-110 transition-transform" />
            <span className={`text-[10px] font-black uppercase tracking-wider font-mono whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              WHATSAPP
            </span>
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleShareSocial('facebook')}
            className={`p-3 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center shadow-sm active:scale-95 transition-all group border cursor-pointer ${
              darkMode
                ? 'bg-[#04140D] border-[#16402C] hover:border-blue-500'
                : 'bg-blue-50/40 border-blue-200 hover:border-blue-500'
            }`}
          >
            <Facebook className="w-5 h-5 text-blue-500 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className={`text-[10px] font-black uppercase tracking-wider font-mono whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              FACEBOOK
            </span>
          </button>

          {/* X / Twitter */}
          <button
            onClick={() => handleShareSocial('twitter')}
            className={`p-3 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center shadow-sm active:scale-95 transition-all group border cursor-pointer ${
              darkMode
                ? 'bg-[#04140D] border-[#16402C] hover:border-sky-400'
                : 'bg-sky-50/40 border-sky-200 hover:border-sky-400'
            }`}
          >
            <Twitter className="w-5 h-5 text-sky-500 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className={`text-[10px] font-black uppercase tracking-wider font-mono whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              X / TWITTER
            </span>
          </button>

          {/* Copier le lien */}
          <button
            onClick={handleCopyShareLink}
            className={`p-3 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center shadow-sm active:scale-95 transition-all group border cursor-pointer ${
              darkMode
                ? 'bg-[#04140D] border-[#16402C] hover:border-[#FF7A1A]'
                : 'bg-orange-50/40 border-orange-200 hover:border-[#FF7A1A]'
            }`}
          >
            {copiedLink ? (
              <Check className="w-5 h-5 text-emerald-500 mb-1.5 animate-bounce" />
            ) : (
              <Link className="w-5 h-5 text-[#FF7A1A] mb-1.5 group-hover:scale-110 transition-transform" />
            )}
            <span className={`text-[10px] font-black uppercase tracking-wider font-mono whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {copiedLink ? (lang === 'FR' ? 'COPIÉ !' : 'COPIED!') : (lang === 'FR' ? 'COPIER LIEN' : 'COPY LINK')}
            </span>
          </button>
        </div>
      </div>

      {/* Card 2: Donne ton avis (Section 8.2) */}
      <div
        className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3.5 transition-all border ${
          darkMode
            ? 'bg-[#061D12] border-[#133F28] shadow-xl'
            : 'bg-white border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 font-black text-sm sm:text-base font-display ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="whitespace-nowrap">{t.giveFeedback}</h2>
          </div>
          {/* Average Rating and count display (Section 8.2) */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              darkMode ? 'bg-[#04140D] border-[#143B28]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="text-amber-500 font-black">★ {avgRating}</span>
            <span className={`font-bold ${darkMode ? 'text-emerald-500' : 'text-gray-600'}`}>
              ({reviews.length} {lang === 'FR' ? 'avis' : 'reviews'})
            </span>
          </div>
        </div>

        {hasSubmitted ? (
          <div
            className={`rounded-2xl p-5 sm:p-6 text-center space-y-2 animate-in fade-in duration-200 border ${
              darkMode ? 'bg-[#04140D] border-[#185336]' : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500 mx-auto animate-bounce" />
            <h3 className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {lang === 'FR' ? 'Merci pour ton retour précieux !' : 'Thank you for your valuable feedback!'}
            </h3>
            <p className={`text-xs ${darkMode ? 'text-emerald-300/80' : 'text-gray-600'}`}>
              {lang === 'FR'
                ? 'Ton avis a été enregistré avec succès.'
                : 'Your review has been successfully saved.'}
            </p>
            <button
              onClick={() => setHasSubmitted(false)}
              className="mt-2 text-xs font-bold text-[#FF7A1A] hover:underline cursor-pointer"
            >
              {lang === 'FR' ? 'Laisser un autre avis' : 'Submit another review'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
            {/* 5 Stars interactive selection */}
            <div className="text-center space-y-1.5">
              <span className={`text-[10px] font-black uppercase tracking-widest block font-mono ${darkMode ? 'text-emerald-300' : 'text-gray-600'}`}>
                {t.rateApp}
              </span>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      playSoundEffect('select');
                      setRating(star);
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : darkMode
                          ? 'text-emerald-900 fill-transparent'
                          : 'text-gray-300 fill-transparent'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Optional message input */}
            <div className="space-y-1">
              <label className={`text-[10px] font-black uppercase tracking-wider block font-mono ${darkMode ? 'text-emerald-300' : 'text-gray-600'}`}>
                {lang === 'FR' ? 'VOTRE COMMENTAIRE' : 'YOUR COMMENT'}
              </label>
              <textarea
                placeholder={
                  lang === 'FR'
                    ? 'Raconte-nous ton expérience ou tes suggestions...'
                    : 'Tell us about your experience or suggestions...'
                }
                value={feedbackText}
                onChange={(e) => {
                  setFeedbackText(e.target.value);
                  if (feedbackWarning) setFeedbackWarning(null);
                  playSoundEffect('typing');
                }}
                rows={2}
                className={`w-full p-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm outline-none resize-none shadow-inner transition-colors border ${
                  darkMode
                    ? 'bg-[#04140D] border-[#16402C] focus:border-[#FF7A1A] text-white placeholder:text-emerald-700'
                    : 'bg-gray-50 border-gray-200 focus:border-[#FF7A1A] text-gray-900 placeholder:text-gray-400'
                }`}
              />
              {feedbackWarning && (
                <div className="mt-2 p-2.5 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-start gap-1.5 animate-in fade-in duration-150">
                  <span className="font-medium leading-tight">{feedbackWarning}</span>
                </div>
              )}
            </div>

            {/* Submit Note Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#9E3500] via-[#C94700] to-[#9E3500] hover:from-[#B84000] hover:to-[#B84000] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(201,71,0,0.35)] border border-[#FFA559]/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{t.submitNote}</span>
            </button>
          </form>
        )}
      </div>

      {/* Card 3: Présentation du Créateur (Section 8.3) */}
      <div
        className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 transition-all border ${
          darkMode
            ? 'bg-[#061D12] border-[#133F28] shadow-xl'
            : 'bg-white border-gray-100 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#FF7A1A]" />
            <div>
              <h3 className={`text-xs sm:text-sm font-black font-display ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t.creatorAbout}
              </h3>
              <p className={`text-[10px] font-mono font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {t.creatorSubtitle}
              </p>
            </div>
          </div>

          {/* Toggle fold/unfold button (Section 8.3) */}
          <button
            onClick={() => {
              playSoundEffect('click');
              setShowCreatorBio(!showCreatorBio);
            }}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              darkMode
                ? 'bg-[#04140D] border-[#143B28] text-emerald-300 hover:text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900'
            }`}
          >
            <span>{showCreatorBio ? t.creatorToggleHide : t.creatorToggleShow}</span>
            {showCreatorBio ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showCreatorBio && (
          <div
            className={`p-4 rounded-2xl space-y-2 animate-in fade-in duration-150 border ${
              darkMode ? 'bg-[#04140D] border-[#15442E]' : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <div className={`flex items-center gap-2 text-xs font-black font-mono ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
              <span className="w-2 h-2 rounded-full bg-[#FF7A1A]" />
              <span>{lang === 'FR' ? 'Rôle : Créateur & Concepteur Officiel' : 'Role: Official Creator & Designer'}</span>
            </div>
            <p className={`text-xs leading-relaxed italic ${darkMode ? 'text-emerald-100/90' : 'text-gray-700'}`}>
              « {t.creatorBio} »
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
