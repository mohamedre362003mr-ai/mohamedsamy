'use strict';
/*
 * طبقة التخزين — تعمل بطريقتين:
 *  1) PostgreSQL (لو موجود DATABASE_URL أو POSTGRES_URL) ← مطلوب على Vercel
 *  2) ملفات JSON داخل مجلد data/ ← للسيرفرات العادية (VPS / Railway / Docker) وللتشغيل المحلي
 *
 * البيانات مقسمة لـ:
 *  - main     : الإعدادات، الأقسام، المنتجات، الصفحة الرئيسية، الكوبونات، الأدمن، الجلسات
 *  - orders   : الطلبات
 *  - visitors : الزوار وخط سير كل زائر
 */
const fs = require('fs');
const path = require('path');

const PG_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || '';
const ON_VERCEL = !!process.env.VERCEL;
const MODE = PG_URL ? 'pg' : 'file';
const DATA_DIR = process.env.DATA_DIR || (ON_VERCEL ? '/tmp/store-data' : path.join(__dirname, '..', 'data'));
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
// على Vercel بدون قاعدة بيانات: البيانات مؤقتة وتضيع
const EPHEMERAL = MODE === 'file' && ON_VERCEL;

let main = null;
let mainDirty = false;
let seedFn = null;

/* ======================= ملفات JSON ======================= */
const FILES = { db: path.join(DATA_DIR, 'db.json'), an: path.join(DATA_DIR, 'analytics.json') };
let fOrders = [];
let fVisitors = {};
let anTimer = null;

function readJSON(file) {
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {
    if (fs.existsSync(`${file}.bak`)) return JSON.parse(fs.readFileSync(`${file}.bak`, 'utf8'));
    throw e;
  }
}
function writeJSON(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  if (fs.existsSync(file)) { try { fs.copyFileSync(file, `${file}.bak`); } catch (_) { /* ignore */ } }
  fs.renameSync(tmp, file);
}
const writeMainFile = () => writeJSON(FILES.db, { ...main, orders: fOrders });
const writeAnalyticsFile = () => { clearTimeout(anTimer); anTimer = null; writeJSON(FILES.an, { visitors: fVisitors }); };
const scheduleAnalytics = () => { if (EPHEMERAL) return writeAnalyticsFile(); if (!anTimer) anTimer = setTimeout(writeAnalyticsFile, 2000); };

/* ======================= PostgreSQL ======================= */
let pool = null;
let mainVersion = -1;
function q(text, params) {
  if (!pool) {
    const { Pool } = require('pg');
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(PG_URL);
    pool = new Pool({ connectionString: PG_URL, ssl: local ? false : { rejectUnauthorized: false }, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
  }
  return pool.query(text, params);
}

async function initPg() {
  await q(`create table if not exists store_kv (key text primary key, value jsonb not null, version integer not null default 1)`);
  await q(`create table if not exists store_orders (id text primary key, number integer, phone text, created_at bigint not null, data jsonb not null)`);
  await q('create index if not exists store_orders_created_idx on store_orders (created_at desc)');
  await q('create index if not exists store_orders_phone_idx on store_orders (phone)');
  await q(`create table if not exists store_visitors (id text primary key, phone text, last_seen bigint not null, data jsonb not null)`);
  await q('create index if not exists store_visitors_seen_idx on store_visitors (last_seen desc)');
  await q('create index if not exists store_visitors_phone_idx on store_visitors (phone)');
  await q('create sequence if not exists store_order_number_seq start 1001');
  await q(`insert into store_kv (key, value) values ('main', $1::jsonb) on conflict (key) do nothing`, [JSON.stringify(seedFn())]);
}

/* ======================= تهيئة ======================= */
let initPromise = null;
function ready() {
  if (!initPromise) {
    initPromise = (async () => {
      if (MODE === 'pg') {
        // أكثر من نسخة ممكن تبدأ في نفس اللحظة على Vercel — نعيد المحاولة مرة لو حصل تعارض
        try { await initPg(); } catch (e) { await new Promise((r) => setTimeout(r, 400)); await initPg(); }
        return;
      }
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const d = readJSON(FILES.db);
      if (d) { fOrders = d.orders || []; delete d.orders; main = d; } else { main = seedFn(); fOrders = []; writeMainFile(); console.log('✓ تم إنشاء بيانات أول تشغيل'); }
      fVisitors = (readJSON(FILES.an) || { visitors: {} }).visitors || {};
    })().catch((e) => { initPromise = null; throw e; });
  }
  return initPromise;
}

// تحميل أحدث نسخة من البيانات الرئيسية (مهم على Vercel لأن أكثر من نسخة من السيرفر تعمل معاً)
async function refresh() {
  await ready();
  if (MODE !== 'pg') return main;
  const r = await q(`select version, case when version <> $1 then value end as value from store_kv where key = 'main'`, [mainVersion]);
  const row = r.rows[0];
  if (row && row.value) { main = row.value; mainVersion = row.version; mainDirty = false; }
  return main;
}

function get() { return main; }
function save() { mainDirty = true; }

async function flush() {
  if (!mainDirty) return;
  mainDirty = false;
  if (MODE === 'pg') {
    const r = await q(`update store_kv set value = $1::jsonb, version = version + 1 where key = 'main' returning version`, [JSON.stringify(main)]);
    if (r.rows[0]) mainVersion = r.rows[0].version;
  } else {
    writeMainFile();
  }
}

/* ======================= الطلبات ======================= */
const orders = {
  async list(limit = 5000) {
    if (MODE === 'pg') return (await q('select data from store_orders order by created_at desc limit $1', [limit])).rows.map((r) => r.data);
    return fOrders.slice(0, limit);
  },
  async get(id) {
    if (MODE === 'pg') return (await q('select data from store_orders where id = $1', [id])).rows[0]?.data || null;
    return fOrders.find((o) => o.id === id) || null;
  },
  async byPhone(phone) {
    if (MODE === 'pg') return (await q('select data from store_orders where phone = $1 order by created_at desc', [phone])).rows.map((r) => r.data);
    return fOrders.filter((o) => o.customer.phone === phone);
  },
  async put(o) {
    if (MODE === 'pg') {
      await q(`insert into store_orders (id, number, phone, created_at, data) values ($1, $2, $3, $4, $5::jsonb)
               on conflict (id) do update set data = excluded.data, phone = excluded.phone`, [o.id, o.number, o.customer.phone, o.createdAt, JSON.stringify(o)]);
      return;
    }
    const i = fOrders.findIndex((x) => x.id === o.id);
    if (i >= 0) fOrders[i] = o; else fOrders.unshift(o);
    mainDirty = true;
  },
  async remove(id) {
    if (MODE === 'pg') { await q('delete from store_orders where id = $1', [id]); return; }
    fOrders = fOrders.filter((o) => o.id !== id);
    mainDirty = true;
  },
  async nextNumber() {
    if (MODE === 'pg') return Number((await q("select nextval('store_order_number_seq') as n")).rows[0].n);
    const n = main.nextOrderNumber || 1001;
    main.nextOrderNumber = n + 1;
    mainDirty = true;
    return n;
  },
};

/* ======================= الزوار ======================= */
const visitors = {
  async get(id) {
    if (MODE === 'pg') return (await q('select data from store_visitors where id = $1', [id])).rows[0]?.data || null;
    return fVisitors[id] || null;
  },
  async put(v) {
    if (MODE === 'pg') {
      await q(`insert into store_visitors (id, phone, last_seen, data) values ($1, $2, $3, $4::jsonb)
               on conflict (id) do update set data = excluded.data, phone = excluded.phone, last_seen = excluded.last_seen`, [v.id, v.phone || null, v.lastSeen, JSON.stringify(v)]);
      if (Math.random() < 0.01) q('delete from store_visitors where last_seen < $1', [Date.now() - 120 * 86400000]).catch(() => {});
      return;
    }
    fVisitors[v.id] = v;
    const keys = Object.keys(fVisitors);
    if (keys.length > 8000) keys.sort((a, b) => fVisitors[a].lastSeen - fVisitors[b].lastSeen).slice(0, 500).forEach((k) => delete fVisitors[k]);
    scheduleAnalytics();
  },
  async list({ since = 0, limit = 100000 } = {}) {
    if (MODE === 'pg') return (await q('select data from store_visitors where last_seen >= $1 order by last_seen desc limit $2', [since, limit])).rows.map((r) => r.data);
    return Object.values(fVisitors).filter((v) => v.lastSeen >= since).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, limit);
  },
  async count() {
    if (MODE === 'pg') return Number((await q('select count(*)::int as n from store_visitors')).rows[0].n);
    return Object.keys(fVisitors).length;
  },
  async byPhone(phone) {
    if (MODE === 'pg') return (await q('select data from store_visitors where phone = $1', [phone])).rows.map((r) => r.data);
    return Object.values(fVisitors).filter((v) => v.phone === phone);
  },
};

function setSeed(fn) { seedFn = fn; }

function flushSync() {
  if (MODE !== 'file' || !main) return;
  try { if (mainDirty) writeMainFile(); } catch (e) { console.error(e); }
  try { writeAnalyticsFile(); } catch (e) { console.error(e); }
}
process.on('SIGINT', () => { flushSync(); process.exit(0); });
process.on('SIGTERM', () => { flushSync(); process.exit(0); });

module.exports = { MODE, ON_VERCEL, EPHEMERAL, DATA_DIR, UPLOAD_DIR, ready, refresh, get, save, flush, orders, visitors, setSeed };
