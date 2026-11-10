/* =====================================================================
   Part 0 · The math toolkit, batch B: eigenvalues and eigenvectors,
   Hermitian and unitary matrices, tensor products
   ===================================================================== */
(() => {
const ap2 = (A, v) => [A[0] * v[0] + A[1] * v[1], A[2] * v[0] + A[3] * v[1]];
const csq = z => { const r = Math.sqrt(Math.hypot(z[0], z[1])), a = Math.atan2(z[1], z[0]) / 2; return [r * Math.cos(a), r * Math.sin(a)]; };
const eig2c = A => { const tr = C2.add(A[0], A[3]), det = C2.add(C2.mul(A[0], A[3]), C2.mul([-1, 0], C2.mul(A[1], A[2]))), disc = csq(C2.add(C2.mul(tr, tr), C2.mul([-4, 0], det))); return [[(tr[0] + disc[0]) / 2, (tr[1] + disc[1]) / 2], [(tr[0] - disc[0]) / 2, (tr[1] - disc[1]) / 2]]; };
const EPRE = { sym: { n: 'Symmetric', m: [2, 1, 1, 2] }, shear: { n: 'Shear', m: [1, 1, 0, 1] }, rot: { n: 'Rotation 90°', m: [0, -1, 1, 0] }, proj: { n: 'Projection', m: [1, 0, 0, 0] }, z: { n: 'Pauli Z', m: [1, 0, 0, -1] }, x: { n: 'Pauli X', m: [0, 1, 1, 0] }, gen: { n: 'Lopsided', m: [2, 1, .5, 1] } };

/* ---------- 4 · eigenvalues and eigenvectors ---------- */
LESSONS.push({
  id: 'laeigen', n: 4, stage: LIN, minutes: 16, title: 'Eigenvalues and eigenvectors',
  lede: 'Most vectors are turned by a matrix, but a few special directions are only stretched. These eigenvectors, and their stretch factors, the eigenvalues, are the most important numbers a matrix has: in quantum mechanics they are the possible measurement results and the states left behind.',
  html: `
<h2>Directions that do not turn</h2>
<p>An <strong>eigenvector</strong> of ${m('A')} is a nonzero vector that ${m('A')} only scales:</p>
${EQ('A v = λ v')}
<p>The number ${m('λ')} is its <strong>eigenvalue</strong>. Any multiple of an eigenvector is also one, so really an eigenvector is a direction. For the Pauli matrices: ${m('Z|0⟩ = |0⟩')} and ${m('Z|1⟩ = −|1⟩')}, so ${m('|0⟩, |1⟩')} are eigenvectors of ${m('Z')} with eigenvalues ${m('±1')}; and ${m('X|±⟩ = ±|±⟩')}, so ${m('|+⟩, |−⟩')} are the eigenvectors of ${m('X')}.</p>
<h2>Finding them</h2>
<p>${m('Av = λv')} means ${m('(A − λI)v = 0')} has a nonzero solution, which happens exactly when ${m('A − λI')} squashes space, so its determinant vanishes ([[L:lamatrices]]). For a 2×2 matrix this <strong>characteristic equation</strong> is a quadratic:</p>
${EQ('det(A − λI) = λ² − (tr A) λ + det A = 0')}
<p>where the trace ${m('tr A')} is the sum of the diagonal entries. So the two eigenvalues add up to the trace and multiply to the determinant. A real matrix can have complex eigenvalues: a rotation by 90° turns every real vector, and its eigenvalues are ${m('±i')}. A shear has only one eigenvector direction.</p>
${LAB('hunt')}
<h2>Diagonalizing</h2>
<p>If ${m('A')} has a full set of independent eigenvectors, put them as the columns of ${m('P')} and the eigenvalues on the diagonal of ${m('D')}. Then ${m('A = P D P⁻¹')}: in the eigenvector basis, ${m('A')} just scales each coordinate. This makes functions of a matrix easy. ${m('Aᵏ = P Dᵏ P⁻¹')}, and any function, such as the exponential that turns Hamiltonians into gates ([[L:laexp]]), acts on the eigenvalues one by one.</p>
<h2>Hermitian matrices and observables</h2>
<p>A matrix equal to its own adjoint, ${m('A = A†')}, is <strong>Hermitian</strong>. The <strong>spectral theorem</strong> guarantees that a Hermitian matrix has real eigenvalues and an orthonormal basis of eigenvectors, so</p>
${EQ('A = Σ<sub>k</sub> λ<sub>k</sub> |v<sub>k</sub>⟩⟨v<sub>k</sub>|')}
<p>This is the whole theory of measurement in one line. An <strong>observable</strong> is a Hermitian matrix; the possible results are its eigenvalues; the result ${m('λ<sub>k</sub>')} occurs with probability ${m('|⟨v<sub>k</sub>|ψ⟩|²')} and leaves the system in ${m('|v<sub>k</sub>⟩')}; and the average result is the <strong>expectation value</strong></p>
${EQ('⟨A⟩ = ⟨ψ|A|ψ⟩ = Σ<sub>k</sub> λ<sub>k</sub> |⟨v<sub>k</sub>|ψ⟩|²')}
<p>For a qubit every observable has the form ${m('a₀I + r n·σ')}, with eigenvalues ${m('a₀ ± r')} and eigenvectors at the two opposite Bloch-sphere points ${m('±n')}.</p>
${LAB('spectral')}
<p>Eigenvalues are everywhere later on: phase estimation reads the eigenvalues of a unitary ([[L:qpe]]), the ground-state energy of a molecule is the smallest eigenvalue of its Hamiltonian ([[L:variational]], [[L:exactdiag]]), and stabilizer codes are defined as joint eigenvectors of commuting Pauli operators ([[L:stabilizers]]).</p>
`,
  labs: {
    hunt: {
      title: 'Hunting for eigenvectors',
      cap: 'Left: a test vector v (dark) sweeps around the unit circle and Av (copper) follows. When they line up, v is an eigenvector (the cyan lines) and the ratio of lengths is the eigenvalue. Right: the characteristic polynomial λ² − (tr A)λ + det A; its roots are the eigenvalues. For the rotation it never touches zero: the eigenvalues are complex.',
      build(body, id) {
        let A = EPRE.sym.m.slice(), al = .3, sweep = true;
        const c1 = canvas('sq', 'max-width:330px;margin:0 auto'), c2 = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const info = () => { const tr = A[0] + A[3], dt = A[0] * A[3] - A[1] * A[2], disc = tr * tr - 4 * dt; let ev = [], vecs = [];
          if (disc >= -1e-12) { const s = Math.sqrt(Math.max(0, disc)); ev = [(tr + s) / 2, (tr - s) / 2]; vecs = ev.map(l => { const v = Math.abs(A[1]) > 1e-9 ? [A[1], l - A[0]] : Math.abs(A[2]) > 1e-9 ? [l - A[3], A[2]] : (Math.abs(l - A[0]) < 1e-9 ? [1, 0] : [0, 1]); const n = Math.hypot(...v); return [v[0] / n, v[1] / n]; }); }
          return { tr, dt, disc, ev, vecs }; };
        const p1 = painter(c1, ({ ctx, w, h: H }) => {
          const T = Theme.get(), P = LA.plane(ctx, w, H, 3, { circle: true }), I = info();
          ctx.strokeStyle = rgba(T.cyan, .6); ctx.lineWidth = 3; for (const v of I.vecs) { ctx.beginPath(); ctx.moveTo(P.X(-4 * v[0]), P.Y(-4 * v[1])); ctx.lineTo(P.X(4 * v[0]), P.Y(4 * v[1])); ctx.stroke(); }
          const v = [Math.cos(al), Math.sin(al)], Av = ap2(A, v), cross = Math.abs(v[0] * Av[1] - v[1] * Av[0]), aligned = cross < .04 * Math.max(.2, Math.hypot(...Av));
          LA.vec(ctx, P, Av, aligned ? T.good : T.copper, 3, 'Av'); LA.vec(ctx, P, v, T.ink, 3, 'v');
          if (aligned) txt(ctx, 'eigenvector!', 10, 14, { align: 'left', color: T.good, font: '700 13px "JetBrains Mono",monospace' });
        });
        const p2 = painter(c2, ({ ctx, w, h: H }) => {
          const T = Theme.get(), I = info(), f = l => l * l - I.tr * l + I.dt, Ax = axes(ctx, w, H, { x: [-3.5, 3.5], y: [-4, 6], xt: [-3, -2, -1, 0, 1, 2, 3], yt: [-4, 0, 4], xl: 'λ', yl: 'det(A − λI)', pad: { l: 40, b: 30 } });
          polyline(ctx, [[Ax.L, Ax.Y(0)], [Ax.R, Ax.Y(0)]], T.muted, 1.2);
          const pts = []; for (let i = 0; i <= 200; i++) { const l = -3.5 + 7 * i / 200; pts.push([Ax.X(l), Ax.Y(f(l))]); } ctx.save(); ctx.beginPath(); ctx.rect(Ax.L, Ax.T, Ax.R - Ax.L, Ax.B - Ax.T); ctx.clip(); polyline(ctx, pts, T.copper, 2.6); ctx.restore();
          I.ev.forEach(l => { if (Math.abs(l) <= 3.5) { dot(ctx, Ax.X(l), Ax.Y(0), 6, T.cyan, T.surface); txt(ctx, `λ = ${num(l, 2)}`, Ax.X(l), Ax.Y(0) + 18, { color: T.cyan, font: '600 11px "JetBrains Mono",monospace' }); } });
          if (!I.ev.length) txt(ctx, 'no real roots: complex eigenvalues', Ax.X(0), Ax.Y(5), { color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
        });
        const text = () => { const I = info(), ev = I.ev.length ? I.ev.map(l => num(l, 3)).join(', ') : `${num(I.tr / 2, 3)} ± ${num(Math.sqrt(-I.disc) / 2, 3)}i`;
          ro.innerHTML = `<span class="k">A = </span>${LA.rm([[A[0], A[1]], [A[2], A[3]]], 2)}<br><span class="k">trace </span>${num(I.tr, 2)} <span class="k">· det </span>${num(I.dt, 2)}<br><span class="k">eigenvalues </span>${ev}<br>` + (I.vecs.length ? `<span class="k">eigenvectors </span>${I.vecs.map(v => `(${num(v[0], 2)}, ${num(v[1], 2)})`).join(', ')}${I.vecs.length === 2 && Math.abs(I.vecs[0][0] * I.vecs[1][1] - I.vecs[0][1] * I.vecs[1][0]) < 1e-6 ? ' (only one direction)' : ''}` : '<span class="k">no real eigenvector: every real vector is turned</span>') + `<br><span class="k">check: λ₁ + λ₂ = trace, λ₁λ₂ = det</span>`; };
        Scope.tick(() => { if (!sweep || reduced()) return; al = (al + .012) % TAU; p1.inv(); });
        const sl = ['a', 'b', 'c', 'd'].map((k, i) => LA.sl(id(k), `entry ${k}`, -2.5, 2.5, .1, A[i], v => num(v, 1), v => { A[i] = v; p1.inv(); p2.inv(); text(); }));
        const setP = k => { A = EPRE[k].m.slice(); sl.forEach((s, i) => s.set(A[i])); p1.inv(); p2.inv(); text(); };
        body.append(h('div', { class: 'btns' }, ...Object.keys(EPRE).map(k => btn(EPRE[k].n, () => setP(k), 'sm'))), h('div', { class: 'split even' }, c1, c2), h('div', { class: 'split' }, h('div', { class: 'stack' },
          h('div', { class: 'split even' }, sl[0], sl[1]), h('div', { class: 'split even' }, sl[2], sl[3]),
          LA.sl(id('al'), 'Direction of v', 0, TAU, .01, al, v => num(deg(v), 0) + '°', v => { al = v; sweep = false; sw.textContent = 'Sweep'; p1.inv(); }),
          h('div', { class: 'btns' }, (sw = btn('Pause sweep', () => { sweep = !sweep; sw.textContent = sweep ? 'Pause sweep' : 'Sweep'; }, 'sm')))), ro));
        var sw; text();
      }
    },
    spectral: {
      title: 'A qubit observable and its spectral decomposition',
      cap: 'The observable A = a₀I + r n·σ has eigenvectors at the two opposite points ±n of the Bloch sphere (copper for eigenvalue a₀ + r, cyan for a₀ − r). For the state ψ (arrow), the readout computes the probabilities of each result and the expectation value two ways: as ⟨ψ|A|ψ⟩ from the matrix, and as Σ λₖ pₖ.',
      build(body, id) {
        let a0 = 0, r = 1, tn = .9, pn = .6, ts = 2, ps = 2.6;
        const sph = canvas('sq', 'max-width:300px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: false }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const nvec = () => [Math.sin(tn) * Math.cos(pn), Math.sin(tn) * Math.sin(pn), Math.cos(tn)];
        bv.shape = true; bv.drawShape = (ctx, T) => { const n = nvec(), a = bv.proj(n), b = bv.proj(n.map(x => -x)); ctx.strokeStyle = T.muted; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); dot(ctx, a[0], a[1], 7, T.copper); dot(ctx, b[0], b[1], 7, T.cyan); };
        const up = () => { const n = nvec(), s = LA.st(ts, ps), A = [[a0 + r * n[2], 0], [r * n[0], -r * n[1]], [r * n[0], r * n[1]], [a0 - r * n[2], 0]], As = LA.mv(A, s), ex = LA.ip(s, As)[0], b = LA.bloch(s), pp = (1 + V.dot(n, b)) / 2;
          bv.v = b; bv.inv();
          ro.innerHTML = `<span class="k">A = </span>${LA.cm(A, 2)}<br><span class="k">eigenvalues </span><span style="color:var(--copper)">λ₊ = ${num(a0 + r, 2)}</span>, <span style="color:var(--cyan)">λ₋ = ${num(a0 - r, 2)}</span><br><span class="k">eigenvector for λ₊ </span>${ketOfBloch(n)}<br><span class="k">ψ = </span>${ketOfBloch(b)}<br><span class="k">P(λ₊) = |⟨v₊|ψ⟩|² = </span>${num(pp, 3)} <span class="k">· P(λ₋) = </span>${num(1 - pp, 3)}<br><span class="k">⟨ψ|A|ψ⟩ = </span>${num(ex, 3)} <span class="k">· Σ λₖpₖ = </span>${num((a0 + r) * pp + (a0 - r) * (1 - pp), 3)}`; };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, sph, ro), h('div', { class: 'stack' },
          LA.sl(id('a0'), 'Offset a₀ (adds a₀ to both eigenvalues)', -1, 1, .05, a0, v => num(v, 2), v => { a0 = v; up(); }),
          LA.sl(id('r'), 'Strength r (half the gap between eigenvalues)', 0, 1.5, .05, r, v => num(v, 2), v => { r = v; up(); }),
          LA.sl(id('tn'), 'Observable axis n: polar angle', 0, PI, .01, tn, v => num(deg(v), 0) + '°', v => { tn = v; up(); }),
          LA.sl(id('pn'), 'Observable axis n: azimuth', 0, TAU, .01, pn, v => num(deg(v), 0) + '°', v => { pn = v; up(); }),
          LA.sl(id('ts'), 'State ψ: polar angle', 0, PI, .01, ts, v => num(deg(v), 0) + '°', v => { ts = v; up(); }),
          LA.sl(id('ps'), 'State ψ: azimuth', 0, TAU, .01, ps, v => num(deg(v), 0) + '°', v => { ps = v; up(); }))));
        up();
      }
    }
  },
  take: ['An eigenvector is a direction a matrix only stretches: Av = λv; |0⟩, |1⟩ are eigenvectors of Z and |±⟩ of X.',
    'Eigenvalues solve det(A − λI) = 0; for 2×2 matrices they add to the trace and multiply to the determinant, and real matrices can have complex eigenvalues.',
    'Diagonalizing, A = PDP⁻¹, makes powers and functions of A act eigenvalue by eigenvalue.',
    'Hermitian matrices have real eigenvalues and orthonormal eigenvectors (spectral theorem); as observables, eigenvalues are outcomes and ⟨A⟩ = ⟨ψ|A|ψ⟩.'],
  quiz: QZ([
    ['What does Av = λv say about v?', ['A rotates v by λ', 'A only scales v, by the factor λ', 'v is the zero vector', 'A is the identity'], 1, 'Eigenvectors keep their direction (or reverse it if λ < 0).'],
    ['What are the eigenvectors of the Pauli X matrix?', ['|0⟩ and |1⟩', '|+⟩ and |−⟩', '|+i⟩ and |−i⟩', 'X has none'], 1, 'X swaps |0⟩ and |1⟩, so X|+⟩ = |+⟩ and X|−⟩ = −|−⟩: eigenvalues +1 and −1.'],
    ['For a 2×2 matrix, what do the eigenvalues add up to?', ['The determinant', 'The trace (sum of diagonal entries)', 'Zero', 'One'], 1, 'The characteristic polynomial is λ² − (tr A)λ + det A.'],
    ['What is the product of the two eigenvalues of a 2×2 matrix?', ['The trace', 'The determinant', 'The largest entry', '1'], 1, 'Comparing coefficients of the characteristic polynomial gives λ₁λ₂ = det A.'],
    ['Why does a 90° rotation have no real eigenvectors?', ['It is not linear', 'It turns every real vector, so its eigenvalues are complex (±i)', 'Its determinant is 0', 'It has a zero trace only'], 1, 'Its characteristic equation is λ² + 1 = 0, which has no real roots, only ±i.'],
    ['What does the spectral theorem guarantee for a Hermitian matrix?', ['Complex eigenvalues', 'Real eigenvalues and an orthonormal basis of eigenvectors', 'A zero determinant', 'That it is unitary'], 1, 'So A = Σ λₖ|vₖ⟩⟨vₖ|, a weighted sum of projectors onto orthogonal eigenvectors.'],
    ['When an observable A is measured on |ψ⟩, what are the possible results?', ['Any real number', 'The eigenvalues of A', 'The entries of A', 'Only 0 and 1'], 1, 'Outcome λₖ occurs with probability |⟨vₖ|ψ⟩|².'],
    ['What is the expectation value of Z in the state |+⟩?', ['1', '0', '−1', '1/2'], 1, 'Outcomes ±1 are equally likely, so the average is 0.'],
    ['Where are the eigenvectors of the qubit observable n·σ on the Bloch sphere?', ['At the poles always', 'At the two opposite points ±n', 'On the equator', 'At the centre'], 1, 'n·σ has eigenvalues ±1 with eigenvectors pointing along ±n.'],
    ['Why is diagonalizing a matrix useful?', ['It makes the matrix larger', 'In the eigenvector basis the matrix just scales coordinates, so powers and functions act on each eigenvalue', 'It removes the eigenvalues', 'It makes the matrix unitary'], 1, 'For example e^A = P e^D P⁻¹, where e^D just exponentiates the diagonal entries.']
  ])
});

/* ---------- 5 · Hermitian and unitary matrices ---------- */
const UPRE = {
  H: { n: 'Hadamard', m: M.H }, S: { n: 'S gate', m: M.S }, X: { n: 'Pauli X', m: M.X }, Rx: { n: 'Rx(60°)', m: Rx(PI / 3) },
  herm: { n: 'Hermitian, not unitary', m: [[1, 0], [.5, 0], [.5, 0], [-.6, 0]] }, shear: { n: 'Shear', m: [[1, 0], [1, 0], [0, 0], [1, 0]] }, proj: { n: 'Projector |0⟩⟨0|', m: [[1, 0], [0, 0], [0, 0], [0, 0]] }, damp: { n: 'Damped: 0.8 × H', m: M.H.map(z => [.8 * z[0], .8 * z[1]]) }
};
const NPERT = [[.3, 0], [0, .5], [-.2, 0], [.1, .2]];
const randStates = (() => { const r = rng(5); return [...Array(60)].map(() => LA.st(Math.acos(1 - 2 * r()), TAU * r())); })();
function axisAngle(U) {
  const det = C2.add(C2.mul(U[0], U[3]), C2.mul([-1, 0], C2.mul(U[1], U[2]))), al = Math.atan2(det[1], det[0]) / 2, ph = [Math.cos(-al), Math.sin(-al)];
  let Vm = U.map(z => C2.mul(ph, z)); if (Vm[0][0] < 0) Vm = Vm.map(z => [-z[0], -z[1]]);
  const cs = Vm[0][0], sz = -Vm[0][1], sx = -Vm[2][1], sy = Vm[2][0], s = Math.hypot(sx, sy, sz), th = 2 * Math.atan2(s, cs), n = s > 1e-9 ? [sx / s, sy / s, sz / s] : [0, 0, 1];
  const g = 2 * Math.atan2(Math.hypot(...Vm[2]), Math.hypot(...Vm[0])), sum = -2 * Math.atan2(Vm[0][1], Vm[0][0]), dif = Math.hypot(...Vm[2]) > 1e-9 ? 2 * Math.atan2(Vm[2][1], Vm[2][0]) : 0;
  const be = Math.hypot(...Vm[0]) > 1e-9 ? (sum + dif) / 2 : dif, de = Math.hypot(...Vm[0]) > 1e-9 ? (sum - dif) / 2 : 0;
  const kk = Math.hypot(...Vm[0]) >= Math.hypot(...Vm[2]) ? 0 : 2, zz = C2.mul(U[kk], C2.conj(Vm[kk]));
  return { th, n, euler: [be, g, de], Vm, alpha: Math.atan2(zz[1], zz[0]) };
}
const wrapA = a => { a = ((a + PI) % TAU + TAU) % TAU - PI; return a; };

LESSONS.push({
  id: 'launitary', n: 5, stage: LIN, minutes: 15, title: 'Hermitian and unitary matrices',
  lede: 'Two families of matrices run quantum mechanics. Hermitian matrices are the observables and Hamiltonians: they have real eigenvalues. Unitary matrices are the gates and time evolutions: they preserve lengths and angles, so probabilities always add up to one. One family generates the other.',
  html: `
<h2>Two conditions on the adjoint</h2>
<p>Recall the adjoint ${m('A†')}, the conjugate transpose ([[L:lamatrices]]). Two simple conditions on it define the matrices that matter:</p>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Hermitian</th><th>Unitary</th></tr></thead><tbody>
<tr><td>Definition</td><td>H† = H</td><td>U†U = I, so U⁻¹ = U†</td></tr>
<tr><td>Eigenvalues</td><td>real numbers</td><td>complex numbers of size 1, e<sup>iθ</sup></td></tr>
<tr><td>Eigenvectors</td><td>orthonormal basis</td><td>orthonormal basis</td></tr>
<tr><td>Role in quantum mechanics</td><td>observables, Hamiltonians, density matrices</td><td>gates, time evolution, changes of basis</td></tr>
<tr><td>Examples</td><td>X, Y, Z, |0⟩⟨0|, a0·I + r n·σ</td><td>X, Y, Z, H, S, T, CNOT, rotations</td></tr>
</tbody></table></div>
<p>The Pauli matrices are both Hermitian and unitary, which is why they appear both as measurements and as gates. Both families are <strong>normal</strong> (${m('AA† = A†A')}), and normal matrices are exactly those with an orthonormal eigenbasis.</p>
<h2>Why gates must be unitary</h2>
<p>A gate must turn every normalized state into a normalized state, otherwise probabilities would stop adding up to one. A matrix that preserves the length of every vector also preserves every inner product: ${m('⟨Uφ|Uψ⟩ = ⟨φ|U†U|ψ⟩ = ⟨φ|ψ⟩')}. So orthogonal states stay orthogonal, distinguishable states stay distinguishable, and the columns of ${m('U')}, the images of the basis states, are themselves an orthonormal basis. Unitaries are also reversible: running ${m('U†')} undoes ${m('U')}, which is why quantum circuits are reversible apart from measurement ([[L:toffoli]]).</p>
${LAB('unitarity')}
<h2>Hermitian generators</h2>
<p>The two families are linked by the exponential. For any Hermitian ${m('H')}, ${m('U = e^(−iHt)')} is unitary, and every unitary can be written this way. Physically ${m('H')} is the Hamiltonian, the energy observable, and ${m('e^(−iHt)')} is what the system does in time ${m('t')}. The eigenvalues ${m('E')} of ${m('H')} become phases ${m('e^(−iEt)')} on the unit circle. [[L:laexp]] shows how to compute these exponentials.</p>
<h2>Every qubit gate is a rotation</h2>
<p>For a single qubit, every unitary is a rotation of the Bloch sphere, up to a global phase:</p>
${EQ('U = e<sup>iα</sup> (cos(θ/2) I − i sin(θ/2) n·σ) = e<sup>iα</sup> R<sub>n</sub>(θ)')}
<p>a rotation by angle ${m('θ')} about the axis ${m('n')}. Equivalently, every rotation is a product of three rotations about fixed axes, the <strong>Euler decomposition</strong> ${m('U = e^(iα) R<sub>z</sub>(β) R<sub>y</sub>(γ) R<sub>z</sub>(δ)')}. Compilers use exactly this to turn arbitrary gates into native ones ([[L:synthesis]], [[L:pulses]]). The global phase ${m('e^(iα)')} has no observable effect on its own.</p>
${LAB('euler')}
`,
  labs: {
    unitarity: {
      title: 'Is it unitary?',
      cap: 'Choose a matrix and add a non-unitary perturbation if you like. Left: its eigenvalues in the complex plane; unitaries keep them on the unit circle, Hermitian matrices on the real axis. Right: the length of M|ψ⟩ for 60 random normalized states; a unitary keeps every one at exactly 1. The readout shows M†M, which equals I only for unitaries.',
      build(body, id) {
        let key = 'H', eps = 0;
        const c1 = canvas('sq', 'max-width:300px;margin:0 auto'), c2 = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const Mx = () => UPRE[key].m.map((z, i) => [z[0] + eps * NPERT[i][0], z[1] + eps * NPERT[i][1]]);
        const p1 = painter(c1, ({ ctx, w, h: H }) => {
          const T = Theme.get(), P = LA.plane(ctx, w, H, 1.6, { circle: true }), ev = eig2c(Mx());
          ev.forEach((z, i) => { dot(ctx, P.X(z[0]), P.Y(z[1]), 7, i ? T.cyan : T.copper, T.surface); });
          txt(ctx, 'eigenvalues', 8, 12, { align: 'left', font: '600 11px "JetBrains Mono",monospace' }); txt(ctx, 'Re', w - 12, P.cy - 10, { font: '500 11px "JetBrains Mono",monospace' });
        });
        const p2 = painter(c2, ({ ctx, w, h: H }) => {
          const T = Theme.get(), Mm = Mx(), L = randStates.map(s => Math.sqrt(LA.mv(Mm, s).reduce((q, z) => q + C2.abs2(z), 0))), Ax = axes(ctx, w, H, { x: [0, 60], y: [0, 2], xt: [], yt: [0, .5, 1, 1.5, 2], xl: '60 random states', yl: '‖M|ψ⟩‖', pad: { l: 38, b: 24 } });
          polyline(ctx, [[Ax.L, Ax.Y(1)], [Ax.R, Ax.Y(1)]], T.muted, 1.2, [4, 4]); L.forEach((v, i) => dot(ctx, Ax.X(i + .5), Ax.Y(clamp(v, 0, 2)), 3.4, Math.abs(v - 1) < 1e-6 ? T.cyan : T.copper));
        });
        const up = () => { p1.inv(); p2.inv(); const Mm = Mx(), MdM = LA.mm(LA.dag(Mm, 2), Mm, 2), dU = Math.max(...MdM.map((z, i) => Math.hypot(z[0] - (i % 3 === 0 ? 1 : 0), z[1]))), dH = Math.max(...Mm.map((z, i) => { const t = LA.dag(Mm, 2)[i]; return Math.hypot(z[0] - t[0], z[1] - t[1]); })), det = C2.add(C2.mul(Mm[0], Mm[3]), C2.mul([-1, 0], C2.mul(Mm[1], Mm[2])));
          ro.innerHTML = `<span class="k">M = </span>${LA.cm(Mm, 2)} <span class="k">M†M = </span>${LA.cm(MdM, 2)}<br><span class="k">unitary? </span>${dU < 1e-6 ? 'yes: M†M = I' : `no (M†M differs from I by up to ${num(dU, 3)})`}<br><span class="k">Hermitian? </span>${dH < 1e-6 ? 'yes: M† = M' : 'no'}<br><span class="k">|det M| = </span>${num(Math.hypot(...det), 3)}`; };
        body.append(h('div', { class: 'btns' }, seg(Object.keys(UPRE).map(k => ({ v: k, label: UPRE[k].n })), key, v => { key = v; up(); }, 'Matrix')), h('div', { class: 'split even' }, c1, c2),
          h('div', { class: 'split' }, LA.sl(id('e'), 'Non-unitary perturbation ε', 0, 1, .01, eps, v => num(v, 2), v => { eps = v; up(); }), ro));
        up();
      }
    },
    euler: {
      title: 'Every qubit gate is a rotation',
      cap: 'Pick a gate or generate a random unitary. The readout finds its rotation axis n (dashed line), angle θ and global phase, and its Euler angles for Rz·Ry·Rz. Press Apply to watch the gate rotate the state arrow about the axis; applying a random unitary repeatedly traces circles around n.',
      build(body, id) {
        let U = M.H, st = [0, 0, 1], R = axisAngle(U);
        const sph = canvas('sq', 'max-width:300px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: true }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        bv.shape = true; bv.drawShape = (ctx, T) => { const a = bv.proj(R.n), b = bv.proj(R.n.map(x => -x)); ctx.strokeStyle = T.cyan; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); dot(ctx, a[0], a[1], 5, T.cyan); txt(ctx, 'n', a[0] + 10, a[1] - 8, { color: T.cyan, font: '700 13px "JetBrains Mono",monospace' }); };
        const set = Um => { U = Um; R = axisAngle(U); bv.inv();
          const [be, g, de] = R.euler, rec = C2.mm(Rz(be), C2.mm(Ry(g), Rz(de))), ov = C2.overlap(rec, U);
          ro.innerHTML = `<span class="k">U = </span>${LA.cm(U, 2)}<br><span class="k">axis n = </span>(${R.n.map(x => num(x, 2)).join(', ')}) <span class="k">· angle θ = </span>${num(deg(R.th), 1)}°<br><span class="k">global phase α = </span>${num(deg(wrapA(R.alpha)), 1)}°<br><span class="k">Euler: Rz(${num(deg(wrapA(be)), 1)}°) · Ry(${num(deg(g), 1)}°) · Rz(${num(deg(wrapA(de)), 1)}°)</span><br><span class="k">check |Tr(U†·Euler)|/2 = </span>${num(ov, 4)}`; };
        const apply = () => { bv.rotate(R.n, R.th, reduced() ? 0 : 900); st = V.rot(st, R.n, R.th); };
        const rnd = () => { const r = Math.random, z = 1 - 2 * r(), ph = TAU * r(), n = [Math.sqrt(1 - z * z) * Math.cos(ph), Math.sqrt(1 - z * z) * Math.sin(ph), z], a = TAU * r(), Rm = Rn2(n, PI * r()); set(Rm.map(q => C2.mul([Math.cos(a), Math.sin(a)], q))); };
        const PRE = { H: M.H, S: M.S, T: M.T, X: M.X, Y: M.Y, 'Rx(90°)': Rx(PI / 2) };
        body.append(h('div', { class: 'btns' }, ...Object.keys(PRE).map(k => btn(k, () => set(PRE[k]), 'sm')), btn('Random unitary', rnd)),
          h('div', { class: 'split' }, sph, h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Apply U to the state', apply, 'pri'), btn('Reset state', () => { st = [0, 0, 1]; bv.cancel && bv.cancel(); bv.set(st); bv.clearTrail && bv.clearTrail(); }, 'sm')), ro)));
        bv.set(st); set(U);
      }
    }
  },
  take: ['Hermitian matrices (H† = H) have real eigenvalues and describe observables and Hamiltonians.',
    'Unitary matrices (U†U = I) preserve lengths and inner products, have eigenvalues on the unit circle, have orthonormal columns and are reversible: they are the gates.',
    'Hermitian generators give unitaries: U = e^(−iHt), with energies becoming phases e^(−iEt).',
    'Every single-qubit unitary is a Bloch-sphere rotation e^(iα)Rₙ(θ), or equivalently an Euler product Rz·Ry·Rz.'],
  quiz: QZ([
    ['What defines a unitary matrix?', ['U = Uᵀ', 'U†U = I', 'det U = 0', 'All entries are real'], 1, 'Its inverse is its adjoint, so U† undoes U and lengths are preserved.'],
    ['What defines a Hermitian matrix?', ['H†H = I', 'H† = H', 'H² = 0', 'H is diagonal'], 1, 'Hermitian matrices equal their own conjugate transpose.'],
    ['Why must quantum gates be unitary?', ['To be fast', 'They must keep every normalized state normalized, so probabilities still add to 1', 'To be Hermitian', 'Because measurement requires it'], 1, 'Length preservation implies preservation of all inner products.'],
    ['Where do the eigenvalues of a unitary lie?', ['On the real axis', 'On the unit circle in the complex plane', 'At zero', 'Anywhere'], 1, 'Uv = λv together with ‖Uv‖ = ‖v‖ forces |λ| = 1, a pure phase e^(iθ).'],
    ['What kind of numbers are the eigenvalues of a Hermitian matrix?', ['Purely imaginary', 'Real', 'Of size 1 always', 'Complex in general'], 1, 'That is why Hermitian matrices can represent measurable quantities.'],
    ['Which matrix is both Hermitian and unitary?', ['The S gate', 'The Pauli X matrix', 'A projector |0⟩⟨0|', 'The T gate'], 1, 'X† = X and X² = I. S and T are unitary but not Hermitian; a projector is Hermitian but not unitary.'],
    ['What can be said about the columns of a unitary matrix?', ['They are all equal', 'They form an orthonormal basis', 'They sum to zero', 'They are eigenvectors'], 1, 'Each column is the image of a basis state, and U preserves orthonormality.'],
    ['How is a unitary obtained from a Hamiltonian H?', ['U = H²', 'U = e^(−iHt)', 'U = H†', 'U = 1/H'], 1, 'The exponential of −i times a Hermitian matrix is unitary.'],
    ['What does every single-qubit unitary do to the Bloch sphere?', ['Shrinks it', 'Rotates it about some axis, up to a global phase', 'Reflects it through the origin', 'Projects it onto the equator'], 1, 'U = e^(iα)(cos(θ/2)I − i sin(θ/2)n·σ): a rotation by θ about the axis n.'],
    ['What is the Euler decomposition used for?', ['Measuring qubits', 'Writing any single-qubit gate as Rz(β)Ry(γ)Rz(δ), which compilers turn into native pulses', 'Computing eigenvalues', 'Error correction'], 1, 'Three rotations about fixed axes reach any rotation.']
  ])
});

/* ---------- 6 · tensor products ---------- */
const KPRE = { I: M.I, X: M.X, Y: M.Y, Z: M.Z, H: M.H, S: M.S };
const TPRE = { '00': [1, 0, 0, 0, 0], plus0: [S2, 0, S2, 0, 0], plusplus: [.5, .5, .5, .5, 0], zm: [S2, -S2, 0, 0, 0], bell: [S2, 0, 0, S2, 0], psim: [0, S2, -S2, 0, 0], near: [.8, .1, .1, .58, 0] };
const TLAB = { '00': '|00⟩', plus0: '|+⟩|0⟩', plusplus: '|+⟩|+⟩', zm: '|0⟩|−⟩', bell: 'Bell Φ⁺', psim: 'Bell Ψ⁻', near: 'Slightly entangled' };

LESSONS.push({
  id: 'latensor', n: 6, stage: LIN, minutes: 16, title: 'Tensor products: combining systems',
  lede: 'Two qubits are not described by two separate vectors but by one vector in a bigger space, built with the tensor product. Dimensions multiply, which is where the exponential power of quantum computers comes from, and most vectors in the bigger space cannot be split back into two pieces: they are entangled.',
  html: `
<h2>Multiplying spaces</h2>
<p>If one qubit has basis ${m('|0⟩, |1⟩')}, two qubits have basis ${m('|00⟩, |01⟩, |10⟩, |11⟩')}: every pairing of a basis state of the first with a basis state of the second. That combined space is the <strong>tensor product</strong> ${m('ℂ² ⊗ ℂ² = ℂ⁴')}. Dimensions multiply, so ${m('n')} qubits have ${m('2ⁿ')} dimensions ([[L:multiqubit]]). The order is a convention; in this guide the first qubit, q0, is the leftmost digit.</p>
<h2>The Kronecker product of vectors</h2>
<p>When each qubit is in its own state, the joint state is the <strong>Kronecker product</strong>: every amplitude of the first multiplies the whole of the second.</p>
${EQ(`${MX([['a₀'], ['a₁']])} ⊗ ${MX([['b₀'], ['b₁']])} = ${MX([['a₀b₀'], ['a₀b₁'], ['a₁b₀'], ['a₁b₁']])}`)}
<p>For example ${m('|+⟩ ⊗ |0⟩ = (|00⟩ + |10⟩)/√2')}. The product is linear in each factor, and inner products multiply: ${m('⟨a⊗b|c⊗d⟩ = ⟨a|c⟩⟨b|d⟩')}.</p>
<h2>The Kronecker product of matrices</h2>
<p>Operators combine the same way. ${m('A ⊗ B')} is the block matrix whose ${m('(i, j)')} block is ${m('a<sub>ij</sub> B')}, and it acts factor by factor:</p>
${EQ('(A ⊗ B)(|a⟩ ⊗ |b⟩) = A|a⟩ ⊗ B|b⟩, &nbsp;&nbsp; (A ⊗ B)(C ⊗ D) = AC ⊗ BD')}
<p>A gate on one qubit of a register is a tensor product with identities: ${m('X')} on q1 of two qubits is ${m('I ⊗ X')}. Simulators never build these big matrices; they apply the small gate to pairs of amplitudes. But not every operator is a product. CNOT is ${m('|0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ X')}, a <em>sum</em> of products, which is why it can create entanglement ([[L:entanglement]]).</p>
${LAB('kron')}
<h2>Product states and entangled states</h2>
<p>A general two-qubit state ${m('Σ c<sub>ij</sub>|ij⟩')} has four amplitudes. Arrange them in a 2×2 matrix ${m('C')}, rows for q0 and columns for q1. If the state is a product ${m('|a⟩ ⊗ |b⟩')}, then ${m('c<sub>ij</sub> = a<sub>i</sub>b<sub>j</sub>')}, so every row of ${m('C')} is a multiple of the same row: ${m('C')} has rank 1 and</p>
${EQ('det C = c₀₀c₁₁ − c₀₁c₁₀ = 0')}
<p>If ${m('det C ≠ 0')} no factorization exists and the state is <strong>entangled</strong>. The Bell state ${m('(|00⟩ + |11⟩)/√2')} has ${m('det C = 1/2')}, the largest possible. For pure two-qubit states, ${m('2|det C|')} is the concurrence, a standard measure of entanglement ([[L:measures]]). Most states in the big space are entangled: products form a thin subset, which is why entanglement is the generic situation and why simulating quantum systems is hard. [[L:lasvd]] shows how the singular value decomposition of ${m('C')} measures exactly how entangled a state is.</p>
${LAB('entangled')}
`,
  labs: {
    kron: {
      title: 'Building Kronecker products',
      cap: 'Vector mode: set two single-qubit states and watch each amplitude of the first multiply the whole second vector to make the four amplitudes of the pair. Colour shows phase and opacity shows size. Matrix mode: pick two gates; A ⊗ B is a grid of blocks, each block a copy of B scaled by one entry of A.',
      build(body, id) {
        let mode = 'vec', ta = PI / 2, pa = 0, tb = .6, pb = 1.2, ka = 'H', kb = 'X';
        const out = h('div', { style: 'display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;min-height:160px' }), ro = h('div', { class: 'readout', style: 'white-space:normal' }), ctl = h('div', { class: 'stack' });
        const cell = (z, lab, w2 = 92) => { const a = Math.hypot(...z); return h('div', { style: `width:${w2}px;padding:6px 4px;border-radius:8px;text-align:center;font:600 12px var(--f-mono);border:1px solid var(--line);background:${a > 1e-6 ? phaseColor(Math.atan2(z[1], z[0]), .15 + .7 * Math.min(1, a)) : 'transparent'}` }, h('div', { style: 'font-size:10.5px;opacity:.8' }, lab), cstr(z[0], z[1], 2)); };
        const col = (cells, name) => h('div', { style: 'text-align:center' }, h('div', { style: 'font:600 13px var(--f-mono);margin-bottom:6px' }, name), h('div', { style: 'display:grid;gap:4px' }, ...cells));
        const draw = () => { out.innerHTML = '';
          if (mode === 'vec') { const a = LA.st(ta, pa), b = LA.st(tb, pb), ab = [C2.mul(a[0], b[0]), C2.mul(a[0], b[1]), C2.mul(a[1], b[0]), C2.mul(a[1], b[1])];
            out.append(col([cell(a[0], 'a₀', 80), cell(a[1], 'a₁', 80)], '|a⟩'), h('span', { style: 'font:700 20px var(--f-mono)' }, '⊗'), col([cell(b[0], 'b₀', 80), cell(b[1], 'b₁', 80)], '|b⟩'), h('span', { style: 'font:700 20px var(--f-mono)' }, '='), col(['00', '01', '10', '11'].map((k, i) => cell(ab[i], `a${'₀₁'[i >> 1]}b${'₀₁'[i & 1]} · |${k}⟩`, 120)), '|a⟩ ⊗ |b⟩'));
            ro.innerHTML = `<span class="k">|a⟩ = </span>${ketOfBloch(LA.bloch(a))} <span class="k">|b⟩ = </span>${ketOfBloch(LA.bloch(b))}<br><span class="k">|a⟩⊗|b⟩ = </span>${ketString(ab.map(z => z[0]), ab.map(z => z[1]), 2)}<br><span class="k">2 + 2 numbers describe the factors; the pair needs 4 (and n qubits need 2ⁿ)</span>`; }
          else { const A = KPRE[ka], B = KPRE[kb], K = LA.kron(A, 2, B, 2), g = h('div', { style: 'display:grid;grid-template-columns:repeat(4,minmax(0,64px));gap:3px' });
            K.forEach((z, i) => { const r = i >> 2, cc = i & 3, a = Math.hypot(...z); g.append(h('div', { style: `height:44px;display:grid;place-items:center;border-radius:6px;font:600 11.5px var(--f-mono);background:${a > 1e-6 ? phaseColor(Math.atan2(z[1], z[0]), .15 + .6 * a) : 'var(--surface-2)'};${(r >> 1) ^ (cc >> 1) ? 'outline:1px dashed var(--muted);' : 'outline:1px solid var(--muted);'}` }, cstr(z[0], z[1], 2))); });
            out.append(col([h('div', { html: LA.cm(A, 2) })], 'A = ' + ka), h('span', { style: 'font:700 20px var(--f-mono)' }, '⊗'), col([h('div', { html: LA.cm(B, 2) })], 'B = ' + kb), h('span', { style: 'font:700 20px var(--f-mono)' }, '='), col([g], 'A ⊗ B (4×4)'));
            ro.innerHTML = `<span class="k">block (i, j) of A ⊗ B is A<sub>ij</sub> · B. </span>${ka} ⊗ ${kb} applies ${ka} to q0 and ${kb} to q1 at the same time.<br><span class="k">A ⊗ B is unitary because A and B are; CNOT, by contrast, is not a tensor product of two gates.</span>`; } };
        const mk = () => { ctl.innerHTML = ''; if (mode === 'vec') ctl.append(h('div', { class: 'split even' }, h('div', { class: 'stack' }, LA.sl(id('ta'), '|a⟩: polar angle', 0, PI, .01, ta, v => num(deg(v), 0) + '°', v => { ta = v; draw(); }), LA.sl(id('pa'), '|a⟩: phase', 0, TAU, .01, pa, v => num(deg(v), 0) + '°', v => { pa = v; draw(); })), h('div', { class: 'stack' }, LA.sl(id('tb'), '|b⟩: polar angle', 0, PI, .01, tb, v => num(deg(v), 0) + '°', v => { tb = v; draw(); }), LA.sl(id('pb'), '|b⟩: phase', 0, TAU, .01, pb, v => num(deg(v), 0) + '°', v => { pb = v; draw(); }))));
          else { const o = Object.keys(KPRE).map(k => ({ v: k, label: k })); ctl.append(h('div', { class: 'split even' }, field('Gate A on q0', seg(o, ka, v => { ka = v; draw(); }, 'A')), field('Gate B on q1', seg(o, kb, v => { kb = v; draw(); }, 'B')))); } draw(); };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'vec', label: 'Vectors' }, { v: 'mat', label: 'Matrices' }], mode, v => { mode = v; mk(); }, 'Mode')), h('div', { class: 'scroll-x' }, out), ctl, ro);
        mk();
      }
    },
    entangled: {
      title: 'Product or entangled?',
      cap: 'Set the four amplitudes of a two-qubit state (they are normalized for you) and a phase on |11⟩. The 2×2 grid is the coefficient matrix C. If det C = 0 the state factors into |a⟩ ⊗ |b⟩, shown in the readout; otherwise it is entangled, with concurrence 2|det C|. The bars are the Schmidt weights, the squared singular values of C: one bar means product, two equal bars mean maximally entangled.',
      build(body, id) {
        let c3 = TPRE.bell.slice();
        const grid = h('div', { style: 'display:grid;grid-template-columns:58px repeat(2,minmax(0,96px));gap:4px;align-items:center' }), bc = canvas('', 'height:130px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const amps = () => { const n = Math.hypot(c3[0], c3[1], c3[2], c3[3]) || 1, ph = c3[4]; return [[c3[0] / n, 0], [c3[1] / n, 0], [c3[2] / n, 0], [c3[3] / n * Math.cos(ph), c3[3] / n * Math.sin(ph)]]; };
        const anal = () => { const a = amps(), det = C2.add(C2.mul(a[0], a[3]), C2.mul([-1, 0], C2.mul(a[1], a[2]))), dm = Math.hypot(...det), disc = Math.sqrt(Math.max(0, 1 - 4 * dm * dm)), s = [(1 + disc) / 2, (1 - disc) / 2]; return { a, det, dm, s }; };
        const pb = painter(bc, ({ ctx, w, h: H }) => { const T = Theme.get(), { s } = anal(), Ax = axes(ctx, w, H, { x: [0, 2], y: [0, 1], xt: [], yt: [0, .5, 1], yl: 'Schmidt weight', pad: { l: 40, b: 18 } }); s.forEach((v, i) => { const x0 = Ax.X(i + .2), x1 = Ax.X(i + .8); ctx.fillStyle = i ? T.cyan : T.copper; ctx.fillRect(x0, Ax.Y(v), x1 - x0, Ax.B - Ax.Y(v)); txt(ctx, num(v, 3), (x0 + x1) / 2, Ax.Y(v) - 10, { font: '600 11px "JetBrains Mono",monospace' }); }); });
        const draw = () => { const { a, det, dm, s } = anal(); grid.innerHTML = ''; grid.append(h('div'), h('div', { style: 'text-align:center;font:600 12px var(--f-mono)' }, 'q1 = 0'), h('div', { style: 'text-align:center;font:600 12px var(--f-mono)' }, 'q1 = 1'));
          [0, 1].forEach(r => { grid.append(h('div', { style: 'font:600 12px var(--f-mono)' }, `q0 = ${r}`)); [0, 1].forEach(cc => { const z = a[2 * r + cc], m2 = Math.hypot(...z); grid.append(h('div', { style: `height:46px;display:grid;place-items:center;border-radius:8px;font:600 13px var(--f-mono);background:${m2 > 1e-6 ? phaseColor(Math.atan2(z[1], z[0]), .15 + .7 * m2) : 'var(--surface-2)'}` }, cstr(z[0], z[1], 2))); }); });
          let fac = ''; if (dm < 1e-3) { const r0 = Math.hypot(...a[0], ...a[1]), r1 = Math.hypot(...a[2], ...a[3]), row = r0 >= r1 ? [a[0], a[1]] : [a[2], a[3]], nr = Math.hypot(...row[0], ...row[1]), b = row.map(z => [z[0] / nr, z[1] / nr]), aa = [C2.add(C2.mul(a[0], C2.conj(b[0])), C2.mul(a[1], C2.conj(b[1]))), C2.add(C2.mul(a[2], C2.conj(b[0])), C2.mul(a[3], C2.conj(b[1])))];
            fac = `<br><span class="k">factors: </span>(${cstr(...aa[0], 2)}|0⟩ + ${cstr(...aa[1], 2)}|1⟩) ⊗ (${cstr(...b[0], 2)}|0⟩ + ${cstr(...b[1], 2)}|1⟩)`; }
          const S = -s.reduce((q, p) => q + (p > 1e-12 ? p * Math.log2(p) : 0), 0);
          ro.innerHTML = `<span class="k">state </span>${ketString(a.map(z => z[0]), a.map(z => z[1]), 2)}<br><span class="k">det C = c₀₀c₁₁ − c₀₁c₁₀ = </span>${cstr(...det, 3)}<br><span class="k">verdict </span>${dm < 1e-3 ? 'product state (rank 1)' : `entangled · concurrence 2|det C| = ${num(2 * dm, 3)}`}${fac}<br><span class="k">entanglement entropy </span>${num(S, 3)} ebit`; pb.inv(); };
        const sl = ['c₀₀ (|00⟩)', 'c₀₁ (|01⟩)', 'c₁₀ (|10⟩)', 'c₁₁ (|11⟩)'].map((l, i) => LA.sl(id('c' + i), l, -1, 1, .01, c3[i], v => num(v, 2), v => { c3[i] = v; draw(); }));
        const phs = LA.sl(id('ph'), 'Phase on |11⟩', 0, TAU, .01, c3[4], v => num(deg(v), 0) + '°', v => { c3[4] = v; draw(); });
        const setP = k => { c3 = TPRE[k].slice(); sl.forEach((s, i) => s.set(c3[i])); phs.set(c3[4]); draw(); };
        body.append(h('div', { class: 'btns' }, ...Object.keys(TPRE).map(k => btn(TLAB[k], () => setP(k), 'sm'))), h('div', { class: 'split' }, h('div', { class: 'stack' }, grid, bc, ro), h('div', { class: 'stack' }, h('div', { class: 'split even' }, sl[0], sl[1]), h('div', { class: 'split even' }, sl[2], sl[3]), phs)));
        draw();
      }
    }
  },
  take: ['Combining systems multiplies dimensions: two qubits live in ℂ² ⊗ ℂ² = ℂ⁴, n qubits in 2ⁿ dimensions.',
    'The Kronecker product multiplies every entry of the first factor by the whole second factor, for vectors and for matrices; (A ⊗ B)(a ⊗ b) = Aa ⊗ Bb.',
    'A single-qubit gate on a register is a tensor product with identities; entangling gates such as CNOT are sums of products.',
    'A two-qubit state is a product exactly when its coefficient matrix has det C = 0 (rank 1); otherwise it is entangled, with concurrence 2|det C|.'],
  quiz: QZ([
    ['What is the dimension of the state space of 3 qubits?', ['3', '8', '6', '9'], 1, 'Tensor products multiply dimensions: 2 × 2 × 2.'],
    ['What is (a₀, a₁) ⊗ (b₀, b₁)?', ['(a₀ + b₀, a₁ + b₁)', '(a₀b₀, a₀b₁, a₁b₀, a₁b₁)', '(a₀b₀, a₁b₁)', '(a₀, a₁, b₀, b₁)'], 1, 'Each amplitude of the first factor multiplies the whole second factor.'],
    ['What is |+⟩ ⊗ |0⟩?', ['(|00⟩ + |11⟩)/√2', '(|00⟩ + |10⟩)/√2', '(|00⟩ + |01⟩)/√2', '|+0⟩ = |00⟩'], 1, '(|0⟩ + |1⟩)/√2 ⊗ |0⟩ = (|00⟩ + |10⟩)/√2, with q0 as the left digit.'],
    ['How is X applied to the second qubit of a two-qubit register written?', ['X ⊗ I', 'I ⊗ X', 'X ⊗ X', 'X + I'], 1, 'The identity acts on the untouched qubit.'],
    ['What is (A ⊗ B)(C ⊗ D)?', ['AB ⊗ CD', 'AC ⊗ BD', 'AD ⊗ BC', 'A ⊗ B ⊗ C ⊗ D'], 1, 'Products act factor by factor (the mixed-product property).'],
    ['Why can CNOT create entanglement while X ⊗ Z cannot?', ['CNOT is larger', 'CNOT is a sum of tensor products, |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ X, not a single product', 'X ⊗ Z is not unitary', 'CNOT is Hermitian'], 1, 'A product of local gates maps product states to product states.'],
    ['When is the state Σ cᵢⱼ|ij⟩ a product state?', ['When all cᵢⱼ are equal', 'When the coefficient matrix C has rank 1, i.e. det C = 0', 'When c₀₀ = 0', 'Always'], 1, 'Then cᵢⱼ = aᵢbⱼ, so every row of C is a multiple of the same row.'],
    ['What is det C for the Bell state (|00⟩ + |11⟩)/√2?', ['0', '1/2', '1', '√2'], 1, 'c₀₀c₁₁ − c₀₁c₁₀ = (1/√2)(1/√2) − 0 = 1/2, the maximum.'],
    ['How do inner products behave for product states?', ['They add', 'They multiply: ⟨a⊗b|c⊗d⟩ = ⟨a|c⟩⟨b|d⟩', 'They vanish', 'They are undefined'], 1, 'Overlaps of product states factor into the overlaps of the parts.'],
    ['Why are most states of many qubits entangled?', ['Because of noise', 'Product states form a thin subset (n·2 parameters versus 2ⁿ), so a generic vector cannot be factored', 'Because measurements entangle them', 'They are not; most are products'], 1, 'This is also why classical simulation of generic states is hard.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Spectral theorem', 'Every Hermitian (more generally normal) matrix has an orthonormal basis of eigenvectors: A = Σ λₖ|vₖ⟩⟨vₖ|.', 'laeigen'],
  ['Characteristic polynomial', 'det(A − λI), whose roots are the eigenvalues of A.', 'laeigen'],
  ['Euler decomposition', 'Writing a single-qubit unitary as e^(iα)Rz(β)Ry(γ)Rz(δ).', 'launitary'],
  ['Kronecker product', 'The concrete tensor product of vectors or matrices: every entry of the first multiplies the whole second.', 'latensor']
);
})();
