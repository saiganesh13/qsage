/* =====================================================================
   Batch 5c: dequantization, discrete time crystals, circuit cutting
   ===================================================================== */
(() => {

/* ---------- dequantization ---------- */
function cumOf(x) { const c3 = new Float64Array(x.length); let s = 0; for (let i = 0; i < x.length; i++) { s += x[i] * x[i]; c3[i] = s; } return c3; }
function sampleCum(c3, u) { const t = u * c3[c3.length - 1]; let lo = 0, hi = c3.length - 1; while (lo < hi) { const md = (lo + hi) >> 1; if (c3[md] < t) lo = md + 1; else hi = md; } return lo; }

LESSONS.push({
  id: 'dequant', n: 30.9, stage: 6, minutes: 15, title: 'Dequantization: when classical sampling catches up',
  lede: 'Several celebrated quantum speedups for machine learning assumed that data can be loaded into quantum states quickly. Give a classical computer the matching kind of access, the ability to sample entries in proportion to their size, and it often matches the quantum algorithm up to polynomial factors.',
  html: `
<h2>The fine print about input</h2>
<p>Quantum linear-algebra algorithms such as HHL ([[L:hhl]]) and quantum recommendation systems start from amplitude-encoded states ${m('|x⟩ = Σ<sub>i</sub> x<sub>i</sub>/‖x‖ |i⟩')}. Preparing such a state for an arbitrary vector of length ${m('N')} takes about ${m('N')} operations, which would erase any exponential speedup. So these algorithms assume a <strong>quantum RAM</strong> backed by a data structure, typically a binary tree storing partial sums of squared entries (Kerenidis and Prakash, 2016), that prepares ${m('|x⟩')} in time polylogarithmic in ${m('N')}.</p>
<p>Ewin Tang noticed in 2018, as an undergraduate, that the same tree gives a classical computer a powerful ability: in logarithmic time it can sample an index ${m('i')} with probability ${m('x<sub>i</sub>²/‖x‖²')}, called <strong>length-squared sampling</strong>, and read any entry. With this <strong>sample-and-query access</strong> she found a classical recommendation algorithm whose running time, like the quantum one of Kerenidis and Prakash, is polylogarithmic in the size of the matrix, though polynomial in its rank, the accuracy and the condition number. The claimed exponential quantum speedup disappeared.</p>
<h2>The basic trick</h2>
<p>To estimate an inner product ${m('⟨x, y⟩')} of unit vectors, sample ${m('i')} with probability ${m('x<sub>i</sub>²')} and record ${m('y<sub>i</sub>/x<sub>i</sub>')}. Its average is exactly ${m('Σ x<sub>i</sub>² · y<sub>i</sub>/x<sub>i</sub> = ⟨x, y⟩')}, and its variance is at most ${m('‖y‖² = 1')} whatever the dimension:</p>
${EQ('⟨x, y⟩ ≈ (1/k) Σ<sub>s=1..k</sub> y<sub>i<sub>s</sub></sub> / x<sub>i<sub>s</sub></sub>, &nbsp;&nbsp; error ≈ 1/√k')}
<p>That is the same ${m('1/ε²')} scaling a swap test needs to estimate an overlap ([[L:swaptest]]), with no dependence on ${m('N')}.</p>
${LAB('inner')}
<h2>Low rank is the key</h2>
<p>For matrices, length-squared sampling of rows gives a small sketch that captures the dominant singular vectors (Frieze, Kannan and Vempala, 1998). Sample ${m('r')} rows with probability proportional to their squared norms, rescale them, and the top singular vectors of the ${m('r × n')} sketch approximate those of the full matrix when it is close to low rank. That is exactly the regime where quantum recommendation, quantum principal component analysis ([[L:qpca]]) and low-rank linear systems promised exponential speedups. Chia, Gilyén, Li, Lin, Tang and Wang (2020) turned this into a general framework that dequantizes quantum singular value transformation ([[L:qsp]]) for low-rank matrices.</p>
${LAB('recommend')}
<h2>What survives</h2>
<ul>
<li><strong>Polynomial gaps.</strong> The classical algorithms carry large polynomial overheads in rank and accuracy, so quantum algorithms may keep polynomial, though not exponential, advantages in the low-rank setting, once the cost of QRAM itself is accounted for.</li>
<li><strong>Sparse, high-rank problems.</strong> HHL on sparse, well-conditioned, full-rank matrices is BQP-complete, so it cannot be dequantized unless quantum computers are classically simulable ([[L:advantage]]). Hamiltonian simulation and other problems with genuinely quantum structure are untouched.</li>
<li><strong>The lesson.</strong> A quantum speedup is only meaningful against the best classical algorithm given the same kind of access to the data. Quantum machine learning on classical data now faces this test routinely ([[L:qml]], [[L:kernels]]).</li>
</ul>
`,
  labs: {
    inner: {
      title: 'Inner products from a handful of samples',
      cap: 'Two unit vectors x and y of dimension N with a chosen overlap. Sampling index i with probability xᵢ² and averaging yᵢ/xᵢ estimates ⟨x, y⟩. Faint lines are independent runs; the shaded band is ±1/√k. Change N from a hundred to a hundred thousand: the error after k samples does not change, and only k entries are ever read.',
      build(body, id) {
        let lgN = 4, ov = .6, kind = 'rand', K = 3000, runs = [], X, Y, cum, ip, sd;
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const make = () => { const N = 10 ** lgN, r = rng(17 + lgN), g = () => { const u = r() || 1e-12, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
          let x = new Float64Array(N), w = new Float64Array(N); for (let i = 0; i < N; i++) { x[i] = kind === 'rand' ? g() : (r() < .01 ? 8 : .4) * g(); w[i] = g(); }
          const nx = Math.sqrt(x.reduce((s, v) => s + v * v, 0)); x = x.map(v => v / nx); let d = 0; for (let i = 0; i < N; i++) d += w[i] * x[i]; for (let i = 0; i < N; i++) w[i] -= d * x[i]; const nw = Math.sqrt(w.reduce((s, v) => s + v * v, 0)); w = w.map(v => v / nw);
          X = x; Y = x.map((v, i) => ov * v + Math.sqrt(1 - ov * ov) * w[i]); cum = cumOf(X); ip = X.reduce((s, v, i) => s + v * Y[i], 0); sd = Math.sqrt(Math.max(0, Y.reduce((s, v) => s + v * v, 0) - ip * ip)); sample(); };
        const sample = () => { runs = []; for (let r = 0; r < 6; r++) { let s = 0; const path = new Float64Array(K); for (let k = 0; k < K; k++) { const i = sampleCum(cum, Math.random()); s += Y[i] / X[i]; path[k] = s / (k + 1); } runs.push(path); } p.inv(); text(); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!runs.length) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [1, K], y: [ip - 1.2, ip + 1.2], xlog: true, xt: [1, 10, 100, 1000], yt: [Math.round((ip - 1) * 10) / 10, Math.round(ip * 10) / 10, Math.round((ip + 1) * 10) / 10], yf: v => num(v, 1), xl: 'samples k', yl: 'estimate of ⟨x, y⟩', pad: { l: 40, b: 30 } });
          ctx.fillStyle = rgba(T.cyan, .14); ctx.beginPath(); for (let k = 1; k <= K; k *= 1.06) ctx.lineTo(A.X(k), A.Y(Math.min(ip + 1.2, ip + sd / Math.sqrt(k)))); for (let k = K; k >= 1; k /= 1.06) ctx.lineTo(A.X(k), A.Y(Math.max(ip - 1.2, ip - sd / Math.sqrt(k)))); ctx.closePath(); ctx.fill();
          polyline(ctx, [[A.L, A.Y(ip)], [A.R, A.Y(ip)]], T.ink, 1.4, [5, 4]);
          runs.forEach((path, r) => { const pts = []; for (let k = 1; k <= K; k = Math.max(k + 1, Math.round(k * 1.03))) pts.push([A.X(k), A.Y(clamp(path[k - 1], ip - 1.2, ip + 1.2))]); polyline(ctx, pts, r ? rgba(T.copper, .35) : T.copper, r ? 1.2 : 2.4); });
        });
        const text = () => { const est = runs[0][K - 1], N = 10 ** lgN; ro.innerHTML = `<span class="k">dimension N </span>${N.toLocaleString()}<br><span class="k">true ⟨x, y⟩ </span>${num(ip, 4)}<br><span class="k">estimate after ${K.toLocaleString()} samples </span>${num(est, 4)} <span class="k">(expected error ≈ ${num(sd / Math.sqrt(K), 3)})</span><br><span class="k">entries read </span>${Math.min(K, N).toLocaleString()} of ${N.toLocaleString()}${N > K ? ` (${pct(K / N, 1)})` : ''}`; };
        body.append(cv, h('div', { class: 'split' }, h('div', { class: 'stack' },
          slider({ id: id('n'), label: 'Dimension N', min: 2, max: 5, step: 1, value: lgN, fmt: v => (10 ** v).toLocaleString(), on: v => { lgN = v; make(); } }),
          slider({ id: id('o'), label: 'Overlap ⟨x, y⟩', min: -.9, max: .9, step: .05, value: ov, fmt: v => num(v, 2), on: v => { ov = v; make(); } }),
          field('Vector x', seg([{ v: 'rand', label: 'Spread out' }, { v: 'spiky', label: 'Few large entries' }], kind, v => { kind = v; make(); }, 'Vector')), h('div', { class: 'btns' }, btn('Sample again', sample, 'pri'))), ro));
        make();
      }
    },
    recommend: {
      title: 'Recommendations from a few sampled rows',
      cap: 'A preference matrix of 160 users × 60 items that is nearly rank 3, with some heavy users. Sample r rows with probability proportional to their squared norm (copper ticks), find the top three singular directions of that small sketch, and use them to predict the highlighted user’s scores. Bars compare the prediction from the sketch with the exact rank-3 prediction.',
      build(body, id) {
        const U = 160, I = 60, K = 3; let r = 12, noise = .3, user = 7, seed = 3, A, Vex, picks = [], Vsk;
        const hc = canvas('', 'height:200px'), bc = canvas('', 'height:150px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const topK = (G, n) => { const { w, V } = eigSymV(G, n), idx = [...Array(n).keys()].sort((a, b) => w[b] - w[a]).slice(0, K); return idx.map(m => [...Array(n)].map((_, i) => V[i * n + m])); };
        const gram = rows => { const G = new Float64Array(I * I); for (const [row, wgt] of rows) for (let a = 0; a < I; a++) { const ra = row[a] * wgt; if (!ra) continue; for (let b = 0; b < I; b++) G[a * I + b] += ra * row[b]; } return G; };
        const make = () => { const rr = rng(seed), g = () => Math.sqrt(-2 * Math.log(rr() || 1e-12)) * Math.cos(TAU * rr());
          const VF = [...Array(K)].map(() => [...Array(I)].map(g)); A = [...Array(U)].map(() => { const s = Math.exp(.9 * g()), c3 = Math.floor(rr() * K), uf = [...Array(K)].map((_, k) => k === c3 ? 1.5 + .3 * g() : .25 * g()); return [...Array(I)].map((_, j) => s * (uf.reduce((t, u, k) => t + u * VF[k][j], 0) + noise * 2 * g())); });
          Vex = topK(gram(A.map(row => [row, 1])), I); resample(); };
        const resample = () => { const nrm = A.map(row => row.reduce((s, v) => s + v * v, 0)), tot = nrm.reduce((s, v) => s + v, 0), cum = []; let s = 0; for (const v of nrm) { s += v; cum.push(s); }
          picks = []; for (let k = 0; k < r; k++) { const t = Math.random() * tot; let i = cum.findIndex(c3 => c3 >= t); if (i < 0) i = U - 1; picks.push(i); }
          Vsk = topK(gram(picks.map(i => [A[i], 1 / (r * nrm[i] / tot)])), I); ph.inv(); pb.inv(); text(); };
        const pred = (V, row) => { const c3 = V.map(v => v.reduce((s, x, j) => s + x * row[j], 0)); return [...Array(I)].map((_, j) => V.reduce((s, v, k) => s + c3[k] * v[j], 0)); };
        const ph = painter(hc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), L = 22, Wd = w - L - 4; let mx = 0; for (const row of A) for (const v of row) mx = Math.max(mx, Math.abs(v)); mx *= .45;
          const oc = heatImage(I, U, (j, i) => divRGB(clamp(A[i][j] / mx, -1, 1))); drawHeat(ctx, oc, L, 0, Wd, H, false);
          const rh = H / U; ctx.fillStyle = T.copper; for (const i of new Set(picks)) ctx.fillRect(2, i * rh, L - 6, Math.max(1.5, rh)); ctx.strokeStyle = T.cyan; ctx.lineWidth = 2; ctx.strokeRect(L, user * rh - 1, Wd, rh + 2);
        });
        const pb = painter(bc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), pe = pred(Vex, A[user]), ps = pred(Vsk, A[user]), mx = Math.max(...pe.map(Math.abs), ...ps.map(Math.abs)) || 1, A2 = axes(ctx, w, H, { x: [0, I], y: [-mx, mx], xt: [], yt: [0], xl: 'items', pad: { l: 14, b: 18, t: 8 } }), bw = (A2.R - A2.L) / I;
          for (let j = 0; j < I; j++) { const x = A2.L + j * bw; ctx.fillStyle = rgba(T.copper, .85); const y0 = A2.Y(0), y1 = A2.Y(ps[j]); ctx.fillRect(x + bw * .15, Math.min(y0, y1), bw * .7, Math.abs(y1 - y0)); ctx.strokeStyle = T.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + bw * .05, A2.Y(pe[j])); ctx.lineTo(x + bw * .95, A2.Y(pe[j])); ctx.stroke(); }
        });
        const text = () => { const ov = Vex.reduce((s, v) => s + Vsk.reduce((t, u) => t + v.reduce((q, x, j) => q + x * u[j], 0) ** 2, 0), 0) / K, pe = pred(Vex, A[user]), ps = pred(Vsk, A[user]), top = a => [...a.keys()].sort((x, y) => a[y] - a[x]).slice(0, 5), te = top(pe), ts = top(ps);
          ro.innerHTML = `<span class="k">rows sampled </span>${r} of ${U} <span class="k">(${new Set(picks).size} distinct)</span><br><span class="k">subspace overlap with exact top-3 </span>${num(ov, 3)}<br><span class="k">top-5 recommendations shared </span>${te.filter(j => ts.includes(j)).length} of 5<br><span class="k">bars: sketch prediction · cyan ticks: exact rank-3 prediction</span>`; };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, hc, bc), h('div', { class: 'stack' },
          slider({ id: id('r'), label: 'Rows sampled r', min: 1, max: 60, step: 1, value: r, fmt: String, on: v => { r = v; resample(); } }),
          slider({ id: id('z'), label: 'Noise (how far from rank 3)', min: 0, max: 1.5, step: .05, value: noise, fmt: v => num(v, 2), on: v => { noise = v; make(); } }),
          h('div', { class: 'btns' }, btn('Resample rows', resample, 'pri'), btn('Another user', () => { user = (user + 23) % U; ph.inv(); pb.inv(); text(); }), btn('New matrix', () => { seed++; make(); }, 'sm')), ro)));
        make();
      }
    }
  },
  take: ['Quantum linear-algebra speedups assume fast state preparation through QRAM-like data structures.',
    'The same data structure gives a classical computer length-squared sampling and entry queries (sample-and-query access).',
    'With it, inner products need O(1/ε²) samples independent of dimension, and low-rank matrices can be sketched from a few sampled rows.',
    'Tang and others dequantized recommendation systems, QPCA and low-rank QSVT; exponential speedups survive for sparse, high-rank problems and genuinely quantum tasks.'],
  quiz: QZ([
    ['What input assumption do many quantum machine-learning algorithms make?', ['None', 'That amplitude-encoded states |x⟩ can be prepared in polylogarithmic time, typically through QRAM', 'That data is binary', 'That N is small'], 1, 'Without fast state preparation the cost of loading data would erase exponential speedups.'],
    ['What is length-squared sampling?', ['Sampling uniformly', 'Sampling index i with probability xᵢ²/‖x‖²', 'Sampling the largest entry', 'Sampling by Fourier transform'], 1, 'It mirrors what measuring |x⟩ in the computational basis would give.'],
    ['Who dequantized the quantum recommendation algorithm in 2018?', ['Peter Shor', 'Ewin Tang', 'Lov Grover', 'Scott Aaronson'], 1, 'Her classical algorithm is also polylogarithmic in the matrix dimensions.'],
    ['How is ⟨x, y⟩ estimated with length-squared sampling of x?', ['By reading all entries', 'By averaging yᵢ/xᵢ over indices sampled with probability xᵢ²', 'By sorting the vectors', 'By a Fourier transform'], 1, 'The estimator is unbiased: Σ xᵢ²·yᵢ/xᵢ = ⟨x, y⟩.'],
    ['How does the number of samples needed for error ε depend on the dimension N?', ['Linearly', 'It does not: about 1/ε² samples suffice', 'Exponentially', 'As √N'], 1, 'The variance is bounded by ‖y‖², independent of N.'],
    ['When does row sampling capture a matrix well?', ['Always', 'When the matrix is close to low rank', 'Only for diagonal matrices', 'Only for sparse full-rank matrices'], 1, 'A few rows then span the dominant directions; this is the low-rank regime of the quantum proposals.'],
    ['Which quantum algorithms were dequantized in the low-rank setting?', ['Shor’s algorithm', 'Recommendation systems, quantum PCA and low-rank linear systems', 'Grover search', 'Hamiltonian simulation'], 1, 'A general framework dequantizes QSVT for low-rank matrices.'],
    ['Why can HHL on sparse, well-conditioned, full-rank matrices not be dequantized in general?', ['It is too slow', 'That problem is BQP-complete, so a classical algorithm would simulate all quantum computation', 'Its output is classical', 'It uses no QRAM'], 1, 'Dequantization exploits low rank, which these instances lack.'],
    ['What advantage may remain for quantum algorithms in the low-rank setting?', ['Exponential', 'Polynomial speedups, depending on the classical overheads and QRAM costs', 'None ever', 'Super-exponential'], 1, 'The dequantized algorithms have large polynomial dependences on rank and accuracy.'],
    ['What is the general lesson of dequantization?', ['Quantum computers are useless', 'Speedups must be measured against the best classical algorithm with the same access to the data', 'Classical computers are faster at everything', 'Sampling is quantum'], 1, 'Comparisons with mismatched input models can manufacture exponential gaps.']
  ])
});

/* ---------- discrete time crystals ---------- */
function dtcRun(n, eps, J, dis, T, seed) {
  const N = 1 << n, r = rng(seed), Ji = [...Array(n - 1)].map(() => J * (dis ? .5 + r() : 1)), hi = [...Array(n)].map(() => dis ? PI * (2 * r() - 1) : 0);
  const z0 = [...Array(n)].map(() => r() < .5 ? 1 : -1); let b0 = 0; z0.forEach((z, i) => { if (z < 0) b0 |= 1 << (n - 1 - i); });
  let re = new Float64Array(N), im = new Float64Array(N); re[b0] = 1;
  const cs = new Float64Array(N), sn = new Float64Array(N); for (let b = 0; b < N; b++) { const z = i => (b >> (n - 1 - i) & 1) ? -1 : 1; let e = 0; for (let i = 0; i < n - 1; i++) e += Ji[i] * z(i) * z(i + 1); for (let i = 0; i < n; i++) e += hi[i] * z(i); cs[b] = Math.cos(-e); sn[b] = Math.sin(-e); }
  const th = PI * (1 - eps), c3 = Math.cos(th / 2), s = Math.sin(th / 2), Z = [], Acor = [];
  for (let t = 0; t < T; t++) {
    for (let q = 0; q < n; q++) { const m2 = 1 << (n - 1 - q); for (let i = 0; i < N; i++) if (!(i & m2)) { const j = i | m2, ar = re[i], ai = im[i], br = re[j], bi = im[j]; re[i] = c3 * ar + s * bi; im[i] = c3 * ai - s * br; re[j] = c3 * br + s * ai; im[j] = c3 * bi - s * ar; } }
    for (let i = 0; i < N; i++) { const r2 = re[i] * cs[i] - im[i] * sn[i]; im[i] = re[i] * sn[i] + im[i] * cs[i]; re[i] = r2; }
    const zt = new Float64Array(n); for (let i = 0; i < N; i++) { const p = re[i] * re[i] + im[i] * im[i]; for (let q = 0; q < n; q++) zt[q] += (i >> (n - 1 - q) & 1) ? -p : p; }
    Z.push(zt); Acor.push(zt.reduce((a, v, q) => a + v * z0[q], 0) / n);
  }
  return { Z, A: Acor, z0 };
}
const dtcOrder = (A, t0) => { let s = 0, k = 0; for (let t = t0; t < A.length; t++) { s += A[t] * (t % 2 ? 1 : -1); k++; } return s / k; };

LESSONS.push({
  id: 'timecrystal', n: 33.8, stage: 7, minutes: 15, title: 'Discrete time crystals',
  lede: 'Kick a chain of spins periodically and, under the right conditions, it responds at twice the period, and keeps doing so even when the kicks are imperfect. This rigid period doubling is a phase of matter that exists only out of equilibrium, and quantum processors have been used to observe it.',
  html: `
<h2>Breaking time-translation symmetry</h2>
<p>A crystal breaks the symmetry of space: its atoms pick out positions even though the laws of physics are the same everywhere. In 2012 Frank Wilczek asked whether a system could likewise break time-translation symmetry and tick spontaneously in its lowest-energy state. No-go theorems (Bruno, 2013; Watanabe and Oshikawa, 2015) ruled that out in equilibrium. But a periodically driven, <strong>Floquet</strong>, system has only a discrete symmetry: the rules repeat every period ${m('T')}. A <strong>discrete time crystal</strong> breaks it, responding with period ${m('2T')} (Khemani, Lazarides, Moessner and Sondhi; Else, Bauer and Nayak, both 2016).</p>
<h2>The kicked spin chain</h2>
<p>Each period applies two steps to a chain of spins (qubits): an Ising interaction with random fields, then an almost-perfect flip of every spin:</p>
${EQ('U<sub>F</sub> = exp(−i Σ J<sub>i</sub> Z<sub>i</sub>Z<sub>i+1</sub> − i Σ h<sub>i</sub> Z<sub>i</sub>) · ∏<sub>i</sub> R<sub>x</sub>(π(1 − ε))')}
<p>With ${m('ε = 0')} every spin flips every period, so each returns to its starting value after ${m('2T')}: period doubling, but trivially. With ${m('ε ≠ 0')} and no interactions, each spin rotates a little short of π each time and the pattern drifts into slow beats. The surprise is what happens with interactions. The Ising term locks the spins together: the response stays at exactly period ${m('2T')} over a whole range of ${m('ε')}. This <strong>rigidity</strong> against changes of the drive is what makes it a phase rather than a fine-tuned effect, just as a crystal’s lattice spacing does not depend on how it was grown.</p>
${LAB('kicked')}
<h2>Why disorder is needed</h2>
<p>An interacting system driven periodically normally absorbs energy without limit and heats to a featureless infinite-temperature state, in which every memory of the initial condition is lost; this is what the eigenstate thermalization hypothesis predicts. Strong random fields can prevent it through <strong>many-body localization</strong> ([[L:lightcone]]): excitations cannot spread, so the system remembers its initial pattern. In the time crystal, the Floquet eigenstates come in cat-like pairs ${m('|z⟩ ± |z̄⟩')} whose quasienergies differ by exactly ${m('π')}, so any initial pattern returns every two periods. Without disorder, or with too large a rotation error, the order melts.</p>
${LAB('phase')}
<h2>Seeing it in experiments</h2>
<p>Period doubling was first observed in 2017 with trapped ions (Zhang and colleagues) and with nitrogen-vacancy spins in diamond (Choi and colleagues). Mi and colleagues (Nature, 2022) used 20 superconducting qubits on Google’s Sycamore processor, where the kicked Ising model is just a circuit of single-qubit rotations and two-qubit ZZ gates ([[L:analog]] contrasts this digital approach with analog simulators). The processor could prepare arbitrary initial bit strings and showed that all of them, not only special ones, keep their period-doubled pattern, a signature of eigenstate order. Echo sequences separated slow intrinsic decay from hardware decoherence ([[L:decoherence]]). The experiment is a small example of quantum processors as laboratories for non-equilibrium physics that classical simulation reaches only for small systems.</p>
`,
  labs: {
    kicked: {
      title: 'Period doubling in a kicked spin chain',
      cap: 'Top: ⟨Zᵢ⟩ for each of 10 spins (rows) after each period (columns), starting from a random bit string; copper is up, cyan is down. A checkerboard in time is period doubling. Bottom: the autocorrelation with the initial pattern, multiplied by (−1)ᵗ so period doubling shows as a curve that stays high, averaged over four disorder samples. Set ε = 0.1 and compare J = 0 with J = 0.6, then switch off the disorder.',
      build(body, id) {
        let eps = .1, J = .6, dis = true, res = null, avg = null, job = 0; const n = 10, T = 60;
        const hc = canvas('', 'height:160px'), ac = canvas('', 'height:180px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const compute = () => { const my = ++job; Scope.later(10, () => { if (my !== job) return; res = dtcRun(n, eps, J, dis, T, 11); const As = [res.A]; for (let s = 1; s < 4; s++) As.push(dtcRun(n, eps, J, dis, T, 11 + 37 * s).A); avg = res.A.map((_, t) => As.reduce((q, A) => q + A[t], 0) / As.length); ph.inv(); pa.inv(); text(); }); };
        const ph = painter(hc, ({ ctx, w, h: H }) => {
          if (!res) return; const T2 = Theme.get(), L = 34; const oc = heatImage(T + 1, n, (t, q) => divRGB(clamp(-(t === 0 ? res.z0[q] : res.Z[t - 1][q]), -1, 1))); drawHeat(ctx, oc, L, 0, w - L - 4, H - 18, false);
          for (let q = 0; q < n; q += 3) txt(ctx, 'q' + q, L - 6, (q + .5) / n * (H - 18), { align: 'right', font: '500 10px "JetBrains Mono",monospace' });
          txt(ctx, 'period t →', w - 6, H - 7, { align: 'right', font: '500 10.5px "JetBrains Mono",monospace' }); txt(ctx, 't = 0', L, H - 7, { align: 'left', font: '500 10.5px "JetBrains Mono",monospace' });
        });
        const pa = painter(ac, ({ ctx, w, h: H }) => {
          if (!avg) return; const T2 = Theme.get(), A = axes(ctx, w, H, { x: [0, T], y: [-1, 1], xt: [0, 10, 20, 30, 40, 50, 60], yt: [-1, 0, 1], xl: 'period t', yl: '(−1)ᵗ × autocorrelation', pad: { l: 34, b: 30 } });
          polyline(ctx, [[A.X(0), A.Y(1)]].concat(avg.map((a, t) => [A.X(t + 1), A.Y(a * ((t + 1) % 2 ? -1 : 1))])), T2.copper, 2.4);
        });
        const text = () => { const o = dtcOrder(avg, 30); ro.innerHTML = `<span class="k">late-time order (periods 30–60) </span>${num(o, 2)}<br><span class="k">verdict </span>${o > .3 ? 'robust period doubling: time-crystalline' : o > .1 ? 'weak, decaying order' : 'order melted'}<br><span class="k">rotation per kick </span>${num(180 * (1 - eps), 0)}° <span class="k">instead of 180°</span>`; };
        body.append(hc, ac, h('div', { class: 'split' }, h('div', { class: 'stack' },
          slider({ id: id('e'), label: 'Kick error ε (fraction of π)', min: 0, max: .4, step: .01, value: eps, fmt: v => num(v, 2), on: v => { eps = v; compute(); } }),
          slider({ id: id('j'), label: 'Ising interaction J (phase per period)', min: 0, max: 1.2, step: .05, value: J, fmt: v => num(v, 2), on: v => { J = v; compute(); } }),
          field('Random fields and couplings', seg([{ v: true, label: 'Disordered' }, { v: false, label: 'Clean' }], dis, v => { dis = v; compute(); }, 'Disorder'))), ro));
        compute();
      }
    },
    phase: {
      title: 'Where the time crystal lives',
      cap: 'Each cell runs the 8-spin kicked chain for 80 periods (three disorder samples) and colours the late-time period-doubled order: copper for robust order, pale for melted. Without interactions (left column) any kick error destroys the order; with interactions it survives a range of errors that grows with J. Switch to the clean chain to see heating erase most of the region.',
      build(body, id) {
        const EPS = [...Array(9)].map((_, i) => i * .05), JS = [...Array(9)].map((_, i) => i * .15); let dis = true, grid = null, job = 0;
        const cv = canvas('', 'height:280px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const run = () => { const my = ++job; grid = EPS.map(() => JS.map(() => null)); p.inv(); let cell = 0;
          const stepf = () => { if (my !== job) return; const i = Math.floor(cell / JS.length), j = cell % JS.length; let o = 0; for (let s = 0; s < 3; s++) o += dtcOrder(dtcRun(8, EPS[i], JS[j], dis, 80, 5 + 13 * s + 101 * dis).A, 40); grid[i][j] = o / 3; cell++; p.inv(); if (cell < EPS.length * JS.length) Scope.later(0, stepf); else text(); };
          Scope.later(30, stepf); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!grid) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [-.075, 1.275], y: [-.025, .425], xt: JS.filter((_, j) => j % 2 === 0), xf: v => num(v, 1), yt: EPS.filter((_, i) => i % 2 === 0), yf: v => num(v, 1), xl: 'interaction J', yl: 'kick error ε', pad: { l: 40, b: 30 } });
          const cw = (A.R - A.L) / JS.length, chh = (A.B - A.T) / EPS.length;
          EPS.forEach((e, i) => JS.forEach((jv, j) => { const v = grid[i][j], x = A.X(jv) - cw / 2, y = A.Y(e) - chh / 2; if (v == null) { ctx.fillStyle = T.surface2; ctx.fillRect(x + 1, y + 1, cw - 2, chh - 2); return; } const c3 = mixRGB(T.surface2, T.copper, clamp(v / .9, 0, 1)); ctx.fillStyle = `rgb(${c3.join(',')})`; ctx.fillRect(x + 1, y + 1, cw - 2, chh - 2); if (cw > 30) txt(ctx, num(v, 2), x + cw / 2, y + chh / 2, { font: '500 10px "JetBrains Mono",monospace', color: v > .45 ? T.surface : T.ink }); }));
        });
        const text = () => { let c3 = 0; grid.forEach(r => r.forEach(v => { if (v > .3) c3++; })); ro.innerHTML = `<span class="k">cells with robust order (> 0.3) </span>${c3} of ${EPS.length * JS.length}<br><span class="k">${dis ? 'disordered chain: many-body localization protects the order' : 'clean chain: interactions alone let the drive heat the system'}</span>`; };
        body.append(cv, h('div', { class: 'split' }, h('div', { class: 'stack' }, field('Chain', seg([{ v: true, label: 'Disordered' }, { v: false, label: 'Clean' }], dis, v => { dis = v; run(); }, 'Chain')), h('div', { class: 'btns' }, btn('Recompute', run, 'sm'))), ro));
        run();
      }
    }
  },
  take: ['Equilibrium time crystals are ruled out, but periodically driven systems can break discrete time-translation symmetry and respond at period 2T.',
    'In the kicked Ising chain, interactions lock the period-doubled response so it survives imperfect kicks (ε ≠ 0): rigidity marks a phase.',
    'Disorder and many-body localization stop the drive from heating the system to infinite temperature; Floquet eigenstates form π-paired cat states.',
    'Time crystals have been seen with ions, NV centres and a 20-qubit superconducting processor, where the model is a native circuit.'],
  quiz: QZ([
    ['Why can’t a time crystal exist in thermal equilibrium?', ['Equilibrium states are too cold', 'No-go theorems show that equilibrium ground or thermal states cannot oscillate spontaneously', 'Clocks cannot be quantum', 'Crystals cannot move'], 1, 'Watanabe and Oshikawa proved this for systems with reasonable interactions.'],
    ['What symmetry does a discrete time crystal break?', ['Rotation symmetry', 'The discrete time-translation symmetry t → t + T of the drive, responding with period 2T', 'Charge conservation', 'Parity'], 1, 'The response has a longer period than the drive itself.'],
    ['What does the drive in the kicked spin chain do each period?', ['Measures every spin', 'Applies Ising interactions and random fields, then rotates every spin by π(1 − ε)', 'Resets the chain', 'Applies Hadamards only'], 1, 'With ε = 0 the rotation is a perfect flip.'],
    ['With no interactions and a small kick error ε, what does the response look like?', ['Perfect period doubling forever', 'Slow beats: the rotation error accumulates and the period-doubled pattern drifts', 'A frozen pattern', 'Random noise immediately'], 1, 'Each spin rotates by π(1 − ε) per period, so ⟨Z⟩ follows cos(π(1 − ε)t).'],
    ['What is meant by the rigidity of a time crystal?', ['It is mechanically stiff', 'The response stays locked at exactly period 2T over a range of drive imperfections', 'Its spins cannot move', 'It ignores the initial state'], 1, 'Robustness to perturbations is what distinguishes a phase from fine tuning.'],
    ['What normally happens to an interacting system under periodic driving?', ['It cools', 'It absorbs energy and heats towards an infinite-temperature state, losing memory', 'It becomes a time crystal', 'It stops evolving'], 1, 'This is the expectation from eigenstate thermalization.'],
    ['What protects the time crystal from heating in the lab’s model?', ['Measurement', 'Disorder, through many-body localization', 'Error correction', 'Low temperature'], 1, 'Localized excitations cannot spread energy through the chain.'],
    ['What structure do the Floquet eigenstates of the time crystal have?', ['They are product states', 'Cat-like pairs |z⟩ ± |z̄⟩ with quasienergies differing by π', 'Plane waves', 'Thermal states'], 1, 'The π splitting makes any superposition return after two periods.'],
    ['Why is the kicked Ising model natural on a digital quantum processor?', ['It needs no gates', 'Each period is a layer of single-qubit X rotations and two-qubit ZZ gates', 'It runs only on analog machines', 'It requires measurement every step'], 1, 'Mi and colleagues ran it on 20 qubits of Google’s Sycamore processor.'],
    ['What did checking many initial bit strings show in the 2022 experiment?', ['Only one state oscillated', 'All of them kept their period-doubled pattern, a signature of eigenstate order', 'None oscillated', 'Only the all-zero state worked'], 1, 'Order in every eigenstate, not only special states, marks the many-body localized time crystal.']
  ])
});

/* ---------- circuit cutting ---------- */
const CUTT = [['I', 0, 1], ['I', 1, 1], ['X', 0, 1], ['X', 1, -1], ['Y', 0, 1], ['Y', 1, -1], ['Z', 0, 1], ['Z', 1, -1]];
function cutModel(al, be) {
  /* fragment 1: H q0, CNOT q0→q1, Ry(α) q1; measure Z on q0 and P on q1 → probability that z0·p = +1 */
  const up = {}; for (const P of ['I', 'X', 'Y', 'Z']) { const s = new QState(2); s.g('H', 0); s.cx(0, 1); s.apply(1, Ry(al)); if (P === 'X') s.g('H', 1); if (P === 'Y') { s.g('Sdg', 1); s.g('H', 1); } const pr = s.probs(); let ev = 0; for (let i = 0; i < 4; i++) { const z0 = i & 2 ? -1 : 1, p = P === 'I' ? 1 : (i & 1 ? -1 : 1); ev += pr[i] * z0 * p; } up[P] = ev; }
  /* fragment 2: prepare q1' in eigenstate e of P, Ry(β) on q2, CNOT q1'→q2; measure Z on q2 */
  const down = CUTT.map(([P, e]) => { const s = new QState(2); if (e) s.g('X', 0); if (P === 'X') s.g('H', 0); if (P === 'Y') { s.g('H', 0); s.g('S', 0); } s.apply(1, Ry(be)); s.cx(0, 1); return 1 - 2 * s.prob1(1); });
  const full = new QState(3); full.g('H', 0); full.cx(0, 1); full.apply(1, Ry(al)); full.apply(2, Ry(be)); full.cx(1, 2); const pr = full.probs(); let ex = 0; for (let i = 0; i < 8; i++) ex += pr[i] * ((i & 4 ? -1 : 1) * (i & 1 ? -1 : 1));
  const knit = .5 * CUTT.reduce((s, [P], t) => s + CUTT[t][2] * up[P] * down[t], 0);
  return { up, down, ex, knit };
}

LESSONS.push({
  id: 'cutting', n: 35.95, stage: 8, minutes: 15, title: 'Circuit cutting and knitting',
  lede: 'A circuit too wide for one processor can be cut into smaller fragments, run separately, and stitched back together by classical post-processing. The answer comes out exactly right on average. The price is a sampling overhead that grows exponentially with the number of cuts.',
  html: `
<h2>Cutting a wire</h2>
<p>Any single-qubit state can be rebuilt from its Pauli expectation values ([[L:densitymatrix]]): ${m('ρ = ½ Σ<sub>P</sub> Tr(Pρ) P')} over ${m('P ∈ {I, X, Y, Z}')}. Read this as a recipe for replacing a wire by measurement and preparation. Upstream, measure the qubit in the basis of ${m('P')}; downstream, start a fresh qubit in an eigenstate of ${m('P')}; afterwards, multiply the results with the right signs and add. Writing each Pauli in terms of its eigenstates, for example ${m('Z = |0⟩⟨0| − |1⟩⟨1|')}, gives eight measure-and-prepare terms (Peng, Harrow, Ozols and Wu, 2020):</p>
${EQ('ρ = ½ [ Tr(ρ)(|0⟩⟨0| + |1⟩⟨1|) + Tr(Xρ)(|+⟩⟨+| − |−⟩⟨−|) + Tr(Yρ)(|+i⟩⟨+i| − |−i⟩⟨−i|) + Tr(Zρ)(|0⟩⟨0| − |1⟩⟨1|) ]')}
<p>The two fragments never need to exist at the same time, or on the same machine.</p>
<h2>Quasi-probabilities and their price</h2>
<p>Some coefficients are negative, so the terms cannot simply be chosen at random like a mixture. Instead, write the quantity of interest as ${m('⟨O⟩ = Σ<sub>i</sub> a<sub>i</sub> ⟨O⟩<sub>i</sub>')} with ${m('γ = Σ |a<sub>i</sub>|')}. Pick term ${m('i')} with probability ${m('|a<sub>i</sub>|/γ')}, run it, and multiply the outcome by ${m('γ · sign(a<sub>i</sub>)')}. The average is exact, but each shot now ranges over ${m('±γ')}, so the variance grows by about ${m('γ²')}: to keep the same precision you need ${m('γ²')} times as many shots, and ${m('γ<sup>2k</sup>')} for ${m('k')} cuts. For the eight-term wire cut ${m('γ = 4')}, an overhead of 16 per cut; later schemes reach ${m('γ = 3')}, an overhead of 9 (Brenner, Piveteau and Sutter, 2023; Harada and colleagues, 2023). The same quasi-probability idea powers probabilistic error cancellation ([[L:mitigation]]).</p>
${LAB('wirecut')}
<h2>Cutting gates</h2>
<p>Instead of a wire, one can cut a two-qubit gate that crosses between fragments. Mitarai and Fujii (2021) showed that a ZZ rotation ${m('R<sub>ZZ</sub>(φ) = exp(−iφ Z⊗Z/2)')} can be written as a quasi-probability mixture of single-qubit rotations and mid-circuit Z measurements on each side, with ${m('γ = 1 + 2|sin φ|')}. A CZ or CNOT gate (${m('φ = π/2')}) costs ${m('γ = 3')}, an overhead of 9, which Piveteau and Sutter (2023) proved optimal for local operations. Small-angle gates are cheap to cut, which helps for circuits such as Trotterized time evolution. Classical communication between the fragments during the run ([[L:dynamic]]) can lower the cost of cutting many gates at once.</p>
${LAB('overhead')}
<h2>When it is worth it</h2>
<ul>
<li><strong>Few connections between dense blocks.</strong> Cutting pays off when a circuit splits into clusters linked by a handful of wires or gates, a graph-partitioning problem like the one in [[L:distributed]]. Tools such as CutQC and the circuit-knitting add-ons of Qiskit search for good cuts automatically.</li>
<li><strong>Smaller fragments are also less noisy.</strong> Fewer qubits and less routing ([[L:routing]]) can mean lower error per fragment, partly offsetting the extra shots.</li>
<li><strong>Exponential, but only in the cuts.</strong> The overhead grows as ${m('9ᵏ')} or ${m('16ᵏ')}, not with the number of qubits, so a few cuts are practical and dozens are not. Real entanglement between modules removes the overhead entirely, which is why modular machines want quantum links.</li>
</ul>
`,
  labs: {
    wirecut: {
      title: 'Cutting one wire and knitting the results',
      cap: 'Fragment 1 entangles q0 and q1 and rotates q1; fragment 2 takes q1 onward, interacts it with q2, and we want ⟨Z₀Z₂⟩. The cut wire is replaced by the eight measure-and-prepare terms. Each knitted shot samples a term, runs both fragments once, and returns ±4. Both estimates converge to the exact value (dashed), but the cut one is noisier: its variance is about 16 times larger.',
      build(body, id) {
        let al = 1.1, be = .7, Mod = cutModel(al, be), runs = null;
        const cw = h('div', { class: 'scroll-x' }), cv = canvas('', 'height:220px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), tw = h('div', { class: 'scroll-x' });
        const circ = () => { cw.innerHTML = ''; const d = drawCircuit(3, [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'Ry', q: 1 }, { g: 'Ry', q: 2 }], [], [{ g: 'CX', c: 1, t: 2 }], [{ g: 'M', q: 0 }, { g: 'M', q: 2 }]], { labels: ['q0', 'q1', 'q2'], aria: 'Circuit with one cut wire' });
          const x = d.X(3), y = d.Y(1); d.svg.append(sv('line', { x1: x, y1: y - 22, x2: x, y2: y + 22, stroke: 'var(--copper)', 'stroke-width': 3, 'stroke-dasharray': '4 3' }), sv('text', { x: x, y: y - 26, 'text-anchor': 'middle', class: 'c-sub', fill: 'var(--copper)' }, 'cut'));
          cw.append(d.svg); };
        const sim = N => { const pick = () => Math.floor(Math.random() * 8), bern = e => Math.random() < (1 + e) / 2 ? 1 : -1; const c3 = [], u = []; let sc = 0, su = 0;
          for (let k = 1; k <= N; k++) { const t = pick(), [P, , sg] = CUTT[t]; sc += 4 * sg * bern(Mod.up[P]) * bern(Mod.down[t]); su += bern(Mod.ex); if ((k & (k - 1)) === 0 || k % Math.ceil(N / 200) === 0 || k === N) { c3.push([k, sc / k]); u.push([k, su / k]); } } return { c3, u, N }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), ex = Mod.ex, N = runs ? runs.N : 10000, A = axes(ctx, w, H, { x: [1, N], y: [ex - 2.2, ex + 2.2], xlog: true, xt: [1, 10, 100, 1000, 10000, 100000].filter(v => v <= N), xf: v => v >= 1000 ? v / 1000 + 'k' : String(v), yt: [ex - 2, ex, ex + 2].map(v => Math.round(v * 10) / 10), yf: v => num(v, 1), xl: 'shots', yl: 'estimate of ⟨Z₀Z₂⟩', pad: { l: 40, b: 30 } });
          for (const [sd, col] of [[Math.sqrt(16 - ex * ex), T.copper], [Math.sqrt(1 - ex * ex), T.cyan]]) { ctx.fillStyle = rgba(col, .12); ctx.beginPath(); for (let k = 1; k <= N; k *= 1.08) ctx.lineTo(A.X(k), A.Y(Math.min(ex + 2.2, ex + sd / Math.sqrt(k)))); for (let k = N; k >= 1; k /= 1.08) ctx.lineTo(A.X(k), A.Y(Math.max(ex - 2.2, ex - sd / Math.sqrt(k)))); ctx.closePath(); ctx.fill(); }
          polyline(ctx, [[A.L, A.Y(ex)], [A.R, A.Y(ex)]], T.ink, 1.4, [5, 4]);
          if (runs) { polyline(ctx, runs.u.map(([k, v]) => [A.X(k), A.Y(clamp(v, ex - 2.2, ex + 2.2))]), T.cyan, 2); polyline(ctx, runs.c3.map(([k, v]) => [A.X(k), A.Y(clamp(v, ex - 2.2, ex + 2.2))]), T.copper, 2.4); }
        });
        const text = () => { const ex = Mod.ex, last = a => a[a.length - 1][1];
          ro.innerHTML = `<span class="k">exact ⟨Z₀Z₂⟩ </span>${num(ex, 4)} <span class="k">· knitted from exact fragment values </span>${num(Mod.knit, 4)}<br>` + (runs ? `<span class="k">uncut, ${runs.N.toLocaleString()} shots </span>${num(last(runs.u), 3)} ± ${num(Math.sqrt(1 - ex * ex) / Math.sqrt(runs.N), 3)}<br><span class="k">cut and knitted </span>${num(last(runs.c3), 3)} ± ${num(Math.sqrt(16 - ex * ex) / Math.sqrt(runs.N), 3)}<br>` : '') + `<span class="k">variance ratio (16 − ⟨O⟩²)/(1 − ⟨O⟩²) </span>${num((16 - ex * ex) / Math.max(1e-9, 1 - ex * ex), 1)}`;
          tw.innerHTML = `<table class="mini-tbl"><thead><tr><th>measure q1</th><th>prepare</th><th>±</th><th>⟨Z₀P⟩</th><th>⟨Z₂⟩</th></tr></thead><tbody>${CUTT.map(([P, e, sg], t) => `<tr><td>${P === 'I' ? 'any' : P}</td><td>${{ I: ['|0⟩', '|1⟩'], X: ['|+⟩', '|−⟩'], Y: ['|+i⟩', '|−i⟩'], Z: ['|0⟩', '|1⟩'] }[P][e]}</td><td>${sg > 0 ? '+' : '−'}</td><td>${num(Mod.up[P], 3)}</td><td>${num(Mod.down[t], 3)}</td></tr>`).join('')}</tbody></table>`; };
        const up = () => { Mod = cutModel(al, be); runs = sim(10000); p.inv(); text(); };
        body.append(cw, h('div', { class: 'btns' }, btn('Run 1,000 shots', () => { runs = sim(1000); p.inv(); text(); }), btn('Run 10,000', () => { runs = sim(10000); p.inv(); text(); }, 'pri'), btn('Run 100,000', () => { runs = sim(100000); p.inv(); text(); })), cv,
          h('div', { class: 'split' }, h('div', { class: 'stack' }, slider({ id: id('a'), label: 'Ry angle α on q1 (fragment 1)', min: 0, max: PI, step: .01, value: al, fmt: v => num(deg(v), 0) + '°', on: v => { al = v; up(); } }), slider({ id: id('b'), label: 'Ry angle β on q2 (fragment 2)', min: 0, max: PI, step: .01, value: be, fmt: v => num(deg(v), 0) + '°', on: v => { be = v; up(); } }), ro), tw));
        circ(); up();
      }
    },
    overhead: {
      title: 'How many cuts can you afford?',
      cap: 'Shot overhead γ^(2k) for k cuts, on a log scale: eight-term wire cuts (γ = 4), optimal wire cuts (γ = 3), CZ/CNOT gate cuts (γ = 3) and ZZ rotations of angle φ (γ = 1 + 2|sin φ|). The dashed line is your shot budget relative to an uncut run. Small-angle rotations are far cheaper to cut than full entangling gates.',
      build(body, id) {
        let phi = .3, lgB = 4;
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const S = () => [['wire cut, 8 terms (γ = 4)', 4, Theme.get().bad], ['wire cut, optimal (γ = 3)', 3, Theme.get().copper], ['CZ / CNOT gate cut (γ = 3)', 3, Theme.get().ink], [`R_ZZ(${num(deg(phi), 0)}°) gate cut (γ = ${num(1 + 2 * Math.abs(Math.sin(phi)), 2)})`, 1 + 2 * Math.abs(Math.sin(phi)), Theme.get().cyan]];
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 10], y: [0, 12], xt: [0, 2, 4, 6, 8, 10], yt: [0, 3, 6, 9, 12], yf: v => '10' + sup(v), xl: 'number of cuts k', yl: 'shot overhead', pad: { l: 44, b: 30 } });
          S().forEach(([, g, col], i) => polyline(ctx, [...Array(11)].map((_, k) => [A.X(k), A.Y(Math.min(12.2, 2 * k * Math.log10(g)))]), col, i === 2 ? 1.6 : 2.4, i === 2 ? [6, 4] : null));
          polyline(ctx, [[A.L, A.Y(lgB)], [A.R, A.Y(lgB)]], T.muted, 1.6, [3, 4]); txt(ctx, 'budget', A.R - 4, A.Y(lgB) - 9, { align: 'right', font: '500 10.5px "JetBrains Mono",monospace' });
        });
        const leg = h('div');
        const text = () => { leg.innerHTML = ''; leg.append(legendRow(S().map(([l, , col], i) => [l, col, i === 2]))); ro.innerHTML = S().map(([l, g]) => `<span class="k">${l.split(' (')[0]}: </span>${Math.floor(lgB / (2 * Math.log10(g)) + 1e-9)} cuts within budget`).join('<br>'); };
        const up = () => { p.inv(); text(); };
        body.append(cv, leg, h('div', { class: 'split' }, h('div', { class: 'stack' },
          slider({ id: id('p'), label: 'ZZ rotation angle φ', min: 0, max: PI / 2, step: .01, value: phi, fmt: v => num(deg(v), 0) + '°', on: v => { phi = v; up(); } }),
          slider({ id: id('b'), label: 'Shot budget (× an uncut run)', min: 1, max: 10, step: .5, value: lgB, fmt: v => Number.isInteger(v) ? '10' + sup(v) : sci(10 ** v, 1), on: v => { lgB = v; up(); } })), ro));
        up();
      }
    }
  },
  take: ['A cut wire is replaced by measuring Pauli bases upstream and preparing their eigenstates downstream, then recombining with signs: ρ = ½ Σ Tr(Pρ)P.',
    'Negative coefficients make it a quasi-probability decomposition; sampling it is unbiased but inflates the variance by γ², so k cuts cost γ^(2k) more shots.',
    'Wire cuts cost γ = 4 (eight terms) or 3 (optimal); CNOT or CZ gate cuts cost γ = 3, and ZZ rotations 1 + 2|sin φ|.',
    'Cutting suits circuits with a few links between dense blocks; real entanglement between modules removes the overhead.'],
  quiz: QZ([
    ['What identity underlies wire cutting?', ['Teleportation', 'ρ = ½ Σ Tr(Pρ) P over the Paulis, so a state can be rebuilt from Pauli measurements', 'The no-cloning theorem', 'The QFT'], 1, 'Measuring P upstream and preparing its eigenstates downstream implements each term.'],
    ['How many measure-and-prepare terms does the basic wire cut use?', ['2', '8', '4', '16'], 1, 'Four Paulis, each written with two eigenstate projectors (I as |0⟩⟨0| + |1⟩⟨1|).'],
    ['Why can’t the terms simply be sampled like a probability mixture?', ['There are too many', 'Some coefficients are negative, so it is a quasi-probability decomposition', 'The fragments are entangled', 'Measurements are forbidden'], 1, 'Sampling with |aᵢ|/γ and reweighting by γ·sign(aᵢ) keeps the estimate unbiased.'],
    ['How does the shot cost grow with k cuts of overhead factor γ each?', ['Linearly in k', 'As γ^(2k)', 'As k²', 'It does not grow'], 1, 'Each cut multiplies the variance by about γ².'],
    ['What is γ for the eight-term wire cut?', ['1', '4', '2', '8'], 1, 'Eight terms of weight ½ each; optimal schemes reduce it to 3.'],
    ['What does it cost to cut a CZ or CNOT gate with local operations?', ['γ = 1', 'γ = 3, an overhead of 9 shots per cut', 'γ = 16', 'It cannot be cut'], 1, 'Mitarai and Fujii’s decomposition achieves it, and it is optimal for local operations.'],
    ['How does γ depend on the angle of a cut ZZ rotation R_ZZ(φ)?', ['It is constant', 'γ = 1 + 2|sin φ|, so small angles are cheap', 'γ = φ²', 'γ grows with φ without bound'], 1, 'At φ = π/2 this gives the CZ value γ = 3.'],
    ['In the lab, why is the knitted estimate noisier than the uncut one?', ['The fragments are wrong', 'Each knitted shot returns ±4, so its variance is about 16 − ⟨O⟩² instead of 1 − ⟨O⟩²', 'Fewer shots were taken', 'The exact value differs'], 1, 'Both are unbiased; only the spread differs.'],
    ['Which other technique uses the same quasi-probability sampling?', ['Grover search', 'Probabilistic error cancellation', 'Surface-code decoding', 'Phase estimation'], 1, 'PEC writes the ideal operation as a signed mixture of noisy ones.'],
    ['What removes the cutting overhead between modules altogether?', ['Faster classical computers', 'Real entanglement between the modules, used for teleportation or remote gates', 'More cuts', 'Error mitigation'], 1, 'Quantum links make the overhead unnecessary, which motivates modular hardware.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Length-squared sampling', 'Sampling an index i with probability xᵢ²/‖x‖²; with entry queries it gives classical algorithms “sample-and-query access”.', 'dequant'],
  ['QRAM', 'Quantum random-access memory: a proposed device that loads classical data into superposition quickly, assumed by many quantum machine-learning algorithms.', 'dequant'],
  ['Discrete time crystal', 'A periodically driven many-body system whose response locks to a multiple of the drive period, robustly.', 'timecrystal'],
  ['Floquet system', 'A system whose Hamiltonian repeats periodically in time; its evolution over one period defines the Floquet unitary.', 'timecrystal'],
  ['Circuit cutting', 'Splitting a circuit into fragments by replacing wires or gates with sampled local operations, then recombining results classically.', 'cutting'],
  ['Quasi-probability decomposition', 'Writing an operation as a signed combination of implementable ones; sampling it costs a variance factor γ² with γ = Σ|aᵢ|.', 'cutting']
);
})();
