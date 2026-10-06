import {
  RelationshipEngineState,
  InteractionHistoryItem,
} from './relationship';

export type EmotionType =
  | 'happy'
  | 'calm'
  | 'excited'
  | 'curious'
  | 'sad'
  | 'tired'
  | 'worried'
  | 'playful';

export type LifeStage =
  | 'infant'        // نوزاد و نوپا (۰ تا ۲ سال)
  | 'child_early'   // اوایل کودکی (۲ تا ۵ سال)
  | 'child'         // کودک (۵ تا ۱۱ سال)
  | 'preteen'       // پیش‌نوجوانی (۱۱ تا ۱۴ سال)
  | 'teen'          // نوجوان (۱۴ تا ۱۹ سال)
  | 'adult';        // بزرگسال (۱۹ سال به بالا)

export type DailyEventLevel = 'small' | 'medium' | 'important';

export interface DailyMemoryEvent {
  title: string;
  description: string;
  level: DailyEventLevel;
  importance: number; // 1 to 10
}

export interface DailyMemoryMood {
  emotion: EmotionType;
  intensity: number; // 0 to 1
  reason?: string;
}

export interface DailyMemoryVirtualAge {
  years: number;
  months: number;
  totalMonths: number;
  display: string;
}

export interface DailyMemory {
  id: string;
  real_date: string; // YYYY-MM-DD
  virtual_day: number;
  virtual_age: DailyMemoryVirtualAge;
  life_stage: LifeStage;
  mood: DailyMemoryMood;
  activities: string[];
  event: DailyMemoryEvent;
  memory: string;
  personality_changes: Partial<Record<keyof PersonalityTraits, number>>;
  daily_message: string;
  image_id?: string;
  daily_image?: DailyImage;
  created_at: string;
}

// هویت بصری ثابت شیوا (غیرقابل تغییر در تمام تصاویر)
export interface VisualIdentity {
  skin: string;            // پوست روشن
  eyes: string;            // چشم‌های آبی
  hair_color: string;      // موهای مشکی
  hair_texture: string;    // موهای صاف
  face_shape: string;      // صورت کشیده با حالت کمی تپل
  facial_features: string; // ویژگی‌های چهره ثابت و قابل تشخیص
}

export const SHIVA_FIXED_VISUAL_IDENTITY: VisualIdentity = {
  skin: 'پوست روشن، شفاف، نرم و طبیعی (fair porcelain skin with natural radiant glow)',
  eyes: 'چشم‌های آبی درخشان، شفاف، گیرا و زلال (vivid luminous sapphire blue eyes)',
  hair_color: 'مشکی طبیعی و پرکلاغی (natural pure jet-black hair)',
  hair_texture: 'صاف، براق و لخت (sleek, silky, straight hair falling gently)',
  face_shape: 'صورت کشیده با حالت کمی تپل و گونه‌های نرم لطیف (elongated facial structure with softly rounded, slightly chubby sweet youthful cheeks)',
  facial_features: 'اجزای چهره ظریف، مهربان، دوست‌داشتنی، منسجم و در تمام مراحل زندگی کاملاً قابل تشخیص (consistent, recognizable, delicate and lovely facial features)',
};

// ساختار منسجم و چندبخشی Prompt برای تولید تصویر روزانه
export interface StructuredImagePrompt {
  identity: string;      // هویت بصری ثابت شیوا
  age: string;           // سن مجازی و مرحله رشد
  appearance: string;    // ظاهر متناسب با سن و قد
  clothing: string;      // لباس مناسب سن، فعالیت و فصل
  activity: string;      // فعالیت روز جاری
  environment: string;   // محیط، فضا و پس‌زمینه متناسب با فصل
  emotion: string;       // حالت چهره هماهنگ با حال روحی روز
  lighting: string;      // شرایط نورپردازی
  camera: string;        // زاویه دوربین، کادربندی و عمق میدان
  visual_style: string;  // سبک بصری هنری و پردازش رنگ
  full_prompt: string;   // متن یکپارچه‌شده برای مدل
}

// ساختار داده تصویر روزانه شیوا
export interface DailyImage {
  id: string;
  real_date: string;
  virtual_day: number;
  virtual_age: string;
  life_stage: LifeStage;
  event: string;
  mood: string;
  prompt: string;
  structured_prompt?: StructuredImagePrompt;
  image_url: string;
  created_at: string;
}

export interface PersonalityTraits {
  kindness: number;      // مهربانی (پیش‌فرض: 90)
  humor: number;         // شوخ‌طبعی (پیش‌فرض: 85)
  emotionality: number;  // عاطفی بودن (پیش‌فرض: 80)
  curiosity: number;     // کنجکاوی (پیش‌فرض: 90)
  social: number;        // اجتماعی بودن (پیش‌فرض: 75)
  shyness: number;       // خجالتی بودن (پیش‌فرض: 35)
  worry: number;         // نگرانی (پیش‌فرض: 60)
  trust: number;         // اعتماد (پیش‌فرض: 85)
}

export interface VirtualAgeInfo {
  elapsedRealDays: number;
  virtualAgeMonths: number;
  years: number;
  remainingMonths: number;
  stage: LifeStage;
  stageLabel: string;
  isAdult: boolean;
  ageDisplay: string;
  nextMilestoneMonths: number;
}

export type ShivaMemoryType =
  | 'fixed_shiva'          // ۱. اطلاعات ثابت شیوا
  | 'user_important'       // ۲. اطلاعات مهم کاربر
  | 'important_memory'     // ۳. خاطرات مهم
  | 'daily_memory'         // ۴. خاطرات روزانه
  | 'short_term'           // ۵. حافظه کوتاه‌مدت
  | 'relationship';        // ۶. اطلاعات رابطه

export interface MemoryItem {
  id: string;
  type: ShivaMemoryType;
  content: string;
  importance: number; // 1 to 10
  created_at: string;
  last_used: string;
  metadata?: {
    virtualAge?: string;
    category?: string;
    tags?: string[];
  };
}

export interface UserFact {
  id: string;
  key: string;
  value: string;
  category: 'personal' | 'preference' | 'relationship' | 'work_study';
  learnedAtDate: string;
  learnedAtVirtualAge: string;
}

export interface LongTermMemory {
  id: string;
  title: string;
  detail: string;
  emotionalImpact: EmotionType;
  importance: number; // 1 to 10
  date: string;
  virtualAge: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  emotion?: EmotionType;
  emotion_intensity?: number;
  facial_expression?: string;
  gesture?: string;
  memory_candidate?: boolean;
  memory_note?: string;
  saved_memory_id?: string;
}

export interface MemoryStore {
  memories: MemoryItem[];
  recentConversations: ChatMessage[];
  // فیلدهای سازگار با نسخه‌های قبل
  fixedShivaInfo?: string[];
  userFacts?: UserFact[];
  longTermMemories?: LongTermMemory[];
}

export interface DailyLifeEntry {
  id: string;
  virtualDay: number;
  date: string;
  virtualAgeString: string;
  virtualAgeMonths: number;
  mood: EmotionType;
  activities: string[];
  importantEvent: string;
  dayMemory: string;
  dailyMessage: string;
  imagePromptDescription?: string;
}

export interface ShivaState {
  projectStartDate: string; // ISO date string
  virtualDayOffset: number; // For simulation/testing days
  lastProcessedRealDate?: string; // YYYY-MM-DD
  currentEmotion: EmotionType;
  emotionIntensity: number; // 0 to 1
  traits: PersonalityTraits;
  memory: MemoryStore;
  dailyMemories: DailyMemory[];
  dailyEntries: DailyLifeEntry[];
  dailyImages?: DailyImage[];
  currentDailyMessage: string;
  adultModeUnlocked: boolean;
  relationship?: RelationshipEngineState;
  interactionHistory?: InteractionHistoryItem[];
}

export interface MemoryAction {
  should_save: boolean;
  type?: ShivaMemoryType;
  content?: string;
  importance?: number;
  reason?: string;
}

export interface ShivaModelResponse {
  text: string;
  emotion: EmotionType;
  emotion_intensity: number;
  facial_expression: string;
  gesture: string;
  memory_candidate: boolean;
  memory_note?: string;
  memory_action?: MemoryAction;
}

// وضعیت‌های چهارگانه رابط گفت‌وگوی صوتی
export type VoiceConversationState = 'idle' | 'listening' | 'processing' | 'speaking';

// مشخصات صوتی شیوا متناسب با سن و احساسات
export type VoiceAgeTier = 'infant' | 'child_early' | 'child' | 'teen' | 'adult';

export interface VoiceProfile {
  tier: VoiceAgeTier;
  tierLabel: string;
  ageRange: string;
  basePitch: number;      // زیر و بمی صدا (0.5 تا 2.0)
  baseRate: number;       // سرعت تکلم (0.5 تا 1.5)
  timbreDescription: string;
  emotionalTone: string;
}

// ساختار داده برای آماده‌سازی اتصال آواتار سه‌بعدی و Lip Sync در مرحله بعد
export interface LipSyncData {
  mouthOpenRatio: number;      // میزان باز شدن دهان (0.0 تا 1.0)
  mouthWidthRatio: number;     // پهنای دهان / لبخند (0.0 تا 1.0)
  jawDrop: number;             // فرورفتگی فک برای مدل ۳بعدی (0.0 تا 1.0)
  viseme: string;              // شناسه فوتک/واج دهان (aa, E, I, O, U, rest)
  audioLevel: number;          // شدت بلندی صدای جاری (RMS)
  facialExpression: string;    // حالت چهره بازگشتی از Gemini
  gesture: string;             // ژست بازگشتی از Gemini
  timestamp: number;
}

