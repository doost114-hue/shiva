import { AvatarGesture, AvatarHeadTransform } from '../types/avatar';

/**
 * کنترلر حرکات و ژست‌های بدن و سر آواتار (GestureController)
 * مسئول اجرای ژست‌های ارسالی از Gemini یا سیستم رفتار:
 * - small_wave
 * - nod
 * - head_tilt
 * - shrug
 * - look_away
 * - happy_bounce
 * - neutral
 */
export class GestureController {
  private currentGesture: AvatarGesture = 'neutral';
  private gestureTime: number = 0;
  private gestureDuration: number = 0;
  private isGestureActive: boolean = false;

  // ترنسفورم خروجی نهایی ژست
  public transform: AvatarHeadTransform = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    yOffset: 0,
  };

  // ترنسفورم شانه (برای ژست‌هایی مانند shrug و small_wave)
  public shoulderOffset: number = 0;
  public waveAngle: number = 0;

  /**
   * اجرای یک ژست جدید
   */
  public triggerGesture(gesture: AvatarGesture, customDuration?: number) {
    if (gesture === 'neutral') {
      this.reset();
      return;
    }

    this.currentGesture = gesture;
    this.gestureTime = 0;
    this.isGestureActive = true;

    // مدت زمان بهینه بر اساس نوع ژست
    switch (gesture) {
      case 'nod':
        this.gestureDuration = customDuration || 1.4;
        break;
      case 'head_tilt':
        this.gestureDuration = customDuration || 2.0;
        break;
      case 'small_wave':
        this.gestureDuration = customDuration || 2.2;
        break;
      case 'shrug':
        this.gestureDuration = customDuration || 1.8;
        break;
      case 'look_away':
        this.gestureDuration = customDuration || 2.5;
        break;
      case 'happy_bounce':
        this.gestureDuration = customDuration || 1.6;
        break;
      default:
        this.gestureDuration = 1.5;
    }
  }

  public reset() {
    this.currentGesture = 'neutral';
    this.isGestureActive = false;
    this.gestureTime = 0;
    this.gestureDuration = 0;
  }

  /**
   * محاسبه فریم به فریم تغییرات زاویه و آفست سر
   */
  public update(deltaSeconds: number): {
    head: AvatarHeadTransform;
    shoulderOffset: number;
    waveAngle: number;
  } {
    if (!this.isGestureActive) {
      // بازگشت نرم به حالت عادی
      const returnSpeed = Math.min(1.0, deltaSeconds * 4.0);
      this.transform.pitch += (0 - this.transform.pitch) * returnSpeed;
      this.transform.yaw += (0 - this.transform.yaw) * returnSpeed;
      this.transform.roll += (0 - this.transform.roll) * returnSpeed;
      this.transform.yOffset += (0 - this.transform.yOffset) * returnSpeed;
      this.shoulderOffset += (0 - this.shoulderOffset) * returnSpeed;
      this.waveAngle += (0 - this.waveAngle) * returnSpeed;

      return {
        head: this.transform,
        shoulderOffset: this.shoulderOffset,
        waveAngle: this.waveAngle,
      };
    }

    this.gestureTime += deltaSeconds;
    const progress = this.gestureTime / this.gestureDuration;

    if (progress >= 1.0) {
      this.isGestureActive = false;
      this.currentGesture = 'neutral';
      return {
        head: this.transform,
        shoulderOffset: this.shoulderOffset,
        waveAngle: this.waveAngle,
      };
    }

    // پوش نوسان (Envelope: ورود نرم و خروج نرم)
    const envelope = Math.sin(progress * Math.PI);

    switch (this.currentGesture) {
      case 'nod': {
        // دو تکان سر رو به پایین
        const nodFreq = 2 * Math.PI * 2; // دو سیکل کامل
        const angle = Math.sin(this.gestureTime * nodFreq) * 0.14 * envelope;
        this.transform.pitch = -Math.abs(angle); // همیشه به پایین خم می‌شود
        this.transform.yaw = 0;
        this.transform.roll = 0;
        this.transform.yOffset = -Math.abs(angle) * 0.04;
        this.shoulderOffset = 0;
        break;
      }

      case 'head_tilt': {
        // متمایل شدن سر به پهلو و اندکی به بالا
        this.transform.pitch = 0.04 * envelope;
        this.transform.yaw = 0.05 * envelope;
        this.transform.roll = 0.12 * envelope;
        this.transform.yOffset = 0;
        this.shoulderOffset = 0.02 * envelope;
        break;
      }

      case 'small_wave': {
        // انحراف ملایم سر و نوسان دست/شانه
        this.transform.pitch = 0.03 * envelope;
        this.transform.yaw = 0.06 * envelope;
        this.transform.roll = -0.06 * envelope;
        this.waveAngle = Math.sin(this.gestureTime * 10) * 0.35 * envelope;
        this.shoulderOffset = 0.03 * envelope;
        break;
      }

      case 'shrug': {
        // بالا رفتن شانه‌ها و کج شدن سر با کمی سردرگمی یا شوخی
        this.shoulderOffset = 0.08 * envelope;
        this.transform.pitch = -0.05 * envelope;
        this.transform.roll = 0.08 * envelope;
        this.transform.yaw = -0.04 * envelope;
        break;
      }

      case 'look_away': {
        // نگاه به گوشه (تفکر یا حیا)
        this.transform.yaw = -0.22 * envelope;
        this.transform.pitch = 0.08 * envelope;
        this.transform.roll = -0.04 * envelope;
        this.shoulderOffset = 0;
        break;
      }

      case 'happy_bounce': {
        // جهش پر انرژی و خندان
        const bounceFreq = 2 * Math.PI * 3;
        this.transform.yOffset = Math.abs(Math.sin(this.gestureTime * bounceFreq)) * 0.06 * envelope;
        this.transform.pitch = Math.sin(this.gestureTime * bounceFreq) * 0.05 * envelope;
        this.transform.roll = Math.sin(this.gestureTime * 6) * 0.05 * envelope;
        this.shoulderOffset = 0.04 * envelope;
        break;
      }

      default:
        this.reset();
    }

    return {
      head: this.transform,
      shoulderOffset: this.shoulderOffset,
      waveAngle: this.waveAngle,
    };
  }

  public getActiveGesture(): AvatarGesture {
    return this.currentGesture;
  }
}
