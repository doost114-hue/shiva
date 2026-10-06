import {
  AvatarHeadTransform,
  AvatarMorphWeights,
  AvatarState,
  AvatarGesture,
  AvatarExpression,
} from '../types/avatar';
import { BlinkController } from './BlinkController';
import { ExpressionController } from './ExpressionController';
import { GestureController } from './GestureController';
import { LipSyncController } from './LipSyncController';
import { EmotionType } from '../types/shiva';

export interface CombinedAvatarFrame {
  morphs: AvatarMorphWeights;
  headTransform: AvatarHeadTransform;
  shoulderOffset: number;
  waveAngle: number;
  eyeLookTarget: { x: number; y: number }; // زاویه نگاه چشم‌ها
}

/**
 * کنترلر جامع انیمیشن آواتار شیوا (AvatarAnimationController)
 * ترکیب‌کننده هماهنگ تمام زیرسیستم‌ها:
 * - پلک‌زدن طبیعی (BlinkController)
 * - حالات چهره (ExpressionController)
 * - ژست‌های سر و بدن (GestureController)
 * - همگام‌سازی لب با صدا (LipSyncController)
 * - وضعیت‌های ۴گانه: idle | listening | thinking | speaking
 * - تنفس بیولوژیکی (Breathing) و ریزحرکات طبیعی (Micro-movements)
 */
export class AvatarAnimationController {
  public blinkCtrl: BlinkController;
  public expressionCtrl: ExpressionController;
  public gestureCtrl: GestureController;
  public lipSyncCtrl: LipSyncController;

  private currentState: AvatarState = 'idle';
  private totalTime: number = 0;

  // وضعیت نرم‌شده زاویه سر و نگاه
  private smoothedHead: AvatarHeadTransform = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    yOffset: 0,
  };

  private smoothedEyeLook = { x: 0, y: 0 };

  constructor() {
    this.blinkCtrl = new BlinkController();
    this.expressionCtrl = new ExpressionController();
    this.gestureCtrl = new GestureController();
    this.lipSyncCtrl = new LipSyncController();
  }

  /**
   * تنظیم وضعیت کلی آواتار
   */
  public setState(state: AvatarState) {
    this.currentState = state;

    if (state === 'speaking') {
      this.lipSyncCtrl.setSpeaking(true);
    } else {
      this.lipSyncCtrl.setSpeaking(false);
    }
  }

  public getState(): AvatarState {
    return this.currentState;
  }

  /**
   * به‌روزرسانی احساس و شدت چهره
   */
  public setEmotion(emotion: EmotionType, intensity: number = 0.6) {
    this.expressionCtrl.setEmotion(emotion, intensity);
  }

  /**
   * اجرای مستقیم ژست
   */
  public triggerGesture(gesture: AvatarGesture) {
    this.gestureCtrl.triggerGesture(gesture);
  }

  /**
   * اجرای پلک زدن دستی
   */
  public triggerBlink() {
    this.blinkCtrl.triggerBlink();
  }

  /**
   * محاسبه کل فریم انیمیشن با ترکیب تمامی کنترلرها
   */
  public update(deltaSeconds: number): CombinedAvatarFrame {
    this.totalTime += deltaSeconds;

    // ۱. به‌روزرسانی زیرسیستم‌ها
    const blinkVal = this.blinkCtrl.update(deltaSeconds);
    const expTargets = this.expressionCtrl.update(deltaSeconds);
    const gestureResult = this.gestureCtrl.update(deltaSeconds);
    const lipSyncOutputs = this.lipSyncCtrl.update(deltaSeconds);

    // ۲. محاسبه تنفس طبیعی (Breathing: حدود ۱۲ تا ۱۴ تنفس در دقیقه = هر ۴.۵ ثانیه یک چرخه)
    const breathingCycle = Math.sin(this.totalTime * 1.4);
    const breathingPitch = breathingCycle * 0.012;
    const breathingOffset = breathingCycle * 0.008;

    // ۳. رفتارهای متناسب با AvatarState
    let statePitch = 0;
    let stateYaw = 0;
    let stateRoll = 0;
    let targetEyeX = 0;
    let targetEyeY = 0;

    switch (this.currentState) {
      case 'idle':
        // حرکت بسیار ظریف سر و بدن و ریزنگاه‌های آرام
        stateYaw = Math.sin(this.totalTime * 0.5) * 0.03 + Math.sin(this.totalTime * 0.23) * 0.015;
        statePitch = Math.cos(this.totalTime * 0.4) * 0.02;
        targetEyeX = Math.sin(this.totalTime * 0.3) * 0.1;
        targetEyeY = Math.cos(this.totalTime * 0.2) * 0.05;
        break;

      case 'listening':
        // حالت توجه: کمی متمایل به جلو و کاربر، سر کمی کج با کنجکاوی و گوش دادن مشتاقانه
        statePitch = -0.06; // سر کمی پایین‌تر و متمرکز به دوربین
        stateRoll = 0.04 * Math.sin(this.totalTime * 0.8);
        stateYaw = Math.sin(this.totalTime * 0.3) * 0.02;
        targetEyeX = 0; // مستقیم به چشم کاربر
        targetEyeY = 0.02;
        break;

      case 'thinking':
        // تفکر و پردازش: نگاه به گوشه بالا/راست با انحراف ملایم سر
        stateYaw = 0.12 + Math.sin(this.totalTime * 0.7) * 0.03;
        statePitch = 0.08 + Math.cos(this.totalTime * 0.5) * 0.02;
        stateRoll = 0.06;
        targetEyeX = 0.28;
        targetEyeY = 0.22;
        break;

      case 'speaking':
        // حرکات زنده سر همراه با هجاهای تکلم
        statePitch = Math.sin(this.totalTime * 4.5) * 0.035;
        stateYaw = Math.sin(this.totalTime * 1.8) * 0.04;
        stateRoll = Math.sin(this.totalTime * 2.2) * 0.02;
        targetEyeX = Math.sin(this.totalTime * 1.2) * 0.08;
        targetEyeY = 0;
        break;
    }

    // ۴. ترکیب نهایی ترنسفورم سر (Gesture + State + Breathing)
    const targetPitch = gestureResult.head.pitch + statePitch + breathingPitch;
    const targetYaw = gestureResult.head.yaw + stateYaw;
    const targetRoll = gestureResult.head.roll + stateRoll;
    const targetYOffset = gestureResult.head.yOffset + breathingOffset;

    // نرم‌سازی چرخش سر
    const headLerpSpeed = Math.min(1.0, deltaSeconds * 6.0);
    this.smoothedHead.pitch += (targetPitch - this.smoothedHead.pitch) * headLerpSpeed;
    this.smoothedHead.yaw += (targetYaw - this.smoothedHead.yaw) * headLerpSpeed;
    this.smoothedHead.roll += (targetRoll - this.smoothedHead.roll) * headLerpSpeed;
    this.smoothedHead.yOffset += (targetYOffset - this.smoothedHead.yOffset) * headLerpSpeed;

    // نرم‌سازی نگاه چشم‌ها
    const eyeLerpSpeed = Math.min(1.0, deltaSeconds * 8.0);
    this.smoothedEyeLook.x += (targetEyeX - this.smoothedEyeLook.x) * eyeLerpSpeed;
    this.smoothedEyeLook.y += (targetEyeY - this.smoothedEyeLook.y) * eyeLerpSpeed;

    // ۵. وزن‌های مورف نهایی (ترکیب Blink + Expression + LipSync)
    const morphs: AvatarMorphWeights = {
      mouthOpen: lipSyncOutputs.mouthOpen,
      mouthSmile: expTargets.mouthSmile,
      mouthPucker: Math.max(expTargets.mouthPucker, lipSyncOutputs.mouthPucker),
      mouthWide: Math.max(expTargets.mouthWide, lipSyncOutputs.mouthWide),
      jawDrop: lipSyncOutputs.jawDrop,

      blinkLeft: blinkVal,
      blinkRight: blinkVal,
      eyeSquint: expTargets.eyeSquint,

      browInnerUp: expTargets.browInnerUp,
      browOuterUp: expTargets.browOuterUp,
      browDown: expTargets.browDown,

      cheekPuff: expTargets.cheekPuff,
    };

    return {
      morphs,
      headTransform: this.smoothedHead,
      shoulderOffset: gestureResult.shoulderOffset,
      waveAngle: gestureResult.waveAngle,
      eyeLookTarget: this.smoothedEyeLook,
    };
  }
}
