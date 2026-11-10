/* =====================================================================
   Engine additions for the expanded lessons:
   eigenvectors, heat maps, colour maps, small complex matrices
   ===================================================================== */
/* Real symmetric eigen-decomposition (cyclic Jacobi).
   Returns w (ascending eigenvalues) and V (row-major n×n, column k is eigenvector k). */
function eigSymV(A, n) {
  const a = Float64Array.from(A), V = new Float64Array(n * n);
  for (let i = 0; i < n; i++) V[i * n + i] = 1;
  for (let sw = 0; sw < 100; sw++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] ** 2;
    if (off < 1e-26) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q]; if (Math.abs(apq) < 1e-300) continue;
      const th = (a[q * n + q] - a[p * n + p]) / (2 * apq), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), cs = 1 / Math.sqrt(t * t + 1), s = t * cs;
      for (let k = 0; k < n; k++) { const akp = a[k * n + p], akq = a[k * n + q]; a[k * n + p] = cs * akp - s * akq; a[k * n + q] = s * akp + cs * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p * n + k], aqk = a[q * n + k]; a[p * n + k] = cs * apk - s * aqk; a[q * n + k] = s * apk + cs * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k * n + p], vkq = V[k * n + q]; V[k * n + p] = cs * vkp - s * vkq; V[k * n + q] = s * vkp + cs * vkq; }
    }
  }
  const idx = [...Array(n).keys()].sort((i, j) => a[i * n + i] - a[j * n + j]);
  const w = new Float64Array(n), W = new Float64Array(n * n);
  idx.forEach((src, k) => { w[k] = a[src * n + src]; for (let i = 0; i < n; i++) W[i * n + k] = V[i * n + src]; });
  return { w, V: W };
}

/* ---------- heat maps ---------- */
/* Paint an nx × ny grid into an off-screen canvas; f(i, j) returns [r, g, b]. Row j = 0 is the top. */
function heatImage(nx, ny, f) {
  const oc = document.createElement('canvas'); oc.width = nx; oc.height = ny;
  const cx = oc.getContext('2d'), im = cx.createImageData(nx, ny), d = im.data;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const c3 = f(i, j), k = 4 * (j * nx + i); d[k] = c3[0]; d[k + 1] = c3[1]; d[k + 2] = c3[2]; d[k + 3] = 255; }
  cx.putImageData(im, 0, 0); return oc;
}
function drawHeat(ctx, oc, x, y, w, h, smooth) { ctx.imageSmoothingEnabled = !!smooth; ctx.drawImage(oc, x, y, w, h); ctx.imageSmoothingEnabled = true; }
/* sequential map: surface → cyan; diverging map: copper ← surface → cyan */
function seqRGB(t) { const T = Theme.get(); return mixRGB(T.surface2, T.cyan, Math.pow(clamp(t, 0, 1), .85)); }
function divRGB(t) { const T = Theme.get(); t = clamp(t, -1, 1); return t >= 0 ? mixRGB(T.surface, T.cyan, Math.pow(t, .8)) : mixRGB(T.surface, T.copper, Math.pow(-t, .8)); }
function heatLegend(ctx, x, y, w, h, map, labels) {
  const T = Theme.get(), n = 48;
  for (let i = 0; i < n; i++) { const [r, g, b] = map(i / (n - 1)); ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(x + i * w / n, y, w / n + .6, h); }
  ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  if (labels) { txt(ctx, labels[0], x, y + h + 9, { align: 'left', font: '500 10px "JetBrains Mono",monospace' }); txt(ctx, labels[1], x + w, y + h + 9, { align: 'right', font: '500 10px "JetBrains Mono",monospace' }); }
}

/* ---------- complex 2×2 matrices as flat arrays [a, b, c, d] of [re, im] ---------- */
const C2 = {
  mul: (x, y) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]],
  add: (x, y) => [x[0] + y[0], x[1] + y[1]],
  conj: x => [x[0], -x[1]],
  abs2: x => x[0] * x[0] + x[1] * x[1],
  mm(A, B) { const m2 = C2.mul, a2 = C2.add; return [a2(m2(A[0], B[0]), m2(A[1], B[2])), a2(m2(A[0], B[1]), m2(A[1], B[3])), a2(m2(A[2], B[0]), m2(A[3], B[2])), a2(m2(A[2], B[1]), m2(A[3], B[3]))]; },
  dag: A => [C2.conj(A[0]), C2.conj(A[2]), C2.conj(A[1]), C2.conj(A[3])],
  /* |Tr(A† B)| / 2: 1 means equal up to a global phase */
  overlap(A, B) { let re = 0, im = 0; for (let k = 0; k < 4; k++) { re += A[k][0] * B[k][0] + A[k][1] * B[k][1]; im += A[k][0] * B[k][1] - A[k][1] * B[k][0]; } return Math.hypot(re, im) / 2; },
  /* Bloch vector of U|0⟩ */
  bloch0(U) { const a = U[0], b = U[2]; return [2 * (a[0] * b[0] + a[1] * b[1]), 2 * (a[0] * b[1] - a[1] * b[0]), C2.abs2(a) - C2.abs2(b)]; }
};

/* Wootters concurrence of a real two-qubit density matrix (flat 4×4, basis 00, 01, 10, 11) */
function concurrenceReal(rho) {
  const { w, V } = eigSymV(rho, 4), sq = new Float64Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += V[i * 4 + k] * Math.sqrt(Math.max(0, w[k])) * V[j * 4 + k]; sq[i * 4 + j] = s; }
  const YY = [0, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0], til = new Float64Array(16), tmp = new Float64Array(16), Mx = new Float64Array(16);
  const mul = (A, B, O) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += A[i * 4 + k] * B[k * 4 + j]; O[i * 4 + j] = s; } };
  mul(YY, rho, tmp); mul(tmp, YY, til); mul(sq, til, tmp); mul(tmp, sq, Mx);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const s = (Mx[i * 4 + j] + Mx[j * 4 + i]) / 2; Mx[i * 4 + j] = Mx[j * 4 + i] = s; }
  const lam = eigSym(Mx, 4).map(v => Math.sqrt(Math.max(0, v)));
  return Math.max(0, lam[0] - lam[1] - lam[2] - lam[3]);
}
/* reduced density matrix of two qubits (real and imaginary parts, flat 4×4) from a QState */
function rho2(st, qa, qb) {
  const re = new Float64Array(16), im = new Float64Array(16), ma = st.mask(qa), mb = st.mask(qb);
  const sub = i => ((i & ma) ? 2 : 0) | ((i & mb) ? 1 : 0), rest = ~(ma | mb);
  for (let i = 0; i < st.N; i++) for (let j = 0; j < st.N; j++) {
    if ((i & rest) !== (j & rest)) continue;
    const a = sub(i), b = sub(j);
    re[a * 4 + b] += st.re[i] * st.re[j] + st.im[i] * st.im[j]; im[a * 4 + b] += st.im[i] * st.re[j] - st.re[i] * st.im[j];
  }
  return { re, im };
}
/* small seeded shuffle helper */
function shuffled(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/* a canvas that redraws whenever inv() is called; returns { cv, p } */
function plotCanvas(height, draw, style = '') { const cv = canvas('', `height:${height}px;${style}`); return { cv, p: painter(cv, draw) }; }
/* pointer dragging on a canvas: pick(x, y) returns a handle id (or null); move(id, x, y) updates it */
function dragHandles(cv, pick, move, end) {
  let act = null; cv.style.touchAction = 'none'; cv.classList.add('grab');
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => { const [x, y] = pos(e); act = pick(x, y); if (act == null) return; try { cv.setPointerCapture(e.pointerId); } catch (_) {} cv.classList.add('grabbing'); move(act, x, y); e.preventDefault(); });
  cv.addEventListener('pointermove', e => { if (act == null) return; const [x, y] = pos(e); move(act, x, y); });
  const up = () => { if (act != null && end) end(act); act = null; cv.classList.remove('grabbing'); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}
/* format a complex number as a + bi */
function cfmt(re, im, d = 2) { const r = Math.abs(re) < .5 * 10 ** -d ? 0 : re, i = Math.abs(im) < .5 * 10 ** -d ? 0 : im; return num(r, d) + (i < 0 ? ' ' + MINUS + ' ' : ' + ') + num(Math.abs(i), d) + 'i'; }
/* quiz rows [question, options, answer index, reasoning] → quiz objects */
const QZ = rows => rows.map(([q, o, a, why]) => ({ q, o, a, why }));
/* a small HTML legend: items are [label, css colour, dashed?] */
function legendRow(items) {
  return h('div', { class: 'chipline', style: 'gap:4px 14px;font-size:11.5px' }, ...items.map(([s, col, dash]) => h('span', { style: 'display:inline-flex;align-items:center;gap:6px' },
    h('span', { style: `display:inline-block;width:16px;height:0;border-top:3px ${dash ? 'dashed' : 'solid'} ${col}` }), s)));
}
/* standard normal cumulative distribution (Abramowitz–Stegun 7.1.26, |error| < 1.5e-7) */
function normCdf(x) { const t = 1 / (1 + .3275911 * Math.abs(x) / Math.SQRT2), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x / 2); return x >= 0 ? (1 + y) / 2 : (1 - y) / 2; }
/* rotation matrix (complex 2×2, engine format) about unit axis n by angle th */
function Rn2(n, th) { const cs = Math.cos(th / 2), s = Math.sin(th / 2); return [c(cs, -s * n[2]), c(-s * n[1], -s * n[0]), c(s * n[1], -s * n[0]), c(cs, s * n[2])]; }
