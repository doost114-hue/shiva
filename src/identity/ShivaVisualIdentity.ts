/**
 * ماژول هویت بصری کانونیکال و پایدار شیوا
 * ShivaVisualIdentity - Single Source of Truth
 * 
 * بر اساس مشخصات صریح مرحله ۱۵:
 * تمامی سیستم‌های بصری (Image Engine، Avatar Engine و Growth Album)
 * باید هویت بصری را منحصراً از این ماژول دریافت کنند.
 */

export interface ShivaVisualIdentityData {
  name: string;
  gender: 'female';
  skin_tone: 'light';
  eye_color: 'blue';
  hair_color: 'black';
  hair_type: 'straight';
  face_shape: 'elongated_soft_round';
  identity_features: string[];
  consistency_priority: number;
}

/**
 * اطلاعات کانونیکال و ثابت هویت بصری شیوا
 */
export const SHIVA_CANONICAL_VISUAL_IDENTITY: ShivaVisualIdentityData = {
  name: "شیوا",
  gender: "female",
  skin_tone: "light",
  eye_color: "blue",
  hair_color: "black",
  hair_type: "straight",
  face_shape: "elongated_soft_round",
  identity_features: [
    "blue eyes",
    "straight black hair",
    "soft elongated face",
    "consistent recognizable facial structure"
  ],
  consistency_priority: 1.0
};

/**
 * تفکیک دقیق ویژگی‌های ثابت و ویژگی‌های متغیر هویت
 */
export interface IdentityTraitsSeparation {
  immutable: {
    skin_tone: string;
    eye_color: string;
    hair_color: string;
    hair_type: string;
    face_shape: string;
    identity_features: string[];
    consistency_priority: number;
    descriptionFa: string;
  };
  mutable: {
    allowedFields: string[];
    descriptionFa: string;
  };
}

export const SHIVA_IDENTITY_SEPARATION: IdentityTraitsSeparation = {
  immutable: {
    skin_tone: 'light (پوست بسیار روشن، شفاف و با طراوت)',
    eye_color: 'blue (چشم‌های آبی یاقوتی زلال، گیرا و درخشان)',
    hair_color: 'black (موهای مشکی پرکلاغی طبیعی و براق)',
    hair_type: 'straight (موهای کاملاً لخت، صاف و ابریشمی)',
    face_shape: 'elongated_soft_round (فرم چهره کشیده با گونه‌های نرم، لطیف و کمی تپل)',
    identity_features: [
      'چشمان آبی کریستالی (blue eyes)',
      'موهای لخت مشکی ابریشمی (straight black hair)',
      'صورت کشیده با گونه‌های نرم و لطیف (soft elongated face with gentle chubby cheeks)',
      'ساختار چهره منسجم، قابل‌تشخیص و ماندگار در تمام اعصار (consistent recognizable facial structure)',
    ],
    consistency_priority: 1.0,
    descriptionFa: 'ویژگی‌های بنیادی و غیرقابل تغییر که در تمام ادوار رشد و تصاویر شیوا باید ۱۰۰٪ حفظ شوند.',
  },
  mutable: {
    allowedFields: [
      'age (سن و روزهای رشد)',
      'height (قد و ابعاد فیزیکی)',
      'age proportions (تناسبات اندام و صورت متناسب با مرحله سنی)',
      'hair style (مدل مو صرفاً در محدوده موی مشکی صاف)',
      'clothing (لباس متناسب با سن، فصل و فعالیت)',
      'environment (محیط داخلی یا خارجی و منظره)',
      'activity (فعالیت روزانه جاری)',
      'facial expression (حالت چهره وابسته به عاطفه)',
      'lighting (نورپردازی محیطی و فصلی)',
      'season (فصل بهار، تابستان، پاییز، زمستان)',
      'emotional state (وضعیت احساسی روزانه)',
    ],
    descriptionFa: 'ویژگی‌های پویا و متغیر که وابسته به زمان، شرایط روزمره و رشد هستند و هرگز نباید هویت ثابت را مخدوش کنند.',
  },
};

/**
 * متن استاندارد توصیف هویت بصری برای استفاده در پرامپت‌ها
 */
export function getCanonicalIdentityPromptFragment(): string {
  return `Character identity: ${SHIVA_CANONICAL_VISUAL_IDENTITY.name}. ` +
    `Fixed visual core: Fair light porcelain skin with delicate natural radiance, ` +
    `striking clear sapphire blue eyes with bright highlights, ` +
    `pure natural straight jet-black hair with silky texture, ` +
    `elongated face shape with soft rounded youthful cheeks, ` +
    `delicate lovely facial harmony, distinct recognizable facial structure.`;
}
