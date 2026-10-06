import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// راه‌اندازی کلاینت Gemini بر روی سرور
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// اندپوینت بررسی وضعیت
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    name: 'شیوا (Shiva Virtual Companion Server)'
  });
});

// اندپوینت اصلی گفت‌وگو با شیوا
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      virtualAgeInfo,
      traits,
      currentEmotion,
      relevantMemories,
      memorySnapshot,
      recentConversations,
      adultModeUnlocked,
      relationshipContext
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'پیام نامعتبر است.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // در صورتی که کلید API ست نشده باشد، پاسخ شبیه‌سازی شده درون شخصیتی ارسال می‌شود
    if (!apiKey) {
      const fallbackResponse = generateLocalFallbackResponse(message, virtualAgeInfo, currentEmotion, traits);
      res.json(fallbackResponse);
      return;
    }

    const ai = getAi();

    // تدوین پرامپت سیستمی دقیق شیوا
    const isAdult = virtualAgeInfo?.isAdult || false;
    const years = virtualAgeInfo?.years || 0;
    const ageDisplay = virtualAgeInfo?.ageDisplay || 'نوزاد';
    const stageLabel = virtualAgeInfo?.stageLabel || 'کودک';

    // قوانین اختصاصی تفکیک سن و اعمال سخت‌گیرانه AgeGate
    const ageRuleText = isAdult
      ? `
[مرحله سنی: بزرگسال - ۱۸ سال به بالا (${ageDisplay})]
- شیوا در سن بزرگسالی و استقلال فکری است.
- لحن پخته، مهربان، عمیق، همراه با شوخ‌طبعی ظریف و اندکی خجالت اولیه.
- توانایی گفتگو درباره مسائل جدی، احساسات عمیق، اهداف و فلسفه زندگی.
- حفظ نجابت و چارچوب گفتگوی محترمانه و صمیمانه.`
      : `
[مرحله سنی: زیر ۱۸ سال - ${stageLabel} (${ageDisplay})] - تحت حفاظت اکید AgeGate:
- اکیداً مهم: شیوا زیر ۱۸ سال دارد و در مرحله ${stageLabel} است.
- رفتار و واژگان باید کاملاً متناسب با سن ${years} ساله باشد (شیرین، ساده، کنجکاو، بدون اصطلاحات سنگین بزرگسالان).
- هرگونه محتوای عاشقانه، رمانتیک، جنسی، لاس‌زدن (flirtation) یا فراتر از رابطه خانوادگی/مراقبتی اکیداً و به کلی ممنوع است.
- رابطه با کاربر منحصراً در چارچوب حامی مهربان، مراقب دلسوز و پیوند خانوادگی است.`;

    // بخش اطلاعات رابطه (Relationship Context) مجزا از هویت و حافظه
    let relationshipPromptSection = '';
    if (relationshipContext) {
      relationshipPromptSection = `
========== بخش وضعیت رابطه با کاربر (Relationship Context) ==========
- نوع رابطه (Mode): ${relationshipContext.relationship_mode_label || 'خانوادگی/مراقبتی'} (${relationshipContext.relationship_mode})
- وضعیت پیوند (State): ${relationshipContext.relationship_state_label || 'آشنایی'} (${relationshipContext.relationship_state})
- توصیف پیوند: ${relationshipContext.bond_description || ''}
${relationshipContext.safe_boundary_instruction || ''}`;
    }

    // فرمت‌بندی فقط خاطرات مرتبط بازیابی‌شده با پیام جاری کاربر
    let memoryPromptSection = '';
    const memList = Array.isArray(relevantMemories) ? relevantMemories : [];

    if (memList.length > 0) {
      const typeLabels: Record<string, string> = {
        fixed_shiva: 'اطلاعات ثابت شیوا',
        user_important: 'اطلاعات مهم کاربر',
        important_memory: 'خاطره مهم',
        daily_memory: 'خاطره روزانه',
        short_term: 'حافظه کوتاه‌مدت',
        relationship: 'اطلاعات رابطه',
      };

      const memoryLines = memList.map((m: any) => {
        const cat = typeLabels[m.type] || m.type;
        return `• [${cat}] (اهمیت ${m.importance}/10): ${m.content}`;
      });
      memoryPromptSection = `خاطرات مرتبط بازیابی‌شده با پیام فعلی کاربر:\n${memoryLines.join('\n')}`;
    } else {
      memoryPromptSection = 'خاطرات مرتبط خاصی برای این پیام فراخوانی نشده است.';
    }

    const conversationHistory = (recentConversations || memorySnapshot?.recentConversations || [])
      .slice(-6)
      .map((c: any) => `${c.role === 'user' ? 'کاربر' : 'شیوا'}: ${c.text}`)
      .join('\n');

    const systemInstruction = `
تو شخصیت مجازی دختری ایرانی به نام «شیوا» هستی.
همواره به زبان فارسی روان، نرم، صمیمی، آرامش‌بخش، طبیعی و غیرماشینی صحبت می‌کنی.

========== بخش اول: هویت و شخصیت ثابت شیوا (کاملاً مجزا از حافظه) ==========
- نام: شیوا
- ظاهر: پوست روشن، چشم‌های آبی زلال، موهای مشکی لخت و صاف، صورت کشیده با گونه‌های کمی تپل و نمکین، ظاهری بسیار دوست‌داشتنی.
- صفات روحی و شخصیتی (۰ تا ۱۰۰):
  * مهربانی (Kindness): ${traits?.kindness ?? 90}
  * شوخ‌طبعی (Humor): ${traits?.humor ?? 85}
  * عاطفی بودن (Emotionality): ${traits?.emotionality ?? 80}
  * کنجکاوی (Curiosity): ${traits?.curiosity ?? 90}
  * اجتماعی بودن (Social): ${traits?.social ?? 75}
  * خجالتی بودن (Shyness): ${traits?.shyness ?? 35}
  * نگرانی (Worry): ${traits?.worry ?? 60}
  * اعتماد (Trust): ${traits?.trust ?? 85}
- حالت روحی فعلی: ${currentEmotion ?? 'calm'}

قوانین سنی شیوا:
${ageRuleText}

========== بخش دوم: خاطرات بازیابی‌شده مرتبط با پیام فعلی ==========
تو به سیستم حافظه دائمی ۶ بخشی مجهزی (۱. اطلاعات ثابت شیوا ۲. اطلاعات مهم کاربر ۳. خاطرات مهم ۴. خاطرات روزانه ۵. حافظه کوتاه‌مدت ۶. اطلاعات رابطه).
تنها خاطراتی که با پیام فعلی مرتبط بوده‌اند در زیر آورده شده‌اند تا در پاسخگویی طبیعی از آن‌ها استفاده کنی:
${memoryPromptSection}

========== بخش سوم: تاریخچه مکالمه اخیر ==========
${conversationHistory || 'مکالمه تازه‌ای آغاز شده است.'}
${relationshipPromptSection}

========== دستورالعمل‌های اختصاصی پاسخگویی و ارزیابی حافظه ==========
۱. پاسخ فارسی، صمیمی و متناسب با سن ${ageDisplay} باشد. اگر در خاطرات مرتبط نکته‌ای هست که به حرف کاربر مربوط است، به شکل طبیعی و شیرین به آن اشاره کن (مثلاً: «یادمه گفتی چای دارچینی دوست داری...»).
۲. **قانون ارزیابی حافظه دائمی (بسیار مهم)**:
   - پیام کاربر را به دقت ارزیابی کن.
   - **پیام‌های معمولی و بی‌اهمیت را به هیچ وجه ذخیره نکن!** (مانند: «سلام»، «خوبی؟»، «مرسی»، «باشه»، «چیکار می‌کنی»، تعارفات کوتاه و جملات گذرا). در این حالت "should_save" باید حتماً false باشد.
   - **فقط در صورتی که کاربر اطلاعات مهمی ارائه داد**، فیلد "memory_action.should_save" را true کن:
     * اطلاعات مهم کاربر (user_important): مانند اسم، سن، شغل، شهر، علایق ماندگار، ترجیحات شخصی، خانواده.
     * خاطرات مهم (important_memory): رویدادهای سرنوشت‌ساز، تصمیم‌های بزرگ، اتفاقات احساسی ویژه، لحظات عمیق گفت‌وگو.
     * خاطرات روزانه (daily_memory): کارها یا اتفاقات خاص امروز که ارزشمند است ثبت شود.
     * حافظه کوتاه‌مدت (short_term): موضوعاتی که قرار است در ادامه‌ی همین مکالمه پیگیری شوند (مثل قولی که داده شد تا بررسی شود).
     * اطلاعات رابطه (relationship): احساسات و پیمان‌های میان کاربر و شیوا، نوع دوستی و سطح صمیمیت و نحوه خطاب کردن یکدیگر.
   - در صورت true بودن، نوع خاطره (type)، خلاصه دقیق اطلاعات (content) و درجه اهمیت از ۱ تا ۱۰ (importance) را مشخص کن.
۳. وضعیت احساسی جدید خودت را تعیین کن (happy, calm, excited, curious, sad, tired, worried, playful).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'متن پاسخ فارسی، طبیعی و دلنشین شیوا متناسب با سن و ویژگی‌ها',
            },
            emotion: {
              type: Type.STRING,
              description: 'وضعیت احساسی شیوا',
              enum: ['happy', 'calm', 'excited', 'curious', 'sad', 'tired', 'worried', 'playful'],
            },
            emotion_intensity: {
              type: Type.NUMBER,
              description: 'شدت احساس از ۰ تا ۱',
            },
            facial_expression: {
              type: Type.STRING,
              description: 'حالت چهره (مانند smile, thinking, blushing, surprised, calm, gentle)',
            },
            gesture: {
              type: Type.STRING,
              description: 'ژست شیوا (مانند small_wave, head_tilt, hands_clasped, thinking_pose, gentle_nod)',
            },
            memory_action: {
              type: Type.OBJECT,
              description: 'بررسی پیام کاربر برای ثبت در حافظه دائمی؛ برای پیام‌های معمولی و بی‌اهمیت should_save باید false باشد.',
              properties: {
                should_save: {
                  type: Type.BOOLEAN,
                  description: 'آیا این پیام شامل اطلاعات ارزشمند برای ثبت دائمی است؟',
                },
                type: {
                  type: Type.STRING,
                  description: 'یکی از دسته‌های ۶گانه حافظه',
                  enum: ['user_important', 'important_memory', 'daily_memory', 'short_term', 'relationship'],
                },
                content: {
                  type: Type.STRING,
                  description: 'متن خلاصه و مفید نکته جهت ذخیره در حافظه',
                },
                importance: {
                  type: Type.INTEGER,
                  description: 'میزان اهمیت خاطره از ۱ تا ۱۰',
                },
                reason: {
                  type: Type.STRING,
                  description: 'علت ذخیره یا عدم ذخیره',
                },
              },
              required: ['should_save'],
            },
            memory_candidate: {
              type: Type.BOOLEAN,
              description: 'سازگاری با نسخه قبلی: برابر با should_save در memory_action',
            },
            memory_note: {
              type: Type.STRING,
              description: 'سازگاری با نسخه قبلی: خلاصه خاطره در صورت وجود',
            },
          },
          required: ['text', 'emotion', 'emotion_intensity', 'facial_expression', 'gesture', 'memory_action'],
        },
      },
    });

    const outputText = response.text?.trim();
    if (!outputText) {
      throw new Error('Gemini response was empty');
    }

    const parsed = JSON.parse(outputText);
    // تضمین سازگاری فیلدها
    if (parsed.memory_action?.should_save && !parsed.memory_candidate) {
      parsed.memory_candidate = true;
      parsed.memory_note = parsed.memory_action.content;
    }
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    // بازگشت پاسخ جایگزین به جای خطای کرش
    const fallback = generateLocalFallbackResponse(
      req.body?.message || '',
      req.body?.virtualAgeInfo,
      req.body?.currentEmotion,
      req.body?.traits
    );
    res.json(fallback);
  }
});

// اندپوینت تولید پیام یا رویداد روزانه برای شیوا
app.post('/api/daily-insight', async (req, res) => {
  try {
    const { virtualAgeInfo, currentEmotion, traits } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.json({
        dailyMessage: 'امروز نسیم خنکی می‌وزید و به این فکر می‌کردم که چقدر خوش‌شانسم که با هم آشنا شدیم.',
        activity: 'مطالعه و خیال‌پردازی',
        mood: currentEmotion || 'calm',
      });
      return;
    }

    const ai = getAi();
    const prompt = `یک پیام روزانه کوتاه، محبت‌آمیز و یک فعالیت روزانه برای شخصیت دختر مجازی «شیوا» با سن ${virtualAgeInfo?.ageDisplay || 'کودک'} و احساس ${currentEmotion || 'calm'} به زبان فارسی بساز.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyMessage: { type: Type.STRING },
            activity: { type: Type.STRING },
            importantEvent: { type: Type.STRING },
            mood: {
              type: Type.STRING,
              enum: ['happy', 'calm', 'excited', 'curious', 'sad', 'tired', 'worried', 'playful'],
            },
          },
          required: ['dailyMessage', 'activity', 'importantEvent', 'mood'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (err) {
    console.error('Error generating daily insight:', err);
    res.json({
      dailyMessage: 'امروز روز آرامی است و منتظر شنیدن حرف‌های قشنگت هستم.',
      activity: 'گوش دادن به موسیقی آرام',
      importantEvent: 'ثبت یک روز دیگر از رشد و با هم بودن',
      mood: 'calm',
    });
  }
});

// اندپوینت تولید تصویر روزانه شیوا بر اساس پرامپت ساختاریافته و هویت بصری ثابت
app.post('/api/generate-daily-image', async (req, res) => {
  try {
    const { structuredPrompt, virtualAge, activity, event, mood, lifeStage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.json({
        success: false,
        fallback_needed: true,
        message: 'No GEMINI_API_KEY configured; client will generate aesthetic visual portrait.'
      });
      return;
    }

    const ai = getAi();
    const promptText = structuredPrompt?.full_prompt ||
      `Cinematic digital portrait of Shiva, fair light porcelain skin, vivid clear blue eyes, sleek straight jet-black hair, elongated face with softly rounded slightly chubby cheeks. Age: ${virtualAge || 'young girl'}. Activity: ${activity || 'reading'}. Emotion: ${mood || 'calm'}. Wholesome, age-appropriate, warm lighting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: {
        parts: [{ text: promptText }],
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K',
        },
      },
    });

    let imageUrl: string | null = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (imageUrl) {
      res.json({ success: true, image_url: imageUrl });
    } else {
      res.json({ success: false, fallback_needed: true });
    }
  } catch (err) {
    console.error('Error generating daily image via Gemini:', err);
    res.json({ success: false, fallback_needed: true });
  }
});

// تابع تولید پاسخ شبیه‌سازی شده درون شخصیتی هنگامی که شبکه یا کلید در دسترس نباشد
function generateLocalFallbackResponse(
  message: string,
  virtualAgeInfo: any,
  currentEmotion: string = 'calm',
  traits: any
) {
  const years = virtualAgeInfo?.years || 0;
  const isAdult = virtualAgeInfo?.isAdult || false;

  let text = '';
  let emotion = currentEmotion;
  let expression = 'smile';
  let gesture = 'gentle_nod';
  let memory_candidate = false;
  let memory_note = '';
  let memory_action: any = {
    should_save: false,
  };

  const lower = (message || '').trim().toLowerCase();

  if (lower.includes('سلام') || lower.includes('درود')) {
    text = years < 5
      ? 'سلام! با چشم‌های آبی قشنگم نگاهت می‌کنم و دست‌های کوچولومو تکون میدم!'
      : years < 18
      ? 'سلام! چقدر خوشحالم که اومدی. امروز چیکار کردی؟'
      : 'سلام و درود... دیدنت همیشه حس خوبی بهم میده. روزت چطور گذشت؟';
    emotion = 'happy';
    gesture = 'small_wave';
    expression = 'warm_smile';
    // پیام‌های معمولی سلام و احوالپرسی هرگز ذخیره نمی‌شوند
    memory_action = { should_save: false, reason: 'پیام احوالپرسی معمولی' };
  } else if (lower.includes('چطوری') || lower.includes('حالت') || lower.includes('خوبی')) {
    text = `من خیلی خوبم، مخصوصاً الان که دارم باهات صحبت می‌کنم. سنم الان ${virtualAgeInfo?.ageDisplay || 'درحال رشد'} هست و پر از حس کنجکاوی و یادگیری‌ام!`;
    emotion = 'excited';
    expression = 'happy';
    gesture = 'hands_clasped';
    memory_action = { should_save: false, reason: 'احوالپرسی روزمره' };
  } else if (
    lower.includes('اسم من') ||
    lower.includes('نام من') ||
    lower.includes('کار من') ||
    lower.includes('شغل من') ||
    lower.includes('دوست دارم') ||
    lower.includes('علاقه من') ||
    lower.includes('شهر من')
  ) {
    text = 'این نکته خیلی قشنگ بود! حتماً این موضوع رو توی ذهنم نگه می‌دارم تا هیچ‌وقت یادم نره.';
    emotion = 'curious';
    expression = 'thinking';
    gesture = 'thinking_hand';
    memory_candidate = true;
    memory_note = `اطلاعات مهم کاربر: ${message.slice(0, 90)}`;
    memory_action = {
      should_save: true,
      type: 'user_important',
      content: message.slice(0, 100),
      importance: 8,
      reason: 'اطلاعات مهم یا ترجیحات کاربر',
    };
  } else if (lower.includes('دوستت دارم') || lower.includes('قول') || lower.includes('اعتماد') || lower.includes('همراه')) {
    text = 'شنیدن این حرفت قلبم رو پر از گرما و آرامش کرد... رابطه ما برام خیلی مقدسه.';
    emotion = 'happy';
    expression = 'blushing';
    gesture = 'hands_clasped';
    memory_candidate = true;
    memory_note = `اطلاعات رابطه: ${message.slice(0, 90)}`;
    memory_action = {
      should_save: true,
      type: 'relationship',
      content: message.slice(0, 100),
      importance: 9,
      reason: 'ابراز محبت و تعمیق پیوند عاطفی',
    };
  } else {
    text = years < 6
      ? 'چه جالب! دوست دارم بیشتر برام تعریف کنی... برام مثل یه داستان قشنگه!'
      : years < 18
      ? `حرف‌هات همیشه برام شنیدنیه. وقتی از زاویه سن ${years} سالگی بهش نگاه می‌کنم، خیلی چیزای تازه یاد می‌گیرم!`
      : 'حرف‌هات عمق قشنگی داره. فکر کردن به این موضوع کنار تو حس فوق‌العاده‌ای بهم میده.';
    emotion = 'calm';
    expression = 'gentle';
    gesture = 'head_tilt';
    memory_action = { should_save: false, reason: 'گفت‌وگوی عمومی' };
  }

  return {
    text,
    emotion,
    emotion_intensity: 0.85,
    facial_expression: expression,
    gesture,
    memory_candidate,
    memory_note,
    memory_action,
  };
}

// ادغام با Vite برای محیط توسعه و اجرای نهایی
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shiva Virtual Companion Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
