import React, { useState, useRef, useEffect } from 'react';
import { TRACING_GUIDES } from '../data/learningContent';
import { TracingGuide } from '../types';
import { calculateTracingScore, Point } from '../utils/tracing';
import { SoundEngine } from '../utils/soundEffects';
import { StorageService } from '../utils/storage';
import { RotateCcw, Sparkles, Star, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface TraceAndWriteProps {
  onTriggerConfetti?: () => void;
  onAddStars: (count: number) => void;
}

export const TraceAndWrite: React.FC<TraceAndWriteProps> = ({
  onTriggerConfetti,
  onAddStars,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'uppercase' | 'numbers' | 'shapes'>('uppercase');
  const [guideIndex, setGuideIndex] = useState(0);

  const filteredGuides = TRACING_GUIDES.filter(
    g => g.category === selectedCategory || (selectedCategory === 'uppercase' && g.category === 'uppercase')
  );
  const currentGuide = filteredGuides[guideIndex] || TRACING_GUIDES[0];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const userStrokesRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);

  const [feedback, setFeedback] = useState<{
    show: boolean;
    accuracy: number;
    stars: number;
    message: string;
  } | null>(null);

  const CANVAS_SIZE = 400;

  // Draw the dotted template on canvas
  const drawGuideTemplate = (ctx: CanvasRenderingContext2D, guide: TracingGuide) => {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Warm white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Subtle lined paper background (notebook guide lines)
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 80);
    ctx.lineTo(CANVAS_SIZE - 30, 80);
    ctx.moveTo(30, CANVAS_SIZE - 80);
    ctx.lineTo(CANVAS_SIZE - 30, CANVAS_SIZE - 80);
    ctx.stroke();

    // Dotted mid line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.moveTo(30, CANVAS_SIZE / 2);
    ctx.lineTo(CANVAS_SIZE - 30, CANVAS_SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw the dotted guide path
    ctx.save();
    ctx.scale(CANVAS_SIZE / 100, CANVAS_SIZE / 100);
    try {
      const path = new Path2D(guide.svgPath);
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#E2E8F0'; // Thick soft background guide
      ctx.stroke(path);

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#94A3B8';
      ctx.setLineDash([6, 8]); // Dotted center guide line
      ctx.stroke(path);
      ctx.setLineDash([]);
    } catch {
      // Fallback if SVG parsing fails
    }

    // Draw numbered guide circles
    guide.guidePoints.forEach((pt, idx) => {
      ctx.fillStyle = idx === 0 ? '#10B981' : '#3B82F6';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Number circle
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), pt.x, pt.y);
    });

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    userStrokesRef.current = [];
    setFeedback(null);
    drawGuideTemplate(ctx, currentGuide);
  }, [currentGuide]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = CANVAS_SIZE / rect.width;

    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    userStrokesRef.current.push({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#FF5E57'; // Bright red tracing pen
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FF5E57';
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = CANVAS_SIZE / rect.width;

    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    const last = userStrokesRef.current[userStrokesRef.current.length - 1];
    userStrokesRef.current.push({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx || !last) return;

    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#FF5E57';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // Convert guide points to canvas coordinate scale
    const scaledGuidePoints = currentGuide.guidePoints.map(p => ({
      x: (p.x / 100) * CANVAS_SIZE,
      y: (p.y / 100) * CANVAS_SIZE,
    }));

    const result = calculateTracingScore(userStrokesRef.current, scaledGuidePoints, 48);

    if (result.completed) {
      SoundEngine.playFanfare();
      onAddStars(result.stars);
      if (onTriggerConfetti) onTriggerConfetti();
      StorageService.markLessonComplete(`trace-${currentGuide.id}`);
      SoundEngine.speak('Wonderful tracing! You earned stars!');

      setFeedback({
        show: true,
        accuracy: result.accuracy,
        stars: result.stars,
        message: result.stars === 3 ? 'Incredible! Perfect Tracing! 🌟' : 'Super Job, Little Artist! ⭐',
      });
    } else if (userStrokesRef.current.length > 10) {
      SoundEngine.playStar();
      setFeedback({
        show: true,
        accuracy: result.accuracy,
        stars: 1,
        message: 'Good try! Follow the dotted lines from 1 to 2! ✨',
      });
    }
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    userStrokesRef.current = [];
    setFeedback(null);
    drawGuideTemplate(ctx, currentGuide);
    SoundEngine.playWhoosh();
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Category selector */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => {
            SoundEngine.playPop();
            setSelectedCategory('uppercase');
            setGuideIndex(0);
          }}
          className={`px-4 py-1.5 rounded-2xl font-bold text-xs sm:text-sm active:scale-95 ${
            selectedCategory === 'uppercase'
              ? 'bg-[#FFB6C8] border-2 border-[#FFA0B6] text-[#344054]'
              : 'bg-white border-2 border-gray-200 text-gray-600'
          }`}
        >
          🔤 Letters
        </button>
        <button
          onClick={() => {
            SoundEngine.playPop();
            setSelectedCategory('numbers');
            setGuideIndex(0);
          }}
          className={`px-4 py-1.5 rounded-2xl font-bold text-xs sm:text-sm active:scale-95 ${
            selectedCategory === 'numbers'
              ? 'bg-[#A9D9FF] border-2 border-[#8BC9FF] text-[#344054]'
              : 'bg-white border-2 border-gray-200 text-gray-600'
          }`}
        >
          🔢 Numbers
        </button>
        <button
          onClick={() => {
            SoundEngine.playPop();
            setSelectedCategory('shapes');
            setGuideIndex(0);
          }}
          className={`px-4 py-1.5 rounded-2xl font-bold text-xs sm:text-sm active:scale-95 ${
            selectedCategory === 'shapes'
              ? 'bg-[#FFE58A] border-2 border-[#FFD32A] text-[#344054]'
              : 'bg-white border-2 border-gray-200 text-gray-600'
          }`}
        >
          ⭐ Shapes
        </button>
      </div>

      {/* Guide selector header */}
      <div className="flex items-center justify-between bg-white/80 border-2 border-[#FFE58A] rounded-2xl px-4 py-2">
        <button
          onClick={() => {
            SoundEngine.playPop();
            setGuideIndex(prev => (prev > 0 ? prev - 1 : filteredGuides.length - 1));
          }}
          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-90"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
            Trace Activity
          </span>
          <h3 className="font-extrabold text-lg text-[#344054]">{currentGuide.label}</h3>
        </div>

        <button
          onClick={() => {
            SoundEngine.playPop();
            setGuideIndex(prev => (prev < filteredGuides.length - 1 ? prev + 1 : 0));
          }}
          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-90"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Canvas container */}
      <div className="relative w-full max-w-[380px] aspect-square mx-auto bg-white rounded-3xl border-4 border-[#38BDF8] shadow-md overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="drawing-canvas w-full h-full cursor-crosshair touch-none"
        />

        {/* Feedback card overlay */}
        {feedback && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-cute-bounce">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < feedback.stars
                      ? 'fill-amber-400 text-amber-400 animate-wiggle'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <h4 className="text-xl font-extrabold text-[#344054] mb-1">
              {feedback.message}
            </h4>
            <p className="text-xs font-bold text-gray-500 mb-4">
              Accuracy: {feedback.accuracy}%
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-xs text-gray-700 active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setGuideIndex(prev => (prev < filteredGuides.length - 1 ? prev + 1 : 0));
                }}
                className="px-5 py-2 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                <span>Next Letter ▶</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border-2 border-gray-200 font-bold text-xs text-gray-700 shadow-2xs hover:bg-gray-50 active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-gray-500" />
          <span>Clear & Practice Again</span>
        </button>

        <button
          onClick={() => {
            SoundEngine.speak(currentGuide.label);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#D7C5FF]/50 border-2 border-[#8B5CF6] font-bold text-xs text-purple-900 shadow-2xs hover:bg-[#D7C5FF] active:scale-95"
        >
          <span>Listen 🔊</span>
        </button>
      </div>
    </div>
  );
};
