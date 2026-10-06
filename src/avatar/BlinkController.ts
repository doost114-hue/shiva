/**
 * سیستم کنترل پلک‌زدن طبیعی (BlinkController)
 * طراحی‌شده بر اساس الگوهای بیولوژیکی انسان:
 * - فواصل بین پلک‌ها: ۳.۲ تا ۵.۸ ثانیه با توزیع نرم
 * - انیمیشن نرم شامل بسته شدن سریع و باز شدن آرام‌تر
 * - پشتیبانی از پلک‌زدن دوتایی (Double Blink) در ۱۵٪ موارد
 * - فعال در حالت‌های idle و speaking و listening
 */
export class BlinkController {
  private nextBlinkTimer: number = 2.5; // زمان باقی‌مانده تا پلک بعدی به ثانیه
  private isBlinking: boolean = false;
  private blinkProgress: number = 0; // 0 (کاملاً باز) تا 1 (بسته) و بازگشت به 0
  private blinkDuration: number = 0.2; // مدت زمان پلک به ثانیه (۲۰۰ میلی‌ثانیه)
  private isDoubleBlink: boolean = false;
  private doubleBlinkCount: number = 0;

  // خروجی نهایی: 0 = باز، 1 = کاملاً بسته
  public blinkValue: number = 0;

  constructor() {
    this.resetTimer();
  }

  private resetTimer() {
    // بازه ۳.۲ تا ۵.۸ ثانیه
    this.nextBlinkTimer = 3.2 + Math.random() * 2.6;
    this.isBlinking = false;
    this.blinkProgress = 0;
    this.isDoubleBlink = Math.random() < 0.15; // ۱۵٪ شانس پلک دوتایی
    this.doubleBlinkCount = 0;
  }

  public update(deltaSeconds: number): number {
    if (!this.isBlinking) {
      this.nextBlinkTimer -= deltaSeconds;
      if (this.nextBlinkTimer <= 0) {
        this.isBlinking = true;
        this.blinkProgress = 0;
        this.blinkDuration = 0.18 + Math.random() * 0.06; // ۱۸۰ تا ۲۴۰ میلی‌ثانیه
      }
      this.blinkValue = 0;
      return 0;
    }

    // در حال اجرای انیمیشن پلک
    this.blinkProgress += deltaSeconds / this.blinkDuration;

    if (this.blinkProgress <= 0.4) {
      // فاز بسته شدن سریع (۴۰٪ زمان)
      const t = this.blinkProgress / 0.4;
      this.blinkValue = Math.sin((t * Math.PI) / 2);
    } else if (this.blinkProgress <= 1.0) {
      // فاز باز شدن تدریجی (۶۰٪ زمان)
      const t = (this.blinkProgress - 0.4) / 0.6;
      this.blinkValue = 1 - Math.sin((t * Math.PI) / 2);
    } else {
      // اتمام این پلک
      if (this.isDoubleBlink && this.doubleBlinkCount === 0) {
        // اجرای پلک دوم پس از مکثی بسیار کوتاه (۸۰ میلی‌ثانیه)
        this.doubleBlinkCount++;
        this.blinkProgress = 0;
        this.blinkDuration = 0.16;
        this.blinkValue = 0;
      } else {
        this.resetTimer();
        this.blinkValue = 0;
      }
    }

    return Math.max(0, Math.min(1, this.blinkValue));
  }

  /**
   * تحریک دستی پلک زدن (مثلاً در پاسخ به یک رویداد خاص)
   */
  public triggerBlink() {
    this.isBlinking = true;
    this.blinkProgress = 0;
    this.blinkDuration = 0.2;
    this.isDoubleBlink = false;
  }
}
