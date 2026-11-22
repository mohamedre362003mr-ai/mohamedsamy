'use strict';
/* منطق المتجر المشترك: تجهيز المنتجات للعرض، حساب الطلبات، الكوبونات، الشحن */
const { db } = require('./db');

const D = () => db.get();

function catMap() {
  const m = new Map();
  for (const c of D().categories) m.set(c.id, c);
  return m;
}

function publicProduct(p, cats = catMap()) {
  const c = cats.get(p.categoryId);
  const discount = p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    author: p.author || '',
    publisher: p.publisher || '',
    pages: p.pages || null,
    sku: p.sku || '',
    price: p.price,
    oldPrice: p.oldPrice || 0,
    discount,
    description: p.description || '',
    images: p.images || [],
    image: (p.images && p.images[0]) || '',
    category: c ? { id: c.id, name: c.name, slug: c.slug } : null,
    inStock: p.stock == null || p.stock > 0,
    stock: p.stock,
    featured: !!p.featured,
    sold: p.sold || 0,
    createdAt: p.createdAt,
  };
}

function activeProducts() {
  const cats = catMap();
  return D().products.filter((p) => p.active && (!p.categoryId || !cats.get(p.categoryId) || cats.get(p.categoryId).active));
}

function sortProducts(list, sort) {
  const l = list.slice();
  switch (sort) {
    case 'price_asc': return l.sort((a, b) => a.price - b.price);
    case 'price_desc': return l.sort((a, b) => b.price - a.price);
    case 'bestsellers': return l.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    case 'sale': return l.filter((p) => p.oldPrice > p.price).sort((a, b) => (b.oldPrice - b.price) / b.oldPrice - (a.oldPrice - a.price) / a.oldPrice);
    case 'name': return l.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    default: return l.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
}

function normalizeArabic(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

function searchProducts(list, q) {
  const n = normalizeArabic(q).trim();
  if (!n) return list;
  const terms = n.split(/\s+/);
  return list.filter((p) => {
    const hay = normalizeArabic(`${p.name} ${p.author} ${p.publisher} ${p.sku} ${p.description}`);
    return terms.every((t) => hay.includes(t));
  });
}

function resolveSection(s) {
  const cats = catMap();
  const out = { id: s.id, type: s.type, title: s.title || '', subtitle: s.subtitle || '', settings: { ...s.settings } };
  if (s.type === 'products') {
    const st = s.settings || {};
    let list = activeProducts();
    const limit = Math.min(Math.max(Number(st.limit) || 8, 1), 40);
    if (st.source === 'manual') {
      const ids = st.productIds || [];
      list = ids.map((id) => list.find((p) => p.id === id)).filter(Boolean);
    } else if (st.source === 'category') {
      list = sortProducts(list.filter((p) => p.categoryId === st.categoryId), 'latest');
      const c = cats.get(st.categoryId);
      if (c) out.settings.categorySlug = c.slug;
    } else if (st.source === 'featured') {
      list = sortProducts(list.filter((p) => p.featured), 'latest');
    } else if (st.source === 'bestsellers') {
      list = sortProducts(list, 'bestsellers');
    } else if (st.source === 'sale') {
      list = sortProducts(list, 'sale');
    } else {
      list = sortProducts(list, 'latest');
    }
    out.products = list.slice(0, limit).map((p) => publicProduct(p, cats));
  }
  if (s.type === 'categories') {
    const ids = (s.settings && s.settings.categoryIds) || [];
    let list = D().categories.filter((c) => c.active).sort((a, b) => a.order - b.order);
    if (ids.length) list = list.filter((c) => ids.includes(c.id));
    const counts = {};
    for (const p of activeProducts()) counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    out.categories = list.map((c) => ({ id: c.id, name: c.name, slug: c.slug, image: c.image, description: c.description, count: counts[c.id] || 0 }));
  }
  return out;
}

function findCoupon(code) {
  if (!code) return null;
  const c = D().coupons.find((x) => x.code.toLowerCase() === String(code).trim().toLowerCase());
  if (!c || !c.active) return null;
  if (c.maxUses && c.uses >= c.maxUses) return null;
  if (c.expiresAt && Date.now() > c.expiresAt) return null;
  return c;
}

function couponDiscount(c, subtotal) {
  if (!c) return 0;
  if (c.minTotal && subtotal < c.minTotal) return 0;
  const d = c.type === 'percent' ? (subtotal * c.value) / 100 : c.value;
  return Math.min(Math.round(d), subtotal);
}

/* حساب الطلب من جهة الخادم فقط (لا نثق بأسعار المتصفح) */
function priceOrder({ items, zoneId, coupon }) {
  const errors = [];
  const lines = [];
  const prods = D().products;
  for (const it of Array.isArray(items) ? items.slice(0, 50) : []) {
    const p = prods.find((x) => x.id === it.id);
    const qty = Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), 99);
    if (!p || !p.active) { errors.push('أحد المنتجات لم يعد متاحاً'); continue; }
    if (p.stock != null && p.stock < qty) { errors.push(`الكمية المتاحة من "${p.name}" هي ${p.stock} فقط`); continue; }
    lines.push({ productId: p.id, name: p.name, slug: p.slug, author: p.author || '', image: (p.images || [])[0] || '', price: p.price, qty, total: p.price * qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const cp = findCoupon(coupon);
  const discount = couponDiscount(cp, subtotal);
  const ship = D().settings.shipping;
  const zone = ship.zones.find((z) => z.id === zoneId && z.active !== false);
  let shipping = zone ? Number(zone.price) || 0 : 0;
  const freeShipping = ship.freeOver > 0 && subtotal - discount >= ship.freeOver;
  if (freeShipping) shipping = 0;
  return {
    errors, lines, subtotal, discount, coupon: cp && discount > 0 ? cp.code : '', couponObj: cp,
    zone, shipping, freeShipping, total: Math.max(subtotal - discount, 0) + shipping,
  };
}

module.exports = { publicProduct, activeProducts, sortProducts, searchProducts, resolveSection, catMap, findCoupon, couponDiscount, priceOrder, normalizeArabic };
