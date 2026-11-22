/* =========================================================
   لوحة تحكم المتجر
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const enc = encodeURIComponent;
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  const cur = () => state.settings?.currency || 'ج.م';
  const money = (n) => `${nf.format(Number(n) || 0)} ${esc(cur())}`;
  const dtf = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const dayf = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });
  const timef = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { hour: 'numeric', minute: '2-digit' });
  const fdate = (t) => (t ? dtf.format(new Date(t)) : '—');
  function ago(t) {
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 60) return 'الآن';
    if (s < 3600) return `منذ ${Math.round(s / 60)} د`;
    if (s < 86400) return `منذ ${Math.round(s / 3600)} س`;
    if (s < 86400 * 30) return `منذ ${Math.round(s / 86400)} يوم`;
    return fdate(t);
  }
  const waNum = (n) => { let d = String(n || '').replace(/[^\d]/g, ''); if (d.startsWith('00')) d = d.slice(2); if (/^01\d{9}$/.test(d)) d = `2${d}`; return d; };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------------- أيقونات ---------------- */
  const ICONS = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    orders: '<path d="M5.5 8h13l-1 12.5h-11z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 1 2-2h13v3H6a2 2 0 0 1-2-1"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    wallet: '<path d="M4 7a2 2 0 0 1 2-2h12v3"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h2"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    note: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 12h6M9 16h6M9 8h3"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 18 5-5 4 4 3-3 6 6"/>',
    star: '<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z"/>',
    type: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h12l2-8H6"/>',
    flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L12 6.3"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c3-1 6-1 6-1s0 3-1 6l-7 7-5-5z"/><circle cx="15" cy="9" r="1.5"/>',
    truck2: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  const icon = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const MARK = '<svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true"><path d="M10 18q11-5 22 0v30q-11-5-22 0z" fill="#e2b86b"/><path d="M54 18q-11-5-22 0v30q11-5 22 0z" fill="#f4dfb4"/></svg>';

  const STATUS = { new: 'جديد', confirmed: 'تم التأكيد', processing: 'قيد التجهيز', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' };
  const statusBadge = (s) => `<span class="badge st-${s}">${STATUS[s] || s}</span>`;

  const state = { me: null, settings: null, categories: [], products: [], lastCount: null, newCount: 0 };

  /* ---------------- API ---------------- */
  async function api(url, opts = {}) {
    const isForm = opts.body instanceof FormData;
    const res = await fetch(url, {
      method: opts.method || (opts.body ? 'POST' : 'GET'),
      headers: opts.body && !isForm ? { 'Content-Type': 'application/json' } : {},
      body: opts.body ? (isForm ? opts.body : JSON.stringify(opts.body)) : undefined,
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !url.endsWith('/login')) { showLogin(); throw new Error('انتهت الجلسة، سجّل الدخول مرة أخرى'); }
    if (!res.ok) throw new Error(data.error || 'حدث خطأ');
    return data;
  }

  /* ---------------- Toast / Modal / Confirm ---------------- */
  function toast(msg, type = 'ok') {
    const t = h(`<div class="toast ${type}">${icon(type === 'err' ? 'info' : 'check')}<span>${esc(msg)}</span></div>`);
    $('#toasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 3000);
  }

  let lockN = 0;
  let lockY = 0;
  function lock() { if (lockN++) return; lockY = scrollY; Object.assign(document.body.style, { position: 'fixed', top: `-${lockY}px`, left: '0', right: '0', width: '100%' }); document.body.classList.add('scroll-locked'); }
  function unlock() { if (!lockN || --lockN) return; Object.assign(document.body.style, { position: '', top: '', left: '', right: '', width: '' }); document.body.classList.remove('scroll-locked'); scrollTo({ top: lockY, behavior: 'instant' }); }

  function modal({ title, body, foot = '', size = '', onClose }) {
    const bg = h(`<div class="modal-bg" role="dialog" aria-modal="true"><div class="modal ${size}"><div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-x aria-label="إغلاق">${icon('x')}</button></div><div class="modal-body"></div>${foot !== null ? `<div class="modal-foot">${foot}</div>` : ''}</div></div>`);
    const b = $('.modal-body', bg);
    if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
    document.body.appendChild(bg);
    lock();
    const close = () => { if (!bg.isConnected) return; bg.remove(); unlock(); document.removeEventListener('keydown', key); onClose && onClose(); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    $('[data-x]', bg).addEventListener('click', close);
    bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
    return { el: bg, body: b, close, foot: $('.modal-foot', bg) };
  }
  function confirmBox(text, { okText = 'تأكيد', danger = true } = {}) {
    return new Promise((resolve) => {
      let done = false;
      const m = modal({ title: 'تأكيد', size: 'sm', body: `<p>${esc(text)}</p>`, foot: `<button class="btn ${danger ? 'btn-danger' : ''}" data-ok>${esc(okText)}</button><button class="btn btn-ghost" data-cancel>إلغاء</button>`, onClose: () => { if (!done) resolve(false); } });
      $('[data-ok]', m.el).addEventListener('click', () => { done = true; m.close(); resolve(true); });
      $('[data-cancel]', m.el).addEventListener('click', () => m.close());
    });
  }
  async function busy(btn, fn) {
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span>';
    try { return await fn(); } catch (e) { toast(e.message, 'err'); return undefined; } finally { btn.disabled = false; btn.innerHTML = old; }
  }

  /* ---------------- معالجة الصور (قص + ضبط المقاس تلقائياً) ---------------- */
  const SPECS = {
    product: { w: 800, h: 1200, ratio: 'نسبة 2:3 (طولي مثل غلاف الكتاب)' },
    category: { w: 600, h: 600, ratio: 'نسبة 1:1 (مربع)' },
    slide: { w: 1920, h: 720, ratio: 'نسبة 8:3 (عرضي) — للكمبيوتر' },
    slideMobile: { w: 1080, h: 1350, ratio: 'نسبة 4:5 (طولي) — للموبايل' },
    banner1: { w: 1920, h: 600, ratio: 'بانر بعرض الصفحة' },
    banner2: { w: 1200, h: 700, ratio: 'بانرين جنب بعض' },
    banner3: { w: 900, h: 900, ratio: '3 بانرات جنب بعض (مربع)' },
    bannerMobile: { w: 1080, h: 1080, ratio: 'نسخة الموبايل (مربع)' },
    logo: { w: 600, h: 240, ratio: 'أقصى مقاس — يفضل PNG بخلفية شفافة', contain: true },
  };
  async function loadBitmap(file) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) {
      return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('تعذر قراءة الصورة')); i.src = URL.createObjectURL(file); });
    }
  }
  const toBlob = (cv, type, q) => new Promise((r) => cv.toBlob(r, type, q));
  async function processImage(file, spec) {
    const s = SPECS[spec];
    const img = await loadBitmap(file);
    const bw = img.width;
    const bh = img.height;
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    if (s.contain) {
      const k = Math.min(s.w / bw, s.h / bh, 1);
      cv.width = Math.round(bw * k);
      cv.height = Math.round(bh * k);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const blob = await toBlob(cv, 'image/png');
      return { blob, ext: 'png', small: false, cropped: false };
    }
    cv.width = s.w;
    cv.height = s.h;
    const k = Math.max(s.w / bw, s.h / bh);
    const sw = s.w / k;
    const sh = s.h / k;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, s.w, s.h);
    ctx.drawImage(img, (bw - sw) / 2, (bh - sh) / 2, sw, sh, 0, 0, s.w, s.h);
    let blob = await toBlob(cv, 'image/webp', 0.86);
    let ext = 'webp';
    if (!blob || blob.type !== 'image/webp') { blob = await toBlob(cv, 'image/jpeg', 0.88); ext = 'jpg'; }
    return { blob, ext, small: bw < s.w * 0.75 || bh < s.h * 0.75, cropped: Math.abs(bw / bh - s.w / s.h) > 0.03, src: `${bw}×${bh}` };
  }
  async function uploadFile(file, spec) {
    if (!/^image\//.test(file.type)) throw new Error('اختر ملف صورة');
    const p = await processImage(file, spec);
    const fd = new FormData();
    fd.append('file', p.blob, `img.${p.ext}`);
    const r = await api('/api/admin/upload', { body: fd });
    if (p.small) toast(`تنبيه: الصورة (${p.src}) أصغر من المقاس المطلوب وقد تظهر بجودة أقل`, 'err');
    else if (p.cropped) toast('تم قص الصورة تلقائياً لتناسب المقاس المطلوب');
    return r.url;
  }

  function uploader({ spec, value, multiple = false, onChange }) {
    const s = SPECS[spec];
    let list = multiple ? [...(value || [])] : value ? [value] : [];
    const wide = s.w / s.h > 1.3;
    const el = h(`<div class="uploader ${wide ? 'wide' : ''}"><div class="spec">${icon('info', 'ico-sm')}<span>المقاس المطلوب: العرض <b>${s.w}</b> بكسل × الارتفاع <b>${s.h}</b> بكسل — ${s.ratio}${s.contain ? '' : '. لو الصورة بمقاس مختلف هيتم قصها من المنتصف تلقائياً.'}</span></div><div class="imgs"></div></div>`);
    const box = $('.imgs', el);
    const ar = `${s.w} / ${s.h}`;
    const changed = () => onChange && onChange(get());
    function render() {
      box.innerHTML = '';
      list.forEach((url, i) => {
        const t = h(`<div class="img-tile" style="aspect-ratio:${ar}${s.contain ? ';background:repeating-conic-gradient(#eef1f5 0 25%,#fff 0 50%) 50%/16px 16px' : ''}"><img src="${esc(url)}" alt="" style="${s.contain ? 'object-fit:contain' : ''}">${multiple && i === 0 ? '<span class="main-tag">الرئيسية</span>' : ''}<div class="tools">${multiple && list.length > 1 ? `<button type="button" data-mv="-1" title="تقديم">${icon('right')}</button><button type="button" data-mv="1" title="تأخير">${icon('left')}</button>` : ''}<button type="button" data-del title="حذف">${icon('trash')}</button></div></div>`);
        $('[data-del]', t).addEventListener('click', () => { list.splice(i, 1); render(); changed(); });
        $$('[data-mv]', t).forEach((b) => b.addEventListener('click', () => { const j = i + Number(b.dataset.mv); if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; render(); changed(); }));
        box.appendChild(t);
      });
      if (multiple || !list.length) {
        const add = h(`<label class="add-tile" style="aspect-ratio:${ar}">${icon('plus')}<span>${list.length ? 'إضافة صورة' : 'رفع صورة'}</span><span class="small" dir="ltr">${s.w} × ${s.h}</span><input type="file" accept="image/png,image/jpeg,image/webp" ${multiple ? 'multiple' : ''}></label>`);
        const inp = $('input', add);
        const handle = async (files) => {
          files = Array.from(files || []).slice(0, multiple ? 10 : 1);
          if (!files.length) return;
          add.classList.add('busy');
          add.innerHTML = '<span class="spin dark"></span><span>جاري الرفع...</span>';
          for (const f of files) {
            try { const url = await uploadFile(f, spec); if (multiple) list.push(url); else list = [url]; } catch (e) { toast(e.message, 'err'); }
          }
          render();
          changed();
        };
        inp.addEventListener('change', () => handle(inp.files));
        add.addEventListener('dragover', (e) => { e.preventDefault(); add.classList.add('over'); });
        add.addEventListener('dragleave', () => add.classList.remove('over'));
        add.addEventListener('drop', (e) => { e.preventDefault(); add.classList.remove('over'); handle(e.dataTransfer.files); });
        box.appendChild(add);
      }
    }
    const get = () => (multiple ? list.slice() : list[0] || '');
    render();
    return { el, get };
  }

  /* ---------------- تسجيل الدخول ---------------- */
  function showLogin() {
    stopPolling();
    document.title = 'تسجيل الدخول — لوحة التحكم';
    $('#root').innerHTML = `<div class="login"><form class="login-card" id="loginForm" novalidate>
      <div class="mark">${MARK}</div>
      <h1>لوحة تحكم المتجر</h1><p>سجّل الدخول لإدارة متجرك</p>
      <div class="stack">
        <div class="field"><label for="le">البريد الإلكتروني</label><input class="input ltr" id="le" type="email" autocomplete="username" required></div>
        <div class="field"><label for="lp">كلمة المرور</label><div class="input-group"><input class="input ltr" id="lp" type="password" autocomplete="current-password" required><button type="button" class="addon" id="lpShow">${icon('eye', 'ico-sm')}</button></div></div>
        <p class="small" id="lerr" style="color:var(--err);min-height:1em"></p>
        <button class="btn btn-block" style="min-height:48px" id="lbtn">دخول</button>
      </div></form></div>`;
    $('#lpShow').addEventListener('click', () => { const i = $('#lp'); i.type = i.type === 'password' ? 'text' : 'password'; });
    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      $('#lerr').textContent = '';
      const btn = $('#lbtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spin"></span>';
      try {
        await api('/api/admin/login', { body: { email: $('#le').value, password: $('#lp').value } });
        await boot();
      } catch (err) {
        $('#lerr').textContent = err.message;
        btn.disabled = false;
        btn.textContent = 'دخول';
        $('.login-card').animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 });
      }
    });
    setTimeout(() => $('#le')?.focus(), 100);
  }

  /* ---------------- الهيكل ---------------- */
  const NAV = [
    ['الرئيسية', [['#/', 'dash', 'لوحة المعلومات'], ['#/orders', 'orders', 'الطلبات', 'orders'], ['#/customers', 'users', 'العملاء وخط السير'], ['#/visitors', 'eye', 'الزوار']]],
    ['المتجر', [['#/products', 'book', 'المنتجات'], ['#/categories', 'grid', 'الأقسام'], ['#/homepage', 'layout', 'تصميم الصفحة الرئيسية'], ['#/coupons', 'tag', 'كوبونات الخصم']]],
    ['الإعدادات', [['#/shipping', 'truck', 'أسعار الشحن'], ['#/payment', 'wallet', 'الدفع وواتساب'], ['#/settings', 'cog', 'إعدادات المتجر']]],
  ];
  function renderShell() {
    $('#root').innerHTML = `<div class="app">
      <aside class="side" id="side">
        <div class="side-head"><span class="mark">${MARK}</span><div style="min-width:0"><b>${esc(state.settings.storeName)}</b><small>لوحة التحكم</small></div></div>
        <nav>${NAV.map(([g, items]) => `<div class="nav-title">${g}</div><div class="nav">${items.map(([href, ic, label, badge]) => `<a href="${href}" data-href="${href}">${icon(ic)}<span>${label}</span>${badge ? '<span class="count" id="newBadge" hidden>0</span>' : ''}</a>`).join('')}</div>`).join('')}</nav>
        <div class="side-foot"><a href="/" target="_blank" rel="noopener">${icon('ext')} عرض المتجر</a><button id="logoutBtn">${icon('logout')} تسجيل الخروج</button></div>
      </aside>
      <div class="overlay" id="overlay" hidden></div>
      <div class="main">
        <header class="topbar" id="topbar"><button class="icon-btn menu-btn" id="menuBtn" aria-label="القائمة">${icon('menu')}</button><h1 id="pageTitle"></h1><div class="row" id="topActions"></div></header>
        <div class="content" id="content"></div>
      </div>
    </div>`;
    const side = $('#side');
    const ov = $('#overlay');
    const close = () => { if (!side.classList.contains('open')) return; side.classList.remove('open'); ov.classList.remove('show'); setTimeout(() => { ov.hidden = true; }, 300); unlock(); };
    $('#menuBtn').addEventListener('click', () => { ov.hidden = false; lock(); requestAnimationFrame(() => { side.classList.add('open'); ov.classList.add('show'); }); });
    ov.addEventListener('click', close);
    $$('.nav a', side).forEach((a) => a.addEventListener('click', close));
    matchMedia('(min-width: 961px)').addEventListener?.('change', (e) => { if (e.matches) close(); });
    $('#logoutBtn').addEventListener('click', async () => { await api('/api/admin/logout', { body: {} }).catch(() => {}); showLogin(); });
    addEventListener('scroll', () => $('#topbar')?.classList.toggle('scrolled', scrollY > 4), { passive: true });
  }

  function page(title, html, actions = '') {
    $('#pageTitle').textContent = title;
    $('#topActions').innerHTML = actions;
    const c = $('#content');
    c.innerHTML = html;
    c.style.animation = 'none';
    void c.offsetWidth;
    c.style.animation = '';
    document.title = `${title} — لوحة التحكم`;
    return c;
  }
  const loading = () => page($('#pageTitle')?.textContent || '', '<div class="empty"><span class="spin dark" style="width:28px;height:28px"></span></div>');

  /* ---------------- الراوتر ---------------- */
  let pageCleanup = null;
  const ROUTES = [
    [/^#?\/?$/, pageDashboard],
    [/^#\/orders$/, pageOrders],
    [/^#\/orders\/(\w+)$/, (id) => { pageOrders(); openOrder(id); }],
    [/^#\/customers$/, pageCustomers],
    [/^#\/customers\/(.+)$/, pageCustomer],
    [/^#\/visitors$/, pageVisitors],
    [/^#\/visitors\/(\w+)$/, pageVisitor],
    [/^#\/products$/, pageProducts],
    [/^#\/products\/new$/, () => pageProductEdit(null)],
    [/^#\/products\/(\w+)$/, pageProductEdit],
    [/^#\/categories$/, pageCategories],
    [/^#\/homepage$/, pageHomepage],
    [/^#\/shipping$/, pageShipping],
    [/^#\/payment$/, pagePayment],
    [/^#\/coupons$/, pageCoupons],
    [/^#\/settings$/, pageSettings],
  ];
  let dirty = false;
  async function route() {
    if (pageCleanup) { pageCleanup(); pageCleanup = null; }
    dirty = false;
    const hash = location.hash || '#/';
    $$('.nav a').forEach((a) => { const hr = a.dataset.href; a.classList.toggle('active', hr === '#/' ? hash === '#/' || hash === '' : hash.startsWith(hr)); });
    const r = ROUTES.find(([re]) => re.test(hash));
    scrollTo({ top: 0, behavior: 'instant' });
    try {
      if (r) await r[1](...hash.match(r[0]).slice(1).map(decodeURIComponent));
      else location.hash = '#/';
    } catch (e) {
      if (state.me) page('خطأ', `<div class="card empty">${icon('info')}<p>${esc(e.message)}</p></div>`);
    }
  }
  addEventListener('hashchange', route);
  addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------------- متابعة الطلبات الجديدة ---------------- */
  let pollT = null;
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18].forEach((d, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = i ? 1046 : 784; g.gain.setValueAtTime(0.0001, ctx.currentTime + d); g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.25); o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.3); });
    } catch (_) { /* ignore */ }
  }
  async function poll() {
    try {
      const r = await api('/api/admin/orders?status=new');
      const total = r.counts.all || 0;
      state.newCount = r.counts.new || 0;
      const b = $('#newBadge');
      if (b) { b.hidden = !state.newCount; b.textContent = state.newCount; }
      document.title = document.title.replace(/^\(\d+\) /, '');
      if (state.newCount) document.title = `(${state.newCount}) ${document.title}`;
      if (state.lastCount != null && total > state.lastCount) {
        beep();
        toast(`🎉 وصلك ${total - state.lastCount > 1 ? `${total - state.lastCount} طلبات جديدة` : 'طلب جديد'}!`);
        if (/^#\/(orders)?$/.test(location.hash || '#/') || location.hash === '') route();
      }
      state.lastCount = total;
    } catch (_) { /* ignore */ }
  }
  function startPolling() { stopPolling(); poll(); pollT = setInterval(poll, 25000); }
  function stopPolling() { clearInterval(pollT); }

  /* ================= لوحة المعلومات ================= */
  async function pageDashboard() {
    loading();
    $('#pageTitle').textContent = 'لوحة المعلومات';
    const s = await api('/api/admin/stats');
    const max = Math.max(...s.days.map((d) => d.revenue), 1);
    const f = s.funnel;
    const fmax = Math.max(f.visitors, 1);
    const k = (i, cls, ic, label, val, sub) => `<div class="card kpi ${cls}" style="--i:${i}"><span class="ki">${icon(ic)}</span><div style="min-width:0"><small>${label}</small><b>${val}</b>${sub ? `<span class="sub">${sub}</span>` : ''}</div></div>`;
    const c = page('لوحة المعلومات', `<div class="stack">
      <div class="kpis">
        ${k(0, 'k1', 'money', 'إجمالي المبيعات', money(s.revenueAll), `تم تسليمه: ${money(s.revenue)}`)}
        ${k(1, 'k2', 'orders', 'طلبات اليوم', s.ordersToday, `بقيمة ${money(s.revenueToday)}`)}
        ${k(2, 'k3', 'bell', 'طلبات تحتاج مراجعة', s.pending, `من إجمالي ${s.ordersCount} طلب`)}
        ${k(3, 'k4', 'eye', 'زوار اليوم', s.visitorsToday, `${s.customers} عميل اشترى`)}
      </div>
      <div class="cols-main">
        <div class="card"><div class="card-head"><div><h2>المبيعات آخر 14 يوم</h2><p>مرّر على العمود لعرض التفاصيل</p></div></div>
          <div class="card-pad"><div class="chart">${s.days.map((d, i) => { const hp = Math.max((d.revenue / max) * 100, 2); const dt = new Date(d.date); return `<div class="bar ${i === 13 ? 'today' : ''}" style="--i:${i};--h:${hp * 1.5}px"><span class="tip">${dayf.format(dt)}<br>${money(d.revenue)} • ${d.orders} طلب • ${d.visitors} زائر</span><i style="height:${hp}%"></i><span>${dt.getDate()}/${dt.getMonth() + 1}</span></div>`; }).join('')}</div></div>
        </div>
        <div class="card"><div class="card-head"><div><h2>رحلة الشراء (30 يوم)</h2><p>من الزيارة حتى الطلب</p></div></div>
          <div class="card-pad funnel">${[['زاروا المتجر', f.visitors], ['شاهدوا منتج', f.product], ['أضافوا للسلة', f.cart], ['بدأوا الطلب', f.checkout], ['أكملوا الطلب', f.orders]].map(([l, v], i) => `<div class="fn-row"><div class="l"><span>${l}</span><b>${v} <small class="muted">(${Math.round((v / fmax) * 100)}%)</small></b></div><div class="tr"><div class="fl" style="width:${(v / fmax) * 100}%;animation-delay:${i * 100}ms"></div></div></div>`).join('')}
            <p class="small muted">معدل التحويل: <b>${f.visitors ? ((f.orders / f.visitors) * 100).toFixed(1) : 0}%</b></p>
          </div>
        </div>
      </div>
      <div class="cols-main">
        <div class="card"><div class="card-head"><h2>أحدث الطلبات</h2><a class="btn btn-ghost btn-sm" href="#/orders">كل الطلبات</a></div>
          ${s.recent.length ? s.recent.map((o) => `<a class="list-row" href="#/orders/${o.id}"><span class="badge nodot" style="background:var(--surface-2)">#${o.number}</span><div class="t"><b>${esc(o.name)}</b><small>${esc(o.governorate)} • ${ago(o.createdAt)}</small></div>${statusBadge(o.status)}<b class="hide-m">${money(o.total)}</b></a>`).join('') : `<div class="empty">${icon('orders')}<p>لا توجد طلبات بعد</p></div>`}
        </div>
        <div class="stack">
          <div class="card"><div class="card-head"><h2>الأكثر مبيعاً</h2></div>
            ${s.topProducts.length ? s.topProducts.map((p) => `<div class="list-row"><img src="${esc(p.image)}" alt=""><div class="t"><b>${esc(p.name)}</b><small>${p.qty} نسخة • ${money(p.revenue)}</small></div></div>`).join('') : '<div class="empty"><p>لا توجد مبيعات بعد</p></div>'}
          </div>
          <div class="card card-pad"><h2 style="font-size:16px;margin-bottom:12px">مصادر الزيارات</h2>
            ${s.sources.length ? `<div class="funnel">${s.sources.map(([n, v]) => `<div class="fn-row"><div class="l"><span>${esc(n)}</span><b>${v}</b></div><div class="tr"><div class="fl" style="width:${(v / fmax) * 100}%;background:linear-gradient(90deg,var(--gold),#e6b768)"></div></div></div>`).join('')}</div>` : '<p class="muted small">لا توجد بيانات بعد</p>'}
            <div class="row" style="margin-top:14px">${s.devices.map(([d, v]) => `<span class="badge nodot">${icon(d === 'كمبيوتر' ? 'monitor' : 'phone', 'ico-sm')} ${esc(d)}: ${v}</span>`).join('')}</div>
          </div>
        </div>
      </div>
      ${s.outOfStock ? `<div class="card card-pad row" style="background:var(--warn-soft);border-color:#f3dcae">${icon('info')}<span>يوجد <b>${s.outOfStock}</b> منتج نفدت كميته.</span><a class="btn btn-sm btn-gold" href="#/products">مراجعة المنتجات</a></div>` : ''}
    </div>`, '<a class="btn btn-sm" href="#/products/new">' + icon('plus', 'ico-sm') + ' منتج جديد</a>');
    return c;
  }

  /* ================= الطلبات ================= */
  let ordersFilter = { status: 'all', q: '' };
  async function pageOrders() {
    if (!$('#ordersBox')) {
      page('الطلبات', `<div class="stack">
        <div class="row"><div class="tabs" id="stTabs"></div><div class="spacer"></div><div class="search-in">${icon('search')}<input class="input" id="oq" placeholder="بحث بالاسم أو الهاتف أو رقم الطلب" value="${esc(ordersFilter.q)}"></div></div>
        <div class="card" id="ordersBox"><div class="empty"><span class="spin dark"></span></div></div></div>`);
      let t;
      $('#oq').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { ordersFilter.q = e.target.value.trim(); loadOrders(); }, 300); });
    }
    await loadOrders();
  }
  async function loadOrders() {
    const r = await api(`/api/admin/orders?status=${ordersFilter.status}&q=${enc(ordersFilter.q)}`);
    const tabs = $('#stTabs');
    if (!tabs) return;
    tabs.innerHTML = [['all', 'الكل'], ...Object.entries(STATUS)].map(([k, l]) => `<button data-st="${k}" class="${ordersFilter.status === k ? 'active' : ''}">${l} <i>${r.counts[k] || 0}</i></button>`).join('');
    $$('button', tabs).forEach((b) => b.addEventListener('click', () => { ordersFilter.status = b.dataset.st; loadOrders(); }));
    const box = $('#ordersBox');
    if (!r.orders.length) { box.innerHTML = `<div class="empty">${icon('orders')}<p>لا توجد طلبات ${ordersFilter.status !== 'all' ? `بحالة "${STATUS[ordersFilter.status]}"` : ''}</p></div>`; return; }
    box.innerHTML = `<div class="tbl-wrap"><table class="tbl rt"><thead><tr><th>الطلب</th><th>العميل</th><th>المحافظة</th><th>الكتب</th><th>الإجمالي</th><th>الدفع</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
      ${r.orders.map((o) => `<tr class="click ${Date.now() - o.createdAt < 60000 ? 'new-row' : ''}" data-id="${o.id}">
        <td class="num">#${o.number}${o.source === 'landing' ? ' <span class="badge nodot tag-gold" title="من صفحة هبوط">LP</span>' : ''}</td>
        <td><b>${esc(o.name)}</b><div class="small muted ltr" style="text-align:right">${esc(o.phone)}</div></td>
        <td class="hide-m">${esc(o.governorate)}</td>
        <td class="hide-m">${o.items}</td>
        <td class="num" data-label="الإجمالي">${money(o.total)}</td>
        <td class="c-full">${o.receipt ? `<span class="badge tag-ok" title="رفع الإيصال">${icon('receipt', 'ico-sm')} إيصال</span> ` : ''}${o.whatsappClicked ? `<span class="badge nodot" style="background:#e3f8eb;color:#1faa53">${icon('chat', 'ico-sm')} واتساب</span>` : ''}${!o.receipt && !o.whatsappClicked ? '<span class="small muted">لم يؤكد بعد</span>' : ''}</td>
        <td class="c-end">${statusBadge(o.status)}</td>
        <td class="small muted c-full">${fdate(o.createdAt)}</td>
      </tr>`).join('')}</tbody></table></div>`;
    $$('tr[data-id]', box).forEach((tr) => tr.addEventListener('click', () => openOrder(tr.dataset.id)));
  }

  async function openOrder(id) {
    let data;
    try { data = await api(`/api/admin/orders/${id}`); } catch (e) { return toast(e.message, 'err'); }
    const o = data.order;
    const c = o.customer;
    const wa = `https://wa.me/${waNum(c.phone)}?text=${enc(`مرحباً ${c.name} 👋\nبخصوص طلبك رقم #${o.number} من ${state.settings.storeName}`)}`;
    const m = modal({
      title: `طلب #${o.number} ${statusBadge(o.status)}`,
      size: 'lg',
      body: `<div class="stack print-area">
        <div class="grid-2">
          <div class="card card-pad"><h3 style="font-size:15px;margin-bottom:12px">بيانات العميل</h3><div class="info-list">
            <div>${icon('users')}<span><b>${esc(c.name)}</b>${data.previousOrders ? ` <span class="badge nodot tag-gold">عميل متكرر — ${data.previousOrders} طلب سابق</span>` : ''}</span></div>
            <div>${icon('phone')}<span><a class="ltr" href="tel:${esc(c.phone)}">${esc(c.phone)}</a>${c.phone2 ? ` • <a class="ltr" href="tel:${esc(c.phone2)}">${esc(c.phone2)}</a>` : ''}</span></div>
            <div>${icon('pin')}<span>${esc([c.governorate, c.city, c.address].filter(Boolean).join(' - '))}</span></div>
            ${c.notes ? `<div>${icon('note')}<span>${esc(c.notes)}</span></div>` : ''}
            <div>${icon('clock')}<span>${fdate(o.createdAt)} • ${o.source === 'landing' ? 'من صفحة هبوط' : 'من المتجر'}</span></div>
          </div>
          <div class="row no-print" style="margin-top:14px"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${wa}">${icon('chat', 'ico-sm')} مراسلة واتساب</a><a class="btn btn-ghost btn-sm" href="tel:${esc(c.phone)}">${icon('phone', 'ico-sm')} اتصال</a><a class="btn btn-ghost btn-sm" href="#/customers/${enc(c.phone)}">${icon('eye', 'ico-sm')} خط سير العميل</a></div></div>
          <div class="card card-pad"><h3 style="font-size:15px;margin-bottom:12px">الدفع</h3>
            <div class="info-list"><div>${icon(o.whatsappClicked ? 'check' : 'clock')}<span>${o.whatsappClicked ? 'العميل ضغط زر تأكيد الدفع على واتساب' : 'العميل لم يضغط زر واتساب بعد'}</span></div></div>
            ${o.receipt ? `<a href="${esc(o.receipt)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:12px"><img class="receipt-img" src="${esc(o.receipt)}" alt="إيصال الدفع"></a>` : '<p class="muted small" style="margin-top:10px">لم يتم رفع صورة إيصال من الموقع (قد يكون أرسلها على واتساب).</p>'}
          </div>
        </div>
        <div class="card"><div class="card-head"><h3 style="font-size:15px">المنتجات</h3></div><div class="order-items" style="padding:0 20px">${o.items.map((i) => `<div class="list-row"><img src="${esc(i.image)}" alt=""><div class="t"><b>${esc(i.name)}</b><small>${money(i.price)} × ${i.qty}</small></div><b>${money(i.total)}</b></div>`).join('')}</div>
          <div class="card-pad" style="border-top:1px solid var(--line);display:grid;gap:6px">
            <div class="row"><span>المجموع</span><span class="spacer"></span><b>${money(o.subtotal)}</b></div>
            ${o.discount ? `<div class="row" style="color:var(--ok)"><span>خصم ${esc(o.coupon)}</span><span class="spacer"></span><b>- ${money(o.discount)}</b></div>` : ''}
            <div class="row"><span>الشحن (${esc(c.governorate)})</span><span class="spacer"></span><b>${o.shipping ? money(o.shipping) : 'مجاني'}</b></div>
            <div class="row" style="font-size:17px"><b>الإجمالي</b><span class="spacer"></span><b style="color:var(--primary)">${money(o.total)}</b></div>
          </div></div>
        <div class="grid-2 no-print">
          <div class="card card-pad stack"><h3 style="font-size:15px">تحديث حالة الطلب</h3>
            <select class="input" id="oStatus">${Object.entries(STATUS).map(([k, l]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <input class="input" id="oNote" placeholder="ملاحظة (اختياري) مثل رقم الشحنة">
            <button class="btn" id="oSave">${icon('check', 'ico-sm')} حفظ الحالة</button>
            <div class="field"><label>ملاحظات داخلية (لا تظهر للعميل)</label><textarea class="input" id="oAdminNote" style="min-height:70px">${esc(o.adminNote || '')}</textarea></div>
          </div>
          <div class="card card-pad"><h3 style="font-size:15px;margin-bottom:10px">سجل الطلب</h3><div class="timeline">${o.statusHistory.slice().reverse().map((s) => `<div class="tl-item"><span class="ti">${icon(s.by === 'admin' ? 'edit' : 'clock')}</span><div class="tt">${statusBadge(s.status)} ${s.note ? `<div style="margin-top:4px">${esc(s.note)}</div>` : ''}</div><span class="tm">${fdate(s.at)}</span></div>`).join('')}</div></div>
        </div>
      </div>`,
      foot: `<button class="btn btn-ghost" id="oPrint">${icon('print', 'ico-sm')} طباعة</button><span class="spacer"></span><button class="btn btn-ghost" id="oDel" style="color:var(--err)">${icon('trash', 'ico-sm')} حذف الطلب</button>`,
      onClose: () => { if (location.hash.startsWith('#/orders/')) history.replaceState(null, '', '#/orders'); },
    });
    $('#oSave', m.el).addEventListener('click', (e) => busy(e.currentTarget, async () => {
      await api(`/api/admin/orders/${o.id}`, { method: 'PATCH', body: { status: $('#oStatus', m.el).value, note: $('#oNote', m.el).value, adminNote: $('#oAdminNote', m.el).value } });
      toast('تم تحديث الطلب');
      m.close();
      if ($('#ordersBox')) loadOrders();
      poll();
    }));
    $('#oPrint', m.el).addEventListener('click', () => print());
    $('#oDel', m.el).addEventListener('click', async () => {
      if (!(await confirmBox(`حذف الطلب #${o.number} نهائياً؟ لا يمكن التراجع.`, { okText: 'حذف' }))) return;
      await api(`/api/admin/orders/${o.id}`, { method: 'DELETE' });
      toast('تم حذف الطلب');
      m.close();
      if ($('#ordersBox')) loadOrders();
      poll();
    });
  }

  /* ================= العملاء وخط السير ================= */
  async function pageCustomers() {
    page('العملاء وخط السير', `<div class="stack"><div class="row"><p class="muted small" style="flex:1 1 300px">كل عميل اشترى من المتجر — اضغط على العميل لعرض طلباته وخط سيره الكامل داخل الموقع.</p><div class="search-in">${icon('search')}<input class="input" id="cq" placeholder="بحث بالاسم أو الهاتف"></div></div><div class="card" id="cBox"><div class="empty"><span class="spin dark"></span></div></div></div>`);
    const load = async (q = '') => {
      const { customers } = await api(`/api/admin/customers?q=${enc(q)}`);
      const box = $('#cBox');
      if (!box) return;
      box.innerHTML = customers.length ? `<div class="tbl-wrap"><table class="tbl rt"><thead><tr><th>العميل</th><th>الهاتف</th><th>المحافظة</th><th>الطلبات</th><th>إجمالي المشتريات</th><th>آخر طلب</th></tr></thead><tbody>${customers.map((c) => `<tr class="click" data-p="${esc(c.phone)}"><td><b>${esc(c.name)}</b></td><td class="ltr small" style="text-align:right">${esc(c.phone)}</td><td class="hide-m">${esc(c.governorate)}</td><td data-label="الطلبات">${c.orders}</td><td class="num c-end">${money(c.spent)}</td><td class="small muted" data-label="آخر طلب">${ago(c.last)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${icon('users')}<p>لا يوجد عملاء بعد</p></div>`;
      $$('tr[data-p]', box).forEach((tr) => tr.addEventListener('click', () => { location.hash = `#/customers/${enc(tr.dataset.p)}`; }));
    };
    let t;
    $('#cq').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => load(e.target.value.trim()), 300); });
    await load();
  }

  const EV = {
    page: ['eye', (e) => `زار صفحة <b>${esc(e.title || e.path)}</b>`],
    product: ['book', (e) => `شاهد كتاب <b>${esc(e.data?.name || e.title)}</b>`],
    category: ['grid', (e) => `تصفح قسم <b>${esc(e.title)}</b>`],
    search: ['search', (e) => `بحث عن <b>"${esc(e.data?.q || e.title)}"</b>`],
    add_to_cart: ['cart', (e) => `أضاف للسلة <b>${esc(e.data?.name || e.title)}</b>${e.data?.qty > 1 ? ` × ${e.data.qty}` : ''}`],
    remove_from_cart: ['trash', (e) => `حذف من السلة <b>${esc(e.data?.name || e.title)}</b>`],
    cart: ['cart', () => 'فتح السلة'],
    checkout: ['wallet', (e) => `بدأ إتمام الطلب${e.data?.items ? ` (${e.data.items} كتاب — ${money(e.data.total)})` : ''}`],
    landing: ['rocket', (e) => `دخل صفحة هبوط <b>${esc(e.data?.name || e.title)}</b>`],
    order: ['check', (e) => `<b>أكد الطلب #${e.data?.number}</b> بإجمالي ${money(e.data?.total)}`],
    receipt: ['receipt', (e) => `رفع صورة إيصال الدفع للطلب #${e.data?.number}`],
    whatsapp: ['chat', (e) => `ضغط زر واتساب لتأكيد الدفع (طلب #${e.data?.number})`],
    whatsapp_float: ['chat', () => 'ضغط زر واتساب العائم للاستفسار'],
  };
  function timelineHTML(events) {
    const evs = events.filter((e) => !(e.type === 'page' && /^\/(product|category|lp|thanks|checkout)\b/.test(e.path || '')));
    if (!evs.length) return `<div class="empty">${icon('eye')}<p>لا يوجد نشاط مسجل</p></div>`;
    let lastDay = '';
    return `<div class="timeline">${evs.map((e) => {
      const d = dayf.format(new Date(e.t));
      const head = d !== lastDay ? `<div class="tl-day">${d}</div>` : '';
      lastDay = d;
      const [ic, fn] = EV[e.type] || ['info', () => esc(e.type)];
      return `${head}<div class="tl-item ev-${e.type}"><span class="ti">${icon(ic)}</span><div class="tt">${fn(e)}${e.path && e.type !== 'order' ? `<small>${esc(decodeURIComponentSafe(e.path))}</small>` : ''}</div><span class="tm">${timef.format(new Date(e.t))}</span></div>`;
    }).join('')}</div>`;
  }
  function decodeURIComponentSafe(s) { try { return decodeURIComponent(s); } catch (_) { return s; } }
  const visitorInfo = (v) => `<div class="info-list">
    <div>${icon(v.device === 'كمبيوتر' ? 'monitor' : 'phone')}<span>${esc(v.device)} • ${esc(v.os)} • ${esc(v.browser)}</span></div>
    <div>${icon('flag')}<span>المصدر: <b>${esc(v.source || 'دخول مباشر')}</b>${v.referrer ? `<br><small class="muted ltr">${esc(v.referrer)}</small>` : ''}</span></div>
    ${v.landing ? `<div>${icon('link')}<span>أول صفحة: <span class="ltr small">${esc(decodeURIComponentSafe(v.landing))}</span></span></div>` : ''}
    <div>${icon('clock')}<span>أول زيارة ${fdate(v.firstSeen)} — آخر نشاط ${ago(v.lastSeen)}</span></div>
  </div>`;

  async function pageCustomer(phone) {
    loading();
    const d = await api(`/api/admin/customers/${enc(phone)}`);
    const c = d.customer;
    const spent = d.orders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0);
    page(c.name, `<div class="stack">
      <div><a class="btn btn-ghost btn-sm" href="#/customers">${icon('right', 'ico-sm')} كل العملاء</a></div>
      <div class="kpis">
        <div class="card kpi k1"><span class="ki">${icon('orders')}</span><div><small>عدد الطلبات</small><b>${d.orders.length}</b></div></div>
        <div class="card kpi k2"><span class="ki">${icon('money')}</span><div><small>إجمالي المشتريات</small><b>${money(spent)}</b></div></div>
        <div class="card kpi k4"><span class="ki">${icon('eye')}</span><div><small>نشاطات مسجلة</small><b>${d.events.length}</b></div></div>
        <div class="card kpi k3"><span class="ki">${icon('flag')}</span><div><small>مصدر الوصول</small><b style="font-size:17px">${esc(d.visitors[0]?.source || 'مباشر')}</b></div></div>
      </div>
      <div class="cols-main">
        <div class="card"><div class="card-head"><div><h2>خط سير العميل</h2><p>كل خطوة عملها العميل داخل الموقع بالترتيب</p></div></div><div class="card-pad">${timelineHTML(d.events)}</div></div>
        <div class="stack">
          <div class="card card-pad"><h2 style="font-size:16px;margin-bottom:12px">بيانات العميل</h2><div class="info-list">
            <div>${icon('phone')}<span class="ltr">${esc(c.phone)}${c.phone2 ? ` / ${esc(c.phone2)}` : ''}</span></div>
            <div>${icon('pin')}<span>${esc([c.governorate, c.city, c.address].filter(Boolean).join(' - '))}</span></div></div>
            <div class="row" style="margin-top:14px"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(c.phone)}">${icon('chat', 'ico-sm')} واتساب</a><a class="btn btn-ghost btn-sm" href="tel:${esc(c.phone)}">${icon('phone', 'ico-sm')} اتصال</a></div>
          </div>
          ${d.visitors.map((v) => `<div class="card card-pad"><h2 style="font-size:16px;margin-bottom:12px">الجهاز</h2>${visitorInfo(v)}</div>`).join('')}
          <div class="card"><div class="card-head"><h2>الطلبات</h2></div>${d.orders.map((o) => `<a class="list-row" href="#/orders/${o.id}"><span class="badge nodot">#${o.number}</span><div class="t"><b>${money(o.total)}</b><small>${fdate(o.createdAt)}</small></div>${statusBadge(o.status)}</a>`).join('')}</div>
        </div>
      </div></div>`);
  }

  async function pageVisitors() {
    page('الزوار', `<div class="stack"><p class="muted small">آخر الزوار للمتجر وما قاموا به — اضغط على أي زائر لعرض خط سيره بالكامل.</p><div class="card" id="vBox"><div class="empty"><span class="spin dark"></span></div></div></div>`);
    const { visitors, total } = await api('/api/admin/visitors');
    const box = $('#vBox');
    if (!box) return;
    $('#pageTitle').textContent = `الزوار (${total})`;
    box.innerHTML = visitors.length ? `<div class="tbl-wrap"><table class="tbl rt"><thead><tr><th>الزائر</th><th>الجهاز</th><th>المصدر</th><th>النشاطات</th><th>الحالة</th><th>آخر نشاط</th></tr></thead><tbody>${visitors.map((v) => `<tr class="click" data-v="${v.id}">
      <td><b>${v.name ? esc(v.name) : `زائر ${esc(v.id.slice(-5))}`}</b>${v.last ? `<div class="small muted" style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(v.last.title || decodeURIComponentSafe(v.last.path))}</div>` : ''}</td>
      <td class="hide-m">${esc(v.device)} • ${esc(v.os)}</td><td data-label="المصدر">${esc(v.source || 'مباشر')}</td><td class="hide-m">${v.pages}</td>
      <td class="c-end">${v.ordered ? '<span class="badge tag-ok">اشترى</span>' : v.carted ? '<span class="badge tag-gold">أضاف للسلة</span>' : '<span class="badge">تصفح</span>'}</td>
      <td class="small muted" data-label="آخر نشاط">${ago(v.lastSeen)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${icon('eye')}<p>لا يوجد زوار بعد</p></div>`;
    $$('tr[data-v]', box).forEach((tr) => tr.addEventListener('click', () => { location.hash = `#/visitors/${tr.dataset.v}`; }));
  }
  async function pageVisitor(id) {
    loading();
    const { visitor: v, events } = await api(`/api/admin/visitors/${id}`);
    page(v.name || `زائر ${v.id.slice(-5)}`, `<div class="stack"><div><a class="btn btn-ghost btn-sm" href="#/visitors">${icon('right', 'ico-sm')} كل الزوار</a></div>
      <div class="cols-main"><div class="card"><div class="card-head"><h2>خط السير</h2></div><div class="card-pad">${timelineHTML(events)}</div></div>
      <div class="card card-pad"><h2 style="font-size:16px;margin-bottom:12px">معلومات الزائر</h2>${visitorInfo(v)}${v.phone ? `<a class="btn btn-sm" style="margin-top:14px" href="#/customers/${enc(v.phone)}">${icon('users', 'ico-sm')} ملف العميل</a>` : ''}</div></div></div>`);
  }

  /* ================= المنتجات ================= */
  async function loadCatalog() {
    const [c, p] = await Promise.all([api('/api/admin/categories'), api('/api/admin/products')]);
    state.categories = c.categories;
    state.products = p.products;
  }
  let prodFilter = { q: '', cat: '' };
  async function pageProducts() {
    page('المنتجات', `<div class="stack"><div class="row"><div class="search-in">${icon('search')}<input class="input" id="pq" placeholder="بحث باسم الكتاب أو المؤلف" value="${esc(prodFilter.q)}"></div><select class="input" id="pc" style="width:auto;min-width:160px"><option value="">كل الأقسام</option></select></div><div class="card" id="pBox"><div class="empty"><span class="spin dark"></span></div></div></div>`,
      `<a class="btn btn-sm" href="#/products/new">${icon('plus', 'ico-sm')} إضافة منتج</a>`);
    await loadCatalog();
    $('#pc').innerHTML += state.categories.map((c) => `<option value="${c.id}" ${prodFilter.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    const render = () => {
      const q = prodFilter.q.toLowerCase();
      const list = state.products.filter((p) => (!prodFilter.cat || p.categoryId === prodFilter.cat) && (!q || `${p.name} ${p.author} ${p.sku}`.toLowerCase().includes(q)));
      const box = $('#pBox');
      box.innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl rt"><thead><tr><th></th><th>المنتج</th><th>القسم</th><th>السعر</th><th>المخزون</th><th>المبيعات</th><th>ظاهر</th><th>مميز</th><th></th></tr></thead><tbody>${list.map((p) => `<tr data-id="${p.id}">
        <td class="hide-m"><img class="thumb" src="${esc(p.images[0] || '/img/placeholder.svg')}" alt=""></td>
        <td class="c-full"><a href="#/products/${p.id}" class="name">${esc(p.name)}</a><div class="small muted">${esc(p.author)}</div></td>
        <td class="hide-m">${esc(p.categoryName || '—')}</td>
        <td data-label="السعر"><b>${money(p.price)}</b>${p.oldPrice > p.price ? ` <s class="small muted">${nf.format(p.oldPrice)}</s>` : ''}</td>
        <td data-label="المخزون">${p.stock == null ? '<span class="muted">غير محدود</span>' : p.stock <= 0 ? '<span class="badge st-new">نفد</span>' : p.stock}</td>
        <td class="hide-m">${p.sold || 0}</td>
        <td data-label="ظاهر"><label class="switch"><input type="checkbox" data-tg="active" ${p.active ? 'checked' : ''}><span class="tr"></span></label></td>
        <td data-label="مميز"><label class="switch"><input type="checkbox" data-tg="featured" ${p.featured ? 'checked' : ''}><span class="tr"></span></label></td>
        <td class="c-full"><div class="acts"><a class="icon-btn" title="عرض في المتجر" target="_blank" rel="noopener" href="/product/${enc(p.slug)}">${icon('ext')}</a><a class="icon-btn" title="صفحة الهبوط" target="_blank" rel="noopener" href="/lp/${enc(p.slug)}">${icon('rocket')}</a><a class="icon-btn" title="تعديل" href="#/products/${p.id}">${icon('edit')}</a><button class="icon-btn danger" title="حذف" data-del>${icon('trash')}</button></div></td>
      </tr>`).join('')}</tbody></table></div>` : `<div class="empty">${icon('book')}<p>لا توجد منتجات</p><a class="btn" href="#/products/new">إضافة أول منتج</a></div>`;
      $$('[data-tg]', box).forEach((inp) => inp.addEventListener('change', async () => {
        const id = inp.closest('tr').dataset.id;
        try { await api(`/api/admin/products/${id}`, { method: 'PATCH', body: { [inp.dataset.tg]: inp.checked } }); const p = state.products.find((x) => x.id === id); p[inp.dataset.tg] = inp.checked; toast('تم الحفظ'); } catch (e) { inp.checked = !inp.checked; toast(e.message, 'err'); }
      }));
      $$('[data-del]', box).forEach((b) => b.addEventListener('click', async () => {
        const id = b.closest('tr').dataset.id;
        const p = state.products.find((x) => x.id === id);
        if (!(await confirmBox(`حذف "${p.name}" نهائياً؟`, { okText: 'حذف' }))) return;
        await api(`/api/admin/products/${id}`, { method: 'DELETE' });
        state.products = state.products.filter((x) => x.id !== id);
        toast('تم حذف المنتج');
        render();
      }));
    };
    let t;
    $('#pq').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { prodFilter.q = e.target.value.trim(); render(); }, 200); });
    $('#pc').addEventListener('change', (e) => { prodFilter.cat = e.target.value; render(); });
    render();
  }

  async function pageProductEdit(id) {
    loading();
    await loadCatalog();
    const p = id ? state.products.find((x) => x.id === id) : null;
    if (id && !p) { location.hash = '#/products'; return; }
    const v = p ? clone(p) : { name: '', author: '', publisher: '', pages: '', sku: '', price: '', oldPrice: '', description: '', images: [], categoryId: state.categories[0]?.id || '', stock: '', featured: false, active: true, landing: { enabled: true, headline: '', subheadline: '', bullets: ['طبعة أصلية فاخرة', 'شحن سريع لكل المحافظات', 'الدفع بعد التأكيد عبر المحفظة'], ctaText: 'اطلب نسختك الآن' } };
    const L = v.landing || {};
    const c = page(p ? `تعديل: ${p.name}` : 'منتج جديد', `<form id="pf" class="stack" novalidate>
      <div><a class="btn btn-ghost btn-sm" href="#/products">${icon('right', 'ico-sm')} كل المنتجات</a></div>
      <div class="cols-main">
        <div class="stack">
          <div class="card card-pad"><div class="form-grid">
            <div class="field full"><label>اسم الكتاب *</label><input class="input" name="name" value="${esc(v.name)}" required></div>
            <div class="field"><label>المؤلف</label><input class="input" name="author" value="${esc(v.author)}"></div>
            <div class="field"><label>دار النشر</label><input class="input" name="publisher" value="${esc(v.publisher)}"></div>
            <div class="field full"><label>وصف الكتاب</label><textarea class="input" name="description" style="min-height:150px">${esc(v.description)}</textarea></div>
          </div></div>
          <div class="card card-pad stack"><h3 style="font-size:15px">صور المنتج</h3><div id="imgBox"></div><p class="small muted">أول صورة هي الصورة الرئيسية. تقدر ترفع أكتر من صورة وترتبهم.</p></div>
          <div class="card card-pad stack">
            <div class="row"><h3 style="font-size:15px;flex:1">صفحة الهبوط للمنتج</h3><label class="switch"><input type="checkbox" name="lp_enabled" ${L.enabled !== false ? 'checked' : ''}><span class="tr"></span> مفعلة</label></div>
            <p class="small muted">صفحة مخصصة للإعلانات فيها المنتج وفورم طلب مباشر.${p ? ` الرابط: <a class="ltr" target="_blank" rel="noopener" href="/lp/${enc(p.slug)}" style="color:var(--primary)">${esc(location.origin)}/lp/${esc(p.slug)}</a> <button type="button" class="btn btn-ghost btn-sm" id="cpLp">${icon('copy', 'ico-sm')} نسخ</button>` : ' سيظهر الرابط بعد الحفظ.'}</p>
            <div class="form-grid">
              <div class="field full"><label>العنوان الرئيسي</label><input class="input" name="lp_headline" value="${esc(L.headline || '')}" placeholder="يترك فارغاً لاستخدام اسم المنتج"></div>
              <div class="field full"><label>العنوان الفرعي</label><textarea class="input" name="lp_sub" style="min-height:70px" placeholder="جملة جذابة تشرح قيمة الكتاب">${esc(L.subheadline || '')}</textarea></div>
              <div class="field full"><label>المميزات (كل ميزة في سطر)</label><textarea class="input" name="lp_bullets" style="min-height:100px">${esc((L.bullets || []).join('\n'))}</textarea></div>
              <div class="field"><label>نص زر الطلب</label><input class="input" name="lp_cta" value="${esc(L.ctaText || 'اطلب الآن')}"></div>
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="card card-pad stack">
            <label class="switch"><input type="checkbox" name="active" ${v.active ? 'checked' : ''}><span class="tr"></span> ظاهر في المتجر</label>
            <label class="switch"><input type="checkbox" name="featured" ${v.featured ? 'checked' : ''}><span class="tr"></span> منتج مميز (اختيارات المحررين)</label>
          </div>
          <div class="card card-pad stack">
            <div class="field"><label>القسم</label><div class="row" style="flex-wrap:nowrap"><select class="input" name="categoryId"><option value="">بدون قسم</option>${state.categories.map((x) => `<option value="${x.id}" ${x.id === v.categoryId ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><button type="button" class="btn btn-ghost" id="quickCat" title="قسم جديد">${icon('plus', 'ico-sm')}</button></div></div>
            <div class="form-grid">
              <div class="field"><label>السعر *</label><div class="input-group"><input class="input" name="price" type="number" min="0" step="0.5" inputmode="decimal" value="${esc(v.price)}" required><span class="addon">${esc(cur())}</span></div></div>
              <div class="field"><label>السعر قبل الخصم</label><div class="input-group"><input class="input" name="oldPrice" type="number" min="0" step="0.5" inputmode="decimal" value="${esc(v.oldPrice || '')}"><span class="addon">${esc(cur())}</span></div></div>
            </div>
            <div class="form-grid">
              <div class="field"><label>الكمية المتاحة</label><input class="input" name="stock" type="number" min="0" inputmode="numeric" value="${v.stock == null ? '' : v.stock}" placeholder="غير محدود"><span class="hint">اتركه فارغ = غير محدود</span></div>
              <div class="field"><label>عدد الصفحات</label><input class="input" name="pages" type="number" min="0" inputmode="numeric" value="${esc(v.pages || '')}"></div>
            </div>
            <div class="field"><label>كود المنتج (SKU)</label><input class="input ltr" name="sku" value="${esc(v.sku || '')}"></div>
            <div class="field"><label>رابط المنتج (slug)</label><input class="input" name="slug" value="${esc(v.slug || '')}" placeholder="يتولد تلقائياً من الاسم"></div>
          </div>
        </div>
      </div>
      <div class="savebar show"><button class="btn" type="submit" id="pSave">${icon('check', 'ico-sm')} ${p ? 'حفظ التعديلات' : 'إضافة المنتج'}</button><a class="btn btn-ghost" href="#/products">إلغاء</a>${p ? `<span class="spacer"></span><a class="btn btn-ghost" target="_blank" rel="noopener" href="/product/${enc(p.slug)}">${icon('ext', 'ico-sm')} معاينة</a>` : ''}</div>
    </form>`);
    const up = uploader({ spec: 'product', value: v.images, multiple: true, onChange: () => { dirty = true; } });
    $('#imgBox', c).appendChild(up.el);
    const f = $('#pf', c);
    f.addEventListener('input', () => { dirty = true; });
    $('#cpLp', c)?.addEventListener('click', () => { navigator.clipboard?.writeText(`${location.origin}/lp/${p.slug}`); toast('تم نسخ رابط صفحة الهبوط'); });
    $('#quickCat', c).addEventListener('click', () => editCategory(null, (cat) => {
      const sel = $('[name=categoryId]', f);
      sel.insertAdjacentHTML('beforeend', `<option value="${cat.id}">${esc(cat.name)}</option>`);
      sel.value = cat.id;
    }));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const g = (k) => String(fd.get(k) ?? '').trim();
      if (!g('name')) return toast('اكتب اسم المنتج', 'err');
      if (g('price') === '') return toast('اكتب سعر المنتج', 'err');
      const body = {
        name: g('name'), author: g('author'), publisher: g('publisher'), description: g('description'), categoryId: g('categoryId'),
        price: Number(g('price')), oldPrice: Number(g('oldPrice')) || 0, stock: g('stock'), pages: g('pages'), sku: g('sku'), slug: g('slug'),
        active: !!fd.get('active'), featured: !!fd.get('featured'), images: up.get(),
        landing: { enabled: !!fd.get('lp_enabled'), headline: g('lp_headline'), subheadline: g('lp_sub'), bullets: g('lp_bullets').split('\n'), ctaText: g('lp_cta') },
      };
      if (!body.images.length) toast('تنبيه: المنتج بدون صور', 'err');
      busy($('#pSave'), async () => {
        const r = p ? await api(`/api/admin/products/${p.id}`, { method: 'PUT', body }) : await api('/api/admin/products', { body });
        dirty = false;
        toast(p ? 'تم حفظ التعديلات' : 'تمت إضافة المنتج');
        if (!p) location.hash = `#/products/${r.product.id}`; else route();
      });
    });
  }

  /* ================= الأقسام ================= */
  function editCategory(cat, done) {
    const v = cat ? clone(cat) : { name: '', slug: '', description: '', image: '', showInMenu: true, active: true };
    const body = h(`<form class="stack" novalidate>
      <div class="field"><label>اسم القسم *</label><input class="input" name="name" value="${esc(v.name)}" required></div>
      <div class="field"><label>وصف قصير</label><input class="input" name="description" value="${esc(v.description)}"></div>
      <div class="field"><label>صورة القسم</label><div id="cImg"></div></div>
      <div class="field"><label>الرابط (slug)</label><input class="input" name="slug" value="${esc(v.slug)}" placeholder="يتولد تلقائياً"></div>
      <label class="switch"><input type="checkbox" name="showInMenu" ${v.showInMenu !== false ? 'checked' : ''}><span class="tr"></span> يظهر في القائمة (الموبايل والكمبيوتر)</label>
      <label class="switch"><input type="checkbox" name="active" ${v.active !== false ? 'checked' : ''}><span class="tr"></span> القسم مفعل</label>
    </form>`);
    const up = uploader({ spec: 'category', value: v.image });
    $('#cImg', body).appendChild(up.el);
    const m = modal({ title: cat ? 'تعديل القسم' : 'قسم جديد', body, foot: `<button class="btn" data-save>${icon('check', 'ico-sm')} حفظ</button><button class="btn btn-ghost" data-x2>إلغاء</button>` });
    $('[data-x2]', m.el).addEventListener('click', m.close);
    const save = (e) => {
      e?.preventDefault();
      const fd = new FormData(body);
      const data = { name: String(fd.get('name')).trim(), description: String(fd.get('description')).trim(), slug: String(fd.get('slug')).trim(), image: up.get(), showInMenu: !!fd.get('showInMenu'), active: !!fd.get('active') };
      if (!data.name) return toast('اكتب اسم القسم', 'err');
      busy($('[data-save]', m.el), async () => {
        const r = cat ? await api(`/api/admin/categories/${cat.id}`, { method: 'PUT', body: data }) : await api('/api/admin/categories', { body: data });
        toast('تم حفظ القسم');
        m.close();
        done && done(r.category);
      });
    };
    body.addEventListener('submit', save);
    $('[data-save]', m.el).addEventListener('click', save);
  }
  async function pageCategories() {
    page('الأقسام', '<div class="stack"><p class="muted small">الأقسام بتظهر للزوار في القائمة (الموبايل والكمبيوتر) وفي الصفحة الرئيسية. رتّبها بالأسهم.</p><div class="card" id="catBox"><div class="empty"><span class="spin dark"></span></div></div></div>',
      `<button class="btn btn-sm" id="addCat">${icon('plus', 'ico-sm')} قسم جديد</button>`);
    $('#addCat').addEventListener('click', () => editCategory(null, () => render(true)));
    const render = async (reload = true) => {
      if (reload) state.categories = (await api('/api/admin/categories')).categories;
      const list = state.categories;
      const box = $('#catBox');
      if (!box) return;
      box.innerHTML = list.length ? `<div class="tbl-wrap"><table class="tbl rt"><thead><tr><th></th><th>القسم</th><th>المنتجات</th><th>في القائمة</th><th>مفعل</th><th></th></tr></thead><tbody>${list.map((c, i) => `<tr data-id="${c.id}">
        <td class="hide-m"><img class="thumb sq" src="${esc(c.image || '/img/placeholder.svg')}" alt=""></td>
        <td class="c-full"><b>${esc(c.name)}</b><div class="small muted">${esc(c.description || '')}</div></td>
        <td data-label="المنتجات">${c.count}</td>
        <td data-label="في القائمة"><label class="switch"><input type="checkbox" data-tg="showInMenu" ${c.showInMenu !== false ? 'checked' : ''}><span class="tr"></span></label></td>
        <td data-label="مفعل"><label class="switch"><input type="checkbox" data-tg="active" ${c.active !== false ? 'checked' : ''}><span class="tr"></span></label></td>
        <td class="c-full"><div class="acts"><button class="icon-btn" data-mv="-1" ${i === 0 ? 'disabled' : ''} title="لأعلى">${icon('up')}</button><button class="icon-btn" data-mv="1" ${i === list.length - 1 ? 'disabled' : ''} title="لأسفل">${icon('down')}</button><a class="icon-btn" href="/category/${enc(c.slug)}" target="_blank" rel="noopener" title="عرض">${icon('ext')}</a><button class="icon-btn" data-edit title="تعديل">${icon('edit')}</button><button class="icon-btn danger" data-del title="حذف">${icon('trash')}</button></div></td>
      </tr>`).join('')}</tbody></table></div>` : `<div class="empty">${icon('grid')}<p>لا توجد أقسام</p></div>`;
      $$('tr[data-id]', box).forEach((tr) => {
        const c = list.find((x) => x.id === tr.dataset.id);
        $('[data-edit]', tr).addEventListener('click', () => editCategory(c, () => render(true)));
        $('[data-del]', tr).addEventListener('click', async () => {
          if (!(await confirmBox(`حذف قسم "${c.name}"؟ المنتجات اللي فيه هتفضل موجودة بدون قسم.`, { okText: 'حذف' }))) return;
          await api(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
          toast('تم حذف القسم');
          render(true);
        });
        $$('[data-tg]', tr).forEach((inp) => inp.addEventListener('change', async () => {
          c[inp.dataset.tg] = inp.checked;
          try { await api(`/api/admin/categories/${c.id}`, { method: 'PUT', body: c }); toast('تم الحفظ'); } catch (e) { toast(e.message, 'err'); }
        }));
        $$('[data-mv]', tr).forEach((b) => b.addEventListener('click', async () => {
          const i = list.indexOf(c);
          const j = i + Number(b.dataset.mv);
          if (j < 0 || j >= list.length) return;
          [list[i], list[j]] = [list[j], list[i]];
          render(false);
          await api('/api/admin/categories/order', { method: 'PUT', body: { ids: list.map((x) => x.id) } });
        }));
      });
    };
    await render(true);
  }

  /* ================= تصميم الصفحة الرئيسية ================= */
  const SEC_TYPES = {
    slider: { name: 'سلايدر بانرات', icon: 'image', desc: 'بانرات كبيرة متحركة أعلى الصفحة', def: () => ({ title: 'السلايدر الرئيسي', settings: { autoplay: true, interval: 5, slides: [] } }) },
    banners: { name: 'بانرات إعلانية', icon: 'layout', desc: 'بانر واحد أو 2 أو 3 جنب بعض', def: () => ({ title: 'بانرات', settings: { columns: 2, items: [] } }) },
    products: { name: 'منتجات', icon: 'book', desc: 'شبكة أو شريط متحرك من الكتب', def: () => ({ title: 'كتب مختارة', subtitle: '', settings: { source: 'latest', limit: 8, layout: 'grid', productIds: [] } }) },
    categories: { name: 'الأقسام', icon: 'grid', desc: 'عرض أقسام المتجر بالصور', def: () => ({ title: 'تصفح الأقسام', subtitle: '', settings: { style: 'cards', categoryIds: [] } }) },
    features: { name: 'مميزات المتجر', icon: 'star', desc: 'شحن، دفع آمن، دعم...', def: () => ({ title: 'المميزات', settings: { items: [{ icon: 'truck', title: 'شحن سريع', text: 'لكل المحافظات' }] } }) },
    text: { name: 'نص وزر دعوة', icon: 'type', desc: 'عنوان ونص وزر (CTA)', def: () => ({ title: 'عنوان جذاب', settings: { text: '', buttonText: 'تسوق الآن', link: '/shop', style: 'dark' } }) },
  };
  const SOURCES = { latest: 'الأحدث', featured: 'المنتجات المميزة', bestsellers: 'الأكثر مبيعاً', sale: 'العروض (عليها خصم)', category: 'من قسم معين', manual: 'اختيار يدوي' };
  const FEATURE_ICONS = { truck: 'شحن', shield: 'أمان', book: 'كتاب', chat: 'دعم', wallet: 'دفع', gift: 'هدية', star: 'نجمة', clock: 'وقت', sparkle: 'لمعة', tag: 'خصم' };

  function secSummary(s) {
    const st = s.settings || {};
    switch (s.type) {
      case 'slider': return `${(st.slides || []).length} شريحة`;
      case 'banners': return `${(st.items || []).length} بانر • ${st.columns || 1} عمود`;
      case 'products': return `${SOURCES[st.source] || ''}${st.source === 'category' ? `: ${esc(state.categories.find((c) => c.id === st.categoryId)?.name || '')}` : ''} • ${st.layout === 'carousel' ? 'شريط متحرك' : 'شبكة'}${st.source !== 'manual' ? ` • ${st.limit} منتج` : ` • ${(st.productIds || []).length} منتج`}`;
      case 'categories': return st.categoryIds?.length ? `${st.categoryIds.length} أقسام` : 'كل الأقسام';
      case 'features': return `${(st.items || []).length} عناصر`;
      default: return esc(st.text || '').slice(0, 60);
    }
  }

  function linkOptions() {
    return `<datalist id="linkOpts"><option value="/">الرئيسية</option><option value="/shop">كل الكتب</option><option value="/shop?sort=sale">العروض</option><option value="/shop?sort=bestsellers">الأكثر مبيعاً</option><option value="whatsapp">فتح واتساب المتجر</option>${state.categories.map((c) => `<option value="/category/${esc(c.slug)}">قسم: ${esc(c.name)}</option>`).join('')}${state.products.map((p) => `<option value="/product/${esc(p.slug)}">كتاب: ${esc(p.name)}</option><option value="/lp/${esc(p.slug)}">هبوط: ${esc(p.name)}</option>`).join('')}</datalist>`;
  }
  const linkField = (name, val, label = 'الرابط عند الضغط') => `<div class="field"><label>${label}</label><input class="input ltr" list="linkOpts" name="${name}" value="${esc(val || '')}" placeholder="/shop أو اختر من القائمة"><span class="hint">اكتب أو اختر صفحة • "whatsapp" يفتح واتساب المتجر</span></div>`;

  function editSection(sec, onSave) {
    const s = clone(sec);
    s.settings = s.settings || {};
    const st = s.settings;
    const body = h('<div class="stack"></div>');
    body.insertAdjacentHTML('beforeend', linkOptions());
    const common = h(`<div class="form-grid"><div class="field"><label>عنوان القسم</label><input class="input" data-k="title" value="${esc(s.title || '')}"></div>${['products', 'categories'].includes(s.type) ? `<div class="field"><label>عنوان فرعي</label><input class="input" data-k="subtitle" value="${esc(s.subtitle || '')}"></div>` : ''}</div>`);
    body.appendChild(common);
    const collectors = [];

    // قائمة عناصر فرعية (شرائح / بانرات / مميزات)
    function subList(key, makeItem, renderItem, addLabel) {
      st[key] = st[key] || [];
      const wrap = h('<div class="stack"></div>');
      const list = h('<div class="stack"></div>');
      const addBtn = h(`<button type="button" class="btn btn-ghost">${icon('plus', 'ico-sm')} ${addLabel}</button>`);
      const draw = () => {
        list.innerHTML = '';
        st[key].forEach((it, i) => {
          const box = h(`<div class="sub-item"><div class="sub-item-head"><b>#${i + 1}</b><button type="button" class="icon-btn" data-u ${i === 0 ? 'disabled' : ''}>${icon('up')}</button><button type="button" class="icon-btn" data-d ${i === st[key].length - 1 ? 'disabled' : ''}>${icon('down')}</button><button type="button" class="icon-btn danger" data-r>${icon('trash')}</button></div></div>`);
          renderItem(it, box);
          $('[data-r]', box).addEventListener('click', () => { st[key].splice(i, 1); draw(); });
          $('[data-u]', box).addEventListener('click', () => { [st[key][i - 1], st[key][i]] = [st[key][i], st[key][i - 1]]; draw(); });
          $('[data-d]', box).addEventListener('click', () => { [st[key][i + 1], st[key][i]] = [st[key][i], st[key][i + 1]]; draw(); });
          list.appendChild(box);
        });
      };
      addBtn.addEventListener('click', () => { st[key].push(makeItem()); draw(); list.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      wrap.append(list, addBtn);
      draw();
      return { el: wrap, redraw: draw };
    }
    // ربط حقول نصية بعنصر
    const bindInputs = (obj, box) => $$('[data-f]', box).forEach((inp) => inp.addEventListener('input', () => { obj[inp.dataset.f] = inp.type === 'checkbox' ? inp.checked : inp.value; }));

    if (s.type === 'slider') {
      body.appendChild(h(`<div class="form-grid"><label class="switch"><input type="checkbox" data-s="autoplay" ${st.autoplay !== false ? 'checked' : ''}><span class="tr"></span> تشغيل تلقائي</label><div class="field"><label>مدة كل شريحة (ثانية)</label><input class="input" type="number" min="2" max="20" data-s="interval" value="${st.interval || 5}"></div></div>`));
      body.appendChild(h('<p class="small muted">لو البانر فيه كلام مكتوب على الصورة نفسها، اترك العنوان والوصف فاضيين.</p>'));
      body.appendChild(subList('slides', () => ({ id: uid(), image: '', mobileImage: '', title: '', subtitle: '', kicker: '', buttonText: '', link: '/shop' }), (it, box) => {
        const f = h(`<div class="stack"><div class="field"><label>صورة الكمبيوتر *</label><div data-up1></div></div><div class="field"><label>صورة الموبايل (اختياري — مستحسن)</label><div data-up2></div></div>
          <div class="form-grid"><div class="field"><label>عنوان صغير فوق العنوان</label><input class="input" data-f="kicker" value="${esc(it.kicker || '')}"></div><div class="field"><label>العنوان</label><input class="input" data-f="title" value="${esc(it.title || '')}"></div>
          <div class="field full"><label>الوصف</label><input class="input" data-f="subtitle" value="${esc(it.subtitle || '')}"></div><div class="field"><label>نص الزر</label><input class="input" data-f="buttonText" value="${esc(it.buttonText || '')}"></div>${linkField('', it.link).replace('name=""', 'data-f="link"')}</div></div>`);
        $('[data-up1]', f).appendChild(uploader({ spec: 'slide', value: it.image, onChange: (u) => { it.image = u; } }).el);
        $('[data-up2]', f).appendChild(uploader({ spec: 'slideMobile', value: it.mobileImage, onChange: (u) => { it.mobileImage = u; } }).el);
        bindInputs(it, f);
        box.appendChild(f);
      }, 'إضافة شريحة').el);
    }

    if (s.type === 'banners') {
      const colsSel = h(`<div class="form-grid"><div class="field"><label>عدد البانرات جنب بعض</label><select class="input" data-s="columns">${[1, 2, 3].map((n) => `<option value="${n}" ${Number(st.columns || 1) === n ? 'selected' : ''}>${n === 1 ? 'بانر بعرض الصفحة' : `${n} بانرات جنب بعض`}</option>`).join('')}</select><span class="hint">على الموبايل بيظهروا تحت بعض</span></div><label class="switch" style="align-self:end"><input type="checkbox" data-s="showTitle" ${st.showTitle ? 'checked' : ''}><span class="tr"></span> إظهار عنوان القسم</label></div>`);
      body.appendChild(colsSel);
      const sl = subList('items', () => ({ image: '', mobileImage: '', title: '', subtitle: '', buttonText: '', link: '' }), (it, box) => {
        const cols = Number(st.columns || 1);
        const f = h(`<div class="stack"><div class="field"><label>صورة البانر *</label><div data-up1></div></div>${cols === 1 ? '<div class="field"><label>صورة الموبايل (اختياري)</label><div data-up2></div></div>' : ''}
          <div class="form-grid"><div class="field"><label>عنوان صغير</label><input class="input" data-f="subtitle" value="${esc(it.subtitle || '')}"></div><div class="field"><label>العنوان</label><input class="input" data-f="title" value="${esc(it.title || '')}"></div>
          <div class="field"><label>نص الزر</label><input class="input" data-f="buttonText" value="${esc(it.buttonText || '')}"></div>${linkField('', it.link).replace('name=""', 'data-f="link"')}</div></div>`);
        $('[data-up1]', f).appendChild(uploader({ spec: `banner${cols}`, value: it.image, onChange: (u) => { it.image = u; } }).el);
        if (cols === 1) $('[data-up2]', f).appendChild(uploader({ spec: 'bannerMobile', value: it.mobileImage, onChange: (u) => { it.mobileImage = u; } }).el);
        bindInputs(it, f);
        box.appendChild(f);
      }, 'إضافة بانر');
      $('select', colsSel).addEventListener('change', (e) => { st.columns = Number(e.target.value); sl.redraw(); });
      body.appendChild(sl.el);
    }

    if (s.type === 'products') {
      const f = h(`<div class="stack"><div class="form-grid">
        <div class="field"><label>مصدر المنتجات</label><select class="input" data-s="source">${Object.entries(SOURCES).map(([k, l]) => `<option value="${k}" ${st.source === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field" data-cat><label>القسم</label><select class="input" data-s="categoryId">${state.categories.map((c) => `<option value="${c.id}" ${st.categoryId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field" data-lim><label>عدد المنتجات</label><input class="input" type="number" min="1" max="40" data-s="limit" value="${st.limit || 8}"></div>
        <div class="field"><label>طريقة العرض</label><select class="input" data-s="layout"><option value="grid" ${st.layout !== 'carousel' ? 'selected' : ''}>شبكة</option><option value="carousel" ${st.layout === 'carousel' ? 'selected' : ''}>شريط متحرك (سحب)</option></select></div>
      </div><div class="field" data-man><label>اختر المنتجات (بالترتيب اللي تختاره)</label><input class="input" placeholder="بحث..." data-pq><div class="pick-list">${state.products.map((p) => `<label data-n="${esc(p.name.toLowerCase())}"><input type="checkbox" value="${p.id}" ${(st.productIds || []).includes(p.id) ? 'checked' : ''}><img src="${esc(p.images[0] || '/img/placeholder.svg')}" alt=""><span>${esc(p.name)}</span></label>`).join('')}</div></div></div>`);
      const sync = () => { const src = $('[data-s=source]', f).value; $('[data-cat]', f).hidden = src !== 'category'; $('[data-man]', f).hidden = src !== 'manual'; $('[data-lim]', f).hidden = src === 'manual'; };
      $('[data-s=source]', f).addEventListener('change', sync);
      sync();
      st.productIds = st.productIds || [];
      $$('.pick-list input', f).forEach((cb) => cb.addEventListener('change', () => { if (cb.checked) st.productIds.push(cb.value); else st.productIds = st.productIds.filter((x) => x !== cb.value); }));
      $('[data-pq]', f).addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); $$('.pick-list label', f).forEach((l) => { l.hidden = q && !l.dataset.n.includes(q); }); });
      body.appendChild(f);
    }

    if (s.type === 'categories') {
      st.categoryIds = st.categoryIds || [];
      const f = h(`<div class="stack"><div class="field"><label>شكل العرض</label><select class="input" data-s="style"><option value="cards" ${st.style !== 'circles' ? 'selected' : ''}>كروت بالصور</option><option value="circles" ${st.style === 'circles' ? 'selected' : ''}>دوائر</option></select></div>
        <div class="field"><label>الأقسام المعروضة (اتركها كلها فاضية لعرض كل الأقسام)</label><div class="pick-list">${state.categories.map((c) => `<label><input type="checkbox" value="${c.id}" ${st.categoryIds.includes(c.id) ? 'checked' : ''}><img src="${esc(c.image || '/img/placeholder.svg')}" alt="" style="width:36px;height:36px;border-radius:8px"><span>${esc(c.name)}</span></label>`).join('')}</div></div></div>`);
      $$('.pick-list input', f).forEach((cb) => cb.addEventListener('change', () => { if (cb.checked) st.categoryIds.push(cb.value); else st.categoryIds = st.categoryIds.filter((x) => x !== cb.value); }));
      body.appendChild(f);
    }

    if (s.type === 'features') {
      body.appendChild(subList('items', () => ({ icon: 'truck', title: '', text: '' }), (it, box) => {
        const f = h(`<div class="form-grid"><div class="field"><label>الأيقونة</label><select class="input" data-f="icon">${Object.entries(FEATURE_ICONS).map(([k, l]) => `<option value="${k}" ${it.icon === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div class="field"><label>العنوان</label><input class="input" data-f="title" value="${esc(it.title)}"></div><div class="field full"><label>الوصف</label><input class="input" data-f="text" value="${esc(it.text)}"></div></div>`);
        $('select', f).addEventListener('change', (e) => { it.icon = e.target.value; });
        bindInputs(it, f);
        box.appendChild(f);
      }, 'إضافة ميزة').el);
    }

    if (s.type === 'text') {
      body.appendChild(h(`<div class="form-grid"><div class="field full"><label>النص</label><textarea class="input" data-s="text">${esc(st.text || '')}</textarea></div><div class="field"><label>نص الزر</label><input class="input" data-s="buttonText" value="${esc(st.buttonText || '')}"></div>${linkField('', st.link).replace('name=""', 'data-s="link"')}<div class="field"><label>الشكل</label><select class="input" data-s="style"><option value="dark" ${st.style === 'dark' ? 'selected' : ''}>خلفية داكنة</option><option value="gold" ${st.style === 'gold' ? 'selected' : ''}>خلفية ذهبية فاتحة</option><option value="light" ${st.style === 'light' ? 'selected' : ''}>خلفية بيضاء</option></select></div></div>`));
    }

    collectors.push(() => {
      $$('[data-k]', common).forEach((i) => { s[i.dataset.k] = i.value; });
      $$('[data-s]', body).forEach((i) => { st[i.dataset.s] = i.type === 'checkbox' ? i.checked : i.type === 'number' ? Number(i.value) : i.value; });
    });
    const m = modal({ title: `${SEC_TYPES[s.type].name}`, size: 'lg', body, foot: `<button class="btn" data-ok>${icon('check', 'ico-sm')} تم</button><button class="btn btn-ghost" data-cancel>إلغاء</button>` });
    $('[data-cancel]', m.el).addEventListener('click', m.close);
    $('[data-ok]', m.el).addEventListener('click', () => {
      collectors.forEach((fn) => fn());
      if (s.type === 'slider') st.slides = (st.slides || []).filter((x) => x.image);
      if (s.type === 'banners') st.items = (st.items || []).filter((x) => x.image);
      onSave(s);
      m.close();
    });
  }

  async function pageHomepage() {
    loading();
    await loadCatalog();
    let { sections } = await api('/api/admin/homepage');
    const c = page('تصميم الصفحة الرئيسية', `<div class="stack">
      <div class="card card-pad row" style="background:var(--primary-soft);border-color:#cfe0f2">${icon('info')}<span style="flex:1 1 260px" class="small">رتّب أقسام الصفحة الرئيسية زي ما تحب: ضيف بانر، وتحته منتجات، وتحته قسم معين... استخدم الأسهم للترتيب، والعين للإخفاء، ثم اضغط <b>حفظ</b>.</span></div>
      <div class="sections" id="secList"></div>
      <button class="btn btn-ghost" id="addSec" style="min-height:54px;border-style:dashed;border-width:2px">${icon('plus')} إضافة قسم جديد للصفحة</button>
      <div class="savebar" id="saveBar"><button class="btn" id="saveHome">${icon('check', 'ico-sm')} حفظ التغييرات</button><button class="btn btn-ghost" id="undoHome">تراجع</button><span class="small muted">لديك تغييرات غير محفوظة</span></div>
    </div>`, `<a class="btn btn-ghost btn-sm" href="/" target="_blank" rel="noopener">${icon('ext', 'ico-sm')} معاينة المتجر</a>`);
    let original = clone(sections);
    const markDirty = (v = true) => { dirty = v; $('#saveBar', c).classList.toggle('show', v); };
    const draw = (movedId) => {
      const list = $('#secList', c);
      list.innerHTML = sections.length ? '' : `<div class="card empty">${icon('layout')}<p>الصفحة الرئيسية فاضية — ابدأ بإضافة سلايدر أو منتجات</p></div>`;
      sections.forEach((s, i) => {
        const T = SEC_TYPES[s.type] || { name: s.type, icon: 'layout' };
        const el = h(`<div class="sec ${s.visible === false ? 'hidden-sec' : ''} ${s.id === movedId ? 'moved' : ''}">
          <span class="si">${icon(T.icon)}</span>
          <div class="t"><b>${esc(s.title || T.name)}</b><small>${T.name} • ${secSummary(s)}</small></div>
          <div class="acts">
            <button class="icon-btn" data-a="up" ${i === 0 ? 'disabled' : ''} title="لأعلى">${icon('up')}</button>
            <button class="icon-btn" data-a="down" ${i === sections.length - 1 ? 'disabled' : ''} title="لأسفل">${icon('down')}</button>
            <button class="icon-btn" data-a="vis" title="${s.visible === false ? 'إظهار' : 'إخفاء'}" style="${s.visible === false ? 'color:var(--muted)' : 'color:var(--ok)'}">${icon('eye')}</button>
            <button class="icon-btn" data-a="dup" title="نسخ">${icon('copy')}</button>
            <button class="icon-btn" data-a="edit" title="تعديل">${icon('edit')}</button>
            <button class="icon-btn danger" data-a="del" title="حذف">${icon('trash')}</button>
          </div></div>`);
        $$('[data-a]', el).forEach((b) => b.addEventListener('click', async () => {
          const a = b.dataset.a;
          if (a === 'up' || a === 'down') { const j = a === 'up' ? i - 1 : i + 1; [sections[i], sections[j]] = [sections[j], sections[i]]; markDirty(); draw(s.id); }
          if (a === 'vis') { s.visible = s.visible === false; markDirty(); draw(); }
          if (a === 'dup') { const cp = clone(s); cp.id = uid(); cp.title = `${cp.title || ''} (نسخة)`; sections.splice(i + 1, 0, cp); markDirty(); draw(cp.id); }
          if (a === 'edit') editSection(s, (ns) => { sections[i] = ns; markDirty(); draw(ns.id); });
          if (a === 'del') { if (await confirmBox(`حذف "${s.title || T.name}" من الصفحة الرئيسية؟`, { okText: 'حذف' })) { sections.splice(i, 1); markDirty(); draw(); } }
        }));
        el.addEventListener('dblclick', () => editSection(s, (ns) => { sections[i] = ns; markDirty(); draw(ns.id); }));
        list.appendChild(el);
      });
    };
    draw();
    $('#addSec', c).addEventListener('click', () => {
      const m = modal({ title: 'اختر نوع القسم', body: `<div class="type-grid">${Object.entries(SEC_TYPES).map(([k, t]) => `<button class="type-card" data-t="${k}"><span class="si">${icon(t.icon)}</span><b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div>`, foot: null });
      $$('[data-t]', m.el).forEach((b) => b.addEventListener('click', () => {
        m.close();
        const T = SEC_TYPES[b.dataset.t];
        const s = { id: uid(), type: b.dataset.t, visible: true, subtitle: '', ...T.def() };
        editSection(s, (ns) => { sections.push(ns); markDirty(); draw(ns.id); setTimeout(() => $('#secList .sec:last-child')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); });
      }));
    });
    $('#saveHome', c).addEventListener('click', (e) => busy(e.currentTarget, async () => {
      const r = await api('/api/admin/homepage', { method: 'PUT', body: { sections } });
      sections = r.sections;
      original = clone(sections);
      markDirty(false);
      draw();
      toast('تم حفظ الصفحة الرئيسية — التغييرات ظاهرة للزوار الآن');
    }));
    $('#undoHome', c).addEventListener('click', () => { sections = clone(original); markDirty(false); draw(); });
  }

  /* ================= الشحن ================= */
  async function pageShipping() {
    loading();
    const { settings } = await api('/api/admin/settings');
    state.settings = settings;
    const ship = clone(settings.shipping);
    const c = page('أسعار الشحن', `<div class="stack">
      <div class="card card-pad form-grid"><div class="field"><label>شحن مجاني للطلبات فوق</label><div class="input-group"><input class="input" type="number" min="0" id="freeOver" value="${ship.freeOver || 0}"><span class="addon">${esc(cur())}</span></div><span class="hint">اكتب 0 لإلغاء الشحن المجاني</span></div>
        <div class="field"><label>تطبيق سعر واحد على كل المحافظات</label><div class="row" style="flex-wrap:nowrap"><input class="input" type="number" min="0" id="bulkPrice" placeholder="مثال: 60"><button class="btn btn-ghost" id="bulkBtn">تطبيق</button></div></div></div>
      <div class="card"><div class="card-head"><h2>المحافظات / المناطق</h2><button class="btn btn-sm btn-ghost" id="addZone">${icon('plus', 'ico-sm')} إضافة منطقة</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>المنطقة</th><th>سعر الشحن</th><th>مدة التوصيل (أيام)</th><th>مفعلة</th><th></th></tr></thead><tbody id="zones"></tbody></table></div></div>
      <div class="savebar show"><button class="btn" id="saveShip">${icon('check', 'ico-sm')} حفظ أسعار الشحن</button></div>
    </div>`);
    const draw = () => {
      $('#zones', c).innerHTML = ship.zones.map((z, i) => `<tr data-i="${i}"><td><input class="input" data-f="name" value="${esc(z.name)}" style="min-width:130px"></td><td><input class="input" type="number" min="0" data-f="price" value="${z.price}" style="width:110px"></td><td><input class="input ltr" data-f="days" value="${esc(z.days || '')}" placeholder="2-3" style="width:90px"></td><td><label class="switch"><input type="checkbox" data-f="active" ${z.active !== false ? 'checked' : ''}><span class="tr"></span></label></td><td><button class="icon-btn danger" data-del>${icon('trash')}</button></td></tr>`).join('');
      $$('#zones tr', c).forEach((tr) => {
        const z = ship.zones[tr.dataset.i];
        $$('[data-f]', tr).forEach((inp) => inp.addEventListener('input', () => { z[inp.dataset.f] = inp.type === 'checkbox' ? inp.checked : inp.type === 'number' ? Number(inp.value) : inp.value; dirty = true; }));
        $('[data-del]', tr).addEventListener('click', () => { ship.zones.splice(Number(tr.dataset.i), 1); draw(); dirty = true; });
      });
    };
    draw();
    $('#addZone', c).addEventListener('click', () => { ship.zones.push({ id: uid(), name: '', price: 0, days: '', active: true }); draw(); $('#zones tr:last-child input', c).focus(); });
    $('#bulkBtn', c).addEventListener('click', () => { const v = Number($('#bulkPrice', c).value); if ($('#bulkPrice', c).value === '') return; ship.zones.forEach((z) => { z.price = v; }); draw(); dirty = true; toast('تم التطبيق — اضغط حفظ'); });
    $('#saveShip', c).addEventListener('click', (e) => busy(e.currentTarget, async () => {
      ship.freeOver = Number($('#freeOver', c).value) || 0;
      const r = await api('/api/admin/settings', { method: 'PUT', body: { shipping: ship } });
      state.settings = r.settings;
      dirty = false;
      toast('تم حفظ أسعار الشحن');
    }));
  }

  /* ================= الدفع وواتساب ================= */
  async function pagePayment() {
    loading();
    const { settings } = await api('/api/admin/settings');
    state.settings = settings;
    const p = settings.payment;
    const c = page('الدفع وواتساب', `<div class="cols-main"><form class="card card-pad stack" id="payF">
      <p class="small muted">البيانات دي بتظهر للعميل في صفحة الشكر بعد ما يأكد الطلب، علشان يحوّل المبلغ ويبعتلك الإيصال على واتساب.</p>
      <div class="form-grid">
        <div class="field"><label>اسم طريقة الدفع</label><input class="input" name="methodName" value="${esc(p.methodName)}" placeholder="فودافون كاش / انستاباي"></div>
        <div class="field"><label>رقم التحويل</label><input class="input ltr" name="number" value="${esc(p.number)}" placeholder="01xxxxxxxxx"></div>
        <div class="field"><label>اسم صاحب الحساب</label><input class="input" name="accountName" value="${esc(p.accountName || '')}"></div>
        <div class="field"><label>رقم واتساب (لاستقبال تأكيد الدفع)</label><input class="input ltr" name="whatsapp" value="${esc(p.whatsapp)}" placeholder="01xxxxxxxxx"><span class="hint">نفس الرقم بيظهر في زر واتساب في كل المتجر</span></div>
        <div class="field full"><label>العنوان</label><input class="input" name="address" value="${esc(p.address)}"></div>
        <div class="field full"><label>وصف / تعليمات الدفع</label><textarea class="input" name="description">${esc(p.description)}</textarea></div>
      </div>
      <div class="row"><button class="btn" id="paySave">${icon('check', 'ico-sm')} حفظ</button><a class="btn btn-ghost" id="waTest" target="_blank" rel="noopener" href="#">${icon('chat', 'ico-sm')} تجربة رقم واتساب</a></div>
    </form>
    <div class="stack"><b class="small muted">معاينة — كما تظهر للعميل</b><div class="pay-preview" id="payPrev"></div></div></div>`);
    const f = $('#payF', c);
    const prev = () => {
      const d = Object.fromEntries(new FormData(f));
      $('#payPrev', c).innerHTML = `<small>المبلغ المطلوب تحويله</small><b style="font-size:30px;color:#e6b768">250 ${esc(cur())}</b><div style="background:rgba(255,255,255,.1);border-radius:14px;padding:12px"><small>${esc(d.methodName || 'رقم التحويل')}</small><div class="n">${esc(d.number || '—')}</div>${d.accountName ? `<small>باسم: ${esc(d.accountName)}</small>` : ''}</div>${d.description ? `<p class="small" style="opacity:.9">${esc(d.description)}</p>` : ''}${d.address ? `<p class="small" style="opacity:.9">📍 ${esc(d.address)}</p>` : ''}<span class="btn btn-wa">${icon('chat', 'ico-sm')} تأكيد الدفع عبر واتساب</span>`;
      $('#waTest', c).href = `https://wa.me/${waNum(d.whatsapp)}?text=${enc('تجربة رسالة من المتجر')}`;
    };
    f.addEventListener('input', () => { prev(); dirty = true; });
    prev();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      busy($('#paySave', c), async () => {
        const r = await api('/api/admin/settings', { method: 'PUT', body: { payment: Object.fromEntries(new FormData(f)) } });
        state.settings = r.settings;
        dirty = false;
        toast('تم حفظ بيانات الدفع — ظاهرة للعملاء الآن');
      });
    });
  }

  /* ================= الكوبونات ================= */
  async function pageCoupons() {
    loading();
    let { coupons } = await api('/api/admin/coupons');
    const c = page('كوبونات الخصم', `<div class="stack"><div class="card"><div class="card-head"><div><h2>الكوبونات</h2><p>العميل يكتب الكود في صفحة إتمام الطلب</p></div><button class="btn btn-sm btn-ghost" id="addCp">${icon('plus', 'ico-sm')} كوبون جديد</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الكود</th><th>النوع</th><th>القيمة</th><th>حد أدنى للطلب</th><th>أقصى استخدام</th><th>استُخدم</th><th>مفعل</th><th></th></tr></thead><tbody id="cps"></tbody></table></div></div>
      <div class="savebar show"><button class="btn" id="saveCp">${icon('check', 'ico-sm')} حفظ الكوبونات</button></div></div>`);
    const draw = () => {
      $('#cps', c).innerHTML = coupons.length ? coupons.map((x, i) => `<tr data-i="${i}"><td><input class="input ltr" data-f="code" value="${esc(x.code)}" style="min-width:120px;text-transform:uppercase"></td><td><select class="input" data-f="type" style="width:auto"><option value="percent" ${x.type === 'percent' ? 'selected' : ''}>نسبة %</option><option value="fixed" ${x.type === 'fixed' ? 'selected' : ''}>مبلغ ثابت</option></select></td><td><input class="input" type="number" min="0" data-f="value" value="${x.value}" style="width:90px"></td><td><input class="input" type="number" min="0" data-f="minTotal" value="${x.minTotal || 0}" style="width:100px"></td><td><input class="input" type="number" min="0" data-f="maxUses" value="${x.maxUses || 0}" style="width:90px" title="0 = غير محدود"></td><td>${x.uses || 0}</td><td><label class="switch"><input type="checkbox" data-f="active" ${x.active !== false ? 'checked' : ''}><span class="tr"></span></label></td><td><button class="icon-btn danger" data-del>${icon('trash')}</button></td></tr>`).join('') : `<tr><td colspan="8"><div class="empty">${icon('tag')}<p>لا توجد كوبونات</p></div></td></tr>`;
      $$('#cps tr[data-i]', c).forEach((tr) => {
        const x = coupons[tr.dataset.i];
        $$('[data-f]', tr).forEach((inp) => inp.addEventListener('input', () => { x[inp.dataset.f] = inp.type === 'checkbox' ? inp.checked : inp.type === 'number' ? Number(inp.value) : inp.value; dirty = true; }));
        $('[data-del]', tr).addEventListener('click', () => { coupons.splice(Number(tr.dataset.i), 1); draw(); dirty = true; });
      });
    };
    draw();
    $('#addCp', c).addEventListener('click', () => { coupons.push({ id: '', code: '', type: 'percent', value: 10, minTotal: 0, maxUses: 0, uses: 0, active: true }); draw(); $('#cps tr:last-child input', c)?.focus(); });
    $('#saveCp', c).addEventListener('click', (e) => busy(e.currentTarget, async () => {
      const r = await api('/api/admin/coupons', { method: 'PUT', body: { coupons } });
      coupons = r.coupons;
      draw();
      dirty = false;
      toast('تم حفظ الكوبونات');
    }));
  }

  /* ================= الإعدادات ================= */
  async function pageSettings() {
    loading();
    const { settings: s } = await api('/api/admin/settings');
    state.settings = s;
    const c = page('إعدادات المتجر', `<div class="stack"><form id="sf" class="stack">
      <div class="card card-pad stack"><h3 style="font-size:15px">هوية المتجر</h3><div class="form-grid">
        <div class="field"><label>اسم المتجر</label><input class="input" name="storeName" value="${esc(s.storeName)}"></div>
        <div class="field"><label>الشعار النصي (Tagline)</label><input class="input" name="tagline" value="${esc(s.tagline)}"></div>
        <div class="field"><label>العملة</label><input class="input" name="currency" value="${esc(s.currency)}"></div>
        <div class="field full"><label>نبذة عن المتجر (تظهر في الفوتر وصفحة من نحن)</label><textarea class="input" name="about">${esc(s.about)}</textarea></div>
        <div class="field full"><label>اللوجو (اختياري — لو مش موجود بيظهر اسم المتجر)</label><div id="logoUp"></div></div>
      </div></div>
      <div class="card card-pad stack"><h3 style="font-size:15px">شريط الإعلان أعلى المتجر</h3>
        <label class="switch"><input type="checkbox" name="an_enabled" ${s.announcement?.enabled ? 'checked' : ''}><span class="tr"></span> إظهار الشريط</label>
        <input class="input" name="an_text" value="${esc(s.announcement?.text || '')}" placeholder="مثال: شحن مجاني للطلبات فوق 500 ج.م"></div>
      <div class="card card-pad stack"><h3 style="font-size:15px">بيانات التواصل</h3><div class="form-grid">
        <div class="field"><label>رقم الهاتف</label><input class="input ltr" name="c_phone" value="${esc(s.contact?.phone || '')}"></div>
        <div class="field"><label>البريد الإلكتروني</label><input class="input ltr" name="c_email" value="${esc(s.contact?.email || '')}"></div>
        <div class="field"><label>العنوان</label><input class="input" name="c_address" value="${esc(s.contact?.address || '')}"></div>
        <div class="field"><label>مواعيد العمل</label><input class="input" name="c_hours" value="${esc(s.contact?.hours || '')}"></div>
      </div></div>
      <div class="card card-pad stack"><h3 style="font-size:15px">السوشيال ميديا</h3><div class="form-grid">
        ${['facebook', 'instagram', 'tiktok', 'youtube'].map((k) => `<div class="field"><label class="ltr" style="text-align:right">${k}</label><input class="input ltr" name="s_${k}" value="${esc(s.social?.[k] || '')}" placeholder="https://"></div>`).join('')}
      </div></div>
      <div class="savebar show"><button class="btn" id="sSave">${icon('check', 'ico-sm')} حفظ الإعدادات</button></div>
    </form>
    <form class="card card-pad stack" id="pwF"><h3 style="font-size:15px">بيانات دخول لوحة التحكم</h3><div class="form-grid">
      <div class="field"><label>البريد الإلكتروني</label><input class="input ltr" name="email" type="email" value="${esc(state.me)}" autocomplete="username"></div>
      <div class="field"><label>كلمة مرور جديدة (اختياري)</label><input class="input ltr" name="password" type="password" autocomplete="new-password" placeholder="اتركها فارغة بدون تغيير"></div>
      <div class="field"><label>كلمة المرور الحالية *</label><input class="input ltr" name="current" type="password" autocomplete="current-password" required></div>
    </div><div><button class="btn btn-gold" id="pwSave">تحديث بيانات الدخول</button></div></form></div>`);
    const logo = uploader({ spec: 'logo', value: s.logo, onChange: () => { dirty = true; } });
    $('#logoUp', c).appendChild(logo.el);
    const f = $('#sf', c);
    f.addEventListener('input', () => { dirty = true; });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      const body = {
        storeName: d.storeName, tagline: d.tagline, currency: d.currency, about: d.about, logo: logo.get(),
        announcement: { enabled: !!d.an_enabled, text: d.an_text },
        contact: { phone: d.c_phone, email: d.c_email, address: d.c_address, hours: d.c_hours },
        social: { facebook: d.s_facebook, instagram: d.s_instagram, tiktok: d.s_tiktok, youtube: d.s_youtube },
      };
      busy($('#sSave', c), async () => {
        const r = await api('/api/admin/settings', { method: 'PUT', body });
        state.settings = r.settings;
        dirty = false;
        $('.side-head b').textContent = r.settings.storeName;
        toast('تم حفظ الإعدادات');
      });
    });
    $('#pwF', c).addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      if (!d.current) return toast('اكتب كلمة المرور الحالية', 'err');
      busy($('#pwSave', c), async () => {
        const r = await api('/api/admin/password', { body: d });
        state.me = r.email;
        e.target.reset();
        $('[name=email]', e.target).value = r.email;
        toast('تم تحديث بيانات الدخول');
      });
    });
  }

  /* ---------------- التشغيل ---------------- */
  async function boot() {
    try {
      const me = await api('/api/admin/me');
      state.me = me.email;
    } catch (_) { return; }
    const { settings } = await api('/api/admin/settings');
    state.settings = settings;
    renderShell();
    startPolling();
    route();
  }
  boot();
})();
