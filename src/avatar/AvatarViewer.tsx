import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  AvatarState,
  AvatarGesture,
  AvatarExpression,
  AvatarProfile,
} from '../types/avatar';
import { EmotionType } from '../types/shiva';
import { AvatarAnimationController } from './AvatarAnimationController';
import { ProceduralShivaAvatar } from './ProceduralShivaAvatar';
import { getAvatarProfile } from './AvatarProfile';
import {
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  Volume2,
  Brain,
  Mic,
  Smile,
  Heart,
  HelpCircle,
} from 'lucide-react';

export interface AvatarViewerRef {
  triggerGesture: (gesture: AvatarGesture) => void;
  setEmotion: (emotion: EmotionType, intensity?: number) => void;
  setState: (state: AvatarState) => void;
  feedAudioLevel: (level: number) => void;
  triggerBlink: () => void;
}

interface AvatarViewerProps {
  years: number;
  avatarState: AvatarState;
  currentEmotion: EmotionType;
  emotionIntensity?: number;
  activeGesture?: AvatarGesture;
  audioLevel?: number; // 0 تا 1 برای LipSync
  customModelUrl?: string | null;
  onModelUrlChange?: (newUrl: string | null) => void;
  className?: string;
  showDevControls?: boolean;
}

export const AvatarViewer = forwardRef<AvatarViewerRef, AvatarViewerProps>(
  (
    {
      years,
      avatarState,
      currentEmotion,
      emotionIntensity = 0.6,
      activeGesture,
      audioLevel = 0,
      customModelUrl = null,
      onModelUrlChange,
      className = '',
      showDevControls = false,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // وضعیت داخلی بارگذاری مدل خارجی
    const [modelLoading, setModelLoading] = useState<boolean>(false);
    const [modelError, setModelError] = useState<string | null>(null);
    const [isUsingGltf, setIsUsingGltf] = useState<boolean>(false);
    const [modelUrlInput, setModelUrlInput] = useState<string>(customModelUrl || '');
    const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

    // کنترلر انیمیشن مرکزی آواتار
    const animCtrlRef = useRef<AvatarAnimationController | null>(null);
    if (!animCtrlRef.current) {
      animCtrlRef.current = new AvatarAnimationController();
    }
    const animCtrl = animCtrlRef.current;

    // متغیرهای صحنه Three.js
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const proceduralAvatarRef = useRef<ProceduralShivaAvatar | null>(null);
    const gltfModelRef = useRef<THREE.Object3D | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const clockRef = useRef<THREE.Clock>(new THREE.Clock());

    // پروفایل آواتار متناسب با سن
    const [profile, setProfile] = useState<AvatarProfile>(() =>
      getAvatarProfile(years, customModelUrl)
    );

    // به‌روزرسانی پروفایل با تغییر سن یا آدرس مدل
    useEffect(() => {
      const newProf = getAvatarProfile(years, customModelUrl);
      setProfile(newProf);
      if (proceduralAvatarRef.current) {
        proceduralAvatarRef.current.applyProfile(newProf);
      }
    }, [years, customModelUrl]);

    // اعمال تغییرات ورودی به AnimationController
    useEffect(() => {
      animCtrl.setState(avatarState);
    }, [avatarState, animCtrl]);

    useEffect(() => {
      animCtrl.setEmotion(currentEmotion, emotionIntensity);
    }, [currentEmotion, emotionIntensity, animCtrl]);

    useEffect(() => {
      if (activeGesture && activeGesture !== 'neutral') {
        animCtrl.triggerGesture(activeGesture);
      }
    }, [activeGesture, animCtrl]);

    useEffect(() => {
      animCtrl.lipSyncCtrl.feedAudioLevel(audioLevel);
    }, [audioLevel, animCtrl]);

    // امکان فراخوانی دستی از طریق Ref
    useImperativeHandle(ref, () => ({
      triggerGesture: (gesture: AvatarGesture) => animCtrl.triggerGesture(gesture),
      setEmotion: (emotion: EmotionType, intensity = 0.6) =>
        animCtrl.setEmotion(emotion, intensity),
      setState: (state: AvatarState) => animCtrl.setState(state),
      feedAudioLevel: (level: number) => animCtrl.lipSyncCtrl.feedAudioLevel(level),
      triggerBlink: () => animCtrl.triggerBlink(),
    }));

    // راه‌اندازی صحنه Three.js
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const width = container.clientWidth || 400;
      const height = container.clientHeight || 450;

      // ۱. Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // ۲. Camera
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
      camera.position.set(0, 0.25, 2.2);
      cameraRef.current = camera;

      // ۳. Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      rendererRef.current = renderer;

      // ۴. نورپردازی ملایم و زنده چهره (Studio Portrait Lighting)
      const ambientLight = new THREE.AmbientLight(0xfff3ea, 1.2);
      scene.add(ambientLight);

      // نور کلیدی روبرو (Key Light) با تناژ گرم
      const keyLight = new THREE.DirectionalLight(0xfffaed, 1.4);
      keyLight.position.set(0.6, 1.2, 1.5);
      scene.add(keyLight);

      // نور پرکننده نرم (Fill Light) برای لطافت سایه‌ها
      const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.8);
      fillLight.position.set(-0.8, 0.5, 1.2);
      scene.add(fillLight);

      // نور مو و کادر (Rim Light) برای جلوه براق موهای مشکی شیوا
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
      rimLight.position.set(0, 1.5, -1.0);
      scene.add(rimLight);

      // ۵. ایجاد آواتار پارامتریک پیش‌فرض با Three.js (Procedural Avatar Fallback)
      const proceduralAvatar = new ProceduralShivaAvatar(profile);
      proceduralAvatarRef.current = proceduralAvatar;
      scene.add(proceduralAvatar.group);

      // ۶. لود مدل GLTF در صورت ارائه URL
      if (customModelUrl) {
        loadGltfModel(customModelUrl, scene);
      }

      // ۷. مدیریت تغییر سایز به کمک ResizeObserver
      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      });
      resizeObserver.observe(container);

      // ۸. حلقه رندر فریم به فریم (Animation Render Loop)
      clockRef.current.start();

      const animate = () => {
        animationFrameId.current = requestAnimationFrame(animate);

        const delta = clockRef.current.getDelta();
        const cappedDelta = Math.min(delta, 0.1); // جلوگیری از پرش‌های بزرگ فریم

        // به‌روزرسانی کنترلر انیمیشن و دریافت مقادیر
        const frameData = animCtrl.update(cappedDelta);

        // اعمال بر آواتار پارامتریک
        if (proceduralAvatarRef.current && !isUsingGltf) {
          proceduralAvatarRef.current.applyFrame(
            frameData.headTransform,
            frameData.morphs,
            frameData.shoulderOffset,
            frameData.waveAngle,
            frameData.eyeLookTarget
          );
        }

        // اعمال بر مدل GLTF در صورت لود بودن
        if (gltfModelRef.current && isUsingGltf) {
          applyFrameToGltf(gltfModelRef.current, frameData);
        }

        renderer.render(scene, camera);
      };

      animate();

      // پاک‌سازی در خروج
      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        resizeObserver.disconnect();
        renderer.dispose();
      };
    }, []);

    // تابع بارگذاری فایل GLB / GLTF
    const loadGltfModel = (url: string, scene: THREE.Scene) => {
      setModelLoading(true);
      setModelError(null);

      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          // حذف مدل GLTF قبلی در صورت وجود
          if (gltfModelRef.current) {
            scene.remove(gltfModelRef.current);
          }

          const model = gltf.scene;
          // تنظیم ابعاد و موقعیت
          model.position.set(0, -0.6, 0);
          model.scale.set(1.0, 1.0, 1.0);

          scene.add(model);
          gltfModelRef.current = model;
          setIsUsingGltf(true);
          setModelLoading(false);

          // مخفی کردن مدل پارامتریک
          if (proceduralAvatarRef.current) {
            proceduralAvatarRef.current.group.visible = false;
          }
        },
        undefined,
        (err) => {
          console.warn('Failed to load external GLTF model, keeping procedural avatar fallback:', err);
          setModelError('بارگذاری مدل خارجی ناموفق بود؛ آواتار پارامتریک سه‌بعدی زنده فعال است.');
          setModelLoading(false);
          setIsUsingGltf(false);
          if (proceduralAvatarRef.current) {
            proceduralAvatarRef.current.group.visible = true;
          }
        }
      );
    };

    // اعمال فریم انیمیشن به مدل GLTF
    const applyFrameToGltf = (model: THREE.Object3D, frameData: any) => {
      // سر یا استخوان گردن
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            // اتصال مورف‌ها در صورت پشتیبانی مدل GLB
            const dict = mesh.morphTargetDictionary;
            const inf = mesh.morphTargetInfluences;

            const mapMorph = (names: string[], val: number) => {
              for (const name of names) {
                if (dict[name] !== undefined) {
                  inf[dict[name]] = val;
                }
              }
            };

            mapMorph(['mouthOpen', 'jawOpen', 'viseme_aa'], frameData.morphs.mouthOpen);
            mapMorph(['mouthSmile', 'smile'], frameData.morphs.mouthSmile);
            mapMorph(['blink_left', 'eyeBlinkLeft'], frameData.morphs.blinkLeft);
            mapMorph(['blink_right', 'eyeBlinkRight'], frameData.morphs.blinkRight);
          }
        }
        // اگر نودی با نام Head بود
        if (child.name.toLowerCase().includes('head')) {
          child.rotation.x = frameData.headTransform.pitch;
          child.rotation.y = frameData.headTransform.yaw;
          child.rotation.z = frameData.headTransform.roll;
        }
      });
    };

    // ثبت آدرس جدید مدل سه بعدی
    const handleApplyCustomModel = (e: React.FormEvent) => {
      e.preventDefault();
      const url = modelUrlInput.trim() || null;
      if (onModelUrlChange) {
        onModelUrlChange(url);
      }
      if (url && sceneRef.current) {
        loadGltfModel(url, sceneRef.current);
      } else {
        // بازگشت به آواتار پارامتریک
        if (gltfModelRef.current && sceneRef.current) {
          sceneRef.current.remove(gltfModelRef.current);
          gltfModelRef.current = null;
        }
        setIsUsingGltf(false);
        if (proceduralAvatarRef.current) {
          proceduralAvatarRef.current.group.visible = true;
        }
      }
      setShowSettingsDrawer(false);
    };

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-[380px] sm:h-[440px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 flex flex-col items-center justify-center border border-slate-700/50 shadow-inner ${className}`}
        dir="rtl"
      >
        {/* پس‌زمینه نوری هاله‌ای بر اساس AvatarState */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            avatarState === 'listening'
              ? 'bg-radial from-rose-500/15 via-transparent to-transparent opacity-100'
              : avatarState === 'thinking'
              ? 'bg-radial from-amber-500/15 via-transparent to-transparent opacity-100'
              : avatarState === 'speaking'
              ? 'bg-radial from-emerald-500/15 via-transparent to-transparent opacity-100'
              : 'bg-radial from-indigo-500/10 via-transparent to-transparent opacity-60'
          }`}
        />

        {/* بوم رندر سه‌بعدی Three.js */}
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* نشانگر رده سنی در گوشه بالا */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>{profile.age_title_fa}</span>
        </div>

        {/* دکمه تنظیمات و تعویض مدل GLB در گوشه چپ */}
        <button
          onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
          title="تنظیمات آواتار و اتصال مدل سه‌بعدی GLB"
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* بخش پیام وضعیت زیر آواتار طبق دستور دقیق کاربر:
            «زیر آواتار وضعیت فعلی نمایش داده شود:
            * «شیوا در حال گوش دادن...»
            * «شیوا در حال فکر کردن...»
            * «شیوا در حال صحبت...»
            در حالت idle هیچ پیام وضعیت اضافه نمایش داده نشود.»
        */}
        <div className="absolute bottom-5 z-10 flex flex-col items-center pointer-events-none">
          {avatarState === 'listening' && (
            <div className="inline-flex items-center gap-2 bg-rose-950/80 backdrop-blur-md text-rose-300 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-rose-600/50 shadow-lg animate-pulse">
              <Mic className="w-4 h-4 text-rose-400" />
              <span>شیوا در حال گوش دادن...</span>
            </div>
          )}

          {avatarState === 'thinking' && (
            <div className="inline-flex items-center gap-2 bg-amber-950/80 backdrop-blur-md text-amber-300 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-amber-600/50 shadow-lg animate-pulse">
              <Brain className="w-4 h-4 text-amber-400 animate-spin" />
              <span>شیوا در حال فکر کردن...</span>
            </div>
          )}

          {avatarState === 'speaking' && (
            <div className="inline-flex items-center gap-2 bg-emerald-950/80 backdrop-blur-md text-emerald-300 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-emerald-600/50 shadow-lg animate-pulse">
              <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>شیوا در حال صحبت...</span>
            </div>
          )}

          {/* در حالت idle هیچ پیام اضافه نمایش داده نمی‌شود */}
        </div>

        {/* لودینگ مدل */}
        {modelLoading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-2 text-white text-xs z-20">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>در حال بارگذاری مدل سه‌بعدی شیوا...</span>
          </div>
        )}

        {/* دراور تنظیمات مدل خارجی و ژست‌ها */}
        {showSettingsDrawer && (
          <div className="absolute inset-x-3 top-14 bottom-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-300 z-30 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  مدل سه‌بعدی و پارامترهای آواتار شیوا
                </span>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-800"
                >
                  بستن
                </button>
              </div>

              {/* ورودی آدرس مدل سه بعدی (قانون: از hard-code کردن مدل نهایی خودداری کن) */}
              <form onSubmit={handleApplyCustomModel} className="space-y-2">
                <label className="block text-[11px] text-slate-400">
                  آدرس فایل سه‌بعدی سفارشی (GLB / GLTF):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={modelUrlInput}
                    onChange={(e) => setModelUrlInput(e.target.value)}
                    placeholder="https://.../shiva_avatar.glb (اختیاری)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-medium cursor-pointer"
                  >
                    اعمال
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  در صورت خالی بودن یا عدم وجود فایل، مدل سه‌بعدی پارامتریک و زنده شیوا به صورت خودکار رندر می‌شود.
                </p>
              </form>

              {modelError && (
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{modelError}</span>
                </div>
              )}

              {/* تست دستی ژست‌ها (جهت تأیید کارکرد GestureController) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold">تست ژست‌های حرکتی:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      ['small_wave', 'درود (Wave)'],
                      ['nod', 'تأیید سر (Nod)'],
                      ['head_tilt', 'متمایل کردن (Tilt)'],
                      ['shrug', 'بالا انداختن شانه'],
                      ['look_away', 'نگاه به گوشه'],
                      ['happy_bounce', 'جهش شاد'],
                    ] as const
                  ).map(([gesture, label]) => (
                    <button
                      key={gesture}
                      type="button"
                      onClick={() => animCtrl.triggerGesture(gesture)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] text-center transition-colors cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* تست دستی حالات چهره (ExpressionController) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold">تست حالات چهره:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      ['happy', 'خوشحال'],
                      ['calm', 'آرام'],
                      ['excited', 'هیجان‌زده'],
                      ['sad', 'غمگین'],
                      ['worried', 'نگران'],
                      ['curious', 'کنجکاو'],
                      ['playful', 'بازیگوش'],
                      ['tired', 'خسته'],
                    ] as const
                  ).map(([emo, label]) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => animCtrl.setEmotion(emo, 0.8)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] text-center transition-colors cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-slate-800">
              موتور سه‌بعدی Shiva Three.js Avatar Engine • مرحله ۱۴
            </div>
          </div>
        )}
      </div>
    );
  }
);

AvatarViewer.displayName = 'AvatarViewer';
