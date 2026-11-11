/* =====================================================================
   Part 0 · The math toolkit, batch C: outer products, projectors and
   the trace; matrix exponentials; singular values and Schmidt
   ===================================================================== */
(() => {
const ap2 = (A, v) => [A[0] * v[0] + A[1] * v[1], A[2] * v[0] + A[3] * v[1]];
const mul2 = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];
const cellStyle = (z, extra = '') => { const a = Math.hypot(z[0], z[1]); return `height:40px;display:grid;place-items:center;border-radius:6px;font:600 11.5px var(--f-mono);background:${a > 1e-6 ? phaseColor(Math.atan2(z[1], z[0]), .12 + .75 * Math.min(1, a * 1.6)) : 'var(--surface-2)'};${extra}`; };
const outer = (a, b) => { const n = a.length, M2 = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) M2.push(C2.mul(a[i], C2.conj(b[j]))); return M2; };

/* ---------- 7 · outer products, projectors and the trace ---------- */
LESSONS.push({
  id: 'laouter', n: 7, stage: LIN, minutes: 15, title: 'Outer products, projectors and the trace',
  lede: 'A ket times a bra is not a number but a matrix. These outer products build projectors, which describe measurements, and density matrices, which describe noisy states. The trace, the sum of a matrix’s diagonal, turns them back into probabilities and expectation values, and the partial trace tells you what part of an entangled system looks like on its own.',
  html: `
<h2>Ket times bra</h2>
<p>A bra times a ket, ${m('⟨φ|ψ⟩')}, is a row times a column: a single number ([[L:lainner]]). In the other order, a column times a row gives a whole matrix, the <strong>outer product</strong>:</p>
${EQ(`|ψ⟩⟨φ| = ${MX([['ψ₀'], ['ψ₁']])} ${MX([['φ₀*', 'φ₁*']])} = ${MX([['ψ₀φ₀*', 'ψ₀φ₁*'], ['ψ₁φ₀*', 'ψ₁φ₁*']])}`)}
<p>It acts as ${m('(|ψ⟩⟨φ|)|χ⟩ = ⟨φ|χ⟩ |ψ⟩')}: it measures the overlap with ${m('φ')} and outputs that much ${m('ψ')}. Every matrix is a sum of such pieces, ${m('A = Σ A<sub>ij</sub> |i⟩⟨j|')}, and for an orthonormal basis the pieces ${m('|k⟩⟨k|')} add up to the identity, the <strong>completeness relation</strong> ${m('Σ<sub>k</sub> |k⟩⟨k| = I')}.</p>
<h2>Projectors and measurement</h2>
<p>For a unit vector ${m('|b⟩')}, ${m('P = |b⟩⟨b|')} is the <strong>projector</strong> onto it. Projectors satisfy ${m('P² = P')} (projecting twice changes nothing) and ${m('P† = P')}; their eigenvalues are 0 and 1. A measurement in a basis is a set of projectors that add to the identity. The probability of outcome ${m('b')} is ${m('⟨ψ|P|ψ⟩ = |⟨b|ψ⟩|²')}, and the state afterwards is ${m('P|ψ⟩')} rescaled to length 1 ([[L:measurement]]). Projectors can also pick out larger subspaces, such as “the first qubit is 0”, ${m('|0⟩⟨0| ⊗ I')}, which is how measuring one qubit of many works. The spectral theorem says every observable is a weighted sum of projectors, ${m('A = Σ λ<sub>k</sub> P<sub>k</sub>')} ([[L:laeigen]]).</p>
${LAB('projector')}
<h2>The trace</h2>
<p>The <strong>trace</strong> of a square matrix is the sum of its diagonal entries. It equals the sum of the eigenvalues, it does not depend on the basis, and it is <strong>cyclic</strong>: ${m('Tr(AB) = Tr(BA)')}. With it, an expectation value can be written using the outer product of the state with itself:</p>
${EQ('⟨ψ|A|ψ⟩ = Tr(A |ψ⟩⟨ψ|) = Tr(A ρ), &nbsp;&nbsp; ρ = |ψ⟩⟨ψ|')}
<p>The matrix ${m('ρ')} is the <strong>density matrix</strong>. It also describes uncertain mixtures, ${m('ρ = Σ p<sub>k</sub> |ψ<sub>k</sub>⟩⟨ψ<sub>k</sub>|')}, which state vectors cannot ([[L:densitymatrix]]). Every density matrix is Hermitian, has non-negative eigenvalues and has ${m('Tr ρ = 1')}; it is pure exactly when ${m('Tr ρ² = 1')}.</p>
<h2>The partial trace</h2>
<p>What does one qubit of an entangled pair look like on its own? Write the two-qubit density matrix in 2×2 blocks, one block for each pair of q0 values. <strong>Tracing out</strong> q1 replaces each block by its trace, leaving a 2×2 matrix ${m('ρ<sub>A</sub> = Tr<sub>B</sub> ρ')} for q0 alone. It gives the right statistics for every measurement on q0. For a product state, ${m('ρ<sub>A</sub>')} is pure. For the Bell state it is ${m('I/2')}, completely random: all the information sits in the correlations, none in either qubit. Mixedness of the parts is the signature of entanglement in the whole, and its entropy is the entanglement entropy ([[L:measures]]).</p>
${LAB('ptrace')}
`,
  labs: {
    projector: {
      title: 'Projecting onto a measurement direction',
      cap: 'The projector P = |b⟩⟨b| for the direction b (copper dot); I − P projects onto the opposite point (cyan). For the state ψ (arrow) the readout shows P as a matrix, P|ψ⟩, and the probability ⟨ψ|P|ψ⟩. Measure repeatedly: each run starts from ψ and jumps to b or to its opposite, with frequencies that approach the projector’s prediction.',
      build(body, id) {
        let tb = 1, pb = .5, ts = 2.1, ps = 2.4, cnt = [0, 0];
        const sph = canvas('sq', 'max-width:300px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: false }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const bvec = () => [Math.sin(tb) * Math.cos(pb), Math.sin(tb) * Math.sin(pb), Math.cos(tb)];
        bv.shape = true; bv.drawShape = (ctx, T) => { const n = bvec(), a = bv.proj(n), b = bv.proj(n.map(x => -x)); ctx.strokeStyle = T.muted; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); dot(ctx, a[0], a[1], 7, T.copper); dot(ctx, b[0], b[1], 7, T.cyan); };
        const text = () => { const b = LA.st(tb, pb), s = LA.st(ts, ps), P = outer(b, b), Ps = LA.mv(P, s), p = Ps.reduce((q, z) => q + C2.abs2(z), 0), P2 = LA.mm(P, P, 2), dev = Math.max(...P2.map((z, i) => Math.hypot(z[0] - P[i][0], z[1] - P[i][1]))), tot = cnt[0] + cnt[1];
          ro.innerHTML = `<span class="k">P = |b⟩⟨b| = </span>${LA.cm(P, 2)} <span class="k">P|ψ⟩ = </span>${LA.cv(Ps, 2)}<br><span class="k">P² = P? </span>${dev < 1e-9 ? 'yes' : 'no'} <span class="k">· Tr P = </span>${num(P[0][0] + P[3][0], 3)}<br><span class="k">P(b) = ⟨ψ|P|ψ⟩ = </span>${num(p, 3)} <span class="k">· P(opposite) = ⟨ψ|(I − P)|ψ⟩ = </span>${num(1 - p, 3)}<br><span class="k">measured </span>${tot ? `${cnt[0]} × b, ${cnt[1]} × opposite (${pct(cnt[0] / tot, 1)} b)` : 'not yet'}`; };
        const up = () => { cnt = [0, 0]; bv.set(LA.bloch(LA.st(ts, ps))); bv.inv(); text(); };
        const meas = k => { const b = LA.st(tb, pb), s = LA.st(ts, ps), p = C2.abs2(LA.ip(b, s)); let last = 0; for (let i = 0; i < k; i++) { last = Math.random() < p ? 0 : 1; cnt[last]++; } const tgt = last ? bvec().map(x => -x) : bvec(); bv.set(LA.bloch(s)); if (k === 1) bv.moveTo(tgt, reduced() ? 0 : 500); else bv.set(tgt); text(); };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, sph, h('div', { class: 'btns' }, btn('Measure once', () => meas(1), 'pri'), btn('Measure 200 times', () => meas(200)), btn('Back to ψ', () => { bv.set(LA.bloch(LA.st(ts, ps))); }, 'sm'))), h('div', { class: 'stack' },
          LA.sl(id('tb'), 'Measurement direction b: polar angle', 0, PI, .01, tb, v => num(deg(v), 0) + '°', v => { tb = v; up(); }), LA.sl(id('pb'), 'Measurement direction b: azimuth', 0, TAU, .01, pb, v => num(deg(v), 0) + '°', v => { pb = v; up(); }),
          LA.sl(id('ts'), 'State ψ: polar angle', 0, PI, .01, ts, v => num(deg(v), 0) + '°', v => { ts = v; up(); }), LA.sl(id('ps'), 'State ψ: azimuth', 0, TAU, .01, ps, v => num(deg(v), 0) + '°', v => { ps = v; up(); }), ro)));
        up();
      }
    },
    ptrace: {
      title: 'The partial trace: one qubit of a pair',
      cap: 'Left: the 4×4 density matrix of two qubits, drawn as four 2×2 blocks (colour is phase, strength is size). The outlined cells are the ones that survive the partial trace and are added together. Right: the reduced 2×2 density matrix and its Bloch vector. A product state leaves a pure qubit on the surface; the Bell state leaves the centre of the sphere.',
      build(body, id) {
        let fam = 'ent', th = PI / 2, ph = 0, keep = 0;
        const g4 = h('div', { style: 'display:grid;grid-template-columns:repeat(4,minmax(0,62px));gap:3px' }), g2 = h('div', { style: 'display:grid;grid-template-columns:repeat(2,minmax(0,70px));gap:3px' });
        const sph = canvas('sq', 'max-width:220px;margin:0 auto'), bv = new BlochView(sph, { labels: 'min', trail: false, drag: false }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const rho = () => {
          if (fam === 'werner') { const p = th / PI, R = []; const b = [[S2, 0], [0, 0], [0, 0], [S2 * Math.cos(ph), S2 * Math.sin(ph)]]; const B = outer(b, b); for (let i = 0; i < 16; i++) R.push([p * B[i][0] + (i % 5 === 0 ? (1 - p) / 4 : 0), p * B[i][1]]); return R; }
          let v; if (fam === 'ent') v = [[Math.cos(th / 2), 0], [0, 0], [0, 0], [Math.sin(th / 2) * Math.cos(ph), Math.sin(th / 2) * Math.sin(ph)]];
          else { const a = LA.st(th, ph), b = LA.st(PI / 3, 0); v = [C2.mul(a[0], b[0]), C2.mul(a[0], b[1]), C2.mul(a[1], b[0]), C2.mul(a[1], b[1])]; }
          return outer(v, v); };
        const red = R => { const r = []; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { let s = [0, 0]; for (let k = 0; k < 2; k++) s = C2.add(s, keep === 0 ? R[(2 * i + k) * 4 + 2 * j + k] : R[(2 * k + i) * 4 + 2 * k + j]); r.push(s); } return r; };
        const draw = () => { const R = rho(), r = red(R);
          g4.innerHTML = ''; R.forEach((z, i) => { const row = i >> 2, col = i & 3, used = keep === 0 ? (row & 1) === (col & 1) : (row >> 1) === (col >> 1), blk = (row >> 1) * 2 + (col >> 1); g4.append(h('div', { style: cellStyle(z, `${used ? 'outline:2px solid var(--ink);' : ''}${blk === 1 || blk === 2 ? 'opacity:.85;' : ''}`) }, cstr(z[0], z[1], 2))); });
          g2.innerHTML = ''; r.forEach(z => g2.append(h('div', { style: cellStyle(z) }, cstr(z[0], z[1], 3))));
          const bx = 2 * r[2][0], by = 2 * r[2][1], bz = r[0][0] - r[3][0]; bv.set([bx, by, bz]); bv.inv();
          const pur = r.reduce((s, z) => s + C2.abs2(z), 0), L = Math.hypot(bx, by, bz), ev = [(1 + L) / 2, (1 - L) / 2], S = -ev.reduce((s, p) => s + (p > 1e-12 ? p * Math.log2(p) : 0), 0);
          ro.innerHTML = `<span class="k">Tr ρ = </span>${num(R[0][0] + R[5][0] + R[10][0] + R[15][0], 3)} <span class="k">· Tr ρ² (whole) = </span>${num(LA.mm(R, R, 4).filter((_, i) => i % 5 === 0).reduce((q, z) => q + z[0], 0), 3)}<br><span class="k">reduced state of q${keep}: purity Tr ρ² = </span>${num(pur, 3)} <span class="k">· Bloch length </span>${num(L, 3)}<br><span class="k">entropy of q${keep} </span>${num(S, 3)} bit${fam === 'werner' ? ' (part of it comes from noise, not entanglement)' : ''}`; };
        const famSeg = seg([{ v: 'ent', label: 'cos(θ/2)|00⟩ + e^(iφ) sin(θ/2)|11⟩' }, { v: 'prod', label: 'Product |a⟩⊗|b⟩' }, { v: 'werner', label: 'Noisy Bell state' }], fam, v => { fam = v; draw(); }, 'State');
        body.append(h('div', { class: 'btns' }, famSeg), h('div', { class: 'split' }, h('div', { class: 'stack' }, h('div', { style: 'font:600 12px var(--f-mono)' }, 'ρ (rows and columns |00⟩, |01⟩, |10⟩, |11⟩)'), h('div', { class: 'scroll-x' }, g4),
          field('Keep which qubit?', seg([{ v: 0, label: 'Keep q0 (trace out q1)' }, { v: 1, label: 'Keep q1 (trace out q0)' }], keep, v => { keep = v; draw(); }, 'Keep')),
          LA.sl(id('t'), 'θ (for the noisy Bell state: fraction of Bell state)', 0, PI, .01, th, v => fam === 'werner' ? pct(v / PI, 0) : num(deg(v), 0) + '°', v => { th = v; draw(); }), LA.sl(id('p'), 'Phase φ', 0, TAU, .01, ph, v => num(deg(v), 0) + '°', v => { ph = v; draw(); })),
          h('div', { class: 'stack' }, h('div', { style: 'font:600 12px var(--f-mono)' }, 'reduced ρ of the kept qubit'), g2, sph, ro)));
        draw();
      }
    }
  },
  take: ['An outer product |ψ⟩⟨φ| is a matrix; for an orthonormal basis, Σₖ|k⟩⟨k| = I.',
    'Projectors P = |b⟩⟨b| satisfy P² = P = P†; outcome probabilities are ⟨ψ|P|ψ⟩, and every observable is Σ λₖPₖ.',
    'The trace is basis-independent and cyclic; ⟨A⟩ = Tr(Aρ) with the density matrix ρ, which also describes mixtures.',
    'The partial trace gives the state of one part; a product state leaves a pure part, an entangled state a mixed one.'],
  quiz: QZ([
    ['What is |ψ⟩⟨φ|?', ['A number', 'A matrix (the outer product)', 'A vector', 'Always the identity'], 1, 'A column times a row gives a matrix with entries ψᵢφⱼ*.'],
    ['What does |ψ⟩⟨φ| do to a vector |χ⟩?', ['Nothing', 'Outputs ⟨φ|χ⟩ times |ψ⟩', 'Outputs |φ⟩', 'Outputs ⟨ψ|χ⟩'], 1, 'It measures the overlap with φ and returns that much ψ.'],
    ['What is Σₖ |k⟩⟨k| over an orthonormal basis?', ['Zero', 'The identity matrix', 'A projector of rank 1', 'The trace'], 1, 'This completeness relation expresses that the basis covers the whole space.'],
    ['Which property characterizes a projector?', ['P² = 0', 'P² = P and P† = P', 'P†P = I', 'det P = 1'], 1, 'Projecting twice is the same as projecting once.'],
    ['What is the probability of outcome b when measuring |ψ⟩ with projector P = |b⟩⟨b|?', ['⟨b|b⟩', '⟨ψ|P|ψ⟩ = |⟨b|ψ⟩|²', 'Tr P', 'P|ψ⟩'], 1, 'Afterwards the state is P|ψ⟩ rescaled to length 1.'],
    ['What is the trace of a matrix?', ['Its largest entry', 'The sum of its diagonal entries, equal to the sum of its eigenvalues', 'Its determinant', 'The number of rows'], 1, 'It does not depend on the basis, because similar matrices share eigenvalues.'],
    ['Which identity does the trace satisfy?', ['Tr(AB) = Tr(A)Tr(B)', 'Tr(AB) = Tr(BA)', 'Tr(A + B) = Tr(A)Tr(B)', 'Tr(A) = det A'], 1, 'Cyclicity is what makes ⟨ψ|A|ψ⟩ = Tr(A|ψ⟩⟨ψ|) work.'],
    ['How is an expectation value written with a density matrix ρ?', ['⟨A⟩ = det(Aρ)', '⟨A⟩ = Tr(Aρ)', '⟨A⟩ = Tr(A) + Tr(ρ)', '⟨A⟩ = ρA'], 1, 'For a pure state ρ = |ψ⟩⟨ψ| this reduces to ⟨ψ|A|ψ⟩.'],
    ['What is the reduced state of one qubit of the Bell state (|00⟩ + |11⟩)/√2?', ['|0⟩⟨0|', 'I/2, completely mixed', '|+⟩⟨+|', 'The Bell state itself'], 1, 'Each qubit alone is random; the information is in the correlations.'],
    ['How do you take the partial trace over q1 of a two-qubit density matrix written in 2×2 blocks indexed by q0?', ['Take the determinant of each block', 'Replace each block by its trace', 'Keep only the top-left block', 'Multiply the blocks'], 1, 'The result is a 2×2 matrix describing q0 alone.']
  ])
});

/* ---------- 8 · matrix exponentials ---------- */
const GEN = { X: { n: 'X', m: M.X }, Y: { n: 'Y', m: M.Y }, Z: { n: 'Z', m: M.Z }, Hax: { n: '(X + Z)/√2', m: [[S2, 0], [S2, 0], [S2, 0], [-S2, 0]] } };
const cscal = (A, z) => A.map(q => C2.mul(q, z));
const cadd = (A, B) => A.map((q, i) => C2.add(q, B[i]));
function expSeries(G, th, K) { let term = M.I, S = M.I.map(z => [0, 0]); const step = cscal(G, [0, -th / 2]); for (let k = 0; k < K; k++) { S = cadd(S, term); term = cscal(C2.mm(term, step), [1 / (k + 1), 0]); } return S; }
const expExact = (G, th) => cadd(cscal(M.I, [Math.cos(th / 2), 0]), cscal(G, [0, -Math.sin(th / 2)]));
const opErr = (A, B) => Math.max(...A.map((z, i) => Math.hypot(z[0] - B[i][0], z[1] - B[i][1])));

LESSONS.push({
  id: 'laexp', n: 8, stage: LIN, minutes: 15, title: 'Matrix exponentials: from Hamiltonians to gates',
  lede: 'Physics specifies how a system changes through its Hamiltonian, a Hermitian matrix. Turning that into a gate takes the exponential of a matrix. For Pauli matrices the exponential is a rotation, and when two pieces of a Hamiltonian do not commute the exponential does not split, which is what Trotter steps approximate.',
  html: `
<h2>The exponential of a matrix</h2>
<p>For numbers, ${m('eˣ = 1 + x + x²/2! + x³/3! + …')}. The same series works for any square matrix, with powers meaning repeated multiplication:</p>
${EQ('e<sup>A</sup> = I + A + A²/2! + A³/3! + …')}
<p>It always converges. If ${m('A')} is diagonal, ${m('e^A')} just exponentiates each diagonal entry; if ${m('A = PDP⁻¹')}, then ${m('e^A = P e^D P⁻¹')}, so the exponential acts on the eigenvalues and keeps the eigenvectors ([[L:laeigen]]).</p>
<h2>Pauli exponentials are rotations</h2>
<p>A Pauli matrix squares to the identity, ${m('P² = I')}, so its powers alternate between ${m('I')} and ${m('P')}. Split the series into even and odd terms and the cosine and sine series appear:</p>
${EQ('e<sup>−iθP/2</sup> = cos(θ/2) I − i sin(θ/2) P')}
<p>These are exactly the rotation gates ${m('R<sub>x</sub>(θ), R<sub>y</sub>(θ), R<sub>z</sub>(θ)')} ([[L:gates]]), and the same holds for any axis, ${m('P = n·σ')}. It is the matrix version of Euler’s formula ${m('e^(iθ) = cos θ + i sin θ')} ([[L:complex]]).</p>
${LAB('series')}
<h2>Hamiltonians make gates</h2>
<p>The Schrödinger equation ${m('i d|ψ⟩/dt = H|ψ⟩')} (with ${m('ħ = 1')}) is solved by</p>
${EQ('|ψ(t)⟩ = e<sup>−iHt</sup> |ψ(0)⟩')}
<p>Because ${m('H')} is Hermitian, ${m('e^(−iHt)')} is unitary ([[L:launitary]]). An energy eigenstate with energy ${m('E')} only picks up the phase ${m('e^(−iEt)')}, which is what phase estimation reads out ([[L:qpe]]). Real qubits are driven by Hamiltonians: a microwave pulse of the right length implements ${m('e^(−iθX/2)')} ([[L:pulses]]).</p>
<h2>When exponents do not commute</h2>
<p>For numbers ${m('e^(a+b) = e^a e^b')}. For matrices this holds only if ${m('A')} and ${m('B')} commute. Otherwise the Baker–Campbell–Hausdorff formula adds correction terms, ${m('e^A e^B = e^(A + B + [A,B]/2 + …)')}. Simulating ${m('H = A + B')} with gates for ${m('A')} and ${m('B')} separately therefore uses <strong>Trotter steps</strong>:</p>
${EQ('e<sup>−i(A+B)t</sup> ≈ (e<sup>−iAt/n</sup> e<sup>−iBt/n</sup>)<sup>n</sup>')}
<p>with an error that shrinks like ${m('t²‖[A,B]‖/n')}. The symmetric version ${m('e^(−iBt/2n) e^(−iAt/n) e^(−iBt/2n)')} has error falling like ${m('1/n²')}. This trade-off between accuracy and circuit depth runs through all of Hamiltonian simulation ([[L:qpe]], [[L:analog]]).</p>
${LAB('trotter')}
`,
  labs: {
    series: {
      title: 'Summing the exponential series',
      cap: 'Choose a generator P and an angle θ, then keep K terms of the series for e^(−iθP/2). The readout compares the partial sum with the exact cos(θ/2)I − i sin(θ/2)P; the plot shows the error as terms are added. Large angles need more terms before the factorials win. The Bloch sphere shows the exact rotation of |0⟩ (dashed ring) and what the truncated series does (arrow, normalized).',
      build(body, id) {
        let gk = 'Hax', th = 2.5, K = 4;
        const sph = canvas('sq', 'max-width:270px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: false }), pc = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const pp = painter(pc, ({ ctx, w, h: H }) => { const T = Theme.get(), G = GEN[gk].m, E = expExact(G, th), Ax = axes(ctx, w, H, { x: [1, 16], y: [1e-12, 10], ylog: true, xt: [1, 4, 8, 12, 16], yt: [1e-12, 1e-8, 1e-4, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'terms kept K', yl: 'error', pad: { l: 46, b: 30 } });
          const pts = []; for (let k = 1; k <= 16; k++) pts.push([Ax.X(k), Ax.Y(clamp(opErr(expSeries(G, th, k), E), 1e-12, 10))]); polyline(ctx, pts, T.copper, 2.4); pts.forEach((p, i) => dot(ctx, p[0], p[1], i + 1 === K ? 6 : 3, i + 1 === K ? T.ink : T.copper)); });
        const up = () => { const G = GEN[gk].m, S = expSeries(G, th, K), E = expExact(G, th), s0 = [S[0], S[2]], nr = Math.hypot(...s0[0], ...s0[1]), b = LA.bloch(s0.map(z => [z[0] / nr, z[1] / nr])), be = LA.bloch([E[0], E[2]]);
          bv.v = b; bv.target = be; bv.inv(); pp.inv(); const SdS = LA.mm(LA.dag(S, 2), S, 2);
          ro.innerHTML = `<span class="k">partial sum (K = ${K}) </span>${LA.cm(S, 2, 3)} <span class="k">exact </span>${LA.cm(E, 2, 3)}<br><span class="k">largest entry error </span>${sci(opErr(S, E), 2)}<br><span class="k">length of S|0⟩ </span>${num(nr, 4)} <span class="k">(1 for a unitary) · S†S deviates from I by </span>${sci(opErr(SdS, M.I), 1)}`; };
        body.append(h('div', { class: 'btns' }, seg(Object.keys(GEN).map(k => ({ v: k, label: 'P = ' + GEN[k].n })), gk, v => { gk = v; up(); }, 'Generator')), h('div', { class: 'split' }, h('div', { class: 'stack' }, sph, ro), h('div', { class: 'stack' }, pc,
          LA.sl(id('t'), 'Angle θ', 0, 4 * PI, .01, th, v => num(deg(v), 0) + '°', v => { th = v; up(); }), LA.sl(id('k'), 'Terms kept K', 1, 16, 1, K, String, v => { K = v; up(); }))));
        up();
      }
    },
    trotter: {
      title: 'Trotter steps for a Hamiltonian that does not commute',
      cap: 'H = aX + bZ applied to |0⟩. The exact evolution e^(−iHt) is a rotation about the tilted axis (cyan path, dashed ring at the end). Trotter steps alternate rotations about Z and about X (copper path). More steps hug the exact path; the error plot falls like 1/n² in infidelity for first order and 1/n⁴ for the symmetric second-order formula. Set a or b to zero and the pieces commute: one step is exact.',
      build(body, id) {
        let a = 1, b = .8, t = 1.6, n = 4, ord = 1;
        const sph = canvas('sq', 'max-width:290px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: false }), pc = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const exact = tt => { const hm = Math.hypot(a, b) || 1e-12, nn = [a / hm, 0, b / hm]; return Rn2(nn, 2 * hm * tt); };
        const trot = (nn, collect) => { let U = M.I; const tau = t / nn, path = []; const zr = Rz(2 * b * tau), xr = Rx(2 * a * tau), zh = Rz(b * tau);
          for (let k = 0; k < nn; k++) { if (ord === 1) { U = C2.mm(zr, U); if (collect) path.push(C2.bloch0(U)); U = C2.mm(xr, U); } else { U = C2.mm(zh, U); U = C2.mm(xr, U); if (collect) path.push(C2.bloch0(U)); U = C2.mm(zh, U); } if (collect) path.push(C2.bloch0(U)); } return { U, path }; };
        const infid = nn => 1 - C2.overlap(trot(nn).U, exact(t)) ** 2;
        const pp = painter(pc, ({ ctx, w, h: H }) => { const T = Theme.get(), Ax = axes(ctx, w, H, { x: [1, 64], y: [1e-10, 1], xlog: true, ylog: true, xt: [1, 2, 4, 8, 16, 32, 64], yt: [1e-10, 1e-7, 1e-4, 1e-1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'Trotter steps n', yl: 'infidelity', pad: { l: 46, b: 30 } });
          const pts = []; for (let k = 1; k <= 64; k = Math.max(k + 1, Math.round(k * 1.2))) pts.push([Ax.X(k), Ax.Y(clamp(infid(k), 1e-10, 1))]); polyline(ctx, pts, T.copper, 2.4);
          dot(ctx, Ax.X(n), Ax.Y(clamp(infid(n), 1e-10, 1)), 6, T.ink, T.surface); });
        const up = () => { const E = exact(t), R = trot(n, true), ep = []; for (let k = 0; k <= 60; k++) ep.push({ v: C2.bloch0(exact(t * k / 60)), r: 2, color: Theme.get().cyan });
          bv.v = C2.bloch0(R.U); bv.target = C2.bloch0(E); bv.extra = ep.concat(R.path.filter((_, i) => R.path.length < 140 || i % 2 === 0).map(v => ({ v, r: 2.6, color: Theme.get().copper }))); bv.inv(); pp.inv();
          ro.innerHTML = `<span class="k">[aX, bZ] = −2iab·Y, size </span>${num(2 * Math.abs(a * b), 2)}<br><span class="k">${ord === 1 ? 'first-order' : 'second-order (symmetric)'} Trotter with n = ${n}: infidelity </span>${sci(infid(n), 2)}<br><span class="k">first-order error bound (operator norm) t²‖[A,B]‖/(2n) = </span>${num(t * t * 2 * Math.abs(a * b) / (2 * n), 4)}<br><span class="k">gates used: </span>${ord === 1 ? 2 * n : 2 * n + 1} rotations`; };
        body.append(h('div', { class: 'btns' }, seg([{ v: 1, label: 'First order' }, { v: 2, label: 'Second order (symmetric)' }], ord, v => { ord = v; up(); }, 'Order')), h('div', { class: 'split' }, h('div', { class: 'stack' }, sph, ro), h('div', { class: 'stack' }, pc,
          LA.sl(id('a'), 'a (strength of X)', 0, 2, .05, a, v => num(v, 2), v => { a = v; up(); }), LA.sl(id('b'), 'b (strength of Z)', 0, 2, .05, b, v => num(v, 2), v => { b = v; up(); }),
          LA.sl(id('t'), 'Time t', 0, 3, .02, t, v => num(v, 2), v => { t = v; up(); }), LA.sl(id('n'), 'Trotter steps n', 1, 40, 1, n, String, v => { n = v; up(); }))));
        up();
      }
    }
  },
  take: ['The matrix exponential e^A = Σ Aᵏ/k! always converges; for diagonalizable A it exponentiates the eigenvalues and keeps the eigenvectors.',
    'Because Paulis square to I, e^(−iθP/2) = cos(θ/2)I − i sin(θ/2)P: the rotation gates.',
    'The Schrödinger equation gives |ψ(t)⟩ = e^(−iHt)|ψ(0)⟩; Hermitian H makes the evolution unitary, and energy eigenstates gain phases e^(−iEt).',
    'e^(A+B) ≠ e^A e^B unless [A, B] = 0; Trotter steps approximate it with error ∝ t²‖[A,B]‖/n, or 1/n² for the symmetric formula.'],
  quiz: QZ([
    ['What is e^A for a diagonal matrix A?', ['A with every entry squared', 'The diagonal matrix of e raised to each diagonal entry', 'The identity', 'A itself'], 1, 'Powers of a diagonal matrix act entry by entry, so the series does too.'],
    ['What is e^(−iθX/2)?', ['cos θ · X', 'cos(θ/2)I − i sin(θ/2)X, the rotation Rx(θ)', 'e^(−iθ/2) X', 'I − iθX'], 1, 'X² = I splits the series into cosine and sine parts.'],
    ['Why does the series for e^(−iθP/2) split into cosine and sine?', ['P is diagonal', 'P² = I, so even powers are I and odd powers are P', 'P is zero', 'θ is small'], 1, 'Even terms build cos(θ/2)I, odd terms build −i sin(θ/2)P.'],
    ['What solves the Schrödinger equation i d|ψ⟩/dt = H|ψ⟩?', ['|ψ(t)⟩ = H t |ψ(0)⟩', '|ψ(t)⟩ = e^(−iHt)|ψ(0)⟩', '|ψ(t)⟩ = |ψ(0)⟩/t', '|ψ(t)⟩ = e^(Ht)|ψ(0)⟩'], 1, 'Differentiating e^(−iHt)|ψ(0)⟩ brings down −iH, which solves the equation (with ħ = 1).'],
    ['Why is e^(−iHt) unitary?', ['Because t is real and H is Hermitian', 'Because every exponential is unitary', 'Because H is unitary', 'It is not'], 0, '(e^(−iHt))† = e^(iHt), its inverse, when H† = H.'],
    ['What happens to an energy eigenstate under e^(−iHt)?', ['It changes into another eigenstate', 'It only gains a phase e^(−iEt)', 'It is measured', 'It decays'], 1, 'Eigenvectors are kept; eigenvalues become phases.'],
    ['When does e^(A+B) = e^A e^B hold for matrices?', ['Always', 'When A and B commute', 'When both are Hermitian', 'Never'], 1, 'Otherwise the BCH formula adds commutator terms.'],
    ['How does first-order Trotter error scale with the number of steps n?', ['It grows with n', 'Like 1/n', 'Like 1/n³', 'It is independent of n'], 1, 'The error bound is about t²‖[A,B]‖/(2n), so doubling n halves it.'],
    ['What does the symmetric (second-order) Trotter formula improve?', ['It needs no gates', 'Its error falls like 1/n² instead of 1/n', 'It removes the need for commutators', 'It makes H Hermitian'], 1, 'Splitting B into halves around A cancels the leading error term.'],
    ['If H = aX + bZ with b = 0, how many Trotter steps are needed?', ['Infinitely many', 'One: with a single term there is nothing to commute', 'Exactly ten', 'It cannot be simulated'], 1, 'The pieces trivially commute, so the product formula is exact.']
  ])
});

/* ---------- 9 · singular values and Schmidt ---------- */
const SPRE = { sh: { n: 'Shear', m: [1, 1, 0, 1] }, sr: { n: 'Stretch and turn', m: [1.6, -.5, .9, .6] }, r1: { n: 'Rank 1', m: [1, 2, .5, 1] }, rot: { n: 'Rotation', m: [Math.cos(.7), -Math.sin(.7), Math.sin(.7), Math.cos(.7)] }, refl: { n: 'With a reflection', m: [1.2, .4, .5, -.8] } };
function svd2(Mm) {
  const [p, q, r, s] = Mm, a = p * p + r * r, b = p * q + r * s, d = q * q + s * s, phi = .5 * Math.atan2(2 * b, a - d), mid = (a + d) / 2, rad = Math.hypot((a - d) / 2, b), l1 = mid + rad, l2 = Math.max(0, mid - rad);
  const v1 = [Math.cos(phi), Math.sin(phi)], v2 = [-Math.sin(phi), Math.cos(phi)], s1 = Math.sqrt(l1), s2 = Math.sqrt(l2);
  const Mv = v => [p * v[0] + q * v[1], r * v[0] + s * v[1]], u1 = s1 > 1e-9 ? Mv(v1).map(x => x / s1) : [1, 0], det = p * s - q * r;
  const u2 = s2 > 1e-9 ? Mv(v2).map(x => x / s2) : (det >= 0 ? [-u1[1], u1[0]] : [u1[1], -u1[0]]);
  return { s1, s2, v1, v2, u1, u2, phi, det };
}
function makeImage(kind, N) {
  const A = [...Array(N)].map(() => new Float64Array(N)), r = rng(9);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = (j + .5) / N, y = (i + .5) / N; let v;
    if (kind === 'pic') { v = .25 + .35 * x; const rr = Math.hypot(x - .45, y - .5); if (Math.abs(rr - .28) < .045) v = .95; if (Math.abs(x - y) < .035 && x > .1 && x < .9) v = .7; if (x > .66 && x < .88 && y > .1 && y < .32) v = .05; if (rr < .1) v = .85; }
    else if (kind === 'sep') v = (.5 + .5 * Math.sin(7 * x)) * (.4 + .6 * Math.exp(-8 * (y - .5) ** 2));
    else v = r();
    A[i][j] = v; }
  return A;
}
function svdN(A) {
  const N = A.length, G = new Float64Array(N * N); for (let a = 0; a < N; a++) for (let b = a; b < N; b++) { let s = 0; for (let i = 0; i < N; i++) s += A[i][a] * A[i][b]; G[a * N + b] = G[b * N + a] = s; }
  const { w, V } = eigSymV(G, N), idx = [...Array(N).keys()].sort((x, y) => w[y] - w[x]), sig = idx.map(k => Math.sqrt(Math.max(0, w[k])));
  const Vs = idx.map(k => Float64Array.from({ length: N }, (_, i) => V[i * N + k])), Us = Vs.map((v, m2) => { const u = new Float64Array(N); if (sig[m2] < 1e-10) return u; for (let i = 0; i < N; i++) { let s = 0; for (let j = 0; j < N; j++) s += A[i][j] * v[j]; u[i] = s / sig[m2]; } return u; });
  return { sig, Us, Vs };
}

LESSONS.push({
  id: 'lasvd', n: 9, stage: LIN, minutes: 16, title: 'Singular values and the Schmidt decomposition',
  lede: 'Every matrix, square or not, does the same three things: it rotates, stretches along perpendicular axes, and rotates again. The stretch factors, the singular values, measure how much a matrix really does, give the best compressed version of it, and, applied to a two-part quantum state, measure exactly how entangled it is.',
  html: `
<h2>Rotate, stretch, rotate</h2>
<p>The <strong>singular value decomposition</strong> (SVD) writes any matrix as</p>
${EQ('M = U Σ V†')}
<p>with ${m('U')} and ${m('V')} unitary (rotations, possibly with a reflection) and ${m('Σ')} diagonal with non-negative entries ${m('σ₁ ≥ σ₂ ≥ … ≥ 0')}, the <strong>singular values</strong>. Geometrically, ${m('M')} maps the unit circle to an ellipse: the right singular vectors ${m('v<sub>k</sub>')} (columns of ${m('V')}) go to ${m('σ<sub>k</sub>u<sub>k</sub>')}, the axes of the ellipse. The singular values are the square roots of the eigenvalues of ${m('M†M')}. Unlike eigenvalues they always exist, are always real and non-negative, and work for rectangular matrices too.</p>
<p>The number of nonzero singular values is the <strong>rank</strong>, ${m('σ₁')} is the largest factor by which ${m('M')} can stretch a vector, and the product of the singular values is ${m('|det M|')}. A unitary matrix has all singular values equal to 1: it rotates without stretching.</p>
${LAB('ellipse')}
<h2>The best low-rank approximation</h2>
<p>The SVD splits a matrix into a sum of rank-one pieces, ${m('M = Σ σ<sub>k</sub> u<sub>k</sub> v<sub>k</sub>†')}, largest first. Keeping only the first ${m('r')} terms gives the closest possible rank-${m('r')} matrix (the Eckart–Young theorem), with error set by the discarded singular values. If those fall off quickly, a big matrix is described by a few vectors: this is how images compress, how recommendation data is summarized ([[L:dequant]]), and how principal component analysis works ([[L:qpca]]).</p>
${LAB('compress')}
<h2>The Schmidt decomposition</h2>
<p>Write a two-part state ${m('|ψ⟩ = Σ c<sub>ij</sub> |i⟩|j⟩')} with coefficient matrix ${m('C')} ([[L:latensor]]). Taking the SVD ${m('C = UΣV†')} and absorbing ${m('U')} and ${m('V')} into new bases for each part gives the <strong>Schmidt decomposition</strong>:</p>
${EQ('|ψ⟩ = Σ<sub>k</sub> σ<sub>k</sub> |u<sub>k</sub>⟩|v<sub>k</sub>⟩, &nbsp;&nbsp; Σ σ<sub>k</sub>² = 1')}
<p>Every bipartite state is a sum of matched product terms. The number of terms, the <strong>Schmidt rank</strong>, is 1 exactly for product states. The squares ${m('σ<sub>k</sub>²')} are the eigenvalues of both reduced density matrices ([[L:laouter]]), and the <strong>entanglement entropy</strong> is ${m('S = −Σ σ<sub>k</sub>² log₂ σ<sub>k</sub>²')}. A Bell state has two equal Schmidt coefficients, ${m('1/√2')} each, and one ebit of entanglement.</p>
<p>This is also the engine of tensor networks ([[L:tensornet]]). Cutting a chain of qubits in two and taking the SVD gives the Schmidt coefficients across the cut; keeping only the largest ${m('χ')} of them, the bond dimension, compresses the state with a controlled error. States with little entanglement, such as ground states of many one-dimensional systems, compress enormously; highly entangled states, like the random image in the lab, do not.</p>
`,
  labs: {
    ellipse: {
      title: 'Circle to ellipse: the SVD of a 2×2 matrix',
      cap: 'The dashed unit circle and the right singular vectors v₁ (copper) and v₂ (cyan) are mapped by M to the ellipse with axes σ₁u₁ and σ₂u₂. Play the decomposition to watch V† rotate the circle, Σ stretch it along the axes, and U rotate it into place. A rank-1 matrix squashes the circle onto a line (σ₂ = 0).',
      build(body, id) {
        let Mm = SPRE.sr.m.slice(), stage = 3, anim = null;
        const cv = canvas('sq', 'max-width:440px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const rotM = a => [Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a)];
        const lerp = (A, B, t) => A.map((x, i) => x + (B[i] - x) * t);
        const stageM = sg => { const S = svd2(Mm), Vt = rotM(-S.phi), Sg = [S.s1, 0, 0, S.s2], U = [S.u1[0], S.u2[0], S.u1[1], S.u2[1]], A1 = Vt, A2 = mul2(Sg, Vt), A3 = mul2(U, A2);
          if (sg <= 1) return rotM(-S.phi * sg); if (sg <= 2) return lerp(A1, A2, sg - 1); const detU = U[0] * U[3] - U[1] * U[2]; if (detU > 0) { const aU = Math.atan2(U[2], U[0]); return mul2(rotM(aU * (sg - 2)), A2); } return lerp(A2, A3, sg - 2); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), P = LA.plane(ctx, w, H, 2.6, { circle: true }), S = svd2(Mm), Cm = stageM(stage), pts = [];
          for (let k = 0; k <= 96; k++) { const a = TAU * k / 96, q = ap2(Cm, [Math.cos(a), Math.sin(a)]); pts.push([P.X(q[0]), P.Y(q[1])]); }
          ctx.fillStyle = rgba(T.copper, .1); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.fill(); polyline(ctx, pts, T.copper, 2.4);
          LA.vec(ctx, P, ap2(Cm, S.v1), T.copper, 3, stage >= 3 ? 'σ₁u₁' : 'v₁'); LA.vec(ctx, P, ap2(Cm, S.v2), T.cyan, 3, stage >= 3 ? 'σ₂u₂' : 'v₂');
          if (stage >= 3) { LA.vec(ctx, P, S.v1, rgba(T.copper, .4), 2); LA.vec(ctx, P, S.v2, rgba(T.cyan, .4), 2); }
          txt(ctx, ['start: the unit circle', 'after V†: singular vectors on the axes', 'after Σ: stretched by σ₁, σ₂', 'after U: the image of the circle under M'][Math.min(3, Math.round(stage))], 8, 12, { align: 'left', font: '600 11px "JetBrains Mono",monospace', color: T.ink });
        });
        const text = () => { const S = svd2(Mm); ro.innerHTML = `<span class="k">M = </span>${LA.rm([[Mm[0], Mm[1]], [Mm[2], Mm[3]]], 2)}<br><span class="k">σ₁ = </span>${num(S.s1, 3)} <span class="k">σ₂ = </span>${num(S.s2, 3)} <span class="k">· rank </span>${S.s2 > 1e-6 ? 2 : S.s1 > 1e-6 ? 1 : 0}<br><span class="k">|det M| = σ₁σ₂ = </span>${num(S.s1 * S.s2, 3)}${S.det < 0 ? ' (det < 0: a reflection is included)' : ''}<br><span class="k">condition number σ₁/σ₂ </span>${S.s2 > 1e-9 ? num(S.s1 / S.s2, 2) : '∞'}`; };
        const play = () => { stage = 0; anim = { t0: performance.now() }; };
        Scope.tick(now => { if (!anim) return; const t = reduced() ? 3 : (now - anim.t0) / 900; stage = Math.min(3, t); p.inv(); if (t >= 3) { anim = null; stage = 3; } });
        const sl = ['a', 'b', 'c', 'd'].map((k, i) => LA.sl(id(k), `entry ${k}`, -2, 2, .05, Mm[i], v => num(v, 2), v => { Mm[i] = v; stage = 3; anim = null; p.inv(); text(); }));
        const setP = k => { Mm = SPRE[k].m.slice(); sl.forEach((s, i) => s.set(Mm[i])); stage = 3; p.inv(); text(); };
        body.append(h('div', { class: 'btns' }, ...Object.keys(SPRE).map(k => btn(SPRE[k].n, () => setP(k), 'sm'))), h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Play V†, then Σ, then U', play, 'pri')), h('div', { class: 'split even' }, sl[0], sl[1]), h('div', { class: 'split even' }, sl[2], sl[3]), ro)));
        text();
      }
    },
    compress: {
      title: 'Low-rank approximation of an image',
      cap: 'A 48 × 48 greyscale image is a 48 × 48 matrix. Keep only its r largest singular values and watch the approximation sharpen. The bar chart (log scale) shows all singular values with the kept ones in copper. A smooth, structured picture compresses well; a separable pattern is exactly rank 1; random noise needs almost every singular value, just as a highly entangled state needs a large bond dimension.',
      build(body, id) {
        const N = 48; let kind = 'pic', r = 6, D = null, A = null;
        const c1 = canvas('sq', 'max-width:220px;margin:0 auto'), c2 = canvas('sq', 'max-width:220px;margin:0 auto'), sc = canvas('', 'height:150px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const grey = v => { const g = Math.round(255 * clamp(v, 0, 1)); return [g, g, g]; };
        const approx = () => { const R = [...Array(N)].map(() => new Float64Array(N)); for (let k = 0; k < r; k++) { const s = D.sig[k], u = D.Us[k], v = D.Vs[k]; if (s < 1e-12) continue; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) R[i][j] += s * u[i] * v[j]; } return R; };
        let Rk = null;
        const pa = painter(c1, ({ ctx, w, h: H }) => { if (!A) return; drawHeat(ctx, heatImage(N, N, (j, i) => grey(A[i][j])), 0, 0, w, H, false); });
        const pb = painter(c2, ({ ctx, w, h: H }) => { if (!Rk) return; drawHeat(ctx, heatImage(N, N, (j, i) => grey(Rk[i][j])), 0, 0, w, H, false); });
        const ps = painter(sc, ({ ctx, w, h: H }) => { if (!D) return; const T = Theme.get(), Ax = axes(ctx, w, H, { x: [0, N], y: [1e-3, 100], ylog: true, xt: [0, 12, 24, 36, 48], yt: [1e-2, 1, 100], yf: v => v >= 1 ? String(v) : '0.01', xl: 'index k', yl: 'σₖ', pad: { l: 40, b: 28 } }), bw = (Ax.R - Ax.L) / N;
          D.sig.forEach((s, k) => { const y = Ax.Y(clamp(s, 1e-3, 100)); ctx.fillStyle = k < r ? T.copper : rgba(T.cyan, .5); ctx.fillRect(Ax.L + k * bw + .5, y, Math.max(1, bw - 1), Ax.B - y); }); });
        const up = () => { Rk = approx(); pb.inv(); ps.inv(); const tot = D.sig.reduce((s, x) => s + x * x, 0), kept = D.sig.slice(0, r).reduce((s, x) => s + x * x, 0);
          ro.innerHTML = `<span class="k">rank kept r </span>${r} of ${N}<br><span class="k">numbers stored </span>${(r * (2 * N + 1)).toLocaleString()} <span class="k">instead of </span>${(N * N).toLocaleString()}<br><span class="k">relative error </span>${pct(Math.sqrt(Math.max(0, 1 - kept / tot)), 1)} <span class="k">(from the discarded singular values)</span><br><span class="k">numerical rank (σ > 10⁻⁶·σ₁) </span>${D.sig.filter(s => s > 1e-6 * D.sig[0]).length}`; };
        const make = () => { A = makeImage(kind, N); D = svdN(A); pa.inv(); up(); };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'pic', label: 'Picture' }, { v: 'sep', label: 'Separable pattern' }, { v: 'noise', label: 'Random noise' }], kind, v => { kind = v; make(); }, 'Image')),
          h('div', { class: 'split even' }, h('div', { class: 'stack' }, h('div', { style: 'text-align:center;font:600 12px var(--f-mono)' }, 'original'), c1), h('div', { class: 'stack' }, h('div', { style: 'text-align:center;font:600 12px var(--f-mono)' }, 'rank-r approximation'), c2)), sc,
          h('div', { class: 'split' }, LA.sl(id('r'), 'Singular values kept r', 1, N, 1, r, String, v => { r = v; up(); }), ro));
        make();
      }
    }
  },
  take: ['Every matrix factors as M = UΣV†: rotate, stretch by the singular values σ₁ ≥ σ₂ ≥ … ≥ 0, rotate; the unit circle becomes an ellipse with axes σₖuₖ.',
    'Singular values are square roots of the eigenvalues of M†M; their count is the rank, the largest is the maximum stretch, and their product is |det M|.',
    'Keeping the r largest terms gives the best rank-r approximation (Eckart–Young), the basis of compression and PCA.',
    'For a bipartite state the SVD of the coefficient matrix is the Schmidt decomposition; Schmidt rank 1 means product, and S = −Σσₖ² log σₖ² measures entanglement.'],
  quiz: QZ([
    ['What does the SVD M = UΣV† say geometrically?', ['M is diagonal', 'M rotates, stretches along perpendicular axes, then rotates again', 'M is unitary', 'M has no inverse'], 1, 'U and V are rotations (possibly with a reflection); Σ holds the stretch factors.'],
    ['What does a 2×2 matrix do to the unit circle?', ['Leaves it unchanged', 'Maps it to an ellipse with semi-axes σ₁ and σ₂ (possibly flattened to a segment)', 'Maps it to a square', 'Shrinks it to a point always'], 1, 'The right singular vectors map to the axes of the ellipse.'],
    ['How are singular values related to eigenvalues?', ['They are always equal', 'They are the square roots of the eigenvalues of M†M', 'They are the eigenvalues of M + M†', 'They are unrelated'], 1, 'For Hermitian matrices they are the absolute values of the eigenvalues.'],
    ['What are the singular values of a unitary matrix?', ['All zero', 'All equal to 1', 'Its eigenvalues', 'Random'], 1, 'A unitary rotates without stretching, so every stretch factor is 1.'],
    ['What is the rank of a matrix in terms of its SVD?', ['The largest singular value', 'The number of nonzero singular values', 'The sum of singular values', 'The dimension always'], 1, 'Each nonzero singular value contributes one independent direction.'],
    ['What does the Eckart–Young theorem say?', ['Every matrix is invertible', 'Keeping the r largest singular terms gives the closest rank-r matrix', 'Singular values are integers', 'SVD is unique'], 1, 'The error is set by the discarded singular values.'],
    ['In the lab, why does random noise compress badly?', ['It is too bright', 'Its singular values are all similar in size, so no small set captures it', 'It has rank 1', 'It is not a matrix'], 1, 'Structured images have rapidly falling singular values; noise does not.'],
    ['What is the Schmidt decomposition of a two-part state?', ['A sum over all basis states', 'The SVD of its coefficient matrix: |ψ⟩ = Σ σₖ|uₖ⟩|vₖ⟩ with matched orthonormal bases', 'A tensor product of two states', 'A measurement'], 1, 'Every bipartite pure state can be written this way.'],
    ['What Schmidt rank does a product state have?', ['0', '1', '2', 'It depends on the basis'], 1, 'One term, σ₁ = 1, means no entanglement.'],
    ['What are the Schmidt coefficients of the Bell state (|00⟩ + |11⟩)/√2, and its entanglement entropy?', ['1 and 0; 0 ebits', '1/√2 and 1/√2; 1 ebit', '1/2 and 1/2; 2 ebits', '1 and 1; 1 ebit'], 1, 'Both Schmidt weights are 1/2, so S = −2 × (1/2) log₂(1/2) = 1 ebit.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Outer product', 'The matrix |ψ⟩⟨φ| formed by a column times a row.', 'laouter'],
  ['Completeness relation', 'For an orthonormal basis, Σₖ |k⟩⟨k| = I.', 'laouter'],
  ['Trace', 'The sum of the diagonal entries of a square matrix, equal to the sum of its eigenvalues; Tr(AB) = Tr(BA).', 'laouter'],
  ['Matrix exponential', 'e^A = Σ Aᵏ/k!; it turns Hermitian Hamiltonians into unitary evolutions e^(−iHt).', 'laexp'],
  ['Baker–Campbell–Hausdorff formula', 'The expansion e^A e^B = e^(A + B + [A,B]/2 + …), showing why non-commuting exponentials do not simply combine.', 'laexp'],
  ['Singular value decomposition', 'The factorization M = UΣV† of any matrix into rotations and non-negative stretch factors.', 'lasvd'],
  ['Schmidt decomposition', 'Writing a bipartite pure state as Σ σₖ|uₖ⟩|vₖ⟩ with orthonormal sets; the number of terms is the Schmidt rank.', 'lasvd'],
  ['Low-rank approximation', 'Keeping only the largest singular values of a matrix, the best approximation of that rank (Eckart–Young).', 'lasvd']
);
})();
