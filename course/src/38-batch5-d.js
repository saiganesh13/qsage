/* =====================================================================
   Batch 5d: quantum reservoir computing, quantum PCA, contextuality
   ===================================================================== */
(() => {

/* ---------- quantum reservoir: 5 qubits, density matrix, reset-based input ---------- */
const QR_N = 5, QR_D = 32;
function qrUnitary(tau, seed) {
  const r = rng(seed), Jx = []; for (let i = 0; i < QR_N; i++) for (let j = i + 1; j < QR_N; j++) Jx.push([i, j, 2 * r() - 1]);
  const H = new Float64Array(QR_D * QR_D), bit = (b, q) => (b >> (QR_N - 1 - q)) & 1;
  for (let b = 0; b < QR_D; b++) { let d = 0; for (let q = 0; q < QR_N; q++) d += .5 * (bit(b, q) ? -1 : 1); H[b * QR_D + b] = d; for (const [i, j, J] of Jx) { const b2 = b ^ (1 << (QR_N - 1 - i)) ^ (1 << (QR_N - 1 - j)); H[b * QR_D + b2] += J; } }
  const { w, V } = eigSymV(H, QR_D), Ur = new Float64Array(QR_D * QR_D), Ui = new Float64Array(QR_D * QR_D);
  for (let a = 0; a < QR_D; a++) for (let b = 0; b < QR_D; b++) { let sr = 0, si = 0; for (let k = 0; k < QR_D; k++) { const v = V[a * QR_D + k] * V[b * QR_D + k]; sr += v * Math.cos(w[k] * tau); si -= v * Math.sin(w[k] * tau); } Ur[a * QR_D + b] = sr; Ui[a * QR_D + b] = si; }
  return { Ur, Ui };
}
function qrFeatures(U, inputs) {
  const D = QR_D, h2 = D >> 1; let Rr = new Float64Array(D * D), Ri = new Float64Array(D * D); Rr[0] = 1;
  const Tr = new Float64Array(D * D), Ti = new Float64Array(D * D), feats = [];
  for (const s of inputs) {
    const pr = new Float64Array(h2 * h2), pi = new Float64Array(h2 * h2);
    for (let a = 0; a < h2; a++) for (let b = 0; b < h2; b++) { pr[a * h2 + b] = Rr[a * D + b] + Rr[(a + h2) * D + b + h2]; pi[a * h2 + b] = Ri[a * D + b] + Ri[(a + h2) * D + b + h2]; }
    const ps = [Math.sqrt(1 - s), Math.sqrt(s)];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const f = ps[i] * ps[j]; for (let a = 0; a < h2; a++) for (let b = 0; b < h2; b++) { Rr[(i * h2 + a) * D + j * h2 + b] = f * pr[a * h2 + b]; Ri[(i * h2 + a) * D + j * h2 + b] = f * pi[a * h2 + b]; } }
    /* T = U R, then R = T U† */
    Tr.fill(0); Ti.fill(0);
    for (let a = 0; a < D; a++) for (let k = 0; k < D; k++) { const ur = U.Ur[a * D + k], ui = U.Ui[a * D + k]; if (!ur && !ui) continue; for (let b = 0; b < D; b++) { const rr = Rr[k * D + b], ri = Ri[k * D + b]; Tr[a * D + b] += ur * rr - ui * ri; Ti[a * D + b] += ur * ri + ui * rr; } }
    Rr.fill(0); Ri.fill(0);
    for (let a = 0; a < D; a++) for (let k = 0; k < D; k++) { const tr = Tr[a * D + k], ti = Ti[a * D + k]; for (let b = 0; b < D; b++) { const ur = U.Ur[b * D + k], ui = -U.Ui[b * D + k]; Rr[a * D + b] += tr * ur - ti * ui; Ri[a * D + b] += tr * ui + ti * ur; } }
    const f = []; const z = q => { let e = 0; for (let b = 0; b < D; b++) e += Rr[b * D + b] * ((b >> (QR_N - 1 - q)) & 1 ? -1 : 1); return e; };
    for (let q = 0; q < QR_N; q++) f.push(z(q));
    for (let q = 0; q < QR_N; q++) for (let p = q + 1; p < QR_N; p++) { let e = 0; for (let b = 0; b < D; b++) e += Rr[b * D + b] * ((((b >> (QR_N - 1 - q)) ^ (b >> (QR_N - 1 - p))) & 1) ? -1 : 1); f.push(e); }
    feats.push(f);
  }
  return feats;
}
function ridge(X, y, lam) {
  const n = X[0].length + 1, A = [...Array(n)].map(() => new Float64Array(n + 1));
  X.forEach((row, t) => { const r = [1, ...row]; for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += r[i] * r[j]; A[i][n] += r[i] * y[t]; } });
  for (let i = 0; i < n; i++) A[i][i] += lam;
  for (let c3 = 0; c3 < n; c3++) { let p = c3; for (let r = c3 + 1; r < n; r++) if (Math.abs(A[r][c3]) > Math.abs(A[p][c3])) p = r; [A[c3], A[p]] = [A[p], A[c3]]; for (let r = 0; r < n; r++) if (r !== c3) { const f = A[r][c3] / A[c3][c3]; for (let k = c3; k <= n; k++) A[r][k] -= f * A[c3][k]; } }
  const w = A.map((r, i) => r[n] / r[i]); return row => w[0] + row.reduce((s, v, i) => s + v * w[i + 1], 0);
}
const corr2 = (a, b) => { const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n; let c3 = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { c3 += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return va && vb ? c3 * c3 / (va * vb) : 0; };

LESSONS.push({
  id: 'qrc', n: 37.85, stage: 9, minutes: 15, title: 'Quantum reservoir computing',
  lede: 'Instead of training a quantum circuit, use a fixed, complicated quantum system as a reservoir. Feed a time series in, let the dynamics stir it into a huge state space, and train only a linear readout on what you measure. No gradients flow through the quantum system, so there are no barren plateaus to fight.',
  html: `
<h2>Reservoir computing</h2>
<p>Recurrent neural networks are hard to train because gradients must flow back through time. <strong>Reservoir computing</strong> sidesteps this. Echo state networks (Jaeger, 2001) and liquid state machines (Maass, 2002) use a large, fixed, random recurrent network, the reservoir, and train only the output weights, by linear regression. It works when the reservoir has three properties: a high-dimensional state, nonlinear response, and <strong>fading memory</strong>, so that its state depends on recent inputs and gradually forgets old ones. Physical systems, from buckets of water to photonic circuits, have been used as reservoirs.</p>
<h2>A quantum reservoir</h2>
<p>Fujii and Nakajima (2017) proposed using a quantum system. A few qubits interact through a fixed Hamiltonian, here a transverse-field Ising model with random couplings, ${m('H = Σ J<sub>ij</sub> X<sub>i</sub>X<sub>j</sub> + h Σ Z<sub>i</sub>')}. At each time step ${m('k')}:</p>
<ol>
<li>the input ${m('s<sub>k</sub> ∈ [0, 1]')} is written by resetting qubit 0 to ${m('√(1−s<sub>k</sub>)|0⟩ + √s<sub>k</sub>|1⟩')};</li>
<li>the reservoir evolves for a time ${m('τ')}, spreading that information through all the qubits;</li>
<li>observables such as ${m('⟨Z<sub>i</sub>⟩')} and ${m('⟨Z<sub>i</sub>Z<sub>j</sub>⟩')} are read out as features ${m('x<sub>k</sub>')}, and the output is ${m('y<sub>k</sub> = w · x<sub>k</sub>')}.</li>
</ol>
<p>The reset itself provides fading memory: each step discards part of the old state. Only ${m('w')} is trained, by ridge regression, which takes a fraction of a second. The exponentially large state space offers many possible features, and time multiplexing (reading out at several moments within each step) adds more “virtual nodes”.</p>
${LAB('reservoir')}
<h2>The measurement problem and hardware</h2>
<p>Measuring a quantum system disturbs it, but a reservoir needs its state to persist. The lab reads exact expectation values, which a real device can only estimate by repeating the whole input sequence many times or by using large ensembles, as in NMR. Each feature then carries shot noise of about ${m('1/√shots')}. Alternatives include weak measurements and protocols that restart from a window of recent inputs. Demonstrations have run on superconducting processors, photonic systems and, at the largest scale so far, Rydberg atom arrays with over a hundred atoms (Kornjača and colleagues at QuEra, 2024; [[L:atoms]]).</p>
<h2>Where it might help</h2>
<ul>
<li><strong>Time series.</strong> Benchmarks include short-term memory, the nonlinear NARMA tasks, and chaotic series such as Mackey–Glass. Performance depends on the dynamical regime: too little mixing gives no memory, too much scrambles everything; the best results tend to sit near the boundary between localized and chaotic dynamics ([[L:timecrystal]], [[L:lightcone]]).</li>
<li><strong>Quantum data.</strong> A quantum reservoir can take quantum states as input, for example to classify entanglement or estimate properties of states from sensors, without converting them to classical data first. This may be the most natural use.</li>
<li><strong>Caveats.</strong> No advantage over good classical reservoirs has been established for classical time series, and shot noise eats into the large feature space. Like other quantum machine-learning models ([[L:qml]], [[L:qnn]]), it is best seen as an exploratory tool for near-term hardware.</li>
</ul>
`,
  labs: {
    reservoir: {
      title: 'A five-qubit reservoir learning time series',
      cap: 'The input is a random sequence sₖ. Top: on held-out test steps, the target (cyan) and the reservoir’s linear prediction (copper) for the chosen task. Bottom: memory capacity, how well the reservoir can recall the input from d steps ago (squared correlation, 1 = perfect). With τ near zero the reservoir does not mix and remembers only the present input; moderate τ spreads memory over several steps. Finite shots add noise to every feature.',
      build(body, id) {
        let tau = 2, task = 'mem', delay = 2, lgShots = 6, seed = 4, job = 0, R = null; const STEPS = 520, WASH = 40, TRAIN = 330;
        const tc = canvas('', 'height:180px'), mc = canvas('', 'height:150px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const inputs = (() => { const r = rng(99); return [...Array(STEPS)].map(() => r()); })();
        const narma = (() => { const y = new Array(STEPS).fill(0); for (let k = 2; k < STEPS; k++) y[k] = .4 * y[k - 1] + .4 * y[k - 1] * y[k - 2] + .6 * inputs[k] ** 3 + .1; return y; })();
        const compute = () => { const my = ++job; Scope.later(20, () => { if (my !== job) return;
          const U = qrUnitary(tau, seed), F0 = qrFeatures(U, inputs), shots = 10 ** lgShots, nr = rng(7);
          const F = lgShots >= 6 ? F0 : F0.map(f => f.map(v => v + Math.sqrt(Math.max(0, 1 - v * v) / shots) * Math.sqrt(-2 * Math.log(nr() || 1e-12)) * Math.cos(TAU * nr())));
          const fit = tgt => { const idx = [...Array(STEPS).keys()].filter(k => k >= WASH && tgt[k] != null), tr = idx.filter(k => k < TRAIN), te = idx.filter(k => k >= TRAIN), f = ridge(tr.map(k => F[k]), tr.map(k => tgt[k]), 1e-6); return { te, pred: te.map(k => f(F[k])), truth: te.map(k => tgt[k]) }; };
          const mem = [...Array(11)].map((_, d) => { const tgt = inputs.map((_, k) => k - d >= 0 ? inputs[k - d] : null), r2 = fit(tgt); return corr2(r2.pred, r2.truth); });
          const tgt = task === 'mem' ? inputs.map((_, k) => k - delay >= 0 ? inputs[k - delay] : null) : narma, cur = fit(tgt);
          const nmse = cur.pred.reduce((s, v, i) => s + (v - cur.truth[i]) ** 2, 0) / cur.truth.length / (cur.truth.reduce((s, v) => s + (v - cur.truth.reduce((a, b) => a + b, 0) / cur.truth.length) ** 2, 0) / cur.truth.length);
          R = { mem, cur, nmse }; pt.inv(); pm.inv(); text(); }); };
        const pt = painter(tc, ({ ctx, w, h: H }) => {
          if (!R) return; const T = Theme.get(), n = 110, tr = R.cur.truth.slice(0, n), pr = R.cur.pred.slice(0, n), lo = Math.min(...tr, ...pr), hi = Math.max(...tr, ...pr), pad = (hi - lo) * .1 || .1;
          const A = axes(ctx, w, H, { x: [0, n - 1], y: [lo - pad, hi + pad], xt: [0, 25, 50, 75, 100], yt: [], xl: 'test time step', yl: task === 'mem' ? `recall s(k − ${delay})` : 'NARMA2 output', pad: { l: 14, b: 30 } });
          polyline(ctx, tr.map((v, i) => [A.X(i), A.Y(v)]), T.cyan, 2); polyline(ctx, pr.map((v, i) => [A.X(i), A.Y(v)]), T.copper, 2);
        });
        const pm = painter(mc, ({ ctx, w, h: H }) => {
          if (!R) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [-.6, 10.6], y: [0, 1.05], xt: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yt: [0, .5, 1], xl: 'delay d', yl: 'memory capacity C(d)', pad: { l: 34, b: 30 } }), bw = (A.R - A.L) / 11 * .7;
          R.mem.forEach((v, d) => { ctx.fillStyle = task === 'mem' && d === delay ? T.copper : rgba(T.cyan, .75); const x = A.X(d), y = A.Y(v); ctx.fillRect(x - bw / 2, y, bw, A.B - y); });
        });
        const text = () => { const MC = R.mem.reduce((s, v) => s + v, 0); ro.innerHTML = `<span class="k">features </span>5 ⟨Zᵢ⟩ + 10 ⟨ZᵢZⱼ⟩ + bias<br><span class="k">test error (normalized MSE) </span>${num(R.nmse, 3)}<br><span class="k">total memory capacity Σ C(d) </span>${num(MC, 2)}<br><span class="k">shots per feature </span>${lgShots >= 6 ? 'exact expectation values' : (10 ** lgShots).toLocaleString()}`; };
        const dsl = slider({ id: id('d'), label: 'Delay d for the memory task', min: 0, max: 8, step: 1, value: delay, fmt: String, on: v => { delay = v; compute(); } });
        body.append(tc, mc, h('div', { class: 'split' }, h('div', { class: 'stack' },
          field('Task', seg([{ v: 'mem', label: 'Recall input from d steps ago' }, { v: 'narma', label: 'NARMA2 (nonlinear)' }], task, v => { task = v; dsl.disable(v !== 'mem'); compute(); }, 'Task')), dsl,
          slider({ id: id('t'), label: 'Evolution time τ per step', min: .05, max: 6, step: .05, value: tau, fmt: v => num(v, 2), on: v => { tau = v; compute(); } }),
          slider({ id: id('s'), label: 'Shots per feature', min: 2, max: 6, step: 1, value: lgShots, fmt: v => v >= 6 ? 'exact' : (10 ** v).toLocaleString(), on: v => { lgShots = v; compute(); } }),
          h('div', { class: 'btns' }, btn('New random couplings', () => { seed++; compute(); }, 'sm'))), ro));
        compute();
      }
    }
  },
  take: ['Reservoir computing trains only a linear readout on the state of a fixed dynamical system; the reservoir needs high dimension, nonlinearity and fading memory.',
    'A quantum reservoir writes inputs by resetting a qubit, lets a fixed Hamiltonian mix them, and reads expectation values such as ⟨Zᵢ⟩ and ⟨ZᵢZⱼ⟩ as features.',
    'Too little evolution gives no memory and too much scrambles it; finite shots add noise to every feature, and measurement back-action complicates real devices.',
    'Demonstrations span superconducting, photonic and Rydberg-atom hardware; processing quantum data directly may be its most natural use.'],
  quiz: QZ([
    ['What is trained in reservoir computing?', ['Every weight of the network', 'Only the linear readout weights; the reservoir stays fixed', 'Only the input layer', 'Nothing'], 1, 'Training reduces to linear (ridge) regression, which is fast and convex.'],
    ['Which property lets a reservoir’s state depend on recent inputs but not ancient ones?', ['Unitarity', 'Fading memory (the echo state property)', 'Linearity', 'Periodicity'], 1, 'Old inputs must be gradually forgotten for the state to be a function of recent history.'],
    ['How is an input written into the quantum reservoir in the lab?', ['By measuring all qubits', 'By resetting qubit 0 to √(1−s)|0⟩ + √s|1⟩ at each step', 'By changing the Hamiltonian', 'By a Grover oracle'], 1, 'The reset also discards part of the old state, providing fading memory.'],
    ['What features does the readout use in the lab?', ['The full state vector', 'Expectation values ⟨Zᵢ⟩ and ⟨ZᵢZⱼ⟩', 'Only one bit', 'Gradients'], 1, 'Fifteen observables plus a bias feed the linear regression.'],
    ['Why does the reservoir avoid barren plateaus?', ['It uses fewer qubits', 'No parameters inside the quantum system are trained, so no gradients are needed', 'It runs classically', 'It has no noise'], 1, 'Only the classical linear readout is optimized.'],
    ['In the lab, what happens to memory capacity when τ is near zero?', ['It is maximal at all delays', 'The reservoir barely mixes, so it recalls only the current input', 'It becomes negative', 'Nothing changes'], 1, 'Information must spread from qubit 0 into the others to survive the next reset.'],
    ['What is the main obstacle to reading out a quantum reservoir on real hardware?', ['Too few qubits', 'Measurement disturbs the state, so features need repeated runs or ensembles and carry shot noise', 'The readout is nonlinear', 'Inputs cannot be encoded'], 1, 'Expectation values must be estimated, which costs many repetitions.'],
    ['What does NARMA2 test?', ['Pure memory', 'Nonlinear processing combined with memory of the previous outputs', 'Classification of images', 'Phase estimation'], 1, 'Its target depends on products of past outputs and the cube of the input.'],
    ['Which dynamical regime tends to work best for reservoirs?', ['Completely frozen dynamics', 'Near the boundary between localized and chaotic (ergodic) behaviour', 'Maximally chaotic only', 'No dynamics at all'], 1, 'Enough mixing for memory and nonlinearity, but not so much that inputs are scrambled away.'],
    ['What is considered a promising application of quantum reservoirs?', ['Breaking RSA', 'Processing quantum data directly, such as classifying quantum states', 'Sorting numbers', 'Replacing all classical reservoirs'], 1, 'Quantum inputs need no costly conversion to classical data.']
  ])
});

/* ---------- quantum PCA ---------- */
LESSONS.push({
  id: 'qpca', n: 37.9, stage: 9, minutes: 14, title: 'Quantum principal component analysis',
  lede: 'Principal component analysis finds the directions along which data varies most. Lloyd, Mohseni and Rebentrost (2014) showed how copies of a density matrix can be used to evolve another state under it, and with phase estimation to sample a matrix’s principal components. The idea is elegant; the fine print matters.',
  html: `
<h2>PCA in one paragraph</h2>
<p>Given data vectors ${m('x<sub>m</sub>')}, the covariance matrix ${m('Σ = (1/M) Σ<sub>m</sub> x<sub>m</sub>x<sub>m</sub>ᵀ')} (for centred data) is symmetric and positive. Its eigenvectors are the <strong>principal components</strong>, and its eigenvalues say how much variance lies along each. Keeping the top few compresses the data with the least loss. Classically this costs time polynomial in the dimension ${m('d')}.</p>
<h2>Data as a density matrix</h2>
<p>If each data vector can be loaded as an amplitude-encoded state ${m('|x<sub>m</sub>⟩')} ([[L:dequant]] discusses what that assumes), then preparing a random one of them gives the mixed state ${m('ρ = Σ<sub>m</sub> p<sub>m</sub> |x<sub>m</sub>⟩⟨x<sub>m</sub>|')}, proportional to the covariance matrix ([[L:densitymatrix]]). Its eigenvalues ${m('λ<sub>k</sub>')} are the normalized variances, and they sum to 1.</p>
<h2>Density matrix exponentiation</h2>
<p>The key trick is to apply ${m('e^(−iρt)')} to another state ${m('σ')} without knowing ${m('ρ')}, using copies of it. Put one copy of ${m('ρ')} next to ${m('σ')}, apply a small partial SWAP ${m('e^(−iSΔ)')}, and discard the copy:</p>
${EQ('Tr<sub>1</sub>[ e<sup>−iSΔ</sup> (ρ ⊗ σ) e<sup>iSΔ</sup> ] = σ − iΔ[ρ, σ] + O(Δ²)')}
<p>To first order this is exactly evolution under ${m('ρ')} for time ${m('Δ')}. Repeating with ${m('n')} fresh copies and ${m('Δ = t/n')} gives ${m('e^(−iρt)σe^(iρt)')} with error of order ${m('t²/n')}: about ${m('t²/ε')} copies for accuracy ${m('ε')}. Kimmel and colleagues (2017) proved this number of copies is optimal.</p>
${LAB('dme')}
<h2>Sampling principal components</h2>
<p>Run quantum phase estimation ([[L:qpe]]) with controlled ${m('e^(−iρt)')}, using ${m('ρ')} itself as the input. Writing ${m('ρ = Σ λ<sub>k</sub>|u<sub>k</sub>⟩⟨u<sub>k</sub>|')}, the outcome is an estimate of ${m('λ<sub>k</sub>')} with probability ${m('λ<sub>k</sub>')}, and the register is left in the eigenvector ${m('|u<sub>k</sub>⟩')}. Large components come out often, small ones rarely, exactly what PCA wants. Each run uses ${m('O(log d)')} qubits per copy, and the cost depends on the desired precision rather than on ${m('d')}.</p>
${LAB('pcaqpe')}
<h2>The fine print</h2>
<ul>
<li><strong>Output is a quantum state.</strong> The algorithm leaves ${m('|u<sub>k</sub>⟩')} in a register. Reading out a ${m('d')}-dimensional vector classically would need about ${m('d')} measurements, so the result must feed another quantum step.</li>
<li><strong>Input needs QRAM.</strong> Preparing many copies of ${m('ρ')} from classical data needs fast state preparation. With the matching classical access, Tang (2018) showed that low-rank PCA can be dequantized ([[L:dequant]]).</li>
<li><strong>Quantum data is different.</strong> If ${m('ρ')} comes from an experiment, for instance the output of a quantum sensor or simulation, copies are produced naturally, and density matrix exponentiation can reveal its dominant eigenvectors. Huang and colleagues (Science, 2022) showed experimentally that learning from quantum data with quantum memory can need exponentially fewer experiments ([[L:shadows]]).</li>
</ul>
`,
  labs: {
    dme: {
      title: 'Evolving a state under ρ using copies of ρ',
      cap: 'ρ is a mixed qubit state with Bloch vector r (dark dot); e^(−iρt) rotates the Bloch vector of σ about r at angular speed |r|. Each partial-SWAP step with a fresh copy gives v → cos²Δ v + sin²Δ r + sinΔ cosΔ (r × v). The dashed ring is the exact result; the copper arrow is the result from n copies, with its path in copper dots. More copies, smaller steps, smaller error.',
      build(body, id) {
        let n = 8, t = PI, pur = .8, ang = .6;
        const sph = canvas('sq', 'max-width:300px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: false }), ro = h('div', { class: 'readout', style: 'white-space:normal' }), cv = canvas('', 'height:150px');
        const v0 = [0, 0, 1];
        const rv = () => [pur * Math.sin(ang), 0, pur * Math.cos(ang)];
        const exact = tt => V.rot(v0, V.unit(rv()), V.norm(rv()) * tt);
        const dme = (nn, tt) => { const r = rv(), d = tt / nn, c2 = Math.cos(d) ** 2, s2 = Math.sin(d) ** 2, sc = Math.sin(d) * Math.cos(d); let v = v0.slice(); const path = [v]; for (let k = 0; k < nn; k++) { const x = V.cross(r, v); v = [0, 1, 2].map(i => c2 * v[i] + s2 * r[i] + sc * x[i]); path.push(v); } return { v, path }; };
        const fid = (a, b) => { const la = V.norm(a), lb = V.norm(b), sq = (1 - la * la) * (1 - lb * lb); return .5 * (1 + V.dot(a, b) + Math.sqrt(Math.max(0, sq))); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 400], y: [1e-5, 1], xlog: true, ylog: true, xt: [1, 10, 100, 400], yt: [1e-4, 1e-2, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'copies n', yl: 'infidelity', pad: { l: 44, b: 30 } });
          const pts = []; for (let k = 1; k <= 400; k = Math.max(k + 1, Math.round(k * 1.15))) { const e = exact(t), d = dme(k, t).v; pts.push([A.X(k), A.Y(clamp(1 - fid(e, d), 1e-5, 1))]); } polyline(ctx, pts, T.copper, 2.4);
          const e = exact(t), d = dme(n, t).v; dot(ctx, A.X(n), A.Y(clamp(1 - fid(e, d), 1e-5, 1)), 5.5, T.copper, T.surface);
        });
        const up = () => { const e = exact(t), R = dme(n, t); bv.v = R.v; bv.target = e; const pth = []; for (let k = 0; k <= 60; k++) pth.push({ v: exact(t * k / 60), r: 2, color: Theme.get().cyan }); bv.extra = pth.concat(R.path.filter((_, i) => R.path.length < 80 || i % Math.ceil(R.path.length / 80) === 0).map(v => ({ v, r: 2.6, color: Theme.get().copper })), [{ v: rv(), r: 6, color: Theme.get().ink }]); bv.inv(); p.inv();
          ro.innerHTML = `<span class="k">ρ Bloch vector length (purity) </span>${num(pur, 2)}<br><span class="k">rotation angle |r|t </span>${num(deg(pur * t), 0)}°<br><span class="k">copies used </span>${n} <span class="k">· step Δ = t/n = </span>${num(t / n, 3)}<br><span class="k">infidelity with exact evolution </span>${sci(1 - fid(e, R.v), 2)}<br><span class="k">σ also drifts towards ρ by sin²Δ per step: the O(t²/n) error</span>`; };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, sph, cv), h('div', { class: 'stack' },
          slider({ id: id('n'), label: 'Copies of ρ (steps n)', min: 1, max: 200, step: 1, value: n, fmt: String, on: v => { n = v; up(); } }),
          slider({ id: id('t'), label: 'Evolution time t', min: 0, max: 2 * PI, step: .02, value: t, fmt: v => num(v, 2), on: v => { t = v; up(); } }),
          slider({ id: id('p'), label: 'Purity of ρ (Bloch length |r|)', min: .1, max: 1, step: .01, value: pur, fmt: v => num(v, 2), on: v => { pur = v; up(); } }),
          slider({ id: id('a'), label: 'Direction of r (angle from z)', min: 0, max: PI, step: .01, value: ang, fmt: v => num(deg(v), 0) + '°', on: v => { ang = v; up(); } }), ro)));
        up();
      }
    },
    pcaqpe: {
      title: 'Phase estimation samples the principal components',
      cap: 'Left: 2D data with its principal axes, lengths proportional to the eigenvalues of ρ = Σ/Tr Σ. Right: the distribution of phase-estimation outcomes with m ancilla qubits, using ρ itself as input; peaks sit at the eigenvalues and their weights are the eigenvalues. Sample runs: each returns an eigenvalue estimate and leaves the register in that principal component.',
      build(body, id) {
        let spread = .25, rot = .5, m = 5, counts = [0, 0], seed = 1, pts = [];
        const dc = canvas('sq', 'max-width:260px;margin:0 auto'), hc = canvas('', 'height:220px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const tFac = 2 * PI * .9;
        const make = () => { const r = rng(seed), g = () => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(TAU * r()); pts = [...Array(160)].map(() => { const a = g(), b = g() * Math.sqrt(spread); return [a * Math.cos(rot) - b * Math.sin(rot), a * Math.sin(rot) + b * Math.cos(rot)]; }); counts = [0, 0]; };
        const eig = () => { let sxx = 0, sxy = 0, syy = 0; for (const [x, y] of pts) { sxx += x * x; sxy += x * y; syy += y * y; } const tr = sxx + syy, a = sxx / tr, b = sxy / tr, d = syy / tr, mean = (a + d) / 2, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b), l1 = mean + disc, l2 = mean - disc, th = .5 * Math.atan2(2 * b, a - d); return { l: [l1, l2], u: [[Math.cos(th), Math.sin(th)], [-Math.sin(th), Math.cos(th)]] }; };
        const pj = (phi, j) => { const M2 = 2 ** m, dlt = phi - j / M2; if (Math.abs(Math.sin(PI * dlt)) < 1e-12) return 1; return (Math.sin(PI * M2 * dlt) / (M2 * Math.sin(PI * dlt))) ** 2; };
        const dist = E => { const M2 = 2 ** m; return [...Array(M2)].map((_, j) => E.l.reduce((s, l) => s + l * pj(l * .9, j), 0)); };
        const pd = painter(dc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), E = eig(), c3 = [w / 2, H / 2], sc = Math.min(w, H) / 7.5; ctx.strokeStyle = T.line; ctx.beginPath(); ctx.moveTo(0, c3[1]); ctx.lineTo(w, c3[1]); ctx.moveTo(c3[0], 0); ctx.lineTo(c3[0], H); ctx.stroke();
          for (const [x, y] of pts) dot(ctx, c3[0] + x * sc, c3[1] - y * sc, 2.4, rgba(T.ink, .45));
          E.u.forEach((u, k) => { const L = Math.sqrt(E.l[k]) * sc * 3.2; arrow(ctx, c3[0], c3[1], c3[0] + u[0] * L, c3[1] - u[1] * L, k ? T.cyan : T.copper, 3, 11); txt(ctx, k ? 'u₂' : 'u₁', c3[0] + u[0] * (L + 14), c3[1] - u[1] * (L + 14), { color: k ? T.cyan : T.copper, font: '700 13px "JetBrains Mono",monospace' }); });
        });
        const ph = painter(hc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), E = eig(), P = dist(E), M2 = 2 ** m, mx = Math.max(...P), A = axes(ctx, w, H, { x: [0, 1], y: [0, mx * 1.15], xt: [0, .25, .5, .75, 1], xf: v => num(v, 2), yt: [], xl: 'estimated eigenvalue λ̂ = j/(0.9 · 2ᵐ)', yl: 'probability', pad: { l: 14, b: 30 } });
          const bw = (A.R - A.L) / (M2 / .9) * .8; P.forEach((p, j) => { const lam = j / M2 / .9; if (lam > 1.05) return; const x = A.X(lam), y = A.Y(p); const near = Math.abs(lam - E.l[0]) < Math.abs(lam - E.l[1]); ctx.fillStyle = near ? T.copper : T.cyan; ctx.fillRect(x - bw / 2, y, bw, A.B - y); });
          E.l.forEach((l, k) => polyline(ctx, [[A.X(l), A.T], [A.X(l), A.B]], k ? T.cyan : T.copper, 1.4, [4, 4]));
        });
        const text = () => { const E = eig(), tot = counts[0] + counts[1]; ro.innerHTML = `<span class="k">eigenvalues of ρ </span>λ₁ = ${num(E.l[0], 3)}, λ₂ = ${num(E.l[1], 3)}<br><span class="k">ancilla qubits m </span>${m} <span class="k">→ resolution ≈ </span>${num(1 / (2 ** m * .9), 3)}<br><span class="k">sampled runs </span>${tot}${tot ? ` <span class="k">· landed in u₁ </span>${counts[0]} (${pct(counts[0] / tot, 0)}) <span class="k">· in u₂ </span>${counts[1]}` : ''}`; };
        const sample = k => { const E = eig(); for (let i = 0; i < k; i++) counts[Math.random() < E.l[0] ? 0 : 1]++; text(); };
        const up = () => { pd.inv(); ph.inv(); text(); };
        body.append(h('div', { class: 'split' }, dc, hc), h('div', { class: 'split' }, h('div', { class: 'stack' },
          slider({ id: id('s'), label: 'Variance along the minor axis', min: 0, max: 1, step: .01, value: spread, fmt: v => num(v, 2), on: v => { spread = v; make(); up(); } }),
          slider({ id: id('r'), label: 'Rotation of the data', min: 0, max: PI, step: .01, value: rot, fmt: v => num(deg(v), 0) + '°', on: v => { rot = v; make(); up(); } }),
          slider({ id: id('m'), label: 'Ancilla qubits m', min: 2, max: 8, step: 1, value: m, fmt: String, on: v => { m = v; up(); } }),
          h('div', { class: 'btns' }, btn('Sample 50 runs', () => sample(50), 'pri'), btn('New data', () => { seed++; make(); up(); }, 'sm'))), ro));
        make(); up();
      }
    }
  },
  take: ['PCA keeps the top eigenvectors of the covariance matrix; amplitude-encoded data mixed at random gives a density matrix ρ proportional to it.',
    'Density matrix exponentiation applies e^(−iρt) to a state using partial SWAPs with fresh copies of ρ; error O(t²/n) means about t²/ε copies, which is optimal.',
    'Phase estimation on ρ itself returns eigenvalue λₖ with probability λₖ and leaves the principal component |uₖ⟩ in the register.',
    'The output is quantum, the input needs QRAM, and low-rank classical PCA is dequantizable; the strongest case is for quantum data from experiments.'],
  quiz: QZ([
    ['What are the principal components of a data set?', ['The largest data points', 'The eigenvectors of the covariance matrix, ordered by eigenvalue', 'The mean vectors', 'Random projections'], 1, 'Eigenvalues measure the variance along each direction.'],
    ['How does quantum PCA represent the covariance matrix?', ['As a circuit', 'As a density matrix ρ, a random mixture of amplitude-encoded data states', 'As a classical table', 'As a phase'], 1, 'ρ = Σ pₘ|xₘ⟩⟨xₘ| is proportional to the (uncentred) covariance matrix.'],
    ['What does one step of density matrix exponentiation do?', ['Measures ρ', 'A partial SWAP between a copy of ρ and σ, after which the copy is discarded, giving σ − iΔ[ρ, σ] + O(Δ²)', 'Clones σ', 'Applies a Hadamard'], 1, 'To first order it is evolution of σ under the Hamiltonian ρ.'],
    ['How many copies of ρ does density matrix exponentiation need for time t and error ε?', ['One', 'About t²/ε', 'log t', '2ᵗ'], 1, 'Errors of order Δ² per step add up to t²/n over n steps; Kimmel and colleagues showed this is optimal.'],
    ['In the lab, what extra effect besides rotation does each step have on σ?', ['None', 'A sin²Δ pull of σ towards ρ, which is the source of the O(t²/n) error', 'It flips σ', 'It purifies ρ'], 1, 'Smaller steps make this drift negligible.'],
    ['What happens when phase estimation is run with ρ itself as input?', ['It fails', 'It returns eigenvalue λₖ with probability λₖ and leaves the register in eigenvector |uₖ⟩', 'It outputs all eigenvalues at once', 'It returns the trace'], 1, 'The dominant components are sampled most often.'],
    ['What controls the resolution of the eigenvalue estimate?', ['The data size', 'The number of ancilla qubits m (about 2⁻ᵐ)', 'The purity only', 'The number of copies alone'], 1, 'More ancillas sharpen the peaks, at the cost of longer evolutions.'],
    ['Why is the output of quantum PCA hard to use classically?', ['It is random', 'It is a quantum state |uₖ⟩; reading out d amplitudes needs about d measurements', 'It is encrypted', 'It is always zero'], 1, 'Its value lies in feeding further quantum processing.'],
    ['What did Tang show about quantum PCA for classical data?', ['It is impossible', 'Low-rank PCA can be dequantized given sample-and-query access', 'It is exponentially faster in all cases', 'It needs no data'], 1, 'The exponential speedup relied on the state-preparation assumption.'],
    ['Where does quantum PCA have its strongest case?', ['Spreadsheets', 'Quantum data, where copies of ρ come directly from an experiment or simulation', 'Sorting', 'Image compression on laptops'], 1, 'No QRAM is needed when the states are produced physically.']
  ])
});

/* ---------- contextuality: the Peres–Mermin square ---------- */
const PM = [['XI', 'IX', 'XX'], ['IZ', 'ZI', 'ZZ'], ['XZ', 'ZX', 'YY']];
const PM_ROW = [1, 1, 1], PM_COL = [1, 1, -1];
/* Pauli strings on a 4-qubit state vector (Alice: qubits 0,1; Bob: qubits 2,3) */
function pauliApply(re, im, n, ops) {
  const N = 1 << n; let r = Float64Array.from(re), i2 = Float64Array.from(im);
  for (const [q, P] of ops) { if (P === 'I') continue; const m2 = 1 << (n - 1 - q), nr = new Float64Array(N), ni = new Float64Array(N);
    for (let b = 0; b < N; b++) { const bit = b & m2 ? 1 : 0, src = P === 'Z' ? b : b ^ m2; let ar = r[src], ai = i2[src];
      if (P === 'Z' && bit) { ar = -ar; ai = -ai; }
      if (P === 'Y') { const sb = src & m2 ? 1 : 0; const t = ar; if (sb === 0) { ar = -ai; ai = t; } else { ar = ai; ai = -t; } }
      nr[b] = ar; ni[b] = ai; }
    r = nr; i2 = ni; }
  return [r, i2];
}
function measurePauli(st, n, ops) {
  const [ar, ai] = pauliApply(st.re, st.im, n, ops); let pp = 0; const N = 1 << n;
  for (let b = 0; b < N; b++) { const x = (st.re[b] + ar[b]) / 2, y = (st.im[b] + ai[b]) / 2; pp += x * x + y * y; }
  const out = Math.random() < pp ? 1 : -1, nrm = Math.sqrt(out > 0 ? pp : 1 - pp) || 1;
  for (let b = 0; b < N; b++) { st.re[b] = (st.re[b] + out * ar[b]) / 2 / nrm; st.im[b] = (st.im[b] + out * ai[b]) / 2 / nrm; }
  return out;
}
const opsOf = (s, off) => [[off, s[0]], [off + 1, s[1]]];

LESSONS.push({
  id: 'contextuality', n: 38.1, stage: 10, minutes: 14, title: 'Contextuality: the Peres–Mermin square',
  lede: 'Bell’s theorem rules out local hidden variables. Contextuality goes further: quantum results cannot come from any hidden values that each measurement has regardless of which compatible measurements accompany it. A three-by-three grid of two-qubit observables proves it with no probabilities and no entangled state required.',
  html: `
<h2>Predetermined answers?</h2>
<p>Suppose every observable secretly has a value, and measuring just reveals it. If two observables ${m('A')} and ${m('B')} commute, they can be measured together, and quantum mechanics says their product ${m('AB')} is also an observable whose result is always the product of theirs. A <strong>noncontextual</strong> hidden-variable model assigns each observable one value ${m('v(A)')}, the same whichever compatible observables are measured with it, its <strong>context</strong>, and respects those product rules. The Kochen–Specker theorem (1967, with related work by Bell in 1966) shows that no such assignment exists for quantum systems of dimension three or more.</p>
<h2>The magic square</h2>
<p>Peres and Mermin (both 1990) found a beautifully simple proof with two qubits. Arrange nine Pauli observables in a grid:</p>
<div class="tbl-wrap"><table class="tbl" style="text-align:center"><tbody>
<tr><td>X ⊗ I</td><td>I ⊗ X</td><td>X ⊗ X</td></tr>
<tr><td>I ⊗ Z</td><td>Z ⊗ I</td><td>Z ⊗ Z</td></tr>
<tr><td>X ⊗ Z</td><td>Z ⊗ X</td><td>Y ⊗ Y</td></tr>
</tbody></table></div>
<p>Each has outcomes ${m('±1')}. The three observables in any row or column commute, so each row and column is a context that can be measured jointly ([[L:clifford]] has the commutation rules). Multiplying them out, every row multiplies to ${m('+I')}, and so do the first two columns, but the third column multiplies to ${m('−I')}, because ${m('XZY = −i I')} on each qubit. Now try to assign predetermined values ${m('±1')}. The product of all nine values, computed row by row, must be ${m('+1')}; computed column by column it must be ${m('−1')}. No assignment can satisfy all six constraints, and this holds for every state of the two qubits.</p>
${LAB('square')}
<h2>The magic square game</h2>
<p>The square becomes a game (Aravind, 2002). Alice is given a row and Bob a column, chosen at random, and they cannot communicate. Alice writes ${m('±1')} in the three cells of her row with product ${m('+1')}; Bob writes values in his column with product ${m('+1')}, or ${m('−1')} for the third column. They win if they agree on the cell where the row and column cross. Any classical strategy fails on at least one of the nine questions, so the best win rate is ${m('8/9')}. Sharing two Bell pairs ([[L:entanglement]]), and measuring the observables of their row and column on their halves, they win <em>every</em> round. This “pseudo-telepathy” is a nonlocal game like the Mermin game ([[L:ghz]]) and the CHSH game behind E91 ([[L:e91]]).</p>
${LAB('game')}
<h2>Contextuality as a resource</h2>
<ul>
<li><strong>Magic states.</strong> Howard, Wallman, Veitch and Emerson (Nature, 2014) showed that for qudit stabilizer computing, contextuality is exactly what a magic state must supply to promote Clifford operations to universal computation ([[L:magic]]).</li>
<li><strong>Measurement-based computing.</strong> Raussendorf (2013) linked the computational power of measurement-based schemes to contextuality ([[L:mbqc]]).</li>
<li><strong>Provable advantage.</strong> Bravyi, Gosset and König (Science, 2018) used a contextuality-style nonlocal game to show that constant-depth quantum circuits solve a problem no constant-depth classical circuit can ([[L:advantage]]).</li>
<li><strong>Experiments.</strong> Trapped ions (Kirchmair and colleagues, 2009) and photons have violated the Peres–Mermin noncontextuality inequality ${m('⟨R₁⟩ + ⟨R₂⟩ + ⟨R₃⟩ + ⟨C₁⟩ + ⟨C₂⟩ − ⟨C₃⟩ ≤ 4')}, reaching close to the quantum value of 6, for many different input states.</li>
</ul>
`,
  labs: {
    square: {
      title: 'Try to fill the magic square',
      cap: 'Click cells to assign predetermined values ±1. Each row must multiply to +1, and the columns to +1, +1 and −1 (the quantum rules, which you can verify in “Show observables” mode). You will never satisfy more than five of the six constraints. Then measure a context on a real two-qubit state: all three observables are measured one after another; each outcome is random, yet their product always obeys the rule.',
      build(body, id) {
        let val = [[1, 1, 1], [1, 1, 1], [1, 1, 1]], showObs = false, ctx3 = 'r2', state = 'bell', last = null;
        const grid = h('div', { style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) 60px;gap:6px;max-width:380px' }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const prod = arr => arr.reduce((s, v) => s * v, 1);
        const draw = () => { grid.innerHTML = ''; const T = Theme.get();
          for (let r = 0; r < 3; r++) { for (let c3 = 0; c3 < 3; c3++) { const inCtx = ctx3 === 'r' + r || ctx3 === 'c' + c3, out = last && last.cells.find(x => x[0] === r && x[1] === c3);
              const b = h('button', { type: 'button', class: 'btn', style: `height:54px;font:700 ${showObs ? 15 : 20}px var(--f-mono);${inCtx ? 'box-shadow:inset 0 0 0 2px var(--cyan);' : ''}${!showObs && val[r][c3] < 0 ? 'background:var(--copper);color:var(--on-copper);' : ''}`, onclick: () => { if (showObs) return; val[r][c3] *= -1; last = null; draw(); } }, showObs ? PM[r][c3].split('').join('⊗') + (out ? ` → ${out[2] > 0 ? '+1' : '−1'}` : '') : (val[r][c3] > 0 ? '+1' : '−1'));
              grid.append(b); }
            const ok = prod(val[r]) === PM_ROW[r]; grid.append(h('div', { style: `display:grid;place-items:center;font:600 12px var(--f-mono);color:${showObs ? 'var(--muted)' : ok ? 'var(--good)' : 'var(--bad)'}` }, showObs ? '= +I' : `${prod(val[r]) > 0 ? '+' : '−'} ${ok ? '✓' : '✗'}`)); }
          for (let c3 = 0; c3 < 3; c3++) { const pc = prod(val.map(r => r[c3])), ok = pc === PM_COL[c3]; grid.append(h('div', { style: `text-align:center;font:600 12px var(--f-mono);color:${showObs ? 'var(--muted)' : ok ? 'var(--good)' : 'var(--bad)'}` }, showObs ? (PM_COL[c3] > 0 ? '= +I' : '= −I') : `${pc > 0 ? '+' : '−'} ${ok ? '✓' : '✗'} (need ${PM_COL[c3] > 0 ? '+' : '−'})`)); }
          grid.append(h('div'));
          const sat = [0, 1, 2].filter(r => prod(val[r]) === PM_ROW[r]).length + [0, 1, 2].filter(c3 => prod(val.map(r => r[c3])) === PM_COL[c3]).length;
          ro.innerHTML = (showObs ? `<span class="k">quantum: each row and the first two columns multiply to +I; the third column to −I, because XZY = −iI on each qubit</span>` : `<span class="k">constraints satisfied </span>${sat} of 6${sat === 5 ? ': the best any assignment can do' : ''}<br><span class="k">product of all nine values: </span>${prod(val.flat()) > 0 ? '+1' : '−1'} <span class="k">(rows demand +1, columns demand −1)</span>`) +
            (last ? `<br><span class="k">measured ${last.name} on ${state === 'bell' ? 'a Bell state' : state === 'zero' ? '|00⟩' : 'a random state'}: </span>${last.cells.map(x => (x[2] > 0 ? '+1' : '−1')).join(', ')} <span class="k">product </span>${prod(last.cells.map(x => x[2])) > 0 ? '+1' : '−1'}` : ''); };
        const prep = () => { const st = new QState(2); if (state === 'bell') { st.g('H', 0); st.cx(0, 1); } else if (state === 'rand') { st.apply(0, Ry(Math.random() * PI)); st.apply(1, Rz(Math.random() * TAU)); st.apply(1, Ry(Math.random() * PI)); st.cx(0, 1); st.apply(0, Rx(Math.random() * PI)); } return st; };
        const measure = () => { const st = prep(), cells = ctx3[0] === 'r' ? [0, 1, 2].map(c3 => [+ctx3[1], c3]) : [0, 1, 2].map(r => [r, +ctx3[1]]);
          const o = cells.map(([r, c3]) => measurePauli(st, 2, opsOf(PM[r][c3], 0)));
          last = { name: (ctx3[0] === 'r' ? 'row ' : 'column ') + (+ctx3[1] + 1), cells: cells.map((x, k) => [...x, o[k]]) }; showObs = true; obsSeg.set(true); draw(); };
        const obsSeg = seg([{ v: false, label: 'Assign values' }, { v: true, label: 'Show observables' }], showObs, v => { showObs = v; draw(); }, 'Mode');
        body.append(h('div', { class: 'btns' }, obsSeg, btn('Random assignment', () => { val = val.map(r => r.map(() => Math.random() < .5 ? 1 : -1)); showObs = false; obsSeg.set(false); last = null; draw(); }, 'sm')),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, grid), h('div', { class: 'stack' },
            field('Context to measure', seg([['r0', 'Row 1'], ['r1', 'Row 2'], ['r2', 'Row 3'], ['c0', 'Col 1'], ['c1', 'Col 2'], ['c2', 'Col 3']].map(([v, label]) => ({ v, label })), ctx3, v => { ctx3 = v; last = null; draw(); }, 'Context')),
            field('State', seg([{ v: 'bell', label: 'Bell state' }, { v: 'zero', label: '|00⟩' }, { v: 'rand', label: 'Random' }], state, v => { state = v; last = null; draw(); }, 'State')),
            h('div', { class: 'btns' }, btn('Measure this context', measure, 'pri')), ro)));
        draw();
      }
    },
    game: {
      title: 'The magic square game: classical versus quantum',
      cap: 'Each round a referee picks a row for Alice and a column for Bob. The classical team uses the best fixed strategy (it fails only on row 3, column 3); the quantum team shares two Bell pairs and measures the square’s observables. Watch the win rates: 8/9 ≈ 0.889 classically, 1 quantumly. Add depolarizing noise to Bob’s qubits to see how much error the quantum advantage tolerates.',
      build(body, id) {
        let noise = 0, stats = { c: [0, 0], q: [0, 0] }, hist = [], last = null;
        const cv = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const CL = [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
        const round = () => { const r = Math.floor(Math.random() * 3), c3 = Math.floor(Math.random() * 3);
          const aC = CL[r].slice(), bC = CL.map(x => x[c3]); if (c3 === 2) bC[2] = -bC[2]; const winC = aC[c3] === bC[r];
          const st = new QState(4); st.g('H', 0); st.cx(0, 2); st.g('H', 1); st.cx(1, 3);
          for (const q of [2, 3]) if (Math.random() < noise) { const P = 'XYZ'[Math.floor(Math.random() * 3)], [nr, ni] = pauliApply(st.re, st.im, 4, [[q, P]]); st.re.set(nr); st.im.set(ni); }
          const aQ = [0, 1, 2].map(k => measurePauli(st, 4, opsOf(PM[r][k], 0))), bQ = [0, 1, 2].map(k => measurePauli(st, 4, opsOf(PM[k][c3], 2)));
          const winQ = aQ[c3] === bQ[r]; stats.c[0] += winC; stats.c[1]++; stats.q[0] += winQ; stats.q[1]++; hist.push([stats.c[0] / stats.c[1], stats.q[0] / stats.q[1]]); last = { r, c3, aQ, bQ, winQ, aC, bC, winC }; };
        const play = k => { for (let i = 0; i < k; i++) round(); if (hist.length > 4000) hist = hist.filter((_, i) => i % 2 === 0); p.inv(); text(); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), n = Math.max(10, hist.length), A = axes(ctx, w, H, { x: [1, n], y: [.5, 1.02], xt: [], yt: [.5, .75, 8 / 9, 1], yf: v => Math.abs(v - 8 / 9) < 1e-6 ? '8/9' : num(v, 2), xl: 'rounds played', yl: 'win rate', pad: { l: 40, b: 26 } });
          polyline(ctx, [[A.L, A.Y(8 / 9)], [A.R, A.Y(8 / 9)]], T.muted, 1.2, [4, 4]);
          if (hist.length) { polyline(ctx, hist.map((x, i) => [A.X(i + 1), A.Y(x[0])]), T.cyan, 2.2); polyline(ctx, hist.map((x, i) => [A.X(i + 1), A.Y(x[1])]), T.copper, 2.4); }
        });
        const leg = legendRow([['quantum team (two Bell pairs)', Theme.get().copper], ['classical team (best strategy)', Theme.get().cyan]]);
        const f = a => a.map(v => v > 0 ? '+' : '−').join('');
        const text = () => { ro.innerHTML = `<span class="k">rounds </span>${stats.q[1]}<br><span class="k">classical win rate </span>${stats.c[1] ? num(stats.c[0] / stats.c[1], 3) : '–'} <span class="k">· quantum </span>${stats.q[1] ? num(stats.q[0] / stats.q[1], 3) : '–'}` +
          (last ? `<br><span class="k">last round: row ${last.r + 1}, column ${last.c3 + 1} · quantum Alice ${f(last.aQ)}, Bob ${f(last.bQ)} → ${last.winQ ? 'agree ✓' : 'disagree ✗'}</span>` : '') + `<br><span class="k">depolarizing probability per Bob qubit </span>${pct(noise, 0)}`; };
        body.append(h('div', { class: 'btns' }, btn('Play 1 round', () => play(1)), btn('Play 100 rounds', () => play(100), 'pri'), btn('Play 1,000', () => play(1000)), btn('Reset', () => { stats = { c: [0, 0], q: [0, 0] }; hist = []; last = null; p.inv(); text(); }, 'sm')), cv, leg,
          h('div', { class: 'split' }, slider({ id: id('n'), label: 'Noise on Bob’s qubits (random Pauli with probability p)', min: 0, max: .5, step: .01, value: noise, fmt: v => pct(v, 0), on: v => { noise = v; stats = { c: [0, 0], q: [0, 0] }; hist = []; last = null; play(300); } }), ro));
        play(200);
      }
    }
  },
  take: ['A noncontextual hidden-variable model gives each observable one predetermined value, independent of which compatible observables are measured with it.',
    'In the Peres–Mermin square, rows multiply to +I and columns to +I, +I, −I, so no ±1 assignment satisfies all six constraints, for any state.',
    'As a game with two Bell pairs, the square is won every time, against a classical best of 8/9.',
    'Contextuality is a resource: it powers magic-state computation, measurement-based schemes and provable shallow-circuit advantages.'],
  quiz: QZ([
    ['What does a noncontextual hidden-variable model assume?', ['Locality only', 'Each observable has one predetermined value, the same whatever compatible observables it is measured with', 'Measurements are random', 'Only one observable can have a value'], 1, 'The value must not depend on the measurement context.'],
    ['What does the Kochen–Specker theorem prove?', ['Quantum mechanics is local', 'No noncontextual value assignment consistent with quantum product rules exists in dimension three or more', 'Hidden variables always exist', 'Entanglement is impossible'], 1, 'The Peres–Mermin square is a compact proof in dimension four.'],
    ['Why can each row or column of the Peres–Mermin square be measured jointly?', ['The observables are equal', 'The three observables in each row and column commute', 'They act on different particles only', 'They have no eigenvalues'], 1, 'Commuting observables share an eigenbasis.'],
    ['What is the product of the third column X⊗X · Z⊗Z · Y⊗Y?', ['+I', '−I', '0', 'X⊗X'], 1, 'On each qubit XZY = −iI, and (−i)² = −1.'],
    ['Why can no ±1 assignment satisfy all constraints?', ['There are too many cells', 'The product of all nine values must be +1 by rows but −1 by columns', 'Values must be complex', 'The cells are random'], 1, 'Every cell appears in exactly one row and one column, so the two products must agree.'],
    ['Does the Peres–Mermin argument depend on the quantum state?', ['Yes, it needs a Bell state', 'No, it is state-independent', 'Only for pure states', 'Only for |00⟩'], 1, 'The constraints are operator identities, true for every state.'],
    ['What is the best classical win rate in the magic square game?', ['1/2', '8/9', '3/4', '1'], 1, 'A fixed assignment can satisfy at most five of the six constraints, failing one of nine question pairs.'],
    ['What do Alice and Bob need to win the magic square game every time?', ['Communication', 'Two shared Bell pairs, measured with the square’s observables', 'One qubit each', 'A classical random number'], 1, 'Entanglement makes their answers consistent on the shared cell.'],
    ['How did Howard and colleagues relate contextuality to quantum computing?', ['They showed it is useless', 'Contextuality is the resource magic states supply to make qudit stabilizer computation universal', 'They used it for cooling', 'They showed it causes noise'], 1, 'States without contextuality can be simulated efficiently in that setting.'],
    ['What is the classical bound of the Peres–Mermin noncontextuality inequality ⟨R₁⟩ + ⟨R₂⟩ + ⟨R₃⟩ + ⟨C₁⟩ + ⟨C₂⟩ − ⟨C₃⟩?', ['6', '4', '2', '0'], 1, 'Quantum mechanics reaches 6 for any state; ion and photon experiments came close.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Reservoir computing', 'Machine learning with a fixed dynamical system as reservoir, training only a linear readout of its state.', 'qrc'],
  ['Fading memory', 'The property that a system’s state depends on recent inputs and gradually forgets older ones.', 'qrc'],
  ['Density matrix exponentiation', 'Applying e^(−iρt) to a state using many copies of ρ and small partial SWAPs.', 'qpca'],
  ['Quantum principal component analysis', 'Using density matrix exponentiation and phase estimation to sample the eigenvectors of a density matrix, weighted by eigenvalue.', 'qpca'],
  ['Contextuality', 'The impossibility of assigning measurement outcomes that do not depend on which compatible measurements are made alongside.', 'contextuality'],
  ['Kochen–Specker theorem', 'The theorem that noncontextual hidden-variable models cannot reproduce quantum mechanics in dimension three or more.', 'contextuality'],
  ['Magic square game', 'A nonlocal game based on the Peres–Mermin square, won with certainty using two Bell pairs but at most 8/9 classically.', 'contextuality']
);
})();
