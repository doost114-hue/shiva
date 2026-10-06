import { EmotionType, LifeStage } from './shiva';

// حالت‌های کلان رابطه (Relationship Mode)
export type RelationshipMode =
  | 'family_caregiver'   // رابطه مراقبتی / خانوادگی (تنها حالت مجاز برای زیر ۱۸ سال)
  | 'adult_family'       // رابطه خانوادگی در بزرگسالی
  | 'adult_friendship'   // دوستی نزدیک در بزرگسالی
  | 'adult_romantic';    // رابطه رمانتیک مستقل در بزرگسالی (صرفاً در صورت فعال‌سازی صریح)

// وضعیت‌های پایه رابطه (Relationship State)
export type RelationshipStateStatus =
  | 'new'            // آشنایی اولیه
  | 'familiar'       // آشنا و مأنوس
  | 'close'          // نزدیک و صمیمی
  | 'trusted'        // مورد اعتماد و حامی
  | 'strong_bond'    // پیوند عمیق و استوار
  | 'adult_family'   // پیوند خانوادگی بزرگسال
  | 'adult_friend'   // دوست صمیمی بزرگسال
  | 'adult_romantic'; // رابطه رمانتیک بزرگسال

// متغیرهای درونی رابطه (۰ تا ۱۰۰) - برای محاسبات و تصمیم‌گیری‌های داخلی سیستم
export interface RelationshipVariables {
  trust: number;          // اعتماد (0 تا 100)
  familiarity: number;    // آشنایی و انس (0 تا 100)
  affection: number;      // محبت و دلبستگی (0 تا 100)
  respect: number;        // احترام متقابل (0 تا 100)
  communication: number;  // کیفیت ارتباط (0 تا 100)
  shared_history: number; // غنای تاریخچه مشترک (0 تا 100)
}

// ساختار اصلی ذخیره وضعیت رابطه در ShivaState
export interface RelationshipEngineState {
  mode: RelationshipMode;
  state: RelationshipStateStatus;
  trust: number;
  familiarity: number;
  affection: number;
  respect: number;
  communication: number;
  shared_history: number;
  adult_relationship_available: boolean;
  romantic_relationship: boolean;
  startedAt: string; // تاریخ آغاز رابطه
  lastInteractionAt?: string; // آخرین تاریخ تعامل
}

// تاریخچه تعامل‌های مهم (فقط تعامل‌های ارزشمند ذخیره می‌شوند)
export interface InteractionHistoryItem {
  id: string;
  date: string;
  type: 'conversation' | 'milestone' | 'daily_event' | 'support';
  summary: string;
  impact: {
    trust: number;         // بین -2 تا +2 در تعاملات معمولی
    familiarity: number;
    affection: number;
    respect: number;
    communication: number;
  };
  virtualAgeAtTime?: string;
}

// نقطه عطف یا رویداد مهم در تایم‌لاین رابطه
export interface RelationshipMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  virtualAge: string;
  category: 'first_meet' | 'trust_built' | 'deep_conversation' | 'daily_shared' | 'milestone_celebration' | 'adult_transition';
  importance: number; // 1 to 10
}

// نتیجه ارزیابی AgeGate
export interface AgeGateCheckResult {
  isAdult: boolean;
  virtualAgeYears: number;
  allowedModes: RelationshipMode[];
  isRomanticAllowed: boolean;
  isFlirtationAllowed: boolean;
  isSexualAllowed: boolean;
  enforcedMode: RelationshipMode;
  reason?: string;
}

// داده‌های زمینه برای تولید پاسخ هوش مصنوعی
export interface RelationshipContextForPrompt {
  relationship_mode: RelationshipMode;
  relationship_mode_label: string;
  relationship_state: RelationshipStateStatus;
  relationship_state_label: string;
  bond_description: string;
  safe_boundary_instruction: string;
}
