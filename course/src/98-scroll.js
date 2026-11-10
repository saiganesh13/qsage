/* =====================================================================
   Gentler mouse-wheel scrolling
   A mouse-wheel notch scrolls 40–80 px (about half the browser default, capped
   for systems that report very large steps) and glides there in about 0.2 s.
   Touchpads, touch screens, the keyboard, the scrollbar, Ctrl/⌘ + wheel zoom and Shift + wheel are left untouched, as are scrollable
   panels inside the page (the lesson list, text boxes).
   The same code is inlined in index.html; keep the two copies in step.
   ===================================================================== */
(function () {
  var FACTOR = 0.5, MINSTEP = 40, MAXSTEP = 80, DUR = 200;   /* pixels per wheel notch, glide in ms */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var target = null, raf = 0, fromY = 0, t0 = 0;
  function isMouseWheel(e) {
    if (e.deltaMode === 1 || e.deltaMode === 2) return true;          /* lines or pages: a wheel */
    var w = e.wheelDeltaY;                                            /* Chromium/WebKit: ±120 per notch */
    if (typeof w === 'number' && w !== 0) return Math.abs(w) >= 120 && w % 120 === 0 && e.deltaX === 0;
    return Math.abs(e.deltaY) >= 50 && e.deltaX === 0 && Number.isInteger(e.deltaY);
  }
  function innerScroller(el, dy) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
      var oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
    }
    return false;
  }
  function maxY() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
  function jump(y) { window.scrollTo({ top: y, behavior: 'instant' }); }
  function step(now) {
    var k = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - k, 3);   /* ease-out, time based */
    jump(fromY + (target - fromY) * e);
    if (k < 1) { raf = requestAnimationFrame(step); return; }
    target = null; raf = 0;
  }
  window.addEventListener('wheel', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (!isMouseWheel(e) || innerScroller(e.target, e.deltaY)) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1);
    e.preventDefault();
    var base = target === null ? window.scrollY : target;
    var notches = typeof e.wheelDeltaY === 'number' && e.wheelDeltaY ? Math.max(1, Math.round(Math.abs(e.wheelDeltaY) / 120)) : 1;
    var per = Math.min(MAXSTEP, Math.max(MINSTEP, Math.abs(dy) / notches * FACTOR));
    target = Math.min(maxY(), Math.max(0, base + Math.sign(dy) * notches * per));
    if (reduce) { jump(target); target = null; return; }
    fromY = window.scrollY; t0 = performance.now();
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: false });
  /* anything else that scrolls the page (keys, scrollbar, links) cancels the glide */
  ['keydown', 'mousedown', 'touchstart'].forEach(function (t) {
    window.addEventListener(t, function () { if (raf) { cancelAnimationFrame(raf); raf = 0; target = null; } }, { passive: true });
  });
})();
