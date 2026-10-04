/* Northline — shared shell behaviours (mega menu, mobile accordion, back-to-top). No dependencies. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var header = $('#nav');

  /* ---------- desktop mega menu ---------- */
  var items = $$('.nav-item[data-mega]');
  var timers = new WeakMap();
  function setOpen(it, open) {
    it.classList.toggle('is-open', open);
    var b = $('.nav-chev', it); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeAll(except) { items.forEach(function (it) { if (it !== except) setOpen(it, false); }); }
  items.forEach(function (it) {
    var btn = $('.nav-chev', it);
    function later(open, ms) {
      clearTimeout(timers.get(it));
      timers.set(it, setTimeout(function () { if (open) closeAll(it); setOpen(it, open); }, ms));
    }
    if (fine) {
      it.addEventListener('pointerenter', function () { later(true, 90); });
      it.addEventListener('pointerleave', function () { later(false, 180); });
    }
    if (btn) btn.addEventListener('click', function (e) {
      e.preventDefault(); clearTimeout(timers.get(it));
      var open = !it.classList.contains('is-open'); closeAll(it); setOpen(it, open);
    });
    it.addEventListener('focusout', function (e) {
      if (!it.contains(e.relatedTarget)) { clearTimeout(timers.get(it)); setOpen(it, false); }
    });
    it.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && it.classList.contains('is-open')) { setOpen(it, false); if (btn) btn.focus(); e.stopPropagation(); }
      if (e.key === 'ArrowDown' && e.target === btn) { e.preventDefault(); setOpen(it, true); var f = $('.mega a', it); if (f) f.focus(); }
    });
    // close when following a link inside the panel
    $$('.mega a', it).forEach(function (a) { a.addEventListener('click', function () { setOpen(it, false); }); });
  });
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest || !e.target.closest('.nav-item[data-mega]')) closeAll(); });
  window.addEventListener('scroll', function () { if (header && header.classList.contains('is-hidden')) closeAll(); }, { passive: true });
  window.addEventListener('resize', function () { closeAll(); });

  /* ---------- mobile accordion ---------- */
  $$('.macc__btn').forEach(function (b) {
    var panel = document.getElementById(b.getAttribute('aria-controls'));
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      $$('.macc__btn').forEach(function (o) {
        if (o !== b) { o.setAttribute('aria-expanded', 'false'); var p = document.getElementById(o.getAttribute('aria-controls')); if (p) p.hidden = true; }
      });
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (panel) panel.hidden = !open;
    });
  });
  // collapse accordions whenever the menu closes
  var menuBtn = $('#menuBtn');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    setTimeout(function () {
      if (menuBtn.getAttribute('aria-expanded') !== 'true') $$('.macc__btn').forEach(function (o) { o.setAttribute('aria-expanded', 'false'); var p = document.getElementById(o.getAttribute('aria-controls')); if (p) p.hidden = true; });
    }, 850);
  });
  // open the accordion that holds the current page
  $$('.macc').forEach(function (m) { if ($('[aria-current="page"]', m) && $('.macc__btn', m)) { /* stays collapsed by default; current link is highlighted */ } });

  /* ---------- back to top ---------- */
  var btt = $('#btt'), ring = btt && $('.btt-ring', btt);
  if (btt) {
    var C = 2 * Math.PI * 21, tick = false;
    if (ring) { ring.style.strokeDasharray = C.toFixed(2); ring.style.strokeDashoffset = C.toFixed(2); }
    var upd = function () {
      tick = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      btt.classList.toggle('is-on', y > window.innerHeight * 1.1);
      if (ring) ring.style.strokeDashoffset = (C * (1 - Math.min(1, y / max))).toFixed(2);
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    btt.addEventListener('click', function () {
      if (window.NL && window.NL.goTo) window.NL.goTo('#top');
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () { document.body.setAttribute('tabindex', '-1'); document.body.focus({ preventScroll: true }); }, 60);
    });
    upd();
  }
})();
