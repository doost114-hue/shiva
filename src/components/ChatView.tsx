import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChatMessage,
  EmotionType,
  MemoryItem,
  ShivaMemoryType,
  ShivaModelResponse,
  ShivaState,
  VirtualAgeInfo
} from '../types/shiva';
import { AvatarDisplay } from './AvatarDisplay';
import {
  Send,
  Sparkles,
  Brain,
  Volume2,
  BookmarkCheck,
  Heart,
  User,
  Bot,
  Layers,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { retrieveRelevantMemories } from '../services/memoryRetrieval';
import { processWithShivaCore } from '../services/shivaCore';

interface ChatViewProps {
  state: ShivaState;
  ageInfo: VirtualAgeInfo;
  onStateUpdate: (newState: ShivaState) => void;
  onNavigateToMemories?: () => void;
  onNavigateToRelationship?: () => void;
}

const MEMORY_TYPE_TITLES: Record<ShivaMemoryType, string> = {
  fixed_shiva: 'اطلاعات ثابت شیوا',
  user_important: 'اطلاعات مهم کاربر',
  important_memory: 'خاطره مهم',
  daily_memory: 'خاطره روزانه',
  short_term: 'حافظه کوتاه‌مدت',
  relationship: 'اطلاعات رابطه',
};

export const ChatView: React.FC<ChatViewProps> = ({
  state,
  ageInfo,
  onStateUpdate,
  onNavigateToMemories,
  onNavigateToRelationship,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMemoryNotification, setLastMemoryNotification] = useState<{
    type: ShivaMemoryType;
    content: string;
    importance: number;
  } | null>(null);
  const [currentRetrievedMemories, setCurrentRetrievedMemories] = useState<MemoryItem[]>([]);
  const [showRetrievedDrawer, setShowRetrievedDrawer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // پیشنهادهای آماده برای شروع گفتگو متناسب با سن
  const quickPrompts = ageInfo.years < 6
    ? ['سلام شیوا، امروز چه بازی‌ای کردی؟', 'می‌تونی یک شعر قشنگ برام بخونی؟', 'چه رنگی رو بیشتر از همه دوست داری؟']
    : ageInfo.years < 18
    ? ['امروز در کارهات و یادگیریت چه خبر بود؟', 'من عاشق طراحی و ساختن چیزهای جالب هستم!', 'یک خاطره خوب از روزهای گذشته برام بگو.']
    : ['نام من علی است و کارم توسعه نرم‌افزاره.', 'به نظرت زیباترین خصلت در یک رابطه چیست؟', 'من چای بهارنارنج رو خیلی دوست دارم.'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.memory.recentConversations, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // ۱. استخراج اولیه خاطرات مرتبط جهت نمایش در پنل کشویی
    const relevantMemories = retrieveRelevantMemories(state.memory.memories, text, 6);
    setCurrentRetrievedMemories(relevantMemories);

    setInputText('');
    setIsLoading(true);
    setLastMemoryNotification(null);

    try {
      // ۲. ارسال به Shiva Core (هسته مرکزی مشترک گفت‌وگوی صوتی و متنی)
      const result = await processWithShivaCore({
        message: text,
        currentState: state,
        ageInfo,
        source: 'text',
      });

      onStateUpdate(result.updatedState);

      if (result.savedMemoryNotice) {
        setLastMemoryNotification(result.savedMemoryNotice);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden" id="shiva-chat-container">
      {/* سربرگ گفت‌وگو */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-rose-200 shadow-sm bg-rose-50 flex items-center justify-center">
            <AvatarDisplay
              emotion={state.currentEmotion}
              intensity={state.emotionIntensity}
              stage={ageInfo.stage}
              ageDisplay={ageInfo.ageDisplay}
              size="sm"
              isSpeaking={isLoading}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">گفت‌وگو با شیوا</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-100">
                {ageInfo.ageDisplay}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>حافظه هوشمند ۶ بخشی فعال • استخراج خاطرات مرتبط</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToRelationship && (
            <button
              onClick={onNavigateToRelationship}
              className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 font-medium transition-colors"
              title="مشاهده وضعیت رابطه با شیوا"
            >
              <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
              <span>پیوند و رابطه</span>
            </button>
          )}

          {currentRetrievedMemories.length > 0 && (
            <button
              onClick={() => setShowRetrievedDrawer(!showRetrievedDrawer)}
              className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-2xs"
              title="مشاهده خاطرات بازیابی‌شده برای پیام جاری"
            >
              <Brain className="w-3.5 h-3.5 text-rose-500" />
              <span>{currentRetrievedMemories.length} خاطره مرتبط</span>
              {showRetrievedDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {onNavigateToMemories && (
            <button
              onClick={onNavigateToMemories}
              className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>خاطرات شیوا ({state.memory.memories.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* کشوی نمایش خاطرات مرتبط بازیابی‌شده برای پیام جاری */}
      <AnimatePresence>
        {showRetrievedDrawer && currentRetrievedMemories.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-50/90 border-b border-indigo-100 px-4 py-2.5 text-xs text-indigo-900 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-indigo-600" />
                خاطرات بازیابی‌شده جهت زمینه پاسخگویی شیوا:
              </span>
              <span className="text-[11px] text-indigo-500">فقط خاطرات مرتبط به Gemini ارسال شدند</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {currentRetrievedMemories.map(mem => (
                <div key={mem.id} className="bg-white/90 p-2 rounded-lg border border-indigo-100/80 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-indigo-600 font-medium mb-1">
                    <span>{MEMORY_TYPE_TITLES[mem.type]}</span>
                    <span>اهمیت: {mem.importance}/۱۰</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">{mem.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* اعلان ذخیره موفق در حافظه دائمی */}
      <AnimatePresence>
        {lastMemoryNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50/95 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                در بخش <strong>[{MEMORY_TYPE_TITLES[lastMemoryNotification.type]}]</strong> ذخیره دائمی شد:
                <span className="font-semibold mr-1">«{lastMemoryNotification.content}»</span>
                <span className="mr-1 text-[11px] text-emerald-600">(اهمیت: {lastMemoryNotification.importance}/۱۰)</span>
              </span>
            </div>
            <button
              onClick={() => setLastMemoryNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold text-xs px-2"
            >
              بستن
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* لیست پیام‌ها */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50/30 via-white to-slate-50/20">
        {state.memory.recentConversations.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-end gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0 shadow-xs border border-rose-200">
                  <Heart className="w-4 h-4 fill-rose-300" />
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                  isAssistant
                    ? 'bg-white border border-slate-200/90 text-slate-800 rounded-br-sm'
                    : 'bg-rose-500 text-white rounded-bl-sm font-normal'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* متادیتا و جزئیات احساسی پیام شیوا */}
                <div className={`mt-2 pt-1.5 flex items-center justify-between gap-3 text-[11px] border-t ${isAssistant ? 'border-slate-100 text-slate-400' : 'border-rose-400/50 text-rose-100'}`}>
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    {isAssistant && msg.emotion && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                        حس: {msg.emotion}
                      </span>
                    )}
                    {isAssistant && msg.memory_candidate && (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded" title="ثبت‌شده در حافظه دائمی">
                        <Brain className="w-3 h-3" />
                        <span>ثبت در حافظه</span>
                      </span>
                    )}
                  </div>

                  {isAssistant && (
                    <button
                      onClick={() => handleSpeakText(msg.text)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="خواندن متن"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* وضعیت در حال نوشتن پاسخ */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 rounded-br-sm shadow-xs flex items-center gap-2 text-slate-500 text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]" />
              <span className="mr-2">شیوا در حال بازیابی خاطرات مرتبط و اندیشیدن است...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* بخش پیشنهادهای سریع */}
      <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-rose-500" />
          پیشنهاد گفتگو:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-xs bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 px-3 py-1 rounded-full border border-slate-200/80 hover:border-rose-200 whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* فرم ورود پیام */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
        id="shiva-chat-input-form"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            ageInfo.years < 18
              ? `پیامی برای شیوای ${ageInfo.ageDisplay} بنویسید (نکات مهم در حافظه ثبت می‌شوند)...`
              : 'صحبت یا پرسشی برای شیوا بنویسید...'
          }
          disabled={isLoading}
          className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
          dir="rtl"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 text-white p-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center cursor-pointer"
          title="ارسال پیام"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </form>
    </div>
  );
};
