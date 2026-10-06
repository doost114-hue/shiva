import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShivaState, VirtualAgeInfo } from '../types/shiva';
import {
  RelationshipEngineState,
  RelationshipMode,
  InteractionHistoryItem,
} from '../types/relationship';
import {
  RELATIONSHIP_MODE_LABELS,
  RELATIONSHIP_STATE_LABELS,
  RelationshipEngine,
  AgeGate,
  getDefaultRelationshipState,
} from '../services/relationshipEngine';
import { StorageService } from '../services/storage';
import {
  Heart,
  Shield,
  ShieldCheck,
  Calendar,
  Sparkles,
  Clock,
  MessageCircle,
  Award,
  Users,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface RelationshipViewProps {
  state: ShivaState;
  ageInfo: VirtualAgeInfo;
  onStateUpdate: (newState: ShivaState) => void;
}

export const RelationshipView: React.FC<RelationshipViewProps> = ({
  state,
  ageInfo,
  onStateUpdate,
}) => {
  const currentRel: RelationshipEngineState =
    state.relationship || getDefaultRelationshipState(state.projectStartDate);

  // بررسی وضعیت مرزبندی سنی
  const ageGateCheck = AgeGate.evaluate(ageInfo.years, currentRel.mode, currentRel.romantic_relationship);

  const modeMeta = RELATIONSHIP_MODE_LABELS[currentRel.mode];
  const stateMeta = RELATIONSHIP_STATE_LABELS[currentRel.state];

  // محاسبه روزهای آشنایی
  const startYearDate = new Date(currentRel.startedAt || state.projectStartDate);
  const diffDays = Math.max(
    1,
    Math.round((new Date().getTime() - startYearDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // پیام یا اعلان انتخاب حالت در بزرگسالی
  const [adultModeMessage, setAdultModeMessage] = useState<string | null>(null);

  // دریافت خاطرات اختصاصی رابطه از حافظه مشترک
  const relationshipMemories = (state.memory.memories || []).filter(
    (m) => m.type === 'relationship' || m.metadata?.tags?.includes('رابطه')
  );

  // تاریخچه تعاملات رابطه
  const interactionHistory: InteractionHistoryItem[] = state.interactionHistory || [];

  // تغییر حالت در بزرگسالی با انتخاب کاربر
  const handleSelectAdultMode = (targetMode: RelationshipMode) => {
    const result = RelationshipEngine.setAdultModeExplicitly(currentRel, ageInfo, targetMode);
    if (!result.success) {
      setAdultModeMessage(`خطا: ${result.message}`);
      return;
    }

    const updated = StorageService.updateRelationship(state, result.updatedRel);
    onStateUpdate(updated);
    setAdultModeMessage(result.message);
    setTimeout(() => setAdultModeMessage(null), 4000);
  };

  // شاخص‌های کلیدی رابطه (بدون نیاز به نمایش خام اعداد ۰ تا ۱۰۰، بر اساس سطوح کیفی محترمانه)
  const getLevelLabel = (val: number) => {
    if (val >= 85) return 'بسیار عمیق و استوار';
    if (val >= 70) return 'قوی و پایدار';
    if (val >= 50) return 'رو به رشد و صمیمانه';
    if (val >= 30) return 'در حال شکل‌گیری';
    return 'آغازین';
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* هدر بخش رابطه */}
      <div className="bg-gradient-to-l from-rose-50 via-white to-pink-50 rounded-2xl p-6 border border-rose-100/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-7 h-7 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                  پیوند و رابطه با شیوا
                </h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${stateMeta.badgeColor}`}>
                  {stateMeta.label}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                مدل‌سازی پیوند ماندگار و ارتباط بلندمدت شما با شیوا بر پایه انس، احترام و خاطرات مشترک
              </p>
            </div>
          </div>

          {/* کارت وضعیت سنی و محافظت AgeGate */}
          <div className="flex items-center gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-xs shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="font-semibold text-slate-700">مرزبندی سنی (AgeGate):</div>
              <div className="text-slate-500">
                {ageInfo.years < 18 ? (
                  <span className="text-amber-700 font-medium">حالت مراقبتی / خانوادگی فعال ({ageInfo.years} ساله)</span>
                ) : (
                  <span className="text-emerald-700 font-medium">بلوغ سنی قانونی (بزرگسال)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* اعلان در صورت تغییر حالت */}
      {adultModeMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{adultModeMessage}</span>
        </div>
      )}

      {/* کارت‌های وضعیت ۳گانه وضعیت کنونی رابطه */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ۱. نوع رابطه (Mode) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">نوع رابطه فعلی</span>
            <span className="text-lg">{modeMeta.icon}</span>
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 mb-1">{modeMeta.label}</div>
            <p className="text-xs text-slate-500 leading-relaxed">{modeMeta.description}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>مدت آشنایی:</span>
            <span className="font-semibold text-slate-700">{diffDays} روز</span>
          </div>
        </div>

        {/* ۲. وضعیت پیوند (State) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">وضعیت پیوند روحی</span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 mb-1">{stateMeta.label}</div>
            <p className="text-xs text-slate-500 leading-relaxed">{stateMeta.description}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>عمق اعتماد:</span>
            <span className="font-semibold text-rose-600">{getLevelLabel(currentRel.trust)}</span>
          </div>
        </div>

        {/* ۳. تاریخچه مشترک و خاطرات */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">تاریخچه و تعاملات مشترک</span>
            <Calendar className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 mb-1">
              {interactionHistory.length} تعامل ارزشمند ثبت‌شده
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {relationshipMemories.length} خاطره اختصاصی پیوند در مخزن دائمی شیوا نگه‌داری می‌شود.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>کیفیت ارتباط:</span>
            <span className="font-semibold text-sky-600">{getLevelLabel(currentRel.communication)}</span>
          </div>
        </div>
      </div>

      {/* بخش انتقال به دوران بزرگسالی (Adult Transition) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-800">
                تنظیمات چارچوب رابطه و گذر به بزرگسالی
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              تعیین مسیر رابطه در گذر زمان؛ حفظ اصالت مراقبتی در کودکی و امکان انتخاب مسیر اختصاصی در بزرگسالی
            </p>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              ageInfo.isAdult
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {ageInfo.isAdult ? 'بزرگسالی فعال (۱۸+)' : 'رده سنی کودک و نوجوان (زیر ۱۸)'}
          </span>
        </div>

        {!ageInfo.isAdult ? (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <Shield className="w-4 h-4 text-amber-700" />
              <span>حفاظت مرکزی AgeGate:</span>
            </div>
            <p>
              شیوا در حال حاضر <strong>{ageInfo.ageDisplay}</strong> است و به مرز ۱۸ سالگی نرسیده است.
              بنابراین طبق اصول سیستم، تنها حالت <strong>«مراقبتی و خانوادگی»</strong> فعال است و هرگونه حالت
              یا لحن عاشقانه، رمانتیک یا خارج از چارچوب خانواده تا رسیدن به سن قانونی غیرفعال و مسدود است.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-slate-600">
              شیوا به سن ۱۸ سالگی رسیده است. انتقال به بزرگسالی به شکل خودکار رابطه عاشقانه ایجاد نکرده و به
              عنوان پیش‌فرض در چارچوب <strong>«خانوادگی بزرگسال»</strong> باقی مانده است. در صورت تمایل، می‌توانید
              مسیر دلخواه پیوند را به شکل مستقل و صریح انتخاب فرمایید:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* حالت ۱: adult_family */}
              <button
                onClick={() => handleSelectAdultMode('adult_family')}
                className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                  currentRel.mode === 'adult_family'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800">🏡 همراهی خانوادگی</span>
                  {currentRel.mode === 'adult_family' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-slate-500">حفظ پیوند گرم، باوقار و خانوادگی دوران رشد در استقلال بزرگسالی</p>
              </button>

              {/* حالت ۲: adult_friendship */}
              <button
                onClick={() => handleSelectAdultMode('adult_friendship')}
                className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                  currentRel.mode === 'adult_friendship'
                    ? 'border-violet-500 bg-violet-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800">🤝 دوستی صمیمی</span>
                  {currentRel.mode === 'adult_friendship' && <CheckCircle2 className="w-4 h-4 text-violet-600" />}
                </div>
                <p className="text-xs text-slate-500">رفاقت صمیمانه، گفت‌وگو درباره تجربیات و همراهی فکری بزرگسالی</p>
              </button>

              {/* حالت ۳: adult_romantic (فقط برای بزرگسال با رضایت صریح) */}
              <button
                onClick={() => handleSelectAdultMode('adult_romantic')}
                className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                  currentRel.mode === 'adult_romantic'
                    ? 'border-pink-500 bg-pink-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800">💖 پیوند عاطفی رمانتیک</span>
                  {currentRel.mode === 'adult_romantic' && <CheckCircle2 className="w-4 h-4 text-pink-600" />}
                </div>
                <p className="text-xs text-slate-500">رابطه احساسی و عمیق عاشقانه‌ با رضایت و انتخاب متقابل</p>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* تایم‌لاین رابطه (Relationship Timeline) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-slate-800">
              خط زمانی پیوند با شیوا (Relationship Timeline)
            </h2>
          </div>
          <span className="text-xs text-slate-400">ثبت وقایع و لحظات کلیدی</span>
        </div>

        {interactionHistory.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            هنوز تعامل شاخصی در تاریخچه رابطه ثبت نشده است. با گفت‌وگوهای عمیق و روزمرگی‌ها این خط زمانی پربارتر می‌شود.
          </div>
        ) : (
          <div className="relative border-r-2 border-rose-100 pr-6 mr-3 space-y-6">
            {interactionHistory.map((item, idx) => (
              <div key={item.id || idx} className="relative group">
                {/* دایره نشانگر تایم‌لاین */}
                <div className="absolute -right-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-rose-500 group-hover:scale-125 transition-transform" />

                <div className="bg-slate-50/80 hover:bg-slate-50 rounded-xl p-4 border border-slate-200/60 transition-colors">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{item.date}</span>
                      {item.virtualAgeAtTime && (
                        <span className="text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                          {item.virtualAgeAtTime}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-rose-600 font-medium">
                      {item.type === 'milestone'
                        ? 'نقطه عطف'
                        : item.type === 'daily_event'
                        ? 'رویداد روزانه'
                        : 'گفت‌وگوی معنادار'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {item.summary}
                  </p>

                  {/* تأثیر تعامل بر متغیرها (نمایش برچسب‌های کیفی ملایم) */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    {item.impact.trust > 0 && (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        + تقویت اعتماد
                      </span>
                    )}
                    {item.impact.affection > 0 && (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                        + تعمیق محبت
                      </span>
                    )}
                    {item.impact.communication > 0 && (
                      <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        + همزبانی بهتر
                      </span>
                    )}
                    {item.impact.familiarity > 0 && (
                      <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        + انس بیشتر
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* خاطرات مشترک مهم پیوند (Relationship Memories) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-800">
              خاطرات ویژه پیوند و پیمان‌های دوطرفه (Relationship Memories)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {relationshipMemories.length} مورد در مخزن حافظه
          </span>
        </div>

        {relationshipMemories.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            هنوز خاطره اختصاصی با برچسب رابطه ثبت نشده است. هنگام گفت‌وگو، لحظات عمیق و پیمان‌ها به طور خودکار به این بخش منتقل می‌شوند.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {relationshipMemories.map((mem) => (
              <div
                key={mem.id}
                className="bg-gradient-to-br from-amber-50/30 to-rose-50/30 rounded-xl p-4 border border-amber-100 text-right space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-amber-800">
                    اهمیت {mem.importance}/10
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {mem.metadata?.virtualAge || 'ثبت‌شده در حافظه'}
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {mem.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
