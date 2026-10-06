/**
 * سیستم مدیریت نسخه‌های هویت بصری شیوا
 * IdentityVersioning - visual_identity_versions
 * 
 * طبق بند ۱۱ و ۱۲ مشخصات:
 * - هر تغییر عمدی در هویت بصری باید به عنوان نسخه جدید ذخیره شود.
 * - تغییرات تصادفی مدل تصویرساز نباید به عنوان تغییر هویت ثبت شوند.
 * - ویژگی‌های بنیادی مانند رنگ چشم نباید خودکار تغییر کنند.
 */

import { SHIVA_CANONICAL_VISUAL_IDENTITY, ShivaVisualIdentityData } from './ShivaVisualIdentity';

export interface VisualIdentityVersion {
  version: string;
  timestamp: string;
  author: 'system' | 'user_intentional';
  changeType: 'initial' | 'refinement' | 'milestone';
  description: string;
  snapshot: ShivaVisualIdentityData;
}

const STORAGE_KEY_IDENTITY_VERSIONS = 'shiva_visual_identity_versions_v1';

/**
 * نسخه اولیه کانونیکال (Source of Truth پایه)
 */
export const INITIAL_VISUAL_IDENTITY_VERSION: VisualIdentityVersion = {
  version: 'v1.0.0',
  timestamp: '2026-09-15T00:00:00.000Z',
  author: 'system',
  changeType: 'initial',
  description: 'نسخه کانونیکال پایه هویت پایدار شیوا: پوست روشن، چشمان آبی، موهای مشکی صاف و گونه‌های تپل',
  snapshot: { ...SHIVA_CANONICAL_VISUAL_IDENTITY },
};

export class IdentityVersioningService {
  /**
   * بارگذاری تمام نسخه‌های هویت بصری
   */
  public static getVersions(): VisualIdentityVersion[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_IDENTITY_VERSIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load visual identity versions from storage:', err);
    }
    return [INITIAL_VISUAL_IDENTITY_VERSION];
  }

  /**
   * دریافت آخرین نسخه فعال هویت
   */
  public static getLatestVersion(): VisualIdentityVersion {
    const list = this.getVersions();
    return list[list.length - 1] || INITIAL_VISUAL_IDENTITY_VERSION;
  }

  /**
   * ثبت عمدی یک نسخه جدید هویت (با اعتبارسنجی قوانین مصونیت)
   */
  public static registerIntentionalVersion(
    newSnapshot: Partial<ShivaVisualIdentityData>,
    description: string,
    author: 'user_intentional' | 'system' = 'user_intentional'
  ): { success: boolean; version?: VisualIdentityVersion; error?: string } {
    // قوانین مصونیت هویتی: ویژگی‌های بنیادین تغییرناپذیرند مگر با اراده صریح
    const current = this.getLatestVersion().snapshot;

    const consolidated: ShivaVisualIdentityData = {
      ...current,
      ...newSnapshot,
      name: 'شیوا',
      gender: 'female',
      consistency_priority: 1.0,
      // محافظت از ویژگی‌های اصلی
      eye_color: newSnapshot.eye_color || current.eye_color,
      hair_color: newSnapshot.hair_color || current.hair_color,
      hair_type: newSnapshot.hair_type || current.hair_type,
      skin_tone: newSnapshot.skin_tone || current.skin_tone,
      face_shape: newSnapshot.face_shape || current.face_shape,
    };

    const versions = this.getVersions();
    const nextVerNumber = `v1.${versions.length}.0`;

    const newVer: VisualIdentityVersion = {
      version: nextVerNumber,
      timestamp: new Date().toISOString(),
      author,
      changeType: 'refinement',
      description,
      snapshot: consolidated,
    };

    versions.push(newVer);

    try {
      localStorage.setItem(STORAGE_KEY_IDENTITY_VERSIONS, JSON.stringify(versions));
      return { success: true, version: newVer };
    } catch (e) {
      return { success: false, error: 'خطا در ذخیره‌سازی نسخه هویت بصری' };
    }
  }

  /**
   * بازنشانی کامل به نسخه کانونیکال پایه
   */
  public static resetToCanonical(): VisualIdentityVersion {
    const list = [INITIAL_VISUAL_IDENTITY_VERSION];
    try {
      localStorage.setItem(STORAGE_KEY_IDENTITY_VERSIONS, JSON.stringify(list));
    } catch {}
    return INITIAL_VISUAL_IDENTITY_VERSION;
  }
}
