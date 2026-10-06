import {
  DailyImage,
  DailyMemory,
  EmotionType,
  LifeStage,
  ShivaState,
  StructuredImagePrompt,
  SHIVA_FIXED_VISUAL_IDENTITY
} from '../types/shiva';
import {
  SHIVA_CANONICAL_VISUAL_IDENTITY,
  getCanonicalIdentityPromptFragment,
} from '../identity/ShivaVisualIdentity';
import {
  getAgeAppearanceProfile,
  lifeStageToGrowthStageKey,
} from '../identity/AgeAppearanceProfile';
import { IdentityLock } from '../identity/IdentityLock';
import { ReferenceImageManager } from '../identity/ReferenceImageManager';

/**
 * تعیین فصل سال بر اساس ماه تاریخ واقعی
 */
export function determineSeason(dateString?: string): { seasonName: string; seasonEn: string; weatherDesc: string } {
  const d = dateString ? new Date(dateString) : new Date();
  const month = d.getMonth() + 1; // 1 to 12

  // تقریب ماه‌های میلادی به فصول
  if (month >= 3 && month <= 5) {
    return {
      seasonName: 'بهار دل‌انگیز',
      seasonEn: 'Spring',
      weatherDesc: 'شکوفه‌های بهاری، هوای معتدل و نسیم ملایم با عطر گل‌ها',
    };
  } else if (month >= 6 && month <= 8) {
    return {
      seasonName: 'تابستان پرنور',
      seasonEn: 'Summer',
      weatherDesc: 'آفتاب درخشان، آسمان آبی روشن و روزهای گرم و پرانرژی',
    };
  } else if (month >= 9 && month <= 11) {
    return {
      seasonName: 'پاییز طلایی',
      seasonEn: 'Autumn',
      weatherDesc: 'برگ‌های طلایی و نارنجی، هوای خنک و دلپذیر و نم‌نم باران پاییزی',
    };
  } else {
    return {
      seasonName: 'زمستان برفی',
      seasonEn: 'Winter',
      weatherDesc: 'دانه‌های سپید برف، هوای سرد و فضایی دنج و گرم در محیط خانه',
    };
  }
}

/**
 * ساخت پرامپت ساختاریافته ۱۰بخشی برای تولید تصویر روزانه شیوا
 * تفکیک دقیق هویت بصری ثابت از متغیرهای روزانه و رعایت کامل قوانین سنی
 */
export function buildStructuredDailyImagePrompt(params: {
  virtualDay: number;
  virtualAge: string;
  virtualAgeMonths: number;
  lifeStage: LifeStage;
  activity: string;
  event: string;
  mood: EmotionType;
  realDate?: string;
}): StructuredImagePrompt {
  const seasonInfo = determineSeason(params.realDate);
  const years = Math.floor(params.virtualAgeMonths / 12);
  const { profile, progressiveParams, stageKey } = getAgeAppearanceProfile(years, params.virtualAgeMonths);

  // ۱. هویت بصری کانونیکال (Identity - منبع اصلی: ShivaVisualIdentity)
  const identity = getCanonicalIdentityPromptFragment();

  // ۲. سن و رعایت ایمنی (Age - برگرفته از Age Engine و AgeAppearanceProfile)
  const age = `Age: ${params.virtualAge} (${profile.ageRangeDisplay}, ${profile.stageFa}). ${profile.safety_rule}`;

  // ۳. ظاهر متناسب با سن و رشد تدریجی (Age Appropriate Appearance)
  const appearance = `Appearance: ${profile.prompt_fragment} Progressive growth metrics: cheek fullness ${progressiveParams.cheek_chubbiness}, head-to-body proportion ${progressiveParams.head_to_body_ratio}, jaw definition ${progressiveParams.jaw_definition}.`;

  // ۴. لباس متناسب با سن، فصل و وقار (Clothing)
  const clothing = `Clothing: ${profile.clothing_guidelines} Seasonal harmony with ${seasonInfo.seasonName}. Modest, dignified and natural.`;

  // ۵. فعالیت روزانه جاری (Activity)
  const activity = `Today's activity: ${params.activity}. Event context: ${params.event}. Shiva is actively engaged with gentle charm.`;

  // ۶. محیط و شرایط فصلی (Environment)
  const environment = `Setting: Harmonious scene in ${seasonInfo.seasonEn} season (${seasonInfo.seasonName}). Atmosphere details: ${seasonInfo.weatherDesc}. Warm domestic indoor corner with sunlit window or scenic outdoor natural Iranian/Persian-inspired serene scenery with soft greenery or cozy library nook.`;

  // ۷. احساس و حالت چهره (Emotion)
  const emotionMap: Record<EmotionType, string> = {
    happy: 'Joyful sweet warm smile, sparkling blue eyes, happy uplifted cheeks, radiant contented expression',
    calm: 'Serene peaceful expression, gentle slight smile, tranquil relaxed eyes, quiet contemplative poise',
    excited: 'Excited wide blue eyes with dazzling highlights, enthusiastic playful smile, vibrant energetic vibe',
    curious: 'Inquisitive head tilt, curious wide gaze, eyebrows slightly raised in wonder and interest',
    sad: 'Gentle melancholic look, soft downcast sapphire eyes seeking comforting warmth, vulnerable soft expression',
    tired: 'Cozy sleepy expression, heavy eyelids, yawning softly or ready to rest, relaxed comforting posture',
    worried: 'Thoughtful furrowed brow, slightly hesitant shy gaze looking for reassurance, gentle sensitive expression',
    playful: 'Mischievous sweet grin, playful wink or teasing gentle expression, flushed cute chubby cheeks',
  };
  const emotion = `Facial expression: ${emotionMap[params.mood] || emotionMap.calm}.`;

  // ۸. نورپردازی (Lighting)
  const lighting = `Lighting: Soft diffused cinematic lighting, warm golden morning sunbeams or ambient gentle indoor lantern glow, soft rim light highlighting her silky black hair, natural skin highlights.`;

  // ۹. زاویه و کادربندی دوربین (Camera)
  const camera = `Camera: Medium portrait shot, eye-level angle, 85mm prime lens portrait photography, shallow depth of field with beautiful creamy bokeh in the background, sharp focus on Shiva's eyes and face.`;

  // ۱۰. سبک بصری و راهنمای تصویر مرجع (Visual Style)
  const refGuidance = ReferenceImageManager.getReferencePromptGuidance(stageKey);
  const visual_style = `Visual style: High-end cinematic digital illustration portrait, warm aesthetic blending semi-realistic detailed rendering with Makoto Shinkai / Studio Ghibli emotional warmth, rich textures, exquisite color grading, soft luminous painterly finish, masterpieces quality. ${refGuidance}`.trim();

  // ترکیب دقیق و ۱۰بخشی پرامپت:
  // [Identity] + [Age] + [Age Appropriate Appearance] + [Clothing] + [Activity] + [Environment] + [Emotion] + [Lighting] + [Camera] + [Visual Style]
  const full_prompt = `${identity} ${age} ${appearance} ${clothing} ${activity} ${environment} ${emotion} ${lighting} ${camera} ${visual_style}`;

  return {
    identity,
    age,
    appearance,
    clothing,
    activity,
    environment,
    emotion,
    lighting,
    camera,
    visual_style,
    full_prompt,
  };
}

/**
 * ایجاد یا بازیابی تصویر روزانه برای یک روز خاص
 * قانون: اگر تصویر برای تاریخ یا روز جاری موجود است، همان را بازمی‌گرداند و تولید تکراری انجام نمی‌دهد.
 */
export async function getOrCreateDailyImage(
  state: ShivaState,
  memory: DailyMemory
): Promise<{ dailyImage: DailyImage; updatedState: ShivaState }> {
  const images = state.dailyImages || [];

  // بررسی عدم تولید تکراری برای یک روز/تاریخ جاری
  const existingByDay = images.find((img) => img.virtual_day === memory.virtual_day);
  const existingByDate = images.find((img) => img.real_date === memory.real_date);
  const existing = existingByDay || existingByDate;

  if (existing) {
    // تصویر از قبل برای این روز وجود دارد؛ همان را بازمی‌گردانیم
    return {
      dailyImage: existing,
      updatedState: state,
    };
  }

  // اعتبارسنجی خودکار قفل هویت بصری قبل از تولید تصویر (Consistency Check)
  const growthKey = lifeStageToGrowthStageKey(memory.life_stage, Math.floor(memory.virtual_age.totalMonths / 12));
  const consistency = IdentityLock.checkAndEnforceConsistency({}, growthKey);
  if (!consistency.passed) {
    console.info('IdentityLock auto-corrected parameters for consistency:', consistency.appliedCorrections);
  }

  // ساخت پرامپت ساختاریافته ۱۰بخشی
  const structuredPrompt = buildStructuredDailyImagePrompt({
    virtualDay: memory.virtual_day,
    virtualAge: memory.virtual_age.display,
    virtualAgeMonths: memory.virtual_age.totalMonths,
    lifeStage: memory.life_stage,
    activity: memory.activities[0] || 'همراهی با دوست و مرور خاطرات روز',
    event: memory.event.title,
    mood: memory.mood.emotion,
    realDate: memory.real_date,
  });

  let imageUrl = '';

  try {
    // فراخوانی اندپوینت سرور برای تولید تصویر با مدل Gemini
    const res = await fetch('/api/generate-daily-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        virtualDay: memory.virtual_day,
        realDate: memory.real_date,
        virtualAge: memory.virtual_age.display,
        lifeStage: memory.life_stage,
        activity: memory.activities[0] || 'همراهی با دوست',
        event: memory.event.title,
        mood: memory.mood.emotion,
        structuredPrompt,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.image_url) {
        imageUrl = data.image_url;
      }
    }
  } catch (err) {
    console.warn('Could not generate online image via server, using aesthetic portrait generator:', err);
  }

  // در صورت عدم دریافت از سرور، از پرتره برداری سفارشی زیبا منطبق بر هویت ثابت شیوا استفاده می‌شود
  if (!imageUrl) {
    imageUrl = generateAestheticFallbackSvgUrl(memory, structuredPrompt);
  }

  const newDailyImage: DailyImage = {
    id: `img-day-${memory.virtual_day}-${Date.now()}`,
    real_date: memory.real_date,
    virtual_day: memory.virtual_day,
    virtual_age: memory.virtual_age.display,
    life_stage: memory.life_stage,
    event: memory.event.title,
    mood: memory.mood.emotion,
    prompt: structuredPrompt.full_prompt,
    structured_prompt: structuredPrompt,
    image_url: imageUrl,
    created_at: new Date().toISOString(),
  };

  // به‌روزرسانی حافظه روزانه با الصاق تصویر
  const updatedDailyMemories = state.dailyMemories.map((dm) => {
    if (dm.virtual_day === memory.virtual_day || dm.id === memory.id) {
      return {
        ...dm,
        image_id: newDailyImage.id,
        daily_image: newDailyImage,
      };
    }
    return dm;
  });

  const updatedDailyImages = [newDailyImage, ...images.filter((img) => img.virtual_day !== memory.virtual_day)];

  const updatedState: ShivaState = {
    ...state,
    dailyImages: updatedDailyImages,
    dailyMemories: updatedDailyMemories,
  };

  return {
    dailyImage: newDailyImage,
    updatedState,
  };
}

/**
 * پرتره برداری شیک و باوقار SVG با مشخصات ثابت شیوا
 * (پوست روشن، چشم‌های آبی درخشان، موهای مشکی صاف، گونه‌های کمی تپل)
 */
export function generateAestheticFallbackSvgUrl(
  memory: DailyMemory,
  structuredPrompt: StructuredImagePrompt
): string {
  const stage = memory.life_stage;
  const mood = memory.mood.emotion;

  // پالت رنگ‌های احساس و فصل
  const bgGradients: Record<EmotionType, [string, string]> = {
    happy: ['#fef3c7', '#fbcfe8'],
    calm: ['#e0f2fe', '#fce7f3'],
    excited: ['#fed7aa', '#f472b6'],
    curious: ['#ede9fe', '#bae6fd'],
    sad: ['#e2e8f0', '#cbd5e1'],
    tired: ['#f3e8ff', '#e0e7ff'],
    worried: ['#ffe4e6', '#fecdd3'],
    playful: ['#fdf2f8', '#fbcfe8'],
  };

  const [bg1, bg2] = bgGradients[mood] || ['#fce7f3', '#e0f2fe'];

  // سنجه‌های متناسب با سن
  const isInfant = stage === 'infant';
  const isChildEarly = stage === 'child_early';
  const isChild = stage === 'child';
  const isPreteen = stage === 'preteen';
  const isTeen = stage === 'teen';
  const isAdult = stage === 'adult';

  const hairLength = isInfant ? '45' : isChildEarly ? '90' : isChild ? '120' : '150';
  const cheekRadius = isInfant ? '18' : isChildEarly ? '16' : isChild ? '14' : '12';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff8f3" />
      <stop offset="100%" stop-color="#faeee3" />
    </linearGradient>
    <radialGradient id="eyeBlue" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </radialGradient>
    <radialGradient id="cheeks" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#f43f5e" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <linearGradient id="clothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f472b6" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
  </defs>

  <!-- پس زمینه لطیف -->
  <rect width="500" height="500" rx="36" fill="url(#bgGrad)" />

  <!-- هاله نوری ملایم پشت سر -->
  <circle cx="250" cy="230" r="160" fill="#ffffff" opacity="0.45" />

  <!-- موهای مشکی پشت سر (صاف و لخت) -->
  <path d="M 170,180 C 140,240 130,360 160,${340 + Number(hairLength) * 0.4} C 190,${340 + Number(hairLength) * 0.4} 310,${340 + Number(hairLength) * 0.4} 340,${340 + Number(hairLength) * 0.4} C 370,360 360,240 330,180 Z" fill="url(#hairGrad)" />

  <!-- لباس متناسب با سن -->
  <path d="M 170,380 C 200,340 300,340 330,380 L 370,500 L 130,500 Z" fill="url(#clothGrad)" />
  <path d="M 220,345 C 235,365 265,365 280,345 Z" fill="#ffffff" opacity="0.8" />

  <!-- گردن با پوست روشن -->
  <rect x="230" y="295" width="40" height="60" rx="10" fill="url(#skinGrad)" />

  <!-- صورت کشیده با گونه‌های کمی تپل (الگوی ثابت شیوا) -->
  <path d="M 180,210 C 170,285 205,335 250,335 C 295,335 330,285 320,210 C 315,145 185,145 180,210 Z" fill="url(#skinGrad)" stroke="#f1e0d3" stroke-width="1.5" />

  <!-- گونه‌های کمی تپل و گلگون -->
  <circle cx="195" cy="272" r="${cheekRadius}" fill="url(#cheeks)" />
  <circle cx="305" cy="272" r="${cheekRadius}" fill="url(#cheeks)" />

  <!-- چشم‌های آبی درخشان و زلال (چشم چپ) -->
  <ellipse cx="215" cy="235" rx="15" ry="18" fill="#ffffff" />
  <circle cx="216" cy="235" r="10" fill="url(#eyeBlue)" />
  <circle cx="216" cy="235" r="5" fill="#0f172a" />
  <circle cx="213" cy="231" r="3.5" fill="#ffffff" />
  <circle cx="218" cy="238" r="1.5" fill="#ffffff" opacity="0.8" />

  <!-- چشم‌های آبی درخشان و زلال (چشم راست) -->
  <ellipse cx="285" cy="235" rx="15" ry="18" fill="#ffffff" />
  <circle cx="284" cy="235" r="10" fill="url(#eyeBlue)" />
  <circle cx="284" cy="235" r="5" fill="#0f172a" />
  <circle cx="281" cy="231" r="3.5" fill="#ffffff" />
  <circle cx="286" cy="238" r="1.5" fill="#ffffff" opacity="0.8" />

  <!-- ابروهای ظریف -->
  <path d="M 200,215 Q 215,208 230,214" stroke="#27272a" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <path d="M 270,214 Q 285,208 300,215" stroke="#27272a" stroke-width="2.5" stroke-linecap="round" fill="none" />

  <!-- بینی ظریف -->
  <path d="M 248,252 Q 250,262 253,262" stroke="#e2c8b7" stroke-width="2" stroke-linecap="round" fill="none" />

  <!-- لبخند آرام و طبیعی متناسب با احساس -->
  <path d="M 235,286 Q 250,296 265,286" stroke="#e11d48" stroke-width="2.8" stroke-linecap="round" fill="none" />

  <!-- چتری و موهای صاف مشکی جلوی سر -->
  <path d="M 180,185 C 200,150 300,150 320,185 C 315,195 305,190 290,195 C 270,185 230,185 210,195 C 195,190 185,195 180,185 Z" fill="url(#hairGrad)" />

  <!-- رشته موهای صاف دو طرف چهره -->
  <path d="M 175,185 C 165,240 170,300 180,${240 + Number(hairLength) * 0.5} Q 185,${245 + Number(hairLength) * 0.5} 188,${235 + Number(hairLength) * 0.5} C 182,270 185,220 190,190 Z" fill="url(#hairGrad)" />
  <path d="M 325,185 C 335,240 330,300 320,${240 + Number(hairLength) * 0.5} Q 315,${245 + Number(hairLength) * 0.5} 312,${235 + Number(hairLength) * 0.5} C 318,270 315,220 310,190 Z" fill="url(#hairGrad)" />

  <!-- برچسب سن و روز در پایین تصویر -->
  <rect x="20" y="445" width="460" height="38" rx="14" fill="#ffffff" fill-opacity="0.88" />
  <text x="250" y="468" font-family="Vazirmatn, sans-serif" font-size="12" font-weight="bold" fill="#334155" text-anchor="middle" direction="rtl">
    شیوا • روز ${memory.virtual_day} (${memory.virtual_age.display}) • ${memory.event.title.slice(0, 32)}
  </text>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}
