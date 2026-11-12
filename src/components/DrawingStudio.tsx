import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DrawingToolType } from '../types';
import { SoundEngine } from '../utils/soundEffects';
import { StorageService } from '../utils/storage';
import {
  PenTool,
  Paintbrush,
  Pencil,
  Highlighter,
  Eraser,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Share2,
  Check,
  Stamp,
} from 'lucide-react';

interface DrawingStudioProps {
  onSaveSuccess?: () => void;
  onTriggerConfetti?: () => void;
}

const PALETTE = [
  '#FF5E57', // Red
  '#FF9FF3', // Pink
  '#FFA801', // Orange
  '#FFE58A', // Yellow
  '#FFD32A', // Gold
  '#05C46B', // Green
  '#B9E8C5', // Mint
  '#3B82F6', // Blue
  '#A9D9FF', // Pastel Blue
  '#8B5CF6', // Purple
  '#D7C5FF', // Lavender
  '#8B4513', // Brown
  '#2C3E50', // Black
  '#FFFFFF', // White
];

const STAMPS = ['⭐', '❤️', '🌸', '🐾', '🌈', '🍦', '🐥', '👑'];

export const DrawingStudio: React.FC<DrawingStudioProps> = ({
  onSaveSuccess,
  onTriggerConfetti,
}) => {
  const [tool, setTool] = useState<DrawingToolType>('brush');
  const [color, setColor] = useState<string>('#3B82F6');
  const [brushSize, setBrushSize] = useState<number>(14);
  const [selectedStamp, setSelectedStamp] = useState<string>('⭐');
  const [canvasBg, setCanvasBg] = useState<'white' | 'cream' | 'grid' | 'night'>('white');
  const [showSavedToast, setShowSavedToast] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const rainbowHueRef = useRef<number>(0);

  // Undo / Redo history
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 800;

  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    undoStackRef.current.push(data);
    if (undoStackRef.current.length > 20) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Fill white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    pushUndo();
  }, [pushUndo]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // In synthetic tests or unsupported devices
    }
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'stamp') {
      ctx.save();
      ctx.font = `${brushSize * 3.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedStamp, x, y);
      ctx.restore();
      pushUndo();
      SoundEngine.playPop();
      return;
    }

    isDrawingRef.current = true;
    lastPointRef.current = { x, y };

    ctx.save();
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
    } else if (tool === 'rainbow') {
      ctx.strokeStyle = `hsl(${rainbowHueRef.current}, 90%, 55%)`;
    } else if (tool === 'pencil') {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, brushSize / 3);
    } else if (tool === 'marker') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize * 1.5;
      ctx.lineCap = 'square';
    } else {
      ctx.strokeStyle = color;
    }

    ctx.beginPath();
    ctx.arc(x, y, (ctx.lineWidth || brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
    } else if (tool === 'rainbow') {
      rainbowHueRef.current = (rainbowHueRef.current + 8) % 360;
      ctx.strokeStyle = `hsl(${rainbowHueRef.current}, 90%, 55%)`;
    } else if (tool === 'pencil') {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, brushSize / 3);
    } else if (tool === 'marker') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize * 1.5;
      ctx.lineCap = 'square';
    } else {
      ctx.strokeStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      pushUndo();
      SoundEngine.playWhoosh();
    }
  };

  const handleUndo = () => {
    if (undoStackRef.current.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const current = undoStackRef.current.pop()!;
    redoStackRef.current.push(current);

    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);

    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(true);
    SoundEngine.playPop();
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(next);
    ctx.putImageData(next, 0, 0);

    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    SoundEngine.playPop();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushUndo();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pushUndo();
    SoundEngine.playWhoosh();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    StorageService.saveArtwork({
      title: 'Little Genius Drawing',
      type: 'drawing',
      dataUrl,
    });

    SoundEngine.playFanfare();
    if (onTriggerConfetti) onTriggerConfetti();
    if (onSaveSuccess) onSaveSuccess();

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2400);
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], `my_drawing.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'My Free Drawing!',
            text: 'Look what I created with Color & Learn - Little Genius!',
            files: [file],
          });
          return;
        } catch {
          // Fallback to download
        }
      }

      // Download Fallback
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `LittleGenius_Drawing.png`;
      a.click();
      SoundEngine.playStar();
    });
  };

  return (
    <div className="pb-24 px-3 pt-2 max-w-4xl mx-auto space-y-4">
      {/* Top Title Banner */}
      <div className="flex items-center justify-between bg-white/70 border-2 border-[#FFE58A] rounded-2xl px-4 py-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-[#344054]">
              Free Drawing Studio
            </h2>
            <p className="text-xs font-semibold text-gray-500">
              Paint, doodle, stamp & create anything you imagine!
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="flex items-center gap-1 bg-[#FED7AA]/50 hover:bg-[#FED7AA] border-2 border-orange-200 text-orange-900 px-3 py-1.5 rounded-xl font-bold text-xs active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>

      {/* Main Studio Viewport */}
      <div className="relative flex flex-col md:flex-row gap-4 items-center justify-center">
        {/* Drawing Canvas Frame */}
        <div className="relative w-full max-w-[500px] aspect-square bg-white rounded-3xl border-4 border-[#A9D9FF] shadow-md overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="drawing-canvas w-full h-full cursor-crosshair touch-none"
          />

          {/* Toast Notification */}
          {showSavedToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#B9E8C5] border-2 border-[#10B981] text-[#065F46] font-extrabold px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 animate-cute-bounce">
              <Check className="w-5 h-5 text-[#059669]" />
              <span>Saved to My Art Gallery! ⭐ +5</span>
            </div>
          )}
        </div>

        {/* Right Tools Dock */}
        <div className="w-full md:w-64 flex flex-col gap-3">
          {/* Tool Selector */}
          <div className="bg-white/80 border-2 border-[#FFE58A] rounded-2xl p-2.5 shadow-2xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Drawing Tool
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setTool('brush');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  tool === 'brush'
                    ? 'bg-[#FFB6C8] border-[#FF5E57] text-[#881337] font-extrabold shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Paintbrush className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-bold">Brush</span>
              </button>

              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setTool('pencil');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  tool === 'pencil'
                    ? 'bg-[#FFE58A] border-[#F59E0B] text-[#78350F] font-extrabold shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Pencil className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-bold">Pencil</span>
              </button>

              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setTool('marker');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  tool === 'marker'
                    ? 'bg-[#B9E8C5] border-[#10B981] text-[#065F46] font-extrabold shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Highlighter className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-bold">Marker</span>
              </button>

              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setTool('rainbow');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  tool === 'rainbow'
                    ? 'bg-linear-to-r from-pink-200 via-yellow-200 to-blue-200 border-purple-400 font-extrabold shadow-xs text-purple-900'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-5 h-5 mb-0.5 text-purple-600" />
                <span className="text-xs font-bold">Rainbow</span>
              </button>

              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setTool('stamp');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  tool === 'stamp'
                    ? 'bg-[#D7C5FF] border-[#8B5CF6] text-[#4C1D95] font-extrabold shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Stamp className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-bold">Stamp</span>
              </button>

              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setTool('eraser');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  tool === 'eraser'
                    ? 'bg-gray-200 border-gray-400 font-extrabold shadow-xs text-gray-800'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Eraser className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-bold">Eraser</span>
              </button>
            </div>

            {/* Stamp Tray if stamp tool active */}
            {tool === 'stamp' && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-500 mb-1.5 block">Pick Stamp:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {STAMPS.map(stamp => (
                    <button
                      key={stamp}
                      onClick={() => {
                        SoundEngine.playPop();
                        setSelectedStamp(stamp);
                      }}
                      className={`h-9 rounded-xl border-2 text-xl flex items-center justify-center active:scale-90 ${
                        selectedStamp === stamp
                          ? 'border-purple-500 bg-purple-50 scale-105'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {stamp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Thickness Slider */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Thickness:</span>
              <input
                type="range"
                min="4"
                max="40"
                value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                className="w-32 accent-[#FF5E57] cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-700 tabular-nums">{brushSize}px</span>
            </div>
          </div>

          {/* Color Palette (disabled for rainbow and eraser) */}
          {tool !== 'rainbow' && tool !== 'eraser' && tool !== 'stamp' && (
            <div className="bg-white/80 border-2 border-[#FFE58A] rounded-2xl p-2.5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Colors
                </span>
                <label className="flex items-center gap-1 cursor-pointer text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  <Sparkles className="w-3 h-3" />
                  <span>Custom</span>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="opacity-0 w-0 h-0 absolute"
                  />
                </label>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {PALETTE.map(c => {
                  const isSelected = color.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      onClick={() => {
                        SoundEngine.playPop();
                        setColor(c);
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform shadow-xs active:scale-90 ${
                        isSelected
                          ? 'border-gray-900 scale-120 ring-2 ring-amber-300'
                          : 'border-white hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Undo, Redo, Share */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo"
              className={`p-2.5 rounded-2xl border-2 flex items-center justify-center transition-all ${
                canUndo
                  ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 active:scale-90'
                  : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-5 h-5" />
            </button>

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo"
              className={`p-2.5 rounded-2xl border-2 flex items-center justify-center transition-all ${
                canRedo
                  ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 active:scale-90'
                  : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-5 h-5" />
            </button>

            <button
              onClick={handleShare}
              title="Share Drawing"
              className="p-2.5 rounded-2xl bg-[#D7C5FF]/50 hover:bg-[#D7C5FF] border-2 border-purple-200 text-purple-800 flex items-center justify-center active:scale-90"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 bg-[#B9E8C5] hover:bg-[#86EFAC] border-3 border-[#10B981] text-[#065F46] font-extrabold text-sm sm:text-base rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>Save to My Art Gallery ⭐</span>
          </button>
        </div>
      </div>
    </div>
  );
};
