import React, { useState } from 'react';
import { LearningSubTab } from '../types';
import {
  ABC_ITEMS,
  NUMBER_ITEMS,
  COLORS_LIST,
  SHAPES_LIST,
  ANIMAL_LIST,
} from '../data/learningContent';
import { SoundEngine } from '../utils/soundEffects';
import { StorageService } from '../utils/storage';
import { TraceAndWrite } from './TraceAndWrite';
import { MiniGames } from './MiniGames';
import {
  Volume2,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Hash,
  Palette,
  PawPrint,
  PenLine,
  Gamepad2,
  Plus,
  Minus,
} from 'lucide-react';

interface LearningHubProps {
  initialSubTab?: LearningSubTab;
  onAddStars: (count: number) => void;
  onTriggerConfetti?: () => void;
}

export const LearningHub: React.FC<LearningHubProps> = ({
  initialSubTab = 'abc',
  onAddStars,
  onTriggerConfetti,
}) => {
  const [subTab, setSubTab] = useState<LearningSubTab>(initialSubTab);
  const [activeAbcIndex, setActiveAbcIndex] = useState(0);
  const [activeNumberIndex, setActiveNumberIndex] = useState(0);
  const [activeAnimalIndex, setActiveAnimalIndex] = useState(0);

  // Number math game state
  const [mathA, setMathA] = useState(2);
  const [mathB, setMathB] = useState(3);
  const [mathOp, setMathOp] = useState<'+' | '-'>('+');
  const [mathAnswer, setMathAnswer] = useState<number | null>(null);

  const subTabs = [
    { id: 'abc' as LearningSubTab, label: 'ABC Phonics', emoji: '🔤', icon: BookOpen, color: '#FFB6C8' },
    { id: 'numbers' as LearningSubTab, label: '123 Numbers', emoji: '🔢', icon: Hash, color: '#A9D9FF' },
    { id: 'colors-shapes' as LearningSubTab, label: 'Colors & Shapes', emoji: '🌈', icon: Palette, color: '#FFE58A' },
    { id: 'animals' as LearningSubTab, label: 'Animal World', emoji: '🦁', icon: PawPrint, color: '#B9E8C5' },
    { id: 'trace' as LearningSubTab, label: 'Trace & Write', emoji: '✍️', icon: PenLine, color: '#D7C5FF' },
    { id: 'games' as LearningSubTab, label: 'Mini Games', emoji: '🧩', icon: Gamepad2, color: '#FED7AA' },
  ];

  const currentAbc = ABC_ITEMS[activeAbcIndex] || ABC_ITEMS[0];
  const currentNum = NUMBER_ITEMS[activeNumberIndex] || NUMBER_ITEMS[0];
  const currentAnimal = ANIMAL_LIST[activeAnimalIndex] || ANIMAL_LIST[0];

  const handleSpeakAbc = (item: typeof currentAbc) => {
    SoundEngine.speak(`${item.letter}. ${item.letter} is for ${item.word}!`);
    StorageService.markLessonComplete(`abc-${item.letter}`);
  };

  const handleSpeakNumber = (item: typeof currentNum) => {
    SoundEngine.speak(`Number ${item.number}. ${item.countWord}!`);
    StorageService.markLessonComplete(`num-${item.number}`);
  };

  const handleMathCheck = (num: number) => {
    const expected = mathOp === '+' ? mathA + mathB : mathA - mathB;
    setMathAnswer(num);

    if (num === expected) {
      SoundEngine.playFanfare();
      onAddStars(2);
      if (onTriggerConfetti) onTriggerConfetti();
      SoundEngine.speak('Correct! You are a little math genius!');
      setTimeout(() => {
        setMathA(Math.floor(Math.random() * 5) + 1);
        setMathB(Math.floor(Math.random() * 4) + 1);
        setMathAnswer(null);
      }, 1800);
    } else {
      SoundEngine.playStar();
      SoundEngine.speak('Try counting the cute apples again!');
    }
  };

  return (
    <div className="pb-24 px-3 pt-2 max-w-4xl mx-auto space-y-5">
      {/* Sub Tabs Pill Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              SoundEngine.playPop();
              setSubTab(tab.id);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-2xs active:scale-95 cursor-pointer ${
              subTab === tab.id
                ? 'border-2 border-gray-800 text-[#344054] scale-102 font-extrabold shadow-xs'
                : 'bg-white/80 border-2 border-amber-100 text-gray-600 hover:bg-white'
            }`}
            style={{
              backgroundColor: subTab === tab.id ? tab.color : undefined,
            }}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* --- SUBTAB: ABC PHONICS --- */}
      {subTab === 'abc' && (
        <div className="space-y-4">
          {/* Main Selected Letter Spotlight */}
          <div
            className="rounded-3xl border-3 border-[#FFA0B6] p-6 shadow-sm text-center relative overflow-hidden transition-all"
            style={{ backgroundColor: currentAbc.color }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* Huge Letter Display */}
              <div className="flex flex-col items-center">
                <span className="text-8xl sm:text-9xl font-black text-white drop-shadow-md select-none tracking-tight">
                  {currentAbc.letter}
                </span>
                <span className="text-2xl font-extrabold text-[#344054] bg-white/80 px-4 py-1 rounded-full shadow-2xs mt-1">
                  {currentAbc.word}
                </span>
              </div>

              {/* Huge Emoji Illustration */}
              <div className="w-36 h-36 rounded-3xl bg-white/90 border-3 border-white flex items-center justify-center text-7xl shadow-md animate-cute-bounce select-none">
                {currentAbc.emoji}
              </div>

              {/* Phonics & Fact Card */}
              <div className="bg-white/90 rounded-2xl p-4 max-w-xs text-left shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-600 uppercase">Phonics Sound</span>
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">
                    /{currentAbc.pronunciationPhonetic}/
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                  💡 {currentAbc.fact}
                </p>
                <button
                  onClick={() => handleSpeakAbc(currentAbc)}
                  className="w-full py-2 bg-[#FF5E57] hover:bg-[#EE5253] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Pronounce & Listen 🔊</span>
                </button>
              </div>
            </div>
          </div>

          {/* Letter Grid Selector A-Z */}
          <div className="bg-white/80 border-2 border-[#FFE58A] rounded-3xl p-4 shadow-2xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3 text-center sm:text-left">
              Select Any Letter (A to Z)
            </span>
            <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-2">
              {ABC_ITEMS.map((item, idx) => (
                <button
                  key={item.letter}
                  onClick={() => {
                    SoundEngine.playPop();
                    setActiveAbcIndex(idx);
                    handleSpeakAbc(item);
                  }}
                  className={`h-11 rounded-2xl font-extrabold text-base flex flex-col items-center justify-center transition-all cursor-pointer active:scale-90 border-2 shadow-2xs ${
                    activeAbcIndex === idx
                      ? 'bg-[#FF5E57] border-white text-white scale-110 shadow-sm'
                      : 'bg-white border-amber-100 text-[#344054] hover:bg-amber-50'
                  }`}
                >
                  <span>{item.letter}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB: NUMBERS & MATH --- */}
      {subTab === 'numbers' && (
        <div className="space-y-4">
          {/* Main Number Card 1-10 */}
          <div
            className="rounded-3xl border-3 border-[#A9D9FF] p-6 shadow-sm text-center relative overflow-hidden"
            style={{ backgroundColor: currentNum.color }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              <div className="flex flex-col items-center">
                <span className="text-8xl sm:text-9xl font-black text-white drop-shadow-md select-none">
                  {currentNum.number}
                </span>
                <span className="text-xl font-extrabold text-[#344054] bg-white/80 px-4 py-1 rounded-full shadow-2xs mt-1">
                  {currentNum.word}
                </span>
              </div>

              {/* Counting Visual Objects */}
              <div className="bg-white/90 rounded-3xl p-4 border-2 border-white max-w-sm shadow-md">
                <span className="text-xs font-bold text-blue-600 uppercase block mb-2">
                  Count the Objects:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2 p-2 min-h-[80px]">
                  {[...Array(currentNum.number)].map((_, i) => (
                    <span
                      key={i}
                      onClick={() => {
                        SoundEngine.playPop();
                        SoundEngine.speak(String(i + 1));
                      }}
                      className="text-3xl sm:text-4xl hover:scale-125 transition-transform cursor-pointer select-none active:scale-90"
                      title={`Tap to count ${i + 1}`}
                    >
                      {currentNum.objectEmoji}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleSpeakNumber(currentNum)}
                  className="w-full mt-2 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Count Aloud 🔊</span>
                </button>
              </div>
            </div>
          </div>

          {/* Number Selector 1 to 10 */}
          <div className="bg-white/80 border-2 border-[#FFE58A] rounded-3xl p-4 shadow-2xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3 text-center sm:text-left">
              Numbers 1 to 10:
            </span>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {NUMBER_ITEMS.map((item, idx) => (
                <button
                  key={item.number}
                  onClick={() => {
                    SoundEngine.playPop();
                    setActiveNumberIndex(idx);
                    handleSpeakNumber(item);
                  }}
                  className={`h-12 rounded-2xl font-black text-lg flex items-center justify-center transition-all cursor-pointer active:scale-90 border-2 shadow-2xs ${
                    activeNumberIndex === idx
                      ? 'bg-[#3B82F6] border-white text-white scale-110 shadow-sm'
                      : 'bg-white border-blue-100 text-[#344054] hover:bg-blue-50'
                  }`}
                >
                  {item.number}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Addition / Subtraction Math Mini-Game */}
          <div className="bg-white rounded-3xl border-3 border-[#86EFAC] p-5 shadow-sm text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase">
                Early Math Fun
              </span>
              <span className="text-xs font-bold text-gray-500">Tap the right number!</span>
            </div>

            <div className="flex items-center justify-center gap-4 text-3xl sm:text-4xl font-extrabold text-[#344054]">
              <div className="flex flex-col items-center">
                <span>{mathA}</span>
                <span className="text-lg">{'🍎'.repeat(mathA)}</span>
              </div>
              <span className="text-emerald-500">{mathOp}</span>
              <div className="flex flex-col items-center">
                <span>{mathB}</span>
                <span className="text-lg">{'🍏'.repeat(mathB)}</span>
              </div>
              <span>=</span>
              <span className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-900 font-extrabold">
                {mathAnswer !== null ? mathAnswer : '?'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              {[mathA + mathB - 1, mathA + mathB, mathA + mathB + 1, mathA + mathB + 2]
                .filter((v, i, a) => a.indexOf(v) === i && v >= 0)
                .sort(() => 0.5 - Math.random())
                .slice(0, 4)
                .map(n => (
                  <button
                    key={n}
                    onClick={() => handleMathCheck(n)}
                    className="w-12 h-12 rounded-2xl bg-white hover:bg-emerald-50 border-2 border-emerald-400 font-black text-xl text-[#065F46] active:scale-90 transition-transform shadow-xs cursor-pointer"
                  >
                    {n}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB: COLORS & SHAPES --- */}
      {subTab === 'colors-shapes' && (
        <div className="space-y-6">
          {/* Colors Section */}
          <div className="bg-white/90 border-2 border-[#FFE58A] rounded-3xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base sm:text-lg text-[#344054] flex items-center gap-1.5">
                <span>Magic Color World</span>
                <span>🎨</span>
              </h3>
              <span className="text-xs font-bold text-gray-500">Tap to hear & see!</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {COLORS_LIST.map(c => (
                <button
                  key={c.name}
                  onClick={() => {
                    SoundEngine.playPop();
                    SoundEngine.speak(`${c.name}! Like a ${c.itemExample}`);
                  }}
                  className="flex flex-col items-center p-3 rounded-2xl border-2 border-gray-100 hover:border-amber-200 bg-white transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white shadow-xs mb-2 flex items-center justify-center text-xl"
                    style={{ backgroundColor: c.hex }}
                  >
                    {c.emoji}
                  </div>
                  <span className="font-extrabold text-sm text-[#344054]">{c.name}</span>
                  <span className="text-[10px] font-semibold text-gray-500">{c.itemExample}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shapes Section */}
          <div className="bg-white/90 border-2 border-[#D7C5FF] rounded-3xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base sm:text-lg text-[#344054] flex items-center gap-1.5">
                <span>Playful Shapes</span>
                <span>🔺</span>
              </h3>
              <span className="text-xs font-bold text-gray-500">8 Geometric Shapes</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SHAPES_LIST.map(s => (
                <button
                  key={s.name}
                  onClick={() => {
                    SoundEngine.playPop();
                    SoundEngine.speak(`${s.name}. ${s.description}`);
                  }}
                  className="flex flex-col items-center p-4 rounded-3xl border-2 border-purple-100 hover:border-purple-300 bg-white transition-all cursor-pointer active:scale-95 shadow-2xs text-center"
                >
                  <span className="text-4xl mb-2 select-none">{s.emoji}</span>
                  <span className="font-extrabold text-base text-[#344054]">{s.name}</span>
                  <span className="text-[11px] font-semibold text-gray-500 mt-1 line-clamp-2">
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB: ANIMAL WORLD --- */}
      {subTab === 'animals' && (
        <div className="space-y-4">
          {/* Main Animal Card */}
          <div
            className="rounded-3xl border-3 border-[#F472B6] p-6 shadow-sm text-center relative overflow-hidden"
            style={{ backgroundColor: currentAnimal.color }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              <div className="w-36 h-36 rounded-3xl bg-white/90 border-3 border-white flex items-center justify-center text-7xl shadow-md animate-cute-bounce select-none">
                {currentAnimal.emoji}
              </div>

              <div className="bg-white/90 rounded-2xl p-4 max-w-sm text-left shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-[#344054]">{currentAnimal.name}</h3>
                  <span className="text-xs font-extrabold text-pink-600 bg-pink-100 px-3 py-1 rounded-full">
                    Sound: {currentAnimal.soundText}
                  </span>
                </div>
                <div className="text-xs text-gray-700 space-y-1">
                  <p><strong>🏡 Habitat:</strong> {currentAnimal.habitat}</p>
                  <p><strong>🍽️ Diet:</strong> {currentAnimal.diet}</p>
                  <p><strong>💡 Fun Fact:</strong> {currentAnimal.funFact}</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      SoundEngine.playAnimalSound(currentAnimal.soundType);
                      SoundEngine.speak(`${currentAnimal.name} says ${currentAnimal.soundText}`);
                      StorageService.markLessonComplete(`animal-${currentAnimal.id}`);
                    }}
                    className="flex-1 py-2 bg-[#FF5E57] hover:bg-[#EE5253] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Hear Sound 🔊</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Animals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ANIMAL_LIST.map((anim, idx) => (
              <button
                key={anim.id}
                onClick={() => {
                  SoundEngine.playPop();
                  setActiveAnimalIndex(idx);
                  SoundEngine.playAnimalSound(anim.soundType);
                }}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 flex items-center gap-3 ${
                  activeAnimalIndex === idx
                    ? 'bg-[#FFD1DC] border-[#F472B6] font-extrabold shadow-xs'
                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-3xl select-none">{anim.emoji}</span>
                <div className="text-left">
                  <h4 className="font-extrabold text-sm">{anim.name}</h4>
                  <span className="text-[10px] text-gray-500 font-bold">{anim.soundText}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB: TRACE AND WRITE --- */}
      {subTab === 'trace' && (
        <TraceAndWrite
          onAddStars={onAddStars}
          onTriggerConfetti={onTriggerConfetti}
        />
      )}

      {/* --- SUBTAB: MINI GAMES & QUIZ --- */}
      {subTab === 'games' && (
        <MiniGames
          onAddStars={onAddStars}
          onTriggerConfetti={onTriggerConfetti}
        />
      )}
    </div>
  );
};
