'use strict';
/*
 * تخزين بسيط وآمن في ملفات JSON (بدون أي اعتماديات أصلية).
 * - db.json       : الإعدادات، الأقسام، المنتجات، الطلبات، الصفحة الرئيسية...
 * - analytics.json: الزوار وخط سير كل زائر (يُكتب بشكل منفصل لأنه يتغير كثيراً)
 * الكتابة ذرية (ملف مؤقت ثم إعادة تسمية) ومؤجلة قليلاً لتجميع التغييرات.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function makeStore(file, delay) {
  const full = path.join(DATA_DIR, file);
  let data = null;
  let timer = null;

  function read() {
    if (!fs.existsSync(full)) return null;
    try {
      return JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (e) {
      // لو الملف تالف نحاول من النسخة الاحتياطية
      const bak = full + '.bak';
      if (fs.existsSync(bak)) return JSON.parse(fs.readFileSync(bak, 'utf8'));
      throw e;
    }
  }

  function flush() {
    clearTimeout(timer);
    timer = null;
    if (data == null) return;
    const tmp = full + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data));
    if (fs.existsSync(full)) {
      try { fs.copyFileSync(full, full + '.bak'); } catch (_) { /* ignore */ }
    }
    fs.renameSync(tmp, full);
  }

  return {
    load() { data = read(); return data; },
    get() { return data; },
    set(v) { data = v; flush(); },
    save() { if (!timer) timer = setTimeout(flush, delay); },
    flush,
  };
}

const db = makeStore('db.json', 120);
const analytics = makeStore('analytics.json', 2000);

function flushAll() {
  try { db.flush(); } catch (e) { console.error(e); }
  try { analytics.flush(); } catch (e) { console.error(e); }
}
process.on('SIGINT', () => { flushAll(); process.exit(0); });
process.on('SIGTERM', () => { flushAll(); process.exit(0); });

module.exports = { db, analytics, DATA_DIR, UPLOAD_DIR, flushAll };
