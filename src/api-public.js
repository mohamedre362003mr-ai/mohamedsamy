'use strict';
const express = require('express');
const db = require('./db');
const { uid, str, normalizePhone, parseUA } = require('./util');
const { imageUpload, saveImage } = require('./storage');
const S = require('./store');

const router = express.Router();
const D = () => db.get();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ---------- حد بسيط لعدد الطلبات لكل IP ---------- */
function limiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const k = req.ip;
    const now = Date.now();
    const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'محاولات كثيرة، حاول بعد قليل' });
    arr.push(now);
    hits.set(k, arr);
    if (hits.size > 5000) hits.clear();
    next();
  };
}

function publicSettings() {
  const s = D().settings;
  return {
    storeName: s.storeName, tagline: s.tagline, logo: s.logo, currency: s.currency,
    announcement: s.announcement, contact: s.contact, social: s.social, about: s.about,
    whatsapp: s.payment.whatsapp,
    paymentMethod: s.payment.methodName,
    shipping: { freeOver: s.shipping.freeOver, zones: s.shipping.zones.filter((z) => z.active !== false).map((z) => ({ id: z.id, name: z.name, price: z.price, days: z.days })) },
  };
}

router.get('/bootstrap', (req, res) => {
  const counts = {};
  for (const p of S.activeProducts()) counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
  const categories = D().categories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, image: c.image, description: c.description, showInMenu: c.showInMenu !== false, count: counts[c.id] || 0 }));
  res.json({ settings: publicSettings(), categories });
});

router.get('/home', (req, res) => {
  res.json({ sections: D().homepage.filter((s) => s.visible).map(S.resolveSection) });
});

router.get('/products', (req, res) => {
  const cats = S.catMap();
  let list = S.activeProducts();
  let category = null;
  if (req.query.ids) {
    const ids = String(req.query.ids).split(',').slice(0, 60);
    list = D().products.filter((p) => ids.includes(p.id));
    return res.json({ products: list.map((p) => ({ ...S.publicProduct(p, cats), available: !!p.active })) });
  }
  if (req.query.category) {
    category = D().categories.find((c) => c.slug === req.query.category && c.active);
    if (!category) return res.status(404).json({ error: 'القسم غير موجود' });
    list = list.filter((p) => p.categoryId === category.id);
  }
  if (req.query.q) list = S.searchProducts(list, String(req.query.q).slice(0, 100));
  list = S.sortProducts(list, req.query.sort);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 60);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const total = list.length;
  res.json({
    total, page, pages: Math.max(Math.ceil(total / limit), 1),
    category: category && { id: category.id, name: category.name, slug: category.slug, description: category.description, image: category.image },
    products: list.slice((page - 1) * limit, page * limit).map((p) => S.publicProduct(p, cats)),
  });
});

router.get('/products/:slug', (req, res) => {
  const p = S.activeProducts().find((x) => x.slug === req.params.slug || x.id === req.params.slug);
  if (!p) return res.status(404).json({ error: 'المنتج غير موجود' });
  const cats = S.catMap();
  let related = S.activeProducts().filter((x) => x.id !== p.id && x.categoryId === p.categoryId);
  if (related.length < 4) related = related.concat(S.sortProducts(S.activeProducts().filter((x) => x.id !== p.id && x.categoryId !== p.categoryId), 'bestsellers'));
  const out = S.publicProduct(p, cats);
  out.landing = p.landing || {};
  res.json({ product: out, related: related.slice(0, 10).map((x) => S.publicProduct(x, cats)) });
});

router.post('/coupon', (req, res) => {
  const c = S.findCoupon(req.body.code);
  if (!c) return res.status(404).json({ error: 'الكوبون غير صحيح أو منتهي' });
  const subtotal = Number(req.body.subtotal) || 0;
  if (c.minTotal && subtotal < c.minTotal) return res.status(400).json({ error: `الكوبون يعمل للطلبات من ${c.minTotal} ${D().settings.currency}` });
  res.json({ code: c.code, type: c.type, value: c.value, minTotal: c.minTotal || 0, discount: S.couponDiscount(c, subtotal) });
});

router.post('/quote', (req, res) => {
  const q = S.priceOrder({ items: req.body.items, zoneId: req.body.zoneId, coupon: req.body.coupon });
  res.json({ errors: q.errors, lines: q.lines, subtotal: q.subtotal, discount: q.discount, coupon: q.coupon, shipping: q.shipping, freeShipping: q.freeShipping, total: q.total, zone: q.zone ? q.zone.name : null });
});

function orderPublic(o) {
  const s = D().settings;
  return {
    id: o.id, number: o.number, status: o.status, createdAt: o.createdAt,
    customer: o.customer, items: o.items, subtotal: o.subtotal, shipping: o.shipping, discount: o.discount, coupon: o.coupon, total: o.total,
    receipt: o.receipt || '',
    payment: { methodName: s.payment.methodName, number: s.payment.number, accountName: s.payment.accountName, address: s.payment.address, description: s.payment.description, whatsapp: s.payment.whatsapp },
  };
}

async function visitorEvent(vid, ev, link) {
  if (!vid) return;
  const v = await db.visitors.get(vid);
  if (!v) return;
  if (link) { v.name = link.customer.name; v.phone = link.customer.phone; v.orders = Array.from(new Set([...(v.orders || []), link.id])); }
  v.events.push({ t: Date.now(), ...ev });
  if (v.events.length > 400) v.events.splice(0, v.events.length - 400);
  v.lastSeen = Date.now();
  await db.visitors.put(v);
}

router.post('/orders', limiter(15, 60 * 60 * 1000), wrap(async (req, res) => {
  const b = req.body || {};
  const c = b.customer || {};
  const customer = {
    name: str(c.name, 80),
    phone: normalizePhone(c.phone).slice(0, 16),
    phone2: normalizePhone(c.phone2).slice(0, 16),
    governorate: '',
    city: str(c.city, 80),
    address: str(c.address, 300),
    notes: str(c.notes, 500),
  };
  const errs = {};
  if (customer.name.length < 2) errs.name = 'اكتب الاسم بالكامل';
  if (!/^\+?\d{8,15}$/.test(customer.phone)) errs.phone = 'رقم الهاتف غير صحيح';
  if (customer.phone2 && !/^\+?\d{8,15}$/.test(customer.phone2)) errs.phone2 = 'رقم الهاتف الثاني غير صحيح';
  if (customer.address.length < 4) errs.address = 'اكتب العنوان بالتفصيل';
  const q = S.priceOrder({ items: b.items, zoneId: c.zoneId, coupon: b.coupon });
  if (!q.zone) errs.zoneId = 'اختر المحافظة';
  if (Object.keys(errs).length) return res.status(400).json({ error: 'راجع البيانات المطلوبة', fields: errs });
  if (q.errors.length) return res.status(400).json({ error: q.errors[0] });
  if (!q.lines.length) return res.status(400).json({ error: 'السلة فارغة' });
  customer.governorate = q.zone.name;

  const order = {
    id: uid(8),
    token: uid(12),
    number: await db.orders.nextNumber(),
    status: 'new',
    statusHistory: [{ status: 'new', at: Date.now(), note: 'تم إنشاء الطلب' }],
    customer,
    zoneId: q.zone.id,
    items: q.lines,
    subtotal: q.subtotal,
    discount: q.discount,
    coupon: q.coupon,
    shipping: q.shipping,
    total: q.total,
    receipt: '',
    whatsappClicked: false,
    source: b.source === 'landing' ? 'landing' : 'store',
    visitorId: /^[a-z0-9]{8,40}$/i.test(b.vid || '') ? b.vid : '',
    createdAt: Date.now(),
    adminNote: '',
  };
  // خصم المخزون وزيادة المبيعات
  for (const l of q.lines) {
    const p = D().products.find((x) => x.id === l.productId);
    if (p) {
      if (p.stock != null) p.stock = Math.max(p.stock - l.qty, 0);
      p.sold = (p.sold || 0) + l.qty;
    }
  }
  if (q.couponObj && q.discount > 0) q.couponObj.uses = (q.couponObj.uses || 0) + 1;
  db.save();
  await db.orders.put(order);
  await visitorEvent(order.visitorId, { type: 'order', path: '/checkout', data: { orderId: order.id, number: order.number, total: order.total } }, order);
  res.json({ id: order.id, token: order.token, number: order.number });
}));

async function getOrder(req) {
  const o = await db.orders.get(req.params.id);
  if (!o || o.token !== String(req.query.t || req.body?.t || '')) return null;
  return o;
}

router.get('/orders/:id', wrap(async (req, res) => {
  const o = await getOrder(req);
  if (!o) return res.status(404).json({ error: 'الطلب غير موجود' });
  res.json({ order: orderPublic(o) });
}));

router.post('/orders/:id/whatsapp', wrap(async (req, res) => {
  const o = await getOrder(req);
  if (!o) return res.status(404).json({ error: 'الطلب غير موجود' });
  if (!o.whatsappClicked) {
    o.whatsappClicked = true;
    o.statusHistory.push({ status: o.status, at: Date.now(), note: 'العميل ضغط زر واتساب لتأكيد الدفع' });
    await db.orders.put(o);
  }
  await visitorEvent(o.visitorId, { type: 'whatsapp', path: '/thanks', data: { number: o.number } });
  res.json({ ok: true });
}));

router.post('/orders/:id/receipt', limiter(20, 60 * 60 * 1000), imageUpload(/^image\/(jpeg|png|webp)$/).single('file'), wrap(async (req, res) => {
  const o = await getOrder(req);
  if (!o) return res.status(404).json({ error: 'الطلب غير موجود' });
  if (!req.file) return res.status(400).json({ error: 'ارفع صورة بصيغة JPG أو PNG' });
  o.receipt = await saveImage(req.file, 'receipts');
  o.statusHistory.push({ status: o.status, at: Date.now(), note: 'العميل رفع صورة إيصال الدفع' });
  await db.orders.put(o);
  await visitorEvent(o.visitorId, { type: 'receipt', path: '/thanks', data: { number: o.number } });
  res.json({ receipt: o.receipt });
}));

/* ---------- تتبع خط سير الزائر ---------- */
function cleanData(d) {
  if (!d || typeof d !== 'object') return undefined;
  const out = {};
  for (const k of Object.keys(d).slice(0, 8)) {
    const val = d[k];
    if (typeof val === 'number' && Number.isFinite(val)) out[k.slice(0, 20)] = val;
    else if (typeof val === 'string') out[k.slice(0, 20)] = val.slice(0, 120);
  }
  return out;
}
const EVENT_TYPES = new Set(['page', 'product', 'category', 'search', 'add_to_cart', 'remove_from_cart', 'cart', 'checkout', 'landing', 'whatsapp_float']);
router.post('/track', express.text({ type: '*/*', limit: '64kb' }), wrap(async (req, res) => {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  const vid = String(body.vid || '');
  if (!/^[a-z0-9]{8,40}$/i.test(vid)) return res.status(204).end();
  const now = Date.now();
  let v = await db.visitors.get(vid);
  if (!v) {
    const ua = parseUA(req.headers['user-agent']);
    v = {
      id: vid, firstSeen: now, lastSeen: now, ...ua,
      referrer: str(body.referrer, 300), source: str(body.source, 120), landing: str(body.landing, 300),
      events: [], orders: [], name: '', phone: '',
    };
  }
  let added = 0;
  for (const e of (Array.isArray(body.events) ? body.events : []).slice(0, 30)) {
    if (!EVENT_TYPES.has(e.type)) continue;
    const ago = Math.min(Math.max(Number(e.ago) || 0, 0), 600000);
    v.events.push({ t: now - ago, type: e.type, path: str(e.path, 200), title: str(e.title, 150), data: cleanData(e.data) });
    added++;
  }
  if (!added) return res.status(204).end();
  if (v.events.length > 400) v.events.splice(0, v.events.length - 400);
  v.lastSeen = now;
  await db.visitors.put(v);
  res.status(204).end();
}));

module.exports = { router, limiter, publicSettings, wrap };
