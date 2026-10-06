import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DailyEventLevel,
  DailyImage,
  DailyMemory,
  EmotionType,
  LifeStage,
  ShivaState,
  VirtualAgeInfo,
} from '../types/shiva';
import {
  BookOpen,
  Calendar,
  Sparkles,
  Activity,
  Star,
  MessageSquare,
  Filter,
  Search,
  Clock,
  Heart,
  TrendingUp,
  Smile,
  ShieldCheck,
  ChevronDown,
  Camera,
  Maximize2
} from 'lucide-react';
import { simulateAdvanceOneDay } from '../services/dailyLifeSystem';
import { StorageService } from '../services/storage';
import { DailyImageDetailModal } from './DailyImageDetailModal';

interface GrowthJournalViewProps {
  state: ShivaState;
  ageInfo: VirtualAgeInfo;
  onStateUpdate: (newState: ShivaState) => void;
  onNavigateToDailyLife?: () => void;
}

export const GrowthJournalView: React.FC<GrowthJournalViewProps> = ({
  state,
  ageInfo,
  onStateUpdate,
  onNavigateToDailyLife,
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<DailyImage | null>(null);

  // فهرست خاطرات روزانه مرتب‌شده از جدید به قدیم
  const dailyList: DailyMemory[] = state.dailyMemories || [];

  // فیلتر کردن فهرست
  const filteredList = dailyList.filter((entry) => {
    if (selectedStage !== 'all' && entry.life_stage !== selectedStage) {
      return false;
    }
    if (selectedLevel !== 'all' && entry.event.level !== selectedLevel) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchText =
        `${entry.event.title} ${entry.event.description} ${entry.memory} ${entry.daily_message} ${entry.activities.join(' ')}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const result = simulateAdvanceOneDay(state);
      StorageService.saveState(result.updatedState);
      onStateUpdate(result.updatedState);
      setIsSimulating(false);
    }, 400);
  };

  const stageLabels: Record<LifeStage, { label: string; color: string }> = {
    infant: { label: 'نوزاد و نوپا', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    child_early: { label: 'اوایل کودکی', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    child: { label: 'کودک دبستانی', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    preteen: { label: 'پیش‌نوجوانی', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    teen: { label: 'نوجوان', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    adult: { label: 'بزرگسال', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const eventBadgeLabels: Record<DailyEventLevel, { label: string; color: string }> = {
    small: { label: 'کوچک', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    medium: { label: 'متوسط', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    important: { label: 'مهم و ویژه', color: 'bg-rose-50 text-rose-800 border-rose-200 font-black' },
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
    <div className="max-w-4xl mx-auto space-y-6" id="shiva-growth-journal-timeline">
      {/* هدر دفتر رشد و خط زمانی */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
            <BookOpen className="w-4 h-4" />
            <span>خط زمانی و تاریخچه رشد</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">
            دفتر رشد شیوا
          </h2>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            مرور تمام روزهای سپری‌شده، تغییرات تدریجی شخصیت، وقایع کوچک و بزرگ، خاطرات دائمی و پیام‌های روزانه شیوا بر روی خط زمانی.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToDailyLife && (
            <button
              onClick={onNavigateToDailyLife}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>مشاهده روز جاری</span>
            </button>
          )}

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'در حال پردازش...' : 'افزودن روز بعد (+۶ ماه)'}</span>
          </button>
        </div>
      </div>

      {/* نوار فیلتر و جستجو */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* جستجو */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در اتفاقات، خاطرات، فعالیت‌ها یا پیام‌ها..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-rose-300 transition-colors"
          />
        </div>

        {/* فیلترها */}
        <div className="flex flex-wrap items-center gap-2">
          {/* فیلتر مرحله رشد */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            aria-label="فیلتر بر اساس مرحله رشد"
            className="p-2 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 outline-none font-medium cursor-pointer"
          >
            <option value="all">همه مراحل رشد</option>
            <option value="infant">نوزاد و نوپا</option>
            <option value="child_early">اوایل کودکی</option>
            <option value="child">کودک دبستانی</option>
            <option value="preteen">پیش‌نوجوانی</option>
            <option value="teen">نوجوان</option>
            <option value="adult">بزرگسال</option>
          </select>

          {/* فیلتر سطح اتفاق */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            aria-label="فیلتر بر اساس اهمیت اتفاق"
            className="p-2 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 outline-none font-medium cursor-pointer"
          >
            <option value="all">همه سطوح اتفاق</option>
            <option value="small">اتفاقات کوچک (۶۰٪)</option>
            <option value="medium">اتفاقات متوسط (۳۰٪)</option>
            <option value="important">اتفاقات مهم (۱۰٪)</option>
          </select>
        </div>
      </div>

      {/* خلاصه آماری خط زمانی */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rose-500" />
          <span>تعداد روزهای ثبت‌شده:</span>
          <strong className="text-slate-800 font-bold">{dailyList.length} روز</strong>
          <span>(نمایش {filteredList.length} مورد)</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>هر روز واقعی = ۶ ماه سن مجازی</span>
        </div>
      </div>

      {/* خط زمانی اصلی (Timeline) */}
      <div className="relative border-r-2 border-slate-200/80 mr-4 sm:mr-6 pr-4 sm:pr-8 space-y-6">
        {filteredList.map((entry, index) => {
          const stageBadge = stageLabels[entry.life_stage] || stageLabels.infant;
          const levelBadge = eventBadgeLabels[entry.event.level] || eventBadgeLabels.small;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="relative space-y-3"
            >
              {/* نقطه اتصال روی خط زمانی */}
              <div className="absolute -right-[23px] sm:-right-[39px] top-6 w-5 h-5 rounded-full bg-white border-4 border-rose-500 shadow-xs flex items-center justify-center z-10" />

              {/* کارت روز */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-rose-200/90 transition-all space-y-4">
                {/* بخش بالایی کارت: شماره روز، سن، تاریخ واقعی، مرحله رشد و حال روحی */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      روز {entry.virtual_day}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-slate-800">
                          {entry.virtual_age.display}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageBadge.color}`}>
                          {stageBadge.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        تاریخ واقعی: {entry.real_date}
                      </span>
                    </div>
                  </div>

                  {/* نشانگر حال روحی */}
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5 font-semibold">
                      <Smile className="w-3.5 h-3.5 text-amber-500" />
                      <span>احساس: {entry.mood.emotion}</span>
                      <span className="text-slate-400">({Math.round(entry.mood.intensity * 100)}٪)</span>
                    </div>
                  </div>
                </div>

                {/* رویداد روز و فعالیت‌ها */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* اتفاق روز */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span>اتفاق روز: {entry.event.title}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${levelBadge.color}`}>
                        {levelBadge.label}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      {entry.event.description}
                    </p>
                  </div>

                  {/* فعالیت‌های روز */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      <span>فعالیت‌های ثبت‌شده:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {entry.activities.map((act, i) => (
                        <span
                          key={i}
                          className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-medium"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* تصویر روزانه ثبت‌شده شیوا */}
                {(() => {
                  const dayImage =
                    entry.daily_image ||
                    (state.dailyImages || []).find((img) => img.virtual_day === entry.virtual_day);
                  if (!dayImage) return null;

                  return (
                    <div className="bg-gradient-to-r from-rose-50/40 to-slate-50 p-3.5 rounded-2xl border border-rose-100/60 flex flex-col sm:flex-row items-center gap-4">
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden border border-rose-200/80 shadow-2xs relative group cursor-pointer bg-slate-100"
                        onClick={() => setSelectedImageModal(dayImage)}
                      >
                        <img
                          src={dayImage.image_url}
                          alt={`تصویر روزانه شیوا در روز ${entry.virtual_day}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-1.5 text-right w-full">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-rose-500" />
                            <span>تصویر روزانه شیوا (پرتره روز {entry.virtual_day})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedImageModal(dayImage)}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-lg bg-white border border-rose-200/70 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>بررسی پرامپت ۱۰ بخشی</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          نمایش چهره با هویت ثابت (پوست روشن، چشم‌های آبی، موهای مشکی صاف و گونه‌های تپل) در سن {entry.virtual_age.display} و وضعیت احساسی {entry.mood.emotion}.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* خاطره روز و پیام شیوا */}
                <div className="space-y-2.5 pt-1 text-xs">
                  {/* خاطره ثبت‌شده */}
                  <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100/70 text-slate-700 leading-relaxed">
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[11px] mb-1">
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      <span>خاطره روزانه ثبت‌شده در حافظه دائمی:</span>
                    </div>
                    <p className="italic">«{entry.memory}»</p>
                  </div>

                  {/* پیام روزانه شیوا */}
                  <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100/70 text-slate-800 leading-relaxed">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px] mb-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>پیام شیوا در این روز:</span>
                    </div>
                    <p className="font-semibold text-slate-800">«{entry.daily_message}»</p>
                  </div>

                  {/* تغییرات تدریجی شخصیت در این روز */}
                  {entry.personality_changes && Object.keys(entry.personality_changes).length > 0 && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تغییر تدریجی شخصیت:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(entry.personality_changes).map(([k, v]) => {
                          const traitLabel = persianTraitNames[k] || k;
                          const isPos = Number(v) > 0;
                          return (
                            <span
                              key={k}
                              className={`px-2 py-0.5 rounded-md border font-bold ${
                                isPos
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {traitLabel} {isPos ? `+${v}` : v}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            موردی مطابق با فیلترها یافت نشد.
          </div>
        )}
      </div>

      {/* مودال مشاهده جزئیات پرامپت ۱۰ بخشی و تصویر روزانه */}
      {selectedImageModal && (
        <DailyImageDetailModal
          image={selectedImageModal}
          onClose={() => setSelectedImageModal(null)}
        />
      )}
    </div>
  );
};
