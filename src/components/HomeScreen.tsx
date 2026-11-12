import React, { useState } from 'react';
import { ActiveTab, LearningSubTab } from '../types';
import { SoundEngine } from '../utils/soundEffects';
import { Sparkles, Star, Trophy, Heart } from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (tab: ActiveTab, subTab?: LearningSubTab) => void;
  stars: number;
  onAddStars: (count: number) => void;
  onTriggerConfetti: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  stars,
  onAddStars,
  onTriggerConfetti,
}) => {
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [mascotMood, setMascotMood] = useState<'happy' | 'dancing' | 'waving'>('happy');

  const handleClaimDaily = () => {
    if (dailyClaimed) return;
    setDailyClaimed(true);
    onAddStars(5);
    SoundEngine.playStar();
    onTriggerConfetti();
  };

  const handleMascotTap = () => {
    SoundEngine.playAnimalSound('roar');
    setMascotMood(prev => (prev === 'happy' ? 'dancing' : prev === 'dancing' ? 'waving' : 'happy'));
    SoundEngine.speak('Hello little genius! Let us paint and play!');
  };

  const activityCards = [
    {
      title: 'Coloring Book',
      subtitle: '100+ Magic Pages',
      emoji: '🎨',
      bg: '#FFB6C8',
      border: '#FFA0B6',
      badge: 'Popular',
      onClick: () => onNavigate('coloring'),
    },
    {
      title: 'Free Drawing',
      subtitle: 'Rainbow Pens & Stamps',
      emoji: '✏️',
      bg: '#A9D9FF',
      border: '#8BC9FF',
      badge: 'Creative',
      onClick: () => onNavigate('drawing'),
    },
    {
      title: 'Learn ABC',
      subtitle: 'Phonics & Words A-Z',
      emoji: '🔤',
      bg: '#FFE58A',
      border: '#FFD32A',
      badge: 'Reading',
      onClick: () => onNavigate('learning', 'abc'),
    },
    {
      title: 'Learn Numbers',
      subtitle: 'Count 1 to 100',
      emoji: '🔢',
      bg: '#B9E8C5',
      border: '#86EFAC',
      badge: 'Math',
      onClick: () => onNavigate('learning', 'numbers'),
    },
    {
      title: 'Colors & Shapes',
      subtitle: 'Circles, Stars & Rainbows',
      emoji: '🌈',
      bg: '#D7C5FF',
      border: '#C084FC',
      badge: 'Explore',
      onClick: () => onNavigate('learning', 'colors-shapes'),
    },
    {
      title: 'Animal World',
      subtitle: 'Sounds, Facts & Habitats',
      emoji: '🦁',
      bg: '#FFD1DC',
      border: '#F472B6',
      badge: 'Roar!',
      onClick: () => onNavigate('learning', 'animals'),
    },
    {
      title: 'Fruits & Veggies',
      subtitle: 'Healthy Yummy Foods',
      emoji: '🍎',
      bg: '#A7F3D0',
      border: '#34D399',
      badge: 'Yummy',
      onClick: () => onNavigate('learning', 'abc'), // Opens fruits ABC / coloring category
    },
    {
      title: 'Trace and Write',
      subtitle: 'Guided Letter Tracing',
      emoji: '✍️',
      bg: '#BAE6FD',
      border: '#38BDF8',
      badge: 'Skills',
      onClick: () => onNavigate('learning', 'trace'),
    },
    {
      title: 'Fun Mini Quiz',
      subtitle: 'Win Shiny Gold Stars',
      emoji: '🧩',
      bg: '#FED7AA',
      border: '#FB923C',
      badge: 'Games',
      onClick: () => onNavigate('learning', 'games'),
    },
    {
      title: 'My Art Gallery',
      subtitle: 'Your Saved Masterpieces',
      emoji: '🖼️',
      bg: '#E9D5FF',
      border: '#C084FC',
      badge: 'Trophy',
      onClick: () => onNavigate('gallery'),
    },
  ];

  return (
    <div className="pb-24 px-4 pt-3 max-w-4xl mx-auto space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-[#FFB6C8]/40 via-[#FFE58A]/40 to-[#A9D9FF]/40 border-3 border-[#FFE58A] rounded-3xl p-5 sm:p-6 shadow-sm">
        {/* Floating clouds & stars decorations */}
        <div className="absolute top-2 right-4 text-2xl opacity-60 pointer-events-none select-none">☁️</div>
        <div className="absolute bottom-2 left-3 text-xl opacity-60 pointer-events-none select-none">🌸</div>
        <div className="absolute top-1/2 right-16 text-lg opacity-50 pointer-events-none select-none">✨</div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          {/* Mascot & Greeting */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <button
              onClick={handleMascotTap}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#FFE58A] border-3 border-[#FFA0B6] flex items-center justify-center text-5xl shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Tap Pip the Mascot!"
            >
              <span className="animate-cute-bounce select-none">
                {mascotMood === 'dancing' ? '🌟' : mascotMood === 'waving' ? '🐾' : '🦁'}
              </span>
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-xs font-bold text-[#FF5E57] border border-[#FFB6C8] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Happy Learning Adventure!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#344054] tracking-tight">
                Hello, Little Artist! 🎨
              </h2>
              <p className="text-sm font-semibold text-[#667085] mt-0.5">
                What magical thing do you want to create today?
              </p>
            </div>
          </div>

          {/* Daily Streak & Daily Star Claim */}
          <div className="flex sm:flex-col items-center gap-2">
            <button
              onClick={handleClaimDaily}
              disabled={dailyClaimed}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-95 ${
                dailyClaimed
                  ? 'bg-white/80 border-2 border-emerald-300 text-emerald-700 cursor-default'
                  : 'bg-[#FFD32A] hover:bg-[#F59E0B] border-2 border-amber-500 text-amber-900 cursor-pointer animate-pulse-subtle'
              }`}
            >
              <Star className={`w-5 h-5 ${dailyClaimed ? 'fill-emerald-500 text-emerald-500' : 'fill-amber-600 text-amber-600'}`} />
              <span>{dailyClaimed ? '⭐ 5 Stars Collected!' : '⭐ Tap for Daily 5 Stars!'}</span>
            </button>

            <div className="text-xs font-bold text-[#7C3AED] bg-[#D7C5FF]/50 px-3 py-1 rounded-full border border-[#C084FC]">
              🔥 3 Day Learning Streak
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Carousel / Highlights */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[#344054] flex items-center gap-2">
          <span>Choose an Activity</span>
          <span className="text-base font-normal text-gray-400">• 10 Fun Modes</span>
        </h3>
        <span className="text-xs font-bold text-[#3B82F6] bg-[#A9D9FF]/40 px-2.5 py-1 rounded-full">
          Touch & Play 👆
        </span>
      </div>

      {/* 10 Main Activity Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {activityCards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => {
              SoundEngine.playPop();
              card.onClick();
            }}
            className="group relative flex flex-col items-center text-center p-3.5 sm:p-4 rounded-3xl border-3 transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-1 active:translate-y-0 active:scale-95 text-[#344054]"
            style={{
              backgroundColor: card.bg,
              borderColor: card.border,
            }}
          >
            {/* Top Tag */}
            <span className="absolute top-2 right-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/70 text-[#344054] shadow-xs">
              {card.badge}
            </span>

            {/* Huge Cute Illustration */}
            <div className="w-16 h-16 rounded-2xl bg-white/80 border-2 border-white flex items-center justify-center text-3xl shadow-xs my-2 group-hover:scale-110 transition-transform">
              <span className="group-hover:animate-wiggle">{card.emoji}</span>
            </div>

            {/* Title */}
            <h4 className="font-extrabold text-sm sm:text-base leading-tight mt-1 text-[#344054]">
              {card.title}
            </h4>

            {/* Subtitle */}
            <p className="text-[11px] font-semibold text-[#475467] mt-0.5">
              {card.subtitle}
            </p>

            {/* Play Button Indicator */}
            <div className="mt-3 w-full py-1 rounded-xl bg-white/80 font-bold text-xs text-[#344054] group-hover:bg-white shadow-xs">
              Play ▶
            </div>
          </button>
        ))}
      </div>

      {/* Kid Safety & Offline Badge */}
      <div className="bg-[#B9E8C5]/30 border-2 border-[#86EFAC] rounded-2xl p-3 flex items-center justify-between text-xs text-[#166534] font-bold">
        <div className="flex items-center gap-2">
          <span>🛡️ 100% Kid Safe</span>
          <span>•</span>
          <span>📶 Offline Ready</span>
          <span>•</span>
          <span>🚫 Zero Ads</span>
        </div>
        <div className="flex items-center gap-1 text-[#15803D]">
          <Heart className="w-4 h-4 fill-pink-400 text-pink-400" />
          <span>Made for Ages 2-8</span>
        </div>
      </div>
    </div>
  );
};
