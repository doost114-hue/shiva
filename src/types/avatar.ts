import { EmotionType, LifeStage, VoiceProfile } from './shiva';

/**
 * وضعیت‌های چهارگانه استیج آواتار شیوا
 */
export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * مراحل سنی آواتار طبق قانون ۶ ماه سن مجازی به ازای هر روز واقعی
 */
export type AvatarAgeStage =
  | 'infant'
  | 'toddler'
  | 'child_early'
  | 'child'
  | 'preteen'
  | 'teen'
  | 'adult';

/**
 * حالات چهره آواتار نگاشت‌شده از احساسات
 */
export type AvatarExpression =
  | 'smile'
  | 'neutral_soft'
  | 'excited'
  | 'sad'
  | 'worried'
  | 'curious'
  | 'playful'
  | 'tired';

/**
 * ژست‌های حرکتی سر و بدن آواتار
 */
export type AvatarGesture =
  | 'small_wave'
  | 'nod'
  | 'head_tilt'
  | 'shrug'
  | 'look_away'
  | 'happy_bounce'
  | 'neutral';

/**
 * نگاشت احساسات شیوا به حالات چهره Expression
 */
export const EMOTION_TO_EXPRESSION_MAP: Record<EmotionType, AvatarExpression> = {
  happy: 'smile',
  calm: 'neutral_soft',
  excited: 'excited',
  sad: 'sad',
  worried: 'worried',
  curious: 'curious',
  playful: 'playful',
  tired: 'tired',
};

/**
 * پروفایل آواتار متناسب با رده سنی و ویژگی‌های هویتی شیوا
 */
export interface AvatarProfile {
  id: string;
  model_url: string | null;
  age_stage: AvatarAgeStage;
  idle_animation: string;
  animation_profile: string;   // پروفایل انیمیشن منطبق بر سن
  voice_profile: VoiceProfile | null;
  expression: AvatarExpression;
  lip_sync_enabled: boolean;
  scale: number;
  face_chubby: number;        // تپل بودن گونه‌ها در سنین پایین
  eye_size_ratio: number;     // درشتی چشم‌ها در کودکی
  head_scale: number;
  clothing_color: string;
  hair_style: string;
  age_title_fa: string;
  visual_identity_name?: string;
  progressive_progress?: number;
}

/**
 * وضعیت فرم‌های مورف دهان و صورت در یک فریم
 */
export interface AvatarMorphWeights {
  // فرم دهان
  mouthOpen: number;       // باز شدن عمودی دهان (0 تا 1)
  mouthSmile: number;      // گوشه‌های لبخند (0 تا 1)
  mouthPucker: number;     // غنچه کردن لب (0 تا 1)
  mouthWide: number;       // پهنای افقی دهان (0 تا 1)
  jawDrop: number;         // فرود فک (0 تا 1)

  // چشم‌ها و پلک‌ها
  blinkLeft: number;       // بسته بودن پلک چپ (0 باز، 1 کاملاً بسته)
  blinkRight: number;      // بسته بودن پلک راست (0 باز، 1 کاملاً بسته)
  eyeSquint: number;       // تنگ کردن چشم در لبخند یا تفکر

  // ابروها
  browInnerUp: number;     // بالا رفتن گوشه داخلی ابرو (تعجب، نگرانی)
  browOuterUp: number;     // بالا رفتن گوشه بیرونی ابرو
  browDown: number;        // اخم / تمرکز

  // گونه‌ها
  cheekPuff: number;       // برجستگی گونه در شادی و کودکی
}

/**
 * ترنسفورم سه‌بعدی سر و گردن
 */
export interface AvatarHeadTransform {
  pitch: number; // بالا و پایین (رادیان)
  yaw: number;   // چپ و راست (رادیان)
  roll: number;  // خم شدن به پهلو (رادیان)
  yOffset: number; // تنفس یا جهش شاد
}
