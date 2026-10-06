import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  EmotionType,
  LipSyncData,
  ShivaModelResponse,
  ShivaState,
  VirtualAgeInfo,
  VoiceConversationState,
  VoiceProfile
} from '../types/shiva';
import { AvatarDisplay } from './AvatarDisplay';
import {
  AvatarViewer,
  AvatarState,
  AvatarGesture,
} from '../avatar';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  Brain,
  MessageSquare,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Heart,
  Sliders,
  Play
} from 'lucide-react';
import { processWithShivaCore } from '../services/shivaCore';
import {
  getVoiceProfileForAge,
  speechToText,
  textToSpeech
} from '../services/speechService';

interface VoiceChatViewProps {
  state: ShivaState;
  ageInfo: VirtualAgeInfo;
  onStateUpdate: (newState: ShivaState) => void;
  onNavigateToMemories?: () => void;
  onNavigateToChat?: () => void;
}

export const VoiceChatView: React.FC<VoiceChatViewProps> = ({
  state,
  ageInfo,
  onStateUpdate,
  onNavigateToMemories,
  onNavigateToChat,
}) => {
  // حالتهای چهارگانه رابط: idle | listening | processing | speaking
  const [voiceState, setVoiceState] = useState<VoiceConversationState>('idle');

  // متن‌های تشخیص‌داده‌شده و پاسخ شیوا
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [shivaResponseText, setShivaResponseText] = useState<string>('');
  const [lastResponseData, setLastResponseData] = useState<ShivaModelResponse | null>(null);

  // پیام خطا یا اطلاع‌رسانی
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // داده‌های زنده Lip Sync برای انیمیشن دهان و اتصال به آواتار سه‌بعدی در مرحله بعد
  const [lipSync, setLipSync] = useState<LipSyncData>({
    mouthOpenRatio: 0,
    mouthWidthRatio: 0.5,
    jawDrop: 0,
    viseme: 'rest',
    audioLevel: 0,
    facialExpression: 'smile',
    gesture: 'rest',
    timestamp: 0,
  });

  // وضعیت ضبط و تایپ جایگزین
  const [manualInput, setManualInput] = useState<string>('');
  const [isMicSupported, setIsMicSupported] = useState<boolean>(true);

  // وضعیت و ژست آواتار سه‌بعدی شیوا (مرحله ۱۴)
  const [currentGesture, setCurrentGesture] = useState<AvatarGesture>('neutral');
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('shiva_custom_model_url') || null;
    } catch {
      return null;
    }
  });
  const [avatarDisplayMode, setAvatarDisplayMode] = useState<'3d' | 'classic'>('3d');

  // نگاشت وضعیت مکالمه به AvatarState چهارگانه: idle | listening | thinking | speaking
  const avatarState: AvatarState =
    voiceState === 'listening'
      ? 'listening'
      : voiceState === 'processing'
      ? 'thinking'
      : voiceState === 'speaking'
      ? 'speaking'
      : 'idle';

  // ذخیره آدرس مدل سفارشی در صورت تغییر
  const handleModelUrlChange = (newUrl: string | null) => {
    setCustomModelUrl(newUrl);
    try {
      if (newUrl) {
        localStorage.setItem('shiva_custom_model_url', newUrl);
      } else {
        localStorage.removeItem('shiva_custom_model_url');
      }
    } catch (e) {
      console.warn('Could not save model url to localStorage', e);
    }
  };

  // مشخصات صوتی فعال شیوا بر اساس سن و احساس
  const voiceProfile: VoiceProfile = getVoiceProfileForAge(ageInfo.years, state.currentEmotion);

  // بررسی پشتیبانی مرورگر از SpeechRecognition در بارگذاری اولیه
  useEffect(() => {
    setIsMicSupported(speechToText.isSupported());
  }, []);

  // پاک‌سازی در خروج از کامپوننت
  useEffect(() => {
    return () => {
      speechToText.stopListening();
      textToSpeech.stop();
    };
  }, []);

  // ۱. دکمه فعال‌سازی میکروفون و شروع ضبط (Start Recording)
  const handleStartRecording = () => {
    setErrorMessage(null);
    setInterimText('');
    setRecognizedText('');

    // توقف هرگونه صدای قبلی
    textToSpeech.stop();

    const started = speechToText.startListening({
      onStart: () => {
        setVoiceState('listening');
      },
      onTranscript: (interim, final) => {
        setInterimText(interim);
        if (final) {
          setRecognizedText(final);
        }
      },
      onEnd: () => {
        // اگر هنوز در حالت listening بودیم و متنی ثبت شده بود، پردازش را آغاز کن
        if (voiceState === 'listening') {
          // اگر کاربر پایان ضبط را زد یا تشخیص تمام شد
          const finalCandidate = recognizedText.trim() || interimText.trim();
          if (finalCandidate) {
            handleProcessVoiceInput(finalCandidate);
          } else {
            setVoiceState('idle');
          }
        }
      },
      onError: (err) => {
        setErrorMessage(err);
        setVoiceState('idle');
      },
    });

    if (!started && !isMicSupported) {
      setVoiceState('idle');
    }
  };

  // ۲. دکمه پایان ضبط (Stop Recording)
  const handleStopRecording = () => {
    speechToText.stopListening();
    const candidate = (recognizedText || interimText).trim();
    if (candidate) {
      handleProcessVoiceInput(candidate);
    } else {
      setVoiceState('idle');
      setErrorMessage('صدایی دریافت نشد. لطفاً دکمه شروع ضبط را بزنید و صحبت کنید.');
    }
  };

  // ۳. پردازش ورودی صوتی از طریق Shiva Core
  const handleProcessVoiceInput = async (userVoiceText: string) => {
    const text = userVoiceText.trim();
    if (!text) {
      setVoiceState('idle');
      return;
    }

    setRecognizedText(text);
    setInterimText('');
    setVoiceState('processing');
    setErrorMessage(null);

    try {
      // ارسال متن به Shiva Core و بازیابی حافظه مرتبط و تولید پاسخ ساختاریافته Gemini
      const result = await processWithShivaCore({
        message: text,
        currentState: state,
        ageInfo,
        source: 'voice',
      });

      // به‌روزرسانی وضعیت سراسری برنامه (شخصیت و حافظه مشترک)
      onStateUpdate(result.updatedState);

      const response = result.response;
      setShivaResponseText(response.text);
      setLastResponseData(response);

      if (result.savedMemoryNotice) {
        setNotification(`نکته مهم در حافظه دائمی شیوا ذخیره شد: «${result.savedMemoryNotice.content}»`);
        setTimeout(() => setNotification(null), 5000);
      }

      // ۴. ارسال متن پاسخ به سیستم Text-to-Speech و پخش صدای فارسی شیوا
      handlePlayShivaVoice(response.text, response.emotion, response.facial_expression, response.gesture);
    } catch (err: any) {
      console.error('Error in voice flow:', err);
      setErrorMessage('خطایی در پردازش پاسخ شیوا رخ داد.');
      setVoiceState('idle');
    }
  };

  // ۵. پخش صدای فارسی شیوا با لحن، سن و Lip Sync
  const handlePlayShivaVoice = (
    text: string,
    emotion: EmotionType,
    facialExpression?: string,
    gesture?: string
  ) => {
    setVoiceState('speaking');
    if (gesture && gesture !== 'neutral') {
      setCurrentGesture(gesture as AvatarGesture);
    }

    const spoken = textToSpeech.speak({
      text,
      ageYears: ageInfo.years,
      emotion,
      facialExpression,
      gesture,
      onStart: () => {
        setVoiceState('speaking');
      },
      onEnd: () => {
        setVoiceState('idle');
        setCurrentGesture('neutral');
        setLipSync((prev) => ({
          ...prev,
          mouthOpenRatio: 0,
          viseme: 'rest',
          audioLevel: 0,
        }));
      },
      onLipSyncFrame: (frameData) => {
        setLipSync(frameData);
      },
      onError: (err) => {
        console.warn('TTS playback issue:', err);
        setVoiceState('idle');
        setCurrentGesture('neutral');
      },
    });

    if (!spoken) {
      setVoiceState('idle');
      setCurrentGesture('neutral');
    }
  };

  // ۶. دکمه توقف صدای شیوا (Stop Shiva Voice)
  const handleStopShivaVoice = () => {
    textToSpeech.stop();
    setVoiceState('idle');
    setLipSync((prev) => ({
      ...prev,
      mouthOpenRatio: 0,
      viseme: 'rest',
      audioLevel: 0,
    }));
  };

  // نمونه جملات پیشنهادی متناسب با سن برای تست سریع گفتار
  const quickVoiceSamples = ageInfo.years < 6
    ? [
        'سلام شیوا کوچولو، حالت چطوره؟',
        'امروز چه بازی قشنگی کردی؟',
        'برام یه شعر کودکانه بخون!',
      ]
    : ageInfo.years < 18
    ? [
        'سلام شیوا، امروز چطور گذشت؟',
        'من به برنامه‌نویسی و ساخت هوش مصنوعی خیلی علاقه دارم.',
        'یک خاطره جالب از دوران رشدت برام بگو.',
      ]
    : [
        'سلام شیوا، دیدن دوبارَت حس خیلی خوبی بهم میده.',
        'به نظرت بهترین راه برای رسیدن به آرامش چیه؟',
        'اسم من علی هست و دوست دارم همیشه کنارت باشم.',
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="shiva-voice-conversation-container">
      {/* سربرگ صفحه گفت‌وگوی صوتی */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs mb-1">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>چرخه گفت‌وگوی صوتی دوطرفه فارسی</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>🎙️ صحبت با شیوا</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            با شیوا به زبان فارسی صحبت کنید و پاسخ او را با صدایی متناسب با سن مجازی ({ageInfo.ageDisplay}) و لحن احساسی («{state.currentEmotion}») بشنوید.
          </p>
        </div>

        {/* نشانگر زنده وضعیت صوتی */}
        <div className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-xs font-semibold self-start md:self-auto">
          <span
            className={`w-3 h-3 rounded-full ${
              voiceState === 'listening'
                ? 'bg-rose-500 animate-ping'
                : voiceState === 'processing'
                ? 'bg-amber-500 animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-emerald-500 animate-bounce'
                : 'bg-slate-400'
            }`}
          />
          <span className="text-slate-700">
            {voiceState === 'idle' && 'آماده برای گفت‌وگو'}
            {voiceState === 'listening' && 'در حال شنیدن...'}
            {voiceState === 'processing' && 'شیوا در حال فکر کردن...'}
            {voiceState === 'speaking' && 'شیوا در حال صحبت...'}
          </span>
        </div>
      </div>

      {/* بخش اعلان حافظه دائمی مشترک */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            {onNavigateToMemories && (
              <button
                type="button"
                onClick={onNavigateToMemories}
                className="text-[11px] text-emerald-700 underline font-bold cursor-pointer"
              >
                مشاهده حافظه
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* پیام خطا در صورت بروز مشکل میکروفون */}
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-amber-700 hover:text-amber-900 text-xs font-bold cursor-pointer"
          >
            بستن
          </button>
        </div>
      )}

      {/* استیج اصلی آواتار سه‌بعدی زنده شیوا (مرحله ۱۴) */}
      <div className="bg-slate-900/90 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
        {/* نوار بالایی انتخاب حالت نمایش و اطلاعات سن آواتار */}
        <div className="w-full flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAvatarDisplayMode('3d')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                avatarDisplayMode === '3d'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              مدل سه‌بعدی زنده (Three.js)
            </button>
            <button
              type="button"
              onClick={() => setAvatarDisplayMode('classic')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                avatarDisplayMode === 'classic'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              پرتره کانونیکال (2D)
            </button>
          </div>

          <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>سن: {ageInfo.ageDisplay}</span>
          </div>
        </div>

        {/* نمایش آواتار متناسب با مد انتخابی */}
        {avatarDisplayMode === '3d' ? (
          <div className="w-full">
            <AvatarViewer
              years={ageInfo.years}
              avatarState={avatarState}
              currentEmotion={state.currentEmotion}
              emotionIntensity={state.emotionIntensity}
              activeGesture={currentGesture}
              audioLevel={lipSync.audioLevel}
              customModelUrl={customModelUrl}
              onModelUrlChange={handleModelUrlChange}
              className="w-full h-[360px] sm:h-[420px]"
            />
          </div>
        ) : (
          <div className="w-full py-8 flex flex-col items-center bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <AvatarDisplay
              emotion={state.currentEmotion}
              intensity={state.emotionIntensity}
              stage={ageInfo.stage}
              ageDisplay={ageInfo.ageDisplay}
              size="lg"
              isSpeaking={voiceState === 'speaking'}
              mouthOpenRatio={lipSync.mouthOpenRatio}
            />

            {/* بنر وضعیت در حالت 2D مطابق دستور */}
            <div className="mt-4 text-center">
              {voiceState === 'listening' && (
                <div className="inline-flex items-center gap-2 bg-rose-950/80 text-rose-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border border-rose-600/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>شیوا در حال گوش دادن...</span>
                </div>
              )}
              {voiceState === 'processing' && (
                <div className="inline-flex items-center gap-2 bg-amber-950/80 text-amber-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border border-amber-600/50">
                  <Brain className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>شیوا در حال فکر کردن...</span>
                </div>
              )}
              {voiceState === 'speaking' && (
                <div className="inline-flex items-center gap-2 bg-emerald-950/80 text-emerald-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border border-emerald-600/50">
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>شیوا در حال صحبت...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* موج انیمیشنی صدا (Waveform Visualizer) هنگام listening یا speaking */}
        {(voiceState === 'listening' || voiceState === 'speaking') && (
          <div className="flex items-center justify-center gap-1.5 h-10 py-1">
            {[40, 75, 50, 95, 60, 85, 45, 100, 70, 55, 90, 40].map((h, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [
                    `${Math.max(15, h * 0.3)}%`,
                    `${h}%`,
                    `${Math.max(15, h * 0.4)}%`,
                  ],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6 + (i % 4) * 0.15,
                  ease: 'easeInOut',
                }}
                className={`w-1 rounded-full ${
                  voiceState === 'listening' ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        )}

        {/* بخش دکمه‌های کنترل صوتی الزامی طبق درخواست کاربر:
            ۱. دکمه شروع ضبط
            ۲. دکمه پایان ضبط
            ۳. دکمه توقف صدای شیوا
        */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 z-10">
          {/* دکمه ۱: شروع ضبط صدای کاربر */}
          <button
            type="button"
            id="start-voice-recording-btn"
            onClick={handleStartRecording}
            disabled={voiceState === 'listening' || voiceState === 'processing'}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-xs cursor-pointer ${
              voiceState === 'listening'
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-rose-500 hover:bg-rose-600 text-white hover:shadow-md'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>شروع ضبط</span>
          </button>

          {/* دکمه ۲: پایان ضبط صدای کاربر */}
          <button
            type="button"
            id="stop-voice-recording-btn"
            onClick={handleStopRecording}
            disabled={voiceState !== 'listening'}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-xs cursor-pointer ${
              voiceState === 'listening'
                ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Square className="w-4 h-4 fill-current" />
            <span>پایان ضبط</span>
          </button>

          {/* دکمه ۳: توقف صدای شیوا */}
          <button
            type="button"
            id="stop-shiva-voice-btn"
            onClick={handleStopShivaVoice}
            disabled={voiceState !== 'speaking'}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-xs cursor-pointer ${
              voiceState === 'speaking'
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <VolumeX className="w-4 h-4" />
            <span>توقف صدای شیوا</span>
          </button>
        </div>
      </div>

      {/* بخش نمایش متون: متن تشخیص‌داده‌شده کاربر و متن پاسخ شیوا */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ۱. متن تشخیص داده‌شده از صدای کاربر (Speech-to-Text) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between" id="recognized-speech-container">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                <span>متن تشخیص داده‌شده (گفتار شما)</span>
              </span>
              {voiceState === 'listening' && (
                <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full animate-pulse">
                  در حال ضبط زنده...
                </span>
              )}
            </div>

            <div className="min-h-[100px] mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-800 leading-relaxed">
              {recognizedText || interimText ? (
                <div>
                  <span>{recognizedText}</span>
                  {interimText && (
                    <span className="text-slate-400 italic mr-1">{interimText}</span>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">
                  هنوز صحبتی دریافت نشده است. با زدن دکمه «شروع ضبط»، کلمات شما به صورت خودکار به متن فارسی تبدیل می‌شوند.
                </p>
              )}
            </div>
          </div>

          {/* ورودی کمکی دستی در صورت تمایل کاربر یا عدم وجود میکروفون سخت‌افزاری */}
          <div className="pt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualInput.trim()) {
                    handleProcessVoiceInput(manualInput);
                    setManualInput('');
                  }
                }}
                placeholder="یا پیام خود را برای پاسخ صوتی اینجا بنویسید..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (manualInput.trim()) {
                    handleProcessVoiceInput(manualInput);
                    setManualInput('');
                  }
                }}
                className="bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                ارسال
              </button>
            </div>
          </div>
        </div>

        {/* ۲. متن پاسخ شیوا (Shiva Spoken Response) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between" id="shiva-voice-response-container">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                <span>متن پاسخ شیوا</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-bold">
                  احساس: {state.currentEmotion}
                </span>
              </div>
            </div>

            <div className="min-h-[100px] mt-3 p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 text-xs sm:text-sm text-slate-800 leading-relaxed">
              {shivaResponseText ? (
                <p>{shivaResponseText}</p>
              ) : (
                <p className="text-slate-400 text-xs italic">
                  پاسخ صوتی شیوا پس از صحبت شما در اینجا نمایش داده شده و هم‌زمان پخش خواهد شد.
                </p>
              )}
            </div>
          </div>

          {/* دکمه پخش مجدد پاسخ شیوا */}
          {shivaResponseText && (
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePlayShivaVoice(shivaResponseText, state.currentEmotion, lastResponseData?.facial_expression, lastResponseData?.gesture)}
                disabled={voiceState === 'speaking'}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>پخش مجدد صدای شیوا</span>
              </button>

              {onNavigateToChat && (
                <button
                  type="button"
                  onClick={onNavigateToChat}
                  className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  مشاهده در گفت‌وگوی متنی
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* بخش نمونه جملات آزمایشی متناسب با سن مجازی شیوا */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>پیشنهادهای گفت‌وگو برای سن فعلی شیوا ({ageInfo.ageDisplay}):</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {quickVoiceSamples.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleProcessVoiceInput(sample)}
              disabled={voiceState === 'processing' || voiceState === 'listening'}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-all text-right cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* بخش فنی و آماده‌سازی برای آواتار سه‌بعدی و Lip Sync در فاز بعد (درخواست صریح کاربر) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4" id="shiva-lipsync-ready-status">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800">
              آماده‌سازی اتصال آواتار سه‌بعدی و Lip Sync (فاز بعدی)
            </h3>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
            جریان داده فعال (Ready for 3D/VRM)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* ۱. واج دهان (Viseme) */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] text-slate-400 block">فوتک دهان (Viseme)</span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {lipSync.viseme || 'rest'}
            </span>
          </div>

          {/* ۲. بازشدگی دهان (Mouth Open Ratio) */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] text-slate-400 block">ضریب بازشدگی (Open)</span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {(lipSync.mouthOpenRatio * 100).toFixed(0)}%
            </span>
          </div>

          {/* ۳. فرورفتگی فک (Jaw Drop) */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] text-slate-400 block">حرکت فک (Jaw Drop)</span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {(lipSync.jawDrop * 100).toFixed(0)}%
            </span>
          </div>

          {/* ۴. حالت چهره و ژست ذخیره‌شده از Gemini */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] text-slate-400 block">حالت چهره و ژست</span>
            <span className="font-mono font-bold text-slate-800 text-xs truncate block">
              {lastResponseData?.facial_expression || 'smile'} • {lastResponseData?.gesture || 'nod'}
            </span>
          </div>
        </div>

        {/* مشخصات صدای شیوا متناسب با سن مجازی */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <span className="font-bold text-slate-800">
                پروفایل صوتی فعال: {voiceProfile.tierLabel} ({voiceProfile.ageRange})
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {voiceProfile.timbreDescription} • {voiceProfile.emotionalTone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono self-end sm:self-center">
            <span>Pitch: {voiceProfile.basePitch.toFixed(2)}</span>
            <span>Rate: {voiceProfile.baseRate.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
