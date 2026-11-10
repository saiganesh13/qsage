/* =====================================================================
   Research tracks · compilers: gate synthesis, dynamic circuits
                   · variational and ML: QAOA, quantum kernels
   ===================================================================== */
(() => {
const CMP = 8, VQA = 9;

/* ---------- Clifford+T synthesis database (Matsumoto–Amano normal form) ---------- */
const SYN = (() => {
  let db = null;
  const nrm = U => { let k = 0; while (C2.abs2(U[k]) < 1e-12) k++; const a = U[k], r = Math.hypot(a[0], a[1]), ph = [a[0] / r, -a[1] / r]; return U.map(z => C2.mul(z, ph)); };
  const key = U => nrm(U).map(z => z.map(v => (Math.round(v * 1e6) / 1e6 + 0).toFixed(5)).join(',')).join(';');
  const Hm = [[S2, 0], [S2, 0], [S2, 0], [-S2, 0]], Sm = [[1, 0], [0, 0], [0, 0], [0, 1]], Tm = [[1, 0], [0, 0], [0, 0], [S2, S2]], I2 = [[1, 0], [0, 0], [0, 0], [1, 0]];
  return () => {
    if (db) return db;
    const cl = [{ m: I2, w: '' }], seen = new Set([key(I2)]);
    for (let i = 0; i < cl.length; i++) for (const [g, nm] of [[Hm, 'H'], [Sm, 'S']]) { const M = C2.mm(cl[i].m, g), k = key(M); if (!seen.has(k)) { seen.add(k); cl.push({ m: M, w: cl[i].w + nm }); } }
    const HT = C2.mm(Hm, Tm), SHT = C2.mm(Sm, HT), TMAX = 15;
    let bodies = [{ m: I2, t: 0, w: '' }, { m: Tm, t: 1, w: 'T' }], fr = bodies.slice();
    for (let t = 1; t <= TMAX; t++) { const nf = []; for (const b of fr) { if (b.t >= TMAX) continue; nf.push({ m: C2.mm(b.m, HT), t: b.t + 1, w: b.w + 'HT' }); nf.push({ m: C2.mm(b.m, SHT), t: b.t + 1, w: b.w + 'SHT' }); } bodies = bodies.concat(nf); fr = nf; }
    return db = { cl, bodies, TMAX };
  };
})();
const synthBest = V => {
  const { cl, bodies, TMAX } = SYN(), best = [...Array(TMAX + 1)].map(() => ({ e: 9 }));
  for (const b of bodies) { const M = C2.mm(C2.dag(b.m), V); for (const c3 of cl) { const e = Math.sqrt(Math.max(0, 1 - C2.overlap(c3.m, M))); if (e < best[b.t].e) best[b.t] = { e, b, c: c3 }; } }
  for (let t = 1; t <= TMAX; t++) if (best[t - 1].e < best[t].e) best[t] = Object.assign({ inherited: true }, best[t - 1]);
  return best;
};
const Uaxis = (n, th) => Rn2(n, th);

LESSONS.push({
  id: 'synthesis', n: 34.5, stage: CMP, minutes: 15, title: 'Gate synthesis: building rotations from H and T',
  lede: 'Error-corrected machines offer only a handful of gates. Every other rotation must be approximated by a sequence of them, and the length of that sequence, especially its T count, is a large part of the bill.',
  html: `
<h2>A finite menu</h2>
<p>A fault-tolerant computer implements Clifford gates cheaply and T gates expensively, through magic states ([[L:magic]]). Algorithms, on the other hand, are full of arbitrary rotations: ${m('R<sub>z</sub>(θ)')} in phase estimation, chemistry and QAOA. Since Clifford+T is universal, any single-qubit unitary can be approximated to any precision ${m('ε')} by a word in H, S and T. <strong>Gate synthesis</strong> is the problem of finding short words, and above all words with few T gates.</p>
<h2>Solovay–Kitaev: a universal answer</h2>
<p>The Solovay–Kitaev theorem (1995–1997) guarantees that any universal gate set closed under inverses reaches precision ${m('ε')} with ${m('O(log<sup>c</sup>(1/ε))')} gates, with ${m('c')} about 4 in its standard form and lower in later refinements. Its recursive construction corrects an approximation by group commutators of smaller corrections. It works for any gate set, but the sequences are far from optimal.</p>
<h2>Number theory: optimal answers</h2>
<p>For Clifford+T there is a much sharper picture. Kliuchnikov, Maslov and Mosca showed in 2013 that a unitary can be built <em>exactly</em> from H and T if and only if its entries lie in the ring ${m('ℤ[1/√2, i]')}, and gave an efficient algorithm to find the word. Ross and Selinger (2016) turned approximation into a number-theoretic search: find a matrix in that ring close to ${m('R<sub>z</sub>(θ)')}, then synthesize it exactly. Their method uses about ${m('3 log₂(1/ε)')} T gates for a z-rotation, matching a counting lower bound: there are only about ${m('2ᵗ')} distinct circuits with ${m('t')} T gates, and they must cover a three-dimensional space of unitaries with balls of radius ${m('ε')}.</p>
${EQ('T count ≈ 3 log₂(1/ε)&nbsp;&nbsp;&nbsp; (ε = 10⁻¹⁰ needs about 100 T gates)')}
<p>Every Clifford+T unitary has a unique <strong>Matsumoto–Amano normal form</strong>: an optional leading T, then a string of ${m('HT')} and ${m('SHT')} syllables, then a Clifford. The lab below enumerates every normal form with up to 15 T gates, about 2.4 million distinct unitaries, and finds the provably best approximation for each T count.</p>
${LAB('search')}
<h2>Doing better than 3 log₂(1/ε)</h2>
<ul>
<li><strong>Repeat-until-success circuits</strong> use an ancilla and a measurement: on success the target rotation is applied, on failure a known correctable operation occurs and the circuit is retried. On average they need noticeably fewer T gates.</li>
<li><strong>Probabilistic mixing</strong> (Campbell; Hastings, 2017): randomly choosing between two approximations whose errors point in opposite directions cancels the error to first order, roughly halving the T count for a given average precision.</li>
<li><strong>Avoiding rotations</strong>: Hamiltonian simulation by qubitization and QSVT uses a fixed set of gates plus reflections, and phase-gradient tricks replace many rotations by additions.</li>
</ul>
${LAB('budget')}
`,
  labs: {
    search: {
      title: 'Exhaustive Clifford+T synthesis',
      cap: 'Choose a target rotation. The search tries every normal form with up to 15 T gates and every final Clifford, and keeps the closest at each T count (distance √(1 − |Tr U†V|/2), insensitive to global phase). The chart shows the best error against T count; the dashed line is the counting estimate. On the sphere, dots are the images of the six stabilizer states under all words with at most 8 T gates, filling the sphere as T grows; the ring marks the target applied to |0⟩ and the arrow the best approximation.',
      build(body, id) {
        let mode = 'z', th = 1, ax = [S2, 0, S2], tshow = 6, res = null, pend = null;
        const cv = canvas('', 'height:230px'), sph = canvas('sq', 'max-width:280px;margin:0 auto'), bv = new BlochView(sph, { trail: false, labels: 'min' }), ro = h('div', { class: 'readout', style: 'white-space:normal' }), stat = h('div', { class: 'status' });
        const target = () => mode === 'z' ? Rz(th) : Uaxis(ax, th);
        const CARDS = [[[1, 0], [0, 0]], [[0, 0], [1, 0]], [[S2, 0], [S2, 0]], [[S2, 0], [-S2, 0]], [[S2, 0], [0, S2]], [[S2, 0], [0, -S2]]];
        const cloud = () => { const { bodies } = SYN(), pts = [], seen = new Set(), T_ = Theme.get(); for (const b of bodies) { if (b.t > tshow) continue; for (const [s0, s1] of CARDS) { const U = b.m, a = C2.add(C2.mul(U[0], s0), C2.mul(U[1], s1)), bb = C2.add(C2.mul(U[2], s0), C2.mul(U[3], s1)), v = [2 * (a[0] * bb[0] + a[1] * bb[1]), 2 * (a[0] * bb[1] - a[1] * bb[0]), C2.abs2(a) - C2.abs2(bb)], k = v.map(x => x.toFixed(3)).join(','); if (seen.has(k)) continue; seen.add(k); pts.push({ v, r: 1.6, color: rgba(T_.cyan, .7) }); } } return pts; };
        const run = () => {
          stat.textContent = 'Searching…'; pend = null;
          Scope.later(20, () => {
            const t0 = performance.now(); res = synthBest(target()); const ms = performance.now() - t0;
            const b = res[res.length - 1], U = C2.mm(b.b.m, b.c.m);
            bv.v = C2.bloch0(U); bv.target = C2.bloch0(target()); bv.extra = cloud(); bv.inv(); p.inv();
            const rows = res.map((r, t) => r.inherited ? null : `<span class="k">T = ${String(t).padStart(2)} </span>ε = ${r.e < 1e-3 ? sci(r.e) : num(r.e, 4)} &nbsp; ${(r.b.w || '') + (r.c.w ? ' · ' + r.c.w : '') || 'I'}`).filter(Boolean);
            ro.innerHTML = rows.slice(-7).join('<br>');
            stat.className = 'status good'; stat.textContent = `Searched ${(SYN().bodies.length * 24).toLocaleString()} unitaries in ${num(ms, 0)} ms. Best: ε = ${sci(b.e)} with ${res.findIndex(r => r === b || (r.e === b.e && !r.inherited))} T gates.`;
          });
        };
        const later = () => { if (pend) return; pend = Scope.later(250, run); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!res) return; const T = Theme.get(), TM = res.length - 1, A = axes(ctx, w, H, { x: [0, TM], y: [1e-3, 1], ylog: true, xt: [0, 3, 6, 9, 12, 15], yt: [1e-3, 1e-2, .1, 1], yf: v => String(v), xl: 'T count', yl: 'best error ε' });
          const ref = []; for (let t = 0; t <= TM; t += .1) ref.push([A.X(t), A.Y(clamp(Math.pow(72 * 2 ** t, -1 / 3), 1e-3, 1))]); polyline(ctx, ref, T.muted, 1.4, [5, 4]);
          const pts = res.map((r, t) => [A.X(t), A.Y(clamp(r.e, 1e-3, 1))]); polyline(ctx, pts, T.copper, 2.2); res.forEach((r, t) => { if (!r.inherited) dot(ctx, ...pts[t], 4, T.copper, T.surface); });
        });
        const ctl = h('div', { class: 'stack' });
        const mk = () => {
          ctl.innerHTML = '';
          ctl.append(slider({ id: id('th'), label: 'Rotation angle θ', min: .02, max: PI, step: .01, value: th, fmt: v => num(v, 2) + ' rad', on: v => { th = v; later(); } }));
          if (mode === 'axis') { const pa = Math.acos(ax[2]), az = Math.atan2(ax[1], ax[0]); ctl.append(slider({ id: id('pa'), label: 'Axis polar angle', min: 0, max: PI, step: .01, value: pa, fmt: v => num(deg(v), 0) + '°', on: v => { const a2 = Math.atan2(ax[1], ax[0]); ax = [Math.sin(v) * Math.cos(a2), Math.sin(v) * Math.sin(a2), Math.cos(v)]; later(); } }), slider({ id: id('az'), label: 'Axis azimuth', min: -PI, max: PI, step: .01, value: az, fmt: v => num(deg(v), 0) + '°', on: v => { const p2 = Math.acos(ax[2]); ax = [Math.sin(p2) * Math.cos(v), Math.sin(p2) * Math.sin(v), Math.cos(p2)]; later(); } })); }
        };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'z', label: 'R_z(θ)' }, { v: 'axis', label: 'Rotation about any axis' }], mode, v => { mode = v; mk(); later(); }, 'Target')),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['best found', 'var(--copper)'], ['counting estimate (72·2ᵗ)^(−1/3)', 'var(--muted)', 1]]), stat), h('div', { class: 'stack' }, sph, slider({ id: id('ts'), label: 'Cloud: words with at most this many T gates', min: 0, max: 8, step: 1, value: tshow, fmt: String, on: v => { tshow = v; bv.extra = cloud(); bv.inv(); } }))),
          h('div', { class: 'split' }, ctl, ro));
        mk(); run();
      }
    },
    budget: {
      title: 'A rotation error budget',
      cap: 'An algorithm with R arbitrary rotations and a total error budget ε_total gives each rotation ε_total/R. With about 3 log₂(1/ε) + 4 T gates per rotation (a typical figure for optimal ancilla-free synthesis), the chart shows the total T count from rotations alone. Halving the constant, as mixing and repeat-until-success roughly do, is shown for comparison.',
      build(body, id) {
        let lgR = 4, lgE = -2;
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const per = (R, E, c3) => c3 * Math.log2(R / E) + 4;
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), E = 10 ** lgE, A = axes(ctx, w, H, { x: [1, 1e8], y: [10, 1e11], xlog: true, ylog: true, xt: [1, 1e2, 1e4, 1e6, 1e8], yt: [10, 1e3, 1e5, 1e7, 1e9, 1e11], xf: v => '10' + sup(Math.round(Math.log10(v))), yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'rotations R', yl: 'total T count' });
          const L = (c3, col, dash) => { const pts = []; for (let e = 0; e <= 8; e += .1) { const R = 10 ** e; pts.push([A.X(R), A.Y(R * per(R, E, c3))]); } polyline(ctx, pts, col, 2.3, dash); };
          L(3, T.copper); L(1.5, T.cyan, [5, 4]); dot(ctx, A.X(10 ** lgR), A.Y(10 ** lgR * per(10 ** lgR, E, 3)), 6, T.ink, T.surface);
        });
        const upd = () => { const R = 10 ** lgR, E = 10 ** lgE, t1 = per(R, E, 3); ro.innerHTML = `<span class="k">error per rotation </span>${sci(E / R)}<br><span class="k">T gates per rotation </span>${num(t1, 0)} &nbsp; <span class="k">total </span>${sci(R * t1)}<br><span class="k">with half the constant </span>${sci(R * per(R, E, 1.5))}`; p.inv(); };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['3 log₂(R/ε) + 4 per rotation', 'var(--copper)'], ['1.5 log₂(R/ε) + 4', 'var(--cyan)', 1]])),
          h('div', { class: 'stack' }, slider({ id: id('r'), label: 'Number of rotations R', min: 0, max: 8, step: .1, value: lgR, fmt: v => Math.round(10 ** v).toLocaleString(), on: v => { lgR = v; upd(); } }),
            slider({ id: id('e'), label: 'Total error budget', min: -4, max: -1, step: .5, value: lgE, fmt: v => String(10 ** v), on: v => { lgE = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['Fault-tolerant hardware offers Clifford+T; arbitrary rotations must be approximated by words in H, S and T.',
    'Solovay–Kitaev gives O(log^c(1/ε)) gates for any universal set; number-theoretic synthesis (Ross–Selinger) reaches about 3 log₂(1/ε) T gates, matching a counting bound.',
    'Every Clifford+T unitary has a unique Matsumoto–Amano normal form, so exhaustive search over T counts is possible for small cases.',
    'Repeat-until-success circuits, probabilistic mixing and rotation-free algorithms reduce the T count further; error budgets set per-rotation precision.'],
  quiz: QZ([
    ['Why must arbitrary rotations be synthesized on fault-tolerant hardware?', ['They are illegal', 'The error-corrected gate set is finite (Clifford+T), so continuous rotations must be approximated', 'Rotations are always exact', 'Because of measurement'], 1, 'Codes implement a discrete set of logical gates; other unitaries are built as sequences of them to a chosen precision.'],
    ['What does the Solovay–Kitaev theorem guarantee?', ['Exact synthesis of any gate', 'Approximation to precision ε with O(log^c(1/ε)) gates for any universal gate set closed under inverses', 'That T gates are free', 'That only Cliffords are needed'], 1, 'Its recursive commutator construction gives polylogarithmic sequences for any such gate set, though not optimal ones.'],
    ['Roughly how many T gates does optimal synthesis of R_z(θ) need for precision ε?', ['log₂(1/ε)', 'About 3 log₂(1/ε)', '1/ε', 'A constant'], 1, 'Ross–Selinger’s algorithm achieves about 3 log₂(1/ε), and a counting argument shows this is essentially optimal for typical angles without ancillas.'],
    ['Which unitaries can H and T build exactly?', ['All unitaries', 'Those with entries in the ring ℤ[1/√2, i]', 'Only Cliffords', 'Only diagonal ones'], 1, 'Kliuchnikov, Maslov and Mosca proved this characterization and gave an efficient exact-synthesis algorithm.'],
    ['What is the counting argument for the T-count lower bound?', ['There are infinitely many circuits', 'With t T gates there are only about 2ᵗ distinct circuits, which must cover a 3-dimensional space of unitaries with ε-balls, so 2ᵗ ≳ ε⁻³', 'T gates commute', 'It comes from Grover’s algorithm'], 1, 'Covering SU(2) needs about ε⁻³ balls, giving t ≳ 3 log₂(1/ε).'],
    ['What is the Matsumoto–Amano normal form?', ['A random circuit', 'A unique canonical form: optional T, then HT or SHT syllables, then a Clifford', 'The QFT circuit', 'A decomposition into CNOTs'], 1, 'Every Clifford+T single-qubit unitary has exactly one such word, with T count equal to the number of T gates in it.'],
    ['How do repeat-until-success circuits save T gates?', ['By skipping measurement', 'They use an ancilla and measurement; on failure a correctable operation occurs and the attempt is repeated, lowering the expected T count', 'By using Toffolis', 'They do not'], 1, 'Allowing probabilistic success with cheap recovery gives shorter circuits on average than deterministic synthesis.'],
    ['How does probabilistic mixing reduce synthesis cost?', ['By choosing longer words', 'Randomly choosing between approximations with opposite errors cancels the error to first order, roughly halving the T count for a given average precision', 'By adding noise', 'By avoiding Cliffords'], 1, 'The averaged channel has error quadratic in the individual errors, so each approximation can be cruder.'],
    ['An algorithm has 10⁶ rotations and a total error budget of 0.01. What precision does each rotation need?', ['0.01', '10⁻⁸', '10⁻⁴', '10⁻⁶'], 1, 'Splitting the budget evenly gives 0.01 / 10⁶ = 10⁻⁸ per rotation, about 3 × 26.6 ≈ 80 T gates each.'],
    ['Why does T count matter so much?', ['T gates are slower to type', 'Each T gate consumes a magic state, whose production dominates the cost of fault-tolerant computation', 'T gates cannot be error-corrected', 'They add global phases'], 1, 'Magic state distillation or cultivation needs large factories, so algorithm costs are often quoted in T count or T depth.']
  ])
});

/* ---------------- Dynamic circuits ---------------- */
LESSONS.push({
  id: 'dynamic', n: 35.5, stage: CMP, minutes: 14, title: 'Dynamic circuits: measure, decide, continue',
  lede: 'Measuring in the middle of a circuit and choosing later gates from the results turns some long computations into constant-depth ones. It is also how every error-corrected computer will work.',
  html: `
<h2>Beyond static circuits</h2>
<p>A <strong>static</strong> circuit applies a fixed list of gates and measures at the end. A <strong>dynamic</strong> circuit measures some qubits partway through, sends the results to fast classical logic, and conditions later gates on them. It can also <strong>reset</strong> measured qubits and reuse them. Teleportation ([[L:teleportation]]) is the classic example: Bob’s corrections depend on Alice’s mid-circuit measurements. Error correction is another: every syndrome measurement is mid-circuit, and decoders feed corrections forward. OpenQASM 3 ([[L:optimize]]) has <code>if</code> statements and loops precisely to express such programs.</p>
<h2>The deferred measurement principle</h2>
<p>Any measurement followed by classically controlled gates can be replaced by quantum-controlled gates followed by a measurement at the end, with identical output statistics. So dynamic circuits do not compute anything that static circuits cannot. What they change is the cost: a static replacement may need more qubits, more gates or, crucially, more depth on hardware with limited connectivity.</p>
${LAB('deferred')}
<h2>Constant-depth entanglement</h2>
<p>A GHZ state on ${m('n')} qubits in a line normally takes ${m('n − 1')} sequential CNOTs: depth grows with ${m('n')} because each CNOT must wait for the previous one. With measurements it can be made in constant depth:</p>
<ol>
<li>Put every data qubit in ${m('|+⟩')}, with an ancilla between each neighbouring pair.</li>
<li>Measure the parity ${m('Z<sub>i</sub>Z<sub>i+1</sub>')} of each neighbouring pair through its ancilla. All these measurements happen in parallel.</li>
<li>The state is now ${m('(|x⟩ + |x̄⟩)/√2')}, where the bit string ${m('x')} is fixed by the measured parities. Flip every data qubit whose running parity from the start is odd, giving ${m('(|0…0⟩ + |1…1⟩)/√2')}.</li>
</ol>
<p>The same trick gives constant-depth long-range CNOTs and fan-outs, and more generally lets measurement-based protocols prepare states such as surface-code ground states with depth independent of size. The price is classical: the corrections need the parity of many results, computed and applied within the qubits’ coherence time.</p>
${LAB('ghz')}
<h2>Making it work in hardware</h2>
<ul>
<li><strong>Latency.</strong> Readout, classical decisions and pulse updates must fit in about a microsecond for superconducting qubits. Control systems now include FPGAs placed close to the fridge for this.</li>
<li><strong>Idle qubits.</strong> Qubits not being measured wait during feed-forward; dynamical decoupling pulses protect them.</li>
<li><strong>Crosstalk.</strong> Measuring one qubit can disturb its neighbours through shared resonators or photons, so mid-circuit measurement fidelity is benchmarked separately.</li>
<li><strong>Reuse.</strong> Measuring and resetting qubits mid-circuit lets a computation with many logical steps run on fewer physical qubits.</li>
</ul>
`,
  labs: {
    deferred: {
      title: 'Deferred measurement: two teleportations',
      cap: 'The same teleportation two ways. Top: Alice measures mid-circuit and Bob applies X and Z only if her bits say so. Bottom: the classically controlled gates are replaced by a CNOT and a CZ, and measurements move to the end. Bob’s qubit ends in the same state either way (spheres), and Alice’s outcomes have the same statistics.',
      build(body, id) {
        let th = 1.1, ph = .7, m0 = 0, m1 = 0;
        const c1 = h('div', { class: 'circ-wrap' }), c2 = h('div', { class: 'circ-wrap' }), s1 = canvas('sq', 'max-width:180px;margin:0 auto'), s2 = canvas('sq', 'max-width:180px;margin:0 auto'), s0 = canvas('sq', 'max-width:180px;margin:0 auto');
        const b0 = new BlochView(s0, { labels: 'min', trail: false, drag: false }), b1 = new BlochView(s1, { labels: 'min', trail: false, drag: false }), b2 = new BlochView(s2, { labels: 'min', trail: false, drag: false });
        const ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const prep = () => { const s = new QState(3); s.apply(0, Ry(th)); s.apply(0, Rz(ph)); s.g('H', 1); s.cx(1, 2); s.cx(0, 1); s.g('H', 0); return s; };
        const run = resample => {
          const a = prep(); if (resample) { m0 = a.measure(0); m1 = a.measure(1); } else { a.measure(0, m0 ? 0 : 1); a.measure(1, m1 ? 0 : 1); }
          if (m1) a.g('X', 2); if (m0) a.g('Z', 2);
          const b = prep(); b.cx(1, 2); b.cz(0, 2);
          const pin = new QState(1); pin.apply(0, Ry(th)); pin.apply(0, Rz(ph));
          b0.set(pin.bloch(0)); b1.set(a.bloch(2)); b2.set(b.bloch(2));
          c1.innerHTML = ''; c1.append(drawCircuit(3, [[{ g: 'H', q: 1 }], [{ g: 'CX', c: 1, t: 2 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'H', q: 0 }], [{ g: 'M', q: 0 }, { g: 'M', q: 1 }], [{ g: 'CC', q: 2, from: 1, label: 'X', sup: String(m1) }], [{ g: 'CC', q: 2, from: 0, label: 'Z', sup: String(m0) }]], { labels: ['ψ', 'Alice', 'Bob'], cw: 52 }).svg);
          c2.innerHTML = ''; c2.append(drawCircuit(3, [[{ g: 'H', q: 1 }], [{ g: 'CX', c: 1, t: 2 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'H', q: 0 }], [{ g: 'CX', c: 1, t: 2 }], [{ g: 'CZ', a: 0, b: 2 }], [{ g: 'M', q: 0 }, { g: 'M', q: 1 }]], { labels: ['ψ', 'Alice', 'Bob'], cw: 52 }).svg);
          const pb = b.probs(); let p00 = 0; for (let i = 0; i < 8; i++) if (!(i & 6)) p00 += pb[i];
          ro.innerHTML = `<span class="k">Alice’s bits this run </span>${m0}${m1} &nbsp; <span class="k">P(each outcome), deferred version </span>${pct(p00, 1)}<br><span class="k">distance between Bob’s two states </span>${num(V.norm(V.sub(a.bloch(2), b.bloch(2))), 4)}`;
        };
        body.append(field('Mid-circuit measurement and feed-forward', c1), field('Deferred: quantum-controlled corrections, measure at the end', c2),
          h('div', { class: 'minis' }, h('div', { class: 'mini' }, s0, 'input |ψ⟩'), h('div', { class: 'mini' }, s1, 'Bob, feed-forward'), h('div', { class: 'mini' }, s2, 'Bob, deferred')),
          h('div', { class: 'split even' }, h('div', { class: 'stack' }, slider({ id: id('t'), label: 'Input polar angle', min: 0, max: PI, step: .01, value: th, fmt: v => num(deg(v), 0) + '°', on: v => { th = v; run(false); } }), slider({ id: id('p'), label: 'Input phase', min: -PI, max: PI, step: .01, value: ph, fmt: v => num(deg(v), 0) + '°', on: v => { ph = v; run(false); } })),
            h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Run again (new outcomes)', () => run(true), 'pri sm')), ro)));
        run(true);
      }
    },
    ghz: {
      title: 'A GHZ state in constant depth',
      cap: 'Four data qubits (d) with an ancilla (a) between each pair. After Hadamards, two parallel layers of CNOTs copy each neighbouring parity onto its ancilla, which is measured. Feed-forward X gates, set by the running parity of the results, finish the job. The bars show the four data qubits after a run: always (|0000⟩ + |1111⟩)/√2, whatever the random outcomes. The chart compares depth with the sequential CNOT chain.',
      build(body, id) {
        let ms = [0, 0, 0];
        const circ = h('div', { class: 'circ-wrap' }), bars = h('div'), sb = stateBars(bars, 4, { height: 130 }), ch = canvas('', 'height:200px'), ro = h('div', { class: 'status' });
        const run = () => {
          const s = new QState(7); [0, 2, 4, 6].forEach(q => s.g('H', q));
          for (let i = 0; i < 3; i++) s.cx(2 * i, 2 * i + 1); for (let i = 0; i < 3; i++) s.cx(2 * i + 2, 2 * i + 1);
          ms = [0, 1, 2].map(i => s.measure(2 * i + 1));
          let par = 0; for (let j = 1; j < 4; j++) { par ^= ms[j - 1]; if (par) s.g('X', 2 * j); }
          const re = new Float64Array(16), im = new Float64Array(16);
          for (let i = 0; i < 128; i++) { const anc = [1, 3, 5].map(q => (i >> (6 - q)) & 1); if (anc.some((v, k) => v !== ms[k])) continue; const d = [0, 2, 4, 6].reduce((acc, q) => (acc << 1) | ((i >> (6 - q)) & 1), 0); re[d] = s.re[i]; im[d] = s.im[i]; }
          sb.state(re, im);
          const pre = [0, ms[0], ms[0] ^ ms[1], ms[0] ^ ms[1] ^ ms[2]];
          circ.innerHTML = ''; circ.append(drawCircuit(7, [[0, 2, 4, 6].map(q => ({ g: 'H', q })), [0, 1, 2].map(i => ({ g: 'CX', c: 2 * i, t: 2 * i + 1 })), [0, 1, 2].map(i => ({ g: 'CX', c: 2 * i + 2, t: 2 * i + 1 })), [1, 3, 5].map(q => ({ g: 'M', q })),
            [{ g: 'CC', q: 2, from: 1, label: 'X', sup: String(pre[1]) }], [{ g: 'CC', q: 4, from: 3, label: 'X', sup: String(pre[2]) }], [{ g: 'CC', q: 6, from: 5, label: 'X', sup: String(pre[3]) }]], { labels: ['d₀', 'a₀', 'd₁', 'a₁', 'd₂', 'a₂', 'd₃'], cw: 52, rh: 40 }).svg);
          ro.className = 'status good'; ro.textContent = `Ancilla results ${ms.join(' ')} → running parities ${pre.slice(1).join(' ')}: flip ${pre.slice(1).map((v, k) => v ? 'd' + (k + 1) : '').filter(Boolean).join(', ') || 'nothing'}. Data qubits: (|0000⟩ + |1111⟩)/√2.`;
        };
        const cp = painter(ch, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [2, 64], y: [0, 66], xt: [2, 16, 32, 48, 64], yt: [0, 16, 32, 48, 64], xl: 'GHZ size n', yl: 'circuit depth' });
          polyline(ctx, [[A.X(2), A.Y(2)], [A.X(64), A.Y(64)]], T.cyan, 2.4); polyline(ctx, [[A.X(2), A.Y(5)], [A.X(64), A.Y(5)]], T.copper, 2.4);
        });
        body.append(circ, h('div', { class: 'split' }, h('div', { class: 'stack' }, bars, ro, h('div', { class: 'btns' }, btn('Run again', run, 'pri sm'))), h('div', { class: 'stack' }, ch, legendRow([['CNOT chain: depth n', 'var(--cyan)'], ['measure and feed forward: depth 5', 'var(--copper)']]))));
        run(); cp.inv();
      }
    }
  },
  take: ['Dynamic circuits measure mid-circuit, compute classically and condition later gates on the results; they can also reset and reuse qubits.',
    'The deferred measurement principle says feed-forward can always be replaced by quantum control plus final measurement, so dynamic circuits change costs, not computability.',
    'With parity measurements and feed-forward, GHZ states, fan-out and long-range CNOTs can be made in constant depth on a line.',
    'Practical dynamic circuits need sub-microsecond classical latency, protection of idle qubits and low measurement crosstalk.'],
  quiz: QZ([
    ['What distinguishes a dynamic circuit from a static one?', ['It uses more qubits', 'It measures mid-circuit and conditions later operations on the results (and may reset qubits)', 'It has no measurements', 'It runs backwards'], 1, 'Mid-circuit measurement plus classical feed-forward and reset are the defining features.'],
    ['What does the deferred measurement principle state?', ['Measurements can never be postponed', 'Classically controlled operations after a measurement can be replaced by quantum-controlled ones with the measurement moved to the end, without changing output statistics', 'Measuring early is always better', 'Feed-forward is impossible'], 1, 'Replacing classical control with quantum control and measuring last gives identical statistics, so dynamic circuits do not add computational power.'],
    ['If dynamic circuits add no computational power, why use them?', ['They are easier to draw', 'They can reduce depth, gate count or qubit count, and they are essential for error correction', 'They avoid noise entirely', 'They make measurements reversible'], 1, 'Feed-forward can collapse long sequential chains into constant depth and lets qubits be reused, while QEC relies on repeated mid-circuit syndrome measurement.'],
    ['What depth does a GHZ state on n qubits in a line need with only nearest-neighbour CNOTs and no measurements?', ['Constant', 'Of order n', 'log n', 'n²'], 1, 'Entanglement must propagate along the chain one CNOT at a time, so depth grows linearly in n.'],
    ['In the constant-depth GHZ protocol, what do the ancillas measure?', ['Each data qubit in X', 'The ZZ parity of each neighbouring pair of data qubits', 'Nothing', 'The total magnetization'], 1, 'Two CNOTs from neighbouring data qubits onto an ancilla copy their parity, which a Z measurement reads without revealing individual values.'],
    ['After measuring all neighbouring parities on |+⟩^⊗n, what is the data state?', ['A product state', '(|x⟩ + |x̄⟩)/√2 for a bit string x fixed by the parities', 'The W state', 'A random mixed state'], 1, 'Only the two strings consistent with all parities survive, and they are complements; X corrections then map x to 00…0.'],
    ['Which data qubits get an X correction?', ['All of them', 'Those whose running parity of ancilla results from the start of the chain is odd', 'Only the last one', 'None'], 1, 'The running parity tells whether a qubit’s value differs from the first qubit’s; flipping exactly those yields the standard GHZ state.'],
    ['What is the main hardware challenge for feed-forward in superconducting processors?', ['Lack of qubits', 'Completing readout, classical processing and pulse updates within about a microsecond', 'Too many measurements', 'Cooling the electronics to millikelvin'], 1, 'The decision must arrive well within coherence times, which pushes control logic onto fast FPGAs close to the fridge.'],
    ['Why can mid-circuit measurement reduce the number of qubits a computation needs?', ['It deletes qubits', 'Measured qubits can be reset and reused for later steps', 'It compresses the state', 'It does not'], 1, 'Qubit reuse lets an algorithm with many ancillary steps run on a smaller register.'],
    ['Which language features express dynamic circuits in OpenQASM 3?', ['Only gate definitions', 'Real-time classical control such as if statements and loops conditioned on measurement results', 'Comments', 'Pulse-level calibrations only'], 1, 'OpenQASM 3 added classical control flow precisely so programs can branch on mid-circuit measurement results.']
  ])
});

/* ---------------- QAOA ---------------- */
const GRAPHS = {
  ring: { label: 'Ring of 6', n: 6, e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]] },
  mobius: { label: 'Möbius ladder (8)', n: 8, e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [0, 4], [1, 5], [2, 6], [3, 7]] },
  rand: { label: 'Random graph (7)', n: 7, e: (() => { const r = rng(11), out = []; for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) if (r() < .45) out.push([i, j]); return out; })() },
  tri: { label: 'Two triangles (6)', n: 6, e: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 3], [0, 5]] }
};
const cutTable = G => { const N = 1 << G.n, C = new Float64Array(N); for (let z = 0; z < N; z++) { let c3 = 0; for (const [a, b] of G.e) if (((z >> a) & 1) !== ((z >> b) & 1)) c3++; C[z] = c3; } return C; };
const qaoaState = (G, C, gs, bs) => {
  const n = G.n, N = 1 << n, re = new Float64Array(N).fill(1 / Math.sqrt(N)), im = new Float64Array(N);
  for (let l = 0; l < gs.length; l++) {
    for (let z = 0; z < N; z++) { const a = -gs[l] * C[z], c3 = Math.cos(a), s = Math.sin(a), r = re[z], i = im[z]; re[z] = r * c3 - i * s; im[z] = r * s + i * c3; }
    const c3 = Math.cos(bs[l]), s = Math.sin(bs[l]);
    for (let q = 0; q < n; q++) { const m2 = 1 << q; for (let z = 0; z < N; z++) if (!(z & m2)) { const y = z | m2, ar = re[z], ai = im[z], br = re[y], bi = im[y]; re[z] = c3 * ar + s * bi; im[z] = c3 * ai - s * br; re[y] = c3 * br + s * ai; im[y] = c3 * bi - s * ar; } }
  }
  return { re, im };
};
const expC = (G, C, gs, bs) => { const { re, im } = qaoaState(G, C, gs, bs); let e = 0; for (let z = 0; z < C.length; z++) e += (re[z] ** 2 + im[z] ** 2) * C[z]; return e; };
const optimize = (G, C, gs, bs, iters = 250) => {
  const p = gs.length, x = gs.concat(bs), m = new Array(2 * p).fill(0), v = new Array(2 * p).fill(0), f = y => expC(G, C, y.slice(0, p), y.slice(p));
  for (let t = 1; t <= iters; t++) { const g = x.map((_, k) => { const a = x.slice(), b = x.slice(); a[k] += 1e-4; b[k] -= 1e-4; return (f(a) - f(b)) / 2e-4; }); for (let k = 0; k < 2 * p; k++) { m[k] = .9 * m[k] + .1 * g[k]; v[k] = .999 * v[k] + .001 * g[k] * g[k]; x[k] += .03 * (m[k] / (1 - .9 ** t)) / (Math.sqrt(v[k] / (1 - .999 ** t)) + 1e-9); } }
  return { gs: x.slice(0, p), bs: x.slice(p), e: f(x) };
};
LESSONS.push({
  id: 'qaoa', n: 36.5, stage: VQA, minutes: 16, title: 'QAOA for MaxCut',
  lede: 'The quantum approximate optimization algorithm alternates two simple evolutions and tunes their durations. On graph-cutting problems, its landscape, its depth and its limits can all be seen at once.',
  html: `
<h2>MaxCut as an energy</h2>
<p>Colour the vertices of a graph with two colours so that as many edges as possible join vertices of different colours: <strong>MaxCut</strong>. It is NP-hard in general, and many scheduling, clustering and layout problems reduce to it. Assign a qubit to each vertex; the number of cut edges for a bit string ${m('z')} is the eigenvalue of</p>
${EQ('C = Σ<sub>(i,j) ∈ E</sub> ½ (1 − Z<sub>i</sub>Z<sub>j</sub>)')}
<p>so the best cut is the highest-energy basis state of a diagonal Ising Hamiltonian, as in [[L:adiabatic]].</p>
<h2>The algorithm</h2>
<p>Farhi, Goldstone and Gutmann proposed QAOA in 2014. Start in ${m('|+⟩<sup>⊗n</sup>')}, the uniform superposition of all cuts, and apply ${m('p')} rounds of two evolutions:</p>
${EQ('|γ, β⟩ = e<sup>−iβ<sub>p</sub>B</sup> e<sup>−iγ<sub>p</sub>C</sup> ⋯ e<sup>−iβ₁B</sup> e<sup>−iγ₁C</sup> |+⟩<sup>⊗n</sup>,&nbsp;&nbsp; B = Σ X<sub>i</sub>')}
<p>The cost layer ${m('e<sup>−iγC</sup>')} stamps each bit string with a phase proportional to its cut size, a product of two-qubit ZZ rotations, one per edge. The mixer ${m('e<sup>−iβB</sup>')} rotates every qubit about X, letting those phases interfere. A classical optimizer adjusts the ${m('2p')} angles to maximize ${m('⟨C⟩')}, estimated by sampling. As ${m('p → ∞')}, QAOA can imitate a slow adiabatic sweep and find the optimum; at small ${m('p')} it is a heuristic with a fixed, shallow circuit.</p>
${LAB('landscape')}
<h2>What is known</h2>
<ul>
<li>At ${m('p = 1')} on 3-regular graphs QAOA guarantees an approximation ratio of at least 0.6924. The Goemans–Williamson classical algorithm guarantees 0.878, and under the Unique Games Conjecture no efficient classical algorithm does better.</li>
<li>Optimal angles <strong>concentrate</strong>: for random graphs of a given type they barely depend on the instance, so angles found on small graphs transfer to large ones, avoiding expensive optimization loops.</li>
<li>For large ${m('p')} on some problem classes, QAOA performance has been computed in the limit of infinite size and shown to beat known classical algorithms at depths around 11, but deep circuits on noisy hardware lose this advantage.</li>
<li>Locality limits shallow QAOA: at low depth each qubit only “sees” a small neighbourhood of the graph, and for some graph families this provably prevents it from reaching the best cuts.</li>
</ul>
${LAB('depth')}
${NOTE('Variational optimization, honestly', `<p>QAOA has been run on superconducting, trapped-ion and neutral-atom hardware on graphs with dozens to over a hundred vertices. No experiment has shown it beating the best classical solvers on a practical problem, and classical heuristics remain extremely good at MaxCut. The open question is whether moderately deep, error-corrected QAOA could win on specially structured instances.</p>`)}
`,
  labs: {
    landscape: {
      title: 'The p = 1 landscape',
      cap: 'Left: the expected cut ⟨C⟩ as a fraction of the maximum, for every pair of angles (brighter is better), computed exactly from the state vector. Tap the map to choose angles, or press Optimize to climb from the current point. Right: the graph coloured by the most likely bit string at those angles (cut edges in copper) and the distribution of cut sizes you would sample.',
      build(body, id) {
        let gk = 'mobius', G = GRAPHS[gk], C = cutTable(G), cmax = Math.max(...C), gam = .6, bet = .4, grid = null, img = null, path = [], A0 = null;
        const NGx = 40, NGy = 30, hm = canvas('', 'height:280px'), gc = canvas('sq', 'max-width:260px;margin:0 auto'), dc = canvas('', 'height:150px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const prep = () => { C = cutTable(G); cmax = Math.max(...C); grid = new Float64Array(NGx * NGy); for (let j = 0; j < NGy; j++) for (let i = 0; i < NGx; i++) grid[j * NGx + i] = expC(G, C, [PI * (i + .5) / NGx], [PI / 2 * (1 - (j + .5) / NGy)]) / cmax; img = null; };
        const hp = painter(hm, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, PI], y: [0, PI / 2], xt: [0, PI / 4, PI / 2, 3 * PI / 4, PI], yt: [0, PI / 4, PI / 2], xf: v => num(v / PI, 2) + 'π', yf: v => num(v / PI, 2) + 'π', xl: 'γ (cost angle)', yl: 'β (mixer angle)' }); A0 = A;
          let lo = 1, hi = 0; grid.forEach(v => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
          if (!img) img = heatImage(NGx, NGy, (i, j) => seqRGB((grid[j * NGx + i] - lo) / (hi - lo || 1)));
          drawHeat(ctx, img, A.L + 1, A.T, A.R - A.L - 1, A.B - A.T, true);
          if (path.length > 1) polyline(ctx, path.map(([g2, b2]) => [A.X(g2), A.Y(b2)]), T.ink, 1.6);
          dot(ctx, A.X(gam), A.Y(bet), 6.5, T.copper, T.surface);
        });
        const info = () => { const { re, im } = qaoaState(G, C, [gam], [bet]), P = re.map((r, z) => r * r + im[z] * im[z]); let best = 0; P.forEach((v, z) => { if (v > P[best]) best = z; }); return { P, best }; };
        const gp = painter(gc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), { best } = info(), R = Math.min(w, H) * .38, cx = w / 2, cy = H / 2, pos = k => [cx + R * Math.cos(TAU * k / G.n - PI / 2), cy + R * Math.sin(TAU * k / G.n - PI / 2)];
          for (const [a, b] of G.e) { const cut = ((best >> a) & 1) !== ((best >> b) & 1); ctx.strokeStyle = cut ? T.copper : T.line; ctx.lineWidth = cut ? 3 : 1.5; ctx.beginPath(); ctx.moveTo(...pos(a)); ctx.lineTo(...pos(b)); ctx.stroke(); }
          for (let k = 0; k < G.n; k++) dot(ctx, ...pos(k), 11, (best >> k) & 1 ? T.ink : T.surface, T.ink);
        });
        const dp = painter(dc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), { P } = info(), byCut = new Array(cmax + 1).fill(0); P.forEach((v, z) => { byCut[C[z]] += v; });
          const A = axes(ctx, w, H, { x: [-.5, cmax + .5], y: [0, Math.max(...byCut) * 1.15], xt: [...Array(cmax + 1).keys()].filter(k => cmax < 13 || k % 2 === 0), yt: [0], xl: 'cut size', yl: 'probability', pad: { l: 24 } });
          byCut.forEach((v, k) => { ctx.fillStyle = k === cmax ? T.copper : T.cyan; const bw = (A.R - A.L) / (cmax + 1) * .7; ctx.fillRect(A.X(k) - bw / 2, A.Y(v), bw, A.B - A.Y(v)); });
        });
        const upd = () => {
          const e = expC(G, C, [gam], [bet]), { P } = info(); let pOpt = 0; P.forEach((v, z) => { if (C[z] === cmax) pOpt += v; });
          ro.innerHTML = `<span class="k">γ, β </span>${num(gam / PI, 3)}π, ${num(bet / PI, 3)}π<br><span class="k">⟨C⟩ </span>${num(e, 3)} of max ${cmax} · ratio <b>${num(e / cmax, 3)}</b><br><span class="k">P(sample an optimal cut) </span>${pct(pOpt, 1)} &nbsp; <span class="k">random guess </span>${pct(C.filter(v => v === cmax).length / C.length, 1)}`;
          hp.inv(); gp.inv(); dp.inv();
        };
        hm.addEventListener('click', e => { if (!A0) return; const r = hm.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; if (x < A0.L || x > A0.R || y < A0.T || y > A0.B) return; gam = (x - A0.L) / (A0.R - A0.L) * PI; bet = (A0.B - y) / (A0.B - A0.T) * PI / 2; path = []; upd(); });
        let job = null;
        const opt = () => { if (job) return; path = [[gam, bet]]; let m = [0, 0], v = [0, 0], t = 0; job = Scope.every(30, () => { for (let k = 0; k < 4; k++) { t++; const f = (g2, b2) => expC(G, C, [g2], [b2]), gg = (f(gam + 1e-4, bet) - f(gam - 1e-4, bet)) / 2e-4, gb = (f(gam, bet + 1e-4) - f(gam, bet - 1e-4)) / 2e-4; [gg, gb].forEach((g2, i) => { m[i] = .9 * m[i] + .1 * g2; v[i] = .999 * v[i] + .001 * g2 * g2; }); gam = clamp(gam + .02 * (m[0] / (1 - .9 ** t)) / (Math.sqrt(v[0] / (1 - .999 ** t)) + 1e-9), 0, PI); bet = clamp(bet + .02 * (m[1] / (1 - .9 ** t)) / (Math.sqrt(v[1] / (1 - .999 ** t)) + 1e-9), 0, PI / 2); path.push([gam, bet]); } upd(); if (t > 240) { clearInterval(job); job = null; } }); };
        body.append(h('div', { class: 'btns' }, ...Object.entries(GRAPHS).map(([k, g2]) => btn(g2.label, () => { gk = k; G = g2; prep(); path = []; upd(); }, 'sm')), btn('Optimize', opt, 'pri sm')),
          h('div', { class: 'split' }, hm, h('div', { class: 'stack' }, gc, dc)), ro);
        prep(); upd();
      }
    },
    depth: {
      title: 'Does depth help?',
      cap: 'For the chosen graph, the best approximation ratio found at each depth p. Each depth starts from the previous depth’s optimum stretched to one more layer (the INTERP heuristic) and is refined by gradient ascent. The dashed line is the Goemans–Williamson guarantee of 0.878; the copper dots show the probability of sampling an optimal cut.',
      build(body, id) {
        let gk = 'mobius', res = [];
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), stat = h('div', { class: 'status' });
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [.5, 5.5], y: [0, 1.05], xt: [1, 2, 3, 4, 5], yt: [0, .25, .5, .75, 1], yf: v => num(v, 2), xl: 'depth p', yl: 'ratio / probability' });
          polyline(ctx, [[A.L, A.Y(.878)], [A.R, A.Y(.878)]], T.muted, 1.4, [5, 4]); txt(ctx, 'Goemans–Williamson 0.878', A.R - 4, A.Y(.878) - 9, { align: 'right', font: '600 10px "JetBrains Mono",monospace' });
          if (res.length) { polyline(ctx, res.map((r, k) => [A.X(k + 1), A.Y(r.ratio)]), T.cyan, 2.4); res.forEach((r, k) => { dot(ctx, A.X(k + 1), A.Y(r.ratio), 5, T.cyan, T.surface); dot(ctx, A.X(k + 1), A.Y(r.popt), 4.5, T.copper); }); }
        });
        const run = () => {
          const G = GRAPHS[gk], C = cutTable(G), cmax = Math.max(...C); res = []; stat.className = 'status'; stat.textContent = 'Optimizing…';
          let gs = [.6], bs = [.4], k = 1;
          const step = () => {
            let best = optimize(G, C, gs, bs, 200);
            if (k === 1) for (const [g0, b0] of [[.3, .3], [1.2, .2], [2.4, .9]]) { const r = optimize(G, C, [g0], [b0], 200); if (r.e > best.e) best = r; }
            const { re, im } = qaoaState(G, C, best.gs, best.bs); let po = 0; for (let z = 0; z < C.length; z++) if (C[z] === cmax) po += re[z] ** 2 + im[z] ** 2;
            res.push({ ratio: best.e / cmax, popt: po, gs: best.gs, bs: best.bs }); p.inv();
            ro.innerHTML = res.map((r, i) => `<span class="k">p = ${i + 1} </span>ratio ${num(r.ratio, 3)} · P(optimal) ${pct(r.popt, 1)}`).join('<br>');
            if (k < 5) { const ip = (arr) => { const q = arr.length, out = []; for (let i = 0; i <= q; i++) { const a = i - 1 >= 0 ? arr[i - 1] : 0, b = i < q ? arr[i] : 0; out.push((i / q) * a + ((q - i) / q) * b); } return out; }; gs = ip(best.gs); bs = ip(best.bs); k++; Scope.later(30, step); }
            else { stat.className = 'status good'; stat.textContent = 'Done. Deeper circuits help, at the cost of more parameters and, on hardware, more noise.'; }
          };
          Scope.later(30, step);
        };
        body.append(h('div', { class: 'btns' }, ...Object.entries(GRAPHS).map(([k, g2]) => btn(g2.label, () => { gk = k; run(); }, 'sm'))), h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['best ratio ⟨C⟩/C_max', 'var(--cyan)'], ['P(optimal cut)', 'var(--copper)']])), h('div', { class: 'stack' }, stat, ro)));
        run();
      }
    }
  },
  take: ['MaxCut maps to finding the highest-energy state of C = Σ ½(1 − ZᵢZⱼ), a diagonal Ising Hamiltonian.',
    'QAOA alternates cost evolutions e^(−iγC) and mixer evolutions e^(−iβΣX) from |+⟩^⊗n, with 2p angles tuned classically.',
    'At p = 1 on 3-regular graphs it guarantees 0.6924 versus 0.878 for Goemans–Williamson; optimal angles concentrate and transfer between instances.',
    'Greater depth improves results but locality limits shallow QAOA, and no practical advantage over classical solvers has been shown.'],
  quiz: QZ([
    ['What does the MaxCut cost operator C count for a bit string z?', ['The number of vertices', 'The number of edges whose endpoints have different values', 'The number of 1s', 'The graph diameter'], 1, '½(1 − ZᵢZⱼ) is 1 when qubits i and j differ and 0 otherwise, so the sum counts cut edges.'],
    ['What is the starting state of QAOA?', ['|0…0⟩', '|+⟩^⊗n, the uniform superposition of all bit strings', 'A random state', 'The optimal cut'], 1, 'It is the highest-energy state of the mixer B = ΣXᵢ, matching the adiabatic starting point, and gives every cut equal weight.'],
    ['What does the cost layer e^(−iγC) do?', ['Rotates every qubit about X', 'Applies a phase proportional to each bit string’s cut size, implemented as one ZZ rotation per edge', 'Measures the cut', 'Swaps qubits'], 1, 'C is diagonal, so its exponential only adds phases; each edge contributes a two-qubit ZZ rotation.'],
    ['How many parameters does depth-p QAOA have?', ['p', '2p', 'p²', 'n'], 1, 'Each layer has one cost angle γ and one mixer angle β.'],
    ['What happens as p → ∞?', ['QAOA fails', 'QAOA can approximate an adiabatic evolution and reach the optimum', 'The circuit becomes classical', 'The ratio drops'], 1, 'With many layers and suitable angles, QAOA can mimic a Trotterized slow sweep, inheriting the adiabatic guarantee.'],
    ['What approximation ratio does p = 1 QAOA guarantee on 3-regular graphs?', ['0.5', 'At least 0.6924', '0.878', '1'], 1, 'Farhi and colleagues proved 0.6924, below the 0.878 of the Goemans–Williamson semidefinite-programming algorithm.'],
    ['What does parameter concentration mean for QAOA?', ['Angles are always zero', 'Optimal angles barely change between random instances of the same type, so they can be reused', 'Only one parameter matters', 'Angles grow with n'], 1, 'Because good angles transfer, expensive variational loops can be avoided on large instances.'],
    ['What does the INTERP heuristic do?', ['Randomizes angles', 'Builds depth-(p+1) starting angles by interpolating the optimal depth-p angles', 'Removes layers', 'Interpolates graphs'], 1, 'Optimal QAOA schedules look like smooth curves, so interpolating them gives an excellent starting point at the next depth.'],
    ['Why can low-depth QAOA be limited on some graphs?', ['Because of measurement noise only', 'Locality: at low depth each qubit’s outcome depends only on a small neighbourhood, which provably prevents reaching the best cuts on some families', 'Because it uses too many qubits', 'It is never limited'], 1, 'Light-cone arguments show that shallow QAOA cannot see global structure, and for some graph families this caps its performance.'],
    ['Has QAOA been shown to beat the best classical solvers on a practical problem?', ['Yes, many times', 'No; experiments run, but classical heuristics remain at least as good', 'Only for factoring', 'Only at p = 1'], 1, 'Hardware demonstrations exist, but no convincing practical advantage has been established; classical MaxCut heuristics are very strong.']
  ])
});

/* ---------------- Quantum kernels ---------------- */
const fwht = (re, im, n) => { const N = 1 << n, s = 1 / Math.sqrt(2); for (let len = 1; len < N; len <<= 1) for (let i = 0; i < N; i += len << 1) for (let j = i; j < i + len; j++) { const a = re[j], b = re[j + len], c3 = im[j], d = im[j + len]; re[j] = (a + b) * s; re[j + len] = (a - b) * s; im[j] = (c3 + d) * s; im[j + len] = (c3 - d) * s; } };
const featureState = (x, c3, n) => {
  const N = 1 << n, re = new Float64Array(N).fill(1 / Math.sqrt(N)), im = new Float64Array(N), ph = new Float64Array(N);
  for (let z = 0; z < N; z++) { let a = 0; const s = q => ((z >> q) & 1) ? -1 : 1; for (let i = 0; i < n; i++) { a += c3 * x[i] * s(i); for (let j = i + 1; j < n; j++) a += c3 * c3 * x[i] * x[j] * s(i) * s(j); } ph[z] = a; }
  const stamp = () => { for (let z = 0; z < N; z++) { const cs = Math.cos(ph[z]), sn = Math.sin(ph[z]), r = re[z], i = im[z]; re[z] = r * cs - i * sn; im[z] = r * sn + i * cs; } };
  stamp(); fwht(re, im, n); stamp(); return { re, im };
};
const kern = (a, b) => { let r = 0, i = 0; for (let z = 0; z < a.re.length; z++) { r += a.re[z] * b.re[z] + a.im[z] * b.im[z]; i += a.re[z] * b.im[z] - a.im[z] * b.re[z]; } return r * r + i * i; };
const solve = (A, y) => { const n = y.length, M = A.map((row, i) => row.concat([y[i]])); for (let c3 = 0; c3 < n; c3++) { let p = c3; for (let r = c3 + 1; r < n; r++) if (Math.abs(M[r][c3]) > Math.abs(M[p][c3])) p = r; [M[c3], M[p]] = [M[p], M[c3]]; for (let r = 0; r < n; r++) if (r !== c3) { const f = M[r][c3] / M[c3][c3]; for (let k = c3; k <= n; k++) M[r][k] -= f * M[c3][k]; } } return M.map((row, i) => row[n] / row[i]); };
const DATA = {
  circles: { label: 'Circles', gen: r => { const a = TAU * r(), rad2 = r() < .5 ? .3 + .1 * r() : .75 + .1 * r(); return [[rad2 * Math.cos(a), rad2 * Math.sin(a)], rad2 < .5 ? 1 : -1]; } },
  xor: { label: 'XOR', gen: r => { const x = [2 * r() - 1, 2 * r() - 1]; return [x, x[0] * x[1] > 0 ? 1 : -1]; } },
  moons: { label: 'Moons', gen: r => { const up = r() < .5, t = PI * r(); const x = up ? [Math.cos(t) - .5, Math.sin(t) - .25] : [1 - Math.cos(t) - .5, .25 - Math.sin(t)]; return [[x[0] * .6 + .05 * (r() - .5), x[1] * .9 + .05 * (r() - .5)], up ? 1 : -1]; } }
};
LESSONS.push({
  id: 'kernels', n: 37.5, stage: VQA, minutes: 16, title: 'Quantum kernels and their limits',
  lede: 'Encode data into quantum states and compare them by their overlaps: a quantum kernel. It plugs into well-understood machine learning, and it also shows clearly how quantum feature spaces can become too big to be useful.',
  html: `
<h2>Kernels in one paragraph</h2>
<p>Many classifiers, such as support vector machines and kernel ridge regression, never need the data’s coordinates in a feature space, only the inner products between pairs of feature vectors, collected in a <strong>kernel matrix</strong> ${m('K<sub>ij</sub> = k(x<sub>i</sub>, x<sub>j</sub>)')}. Training reduces to linear algebra on ${m('K')}, a convex problem with no local minima, and the prediction for a new point is a weighted sum ${m('f(x) = Σ<sub>i</sub> α<sub>i</sub> k(x<sub>i</sub>, x)')}.</p>
<h2>A quantum feature map</h2>
<p>Havlíček and colleagues (2019) and Schuld and Killoran (2019) proposed using a quantum circuit ${m('U(x)')} to map data into states ${m('|φ(x)⟩ = U(x)|0⟩')} in a space of dimension ${m('2ⁿ')}, with the kernel</p>
${EQ('k(x, x′) = |⟨φ(x)|φ(x′)⟩|²')}
<p>estimated on hardware by running ${m('U(x′)<sup>†</sup>U(x)')} and counting how often all qubits return 0. A popular choice, the ZZ feature map, alternates Hadamard layers with diagonal phases ${m('exp(i Σ x<sub>i</sub>Z<sub>i</sub> + i Σ x<sub>i</sub>x<sub>j</sub>Z<sub>i</sub>Z<sub>j</sub>)')}. If ${m('k')} is hard to compute classically and suits the data, a quantum kernel could in principle classify better. For a specially constructed problem based on the discrete logarithm, Liu, Arunachalam and Temme (2021) proved a quantum kernel gives a genuine advantage.</p>
${LAB('classify')}
<h2>Exponential concentration</h2>
<p>The same large space is also a trap. For expressive feature maps on many qubits, the states of different inputs are nearly orthogonal, and kernel values ${m('k(x, x′)')} for ${m('x ≠ x′')} concentrate exponentially close to zero. Then ${m('K')} is nearly the identity: every training point looks equally unlike every other, nothing generalizes, and estimating the tiny off-diagonal values to useful precision needs exponentially many shots (Thanasilp, Wang, Cerezo and Holmes, 2022). It is the kernel counterpart of barren plateaus ([[L:qml]]). The standard remedy is a smaller <strong>bandwidth</strong>, scaling the data down so that states stay close, which in turn can make the kernel easy to approximate classically.</p>
${LAB('concentration')}
${NOTE('Where this leaves quantum kernels', `<p>No quantum kernel has been shown to beat well-tuned classical models on a natural, classical dataset. The most promising settings are data that are themselves quantum, such as states produced by a quantum experiment or simulation, where a quantum computer has a native advantage in processing them, and where the theory of learning from quantum data shows exponential separations.</p>`)}
`,
  labs: {
    classify: {
      title: 'A quantum-kernel classifier',
      cap: 'Forty training points (circles and squares) are encoded with a two-qubit ZZ feature map. Kernel ridge regression on the quantum kernel gives the decision boundary (background shading). The kernel matrix, sorted by class, shows the structure the classifier uses: two bright blocks mean same-class points look alike. Raise the bandwidth and watch the boundary fragment and the test accuracy fall as the kernel loses its block structure; lower the shots to see estimation noise.',
      build(body, id) {
        let dk = 'circles', bw = .4, lam = .02, shots = 0, train = [], test = [];
        const pc = canvas('sq', 'max-width:330px;margin:0 auto'), kc = canvas('sq', 'max-width:230px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        let model = null;
        const gen = () => { const r = rng(dk === 'circles' ? 3 : dk === 'xor' ? 5 : 9); const mk = n => { const out = [], c3 = { 1: 0, '-1': 0 }; while (out.length < n) { const [x, y] = DATA[dk].gen(r); if (c3[y] >= n / 2) continue; c3[y]++; out.push({ x, y }); } return out.sort((a, b) => b.y - a.y); }; train = mk(40); test = mk(120); };
        const fit = () => {
          const S = train.map(p => featureState(p.x.map(v => v * PI), bw, 2)), n = train.length, K = [...Array(n)].map(() => new Array(n).fill(0));
          for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { let v = kern(S[i], S[j]); if (shots && i !== j) v = binom(shots, v) / shots; K[i][j] = K[j][i] = v; }
          const al = solve(K.map((row, i) => row.map((v, j) => v + (i === j ? lam : 0))), train.map(p => p.y));
          const f = x => { const s = featureState(x.map(v => v * PI), bw, 2); let o = 0; for (let i = 0; i < n; i++) o += al[i] * kern(S[i], s); return o; };
          model = { K, f, img: null };
          const acc = set => set.filter(p => Math.sign(f(p.x)) === p.y).length / set.length;
          let off = 0, cnt = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { off += K[i][j]; cnt++; }
          ro.innerHTML = `<span class="k">training accuracy </span>${pct(acc(train), 0)} &nbsp; <span class="k">test accuracy </span>${pct(acc(test), 0)}<br><span class="k">mean off-diagonal kernel value </span>${num(off / cnt, 3)}`;
          pp.inv(); kp.inv();
        };
        const pp = painter(pc, ({ ctx, w, h: H }) => {
          if (!model) return; const T = Theme.get(), S = Math.min(w, H), ox = (w - S) / 2, oy = (H - S) / 2, X = v => ox + (v + 1) / 2 * S, Y = v => oy + (1 - (v + 1) / 2) * S;
          if (!model.img) { const NG = 48; model.img = heatImage(NG, NG, (i, j) => { const v = model.f([-1 + 2 * (i + .5) / NG, 1 - 2 * (j + .5) / NG]); return divRGB(clamp(v, -1, 1) * .6); }); }
          drawHeat(ctx, model.img, ox, oy, S, S, true); ctx.strokeStyle = T.line; ctx.strokeRect(ox + .5, oy + .5, S - 1, S - 1);
          for (const p of train) { const x = X(p.x[0]), y = Y(p.x[1]); if (p.y > 0) dot(ctx, x, y, 5, T.cyan, T.surface); else { ctx.fillStyle = T.copper; ctx.fillRect(x - 4.5, y - 4.5, 9, 9); ctx.strokeStyle = T.surface; ctx.lineWidth = 1.5; ctx.strokeRect(x - 4.5, y - 4.5, 9, 9); } }
        });
        const kp = painter(kc, ({ ctx, w, h: H }) => { if (!model) return; const n = model.K.length, S = Math.min(w, H), img = heatImage(n, n, (i, j) => seqRGB(model.K[j][i])); drawHeat(ctx, img, (w - S) / 2, (H - S) / 2, S, S, false); });
        const go = () => { gen(); fit(); };
        body.append(h('div', { class: 'btns' }, seg(Object.entries(DATA).map(([k, d]) => ({ v: k, label: d.label })), dk, v => { dk = v; go(); }, 'Dataset')),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, pc, legendRow([['class +1', 'var(--cyan)'], ['class −1', 'var(--copper)']])), h('div', { class: 'stack' }, field('Kernel matrix (sorted by class)', kc),
            slider({ id: id('b'), label: 'Bandwidth (data scale)', min: .1, max: 3, step: .05, value: bw, fmt: v => num(v, 2), on: v => { bw = v; fit(); } }),
            slider({ id: id('l'), label: 'Regularization λ', min: -3, max: 0, step: .1, value: Math.log10(lam), fmt: v => num(10 ** v, 3), on: v => { lam = 10 ** v; fit(); } }),
            slider({ id: id('s'), label: 'Shots per kernel entry (0 = exact)', min: 0, max: 4, step: .5, value: 0, fmt: v => v ? Math.round(10 ** v).toLocaleString() : 'exact', on: v => { shots = v ? Math.round(10 ** v) : 0; fit(); } }), ro)));
        go();
      }
    },
    concentration: {
      title: 'Kernel values concentrate as qubits are added',
      cap: 'For random inputs, the variance of the kernel value k(x, x′) over many pairs, as the number of qubits grows (logarithmic scale), for an all-to-all ZZ feature map. At full bandwidth the variance falls exponentially: kernel values cluster at 2⁻ⁿ and carry no information. Shrinking the bandwidth slows the collapse. The histogram shows the values for the chosen qubit count.',
      build(body, id) {
        let nsel = 8, bwSmall = .15, curves = null;
        const cv = canvas('', 'height:240px'), hc = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const sample = (n, bw, pairs) => { const r = rng(n * 1000 + Math.round(bw * 100)), vals = []; for (let k = 0; k < pairs; k++) { const a = [...Array(n)].map(() => (2 * r() - 1) * PI), b = [...Array(n)].map(() => (2 * r() - 1) * PI); vals.push(kern(featureState(a, bw, n), featureState(b, bw, n))); } return vals; };
        const stats = v => { const m2 = v.reduce((s, x) => s + x, 0) / v.length; return { mean: m2, vr: v.reduce((s, x) => s + (x - m2) ** 2, 0) / v.length }; };
        const compute = () => { curves = { big: [], small: [], hist: null }; for (let n = 1; n <= 11; n++) { curves.big.push(stats(sample(n, 1, n > 8 ? 60 : 120)).vr); curves.small.push(stats(sample(n, bwSmall, n > 8 ? 60 : 120)).vr); } upd(); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!curves) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 11], y: [1e-8, 1], ylog: true, xt: [1, 3, 5, 7, 9, 11], yt: [1e-8, 1e-6, 1e-4, 1e-2, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'qubits n', yl: 'variance of k' });
          const L = (arr, col) => { const pts = arr.map((v, k) => [A.X(k + 1), A.Y(clamp(v, 1e-8, 1))]); polyline(ctx, pts, col, 2.3); pts.forEach(q => dot(ctx, ...q, 3.5, col)); };
          L(curves.big, T.copper); L(curves.small, T.cyan); polyline(ctx, [[A.X(nsel), A.T], [A.X(nsel), A.B]], T.ink, 1, [3, 3]);
        });
        const hp = painter(hc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), v1 = sample(nsel, 1, 150), v2 = sample(nsel, bwSmall, 150), nb = 30, b1 = new Array(nb).fill(0), b2 = new Array(nb).fill(0);
          v1.forEach(x => { b1[Math.min(nb - 1, Math.floor(x * nb))]++; }); v2.forEach(x => { b2[Math.min(nb - 1, Math.floor(x * nb))]++; });
          const mx = Math.max(...b1, ...b2), A = axes(ctx, w, H, { x: [0, 1], y: [0, mx * 1.1], xt: [0, .25, .5, .75, 1], yt: [0], xl: `kernel value k(x, x′), n = ${nsel}`, yl: 'count' }), bw2 = (A.R - A.L) / nb;
          for (let k = 0; k < nb; k++) { ctx.fillStyle = rgba(T.copper, .7); ctx.fillRect(A.L + k * bw2 + 1, A.Y(b1[k]), bw2 * .45, A.B - A.Y(b1[k])); ctx.fillStyle = rgba(T.cyan, .7); ctx.fillRect(A.L + k * bw2 + bw2 * .5, A.Y(b2[k]), bw2 * .45, A.B - A.Y(b2[k])); }
        });
        const upd = () => { ro.innerHTML = `<span class="k">n = ${nsel}, full bandwidth </span>variance ${sci(curves.big[nsel - 1])}, values near 2⁻ⁿ = ${sci(2 ** -nsel)}<br><span class="k">n = ${nsel}, bandwidth ${bwSmall} </span>variance ${sci(curves.small[nsel - 1])}<br><span class="k">shots to resolve 2⁻ⁿ </span>about ${Math.round(4 ** nsel).toLocaleString()}`; p.inv(); hp.inv(); };
        body.append(h('div', { class: 'split even' }, h('div', { class: 'stack' }, cv, legendRow([['full bandwidth', 'var(--copper)'], ['small bandwidth', 'var(--cyan)']])), hc),
          h('div', { class: 'split even' }, h('div', { class: 'stack' }, slider({ id: id('n'), label: 'Qubits for the histogram', min: 1, max: 11, step: 1, value: nsel, fmt: String, on: v => { nsel = v; upd(); } }),
            slider({ id: id('b'), label: 'Small bandwidth', min: .05, max: .5, step: .05, value: bwSmall, fmt: v => num(v, 2), on: v => { bwSmall = v; compute(); } })), ro));
        Scope.later(60, compute);
      }
    }
  },
  take: ['Kernel methods need only inner products; a quantum kernel uses k(x, x′) = |⟨φ(x)|φ(x′)⟩|² from a feature-map circuit.',
    'Training is convex linear algebra on the kernel matrix; quantum advantage is proven only for specially constructed problems.',
    'Expressive feature maps on many qubits make kernel values concentrate exponentially near zero, so nothing generalizes and shot costs explode.',
    'Smaller bandwidths avoid concentration but can make the kernel classically easy; quantum data are the most promising setting.'],
  quiz: QZ([
    ['What does a kernel method need from the data?', ['Only the labels', 'Only inner products between feature vectors, collected in the kernel matrix', 'Explicit feature coordinates', 'Gradients of a neural network'], 1, 'Training and prediction can be written entirely in terms of k(xᵢ, xⱼ), the kernel trick.'],
    ['How is a quantum kernel value usually estimated on hardware?', ['By state tomography', 'Run U(x′)†U(x) on |0…0⟩ and measure the probability of returning to all zeros', 'By measuring one qubit', 'It cannot be estimated'], 1, 'That probability equals |⟨φ(x′)|φ(x)⟩|², the kernel value; a swap test is an alternative.'],
    ['Why is training a kernel model easier than training a variational circuit?', ['It needs no data', 'Given the kernel matrix, training is a convex problem with no local minima', 'It uses fewer qubits', 'It needs no measurements'], 1, 'Kernel ridge regression and SVMs reduce to convex optimization over the coefficients α.'],
    ['Where has a quantum kernel advantage been proven?', ['On image classification', 'For a specially constructed problem based on the discrete logarithm', 'On all datasets', 'On MNIST'], 1, 'Liu, Arunachalam and Temme built a learning problem that is classically hard under a cryptographic assumption but easy with a quantum kernel.'],
    ['What is exponential concentration of quantum kernels?', ['Kernels become exactly 1', 'For expressive maps on many qubits, off-diagonal kernel values cluster exponentially close to a small constant (near 2⁻ⁿ)', 'Kernels become negative', 'Training becomes faster'], 1, 'Random-like states in a huge space are nearly orthogonal, so their overlaps are tiny and nearly identical.'],
    ['Why does concentration hurt learning?', ['It doesn’t', 'The kernel matrix approaches the identity, so the model cannot relate new points to training data, and estimating the small values needs exponentially many shots', 'It makes the model too smooth', 'It only affects test speed'], 1, 'With all off-diagonal entries ≈ equal, the kernel carries no information, and shot noise swamps what little remains.'],
    ['What does reducing the bandwidth do?', ['Increases concentration', 'Scales inputs down so states stay closer, restoring kernel variance, though possibly making the kernel classically simulable', 'Adds qubits', 'Removes entanglement completely'], 1, 'Smaller data scaling keeps the feature map near the identity, avoiding concentration at the cost of expressivity.'],
    ['How is concentration related to barren plateaus?', ['Unrelated', 'Both stem from states spreading over an exponentially large space, making quantities of interest exponentially small', 'Barren plateaus only affect kernels', 'Concentration is a hardware error'], 1, 'Gradients in variational models and overlaps in kernels both concentrate for highly expressive circuits.'],
    ['In the lab, what does a kernel matrix with two bright diagonal blocks indicate?', ['A broken kernel', 'Points of the same class have larger overlaps than points of different classes, which a classifier can use', 'Random data', 'Concentration'], 1, 'Sorting by class reveals whether the kernel groups same-class points together; a featureless matrix would not.'],
    ['Which setting is considered most promising for quantum machine learning?', ['Classical tabular data', 'Quantum data, such as states produced by quantum experiments or simulations', 'Spreadsheets', 'Text classification'], 1, 'Learning directly from quantum states can give provable exponential advantages, while classical datasets have not shown practical gains.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Gate synthesis', 'Approximating an arbitrary unitary by a sequence of gates from a finite set, such as Clifford+T.', 'synthesis'],
  ['Solovay–Kitaev theorem', 'Any universal gate set closed under inverses can approximate any gate to precision ε with O(log^c(1/ε)) gates.', 'synthesis'],
  ['Matsumoto–Amano normal form', 'The unique canonical form of a single-qubit Clifford+T operator: optional T, then HT or SHT syllables, then a Clifford.', 'synthesis'],
  ['Dynamic circuit', 'A circuit with mid-circuit measurements whose results condition later gates through classical feed-forward.', 'dynamic'],
  ['Deferred measurement principle', 'Measurements followed by classically controlled gates can be replaced by quantum-controlled gates and final measurements without changing statistics.', 'dynamic'],
  ['Feed-forward', 'Using a mid-circuit measurement result to choose later operations in the same run.', 'dynamic'],
  ['QAOA', 'The quantum approximate optimization algorithm: alternating cost and mixer evolutions with classically optimized angles.', 'qaoa'],
  ['MaxCut', 'The problem of dividing a graph’s vertices into two sets to cut as many edges as possible; NP-hard in general.', 'qaoa'],
  ['Approximation ratio', 'The value an algorithm achieves divided by the optimal value, for maximization problems.', 'qaoa'],
  ['Feature map', 'A circuit that encodes classical data x into a quantum state |φ(x)⟩.', 'kernels'],
  ['Exponential concentration', 'The collapse of kernel values (or gradients) towards a constant as qubits are added, making them uninformative and costly to estimate.', 'kernels']
);
})();
