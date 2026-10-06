import { AvatarExpression, EMOTION_TO_EXPRESSION_MAP } from '../types/avatar';
import { EmotionType } from '../types/shiva';

export interface ExpressionTargets {
  mouthSmile: number;
  mouthPucker: number;
  mouthWide: number;
  browInnerUp: number;
  browOuterUp: number;
  browDown: number;
  eyeSquint: number;
  cheekPuff: number;
}

/**
 * کنترلر حالت چهره (ExpressionController)
 * مسئول نگاشت احساس و شدت آن به وزن‌های عضلات و فرم چهره آواتار شیوا
 */
export class ExpressionController {
  private currentExpression: AvatarExpression = 'neutral_soft';
  private targetIntensity: number = 0.5;

  // مقادیر فعلی نرم‌شده (Smoothed values)
  public currentWeights: ExpressionTargets = {
    mouthSmile: 0.15,
    mouthPucker: 0,
    mouthWide: 0.1,
    browInnerUp: 0,
    browOuterUp: 0,
    browDown: 0,
    eyeSquint: 0,
    cheekPuff: 0.1,
  };

  /**
   * تنظیم حالت چهره بر اساس احساس و شدت بازگشتی از هسته شیوا
   */
  public setEmotion(emotion: EmotionType, intensity: number = 0.6) {
    const mappedExp = EMOTION_TO_EXPRESSION_MAP[emotion] || 'neutral_soft';
    this.setExpression(mappedExp, intensity);
  }

  /**
   * تنظیم مستقیم حالت چهره و شدت
   */
  public setExpression(expression: AvatarExpression, intensity: number = 0.6) {
    this.currentExpression = expression;
    this.targetIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * دریافت اهداف مورف برای حالت چهره فعلی
   */
  private getTargetWeights(): ExpressionTargets {
    const i = this.targetIntensity;

    switch (this.currentExpression) {
      case 'smile':
        return {
          mouthSmile: 0.5 + 0.5 * i,
          mouthPucker: 0,
          mouthWide: 0.2 + 0.3 * i,
          browInnerUp: 0.1 * i,
          browOuterUp: 0.2 * i,
          browDown: 0,
          eyeSquint: 0.25 * i,
          cheekPuff: 0.3 + 0.4 * i,
        };

      case 'excited':
        return {
          mouthSmile: 0.6 + 0.4 * i,
          mouthPucker: 0.1 * i,
          mouthWide: 0.4 + 0.4 * i,
          browInnerUp: 0.35 * i,
          browOuterUp: 0.45 * i,
          browDown: 0,
          eyeSquint: 0.2 * i,
          cheekPuff: 0.4 + 0.5 * i,
        };

      case 'sad':
        return {
          mouthSmile: -0.3 * i,
          mouthPucker: 0.15 * i,
          mouthWide: -0.2 * i,
          browInnerUp: 0.6 * i,
          browOuterUp: 0,
          browDown: 0.1 * i,
          eyeSquint: 0.15 * i,
          cheekPuff: 0,
        };

      case 'worried':
        return {
          mouthSmile: -0.2 * i,
          mouthPucker: 0.2 * i,
          mouthWide: -0.1 * i,
          browInnerUp: 0.7 * i,
          browOuterUp: 0.1 * i,
          browDown: 0.2 * i,
          eyeSquint: 0.1 * i,
          cheekPuff: 0.05,
        };

      case 'curious':
        return {
          mouthSmile: 0.2 + 0.2 * i,
          mouthPucker: 0.2 * i,
          mouthWide: 0.1,
          browInnerUp: 0.4 * i,
          browOuterUp: 0.5 * i,
          browDown: 0,
          eyeSquint: 0.05,
          cheekPuff: 0.15,
        };

      case 'playful':
        return {
          mouthSmile: 0.55 + 0.35 * i,
          mouthPucker: 0.1 * i,
          mouthWide: 0.3 * i,
          browInnerUp: 0.25 * i,
          browOuterUp: 0.35 * i,
          browDown: 0,
          eyeSquint: 0.3 * i,
          cheekPuff: 0.35 + 0.35 * i,
        };

      case 'tired':
        return {
          mouthSmile: 0,
          mouthPucker: 0,
          mouthWide: -0.1 * i,
          browInnerUp: 0.1 * i,
          browOuterUp: 0,
          browDown: 0.15 * i,
          eyeSquint: 0.45 * i,
          cheekPuff: 0,
        };

      case 'neutral_soft':
      default:
        return {
          mouthSmile: 0.18, // لبخند بسیار ملایم و دلنشین پایه شیوا
          mouthPucker: 0,
          mouthWide: 0.05,
          browInnerUp: 0.05,
          browOuterUp: 0.08,
          browDown: 0,
          eyeSquint: 0.05,
          cheekPuff: 0.12,
        };
    }
  }

  /**
   * به‌روزرسانی نرم در هر فریم (Lerp interpolation)
   */
  public update(deltaSeconds: number): ExpressionTargets {
    const targets = this.getTargetWeights();
    // سرعت نرم‌سازی: حدود ۵ واحد در ثانیه
    const lerpSpeed = Math.min(1.0, deltaSeconds * 6.0);

    const lerp = (cur: number, target: number) => cur + (target - cur) * lerpSpeed;

    this.currentWeights.mouthSmile = lerp(this.currentWeights.mouthSmile, targets.mouthSmile);
    this.currentWeights.mouthPucker = lerp(this.currentWeights.mouthPucker, targets.mouthPucker);
    this.currentWeights.mouthWide = lerp(this.currentWeights.mouthWide, targets.mouthWide);
    this.currentWeights.browInnerUp = lerp(this.currentWeights.browInnerUp, targets.browInnerUp);
    this.currentWeights.browOuterUp = lerp(this.currentWeights.browOuterUp, targets.browOuterUp);
    this.currentWeights.browDown = lerp(this.currentWeights.browDown, targets.browDown);
    this.currentWeights.eyeSquint = lerp(this.currentWeights.eyeSquint, targets.eyeSquint);
    this.currentWeights.cheekPuff = lerp(this.currentWeights.cheekPuff, targets.cheekPuff);

    return this.currentWeights;
  }

  public getExpression(): AvatarExpression {
    return this.currentExpression;
  }

  public getIntensity(): number {
    return this.targetIntensity;
  }
}
