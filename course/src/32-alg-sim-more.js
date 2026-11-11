/* =====================================================================
   Research tracks · algorithms: boson sampling, quantum annealing, the hidden subgroup problem
                   · simulation: the sign problem, analog quantum simulators
   ===================================================================== */
(() => {
const ALG = 6, SIM = 7;

/* ---------- complex helpers ---------- */
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
function haar(m, r) {
  const g = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  const cols = [];
  for (let j = 0; j < m; j++) {
    let v = [...Array(m)].map(() => [g(), g()]);
    for (const c3 of cols) { let re = 0, im = 0; for (let i = 0; i < m; i++) { re += c3[i][0] * v[i][0] + c3[i][1] * v[i][1]; im += c3[i][0] * v[i][1] - c3[i][1] * v[i][0]; } for (let i = 0; i < m; i++) { v[i][0] -= re * c3[i][0] - im * c3[i][1]; v[i][1] -= re * c3[i][1] + im * c3[i][0]; } }
    const nr = Math.sqrt(v.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0)); cols.push(v.map(z => [z[0] / nr, z[1] / nr]));
  }
  return [...Array(m)].map((_, i) => cols.map(c3 => c3[i]));
}
function permC(A) { const n = A.length; let tot = [0, 0]; for (let S = 1; S < (1 << n); S++) { let prod = [1, 0], bits = 0; for (let i = 0; i < n; i++) { let s = [0, 0]; for (let j = 0; j < n; j++) if (S >> j & 1) { s[0] += A[i][j][0]; s[1] += A[i][j][1]; } prod = cmul(prod, s); } for (let j = 0; j < n; j++) if (S >> j & 1) bits++; const sg = (n - bits) % 2 ? -1 : 1; tot[0] += sg * prod[0]; tot[1] += sg * prod[1]; } return tot; }
function combos(m, n) { const out = []; const rec = (st, a) => { if (a.length === n) { out.push(a.slice()); return; } for (let i = st; i < m; i++) { a.push(i); rec(i + 1, a); a.pop(); } }; rec(0, []); return out; }

LESSONS.push({
  id: 'bosonsampling', n: 31.2, stage: ALG, minutes: 15, title: 'Boson sampling',
  lede: 'Send identical photons through a network of beam splitters and record where they come out. The probabilities are permanents of matrices, which are believed to be hard for classical computers, and that made boson sampling one of the first proposals for a quantum advantage experiment.',
  html: `
<h2>The problem</h2>
<p>Aaronson and Arkhipov proposed <strong>boson sampling</strong> in 2011. Inject ${m('n')} single photons into ${m('n')} of the ${m('m')} input ports of a linear optical network described by an ${m('m × m')} unitary matrix ${m('U')}, and count photons at the outputs. For an output pattern ${m('S')} with one photon in each of the ports ${m('s₁, …, s<sub>n</sub>')}, the probability is</p>
${EQ('P(S) = |Perm(U<sub>S</sub>)|², &nbsp;&nbsp; Perm(A) = Σ<sub>σ</sub> Π<sub>i</sub> A<sub>i,σ(i)</sub>')}
<p>where ${m('U<sub>S</sub>')} is the ${m('n × n')} submatrix of ${m('U')} with the chosen rows and columns. The <strong>permanent</strong> is the determinant without the minus signs, and that small change is enormous: determinants take ${m('O(n³)')} operations, while computing permanents exactly is #P-hard (Valiant, 1979), and the best known exact algorithms, Ryser’s and Glynn’s formulas, take about ${m('n · 2ⁿ')} operations. The amplitude is a sum over all ways the photons can reach the detectors, and identical bosons interfere through all of them, the many-photon generalization of the Hong–Ou–Mandel effect ([[L:photonic]]).</p>
<h2>Why it was proposed</h2>
<p>Boson sampling is not useful for anything in particular. Its appeal was that it needs no entangling gates, only interference, so it seemed buildable soon, while Aaronson and Arkhipov showed that efficient classical sampling would collapse the polynomial hierarchy, under plausible conjectures about permanents of random matrices. If photons are <em>distinguishable</em>, the probabilities become permanents of non-negative matrices ${m('|U<sub>ij</sub>|²')}, which can be approximated efficiently, so the hardness is a genuinely quantum effect.</p>
${LAB('perm')}
<h2>Experiments and the classical fight-back</h2>
<p><strong>Gaussian boson sampling</strong>, which uses squeezed light instead of single photons and replaces permanents by hafnians, made the idea practical. The USTC Jiuzhang experiments (from 2020) and Xanadu’s Borealis (2022) detected dozens to over a hundred photons and claimed quantum advantage. Classical algorithms then improved, exploiting photon loss and imperfections that make the output distribution easier to approximate, and the boundary has moved back and forth since ([[L:advantage]]).</p>
`,
  labs: {
    perm: {
      title: 'Bosons versus distinguishable particles',
      cap: 'Three photons enter the first three modes of a random m-mode interferometer (Haar-random unitary). Bars show the probability of every collision-free output pattern (one photon per occupied detector), computed exactly: |Perm(U_S)|² for identical bosons (cyan) and Perm(|U_S|²) for distinguishable particles (outlines). Bosonic interference makes some patterns much likelier and others nearly impossible; the rest of the probability goes to bunched patterns with two or more photons in one detector.',
      build(body, id) {
        let m = 6, seed = 3, mode = 'sort';
        const n = 3, cv = canvas('', 'height:260px'), cc = canvas('', 'height:180px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        let data = null;
        const run = () => { const U = haar(m, rng(seed)), out = combos(m, n).map(S => { const sub = S.map(r => [0, 1, 2].map(c3 => U[r][c3])), pb = permC(sub), pd = permC(sub.map(row => row.map(z => [z[0] * z[0] + z[1] * z[1], 0]))); return { S, b: pb[0] * pb[0] + pb[1] * pb[1], d: pd[0] }; }); data = out; q.inv(); text(); };
        const q = painter(cv, ({ ctx, w, h: H }) => {
          if (!data) return; const T = Theme.get(), arr = mode === 'sort' ? data.slice().sort((a, b) => b.b - a.b) : data, ym = Math.max(...arr.map(o => Math.max(o.b, o.d))) * 1.1, A = axes(ctx, w, H, { x: [-.5, arr.length - .5], y: [0, ym], xt: [], yt: [0, +(ym / 2).toFixed(3)], xl: arr.length + ' collision-free output patterns', yl: 'probability' }), bw = (A.R - A.L) / arr.length;
          arr.forEach((o, i) => { ctx.fillStyle = rgba(T.cyan, .85); ctx.fillRect(A.X(i) - bw * .4, A.Y(o.b), bw * .8, A.B - A.Y(o.b)); ctx.strokeStyle = T.ink; ctx.lineWidth = 1; ctx.strokeRect(A.X(i) - bw * .4, A.Y(o.d), bw * .8, A.B - A.Y(o.d)); });
          if (arr.length <= 20) arr.forEach((o, i) => txt(ctx, o.S.map(x => x + 1).join(''), A.X(i), A.B + 9, { font: '500 9px "JetBrains Mono",monospace' }));
        });
        const qc = painter(cc, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [2, 50], y: [1, 1e18], ylog: true, xt: [2, 10, 20, 30, 40, 50], yt: [1, 1e6, 1e12, 1e18], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'photons n', yl: 'operations' }); const a = [], b = []; for (let k = 2; k <= 50; k++) { a.push([A.X(k), A.Y(Math.min(1e18, k * 2 ** k))]); b.push([A.X(k), A.Y(k ** 3)]); } polyline(ctx, a, T.copper, 2.3); polyline(ctx, b, T.muted, 2, [5, 4]); });
        const text = () => { const sb = data.reduce((s, o) => s + o.b, 0), sd = data.reduce((s, o) => s + o.d, 0), mxb = Math.max(...data.map(o => o.b)), mnb = Math.min(...data.map(o => o.b)); ro.innerHTML = `<span class="k">collision-free probability </span>bosons ${pct(sb, 1)}, distinguishable ${pct(sd, 1)}<br><span class="k">likeliest / least likely pattern (bosons) </span>${pct(mxb, 2)} / ${pct(mnb, 3)}<br><span class="k">permanent cost (Ryser) for n = 50 </span>≈ 5.6 × 10¹⁶ operations per probability`; };
        body.append(h('div', { class: 'btns' }, seg([5, 6, 7, 8].map(v => ({ v, label: `${v} modes` })), m, v => { m = v; run(); }, 'Modes'), seg([{ v: 'sort', label: 'Sorted by bosonic probability' }, { v: 'lex', label: 'In pattern order' }], mode, v => { mode = v; q.inv(); }, 'Order'), btn('New interferometer', () => { seed++; run(); }, 'sm')),
          cv, legendRow([['identical photons |Perm(U_S)|²', 'var(--cyan)'], ['distinguishable Perm(|U_S|²)', 'var(--ink)']]), h('div', { class: 'split' }, h('div', { class: 'stack' }, cc, legendRow([['permanent, Ryser n·2ⁿ', 'var(--copper)'], ['determinant n³', 'var(--muted)', 1]])), ro));
        run();
      }
    }
  },
  take: ['In boson sampling, n photons pass through an m-mode linear network; collision-free output probabilities are |Perm(U_S)|².',
    'Permanents are #P-hard to compute exactly (Ryser: about n·2ⁿ operations), unlike determinants (n³).',
    'Efficient classical sampling would collapse the polynomial hierarchy under plausible conjectures; distinguishable photons are classically easy.',
    'Gaussian boson sampling experiments claimed advantage, while classical algorithms exploiting loss and noise keep pushing back.'],
  quiz: QZ([
    ['What is the input of a boson sampling experiment?', ['Entangled qubits', 'n single photons in n of the m input modes of a linear optical network', 'Classical laser light only', 'Electrons'], 1, 'Only interference in a passive network is needed, no entangling gates.'],
    ['How are the output probabilities expressed?', ['As determinants', 'As squared magnitudes of permanents of n × n submatrices of the network unitary', 'As traces', 'As eigenvalues'], 1, 'P(S) = |Perm(U_S)|² for collision-free outputs.'],
    ['How does the permanent differ from the determinant?', ['It uses division', 'It sums the same products but without the alternating signs', 'It is a product of eigenvalues', 'It is always zero'], 1, 'Without the signs there is no Gaussian-elimination shortcut, which is why the permanent is so much harder to compute.'],
    ['How hard is computing a permanent exactly?', ['O(n³)', '#P-hard; Ryser’s formula takes about n·2ⁿ operations', 'Linear', 'Constant'], 1, 'Valiant proved #P-hardness in 1979; Ryser’s inclusion–exclusion formula and Glynn’s formula, both about n·2ⁿ, remain the fastest known exact methods.'],
    ['Why are distinguishable photons not hard to simulate?', ['They do not move', 'Their probabilities are permanents of non-negative matrices, which can be approximated efficiently', 'They are fermions', 'They are always lost'], 1, 'Hardness needs the complex interference of identical bosons.'],
    ['What did Aaronson and Arkhipov show about classical simulation?', ['It is easy', 'Efficient exact classical sampling would collapse the polynomial hierarchy, and approximate sampling too under plausible conjectures', 'It is impossible to define', 'It requires quantum RAM'], 1, 'This gave a complexity-theoretic case for quantum advantage without universal gates.'],
    ['What is Gaussian boson sampling?', ['Boson sampling with electrons', 'A variant using squeezed light, whose probabilities involve hafnians, more practical to build', 'A classical algorithm', 'A decoding method'], 1, 'Squeezed sources are easier to scale than single-photon sources.'],
    ['Why have classical algorithms caught up with some experiments?', ['Photons became distinguishable by design', 'Photon loss and other imperfections make the output distribution easier to approximate classically', 'Permanents became easy', 'Experiments used too few modes'], 1, 'Noise erodes the interference that makes sampling hard.'],
    ['In the lab, what happens to the collision-free probability for bosons compared with distinguishable particles?', ['It is identical', 'It is typically smaller, because identical bosons tend to bunch', 'It is always 1', 'It is always 0'], 1, 'Bosonic bunching moves probability into outputs with several photons in one mode.'],
    ['Is boson sampling useful for practical computation?', ['Yes, for factoring', 'Not directly; it was designed as a demonstration of quantum advantage, though related Gaussian sampling has proposed applications such as graph problems', 'Yes, for all optimization', 'It replaces classical computers'], 1, 'Its value is mainly as a test of quantum computational power.']
  ])
});

/* ---------- quantum annealing versus simulated annealing on an 8-spin glass ---------- */
function glass(seed) { const r = rng(seed), n = 8, J = [], hf = []; for (let i = 0; i < n; i++) { hf.push((r() - .5) * .3); for (let j = i + 1; j < n; j++) J.push([i, j, r() < .5 ? -1 : 1]); } const N = 1 << n, E = new Float64Array(N); for (let b = 0; b < N; b++) { let e = 0; const z = i => (b >> i & 1) ? -1 : 1; for (const [i, j, c3] of J) e += c3 * z(i) * z(j); for (let i = 0; i < n; i++) e += hf[i] * z(i); E[b] = e; } let g = 0; for (let b = 1; b < N; b++) if (E[b] < E[g]) g = b; return { n, J, hf, E, g }; }
function qaSuccess(inst, Tann) {
  const { n, E, g } = inst, N = 1 << n, re = new Float64Array(N).fill(1 / Math.sqrt(N)), im = new Float64Array(N), dt = Math.min(.05, Tann / 40), steps = Math.ceil(Tann / dt), h_ = Tann / steps;
  const k = [0, 1, 2, 3].map(() => [new Float64Array(N), new Float64Array(N)]), tr = new Float64Array(N), ti = new Float64Array(N);
  const f = (s, xr, xi, or, oi) => { for (let b = 0; b < N; b++) { let sr = 0, si = 0; for (let i = 0; i < n; i++) { sr += xr[b ^ (1 << i)]; si += xi[b ^ (1 << i)]; } const hr = s * E[b] * xr[b] - (1 - s) * sr, hi = s * E[b] * xi[b] - (1 - s) * si; or[b] = hi; oi[b] = -hr; } };
  for (let st = 0; st < steps; st++) {
    const s0 = st / steps, s1 = (st + .5) / steps, s2 = (st + 1) / steps;
    f(s0, re, im, k[0][0], k[0][1]); for (let b = 0; b < N; b++) { tr[b] = re[b] + h_ / 2 * k[0][0][b]; ti[b] = im[b] + h_ / 2 * k[0][1][b]; }
    f(s1, tr, ti, k[1][0], k[1][1]); for (let b = 0; b < N; b++) { tr[b] = re[b] + h_ / 2 * k[1][0][b]; ti[b] = im[b] + h_ / 2 * k[1][1][b]; }
    f(s1, tr, ti, k[2][0], k[2][1]); for (let b = 0; b < N; b++) { tr[b] = re[b] + h_ * k[2][0][b]; ti[b] = im[b] + h_ * k[2][1][b]; }
    f(s2, tr, ti, k[3][0], k[3][1]); for (let b = 0; b < N; b++) { re[b] += h_ / 6 * (k[0][0][b] + 2 * k[1][0][b] + 2 * k[2][0][b] + k[3][0][b]); im[b] += h_ / 6 * (k[0][1][b] + 2 * k[1][1][b] + 2 * k[2][1][b] + k[3][1][b]); }
  }
  return re[g] * re[g] + im[g] * im[g];
}
function saSuccess(inst, sweeps, runs, r) {
  const { n, J, hf, g } = inst, nb = [...Array(n)].map(() => []); for (const [i, j, c3] of J) { nb[i].push([j, c3]); nb[j].push([i, c3]); }
  let ok = 0;
  for (let run = 0; run < runs; run++) { const z = [...Array(n)].map(() => r() < .5 ? 1 : -1); for (let s = 0; s < sweeps; s++) { const beta = .1 + 4.9 * (s + 1) / sweeps; for (let i = 0; i < n; i++) { let loc = hf[i]; for (const [j, c3] of nb[i]) loc += c3 * z[j]; const dE = -2 * z[i] * loc; if (dE <= 0 || r() < Math.exp(-beta * dE)) z[i] = -z[i]; } } let b = 0; for (let i = 0; i < n; i++) if (z[i] < 0) b |= 1 << i; if (b === g) ok++; }
  return ok / runs;
}

LESSONS.push({
  id: 'annealing', n: 31.6, stage: ALG, minutes: 15, title: 'Quantum annealing',
  lede: 'Quantum annealers attack optimization problems by slowly turning a simple quantum magnet into one that encodes the problem, hoping the system stays in its lowest-energy state. Thousands of qubits are available today, but whether they beat classical heuristics is still contested.',
  html: `
<h2>Optimization as a ground state</h2>
<p>Many hard optimization problems can be written as finding the lowest energy of an <strong>Ising model</strong>, ${m('H<sub>P</sub> = Σ J<sub>ij</sub>Z<sub>i</sub>Z<sub>j</sub> + Σ h<sub>i</sub>Z<sub>i</sub>')}, whose couplings encode the problem (Lucas, 2014, catalogued formulations for many NP problems). Quantum annealing (Kadowaki and Nishimori, 1998) starts in the ground state of a transverse field, a uniform superposition, and slowly interpolates:</p>
${EQ('H(s) = −(1 − s) Σ<sub>i</sub> X<sub>i</sub> + s H<sub>P</sub>, &nbsp;&nbsp; s: 0 → 1 over the anneal time T')}
<p>If the change is slow compared with the inverse square of the minimum energy gap, the adiabatic theorem ([[L:adiabatic]]) keeps the system in its ground state, and measuring at the end gives the optimal solution. Faster anneals leave the system in excited states, so annealers are run many times and the best answer kept.</p>
<h2>Quantum versus thermal</h2>
<p>The classical analogue, <strong>simulated annealing</strong>, lowers the temperature of a Monte Carlo simulation so the system settles into low energies by thermally hopping over barriers. Quantum annealing instead uses quantum fluctuations, which can <em>tunnel</em> through barriers. Tunnelling helps for tall, thin barriers; thermal hopping cares only about height. Whether real problems have the right landscape, and whether the minimum gap closes too fast (exponentially, at first-order phase transitions) is what decides any advantage.</p>
${LAB('anneal')}
<h2>Machines and evidence</h2>
<ul>
<li><strong>Hardware.</strong> D-Wave’s annealers have thousands of superconducting flux qubits with limited connectivity, so problems must be <em>embedded</em> by chaining several physical qubits into one logical variable. They operate at finite temperature and without error correction.</li>
<li><strong>Benchmarks.</strong> Careful studies have found scaling advantages for crafted problems with tall thin barriers, but no consistent advantage over the best classical heuristics (parallel tempering, simulated quantum annealing, specialized solvers) on practical optimization.</li>
<li><strong>Simulation.</strong> Annealers are also analog quantum simulators of magnetic materials. In 2025 D-Wave reported quench dynamics of spin glasses that it argued were beyond classical simulation; classical groups have contested parts of that claim, as with every advantage claim so far ([[L:advantage]]).</li>
</ul>
`,
  labs: {
    anneal: {
      title: 'Quantum and simulated annealing on a spin glass',
      cap: 'A random 8-spin glass: all-to-all ±1 couplings and small random fields, with its ground state found by brute force. Left: probability that quantum annealing ends in the ground state, from an exact simulation of the Schrödinger equation along the linear schedule, against the anneal time T. Right: probability that simulated annealing (Metropolis, inverse temperature 0.1 → 5) ends in the ground state, against the number of sweeps, from 300 runs each. Different instances have very different difficulty.',
      build(body, id) {
        let seed = 2, inst = null, qa = [], sa = [], job = 0;
        const TS = [.5, 1, 2, 3, 5, 8, 12, 20, 30, 50], SW = [1, 2, 3, 5, 8, 12, 20, 30, 50, 100];
        const c1 = canvas('', 'height:230px'), c2 = canvas('', 'height:230px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), st = h('div', { class: 'status' });
        const setup = () => { inst = glass(seed); qa = []; sa = []; job = 0; q1.inv(); q2.inv(); text(); };
        Scope.tick(() => { if (!inst || job >= TS.length + SW.length) return; const t0 = performance.now(); while (job < TS.length + SW.length && performance.now() - t0 < 14) { if (job < TS.length) qa.push(qaSuccess(inst, TS[job])); else sa.push(saSuccess(inst, SW[job - TS.length], 300, rng(seed * 100 + job))); job++; } q1.inv(); q2.inv(); text(); });
        const chart = (cv_, xs, ys, xl, col) => painter(cv_, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [xs[0], xs[xs.length - 1]], y: [0, 1], xlog: true, xt: xs.filter((_, i) => i % 2 === 0), yt: [0, .25, .5, .75, 1], xf: v => String(v), xl, yl: 'P(ground state)' }); const arr = ys(); const pts = arr.map((v, i) => [A.X(xs[i]), A.Y(v)]); polyline(ctx, pts, T[col], 2.4); pts.forEach(q => dot(ctx, q[0], q[1], 3.5, T[col])); if (inst) { const p0 = 1 / 256; ctx.setLineDash([3, 3]); ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.moveTo(A.L, A.Y(p0)); ctx.lineTo(A.R, A.Y(p0)); ctx.stroke(); ctx.setLineDash([]); } });
        const q1 = chart(c1, TS, () => qa, 'anneal time T (units of 1/J)', 'cyan'), q2 = chart(c2, SW, () => sa, 'Monte Carlo sweeps', 'copper');
        const text = () => { const sorted = Array.from(inst.E).sort((a, b) => a - b); const done = job >= TS.length + SW.length; st.className = done ? 'status good' : 'status'; st.textContent = done ? 'Simulations finished.' : `Simulating… ${Math.round(100 * job / (TS.length + SW.length))}%`; ro.innerHTML = `<span class="k">ground-state energy </span>${num(sorted[0], 3)} &nbsp; <span class="k">gap to first excited configuration </span>${num(sorted[1] - sorted[0], 3)}<br><span class="k">random guessing succeeds with </span>1/256 ≈ 0.4% (dotted line)<br><span class="k">longest anneal / most sweeps </span>${qa.length === TS.length ? pct(qa[qa.length - 1], 1) : '…'} / ${sa.length === SW.length ? pct(sa[sa.length - 1], 1) : '…'}`; };
        body.append(h('div', { class: 'btns' }, btn('New instance', () => { seed++; setup(); }, 'pri')), h('div', { class: 'split even' }, h('div', { class: 'stack' }, c1, legendRow([['quantum annealing (exact simulation)', 'var(--cyan)']])), h('div', { class: 'stack' }, c2, legendRow([['simulated annealing', 'var(--copper)']]))), h('div', { class: 'split' }, st, ro));
        setup();
      }
    }
  },
  take: ['Quantum annealing encodes an optimization problem in an Ising Hamiltonian and slowly turns off a transverse field, aiming to stay in the ground state.',
    'Success depends on the minimum spectral gap; fast anneals end in excited states, so annealers sample many times.',
    'Quantum fluctuations can tunnel through tall thin barriers that thermal hopping in simulated annealing must climb.',
    'Annealers have thousands of qubits but finite temperature, limited connectivity and no error correction; a consistent advantage over classical heuristics has not been shown.'],
  quiz: QZ([
    ['What kind of problem does a quantum annealer solve natively?', ['Factoring', 'Finding low-energy states of an Ising model whose couplings encode an optimization problem', 'Matrix inversion', 'Database search'], 1, 'Many NP-hard problems can be mapped onto Ising ground states.'],
    ['What is the starting Hamiltonian of quantum annealing?', ['The problem Hamiltonian', 'A transverse field −ΣXᵢ, whose ground state is a uniform superposition', 'Zero', 'A random unitary'], 1, 'Its ground state is easy to prepare, and the schedule then interpolates to the problem.'],
    ['What determines how slow the anneal must be?', ['The number of qubits only', 'The minimum energy gap along the schedule: roughly T ≫ 1/Δ²', 'The temperature only', 'The readout time'], 1, 'Small gaps cause Landau–Zener transitions to excited states.'],
    ['How does simulated annealing differ?', ['It is quantum', 'It uses thermal fluctuations in a Monte Carlo simulation with decreasing temperature', 'It needs no randomness', 'It uses tunnelling'], 1, 'It is a classical heuristic and a key benchmark for annealers.'],
    ['Which barriers favour quantum tunnelling over thermal hopping?', ['Short, wide barriers', 'Tall, thin barriers', 'Any barrier equally', 'No barriers'], 1, 'Tunnelling amplitude depends on width and height; thermal hopping only on height.'],
    ['What happens when the minimum gap closes exponentially with problem size?', ['Annealing becomes fast', 'The required anneal time grows exponentially, removing any advantage', 'Nothing', 'The answer becomes exact'], 1, 'First-order transitions in hard instances can produce exponentially small gaps.'],
    ['Why must problems be embedded on D-Wave hardware?', ['To encrypt them', 'Limited qubit connectivity means one logical variable is often represented by a chain of physical qubits', 'Because qubits are classical', 'To add error correction'], 1, 'Embedding consumes qubits and adds chain-breaking errors.'],
    ['In the lab, why can success probability vary widely between instances?', ['Random number errors', 'Instances differ in gap structure and landscape; some have tiny gaps or many near-degenerate states', 'The simulation is inexact', 'Because of embedding'], 1, 'Instance difficulty is the central issue in annealing benchmarks.'],
    ['What has careful benchmarking found?', ['Annealers always win', 'Advantages for crafted problems, but no consistent advantage over the best classical heuristics on practical optimization', 'Annealers never work', 'Annealers solve NP-complete problems efficiently'], 1, 'Classical solvers such as parallel tempering remain strong competitors.'],
    ['Besides optimization, what are annealers used for?', ['Factoring large numbers', 'Analog simulation of magnetic materials and quantum dynamics', 'Running Shor’s algorithm', 'Error correction'], 1, 'Recent work focuses on simulating spin glasses and phase transitions.']
  ])
});

/* ---------- hidden subgroup problem: discrete log in Z_22 × Z_22 ---------- */
LESSONS.push({
  id: 'hsp', n: 30.2, stage: ALG, minutes: 15, title: 'The hidden subgroup problem',
  lede: 'Simon’s problem, period finding, factoring and discrete logarithms are all the same problem in disguise: find a hidden subgroup from a function that is constant on its cosets. The quantum Fourier transform solves it for commutative groups; for most others it is wide open.',
  html: `
<h2>One problem, many algorithms</h2>
<p>In the <strong>hidden subgroup problem</strong> (HSP) we are given a group ${m('G')} and a function ${m('f')} on it that is constant on the cosets of an unknown subgroup ${m('H')} and distinct on different cosets. The task is to find ${m('H')}.</p>
<ul>
<li><strong>Simon’s problem</strong> ([[L:query]]): ${m('G = ℤ₂ⁿ')}, ${m('H = {0, s}')}.</li>
<li><strong>Period finding and factoring</strong> ([[L:shor]]): ${m('G = ℤ')} (or ${m('ℤ<sub>N</sub>')}), ${m('H = rℤ')} for the period ${m('r')}.</li>
<li><strong>Discrete logarithm</strong>: ${m('G = ℤ<sub>N</sub> × ℤ<sub>N</sub>')}, ${m('f(a, b) = g<sup>a</sup> h<sup>−b</sup>')} with ${m('h = g<sup>x</sup>')}. It is constant on the cosets of ${m('H = {(xb, b)}')}, a line through the origin whose slope is the secret ${m('x')}. This is what breaks Diffie–Hellman and elliptic-curve cryptography.</li>
</ul>
<h2>Fourier sampling</h2>
<p>The standard algorithm prepares ${m('Σ<sub>g</sub> |g⟩|f(g)⟩')}, measures the second register (leaving a uniform superposition over one coset ${m('g₀ + H')}), and applies the quantum Fourier transform of ${m('G')}. The coset offset only changes phases, so the measurement returns a uniformly random element of the <strong>orthogonal subgroup</strong> ${m('H<sup>⊥</sup>')}, the characters that are trivial on ${m('H')}. A few samples pin down ${m('H<sup>⊥</sup>')} and hence ${m('H')}, with polynomially many queries and gates for every finite abelian group.</p>
${EQ('discrete log: samples (u, v) satisfy u·x + v ≡ 0 (mod N), so x ≡ −v·u⁻¹ whenever u is invertible')}
${LAB('dlog')}
<h2>The non-abelian frontier</h2>
<p>For non-commutative groups Fourier sampling is not enough in general, and the most interesting cases are open:</p>
<ul>
<li>The <strong>dihedral group</strong> HSP would give quantum algorithms for certain lattice problems (Regev, 2002), relevant to the lattice cryptography of [[L:lattices]]. Kuperberg’s algorithm (2003) solves it in subexponential time ${m('2<sup>O(√log N)</sup>')}, not polynomial time.</li>
<li>The <strong>symmetric group</strong> HSP contains graph isomorphism. Strong Fourier sampling provably fails there (Moore, Russell and Schulman, 2005), and classically Babai’s quasipolynomial algorithm (2015) has reduced the motivation.</li>
<li>Ettinger, Høyer and Knill showed that the query complexity of the HSP is polynomial for every finite group; the obstacle is efficient processing of the quantum states, not information.</li>
</ul>
`,
  labs: {
    dlog: {
      title: 'Breaking a discrete logarithm by Fourier sampling',
      cap: 'G = ℤ₂₂ × ℤ₂₂ and f(a, b) = 5ᵃ · h⁻ᵇ mod 23, where 5 generates the multiplicative group mod 23 and h = 5ˣ for a secret x. Colour shows f: it is constant along parallel lines, the cosets of the hidden subgroup H = {(xb, b)} (outlined points through the origin). Each Fourier sample returns a random point of H⊥, the line v ≡ −x·u (copper dots). One sample with u coprime to 22 reveals x.',
      build(body, id) {
        const p = 23, N = 22, g = 5; let x = 7, samples = [];
        const pw = (b, e) => { let r = 1; e = ((e % N) + N) % N; for (let i = 0; i < e; i++) r = r * b % p; return r; };
        const cv = canvas('sq', 'max-width:430px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const gcd2 = (a, b) => b ? gcd2(b, a % b) : a, inv = u => { for (let k = 1; k < N; k++) if (u * k % N === 1) return k; return null; };
        const P = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w, H) - 30, ox = (w - S) / 2 + 10, oy = 4, cs = S / N;
          for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { const e = ((a - x * b) % N + N) % N; ctx.fillStyle = phaseColor(TAU * e / N, .55); ctx.fillRect(ox + a * cs, oy + (N - 1 - b) * cs, cs + .5, cs + .5); }
          for (let b = 0; b < N; b++) { const a = (x * b) % N; ctx.strokeStyle = T.ink; ctx.lineWidth = 1.8; ctx.strokeRect(ox + a * cs + 1.5, oy + (N - 1 - b) * cs + 1.5, cs - 3, cs - 3); }
          samples.forEach(([u, v]) => dot(ctx, ox + (u + .5) * cs, oy + (N - 1 - v + .5) * cs, cs * .32, T.copper, T.surface));
          txt(ctx, 'a →', ox + S - 4, oy + S + 12, { align: 'right', font: '600 10px "JetBrains Mono",monospace' }); txt(ctx, 'b ↑', ox - 6, oy + 8, { align: 'right', font: '600 10px "JetBrains Mono",monospace' });
        });
        const text = () => { const good = samples.find(([u]) => gcd2(u, N) === 1); const last = samples[samples.length - 1]; ro.innerHTML = `<span class="k">secret exponent x </span>${x} &nbsp; <span class="k">h = 5ˣ mod 23 </span>${pw(g, x)}<br><span class="k">samples </span>${samples.map(([u, v]) => `(${u},${v})`).join(' ') || 'none yet'}<br>${good ? `<span style="color:var(--good)">u = ${good[0]} is invertible mod 22: x = −v·u⁻¹ = ${((-good[1] * inv(good[0])) % N + N) % N}</span>` : last ? '<span class="k">u shares a factor with 22; sample again</span>' : '<span class="k">press Sample</span>'}`; };
        const sample = () => { const u = Math.floor(Math.random() * N), v = ((-u * x) % N + N) % N; samples.push([u, v]); P.inv(); text(); };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Fourier sample', sample, 'pri'), btn('Clear', () => { samples = []; P.inv(); text(); }, 'sm')),
          slider({ id: id('x'), label: 'Secret exponent x', min: 1, max: 21, step: 1, value: x, fmt: String, on: v => { x = v; samples = []; P.inv(); text(); } }), ro)));
        text();
      }
    }
  },
  take: ['The hidden subgroup problem asks for a subgroup H given f constant on its cosets; Simon, period finding, factoring and discrete log are all instances.',
    'Fourier sampling returns random elements of the orthogonal subgroup H⊥, solving the HSP efficiently for all finite abelian groups.',
    'For discrete log the hidden subgroup is a line of slope x in ℤ_N × ℤ_N; one good sample reveals x.',
    'Non-abelian cases are open: dihedral (lattices) has only Kuperberg’s subexponential algorithm, and symmetric (graph isomorphism) resists Fourier sampling.'],
  quiz: QZ([
    ['What is given in the hidden subgroup problem?', ['The subgroup itself', 'A function on a group that is constant on the cosets of an unknown subgroup and distinct across cosets', 'A sorted list', 'A unitary matrix'], 1, 'The task is to identify the hidden subgroup from queries to the function.'],
    ['Which hidden subgroup problem underlies Shor’s factoring algorithm?', ['The dihedral group', 'Period finding in the integers (or ℤ_N), where H consists of multiples of the period', 'The symmetric group', 'ℤ₂ⁿ'], 1, 'Factoring reduces to finding the period of modular exponentiation.'],
    ['What does Fourier sampling return?', ['An element of H', 'A uniformly random element of the orthogonal subgroup H⊥', 'The function value', 'Nothing useful'], 1, 'The coset offset contributes only a phase, which measurement ignores.'],
    ['For discrete log, what is the hidden subgroup in ℤ_N × ℤ_N?', ['All of G', 'The line {(xb, b)}, whose slope is the secret exponent x', 'A single point', 'The diagonal only'], 1, 'f(a, b) = g^(a − xb) is constant whenever a − xb is constant.'],
    ['In the lab, why might a sample fail to reveal x?', ['The algorithm is broken', 'If u shares a factor with N = 22, it has no inverse mod 22, so the equation does not determine x uniquely', 'Because v is random', 'Because the function is periodic'], 1, 'Another sample, or combining several, resolves it.'],
    ['For which groups is the HSP solved efficiently by quantum computers?', ['All groups', 'All finite abelian groups (and some others)', 'Only ℤ₂', 'None'], 1, 'The abelian QFT and Fourier sampling suffice.'],
    ['What would an efficient algorithm for the dihedral HSP give?', ['Faster factoring', 'Quantum algorithms for certain lattice problems relevant to lattice-based cryptography', 'Graph colouring', 'Sorting'], 1, 'Regev connected the dihedral HSP to the unique shortest vector problem.'],
    ['What is the running time of Kuperberg’s dihedral HSP algorithm?', ['Polynomial', 'Subexponential, 2^(O(√log N))', 'Exponential', 'Constant'], 1, 'It is faster than classical but not polynomial, which keeps lattice cryptography safe so far.'],
    ['Which problem is an instance of the symmetric-group HSP?', ['Factoring', 'Graph isomorphism', 'Discrete log', 'Simon’s problem'], 1, 'Automorphism groups of graphs are hidden subgroups of the symmetric group.'],
    ['What did Ettinger, Høyer and Knill show?', ['The HSP is impossible', 'The query complexity of the HSP is polynomial for every finite group; the hard part is processing the states efficiently', 'Fourier sampling always works', 'Graph isomorphism is NP-complete'], 1, 'The information is obtainable with few queries, but no efficient measurement is known in general.']
  ])
});

/* ---------- sign problem: average sign of the J1–J2 Heisenberg ring ---------- */
function heisSector(n, J2) {
  const st = []; for (let b = 0; b < (1 << n); b++) { let c3 = 0, x = b; while (x) { c3 += x & 1; x >>= 1; } if (c3 === n / 2) st.push(b); }
  const idx = new Map(st.map((b, i) => [b, i])), D = st.length, H = new Float64Array(D * D);
  const bonds = []; for (let i = 0; i < n; i++) { bonds.push([i, (i + 1) % n, 1]); if (J2) bonds.push([i, (i + 2) % n, J2]); }
  st.forEach((b, i) => { for (const [p, q, J] of bonds) { const sp = b >> p & 1, sq = b >> q & 1; H[i * D + i] += J * (sp === sq ? .25 : -.25); if (sp !== sq) { const b2 = b ^ (1 << p) ^ (1 << q); H[idx.get(b2) * D + i] += J * .5; } } });
  return { H, D };
}
LESSONS.push({
  id: 'signproblem', n: 32.9, stage: SIM, minutes: 15, title: 'Quantum Monte Carlo and the sign problem',
  lede: 'Quantum Monte Carlo can simulate millions of interacting particles, as long as every term it samples is positive. For fermions and frustrated magnets the terms come with signs that cancel, and the cost of that cancellation grows exponentially. This is the sign problem, and it is the main reason quantum simulation needs quantum computers.',
  html: `
<h2>Turning quantum mechanics into statistics</h2>
<p>The partition function ${m('Z = Tr e<sup>−βH</sup>')} determines every thermal property of a system at inverse temperature ${m('β')}. Splitting ${m('e<sup>−βH</sup>')} into many small imaginary-time steps and inserting basis states between them writes ${m('Z')} as a sum over paths of configurations, world lines winding around imaginary time. If every path has a positive weight, the sum is a probability distribution, and Monte Carlo sampling estimates any observable with a statistical error that falls as ${m('1/√samples')}, regardless of system size. This is <strong>quantum Monte Carlo</strong> (QMC), the workhorse for unfrustrated magnets, bosons and many materials.</p>
<h2>When weights go negative</h2>
<p>The path weights are products of matrix elements ${m('−⟨c|H|c′⟩')}. If all off-diagonal elements of ${m('H')} are non-positive in the chosen basis (the Hamiltonian is <strong>stoquastic</strong>), every weight is positive. Otherwise some paths carry negative weight. One can still sample ${m('|weight|')} and attach the sign to the measurement, but then every estimate is divided by the <strong>average sign</strong></p>
${EQ('⟨sign⟩ = Z / Z<sub>|·|</sub> ∼ e<sup>−β N Δf</sup>, &nbsp;&nbsp; samples needed ∝ 1/⟨sign⟩²')}
<p>where ${m('Z<sub>|·|</sub>')} is the partition function of the “sign-free” system and ${m('Δf')} the difference of their free energies per site. The average sign falls exponentially with system size and inverse temperature, so the number of samples grows exponentially. Troyer and Wiese (2005) showed that a general solution of the sign problem would solve NP-hard problems, so a universal fix is not expected.</p>
${LAB('sign')}
<h2>Who has a sign problem?</h2>
<ul>
<li><strong>Fermions</strong> generically, because exchanging two fermions flips the sign of the wavefunction: the Hubbard model away from half filling, most of chemistry, nuclear matter.</li>
<li><strong>Frustrated magnets</strong>, such as antiferromagnets on triangular or kagome lattices or chains with competing couplings, as in the lab.</li>
<li><strong>Real-time dynamics</strong>, where ${m('e<sup>−iHt</sup>')} brings complex phases (the dynamical sign problem).</li>
</ul>
<p>The sign problem depends on the basis: an unfrustrated antiferromagnet on a bipartite lattice is sign-free after rotating every other spin, and clever bases, auxiliary-field methods and fixed-node approximations remove or tame it in special cases. In general, though, it is why Feynman’s argument for quantum simulators ([[L:noisesim]]) still stands, and why fermionic models are a leading target for quantum computers ([[L:chemistry]]).</p>
`,
  labs: {
    sign: {
      title: 'The average sign of a frustrated spin chain',
      cap: 'A Heisenberg ring with nearest-neighbour coupling J₁ = 1 and next-nearest J₂. For each ring size, the exact partition function Z and the sign-free partition function Z_|·| (all off-diagonal elements replaced by minus their magnitudes) are computed by exact diagonalization in the S_z = 0 sector; their ratio is the average sign a Monte Carlo simulation would face. With J₂ = 0 the chain is unfrustrated and the sign stays 1; with J₂ > 0 it decays exponentially in β, faster for larger rings.',
      build(body, id) {
        let J2 = .5, beta = 4; const SIZES = [6, 8, 10]; let spec = null, job = 0, pend = null;
        const cv = canvas('', 'height:270px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), st = h('div', { class: 'status' });
        const compute = () => { spec = SIZES.map(() => null); job = 0; q.inv(); };
        Scope.tick(() => { if (!spec || job >= SIZES.length) return; const n = SIZES[job], { H, D } = heisSector(n, J2), Ha = Float64Array.from(H, (v, k) => (Math.floor(k / D) === k % D) ? v : -Math.abs(v)); spec[job] = { w: Array.from(eigSymV(H, D).w), wa: Array.from(eigSymV(Ha, D).w) }; job++; q.inv(); text(); });
        const avgSign = (sp, b) => { const e0 = Math.min(sp.w[0], sp.wa[0]); const Z = sp.w.reduce((s, e) => s + Math.exp(-b * (e - e0)), 0), Za = sp.wa.reduce((s, e) => s + Math.exp(-b * (e - e0)), 0); return Z / Za; };
        const cols = T => [T.muted, T.copper, T.cyan];
        const q = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 10], y: [1e-4, 1.5], ylog: true, xt: [0, 2, 4, 6, 8, 10], yt: [1e-4, 1e-3, 1e-2, .1, 1], yf: v => String(v), xl: 'inverse temperature β', yl: '⟨sign⟩' });
          if (!spec) return; spec.forEach((sp, i) => { if (!sp) return; const pts = []; for (let b = 0; b <= 10.0001; b += .1) { const s = avgSign(sp, b); if (s > 1e-4) pts.push([A.X(b), A.Y(Math.min(1.4, s))]); } polyline(ctx, pts, cols(T)[i], 2.3); });
          ctx.strokeStyle = T.ink; ctx.globalAlpha = .4; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(A.X(beta), A.T); ctx.lineTo(A.X(beta), A.B); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        });
        const text = () => { const done = job >= SIZES.length; st.className = done ? 'status good' : 'status'; st.textContent = done ? 'Exact diagonalization finished.' : 'Diagonalizing…'; ro.innerHTML = `<span class="k">at β = ${num(beta, 1)}</span><br>` + SIZES.map((n, i) => { const sp = spec && spec[i]; if (!sp) return `<span class="k">N = ${n} </span>…`; const s = avgSign(sp, beta); const ns = 1 / (s * s); return `<span class="k">N = ${String(n).padStart(2)} </span>⟨sign⟩ = ${s > .999 ? '1.000' : sci(s)} &nbsp; <span class="k">samples ×</span>${s > .999 ? '1' : ns < 1e5 ? Math.round(ns).toLocaleString('en-US') : sci(ns)}`; }).join('<br>'); };
        const later = () => { if (pend) return; pend = Scope.later(150, () => { pend = null; compute(); text(); }); };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow(SIZES.map((n, i) => [`N = ${n}`, ['var(--muted)', 'var(--copper)', 'var(--cyan)'][i]]))),
          h('div', { class: 'stack' }, slider({ id: id('j'), label: 'Frustrating coupling J₂', min: 0, max: 1, step: .05, value: J2, fmt: v => num(v, 2), on: v => { J2 = v; later(); } }),
            slider({ id: id('b'), label: 'Read off at β', min: 0, max: 10, step: .1, value: beta, fmt: v => num(v, 1), on: v => { beta = v; q.inv(); text(); } }), st, ro)));
        compute(); text();
      }
    }
  },
  take: ['Quantum Monte Carlo maps Z = Tr e^(−βH) onto a sum over paths; positive weights make it a probability distribution with size-independent statistical error.',
    'For non-stoquastic Hamiltonians some weights are negative; estimates divide by the average sign, which decays like e^(−βNΔf).',
    'The required number of samples grows as 1/⟨sign⟩², exponentially in system size and inverse temperature; a general solution would solve NP-hard problems.',
    'Fermions, frustrated magnets and real-time dynamics suffer from it; it is basis dependent, and it is a central motivation for quantum simulation.'],
  quiz: QZ([
    ['What does quantum Monte Carlo sample?', ['Random unitaries', 'Paths of configurations in imaginary time, whose weights add up to the partition function', 'Measurement outcomes of a quantum computer', 'Eigenvectors'], 1, 'Trotterizing e^(−βH) turns the trace into a sum over world-line configurations.'],
    ['When are all path weights positive?', ['Always', 'When the Hamiltonian is stoquastic: all off-diagonal elements are non-positive in the chosen basis', 'Only at zero temperature', 'Only for fermions'], 1, 'Then −H has non-negative off-diagonal elements and every product of them is non-negative.'],
    ['What is the average sign?', ['The sign of the energy', 'The ratio Z / Z_|·| of the true partition function to that of the sign-free system', 'The magnetization', 'The number of negative eigenvalues'], 1, 'It measures how much cancellation occurs between positive and negative paths.'],
    ['How does the number of samples needed scale with the average sign?', ['Linearly', 'As 1/⟨sign⟩²', 'It is independent', 'Logarithmically'], 1, 'The relative error of the ratio of two noisy estimates grows as 1/⟨sign⟩.'],
    ['How does the average sign depend on system size N and inverse temperature β?', ['It grows', 'It decays roughly as e^(−βNΔf)', 'It is constant', 'It oscillates'], 1, 'Free-energy differences are extensive, so the decay is exponential in both.'],
    ['In the lab, why does the J₂ = 0 chain have no sign problem?', ['It has no interactions', 'An unfrustrated antiferromagnet on a bipartite lattice is sign-free once every other spin is rotated, so its paths have no net negative weight', 'Because N is even', 'Because β is small'], 1, 'The Marshall sign rule makes it stoquastic in a rotated basis.'],
    ['What did Troyer and Wiese show?', ['QMC is always efficient', 'A general solution of the sign problem would solve NP-hard problems, so none is expected', 'Fermions are easy', 'Monte Carlo is exact'], 1, 'They mapped a sign-problem instance to an NP-hard spin glass.'],
    ['Which systems typically have a sign problem?', ['Ferromagnets', 'Fermions, frustrated magnets and real-time dynamics', 'Free bosons', 'Classical gases'], 1, 'These are exactly the systems quantum simulators target.'],
    ['Is the sign problem basis independent?', ['Yes, always', 'No; a clever basis or transformation can remove it in special cases', 'It only exists in the energy basis', 'It is a hardware error'], 1, 'Finding a sign-free basis is itself hard in general.'],
    ['Why does the sign problem motivate quantum computers?', ['It doesn’t', 'Quantum simulation of fermions and frustrated systems avoids sampling signed weights, needing only polynomial resources for dynamics', 'Quantum computers have no signs', 'They make Monte Carlo faster'], 1, 'Feynman’s original argument for quantum simulation remains compelling for these systems.']
  ])
});

/* ---------- analog simulation: Bose–Hubbard ring (5 sites, 5 bosons) ---------- */
function bhBasis(L, Nb) { const out = []; const rec = (i, left, a) => { if (i === L - 1) { out.push(a.concat([left])); return; } for (let k = left; k >= 0; k--) rec(i + 1, left - k, a.concat([k])); }; rec(0, Nb, []); return out; }
function bhGround(L, Nb, U) {
  const B = bhBasis(L, Nb), idx = new Map(B.map((s, i) => [s.join(','), i])), D = B.length, H = new Float64Array(D * D);
  B.forEach((s, i) => { H[i * D + i] = .5 * U * s.reduce((a, n) => a + n * (n - 1), 0); for (let j = 0; j < L; j++) { const k = (j + 1) % L; for (const [a, b] of [[j, k], [k, j]]) { if (s[b] === 0) continue; const t = s.slice(); const amp = Math.sqrt(t[b]) * Math.sqrt(t[a] + 1); t[b]--; t[a]++; H[idx.get(t.join(',')) * D + i] -= amp; } } });
  const { V } = eigSymV(H, D), v = [...Array(D)].map((_, i) => V[i * D]);
  const pn = new Array(Nb + 1).fill(0); B.forEach((s, i) => { pn[s[0]] += v[i] * v[i]; });
  const corr = []; for (let r = 0; r < L; r++) { let c3 = 0; B.forEach((s, i) => { if (r === 0) { c3 += v[i] * v[i] * s[0]; return; } if (s[r] === 0) return; const t = s.slice(), amp = Math.sqrt(t[r]) * Math.sqrt(t[0] + 1); t[r]--; t[0]++; c3 += v[idx.get(t.join(','))] * amp * v[i]; }); corr.push(c3); }
  const nk = [...Array(L)].map((_, k) => corr.reduce((s, c3, r) => s + c3 * Math.cos(TAU * k * r / L), 0));
  const mean = pn.reduce((s, p, n) => s + p * n, 0), vr = pn.reduce((s, p, n) => s + p * (n - mean) ** 2, 0);
  return { pn, nk, vr };
}
LESSONS.push({
  id: 'analog', n: 33.7, stage: SIM, minutes: 15, title: 'Analog quantum simulators',
  lede: 'Instead of compiling a model into gates, build a physical system that obeys the same equations and watch it. Cold atoms in light crystals, trapped ions and Rydberg arrays have simulated quantum magnets and superfluids at sizes no classical computer can follow exactly.',
  html: `
<h2>Feynman’s other idea</h2>
<p>Feynman’s 1982 proposal had two halves: universal quantum computers, and controllable quantum systems that imitate other quantum systems. An <strong>analog quantum simulator</strong> implements a target Hamiltonian directly in its native physics and lets it evolve continuously, without gates or error correction. It cannot run arbitrary algorithms, but for the models it implements it can be far larger than today’s digital machines.</p>
<h2>Atoms in a crystal of light</h2>
<p>Ultracold atoms loaded into an optical lattice, a standing wave of laser light, hop between lattice sites and interact when they share one. That is the <strong>Bose–Hubbard model</strong></p>
${EQ('H = −J Σ<sub>⟨ij⟩</sub> (b<sub>i</sub><sup>†</sup>b<sub>j</sub> + h.c.) + (U/2) Σ<sub>i</sub> n<sub>i</sub>(n<sub>i</sub> − 1)')}
<p>with tunnelling ${m('J')} set by the lattice depth and interaction ${m('U')} by atomic collisions. For weak interactions the atoms form a <strong>superfluid</strong>, delocalized over the lattice with phase coherence; for strong interactions each site holds exactly one atom, a <strong>Mott insulator</strong>. Greiner, Mandel, Esslinger, Hänsch and Bloch observed this quantum phase transition in 2002 by releasing the atoms: a superfluid produces sharp interference peaks, a Mott insulator a featureless cloud.</p>
${LAB('bh')}
<h2>Platforms and achievements</h2>
<ul>
<li><strong>Quantum gas microscopes</strong> image every atom in a lattice, measuring correlations and entanglement entropy directly; fermionic atoms simulate the Hubbard model of high-temperature superconductors.</li>
<li><strong>Rydberg arrays</strong> ([[L:atoms]]) simulate quantum magnets and have shown quantum spin liquid signatures and many-body scars.</li>
<li><strong>Trapped ions</strong> ([[L:ions]]) implement long-range Ising and XY models with dozens of spins, used to study dynamical phase transitions and thermalization.</li>
<li><strong>Annealers and superconducting arrays</strong> simulate spin glasses and lattice models ([[L:annealing]]).</li>
</ul>
<h2>The catch: trust</h2>
<p>An analog simulator has no error correction, and its Hamiltonian is only approximately the target. When it outperforms classical simulation, how do we know it is right? Strategies include benchmarking against solvable limits, checking that results are robust to deliberate changes in noise, comparing different platforms, and verification protocols that learn the implemented Hamiltonian. Digital–analog hybrids and, eventually, fault-tolerant digital simulation ([[L:qpe]]) offer guarantees analog machines cannot.</p>
`,
  labs: {
    bh: {
      title: 'Superfluid to Mott insulator in a small ring',
      cap: 'Exact ground state of five bosons on a five-site ring (126 basis states). Left: probability of finding n atoms on one site. In the superfluid (small U/J) the number fluctuates widely; in the Mott insulator (large U/J) it is pinned at one. Middle: momentum distribution n(k), the Fourier transform of the single-particle correlations, which is what a time-of-flight image shows: a sharp peak at k = 0 means phase coherence. Right: site-number variance against U/J; in an infinite three-dimensional lattice the transition sits near U/J ≈ 29 for one atom per site, while this tiny ring shows a smooth crossover.',
      build(body, id) {
        let U = 4, R = null; const curve = []; const US = []; for (let u = 0; u <= 40.0001; u += 2) US.push(u); let job = 0;
        const c1 = canvas('', 'height:200px'), c2 = canvas('', 'height:200px'), c3 = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const run = () => { R = bhGround(5, 5, U); q1.inv(); q2.inv(); q3.inv(); text(); };
        Scope.tick(() => { if (job >= US.length) return; curve.push([US[job], bhGround(5, 5, US[job]).vr]); job++; q3.inv(); });
        const q1 = painter(c1, ({ ctx, w, h: H }) => { if (!R) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [-.5, 5.5], y: [0, 1], xt: [0, 1, 2, 3, 4, 5], yt: [0, .5, 1], xl: 'atoms on a site', yl: 'probability' }), bw = (A.X(1) - A.X(0)) * .6; R.pn.forEach((p, n) => { ctx.fillStyle = T.cyan; ctx.fillRect(A.X(n) - bw / 2, A.Y(p), bw, A.B - A.Y(p)); }); });
        const q2 = painter(c2, ({ ctx, w, h: H }) => { if (!R) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [-2.5, 2.5], y: [0, 5.2], xt: [-2, -1, 0, 1, 2], xf: v => (v ? (v > 0 ? '' : MINUS) + Math.abs(v) + '·2π/5' : '0'), yt: [0, 1, 5], xl: 'quasi-momentum k', yl: 'n(k)' }), bw = (A.X(1) - A.X(0)) * .6; for (let k = -2; k <= 2; k++) { const v = R.nk[(k + 5) % 5]; ctx.fillStyle = k === 0 ? T.copper : rgba(T.copper, .55); ctx.fillRect(A.X(k) - bw / 2, A.Y(v), bw, A.B - A.Y(v)); } });
        const q3 = painter(c3, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 40], y: [0, 1], xt: [0, 10, 20, 30, 40], yt: [0, .5, 1], xl: 'U / J', yl: 'site-number variance' }); polyline(ctx, curve.map(([u, v]) => [A.X(u), A.Y(v)]), T.ink, 2.2); if (R) dot(ctx, A.X(U), A.Y(R.vr), 6, T.copper, T.surface); });
        const text = () => { ro.innerHTML = `<span class="k">U/J </span>${num(U, 1)} &nbsp; <span class="k">site-number variance </span>${num(R.vr, 3)}<br><span class="k">condensate fraction n(0)/N </span>${pct(R.nk[0] / 5, 0)}<br><span class="k">P(exactly one atom per site, one site) </span>${pct(R.pn[1], 0)}`; };
        body.append(h('div', { class: 'split even' }, c1, c2), h('div', { class: 'split' }, c3, h('div', { class: 'stack' }, slider({ id: id('u'), label: 'Interaction U / tunnelling J', min: 0, max: 40, step: .5, value: U, fmt: v => num(v, 1), on: v => { U = v; run(); } }), ro)));
        run();
      }
    }
  },
  take: ['Analog simulators implement a target Hamiltonian directly and let it evolve, without gates; they are less flexible but can be much larger than digital machines.',
    'Cold atoms in optical lattices realize the Bose–Hubbard model; the superfluid–Mott insulator transition was observed in 2002.',
    'Quantum gas microscopes, Rydberg arrays, trapped ions and annealers simulate magnets, superfluids and spin liquids.',
    'Without error correction, verifying analog results beyond classical reach is the central challenge.'],
  quiz: QZ([
    ['What distinguishes an analog quantum simulator from a digital quantum computer?', ['It uses classical bits', 'It implements a target Hamiltonian directly and evolves continuously, rather than compiling into gates', 'It is always smaller', 'It uses error correction'], 1, 'Analog simulators trade universality for scale and simplicity.'],
    ['What do J and U represent in the Bose–Hubbard model?', ['Temperature and pressure', 'Tunnelling between neighbouring sites and on-site interaction energy', 'Spin and charge', 'Gate times'], 1, 'Lattice depth controls J, and atomic collisions control U.'],
    ['What characterizes the superfluid phase?', ['One atom per site exactly', 'Delocalized atoms with large number fluctuations and long-range phase coherence', 'No atoms', 'Random phases'], 1, 'Coherence shows up as sharp interference peaks after release.'],
    ['What characterizes the Mott insulator?', ['Large number fluctuations', 'A fixed integer number of atoms per site and no phase coherence', 'Superconductivity', 'A Bose–Einstein condensate'], 1, 'Strong repulsion pins the occupation, suppressing hopping.'],
    ['How was the superfluid–Mott transition observed in 2002?', ['By measuring resistance', 'By releasing atoms from the lattice and imaging interference: sharp peaks for the superfluid, a featureless cloud for the Mott insulator', 'By neutron scattering', 'By counting photons'], 1, 'Time-of-flight imaging maps momentum distributions.'],
    ['In the lab, what happens to n(k = 0) as U/J increases?', ['It grows', 'It falls, as phase coherence is lost and the momentum distribution flattens', 'It stays at 5', 'It becomes negative'], 1, 'The condensate fraction shrinks as atoms localize.'],
    ['What can a quantum gas microscope do?', ['Factor numbers', 'Image individual atoms in an optical lattice, measuring site-resolved occupations and correlations', 'Cool atoms to absolute zero', 'Create photons'], 1, 'Site resolution enables direct measurement of correlations and entanglement.'],
    ['Which model of high-temperature superconductivity do fermionic cold atoms simulate?', ['The Ising model', 'The Fermi–Hubbard model', 'The Schwinger model', 'The Dicke model'], 1, 'Its doped phase diagram is classically hard because of the sign problem.'],
    ['What is the main difficulty in trusting analog simulators beyond classical reach?', ['They are too slow', 'Lack of error correction and only approximate Hamiltonians make results hard to verify', 'They need quantum RAM', 'They cannot be measured'], 1, 'Cross-platform checks and Hamiltonian learning are among the responses.'],
    ['Why does the five-site ring show a smooth crossover instead of a sharp transition?', ['The model is wrong', 'Phase transitions are sharp only in the limit of infinite systems; small systems round them off', 'Because U is too small', 'Because bosons cannot localize'], 1, 'Finite-size effects smooth singularities, as in exact diagonalization studies ([[L:exactdiag]]).']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Boson sampling', 'Sampling the output of identical photons in a linear optical network; probabilities are permanents, believed hard to compute classically.', 'bosonsampling'],
  ['Permanent', 'The determinant’s sign-free cousin, Σ_σ Π_i A_iσ(i); #P-hard to compute exactly.', 'bosonsampling'],
  ['Simulated annealing', 'A classical heuristic that lowers the temperature of a Monte Carlo simulation to settle into low-energy states.', 'annealing'],
  ['Fourier sampling', 'Applying the quantum Fourier transform to a coset state and measuring, which yields random elements of the orthogonal subgroup.', 'hsp'],
  ['Sign problem', 'The exponential cost of quantum Monte Carlo when path weights can be negative, due to cancellations measured by the average sign.', 'signproblem'],
  ['Stoquastic Hamiltonian', 'A Hamiltonian whose off-diagonal elements are all non-positive in some basis, so quantum Monte Carlo has no sign problem.', 'signproblem'],
  ['Analog quantum simulator', 'A controllable quantum system that directly implements a target Hamiltonian, without compiling into gates.', 'analog'],
  ['Bose–Hubbard model', 'Bosons hopping on a lattice with on-site repulsion; it shows a superfluid to Mott insulator transition.', 'analog'],
  ['Mott insulator', 'A state in which strong repulsion pins each lattice site to a fixed number of particles, suppressing transport and coherence.', 'analog']
);
})();
