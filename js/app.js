/* ==========================================================================
   App logic + animation engine (no external libraries).
   You normally edit js/config.js, not this file.

   How the animation works (short version)
   ---------------------------------------
   Every piece has a pose for the "hero ring" and a pose for the "product page".
   Two numbers drive everything:
     S.pos  → which piece is in front (float, so it can be mid-rotation)
     S.m    → 0 = hero ring … 1 = product page
   Every frame each piece is placed at   lerp(heroPose(pos), detailPose(pos), m)
   so rotating, entering a product, switching products and going back are all the
   same maths with different tweens — that is why it always stays smooth.
   ========================================================================== */
(function () {
  'use strict';

  const C = window.SITE;
  if (!C || !C.products || !C.products.length) { console.error('js/config.js is missing or has no products'); return; }

  /* ------------------------------------------------------------ helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mk = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const nowMs = () => performance.now();
  // brand wordmark: name + (optional) red full-stop + (optional) small mark
  const brandHtml = () => esc(C.brand.name) + (C.brand.dot ? '<i class="bdot">.</i>' : '') + (C.brand.mark ? `<sup>${esc(C.brand.mark)}</sup>` : '');

  const RTL = C.dir === 'rtl';
  const DIR = RTL ? -1 : 1;
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = Object.assign({ autoplay: true, autoplayDelay: 3400, float: 1, parallax: 1, speed: 1 }, C.motion || {});
  const T = Object.assign({}, C.texts || {});
  const HERO = Object.assign({ ghost: '', label: '', sublabel: '', top: ['', ''], captionLeft: [], captionRight: [], sideText: '' }, C.hero || {});
  const CUR = Object.assign({ symbol: '', position: 'before', locale: undefined }, C.currency || {});
  const EASE_OUT = 'cubic-bezier(.22,.7,.2,1)';
  const EASE_IN = 'cubic-bezier(.6,0,.8,.3)';

  const fmtNum = (n, digits = 1) => { try { return new Intl.NumberFormat(CUR.locale, { minimumIntegerDigits: digits, useGrouping: false }).format(n); } catch (e) { return String(n).padStart(digits, '0'); } };
  const money = (n) => { let s; try { s = Number(n).toLocaleString(CUR.locale); } catch (e) { s = String(n); } return CUR.position === 'after' ? `${s} ${CUR.symbol}` : `${CUR.symbol} ${s}`.trim(); };

  document.documentElement.lang = C.lang || 'en';
  document.documentElement.dir = C.dir || 'ltr';
  document.title = C.pageTitle || (C.brand && C.brand.name) || 'Collection';
  if (C.theme) {
    const r = document.documentElement.style;
    Object.keys(C.theme).forEach((k) => r.setProperty('--' + k, C.theme[k]));
    const mt = $('meta[name=theme-color]');
    if (mt && C.theme.bg) mt.content = C.theme.bg;
  }

  /* ------------------------------------------------------------ products */
  const P = C.products.map((p) => {
    const q = Object.assign({}, p);
    q.colors = (p.colors && p.colors.length ? p.colors : [{ name: '', hex: '#999999', image: p.image }]).map((c) => Object.assign({}, c));
    q.sizes = p.sizes || [];
    q.k = p.scale || 1;
    return q;
  });
  const N = P.length;
  const baseSrcOf = (p) => p.image || (p.colors[0] && p.colors[0].image) || '';

  /* ------------------------------------------------------------ tween engine */
  const EASE = {
    linear: (t) => t,
    out3: (t) => 1 - Math.pow(1 - t, 3),
    out4: (t) => 1 - Math.pow(1 - t, 4),
    io3: (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    io4: (t) => (t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    io5: (t) => (t < .5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2)
  };
  const tweens = [];
  function tw(obj, props, o) {
    o = o || {};
    const k = (M.speed || 1) * (REDUCED ? 2.5 : 1);
    return new Promise((res) => {
      for (const t of tweens) if (t.obj === obj) for (const key in props) delete t.to[key];
      tweens.push({ obj, to: Object.assign({}, props), from: null, dur: (o.duration == null ? 1 : o.duration) * 1000 / k, delay: (o.delay || 0) * 1000 / k, t0: nowMs(), ease: EASE[o.ease || 'io3'], res });
    });
  }
  function stepTweens(now) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i];
      const keys = Object.keys(t.to);
      if (!keys.length) { tweens.splice(i, 1); t.res(); continue; }
      const el = now - t.t0 - t.delay;
      if (el < 0) continue;
      if (!t.from) { t.from = {}; keys.forEach((k) => { t.from[k] = t.obj[k]; }); }
      const p = t.dur <= 0 ? 1 : Math.min(1, el / t.dur);
      const e = t.ease(p);
      keys.forEach((k) => { t.obj[k] = t.from[k] === undefined ? t.to[k] : t.from[k] + (t.to[k] - t.from[k]) * e; });
      if (p >= 1) { tweens.splice(i, 1); t.res(); }
    }
  }

  /* ------------------------------------------------------------ state */
  const S = {
    pos: 0, m: 0, mode: 'hero', cur: 0, busy: false,
    sway: 0, lastPos: 0, color: {}, size: {}, dot: -1, rot: {}, peeked: {},
    lastInteract: nowMs(), lastAuto: nowMs(), overlay: false, ready: false
  };
  const Pt = { x: 0, y: 0, tx: 0, ty: 0 };
  const L = {};   // layout metrics

  const els = {
    app: $('#app'), items: $('#items'), shadows: $('#shadows'), ghost: $('#ghost'), bg: $('#bg'),
    dots: $('#dots'), count: $('#count'), label: $('#label'), sublabel: $('#sublabel'),
    hdrBtn: $('#hdrBtn'), hdrLbl: $('#hdrLbl'), brand: $('#brand'), back: $('#backBtn'),
    topA: $('#topA'), topB: $('#topB'), capL: $('#capL'), capR: $('#capR'), sideV: $('#sideV'),
    hint: $('#hintTxt'), hintBtn: $('#hint'), cartBtns: $$('.cart-pill'), cartNs: $$('.cart-n'), cartLbls: $$('.cart-lbl'),
    info: $('#info'), eyebrow: $('#iEyebrow'), cat: $('#iCat'), name: $('#iName'), desc: $('#iDesc'),
    colorsRow: $('#iColors'), swatches: $('#swatches'), colorName: $('#colorName'), sizesRow: $('#iSizes'), viewRow: $('#iView'),
    buyRow: $('#iBuy'), price: $('#iPrice'), add: $('#addBtn'), perks: $('#iPerks')
  };
  els.count.classList.add('rv');

  /* ------------------------------------------------------------ text helpers */
  function swap(el, html, dir, delay) {
    dir = dir || 1; delay = delay || 0;
    const old = el.querySelector('.rvi:not(.out)');
    if (old) {
      old.classList.add('out');
      const a = old.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${-110 * dir}%)`, opacity: 0 }], { duration: 520, delay, easing: EASE_IN, fill: 'forwards' });
      a.finished.then(() => old.remove()).catch(() => old.remove());
    }
    if (html == null || html === '') return;
    const nw = mk('span', 'rvi');
    nw.innerHTML = html;
    el.appendChild(nw);
    nw.animate([{ transform: `translateY(${110 * dir}%)`, opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 900, delay: delay + 140, easing: EASE_OUT, fill: 'backwards' });
  }
  const ARABIC = /[؀-ۿ]/;
  function setGhost(text, dir, delay) {
    dir = dir || 1; delay = delay || 0;
    const host = els.ghost;
    const old = host.querySelector('.gh-in:not(.out)');
    if (old) {
      old.classList.add('out');
      $$('.gh-ch', old).forEach((s, k) => s.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-108 * dir}%)` }], { duration: 650, delay: delay + k * 14, easing: EASE_IN, fill: 'forwards' }));
      setTimeout(() => old.remove(), 1400 + delay);
    }
    const wrap = mk('div', 'gh-in');
    String(text || '').split('\n').forEach((ln, li) => {
      const row = mk('div', 'gh-row');
      wrap.appendChild(row);
      (ARABIC.test(ln) ? [ln] : Array.from(ln)).forEach((ch, ci) => {
        const s = mk('span', 'gh-ch');
        s.textContent = ch === ' ' ? ' ' : ch;
        row.appendChild(s);
        s.animate([{ transform: `translateY(${108 * dir}%)` }, { transform: 'translateY(0)' }], { duration: 1200, delay: delay + 160 + li * 90 + ci * 38, easing: EASE_OUT, fill: 'backwards' });
      });
    });
    host.appendChild(wrap);
  }
  function showRow(el, delay) {
    el.classList.remove('show');
    el.style.transitionDelay = (delay || 0) + 'ms';
    void el.offsetWidth;
    el.classList.add('show');
  }
  function hideRow(el) { el.style.transitionDelay = '0ms'; el.classList.remove('show'); }

  /* ------------------------------------------------------------ layout */
  function layout() {
    const W = els.app.clientWidth, H = els.app.clientHeight;
    L.W = W; L.H = H;
    const sp = $('#spacer'); if (sp) sp.style.height = H + 'px';
    L.mobile = W < 820 || W / H < 0.8;
    if (L.mobile) {
      L.itemH = Math.min(H * 0.42, W * 0.95);
      L.heroScale = 0.64;
      L.ringR = W * 0.285 / Math.sin(stepAngle);
      L.heroY = -H * 0.03;
      L.fx = 0; L.fy = -H * 0.115;
      L.ghostX = W * 0.62;
    } else {
      L.itemH = Math.min(H * 0.68, W * 0.40);
      L.heroScale = 0.72;
      L.ringR = W * 0.215 / Math.sin(stepAngle);
      L.heroY = -H * 0.02;
      L.fx = -W * 0.175 * DIR; L.fy = 0;
      L.ghostX = W * 0.40;
    }
    if (fx.ready) fxLayout();
    L.groundHero = L.heroY + L.itemH * L.heroScale * 0.5 + H * 0.075;
    items.forEach((it) => {
      it.el.style.height = L.itemH + 'px';
      it.el.style.width = L.itemH * it.ar + 'px';
      it.el.style.setProperty('--ar', it.ar);
      it.sh.style.width = L.itemH * 0.62 + 'px';
      it.sh.style.marginLeft = -L.itemH * 0.31 + 'px';
    });
  }

  /* ------------------------------------------------------------ poses */
  const wrapN = (d) => ((d + N / 2) % N + N) % N - N / 2;
  const stepAngle = Math.PI * 2 / Math.max(N, 4);

  function heroPose(d) {
    const th = d * stepAngle;
    const s = Math.sin(th), c = Math.cos(th);
    const depth = (c + 1) / 2;
    let op = 1;
    if (N < 4) op = 1 - smooth(clamp((Math.abs(d) - (N / 2 - 0.5)) / 0.5, 0, 1));
    return {
      x: s * L.ringR,
      y: L.heroY + (1 - depth) * L.H * 0.085,
      scale: L.heroScale * lerp(0.64, 1, depth),
      rot: s * 7,
      blur: Math.max(0, 0.55 - depth) * 5.5,
      bright: lerp(0.74, 1, Math.min(1, depth * 1.7)),
      op,
      depth,
      z: Math.round(depth * 100),
      sh: Math.pow(clamp((depth - 0.3) / 0.7, 0, 1), 1.6) * 0.95 * op
    };
  }
  function detailPose(d) {
    const a = Math.abs(d), sg = d < 0 ? -1 : 1;
    const k = smooth(clamp(a, 0, 1));
    const far = clamp(a - 1, 0, 4);
    const gx = sg * DIR * (L.ghostX + far * L.W * 0.05);
    const op = lerp(1, 0.5, k) * clamp(1 - (a - 3) / 1.2, 0, 1);
    return {
      x: lerp(L.fx, gx, k),
      y: lerp(L.fy, L.fy - L.H * 0.02, k),
      scale: lerp(1, 0.52 - far * 0.04, k),
      rot: sg * k * 9 * DIR,
      blur: k * 9 + far * 2,
      bright: 1,
      op,
      depth: 1 / (1 + k * 2),
      z: 100 - Math.round(a * 10),
      sh: (1 - k) * 0.55
    };
  }

  /* ------------------------------------------------------------ items */
  const items = [];
  const imgDims = {};

  function makeLayer(p, ci) {
    const col = p.colors[ci] || p.colors[0];
    const lyr = mk('div', 'lyr');
    const src = col.image || baseSrcOf(p);
    const im = new Image();
    im.alt = ''; im.draggable = false; im.decoding = 'async'; im.src = src;
    if (col.back) {
      // front + back faces on a 3D flipper (starts at the current rotation so colour swaps keep the side)
      const fl = mk('div', 'flip');
      im.className = 'ff';
      const bk = new Image();
      bk.alt = ''; bk.draggable = false; bk.decoding = 'async'; bk.src = col.back; bk.className = 'fb';
      fl.style.transform = flipT(S.rot[P.indexOf(p)] || 0, 1);
      fl.appendChild(im); fl.appendChild(bk);
      lyr.appendChild(fl);
    } else lyr.appendChild(im);
    if (!col.image && ci > 0 && col.hex) {
      const t = mk('div', 'tint');
      t.style.background = col.hex;
      t.style.webkitMaskImage = t.style.maskImage = `url("${src}")`;
      lyr.appendChild(t);
    }
    return lyr;
  }
  function setColor(i, ci, animate) {
    const it = items[i];
    if (S.color[i] === ci && it.inner.children.length) return;
    S.color[i] = ci;
    const lyr = makeLayer(P[i], ci);
    const olds = Array.from(it.inner.children);
    it.inner.appendChild(lyr);
    if (animate && olds.length && !REDUCED) {
      const a = lyr.animate([{ opacity: 0, transform: 'scale(1.04)', filter: 'blur(9px)' }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }], { duration: 800, easing: EASE_OUT });
      a.finished.then(() => olds.forEach((o) => o.remove())).catch(() => olds.forEach((o) => o.remove()));
    } else olds.forEach((o) => o.remove());
  }
  /* ------------------------------------------------------------ front / back flip */
  function flipT(a, s) { return `perspective(1600px) rotateY(${a}deg) scale(${s})`; }
  const faceOf = (i) => Math.round((S.rot[i] || 0) / 180) % 2;      // 0 = front, 1 = back
  const hasBack = (i) => { const c = P[i].colors[S.color[i]]; return !!(c && c.back); };
  function flipTo(i, face, instant) {
    if (!hasBack(i)) return;
    const cur = faceOf(i);
    if (face == null) face = cur ? 0 : 1;
    if (face === cur) { syncView(i); return; }
    const from = S.rot[i] || 0, to = from + 180;
    S.rot[i] = to;
    $$('.flip', items[i].inner).forEach((fl) => {
      fl.getAnimations().forEach((a) => a.cancel());
      fl.style.transform = flipT(to, 1);
      if (!instant && !REDUCED) {
        fl.animate([
          { transform: flipT(from, 1) },
          { transform: flipT((from + to) / 2, 0.9), offset: 0.5 },
          { transform: flipT(to, 1) }
        ], { duration: 950, easing: 'cubic-bezier(.62,0,.2,1)' });
      }
    });
    syncView(i);
  }
  function resetFace(i, instant) { if (items[i] && faceOf(i)) flipTo(i, 0, instant); }
  function syncView(i) {
    if (i !== S.cur) return;
    const f = faceOf(i);
    $$('.vw', els.viewRow).forEach((b) => { const on = +b.dataset.f === f; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  }
  function buildView(i) {
    const row = els.viewRow;
    row.innerHTML = '';
    if (!hasBack(i)) { row.style.display = 'none'; return; }
    row.style.display = '';
    row.setAttribute('aria-label', T.view360 || 'View');
    [T.viewFront || 'Front', T.viewBack || 'Back'].forEach((lbl, f) => {
      const b = mk('button', 'vw'); b.type = 'button'; b.textContent = lbl; b.dataset.f = f;
      b.addEventListener('click', (e) => { S.lastInteract = nowMs(); S.peeked[i] = true; S.userFlip = (S.userFlip || 0) + 1; flipTo(i, f); if (e.detail) b.blur(); });
      row.appendChild(b);
    });
    syncView(i);
  }
  // one gentle "turn around" the first time a piece with a back is opened, so people notice there is one
  function peek(i) {
    if (REDUCED || S.peeked[i] || !hasBack(i)) return;
    const ok = () => S.mode === 'detail' && S.cur === i && !S.overlay;
    setTimeout(() => {
      if (!ok() || S.peeked[i] || faceOf(i)) return;
      S.peeked[i] = true;
      const u = S.userFlip || 0;
      flipTo(i, 1);
      setTimeout(() => { if (ok() && (S.userFlip || 0) === u && faceOf(i) === 1) flipTo(i, 0); }, 2600);
    }, 1700);
  }

  function buildItems() {
    P.forEach((p, i) => {
      const el = mk('div', 'item' + (p.photo ? ' is-photo' : ''));
      el.dataset.i = i;
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', p.name || '');
      const inner = mk('div', 'inner');
      el.appendChild(inner);
      els.items.appendChild(el);
      const sh = mk('div', 'shadow');
      els.shadows.appendChild(sh);
      const src = baseSrcOf(p);
      const d = imgDims[src];
      items.push({ el, inner, sh, i, ar: d && d.h ? d.w / d.h : 1, intro: 0, phase: i * 1.73 + 0.4, k: p.k, kd: Math.min(1, p.k * 1.5) });
      S.color[i] = -1;
      S.size[i] = p.sizes[Math.min(1, p.sizes.length - 1)] || '';
      setColor(i, 0, false);
    });
  }

  /* ------------------------------------------------------------ render loop */
  let lastT = nowMs();
  function render(now) {
    const dt = Math.max(1, now - lastT); lastT = now;
    const m = S.m;
    Pt.x += (Pt.tx - Pt.x) * 0.07;
    Pt.y += (Pt.ty - Pt.y) * 0.07;
    const v = (S.pos - S.lastPos) / dt * 1000;
    S.lastPos = S.pos;
    S.sway += (v - S.sway) * 0.1;
    const sway = clamp(S.sway, -3, 3);
    const par = M.parallax;
    const flt = REDUCED ? 0 : M.float;

    for (let i = 0; i < N; i++) {
      const it = items[i];
      const dl = i - S.pos;
      const h = heroPose(wrapN(dl));
      const dd = detailPose(dl);
      const bob = Math.sin(now * 0.0012 + it.phase) * 6.5 * flt * (1 - 0.5 * m);
      const tilt = Math.sin(now * 0.0009 + it.phase * 1.3) * 0.9 * flt;
      const dep = lerp(0.35 + 0.65 * h.depth, 0.2 + 0.8 * dd.depth, m);
      const intro = it.intro;
      const x = lerp(h.x, dd.x, m) + Pt.x * 22 * par * dep;
      const y = lerp(h.y, dd.y, m) + bob + Pt.y * 12 * par * dep + (1 - intro) * L.H * 0.1;
      const kk = lerp(it.k, it.kd, m);
      const sc = lerp(h.scale, dd.scale, m) * kk * (0.94 + 0.06 * intro);
      const rot = lerp(h.rot, dd.rot, m) + tilt - sway * 2.4 * (1 - m) + Pt.x * 1.2 * par * (1 - m);
      const blur = lerp(h.blur, dd.blur, m) + (1 - intro) * 10;
      const bright = lerp(h.bright, dd.bright, m);
      const op = lerp(h.op, dd.op, m) * intro;
      const z = m < 0.5 ? h.z : dd.z;

      const st = it.el.style;
      st.transform = `translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})`;
      st.opacity = op.toFixed(3);
      st.zIndex = z;
      st.filter = blur > 0.05 || bright < 0.995 ? `blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(3)})` : 'none';
      st.pointerEvents = op < 0.2 ? 'none' : 'auto';

      // ground shadow (does not rotate with the garment)
      const gHero = L.heroY + L.itemH * L.heroScale * 0.5 * it.k + L.H * 0.075;
      const gDetail = dd.y + L.itemH * dd.scale * it.kd * 0.5 + L.H * 0.05;
      const gy = lerp(gHero, gDetail, m);
      const shOp = lerp(h.sh, dd.sh, m) * intro * 0.9;
      const shScale = lerp(h.scale / L.heroScale * it.k, dd.scale * it.kd, m) * (1 - bob * 0.012) * 0.9;
      const ss = it.sh.style;
      ss.opacity = shOp.toFixed(3);
      ss.transform = `translate3d(${(x * 0.92).toFixed(2)}px,${gy.toFixed(2)}px,0) scale(${shScale.toFixed(4)},${(shScale * (1 + m * 0.2)).toFixed(4)})`;
    }

    // ghost word parallax
    const gx = lerp(0, L.mobile ? 0 : DIR * L.W * 0.075, m);
    els.ghost.style.transform = `translate3d(${(gx - Pt.x * 26 * par).toFixed(2)}px,${(-Pt.y * 14 * par).toFixed(2)}px,0)`;

    fxFrame(now, dt);

    // active dot
    const di = S.mode === 'hero' && m < 0.5 ? ((Math.round(S.pos) % N) + N) % N : S.cur;
    if (di !== S.dot) { S.dot = di; $$('.dot', els.dots).forEach((d, k) => d.classList.toggle('on', k === di)); }
  }

  const loader = { v: 0 };
  function frame(now) {
    stepTweens(now);
    if (!S.ready) {
      $('#ldNum').textContent = Math.round(loader.v);
      $('#ldBar').style.transform = `scaleX(${loader.v / 100})`;
    }
    if (items.length && L.W && !S.hidden) render(now);
    siteFrame(now, Math.min(100, Math.max(1, now - (frame.t || now)))); frame.t = now;
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ chrome / info */
  function setCount(n, dir, delay) { swap(els.count, fmtNum(n, 2), dir, delay); }
  function setFooter(mode, dir, delay) {
    if (mode === 'hero') {
      setCount(1, dir, delay);
      swap(els.label, esc(HERO.label), dir, delay);
      swap(els.sublabel, esc(HERO.sublabel), dir, (delay || 0) + 60);
      swap(els.hdrLbl, esc(T.index), dir, delay);
    } else {
      const p = P[S.cur];
      setCount(S.cur + 2, dir, delay);
      swap(els.label, esc(p.name), dir, delay);
      swap(els.sublabel, esc(p.category), dir, (delay || 0) + 60);
      swap(els.hdrLbl, esc(T.next), dir, delay);
    }
  }
  function buildSwatches(i, delay) {
    const p = P[i];
    els.swatches.innerHTML = '';
    p.colors.forEach((c, ci) => {
      const b = mk('button', 'sw' + (ci === S.color[i] ? ' on' : ''));
      b.type = 'button';
      b.style.setProperty('--c', c.hex || '#999');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', c.name || '');
      b.setAttribute('aria-checked', ci === S.color[i] ? 'true' : 'false');
      b.innerHTML = '<i></i>';
      b.addEventListener('click', () => { S.lastInteract = nowMs(); pickColor(i, ci); });
      b.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 800, delay: delay + ci * 70, easing: EASE_OUT, fill: 'backwards' });
      els.swatches.appendChild(b);
    });
    swap(els.colorName, esc((p.colors[S.color[i]] || {}).name || ''), 1, delay);
  }
  function buildSizes(i) {
    const p = P[i];
    els.sizesRow.innerHTML = '';
    p.sizes.forEach((s) => {
      const b = mk('button', 'sz mono' + (S.size[i] === s ? ' on' : ''));
      b.type = 'button'; b.textContent = s;
      b.addEventListener('click', () => { S.size[i] = s; $$('.sz', els.sizesRow).forEach((x) => x.classList.toggle('on', x === b)); });
      els.sizesRow.appendChild(b);
    });
    if (p.sizes.length && p.sizeChart && (C.sizeCharts || {})[p.sizeChart]) {
      const g = mk('button', 'sz-guide mono'); g.type = 'button'; g.textContent = T.sizeGuide;
      g.addEventListener('click', () => openSheet('size', p.sizeChart));
      els.sizesRow.appendChild(g);
    }
    els.sizesRow.style.display = p.sizes.length ? '' : 'none';
  }
  function priceHtml(p) {
    if (p.oldPrice && p.oldPrice > p.price) {
      const pct = Math.round((1 - p.price / p.oldPrice) * 100);
      return `<s class="old">${money(p.oldPrice)}</s>${money(p.price)}<span class="save">−${fmtNum(pct, 1)}%</span>`;
    }
    return money(p.price);
  }
  function buildPerks() {
    const rows = [];
    if (SHIP.freeOver > 0) rows.push(['ship', tx('perkShip', { n: money(SHIP.freeOver), fee: feeTxt() })]);
    else if (ZONES.length === 1 && SHIP.fee != null) rows.push(['ship', tx('perkShipZones', { a: money(ZONES[0].fee), cities: ZONES[0].cities.map(govName).join(T.shipAnd || ' & '), b: money(SHIP.fee) })]);
    if (RET) rows.push(['return', tx('perkReturn', { d: fmtNum(RET, 1) })]);
    if (SALE.enabled) rows.push(['ship', tx('perkSale')]);
    els.perks.innerHTML = rows.map((r) => `<button type="button" class="pk" data-tab="${r[0]}">${esc(r[1])}</button>`).join('');
    $$('button', els.perks).forEach((b) => b.addEventListener('click', () => openSheet(b.dataset.tab)));
  }
  function pickColor(i, ci) {
    setColor(i, ci, true);
    if (S.mode === 'detail' && S.cur === i) { buildView(i); if (!hasBack(i)) S.rot[i] = 0; }
    $$('.sw', els.swatches).forEach((b, k) => { b.classList.toggle('on', k === ci); b.setAttribute('aria-checked', k === ci ? 'true' : 'false'); });
    swap(els.colorName, esc(P[i].colors[ci].name || ''), 1, 0);
    if (S.mode === 'detail' && S.cur === i) setBg(i);
  }
  function fillInfo(i, dir, d0) {
    d0 = d0 || 0;
    const p = P[i];
    swap(els.eyebrow, esc(p.eyebrow || ''), dir, d0);
    swap(els.cat, esc(p.category || '') + ' — ' + fmtNum(i + 1, 2) + '/' + fmtNum(N, 2), dir, d0 + 60);
    swap(els.name, esc(p.name), dir, d0 + 120);
    swap(els.desc, esc(p.description || ''), dir, d0 + 200);
    hideRow(els.colorsRow); hideRow(els.viewRow); hideRow(els.sizesRow); hideRow(els.buyRow);
    buildSwatches(i, d0 + 300);
    buildView(i);
    buildSizes(i);
    els.price.innerHTML = priceHtml(p);
    buildPerks();
    els.add.querySelector('.add-lbl').textContent = T.addToCart || 'Add to cart';
    els.add.classList.remove('done');
    showRow(els.colorsRow, d0 + 300);
    showRow(els.viewRow, d0 + 340);
    showRow(els.sizesRow, d0 + 380);
    showRow(els.buyRow, d0 + 460);
    hideRow(els.perks); showRow(els.perks, d0 + 540);
  }
  function hideInfo(dir) {
    [els.eyebrow, els.cat, els.name, els.desc, els.colorName].forEach((e, k) => swap(e, '', dir, k * 40));
    hideRow(els.colorsRow); hideRow(els.viewRow); hideRow(els.sizesRow); hideRow(els.buyRow); hideRow(els.perks);
  }
  function setBg(i) {
    const p = i == null ? null : P[i];
    els.bg.style.backgroundColor = (p && p.bg) || '';
    let acc = (p && (p.accent || (p.colors[S.color[i]] || {}).hex)) || (C.theme && C.theme.accent);
    if (p && p.colorAccent) {
      const hx = ((p.colors[S.color[i]] || {}).hex || '').replace('#', '');
      if (hx.length === 6) { const n = parseInt(hx, 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; if (lum > 0.16 && lum < 0.9) acc = '#' + hx; }
    }
    if (acc) document.documentElement.style.setProperty('--accent', acc);
  }

  /* ------------------------------------------------------------ navigation */
  function setMode(mode) {
    S.mode = mode;
    document.body.classList.toggle('mode-detail', mode === 'detail');
    document.body.classList.toggle('mode-hero', mode === 'hero');
  }
  const frontIndex = () => ((Math.round(S.pos) % N) + N) % N;

  async function enterDetail(i) {
    if (S.busy) return;
    S.busy = true; S.lastInteract = nowMs();
    const delta = wrapN(i - S.pos);
    if (Math.abs(delta) > 0.002) {
      await tw(S, { pos: S.pos + delta }, { duration: 0.55 + 0.3 * Math.abs(delta), ease: 'io3' });
    }
    S.pos = i; S.lastPos = i;
    S.cur = i;
    setMode('detail');
    setBg(i);
    setFooter('detail', 1, 0);
    setGhost(P[i].ghost || P[i].name, 1, 250);
    fillInfo(i, 1, 520);
    await tw(S, { m: 1 }, { duration: 1.55, ease: 'io4' });
    S.busy = false;
    peek(i);
  }
  async function leaveDetail() {
    if (S.busy) return;
    S.busy = true; S.lastInteract = nowMs();
    resetFace(S.cur);
    hideInfo(-1);
    setBg(null);
    setMode('hero');
    setFooter('hero', -1, 0);
    setGhost(HERO.ghost, -1, 200);
    await tw(S, { m: 0 }, { duration: 1.4, ease: 'io4' });
    S.busy = false;
    S.lastInteract = nowMs();
  }
  async function goProduct(j, dir) {
    if (S.busy || j === S.cur || j < 0 || j >= N) return;
    S.busy = true; S.lastInteract = nowMs();
    dir = dir || (j > S.cur ? 1 : -1);
    const dist = Math.abs(j - S.cur);
    resetFace(S.cur, true);
    S.cur = j;
    setBg(j);
    setFooter('detail', dir, 0);
    setGhost(P[j].ghost || P[j].name, dir, 120);
    fillInfo(j, dir, 220);
    await tw(S, { pos: j }, { duration: 1.1 + 0.15 * (dist - 1), ease: 'io4' });
    S.busy = false;
    peek(j);
  }
  async function spinTo(i) {
    S.lastInteract = nowMs();
    const delta = wrapN(i - S.pos);
    if (Math.abs(delta) < 0.002) return;
    await tw(S, { pos: S.pos + delta }, { duration: 0.8 + 0.3 * Math.abs(delta), ease: 'io3' });
  }
  function spinBy(n) { return tw(S, { pos: Math.round(S.pos) + n }, { duration: 1.5, ease: 'io3' }); }

  function step(dir, horizontal) {
    if (S.overlay) return;
    if (S.mode === 'hero') {
      if (horizontal) { S.lastInteract = nowMs(); spinBy(dir > 0 ? 1 : -1); }
      else if (dir > 0) enterDetail(frontIndex());
      return;
    }
    if (dir > 0) { if (S.cur < N - 1) goProduct(S.cur + 1, 1); else bumpEnd(); }
    else if (S.cur > 0) goProduct(S.cur - 1, -1);
    else leaveDetail();
  }
  function bumpEnd() {
    // gentle "nothing more" nudge on the last product
    if (S.busy) return;
    S.busy = true;
    tw(S, { pos: S.cur + 0.12 }, { duration: 0.3, ease: 'io3' }).then(() => tw(S, { pos: S.cur }, { duration: 0.6, ease: 'io3' })).then(() => { S.busy = false; });
  }
  function jumpTo(i) {
    if (S.mode === 'hero') { enterDetail(i); } else goProduct(i);
  }

  /* ------------------------------------------------------------ input */
  const isUI = (t) => t && t.closest && t.closest('button, a, input, .info, #cart, #index, .cart-pill');
  let wheelAcc = 0, wheelLock = false, wheelTimer = 0;
  // vertical wheel = normal page scroll (hero → shop). Sideways wheel / trackpad swipe browses the pieces.
  window.addEventListener('wheel', (e) => {
    if (S.overlay || window.scrollY > 10) return;
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2;
    if (!horizontal) return;
    e.preventDefault();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelLock = false; wheelAcc = 0; }, 130);
    if (wheelLock || S.busy || !S.ready) return;
    if (Math.abs(e.deltaX) < 4) return;
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) < 28) return;
    wheelLock = true;
    const dir = wheelAcc > 0 ? 1 : -1;
    wheelAcc = 0;
    step(dir, S.mode === 'hero');
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea') && e.key !== 'Escape') return;
    if (e.key === 'Escape') {
      if (sheetOpen) return closeSheet();
      if (cartOpen) return closeCart();
      if (indexOpen) return closeIndex();
      if (S.mode === 'detail') leaveDetail();
      return;
    }
    if (S.overlay || !S.ready || window.scrollY > 40 || e.target.closest && e.target.closest('input,textarea,button,a')) return;
    const k = e.key;
    if (k === 'ArrowDown' || k === 'Enter') { e.preventDefault(); step(1, false); }
    else if (k === 'ArrowUp') { e.preventDefault(); step(-1, false); }
    else if (k === 'ArrowRight' || k === 'ArrowLeft') {
      const fwd = (k === 'ArrowRight') !== RTL;
      if (S.mode === 'hero') step(fwd ? 1 : -1, true);
      else if (fwd) { if (S.cur < N - 1) goProduct(S.cur + 1, 1); } else if (S.cur > 0) goProduct(S.cur - 1, -1);
    }
  });

  let drag = null;
  const stepPx = () => L.ringR * 0.95 * 0.99;
  els.app.addEventListener('pointerdown', (e) => {
    if (S.overlay || !S.ready || isUI(e.target) || e.button > 0) return;
    drag = { x: e.clientX, y: e.clientY, pos0: S.pos, t: nowMs(), lx: e.clientX, lt: nowMs(), vx: 0, kind: null, target: e.target, id: e.pointerId };
  });
  window.addEventListener('pointermove', (e) => {
    if (!L.W || !S.ready) return;
    fx.spot.tx = e.clientX; fx.spot.ty = e.clientY; if (fx.spotEl) fx.spotEl.classList.add('on');
    Pt.tx = (e.clientX / L.W - 0.5) * 2;
    Pt.ty = (e.clientY / L.H - 0.5) * 2;
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.kind && (Math.abs(dx) > 7 || Math.abs(dy) > 7)) drag.kind = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    if (drag.kind === 'h' && S.mode === 'hero' && !S.busy) {
      if (!els.app.classList.contains('dragging')) { els.app.classList.add('dragging'); for (const t of tweens) if (t.obj === S) delete t.to.pos; }
      S.pos = drag.pos0 - dx / stepPx();
      const n = nowMs(); const dtv = Math.max(1, n - drag.lt);
      drag.vx = lerp(drag.vx, (e.clientX - drag.lx) / dtv, 0.4);
      drag.lx = e.clientX; drag.lt = n;
      S.lastInteract = n;
    }
  });
  const endDrag = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag; drag = null;
    els.app.classList.remove('dragging');
    const dx = e ? e.clientX - d.x : 0, dy = e ? e.clientY - d.y : 0;
    S.lastInteract = nowMs();
    if (d.kind === 'h' && S.mode === 'hero') {
      const target = Math.round(S.pos - clamp(d.vx, -2, 2) * 260 / stepPx());
      tw(S, { pos: target }, { duration: 0.9, ease: 'out4' });
      return;
    }
    if (d.kind === 'v' && Math.abs(dy) > 50) { step(dy < 0 ? 1 : -1, false); return; }
    if (d.kind === 'h' && S.mode === 'detail' && Math.abs(dx) > 60) { step((dx < 0) !== RTL ? 1 : -1, false); return; }
    if (!d.kind) {
      const it = d.target && d.target.closest && d.target.closest('.item');
      if (it) onItemClick(+it.dataset.i);
    }
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  document.addEventListener('pointerleave', () => { Pt.tx = 0; Pt.ty = 0; });

  function onItemClick(i) {
    if (S.busy) return;
    if (S.mode === 'hero') {
      if (i === frontIndex()) enterDetail(i); else spinTo(i);
    } else if (i !== S.cur) goProduct(i);
    else if (hasBack(i)) { S.peeked[i] = true; S.userFlip = (S.userFlip || 0) + 1; flipTo(i); }
  }

  /* ------------------------------------------------------------ store rules */
  const ST = C.store || {};
  const SHIP = Object.assign({ freeOver: 0, fee: null, zones: [] }, ST.shipping || {});
  const SALE = Object.assign({ enabled: false, buy: 2, free: 1 }, ST.smartSale || {});
  const HALF = Object.assign({ enabled: false, percent: 50 }, SALE.secondHalf || {});
  const PAYS = ST.payments && ST.payments.length ? ST.payments : [{ id: 'cod', title: 'Cash on delivery', desc: '' }];
  const RET = ST.returnDays || 0;                       // 0 / null → no returns text anywhere
  const feeTxt = () => (SHIP.fee == null ? T.shippingTbc : money(SHIP.fee));
  const CO = C.checkout || {};
  function tx(k, v) { return String(T[k] == null ? k : T[k]).replace(/\{(\w+)\}/g, (m, n) => (v && v[n] != null ? v[n] : m)); }

  /* shipping by governorate: zones (e.g. Cairo + Alexandria = 70) and a default fee for the rest */
  const ZONES = SHIP.zones || [];
  const GOVS = ST.governorates || [];
  const govName = (en) => { const g = GOVS.find((x) => x[0] === en); return g && RTL ? g[1] : en; };
  const govLabel = (en) => { const g = GOVS.find((x) => x[0] === en); return g ? `${g[0]} (${g[1]})` : en; };
  const feeFor = (city) => { if (!city) return null; const z = ZONES.find((x) => x.cities.indexOf(city) > -1); return z ? z.fee : SHIP.fee; };
  const minFee = () => Math.min.apply(null, ZONES.map((z) => z.fee).concat(SHIP.fee == null ? [] : [SHIP.fee]));
  const curCity = () => { const f = document.getElementById('coForm'); return f && f.elements.city ? f.elements.city.value : ''; };
  function shipLines() {
    const out = [];
    if (SHIP.freeOver > 0) out.push(tx('shipFree', { n: money(SHIP.freeOver) }));
    if (ZONES.length) {
      ZONES.forEach((z) => out.push(tx('shipZone', { cities: z.cities.map(govName).join(T.shipAnd || ' & '), fee: money(z.fee) })));
      if (SHIP.fee != null) out.push(tx('shipRest', { fee: money(SHIP.fee) }));
    } else if (SHIP.fee != null) out.push(tx('shipFlat', { fee: money(SHIP.fee) }));
    return out;
  }
  const shipStr = (c) => (c.freeShip ? T.free : c.ship != null ? money(c.ship) : (ZONES.length && !curCity() ? tx('shippingFrom', { n: money(minFee()) }) : T.shippingTbc));

  let cartOpen = false, indexOpen = false, sheetOpen = false;
  const syncOverlay = () => { S.overlay = cartOpen || indexOpen || sheetOpen; document.body.classList.toggle('lock', S.overlay); };

  /* ------------------------------------------------------------ cart */
  const CART_KEY = 'cart2:' + (C.brand && C.brand.name);
  const CO_KEY = 'co:' + (C.brand && C.brand.name);
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]').filter((x) => P[x.i]); } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ } };
  const cartCount = () => cart.reduce((n, x) => n + x.q, 0);

  // totals incl. Smart Sale (cheapest pieces free) and shipping rule
  function calc() {
    const u = [];
    cart.forEach((x) => { for (let k = 0; k < x.q; k++) u.push(P[x.i].price); });
    const count = u.length;
    const subtotal = u.reduce((a, b) => a + b, 0);
    const g = SALE.buy + SALE.free;
    let discount = 0, freeN = 0, half = 0;
    const r = g > 0 ? count % g : 0;
    if (SALE.enabled && g > 0) {
      const asc = u.slice().sort((x, y) => x - y);
      freeN = Math.floor(count / g) * SALE.free;
      for (let k = 0; k < freeN; k++) discount += asc[k];
      // two left-over pieces → the cheaper of them gets `percent`% off
      if (HALF.enabled && r === 2) { half = Math.round(asc[freeN] * HALF.percent / 100); discount += half; }
    }
    const after = subtotal - discount;
    const freeShip = SHIP.freeOver > 0 && after >= SHIP.freeOver;
    const ship = freeShip ? 0 : (ZONES.length ? feeFor(curCity()) : (SHIP.fee == null ? null : SHIP.fee));
    return {
      count, subtotal, discount, freeN, half, r, after, freeShip, ship,
      total: after + (ship || 0),
      saleNeed: SALE.enabled && count > 0 && r > 0 ? g - r : 0,
      shipNeed: SHIP.freeOver > 0 ? Math.max(0, SHIP.freeOver - after) : 0
    };
  }
  function updateCartBadge(bump) {
    els.cartNs.forEach((n) => { n.textContent = fmtNum(cartCount(), 1); });
    if (bump) els.cartBtns.forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }
  function addToCart(i) {
    const ci = S.color[i], size = S.size[i];
    const ex = cart.find((x) => x.i === i && x.c === ci && x.s === size);
    if (ex) ex.q++; else cart.push({ i, c: ci, s: size, q: 1 });
    saveCart(); updateCartBadge(true);
    const lbl = els.add.querySelector('.add-lbl');
    els.add.classList.add('done');
    lbl.textContent = T.added || 'Added';
    setTimeout(() => { els.add.classList.remove('done'); lbl.textContent = T.addToCart || 'Add to cart'; }, 1500);
  }

  const cartEl = $('#cart');
  let view = 'cart', payId = PAYS[0].id, lastWa = '';
  function setView(v) {
    view = v;
    cartEl.classList.remove('view-cart', 'view-form', 'view-done');
    cartEl.classList.add('view-' + v);
    $('#cartTitle').textContent = v === 'form' ? T.checkout : v === 'done' ? T.orderSent : T.cartTitle;
    $('#checkoutBtn').textContent = v === 'form' ? T.confirmOrder : T.checkout;
    $('#coBack').textContent = T.backToCart;
    renderCart();
  }
  function renderCart() {
    const list = $('#cartList');
    list.innerHTML = '';
    if (!cart.length) list.innerHTML = `<div class="cart-empty mono">${esc(T.cartEmpty)}</div>`;
    cart.forEach((x, k) => {
      const p = P[x.i], col = p.colors[x.c] || p.colors[0];
      const row = mk('div', 'ci');
      row.style.animationDelay = k * 60 + 'ms';
      const old = p.oldPrice && p.oldPrice > p.price ? `<s>${money(p.oldPrice * x.q)}</s>` : '';
      row.innerHTML = `<div class="ci-img"><img alt="" src="${esc(col.thumb || col.image || baseSrcOf(p))}"></div>
        <div><div class="ci-name">${esc(p.name)}</div><div class="ci-sub mono">${[col.name, x.s].filter(Boolean).map(esc).join(' · ')}</div>
        <div class="ci-qty"><button type="button" data-a="-" aria-label="-">−</button><span>${fmtNum(x.q, 1)}</span><button type="button" data-a="+" aria-label="+">+</button></div></div>
        <div class="ci-right"><span>${old}${money(p.price * x.q)}</span><button type="button" class="ci-rm mono" data-a="x">${esc(T.remove)}</button></div>`;
      row.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        const a = b && b.dataset.a;
        if (!a) return;
        if (a === '+') x.q++; else if (a === '-') x.q = Math.max(0, x.q - 1); else x.q = 0;
        cart = cart.filter((y) => y.q > 0);
        saveCart(); updateCartBadge(false); renderCart();
      });
      list.appendChild(row);
    });

    const c = calc();
    // perks: smart sale + free shipping progress
    const perks = [];
    if (SALE.enabled && c.count > 0) {
      const line = (t, ok) => perks.push(`<div class="perk sale${ok ? ' ok' : ''}"><span>${esc(t)}</span></div>`);
      if (c.freeN > 0) line(tx('saleApplied', { n: fmtNum(c.freeN, 1) }), true);
      if (c.half > 0) line(tx('halfApplied', { p: fmtNum(HALF.percent, 1) }), true);
      if (HALF.enabled) {
        if (c.r === 1) line(c.count === 1 ? T.hintFirst : T.hintNextHalf, false);
        else if (c.r === 2) line(T.hintFree, false);
      } else if (c.saleNeed > 0) line(tx('saleHintAdd', { n: fmtNum(c.saleNeed, 1) }), false);
    }
    if (SHIP.freeOver > 0 && c.count > 0) {
      const pct = Math.min(100, Math.round((c.after / SHIP.freeOver) * 100));
      const msg = c.freeShip ? T.shipHintDone : tx('shipHintAdd', { n: money(c.shipNeed) });
      perks.push(`<div class="perk${c.freeShip ? ' ok' : ''}"><span>${esc(msg)}</span><div class="bar" style="--p:${pct}%"><i></i></div></div>`);
    }
    $('#cartPerks').innerHTML = perks.join('');

    const rows = [`<div class="r"><span>${esc(T.subtotal)}</span><span>${money(c.subtotal)}</span></div>`];
    if (c.discount > 0) rows.push(`<div class="r disc"><span>${esc(T.smartSale)}</span><span>−${money(c.discount)}</span></div>`);
    if (c.count > 0) rows.push(`<div class="r ship"><span>${esc(T.shipping)}</span><span>${esc(shipStr(c))}</span></div>`);
    const pending = ZONES.length > 0 && !c.freeShip && c.ship == null;
    rows.push(`<div class="r tot"><span>${esc(pending ? T.totalEx : T.total)}</span><span>${money(c.total)}</span></div>`);
    $('#totals').innerHTML = rows.join('');
    $('#checkoutBtn').disabled = !cart.length;
  }

  // payment options
  function buildPay() {
    const host = $('#payList');
    host.innerHTML = '';
    PAYS.forEach((o) => {
      const b = mk('button', 'pay-opt' + (o.id === payId ? ' on' : ''));
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', o.id === payId ? 'true' : 'false');
      const acct = o.account ? `<span class="acct"><b class="mono">${esc(o.account)}</b><span class="copy mono" role="button" tabindex="0" data-n="${esc(o.account)}">${esc(T.copy || 'Copy')}</span></span>` : '';
      b.innerHTML = `<span class="dot-r"></span><span><b>${esc(o.title)}</b><small>${esc(o.desc || '')}</small>${acct}</span>`;
      b.addEventListener('click', (e) => {
        const cp = e.target.closest && e.target.closest('.copy');
        if (cp) { copyText(cp.dataset.n); toast(T.copied || 'Copied'); }
        payId = o.id; $$('.pay-opt', host).forEach((x, k) => { const on = PAYS[k].id === payId; x.classList.toggle('on', on); x.setAttribute('aria-checked', on ? 'true' : 'false'); });
        if (o.account) setTimeout(() => b.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' }), 80);
      });
      host.appendChild(b);
    });
  }
  const payLi = (o) => `<li><b>${esc(o.title)}</b> — ${esc(o.desc || '')}${o.account ? ` <span class="acct-inline">${esc(o.account)}</span>` : ''}</li>`;
  // open a link in a new tab from a click (window.open with 'noopener' always returns null, so a link click is the reliable way)
  function openLink(url) {
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove();
  }
  function copyText(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).catch(() => {}); return; } } catch (e) { /* fall through */ }
    try { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } catch (e) { /* ignore */ }
  }
  const form = $('#coForm');
  // governorate list (drives the shipping price)
  function buildCity() {
    const sel = form.elements.city;
    if (!sel || sel.tagName !== 'SELECT') return;
    if (!GOVS.length) {                       // no list configured → plain text field
      const inp = document.createElement('input');
      inp.name = 'city'; inp.required = true; inp.setAttribute('autocomplete', 'address-level1');
      sel.replaceWith(inp); return;
    }
    sel.innerHTML = '';
    const ph = new Option(T.cityPh || '', ''); ph.disabled = true; ph.selected = true; sel.appendChild(ph);
    GOVS.forEach((g) => sel.appendChild(new Option(RTL ? g[1] : `${g[0]} · ${g[1]}`, g[0])));
    sel.addEventListener('change', () => { sel.closest('.fld').classList.remove('bad'); renderCart(); });
  }
  function loadForm() {
    try { const d = JSON.parse(localStorage.getItem(CO_KEY) || '{}'); ['name', 'phone', 'city', 'address'].forEach((k) => { if (d[k] && form.elements[k]) form.elements[k].value = d[k]; }); } catch (e) { /* ignore */ }
  }
  function validate() {
    let first = null;
    const rules = { name: (v) => v.trim().length >= 2, phone: (v) => v.replace(/\D/g, '').length >= 10, city: (v) => v.trim().length >= 2, address: (v) => v.trim().length >= 5 };
    Object.keys(rules).forEach((k) => {
      const f = form.elements[k], box = f.closest('.fld'), ok = rules[k](f.value);
      box.classList.toggle('bad', !ok);
      box.querySelector('span').dataset.err = T.required;
      if (!ok && !first) first = f;
    });
    if (first) first.focus();
    return !first;
  }
  function orderText() {
    const c = calc();
    const pay = PAYS.find((o) => o.id === payId) || PAYS[0];
    const L2 = [`*${tx('orderIntro')} — ${C.brand.name}*`, ''];
    L2.push(`${T.orderCustomer}: ${form.elements.name.value.trim()} — ${form.elements.phone.value.trim()}`);
    L2.push(`${T.orderAddress}: ${govLabel(form.elements.city.value.trim())} — ${form.elements.address.value.trim()}`);
    L2.push('', `${T.orderItems}:`);
    cart.forEach((x, k) => {
      const p = P[x.i], col = p.colors[x.c] || p.colors[0];
      L2.push(`${k + 1}. ${p.name} — ${[col.name, x.s].filter(Boolean).join(' / ')} × ${x.q} — ${money(p.price * x.q)}`);
    });
    L2.push('', `${T.subtotal}: ${money(c.subtotal)}`);
    if (c.discount > 0) L2.push(`${T.smartSale}: −${money(c.discount)}`);
    L2.push(`${T.shipping}: ${shipStr(c)}`);
    L2.push(`*${T.total}: ${money(c.total)}*`, '', `${T.orderPayment}: ${pay.title}`);
    const notes = form.elements.notes.value.trim();
    if (notes) L2.push(`${T.orderNotes}: ${notes}`);
    return L2.join('\n');
  }
  function sendOrder() {
    if (!cart.length || !validate()) return;
    try { localStorage.setItem(CO_KEY, JSON.stringify({ name: form.elements.name.value, phone: form.elements.phone.value, city: form.elements.city.value, address: form.elements.address.value })); } catch (e) { /* ignore */ }
    const text = orderText();
    if (CO.whatsapp) lastWa = `https://wa.me/${String(CO.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    else if (CO.url) lastWa = CO.url + (CO.url.indexOf('?') > -1 ? '&' : '?') + 'order=' + encodeURIComponent(text);
    else { try { navigator.clipboard.writeText(text); } catch (e) { /* ignore */ } toast(T.copied || T.orderSent); lastWa = ''; }
    if (lastWa) openLink(lastWa);
    const payo = PAYS.find((o) => o.id === payId) || PAYS[0];
    $('#doneText').textContent = T.doneText + (payo.account ? ' ' + tx('doneTransfer', { n: payo.account }) : '');
    cart = []; saveCart(); updateCartBadge(true);
    $('#reopenBtn').style.display = lastWa ? '' : 'none';
    setView('done');
  }
  function openCart() { cartOpen = true; syncOverlay(); setView('cart'); cartEl.classList.add('open'); $('#scrim').classList.add('open'); cartEl.setAttribute('aria-hidden', 'false'); }
  function closeCart() { cartOpen = false; syncOverlay(); cartEl.classList.remove('open'); $('#scrim').classList.remove('open'); cartEl.setAttribute('aria-hidden', 'true'); }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2400); }

  /* ------------------------------------------------------------ info sheet (size guide / shipping / returns) */
  let sheetTab = 'ship', sheetChart = null;
  function chartHtml(key) {
    const ch = (C.sizeCharts || {})[key];
    if (!ch) return '';
    const head = `<tr><th>${esc(T.size)}</th>${ch.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>`;
    const rows = ch.rows.map((r) => `<tr>${r.map((v, k) => (k === 0 ? `<td>${esc(v)}</td>` : `<td>${esc(typeof v === 'number' ? fmtNum(v, 1).replace(/^0(\d)/, '$1') : v)}</td>`)).join('')}</tr>`).join('');
    return `<h2>${esc(ch.title)}</h2><div class="sub mono">${esc(ch.unit || '')}</div>
      <div class="chart-wrap"><table class="chart"><thead>${head}</thead><tbody>${rows}</tbody></table></div>
      ${ch.fit ? `<div class="fit">${esc(ch.fit)}</div>` : ''}${ch.note ? `<div class="note">${esc(ch.note)}</div>` : ''}`;
  }
  function sheetBodyHtml() {
    if (sheetTab === 'size') return chartHtml(sheetChart);
    const wa = CO.whatsapp ? `<a href="https://wa.me/${String(CO.whatsapp).replace(/\D/g, '')}" target="_blank" rel="noopener">${esc(CO.displayNumber || CO.whatsapp)}</a>` : '';
    if (sheetTab === 'return' && RET) {
      return `<h2>${esc(T.returnTitle)}</h2><div class="sub mono">${esc(tx('perkReturn', { d: fmtNum(RET, 1) }))}</div>
        <div class="blocks"><div class="blk"><ul><li>${esc(tx('returnLine1', { d: fmtNum(RET, 1) }))}</li><li>${esc(T.returnLine2)} ${wa}</li></ul></div></div>`;
    }
    const pays = PAYS.map(payLi).join('');
    return `<h2>${esc(T.tabShip)}</h2><div class="sub mono">${esc(C.brand.name)}</div>
      <div class="blocks">
        <div class="blk"><h3>${esc(T.shipTitle)}</h3><ul>${shipLines().map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>
        <div class="blk"><h3>${esc(T.payTitle)}</h3><ul>${pays}</ul></div>
        ${SALE.enabled ? `<div class="blk"><h3>${esc(T.saleTitle)}</h3><p>${esc(T.saleLine1)}</p></div>` : ''}
        ${wa ? `<div class="blk"><h3>${esc(T.contact)}</h3><p>${wa}</p></div>` : ''}
      </div>`;
  }
  function renderSheet() {
    const tabs = [];
    const hasChart = Object.keys(C.sizeCharts || {}).length > 0;
    if (hasChart && sheetChart) tabs.push(['size', T.tabSize]);
    tabs.push(['ship', T.tabShip]);
    if (RET) tabs.push(['return', T.tabReturn]);
    $('#sheetTabs').innerHTML = tabs.map((t) => `<button type="button" class="tab mono${t[0] === sheetTab ? ' on' : ''}" data-t="${t[0]}">${esc(t[1])}</button>`).join('');
    $$('.tab', $('#sheetTabs')).forEach((b) => b.addEventListener('click', () => { sheetTab = b.dataset.t; renderSheet(); }));
    const body = $('#sheetBody');
    body.innerHTML = sheetBodyHtml();
    body.scrollTop = 0;
  }
  function openSheet(tab, chartKey) {
    if (chartKey) sheetChart = chartKey;
    sheetTab = tab || 'ship';
    sheetOpen = true; syncOverlay();
    renderSheet();
    $('#sheet').classList.add('open'); $('#sheet').setAttribute('aria-hidden', 'false');
  }
  function closeSheet() { sheetOpen = false; syncOverlay(); $('#sheet').classList.remove('open'); $('#sheet').setAttribute('aria-hidden', 'true'); }

  /* ------------------------------------------------------------ index overlay */
  function buildIndex() {
    const g = $('#idxGrid');
    g.innerHTML = '';
    let last = null, n = 0;
    P.forEach((p, i) => {
      if (p.group && p.group !== last) {
        last = p.group;
        const h = mk('div', 'idx-group mono'); h.textContent = p.groupLabel || p.group;
        g.appendChild(h);
      }
      const c = mk('button', 'idx-card');
      c.type = 'button';
      const old = p.oldPrice && p.oldPrice > p.price ? `<s>${money(p.oldPrice)}</s>` : '';
      c.innerHTML = `<div class="idx-img"><img alt="" src="${esc((p.colors[0] && p.colors[0].image) || baseSrcOf(p))}"></div>
        <div class="idx-meta"><span>${esc(p.name)}</span><span class="pr">${old}<span>${money(p.price)}</span></span></div>`;
      c.style.transitionDelay = 300 + n++ * 70 + 'ms';
      c.addEventListener('click', () => { closeIndex(); setTimeout(() => jumpTo(i), 500); });
      g.appendChild(c);
    });
  }
  function openIndex() { indexOpen = true; syncOverlay(); $('#index').classList.add('open'); $('#index').setAttribute('aria-hidden', 'false'); }
  function closeIndex() {
    indexOpen = false; syncOverlay();
    $$('.idx-card').forEach((c) => { c.style.transitionDelay = '0ms'; });
    $('#index').classList.remove('open'); $('#index').setAttribute('aria-hidden', 'true');
    setTimeout(() => $$('.idx-card').forEach((c, i) => { c.style.transitionDelay = 300 + i * 70 + 'ms'; }), 1100);
  }

  /* ------------------------------------------------------------ wiring */
  function wire() {
    $$('[data-lang-toggle]').forEach((b) => {
      b.textContent = RTL ? 'EN' : 'عربي';
      b.setAttribute('title', RTL ? 'English' : 'العربية');
      b.addEventListener('click', () => {
        try { localStorage.setItem('itsme_lang', RTL ? 'en' : 'ar'); } catch (e) { /* ignore */ }
        location.reload();
      });
    });
    els.brand.innerHTML = brandHtml();
    $('#ldBrand').innerHTML = els.brand.innerHTML;
    els.cartLbls.forEach((l) => { l.textContent = T.cart; });
    els.back.textContent = T.back;
    els.hint.textContent = T.scroll;
    els.sideV.textContent = HERO.sideText;
    $('#idxTitle').textContent = T.indexTitle;
    $('#idxClose').textContent = T.close;
    $('#cartClose').textContent = T.close;
    $('#sheetClose').textContent = T.close;
    $('#coDetails').textContent = T.detailsTitle;
    $('#coPay').textContent = T.paymentTitle;
    $('#lName').textContent = T.name; $('#lPhone').textContent = T.phone; $('#lCity').textContent = T.city;
    $('#lAddress').textContent = T.address; $('#lNotes').textContent = T.notes;
    $('#doneTitle').textContent = T.doneTitle; $('#doneText').textContent = T.doneText;
    $('#doneBtn').textContent = T.doneBtn; $('#reopenBtn').textContent = T.reopen;
    const capHtml = (arr) => (arr || []).map((l) => `<span class="rv"><span class="rvi">${esc(l)}</span></span>`).join('');
    els.capL.innerHTML = capHtml(HERO.captionLeft);
    els.capR.innerHTML = capHtml(HERO.captionRight);
    const PILL = HERO.pill || null;
    if (PILL && (PILL.lines || []).length) {
      $('#dpTag').textContent = PILL.label || '';
      $('#dpLines').innerHTML = PILL.lines.map((l, k) => `<span class="dpl${k === 0 ? ' on' : ''}">${esc(l)}</span>`).join('');
      let pk = 0;
      setInterval(() => { const ls = $$('.dpl', $('#dpLines')); if (ls.length < 2 || document.hidden) return; ls[pk].classList.remove('on'); pk = (pk + 1) % ls.length; ls[pk].classList.add('on'); }, 3000);
      $('#dealPill').addEventListener('click', () => scrollToId(document.getElementById('deal') ? 'deal' : 'shop'));
    } else $('#dealPill').style.display = 'none';
    updateCartBadge(false);
    buildPay(); buildCity(); loadForm(); setView('cart');

    P.forEach((p, i) => {
      const d = mk('button', 'dot'); d.type = 'button'; d.setAttribute('aria-label', p.name);
      d.addEventListener('click', () => { S.lastInteract = nowMs(); if (S.mode === 'hero') spinTo(i); else goProduct(i); });
      els.dots.appendChild(d);
    });

    els.brand.addEventListener('click', (e) => { e.preventDefault(); if (S.mode === 'detail') leaveDetail(); else spinTo(0); });
    els.back.addEventListener('click', () => leaveDetail());
    els.hdrBtn.addEventListener('click', () => {
      if (S.mode === 'hero') openIndex();
      else if (!S.busy) goProduct((S.cur + 1) % N, 1);
    });
    els.add.addEventListener('click', () => addToCart(S.cur));
    els.cartBtns.forEach((b) => b.addEventListener('click', openCart));
    els.hintBtn.addEventListener('click', () => scrollToId('shop'));
    $('#cartClose').addEventListener('click', closeCart);
    $('#scrim').addEventListener('click', closeCart);
    $('#idxClose').addEventListener('click', closeIndex);
    $('#sheetClose').addEventListener('click', closeSheet);
    $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
    $('#checkoutBtn').addEventListener('click', () => { if (!cart.length) return; if (view === 'cart') setView('form'); else if (view === 'form') sendOrder(); });
    form.addEventListener('submit', (e) => { e.preventDefault(); sendOrder(); });
    $$('.fld input, .fld textarea, .fld select', form).forEach((f) => f.addEventListener('input', () => f.closest('.fld').classList.remove('bad')));
    $('#coBack').addEventListener('click', () => setView('cart'));
    $('#doneBtn').addEventListener('click', () => { setView('cart'); closeCart(); });
    $('#reopenBtn').addEventListener('click', () => { if (lastWa) openLink(lastWa); });
    buildIndex();
    window.addEventListener('resize', () => { layout(); measureTicker(); });
  }

  /* ------------------------------------------------------------ shop site (under the hero) */
  const SITE = Object.assign({ nav: [], ticker: [], shop: {}, groups: {}, guides: {}, help: {}, drop: { enabled: false }, footer: {} }, C.site || {});
  const groupInfo = (g) => (SITE.groups || {})[g] || {};
  const isFeat = (p) => !!groupInfo(p.group).feature;
  const waNum = () => String(CO.whatsapp || '').replace(/\D/g, '');
  const waLink = (text) => (waNum() ? `https://wa.me/${waNum()}${text ? '?text=' + encodeURIComponent(text) : ''}` : '#');
  const slug = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'group';

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  }
  async function showcase(i, ci) {
    if (S.overlay) return;
    ci = ci || 0;
    if (S.mode === 'detail' && S.cur === i) { if (S.color[i] !== ci) pickColor(i, ci); }
    else if (S.color[i] !== ci) setColor(i, ci, false);
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    const t0 = nowMs();
    while (window.scrollY > 4 && nowMs() - t0 < 3000) await wait(60);
    while (S.busy) await wait(60);
    if (S.mode === 'hero') enterDetail(i); else if (S.cur !== i) goProduct(i);
  }

  function cardHtml(p) {
    const pct = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const old = pct ? `<s>${money(p.oldPrice)}</s>` : '';
    const badge = pct ? `<span class="card-badge">−${fmtNum(pct, 1)}%</span>`
      : (p.sizes.length > 1 ? `<span class="card-badge alt">${esc(p.sizes[0])} – ${esc(p.sizes[p.sizes.length - 1])}</span>` : '');
    const dots = p.colors.length > 1
      ? `<div class="dotsrow">${p.colors.map((c, k) => `<button type="button" class="cdot${k === 0 ? ' on' : ''}" data-c="${k}" style="--c:${esc(c.hex || '#999')}" aria-label="${esc(c.name)}" title="${esc(c.name)}"></button>`).join('')}</div>`
      : '';
    const back0 = p.colors[0] && p.colors[0].back;
    const dm = imgDims[(p.colors[0] && p.colors[0].image) || baseSrcOf(p)];
    const arStyle = p.photo && dm && dm.h ? ` style="aspect-ratio:${dm.w}/${dm.h}"` : '';
    return `<div class="card-img${back0 ? ' has-back' : ''}${p.photo ? ' photo' : ''}"${arStyle}>${badge}<img class="cf" alt="${esc(p.name)}" loading="lazy" draggable="false" src="${esc((p.colors[0] && p.colors[0].image) || baseSrcOf(p))}">${back0 ? `<img class="cb" alt="" loading="lazy" draggable="false" src="${esc(back0)}">` : ''}<span class="card-view">${esc(T.view || 'View')}</span></div>
      <div class="card-meta"><div class="card-row"><span class="card-name">${esc(p.name)}</span><span class="card-price">${old}${money(p.price)}</span></div>
      <div class="card-sub mono">${dots}<span>${esc(p.category || '')}</span></div></div>`;
  }
  function makeCard(p, i, delay) {
    const el = mk('article', 'card rev');
    el.tabIndex = 0; el.dataset.i = i; el.dataset.group = p.group || ''; el.dataset.c = 0;
    el.style.setProperty('--d', delay || 0);
    el.innerHTML = cardHtml(p);
    const img = $('img', el);
    $$('.cdot', el).forEach((b) => {
      const k = +b.dataset.c;
      const set = () => {
        el.dataset.c = k;
        $$('.cdot', el).forEach((x) => x.classList.toggle('on', x === b));
        const c = p.colors[k];
        const cb = $('.cb', el);
        if (cb) { if (c && c.back) cb.src = c.back; $('.card-img', el).classList.toggle('has-back', !!(c && c.back)); }
        if (c && c.image && img.getAttribute('src') !== c.image) { img.style.opacity = 0; setTimeout(() => { img.src = c.image; img.style.opacity = 1; }, 170); }
      };
      b.addEventListener('mouseenter', set);
      b.addEventListener('click', (e) => { e.stopPropagation(); set(); });
    });
    const open = () => showcase(i, +el.dataset.c);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    return el;
  }

  // "find your size" — weight → size, from the `weights` of each product's chart
  function finderRun(list, w) {
    const out = [];
    let msg = '';
    list.forEach((p) => {
      const ch = C.sizeCharts[p.sizeChart];
      const W = ch.weights, cols = ch.columns;
      const lastSel = Math.max.apply(null, p.sizes.map((z) => cols.indexOf(z)));
      let idx = W.findIndex((r) => w >= r[0] && w < r[1]);
      if (idx < 0 && w === W[W.length - 1][1]) idx = W.length - 1;
      if (w < W[0][0]) msg = tx('finderLow', { n: fmtNum(W[0][0], 1) });
      else if (idx < 0 || idx > lastSel) msg = tx('finderHigh', { n: fmtNum(W[lastSel][1], 1) });
      else out.push(tx('finderRes', { p: `<b>${esc(p.name)}</b>`, s: `<b>${esc(cols[idx])}</b>` }));
    });
    return out.length ? out.join('<br>') + (msg ? '<br>' + esc(msg) : '') : esc(msg);
  }

  function buildSite() {
    const host = $('#site');
    host.innerHTML = '';
    const sec = (id, cls, html) => { const s = mk('section', 'sec' + (cls ? ' ' + cls : '')); if (id) s.id = id; s.innerHTML = html; host.appendChild(s); return s; };
    const ids = [];

    // ticker
    if ((SITE.ticker || []).length) {
      const one = SITE.ticker.map((x) => `<span>${esc(x)}</span>`).join('');
      const t = mk('div', 'ticker');
      t.innerHTML = `<div class="tk-track">${one + one + one + one}</div>`;
      host.appendChild(t);
    }

    // mega deal
    const DL = SITE.deal || {};
    if (SALE.enabled && (DL.cards || []).length) {
      const A = P[0].price, A2 = (P[1] || P[0]).price, Z = Math.min.apply(null, P.map((p) => p.price));
      const secondPay = A - Math.round(A * HALF.percent / 100);
      const chip = (t, hl) => `<span class="ex-chip${hl ? ' hl' : ''}">${t}</span>`;
      const exs = [
        chip(money(A)) + '<i>+</i>' + chip(money(secondPay), true),
        chip(money(A)) + '<i>+</i>' + chip(money(A2)) + '<i>+</i>' + chip(`<s>${money(Z)}</s> ${esc(DL.free || 'Free')}`, true)
      ];
      const cardsHtml = DL.cards.map((c, k) => `<article class="dcard rev${c.hot ? ' hot' : ''}" style="--d:${150 + k * 140}" data-par="${k ? -0.05 : 0.04}">
        <div class="dcard-top mono"><span>${esc(c.tag || '')}</span><span class="dpulse"></span></div>
        <div class="dnum"${/^\d+$/.test(c.big) ? ` data-count="${c.big}"` : ''}><span class="dn">${esc(c.big)}</span>${c.unit ? `<sup>${esc(c.unit)}</sup>` : ''}</div>
        <h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>
        <div class="dcard-sep"></div>
        <div class="dex mono"><span>${esc(DL.exampleLabel || '')}</span><div class="ex-row">${exs[k] || ''}</div></div></article>`).join('');
      sec('deal', 'dealsec', `<div class="deal-head"><div><div class="eyebrow mono">${esc(DL.eyebrow || '')}</div><h2 class="sec-title">${esc(DL.title || '')}</h2>${DL.text ? `<p class="sec-sub">${esc(DL.text)}</p>` : ''}</div>
        ${DL.cta ? `<button type="button" class="btn" data-go="shop">${esc(DL.cta)}</button>` : ''}</div>
        <div class="deal-grid">${cardsHtml}</div>${DL.note ? `<p class="deal-note mono">${esc(DL.note)}</p>` : ''}`);
      ids.push('deal');
    }

    // shop grid
    const shopList = P.map((p, i) => [p, i]).filter((x) => !isFeat(x[0]));
    if (shopList.length) {
      const SH = SITE.shop || {};
      const sh = sec('shop', '', `<div class="shop-head"><div><div class="eyebrow mono">${esc(SH.eyebrow || '')}</div><h2 class="sec-title">${esc(SH.title || '')}</h2>${SH.sub ? `<p class="sec-sub">${esc(SH.sub)}</p>` : ''}</div><div class="filters" id="filters"></div></div><div class="grid" id="shopGrid"></div>`);
      const grid = $('#shopGrid', sh);
      shopList.forEach((x, k) => grid.appendChild(makeCard(x[0], x[1], (k % 4) * 90)));
      const groups = Array.from(new Set(shopList.map((x) => x[0].group).filter(Boolean)));
      if (groups.length > 1) {
        const fl = $('#filters', sh);
        [['', SH.all || 'All']].concat(groups.map((g) => [g, (groupInfo(g).title) || g])).forEach((f, k) => {
          const b = mk('button', 'chip' + (k === 0 ? ' on' : '')); b.type = 'button'; b.textContent = f[1];
          b.addEventListener('click', () => {
            $$('.chip', fl).forEach((c) => c.classList.toggle('on', c === b));
            let n = 0;
            $$('.card', grid).forEach((c) => {
              const show = !f[0] || c.dataset.group === f[0];
              c.classList.toggle('hide', !show);
              if (show) { c.classList.remove('in'); c.style.setProperty('--d', n++ * 70); void c.offsetWidth; requestAnimationFrame(() => c.classList.add('in')); }
            });
          });
          fl.appendChild(b);
        });
      } else $('#filters', sh).remove();
      ids.push('shop');
    }

    // featured groups (Big Size …)
    const feat = Array.from(new Set(P.filter(isFeat).map((p) => p.group)));
    feat.forEach((g) => {
      const gi = groupInfo(g), id = gi.id || slug(g);
      const list = P.map((p, i) => [p, i]).filter((x) => x[0].group === g);
      const fl = list.map((x) => x[0]).filter((p) => p.sizeChart && C.sizeCharts && C.sizeCharts[p.sizeChart]);
      const chartKeys = Array.from(new Set(fl.map((p) => p.sizeChart)));
      const canFind = fl.length && fl.every((p) => C.sizeCharts[p.sizeChart].weights);
      const s = sec(id, '', `<div class="bigwrap"><span class="bw-ghost" aria-hidden="true" data-par="-0.12">${esc(String(gi.title || g).toUpperCase())}</span><div class="big">
        <div class="big-l"><div class="eyebrow mono">${esc(gi.eyebrow || '')}</div><h2 class="sec-title">${esc(gi.title || g)}</h2>
          ${gi.text ? `<p class="sec-sub">${esc(gi.text)}</p>` : ''}
          ${(gi.chips || []).length ? `<div class="chips mono">${gi.chips.map((c) => `<span class="chip-s">${esc(c)}</span>`).join('')}</div>` : ''}
          ${canFind ? `<form class="finder" novalidate><h4>${esc(T.finderTitle || 'Find your size')}</h4><div class="finder-row"><input type="number" inputmode="numeric" min="30" max="300" placeholder="${esc(T.finderPh || 'kg')}" aria-label="${esc(T.finderPh || 'kg')}"><button class="btn" type="submit">${esc(T.finderGo || 'Check')}</button></div><div class="finder-res" aria-live="polite"></div></form>` : ''}
          ${chartKeys.length ? `<div class="big-links">${chartKeys.map((k) => `<button type="button" class="btn outline mono" data-chart="${esc(k)}">${esc(C.sizeCharts[k].tab || C.sizeCharts[k].title)}</button>`).join('')}</div>` : ''}
        </div><div class="big-cards"></div></div></div>`);
      const cards = $('.big-cards', s);
      cards.style.setProperty('--cols', Math.min(3, Math.max(2, list.length)));
      list.forEach((x, k) => { const cd = makeCard(x[0], x[1], 150 + k * 120); cd.dataset.par = k % 2 ? '-0.05' : '0.04'; cards.appendChild(cd); });
      $$('[data-chart]', s).forEach((b) => b.addEventListener('click', () => openSheet('size', b.dataset.chart)));
      const f = $('.finder', s);
      if (f) f.addEventListener('submit', (e) => {
        e.preventDefault();
        const w = parseFloat(f.querySelector('input').value);
        $('.finder-res', f).innerHTML = isFinite(w) && w > 0 ? finderRun(fl, w) : '';
      });
      ids.push(id);
    });

    // new drop
    const D = SITE.drop || {};
    if (D.enabled) {
      const teasers = P.slice(0, Math.max(0, D.teasers == null ? 3 : D.teasers)).map((p, k) => `<div class="tz" data-par="${[0.09, -0.04, 0.12][k % 3]}"><img alt="" src="${esc((p.colors[0] && p.colors[0].image) || baseSrcOf(p))}"></div>`).join('');
      const CDL = T.cd || ['Days', 'Hours', 'Min', 'Sec'];
      const when = D.date ? new Date(D.date).getTime() : NaN;
      sec('drop', 'drop', `<div class="drop-ghost" aria-hidden="true" data-par="0.1">${esc(String(D.ghost || D.eyebrow || '').toUpperCase())}</div>
        <div class="drop-in"><div class="eyebrow mono">${esc(D.eyebrow || '')}</div><h2 class="sec-title">${esc(D.title || '')}</h2>
        ${D.text ? `<p class="sec-sub">${esc(D.text)}</p>` : ''}
        ${isFinite(when) ? `<div class="count-row" id="cdRow">${CDL.map((l) => `<div class="cd"><b>00</b><span class="mono">${esc(l)}</span></div>`).join('')}</div>` : `<div class="soon mono"><i></i>${esc(D.soon || '')}</div>`}
        ${teasers ? `<div class="teasers" aria-hidden="true">${teasers}</div>` : ''}
        ${waNum() && D.notify ? `<a class="btn" target="_blank" rel="noopener" href="${esc(waLink(D.notifyMsg))}">${esc(D.notify)}</a>` : ''}</div>`);
      if (isFinite(when)) {
        const tick = () => {
          const row = $('#cdRow'); if (!row) return;
          let d = Math.max(0, when - Date.now()); const v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];
          $$('.cd b', row).forEach((b, k) => { b.textContent = String(v[k]).padStart(2, '0'); });
        };
        tick(); setInterval(tick, 1000);
      }
      ids.push('drop');
    }

    // size guides
    const keys = Object.keys(C.sizeCharts || {});
    if (keys.length) {
      const G = SITE.guides || {};
      const gs = sec('guides', '', `<div class="eyebrow mono">${esc(G.eyebrow || '')}</div><h2 class="sec-title">${esc(G.title || T.tabSize || '')}</h2>${G.sub ? `<p class="sec-sub">${esc(G.sub)}</p>` : ''}<div class="guide-tabs" id="gTabs"></div><div class="sheet-body guide-body" id="gBody"></div>`);
      const showG = (k) => { $$('.chip', $('#gTabs', gs)).forEach((c) => c.classList.toggle('on', c.dataset.k === k)); $('#gBody', gs).innerHTML = chartHtml(k); };
      keys.forEach((k, n) => { const b = mk('button', 'chip' + (n === 0 ? ' on' : '')); b.type = 'button'; b.dataset.k = k; b.textContent = C.sizeCharts[k].tab || C.sizeCharts[k].title; b.addEventListener('click', () => showG(k)); $('#gTabs', gs).appendChild(b); });
      showG(keys[0]);
      ids.push('guides');
    }

    // help cards
    const H = SITE.help || {};
    const pays = PAYS.map(payLi).join('');
    const ico = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    const cards = [
      [T.shipTitle, ico('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>'), shipLines().map((l, k) => `<p${k ? ' style="margin-top:8px"' : ''}>${esc(l)}</p>`).join('')],
      [T.payTitle, ico('<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10.5h18M7 15h3"/>'), `<ul>${pays}</ul>`]
    ];
    if (RET) cards.push([T.returnTitle, ico('<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>'), `<ul><li>${esc(tx('returnLine1', { d: fmtNum(RET, 1) }))}</li><li>${esc(T.returnLine2)}</li></ul>`]);
    if (SALE.enabled) cards.push([T.saleTitle, ico('<path d="M20 12 12 20 4 12V4h8z"/><circle cx="8.5" cy="8.5" r="1.3"/>'), `<p>${esc(T.saleLine1)}</p>`]);
    if (waNum()) cards.push([T.contact, ico('<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8z"/>'), `<p><a href="${esc(waLink())}" target="_blank" rel="noopener">${esc(CO.displayNumber || CO.whatsapp)}</a></p>`]);
    sec('help', '', `<div class="eyebrow mono">${esc(H.eyebrow || '')}</div><h2 class="sec-title">${esc(H.title || '')}</h2><div class="hgrid">${cards.map((c, k) => `<div class="hcard rev" style="--d:${k * 90}"><div class="hcard-n mono"><span>${fmtNum(k + 1, 2)}</span>${c[1]}</div><h3>${esc(c[0])}</h3><div class="blk">${c[2]}</div></div>`).join('')}</div>`);
    ids.push('help');

    // footer
    const FT = SITE.footer || {};
    const CR = SITE.credit || null;
    const foot = mk('footer', 'sfoot');
    foot.innerHTML = `<div class="sfoot-top"><div><div class="snav-brand">${brandHtml()}</div><p style="margin-top:12px">${esc(FT.text || '')}</p></div>
      <div class="sfoot-links mono">${(SITE.nav || []).filter((n) => ids.indexOf(n.target) > -1).map((n) => `<a href="#${esc(n.target)}" data-go="${esc(n.target)}">${esc(n.label)}</a>`).join('')}</div>
      ${waNum() ? `<a class="btn" target="_blank" rel="noopener" href="${esc(waLink())}">${esc(CO.displayNumber || CO.whatsapp)}</a>` : ''}</div>
      <div class="sfoot-big split" aria-hidden="true">${Array.from(C.brand.name).map((ch, k) => `<span class="ch" style="--i:${k}">${esc(ch)}</span>`).join('')}${C.brand.dot ? `<span class="ch red" style="--i:${C.brand.name.length}">.</span>` : ''}</div>
      <div class="sfoot-bot mono"><span>© ${new Date().getFullYear()} ${esc(C.brand.name)}. ${esc(FT.rights || '')}</span><span>${esc(CO.displayNumber || '')}</span></div>
      ${CR && CR.name ? `<a class="credit" target="_blank" rel="noopener" href="https://wa.me/${String(CR.whatsapp || '').replace(/\D/g, '')}${CR.message ? '?text=' + encodeURIComponent(CR.message) : ''}"><span class="credit-t">${esc(CR.text || '')}</span><b class="credit-n">${esc(CR.name)}</b><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>` : ''}`;
    host.appendChild(foot);

    // nav
    $('#snavBrand').innerHTML = brandHtml();
    $('#snavBrand').addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }); });
    $('#snavLinks').innerHTML = (SITE.nav || []).filter((n) => ids.indexOf(n.target) > -1).map((n) => `<a href="#${esc(n.target)}" data-go="${esc(n.target)}">${esc(n.label)}</a>`).join('');
    $$('[data-go]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollToId(a.dataset.go); }));
    navIds = ids;

    // split titles into masked words
    $$('.sec-title', host).forEach((el) => {
      const txt = el.textContent.trim();
      el.setAttribute('aria-label', txt);
      el.innerHTML = txt.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span class="wi" style="--i:${i}">${esc(w)}</span></span>`).join(' ');
      el.classList.add('split');
    });

    // ambient layer (orbs + cursor glow) that follows the page
    const fxl = mk('div', 'sfx'); fxl.id = 'sfx'; fxl.setAttribute('aria-hidden', 'true');
    fxl.innerHTML = '<i class="sorb a"></i><i class="sorb b"></i><i class="sspot"></i>';
    host.appendChild(fxl);

    // reveal on scroll
    $$('.eyebrow, .sec-sub, .chips, .finder, .big-links, .soon, .count-row, .teasers, .drop .btn, .deal-head .btn, .deal-note, .guide-tabs, .guide-body', host).forEach((e, k) => { e.classList.add('rev'); e.style.setProperty('--d', (k % 4) * 70); });
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in'); io.unobserve(en.target);
      $$('[data-count]', en.target).forEach(countUp);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
    $$('.rev, .split', host).forEach((e) => (io ? io.observe(e) : e.classList.add('in')));

    // parallax + ticker handles
    parEls = $$('[data-par]', host).map((el) => ({ el, f: parseFloat(el.dataset.par) || 0 }));
    tk.el = $('.tk-track', host); tk.half = 0;
    measureTicker();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureTicker);
  }

  let parEls = [];
  const tk = { el: null, x: 0, half: 0, dir: 1, v: 0 };
  const sFx = { x: 0, y: 0, tx: 0, ty: 0, lastY: 0, on: false };
  const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function measureTicker() { if (tk.el) tk.half = tk.el.scrollWidth / 2; }
  function countUp(el) {
    const n = parseFloat(el.dataset.count), o = { v: 0 }, out = $('.dn', el) || el;
    let done = false;
    tw(o, { v: n }, { duration: 1.9, ease: 'out4' }).then(() => { done = true; out.textContent = String(n); });
    (function up() { if (done) return; out.textContent = String(Math.round(o.v)); requestAnimationFrame(up); })();
  }
  function updatePar() {
    const vh = window.innerHeight;
    for (let i = 0; i < parEls.length; i++) {
      const o = parEls[i], pr = (o.el.parentElement || o.el).getBoundingClientRect();
      if (pr.bottom < -300 || pr.top > vh + 300) continue;
      o.el.style.translate = `0 ${(-(pr.top + pr.height / 2 - vh / 2) * o.f).toFixed(1)}px`;
    }
  }
  // per-frame site effects: ticker reacts to scroll speed, soft cursor glow, magnetic buttons
  const mags = new Map();
  function siteFrame(now, dt) {
    const y = window.scrollY, sec = dt / 1000;
    const vel = (y - sFx.lastY) / Math.max(sec, 0.001); sFx.lastY = y;
    tk.v += (vel - tk.v) * 0.12;
    if (tk.el && tk.half) {
      if (Math.abs(tk.v) > 30) tk.dir = tk.v > 0 ? 1 : -1;
      tk.x += (REDUCED ? 0 : (46 + Math.min(Math.abs(tk.v), 3200) * 0.22)) * tk.dir * sec;
      tk.x = ((tk.x % tk.half) + tk.half) % tk.half;
      tk.el.style.transform = `translate3d(${(-tk.x).toFixed(1)}px,0,0) skewX(${clamp(-tk.v * 0.004, -9, 9).toFixed(2)}deg)`;
    }
    const sp = $('.sspot');
    if (sp) {
      sFx.x += (sFx.tx - sFx.x) * 0.08; sFx.y += (sFx.ty - sFx.y) * 0.08;
      sp.style.transform = `translate3d(${sFx.x.toFixed(1)}px,${sFx.y.toFixed(1)}px,0)`;
    }
    mags.forEach((m, el) => {
      m.x += (m.tx - m.x) * 0.16; m.y += (m.ty - m.y) * 0.16;
      el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      if (!m.tx && !m.ty && Math.abs(m.x) < 0.05 && Math.abs(m.y) < 0.05) { el.style.translate = ''; mags.delete(el); }
    });
  }
  if (fine) {
    document.addEventListener('pointermove', (e) => {
      sFx.tx = e.clientX; sFx.ty = e.clientY;
      const t = e.target && e.target.closest ? e.target : null;
      const el = t && t.closest('.btn, .deal-pill, .chip, .cart-pill');
      mags.forEach((m, k) => { if (k !== el) { m.tx = 0; m.ty = 0; } });
      if (el) {
        const r = el.getBoundingClientRect();
        let m = mags.get(el); if (!m) { m = { x: 0, y: 0, tx: 0, ty: 0 }; mags.set(el, m); }
        m.tx = (e.clientX - (r.left + r.width / 2)) * 0.2; m.ty = (e.clientY - (r.top + r.height / 2)) * 0.28;
      }
      // 3D tilt + light on product tiles
      const ci = t && t.closest('.card-img');
      if (ci) {
        const r = ci.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ci.style.setProperty('--rx', ((0.5 - py) * 9).toFixed(2) + 'deg');
        ci.style.setProperty('--ry', ((px - 0.5) * 11).toFixed(2) + 'deg');
        ci.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        ci.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      }
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const ci = e.target && e.target.closest && e.target.closest('.card-img');
      if (ci && !ci.contains(e.relatedTarget)) { ci.style.setProperty('--rx', '0deg'); ci.style.setProperty('--ry', '0deg'); }
    });
  }

  // hero ↔ page: the hero stays fixed and fades while the shop slides over it
  let navIds = [], scrollTick = false;
  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      const y = window.scrollY, h = L.H || window.innerHeight, p = clamp(y / h, 0, 1);
      S.hidden = p >= 1;
      const a = els.app.style;
      if (p > 0) { a.transform = `translate3d(0,${(-p * 70).toFixed(1)}px,0) scale(${(1 - p * 0.06).toFixed(4)})`; a.opacity = (1 - p * 0.9).toFixed(3); } else { a.transform = ''; a.opacity = ''; }
      a.visibility = S.hidden ? 'hidden' : '';
      $('#snav').classList.toggle('on', y > h * 0.6);
      const dh = document.documentElement.scrollHeight - window.innerHeight;
      $('#snav').style.setProperty('--sp', dh > 0 ? (y / dh).toFixed(4) : 0);
      const fl = $('#sfx'); if (fl) fl.classList.toggle('on', y > h * 0.55);
      if (parEls.length) updatePar();
      let cur = '';
      navIds.forEach((id) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = id; });
      $$('#snavLinks a').forEach((l) => l.classList.toggle('on', l.dataset.go === cur));
    });
  }

  /* ------------------------------------------------------------ animated background */
  const BG = Object.assign({ marquee: [], particles: 0, orbs: true, spotlight: true, badge: '', badgeCenter: '' }, C.background || {});
  const fx = { ready: false, rows: [], parts: [], ctx: null, cw: 0, ch: 0, dpr: 1, spot: { x: 0, y: 0, tx: 0, ty: 0 }, badgeRot: 0, lastM: 0, dust: '255,255,255' };

  function fxInit() {
    fx.ready = true;
    fx.dust = (getComputedStyle(document.documentElement).getPropertyValue('--dust') || '255,255,255').trim();
    if (!BG.orbs) $('#orbs').style.display = 'none';
    // moving words
    const mq = $('#marquee');
    (BG.marquee || []).forEach((txt, r) => {
      const row = mk('div', 'mq-row' + (r % 2 ? ' fill' : ''));
      row.dataset.txt = txt;
      mq.appendChild(row);
      fx.rows.push({ el: row, x: Math.random() * 400, dir: r % 2 ? 1 : -1, speed: 20 + r * 8, unit: 1 });
    });
    // rotating badge
    if (BG.badge) {
      let t = BG.badge;
      while (t.length < 30) t += BG.badge;
      $('#badgeTxt').textContent = t;
      $('#badgeC').textContent = BG.badgeCenter || '';
    } else $('#badge').style.display = 'none';
    // spotlight
    fx.spotEl = BG.spotlight ? $('#spot') : null;
    if (!BG.spotlight) $('#spot').style.display = 'none';
    fx.spot.x = fx.spot.tx = L.W / 2; fx.spot.y = fx.spot.ty = L.H / 2;
    // dust
    fx.cv = $('#fx');
    fx.ctx = fx.cv.getContext('2d');
    const n = BG.particles | 0;
    for (let i = 0; i < n; i++) {
      const bokeh = i % 11 === 0;
      const z = 0.25 + Math.random() * 0.75;
      fx.parts.push({ x: Math.random(), y: Math.random(), z, bokeh, r: bokeh ? (14 + Math.random() * 30) * z : (0.6 + Math.random() * 1.5) * (0.6 + z * 0.6), vx: (Math.random() - 0.5) * 8, vy: -(4 + Math.random() * 12), ph: Math.random() * 6.28 });
    }
    fxLayout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fxLayout);
  }
  function fxLayout() {
    if (!fx.ready) return;
    fx.dpr = Math.min(window.devicePixelRatio || 1, 2);
    fx.cw = L.W; fx.ch = L.H;
    fx.cv.width = Math.round(L.W * fx.dpr); fx.cv.height = Math.round(L.H * fx.dpr);
    const n = fx.rows.length;
    fx.rows.forEach((r, i) => {
      r.el.style.top = (L.mobile ? 12 + i * (66 / n) : 9 + i * (78 / n)) + '%';
      r.el.innerHTML = '';
      const u = mk('span'); u.textContent = r.el.dataset.txt + ' —';
      r.el.appendChild(u);
      r.unit = Math.max(40, u.getBoundingClientRect().width);
      const copies = Math.ceil((L.W + r.unit * 2) / r.unit);
      for (let k = 1; k < copies; k++) r.el.appendChild(u.cloneNode(true));
    });
  }
  function fxFrame(now, dt) {
    const sec = dt / 1000;
    const burst = Math.abs(S.m - fx.lastM) / Math.max(sec, 0.001);
    fx.lastM = S.m;
    const calm = REDUCED ? 0 : 1;
    // words
    fx.rows.forEach((r) => {
      r.x += (r.speed * calm + (-S.sway) * r.dir * 130 + burst * 260) * sec;
      const x = ((r.x % r.unit) + r.unit) % r.unit;
      const tx = r.dir < 0 ? -x : x - r.unit;
      r.el.style.transform = `translate3d(${(tx - Pt.x * 14).toFixed(1)}px,${(-Pt.y * 8).toFixed(1)}px,0)`;
    });
    // badge
    if (BG.badge) { fx.badgeRot += (16 * calm + Math.abs(S.sway) * 80 + burst * 200) * sec; $('#badgeSvg').style.transform = `rotate(${fx.badgeRot.toFixed(2)}deg)`; }
    // spotlight
    if (fx.spotEl) {
      fx.spot.x += (fx.spot.tx - fx.spot.x) * 0.08; fx.spot.y += (fx.spot.ty - fx.spot.y) * 0.08;
      fx.spotEl.style.transform = `translate3d(${fx.spot.x.toFixed(1)}px,${fx.spot.y.toFixed(1)}px,0)`;
    }
    // dust
    const ctx = fx.ctx;
    if (!ctx || !fx.parts.length) return;
    ctx.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0);
    ctx.clearRect(0, 0, fx.cw, fx.ch);
    const wind = -S.sway * 70 + burst * 40;
    for (let i = 0; i < fx.parts.length; i++) {
      const p = fx.parts[i];
      if (calm) {
        p.x += ((p.vx + wind) * p.z * sec) / fx.cw;
        p.y += (p.vy * p.z * sec) / fx.ch;
        if (p.x < -0.05) p.x += 1.1; else if (p.x > 1.05) p.x -= 1.1;
        if (p.y < -0.05) p.y += 1.1; else if (p.y > 1.05) p.y -= 1.1;
      }
      const px = p.x * fx.cw + Pt.x * 34 * p.z, py = p.y * fx.ch + Pt.y * 20 * p.z;
      const tw = 0.55 + 0.45 * Math.sin(now * 0.0016 + p.ph);
      const a = p.bokeh ? 0.025 + 0.03 * tw : (0.1 + 0.45 * p.z) * tw;
      ctx.fillStyle = `rgba(${fx.dust},${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(px, py, p.r, 0, 6.2832); ctx.fill();
    }
  }

  /* ------------------------------------------------------------ boot */
  function preload() {
    const srcs = [];
    P.forEach((p) => { p.colors.forEach((c) => { if (c.image) srcs.push(c.image); if (c.back) srcs.push(c.back); }); if (p.image) srcs.push(p.image); });
    const uniq = Array.from(new Set(srcs));
    return Promise.race([
      Promise.all(uniq.map((src) => new Promise((res) => {
        const im = new Image();
        im.onload = () => { imgDims[src] = { w: im.naturalWidth, h: im.naturalHeight }; res(); };
        im.onerror = () => res();
        im.src = src;
      }))),
      wait(7000)
    ]);
  }

  async function boot() {
    $('#ldBrand').innerHTML = brandHtml();
    requestAnimationFrame(frame);
    const counting = tw(loader, { v: 100 }, { duration: 1.5, ease: 'io3' });
    await Promise.all([preload(), counting]);
    buildItems();
    wire();
    layout();
    buildSite();
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    fxInit();
    S.pos = 0; S.lastPos = 0;
    $('#loader').classList.add('done');
    S.ready = true;
    await wait(380);
    document.body.classList.remove('is-loading');

    // intro: chrome
    $$('.ui').forEach((e, k) => e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: 300 + k * 60, easing: EASE_OUT, fill: 'backwards' }));
    swap(els.topA, esc((HERO.top || [])[0]), 1, 300);
    swap(els.topB, esc((HERO.top || [])[1]), 1, 380);
    $$('.cap .rvi').forEach((e, k) => e.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: 900, delay: 700 + k * 90, easing: EASE_OUT, fill: 'backwards' }));
    setFooter('hero', 1, 450);
    setGhost(HERO.ghost, 1, 100);

    // intro: pieces fly in, front piece first, then outwards
    items.forEach((it, i) => {
      const rank = Math.abs(wrapN(i - S.pos));
      tw(it, { intro: 1 }, { duration: 1.9, delay: 0.1 + rank * 0.16, ease: 'out4' });
    });
    await wait(900);
    S.lastInteract = nowMs();
    S.lastAuto = nowMs();
  }

  // autoplay while the visitor is idle on the hero
  setInterval(() => {
    if (!M.autoplay || REDUCED || !S.ready || S.mode !== 'hero' || S.busy || S.overlay || drag || document.hidden || window.scrollY > 40) return;
    const t = nowMs();
    if (t - Math.max(S.lastInteract, S.lastAuto) < M.autoplayDelay) return;
    S.lastAuto = t;
    spinBy(-1);
  }, 400);

  boot();
})();
