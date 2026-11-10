/* =====================================================================
   Batch 5a: wave–particle duality and the quantum eraser, the Pauli and
   Clifford groups, cluster states and measurement-based computing
   ===================================================================== */
(() => {

/* ---------- shared: approximate visible-wavelength colour ---------- */
function wlColor(nm, a = 1) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
  const k = v => Math.round(255 * Math.pow(clamp(v, 0, 1), .8));
  return `rgba(${k(r)},${k(g)},${k(b)},${a})`;
}
const sinc = x => Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x;
const SCREEN_BG = '#0c0e13';

/* ---------- wave–particle duality ---------- */
LESSONS.push({
  id: 'doubleslit', n: 2.5, stage: 0, minutes: 14, title: 'Wave–particle duality: the double slit and the quantum eraser',
  lede: 'Send particles through two slits one at a time. Each lands as a single dot, yet the dots build up stripes that only a wave could make. Find out which slit each one used and the stripes vanish; erase that information and they come back.',
  html: `
<h2>One particle at a time</h2>
<p>Richard Feynman called the double-slit experiment the one that “has in it the heart of quantum mechanics”. A source emits particles so rarely that only one is in the apparatus at a time. Each is detected at a single point on the screen, like a particle. But after thousands of detections the points form <strong>interference fringes</strong>, bright and dark bands that come from adding two waves. Tonomura and colleagues filmed exactly this with single electrons in 1989, Arndt, Zeilinger and colleagues saw fringes with C₆₀ molecules in 1999, and Arndt’s group later saw them with molecules of about 2,000 atoms (2019).</p>
<p>Quantum mechanics explains it with amplitudes ([[L:superposition]]). The particle has an amplitude ${m('ψ₁(y)')} to reach point ${m('y')} through slit 1 and ${m('ψ₂(y)')} through slit 2. When nothing records which slit it used, the amplitudes add before squaring:</p>
${EQ('P(y) = |ψ₁ + ψ₂|² = |ψ₁|² + |ψ₂|² + 2 Re(ψ₁* ψ₂)')}
<p>The last term is the interference. The two paths differ in length by about ${m('d·y/L')} for slit separation ${m('d')} and screen distance ${m('L')}, so the phase difference grows across the screen and the fringes are spaced by ${m('Δy = λL/d')}. Each slit has a finite width ${m('a')} too, which spreads its wave into a broad envelope of width about ${m('λL/a')}.</p>
${LAB('buildup')}
<h2>Asking which way</h2>
<p>Suppose a marker records the path: the particle leaves the marker in state ${m('|m₁⟩')} if it went through slit 1 and ${m('|m₂⟩')} if through slit 2. Now the particle and marker are entangled ([[L:entanglement]]), and the pattern on the screen becomes</p>
${EQ('P(y) = ½(|ψ₁|² + |ψ₂|²) + Re(ψ₁* ψ₂ ⟨m₁|m₂⟩)')}
<p>The interference term is multiplied by the overlap of the marker states. If the markers are perfectly distinguishable (${m('⟨m₁|m₂⟩ = 0')}), the fringes disappear completely, even if nobody ever looks at the marker. The fringe <strong>visibility</strong> is ${m('V = |⟨m₁|m₂⟩|')}, and the best possible guess of the path succeeds with a <strong>distinguishability</strong> ${m('D = √(1 − |⟨m₁|m₂⟩|²)')}. Englert’s duality relation (1996) says ${m('D² + V² ≤ 1')}: path knowledge and interference trade off smoothly, with equality for pure markers. Nothing mysterious disturbs the particle; the information exists, so the two paths are no longer indistinguishable alternatives and their amplitudes cannot interfere.</p>
<h2>The quantum eraser</h2>
<p>The marker can be read in a basis that reveals nothing about the path. Measure it in the basis ${m('|±⟩ = (|0⟩ ± |1⟩)/√2')} when ${m('|m₁⟩ = |0⟩')} and ${m('|m₂⟩ = |1⟩')}: each outcome is equally likely for either slit, so the path information is erased. Sorting the screen hits by the marker outcome reveals fringes for “+” and <em>anti-fringes</em>, shifted by half a period, for “−”. Added together they still show no fringes, which is why the eraser cannot send a signal, even in delayed-choice versions where the marker is measured after the particle hits the screen (Kim and colleagues, 2000). The fringes live in the correlations between screen and marker, never in the screen alone.</p>
${LAB('eraser')}
${NOTE('The same physics in a qubit', `<p>The two paths are a qubit, the screen measures it in a phase-sensitive basis, and a which-path marker is a second qubit that becomes entangled with it. That is exactly a Mach–Zehnder interferometer ([[L:interference]]) followed by decoherence ([[L:decoherence]]): the reduced state of the path qubit loses its off-diagonal terms, the coherences, in proportion to how well the environment “knows” the path ([[L:densitymatrix]]).</p>`)}
`,
  labs: {
    buildup: {
      title: 'Building fringes one particle at a time',
      cap: 'Top: the detector screen, one dot per particle (coloured by wavelength). Bottom: a histogram of hits with the predicted pattern. Stream particles and watch random dots organise into fringes. Close one slit and the fringes vanish, leaving only the broad single-slit envelope; open both and the dark bands appear where a single slit alone would put particles.',
      build(body, id) {
        const Y = 15, NB = 150; let lam = 550, d = .25, a = .05, open = 'both', hits = [], counts = new Float64Array(NB), N = 0, stream = false;
        const sc = canvas('', 'height:110px'), hc = canvas('', 'height:170px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const I = y => { const be = PI * a * y * 1e3 / lam, ga = PI * d * y * 1e3 / lam, e = sinc(be) ** 2; return open === 'both' ? e * Math.cos(ga) ** 2 : e; };
        const fire = k => { for (let i = 0; i < k; i++) { let y; do { y = (Math.random() * 2 - 1) * Y; } while (Math.random() > I(y)); N++; counts[clamp(Math.floor((y + Y) / (2 * Y) * NB), 0, NB - 1)]++; hits.push([y, Math.random()]); } if (hits.length > 6000) hits = hits.slice(-6000); ps.inv(); ph.inv(); text(); };
        const clear = () => { hits = []; counts = new Float64Array(NB); N = 0; ps.inv(); ph.inv(); text(); };
        const ps = painter(sc, ({ ctx, w, h: H }) => {
          ctx.fillStyle = SCREEN_BG; ctx.fillRect(0, 0, w, H); const col = wlColor(lam, .85), r = hits.length > 2500 ? 1.1 : 1.6;
          ctx.fillStyle = col; for (const [y, u] of hits) { ctx.beginPath(); ctx.arc((y + Y) / (2 * Y) * w, 8 + u * (H - 16), r, 0, TAU); ctx.fill(); }
          txt(ctx, N ? `${N.toLocaleString()} particles` : 'screen (no hits yet)', w - 8, 12, { align: 'right', color: '#9aa3b2', font: '500 11px "JetBrains Mono",monospace' });
        });
        const ph = painter(hc, ({ ctx, w, h: H }) => {
          const T = Theme.get(); let mx = 0; for (const c3 of counts) mx = Math.max(mx, c3);
          const pdf = []; let tot = 0; for (let i = 0; i < 600; i++) { const y = -Y + (i + .5) / 600 * 2 * Y, v = I(y); pdf.push([y, v]); tot += v; }
          const binW = 2 * Y / NB, exp = pdf.map(([y, v]) => [y, N * v / (tot * (2 * Y / 600)) * binW]); const em = Math.max(...exp.map(p => p[1]));
          const top = Math.max(mx, em, 1) * 1.08, A = axes(ctx, w, H, { x: [-Y, Y], y: [0, top], xt: [-15, -10, -5, 0, 5, 10, 15], yt: [], xl: 'position on screen (mm)', pad: { l: 14, b: 30, t: 10 } });
          ctx.fillStyle = rgba(T.cyan, .55); const bw = (A.R - A.L) / NB; for (let i = 0; i < NB; i++) if (counts[i]) { const y0 = A.Y(counts[i]); ctx.fillRect(A.L + i * bw + .3, y0, Math.max(1, bw - .6), A.B - y0); }
          if (N) polyline(ctx, exp.map(([y, v]) => [A.X(y), A.Y(v)]), T.copper, 2); else polyline(ctx, pdf.map(([y, v]) => [A.X(y), A.Y(v / Math.max(...pdf.map(p => p[1])) * top * .9)]), T.copper, 2, [5, 4]);
        });
        const text = () => { ro.innerHTML = `<span class="k">fringe spacing λL/d </span>${open === 'both' ? num(lam / d * 1e-3, 2) + ' mm' : 'none (one slit)'}<br><span class="k">envelope half-width λL/a </span>${num(lam / a * 1e-3, 1)} mm<br><span class="k">particles detected </span>${N.toLocaleString()} <span class="k">(L = 1 m)</span>`; };
        Scope.tick(() => { if (!stream) return; fire(N < 60 ? 1 : N < 400 ? 4 : N < 3000 ? 25 : 80); if (N > 40000) { stream = false; sb.textContent = 'Stream particles'; } });
        const sb = btn('Stream particles', () => { stream = !stream; sb.textContent = stream ? 'Pause' : 'Stream particles'; }, 'pri');
        const S = (k, l, mn, mx, st, v, f, on) => slider({ id: id(k), label: l, min: mn, max: mx, step: st, value: v, fmt: f, on: x => { on(x); clear(); } });
        body.append(h('div', { class: 'btns' }, sb, btn('Fire one', () => fire(1)), btn('Fire 1,000', () => fire(1000)), btn('Clear', clear, 'sm')), sc, hc,
          h('div', { class: 'split' }, h('div', { class: 'stack' }, field('Slits open', seg([{ v: 'both', label: 'Both' }, { v: 'one', label: 'Only one' }], open, v => { open = v; clear(); }, 'Slits')),
            S('l', 'Wavelength λ', 400, 700, 5, lam, v => v + ' nm', v => { lam = v; }), S('d', 'Slit separation d', .1, .6, .01, d, v => num(v, 2) + ' mm', v => { d = v; }), S('a', 'Slit width a', .03, .12, .005, a, v => num(v, 3) + ' mm', v => { a = v; })), ro));
        text();
      }
    },
    eraser: {
      title: 'Which-path marker and the quantum eraser',
      cap: 'The marker ends in |m₁⟩ = |0⟩ for slit 1 and |m₂⟩ = cos θ|0⟩ + sin θ|1⟩ for slit 2. Curves show the screen pattern split by the marker outcome (copper: outcome 0 or +, cyan: outcome 1 or −); the dashed line is their sum. With θ = 90° read the marker “which path” and each subset shows one slit’s envelope; read it in the eraser basis and the subsets show fringes and anti-fringes. The sum never changes, whatever you do to the marker.',
      build(body, id) {
        const Y = 12, lam = 550, d = .25, a = .05, NB = 120; let th = PI / 2, mode = 'erase', show = 'all', hits = [];
        const sc = canvas('', 'height:84px'), pc = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const basis = () => mode === 'which' ? [[1, 0], [0, 1]] : [[S2, S2], [S2, -S2]];
        const parts = y => { const s = sinc(PI * a * y * 1e3 / lam) ** 2, g2 = 2 * PI * d * y * 1e3 / lam, m2 = [Math.cos(th), Math.sin(th)];
          if (mode === 'ignore') return [s * (1 + Math.cos(th) * Math.cos(g2)), 0];
          return basis().map(b => { const c1 = b[0], c2 = b[0] * m2[0] + b[1] * m2[1]; return .5 * s * (c1 * c1 + c2 * c2 + 2 * c1 * c2 * Math.cos(g2)); }); };
        const fire = k => { for (let i = 0; i < k; i++) { let y, P; do { y = (Math.random() * 2 - 1) * Y; P = parts(y); } while (Math.random() * 2 > P[0] + P[1]); const o = mode === 'ignore' ? 0 : Math.random() * (P[0] + P[1]) < P[0] ? 0 : 1; hits.push([y, Math.random(), o]); } if (hits.length > 8000) hits = hits.slice(-8000); ps.inv(); pp.inv(); };
        const vis = o => show === 'all' || +show === o;
        const ps = painter(sc, ({ ctx, w, h: H }) => { const T = Theme.get(); ctx.fillStyle = SCREEN_BG; ctx.fillRect(0, 0, w, H); for (const [y, u, o] of hits) { if (!vis(o)) continue; ctx.fillStyle = mode === 'ignore' ? '#c9ced8' : o ? T.cyan : T.copperHi; ctx.beginPath(); ctx.arc((y + Y) / (2 * Y) * w, 6 + u * (H - 12), 1.3, 0, TAU); ctx.fill(); } });
        const pp = painter(pc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-Y, Y], y: [0, 2.1], xt: [-10, -5, 0, 5, 10], yt: [0, 1, 2], xl: 'position on screen (mm)', yl: 'probability density (arb.)', pad: { l: 34, b: 30 } });
          const cnt = [new Float64Array(NB), new Float64Array(NB)]; for (const [y, , o] of hits) cnt[o][clamp(Math.floor((y + Y) / (2 * Y) * NB), 0, NB - 1)]++;
          const tot = hits.length; if (tot) { const bw = (A.R - A.L) / NB; for (const o of [0, 1]) { if (!vis(o) || mode === 'ignore' && o) continue; ctx.fillStyle = rgba(o ? T.cyan : T.copper, .28); for (let i = 0; i < NB; i++) if (cnt[o][i]) { const v = cnt[o][i] / tot * NB / (2 * Y) * nrm, y0 = A.Y(v); ctx.fillRect(A.L + i * bw, y0, bw - .4, A.B - y0); } } }
          const ys = [...Array(400)].map((_, i) => -Y + i / 399 * 2 * Y), P = ys.map(parts);
          polyline(ctx, ys.map((y, i) => [A.X(y), A.Y(P[i][0] + P[i][1])]), T.muted, 1.6, [5, 4]);
          if (mode !== 'ignore') { if (vis(0)) polyline(ctx, ys.map((y, i) => [A.X(y), A.Y(P[i][0])]), T.copper, 2.4); if (vis(1)) polyline(ctx, ys.map((y, i) => [A.X(y), A.Y(P[i][1])]), T.cyan, 2.4); }
        });
        let nrm = 1; { let s = 0; const K = 2000; for (let i = 0; i < K; i++) { const y = -Y + (i + .5) / K * 2 * Y, s0 = sinc(PI * a * y * 1e3 / lam) ** 2; s += s0; } nrm = s * (2 * Y / K); }
        const lab = () => mode === 'which' ? ['0 (“probably slit 1”)', '1 (“slit 2”)'] : mode === 'erase' ? ['+', '−'] : ['all', ''];
        const text = () => { const D = Math.abs(Math.sin(th)), V = Math.abs(Math.cos(th)), L = lab();
          ro.innerHTML = `<span class="k">overlap ⟨m₁|m₂⟩ = cos θ </span>${num(Math.cos(th), 3)}<br><span class="k">visibility V </span>${num(V, 3)} &nbsp; <span class="k">distinguishability D </span>${num(D, 3)}<br><span class="k">D² + V² </span>${num(D * D + V * V, 3)}<br><span class="k">${mode === 'ignore' ? 'marker not read: one pattern' : `outcomes: copper = ${L[0]}, cyan = ${L[1]}`}</span>`; };
        const re = () => { hits = []; fire(1500); text(); };
        const showSeg = seg([{ v: 'all', label: 'All hits' }, { v: '0', label: 'Outcome 0 / +' }, { v: '1', label: 'Outcome 1 / −' }], show, v => { show = v; ps.inv(); pp.inv(); }, 'Show');
        body.append(h('div', { class: 'btns' }, seg([{ v: 'ignore', label: 'Ignore the marker' }, { v: 'which', label: 'Read it: which path' }, { v: 'erase', label: 'Read it: eraser basis' }], mode, v => { mode = v; re(); }, 'Marker readout')), sc, pc,
          h('div', { class: 'split' }, h('div', { class: 'stack' }, field('Sort the screen hits by marker outcome', showSeg), slider({ id: id('t'), label: 'Marker angle θ (0° = no path information, 90° = perfect marker)', min: 0, max: PI / 2, step: .01, value: th, fmt: v => num(deg(v), 0) + '°', on: v => { th = v; re(); } }), h('div', { class: 'btns' }, btn('Add 2,000 particles', () => fire(2000), 'pri'), btn('Clear', () => { hits = []; ps.inv(); pp.inv(); }, 'sm'))), ro));
        re();
      }
    }
  },
  take: ['Single particles land as dots, yet the dots build up interference fringes spaced by λL/d: each particle’s two path amplitudes add before squaring.',
    'A which-path marker multiplies the interference term by the marker overlap ⟨m₁|m₂⟩; fringe visibility and path distinguishability obey D² + V² ≤ 1.',
    'Reading the marker in a basis that reveals nothing about the path (the eraser) recovers fringes and anti-fringes in the sorted subsets.',
    'The unsorted screen pattern never depends on what is done to the marker, so the eraser cannot signal; the fringes live in correlations.'],
  quiz: QZ([
    ['In a single-particle double-slit experiment, what is seen on the screen after many particles?', ['One bright spot', 'Interference fringes built up from individual dots', 'Two sharp lines only', 'A uniform glow from the start'], 1, 'Each particle arrives at one point, but the distribution of points shows interference.'],
    ['Why do the amplitudes for the two slits interfere?', ['The particles collide with each other', 'Nothing records which slit was used, so the two amplitudes for the same detection point add before squaring', 'The screen is a wave', 'The slits emit light'], 1, 'Indistinguishable alternatives add as amplitudes; only distinguishable ones add as probabilities.'],
    ['How does the fringe spacing depend on the slit separation d?', ['It grows with d', 'Δy = λL/d, so wider separation gives finer fringes', 'It does not depend on d', 'It grows with d²'], 1, 'The path-length difference d·y/L changes by one wavelength over Δy = λL/d.'],
    ['What happens to the pattern when one slit is closed?', ['The fringes double', 'Only the broad single-slit envelope remains, with no two-slit fringes', 'The screen goes dark', 'The fringes shift by half a period'], 1, 'With one path there is nothing to interfere with.'],
    ['With a which-path marker, what multiplies the interference term?', ['The wavelength', 'The overlap ⟨m₁|m₂⟩ of the two marker states', 'The number of particles', 'The slit width'], 1, 'P(y) = ½(|ψ₁|² + |ψ₂|²) + Re(ψ₁*ψ₂⟨m₁|m₂⟩); orthogonal markers remove the fringes.'],
    ['Do the fringes disappear even if nobody reads the marker?', ['No, someone must look', 'Yes; it is enough that the path information exists in the marker', 'Only for electrons', 'Only if the marker is classical'], 1, 'Entanglement with the marker makes the paths distinguishable in principle, which kills the interference.'],
    ['What does Englert’s duality relation say?', ['D + V = 2', 'D² + V² ≤ 1: path distinguishability and fringe visibility trade off', 'D = V always', 'V can exceed 1'], 1, 'With pure markers equality holds, so partial path knowledge gives partial fringes.'],
    ['What does the quantum eraser reveal when the hits are sorted by the eraser outcome?', ['Nothing new', 'Fringes for one outcome and anti-fringes, shifted half a period, for the other', 'Two single-slit envelopes', 'A uniform pattern in both subsets'], 1, 'Measuring the marker in the |±⟩ basis erases path information and conditions the screen pattern.'],
    ['Why can a delayed-choice eraser not send a message back in time?', ['It is too slow', 'The total screen pattern is the same whatever is done to the marker; fringes appear only after sorting with the marker results', 'Photons cannot be delayed', 'The marker is classical'], 1, 'Sorting needs the marker outcomes, which travel no faster than light.'],
    ['In qubit language, what does a which-path marker do?', ['It speeds up the gate', 'It entangles the path qubit with another system, removing the coherences of the path qubit’s reduced state', 'It measures energy', 'It creates a new particle'], 1, 'This is decoherence: the environment holds information about the path.']
  ])
});

/* ---------- Pauli and Clifford groups ---------- */
const R3 = { H: [0, 0, 1, 0, -1, 0, 1, 0, 0], S: [0, -1, 0, 1, 0, 0, 0, 0, 1], Sdg: [0, 1, 0, -1, 0, 0, 0, 0, 1], X: [1, 0, 0, 0, -1, 0, 0, 0, -1], Y: [-1, 0, 0, 0, 1, 0, 0, 0, -1], Z: [-1, 0, 0, 0, -1, 0, 0, 0, 1], T: [S2, -S2, 0, S2, S2, 0, 0, 0, 1] };
const AXANG = { H: [[S2, 0, S2], PI], S: [[0, 0, 1], PI / 2], Sdg: [[0, 0, 1], -PI / 2], X: [[1, 0, 0], PI], Y: [[0, 1, 0], PI], Z: [[0, 0, 1], PI], T: [[0, 0, 1], PI / 4] };
const mm3 = (A, B) => { const C = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j]; return C; };
const col3 = (R, j) => [R[j], R[3 + j], R[6 + j]];
const isCliff = R => R.every(v => Math.abs(Math.abs(v) - Math.round(Math.abs(v))) < 1e-9);
const keyR = R => R.map(v => Math.round(v)).join(',');
function pauliOf(v) {
  const L = ['X', 'Y', 'Z'], nz = [0, 1, 2].filter(i => Math.abs(v[i]) > 1e-6);
  if (nz.length === 1) return (v[nz[0]] < 0 ? '−' : '+') + L[nz[0]];
  const a = Math.abs(v[nz[0]]), eq = nz.every(i => Math.abs(Math.abs(v[i]) - a) < 1e-6);
  if (eq) { const t = nz.map((i, k) => (v[i] < 0 ? (k ? ' − ' : '−') : (k ? ' + ' : '')) + L[i]).join(''); return `(${t})` + (Math.abs(a - S2) < 1e-6 ? '/√2' : Math.abs(a - 1 / Math.sqrt(3)) < 1e-6 ? '/√3' : ' × ' + num(a, 3)); }
  return nz.map((i, k) => (v[i] < 0 ? (k ? ' − ' : '−') : (k ? ' + ' : '')) + num(Math.abs(v[i]), 3) + L[i]).join('');
}
/* 2-qubit complex matrices for Pauli propagation */
const cmul4 = (A, B) => { const C = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let r = 0, im = 0; for (let k = 0; k < 4; k++) { const a = A[i * 4 + k], b = B[k * 4 + j]; r += a[0] * b[0] - a[1] * b[1]; im += a[0] * b[1] + a[1] * b[0]; } C.push([r, im]); } return C; };
const dag4 = A => { const C = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const a = A[j * 4 + i]; C.push([a[0], -a[1]]); } return C; };
const kron2 = (A, B) => { const C = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const a = A[(i >> 1) * 2 + (j >> 1)], b = B[(i & 1) * 2 + (j & 1)]; C.push([a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]); } return C; };
const P1 = { I: M.I, X: M.X, Y: M.Y, Z: M.Z };
const P2 = {}; for (const a of 'IXYZ') for (const b of 'IXYZ') P2[a + b] = kron2(P1[a], P1[b]);
const perm4 = p => { const C = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) C.push([p[j] === i ? 1 : 0, 0]); return C; };
const G2 = { H0: kron2(M.H, M.I), H1: kron2(M.I, M.H), S0: kron2(M.S, M.I), S1: kron2(M.I, M.S), CX01: perm4([0, 1, 3, 2]), CX10: perm4([0, 3, 2, 1]), CZ: [[1, 0], [0, 0], [0, 0], [0, 0], [0, 0], [1, 0], [0, 0], [0, 0], [0, 0], [0, 0], [1, 0], [0, 0], [0, 0], [0, 0], [0, 0], [-1, 0]], T0: kron2(M.T, M.I) };
const G2OP = { H0: { g: 'H', q: 0 }, H1: { g: 'H', q: 1 }, S0: { g: 'S', q: 0 }, S1: { g: 'S', q: 1 }, CX01: { g: 'CX', c: 0, t: 1 }, CX10: { g: 'CX', c: 1, t: 0 }, CZ: { g: 'CZ', a: 0, b: 1 }, T0: { g: 'T', q: 0 } };
function identify2(P) {
  for (const k in P2) { const Q = P2[k]; let r = 0, im = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const q = Q[j * 4 + i], p = P[j * 4 + i]; r += q[0] * p[0] + q[1] * p[1]; im += q[0] * p[1] - q[1] * p[0]; } r /= 4; im /= 4; if (Math.abs(Math.hypot(r, im) - 1) < 1e-6) return (r < 0 ? '−' : '+') + k; }
  return 'not a Pauli';
}

LESSONS.push({
  id: 'clifford', n: 7.5, stage: 1, minutes: 15, title: 'The Pauli and Clifford groups',
  lede: 'Pauli operators are the basic errors and the basic measurements of a quantum computer. Clifford gates are exactly the gates that shuffle Pauli operators among themselves. That one property explains why some circuits are easy to simulate, how errors spread, and why T gates are precious.',
  html: `
<h2>The Pauli group</h2>
<p>The single-qubit Pauli operators ${m('I, X, Y, Z')} ([[L:gates]]) square to the identity, and any two distinct ones anticommute, for example ${m('XZ = −ZX')}. On ${m('n')} qubits, tensor products such as ${m('X ⊗ Z ⊗ I')}, written ${m('XZI')}, form the <strong>Pauli group</strong> once phases ${m('±1, ±i')} are included. Two facts make them central:</p>
<ul>
<li><strong>They are a basis.</strong> The ${m('4ⁿ')} Pauli strings span all ${m('2ⁿ × 2ⁿ')} matrices, so every error, however complicated, expands into Pauli errors. Correcting Pauli errors corrects everything ([[L:qec]]).</li>
<li><strong>Commute or anticommute.</strong> Any two Pauli strings either commute or anticommute: count the positions where both are non-identity and different; an even count means they commute. Stabilizer codes are built on this ([[L:stabilizers]]).</li>
</ul>
<h2>Gates that map Paulis to Paulis</h2>
<p>A unitary ${m('U')} is a <strong>Clifford</strong> gate if conjugating any Pauli gives another Pauli: ${m('U P U† ∈ Pauli group')}. The Clifford group is generated by ${m('H')}, ${m('S')} and ${m('CNOT')}, whose rules are worth memorizing:</p>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Gate</th><th>Conjugation rules</th></tr></thead><tbody>
<tr><td>H</td><td>X → Z, Z → X, Y → −Y</td></tr>
<tr><td>S</td><td>X → Y, Y → −X, Z → Z</td></tr>
<tr><td>CNOT (control 1)</td><td>XI → XX, IX → IX, ZI → ZI, IZ → ZZ</td></tr>
</tbody></table></div>
<p>On one qubit, conjugation by ${m('U')} acts on the Bloch sphere as a rotation, and a Clifford must permute the six axis points ${m('±x, ±y, ±z')}. The single-qubit Cliffords are therefore the 24 rotational symmetries of an octahedron. On ${m('n')} qubits there are ${m('2^(n²+2n) ∏ (4ʲ − 1)')} of them up to phase: 24 for one qubit, 11,520 for two, about 92 million for three.</p>
${LAB('octa')}
<h2>Tracking a Clifford circuit cheaply</h2>
<p>A Clifford is fixed, up to a global phase, by what it does to the ${m('2n')} generators ${m('X₁, Z₁, …, Xₙ, Zₙ')}: each image is a Pauli string with a sign. Storing those ${m('2n')} strings, the <strong>tableau</strong>, takes about ${m('4n²')} bits, and each gate updates it in ${m('O(n)')} time. This is the <strong>Gottesman–Knill theorem</strong>: circuits of Clifford gates, Pauli measurements and stabilizer states can be simulated efficiently on a classical computer ([[L:stabsim]]), even though they create highly entangled states.</p>
<p>The same rules describe how errors move. An error ${m('P')} just before a circuit ${m('U')} is equivalent to the error ${m('UPU†')} just after it, since ${m('UP = (UPU†)U')}. An ${m('X')} error on the control of a CNOT becomes ${m('XX')}: one fault, two errors. Fault-tolerant design is largely about stopping this spread ([[L:faulttolerance]]).</p>
${LAB('tableau')}
<h2>Why Cliffords are not enough</h2>
<p>Because they are easy to simulate, Clifford circuits alone give no quantum advantage. The ${m('T')} gate, a rotation by 45° about Z, maps ${m('X')} to ${m('(X + Y)/√2')}, which is not a Pauli; it sits one level higher in the <strong>Clifford hierarchy</strong>. Clifford gates plus ${m('T')} are universal ([[L:universal]]). On error-corrected machines Cliffords are cheap or free while each ${m('T')} needs a distilled magic state ([[L:magic]]), so ${m('T')} counts dominate resource estimates. Random Cliffords are also the workhorse of characterization: randomized benchmarking ([[L:rb]]), Pauli twirling ([[L:randcomp]]) and classical shadows ([[L:shadows]]) all use them.</p>
`,
  labs: {
    octa: {
      title: 'The 24 single-qubit Cliffords as octahedron symmetries',
      cap: 'Conjugation by a gate rotates the Bloch sphere. The copper arrow is where Z goes (U Z U†, also the state U|0⟩) and the cyan arrow is where X goes; dots mark the octahedron’s six vertices. Clifford gates always land the arrows on vertices. Count the distinct Cliffords you reach, or take the tour of all 24. Then press T and watch X leave the octahedron.',
      build(body, id) {
        let R = [1, 0, 0, 0, 1, 0, 0, 0, 1], seen = new Set([keyR(R)]), seq = [], anim = null, queue = [], nonC = false;
        const sph = canvas('sq', 'max-width:310px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: false }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        let fx = [1, 0, 0], fz = [0, 0, 1];
        const OCT = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        bv.shape = true; bv.drawShape = (ctx, T) => {
          ctx.strokeStyle = T.muted; ctx.lineWidth = 1; ctx.globalAlpha = .45;
          for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (Math.abs(V.dot(OCT[i], OCT[j])) < .5) { const a = bv.proj(OCT[i]), b = bv.proj(OCT[j]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
          ctx.globalAlpha = 1; for (const v of OCT) { const p = bv.proj(v); dot(ctx, p[0], p[1], 4, T.muted); }
          const c0 = bv.proj([0, 0, 0]), p = bv.proj(fx); arrow(ctx, c0[0], c0[1], p[0], p[1], T.cyan, 3, 11); txt(ctx, 'X', p[0] + 10, p[1] - 10, { color: T.cyan, font: '700 13px "JetBrains Mono",monospace' });
          const pz = bv.proj(fz); txt(ctx, 'Z', pz[0] + 10, pz[1] - 10, { color: T.copper, font: '700 13px "JetBrains Mono",monospace' });
        };
        const text = () => {
          const imgs = [0, 1, 2].map(j => pauliOf(col3(R, j)));
          ro.innerHTML = `<span class="k">U X U† = </span>${imgs[0]}<br><span class="k">U Y U† = </span>${imgs[1]}<br><span class="k">U Z U† = </span>${imgs[2]}<br><span class="k">gates </span>${seq.slice(-12).join(' ') || 'none (identity)'}<br>` +
            (nonC ? `<span style="color:var(--bad)">After T the images are no longer Pauli operators: T is not a Clifford gate.</span>` : `<span class="k">distinct Cliffords visited </span>${seen.size} of 24`);
        };
        const start = g => { const [ax, ang] = AXANG[g]; anim = { g, ax: V.unit(ax), ang, t0: performance.now(), x0: fx.slice(), z0: fz.slice() }; };
        Scope.tick(now => {
          if (!anim && queue.length) start(queue.shift());
          if (!anim) return; const t = reduced() ? 1 : clamp((now - anim.t0) / 520, 0, 1), e = ease(t);
          fx = V.rot(anim.x0, anim.ax, anim.ang * e); fz = V.rot(anim.z0, anim.ax, anim.ang * e); bv.v = fz; bv.inv();
          if (t >= 1) { R = mm3(R3[anim.g], R); fx = col3(R, 0); fz = col3(R, 2); bv.v = fz; seq.push(anim.g === 'Sdg' ? 'S†' : anim.g); if (isCliff(R)) { seen.add(keyR(R)); nonC = false; } else nonC = true; anim = null; text(); bv.inv(); }
        });
        const go = g => { if (queue.length > 30) return; queue.push(g); };
        const reset = () => { queue = []; anim = null; R = [1, 0, 0, 0, 1, 0, 0, 0, 1]; fx = [1, 0, 0]; fz = [0, 0, 1]; bv.v = fz; seq = []; nonC = false; seen = new Set([keyR(R)]); bv.inv(); text(); };
        const tour = () => {   /* Hamiltonian path through the Cayley graph generated by H and S */
          reset(); const path = [], vis = new Set([keyR(R)]);
          const dfs = (Q) => { if (vis.size === 24) return true; for (const g of ['S', 'H']) { const Q2 = mm3(R3[g], Q), k = keyR(Q2); if (vis.has(k)) continue; vis.add(k); path.push(g); if (dfs(Q2)) return true; vis.delete(k); path.pop(); } return false; };
          dfs(R); queue = path.slice();
        };
        const rnd = () => { for (let i = 0; i < 5; i++) go(Math.random() < .5 ? 'H' : 'S'); };
        body.append(h('div', { class: 'btns' }, ...['H', 'S', 'Sdg', 'X', 'Y', 'Z'].map(g => gateBtn(g === 'Sdg' ? 'S†' : g, () => go(g), g + ' gate')), gateBtn('T', () => go('T'), 'T gate (not Clifford)')),
          h('div', { class: 'split' }, sph, h('div', { class: 'stack' }, ro, h('div', { class: 'btns' }, btn('Tour all 24', tour, 'pri'), btn('Random Clifford', rnd), btn('Reset', reset, 'sm')))));
        bv.v = fz; text();
      }
    },
    tableau: {
      title: 'Propagating a Pauli through a Clifford circuit',
      cap: 'Choose a Pauli error P on the two input wires, then build a circuit. The chain shows P after each gate (U P U†), and the table lists the images of the four generators, the circuit’s tableau. Try an X on q0 through H then CNOT, or the three-CNOT SWAP. Adding T makes the image stop being a Pauli.',
      build(body, id) {
        let pin = ['X', 'I'], circ = ['H0', 'CX01'];
        const cw = h('div', { class: 'scroll-x' }), chain = h('div', { class: 'readout', style: 'white-space:normal' }), tw = h('div', { class: 'scroll-x' });
        const conj = (P, g) => cmul4(cmul4(G2[g], P), dag4(G2[g]));
        const NM = { H0: 'H q0', H1: 'H q1', S0: 'S q0', S1: 'S q1', CX01: 'CNOT 0→1', CX10: 'CNOT 1→0', CZ: 'CZ', T0: 'T q0' };
        const upd = () => {
          cw.innerHTML = ''; cw.append(drawCircuit(2, circ.map(g => [G2OP[g]]), { labels: ['q0', 'q1'] }).svg);
          let P = P2[pin.join('')], s = `<span class="k">before </span>+${pin.join('')}`;
          for (const g of circ) { P = P === null ? null : conj(P, g); const idn = P ? identify2(P) : 'not a Pauli'; s += ` <span class="k">→ ${NM[g]} →</span> ${idn}`; if (idn === 'not a Pauli') P = null; }
          chain.innerHTML = s + `<br><span class="k">An error ${pin.join('')} before the circuit equals the last error after it.</span>`;
          const rows = ['XI', 'IX', 'ZI', 'IZ'].map(k => { let Q = P2[k]; for (const g of circ) Q = conj(Q, g); return `<tr><td>${k}</td><td>${identify2(Q)}</td></tr>`; }).join('');
          tw.innerHTML = `<table class="mini-tbl"><thead><tr><th>generator</th><th>image U P U†</th></tr></thead><tbody>${rows}</tbody></table>`;
        };
        const add = g => { if (circ.length < 9) { circ.push(g); upd(); } };
        const pseg = q => seg(['I', 'X', 'Y', 'Z'].map(v => ({ v, label: v })), pin[q], v => { pin[q] = v; upd(); }, 'Pauli on q' + q);
        body.append(h('div', { class: 'split even' }, field('Input Pauli on q0', pseg(0)), field('Input Pauli on q1', pseg(1))),
          h('div', { class: 'btns' }, ...['H0', 'H1', 'S0', 'S1', 'CX01', 'CX10', 'CZ'].map(g => btn(NM[g], () => add(g))), btn('T q0', () => add('T0'))),
          h('div', { class: 'btns' }, btn('Preset: Bell circuit', () => { circ = ['H0', 'CX01']; upd(); }, 'sm'), btn('Preset: SWAP', () => { circ = ['CX01', 'CX10', 'CX01']; upd(); }, 'sm'), btn('Preset: H·CNOT·H = CZ', () => { circ = ['H1', 'CX01', 'H1']; upd(); }, 'sm'), btn('Undo', () => { circ.pop(); upd(); }, 'sm'), btn('Clear', () => { circ = []; upd(); }, 'sm')),
          cw, h('div', { class: 'split' }, chain, tw));
        upd();
      }
    }
  },
  take: ['Pauli strings form a basis for all operators and any two either commute or anticommute, so Pauli errors and Pauli measurements are the language of error correction.',
    'Clifford gates map Paulis to Paulis under conjugation; they are generated by H, S and CNOT, and the 24 single-qubit Cliffords are the octahedron’s rotations.',
    'A Clifford is fixed by its tableau, the images of X and Z on each qubit, which makes Clifford circuits efficiently simulable (Gottesman–Knill).',
    'An error P before U equals UPU† after it, which is how errors spread through circuits; T is not Clifford, and Clifford + T is universal.'],
  quiz: QZ([
    ['How many n-qubit Pauli strings are there, ignoring phases?', ['2ⁿ', '4ⁿ', 'n²', '3n'], 1, 'Each qubit carries one of I, X, Y, Z, and these 4ⁿ strings span all operators.'],
    ['When do two Pauli strings commute?', ['Always', 'When the number of positions where both are non-identity and different is even', 'Never', 'Only if they are equal'], 1, 'Each such position contributes a factor −1 when the order is swapped.'],
    ['What defines a Clifford gate?', ['It is diagonal', 'Conjugating any Pauli by it gives a Pauli: UPU† is in the Pauli group', 'It has eigenvalues ±1', 'It acts on one qubit'], 1, 'Cliffords form the normalizer of the Pauli group.'],
    ['Under conjugation by H, what does X become?', ['Y', 'Z', '−X', 'X'], 1, 'H swaps the X and Z axes of the Bloch sphere and flips Y.'],
    ['Under conjugation by CNOT (control on qubit 1), what does XI become?', ['XI', 'XX', 'ZZ', 'IX'], 1, 'An X on the control is copied to the target.'],
    ['How many single-qubit Clifford operations are there up to global phase?', ['6', '24', '12', 'Infinitely many'], 1, 'They are the 24 rotational symmetries of the octahedron with vertices ±x, ±y, ±z.'],
    ['What makes Clifford circuits efficient to simulate classically?', ['They create no entanglement', 'A Clifford is determined by 2n Pauli images, which can be updated gate by gate in polynomial time', 'They are always shallow', 'They use few qubits'], 1, 'This is the Gottesman–Knill theorem; Clifford circuits can still create highly entangled states.'],
    ['An X error on the control qubit occurs just before a CNOT. What is the equivalent error just after it?', ['X on the control only', 'X on both qubits', 'Z on the target', 'No error'], 1, 'XI before CNOT equals XX after it: one fault becomes two errors.'],
    ['What does the T gate do to X under conjugation?', ['X → Y', 'X → (X + Y)/√2, which is not a Pauli', 'X → X', 'X → Z'], 1, 'A 45° rotation about Z moves the X axis off the octahedron, so T is not Clifford.'],
    ['Why do T gates dominate the cost of error-corrected algorithms?', ['They are slow on every platform', 'Cliffords are cheap on most codes, while each T needs a distilled magic state', 'They cannot be compiled', 'They create errors on purpose'], 1, 'Magic-state distillation makes non-Clifford gates the expensive resource.']
  ])
});

/* ---------- cluster states and measurement-based computing ---------- */
const GPOS = v => [(v % 3 + .5) / 3, (Math.floor(v / 3) + .5) / 2];
const GPRE = {
  line: [[0, 1], [1, 2], [2, 5], [5, 4], [4, 3]], ring: [[0, 1], [1, 2], [2, 5], [5, 4], [4, 3], [3, 0]],
  grid: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]], star: [[1, 0], [1, 2], [1, 3], [1, 4], [1, 5]], empty: []
};
const CUTS = { lr: [0, 3], tb: [0, 1, 2], cb: [0, 2, 4] };
function rank2(rows) {   /* rank over GF(2) of rows given as bit masks */
  const r = rows.slice(); let rk = 0;
  for (let bit = 0; bit < 31 && rk < r.length; bit++) { const m = 1 << bit; let p = -1; for (let i = rk; i < r.length; i++) if (r[i] & m) { p = i; break; } if (p < 0) continue; [r[rk], r[p]] = [r[p], r[rk]]; for (let i = 0; i < r.length; i++) if (i !== rk && (r[i] & m)) r[i] ^= r[rk]; rk++; }
  return rk;
}
const applyC = (m, [a, b]) => [C2.add(C2.mul(m[0], a), C2.mul(m[1], b)), C2.add(C2.mul(m[2], a), C2.mul(m[3], b))];
const blochAB = ([a, b]) => [2 * (a[0] * b[0] + a[1] * b[1]), 2 * (a[0] * b[1] - a[1] * b[0]), a[0] ** 2 + a[1] ** 2 - b[0] ** 2 - b[1] ** 2];
const MB_PRE = { I: [0, 0, 0, 0], H: [PI / 2, PI / 2, PI / 2, 0], T: [PI / 4, 0, 0, 0], RX: [0, PI / 2, 0, 0], custom: null };

LESSONS.push({
  id: 'mbqc', n: 10.4, stage: 2, minutes: 16, title: 'Cluster states and measurement-based quantum computing',
  lede: 'Prepare one large entangled state at the start, then compute only by measuring single qubits, choosing each measurement angle from earlier results. In this model entanglement is the fuel and measurement is the engine.',
  html: `
<h2>Graph states</h2>
<p>Take any graph. Put a qubit in ${m('|+⟩')} on every vertex and apply a CZ gate along every edge. The result is a <strong>graph state</strong>. Because CZ gates commute, the order does not matter, and the state is described compactly by one stabilizer per vertex ([[L:stabilizers]]):</p>
${EQ('K<sub>v</sub> = X<sub>v</sub> ∏<sub>u ∈ N(v)</sub> Z<sub>u</sub>, &nbsp;&nbsp; K<sub>v</sub>|G⟩ = |G⟩')}
<p>where ${m('N(v)')} are the neighbours of ${m('v')}. The entanglement between two groups of vertices ${m('A')} and ${m('B')} is simple too: it equals the rank, over arithmetic mod 2, of the block of the adjacency matrix linking ${m('A')} to ${m('B')}, in ebits (Hein, Eisert and Briegel, 2004). A star graph is a GHZ state ([[L:ghz]]) in disguise, and a graph on a 2D square lattice is the <strong>cluster state</strong> of Briegel and Raussendorf (2001).</p>
${LAB('graph')}
<h2>Computing by measuring</h2>
<p>The basic move is one-bit teleportation. Put an input ${m('|ψ⟩')} on qubit 1, ${m('|+⟩')} on qubit 2, apply CZ, and measure qubit 1 in the basis ${m('(|0⟩ ± e^(−iθ)|1⟩)/√2')}. With outcome ${m('s')}, qubit 2 is left in</p>
${EQ('X<sup>s</sup> H P(θ) |ψ⟩, &nbsp;&nbsp; P(θ) = diag(1, e<sup>iθ</sup>)')}
<p>The state has moved one step along the chain and been rotated by an angle we chose. Along a chain of five qubits, four measurements apply ${m('H P(θ₄) H P(θ₃) H P(θ₂) H P(θ₁)')}, which is ${m('R<sub>x</sub>(θ₄) R<sub>z</sub>(θ₃) R<sub>x</sub>(θ₂) R<sub>z</sub>(θ₁)')} up to phase: enough for any single-qubit gate. Vertical links in a 2D cluster add CZ gates between chains, so the 2D cluster state is a <strong>universal resource</strong> for quantum computation (Raussendorf and Briegel, 2001). The one-way quantum computer consumes it: each measurement destroys entanglement, hence the name.</p>
<h2>Feed-forward</h2>
<p>The outcomes are random, and each leaves a <strong>byproduct</strong> Pauli ${m('X<sup>s</sup>')} on the output. Pauli byproducts can be pushed through later steps, but pushing ${m('X')} through ${m('P(θ)')} flips the sign of the angle. So each measurement angle must be chosen as ${m('±θ')} depending on earlier outcomes. This <strong>feed-forward</strong> fixes the time order of the computation; the final Pauli byproducts are simply undone, or tracked in software. Measurements in the Pauli bases X, Y and Z never need adapting, so the whole Clifford part of a computation can be done in the first round, all at once. That is another view of the Gottesman–Knill theorem ([[L:clifford]]).</p>
${LAB('oneway')}
<h2>Where it is used</h2>
<ul>
<li><strong>Photonics.</strong> Photons are easy to entangle in large numbers but hard to interact deterministically, so photonic architectures build cluster-like states and measure them. Fusion-based quantum computing, pursued by PsiQuantum, stitches small entangled states into a 3D cluster with fusion measurements ([[L:photonic]]). Continuous-variable cluster states with tens of thousands of time-multiplexed modes were made in 2019 (Asavanant and colleagues; Larsen and colleagues).</li>
<li><strong>Blind computing.</strong> The server only ever sees single-qubit measurement angles, padded with secret random offsets, so it cannot tell what is being computed ([[L:blind]]).</li>
<li><strong>Theory.</strong> MBQC separates the quantum resource (the state) from the classical control (the angles and feed-forward). It shows that 1D clusters are not universal, since they are matrix product states that a classical computer can simulate ([[L:tensornet]]), and it connects error correction to topology: Raussendorf’s 3D cluster state carries a surface code through time.</li>
</ul>
`,
  labs: {
    graph: {
      title: 'Build a graph state',
      cap: 'Edit mode: click two vertices to add or remove the edge between them. The list shows each vertex’s stabilizer Kᵥ = Xᵥ ∏ Z(neighbours), checked numerically on the 64-amplitude state. The rings mark a bipartition; the entanglement across it is the rank (mod 2) of the edges crossing it. Measure-Z mode: clicking a vertex measures it in Z, which cuts it out of the graph.',
      build(body, id) {
        let A = [...Array(6)].map(() => new Array(6).fill(0)), gone = new Set(), sel = null, mode = 'edit', cut = 'lr';
        const cv = canvas('', 'height:230px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const setPre = k => { A = [...Array(6)].map(() => new Array(6).fill(0)); for (const [a, b] of GPRE[k]) A[a][b] = A[b][a] = 1; gone = new Set(); sel = null; upd(); };
        const geo = (w, H) => ({ P: v => { const [x, y] = GPOS(v); return [x * w, 18 + y * (H - 36)]; }, r: Math.min(22, w / 14) });
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), g = geo(w, H), inA = CUTS[cut];
          for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) if (A[a][b] && !gone.has(a) && !gone.has(b)) { const pa = g.P(a), pb = g.P(b); const cross = inA.includes(a) !== inA.includes(b); ctx.strokeStyle = cross ? T.copper : T.ink; ctx.lineWidth = cross ? 3 : 2.2; ctx.setLineDash(cross ? [6, 4] : []); ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke(); ctx.setLineDash([]); }
          for (let v = 0; v < 6; v++) { const [x, y] = g.P(v), off = gone.has(v); ctx.globalAlpha = off ? .3 : 1; dot(ctx, x, y, g.r, sel === v ? T.copper : T.surface2, inA.includes(v) ? T.copper : T.cyan); txt(ctx, String(v), x, y, { color: sel === v ? T.surface : T.ink, font: '700 14px "JetBrains Mono",monospace' }); ctx.globalAlpha = 1; }
        });
        cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, g = geo(r.width, r.height); let best = -1, bd = 1e9; for (let v = 0; v < 6; v++) { const [px, py] = g.P(v), dd = Math.hypot(px - x, py - y); if (dd < bd) { bd = dd; best = v; } } if (bd > g.r * 1.6 || gone.has(best)) return;
          if (mode === 'meas') { gone.add(best); sel = null; upd(); return; } if (sel === null) sel = best; else if (sel === best) sel = null; else { A[sel][best] = A[best][sel] = 1 - A[sel][best]; sel = null; } upd(); });
        const upd = () => {
          p.inv(); const act = [0, 1, 2, 3, 4, 5].filter(v => !gone.has(v)), n = 6, amp = new Float64Array(64);
          for (let b = 0; b < 64; b++) { let ok = true; for (const v of gone) if (b >> (5 - v) & 1) ok = false; if (!ok) continue; let e = 0; for (let a = 0; a < 6; a++) for (let c3 = a + 1; c3 < 6; c3++) if (A[a][c3] && !gone.has(a) && !gone.has(c3) && (b >> (5 - a) & 1) && (b >> (5 - c3) & 1)) e++; amp[b] = (e % 2 ? -1 : 1) / Math.sqrt(2 ** act.length); }
          const lines = act.map(v => { let s = ''; for (let u = 0; u < n; u++) s += gone.has(u) ? '·' : u === v ? 'X' : A[v][u] ? 'Z' : 'I'; let ex = 0; for (let b = 0; b < 64; b++) { if (!amp[b]) continue; const b2 = b ^ (1 << (5 - v)); let sg = 1; for (let u = 0; u < 6; u++) if (A[v][u] && !gone.has(u) && (b >> (5 - u) & 1)) sg = -sg; ex += amp[b2] * amp[b] * sg; } return `<span class="k">K${'₀₁₂₃₄₅'[v]} = </span>${s.split('').join(' ')} <span class="k">⟨K⟩ = ${num(ex, 3)}</span>`; });
          const inA = CUTS[cut].filter(v => !gone.has(v)), inB = act.filter(v => !inA.includes(v)), rows = inA.map(a => inB.reduce((m2, b, j) => m2 | (A[a][b] ? 1 << j : 0), 0));
          const E = rank2(rows), ne = act.reduce((s, a) => s + act.filter(b => b > a && A[a][b]).length, 0);
          ro.innerHTML = lines.join('<br>') + `<br><span class="k">edges </span>${ne} &nbsp; <span class="k">entanglement across the cut </span>${E} ebit${E === 1 ? '' : 's'}${gone.size ? `<br><span class="k">measured in Z: </span>${[...gone].join(', ')}` : ''}`;
        };
        body.append(h('div', { class: 'btns' }, ...[['line', 'Line (1D cluster)'], ['ring', 'Ring'], ['grid', '2 × 3 cluster'], ['star', 'Star (GHZ)'], ['empty', 'Empty']].map(([k, l]) => btn(l, () => setPre(k), k === 'grid' ? 'pri' : ''))),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, field('Click mode', seg([{ v: 'edit', label: 'Edit edges' }, { v: 'meas', label: 'Measure Z' }], mode, v => { mode = v; sel = null; p.inv(); }, 'Mode')), field('Bipartition (copper ring = side A)', seg([{ v: 'lr', label: 'Left column' }, { v: 'tb', label: 'Top row' }, { v: 'cb', label: 'Checkerboard' }], cut, v => { cut = v; upd(); }, 'Cut'))), ro));
        setPre('grid');
      }
    },
    oneway: {
      title: 'A one-way quantum computer on a five-qubit chain',
      cap: 'Qubit 0 holds the input; the other four start in |+⟩, and CZs link the chain. Measuring qubits 0–3 in turn applies H P(θ) at each step and moves the state to qubit 4. Outcomes are random. With feed-forward each angle’s sign is chosen from earlier outcomes and the output always matches the target (dashed ring); without it, the run fails whenever an X byproduct reaches a non-Pauli angle. Compare the average fidelities. The T preset succeeds either way, because its only angle is measured first, before any byproduct exists; try Rx(90°) with input |0⟩.',
      build(body, id) {
        let th = MB_PRE.H.slice(), adapt = true, inp = 'plus', run = null, stats = { on: [], off: [] };
        const cc = canvas('', 'height:120px'), sph = canvas('sq', 'max-width:270px;margin:0 auto'), bv = new BlochView(sph, { labels: 'full', trail: false }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const inState = () => inp === 'zero' ? [[1, 0], [0, 0]] : inp === 'plus' ? [[S2, 0], [S2, 0]] : [[S2, 0], [0, S2]];
        const ideal = () => { let s = inState(); for (let j = 0; j < 4; j++) { s = applyC(Phase(th[j]), s); s = applyC(M.H, s); } return s; };
        const simulate = () => {
          const st = new QState(5), s0 = inState(); st.re.fill(0); st.im.fill(0); st.re[0] = s0[0][0]; st.im[0] = s0[0][1]; st.re[16] = s0[1][0]; st.im[16] = s0[1][1];
          for (let q = 1; q < 5; q++) st.g('H', q); for (let q = 0; q < 4; q++) st.cz(q, q + 1);
          let x = 0, z = 0; const steps = [];
          for (let j = 0; j < 4; j++) { const used = adapt && x ? -th[j] : th[j]; st.apply(j, Phase(used)); st.g('H', j); const s = st.measure(j); steps.push({ used, s, x, z }); const nx = s ^ z, nz = x; x = nx; z = nz; }
          let base = 0; steps.forEach((t, j) => { if (t.s) base |= 1 << (4 - j); });
          let out = [[st.re[base], st.im[base]], [st.re[base | 1], st.im[base | 1]]]; const nr = Math.hypot(...out[0], ...out[1]); out = out.map(a => [a[0] / nr, a[1] / nr]);
          if (x) out = [out[1], out[0]]; if (z) out[1] = [-out[1][0], -out[1][1]];
          const bo = blochAB(out), bi = blochAB(ideal()), F = (1 + V.dot(bo, bi)) / 2;
          return { steps, x, z, bo, bi, F };
        };
        const p = painter(cc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), y = H / 2 - 8, xs = [0, 1, 2, 3, 4].map(i => w * (.1 + .2 * i)), r = Math.min(20, w / 22), k = run ? run.k : -1;
          ctx.strokeStyle = T.ink; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { if (run && i < k) continue; ctx.beginPath(); ctx.moveTo(xs[i] + r, y); ctx.lineTo(xs[i + 1] - r, y); ctx.stroke(); }
          for (let i = 0; i < 5; i++) { const done = run && i < k, now = run && i === k && k < 4; dot(ctx, xs[i], y, r, done ? T.surface2 : now ? T.copper : i === 4 ? T.cyan : T.surface2, done ? T.line : T.ink);
            txt(ctx, done ? String(run.res.steps[i].s) : i === 4 ? 'out' : String(i), xs[i], y, { color: now ? T.surface : T.ink, font: '700 13px "JetBrains Mono",monospace' });
            if (i < 4) txt(ctx, run && i <= k ? `${run.res.steps[i].used >= 0 ? '' : '−'}${num(deg(Math.abs(run.res.steps[i].used)), 0)}°` : `θ${'₁₂₃₄'[i]} = ${num(deg(th[i]), 0)}°`, xs[i], y + r + 16, { font: '500 11px "JetBrains Mono",monospace', color: run && i <= k && run.res.steps[i].used < 0 ? T.copper : T.muted }); }
          if (run && k >= 1) { const st = k < 4 ? run.res.steps[k] : { x: run.res.x, z: run.res.z }; txt(ctx, `byproduct on qubit ${k}: ${st.x ? 'X' : ''}${st.z ? 'Z' : ''}${!st.x && !st.z ? 'none' : ''}`, w / 2, H - 10, { font: '500 11px "JetBrains Mono",monospace' }); }
          else txt(ctx, 'measure qubits 0 → 3, keep qubit 4', w / 2, H - 10, { font: '500 11px "JetBrains Mono",monospace' });
        });
        const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
        const text = (res) => { const a = stats.on, b = stats.off;
          ro.innerHTML = (res ? `<span class="k">outcomes </span>${res.steps.map(s => s.s).join(' ')}<br><span class="k">fidelity of output with target </span>${num(res.F, 3)}<br>` : '') +
            `<span class="k">mean fidelity with feed-forward </span>${a.length ? num(mean(a), 3) + ` (${a.length} runs)` : '–'}<br><span class="k">mean fidelity without </span>${b.length ? num(mean(b), 3) + ` (${b.length} runs)` : '–'}`; };
        const showRes = res => { bv.v = res.bo; bv.target = res.bi; bv.inv(); };
        const runOnce = () => { const res = simulate(); (adapt ? stats.on : stats.off).push(res.F); run = { res, k: 0 }; p.inv(); bv.target = res.bi; bv.inv();
          const stepT = reduced() ? 0 : 650; for (let k = 1; k <= 4; k++) Scope.later(stepT * k, () => { if (!run || run.res !== res) return; run.k = k; p.inv(); if (k === 4) { showRes(res); text(res); } }); if (!stepT) { run.k = 4; showRes(res); text(res); } };
        const runMany = () => { let last; for (let i = 0; i < 200; i++) { last = simulate(); (adapt ? stats.on : stats.off).push(last.F); } run = { res: last, k: 4 }; showRes(last); p.inv(); text(last); };
        const clearS = () => { stats = { on: [], off: [] }; run = null; const b = blochAB(ideal()); bv.target = b; bv.v = blochAB(inState()); bv.inv(); p.inv(); text(); };
        const sl = [0, 1, 2, 3].map(j => slider({ id: id('t' + j), label: `θ${'₁₂₃₄'[j]}`, min: -PI, max: PI, step: PI / 24, value: th[j], fmt: v => num(deg(v), 0) + '°', on: v => { th[j] = v; preSeg.set('custom'); clearS(); } }));
        const preSeg = seg([{ v: 'I', label: 'Identity' }, { v: 'H', label: 'Hadamard' }, { v: 'T', label: 'T gate' }, { v: 'RX', label: 'Rx(90°)' }, { v: 'custom', label: 'Custom' }], 'H', v => { if (MB_PRE[v]) { th = MB_PRE[v].slice(); sl.forEach((s, j) => s.set(th[j])); } clearS(); }, 'Target gate');
        body.append(h('div', { class: 'btns' }, preSeg), cc, h('div', { class: 'split' }, h('div', { class: 'stack' }, sph, ro), h('div', { class: 'stack' },
          field('Input state on qubit 0', seg([{ v: 'zero', label: '|0⟩' }, { v: 'plus', label: '|+⟩' }, { v: 'pi', label: '|+i⟩' }], inp, v => { inp = v; clearS(); }, 'Input')),
          field('Feed-forward', seg([{ v: true, label: 'Adapt angles' }, { v: false, label: 'Fixed angles' }], adapt, v => { adapt = v; }, 'Feed-forward')),
          h('div', { class: 'btns' }, btn('Run once', runOnce, 'pri'), btn('Run 200 times', runMany), btn('Reset stats', clearS, 'sm')), ...sl)));
        clearS();
      }
    }
  },
  take: ['A graph state puts |+⟩ on every vertex and CZ on every edge; its stabilizers are Kᵥ = Xᵥ ∏ Z(neighbours), and cut entanglement is a mod-2 rank.',
    'Measuring a qubit of a chain in the basis (|0⟩ ± e^(−iθ)|1⟩)/√2 teleports the state one step and applies H P(θ); four steps give any single-qubit gate.',
    'Random outcomes leave Pauli byproducts, so later angles must adapt (feed-forward); Pauli-basis measurements never adapt and can all be done at once.',
    '2D cluster states are universal resources; MBQC underlies photonic and fusion-based architectures and blind quantum computing.'],
  quiz: QZ([
    ['How is a graph state prepared?', ['By measuring every qubit', 'Each vertex starts in |+⟩ and a CZ is applied along every edge', 'With CNOTs along a spanning tree only', 'By cooling a lattice'], 1, 'The CZ gates commute, so the order of edges does not matter.'],
    ['What is the stabilizer of vertex v in a graph state?', ['Zᵥ alone', 'Xᵥ times Z on every neighbour of v', 'X on every vertex', 'Yᵥ times X on neighbours'], 1, 'Kᵥ = Xᵥ ∏ Zᵤ over neighbours u; one generator per vertex fixes the state.'],
    ['How is the entanglement across a cut of a graph state computed?', ['By counting vertices', 'As the rank mod 2 of the adjacency block linking the two sides', 'As the number of edges, always', 'It is always one ebit'], 1, 'Several edges can contribute less than one ebit each if their rows are dependent.'],
    ['What does measuring one qubit of a two-qubit cluster in the basis (|0⟩ ± e^(−iθ)|1⟩)/√2 do?', ['Destroys the input', 'Teleports the input to the other qubit with H P(θ) applied, up to a Pauli byproduct Xˢ', 'Copies the input', 'Applies a CNOT'], 1, 'This one-bit teleportation is the basic step of the one-way model.'],
    ['Why is a 2D cluster state needed for universal computation, rather than a 1D chain?', ['1D chains cannot be measured', '1D clusters only process one logical qubit and can be simulated classically; 2D links let chains interact', '2D states are easier to make', 'There is no difference'], 1, 'Vertical links supply two-qubit gates; a 1D cluster is a simple matrix product state.'],
    ['Why must measurement angles sometimes be adapted?', ['To save time', 'An X byproduct from an earlier outcome flips the sign of a later rotation angle, so the angle is chosen as ±θ', 'Because of decoherence', 'To make outcomes deterministic'], 1, 'This classical feed-forward fixes the temporal order of the computation.'],
    ['In the lab, what happens to the mean fidelity without feed-forward for a Hadamard target?', ['It stays at 1', 'It drops, because runs with an X byproduct before a non-Pauli angle apply the wrong rotation', 'It increases', 'It is undefined'], 1, 'Only angles of 0 or π are immune to the sign flip.'],
    ['Which measurements never need adapting?', ['All of them', 'Measurements in the Pauli bases X, Y and Z', 'Only the last one', 'Those at 45°'], 1, 'So the Clifford part of a computation can be performed in the first round.'],
    ['Why is MBQC attractive for photonic hardware?', ['Photons interact strongly', 'Photons are easy to entangle in large numbers and measure, but hard to interact deterministically mid-computation', 'It needs no detectors', 'It avoids loss'], 1, 'Fusion-based architectures build large entangled states from small ones with measurements.'],
    ['How does blind quantum computing use MBQC?', ['It encrypts the hardware', 'The client sends measurement angles hidden by secret random offsets, so the server cannot learn the computation', 'It uses no entanglement', 'It reveals the input to the server'], 1, 'The server sees only single-qubit angles that look uniformly random.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Which-path information', 'A record, in some other system, of which route a particle took; its existence alone removes interference.', 'doubleslit'],
  ['Quantum eraser', 'Measuring a which-path marker in a basis that reveals nothing about the path, recovering fringes in the sorted data.', 'doubleslit'],
  ['Fringe visibility', 'The contrast of an interference pattern, (max − min)/(max + min); it obeys D² + V² ≤ 1 with path distinguishability D.', 'doubleslit'],
  ['Pauli group', 'Tensor products of I, X, Y and Z with phases ±1, ±i; any two elements commute or anticommute.', 'clifford'],
  ['Clifford hierarchy', 'Levels of gates defined by conjugation: Paulis, then Cliffords (Pauli to Pauli), then gates such as T that map Paulis to Cliffords.', 'clifford'],
  ['Graph state', 'The state made by preparing |+⟩ on every vertex of a graph and applying CZ along every edge.', 'mbqc'],
  ['Cluster state', 'A graph state on a square lattice; in 2D it is a universal resource for measurement-based computation.', 'mbqc'],
  ['Measurement-based quantum computing', 'Computing by single-qubit measurements on an entangled resource state, with angles adapted by earlier outcomes.', 'mbqc'],
  ['Byproduct operator', 'A Pauli correction left on the output by a random measurement outcome in MBQC or teleportation.', 'mbqc']
);
})();
