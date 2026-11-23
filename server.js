'use strict';
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const compression = require('compression');
const db = require('./src/db');
const { buildSeed } = require('./src/seed');
const { escHtml } = require('./src/util');

db.setSeed(buildSeed);

const app = express();
const PUBLIC = path.join(__dirname, 'public');
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(compression());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

/* ---------- الملفات الثابتة (على Vercel يخدمها الـ CDN من public/ مباشرة) ---------- */
app.use(express.static(PUBLIC, {
  index: false,
  redirect: false,
  setHeaders(res, file) {
    // no-cache = المتصفح يتأكد من وجود نسخة أحدث فتظهر التحديثات فوراً
    if (/\.(css|js|html)$/.test(file)) res.setHeader('Cache-Control', 'no-cache');
    else res.setHeader('Cache-Control', 'public, max-age=86400');
  },
}));
// الصور المرفوعة على السيرفر نفسه (لما لا يكون Vercel Blob مفعّل)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:");
  next();
}, express.static(db.UPLOAD_DIR, { maxAge: '30d', immutable: true, fallthrough: false }));

/* ---------- تحميل البيانات + حفظ التغييرات قبل إرسال الرد ---------- */
let adminEnvApplied = false;
function applyAdminEnv() {
  if (adminEnvApplied) return;
  adminEnvApplied = true;
  const a = db.get().admin;
  if (process.env.ADMIN_EMAIL && a.email !== process.env.ADMIN_EMAIL.toLowerCase()) { a.email = process.env.ADMIN_EMAIL.toLowerCase(); db.save(); }
  if (process.env.ADMIN_PASSWORD) {
    const h = crypto.scryptSync(process.env.ADMIN_PASSWORD, a.salt, 64).toString('hex');
    if (h !== a.hash) { a.salt = crypto.randomBytes(16).toString('hex'); a.hash = crypto.scryptSync(process.env.ADMIN_PASSWORD, a.salt, 64).toString('hex'); db.save(); }
  }
}
app.use(async (req, res, next) => {
  try {
    await db.refresh();
    applyAdminEnv();
  } catch (e) {
    console.error('DB error:', e);
    return res.status(503).type('html').send('<meta charset="utf-8"><div style="font-family:sans-serif;text-align:center;padding:60px" dir="rtl"><h2>المتجر غير متاح مؤقتاً</h2><p>تعذر الاتصال بقاعدة البيانات، حاول بعد قليل.</p></div>');
  }
  const end = res.end;
  let done = false;
  res.end = function patchedEnd(...args) {
    if (done) return end.apply(this, args);
    done = true;
    db.flush().then(() => end.apply(this, args), (e) => { console.error('Save failed:', e); end.apply(this, args); });
    return this;
  };
  next();
});

app.use('/api', express.json({ limit: '1mb' }));
app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
app.use('/api/admin', require('./src/api-admin').router);
app.use('/api', require('./src/api-public').router);
app.use('/api', (req, res) => res.status(404).json({ error: 'غير موجود' }));

/* ---------- صفحة الأدمن ---------- */
// مسارات ثابتة صريحة حتى يضمّن Vercel الملفات داخل الـ function
const readIndex = () => fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8');
const readAdmin = () => fs.readFileSync(path.join(__dirname, 'views', 'admin.html'), 'utf8');
app.get(['/admin', '/admin/*'], (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(readAdmin());
});

/* ---------- SEO ---------- */
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api\nDisallow: /checkout\nDisallow: /thanks\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`);
});
app.get('/sitemap.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const d = db.get();
  const urls = ['/', '/shop']
    .concat(d.categories.filter((c) => c.active).map((c) => `/category/${encodeURIComponent(c.slug)}`))
    .concat(d.products.filter((p) => p.active).map((p) => `/product/${encodeURIComponent(p.slug)}`));
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${base}${u}</loc></url>`).join('')}</urlset>`);
});

/* ---------- واجهة المتجر (SPA) مع عناوين وصور مشاركة لكل صفحة ---------- */
let shellCache = null;
function shell() {
  if (!shellCache || process.env.NODE_ENV !== 'production') shellCache = readIndex();
  return shellCache;
}
function render(req, res, meta = {}, status = 200) {
  const s = db.get().settings;
  const base = `${req.protocol}://${req.get('host')}`;
  const title = meta.title ? `${meta.title} | ${s.storeName}` : `${s.storeName} — ${s.tagline}`;
  const desc = (meta.description || s.about || '').slice(0, 180);
  const img = meta.image ? (meta.image.startsWith('http') ? meta.image : base + meta.image) : '';
  const tags = [
    `<title>${escHtml(title)}</title>`,
    `<meta name="description" content="${escHtml(desc)}">`,
    `<meta property="og:title" content="${escHtml(title)}">`,
    `<meta property="og:description" content="${escHtml(desc)}">`,
    `<meta property="og:type" content="${meta.type || 'website'}">`,
    `<meta property="og:url" content="${escHtml(base + req.originalUrl)}">`,
    img ? `<meta property="og:image" content="${escHtml(img)}">` : '',
    '<meta name="twitter:card" content="summary_large_image">',
  ].join('\n  ');
  res.status(status).setHeader('Cache-Control', 'no-cache');
  res.type('html').send(shell().replace('<!--META-->', tags).replace('__STORE_NAME__', escHtml(s.storeName)));
}

const findProduct = (slug) => db.get().products.find((p) => p.active && (p.slug === slug || p.id === slug));

app.get('/product/:slug', (req, res) => {
  const p = findProduct(req.params.slug);
  if (!p) return render(req, res, { title: 'غير موجود' }, 404);
  render(req, res, { title: p.name, description: p.description, image: p.images[0], type: 'product' });
});
app.get('/lp/:slug', (req, res) => {
  const p = findProduct(req.params.slug);
  if (!p) return render(req, res, { title: 'غير موجود' }, 404);
  render(req, res, { title: p.landing?.headline || p.name, description: p.landing?.subheadline || p.description, image: p.images[0], type: 'product' });
});
app.get('/category/:slug', (req, res) => {
  const c = db.get().categories.find((x) => x.slug === req.params.slug && x.active);
  if (!c) return render(req, res, { title: 'غير موجود' }, 404);
  render(req, res, { title: c.name, description: c.description, image: c.image });
});
app.get(['/', '/shop', '/search', '/cart', '/checkout', '/thanks/:id', '/page/:p'], (req, res) => render(req, res));
app.get('*', (req, res) => render(req, res, { title: 'الصفحة غير موجودة' }, 404));

app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'حجم الصورة كبير جداً' });
  if (err && (err.status === 404 || err.statusCode === 404)) return res.status(404).end();
  console.error(err);
  if (req.path.startsWith('/api')) return res.status(500).json({ error: 'حدث خطأ غير متوقع' });
  res.status(500).send('Server error');
});

module.exports = app;

// التشغيل العادي (VPS / Railway / Docker / محلياً). على Vercel يتم استخدام app المُصدَّر مباشرة.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  db.ready().then(() => {
    app.listen(PORT, () => console.log(`✓ المتجر يعمل على http://localhost:${PORT}  — لوحة التحكم: http://localhost:${PORT}/admin  (التخزين: ${db.MODE})`));
  }).catch((e) => { console.error('تعذر تشغيل قاعدة البيانات:', e); process.exit(1); });
}
