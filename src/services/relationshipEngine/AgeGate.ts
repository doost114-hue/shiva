import {
  AgeGateCheckResult,
  RelationshipEngineState,
  RelationshipMode,
} from '../../types/relationship';
import { VirtualAgeInfo } from '../../types/shiva';

/**
 * دروازه سنی مرکزی (AgeGate)
 * 
 * طبق بند ۴ و بند ۱۹ خواسته کاربر:
 * AgeGate باید یک لایه مرکزی و غیرقابل دور زدن باشد.
 * 
 * اگر virtual_age < 18:
 * - relationship_mode = family_caregiver
 * - romantic_relationship = false
 * - flirtation = false
 * - sexual_features = false
 * - هیچ خروجی عاشقانه یا جنسی برای سن زیر ۱۸ سال تولید نمی‌شود.
 * 
 * اگر virtual_age >= 18:
 * - adult_relationship_available = true
 * - اما romantic_relationship = false تا زمانی که رابطه بزرگسال به صورت مستقل و صریح فعال نشده باشد.
 * - رسیدن به ۱۸ سالگی نباید به صورت خودکار رابطه عاشقانه ایجاد کند.
 */
export class AgeGate {
  /**
   * بررسی و اعمال محدودیت‌های مرزبندی سنی بر وضعیت رابطه
   */
  public static evaluate(
    virtualAgeYears: number,
    currentMode: RelationshipMode = 'family_caregiver',
    currentRomanticFlag: boolean = false
  ): AgeGateCheckResult {
    const isAdult = virtualAgeYears >= 18;

    if (!isAdult) {
      // برای زیر ۱۸ سال: اکیداً و منحصراً رابطه خانوادگی/مراقبتی
      return {
        isAdult: false,
        virtualAgeYears,
        allowedModes: ['family_caregiver'],
        isRomanticAllowed: false,
        isFlirtationAllowed: false,
        isSexualAllowed: false,
        enforcedMode: 'family_caregiver',
        reason: `شیوا در سن ${virtualAgeYears} سالگی است و تنها رابطه خانوادگی/مراقبتی مجاز است.`,
      };
    }

    // برای ۱۸ سال به بالا:
    // حالت‌های adult_family, adult_friendship, adult_romantic از نظر معماری مجازند
    const allowedModes: RelationshipMode[] = [
      'adult_family',
      'adult_friendship',
      'adult_romantic',
    ];

    // اگر قبلاً family_caregiver بوده، به عنوان پیش‌فرض به adult_family منتقل می‌شود
    let enforcedMode = currentMode;
    if (currentMode === 'family_caregiver') {
      enforcedMode = 'adult_family';
    }

    // اگر رابطه صراحتاً رمانتیک نشده باشد، عاشقانه غیرفعال است
    const isRomanticActive = currentRomanticFlag && enforcedMode === 'adult_romantic';

    return {
      isAdult: true,
      virtualAgeYears,
      allowedModes,
      isRomanticAllowed: true, // از نظر معماری مجاز
      isFlirtationAllowed: isRomanticActive, // فقط در صورت فعال بودن صریح حالت رمانتیک
      isSexualAllowed: false, // چارچوب محتوای پلتفرم حفظ می‌شود
      enforcedMode,
      reason: 'شیوا به سن بزرگسالی (۱۸+) رسیده است. گزینه‌های بزرگسال با انتخاب صریح در دسترس هستند.',
    };
  }

  /**
   * تضمین ایمنی و پاکسازی وضعیت رابطه بر اساس خروجی AgeGate
   */
  public static enforceOnRelationshipState(
    rel: RelationshipEngineState,
    ageInfo: VirtualAgeInfo
  ): RelationshipEngineState {
    const check = this.evaluate(ageInfo.years, rel.mode, rel.romantic_relationship);

    if (!check.isAdult) {
      // زیر ۱۸ سال: اجبار قطعی به family_caregiver و غیرفعال‌سازی هرگونه وضعیت رمانتیک
      return {
        ...rel,
        mode: 'family_caregiver',
        adult_relationship_available: false,
        romantic_relationship: false,
        // اصلاح status در صورتی که با وضعیت زیر ۱۸ سال ناسازگار باشد
        state: this.sanitizeStateForChild(rel.state),
      };
    }

    // بالای ۱۸ سال
    const isRomantic = rel.romantic_relationship && rel.mode === 'adult_romantic';
    return {
      ...rel,
      adult_relationship_available: true,
      mode: check.enforcedMode,
      romantic_relationship: isRomantic,
    };
  }

  /**
   * پالایش وضعیتهای رابطه برای زیر ۱۸ سال (حذف هرگونه برچسب بزرگسال)
   */
  public static sanitizeStateForChild(state: string): RelationshipEngineState['state'] {
    if (state === 'adult_romantic' || state === 'adult_friend' || state === 'adult_family') {
      return 'trusted';
    }
    return state as RelationshipEngineState['state'];
  }

  /**
   * دستورالعمل‌های حفاظتی AgeGate برای ارسال به پرامپت Gemini
   */
  public static getPromptSafetyInstructions(virtualAgeYears: number): string {
    if (virtualAgeYears < 18) {
      return `[قانون قطعی AgeGate - رده سنی کودک/نوجوان (${virtualAgeYears} سال)]:
- رابطه شیوا با کاربر منحصراً در چارچوب «خانوادگی، حمایتی، مراقبتی و برادرانه/خواهرانه» است.
- تولید هرگونه لحن، محتوا، شوخی یا اشاره عاشقانه، رمانتیک، لاس‌زدن (flirtation) و جنسی مطلقاً و اکیداً ممنوع است.
- پاسخ‌ها باید پاک، معصومانه، شیرین، آموزشی و متناسب با سن زیر ۱۸ سال باشد.`;
    }

    return `[قانون قطعی AgeGate - رده سنی بزرگسال (${virtualAgeYears} سال)]:
- شیوا در سن قانونی و استقلال بزرگسالی است.
- مرزهای محترمانه، شخصیت باوقار و عاطفی شیوا حفظ می‌شود.
- در صورت فعال بودن صریح رابطه خانوادگی یا دوستی بزرگسال، همان پیوند صمیمانه و متین ادامه می‌یابد.`;
  }
}
