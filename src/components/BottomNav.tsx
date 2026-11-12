import React from 'react';
import { Home, Palette, PenTool, BookOpen, Image } from 'lucide-react';
import { ActiveTab } from '../types';
import { SoundEngine } from '../utils/soundEffects';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  artCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, artCount }) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home, emoji: '🏠', color: '#FFB6C8' },
    { id: 'coloring' as ActiveTab, label: 'Coloring', icon: Palette, emoji: '🎨', color: '#A9D9FF' },
    { id: 'drawing' as ActiveTab, label: 'Drawing', icon: PenTool, emoji: '✏️', color: '#FFE58A' },
    { id: 'learning' as ActiveTab, label: 'Learn', icon: BookOpen, emoji: '📚', color: '#B9E8C5' },
    { id: 'gallery' as ActiveTab, label: 'My Art', icon: Image, emoji: '🖼️', color: '#D7C5FF', badge: artCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFBF3]/95 backdrop-blur-md border-t-2 border-[#FFE58A] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-2 py-1.5 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                SoundEngine.playPop();
                onTabChange(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 min-w-[64px] min-h-[54px] active:scale-95 ${
                isActive ? 'scale-105 shadow-xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isActive ? tab.color : 'transparent',
              }}
            >
              <span className={`text-2xl transition-transform ${isActive ? 'animate-cute-bounce' : ''}`}>
                {tab.emoji}
              </span>
              <span className={`text-xs font-bold mt-0.5 tracking-tight ${isActive ? 'text-[#344054]' : 'text-gray-500'}`}>
                {tab.label}
              </span>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF5E57] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
