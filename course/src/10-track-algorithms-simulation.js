/* =====================================================================
   Research tracks · Algorithms and complexity · Simulation methods
   ===================================================================== */
(() => {
const ALG = 6, SIM = 7;
const bits = (x, n) => x.toString(2).padStart(n, '0');
const dotp = (a, b) => pc32(a & b) & 1;

/* ---------------- 29 · Query complexity ---------------- */
LESSONS.push({
  id: 'query', n: 29, stage: ALG, minutes: 15, title: 'Query complexity and hidden structure',
  lede: 'Proving that quantum computers are faster is hard in general, but in the query model, where you count calls to a black box, speedups and lower bounds can be proved outright.',
  html: `
<h2>The query model</h2>
<p>In the query model an algorithm learns about an input only by calling an oracle, and its cost is the number of calls. Everything else is free. This sounds artificial, but it is where almost every known quantum speedup was first found, and it is one of the few settings where theorists can prove that no algorithm does better. Grover’s ${m('√N')} is optimal there, as [[L:grover]] noted.</p>
<h2>Bernstein–Vazirani: n bits in one query</h2>
<p>Suppose ${m('f(x) = a·x mod 2')} for a hidden ${m('n')}-bit string ${m('a')}. Classically each query reveals one bit of information, so you need ${m('n')} queries. The Deutsch–Jozsa circuit, H on every qubit, one phase-oracle query, H again, puts all the amplitude on ${m('|a⟩')}. One query reveals the whole string, because the Hadamard transform turns the pattern of signs ${m('(−1)<sup>a·x</sup>')} into a single basis state.</p>
${LAB('bv')}
<h2>Simon’s problem: an exponential separation</h2>
<p>Now let ${m('f')} be two-to-one with a hidden period: ${m('f(x) = f(y)')} exactly when ${m('y = x ⊕ s')}. A classical algorithm, even a randomized one, has to find a collision, which takes about ${m('2<sup>n/2</sup>')} queries by the birthday bound. Simon’s 1994 algorithm runs the H–oracle–H circuit; each run returns a random ${m('y')} with ${m('y·s = 0')}. After about ${m('n')} runs, the equations pin down ${m('s')} by Gaussian elimination over GF(2). That is ${m('O(n)')} quantum queries against ${m('2<sup>n/2</sup>')} classical: an exponential gap, proved relative to the oracle. Shor read Simon’s paper and generalized the idea to the period of ${m('a<sup>x</sup> mod N')}.</p>
${LAB('simon')}
<h2>The hidden subgroup problem</h2>
<p>Simon’s and Shor’s algorithms are both instances of the <strong>hidden subgroup problem</strong>: a function on a group is constant on the cosets of an unknown subgroup; find the subgroup. For abelian groups, the quantum Fourier transform solves it efficiently. For some non-abelian groups it would be a breakthrough: the symmetric group would give graph isomorphism, and the dihedral group is connected to lattice problems behind post-quantum cryptography. Both remain open.</p>
<h2>Lower bounds</h2>
<ul>
<li><strong>The polynomial method</strong> (Beals, Buhrman, Cleve, Mosca and de Wolf, 1998): the acceptance probability after ${m('T')} queries is a polynomial of degree at most ${m('2T')} in the input bits. Functions that need high-degree polynomials need many queries. For example, computing the parity of ${m('N')} bits needs at least ${m('N/2')} queries, so quantum computers give almost no help there.</li>
<li><strong>The adversary method</strong> (Ambainis, 2000) bounds how fast queries can distinguish inputs with different answers. Its general form characterizes quantum query complexity exactly, up to a constant.</li>
</ul>
<p>Grover’s technique generalizes to <strong>amplitude amplification</strong> and <strong>amplitude estimation</strong>, which give a quadratic speedup for estimating averages, the core of Monte Carlo methods in finance and physics. Like Grover search, those speedups are provably the best possible in the query model.</p>
`,
  labs: {
    bv: {
      title: 'Bernstein–Vazirani',
      cap: 'Six qubits, 64 amplitudes. The oracle stamps the sign (−1)^(a·x) on each term; the final Hadamards collapse every amplitude onto |a⟩. Tap the bits of a to change the hidden string.',
      build(body, id) {
        const n = 6, N = 64; let a = 0b101101, stp = 0, cq = 0;
        const cv = canvas('', 'height:210px'), sb = new SignedBars(cv, N, { ymax: 1 }), stat = h('div', { class: 'status' }), bitsEl = h('div', { class: 'btns' }), cl = h('div', { class: 'readout' });
        const amps = k => k === 0 ? [...Array(N)].map((_, i) => i ? 0 : 1) : k === 1 ? new Array(N).fill(1 / 8) : k === 2 ? [...Array(N)].map((_, x) => (dotp(a, x) ? -1 : 1) / 8) : [...Array(N)].map((_, y) => y === a ? 1 : 0);
        const T_ = ['Start in |000000⟩.', 'After H on every qubit: all 64 inputs at once.', 'After one query: each sign is (−1)^(a·x).', `After H again: everything is on |${bits(a, n)}⟩. Measure to read a.`];
        const render = () => {
          sb.mark = stp === 3 ? a : -1; sb.to(amps(stp)); stat.className = 'status' + (stp === 3 ? ' good' : ''); stat.textContent = T_[stp];
          bitsEl.innerHTML = ''; for (let i = 0; i < n; i++) { const b = (a >> (n - 1 - i)) & 1; bitsEl.append(h('button', { type: 'button', class: 'gate', 'aria-label': `Bit ${i} of a is ${b}`, onclick: () => { a ^= 1 << (n - 1 - i); cq = 0; render(); } }, String(b))); }
          cl.innerHTML = `<span class="k">classical queries </span>${cq} of ${n}<br><span class="k">bits learned     </span>${[...Array(n)].map((_, i) => i < cq ? (a >> (n - 1 - i)) & 1 : '?').join('')}`;
        };
        body.append(cv, h('div', { class: 'split' }, h('div', { class: 'stack' }, stat, h('div', { class: 'btns' }, btn('Back', () => { if (stp) { stp--; render(); } }), btn('Next', () => { if (stp < 3) { stp++; render(); } }, 'pri'))),
          h('div', { class: 'stack' }, field('Hidden string a', bitsEl), field('Classical: query x = 100000, 010000, …', h('div', { class: 'btns' }, btn('Query one bit', () => { if (cq < n) { cq++; render(); } }), cl)))));
        sb.to(amps(0), true); render();
      }
    },
    simon: {
      title: 'Simon’s algorithm',
      cap: 'Each quantum run returns a random y with y·s = 0 (mod 2). New independent equations are kept; when n − 1 of them are in hand, only one nonzero s fits. The classical search queries random inputs until two give the same output.',
      build(body, id) {
        let n = 5, s, f, eqs, runs, cls, seen;
        const eqEl = h('div', { class: 'readout', style: 'white-space:normal;min-height:3em' }), stat = h('div', { class: 'status' }), cStat = h('div', { class: 'status' });
        const rank = () => { const basis = []; for (let y of eqs) { for (const b of basis) if ((y ^ b) < y) y ^= b; if (y) basis.push(y); basis.sort((x, z) => z - x); } return basis.length; };
        const fresh = () => {
          const N = 1 << n; s = 1 + Math.floor(Math.random() * (N - 1)); const lab = new Array(N).fill(-1), vals = [...Array(N / 2).keys()].sort(() => Math.random() - .5); let k = 0;
          for (let x = 0; x < N; x++) if (lab[x] < 0) { lab[x] = lab[x ^ s] = vals[k++]; }
          f = lab; eqs = []; runs = 0; cls = 0; seen = new Map(); render();
        };
        const solved = () => { if (rank() < n - 1) return null; const c2 = []; for (let x = 1; x < (1 << n); x++) if (eqs.every(y => !dotp(x, y))) c2.push(x); return c2.length === 1 ? c2[0] : null; };
        const run = () => { if (solved()) return; let y; do { y = Math.floor(Math.random() * (1 << n)); } while (dotp(y, s)); runs++; const r0 = rank(); eqs.push(y); if (rank() === r0) eqs.pop(); else eqs.ys = (eqs.ys || 0) + 1; render(y); };
        const render = (last) => {
          eqEl.innerHTML = eqs.length ? eqs.map(y => `y = ${bits(y, n)} &nbsp;→&nbsp; ${bits(y, n)} · s = 0`).join('<br>') : '<span class="k">No equations yet.</span>';
          const sol = solved();
          stat.className = 'status' + (sol ? ' good' : '');
          stat.textContent = sol ? `Solved after ${runs} quantum quer${runs === 1 ? 'y' : 'ies'}: s = ${bits(sol, n)}.` : `${runs} quantum quer${runs === 1 ? 'y' : 'ies'}, ${rank()} independent equation${rank() === 1 ? '' : 's'} of the ${n - 1} needed.` + (last != null ? ` Last result: ${bits(last, n)}.` : '');
          const hit = [...seen.entries()];
          cStat.className = 'status' + (cls && seen.size < cls ? ' good' : '');
          cStat.textContent = cls === 0 ? `Classical: query random inputs until two outputs match. Expect about ${num(Math.sqrt(Math.PI / 2 * (1 << n)), 0)} queries.` : seen.done ? `Collision after ${cls} classical queries: s = ${bits(seen.done, n)}.` : `${cls} classical queries, no collision yet.`;
          void hit;
        };
        const cq = () => { if (seen.done) return; const left = [...Array(1 << n).keys()].filter(x => !seen.has(x)); const x = left[Math.floor(Math.random() * left.length)]; cls++; for (const [x2, v] of seen) if (v === f[x]) seen.done = x ^ x2; seen.set(x, f[x]); render(); };
        body.append(h('div', { class: 'btns' }, field('Input bits n', seg([3, 4, 5, 6].map(v => ({ v, label: String(v) })), n, v => { n = v; fresh(); }, 'Input bits')), btn('New secret s', fresh)),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Run the quantum circuit', run, 'pri')), stat, field('Equations kept', eqEl)),
            h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Classical query', cq), btn('Query until collision', () => { while (!seen.done) cq(); })), cStat)));
        fresh();
      }
    }
  },
  take: ['In the query model, speedups and lower bounds can be proved rigorously.',
    'Bernstein–Vazirani learns an n-bit string with one query; classically it takes n.',
    'Simon’s algorithm: O(n) quantum queries versus about 2^(n/2) classical, the direct ancestor of Shor.',
    'The polynomial and adversary methods prove limits, such as N/2 queries for parity.'],
  quiz: [
    { q: 'Each run of Simon’s circuit returns a y satisfying…', o: ['y = s', 'y·s = 0 (mod 2)', 'y·s = 1 (mod 2)', 'f(y) = 0'], a: 1, why: 'Interference cancels every y with y·s = 1, leaving a uniform distribution over the others.' },
    { q: 'Which is a proven lower-bound technique for quantum query complexity?', o: ['The polynomial method', 'Gaussian elimination', 'The birthday paradox', 'Continued fractions'], a: 0, why: 'After T queries, acceptance probabilities are polynomials of degree at most 2T in the inputs.' }
  ]
});

/* ---------------- 30 · Phase estimation and Hamiltonian simulation ---------------- */
const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const ca = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mm = (A, B) => [[ca(cm(A[0][0], B[0][0]), cm(A[0][1], B[1][0])), ca(cm(A[0][0], B[0][1]), cm(A[0][1], B[1][1]))], [ca(cm(A[1][0], B[0][0]), cm(A[1][1], B[1][0])), ca(cm(A[1][0], B[0][1]), cm(A[1][1], B[1][1]))]];
const eX = t => [[[Math.cos(t), 0], [0, -Math.sin(t)]], [[0, -Math.sin(t)], [Math.cos(t), 0]]];
const eZ = t => [[[Math.cos(t), -Math.sin(t)], [0, 0]], [[0, 0], [Math.cos(t), Math.sin(t)]]];
const mpow = (A, r) => { let R = [[[1, 0], [0, 0]], [[0, 0], [1, 0]]]; for (let i = 0; i < r; i++) R = mm(R, A); return R; };
const norm2 = D => { const a = D[0][0][0] ** 2 + D[0][0][1] ** 2 + D[1][0][0] ** 2 + D[1][0][1] ** 2, c2 = D[0][1][0] ** 2 + D[0][1][1] ** 2 + D[1][1][0] ** 2 + D[1][1][1] ** 2;
  const br = D[0][0][0] * D[0][1][0] + D[0][0][1] * D[0][1][1] + D[1][0][0] * D[1][1][0] + D[1][0][1] * D[1][1][1], bi = D[0][0][0] * D[0][1][1] - D[0][0][1] * D[0][1][0] + D[1][0][0] * D[1][1][1] - D[1][0][1] * D[1][1][0];
  return Math.sqrt((a + c2) / 2 + Math.sqrt(((a - c2) / 2) ** 2 + br * br + bi * bi)); };
LESSONS.push({
  id: 'qpe', n: 30, stage: ALG, minutes: 14, title: 'Phase estimation and Hamiltonian simulation',
  lede: 'Quantum phase estimation reads out an eigenvalue of a unitary to many digits. Combined with Hamiltonian simulation, it is the workhorse behind Shor’s algorithm and quantum chemistry.',
  html: `
<h2>Quantum phase estimation</h2>
<p>Suppose ${m('U|u⟩ = e<sup>2πiφ</sup>|u⟩')} and you can prepare ${m('|u⟩')}. QPE uses ${m('t')} ancilla qubits in superposition. Ancilla ${m('j')} controls ${m('U<sup>2<sup>j</sup></sup>')}, which by phase kickback writes the phase ${m('2πφ·2<sup>j</sup>')} onto it. The ancillas then hold exactly the Fourier clocks of [[L:qft]], and an inverse QFT turns them into the binary digits of ${m('φ')}.</p>
<p>If ${m('φ')} has an exact ${m('t')}-bit expansion, QPE returns it with certainty. Otherwise the outcome is the nearest ${m('t')}-bit value with probability at least ${m('4/π² ≈ 41%')}, and within one step of it with probability at least 81%.</p>
${LAB('qpe')}
<h2>Heisenberg scaling</h2>
<p>Estimating a phase by repeating a single-shot experiment and averaging needs about ${m('1/ε²')} runs for precision ${m('ε')}. QPE uses about ${m('1/ε')} applications of ${m('U')} in total, because the controlled powers ${m('U<sup>2<sup>j</sup></sup>')} amplify small phase differences coherently. Shor’s algorithm is QPE applied to modular multiplication; chemistry applications apply it to ${m('U = e<sup>−iHt</sup>')} to read off energies.</p>
<h2>Hamiltonian simulation</h2>
<p>To run QPE on ${m('e<sup>−iHt</sup>')}, you first have to build that operator from gates. Most physical Hamiltonians are sums of simple terms, ${m('H = Σ<sub>j</sub> H<sub>j</sub>')}, each easy to exponentiate on its own. If the terms commuted you could apply them one after another. They usually don’t, but the <strong>Lie–Trotter product formula</strong> says that alternating many short steps works:</p>
${EQ('e<sup>−i(A+B)t</sup> ≈ (e<sup>−iAt/r</sup> e<sup>−iBt/r</sup>)<sup>r</sup>,&nbsp;&nbsp; error O(t²/r)')}
<p>The symmetric second-order formula ${m('e<sup>−iAτ/2</sup>e<sup>−iBτ</sup>e<sup>−iAτ/2</sup>')} has error ${m('O(t³/r²)')}. Seth Lloyd showed in 1996 that this makes local Hamiltonians efficiently simulable, confirming Feynman’s intuition. Newer techniques do better: linear combinations of unitaries (Berry, Childs and colleagues, 2015) come close, and quantum signal processing and <strong>qubitization</strong> (Low and Chuang, 2017–2019) reach the optimal cost of about ${m('t + log(1/ε)')} queries.</p>
${LAB('trotter')}
${NOTE('Linear systems and the fine print', `<p>The HHL algorithm (Harrow, Hassidim and Lloyd, 2009) uses QPE to “solve” linear systems ${m('Ax = b')} exponentially faster than classical methods. The speedup holds only if ${m('A')} is sparse and well conditioned, ${m('b')} can be loaded quickly, and you only need a few properties of the solution, which arrives as a quantum state rather than a list of numbers. Several claimed applications lose the advantage once these conditions are checked, and some have been matched by “dequantized” classical algorithms. [[L:hhl]] simulates the algorithm and reads the fine print in detail.</p>`)}
`,
  labs: {
    qpe: {
      title: 'Phase estimation outcomes',
      cap: 'Exact outcome probabilities for t ancilla qubits and eigenphase φ. The copper line marks the true phase. Phases with a short binary expansion, such as 0.375 = 0.011₂, are read perfectly; others spread over the neighbouring values.',
      build(body, id) {
        let phi = .3, t = 5;
        const cv = canvas('', 'height:220px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const P = m2 => { const M = 1 << t, dl = phi - m2 / M, s = Math.sin(PI * dl); return Math.abs(s) < 1e-12 ? 1 : (Math.sin(PI * M * dl) / (M * s)) ** 2; };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), M = 1 << t, A = axes(ctx, w, H, { x: [0, 1], y: [0, 1], xt: [0, .25, .5, .75, 1], yt: [0, .5, 1], yf: v => pct(v, 0), xl: 'estimate m / 2ᵗ', yl: 'probability' });
          const bw = Math.max(1, (A.R - A.L) / M * .7);
          for (let k = 0; k < M; k++) { const p = P(k); if (p < 1e-4) continue; ctx.fillStyle = T.cyan; ctx.fillRect(A.X(k / M) - bw / 2, A.Y(p), bw, A.B - A.Y(p)); }
          polyline(ctx, [[A.X(phi), A.T], [A.X(phi), A.B]], T.copper, 2);
        });
        const upd = () => {
          const M = 1 << t, best = Math.round(phi * M) % M, pb = P(best), near = P((best + 1) % M) + P((best - 1 + M) % M) + pb;
          ro.innerHTML = `Most likely estimate ${best}/${M} = ${num(best / M, 4)} (binary 0.${bits(best, t)}) with probability <b>${pct(pb, 1)}</b>; within one step <b>${pct(near, 1)}</b>. Uses ${M - 1} applications of U in total.`;
          pc.inv();
        };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('phi'), label: 'True phase φ', min: 0, max: .999, step: .001, value: phi, fmt: v => num(v, 3), on: v => { phi = v; upd(); } }),
          slider({ id: id('t'), label: 'Ancilla qubits t', min: 1, max: 8, step: 1, value: t, fmt: String, on: v => { t = v; upd(); } }),
          h('div', { class: 'btns' }, ...[.375, .3, 1 / 3, .5].map(v => btn('φ = ' + (Math.abs(v - 1 / 3) < 1e-9 ? '1/3' : v), () => { phi = v; body.querySelector('#' + id('phi')).value = v; body.querySelector('#' + id('phi')).dispatchEvent(new Event('input')); }, 'sm'))), ro)));
        upd();
      }
    },
    trotter: {
      title: 'Trotter error',
      cap: 'Exact evolution under H = X + Z (dots on the sphere) versus a Trotterized path that alternates rotations about z and x (copper trail). The chart shows the operator-norm error against the number of steps r on log scales: slope −1 for first order, −2 for second order.',
      build(body, id) {
        let t = 2, r = 4, ord = 1;
        const sph = canvas('sq', 'max-width:300px;margin:0 auto'), bv = new BlochView(sph, { trail: false }), cv = canvas('', 'height:230px'), ro = h('div', { class: 'chipline' });
        const exact = tt => { const cs = Math.cos(Math.SQRT2 * tt), s = Math.sin(Math.SQRT2 * tt) / Math.SQRT2; return [[[cs, -s], [0, -s]], [[0, -s], [cs, s]]]; };
        const trot = (tt, rr, o) => { const tau = tt / rr, step = o === 1 ? mm(eX(tau), eZ(tau)) : mm(mm(eX(tau / 2), eZ(tau)), eX(tau / 2)); return mpow(step, rr); };
        const err = (tt, rr, o) => { const U = exact(tt), Vv = trot(tt, rr, o); return norm2([[ca(U[0][0], [-Vv[0][0][0], -Vv[0][0][1]]), ca(U[0][1], [-Vv[0][1][0], -Vv[0][1][1]])], [ca(U[1][0], [-Vv[1][0][0], -Vv[1][0][1]]), ca(U[1][1], [-Vv[1][1][0], -Vv[1][1][1]])]]); };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 128], xlog: true, y: [1e-6, 2], ylog: true, xt: [1, 2, 4, 8, 16, 32, 64, 128], yt: [1e-6, 1e-4, 1e-2, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'Trotter steps r', yl: 'error ‖U − V‖' });
          for (const [o, col] of [[1, T.copper], [2, T.cyan]]) { const pts = []; for (let rr = 1; rr <= 128; rr++) pts.push([A.X(rr), A.Y(clamp(err(t, rr, o), 1e-6, 2))]); polyline(ctx, pts, col, 2.2); txt(ctx, o === 1 ? '1st order' : '2nd order', A.X(100), A.Y(clamp(err(t, 100, o), 1e-6, 2)) - 10, { color: col, font: '600 11px "JetBrains Mono",monospace' }); }
          dot(ctx, A.X(r), A.Y(clamp(err(t, r, ord), 1e-6, 2)), 6, T.ink, T.surface);
        });
        const upd = () => {
          const ax = [Math.SQRT1_2, 0, Math.SQRT1_2]; bv.extra = []; for (let i = 0; i <= 80; i++) bv.extra.push({ v: V.rot([0, 0, 1], ax, 2 * Math.SQRT2 * t * i / 80), r: 2.2 });
          let v = [0, 0, 1]; const tr = [v]; const tau = t / r;
          const seq = ord === 1 ? [[[0, 0, 1], 2 * tau], [[1, 0, 0], 2 * tau]] : [[[1, 0, 0], tau], [[0, 0, 1], 2 * tau], [[1, 0, 0], tau]];
          for (let k = 0; k < r; k++) for (const [axis, ang] of seq) for (let s = 1; s <= 6; s++) { tr.push(V.rot(v, axis, ang * s / 6)); if (s === 6) v = tr[tr.length - 1]; }
          bv.trail = tr; bv.v = v; bv.target = V.rot([0, 0, 1], ax, 2 * Math.SQRT2 * t); bv.inv(); pc.inv();
          ro.innerHTML = `<span>error at r = ${r} <b>${sci(err(t, r, ord), 2)}</b></span><span>doubling r divides it by about <b>${num(err(t, r, ord) / err(t, 2 * r, ord), 1)}</b></span>`;
        };
        body.append(h('div', { class: 'split' }, sph, h('div', { class: 'stack' },
          field('Formula', seg([{ v: 1, label: 'First order' }, { v: 2, label: 'Second order' }], ord, v => { ord = v; upd(); }, 'Trotter order')),
          slider({ id: id('t'), label: 'Total time t', min: .2, max: 4, step: .1, value: t, fmt: v => num(v, 1), on: v => { t = v; upd(); } }),
          slider({ id: id('r'), label: 'Steps r', min: 1, max: 64, step: 1, value: r, fmt: String, on: v => { r = v; upd(); } }), ro)), cv);
        upd();
      }
    }
  },
  take: ['QPE writes an eigenphase into ancilla qubits via controlled powers of U, then reads it with an inverse QFT.',
    'It reaches precision ε with about 1/ε applications of U (Heisenberg scaling).',
    'Trotter formulas build e^(−iHt) from simple pieces; first order has error O(t²/r), second order O(t³/r²).',
    'Qubitization achieves optimal simulation cost; HHL-type speedups come with strict conditions.'],
  quiz: [
    { q: 'With t = 4 ancillas, which phase does QPE read with certainty?', o: ['0.3', '0.3125', '1/3', '0.33'], a: 1, why: '0.3125 = 5/16 = 0.0101₂ has an exact 4-bit expansion.' },
    { q: 'Doubling r in a second-order Trotter formula divides the error by about…', o: ['2', '4', '8', '√2'], a: 1, why: 'The second-order formula has error of order t³/r², so doubling r divides the error by about four, compared with two for the first-order formula. In the lab’s log–log chart these are slopes of −2 and −1.' }
  ]
});

/* ---------------- 31 · Complexity classes and quantum advantage ---------------- */
const CLS = {
  P: [270, 405, 'Problems a deterministic classical computer solves in polynomial time.'],
  BPP: [210, 340, 'Polynomial time on a randomized classical computer with bounded error. Widely believed to equal P.'],
  NP: [340, 330, 'Problems whose yes-answers have certificates checkable in polynomial time. SAT is NP-complete.'],
  MA: [300, 255, 'Merlin–Arthur: like NP, but the verifier may use randomness.'],
  BQP: [120, 285, 'Bounded-error quantum polynomial time. Contains factoring, discrete logarithms and simulation of quantum dynamics.'],
  QMA: [170, 200, 'Quantum Merlin–Arthur: a quantum proof checked by a quantum verifier. The k-local Hamiltonian problem is QMA-complete (Kitaev, 1999), so estimating ground-state energies is hard even for quantum computers in the worst case.'],
  PH: [380, 170, 'The polynomial hierarchy, built from NP with alternating quantifiers. Relative to an oracle, BQP is not contained in PH (Raz and Tal, 2018).'],
  PP: [170, 115, 'Probabilistic polynomial time with unbounded error. Contains BQP (Adleman, DeMarrais and Huang, 1997) and QMA, and equals PostBQP, quantum computing with postselection (Aaronson, 2005).'],
  PSPACE: [280, 60, 'Polynomial memory, unlimited time. Contains every class below it. Deciding quantified Boolean formulas is PSPACE-complete.'],
  EXP: [280, 10, 'Exponential time. Strictly larger than P, by the time hierarchy theorem; one of the few separations actually proved.']
};
const EDGES = [['P', 'NP'], ['P', 'BPP'], ['NP', 'MA'], ['BPP', 'MA'], ['BPP', 'BQP'], ['MA', 'QMA'], ['MA', 'PH'], ['BQP', 'QMA'], ['QMA', 'PP'], ['PP', 'PSPACE'], ['PH', 'PSPACE'], ['PSPACE', 'EXP']];
LESSONS.push({
  id: 'advantage', n: 31, stage: ALG, minutes: 14, title: 'Complexity classes and quantum advantage',
  lede: 'Where does BQP sit among the classical complexity classes, and what does it take to demonstrate that a real device beats every classical computer?',
  html: `
<h2>The landscape around BQP</h2>
<p>[[L:complexity]] placed BQP between P and PSPACE. The finer picture includes quantum versions of proof-checking classes. <strong>QMA</strong> is to BQP what NP is to P: a quantum proof that a quantum computer can verify. Its natural complete problem is estimating the ground-state energy of a local Hamiltonian, which is why even a perfect quantum computer is not expected to solve every chemistry problem efficiently: it needs a good starting state, and finding one can be hard.</p>
${LAB('zoo')}
<p>Almost none of the separations in this diagram are proved. Nobody knows whether P = PSPACE, so nobody can prove BQP ≠ P. What theory can do is show that certain quantum tasks are hard for classical computers <em>unless</em> something widely disbelieved happens, such as the polynomial hierarchy collapsing.</p>
<h2>Sampling as an advantage test</h2>
<p>Factoring needs a large fault-tolerant machine. Sampling tasks were proposed as earlier tests: BosonSampling (Aaronson and Arkhipov, 2011), IQP circuits (Bremner, Jozsa and Shepherd), and <strong>random circuit sampling</strong>. If a classical computer could sample exactly from these output distributions efficiently, the polynomial hierarchy would collapse. Approximate versions, the ones experiments actually do, rest on additional conjectures.</p>
<p>The output probabilities of a deep random circuit follow the <strong>Porter–Thomas</strong> distribution: the rescaled probabilities ${m('Np')} are exponentially distributed. Experiments check that a device samples from the right distribution with the <strong>linear cross-entropy benchmark</strong>,</p>
${EQ('F<sub>XEB</sub> = N ⟨p(x)⟩<sub>samples</sub> − 1')}
<p>which is about 1 for a perfect device and 0 for uniform noise. Computing it needs the ideal probabilities, so it is only checkable for circuits small enough to simulate, or by extrapolation.</p>
${LAB('rcs')}
<h2>A moving target</h2>
<p>Google’s 2019 Sycamore experiment sampled 53-qubit circuits and estimated that a supercomputer would need thousands of years. Within a few years, improved tensor-network contraction methods reproduced comparable samples on classical clusters in hours. Later experiments used more qubits and deeper circuits and are much harder to spoof. The same pattern appears in other claims: Ewin Tang’s 2018 classical algorithm for recommendation systems “dequantized” a celebrated quantum speedup. Quantum advantage claims are tested by classical algorithm designers, and the boundary moves as both sides improve.</p>
`,
  labs: {
    zoo: {
      title: 'A map of the classes',
      cap: 'Lines show inclusions that are proved (lower class inside upper class). Whether any of them is strict, apart from P ⊊ EXP, is unknown. Tap a class to read about it.',
      build(body, id) {
        let sel = 'BQP'; const svg = sv('svg', { viewBox: '0 0 480 430', width: '100%', style: 'max-width:480px;display:block;margin:0 auto', class: 'zoo', role: 'img', 'aria-label': 'Complexity class inclusion diagram' });
        const desc = h('div', { class: 'status' });
        const draw = () => {
          svg.innerHTML = '';
          for (const [a, b] of EDGES) { const A = CLS[a], B = CLS[b]; svg.append(sv('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1] + 14, class: 'zoo-e' + (a === sel || b === sel ? ' on' : '') })); }
          for (const [k, [x, y]] of Object.entries(CLS)) {
            const g = sv('g', { class: 'zoo-n' + (k === sel ? ' on' : '') + (['BQP', 'QMA'].includes(k) ? ' q' : ''), tabindex: 0, role: 'button', 'aria-label': k });
            const w = k.length * 11 + 22; g.append(sv('rect', { x: x - w / 2, y: y, width: w, height: 26, rx: 13 }), sv('text', { x, y: y + 13 }, k));
            const act = () => { sel = k; draw(); }; g.addEventListener('click', act); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
            svg.append(g);
          }
          desc.innerHTML = `<b>${sel}.</b> ${CLS[sel][2]}`;
        };
        body.append(h('div', { class: 'split' }, h('div', { class: 'scroll-x' }, svg), h('div', { class: 'stack' }, desc, h('p', { class: 'hint' }, 'Quantum classes are outlined in blue. Inclusions between classes on different branches, such as BQP versus NP, are unknown.'))));
        draw();
      }
    },
    rcs: {
      title: 'Random circuits and Porter–Thomas',
      cap: 'A 10-qubit random circuit: each cycle applies a random √X, √Y or √W to every qubit, then CZ gates on alternating pairs. Bars show the distribution of rescaled output probabilities Np; the curve is the Porter–Thomas law e^(−x). Noise mixes in uniform random bitstrings.',
      build(body, id) {
        const n = 10, N = 1 << n; let depth = 12, eps = 0, seed = 7, p = null;
        const cv = canvas('', 'height:230px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const GS = [Rn([1, 0, 0], PI / 2), Rn([0, 1, 0], PI / 2), Rn([S2, S2, 0], PI / 2)];
        const build = () => {
          const R = rng(seed), s = new QState(n), prev = new Array(n).fill(-1);
          for (let c2 = 0; c2 < depth; c2++) {
            for (let q = 0; q < n; q++) { let g; do { g = Math.floor(R() * 3); } while (g === prev[q]); prev[q] = g; s.apply(q, GS[g]); }
            for (let q = c2 % 2; q + 1 < n; q += 2) s.cz(q, q + 1);
          }
          p = s.probs();
        };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), B = 24, X = 6, bins = new Array(B).fill(0); for (const v of p) { const k = Math.floor(v * N / X * B); if (k < B) bins[k]++; }
          const A = axes(ctx, w, H, { x: [0, X], y: [0, 1.1], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, .5, 1], xl: 'N · p', yl: 'density' }), bw = (A.R - A.L) / B;
          bins.forEach((c2, k) => { const dens = c2 / N / (X / B); ctx.fillStyle = rgba(T.cyan, .75); ctx.fillRect(A.L + k * bw + 1, A.Y(Math.min(1.1, dens)), bw - 2, A.B - A.Y(Math.min(1.1, dens))); });
          const pts = []; for (let x = 0; x <= X; x += .05) pts.push([A.X(x), A.Y(Math.exp(-x))]); polyline(ctx, pts, T.copper, 2.4);
          txt(ctx, 'Porter–Thomas', A.X(1.2), A.Y(Math.exp(-1.2)) - 12, { align: 'left', color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
        });
        const upd = () => {
          build(); const ideal = N * p.reduce((s, v) => s + v * v, 0) - 1;
          const cum = []; let s = 0; for (const v of p) { s += (1 - eps) * v + eps / N; cum.push(s); }
          let acc = 0; const K = 4000; for (let k = 0; k < K; k++) { const r = Math.random() * s; let lo = 0, hi = N - 1; while (lo < hi) { const md = (lo + hi) >> 1; if (cum[md] < r) lo = md + 1; else hi = md; } acc += N * p[lo]; }
          ro.innerHTML = `Ideal XEB of this circuit <b>${num(ideal, 3)}</b> (Porter–Thomas predicts 1). Sampling 4,000 bitstrings from a device with ${pct(eps, 0)} noise gives an estimated XEB of <b>${num(acc / K - 1, 3)}</b>, close to (1 − noise) × ideal = ${num((1 - eps) * ideal, 3)}.`;
          pc.inv();
        };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('d'), label: 'Circuit depth (cycles)', min: 1, max: 20, step: 1, value: depth, fmt: String, on: v => { depth = v; upd(); } }),
          slider({ id: id('e'), label: 'Device noise (fraction of random outputs)', min: 0, max: 1, step: .05, value: eps, fmt: v => pct(v, 0), on: v => { eps = v; upd(); } }),
          btn('New random circuit', () => { seed = Math.floor(Math.random() * 1e9); upd(); }), ro)));
        upd();
      }
    }
  },
  take: ['QMA is the quantum analogue of NP; local Hamiltonian ground energies are QMA-complete.',
    'BQP ⊆ PP ⊆ PSPACE is proved; separations from classical classes are not.',
    'Deep random circuits produce Porter–Thomas statistics; linear XEB measures how faithfully a device samples them.',
    'Advantage claims are tested by better classical algorithms, and some have been overturned.'],
  quiz: [
    { q: 'Which problem is QMA-complete?', o: ['Factoring', 'Estimating the ground energy of a k-local Hamiltonian', 'Unstructured search', 'Graph isomorphism'], a: 1, why: 'Kitaev’s quantum Cook–Levin theorem: the local Hamiltonian problem is QMA-complete.' },
    { q: 'A device outputs uniformly random bitstrings. What is its linear XEB?', o: ['About 0', 'About 1', 'About −1', 'About N'], a: 0, why: 'For uniform samples, N⟨p⟩ = N × (1/N) = 1, so F_XEB = 0.' }
  ]
});

/* ---------------- 32 · Density matrices and noise channels ---------------- */
const CH = {
  dep: { name: 'Depolarizing', map: p => ({ s: [1 - p, 1 - p, 1 - p], t: [0, 0, 0] }), kraus: '√(1 − 3p/4)·I,&nbsp; √(p/4)·X,&nbsp; √(p/4)·Y,&nbsp; √(p/4)·Z', say: 'Shrinks the sphere uniformly toward the center: with probability p the state is replaced by the completely mixed state.' },
  amp: { name: 'Amplitude damping', map: g => ({ s: [Math.sqrt(1 - g), Math.sqrt(1 - g), 1 - g], t: [0, 0, g] }), kraus: `K₀ = ${MX([['1', '0'], ['0', '√(1−γ)']])},&nbsp; K₁ = ${MX([['0', '√γ'], ['0', '0']])}`, say: 'Energy relaxation (T₁): squashes the sphere toward the north pole |0⟩.' },
  phase: { name: 'Phase damping', map: l => ({ s: [Math.sqrt(1 - l), Math.sqrt(1 - l), 1], t: [0, 0, 0] }), kraus: `K₀ = ${MX([['1', '0'], ['0', '√(1−λ)']])},&nbsp; K₁ = ${MX([['0', '0'], ['0', '√λ']])}`, say: 'Pure dephasing (T₂): flattens the sphere into a cigar along z; populations are untouched.' },
  flip: { name: 'Bit flip', map: p => ({ s: [1, 1 - 2 * p, 1 - 2 * p], t: [0, 0, 0] }), kraus: '√(1 − p)·I,&nbsp; √p·X', say: 'Applies X with probability p: shrinks y and z, leaves x alone. At p = ½ the sphere becomes a line segment.' }
};
LESSONS.push({
  id: 'noisesim', n: 32, stage: SIM, minutes: 15, title: 'Density matrices and noise channels',
  lede: 'Simulating real devices means simulating noise. The language for that is the density matrix and the quantum channel, and the main tools are a few open-source frameworks you can run on a laptop.',
  html: `
<h2>Density matrices</h2>
<p>A noisy qubit is not in one definite pure state but in a statistical mixture. Its <strong>density matrix</strong> ${m('ρ = Σ<sub>i</sub> p<sub>i</sub> |ψ<sub>i</sub>⟩⟨ψ<sub>i</sub>|')} captures every measurable property. For one qubit it is exactly the Bloch vector inside the ball:</p>
${EQ('ρ = ½ (I + xX + yY + zZ),&nbsp;&nbsp; |r| ≤ 1')}
<p>Pure states have ${m('|r| = 1')}; the center is the completely mixed state ${m('I/2')}. For ${m('n')} qubits the density matrix is ${m('2ⁿ × 2ⁿ')}, so it needs ${m('4ⁿ')} numbers: simulating noise exactly costs the square of simulating a pure state.</p>
<h2>Channels and Kraus operators</h2>
<p>Any physically allowed noise process is a completely positive, trace-preserving map, a <strong>quantum channel</strong>. Every channel can be written with Kraus operators:</p>
${EQ('ε(ρ) = Σ<sub>k</sub> K<sub>k</sub> ρ K<sub>k</sub><sup>†</sup>,&nbsp;&nbsp; Σ<sub>k</sub> K<sub>k</sub><sup>†</sup>K<sub>k</sub> = I')}
<p>On a single qubit, every channel acts on the Bloch ball as an affine map: it squashes the ball into an ellipsoid and may shift it. Watching the shape is the quickest way to understand a noise model.</p>
${LAB('channels')}
<h2>Continuous-time noise</h2>
<p>For noise acting continuously, the <strong>Lindblad master equation</strong> generalizes the Schrödinger equation:</p>
${EQ('dρ/dt = −i[H, ρ] + Σ<sub>k</sub> ( L<sub>k</sub> ρ L<sub>k</sub><sup>†</sup> − ½{L<sub>k</sub><sup>†</sup>L<sub>k</sub>, ρ} )')}
<p>with jump operators ${m('L<sub>k</sub>')} such as ${m('√(1/T₁) · σ<sub>−</sub>')} for relaxation. QuTiP is the standard Python tool for solving it.</p>
<h2>Strategies and their costs</h2>
<ul>
<li><strong>Density-matrix simulation</strong>: exact, ${m('4ⁿ')} memory, practical to about 15 qubits on a laptop.</li>
<li><strong>Quantum trajectories</strong> (Monte Carlo wavefunctions): simulate pure states with random jumps and average many runs. Memory ${m('2ⁿ')}, at the cost of statistical error.</li>
<li><strong>Pauli twirling</strong>: approximate the noise by random Pauli errors, which keeps Clifford circuits inside fast stabilizer simulation ([[L:stabsim]]).</li>
<li><strong>Tensor networks</strong>: compress states with limited entanglement ([[L:tensornet]]).</li>
</ul>
${LAB('memory')}
<h2>The same experiment in three frameworks</h2>
<p>A Bell pair with 1% depolarizing noise on the two-qubit gate, in Qiskit with its Aer simulator, in Cirq, and a single qubit relaxing in QuTiP:</p>
${CODE('python · qiskit + qiskit-aer', `
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

noise = NoiseModel()
noise.add_all_qubit_quantum_error(depolarizing_error(0.01, 2), ["cx"])

sim = AerSimulator(noise_model=noise)
counts = sim.run(transpile(qc, sim), shots=4000).result().get_counts()
print(counts)
`)}
${CODE('python · cirq', `
import cirq

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(cirq.H(q0), cirq.CNOT(q0, q1),
                       cirq.depolarize(p=0.01, n_qubits=2).on(q0, q1),
                       cirq.measure(q0, q1, key="m"))
result = cirq.DensityMatrixSimulator().run(circuit, repetitions=4000)
print(result.histogram(key="m"))
`)}
${CODE('python · qutip', `
import numpy as np
from qutip import basis, destroy, sigmaz, mesolve

T1 = 50.0                                 # microseconds
psi0 = basis(2, 1)                        # excited state
times = np.linspace(0, 200, 400)
H = 0 * sigmaz()                          # no drive, pure relaxation
result = mesolve(H, psi0, times,
                 c_ops=[np.sqrt(1 / T1) * destroy(2)],
                 e_ops=[sigmaz()])
print(result.expect[0][:5])
`)}
`,
  labs: {
    channels: {
      title: 'Channels as shapes',
      cap: 'Copper wireframe: the image of the whole Bloch sphere under the channel. The blue ring is the input state you chose and the copper arrow is where the channel sends it.',
      build(body, id) {
        let ch = 'amp', p = .4, th = rad(100), ph = rad(30);
        const cv = canvas('sq'), bv = new BlochView(cv, { trail: false }), kr = h('div', { class: 'readout', style: 'white-space:normal;font-size:15px' }), say = h('div', { class: 'status' });
        const upd = () => {
          const M = CH[ch].map(p), v0 = fromAngles(th, ph), v = [M.s[0] * v0[0] + M.t[0], M.s[1] * v0[1] + M.t[1], M.s[2] * v0[2] + M.t[2]];
          bv.shape = M; bv.target = v0; bv.v = v; bv.inv();
          kr.innerHTML = `<span class="k">Kraus operators </span><span class="m">${CH[ch].kraus}</span><br><span class="k">output Bloch vector </span>(${num(v[0], 2)}, ${num(v[1], 2)}, ${num(v[2], 2)}), length ${num(V.norm(v), 2)}`;
          say.textContent = CH[ch].say;
        };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' },
          field('Channel', seg(Object.entries(CH).map(([v, c2]) => ({ v, label: c2.name })), ch, v => { ch = v; upd(); }, 'Channel')),
          slider({ id: id('p'), label: 'Strength (p, γ or λ)', min: 0, max: 1, step: .01, value: p, fmt: v => num(v, 2), on: v => { p = v; upd(); } }),
          slider({ id: id('th'), label: 'Input θ', min: 0, max: 180, step: 1, value: 100, fmt: v => v + '°', on: v => { th = rad(v); upd(); } }),
          slider({ id: id('ph'), label: 'Input φ', min: 0, max: 360, step: 1, value: 30, fmt: v => v + '°', on: v => { ph = rad(v); upd(); } }), say, kr)));
        upd();
      }
    },
    memory: {
      title: 'What fits in memory',
      cap: 'Bytes needed to store an n-qubit description: state vector (16·2ⁿ), density matrix (16·4ⁿ), matrix product state with bond dimension χ (about 32·n·χ²) and stabilizer tableau (about (2n)² bits). Horizontal lines: a 16 GB laptop and a 10 PB supercomputer.',
      build(body, id) {
        let chi = 64;
        const cv = canvas('', 'height:260px'), ro = h('div', { class: 'readout' });
        const L = { sv: n => Math.log10(16) + n * Math.log10(2), dm: n => Math.log10(16) + 2 * n * Math.log10(2), mps: n => Math.log10(32 * n * chi * chi), tab: n => Math.log10((2 * n) * (2 * n) / 8) };
        const maxN = (f, lim) => { let n = 1; while (n < 1e6 && f(n + 1) <= lim) n = n < 1000 ? n + 1 : Math.floor(n * 1.01) + 1; return n; };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 100], y: [0, 40], xt: [1, 20, 40, 60, 80, 100], yt: [0, 10, 20, 30, 40], yf: v => '10' + sup(v), xl: 'qubits n', yl: 'bytes' });
          for (const [y, l] of [[Math.log10(16e9), '16 GB laptop'], [16, '10 PB supercomputer']]) { polyline(ctx, [[A.L, A.Y(y)], [A.R, A.Y(y)]], T.muted, 1, [4, 4]); txt(ctx, l, A.R - 4, A.Y(y) - 9, { align: 'right' }); }
          for (const [k, col, lab] of [['sv', T.cyan, 'state vector'], ['dm', T.bad, 'density matrix'], ['mps', T.copper, `MPS, χ = ${chi}`], ['tab', T.good, 'stabilizer tableau']]) {
            const pts = []; for (let n = 1; n <= 100; n++) { const y = L[k](n); if (y <= 40) pts.push([A.X(n), A.Y(Math.max(0, y))]); } polyline(ctx, pts, col, 2.2);
            const last = pts[pts.length - 1]; txt(ctx, lab, Math.min(last[0], A.R - 60), last[1] - 10, { align: 'left', color: col, font: '600 11px "JetBrains Mono",monospace' });
          }
        });
        const upd = () => {
          const lim = Math.log10(16e9);
          ro.innerHTML = `<span class="k">largest n in 16 GB</span><br>state vector ${maxN(L.sv, lim)} · density matrix ${maxN(L.dm, lim)} · MPS (χ = ${chi}) ${maxN(L.mps, lim).toLocaleString('en-US')} · tableau ${maxN(L.tab, lim).toLocaleString('en-US')}`;
          pc.inv();
        };
        body.append(cv, h('div', { class: 'split' }, slider({ id: id('chi'), label: 'MPS bond dimension χ', min: 1, max: 12, step: 1, value: 6, fmt: v => String(2 ** v), on: v => { chi = 2 ** v; upd(); } }), ro));
        upd();
      }
    }
  },
  take: ['A density matrix describes mixed states; for one qubit it is the Bloch vector inside the ball.',
    'Quantum channels are written with Kraus operators; on one qubit they map the ball to an ellipsoid.',
    'Exact noisy simulation costs 4ⁿ memory; trajectories, Pauli twirling and tensor networks trade accuracy or generality for scale.',
    'Qiskit Aer, Cirq and QuTiP cover circuits, noisy circuits and open-system dynamics.'],
  quiz: [
    { q: 'Under amplitude damping with γ = 1, where does every state end up?', o: ['The center', '|1⟩', '|0⟩', 'The equator'], a: 2, why: 'Full relaxation sends everything to the ground state |0⟩, the north pole.' },
    { q: 'About how many qubits can an exact density-matrix simulation hold in 16 GB?', o: ['15', '30', '50', '1,000'], a: 0, why: 'A density matrix holds 4ⁿ complex numbers at 16 bytes each. 16 · 4¹⁴ ≈ 4.3 GB fits easily; 16 · 4¹⁵ = 2³⁴ bytes is exactly 16 GiB, so about 15 qubits is the limit.' }
  ]
});

/* ---------------- 33 · Tensor networks ---------------- */
LESSONS.push({
  id: 'tensornet', n: 33, stage: SIM, minutes: 14, title: 'Tensor networks and entanglement',
  lede: 'Exact simulation stalls around 30 to 45 qubits, yet many large quantum systems are simulated routinely. The trick is to store only as much entanglement as the state really has.',
  html: `
<h2>Matrix product states</h2>
<p>A matrix product state (MPS) writes each amplitude of an ${m('n')}-qubit chain as a product of matrices, one per qubit, chosen by that qubit’s bit value:</p>
${EQ('ψ(b₁b₂…bₙ) = A₁<sup>b₁</sup> A₂<sup>b₂</sup> ⋯ Aₙ<sup>bₙ</sup>')}
<p>The matrices are at most ${m('χ × χ')}, where ${m('χ')} is the <strong>bond dimension</strong>. Storage is about ${m('2nχ²')} numbers instead of ${m('2ⁿ')}. Any state can be written this way with ${m('χ = 2<sup>n/2</sup>')}, so nothing is gained in the worst case. The gain comes from states with little entanglement.</p>
<h2>Entanglement sets the cost</h2>
<p>Cut the chain in two. The <strong>Schmidt decomposition</strong> writes the state as ${m('Σ<sub>i</sub> √λ<sub>i</sub> |L<sub>i</sub>⟩|R<sub>i</sub>⟩')}, and the number of nonzero ${m('λ<sub>i</sub>')} is exactly the bond dimension needed at that cut. The entanglement entropy ${m('S = −Σ λ<sub>i</sub> log₂ λ<sub>i</sub>')} is at most ${m('log₂ χ')}. Ground states of gapped one-dimensional systems obey an <strong>area law</strong>: their entropy stays bounded as the chain grows, which is why DMRG and other MPS methods work so well for them.</p>
${LAB('ent')}
<h2>Circuits and how classical simulation keeps up</h2>
<p>In a random circuit the entanglement across a cut grows by roughly one bit per layer until it saturates at about ${m('n/2')}. The bond dimension therefore grows exponentially with depth, and exact MPS simulation of deep random circuits is no cheaper than a state vector. Truncating to the largest ${m('χ')} Schmidt values gives an approximate simulation whose fidelity you can measure, which is also how some claims of quantum advantage have been challenged.</p>
<ul>
<li><strong>State vector</strong> (qsim, Qiskit Aer, NVIDIA cuQuantum): exact, about 30 qubits on a laptop and around 45–50 on the largest supercomputers.</li>
<li><strong>Tensor network contraction</strong> (quimb, cuTensorNet): computes individual amplitudes of very large shallow circuits by contracting a network in a clever order.</li>
<li><strong>MPS and PEPS</strong> (ITensor, quimb, TeNPy): states with limited entanglement in 1D and 2D.</li>
<li><strong>Feynman path sums</strong> ([[L:pathsum]]): tiny memory, exponential time in the number of gates; Schrödinger–Feynman hybrids balance the two.</li>
<li><strong>Stabilizer and near-Clifford</strong> (Stim, [[L:stabsim]]): huge Clifford circuits; cost grows with T count.</li>
</ul>
${NOTE('A practical rule', `<p>Pick the simulator by the property that keeps the problem small: few qubits (state vector), little entanglement (MPS), shallow depth (contraction), few non-Clifford gates (stabilizer methods). Most published research simulations combine more than one.</p>`)}
`,
  labs: {
    ent: {
      title: 'Entanglement growth on a chain of 10 qubits',
      cap: 'Top: entanglement entropy across every cut of the chain after the chosen number of layers (dashed: the maximum possible). Bottom: entropy across the middle cut as layers are added. All values come from exact Schmidt decompositions of the 1,024-amplitude state.',
      build(body, id) {
        const n = 10; let kind = 'rand', L = 4, seed = 3, chi = 8, states = [];
        const prof = canvas('', 'height:190px'), grow = canvas('', 'height:170px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const layer = (s, l, R) => {
          if (kind === 'rand') { for (let q = 0; q < n; q++) { const ax = V.unit([randn2(R), randn2(R), randn2(R)]); s.apply(q, Rn(ax, R() * TAU)); } for (let q = l % 2; q + 1 < n; q += 2) s.cz(q, q + 1); }
          else if (kind === 'cluster') { if (l === 0) { for (let q = 0; q < n; q++) s.g('H', q); for (let q = 0; q + 1 < n; q += 2) s.cz(q, q + 1); } else if (l === 1) for (let q = 1; q + 1 < n; q += 2) s.cz(q, q + 1); }
          else if (kind === 'ghz') { if (l === 0) s.g('H', 0); if (l < n - 1) s.cx(l, l + 1); }
          else for (let q = 0; q < n; q++) s.apply(q, Rn(V.unit([R() - .5, R() - .5, R() - .5]), R() * TAU));
        };
        const randn2 = R => { let u = 0, v = 0; while (!u) u = R(); v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
        const build = () => { const R = rng(seed); states = [new QState(n)]; let s = states[0]; for (let l = 0; l < 12; l++) { s = s.clone(); layer(s, l, R); states.push(s); } mids = states.map(st => entropy(schmidt(st, n / 2))); };
        let mids = [];
        const pp = painter(prof, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [.5, 9.5], y: [0, 5.2], xt: [1, 2, 3, 4, 5, 6, 7, 8, 9], yt: [0, 1, 2, 3, 4, 5], xl: 'cut after qubit k', yl: 'entropy (bits)' });
          polyline(ctx, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => [A.X(k), A.Y(Math.min(k, n - k))]), T.muted, 1.2, [4, 4]);
          const S = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => entropy(schmidt(states[L], k))); polyline(ctx, S.map((v, i) => [A.X(i + 1), A.Y(v)]), T.copper, 2.4); S.forEach((v, i) => dot(ctx, A.X(i + 1), A.Y(v), 4, T.copper));
        });
        const pg = painter(grow, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 12], y: [0, 5.2], xt: [0, 2, 4, 6, 8, 10, 12], yt: [0, 1, 2, 3, 4, 5], xl: 'layers', yl: 'middle-cut entropy' });
          polyline(ctx, mids.map((v, i) => [A.X(i), A.Y(v)]), T.cyan, 2.2); mids.forEach((v, i) => dot(ctx, A.X(i), A.Y(v), i === L ? 6 : 3, i === L ? T.copper : T.cyan));
        });
        const upd = () => {
          const lam = schmidt(states[L], n / 2), rank = lam.filter(v => v > 1e-10).length, kept = lam.slice(0, chi).reduce((a, b) => a + b, 0);
          ro.innerHTML = `Middle cut after ${L} layer${L === 1 ? '' : 's'}: entropy <b>${num(entropy(lam), 2)} bits</b>, exact bond dimension <b>${rank}</b> of at most 32. Keeping only χ = ${chi} Schmidt values there preserves fidelity <b>${pct(Math.min(1, kept), 2)}</b>.`;
          pp.inv(); pg.inv();
        };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, prof, grow), h('div', { class: 'stack' },
          field('Circuit', seg([{ v: 'rand', label: 'Random brickwork' }, { v: 'cluster', label: 'Cluster state' }, { v: 'ghz', label: 'GHZ chain' }, { v: 'prod', label: 'No entangling gates' }], kind, v => { kind = v; build(); upd(); }, 'Circuit type')),
          slider({ id: id('L'), label: 'Layers applied', min: 0, max: 12, step: 1, value: L, fmt: String, on: v => { L = v; upd(); } }),
          slider({ id: id('chi'), label: 'Truncate to bond dimension χ', min: 1, max: 32, step: 1, value: chi, fmt: String, on: v => { chi = v; upd(); } }),
          btn('New random circuit', () => { seed = Math.floor(Math.random() * 1e9); build(); upd(); }), ro)));
        build(); upd();
      }
    }
  },
  take: ['An MPS stores about 2nχ² numbers; the bond dimension needed equals the Schmidt rank at each cut.',
    'Entanglement entropy across a cut is at most log₂ χ; area-law states are cheap to represent.',
    'Random circuits gain about a bit of entanglement per layer, so exact MPS cost grows exponentially with depth.',
    'Choose a simulator by what keeps the problem small: qubit count, entanglement, depth or T count.'],
  quiz: [
    { q: 'A state has entanglement entropy 3 bits across a cut. What is the smallest exact bond dimension there?', o: ['3', 'At least 8', '6', '9'], a: 1, why: 'Entropy across a cut is at most log₂ of the number of Schmidt values. Three bits of entropy therefore needs at least 2³ = 8 Schmidt values, so the bond dimension at that cut must be at least 8.' },
    { q: 'What bond dimension does a 1D cluster state need at any cut?', o: ['1', '2', '2^(n/2)', 'n'], a: 1, why: 'It has exactly one bit of entanglement across every cut.' }
  ]
});

window.GLOSSARY_EXTRA.push(
  ['Query complexity', 'The number of oracle calls an algorithm needs; the setting where many quantum speedups are proved.', 'query'],
  ['Simon’s algorithm', 'Finds a hidden XOR period with O(n) quantum queries versus about 2^(n/2) classical ones.', 'query'],
  ['Hidden subgroup problem', 'Finding a subgroup from a function constant on its cosets; includes Simon’s and Shor’s problems.', 'hsp'],
  ['Phase estimation', 'Reading an eigenphase of a unitary into ancilla qubits using controlled powers and an inverse QFT.', 'qpe'],
  ['Trotterization', 'Approximating e^(−i(A+B)t) by alternating short steps of e^(−iAτ) and e^(−iBτ).', 'qpe'],
  ['Qubitization', 'An optimal Hamiltonian simulation technique built on block encodings.', 'qpe'],
  ['QMA', 'Quantum Merlin–Arthur: problems with quantum proofs checkable by a quantum computer.', 'advantage'],
  ['Porter–Thomas distribution', 'The exponential distribution of rescaled output probabilities Np for deep random circuits.', 'advantage'],
  ['Cross-entropy benchmark (XEB)', 'F = N⟨p(x)⟩ − 1 over sampled bitstrings; about 1 for an ideal device, 0 for noise.', 'advantage'],
  ['Density matrix', 'ρ = Σ pᵢ|ψᵢ⟩⟨ψᵢ|, the description of a possibly mixed quantum state.', 'densitymatrix'],
  ['Kraus operators', 'Matrices Kₖ with ΣKₖ†Kₖ = I that define a quantum channel ρ → ΣKₖρKₖ†.', 'noisesim'],
  ['Lindblad equation', 'The master equation for open quantum systems with continuous noise.', 'noisesim'],
  ['Matrix product state', 'A chain of small tensors representing a state; cost set by its bond dimension.', 'tensornet'],
  ['Bond dimension', 'The size χ of the matrices in an MPS; at least 2^S for entanglement entropy S.', 'tensornet'],
  ['Area law', 'Entanglement across a cut scales with the cut’s boundary, not the region’s volume.', 'tensornet']
);
})();
