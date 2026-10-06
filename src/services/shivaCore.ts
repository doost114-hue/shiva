import {
  ChatMessage,
  EmotionType,
  MemoryItem,
  ShivaMemoryType,
  ShivaModelResponse,
  ShivaState,
  VirtualAgeInfo,
} from '../types/shiva';
import { StorageService } from './storage';
import { retrieveRelevantMemories } from './memoryRetrieval';
import {
  RelationshipEngine,
  AgeGate,
  getDefaultRelationshipState,
} from './relationshipEngine';

export interface ProcessInputParams {
  message: string;
  currentState: ShivaState;
  ageInfo: VirtualAgeInfo;
  source: 'voice' | 'text';
}

export interface ProcessInputResult {
  response: ShivaModelResponse;
  updatedState: ShivaState;
  relevantMemories: MemoryItem[];
  savedMemoryNotice?: {
    type: ShivaMemoryType;
    content: string;
    importance: number;
  };
}

/**
 * مغز مرکزی یکپارچه شیوا (Shiva Core)
 * این هسته مرکزی مسئول تمام ورودی‌های متنی و صوتی است،
 * تا تضمین شود گفت‌وگوی صوتی و متنی از یک سیستم حافظه، شخصیت و تاریخچه استفاده می‌کنند.
 */
export async function processWithShivaCore({
  message,
  currentState,
  ageInfo,
  source,
}: ProcessInputParams): Promise<ProcessInputResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('پیام ورودی به شیوا خالی است.');
  }

  // ۱. بازیابی فقط خاطرات مرتبط با پیام فعلی از حافظه ۶بخشی مشترک
  const relevantMemories = retrieveRelevantMemories(currentState.memory.memories, trimmed, 6);

  // پیام کاربر با برچسب زمان
  const userMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    text: trimmed,
    timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
  };

  // افزودن پیام کاربر به تاریخچه مکالمه
  const updatedConversations = [...(currentState.memory.recentConversations || []), userMessage];
  let workingState: ShivaState = {
    ...currentState,
    memory: {
      ...currentState.memory,
      recentConversations: updatedConversations,
    },
  };

  // به‌روزرسانی تاریخ فراخوانی خاطرات مرتبط
  if (relevantMemories.length > 0) {
    workingState = StorageService.touchMemoriesLastUsed(
      workingState,
      relevantMemories.map((m) => m.id)
    );
  }

  // آماده‌سازی کانتکست رابطه از طریق RelationshipEngine و ارزیابی AgeGate
  const currentRelState = workingState.relationship || getDefaultRelationshipState(workingState.projectStartDate);
  const safeRelState = AgeGate.enforceOnRelationshipState(currentRelState, ageInfo);
  const relationshipContext = RelationshipEngine.buildPromptContext(safeRelState, ageInfo);

  // ۲. ارسال به مدل پردازشی Gemini از طریق اندپوینت سرور
  let data: ShivaModelResponse;
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: trimmed,
        virtualAgeInfo: ageInfo,
        traits: workingState.traits,
        currentEmotion: workingState.currentEmotion,
        relevantMemories,
        recentConversations: updatedConversations,
        adultModeUnlocked: workingState.adultModeUnlocked,
        relationshipContext,
        channel: source,
      }),
    });

    if (!res.ok) {
      throw new Error(`خطا در سرور شیوا (${res.status})`);
    }

    data = await res.json();
  } catch (err) {
    console.error('Shiva Core API error:', err);
    // پاسخ اضطراری درون‌شخصیتی در صورت قطعی شبکه
    const isBaby = ageInfo.years < 2;
    const isChild = ageInfo.years < 12;
    const fallbackText = isBaby
      ? 'دا دای! با چشم‌های آبیم نگاهت می‌کنم و لبخند می‌زنم!'
      : isChild
      ? 'صدات رو شنیدم و خیلی خوشحال شدم! با دقت به حرف‌هات گوش می‌دم.'
      : 'صدای مهربونت رو شنیدم و حرف‌هات مثل همیشه برام دلنشینه...';

    data = {
      text: fallbackText,
      emotion: 'calm',
      emotion_intensity: 0.8,
      facial_expression: 'smile',
      gesture: 'gentle_nod',
      memory_candidate: false,
    };
  }

  // ۳. پیام پاسخ شیوا با مشخصات چهره، ژست و احساس
  const assistantMessage: ChatMessage = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    text: data.text,
    timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    emotion: (data.emotion as EmotionType) || 'calm',
    emotion_intensity: data.emotion_intensity ?? 0.85,
    facial_expression: data.facial_expression || 'smile',
    gesture: data.gesture || 'gentle_nod',
    memory_candidate: Boolean(data.memory_action?.should_save || data.memory_candidate),
    memory_note: data.memory_action?.content || data.memory_note,
  };

  let finalState: ShivaState = {
    ...workingState,
    currentEmotion: (data.emotion as EmotionType) || workingState.currentEmotion,
    emotionIntensity: data.emotion_intensity ?? workingState.emotionIntensity,
    memory: {
      ...workingState.memory,
      recentConversations: [...updatedConversations, assistantMessage],
    },
  };

  // ۴. بررسی و به‌روزرسانی Relationship Engine (طبق بند ۸)
  // User Interaction -> Interaction Analysis -> Relationship Update -> Memory Candidate -> Emotion Update
  const relUpdateResult = RelationshipEngine.updateFromInteraction({
    currentState: finalState,
    ageInfo,
    userMessage: trimmed,
    modelResponse: data,
  });

  finalState = {
    ...finalState,
    relationship: relUpdateResult.updatedRel,
    interactionHistory: relUpdateResult.newInteraction
      ? [relUpdateResult.newInteraction, ...(finalState.interactionHistory || []).slice(0, 49)]
      : finalState.interactionHistory,
  };

  // ۵. بررسی و ذخیره در حافظه دائمی ۶بخشی در صورت لزوم
  let savedNotice: { type: ShivaMemoryType; content: string; importance: number } | undefined;
  const action = data.memory_action;
  if (action?.should_save && action.content) {
    const memType: ShivaMemoryType = action.type || 'user_important';
    const importance = action.importance || 7;

    finalState = StorageService.addMemory(finalState, memType, action.content, importance, {
      virtualAge: ageInfo.ageDisplay,
      tags: [memType, source === 'voice' ? 'گفت‌وگوی صوتی' : 'گفت‌وگوی متنی'],
    });

    savedNotice = {
      type: memType,
      content: action.content,
      importance,
    };
  } else if (relUpdateResult.relationshipMemoryCandidate) {
    // ثبت کاندیدای حافظه اختصاصی رابطه (نوع relationship)
    finalState = StorageService.addMemory(
      finalState,
      'relationship',
      relUpdateResult.relationshipMemoryCandidate.content,
      relUpdateResult.relationshipMemoryCandidate.importance,
      {
        virtualAge: ageInfo.ageDisplay,
        tags: ['رابطه', 'نقطه_عطف'],
      }
    );
  }

  // ۶. ذخیره‌سازی دائمی وضعیت به‌روز در localStorage
  StorageService.saveState(finalState);

  return {
    response: data,
    updatedState: finalState,
    relevantMemories,
    savedMemoryNotice: savedNotice,
  };
}
