/* Northline — page transitions (clip-path wipe). No dependencies; works from file://.
   Leaving: overlay wipes up over the page, then we navigate. Arriving (html.pt-in set in <head>): overlay wipes off. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var pt = document.getElementById('pt');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var leaving = false;
  function norm(p) { return (p || '').replace(/index\.html$/, '').replace(/\/+$/, ''); }

  function out() {
    if (!pt || !doc.classList.contains('pt-in')) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        pt.classList.add('is-out');
        setTimeout(function () { doc.classList.remove('pt-in'); pt.classList.remove('is-out', 'is-in'); }, 950);
      });
    });
  }
  window.NLPT = { out: out, active: function () { return doc.classList.contains('pt-in'); } };
  if (document.readyState === 'complete') setTimeout(out, 120);
  else window.addEventListener('load', function () { setTimeout(out, 120); });
  // safety if load never fires
  setTimeout(out, 2400);

  // coming back via bfcache: make sure the overlay is gone
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && pt) { leaving = false; doc.classList.remove('pt-in'); pt.classList.remove('is-in', 'is-out'); }
  });

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || leaving || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || !pt) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    var u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.protocol !== location.protocol || u.host !== location.host) return;
    if (!/\.html?$|\/$/.test(u.pathname)) return;
    var same = norm(u.pathname) === norm(location.pathname);
    if (same) {
      // same page + hash → smooth in-page scroll instead of a reload
      if (u.hash && window.NL && window.NL.goTo) { e.preventDefault(); window.NL.goTo(u.hash); }
      else if (!u.hash) e.preventDefault();
      return;
    }
    if (reduce) return; // instant navigation
    e.preventDefault();
    leaving = true;
    try { sessionStorage.setItem('nl-pt', '1'); } catch (err2) {}
    try { window.name = 'nl-pt'; } catch (err3) {}
    pt.classList.add('is-in');
    var done = false;
    function go() { if (done) return; done = true; location.href = u.href; }
    setTimeout(go, 900);
  }, false);
})();
