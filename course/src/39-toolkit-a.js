/* =====================================================================
   Part 0 · The math toolkit (group 11): linear algebra for quantum computing
   Batch A: vectors and Dirac notation, inner products, matrices
   ===================================================================== */
const LA = {
  /* complex flat n×n matrix of [re, im] → HTML matrix */
  cm: (A, n, d = 2) => MX([...Array(n)].map((_, i) => [...Array(n)].map((_, j) => cstr(A[i * n + j][0], A[i * n + j][1], d)))),
  /* complex column vector → HTML matrix */
  cv: (v, d = 2) => MX(v.map(x => [cstr(x[0], x[1], d)])),
  rm: (rows, d = 2) => MX(rows.map(r => r.map(v => num(v, d)))),
  /* a square plane with grid lines; coordinates in [−R, R] */
  plane(ctx, w, h, R, opt = {}) {
    const T = Theme.get(), s = Math.min(w, h) / (2 * R) * .94, cx = w / 2, cy = h / 2, X = x => cx + x * s, Y = y => cy - y * s;
    ctx.lineWidth = 1; ctx.strokeStyle = T.line; ctx.globalAlpha = .55;
    for (let k = -Math.floor(R); k <= R; k++) { ctx.beginPath(); ctx.moveTo(X(k), Y(-R)); ctx.lineTo(X(k), Y(R)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X(-R), Y(k)); ctx.lineTo(X(R), Y(k)); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.strokeStyle = T.muted; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(X(-R), Y(0)); ctx.lineTo(X(R), Y(0)); ctx.moveTo(X(0), Y(-R)); ctx.lineTo(X(0), Y(R)); ctx.stroke();
    if (opt.circle) { ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, s, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    return { s, cx, cy, X, Y, inv: (px, py) => [(px - cx) / s, (cy - py) / s] };
  },
  vec(ctx, P, v, col, lw = 3, label, o = [0, 0]) {
    arrow(ctx, P.X(o[0]), P.Y(o[1]), P.X(o[0] + v[0]), P.Y(o[1] + v[1]), col, lw, 11);
    if (label) txt(ctx, label, P.X(o[0] + v[0]) + (v[0] >= 0 ? 12 : -12), P.Y(o[1] + v[1]) - 10, { color: col, font: '700 13px "JetBrains Mono",monospace' });
  },
  /* qubit state from Bloch angles as a complex 2-vector */
  st: (th, ph) => [[Math.cos(th / 2), 0], [Math.cos(ph) * Math.sin(th / 2), Math.sin(ph) * Math.sin(th / 2)]],
  bloch: ([a, b]) => [2 * (a[0] * b[0] + a[1] * b[1]), 2 * (a[0] * b[1] - a[1] * b[0]), a[0] * a[0] + a[1] * a[1] - b[0] * b[0] - b[1] * b[1]],
  /* ⟨φ|ψ⟩ for complex vectors */
  ip: (p, q) => p.reduce((s, x, i) => C2.add(s, C2.mul(C2.conj(x), q[i])), [0, 0]),
  mv: (A, v) => { const n = v.length; return [...Array(n)].map((_, i) => v.reduce((s, x, j) => C2.add(s, C2.mul(A[i * n + j], x)), [0, 0])); },
  mm: (A, B, n) => { const C = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = [0, 0]; for (let k = 0; k < n; k++) s = C2.add(s, C2.mul(A[i * n + k], B[k * n + j])); C.push(s); } return C; },
  dag: (A, n) => { const C = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C.push(C2.conj(A[j * n + i])); return C; },
  kron: (A, na, B, nb) => { const n = na * nb, C = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C.push(C2.mul(A[Math.floor(i / nb) * na + Math.floor(j / nb)], B[(i % nb) * nb + (j % nb)])); return C; },
  sl: (id, label, min, max, step, value, fmt, on) => slider({ id, label, min, max, step, value, fmt, on })
};
const LIN = 11;

(() => {

/* ---------- 1 · vectors, bases and Dirac notation ---------- */
LESSONS.push({
  id: 'lavectors', n: 1, stage: LIN, minutes: 14, title: 'Vectors, bases and Dirac notation',
  lede: 'A qubit’s state is a vector. Before kets and amplitudes, here is what a vector is, how to add and scale vectors, what a basis is, and why a register of n qubits needs 2ⁿ numbers to describe it.',
  html: `
<h2>Arrows and columns</h2>
<p>A vector in the plane is an arrow from the origin, and it is also a column of two numbers, its components along the ${m('x')} and ${m('y')} axes. Two operations define everything that follows. <strong>Adding</strong> vectors puts them tip to tail, which adds their components. <strong>Scaling</strong> a vector by a number stretches it, and flips it if the number is negative:</p>
${EQ(`${MX([['1'], ['2']])} + ${MX([['3'], ['−1']])} = ${MX([['4'], ['1']])}, &nbsp;&nbsp; 2 ${MX([['1'], ['2']])} = ${MX([['2'], ['4']])}`)}
<p>Nothing requires two components. A vector can be a column of any length ${m('N')}, even when we cannot draw it. In quantum mechanics the components are <strong>complex</strong> numbers ([[L:complex]]), so each one has a size and a phase. The rules for adding and scaling stay the same.</p>
<h2>Linear combinations, span and bases</h2>
<p>Scaling and adding several vectors gives a <strong>linear combination</strong> ${m('c₁a + c₂b')}. The set of everything you can reach this way is the <strong>span</strong> of ${m('a')} and ${m('b')}. Two arrows that do not lie along the same line span the whole plane; two arrows along the same line span only that line, because one is just a multiple of the other, and they are called <strong>linearly dependent</strong>.</p>
<p>A <strong>basis</strong> is a set of independent vectors that spans the space. Every vector is then a unique combination of the basis vectors, and the coefficients are its <strong>coordinates in that basis</strong>. The number of basis vectors is the <strong>dimension</strong>. The same arrow has different coordinates in different bases, which is exactly what happens when a qubit is described in the Z basis or the X basis.</p>
${LAB('span')}
<h2>Dirac notation</h2>
<p>Physicists write a column vector as a <strong>ket</strong>, ${m('|ψ⟩')}. For one qubit the standard basis is</p>
${EQ(`|0⟩ = ${MX([['1'], ['0']])}, &nbsp;&nbsp; |1⟩ = ${MX([['0'], ['1']])}, &nbsp;&nbsp; |ψ⟩ = α|0⟩ + β|1⟩ = ${MX([['α'], ['β']])}`)}
<p>so the familiar qubit state is just a linear combination with complex coefficients, the amplitudes. The <strong>superposition principle</strong> is the statement that any linear combination of valid states is again a valid state, once rescaled to length one: quantum states live in a vector space. Another basis is ${m('|+⟩ = (|0⟩ + |1⟩)/√2')}, ${m('|−⟩ = (|0⟩ − |1⟩)/√2')}, and the same ${m('|ψ⟩')} has different coordinates there.</p>
<p>For ${m('n')} qubits the basis states are all the bit strings, ${m('|00…0⟩')} to ${m('|11…1⟩')}, so the state is a column of ${m('2ⁿ')} complex numbers ([[L:multiqubit]]). Ten qubits need 1,024 numbers and fifty need about ${m('10<sup>15</sup>')}: this is why quantum states are hard to simulate, and why tensor products, the subject of [[L:latensor]], matter so much.</p>
${LAB('basis')}
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Notation</th><th>Name</th><th>What it is</th><th>Lesson</th></tr></thead><tbody>
<tr><td>|ψ⟩</td><td>ket</td><td>a column vector</td><td>this one</td></tr>
<tr><td>⟨ψ|</td><td>bra</td><td>the conjugate transpose: a row of conjugated entries</td><td>[[L:lainner]]</td></tr>
<tr><td>⟨φ|ψ⟩</td><td>inner product</td><td>a complex number measuring overlap</td><td>[[L:lainner]]</td></tr>
<tr><td>A|ψ⟩</td><td>matrix acting on a ket</td><td>a new vector</td><td>[[L:lamatrices]]</td></tr>
<tr><td>|ψ⟩⟨φ|</td><td>outer product</td><td>a matrix</td><td>[[L:laouter]]</td></tr>
<tr><td>|a⟩ ⊗ |b⟩, |ab⟩</td><td>tensor product</td><td>a combined system</td><td>[[L:latensor]]</td></tr>
</tbody></table></div>
`,
  labs: {
    span: {
      title: 'Linear combinations and span',
      cap: 'Drag the tips of a (copper) and b (cyan). The sliders set c₁ and c₂, and the dark arrow is c₁a + c₂b, built tip to tail. Drag the target point: the readout solves for the coefficients that reach it. Make a and b parallel and the span collapses to a line; most targets become unreachable.',
      build(body, id) {
        let a = [2, .6], b = [.7, 1.8], c1 = 1, c2 = 1, tg = [-2.4, 2.1], R = 4;
        const cv = canvas('sq', 'max-width:420px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        let P = null;
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(); P = LA.plane(ctx, w, H, R);
          const det = a[0] * b[1] - a[1] * b[0];
          if (Math.abs(det) < .06) { ctx.strokeStyle = rgba(T.copper, .35); ctx.lineWidth = 8; const L = 20, u = V.unit([a[0], a[1], 0]); ctx.beginPath(); ctx.moveTo(P.X(-L * u[0]), P.Y(-L * u[1])); ctx.lineTo(P.X(L * u[0]), P.Y(L * u[1])); ctx.stroke(); }
          const ca = [c1 * a[0], c1 * a[1]], cb = [c2 * b[0], c2 * b[1]];
          ctx.setLineDash([4, 4]); LA.vec(ctx, P, cb, rgba(T.cyan, .6), 2, null, ca); ctx.setLineDash([]);
          LA.vec(ctx, P, ca, rgba(T.copper, .55), 2);
          LA.vec(ctx, P, a, T.copper, 3, 'a'); LA.vec(ctx, P, b, T.cyan, 3, 'b'); LA.vec(ctx, P, [ca[0] + cb[0], ca[1] + cb[1]], T.ink, 3.2, 'c₁a+c₂b');
          ctx.strokeStyle = T.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P.X(tg[0]), P.Y(tg[1]), 9, 0, TAU); ctx.stroke(); dot(ctx, P.X(tg[0]), P.Y(tg[1]), 3, T.ink); txt(ctx, 'target', P.X(tg[0]), P.Y(tg[1]) - 18, { font: '500 11px "JetBrains Mono",monospace' });
        });
        dragHandles(cv, (x, y) => { if (!P) return null; const q = P.inv(x, y), d = v => Math.hypot(v[0] - q[0], v[1] - q[1]); const opts = [['a', d(a)], ['b', d(b)], ['t', d(tg)]].sort((u, v) => u[1] - v[1]); return opts[0][1] < .6 ? opts[0][0] : null; },
          (k, x, y) => { const q = P.inv(x, y).map(v => clamp(Math.round(v * 10) / 10, -R, R)); if (k === 'a') a = q; else if (k === 'b') b = q; else tg = q; p.inv(); text(); });
        const text = () => { const det = a[0] * b[1] - a[1] * b[0], s = [c1 * a[0] + c2 * b[0], c1 * a[1] + c2 * b[1]];
          let solve = ''; if (Math.abs(det) > 1e-6) { const x1 = (tg[0] * b[1] - tg[1] * b[0]) / det, x2 = (a[0] * tg[1] - a[1] * tg[0]) / det; solve = `target = ${num(x1, 2)}·a + ${num(x2, 2)}·b`; } else solve = 'a and b are parallel: only targets on their line are reachable';
          ro.innerHTML = `<span class="k">a = </span>(${num(a[0], 1)}, ${num(a[1], 1)}) <span class="k">b = </span>(${num(b[0], 1)}, ${num(b[1], 1)})<br><span class="k">c₁a + c₂b = </span>(${num(s[0], 2)}, ${num(s[1], 2)})<br><span class="k">${Math.abs(det) > .06 ? 'independent: they span the plane' : 'dependent: they span only a line'} </span><br><span class="k">${solve}</span>`; };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' },
          LA.sl(id('c1'), 'c₁ (multiple of a)', -2, 2, .05, c1, v => num(v, 2), v => { c1 = v; p.inv(); text(); }),
          LA.sl(id('c2'), 'c₂ (multiple of b)', -2, 2, .05, c2, v => num(v, 2), v => { c2 = v; p.inv(); text(); }),
          h('div', { class: 'btns' }, btn('Make b parallel to a', () => { b = [a[0] * -.8, a[1] * -.8]; p.inv(); text(); }, 'sm'), btn('Reset', () => { a = [2, .6]; b = [.7, 1.8]; p.inv(); text(); }, 'sm')), ro)));
        text();
      }
    },
    basis: {
      title: 'One vector, two bases',
      cap: 'The arrow v stays fixed (drag its tip). Rotate the basis b₁, b₂ (two perpendicular unit vectors). The coordinates of v in that basis are the lengths of its shadows on b₁ and b₂; their squares always add to |v|². At 0° the basis is |0⟩, |1⟩; at 45° it is |+⟩, |−⟩, and the coordinates become the X-basis amplitudes.',
      build(body, id) {
        let v = [.8, .6], phi = PI / 4, P = null;
        const cv = canvas('sq', 'max-width:400px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(); P = LA.plane(ctx, w, H, 1.4, { circle: true });
          const b1 = [Math.cos(phi), Math.sin(phi)], b2 = [-Math.sin(phi), Math.cos(phi)], x1 = v[0] * b1[0] + v[1] * b1[1], x2 = v[0] * b2[0] + v[1] * b2[1];
          ctx.setLineDash([3, 4]); ctx.strokeStyle = T.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(P.X(v[0]), P.Y(v[1])); ctx.lineTo(P.X(x1 * b1[0]), P.Y(x1 * b1[1])); ctx.moveTo(P.X(v[0]), P.Y(v[1])); ctx.lineTo(P.X(x2 * b2[0]), P.Y(x2 * b2[1])); ctx.stroke(); ctx.setLineDash([]);
          LA.vec(ctx, P, [x1 * b1[0], x1 * b1[1]], rgba(T.copper, .5), 6); LA.vec(ctx, P, [x2 * b2[0], x2 * b2[1]], rgba(T.cyan, .5), 6);
          const n0 = Math.abs(phi - PI / 4) < .01 ? ['|+⟩', '|−⟩'] : Math.abs(phi) < .01 ? ['|0⟩', '|1⟩'] : ['b₁', 'b₂'];
          LA.vec(ctx, P, b1, T.copper, 2.4, n0[0]); LA.vec(ctx, P, b2, T.cyan, 2.4, n0[1]); LA.vec(ctx, P, v, T.ink, 3.2, 'v');
        });
        dragHandles(cv, (x, y) => { if (!P) return null; const q = P.inv(x, y); return Math.hypot(q[0] - v[0], q[1] - v[1]) < .25 ? 1 : null; }, (k, x, y) => { const q = P.inv(x, y); v = q.map(t => clamp(t, -1.3, 1.3)); p.inv(); text(); });
        const text = () => { const b1 = [Math.cos(phi), Math.sin(phi)], b2 = [-Math.sin(phi), Math.cos(phi)], x1 = v[0] * b1[0] + v[1] * b1[1], x2 = v[0] * b2[0] + v[1] * b2[1], L2 = v[0] ** 2 + v[1] ** 2;
          ro.innerHTML = `<span class="k">standard coordinates </span>(${num(v[0], 3)}, ${num(v[1], 3)})<br><span class="k">coordinates in the rotated basis </span>(${num(x1, 3)}, ${num(x2, 3)})<br><span class="k">x₁² + x₂² = </span>${num(x1 * x1 + x2 * x2, 3)} <span class="k">= |v|² = </span>${num(L2, 3)}` +
            (Math.abs(L2 - 1) < .02 ? `<br><span class="k">|v| = 1, so as a qubit state: </span>${num(v[0], 2)}|0⟩ + ${num(v[1], 2)}|1⟩${Math.abs(phi - PI / 4) < .01 ? ` = ${num(x1, 2)}|+⟩ + ${num(x2, 2)}|−⟩` : ''}` : `<br><span class="k">tip: put v on the dashed unit circle to read it as a qubit state</span>`); };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' },
          LA.sl(id('p'), 'Basis rotation', 0, PI / 2, PI / 180, phi, v2 => num(deg(v2), 0) + '°', v2 => { phi = v2; p.inv(); text(); }),
          h('div', { class: 'btns' }, btn('Z basis (0°)', () => { phi = 0; p.inv(); text(); }, 'sm'), btn('X basis (45°)', () => { phi = PI / 4; p.inv(); text(); }, 'sm'), btn('Put v on the circle', () => { const L = Math.hypot(...v) || 1; v = [v[0] / L, v[1] / L]; p.inv(); text(); }, 'sm')), ro)));
        text();
      }
    }
  },
  take: ['Vectors can be added tip to tail and scaled; a vector is both an arrow and a column of components, which may be complex.',
    'A basis is a set of independent vectors that spans the space; coordinates depend on which basis you use.',
    'A ket |ψ⟩ = α|0⟩ + β|1⟩ is a linear combination of basis vectors; the superposition principle says quantum states form a vector space.',
    'n qubits need a column of 2ⁿ complex amplitudes, one per bit string.'],
  quiz: QZ([
    ['What is (1, 2) + (3, −1)?', ['(3, −2)', '(4, 1)', '(2, 3)', '(4, 3)'], 1, 'Vectors add component by component, which is the same as placing them tip to tail.'],
    ['What is the span of two vectors that point along the same line?', ['The whole plane', 'Just that line', 'A single point', 'Nothing'], 1, 'One is a multiple of the other, so every combination stays on their common line.'],
    ['What makes a set of vectors a basis?', ['They all have length 1', 'They are linearly independent and span the space', 'They are perpendicular to each other', 'There are exactly two of them'], 1, 'Independence makes coordinates unique; spanning makes every vector reachable. Orthonormality is a convenient extra, not a requirement.'],
    ['What does the ket |0⟩ stand for as a column?', ['(0, 1)', '(1, 0)', '(1, 1)/√2', '(0, 0)'], 1, '|0⟩ and |1⟩ are the two standard unit columns.'],
    ['What does the superposition principle say in linear-algebra terms?', ['States are always real', 'Any linear combination of valid states, once normalized, is a valid state: states form a vector space', 'States cannot be added', 'Only basis states are allowed'], 1, 'That is why α|0⟩ + β|1⟩ is a legitimate state for any normalized α and β.'],
    ['Why do the coordinates of a vector change when the basis rotates?', ['The vector moves', 'Coordinates describe the vector relative to the basis vectors, so a new basis gives new numbers for the same arrow', 'Rotation changes the length', 'They do not change'], 1, 'The arrow is fixed; only its description changes.'],
    ['In the |+⟩, |−⟩ basis, what are the coordinates of |0⟩?', ['(1, 0)', '(1/√2, 1/√2)', '(0, 1)', '(1/2, 1/2)'], 1, 'Adding |+⟩ and |−⟩ cancels the |1⟩ parts: |0⟩ = (|+⟩ + |−⟩)/√2, so both coordinates are 1/√2.'],
    ['How many complex amplitudes describe a general state of 3 qubits?', ['3', '8', '6', '9'], 1, 'There are 2³ = 8 bit strings, one amplitude each.'],
    ['What do the squared coordinates of a vector in a perpendicular unit basis add up to?', ['1 always', 'The squared length of the vector', 'Zero', 'The number of dimensions'], 1, 'That is Pythagoras; for a normalized state the squares are probabilities summing to 1.'],
    ['Why are quantum amplitudes complex rather than real numbers?', ['For convenience only', 'Each amplitude needs a size and a phase, and phases are what make interference work', 'Real numbers are too small', 'They are not; amplitudes are always real'], 1, 'Relative phases between amplitudes decide whether contributions add or cancel.']
  ])
});

/* ---------- 2 · inner products ---------- */
LESSONS.push({
  id: 'lainner', n: 2, stage: LIN, minutes: 15, title: 'Inner products, length and orthogonality',
  lede: 'The inner product turns two vectors into a single number that measures how much they overlap. It defines length and perpendicularity, and in quantum mechanics its squared size is a probability. For complex vectors there is one twist: a complex conjugate.',
  html: `
<h2>The dot product</h2>
<p>For real vectors the dot product multiplies matching components and adds them: ${m('a·b = a₁b₁ + a₂b₂ + …')}. Geometrically it equals ${m('|a||b| cos θ')}, where ${m('θ')} is the angle between the arrows. So it measures alignment: large and positive when they point the same way, zero when they are <strong>orthogonal</strong> (perpendicular), negative when they point apart. The length of a vector comes from dotting it with itself: ${m('|a| = √(a·a)')}.</p>
<h2>Complex vectors need a conjugate</h2>
<p>With complex components the plain product fails: ${m('(i)(i) = −1')}, so a vector would have a negative “squared length”. The fix is to conjugate the first vector. In Dirac notation the conjugated row is the <strong>bra</strong> ${m('⟨φ|')}, and the inner product is</p>
${EQ('⟨φ|ψ⟩ = φ₀* ψ₀ + φ₁* ψ₁ + …')}
<p>Now ${m('⟨ψ|ψ⟩ = |ψ₀|² + |ψ₁|² + …')} is real and positive, and swapping the order conjugates the answer: ${m('⟨ψ|φ⟩ = ⟨φ|ψ⟩*')}. A quantum state is <strong>normalized</strong>, ${m('⟨ψ|ψ⟩ = 1')}. Multiplying a state by a global phase ${m('e^(iα)')} changes ${m('⟨φ|ψ⟩')} only by that phase, so ${m('|⟨φ|ψ⟩|')} and every probability are unchanged ([[L:complex]]).</p>
${LAB('cinner')}
<h2>Orthonormal bases and the Born rule</h2>
<p>A basis whose vectors have length 1 and are mutually orthogonal is <strong>orthonormal</strong>: ${m('⟨b<sub>j</sub>|b<sub>k</sub>⟩ = 1')} if ${m('j = k')} and 0 otherwise. Coordinates in such a basis are just inner products, ${m('c<sub>k</sub> = ⟨b<sub>k</sub>|ψ⟩')}, and their squared sizes add to the squared length of the vector (Parseval’s identity). For a normalized state this is the Born rule ([[L:measurement]], [[L:linalg]]):</p>
${EQ('P(k) = |⟨b<sub>k</sub>|ψ⟩|², &nbsp;&nbsp; Σ<sub>k</sub> P(k) = ⟨ψ|ψ⟩ = 1')}
<p>Orthogonal states can be told apart perfectly by measuring in a basis that contains them both. Non-orthogonal states cannot: no measurement distinguishes them every time, which is the root of both the no-cloning theorem ([[L:cloning]]) and the security of quantum key distribution ([[L:bb84]]). On the Bloch sphere, orthogonal states are antipodal points, and ${m('|⟨φ|ψ⟩|² = (1 + r<sub>φ</sub>·r<sub>ψ</sub>)/2')}.</p>
<h2>Projections and Gram–Schmidt</h2>
<p>The part of ${m('v')} along a unit vector ${m('u')} is ${m('⟨u|v⟩ u')}, its <strong>projection</strong>; what remains, ${m('v − ⟨u|v⟩u')}, is orthogonal to ${m('u')}. Repeating this turns any basis into an orthonormal one, the <strong>Gram–Schmidt</strong> process: normalize the first vector, subtract from the second its projection on the first and normalize, and so on. The <strong>Cauchy–Schwarz inequality</strong> ${m('|⟨φ|ψ⟩| ≤ ‖φ‖ ‖ψ‖')} says an overlap is never bigger than the product of lengths, so for states ${m('|⟨φ|ψ⟩|² ≤ 1')} is always a valid probability.</p>
${LAB('gram')}
`,
  labs: {
    cinner: {
      title: 'The complex inner product as adding arrows',
      cap: 'Two qubit states φ (cyan) and ψ (copper), each set by Bloch angles. The complex plane shows the two terms φ₀*ψ₀ and φ₁*ψ₁ as arrows added tip to tail; their sum (dark) is ⟨φ|ψ⟩, and its squared length is the probability of finding ψ in state φ. Switch off the conjugate to see why it is needed: ⟨ψ|ψ⟩ stops being 1.',
      build(body, id) {
        let tf = 1.2, pf = .4, tp = 2.1, pp = 1.9, conj = true;
        const cc = canvas('sq', 'max-width:330px;margin:0 auto'), sph = canvas('sq', 'max-width:260px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: false }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const prod = (p, q) => p.map((x, i) => C2.mul(conj ? C2.conj(x) : x, q[i]));
        const p = painter(cc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), P = LA.plane(ctx, w, H, 1.2, { circle: true }), f = LA.st(tf, pf), s = LA.st(tp, pp), t = prod(f, s), sum = C2.add(t[0], t[1]);
          LA.vec(ctx, P, t[0], rgba(T.cyan, .9), 2.6, 'φ₀*ψ₀'); LA.vec(ctx, P, t[1], rgba(T.copper, .9), 2.6, 'φ₁*ψ₁', t[0]); LA.vec(ctx, P, sum, T.ink, 3.2); txt(ctx, '⟨φ|ψ⟩', P.X(sum[0] / 2) - 26, P.Y(sum[1] / 2) - 6, { color: T.ink, font: '700 13px "JetBrains Mono",monospace' });
          txt(ctx, 'Re', w - 14, P.cy - 10, { font: '500 11px "JetBrains Mono",monospace' }); txt(ctx, 'Im', P.cx + 14, 12, { font: '500 11px "JetBrains Mono",monospace' });
        });
        const up = () => { const f = LA.st(tf, pf), s = LA.st(tp, pp), t = prod(f, s), sum = C2.add(t[0], t[1]), self = prod(s, s), ss = C2.add(self[0], self[1]);
          bv.v = LA.bloch(s); bv.target = LA.bloch(f); bv.inv(); p.inv();
          ro.innerHTML = `<span class="k">φ = </span>${cstr(...f[0], 2)}|0⟩ + ${cstr(...f[1], 2)}|1⟩<br><span class="k">ψ = </span>${cstr(...s[0], 2)}|0⟩ + ${cstr(...s[1], 2)}|1⟩<br><span class="k">${conj ? '⟨φ|ψ⟩' : 'Σ φᵢψᵢ (no conjugate)'} = </span>${cstr(...sum, 3)} <span class="k">· |·|² = </span>${num(C2.abs2(sum), 3)}<br><span class="k">${conj ? '⟨ψ|ψ⟩' : 'Σ ψᵢψᵢ'} = </span>${cstr(...ss, 3)}${conj ? '' : ' <span style="color:var(--bad)">(not 1: lengths break without the conjugate)</span>'}` +
            (conj ? `<br><span class="k">Bloch check (1 + r_φ·r_ψ)/2 = </span>${num((1 + V.dot(LA.bloch(f), LA.bloch(s))) / 2, 3)}` : ''); };
        body.append(h('div', { class: 'split' }, cc, h('div', { class: 'stack' }, sph, ro)), h('div', { class: 'split even' }, h('div', { class: 'stack' },
          LA.sl(id('tf'), 'φ: polar angle θ', 0, PI, .01, tf, v => num(deg(v), 0) + '°', v => { tf = v; up(); }), LA.sl(id('pf'), 'φ: phase angle', 0, TAU, .01, pf, v => num(deg(v), 0) + '°', v => { pf = v; up(); })),
          h('div', { class: 'stack' }, LA.sl(id('tp'), 'ψ: polar angle θ', 0, PI, .01, tp, v => num(deg(v), 0) + '°', v => { tp = v; up(); }), LA.sl(id('pp'), 'ψ: phase angle', 0, TAU, .01, pp, v => num(deg(v), 0) + '°', v => { pp = v; up(); }),
            field('Conjugate the bra?', seg([{ v: true, label: 'Yes (correct)' }, { v: false, label: 'No' }], conj, v => { conj = v; up(); }, 'Conjugate')))));
        up();
      }
    },
    gram: {
      title: 'Projection and Gram–Schmidt',
      cap: 'Drag the tips of u and v. The copper segment is the projection of v onto the direction of u, the cyan one is the perpendicular remainder; their squared lengths add to |v|². Run Gram–Schmidt to turn u and v into an orthonormal basis e₁, e₂ in three animated steps.',
      build(body, id) {
        let u = [1.6, .5], v = [.6, 1.4], P = null, gs = 0, anim = null;
        const cv = canvas('sq', 'max-width:420px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const geo = () => { const nu = Math.hypot(...u), e1 = [u[0] / nu, u[1] / nu], pr = v[0] * e1[0] + v[1] * e1[1], perp = [v[0] - pr * e1[0], v[1] - pr * e1[1]], np = Math.hypot(...perp), e2 = np > 1e-9 ? [perp[0] / np, perp[1] / np] : [0, 0]; return { nu, e1, pr, perp, np, e2 }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(); P = LA.plane(ctx, w, H, 2.2, { circle: true }); const G = geo();
          if (gs < 3) { LA.vec(ctx, P, u, T.copper, 2.6, 'u'); LA.vec(ctx, P, v, T.cyan, 2.6, 'v');
            ctx.setLineDash([3, 4]); ctx.strokeStyle = T.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(P.X(v[0]), P.Y(v[1])); ctx.lineTo(P.X(G.pr * G.e1[0]), P.Y(G.pr * G.e1[1])); ctx.stroke(); ctx.setLineDash([]);
            LA.vec(ctx, P, [G.pr * G.e1[0], G.pr * G.e1[1]], rgba(T.copper, .55), 6); LA.vec(ctx, P, G.perp, rgba(T.cyan, .55), 6, null, [G.pr * G.e1[0], G.pr * G.e1[1]]); }
          if (gs >= 1) LA.vec(ctx, P, G.e1, T.ink, 3, 'e₁');
          if (gs === 2) LA.vec(ctx, P, G.perp, T.cyan, 3, 'v − ⟨e₁|v⟩e₁');
          if (gs >= 3) { LA.vec(ctx, P, G.e2, T.ink, 3, 'e₂'); LA.vec(ctx, P, u, rgba(T.copper, .35), 2); LA.vec(ctx, P, v, rgba(T.cyan, .35), 2); }
        });
        dragHandles(cv, (x, y) => { if (!P) return null; const q = P.inv(x, y), du = Math.hypot(q[0] - u[0], q[1] - u[1]), dv = Math.hypot(q[0] - v[0], q[1] - v[1]); return Math.min(du, dv) < .35 ? (du < dv ? 'u' : 'v') : null; },
          (k, x, y) => { const q = P.inv(x, y).map(t => clamp(t, -2, 2)); if (k === 'u') u = q; else v = q; gs = 0; p.inv(); text(); });
        const steps = ['', 'Step 1: normalize u to get e₁ = u/|u|.', 'Step 2: subtract the projection, v − ⟨e₁|v⟩e₁, which is orthogonal to e₁.', 'Step 3: normalize it to get e₂. Now ⟨e₁|e₂⟩ = 0 and both have length 1.'];
        const text = () => { const G = geo(); ro.innerHTML = `<span class="k">projection length ⟨e₁|v⟩ </span>${num(G.pr, 3)} <span class="k">· perpendicular length </span>${num(G.np, 3)}<br><span class="k">|proj|² + |perp|² = </span>${num(G.pr * G.pr + G.np * G.np, 3)} <span class="k">= |v|² = </span>${num(v[0] ** 2 + v[1] ** 2, 3)}<br><span class="k">angle between u and v </span>${num(deg(Math.acos(clamp((u[0] * v[0] + u[1] * v[1]) / (G.nu * Math.hypot(...v)), -1, 1))), 1)}°` + (gs ? `<br>${steps[gs]}` : ''); };
        const run = () => { clearTimeout(anim); gs = 0; const tick = () => { if (gs < 3) { gs++; p.inv(); text(); anim = Scope.later(reduced() ? 0 : 1100, tick); } }; tick(); };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Run Gram–Schmidt', run, 'pri'), btn('Clear', () => { gs = 0; p.inv(); text(); }, 'sm')), ro)));
        text();
      }
    }
  },
  take: ['The dot product a·b = |a||b|cos θ measures alignment; zero means orthogonal, and a·a is the squared length.',
    'For complex vectors the bra is conjugated: ⟨φ|ψ⟩ = Σ φᵢ*ψᵢ, which makes ⟨ψ|ψ⟩ real and positive and ⟨ψ|φ⟩ = ⟨φ|ψ⟩*.',
    'In an orthonormal basis, coordinates are inner products and |⟨bₖ|ψ⟩|² are Born-rule probabilities that sum to 1.',
    'Projections split a vector into parallel and perpendicular parts; Gram–Schmidt builds orthonormal bases, and Cauchy–Schwarz keeps overlaps at most 1.'],
  quiz: QZ([
    ['What does a dot product of zero mean for two nonzero real vectors?', ['They are parallel', 'They are orthogonal (perpendicular)', 'They have the same length', 'One of them is zero'], 1, 'a·b = |a||b|cos θ vanishes when θ = 90°.'],
    ['Why is the first vector conjugated in a complex inner product?', ['By convention only', 'So that ⟨ψ|ψ⟩ = Σ|ψᵢ|² is real and non-negative and can define a length', 'To make it faster', 'Because bras are real'], 1, 'Without conjugation, (i)(i) = −1 would give negative “lengths”.'],
    ['What is ⟨1|0⟩ + ⟨0|0⟩?', ['0', '1', '2', 'i'], 1, '|0⟩ and |1⟩ are orthogonal, so the first term is 0, and |0⟩ is normalized, so the second is 1.'],
    ['What is ⟨+|0⟩ for |+⟩ = (|0⟩ + |1⟩)/√2?', ['0', '1/√2', '1', '1/2'], 1, 'Only the |0⟩ component overlaps, with coefficient 1/√2.'],
    ['How does ⟨ψ|φ⟩ relate to ⟨φ|ψ⟩?', ['They are equal', 'It is the complex conjugate', 'It is the negative', 'It is the inverse'], 1, 'Swapping the order conjugates the inner product.'],
    ['What is the Born-rule probability of outcome k in an orthonormal basis {|bₖ⟩}?', ['⟨bₖ|ψ⟩', '|⟨bₖ|ψ⟩|²', '⟨ψ|ψ⟩', 'The k-th amplitude without squaring'], 1, 'Coordinates are inner products, and their squared sizes are probabilities.'],
    ['Does a global phase e^(iα) on |ψ⟩ change |⟨φ|ψ⟩|²?', ['Yes, it doubles it', 'No; it multiplies ⟨φ|ψ⟩ by a phase of size 1', 'Only for real states', 'It makes it zero'], 1, 'That is why global phases are physically invisible.'],
    ['Why can’t two non-orthogonal states be distinguished perfectly?', ['They are identical', 'Any measurement that always identifies one has a nonzero chance of the same outcome for the other, since their overlap is nonzero', 'They have different lengths', 'Measurements are always noisy'], 1, 'Only orthogonal states can sit in different elements of one measurement basis.'],
    ['What does the Gram–Schmidt process produce?', ['Eigenvalues', 'An orthonormal basis spanning the same space as the starting vectors', 'A matrix inverse', 'A determinant'], 1, 'It normalizes and subtracts projections one vector at a time.'],
    ['On the Bloch sphere, where are two orthogonal qubit states?', ['At the same point', 'At antipodal points', '90° apart', 'Anywhere on the equator'], 1, '|⟨φ|ψ⟩|² = (1 + r_φ·r_ψ)/2 vanishes only when r_φ = −r_ψ.']
  ])
});

/* ---------- 3 · matrices ---------- */
const SHAPE_F = [[[0, 0], [0, 2]], [[0, 2], [1.2, 2]], [[0, 1.1], [.8, 1.1]]];
const MPRE = { rot: { n: 'Rotate 90°', m: [0, -1, 1, 0] }, refl: { n: 'Reflect in x-axis', m: [1, 0, 0, -1] }, shear: { n: 'Shear', m: [1, 1, 0, 1] }, scale: { n: 'Stretch x by 2', m: [2, 0, 0, 1] }, proj: { n: 'Project onto x', m: [1, 0, 0, 0] }, swap: { n: 'Swap x and y', m: [0, 1, 1, 0] } };
const mul2 = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];
const ap2 = (A, v) => [A[0] * v[0] + A[1] * v[1], A[2] * v[0] + A[3] * v[1]];

LESSONS.push({
  id: 'lamatrices', n: 3, stage: LIN, minutes: 15, title: 'Matrices: linear maps and their products',
  lede: 'A matrix is a recipe for transforming vectors that respects addition and scaling. Its columns say where the basis vectors go. Multiplying matrices chains transformations, and the order matters, which is why quantum gates generally do not commute.',
  html: `
<h2>Columns are where the basis goes</h2>
<p>A map ${m('A')} is <strong>linear</strong> if ${m('A(c₁x + c₂y) = c₁Ax + c₂Ay')}. Then ${m('A')} is completely fixed by what it does to the basis vectors, because every vector is a combination of them. Write those images as columns and you have the matrix. Multiplying a matrix by a vector takes the matching combination of its columns:</p>
${EQ(`${MX([['a', 'b'], ['c', 'd']])} ${MX([['x'], ['y']])} = x ${MX([['a'], ['c']])} + y ${MX([['b'], ['d']])} = ${MX([['ax + by'], ['cx + dy']])}`)}
<p>Equivalently, each output entry is a row of the matrix dotted with the vector. For a quantum gate the columns are the images of ${m('|0⟩')} and ${m('|1⟩')}: the first column of the Hadamard matrix is ${m('H|0⟩ = |+⟩')} and the second is ${m('H|1⟩ = |−⟩')} ([[L:gates]]).</p>
<h2>Products chain transformations</h2>
<p>Applying ${m('A')} and then ${m('B')} is again linear, and its matrix is the product ${m('BA')}, with entries ${m('(BA)<sub>ij</sub> = Σ<sub>k</sub> B<sub>ik</sub> A<sub>kj</sub>')}: row ${m('i')} of ${m('B')} dotted with column ${m('j')} of ${m('A')}. Note the order: the matrix applied first stands on the right, next to the vector. A circuit that applies ${m('U₁')}, then ${m('U₂')}, then ${m('U₃')} has overall matrix ${m('U₃U₂U₁')}, written in the opposite order from the circuit diagram ([[L:circuits]]).</p>
<p>In general ${m('AB ≠ BA')}. Rotate then reflect is not the same as reflect then rotate. The difference ${m('[A, B] = AB − BA')} is the <strong>commutator</strong>; ${m('XZ = −ZX')} for the Pauli matrices, so ${m('[X, Z] = −2iY')}. Whether operators commute decides which observables can be measured together ([[L:contextuality]]) and how much error a Trotter step makes ([[L:laexp]]).</p>
${LAB('compose')}
<h2>Determinant, inverse and adjoint</h2>
<p>The <strong>determinant</strong> ${m('det A = ad − bc')} is the factor by which ${m('A')} scales areas, negative if it flips orientation. If ${m('det A = 0')} the map squashes the plane onto a line and cannot be undone; otherwise there is an <strong>inverse</strong> ${m('A⁻¹')} with ${m('A⁻¹A = I')}, the identity. Quantum gates are always invertible, with ${m('|det U| = 1')}; measurement is a projection and is not.</p>
<p>The <strong>transpose</strong> ${m('Aᵀ')} swaps rows and columns, and the <strong>conjugate transpose</strong> or adjoint ${m('A† = (Aᵀ)*')} also conjugates every entry. The bra is the adjoint of the ket, ${m('⟨ψ| = |ψ⟩†')}, and ${m('(AB)† = B†A†')}. Matrices equal to their own adjoint, and those whose adjoint is their inverse, are the two families that run quantum mechanics: [[L:launitary]].</p>
${LAB('rowcol')}
<p>On ${m('n')} qubits gates are ${m('2ⁿ × 2ⁿ')} matrices. Fortunately most are built from small pieces by tensor products ([[L:latensor]]), so they never need to be written out in full.</p>
`,
  labs: {
    compose: {
      title: 'Order matters: A then B versus B then A',
      cap: 'Pick two transformations. The left plot applies A first and then B (matrix BA); the right applies B first (matrix AB). The faint letter F is the original. For most pairs the results differ; try a rotation with a reflection, or a stretch with a shear. The shaded square shows how the determinant scales area.',
      build(body, id) {
        let ka = 'rot', kb = 'refl';
        const c1 = canvas('sq', 'max-width:300px;margin:0 auto'), c2 = canvas('sq', 'max-width:300px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const drawWith = (M2, title) => ({ ctx, w, h: H }) => {
          const T = Theme.get(), P = LA.plane(ctx, w, H, 2.6);
          const sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(v => ap2(M2, v)); ctx.fillStyle = rgba(T.cyan, .16); ctx.beginPath(); sq.forEach((q, i) => i ? ctx.lineTo(P.X(q[0]), P.Y(q[1])) : ctx.moveTo(P.X(q[0]), P.Y(q[1]))); ctx.closePath(); ctx.fill();
          ctx.lineCap = 'round'; for (const [a2, b2] of SHAPE_F) { ctx.strokeStyle = rgba(T.ink, .2); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(P.X(a2[0]), P.Y(a2[1])); ctx.lineTo(P.X(b2[0]), P.Y(b2[1])); ctx.stroke(); }
          for (const [a2, b2] of SHAPE_F) { const q1 = ap2(M2, a2), q2 = ap2(M2, b2); ctx.strokeStyle = T.copper; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(P.X(q1[0]), P.Y(q1[1])); ctx.lineTo(P.X(q2[0]), P.Y(q2[1])); ctx.stroke(); }
          txt(ctx, title, 8, 12, { align: 'left', font: '600 12px "JetBrains Mono",monospace', color: T.ink });
        };
        let MBA = [1, 0, 0, 1], MAB = [1, 0, 0, 1];
        const p1 = painter(c1, f => drawWith(MBA, 'A then B  (BA)')(f)), p2 = painter(c2, f => drawWith(MAB, 'B then A  (AB)')(f));
        const up = () => { const A = MPRE[ka].m, B = MPRE[kb].m, BA = mul2(B, A), AB = mul2(A, B); MBA = BA; MAB = AB; p1.inv(); p2.inv();
          const same = BA.every((v, i) => Math.abs(v - AB[i]) < 1e-9), m2 = M2 => LA.rm([[M2[0], M2[1]], [M2[2], M2[3]]], 0);
          ro.innerHTML = `<span class="k">A = </span>${m2(A)} <span class="k">B = </span>${m2(B)}<br><span class="k">BA = </span>${m2(BA)} <span class="k">AB = </span>${m2(AB)}<br><span class="k">${same ? 'these two commute: AB = BA' : 'AB ≠ BA: the order matters'}</span><br><span class="k">det A = </span>${num(A[0] * A[3] - A[1] * A[2], 0)} <span class="k">· det B = </span>${num(B[0] * B[3] - B[1] * B[2], 0)} <span class="k">· det(BA) = det B · det A</span>`; };
        const opts = Object.keys(MPRE).map(k => ({ v: k, label: MPRE[k].n }));
        body.append(h('div', { class: 'split even' }, field('First transformation A', seg(opts, ka, v => { ka = v; up(); }, 'A')), field('Second transformation B', seg(opts, kb, v => { kb = v; up(); }, 'B'))), h('div', { class: 'split even' }, c1, c2), ro);
        up();
      }
    },
    rowcol: {
      title: 'Matrix multiplication, one entry at a time',
      cap: 'Each entry of C = AB is a row of A dotted with a column of B. Step through the entries: the highlighted row and column are multiplied pairwise and summed. Then try the product in the other order, BA, which has a different shape and different entries.',
      build(body, id) {
        let A, B, k = -1, order = 'AB', seed = 3;
        const wrap = h('div', { style: 'display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:center' }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const make = () => { const r = rng(seed), ri = () => Math.floor(r() * 7) - 3; A = [...Array(2)].map(() => [...Array(3)].map(ri)); B = [...Array(3)].map(() => [...Array(2)].map(ri)); k = -1; draw(); };
        const prod = (P, Q) => P.map(row => Q[0].map((_, j) => row.reduce((s, v, t) => s + v * Q[t][j], 0)));
        const grid = (Mx, hl, name) => { const g = h('div', { style: `display:grid;grid-template-columns:repeat(${Mx[0].length},40px);gap:4px` });
          Mx.forEach((row, i) => row.forEach((v, j) => g.append(h('div', { style: `height:36px;display:grid;place-items:center;border-radius:6px;font:600 15px var(--f-mono);background:${hl(i, j) ? 'var(--copper)' : 'var(--surface-2)'};color:${hl(i, j) ? 'var(--on-copper)' : 'var(--ink)'}` }, v === null ? '?' : String(v)))));
          return h('div', { style: 'text-align:center' }, h('div', { style: 'font:600 13px var(--f-mono);margin-bottom:6px' }, name), g); };
        const draw = () => { const [P, Q, nP, nQ] = order === 'AB' ? [A, B, 'A', 'B'] : [B, A, 'B', 'A'], C = prod(P, Q), R = C.length, Cc = C[0].length, i = k >= 0 ? Math.floor(k / Cc) : -1, j = k >= 0 ? k % Cc : -1;
          const shown = C.map((row, a) => row.map((v, b) => a * Cc + b <= k ? v : null));
          wrap.innerHTML = ''; wrap.append(grid(P, (a) => a === i, nP), h('span', { style: 'font:700 20px var(--f-mono)' }, '×'), grid(Q, (a, b) => b === j, nQ), h('span', { style: 'font:700 20px var(--f-mono)' }, '='), grid(shown, (a, b) => a === i && b === j, nP + nQ));
          ro.innerHTML = `<span class="k">${nP} is ${P.length}×${P[0].length}, ${nQ} is ${Q.length}×${Q[0].length}, so ${nP}${nQ} is ${R}×${Cc}</span><br>` + (k >= 0 ? `<span class="k">entry (${i + 1}, ${j + 1}) = row ${i + 1} · column ${j + 1} = </span>${P[i].map((v, t) => `(${v})(${Q[t][j]})`).join(' + ')} = <b>${C[i][j]}</b>` : '<span class="k">press Next entry to start</span>') + (k === R * Cc - 1 ? `<br><span class="k">done. Now switch the order to compare.</span>` : ''); };
        const next = () => { const [P, Q] = order === 'AB' ? [A, B] : [B, A]; const N = P.length * Q[0].length; k = k + 1 >= N ? -1 : k + 1; draw(); };
        body.append(h('div', { class: 'btns' }, btn('Next entry', next, 'pri'), btn('Fill all', () => { const [P, Q] = order === 'AB' ? [A, B] : [B, A]; k = P.length * Q[0].length - 1; draw(); }), btn('New matrices', () => { seed++; make(); }, 'sm'), seg([{ v: 'AB', label: 'Compute AB' }, { v: 'BA', label: 'Compute BA' }], order, v => { order = v; k = -1; draw(); }, 'Order')), wrap, ro);
        make();
      }
    }
  },
  take: ['A linear map is fixed by what it does to the basis vectors; those images are the columns of its matrix.',
    'Multiplying matrices chains maps, with the first map on the right: a circuit U₁, U₂, U₃ has matrix U₃U₂U₁.',
    'Matrix products usually do not commute; the commutator [A, B] = AB − BA measures the failure, as in [X, Z] = −2iY.',
    'The determinant scales area, a zero determinant means no inverse, and the adjoint A† conjugates and transposes; quantum gates are invertible.'],
  quiz: QZ([
    ['What are the columns of a matrix?', ['Random numbers', 'The images of the basis vectors under the map', 'The eigenvalues', 'The rows written sideways'], 1, 'Because every vector is a combination of basis vectors, those images determine everything.'],
    ['What is the first column of the Hadamard matrix?', ['|0⟩', 'H|0⟩ = |+⟩ = (1, 1)/√2', '|1⟩', '(1, −1)/√2'], 1, 'The first column of any matrix is the image of the first basis vector, here H|0⟩.'],
    ['A circuit applies U₁, then U₂, then U₃. What is its overall matrix?', ['U₁U₂U₃', 'U₃U₂U₁', 'U₁ + U₂ + U₃', 'U₂U₁U₃'], 1, 'The first operation acts on the vector first, so it stands rightmost.'],
    ['What is entry (i, j) of the product AB?', ['A_ij·B_ij', 'Row i of A dotted with column j of B', 'Column i of A dotted with row j of B', 'A_ij + B_ij'], 1, '(AB)_ij = Σₖ A_ik B_kj: multiply matching entries of the row and the column, then add.'],
    ['Do matrices generally commute?', ['Yes, always', 'No; AB and BA usually differ', 'Only when they are square', 'Only for real entries'], 1, 'Rotations and reflections, or X and Z, are standard examples.'],
    ['What is XZ in terms of ZX?', ['XZ = ZX', 'XZ = −ZX', 'XZ = 2ZX', 'XZ = I'], 1, 'X and Z anticommute, so [X, Z] = XZ − ZX = 2XZ = −2iY.'],
    ['What does det A = 0 mean?', ['A is the identity', 'A squashes space into a lower dimension and has no inverse', 'A is a rotation', 'A preserves area'], 1, 'Information is lost, so the map cannot be undone.'],
    ['Which of these is not invertible?', ['The Hadamard gate', 'A projection onto |0⟩', 'The X gate', 'A rotation'], 1, 'A projector has determinant 0: it forgets the |1⟩ component.'],
    ['What is (AB)†?', ['A†B†', 'B†A†', 'AB', '(BA)ᵀ'], 1, 'The adjoint reverses the order, just like the transpose.'],
    ['How is a bra related to a ket?', ['They are identical', 'The bra is the adjoint (conjugate transpose) of the ket', 'The bra is the inverse', 'The bra is the transpose without conjugation'], 1, '⟨ψ| = |ψ⟩† is a row of conjugated entries.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Linear combination', 'A sum of vectors each multiplied by a number, c₁a + c₂b + …', 'lavectors'],
  ['Span', 'The set of all linear combinations of some vectors.', 'lavectors'],
  ['Orthonormal basis', 'A basis of mutually orthogonal unit vectors; coordinates in it are inner products.', 'lainner'],
  ['Gram–Schmidt process', 'A procedure that turns independent vectors into an orthonormal basis by subtracting projections and normalizing.', 'lainner'],
  ['Commutator', 'The operator [A, B] = AB − BA; it vanishes exactly when A and B commute.', 'lamatrices'],
  ['Determinant', 'The factor by which a matrix scales volumes; zero exactly when the matrix has no inverse.', 'lamatrices'],
  ['Adjoint', 'The conjugate transpose A† of a matrix; the bra ⟨ψ| is the adjoint of the ket |ψ⟩.', 'lamatrices']
);
})();
