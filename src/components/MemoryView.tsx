import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryItem, ShivaMemoryType, ShivaState } from '../types/shiva';
import { StorageService } from '../services/storage';
import {
  Brain,
  Trash2,
  Plus,
  ArrowUpDown,
  Search,
  Star,
  Clock,
  ShieldCheck,
  User,
  BookmarkCheck,
  Calendar,
  Zap,
  HeartHandshake,
  Layers,
  Sparkles,
  AlertCircle,
  X,
  Check
} from 'lucide-react';

interface MemoryViewProps {
  state: ShivaState;
  onStateUpdate: (newState: ShivaState) => void;
}

type SortOption = 'newest' | 'importance' | 'type';

const MEMORY_CATEGORIES: {
  type: ShivaMemoryType;
  title: string;
  shortTitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  borderLight: string;
  description: string;
}[] = [
  {
    type: 'fixed_shiva',
    title: '۱. اطلاعات ثابت شیوا',
    shortTitle: 'ثابت شیوا',
    icon: ShieldCheck,
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50/80 text-indigo-700',
    borderLight: 'border-indigo-200',
    description: 'هویت، ظاهر ثابت (چشم آبی، موهای مشکی صاف)، لحن، ارزش‌ها و مشخصات پایدار شیوا',
  },
  {
    type: 'user_important',
    title: '۲. اطلاعات مهم کاربر',
    shortTitle: 'حقایق کاربر',
    icon: User,
    color: 'text-sky-600',
    bgLight: 'bg-sky-50/80 text-sky-700',
    borderLight: 'border-sky-200',
    description: 'نام، شغل، علایق ماندگار، سلایق، اهداف و دانسته‌های کلیدی درباره شما',
  },
  {
    type: 'important_memory',
    title: '۳. خاطرات مهم',
    shortTitle: 'خاطرات مهم',
    icon: BookmarkCheck,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50/80 text-amber-700',
    borderLight: 'border-amber-200',
    description: 'رویدادهای سرنوشت‌ساز، تصمیم‌ها، اتفاقات عاطفی خاص و نقاط عطف ارتباط',
  },
  {
    type: 'daily_memory',
    title: '۴. خاطرات روزانه',
    shortTitle: 'خاطرات روزانه',
    icon: Calendar,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50/80 text-emerald-700',
    borderLight: 'border-emerald-200',
    description: 'رویدادها و حس‌های برجسته ثبت‌شده در هر روز از زندگی و رشد شیوا',
  },
  {
    type: 'short_term',
    title: '۵. حافظه کوتاه‌مدت',
    shortTitle: 'کوتاه‌مدت',
    icon: Zap,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50/80 text-purple-700',
    borderLight: 'border-purple-200',
    description: 'موضوعات فعال، درخواست‌های پیگیری و آخرین نکات مطرح در گفت‌وگوهای اخیر',
  },
  {
    type: 'relationship',
    title: '۶. اطلاعات رابطه',
    shortTitle: 'اطلاعات رابطه',
    icon: HeartHandshake,
    color: 'text-rose-600',
    bgLight: 'bg-rose-50/80 text-rose-700',
    borderLight: 'border-rose-200',
    description: 'نوع پیوند، سطح اعتماد و صمیمیت، نحوه خطاب و پیمان‌های متقابل میان شما و شیوا',
  },
];

function formatPersianDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export const MemoryView: React.FC<MemoryViewProps> = ({ state, onStateUpdate }) => {
  const [selectedCategory, setSelectedCategory] = useState<ShivaMemoryType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // فرم ثبت خاطره دستی
  const [newType, setNewType] = useState<ShivaMemoryType>('user_important');
  const [newContent, setNewContent] = useState('');
  const [newImportance, setNewImportance] = useState<number>(8);

  const memories = state.memory.memories || [];

  // فیلتر و مرتب‌سازی خاطرات
  const filteredAndSortedMemories = useMemo(() => {
    let list = [...memories];

    // فیلتر دسته
    if (selectedCategory !== 'all') {
      list = list.filter((m) => m.type === selectedCategory);
    }

    // جستجو
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.metadata?.category?.toLowerCase().includes(q) ||
          m.metadata?.virtualAge?.toLowerCase().includes(q)
      );
    }

    // مرتب‌سازی
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        return timeB - timeA;
      }
      if (sortBy === 'importance') {
        return (b.importance || 5) - (a.importance || 5);
      }
      if (sortBy === 'type') {
        const order = {
          fixed_shiva: 1,
          user_important: 2,
          important_memory: 3,
          daily_memory: 4,
          short_term: 5,
          relationship: 6,
        };
        const orderDiff = (order[a.type] || 99) - (order[b.type] || 99);
        if (orderDiff !== 0) return orderDiff;
        return (b.importance || 5) - (a.importance || 5);
      }
      return 0;
    });

    return list;
  }, [memories, selectedCategory, sortBy, searchQuery]);

  const handleDeleteMemory = (id: string) => {
    const updated = StorageService.deleteMemory(state, id);
    onStateUpdate(updated);
    setDeleteConfirmId(null);
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const updated = StorageService.addMemory(
      state,
      newType,
      newContent.trim(),
      newImportance,
      { category: 'ثبت دستی کاربر' }
    );
    onStateUpdate(updated);
    setNewContent('');
    setShowAddModal(false);
  };

  // محاسبه تعداد در هر دسته
  const countsByType = useMemo(() => {
    const map: Record<string, number> = {
      fixed_shiva: 0,
      user_important: 0,
      important_memory: 0,
      daily_memory: 0,
      short_term: 0,
      relationship: 0,
    };
    for (const m of memories) {
      if (map[m.type] !== undefined) {
        map[m.type]++;
      }
    }
    return map;
  }, [memories]);

  return (
    <div className="max-w-5xl mx-auto space-y-6" id="shiva-memory-view">
      {/* سربرگ اصلی: 🧠 خاطرات شیوا */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs">
            <Brain className="w-4 h-4" />
            <span>سیستم حافظه دائمی و بازیابی هوشمند</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>🧠 خاطرات شیوا</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
              {memories.length} خاطره ذخیره‌شده
            </span>
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            حافظه شیوا بر اساس ساختار ۶ بخشی دائمی تفکیک شده است. در هر گفتگو، پیام‌ها ارزیابی شده و تنها موارد ارزشمند ذخیره می‌شوند. همچنین هنگام پاسخ، فقط خاطرات مرتبط بازیابی و در اختیار هوش مصنوعی قرار می‌گیرند.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت خاطره دستی</span>
          </button>
        </div>
      </div>

      {/* کارت شفاف‌سازی معماری: تفکیک هویت ثابت از حافظه پویا */}
      <div className="bg-gradient-to-r from-amber-50/80 via-rose-50/50 to-indigo-50/80 rounded-2xl p-4 border border-amber-200/70 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
        <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <span>اصل تفکیک هویت ثابت از حافظه دائمی:</span>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-amber-200 text-amber-800 font-medium">
              معماری پایدار
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11.5px]">
            ویژگی‌های بنیادین شخصیت شیوا (مهربانی ۹۰، شوخ‌طبعی ۸۵، عاطفی ۸۰، کنجکاوی ۹۰) و مشخصات ظاهری (پوست روشن، چشم آبی و موی مشکی صاف) به عنوان هویت ذاتی او ثابت هستند، در حالی که خاطرات، دانسته‌ها درباره کاربر و روابط در این سیستم حافظه پویا رشد می‌کنند.
          </p>
        </div>
      </div>

      {/* کارت‌های خلاصه دسته‌بندی ۶ بخشی */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {MEMORY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = countsByType[cat.type] || 0;
          const isSelected = selectedCategory === cat.type;
          return (
            <button
              key={cat.type}
              onClick={() => setSelectedCategory(isSelected ? 'all' : cat.type)}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-rose-500 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : cat.bgLight
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-sm font-black ${
                    isSelected ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {count}
                </span>
              </div>
              <div>
                <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {cat.shortTitle}
                </div>
                <div
                  className={`text-[10px] truncate mt-0.5 ${
                    isSelected ? 'text-rose-100' : 'text-slate-400'
                  }`}
                >
                  بخش {cat.title.slice(0, 2)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* نوار فیلتر، جستجو و مرتب‌سازی */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* جستجو */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در محتوا، شناسه یا برچسب‌های حافظه..."
            className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-800 outline-none transition-all"
            dir="rtl"
          />
        </div>

        {/* فیلتر دسته و مرتب‌سازی */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* دسته‌ها */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-400 cursor-pointer"
          >
            <option value="all">همه بخش‌ها ({memories.length})</option>
            {MEMORY_CATEGORIES.map((c) => (
              <option key={c.type} value={c.type}>
                {c.title} ({countsByType[c.type] || 0})
              </option>
            ))}
          </select>

          {/* مرتب‌سازی: جدیدترین، مهم‌ترین، نوع خاطره */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              مرتب‌سازی:
            </span>

            <button
              onClick={() => setSortBy('newest')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                sortBy === 'newest'
                  ? 'bg-white text-rose-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جدیدترین
            </button>

            <button
              onClick={() => setSortBy('importance')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                sortBy === 'importance'
                  ? 'bg-white text-rose-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مهم‌ترین
            </button>

            <button
              onClick={() => setSortBy('type')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                sortBy === 'type'
                  ? 'bg-white text-rose-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              نوع خاطره
            </button>
          </div>
        </div>
      </div>

      {/* فهرست نمایش خاطرات */}
      {filteredAndSortedMemories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-700">هیچ خاطره‌ای در این فیلتر یافت نشد</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            می‌توانید با شیوا گفتگو کنید یا با دکمه «ثبت خاطره دستی» نکته جدیدی را در حافظه ماندگار او ذخیره نمایید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <AnimatePresence>
            {filteredAndSortedMemories.map((mem) => {
              const catConfig = MEMORY_CATEGORIES.find((c) => c.type === mem.type) || MEMORY_CATEGORIES[0];
              const Icon = catConfig.icon;
              const isDeleting = deleteConfirmId === mem.id;

              return (
                <motion.div
                  key={mem.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-3 relative overflow-hidden"
                >
                  {/* نوار رنگی دسته در بالای کارت */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${catConfig.bgLight} ${catConfig.borderLight}`}>
                        <Icon className="w-3 h-3" />
                        <span>{catConfig.shortTitle}</span>
                      </span>

                      {/* نشانگر درجه اهمیت */}
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>اهمیت: {mem.importance}/۱۰</span>
                      </span>
                    </div>

                    {/* دکمه حذف خاطره */}
                    <div>
                      {isDeleting ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                          <span className="text-[10px] text-red-700 font-bold px-1">حذف؟</span>
                          <button
                            onClick={() => handleDeleteMemory(mem.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs transition-colors cursor-pointer"
                            title="تایید حذف"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1 rounded text-xs transition-colors cursor-pointer"
                            title="انصراف"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(mem.id)}
                          className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="حذف این خاطره از ذهن شیوا"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* محتوای خاطره */}
                  <div className="space-y-2 flex-1">
                    <p className="text-slate-800 text-sm leading-relaxed font-normal whitespace-pre-wrap">
                      {mem.content}
                    </p>

                    {/* متادیتا یا برچسب‌ها */}
                    {mem.metadata && (mem.metadata.virtualAge || mem.metadata.category) && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 pt-1">
                        {mem.metadata.virtualAge && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            سن: {mem.metadata.virtualAge}
                          </span>
                        )}
                        {mem.metadata.category && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            موضوع: {mem.metadata.category}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* پاورقی کارت: تاریخ ایجاد و آخرین استفاده هوش مصنوعی */}
                  <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-[10.5px] text-slate-400">
                    <div className="flex items-center gap-1" title="زمان ثبت در حافظه">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>ثبت: {formatPersianDateTime(mem.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-indigo-500 font-medium" title="آخرین زمان بازیابی و استفاده در پاسخگویی به کاربر">
                      <span>آخرین فراخوانی: {formatPersianDateTime(mem.last_used)}</span>
                    </div>
                  </div>

                  {/* شناسه خاطره */}
                  <div className="text-[9px] font-mono text-slate-300 text-left -mt-1">
                    id: {mem.id}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* مدال افزودن خاطره دستی */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Brain className="w-4 h-4 text-rose-500" />
                  <span>ثبت خاطره دستی در ذهن شیوا</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-4">
                {/* انتخاب بخش حافظه */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    بخش مورد نظر حافظه:
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ShivaMemoryType)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    {MEMORY_CATEGORIES.map((cat) => (
                      <option key={cat.type} value={cat.type}>
                        {cat.title} ({cat.shortTitle})
                      </option>
                    ))}
                  </select>
                </div>

                {/* متن خاطره */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    متن و محتوای خاطره:
                  </label>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="مثال: کاربر به عکاسی در طبیعت علاقه زیادی دارد و دوربین قدیمی محبوبش را همیشه همراه دارد..."
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 rounded-xl p-3 text-xs text-slate-800 outline-none leading-relaxed"
                    dir="rtl"
                    required
                  />
                </div>

                {/* درجه اهمیت */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">درجه اهمیت (۱ تا ۱۰):</span>
                    <span className="text-amber-600 font-bold">{newImportance} از ۱۰</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={newImportance}
                    onChange={(e) => setNewImportance(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>کم‌اهمیت (۱)</span>
                    <span>متوسط (۵)</span>
                    <span>حیاتی و ماندگار (۱۰)</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-xs cursor-pointer"
                  >
                    ذخیره دائمی
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
