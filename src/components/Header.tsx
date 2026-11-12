import React from 'react';
import { Volume2, VolumeX, Shield, Sparkles } from 'lucide-react';
import { SoundEngine } from '../utils/soundEffects';

interface HeaderProps {
  stars: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenParentGate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stars,
  soundEnabled,
  onToggleSound,
  onOpenParentGate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FFFBF3]/90 backdrop-blur-md border-b-2 border-[#FFE58A] px-4 py-2.5 flex items-center justify-between shadow-xs">
      {/* Brand & Mascot */}
      <div className="flex items-center gap-2.5">
        <div className="w-11 h-11 rounded-2xl bg-[#FFE58A] border-2 border-[#FFA0B6] flex items-center justify-center text-2xl shadow-inner animate-cute-bounce">
          🦁
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#344054] leading-tight flex items-center gap-1">
              Color & Learn
              <Sparkles className="w-4 h-4 text-[#FFB6C8] fill-[#FFB6C8]" />
            </h1>
          </div>
          <p className="text-xs font-semibold text-[#8B5CF6]">Little Genius • Age 2-8</p>
        </div>
      </div>

      {/* Action clusters: Stars, Sound, Parent Gate */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Star Counter */}
        <div
          className="flex items-center gap-1.5 bg-[#FFF0B3] border-2 border-[#FFD32A] text-[#B45309] font-bold px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-transform cursor-pointer"
          onClick={() => {
            SoundEngine.playStar();
          }}
          title="Daily Learning Stars"
        >
          <span className="text-lg">⭐</span>
          <span className="text-sm font-extrabold tabular-nums">{stars}</span>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          className="w-10 h-10 rounded-full bg-[#A9D9FF]/40 hover:bg-[#A9D9FF]/70 border-2 border-[#A9D9FF] flex items-center justify-center text-[#1E3A8A] transition-all active:scale-90"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
        </button>

        {/* Parent Gate Button */}
        <button
          onClick={onOpenParentGate}
          aria-label="Parent Dashboard Gate"
          className="flex items-center gap-1 bg-[#D7C5FF]/50 hover:bg-[#D7C5FF] border-2 border-[#D7C5FF] text-[#5B21B6] px-2.5 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95"
        >
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Parents</span>
        </button>
      </div>
    </header>
  );
};
