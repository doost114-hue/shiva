import React from 'react';
import { X, Sparkles, Copy, Check, Calendar, Activity, Heart, Camera, Sliders } from 'lucide-react';
import { DailyImage } from '../types/shiva';

interface DailyImageDetailModalProps {
  image: DailyImage | null;
  onClose: () => void;
}

export const DailyImageDetailModal: React.FC<DailyImageDetailModalProps> = ({ image, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!image) return null;

  const sp = image.structured_prompt;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      id="daily-image-detail-modal"
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute left-5 top-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
          title="بستن"
          id="close-image-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* سربرگ */}
        <div className="flex items-center gap-3 mb-5 pr-2">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              تصویر روزانه شیوا • روز {image.virtual_day}
            </h3>
            <p className="text-xs text-slate-500">
              سن مجازی: {image.virtual_age} | تاریخ: {image.real_date}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ستون چپ: تصویر */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs relative">
              <img
                src={image.image_url}
                alt={`پرتره شیوا در روز ${image.virtual_day}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 right-2 left-2 bg-black/60 backdrop-blur-xs text-white p-2 rounded-xl text-[11px] flex justify-between items-center">
                <span>{image.event}</span>
                <span className="bg-rose-500 px-2 py-0.5 rounded-full text-[10px]">{image.mood}</span>
              </div>
            </div>

            <button
              onClick={handleCopyPrompt}
              className="mt-3 w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              id="copy-full-prompt-btn"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'پرامپت در حافظه کپی شد' : 'کپی پرامپت کامل تولید تصویر'}</span>
            </button>
          </div>

          {/* ستون راست: ۱۰ بخش پرامپت ساختاریافته */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pl-1 pr-1 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>ساختار ۱۰ بخشی Prompt تصویر</span>
            </div>

            {sp ? (
              <>
                <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
                  <div className="font-bold text-rose-800 text-[11px] mb-0.5">۱. هویت ثابت (identity):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.identity}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-700 text-[11px] mb-0.5">۲. سن و ایمنی (age):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.age}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-700 text-[11px] mb-0.5">۳. ظاهر فیزیکی (appearance):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.appearance}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-700 text-[11px] mb-0.5">۴. پوشش و لباس (clothing):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.clothing}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-700 text-[11px] mb-0.5">۵. فعالیت روز (activity):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.activity}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-700 text-[11px] mb-0.5">۶. محیط و فصل (environment):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.environment}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-700 text-[11px] mb-0.5">۷. حالت چهره و احساس (emotion):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.emotion}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-700 text-[11px] mb-0.5">۸. نورپردازی (lighting):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.lighting}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-700 text-[11px] mb-0.5">۹. زاویه و لنز دوربین (camera):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.camera}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-700 text-[11px] mb-0.5">۱۰. سبک بصری (visual style):</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{sp.visual_style}</p>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl text-slate-600 leading-relaxed text-[11px]">
                {image.prompt}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
