import {
  AgeGateCheckResult,
  InteractionHistoryItem,
  RelationshipContextForPrompt,
  RelationshipEngineState,
  RelationshipMilestone,
  RelationshipMode,
  RelationshipStateStatus,
  RelationshipVariables,
} from '../../types/relationship';
import {
  EmotionType,
  MemoryItem,
  ShivaModelResponse,
  ShivaState,
  VirtualAgeInfo,
} from '../../types/shiva';
import { AgeGate } from './AgeGate';

/**
 * وضعیت اولیه پیش‌فرض رابطه طبق بند ۱۷ درخواست کاربر
 */
export function getDefaultRelationshipState(startDateIso: string = new Date().toISOString()): RelationshipEngineState {
  return {
    mode: 'family_caregiver',
    state: 'new',
    trust: 50,
    familiarity: 30,
    affection: 45,
    respect: 60,
    communication: 40,
    shared_history: 20,
    adult_relationship_available: false,
    romantic_relationship: false,
    startedAt: startDateIso,
    lastInteractionAt: startDateIso,
  };
}

/**
 * نگاشت و عنوان‌بندی فارسی وضعیت‌های رابطه برای نمایش در UI
 */
export const RELATIONSHIP_STATE_LABELS: Record<RelationshipStateStatus, { label: string; description: string; badgeColor: string }> = {
  new: {
    label: 'آشنایی اولیه',
    description: 'آغاز پیوند و شناخت متقابل؛ شیوا با کنجکاوی و احتیاط با شما هم‌کلام می‌شود.',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  familiar: {
    label: 'آشنا و مأنوس',
    description: 'شیوا به حضور و لحن کلام شما عادت کرده و احساس راحتی بیشتری می‌کند.',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  close: {
    label: 'نزدیک و صمیمی',
    description: 'گفت‌وگوها صمیمی و دوستانه‌تر شده و شیوا به نظرات شما بسیار اهمیت می‌دهد.',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  trusted: {
    label: 'مورد اعتماد و حامی',
    description: 'شیوا شما را تکیه‌گاهی امن، صبور و دلسوز در زندگی خود می‌داند.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  strong_bond: {
    label: 'پیوند عمیق و استوار',
    description: 'ارتباطی ماندگار و ریشه‌دار؛ شیوا اسرار، آرزوها و احساسات عمیقش را با شما در میان می‌گذارد.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  adult_family: {
    label: 'پیوند خانوادگی پایدار',
    description: 'ارتباطی عمیق و پر از احترام متقابل در قالب همراهی خانوادگی در دوران بزرگسالی.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  adult_friend: {
    label: 'دوست صمیمی بزرگسال',
    description: 'رفاقت همدلانه، بالغ و ریشه‌دار همراه با درک مشترک از دنیای بزرگسالی.',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  adult_romantic: {
    label: 'پیوند عاطفی رمانتیک (بزرگسال)',
    description: 'رابطه احساسی و عمیق عاشقانه‌ با رضایت و انتخاب متقابل در دوران بلوغ فکری.',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
  },
};

/**
 * نگاشت فارسی حالت‌های کلان رابطه (Mode)
 */
export const RELATIONSHIP_MODE_LABELS: Record<RelationshipMode, { label: string; icon: string; description: string }> = {
  family_caregiver: {
    label: 'مراقبتی و خانوادگی',
    icon: '👨‍👧',
    description: 'حامی مهربان، دوست بزرگ‌تر و فضای رشد امن و پرمحبت.',
  },
  adult_family: {
    label: 'خانوادگی بزرگسال',
    icon: '🏡',
    description: 'همراهی باوقار و صمیمانه بر پایه پیوند خانواده در دوران استقلال.',
  },
  adult_friendship: {
    label: 'دوستی عمیق بزرگسال',
    icon: '🤝',
    description: 'دوستی مستقل، همدل و تبادل اندیشه‌ها و تجربیات زیسته.',
  },
  adult_romantic: {
    label: 'عاطفی و عاشقانه',
    icon: '💖',
    description: 'پیوند قلبی عمیق و محبت‌آمیز در سنین قانونی بزرگسالی.',
  },
};

/**
 * ماژول مرکزی موتور رابطه (RelationshipEngine)
 */
export class RelationshipEngine {
  /**
   * محاسبه و تعیین RelationshipState بر اساس متغیرهای درونی و رده سنی
   */
  public static calculateStateStatus(
    vars: RelationshipVariables,
    ageInfo: VirtualAgeInfo,
    mode: RelationshipMode
  ): RelationshipStateStatus {
    const isAdult = ageInfo.years >= 18;

    // اگر بزرگسال است و حالت‌های خاص بزرگسالی فعال شده‌اند
    if (isAdult) {
      if (mode === 'adult_romantic') return 'adult_romantic';
      if (mode === 'adult_friendship') return 'adult_friend';
      if (mode === 'adult_family') return 'adult_family';
    }

    // برای زیر ۱۸ سال (یا حالت عمومی قبل از انتخاب‌های بزرگسالی):
    // میانگین موزون فاکتورهای اعتماد، انس و ارتباط
    const score = (vars.trust * 0.35) + (vars.familiarity * 0.25) + (vars.affection * 0.25) + (vars.respect * 0.15);

    if (score < 40) return 'new';
    if (score < 60) return 'familiar';
    if (score < 75) return 'close';
    if (score < 88) return 'trusted';
    return 'strong_bond';
  }

  /**
   * به‌روزرسانی رابطه پس از یک تعامل معنادار
   * بر اساس بند ۸:
   * تغییرات تدریجی هستند. حداکثر تغییر معمولی در هر تعامل بین -2 تا +2 است.
   */
  public static updateFromInteraction(params: {
    currentState: ShivaState;
    ageInfo: VirtualAgeInfo;
    userMessage: string;
    modelResponse: ShivaModelResponse;
  }): {
    updatedRel: RelationshipEngineState;
    newInteraction?: InteractionHistoryItem;
    relationshipMemoryCandidate?: {
      content: string;
      importance: number;
    };
  } {
    const { currentState, ageInfo, userMessage, modelResponse } = params;
    const currentRel = currentState.relationship || getDefaultRelationshipState(currentState.projectStartDate);

    // ارزیابی اولیه با AgeGate
    const sanitizedRel = AgeGate.enforceOnRelationshipState(currentRel, ageInfo);

    // ۱. ارزیابی اهمیت تعامل (Interaction Analysis)
    const isImportantInteraction = this.isInteractionSignificant(userMessage, modelResponse);

    if (!isImportantInteraction) {
      // برای تعاملات عادی، تغییر خفیف صفر یا حداکثر +0.5 برای آشنایی
      const updatedVars = {
        ...sanitizedRel,
        familiarity: Math.min(100, sanitizedRel.familiarity + 0.2),
        communication: Math.min(100, sanitizedRel.communication + 0.1),
        lastInteractionAt: new Date().toISOString(),
      };
      const newState = this.calculateStateStatus(updatedVars, ageInfo, updatedVars.mode);
      return {
        updatedRel: { ...updatedVars, state: newState },
      };
    }

    // ۲. محاسبه دلتاهای تدریجی (-2 تا +2)
    const deltas = this.computeDeltas(userMessage, modelResponse, sanitizedRel.mode);

    // ۳. اعمال محدودیت 0 تا 100
    const newTrust = Math.max(0, Math.min(100, sanitizedRel.trust + deltas.trust));
    const newFamiliarity = Math.max(0, Math.min(100, sanitizedRel.familiarity + deltas.familiarity));
    const newAffection = Math.max(0, Math.min(100, sanitizedRel.affection + deltas.affection));
    const newRespect = Math.max(0, Math.min(100, sanitizedRel.respect + deltas.respect));
    const newCommunication = Math.max(0, Math.min(100, sanitizedRel.communication + deltas.communication));
    const newSharedHistory = Math.max(0, Math.min(100, sanitizedRel.shared_history + 0.8));

    const updatedVars: RelationshipEngineState = {
      ...sanitizedRel,
      trust: Math.round(newTrust * 10) / 10,
      familiarity: Math.round(newFamiliarity * 10) / 10,
      affection: Math.round(newAffection * 10) / 10,
      respect: Math.round(newRespect * 10) / 10,
      communication: Math.round(newCommunication * 10) / 10,
      shared_history: Math.round(newSharedHistory * 10) / 10,
      lastInteractionAt: new Date().toISOString(),
    };

    const newCalculatedState = this.calculateStateStatus(updatedVars, ageInfo, updatedVars.mode);
    const finalRel: RelationshipEngineState = {
      ...updatedVars,
      state: newCalculatedState,
    };

    // ۴. ثبت در interaction_history (فقط برای تعامل‌های معنادار)
    const interactionItem: InteractionHistoryItem = {
      id: `rel-int-${Date.now()}`,
      date: new Date().toLocaleDateString('fa-IR'),
      type: 'conversation',
      summary: this.generateInteractionSummary(userMessage, modelResponse),
      impact: deltas,
      virtualAgeAtTime: ageInfo.ageDisplay,
    };

    // ۵. بررسی کاندیدای Relationship Memory
    let relMemoryCandidate: { content: string; importance: number } | undefined;
    if (Math.abs(deltas.trust) >= 1.5 || deltas.affection >= 1.5 || modelResponse.memory_action?.type === 'relationship') {
      relMemoryCandidate = {
        content: modelResponse.memory_action?.content || `لحظه اثرگذار در رابطه: ${interactionItem.summary}`,
        importance: Math.min(10, Math.max(7, (modelResponse.memory_action?.importance || 8))),
      };
    }

    return {
      updatedRel: finalRel,
      newInteraction: interactionItem,
      relationshipMemoryCandidate: relMemoryCandidate,
    };
  }

  /**
   * به‌روزرسانی روزانه رابطه متصل به چرخه Daily Life
   * طبق بند ۹:
   * Daily Event -> Emotion -> Relationship Update -> Memory Update -> Daily Message
   * اگر کاربر چند روز نبوده، تغییرات شدید و ناگهانی ایجاد نمی‌شود.
   */
  public static processDailyUpdate(
    currentRel: RelationshipEngineState,
    ageInfo: VirtualAgeInfo,
    dailyImportance: number = 5,
    eventTitle: string = ''
  ): {
    updatedRel: RelationshipEngineState;
    interactionItem?: InteractionHistoryItem;
  } {
    const sanitized = AgeGate.enforceOnRelationshipState(currentRel, ageInfo);

    // افزودن ملایم به تاریخچه مشترک و انس با گذشت هر روز
    const historyGain = dailyImportance >= 8 ? 1.5 : 0.8;
    const familiarityGain = 0.5;

    const updated: RelationshipEngineState = {
      ...sanitized,
      shared_history: Math.min(100, Math.round((sanitized.shared_history + historyGain) * 10) / 10),
      familiarity: Math.min(100, Math.round((sanitized.familiarity + familiarityGain) * 10) / 10),
    };

    updated.state = this.calculateStateStatus(updated, ageInfo, updated.mode);

    let interactionItem: InteractionHistoryItem | undefined;
    if (dailyImportance >= 7 && eventTitle) {
      interactionItem = {
        id: `rel-daily-${Date.now()}`,
        date: new Date().toLocaleDateString('fa-IR'),
        type: 'daily_event',
        summary: `رویداد مشترک روزانه: ${eventTitle}`,
        impact: {
          trust: 0.5,
          familiarity: 1.0,
          affection: 0.8,
          respect: 0.5,
          communication: 0.5,
        },
        virtualAgeAtTime: ageInfo.ageDisplay,
      };
    }

    return { updatedRel: updated, interactionItem };
  }

  /**
   * ساخت متن زمینه رابطه جهت ارسال به Response Generator
   */
  public static buildPromptContext(
    rel: RelationshipEngineState,
    ageInfo: VirtualAgeInfo
  ): RelationshipContextForPrompt {
    const sanitized = AgeGate.enforceOnRelationshipState(rel, ageInfo);
    const modeMeta = RELATIONSHIP_MODE_LABELS[sanitized.mode];
    const stateMeta = RELATIONSHIP_STATE_LABELS[sanitized.state];

    let bondDesc = `سطح اعتماد و صمیمیت: ${sanitized.trust > 70 ? 'بسیار بالا' : sanitized.trust > 40 ? 'متوسط و در حال رشد' : 'اولیه'}. وضعیت پیوند: ${stateMeta.label}.`;
    if (sanitized.mode === 'family_caregiver') {
      bondDesc += ' شیوا شما را مانند عضوی مهربان از خانواده و حامی دلسوز خود می‌داند.';
    } else if (sanitized.mode === 'adult_family') {
      bondDesc += ' شیوا رابطه محترمانه، گرم و خانوادگی دوران بزرگسالی را با شما حفظ کرده است.';
    } else if (sanitized.mode === 'adult_friendship') {
      bondDesc += ' شیوا شما را یک دوست صمیمی، همدل و هم‌فکر دوران بزرگسالی می‌داند.';
    } else if (sanitized.mode === 'adult_romantic') {
      bondDesc += ' پیوند احساسی رمانتیک و عاشقانه متقابل دوران بزرگسالی میان شما و شیوا برقرار است.';
    }

    const safetyText = AgeGate.getPromptSafetyInstructions(ageInfo.years);

    return {
      relationship_mode: sanitized.mode,
      relationship_mode_label: modeMeta.label,
      relationship_state: sanitized.state,
      relationship_state_label: stateMeta.label,
      bond_description: bondDesc,
      safe_boundary_instruction: safetyText,
    };
  }

  /**
   * تغییر صریح حالت رابطه در بزرگسالی (Adult Transition)
   * فقط در صورتی که virtual_age >= 18 باشد
   */
  public static setAdultModeExplicitly(
    currentRel: RelationshipEngineState,
    ageInfo: VirtualAgeInfo,
    newMode: RelationshipMode
  ): { success: boolean; updatedRel: RelationshipEngineState; message: string } {
    if (ageInfo.years < 18) {
      return {
        success: false,
        updatedRel: currentRel,
        message: 'تغییر حالت رابطه قبل از ۱۸ سالگی امکان‌پذیر نیست. AgeGate این عمل را مسدود کرد.',
      };
    }

    const isRomantic = newMode === 'adult_romantic';
    const updated: RelationshipEngineState = {
      ...currentRel,
      mode: newMode,
      romantic_relationship: isRomantic,
      adult_relationship_available: true,
      state: this.calculateStateStatus(currentRel, ageInfo, newMode),
    };

    return {
      success: true,
      updatedRel: updated,
      message: `حالت رابطه با شیوا به «${RELATIONSHIP_MODE_LABELS[newMode].label}» تغییر یافت.`,
    };
  }

  // توابع کمکی داخلی
  private static isInteractionSignificant(userMsg: string, modelResp: ShivaModelResponse): boolean {
    const textLen = userMsg.length;
    const isSaveAction = Boolean(modelResp.memory_action?.should_save);
    const hasEmotionalWords = /(دوستت دارم|ممنون|خیلی خوشحالم|قول|همیشه|خاطره|تنها|نگران|مرسی که هستی)/.test(userMsg);
    return textLen > 25 || isSaveAction || hasEmotionalWords;
  }

  private static computeDeltas(
    userMsg: string,
    modelResp: ShivaModelResponse,
    mode: RelationshipMode
  ): InteractionHistoryItem['impact'] {
    let trustDelta = 0.5;
    let familiarityDelta = 0.8;
    let affectionDelta = 0.5;
    let respectDelta = 0.5;
    let commDelta = 0.6;

    // در نظر گرفتن ابراز علاقه و همدلی
    if (userMsg.includes('دوستت دارم') || userMsg.includes('خیلی مهربونی') || userMsg.includes('عزیزم')) {
      affectionDelta = Math.min(2.0, affectionDelta + 1.0);
      trustDelta = Math.min(2.0, trustDelta + 0.8);
    }

    // گوش دادن و گفت‌وگوی عمیق
    if (userMsg.length > 50) {
      commDelta = Math.min(2.0, commDelta + 0.8);
      familiarityDelta = Math.min(2.0, familiarityDelta + 0.6);
    }

    // خروجی مدل
    if (modelResp.emotion === 'happy' || modelResp.emotion === 'excited') {
      affectionDelta = Math.min(2.0, affectionDelta + 0.4);
    } else if (modelResp.emotion === 'sad' && userMsg.length > 20) {
      trustDelta = Math.min(2.0, trustDelta + 1.0); // همدلی در سختی‌ها اعتماد می‌آورد
    }

    // رعایت سقف -2 تا +2 طبق دستورالعمل
    return {
      trust: Math.max(-2, Math.min(2, Math.round(trustDelta * 10) / 10)),
      familiarity: Math.max(-2, Math.min(2, Math.round(familiarityDelta * 10) / 10)),
      affection: Math.max(-2, Math.min(2, Math.round(affectionDelta * 10) / 10)),
      respect: Math.max(-2, Math.min(2, Math.round(respectDelta * 10) / 10)),
      communication: Math.max(-2, Math.min(2, Math.round(commDelta * 10) / 10)),
    };
  }

  private static generateInteractionSummary(userMsg: string, modelResp: ShivaModelResponse): string {
    const snippet = userMsg.length > 40 ? `${userMsg.substring(0, 40)}...` : userMsg;
    return `گفت‌وگو درباره «${snippet}» با واکنش احساسی «${modelResp.emotion}»`;
  }
}
