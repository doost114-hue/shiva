import { EmotionType, LipSyncData, VoiceAgeTier, VoiceProfile } from '../types/shiva';

/**
 * سرویس یکپارچه گفتار (STT + TTS + Lip Sync)
 */

// ۱. نگاشت سن مجازی به دسته‌بندی ۵گانه صوتی
export function getVoiceProfileForAge(years: number, emotion: EmotionType = 'calm'): VoiceProfile {
  let tier: VoiceAgeTier = 'adult';
  let tierLabel = 'زن بزرگسال';
  let ageRange = '۱۸ سال به بالا';
  let basePitch = 0.96;
  let baseRate = 0.94;
  let timbreDescription = 'صدای پخته، گرم، آرامش‌بخش، نرم، طبیعی و دلنشین زنانه';

  if (years < 2) {
    tier = 'infant';
    tierLabel = 'خردسال و نوپا';
    ageRange = '۰ تا ۲ سال';
    basePitch = 1.55;
    baseRate = 0.86;
    timbreDescription = 'صدای کودکانه شیرین و ناز متناسب با سن نوپا با گام صوتی بالا';
  } else if (years < 6) {
    tier = 'child_early';
    tierLabel = 'کودک خردسال';
    ageRange = '۲ تا ۶ سال';
    basePitch = 1.38;
    baseRate = 0.90;
    timbreDescription = 'صدای معصوم و شاداب دختربچه با لحن آهنگین و کودکانه';
  } else if (years < 12) {
    tier = 'child';
    tierLabel = 'کودک بزرگتر';
    ageRange = '۶ تا ۱۲ سال';
    basePitch = 1.22;
    baseRate = 0.95;
    timbreDescription = 'صدای زنده، پرانرژی، کنجکاو و رسا در سنین مدرسه';
  } else if (years < 18) {
    tier = 'teen';
    tierLabel = 'نوجوان';
    ageRange = '۱۲ تا ۱۸ سال';
    basePitch = 1.10;
    baseRate = 0.98;
    timbreDescription = 'صدای باطراوت، پرشور و پر احساس دوران نوجوانی';
  }

  // تنظیمات لحن بر اساس احساس جاری
  const emotionAdjustments: Record<EmotionType, { pitchMod: number; rateMod: number; tone: string }> = {
    happy: { pitchMod: +0.08, rateMod: +0.04, tone: 'لحن شاد، پرامید و باطراوت' },
    calm: { pitchMod: -0.03, rateMod: -0.06, tone: 'لحن آرام، نرم و تسلی‌بخش' },
    excited: { pitchMod: +0.14, rateMod: +0.10, tone: 'لحن پرهیجان، تند و مشتاق' },
    curious: { pitchMod: +0.06, rateMod: +0.02, tone: 'لحن کنجکاو با افت و خیز پرسشگرانه' },
    sad: { pitchMod: -0.10, rateMod: -0.14, tone: 'لحن محزون، آهسته و ملایم' },
    tired: { pitchMod: -0.07, rateMod: -0.16, tone: 'لحن خسته، کشیده و خواب‌آلود' },
    worried: { pitchMod: +0.05, rateMod: +0.04, tone: 'لحن نگران و کمی بااحتیاط' },
    playful: { pitchMod: +0.10, rateMod: +0.06, tone: 'لحن شوخ‌طبع، شیطنت‌آمیز و بازیگوش' },
  };

  const adj = emotionAdjustments[emotion] || emotionAdjustments.calm;

  return {
    tier,
    tierLabel,
    ageRange,
    basePitch: Math.max(0.6, Math.min(2.0, basePitch + adj.pitchMod)),
    baseRate: Math.max(0.6, Math.min(1.5, baseRate + adj.rateMod)),
    timbreDescription,
    emotionalTone: adj.tone,
  };
}

// ۲. پشتیبانی از تبدیل گفتار به متن (Speech-to-Text)
export interface SpeechRecognitionHandlers {
  onTranscript: (interimText: string, finalText: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onError: (error: string) => void;
}

class SpeechToTextManager {
  private recognition: any = null;
  private isListening = false;
  private accumulatedFinalText = '';

  public isSupported(): boolean {
    return typeof window !== 'undefined' && (
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    );
  }

  public startListening(handlers: SpeechRecognitionHandlers): boolean {
    if (!this.isSupported()) {
      handlers.onError('مرورگر شما از Web Speech API پشتیبانی نمی‌کند. می‌توانید از تایپ متن استفاده کنید.');
      return false;
    }

    try {
      this.stopListening();

      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = 'fa-IR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.accumulatedFinalText = '';

      this.recognition.onstart = () => {
        this.isListening = true;
        handlers.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        let currentFinalText = this.accumulatedFinalText;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinalText += (currentFinalText ? ' ' : '') + transcript;
            this.accumulatedFinalText = currentFinalText;
          } else {
            interimText += transcript;
          }
        }

        handlers.onTranscript(interimText.trim(), currentFinalText.trim());
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'not-allowed') {
          handlers.onError('دسترسی به میکروفون داده نشد. لطفاً مجوز میکروفون را در مرورگر فعال فرمایید.');
        } else if (event.error === 'network') {
          handlers.onError('خطای شبکه در اتصال به موتور تشخیص گفتار.');
        } else if (event.error !== 'no-speech') {
          handlers.onError(`خطای میکروفون: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        handlers.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (e: any) {
      console.error('Failed to start recognition:', e);
      handlers.onError('امکان فعال‌سازی میکروفون وجود ندارد.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.isListening = false;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechToText = new SpeechToTextManager();

// ۳. پشتیبانی از تبدیل متن به گفتار (Text-to-Speech) با هماهنگی سن، احساس و Lip Sync
export interface TTSPlayOptions {
  text: string;
  ageYears: number;
  emotion: EmotionType;
  facialExpression?: string;
  gesture?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onLipSyncFrame?: (data: LipSyncData) => void;
  onError?: (err: any) => void;
}

class TextToSpeechManager {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private animationFrameId: number | null = null;
  private audioStartTime = 0;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public speak(options: TTSPlayOptions): boolean {
    if (!this.isSupported()) {
      options.onError?.('مرورگر شما از SpeechSynthesis پشتیبانی نمی‌کند.');
      return false;
    }

    this.stop();

    try {
      const voiceProfile = getVoiceProfileForAge(options.ageYears, options.emotion);
      const utterance = new SpeechSynthesisUtterance(options.text);

      // یافتن بهترین صدای مناسب فارسی یا زنانه
      const voices = window.speechSynthesis.getVoices();
      const persianVoice = voices.find((v) =>
        v.lang.startsWith('fa') || v.name.toLowerCase().includes('persian') || v.name.toLowerCase().includes('farsi')
      );
      const gentleFemaleVoice = voices.find((v) =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('google')
      );

      if (persianVoice) {
        utterance.voice = persianVoice;
        utterance.lang = persianVoice.lang;
      } else if (gentleFemaleVoice) {
        utterance.voice = gentleFemaleVoice;
        utterance.lang = 'fa-IR';
      } else {
        utterance.lang = 'fa-IR';
      }

      utterance.pitch = voiceProfile.basePitch;
      utterance.rate = voiceProfile.baseRate;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.audioStartTime = performance.now();
        options.onStart?.();
        this.startLipSyncLoop(options);
      };

      utterance.onend = () => {
        this.cleanupLipSync(options);
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        this.cleanupLipSync(options);
        options.onEnd?.();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e: any) {
      console.error('TTS error:', e);
      options.onError?.(e);
      return false;
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.cleanupLipSync();
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * موتور شبیه‌سازی Lip Sync همگام با صوت
   * این تابع فریم‌های دهان، واج‌ها (Visemes) و بازشدگی فک را برای اتصال به آواتارهای سه‌بعدی و دوبعدی فراهم می‌کند.
   */
  private startLipSyncLoop(options: TTSPlayOptions): void {
    const visemeSequence = ['aa', 'E', 'I', 'O', 'U', 'aa', 'rest'];

    const animate = (currentTime: number) => {
      if (!this.isSpeaking) return;

      const elapsed = (currentTime - this.audioStartTime) / 1000;
      // نوسان طبیعی دهان متناسب با سرعت گفتار
      const frequency = 5 + (options.ageYears < 6 ? 2 : 0);
      const rawOscillation = Math.sin(elapsed * Math.PI * frequency);
      const mouthOpen = Math.max(0, rawOscillation * 0.8 + 0.2 * Math.cos(elapsed * 8));

      // انتخاب فوتک بر اساس ریتم گفتار
      const visemeIndex = Math.floor((elapsed * 6) % visemeSequence.length);
      const viseme = mouthOpen > 0.15 ? visemeSequence[visemeIndex] : 'rest';

      const lipSyncFrame: LipSyncData = {
        mouthOpenRatio: Math.min(1.0, Math.max(0.0, mouthOpen)),
        mouthWidthRatio: options.emotion === 'happy' || options.emotion === 'playful' ? 0.75 : 0.5,
        jawDrop: Math.min(1.0, Math.max(0.0, mouthOpen * 0.85)),
        viseme,
        audioLevel: mouthOpen * 0.9,
        facialExpression: options.facialExpression || 'smile',
        gesture: options.gesture || 'gentle_nod',
        timestamp: currentTime,
      };

      options.onLipSyncFrame?.(lipSyncFrame);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private cleanupLipSync(options?: TTSPlayOptions): void {
    this.isSpeaking = false;
    this.currentUtterance = null;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // ارسال فریم استراحت دهان (mouth close)
    options?.onLipSyncFrame?.({
      mouthOpenRatio: 0,
      mouthWidthRatio: 0.5,
      jawDrop: 0,
      viseme: 'rest',
      audioLevel: 0,
      facialExpression: 'smile',
      gesture: 'rest',
      timestamp: performance.now(),
    });
  }
}

export const textToSpeech = new TextToSpeechManager();
