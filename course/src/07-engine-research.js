/* =====================================================================
   Engine additions for the research tracks
   ===================================================================== */
const pc32 = v => { v = v - ((v >>> 1) & 0x55555555); v = (v & 0x33333333) + ((v >>> 2) & 0x33333333); return Math.imul((v + (v >>> 4)) & 0x0F0F0F0F, 0x01010101) >>> 24; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* rotation by angle th about a unit axis n: cos(th/2) I − i sin(th/2) n·σ */
function Rn(n, th) { const cs = Math.cos(th / 2), s = Math.sin(th / 2); return [[cs, -s * n[2]], [-s * n[1], -s * n[0]], [s * n[1], -s * n[0]], [cs, s * n[2]]]; }

/* ---------- Aaronson–Gottesman stabilizer tableau, bit-packed ---------- */
class Tableau {
  constructor(n) {
    this.n = n; this.W = (n + 31) >>> 5; const R = 2 * n + 1;
    this.X = new Uint32Array(R * this.W); this.Z = new Uint32Array(R * this.W); this.r = new Uint8Array(R);
    for (let i = 0; i < n; i++) { this.X[i * this.W + (i >>> 5)] |= 1 << (i & 31); this.Z[(n + i) * this.W + (i >>> 5)] |= 1 << (i & 31); }
  }
  gx(row, q) { return (this.X[row * this.W + (q >>> 5)] >>> (q & 31)) & 1; }
  gz(row, q) { return (this.Z[row * this.W + (q >>> 5)] >>> (q & 31)) & 1; }
  H(a) {
    const w = a >>> 5, m = 1 << (a & 31), { X, Z, r, W } = this;
    for (let i = 0, R = 2 * this.n; i < R; i++) { const k = i * W + w, x = X[k] & m, z = Z[k] & m; if (x && z) r[i] ^= 1; X[k] = (X[k] & ~m) | z; Z[k] = (Z[k] & ~m) | x; }
  }
  S(a) {
    const w = a >>> 5, m = 1 << (a & 31), { X, Z, r, W } = this;
    for (let i = 0, R = 2 * this.n; i < R; i++) { const k = i * W + w, x = X[k] & m; if (x && (Z[k] & m)) r[i] ^= 1; if (x) Z[k] ^= m; }
  }
  CX(a, b) {
    const wa = a >>> 5, ma = 1 << (a & 31), wb = b >>> 5, mb = 1 << (b & 31), { X, Z, r, W } = this;
    for (let i = 0, R = 2 * this.n; i < R; i++) {
      const ka = i * W + wa, kb = i * W + wb, xa = (X[ka] & ma) !== 0, za = (Z[ka] & ma) !== 0, xb = (X[kb] & mb) !== 0, zb = (Z[kb] & mb) !== 0;
      if (xa && zb && (xb === za)) r[i] ^= 1;
      if (xa) X[kb] ^= mb; if (zb) Z[ka] ^= ma;
    }
  }
  CZ(a, b) { this.H(b); this.CX(a, b); this.H(b); }
  Xg(a) { this.H(a); this.S(a); this.S(a); this.H(a); }
  Zg(a) { this.S(a); this.S(a); }
  rowsum(h_, i) {
    const { X, Z, r, W } = this; let s = 0;
    for (let w = 0; w < W; w++) {
      const x1 = X[i * W + w], z1 = Z[i * W + w], x2 = X[h_ * W + w], z2 = Z[h_ * W + w];
      const y1 = x1 & z1, xo = x1 & ~z1, zo = ~x1 & z1;
      s += pc32((y1 & z2 & ~x2) | (xo & z2 & x2) | (zo & x2 & ~z2)) - pc32((y1 & x2 & ~z2) | (xo & z2 & ~x2) | (zo & x2 & z2));
      X[h_ * W + w] = x2 ^ x1; Z[h_ * W + w] = z2 ^ z1;
    }
    r[h_] = (((2 * r[h_] + 2 * r[i] + s) % 4) + 4) % 4 === 0 ? 0 : 1;
  }
  copyRow(dst, src) { const W = this.W; this.X.copyWithin(dst * W, src * W, src * W + W); this.Z.copyWithin(dst * W, src * W, src * W + W); this.r[dst] = this.r[src]; }
  clearRow(row) { const W = this.W; this.X.fill(0, row * W, row * W + W); this.Z.fill(0, row * W, row * W + W); this.r[row] = 0; }
  measure(a, rnd = Math.random) {
    const n = this.n; let p = -1;
    for (let i = n; i < 2 * n; i++) if (this.gx(i, a)) { p = i; break; }
    if (p >= 0) {
      for (let i = 0; i < 2 * n; i++) if (i !== p && this.gx(i, a)) this.rowsum(i, p);
      this.copyRow(p - n, p); this.clearRow(p); this.Z[p * this.W + (a >>> 5)] |= 1 << (a & 31);
      this.r[p] = rnd() < .5 ? 1 : 0; return { out: this.r[p], random: true };
    }
    const sc = 2 * n; this.clearRow(sc);
    for (let i = 0; i < n; i++) if (this.gx(i, a)) this.rowsum(sc, i + n);
    return { out: this.r[sc], random: false };
  }
  clone() { const t = new Tableau(this.n); t.X.set(this.X); t.Z.set(this.Z); t.r.set(this.r); return t; }
  pauli(row) { let s = ''; for (let q = 0; q < this.n; q++) { const x = this.gx(row, q), z = this.gz(row, q); s += x && z ? 'Y' : x ? 'X' : z ? 'Z' : 'I'; } return (this.r[row] ? MINUS : '+') + s; }
  /* stabilizer generators in a reduced, readable form (works on a copy) */
  canonical() {
    const t = this.clone(), n = t.n, swap = (a, b) => { if (a === b) return; t.copyRow(2 * n, a); t.copyRow(a, b); t.copyRow(b, 2 * n); };
    let piv = n;
    for (const bitFn of [(i, q) => t.gx(i, q), (i, q) => t.gz(i, q)]) {
      for (let q = 0; q < n && piv < 2 * n; q++) {
        let f = -1; for (let i = piv; i < 2 * n; i++) if (bitFn(i, q)) { f = i; break; }
        if (f < 0) continue; swap(piv, f);
        for (let i = n; i < 2 * n; i++) if (i !== piv && bitFn(i, q)) t.rowsum(i, piv);
        piv++;
      }
    }
    const out = []; for (let i = n; i < 2 * n; i++) out.push(t.pauli(i)); return out;
  }
}

/* ---------- Pauli strings ---------- */
const commutes = (a, b) => { let k = 0; for (let i = 0; i < a.length; i++) if (a[i] !== 'I' && b[i] !== 'I' && a[i] !== b[i]) k++; return k % 2 === 0; };

/* ---------- minimum-weight matching of defects (exact for small sets, greedy otherwise) ---------- */
function matchDefects(k, dist, bdist, exactMax = 16) {
  if (k === 0) return [];
  if (k <= exactMax) {
    const size = 1 << k, cost = new Float64Array(size).fill(-1), ch = new Int16Array(size); cost[0] = 0;
    const f = mask => {
      if (cost[mask] >= 0) return cost[mask];
      let i = 0; while (!((mask >> i) & 1)) i++;
      const rest = mask & ~(1 << i); let best = bdist[i] + f(rest), bj = -1;
      for (let j = i + 1; j < k; j++) if ((rest >> j) & 1) { const c2 = dist[i][j] + f(rest & ~(1 << j)); if (c2 < best) { best = c2; bj = j; } }
      cost[mask] = best; ch[mask] = bj; return best;
    };
    f(size - 1);
    const pairs = []; let mask = size - 1;
    while (mask) { let i = 0; while (!((mask >> i) & 1)) i++; const j = ch[mask]; pairs.push([i, j]); mask &= ~(1 << i); if (j >= 0) mask &= ~(1 << j); }
    return pairs;
  }
  const left = new Set([...Array(k).keys()]), pairs = [];
  while (left.size) {
    let best = Infinity, bi = -1, bj = -1;
    for (const i of left) { if (bdist[i] < best) { best = bdist[i]; bi = i; bj = -1; } for (const j of left) if (j > i && dist[i][j] < best) { best = dist[i][j]; bi = i; bj = j; } }
    pairs.push([bi, bj]); left.delete(bi); if (bj >= 0) left.delete(bj);
  }
  return pairs;
}

/* ---------- rotated surface code of odd distance d ---------- */
const SC_CACHE = {};
function surfaceCode(d) {
  if (SC_CACHE[d]) return SC_CACHE[d];
  const q = (r, c2) => r * d + c2, Zs = [], Xs = [];
  for (let i = 0; i < d - 1; i++) for (let j = 0; j < d - 1; j++) ((i + j) % 2 === 0 ? Zs : Xs).push({ qs: [q(i, j), q(i, j + 1), q(i + 1, j), q(i + 1, j + 1)], kind: 'bulk', i, j });
  for (let j = 0; j < d - 1; j += 2) Xs.push({ qs: [q(0, j), q(0, j + 1)], kind: 'top', i: -1, j });
  for (let j = 1; j < d - 1; j += 2) Xs.push({ qs: [q(d - 1, j), q(d - 1, j + 1)], kind: 'bottom', i: d - 1, j });
  for (let i = 1; i < d - 1; i += 2) Zs.push({ qs: [q(i, 0), q(i + 1, 0)], kind: 'left', i, j: -1 });
  for (let i = 0; i < d - 1; i += 2) Zs.push({ qs: [q(i, d - 1), q(i + 1, d - 1)], kind: 'right', i, j: d - 1 });
  /* decoding graph for X errors: nodes are Z checks plus one boundary node; each data qubit is an edge */
  const nb = Zs.length, B = nb, adj = [...Array(nb + 1)].map(() => []);
  for (let qi = 0; qi < d * d; qi++) {
    const on = []; Zs.forEach((s, si) => { if (s.qs.includes(qi)) on.push(si); });
    if (on.length === 2) { adj[on[0]].push([on[1], qi]); adj[on[1]].push([on[0], qi]); }
    else if (on.length === 1) { adj[on[0]].push([B, qi]); adj[B].push([on[0], qi]); }
  }
  const dist = [], par = [];
  for (let s = 0; s <= nb; s++) {
    const D = new Array(nb + 1).fill(Infinity), P = new Array(nb + 1).fill(null); D[s] = 0; const Q = [s];
    while (Q.length) { const u = Q.shift(); for (const [v, qi] of adj[u]) if (D[v] === Infinity) { D[v] = D[u] + 1; P[v] = [u, qi]; if (v !== B) Q.push(v); } }
    dist.push(D); par.push(P);
  }
  const path = (s, t) => { const out = []; let v = t; while (v !== s) { const [u, qi] = par[s][v]; out.push(qi); v = u; } return out; };
  return SC_CACHE[d] = { d, n: d * d, Zs, Xs, B, dist, path };
}
/* decode a set of X errors; returns {defects, pairs, corr, logical} */
function scDecode(code, err, exactMax = 16) {
  const lit = code.Zs.map(s => s.qs.reduce((a, qi) => a ^ err[qi], 0));
  const def = []; lit.forEach((v, i) => { if (v) def.push(i); });
  const k = def.length, dist = def.map(a => def.map(b => code.dist[a][b])), bd = def.map(a => code.dist[a][code.B]);
  const pairs = matchDefects(k, dist, bd, exactMax), corr = new Uint8Array(code.n);
  for (const [i, j] of pairs) for (const qi of code.path(def[i], j < 0 ? code.B : def[j])) corr[qi] ^= 1;
  let par = 0; for (let c2 = 0; c2 < code.d; c2++) par ^= err[c2] ^ corr[c2];
  return { lit, def, pairs, corr, logical: par === 1 };
}

/* ---------- real symmetric eigenvalues (cyclic Jacobi) ---------- */
function eigSym(A, n) {
  const a = Float64Array.from(A);
  for (let sw = 0; sw < 80; sw++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] ** 2;
    if (off < 1e-24) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q]; if (Math.abs(apq) < 1e-300) continue;
      const th = (a[q * n + q] - a[p * n + p]) / (2 * apq), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), cs = 1 / Math.sqrt(t * t + 1), s = t * cs;
      for (let k = 0; k < n; k++) { const akp = a[k * n + p], akq = a[k * n + q]; a[k * n + p] = cs * akp - s * akq; a[k * n + q] = s * akp + cs * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p * n + k], aqk = a[q * n + k]; a[p * n + k] = cs * apk - s * aqk; a[q * n + k] = s * apk + cs * aqk; }
    }
  }
  const ev = []; for (let i = 0; i < n; i++) ev.push(a[i * n + i]); return ev.sort((x, y) => y - x);
}
/* Schmidt coefficients (squared) across the cut after the first k qubits */
function schmidt(st, k) {
  const n = st.n, left = k <= n - k, D = 1 << (left ? k : n - k), O = 1 << (left ? n - k : k), M = new Float64Array(4 * D * D);
  const idx = (a, b) => left ? a * O + b : b * D + a;
  for (let a = 0; a < D; a++) for (let b = a; b < D; b++) {
    let re = 0, im = 0;
    for (let o = 0; o < O; o++) { const i = idx(a, o), j = idx(b, o); re += st.re[i] * st.re[j] + st.im[i] * st.im[j]; im += st.im[i] * st.re[j] - st.re[i] * st.im[j]; }
    const N2 = 2 * D;
    M[a * N2 + b] = re; M[b * N2 + a] = re; M[(a + D) * N2 + b + D] = re; M[(b + D) * N2 + a + D] = re;
    M[(a + D) * N2 + b] = im; M[(b + D) * N2 + a] = -im; M[a * N2 + b + D] = -im; M[b * N2 + a + D] = im;
  }
  const ev = eigSym(M, 2 * D), out = []; for (let i = 0; i < ev.length; i += 2) out.push(Math.max(0, (ev[i] + ev[i + 1]) / 2)); return out;
}
const entropy = ps => ps.reduce((s, p) => s - (p > 1e-14 ? p * Math.log2(p) : 0), 0);

/* ---------- Bloch sphere: draw the image of the sphere under an affine (channel) map ---------- */
BlochView.prototype.drawShape = function (ctx, T) {
  const { s, t } = this.shape, map = p => [s[0] * p[0] + t[0], s[1] * p[1] + t[1], s[2] * p[2] + t[2]];
  for (const lat of [-60, -30, 0, 30, 60]) { const z = Math.sin(rad(lat)), r0 = Math.cos(rad(lat)); this.curve(ctx, a => map([r0 * Math.cos(a), r0 * Math.sin(a), z]), T.copper, lat === 0 ? 2 : 1.2, .9); }
  for (const lo of [0, 45, 90, 135]) { const ca = Math.cos(rad(lo)), sa = Math.sin(rad(lo)); this.curve(ctx, a => map([Math.cos(a) * ca, Math.cos(a) * sa, Math.sin(a)]), T.copper, 1.2, .9); }
};

/* ---------- code listings with a copy button ---------- */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CODE = (lang, src) => `<div class="code"><div class="code-top"><span>${lang}</span><button type="button" class="btn sm code-copy">Copy</button></div><pre><code>${esc(src.trim())}</code></pre></div>`;
document.addEventListener('click', e => {
  const b = e.target.closest('.code-copy'); if (!b) return;
  const pre = b.closest('.code').querySelector('code'), done = () => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1400); };
  const fallback = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected'; setTimeout(() => { b.textContent = 'Copy'; }, 1400); };
  try { navigator.clipboard.writeText(pre.textContent).then(done, fallback); } catch (_) { fallback(); }
});
window.GLOSSARY_EXTRA = [];
