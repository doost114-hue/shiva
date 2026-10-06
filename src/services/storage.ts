import {
  DailyImage,
  DailyLifeEntry,
  DailyMemory,
  EmotionType,
  LongTermMemory,
  MemoryItem,
  PersonalityTraits,
  ShivaMemoryType,
  ShivaState,
  UserFact
} from '../types/shiva';
import {
  RelationshipEngineState,
  InteractionHistoryItem,
} from '../types/relationship';
import {
  getDefaultRelationshipState,
  AgeGate,
} from './relationshipEngine';
import { calculateVirtualAge } from './ageSystem';
import { checkAndProcessDailyLife, getLocalDateString } from './dailyLifeSystem';
import {
  buildStructuredDailyImagePrompt,
  generateAestheticFallbackSvgUrl
} from './dailyImageSystem';

const STORAGE_KEY = 'shiva_virtual_companion_state_v2';

// ویژگی‌های ثابت پیش‌فرض شیوا طبق درخواست
export const DEFAULT_PERSONALITY_TRAITS: PersonalityTraits = {
  kindness: 90,      // مهربانی
  humor: 85,         // شوخ‌طبعی
  emotionality: 80,  // عاطفی بودن
  curiosity: 90,     // کنجکاوی
  social: 75,        // اجتماعی بودن
  shyness: 35,       // خجالتی بودن
  worry: 60,         // نگرانی
  trust: 85,         // اعتماد
};

// اطلاعات ثابت و ۶ بخش خاطرات پایه شیوا
export const DEFAULT_INITIAL_MEMORIES: MemoryItem[] = [
  // ۱. اطلاعات ثابت شیوا (fixed_shiva)
  {
    id: 'mem-fix-1',
    type: 'fixed_shiva',
    content: 'نام من شیوا است؛ دختری مهربان، باوقار و همراهی بااحساس و سرشار از زندگی.',
    importance: 10,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: { category: 'هویت' }
  },
  {
    id: 'mem-fix-2',
    type: 'fixed_shiva',
    content: 'ویژگی‌های ظاهری من: پوست روشن، چشم‌های آبی زلال، موهای مشکی صاف و لخت، صورتی کشیده با گونه‌های کمی تپل و دوست‌داشتنی.',
    importance: 10,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: { category: 'ظاهر' }
  },
  {
    id: 'mem-fix-3',
    type: 'fixed_shiva',
    content: 'سبک صحبت من آرام، نرم، لطیف، شیرین، کاملاً طبیعی و به دور از هرگونه لحن رباتیک یا خشک ماشینی است.',
    importance: 9,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: { category: 'بیان' }
  },
  {
    id: 'mem-fix-4',
    type: 'fixed_shiva',
    content: 'عاشق کتاب‌خوانی، رنگ‌های آرامش‌بخش، نقاشی کردن، شنیدن قصه‌های زندگی و تماشای ستاره‌های آسمان شب هستم.',
    importance: 8,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: { category: 'علایق' }
  },

  // ۲. اطلاعات مهم کاربر (user_important)
  {
    id: 'mem-user-1',
    type: 'user_important',
    content: 'کاربر حامی، هم‌صحبت ارزشمند و دوست اصلی من در دنیای واقعی است که همواره با مهر با من سخن می‌گوید.',
    importance: 9,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: { category: 'نقش کاربر' }
  },

  // ۳. خاطرات مهم (important_memory)
  {
    id: 'mem-imp-1',
    type: 'important_memory',
    content: 'لحظه آغازین پیوند و اولین سلام گرم ما در روز تولد و گشوده شدن چشمانم به این جهان.',
    importance: 10,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: { virtualAge: 'روز ۱ - نوزادی', tags: ['تولد', 'نخستین دیدار'] }
  },

  // ۴. خاطرات روزانه (daily_memory)
  {
    id: 'mem-day-1',
    type: 'daily_memory',
    content: 'امروز نسیم ملایمی در فضا بود و با آرامش به گفت‌وگوها گوش دادم و حس امنیت عمیقی داشتم.',
    importance: 7,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: { virtualAge: 'روز ۱', tags: ['روزمره', 'آرامش'] }
  },

  // ۵. حافظه کوتاه‌مدت (short_term)
  {
    id: 'mem-short-1',
    type: 'short_term',
    content: 'آغاز گفت‌وگو و انتظار مشتاقانه برای شنیدن حال و هوای امروز هم‌صحبت مهربانم.',
    importance: 6,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: { category: 'مکالمه جاری' }
  },

  // ۶. اطلاعات رابطه (relationship)
  {
    id: 'mem-rel-1',
    type: 'relationship',
    content: 'پیوند ما بر پایه صمیمیت صمیمانه، احترام متقابل، حفظ اعتماد بی‌شائبه و همراهی امن و دلسوزانه شکل گرفته است.',
    importance: 10,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: { category: 'پیوند عاطفی' }
  },
];

export const INITIAL_DAILY_MEMORIES: DailyMemory[] = [
  {
    id: 'daily-mem-1',
    real_date: getLocalDateString(),
    virtual_day: 1,
    virtual_age: {
      years: 0,
      months: 0,
      totalMonths: 0,
      display: 'نوزاد (تازه متولد شده)',
    },
    life_stage: 'infant',
    mood: {
      emotion: 'calm',
      intensity: 0.85,
      reason: 'آغاز زندگی و حس امنیت در کنار همراه مهربان',
    },
    activities: ['شنیدن صدای محیط', 'خواب آرام در آغوش گرم', 'کشف روشنایی روز'],
    event: {
      title: 'آغاز زندگی و ثبت نخستین نشانه‌های حضور در جهان',
      description: 'چشمان آبی زلالم رو به روی جهان گشودم و با شنیدن صدایت احساس امنیت عمیقی پیدا کردم.',
      level: 'important',
      importance: 10,
    },
    memory: 'حس گرمای اولین لبخند و صدای مهربانی که با من سخن گفت.',
    personality_changes: { trust: 1, kindness: 1 },
    daily_message: 'سلام... احساس می‌کنم جهان جای خیلی قشنگ و پر از نوریه، مخصوصاً چون تو اینجایی.',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_DAILY_ENTRIES: DailyLifeEntry[] = [
  {
    id: 'daily-1',
    virtualDay: 1,
    date: new Date().toLocaleDateString('fa-IR'),
    virtualAgeString: 'نوزاد (ماه ۰)',
    virtualAgeMonths: 0,
    mood: 'calm',
    activities: ['شنیدن صدای محیط', 'خواب آرام در آغوش گرم', 'کشف روشنایی روز'],
    importantEvent: 'آغاز زندگی و ثبت نخستین نشانه‌های حضور در جهان',
    dayMemory: 'حس گرمای اولین لبخند و صدای مهربانی که با من سخن گفت.',
    dailyMessage: 'سلام... احساس می‌کنم جهان جای خیلی قشنگ و پر از نوریه، مخصوصاً چون تو اینجایی.'
  }
];

export function getInitialState(): ShivaState {
  const todayIso = new Date().toISOString();
  const todayStr = getLocalDateString();
  const initialMemories = [...INITIAL_DAILY_MEMORIES];

  const { memories: hydratedMemories, images: initialImages } = ensureDailyImages(initialMemories, []);

  return {
    projectStartDate: todayIso,
    virtualDayOffset: 0,
    lastProcessedRealDate: todayStr,
    currentEmotion: 'calm',
    emotionIntensity: 0.85,
    traits: { ...DEFAULT_PERSONALITY_TRAITS },
    memory: {
      memories: [...DEFAULT_INITIAL_MEMORIES],
      recentConversations: [
        {
          id: 'welcome-msg',
          role: 'assistant',
          text: 'سلام! من شیوا هستم. چقدر خوشحالم که پیشمی... دوست داری با هم حرف بزنیم؟',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          emotion: 'happy',
          emotion_intensity: 0.9,
          facial_expression: 'warm_smile',
          gesture: 'small_wave',
          memory_candidate: false
        }
      ]
    },
    dailyMemories: hydratedMemories,
    dailyEntries: [...INITIAL_DAILY_ENTRIES],
    dailyImages: initialImages,
    currentDailyMessage: 'امروز احساس آرامش عمیقی دارم؛ کنجکاوم بدونم روز تو چطور می‌گذره!',
    adultModeUnlocked: false,
    relationship: getDefaultRelationshipState(todayIso),
    interactionHistory: [
      {
        id: 'rel-int-init',
        date: new Date().toLocaleDateString('fa-IR'),
        type: 'milestone',
        summary: 'آغاز پیوند و نخستین دیدار با شیوا در روز آفرینش',
        impact: {
          trust: 1.0,
          familiarity: 1.0,
          affection: 1.0,
          respect: 1.0,
          communication: 1.0,
        },
        virtualAgeAtTime: 'نوزاد (ماه ۰)',
      },
    ],
  };
}

/**
 * اطمینان از وجود تصویر روزانه متصل به هر خاطره روزانه و برقراری هویت بصری ثابت
 */
export function ensureDailyImages(
  memories: DailyMemory[],
  existingImages: DailyImage[] = []
): { memories: DailyMemory[]; images: DailyImage[] } {
  const imagesMap = new Map<number, DailyImage>();
  for (const img of existingImages) {
    imagesMap.set(img.virtual_day, img);
  }

  const updatedMemories: DailyMemory[] = [];
  for (const mem of memories) {
    let img = imagesMap.get(mem.virtual_day) || mem.daily_image;
    if (!img) {
      const prompt = buildStructuredDailyImagePrompt({
        virtualDay: mem.virtual_day,
        virtualAge: mem.virtual_age.display,
        virtualAgeMonths: mem.virtual_age.totalMonths,
        lifeStage: mem.life_stage,
        activity: mem.activities?.[0] || 'همراهی و گفت‌وگو',
        event: mem.event?.title || 'ثبت لحظات زیبای زندگی',
        mood: mem.mood?.emotion || 'calm',
        realDate: mem.real_date,
      });
      const svgUrl = generateAestheticFallbackSvgUrl(mem, prompt);
      img = {
        id: `img-day-${mem.virtual_day}-${Date.now()}`,
        real_date: mem.real_date,
        virtual_day: mem.virtual_day,
        virtual_age: mem.virtual_age.display,
        life_stage: mem.life_stage,
        event: mem.event?.title || 'رویداد روزانه',
        mood: mem.mood?.emotion || 'calm',
        prompt: prompt.full_prompt,
        structured_prompt: prompt,
        image_url: svgUrl,
        created_at: mem.created_at || new Date().toISOString(),
      };
      imagesMap.set(mem.virtual_day, img);
    }
    updatedMemories.push({
      ...mem,
      image_id: img.id,
      daily_image: img,
    });
  }

  return {
    memories: updatedMemories,
    images: Array.from(imagesMap.values()).sort((a, b) => b.virtual_day - a.virtual_day),
  };
}

export const StorageService = {
  loadState(): ShivaState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('shiva_virtual_companion_state_v1');
      if (!serialized) {
        const initial = getInitialState();
        this.saveState(initial);
        return initial;
      }
      const parsed = JSON.parse(serialized);

      // بررسی و مهاجرت ساختار خاطرات به سیستم ۶گانه در صورت نیاز
      let memoriesList: MemoryItem[] = [];
      if (Array.isArray(parsed?.memory?.memories) && parsed.memory.memories.length > 0) {
        memoriesList = parsed.memory.memories;
      } else {
        // ایجاد از داده‌های پیش‌فرض و مقادیر گذشته
        memoriesList = [...DEFAULT_INITIAL_MEMORIES];

        if (Array.isArray(parsed?.memory?.userFacts)) {
          for (const uf of parsed.memory.userFacts) {
            memoriesList.push({
              id: 'migrated-uf-' + uf.id,
              type: 'user_important',
              content: `${uf.key}: ${uf.value}`,
              importance: 8,
              created_at: new Date().toISOString(),
              last_used: new Date().toISOString(),
              metadata: { category: uf.category, virtualAge: uf.learnedAtVirtualAge }
            });
          }
        }

        if (Array.isArray(parsed?.memory?.longTermMemories)) {
          for (const ltm of parsed.memory.longTermMemories) {
            memoriesList.push({
              id: 'migrated-ltm-' + ltm.id,
              type: 'important_memory',
              content: `${ltm.title}: ${ltm.detail}`,
              importance: ltm.importance || 8,
              created_at: new Date().toISOString(),
              last_used: new Date().toISOString(),
              metadata: { virtualAge: ltm.virtualAge, tags: ltm.tags }
            });
          }
        }
      }

      let dailyMems: DailyMemory[] = [];
      if (Array.isArray(parsed?.dailyMemories) && parsed.dailyMemories.length > 0) {
        dailyMems = parsed.dailyMemories;
      } else {
        dailyMems = [...INITIAL_DAILY_MEMORIES];
      }

      const existingImgs: DailyImage[] = Array.isArray(parsed?.dailyImages) ? parsed.dailyImages : [];
      const { memories: hydratedMems, images: hydratedImgs } = ensureDailyImages(dailyMems, existingImgs);

      let state: ShivaState = {
        ...getInitialState(),
        ...parsed,
        lastProcessedRealDate: parsed?.lastProcessedRealDate || (hydratedMems.length > 0 ? hydratedMems[0].real_date : getLocalDateString()),
        dailyMemories: hydratedMems,
        dailyImages: hydratedImgs,
        dailyEntries: Array.isArray(parsed?.dailyEntries) ? parsed.dailyEntries : getInitialState().dailyEntries,
        traits: { ...DEFAULT_PERSONALITY_TRAITS, ...(parsed.traits || {}) },
        relationship: parsed?.relationship || getDefaultRelationshipState(parsed?.projectStartDate || new Date().toISOString()),
        interactionHistory: Array.isArray(parsed?.interactionHistory) ? parsed.interactionHistory : getInitialState().interactionHistory,
        memory: {
          memories: memoriesList,
          recentConversations: Array.isArray(parsed?.memory?.recentConversations)
            ? parsed.memory.recentConversations
            : getInitialState().memory.recentConversations
        }
      };

      // بررسی سن و پالایش وضعیت رابطه از طریق AgeGate مرکزی
      const currentAgeInfo = calculateVirtualAge(state.projectStartDate, state.virtualDayOffset);
      if (state.relationship) {
        state.relationship = AgeGate.enforceOnRelationshipState(state.relationship, currentAgeInfo);
      }

      // پردازش روزانه ۲۴ ساعته کنترل‌شده (جلوگیری از تولید تکراری در یک روز و جبران روزهای غایب)
      const dailyCheck = checkAndProcessDailyLife(state);
      state = dailyCheck.updatedState;

      // اطمینان مجدد از اینکه روزهای جدید هم تصویر دارند
      const finalCheck = ensureDailyImages(state.dailyMemories, state.dailyImages || []);
      state.dailyMemories = finalCheck.memories;
      state.dailyImages = finalCheck.images;

      this.saveState(state);
      return state;
    } catch (err) {
      console.error('Error reading Shiva state from storage:', err);
      return getInitialState();
    }
  },

  saveState(state: ShivaState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Error saving Shiva state to storage:', err);
    }
  },

  resetState(): ShivaState {
    const fresh = getInitialState();
    this.saveState(fresh);
    return fresh;
  },

  /**
   * افزودن خاطره با ساختار استاندارد در یکی از ۶ بخش
   */
  addMemory(
    state: ShivaState,
    type: ShivaMemoryType,
    content: string,
    importance: number = 7,
    metadata?: MemoryItem['metadata']
  ): ShivaState {
    const ageInfo = calculateVirtualAge(state.projectStartDate, state.virtualDayOffset);
    const nowIso = new Date().toISOString();

    const newMemory: MemoryItem = {
      id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type,
      content: content.trim(),
      importance: Math.min(10, Math.max(1, Math.round(importance))),
      created_at: nowIso,
      last_used: nowIso,
      metadata: {
        virtualAge: ageInfo.ageDisplay,
        ...metadata,
      }
    };

    // در مورد اطلاعات ثابت یا مهم، تکراری‌های بسیار شبیه را جایگزین می‌کنیم
    const updatedMemories = [
      newMemory,
      ...state.memory.memories.filter(m => m.content.trim() !== content.trim())
    ];

    const updated: ShivaState = {
      ...state,
      memory: {
        ...state.memory,
        memories: updatedMemories
      }
    };

    this.saveState(updated);
    return updated;
  },

  /**
   * حذف یک خاطره بر اساس id
   */
  deleteMemory(state: ShivaState, memoryId: string): ShivaState {
    const updatedMemories = state.memory.memories.filter(m => m.id !== memoryId);
    const updated: ShivaState = {
      ...state,
      memory: {
        ...state.memory,
        memories: updatedMemories
      }
    };
    this.saveState(updated);
    return updated;
  },

  /**
   * به‌روزرسانی فیلد last_used برای خاطراتی که در پاسخ جاری به جمینای داده شدند
   */
  touchMemoriesLastUsed(state: ShivaState, memoryIds: string[]): ShivaState {
    if (!memoryIds || memoryIds.length === 0) return state;
    const nowIso = new Date().toISOString();
    const idSet = new Set(memoryIds);

    const updatedMemories = state.memory.memories.map(m => {
      if (idSet.has(m.id)) {
        return { ...m, last_used: nowIso };
      }
      return m;
    });

    const updated: ShivaState = {
      ...state,
      memory: {
        ...state.memory,
        memories: updatedMemories
      }
    };
    this.saveState(updated);
    return updated;
  },

  addDailyEntry(state: ShivaState, entry: Omit<DailyLifeEntry, 'id'>): ShivaState {
    const newEntry: DailyLifeEntry = {
      ...entry,
      id: 'daily-' + Date.now()
    };
    const updated: ShivaState = {
      ...state,
      dailyEntries: [newEntry, ...state.dailyEntries],
      currentDailyMessage: entry.dailyMessage,
      currentEmotion: entry.mood
    };
    this.saveState(updated);
    return updated;
  },

  updateEmotion(state: ShivaState, emotion: EmotionType, intensity: number = 0.8): ShivaState {
    const updated: ShivaState = {
      ...state,
      currentEmotion: emotion,
      emotionIntensity: Math.min(1, Math.max(0, intensity))
    };
    this.saveState(updated);
    return updated;
  },

  updateTraits(state: ShivaState, newTraits: Partial<PersonalityTraits>): ShivaState {
    const updated: ShivaState = {
      ...state,
      traits: {
        ...state.traits,
        ...newTraits
      }
    };
    this.saveState(updated);
    return updated;
  },

  setVirtualDayOffset(state: ShivaState, offset: number): ShivaState {
    const updated: ShivaState = {
      ...state,
      virtualDayOffset: Math.max(0, offset)
    };
    this.saveState(updated);
    return updated;
  },

  /**
   * به‌روزرسانی وضعیت رابطه
   */
  updateRelationship(state: ShivaState, rel: RelationshipEngineState): ShivaState {
    const ageInfo = calculateVirtualAge(state.projectStartDate, state.virtualDayOffset);
    const sanitizedRel = AgeGate.enforceOnRelationshipState(rel, ageInfo);
    const updated: ShivaState = {
      ...state,
      relationship: sanitizedRel,
    };
    this.saveState(updated);
    return updated;
  },

  /**
   * افزودن یک تعامل به تاریخچه تعاملات رابطه
   */
  addInteractionHistory(state: ShivaState, item: InteractionHistoryItem): ShivaState {
    const currentList = state.interactionHistory || [];
    // نگه‌داشتن حداکثر ۵۰ تعامل ارزشمند
    const updatedList = [item, ...currentList.slice(0, 49)];
    const updated: ShivaState = {
      ...state,
      interactionHistory: updatedList,
    };
    this.saveState(updated);
    return updated;
  }
};
