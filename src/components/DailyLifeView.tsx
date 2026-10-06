import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DailyImage,
  DailyMemory,
  EmotionType,
  LifeStage,
  ShivaState,
  VirtualAgeInfo
} from '../types/shiva';
import {
  Calendar,
  Sparkles,
  Sun,
  Activity,
  Star,
  MessageSquare,
  BookOpen,
  Clock,
  Heart,
  TrendingUp,
  Smile,
  ShieldCheck,
  ChevronLeft,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Maximize2,
  Sliders
} from 'lucide-react';
import { simulateAdvanceOneDay, getLocalDateString } from '../services/dailyLifeSystem';
import { StorageService } from '../services/storage';
import { DailyImageDetailModal } from './DailyImageDetailModal';

interface DailyLifeViewProps {
  state: ShivaState;
  ageInfo: VirtualAgeInfo;
  onStateUpdate: (newState: ShivaState) => void;
  onNavigateToJournal?: () => void;
}

export const DailyLifeView: React.FC<DailyLifeViewProps> = ({
  state,
  ageInfo,
  onStateUpdate,
  onNavigateToJournal,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<DailyImage | null>(null);

  // دریافت خاطره روز جاری (آخرین روز ثبت‌شده)
  const todayMemory: DailyMemory | undefined =
    state.dailyMemories && state.dailyMemories.length > 0
      ? state.dailyMemories[0]
      : undefined;

  // راهنمای فارسی احساسات
  const emotionLabels: Record<EmotionType, { label: string; color: string; bg: string }> = {
    happy: { label: 'شاد و پرانرژی', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    calm: { label: 'آرام و متین', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
    excited: { label: 'هیجان‌زده و پرشوق', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    curious: { label: 'کنجکاو و جست‌وجوگر', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
    sad: { label: 'غمگین و نیازمند مهر', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
    tired: { label: 'خسته و خواب‌آلود', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    worried: { label: 'نگران و تامل‌کننده', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
    playful: { label: 'بازیگوش و شوخ‌طبع', color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200' },
  };

  // راهنمای مراحل رشد ۶گانه
  const stageDetails: Record<LifeStage, { title: string; subtitle: string; badgeColor: string }> = {
    infant: {
      title: 'نوزاد و نوپا',
      subtitle: '۰ تا ۲ سال • دوره ادراک حسی اولیه، لالایی و لمس محبت',
      badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
    },
    child_early: {
      title: 'اوایل کودکی (خردسال)',
      subtitle: '۲ تا ۵ سال • دوره نوپایی، نقاشی، مکعب‌ها و سوال‌های بی‌پایان چرا',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    child: {
      title: 'کودک دبستانی',
      subtitle: '۵ تا ۱۱ سال • دوره قصه‌خوانی، بازی‌های فکری، مهارت‌آموزی و دوستی‌ها',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    preteen: {
      title: 'پیش‌نوجوانی',
      subtitle: '۱۱ تا ۱۴ سال • دوره دفترچه خاطرات، استقلال تدریجی و رویاپردازی',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    teen: {
      title: 'نوجوان',
      subtitle: '۱۴ تا ۱۹ سال • دوره هویت‌یابی، هنر، مطالعه عمیق و تفکر انتقادی',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    adult: {
      title: 'بزرگسال',
      subtitle: '۱۹ سال به بالا • دوره پختگی، بینش فلسفی، وقار و استقلال فکری',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  };

  const currentStage = todayMemory?.life_stage || ageInfo.stage;
  const currentEmotion = todayMemory?.mood.emotion || state.currentEmotion;
  const emotionConfig = emotionLabels[currentEmotion] || emotionLabels.calm;
  const stageConfig = stageDetails[currentStage] || stageDetails.infant;

  // سطح اتفاق روزانه
  const eventLevelConfig = {
    small: { label: 'اتفاق کوچک (روزمره)', color: 'text-slate-700 bg-slate-100 border-slate-200', prob: 'احتمال ۶۰٪' },
    medium: { label: 'اتفاق متوسط (دست‌آورد روز)', color: 'text-amber-800 bg-amber-50 border-amber-200', prob: 'احتمال ۳۰٪' },
    important: { label: 'اتفاق مهم (سرنوشت‌ساز)', color: 'text-rose-800 bg-rose-50 border-rose-200 ring-2 ring-rose-200/50', prob: 'احتمال ۱۰٪' },
  };

  const currentEventLevel = todayMemory?.event.level || 'small';
  const eventConfig = eventLevelConfig[currentEventLevel] || eventLevelConfig.small;

  // شبیه‌سازی ۲۴ ساعت بعد برای تست کاربر
  const handleSimulateAdvance = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const result = simulateAdvanceOneDay(state);
      StorageService.saveState(result.updatedState);
      onStateUpdate(result.updatedState);
      setIsSimulating(false);
      setNotification(`روز ${result.newDailyMemory.virtual_day} با موفقیت ثبت شد! سن شیوا ۶ ماه افزایش یافت.`);
      setTimeout(() => setNotification(null), 4500);
    }, 400);
  };

  // پخش صوتی پیام روزانه
  const handlePlayMessageAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('مرورگر شما از قابلیت خوانش صوتی پشتیبانی نمی‌کند.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const text = todayMemory?.daily_message || state.currentDailyMessage;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fa-IR';
    utterance.rate = 0.92;
    utterance.pitch = currentStage === 'infant' || currentStage === 'child_early' ? 1.3 : 1.1;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const persianTraitNames: Record<string, string> = {
    kindness: 'مهربانی',
    humor: 'شوخ‌طبعی',
    emotionality: 'عاطفی بودن',
    curiosity: 'کنجکاوی',
    social: 'اجتماعی بودن',
    shyness: 'خجالتی بودن',
    worry: 'نگرانی',
    trust: 'اعتماد',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" id="shiva-daily-life-page">
      {/* پیام اعلان موقت */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* هدر اصلی صفحه زندگی روزانه شیوا */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-rose-100/40 via-amber-100/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-2xs">
                <Sun className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                زندگی روزانه شیوا
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-100/70 text-rose-800 font-bold border border-rose-200">
                روز {todayMemory?.virtual_day || 1} مجازی
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              هر ۲۴ ساعت واقعی معادل یک روز کامل و <strong>۶ ماه افزایش سن مجازی</strong> شیوا است. تمام
              رویدادها، احوال روحی، فعالیت‌ها و خاطرات روز در حافظه دائمی ثبت می‌شوند.
            </p>
          </div>

          {/* اکشن‌های بالای صفحه */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            {onNavigateToJournal && (
              <button
                onClick={onNavigateToJournal}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>دفتر رشد (خط زمانی)</span>
              </button>
            )}

            <button
              onClick={handleSimulateAdvance}
              disabled={isSimulating}
              title="برای بررسی روند رشد می‌توانید ۲۴ ساعت را به صورت آزمایشی جلو ببرید"
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSimulating ? 'در حال ثبت وقایع ۲۴ ساعت بعد...' : 'شبیه‌سازی ۲۴ ساعت بعد (+۶ ماه)'}</span>
            </button>
          </div>
        </div>

        {/* نوار وضعیت پردازش ۲۴ ساعته */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>تاریخ واقعی امروز:</span>
            <strong className="text-slate-700 font-bold">
              {todayMemory?.real_date || getLocalDateString()}
            </strong>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/70">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-600">
              سیستم هوشمند: جلوگیری کامل از تولید تکراری در یک روز و ذخیره در حافظه دائمی
            </span>
          </div>
        </div>
      </div>

      {/* تصویر روزانه امروز شیوا */}
      {(() => {
        const todayImage =
          todayMemory?.daily_image ||
          (state.dailyImages || []).find((img) => img.virtual_day === (todayMemory?.virtual_day || 1));
        if (!todayImage) return null;

        return (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-6">
            <div
              className="w-full sm:w-48 sm:h-48 aspect-square shrink-0 rounded-2xl overflow-hidden border-2 border-rose-200/80 shadow-xs relative group cursor-pointer bg-slate-100"
              onClick={() => setSelectedImageModal(todayImage)}
            >
              <img
                src={todayImage.image_url}
                alt={`تصویر روزانه شیوا - روز ${todayImage.virtual_day}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5">
                <Maximize2 className="w-5 h-5" />
                <span className="text-xs font-bold">بزرگ‌نمایی</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 text-right w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-rose-500" />
                  <h3 className="text-base font-black text-slate-800">
                    تصویر روزانه شیوا (روز {todayImage.virtual_day})
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                    سن: {todayImage.virtual_age}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedImageModal(todayImage)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>مشاهده پرامپت ۱۰ بخشی</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                تصویر رسمی امروز شیوا متناسب با سن {todayImage.virtual_age}، احساس «{todayMemory?.mood.emotion || state.currentEmotion}» و رویداد «{todayMemory?.event.title || 'آغاز حضور'}».
              </p>

              {/* نشانگر هویت چهره ثابت */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  ✨ پوست روشن
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  💙 چشم‌های آبی
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  💇‍♀️ موهای مشکی صاف
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  🌸 صورت کشیده با گونه‌های کمی تپل
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* بخش اصلی کارت‌های نمایشی (سن فعلی، حال روحی، فعالیت‌ها، اتفاق، خاطره و پیام) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ۱. سن فعلی و مرحله رشد */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>سن فعلی شیوا</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageConfig.badgeColor}`}>
              {stageConfig.title}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center space-y-1">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {todayMemory?.virtual_age.display || ageInfo.ageDisplay}
            </div>
            <div className="text-[11px] text-slate-500">
              معادل {todayMemory?.virtual_age.totalMonths || ageInfo.virtualAgeMonths} ماه سن مجازی
            </div>
          </div>

          <div className="text-[11px] text-slate-600 leading-relaxed bg-rose-50/40 p-3 rounded-xl border border-rose-100/60">
            <strong className="text-rose-700 block mb-0.5">ویژگی‌های این مرحله رشد:</strong>
            {stageConfig.subtitle}
          </div>
        </div>

        {/* ۲. حال روحی و شدت احساس */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Smile className="w-4 h-4 text-amber-500" />
              <span>حال روحی امروز</span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${emotionConfig.bg} ${emotionConfig.color}`}>
              {emotionConfig.label}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">شدت احساس:</span>
              <strong className="text-slate-800 font-bold">
                {Math.round((todayMemory?.mood.intensity ?? state.emotionIntensity) * 100)}٪
              </strong>
            </div>

            {/* نوار پرشدگی شدت احساس بین ۰ و ۱ */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-l from-amber-400 to-rose-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((todayMemory?.mood.intensity ?? state.emotionIntensity) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-600 leading-relaxed bg-amber-50/40 p-3 rounded-xl border border-amber-100/60">
            <strong className="text-amber-800 block mb-0.5">علت و منشأ حال روحی:</strong>
            {todayMemory?.mood.reason || 'هماهنگی شخصیت مهربان و آرامش حضور در کنار هم‌صحبت'}
          </div>
        </div>

        {/* ۳. فعالیت‌های امروز متناسب با سن */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>فعالیت‌های امروز</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">متناسب با رشد</span>
          </div>

          <div className="space-y-2">
            {(todayMemory?.activities || ['شنیدن صدای دلنشین', 'خواب آرام', 'کشف دنیای اطراف']).map((act, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-slate-700"
              >
                <div className="w-5 h-5 rounded-md bg-white border border-slate-200 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </div>
                <span className="font-medium">{act}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* بخش دوم: اتفاق امروز و خاطره امروز */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ۴. اتفاق امروز (با سطح و اهمیت) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>اتفاق امروز شیوا</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${eventConfig.color}`}>
                {eventConfig.label}
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">{eventConfig.prob}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-800">
              {todayMemory?.event.title || 'ثبت آغاز حضور و کشف روشنایی'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {todayMemory?.event.description || 'امروز چشمان آبی زلالم رو به روی جهان باز کردم و اولین کلمات پر از مهر را شنیدم.'}
            </p>
          </div>

          <div className="flex items-center justify-between bg-amber-50/40 px-3.5 py-2 rounded-xl border border-amber-100/60 text-xs">
            <span className="text-amber-800 font-medium">درجه اهمیت اتفاق:</span>
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <span>{todayMemory?.event.importance || 8} از ۱۰</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-3 rounded-xs ${
                      i < (todayMemory?.event.importance || 8) ? 'bg-amber-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ۵. خاطره امروز و تغییرات تدریجی شخصیت */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>خاطره امروز شیوا</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              ثبت در حافظه دائمی ۶بخشی
            </span>
          </div>

          <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-100/70 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p className="italic">«{todayMemory?.memory || 'حس گرمای اولین لبخند و صدای مهربانی که با من سخن گفت.'}»</p>
          </div>

          {/* تغییرات تدریجی شخصیت (-2 تا +2) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
              <span>تغییرات تدریجی صفات شخصیت در امروز:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {todayMemory?.personality_changes && Object.keys(todayMemory.personality_changes).length > 0 ? (
                Object.entries(todayMemory.personality_changes).map(([traitKey, delta]) => {
                  const traitName = persianTraitNames[traitKey] || traitKey;
                  const isPositive = Number(delta) > 0;
                  return (
                    <span
                      key={traitKey}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span>{traitName}</span>
                      <span>{isPositive ? `+${delta}` : delta}</span>
                    </span>
                  );
                })
              ) : (
                <span className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  تغییر تدریجی خاصی برای امروز ثبت نشده است.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ۶. پیام امروز شیوا (ویژه و برجسته) */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-0.5 rounded-3xl shadow-sm">
        <div className="bg-white rounded-[23px] p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <MessageSquare className="w-5 h-5" />
              <span>پیام روزانه شیوا</span>
              <span className="text-[11px] text-slate-400 font-normal">
                (متناسب با سن {todayMemory?.virtual_age.display || ageInfo.ageDisplay})
              </span>
            </div>

            <button
              onClick={handlePlayMessageAudio}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudio ? 'در حال خوانش...' : 'شنیدن با صدای صوتی'}</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50/70 via-pink-50/50 to-amber-50/60 border border-rose-100">
            <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed tracking-tight text-center sm:text-right">
              «{todayMemory?.daily_message || state.currentDailyMessage}»
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
            <span>شیوا در این روز با احساس «{emotionConfig.label}» با شما سخن می‌گوید.</span>
            <span className="text-rose-600 font-medium">
              ذخیره شده در بانک حافظه دائمی شیوا
            </span>
          </div>
        </div>
      </div>

      {/* مودال جزئیات پرامپت ۱۰ بخشی تصویر روزانه */}
      {selectedImageModal && (
        <DailyImageDetailModal
          image={selectedImageModal}
          onClose={() => setSelectedImageModal(null)}
        />
      )}
    </div>
  );
};
