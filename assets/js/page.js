/* ==========================================================================
   NORTHLINE — inner pages choreography (capabilities / about / contact / capability statement)
   Lenis + GSAP/ScrollTrigger, same language as the home page, no pins (robust on iOS).
   Degrades to static content when reduced-motion is set or libraries fail.
   ========================================================================== */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var MOTION = !!(window.gsap && window.ScrollTrigger) && !reduce;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lenis = null;
  var arriving = doc.classList.contains('pt-in');
  var T0 = arriving ? 0.5 : 0.05;
  var EASE_EXPO = function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); };

  if (!MOTION) doc.classList.remove('motion');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  try { sessionStorage.setItem('nl-seen', '1'); } catch (e) {}

  /* clock */
  var clockEl = $('#clock'), fmt = null;
  try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Denver', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); } catch (e) {}
  function tick() { $$('[data-clock]').concat(clockEl ? [clockEl] : []).forEach(function (el) { el.textContent = fmt ? fmt.format(new Date()) : new Date().toTimeString().slice(0, 8); }); }
  tick(); setInterval(tick, 1000);

  /* nav + progress + HUD */
  var header = $('#nav'), hud = $('.hud-index'), progressBar = $('#progressBar'), hudPct = $('#hudPct');
  var lastY = 0, ticking = false, menuOpen = false;
  function frame() {
    ticking = false;
    var y = window.pageYOffset || doc.scrollTop || 0;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var p = clamp(y / max, 0, 1);
    if (progressBar) progressBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (hudPct) hudPct.textContent = ('00' + Math.round(p * 100)).slice(-3);
    header.classList.toggle('is-solid', y > 60);
    var dy = y - lastY;
    if (!menuOpen && !reduce) {
      if (y > 260 && dy > 6) header.classList.add('is-hidden');
      else if (dy < -4 || y < 120) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener('resize', frame);
  frame();

  var hudNum = $('#hudNum'), hudLabel = $('#hudLabel'), railLinks = $$('#rail a'), rail = $('#rail');
  function setIndex(sec) {
    var n = parseInt(sec.getAttribute('data-index'), 10) || 1;
    if (hudNum) hudNum.textContent = ('0' + n).slice(-2);
    if (hudLabel) hudLabel.textContent = sec.getAttribute('data-label') || '';
    railLinks.forEach(function (a) { a.classList.toggle('is-active', parseInt(a.getAttribute('data-i'), 10) === n); });
    if (hud) { hud.classList.add('is-tick'); setTimeout(function () { hud.classList.remove('is-tick'); }, 420); }
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) setIndex(e.target); }); }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    $$('[data-index]').forEach(function (s) { io.observe(s); });
  }

  /* capabilities sticky index highlight */
  var capLinks = $$('.capidx a');
  if (capLinks.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        capLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
        var act = $('.capidx a.is-active'); if (act && act.scrollIntoView && window.innerWidth < 900) { var box = act.parentNode; box.scrollLeft = act.offsetLeft - 20; }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    $$('.capx').forEach(function (s) { cio.observe(s); });
  }

  /* mobile menu */
  var menuBtn = $('#menuBtn'), menu = $('#menu');
  function setMenu(open) {
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) header.classList.remove('is-hidden');
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    if (open) { var f = $('.menu__nav a', menu); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 400); }
  }
  menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
  window.addEventListener('resize', function () { if (menuOpen && window.innerWidth >= 900) setMenu(false); });

  /* anchors */
  function goTo(hash) {
    var el = hash === '#top' ? null : $(hash);
    if (hash !== '#top' && !el) return;
    var off = $('.capidx') && hash !== '#top' ? -50 : 0;
    if (lenis) { if (!el) lenis.scrollTo(0, { duration: 1.6, easing: EASE_EXPO }); else lenis.scrollTo(el, { duration: 1.6, easing: EASE_EXPO, offset: off }); }
    else if (!el) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  window.NL = { goTo: goTo };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (!h || h === '#') return;
    e.preventDefault();
    var was = menuOpen; if (was) setMenu(false);
    setTimeout(function () { goTo(h); }, was ? 120 : 0);
  });

  /* cursor */
  (function () {
    if (!fine || reduce) return;
    var cur = $('#cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('#cursorLabel');
    if (!cur) return;
    doc.classList.add('has-cursor');
    var x = -100, y = -100, rx = -100, ry = -100, started = false;
    window.addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; if (!started) { started = true; rx = x; ry = y; requestAnimationFrame(loop); } }, { passive: true });
    function loop() {
      rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    }
    document.addEventListener('pointerover', function (e) {
      var t = e.target, lab = t.closest && t.closest('[data-cursor]'), link = t.closest && t.closest('a,button,label,[data-magnetic]');
      cur.classList.toggle('is-label', !!lab);
      if (lab) label.textContent = lab.getAttribute('data-cursor').toUpperCase();
      cur.classList.toggle('is-link', !!link && !lab);
    });
    document.addEventListener('pointerleave', function () { cur.style.opacity = 0; });
    document.addEventListener('pointerenter', function () { cur.style.opacity = 1; });
  })();

  /* ---------------- contact form → mailto (no backend) ---------------- */
  (function () {
    var form = $('#briefForm');
    if (!form) return;
    var TO = 'contact@bedrockdigital.io';
    var status = $('#formStatus'), pre = $('#formPre'), openA = $('#formOpen'), copyB = $('#formCopy');
    var q = {};
    (location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    if (q.topic) {
      $$('input[name="interest"]', form).forEach(function (i) { if (i.value === q.topic) i.checked = true; });
    }
    if (q.type) { $$('input[name="orgtype"]', form).forEach(function (i) { if (i.value === q.type) i.checked = true; }); }
    function val(n) { var el = form.elements[n]; return el && el.value ? el.value.trim() : ''; }
    function compose() {
      var interest = $$('input[name="interest"]:checked', form).map(function (i) { return i.getAttribute('data-label') || i.value; });
      var org = $$('input[name="orgtype"]:checked', form).map(function (i) { return i.getAttribute('data-label') || i.value; })[0] || '—';
      var subject = 'Northline briefing request — ' + (val('org') || val('name'));
      var body = [
        'Hello Northline team,', '',
        'I would like to schedule a briefing.', '',
        'Name: ' + val('name'),
        'Organization: ' + val('org'),
        'Organization type: ' + org,
        'Email: ' + val('email'),
        'Phone: ' + (val('phone') || '—'),
        'Interested in: ' + (interest.length ? interest.join(', ') : '—'), '',
        'What we need to grow, staff, or ship:', val('message'), '',
        '(Sent from the Northline Technologies website briefing form)'
      ].join('\n');
      return { subject: subject, body: body, href: 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body) };
    }
    function validate() {
      var ok = true, first = null;
      ['name', 'org', 'email', 'message'].forEach(function (n) {
        var el = form.elements[n], f = el.closest('.field'), v = el.value.trim();
        var bad = !v || (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        f.classList.toggle('is-bad', bad);
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) { ok = false; if (!first) first = el; }
      });
      if (first) first.focus();
      return ok;
    }
    $$('input,textarea', form).forEach(function (el) { el.addEventListener('input', function () { var f = el.closest('.field'); if (f) f.classList.remove('is-bad'); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (val('website')) return; // honeypot
      if (!validate()) return;
      var c = compose();
      pre.textContent = 'To: ' + TO + '\nSubject: ' + c.subject + '\n\n' + c.body;
      openA.setAttribute('href', c.href);
      status.classList.add('is-on');
      status.setAttribute('tabindex', '-1');
      status.focus({ preventScroll: true });
      if (lenis) lenis.scrollTo(status, { offset: -140, duration: 1 }); else status.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      window.location.href = c.href;
    });
    if (copyB) copyB.addEventListener('click', function () {
      var t = pre.textContent;
      function done() { copyB.textContent = 'COPIED'; setTimeout(function () { copyB.textContent = 'COPY MESSAGE'; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
      function fallback() { var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand('copy'); done(); } catch (e) {} }
    });
    $$('.copybtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-copy');
        function done() { var o = b.textContent; b.textContent = 'COPIED'; setTimeout(function () { b.textContent = o; }, 1500); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {}); 
      });
    });
  })();
  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

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
            if (mask) { w.className = 'w'; var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = p; w.appendChild(wi); words.push(wi); }
            else { w.className = 'mw'; w.textContent = p; words.push(w); }
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
      count[li] = count[li] || 0; idx[i] = [li, count[li]++];
    });
    return idx.map(function (p) { return p[0] * perLine + p[1] * perWord; });
  }
  function fmtCount(el, v) { var pad = parseInt(el.getAttribute('data-pad') || '0', 10), suffix = el.getAttribute('data-suffix') || ''; var out = String(Math.round(v)); while (out.length < pad) out = '0' + out; return out + suffix; }
  function animateCount(el) {
    var n = parseFloat(el.getAttribute('data-n') || '0'), o = { v: 0 };
    el.textContent = fmtCount(el, 0);
    var tw = gsap.to(o, { v: n, duration: 1.8, ease: 'power2.out', paused: true, onUpdate: function () { el.textContent = fmtCount(el, o.v); }, onComplete: function () { el.textContent = fmtCount(el, n); } });
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { tw.play(); } });
  }

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
    $$('.traveler', step).forEach(function (c) { tws.push(gsap.fromTo(c, { x: 0, y: 0 }, { x: parseFloat(c.getAttribute('data-x') || 0), y: parseFloat(c.getAttribute('data-y') || 0), duration: 3.2, ease: 'power1.inOut', repeat: -1, repeatDelay: 0.5, paused: true })); });
    return { play: function () { tws.forEach(function (t) { t.play(); }); }, pause: function () { tws.forEach(function (t) { t.pause(); }); } };
  }

  function initMotion() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (window.Lenis) {
      lenis = new Lenis({ duration: 1.15, easing: EASE_EXPO, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    var h1 = $('#pageTitle');
    var h1Words = h1 ? splitWords(h1, true) : [];
    var splits = $$('[data-split]').filter(function (e) { return e !== h1; }).map(function (el) { return { el: el, words: splitWords(el, true) }; });
    if (h1Words.length) { gsap.set(h1Words, { yPercent: 115 }); h1.classList.add('is-split'); }
    splits.forEach(function (s) { gsap.set(s.words, { yPercent: 115 }); s.el.classList.add('is-split'); });
    var missionEl = $('#pMission'), missionWords = missionEl ? splitWords(missionEl, false) : [];

    /* magnetic */
    if (fine) $$('[data-magnetic]').forEach(function (el) {
      var inner = $('span', el) || el;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: dx * 0.28, y: dy * 0.34, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        if (inner !== el) gsap.to(inner, { x: dx * 0.08, y: dy * 0.1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.4)', overwrite: 'auto' });
        if (inner !== el) gsap.to(inner, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,.4)', overwrite: 'auto' });
      });
    });

    /* hero parallax (scrubbed) */
    var ph = $('.phero');
    if (ph) {
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: ph, start: 'top top', end: 'bottom top', scrub: true } })
        .to('.phero__photo', { yPercent: 14, scale: 1.08 }, 0)
        .to('.phero .hero__mark', { yPercent: -4, y: 90, scale: 1.06 }, 0)
        .to('.phero__lines', { yPercent: 5 }, 0)
        .to('.phero__inner', { y: -60, opacity: 0.1, ease: 'power1.in' }, 0);
    }

    /* mission words */
    if (missionWords.length) {
      gsap.to(missionWords, { opacity: 1, ease: 'none', stagger: 0.09, duration: 1, scrollTrigger: { trigger: missionEl, start: 'top 82%', end: 'bottom 52%', scrub: 0.5 } });
    }

    /* headings, fades, counters */
    splits.forEach(function (s) {
      ScrollTrigger.create({ trigger: s.el, start: 'top 88%', once: true, onEnter: function () {
        var d = lineDelays(s.words, 0.13, 0.035);
        gsap.to(s.words, { yPercent: 0, duration: 1.15, ease: 'power4.out', delay: function (i) { return d[i]; } });
      } });
    });
    ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: function (b) { gsap.fromTo(b, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.09, ease: 'power3.out' }); } });
    $$('.count').forEach(animateCount);

    /* parallax images */
    $$('.photo-frame img, .careers__img').forEach(function (img) {
      var host = img.closest('.photo-frame, .careers-mini') || img.parentNode;
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    if ($('.careers-mini')) {
      gsap.fromTo('.careers-mini', { clipPath: 'inset(10% 5% 0% 5% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.careers-mini', start: 'top 92%', end: 'top 25%', scrub: true } });
    }

    /* capability instruments */
    $$('.capx').forEach(function (sec) {
      var vis = $('.cap-visual', sec); if (!vis) return;
      var loop = makeLoop(vis), draws = $$('[data-draw]', vis), drawn = false;
      ScrollTrigger.create({
        trigger: vis, start: 'top 85%', end: 'bottom 10%',
        onEnter: function () { if (!drawn) { drawn = true; gsap.fromTo(draws, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.05 }); } loop.play(); },
        onEnterBack: function () { loop.play(); }, onLeave: function () { loop.pause(); }, onLeaveBack: function () { loop.pause(); }
      });
      gsap.fromTo(vis, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: vis, start: 'top 88%', once: true }, onComplete: function () { gsap.set(vis, { clearProps: 'clipPath' }); } });
      var nums = $('.cap-num', sec);
      if (nums) gsap.fromTo(nums, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* footer: wordmark + big mark */
    if ($('#wordmark')) gsap.fromTo('#wordmark span', { yPercent: 105 }, { yPercent: 0, ease: 'none', stagger: 0.06, scrollTrigger: { trigger: '#wordmark', start: 'top 105%', end: 'bottom 80%', scrub: 0.6 } });
    var fm = $('.footer__mark');
    if (fm) {
      var fd = $$('path', fm);
      gsap.fromTo(fd, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', stagger: 0.2, scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true } });
      gsap.fromTo(fm, { y: -60 }, { y: 60, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    }

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });

    /* ---- intro ---- */
    var delays = lineDelays(h1Words, 0.14, 0.05);
    var tl = gsap.timeline({ delay: T0 });
    tl.fromTo('.phero__photo img', { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 0.5, duration: 2.4, ease: 'power2.out' }, 0)
      .fromTo('.phero__lines path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', stagger: 0.12 }, 0.1)
      .fromTo('.phero .hero__mark path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', stagger: 0.25 }, 0.2)
      .to(h1Words, { yPercent: 0, duration: 1.3, ease: 'power4.out', delay: function (i) { return delays[i]; } }, 0.15)
      .fromTo('.phero [data-intro]', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09 }, 0.55)
      .fromTo('#nav', { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', clearProps: 'opacity,transform' }, 0.3);
    if (location.hash && location.hash.length > 1) setTimeout(function () { var el = $(location.hash); if (el) { if (lenis) lenis.scrollTo(el, { immediate: true, offset: $('.capidx') ? -50 : 0 }); else el.scrollIntoView(); } }, 900);
  }

  function boot() {
    if (!MOTION) { return; }
    try { initMotion(); }
    catch (err) { if (window.console) console.error('[northline] page motion failed, static fallback', err); doc.classList.remove('motion'); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  if (!MOTION && location.hash && location.hash.length > 1) window.addEventListener('load', function () { var el = $(location.hash); if (el) el.scrollIntoView(); });
})();
