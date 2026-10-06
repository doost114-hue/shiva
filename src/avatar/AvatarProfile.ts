import { AvatarAgeStage, AvatarProfile } from '../types/avatar';
import { getVoiceProfileForAge } from '../services/speechService';
import { LifeStage } from '../types/shiva';
import { SHIVA_CANONICAL_VISUAL_IDENTITY } from '../identity/ShivaVisualIdentity';
import {
  calculateProgressiveAppearance,
  getAgeAppearanceProfile,
  GrowthStageKey,
} from '../identity/AgeAppearanceProfile';
import { IdentityLock } from '../identity/IdentityLock';

/**
 * تبدیل مرحله سنی LifeStage یا سال به مرحله آواتار AvatarAgeStage
 */
export function lifeStageToAvatarAgeStage(stage: LifeStage | string, years: number): AvatarAgeStage {
  if (years < 1) return 'infant';
  if (years < 4) return 'toddler';
  if (years < 10) return 'child';
  if (years < 14) return 'preteen';
  if (years < 18) return 'teen';
  return 'adult';
}

/**
 * ایجاد پروفایل‌های ۶گانه آواتار (avatar_profiles) متصل به ShivaVisualIdentity و Age Engine
 * 
 * ساختار:
 * ShivaVisualIdentity
 *   ↓
 * Age Engine
 *   ↓
 * Avatar Profile
 *   ↓
 * 3D Avatar
 */
export function getAvatarProfile(
  years: number,
  customModelUrl: string | null = null
): AvatarProfile {
  const ageStage = lifeStageToAvatarAgeStage('child', years);
  const { profile: ageProfile, progressiveParams, stageKey } = getAgeAppearanceProfile(years, years * 12);
  const voiceProfile = getVoiceProfileForAge(years, 'calm');

  // انطباق و قفل هویت کانونیکال (عدم تناقض مشخصات آواتار با هویت اصلی)
  const consistency = IdentityLock.checkAndEnforceConsistency({}, stageKey);
  const identity = consistency.finalIdentity;

  switch (ageStage) {
    case 'infant':
      return {
        id: 'avatar-infant',
        model_url: customModelUrl,
        age_stage: 'infant',
        idle_animation: 'gentle_cradle',
        animation_profile: 'infant_gentle_breathing',
        voice_profile: voiceProfile,
        expression: 'neutral_soft',
        lip_sync_enabled: true,
        scale: progressiveParams.scale,
        face_chubby: progressiveParams.cheek_chubbiness,
        eye_size_ratio: progressiveParams.eye_openness_size_ratio,
        head_scale: progressiveParams.head_to_body_ratio,
        clothing_color: '#93c5fd', // آبی نوزادی ملایم
        hair_style: 'short_soft',
        age_title_fa: 'نوزادی شیوا (زیر ۱ سال)',
        visual_identity_name: identity.name,
        progressive_progress: progressiveParams.progressive_progress,
      };

    case 'toddler':
    case 'child_early':
      return {
        id: 'avatar-toddler',
        model_url: customModelUrl,
        age_stage: 'toddler',
        idle_animation: 'playful_bounce',
        animation_profile: 'toddler_active_nodding',
        voice_profile: voiceProfile,
        expression: 'smile',
        lip_sync_enabled: true,
        scale: progressiveParams.scale,
        face_chubby: progressiveParams.cheek_chubbiness,
        eye_size_ratio: progressiveParams.eye_openness_size_ratio,
        head_scale: progressiveParams.head_to_body_ratio,
        clothing_color: '#fbcfe8', // صورتی ملایم کودکانه
        hair_style: 'straight_bob',
        age_title_fa: 'نوپا و خردسالی شیوا (۱ تا ۳ سال)',
        visual_identity_name: identity.name,
        progressive_progress: progressiveParams.progressive_progress,
      };

    case 'child':
      return {
        id: 'avatar-child',
        model_url: customModelUrl,
        age_stage: 'child',
        idle_animation: 'curious_look',
        animation_profile: 'child_inquisitive_tilt',
        voice_profile: voiceProfile,
        expression: 'smile',
        lip_sync_enabled: true,
        scale: progressiveParams.scale,
        face_chubby: progressiveParams.cheek_chubbiness,
        eye_size_ratio: progressiveParams.eye_openness_size_ratio,
        head_scale: progressiveParams.head_to_body_ratio,
        clothing_color: '#fed7aa', // هلویی/نارنجی ملایم
        hair_style: 'straight_shoulders',
        age_title_fa: 'کودکی و دبستان شیوا (۴ تا ۹ سال)',
        visual_identity_name: identity.name,
        progressive_progress: progressiveParams.progressive_progress,
      };

    case 'preteen':
      return {
        id: 'avatar-preteen',
        model_url: customModelUrl,
        age_stage: 'preteen',
        idle_animation: 'friendly_nod',
        animation_profile: 'preteen_gentle_glance',
        voice_profile: voiceProfile,
        expression: 'neutral_soft',
        lip_sync_enabled: true,
        scale: progressiveParams.scale,
        face_chubby: progressiveParams.cheek_chubbiness,
        eye_size_ratio: progressiveParams.eye_openness_size_ratio,
        head_scale: progressiveParams.head_to_body_ratio,
        clothing_color: '#ccfbf1', // فیروزه‌ای ملایم
        hair_style: 'sleek_straight_medium',
        age_title_fa: 'پیش‌نوجوانی شیوا (۱۰ تا ۱۳ سال)',
        visual_identity_name: identity.name,
        progressive_progress: progressiveParams.progressive_progress,
      };

    case 'teen':
      return {
        id: 'avatar-teen',
        model_url: customModelUrl,
        age_stage: 'teen',
        idle_animation: 'attentive_breathing',
        animation_profile: 'teen_poised_breathing',
        voice_profile: voiceProfile,
        expression: 'neutral_soft',
        lip_sync_enabled: true,
        scale: progressiveParams.scale,
        face_chubby: progressiveParams.cheek_chubbiness,
        eye_size_ratio: progressiveParams.eye_openness_size_ratio,
        head_scale: progressiveParams.head_to_body_ratio,
        clothing_color: '#e0e7ff', // نیلی یاسی محجوب
        hair_style: 'long_silky_straight',
        age_title_fa: 'نوجوانی شیوا (۱۴ تا ۱۷ سال)',
        visual_identity_name: identity.name,
        progressive_progress: progressiveParams.progressive_progress,
      };

    case 'adult':
    default:
      return {
        id: 'avatar-adult',
        model_url: customModelUrl,
        age_stage: 'adult',
        idle_animation: 'elegant_breathing',
        animation_profile: 'adult_dignified_presence',
        voice_profile: voiceProfile,
        expression: 'neutral_soft',
        lip_sync_enabled: true,
        scale: progressiveParams.scale,
        face_chubby: progressiveParams.cheek_chubbiness,
        eye_size_ratio: progressiveParams.eye_openness_size_ratio,
        head_scale: progressiveParams.head_to_body_ratio,
        clothing_color: '#f1f5f9', // شیری و نقره‌ای ملایم باوقار
        hair_style: 'long_silky_straight_parted',
        age_title_fa: 'بزرگسالی شیوا (۱۸ سال به بالا)',
        visual_identity_name: identity.name,
        progressive_progress: progressiveParams.progressive_progress,
      };
  }
}
