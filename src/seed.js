'use strict';
/* البيانات الافتراضية لأول تشغيل + صور SVG تجريبية (يستبدلها الأدمن بصوره) */
const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('./db');
const { uid, slugify, escHtml } = require('./util');

const SEED_DIR = path.join(UPLOAD_DIR, 'seed');

const PALETTES = [
  ['#1d2a3a', '#33506e', '#e2b86b'],
  ['#5b1f2a', '#8c2f39', '#f1d3a1'],
  ['#18392b', '#2f6b4f', '#e9d8a6'],
  ['#2b2140', '#5a3f86', '#f3c98b'],
  ['#3a2a1d', '#7a5230', '#f6e2bf'],
  ['#0f3b46', '#1f6f80', '#ffd89b'],
  ['#402218', '#a0522d', '#fbe3c3'],
  ['#1f1f2e', '#46465e', '#d9b56c'],
];

function wrap(text, max) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

function coverSVG(title, author, i) {
  const [a, b, c] = PALETTES[i % PALETTES.length];
  const lines = wrap(title, 11);
  const fs0 = lines.length > 2 ? 92 : 112;
  const startY = 560 - ((lines.length - 1) * fs0 * 1.25) / 2;
  const t = lines
    .map((l, k) => `<text x="400" y="${startY + k * fs0 * 1.25}" font-size="${fs0}" font-weight="700" fill="${c}" text-anchor="middle" direction="rtl">${escHtml(l)}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="800" height="1200">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient>
<pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M30 0 L60 30 L30 60 L0 30Z" fill="none" stroke="${c}" stroke-opacity=".08" stroke-width="2"/></pattern></defs>
<rect width="800" height="1200" fill="url(#g)"/><rect width="800" height="1200" fill="url(#p)"/>
<rect x="0" y="0" width="38" height="1200" fill="#000" fill-opacity=".22"/>
<rect x="70" y="70" width="660" height="1060" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="3"/>
<rect x="88" y="88" width="624" height="1024" fill="none" stroke="${c}" stroke-opacity=".25" stroke-width="1.5"/>
<circle cx="400" cy="260" r="58" fill="none" stroke="${c}" stroke-opacity=".7" stroke-width="3"/>
<path d="M370 262 q30 -34 60 0 q-30 34 -60 0z" fill="${c}" fill-opacity=".8"/>
<g font-family="Amiri, 'Noto Naskh Arabic', 'Times New Roman', serif">${t}
<line x1="300" y1="${startY + lines.length * fs0 * 1.25 + 10}" x2="500" y2="${startY + lines.length * fs0 * 1.25 + 10}" stroke="${c}" stroke-opacity=".6" stroke-width="2"/>
<text x="400" y="1010" font-size="46" fill="${c}" fill-opacity=".9" text-anchor="middle" direction="rtl">${escHtml(author)}</text></g>
</svg>`;
}

function artSVG(w, h, i, bookSide = 'left') {
  const [a, b, c] = PALETTES[i % PALETTES.length];
  const books = [];
  const baseX = bookSide === 'left' ? w * 0.08 : w * 0.55;
  const span = w * 0.37;
  const ground = h * 0.86;
  let x = baseX;
  let k = 0;
  while (x < baseX + span) {
    const bw = Math.max(w * 0.022, 26) + ((k * 37) % 30);
    const bh = h * (0.38 + ((k * 53) % 30) / 100);
    const col = PALETTES[(i + k + 1) % PALETTES.length];
    const tilt = k % 7 === 5 ? -8 : 0;
    books.push(`<g transform="rotate(${tilt} ${x + bw / 2} ${ground})"><rect x="${x}" y="${ground - bh}" width="${bw}" height="${bh}" rx="4" fill="${col[1]}"/><rect x="${x}" y="${ground - bh * 0.82}" width="${bw}" height="${bh * 0.05}" fill="${col[2]}" fill-opacity=".8"/><rect x="${x}" y="${ground - bh * 0.22}" width="${bw}" height="${bh * 0.03}" fill="${col[2]}" fill-opacity=".6"/></g>`);
    x += bw + 6;
    k++;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">
<defs><radialGradient id="r" cx="${bookSide === 'left' ? '25%' : '75%'}" cy="40%" r="80%"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs>
<rect width="${w}" height="${h}" fill="url(#r)"/>
<g fill="${c}" fill-opacity=".07">${Array.from({ length: 18 }, (_, n) => `<circle cx="${(n * 137) % w}" cy="${(n * 89) % h}" r="${20 + ((n * 31) % 90)}"/>`).join('')}</g>
<circle cx="${bookSide === 'left' ? w * 0.27 : w * 0.73}" cy="${h * 0.42}" r="${h * 0.36}" fill="${c}" fill-opacity=".08"/>
${books.join('')}
<rect x="${baseX - 30}" y="${ground}" width="${span + 60}" height="${h * 0.02}" rx="6" fill="${c}" fill-opacity=".5"/>
</svg>`;
}

function catSVG(i) {
  const [a, b, c] = PALETTES[i % PALETTES.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient></defs>
<rect width="600" height="600" fill="url(#g)"/>
<g transform="translate(300 310)"><path d="M-170 -110 q85 -40 170 0 v230 q-85 -40 -170 0z" fill="${c}" fill-opacity=".9"/><path d="M170 -110 q-85 -40 -170 0 v230 q85 -40 170 0z" fill="${c}" fill-opacity=".65"/>
<path d="M0 -110 v230" stroke="${a}" stroke-width="6"/></g>
<circle cx="480" cy="120" r="60" fill="${c}" fill-opacity=".12"/><circle cx="110" cy="500" r="90" fill="${c}" fill-opacity=".08"/>
</svg>`;
}

function writeSeed(name, svg) {
  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.writeFileSync(path.join(SEED_DIR, name), svg);
  return `/uploads/seed/${name}`;
}

const GOVERNORATES = [
  ['القاهرة', 50, '1-2'], ['الجيزة', 50, '1-2'], ['الإسكندرية', 60, '2-3'], ['القليوبية', 55, '1-3'],
  ['الشرقية', 65, '2-3'], ['الدقهلية', 65, '2-3'], ['الغربية', 65, '2-3'], ['المنوفية', 65, '2-3'],
  ['البحيرة', 65, '2-3'], ['كفر الشيخ', 70, '2-4'], ['دمياط', 70, '2-4'], ['بورسعيد', 70, '2-4'],
  ['الإسماعيلية', 70, '2-4'], ['السويس', 70, '2-4'], ['الفيوم', 70, '2-4'], ['بني سويف', 75, '2-4'],
  ['المنيا', 80, '3-5'], ['أسيوط', 80, '3-5'], ['سوهاج', 85, '3-5'], ['قنا', 85, '3-5'],
  ['الأقصر', 90, '3-5'], ['أسوان', 90, '3-5'], ['البحر الأحمر', 100, '4-6'], ['مطروح', 100, '4-6'],
  ['الوادي الجديد', 110, '4-7'], ['شمال سيناء', 110, '4-7'], ['جنوب سيناء', 110, '4-7'],
];

const CATS = [
  ['روايات', 'عوالم وحكايات تأخذك بعيداً'],
  ['تنمية ذاتية', 'كتب تغيّر طريقة تفكيرك'],
  ['كتب دينية', 'زاد الروح والمعرفة'],
  ['تاريخ وحضارة', 'رحلة عبر الأزمنة'],
  ['كتب الأطفال', 'قصص ملونة لعقول صغيرة'],
  ['فلسفة وفكر', 'أسئلة كبرى وإجابات عميقة'],
];

const BOOKS = [
  ['ظلال المدينة القديمة', 'سليم الحكيم', 0, 180, 230, 'رواية آسرة عن حارة قديمة وأسرارها التي تتكشف جيلاً بعد جيل، بلغة شاعرية وحبكة مشوقة لا تُترك.'],
  ['رسائل لم تصل', 'نور الهدى عادل', 0, 150, 0, 'مجموعة رسائل متخيلة بين حبيبين فرّقتهما الحرب، تكشف معنى الانتظار والأمل.'],
  ['بيت على حافة البحر', 'كريم منصور', 0, 210, 260, 'حكاية عائلة تعود إلى بيت جدّها على البحر لتواجه ماضياً ظنّت أنه انتهى.'],
  ['عادات صغيرة نتائج كبيرة', 'د. أحمد فؤاد', 1, 165, 199, 'دليل عملي لبناء عادات يومية بسيطة تصنع فرقاً حقيقياً في حياتك وإنتاجيتك.'],
  ['فن إدارة الوقت', 'منى سالم', 1, 140, 0, 'خطوات واضحة لتنظيم يومك، والتخلص من التسويف، وإنجاز ما يهمك فعلاً.'],
  ['ثق بنفسك', 'د. هالة رشدي', 1, 120, 150, 'كيف تبني ثقتك بنفسك خطوة بخطوة وتتحرر من الخوف من آراء الآخرين.'],
  ['رياض القلوب', 'الشيخ محمود عبدالله', 2, 130, 0, 'خواطر إيمانية ومواعظ قصيرة تلامس القلب وتعين على الطاعة.'],
  ['قصص الأنبياء للناشئة', 'فاطمة الزهراء', 2, 175, 210, 'قصص الأنبياء بأسلوب سهل ومشوق يناسب الأسرة كلها.'],
  ['مصر عبر العصور', 'د. عمرو الشافعي', 3, 250, 300, 'رحلة ممتعة في تاريخ مصر من الفراعنة حتى العصر الحديث مع خرائط وصور.'],
  ['حضارات منسية', 'يوسف القاضي', 3, 220, 0, 'اكتشف حضارات عظيمة اندثرت وتركت وراءها ألغازاً ما زالت تحير العلماء.'],
  ['الأرنب الذي أحب القمر', 'سارة يوسف', 4, 90, 120, 'قصة مصورة ملونة عن الأحلام والصداقة للأطفال من 4 إلى 8 سنوات.'],
  ['مغامرات زيد في الفضاء', 'سارة يوسف', 4, 110, 0, 'رحلة خيالية بين الكواكب تعلم الأطفال أسماء الكواكب وحب العلم.'],
  ['أسئلة الوجود', 'د. ليلى مراد', 5, 195, 240, 'مدخل مبسط إلى أهم الأسئلة الفلسفية وكيف أجاب عنها كبار المفكرين.'],
  ['التفكير الناقد', 'حسام الدين علي', 5, 160, 0, 'كيف تفكر بوضوح، وتميز الحجة القوية من المغالطة، وتتخذ قرارات أفضل.'],
];

function buildSeed() {
  const now = Date.now();
  const categories = CATS.map(([name, description], i) => ({
    id: uid(),
    name,
    slug: slugify(name),
    description,
    image: writeSeed(`cat-${i}.svg`, catSVG(i)),
    order: i,
    showInMenu: true,
    active: true,
  }));

  const products = BOOKS.map(([name, author, ci, price, oldPrice, description], i) => ({
    id: uid(),
    name,
    slug: slugify(name),
    author,
    publisher: 'دار النشر',
    pages: 180 + ((i * 37) % 260),
    sku: `BK-${1000 + i}`,
    price,
    oldPrice,
    description,
    images: [writeSeed(`book-${i}.svg`, coverSVG(name, author, i))],
    categoryId: categories[ci].id,
    stock: null,
    featured: i % 3 === 0,
    active: true,
    sold: (i * 7) % 23,
    createdAt: now - i * 86400000,
    landing: {
      enabled: true,
      headline: '',
      subheadline: '',
      bullets: ['طبعة أصلية فاخرة', 'شحن سريع لكل المحافظات', 'الدفع بعد التأكيد عبر المحفظة'],
      ctaText: 'اطلب نسختك الآن',
    },
  }));

  const slides = [
    { title: 'كل كتاب رحلة جديدة', subtitle: 'آلاف العناوين المختارة بعناية — روايات، فكر، تنمية وكتب أطفال', buttonText: 'تسوّق الآن', link: '/shop' },
    { title: 'خصومات حتى 25%', subtitle: 'على أكثر الكتب مبيعاً لفترة محدودة', buttonText: 'شاهد العروض', link: '/shop?sort=sale' },
    { title: 'عالم الأطفال الملون', subtitle: 'قصص تزرع حب القراءة في قلوب صغارك', buttonText: 'اكتشف', link: `/category/${categories[4].slug}` },
  ].map((s, i) => ({
    id: uid(),
    ...s,
    image: writeSeed(`slide-${i}.svg`, artSVG(1920, 720, i * 2, 'left')),
    mobileImage: writeSeed(`slide-m-${i}.svg`, artSVG(1080, 1350, i * 2, 'left')),
  }));

  const homepage = [
    { id: uid(), type: 'slider', title: 'السلايدر الرئيسي', visible: true, settings: { slides, autoplay: true, interval: 5 } },
    {
      id: uid(), type: 'features', title: 'المميزات', visible: true, settings: {
        items: [
          { icon: 'truck', title: 'شحن لكل المحافظات', text: 'توصيل سريع حتى باب البيت' },
          { icon: 'shield', title: 'دفع آمن', text: 'محافظ إلكترونية وتأكيد فوري' },
          { icon: 'book', title: 'كتب أصلية', text: 'طبعات أصلية بجودة عالية' },
          { icon: 'chat', title: 'دعم واتساب', text: 'نرد عليك في أسرع وقت' },
        ],
      },
    },
    { id: uid(), type: 'categories', title: 'تصفح الأقسام', subtitle: 'اختر عالمك المفضل', visible: true, settings: { style: 'cards' } },
    { id: uid(), type: 'products', title: 'اختيارات المحررين', subtitle: 'كتب ننصحك بها بشدة', visible: true, settings: { source: 'featured', limit: 10, layout: 'carousel' } },
    {
      id: uid(), type: 'banners', title: 'بانرات العروض', visible: true, settings: {
        columns: 2,
        items: [
          { image: writeSeed('banner-0.svg', artSVG(1200, 700, 3, 'left')), title: 'روايات تخطف الأنفاس', subtitle: 'أحدث الإصدارات', buttonText: 'تسوق', link: `/category/${categories[0].slug}` },
          { image: writeSeed('banner-1.svg', artSVG(1200, 700, 5, 'left')), title: 'طوّر نفسك', subtitle: 'خصم على كتب التنمية', buttonText: 'اكتشف', link: `/category/${categories[1].slug}` },
        ],
      },
    },
    { id: uid(), type: 'products', title: 'وصل حديثاً', subtitle: 'أحدث الكتب في المكتبة', visible: true, settings: { source: 'latest', limit: 8, layout: 'grid' } },
    { id: uid(), type: 'text', title: 'اطلب كتابك المفضل الآن', visible: true, settings: { text: 'مش لاقي الكتاب اللي بتدور عليه؟ ابعتلنا على واتساب وهنوفرهولك في أسرع وقت.', buttonText: 'تواصل معنا', link: 'whatsapp', style: 'dark' } },
    { id: uid(), type: 'products', title: 'الأكثر مبيعاً', subtitle: 'الكتب التي يحبها قراؤنا', visible: true, settings: { source: 'bestsellers', limit: 10, layout: 'carousel' } },
  ];

  return {
    version: 1,
    admin: {
      email: 'mohamedsamy@gmail.com',
      salt: 'fdb4581e35adab7f0ec350d2b340715b',
      hash: '927371426153adb12ccce153df897193b0c48d59e7ff11cd00a62c3677e407ae91ef3d91b8371254d20edade379342157ae1367a35f72ec15b2c23cc2d637cf0',
    },
    sessions: {},
    settings: {
      storeName: 'مكتبة سامي',
      tagline: 'متجر الكتب الأقرب لقلبك',
      logo: '',
      currency: 'ج.م',
      announcement: { enabled: true, text: '🚚 شحن لكل محافظات مصر — والشحن مجاني للطلبات فوق 500 ج.م' },
      contact: { phone: '01000000000', email: '', address: 'القاهرة، مصر', hours: 'يومياً من 10 صباحاً حتى 10 مساءً' },
      social: { facebook: '', instagram: '', tiktok: '', youtube: '' },
      about: 'مكتبة إلكترونية تقدم لك أفضل الكتب العربية والمترجمة بأسعار مناسبة وتوصيل لكل المحافظات.',
      payment: {
        methodName: 'فودافون كاش',
        number: '01000000000',
        accountName: 'محمد سامي',
        address: 'القاهرة، مصر',
        description: 'حوّل إجمالي الطلب على الرقم الموضح، ثم صوّر إيصال التحويل وابعته لنا على واتساب لتأكيد طلبك.',
        whatsapp: '01000000000',
      },
      shipping: {
        freeOver: 500,
        zones: GOVERNORATES.map(([name, price, days]) => ({ id: uid(4), name, price, days, active: true })),
      },
    },
    categories,
    products,
    homepage,
    coupons: [{ id: uid(), code: 'WELCOME10', type: 'percent', value: 10, minTotal: 200, maxUses: 0, uses: 0, active: true }],
    orders: [],
    nextOrderNumber: 1001,
  };
}

module.exports = { buildSeed, coverSVG };
