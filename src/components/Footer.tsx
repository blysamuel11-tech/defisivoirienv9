import React from 'react';

interface FooterProps {
  darkMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ darkMode = true }) => {
  return (
    <footer className="w-full py-8 mt-auto flex flex-col items-center justify-center text-center select-none">
      {/* Mini logo icon with orange glow */}
      <div
        className={`w-5 h-5 rounded-md flex items-center justify-center mb-1.5 shadow-sm ${
          darkMode
            ? 'bg-[#082417] border border-[#E65A00]/50 shadow-[#E65A00]/20'
            : 'bg-[#FFF5ED] border border-[#E65A00]/40 shadow-orange-500/10'
        }`}
      >
        <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 text-[#E65A00] fill-current">
          <path d="M50 5 C50 30 70 50 95 50 C70 50 50 70 50 95 C50 70 30 50 5 50 C30 50 50 30 50 5 Z" />
        </svg>
      </div>

      {/* Mini logo title */}
      <div className="text-xs font-black tracking-tight flex items-center gap-1 font-display">
        <span className={darkMode ? 'text-white/90' : 'text-gray-800'}>GBÊ</span>
        <span className="text-[#E65A00] italic">OU</span>
        <span className={darkMode ? 'text-white/90' : 'text-gray-800'}>MOUMENT</span>
      </div>

      {/* Copyright & Creator (Bottom line) */}
      <p
        className={`text-[10px] sm:text-[11px] font-extrabold mt-2 uppercase tracking-widest px-4 font-mono ${
          darkMode ? 'text-emerald-400/60' : 'text-gray-400'
        }`}
      >
        © 2026 GBÊ OU MOUMENT • CRÉÉ PAR SAMUEL EZECKIEL BLY
      </p>
    </footer>
  );
};

