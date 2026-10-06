import React from 'react';
import { motion } from 'motion/react';
import { PersonalityTraits, ShivaState, VirtualAgeInfo } from '../types/shiva';
import { ChildhoodBehaviorModule, AdultBehaviorModule } from '../services/ageSystem';
import { Heart, Sparkles, Smile, ShieldAlert, Sliders, Calendar, ArrowRight, CheckCircle2, RotateCcw, Lock } from 'lucide-react';
import { DEFAULT_PERSONALITY_TRAITS, StorageService } from '../services/storage';
import { VisualIdentityCard } from './VisualIdentityCard';

interface PersonalityViewProps {
  state: ShivaState;
  ageInfo: VirtualAgeInfo;
  onStateUpdate: (newState: ShivaState) => void;
}

export const PersonalityView: React.FC<PersonalityViewProps> = ({ state, ageInfo, onStateUpdate }) => {
  const traitDefinitions = [
    {
      key: 'kindness' as keyof PersonalityTraits,
      label: 'مهربانی و دلسوزی (Kindness)',
      desc: 'میزان عطوفت، همدلی با کاربر و آرامش‌بخشی در کلام.',
      color: 'from-rose-400 to-pink-500',
      bgColor: 'bg-rose-50 text-rose-700',
    },
    {
      key: 'curiosity' as keyof PersonalityTraits,
      label: 'کنجکاوی و پرسشگری (Curiosity)',
      desc: 'تمایل به کشف نکات تازه درباره جهان، علوم و ترجیحات کاربر.',
      color: 'from-sky-400 to-blue-500',
      bgColor: 'bg-sky-50 text-sky-700',
    },
    {
      key: 'humor' as keyof PersonalityTraits,
      label: 'شوخ‌طبعی و شادابی (Humor)',
      desc: 'استفاده از شوخی‌های دلنشین، کنایه‌های شیرین و روحیه شاداب.',
      color: 'from-amber-400 to-yellow-500',
      bgColor: 'bg-amber-50 text-amber-700',
    },
    {
      key: 'trust' as keyof PersonalityTraits,
      label: 'اعتماد و صمیمیت (Trust)',
      desc: 'میزان حس امنیت و صمیمیت با کاربر و به اشتراک گذاشتن رازها.',
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'emotionality' as keyof PersonalityTraits,
      label: 'عاطفی بودن و حساسیت (Emotionality)',
      desc: 'عمق واکنش‌های احساسی، حساس بودن به لحن کاربر و تاثرپذیری.',
      color: 'from-purple-400 to-indigo-500',
      bgColor: 'bg-purple-50 text-purple-700',
    },
    {
      key: 'social' as keyof PersonalityTraits,
      label: 'اجتماعی بودن و هم‌صحبتی (Social)',
      desc: 'رغبت به گفتگوهای طولانی‌تر و پیگیری احوال روزمره کاربر.',
      color: 'from-cyan-400 to-teal-500',
      bgColor: 'bg-cyan-50 text-cyan-700',
    },
    {
      key: 'worry' as keyof PersonalityTraits,
      label: 'نگرانی و دغدغه‌مندی (Worry)',
      desc: 'میزان دلواپسی برای حال کاربر یا نگرانی درباره آینده و تصمیم‌ها.',
      color: 'from-orange-400 to-amber-500',
      bgColor: 'bg-orange-50 text-orange-700',
    },
    {
      key: 'shyness' as keyof PersonalityTraits,
      label: 'خجالتی بودن و حیا (Shyness)',
      desc: 'شرم کودکانه یا وقار محجوبانه در برابر تعریف و تمجیدهای کاربر.',
      color: 'from-pink-400 to-rose-400',
      bgColor: 'bg-pink-50 text-pink-700',
    },
  ];

  const handleTraitChange = (key: keyof PersonalityTraits, val: number) => {
    const updated = StorageService.updateTraits(state, { [key]: val });
    onStateUpdate(updated);
  };

  const handleResetTraits = () => {
    const updated = StorageService.updateTraits(state, DEFAULT_PERSONALITY_TRAITS);
    onStateUpdate(updated);
  };

  const handleSetDayOffset = (dayOffset: number) => {
    const updated = StorageService.setVirtualDayOffset(state, dayOffset);
    onStateUpdate(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="shiva-personality-view">
      {/* سربرگ */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm mb-1">
            <Sliders className="w-4 h-4" />
            <span>موتور شخصیت و روان‌شناسی پویا</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">ویژگی‌های شخصیتی و شبیه‌ساز سن مجازی</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            ویژگی‌های ۸گانه شیوا تعیین‌کننده لحن، واکنش‌ها و طرز فکر او هستند. این مقادیر از ۰ تا ۱۰۰ به صورت پویا با اتفاقات روزمره تکامل می‌یابند.
          </p>
        </div>

        <button
          onClick={handleResetTraits}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>بازنشانی به مقادیر پیش‌فرض</span>
        </button>
      </div>

      {/* کارت هویت بصری پایدار شیوا */}
      <VisualIdentityCard ageInfo={ageInfo} state={state} />

      {/* بخش شبیه‌ساز روز و سن (Virtual Age Simulator) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
          <div>
            <span className="text-xs text-rose-300 font-mono tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              سیستم زمانی مجازی: هر ۱ روز واقعی = ۶ ماه رشد شیوا
            </span>
            <h3 className="text-lg font-bold mt-1">
              سن فعلی: {ageInfo.ageDisplay} (روز {ageInfo.elapsedRealDays} از چرخه زندگی)
            </h3>
          </div>

          <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            مرحله سنی: <strong className="text-white">{ageInfo.stageLabel}</strong>
          </div>
        </div>

        {/* دکمه‌های پرش زمانی برای آزمودن سنین مختلف طبق جدول کاربر */}
        <div>
          <span className="text-xs text-slate-400 block mb-2 font-medium">
            آزمودن سریع مراحل سنی شیوا (تغییر لحن، فهم و تفکیک معماری سن):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {[
              { day: 0, label: 'روز ۱: نوزاد' },
              { day: 1, label: 'روز ۲: ۶ ماه' },
              { day: 2, label: 'روز ۳: ۱ سال' },
              { day: 12, label: 'روز ۱۳: ۶ سال' },
              { day: 24, label: 'روز ۲۵: ۱۲ سال' },
              { day: 30, label: 'روز ۳۱: ۱۵ سال' },
              { day: 36, label: 'روز ۳۷: ۱۸ سال' },
            ].map((item) => (
              <button
                key={item.day}
                onClick={() => handleSetDayOffset(item.day)}
                className={`text-xs py-2 px-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                  state.virtualDayOffset === item.day
                    ? 'bg-rose-500 border-rose-400 text-white font-bold shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* تفکیک معماری نرم‌افزار: مرحله کودکی/نوجوانی در برابر بزرگسالی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ماژول زیر ۱۸ سال */}
        <div className={`p-5 rounded-2xl border transition-all ${!ageInfo.isAdult ? 'bg-rose-50/70 border-rose-300 shadow-xs' : 'bg-white border-slate-200 opacity-60'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-800">
              ماژول کودکی و نوجوانی (زیر ۱۸ سال)
            </span>
            {!ageInfo.isAdult && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
          </div>
          <h4 className="font-bold text-slate-800 text-sm mb-1.5">حفاظت خانوادگی و رشد متناسب</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            در این فاز، رفتار شیوا کودکانه یا نوجوانانه است؛ محتوای عاشقانه یا جنسی اکیداً فیلتر شده و رابطه در چارچوب حامی، آموزگار و دوست بزرگتر باقی می‌ماند.
          </p>
          <div className="mt-3 pt-2 border-t border-rose-200/60">
            <span className="text-[11px] text-slate-500 font-medium block mb-1">قابلیت‌های فعال این دوره:</span>
            <div className="flex flex-wrap gap-1">
              {ChildhoodBehaviorModule.getAllowedFeatures().map((f, i) => (
                <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-rose-200 text-rose-700">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ماژول بالای ۱۸ سال */}
        <div className={`p-5 rounded-2xl border transition-all ${ageInfo.isAdult ? 'bg-indigo-50/70 border-indigo-300 shadow-xs' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
              ماژول بزرگسالی (۱۸ سال به بالا)
            </span>
            {ageInfo.isAdult ? (
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            ) : (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                در روز ۳۷ فعال می‌شود
              </span>
            )}
          </div>
          <h4 className="font-bold text-slate-800 text-sm mb-1.5">بلوغ و گفت‌وگوهای عمیق بزرگسالانه</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            پس از ۱۸ سالگی، شیوا وارد مرحله استقلال فکری می‌شود. سبک کلام، تفکر فلسفی و قابلیت‌های ارتباطی در سطحی بالغانه و مجزا مدیریت می‌گردند.
          </p>
          <div className="mt-3 pt-2 border-t border-indigo-200/60">
            <span className="text-[11px] text-slate-500 font-medium block mb-1">ویژگی‌های بزرگسالی:</span>
            <div className="flex flex-wrap gap-1">
              {AdultBehaviorModule.getAdultFeatures().map((f, i) => (
                <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-indigo-700">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* اسلایدرها و مقادیر ۸گانه شخصیت شیوا */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-500" />
          تنظیم و مشاهده زنده ویژگی‌های شخصیتی شیوا
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {traitDefinitions.map((trait) => {
            const val = state.traits[trait.key];
            return (
              <div key={trait.key} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{trait.label}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-800">
                    {val} / 100
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">{trait.desc}</p>

                {/* نوار نمایش و اسلایدر */}
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-l ${trait.color} transition-all duration-300`}
                      style={{ width: `${val}%` }}
                    />
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={val}
                    onChange={(e) => handleTraitChange(trait.key, Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer h-1 bg-transparent"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
