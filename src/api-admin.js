'use strict';
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db, analytics, UPLOAD_DIR } = require('./db');
const { uid, str, num, bool, uniqueSlug, normalizePhone } = require('./util');
const { limiter } = require('./api-public');
const S = require('./store');

const router = express.Router();
const D = () => db.get();
const COOKIE = 'adm_session';
const SESSION_DAYS = 30;

/* ---------------- المصادقة ---------------- */
function hashPass(pass, salt) {
  return crypto.scryptSync(String(pass), salt, 64).toString('hex');
}
function safeEq(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
function getCookie(req, name) {
  const h = req.headers.cookie || '';
  for (const part of h.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return '';
}
function auth(req, res, next) {
  const t = getCookie(req, COOKIE);
  const s = t && D().sessions[t];
  if (!s || s.exp < Date.now()) return res.status(401).json({ error: 'غير مصرح' });
  next();
}

router.post('/login', limiter(10, 15 * 60 * 1000), (req, res) => {
  const { email, password } = req.body || {};
  const a = D().admin;
  const ok = safeEq(String(email || '').trim().toLowerCase(), a.email.toLowerCase()) & safeEq(hashPass(password || '', a.salt), a.hash);
  if (!ok) return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = D().sessions;
  for (const k of Object.keys(sessions)) if (sessions[k].exp < Date.now()) delete sessions[k];
  sessions[token] = { exp: Date.now() + SESSION_DAYS * 86400000, at: Date.now() };
  db.save();
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${req.secure ? '; Secure' : ''}`);
  res.json({ ok: true, email: a.email });
});

router.post('/logout', (req, res) => {
  const t = getCookie(req, COOKIE);
  if (t) { delete D().sessions[t]; db.save(); }
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
});

router.use(auth);

router.get('/me', (req, res) => res.json({ email: D().admin.email }));

router.post('/password', (req, res) => {
  const { current, email, password } = req.body || {};
  const a = D().admin;
  if (!safeEq(hashPass(current || '', a.salt), a.hash)) return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  if (email) {
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'البريد غير صحيح' });
    a.email = String(email).trim().toLowerCase();
  }
  if (password) {
    if (String(password).length < 6) return res.status(400).json({ error: 'كلمة المرور 6 أحرف على الأقل' });
    a.salt = crypto.randomBytes(16).toString('hex');
    a.hash = hashPass(password, a.salt);
    const cur = getCookie(req, COOKIE);
    for (const k of Object.keys(D().sessions)) if (k !== cur) delete D().sessions[k];
  }
  db.save();
  res.json({ ok: true, email: a.email });
});

/* ---------------- رفع الصور ---------------- */
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const d = new Date();
      const sub = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
      const dir = path.join(UPLOAD_DIR, sub);
      fs.mkdirSync(dir, { recursive: true });
      req._sub = sub;
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `${uid(10)}${({ 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[file.mimetype] || '.jpg')}`),
  }),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)),
});
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'الصيغ المسموحة: JPG, PNG, WEBP' });
  res.json({ url: `/uploads/${req._sub}/${req.file.filename}` });
});

/* ---------------- الإحصائيات ---------------- */
const DAY = 86400000;
const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

router.get('/stats', (req, res) => {
  const orders = D().orders;
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const today = startOfDay(Date.now());
  const visitors = Object.values(analytics.get().visitors);
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const s = today - i * DAY;
    const dayOrders = valid.filter((o) => o.createdAt >= s && o.createdAt < s + DAY);
    days.push({ date: s, orders: dayOrders.length, revenue: dayOrders.reduce((a, o) => a + o.total, 0), visitors: visitors.filter((v) => v.events.some((e) => e.t >= s && e.t < s + DAY)).length });
  }
  const since30 = today - 29 * DAY;
  const v30 = visitors.filter((v) => v.lastSeen >= since30);
  const has = (v, type) => v.events.some((e) => e.type === type && e.t >= since30);
  const funnel = {
    visitors: v30.length,
    product: v30.filter((v) => has(v, 'product') || has(v, 'landing')).length,
    cart: v30.filter((v) => has(v, 'add_to_cart')).length,
    checkout: v30.filter((v) => has(v, 'checkout') || has(v, 'landing')).length,
    orders: v30.filter((v) => has(v, 'order')).length,
  };
  const prodSales = {};
  for (const o of valid) for (const l of o.items) {
    prodSales[l.productId] = prodSales[l.productId] || { name: l.name, image: l.image, qty: 0, revenue: 0 };
    prodSales[l.productId].qty += l.qty;
    prodSales[l.productId].revenue += l.total;
  }
  const statusCounts = {};
  for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  const sources = {};
  for (const v of v30) { const k = v.source || 'مباشر'; sources[k] = (sources[k] || 0) + 1; }
  const devices = {};
  for (const v of v30) devices[v.device] = (devices[v.device] || 0) + 1;
  res.json({
    revenue: valid.filter((o) => o.status === 'delivered').reduce((a, o) => a + o.total, 0),
    revenueAll: valid.reduce((a, o) => a + o.total, 0),
    ordersCount: orders.length,
    ordersToday: orders.filter((o) => o.createdAt >= today).length,
    revenueToday: valid.filter((o) => o.createdAt >= today).reduce((a, o) => a + o.total, 0),
    pending: orders.filter((o) => o.status === 'new').length,
    customers: new Set(orders.map((o) => o.customer.phone)).size,
    products: D().products.length,
    outOfStock: D().products.filter((p) => p.stock != null && p.stock <= 0).length,
    visitorsToday: visitors.filter((v) => v.lastSeen >= today).length,
    days, funnel, statusCounts,
    sources: Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 6),
    devices: Object.entries(devices),
    topProducts: Object.values(prodSales).sort((a, b) => b.qty - a.qty).slice(0, 5),
    recent: orders.slice(0, 6).map(orderSummary),
  });
});

/* ---------------- الطلبات ---------------- */
const STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
function orderSummary(o) {
  return { id: o.id, number: o.number, status: o.status, name: o.customer.name, phone: o.customer.phone, governorate: o.customer.governorate, total: o.total, items: o.items.reduce((a, l) => a + l.qty, 0), createdAt: o.createdAt, receipt: !!o.receipt, whatsappClicked: !!o.whatsappClicked, source: o.source };
}

router.get('/orders', (req, res) => {
  let list = D().orders;
  if (req.query.status && req.query.status !== 'all') list = list.filter((o) => o.status === req.query.status);
  if (req.query.q) {
    const q = S.normalizeArabic(req.query.q);
    const qp = normalizePhone(req.query.q);
    list = list.filter((o) => String(o.number).includes(q) || S.normalizeArabic(o.customer.name).includes(q) || (qp && (o.customer.phone.includes(qp) || o.customer.phone2.includes(qp))));
  }
  const counts = { all: D().orders.length };
  for (const o of D().orders) counts[o.status] = (counts[o.status] || 0) + 1;
  res.json({ orders: list.slice(0, 500).map(orderSummary), counts });
});

router.get('/orders/:id', (req, res) => {
  const o = D().orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'غير موجود' });
  const prev = D().orders.filter((x) => x.customer.phone === o.customer.phone && x.id !== o.id).length;
  res.json({ order: o, previousOrders: prev });
});

router.patch('/orders/:id', (req, res) => {
  const o = D().orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'غير موجود' });
  const b = req.body || {};
  if (b.status && STATUSES.includes(b.status) && b.status !== o.status) {
    const wasCancelled = o.status === 'cancelled';
    const nowCancelled = b.status === 'cancelled';
    if (wasCancelled !== nowCancelled) {
      for (const l of o.items) {
        const p = D().products.find((x) => x.id === l.productId);
        if (!p) continue;
        if (p.stock != null) p.stock = Math.max(p.stock + (nowCancelled ? l.qty : -l.qty), 0);
        p.sold = Math.max((p.sold || 0) + (nowCancelled ? -l.qty : l.qty), 0);
      }
    }
    o.status = b.status;
    o.statusHistory.push({ status: b.status, at: Date.now(), note: str(b.note, 300), by: 'admin' });
  } else if (b.note) {
    o.statusHistory.push({ status: o.status, at: Date.now(), note: str(b.note, 300), by: 'admin' });
  }
  if (b.adminNote != null) o.adminNote = str(b.adminNote, 1000);
  db.save();
  res.json({ order: o });
});

router.delete('/orders/:id', (req, res) => {
  const i = D().orders.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'غير موجود' });
  D().orders.splice(i, 1);
  db.save();
  res.json({ ok: true });
});

/* ---------------- العملاء وخط السير ---------------- */
router.get('/customers', (req, res) => {
  const map = new Map();
  for (const o of D().orders) {
    const k = o.customer.phone;
    const c = map.get(k) || { phone: k, name: o.customer.name, phone2: o.customer.phone2, governorate: o.customer.governorate, orders: 0, spent: 0, last: 0, first: Infinity };
    c.orders++;
    if (o.status !== 'cancelled') c.spent += o.total;
    if (o.createdAt > c.last) { c.last = o.createdAt; c.name = o.customer.name; c.governorate = o.customer.governorate; }
    c.first = Math.min(c.first, o.createdAt);
    map.set(k, c);
  }
  let list = [...map.values()].sort((a, b) => b.last - a.last);
  if (req.query.q) {
    const q = S.normalizeArabic(req.query.q);
    list = list.filter((c) => S.normalizeArabic(c.name).includes(q) || c.phone.includes(normalizePhone(req.query.q) || '###'));
  }
  res.json({ customers: list });
});

function journeyFor(visitorIds) {
  const A = analytics.get();
  const events = [];
  const visitors = [];
  for (const id of visitorIds) {
    const v = A.visitors[id];
    if (!v) continue;
    visitors.push({ id: v.id, device: v.device, os: v.os, browser: v.browser, source: v.source, referrer: v.referrer, landing: v.landing, firstSeen: v.firstSeen, lastSeen: v.lastSeen });
    for (const e of v.events) events.push({ ...e, vid: v.id });
  }
  events.sort((a, b) => a.t - b.t);
  return { visitors, events };
}

router.get('/customers/:phone', (req, res) => {
  const phone = req.params.phone;
  const orders = D().orders.filter((o) => o.customer.phone === phone);
  if (!orders.length) return res.status(404).json({ error: 'غير موجود' });
  const vids = new Set(orders.map((o) => o.visitorId).filter(Boolean));
  for (const v of Object.values(analytics.get().visitors)) if (v.phone === phone) vids.add(v.id);
  const j = journeyFor([...vids]);
  res.json({ customer: { ...orders[0].customer }, orders: orders.map(orderSummary), ...j });
});

router.get('/visitors', (req, res) => {
  const list = Object.values(analytics.get().visitors)
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 300)
    .map((v) => ({
      id: v.id, device: v.device, os: v.os, browser: v.browser, source: v.source, referrer: v.referrer,
      firstSeen: v.firstSeen, lastSeen: v.lastSeen, pages: v.events.length, name: v.name, phone: v.phone,
      ordered: (v.orders || []).length > 0, carted: v.events.some((e) => e.type === 'add_to_cart'),
      last: v.events.length ? v.events[v.events.length - 1] : null,
    }));
  res.json({ visitors: list, total: Object.keys(analytics.get().visitors).length });
});

router.get('/visitors/:id', (req, res) => {
  const v = analytics.get().visitors[req.params.id];
  if (!v) return res.status(404).json({ error: 'غير موجود' });
  const j = journeyFor([v.id]);
  res.json({ visitor: { ...j.visitors[0], name: v.name, phone: v.phone, orders: v.orders || [] }, events: j.events });
});

/* ---------------- المنتجات ---------------- */
function cleanProduct(b, existing) {
  const list = D().products;
  const p = existing || { id: uid(), createdAt: Date.now(), sold: 0 };
  p.name = str(b.name, 200);
  p.slug = uniqueSlug(b.slug || b.name, list, p.id);
  p.author = str(b.author, 120);
  p.publisher = str(b.publisher, 120);
  p.pages = b.pages ? Math.max(num(b.pages), 0) : null;
  p.sku = str(b.sku, 60);
  p.price = Math.max(num(b.price), 0);
  p.oldPrice = Math.max(num(b.oldPrice), 0);
  p.description = str(b.description, 8000);
  p.images = (Array.isArray(b.images) ? b.images : []).filter((x) => typeof x === 'string' && x.startsWith('/uploads/')).slice(0, 10);
  p.categoryId = D().categories.some((c) => c.id === b.categoryId) ? b.categoryId : '';
  p.stock = b.stock === '' || b.stock == null ? null : Math.max(parseInt(b.stock, 10) || 0, 0);
  p.featured = bool(b.featured);
  p.active = b.active == null ? true : bool(b.active);
  const l = b.landing || {};
  p.landing = {
    enabled: l.enabled == null ? true : bool(l.enabled),
    headline: str(l.headline, 200),
    subheadline: str(l.subheadline, 400),
    bullets: (Array.isArray(l.bullets) ? l.bullets : String(l.bullets || '').split('\n')).map((x) => str(x, 150)).filter(Boolean).slice(0, 10),
    ctaText: str(l.ctaText, 60) || 'اطلب الآن',
  };
  return p;
}

router.get('/products', (req, res) => {
  const cats = S.catMap();
  res.json({ products: D().products.slice().sort((a, b) => b.createdAt - a.createdAt).map((p) => ({ ...p, categoryName: cats.get(p.categoryId)?.name || '' })) });
});
router.post('/products', (req, res) => {
  const b = req.body || {};
  if (!str(b.name)) return res.status(400).json({ error: 'اسم المنتج مطلوب' });
  const p = cleanProduct(b);
  D().products.push(p);
  db.save();
  res.json({ product: p });
});
router.put('/products/:id', (req, res) => {
  const p = D().products.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'غير موجود' });
  if (!str(req.body.name)) return res.status(400).json({ error: 'اسم المنتج مطلوب' });
  cleanProduct(req.body, p);
  db.save();
  res.json({ product: p });
});
router.patch('/products/:id', (req, res) => {
  const p = D().products.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'غير موجود' });
  if (req.body.active != null) p.active = bool(req.body.active);
  if (req.body.featured != null) p.featured = bool(req.body.featured);
  db.save();
  res.json({ product: p });
});
router.delete('/products/:id', (req, res) => {
  const d = D();
  d.products = d.products.filter((x) => x.id !== req.params.id);
  for (const s of d.homepage) if (s.settings && Array.isArray(s.settings.productIds)) s.settings.productIds = s.settings.productIds.filter((x) => x !== req.params.id);
  db.save();
  res.json({ ok: true });
});

/* ---------------- الأقسام ---------------- */
router.get('/categories', (req, res) => {
  const counts = {};
  for (const p of D().products) counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
  res.json({ categories: D().categories.slice().sort((a, b) => a.order - b.order).map((c) => ({ ...c, count: counts[c.id] || 0 })) });
});
function cleanCategory(b, c) {
  c.name = str(b.name, 100);
  c.slug = uniqueSlug(b.slug || b.name, D().categories, c.id);
  c.description = str(b.description, 300);
  c.image = typeof b.image === 'string' && (b.image === '' || b.image.startsWith('/uploads/')) ? b.image : c.image || '';
  c.showInMenu = b.showInMenu == null ? true : bool(b.showInMenu);
  c.active = b.active == null ? true : bool(b.active);
  return c;
}
router.post('/categories', (req, res) => {
  if (!str(req.body.name)) return res.status(400).json({ error: 'اسم القسم مطلوب' });
  const c = cleanCategory(req.body, { id: uid(), order: D().categories.length });
  D().categories.push(c);
  db.save();
  res.json({ category: c });
});
router.put('/categories/order', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  ids.forEach((id, i) => { const c = D().categories.find((x) => x.id === id); if (c) c.order = i; });
  db.save();
  res.json({ ok: true });
});
router.put('/categories/:id', (req, res) => {
  const c = D().categories.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'غير موجود' });
  if (!str(req.body.name)) return res.status(400).json({ error: 'اسم القسم مطلوب' });
  cleanCategory(req.body, c);
  db.save();
  res.json({ category: c });
});
router.delete('/categories/:id', (req, res) => {
  const d = D();
  d.categories = d.categories.filter((x) => x.id !== req.params.id);
  for (const p of d.products) if (p.categoryId === req.params.id) p.categoryId = '';
  db.save();
  res.json({ ok: true });
});

/* ---------------- الصفحة الرئيسية ---------------- */
const SECTION_TYPES = ['slider', 'banners', 'products', 'categories', 'features', 'text'];
router.get('/homepage', (req, res) => res.json({ sections: D().homepage }));
router.put('/homepage', (req, res) => {
  const list = Array.isArray(req.body.sections) ? req.body.sections : null;
  if (!list) return res.status(400).json({ error: 'بيانات غير صحيحة' });
  const json = JSON.stringify(list);
  if (json.length > 500000) return res.status(400).json({ error: 'البيانات كبيرة جداً' });
  D().homepage = list
    .filter((s) => SECTION_TYPES.includes(s.type))
    .slice(0, 40)
    .map((s) => ({ id: str(s.id, 30) || uid(), type: s.type, title: str(s.title, 150), subtitle: str(s.subtitle, 300), visible: s.visible !== false, settings: s.settings && typeof s.settings === 'object' ? s.settings : {} }));
  db.save();
  res.json({ sections: D().homepage });
});

/* ---------------- الإعدادات ---------------- */
router.get('/settings', (req, res) => res.json({ settings: D().settings }));
router.put('/settings', (req, res) => {
  const b = req.body || {};
  const s = D().settings;
  if (b.storeName != null) s.storeName = str(b.storeName, 80) || s.storeName;
  if (b.tagline != null) s.tagline = str(b.tagline, 150);
  if (b.logo != null) s.logo = String(b.logo).startsWith('/uploads/') ? b.logo : '';
  if (b.about != null) s.about = str(b.about, 1000);
  if (b.currency != null) s.currency = str(b.currency, 10) || 'ج.م';
  if (b.announcement) s.announcement = { enabled: bool(b.announcement.enabled), text: str(b.announcement.text, 250) };
  if (b.contact) s.contact = { phone: str(b.contact.phone, 30), email: str(b.contact.email, 100), address: str(b.contact.address, 250), hours: str(b.contact.hours, 120) };
  if (b.social) s.social = { facebook: str(b.social.facebook, 250), instagram: str(b.social.instagram, 250), tiktok: str(b.social.tiktok, 250), youtube: str(b.social.youtube, 250) };
  if (b.payment) {
    s.payment = {
      methodName: str(b.payment.methodName, 80), number: str(b.payment.number, 40), accountName: str(b.payment.accountName, 80),
      address: str(b.payment.address, 300), description: str(b.payment.description, 1000), whatsapp: normalizePhone(b.payment.whatsapp).slice(0, 16),
    };
  }
  if (b.shipping) {
    s.shipping = {
      freeOver: Math.max(num(b.shipping.freeOver), 0),
      zones: (Array.isArray(b.shipping.zones) ? b.shipping.zones : []).slice(0, 100).filter((z) => str(z.name)).map((z) => ({
        id: str(z.id, 20) || uid(4), name: str(z.name, 80), price: Math.max(num(z.price), 0), days: str(z.days, 20), active: z.active !== false,
      })),
    };
  }
  db.save();
  res.json({ settings: s });
});

/* ---------------- الكوبونات ---------------- */
router.get('/coupons', (req, res) => res.json({ coupons: D().coupons }));
router.put('/coupons', (req, res) => {
  const list = Array.isArray(req.body.coupons) ? req.body.coupons : [];
  const old = D().coupons;
  D().coupons = list.slice(0, 200).filter((c) => str(c.code)).map((c) => {
    const prev = old.find((o) => o.id === c.id);
    return {
      id: str(c.id, 20) || uid(), code: str(c.code, 30).toUpperCase().replace(/\s+/g, ''), type: c.type === 'fixed' ? 'fixed' : 'percent',
      value: Math.max(num(c.value), 0), minTotal: Math.max(num(c.minTotal), 0), maxUses: Math.max(parseInt(c.maxUses, 10) || 0, 0),
      uses: prev ? prev.uses : 0, active: c.active !== false, expiresAt: c.expiresAt ? num(c.expiresAt) : null,
    };
  });
  db.save();
  res.json({ coupons: D().coupons });
});

module.exports = { router };
