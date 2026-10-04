/* ==========================================================================
   NORTHLINE TECHNOLOGIES — immersive build
   Lenis (inertial scroll) + GSAP/ScrollTrigger (pins, scrub, reveals)
   Works from file://. Everything degrades to static content when
   prefers-reduced-motion is set or the libraries fail to load.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasLibs = !!(window.gsap && window.ScrollTrigger);
  var MOTION = hasLibs && !reduce;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lenis = null;

  if (!MOTION) doc.classList.remove('motion');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------------------------------------------------------------- clock */
  var clockEl = $('#clock');
  var fmt = null;
  try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Denver', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); } catch (e) {}
  function tickClock() {
    if (!clockEl) return;
    var d = new Date(), s;
    if (fmt) s = fmt.format(d); else s = d.toTimeString().slice(0, 8);
    clockEl.textContent = s;
  }
  tickClock(); setInterval(tickClock, 1000);

  /* ------------------------------------------------------ nav + progress */
  var header = $('#nav'), hero = $('#hero'), hudIndex = $('.hud-index');
  var progressBar = $('#progressBar'), hudPct = $('#hudPct');
  var lastY = 0, ticking = false, menuOpen = false;
  function onScrollFrame() {
    ticking = false;
    var y = window.pageYOffset || doc.scrollTop || 0;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var p = clamp(y / max, 0, 1);
    if (progressBar) progressBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (hudPct) hudPct.textContent = ('00' + Math.round(p * 100)).slice(-3);
    var heroH = hero ? hero.offsetHeight : 700;
    header.classList.toggle('is-solid', y > heroH - 140);
    if (hudIndex) hudIndex.classList.toggle('is-off', y < heroH - window.innerHeight * 0.45);
    var dy = y - lastY;
    if (!menuOpen && !reduce) {
      if (y > 260 && dy > 6) header.classList.add('is-hidden');
      else if (dy < -4 || y < 120) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); } }, { passive: true });
  window.addEventListener('resize', onScrollFrame);
  onScrollFrame();

  /* ------------------------------------------------- section index (HUD) */
  var hudNum = $('#hudNum'), hudLabel = $('#hudLabel'), rail = $('#rail');
  var railLinks = $$('#rail a');
  function setIndex(sec) {
    var n = parseInt(sec.getAttribute('data-index'), 10) || 1;
    if (hudNum) hudNum.textContent = ('0' + n).slice(-2);
    if (hudLabel) hudLabel.textContent = sec.getAttribute('data-label') || '';
    railLinks.forEach(function (a) { a.classList.toggle('is-active', parseInt(a.getAttribute('data-i'), 10) === n); });
    var light = sec.id === 'sectors';
    if (rail) rail.classList.toggle('on-light', light);
    if (hudIndex) hudIndex.classList.toggle('on-light', light);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setIndex(e.target); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    $$('[data-index]').forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------ mobile menu */
  var menuBtn = $('#menuBtn'), menu = $('#menu');
  function setMenu(open) {
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) header.classList.remove('is-hidden');
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    else document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var f = $('.menu__nav a', menu); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 400); }
  }
  menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
  window.addEventListener('resize', function () { if (menuOpen && window.innerWidth >= 900) setMenu(false); });

  /* --------------------------------------------------------- anchor links */
  var EASE_EXPO = function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); };
  function goTo(hash) {
    var el = hash === '#top' ? null : $(hash);
    if (hash !== '#top' && !el) return;
    if (lenis) {
      if (hash === '#top') lenis.scrollTo(0, { duration: 1.8, easing: EASE_EXPO });
      else lenis.scrollTo(el, { duration: 1.8, easing: EASE_EXPO, offset: 0 });
    } else if (hash === '#top') window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (!h || h === '#') return;
    e.preventDefault();
    var wasOpen = menuOpen;
    if (wasOpen) setMenu(false);
    setTimeout(function () { goTo(h); }, wasOpen ? 120 : 0);
  });

  /* ------------------------------------------------------- hero ridge canvas */
  var Ridge = (function () {
    var canvas = $('#ridge');
    if (!canvas || !canvas.getContext) return { start: function () {}, setScroll: function () {} };
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, running = false, raf = 0, t0 = performance.now();
    var mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5, sp = 0, inView = true;
    var peak = { x: 0, y: 0, ready: false };
    var LINES = window.innerWidth < 700 ? 20 : 30;
    function h1(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
    function h2(x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
    function vn(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    function ridge(x, y) {
      var n = vn(x, y) * 0.6 + vn(x * 2.1 + 5.2, y * 1.7) * 0.28 + vn(x * 4.3 + 1.3, y * 2.9) * 0.12;
      var r = 1 - Math.abs(n * 2 - 1);
      return Math.pow(r, 1.7);
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!running) draw(performance.now());
    }
    function draw(now) {
      var t = (now - t0) / 1000;
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      ctx.clearRect(0, 0, W, H);
      var y0 = H * 0.36, y1 = H * 0.99, gap = (y1 - y0) / LINES;
      var step = W < 700 ? 8 : 6;
      var accentI = Math.round(LINES * 0.55), best = 1e9, bx = 0;
      for (var i = 0; i < LINES; i++) {
        var p = i / (LINES - 1);
        var base = y0 + (y1 - y0) * Math.pow(p, 1.12) - sp * H * 0.05 * (0.4 + p);
        var amp = H * (0.05 + 0.17 * p) * (1 + (0.5 - my) * 0.35);
        var freq = (1.4 + p * 1.3) / Math.max(W, 900) * 1000 / 1000;
        var xo = t * (0.018 + 0.03 * p) + sp * 0.9 + (mx - 0.5) * 0.5 * (0.3 + p);
        ctx.beginPath();
        var first = true, lx = 0, ly = 0;
        for (var x = -step; x <= W + step; x += step) {
          var nx = (x / W) * 2.6 * (0.7 + p * 0.9) + xo;
          var y = base - amp * ridge(nx, i * 0.42 + t * 0.03);
          if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
          lx = x; ly = y;
          if (i === accentI && y < best) { best = y; bx = x; }
        }
        // occlusion strip so nearer ridges sit in front
        ctx.lineTo(lx, base + gap * 2.4); ctx.lineTo(-step, base + gap * 2.4); ctx.closePath();
        ctx.fillStyle = 'rgba(10,14,20,' + (0.42 + 0.3 * p).toFixed(3) + ')';
        ctx.fill();
        // stroke only the ridge line
        ctx.beginPath(); first = true;
        for (x = -step; x <= W + step; x += step) {
          nx = (x / W) * 2.6 * (0.7 + p * 0.9) + xo;
          y = base - amp * ridge(nx, i * 0.42 + t * 0.03);
          if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
        }
        if (i === accentI) { ctx.strokeStyle = 'rgba(46,124,246,.8)'; ctx.lineWidth = 1.4; }
        else { ctx.strokeStyle = 'rgba(245,247,250,' + (0.05 + 0.2 * Math.pow(p, 1.4)).toFixed(3) + ')'; ctx.lineWidth = 1; }
        ctx.stroke();
      }
      // peak marker on the accent ridge
      if (!peak.ready) { peak.x = bx; peak.y = best; peak.ready = true; }
      peak.x += (bx - peak.x) * 0.04; peak.y += (best - peak.y) * 0.04;
      if (W > 760) {
        ctx.strokeStyle = 'rgba(245,247,250,.55)'; ctx.fillStyle = 'rgba(245,247,250,.8)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(peak.x, peak.y, 4, 0, 6.2832); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(peak.x, peak.y - 6); ctx.lineTo(peak.x, peak.y - 46); ctx.lineTo(peak.x + 22, peak.y - 46); ctx.stroke();
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillText('FRANKLIN MTNS', peak.x + 28, peak.y - 43);
        ctx.fillStyle = 'rgba(138,148,163,.9)';
        ctx.fillText('EL PASO, TX', peak.x + 28, peak.y - 30);
      }
    }
    function loop(now) {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function play() { if (running || reduce || !inView || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
    function pause() { running = false; cancelAnimationFrame(raf); }
    function start() {
      resize();
      if (reduce) { draw(performance.now() + 4000); return; }
      play();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { inView = en[0].isIntersecting; inView ? play() : pause(); }).observe(hero);
      }
      document.addEventListener('visibilitychange', function () { document.hidden ? pause() : play(); });
      if (hero) hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tmx = clamp((e.clientX - r.left) / r.width, 0, 1); tmy = clamp((e.clientY - r.top) / r.height, 0, 1);
      }, { passive: true });
    }
    if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); }).observe(canvas); else window.addEventListener('resize', resize);
    return { start: start, setScroll: function (v) { sp = v; } };
  })();

  /* hero reticle follows pointer (desktop) */
  (function () {
    var ret = $('#reticle'), txt = $('#reticleTxt');
    if (!ret || !fine || reduce) return;
    var rx = 0, ry = 0, tx = 0, ty = 0, raf = 0;
    hero.addEventListener('pointerenter', function () { hero.classList.add('is-hover'); });
    hero.addEventListener('pointerleave', function () { hero.classList.remove('is-hover'); });
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(upd);
    }, { passive: true });
    function upd() {
      raf = 0; rx += (tx - rx) * 0.2; ry += (ty - ry) * 0.2;
      ret.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      txt.textContent = 'X ' + ('000' + Math.round(rx)).slice(-4) + ' / Y ' + ('000' + Math.round(ry)).slice(-4);
      if (Math.abs(tx - rx) > 0.5 || Math.abs(ty - ry) > 0.5) raf = requestAnimationFrame(upd);
    }
  })();

  /* ------------------------------------------------------------- cursor */
  (function () {
    if (!fine || reduce) return;
    var cur = $('#cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('#cursorLabel');
    if (!cur) return;
    doc.classList.add('has-cursor');
    var x = -100, y = -100, rx = -100, ry = -100, started = false;
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!started) { started = true; rx = x; ry = y; requestAnimationFrame(loop); }
    }, { passive: true });
    function loop() {
      rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    }
    document.addEventListener('pointerover', function (e) {
      var t = e.target;
      var lab = t.closest && t.closest('[data-cursor]');
      var link = t.closest && t.closest('a,button,[data-magnetic]');
      cur.classList.toggle('is-label', !!lab);
      if (lab) label.textContent = lab.getAttribute('data-cursor').toUpperCase();
      cur.classList.toggle('is-link', !!link && !lab);
    });
    document.addEventListener('pointerleave', function () { cur.style.opacity = 0; });
    document.addEventListener('pointerenter', function () { cur.style.opacity = 1; });
  })();

  /* ============================================================ MOTION */
  function splitWords(el, mask) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.nodeValue.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            if (mask) {
              w.className = 'w';
              var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = p; w.appendChild(wi); words.push(wi);
            } else { w.className = 'mw'; w.textContent = p; words.push(w); }
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
    return words;
  }
  function lineDelays(words, perLine, perWord) {
    var tops = [], idx = [], count = {};
    words.forEach(function (w, i) {
      var t = Math.round(w.parentNode.getBoundingClientRect().top / 8);
      var li = tops.indexOf(t); if (li < 0) { tops.push(t); li = tops.length - 1; }
      idx[i] = li; count[li] = (count[li] || 0);
      idx[i] = [li, count[li]++];
    });
    return idx.map(function (p) { return p[0] * perLine + p[1] * perWord; });
  }
  function fmtCount(el, v) {
    var pad = parseInt(el.getAttribute('data-pad') || '0', 10), suffix = el.getAttribute('data-suffix') || '';
    var out = String(Math.round(v));
    while (out.length < pad) out = '0' + out;
    return out + suffix;
  }
  function animateCount(el, delay, trigger) {
    var n = parseFloat(el.getAttribute('data-n') || '0'), o = { v: 0 };
    el.textContent = fmtCount(el, 0);
    var tw = gsap.to(o, { v: n, duration: 1.8, delay: delay || 0, ease: 'power2.out', paused: !!trigger, onUpdate: function () { el.textContent = fmtCount(el, o.v); }, onComplete: function () { el.textContent = fmtCount(el, n); } });
    if (trigger) ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { tw.play(); } });
    return tw;
  }

  function initMotion() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    /* Lenis */
    if (window.Lenis) {
      lenis = new Lenis({ duration: 1.15, easing: EASE_EXPO, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }

    /* split text (before any ScrollTrigger measures layout) */
    var heroTitle = $('#heroTitle');
    var heroWords = splitWords(heroTitle, true);
    var splits = $$('[data-split]').filter(function (e) { return e !== heroTitle; }).map(function (el) {
      return { el: el, words: splitWords(el, true) };
    });
    gsap.set(heroWords, { yPercent: 115 });
    splits.forEach(function (s) { gsap.set(s.words, { yPercent: 115 }); });
    heroTitle.classList.add('is-split');
    splits.forEach(function (s) { s.el.classList.add('is-split'); });
    var missionWords = splitWords($('#missionText'), false);

    /* magnetic buttons */
    if (fine) {
      $$('[data-magnetic]').forEach(function (el) {
        var inner = $('span', el) || el;
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          gsap.to(el, { x: dx * 0.28, y: dy * 0.34, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
          if (inner !== el) gsap.to(inner, { x: dx * 0.08, y: dy * 0.1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        });
        el.addEventListener('pointerleave', function () {
          gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.4)', overwrite: 'auto' });
          if (inner !== el) gsap.to(inner, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,.4)', overwrite: 'auto' });
        });
      });
    }

    /* capability scenes: draw-in + ambient loops */
    var steps = $$('.cap-step');
    var loops = steps.map(function (s) { return makeLoop(s); });
    function makeLoop(step) {
      var tws = [];
      var scan = $('.scan', step), sweep = $('.sweep', step), ph = $('.playhead', step);
      if (scan) tws.push(gsap.fromTo(scan, { y: 0 }, { y: 330, duration: 3.2, ease: 'power1.inOut', repeat: -1, yoyo: true, paused: true }));
      $$('.funnel-dots circle', step).forEach(function (c, i) {
        var cx = parseFloat(c.getAttribute('cx'));
        tws.push(gsap.fromTo(c, { x: 0, y: 0, opacity: 1 }, { x: (320 - cx) * 0.82, y: 330, opacity: 0.1, duration: 2.6 + (i % 3) * 0.4, delay: i * 0.35, ease: 'power1.in', repeat: -1, paused: true }));
      });
      var fr = $('.funnel-ring', step);
      if (fr) tws.push(gsap.fromTo(fr, { scale: 1, opacity: 0.9, svgOrigin: '320 412' }, { scale: 3.2, opacity: 0, svgOrigin: '320 412', duration: 1.8, ease: 'power1.out', repeat: -1, paused: true }));
      if (sweep) tws.push(gsap.to(sweep, { rotation: 360, svgOrigin: '320 240', duration: 5.5, ease: 'none', repeat: -1, paused: true }));
      $$('.pulse', step).forEach(function (c, i) {
        var o = c.getAttribute('cx') + ' ' + c.getAttribute('cy');
        tws.push(gsap.fromTo(c, { scale: 1, opacity: 0.9, svgOrigin: o }, { scale: 4.5, opacity: 0, svgOrigin: o, duration: 2, delay: i * 0.6, ease: 'power1.out', repeat: -1, paused: true }));
      });
      if (ph) tws.push(gsap.fromTo(ph, { x: 0 }, { x: 520, duration: 7, ease: 'none', repeat: -1, paused: true }));
      return { play: function () { tws.forEach(function (t) { t.play(); }); }, pause: function () { tws.forEach(function (t) { t.pause(); }); } };
    }
    function drawScene(step, delay) {
      var d = $$('[data-draw]', step);
      gsap.fromTo(d, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.05, delay: delay || 0, overwrite: true });
    }

    /* ---------- responsive builder: pins FIRST (page order), everything else after */
    var mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 900px) and (min-height: 620px)', mob: '(max-width: 899px), (max-height: 619px)' }, function (ctx) {
      var desk = !!ctx.conditions.desk;
      var N = steps.length, cur = 0;
      var reelTween = null, capST = null;

      /* ---- PINS ---- */
      if (desk) {
        doc.classList.add('pin', 'reel-on');
        /* mission: pinned, words fill in with scroll */
        var mTl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.mission__stage', start: 'top top', end: '+=140%', pin: true, scrub: 0.6, anticipatePin: 1 } });
        mTl.to(missionWords, { opacity: function (i, el) { return el.closest('.ghost') ? 0.62 : 1; }, duration: 1, stagger: 0.09 });
        mTl.to('.mission__terrain', { yPercent: -14, duration: 1 + 0.09 * missionWords.length }, 0);

        /* capabilities: pinned scrollytelling */
        steps.forEach(function (s, i) { if (i) gsap.set($$('[data-in]', s), { autoAlpha: 0 }); });
        var buttons = $$('#capIndex button'), prog = $('#capProg');
        function setBtn(i) { buttons.forEach(function (b, k) { b.classList.toggle('is-active', k === i); }); }
        setBtn(0); drawScene(steps[0], 0.2); loops[0].play();
        function switchTo(i) {
          var from = steps[cur], to = steps[i], dir = i > cur ? 1 : -1;
          var outEls = $$('[data-in]', from), inAll = $$('[data-in]', to);
          var vis = $('.cap-visual', to), inEls = inAll.filter(function (e) { return e !== vis; });
          gsap.killTweensOf(outEls); gsap.killTweensOf(inAll); gsap.killTweensOf($('svg', to));
          gsap.to(outEls, { y: -44 * dir, autoAlpha: 0, duration: 0.42, ease: 'power2.in', stagger: 0.03, overwrite: true });
          loops[cur].pause();
          gsap.fromTo(inEls, { y: 56 * dir, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.32, overwrite: true });
          gsap.fromTo(vis, { autoAlpha: 0, clipPath: 'inset(0% 0% 100% 0%)', y: 0 }, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power3.inOut', delay: 0.32, overwrite: true, onComplete: function () { gsap.set(vis, { clearProps: 'clipPath' }); } });
          gsap.fromTo($('svg', to), { scale: 1.06 }, { scale: 1, duration: 1.4, ease: 'power3.out', delay: 0.32 });
          drawScene(to, 0.6); loops[i].play();
          cur = i; setBtn(i);
        }
        capST = ScrollTrigger.create({
          trigger: '#capsStage', start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 0.95 * N); },
          pin: true, anticipatePin: 1,
          onUpdate: function (self) {
            if (prog) prog.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
            var i = clamp(Math.floor(self.progress * N), 0, N - 1);
            if (i !== cur) switchTo(i);
          }
        });
        buttons.forEach(function (b) {
          b.addEventListener('click', function () {
            var i = parseInt(b.getAttribute('data-go'), 10);
            var y = capST.start + ((i + 0.5) / N) * (capST.end - capST.start);
            if (lenis) lenis.scrollTo(y, { duration: 1.4, easing: EASE_EXPO }); else window.scrollTo({ top: y, behavior: 'smooth' });
          });
        });

        /* sectors: horizontal reel */
        var reel = $('#reel'), track = $('#reelTrack'), rBar = $('#reelBar'), rCount = $('#reelCount');
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        reelTween = gsap.to(track, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: {
            trigger: reel, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: function (self) {
              rBar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
              rCount.textContent = '0' + (Math.min(4, Math.floor(self.progress * 3.999) + 1)) + '/04';
            }
          }
        });
      } else {
        /* stacked fallback: mission words scrub without pin */
        gsap.to(missionWords, {
          opacity: function (i, el) { return el.closest('.ghost') ? 0.62 : 1; }, ease: 'none', stagger: 0.09, duration: 1,
          scrollTrigger: { trigger: '#missionText', start: 'top 82%', end: 'bottom 55%', scrub: 0.5 }
        });
        steps.forEach(function (s, i) {
          var ins = $$('[data-in]', s);
          gsap.set(ins, { autoAlpha: 0 });
          ScrollTrigger.create({
            trigger: s, start: 'top 78%', end: 'bottom 20%',
            onEnter: function () { gsap.to(ins, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }); drawScene(s, 0.2); loops[i].play(); },
            onEnterBack: function () { loops[i].play(); },
            onLeave: function () { loops[i].pause(); },
            onLeaveBack: function () { loops[i].pause(); }
          });
          gsap.set(ins, { y: 30 });
        });
        /* reel cards stack with reveals */
        $$('.rpanel').forEach(function (p) {
          var kids = $$('.rcard__media, .rcard__body > *, .tag, .h-section, .rpanel__lede, .rpanel__big, .btn', p);
          gsap.set(kids, { autoAlpha: 0, y: 34 });
          ScrollTrigger.create({ trigger: p, start: 'top 80%', once: true, onEnter: function () { gsap.to(kids, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out' }); } });
        });
        $$('.rcard__media img').forEach(function (img) {
          gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      }

      /* ---- NON-PIN TRIGGERS (after pins) ---- */
      /* hero parallax / choreography */
      var heroTl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: function (s) { Ridge.setScroll(s.progress); } } });
      heroTl.to('.hero__photo', { yPercent: 16, scale: 1.1 }, 0)
            .to('#ridge', { yPercent: 7 }, 0)
            .to('#heroGrid', { yPercent: 4 }, 0)
            .to('#heroInner', { y: -80, opacity: 0.08, ease: 'power1.in' }, 0)
            .to('.scroll-cue', { opacity: 0 }, 0)
            .to('.telemetry', { opacity: 0.2 }, 0.3);

      /* split headings */
      splits.forEach(function (s) {
        ScrollTrigger.create({
          trigger: s.el, start: 'top 88%', once: true,
          onEnter: function () {
            var d = lineDelays(s.words, 0.13, 0.035);
            gsap.to(s.words, { yPercent: 0, duration: 1.15, ease: 'power4.out', delay: function (i) { return d[i]; } });
          }
        });
      });
      /* generic fades */
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 90%', once: true,
        onEnter: function (b) { gsap.fromTo(b, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.09, ease: 'power3.out' }); }
      });
      /* counters (hero ones run in the intro) */
      $$('.count').forEach(function (el) { if (!el.closest('.hero')) animateCount(el, 0, true); });

      /* operations */
      gsap.fromTo('.ops__bg', { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.ops', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to('.map-contours', { x: -60, ease: 'none', scrollTrigger: { trigger: '#map', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('#hq-ring', { scale: 0.6, opacity: 0.8, svgOrigin: '260 352' }, { scale: 1.7, opacity: 0, svgOrigin: '260 352', duration: 2.2, repeat: -1, ease: 'power1.out' });
      (function mapScrub() {
        var a1 = $('#arc1'), a2 = $('#arc2'), pk = $('#packet'), nB = $('#nodeBliss'), nD = $('#nodeDallas'), nW = $('#nodeDC');
        var L1 = a1.getTotalLength(), L2 = a2.getTotalLength(), o = { a: 0 };
        function render() {
          var a = o.a, f1 = clamp(a * 2, 0, 1), f2 = clamp(a * 2 - 1, 0, 1);
          a1.style.strokeDashoffset = 1 - f1; a2.style.strokeDashoffset = 1 - f2;
          var pt = a < 0.5 ? a1.getPointAtLength(L1 * f1) : a2.getPointAtLength(L2 * f2);
          pk.setAttribute('cx', pt.x); pk.setAttribute('cy', pt.y);
          pk.style.opacity = (a <= 0.001 || a >= 0.999) ? 0 : 1;
          nB.style.opacity = a > 0.04 ? 1 : 0; nD.style.opacity = a > 0.48 ? 1 : 0; nW.style.opacity = a > 0.96 ? 1 : 0;
        }
        [nB, nD, nW].forEach(function (n) { n.style.transition = 'opacity .6s ease'; });
        render();
        gsap.to(o, { a: 1, ease: 'none', onUpdate: render, scrollTrigger: { trigger: '#map', start: 'top 72%', end: 'bottom 42%', scrub: 0.5 } });
      })();

      /* sectors: wipe from dark to light */
      var sec = $('#sectors');
      gsap.fromTo(sec, { clipPath: 'inset(12vh 5vw 0vh 5vw round 28px)' }, {
        clipPath: 'inset(0vh 0vw 0vh 0vw round 0px)', ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 12%', scrub: true, onLeave: function () { gsap.set(sec, { clearProps: 'clipPath' }); } }
      });
      if (desk && reelTween) {
        $$('.rcard__media').forEach(function (m) {
          gsap.fromTo($('.rcard__img', m), { x: -60 }, { x: 60, ease: 'none', scrollTrigger: { trigger: m, containerAnimation: reelTween, start: 'left right', end: 'right left', scrub: true } });
          gsap.fromTo($('.rcard__nat', m), { x: -60 }, { x: 60, ease: 'none', scrollTrigger: { trigger: m, containerAnimation: reelTween, start: 'left right', end: 'right left', scrub: true } });
        });
      }

      /* careers: image frame grows to full-bleed */
      gsap.fromTo('#careersFrame', { clipPath: 'inset(12% 5% 0% 5% round 22px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: '#careersFrame', start: 'top 92%', end: 'top 18%', scrub: true }
      });
      gsap.fromTo('.careers__img', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '#careersFrame', start: 'top bottom', end: 'bottom top', scrub: true } });

      /* footer wordmark */
      gsap.fromTo('#wordmark span', { yPercent: 105 }, {
        yPercent: 0, ease: 'none', stagger: 0.06,
        scrollTrigger: { trigger: '#wordmark', start: 'top 105%', end: 'bottom 80%', scrub: 0.6 }
      });

      ScrollTrigger.refresh();
      return function () {
        doc.classList.remove('pin', 'reel-on');
        loops.forEach(function (l) { l.pause(); });
      };
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });

    /* ---------- intro sequence ---------- */
    var pre = $('#preloader'), plCount = $('#plCount'), plBar = $('#plBar');
    var heroDelays = lineDelays(heroWords, 0.14, 0.05);
    function heroIntro() {
      var tl = gsap.timeline();
      tl.fromTo('.hero__photo img', { scale: 1.3, opacity: 0 }, { scale: 1, opacity: 0.7, duration: 2.6, ease: 'power2.out' }, 0)
        .fromTo('#ridge', { opacity: 0 }, { opacity: 1, duration: 2, ease: 'power1.out' }, 0.2)
        .fromTo('#heroGrid', { opacity: 0 }, { opacity: 1, duration: 1.6 }, 0.5)
        .to(heroWords, { yPercent: 0, duration: 1.3, ease: 'power4.out', delay: function (i) { return heroDelays[i]; } }, 0.15)
        .fromTo('#hero [data-intro]', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09 }, 0.7)
        .fromTo('#nav', { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', clearProps: 'opacity,transform' }, 0.6)
        .add(function () { $$('.hero .count').forEach(function (el, i) { animateCount(el, 0.1 * i); }); }, 1.0);
      return tl;
    }
    var o = { v: 0 };
    var pl = gsap.timeline({ onComplete: function () { pre.style.display = 'none'; if (lenis) lenis.start(); ScrollTrigger.refresh(); } });
    pl.to(o, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: function () { plCount.textContent = ('00' + Math.round(o.v)).slice(-3); plBar.style.transform = 'scaleX(' + (o.v / 100) + ')'; } })
      .fromTo('.pl-path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut', stagger: 0.18 }, 0)
      .fromTo('.pl-path', { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.45, ease: 'power1.out', stagger: 0.1 }, 0.75)
      .to('.pl-path', { strokeOpacity: 0, duration: 0.3 }, 1.15)
      .to(pre, { yPercent: -100, duration: 0.95, ease: 'expo.inOut' }, '+=0.12')
      .add(heroIntro, '-=0.55');
    Ridge.start();
  }

  function boot() {
    if (!MOTION) {
      Ridge.start();
      var pre = $('#preloader'); if (pre) pre.style.display = 'none';
      return;
    }
    try { initMotion(); }
    catch (err) {
      if (window.console) console.error('[northline] motion init failed, falling back to static', err);
      doc.classList.remove('motion', 'pin', 'reel-on');
      var p = $('#preloader'); if (p) p.style.display = 'none';
      Ridge.start();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
