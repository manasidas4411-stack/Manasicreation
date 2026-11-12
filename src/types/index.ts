export type ActiveTab = 'home' | 'coloring' | 'drawing' | 'learning' | 'gallery';

export type LearningSubTab = 'abc' | 'numbers' | 'colors-shapes' | 'animals' | 'trace' | 'games';

export interface ColoringPageItem {
  id: string;
  title: string;
  category: 'animals' | 'fruits' | 'vehicles' | 'nature' | 'objects' | 'special';
  difficulty: 'easy' | 'medium';
  svgPaths: string[]; // SVG path strings with closed outlines
  viewBox?: string;
  thumbnailSvg?: string;
  unlockedByDefault?: boolean;
}

export type DrawingToolType = 'fill' | 'brush' | 'pencil' | 'marker' | 'rainbow' | 'stamp' | 'eraser';

export interface SavedArtwork {
  id: string;
  title: string;
  type: 'coloring' | 'drawing';
  dataUrl: string; // PNG base64
  createdAt: number;
  templateId?: string;
}

export interface AbcItem {
  letter: string;
  word: string;
  emoji: string;
  pronunciationPhonetic: string;
  fact: string;
  color: string;
}

export interface NumberItem {
  number: number;
  word: string;
  objectEmoji: string;
  countWord: string;
  color: string;
}

export interface AnimalItem {
  id: string;
  name: string;
  emoji: string;
  soundText: string;
  soundType: 'roar' | 'bark' | 'meow' | 'moo' | 'quack' | 'chirp' | 'trumpet' | 'oink';
  habitat: string;
  diet: string;
  funFact: string;
  color: string;
}

export interface ColorItem {
  name: string;
  hex: string;
  itemExample: string;
  emoji: string;
}

export interface ShapeItem {
  name: string;
  sides: number;
  emoji: string;
  description: string;
  color: string;
}

export interface TracingGuide {
  id: string;
  category: 'uppercase' | 'lowercase' | 'numbers' | 'shapes' | 'lines';
  label: string;
  guidePoints: Array<{ x: number; y: number }>;
  svgPath: string;
  viewBox: string;
}

export interface MiniGameQuestion {
  id: string;
  type: 'color' | 'animal' | 'count' | 'shape' | 'letter';
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    value: string;
    visual: string;
    isCorrect: boolean;
  }>;
  explanation: string;
}

export interface UserStats {
  stars: number;
  dailyStreak: number;
  lastActiveDate: string;
  completedLessons: string[];
  coloredPagesCount: number;
  drawingsCount: number;
  quizHighScore: number;
  timeSpentMinutes: number;
  soundEnabled: boolean;
  voiceEnabled: boolean;
}
