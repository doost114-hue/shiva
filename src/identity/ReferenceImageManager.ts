/**
 * معماری تصاویر مرجع هویت بصری شیوا
 * Reference Image Architecture
 * 
 * ساختار درخواستی در بند ۶:
 * identity_references
 * ├── infant_reference
 * ├── toddler_reference
 * ├── child_reference
 * ├── preteen_reference
 * ├── teen_reference
 * └── adult_reference
 * 
 * قوانین:
 * ۱. در صورت عدم وجود تصویر مرجع، سیستم باید بدون هیچ‌گونه خطا کار کند (Safe Fallback).
 * ۲. در صورت وجود تصویر مرجع، از آن برای هدایت دقیق‌تر مدل‌های تصویرساز و تطبیق آواتار استفاده می‌شود.
 */

import { GrowthStageKey } from './AgeAppearanceProfile';

export interface IdentityReferenceItem {
  stage: GrowthStageKey;
  labelFa: string;
  imageUrl: string | null;
  aspectRatio: string;
  source: 'preset' | 'user_upload' | 'generated_approved';
  notes?: string;
}

export interface IdentityReferencesCollection {
  infant_reference: IdentityReferenceItem;
  toddler_reference: IdentityReferenceItem;
  child_reference: IdentityReferenceItem;
  preteen_reference: IdentityReferenceItem;
  teen_reference: IdentityReferenceItem;
  adult_reference: IdentityReferenceItem;
}

const STORAGE_KEY_REFERENCES = 'shiva_identity_references_v1';

export class ReferenceImageManager {
  /**
   * مقادیر پیش‌فرض ساختار تصاویر مرجع
   */
  public static getDefaultReferences(): IdentityReferencesCollection {
    return {
      infant_reference: {
        stage: 'infant',
        labelFa: 'مرجع نوزادی شیوا',
        imageUrl: null,
        aspectRatio: '1:1',
        source: 'preset',
        notes: 'نوزاد دختر با پوست بسیار روشن، چشمان آبی درخشان و موهای کوتاه لخت مشکی',
      },
      toddler_reference: {
        stage: 'toddler',
        labelFa: 'مرجع نوپا و خردسالی شیوا',
        imageUrl: null,
        aspectRatio: '1:1',
        source: 'preset',
        notes: 'کودک خردسال با موهای چتری/کوتاه مشکی لخت و گونه‌های تپل صورتی',
      },
      child_reference: {
        stage: 'child',
        labelFa: 'مرجع کودکی و دبستان شیوا',
        imageUrl: null,
        aspectRatio: '1:1',
        source: 'preset',
        notes: 'دختربچه مدرسه‌ای با موهای لخت مشکی تا روی شانه و لبخند معصومانه',
      },
      preteen_reference: {
        stage: 'preteen',
        labelFa: 'مرجع پیش‌نوجوانی شیوا',
        imageUrl: null,
        aspectRatio: '1:1',
        source: 'preset',
        notes: 'چهره کشیده نوجوان با لطافت گونه‌ها و موهای لخت مشکی براق',
      },
      teen_reference: {
        stage: 'teen',
        labelFa: 'مرجع نوجوانی شیوا',
        imageUrl: null,
        aspectRatio: '1:1',
        source: 'preset',
        notes: 'دختر نوجوان باوقار، نگاه عمیق آبی یاقوتی و موهای بلند صاف',
      },
      adult_reference: {
        stage: 'adult',
        labelFa: 'مرجع بزرگسالی شیوا',
        imageUrl: null,
        aspectRatio: '1:1',
        source: 'preset',
        notes: 'بانوی جوان باوقار و اصیل با حفظ کامل چشمان آبی و موهای مشکی لخت شیوا',
      },
    };
  }

  /**
   * بارگذاری تمام مراجع بصری
   */
  public static getAllReferences(): IdentityReferencesCollection {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REFERENCES);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...this.getDefaultReferences(),
          ...parsed,
        };
      }
    } catch (e) {
      console.warn('Failed to load identity references from storage:', e);
    }
    return this.getDefaultReferences();
  }

  /**
   * دریافت تصویر مرجع برای یک مرحله سنی خاص
   */
  public static getReferenceForStage(stage: GrowthStageKey): IdentityReferenceItem {
    const all = this.getAllReferences();
    const key = `${stage}_reference` as keyof IdentityReferencesCollection;
    return all[key] || all.child_reference;
  }

  /**
   * بررسی وجود تصویر مرجع برای مرحله فعلی
   */
  public static hasReferenceForStage(stage: GrowthStageKey): boolean {
    const item = this.getReferenceForStage(stage);
    return Boolean(item.imageUrl && item.imageUrl.trim().length > 0);
  }

  /**
   * به‌روزرسانی تصویر مرجع یک مرحله
   */
  public static setReferenceForStage(
    stage: GrowthStageKey,
    imageUrl: string | null,
    source: 'preset' | 'user_upload' | 'generated_approved' = 'user_upload'
  ): boolean {
    try {
      const all = this.getAllReferences();
      const key = `${stage}_reference` as keyof IdentityReferencesCollection;
      all[key] = {
        ...all[key],
        imageUrl,
        source,
      };
      localStorage.setItem(STORAGE_KEY_REFERENCES, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error('Error saving identity reference:', e);
      return false;
    }
  }

  /**
   * دریافت دستورات متنی مکمل پرامپت در صورت وجود مرجع تصویری
   */
  public static getReferencePromptGuidance(stage: GrowthStageKey): string {
    const ref = this.getReferenceForStage(stage);
    if (ref.imageUrl) {
      return `REFERENCE LOCK: Maintain absolute facial consistency and aesthetic resemblance with Shiva's verified reference image for ${stage} stage. Ensure identical eye hue, hair tone, nose bridge, and elongated softly-rounded face proportion.`;
    }
    return '';
  }
}
