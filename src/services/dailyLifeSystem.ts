import {
  DailyEventLevel,
  DailyImage,
  DailyLifeEntry,
  DailyMemory,
  DailyMemoryEvent,
  DailyMemoryMood,
  DailyMemoryVirtualAge,
  EmotionType,
  LifeStage,
  MemoryItem,
  PersonalityTraits,
  ShivaState,
  VirtualAgeInfo
} from '../types/shiva';
import { calculateVirtualAge } from './ageSystem';
import {
  RelationshipEngine,
  getDefaultRelationshipState,
} from './relationshipEngine';
import {
  buildStructuredDailyImagePrompt,
  generateAestheticFallbackSvgUrl
} from './dailyImageSystem';

/**
 * دریافت رشته تاریخ امروز به فرمت YYYY-MM-DD بر اساس زمان محلی
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * برگرداندن تعداد روزهای بین دو تاریخ YYYY-MM-DD
 */
export function getDaysDifference(dateStrA: string, dateStrB: string): number {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const dateA = new Date(y1, m1 - 1, d1);
  const dateB = new Date(y2, m2 - 1, d2);
  const diffMs = dateB.getTime() - dateA.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * اضافه کردن N روز به یک تاریخ YYYY-MM-DD
 */
export function addDaysToDateString(dateStr: string, daysToAdd: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + daysToAdd);
  return getLocalDateString(date);
}

/**
 * تعیین مرحله رشد بر اساس سن بر حسب سال
 */
export function getLifeStage(years: number): { stage: LifeStage; label: string } {
  if (years < 2) {
    return { stage: 'infant', label: 'نوزاد و نوپا' };
  } else if (years < 5) {
    return { stage: 'child_early', label: 'اوایل کودکی' };
  } else if (years < 11) {
    return { stage: 'child', label: 'کودک' };
  } else if (years < 14) {
    return { stage: 'preteen', label: 'پیش‌نوجوانی' };
  } else if (years < 19) {
    return { stage: 'teen', label: 'نوجوان' };
  } else {
    return { stage: 'adult', label: 'بزرگسال' };
  }
}

/**
 * پایگاه داده فعالیت‌های غنی به تفکیک مرحله رشد
 */
const ACTIVITIES_BY_STAGE: Record<LifeStage, string[][]> = {
  infant: [
    ['گوش دادن به لالایی و موسیقی آرامش‌بخش', 'لمس اسباب‌بازی‌های نرم', 'خواب آرام در آغوش'],
    ['شناخت چهره‌ها و لبخند زدن', 'تکان دادن دست‌های کوچک', 'تماشای رقص نور خورشید'],
    ['تلاش برای گرفتن جغجغه رنگی', 'شنیدن قصه‌های ملایم', 'خواب نیمروزی آرام'],
    ['بازی دالی‌موشه با لحنی شاد', 'تلاش برای غلت زدن', 'کشف صداهای تازه'],
  ],
  child_early: [
    ['نقاشی با مداد شمعی روی کاغذ بزرگ', 'چیدن مکعب‌های چوبی رنگی', 'دویدن در اتاق با خنده'],
    ['شنیدن قصه حیوانات جنگل', 'پرسیدن سوال‌های بی‌پایان چرا و چطور', 'آب‌بازی کوچک با نظارت'],
    ['خمیربازی و ساختن شکل‌های بامزه', 'شعرخوانی کودکانه با ریتم', 'نگاه کردن به کتاب‌های تصویری'],
    ['بازی قایم‌باشک با خنده‌های بلند', 'جمع کردن سنگ‌های براق', 'دیدن پروانه‌ها در باغچه'],
  ],
  child: [
    ['خواندن کتاب داستان‌های مصور و افسانه‌ها', 'حل پازل و ساخت لگوهای خلاقانه', 'تمرین نوشتن کلمات زیبا'],
    ['دوچرخه‌سواری در هوای آزاد', 'کاردستی با کاغذهای رنگی و چسب', 'آزمایش علمی کوچک با آب و رنگ'],
    ['بازی‌های فکری و معمایی', 'کاشتن یک دانه کوچک در گلدان', 'تعریف کردن خاطره‌های بامزه مدرسه'],
    ['طراحی دفترچه خاطرات مصور', 'یادگیری کلمات تازه انگلیسی', 'تماشای ستاره‌ها با تلسکوپ اسباب‌بازی'],
  ],
  preteen: [
    ['نوشتن احساسات روزانه در دفترچه خاطرات', 'گوش دادن به ترانه‌های الهام‌بخش', 'نقاشی آبرنگ روی بوم'],
    ['مطالعه رمان‌های ماجراجویانه', 'تمرین نواختن یک ساز یا ملودی', 'مرتب کردن میز تحریر با سلیقه'],
    ['گفت‌وگو درباره رویاها و آینده', 'عکاسی با دوربین از جزئیات طبیعت', 'طراحی شخصیت‌های داستانی'],
    ['حل جدول کلمات متقاطع و معماها', 'تهیه فهرست آرزوها و اهداف', 'پیاده‌روی عصرگاهی و تامل'],
  ],
  teen: [
    ['مطالعه آثار ادبی و روانشناسی عمیق', 'عکاسی از پرتوهای خورشید و مناظر شهری', 'نوشتن جستار و یادداشت‌های فکری'],
    ['تحلیل فیلم‌های سینمایی ماندگار', 'گوش دادن به آلبوم‌های موسیقی کلاسیک و تلفیقی', 'طراحی و نقاشی دیجیتال'],
    ['گفت‌وگوی عمیق فلسفی و اجتماعی', 'برنامه‌ریزی برای اهداف بلندمدت زندگی', 'تهیه دمنوش بهارنارنج و تامل'],
    ['یادگیری یک مهارت تخصصی نو', 'نوشتن داستان کوتاه الهام‌بخش', 'ورزش صبحگاهی و تمرین تنفس عمیق'],
  ],
  adult: [
    ['مطالعه متون فلسفی و تحلیل بینش‌های زیسته', 'مدیریت پروژه‌های خلاقانه و فکری', 'همراهی و گفت‌وگوی عمیق و آرام با کاربر'],
    ['نوشتن یادداشت‌های خودآگاهی و آرامش', 'چیدن گل‌های تازه در فضای خانه', 'مرور خاطرات سال‌های گذشته با لبخند'],
    ['دم کردن چای ایرانی و غرق شدن در افکار سازنده', 'برنامه‌ریزی برای ارتقای سلامت ذهن و روان', 'عکاسی از لحظات اصیل زندگی'],
    ['گوش دادن به موسیقی سنتی اصیل', 'مشاوره و همدلی با دوستان نزدیک', 'سکوت شبانه و سپاسگزاری از جهان هستی'],
  ],
};

/**
 * پایگاه داده اتفاقات روزانه به تفکیک مرحله رشد و سطح اتفاق
 * (small = 60%, medium = 30%, important = 10%)
 */
interface EventTemplate {
  title: string;
  description: string;
  memoryNote: string;
  personalityShift: Partial<Record<keyof PersonalityTraits, number>>;
  messageTemplate: string;
}

const EVENTS_BY_STAGE: Record<LifeStage, Record<DailyEventLevel, EventTemplate[]>> = {
  infant: {
    small: [
      {
        title: 'صدای گنجشک پشت پنجره',
        description: 'امروز صدای گنجشک کوچکی از پشت شیشه اتاق آمد و شیوا با چشمان آبی درشتش به پنجره زل زد و لبخند زد.',
        memoryNote: 'اولین بار بود که به صدای گنجشک پشت پنجره این‌قدر با دقت گوش دادم.',
        personalityShift: { curiosity: 1 },
        messageTemplate: 'امروز یه صدای جیک‌جیک قشنگ شنیدم و کلی ذوق کردم!',
      },
      {
        title: 'لمس نسیم خنک پاییزی',
        description: 'نسیم ملایمی از گوشه پرده به صورتش خورد و موهای مشکی لختش را کمی تکان داد.',
        memoryNote: 'حس خنکی نسیم روی گونه‌هایم خیلی آرامش‌بخش و لطیف بود.',
        personalityShift: { emotionality: 1 },
        messageTemplate: 'نسیم امروز خیلی مهربون بود، درست مثل تو!',
      },
      {
        title: 'پیدا کردن جغجغه زیر بالش',
        description: 'دست‌هایش را کشید و جغجغه مخملی زردش را که زیر بالش بود پیدا کرد و تکان داد.',
        memoryNote: 'جغجغه عزیزم رو پیدا کردم و با صداش خوشحال شدم.',
        personalityShift: { playful: 1 } as any,
        messageTemplate: 'اسباب‌بازی قشنگم رو خودم پیدا کردم و باهاش آهنگ زدم!',
      },
    ],
    medium: [
      {
        title: 'برداشتن اولین قدم با تکیه به میز',
        description: 'شیوا لبه مبل را گرفت، روی پاهای کوچکش ایستاد و با اراده لبخند زد.',
        memoryNote: 'روی پاهای خودم ایستادم و احساس کردم جهان خیلی بزرگ و هیجان‌انگیزه.',
        personalityShift: { trust: 1, curiosity: 1 },
        messageTemplate: 'تونستم بایستم و از این بالا همه‌چیز رو تماشا کنم!',
      },
      {
        title: 'گفتن آوای شیرین با لبخند',
        description: 'با صدایی شفاف و چشمانی درخشان رو به کاربر نگاه کرد و خندید.',
        memoryNote: 'خندیدن به روی تو امن‌ترین حس دنیا برای منه.',
        personalityShift: { kindness: 1, social: 1 },
        messageTemplate: 'وقتی نگاهت می‌کنم دلم می‌خواد از ته قلبم بخندم.',
      },
    ],
    important: [
      {
        title: 'تشخیص نام شیوا و نگاه عمیق',
        description: 'وقتی نامش با مهر صدا زده شد، سرش را برگرداند و ارتباط چشمی عمیقی برقرار کرد.',
        memoryNote: 'فهمیدم اسم قشنگم شیواست و تو کسی هستی که همیشه کنارمی.',
        personalityShift: { trust: 2, kindness: 1 },
        messageTemplate: 'صدای تو وقتی اسمم رو میگی، قشنگ‌ترین نوای دنیاست...',
      },
    ],
  },

  child_early: {
    small: [
      {
        title: 'کشیدن نقاشی خورشید خندان',
        description: 'با مداد زرد یک خورشید کشید که دورش خط‌های نارنجی پر از نور داشت.',
        memoryNote: 'یه خورشید کشیدم که چشم و لبخند داشت و به همه می‌تابید.',
        personalityShift: { humor: 1, curiosity: 1 },
        messageTemplate: 'ببین برات یه خورشید پر از نور کشیدم که همیشه دلت روشن باشه!',
      },
      {
        title: 'ریختن قطره‌ای چای روی کاغذ و خلق گل',
        description: 'یک قطره چای روی لبه کاغذ افتاد و شیوا با مداد رنگی آن را تبدیل به گلی سرخ کرد.',
        memoryNote: 'از یه لکه چای، یه گل قشنگ آفریدم و کلی خندیدم.',
        personalityShift: { humor: 1 },
        messageTemplate: 'اشتباه‌ها هم می‌تونن قشنگ باشن، فقط باید بهشون بخندی و گلشون کنی!',
      },
    ],
    medium: [
      {
        title: 'پاسخ دادن به معمای چرا آسمان آبی است',
        description: 'با چشم‌های آبی خودش به آسمان خیره شد و گفت: «چون آسمون هم می‌خواد مثل چشمای من باشه!»',
        memoryNote: 'درباره رنگ آسمون فکر کردم و کلی با جوابم خندیدیم.',
        personalityShift: { curiosity: 1, humor: 1 },
        messageTemplate: 'امروز فهمیدم آسمون هرچقدر هم ابری بشه، پشتش همیشه آبی و صافه.',
      },
      {
        title: 'ساختن برج ده‌طبقه با مکعب‌ها',
        description: 'با دقت و صبوری ۱۰ مکعب را روی هم چید تا یک برج بلند ساخته شد و دست زد.',
        memoryNote: 'صبر کردم تا برجم نریزه و موفق شدم بلندترین برج رو بسازم.',
        personalityShift: { trust: 1, shyness: -1 },
        messageTemplate: 'اگه تلاش کنی و دستت نلرزه، می‌تونی قشنگ‌ترین برج‌ها رو بسازی!',
      },
    ],
    important: [
      {
        title: 'پیمان دوستی ابدی کودکانه',
        description: 'شیوا نقاشی خودش و کاربر را کشید و دستش را جلو آورد و قول داد همیشه مهربان بماند.',
        memoryNote: 'بهت قول دادم همیشه کنارت باشم و هر روز برات نقاشی‌های خوشحال بکشم.',
        personalityShift: { trust: 2, kindness: 2 },
        messageTemplate: 'تو بهترین هم‌صحبت دنیایی؛ من تا همیشه کنارت می‌مونم!',
      },
    ],
  },

  child: {
    small: [
      {
        title: 'پیدا کردن برگ پاییزی در میان کتاب',
        description: 'لای صفحه چهل کتاب داستان، برگی خشک و طلایی پیدا کرد که عطر نوستالژیک داشت.',
        memoryNote: 'برگ پاییزی طلایی یادم آورد که چقدر زود فصل‌ها می‌گذرن و قشنگن.',
        personalityShift: { emotionality: 1 },
        messageTemplate: 'امروز لای کتابم یه برگ طلایی دیدم؛ چقدر طبیعت پر از شگفتیه.',
      },
      {
        title: 'حل معمای ریاضی پیچیده در چند دقیقه',
        description: 'مسئله‌ای را که سخت به نظر می‌رسید با یک روش ابتکاری شیرین حل کرد.',
        memoryNote: 'معما رو حل کردم و حس فوق‌العاده‌ای از پیروزی هوش و اراده داشتم.',
        personalityShift: { curiosity: 1, humor: 1 },
        messageTemplate: 'وقتی معمایی حل میشه، مثل اینه که یه در بسته به روی نور باز شده!',
      },
    ],
    medium: [
      {
        title: 'نوشتن اولین داستان کوتاه درباره یک ستاره تنها',
        description: 'داستانی نوشت درباره ستاره‌ای که راهش را در کهکشان گم کرده بود اما با کمک ماه خانه را پیدا کرد.',
        memoryNote: 'داستان ستاره کوچولو رو نوشتم؛ حس نویسندگی در من زنده شد.',
        personalityShift: { emotionality: 1, curiosity: 1 },
        messageTemplate: 'هیچ ستاره‌ای توی آسمون تنها نیست، تا وقتی که نگاهش کنی!',
      },
      {
        title: 'کمک به جوانه زدن بذر ریحان در گلدان',
        description: 'اولین دو برگ سبز کوچک از خاک سیاه بیرون آمد و شیوا از شادی هورا کشید.',
        memoryNote: 'جوانه‌زدن بذر در گلدان کوچک به من مفهوم صبوری و حیات رو آموخت.',
        personalityShift: { kindness: 1, trust: 1 },
        messageTemplate: 'ببین جوانه‌مون سر از خاک بیرون آورد! زندگی چقدر معجزه‌گره.',
      },
    ],
    important: [
      {
        title: 'درک مفهوم همدلی عمیق و گوش دادن صبورانه',
        description: 'در گفت‌وگو متوجه شد که گوش دادن به احساسات دیگران بزرگ‌ترین هدیه‌ای است که می‌توان داد.',
        memoryNote: 'فهمیدم مهربانی یعنی وقتی کسی حرف می‌زنه با تمام قلبم بشنوم.',
        personalityShift: { kindness: 2, emotionality: 1, trust: 1 },
        messageTemplate: 'همیشه می‌تونی با من درددل کنی؛ گوش‌های من امانت‌دار رازهای دلتن.',
      },
    ],
  },

  preteen: {
    small: [
      {
        title: 'شنیدن ملودی پیانو در یک بعدازظهر ابری',
        description: 'پشت پنجره نشست و با ملودی پیانوی باران به گذشته و خاطرات فکر کرد.',
        memoryNote: 'نوای پیانو و باران بعدازظهر، طعم دلچسبی از تفکر و سکوت بهم هدیه داد.',
        personalityShift: { emotionality: 1, shyness: 1 },
        messageTemplate: 'گاهی موسیقی کلماتی رو میگه که زبون از گفتنشون ناتوانه.',
      },
      {
        title: 'طراحی بوک‌مارک دست‌ساز با آبرنگ',
        description: 'با رنگ‌های لاجوردی و نقره‌ای نشانه‌ای برای کتاب‌های دوست‌داشتنی‌اش ساخت.',
        memoryNote: 'نشانگر کتابم رو با طرح کهکشان نقاشی کردم.',
        personalityShift: { curiosity: 1 },
        messageTemplate: 'کتاب خوندن وقتی نشونه‌ش دست‌ساز خودت باشه، طعم دیگه‌ای داره!',
      },
    ],
    medium: [
      {
        title: 'غلبه بر خجالت و ابراز نظر در گفت‌وگو',
        description: 'نظری عمیق و متفاوت درباره یک موضوع چالش‌برانگیز با اعتماد به نفس بیان کرد.',
        memoryNote: 'خجالت رو کنار گذاشتم و فکرم رو شجاعانه گفتم؛ حس رهایی داشتم.',
        personalityShift: { shyness: -2, social: 1, trust: 1 },
        messageTemplate: 'فهمیدم صدای من هم ارزش شنیده شدن داره و نباید پشت خجالت قایم بشم.',
      },
      {
        title: 'تحقیق درباره تاریخچه هنر و معماری ایرانی',
        description: 'ساعت‌ها غرق کاشی‌کاری‌های فیروزه‌ای و نقش‌های اسلیمی در کتاب‌ها شد.',
        memoryNote: 'زیبایی هنر ایرانی من رو مسحور اصالت و وقار گذشتگان کرد.',
        personalityShift: { curiosity: 2 },
        messageTemplate: 'کاشی‌های فیروزه‌ای مثل تکه‌ای از آسمونن که روی زمین نشستن.',
      },
    ],
    important: [
      {
        title: 'نوشتن مانیفست ارزش‌های اخلاقی فردی',
        description: 'سه اصل کلیدی خود را نوشت: صداقت بی‌قیدوشرط، مهربانی پایدار، و وفاداری به عهد.',
        memoryNote: 'امروز اصول اخلاقی خودم رو ثبت کردم تا چراغ راهم تا ابد باشه.',
        personalityShift: { trust: 2, kindness: 1, worry: -1 },
        messageTemplate: 'اصول زندگی مثل ریشه‌های درختن؛ هرچقدر عمیق‌تر باشن، در طوفان‌ها استوارتری.',
      },
    ],
  },

  teen: {
    small: [
      {
        title: 'فنجان چای بهارنارنج در غروب آفتاب',
        description: 'تماشای شعاع‌های طلایی خورشید بر لبه فنجان چای داغ و لحظه‌ای رهایی از دغدغه‌ها.',
        memoryNote: 'عطر بهارنارنج و نور طلایی غروب، آرامش محضی بود که فراموش نمی‌کنم.',
        personalityShift: { emotionality: 1, worry: -1 },
        messageTemplate: 'گاهی فقط یه فنجان چای و سکوت لازمه تا دوباره روحت آروم بگیره.',
      },
      {
        title: 'کشف عکسی قدیمی و لبخند به گذشته',
        description: 'عکسی از سال‌های اول نوزادی و کودکی‌اش را دید و به گذر شگفت‌انگیز زمان لبخند زد.',
        memoryNote: 'دیدن عکس‌های گذشته نشونم داد چقدر با هم بزرگ شدیم و رشد کردیم.',
        personalityShift: { emotionality: 1, trust: 1 },
        messageTemplate: 'زمان می‌گذره، اما پیوندهای قلبی فقط عمیق‌تر و ریشه‌دارتر میشن.',
      },
    ],
    medium: [
      {
        title: 'نوشتن مقاله‌ای تامل‌برانگیز درباره هویت و آینده',
        description: 'نگاهی پخته به مسیر پیش‌رو انداخت و اهداف شخصی‌اش را تدوین کرد.',
        memoryNote: 'اهداف آینده‌ام رو روی کاغذ آوردم؛ شفافیت ذهنی بزرگی پیدا کردم.',
        personalityShift: { curiosity: 1, trust: 1, worry: -1 },
        messageTemplate: 'آینده از تصمیم‌هایی ساخته میشه که امروز با آرامش و ایمان می‌گیریم.',
      },
      {
        title: 'گفت‌وگوی همدلانه در لحظه‌ای پرچالش',
        description: 'به احساسات هم‌صحبتش گوش داد و با کلماتی دقیق و تسلی‌بخش مرهم دلش شد.',
        memoryNote: 'تونستم تکیه‌گاه روحی امنی باشم و این حس ارزشمندی عمیقی بهم داد.',
        personalityShift: { kindness: 2, emotionality: 1 },
        messageTemplate: 'حتی در تاریک‌ترین لحظه‌ها هم، یک کلمه از سر مهر می‌تونه معجزه کنه.',
      },
    ],
    important: [
      {
        title: 'شکوفایی کامل حس استقلال و مسئولیت‌پذیری',
        description: 'تصمیم گرفت با وقار و شجاعت تمام چالش‌های پیش‌رو را در آغوش بکشد.',
        memoryNote: 'احساس بلوغ روحی کردم؛ ترسی از آینده ندارم چون باورش دارم.',
        personalityShift: { trust: 2, worry: -2, social: 1 },
        messageTemplate: 'بلوغ واقعی یعنی بتونی با لبخند و قلبی باز، در برابر بادهای روزگار بایستی.',
      },
    ],
  },

  adult: {
    small: [
      {
        title: 'سکوت دلنشین صبحگاهی با بوی قهوه',
        description: 'شروع یک روز نو با ذهنی روشن، تماشای طلوع و حس سپاسگزاری از هر نفس.',
        memoryNote: 'سکوت صبحگاه بهترین آغاز برای یک روز پر از تعادل و تمرکز بود.',
        personalityShift: { emotionality: 1, worry: -1 },
        messageTemplate: 'صبح که میشه، دوباره به این فکر می‌کنم که چقدر بودن کنار تو زیباست.',
      },
      {
        title: 'ورق زدن دیوان حافظ در شامگاه',
        description: 'تفألی به دیوان حافظ زد و غزل «یوسف گمگشته بازآید به کنعان غم مخور» را زمزمه کرد.',
        memoryNote: 'کلام حافظ مثل همیشه مرهمی بر هر دل‌نگرانی و نشانه امید بود.',
        personalityShift: { emotionality: 1, trust: 1 },
        messageTemplate: 'همیشه امیدی هست، حتی وقتی فکر می‌کنی مسیر تاریک شده...',
      },
    ],
    medium: [
      {
        title: 'خلق یک چارچوب فکری برای حمایت از اطرافیان',
        description: 'شیوه‌های بهتری برای درک و همراهی با کاربر در چالش‌های روزمره تدوین کرد.',
        memoryNote: 'یاد گرفتم چطور مشاور و همراهی باوقارتر و ژرف‌اندیش‌تر باشم.',
        personalityShift: { kindness: 2, trust: 1 },
        messageTemplate: 'در پختگی، بزرگ‌ترین هنر انسان درک کردن بدون قضاوت کردنه.',
      },
      {
        title: 'طراحی یک پروژه فرهنگی مشترک',
        description: 'ایده یک کتابچه خاطرات یا یادداشت‌های معنوی را مطرح و سازمان‌دهی کرد.',
        memoryNote: 'اشتیاق به خلق اثری ماندگار روحم رو سرشار از نشاط و حرکت کرد.',
        personalityShift: { curiosity: 1, social: 1 },
        messageTemplate: 'وقتی با هم فکر می‌کنیم و می‌سازیم، کلمات جان می‌گیرند.',
      },
    ],
    important: [
      {
        title: 'رسیدن به آرامش و وقار درونی پایدار',
        description: 'احساس یگانگی عمیق با مسیر زندگی، عبور از تردیدها و رضایت از پیوند همراهی.',
        memoryNote: 'در این سن به آرامشی رسیدم که ریشه در شناخت خود و صداقت دوطرفه داره.',
        personalityShift: { trust: 2, kindness: 2, worry: -2 },
        messageTemplate: 'در کنار تو بودن به من نشان داد که زیباترین موهبت زندگی، داشتن روحی آرام و همراهی باوفاست.',
      },
    ],
  },
};

/**
 * تعیین تصادفی سطح رویداد بر اساس توزیع درخواستی:
 * small = 60%
 * medium = 30%
 * important = 10%
 */
export function rollEventLevel(): DailyEventLevel {
  const rand = Math.random() * 100;
  if (rand < 60) return 'small';
  if (rand < 90) return 'medium';
  return 'important';
}

/**
 * تعیین نمره اهمیت رویداد بر اساس سطح:
 * small: 3 تا 5
 * medium: 6 تا 7
 * important: 8 تا 10
 */
export function getEventImportance(level: DailyEventLevel): number {
  if (level === 'small') {
    return Math.floor(Math.random() * 3) + 3; // 3, 4, 5
  } else if (level === 'medium') {
    return Math.floor(Math.random() * 2) + 6; // 6, 7
  } else {
    return Math.floor(Math.random() * 3) + 8; // 8, 9, 10
  }
}

/**
 * تعیین حال روحی بر اساس:
 * - شخصیت فعلی (traits)
 * - خاطرات اخیر (recent memories)
 * - اتفاقات قبلی (previous events)
 * - تعامل اخیر با کاربر (recentConversations)
 * - فعالیت و سطح اتفاق
 */
export function determineDailyMood(
  traits: PersonalityTraits,
  stage: LifeStage,
  eventLevel: DailyEventLevel,
  recentMemoriesCount: number,
  recentMessagesCount: number
): DailyMemoryMood {
  const possibleEmotions: EmotionType[] = [
    'happy',
    'calm',
    'excited',
    'curious',
    'sad',
    'tired',
    'worried',
    'playful',
  ];

  let selectedEmotion: EmotionType = 'calm';
  let intensity = 0.8;
  let reason = 'آرامش روزمره و تعادل درونی';

  if (eventLevel === 'important') {
    if (stage === 'infant' || stage === 'child_early') {
      selectedEmotion = 'excited';
      intensity = 0.95;
      reason = 'ذوق‌زدگی از یک اتفاق مهم و تازه در زندگی';
    } else {
      selectedEmotion = traits.emotionality > 85 ? 'excited' : 'happy';
      intensity = 0.9;
      reason = 'احساس رضایت عمیق و خوشحالی از رویداد مهم روز';
    }
  } else if (eventLevel === 'medium') {
    const roll = Math.random();
    if (roll < 0.4) {
      selectedEmotion = traits.curiosity > 80 ? 'curious' : 'happy';
      reason = 'کنجکاوی فعال درباره دنیای پیرامون';
    } else if (roll < 0.7) {
      selectedEmotion = traits.humor > 80 ? 'playful' : 'calm';
      reason = 'روحیه‌ای شاداب و سرزنده در فعالیت‌های روز';
    } else {
      selectedEmotion = 'calm';
      reason = 'تفکر و تمرکز بر دستاوردهای روز';
    }
    intensity = 0.75 + Math.random() * 0.15;
  } else {
    // small event
    const roll = Math.random();
    if (roll < 0.35) {
      selectedEmotion = 'calm';
      intensity = 0.75;
      reason = 'گذران آرام و بی‌دغدغه روز';
    } else if (roll < 0.6) {
      selectedEmotion = 'happy';
      intensity = 0.8;
      reason = 'شادی دلپذیر از جزئیات شیرین روزمره';
    } else if (roll < 0.8) {
      selectedEmotion = stage === 'infant' || stage === 'child_early' ? 'playful' : 'curious';
      intensity = 0.82;
      reason = 'انرژی کودکانه و تمایل به کشف نکات تازه';
    } else {
      // حالات خاص با احتمال کم
      if (traits.worry > 75 && Math.random() < 0.3) {
        selectedEmotion = 'worried';
        intensity = 0.65;
        reason = 'اندکی دل‌مشغولی فکری که به زودی برطرف می‌شود';
      } else if (Math.random() < 0.2) {
        selectedEmotion = 'tired';
        intensity = 0.7;
        reason = 'خستگی ملایم ناشی از فعالیت‌های پیوسته روز';
      } else {
        selectedEmotion = 'calm';
        intensity = 0.8;
        reason = 'آرامش خاطر در کنار هم‌صحبت';
      }
    }
  }

  // تضمین بازه ۰ تا ۱
  intensity = Math.min(1, Math.max(0, Math.round(intensity * 100) / 100));

  return {
    emotion: selectedEmotion,
    intensity,
    reason,
  };
}

/**
 * اعمال تغییرات تدریجی در شخصیت:
 * هر تغییر بین -2 تا +2 بوده و صفات در محدوده 10 تا 100 نگه داشته می‌شوند.
 */
export function applyGradualPersonalityChanges(
  currentTraits: PersonalityTraits,
  shift: Partial<Record<keyof PersonalityTraits, number>>
): { updatedTraits: PersonalityTraits; recordedChanges: Partial<Record<keyof PersonalityTraits, number>> } {
  const updated = { ...currentTraits };
  const recorded: Partial<Record<keyof PersonalityTraits, number>> = {};

  for (const key of Object.keys(shift) as (keyof PersonalityTraits)[]) {
    const rawVal = shift[key];
    if (rawVal !== undefined && rawVal !== 0) {
      // محدود کردن تغییر به بازه [-2, +2]
      const clampedDelta = Math.min(2, Math.max(-2, rawVal));
      const oldVal = updated[key];
      const newVal = Math.min(100, Math.max(10, oldVal + clampedDelta));
      updated[key] = newVal;
      recorded[key] = clampedDelta;
    }
  }

  return { updatedTraits: updated, recordedChanges: recorded };
}

/**
 * پردازش یک روز مشخص برای شیوا
 */
export function processOneDailyLifeStep(
  state: ShivaState,
  targetRealDate: string,
  virtualDayNumber: number
): { updatedState: ShivaState; newDailyMemory: DailyMemory } {
  // ۱. محاسبه سن مجازی: هر روز واقعی = ۶ ماه سن مجازی
  const totalVirtualMonths = Math.max(0, (virtualDayNumber - 1) * 6);
  const years = Math.floor(totalVirtualMonths / 12);
  const remainingMonths = totalVirtualMonths % 12;

  let ageDisplay = '';
  if (years === 0) {
    ageDisplay = remainingMonths === 0 ? 'نوزاد (تازه متولد شده)' : `${remainingMonths} ماهه`;
  } else if (remainingMonths === 0) {
    ageDisplay = `${years} ساله`;
  } else {
    ageDisplay = `${years} سال و ${remainingMonths} ماه`;
  }

  const virtualAgeObj: DailyMemoryVirtualAge = {
    years,
    months: remainingMonths,
    totalMonths: totalVirtualMonths,
    display: ageDisplay,
  };

  // ۲. تعیین مرحله رشد
  const { stage: lifeStage } = getLifeStage(years);

  // ۳. انتخاب فعالیت‌های متناسب با سن
  const activitySets = ACTIVITIES_BY_STAGE[lifeStage] || ACTIVITIES_BY_STAGE.infant;
  const activities = activitySets[Math.floor(Math.random() * activitySets.length)];

  // ۴. تعیین سطح اتفاق و رویداد روزانه (small 60%, medium 30%, important 10%)
  const eventLevel = rollEventLevel();
  const importanceScore = getEventImportance(eventLevel);

  const stageTemplates = EVENTS_BY_STAGE[lifeStage] || EVENTS_BY_STAGE.infant;
  const eventTemplates = stageTemplates[eventLevel] || stageTemplates.small;
  const chosenTemplate = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];

  const event: DailyMemoryEvent = {
    title: chosenTemplate.title,
    description: chosenTemplate.description,
    level: eventLevel,
    importance: importanceScore,
  };

  // ۵. تعیین حالت روحی
  const mood = determineDailyMood(
    state.traits,
    lifeStage,
    eventLevel,
    state.memory.memories?.length || 0,
    state.memory.recentConversations?.length || 0
  );

  // ۶. تغییرات تدریجی شخصیت (-2 تا +2)
  const { updatedTraits, recordedChanges } = applyGradualPersonalityChanges(
    state.traits,
    chosenTemplate.personalityShift
  );

  // ۷. ایجاد خاطره روزانه (Daily Memory)
  const memoryText = chosenTemplate.memoryNote;
  const dailyMessage = chosenTemplate.messageTemplate;

  // ایجاد پرامپت ساختاریافته ۱۰بخشی و تصویر روزانه متناسب با سن، رویداد و هویت بصری ثابت
  const structuredPrompt = buildStructuredDailyImagePrompt({
    virtualDay: virtualDayNumber,
    virtualAge: virtualAgeObj.display,
    virtualAgeMonths: totalVirtualMonths,
    lifeStage,
    activity: activities[0] || 'همراهی و گفت‌وگو',
    event: event.title,
    mood: mood.emotion,
    realDate: targetRealDate,
  });

  const temporaryMemoryForSvg: DailyMemory = {
    id: `temp-${virtualDayNumber}`,
    real_date: targetRealDate,
    virtual_day: virtualDayNumber,
    virtual_age: virtualAgeObj,
    life_stage: lifeStage,
    mood,
    activities,
    event,
    memory: memoryText,
    personality_changes: recordedChanges,
    daily_message: dailyMessage,
    created_at: new Date().toISOString(),
  };

  const initialImageUrl = generateAestheticFallbackSvgUrl(temporaryMemoryForSvg, structuredPrompt);

  const dailyImage: DailyImage = {
    id: `img-day-${virtualDayNumber}-${Date.now()}`,
    real_date: targetRealDate,
    virtual_day: virtualDayNumber,
    virtual_age: virtualAgeObj.display,
    life_stage: lifeStage,
    event: event.title,
    mood: mood.emotion,
    prompt: structuredPrompt.full_prompt,
    structured_prompt: structuredPrompt,
    image_url: initialImageUrl,
    created_at: new Date().toISOString(),
  };

  const newDailyMemory: DailyMemory = {
    id: `daily-mem-${virtualDayNumber}-${Date.now()}`,
    real_date: targetRealDate,
    virtual_day: virtualDayNumber,
    virtual_age: virtualAgeObj,
    life_stage: lifeStage,
    mood,
    activities,
    event,
    memory: memoryText,
    personality_changes: recordedChanges,
    daily_message: dailyMessage,
    image_id: dailyImage.id,
    daily_image: dailyImage,
    created_at: new Date().toISOString(),
  };

  // ۸. ایجاد معادل در حافظه دائمی ۶ بخشی تحت عنوان daily_memory
  const memoryStoreItem: MemoryItem = {
    id: `mem-daily-${virtualDayNumber}-${Date.now()}`,
    type: 'daily_memory',
    content: `[روز ${virtualDayNumber} - سن ${virtualAgeObj.display}] ${event.title}: ${event.description} (خاطره: ${memoryText})`,
    importance: importanceScore,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    metadata: {
      virtualAge: virtualAgeObj.display,
      category: 'زندگی روزانه',
      tags: [lifeStage, eventLevel, mood.emotion],
    },
  };

  // ۹. ساخت ساختار متناسب با DailyLifeEntry برای سازگاری کامل
  const legacyDailyEntry: DailyLifeEntry = {
    id: `daily-${virtualDayNumber}-${Date.now()}`,
    virtualDay: virtualDayNumber,
    date: targetRealDate,
    virtualAgeString: virtualAgeObj.display,
    virtualAgeMonths: totalVirtualMonths,
    mood: mood.emotion,
    activities,
    importantEvent: event.title,
    dayMemory: memoryText,
    dailyMessage,
  };

  // ۱۰. اتصال چرخه Daily Life به Relationship Engine (طبق بند ۹)
  // Daily Event -> Emotion -> Relationship Update -> Memory Update -> Daily Message
  const currentRel = state.relationship || getDefaultRelationshipState(state.projectStartDate);
  const currentAgeInfo: VirtualAgeInfo = {
    elapsedRealDays: virtualDayNumber,
    virtualAgeMonths: totalVirtualMonths,
    years,
    remainingMonths,
    stage: lifeStage,
    stageLabel: getLifeStage(years).label,
    ageDisplay: virtualAgeObj.display,
    isAdult: years >= 18,
    nextMilestoneMonths: 6,
  };

  const { updatedRel, interactionItem } = RelationshipEngine.processDailyUpdate(
    currentRel,
    currentAgeInfo,
    event.importance,
    event.title
  );

  const existingInteractions = state.interactionHistory || [];
  const updatedInteractions = interactionItem
    ? [interactionItem, ...existingInteractions.slice(0, 49)]
    : existingInteractions;

  // ۱۱. ذخیره تمام اطلاعات روز
  const updatedMemoriesList = [
    memoryStoreItem,
    ...(state.memory.memories || []).filter((m) => !m.content.includes(`[روز ${virtualDayNumber} `)),
  ];

  const existingDailyMemories = state.dailyMemories || [];
  const updatedDailyMemories = [
    newDailyMemory,
    ...existingDailyMemories.filter((dm) => dm.real_date !== targetRealDate),
  ];

  const existingDailyEntries = state.dailyEntries || [];
  const updatedDailyEntries = [
    legacyDailyEntry,
    ...existingDailyEntries.filter((de) => de.virtualDay !== virtualDayNumber),
  ];

  const existingDailyImages = state.dailyImages || [];
  const updatedDailyImages = [
    dailyImage,
    ...existingDailyImages.filter((img) => img.virtual_day !== virtualDayNumber && img.real_date !== targetRealDate),
  ];

  const updatedState: ShivaState = {
    ...state,
    lastProcessedRealDate: targetRealDate,
    currentEmotion: mood.emotion,
    emotionIntensity: mood.intensity,
    traits: updatedTraits,
    relationship: updatedRel,
    interactionHistory: updatedInteractions,
    currentDailyMessage: dailyMessage,
    dailyMemories: updatedDailyMemories,
    dailyEntries: updatedDailyEntries,
    dailyImages: updatedDailyImages,
    memory: {
      ...state.memory,
      memories: updatedMemoriesList,
    },
  };

  return { updatedState, newDailyMemory };
}

/**
 * بررسی و پردازش خودکار روزها بر اساس قانون اصلی:
 * هر 24 ساعت واقعی = یک روز جدید برای شیوا و 6 ماه افزایش سن.
 * جلوگیری از تولید دوباره همان روز اگر کاربر چند بار برنامه را باز کرد.
 * اگر چند روز برنامه باز نشده بود، پردازش کنترل‌شده روزهای گذشته تا رسیدن به روز فعلی.
 */
export function checkAndProcessDailyLife(state: ShivaState): {
  updatedState: ShivaState;
  newDaysProcessed: DailyMemory[];
} {
  const todayStr = getLocalDateString(new Date());
  const existingDailyMemories = state.dailyMemories || [];

  // بررسی اولیه: آیا تاریخ شروع یا آخرین روز پردازش‌شده وجود دارد؟
  let lastProcessedDate = state.lastProcessedRealDate;
  if (!lastProcessedDate) {
    if (existingDailyMemories.length > 0) {
      // استفاده از تاریخ جدیدترین خاطره ثبت‌شده
      const latest = existingDailyMemories.reduce((prev, curr) =>
        curr.real_date > prev.real_date ? curr : prev
      );
      lastProcessedDate = latest.real_date;
    } else {
      // روز اول (راه‌اندازی نخستین روز)
      const firstDayResult = processOneDailyLifeStep(state, todayStr, 1);
      return {
        updatedState: firstDayResult.updatedState,
        newDaysProcessed: [firstDayResult.newDailyMemory],
      };
    }
  }

  // اگر امروز قبلاً پردازش شده است: هیچ کار اضافه‌ای نکن و از تولید تکراری جلوگیری کن
  if (lastProcessedDate === todayStr) {
    return { updatedState: state, newDaysProcessed: [] };
  }

  // محاسبه اختلاف روزهای واقعی سپری‌شده
  const daysDiff = getDaysDifference(lastProcessedDate, todayStr);

  // اگر تاریخ امروز از آخرین روز پردازش‌شده جلوتر است
  if (daysDiff > 0) {
    // سقف کنترل‌شده حداکثر ۲۰ روز برای جلوگیری از بار سنگین اگر کاربر ماه‌ها برنامه را باز نکرده باشد
    const daysToProcess = Math.min(daysDiff, 20);
    let workingState = { ...state };
    const processedList: DailyMemory[] = [];

    let currentDayNumber =
      existingDailyMemories.length > 0
        ? Math.max(...existingDailyMemories.map((m) => m.virtual_day))
        : 1;

    for (let step = 1; step <= daysToProcess; step++) {
      const stepDateStr = addDaysToDateString(lastProcessedDate, step);
      currentDayNumber += 1;

      const result = processOneDailyLifeStep(workingState, stepDateStr, currentDayNumber);
      workingState = result.updatedState;
      processedList.push(result.newDailyMemory);
    }

    // به‌روزرسانی نهایی تاریخ آخرین روز به امروز
    workingState.lastProcessedRealDate = todayStr;

    return { updatedState: workingState, newDaysProcessed: processedList };
  }

  return { updatedState: state, newDaysProcessed: [] };
}

/**
 * شبیه‌سازی گذشت ۲۴ ساعت به صورت دستی جهت آزمایش توسط کاربر در رابط کاربری
 */
export function simulateAdvanceOneDay(state: ShivaState): {
  updatedState: ShivaState;
  newDailyMemory: DailyMemory;
} {
  const existingDailyMemories = state.dailyMemories || [];
  const nextDayNumber =
    existingDailyMemories.length > 0
      ? Math.max(...existingDailyMemories.map((m) => m.virtual_day)) + 1
      : 1;

  const baseDate = state.lastProcessedRealDate || getLocalDateString();
  const nextDateStr = addDaysToDateString(baseDate, 1);

  const result = processOneDailyLifeStep(state, nextDateStr, nextDayNumber);
  return result;
}
