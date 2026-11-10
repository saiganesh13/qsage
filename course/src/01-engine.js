'use strict';
/* =====================================================================
   QMount Learn · core engine
   Simulation, drawing primitives and UI helpers shared by every lesson.
   ===================================================================== */
const TAU = Math.PI * 2, S2 = Math.SQRT1_2, PI = Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => RMQ.matches;
const dur = ms => reduced() ? 0 : ms;
const deg = r => r * 180 / PI, rad = d => d * PI / 180;
const MINUS = '−';
function num(x, d = 3) {
  if (!isFinite(x)) return '—';
  const v = Math.abs(x) < 0.5 * Math.pow(10, -d) ? 0 : x;
  return v.toFixed(d).replace('-', MINUS);
}
const pct = (x, d = 1) => num(x * 100, d) + '%';
const ket = (i, n) => '|' + i.toString(2).padStart(n, '0') + '⟩';

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(3)) {
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return e;
}
const SVGNS = 'http://www.w3.org/2000/svg';
function sv(tag, attrs, text) {
  const e = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}
function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
function binom(n, p) { if (n > 3000) return clamp(Math.round(n * p + Math.sqrt(n * p * (1 - p)) * randn()), 0, n); let k = 0; for (let i = 0; i < n; i++) if (Math.random() < p) k++; return k; }

/* ---------- theme ---------- */
const Theme = {
  c: null, ls: new Set(),
  get() {
    if (!this.c) {
      const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
      this.c = { bg: g('--bg'), surface: g('--surface'), surface2: g('--surface-2'), ink: g('--ink'), muted: g('--muted'), line: g('--line'),
        copper: g('--copper'), copperHi: g('--copper-hi'), copperLo: g('--copper-lo'), wash: g('--copper-wash'), cyan: g('--cyan'),
        good: g('--good'), bad: g('--bad'), dark: g('--is-dark') === '1' };
    }
    return this.c;
  },
  bump() { this.c = null; this.ls.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => Theme.bump());
new MutationObserver(() => Theme.bump()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => Theme.bump());

function rgbOf(c) {
  c = (c || '').trim();
  if (c[0] === '#') { let x = c.slice(1); if (x.length === 3) x = x.split('').map(ch => ch + ch).join(''); return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16)); }
  const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
}
const rgba = (c, a) => { const [r, g, b] = rgbOf(c); return `rgba(${r},${g},${b},${a})`; };
function mixRGB(a, b, t) { const A = rgbOf(a), B = rgbOf(b); return A.map((v, i) => Math.round(v + (B[i] - v) * t)); }
/* phase colour: 0 = blue-cyan, π = orange-red. The same wheel is used on every page. */
function phaseColor(a, alpha = 1) {
  const hue = (((195 + deg(a)) % 360) + 360) % 360, d = Theme.get().dark;
  return `hsla(${hue.toFixed(1)},${d ? 72 : 64}%,${d ? 62 : 41}%,${alpha})`;
}
function wheelStyle() {
  const stops = []; for (let k = 0; k <= 12; k++) stops.push(phaseColor(-k * PI / 6));
  return `background:conic-gradient(from 90deg, ${stops.join(',')})`;
}

/* ---------- page scope: animation ticks and cleanup tied to the current view ---------- */
const Scope = {
  ticks: new Set(), cl: [],
  tick(f) { this.ticks.add(f); },
  clean(f) { this.cl.push(f); },
  theme(f) { Theme.ls.add(f); this.cl.push(() => Theme.ls.delete(f)); },
  every(ms, f) { const id = setInterval(f, ms); this.cl.push(() => clearInterval(id)); return id; },
  later(ms, f) { const id = setTimeout(f, ms); this.cl.push(() => clearTimeout(id)); return id; },
  reset() { const c = this.cl.splice(0); c.forEach(f => { try { f(); } catch (e) { console.error(e); } }); this.ticks.clear(); }
};
(function frame(now) {
  Scope.ticks.forEach(f => { try { f(now); } catch (e) { console.error(e); Scope.ticks.delete(f); } });
  requestAnimationFrame(frame);
})(performance.now());

function prep(cv) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, hh = cv.clientHeight;
  const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(hh * dpr));
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, hh);
  return { ctx, w, h: hh };
}
/* redraws a canvas only when invalidated (resize, theme, data) */
function painter(cv, draw) {
  let dirty = true;
  const p = { inv() { dirty = true; } };
  Scope.tick(() => { if (!dirty || !cv.isConnected || cv.clientWidth < 2) return; dirty = false; draw(prep(cv)); });
  const ro = new ResizeObserver(() => { dirty = true; }); ro.observe(cv); Scope.clean(() => ro.disconnect());
  Scope.theme(() => { dirty = true; });
  return p;
}
function canvas(cls = '', style = '') { return h('canvas', { class: 'cv ' + cls, style }); }

/* ---------- vectors ---------- */
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: a => Math.hypot(a[0], a[1], a[2]),
  unit: a => { const n = Math.hypot(a[0], a[1], a[2]); return n < 1e-12 ? [0, 0, 1] : [a[0] / n, a[1] / n, a[2] / n]; },
  rot(v, k, ang) { const c = Math.cos(ang), s = Math.sin(ang), kv = V.cross(k, v), kd = V.dot(k, v);
    return [0, 1, 2].map(i => v[i] * c + kv[i] * s + k[i] * kd * (1 - c)); }
};
const fromAngles = (th, ph) => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
function anglesOf(v) { const u = V.unit(v); return { th: Math.acos(clamp(u[2], -1, 1)), ph: Math.atan2(u[1], u[0]) }; }
function ampsOf(v) { const { th, ph } = anglesOf(v); const s = Math.sin(th / 2); return { a: [Math.cos(th / 2), 0], b: [s * Math.cos(ph), s * Math.sin(ph)], th, ph }; }
const CARD = { '0': [0, 0, 1], '1': [0, 0, -1], '+': [1, 0, 0], '-': [-1, 0, 0], '+i': [0, 1, 0], '-i': [0, -1, 0] };
const CARD_LABEL = { '0': '|0⟩', '1': '|1⟩', '+': '|+⟩', '-': '|−⟩', '+i': '|+i⟩', '-i': '|−i⟩' };

/* single-qubit gates as Bloch rotations (axis, angle) */
const ROT = {
  X: { axis: [1, 0, 0], ang: PI }, Y: { axis: [0, 1, 0], ang: PI }, Z: { axis: [0, 0, 1], ang: PI },
  H: { axis: [S2, 0, S2], ang: PI }, S: { axis: [0, 0, 1], ang: PI / 2 }, Sdg: { axis: [0, 0, 1], ang: -PI / 2 },
  T: { axis: [0, 0, 1], ang: PI / 4 }, Tdg: { axis: [0, 0, 1], ang: -PI / 4 }
};
const GATE_LABEL = { X: 'X', Y: 'Y', Z: 'Z', H: 'H', S: 'S', Sdg: 'S†', T: 'T', Tdg: 'T†' };

/* ---------- complex 2x2 matrices and the state-vector simulator ---------- */
const c = (r, i = 0) => [r, i];
const M = {
  I: [c(1), c(0), c(0), c(1)], X: [c(0), c(1), c(1), c(0)], Y: [c(0), c(0, -1), c(0, 1), c(0)], Z: [c(1), c(0), c(0), c(-1)],
  H: [c(S2), c(S2), c(S2), c(-S2)], S: [c(1), c(0), c(0), c(0, 1)], Sdg: [c(1), c(0), c(0), c(0, -1)],
  T: [c(1), c(0), c(0), c(S2, S2)], Tdg: [c(1), c(0), c(0), c(S2, -S2)]
};
const Rx = t => [c(Math.cos(t / 2)), c(0, -Math.sin(t / 2)), c(0, -Math.sin(t / 2)), c(Math.cos(t / 2))];
const Ry = t => [c(Math.cos(t / 2)), c(-Math.sin(t / 2)), c(Math.sin(t / 2)), c(Math.cos(t / 2))];
const Rz = t => [c(Math.cos(t / 2), -Math.sin(t / 2)), c(0), c(0), c(Math.cos(t / 2), Math.sin(t / 2))];
const Phase = p => [c(1), c(0), c(0), c(Math.cos(p), Math.sin(p))];

class QState {
  constructor(n) { this.n = n; this.N = 1 << n; this.re = new Float64Array(this.N); this.im = new Float64Array(this.N); this.re[0] = 1; }
  clone() { const s = new QState(this.n); s.re.set(this.re); s.im.set(this.im); return s; }
  mask(q) { return 1 << (this.n - 1 - q); }   // qubit 0 is the leftmost digit of the ket
  basis(i) { this.re.fill(0); this.im.fill(0); this.re[i] = 1; return this; }
  apply(q, m, ctrls) {
    const t = this.mask(q); let cm = 0; if (ctrls) for (const k of ctrls) cm |= this.mask(k);
    const { re, im, N } = this, a = m[0], b = m[1], cc = m[2], d = m[3];
    for (let i = 0; i < N; i++) {
      if (i & t || (i & cm) !== cm) continue;
      const j = i | t, xr = re[i], xi = im[i], yr = re[j], yi = im[j];
      re[i] = a[0] * xr - a[1] * xi + b[0] * yr - b[1] * yi; im[i] = a[0] * xi + a[1] * xr + b[0] * yi + b[1] * yr;
      re[j] = cc[0] * xr - cc[1] * xi + d[0] * yr - d[1] * yi; im[j] = cc[0] * xi + cc[1] * xr + d[0] * yi + d[1] * yr;
    }
    return this;
  }
  g(name, q) { return this.apply(q, M[name]); }
  cx(cq, t) { return this.apply(t, M.X, [cq]); }
  cz(a, b) { return this.apply(b, M.Z, [a]); }
  swap(p, q) {
    const mp = this.mask(p), mq = this.mask(q);
    for (let i = 0; i < this.N; i++) if ((i & mp) && !(i & mq)) {
      const j = (i & ~mp) | mq;
      let t = this.re[i]; this.re[i] = this.re[j]; this.re[j] = t; t = this.im[i]; this.im[i] = this.im[j]; this.im[j] = t;
    }
    return this;
  }
  probs() { const p = new Float64Array(this.N); for (let i = 0; i < this.N; i++) p[i] = this.re[i] ** 2 + this.im[i] ** 2; return p; }
  prob1(q) { const m = this.mask(q); let s = 0; for (let i = 0; i < this.N; i++) if (i & m) s += this.re[i] ** 2 + this.im[i] ** 2; return s; }
  measure(q, r = Math.random()) {
    const p1 = this.prob1(q), out = r < p1 ? 1 : 0, m = this.mask(q), nrm = Math.sqrt(out ? p1 : 1 - p1) || 1;
    for (let i = 0; i < this.N; i++) {
      if (((i & m) ? 1 : 0) !== out) { this.re[i] = 0; this.im[i] = 0; } else { this.re[i] /= nrm; this.im[i] /= nrm; }
    }
    return out;
  }
  bloch(q) {
    const m = this.mask(q); let x = 0, y = 0, z = 0; const { re, im } = this;
    for (let i = 0; i < this.N; i++) {
      if (i & m) continue; const j = i | m, ar = re[i], ai = im[i], br = re[j], bi = im[j];
      z += ar * ar + ai * ai - br * br - bi * bi; x += 2 * (ar * br + ai * bi); y += 2 * (ar * bi - ai * br);
    }
    return [x, y, z];
  }
  sample(shots) {
    const p = this.probs(), cum = []; let s = 0; for (const v of p) { s += v; cum.push(s); }
    const counts = new Array(this.N).fill(0);
    for (let k = 0; k < shots; k++) { const r = Math.random() * s; let lo = 0, hi = this.N - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < r) lo = mid + 1; else hi = mid; } counts[lo]++; }
    return counts;
  }
}

/* ---------- formatting amplitudes ---------- */
const NICE = [[1, '1'], [S2, '1/√2'], [.5, '1/2'], [Math.sqrt(1 / 8), '1/√8'], [.25, '1/4'], [Math.sqrt(3) / 2, '√3/2']];
function nice(x, d = 3) { const a = Math.abs(x); for (const [v, s] of NICE) if (Math.abs(a - v) < 5e-4) return (x < 0 ? MINUS : '') + s; return num(x, d); }
function cstr(re, im, d = 3) {
  const eps = 0.5 * Math.pow(10, -d), r = Math.abs(re) < eps ? 0 : re, i = Math.abs(im) < eps ? 0 : im;
  if (i === 0) return num(r, d);
  if (r === 0) return (i < 0 ? MINUS : '') + num(Math.abs(i), d) + 'i';
  return '(' + num(r, d) + (i < 0 ? ' ' + MINUS + ' ' : ' + ') + num(Math.abs(i), d) + 'i)';
}
function ketString(re, im, n, max = 8) {
  const terms = [];
  for (let i = 0; i < re.length; i++) if (re[i] * re[i] + im[i] * im[i] > 1e-7) terms.push(i);
  if (!terms.length) return '0';
  let out = '';
  terms.slice(0, max).forEach((i, k) => {
    const r = re[i], m = im[i], er = Math.abs(r) < 5e-4, ei = Math.abs(m) < 5e-4; let coef, neg = false;
    if (ei) { neg = r < 0; coef = nice(Math.abs(r)); }
    else if (er) { neg = m < 0; coef = nice(Math.abs(m)) + 'i'; }
    else coef = cstr(r, m);
    if (coef === '1') coef = ''; if (coef === '1i') coef = 'i';
    out += (k === 0 ? (neg ? MINUS : '') : (neg ? ' ' + MINUS + ' ' : ' + ')) + coef + ket(i, n);
  });
  if (terms.length > max) out += ' + …';
  return out;
}
function ketOfBloch(v) {
  const { a, b } = ampsOf(v);
  return ketString([a[0], b[0]], [a[1], b[1]], 1);
}

/* ---------- Bloch sphere ---------- */
class BlochView {
  constructor(cv, o = {}) {
    this.cv = cv; this.o = Object.assign({ labels: 'full', drag: true, trail: true }, o);
    this.v = [0, 0, 1]; this.yaw = -1.95; this.pitch = .32; this.trail = []; this.q = []; this.a = null;
    this.target = null; this.hi = null; this.extra = [];
    this.p = painter(cv, x => this.draw(x));
    Scope.tick(t => this.step(t));
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', o.aria || 'Bloch sphere');
    if (this.o.drag) this.bindDrag();
  }
  inv() { this.p.inv(); }
  set(v) { this.v = v.slice(); this.trail = []; this.inv(); }
  clearTrail() { this.trail = []; this.inv(); }
  rotate(axis, ang, ms = 650) { return this.push({ k: 'rot', axis: V.unit(axis), ang, ms }); }
  moveTo(t, ms = 550) { return this.push({ k: 'to', t: t.slice(), ms }); }
  go(t, ms = 350) { this.cancel(); return this.moveTo(t, ms); }
  push(a) { return new Promise(r => { a.r = r; this.q.push(a); }); }
  cancel() { this.q.forEach(a => a.r()); this.q = []; if (this.a) { this.a.r(); this.a = null; } }
  get busy() { return !!this.a || this.q.length > 0; }
  step(now) {
    if (!this.a && this.q.length) {
      const a = this.q.shift(); a.t0 = now; a.v0 = this.v.slice(); a.ms = dur(a.ms);
      if (a.k === 'to') {
        const r0 = V.norm(a.v0), r1 = V.norm(a.t);
        a.u0 = r0 < 1e-9 ? [0, 0, 1] : V.scale(a.v0, 1 / r0);
        const u1 = r1 < 1e-9 ? a.u0 : V.scale(a.t, 1 / r1);
        let ax = V.cross(a.u0, u1); const s = V.norm(ax), cs = clamp(V.dot(a.u0, u1), -1, 1);
        if (s < 1e-9) { ax = cs > 0 ? [0, 0, 1] : V.unit(V.cross(a.u0, Math.abs(a.u0[0]) < .9 ? [1, 0, 0] : [0, 1, 0])); a.ang = cs > 0 ? 0 : PI; }
        else { ax = V.scale(ax, 1 / s); a.ang = Math.acos(cs); }
        a.axis = ax; a.r0 = r0; a.r1 = r1;
      }
      this.a = a;
    }
    const a = this.a; if (!a) return;
    const t = a.ms <= 0 ? 1 : clamp((now - a.t0) / a.ms, 0, 1), e = ease(t);
    if (a.k === 'rot') this.v = V.rot(a.v0, a.axis, a.ang * e);
    else this.v = V.scale(V.rot(a.u0, a.axis, a.ang * e), lerp(a.r0, a.r1, e));
    if (this.o.trail) { this.trail.push(this.v.slice()); if (this.trail.length > 700) this.trail.shift(); }
    this.inv();
    if (t >= 1) { if (a.k === 'to') this.v = a.t.slice(); this.a = null; a.r(); }
  }
  bindDrag() {
    const cv = this.cv; let last = null;
    cv.classList.add('grab'); cv.tabIndex = 0;
    cv.addEventListener('pointerdown', e => { last = [e.clientX, e.clientY]; try { cv.setPointerCapture(e.pointerId); } catch (_) {} cv.classList.add('grabbing'); });
    cv.addEventListener('pointermove', e => {
      if (!last) return; const dx = e.clientX - last[0], dy = e.clientY - last[1]; last = [e.clientX, e.clientY];
      this.yaw += dx * .011; this.pitch = clamp(this.pitch + dy * .011, -1.35, 1.35); this.inv();
    });
    const up = () => { last = null; cv.classList.remove('grabbing'); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('keydown', e => {
      const k = { ArrowLeft: [-.15, 0], ArrowRight: [.15, 0], ArrowUp: [0, -.12], ArrowDown: [0, .12] }[e.key];
      if (!k) return; e.preventDefault(); this.yaw += k[0]; this.pitch = clamp(this.pitch + k[1], -1.35, 1.35); this.inv();
    });
  }
  proj(p) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const x1 = p[0] * cy - p[1] * sy, y1 = p[0] * sy + p[1] * cy, z1 = p[2];
    const y2 = y1 * cp - z1 * sp, z2 = y1 * sp + z1 * cp;
    return [this.cx + this.R * x1, this.cy - this.R * z2, y2];
  }
  curve(ctx, f, col, lw, alpha) {
    const N = 128, pts = []; for (let i = 0; i <= N; i++) pts.push(this.proj(f(i / N * TAU)));
    for (const back of [true, false]) {
      ctx.beginPath(); let pen = false;
      for (let i = 1; i <= N; i++) {
        const a = pts[i - 1], b = pts[i], isB = (a[2] + b[2]) / 2 > 0;
        if (isB === back) { if (!pen) { ctx.moveTo(a[0], a[1]); pen = true; } ctx.lineTo(b[0], b[1]); } else pen = false;
      }
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.globalAlpha = back ? alpha * .4 : alpha; ctx.setLineDash(back ? [3, 4] : []); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.setLineDash([]);
  }
  draw({ ctx, w, h }) {
    const T = Theme.get(), small = this.o.labels !== 'full';
    const R = this.R = Math.min(w, h) * (small ? .38 : .355); const cx = this.cx = w / 2, cy = this.cy = h / 2;
    const g = ctx.createRadialGradient(cx - R * .35, cy - R * .45, R * .1, cx, cy, R * 1.05);
    g.addColorStop(0, T.surface); g.addColorStop(1, T.surface2);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = T.line; ctx.stroke();
    this.curve(ctx, t => [Math.cos(t), Math.sin(t), 0], T.muted, 1.1, .85);
    this.curve(ctx, t => [Math.cos(t), 0, Math.sin(t)], T.muted, .8, .45);
    this.curve(ctx, t => [0, Math.cos(t), Math.sin(t)], T.muted, .8, .45);
    if (this.shape && this.drawShape) this.drawShape(ctx, T);
    const axes =[['x', [1, 0, 0], '|+⟩', '|−⟩'], ['y', [0, 1, 0], '|+i⟩', '|−i⟩'], ['z', [0, 0, 1], '|0⟩', '|1⟩']];
    const fs = small ? Math.max(11, R * .2) : clamp(R * .12, 13, 17);
    ctx.font = `500 ${fs}px "STIX Two Text","Noto Sans Math",serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [n, d, lp, lm] of axes) {
      const hi = this.hi === n, a = this.proj(V.scale(d, -1.08)), b = this.proj(V.scale(d, 1.08));
      ctx.strokeStyle = hi ? T.copper : T.muted; ctx.globalAlpha = hi ? 1 : .6; ctx.lineWidth = hi ? 2.2 : 1; ctx.setLineDash(hi ? [] : [2, 4]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      if (!small || n === 'z') {
        for (const [s, lab] of [[1, lp], [-1, lm]]) {
          const p = this.proj(V.scale(d, s * (small ? 1.2 : 1.24)));
          ctx.globalAlpha = p[2] > .25 ? .45 : 1; ctx.fillStyle = hi ? T.copper : T.ink; ctx.fillText(lab, p[0], p[1]);
        }
        ctx.globalAlpha = 1;
      }
    }
    for (const e of this.extra) {
      const p = this.proj(e.v); ctx.globalAlpha = p[2] > 0 ? .45 : .9; ctx.fillStyle = e.color || T.muted;
      ctx.beginPath(); ctx.arc(p[0], p[1], e.r || 3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (this.target) {
      const p = this.proj(this.target); ctx.strokeStyle = T.cyan; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(p[0], p[1], small ? 7 : 11, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const c0 = this.proj([0, 0, 0]); ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (this.trail.length > 1) {
      ctx.lineWidth = 2; ctx.strokeStyle = T.copper; const n = this.trail.length;
      for (let i = 1; i < n; i++) {
        const a = this.proj(this.trail[i - 1]), b = this.proj(this.trail[i]);
        ctx.globalAlpha = .12 + .55 * (i / n); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    const v = this.v, r = V.norm(v), c0 = this.proj([0, 0, 0]), tip = this.proj(v), base = this.proj([v[0], v[1], 0]);
    if (r > .02) {
      ctx.strokeStyle = T.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.globalAlpha = .7;
      ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(base[0], base[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.strokeStyle = T.copper; ctx.lineWidth = small ? 2.4 : 3.2; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
    }
    ctx.fillStyle = T.copper; ctx.beginPath(); ctx.arc(tip[0], tip[1], small ? 4.2 : 6.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = T.surface; ctx.lineWidth = 2; ctx.stroke();
  }
}

/* ---------- bar charts ---------- */
class Bars {
  constructor(el, labels, o = {}) {
    this.el = el; el.classList.add('bars'); if (labels.length > 8) el.classList.add('dense');
    el.style.setProperty('--cols', labels.length); if (o.height) el.style.height = o.height + 'px';
    el.innerHTML = '';
    this.cols = labels.map(l => {
      const val = h('div', { class: 'b-val' }), bar = h('div', { class: 'b-bar' }), mark = h('div', { class: 'b-mark', hidden: true });
      const col = h('div', { class: 'b-col' }, val, h('div', { class: 'b-track' }, bar, mark), h('div', { class: 'b-lab' }, l));
      el.append(col); return { val, bar, mark, col };
    });
  }
  set(vals, o = {}) {
    vals.forEach((v, i) => {
      const c = this.cols[i]; if (!c) return;
      c.bar.style.height = (clamp(v, 0, 1) * 100) + '%';
      c.bar.style.background = o.colors ? (Array.isArray(o.colors) ? o.colors[i] : o.colors) : 'var(--cyan)';
      c.val.textContent = o.texts ? o.texts[i] : '';
      if (o.marks && o.marks[i] != null) { c.mark.hidden = false; c.mark.style.bottom = (clamp(o.marks[i], 0, 1) * 100) + '%'; } else c.mark.hidden = true;
      if (o.titles) c.col.title = o.titles[i];
    });
  }
}
function stateBars(el, n, o = {}) {
  const N = 1 << n, b = new Bars(el, [...Array(N)].map((_, i) => ket(i, n)), o); let last = null;
  const paint = () => {
    if (!last) return; const [re, im] = last, p = [], col = [], t = [], ti = [];
    for (let i = 0; i < N; i++) {
      const pp = re[i] * re[i] + im[i] * im[i]; p.push(pp);
      col.push(pp < 1e-9 ? 'transparent' : phaseColor(Math.atan2(im[i], re[i])));
      t.push(pp < 5e-4 ? '' : Math.round(pp * 100) + (N > 8 ? '' : '%'));
      ti.push(ket(i, n) + '  amplitude ' + cstr(re[i], im[i]) + ', probability ' + pct(pp));
    }
    b.set(p, { colors: col, texts: t, titles: ti });
  };
  Scope.theme(paint);
  b.state = (re, im) => { last = [re, im]; paint(); };
  return b;
}

/* signed real amplitudes on a canvas, with smooth tweening */
class SignedBars {
  constructor(cv, N, o = {}) {
    this.cv = cv; this.o = o; this.N = N; this.cur = new Float64Array(N); this.tgt = new Float64Array(N);
    this.mean = null; this.mark = -1; this.ymax = o.ymax || 1;
    this.p = painter(cv, x => this.draw(x));
    Scope.tick(() => this.step());
    cv.addEventListener('click', e => {
      if (!this.onPick) return; const r = cv.getBoundingClientRect();
      const i = Math.floor((e.clientX - r.left - 8) / ((r.width - 16) / this.N)); if (i >= 0 && i < this.N) this.onPick(i);
    });
  }
  setN(N) { this.N = N; this.cur = new Float64Array(N); this.tgt = new Float64Array(N); this.p.inv(); }
  to(vals, instant) { for (let i = 0; i < this.N; i++) this.tgt[i] = vals[i] || 0; if (instant || reduced()) this.cur.set(this.tgt); this.p.inv(); }
  step() {
    let mv = false;
    for (let i = 0; i < this.N; i++) { const d = this.tgt[i] - this.cur[i]; if (Math.abs(d) > 2e-4) { this.cur[i] += d * .16; mv = true; } else this.cur[i] = this.tgt[i]; }
    if (mv) this.p.inv();
  }
  draw({ ctx, w, h }) {
    const T = Theme.get(), lab = this.N <= 16, top = 12, bot = lab ? 26 : 10, L = 8, bw = (w - 16) / this.N;
    const half = (h - top - bot) / 2, mid = top + half, sc = half / this.ymax;
    ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, mid + .5); ctx.lineTo(w - 8, mid + .5); ctx.stroke();
    ctx.font = '500 10px "JetBrains Mono",monospace'; ctx.fillStyle = T.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('+' + num(this.ymax, 2), L + 2, top + 6); ctx.fillText(MINUS + num(this.ymax, 2), L + 2, h - bot - 6);
    for (let i = 0; i < this.N; i++) {
      const v = clamp(this.cur[i], -this.ymax, this.ymax), x = L + i * bw + bw * .15, ww = Math.max(1, bw * .7);
      if (i === this.mark) { ctx.fillStyle = T.wash; ctx.fillRect(L + i * bw, top - 4, bw, h - top - bot + 8); }
      ctx.fillStyle = phaseColor(v >= 0 ? 0 : PI); const hh = Math.abs(v) * sc; ctx.fillRect(x, v >= 0 ? mid - hh : mid, ww, hh);
      if (lab) {
        ctx.fillStyle = i === this.mark ? T.copper : T.ink; ctx.textAlign = 'center';
        ctx.font = `500 ${bw > 46 ? 12 : 10}px "STIX Two Text","Noto Sans Math",serif`;
        ctx.fillText(this.o.labels ? this.o.labels[i] : String(i), L + i * bw + bw / 2, h - 11);
      }
    }
    if (this.mean != null) {
      const y = mid - this.mean * sc; ctx.strokeStyle = T.copper; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(w - 8, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.copper; ctx.font = '600 11px "JetBrains Mono",monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('average', w - 10, y - 3);
    }
  }
}

/* ---------- plot frame ---------- */
function axes(ctx, w, h, o) {
  const pad = Object.assign({ l: 50, r: 14, t: 14, b: 34 }, o.pad || {});
  const L = pad.l, R = w - pad.r, Tp = pad.t, B = h - pad.b;
  const tx = o.xlog ? Math.log10 : v => v, ty = o.ylog ? Math.log10 : v => v;
  const x0 = tx(o.x[0]), x1 = tx(o.x[1]), y0 = ty(o.y[0]), y1 = ty(o.y[1]);
  const X = v => L + (tx(v) - x0) / (x1 - x0) * (R - L), Y = v => B - (ty(v) - y0) / (y1 - y0) * (B - Tp);
  const T = Theme.get();
  ctx.font = '500 10.5px "JetBrains Mono",monospace'; ctx.lineWidth = 1;
  for (const v of o.yt || []) {
    const y = Math.round(Y(v)) + .5; ctx.strokeStyle = T.line; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = T.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(o.yf ? o.yf(v) : String(v), L - 6, y);
  }
  for (const v of o.xt || []) {
    const x = Math.round(X(v)) + .5; ctx.strokeStyle = T.line; ctx.beginPath(); ctx.moveTo(x, B); ctx.lineTo(x, B + 4); ctx.stroke();
    if (o.xgrid) { ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(x, Tp); ctx.lineTo(x, B); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.fillStyle = T.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(o.xf ? o.xf(v) : String(v), x, B + 7);
  }
  ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.moveTo(L + .5, Tp); ctx.lineTo(L + .5, B + .5); ctx.lineTo(R, B + .5); ctx.stroke();
  ctx.fillStyle = T.muted; ctx.font = '600 10.5px "JetBrains Mono",monospace';
  if (o.xl) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(o.xl, R, h - 2); }
  if (o.yl) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(o.yl, L + 6, Tp); }
  return { X, Y, L, R, T: Tp, B };
}
function polyline(ctx, pts, col, lw = 2, dash) {
  if (pts.length < 2) return; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []);
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.setLineDash([]);
}
function dot(ctx, x, y, r, col, ring) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); if (ring) { ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke(); } }
function arrow(ctx, x0, y0, x1, y1, col, lw = 2, head = 9) {
  const len = Math.hypot(x1 - x0, y1 - y0); if (len < .5) return;
  const a = Math.atan2(y1 - y0, x1 - x0), hd = Math.min(head, len * .45);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * hd * .6, y1 - Math.sin(a) * hd * .6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - hd * Math.cos(a - .42), y1 - hd * Math.sin(a - .42)); ctx.lineTo(x1 - hd * Math.cos(a + .42), y1 - hd * Math.sin(a + .42)); ctx.closePath(); ctx.fill();
}
function txt(ctx, s, x, y, o = {}) {
  const T = Theme.get(); ctx.font = o.font || '500 12px "JetBrains Mono",monospace'; ctx.fillStyle = o.color || T.muted;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle'; ctx.fillText(s, x, y);
}
const MATHFONT = s => `500 ${s}px "STIX Two Text","Noto Sans Math",serif`;
function drawPhasor(ctx, cx, cy, R, re, im, label) {
  const T = Theme.get();
  ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(cx - R - 6, cy); ctx.lineTo(cx + R + 6, cy); ctx.moveTo(cx, cy - R - 6); ctx.lineTo(cx, cy + R + 6); ctx.stroke(); ctx.globalAlpha = 1;
  const m = Math.hypot(re, im), ph = Math.atan2(im, re);
  if (m > 2e-3) arrow(ctx, cx, cy, cx + R * re, cy - R * im, phaseColor(ph), 3, 10); else dot(ctx, cx, cy, 3, T.muted);
  txt(ctx, label, cx, cy - R - 16, { font: MATHFONT(17), color: T.ink });
  txt(ctx, 'size ' + num(m, 2) + '  ·  phase ' + num(m > 2e-3 ? ((deg(ph) + 360) % 360) : 0, 0) + '°', cx, cy + R + 18, { font: '500 11px "JetBrains Mono",monospace' });
}

/* ---------- circuit diagrams (SVG) ---------- */
/* ops: {g:'H',q} | {g:'CX',c,t} | {g:'MCX',cs:[…],t} | {g:'CZ',a,b} | {g:'SW',a,b} | {g:'M',q} | {g:'CR',c,t,label} | {g:'CC',q,from,label,sup} */
function opRows(op) {
  if ('q' in op && op.g !== 'CC') return [op.q];
  if (op.g === 'CX' || op.g === 'CR') return [op.c, op.t];
  if (op.g === 'CC') return [op.q, op.from];
  if (op.g === 'MCX') return op.cs.concat([op.t]);
  return [op.a, op.b];
}
function drawCircuit(n, cols, o = {}) {
  const cw = o.cw || 56, rh = o.rh || 52, lw = o.lw || 62, W = lw + cols.length * cw + 18, H = n * rh + 6;
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'circ', role: 'img', 'aria-label': o.aria || 'Quantum circuit diagram' });
  const Y = r => r * rh + rh / 2 + 3, X = c2 => lw + c2 * cw + cw / 2;
  if (o.hi != null && o.hi >= 0) svg.append(sv('rect', { x: lw + o.hi * cw + 2, y: 2, width: cw - 4, height: H - 4, rx: 6, class: 'c-hi' }));
  for (let r = 0; r < n; r++) {
    svg.append(sv('line', { x1: lw - 6, y1: Y(r), x2: W - 10, y2: Y(r), class: 'c-wire' }));
    svg.append(sv('text', { x: 6, y: Y(r), class: 'c-lab' }, o.labels ? o.labels[r] : 'q' + r));
  }
  const box = (x, y, label, sup) => {
    const wd = Math.max(34, label.length > 2 ? 44 : 34);
    svg.append(sv('rect', { x: x - wd / 2, y: y - 17, width: wd, height: 34, rx: 4, class: 'c-box' }));
    svg.append(sv('text', { x: sup ? x - 4 : x, y, class: 'c-txt' }, label));
    if (sup) svg.append(sv('text', { x: x + 3, y: y - 8, class: 'c-sub' }, sup));
  };
  cols.forEach((col, ci) => {
    const x = X(ci);
    for (const op of col) {
      if (op.g === 'CX') {
        svg.append(sv('line', { x1: x, y1: Y(op.c), x2: x, y2: Y(op.t), class: 'c-line' }));
        svg.append(sv('circle', { cx: x, cy: Y(op.c), r: 5.5, class: 'c-dot' }));
        svg.append(sv('circle', { cx: x, cy: Y(op.t), r: 12, class: 'c-tgt' }));
        svg.append(sv('line', { x1: x - 12, y1: Y(op.t), x2: x + 12, y2: Y(op.t), class: 'c-line' }));
        svg.append(sv('line', { x1: x, y1: Y(op.t) - 12, x2: x, y2: Y(op.t) + 12, class: 'c-line' }));
      } else if (op.g === 'MCX') {
        const rows = op.cs.concat([op.t]);
        svg.append(sv('line', { x1: x, y1: Y(Math.min(...rows)), x2: x, y2: Y(Math.max(...rows)), class: 'c-line' }));
        for (const r of op.cs) svg.append(sv('circle', { cx: x, cy: Y(r), r: 5.5, class: 'c-dot' }));
        svg.append(sv('circle', { cx: x, cy: Y(op.t), r: 12, class: 'c-tgt' }));
        svg.append(sv('line', { x1: x - 12, y1: Y(op.t), x2: x + 12, y2: Y(op.t), class: 'c-line' }));
        svg.append(sv('line', { x1: x, y1: Y(op.t) - 12, x2: x, y2: Y(op.t) + 12, class: 'c-line' }));
      } else if (op.g === 'CZ') {
        svg.append(sv('line', { x1: x, y1: Y(op.a), x2: x, y2: Y(op.b), class: 'c-line' }));
        svg.append(sv('circle', { cx: x, cy: Y(op.a), r: 5.5, class: 'c-dot' }));
        svg.append(sv('circle', { cx: x, cy: Y(op.b), r: 5.5, class: 'c-dot' }));
      } else if (op.g === 'SW') {
        svg.append(sv('line', { x1: x, y1: Y(op.a), x2: x, y2: Y(op.b), class: 'c-line' }));
        for (const r of [op.a, op.b]) {
          svg.append(sv('line', { x1: x - 7, y1: Y(r) - 7, x2: x + 7, y2: Y(r) + 7, class: 'c-line' }));
          svg.append(sv('line', { x1: x - 7, y1: Y(r) + 7, x2: x + 7, y2: Y(r) - 7, class: 'c-line' }));
        }
      } else if (op.g === 'CR') {
        svg.append(sv('line', { x1: x, y1: Y(op.c), x2: x, y2: Y(op.t), class: 'c-line' }));
        svg.append(sv('circle', { cx: x, cy: Y(op.c), r: 5.5, class: 'c-dot' }));
        box(x, Y(op.t), op.label);
      } else if (op.g === 'M') {
        const y = Y(op.q);
        svg.append(sv('rect', { x: x - 17, y: y - 17, width: 34, height: 34, rx: 4, class: 'c-box' }));
        svg.append(sv('path', { d: `M${x - 10} ${y + 6} A 11 11 0 0 1 ${x + 10} ${y + 6}`, class: 'c-meter' }));
        svg.append(sv('line', { x1: x, y1: y + 7, x2: x + 7, y2: y - 7, class: 'c-meter' }));
      } else if (op.g === 'CC') {
        svg.append(sv('line', { x1: x, y1: Y(op.from), x2: x, y2: Y(op.q), class: 'c-cl' }));
        svg.append(sv('circle', { cx: x, cy: Y(op.from), r: 4, class: 'c-dot' }));
        box(x, Y(op.q), op.label, op.sup);
      } else box(x, Y(op.q), GATE_LABEL[op.g] || op.g);
    }
  });
  if (o.at != null) { const x = lw + o.at * cw; svg.append(sv('line', { x1: x, y1: 2, x2: x, y2: H - 2, class: 'c-at' })); }
  return { svg, X, Y, cw, rh, lw, W, H };
}

/* ---------- UI helpers ---------- */
function slider(o) {
  const out = h('output', { for: o.id }), inp = h('input', { type: 'range', id: o.id, min: o.min, max: o.max, step: o.step ?? 'any', value: o.value });
  const show = () => { out.textContent = o.fmt ? o.fmt(+inp.value) : inp.value; };
  inp.addEventListener('input', () => { show(); o.on && o.on(+inp.value); });
  show();
  const el = h('div', { class: 'field' }, h('label', { class: 'field-top', for: o.id }, h('span', null, o.label), out), inp);
  el.input = inp; el.val = () => +inp.value;
  el.set = (v, fire) => { inp.value = v; show(); if (fire && o.on) o.on(+inp.value); };
  el.disable = d => { inp.disabled = d; el.classList.toggle('off', !!d); };
  return el;
}
function btn(label, on, cls = '', attrs = {}) { return h('button', Object.assign({ type: 'button', class: 'btn ' + cls, onclick: on }, attrs), label); }
function gateBtn(label, on, title) { return h('button', { type: 'button', class: 'gate', title, 'aria-label': title, onclick: on, html: label }); }
function seg(opts, val, on, label) {
  const el = h('div', { class: 'seg', role: 'group', 'aria-label': label || 'Options' });
  const bs = opts.map(o => { const b = h('button', { type: 'button', onclick: () => { set(o.v); on(o.v); } }, o.label); el.append(b); return [o.v, b]; });
  const set = v => { bs.forEach(([k, b]) => b.setAttribute('aria-pressed', String(k === v))); el.value = v; };
  set(val); el.set = set; return el;
}
function field(label, ...kids) { return h('div', { class: 'stack', style: 'gap:6px' }, h('div', { class: 'ctl-label' }, label), ...kids); }
function fmtSI(x, unit, d = 1) {
  const pre = [[1e-9, 'n'], [1e-6, 'µ'], [1e-3, 'm'], [1, ''], [1e3, 'k']];
  let best = pre[0]; for (const p of pre) if (Math.abs(x) >= p[0] * .9995) best = p;
  return num(x / best[0], d) + ' ' + best[1] + unit;
}
function sci(x, d = 2) {
  if (x === 0) return '0'; if (Math.abs(x) >= 1e-3 && Math.abs(x) < 1e5) return num(x, Math.abs(x) < 1 ? 4 : d);
  const e = Math.floor(Math.log10(Math.abs(x))); return num(x / Math.pow(10, e), d) + ' × 10' + sup(e);
}
function sup(n) { const m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(ch => m[ch] || ch).join(''); }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
function modpow(b, e, m) { let r = 1 % m; b %= m; while (e > 0) { if (e & 1) r = (r * b) % m; b = (b * b) % m; e = Math.floor(e / 2); } return r; }

/* lesson content helpers used inside template strings */
const EQ = s => `<div class="eq"><span>${s}</span></div>`;
const LAB = k => `<div data-lab="${k}"></div>`;
const NOTE = (tag, html) => `<div class="note"><span class="note-tag">${tag}</span>${html}</div>`;
const FR = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
const MX = (rows, pre = '') => `${pre}<span class="mx" style="grid-template-columns:repeat(${rows[0].length},auto)">${rows.flat().map(x => `<span>${x}</span>`).join('')}</span>`;
const m = s => `<span class="m">${s}</span>`;
const LESSONS = [];
