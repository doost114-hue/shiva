/**
 * انواع واج‌های پایه دهان (Visemes)
 */
export type VisemeType =
  | 'sil'   // سکوت / استراحت
  | 'aa'    // آ (باز شدن عمودی زیاد)
  | 'E'     // اِ / اَی
  | 'I'     // ای (کشیدگی افقی لب‌ها)
  | 'O'     // اُ (گرد شدن ملایم)
  | 'U'     // او (غنچه شدن به جلو)
  | 'PP'    // پ، ب، م (بسته شدن لب‌ها)
  | 'SS'    // س، ز (دندان‌ها نزدیک، لب کشیده)
  | 'TH'    // ف، و (لب و دندان)
  | 'rest'; // حالت نرمال

export interface LipSyncOutputs {
  mouthOpen: number;   // 0 تا 1
  mouthWide: number;   // 0 تا 1
  mouthPucker: number; // 0 تا 1
  jawDrop: number;     // 0 تا 1
}

/**
 * کنترلر همگام‌سازی لب و دهان با صدا (LipSyncController)
 * معماری:
 * Audio / TTS Stream -> LipSyncController -> Viseme & Audio RMS -> Morph Target
 *
 * الزامات دقیق:
 * - حرکت لب فقط و فقط در حالت speaking فعال است.
 * - با پایان speaking، دهان با نرمی کامل به حالت استراحت طبیعی بازمی‌گردد.
 * - مدل توسعه‌پذیر برای اضافه کردن phoneme/viseme پیشرفته در آینده.
 */
export class LipSyncController {
  private isSpeaking: boolean = false;
  private currentAudioLevel: number = 0; // 0 تا 1
  private currentViseme: VisemeType = 'rest';
  private autoCycleTimer: number = 0;

  // مقادیر نرم‌شده فعلی خروجی
  private currentOutputs: LipSyncOutputs = {
    mouthOpen: 0,
    mouthWide: 0,
    mouthPucker: 0,
    jawDrop: 0,
  };

  /**
   * فعال یا غیرفعال کردن حالت تکلم
   */
  public setSpeaking(speaking: boolean) {
    this.isSpeaking = speaking;
    if (!speaking) {
      this.currentAudioLevel = 0;
      this.currentViseme = 'rest';
    }
  }

  public getSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * دریافت سطح شدت صدا از آنالایزر صوتی (0 تا 1)
   */
  public feedAudioLevel(level: number) {
    this.currentAudioLevel = Math.max(0, Math.min(1, level));
  }

  /**
   * دریافت واج اختصاصی (اختیاری برای سینک دقیق‌تر)
   */
  public feedViseme(viseme: VisemeType) {
    this.currentViseme = viseme;
  }

  /**
   * محاسبه فریم به فریم شکل دهان
   */
  public update(deltaSeconds: number): LipSyncOutputs {
    if (!this.isSpeaking) {
      // بازگشت نرم و سریع به حالت استراحت
      const closeSpeed = Math.min(1.0, deltaSeconds * 12.0);
      this.currentOutputs.mouthOpen += (0 - this.currentOutputs.mouthOpen) * closeSpeed;
      this.currentOutputs.mouthWide += (0 - this.currentOutputs.mouthWide) * closeSpeed;
      this.currentOutputs.mouthPucker += (0 - this.currentOutputs.mouthPucker) * closeSpeed;
      this.currentOutputs.jawDrop += (0 - this.currentOutputs.jawDrop) * closeSpeed;
      return this.currentOutputs;
    }

    this.autoCycleTimer += deltaSeconds;

    // اگر سطح صوت بیرونی ارسال نشده بود، یک شبیه‌ساز طبیعی مکالمه مبتنی بر فرکانس‌های تکلم فارسی
    let targetOpen = 0;
    let targetWide = 0;
    let targetPucker = 0;
    let targetJaw = 0;

    if (this.currentAudioLevel > 0.05) {
      // هماهنگ با دامنه صدای واقعی
      const power = Math.pow(this.currentAudioLevel, 0.8);
      targetOpen = 0.25 + power * 0.65;
      targetJaw = power * 0.45;
      targetWide = power * 0.25;
    } else {
      // شبیه‌سازی ریتمیک طبیعی هجاهای گفتار (Syllable rhythm: 3-5 هجا در ثانیه)
      const t = this.autoCycleTimer * 14;
      const syllable = (Math.sin(t) * 0.5 + 0.5) * (Math.sin(t * 0.5) * 0.4 + 0.6);

      targetOpen = syllable * 0.55;
      targetJaw = syllable * 0.35;
      targetWide = Math.sin(t * 0.7) * 0.15;
      targetPucker = Math.max(0, Math.sin(t * 1.3) * 0.2);
    }

    // در نظر گرفتن واج در صورت ارسال صریح
    if (this.currentViseme === 'aa') {
      targetOpen = Math.max(targetOpen, 0.8);
      targetJaw = Math.max(targetJaw, 0.6);
    } else if (this.currentViseme === 'O' || this.currentViseme === 'U') {
      targetPucker = 0.6;
      targetWide = -0.3;
    } else if (this.currentViseme === 'I' || this.currentViseme === 'E') {
      targetWide = 0.5;
      targetOpen = 0.3;
    } else if (this.currentViseme === 'PP') {
      targetOpen = 0;
      targetJaw = 0;
    }

    // درون‌یابی نرم (Lerp) برای طبیعی بودن انیمیشن دهان
    const openSpeed = Math.min(1.0, deltaSeconds * 18.0);
    this.currentOutputs.mouthOpen += (targetOpen - this.currentOutputs.mouthOpen) * openSpeed;
    this.currentOutputs.mouthWide += (targetWide - this.currentOutputs.mouthWide) * openSpeed;
    this.currentOutputs.mouthPucker += (targetPucker - this.currentOutputs.mouthPucker) * openSpeed;
    this.currentOutputs.jawDrop += (targetJaw - this.currentOutputs.jawDrop) * openSpeed;

    return this.currentOutputs;
  }
}
