'use strict';
const crypto = require('crypto');

const uid = (n = 6) => crypto.randomBytes(n).toString('hex');

function slugify(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '') // التشكيل
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || uid(3);
}

function uniqueSlug(base, list, selfId) {
  let s = slugify(base);
  let i = 2;
  const taken = (x) => list.some((it) => it.slug === x && it.id !== selfId);
  const root = s;
  while (taken(s)) s = `${root}-${i++}`;
  return s;
}

const str = (v, max = 500) => (v == null ? '' : String(v).trim().slice(0, max));
const num = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const bool = (v) => v === true || v === 'true' || v === 1 || v === '1' || v === 'on';

// أرقام عربية/هندية → إنجليزية + إزالة المسافات والرموز
function normalizePhone(p) {
  return String(p || '')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[^\d+]/g, '');
}

function parseUA(ua = '') {
  const u = ua.toLowerCase();
  let device = 'كمبيوتر';
  if (/ipad|tablet|(android(?!.*mobile))/.test(u)) device = 'تابلت';
  else if (/mobi|iphone|android/.test(u)) device = 'موبايل';
  let os = 'أخرى';
  if (/iphone|ipad|ios/.test(u)) os = 'iOS';
  else if (/android/.test(u)) os = 'Android';
  else if (/windows/.test(u)) os = 'Windows';
  else if (/mac os/.test(u)) os = 'macOS';
  else if (/linux/.test(u)) os = 'Linux';
  let browser = 'أخرى';
  if (/fban|fbav|fb_iab/.test(u)) browser = 'Facebook';
  else if (/instagram/.test(u)) browser = 'Instagram';
  else if (/tiktok|musical_ly/.test(u)) browser = 'TikTok';
  else if (/edg\//.test(u)) browser = 'Edge';
  else if (/opr\/|opera/.test(u)) browser = 'Opera';
  else if (/samsungbrowser/.test(u)) browser = 'Samsung';
  else if (/chrome|crios/.test(u)) browser = 'Chrome';
  else if (/firefox|fxios/.test(u)) browser = 'Firefox';
  else if (/safari/.test(u)) browser = 'Safari';
  return { device, os, browser };
}

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = { uid, slugify, uniqueSlug, str, num, bool, normalizePhone, parseUA, escHtml };
