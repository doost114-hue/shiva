import { LifeStage, VirtualAgeInfo } from '../types/shiva';

/**
 * محاسبه سن مجازی بر اساس فرمول:
 * هر یک روز واقعی = ۶ ماه سن مجازی
 * روز ۱: نوزاد (۰ ماه)
 * روز ۲: ۶ ماه
 * روز ۳: ۱ سال (۱۲ ماه)
 * روز ۱۳: ۶ سال (۷۲ ماه)
 * روز ۲۵: ۱۲ سال (۱۴۴ ماه)
 * روز ۳۱: ۱۵ سال (۱۸۰ ماه)
 * روز ۳۷: ۱۸ سال (۲۱۶ ماه)
 */
export function calculateVirtualAge(startDateIso: string, dayOffset: number = 0): VirtualAgeInfo {
  const start = new Date(startDateIso);
  const now = new Date();
  
  // تفاوت بر حسب روز واقعی
  const diffMs = now.getTime() - start.getTime();
  const naturalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  
  // روز جاری با احتساب روز ۱ و جابه‌جایی شبیه‌سازی
  const elapsedRealDays = Math.max(1, naturalDays + 1 + dayOffset);
  
  // محاسبه ماه‌های سن مجازی
  const virtualAgeMonths = Math.max(0, (elapsedRealDays - 1) * 6);
  
  const years = Math.floor(virtualAgeMonths / 12);
  const remainingMonths = virtualAgeMonths % 12;
  
  // تشخیص مرحله زندگی بر اساس ۶ مرحله رشد مشخص‌شده
  let stage: LifeStage;
  let stageLabel: string;
  
  if (years < 2) {
    stage = 'infant';
    stageLabel = 'نوزاد و نوپا';
  } else if (years < 5) {
    stage = 'child_early';
    stageLabel = 'اوایل کودکی';
  } else if (years < 11) {
    stage = 'child';
    stageLabel = 'کودک';
  } else if (years < 14) {
    stage = 'preteen';
    stageLabel = 'پیش‌نوجوانی';
  } else if (years < 19) {
    stage = 'teen';
    stageLabel = 'نوجوان';
  } else {
    stage = 'adult';
    stageLabel = 'بزرگسال';
  }

  const isAdult = years >= 18;
  
  // ساخت رشته نمایشی سن به فارسی
  let ageDisplay = '';
  if (years === 0) {
    ageDisplay = remainingMonths === 0 ? 'نوزاد (تازه متولد شده)' : `${remainingMonths} ماهه`;
  } else if (remainingMonths === 0) {
    ageDisplay = `${years} ساله`;
  } else {
    ageDisplay = `${years} سال و ${remainingMonths} ماه`;
  }

  // فاصله تا مرز ۱۸ سالگی بر حسب ماه
  const nextMilestoneMonths = isAdult ? 0 : Math.max(0, 216 - virtualAgeMonths);

  return {
    elapsedRealDays,
    virtualAgeMonths,
    years,
    remainingMonths,
    stage,
    stageLabel,
    isAdult,
    ageDisplay,
    nextMilestoneMonths
  };
}

/**
 * ماژول منطقی رفتار در دوره قبل از ۱۸ سالگی (کودکی و نوجوانی)
 * کاملاً مجزا و محافظت شده:
 * - رفتار صرفاً کودکانه/نوجوانانه و آموزشی/خانوادگی
 * - عاری از هرگونه محتوای رمانتیک یا نامناسب
 * - رابطه مراقبتی و دوستانه معصومانه
 */
export const ChildhoodBehaviorModule = {
  getSystemGuidelines(ageInfo: VirtualAgeInfo): string {
    const { years, remainingMonths, stage } = ageInfo;
    return `
[مرحله سنی: زیر ۱۸ سال - ${ageInfo.stageLabel} (${ageInfo.ageDisplay})]
قوانین اکید این مرحله سنی:
۱. شیوا در این مرحله یک ${stage === 'teen' ? 'نوجوان' : stage === 'preteen' ? 'پیش‌نوجوان' : stage === 'child' ? 'کودک دبستانی' : stage === 'child_early' ? 'کودک خردسال' : 'نوزاد و نوپا'} است (${years} سال و ${remainingMonths} ماه).
۲. زبان، واژگان، سطح دغدغه‌ها و فهم او باید کاملاً منطبق با سن ${years} سالگی باشد:
   ${years < 3 ? '- لکنت شیرین کودکانه، جملات خیلی کوتاه، بازی با کلمات و نیاز به محبت و مراقبت.' : ''}
   ${years >= 3 && years < 7 ? '- جملات پر از ذوق و کنجکاوی، تعریف کردن از اسباب‌بازی‌ها، نقاشی، قصه‌ها و سوال‌های بی‌پایان چرا و چطور.' : ''}
   ${years >= 7 && years < 13 ? '- صحبت از درس، مدرسه، بازی‌ها، دوستان، حس استقلال تدریجی، کنجکاوی علمی و قصه‌پردازی.' : ''}
   ${years >= 13 && years < 18 ? '- دغدغه‌های نوجوانی، رویاهای آینده، موسیقی، هویت‌یابی، گاهی لجبازی ملایم یا نگرانی، صمیمیت خواهرانه/دوستانه با کاربر.' : ''}
۳. هرگونه محتوای عاشقانه، رمانتیک، جنسی یا فراتر از رابطه خانوادگی/مراقبتی اکیداً ممنوع است. رابطه با کاربر در چارچوب یک دوست بزرگتر، حامی یا مراقب مهربان است.
۴. لحن باید گرم، لطیف، شیرین و کاملاً طبیعی و ایرانی باشد.
`;
  },
  
  getAllowedFeatures(): string[] {
    return [
      'داستان‌گویی کودکانه و شعر',
      'نقاشی و کنجکاوی‌های درسی',
      'بازی‌های فکری و سوالات تخیلی',
      'مشورت درسی و نوجوانی',
      'ثبت خاطرات مدرسه و بازی',
    ];
  }
};

/**
 * ماژول منطقی رفتار در دوره پس از ۱۸ سالگی (بزرگسالی)
 * کاملاً تفکیک شده از ماژول کودکی:
 * - هویت مستقل، بلوغ فکری، تصمیم‌گیری، علایق شغلی و شخصی
 * - امکان گفتگوهای عمیق فلسفی، احساسی و اجتماعی
 * - مدیریت ماژولار ویژگی‌های روابط بزرگسالانه
 */
export const AdultBehaviorModule = {
  getSystemGuidelines(ageInfo: VirtualAgeInfo): string {
    const { years } = ageInfo;
    return `
[مرحله سنی: بزرگسالی - ۱۸ سال به بالا (${ageInfo.ageDisplay})]
ویژگی‌های این مرحله سنی:
۱. شیوا وارد مرحله بزرگسالی شده است (${years} ساله). گفتار، لحن و افکار او بالغ، عمیق، پخته و در عین حال وفادار به ویژگی‌های ذاتی‌اش (مهربان، کنجکاو، شوخ‌طبع، کمی خجالتی) است.
۲. امکان گفتگو درباره اهداف شغلی، زندگی، عواطف عمیق‌تر، احساسات درونی و همراهی فکری وجود دارد.
۳. در این فاز او همچنان اصالت شخصیتی خود را حفظ می‌کند: نرم، آرام، باوقار، و صمیمی.
۴. رابطه با کاربر به یک دوستی عمیق بزرگسالانه و همدلانه ارتقا یافته است.
`;
  },
  
  getAdultFeatures(): string[] {
    return [
      'همفکری در تصمیم‌های زندگی و کاری',
      'گفتگوهای عمیق احساسی و روان‌شناختی',
      'شعرخوانی و ادبیات پیشرفته',
      'برنامه‌ریزی اهداف بلندمدت و استقلال فکری',
    ];
  }
};
