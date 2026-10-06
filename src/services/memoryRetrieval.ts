import { MemoryItem, ShivaMemoryType } from '../types/shiva';

// کلمات توقف پرتکرار فارسی برای استخراج دقیق کلیدواژه‌ها
const PERSIAN_STOP_WORDS = new Set([
  'و', 'در', 'به', 'از', 'که', 'این', 'رو', 'با', 'برای', 'است', 'شد', 'یک',
  'هم', 'را', 'تا', 'کرد', 'بر', 'اما', 'اگر', 'چون', 'یا', 'چه', 'چند',
  'بود', 'شدند', 'آن', 'آنها', 'وی', 'او', 'ما', 'شما', 'ایشان', 'من', 'تو',
  'دارد', 'دارم', 'داری', 'دارند', 'داشتم', 'داشتی', 'داشت', 'داشته', 'باشد',
  'نیست', 'هست', 'هستم', 'هستی', 'هستند', 'می', 'نمی', 'کند', 'کنم', 'کنی'
]);

/**
 * نرمال‌سازی متن فارسی برای مقایسه دقیق
 */
export function normalizePersianText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F]/g, '') // حذف اعراب
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[آ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[\u200C\u200B]/g, ' ') // نیم‌فاصله‌ها به فاصله
    .replace(/[.,،:;!؟?()\[\]{}"'«»\-_\/\\|]/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * استخراج واژگان معنادار از متن
 */
export function extractKeywords(text: string): string[] {
  const normalized = normalizePersianText(text);
  const rawWords = normalized.split(/\s+/).filter(w => w.length > 1);
  return rawWords.filter(word => !PERSIAN_STOP_WORDS.has(word));
}

/**
 * دسته‌بندی موضوعی بر اساس نشانه‌های موجود در پیام کاربر
 */
function detectIntentBoosts(messageText: string): Record<ShivaMemoryType, number> {
  const normalized = normalizePersianText(messageText);
  const boosts: Record<ShivaMemoryType, number> = {
    fixed_shiva: 0,
    user_important: 0,
    important_memory: 0,
    daily_memory: 0,
    short_term: 0,
    relationship: 0,
  };

  // اطلاعات مهم کاربر
  if (
    normalized.includes('اسم من') ||
    normalized.includes('نام من') ||
    normalized.includes('من کیم') ||
    normalized.includes('من کی هستم') ||
    normalized.includes('شغل من') ||
    normalized.includes('کار من') ||
    normalized.includes('علاقه من') ||
    normalized.includes('دوست دارم') ||
    normalized.includes('غذای مورد') ||
    normalized.includes('شهر من') ||
    normalized.includes('سلیقه من') ||
    normalized.includes('رنگ مورد')
  ) {
    boosts.user_important += 4.5;
  }

  // اطلاعات رابطه
  if (
    normalized.includes('رابطه') ||
    normalized.includes('دوستت دارم') ||
    normalized.includes('همراه') ||
    normalized.includes('صمیمیت') ||
    normalized.includes('اعتماد') ||
    normalized.includes('قول') ||
    normalized.includes('بین ما') ||
    normalized.includes('دوستی') ||
    normalized.includes('چقدر منو میشناسی')
  ) {
    boosts.relationship += 4.5;
  }

  // خاطرات مهم
  if (
    normalized.includes('یادت میاد') ||
    normalized.includes('خاطره') ||
    normalized.includes('یادته') ||
    normalized.includes('اولین بار') ||
    normalized.includes('اون روز') ||
    normalized.includes('اتفاقی افتاد') ||
    normalized.includes('پارسال') ||
    normalized.includes('قبل تر')
  ) {
    boosts.important_memory += 4.5;
  }

  // خاطرات روزانه
  if (
    normalized.includes('امروز') ||
    normalized.includes('دیروز') ||
    normalized.includes('روزانه') ||
    normalized.includes('برنامه امروز') ||
    normalized.includes('روز چطور بود') ||
    normalized.includes('چه کردی')
  ) {
    boosts.daily_memory += 4.0;
  }

  // اطلاعات ثابت شیوا
  if (
    normalized.includes('تو کی هستی') ||
    normalized.includes('اسم تو') ||
    normalized.includes('چشمات') ||
    normalized.includes('موهات') ||
    normalized.includes('قیافت') ||
    normalized.includes('ظاهرت') ||
    normalized.includes('سن تو') ||
    normalized.includes('چند سالته') ||
    normalized.includes('شخصیتت') ||
    normalized.includes('اخلاقت')
  ) {
    boosts.fixed_shiva += 4.5;
  }

  // حافظه کوتاه‌مدت
  if (
    normalized.includes('همین الان') ||
    normalized.includes('الان گفتی') ||
    normalized.includes('درباره این') ||
    normalized.includes('همون که گفتم') ||
    normalized.includes('موضوع قبلی')
  ) {
    boosts.short_term += 4.0;
  }

  return boosts;
}

export interface RelevanceScoreResult {
  memory: MemoryItem;
  score: number;
  matchedKeywords: string[];
}

/**
 * الگوریتم بازیابی هوشمند خاطرات مرتبط با پیام جاری کاربر
 * فقط خاطرات با نمره مرتبط بالا را انتخاب کرده و به جمینای می‌دهد
 */
export function retrieveRelevantMemories(
  memories: MemoryItem[],
  userMessage: string,
  maxResults: number = 6
): MemoryItem[] {
  if (!memories || memories.length === 0) return [];
  if (!userMessage || !userMessage.trim()) {
    // در صورت خالی بودن پیام، مهم‌ترین خاطرات پایه را بازمی‌گردانیم
    return [...memories]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, maxResults);
  }

  const queryKeywords = extractKeywords(userMessage);
  const intentBoosts = detectIntentBoosts(userMessage);

  const scored: RelevanceScoreResult[] = memories.map((mem) => {
    const memKeywords = extractKeywords(mem.content);
    let matchedKeywords: string[] = [];
    let matchScore = 0;

    // تطابق کلیدواژه‌ها
    for (const qWord of queryKeywords) {
      for (const mWord of memKeywords) {
        if (qWord === mWord) {
          matchScore += 2.0;
          if (!matchedKeywords.includes(qWord)) matchedKeywords.push(qWord);
        } else if (qWord.includes(mWord) || mWord.includes(qWord)) {
          // تطابق جزئی یا ریشه‌ای
          matchScore += 1.0;
          if (!matchedKeywords.includes(qWord)) matchedKeywords.push(qWord);
        }
      }
    }

    // اضافه کردن امتیاز تشخیص تمایل و دسته حافظه
    const typeBoost = intentBoosts[mem.type] || 0;

    // امتیاز اهمیت درونی خاطره (۱ تا ۱۰)
    const importanceScore = (mem.importance || 5) * 0.25;

    // امتیاز تازگی استفاده (اگر اخیراً استفاده شده یا جدید ایجاد شده)
    let recencyScore = 0;
    try {
      const createdTime = new Date(mem.created_at).getTime();
      const now = Date.now();
      const daysDiff = (now - createdTime) / (1000 * 60 * 60 * 24);
      if (daysDiff < 2) recencyScore += 0.5;
    } catch {
      // چشم‌پوشی
    }

    const totalScore = matchScore * 2.5 + typeBoost + importanceScore + recencyScore;

    return {
      memory: mem,
      score: totalScore,
      matchedKeywords,
    };
  });

  // مرتب‌سازی بر اساس نمره تشابه و تطابق نزولی
  scored.sort((a, b) => b.score - a.score);

  // فیلتر کردن خاطراتی که نمره مرتبط دارند، یا انتخاب برترین‌ها
  const relevantList = scored
    .filter((s) => s.score > 1.8)
    .map((s) => s.memory);

  if (relevantList.length >= 2) {
    return relevantList.slice(0, maxResults);
  }

  // اگر تطابق مستقیم کم بود، خاطرات با اهمیت بالا از دسته‌های مرتبط را ترکیب می‌کنیم
  const fallbackList: MemoryItem[] = [];
  const addedIds = new Set(relevantList.map(m => m.id));

  for (const item of scored) {
    if (!addedIds.has(item.memory.id)) {
      fallbackList.push(item.memory);
      addedIds.add(item.memory.id);
      if (relevantList.length + fallbackList.length >= maxResults) break;
    }
  }

  return [...relevantList, ...fallbackList].slice(0, maxResults);
}
