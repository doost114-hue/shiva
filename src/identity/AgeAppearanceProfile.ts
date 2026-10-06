/**
 * سیستم پروفایل‌های ظاهری بر اساس سن شیوا
 * AgeAppearanceProfile
 * 
 * رابطه:
 * virtual_age -> life_stage -> AgeAppearanceProfile -> final appearance
 * 
 * مراحل ۶گانه رشد:
 * 1. infant (نوزاد: ۰ تا ۱ سال)
 * 2. toddler (نوپا / خردسال: ۱ تا ۳ سال)
 * 3. child (کودک: ۴ تا ۹ سال)
 * 4. preteen (پیش‌نوجوانی: ۱۰ تا ۱۳ سال)
 * 5. teen (نوجوان: ۱۴ تا ۱۷ سال)
 * 6. adult (بزرگسال: ۱۸ سال به بالا)
 */

import { LifeStage } from '../types/shiva';

export type GrowthStageKey = 'infant' | 'toddler' | 'child' | 'preteen' | 'teen' | 'adult';

export interface AppearanceParameters {
  scale: number;                  // مقیاس کلی قد (۰.۷۵ تا ۱.۰)
  head_to_body_ratio: number;     // نسبت سر به بدن (بزرگتر در کودکی)
  cheek_chubbiness: number;       // تپل بودن گونه‌ها (۱.۰ نوزادی تا ۰.۱۵ بزرگسالی)
  eye_openness_size_ratio: number;// درشتی چشم نسبت به صورت (۱.۲۵ تا ۱.۰)
  hair_length_ratio: number;      // بلندی مو (۰.۲ کوتاه تا ۱.۰ بلند و لخت)
  jaw_definition: number;         // وضوح فک و صورت کشیده (۰.۲ نرم نوزادی تا ۱.۰ کشیده بالغ)
  progressive_progress: number;   // میزان پیشرفت پیوسته در مرحله جاری (۰.۰ تا ۱.۰)
}

export interface AgeAppearanceProfileData {
  stage: GrowthStageKey;
  stageFa: string;
  ageRangeDisplay: string;
  minYears: number;
  maxYears: number;
  body_proportions: string;
  hair_allowed_bounds: string;
  clothing_guidelines: string;
  behavior_posture: string;
  safety_rule: string;
  base_parameters: AppearanceParameters;
  prompt_fragment: string;
}

export const AGE_APPEARANCE_PROFILES: Record<GrowthStageKey, AgeAppearanceProfileData> = {
  infant: {
    stage: 'infant',
    stageFa: 'نوزادی',
    ageRangeDisplay: '۰ تا ۱ سال',
    minYears: 0,
    maxYears: 1,
    body_proportions: 'Baby proportions, large head relative to body, soft chubby limbs and cute rosy cheeks.',
    hair_allowed_bounds: 'Short fine silky straight black hair wisps resting softly on forehead.',
    clothing_guidelines: 'Safe, ultra-soft organic pastel cotton baby swaddles, infant onesies in pale mint, soft cream or light peach with cozy booties.',
    behavior_posture: 'Lying cozy, sitting with gentle support, reaching with tiny hands, pure innocent gaze.',
    safety_rule: 'STRICT CHILD SAFETY: Wholesome peaceful infant depiction, cozy nursery or family sanctuary, pure baby innocence.',
    base_parameters: {
      scale: 0.78,
      head_to_body_ratio: 1.25,
      cheek_chubbiness: 1.0,
      eye_openness_size_ratio: 1.25,
      hair_length_ratio: 0.25,
      jaw_definition: 0.2,
      progressive_progress: 0.0,
    },
    prompt_fragment: 'Infant baby girl proportions, delicate chubby cheeks, fine straight black baby hair, wide curious sapphire blue eyes filled with innocent wonder, wearing cozy soft pastel infant onesie.',
  },

  toddler: {
    stage: 'toddler',
    stageFa: 'نوپا و خردسالی',
    ageRangeDisplay: '۱ تا ۳ سال',
    minYears: 1,
    maxYears: 3.99,
    body_proportions: 'Toddler stature, slightly chubby cheeks, playful posture, adorable small proportions.',
    hair_allowed_bounds: 'Neat short bob or shoulder-grazing straight jet-black hair with a small cute ribbon or clip.',
    clothing_guidelines: 'Comfortable modest toddler playwear, pastel cotton pinafore over long-sleeved shirt, soft warm tights, child-safe comfortable slippers.',
    behavior_posture: 'Playful curiosity, holding soft wooden toys or picture books, candid joyful movement.',
    safety_rule: 'STRICT CHILD SAFETY: Absolutely wholesome, kindergarten/home setting, innocent sweet child, zero mature traits.',
    base_parameters: {
      scale: 0.85,
      head_to_body_ratio: 1.18,
      cheek_chubbiness: 0.85,
      eye_openness_size_ratio: 1.2,
      hair_length_ratio: 0.45,
      jaw_definition: 0.35,
      progressive_progress: 0.0,
    },
    prompt_fragment: 'Cute toddler girl, chubby soft cheeks, neat straight black hair with a delicate hair clip, sparkling wide blue eyes, wearing comfortable cheerful pastel children clothes.',
  },

  child: {
    stage: 'child',
    stageFa: 'کودک دبستانی',
    ageRangeDisplay: '۴ تا ۹ سال',
    minYears: 4,
    maxYears: 9.99,
    body_proportions: 'Elementary school child proportions, growing stature, pleasant youthful facial contours with lingering cheek sweetness.',
    hair_allowed_bounds: 'Shoulder-length silky straight black hair neatly brushed, option for small gentle barrettes.',
    clothing_guidelines: 'Modest elementary school age clothing, cozy knit sweater in soft pastel colors, pleated skirt with dark tights or comfortable everyday dungarees.',
    behavior_posture: 'Curious student, reading illustrated books, drawing with crayons, gentle warm posture.',
    safety_rule: 'STRICT CHILD SAFETY: Wholesome modest elementary school girl, family and learning environment, completely safe and respectful.',
    base_parameters: {
      scale: 0.92,
      head_to_body_ratio: 1.1,
      cheek_chubbiness: 0.65,
      eye_openness_size_ratio: 1.14,
      hair_length_ratio: 0.65,
      jaw_definition: 0.55,
      progressive_progress: 0.0,
    },
    prompt_fragment: 'School-age girl proportions, straight sleek black hair neatly styled over shoulders, expressive bright blue eyes, softly rounded cheeks, modest warm knit children sweater.',
  },

  preteen: {
    stage: 'preteen',
    stageFa: 'پیش‌نوجوانی',
    ageRangeDisplay: '۱۰ تا ۱۳ سال',
    minYears: 10,
    maxYears: 13.99,
    body_proportions: 'Growing preteen height, slender build, graceful transition from childhood with soft elongated facial structure.',
    hair_allowed_bounds: 'Long straight silky jet-black hair flowing naturally past shoulders.',
    clothing_guidelines: 'Respectful modest preteen casuals, knitted cardigan over collared cotton shirt, casual pants or long skirt, warm seasonal scarf.',
    behavior_posture: 'Thoughtful, creative, holding sketchbook or journal, observant kind posture.',
    safety_rule: 'STRICT AGE SAFETY: Wholesome preteen youth, dignified modest attire, zero sexualization, calm intellectual and artistic atmosphere.',
    base_parameters: {
      scale: 0.96,
      head_to_body_ratio: 1.04,
      cheek_chubbiness: 0.45,
      eye_openness_size_ratio: 1.08,
      hair_length_ratio: 0.85,
      jaw_definition: 0.75,
      progressive_progress: 0.0,
    },
    prompt_fragment: 'Preteen young girl, elongated gentle face with soft cheeks, sleek long straight jet-black hair, vivid intelligent sapphire blue eyes, modest comfortable layered casual attire.',
  },

  teen: {
    stage: 'teen',
    stageFa: 'نوجوانی',
    ageRangeDisplay: '۱۴ تا ۱۷ سال',
    minYears: 14,
    maxYears: 17.99,
    body_proportions: 'Teenage height and graceful posture, elongated face with subtle youthful softness, natural elegant presence.',
    hair_allowed_bounds: 'Lustrous long straight pure black hair framing the face and shoulders naturally.',
    clothing_guidelines: 'Tasteful modest teen fashion, oversized warm knitted sweater, modest long skirt or denim, handcrafted artisan pendant, culturally respectful.',
    behavior_posture: 'Reflective, poised, artistic gaze, sitting thoughtfully in a cozy reading or nature nook.',
    safety_rule: 'STRICT AGE SAFETY: Wholesome teenager, modest and dignified attire, safe respectful youth presentation, zero mature content.',
    base_parameters: {
      scale: 1.0,
      head_to_body_ratio: 1.0,
      cheek_chubbiness: 0.28,
      eye_openness_size_ratio: 1.03,
      hair_length_ratio: 0.95,
      jaw_definition: 0.9,
      progressive_progress: 0.0,
    },
    prompt_fragment: 'Teenage youth, graceful refined silhouette, long silky straight jet-black hair, emotive deep blue eyes, elongated face with soft cheek contours, tasteful cozy modest cardigan.',
  },

  adult: {
    stage: 'adult',
    stageFa: 'بزرگسالی',
    ageRangeDisplay: '۱۸ سال به بالا',
    minYears: 18,
    maxYears: 100,
    body_proportions: 'Full adult graceful height, balanced feminine posture, distinct elongated facial harmony preserving gentle cheek softness.',
    hair_allowed_bounds: 'Long flowing glossy straight black hair, polished middle or side part.',
    clothing_guidelines: 'Elegant timeless attire, refined cashmere knitwear, modest coats, tasteful scarves in warm neutral or jewel tones, dignified composure.',
    behavior_posture: 'Confident, serene, wise, gentle maternal and companion warmth, poised and tranquil.',
    safety_rule: 'ADULT DIGNITY: Mature, poised, independent personality, respectful demure portrait.',
    base_parameters: {
      scale: 1.0,
      head_to_body_ratio: 1.0,
      cheek_chubbiness: 0.15,
      eye_openness_size_ratio: 1.0,
      hair_length_ratio: 1.0,
      jaw_definition: 1.0,
      progressive_progress: 1.0,
    },
    prompt_fragment: 'Poised adult young woman, mature elegance, flowing long straight raven-black hair, luminous expressive sapphire blue eyes, softly elongated face, dignified sophisticated modest attire.',
  },
};

/**
 * تبدیل مرحله LifeStage سیستم به GrowthStageKey استاندارد هویت
 */
export function lifeStageToGrowthStageKey(lifeStage: LifeStage, years: number): GrowthStageKey {
  if (years < 1) return 'infant';
  if (years < 4) return 'toddler';
  if (years < 10) return 'child';
  if (years < 14) return 'preteen';
  if (years < 18) return 'teen';
  return 'adult';
}

/**
 * محاسبه پارامترهای رشد تدریجی (Progressive Growth)
 * جلوگیری از تغییرات ناگهانی میان مراحل (مثلاً انتقال نرم بین child و preteen)
 */
export function calculateProgressiveAppearance(years: number, totalMonths: number): AppearanceParameters {
  const stage = lifeStageToGrowthStageKey(
    years < 1 ? 'infant' : years < 4 ? 'child_early' : years < 10 ? 'child' : years < 14 ? 'preteen' : years < 18 ? 'teen' : 'adult',
    years
  );

  const stageKeys: GrowthStageKey[] = ['infant', 'toddler', 'child', 'preteen', 'teen', 'adult'];
  const currentIndex = stageKeys.indexOf(stage);
  const currentProfile = AGE_APPEARANCE_PROFILES[stage];

  // محاسبه نسبت پیشرفت درون مرحله جاری
  const span = Math.max(0.1, currentProfile.maxYears - currentProfile.minYears);
  const progressInStage = Math.min(1.0, Math.max(0.0, (years + (totalMonths % 12) / 12 - currentProfile.minYears) / span));

  // اگر مرحله آخر است
  if (currentIndex >= stageKeys.length - 1 || years >= 18) {
    return {
      ...currentProfile.base_parameters,
      progressive_progress: 1.0,
    };
  }

  // درون‌یابی نرم (Interpolation) به سمت مرحله بعدی
  const nextProfile = AGE_APPEARANCE_PROFILES[stageKeys[currentIndex + 1]];
  const p = progressInStage;
  const invP = 1.0 - p;

  return {
    scale: +(currentProfile.base_parameters.scale * invP + nextProfile.base_parameters.scale * p).toFixed(3),
    head_to_body_ratio: +(currentProfile.base_parameters.head_to_body_ratio * invP + nextProfile.base_parameters.head_to_body_ratio * p).toFixed(3),
    cheek_chubbiness: +(currentProfile.base_parameters.cheek_chubbiness * invP + nextProfile.base_parameters.cheek_chubbiness * p).toFixed(3),
    eye_openness_size_ratio: +(currentProfile.base_parameters.eye_openness_size_ratio * invP + nextProfile.base_parameters.eye_openness_size_ratio * p).toFixed(3),
    hair_length_ratio: +(currentProfile.base_parameters.hair_length_ratio * invP + nextProfile.base_parameters.hair_length_ratio * p).toFixed(3),
    jaw_definition: +(currentProfile.base_parameters.jaw_definition * invP + nextProfile.base_parameters.jaw_definition * p).toFixed(3),
    progressive_progress: +progressInStage.toFixed(3),
  };
}

/**
 * دریافت پروفایل سنی جامع بر اساس سال و ماه‌های سن مجازی
 */
export function getAgeAppearanceProfile(years: number, totalMonths: number = years * 12): {
  profile: AgeAppearanceProfileData;
  progressiveParams: AppearanceParameters;
  stageKey: GrowthStageKey;
} {
  const stageKey = lifeStageToGrowthStageKey('child', years);
  const profile = AGE_APPEARANCE_PROFILES[stageKey];
  const progressiveParams = calculateProgressiveAppearance(years, totalMonths);

  return {
    profile,
    progressiveParams,
    stageKey,
  };
}
