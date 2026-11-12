import { SavedArtwork, UserStats } from '../types';

const ARTWORK_STORAGE_KEY = 'little_genius_saved_artworks';
const STATS_STORAGE_KEY = 'little_genius_user_stats';

const DEFAULT_STATS: UserStats = {
  stars: 15,
  dailyStreak: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedLessons: ['abc-A', 'abc-B', 'num-1', 'num-2'],
  coloredPagesCount: 3,
  drawingsCount: 1,
  quizHighScore: 5,
  timeSpentMinutes: 24,
  soundEnabled: true,
  voiceEnabled: true,
};

export const StorageService = {
  getUserStats(): UserStats {
    if (typeof window === 'undefined') return DEFAULT_STATS;
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(DEFAULT_STATS));
        return DEFAULT_STATS;
      }
      return { ...DEFAULT_STATS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_STATS;
    }
  },

  saveUserStats(stats: UserStats) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Storage quota or private browsing
    }
  },

  addStars(count: number): number {
    const stats = this.getUserStats();
    stats.stars += count;
    this.saveUserStats(stats);
    return stats.stars;
  },

  markLessonComplete(lessonId: string) {
    const stats = this.getUserStats();
    if (!stats.completedLessons.includes(lessonId)) {
      stats.completedLessons.push(lessonId);
      stats.stars += 3; // Bonus stars for lesson completion!
      this.saveUserStats(stats);
    }
  },

  getArtworks(): SavedArtwork[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(ARTWORK_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveArtwork(artwork: Omit<SavedArtwork, 'id' | 'createdAt'>): SavedArtwork {
    const current = this.getArtworks();
    const newArt: SavedArtwork = {
      ...artwork,
      id: 'art_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
    };
    // Prepend new artwork
    const updated = [newArt, ...current];
    try {
      localStorage.setItem(ARTWORK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // If quota exceeded, trim older drawings
      const trimmed = [newArt, ...current.slice(0, 8)];
      try {
        localStorage.setItem(ARTWORK_STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        // Quota error fallback
      }
    }

    // Increment user stat
    const stats = this.getUserStats();
    if (newArt.type === 'coloring') {
      stats.coloredPagesCount++;
    } else {
      stats.drawingsCount++;
    }
    stats.stars += 5; // Reward 5 stars for saving artwork!
    this.saveUserStats(stats);

    return newArt;
  },

  deleteArtwork(id: string): SavedArtwork[] {
    const current = this.getArtworks();
    const filtered = current.filter(art => art.id !== id);
    try {
      localStorage.setItem(ARTWORK_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Fallback
    }
    return filtered;
  },

  renameArtwork(id: string, newTitle: string): SavedArtwork[] {
    const current = this.getArtworks();
    const updated = current.map(art => (art.id === id ? { ...art, title: newTitle } : art));
    try {
      localStorage.setItem(ARTWORK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Fallback
    }
    return updated;
  },

  resetProgress(): UserStats {
    const reset = { ...DEFAULT_STATS, stars: 5, completedLessons: [], coloredPagesCount: 0, drawingsCount: 0 };
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(reset));
      localStorage.removeItem(ARTWORK_STORAGE_KEY);
    } catch {
      // Fallback
    }
    return reset;
  },
};
