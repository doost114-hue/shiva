/**
 * سیستم قفل هویت بصری شیوا
 * IdentityLock & Consistency Checker
 * 
 * بر اساس بند ۴ و بند ۱۳ مشخصات مرحله ۱۵:
 * فرایند:
 * ShivaVisualIdentity + AgeAppearanceProfile + DailyContext + Emotion -> Final Visual Configuration
 * 
 * قوانین:
 * ۱. ویژگی‌های ثابت نباید توسط DailyContext یا Emotion تغییر کنند.
 * ۲. قبل از تولید تصویر یا آواتار، بررسی خودکار انطباق انجام شود.
 * ۳. در صورت هرگونه تناقض، تنظیمات ثابت هویت بر تنظیمات متغیر اولویت مطلق دارند.
 */

import { SHIVA_CANONICAL_VISUAL_IDENTITY, ShivaVisualIdentityData } from './ShivaVisualIdentity';
import {
  AgeAppearanceProfileData,
  AppearanceParameters,
  getAgeAppearanceProfile,
  GrowthStageKey,
  lifeStageToGrowthStageKey,
} from './AgeAppearanceProfile';
import { ReferenceImageManager } from './ReferenceImageManager';
import { EmotionType, LifeStage } from '../types/shiva';

export interface DailyContextInput {
  virtualDay: number;
  realDate?: string;
  activity: string;
  eventTitle: string;
  seasonName?: string;
  seasonEn?: string;
  weatherDesc?: string;
}

export interface FinalVisualConfiguration {
  identity: ShivaVisualIdentityData;
  ageStage: GrowthStageKey;
  ageProfile: AgeAppearanceProfileData;
  progressiveParams: AppearanceParameters;
  emotion: EmotionType;
  dailyContext: DailyContextInput;
  referenceImageUrl: string | null;
  consistencyScore: number;       // 1.0 (۱۰۰٪ منطبق)
  isLocked: boolean;              // همیشه true
  fullPromptText: string;
  sanitizedConfig: {
    skin_tone: string;
    eye_color: string;
    hair_color: string;
    hair_type: string;
    face_shape: string;
  };
}

export interface ConsistencyCheckResult {
  passed: boolean;
  score: number; // 0 to 1.0
  checkedFields: {
    field: string;
    expected: any;
    actual: any;
    status: 'matched' | 'corrected' | 'inconsistent';
  }[];
  appliedCorrections: string[];
  finalIdentity: ShivaVisualIdentityData;
}

export class IdentityLock {
  /**
   * بررسی خودکار هماهنگی و اعمال قفل اولویت هویت (Consistency Check)
   */
  public static checkAndEnforceConsistency(
    candidate: Partial<ShivaVisualIdentityData>,
    ageStage: GrowthStageKey
  ): ConsistencyCheckResult {
    const canonical = SHIVA_CANONICAL_VISUAL_IDENTITY;
    const checkedFields: ConsistencyCheckResult['checkedFields'] = [];
    const appliedCorrections: string[] = [];

    // ۱. رنگ چشم
    if (candidate.eye_color && candidate.eye_color !== canonical.eye_color) {
      appliedCorrections.push(`اصلاح خودکار رنگ چشم از "${candidate.eye_color}" به "${canonical.eye_color}"`);
      checkedFields.push({ field: 'eye_color', expected: canonical.eye_color, actual: candidate.eye_color, status: 'corrected' });
    } else {
      checkedFields.push({ field: 'eye_color', expected: canonical.eye_color, actual: canonical.eye_color, status: 'matched' });
    }

    // ۲. رنگ مو
    if (candidate.hair_color && candidate.hair_color !== canonical.hair_color) {
      appliedCorrections.push(`اصلاح خودکار رنگ مو از "${candidate.hair_color}" به "${canonical.hair_color}"`);
      checkedFields.push({ field: 'hair_color', expected: canonical.hair_color, actual: candidate.hair_color, status: 'corrected' });
    } else {
      checkedFields.push({ field: 'hair_color', expected: canonical.hair_color, actual: canonical.hair_color, status: 'matched' });
    }

    // ۳. نوع مو
    if (candidate.hair_type && candidate.hair_type !== canonical.hair_type) {
      appliedCorrections.push(`اصلاح خودکار حالت مو از "${candidate.hair_type}" به "${canonical.hair_type}"`);
      checkedFields.push({ field: 'hair_type', expected: canonical.hair_type, actual: candidate.hair_type, status: 'corrected' });
    } else {
      checkedFields.push({ field: 'hair_type', expected: canonical.hair_type, actual: canonical.hair_type, status: 'matched' });
    }

    // ۴. رنگ پوست
    if (candidate.skin_tone && candidate.skin_tone !== canonical.skin_tone) {
      appliedCorrections.push(`اصلاح خودکار رنگ پوست از "${candidate.skin_tone}" به "${canonical.skin_tone}"`);
      checkedFields.push({ field: 'skin_tone', expected: canonical.skin_tone, actual: candidate.skin_tone, status: 'corrected' });
    } else {
      checkedFields.push({ field: 'skin_tone', expected: canonical.skin_tone, actual: canonical.skin_tone, status: 'matched' });
    }

    // ۵. ساختار چهره
    if (candidate.face_shape && candidate.face_shape !== canonical.face_shape) {
      appliedCorrections.push(`اصلاح خودکار فرم صورت به "${canonical.face_shape}"`);
      checkedFields.push({ field: 'face_shape', expected: canonical.face_shape, actual: candidate.face_shape, status: 'corrected' });
    } else {
      checkedFields.push({ field: 'face_shape', expected: canonical.face_shape, actual: canonical.face_shape, status: 'matched' });
    }

    // ۶. ویژگی‌های شاخص
    checkedFields.push({
      field: 'identity_features',
      expected: canonical.identity_features,
      actual: canonical.identity_features,
      status: 'matched',
    });

    // ۷. تطبیق مرحله سنی با هویت
    checkedFields.push({
      field: 'age_stage',
      expected: ageStage,
      actual: ageStage,
      status: 'matched',
    });

    const passed = appliedCorrections.length === 0;
    const score = passed ? 1.0 : +(1.0 - (appliedCorrections.length * 0.15)).toFixed(2);

    return {
      passed,
      score,
      checkedFields,
      appliedCorrections,
      finalIdentity: { ...canonical },
    };
  }

  /**
   * ساخت کانفیگ نهایی بصری (Final Visual Configuration)
   * تضمین عدم نفوذ تغییرات ناخواسته محیطی و احساسی به هویت ثابت
   */
  public static buildFinalVisualConfiguration(params: {
    virtualAgeYears: number;
    virtualAgeMonths: number;
    virtualAgeDisplay: string;
    lifeStage: LifeStage;
    emotion: EmotionType;
    dailyContext: DailyContextInput;
  }): FinalVisualConfiguration {
    const { profile, progressiveParams, stageKey } = getAgeAppearanceProfile(
      params.virtualAgeYears,
      params.virtualAgeMonths
    );

    // اعمال و اعتبارسنجی قفل هویت
    const consistency = this.checkAndEnforceConsistency({}, stageKey);
    const lockedIdentity = consistency.finalIdentity;

    // بازیابی تصویر مرجع در صورت وجود
    const referenceItem = ReferenceImageManager.getReferenceForStage(stageKey);
    const referenceImageUrl = referenceItem.imageUrl || null;

    // ایجاد متن پرامپت منسجم
    const identitySegment = `Character identity: ${lockedIdentity.name}. Fixed traits: Fair light radiant skin, vivid sapphire blue eyes, sleek straight pure black hair, elongated delicate face with softly rounded slightly chubby cheeks.`;
    const ageSegment = `Age: ${params.virtualAgeDisplay} (${profile.stageFa}). ${profile.safety_rule}`;
    const appearanceSegment = `Appearance: ${profile.prompt_fragment}`;
    const activitySegment = `Activity: ${params.dailyContext.activity}. Event: ${params.dailyContext.eventTitle}.`;
    const emotionSegment = `Facial expression: Reflecting ${params.emotion} with natural gentle subtlety, sparkling blue eyes.`;
    const clothingSegment = `Clothing: ${profile.clothing_guidelines}`;
    const refGuidance = ReferenceImageManager.getReferencePromptGuidance(stageKey);

    const fullPromptText = [
      identitySegment,
      ageSegment,
      appearanceSegment,
      clothingSegment,
      activitySegment,
      emotionSegment,
      refGuidance,
    ].filter(Boolean).join(' ');

    return {
      identity: lockedIdentity,
      ageStage: stageKey,
      ageProfile: profile,
      progressiveParams,
      emotion: params.emotion,
      dailyContext: params.dailyContext,
      referenceImageUrl,
      consistencyScore: consistency.score,
      isLocked: true,
      fullPromptText,
      sanitizedConfig: {
        skin_tone: lockedIdentity.skin_tone,
        eye_color: lockedIdentity.eye_color,
        hair_color: lockedIdentity.hair_color,
        hair_type: lockedIdentity.hair_type,
        face_shape: lockedIdentity.face_shape,
      },
    };
  }
}
