/* =====================================================================
   Research tracks · algorithms: linear systems (HHL) and its fine print
                   · information theory: no-cloning and optimal cloning
   ===================================================================== */
(() => {
const ALG = 6, QIT = 10;

/* ---------- HHL on a 4×4 positive matrix, simulated exactly in its eigenbasis ---------- */
function hhlSim(t, kappa, beta) {
  const K = 1 << t, lam = [1 / kappa, Math.pow(kappa, -2 / 3), Math.pow(kappa, -1 / 3), 1], C = 1 / kappa;
  const fejer = d => { const s = Math.sin(PI * d); return Math.abs(s) < 1e-12 ? 1 : (Math.sin(PI * K * d) ** 2) / (K * K * s * s); };
  const pk = lam.map(l => { const ph = l * (K - 1) / K, row = new Float64Array(K); for (let k = 0; k < K; k++) row[k] = fejer(ph - k / K); return row; });
  const amp = k => k === 0 ? 0 : Math.min(1, C * (K - 1) / k);
  const xt = beta.map((b, j) => { let s = 0; for (let k = 0; k < K; k++) s += pk[j][k] * amp(k); return b * s; }), xe = beta.map((b, j) => b * C / lam[j]);
  const n2 = v => v.reduce((s, x) => s + x * x, 0), ov = xt.reduce((s, x, j) => s + x * xe[j], 0);
  return { K, lam, pk, xt, xe, psucc: n2(xt), pideal: n2(xe), fid: ov * ov / (n2(xt) * n2(xe) || 1) };
}

LESSONS.push({
  id: 'hhl', n: 30.8, stage: ALG, minutes: 16, title: 'Linear systems: HHL and the fine print',
  lede: 'Solving A x = b underlies simulation, optimization and machine learning. A quantum algorithm can do it exponentially faster in the dimension, but only under conditions that matter as much as the speedup itself.',
  html: `
<h2>The promise</h2>
<p>Given an ${m('N × N')} matrix ${m('A')} and a vector ${m('b')}, find ${m('x = A<sup>−1</sup>b')}. The best classical methods for sparse, well-conditioned matrices, such as conjugate gradient, take time roughly proportional to ${m('N s √κ')}, where ${m('s')} is the number of non-zero entries per row and ${m('κ')} the <strong>condition number</strong>, the ratio of the largest to the smallest eigenvalue magnitude. In 2009 Harrow, Hassidim and Lloyd (HHL) gave a quantum algorithm whose cost grows only as ${m('log N')}: it prepares a state ${m('|x⟩')} proportional to ${m('A<sup>−1</sup>|b⟩')} in time about ${m('log N · s² κ² / ε')}.</p>
<h2>How it works</h2>
<p>Write ${m('|b⟩ = Σ<sub>j</sub> β<sub>j</sub>|u<sub>j</sub>⟩')} in the eigenbasis of a Hermitian ${m('A')}, with eigenvalues ${m('λ<sub>j</sub>')}. Inverting ${m('A')} means multiplying each component by ${m('1/λ<sub>j</sub>')}, and the algorithm does exactly that, one eigenvalue at a time, in superposition:</p>
<ol>
<li><strong>Phase estimation</strong> ([[L:qpe]]) with ${m('e<sup>iAτ</sup>')} writes an estimate of ${m('λ<sub>j</sub>')} into a clock register: ${m('Σ β<sub>j</sub>|λ̃<sub>j</sub>⟩|u<sub>j</sub>⟩')}.</li>
<li>A <strong>controlled rotation</strong> of an ancilla puts amplitude ${m('C/λ̃<sub>j</sub>')} on ${m('|1⟩')}, with ${m('C ≤ λ<sub>min</sub>')}.</li>
<li><strong>Uncomputing</strong> phase estimation returns the clock to ${m('|0⟩')}.</li>
<li><strong>Post-selecting</strong> the ancilla on ${m('|1⟩')} leaves ${m('|x⟩ ∝ Σ (β<sub>j</sub>/λ<sub>j</sub>)|u<sub>j</sub>⟩')}. Success has probability about ${m('1/κ²')}, which amplitude amplification ([[L:ampest]]) improves to about ${m('1/κ')} repetitions.</li>
</ol>
${EQ('Σ<sub>j</sub> β<sub>j</sub>|u<sub>j</sub>⟩ &nbsp;→&nbsp; Σ<sub>j</sub> β<sub>j</sub>|λ̃<sub>j</sub>⟩|u<sub>j</sub>⟩ &nbsp;→&nbsp; Σ<sub>j</sub> β<sub>j</sub>|λ̃<sub>j</sub>⟩|u<sub>j</sub>⟩(C/λ̃<sub>j</sub>|1⟩ + …) &nbsp;→&nbsp; Σ<sub>j</sub> (β<sub>j</sub>C/λ<sub>j</sub>)|u<sub>j</sub>⟩')}
<p>The lab runs this pipeline exactly on a 4×4 matrix with eigenvalues spread between ${m('1/κ')} and 1. Too few clock qubits blur the eigenvalue estimates, and small eigenvalues, whose inverses are largest, suffer most.</p>
${LAB('hhl')}
<h2>Faster versions</h2>
<p>The ${m('κ²/ε')} dependence has been steadily improved: variable-time amplitude amplification brought ${m('κ')} down to nearly linear (Ambainis, 2012); Fourier and Chebyshev expansions of ${m('1/x')} gave ${m('polylog(1/ε)')} precision (Childs, Kothari and Somma, 2017); quantum singular value transformation ([[L:qsp]]) applies an inversion polynomial directly; and an approach based on a discrete adiabatic theorem reached the optimal ${m('O(κ log(1/ε))')} (Costa and colleagues, 2022). Matrix inversion is BQP-complete, so in principle it captures the full power of quantum computing.</p>
<h2>The fine print</h2>
<p>Scott Aaronson’s 2015 essay “Read the fine print” listed the conditions under which the exponential speedup survives:</p>
<ul>
<li><strong>Input.</strong> ${m('|b⟩')} must be prepared quickly. Loading ${m('N')} arbitrary numbers takes about ${m('N')} operations unless they have structure or a quantum RAM exists.</li>
<li><strong>The matrix.</strong> ${m('A')} must be sparse (or otherwise efficiently simulable) and well conditioned; the cost grows with ${m('κ')}.</li>
<li><strong>Output.</strong> The answer is a quantum state. You can estimate a few properties such as ${m('⟨x|M|x⟩')}, but reading all ${m('N')} entries costs at least ${m('N')} repetitions.</li>
<li><strong>Classical competition.</strong> Ewin Tang showed in 2018 that, given comparable sample-and-query access to the data, a classical algorithm matches a quantum recommendation algorithm up to polynomial factors. Follow-up work by Chia, Gilyén, Li, Lin, Tang and Wang (2020) extended such “dequantized” algorithms to low-rank linear systems and regression. Exponential speedups remain plausible for sparse, full-rank, well-conditioned problems, such as some discretized differential equations, but not for low-rank data. [[L:dequant]] shows the sampling trick at work.</li>
</ul>
${LAB('cost')}
`,
  labs: {
    hhl: {
      title: 'HHL step by step on a 4×4 matrix',
      cap: 'Top: the outcomes of phase estimation, stacked by eigencomponent; triangles mark the true eigenvalues on the clock’s grid. Middle: the solution in the eigenbasis, exact (outlined) and from HHL after post-selection (filled), both normalized. Bottom: fidelity of the HHL state against the number of clock qubits. With few clock qubits the smallest eigenvalue is misread, and since its inverse dominates the solution, the fidelity suffers.',
      build(body, id) {
        let t = 4, kappa = 10, bm = 'flat', R = null;
        const BETAS = { flat: [.5, .5, .5, .5], small: [.7, .5, .4, .32], large: [.2, .35, .55, .73] };
        const COLS = T => [T.copper, T.copperLo || T.copper, T.cyan, T.muted];
        const c1 = canvas('', 'height:180px'), c2 = canvas('', 'height:150px'), c3 = canvas('', 'height:150px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const beta = () => { const b = BETAS[bm], n = Math.hypot(...b); return b.map(x => x / n); };
        const run = () => { R = hhlSim(t, kappa, beta()); q1.inv(); q2.inv(); q3.inv(); text(); };
        const q1 = painter(c1, ({ ctx, w, h: H }) => {
          if (!R) return; const T = Theme.get(), b = beta(), K = R.K, P = [...Array(K)].map((_, k) => R.pk.map((row, j) => b[j] * b[j] * row[k])), ym = Math.max(...P.map(r => r.reduce((s, x) => s + x, 0))) * 1.15;
          const A = axes(ctx, w, H, { x: [-.5, K - .5], y: [0, ym], xt: [0, Math.round((K - 1) / 2), K - 1], xf: v => num(v / (K - 1), 2), yt: [], xl: 'clock reading as an eigenvalue estimate', yl: 'probability', pad: { l: 16 } });
          const bw = (A.R - A.L) / K;
          P.forEach((r, k) => { let y = 0; r.forEach((v, j) => { if (v < 1e-5) return; ctx.fillStyle = COLS(T)[j]; ctx.fillRect(A.X(k) - bw * .42, A.Y(y + v), bw * .84, A.Y(y) - A.Y(y + v)); y += v; }); });
          R.lam.forEach((l, j) => { const x = A.X(l * (K - 1)); ctx.fillStyle = COLS(T)[j]; ctx.beginPath(); ctx.moveTo(x, A.T + 2); ctx.lineTo(x - 5, A.T - 6); ctx.lineTo(x + 5, A.T - 6); ctx.closePath(); ctx.fill(); });
        });
        const q2 = painter(c2, ({ ctx, w, h: H }) => {
          if (!R) return; const T = Theme.get(), ne = Math.hypot(...R.xe), nt = Math.hypot(...R.xt) || 1, L = 50, gw = (w - L - 10) / 4, base = H - 30, top = 10;
          ctx.strokeStyle = T.line; ctx.beginPath(); ctx.moveTo(L - 6, base + .5); ctx.lineTo(w - 6, base + .5); ctx.stroke();
          for (let j = 0; j < 4; j++) {
            const x = L + j * gw, e = R.xe[j] / ne, a = R.xt[j] / nt, Y = v => base - v * (base - top);
            ctx.fillStyle = COLS(T)[j]; ctx.globalAlpha = .85; ctx.fillRect(x + gw * .2, Y(a), gw * .6, base - Y(a)); ctx.globalAlpha = 1;
            ctx.strokeStyle = T.ink; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.strokeRect(x + gw * .2, Y(e), gw * .6, base - Y(e)); ctx.setLineDash([]);
            txt(ctx, 'λ = ' + num(R.lam[j], 3), x + gw / 2, base + 13, { font: '500 10.5px "JetBrains Mono",monospace' });
          }
          txt(ctx, '|xⱼ|', 4, top + 6, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace' });
        });
        const q3 = painter(c3, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [2, 10], y: [0, 1], xt: [2, 4, 6, 8, 10], yt: [0, .5, 1], xl: 'clock qubits', yl: 'fidelity' });
          const pts = []; for (let k = 2; k <= 10; k++) pts.push([A.X(k), A.Y(hhlSim(k, kappa, beta()).fid)]); polyline(ctx, pts, T.cyan, 2.2); pts.forEach(q => dot(ctx, q[0], q[1], 3, T.cyan));
          if (R) dot(ctx, A.X(t), A.Y(R.fid), 6, T.copper, T.surface);
        });
        const text = () => { ro.innerHTML = `<span class="k">fidelity with exact |x⟩ </span>${num(R.fid, 4)}<br><span class="k">success probability </span>${pct(R.psucc, 2)} <span class="k">(ideal ${pct(R.pideal, 2)})</span><br><span class="k">amplitude amplification rounds </span>≈ ${num(PI / 4 / Math.sqrt(Math.max(R.psucc, 1e-9)), 1)}`; };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, c1, legendRow(['λ₀', 'λ₁', 'λ₂', 'λ₃'].map((s, j) => [s, ['var(--copper)', 'var(--copper-lo)', 'var(--cyan)', 'var(--muted)'][j]])), c2, c3),
          h('div', { class: 'stack' }, slider({ id: id('t'), label: 'Clock qubits', min: 2, max: 8, step: 1, value: t, fmt: String, on: v => { t = v; run(); } }),
            slider({ id: id('k'), label: 'Condition number κ', min: 2, max: 60, step: 1, value: kappa, fmt: String, on: v => { kappa = v; run(); } }),
            field('Right-hand side b', seg([{ v: 'flat', label: 'Even' }, { v: 'small', label: 'Weighted to small λ' }, { v: 'large', label: 'Weighted to large λ' }], bm, v => { bm = v; run(); }, 'b')), ro)));
        run();
      }
    },
    cost: {
      title: 'When does the quantum solver win?',
      cap: 'Leading-order costs, constants ignored: conjugate gradient N·s·√κ·log(1/ε); HHL log₂N·s²·κ²/ε; an optimal modern quantum solver log₂N·s·κ·log(1/ε). Switching on “read out all of x” adds the N/ε² repetitions needed to estimate every entry of the output state. The quantum advantage lives at large N and moderate κ, and only when a few numbers about x are enough.',
      build(body, id) {
        let lgN = 8, s = 10, lgE = -3, readout = false;
        const cv = canvas('', 'height:280px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const cost = (kind, k) => { const N = 10 ** lgN, E = 10 ** lgE, L = Math.log2(N), rd = readout ? N / (E * E) : 0; return kind === 'cg' ? N * s * Math.sqrt(k) * Math.log(1 / E) : kind === 'hhl' ? L * s * s * k * k / E + rd : L * s * k * Math.log(1 / E) + rd; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 1e5], y: [1, 1e28], xlog: true, ylog: true, xt: [1, 10, 100, 1e3, 1e4, 1e5], yt: [1, 1e7, 1e14, 1e21, 1e28], xf: v => '10' + sup(Math.round(Math.log10(v))), yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'condition number κ', yl: 'cost' });
          [['cg', T.muted, null], ['hhl', T.copper, [6, 4]], ['opt', T.cyan, null]].forEach(([k, col, d]) => { const pts = []; for (let e = 0; e <= 5; e += .05) pts.push([A.X(10 ** e), A.Y(clamp(cost(k, 10 ** e), 1, 1e28))]); polyline(ctx, pts, col, 2.3, d); });
        });
        const cross = kind => { for (let e = 0; e <= 5; e += .01) if (cost(kind, 10 ** e) > cost('cg', 10 ** e)) return e === 0 ? null : 10 ** e; return Infinity; };
        const upd = () => { p.inv(); const fx = v => v == null ? 'never' : v === Infinity ? 'beyond 10⁵' : 'κ ≈ ' + num(v, v < 10 ? 1 : 0); ro.innerHTML = `<span class="k">N </span>10${sup(lgN)} &nbsp; <span class="k">ε </span>10${sup(lgE)}<br><span class="k">HHL beats CG up to </span>${fx(cross('hhl'))}<br><span class="k">optimal solver beats CG up to </span>${fx(cross('opt'))}`; };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow([['conjugate gradient (classical)', 'var(--muted)'], ['HHL', 'var(--copper)', 1], ['optimal quantum solver', 'var(--cyan)']])),
          h('div', { class: 'stack' }, slider({ id: id('n'), label: 'Dimension N', min: 2, max: 14, step: .5, value: lgN, fmt: v => '10' + sup(v), on: v => { lgN = v; upd(); } }),
            slider({ id: id('s'), label: 'Non-zeros per row s', min: 1, max: 100, step: 1, value: s, fmt: String, on: v => { s = v; upd(); } }),
            slider({ id: id('e'), label: 'Precision ε', min: -6, max: -1, step: .5, value: lgE, fmt: v => '10' + sup(v), on: v => { lgE = v; upd(); } }),
            field('Output needed', seg([{ v: false, label: 'A few properties of x' }, { v: true, label: 'Read out all of x' }], readout, v => { readout = v; upd(); }, 'Output')), ro)));
        upd();
      }
    }
  },
  take: ['HHL prepares |x⟩ ∝ A⁻¹|b⟩ by phase estimation, an eigenvalue-dependent rotation C/λ, uncomputation and post-selection.',
    'Its cost grows as log N but polynomially in the condition number κ and 1/ε; modern solvers reach the optimal O(κ log(1/ε)).',
    'The speedup needs cheap state preparation, a sparse well-conditioned matrix, and a question answerable from a few properties of |x⟩.',
    'Dequantized classical algorithms match quantum ones for low-rank problems; sparse, full-rank systems remain the plausible home of exponential speedups.'],
  quiz: QZ([
    ['What does HHL output?', ['The vector x written in a classical register', 'A quantum state |x⟩ proportional to A⁻¹|b⟩', 'The determinant of A', 'The eigenvalues of A'], 1, 'The solution is encoded in amplitudes; extracting all N entries would cost at least N repetitions.'],
    ['What role does phase estimation play in HHL?', ['It prepares |b⟩', 'It writes estimates of the eigenvalues λⱼ of A into a clock register, entangled with the eigenvector components', 'It measures x', 'It amplifies the success probability'], 1, 'With the eigenvalue available in a register, the algorithm can apply a λ-dependent rotation.'],
    ['Which operation actually inverts the eigenvalues?', ['The QFT', 'A controlled rotation that puts amplitude C/λ̃ on an ancilla’s |1⟩ state', 'A CNOT', 'Measurement of the clock'], 1, 'Post-selecting the ancilla on |1⟩ leaves each eigencomponent multiplied by C/λⱼ.'],
    ['Why is the success probability of HHL about 1/κ²?', ['Because of noise', 'C must be at most the smallest eigenvalue, so amplitudes C/λ are as small as 1/κ for the largest eigenvalues', 'Because of the QFT', 'It is always 1/2'], 1, 'Most of the amplitude stays on the ancilla’s |0⟩ when C/λ is small; amplitude amplification reduces the repetitions to about κ.'],
    ['What is the condition number κ?', ['The size of the matrix', 'The ratio of the largest to the smallest eigenvalue magnitude (singular value)', 'The number of non-zeros per row', 'The precision'], 1, 'Large κ means some directions are nearly singular, which makes inversion sensitive and costly for any algorithm.'],
    ['In the lab, why does the fidelity drop most when the clock has few qubits?', ['The QFT fails', 'The smallest eigenvalue is estimated poorly, and its inverse dominates the solution, so errors there matter most', 'Because κ changes', 'Because b is not normalized'], 1, 'Phase estimation has a fixed absolute resolution, which is a large relative error for small λ.'],
    ['Which of these is part of Aaronson’s fine print?', ['HHL needs no input', 'The input state |b⟩ must be preparable quickly, which is hard for arbitrary data without a quantum RAM', 'HHL works for any dense matrix with no slowdown', 'The output can be read in log N time'], 1, 'Loading N arbitrary amplitudes costs about N operations, which would erase the exponential advantage.'],
    ['What did Ewin Tang’s 2018 result show?', ['HHL is wrong', 'A classical algorithm with sample-and-query access matches the quantum recommendation algorithm up to polynomial factors', 'Quantum computers cannot invert matrices', 'Recommendation systems need no data'], 1, 'Such “dequantized” algorithms removed the exponential speedup for low-rank problems like recommendation and low-rank regression.'],
    ['What is the best known κ and ε dependence for quantum linear solvers?', ['κ²/ε', 'O(κ log(1/ε)), which is optimal', 'O(1)', 'O(κ³)'], 1, 'Costa and colleagues (2022) reached this using a discrete adiabatic theorem, matching known lower bounds.'],
    ['Why is matrix inversion called BQP-complete?', ['It is easy classically', 'Any quantum computation can be encoded as inverting a suitable sparse, well-conditioned matrix, so it is as hard as anything a quantum computer can do', 'Because it uses phase estimation', 'Because it is NP-hard'], 1, 'HHL showed this hardness, which means exponential speedups for some instances are as plausible as quantum speedups in general.']
  ])
});

/* ---------- cloning ---------- */
const CLONERS = [
  ['cnot', 'Copy with CNOT', (th) => [0, 0, Math.cos(th)]],
  ['mp', 'Measure and prepare (optimal)', (th, v) => v.map(x => x / 3)],
  ['bh', 'Universal cloner (Bužek–Hillery)', (th, v) => v.map(x => 2 * x / 3)],
  ['pc', 'Economical phase-covariant', (th, v) => [v[0] / Math.SQRT2, v[1] / Math.SQRT2, (1 + Math.cos(th)) / 2]]
];
const fidOf = (v, r) => (1 + v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) / 2;

LESSONS.push({
  id: 'cloning', n: 38.2, stage: QIT, minutes: 14, title: 'No-cloning and the best possible copies',
  lede: 'Quantum information cannot be copied. That one fact protects quantum cryptography, forbids faster-than-light signalling and forces quantum networks to use entanglement. But approximate copies are allowed, and how good they can be is a precise question.',
  html: `
<h2>The no-cloning theorem</h2>
<p>A copier would be a unitary ${m('U')} with ${m('U|ψ⟩|0⟩ = |ψ⟩|ψ⟩')} for every state ${m('|ψ⟩')}. Wootters and Zurek, and independently Dieks, showed in 1982 that none exists. Take two inputs ${m('|ψ⟩')} and ${m('|φ⟩')}. Unitaries preserve inner products, so</p>
${EQ('⟨ψ|φ⟩ = ⟨ψ|φ⟩²')}
<p>which forces ${m('⟨ψ|φ⟩')} to be 0 or 1: a machine can copy a set of states only if they are mutually orthogonal, which is ordinary classical copying. Linearity gives the same answer more vividly. A CNOT copies ${m('|0⟩')} and ${m('|1⟩')} perfectly, so by linearity it sends ${m('a|0⟩ + b|1⟩')} to the entangled state ${m('a|00⟩ + b|11⟩')}, not to ${m('(a|0⟩ + b|1⟩)⊗²')}.</p>
<h2>Why it matters</h2>
<ul>
<li><strong>No signalling.</strong> The theorem was prompted by a 1982 proposal for faster-than-light communication that relied on copying one half of an entangled pair. Perfect cloning would let the receiver tell which measurement the sender made.</li>
<li><strong>Cryptography.</strong> An eavesdropper on BB84 ([[L:bb84]]) cannot keep a copy of each photon and pass the original along untouched; any information gained disturbs the state.</li>
<li><strong>Networks.</strong> Quantum signals cannot be amplified like classical ones, so long-distance links rely on entanglement swapping and repeaters ([[L:swapping]]).</li>
<li><strong>Error correction.</strong> Codes cannot back up a qubit by copying it; they spread it into entanglement instead ([[L:qec]]).</li>
</ul>
<h2>Approximate cloning</h2>
<p>Bužek and Hillery (1996) designed a universal machine that makes two copies of any qubit, each with fidelity ${m('5/6')}. Each copy is the input with its Bloch vector shrunk to two thirds of its length. Gisin and Massar (1997) generalized this to making ${m('M')} copies from ${m('N')} identical originals, and Bruß, Ekert and Macchiavello (1998) proved the fidelity optimal:</p>
${EQ('F<sub>N→M</sub> = (M(N + 1) + N) / (M(N + 2))')}
<p>As ${m('M → ∞')} this approaches ${m('(N+1)/(N+2)')}, the best fidelity achievable by measuring ${m('N')} copies and preparing a guess. Making infinitely many copies is no better than measuring. For one copy, measuring and re-preparing gives only ${m('2/3')}, so a quantum cloner does strictly better than any classical strategy.</p>
<p>Copying a restricted set of states can do better. For states on the equator of the Bloch sphere, a <strong>phase-covariant cloner</strong> reaches ${m('½ + 1/√8 ≈ 0.854')}, and it does not even need an ancilla. That number reappears in cryptography: an eavesdropper who clones BB84 states in this way induces an error rate of about 15% in the copy left for Bob.</p>
${LAB('cloner')}
${LAB('nm')}
`,
  labs: {
    cloner: {
      title: 'Four ways to copy a qubit',
      cap: 'Choose an input state with the sliders (dashed ring). The arrow is the state of each output copy produced by the chosen strategy (all four strategies give two identical copies). The chart plots the fidelity of a copy against the input’s polar angle for every strategy (none depends on the azimuth). The CNOT copier is perfect for |0⟩ and |1⟩ and worst on the equator; the universal cloner gives 5/6 everywhere; the phase-covariant cloner is best on the equator.',
      build(body, id) {
        let th = 1.1, ph = .6, mode = 'bh';
        const sph = canvas('sq', 'max-width:290px;margin:0 auto'), bv = new BlochView(sph, { labels: 'min', trail: false }), cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const COL = T => ({ cnot: T.muted, mp: T.ink, bh: T.copper, pc: T.cyan });
        const outOf = (k, t, p) => { const v = fromAngles(t, p), f = CLONERS.find(c3 => c3[0] === k)[2]; return f(t, v); };
        const avg = k => { let s = 0, n = 0; for (let i = 0; i < 400; i++) { const z = 1 - 2 * (i + .5) / 400, t = Math.acos(z); s += fidOf(outOf(k, t, 0), fromAngles(t, 0)); n++; } return s / n; };
        const AV = {}; for (const [k] of CLONERS) AV[k] = avg(k);
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, PI], y: [.5, 1], xt: [0, PI / 2, PI], xf: v => v === 0 ? '0 (|0⟩)' : v < 2 ? 'π/2' : 'π (|1⟩)', yt: [.5, 2 / 3, 5 / 6, 1], yf: v => v === 2 / 3 ? '2/3' : v === 5 / 6 ? '5/6' : String(v), xl: 'polar angle θ of the input', yl: 'fidelity' });
          for (const [k] of CLONERS) { const pts = []; for (let t = 0; t <= PI + 1e-9; t += PI / 90) pts.push([A.X(t), A.Y(fidOf(outOf(k, t, 0), fromAngles(t, 0)))]); polyline(ctx, pts, COL(T)[k], k === mode ? 3 : 1.6, k === 'mp' ? [5, 4] : null); }
          dot(ctx, A.X(th), A.Y(fidOf(outOf(mode, th, ph), fromAngles(th, ph))), 6, COL(T)[mode], T.surface);
        });
        const upd = () => { const v = fromAngles(th, ph), o = outOf(mode, th, ph); bv.target = v; bv.v = o; bv.inv(); p.inv(); ro.innerHTML = `<span class="k">fidelity of this copy </span>${num(fidOf(o, v), 4)}<br><span class="k">copy’s Bloch length </span>${num(Math.hypot(...o), 3)}<br><span class="k">average over all inputs </span>${num(AV[mode], 4)}`; };
        body.append(h('div', { class: 'btns' }, seg(CLONERS.map(([v, label]) => ({ v, label })), mode, v => { mode = v; upd(); }, 'Strategy')),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, sph, slider({ id: id('t'), label: 'Input polar angle θ', min: 0, max: PI, step: .01, value: th, fmt: v => num(deg(v), 0) + '°', on: v => { th = v; upd(); } }), slider({ id: id('p'), label: 'Input azimuth φ', min: -PI, max: PI, step: .01, value: ph, fmt: v => num(deg(v), 0) + '°', on: v => { ph = v; upd(); } })),
            h('div', { class: 'stack' }, cv, legendRow([['CNOT', 'var(--muted)'], ['measure and prepare', 'var(--ink)', 1], ['universal', 'var(--copper)'], ['phase-covariant', 'var(--cyan)']]), ro)));
        upd();
      }
    },
    nm: {
      title: 'From N originals to M copies',
      cap: 'Optimal universal cloning fidelity F = (M(N+1) + N)/(M(N+2)) for N identical inputs and M outputs (dots), with the measure-and-prepare limit (N+1)/(N+2) as dashed lines. More copies means worse copies, but never worse than measuring; more originals means better copies. On the right, each copy’s Bloch vector is the input shrunk by the factor η = N(M+2)/(M(N+2)).',
      build(body, id) {
        let N = 1, M = 2;
        const cv = canvas('', 'height:260px'), sph = canvas('sq', 'max-width:240px;margin:0 auto'), bv = new BlochView(sph, { labels: 'min', trail: false }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const F = (n, m) => (m * (n + 1) + n) / (m * (n + 2)), NS = [1, 2, 3, 5];
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 20], y: [.6, 1], xt: [1, 5, 10, 15, 20], yt: [2 / 3, .75, .8, .9, 1], yf: v => v === 2 / 3 ? '2/3' : String(v), xl: 'copies M', yl: 'fidelity per copy' });
          NS.forEach((n, i) => { const col = [T.copper, T.cyan, T.muted, T.ink][i], lim = (n + 1) / (n + 2); ctx.setLineDash([4, 4]); ctx.strokeStyle = col; ctx.globalAlpha = .6; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(A.L, A.Y(lim)); ctx.lineTo(A.R, A.Y(lim)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
            const pts = []; for (let m = n; m <= 20; m++) pts.push([A.X(m), A.Y(F(n, m))]); polyline(ctx, pts, col, n === N ? 2.6 : 1.5); pts.forEach(q => dot(ctx, q[0], q[1], n === N ? 3.2 : 2, col)); });
          if (M >= N) dot(ctx, A.X(M), A.Y(F(N, M)), 7, T.ink, T.surface);
        });
        const upd = () => { if (M < N) M = N; mS.set(M); const eta = N * (M + 2) / (M * (N + 2)), v = fromAngles(.9, .5); bv.target = v; bv.v = v.map(x => x * eta); bv.inv(); p.inv(); ro.innerHTML = `<span class="k">fidelity per copy </span>${num(F(N, M), 4)}<br><span class="k">shrink factor η </span>${num(eta, 4)}<br><span class="k">measure-and-prepare limit </span>${num((N + 1) / (N + 2), 4)}`; };
        const mS = slider({ id: id('m'), label: 'Copies M', min: 1, max: 20, step: 1, value: M, fmt: String, on: v => { M = v; upd(); } });
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow(NS.map((n, i) => [`N = ${n}`, ['var(--copper)', 'var(--cyan)', 'var(--muted)', 'var(--ink)'][i]]))),
          h('div', { class: 'stack' }, sph, field('Originals N', seg(NS.map(v => ({ v, label: String(v) })), N, v => { N = v; upd(); }, 'N')), mS, ro)));
        upd();
      }
    }
  },
  take: ['No unitary copies all states: inner-product preservation allows copying only orthogonal sets, and linearity turns a CNOT “copy” into entanglement.',
    'No-cloning underlies no-signalling, the security of quantum key distribution, the need for repeaters, and the way codes protect information.',
    'The optimal universal 1→2 cloner gives fidelity 5/6; in general F = (M(N+1) + N)/(M(N+2)), approaching the state-estimation limit (N+1)/(N+2).',
    'Restricted families copy better: phase-covariant cloning of equatorial states reaches ½ + 1/√8 ≈ 0.854, the basis of optimal cloning attacks on BB84.'],
  quiz: QZ([
    ['What does the no-cloning theorem forbid?', ['Copying classical bits', 'A single device that maps |ψ⟩|0⟩ to |ψ⟩|ψ⟩ for every state |ψ⟩', 'Preparing many copies of a known state', 'Entanglement'], 1, 'Known states can be prepared repeatedly; what is impossible is copying an unknown state.'],
    ['Which sets of states can be cloned perfectly?', ['Any two states', 'Only sets of mutually orthogonal states', 'Only |+⟩ and |−⟩ together with |0⟩', 'None at all'], 1, 'From ⟨ψ|φ⟩ = ⟨ψ|φ⟩², the overlap must be 0 or 1, so distinct states must be orthogonal.'],
    ['What does a CNOT do to a|0⟩ + b|1⟩ and a blank |0⟩?', ['Makes two copies', 'Produces the entangled state a|00⟩ + b|11⟩, not a product of two copies', 'Destroys the state', 'Swaps the qubits'], 1, 'Linearity applies the copy rule to each basis state separately, creating correlation rather than duplication.'],
    ['How would perfect cloning allow faster-than-light signalling?', ['It wouldn’t', 'The receiver could clone their half of an entangled pair many times and determine which basis the distant sender measured in', 'By sending copies faster', 'By breaking energy conservation'], 1, 'Many copies would reveal whether the state is from the Z or X ensemble, which is otherwise impossible to tell from the reduced state.'],
    ['What fidelity does the optimal universal 1→2 cloner achieve?', ['1', '5/6', '2/3', '1/2'], 1, 'Each output has its Bloch vector shrunk to 2/3, so F = (1 + 2/3)/2 = 5/6, for every input.'],
    ['What fidelity does the best measure-and-prepare strategy achieve for one copy of an unknown qubit?', ['5/6', '2/3', '1', '1/2'], 1, 'Optimal state estimation from one copy gives (N+1)/(N+2) with N = 1, i.e. 2/3.'],
    ['What happens to the optimal cloning fidelity as the number of copies M grows?', ['It reaches 1', 'It decreases towards (N+1)/(N+2), the state-estimation limit', 'It drops to 1/2', 'It does not change'], 1, 'Infinitely many copies are equivalent to a classical description obtained by measurement.'],
    ['Why can a phase-covariant cloner beat 5/6?', ['It cheats', 'It only needs to copy states on the equator, a restricted family, and achieves ½ + 1/√8 ≈ 0.854 for them', 'It uses more originals', 'It uses classical copying'], 1, 'Prior knowledge about the inputs allows a better trade-off than a machine that must work for every state.'],
    ['How does no-cloning affect quantum networks?', ['It has no effect', 'Signals cannot be amplified by copying, so long-distance links use entanglement swapping and repeaters', 'It makes fibres faster', 'It only affects satellites'], 1, 'Classical repeaters copy and re-amplify; quantum repeaters must instead extend entanglement.'],
    ['How do error-correcting codes protect a qubit without copying it?', ['They copy it secretly', 'They encode it into entangled states of many qubits, so that errors can be detected without learning the logical information', 'They measure it repeatedly', 'They cannot protect qubits'], 1, 'The three-qubit code maps a|0⟩ + b|1⟩ to a|000⟩ + b|111⟩, which is entanglement, not three copies.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['HHL algorithm', 'The Harrow–Hassidim–Lloyd quantum algorithm that prepares a state proportional to A⁻¹|b⟩ using phase estimation and an eigenvalue-dependent rotation.', 'hhl'],
  ['Condition number', 'The ratio of a matrix’s largest to smallest singular value; it controls how hard the matrix is to invert accurately.', 'hhl'],
  ['Dequantization', 'Finding a classical algorithm that matches a proposed quantum speedup, typically given sample-and-query access to the data.', 'dequant'],
  ['Universal cloner', 'A machine that produces approximate copies of any input state with the same fidelity; the optimal 1→2 qubit cloner reaches 5/6.', 'cloning'],
  ['Phase-covariant cloner', 'A cloner optimized for states on the equator of the Bloch sphere, reaching fidelity ½ + 1/√8 ≈ 0.854.', 'cloning']
);
})();
