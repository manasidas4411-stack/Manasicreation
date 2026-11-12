import React, { useState } from 'react';
import { SavedArtwork, ActiveTab } from '../types';
import { StorageService } from '../utils/storage';
import { SoundEngine } from '../utils/soundEffects';
import {
  Download,
  Share2,
  Trash2,
  Edit2,
  Eye,
  X,
  Palette,
  Sparkles,
  Check,
} from 'lucide-react';

interface ArtGalleryProps {
  artworks: SavedArtwork[];
  onArtworksUpdated: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const ArtGallery: React.FC<ArtGalleryProps> = ({
  artworks,
  onArtworksUpdated,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'all' | 'coloring' | 'drawing'>('all');
  const [previewArt, setPreviewArt] = useState<SavedArtwork | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = artworks.filter(art => filter === 'all' || art.type === filter);

  const handleDownload = (art: SavedArtwork) => {
    const a = document.createElement('a');
    a.href = art.dataUrl;
    a.download = `${art.title.replace(/\s+/g, '_')}.png`;
    a.click();
    SoundEngine.playStar();
  };

  const handleShare = async (art: SavedArtwork) => {
    try {
      const res = await fetch(art.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${art.title}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: art.title,
          text: 'Look at my artwork from Color & Learn - Little Genius!',
          files: [file],
        });
        return;
      }
    } catch {
      // Fallback
    }
    handleDownload(art);
  };

  const handleDelete = (id: string) => {
    StorageService.deleteArtwork(id);
    onArtworksUpdated();
    setDeleteConfirmId(null);
    if (previewArt?.id === id) setPreviewArt(null);
    SoundEngine.playWhoosh();
  };

  const handleSaveRename = (id: string) => {
    if (!renameText.trim()) return;
    StorageService.renameArtwork(id, renameText.trim());
    onArtworksUpdated();
    setEditingId(null);
    setRenameText('');
    SoundEngine.playPop();
  };

  return (
    <div className="pb-24 px-3 pt-2 max-w-4xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white/70 border-2 border-[#D7C5FF] rounded-2xl px-4 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🖼️</span>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-[#344054]">
              My Art Gallery
            </h2>
            <p className="text-xs font-semibold text-gray-500">
              {artworks.length} Masterpiece{artworks.length === 1 ? '' : 's'} Created!
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {(['all', 'coloring', 'drawing'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                SoundEngine.playPop();
                setFilter(tab);
              }}
              className={`px-3 py-1 rounded-xl font-bold text-xs capitalize transition-all active:scale-95 ${
                filter === tab
                  ? 'bg-[#D7C5FF] text-[#4C1D95] border-2 border-[#8B5CF6] font-extrabold'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'coloring' ? 'Coloring' : 'Doodles'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="bg-white/90 border-3 border-dashed border-[#FFE58A] rounded-3xl p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-[#FFE58A] mx-auto flex items-center justify-center text-4xl shadow-inner animate-cute-bounce">
            🎨
          </div>
          <h3 className="text-xl font-extrabold text-[#344054]">
            Your Gallery is Waiting for Art!
          </h3>
          <p className="text-sm font-semibold text-gray-500 max-w-sm mx-auto">
            Choose a coloring page or open the free drawing canvas to create your first masterpiece!
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('coloring')}
              className="px-5 py-2.5 bg-[#FFB6C8] hover:bg-[#FFA0B6] border-2 border-pink-400 font-extrabold text-xs sm:text-sm text-pink-950 rounded-2xl active:scale-95 shadow-xs cursor-pointer"
            >
              Start Coloring 🎨
            </button>
            <button
              onClick={() => onNavigate('drawing')}
              className="px-5 py-2.5 bg-[#A9D9FF] hover:bg-[#8BC9FF] border-2 border-blue-400 font-extrabold text-xs sm:text-sm text-blue-950 rounded-2xl active:scale-95 shadow-xs cursor-pointer"
            >
              Free Drawing ✏️
            </button>
          </div>
        </div>
      )}

      {/* Artwork Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map(art => (
          <div
            key={art.id}
            className="group relative bg-white rounded-3xl border-3 border-[#FFE58A] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
          >
            {/* Thumbnail Canvas View */}
            <div
              onClick={() => {
                SoundEngine.playPop();
                setPreviewArt(art);
              }}
              className="relative aspect-square w-full bg-[#FFFBF3] cursor-pointer overflow-hidden border-b-2 border-amber-100 flex items-center justify-center"
            >
              <img
                src={art.dataUrl}
                alt={art.title}
                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
              />
              <span className="absolute top-2 left-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/80 text-gray-700 shadow-2xs">
                {art.type === 'coloring' ? '🎨 Coloring' : '✏️ Drawing'}
              </span>
            </div>

            {/* Title & Actions */}
            <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
              {editingId === art.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={renameText}
                    onChange={e => setRenameText(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-purple-300 rounded-lg focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveRename(art.id)}
                    className="p-1 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#344054] truncate">
                    {art.title}
                  </h4>
                  <button
                    onClick={() => {
                      setEditingId(art.id);
                      setRenameText(art.title);
                    }}
                    className="text-gray-400 hover:text-gray-700 p-1"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-100">
                <button
                  onClick={() => handleDownload(art)}
                  className="p-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 active:scale-90"
                  title="Download PNG"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare(art)}
                  className="p-1.5 rounded-xl bg-[#D7C5FF]/50 hover:bg-[#D7C5FF] text-purple-800 active:scale-90"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(art.id)}
                  className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 active:scale-90"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inline Delete Confirmation */}
            {deleteConfirmId === art.id && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs p-4 flex flex-col items-center justify-center text-center z-10 animate-cute-bounce">
                <p className="text-xs font-bold text-gray-800 mb-2">Delete this drawing?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(art.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-xl text-xs font-bold active:scale-90"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold active:scale-90"
                  >
                    Keep it
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Preview Modal */}
      {previewArt && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-base text-[#344054]">
                {previewArt.title}
              </h3>
              <button
                onClick={() => setPreviewArt(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 active:scale-90"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="bg-[#FFFBF3] rounded-2xl p-2 border-2 border-amber-100 max-h-[60vh] flex items-center justify-center">
              <img
                src={previewArt.dataUrl}
                alt={previewArt.title}
                className="max-h-[55vh] object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => handleDownload(previewArt)}
                className="flex-1 py-2.5 bg-[#A9D9FF] hover:bg-[#8BC9FF] border border-blue-400 font-extrabold text-xs text-blue-900 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={() => handleShare(previewArt)}
                className="flex-1 py-2.5 bg-[#D7C5FF] hover:bg-[#C084FC] border border-purple-400 font-extrabold text-xs text-purple-900 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
