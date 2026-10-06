import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShivaState, VirtualAgeInfo } from './types/shiva';
import { StorageService } from './services/storage';
import { calculateVirtualAge } from './services/ageSystem';
import { Dashboard } from './components/Dashboard';
import { ChatView } from './components/ChatView';
import { MemoryView } from './components/MemoryView';
import { GrowthJournalView } from './components/GrowthJournalView';
import { PersonalityView } from './components/PersonalityView';
import { GalleryView } from './components/GalleryView';
import { DailyLifeView } from './components/DailyLifeView';
import { VoiceChatView } from './components/VoiceChatView';
import { RelationshipView } from './components/RelationshipView';
import {
  LayoutDashboard,
  MessageCircle,
  BookmarkCheck,
  Camera,
  BookOpen,
  Sliders,
  Sparkles,
  Heart,
  Calendar,
  Smile,
  Sun,
  Mic
} from 'lucide-react';

type TabType = 'dashboard' | 'daily' | 'voice' | 'chat' | 'relationship' | 'journal' | 'memories' | 'gallery' | 'personality';

export default function App() {
  const [state, setState] = useState<ShivaState>(() => StorageService.loadState());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // بررسی همگام‌سازی روز در صورت فعال شدن مجدد تب مرورگر
  useEffect(() => {
    const onFocus = () => {
      const refreshed = StorageService.loadState();
      setState(refreshed);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // ذخیره تغییرات حالت
  const handleStateUpdate = (newState: ShivaState) => {
    setState(newState);
  };

  // محاسبه سن مجازی بر اساس روزهای سپری‌شده واقعی و فرمول کاربر
  const ageInfo: VirtualAgeInfo = calculateVirtualAge(state.projectStartDate, state.virtualDayOffset);

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'صفحه اصلی', icon: LayoutDashboard },
    { id: 'voice', label: '🎙️ صحبت با شیوا', icon: Mic },
    { id: 'chat', label: 'گفت‌وگو', icon: MessageCircle },
    { id: 'relationship', label: '❤️ رابطه با شیوا', icon: Heart },
    { id: 'daily', label: 'زندگی روزانه شیوا', icon: Sun },
    { id: 'journal', label: 'دفتر رشد', icon: BookOpen },
    { id: 'memories', label: '🧠 خاطرات شیوا', icon: BookmarkCheck },
    { id: 'gallery', label: 'آلبوم تصاویر', icon: Camera },
    { id: 'personality', label: 'شخصیت و سن', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col selection:bg-rose-100 selection:text-rose-900 font-sans" dir="rtl">
      {/* نوار بالایی هدر (Navbar) */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* لوگو و نام شیوا */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 text-right hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-0.5 shadow-xs flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">شیوا</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-100">
                  شخصیت مجازی
                </span>
              </div>
              <p className="text-[11px] text-slate-400">همراه مجازی با سن، احساس و حافظه</p>
            </div>
          </button>

          {/* نشانگر سن و حال روحی سریع در هدر */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-xs">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-slate-500">سن:</span>
              <strong className="text-slate-800">{ageInfo.ageDisplay}</strong>
              <span className="text-slate-400 font-normal">({ageInfo.stageLabel})</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-xs">
              <Smile className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-500">احساس:</span>
              <strong className="text-slate-800">{state.currentEmotion}</strong>
            </div>
          </div>

          {/* دکمه‌های سریع صوتی و متنی در هدر */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('voice')}
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>🎙️ صحبت صوتی</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="hidden sm:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>متنی</span>
            </button>
          </div>
        </div>

        {/* منوی ناوبری تب‌ها */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* محتوای اصلی تب انتخاب‌شده */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard state={state} ageInfo={ageInfo} onNavigate={(tab) => setActiveTab(tab)} />
            </motion.div>
          )}

          {activeTab === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <VoiceChatView
                state={state}
                ageInfo={ageInfo}
                onStateUpdate={handleStateUpdate}
                onNavigateToMemories={() => setActiveTab('memories')}
                onNavigateToChat={() => setActiveTab('chat')}
              />
            </motion.div>
          )}

          {activeTab === 'daily' && (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <DailyLifeView
                state={state}
                ageInfo={ageInfo}
                onStateUpdate={handleStateUpdate}
                onNavigateToJournal={() => setActiveTab('journal')}
              />
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ChatView
                state={state}
                ageInfo={ageInfo}
                onStateUpdate={handleStateUpdate}
                onNavigateToMemories={() => setActiveTab('memories')}
                onNavigateToRelationship={() => setActiveTab('relationship')}
              />
            </motion.div>
          )}

          {activeTab === 'relationship' && (
            <motion.div
              key="relationship"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RelationshipView
                state={state}
                ageInfo={ageInfo}
                onStateUpdate={handleStateUpdate}
              />
            </motion.div>
          )}

          {activeTab === 'memories' && (
            <motion.div
              key="memories"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MemoryView state={state} onStateUpdate={handleStateUpdate} />
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GalleryView state={state} ageInfo={ageInfo} onStateUpdate={handleStateUpdate} />
            </motion.div>
          )}

          {activeTab === 'journal' && (
            <motion.div
              key="journal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GrowthJournalView
                state={state}
                ageInfo={ageInfo}
                onStateUpdate={handleStateUpdate}
                onNavigateToDailyLife={() => setActiveTab('daily')}
              />
            </motion.div>
          )}

          {activeTab === 'personality' && (
            <motion.div
              key="personality"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PersonalityView state={state} ageInfo={ageInfo} onStateUpdate={handleStateUpdate} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* پاورقی */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span>«شیوا» — شخصیت مجازی با سن، هوش، احساس و خاطره</span>
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-slate-400 text-[11px]">
            طراحی شده با استاندارد زبان فارسی و راست‌به‌چپ (RTL)
          </div>
        </div>
      </footer>
    </div>
  );
}
