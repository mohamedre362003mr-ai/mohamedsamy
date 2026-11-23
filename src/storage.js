'use strict';
/*
 * حفظ الصور المرفوعة:
 *  - Vercel Blob لو موجود BLOB_READ_WRITE_TOKEN (مطلوب على Vercel)
 *  - غير كده: مجلد data/uploads على السيرفر
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { UPLOAD_DIR } = require('./db');
const { uid } = require('./util');

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

// الملف بيتقري في الذاكرة ثم يتحفظ (Vercel لا يسمح بالكتابة على القرص)
function imageUpload(types = /^image\/(jpeg|png|webp|gif)$/) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => cb(null, types.test(file.mimetype)),
  });
}

async function saveImage(file, folder) {
  const name = `${uid(10)}${EXT[file.mimetype] || '.jpg'}`;
  if (USE_BLOB) {
    const { put } = await import('@vercel/blob');
    const r = await put(`${folder}/${name}`, file.buffer, { access: 'public', contentType: file.mimetype, addRandomSuffix: false });
    return r.url;
  }
  const dir = path.join(UPLOAD_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), file.buffer);
  return `/uploads/${folder}/${name}`;
}

// الروابط المسموحة للصور داخل المتجر
const isImageUrl = (u) => typeof u === 'string' && (/^\/(uploads|seed|img)\/[\w./-]+$/.test(u) || /^https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\/\S+$/i.test(u));

module.exports = { USE_BLOB, imageUpload, saveImage, isImageUrl };
