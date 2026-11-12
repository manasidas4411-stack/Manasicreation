import React, { useState } from 'react';
import { UserStats } from '../types';
import { StorageService } from '../utils/storage';
import { SoundEngine } from '../utils/soundEffects';
import {
  Shield,
  Clock,
  Award,
  BookOpen,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle,
  FileText,
  Smartphone,
  Lock,
  X,
  Check,
} from 'lucide-react';

interface ParentDashboardProps {
  stats: UserStats;
  onStatsUpdated: () => void;
  onClose: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  stats,
  onStatsUpdated,
  onClose,
}) => {
  // Parental gate challenge
  const [passedGate, setPassedGate] = useState(false);
  const [numA] = useState(() => Math.floor(Math.random() * 5) + 6); // 6-10
  const [numB] = useState(() => Math.floor(Math.random() * 5) + 4); // 4-8
  const [inputAnswer, setInputAnswer] = useState('');
  const [gateError, setGateError] = useState(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(stats.soundEnabled);
  const [voiceEnabled, setVoiceEnabled] = useState(stats.voiceEnabled);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'settings' | 'privacy' | 'android'>('stats');

  const handleVerifyGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(inputAnswer, 10) === numA * numB) {
      setPassedGate(true);
      setGateError(false);
      SoundEngine.playStar();
    } else {
      setGateError(true);
      SoundEngine.playWhoosh();
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    SoundEngine.toggleSound(next);
    const updated = { ...stats, soundEnabled: next };
    StorageService.saveUserStats(updated);
    onStatsUpdated();
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    SoundEngine.toggleVoice(next);
    const updated = { ...stats, voiceEnabled: next };
    StorageService.saveUserStats(updated);
    onStatsUpdated();
  };

  const handleReset = () => {
    StorageService.resetProgress();
    onStatsUpdated();
    setShowResetConfirm(false);
    SoundEngine.playWhoosh();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-[#FFFBF3] border-4 border-[#D7C5FF] rounded-3xl max-w-2xl w-full p-6 shadow-2xl my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 active:scale-90 text-gray-600"
          aria-label="Close Parent Gate"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- STEP 1: PARENT VERIFICATION GATE --- */}
        {!passedGate ? (
          <div className="py-6 text-center max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#D7C5FF] mx-auto flex items-center justify-center text-3xl shadow-inner">
              <Lock className="w-8 h-8 text-[#5B21B6]" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#344054]">
                Parents Only Area
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-1">
                To protect young artists, please solve this math problem:
              </p>
            </div>

            <form onSubmit={handleVerifyGate} className="space-y-3">
              <div className="text-2xl font-black text-[#5B21B6] bg-white p-3 rounded-2xl border-2 border-[#D7C5FF] shadow-xs">
                {numA} × {numB} = ?
              </div>

              <input
                type="number"
                value={inputAnswer}
                onChange={e => setInputAnswer(e.target.value)}
                placeholder="Enter answer"
                className="w-full text-center text-lg font-bold py-2.5 px-4 bg-white border-2 border-gray-300 rounded-2xl focus:border-purple-500 focus:outline-hidden"
                autoFocus
              />

              {gateError && (
                <p className="text-xs font-bold text-red-500">
                  Incorrect answer. Please calculate {numA} × {numB}.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-extrabold text-sm rounded-2xl shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                Verify & Enter Dashboard
              </button>
            </form>
          </div>
        ) : (
          /* --- STEP 2: VERIFIED PARENT DASHBOARD --- */
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 border-b-2 border-purple-100 pb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D7C5FF] flex items-center justify-center text-2xl shadow-xs">
                <Shield className="w-6 h-6 text-[#5B21B6]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#344054]">
                  Parent Dashboard & Settings
                </h2>
                <p className="text-xs font-semibold text-gray-500">
                  Child safety controls, learning statistics & release guide
                </p>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'stats'
                    ? 'bg-[#D7C5FF] text-[#5B21B6]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Learning Stats</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#D7C5FF] text-[#5B21B6]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Audio & App</span>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-[#D7C5FF] text-[#5B21B6]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>COPPA & Privacy</span>
              </button>

              <button
                onClick={() => setActiveTab('android')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'android'
                    ? 'bg-[#D7C5FF] text-[#5B21B6]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android APK Guide</span>
              </button>
            </div>

            {/* TAB CONTENT: STATS */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-200 shadow-2xs text-center">
                    <span className="text-2xl mb-1 block">⭐</span>
                    <span className="text-xl font-extrabold text-amber-900 block">
                      {stats.stars}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">Stars Earned</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border-2 border-pink-200 shadow-2xs text-center">
                    <span className="text-2xl mb-1 block">🎨</span>
                    <span className="text-xl font-extrabold text-pink-900 block">
                      {stats.coloredPagesCount}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">Pages Colored</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border-2 border-blue-200 shadow-2xs text-center">
                    <span className="text-2xl mb-1 block">✏️</span>
                    <span className="text-xl font-extrabold text-blue-900 block">
                      {stats.drawingsCount}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">Drawings Made</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-200 shadow-2xs text-center">
                    <span className="text-2xl mb-1 block">⏱️</span>
                    <span className="text-xl font-extrabold text-emerald-900 block">
                      {stats.timeSpentMinutes}m
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">Learning Time</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 space-y-2">
                  <h4 className="font-extrabold text-sm text-[#344054] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Completed Learning Modules ({stats.completedLessons.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.completedLessons.map((lesson, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold"
                      >
                        ✓ {lesson}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AUDIO & APP */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border-2 border-gray-200 divide-y divide-gray-100">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-800">Sound Effects</h4>
                      <p className="text-xs text-gray-500">
                        Plays cheerful chime, pop, and animal sound effects
                      </p>
                    </div>
                    <button
                      onClick={handleToggleSound}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                        soundEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-800">Phonics & Voice Reading</h4>
                      <p className="text-xs text-gray-500">
                        Reads ABC letters, words, and friendly encouragement
                      </p>
                    </div>
                    <button
                      onClick={handleToggleVoice}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                        voiceEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          voiceEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Reset Progress Section */}
                <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-red-900">Reset Child Progress</h4>
                    <p className="text-xs text-red-700">Clears stars, badges, and saved gallery drawings.</p>
                  </div>
                  {!showResetConfirm ? (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl active:scale-95 cursor-pointer"
                    >
                      Reset Data
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleReset}
                        className="px-3 py-1 bg-red-700 text-white font-black text-xs rounded-lg active:scale-95"
                      >
                        Confirm Reset
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 font-bold text-xs rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: PRIVACY & COPPA */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-2xl border-2 border-emerald-200 p-4 space-y-3 text-xs leading-relaxed text-gray-700">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span>Google Play Families & COPPA Compliance Declaration</span>
                </div>
                <p>
                  <strong>Color & Learn – Little Genius</strong> is engineered from the ground up for children aged 2–8:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                  <li><strong>Zero Ad Networks:</strong> No banners, interstitials, or tracking SDKs.</li>
                  <li><strong>No Account Required:</strong> No login or personal information collection.</li>
                  <li><strong>Zero Device Permissions:</strong> No microphone, camera, or GPS access requested.</li>
                  <li><strong>100% Offline Storage:</strong> All drawings and stars are stored locally on the device via local storage.</li>
                  <li><strong>Parental Gate:</strong> All external actions and settings require solving an adult arithmetic verification.</li>
                </ul>
              </div>
            )}

            {/* TAB CONTENT: ANDROID APK RELEASE GUIDE */}
            {activeTab === 'android' && (
              <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 space-y-3 text-xs text-gray-700">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>Android APK / AAB Build & Google Play Checklist</span>
                </div>
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 font-mono text-[11px] space-y-1">
                  <p className="font-bold text-blue-900">// Capacitor Android Build (One-liner):</p>
                  <p>npm i -g @capacitor/core @capacitor/cli @capacitor/android</p>
                  <p>npx cap init "Color & Learn" "com.littlegenius.colorandlearn"</p>
                  <p>npm run build && npx cap add android && npx cap run android</p>
                </div>
                <p className="font-semibold text-gray-800">Google Play Store Submission Checklist:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Target Age Group: Check "Ages 5 and under", "Ages 6-8".</li>
                  <li>Join Google Play "Teacher Approved" / "Designed for Families" program.</li>
                  <li>Target SDK 34+ (Android 14) and min SDK 24 (Android 7.0).</li>
                  <li>Provide a valid Privacy Policy URL stating COPPA compliance.</li>
                  <li>No external SDKs requesting advertising IDs or location.</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
