import React, { useState, useRef, useEffect, useCallback } from 'react';
import { COLORING_PAGES, COLORING_CATEGORIES } from '../data/coloringPages';
import { ColoringPageItem, DrawingToolType } from '../types';
import { floodFillImageData, hexToRgba } from '../utils/floodFill';
import { SoundEngine } from '../utils/soundEffects';
import { StorageService } from '../utils/storage';
import {
  PaintBucket,
  Paintbrush,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

interface ColoringStudioProps {
  initialPageId?: string;
  onSaveSuccess?: () => void;
  onTriggerConfetti?: () => void;
}

const PALETTE = [
  '#FF5E57', // Bright Red
  '#FF9FF3', // Pastel Pink
  '#FFA801', // Bright Orange
  '#FFE58A', // Pastel Yellow
  '#FFD32A', // Golden Yellow
  '#05C46B', // Green
  '#B9E8C5', // Mint Pastel Green
  '#3B82F6', // Sky Blue
  '#A9D9FF', // Pastel Sky
  '#8B5CF6', // Purple
  '#D7C5FF', // Lavender
  '#8B4513', // Warm Brown
  '#FFFBF3', // Cream / White
  '#2C3E50', // Charcoal / Black
];

const BRUSH_SIZES = [8, 16, 28, 44];

export const ColoringStudio: React.FC<ColoringStudioProps> = ({
  initialPageId,
  onSaveSuccess,
  onTriggerConfetti,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<DrawingToolType>('fill');
  const [selectedColor, setSelectedColor] = useState<string>('#FF5E57');
  const [brushSize, setBrushSize] = useState<number>(16);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Undo / Redo history
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Canvases
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineArtCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Filtered pages
  const filteredPages = COLORING_PAGES.filter(
    p => selectedCategory === 'all' || p.category === selectedCategory
  );
  const currentPage = filteredPages[activePageIndex] || COLORING_PAGES[0];

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 800;

  // Render line art onto lineArtCanvas
  const renderLineArt = useCallback((page: ColoringPageItem) => {
    const lineCanvas = lineArtCanvasRef.current;
    if (!lineCanvas) return;
    const ctx = lineCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';

    page.svgPaths.forEach(pathStr => {
      try {
        const path2d = new Path2D(pathStr);
        // Scale 500x500 path coordinate space to 800x800 canvas
        ctx.save();
        ctx.scale(CANVAS_WIDTH / 500, CANVAS_HEIGHT / 500);
        ctx.stroke(path2d);
        ctx.restore();
      } catch (e) {
        // Fallback if path parsing fails
      }
    });
  }, []);

  // Composite layers to display canvas
  const updateDisplayCanvas = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    const colorCanvas = colorCanvasRef.current;
    const lineCanvas = lineArtCanvasRef.current;
    if (!displayCanvas || !colorCanvas || !lineCanvas) return;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    // Fill white/cream background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw color layer (filled regions + brush strokes)
    ctx.drawImage(colorCanvas, 0, 0);

    // Draw crisp line art layer on top
    ctx.drawImage(lineCanvas, 0, 0);
  }, []);

  // Save current color buffer to undo stack
  const pushUndo = useCallback(() => {
    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return;
    const ctx = colorCanvas.getContext('2d', { willReadFrequently: true });
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

  // Initialize canvas when page changes
  useEffect(() => {
    const colorCanvas = colorCanvasRef.current;
    const lineCanvas = lineArtCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!colorCanvas || !lineCanvas || !displayCanvas) return;

    colorCanvas.width = CANVAS_WIDTH;
    colorCanvas.height = CANVAS_HEIGHT;
    lineCanvas.width = CANVAS_WIDTH;
    lineCanvas.height = CANVAS_HEIGHT;
    displayCanvas.width = CANVAS_WIDTH;
    displayCanvas.height = CANVAS_HEIGHT;

    // Clear color canvas with transparent background
    const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
    if (colorCtx) {
      colorCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    renderLineArt(currentPage);
    updateDisplayCanvas();

    // Reset stacks
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    pushUndo();
  }, [currentPage, renderLineArt, updateDisplayCanvas, pushUndo]);

  const handleUndo = () => {
    if (undoStackRef.current.length <= 1) return;
    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return;
    const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
    if (!colorCtx) return;

    // Move current state to redo
    const current = undoStackRef.current.pop()!;
    redoStackRef.current.push(current);

    // Restore previous state
    const previous = undoStackRef.current[undoStackRef.current.length - 1];
    colorCtx.putImageData(previous, 0, 0);
    updateDisplayCanvas();

    setCanUndo(undoStackRef.current.length > 1);
    setCanRedo(true);
    SoundEngine.playPop();
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return;
    const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
    if (!colorCtx) return;

    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(next);
    colorCtx.putImageData(next, 0, 0);
    updateDisplayCanvas();

    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    SoundEngine.playPop();
  };

  const handleClear = () => {
    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return;
    const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
    if (!colorCtx) return;

    pushUndo();
    colorCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    updateDisplayCanvas();
    SoundEngine.playWhoosh();
  };

  // Convert pointer event coordinate to internal canvas 800x800 coordinate
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // True flood fill trigger
  const handleFloodFill = (x: number, y: number) => {
    const colorCanvas = colorCanvasRef.current;
    const lineCanvas = lineArtCanvasRef.current;
    if (!colorCanvas || !lineCanvas) return;

    const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
    const lineCtx = lineCanvas.getContext('2d', { willReadFrequently: true });
    if (!colorCtx || !lineCtx) return;

    const colorData = colorCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const lineData = lineCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const rgba = hexToRgba(selectedColor, 255);
    const changed = floodFillImageData(colorData, lineData, x, y, rgba, 40);

    if (changed > 0) {
      colorCtx.putImageData(colorData, 0, 0);
      updateDisplayCanvas();
      pushUndo();
      SoundEngine.playSplash();
    } else {
      SoundEngine.playPop();
    }
  };

  // Pointer interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // In synthetic tests or unsupported devices, setPointerCapture can throw InvalidPointerId
    }

    const { x, y } = getCanvasCoords(e);

    if (activeTool === 'fill') {
      handleFloodFill(x, y);
      return;
    }

    // Freehand Brush or Eraser
    isDrawingRef.current = true;
    lastPointRef.current = { x, y };

    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return;
    const colorCtx = colorCanvas.getContext('2d');
    if (!colorCtx) return;

    colorCtx.save();
    colorCtx.lineWidth = brushSize;
    colorCtx.lineCap = 'round';
    colorCtx.lineJoin = 'round';

    if (activeTool === 'eraser') {
      colorCtx.globalCompositeOperation = 'destination-out';
      colorCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      colorCtx.globalCompositeOperation = 'source-over';
      colorCtx.strokeStyle = selectedColor;
    }

    colorCtx.beginPath();
    colorCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    colorCtx.fill();
    colorCtx.restore();

    updateDisplayCanvas();
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'fill') {
      const canvas = displayCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      handleFloodFill(x, y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const { x, y } = getCanvasCoords(e);

    const colorCanvas = colorCanvasRef.current;
    if (!colorCanvas) return;
    const colorCtx = colorCanvas.getContext('2d');
    if (!colorCtx) return;

    colorCtx.save();
    colorCtx.lineWidth = brushSize;
    colorCtx.lineCap = 'round';
    colorCtx.lineJoin = 'round';

    if (activeTool === 'eraser') {
      colorCtx.globalCompositeOperation = 'destination-out';
      colorCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      colorCtx.globalCompositeOperation = 'source-over';
      colorCtx.strokeStyle = selectedColor;
    }

    colorCtx.beginPath();
    colorCtx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    colorCtx.lineTo(x, y);
    colorCtx.stroke();
    colorCtx.restore();

    lastPointRef.current = { x, y };
    updateDisplayCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      pushUndo();
      SoundEngine.playWhoosh();
    }
  };

  // Save Artwork
  const handleSave = () => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;

    const dataUrl = displayCanvas.toDataURL('image/png');
    StorageService.saveArtwork({
      title: `${currentPage.title} Coloring`,
      type: 'coloring',
      dataUrl,
      templateId: currentPage.id,
    });

    SoundEngine.playFanfare();
    if (onTriggerConfetti) onTriggerConfetti();
    if (onSaveSuccess) onSaveSuccess();

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2400);
  };

  // Share Artwork via Web Share API or PNG Download
  const handleShare = async () => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;

    displayCanvas.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], `${currentPage.id}_colored.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `My Coloring of ${currentPage.title}!`,
            text: 'Check out my masterpiece made with Color & Learn - Little Genius!',
            files: [file],
          });
          return;
        } catch {
          // Fallback to download
        }
      }

      // Download Fallback
      const a = document.createElement('a');
      a.href = displayCanvas.toDataURL('image/png');
      a.download = `ColorAndLearn_${currentPage.id}.png`;
      a.click();
      SoundEngine.playStar();
    });
  };

  return (
    <div className="pb-24 px-3 pt-2 max-w-4xl mx-auto space-y-4">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {COLORING_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              SoundEngine.playPop();
              setSelectedCategory(cat.id);
              setActivePageIndex(0);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-2xs active:scale-95 ${
              selectedCategory === cat.id
                ? 'bg-[#FFB6C8] border-2 border-[#FFA0B6] text-[#344054] scale-102 font-extrabold'
                : 'bg-white/80 border-2 border-amber-100 text-gray-600 hover:bg-white'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Page Carousel Header */}
      <div className="flex items-center justify-between bg-white/70 border-2 border-[#FFE58A] rounded-2xl px-4 py-2 shadow-2xs">
        <button
          onClick={() => {
            SoundEngine.playPop();
            setActivePageIndex(prev => (prev > 0 ? prev - 1 : filteredPages.length - 1));
          }}
          className="p-1.5 rounded-xl bg-[#A9D9FF]/40 hover:bg-[#A9D9FF] border border-[#A9D9FF] text-[#1E3A8A] active:scale-90"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h3 className="font-extrabold text-base sm:text-lg text-[#344054]">
            {currentPage.title}
          </h3>
          <span className="text-xs font-semibold text-gray-500">
            Page {activePageIndex + 1} of {filteredPages.length}
          </span>
        </div>

        <button
          onClick={() => {
            SoundEngine.playPop();
            setActivePageIndex(prev => (prev < filteredPages.length - 1 ? prev + 1 : 0));
          }}
          className="p-1.5 rounded-xl bg-[#A9D9FF]/40 hover:bg-[#A9D9FF] border border-[#A9D9FF] text-[#1E3A8A] active:scale-90"
          aria-label="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Studio Viewport */}
      <div className="relative flex flex-col md:flex-row gap-4 items-center justify-center">
        {/* Hidden Layer Canvases */}
        <canvas ref={colorCanvasRef} className="hidden" />
        <canvas ref={lineArtCanvasRef} className="hidden" />

        {/* Display Canvas Frame */}
        <div className="relative w-full max-w-[500px] aspect-square bg-white rounded-3xl border-4 border-[#FFA0B6] shadow-md overflow-hidden flex items-center justify-center">
          <canvas
            ref={displayCanvasRef}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="drawing-canvas w-full h-full cursor-crosshair touch-none transition-transform"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            }}
          />

          {/* Floating Zoom & Pan Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border-2 border-amber-200 p-1 rounded-2xl shadow-xs">
            <button
              onClick={() => {
                SoundEngine.playPop();
                setZoomLevel(prev => Math.min(prev + 0.3, 2.2));
              }}
              title="Zoom In"
              className="p-1.5 rounded-xl hover:bg-amber-100 text-gray-700 active:scale-90"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                SoundEngine.playPop();
                setZoomLevel(prev => Math.max(prev - 0.3, 1));
                if (zoomLevel <= 1.3) setPanOffset({ x: 0, y: 0 });
              }}
              title="Zoom Out"
              className="p-1.5 rounded-xl hover:bg-amber-100 text-gray-700 active:scale-90"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            {zoomLevel > 1 && (
              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                title="Reset Zoom"
                className="p-1.5 rounded-xl hover:bg-amber-100 text-gray-700 active:scale-90"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Save Toast notification */}
          {showSavedToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#B9E8C5] border-2 border-[#10B981] text-[#065F46] font-extrabold px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 animate-cute-bounce">
              <Check className="w-5 h-5 text-[#059669]" />
              <span>Saved to My Art Gallery! ⭐ +5</span>
            </div>
          )}
        </div>

        {/* Right Tools & Palette Bar */}
        <div className="w-full md:w-64 flex flex-col gap-3">
          {/* Tool Selector */}
          <div className="bg-white/80 border-2 border-[#FFE58A] rounded-2xl p-2.5 shadow-2xs">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Coloring Tool
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Tap to Fill */}
              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setActiveTool('fill');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  activeTool === 'fill'
                    ? 'bg-[#A9D9FF] border-[#3B82F6] font-extrabold shadow-xs text-[#1E3A8A]'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <PaintBucket className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-bold">Bucket Fill</span>
              </button>

              {/* Freehand Brush */}
              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setActiveTool('brush');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  activeTool === 'brush'
                    ? 'bg-[#FFB6C8] border-[#FF5E57] font-extrabold shadow-xs text-[#881337]'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Paintbrush className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-bold">Brush</span>
              </button>

              {/* Eraser */}
              <button
                onClick={() => {
                  SoundEngine.playPop();
                  setActiveTool('eraser');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  activeTool === 'eraser'
                    ? 'bg-[#FFE58A] border-[#F59E0B] font-extrabold shadow-xs text-[#78350F]'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Eraser className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-bold">Eraser</span>
              </button>
            </div>

            {/* Brush Size Picker (for brush & eraser) */}
            {activeTool !== 'fill' && (
              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Size:</span>
                <div className="flex items-center gap-2">
                  {BRUSH_SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        SoundEngine.playPop();
                        setBrushSize(size);
                      }}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        brushSize === size
                          ? 'border-[#3B82F6] bg-blue-50 scale-110 shadow-xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className="rounded-full bg-[#344054]"
                        style={{ width: size / 2.5, height: size / 2.5 }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Color Palette */}
          <div className="bg-white/80 border-2 border-[#FFE58A] rounded-2xl p-2.5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Magic Colors
              </span>
              {/* Custom Color Input */}
              <label className="flex items-center gap-1 cursor-pointer text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                <Sparkles className="w-3 h-3" />
                <span>Custom</span>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  className="opacity-0 w-0 h-0 absolute"
                />
              </label>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {PALETTE.map(colorHex => {
                const isSelected = selectedColor.toLowerCase() === colorHex.toLowerCase();
                return (
                  <button
                    key={colorHex}
                    onClick={() => {
                      SoundEngine.playPop();
                      setSelectedColor(colorHex);
                      if (activeTool === 'eraser') setActiveTool('fill');
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform shadow-xs active:scale-90 ${
                      isSelected
                        ? 'border-gray-900 scale-120 ring-2 ring-amber-300'
                        : 'border-white hover:scale-105'
                    }`}
                    style={{ backgroundColor: colorHex }}
                    title={colorHex}
                  />
                );
              })}
            </div>
          </div>

          {/* Undo, Redo, Clear & Save Actions */}
          <div className="grid grid-cols-4 gap-2">
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
              onClick={handleClear}
              title="Clear Canvas"
              className="p-2.5 rounded-2xl bg-[#FED7AA]/50 hover:bg-[#FED7AA] border-2 border-orange-200 text-orange-800 flex items-center justify-center active:scale-90"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={handleShare}
              title="Share Picture"
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
