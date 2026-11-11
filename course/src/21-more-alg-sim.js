/* =====================================================================
   Research tracks · algorithms: lower bounds, quantum signal processing
                   · simulation: quantum trajectories, light cones
   ===================================================================== */
(() => {
const ALG = 6, SIM = 7;
const cheb = (d, x) => { if (Math.abs(x) <= 1) return Math.cos(d * Math.acos(x)); const s = x > 0 ? 1 : (d % 2 ? -1 : 1); return s * Math.cosh(d * Math.acosh(Math.abs(x))); };

/* ---------------- Lower bounds ---------------- */
LESSONS.push({
  id: 'polymethod', n: 29.5, stage: ALG, minutes: 15, title: 'Why Grover is optimal: lower bounds',
  lede: 'Speedups are exciting, but knowing that no algorithm can do better is just as valuable. Two short arguments prove that searching N items needs about √N quantum queries, and the second explains where the square root comes from.',
  html: `
<h2>Proving a negative</h2>
<p>Showing that a problem has no fast algorithm is usually hopeless: that is the P versus NP question. In the query model ([[L:query]]) it becomes possible, because the only resource counted is calls to the oracle. Two techniques dominate.</p>
<h2>The hybrid argument</h2>
<p>Bennett, Bernstein, Brassard and Vazirani gave the first proof, in 1997, that Grover’s algorithm is optimal. Run any ${m('T')}-query algorithm on an input with <em>no</em> marked item and record how much amplitude it puts on each item ${m('x')} at each query. The squared amplitudes sum to 1 at every query, so summed over all ${m('T')} queries they total ${m('T')}. Some item must therefore receive at most ${m('T/N')} of this total “query magnitude”.</p>
<p>Now mark that item. The oracle behaves differently only on the part of the state sitting on ${m('x')}, so each query can move the state by at most twice the amplitude there. Adding up, the final states with and without the marked item differ by at most</p>
${EQ('‖ψ<sub>T</sub><sup>x</sup> − ψ<sub>T</sub><sup>∅</sup>‖ ≤ 2 Σ<sub>t</sub> |α<sub>x,t</sub>| ≤ 2T / √N')}
<p>by the Cauchy–Schwarz inequality. To tell the two inputs apart with probability 2/3, the states must differ by a constant amount, so ${m('T')} must be at least a constant times ${m('√N')}. Grover’s algorithm reaches this bound up to a constant factor.</p>
${LAB('hybrid')}
<h2>The polynomial method</h2>
<p>Beals, Buhrman, Cleve, Mosca and de Wolf (1998) observed that after ${m('T')} queries every amplitude is a polynomial of degree at most ${m('T')} in the input bits, so the probability of answering “yes” is a polynomial of degree at most ${m('2T')}. Averaging over all permutations of the input (Minsky and Papert’s symmetrization) turns it into a polynomial ${m('p(k)')} in a single variable, the number ${m('k')} of marked items, of the same degree.</p>
<p>For search (the OR function) this polynomial must satisfy ${m('p(0) ≤ ⅓')} and ${m('p(k) ≥ ⅔')} for every ${m('k')} from 1 to ${m('N')}, while staying between 0 and 1. It has to jump between ${m('k = 0')} and ${m('k = 1')} yet stay bounded over an interval of length ${m('N')}. A classical inequality of A. A. Markov says a polynomial of degree ${m('d')} bounded on an interval of length ${m('N')} has slope at most about ${m('d²/N')}, so the jump forces ${m('d ≳ √N')}. Chebyshev polynomials, which grow as fast as possible just outside the interval where they stay bounded, show the bound is achievable.</p>
${LAB('cheb')}
<h2>What the bounds tell us</h2>
<ul>
<li><strong>Parity</strong> of ${m('N')} bits needs a polynomial of degree ${m('N')}, so at least ${m('N/2')} quantum queries, and ${m('N/2')} suffice: almost no speedup.</li>
<li><strong>Exact search</strong>, with no error allowed, needs ${m('N')} queries; the √N speedup requires tolerating a small error.</li>
<li><strong>NP-complete problems.</strong> Treated as black-box search over ${m('2ⁿ')} candidates, quantum computers get at most a square-root speedup. Faster quantum algorithms would have to exploit structure, and none is known for NP-complete problems.</li>
<li><strong>The adversary method</strong> (Ambainis, 2000; with negative weights, Høyer, Lee and Špalek, 2007) gives bounds that are often stronger; Ben Reichardt showed, in work from 2009 to 2011 (the last step with Lee, Mittal, Špalek and Szegedy), that its general form characterizes quantum query complexity up to a constant factor.</li>
</ul>
`,
  labs: {
    hybrid: {
      title: 'How fast can queries separate two inputs?',
      cap: 'Distance between the final states of Grover’s algorithm with one marked item and with none (copper), against the hybrid-argument bound 2T/√N that holds for every algorithm (blue). The dashed line is roughly the distance needed to tell the inputs apart with probability 2/3. No algorithm can cross it before the bound does.',
      build(body, id) {
        let lgN = 4;
        const cv = canvas('', 'height:250px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const need = Math.sqrt(2 - 2 * Math.sqrt(8 / 9));
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), N = 10 ** lgN, th = Math.asin(1 / Math.sqrt(N)), Tm = Math.ceil(PI / (2 * th)), A = axes(ctx, w, H, { x: [0, Tm], y: [0, 2.1], xt: [0, Math.round(Tm / 4), Math.round(Tm / 2), Math.round(3 * Tm / 4), Tm], yt: [0, .5, 1, 1.5, 2], yf: v => num(v, 1), xl: 'queries T', yl: 'distance between final states' });
          polyline(ctx, [[A.L, A.Y(need)], [A.R, A.Y(need)]], T.muted, 1.4, [5, 4]);
          const b = [], g = []; for (let k = 0; k <= 200; k++) { const t = Tm * k / 200; b.push([A.X(t), A.Y(Math.min(2.1, 2 * t / Math.sqrt(N)))]); g.push([A.X(t), A.Y(2 * Math.sin(Math.min(t * th, PI / 2)))]); }
          polyline(ctx, b, T.cyan, 2.2); polyline(ctx, g, T.copper, 2.4);
        });
        const upd = () => {
          const N = 10 ** lgN, th = Math.asin(1 / Math.sqrt(N)), tb = need * Math.sqrt(N) / 2, tg = Math.asin(need / 2) / th;
          ro.innerHTML = `<span class="k">N </span>${Math.round(N).toLocaleString()} &nbsp; <span class="k">√N </span>${num(Math.sqrt(N), 1)}<br><span class="k">every algorithm needs at least </span>${num(tb, 1)} queries (${num(need / 2, 2)} √N)<br><span class="k">Grover reaches that distance after </span>${num(tg, 1)} queries<br><span class="k">Grover’s full run (π/4 √N) </span>${num(PI / 4 * Math.sqrt(N), 0)} queries`;
          p.inv();
        };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['Grover, marked vs unmarked', 'var(--copper)'], ['bound 2T/√N', 'var(--cyan)'], ['distance needed', 'var(--muted)', 1]])),
          h('div', { class: 'stack' }, slider({ id: id('n'), label: 'Search space size N', min: 1, max: 8, step: .1, value: lgN, fmt: v => Math.round(10 ** v).toLocaleString(), on: v => { lgN = v; upd(); } }), ro)));
        upd();
      }
    },
    cheb: {
      title: 'Approximating OR with a polynomial',
      cap: 'A degree-d polynomial p(k) in the number of marked items k must be near 0 at k = 0 and near 1 for every k from 1 to N. Built from a Chebyshev polynomial, it equals 0 at k = 0 and stays within ε of 1 on [1, N] (shaded band). The horizontal axis is logarithmic so that k = 0 and k = 1 are visible. Lower the degree below about √N and ε shoots towards 1.',
      build(body, id) {
        let lgN = 3, d = 20;
        const cv = canvas('', 'height:260px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const eps = (N, dd) => 1 / cheb(dd, (N + 1) / (N - 1));
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), N = Math.round(10 ** lgN), e = Math.min(1, eps(N, d)), A = axes(ctx, w, H, { x: [1, N + 1], y: [-.1, 2.05], xlog: true, xt: [1, 2, 11, 101, 1001, 10001].filter(v => v <= N + 1), xf: v => 'k=' + (v - 1), yt: [0, .5, 1, 1.5, 2], yf: v => num(v, 1), xl: 'number of marked items k (log scale)', yl: 'p(k)' });
          ctx.fillStyle = rgba(T.cyan, .15); ctx.fillRect(A.X(2), A.Y(1 + e), A.R - A.X(2), A.Y(1 - e) - A.Y(1 + e));
          const f = k => 1 - e * cheb(d, (N + 1 - 2 * k) / (N - 1)), pts = [];
          for (let s = 0; s <= 600; s++) { const k = Math.pow(N + 1, s / 600) - 1; pts.push([A.X(k + 1), A.Y(clamp(f(k), -.1, 2.05))]); }
          polyline(ctx, pts, T.copper, 2.3); dot(ctx, A.X(1), A.Y(clamp(f(0), -.1, 2.05)), 6, T.ink, T.surface); dot(ctx, A.X(2), A.Y(clamp(f(1), -.1, 2.05)), 5, T.copper, T.surface);
        });
        const upd = () => {
          const N = Math.round(10 ** lgN), e = eps(N, d), dstar = Math.ceil(Math.acosh(3) / Math.acosh((N + 1) / (N - 1)));
          ro.innerHTML = `<span class="k">error ε at degree ${d} </span>${e < 1e-3 ? sci(e) : num(Math.min(1, e), 3)}<br><span class="k">degree needed for ε ≤ ⅓ </span>${dstar} (≈ ${num(dstar / Math.sqrt(N), 2)} √N)<br><span class="k">so queries T ≥ d/2 ≈ </span>${Math.ceil(dstar / 2)} &nbsp; <span class="k">Grover uses about </span>${num(PI / 4 * Math.sqrt(N), 0)}`;
          p.inv();
        };
        const dS = slider({ id: id('d'), label: 'Polynomial degree d', min: 1, max: 200, step: 1, value: d, fmt: String, on: v => { d = v; upd(); } });
        body.append(cv, h('div', { class: 'split even' }, h('div', { class: 'stack' }, slider({ id: id('n'), label: 'N', min: 1.3, max: 4, step: .05, value: lgN, fmt: v => Math.round(10 ** v).toLocaleString(), on: v => { lgN = v; upd(); } }), dS), ro));
        upd();
      }
    }
  },
  take: ['In the query model lower bounds can be proved; they show that Grover’s √N is optimal for unstructured search.',
    'Hybrid argument: some item receives at most T/N of the query magnitude, so marking it moves the final state by at most 2T/√N.',
    'Polynomial method: after T queries acceptance is a degree-2T polynomial; for OR it must jump at k = 0 yet stay bounded, forcing degree ≳ √N (Markov, Chebyshev).',
    'Parity needs N/2 queries, exact search N; black-box search gives NP-complete problems at most a quadratic speedup.'],
  quiz: QZ([
    ['What does the hybrid argument bound?', ['The number of qubits', 'How much the final state can change when one item is marked, in terms of the queries spent on it', 'The circuit depth', 'The classical running time'], 1, 'It tracks how much amplitude the algorithm places on each item during its queries and shows that changing a rarely queried item barely changes the output.'],
    ['Summed over T queries, the query magnitudes of all N items total…', ['N', 'T', '√N', '1'], 1, 'At each query the squared amplitudes sum to 1, so over T queries the total is T, and some item gets at most T/N.'],
    ['The hybrid argument gives a final-state distance of at most…', ['T/N', '2T/√N', 'T²', '1/T'], 1, 'Each query changes the state by at most 2|α_{x,t}|; summing and applying Cauchy–Schwarz with Σ|α|² ≤ T/N gives 2T/√N.'],
    ['After T queries, the acceptance probability of a quantum algorithm is a polynomial in the input bits of degree at most…', ['T', '2T', 'T²', 'N'], 1, 'Each query raises the degree of the amplitudes by at most 1, so amplitudes have degree ≤ T and probabilities (squared magnitudes) degree ≤ 2T.'],
    ['What does symmetrization do in the polynomial method?', ['Removes the oracle', 'Averages over input permutations to give a univariate polynomial in the Hamming weight k', 'Makes the polynomial linear', 'Doubles the degree'], 1, 'For symmetric functions such as OR, the averaged acceptance probability depends only on how many inputs are 1, giving p(k) of the same degree.'],
    ['Why must a polynomial that computes OR have degree of order √N?', ['Because OR is hard to evaluate classically', 'It must jump between k = 0 and k = 1 while staying bounded on [0, N]; Markov’s inequality limits the slope of low-degree bounded polynomials', 'Because of the uncertainty principle', 'It does not; degree 1 suffices'], 1, 'A bounded polynomial of degree d on an interval of length N has derivative at most about d²/N, so a constant jump needs d ≳ √N.'],
    ['Which polynomials achieve the √N degree for OR?', ['Legendre polynomials', 'Chebyshev polynomials', 'Taylor polynomials of eˣ', 'Linear polynomials'], 1, 'Chebyshev polynomials stay within [−1, 1] on the interval and grow as fast as possible just outside it, which is exactly what is needed near k = 0.'],
    ['How many quantum queries are needed to compute the parity of N bits?', ['√N', 'N/2', 'log N', '1'], 1, 'Parity requires polynomial degree N, so at least N/2 queries; computing the XOR of pairs with one query each (Deutsch’s trick) shows N/2 suffices.'],
    ['What do these lower bounds imply for NP-complete problems?', ['Quantum computers solve them in polynomial time', 'Brute-force search gets at most a quadratic speedup; a faster quantum algorithm would have to exploit structure', 'They are classically easy', 'Nothing'], 1, 'Searching 2ⁿ candidates as a black box takes about 2^(n/2) quantum queries, still exponential.'],
    ['What did Reichardt prove about the general adversary bound?', ['It is always loose', 'It characterizes quantum query complexity exactly, up to a constant factor', 'It applies only to classical algorithms', 'It equals the polynomial degree'], 1, 'Using span programs, Reichardt (2009–2011, with Lee, Mittal, Špalek and Szegedy for general functions) showed the negative-weight adversary bound is tight for every function, making it a complete characterization of query complexity.']
  ])
});

/* ---------------- Quantum signal processing ---------------- */
const qspP = (ph, x) => {
  const s = Math.sqrt(Math.max(0, 1 - x * x)), W = [[x, 0], [0, s], [0, s], [x, 0]], S = f => [[Math.cos(f), Math.sin(f)], [0, 0], [0, 0], [Math.cos(f), -Math.sin(f)]];
  let U = S(ph[0]); for (let k = 1; k < ph.length; k++) U = C2.mm(C2.mm(U, W), S(ph[k])); return U[0];
};
const qspGrad = (ph, XS, f, w) => {
  const d = ph.length - 1, g = new Array(d + 1).fill(0), S = ph.map(a => [[Math.cos(a), Math.sin(a)], [0, 0], [0, 0], [Math.cos(a), -Math.sin(a)]]), iZ = [[0, 1], [0, 0], [0, 0], [0, -1]], I2 = [[1, 0], [0, 0], [0, 0], [1, 0]]; let L = 0;
  for (const x of XS) {
    const wv = w(x); if (!wv) continue; const s = Math.sqrt(Math.max(0, 1 - x * x)), W = [[x, 0], [0, s], [0, s], [x, 0]];
    const P = [S[0]]; for (let k = 1; k <= d; k++) P.push(C2.mm(C2.mm(P[k - 1], W), S[k]));
    const Q = new Array(d + 1); Q[d] = I2; for (let k = d - 1; k >= 0; k--) Q[k] = C2.mm(C2.mm(W, S[k + 1]), Q[k + 1]);
    const r = P[d][0][0] - f(x); L += wv * r * r;
    for (let k = 0; k <= d; k++) g[k] += 2 * wv * r * C2.mm(C2.mm(P[k], iZ), Q[k])[0][0];
  }
  return { L: L / XS.length, g: g.map(v => v / XS.length) };
};
const besselJ = (N, x) => {
  if (x === 0) return [...Array(N + 1)].map((_, k) => k ? 0 : 1);
  const M = 2 * Math.ceil((Math.max(N, x) + 30) / 2) + 20, J = new Float64Array(M + 2); J[M + 1] = 0; J[M] = 1e-30;
  for (let k = M; k >= 1; k--) { J[k - 1] = 2 * k / x * J[k] - J[k + 1]; if (Math.abs(J[k - 1]) > 1e250) { for (let j = k - 1; j <= M; j++) J[j] *= 1e-250; } }
  let s = J[0]; for (let k = 2; k <= M; k += 2) s += 2 * J[k]; return Array.from(J.slice(0, N + 1)).map(v => v / s);
};
const TARGETS = {
  sign: { label: 'Sign function', d: 11, f: x => .85 * Math.tanh(7 * x), w: () => 1 },
  cos: { label: 'cos(4x), for simulation', d: 10, f: x => Math.cos(4 * x), w: () => 1 },
  window: { label: 'Threshold |x| > 0.5', d: 12, f: x => .85 * (.5 + .5 * Math.tanh(9 * (Math.abs(x) - .5))), w: () => 1 },
  inverse: { label: '1/(3x), for inversion', d: 13, f: x => Math.abs(x) < 1e-9 ? 0 : clamp(1 / (3 * x), -.95, .95), w: x => Math.abs(x) >= 1 / 3 ? 1 : 0 }
};
LESSONS.push({
  id: 'qsp', n: 30.5, stage: ALG, minutes: 17, title: 'Quantum signal processing and QSVT',
  lede: 'A single qubit, rotated by alternating fixed phases and an unknown signal, can be made to respond with almost any polynomial of that signal. Lifted to matrices, the same trick turns out to contain Grover, Hamiltonian simulation and matrix inversion as special cases.',
  html: `
<h2>One qubit as a signal processor</h2>
<p>Take a single-qubit rotation that encodes an unknown number ${m('x ∈ [−1, 1]')}, the <strong>signal</strong>:</p>
${EQ(`W(x) = ${MX([['x', 'i√(1 − x²)'], ['i√(1 − x²)', 'x']])} = e<sup>i arccos(x) X</sup>`)}
<p>Interleave ${m('d')} copies of it with Z rotations ${m('e<sup>iφ<sub>k</sub>Z</sup>')} whose angles you choose. Guang Hao Low and Isaac Chuang showed in 2016 that the top-left entry of the resulting unitary is a polynomial in ${m('x')}:</p>
${EQ('⟨0| e<sup>iφ₀Z</sup> W(x) e<sup>iφ₁Z</sup> W(x) ⋯ W(x) e<sup>iφ<sub>d</sub>Z</sup> |0⟩ = P(x)')}
<p>Its degree is at most ${m('d')}, it has the parity of ${m('d')} (even or odd), and ${m('|P(x)| ≤ 1')}. Remarkably, the converse also holds: essentially any polynomial meeting those conditions can be produced by some choice of angles. With all angles zero you get ${m('W(x)<sup>d</sup>')}, whose top-left entry is the Chebyshev polynomial ${m('T<sub>d</sub>(x)')}. This is <strong>quantum signal processing</strong> (QSP).</p>
${LAB('qsp')}
<h2>From numbers to matrices: QSVT</h2>
<p>Now replace the number ${m('x')} by a matrix. A <strong>block encoding</strong> of ${m('A')}, with ${m('‖A‖ ≤ 1')}, is a unitary whose top-left block is ${m('A')}; techniques such as linear combinations of unitaries build them for sums of Pauli strings and other structured matrices. Gilyén, Su, Low and Wiebe showed in 2019 that alternating the block encoding with phase rotations on a single control qubit applies the polynomial ${m('P')} to every singular value of ${m('A')} at once: <strong>quantum singular value transformation</strong> (QSVT). The circuit is the same for every eigenvalue, so all of them are processed in parallel.</p>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Task</th><th>Polynomial</th><th>Degree needed</th></tr></thead><tbody>
<tr><td>Search, amplitude amplification</td><td>a sign- or step-like function</td><td>about ${m('1/√a')}, as in Grover</td></tr>
<tr><td>Hamiltonian simulation</td><td>${m('cos(tx)')} and ${m('sin(tx)')}</td><td>about ${m('t + log(1/ε)')}, optimal</td></tr>
<tr><td>Solving ${m('Ax = b')}</td><td>${m('1/x')} on ${m('[1/κ, 1]')}</td><td>about ${m('κ log(1/ε)')}</td></tr>
<tr><td>Phase estimation, filtering</td><td>threshold (window) functions</td><td>about ${m('1/δ · log(1/ε)')}</td></tr>
</tbody></table></div>
<p>Martyn, Rossi, Tan and Chuang called this a “grand unification of quantum algorithms”: the major primitives differ only in which polynomial they implement.</p>
${LAB('jacobi')}
<h2>Finding the angles</h2>
<p>The angles are computed classically, before the circuit runs. For degrees in the hundreds or thousands this needs care, because naive methods are numerically unstable. Optimization-based methods for symmetric angle sequences (Dong, Meng, Whaley and Lin, 2021) and algebraic factorization methods now handle degrees of many thousands. The lab finds angles by gradient descent, the same idea at small scale.</p>
${NOTE('The fine print', `<p>QSVT is a framework, not a free lunch. The block encoding must be built, and its normalization often shrinks the useful signal; loading classical data into a block encoding can cost as much as the computation saves. For low-rank matrices with sampling access, Ewin Tang and others showed that classical “dequantized” algorithms can match some claimed exponential speedups. The genuine advantages remain where the matrix comes from quantum dynamics, as in simulating physics and chemistry.</p>`)}
`,
  labs: {
    qsp: {
      title: 'Shaping a polynomial with phase angles',
      cap: 'The response ⟨0|U|0⟩ of the QSP sequence across x ∈ [−1, 1]: real part (copper), imaginary part (dashed) and the target (dashed dark). With every angle zero the response is a Chebyshev polynomial. Pick a target and press Fit: gradient descent tunes the angles until the real part matches. The dots mark four eigenvalues of a matrix: QSVT would map each one through the same curve.',
      build(body, id) {
        let tgt = null, ph = new Array(9).fill(0), fit = null, showEig = true;
        const XS = [...Array(61)].map((_, i) => -1 + 2 * i / 60), EIG = [-.8, -.35, .2, .65];
        const cv = canvas('', 'height:260px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), stat = h('div', { class: 'status' });
        const loss = phs => { if (!tgt) return 0; let s = 0; for (const x of XS) { const wv = tgt.w(x); if (!wv) continue; s += wv * (qspP(phs, x)[0] - tgt.f(x)) ** 2; } return s / XS.length; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-1, 1], y: [-1.1, 1.1], xt: [-1, -.5, 0, .5, 1], yt: [-1, -.5, 0, .5, 1], yf: v => num(v, 1), xl: 'signal x', yl: 'P(x)' });
          polyline(ctx, [[A.L, A.Y(0)], [A.R, A.Y(0)]], T.line, 1);
          if (tgt) { const tp = []; for (let k = 0; k <= 300; k++) { const x = -1 + 2 * k / 300; if (tgt.w(x)) tp.push([A.X(x), A.Y(tgt.f(x))]); else { if (tp.length > 1) polyline(ctx, tp.splice(0), T.ink, 1.6, [5, 4]); tp.length = 0; } } polyline(ctx, tp, T.ink, 1.6, [5, 4]); }
          const re = [], im = []; for (let k = 0; k <= 300; k++) { const x = -1 + 2 * k / 300, v = qspP(ph, x); re.push([A.X(x), A.Y(clamp(v[0], -1.1, 1.1))]); im.push([A.X(x), A.Y(clamp(v[1], -1.1, 1.1))]); }
          polyline(ctx, im, T.muted, 1.3, [3, 3]); polyline(ctx, re, T.copper, 2.6);
          if (showEig) for (const l of EIG) { const v = qspP(ph, l)[0]; ctx.strokeStyle = T.cyan; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(A.X(l), A.Y(0)); ctx.lineTo(A.X(l), A.Y(v)); ctx.stroke(); ctx.setLineDash([]); dot(ctx, A.X(l), A.Y(0), 4, T.cyan); dot(ctx, A.X(l), A.Y(clamp(v, -1.1, 1.1)), 5.5, T.cyan, T.surface); }
        });
        const upd = () => { ro.innerHTML = `<span class="k">degree d </span>${ph.length - 1} &nbsp; <span class="k">fit error </span>${tgt ? sci(loss(ph)) : '—'}<br><span class="k">angles φ </span>${ph.map(v => num(v, 3)).join(', ')}${showEig ? `<br><span class="k">eigenvalues → P </span>${EIG.map(l => num(l, 2) + '→' + num(qspP(ph, l)[0], 2)).join('  ')}` : ''}`; p.inv(); };
        Scope.tick(() => {
          if (!fit) return;
          const t0 = performance.now();
          while (fit && performance.now() - t0 < 10) {
            const r = qspGrad(ph, XS, tgt.f, tgt.w), g = r.g, L = r.L;
            if (L < fit.best - 1e-10) { fit.best = L; fit.stall = 0; } else fit.stall++;
            if (L < 1e-6 || fit.stall > 300 || fit.t > 6000) { stat.className = 'status good'; stat.textContent = `Fitted in ${fit.t} gradient steps: error ${sci(L)}${L > 1e-5 ? ' (about as close as degree ' + (ph.length - 1) + ' allows)' : ''}.`; fit = null; break; }
            fit.t++; for (let k = 0; k < ph.length; k++) { fit.m[k] = .9 * fit.m[k] + .1 * g[k]; fit.v[k] = .999 * fit.v[k] + .001 * g[k] * g[k]; const mh = fit.m[k] / (1 - .9 ** fit.t), vh = fit.v[k] / (1 - .999 ** fit.t); ph[k] -= .03 * mh / (Math.sqrt(vh) + 1e-9); }
            if (fit.t % 50 === 0) stat.textContent = `Fitting… step ${fit.t}, error ${sci(L)}.`;
          }
          upd();
        });
        const setD = dd => { ph = new Array(dd + 1).fill(0); ph[0] = PI / 4; ph[dd] = PI / 4; };
        const ctl = h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px 14px;align-content:start' }), mkSliders = () => { ctl.innerHTML = ''; if (ph.length > 9) { ctl.append(h('p', { class: 'hint', style: 'margin:0' }, `${ph.length} angles; sliders are shown for degrees up to 8.`)); return; } ph.forEach((v, k) => ctl.append(slider({ id: id('p' + k), label: `φ${k}`, min: -PI, max: PI, step: .01, value: v, fmt: x => num(x, 2), on: x => { ph[k] = x; fit = null; upd(); } }))); };
        body.append(cv, h('div', { class: 'btns' }, ...Object.entries(TARGETS).map(([k, t]) => btn(t.label, () => { tgt = t; setD(t.d); fit = { t: 0, best: 1e9, stall: 0, m: new Array(ph.length).fill(0), v: new Array(ph.length).fill(0) }; stat.className = 'status'; stat.textContent = 'Fitting…'; mkSliders(); upd(); }, 'sm')),
          btn('All angles zero (Chebyshev)', () => { tgt = null; fit = null; ph = new Array(ph.length).fill(0); stat.className = 'status'; stat.textContent = `All angles zero: P(x) = T_${ph.length - 1}(x).`; mkSliders(); upd(); }, 'sm'),
          btn('Random angles', () => { tgt = null; fit = null; ph = ph.map(() => (Math.random() * 2 - 1) * PI); stat.className = 'status'; stat.textContent = 'Random angles: still a polynomial of degree d with |P| ≤ 1.'; mkSliders(); upd(); }, 'sm')),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, stat, ro, legendRow([['Re P', 'var(--copper)'], ['Im P', 'var(--muted)', 1], ['target', 'var(--ink)', 1], ['eigenvalues', 'var(--cyan)']]),
            slider({ id: id('d'), label: 'Degree d (resets angles)', min: 1, max: 16, step: 1, value: 8, fmt: String, on: v => { tgt = null; fit = null; ph = new Array(v + 1).fill(0); stat.className = 'status'; stat.textContent = `All angles zero: P(x) = T_${v}(x).`; mkSliders(); upd(); } })), ctl));
        stat.textContent = 'All angles zero: P(x) = T₈(x), a Chebyshev polynomial.'; mkSliders(); upd();
      }
    },
    jacobi: {
      title: 'Why simulation costs t + log(1/ε)',
      cap: 'The Jacobi–Anger expansion writes cos(tx) as a sum of Chebyshev polynomials with Bessel-function coefficients. The chart shows the error left after keeping terms up to degree d. It stays near 1 until d reaches about t (dashed line), then falls faster than exponentially, so the extra degree needed for precision ε grows only like log(1/ε).',
      build(body, id) {
        let t = 20;
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const errs = tt => { const D = Math.ceil(tt * 1.6 + 40), J = besselJ(D + 2, tt), out = []; for (let d = 0; d <= D; d++) { let s = 0; for (let k = 2 * Math.floor(d / 2) + 2; k <= D + 2; k += 2) s += 2 * Math.abs(J[k]); out.push(Math.max(s, 1e-16)); } return out; };
        let E = errs(t);
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), D = E.length - 1, A = axes(ctx, w, H, { x: [0, D], y: [1e-16, 10], ylog: true, xt: [0, Math.round(D / 4), Math.round(D / 2), Math.round(3 * D / 4), D], yt: [1e-15, 1e-10, 1e-5, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'polynomial degree d', yl: 'truncation error' });
          polyline(ctx, [[A.X(t), A.T], [A.X(t), A.B]], T.muted, 1.3, [5, 4]); txt(ctx, 'd = t', A.X(t) + 4, A.T + 10, { align: 'left', font: '600 11px "JetBrains Mono",monospace' });
          polyline(ctx, E.map((e, d) => [A.X(d), A.Y(Math.min(e, 10))]), T.copper, 2.4);
        });
        const upd = () => { E = errs(t); const need = eps => E.findIndex(e => e < eps); ro.innerHTML = `<span class="k">degree for ε = 10⁻³ </span>${need(1e-3)} &nbsp; <span class="k">ε = 10⁻⁶ </span>${need(1e-6)} &nbsp; <span class="k">ε = 10⁻¹² </span>${need(1e-12)}<br><span class="k">extra degree beyond t for 10⁻¹² </span>${need(1e-12) - t}`; p.inv(); };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, slider({ id: id('t'), label: 'Evolution time t', min: 1, max: 80, step: 1, value: t, fmt: String, on: v => { t = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['QSP interleaves a signal rotation W(x) with chosen Z-phase rotations; ⟨0|U|0⟩ is a polynomial P(x) of degree ≤ d, parity d, |P| ≤ 1.',
    'Almost any such polynomial is achievable; the angles are computed classically, with stable methods reaching degrees in the thousands.',
    'QSVT applies P to every singular value of a block-encoded matrix at once, unifying search, Hamiltonian simulation, matrix inversion and phase estimation.',
    'Hamiltonian simulation needs degree about t + log(1/ε), optimal; block-encoding costs and dequantization limit some claimed speedups.'],
  quiz: QZ([
    ['What is the signal operator W(x) in quantum signal processing?', ['A Z rotation by x', 'An X rotation e^(i arccos(x) X), whose top-left entry is x', 'A measurement', 'A Hadamard'], 1, 'W(x) = [[x, i√(1 − x²)], [i√(1 − x²), x]] encodes the unknown x in a single-qubit rotation about X.'],
    ['With all phase angles zero, what is ⟨0|W(x)^d|0⟩?', ['xᵈ', 'The Chebyshev polynomial T_d(x)', '0', '1'], 1, 'W(x)^d = e^(i d arccos(x) X), whose top-left entry is cos(d arccos x) = T_d(x).'],
    ['What constraints does a QSP polynomial P(x) of d signal applications satisfy?', ['Any degree, any parity', 'Degree ≤ d, parity of d, and |P(x)| ≤ 1 on [−1, 1]', 'It must be linear', 'It must be positive'], 1, 'Each W adds one degree and flips parity; unitarity keeps |P| ≤ 1. Conversely, essentially any polynomial with these properties can be implemented.'],
    ['What is a block encoding?', ['A classical data structure', 'A unitary whose top-left block is the (normalized) matrix of interest', 'An error-correcting code', 'A compressed circuit'], 1, 'Non-unitary matrices with norm ≤ 1 can be embedded in a larger unitary; post-selecting the ancilla in |0⟩ applies the block.'],
    ['What does QSVT do?', ['Measures singular values', 'Applies a chosen polynomial to every singular value of a block-encoded matrix at once', 'Computes eigenvectors classically', 'Diagonalizes any matrix'], 1, 'The same alternating sequence acts independently on each singular-value subspace, transforming all of them by P simultaneously.'],
    ['Which polynomial does Hamiltonian simulation require?', ['1/x', 'cos(tx) and sin(tx)', 'A step function', 'x²'], 1, 'Applying e^(−iHt) to a block-encoded H means implementing cos(tx) − i sin(tx) on its eigenvalues, approximated via the Jacobi–Anger expansion.'],
    ['How does the required degree for Hamiltonian simulation scale?', ['t²/ε', 'About t + log(1/ε)', 'e^t', '1/ε'], 1, 'Bessel coefficients J_k(t) decay super-exponentially once k exceeds t, so a degree slightly above t gives tiny error; this is optimal.'],
    ['Which function does QSVT approximate to solve linear systems?', ['eˣ', '1/x on the interval [1/κ, 1]', 'sin(x)', 'A constant'], 1, 'Inverting A means mapping each singular value σ to 1/σ; restricted to [1/κ, 1] this needs degree about κ log(1/ε).'],
    ['How are QSP phase angles obtained?', ['By measurement', 'Classically, before running the circuit, using stable numerical methods', 'They are always zero', 'By trial and error on hardware'], 1, 'Angle finding is a classical preprocessing step; optimization and factorization methods now handle degrees in the thousands.'],
    ['What limits QSVT’s practical advantage for some data-analysis problems?', ['Nothing', 'Block encoding classical data can be expensive, and dequantized classical algorithms match some low-rank speedups', 'It only works for 1 qubit', 'It requires analog hardware'], 1, 'Data loading and normalization costs can cancel the speedup, and for low-rank matrices with sampling access, classical algorithms can perform comparably.']
  ])
});

/* ---------------- Quantum trajectories ---------------- */
LESSONS.push({
  id: 'trajectories', n: 32.5, stage: SIM, minutes: 15, title: 'Quantum trajectories',
  lede: 'A density matrix of n qubits needs 4ⁿ numbers. Simulating noise as random jumps on ordinary state vectors needs only 2ⁿ per run, and each run tells a story you could watch in the lab.',
  html: `
<h2>Unravelling the master equation</h2>
<p>The Lindblad equation ([[L:noisesim]]) evolves a density matrix, which for ${m('n')} qubits holds ${m('4ⁿ')} complex numbers. The <strong>quantum trajectory</strong> or Monte Carlo wavefunction method (Dalibard, Castin and Mølmer; Carmichael; Dum, Zoller and Ritsch, all around 1992) replaces it with many random runs of a pure state:</p>
<ol>
<li>Between jumps, evolve with the non-Hermitian effective Hamiltonian ${m('H<sub>eff</sub> = H − (i/2) Σ<sub>k</sub> L<sub>k</sub><sup>†</sup>L<sub>k</sub>')}, then renormalize. The norm that leaks away measures how likely a jump has become.</li>
<li>In each small time step, jump with probability ${m('dt Σ<sub>k</sub> ⟨ψ|L<sub>k</sub><sup>†</sup>L<sub>k</sub>|ψ⟩')}: apply the corresponding ${m('L<sub>k</sub>')}, for example lowering the qubit to ${m('|0⟩')} when a photon is emitted.</li>
<li>Average observables over many runs. As the number of runs ${m('M')} grows, the average converges to the Lindblad result, with statistical error about ${m('1/√M')}.</li>
</ol>
<p>Each run stores only ${m('2ⁿ')} amplitudes, so trajectories win whenever the number of runs needed is smaller than ${m('2ⁿ')}, which is almost always the case beyond a handful of qubits.</p>
<h2>What a single trajectory means</h2>
<p>A trajectory is not just a numerical trick. It is what you would see if the environment were watched with a perfect detector: a driven atom shines, then a photon is emitted and the atom drops abruptly to its ground state. These <strong>quantum jumps</strong> were seen in single trapped ions in 1986. In 2019 Zlatko Minev and colleagues at Yale caught a superconducting qubit in the middle of a jump and reversed it, showing that a jump, once under way, is a smooth and predictable process. Different detection schemes give different unravellings of the same master equation: photon counting gives jumps, homodyne detection gives continuous diffusion.</p>
${LAB('jumps')}
<h2>Trajectories in circuit simulators</h2>
<p>Noisy circuit simulators use the same idea. Instead of evolving a density matrix through a depolarizing channel, they insert a random Pauli error with the right probability after each gate and average over many sampled circuits. For Clifford circuits, each sample is a fast stabilizer simulation ([[L:stabsim]]); for general circuits, each is a state-vector or tensor-network run. Most error-correction thresholds in the literature are computed exactly this way.</p>
${LAB('cost')}
`,
  labs: {
    jumps: {
      title: 'Jumps versus the master equation',
      cap: 'A qubit driven at Rabi frequency Ω and decaying at rate γ. Thin lines are individual trajectories: smooth Rabi swings interrupted by sudden jumps to |0⟩. The thick copper line is their average and the dashed line is the exact Lindblad solution. On the sphere, the copper arrow plays back the first trajectory (always pure, on the surface) and the blue dot is the average over all runs, which sinks inside the sphere.',
      build(body, id) {
        let Om = 3, M = 60, Tt = 8, data = null, tcur = 0, anim = null;
        const cv = canvas('', 'height:250px'), sph = canvas('sq', 'max-width:260px;margin:0 auto'), bv = new BlochView(sph, { trail: false, labels: 'min' }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const DT = .004, SAMP = 25;
        const traj = () => {
          let ar = 1, ai = 0, br = 0, bi = 0; const out = [], jumps = [];
          const f = (ar2, ai2, br2, bi2) => [Om / 2 * bi2, -Om / 2 * br2, Om / 2 * ai2 - .5 * br2, -Om / 2 * ar2 - .5 * bi2];
          const steps = Math.round(Tt / DT);
          for (let k = 0; k <= steps; k++) {
            if (k % SAMP === 0) { const nr = ar * ar + ai * ai + br * br + bi * bi; out.push([2 * (ar * br + ai * bi) / nr, 2 * (ar * bi - ai * br) / nr, (ar * ar + ai * ai - br * br - bi * bi) / nr]); }
            if (k === steps) break;
            const nr = ar * ar + ai * ai + br * br + bi * bi, pj = (br * br + bi * bi) / nr * DT;
            if (Math.random() < pj) { ar = 1; ai = 0; br = 0; bi = 0; jumps.push(k * DT); continue; }
            const k1 = f(ar, ai, br, bi), k2 = f(ar + DT / 2 * k1[0], ai + DT / 2 * k1[1], br + DT / 2 * k1[2], bi + DT / 2 * k1[3]), k3 = f(ar + DT / 2 * k2[0], ai + DT / 2 * k2[1], br + DT / 2 * k2[2], bi + DT / 2 * k2[3]), k4 = f(ar + DT * k3[0], ai + DT * k3[1], br + DT * k3[2], bi + DT * k3[3]);
            ar += DT / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); ai += DT / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); br += DT / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]); bi += DT / 6 * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
            const n2 = Math.sqrt(ar * ar + ai * ai + br * br + bi * bi); ar /= n2; ai /= n2; br /= n2; bi /= n2;
          }
          return { b: out, jumps };
        };
        const lindblad = () => { let x = 0, y = 0, z = 1; const out = [], steps = Math.round(Tt / DT); const f = (x2, y2, z2) => [-.5 * x2, -Om * z2 - .5 * y2, Om * y2 - (z2 - 1)];
          for (let k = 0; k <= steps; k++) { if (k % SAMP === 0) out.push([x, y, z]); const k1 = f(x, y, z), k2 = f(x + DT / 2 * k1[0], y + DT / 2 * k1[1], z + DT / 2 * k1[2]), k3 = f(x + DT / 2 * k2[0], y + DT / 2 * k2[1], z + DT / 2 * k2[2]), k4 = f(x + DT * k3[0], y + DT * k3[1], z + DT * k3[2]); x += DT / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += DT / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); z += DT / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]); } return out; };
        const run = () => {
          const runs = []; for (let r = 0; r < M; r++) runs.push(traj());
          const ns = runs[0].b.length, avg = []; for (let s = 0; s < ns; s++) { let x = 0, y = 0, z = 0; for (const r of runs) { x += r.b[s][0]; y += r.b[s][1]; z += r.b[s][2]; } avg.push([x / M, y / M, z / M]); }
          data = { runs, avg, ex: lindblad(), ns }; tcur = 0; upd();
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!data) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [0, Tt], y: [0, 1.05], xt: [0, 2, 4, 6, 8], yt: [0, .5, 1], yf: v => pct(v, 0), xl: 'time (1/γ)', yl: 'P(excited)' });
          const tx = s => A.X(s * SAMP * DT), py = b => A.Y((1 - b[2]) / 2);
          data.runs.slice(0, 10).forEach((r, k) => { ctx.globalAlpha = k === 0 ? .9 : .28; polyline(ctx, r.b.map((b, s) => [tx(s), py(b)]), k === 0 ? T.ink : T.cyan, k === 0 ? 1.4 : 1.1); }); ctx.globalAlpha = 1;
          polyline(ctx, data.ex.map((b, s) => [tx(s), py(b)]), T.ink, 1.6, [5, 4]); polyline(ctx, data.avg.map((b, s) => [tx(s), py(b)]), T.copper, 2.8);
          polyline(ctx, [[A.X(tcur), A.T], [A.X(tcur), A.B]], T.muted, 1, [3, 3]);
        });
        const show = () => { if (!data) return; const s = Math.min(data.ns - 1, Math.round(tcur / (SAMP * DT))), b = data.runs[0].b[s]; bv.v = b; bv.extra = [{ v: data.avg[s], r: 6, color: Theme.get().cyan }]; bv.inv(); p.inv(); };
        const upd = () => {
          const err = Math.sqrt(data.avg.reduce((m2, b, s) => m2 + ((b[2] - data.ex[s][2]) / 2) ** 2, 0) / data.avg.length), nj = data.runs.reduce((s, r) => s + r.jumps.length, 0);
          ro.innerHTML = `<span class="k">trajectories </span>${M} &nbsp; <span class="k">jumps per run </span>${num(nj / M, 1)}<br><span class="k">typical gap to Lindblad </span>${num(err, 3)} (statistics predict ≲ ${num(.5 / Math.sqrt(M), 3)})<br><span class="k">first run’s jumps at t = </span>${data.runs[0].jumps.slice(0, 6).map(v => num(v, 2)).join(', ') || 'none'}`;
          show();
        };
        const tS = slider({ id: id('t'), label: 'Playback time', min: 0, max: Tt, step: .02, value: 0, fmt: v => num(v, 2), on: v => { tcur = v; show(); } });
        Scope.tick(now => { if (!anim) return; const u = Math.min(1, (now - anim) / dur(6000)); tcur = u * Tt; tS.set(tcur); show(); if (u >= 1) anim = null; });
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow([['first trajectory', 'var(--ink)'], ['other trajectories', 'var(--cyan)'], ['average', 'var(--copper)'], ['Lindblad', 'var(--ink)', 1]])), sph),
          h('div', { class: 'split' }, h('div', { class: 'stack' },
            slider({ id: id('o'), label: 'Drive Ω (in units of γ)', min: 0, max: 8, step: .1, value: Om, fmt: v => num(v, 1), on: v => { Om = v; run(); } }),
            slider({ id: id('m'), label: 'Number of trajectories', min: 1, max: 400, step: 1, value: M, fmt: String, on: v => { M = v; } }), tS,
            h('div', { class: 'btns' }, btn('Run trajectories', run, 'pri sm'), btn('Play back', () => { anim = performance.now(); }, 'sm'))), ro));
        run();
      }
    },
    cost: {
      title: 'Memory: density matrix versus trajectories',
      cap: 'Memory to store one density matrix (16 bytes × 4ⁿ) against one state vector (16 bytes × 2ⁿ), on a logarithmic scale. The dashed line is 16 GB. Trajectories also need many runs, but runs can be done one at a time or in parallel, and the number needed is set by the target precision, not by n.',
      build(body, id) {
        let n = 20, eps = .01;
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const fmtB = b => { const u = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']; let k = 0; while (b >= 1000 && k < u.length - 1) { b /= 1000; k++; } return k === u.length - 1 && b >= 1000 ? sci(b) + ' YB' : num(b, b < 10 ? 1 : 0) + ' ' + u[k]; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 50], y: [10, 1e33], ylog: true, xt: [1, 10, 20, 30, 40, 50], yt: [1e3, 1e9, 1e15, 1e21, 1e27, 1e33], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'qubits n', yl: 'bytes' });
          polyline(ctx, [[A.L, A.Y(16e9)], [A.R, A.Y(16e9)]], T.muted, 1.3, [5, 4]); txt(ctx, '16 GB', A.R - 4, A.Y(16e9) - 8, { align: 'right', font: '600 10.5px "JetBrains Mono",monospace' });
          const L = (f, col) => { const pts = []; for (let k = 1; k <= 50; k++) { const v = f(k); if (v > 1e33) break; pts.push([A.X(k), A.Y(v)]); } polyline(ctx, pts, col, 2.4); };
          L(k => 16 * 4 ** k, T.copper); L(k => 16 * 2 ** k, T.cyan); polyline(ctx, [[A.X(n), A.T], [A.X(n), A.B]], T.ink, 1, [3, 3]);
        });
        const upd = () => {
          const Mn = Math.ceil(1 / (eps * eps));
          ro.innerHTML = `<span class="k">density matrix, ${n} qubits </span>${fmtB(16 * 4 ** n)}<br><span class="k">one state vector            </span>${fmtB(16 * 2 ** n)}<br><span class="k">runs for precision ${eps} </span>about ${Mn.toLocaleString()}<br><span class="k">trajectories cheaper when runs &lt; 2ⁿ </span>${Mn < 2 ** n ? 'yes' : 'no'} (2ⁿ = ${n < 40 ? (2 ** n).toLocaleString() : sci(2 ** n)})`;
          p.inv();
        };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['density matrix 16·4ⁿ', 'var(--copper)'], ['state vector 16·2ⁿ', 'var(--cyan)']])),
          h('div', { class: 'stack' }, slider({ id: id('n'), label: 'Qubits n', min: 1, max: 50, step: 1, value: n, fmt: String, on: v => { n = v; upd(); } }),
            slider({ id: id('e'), label: 'Target statistical precision', min: -3, max: -1, step: .5, value: -2, fmt: v => String(10 ** v), on: v => { eps = 10 ** v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['Quantum trajectories replace a 4ⁿ density matrix with many random pure-state runs of 2ⁿ amplitudes each.',
    'Between jumps the state evolves under H_eff = H − (i/2)ΣL†L and is renormalized; jumps apply L_k with probability dt⟨L_k†L_k⟩.',
    'Averaging M runs reproduces the Lindblad solution with error ~1/√M; a single run is what a perfect detector would record.',
    'Noisy circuit simulators sample random Pauli errors in the same way, which is how most thresholds are computed.'],
  quiz: QZ([
    ['Why are quantum trajectories cheaper than density matrices for many qubits?', ['They are exact', 'Each run stores 2ⁿ amplitudes instead of 4ⁿ density-matrix entries', 'They need no random numbers', 'They ignore noise'], 1, 'Memory per run is the square root of the density matrix’s, and the number of runs is set by the desired precision, not by n.'],
    ['What evolves the state between jumps?', ['The ordinary Hamiltonian only', 'A non-Hermitian effective Hamiltonian H − (i/2)ΣL†L, followed by renormalization', 'Repeated measurement', 'A random unitary'], 1, 'The anti-Hermitian part shrinks the norm at the rate jumps would occur, and renormalizing describes the information gained by seeing no jump.'],
    ['For a decaying qubit, what happens at a jump?', ['The state flips to |1⟩', 'The lowering operator is applied, putting the qubit in |0⟩', 'The state becomes mixed', 'Nothing'], 1, 'The jump operator is √γ σ₋, which sends any state with some excited amplitude to |0⟩, corresponding to an emitted photon.'],
    ['How does the statistical error of a trajectory average scale with the number of runs M?', ['1/M', '1/√M', 'Constant', 'e^(−M)'], 1, 'Trajectory averages are Monte Carlo estimates, with standard error proportional to 1/√M.'],
    ['What does a single trajectory represent physically?', ['Nothing', 'The record of a system whose environment is monitored by a perfect detector', 'The average behaviour', 'A classical particle path'], 1, 'Conditioning on detector clicks (or their absence) gives exactly the jump-and-drift evolution of one trajectory.'],
    ['What did the 2019 Yale experiment by Minev and colleagues show?', ['That jumps are instantaneous and random in every respect', 'That a quantum jump, once begun, evolves smoothly and can be caught and reversed mid-flight', 'That qubits never jump', 'That trajectories violate the Lindblad equation'], 1, 'By monitoring an auxiliary transition, they predicted jumps in advance and reversed them, revealing the continuous, deterministic nature of a jump in progress.'],
    ['Different measurement schemes of the environment give different unravellings. Photon counting gives jumps; what does homodyne detection give?', ['No evolution', 'Continuous diffusive evolution', 'Teleportation', 'Exact density matrices'], 1, 'Homodyne detection produces a continuous noisy current, and the conditioned state follows a stochastic, diffusive trajectory. All unravellings average to the same master equation.'],
    ['How do noisy circuit simulators commonly model depolarizing noise?', ['By storing density matrices for every gate', 'By inserting random Pauli errors with the right probabilities and averaging over sampled circuits', 'By ignoring it', 'By rescaling amplitudes'], 1, 'Pauli twirling makes noise a probabilistic mixture of Paulis, which can be sampled; for Clifford circuits each sample is a fast stabilizer simulation.'],
    ['When do trajectories become cheaper overall than a density-matrix simulation?', ['Never', 'When the number of runs needed is smaller than 2ⁿ', 'Only for one qubit', 'Only without noise'], 1, 'Total work scales like M·2ⁿ versus 4ⁿ; for any realistic precision and more than a dozen or so qubits, M ≪ 2ⁿ.'],
    ['Over many runs, what does the average trajectory converge to?', ['A random state', 'The solution of the Lindblad master equation', 'The ground state', 'The initial state'], 1, 'The unravelling is constructed so that the ensemble average of |ψ⟩⟨ψ| obeys the Lindblad equation exactly.']
  ])
});

/* ---------------- Light cones and entanglement growth ---------------- */
const MODELS = {
  xx: { label: 'Free hopping (XX)', J: .5, Jz: 0, g: 0 },
  heis: { label: 'Heisenberg', J: .5, Jz: .5, g: 0 },
  ising: { label: 'Ising, transverse field', J: 0, Jz: 1, g: 1 }
};
const evolveChain = (n, mdl, W, seed, init, Tm, dt) => {
  const N = 1 << n, re = new Float64Array(N), im = new Float64Array(N); re[init] = 1;
  const rnd = rng(seed), hz = [...Array(n)].map(() => W * (2 * rnd() - 1)), bit = (x, q) => (x >> (n - 1 - q)) & 1;
  const Ed = new Float64Array(N); for (let x = 0; x < N; x++) { let e = 0; for (let q = 0; q < n; q++) { const z = bit(x, q) ? -1 : 1; e += hz[q] * z; if (q < n - 1) e += mdl.Jz * z * (bit(x, q + 1) ? -1 : 1); } Ed[x] = e; }
  const diag = tau => { for (let x = 0; x < N; x++) { const c3 = Math.cos(Ed[x] * tau), s = -Math.sin(Ed[x] * tau), r = re[x], i = im[x]; re[x] = r * c3 - i * s; im[x] = r * s + i * c3; } };
  const hop = (q, tau) => { if (!mdl.J) return; const c3 = Math.cos(2 * mdl.J * tau), s = Math.sin(2 * mdl.J * tau), ma = 1 << (n - 1 - q), mb = 1 << (n - 2 - q);
    for (let x = 0; x < N; x++) { if ((x & ma) && !(x & mb)) { const y = (x & ~ma) | mb, ar = re[x], ai = im[x], br = re[y], bi = im[y]; re[x] = c3 * ar + s * bi; im[x] = c3 * ai - s * br; re[y] = c3 * br + s * ai; im[y] = c3 * bi - s * ar; } } };
  const xf = tau => { if (!mdl.g) return; const c3 = Math.cos(mdl.g * tau), s = Math.sin(mdl.g * tau); for (let q = 0; q < n; q++) { const m2 = 1 << (n - 1 - q); for (let x = 0; x < N; x++) if (!(x & m2)) { const y = x | m2, ar = re[x], ai = im[x], br = re[y], bi = im[y]; re[x] = c3 * ar + s * bi; im[x] = c3 * ai - s * br; re[y] = c3 * br + s * ai; im[y] = c3 * bi - s * ar; } } };
  const zs = () => { const out = new Float64Array(n); for (let x = 0; x < N; x++) { const p = re[x] * re[x] + im[x] * im[x]; if (p < 1e-15) continue; for (let q = 0; q < n; q++) out[q] += bit(x, q) ? -p : p; } return out; };
  const s2 = () => { const h2 = n >> 1, D = 1 << h2, O = 1 << (n - h2); let tr = 0; for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) { let r = 0, i = 0; for (let o = 0; o < O; o++) { const x = a * O + o, y = b * O + o; r += re[x] * re[y] + im[x] * im[y]; i += im[x] * re[y] - re[x] * im[y]; } tr += r * r + i * i; } return -Math.log2(tr); };
  const steps = Math.round(Tm / dt), Z = [zs()], S = [s2()];
  for (let k = 0; k < steps; k++) { diag(dt / 2); for (let q = 0; q < n - 1; q += 2) hop(q, dt); for (let q = 1; q < n - 1; q += 2) hop(q, dt); xf(dt); diag(dt / 2); Z.push(zs()); if (k % 2 === 1) S.push(s2()); }
  return { Z, S };
};
LESSONS.push({
  id: 'lightcone', n: 33.5, stage: SIM, minutes: 16, title: 'Light cones and the cost of simulating dynamics',
  lede: 'In a chain of interacting spins, a local kick spreads at a finite speed, like light. Behind the front, entanglement builds up steadily, and that build-up is exactly what makes long-time dynamics so hard to simulate classically.',
  html: `
<h2>Information has a speed limit</h2>
<p>Most physical Hamiltonians are local: each term couples a few nearby particles. In 1972 Elliott Lieb and Derek Robinson proved that such systems have an effective speed of light. A disturbance at one site affects a distant site only after a time proportional to the distance, apart from tails that fall off exponentially outside the <strong>Lieb–Robinson light cone</strong>. The speed ${m('v<sub>LR</sub>')} is set by the coupling strengths, not by relativity.</p>
<p>Light cones make some simulations easy. To compute a local observable after a short time ${m('t')}, only the region within distance ${m('v<sub>LR</sub>t')} matters, however large the whole system is. The same holds for circuits: an output qubit of a depth-${m('D')} circuit depends only on the gates in its <strong>backward light cone</strong>.</p>
${LAB('cone')}
<h2>Entanglement grows behind the front</h2>
<p>Start a clean spin chain in a simple product state, such as alternating up and down, and let it evolve: a <strong>global quench</strong>. Pairs of correlated excitations fly apart from every point and carry entanglement across any cut. The entanglement entropy of half the chain grows linearly in time until it saturates at a value proportional to the system size. A matrix product state ([[L:tensornet]]) needs bond dimension about ${m('2<sup>S</sup>')} to hold a state with entanglement ${m('S')}, so the classical cost of following the dynamics grows exponentially with time. Short times are easy, long times are hard: this is one of the clearest places where quantum simulators can go beyond classical methods.</p>
<h2>Disorder can stop the spreading</h2>
<p>Add strong random fields to an interacting chain and something different happens. Excitations no longer travel freely, the light cone stalls, and entanglement grows only slowly, roughly with the logarithm of time. This regime, <strong>many-body localization</strong>, keeps a memory of the initial state for very long times. Whether it survives in large systems and at infinite times is still debated, but its phenomenology is clear in the chains that can be simulated exactly, like the one below. Many-body localization also stabilizes discrete time crystals ([[L:timecrystal]]).</p>
${NOTE('What the lab computes', `<p>The lab evolves the full ${m('2¹²')}-amplitude state of a 12-spin chain with a second-order Trotter formula. The entanglement measure is the second Rényi entropy ${m('S₂ = −log₂ Tr ρ<sub>A</sub>²')} of the left half, which grows in the same way as the von Neumann entropy and is cheaper to compute. Quantum simulators measure ${m('S₂')} directly by interfering two copies of a state or with randomized measurements.</p>`)}
${LAB('backcone')}
`,
  labs: {
    cone: {
      title: 'A local kick spreading through a spin chain',
      cap: 'Top: how much each spin’s magnetization differs between the chain started in the alternating Néel state and the same state with the middle spin flipped. Time runs down the page; the dashed lines mark a front moving at speed 2. Bottom: half-chain entanglement S₂ after the global quench from the Néel state. Add disorder to see the cone stall and the entanglement growth slow down.',
      build(body, id) {
        const n = 12; let mk = 'heis', W = 0, seed = 7, R = null;
        const hm = canvas('', 'height:260px'), ec = canvas('', 'height:180px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const Tm = 8, dt = .05, neel = parseInt('01'.repeat(n / 2), 2), kick = neel ^ (1 << (n - 1 - n / 2));
        let img = null;
        const run = () => { const a = evolveChain(n, MODELS[mk], W, seed, neel, Tm, dt), b = evolveChain(n, MODELS[mk], W, seed, kick, Tm, dt); R = { a, b, D: a.Z.map((z, k) => z.map((v, q) => Math.abs(v - b.Z[k][q]))) }; img = null; upd(); };
        const hp = painter(hm, ({ ctx, w, h: H }) => {
          if (!R) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [-.5, n - .5], y: [Tm, 0], xt: [0, 3, 6, 9, 11], xf: v => 'site ' + v, yt: [0, 2, 4, 6, 8], xl: '', yl: 'time', pad: { b: 26 } });
          if (!img) img = heatImage(n, R.D.length, (i, j) => seqRGB(Math.min(1, R.D[j][i] / 1.2)));
          drawHeat(ctx, img, A.L + 1, A.T, A.R - A.L - 1, A.B - A.T, false);
          if (mk !== 'ising') for (const sg of [-1, 1]) polyline(ctx, [[A.X(n / 2), A.Y(0)], [A.X(clamp(n / 2 + sg * 2 * Tm, -.5, n - .5)), A.Y(Math.min(Tm, (n / 2 + .5) / 2))]], T.copper, 1.3, [5, 4]);
        });
        const ep = painter(ec, ({ ctx, w, h: H }) => {
          if (!R) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [0, Tm], y: [0, 4], xt: [0, 2, 4, 6, 8], yt: [0, 1, 2, 3, 4], xl: 'time', yl: 'S₂ (bits)' });
          polyline(ctx, R.a.S.map((s, k) => [A.X(k * 2 * dt), A.Y(Math.min(4, s))]), T.copper, 2.4);
        });
        const upd = () => {
          const S = R.a.S, sEnd = S[S.length - 1], frontT = (() => { for (let k = 0; k < R.D.length; k++) if (R.D[k][0] > .05 || R.D[k][n - 1] > .05) return k * dt; return null; })();
          ro.innerHTML = `<span class="k">kick reaches the chain’s end </span>${frontT == null ? 'not within t = 8' : 't ≈ ' + num(frontT, 1)}<br><span class="k">S₂ at t = 8 </span>${num(sEnd, 2)} bits → bond dimension ≈ ${num(2 ** sEnd, 1)}<br><span class="k">maximum possible for 6 | 6 </span>6 bits`;
          hp.inv(); ep.inv();
        };
        body.append(h('div', { class: 'btns' }, seg(Object.entries(MODELS).map(([k, v]) => ({ v: k, label: v.label })), mk, v => { mk = v; run(); }, 'Model')), hm, ec,
          h('div', { class: 'split' }, h('div', { class: 'stack' }, slider({ id: id('w'), label: 'Disorder strength W', min: 0, max: 8, step: .5, value: W, fmt: v => num(v, 1), on: v => { W = v; run(); } }), h('div', { class: 'btns' }, btn('New disorder sample', () => { seed = Math.floor(Math.random() * 1e6); run(); }, 'sm'))), ro));
        run();
      }
    },
    backcone: {
      title: 'The backward light cone of a circuit',
      cap: 'A brickwork circuit of two-qubit gates on 16 qubits. Tap an output qubit (the dots on the right) to highlight every gate that can influence it. To compute a local observable on that qubit, a classical simulator only needs the highlighted gates, which cover at most 2 × depth qubits, however wide the circuit.',
      build(body, id) {
        const n = 16; let D = 5, sel = 7;
        const box = h('div', { class: 'circ-wrap', style: 'background:var(--surface);padding:8px' }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const render = () => {
          const cw = 46, rh = 22, M = 26, W = M * 2 + D * cw + 30, H = M + n * rh;
          const gates = []; for (let l = 0; l < D; l++) for (let q = l % 2; q + 1 < n; q += 2) gates.push({ l, q });
          let lo = sel, hi = sel; const inC = new Set();
          for (let l = D - 1; l >= 0; l--) { for (const g of gates) if (g.l === l && g.q <= hi && g.q + 1 >= lo) inC.add(g); for (const g of gates) if (g.l === l && inC.has(g)) { lo = Math.min(lo, g.q); hi = Math.max(hi, g.q + 1); } }
          const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'circ', role: 'img', 'aria-label': 'Brickwork circuit with backward light cone', style: `max-width:100%;height:auto` });
          for (let q = 0; q < n; q++) svg.append(sv('line', { x1: M - 6, y1: M / 2 + q * rh + rh / 2, x2: W - 22, y2: M / 2 + q * rh + rh / 2, class: 'c-wire' }));
          for (const g of gates) { const x = M + g.l * cw + 6, y = M / 2 + g.q * rh + 3; svg.append(sv('rect', { x, y, width: cw - 12, height: 2 * rh - 6, rx: 4, fill: inC.has(g) ? 'var(--copper)' : 'var(--surface-2)', stroke: inC.has(g) ? 'var(--copper-lo)' : 'var(--line)', 'stroke-width': 1.2 })); }
          for (let q = 0; q < n; q++) { const c3 = sv('circle', { cx: W - 14, cy: M / 2 + q * rh + rh / 2, r: q === sel ? 7 : 5, fill: q === sel ? 'var(--copper)' : 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.5, style: 'cursor:pointer' }); c3.addEventListener('click', () => { sel = q; render(); }); svg.append(c3); }
          box.innerHTML = ''; box.append(svg);
          ro.innerHTML = `<span class="k">gates in the cone </span>${inC.size} of ${gates.length}<br><span class="k">qubits it touches </span>${hi - lo + 1} of ${n} (at most 2 × depth = ${2 * D})<br><span class="k">state size a simulator needs </span>2^${hi - lo + 1} = ${(2 ** (hi - lo + 1)).toLocaleString()} instead of 2^${n} = ${(2 ** n).toLocaleString()}`;
        };
        body.append(h('div', { class: 'split wide-l' }, box, h('div', { class: 'stack' }, slider({ id: id('D'), label: 'Circuit depth', min: 1, max: 12, step: 1, value: D, fmt: String, on: v => { D = v; render(); } }), ro)));
        render();
      }
    }
  },
  take: ['Local Hamiltonians have a Lieb–Robinson light cone: disturbances spread at a finite speed, with exponentially small tails outside.',
    'Local observables at short times depend only on a light-cone region, just as circuit outputs depend only on their backward light cone.',
    'After a global quench, entanglement grows linearly in time, so the bond dimension needed by MPS methods grows exponentially with time.',
    'Strong disorder can stall the spreading (many-body localization), making entanglement grow only logarithmically.'],
  quiz: QZ([
    ['What does the Lieb–Robinson bound establish?', ['That quantum systems are classically simulable', 'An effective maximum speed for the spread of influence in systems with local interactions', 'The speed of light in fibre', 'A bound on energy'], 1, 'Commutators of operators at distance r stay exponentially small until time ~ r/v_LR, giving an emergent light cone.'],
    ['What sets the Lieb–Robinson velocity?', ['The speed of light', 'The strength and range of the local couplings', 'The temperature', 'The number of qubits'], 1, 'v_LR is proportional to the interaction strengths; stronger couplings mean faster spreading.'],
    ['Why are local observables at short times easy to simulate classically?', ['Because they are zero', 'Only the region inside the light cone matters, which is small at short times', 'Because they are always classical', 'Because of the uncertainty principle'], 1, 'A simulation can restrict itself to a region of radius ~ v_LR t around the observable.'],
    ['How does half-chain entanglement grow after a global quench in a clean chain?', ['Logarithmically', 'Linearly, until it saturates', 'Not at all', 'Exponentially'], 1, 'Quasi-particle pairs emitted everywhere carry entanglement across the cut at a steady rate, until it saturates near a volume-law value.'],
    ['Why does linear entanglement growth make long-time simulation hard?', ['MPS methods need bond dimension ~2^S, which grows exponentially with time', 'Because Trotter errors vanish', 'Because the light cone disappears', 'It doesn’t'], 0, 'The cost of matrix product state methods scales with the bond dimension, which must track the exponentially growing entanglement.'],
    ['What is the backward light cone of an output qubit in a circuit?', ['All gates in the circuit', 'The set of gates that can influence that qubit, which in a brickwork circuit widens by two qubits per layer', 'Only the last gate', 'The gates after the qubit'], 1, 'Working backwards from the output, each layer of two-qubit gates can enlarge the dependency region by at most one qubit on each side.'],
    ['What happens to the light cone in a strongly disordered interacting chain?', ['It spreads faster', 'It stalls: excitations stay localized (many-body localization)', 'It becomes exactly linear', 'Nothing changes'], 1, 'Random fields detune neighbouring sites so that excitations cannot resonate their way along the chain.'],
    ['How does entanglement typically grow in the many-body localized regime?', ['Linearly', 'Logarithmically in time', 'Not at all', 'Quadratically'], 1, 'Interactions between localized degrees of freedom dephase slowly, giving characteristic slow, logarithmic growth.'],
    ['Why does the lab use the second Rényi entropy S₂ = −log₂ Tr ρ_A²?', ['It is the only measure of entanglement', 'It grows similarly to the von Neumann entropy and needs no diagonalization; experiments can measure it directly', 'It is always zero', 'It ignores phases'], 1, 'Tr ρ² is a simple sum of squares, and two-copy interference or randomized measurements can access it on quantum simulators.'],
    ['Why are quench dynamics a promising application for quantum simulators?', ['They require no qubits', 'Classical cost grows rapidly with time because of entanglement growth, while a quantum simulator just evolves the system', 'They are easy classically', 'They need fault tolerance first'], 1, 'Analog and digital quantum simulators naturally follow entangled dynamics that strain classical tensor-network methods at long times.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Hybrid argument', 'The BBBV lower-bound technique showing that some input bit is rarely queried, so flipping it barely changes the output; it proves Grover is optimal.', 'polymethod'],
  ['Polynomial method', 'A lower-bound technique: a T-query algorithm’s acceptance probability is a polynomial of degree at most 2T in the input bits.', 'polymethod'],
  ['Approximate degree', 'The smallest degree of a polynomial that approximates a Boolean function within a fixed error; half of it bounds quantum query complexity from below.', 'polymethod'],
  ['Quantum signal processing (QSP)', 'Interleaving a signal rotation with chosen phase rotations to make a qubit respond with a chosen polynomial of the signal.', 'qsp'],
  ['QSVT', 'Quantum singular value transformation: applying a polynomial to all singular values of a block-encoded matrix with one circuit.', 'qsp'],
  ['Block encoding', 'A unitary whose top-left block equals a given matrix (up to normalization), the input format for QSVT.', 'qsp'],
  ['Quantum trajectory', 'A stochastic pure-state evolution with jumps whose average reproduces a Lindblad master equation.', 'trajectories'],
  ['Quantum jump', 'An abrupt change of a monitored quantum system’s state, such as a decaying atom emitting a photon.', 'trajectories'],
  ['Lieb–Robinson bound', 'A rigorous speed limit on the spread of influence in quantum systems with local interactions.', 'lightcone'],
  ['Many-body localization', 'A regime of strongly disordered interacting systems in which excitations do not spread and entanglement grows only logarithmically.', 'lightcone'],
  ['Global quench', 'Suddenly starting a system’s evolution from a state that is not an eigenstate, such as a product state, and following the dynamics.', 'lightcone']
);
})();
