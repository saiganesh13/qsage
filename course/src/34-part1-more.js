/* =====================================================================
   Part I additions: density matrices, qudits, universal gate sets, the swap test,
   entanglement measures, superdense coding, E91 and device-independent QKD
   ===================================================================== */
(() => {
const h2b = p => p <= 1e-15 || p >= 1 - 1e-15 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
const blochOf = (th, ph) => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
const ENS = { z: [[0, 0], [PI, 0]], x: [[PI / 2, 0], [PI / 2, PI]], zx: [[0, 0], [PI / 2, 0]], y: [[PI / 2, PI / 2], [PI / 2, -PI / 2]] };

/* ---------- density matrices ---------- */
LESSONS.push({
  id: 'densitymatrix', n: 4.8, stage: 0, minutes: 14, title: 'Mixed states and the density matrix',
  lede: 'A state vector describes a qubit you know everything about. Real qubits are often uncertain mixtures, or halves of entangled pairs, and need a more general description: the density matrix, which fills in the inside of the Bloch sphere.',
  html: `
<h2>Two kinds of uncertainty</h2>
<p>A qubit in ${m('|+⟩')} gives random results when measured in Z, but it is a definite state: measuring in X always gives +. A qubit that is ${m('|0⟩')} or ${m('|1⟩')} with probability ½ each, because someone flipped a coin while preparing it, also gives random Z results, but no measurement basis makes it predictable. The first is a <strong>pure state</strong> in superposition; the second is a <strong>mixed state</strong>, describing our ignorance about which pure state was prepared.</p>
<h2>The density matrix</h2>
<p>Both are captured by the <strong>density matrix</strong> ${m('ρ = Σ<sub>k</sub> p<sub>k</sub> |ψ<sub>k</sub>⟩⟨ψ<sub>k</sub>|')} for an ensemble in which state ${m('|ψ<sub>k</sub>⟩')} is prepared with probability ${m('p<sub>k</sub>')}. Every measurement probability follows from it: ${m('P(outcome m) = ⟨m|ρ|m⟩')}, and expectation values are ${m('⟨A⟩ = Tr(ρA)')}. For one qubit every density matrix can be written as</p>
${EQ('ρ = ½(I + r<sub>x</sub>X + r<sub>y</sub>Y + r<sub>z</sub>Z), &nbsp;&nbsp; |r| ≤ 1')}
<p>The vector ${m('r')} is the Bloch vector of [[L:bloch]], now allowed inside the sphere: the <strong>Bloch ball</strong>. Pure states sit on the surface, the maximally mixed state ${m('I/2')} at the centre. The <strong>purity</strong> ${m('Tr ρ² = (1 + |r|²)/2')} and the <strong>von Neumann entropy</strong> ${m('S = −Tr ρ log₂ρ')} measure how mixed a state is.</p>
<p>A striking fact: different ensembles can give the same density matrix. Half ${m('|0⟩')} and half ${m('|1⟩')}, or half ${m('|+⟩')} and half ${m('|−⟩')}, are both ${m('I/2')}, and no experiment can tell them apart. The density matrix contains everything observable and nothing more.</p>
<h2>Entanglement makes mixtures too</h2>
<p>If two qubits share the entangled state ${m('cos α|00⟩ + sin α|11⟩')}, the first qubit alone is described by the <strong>reduced density matrix</strong> obtained by the partial trace over the second: ${m('ρ<sub>A</sub> = cos²α |0⟩⟨0| + sin²α |1⟩⟨1|')}. A maximally entangled pair leaves each half maximally mixed, even though the pair as a whole is pure. Noise ([[L:decoherence]]) is entanglement with an environment we do not track, which is why decohering qubits shrink towards the centre of the ball.</p>
${LAB('ball')}
`,
  labs: {
    ball: {
      title: 'Inside the Bloch ball',
      cap: 'Mixture mode: two pure states A and B (dots on the sphere) mixed with probabilities p and 1 − p; the arrow is the resulting Bloch vector, the weighted average. Pick the ensembles {|0⟩, |1⟩} and {|+⟩, |−⟩} at p = ½: different preparations, same point, same density matrix. Entanglement mode: the arrow is one qubit of cos α|00⟩ + sin α|11⟩; it shrinks to the centre as the pair becomes maximally entangled.',
      build(body, id) {
        let mode = 'mix', ens = 'z', p = .5, al = PI / 8;
        const sph = canvas('sq', 'max-width:300px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: false }), mx = h('div', { class: 'readout', style: 'white-space:normal' }), ctl = h('div', { class: 'stack' });
        const upd = () => {
          let r; if (mode === 'mix') { const [a, b] = ENS[ens], va = blochOf(...a), vb = blochOf(...b); r = va.map((x, i) => p * x + (1 - p) * vb[i]); bv.extra = [{ v: va, r: 6, color: Theme.get().copper }, { v: vb, r: 6, color: Theme.get().cyan }]; } else { r = [0, 0, Math.cos(2 * al)]; bv.extra = []; }
          bv.v = r; bv.inv(); const L = Math.hypot(...r), l1 = (1 + L) / 2, l2 = (1 - L) / 2;
          mx.innerHTML = `<span class="k">ρ = </span>[ ${num((1 + r[2]) / 2, 3)} &nbsp; ${cfmt(r[0] / 2, -r[1] / 2, 3)} ;<br>&nbsp;&nbsp;&nbsp;&nbsp; ${cfmt(r[0] / 2, r[1] / 2, 3)} &nbsp; ${num((1 - r[2]) / 2, 3)} ]<br><span class="k">Bloch vector length </span>${num(L, 3)}<br><span class="k">eigenvalues </span>${num(l1, 3)}, ${num(l2, 3)}<br><span class="k">purity Tr ρ² </span>${num((1 + L * L) / 2, 3)} &nbsp; <span class="k">entropy </span>${num(h2b(l1), 3)} bits`;
        };
        const mk = () => { ctl.innerHTML = ''; if (mode === 'mix') ctl.append(field('Ensemble (A, B)', seg([{ v: 'z', label: '|0⟩, |1⟩' }, { v: 'x', label: '|+⟩, |−⟩' }, { v: 'y', label: '|+i⟩, |−i⟩' }, { v: 'zx', label: '|0⟩, |+⟩' }], ens, v => { ens = v; upd(); }, 'Ensemble')), slider({ id: id('p'), label: 'Probability p of state A', min: 0, max: 1, step: .01, value: p, fmt: v => num(v, 2), on: v => { p = v; upd(); } }));
          else ctl.append(slider({ id: id('a'), label: 'Entangling angle α in cos α|00⟩ + sin α|11⟩', min: 0, max: PI / 2, step: .01, value: al, fmt: v => num(deg(v), 0) + '°', on: v => { al = v; upd(); } })); upd(); };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'mix', label: 'Mixture of two states' }, { v: 'ent', label: 'Half of an entangled pair' }], mode, v => { mode = v; mk(); }, 'Mode')), h('div', { class: 'split' }, sph, h('div', { class: 'stack' }, ctl, mx)));
        mk();
      }
    }
  },
  take: ['Pure states are definite (possibly superposed) states; mixed states describe classical uncertainty about which pure state was prepared.',
    'The density matrix ρ = Σ pₖ|ψₖ⟩⟨ψₖ| gives every probability via ⟨m|ρ|m⟩ and expectation values via Tr(ρA).',
    'For one qubit ρ = ½(I + r·σ) with |r| ≤ 1: pure states on the Bloch sphere, mixed states inside, I/2 at the centre.',
    'Different ensembles can share one density matrix; halves of entangled pairs and decohered qubits are mixed.'],
  quiz: QZ([
    ['What distinguishes |+⟩ from a 50/50 mixture of |0⟩ and |1⟩?', ['Nothing', '|+⟩ gives a definite result when measured in X, while the mixture is random in every basis', 'The mixture is pure', '|+⟩ is random in every basis'], 1, 'Superposition is a definite state in some basis; a mixture is genuine ignorance.'],
    ['How is the density matrix of an ensemble defined?', ['As a sum of amplitudes', 'ρ = Σ pₖ |ψₖ⟩⟨ψₖ|', 'As the product of states', 'As the determinant'], 1, 'Each pure state contributes its projector weighted by its probability.'],
    ['How is the probability of outcome m obtained from ρ?', ['From Tr ρ', '⟨m|ρ|m⟩', 'det ρ', 'The largest eigenvalue'], 1, 'For a pure state this reduces to |⟨m|ψ⟩|².'],
    ['Where are mixed single-qubit states on the Bloch picture?', ['On the surface', 'Inside the ball, with Bloch vector length less than 1', 'Outside', 'Only at the poles'], 1, 'The length of the Bloch vector measures purity.'],
    ['What is the maximally mixed qubit state?', ['|0⟩', 'I/2, at the centre of the Bloch ball', '|+⟩', 'Any pure state'], 1, 'It gives probability ½ for every measurement.'],
    ['What is the purity of a single-qubit state with Bloch vector length |r|?', ['|r|', '(1 + |r|²)/2', '1 − |r|', '|r|²'], 1, 'Pure states have purity 1, the maximally mixed state ½.'],
    ['Can two different ensembles have the same density matrix?', ['No, never', 'Yes; for example ½|0⟩⟨0| + ½|1⟩⟨1| = ½|+⟩⟨+| + ½|−⟩⟨−| = I/2', 'Only for pure states', 'Only with three states'], 1, 'No measurement can distinguish them; ρ contains all observable information.'],
    ['What is the reduced state of one qubit of a Bell pair?', ['|0⟩', 'The maximally mixed state I/2', 'A pure superposition', 'Undefined'], 1, 'The pair is pure, but each half alone is completely random.'],
    ['How does decoherence look in the Bloch-ball picture?', ['The vector grows', 'The Bloch vector shrinks towards the centre as the qubit becomes entangled with its environment', 'It rotates only', 'Nothing happens'], 1, 'Untracked entanglement with the environment makes the qubit’s state mixed.'],
    ['What is the von Neumann entropy of a pure state?', ['1', '0', '½', 'log₂ 3'], 1, 'Its density matrix has a single eigenvalue 1; I/2 has entropy 1 bit.']
  ])
});

/* ---------- qudits ---------- */
LESSONS.push({
  id: 'qudits', n: 4.9, stage: 0, minutes: 13, title: 'Qudits: beyond two levels',
  lede: 'Nothing forces quantum information into two levels. A qudit has d of them, carries log₂ d bits of capacity, and has its own versions of the X, Z and Hadamard gates. Several platforms use the extra levels already.',
  html: `
<h2>d levels</h2>
<p>A <strong>qudit</strong> is a quantum system with ${m('d')} basis states ${m('|0⟩, |1⟩, …, |d−1⟩')}: a qutrit for ${m('d = 3')}, a ququart for ${m('d = 4')}. Its state is ${m('Σ<sub>k</sub> a<sub>k</sub>|k⟩')} with ${m('d')} complex amplitudes, and ${m('n')} qudits have ${m('dⁿ')} amplitudes, as much space as ${m('n log₂ d')} qubits. Many physical systems naturally have more than two levels: a transmon’s ladder ([[L:pulses]]), an ion’s Zeeman sublevels, a photon’s orbital angular momentum or time bin.</p>
<h2>Generalized Pauli and Fourier gates</h2>
<p>The qubit X and Z gates generalize to the <strong>shift</strong> and <strong>clock</strong> operators, with ${m('ω = e<sup>2πi/d</sup>')}:</p>
${EQ('X|k⟩ = |k + 1 mod d⟩, &nbsp;&nbsp; Z|k⟩ = ω<sup>k</sup>|k⟩, &nbsp;&nbsp; ZX = ω XZ')}
<p>The Hadamard becomes the quantum Fourier transform on one qudit, ${m('F|j⟩ = (1/√d) Σ<sub>k</sub> ω<sup>jk</sup>|k⟩')} ([[L:qft]]), which maps the eigenstates of ${m('Z')} to those of ${m('X')}. Clifford groups, stabilizer codes and magic states all have qudit versions, and for odd prime ${m('d')} the qudit stabilizer theory is in some ways cleaner than for qubits, with a well-behaved discrete Wigner function whose negativity marks magic.</p>
${LAB('dial')}
<h2>Why bother?</h2>
<ul>
<li><strong>Fewer devices or gates.</strong> Using extra levels can shorten circuits: a Toffoli gate can be built with fewer two-qubit gates by temporarily using a third level of one transmon or ion.</li>
<li><strong>Experiments.</strong> Ringbauer and colleagues (2022) built a universal qudit processor with trapped ions, and superconducting qutrit processors have run algorithms and randomized compiling with three levels ([[L:randcomp]]). High-dimensional photonic entanglement improves noise tolerance in key distribution.</li>
<li><strong>Costs.</strong> More levels mean more ways to err: higher levels decay faster in transmons, control is more complex, and calibration grows with ${m('d²')} transitions.</li>
</ul>
`,
  labs: {
    dial: {
      title: 'A qudit with d levels',
      cap: 'Each dial is one amplitude a_k drawn as a phasor (length = magnitude, angle = phase, colour = phase); the bars are probabilities. X shifts every amplitude one level up (cyclically), Z multiplies level k by ω^k, and F is the d-dimensional Fourier transform. Try F from |0⟩: equal magnitudes with phases 0 everywhere; then Z: the phases wind once around the circle; then F again.',
      build(body, id) {
        let d = 3, re = null, im = null, hist = [];
        const cv = canvas('', 'height:170px'), barsEl = h('div'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), btns = h('div', { class: 'btns' });
        let bars = null;
        const reset = () => { re = new Float64Array(d); im = new Float64Array(d); re[0] = 1; hist = []; barsEl.innerHTML = ''; const e = h('div'); barsEl.append(e); bars = new Bars(e, [...Array(d)].map((_, k) => `|${k}⟩`), { height: 110 }); upd(); };
        const ap = (fn, nm) => { fn(); hist.push(nm); upd(); };
        const X = () => { const r2 = new Float64Array(d), i2 = new Float64Array(d); for (let k = 0; k < d; k++) { r2[(k + 1) % d] = re[k]; i2[(k + 1) % d] = im[k]; } re = r2; im = i2; };
        const Z = () => { for (let k = 0; k < d; k++) { const a = TAU * k / d, c3 = Math.cos(a), s = Math.sin(a), r = re[k] * c3 - im[k] * s; im[k] = re[k] * s + im[k] * c3; re[k] = r; } };
        const F = () => { const r2 = new Float64Array(d), i2 = new Float64Array(d), sc = 1 / Math.sqrt(d); for (let k = 0; k < d; k++) for (let j = 0; j < d; j++) { const a = TAU * j * k / d, c3 = Math.cos(a), s = Math.sin(a); r2[k] += sc * (re[j] * c3 - im[j] * s); i2[k] += sc * (re[j] * s + im[j] * c3); } re = r2; im = i2; };
        const measure = () => { let u = Math.random(), k = 0; for (; k < d - 1; k++) { const p = re[k] ** 2 + im[k] ** 2; if (u < p) break; u -= p; } re = new Float64Array(d); im = new Float64Array(d); re[k] = 1; hist.push(`measured ${k}`); upd(); };
        const p = painter(cv, ({ ctx, w, h: H }) => { if (!re) return; const cw = w / d, R = Math.min(cw * .36, H * .33); for (let k = 0; k < d; k++) drawPhasor(ctx, cw * (k + .5), H / 2 - 6, R, re[k], im[k], `a${'₀₁₂₃₄₅₆₇'[k]}`); });
        const upd = () => { p.inv(); const pr = [...Array(d)].map((_, k) => re[k] ** 2 + im[k] ** 2); bars.set(pr, { colors: pr.map((q, k) => q < 1e-9 ? 'transparent' : phaseColor(Math.atan2(im[k], re[k]))), texts: pr.map(q => q < 5e-4 ? '' : Math.round(q * 100) + '%') }); ro.innerHTML = `<span class="k">d = ${d}: ${num(Math.log2(d), 3)} bits of capacity per qudit</span><br><span class="k">applied </span>${hist.slice(-8).join(' → ') || 'nothing yet'}`; };
        btns.append(btn('X (shift)', () => ap(X, 'X'), 'pri'), btn('Z (clock)', () => ap(Z, 'Z')), btn('F (Fourier)', () => ap(F, 'F')), btn('Measure', measure), btn('Reset', reset, 'sm'));
        body.append(btns, cv, h('div', { class: 'split' }, barsEl, h('div', { class: 'stack' }, slider({ id: id('d'), label: 'Dimension d', min: 2, max: 7, step: 1, value: d, fmt: v => v + (v === 2 ? ' (qubit)' : v === 3 ? ' (qutrit)' : ''), on: v => { d = v; reset(); } }), ro)));
        reset();
      }
    }
  },
  take: ['A qudit has d levels and d complex amplitudes; n qudits span dⁿ states, like n log₂ d qubits.',
    'The shift X|k⟩ = |k+1⟩ and clock Z|k⟩ = ωᵏ|k⟩ generalize the Pauli gates, with ZX = ωXZ; the single-qudit Fourier transform generalizes the Hadamard.',
    'Stabilizer codes, Clifford groups and magic states have qudit versions.',
    'Extra levels can shorten circuits and are used on ions, transmons and photons, at the cost of more error channels and calibration.'],
  quiz: QZ([
    ['How many complex amplitudes describe one qudit of dimension d?', ['2', 'd', 'd²', 'log₂ d'], 1, 'One amplitude per basis state |0⟩ … |d−1⟩.'],
    ['How many qubits have the same state-space dimension as n qudits of dimension d?', ['n', 'n log₂ d', 'nd', 'd'], 1, 'dⁿ = 2^(n log₂ d), so each qudit is worth log₂ d qubits of state space.'],
    ['What does the shift operator X do on a qudit?', ['Multiplies by a phase', 'Maps |k⟩ to |k + 1 mod d⟩', 'Measures the qudit', 'Applies the Fourier transform'], 1, 'It generalizes the qubit bit flip as a cyclic shift.'],
    ['What does the clock operator Z do?', ['Shifts levels', 'Multiplies |k⟩ by ωᵏ with ω = e^(2πi/d)', 'Swaps two levels', 'Nothing'], 1, 'It generalizes the qubit phase flip, which is the case d = 2 (ω = −1).'],
    ['What commutation relation do the generalized Pauli operators satisfy?', ['ZX = XZ', 'ZX = ω XZ', 'ZX = −XZ for all d', 'ZX = 0'], 1, 'For d = 2, ω = −1 and this reduces to the familiar anticommutation ZX = −XZ.'],
    ['What generalizes the Hadamard gate for qudits?', ['The shift', 'The single-qudit quantum Fourier transform F|j⟩ = (1/√d) Σ ω^(jk)|k⟩', 'The identity', 'A CNOT'], 1, 'F maps Z eigenstates to X eigenstates, as H does for qubits.'],
    ['In the lab, what does F do to |0⟩?', ['Nothing', 'Produces an equal superposition with all phases zero', 'Produces |1⟩', 'Measures it'], 1, 'All d amplitudes become 1/√d with zero phase, the qudit analogue of |+⟩.'],
    ['Why can extra levels shorten circuits?', ['They are faster', 'Temporarily storing information in a third level can implement gates like Toffoli with fewer two-qubit operations', 'They remove noise', 'They need no calibration'], 1, 'Qutrit-assisted decompositions have been demonstrated on ions and transmons.'],
    ['Which platform demonstrated a universal qudit processor in 2022?', ['Spin qubits', 'Trapped ions (Ringbauer and colleagues)', 'Neutral atoms only', 'Photonic boson samplers'], 1, 'They used several levels of each ion as a qudit.'],
    ['What is a drawback of using higher levels in transmons?', ['None', 'Higher levels decay faster and add error channels and calibration complexity', 'They cannot be measured', 'They are classical'], 1, 'Energy relaxation rates grow up the ladder.']
  ])
});

/* ---------- universal gate sets ---------- */
const UHm = [[S2, 0], [S2, 0], [S2, 0], [-S2, 0]], UTm = [[1, 0], [0, 0], [0, 0], [S2, S2]], USm = [[1, 0], [0, 0], [0, 0], [0, 1]];
function reachable(gs, L) {
  const nrm = U => { let k = 0; while (C2.abs2(U[k]) < 1e-12) k++; const a = U[k], r = Math.hypot(a[0], a[1]), ph = [a[0] / r, -a[1] / r]; return U.map(z => C2.mul(z, ph)); };
  const key = U => nrm(U).map(z => z.map(v => (Math.round(v * 1e5) / 1e5 + 0).toFixed(4)).join(',')).join(';');
  const I2 = [[1, 0], [0, 0], [0, 0], [1, 0]]; let fr = [I2]; const seen = new Set([key(I2)]), byLen = [[I2]];
  for (let l = 1; l <= L; l++) { const nf = []; for (const U of fr) for (const g of gs) { const M = C2.mm(g, U), k = key(M); if (!seen.has(k)) { seen.add(k); nf.push(M); } } fr = nf; byLen.push(nf); if (seen.size > 60000) break; }
  return byLen;
}
LESSONS.push({
  id: 'universal', n: 7.4, stage: 1, minutes: 14, title: 'Universal gate sets',
  lede: 'A quantum computer offers only a handful of gates, yet it can run any computation. A gate set is universal when its combinations come arbitrarily close to every unitary. Some natural sets fall short, and the reason why is one of the deepest facts in the field.',
  html: `
<h2>What universality means</h2>
<p>There are infinitely many unitaries, but a computer can only offer finitely many gates. A gate set is <strong>universal</strong> if products of its gates approximate every unitary on any number of qubits to any desired accuracy. Two results make this manageable:</p>
<ul>
<li>Any multi-qubit unitary can be built exactly from <strong>single-qubit gates and CNOT</strong> (Barenco and colleagues, 1995). So it is enough to handle single-qubit rotations well and to have one entangling gate.</li>
<li>For single qubits, two gates that generate rotations about different axes by angles that are irrational multiples of π produce a dense set of rotations. <strong>H and T</strong> do exactly this: products such as ${m('HTHT†')} are rotations by angles irrational in units of π, so their powers fill out every axis and angle.</li>
</ul>
<p>The <strong>Solovay–Kitaev theorem</strong> then guarantees that approximation is efficient: precision ${m('ε')} needs only ${m('O(log<sup>c</sup>(1/ε))')} gates, so a universal set can stand in for any other with modest overhead ([[L:synthesis]]).</p>
<h2>Sets that are not universal</h2>
<p>The <strong>Clifford group</strong>, generated by H, S and CNOT, is the most important near miss. It generates only finitely many single-qubit operations, 24 up to phase, mapping the six cardinal states among themselves, and the Gottesman–Knill theorem shows Clifford circuits are classically simulable ([[L:stabsim]]). Adding any non-Clifford gate, such as T, makes the set universal. Likewise <strong>Toffoli alone</strong> is universal only for reversible classical computation ([[L:toffoli]]), but <strong>Toffoli plus Hadamard</strong> is universal for quantum computation (Shi, 2003; Aharonov, 2003), even though both have only real entries: complex amplitudes are a convenience, not a necessity.</p>
${LAB('cover')}
<h2>Why it matters for hardware</h2>
<p>Every platform chooses a native gate set ([[L:stack]]) and proves it universal, usually as arbitrary single-qubit rotations plus one entangling gate. Error-corrected machines are restricted to discrete sets like Clifford+T, so the Clifford/non-Clifford divide becomes a cost divide: Clifford gates are cheap, and the non-Clifford T gates, which provide universality, need magic states ([[L:magic]]).</p>
`,
  labs: {
    cover: {
      title: 'Which states can a gate set reach?',
      cap: 'Starting from |0⟩, every product of up to L gates from the chosen set is applied and the resulting states are plotted on the Bloch sphere (newer lengths in brighter colours). H and S reach only the six cardinal states, however long the words: the Clifford group is finite. Adding T, the points multiply and spread to cover the whole sphere. The chart shows the worst-case angular distance from 300 random target states to the nearest reachable state.',
      build(body, id) {
        let set = 'ht', L = 10, R = null;
        const sph = canvas('sq', 'max-width:320px;margin:0 auto'), bv = new BlochView(sph, { labels: 'min', trail: false }), cv = canvas('', 'height:220px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const gates = () => set === 'ht' ? [UHm, UTm] : set === 'hs' ? [UHm, USm] : [UHm, USm, UTm];
        const targets = (() => { const r = rng(5), out = []; for (let i = 0; i < 300; i++) { const z = 2 * r() - 1, a = TAU * r(), s = Math.sqrt(1 - z * z); out.push([s * Math.cos(a), s * Math.sin(a), z]); } return out; })();
        let cover = [];
        const compute = () => {
          const byLen = reachable(gates(), 16); R = byLen; cover = [];
          const bestDot = targets.map(() => -1), ks = new Set(); let count = 0;
          for (let l = 0; l < byLen.length; l++) { for (const U of byLen[l]) { const v = C2.bloch0(U), k = v.map(x => x.toFixed(3)).join(','); if (ks.has(k)) continue; ks.add(k); count++; targets.forEach((t, i) => { const d = v[0] * t[0] + v[1] * t[1] + v[2] * t[2]; if (d > bestDot[i]) bestDot[i] = d; }); } cover.push([l, Math.acos(clamp(Math.min(...bestDot), -1, 1)), count]); }
          while (cover.length < 17) { const last = cover[cover.length - 1]; cover.push([cover.length, last[1], last[2]]); }
          upd();
        };
        const upd = () => { const T = Theme.get(), pts = [], ks = new Set(); for (let l = 0; l <= Math.min(L, R.length - 1); l++) for (const U of R[l]) { const v = C2.bloch0(U), k = v.map(x => x.toFixed(3)).join(','); if (ks.has(k)) continue; ks.add(k); pts.push({ v, r: 2.2, color: rgba(l === Math.min(L, R.length - 1) ? T.copper : T.cyan, .4 + .6 * l / Math.max(1, L)) }); } const stride = Math.max(1, Math.ceil(pts.length / 4000)); bv.extra = pts.filter((_, i) => i % stride === 0); bv.v = [0, 0, 1]; bv.inv(); q.inv(); const c3 = cover[Math.min(L, cover.length - 1)]; ro.innerHTML = `<span class="k">gate set </span>${set === 'ht' ? '{H, T}' : set === 'hs' ? '{H, S} (Clifford)' : '{H, S, T}'}<br><span class="k">distinct states reached with ≤ ${L} gates </span>${pts.length.toLocaleString('en-US')}<br><span class="k">worst-case distance to a target </span>${num(deg(c3[1]), 1)}°`; };
        const q = painter(cv, ({ ctx, w, h: H }) => { if (!cover.length) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 16], y: [0, 100], xt: [0, 4, 8, 12, 16], yt: [0, 25, 50, 75, 100], yf: v => v + '°', xl: 'maximum word length L', yl: 'worst-case distance' }); polyline(ctx, cover.map(([l, a]) => [A.X(l), A.Y(Math.min(100, deg(a)))]), T.copper, 2.4); const c3 = cover[Math.min(L, cover.length - 1)]; dot(ctx, A.X(c3[0]), A.Y(Math.min(100, deg(c3[1]))), 6, T.ink, T.surface); });
        body.append(h('div', { class: 'btns' }, seg([{ v: 'ht', label: '{H, T}' }, { v: 'hs', label: '{H, S}: Clifford' }, { v: 'hst', label: '{H, S, T}' }], set, v => { set = v; compute(); }, 'Gate set')),
          h('div', { class: 'split' }, sph, h('div', { class: 'stack' }, cv, slider({ id: id('l'), label: 'Words of length up to L', min: 0, max: 16, step: 1, value: L, fmt: String, on: v => { L = v; upd(); } }), ro)));
        compute();
      }
    }
  },
  take: ['A gate set is universal if its products approximate every unitary to arbitrary accuracy.',
    'Single-qubit gates plus CNOT are exactly universal; H and T generate a dense set of single-qubit rotations.',
    'The Clifford group (H, S, CNOT) is finite on one qubit and classically simulable; adding T or any non-Clifford gate restores universality.',
    'Solovay–Kitaev makes approximation efficient; Toffoli plus Hadamard is universal using only real gates.'],
  quiz: QZ([
    ['What does it mean for a gate set to be universal?', ['It contains every gate', 'Products of its gates approximate any unitary to arbitrary accuracy', 'It has exactly two gates', 'It is classically simulable'], 1, 'Exact universality is impossible with finitely many gates; approximation suffices.'],
    ['Which combination is exactly universal for multi-qubit unitaries?', ['CNOT alone', 'All single-qubit gates plus CNOT', 'H alone', 'Toffoli alone'], 1, 'Barenco and colleagues showed any unitary decomposes into these.'],
    ['Why do H and T together give a dense set of single-qubit rotations?', ['They commute', 'Some of their products are rotations by angles that are irrational multiples of π, whose powers fill all angles', 'T is a Hadamard', 'They are both Clifford'], 1, 'Irrational rotation angles never repeat, covering the circle densely.'],
    ['How many distinct single-qubit Clifford operations are there, up to phase?', ['Infinitely many', '24', '6', '2'], 1, 'They are the rotations of a cube (or octahedron) permuting the six cardinal states.'],
    ['In the lab, why does {H, S} reach only six states?', ['The simulation stops early', 'Clifford gates map the six cardinal states among themselves, so no new states ever appear', 'S is the identity', 'Because L is too small'], 1, 'The Clifford group is finite: its 24 single-qubit elements only permute the six cardinal states.'],
    ['What makes the Clifford group classically simulable?', ['It is small', 'The Gottesman–Knill theorem: stabilizer states can be tracked efficiently under Clifford gates and Pauli measurements', 'It has no entanglement', 'It uses only real numbers'], 1, 'This is why a non-Clifford gate is essential for quantum advantage.'],
    ['What does the Solovay–Kitaev theorem guarantee?', ['Exact synthesis', 'Approximation to precision ε with O(log^c(1/ε)) gates from any universal set closed under inverses', 'That T gates are free', 'That CNOT is universal alone'], 1, 'It makes the choice of universal set a matter of modest overhead.'],
    ['Is Toffoli plus Hadamard universal?', ['No', 'Yes, for quantum computation, even though both gates have only real entries', 'Only for classical computation', 'Only with T'], 1, 'Real amplitudes suffice for universality with one extra qubit.'],
    ['Why is the Clifford/non-Clifford divide important for error-corrected machines?', ['It is not', 'Clifford gates are cheap in common codes, while non-Clifford gates like T need costly magic states', 'Non-Clifford gates are free', 'Codes cannot do Clifford gates'], 1, 'T count dominates fault-tolerant costs, because every T gate needs a distilled or cultivated magic state.'],
    ['What happens to the coverage of the sphere with {H, T} as L grows?', ['It stays the same', 'The number of reachable states grows exponentially and the worst-case distance to any target shrinks', 'It oscillates', 'It becomes six points'], 1, 'Density follows from universality, and efficiency from Solovay–Kitaev.']
  ])
});

/* ---------- swap test ---------- */
LESSONS.push({
  id: 'swaptest', n: 7.7, stage: 1, minutes: 13, title: 'The swap test: comparing quantum states',
  lede: 'You cannot look at two unknown quantum states and compare them. But one ancilla qubit, two Hadamards and a controlled swap estimate how similar they are, a primitive used from quantum fingerprinting to quantum machine learning.',
  html: `
<h2>The circuit</h2>
<p>Given two unknown states ${m('|ψ⟩')} and ${m('|φ⟩')}, prepare an ancilla in ${m('|0⟩')}, apply a Hadamard to it, swap the two registers controlled by the ancilla (a <strong>Fredkin</strong> gate), apply another Hadamard and measure the ancilla. Working through the algebra,</p>
${EQ('P(ancilla = 0) = ½ + ½ |⟨ψ|φ⟩|²')}
<p>Identical states always give 0; orthogonal states give 0 or 1 with equal probability. Repeating the test on fresh copies estimates the overlap ${m('|⟨ψ|φ⟩|²')}, with statistical error falling as ${m('1/√N')} over ${m('N')} copies ([[L:measurement]]). The test works for registers of any size, and it uses up its inputs: each run consumes one copy of each state.</p>
<p>Why does it work? The controlled swap entangles the ancilla with whether the two registers are exchanged. If the joint state is symmetric under exchange (identical states), the two branches interfere constructively and the ancilla returns to ${m('|0⟩')}; any antisymmetric part sends it to ${m('|1⟩')}.</p>
${LAB('swap')}
<h2>Uses</h2>
<ul>
<li><strong>Quantum fingerprinting</strong> (Buhrman, Cleve, Watrous and de Wolf, 2001): two parties can test whether their ${m('n')}-bit strings are equal by sending a referee quantum fingerprints of only ${m('O(log n)')} qubits, exponentially less than classically possible without shared randomness. The referee runs swap tests.</li>
<li><strong>Machine learning</strong>: overlaps are kernel values ([[L:kernels]], [[L:qsvm]]), and swap tests measure them when states cannot be easily inverted.</li>
<li><strong>Purity and entanglement</strong>: a swap test on two copies of ρ measures ${m('Tr ρ²')}, and on subsystems of two copies it measures Rényi entropies of entanglement, as done in ion and atom experiments ([[L:lightcone]]). A destructive variant, measuring both registers in the Bell basis, needs no ancilla.</li>
</ul>
`,
  labs: {
    swap: {
      title: 'Estimate an overlap with the swap test',
      cap: 'Set the two single-qubit states (left: ψ in copper, φ in cyan on one Bloch sphere). The exact overlap |⟨ψ|φ⟩|² = (1 + cos γ)/2 for the angle γ between their Bloch vectors. Each run measures the ancilla; the estimate is 2·P(0) − 1, shown converging as runs accumulate (shaded band: ±1 standard deviation).',
      build(body, id) {
        let t1 = .4, p1 = 0, t2 = 1.6, p2 = .8, runs = [], target = 0;
        const sph = canvas('sq', 'max-width:280px;margin:0 auto'), bv = new BlochView(sph, { labels: 'min', trail: false }), cv = canvas('', 'height:220px'), circ = h('div', { class: 'circ-wrap' }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        { const D = drawCircuit(3, [[{ g: 'H', q: 0 }], [{ g: 'SW', a: 1, b: 2 }], [{ g: 'H', q: 0 }], [{ g: 'M', q: 0 }]], { labels: ['anc', 'ψ', 'φ'], cw: 52 }), x = D.X(1); D.svg.append(sv('line', { x1: x, y1: D.Y(0), x2: x, y2: D.Y(1), class: 'c-line' }), sv('circle', { cx: x, cy: D.Y(0), r: 5.5, class: 'c-dot' })); circ.append(D.svg); }
        const ov = () => { const a = blochOf(t1, p1), b = blochOf(t2, p2); return (1 + a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / 2; };
        const reset = () => { runs = []; target = ov(); const a = blochOf(t1, p1), b = blochOf(t2, p2); bv.v = a; bv.target = b; bv.extra = [{ v: b, r: 6, color: Theme.get().cyan }]; bv.inv(); q.inv(); text(); };
        const run = k => { const p0 = .5 + .5 * target; for (let i = 0; i < k; i++) runs.push(Math.random() < p0 ? 0 : 1); q.inv(); text(); };
        const q = painter(cv, ({ ctx, w, h: H }) => { const T = Theme.get(), N = Math.max(10, runs.length), A = axes(ctx, w, H, { x: [1, N], y: [-.1, 1.1], xlog: true, xt: [1, 10, 100, 1000, 10000].filter(v => v <= N), yt: [0, .5, 1], xf: v => String(v), xl: 'runs', yl: 'estimated overlap' });
          const band = []; for (let n = 1; n <= N; n *= 1.05) { const sd = Math.sqrt(Math.max(0, 1 - target * target)) / Math.sqrt(n); band.push([n, Math.min(1.1, target + sd), Math.max(-.1, target - sd)]); }
          ctx.fillStyle = rgba(T.cyan, .15); ctx.beginPath(); band.forEach(([n, u], i) => i ? ctx.lineTo(A.X(n), A.Y(u)) : ctx.moveTo(A.X(n), A.Y(u))); for (let i = band.length - 1; i >= 0; i--) ctx.lineTo(A.X(band[i][0]), A.Y(band[i][2])); ctx.closePath(); ctx.fill();
          ctx.setLineDash([5, 4]); ctx.strokeStyle = T.ink; ctx.beginPath(); ctx.moveTo(A.L, A.Y(target)); ctx.lineTo(A.R, A.Y(target)); ctx.stroke(); ctx.setLineDash([]);
          let z = 0; const pts = []; runs.forEach((r, i) => { if (!r) z++; const n = i + 1; if (n < 50 || n % Math.ceil(n / 200) === 0) pts.push([A.X(n), A.Y(clamp(2 * z / n - 1, -.1, 1.1))]); }); polyline(ctx, pts, T.copper, 2); });
        const text = () => { const n = runs.length, z = runs.filter(r => !r).length; ro.innerHTML = `<span class="k">exact overlap |⟨ψ|φ⟩|² </span>${num(target, 4)}<br><span class="k">P(ancilla = 0) </span>${num(.5 + .5 * target, 4)}<br><span class="k">runs </span>${n.toLocaleString('en-US')} &nbsp; <span class="k">estimate </span>${n ? num(2 * z / n - 1, 4) : '—'}`; };
        const sl = (k, label, max, val, set) => slider({ id: id(k), label, min: 0, max, step: .01, value: val, fmt: v => num(deg(v), 0) + '°', on: v => { set(v); reset(); } });
        body.append(circ, h('div', { class: 'split' }, h('div', { class: 'stack' }, sph, sl('t1', 'ψ polar angle', PI, t1, v => t1 = v), sl('p1', 'ψ azimuth', TAU, p1, v => p1 = v), sl('t2', 'φ polar angle', PI, t2, v => t2 = v), sl('p2', 'φ azimuth', TAU, p2, v => p2 = v)),
          h('div', { class: 'stack' }, cv, h('div', { class: 'btns' }, btn('Run 10', () => run(10), 'sm'), btn('Run 1,000', () => run(1000), 'pri'), btn('Clear', reset, 'sm')), ro)));
        reset();
      }
    }
  },
  take: ['The swap test uses an ancilla, two Hadamards and a controlled swap; P(0) = ½ + ½|⟨ψ|φ⟩|².',
    'Repeating it on fresh copies estimates the overlap with error falling as 1/√N; it consumes its inputs.',
    'Symmetric (identical) inputs always return 0; antisymmetric components send the ancilla to 1.',
    'It underlies quantum fingerprinting, kernel estimation, and measurements of purity and Rényi entanglement entropy.'],
  quiz: QZ([
    ['What does the swap test measure?', ['The phase of a state', 'The overlap |⟨ψ|φ⟩|² of two unknown states', 'The energy', 'The number of qubits'], 1, 'It compares states without measuring either one in a basis.'],
    ['What is P(ancilla = 0) in the swap test?', ['|⟨ψ|φ⟩|²', '½ + ½|⟨ψ|φ⟩|²', '½', '1 − |⟨ψ|φ⟩|²'], 1, 'Identical states give 1; orthogonal states give ½.'],
    ['What gate is at the heart of the swap test?', ['CNOT', 'A controlled swap (Fredkin) gate between the two registers', 'T', 'Toffoli'], 1, 'The ancilla controls whether the registers are exchanged.'],
    ['What happens for two identical states?', ['Random outcomes', 'The ancilla always returns 0', 'The ancilla always gives 1', 'The states are destroyed with no result'], 1, 'The joint state is symmetric, so the two branches interfere constructively.'],
    ['How does the error of the overlap estimate scale with N runs?', ['1/N', '1/√N', 'Exponentially', 'It is exact after one run'], 1, 'Each run is a Bernoulli trial, so standard statistics apply.'],
    ['Why does each run need fresh copies of the states?', ['It does not', 'The test entangles and measures, disturbing the inputs, and no-cloning prevents copying them', 'The ancilla is reused', 'For speed'], 1, 'Unknown states cannot be duplicated, so copies must be supplied.'],
    ['What is quantum fingerprinting?', ['Biometric security', 'Testing equality of n-bit strings by sending O(log n)-qubit fingerprints to a referee, who uses swap tests', 'A hardware calibration', 'A decoding algorithm'], 1, 'It gives an exponential communication saving in the simultaneous-message model without shared randomness.'],
    ['How can the swap test measure purity?', ['It cannot', 'On two copies of ρ, it estimates Tr ρ², since P(0) = ½ + ½ Tr ρ²', 'By measuring ρ once', 'By tomography only'], 1, 'For mixed inputs the overlap generalizes to Tr(ρσ).'],
    ['How is the swap test used in quantum machine learning?', ['To train classical networks', 'To estimate overlaps between encoded data states, which are kernel values', 'To store data', 'To remove noise'], 1, 'It complements the compute-uncompute method of kernel estimation.'],
    ['What is the destructive swap test?', ['A broken test', 'A variant that measures both registers in the Bell basis and computes the overlap classically, without an ancilla', 'A test that destroys the ancilla only', 'A test with three registers'], 1, 'It is easier on hardware without controlled swaps.']
  ])
});

/* ---------- entanglement measures ---------- */
function twoQubitState(al, p) { const v = [Math.cos(al), 0, 0, Math.sin(al)], rho = new Float64Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) rho[i * 4 + j] = p * v[i] * v[j] + (i === j ? (1 - p) / 4 : 0); return rho; }
function negativity(rho) { const pt = new Float64Array(16); for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c3 = 0; c3 < 2; c3++) for (let d = 0; d < 2; d++) pt[(a * 2 + d) * 4 + (c3 * 2 + b)] = rho[(a * 2 + b) * 4 + (c3 * 2 + d)]; const w = eigSym(pt, 4); return w.reduce((s, x) => s + (x < 0 ? -x : 0), 0); }
function chshMax(rho) { const P = [[[0, 1], [1, 0]], null, [[1, 0], [0, -1]]]; /* real states: correlations in x and z only, plus yy */ const T = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; const pm = (i, j) => { const sx = [[0, 1], [1, 0]], sz = [[1, 0], [0, -1]], sy = [[0, -1], [1, 0]]; const A = [sx, sy, sz][i], B = [sx, sy, sz][j]; let s = 0; for (let r = 0; r < 4; r++) for (let c3 = 0; c3 < 4; c3++) { const op = A[r >> 1][c3 >> 1] * B[r & 1][c3 & 1]; s += rho[c3 * 4 + r] * op; } return (i === 1) !== (j === 1) ? 0 : (i === 1 ? -s : s); }; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) T[i][j] = pm(i, j); const M = new Float64Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += T[k][i] * T[k][j]; M[i * 3 + j] = s; } const w = eigSym(M, 3).sort((a, b) => b - a); return 2 * Math.sqrt(Math.max(0, w[0] + w[1])); }
LESSONS.push({
  id: 'measures', n: 8.7, stage: 2, minutes: 15, title: 'Measuring entanglement',
  lede: 'How entangled is a state? For pure states there is one natural answer. For mixed states there are several, and they disagree in revealing ways: some entangled states cannot violate any Bell inequality, and some cannot be distilled into Bell pairs at all.',
  html: `
<h2>Pure states: entanglement entropy</h2>
<p>For a pure state of two parties, the <strong>entanglement entropy</strong> is the von Neumann entropy of either half, ${m('E = S(ρ<sub>A</sub>)')} ([[L:densitymatrix]]). For ${m('cos α|00⟩ + sin α|11⟩')} it is ${m('h(cos²α)')}, from 0 for a product state to 1 ebit for a Bell state. It has an operational meaning: ${m('n')} copies can be converted into about ${m('nE')} Bell pairs and back by local operations and classical communication (LOCC), so ${m('E')} counts Bell pairs, the currency of teleportation ([[L:teleportation]]).</p>
<h2>Mixed states: several measures</h2>
<p>Mixed states are harder: a mixture of entangled states can be separable, a convex combination of product states. Useful quantities for two qubits include</p>
<ul>
<li><strong>Concurrence</strong> ${m('C')} (Wootters, 1998), computed in closed form, from which the <strong>entanglement of formation</strong> ${m('E<sub>F</sub> = h((1 + √(1 − C²))/2)')} follows: the Bell pairs needed to create the state.</li>
<li><strong>Negativity</strong> ${m('N')}: the sum of the magnitudes of the negative eigenvalues of the <strong>partial transpose</strong> ${m('ρ<sup>T<sub>B</sub></sup>')}. Peres and the Horodeckis showed that for two qubits (and qubit–qutrit) the state is entangled exactly when the partial transpose has a negative eigenvalue.</li>
<li><strong>Bell violation</strong>: the largest CHSH value ([[L:entanglement]]) the state can reach, ${m('2√(t₁² + t₂²)')} from its two largest correlation singular values (Horodecki criterion).</li>
</ul>
${LAB('werner')}
<h2>Surprises</h2>
<ul>
<li><strong>Entangled but local.</strong> Werner (1989) found entangled states whose measurement statistics can be reproduced by local hidden variables. In the lab, Werner states with ${m('1/3 < p ≤ 1/√2')} are entangled yet cannot violate CHSH.</li>
<li><strong>Bound entanglement.</strong> In higher dimensions there are entangled states with positive partial transpose from which no Bell pairs can be distilled at all (Horodecki, 1998).</li>
<li><strong>Distillation.</strong> For two qubits every entangled state can be distilled; purification protocols ([[L:purification]]) do exactly this, and the asymptotic rate is the <strong>distillable entanglement</strong>, generally smaller than the entanglement of formation.</li>
</ul>
`,
  labs: {
    werner: {
      title: 'Entanglement of a noisy pair',
      cap: 'The state is p|ψ(α)⟩⟨ψ(α)| + (1 − p)I/4, with |ψ(α)⟩ = cos α|00⟩ + sin α|11⟩: a pure state mixed with white noise (for α = 45° this is the Werner state). Curves against p: concurrence, entanglement of formation, twice the negativity, and the maximal CHSH value divided by 2 (above 1 means a Bell violation). Entanglement appears where the concurrence leaves zero; Bell violation needs more.',
      build(body, id) {
        let al = PI / 4, p = .6;
        const cv = canvas('', 'height:270px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const meas = (a, pp) => { const rho = twoQubitState(a, pp), C = concurrenceReal(rho); return { C, EF: h2b((1 + Math.sqrt(Math.max(0, 1 - C * C))) / 2), N: negativity(rho), S: chshMax(rho) }; };
        const q = painter(cv, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 1], y: [0, 1.5], xt: [0, .25, .5, .75, 1], yt: [0, .5, 1, 1.5], xl: 'mixing weight p of the pure state', yl: 'measure' });
          ctx.setLineDash([3, 3]); ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.moveTo(A.L, A.Y(1)); ctx.lineTo(A.R, A.Y(1)); ctx.stroke(); ctx.setLineDash([]); txt(ctx, 'CHSH = 2 (classical limit)', A.L + 6, A.Y(1) - 8, { align: 'left', font: '500 10px "JetBrains Mono",monospace' });
          const lines = { C: [], EF: [], N: [], S: [] }; for (let x = 0; x <= 1.0001; x += .01) { const m_ = meas(al, x); lines.C.push([A.X(x), A.Y(m_.C)]); lines.EF.push([A.X(x), A.Y(m_.EF)]); lines.N.push([A.X(x), A.Y(2 * m_.N)]); lines.S.push([A.X(x), A.Y(m_.S / 2)]); }
          polyline(ctx, lines.C, T.copper, 2.4); polyline(ctx, lines.EF, T.cyan, 2.4); polyline(ctx, lines.N, T.ink, 1.6, [5, 4]); polyline(ctx, lines.S, T.good, 2.2);
          ctx.strokeStyle = T.ink; ctx.globalAlpha = .35; ctx.beginPath(); ctx.moveTo(A.X(p), A.T); ctx.lineTo(A.X(p), A.B); ctx.stroke(); ctx.globalAlpha = 1; });
        const upd = () => { q.inv(); const m_ = meas(al, p); ro.innerHTML = `<span class="k">concurrence </span>${num(m_.C, 4)} &nbsp; <span class="k">entanglement of formation </span>${num(m_.EF, 4)} ebits<br><span class="k">negativity </span>${num(m_.N, 4)} &nbsp; <span class="k">max CHSH </span>${num(m_.S, 4)}<br>${m_.C < 1e-6 ? '<span class="k">separable</span>' : m_.S > 2 + 1e-9 ? '<span style="color:var(--good)">entangled and Bell-violating</span>' : '<span style="color:var(--copper)">entangled, but cannot violate CHSH</span>'}`; };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow([['concurrence', 'var(--copper)'], ['entanglement of formation', 'var(--cyan)'], ['2 × negativity', 'var(--ink)', 1], ['max CHSH / 2', 'var(--good)']])),
          h('div', { class: 'stack' }, slider({ id: id('p'), label: 'Weight p of the pure state', min: 0, max: 1, step: .005, value: p, fmt: v => num(v, 3), on: v => { p = v; upd(); } }), slider({ id: id('a'), label: 'Angle α of the pure state', min: 0, max: PI / 4, step: .01, value: al, fmt: v => num(deg(v), 0) + '°', on: v => { al = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['For pure states the entanglement entropy S(ρ_A) counts the Bell pairs a state is worth under LOCC.',
    'For mixed two-qubit states, concurrence, entanglement of formation and negativity (from the partial transpose) quantify entanglement.',
    'The Peres–Horodecki criterion: two qubits are entangled exactly when the partial transpose has a negative eigenvalue.',
    'Some entangled states cannot violate Bell inequalities, and in higher dimensions bound entangled states cannot be distilled.'],
  quiz: QZ([
    ['What is the entanglement entropy of a pure two-party state?', ['The energy', 'The von Neumann entropy of either reduced state, S(ρ_A)', 'The number of qubits', 'The purity of the whole state'], 1, 'For pure states both halves have the same entropy.'],
    ['What is the entanglement entropy of a Bell state?', ['0', '1 ebit', '2 ebits', '½'], 1, 'Each half is maximally mixed, with entropy 1 bit.'],
    ['What does LOCC stand for?', ['Low-order coupled circuits', 'Local operations and classical communication', 'Logical operations on classical computers', 'Linear optical coherent control'], 1, 'Entanglement cannot increase under LOCC, which makes it a resource.'],
    ['What does the entanglement of formation measure?', ['The energy of formation', 'The number of Bell pairs needed per copy to create the state by LOCC', 'The negativity', 'The CHSH value'], 1, 'For two qubits it follows from the concurrence.'],
    ['What is the partial transpose?', ['Transposing the whole matrix', 'Transposing only the indices of one subsystem', 'Taking the trace', 'Inverting the matrix'], 1, 'For separable states it remains a valid density matrix.'],
    ['What does the Peres–Horodecki criterion state for two qubits?', ['All mixed states are separable', 'A state is entangled exactly when its partial transpose has a negative eigenvalue', 'Negativity is always zero', 'Concurrence equals CHSH'], 1, 'For larger systems a negative partial transpose is sufficient but not necessary.'],
    ['For which mixing weights is the Werner state entangled?', ['All p', 'p > 1/3', 'p > 1/√2 only', 'p < 1/3'], 1, 'Its concurrence is max(0, (3p − 1)/2), which becomes positive exactly at p = 1/3.'],
    ['For which Werner states is CHSH violated?', ['p > 1/3', 'p > 1/√2 ≈ 0.707', 'All entangled ones', 'None'], 1, 'The maximal CHSH value is 2√2·p, which exceeds 2 only for p > 1/√2.'],
    ['What is bound entanglement?', ['Entanglement in bound states of atoms', 'Entanglement that cannot be distilled into Bell pairs, found in higher dimensions with positive partial transpose', 'Maximal entanglement', 'A classical correlation'], 1, 'The Horodeckis discovered it in 1998, showing that entanglement and distillability are different things.'],
    ['What did Werner show in 1989?', ['Entanglement is impossible', 'Some entangled states admit local hidden-variable models for all projective measurements', 'Bell inequalities are always violated', 'Concurrence is additive'], 1, 'Entanglement and nonlocality are different resources.']
  ])
});

/* ---------- superdense coding ---------- */
LESSONS.push({
  id: 'superdense', n: 10.2, stage: 2, minutes: 12, title: 'Superdense coding',
  lede: 'Teleportation sends one qubit using two classical bits and a Bell pair. Superdense coding is its mirror image: it sends two classical bits by transmitting a single qubit, if the parties shared a Bell pair beforehand.',
  html: `
<h2>Two bits through one qubit</h2>
<p>Holevo’s bound ([[L:infotheory]]) says one qubit can carry at most one classical bit. Bennett and Wiesner (1992) showed that prior entanglement doubles this. Alice and Bob share the Bell state ${m('|Φ⁺⟩ = (|00⟩ + |11⟩)/√2')}. To send two bits ${m('b₁b₂')}, Alice applies one of four operations to her half:</p>
${EQ('00 → I, &nbsp; 01 → X, &nbsp; 10 → Z, &nbsp; 11 → ZX')}
<p>which turn ${m('|Φ⁺⟩')} into the four mutually orthogonal Bell states ${m('|Φ⁺⟩, |Ψ⁺⟩, |Φ⁻⟩, |Ψ⁻⟩')}. She sends her qubit to Bob, who now holds both halves and performs a <strong>Bell measurement</strong>, a CNOT then a Hadamard then two computational-basis measurements, which identifies which of the four states he has, and hence both bits.</p>
<p>No laws are broken: the Bell pair had to be distributed earlier, so two qubits travel in total, and the entanglement is consumed. What superdense coding shows is that entanglement and quantum communication can substitute for each other. In the language of capacities ([[L:capacity]]) a noiseless qubit channel has entanglement-assisted classical capacity 2. Since anyone intercepting Alice’s qubit sees a maximally mixed state, the two bits are also hidden from an eavesdropper who lacks Bob’s half.</p>
${LAB('dense')}
<h2>In the lab and in experiments</h2>
<p>Noise in the shared pair degrades the scheme: for a Werner-type pair with fidelity ${m('F')} to ${m('|Φ⁺⟩')}, Bob decodes correctly with probability ${m('F')}, and the number of bits per transmitted qubit falls below the classical one bit once the pair is too noisy. Superdense coding was first demonstrated with photons by Mattle, Weinfurter, Kwiat and Zeilinger in 1996, with a linear-optics Bell measurement that distinguished three of the four messages; later experiments using hyperentangled photons distinguished all four.</p>
`,
  labs: {
    dense: {
      title: 'Send two bits with one qubit',
      cap: 'Choose Alice’s two-bit message; the circuit applies her operation to her half of the shared pair, then Bob’s Bell measurement. Bars show Bob’s outcome probabilities, computed exactly from a pair that has been mixed with white noise (fidelity F to |Φ⁺⟩). The chart shows the classical information per transmitted qubit, the mutual information between message and outcome: 2 bits for a perfect pair, falling below 1 bit (the limit without entanglement) once F drops below about 0.81.',
      build(body, id) {
        let msg = 2, F = 1;
        const circ = h('div', { class: 'circ-wrap' }), barsEl = h('div'), cv = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const e = h('div'); barsEl.append(e); const bars = new Bars(e, ['00', '01', '10', '11'], { height: 120 });
        const info = f => { const pc = f, pw = (1 - f) / 3; return 2 + pc * Math.log2(pc || 1) + 3 * (pw ? pw * Math.log2(pw) : 0); };
        const q = painter(cv, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [.25, 1], y: [0, 2.05], xt: [.25, .5, .75, 1], yt: [0, 1, 2], xl: 'pair fidelity F', yl: 'bits per qubit sent' }); ctx.setLineDash([4, 3]); ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.moveTo(A.L, A.Y(1)); ctx.lineTo(A.R, A.Y(1)); ctx.stroke(); ctx.setLineDash([]); const pts = []; for (let f = .25; f <= 1.0001; f += .005) pts.push([A.X(f), A.Y(info(f))]); polyline(ctx, pts, T.cyan, 2.4); dot(ctx, A.X(F), A.Y(info(F)), 6, T.copper, T.surface); txt(ctx, 'no entanglement: 1 bit', A.L + 6, A.Y(1) - 8, { align: 'left', font: '500 10px "JetBrains Mono",monospace' }); });
        const upd = () => {
          const ops = [[], [{ g: 'X', q: 0 }], [{ g: 'Z', q: 0 }], [{ g: 'X', q: 0 }, { g: 'Z', q: 0 }]][msg];
          circ.innerHTML = ''; circ.append(drawCircuit(2, [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }], ...ops.map(o => [o]), [{ g: 'CX', c: 0, t: 1 }], [{ g: 'H', q: 0 }], [{ g: 'M', q: 0 }, { g: 'M', q: 1 }]], { labels: ['Alice', 'Bob'], cw: 50 }).svg);
          const pr = [0, 1, 2, 3].map(k => k === msg ? F : (1 - F) / 3); bars.set(pr, { colors: pr.map((_, k) => k === msg ? 'var(--cyan)' : 'var(--copper)'), texts: pr.map(x => x < .005 ? '' : pct(x, 0)) });
          q.inv(); ro.innerHTML = `<span class="k">message </span>${['00', '01', '10', '11'][msg]} → Alice applies ${['I', 'X', 'Z', 'ZX'][msg]}<br><span class="k">Bob decodes correctly with probability </span>${pct(F, 1)}<br><span class="k">information per qubit sent </span>${num(info(F), 3)} bits`;
        };
        body.append(h('div', { class: 'btns' }, seg([0, 1, 2, 3].map(k => ({ v: k, label: 'Send ' + ['00', '01', '10', '11'][k] })), msg, v => { msg = v; upd(); }, 'Message')), circ,
          h('div', { class: 'split' }, h('div', { class: 'stack' }, barsEl, slider({ id: id('f'), label: 'Fidelity F of the shared pair', min: .25, max: 1, step: .005, value: F, fmt: v => num(v, 3), on: v => { F = v; upd(); } })), h('div', { class: 'stack' }, cv, ro)));
        upd();
      }
    }
  },
  take: ['With a shared Bell pair, Alice encodes two classical bits by applying I, X, Z or ZX to her half and sending it to Bob.',
    'Bob’s Bell measurement (CNOT, Hadamard, two measurements) distinguishes the four orthogonal Bell states.',
    'The scheme does not violate Holevo’s bound: the pre-shared pair is consumed, so entanglement substitutes for communication.',
    'Noise in the pair reduces the information per qubit; below a certain fidelity entanglement no longer helps.'],
  quiz: QZ([
    ['How many classical bits does superdense coding send per transmitted qubit?', ['1', '2', '4', '½'], 1, 'Prior entanglement doubles the classical capacity of a qubit channel.'],
    ['What resource must Alice and Bob share beforehand?', ['A classical key', 'A Bell pair', 'A quantum computer', 'Nothing'], 1, 'The entanglement is consumed by the protocol.'],
    ['Which operations does Alice apply for the four messages?', ['H, S, T, CNOT', 'I, X, Z and ZX on her half', 'Measurements in four bases', 'Rotations by 90°'], 1, 'Each maps |Φ⁺⟩ to a different Bell state.'],
    ['What measurement does Bob perform?', ['Z on one qubit', 'A Bell measurement on both qubits: CNOT, Hadamard, then two Z measurements', 'Tomography', 'Nothing'], 1, 'It perfectly distinguishes the four orthogonal Bell states.'],
    ['Why doesn’t superdense coding violate Holevo’s bound?', ['It does', 'Two qubits are involved in total, including the pre-shared half; one transmitted qubit alone still carries at most one bit without entanglement', 'Holevo’s bound is wrong', 'Because bits are compressed'], 1, 'Entanglement acts as a prepaid resource.'],
    ['What does an eavesdropper intercepting Alice’s qubit learn?', ['Both bits', 'Nothing about the message, because her qubit alone is maximally mixed for every message', 'One bit', 'The key'], 1, 'The information is stored in correlations with Bob’s half.'],
    ['How is superdense coding related to teleportation?', ['They are unrelated', 'They are mirror images: teleportation sends a qubit using two bits plus a Bell pair; superdense coding sends two bits using a qubit plus a Bell pair', 'They are identical', 'Teleportation needs no entanglement'], 1, 'Both trade entanglement against communication.'],
    ['What limited the first photonic demonstration in 1996?', ['No photons', 'A linear-optics Bell measurement that could distinguish only three of the four Bell states', 'Detectors were perfect', 'No entanglement source'], 1, 'Complete Bell measurement is impossible with linear optics alone on single photons.'],
    ['With a noisy pair of fidelity F, what is Bob’s success probability in the lab?', ['1', 'F', 'F²', '½'], 1, 'The noise turns the correct Bell state into the others with total probability 1 − F.'],
    ['What capacity does superdense coding illustrate for a noiseless qubit channel?', ['Q = 2', 'The entanglement-assisted classical capacity C_E = 2', 'C = 2 without entanglement', 'Zero capacity'], 1, 'Unlimited shared entanglement doubles the classical capacity.']
  ])
});

/* ---------- E91 and device-independent QKD ---------- */
LESSONS.push({
  id: 'e91', n: 11.3, stage: 2, minutes: 15, title: 'E91 and device-independent key distribution',
  lede: 'In 1991 Artur Ekert proposed distilling a secret key from entangled pairs and using a Bell test to check for eavesdroppers. Taken to its logical end, the idea gives security that does not even require trusting your own devices.',
  html: `
<h2>Ekert’s protocol</h2>
<p>In BB84 ([[L:bb84]]) Alice prepares states and Bob measures them. In <strong>E91</strong> (Ekert, 1991) a source, possibly controlled by the adversary, sends each of them half of an entangled pair. Each picks a measurement setting at random. When their settings agree, their results are perfectly correlated and become key bits. When they differ, the results are used to evaluate the CHSH quantity ${m('S')} ([[L:entanglement]]). Quantum mechanics allows ${m('S = 2√2')} for perfect pairs; any eavesdropper who learns the outcomes in advance turns the correlations classical and pushes ${m('S')} down to at most 2.</p>
<p>The Bell test certifies that the outcomes did not exist before measurement, so nobody, including whoever built the source, could have known them. Monogamy of entanglement ([[L:ghz]]) makes this quantitative: if Alice and Bob are maximally correlated in the CHSH sense, no third party can be correlated with them.</p>
<h2>Device independence</h2>
<p>Practical QKD assumes the devices work as specified; side channels and hacked detectors have broken real systems. <strong>Device-independent QKD</strong> (Mayers and Yao, 1998; Acín and colleagues, 2007) treats the devices as black boxes. Security follows only from the observed CHSH value, the quantum bit error rate ${m('Q')} and the assumption that no information leaks out of the labs. For collective attacks the key rate is at least</p>
${EQ('r ≥ 1 − h(Q) − h( (1 + √((S/2)² − 1)) / 2 )')}
<p>which is positive only for high Bell violations and low error rates, demanding loophole-free Bell tests with high detection efficiency. In 2022 three experiments distributed device-independent keys for the first time: with trapped ions in Oxford (Nadlinger and colleagues), with neutral atoms in Munich (Zhang and colleagues) and over photons in a proof-of-principle (Liu and colleagues).</p>
${LAB('di')}
<h2>Related ideas</h2>
<p>The same logic certifies randomness: a Bell violation guarantees that measurement outcomes are unpredictable even to the device maker, which has been used for certified random number generation. Measurement-device-independent QKD removes the most vulnerable component, the detectors, while keeping trusted sources and achieving practical rates over long fibres.</p>
`,
  labs: {
    di: {
      title: 'A Bell test as a security check',
      cap: 'Pairs from the source are mixed with noise (visibility v), giving CHSH value S = 2√2·v and bit error rate Q = (1 − v)/2. Each run simulates N pairs with random settings: matching settings give key bits, the others estimate S. The chart shows the device-independent key rate bound against visibility, positive only above about v ≈ 0.86, an error rate of about 7%. Switch on the intercept-resend eavesdropper: she measures every photon, the correlations become classical, and S falls to at most 2, so the key is aborted.',
      build(body, id) {
        let v = .97, N = 20000, eve = false, res = null;
        const cv = canvas('', 'height:230px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const rate = (S, Q) => S <= 2 ? 0 : Math.max(0, 1 - h2b(Q) - h2b((1 + Math.sqrt(Math.max(0, (S / 2) ** 2 - 1))) / 2));
        const run = () => {
          const ang = { A: [0, PI / 4], B: [PI / 8, -PI / 8], K: 0 }; let key = 0, err = 0; const E = { 0: [0, 0], 1: [0, 0], 2: [0, 0], 3: [0, 0] };
          for (let i = 0; i < N; i++) {
            const u = Math.random(); let a, b, cat;
            if (u < .5) { a = 0; b = 0; cat = 'key'; } else { const k = Math.floor(Math.random() * 4); a = ang.A[k >> 1]; b = ang.B[k & 1]; cat = k; }
            let corr; if (eve) { const lam = Math.random() * PI; corr = Math.cos(2 * (a - lam)) * Math.cos(2 * (b - lam)) > 0 ? 1 : -1; if (Math.random() > v) corr = Math.random() < .5 ? 1 : -1; }
            else { const pSame = (1 + v * Math.cos(2 * (a - b))) / 2; corr = Math.random() < pSame ? 1 : -1; }
            if (cat === 'key') { key++; if (corr < 0) err++; } else { E[cat][0] += corr; E[cat][1]++; }
          }
          const e = k => E[k][1] ? E[k][0] / E[k][1] : 0, S = Math.abs(e(0) + e(1) + e(2) - e(3)), Q = err / key;
          res = { S, Q, key, r: rate(S, Q) }; q.inv(); text();
        };
        const q = painter(cv, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [.85, 1], y: [0, 1], xt: [.85, .9, .95, 1], yt: [0, .5, 1], xl: 'visibility v', yl: 'key rate bound (bits per key pair)' }); const pts = []; for (let x = .85; x <= 1.0001; x += .001) pts.push([A.X(x), A.Y(rate(2 * Math.SQRT2 * x, (1 - x) / 2))]); polyline(ctx, pts, T.cyan, 2.4); if (res) dot(ctx, A.X(v), A.Y(res.r), 6, eve ? T.bad : T.copper, T.surface); });
        const text = () => { ro.innerHTML = `<span class="k">pairs </span>${N.toLocaleString('en-US')} &nbsp; <span class="k">raw key bits </span>${res.key.toLocaleString('en-US')}<br><span class="k">measured CHSH S </span>${num(res.S, 3)} <span class="k">(ideal ${num(2 * Math.SQRT2 * v, 3)})</span> &nbsp; <span class="k">error rate Q </span>${pct(res.Q, 2)}<br>${res.r > 0 ? `<span style="color:var(--good)">secure key rate ≥ ${num(res.r, 3)} bits per key pair: ${Math.floor(res.r * res.key).toLocaleString('en-US')} secret bits</span>` : '<span style="color:var(--bad)">no device-independent key: abort</span>'}`; };
        body.append(h('div', { class: 'btns' }, seg([{ v: false, label: 'No eavesdropper' }, { v: true, label: 'Intercept-resend eavesdropper' }], eve, x => { eve = x; run(); }, 'Channel'), btn('Run again', run, 'pri')),
          h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' }, slider({ id: id('v'), label: 'Visibility v of the pairs', min: .85, max: 1, step: .001, value: v, fmt: x => num(x, 3), on: x => { v = x; run(); } }), slider({ id: id('n'), label: 'Pairs per run', min: 3, max: 5.5, step: .1, value: Math.log10(N), fmt: x => Math.round(10 ** x).toLocaleString('en-US'), on: x => { N = Math.round(10 ** x); run(); } }), ro)));
        run();
      }
    }
  },
  take: ['E91 distils a key from entangled pairs: matching settings give key bits, the rest test the CHSH inequality.',
    'A CHSH value near 2√2 certifies that outcomes were not predetermined, so no eavesdropper or device maker knew them.',
    'Device-independent QKD bases security on the observed Bell violation and error rate alone, treating devices as black boxes.',
    'Key rates require high violations and loophole-free Bell tests; the first DI-QKD experiments were reported in 2022.'],
  quiz: QZ([
    ['How does E91 differ from BB84?', ['It uses no quantum states', 'It uses entangled pairs from a source and a Bell test, rather than states prepared by Alice', 'It needs no randomness', 'It uses only classical channels'], 1, 'Security comes from the observed correlations rather than from trusted state preparation.'],
    ['Which measurement results become key bits in E91?', ['All of them', 'Those where Alice and Bob happened to use matching settings, giving perfectly correlated outcomes', 'Only the CHSH rounds', 'Only errors'], 1, 'Mismatched settings are used to evaluate S.'],
    ['What does an eavesdropper who learns outcomes in advance do to the CHSH value?', ['Raises it above 2√2', 'Limits it to at most 2, the classical bound', 'Makes it exactly 2√2', 'Nothing'], 1, 'Predetermined outcomes are a local hidden-variable model.'],
    ['What does device-independent mean?', ['No devices are used', 'Security does not rely on knowing how the devices work internally, only on observed statistics and the absence of leaks from the labs', 'Devices are certified by a company', 'It works without quantum mechanics'], 1, 'The devices are treated as untrusted black boxes.'],
    ['Why does practical QKD need more than BB84’s security proof?', ['It doesn’t', 'Real devices deviate from their models, and side channels such as detector blinding have broken implementations', 'Because BB84 is classical', 'Because photons are slow'], 1, 'Device independence closes these gaps at the cost of much harder experiments.'],
    ['What determines the device-independent key rate bound in the lab?', ['Only the number of pairs', 'The CHSH value S and the bit error rate Q', 'The wavelength', 'The distance'], 1, 'r ≥ 1 − h(Q) − h((1 + √((S/2)² − 1))/2) for collective attacks.'],
    ['Roughly what visibility is needed for a positive DI key rate in the lab model?', ['0.5', 'About 0.86 or higher, an error rate below about 7%', '0.71', 'Any visibility'], 1, 'Both entropy terms must stay small; the bound reaches zero near a 7.1% error rate, as Acín and colleagues found.'],
    ['Which platforms produced the first device-independent keys in 2022?', ['Superconducting qubits', 'Trapped ions and neutral atoms (with a photonic proof of principle)', 'Spin qubits', 'Annealers'], 1, 'They used loophole-free Bell tests between separated matter qubits.'],
    ['What does monogamy of entanglement imply for security?', ['Nothing', 'If Alice and Bob are maximally entangled, a third party cannot share correlations with them', 'Entanglement can be copied', 'Eve gets half the key'], 1, 'Strong correlations between two parties limit correlations with anyone else.'],
    ['Besides QKD, what can a Bell violation certify?', ['Energy', 'Randomness that is unpredictable even to the device manufacturer', 'Clock speed', 'Error-correction thresholds'], 1, 'Certified randomness generation uses exactly this.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Partial trace', 'The operation that gives the reduced density matrix of a subsystem by summing over the rest.', 'densitymatrix'],
  ['Qudit', 'A quantum system with d levels; a qutrit has three.', 'qudits'],
  ['Swap test', 'A circuit with an ancilla and a controlled swap whose outcome estimates the overlap |⟨ψ|φ⟩|² of two states.', 'swaptest'],
  ['Quantum fingerprinting', 'Comparing long strings by exchanging short quantum fingerprints and testing them with swap tests.', 'swaptest'],
  ['Negativity', 'The magnitude of the negative eigenvalues of a state’s partial transpose; non-zero only for entangled states.', 'measures'],
  ['Bound entanglement', 'Entanglement that cannot be distilled into Bell pairs by local operations and classical communication.', 'measures'],
  ['E91 protocol', 'Ekert’s entanglement-based key distribution, which uses a Bell test to detect eavesdropping.', 'e91'],
  ['Device-independent QKD', 'Key distribution whose security follows from observed Bell violations alone, without trusting the devices.', 'e91']
);
})();
