import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DailyImage, ShivaState, VirtualAgeInfo } from '../types/shiva';
import { AvatarDisplay } from './AvatarDisplay';
import { VisualIdentityCard } from './VisualIdentityCard';
import { DailyImageDetailModal } from './DailyImageDetailModal';
import {
  MessageCircle,
  BookmarkCheck,
  Camera,
  BookOpen,
  Sparkles,
  Heart,
  Brain,
  Sliders,
  Calendar,
  Smile,
  ArrowLeft,
  ShieldCheck,
  Sun,
  Star,
  Activity,
  Maximize2,
  Mic
} from 'lucide-react';

interface DashboardProps {
  state: ShivaState;
  ageInfo: VirtualAgeInfo;
  onNavigate: (tab: 'dashboard' | 'daily' | 'voice' | 'chat' | 'relationship' | 'memories' | 'gallery' | 'journal' | 'personality') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, ageInfo, onNavigate }) => {
  const [selectedImageForModal, setSelectedImageForModal] = useState<DailyImage | null>(null);

  // دریافت آخرین تصویر روزانه شیوا
  const todayMemory = state.dailyMemories?.[0];
  const todayImage = todayMemory?.daily_image || state.dailyImages?.[0];

  // برچسب فارسی احساس
  const emotionLabels: Record<string, string> = {
    happy: 'شاد و پرامید',
    calm: 'آرام و لطیف',
    excited: 'هیجان‌زده و پرانرژی',
    curious: 'کنجکاو و جست‌وجوگر',
    sad: 'غمگین و نیازمند همدلی',
    tired: 'خسته و خواب‌آلود',
    worried: 'نگران و دلواپس',
    playful: 'بازیگوش و شیطنت‌آمیز',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="shiva-main-dashboard">
      {/* بخش خوش‌آمد و معرفی شیوا */}
      <div className="bg-gradient-to-b from-white via-rose-50/20 to-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        {/* عناصر پس‌زمینه لطیف */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-200/20 rounded-full blur-3xl -z-10" />

        {/* برچسب وضعیت هوشمند */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>شخصیت مجازی هوشمند ایرانی</span>
        </div>

        {/* تصویر زنده شیوا منطبق بر مشخصات کاربر */}
        <div className="my-2">
          <AvatarDisplay
            emotion={state.currentEmotion}
            intensity={state.emotionIntensity}
            stage={ageInfo.stage}
            ageDisplay={ageInfo.ageDisplay}
            size="lg"
          />
        </div>

        {/* نام شیوا */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mt-5 tracking-tight flex items-center justify-center gap-2">
          <span>شیوا</span>
          <Heart className="w-6 h-6 text-rose-500 fill-rose-400 inline-block animate-pulse" />
        </h1>

        {/* سن مجازی و مرحله رشد */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
            سن مجازی: {ageInfo.ageDisplay}
          </span>
          <span className="text-sm font-medium text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100">
            مرحله: {ageInfo.stageLabel} (روز {ageInfo.elapsedRealDays} واقعی)
          </span>
          <span className="text-sm font-medium text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-100">
            حال روحی: {emotionLabels[state.currentEmotion] || state.currentEmotion}
          </span>
        </div>

        {/* پیام روزانه شیوا */}
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-xs rounded-2xl p-4 mt-5 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-rose-600 font-bold block mb-1">پیام امروز شیوا برای شما:</span>
          <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
            «{state.currentDailyMessage}»
          </p>
        </div>

        {/* کارت ویژه زندگی روزانه شیوا */}
        <div className="w-full max-w-2xl mt-5 p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-pink-50 border border-rose-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-2xs">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold text-slate-800">
                  زندگی روزانه شیوا (روز {state.dailyMemories?.[0]?.virtual_day || 1})
                </strong>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                  ۲۴ ساعت = ۶ ماه
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                اتفاق امروز: {state.dailyMemories?.[0]?.event.title || 'آغاز حضور و شناخت جهان'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('daily')}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>مشاهده صفحه زندگی روزانه</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* دکمه ویژه صحبت صوتی با شیوا */}
        <div className="w-full max-w-2xl mt-4">
          <button
            onClick={() => onNavigate('voice')}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black">🎙️ صحبت با شیوا</span>
                  <span className="text-[10px] bg-white/30 px-2 py-0.5 rounded-full font-bold">سیستم صوتی</span>
                </div>
                <p className="text-[11px] text-rose-100 font-normal">
                  گفت‌وگوی زنده با صدای فارسی متناسب با سن ({ageInfo.ageDisplay}) و لحن احساسی
                </p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* دکمه‌های اقدام اصلی (مورد درخواست صریح کاربر) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full max-w-3xl mt-4">
          {/* ۱. دکمه گفت‌وگو */}
          <button
            onClick={() => onNavigate('chat')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs transition-all shadow-md shadow-rose-200 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span>شروع گفت‌وگو</span>
          </button>

          {/* ۲. دکمه رابطه با شیوا */}
          <button
            onClick={() => onNavigate('relationship')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition-all shadow-xs cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
            </div>
            <span>رابطه با شیوا</span>
          </button>

          {/* ۳. دکمه زندگی روزانه شیوا */}
          <button
            onClick={() => onNavigate('daily')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition-all shadow-xs cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sun className="w-5 h-5" />
            </div>
            <span>زندگی روزانه</span>
          </button>

          {/* ۴. دکمه دفتر رشد */}
          <button
            onClick={() => onNavigate('journal')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition-all shadow-xs cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>دفتر رشد</span>
          </button>

          {/* ۵. دکمه خاطرات */}
          <button
            onClick={() => onNavigate('memories')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition-all shadow-xs cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <span>بانک خاطرات</span>
          </button>
        </div>
      </div>

      {/* بخش اختصاصی هویت بصری ثابت شیوا (visual_identity) */}
      <VisualIdentityCard />

      {/* بخش ویژه تصویر روزانه شیوا (Daily Image) */}
      {todayImage && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4" id="shiva-today-daily-image-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">تصویر روزانه شیوا (پرتره روز {todayImage.virtual_day})</h3>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    دقیقاً یک تصویر برای هر روز
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  نمایش هماهنگ سن ({todayImage.virtual_age})، فعالیت، احساس و هویت چهره ثابت شیوا
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedImageForModal(todayImage)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                id="view-today-prompt-btn"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>بررسی ساختار ۱۰ بخشی Prompt</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('gallery')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                id="view-all-images-btn"
              >
                <span>آلبوم تصاویر</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-2">
            {/* قاب عکس پرتره روزانه */}
            <div className="md:col-span-4 flex justify-center">
              <div
                className="w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden border-2 border-rose-100 shadow-md relative group cursor-pointer"
                onClick={() => setSelectedImageForModal(todayImage)}
              >
                <img
                  src={todayImage.image_url}
                  alt={`تصویر روزانه شیوا - روز ${todayImage.virtual_day}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 text-white text-xs font-medium justify-between">
                  <span>بزرگ‌نمایی و مشاهده پرامپت</span>
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* جزئیات و نشان‌های تصویر روز */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                  سن: {todayImage.virtual_age}
                </span>
                <span className="text-xs font-medium text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100">
                  رویداد: {todayImage.event}
                </span>
                <span className="text-xs font-medium text-sky-700 bg-sky-50 px-3 py-1 rounded-xl border border-sky-100">
                  احساس: {emotionLabels[todayImage.mood] || todayImage.mood}
                </span>
              </div>

              {todayMemory && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <div className="font-bold text-slate-800 mb-1">فعالیت‌های همگام با تصویر:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {todayMemory.activities.map((act, idx) => (
                      <span key={idx} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
                        • {act}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                این تصویر منعکس‌کننده هویت بصری ماندگار شیوا (پوست روشن، چشم‌های آبی، موهای مشکی صاف و صورت کشیده با لپ‌های ملایم) در تلفیق با رویدادها و سن کنونی است.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* خلاصه‌ای از مشخصات پایه و هویت شیوا */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ظاهر پایه شیوا */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>ظاهر ثابت شیوا</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 leading-relaxed">
            <li>• پوست روشن و شفاف</li>
            <li>• چشم‌های آبی درخشان</li>
            <li>• موهای مشکی صاف و لخت</li>
            <li>• صورت کشیده با گونه نمکین</li>
            <li>• چهره‌ای دلنشین و دوست‌داشتنی</li>
          </ul>
        </div>

        {/* سبک صحبت */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Smile className="w-4 h-4 text-amber-500" />
            <span>سبک صحبت و لحن</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 leading-relaxed">
            <li>• نرم، آرام و باوقار</li>
            <li>• کاملاً متناسب با سن جاری</li>
            <li>• طبیعی و عاری از لحن رباتیک</li>
            <li>• سرشار از مهربانی و کنجکاوی</li>
            <li>• همراه با شوخ‌طبعی ملایم</li>
          </ul>
        </div>

        {/* وضعیت پیوند و رابطه (مرحله ۱۶) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>موتور رابطه (Relationship)</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              نوع رابطه: <strong>{state.relationship?.mode === 'adult_romantic' ? 'عاشقانه بزرگسال' : state.relationship?.mode === 'adult_friendship' ? 'دوستی بزرگسال' : 'مراقبتی و خانوادگی'}</strong>
              <br />
              خط زمانی و {state.interactionHistory?.length || 0} تعامل معنادار ثبت شده است.
            </p>
          </div>
          <button
            onClick={() => onNavigate('relationship')}
            className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:gap-2 transition-all mt-2 cursor-pointer"
          >
            <span>مشاهده ❤️ رابطه با شیوا</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* وضعیت حافظه هوشمند */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Brain className="w-4 h-4 text-indigo-500" />
              <span>حافظه هوشمند ۶ بخشی</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              تاکنون <strong>{state.memory.memories?.length || 0} خاطره دائمی</strong> در دسته‌های ۶ گانه هوشمند ذهن شیوا ثبت شده است.
            </p>
          </div>
          <button
            onClick={() => onNavigate('memories')}
            className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:gap-2 transition-all mt-2 cursor-pointer"
          >
            <span>مشاهده 🧠 خاطرات شیوا</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* خلاصه ویژگی‌های شخصیتی ۸گانه شیوا با دکمه ورود به تنظیمات */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-500" />
            <h3 className="font-bold text-slate-800 text-sm">وضعیت صفات شخصیتی شیوا (۰ تا ۱۰۰)</h3>
          </div>
          <button
            onClick={() => onNavigate('personality')}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>تنظیمات و شبیه‌ساز سن</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'مهربانی', val: state.traits.kindness, color: 'bg-rose-500' },
            { label: 'کنجکاوی', val: state.traits.curiosity, color: 'bg-sky-500' },
            { label: 'شوخ‌طبعی', val: state.traits.humor, color: 'bg-amber-500' },
            { label: 'اعتماد', val: state.traits.trust, color: 'bg-emerald-500' },
            { label: 'عاطفی بودن', val: state.traits.emotionality, color: 'bg-purple-500' },
            { label: 'اجتماعی', val: state.traits.social, color: 'bg-cyan-500' },
            { label: 'نگرانی', val: state.traits.worry, color: 'bg-orange-500' },
            { label: 'خجالتی بودن', val: state.traits.shyness, color: 'bg-pink-500' },
          ].map((t, idx) => (
            <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{t.label}</span>
                <span className="font-bold text-slate-800">{t.val}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${t.color}`} style={{ width: `${t.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* مودال مشاهده جزئیات پرامپت و تصویر روزانه */}
      {selectedImageForModal && (
        <DailyImageDetailModal
          image={selectedImageForModal}
          onClose={() => setSelectedImageForModal(null)}
        />
      )}
    </div>
  );
};
