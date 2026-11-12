import React, { useState } from 'react';
import { MINI_GAMES } from '../data/learningContent';
import { MiniGameQuestion } from '../types';
import { SoundEngine } from '../utils/soundEffects';
import { StorageService } from '../utils/storage';
import { Star, Sparkles, Trophy, CheckCircle2, RotateCcw } from 'lucide-react';

interface MiniGamesProps {
  onAddStars: (count: number) => void;
  onTriggerConfetti?: () => void;
}

export const MiniGames: React.FC<MiniGamesProps> = ({ onAddStars, onTriggerConfetti }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answeredState, setAnsweredState] = useState<'idle' | 'correct' | 'try-again'>('idle');
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const question = MINI_GAMES[currentIdx] || MINI_GAMES[0];

  const handleSelect = (option: { id: string; label: string; isCorrect: boolean }) => {
    if (answeredState === 'correct') return;
    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      setAnsweredState('correct');
      setScore(prev => prev + 1);
      SoundEngine.playFanfare();
      onAddStars(2);
      if (onTriggerConfetti) onTriggerConfetti();
      SoundEngine.speak('Awesome! That is correct!');
    } else {
      setAnsweredState('try-again');
      SoundEngine.playStar();
      SoundEngine.speak('Almost there, little star! Try another one!');
    }
  };

  const handleNext = () => {
    SoundEngine.playPop();
    if (currentIdx < MINI_GAMES.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOptionId(null);
      setAnsweredState('idle');
    } else {
      setQuizFinished(true);
      SoundEngine.playFanfare();
      if (onTriggerConfetti) onTriggerConfetti();
      StorageService.markLessonComplete('quiz-completed');
    }
  };

  const handleRestart = () => {
    SoundEngine.playPop();
    setCurrentIdx(0);
    setSelectedOptionId(null);
    setAnsweredState('idle');
    setScore(0);
    setQuizFinished(false);
  };

  if (quizFinished) {
    return (
      <div className="bg-white/90 border-3 border-[#FFE58A] rounded-3xl p-6 text-center max-w-md mx-auto shadow-sm space-y-4 animate-cute-bounce">
        <div className="w-20 h-20 rounded-3xl bg-[#FFE58A] mx-auto flex items-center justify-center text-4xl shadow-inner">
          🏆
        </div>
        <h3 className="text-2xl font-extrabold text-[#344054]">
          Quiz Champion! 🌟
        </h3>
        <p className="text-sm font-semibold text-gray-600">
          You answered all {MINI_GAMES.length} questions and earned gold stars!
        </p>
        <div className="flex justify-center items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-7 h-7 fill-amber-400 text-amber-400 animate-wiggle" />
          ))}
        </div>
        <button
          onClick={handleRestart}
          className="w-full py-3 bg-[#A9D9FF] hover:bg-[#8BC9FF] border-2 border-blue-400 text-blue-900 font-extrabold rounded-2xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Play Quiz Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Progress pill */}
      <div className="flex items-center justify-between bg-white/70 border-2 border-[#FFE58A] rounded-2xl px-4 py-2">
        <div className="flex items-center gap-1.5 font-bold text-xs text-[#344054]">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Question {currentIdx + 1} of {MINI_GAMES.length}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-extrabold text-amber-800 bg-[#FFF0B3] px-2.5 py-1 rounded-full">
          <span>⭐ {score * 2} Stars Earned</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border-3 border-[#FFA0B6] p-5 shadow-sm text-center space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-[#FFB6C8]/40 text-[#881337] text-xs font-bold uppercase tracking-wide">
          {question.type} Mini Game
        </span>

        <h3 className="text-xl sm:text-2xl font-extrabold text-[#344054] leading-snug">
          {question.prompt}
        </h3>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {question.options.map(opt => {
            const isSelected = selectedOptionId === opt.id;
            let btnClass = 'bg-white border-2 border-gray-200 hover:border-amber-300 text-gray-700';

            if (isSelected) {
              if (opt.isCorrect) {
                btnClass = 'bg-[#B9E8C5] border-3 border-[#10B981] text-[#065F46] font-extrabold scale-102';
              } else {
                btnClass = 'bg-amber-50 border-2 border-amber-300 text-amber-800';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all cursor-pointer active:scale-95 shadow-2xs ${btnClass}`}
              >
                <span className="text-4xl mb-2 select-none">{opt.visual}</span>
                <span className="font-extrabold text-sm">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Friendly feedback banner */}
        {answeredState === 'correct' && (
          <div className="bg-[#B9E8C5]/60 border-2 border-[#10B981] text-[#065F46] p-3 rounded-2xl flex items-center justify-center gap-2 font-extrabold text-sm animate-cute-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Yay! Correct! {question.explanation} ⭐ +2</span>
          </div>
        )}

        {answeredState === 'try-again' && (
          <div className="bg-amber-100 border-2 border-amber-300 text-amber-800 p-2.5 rounded-2xl text-xs font-bold">
            Almost! Tap another cute option! You can do it! 🌟
          </div>
        )}

        {/* Next Question CTA */}
        {answeredState === 'correct' && (
          <button
            onClick={handleNext}
            className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <span>Next Fun Question ▶</span>
          </button>
        )}
      </div>
    </div>
  );
};
