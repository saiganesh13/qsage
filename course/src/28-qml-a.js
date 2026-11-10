/* =====================================================================
   Research track · quantum machine learning (part A):
   QSVM, quantum neural networks and the parameter-shift rule, QCNNs, ADAPT-VQE
   ===================================================================== */
/* ---------- shared helpers for the QML lessons: real state vectors (qubit 0 = leftmost bit) and Adam ---------- */
const RSIM = {
  zero(n) { const v = new Float64Array(1 << n); v[0] = 1; return v; },
  ry(v, n, q, t) { const m = 1 << (n - 1 - q), c3 = Math.cos(t / 2), s = Math.sin(t / 2); for (let i = 0; i < v.length; i++) if (!(i & m)) { const a = v[i], b = v[i | m]; v[i] = c3 * a - s * b; v[i | m] = s * a + c3 * b; } },
  cz(v, n, a, b) { const ma = 1 << (n - 1 - a), mb = 1 << (n - 1 - b); for (let i = 0; i < v.length; i++) if ((i & ma) && (i & mb)) v[i] = -v[i]; },
  cx(v, n, c3, t) { const mc = 1 << (n - 1 - c3), mt = 1 << (n - 1 - t); for (let i = 0; i < v.length; i++) if ((i & mc) && !(i & mt)) { const a = v[i]; v[i] = v[i | mt]; v[i | mt] = a; } },
  x(v, n, q) { const m = 1 << (n - 1 - q); for (let i = 0; i < v.length; i++) if (!(i & m)) { const a = v[i]; v[i] = v[i | m]; v[i | m] = a; } },
  cry(v, n, c3, q, t) { const mc = 1 << (n - 1 - c3), m = 1 << (n - 1 - q), co = Math.cos(t / 2), s = Math.sin(t / 2); for (let i = 0; i < v.length; i++) if ((i & mc) && !(i & m)) { const a = v[i], b = v[i | m]; v[i] = co * a - s * b; v[i | m] = s * a + co * b; } },
  /* L layers of RY on every qubit followed by an entangler ('cz' ring or 'cx' ladder), then a final RY layer; returns probabilities */
  hea(n, L, P, ent = 'cx') { const v = RSIM.zero(n); let k = 0; for (let l = 0; l < L; l++) { for (let q = 0; q < n; q++) RSIM.ry(v, n, q, P[k++]); if (ent === 'cz') for (let q = 0; q < n; q++) RSIM.cz(v, n, q, (q + 1) % n); else for (let q = 0; q < n - 1; q++) RSIM.cx(v, n, q, q + 1); } for (let q = 0; q < n; q++) RSIM.ry(v, n, q, P[k++]); return v; }
};
function makeAdam(n, lr) { const m = new Float64Array(n), v = new Float64Array(n); let t = 0; return { lr, step(P, g) { t++; for (let k = 0; k < n; k++) { m[k] = .9 * m[k] + .1 * g[k]; v[k] = .999 * v[k] + .001 * g[k] * g[k]; P[k] -= this.lr * (m[k] / (1 - .9 ** t)) / (Math.sqrt(v[k] / (1 - .999 ** t)) + 1e-8); } } }; }
/* line segments of the level set f = lev on a grid (marching squares); F is row-major (gy rows × gx cols) */
function contourSegs(F, gx, gy, lev) {
  const segs = [], at = (i, j) => F[j * gx + i] - lev;
  for (let j = 0; j < gy - 1; j++) for (let i = 0; i < gx - 1; i++) {
    const a = at(i, j), b = at(i + 1, j), c3 = at(i + 1, j + 1), d = at(i, j + 1), pts = [];
    const e = (x0, y0, x1, y1, v0, v1) => { if ((v0 < 0) !== (v1 < 0)) { const t = v0 / (v0 - v1); pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); } };
    e(i, j, i + 1, j, a, b); e(i + 1, j, i + 1, j + 1, b, c3); e(i + 1, j + 1, i, j + 1, c3, d); e(i, j + 1, i, j, d, a);
    if (pts.length >= 2) segs.push([pts[0], pts[1]]); if (pts.length === 4) segs.push([pts[2], pts[3]]);
  }
  return segs;
}

(() => {
const VQA = 9;

/* ---------- QSVM: ZZ feature map on two qubits, trained with SMO ---------- */
function zzState(x, bw) {
  const a1 = (x[0] + 1) * PI * bw, a2 = (x[1] + 1) * PI * bw, a12 = (PI - a1) * (PI - a2);
  const ph = [0, 1, 2, 3].map(z => { const z1 = z & 2 ? -1 : 1, z2 = z & 1 ? -1 : 1; return a1 * z1 + a2 * z2 + a12 * z1 * z2; });
  const H2 = (re, im) => { const o = [[0, 0], [0, 0], [0, 0], [0, 0]]; for (let r = 0; r < 4; r++) for (let c3 = 0; c3 < 4; c3++) { const s = ((r & c3 & 2 ? 1 : 0) + (r & c3 & 1 ? 1 : 0)) % 2 ? -.5 : .5; o[r][0] += s * re[c3]; o[r][1] += s * im[c3]; } return [o.map(z => z[0]), o.map(z => z[1])]; };
  const D = (re, im) => [re.map((r, z) => r * Math.cos(ph[z]) - im[z] * Math.sin(ph[z])), im.map((i, z) => re[z] * Math.sin(ph[z]) + i * Math.cos(ph[z]))];
  let [re, im] = H2([1, 0, 0, 0], [0, 0, 0, 0]); [re, im] = D(re, im); [re, im] = H2(re, im); [re, im] = D(re, im);
  return [re, im];
}
const zzK = (A, B) => { let r = 0, i = 0; for (let z = 0; z < 4; z++) { r += A[0][z] * B[0][z] + A[1][z] * B[1][z]; i += A[0][z] * B[1][z] - A[1][z] * B[0][z]; } return r * r + i * i; };
function smo(K, y, C, rnd) {
  const n = y.length, al = new Float64Array(n); let b = 0, passes = 0, it = 0;
  const f = i => { let s = b; for (let j = 0; j < n; j++) if (al[j]) s += al[j] * y[j] * K[j * n + i]; return s; };
  while (passes < 6 && it++ < 400) {
    let changed = 0;
    for (let i = 0; i < n; i++) {
      const Ei = f(i) - y[i];
      if ((y[i] * Ei < -1e-3 && al[i] < C) || (y[i] * Ei > 1e-3 && al[i] > 0)) {
        let j = Math.floor(rnd() * (n - 1)); if (j >= i) j++;
        const Ej = f(j) - y[j], ai = al[i], aj = al[j];
        const L = y[i] !== y[j] ? Math.max(0, aj - ai) : Math.max(0, ai + aj - C), Hh = y[i] !== y[j] ? Math.min(C, C + aj - ai) : Math.min(C, ai + aj);
        if (Hh - L < 1e-9) continue; const eta = 2 * K[i * n + j] - K[i * n + i] - K[j * n + j]; if (eta >= 0) continue;
        let nj = clamp(aj - y[j] * (Ei - Ej) / eta, L, Hh); if (Math.abs(nj - aj) < 1e-6) continue;
        const ni = ai + y[i] * y[j] * (aj - nj); al[i] = ni; al[j] = nj;
        const b1 = b - Ei - y[i] * (ni - ai) * K[i * n + i] - y[j] * (nj - aj) * K[i * n + j], b2 = b - Ej - y[i] * (ni - ai) * K[i * n + j] - y[j] * (nj - aj) * K[j * n + j];
        b = ni > 0 && ni < C ? b1 : nj > 0 && nj < C ? b2 : (b1 + b2) / 2; changed++;
      }
    }
    passes = changed ? 0 : passes + 1;
  }
  return { al, b };
}
function svmData(kind, n, rnd) {
  const pts = [];
  for (let k = 0; k < n; k++) {
    let x, y;
    if (kind === 'circles') { const lab = k % 2, r = lab ? .35 + .12 * rnd() : .7 + .15 * rnd(), a = TAU * rnd(); x = [r * Math.cos(a), r * Math.sin(a)]; y = lab ? 1 : -1; }
    else if (kind === 'xor') { x = [rnd() * 1.8 - .9, rnd() * 1.8 - .9]; y = x[0] * x[1] > 0 ? 1 : -1; if (Math.abs(x[0]) < .08 || Math.abs(x[1]) < .08) { k--; continue; } }
    else { const lab = k % 2, t = PI * rnd(); x = lab ? [Math.cos(t) * .6 - .25, Math.sin(t) * .6 - .15] : [.25 - Math.cos(t) * .6, .15 - Math.sin(t) * .6 + .05]; x = x.map(v => v + (rnd() - .5) * .12); y = lab ? 1 : -1; }
    pts.push({ x, y });
  }
  return pts;
}

LESSONS.push({
  id: 'qsvm', n: 37.55, stage: VQA, minutes: 16, title: 'Quantum support vector machines (QSVM)',
  lede: 'A support vector machine draws the widest possible margin between two classes. Swap its kernel for overlaps of quantum states and you have a QSVM, one of the first quantum machine-learning methods run on hardware.',
  html: `
<h2>Support vector machines in one page</h2>
<p>Given labelled points ${m('(xᵢ, yᵢ)')} with ${m('yᵢ = ±1')}, a linear SVM finds the line (or hyperplane) that separates the classes with the largest margin. Most points end up irrelevant: the solution depends only on the few <strong>support vectors</strong> that sit on or inside the margin. Training is a convex quadratic program, written in its dual form as</p>
${EQ('max<sub>α</sub> Σ<sub>i</sub> αᵢ − ½ Σ<sub>ij</sub> αᵢαⱼ yᵢyⱼ K(xᵢ, xⱼ) &nbsp;&nbsp; subject to 0 ≤ αᵢ ≤ C, &nbsp; Σ<sub>i</sub> αᵢyᵢ = 0')}
<p>with decision function ${m('f(x) = Σ<sub>i</sub> αᵢyᵢK(xᵢ, x) + b')}. The data enter only through the <strong>kernel</strong> ${m('K')}, an inner product in some feature space, so a non-linear kernel draws curved boundaries without ever computing the features. The constant ${m('C')} trades margin width against training errors: small ${m('C')} gives a wide, tolerant margin; large ${m('C')} fits the training data tightly.</p>
<h2>The quantum kernel</h2>
<p>Havlíček and colleagues at IBM (Nature, 2019) proposed using a quantum circuit as the feature map. A data point ${m('x')} is encoded by a circuit ${m('U(x)')}, and the kernel is the overlap of two encoded states,</p>
${EQ('K(x, x′) = |⟨φ(x′)|φ(x)⟩|², &nbsp;&nbsp; |φ(x)⟩ = U<sub>Φ</sub>(x) H<sup>⊗n</sup> U<sub>Φ</sub>(x) H<sup>⊗n</sup> |0⟩, &nbsp;&nbsp; U<sub>Φ</sub>(x) = exp(i Σ<sub>i</sub> xᵢZᵢ + i Σ<sub>i&lt;j</sub> (π − xᵢ)(π − xⱼ) ZᵢZⱼ)')}
<p>which the hardware estimates as the probability of returning to ${m('|0…0⟩')} after running ${m('U(x)')} followed by ${m('U(x′)<sup>†</sup>')}. Everything else, the SMO optimizer, the margin and the predictions, is classical. They argued that this “ZZ feature map” is hard to compute classically for many qubits, and demonstrated the method on two superconducting qubits.</p>
${LAB('train')}
<h2>Practical issues</h2>
<ul>
<li><strong>Cost.</strong> Training needs all ${m('n²/2')} kernel entries for ${m('n')} training points, each estimated from many shots, and prediction needs the kernel between each new point and every support vector.</li>
<li><strong>Shot noise.</strong> A kernel matrix estimated with finite shots may not be positive semidefinite, which breaks the convex optimization; it is usually projected back onto the positive semidefinite cone or regularized.</li>
<li><strong>Concentration and advantage.</strong> On many qubits, expressive feature maps make kernel values exponentially small and nearly equal, and no practical advantage on classical data has been shown. Provable advantages exist for specially constructed problems ([[L:kernels]]).</li>
<li><strong>A different “quantum SVM”.</strong> Rebentrost, Mohseni and Lloyd (2014) proposed solving a least-squares SVM with HHL-style matrix inversion. That approach inherits the fine print of [[L:hhl]]: it needs quantum RAM, and dequantized classical algorithms compete with it for low-rank data.</li>
</ul>
`,
  labs: {
    train: {
      title: 'Train a QSVM',
      cap: 'Thirty training points (filled) and thirty test points (hollow) in two classes. The SVM is trained by sequential minimal optimization on the chosen kernel: the two-qubit ZZ feature map, computed exactly here, or a classical Gaussian kernel for comparison. The background shows the decision function f(x), the solid line is the boundary f = 0 and the dashed lines are the margins f = ±1. Ringed points are support vectors; everything else could be deleted without changing the classifier.',
      build(body, id) {
        let kind = 'circles', kern = 'zz', lgC = 0, bw = .5, gam = 3, seed = 3, data = null, model = null;
        const cv = canvas('sq', 'max-width:420px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), ctl = h('div', { class: 'stack' });
        const G = 70;
        const kfun = () => { if (kern === 'zz') { const cache = new Map(); const st = x => { const k = x[0] + ',' + x[1]; if (!cache.has(k)) cache.set(k, zzState(x, bw)); return cache.get(k); }; return (a, b) => zzK(st(a), st(b)); } return (a, b) => Math.exp(-gam * ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)); };
        const fit = () => {
          const r = rng(seed), all = svmData(kind, 60, r), tr = all.slice(0, 30), te = all.slice(30), kf = kfun(), n = tr.length, K = new Float64Array(n * n);
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) K[i * n + j] = kf(tr[i].x, tr[j].x);
          const { al, b } = smo(K, tr.map(p => p.y), 10 ** lgC, rng(seed + 99)), sv = [...al.keys()].filter(i => al[i] > 1e-6);
          const f = x => sv.reduce((s, i) => s + al[i] * tr[i].y * kf(tr[i].x, x), b);
          const F = new Float64Array(G * G); for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) F[j * G + i] = f([-1 + 2 * i / (G - 1), 1 - 2 * j / (G - 1)]);
          const acc = set => set.filter(p => Math.sign(f(p.x)) === p.y).length / set.length;
          data = { tr, te }; model = { al, sv, F, atr: acc(tr), ate: acc(te) }; p.inv(); text();
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!model) return; const T = Theme.get(), S = Math.min(w, H), ox = (w - S) / 2, X = v => ox + (v + 1) / 2 * S, Y = v => (1 - v) / 2 * S;
          const img = heatImage(G, G, (i, j) => divRGB(Math.tanh(model.F[j * G + i] * .8) * .85)); drawHeat(ctx, img, ox, 0, S, S, true);
          const gx = v => ox + v / (G - 1) * S, gy = v => v / (G - 1) * S;
          for (const [lev, dash, lw] of [[0, null, 2.2], [1, [5, 4], 1.3], [-1, [5, 4], 1.3]]) { ctx.strokeStyle = T.ink; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath(); for (const [a, b] of contourSegs(model.F, G, G, lev)) { ctx.moveTo(gx(a[0]), gy(a[1])); ctx.lineTo(gx(b[0]), gy(b[1])); } ctx.stroke(); } ctx.setLineDash([]);
          data.te.forEach(pt => { ctx.strokeStyle = pt.y > 0 ? T.cyan : T.copper; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(pt.x[0]), Y(pt.x[1]), 4, 0, TAU); ctx.stroke(); });
          data.tr.forEach((pt, i) => { dot(ctx, X(pt.x[0]), Y(pt.x[1]), 4.6, pt.y > 0 ? T.cyan : T.copper, T.surface); if (model.al[i] > 1e-6) { ctx.strokeStyle = T.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(X(pt.x[0]), Y(pt.x[1]), 8.5, 0, TAU); ctx.stroke(); } });
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.strokeRect(ox + .5, .5, S - 1, S - 1);
        });
        const text = () => { ro.innerHTML = `<span class="k">support vectors </span>${model.sv.length} of ${data.tr.length}<br><span class="k">training accuracy </span>${pct(model.atr, 0)} &nbsp; <span class="k">test accuracy </span>${pct(model.ate, 0)}<br><span class="k">kernel evaluations to train </span>${(data.tr.length * (data.tr.length + 1) / 2).toLocaleString('en-US')}`; };
        let pend = null; const later = () => { if (pend) return; pend = Scope.later(60, () => { pend = null; fit(); }); };
        const mk = () => { ctl.innerHTML = ''; ctl.append(slider({ id: id('c'), label: 'Regularization C', min: -1, max: 2, step: .1, value: lgC, fmt: v => num(10 ** v, v < 0 ? 2 : 1), on: v => { lgC = v; later(); } }),
          kern === 'zz' ? slider({ id: id('bw'), label: 'Feature-map scale (bandwidth)', min: .1, max: 1, step: .05, value: bw, fmt: v => num(v, 2), on: v => { bw = v; later(); } }) : slider({ id: id('g'), label: 'Gaussian width parameter γ', min: .3, max: 20, step: .1, value: gam, fmt: v => num(v, 1), on: v => { gam = v; later(); } })); };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'circles', label: 'Circles' }, { v: 'xor', label: 'XOR' }, { v: 'moons', label: 'Moons' }], kind, v => { kind = v; fit(); }, 'Dataset'), seg([{ v: 'zz', label: 'Quantum ZZ kernel' }, { v: 'rbf', label: 'Gaussian kernel' }], kern, v => { kern = v; mk(); fit(); }, 'Kernel'), btn('New data', () => { seed++; fit(); }, 'sm')),
          h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, ctl, ro, legendRow([['boundary f = 0', 'var(--ink)'], ['margins f = ±1', 'var(--ink)', 1]]))));
        mk(); fit();
      }
    }
  },
  take: ['An SVM maximizes the margin between classes; its dual depends on the data only through a kernel, and the solution through a few support vectors.',
    'A QSVM uses a quantum feature map: K(x, x′) = |⟨φ(x′)|φ(x)⟩|², estimated on hardware; the optimization stays classical.',
    'The ZZ feature map of Havlíček et al. was proposed as hard to simulate classically; training needs O(n²) kernel estimates, each with shot noise.',
    'Kernel concentration and the lack of demonstrated advantage on classical data are the main caveats; HHL-based quantum SVMs carry quantum-RAM assumptions.'],
  quiz: QZ([
    ['What does an SVM maximize?', ['The number of support vectors', 'The margin between the separating boundary and the nearest points of each class', 'The training loss', 'The number of features'], 1, 'A wide margin generalizes better; the boundary is placed as far as possible from both classes.'],
    ['What are support vectors?', ['All training points', 'The training points with non-zero αᵢ, on or inside the margin, which alone determine the classifier', 'The test points', 'Random points'], 1, 'Points with αᵢ = 0 drop out of f(x) = Σαᵢyᵢ K(xᵢ, x) + b.'],
    ['Why can an SVM use a quantum computer only for the kernel?', ['Quantum computers cannot optimize', 'The dual problem and the decision function depend on the data only through kernel values K(xᵢ, xⱼ)', 'Because SVMs are linear', 'Because of the margin'], 1, 'Once the kernel matrix is known, training is a classical convex quadratic program.'],
    ['How is a quantum kernel entry K(x, x′) usually estimated?', ['By state tomography', 'Run U(x), then U(x′)†, and measure the probability of returning to |0…0⟩', 'By measuring one qubit once', 'Classically from the data'], 1, 'That probability equals |⟨φ(x′)|φ(x)⟩|²; a swap test is an alternative using two registers.'],
    ['What does the regularization constant C control?', ['The number of qubits', 'The trade-off between a wide margin and fitting every training point', 'The kernel bandwidth', 'The learning rate'], 1, 'Small C tolerates misclassified training points for a wider margin; large C fits the training set tightly and can overfit.'],
    ['Why can a finite-shot kernel matrix cause trouble?', ['It is too accurate', 'Statistical errors can make it not positive semidefinite, which breaks the convex optimization', 'It becomes diagonal', 'It has the wrong size'], 1, 'Kernel matrices must be positive semidefinite; noisy estimates are often projected back or regularized.'],
    ['How many kernel evaluations does training on n points need?', ['n', 'About n²/2, one per pair', 'log n', 'n³'], 1, 'The full symmetric kernel matrix is needed, which for large datasets is a substantial number of circuit runs.'],
    ['In the lab, what happens when the feature-map scale is very large?', ['Nothing', 'Encoded states become nearly orthogonal unless the points are very close, so the classifier memorizes training points and test accuracy drops', 'The kernel becomes linear', 'The margin becomes infinite'], 1, 'A too-sharp kernel overfits, an early sign of the concentration problem on many qubits.'],
    ['What was the original argument for the ZZ feature map?', ['It is cheap to simulate', 'Its kernel was conjectured hard to compute classically for many qubits, so a quantum computer would be needed to evaluate it', 'It has no entanglement', 'It is the same as the Gaussian kernel'], 1, 'Hardness of simulation is necessary for any advantage, though not sufficient for useful learning.'],
    ['What does the HHL-based quantum SVM of Rebentrost, Mohseni and Lloyd require?', ['Nothing special', 'Efficient quantum access to the data (quantum RAM) and well-conditioned matrices, the same fine print as HHL', 'Only two qubits', 'A classical kernel'], 1, 'Its exponential speedup claims depend on data-loading assumptions, and dequantized algorithms compete for low-rank data.']
  ])
});

/* ---------- QNN: parameter shift and Fourier expressivity ---------- */
/* single-qubit complex helpers for the re-uploading model U = W_L S(x) … W_1 S(x) W_0, S(x) = RZ(x), W = RY·RZ·RY */
const q1 = {
  ry(s, t) { const c3 = Math.cos(t / 2), sn = Math.sin(t / 2); return [c3 * s[0] - sn * s[2], c3 * s[1] - sn * s[3], sn * s[0] + c3 * s[2], sn * s[1] + c3 * s[3]]; },
  rz(s, t) { const c3 = Math.cos(t / 2), sn = Math.sin(t / 2); return [s[0] * c3 + s[1] * sn, s[1] * c3 - s[0] * sn, s[2] * c3 - s[3] * sn, s[3] * c3 + s[2] * sn]; },
  model(x, P, L) { let s = [1, 0, 0, 0], k = 0; for (let l = 0; l <= L; l++) { s = q1.ry(s, P[k++]); s = q1.rz(s, P[k++]); s = q1.ry(s, P[k++]); if (l < L) s = q1.rz(s, x); } return s[0] * s[0] + s[1] * s[1] - s[2] * s[2] - s[3] * s[3]; }
};

LESSONS.push({
  id: 'qnn', n: 37.05, stage: VQA, minutes: 17, title: 'Quantum neural networks and the parameter-shift rule',
  lede: 'A quantum neural network is a parametrized circuit trained like a neural network. Two facts shape everything about it: gradients come from running the circuit at shifted angles, and the functions it can represent are Fourier series fixed by how the data are encoded.',
  html: `
<h2>The model</h2>
<p>A <strong>quantum neural network</strong> (QNN) encodes an input ${m('x')} with data-dependent gates, interleaves them with trainable gates ${m('W(θ)')}, and outputs an expectation value ${m('f<sub>θ</sub>(x) = ⟨0|U(x, θ)<sup>†</sup> O U(x, θ)|0⟩')}. Training adjusts ${m('θ')} to minimize a loss, exactly as for a classical network. The name is an analogy, not a claim of similarity: there are no neurons, and the model is linear in the quantum state, with non-linearity entering only through how ${m('x')} is encoded and through measurement. [[L:qml]] covers data re-uploading and barren plateaus; this lesson covers how QNNs are trained and what they can express.</p>
<h2>Gradients from the circuit itself: the parameter-shift rule</h2>
<p>Backpropagation needs access to intermediate values, which a quantum computer cannot provide without measuring and destroying the state. But for a gate ${m('e<sup>−iθP/2</sup>')} generated by a Pauli operator ${m('P')}, the output depends on ${m('θ')} as ${m('a + b cos θ + c sin θ')}, and so its derivative is exactly</p>
${EQ('∂f/∂θ = ½ [ f(θ + π/2) − f(θ − π/2) ]')}
<p>This <strong>parameter-shift rule</strong> (Mitarai and colleagues, 2018; Schuld and colleagues, 2019) is exact, not an approximation: two runs of the same circuit at shifted angles give an unbiased gradient estimate. A finite difference ${m('[f(θ + h) − f(θ − h)]/2h')} with small ${m('h')} looks similar but is disastrous on hardware, because shot noise in ${m('f')} is divided by ${m('h')}.</p>
${LAB('shift')}
<p>The price is that every parameter needs its own pair of circuits, so a gradient of ${m('p')} parameters costs ${m('2p')} circuit evaluations, each repeated for many shots. Classical backpropagation computes all ${m('p')} derivatives for a few times the cost of one evaluation, and Abbas and colleagues (2023) showed that QNNs cannot match this scaling in general, which limits how large trainable QNNs can practically become.</p>
<h2>What a QNN can express</h2>
<p>Schuld, Sweke and Meyer (2021) showed that if the input enters through gates ${m('e<sup>−ixH</sup>')}, the model is a Fourier series in ${m('x')}, and the available frequencies are the differences between eigenvalues of the encoding generator. With ${m('L')} repetitions of ${m('R<sub>z</sub>(x)')} the model is</p>
${EQ('f<sub>θ</sub>(x) = Σ<sub>ω = −L</sub><sup>L</sup> c<sub>ω</sub>(θ) e<sup>iωx</sup>')}
<p>The trainable gates choose the coefficients, but only the encoding decides which frequencies exist. One encoding gate can only ever fit a sinusoid of frequency 1, however many trainable parameters surround it. Repeating the encoding (data re-uploading), or encoding in parallel on several qubits, enlarges the spectrum.</p>
${LAB('fourier')}
${NOTE('Where QNNs stand', `<p>QNNs are trained by the same variational loop as VQE ([[L:variational]]) and face the same obstacles: barren plateaus for deep or highly entangling circuits, shot noise, and hardware noise. Recent work also shows that many trainable QNNs without barren plateaus can be simulated efficiently classically, which suggests that useful quantum advantage will need models or data that are structured very differently from classical networks.</p>`)}
`,
  labs: {
    shift: {
      title: 'Parameter shift versus finite differences',
      cap: 'The circuit is R_y(θ)|0⟩ measured in Z, so f(θ) = cos θ and the true gradient is −sin θ (dashed line on the right). Each estimate uses the chosen number of shots per circuit evaluation. Left: 200 independent parameter-shift estimates; middle: 200 finite-difference estimates with step h. Small h makes finite differences explode with noise, large h biases them; the parameter-shift rule is unbiased with modest spread at any θ.',
      build(body, id) {
        let th = 1, lgS = 2, lgH = -1, res = null;
        const cv = canvas('', 'height:240px'), cf = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const est = (t, S) => { const pr = (1 + Math.cos(t)) / 2; let k = 0; if (S <= 300) { for (let i = 0; i < S; i++) if (Math.random() < pr) k++; } else k = clamp(Math.round(S * pr + Math.sqrt(S * pr * (1 - pr)) * randn()), 0, S); return 2 * k / S - 1; };
        const run = () => { const S = Math.round(10 ** lgS), hh = 10 ** lgH, ps = [], fd = []; for (let r = 0; r < 200; r++) { ps.push((est(th + PI / 2, S) - est(th - PI / 2, S)) / 2); fd.push((est(th + hh, S) - est(th - hh, S)) / (2 * hh)); } res = { ps, fd }; q.inv(); qf.inv(); text(); };
        const stats = a => { const mu = a.reduce((s, x) => s + x, 0) / a.length; return [mu, Math.sqrt(a.reduce((s, x) => s + (x - mu) ** 2, 0) / a.length)]; };
        const q = painter(cv, ({ ctx, w, h: H }) => {
          if (!res) return; const T = Theme.get(), g = -Math.sin(th), A = axes(ctx, w, H, { x: [0, 2], y: [-3, 3], xt: [], yt: [-3, -2, -1, 0, 1, 2, 3], xl: '', yl: 'gradient estimate', pad: { l: 34 } });
          ctx.setLineDash([5, 4]); ctx.strokeStyle = T.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(A.L, A.Y(g)); ctx.lineTo(A.R, A.Y(g)); ctx.stroke(); ctx.setLineDash([]);
          const col = (arr, x0, c3) => arr.forEach(v => { if (Math.abs(v) > 3.2) return; ctx.fillStyle = rgba(c3, .45); ctx.beginPath(); ctx.arc(A.X(x0 + (Math.random() - .5) * .5), A.Y(v), 2.2, 0, TAU); ctx.fill(); });
          col(res.ps, .5, T.cyan); col(res.fd, 1.5, T.copper);
          txt(ctx, 'parameter shift', A.X(.5), A.B + 12, { font: '600 10.5px "JetBrains Mono",monospace', color: T.cyan }); txt(ctx, 'finite difference', A.X(1.5), A.B + 12, { font: '600 10.5px "JetBrains Mono",monospace', color: T.copper });
          const out = res.fd.filter(v => Math.abs(v) > 3.2).length; if (out) txt(ctx, `${out} off the chart`, A.X(1.5), A.T + 8, { font: '500 10px "JetBrains Mono",monospace' });
        });
        const qf = painter(cf, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-PI, PI], y: [-1.1, 1.1], xt: [-PI, 0, PI], xf: v => v < -1 ? '−π' : v > 1 ? 'π' : '0', yt: [-1, 0, 1], xl: 'θ', yl: 'f(θ) = ⟨Z⟩' });
          const pts = []; for (let t = -PI; t <= PI + 1e-9; t += .05) pts.push([A.X(t), A.Y(Math.cos(t))]); polyline(ctx, pts, T.muted, 2);
          const tw = ((th + PI) % TAU + TAU) % TAU - PI; for (const [d, c3] of [[PI / 2, T.cyan], [-PI / 2, T.cyan]]) { const t2 = ((tw + d + PI) % TAU + TAU) % TAU - PI; dot(ctx, A.X(t2), A.Y(Math.cos(t2)), 5, c3, T.surface); }
          const hh = 10 ** lgH; for (const d of [hh, -hh]) dot(ctx, A.X(clamp(tw + d, -PI, PI)), A.Y(Math.cos(tw + d)), 4, T.copper, T.surface);
          dot(ctx, A.X(tw), A.Y(Math.cos(tw)), 5.5, T.ink, T.surface);
        });
        const text = () => { const [m1, s1] = stats(res.ps), [m2, s2] = stats(res.fd), g = -Math.sin(th); ro.innerHTML = `<span class="k">true gradient </span>${num(g, 3)}<br><span class="k">parameter shift </span>mean ${num(m1, 3)}, spread ${num(s1, 3)}<br><span class="k">finite difference </span>mean ${num(m2, 3)}, spread ${num(s2, 3)}<br><span class="k">finite-difference bias </span>${num(g * (Math.sin(10 ** lgH) / 10 ** lgH - 1), 4)}`; };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, cf), h('div', { class: 'stack' },
          slider({ id: id('t'), label: 'Parameter θ', min: -PI, max: PI, step: .01, value: th, fmt: v => num(v, 2), on: v => { th = v; run(); } }),
          slider({ id: id('s'), label: 'Shots per circuit evaluation', min: 1, max: 4, step: .1, value: lgS, fmt: v => Math.round(10 ** v).toLocaleString('en-US'), on: v => { lgS = v; run(); } }),
          slider({ id: id('h'), label: 'Finite-difference step h', min: -2.5, max: .2, step: .1, value: lgH, fmt: v => num(10 ** v, 3), on: v => { lgH = v; run(); } }),
          btn('Resample', run, 'sm'), ro)));
        run();
      }
    },
    fourier: {
      title: 'A QNN is a Fourier series',
      cap: 'A single-qubit QNN with L encoding gates R_z(x), each sandwiched between trainable rotations, is trained live (parameter-shift gradients, Adam) to fit the target on 40 sample points. Left: target (dashed) and model. Right: magnitudes of the Fourier coefficients of target and model. However long you train, the model has no frequencies above L; add encoding layers to fit sharper targets.',
      build(body, id) {
        let L = 1, tgt = 'sq', P = null, opt = null, it = 0, running = true, hist = [];
        const XS = [...Array(40)].map((_, i) => -PI + TAU * (i + .5) / 40);
        const TG = { sin: x => Math.sin(x), mix: x => .6 * Math.sin(3 * x) + .3 * Math.cos(x), sq: x => .8 * Math.tanh(4 * Math.sin(x)), saw: x => .8 * (((x + PI) % TAU) / PI - 1) };
        const cv = canvas('', 'height:240px'), cs = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const reset = () => { const r = rng(17 + L); P = Array.from({ length: 3 * (L + 1) }, () => (r() - .5) * 2); opt = makeAdam(P.length, .05); it = 0; hist = []; running = true; runB.textContent = 'Pause'; };
        const loss = () => XS.reduce((s, x) => s + (q1.model(x, P, L) - TG[tgt](x)) ** 2, 0) / XS.length;
        const step = () => { const g = P.map((_, k) => { const Pp = P.slice(), Pm = P.slice(); Pp[k] += PI / 2; Pm[k] -= PI / 2; let s = 0; for (const x of XS) s += 2 * (q1.model(x, P, L) - TG[tgt](x)) * (q1.model(x, Pp, L) - q1.model(x, Pm, L)) / 2; return s / XS.length; }); opt.step(P, g); it++; hist.push(loss()); };
        const coefs = f => { const out = []; for (let w = 0; w <= 6; w++) { let re = 0, im = 0; const K = 256; for (let i = 0; i < K; i++) { const x = -PI + TAU * i / K, v = f(x); re += v * Math.cos(w * x) / K; im -= v * Math.sin(w * x) / K; } out.push(Math.hypot(re, im) * (w ? 2 : 1)); } return out; };
        Scope.tick(() => { if (!running || !P) return; for (let k = 0; k < 4; k++) step(); if (it >= 1500) { running = false; runB.textContent = 'Resume'; } q.inv(); qs.inv(); text(); });
        const q = painter(cv, ({ ctx, w, h: H }) => {
          if (!P) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [-PI, PI], y: [-1.1, 1.1], xt: [-PI, 0, PI], xf: v => v < -1 ? '−π' : v > 1 ? 'π' : '0', yt: [-1, 0, 1], xl: 'x', yl: 'f(x)' });
          const tp = [], mp = []; for (let x = -PI; x <= PI + 1e-9; x += .02) { tp.push([A.X(x), A.Y(TG[tgt](x))]); mp.push([A.X(x), A.Y(q1.model(x, P, L))]); }
          polyline(ctx, tp, T.ink, 1.4, [5, 4]); polyline(ctx, mp, T.cyan, 2.6); XS.forEach(x => dot(ctx, A.X(x), A.Y(TG[tgt](x)), 1.8, T.muted));
        });
        const qs = painter(cs, ({ ctx, w, h: H }) => {
          if (!P) return; const T = Theme.get(), ct = coefs(TG[tgt]), cm = coefs(x => q1.model(x, P, L)), A = axes(ctx, w, H, { x: [-.5, 6.5], y: [0, 1], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, .5, 1], xl: 'frequency ω', yl: '|c_ω|' });
          const bw = (A.X(1) - A.X(0)) * .34;
          ct.forEach((v, w_) => { ctx.strokeStyle = T.ink; ctx.lineWidth = 1.4; ctx.setLineDash([3, 2]); ctx.strokeRect(A.X(w_) - bw, A.Y(Math.min(v, 1)), bw, A.B - A.Y(Math.min(v, 1))); ctx.setLineDash([]); ctx.fillStyle = w_ <= L ? T.cyan : rgba(T.muted, .5); ctx.fillRect(A.X(w_), A.Y(Math.min(cm[w_], 1)), bw, A.B - A.Y(Math.min(cm[w_], 1))); });
          ctx.fillStyle = rgba(T.copper, .1); ctx.fillRect(A.X(L + .5), A.T, A.R - A.X(L + .5), A.B - A.T); txt(ctx, 'unreachable', (A.X(L + .5) + A.R) / 2, A.T + 10, { font: '600 10px "JetBrains Mono",monospace', color: T.copper });
        });
        const text = () => { ro.innerHTML = `<span class="k">encoding layers L </span>${L} &nbsp; <span class="k">trainable parameters </span>${P.length}<br><span class="k">iterations </span>${it} &nbsp; <span class="k">mean squared error </span>${sci(hist.length ? hist[hist.length - 1] : loss())}`; };
        const runB = btn('Pause', () => { running = !running; runB.textContent = running ? 'Pause' : 'Resume'; }, 'sm');
        body.append(h('div', { class: 'btns' }, seg([{ v: 'sin', label: 'sin x' }, { v: 'mix', label: '0.6 sin 3x + 0.3 cos x' }, { v: 'sq', label: 'Square-ish wave' }, { v: 'saw', label: 'Sawtooth' }], tgt, v => { tgt = v; reset(); }, 'Target'), runB, btn('Restart', reset, 'sm')),
          h('div', { class: 'split even' }, cv, cs), legendRow([['target', 'var(--ink)', 1], ['QNN model', 'var(--cyan)']]),
          h('div', { class: 'split' }, slider({ id: id('l'), label: 'Encoding layers L', min: 1, max: 6, step: 1, value: L, fmt: String, on: v => { L = v; reset(); } }), ro));
        reset();
      }
    }
  },
  take: ['A QNN is a parametrized circuit whose expectation value is the model output; it is trained by a classical optimizer.',
    'The parameter-shift rule gives exact gradients from two circuit runs per parameter: ∂f/∂θ = ½[f(θ + π/2) − f(θ − π/2)].',
    'Finite differences amplify shot noise by 1/h; and 2p circuits per gradient means QNNs cannot match backpropagation’s scaling.',
    'With encoding gates e^(−ixH), the model is a Fourier series whose frequencies are fixed by the encoding; re-uploading enlarges the spectrum.'],
  quiz: QZ([
    ['What is the output of a QNN?', ['A classical neuron activation', 'An expectation value ⟨O⟩ of a parametrized, data-dependent circuit', 'A single measured bit', 'The full state vector'], 1, 'Expectation values are estimated from shots and used as the model prediction or fed into a loss.'],
    ['Why can’t QNNs use ordinary backpropagation on hardware?', ['They have no parameters', 'Intermediate quantum states cannot be read out without measuring and disturbing them', 'Because gradients are always zero', 'Because the loss is not differentiable'], 1, 'Backpropagation needs stored intermediate values; measuring a quantum state collapses it.'],
    ['What does the parameter-shift rule state for a gate e^(−iθP/2)?', ['∂f/∂θ = f(θ)', '∂f/∂θ = ½[f(θ + π/2) − f(θ − π/2)]', '∂f/∂θ = [f(θ + h) − f(θ)]/h', '∂f/∂θ = 0'], 1, 'Because f is a sinusoid in θ, the difference at ±π/2 gives the exact derivative.'],
    ['Why are small-step finite differences bad on hardware?', ['They are exact', 'Shot noise in f is divided by the small step h, so the gradient estimate becomes extremely noisy', 'They need no shots', 'They are biased only for large shots'], 1, 'The variance grows as 1/(N h²); larger h reduces noise but introduces bias.'],
    ['How many circuit evaluations does a parameter-shift gradient of p parameters need?', ['1', '2p, plus repetitions for shots', 'log p', 'p²'], 1, 'Each parameter needs its own pair of shifted circuits, which is why gradient cost grows linearly with model size.'],
    ['What did Schuld, Sweke and Meyer show about QNN expressivity?', ['QNNs can represent any function with one gate', 'A QNN with encoding gates e^(−ixH) is a Fourier series whose frequencies are differences of eigenvalues of H', 'QNNs are polynomials of degree 2', 'Expressivity depends only on the number of trainable gates'], 1, 'The encoding fixes the spectrum; trainable gates only set the coefficients.'],
    ['With a single encoding gate R_z(x), what frequencies can the model contain?', ['Any frequency', 'Only 0 and 1', 'Only even frequencies', 'Frequencies up to the number of parameters'], 1, 'R_z has eigenvalues ±1/2, whose single difference gives frequency 1, however many trainable gates surround it.'],
    ['How can the frequency spectrum of a QNN be enlarged?', ['By adding trainable gates only', 'By re-uploading the data several times or encoding in parallel on several qubits', 'By measuring more often', 'By using fewer qubits'], 1, 'L repetitions of a Pauli encoding give integer frequencies up to L.'],
    ['In the lab, why can’t L = 1 fit 0.6 sin 3x + 0.3 cos x?', ['Training is too short', 'The model has no frequency-3 component, so it can fit at best the cos x part', 'The learning rate is too small', 'The target is not periodic'], 1, 'The highlighted unreachable region of the spectrum stays empty however long training runs.'],
    ['What is a known result about trainable QNNs without barren plateaus?', ['They always give exponential speedups', 'Many of them can be simulated or learned efficiently classically, so trainability and quantum advantage are in tension', 'They need no data', 'They are equivalent to Grover search'], 1, 'Structures that avoid barren plateaus often confine the model to small, classically tractable subspaces.']
  ])
});

/* ---------- QCNN on transverse-field Ising ground states (8 qubits, real amplitudes) ---------- */
const QC_N = 8;
function isingGround8(hx) {
  const n = QC_N, N = 1 << n, d = new Float64Array(N); for (let b = 0; b < N; b++) { let s = 0; for (let i = 0; i < n; i++) s += (((b >> i) ^ (b >> ((i + 1) % n))) & 1) ? 1 : -1; d[b] = s; }
  let v = new Float64Array(N).fill(1 / 16); const w = new Float64Array(N), sh = n * (1 + hx) + 1;
  for (let it = 0; it < 1500; it++) { for (let b = 0; b < N; b++) { let s = 0; for (let i = 0; i < n; i++) s += v[b ^ (1 << i)]; w[b] = sh * v[b] - (d[b] * v[b] - hx * s); } for (let b = 0; b < N / 2; b++) { const a = (w[b] + w[N - 1 - b]) / 2; w[b] = a; w[N - 1 - b] = a; } let nr = 0; for (let b = 0; b < N; b++) nr += w[b] * w[b]; nr = Math.sqrt(nr); for (let b = 0; b < N; b++) v[b] = w[b] / nr; }
  return v;
}
const QC_LAYERS = [[0, 1, 2, 3, 4, 5, 6, 7], [1, 3, 5, 7], [3, 7]];
function qcnnOut(v0, P) {
  const n = QC_N, v = Float64Array.from(v0);
  const conv = (a, b, t) => { RSIM.ry(v, n, a, t[0]); RSIM.ry(v, n, b, t[1]); RSIM.cz(v, n, a, b); RSIM.ry(v, n, a, t[2]); RSIM.ry(v, n, b, t[3]); RSIM.cz(v, n, a, b); };
  const pool = (a, b, t) => { RSIM.cry(v, n, a, b, t[4]); RSIM.x(v, n, a); RSIM.cry(v, n, a, b, t[5]); RSIM.x(v, n, a); };
  QC_LAYERS.forEach((q, l) => { const t = P.slice(6 * l, 6 * l + 6), m = q.length; if (m > 2) { for (let k = 0; k < m; k += 2) conv(q[k], q[k + 1], t); for (let k = 1; k < m; k += 2) conv(q[k], q[(k + 1) % m], t); } else conv(q[0], q[1], t); for (let k = 0; k < m; k += 2) pool(q[k], q[k + 1], t); });
  let z = 0; for (let i = 0; i < v.length; i++) z += v[i] * v[i] * ((i & 1) ? -1 : 1); return z;
}

LESSONS.push({
  id: 'qcnn', n: 37.1, stage: VQA, minutes: 15, title: 'Quantum convolutional neural networks (QCNN)',
  lede: 'Convolutional networks shrink an image layer by layer while keeping what matters. The quantum version shrinks a many-qubit state the same way, and was designed to recognize phases of matter directly from quantum data.',
  html: `
<h2>Convolution and pooling, quantum style</h2>
<p>Cong, Choi and Lukin (Nature Physics, 2019) translated the structure of a convolutional neural network into a circuit. A <strong>convolution layer</strong> applies the same two-qubit unitary to every neighbouring pair, sharing its parameters across the chain like a convolution filter. A <strong>pooling layer</strong> then halves the number of active qubits: each discarded qubit controls a rotation on its neighbour (or is measured and its result fed forward), so some of its information is kept before it leaves. After ${m('log₂ n')} rounds, one qubit is measured and its expectation value is the network’s answer.</p>
<ul>
<li><strong>Few parameters.</strong> Parameter sharing means each layer has a fixed number of parameters, so the whole network has only ${m('O(log n)')}.</li>
<li><strong>Shallow.</strong> The depth is ${m('O(log n)')}, which suits noisy hardware.</li>
<li><strong>Trainable.</strong> Pesah and colleagues (PRX, 2021) proved that QCNNs do not suffer from barren plateaus: their gradients shrink only polynomially with the number of qubits.</li>
</ul>
<h2>Learning from quantum data</h2>
<p>The natural input to a QCNN is not a classical image but a quantum state, for example the ground state of a material. Cong and colleagues showed that a QCNN can recognize a symmetry-protected topological phase, which has no local order parameter, using far fewer measurements than direct estimation of its string order. The idea resembles the renormalization group: each pooling step coarse-grains the state while keeping the features that distinguish phases. A QCNN of this kind was run on a superconducting processor by Herrmann and colleagues in 2022.</p>
<p>The lab trains a small QCNN from scratch on ground states of the transverse-field Ising chain (8 qubits) to tell the ferromagnet (${m('h < 1')}) from the paramagnet (${m('h > 1')}). It sees only twelve labelled states, none near the transition, and must place the boundary itself.</p>
${LAB('train')}
${NOTE('A caveat', `<p>The features that make QCNNs trainable also limit them. In 2024 Bermejo and colleagues showed that on standard benchmark tasks QCNNs act on information that can be extracted from a few local measurements, so their predictions can be reproduced efficiently with classical simulation or classical machine learning on measurement data. QCNNs remain a clean example of a trainable, hardware-friendly architecture, but a quantum advantage would need tasks where non-local information matters.</p>`)}
`,
  labs: {
    train: {
      title: 'Train a QCNN to find a phase transition',
      cap: 'Top: the circuit. Each layer applies the same convolution block (two R_y rotations, CZ, two more, CZ) to neighbouring pairs, then pools: the discarded qubit controls two R_y rotations on its partner. Eight qubits become four, then two, then one, which is measured. Training uses parameter-shift gradients on twelve ground states (dots) with a mean-squared loss and a fitted affine read-out. Bottom: the classifier output for ground states at every h; the predicted transition is where it crosses zero.',
      build(body, id) {
        let P = null, opt = null, it = 0, running = false, hist = [], seed = 5, states = null, ab = [1, 0], job = 0;
        const TR = [.1, .25, .4, .55, .7, .8, 1.2, 1.35, 1.5, 1.7, 1.9, 2.1], HS = []; for (let x = 0; x <= 2.2001; x += .1) HS.push(+x.toFixed(2));
        const arch = canvas('', 'height:170px'), cv = canvas('', 'height:230px'), cl = canvas('', 'height:150px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), st = h('div', { class: 'status' });
        const fitAB = fs => { const n = fs.length, ys = TR.map(x => x < 1 ? 1 : -1), mx = fs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n; let sxy = 0, sxx = 0; fs.forEach((f, i) => { sxy += (f - mx) * (ys[i] - my); sxx += (f - mx) ** 2; }); const a = sxy / (sxx + 1e-9); return [a, my - a * mx]; };
        const reset = () => { const r = rng(seed); P = Array.from({ length: 18 }, () => (r() - .5) * 2); opt = makeAdam(18, .03); it = 0; hist = []; running = false; runB.textContent = 'Train'; if (states) evalAll(); };
        const pushLoss = () => { const fs = states.tr.map(v => qcnnOut(v, P)); ab = fitAB(fs); const ys = TR.map(x => x < 1 ? 1 : -1); hist.push(fs.reduce((s, f, i) => s + (ab[0] * f + ab[1] - ys[i]) ** 2, 0) / fs.length); };
        const evalAll = () => { pushLoss(); q.inv(); qc.inv(); text(); };
        const step = () => {
          const fs = states.tr.map(v => qcnnOut(v, P)), [a, b] = fitAB(fs), ys = TR.map(x => x < 1 ? 1 : -1);
          const g = P.map((_, k) => { const Pp = P.slice(), Pm = P.slice(); Pp[k] += PI / 2; Pm[k] -= PI / 2; let s = 0; states.tr.forEach((v, i) => { s += 2 * (a * fs[i] + b - ys[i]) * a * (qcnnOut(v, Pp) - qcnnOut(v, Pm)) / 2; }); return s / fs.length; });
          opt.step(P, g); it++;
        };
        Scope.tick(() => {
          if (!states) { const t0 = performance.now(); if (!states_partial.tr) states_partial.tr = []; while (job < TR.length + HS.length && performance.now() - t0 < 14) { const hx = job < TR.length ? TR[job] : HS[job - TR.length]; (job < TR.length ? states_partial.tr : (states_partial.all = states_partial.all || [])).push(isingGround8(hx)); job++; } st.textContent = `Preparing ground states by exact diagonalization… ${Math.round(100 * job / (TR.length + HS.length))}%`; if (job >= TR.length + HS.length) { states = states_partial; st.className = 'status good'; st.textContent = 'Ground states ready. Press Train.'; evalAll(); } return; }
          if (!running) return; const t0 = performance.now(); while (performance.now() - t0 < 14 && it < 300) { step(); pushLoss(); } q.inv(); qc.inv(); text(); if (it >= 300) { running = false; runB.textContent = 'Train more'; st.textContent = 'Training finished. Press again for 300 more steps, or start afresh.'; }
        });
        const states_partial = {};
        const drawArch = ({ ctx, w, h: H }) => {
          const T = Theme.get(), L0 = 30, R0 = w - 10, rows = QC_N, Y = q => 10 + q * (H - 34) / (rows - 1), segs = [[L0, L0 + (R0 - L0) * .36], [L0 + (R0 - L0) * .36, L0 + (R0 - L0) * .68], [L0 + (R0 - L0) * .68, L0 + (R0 - L0) * .92]];
          for (let q2 = 0; q2 < rows; q2++) { const alive = q2 === 7 ? R0 : q2 % 2 === 0 ? segs[0][1] : (q2 === 1 || q2 === 5) ? segs[1][1] : segs[2][1]; ctx.strokeStyle = T.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(L0, Y(q2)); ctx.lineTo(alive, Y(q2)); ctx.stroke(); txt(ctx, 'q' + q2, 4, Y(q2), { align: 'left', font: '500 10px "JetBrains Mono",monospace' }); }
          QC_LAYERS.forEach((qs, l) => { const [x0, x1] = segs[l], m = qs.length, pairs = m > 2 ? qs.map((q2, k) => [q2, qs[(k + 1) % m]]) : [[qs[0], qs[1]]];
            pairs.forEach(([a, b], k) => { const x = x0 + (x1 - x0) * (.12 + .5 * k / pairs.length), y0 = Math.min(Y(a), Y(b)), y1 = Math.max(Y(a), Y(b)); if (Math.abs(a - b) > 2 && m > 2 && k === pairs.length - 1) return; ctx.fillStyle = rgba(T.cyan, .22); ctx.strokeStyle = T.cyan; ctx.lineWidth = 1.2; ctx.fillRect(x - 5, y0 - 5, 10, y1 - y0 + 10); ctx.strokeRect(x - 5, y0 - 5, 10, y1 - y0 + 10); });
            for (let k = 0; k < m; k += 2) { const a = qs[k], b = qs[k + 1], x = x0 + (x1 - x0) * .82; ctx.strokeStyle = T.copper; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, Y(a)); ctx.lineTo(x, Y(b)); ctx.stroke(); dot(ctx, x, Y(a), 3.5, T.copper); ctx.strokeRect(x - 5, Y(b) - 5, 10, 10); }
            txt(ctx, ['layer 1: 8 → 4', 'layer 2: 4 → 2', '3: 2 → 1'][l], (x0 + x1) / 2, H - 2, { font: '600 9.5px "JetBrains Mono",monospace', base: 'bottom' }); });
          txt(ctx, '⟨Z⟩', R0 - 2, Y(7) - 10, { align: 'right', font: '600 11px "JetBrains Mono",monospace', color: T.copper });
        };
        painter(arch, drawArch);
        const pred = v => ab[0] * qcnnOut(v, P) + ab[1];
        const q = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 2.2], y: [-1.6, 1.6], xt: [0, .5, 1, 1.5, 2], yt: [-1, 0, 1], xl: 'transverse field h', yl: 'classifier output' });
          ctx.fillStyle = rgba(T.copper, .08); ctx.fillRect(A.L, A.T, A.X(1) - A.L, A.B - A.T); ctx.fillStyle = rgba(T.cyan, .08); ctx.fillRect(A.X(1), A.T, A.R - A.X(1), A.B - A.T);
          txt(ctx, 'ferromagnet (+1)', A.X(.5), A.T + 24, { font: '600 10px "JetBrains Mono",monospace', color: T.copper }); txt(ctx, 'paramagnet (−1)', A.X(1.6), A.T + 24, { font: '600 10px "JetBrains Mono",monospace', color: T.cyan });
          if (!states) return; const pts = states.all.map((v, i) => [A.X(HS[i]), A.Y(clamp(pred(v), -1.6, 1.6))]); polyline(ctx, pts, T.ink, 2.4);
          states.tr.forEach((v, i) => dot(ctx, A.X(TR[i]), A.Y(clamp(pred(v), -1.6, 1.6)), 4.5, TR[i] < 1 ? T.copper : T.cyan, T.surface));
          const xc = crossing(); if (xc != null) { ctx.setLineDash([4, 3]); ctx.strokeStyle = T.ink; ctx.beginPath(); ctx.moveTo(A.X(xc), A.T); ctx.lineTo(A.X(xc), A.B); ctx.stroke(); ctx.setLineDash([]); }
        });
        const crossing = () => { if (!states) return null; const ys = states.all.map(pred); for (let i = 1; i < ys.length; i++) if ((ys[i - 1] > 0) !== (ys[i] > 0)) return HS[i - 1] + (HS[i] - HS[i - 1]) * ys[i - 1] / (ys[i - 1] - ys[i]); return null; };
        const qc = painter(cl, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 300], y: [1e-3, 2], ylog: true, xt: [0, 100, 200, 300], yt: [1e-3, 1e-2, .1, 1], yf: v => String(v), xl: 'training step', yl: 'loss' }); polyline(ctx, hist.map((v, i) => [A.X(i), A.Y(clamp(v, 1e-3, 2))]), T.copper, 2); });
        const text = () => { const xc = crossing(); ro.innerHTML = `<span class="k">training steps </span>${it} &nbsp; <span class="k">parameters </span>18<br><span class="k">training loss </span>${hist.length ? num(hist[hist.length - 1], 4) : '…'}<br><span class="k">predicted transition </span>${xc == null ? '—' : 'h ≈ ' + num(xc, 2)} <span class="k">(exact: 1)</span>`; };
        const runB = btn('Train', () => { if (!states) return; if (it >= 300 && !running) { it = 0; hist = hist.slice(-1); } running = !running; runB.textContent = running ? 'Pause' : 'Train more'; st.className = 'status good'; st.textContent = running ? 'Training with parameter-shift gradients…' : 'Paused.'; }, 'pri');
        body.append(arch, h('div', { class: 'btns' }, runB, btn('New random start', () => { seed++; reset(); }, 'sm')),
          h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' }, st, cl, ro)));
        reset();
      }
    }
  },
  take: ['A QCNN alternates convolution layers (one shared two-qubit unitary on all neighbouring pairs) with pooling layers that halve the active qubits.',
    'It has O(log n) depth and O(log n) parameters, and provably avoids barren plateaus.',
    'QCNNs were designed for quantum data, such as recognizing phases of matter from ground states, in the spirit of renormalization.',
    'Their trainability comes with a limitation: on standard tasks they use information that classical methods can also extract efficiently.'],
  quiz: QZ([
    ['What does a convolution layer in a QCNN do?', ['Measures every qubit', 'Applies the same parametrized two-qubit unitary to every neighbouring pair, sharing parameters', 'Adds qubits', 'Applies random gates'], 1, 'Parameter sharing mirrors a convolution filter sliding over an image.'],
    ['What does a pooling layer do?', ['Doubles the qubits', 'Reduces the number of active qubits, keeping some information from the discarded ones through controlled operations or measurement', 'Resets all qubits', 'Applies the QFT'], 1, 'Each discarded qubit influences its neighbour before leaving, like max or average pooling.'],
    ['How many parameters does a QCNN on n qubits have?', ['O(n²)', 'O(log n), thanks to parameter sharing within each of the log n layers', 'Exponentially many', 'Exactly n'], 1, 'Each layer has a constant number of shared parameters and there are about log₂n layers.'],
    ['What did Pesah and colleagues prove about QCNNs?', ['They always give exponential speedups', 'Their gradients vanish only polynomially, so they avoid barren plateaus', 'They cannot be trained', 'They need error correction'], 1, 'The shallow, hierarchical structure keeps the cost function local enough to retain trainable gradients.'],
    ['What task were QCNNs originally designed for?', ['Image classification', 'Recognizing quantum phases of matter, including a symmetry-protected topological phase, directly from quantum states', 'Factoring', 'Database search'], 1, 'Cong, Choi and Lukin showed QCNNs detect such phases with fewer measurements than direct string-order estimation.'],
    ['Which classical idea do QCNNs resemble most closely in physics?', ['Monte Carlo sampling', 'The renormalization group: coarse-graining while keeping the features that distinguish phases', 'Fourier analysis', 'Gradient descent'], 1, 'Pooling layers act like coarse-graining steps that discard irrelevant short-range detail.'],
    ['In the lab, why can the QCNN find the transition near h = 1 though no training state is closer than 0.2?', ['It was told the answer', 'It learns a feature that varies smoothly with h, and the fitted read-out crosses zero between the ordered and disordered training states', 'Because the loss is zero', 'Because ground states do not change with h'], 1, 'Generalization between the training points is what locates the boundary.'],
    ['What is the depth of a QCNN circuit?', ['Linear in n', 'O(log n)', 'Exponential in n', 'Constant 1'], 1, 'Each layer has constant depth and the number of layers is about log₂n, which suits noisy devices.'],
    ['What did Bermejo and colleagues (2024) show about QCNNs on standard benchmarks?', ['They are impossible to simulate', 'Their predictions rely on information obtainable from few local measurements and can be reproduced efficiently classically', 'They always overfit', 'They require fault tolerance'], 1, 'This highlights a general tension between trainability and quantum advantage.'],
    ['Why is quantum data a natural input for QCNNs?', ['It is easier to store classically', 'The input state can come directly from a quantum experiment or simulation, avoiding the cost of loading classical data', 'It contains no information', 'It needs no qubits'], 1, 'Learning from quantum states sidesteps the data-loading bottleneck and is where provable advantages are most plausible.']
  ])
});

/* ---------- ADAPT-VQE on a 4-qubit real Hamiltonian ---------- */
const AD_N = 4, AD_D = 16;
function adPauli(s, imag) { const M = new Float64Array(AD_D * AD_D); for (let col = 0; col < AD_D; col++) { let row = col, re = 1, im = 0; for (let q = 0; q < AD_N; q++) { const b = (col >> (AD_N - 1 - q)) & 1, c3 = s[q]; if (c3 === 'X') row ^= 1 << (AD_N - 1 - q); else if (c3 === 'Y') { row ^= 1 << (AD_N - 1 - q); const fi = b ? -1 : 1; [re, im] = [-im * fi, re * fi]; } else if (c3 === 'Z' && b) { re = -re; im = -im; } } M[row * AD_D + col] = imag ? im : re; } return M; }
const adMv = (M, v) => { const o = new Float64Array(AD_D); for (let i = 0; i < AD_D; i++) { let s = 0; for (let j = 0; j < AD_D; j++) s += M[i * AD_D + j] * v[j]; o[i] = s; } return o; };

LESSONS.push({
  id: 'adapt', n: 36.35, stage: VQA, minutes: 15, title: 'Growing the ansatz: UCCSD and ADAPT-VQE',
  lede: 'VQE is only as good as its circuit. Fixed circuits are either too shallow to be accurate or too deep to run and train. ADAPT-VQE builds the circuit one operator at a time, choosing at each step the operator that lowers the energy fastest.',
  html: `
<h2>The ansatz problem</h2>
<p>The variational quantum eigensolver ([[L:variational]]) minimizes ${m('E(θ) = ⟨ψ(θ)|H|ψ(θ)⟩')} over a parametrized circuit, the <strong>ansatz</strong>. Two standard choices pull in opposite directions:</p>
<ul>
<li><strong>Unitary coupled cluster (UCCSD)</strong> comes from quantum chemistry: ${m('|ψ⟩ = e<sup>T − T†</sup>|HF⟩')} with ${m('T')} all single and double excitations from the Hartree–Fock state. It is physically motivated and accurate for weakly correlated molecules, but it has ${m('O(N⁴)')} parameters for ${m('N')} spin orbitals, and after Trotterization and a fermion mapping ([[L:mappings]]) its circuits are far too deep for current hardware.</li>
<li><strong>Hardware-efficient ansätze</strong> use layers of native gates. They are shallow, but they ignore the physics, need many layers to be accurate, and run into barren plateaus ([[L:qml]]).</li>
</ul>
<h2>ADAPT-VQE</h2>
<p>Grimsley, Economou, Barnes and Mayhall (Nature Communications, 2019) proposed building the ansatz adaptively from a <strong>pool</strong> of candidate generators ${m('A<sub>k</sub>')} (anti-Hermitian operators, so ${m('e<sup>θA</sup>')} is unitary):</p>
<ol>
<li>For the current state, measure the energy gradient of every pool operator at zero angle: ${m('∂E/∂θ<sub>k</sub> = ⟨ψ|[H, A<sub>k</sub>]|ψ⟩')}.</li>
<li>Append the operator with the largest gradient to the circuit, with a new parameter starting at zero.</li>
<li>Re-optimize all parameters.</li>
<li>Repeat until every gradient is below a threshold.</li>
</ol>
<p>The resulting circuits are typically much shorter than UCCSD for the same accuracy, and the gradient criterion avoids adding parameters that would only flatten the landscape. <strong>Qubit-ADAPT</strong> (Tang and colleagues, 2021) uses individual Pauli strings as the pool, giving even shallower circuits. The price is measurement: every iteration measures the gradients of the whole pool.</p>
${LAB('adapt')}
<p>Pools must be chosen carefully. If the reference state and every pool operator respect a symmetry the true ground state does not share, or if the pool is too small, the gradients can all vanish before the ground state is reached. In the lab, the small nearest-neighbour pool stalls while the complete pool of imaginary Pauli strings converges in a handful of steps; starting from a state with the wrong parity converges to the ground state of the wrong sector.</p>
${NOTE('Optimizers and excited states', `<p>The lab re-optimizes with <strong>Rotosolve</strong>: for a parameter whose generator squares to −1, the energy is a sinusoid in that parameter with period π, so three energy evaluations determine it completely and its exact minimum can be jumped to. Excited states can be targeted by adding a penalty for overlap with lower states (variational quantum deflation, Higgott and colleagues, 2019) or by subspace methods that diagonalize ${m('H')} in a small set of variational states.</p>`)}
`,
  labs: {
    adapt: {
      title: 'ADAPT-VQE step by step',
      cap: 'The Hamiltonian is H = Σ(XᵢXᵢ₊₁ + ZᵢZᵢ₊₁) + h ΣZᵢ on an open chain of 4 qubits, starting from the reference state shown. Each step measures the gradient of every pool operator (top right, the largest ten), appends the largest, and re-optimizes all angles with Rotosolve sweeps. The chart shows the energy error against the number of operators; the dashed line is 1.6 × 10⁻³ (chemical accuracy, in these units for scale).',
      build(body, id) {
        let hx = .8, poolKind = 'full', ref = 0b0101, ops = [], th = [], hist = [], lastG = [], done = false, running = false, acc = 0;
        const cv = canvas('', 'height:250px'), cg = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), list = h('div', { class: 'readout', style: 'white-space:normal' });
        let Hm, E0, pool, PA;
        const build = () => {
          const str = (i, j, a, b) => { const s = Array(AD_N).fill('I'); s[i] = a; if (j >= 0) s[j] = b; return s.join(''); };
          Hm = new Float64Array(AD_D * AD_D); const add = (s, c3) => { const M = adPauli(s); for (let i = 0; i < M.length; i++) Hm[i] += c3 * M[i]; };
          for (let i = 0; i < AD_N - 1; i++) { add(str(i, i + 1, 'X', 'X'), 1); add(str(i, i + 1, 'Z', 'Z'), 1); } for (let i = 0; i < AD_N; i++) add(str(i, -1, 'Z'), hx);
          E0 = eigSymV(Hm, AD_D).w[0];
          pool = []; if (poolKind === 'nn') { for (let i = 0; i < AD_N; i++) pool.push(str(i, -1, 'Y')); for (let i = 0; i < AD_N - 1; i++) for (const [a, b] of [['Y', 'Z'], ['Z', 'Y'], ['Y', 'X'], ['X', 'Y']]) pool.push(str(i, i + 1, a, b)); }
          else for (let c3 = 1; c3 < 256; c3++) { let s = '', ny = 0; for (let q = 0; q < AD_N; q++) { const d = (c3 >> (2 * q)) & 3; s += 'IXYZ'[d]; if (d === 2) ny++; } if (ny % 2) pool.push(s); }
          PA = pool.map(s => adPauli(s, true));
          ops = []; th = []; done = false; running = false; runB.textContent = 'Run ADAPT'; const e = En(stateOf(ops, th)); hist = [e - E0]; lastG = grads(stateOf(ops, th)); q.inv(); qg.inv(); text();
        };
        const stateOf = (os, ts) => { let v = new Float64Array(AD_D); v[ref] = 1; os.forEach((k, i) => { const Av = adMv(PA[k], v); for (let j = 0; j < AD_D; j++) v[j] = Math.cos(ts[i]) * v[j] + Math.sin(ts[i]) * Av[j]; }); return v; };
        const En = v => { const Hv = adMv(Hm, v); let s = 0; for (let i = 0; i < AD_D; i++) s += v[i] * Hv[i]; return s; };
        const grads = v => { const Hv = adMv(Hm, v); return PA.map(A => { const Av = adMv(A, v); let s = 0; for (let i = 0; i < AD_D; i++) s += Hv[i] * Av[i]; return 2 * s; }); };
        const stepAdapt = () => {
          if (done) return; const v = stateOf(ops, th), g = grads(v); let best = 0; g.forEach((x, k) => { if (Math.abs(x) > Math.abs(g[best])) best = k; });
          if (Math.abs(g[best]) < 1e-6 || ops.length >= 14) { done = true; running = false; runB.textContent = 'Run ADAPT'; text(); return; }
          ops.push(best); th.push(0);
          for (let sw = 0; sw < 8; sw++) for (let k = 0; k < th.length; k++) { const f = t => { const tt = th.slice(); tt[k] = t; return En(stateOf(ops, tt)); }, t0 = th[k], f0 = f(t0), fp = f(t0 + PI / 4), fm = f(t0 - PI / 4), a = (fp + fm) / 2; th[k] = (2 * t0 - Math.atan2((fm - fp) / 2, f0 - a) + PI) / 2; }
          hist.push(Math.max(1e-14, En(stateOf(ops, th)) - E0)); lastG = grads(stateOf(ops, th)); q.inv(); qg.inv(); text();
        };
        Scope.tick(now => { if (!running) { acc = now; return; } if (now - acc > (reduced() ? 0 : 450)) { acc = now; stepAdapt(); } });
        const q = painter(cv, ({ ctx, w, h: H }) => { if (!hist.length) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 14], y: [1e-12, 10], ylog: true, xt: [0, 2, 4, 6, 8, 10, 12, 14], yt: [1e-12, 1e-9, 1e-6, 1e-3, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'operators in the ansatz', yl: 'E − E₀' });
          ctx.setLineDash([5, 4]); ctx.strokeStyle = T.good; ctx.beginPath(); ctx.moveTo(A.L, A.Y(1.6e-3)); ctx.lineTo(A.R, A.Y(1.6e-3)); ctx.stroke(); ctx.setLineDash([]);
          const pts = hist.map((v, i) => [A.X(i), A.Y(clamp(v, 1e-12, 10))]); polyline(ctx, pts, T.copper, 2.4); pts.forEach(p2 => dot(ctx, p2[0], p2[1], 3.5, T.copper)); });
        const qg = painter(cg, ({ ctx, w, h: H }) => {
          if (!lastG.length) return; const T = Theme.get(), idx = [...lastG.keys()].sort((a, b) => Math.abs(lastG[b]) - Math.abs(lastG[a])).slice(0, 10), mx = Math.max(1e-9, ...idx.map(k => Math.abs(lastG[k]))), L = 54, rh = (H - 16) / 10;
          txt(ctx, 'largest pool gradients |∂E/∂θ|', 0, 6, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace' });
          idx.forEach((k, r) => { const y = 14 + r * rh, wd = (w - L - 60) * Math.abs(lastG[k]) / mx; ctx.fillStyle = r === 0 ? T.copper : rgba(T.muted, .55); ctx.fillRect(L, y + 2, wd, rh - 4); txt(ctx, pool[k], L - 6, y + rh / 2, { align: 'right', font: '500 10.5px "JetBrains Mono",monospace', color: T.ink }); txt(ctx, Math.abs(lastG[k]) < 1e-6 ? '≈ 0' : num(Math.abs(lastG[k]), 3), L + wd + 5, y + rh / 2, { align: 'left', font: '500 10px "JetBrains Mono",monospace' }); });
        });
        const text = () => { const e = hist[hist.length - 1]; ro.innerHTML = `<span class="k">pool size </span>${pool.length} &nbsp; <span class="k">exact E₀ </span>${num(E0, 6)}<br><span class="k">operators </span>${ops.length} &nbsp; <span class="k">E − E₀ </span>${sci(e)}<br>${done ? (e < 1e-6 ? '<span style="color:var(--good)">Converged to the ground state.</span>' : '<span style="color:var(--bad)">All gradients vanished above the ground state.</span>') : ''}`; list.innerHTML = '<span class="k">ansatz (applied left to right)</span><br>' + (ops.length ? ops.map((k, i) => `${pool[k]}<span class="k">(${num(((th[i] + PI) % TAU + TAU) % TAU - PI, 2)})</span>`).join(' → ') : 'reference state only'); };
        const runB = btn('Run ADAPT', () => { if (done) return; running = !running; runB.textContent = running ? 'Pause' : 'Run ADAPT'; }, 'pri');
        body.append(h('div', { class: 'btns' }, runB, btn('One step', () => { running = false; runB.textContent = 'Run ADAPT'; stepAdapt(); }), btn('Restart', build, 'sm')),
          h('div', { class: 'btns' }, seg([{ v: 'full', label: 'Pool: all 120 imaginary Pauli strings' }, { v: 'nn', label: 'Pool: 16 nearest-neighbour' }], poolKind, v => { poolKind = v; build(); }, 'Pool'), seg([{ v: 0b0101, label: 'Start |0101⟩ (even)' }, { v: 0b0001, label: 'Start |0001⟩ (odd)' }], ref, v => { ref = v; build(); }, 'Reference')),
          h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, list), h('div', { class: 'stack' }, cg, slider({ id: id('h'), label: 'Field h', min: 0, max: 2, step: .1, value: hx, fmt: v => num(v, 1), on: v => { hx = v; build(); } }), ro)));
        build();
      }
    }
  },
  take: ['UCCSD is physically motivated but has O(N⁴) parameters and deep circuits; hardware-efficient ansätze are shallow but unphysical and prone to barren plateaus.',
    'ADAPT-VQE grows the ansatz greedily: measure the gradient ⟨[H, Aₖ]⟩ of every pool operator, append the largest, re-optimize, repeat.',
    'Qubit-ADAPT uses Pauli-string pools for shallower circuits; the cost moves to measuring many gradients each iteration.',
    'Pools must be complete enough and must not trap the state in the wrong symmetry sector; excited states need penalties or subspace methods.'],
  quiz: QZ([
    ['What is the main drawback of UCCSD on current hardware?', ['It is inaccurate for small molecules', 'Its O(N⁴) excitation operators lead to circuits far too deep after Trotterization and mapping', 'It has no parameters', 'It cannot represent Hartree–Fock'], 1, 'Every double excitation becomes a sizeable circuit, and there are very many of them.'],
    ['How does ADAPT-VQE choose the next operator?', ['Randomly', 'It picks the pool operator with the largest energy gradient at zero angle, ⟨ψ|[H, Aₖ]|ψ⟩', 'The one with the fewest gates', 'Always a single-qubit rotation'], 1, 'The largest gradient promises the steepest initial energy decrease.'],
    ['What happens after an operator is appended?', ['Nothing', 'All parameters, old and new, are re-optimized', 'Only the new parameter is fixed at π', 'The circuit is measured and discarded'], 1, 'Re-optimizing everything lets earlier angles adjust to the new operator.'],
    ['When does ADAPT-VQE stop?', ['After one step', 'When all pool gradients fall below a threshold', 'When the circuit has 100 gates', 'Never'], 1, 'Vanishing gradients mean no single pool operator can lower the energy to first order.'],
    ['What is the pool in qubit-ADAPT?', ['Fermionic excitations', 'Individual Pauli strings with an odd number of Y factors (so that they generate real rotations)', 'Random unitaries', 'Measurement bases'], 1, 'Pauli-string generators give compact circuits; completeness of the pool is crucial.'],
    ['Why can ADAPT stall above the ground state?', ['Bad luck', 'If the pool is incomplete or symmetry keeps all gradients zero, no operator can make progress', 'Because the energy is always exact', 'Because Rotosolve is approximate'], 1, 'In the lab the small nearest-neighbour pool gets stuck while the full pool converges.'],
    ['Starting from an odd-parity reference with a parity-conserving Hamiltonian and pool, what does ADAPT find?', ['The global ground state', 'The lowest state in the odd-parity sector', 'A random state', 'The highest-energy state'], 1, 'Operators that preserve parity cannot leave the starting sector.'],
    ['What is the main cost of ADAPT-VQE on hardware?', ['Classical memory', 'Measuring the gradients of every pool operator at every iteration', 'Very deep circuits', 'Error correction'], 1, 'Each gradient is a commutator expectation value needing its own measurements.'],
    ['What does Rotosolve exploit?', ['Random search', 'For a generator with A² = −1, the energy is a sinusoid in that parameter, so three evaluations give its exact minimum', 'Second derivatives', 'Gradient-free annealing'], 1, 'E(θ) = a + b cos 2θ + c sin 2θ is determined by three values, and its minimum is found analytically.'],
    ['How can VQE target excited states?', ['It cannot', 'By penalizing overlap with previously found lower states (VQD) or diagonalizing H in a small subspace of variational states', 'By raising the temperature', 'By measuring fewer shots'], 1, 'Deflation and subspace methods extend VQE beyond the ground state.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['QSVM', 'A quantum support vector machine: a support vector machine whose kernel is the overlap of quantum-encoded data states, estimated on a quantum computer.', 'qsvm'],
  ['Support vector', 'A training point with a non-zero weight in an SVM, lying on or inside the margin; the classifier depends only on these points.', 'qsvm'],
  ['Quantum neural network', 'A parametrized quantum circuit, with data-encoding and trainable gates, used as a machine-learning model.', 'qnn'],
  ['QCNN', 'A quantum convolutional neural network: shared two-qubit convolution layers alternating with pooling layers that halve the active qubits.', 'qcnn'],
  ['Pooling layer', 'In a QCNN, a layer that removes half the active qubits after letting them control operations on their neighbours.', 'qcnn'],
  ['UCCSD', 'Unitary coupled cluster with singles and doubles: a chemistry-inspired VQE ansatz built from exponentials of excitation operators.', 'adapt'],
  ['ADAPT-VQE', 'A VQE variant that grows its ansatz one operator at a time, choosing the pool operator with the largest energy gradient.', 'adapt'],
  ['Rotosolve', 'An optimizer that sets each parameter to the exact minimum of its sinusoidal energy dependence, found from three evaluations.', 'adapt']
);
})();
