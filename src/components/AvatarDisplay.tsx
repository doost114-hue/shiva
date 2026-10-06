import React from 'react';
import { motion } from 'motion/react';
import { EmotionType, LifeStage } from '../types/shiva';
import { Sparkles, Heart } from 'lucide-react';

interface AvatarDisplayProps {
  emotion: EmotionType;
  intensity: number;
  stage: LifeStage;
  ageDisplay: string;
  size?: 'sm' | 'md' | 'lg';
  isSpeaking?: boolean;
  mouthOpenRatio?: number; // میزان باز شدن دهان برای Lip Sync انیمیشنی (0.0 تا 1.0)
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  emotion,
  intensity,
  stage,
  ageDisplay,
  size = 'lg',
  isSpeaking = false,
  mouthOpenRatio = 0,
}) => {
  // نقش احساسات در رنگ هاله و پالت
  const emotionConfig: Record<EmotionType, { aura: string; label: string; bgBadge: string; textColor: string }> = {
    happy: { aura: 'from-amber-200/40 via-rose-200/30 to-sky-200/20', label: 'شاد و پرانرژی', bgBadge: 'bg-amber-100 text-amber-800', textColor: 'text-amber-600' },
    calm: { aura: 'from-teal-100/40 via-sky-100/30 to-indigo-100/20', label: 'آرام و آسوده', bgBadge: 'bg-teal-100 text-teal-800', textColor: 'text-teal-600' },
    excited: { aura: 'from-pink-300/50 via-amber-200/40 to-purple-200/30', label: 'هیجان‌زده', bgBadge: 'bg-pink-100 text-pink-800', textColor: 'text-pink-600' },
    curious: { aura: 'from-indigo-200/40 via-purple-200/30 to-sky-200/20', label: 'کنجکاو و جست‌وجوگر', bgBadge: 'bg-indigo-100 text-indigo-800', textColor: 'text-indigo-600' },
    sad: { aura: 'from-blue-200/30 via-slate-200/30 to-slate-100/20', label: 'کمی دلگیر و غمگین', bgBadge: 'bg-blue-100 text-blue-800', textColor: 'text-blue-600' },
    tired: { aura: 'from-purple-100/30 via-slate-200/20 to-stone-100/20', label: 'خسته و نیازمند استراحت', bgBadge: 'bg-slate-100 text-slate-700', textColor: 'text-slate-500' },
    worried: { aura: 'from-orange-200/30 via-amber-100/30 to-slate-200/20', label: 'نگران و دل‌مشغول', bgBadge: 'bg-orange-100 text-orange-800', textColor: 'text-orange-600' },
    playful: { aura: 'from-rose-200/40 via-yellow-200/40 to-emerald-200/20', label: 'بازیگوش و شاداب', bgBadge: 'bg-rose-100 text-rose-800', textColor: 'text-rose-600' },
  };

  const currentConf = emotionConfig[emotion] || emotionConfig.calm;

  const containerSizes = {
    sm: 'w-24 h-24',
    md: 'w-44 h-44',
    lg: 'w-64 h-64 sm:w-72 sm:h-72',
  };

  return (
    <div className="relative flex flex-col items-center select-none" id="shiva-avatar-component">
      {/* هاله نورانی اطراف آواتار منطبق بر احساس */}
      <div className={`relative ${containerSizes[size]} flex items-center justify-center`}>
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.7, 0.9, 0.7],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute inset-0 rounded-full bg-gradient-to-tr ${currentConf.aura} blur-2xl -z-10`}
        />

        {/* قاب گرد آواتار */}
        <motion.div
          animate={{
            y: [0, -3, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-full h-full rounded-full p-2 bg-gradient-to-b from-white via-rose-50/60 to-sky-50/50 shadow-xl shadow-rose-100/50 border border-white/80 overflow-hidden flex items-center justify-center relative"
        >
          {/* تصویرسازی برداری زنده و سفارشی شیوا با مشخصات دقیق کاربر:
              - پوست روشن
              - چشم‌های آبی
              - موهای مشکی لخت و صاف
              - صورت کشیده با گونه‌های کمی تپل
              - چهره دوست‌داشتنی و متناسب با سن
          */}
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
            <defs>
              {/* پوست روشن و لطیف */}
              <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#FFF7F2" />
                <stop offset="65%" stopColor="#FFE8DE" />
                <stop offset="100%" stopColor="#F9D4C7" />
              </radialGradient>

              {/* چشم‌های آبی زلال و گیرا */}
              <radialGradient id="eyeBlueGrad" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </radialGradient>

              {/* موهای مشکی صاف و براق */}
              <linearGradient id="hairBlackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E1E24" />
                <stop offset="50%" stopColor="#111116" />
                <stop offset="100%" stopColor="#0B0B0E" />
              </linearGradient>

              {/* گونه‌های کمی تپل و گل‌انداخته */}
              <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* موهای پشت سر */}
            <path
              d="M 50 70 C 40 110, 42 165, 52 195 C 65 190, 135 190, 148 195 C 158 165, 160 110, 150 70 Z"
              fill="url(#hairBlackGrad)"
            />

            {/* گردن و شانه */}
            <path d="M 86 145 L 86 168 Q 86 178, 50 195 L 150 195 Q 114 178, 114 168 L 114 145 Z" fill="#FFE8DE" />
            <path d="M 50 195 Q 100 205, 150 195 L 160 200 L 40 200 Z" fill="#FCE7F3" />

            {/* صورت: کشیده با گونه‌های کمی تپل */}
            {/* طرح بیضی متناسب با صورت کشیده و گونه‌های کمی برجسته در دو طرف */}
            <path
              d="M 100 48 
                 C 142 48, 152 75, 152 105 
                 C 152 130, 135 158, 100 160 
                 C 65 158, 48 130, 48 105 
                 C 48 75, 58 48, 100 48 Z"
              fill="url(#skinGrad)"
            />

            {/* گونه‌های کمی تپل با سرخی ملایم */}
            <ellipse cx="68" cy="115" rx="14" ry="9" fill="url(#blushGrad)" />
            <ellipse cx="132" cy="115" rx="14" ry="9" fill="url(#blushGrad)" />

            {/* چشم چپ (سمت بیننده راست) و چشم راست */}
            {/* پلک‌زدن انیمیشنی برای چشم‌های آبی زلال */}
            <g id="shiva-eyes">
              {emotion === 'tired' ? (
                // چشم‌های خسته نیمه‌باز
                <>
                  <path d="M 68 104 Q 78 100, 88 104" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M 112 104 Q 122 100, 132 104" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </>
              ) : emotion === 'playful' ? (
                // چشم چشمک‌زن
                <>
                  {/* چشم راست معمولی آبی */}
                  <ellipse cx="78" cy="102" rx="9" ry="8" fill="#FFFFFF" />
                  <circle cx="78" cy="102" r="5.5" fill="url(#eyeBlueGrad)" />
                  <circle cx="76" cy="100" r="2" fill="#FFFFFF" />
                  <circle cx="80" cy="103" r="1" fill="#FFFFFF" />
                  {/* چشم چپ در حال چشمک */}
                  <path d="M 114 103 Q 123 109, 132 103" stroke="#0F172A" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                </>
              ) : (
                <>
                  {/* چشم سمت راست تصویر (راست بیننده) */}
                  <ellipse cx="78" cy="102" rx="9" ry={emotion === 'excited' ? 9.5 : 8} fill="#FFFFFF" />
                  <circle cx="78" cy="102" r="5.5" fill="url(#eyeBlueGrad)" />
                  <circle cx="76" cy="100" r="2.2" fill="#FFFFFF" />
                  <circle cx="80.5" cy="103.5" r="1.1" fill="#FFFFFF" />

                  {/* چشم سمت چپ تصویر */}
                  <ellipse cx="122" cy="102" rx="9" ry={emotion === 'excited' ? 9.5 : 8} fill="#FFFFFF" />
                  <circle cx="122" cy="102" r="5.5" fill="url(#eyeBlueGrad)" />
                  <circle cx="120" cy="100" r="2.2" fill="#FFFFFF" />
                  <circle cx="124.5" cy="103.5" r="1.1" fill="#FFFFFF" />
                </>
              )}

              {/* خط مژه و خط چشم ظریف و دخترانه */}
              <path d="M 67 98 Q 78 93, 89 97" stroke="#0F172A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              <path d="M 111 97 Q 122 93, 133 98" stroke="#0F172A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </g>

            {/* ابروها متناسب با احساسات */}
            <g id="shiva-eyebrows">
              {emotion === 'worried' ? (
                <>
                  <path d="M 68 89 Q 78 86, 88 91" stroke="#262626" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  <path d="M 112 91 Q 122 86, 132 89" stroke="#262626" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                </>
              ) : emotion === 'curious' ? (
                <>
                  <path d="M 68 90 Q 78 88, 88 89" stroke="#262626" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  {/* ابروی چپ کمی بالا رفته به نشانه کنجکاوی */}
                  <path d="M 112 85 Q 122 82, 132 86" stroke="#262626" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                </>
              ) : emotion === 'sad' ? (
                <>
                  <path d="M 69 88 Q 78 89, 87 93" stroke="#262626" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  <path d="M 113 93 Q 122 89, 131 88" stroke="#262626" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M 69 90 Q 78 87, 88 90" stroke="#262626" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  <path d="M 112 90 Q 122 87, 131 90" stroke="#262626" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                </>
              )}
            </g>

            {/* بینی کوچک و خوش‌فرم */}
            <path d="M 100 108 Q 102 118, 98 120 Q 102 122, 103 120" stroke="#E0AFA0" strokeWidth="1.6" fill="none" strokeLinecap="round" />

            {/* دهان و لب‌ها با حالت لبخند یا صحبت و Lip Sync پویا */}
            <g id="shiva-mouth">
              {isSpeaking ? (
                // دهان در حال صحبت پویا با پشتیبانی از Lip Sync
                <g>
                  <ellipse
                    cx="100"
                    cy="138"
                    rx={5 + Math.min(4, (mouthOpenRatio || 0.5) * 3)}
                    ry={2.5 + Math.min(6, (mouthOpenRatio || 0.5) * 5)}
                    fill="#F43F5E"
                    stroke="#BE123C"
                    strokeWidth="1.2"
                  />
                  {mouthOpenRatio > 0.4 && (
                    <ellipse cx="100" cy="139.5" rx="3.5" ry="1.5" fill="#FFE4E6" />
                  )}
                </g>
              ) : emotion === 'happy' || emotion === 'excited' || emotion === 'playful' ? (
                // لبخند شاداب
                <path d="M 91 135 Q 100 144, 109 135" stroke="#E11D48" strokeWidth="2.4" fill="#FFE4E6" strokeLinecap="round" />
              ) : emotion === 'sad' ? (
                // لب‌های کمی آویزان و محزون
                <path d="M 93 140 Q 100 136, 107 140" stroke="#E11D48" strokeWidth="2" fill="none" strokeLinecap="round" />
              ) : emotion === 'curious' ? (
                // دهان گرد ملایم
                <circle cx="100" cy="138" r="3.2" fill="#FDA4AF" stroke="#E11D48" strokeWidth="1.5" />
              ) : (
                // لبخند آرام و ملایم پیش‌فرض
                <path d="M 93 137 Q 100 142, 107 137" stroke="#E11D48" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              )}
            </g>

            {/* موهای جلوی سر: مشکی صاف و لخت، چتری ظریف و لطیف */}
            {/* چتری موهای مشکی صاف روی پیشانی */}
            <path
              d="M 48 85 
                 C 52 50, 75 35, 100 35 
                 C 125 35, 148 50, 152 85 
                 C 142 80, 130 84, 120 78 
                 C 112 84, 102 77, 95 82 
                 C 85 76, 75 84, 65 78 
                 C 55 83, 50 82, 48 85 Z"
              fill="url(#hairBlackGrad)"
            />

            {/* تارهای صاف موهای کناری آویزان روی گونه‌ها */}
            <path d="M 49 84 C 47 115, 52 145, 58 165 C 55 140, 52 105, 54 84 Z" fill="url(#hairBlackGrad)" />
            <path d="M 151 84 C 153 115, 148 145, 142 165 C 145 140, 148 105, 146 84 Z" fill="url(#hairBlackGrad)" />

            {/* اکسسوری مو متناسب با مرحله سنی: گل‌سر یا پاپیون صورتی برای کودکی، گیره شیک برای نوجوانی/بزرگسالی */}
            {stage === 'infant' || stage === 'toddler' ? (
              // پاپیون کودکانه و ناز
              <g transform="translate(132, 52) scale(0.8)">
                <path d="M -8 -8 L 8 8 L 8 -8 L -8 8 Z" fill="#F43F5E" />
                <circle cx="0" cy="0" r="4" fill="#FDA4AF" />
              </g>
            ) : stage === 'child' ? (
              // گل‌سر ستاره‌ای
              <g transform="translate(135, 56) scale(0.7)">
                <circle cx="0" cy="0" r="7" fill="#FBBF24" />
                <circle cx="0" cy="0" r="3" fill="#FFFBEB" />
              </g>
            ) : (
              // گیره موی مدرن و شیک برای نوجوانی و بزرگسالی
              <rect x="130" y="58" width="16" height="5" rx="2.5" fill="#38BDF8" transform="rotate(-15 130 58)" />
            )}
          </svg>

          {/* نشانگر انیمیشنی صحبت کردن */}
          {isSpeaking && (
            <div className="absolute bottom-3 bg-rose-500/90 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>در حال صحبت...</span>
            </div>
          )}
        </motion.div>

        {/* دکمه نشانگر سن در گوشه آواتار */}
        <div className="absolute top-1 -right-1 bg-white/95 backdrop-blur-sm shadow-md border border-slate-100 px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-rose-500" />
          <span>{ageDisplay}</span>
        </div>

        {/* وضعیت احساسی */}
        <div className="absolute -bottom-2 bg-white/95 backdrop-blur-sm shadow-md border border-slate-100 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${emotion === 'happy' || emotion === 'excited' ? 'bg-amber-500' : emotion === 'sad' ? 'bg-blue-500' : emotion === 'worried' ? 'bg-orange-500' : 'bg-teal-500'}`} />
          <span className={currentConf.textColor}>{currentConf.label}</span>
          <span className="text-[10px] text-slate-400 font-mono">({Math.round(intensity * 100)}%)</span>
        </div>
      </div>
    </div>
  );
};
