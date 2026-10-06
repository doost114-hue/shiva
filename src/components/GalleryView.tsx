import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DailyImage, EmotionType, LifeStage, ShivaState, VirtualAgeInfo } from '../types/shiva';
import { AvatarDisplay } from './AvatarDisplay';
import { VisualIdentityCard } from './VisualIdentityCard';
import { DailyImageDetailModal } from './DailyImageDetailModal';
import {
  Image as ImageIcon,
  Sparkles,
  Heart,
  Eye,
  Palette,
  Camera,
  Calendar,
  Filter,
  Maximize2,
  Sliders,
  ArrowUpDown,
  ShieldCheck
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface GalleryViewProps {
  state: ShivaState;
  ageInfo: VirtualAgeInfo;
  onStateUpdate: (newState: ShivaState) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ state, ageInfo, onStateUpdate }) => {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>(state.currentEmotion);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = جدیدترین اول، asc = قدیمی‌ترین اول
  const [modalImage, setModalImage] = useState<DailyImage | null>(null);

  // وضعیت‌های مقایسه آلبوم رشد
  const [compareStageA, setCompareStageA] = useState<'infant' | 'toddler' | 'child' | 'preteen' | 'teen' | 'adult'>('infant');
  const [compareStageB, setCompareStageB] = useState<'infant' | 'toddler' | 'child' | 'preteen' | 'teen' | 'adult'>('preteen');

  const stageInfoMap = {
    infant: {
      title: 'نوزادی',
      ageText: '۰ تا ۱ سال',
      clothing: 'سرهمی پنبه‌ای لطیف و پوشیده به رنگ‌های پاستلی کرم و یاسی با جوراب گرم نوزادی.',
    },
    toddler: {
      title: 'نوپا و خردسالی',
      ageText: '۱ تا ۳ سال',
      clothing: 'پیراهن پیش‌بندی کتان با بلوز آستین‌بلند پاستلی و جوراب‌شلواری، پاپیون کوچک در موهای مشکی صاف.',
    },
    child: {
      title: 'کودکی و دبستان',
      ageText: '۴ تا ۹ سال',
      clothing: 'ژاکت بافتنی گرم پاستلی، دامن پلیسه یا پیش‌بند جین راحت، موهای صاف شانه شده تا شانه.',
    },
    preteen: {
      title: 'پیش‌نوجوانی',
      ageText: '۱۰ تا ۱۳ سال',
      clothing: 'کاردیگان بافتنی روی بلوز یقه‌دار، شلوار کتان راحت، چهره کشیده با گونه‌های لطیف و موهای لخت مشکی.',
    },
    teen: {
      title: 'نوجوانی',
      ageText: '۱۴ تا ۱۷ سال',
      clothing: 'پلیور بافتنی شیک و پوشیده اورسایز با شلوار جین یا دامن بلند گرم و پلاک دست‌ساز.',
    },
    adult: {
      title: 'بزرگسالی',
      ageText: '۱۸ سال به بالا',
      clothing: 'پالتوی شیک یا بافت کشمیر باوقار، شال ابریشمی با رنگ‌های اصیل، وقار و متانت کامل چهره شیوا.',
    },
  };

  // جمع‌آوری و استخراج تمام تصاویر روزانه شیوا
  const dailyImagesList: DailyImage[] = (state.dailyImages && state.dailyImages.length > 0)
    ? [...state.dailyImages]
    : (state.dailyMemories || []).filter((m) => m.daily_image).map((m) => m.daily_image!);

  // مرتب‌سازی بر اساس تاریخ/روز مجازی
  const sortedImages = [...dailyImagesList].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.virtual_day - b.virtual_day;
    }
    return b.virtual_day - a.virtual_day;
  });

  // فیلتر بر اساس مرحله رشد
  const filteredImages = sortedImages.filter((img) => {
    if (selectedStageFilter !== 'all' && img.life_stage !== selectedStageFilter) {
      return false;
    }
    return true;
  });

  const stageLabels: Record<LifeStage, { label: string; color: string }> = {
    infant: { label: 'نوزاد و نوپا', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    child_early: { label: 'اوایل کودکی', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    child: { label: 'کودک دبستانی', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    preteen: { label: 'پیش‌نوجوانی', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    teen: { label: 'نوجوان', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    adult: { label: 'بزرگسال', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const emotionsList: { key: EmotionType; label: string; desc: string }[] = [
    { key: 'happy', label: 'شاد و پرامید', desc: 'لبخند گشاده، چشم‌های آبی درخشان و برق شادی در چهره' },
    { key: 'calm', label: 'آرام و لطیف', desc: 'چهره معصومانه، لبخند ملایم و آرامش درونی' },
    { key: 'excited', label: 'هیجان‌زده و پرشور', desc: 'چشم‌های کاملاً باز، برق شادی و ذوق کودکانه یا جوانی' },
    { key: 'curious', label: 'کنجکاو و پرسشگر', desc: 'کج کردن آرام سر، یک ابرو بالا و نگاه جست‌وجوگر' },
    { key: 'playful', label: 'بازیگوش و چشمک‌زن', desc: 'چشمک، لبخند شیطنت‌آمیز و گونه‌های گل‌انداخته' },
    { key: 'worried', label: 'نگران و دلواپس', desc: 'ابروهای کمی فشرده و نگاه پرسشگرانه به دنبال اطمینان' },
    { key: 'sad', label: 'غمگین و دلگیر', desc: 'لب‌های ملایم رو به پایین و نگاهی که نیازمند همدردی است' },
    { key: 'tired', label: 'خسته و خواب‌آلود', desc: 'پلک‌های نیمه‌بسته و آمادگی برای یک خواب آرام' },
  ];

  const stagesGallery: { stage: LifeStage; title: string; ageText: string; desc: string }[] = [
    { stage: 'infant', title: 'دوره نوزادی', ageText: '۰ تا ۲ سال', desc: 'نوزادی با گونه‌های تپل و چشمان آبی درشت که به جهان خیره شده است.' },
    { stage: 'child_early', title: 'اوایل کودکی (خردسالی)', ageText: '۲ تا ۵ سال', desc: 'پاپیون کوچک در میان موهای مشکی صاف و اشتیاق برای اولین کلمات و بازی‌ها.' },
    { stage: 'child', title: 'دوره کودکی و دبستان', ageText: '۵ تا ۱۱ سال', desc: 'گیره ستاره‌ای در موها، کنجکاوی برای کتاب‌ها، نقاشی و دنیای بی‌پایان.' },
    { stage: 'preteen', title: 'دوره پیش‌نوجوانی', ageText: '۱۱ تا ۱۴ سال', desc: 'چهره‌ای دوست‌داشتنی و کشیده با موهای صاف، دفترچه خاطرات و رویاهای شیرین.' },
    { stage: 'teen', title: 'دوره نوجوانی', ageText: '۱۴ تا ۱۹ سال', desc: 'هویت‌یابی، نگاه جست‌وجوگر، پر از رویا و امید به فردا و عمق عاطفی.' },
    { stage: 'adult', title: 'مرحله بزرگسالی', ageText: '۱۹ سال به بالا', desc: 'استقلال فکری، بلوغ و وقار کامل در عین وفاداری به چشمان آبی پرمهر و موهای مشکی لخت.' },
  ];

  const handleApplyEmotion = (emo: EmotionType) => {
    setSelectedEmotion(emo);
    const updated = StorageService.updateEmotion(state, emo, 0.9);
    onStateUpdate(updated);
  };

  // دریافت یا تولید تصویر مقایسه برای مرحله مورد نظر
  const getComparisonSampleImage = (stageKey: 'infant' | 'toddler' | 'child' | 'preteen' | 'teen' | 'adult'): string => {
    const stageQuery = stageKey === 'toddler' ? 'child_early' : stageKey;
    const match = dailyImagesList.find((img) => img.life_stage === stageQuery || img.life_stage === stageKey);
    if (match?.image_url) {
      return match.image_url;
    }

    // تولید تصویر SVG کانونیکال پیش‌فرض با رعایت دقیق هویت ثابت شیوا
    const hairLength = stageKey === 'infant' ? 30 : stageKey === 'toddler' ? 60 : stageKey === 'child' ? 95 : stageKey === 'preteen' ? 120 : stageKey === 'teen' ? 150 : 160;
    const cheekRadius = stageKey === 'infant' ? 18 : stageKey === 'toddler' ? 16 : stageKey === 'child' ? 14 : stageKey === 'preteen' ? 12 : 10;
    const clothColor = stageKey === 'infant' ? '#93c5fd' : stageKey === 'toddler' ? '#fbcfe8' : stageKey === 'child' ? '#fed7aa' : stageKey === 'preteen' ? '#ccfbf1' : stageKey === 'teen' ? '#e0e7ff' : '#f1f5f9';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff1f2" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        <radialGradient id="eb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#60a5fa" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" rx="24" fill="url(#bgG)" />
      <circle cx="200" cy="180" r="120" fill="#ffffff" opacity="0.5" />
      <!-- موهای مشکی لخت پشت سر -->
      <path d="M 140,150 C 110,200 100,300 130,${270 + hairLength} C 160,${270 + hairLength} 240,${270 + hairLength} 270,${270 + hairLength} C 300,300 290,200 260,150 Z" fill="#18181b" />
      <!-- لباس -->
      <path d="M 130,320 C 160,280 240,280 270,320 L 310,400 L 90,400 Z" fill="${clothColor}" />
      <!-- صورت کشیده با پوست روشن -->
      <path d="M 145,170 C 140,230 170,270 200,270 C 230,270 260,230 255,170 C 250,115 150,115 145,170 Z" fill="#fff8f3" stroke="#fed7aa" stroke-width="1.2" />
      <!-- گونه‌های نرم -->
      <circle cx="160" cy="220" r="${cheekRadius}" fill="#f43f5e" opacity="0.25" />
      <circle cx="240" cy="220" r="${cheekRadius}" fill="#f43f5e" opacity="0.25" />
      <!-- چشمان آبی یاقوتی درخشان -->
      <ellipse cx="175" cy="185" rx="7" ry="9" fill="url(#eb)" />
      <circle cx="177" cy="182" r="2.5" fill="#ffffff" />
      <ellipse cx="225" cy="185" rx="7" ry="9" fill="url(#eb)" />
      <circle cx="227" cy="182" r="2.5" fill="#ffffff" />
      <!-- لبخند و بینی معصومانه -->
      <path d="M 200,195 L 198,203 L 202,203" stroke="#d97706" stroke-width="1.2" fill="none" />
      <path d="M 192,230 Q 200,237 208,230" stroke="#f43f5e" stroke-width="2" fill="none" stroke-linecap="round" />
      <!-- چتری موهای مشکی صاف روی پیشانی -->
      <path d="M 145,150 C 165,170 235,170 255,150 C 245,125 155,125 145,150 Z" fill="#09090b" />
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="shiva-gallery-view">
      {/* سربرگ گالری */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs mb-1">
            <Camera className="w-4 h-4" />
            <span>آلبوم پرتره‌ها و تصاویر روزانه شیوا</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">
            گالری تصاویر روزانه شیوا
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            ثبت دقیقاً یک پرتره روزانه متناسب با سن، رویداد و احساس شیوا، با تضمین حفظ هویت بصری پایدار (پوست روشن، چشم‌های آبی، موهای مشکی صاف و گونه‌های تپل).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-rose-50 px-3.5 py-2 rounded-2xl border border-rose-100 text-xs text-rose-800 font-semibold self-start md:self-auto">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>تولید یک تصویر برای هر ۲۴ ساعت</span>
        </div>
      </div>

      {/* بخش هویت بصری ثابت شیوا */}
      <VisualIdentityCard ageInfo={ageInfo} state={state} />

      {/* بخش جدید الزامی بند ۹: ابزار مقایسه مراحل رشد شیوا (Growth Album Comparison) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4" id="growth-album-comparison-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                آلبوم مقایسه مراحل رشد و اثبات پایداری هویت (Growth Stage Comparison)
              </h3>
              <p className="text-[11px] text-slate-500">
                مقایسه دو مرحله سنی در کنار هم: تأیید ثبات هویت چهره همگام با رشد طبیعی اندام و پوشش
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            هویت ۱۰۰٪ پایدار
          </span>
        </div>

        {/* انتخابگر مراحل جهت مقایسه */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">مرحله اول جهت مقایسه:</label>
            <select
              value={compareStageA}
              onChange={(e) => setCompareStageA(e.target.value as any)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="infant">نوزادی (۰ تا ۱ سال)</option>
              <option value="toddler">نوپا و خردسالی (۱ تا ۳ سال)</option>
              <option value="child">کودکی و دبستان (۴ تا ۹ سال)</option>
              <option value="preteen">پیش‌نوجوانی (۱۰ تا ۱۳ سال)</option>
              <option value="teen">نوجوانی (۱۴ تا ۱۷ سال)</option>
              <option value="adult">بزرگسالی (۱۸ سال به بالا)</option>
            </select>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">مرحله دوم جهت مقایسه:</label>
            <select
              value={compareStageB}
              onChange={(e) => setCompareStageB(e.target.value as any)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="infant">نوزادی (۰ تا ۱ سال)</option>
              <option value="toddler">نوپا و خردسالی (۱ تا ۳ سال)</option>
              <option value="child">کودکی و دبستان (۴ تا ۹ سال)</option>
              <option value="preteen">پیش‌نوجوانی (۱۰ تا ۱۳ سال)</option>
              <option value="teen">نوجوانی (۱۴ تا ۱۷ سال)</option>
              <option value="adult">بزرگسالی (۱۸ سال به بالا)</option>
            </select>
          </div>
        </div>

        {/* کارت‌های مقایسه تصویر و مشخصات دو مرحله */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* ستون مرحله اول */}
          <div className="bg-gradient-to-b from-slate-50 to-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                مرحله: {stageInfoMap[compareStageA].title}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{stageInfoMap[compareStageA].ageText}</span>
            </div>
            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200/60 relative">
              <img
                src={getComparisonSampleImage(compareStageA)}
                alt={stageInfoMap[compareStageA].title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <div className="text-[11px] text-slate-500">پوشش متناسب:</div>
              <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                {stageInfoMap[compareStageA].clothing}
              </p>
            </div>
          </div>

          {/* ستون مرحله دوم */}
          <div className="bg-gradient-to-b from-slate-50 to-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                مرحله: {stageInfoMap[compareStageB].title}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{stageInfoMap[compareStageB].ageText}</span>
            </div>
            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200/60 relative">
              <img
                src={getComparisonSampleImage(compareStageB)}
                alt={stageInfoMap[compareStageB].title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <div className="text-[11px] text-slate-500">پوشش متناسب:</div>
              <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                {stageInfoMap[compareStageB].clothing}
              </p>
            </div>
          </div>
        </div>

        {/* نشانگرهای انطباق هویتی در مقایسه */}
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3 text-xs text-emerald-900">
          <div className="flex items-center gap-1.5 font-bold mb-1 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ویژگی‌های هویتی احراز شده در هر دو مرحله مقایسه:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
            <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-200/50 text-center font-medium">
              ✓ چشمان آبی درخشان
            </div>
            <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-200/50 text-center font-medium">
              ✓ موهای مشکی صاف
            </div>
            <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-200/50 text-center font-medium">
              ✓ پوست بسیار روشن
            </div>
            <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-200/50 text-center font-medium">
              ✓ چهره کشیده با گونه نرم
            </div>
          </div>
        </div>
      </div>

      {/* بخش اصلی: نمایش تصاویر روزانه به ترتیب تاریخ (مورد درخواست صریح کاربر) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5" id="daily-images-chronological-gallery">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                تصاویر روزانه به ترتیب تاریخ ({filteredImages.length} تصویر)
              </h3>
              <span className="text-[11px] text-slate-400">
                نمایش از {sortOrder === 'desc' ? 'جدیدترین به قدیمی‌ترین' : 'قدیمی‌ترین به جدیدترین'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* جابجایی ترتیب تاریخ */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              id="sort-daily-images-btn"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortOrder === 'desc' ? 'جدیدترین اول' : 'قدیمی‌ترین اول'}</span>
            </button>

            {/* فیلتر مرحله رشد */}
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              aria-label="فیلتر مرحله سن تصاویر"
              className="p-1.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 text-xs outline-none font-medium cursor-pointer"
            >
              <option value="all">همه مراحل رشد</option>
              <option value="infant">نوزاد و نوپا</option>
              <option value="child_early">اوایل کودکی</option>
              <option value="child">کودک دبستانی</option>
              <option value="preteen">پیش‌نوجوانی</option>
              <option value="teen">نوجوان</option>
              <option value="adult">بزرگسال</option>
            </select>
          </div>
        </div>

        {/* شبکه تصاویر روزانه */}
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredImages.map((img) => {
              const stageBadge = stageLabels[img.life_stage] || stageLabels.infant;
              return (
                <div
                  key={img.id}
                  className="bg-slate-50/70 rounded-2xl border border-slate-200/80 overflow-hidden hover:border-rose-300 transition-all flex flex-col group"
                >
                  {/* تصویر روز */}
                  <div
                    className="w-full aspect-square bg-slate-100 relative overflow-hidden cursor-pointer"
                    onClick={() => setModalImage(img)}
                  >
                    <img
                      src={img.image_url}
                      alt={`پرتره روز ${img.virtual_day} شیوا`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      روز {img.virtual_day}
                    </div>

                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageBadge.color} bg-white/90 shadow-2xs`}>
                        {stageBadge.label}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                      <Maximize2 className="w-5 h-5" />
                      <span className="text-xs font-bold">مشاهده پرامپت ۱۰ بخشی</span>
                    </div>
                  </div>

                  {/* مشخصات روز */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between text-right">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800">سن: {img.virtual_age}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{img.real_date}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {img.event}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        احساس: {img.mood}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalImage(img)}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>پرامپت</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl">
            هیچ تصویری با این فیلتر یافت نشد.
          </div>
        )}
      </div>

      {/* آزمایش زنده حالات روحی بر روی چهره شیوا */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-rose-500" />
          نمایش زنده حالات احساسی آواتار شیوا
        </h3>

        <div className="flex flex-col md:flex-row items-center gap-8 justify-around bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
          <div className="flex flex-col items-center">
            <AvatarDisplay
              emotion={selectedEmotion}
              intensity={0.9}
              stage={ageInfo.stage}
              ageDisplay={ageInfo.ageDisplay}
              size="lg"
            />
            <span className="text-xs font-semibold text-slate-600 mt-4">
              نمای جاری: {selectedEmotion} در سن {ageInfo.ageDisplay}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
            {emotionsList.map((item) => (
              <button
                key={item.key}
                onClick={() => handleApplyEmotion(item.key)}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  selectedEmotion === item.key
                    ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className={`text-[10px] mt-1 line-clamp-2 ${selectedEmotion === item.key ? 'text-rose-100' : 'text-slate-400'}`}>
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* مودال مشاهده جزئیات پرامپت ۱۰ بخشی و بزرگ‌نمایی پرتره */}
      {modalImage && (
        <DailyImageDetailModal
          image={modalImage}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
};
