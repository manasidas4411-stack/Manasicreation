/**
 * Color & Learn – Little Genius
 * Production-Quality Educational Coloring, Drawing, and Early Learning Application
 * Designed for Children Aged 2–8 Years.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, LearningSubTab, SavedArtwork, UserStats } from './types';
import { StorageService } from './utils/storage';
import { SoundEngine } from './utils/soundEffects';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ColoringStudio } from './components/ColoringStudio';
import { DrawingStudio } from './components/DrawingStudio';
import { LearningHub } from './components/LearningHub';
import { ArtGallery } from './components/ArtGallery';
import { ParentDashboard } from './components/ParentDashboard';
import { Confetti } from './components/Confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [learningSubTab, setLearningSubTab] = useState<LearningSubTab>('abc');
  const [userStats, setUserStats] = useState<UserStats>(() => StorageService.getUserStats());
  const [artworks, setArtworks] = useState<SavedArtwork[]>(() => StorageService.getArtworks());
  const [showParentModal, setShowParentModal] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Sync stats when needed
  const refreshStats = useCallback(() => {
    setUserStats(StorageService.getUserStats());
  }, []);

  const refreshArtworks = useCallback(() => {
    setArtworks(StorageService.getArtworks());
    refreshStats();
  }, [refreshStats]);

  const handleAddStars = useCallback((count: number) => {
    const newTotal = StorageService.addStars(count);
    setUserStats(prev => ({ ...prev, stars: newTotal }));
  }, []);

  const triggerConfetti = useCallback(() => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 2500);
  }, []);

  const handleToggleSound = () => {
    const next = SoundEngine.toggleSound();
    const updated = { ...userStats, soundEnabled: next };
    StorageService.saveUserStats(updated);
    setUserStats(updated);
  };

  const handleNavigate = (tab: ActiveTab, subTab?: LearningSubTab) => {
    setActiveTab(tab);
    if (subTab) {
      setLearningSubTab(subTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Seed sample artwork if empty so child/parent can see gallery functionality immediately
  useEffect(() => {
    const existing = StorageService.getArtworks();
    if (existing.length === 0) {
      // Create a starter colored page canvas
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFBF3';
        ctx.fillRect(0, 0, 400, 400);

        // Sun & Rainbow demo
        ctx.fillStyle = '#FFE58A';
        ctx.beginPath();
        ctx.arc(200, 200, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#344054';
        ctx.stroke();

        // Smile
        ctx.beginPath();
        ctx.arc(200, 200, 40, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#344054';
        ctx.beginPath();
        ctx.arc(175, 185, 8, 0, Math.PI * 2);
        ctx.arc(225, 185, 8, 0, Math.PI * 2);
        ctx.fill();

        StorageService.saveArtwork({
          title: 'Smiling Sun Drawing',
          type: 'drawing',
          dataUrl: canvas.toDataURL('image/png'),
        });
        refreshArtworks();
      }
    }
  }, [refreshArtworks]);

  return (
    <div className="min-h-screen bg-[#FFFBF3] text-[#344054] flex flex-col selection:bg-pink-200">
      {/* Top Application Header */}
      <Header
        stars={userStats.stars}
        soundEnabled={userStats.soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenParentGate={() => setShowParentModal(true)}
      />

      {/* Main Screen Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-2">
        {activeTab === 'home' && (
          <HomeScreen
            onNavigate={handleNavigate}
            stars={userStats.stars}
            onAddStars={handleAddStars}
            onTriggerConfetti={triggerConfetti}
          />
        )}

        {activeTab === 'coloring' && (
          <ColoringStudio
            onSaveSuccess={refreshArtworks}
            onTriggerConfetti={triggerConfetti}
          />
        )}

        {activeTab === 'drawing' && (
          <DrawingStudio
            onSaveSuccess={refreshArtworks}
            onTriggerConfetti={triggerConfetti}
          />
        )}

        {activeTab === 'learning' && (
          <LearningHub
            initialSubTab={learningSubTab}
            onAddStars={handleAddStars}
            onTriggerConfetti={triggerConfetti}
          />
        )}

        {activeTab === 'gallery' && (
          <ArtGallery
            artworks={artworks}
            onArtworksUpdated={refreshArtworks}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Bottom Android Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={tab => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        artCount={artworks.length}
      />

      {/* Confetti Particle Burst */}
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* Parent Dashboard Gate Modal */}
      {showParentModal && (
        <ParentDashboard
          stats={userStats}
          onStatsUpdated={refreshStats}
          onClose={() => setShowParentModal(false)}
        />
      )}
    </div>
  );
}
