import React, { useState } from 'react';
import {
  Eye,
  Sparkles,
  User,
  Palette,
  Sun,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Lock,
  Shirt,
  Calendar,
  CheckCircle2,
  Layers,
  Smile,
  Image as ImageIcon
} from 'lucide-react';
import { VirtualAgeInfo, ShivaState } from '../types/shiva';
import {
  SHIVA_CANONICAL_VISUAL_IDENTITY,
  SHIVA_IDENTITY_SEPARATION,
} from '../identity/ShivaVisualIdentity';
import {
  getAgeAppearanceProfile,
  lifeStageToGrowthStageKey,
} from '../identity/AgeAppearanceProfile';
import { IdentityVersioningService } from '../identity/IdentityVersioning';
import { ReferenceImageManager } from '../identity/ReferenceImageManager';

interface VisualIdentityCardProps {
  ageInfo?: VirtualAgeInfo;
  state?: ShivaState;
}

export const VisualIdentityCard: React.FC<VisualIdentityCardProps> = ({ ageInfo, state }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'guidelines' | 'versions' | 'references'>('overview');

  // سن و مرحله فعلی
  const virtualYears = ageInfo?.years ?? 0;
  const totalMonths = ageInfo?.totalMonths ?? 0;
  const ageDisplay = ageInfo?.display || 'نوزادی (روزهای نخست)';
  const lifeStage = ageInfo?.lifeStage || 'infant';

  const { profile: ageProfile, progressiveParams, stageKey } = getAgeAppearanceProfile(virtualYears, totalMonths);
  const latestVersion = IdentityVersioningService.getLatestVersion();
  const hasRefImage = ReferenceImageManager.hasReferenceForStage(stageKey);

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs overflow-hidden transition-all duration-300 space-y-4"
      id="shiva-visual-identity-section"
    >
      {/* سربرگ هویت و وضعیت قفل */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-rose-400 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base">
                هویت بصری پایدار شیوا (ShivaVisualIdentity)
              </h3>
              <div className="flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>قفل هویت فعال (Identity Locked)</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              منبع یگانه حقیقت بصری (Single Source of Truth) برای تصاویر روزانه، آواتار ۳بعدی و آلبوم رشد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            نسخه: {latestVersion.version}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
            id="toggle-visual-identity-btn"
          >
            <span>{isExpanded ? 'بستن پنل جزئیات' : 'تنظیمات و جزئیات هویت'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* بخش الزامی بند ۱۰: اطلاعات اصلی هویت بصری شیوا */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* ۱. نام */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">نام شخصیت</span>
            <User className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <span className="text-sm font-black text-slate-800">{SHIVA_CANONICAL_VISUAL_IDENTITY.name}</span>
          <span className="text-[10px] text-slate-500 mt-0.5">دختر ایرانی هوشمند</span>
        </div>

        {/* ۲. پوست */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">رنگ و بافت پوست</span>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="text-sm font-black text-slate-800">پوست بسیار روشن</span>
          <span className="text-[10px] text-slate-500 mt-0.5">شفاف، با طراوت و طبیعی</span>
        </div>

        {/* ۳. چشم‌ها */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">رنگ و نگاه چشم</span>
            <Eye className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-sm font-black text-blue-700">چشم‌های آبی درخشان</span>
          <span className="text-[10px] text-slate-500 mt-0.5">آبی کریستالی زلال و گیرا</span>
        </div>

        {/* ۴. مو */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">رنگ و حالت مو</span>
            <span className="text-slate-800 font-bold text-xs">●●</span>
          </div>
          <span className="text-sm font-black text-slate-800">مشکی پرکلاغی صاف</span>
          <span className="text-[10px] text-slate-500 mt-0.5">لخت، ابریشمی و براق</span>
        </div>

        {/* ۵. فرم چهره */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">ساختار صورت</span>
            <Smile className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <span className="text-sm font-black text-slate-800">صورت کشیده</span>
          <span className="text-[10px] text-slate-500 mt-0.5">گونه‌های لطیف و کمی تپل</span>
        </div>

        {/* ۶. سن فعلی */}
        <div className="bg-rose-50/70 rounded-2xl p-3 border border-rose-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-medium">سن فعلی شیوا</span>
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="text-sm font-black text-rose-800">{ageDisplay}</span>
          <span className="text-[10px] text-rose-600 mt-0.5">رشد پیوسته روز به روز</span>
        </div>

        {/* ۷. مرحله سنی فعلی */}
        <div className="bg-sky-50/70 rounded-2xl p-3 border border-sky-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-400 mb-1">
            <span className="text-[11px] font-medium">مرحله رشد فعلی</span>
            <Layers className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <span className="text-sm font-black text-sky-800">{ageProfile.stageFa}</span>
          <span className="text-[10px] text-sky-600 mt-0.5">{ageProfile.ageRangeDisplay}</span>
        </div>

        {/* ۸. استایل لباس متناسب با سن */}
        <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-200/60 flex flex-col justify-between col-span-2 sm:col-span-1 md:col-span-2">
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-[11px] font-medium">استایل لباس متناسب با سن</span>
            <Shirt className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-xs font-bold text-amber-900 leading-snug line-clamp-2">
            {ageProfile.clothing_guidelines}
          </span>
          <span className="text-[10px] text-amber-700 mt-1">پوشش موقر، متناسب با سن و فصل</span>
        </div>

        {/* ۹. وضعیت قفل هویت */}
        <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-500 mb-1">
            <span className="text-[11px] font-medium">قفل هویت (IdentityLock)</span>
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-sm font-black text-emerald-800">LOCKED (قفل کامل)</span>
          <span className="text-[10px] text-emerald-600 mt-0.5">ضریب انطباق ۱۰۰٪</span>
        </div>
      </div>

      {/* نشانگر تصویر مرجع */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/60 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <ImageIcon className="w-4 h-4 text-indigo-500" />
          <span>وضعیت تصویر مرجع مرحله {ageProfile.stageFa}:</span>
          <strong className={hasRefImage ? 'text-emerald-700' : 'text-slate-500'}>
            {hasRefImage ? 'تصویر مرجع فعال است' : 'آماده‌به‌کار (استفاده از پرامپت کانونیکال)'}
          </strong>
        </div>
        <span className="text-[11px] text-slate-400">
          انحراف مدل تصویرساز: ۰٪ (کنترل با قفل هویت)
        </span>
      </div>

      {/* جزئیات گسترش‌یافته پنل هویت */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 text-xs">
          {/* تب‌های درون پنل */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              تفکیک ویژگی‌های ثابت و متغیر
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guidelines')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                activeTab === 'guidelines'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              دستورالعمل‌های سنی و حفاظت
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('versions')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                activeTab === 'versions'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              تاریخچه نسخه‌های هویت (Versioning)
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* ویژگی‌های ثابت */}
              <div className="bg-rose-50/70 border border-rose-200/70 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>ویژگی‌های ثابت هویت (IdentityLock - غیرقابل دستکاری)</span>
                </div>
                <p className="text-[11px] text-rose-700/90 leading-relaxed">
                  {SHIVA_IDENTITY_SEPARATION.immutable.descriptionFa}
                </p>
                <ul className="space-y-1.5 text-slate-700 text-[11px]">
                  <li>• <strong>پوست:</strong> {SHIVA_IDENTITY_SEPARATION.immutable.skin_tone}</li>
                  <li>• <strong>چشم‌ها:</strong> {SHIVA_IDENTITY_SEPARATION.immutable.eye_color}</li>
                  <li>• <strong>موها:</strong> {SHIVA_IDENTITY_SEPARATION.immutable.hair_color} و {SHIVA_IDENTITY_SEPARATION.immutable.hair_type}</li>
                  <li>• <strong>فرم چهره:</strong> {SHIVA_IDENTITY_SEPARATION.immutable.face_shape}</li>
                </ul>
              </div>

              {/* ویژگی‌های متغیر */}
              <div className="bg-sky-50/70 border border-sky-200/70 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sky-800">
                  <Palette className="w-4 h-4 text-sky-600" />
                  <span>ویژگی‌های متغیر روزانه (وابسته به زمان و شرایط)</span>
                </div>
                <p className="text-[11px] text-sky-700/90 leading-relaxed">
                  {SHIVA_IDENTITY_SEPARATION.mutable.descriptionFa}
                </p>
                <div className="grid grid-cols-2 gap-1 text-slate-700 text-[11px]">
                  {SHIVA_IDENTITY_SEPARATION.mutable.allowedFields.map((f, idx) => (
                    <div key={idx}>• {f}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 space-y-2 text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>قوانین طلایی حفاظت از سنین زیر ۱۸ سال (Child Safety Guidelines)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                در تمام مراحل نوزادی، کودکی، پیش‌نوجوانی و نوجوانی شیوا (سن زیر ۱۸ سال)، تصاویر و مدل‌های آواتار کاملاً معصومانه، با وقار، پوشیده و متناسب با شرایط سنی یک کودک یا نوجوان در حال رشد تولید می‌شوند و هرگونه جلوه یا المان بزرگسالانه اکیداً مسدود است.
              </p>
              <div className="bg-white/80 rounded-xl p-3 border border-emerald-200/60 mt-2 text-[11px]">
                <strong>دستورالعمل مرحله فعلی ({ageProfile.stageFa}):</strong> {ageProfile.safety_rule}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-2">
              <div className="text-slate-600 text-[11px]">
                هرگونه تغییر در ارکان هویت بصری شیوا به صورت نسخه‌بندی‌شده در این جدول ذخیره می‌شود:
              </div>
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>نسخه: {latestVersion.version}</span>
                  <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">پایدار و کانونیکال</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {latestVersion.description}
                </p>
                <span className="text-[10px] text-slate-400 block">
                  ثبت‌شده توسط: {latestVersion.author === 'system' ? 'هسته اصلی سیستم شیوا' : 'کاربر'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
