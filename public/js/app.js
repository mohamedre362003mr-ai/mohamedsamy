/* =========================================================
   متجر الكتب — تطبيق الواجهة (بدون أي مكتبات)
   ========================================================= */
(() => {
  'use strict';

  /* ---------------- أدوات ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const enc = encodeURIComponent;
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  const money = (n) => `${nf.format(Number(n) || 0)} ${esc(state.settings?.currency || 'ج.م')}`;
  const moneyTxt = (n) => `${nf.format(Number(n) || 0)} ${state.settings?.currency || 'ج.م'}`;
  const PLACEHOLDER = '/img/placeholder.svg';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* ignore */ } },
  };
  const toDigits = (s) => String(s || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const cleanPhone = (s) => toDigits(s).replace(/[^\d+]/g, '');

  async function api(url, opts = {}) {
    const isForm = opts.body instanceof FormData;
    const res = await fetch(url, {
      method: opts.method || (opts.body ? 'POST' : 'GET'),
      headers: opts.body && !isForm ? { 'Content-Type': 'application/json' } : {},
      body: opts.body ? (isForm ? opts.body : JSON.stringify(opts.body)) : undefined,
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || 'حدث خطأ، حاول مرة أخرى'); e.data = data; e.status = res.status; throw e; }
    return data;
  }

  /* ---------------- أيقونات ---------------- */
  const ICONS = {
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bag: '<path d="M5.5 8h13l-1 12.5h-11z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 1 2-2h13v3H6a2 2 0 0 1-2-1"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    wallet: '<path d="M4 7a2 2 0 0 1 2-2h12v3"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
    star: '<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z"/>',
    sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 3 2.5 5 5.5 5"/>',
    youtube: '<rect x="2.5" y="6" width="19" height="12" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z"/>',
  };
  const icon = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const waIcon = (cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.3 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2zm0 17.9c-1.5 0-3-.4-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 1 1 12 20.1zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.5-.3z"/></svg>`;
  const LOGO_MARK = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 18q11-5 22 0v30q-11-5-22 0z" fill="#e2b86b"/><path d="M54 18q-11-5-22 0v30q11-5 22 0z" fill="#f4dfb4"/></svg>';

  /* ---------------- الحالة ---------------- */
  const state = { settings: null, categories: [], cart: store.get('cart_v1', []), products: new Map() };
  const view = $('#view');
  let renderToken = 0;
  let leaveFns = [];
  const onLeave = (fn) => leaveFns.push(fn);

  /* ---------------- تتبع خط سير الزائر ---------------- */
  const vid = (() => {
    let v = store.get('vid', '');
    if (!/^[a-z0-9]{8,40}$/i.test(v)) { v = (Date.now().toString(36) + Math.random().toString(36).slice(2, 12)).slice(0, 24); store.set('vid', v); }
    return v;
  })();
  const firstInfo = (() => {
    let f = null;
    try { f = JSON.parse(sessionStorage.getItem('first') || 'null'); } catch (_) { /* ignore */ }
    if (f) return f;
    const p = new URLSearchParams(location.search);
    let source = p.get('utm_source') || (p.get('fbclid') ? 'facebook' : p.get('gclid') ? 'google ads' : p.get('ttclid') ? 'tiktok' : '');
    let ref = '';
    try { ref = document.referrer && new URL(document.referrer).host !== location.host ? document.referrer : ''; } catch (_) { /* ignore */ }
    if (!source && ref) {
      const h = new URL(ref).host.replace(/^www\./, '');
      source = /facebook|fb\.|messenger/.test(h) ? 'facebook' : /instagram/.test(h) ? 'instagram' : /google/.test(h) ? 'google' : /tiktok/.test(h) ? 'tiktok' : /whatsapp|wa\.me/.test(h) ? 'whatsapp' : h;
    }
    f = { referrer: ref, source, landing: location.pathname + location.search };
    try { sessionStorage.setItem('first', JSON.stringify(f)); } catch (_) { /* ignore */ }
    return f;
  })();
  const tq = [];
  function track(type, extra = {}) {
    tq.push({ type, path: location.pathname + location.search, title: extra.title || '', data: extra.data, ts: Date.now() });
    if (tq.length >= 12) flushTrack();
  }
  function flushTrack() {
    if (!tq.length) return;
    const now = Date.now();
    const events = tq.splice(0).map((e) => ({ type: e.type, path: e.path, title: e.title, data: e.data, ago: now - e.ts }));
    const body = JSON.stringify({ vid, events, ...firstInfo });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], { type: 'text/plain' }))) return;
    } catch (_) { /* ignore */ }
    fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  }
  setInterval(flushTrack, 4000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushTrack(); });
  addEventListener('pagehide', flushTrack);

  /* ---------------- قفل التمرير (لحل مشكلة القائمة على الموبايل) ---------------- */
  let lockCount = 0;
  let lockY = 0;
  function lockScroll() {
    if (lockCount++ > 0) return;
    lockY = window.scrollY;
    const b = document.body;
    b.style.position = 'fixed';
    b.style.top = `-${lockY}px`;
    b.style.left = '0';
    b.style.right = '0';
    b.style.width = '100%';
    b.classList.add('scroll-locked');
  }
  function unlockScroll() {
    if (lockCount === 0) return;
    if (--lockCount > 0) return;
    const b = document.body;
    b.style.position = b.style.top = b.style.left = b.style.right = b.style.width = '';
    b.classList.remove('scroll-locked');
    window.scrollTo({ top: lockY, left: 0, behavior: 'instant' });
  }

  /* ---------------- القوائم الجانبية ---------------- */
  const overlay = $('#overlay');
  let openDrawerEl = null;
  function openDrawer(el) {
    if (openDrawerEl === el) return;
    if (openDrawerEl) closeDrawer(true);
    openDrawerEl = el;
    overlay.hidden = false;
    lockScroll();
    requestAnimationFrame(() => { overlay.classList.add('show'); el.classList.add('open'); });
    el.setAttribute('aria-hidden', 'false');
    if (el.id === 'menuDrawer') $('#menuBtn').setAttribute('aria-expanded', 'true');
    setTimeout(() => { const f = $('[data-close]', el); if (f) f.focus({ preventScroll: true }); }, 50);
  }
  function closeDrawer(instant) {
    const el = openDrawerEl;
    if (!el) return;
    openDrawerEl = null;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('show');
    $('#menuBtn').setAttribute('aria-expanded', 'false');
    unlockScroll();
    setTimeout(() => { if (!openDrawerEl) overlay.hidden = true; }, instant ? 0 : 300);
  }
  overlay.addEventListener('click', () => closeDrawer());
  $$('[data-close]').forEach((b) => { b.innerHTML = icon('x'); b.addEventListener('click', () => closeDrawer()); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  // لو اتغير حجم الشاشة للكمبيوتر والقائمة مفتوحة نقفلها
  matchMedia('(min-width: 861px)').addEventListener?.('change', (e) => { if (e.matches && openDrawerEl?.id === 'menuDrawer') closeDrawer(true); });

  /* ---------------- Toast ---------------- */
  function toast(msg, type = 'ok', action) {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `${icon(type === 'err' ? 'info' : 'check')}<span>${esc(msg)}</span>${action ? `<a href="#" data-act>${esc(action.label)}</a>` : ''}`;
    if (action) $('[data-act]', t).addEventListener('click', (e) => { e.preventDefault(); action.fn(); t.remove(); });
    $('#toasts').appendChild(t);
    while ($('#toasts').children.length > 3) $('#toasts').firstElementChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ---------------- واتساب ---------------- */
  function waNumber(n) {
    let d = cleanPhone(n).replace(/^\+/, '');
    if (d.startsWith('00')) d = d.slice(2);
    if (/^01\d{9}$/.test(d)) d = `2${d}`; // رقم مصري
    return d;
  }
  const waLink = (n, text = '') => `https://wa.me/${waNumber(n)}${text ? `?text=${enc(text)}` : ''}`;
  function resolveLink(l) {
    if (!l) return '';
    if (l === 'whatsapp') return state.settings?.whatsapp ? waLink(state.settings.whatsapp) : '';
    return l;
  }
  const linkAttrs = (l) => (/^https?:/i.test(l) && !l.startsWith(location.origin) ? 'target="_blank" rel="noopener"' : '');

  /* ---------------- السلة ---------------- */
  const cart = {
    save() { store.set('cart_v1', state.cart); renderCartUI(); },
    count() { return state.cart.reduce((a, i) => a + i.qty, 0); },
    subtotal() { return state.cart.reduce((a, i) => a + i.price * i.qty, 0); },
    add(p, qty = 1) {
      const it = state.cart.find((x) => x.id === p.id);
      const max = p.stock == null ? 99 : p.stock;
      if (it) it.qty = Math.min(it.qty + qty, max, 99);
      else state.cart.push({ id: p.id, qty: Math.min(qty, max, 99), name: p.name, price: p.price, oldPrice: p.oldPrice, image: p.image || p.images?.[0] || '', slug: p.slug, author: p.author || '', stock: p.stock });
      cart.save();
      track('add_to_cart', { title: p.name, data: { id: p.id, name: p.name, qty } });
    },
    set(id, qty) {
      const it = state.cart.find((x) => x.id === id);
      if (!it) return;
      const max = it.stock == null ? 99 : it.stock;
      it.qty = Math.max(1, Math.min(qty, max, 99));
      cart.save();
    },
    remove(id) {
      const it = state.cart.find((x) => x.id === id);
      state.cart = state.cart.filter((x) => x.id !== id);
      cart.save();
      if (it) track('remove_from_cart', { title: it.name, data: { id, name: it.name } });
    },
    clear() { state.cart = []; cart.save(); },
    async refresh() {
      if (!state.cart.length) return;
      try {
        const { products } = await api(`/api/products?ids=${state.cart.map((i) => i.id).join(',')}`);
        let removed = 0;
        state.cart = state.cart.filter((i) => {
          const p = products.find((x) => x.id === i.id);
          if (!p || !p.available || !p.inStock) { removed++; return false; }
          Object.assign(i, { name: p.name, price: p.price, oldPrice: p.oldPrice, image: p.image, slug: p.slug, author: p.author, stock: p.stock });
          if (p.stock != null && i.qty > p.stock) i.qty = p.stock;
          return true;
        });
        cart.save();
        if (removed) toast('تم حذف منتج لم يعد متاحاً من السلة', 'err');
      } catch (_) { /* ignore */ }
    },
  };

  function freeShipBar(sub) {
    const fo = state.settings?.shipping?.freeOver || 0;
    if (!fo) return '';
    const left = fo - sub;
    const pct = Math.min(100, (sub / fo) * 100);
    return `<div class="free-bar">${left > 0 ? `أضف <b>${money(left)}</b> لتحصل على <b>شحن مجاني</b> 🎉` : '🎉 مبروك! طلبك مؤهل <b>للشحن المجاني</b>'}<div class="track"><div class="fill" style="width:${pct}%"></div></div></div>`;
  }

  function renderCartUI() {
    const n = cart.count();
    const btn = $('#cartBtn');
    $('#cartCount').textContent = n;
    btn.classList.toggle('has', n > 0);
    const body = $('#cartBody');
    const foot = $('#cartFoot');
    if (!state.cart.length) {
      body.innerHTML = `<div class="empty">${icon('bag')}<h3>سلتك فارغة</h3><p>ابدأ التسوق وأضف كتبك المفضلة</p><a class="btn" href="/shop" data-link>تصفح الكتب</a></div>`;
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = state.cart.map((i) => `
      <div class="mc-item">
        <a href="/product/${enc(i.slug)}" data-link><img src="${esc(i.image || PLACEHOLDER)}" alt="" loading="lazy"></a>
        <div style="min-width:0">
          <a class="mc-name" href="/product/${enc(i.slug)}" data-link>${esc(i.name)}</a>
          <div class="mc-price">${money(i.price)}</div>
          <div class="qty" style="margin-top:6px">
            <button type="button" data-inc="${i.id}" aria-label="زيادة">${icon('plus', 'ico-sm')}</button>
            <span>${i.qty}</span>
            <button type="button" data-dec="${i.id}" aria-label="تقليل">${icon('minus', 'ico-sm')}</button>
          </div>
        </div>
        <button class="icon-btn mc-remove" type="button" data-remove="${i.id}" aria-label="حذف">${icon('trash', 'ico-sm')}</button>
      </div>`).join('');
    const sub = cart.subtotal();
    foot.innerHTML = `${freeShipBar(sub)}
      <div class="sum-row sum-total" style="border:0;margin:0;padding-top:0"><span>الإجمالي</span><b>${money(sub)}</b></div>
      <p style="font-size:13px;color:var(--muted);margin:2px 0 12px">الشحن يُحسب في صفحة إتمام الطلب</p>
      <div style="display:grid;gap:8px">
        <a class="btn btn-block btn-lg" href="/checkout" data-link>إتمام الطلب ${icon('arrowL')}</a>
        <a class="btn btn-ghost btn-block" href="/cart" data-link>عرض السلة</a>
      </div>`;
  }

  document.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const rem = e.target.closest('[data-remove]');
    if (inc) { const it = state.cart.find((x) => x.id === inc.dataset.inc); if (it) { if (it.stock != null && it.qty >= it.stock) toast(`المتاح ${it.stock} فقط`, 'err'); cart.set(it.id, it.qty + 1); refreshCartViews(); } }
    if (dec) { const it = state.cart.find((x) => x.id === dec.dataset.dec); if (it) { cart.set(it.id, it.qty - 1); refreshCartViews(); } }
    if (rem) { cart.remove(rem.dataset.remove); refreshCartViews(); }
    const add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      const p = state.products.get(add.dataset.add);
      if (!p) return;
      cart.add(p, 1);
      const img = add.closest('.card')?.querySelector('.card-media img');
      flyToCart(img);
      add.classList.add('done');
      add.innerHTML = icon('check');
      setTimeout(() => { add.classList.remove('done'); add.innerHTML = icon('bag'); }, 1400);
      toast('تمت إضافة الكتاب إلى السلة', 'ok', { label: 'عرض السلة', fn: () => openDrawer($('#cartDrawer')) });
    }
  });
  function refreshCartViews() {
    if (location.pathname === '/cart') renderCartPage();
    if (location.pathname === '/checkout') checkoutRefresh && checkoutRefresh();
  }
  let checkoutRefresh = null;

  function flyToCart(img) {
    const btn = $('#cartBtn');
    const bump = () => { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); };
    if (!img || reduceMotion) return bump();
    const r = img.getBoundingClientRect();
    const c = btn.getBoundingClientRect();
    if (!r.width || c.bottom < 0) return bump();
    const f = img.cloneNode();
    f.removeAttribute('loading');
    Object.assign(f.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, zIndex: 300, borderRadius: '10px', pointerEvents: 'none', objectFit: 'cover', margin: 0, boxShadow: '0 20px 40px -10px rgba(0,0,0,.4)' });
    document.body.appendChild(f);
    const dx = c.left + c.width / 2 - (r.left + r.width / 2);
    const dy = c.top + c.height / 2 - (r.top + r.height / 2);
    const a = f.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 60}px) scale(.55)`, opacity: 0.9, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.08)`, opacity: 0.4 },
    ], { duration: 800, easing: 'cubic-bezier(.45,.05,.55,.95)' });
    a.onfinish = () => { f.remove(); bump(); };
  }

  /* ---------------- الراوتر ---------------- */
  const routes = [
    [/^\/$/, viewHome],
    [/^\/shop\/?$/, () => viewListing({})],
    [/^\/search\/?$/, () => viewListing({ search: true })],
    [/^\/category\/([^/]+)\/?$/, (slug) => viewListing({ category: slug })],
    [/^\/product\/([^/]+)\/?$/, viewProduct],
    [/^\/lp\/([^/]+)\/?$/, viewLanding],
    [/^\/cart\/?$/, viewCart],
    [/^\/checkout\/?$/, viewCheckout],
    [/^\/thanks\/([^/]+)\/?$/, viewThanks],
    [/^\/page\/([^/]+)\/?$/, viewPage],
  ];
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function navigate(url, { replace = false } = {}) {
    const u = new URL(url, location.origin);
    if (u.origin !== location.origin) { location.href = url; return; }
    try { history.replaceState({ ...(history.state || {}), y: window.scrollY }, ''); } catch (_) { /* ignore */ }
    if (replace) history.replaceState({ y: 0 }, '', u.pathname + u.search + u.hash);
    else history.pushState({ y: 0 }, '', u.pathname + u.search + u.hash);
    route(0);
  }

  async function route(restoreY) {
    closeDrawer(true);
    leaveFns.forEach((f) => { try { f(); } catch (_) { /* ignore */ } });
    leaveFns = [];
    document.body.classList.remove('lp-mode', 'has-sticky');
    const token = ++renderToken;
    let path = location.pathname;
    try { path = decodeURI(path); } catch (_) { /* ignore */ }
    const r = routes.find(([re]) => re.test(location.pathname));
    updateActiveNav();
    try {
      if (r) {
        const m = location.pathname.match(r[0]).slice(1).map((x) => { try { return decodeURIComponent(x); } catch (_) { return x; } });
        await r[1](...m, token);
      } else viewNotFound();
    } catch (err) {
      if (token !== renderToken) return;
      console.error(err);
      if (err.status === 404) viewNotFound();
      else setView(`<div class="container"><div class="empty">${icon('info')}<h3>حدث خطأ أثناء التحميل</h3><p>${esc(err.message)}</p><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div></div>`);
    }
    if (token !== renderToken) return;
    window.scrollTo({ top: restoreY || 0, left: 0, behavior: 'instant' });
    if (restoreY) setTimeout(() => window.scrollTo({ top: restoreY, behavior: 'instant' }), 60);
    track('page', { title: document.title });
  }

  function setView(html, title) {
    view.innerHTML = html;
    view.classList.remove('view-enter');
    void view.offsetWidth;
    view.classList.add('view-enter');
    if (title) document.title = `${title} | ${state.settings?.storeName || ''}`;
    observeReveal();
  }
  const isStale = (token) => token !== undefined && token !== renderToken;

  addEventListener('popstate', (e) => route(e.state?.y || 0));
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.dataset.native != null) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto|tel|https?:\/\/(?!$))/i.test(href) && !href.startsWith(location.origin)) return;
    const u = new URL(href, location.origin);
    if (u.origin !== location.origin || /^\/(admin|api|uploads)(\/|$)/.test(u.pathname)) return;
    e.preventDefault();
    if (u.pathname === location.pathname && u.search === location.search) { closeDrawer(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    navigate(u.href);
  });

  /* ---------------- ظهور العناصر أثناء التمرير ---------------- */
  let io = null;
  function observeReveal(root = view) {
    const els = $$('.reveal:not(.in), .sec-head:not(.in)', root);
    if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach((el) => el.classList.add('in')); return; }
    if (!io) io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------------- الهيدر والفوتر والقائمة ---------------- */
  function renderChrome() {
    const s = state.settings;
    // الإعلان
    const an = $('#announce');
    if (s.announcement?.enabled && s.announcement.text) { an.innerHTML = `<span>${esc(s.announcement.text)}</span>`; an.hidden = false; }
    // اللوجو
    const logoHTML = s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.storeName)}">` : `<span class="logo-mark">${LOGO_MARK}</span><span class="logo-text">${esc(s.storeName)}</span>`;
    $('#logo').innerHTML = logoHTML;
    $('#menuBtn').innerHTML = icon('menu');
    $('#cartBtn').insertAdjacentHTML('afterbegin', icon('bag'));
    $('.search-btn').innerHTML = icon('search');
    // شريط الأقسام (كمبيوتر)
    const menuCats = state.categories.filter((c) => c.showInMenu);
    $('#catNavIn').innerHTML = `<a href="/" data-nav="/">الرئيسية</a><a href="/shop" data-nav="/shop">كل الكتب</a>${menuCats.map((c) => `<a href="/category/${enc(c.slug)}" data-nav="/category/${esc(c.slug)}">${esc(c.name)}</a>`).join('')}<a href="/shop?sort=sale" class="hot" data-nav="/shop?sort=sale">🔥 العروض</a>`;
    // القائمة الجانبية (موبايل)
    let i = 0;
    $('#menuBody').innerHTML = `
      <ul class="menu-list">
        <li style="--i:${i++}"><a href="/" data-nav="/"><span class="mi">${icon('home')}</span>الرئيسية</a></li>
        <li style="--i:${i++}"><a href="/shop" data-nav="/shop"><span class="mi">${icon('grid')}</span>كل الكتب</a></li>
        <li style="--i:${i++}"><a href="/shop?sort=sale" data-nav="/shop?sort=sale"><span class="mi" style="background:#fbeaec;color:var(--accent)">${icon('tag')}</span>العروض والخصومات</a></li>
      </ul>
      ${menuCats.length ? `<div class="menu-title">الأقسام</div><ul class="menu-list">${menuCats.map((c) => `<li style="--i:${i++}"><a href="/category/${enc(c.slug)}" data-nav="/category/${esc(c.slug)}">${c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : `<span class="mi">${icon('book')}</span>`}${esc(c.name)}<small>${c.count}</small></a></li>`).join('')}</ul>` : ''}
      <div class="menu-title">معلومات</div>
      <ul class="menu-list">
        <li style="--i:${i++}"><a href="/page/about"><span class="mi">${icon('info')}</span>من نحن</a></li>
        <li style="--i:${i++}"><a href="/page/shipping"><span class="mi">${icon('truck')}</span>الشحن والتوصيل</a></li>
        <li style="--i:${i++}"><a href="/page/contact"><span class="mi">${icon('phone')}</span>تواصل معنا</a></li>
      </ul>
      ${s.whatsapp ? `<div class="menu-contact"><a href="${esc(waLink(s.whatsapp))}" target="_blank" rel="noopener" class="btn btn-wa btn-block">${waIcon()} تواصل عبر واتساب</a>${s.contact?.hours ? `<span style="color:var(--muted);font-size:13px;text-align:center">${esc(s.contact.hours)}</span>` : ''}</div>` : ''}`;
    $('#drawerTitle').textContent = s.storeName;
    // زر واتساب العائم
    const wf = $('#waFloat');
    if (s.whatsapp) { wf.href = waLink(s.whatsapp, 'السلام عليكم، عندي استفسار'); wf.innerHTML = waIcon(); wf.hidden = false; wf.addEventListener('click', () => track('whatsapp_float')); }
    // الفوتر
    const soc = s.social || {};
    const socials = ['facebook', 'instagram', 'tiktok', 'youtube'].filter((k) => soc[k]).map((k) => `<a href="${esc(soc[k])}" target="_blank" rel="noopener" aria-label="${k}">${icon(k)}</a>`).join('');
    const c = s.contact || {};
    $('#footer').innerHTML = `
      <div class="container">
        <div class="ftr-grid">
          <div>
            <a class="logo" href="/">${s.logo ? `<img src="${esc(s.logo)}" alt="${esc(s.storeName)}" style="filter:brightness(0) invert(1)">` : `<span class="logo-mark" style="background:rgba(255,255,255,.1)">${LOGO_MARK}</span><span class="logo-text">${esc(s.storeName)}</span>`}</a>
            <p>${esc(s.about || s.tagline || '')}</p>
            ${socials ? `<div class="socials">${socials}</div>` : ''}
          </div>
          <div><h4>الأقسام</h4><ul>${state.categories.slice(0, 6).map((x) => `<li><a href="/category/${enc(x.slug)}">${esc(x.name)}</a></li>`).join('')}</ul></div>
          <div><h4>روابط مهمة</h4><ul><li><a href="/shop">كل الكتب</a></li><li><a href="/shop?sort=sale">العروض</a></li><li><a href="/page/about">من نحن</a></li><li><a href="/page/shipping">الشحن والتوصيل</a></li><li><a href="/page/contact">تواصل معنا</a></li></ul></div>
          <div><h4>تواصل معنا</h4><ul>
            ${c.phone ? `<li><a href="tel:${esc(cleanPhone(c.phone))}" style="display:flex;gap:8px;align-items:center">${icon('phone', 'ico-sm')}<span dir="ltr">${esc(c.phone)}</span></a></li>` : ''}
            ${s.whatsapp ? `<li><a href="${esc(waLink(s.whatsapp))}" target="_blank" rel="noopener" style="display:flex;gap:8px;align-items:center">${icon('chat', 'ico-sm')}واتساب</a></li>` : ''}
            ${c.email ? `<li><a href="mailto:${esc(c.email)}" style="display:flex;gap:8px;align-items:center">${icon('mail', 'ico-sm')}${esc(c.email)}</a></li>` : ''}
            ${c.address ? `<li style="display:flex;gap:8px;align-items:flex-start">${icon('pin', 'ico-sm')}<span>${esc(c.address)}</span></li>` : ''}
            ${c.hours ? `<li style="display:flex;gap:8px;align-items:flex-start">${icon('clock', 'ico-sm')}<span>${esc(c.hours)}</span></li>` : ''}
          </ul></div>
        </div>
        <div class="ftr-bottom"><span>© ${new Date().getFullYear()} ${esc(s.storeName)} — جميع الحقوق محفوظة</span><div class="pay-badges"><span>💳 ${esc(state.payMethod || 'محافظ إلكترونية')}</span><span>🚚 شحن لكل المحافظات</span></div></div>
      </div>`;
  }

  function updateActiveNav() {
    const cur = location.pathname + location.search;
    $$('[data-nav]').forEach((a) => {
      const n = a.dataset.nav;
      a.classList.toggle('active', n === '/' ? cur === '/' : cur === n || (location.pathname.startsWith(n) && !n.includes('?') && n !== '/shop'));
    });
  }

  // ظل الهيدر عند التمرير
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { $('#hdr').classList.toggle('scrolled', window.scrollY > 8); ticking = false; });
  }, { passive: true });

  $('#menuBtn').addEventListener('click', () => openDrawer($('#menuDrawer')));
  $('#cartBtn').addEventListener('click', () => { renderCartUI(); openDrawer($('#cartDrawer')); cart.refresh(); track('cart'); });
  $('#searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#searchInput').value.trim();
    if (!q) return;
    $('#searchInput').blur();
    track('search', { title: q, data: { q } });
    navigate(`/search?q=${enc(q)}`);
  });

  /* ---------------- مكونات ---------------- */
  function remember(list) { (list || []).forEach((p) => state.products.set(p.id, p)); return list; }

  function productCard(p, i = 0) {
    const img = p.image || PLACEHOLDER;
    const url = `/product/${enc(p.slug)}`;
    return `<article class="card reveal" style="--d:${i % 5}">
      <a class="card-media" href="${url}" aria-label="${esc(p.name)}">
        ${p.discount ? `<span class="badge" dir="ltr">-${p.discount}%</span>` : ''}${!p.inStock ? '<span class="badge out">نفدت الكمية</span>' : ''}
        <img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="400" height="600">
        ${p.images && p.images[1] ? `<img class="alt" src="${esc(p.images[1])}" alt="" loading="lazy" decoding="async">` : ''}
        <span class="quick"><span class="btn btn-sm btn-dark">عرض التفاصيل</span></span>
      </a>
      <div class="card-body">
        ${p.category ? `<a class="card-cat" href="/category/${enc(p.category.slug)}">${esc(p.category.name)}</a>` : ''}
        <h3 class="card-title"><a href="${url}">${esc(p.name)}</a></h3>
        ${p.author ? `<p class="card-author">${esc(p.author)}</p>` : ''}
        <div class="card-foot">
          <div class="price"><b>${money(p.price)}</b>${p.oldPrice > p.price ? `<s>${money(p.oldPrice)}</s>` : ''}</div>
          <button class="add-btn" type="button" data-add="${p.id}" aria-label="أضف ${esc(p.name)} للسلة" ${!p.inStock ? 'disabled' : ''}>${icon('bag')}</button>
        </div>
      </div>
    </article>`;
  }

  let railId = 0;
  function productsBlock(products, layout, cols = 4) {
    remember(products);
    if (!products.length) return `<div class="empty">${icon('book')}<p>لا توجد كتب هنا حالياً</p></div>`;
    if (layout === 'carousel') return `<div class="rail" id="rail${++railId}">${products.map(productCard).join('')}</div>`;
    return `<div class="grid ${cols === 5 ? 'grid-5' : ''}">${products.map(productCard).join('')}</div>`;
  }

  const skeletonGrid = (n = 8) => `<div class="grid">${Array.from({ length: n }, () => '<div class="sk sk-card"></div>').join('')}</div>`;

  function secHead(title, subtitle, link, railTarget) {
    if (!title && !subtitle) return '';
    return `<div class="sec-head"><div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
      <div class="sec-actions">${railTarget ? `<div class="rail-nav"><button type="button" data-rail="${railTarget}" data-dir="1" aria-label="السابق">${icon('chevR')}</button><button type="button" data-rail="${railTarget}" data-dir="-1" aria-label="التالي">${icon('chevL')}</button></div>` : ''}${link ? `<a class="sec-link" href="${esc(link)}">عرض الكل ${icon('arrowL')}</a>` : ''}</div></div>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rail]');
    if (!b) return;
    const rail = document.getElementById(b.dataset.rail);
    if (rail) rail.scrollBy({ left: Number(b.dataset.dir) * rail.clientWidth * 0.85, behavior: 'smooth' });
  });

  /* ---------------- أقسام الصفحة الرئيسية ---------------- */
  const SECTIONS = {
    slider(s) {
      const slides = (s.settings.slides || []).filter((x) => x.image);
      if (!slides.length) return '';
      const interval = Math.max(Number(s.settings.interval) || 5, 2);
      return `<section class="hero" data-slider data-interval="${interval}" data-autoplay="${s.settings.autoplay !== false}" aria-roledescription="carousel">
        <div class="hero-track">${slides.map((sl, i) => {
          const hasText = !!(sl.title || sl.subtitle || sl.buttonText);
          const link = resolveLink(sl.link);
          const pic = `<picture>${sl.mobileImage ? `<source media="(max-width: 860px)" srcset="${esc(sl.mobileImage)}">` : ''}<img src="${esc(sl.image)}" alt="${esc(sl.title || '')}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></picture>`;
          return `<div class="slide ${i === 0 ? 'active' : ''} ${hasText ? 'has-text' : ''}" aria-label="${i + 1} / ${slides.length}">
            ${link && !sl.buttonText ? `<a href="${esc(link)}" ${linkAttrs(link)} aria-label="${esc(sl.title || 'عرض')}">${pic}</a>` : pic}
            ${hasText ? `<div class="slide-content container">
              ${sl.kicker ? `<span class="kicker">${esc(sl.kicker)}</span>` : ''}
              ${sl.title ? `<h2>${esc(sl.title)}</h2>` : ''}
              ${sl.subtitle ? `<p>${esc(sl.subtitle)}</p>` : ''}
              ${sl.buttonText && link ? `<div><a class="btn btn-gold btn-lg" href="${esc(link)}" ${linkAttrs(link)}>${esc(sl.buttonText)} ${icon('arrowL')}</a></div>` : ''}
            </div>` : ''}
          </div>`;
        }).join('')}</div>
        ${slides.length > 1 ? `<button class="hero-arrow prev" type="button" data-prev aria-label="السابق">${icon('chevR')}</button><button class="hero-arrow next" type="button" data-next aria-label="التالي">${icon('chevL')}</button>
        <div class="hero-dots">${slides.map((_, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-go="${i}" aria-label="شريحة ${i + 1}"></button>`).join('')}</div>` : ''}
      </section>`;
    },
    banners(s) {
      const items = (s.settings.items || []).filter((x) => x.image);
      if (!items.length) return '';
      const cols = Math.min(Math.max(Number(s.settings.columns) || items.length, 1), 3);
      const ar = cols === 1 ? '1920/600' : cols === 2 ? '1200/700' : '900/900';
      return `<section class="section-sm"><div class="container">${secHead(s.title && s.settings.showTitle ? s.title : '', '', '')}
        <div class="banners c${cols}" style="--ar:${ar}">${items.map((b, i) => {
          const link = resolveLink(b.link);
          const hasText = !!(b.title || b.subtitle || b.buttonText);
          const inner = `<picture>${b.mobileImage ? `<source media="(max-width: 860px)" srcset="${esc(b.mobileImage)}">` : ''}<img src="${esc(b.image)}" alt="${esc(b.title || '')}" loading="lazy" decoding="async"></picture>
            ${hasText ? `<div class="promo-text">${b.subtitle ? `<small>${esc(b.subtitle)}</small>` : ''}${b.title ? `<h3>${esc(b.title)}</h3>` : ''}${b.buttonText ? `<span class="btn btn-light btn-sm">${esc(b.buttonText)} ${icon('arrowL', 'ico-sm')}</span>` : ''}</div>` : ''}`;
          return link ? `<a class="promo reveal ${hasText ? 'has-text' : ''}" style="--d:${i}" href="${esc(link)}" ${linkAttrs(link)}>${inner}</a>` : `<div class="promo reveal ${hasText ? 'has-text' : ''}" style="--d:${i}">${inner}</div>`;
        }).join('')}</div></div></section>`;
    },
    products(s) {
      const st = s.settings || {};
      const link = st.source === 'category' && st.categorySlug ? `/category/${enc(st.categorySlug)}` : st.source === 'bestsellers' ? '/shop?sort=bestsellers' : st.source === 'sale' ? '/shop?sort=sale' : st.source === 'manual' ? '' : '/shop';
      const products = s.products || [];
      if (!products.length) return '';
      const layout = st.layout === 'carousel' ? 'carousel' : 'grid';
      const block = productsBlock(products, layout, Number(st.columns) || 4);
      return `<section class="section"><div class="container">${secHead(s.title, s.subtitle, link, layout === 'carousel' ? `rail${railId}` : '')}${block}</div></section>`;
    },
    categories(s) {
      const cats = s.categories || [];
      if (!cats.length) return '';
      const style = s.settings.style === 'circles' ? 'circles' : '';
      return `<section class="section"><div class="container">${secHead(s.title, s.subtitle, '')}
        <div class="cats ${style}">${cats.map((c, i) => `<a class="cat-card reveal" style="--d:${i % 6}" href="/category/${enc(c.slug)}">
          ${style ? `<div class="img"><img src="${esc(c.image || PLACEHOLDER)}" alt="" loading="lazy"></div>` : `<img src="${esc(c.image || PLACEHOLDER)}" alt="" loading="lazy">`}
          <div class="cat-info"><h3>${esc(c.name)}</h3><small>${c.count} كتاب</small></div></a>`).join('')}</div></div></section>`;
    },
    features(s) {
      const items = s.settings.items || [];
      if (!items.length) return '';
      return `<section class="section-sm"><div class="container"><div class="features">${items.map((f, i) => `<div class="feature reveal" style="--d:${i}"><span class="fi">${icon(ICONS[f.icon] ? f.icon : 'sparkle')}</span><div style="min-width:0"><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div></div>`).join('')}</div></div></section>`;
    },
    text(s) {
      const st = s.settings || {};
      const link = resolveLink(st.link);
      return `<section class="section"><div class="container"><div class="cta reveal ${st.style === 'light' ? '' : st.style === 'gold' ? 'gold' : 'dark'}">
        <div><h2>${esc(s.title)}</h2>${st.text ? `<p>${esc(st.text)}</p>` : ''}</div>
        ${st.buttonText && link ? `<a class="btn ${st.style === 'dark' || !st.style ? 'btn-gold' : ''} btn-lg" href="${esc(link)}" ${linkAttrs(link)}>${st.link === 'whatsapp' ? waIcon() : ''}${esc(st.buttonText)}</a>` : ''}
      </div></div></section>`;
    },
  };

  function initSliders() {
    $$('[data-slider]', view).forEach((el) => {
      const slides = $$('.slide', el);
      const dots = $$('.hero-dots button', el);
      if (slides.length < 2) return;
      const dur = Number(el.dataset.interval) * 1000;
      const auto = el.dataset.autoplay !== 'false';
      el.style.setProperty('--dur', `${dur}ms`);
      let i = 0;
      let t = null;
      let paused = false;
      const schedule = () => { clearTimeout(t); if (auto && !paused) t = setTimeout(() => go(i + 1), dur); };
      const go = (n) => {
        slides[i].classList.remove('active');
        dots[i]?.classList.remove('active');
        i = (n + slides.length) % slides.length;
        slides[i].classList.add('active');
        const img = $('img', slides[i]);
        if (img && img.loading === 'lazy') img.loading = 'eager';
        if (dots[i]) { void dots[i].offsetWidth; dots[i].classList.add('active'); }
        schedule();
      };
      if (!auto) dots.forEach((d) => d.style.setProperty('--dur', '0s'));
      $('[data-next]', el)?.addEventListener('click', () => go(i + 1));
      $('[data-prev]', el)?.addEventListener('click', () => go(i - 1));
      dots.forEach((d) => d.addEventListener('click', () => go(Number(d.dataset.go))));
      el.addEventListener('mouseenter', () => { paused = true; el.classList.add('paused'); clearTimeout(t); });
      el.addEventListener('mouseleave', () => { paused = false; el.classList.remove('paused'); schedule(); });
      let sx = 0;
      let sy = 0;
      el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      el.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx > 0 ? i + 1 : i - 1);
      }, { passive: true });
      const vis = () => { if (document.hidden) clearTimeout(t); else schedule(); };
      document.addEventListener('visibilitychange', vis);
      schedule();
      onLeave(() => { clearTimeout(t); document.removeEventListener('visibilitychange', vis); });
    });
  }

  /* ---------------- الصفحات ---------------- */
  async function viewHome(token) {
    setView(`<div class="sk sk-hero"></div><div class="container section">${skeletonGrid(4)}</div>`);
    const { sections } = await api('/api/home');
    if (isStale(token)) return;
    railId = 0;
    const html = sections.map((s) => (SECTIONS[s.type] ? SECTIONS[s.type](s) : '')).join('');
    setView(html || `<div class="container"><div class="empty">${icon('book')}<h3>أهلاً بك في ${esc(state.settings.storeName)}</h3><a class="btn" href="/shop">تصفح الكتب</a></div></div>`);
    document.title = `${state.settings.storeName} — ${state.settings.tagline || ''}`;
    initSliders();
  }

  const SORTS = [['latest', 'الأحدث'], ['bestsellers', 'الأكثر مبيعاً'], ['price_asc', 'السعر: من الأقل'], ['price_desc', 'السعر: من الأعلى'], ['sale', 'العروض'], ['name', 'الاسم']];

  async function viewListing({ category, search }, token) {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    const sort = params.get('sort') || 'latest';
    if (search) $('#searchInput').value = q;
    setView(`<div class="container page-hero"><div class="sk" style="height:46px;width:40%;margin-bottom:22px"></div>${skeletonGrid(8)}</div>`);
    let page = 1;
    const qs = () => new URLSearchParams({ ...(category ? { category } : {}), ...(q ? { q } : {}), sort, page, limit: 20 }).toString();
    const data = await api(`/api/products?${qs()}`);
    if (isStale(token)) return;
    const cat = data.category;
    let title = 'كل الكتب';
    if (cat) title = cat.name;
    else if (search) title = q ? `نتائج البحث عن "${q}"` : 'البحث';
    else if (sort === 'sale') title = 'العروض والخصومات';
    else if (sort === 'bestsellers') title = 'الأكثر مبيعاً';
    const crumbs = `<nav class="crumbs"><a href="/">الرئيسية</a>${icon('chevL')}${cat ? `<a href="/shop">كل الكتب</a>${icon('chevL')}` : ''}<span>${esc(cat ? cat.name : title)}</span></nav>`;
    const head = cat
      ? `<div class="cat-banner reveal"><div>${crumbs}<h1 class="page-title">${esc(cat.name)}</h1>${cat.description ? `<p class="page-desc">${esc(cat.description)}</p>` : ''}</div>${cat.image ? `<img src="${esc(cat.image)}" alt="">` : ''}</div>`
      : `${crumbs}<h1 class="page-title">${esc(title)}</h1>`;
    const chips = `<div class="chips"><a class="chip ${!cat ? 'active' : ''}" href="/shop${sort !== 'latest' ? `?sort=${sort}` : ''}">الكل</a>${state.categories.map((c) => `<a class="chip ${cat && cat.id === c.id ? 'active' : ''}" href="/category/${enc(c.slug)}">${esc(c.name)}</a>`).join('')}</div>`;
    setView(`<div class="container page-hero">${head}
      <div class="toolbar">${search ? '' : chips}
        <span class="result-count">${data.total} كتاب</span>
        <div class="sort-wrap"><select class="select" id="sortSel" aria-label="ترتيب">${SORTS.map(([v, l]) => `<option value="${v}" ${v === sort ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
      <div id="listGrid">${data.products.length ? productsBlock(data.products, 'grid') : `<div class="empty">${icon('search')}<h3>لا توجد نتائج</h3><p>جرّب كلمات بحث أخرى أو تصفح الأقسام</p><a class="btn" href="/shop">كل الكتب</a></div>`}</div>
      ${data.pages > 1 ? '<div class="load-more"><button class="btn btn-ghost btn-lg" id="moreBtn">تحميل المزيد</button></div>' : ''}
    </div>`, title);
    if (cat) track('category', { title: cat.name, data: { slug: cat.slug } });
    $('#sortSel').addEventListener('change', (e) => {
      const p = new URLSearchParams(location.search);
      p.set('sort', e.target.value);
      navigate(`${location.pathname}?${p.toString()}`, { replace: true });
    });
    const more = $('#moreBtn');
    if (more) more.addEventListener('click', async () => {
      more.disabled = true;
      more.innerHTML = '<span class="spin" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary)"></span>';
      page++;
      const d = await api(`/api/products?${qs()}`);
      remember(d.products);
      $('#listGrid .grid').insertAdjacentHTML('beforeend', d.products.map(productCard).join(''));
      observeReveal();
      if (page >= d.pages) more.parentElement.remove();
      else { more.disabled = false; more.textContent = 'تحميل المزيد'; }
    });
  }

  async function viewProduct(slug, token) {
    setView(`<div class="container pdp"><div class="sk" style="aspect-ratio:4/5"></div><div style="display:grid;gap:16px"><div class="sk" style="height:50px"></div><div class="sk" style="height:24px;width:50%"></div><div class="sk" style="height:80px"></div><div class="sk" style="height:56px"></div></div></div>`);
    const { product: p, related } = await api(`/api/products/${enc(slug)}`);
    if (isStale(token)) return;
    remember([p]);
    remember(related);
    const imgs = p.images.length ? p.images : [PLACEHOLDER];
    const s = state.settings;
    const shipFrom = Math.min(...(s.shipping.zones.map((z) => z.price).filter((x) => x >= 0)), Infinity);
    setView(`<div class="container">
      <nav class="crumbs" style="padding-top:18px"><a href="/">الرئيسية</a>${icon('chevL')}${p.category ? `<a href="/category/${enc(p.category.slug)}">${esc(p.category.name)}</a>${icon('chevL')}` : ''}<span>${esc(p.name)}</span></nav>
      <div class="pdp">
        <div class="gallery ${imgs.length < 2 ? 'single' : ''}">
          ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((im, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-img="${esc(im)}" aria-label="صورة ${i + 1}"><img src="${esc(im)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
          <div class="main-img" id="mainImg">${p.discount ? `<span class="badge" dir="ltr">-${p.discount}%</span>` : ''}<img src="${esc(imgs[0])}" alt="${esc(p.name)}" fetchpriority="high"></div>
        </div>
        <div class="pinfo">
          ${p.category ? `<a class="cat-link" href="/category/${enc(p.category.slug)}">${esc(p.category.name)}</a>` : ''}
          <h1>${esc(p.name)}</h1>
          ${p.author ? `<p class="author">تأليف: <b>${esc(p.author)}</b></p>` : ''}
          <div class="pprice"><b>${money(p.price)}</b>${p.oldPrice > p.price ? `<s>${money(p.oldPrice)}</s><span class="save">وفّر ${money(p.oldPrice - p.price)}</span>` : ''}</div>
          <span class="stock ${p.inStock ? '' : 'no'}">${p.inStock ? (p.stock != null && p.stock <= 5 ? `متبقي ${p.stock} نسخ فقط — اطلب الآن` : 'متوفر في المخزون') : 'نفدت الكمية حالياً'}</span>
          <div class="buy-row" id="buyRow">
            <div class="qty qty-lg"><button type="button" id="qInc" aria-label="زيادة">${icon('plus')}</button><input id="qVal" type="number" inputmode="numeric" value="1" min="1" max="${p.stock ?? 99}" aria-label="الكمية"><button type="button" id="qDec" aria-label="تقليل">${icon('minus')}</button></div>
            <button class="btn btn-lg" id="addBtn" ${p.inStock ? '' : 'disabled'}>${icon('bag')} أضف للسلة</button>
            <button class="btn btn-gold btn-lg" id="buyBtn" ${p.inStock ? '' : 'disabled'}>اشترِ الآن</button>
          </div>
          <div class="trust">
            <div>${icon('truck')}<span>شحن لكل المحافظات${Number.isFinite(shipFrom) ? ` يبدأ من ${money(shipFrom)}` : ''}${s.shipping.freeOver ? ` — مجاني فوق ${money(s.shipping.freeOver)}` : ''}</span></div>
            <div>${icon('shield')}<span>نسخة أصلية مضمونة</span></div>
            <div>${icon('wallet')}<span>الدفع عبر المحفظة الإلكترونية وتأكيد الطلب على واتساب</span></div>
          </div>
          ${p.publisher || p.pages || p.sku ? `<div class="pmeta">${p.publisher ? `<div><small>دار النشر</small><b>${esc(p.publisher)}</b></div>` : ''}${p.pages ? `<div><small>عدد الصفحات</small><b>${p.pages}</b></div>` : ''}${p.sku ? `<div><small>كود المنتج</small><b>${esc(p.sku)}</b></div>` : ''}</div>` : ''}
          ${p.description ? `<div class="desc"><h2>عن الكتاب</h2><p>${esc(p.description)}</p></div>` : ''}
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${s.whatsapp ? `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${esc(waLink(s.whatsapp, `استفسار عن كتاب: ${p.name}\n${location.href}`))}">${icon('chat', 'ico-sm')} اسأل عن الكتاب</a>` : ''}
            <button class="btn btn-ghost btn-sm" id="shareBtn">${icon('share', 'ico-sm')} مشاركة</button>
          </div>
        </div>
      </div>
      ${related.length ? `<section class="section">${secHead('قد يعجبك أيضاً', 'كتب مشابهة اخترناها لك', p.category ? `/category/${enc(p.category.slug)}` : '/shop', `rail${railId + 1}`)}${productsBlock(related, 'carousel')}</section>` : ''}
    </div>
    <div class="sticky-buy" id="stickyBuy"><div class="price"><b>${money(p.price)}</b>${p.oldPrice > p.price ? `<s>${money(p.oldPrice)}</s>` : ''}</div><button class="btn" id="stAdd" ${p.inStock ? '' : 'disabled'}>${icon('bag')} أضف للسلة</button></div>`, p.name);
    track('product', { title: p.name, data: { id: p.id, name: p.name } });

    const main = $('#mainImg');
    const mainImg = $('img', main);
    $$('.thumbs button').forEach((b) => b.addEventListener('click', () => {
      $$('.thumbs button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      mainImg.style.opacity = 0;
      setTimeout(() => { mainImg.src = b.dataset.img; mainImg.style.opacity = 1; }, 180);
    }));
    if (matchMedia('(hover: hover)').matches) {
      main.addEventListener('click', () => main.classList.toggle('zoom'));
      main.addEventListener('mousemove', (e) => { const r = main.getBoundingClientRect(); main.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`); main.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`); });
      main.addEventListener('mouseleave', () => main.classList.remove('zoom'));
    }
    const qv = $('#qVal');
    const max = p.stock ?? 99;
    const clampQ = () => { qv.value = Math.max(1, Math.min(parseInt(toDigits(qv.value), 10) || 1, max)); };
    $('#qInc').addEventListener('click', () => { qv.value = (parseInt(qv.value, 10) || 1) + 1; clampQ(); });
    $('#qDec').addEventListener('click', () => { qv.value = (parseInt(qv.value, 10) || 1) - 1; clampQ(); });
    qv.addEventListener('change', clampQ);
    const add = (go) => {
      clampQ();
      const inCart = state.cart.find((x) => x.id === p.id)?.qty || 0;
      if (p.stock != null && inCart + Number(qv.value) > p.stock) { toast(`المتاح ${p.stock} نسخ فقط`, 'err'); if (!go) return; }
      cart.add(p, Number(qv.value));
      if (go) return navigate('/checkout');
      flyToCart(mainImg);
      toast('تمت إضافة الكتاب إلى السلة', 'ok', { label: 'إتمام الطلب', fn: () => navigate('/checkout') });
    };
    $('#addBtn').addEventListener('click', () => add(false));
    $('#stAdd').addEventListener('click', () => add(false));
    $('#buyBtn').addEventListener('click', () => add(true));
    $('#shareBtn').addEventListener('click', async () => {
      try {
        if (navigator.share) await navigator.share({ title: p.name, url: location.href });
        else { await navigator.clipboard.writeText(location.href); toast('تم نسخ رابط الكتاب'); }
      } catch (_) { /* ignore */ }
    });
    // شريط الشراء الثابت على الموبايل
    const sticky = $('#stickyBuy');
    if ('IntersectionObserver' in window) {
      const ob = new IntersectionObserver(([en]) => {
        const show = !en.isIntersecting && en.boundingClientRect.top < 0;
        sticky.classList.toggle('show', show);
        document.body.classList.toggle('has-sticky', show && matchMedia('(max-width: 860px)').matches);
      });
      ob.observe($('#buyRow'));
      onLeave(() => ob.disconnect());
    }
  }

  function renderCartPage() {
    const el = $('#cartPage');
    if (!el) return;
    if (!state.cart.length) {
      el.innerHTML = `<div class="empty" style="padding-block:70px">${icon('bag')}<h3>سلتك فارغة</h3><p>لم تقم بإضافة أي كتب بعد</p><a class="btn btn-lg" href="/shop">ابدأ التسوق</a></div>`;
      return;
    }
    const sub = cart.subtotal();
    const saved = state.cart.reduce((a, i) => a + Math.max((i.oldPrice || 0) - i.price, 0) * i.qty, 0);
    el.innerHTML = `<div class="two-col">
      <div class="panel">
        ${state.cart.map((i) => `<div class="cart-row">
          <a href="/product/${enc(i.slug)}"><img src="${esc(i.image || PLACEHOLDER)}" alt=""></a>
          <div style="min-width:0"><a href="/product/${enc(i.slug)}" style="font-weight:600;line-height:1.5;display:block">${esc(i.name)}</a>${i.author ? `<small style="color:var(--muted)">${esc(i.author)}</small>` : ''}<div style="color:var(--primary);font-weight:700;margin-top:4px">${money(i.price)}</div></div>
          <div class="r-end">
            <div class="qty"><button type="button" data-inc="${i.id}" aria-label="زيادة">${icon('plus', 'ico-sm')}</button><span>${i.qty}</span><button type="button" data-dec="${i.id}" aria-label="تقليل">${icon('minus', 'ico-sm')}</button></div>
            <button class="icon-btn mc-remove" data-remove="${i.id}" aria-label="حذف">${icon('trash', 'ico-sm')}</button>
            <b>${money(i.price * i.qty)}</b>
          </div>
        </div>`).join('')}
      </div>
      <div class="panel summary">
        <h2>ملخص الطلب</h2>
        ${freeShipBar(sub)}
        <div class="sum-row"><span>عدد الكتب</span><b>${cart.count()}</b></div>
        ${saved ? `<div class="sum-row" style="color:var(--ok)"><span>وفّرت</span><b style="color:var(--ok)">${money(saved)}</b></div>` : ''}
        <div class="sum-row"><span>الشحن</span><span>يُحدد حسب المحافظة</span></div>
        <div class="sum-row sum-total"><span>المجموع</span><b>${money(sub)}</b></div>
        <a class="btn btn-lg btn-block" href="/checkout" style="margin-top:14px">إتمام الطلب ${icon('arrowL')}</a>
        <a class="btn btn-ghost btn-block" href="/shop" style="margin-top:8px">متابعة التسوق</a>
      </div>
    </div>`;
  }

  async function viewCart() {
    setView(`<div class="container page-hero"><nav class="crumbs"><a href="/">الرئيسية</a>${icon('chevL')}<span>السلة</span></nav><h1 class="page-title">سلة المشتريات</h1></div><div class="container" id="cartPage"></div>`, 'سلة المشتريات');
    renderCartPage();
    await cart.refresh();
    renderCartPage();
  }

  /* ---------- نموذج بيانات العميل (مشترك بين الدفع وصفحة الهبوط) ---------- */
  function customerFields(c = {}) {
    const zones = state.settings.shipping.zones;
    return `<div class="form-grid">
      <div class="field full" data-f="name"><label for="f_name">الاسم بالكامل <span class="req">*</span></label><input class="input" id="f_name" name="name" autocomplete="name" value="${esc(c.name || '')}" placeholder="مثال: محمد أحمد" required><span class="msg"></span></div>
      <div class="field" data-f="phone"><label for="f_phone">رقم الهاتف <span class="req">*</span></label><input class="input" id="f_phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.phone || '')}" placeholder="01xxxxxxxxx" required><span class="msg"></span></div>
      <div class="field" data-f="phone2"><label for="f_phone2">رقم هاتف آخر <span class="opt">(اختياري)</span></label><input class="input" id="f_phone2" name="phone2" type="tel" inputmode="tel" value="${esc(c.phone2 || '')}" placeholder="01xxxxxxxxx"><span class="msg"></span></div>
      <div class="field" data-f="zoneId"><label for="f_zone">المحافظة <span class="req">*</span></label><select id="f_zone" name="zoneId" required><option value="">اختر المحافظة</option>${zones.map((z) => `<option value="${z.id}" ${c.zoneId === z.id ? 'selected' : ''}>${esc(z.name)} — شحن ${moneyTxt(z.price)}</option>`).join('')}</select><span class="msg"></span></div>
      <div class="field" data-f="city"><label for="f_city">المدينة / المنطقة</label><input class="input" id="f_city" name="city" autocomplete="address-level2" value="${esc(c.city || '')}" placeholder="مثال: مدينة نصر"><span class="msg"></span></div>
      <div class="field full" data-f="address"><label for="f_address">العنوان بالتفصيل <span class="req">*</span></label><input class="input" id="f_address" name="address" autocomplete="street-address" value="${esc(c.address || '')}" placeholder="الشارع، رقم العمارة، الدور، علامة مميزة" required><span class="msg"></span></div>
      <div class="field full" data-f="notes"><label for="f_notes">ملاحظات على الطلب <span class="opt">(اختياري)</span></label><textarea id="f_notes" name="notes" placeholder="أي ملاحظات تحب تضيفها">${esc(c.notes || '')}</textarea></div>
    </div>`;
  }
  function readCustomer(form) {
    const f = new FormData(form);
    return { name: String(f.get('name') || '').trim(), phone: cleanPhone(f.get('phone')), phone2: cleanPhone(f.get('phone2')), zoneId: String(f.get('zoneId') || ''), city: String(f.get('city') || '').trim(), address: String(f.get('address') || '').trim(), notes: String(f.get('notes') || '').trim() };
  }
  function validateCustomer(form, c) {
    const errs = {};
    if (c.name.length < 2) errs.name = 'اكتب الاسم بالكامل';
    if (!/^\+?\d{8,15}$/.test(c.phone)) errs.phone = 'اكتب رقم هاتف صحيح';
    else if (/^0\d+$/.test(c.phone) && !/^01[0125]\d{8}$/.test(c.phone)) errs.phone = 'رقم الموبايل المصري يتكون من 11 رقم ويبدأ بـ 01';
    if (c.phone2 && !/^\+?\d{8,15}$/.test(c.phone2)) errs.phone2 = 'الرقم غير صحيح';
    if (!c.zoneId) errs.zoneId = 'اختر المحافظة';
    if (c.address.length < 4) errs.address = 'اكتب العنوان بالتفصيل';
    showErrors(form, errs);
    return !Object.keys(errs).length;
  }
  function showErrors(form, errs) {
    $$('.field', form).forEach((f) => { f.classList.remove('err'); const m = $('.msg', f); if (m) m.textContent = ''; });
    const keys = Object.keys(errs || {});
    keys.forEach((k) => { const f = $(`[data-f="${k}"]`, form); if (f) { f.classList.add('err'); $('.msg', f).textContent = errs[k]; } });
    if (keys.length) { const first = $(`[data-f="${keys[0]}"]`, form); first?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('input,select', first)?.focus({ preventScroll: true }), 350); }
  }
  function bindFieldClear(form) {
    form.addEventListener('input', (e) => { const f = e.target.closest('.field'); if (f) { f.classList.remove('err'); const m = $('.msg', f); if (m) m.textContent = ''; } });
  }

  function summaryHTML(q, items) {
    return `<div class="sum-items">${items.map((i) => `<div class="sum-item"><div class="im"><img src="${esc(i.image || PLACEHOLDER)}" alt=""><span class="q">${i.qty}</span></div><span style="min-width:0;line-height:1.5">${esc(i.name)}</span><b>${money(i.price * i.qty)}</b></div>`).join('')}</div>
      <div class="sum-row"><span>المجموع الفرعي</span><b>${money(q.subtotal)}</b></div>
      ${q.discount ? `<div class="sum-row" style="color:var(--ok)"><span>الخصم ${q.coupon ? `(${esc(q.coupon)})` : ''}</span><b style="color:var(--ok)">- ${money(q.discount)}</b></div>` : ''}
      <div class="sum-row"><span>الشحن ${q.zone ? `(${esc(q.zone)})` : ''}</span><b>${q.zone ? (q.freeShipping ? '<span style="color:var(--ok)">مجاني</span>' : money(q.shipping)) : '<span style="color:var(--muted);font-weight:400">اختر المحافظة</span>'}</b></div>
      <div class="sum-row sum-total"><span>الإجمالي</span><b>${money(q.total)}</b></div>`;
  }

  async function submitOrder(form, btn, payload) {
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> جاري تأكيد الطلب...';
    try {
      const r = await api('/api/orders', { body: { ...payload, vid } });
      store.set('customer_v1', { ...payload.customer, notes: '' });
      flushTrack();
      return r;
    } catch (err) {
      if (err.data?.fields) showErrors(form, err.data.fields);
      toast(err.message, 'err');
      btn.disabled = false;
      btn.innerHTML = old;
      return null;
    }
  }

  async function viewCheckout(token) {
    if (!state.cart.length) {
      setView(`<div class="container"><div class="empty" style="padding-block:80px">${icon('bag')}<h3>سلتك فارغة</h3><p>أضف بعض الكتب أولاً لإتمام الطلب</p><a class="btn btn-lg" href="/shop">تصفح الكتب</a></div></div>`, 'إتمام الطلب');
      return;
    }
    await cart.refresh();
    if (isStale(token)) return;
    if (!state.cart.length) return viewCheckout(token);
    track('checkout', { title: 'إتمام الطلب', data: { items: cart.count(), total: cart.subtotal() } });
    const saved = store.get('customer_v1', {});
    let coupon = store.get('coupon', '');
    setView(`<div class="container page-hero"><nav class="crumbs"><a href="/">الرئيسية</a>${icon('chevL')}<a href="/cart">السلة</a>${icon('chevL')}<span>إتمام الطلب</span></nav><h1 class="page-title">إتمام الطلب</h1></div>
      <div class="container"><form class="two-col" id="coForm" novalidate>
        <div>
          <div class="panel"><h2><span class="num">1</span> بيانات الاستلام</h2>${customerFields(saved)}</div>
          <div class="panel"><h2><span class="num">2</span> طريقة الدفع</h2>
            <label style="display:flex;gap:12px;align-items:center;padding:14px;border:2px solid var(--primary);border-radius:14px;background:var(--primary-soft)">
              <input type="radio" checked style="width:20px;height:20px;accent-color:var(--primary)"> <span><b>${esc(state.payMethod || 'تحويل على المحفظة')}</b><br><small style="color:var(--muted)">بعد تأكيد الطلب هيظهرلك رقم التحويل، وبعد الدفع تبعتلنا الإيصال على واتساب</small></span>
            </label>
          </div>
        </div>
        <div class="panel summary">
          <h2>ملخص الطلب</h2>
          <div id="coSum"></div>
          <div class="coupon" style="margin-top:14px"><input class="input" id="cpIn" placeholder="كود الخصم" value="${esc(coupon)}" aria-label="كود الخصم"><button type="button" class="btn btn-dark" id="cpBtn">تطبيق</button></div>
          <div id="cpMsg" style="font-size:13px;margin-top:6px"></div>
          <button class="btn btn-gold btn-lg btn-block" type="submit" id="coSubmit" style="margin-top:16px">${icon('lock')} تأكيد الطلب</button>
          <div class="secure">${icon('shield', 'ico-sm')} بياناتك محمية ولن نشاركها مع أي جهة</div>
        </div>
      </form></div>`, 'إتمام الطلب');
    const form = $('#coForm');
    bindFieldClear(form);
    let qTimer = null;
    let lastQuote = null;
    const quote = async () => {
      const zoneId = $('#f_zone').value;
      try {
        const q = await api('/api/quote', { body: { items: state.cart.map((i) => ({ id: i.id, qty: i.qty })), zoneId, coupon } });
        lastQuote = q;
        if ($('#coSum')) $('#coSum').innerHTML = summaryHTML(q, state.cart);
        return q;
      } catch (_) { return null; }
    };
    checkoutRefresh = () => { if (!state.cart.length) return route(0); clearTimeout(qTimer); qTimer = setTimeout(quote, 150); };
    onLeave(() => { checkoutRefresh = null; });
    $('#coSum').innerHTML = summaryHTML({ subtotal: cart.subtotal(), discount: 0, shipping: 0, total: cart.subtotal() }, state.cart);
    quote();
    $('#f_zone').addEventListener('change', quote);
    const applyCoupon = async () => {
      const code = $('#cpIn').value.trim();
      const msg = $('#cpMsg');
      if (!code) { coupon = ''; store.set('coupon', ''); msg.textContent = ''; return quote(); }
      try {
        const r = await api('/api/coupon', { body: { code, subtotal: cart.subtotal() } });
        coupon = r.code;
        store.set('coupon', coupon);
        msg.innerHTML = `<span style="color:var(--ok)">✓ تم تطبيق الكوبون — خصم ${money(r.discount)}</span>`;
      } catch (err) {
        coupon = '';
        store.set('coupon', '');
        msg.innerHTML = `<span style="color:var(--accent)">${esc(err.message)}</span>`;
      }
      quote();
    };
    $('#cpBtn').addEventListener('click', applyCoupon);
    $('#cpIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } });
    if (coupon) applyCoupon();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const c = readCustomer(form);
      if (!validateCustomer(form, c)) return;
      const r = await submitOrder(form, $('#coSubmit'), { customer: c, items: state.cart.map((i) => ({ id: i.id, qty: i.qty })), coupon, source: 'store' });
      if (!r) return;
      cart.clear();
      store.set('coupon', '');
      navigate(`/thanks/${r.id}?t=${r.token}`, { replace: true });
    });
  }

  /* ---------- صفحة الشكر + الدفع + واتساب ---------- */
  function buildWhatsAppMessage(o, receiptUrl) {
    const c = o.customer;
    const cur = state.settings.currency;
    const lines = [];
    lines.push('السلام عليكم 👋');
    lines.push(`تم الدفع لطلبي رقم #${o.number} وده تفاصيله:`);
    lines.push('');
    lines.push(`👤 الاسم: ${c.name}`);
    lines.push(`📞 رقم الهاتف: ${c.phone}`);
    if (c.phone2) lines.push(`📞 رقم آخر: ${c.phone2}`);
    lines.push(`📍 العنوان: ${[c.governorate, c.city, c.address].filter(Boolean).join(' - ')}`);
    if (c.notes) lines.push(`📝 ملاحظات: ${c.notes}`);
    lines.push('');
    lines.push('📚 الطلب:');
    o.items.forEach((i, n) => lines.push(`${n + 1}) ${i.name} × ${i.qty} = ${nf.format(i.price * i.qty)} ${cur}`));
    lines.push('');
    lines.push(`المجموع: ${nf.format(o.subtotal)} ${cur}`);
    if (o.discount) lines.push(`الخصم${o.coupon ? ` (${o.coupon})` : ''}: -${nf.format(o.discount)} ${cur}`);
    lines.push(`الشحن: ${o.shipping ? `${nf.format(o.shipping)} ${cur}` : 'مجاني'}`);
    lines.push(`💰 الإجمالي المدفوع: ${nf.format(o.total)} ${cur}`);
    lines.push('');
    lines.push(`💳 طريقة الدفع: ${o.payment.methodName || 'تحويل'}${o.payment.number ? ` على رقم ${o.payment.number}` : ''}`);
    lines.push('✅ تم تحويل المبلغ');
    if (receiptUrl) lines.push(`🧾 صورة إيصال الدفع: ${location.origin}${receiptUrl}`);
    lines.push('📎 مرفق صورة/سكرين شوت إيصال الدفع');
    return lines.join('\n');
  }

  async function compressImage(file, max = 1600, q = 0.85) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(bmp.width * s);
      cv.height = Math.round(bmp.height * s);
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', q));
      return blob || file;
    } catch (_) { return file; }
  }

  async function viewThanks(id, token) {
    const t = new URLSearchParams(location.search).get('t') || '';
    setView('<div class="container thanks"><div class="sk" style="height:200px"></div><div class="sk" style="height:260px"></div></div>');
    const { order: o } = await api(`/api/orders/${enc(id)}?t=${enc(t)}`);
    if (isStale(token)) return;
    const pay = o.payment;
    let receipt = o.receipt;
    const waTarget = pay.whatsapp || state.settings.whatsapp;
    setView(`<div class="container thanks">
      <div class="thanks-head">
        <svg class="check-anim" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><path d="M30 52l14 14 27-30"/></svg>
        <h1>شكراً لك، ${esc(o.customer.name.split(' ')[0])}!</h1>
        <p style="color:var(--muted)">تم استلام طلبك بنجاح. أكمل الدفع لتأكيد الطلب وشحنه في أسرع وقت.</p>
        <span class="order-no">${icon('bag', 'ico-sm')} رقم الطلب: #${o.number}</span>
      </div>

      <div class="pay-box reveal">
        <div class="amount">المبلغ المطلوب تحويله<b>${money(o.total)}</b></div>
        ${pay.number ? `<div class="pay-num"><div><small>${esc(pay.methodName || 'رقم التحويل')}</small><span class="n">${esc(pay.number)}</span>${pay.accountName ? `<small>باسم: ${esc(pay.accountName)}</small>` : ''}</div><button class="btn btn-light btn-sm" type="button" id="copyNum">${icon('copy', 'ico-sm')} نسخ الرقم</button></div>` : ''}
        <div class="pay-info">
          ${pay.description ? `<div>${icon('info', 'ico-sm')}<span>${esc(pay.description)}</span></div>` : ''}
          ${pay.address ? `<div>${icon('pin', 'ico-sm')}<span>${esc(pay.address)}</span></div>` : ''}
        </div>
      </div>

      <div class="panel reveal">
        <div class="steps">
          <div class="step"><div><h3>حوّل المبلغ</h3><p>حوّل <b>${money(o.total)}</b> على الرقم الموضح بالأعلى.</p></div></div>
          <div class="step"><div style="min-width:0"><h3>ارفع صورة إيصال الدفع</h3><p style="margin-bottom:10px">ارفع سكرين شوت التحويل هنا عشان يوصلنا مع رسالتك (اختياري لكن بيسرّع التأكيد).</p>
            <label class="drop ${receipt ? 'ok' : ''}" id="drop">${receipt ? `<img src="${esc(receipt)}" alt="الإيصال"><span>${icon('check', 'ico-sm')} تم رفع الإيصال — اضغط للتغيير</span>` : `${icon('upload', 'ico-lg')}<span>اضغط لاختيار صورة الإيصال</span><small>JPG / PNG</small>`}<input type="file" accept="image/*" id="rcpt"></label></div></div>
          <div class="step"><div style="min-width:0"><h3>أرسل التأكيد على واتساب</h3><p style="margin-bottom:12px">اضغط الزر وهتتفتح رسالة جاهزة فيها بياناتك وطلبك — أرسلها وارفق صورة الإيصال في المحادثة.</p>
            ${waTarget ? `<a class="btn btn-wa btn-block wa-btn" id="waBtn" target="_blank" rel="noopener" href="#">${waIcon()} تأكيد الدفع عبر واتساب</a>` : '<p style="color:var(--accent)">لم يتم إضافة رقم واتساب بعد</p>'}
          </div></div>
        </div>
      </div>

      <div class="panel reveal">
        <h2>تفاصيل الطلب</h2>
        ${summaryHTML({ subtotal: o.subtotal, discount: o.discount, coupon: o.coupon, shipping: o.shipping, freeShipping: !o.shipping, total: o.total, zone: o.customer.governorate }, o.items)}
        <div style="margin-top:16px;padding:14px;border-radius:14px;background:var(--surface-2);font-size:14.5px;display:grid;gap:4px">
          <div><b>الاسم:</b> ${esc(o.customer.name)}</div>
          <div><b>الهاتف:</b> <span dir="ltr">${esc(o.customer.phone)}</span>${o.customer.phone2 ? ` — <span dir="ltr">${esc(o.customer.phone2)}</span>` : ''}</div>
          <div><b>العنوان:</b> ${esc([o.customer.governorate, o.customer.city, o.customer.address].filter(Boolean).join(' - '))}</div>
        </div>
      </div>
      <div style="text-align:center"><a class="btn btn-ghost" href="/shop">متابعة التسوق</a></div>
    </div>`, 'تم استلام طلبك');

    const wa = $('#waBtn');
    const setWa = () => { if (wa) wa.href = waLink(waTarget, buildWhatsAppMessage(o, receipt)); };
    setWa();
    wa?.addEventListener('click', () => {
      fetch(`/api/orders/${enc(o.id)}/whatsapp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t }), keepalive: true }).catch(() => {});
    });
    $('#copyNum')?.addEventListener('click', async (e) => {
      try { await navigator.clipboard.writeText(pay.number); } catch (_) {
        const ta = document.createElement('textarea'); ta.value = pay.number; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      e.currentTarget.innerHTML = `${icon('check', 'ico-sm')} تم النسخ`;
      toast('تم نسخ رقم التحويل');
    });
    const drop = $('#drop');
    const input = $('#rcpt');
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return toast('اختر صورة فقط', 'err');
      drop.classList.remove('ok');
      drop.innerHTML = `<span class="spin" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary)"></span><span>جاري رفع الإيصال...</span>`;
      drop.appendChild(input);
      try {
        const blob = await compressImage(file);
        const fd = new FormData();
        fd.append('file', blob, 'receipt.jpg');
        const r = await api(`/api/orders/${enc(o.id)}/receipt?t=${enc(t)}`, { body: fd });
        receipt = r.receipt;
        drop.classList.add('ok');
        drop.innerHTML = `<img src="${esc(receipt)}" alt="الإيصال"><span>${icon('check', 'ico-sm')} تم رفع الإيصال بنجاح — اضغط للتغيير</span>`;
        drop.appendChild(input);
        setWa();
        toast('تم رفع الإيصال، اضغط زر واتساب للتأكيد');
        wa?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        drop.innerHTML = `${icon('upload', 'ico-lg')}<span>${esc(err.message)} — حاول مرة أخرى</span>`;
        drop.appendChild(input);
        toast(err.message, 'err');
      }
      input.value = '';
    });
  }

  /* ---------- صفحة هبوط المنتج ---------- */
  async function viewLanding(slug, token) {
    document.body.classList.add('lp-mode');
    setView('<div class="sk" style="height:520px;border-radius:0"></div>');
    const { product: p } = await api(`/api/products/${enc(slug)}`);
    if (isStale(token)) return;
    document.body.classList.add('lp-mode');
    remember([p]);
    track('landing', { title: p.name, data: { id: p.id, name: p.name } });
    const L = p.landing || {};
    const imgs = p.images.length ? p.images : [PLACEHOLDER];
    const saved = store.get('customer_v1', {});
    const bullets = (L.bullets || []).filter(Boolean);
    setView(`
      <section class="lp-hero"><div class="container lp-hero-in">
        <div>
          ${p.category ? `<span class="kicker" style="color:var(--gold);font-weight:600">${esc(p.category.name)}${p.author ? ` • ${esc(p.author)}` : ''}</span>` : ''}
          <h1>${esc(L.headline || p.name)}</h1>
          <p class="sub">${esc(L.subheadline || p.description.slice(0, 220))}</p>
          <div class="lp-price"><b>${money(p.price)}</b>${p.oldPrice > p.price ? `<s>${money(p.oldPrice)}</s><span class="save">خصم ${p.discount}%</span>` : ''}</div>
          <div class="lp-cta"><a class="btn btn-gold btn-lg" href="#order" data-native>${esc(L.ctaText || 'اطلب الآن')} ${icon('arrowL')}</a>${state.settings.whatsapp ? `<a class="btn btn-light btn-lg" target="_blank" rel="noopener" href="${esc(waLink(state.settings.whatsapp, `استفسار عن: ${p.name}`))}">${waIcon()} استفسر</a>` : ''}</div>
          <div class="lp-badges"><span>${icon('truck', 'ico-sm')} شحن لكل المحافظات</span><span>${icon('shield', 'ico-sm')} نسخة أصلية</span><span>${icon('wallet', 'ico-sm')} دفع آمن</span></div>
        </div>
        <div class="lp-book"><img src="${esc(imgs[0])}" alt="${esc(p.name)}"></div>
      </div></section>
      ${bullets.length ? `<section class="section"><div class="container"><div class="sec-head"><div><h2>ليه تختار الكتاب ده؟</h2></div></div><div class="lp-bullets">${bullets.map((b, i) => `<div class="lp-bullet reveal" style="--d:${i}">${icon('check')}<span>${esc(b)}</span></div>`).join('')}</div></div></section>` : ''}
      <section class="section" id="order" style="scroll-margin-top:80px"><div class="container"><div class="lp-form-wrap">
        <div style="display:grid;gap:18px;min-width:0">
          ${p.description ? `<div class="desc reveal"><h2>عن الكتاب</h2><p>${esc(p.description)}</p></div>` : ''}
          ${imgs.length > 1 ? `<div class="lp-gallery reveal">${imgs.map((im) => `<img src="${esc(im)}" alt="" loading="lazy">`).join('')}</div>` : ''}
        </div>
        <form class="panel" id="lpForm" novalidate>
          <h2>${icon('bag')} اطلب الآن</h2>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px;border-radius:14px;background:var(--surface-2)">
            <img src="${esc(imgs[0])}" alt="" style="width:54px;aspect-ratio:2/3;object-fit:cover;border-radius:8px">
            <div style="flex:1;min-width:0"><b style="display:block;line-height:1.4">${esc(p.name)}</b><span style="color:var(--primary);font-weight:700">${money(p.price)}</span></div>
            <div class="qty"><button type="button" id="lpInc" aria-label="زيادة">${icon('plus', 'ico-sm')}</button><span id="lpQty">1</span><button type="button" id="lpDec" aria-label="تقليل">${icon('minus', 'ico-sm')}</button></div>
          </div>
          ${customerFields(saved)}
          <div id="lpSum" style="margin-top:16px"></div>
          <button class="btn btn-gold btn-lg btn-block" type="submit" id="lpSubmit" style="margin-top:14px" ${p.inStock ? '' : 'disabled'}>${p.inStock ? `${icon('lock')} تأكيد الطلب` : 'نفدت الكمية'}</button>
          <div class="secure">${icon('shield', 'ico-sm')} الدفع بعد تأكيد الطلب عبر ${esc(state.payMethod || 'المحفظة')}</div>
        </form>
      </div></div></section>
      <div class="lp-sticky" id="lpSticky"><div class="price" style="flex-direction:column;gap:0"><b>${money(p.price)}</b>${p.oldPrice > p.price ? `<s>${money(p.oldPrice)}</s>` : ''}</div><a class="btn btn-gold" href="#order" data-native>${esc(L.ctaText || 'اطلب الآن')}</a></div>
    `, L.headline || p.name);
    const form = $('#lpForm');
    bindFieldClear(form);
    let qty = 1;
    const max = p.stock ?? 99;
    const quote = async () => {
      $('#lpQty').textContent = qty;
      try {
        const q = await api('/api/quote', { body: { items: [{ id: p.id, qty }], zoneId: $('#f_zone').value } });
        $('#lpSum').innerHTML = summaryHTML(q, []).replace('<div class="sum-items"></div>', '');
      } catch (_) { /* ignore */ }
    };
    $('#lpInc').addEventListener('click', () => { qty = Math.min(qty + 1, max); quote(); });
    $('#lpDec').addEventListener('click', () => { qty = Math.max(qty - 1, 1); quote(); });
    $('#f_zone').addEventListener('change', quote);
    quote();
    $$('a[href="#order"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); $('#order').scrollIntoView({ behavior: 'smooth' }); }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const c = readCustomer(form);
      if (!validateCustomer(form, c)) return;
      const r = await submitOrder(form, $('#lpSubmit'), { customer: c, items: [{ id: p.id, qty }], source: 'landing' });
      if (r) navigate(`/thanks/${r.id}?t=${r.token}`, { replace: true });
    });
    const sticky = $('#lpSticky');
    if ('IntersectionObserver' in window) {
      const ob = new IntersectionObserver((ens) => {
        const heroVisible = ens.find((x) => x.target.classList.contains('lp-hero'));
        const formVisible = ens.find((x) => x.target.id === 'order');
        if (heroVisible) sticky.dataset.hero = heroVisible.isIntersecting ? '1' : '';
        if (formVisible) sticky.dataset.form = formVisible.isIntersecting ? '1' : '';
        const show = !sticky.dataset.hero && !sticky.dataset.form;
        sticky.classList.toggle('show', show);
        document.body.classList.toggle('has-sticky', show && matchMedia('(max-width: 860px)').matches);
      }, { threshold: 0.05 });
      ob.observe($('.lp-hero'));
      ob.observe($('#order'));
      onLeave(() => ob.disconnect());
    }
  }

  /* ---------- صفحات المعلومات ---------- */
  async function viewPage(name) {
    const s = state.settings;
    const c = s.contact || {};
    const pages = {
      about: ['من نحن', `<div class="prose reveal">${esc(s.about || '')}</div>`],
      shipping: ['الشحن والتوصيل', `<div class="panel reveal"><p style="margin-bottom:14px;color:var(--ink-2)">نشحن لكل محافظات مصر. ${s.shipping.freeOver ? `<b>الشحن مجاني</b> للطلبات فوق ${money(s.shipping.freeOver)}.` : ''}</p>
        <div style="overflow-x:auto"><table class="ship-table"><thead><tr><th>المحافظة</th><th>سعر الشحن</th><th>مدة التوصيل</th></tr></thead><tbody>${s.shipping.zones.map((z) => `<tr><td>${esc(z.name)}</td><td><b>${money(z.price)}</b></td><td>${z.days ? `${esc(z.days)} أيام` : '—'}</td></tr>`).join('')}</tbody></table></div></div>`],
      contact: ['تواصل معنا', `<div class="contact-grid">
        ${s.whatsapp ? `<a class="contact-card reveal" target="_blank" rel="noopener" href="${esc(waLink(s.whatsapp))}"><span class="fi" style="background:#e3f8eb;color:#1faa53">${icon('chat')}</span><b>واتساب</b><span dir="ltr">${esc(s.whatsapp)}</span></a>` : ''}
        ${c.phone ? `<a class="contact-card reveal" href="tel:${esc(cleanPhone(c.phone))}" style="--d:1"><span class="fi">${icon('phone')}</span><b>اتصل بنا</b><span dir="ltr">${esc(c.phone)}</span></a>` : ''}
        ${c.email ? `<a class="contact-card reveal" href="mailto:${esc(c.email)}" style="--d:2"><span class="fi">${icon('mail')}</span><b>البريد الإلكتروني</b><span>${esc(c.email)}</span></a>` : ''}
        ${c.address ? `<div class="contact-card reveal" style="--d:3"><span class="fi">${icon('pin')}</span><b>العنوان</b><span>${esc(c.address)}</span></div>` : ''}
        ${c.hours ? `<div class="contact-card reveal" style="--d:4"><span class="fi">${icon('clock')}</span><b>مواعيد العمل</b><span>${esc(c.hours)}</span></div>` : ''}
      </div>`],
    };
    const pg = pages[name];
    if (!pg) return viewNotFound();
    setView(`<div class="container page-hero"><nav class="crumbs"><a href="/">الرئيسية</a>${icon('chevL')}<span>${pg[0]}</span></nav><h1 class="page-title" style="margin-bottom:22px">${pg[0]}</h1>${pg[1]}</div>`, pg[0]);
  }

  function viewNotFound() {
    setView(`<div class="container"><div class="empty" style="padding-block:90px"><span style="font-family:var(--font-display);font-size:90px;line-height:1;color:var(--gold)">404</span><h3>الصفحة غير موجودة</h3><p>يبدو أن الصفحة التي تبحث عنها غير متاحة</p><a class="btn btn-lg" href="/">العودة للرئيسية</a></div></div>`, 'غير موجود');
  }

  /* ---------------- التشغيل ---------------- */
  async function boot() {
    renderCartUI();
    let b;
    try {
      b = await api('/api/bootstrap');
      state.settings = b.settings;
      state.categories = b.categories;
    } catch (_) {
      view.innerHTML = `<div class="container"><div class="empty">${icon('info')}<h3>تعذر الاتصال بالمتجر</h3><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div></div>`;
      return;
    }
    state.payMethod = b.settings.paymentMethod || '';
    renderChrome();
    route(history.state?.y || 0);
  }
  boot();
})();
