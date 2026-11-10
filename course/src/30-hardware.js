/* =====================================================================
   Stage 5 · real machines: hardware platforms
   trapped ions, neutral atoms, photonics, silicon spin qubits
   ===================================================================== */
(() => {
const ST = 4;

/* ---------- ion chain: equilibrium positions and axial normal modes (dimensionless units) ---------- */
function ionChain(N) {
  let u = [...Array(N)].map((_, i) => (i - (N - 1) / 2) * 2.0 * Math.pow(N, -.56));
  for (let it = 0; it < 200; it++) {
    const F = u.map((ui, i) => ui - u.reduce((s, uj, j) => j === i ? s : s + Math.sign(ui - uj) / (ui - uj) ** 2, 0));
    const J = new Float64Array(N * N); for (let i = 0; i < N; i++) { let d = 1; for (let j = 0; j < N; j++) if (j !== i) { const t = 2 / Math.abs(u[i] - u[j]) ** 3; d += t; J[i * N + j] = -t; } J[i * N + i] = d; }
    const M = [...Array(N)].map((_, i) => [...Array(N)].map((_, j) => J[i * N + j]).concat([F[i]]));
    for (let c3 = 0; c3 < N; c3++) { let p = c3; for (let r = c3 + 1; r < N; r++) if (Math.abs(M[r][c3]) > Math.abs(M[p][c3])) p = r; [M[c3], M[p]] = [M[p], M[c3]]; for (let r = 0; r < N; r++) if (r !== c3) { const f = M[r][c3] / M[c3][c3]; for (let k = c3; k <= N; k++) M[r][k] -= f * M[c3][k]; } }
    let mx = 0; for (let i = 0; i < N; i++) { const d = M[i][N] / M[i][i]; u[i] -= d; mx = Math.max(mx, Math.abs(d)); } if (mx < 1e-13) break;
  }
  const A = new Float64Array(N * N); for (let i = 0; i < N; i++) { let d = 1; for (let j = 0; j < N; j++) if (j !== i) { const t = 2 / Math.abs(u[i] - u[j]) ** 3; d += t; A[i * N + j] = -t; } A[i * N + i] = d; }
  const { w, V } = eigSymV(A, N);
  return { u, freq: Array.from(w, x => Math.sqrt(x)), modes: [...Array(N)].map((_, m) => [...Array(N)].map((_, i) => V[i * N + m])) };
}

LESSONS.push({
  id: 'ions', n: 19.1, stage: ST, minutes: 15, title: 'Trapped-ion quantum computers',
  lede: 'A string of single atoms, held in vacuum by electric fields and nudged by lasers, makes some of the most accurate qubits ever built. Their vibrations are the wires that connect them.',
  html: `
<h2>Atoms held by electric fields</h2>
<p>A trapped-ion processor holds a chain of ions, such as ytterbium-171 or barium-137 with one electron removed, in a radio-frequency <strong>Paul trap</strong> in ultra-high vacuum. The qubit is two internal energy levels of each ion: hyperfine levels split by gigahertz (driven with microwaves or pairs of laser beams) or an optical transition (driven by a single narrow laser). Every ion of a given isotope is identical, so there is no fabrication spread, and hyperfine qubits keep their coherence for seconds, and in the best demonstrations for over an hour. Readout uses state-dependent fluorescence ([[L:readout]]), with fidelities above 99.9%.</p>
<h2>The chain is a bus</h2>
<p>The ions repel each other, so in a trap they settle into a line with uneven spacing, closer in the middle. They also share their motion: the chain vibrates in collective <strong>normal modes</strong>, the lowest being the centre-of-mass mode where all ions move together, then the breathing mode at ${m('√3')} times its frequency. A laser can couple an ion’s internal state to these shared vibrations, and through them to any other ion in the chain. This is why trapped ions have all-to-all connectivity.</p>
${LAB('chain')}
<h2>The Mølmer–Sørensen gate</h2>
<p>The standard entangling gate (Mølmer and Sørensen, 1999) drives two ions with a bichromatic laser detuned by ${m('δ')} from a motional sideband. The motion is pushed around a circle in phase space whose radius depends on the collective spin ${m('S<sub>x</sub> = X₁ + X₂')}. After a time ${m('2π/δ')} the circle closes, the motion returns exactly to where it started, and the only trace left is a geometric phase proportional to the enclosed area and to ${m('S<sub>x</sub>²')}. Because ${m('S<sub>x</sub>² = 2 + 2X₁X₂')}, that phase is the entangling gate ${m('exp(−i π/4 · X₁X₂)')}. Remarkably, the result does not depend on the ion’s initial motional state, so the chain need not be cooled to its ground state.</p>
${LAB('ms')}
<h2>Strengths and challenges</h2>
<ul>
<li><strong>Fidelity.</strong> Two-qubit gates above 99.9% fidelity have been reported, among the best of any platform.</li>
<li><strong>Speed.</strong> Gates take tens to hundreds of microseconds, roughly a thousand times slower than superconducting gates.</li>
<li><strong>Scaling.</strong> As the chain grows, its modes crowd together in frequency and gates slow down. The <strong>QCCD</strong> architecture (Kielpinski, Monroe and Wineland, 2002), used by Quantinuum, instead keeps several short chains in separate zones of a chip trap and shuttles ions between them. Photonic links between traps are another route.</li>
</ul>
`,
  labs: {
    chain: {
      title: 'An ion chain and its vibrations',
      cap: 'N ions in a harmonic trap find the equilibrium where the trap force balances their Coulomb repulsion (solved numerically); spacing is smallest in the middle. The animation shows the chosen axial normal mode, and the bars show each ion’s amplitude in it. Right: the mode frequencies in units of the trap frequency. Mode 1 is the centre of mass at 1, mode 2 the breathing mode at √3 ≈ 1.732.',
      build(body, id) {
        let N = 6, mode = 0, C = null, t0 = performance.now();
        const cv = canvas('', 'height:150px'), cb = canvas('', 'height:110px'), cs = canvas('', 'height:210px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), ctl = h('div', { class: 'stack' });
        const setup = () => { C = ionChain(N); mode = Math.min(mode, N - 1); mk(); text(); qs.inv(); qb.inv(); };
        const q = painter(cv, ({ ctx, w, h: H }) => {
          if (!C) return; const T = Theme.get(), span = Math.max(...C.u.map(Math.abs)) * 1.25 + .3, X = v => w / 2 + v / span * (w / 2 - 20), tt = (performance.now() - t0) / 1000, amp = reduced() ? 0 : .35 * Math.sin(TAU * .7 * C.freq[mode] * tt);
          ctx.strokeStyle = T.line; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(10, H / 2); ctx.lineTo(w - 10, H / 2); ctx.stroke(); ctx.setLineDash([]);
          for (let k = -1; k <= 1; k += 2) { ctx.strokeStyle = T.muted; ctx.lineWidth = 2; ctx.beginPath(); for (let y = 20; y < H - 20; y += 2) { const x = w / 2 + k * (w / 2 - 6) - k * 8 * Math.cos((y - H / 2) / 30); y === 20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
          C.u.forEach((ui, i) => { const x = X(ui + amp * C.modes[mode][i]); const g = ctx.createRadialGradient(x, H / 2, 1, x, H / 2, 14); g.addColorStop(0, rgba(T.cyan, .95)); g.addColorStop(1, rgba(T.cyan, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, H / 2, 14, 0, TAU); ctx.fill(); dot(ctx, x, H / 2, 4.5, T.ink); });
          txt(ctx, 'trap axis', w - 14, H / 2 - 12, { align: 'right', font: '500 10px "JetBrains Mono",monospace' });
        });
        Scope.tick(() => q.inv());
        const qb = painter(cb, ({ ctx, w, h: H }) => { if (!C) return; const T = Theme.get(), bw = (w - 20) / N, mid = H / 2; ctx.strokeStyle = T.line; ctx.beginPath(); ctx.moveTo(10, mid); ctx.lineTo(w - 10, mid); ctx.stroke(); C.modes[mode].forEach((b, i) => { const hh = b * (H / 2 - 12); ctx.fillStyle = phaseColor(b >= 0 ? 0 : PI); ctx.fillRect(10 + i * bw + bw * .25, hh >= 0 ? mid - hh : mid, bw * .5, Math.abs(hh)); }); txt(ctx, `mode ${mode + 1}: ion amplitudes`, 10, 8, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace' }); });
        const qs = painter(cs, ({ ctx, w, h: H }) => { if (!C) return; const T = Theme.get(), fm = Math.max(...C.freq) * 1.08, A = axes(ctx, w, H, { x: [0, fm], y: [0, 1], xt: [0, 1, 2, 3, 4, 5].filter(v => v <= fm), yt: [], xl: 'mode frequency / trap frequency', pad: { l: 14 } }); C.freq.forEach((f, m_) => { ctx.strokeStyle = m_ === mode ? T.copper : T.cyan; ctx.lineWidth = m_ === mode ? 3 : 2; ctx.beginPath(); ctx.moveTo(A.X(f), A.B); ctx.lineTo(A.X(f), A.T + 20); ctx.stroke(); }); txt(ctx, 'axial mode spectrum', A.L + 4, A.T + 6, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace' }); });
        const text = () => { const gaps = C.u.slice(1).map((v, i) => v - C.u[i]), f = C.freq; ro.innerHTML = `<span class="k">ions </span>${N} &nbsp; <span class="k">mode ${mode + 1} frequency </span>${num(f[mode], 3)}<br><span class="k">spacing, centre / edge </span>${num(Math.min(...gaps), 3)} / ${num(gaps[0], 3)}<br><span class="k">gap between the two highest modes </span>${num(f[N - 1] - f[N - 2], 3)}`; };
        const mk = () => { ctl.innerHTML = ''; ctl.append(slider({ id: id('m'), label: 'Mode', min: 1, max: N, step: 1, value: mode + 1, fmt: v => v === 1 ? '1 (centre of mass)' : v === 2 ? '2 (breathing)' : String(v), on: v => { mode = v - 1; text(); qs.inv(); qb.inv(); } })); };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, cb), h('div', { class: 'stack' }, cs, slider({ id: id('n'), label: 'Number of ions', min: 2, max: 14, step: 1, value: N, fmt: String, on: v => { N = v; setup(); } }), ctl, ro)));
        setup();
      }
    },
    ms: {
      title: 'The Mølmer–Sørensen gate in phase space',
      cap: 'The motion of the shared mode in phase space (position, momentum) for the three values of the collective spin S_x = X₁ + X₂: −2, 0 and +2. The spin-dependent force drives circles whose radius grows with |S_x|; S_x = 0 stays put. The gate time is fixed at the value that closes the loops for the nominal detuning. Detune the laser and the loops no longer close at the end of the gate: the spins stay entangled with the motion and the Bell-state fidelity drops, more so for a hotter chain.',
      build(body, id) {
        let ratio = 1, nbar = .5, prog = 1, playing = true, last = performance.now();
        const cv = canvas('sq', 'max-width:330px;margin:0 auto'), cf = canvas('', 'height:180px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const d0 = 1, eta = .5, tau = TAU / d0;
        const alpha = (s, t) => { const d = d0 * ratio, k = -s * eta / (2 * d); return [k * (Math.cos(d * t) - 1), k * Math.sin(d * t)]; };
        const phase = (s, t) => { const d = d0 * ratio; return s * s * (eta / 2) ** 2 / d * (t - Math.sin(d * t) / d); };
        /* |00⟩ = ½ Σ over the four X-basis states with S_x = +2, 0, 0, −2; fidelity with the ideal gate output, averaging over a thermal motional state */
        const fidelity = (r, nb) => {
          const o = ratio; ratio = r; const S_ = [2, 0, 0, -2], al = S_.map(s => alpha(s, tau)), ph = S_.map(s => phase(s, tau)); ratio = 1; const ph0 = S_.map(s => phase(s, tau)); ratio = o;
          let F = 0; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { const d = (ph[a] - ph0[a]) - (ph[b] - ph0[b]), da = Math.hypot(al[a][0] - al[b][0], al[a][1] - al[b][1]); F += Math.cos(d) * Math.exp(-da * da * (nb + .5)) / 16; }
          return { F, th: ph[0] - ph[1], res: Math.hypot(...al[0]) };
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w, H), sc = S / 2.6, cx = w / 2, cy = H / 2, t = prog * tau;
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - S / 2, cy); ctx.lineTo(cx + S / 2, cy); ctx.moveTo(cx, cy - S / 2); ctx.lineTo(cx, cy + S / 2); ctx.stroke();
          txt(ctx, 'position', cx + S / 2 - 4, cy + 10, { align: 'right', font: '500 10px "JetBrains Mono",monospace' }); txt(ctx, 'momentum', cx + 6, cy - S / 2 + 8, { align: 'left', font: '500 10px "JetBrains Mono",monospace' });
          [[2, T.copper], [-2, T.cyan]].forEach(([s, col]) => { const pts = []; for (let k = 0; k <= 120; k++) { const a = alpha(s, t * k / 120); pts.push([cx + a[0] * sc, cy - a[1] * sc]); } polyline(ctx, pts, col, 2.4); const a = alpha(s, t); dot(ctx, cx + a[0] * sc, cy - a[1] * sc, 6, col, T.surface); txt(ctx, `S_x = ${s > 0 ? '+' : MINUS}2`, cx + s * eta / 2 * sc, cy + (s > 0 ? 1 : -1) * (eta + .14) * sc, { font: '600 10.5px "JetBrains Mono",monospace', color: col }); });
          dot(ctx, cx, cy, 5, T.ink, T.surface); txt(ctx, 'S_x = 0', cx + 8, cy + 12, { align: 'left', font: '600 10px "JetBrains Mono",monospace' });
        });
        const q = painter(cf, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [.8, 1.2], y: [.5, 1], xt: [.8, .9, 1, 1.1, 1.2], yt: [.5, .75, 1], xl: 'detuning / nominal', yl: 'Bell fidelity' }); for (const [nb, col] of [[0, T.cyan], [2, T.copper], [10, T.muted]]) { const pts = []; for (let r = .8; r <= 1.2001; r += .004) pts.push([A.X(r), A.Y(clamp(fidelity(r, nb).F, .5, 1))]); polyline(ctx, pts, col, 2); } dot(ctx, A.X(ratio), A.Y(clamp(fidelity(ratio, nbar).F, .5, 1)), 6, T.ink, T.surface); });
        Scope.tick(now => { const dt = (now - last) / 1000; last = now; if (!playing) return; prog += dt / 2.2; if (prog > 1.25) prog = 0; p.inv(); });
        const text = () => { const f = fidelity(ratio, nbar); ro.innerHTML = `<span class="k">entangling phase </span>${num(f.th / PI, 3)}π <span class="k">(target 0.5π)</span><br><span class="k">residual displacement </span>${num(f.res, 3)}<br><span class="k">Bell-state fidelity </span>${num(f.F, 4)}`; };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, h('div', { class: 'btns' }, btn('Pause', e => { playing = !playing; e.target.textContent = playing ? 'Pause' : 'Play'; }, 'sm'))),
          h('div', { class: 'stack' }, cf, legendRow([['ground state (n̄ = 0)', 'var(--cyan)'], ['n̄ = 2', 'var(--copper)'], ['n̄ = 10', 'var(--muted)']]),
            slider({ id: id('r'), label: 'Laser detuning (relative to nominal)', min: .8, max: 1.2, step: .005, value: ratio, fmt: v => num(v, 3), on: v => { ratio = v; p.inv(); q.inv(); text(); } }),
            slider({ id: id('n'), label: 'Mean phonon number n̄', min: 0, max: 10, step: .5, value: nbar, fmt: v => num(v, 1), on: v => { nbar = v; q.inv(); text(); } }), ro)));
        text();
      }
    }
  },
  take: ['Trapped-ion qubits are internal levels of identical ions held in RF traps; coherence is long and readout and gates are very accurate.',
    'Ions in a chain share collective vibrational modes, which act as a bus giving all-to-all connectivity.',
    'The Mølmer–Sørensen gate drives a closed loop in phase space; the enclosed geometric phase gives exp(−iπ/4·X₁X₂), insensitive to the initial motional state.',
    'Gates are slow and long chains crowd their modes; the QCCD architecture shuttles ions between zones of a chip trap.'],
  quiz: QZ([
    ['What holds the ions in a trapped-ion computer?', ['Magnetic fields only', 'Oscillating radio-frequency electric fields in a Paul trap, in ultra-high vacuum', 'Optical tweezers', 'A superconducting circuit'], 1, 'Earnshaw’s theorem forbids static electric trapping, so an RF field creates an effective confining potential.'],
    ['Why is there no fabrication spread between trapped-ion qubits?', ['They are made very carefully', 'Every ion of the same isotope is identical by nature', 'They are calibrated once', 'They are classical'], 1, 'Unlike fabricated circuits, atoms of one isotope have identical energy levels.'],
    ['What provides connectivity between ions?', ['Wires', 'Shared collective vibrational modes of the ion chain', 'Microwave resonators', 'Photons in fibre only'], 1, 'Lasers couple each ion’s internal state to the shared motion, which couples any pair.'],
    ['What is the frequency of the second axial mode of an ion chain, relative to the centre-of-mass mode?', ['2', '√3 ≈ 1.73', '1', '√2'], 1, 'The breathing mode frequency is √3 times the trap frequency for any number of ions.'],
    ['In the Mølmer–Sørensen gate, what produces the entangling phase?', ['A direct spin–spin coupling', 'A geometric phase from a closed loop in the motion’s phase space, proportional to the enclosed area and to S_x²', 'Dephasing', 'Measurement'], 1, 'S_x² = 2 + 2X₁X₂, so the phase entangles the two spins.'],
    ['Why is the Mølmer–Sørensen gate insensitive to the ions’ temperature?', ['Ions are always in the ground state', 'When the phase-space loop closes, the motion returns exactly to its initial state whatever that state was', 'The laser cools the ions', 'It is not insensitive'], 1, 'A closed displacement loop multiplies any motional state by the same phase, leaving no spin–motion entanglement.'],
    ['In the lab, what happens when the detuning is wrong?', ['Nothing', 'The loops do not close at the end of the gate, leaving residual spin–motion entanglement and a wrong phase, which lowers fidelity, especially for hotter chains', 'The gate becomes faster', 'The ions are lost'], 1, 'Residual displacement decoheres the spins by an amount growing with the phonon number.'],
    ['Roughly how long does a trapped-ion two-qubit gate take?', ['Nanoseconds', 'Tens to hundreds of microseconds', 'Seconds', 'Picoseconds'], 1, 'Gates are limited by the motional frequencies, making them about a thousand times slower than superconducting gates.'],
    ['Why do long ion chains scale poorly?', ['They overheat instantly', 'Motional modes crowd together in frequency, making individual addressing and fast gates harder', 'Ions repel too little', 'Readout fails'], 1, 'Mode crowding and slower, more complex gates motivate breaking the system into smaller chains.'],
    ['What is the QCCD architecture?', ['A type of code', 'A chip trap with separate zones between which ions are shuttled, keeping chains short', 'A cooling method', 'A photonic interconnect'], 1, 'Proposed by Kielpinski, Monroe and Wineland, it is used in Quantinuum’s processors.']
  ])
});

/* ---------- neutral atoms: loading and rearrangement ---------- */
LESSONS.push({
  id: 'atoms', n: 19.2, stage: ST, minutes: 14, title: 'Neutral-atom arrays and Rydberg gates',
  lede: 'Hundreds to thousands of individual atoms, each held in a focused laser beam, can be arranged into any pattern and moved mid-computation. Briefly exciting them to giant Rydberg states makes them interact.',
  html: `
<h2>Optical tweezers</h2>
<p>A tightly focused laser beam attracts a cold atom to its focus, and a spatial light modulator or acousto-optic deflectors can make hundreds or thousands of such <strong>optical tweezers</strong> at once. Loading is random: from a cloud of laser-cooled atoms, each tweezer ends up with one atom only about half the time. The fix, demonstrated in 2016 by groups in Paris and Harvard, is to image the array, then use movable tweezers to drag atoms into a defect-free target pattern. Arrays of more than six thousand atoms have since been trapped.</p>
${LAB('sort')}
<h2>Rydberg blockade</h2>
<p>Ground-state atoms barely interact. Excited to a <strong>Rydberg state</strong>, with the outer electron in a huge orbit (principal quantum number 50 to 100), an atom interacts strongly with others several micrometres away. Within the <strong>blockade radius</strong> the interaction shifts the doubly excited state so far that two atoms cannot both be excited. Jaksch and colleagues showed in 2000 how this blockade gives a controlled-phase gate: a laser pulse that would excite both atoms instead picks up a phase that depends on whether the neighbour was excited. CZ gates with fidelities around 99.5% were reported in 2023, and parallel gates act on many pairs at once.</p>
<h2>Moving qubits mid-computation</h2>
<p>Because atoms can be transported while keeping their quantum state, connectivity is reconfigurable. Bluvstein and colleagues (2024) used this to shuttle whole blocks of atoms, run transversal gates on error-correcting codes, and operate up to 48 logical qubits, a demonstration of why non-local codes ([[L:codes]]) suit this platform. Rydberg arrays can also act as analog simulators, where the blockade naturally encodes problems such as maximum independent set.</p>
<h2>Challenges</h2>
<ul>
<li>Atom loss and the time needed to reload and rearrange limit repetition rates.</li>
<li>Rydberg states decay, and laser phase and intensity noise limit gate fidelity.</li>
<li>Readout by imaging is slow compared with superconducting readout, and mid-circuit measurement needs care not to disturb neighbouring atoms. Some atomic species allow errors to be converted into detectable erasures ([[L:erasure]]).</li>
</ul>
`,
  labs: {
    sort: {
      title: 'Load, image, rearrange',
      cap: 'Each site of a 12 × 12 tweezer grid loads an atom with the chosen probability. Rearrange assigns atoms to the central target block, greedily pairing the closest atoms and empty target sites, and moves them in parallel; leftover atoms are discarded. With the target filled, the circles show the Rydberg blockade radius for the atom under the pointer, and lines join every pair close enough to be blockaded.',
      build(body, id) {
        const G = 12; let pLoad = .5, tgtSize = 7, atoms = [], anim = 0, phase = 'loaded', Rb = 1.6, hover = null;
        const cv = canvas('sq', 'max-width:420px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), st = h('div', { class: 'status' });
        const target = () => { const o = Math.floor((G - tgtSize) / 2), t = []; for (let y = o; y < o + tgtSize; y++) for (let x = o; x < o + tgtSize; x++) t.push([x, y]); return t; };
        const load = () => { atoms = []; for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) if (Math.random() < pLoad) atoms.push({ x0: x, y0: y, x1: x, y1: y, keep: true }); phase = 'loaded'; anim = 0; text(); p.inv(); };
        const sort = () => {
          const T = target(); if (atoms.length < T.length) { st.className = 'status'; st.textContent = `Only ${atoms.length} atoms loaded; ${T.length} are needed. Load again.`; return; }
          const pairs = []; atoms.forEach((a, i) => T.forEach((t, j) => pairs.push([Math.hypot(a.x0 - t[0], a.y0 - t[1]), i, j]))); pairs.sort((a, b) => a[0] - b[0]);
          const ua = new Set(), ut = new Set(); for (const [, i, j] of pairs) { if (ua.has(i) || ut.has(j)) continue; ua.add(i); ut.add(j); atoms[i].x1 = T[j][0]; atoms[i].y1 = T[j][1]; if (ut.size === T.length) break; }
          atoms.forEach((a, i) => { a.keep = ua.has(i); }); phase = 'moving'; anim = 0; text();
        };
        Scope.tick(() => { if (phase !== 'moving') return; anim = Math.min(1, anim + (reduced() ? 1 : .012)); if (anim >= 1) { phase = 'sorted'; text(); } p.inv(); });
        const geo = (w, H) => { const S = Math.min(w, H), cs = S / G, ox = (w - S) / 2; return { cs, X: x => ox + (x + .5) * cs, Y: y => (y + .5) * cs }; };
        const pos = a => { const e = ease(anim); return phase === 'loaded' ? [a.x0, a.y0] : [lerp(a.x0, a.x1, a.keep ? e : 0), lerp(a.y0, a.y1, a.keep ? e : 0)]; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), { cs, X, Y } = geo(w, H), tg = target();
          for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) { ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X(x), Y(y), cs * .28, 0, TAU); ctx.stroke(); }
          ctx.strokeStyle = T.copper; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); const o = tg[0]; ctx.strokeRect(X(o[0]) - cs / 2 + 2, Y(o[1]) - cs / 2 + 2, cs * tgtSize - 4, cs * tgtSize - 4); ctx.setLineDash([]);
          if (phase === 'sorted') {
            const kept = atoms.filter(a => a.keep);
            ctx.strokeStyle = rgba(T.cyan, .5); ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < kept.length; i++) for (let j = i + 1; j < kept.length; j++) { const d = Math.hypot(kept[i].x1 - kept[j].x1, kept[i].y1 - kept[j].y1); if (d <= Rb + 1e-9) { ctx.moveTo(X(kept[i].x1), Y(kept[i].y1)); ctx.lineTo(X(kept[j].x1), Y(kept[j].y1)); } } ctx.stroke();
            if (hover) { ctx.fillStyle = rgba(T.copper, .12); ctx.strokeStyle = T.copper; ctx.beginPath(); ctx.arc(X(hover[0]), Y(hover[1]), Rb * cs, 0, TAU); ctx.fill(); ctx.stroke(); }
          }
          atoms.forEach(a => { if (phase === 'sorted' && !a.keep) return; const [x, y] = pos(a), fade = phase === 'moving' && !a.keep ? 1 - anim : 1; ctx.globalAlpha = fade; dot(ctx, X(x), Y(y), cs * .22, a.keep || phase === 'loaded' ? T.ink : T.muted); ctx.globalAlpha = 1; });
        });
        cv.addEventListener('pointermove', e => { if (phase !== 'sorted') return; const r = cv.getBoundingClientRect(), { cs, X, Y } = geo(r.width, r.height); const gx = Math.round((e.clientX - r.left - X(0)) / cs), gy = Math.round((e.clientY - r.top - Y(0)) / cs); hover = gx >= 0 && gy >= 0 && gx < G && gy < G ? [gx, gy] : null; p.inv(); });
        const text = () => { const n = atoms.length, need = tgtSize * tgtSize, moved = atoms.filter(a => a.keep).reduce((s, a) => s + Math.hypot(a.x1 - a.x0, a.y1 - a.y0), 0); st.className = phase === 'sorted' ? 'status good' : 'status'; st.textContent = phase === 'loaded' ? `Loaded ${n} of ${G * G} sites. Press Rearrange.` : phase === 'moving' ? 'Moving atoms…' : `Defect-free ${tgtSize} × ${tgtSize} array ready.`; ro.innerHTML = `<span class="k">chance of a defect-free target by loading alone </span>${sci(Math.pow(pLoad, need))}<br><span class="k">atoms needed / loaded </span>${need} / ${n}<br><span class="k">total distance moved </span>${num(moved, 1)} sites`; };
        body.append(h('div', { class: 'btns' }, btn('Load', load), btn('Rearrange', sort, 'pri')),
          h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, st,
            slider({ id: id('p'), label: 'Loading probability per site', min: .3, max: .9, step: .05, value: pLoad, fmt: v => pct(v, 0), on: v => { pLoad = v; load(); } }),
            slider({ id: id('t'), label: 'Target block size', min: 4, max: 9, step: 1, value: tgtSize, fmt: v => `${v} × ${v}`, on: v => { tgtSize = v; load(); } }),
            slider({ id: id('r'), label: 'Blockade radius (site spacings)', min: .8, max: 3, step: .1, value: Rb, fmt: v => num(v, 1), on: v => { Rb = v; p.inv(); } }), ro)));
        load();
      }
    }
  },
  take: ['Neutral-atom processors hold single atoms in arrays of optical tweezers; random loading is fixed by imaging and rearranging atoms into defect-free patterns.',
    'Exciting atoms to Rydberg states creates strong interactions; the blockade forbids double excitation within a radius and yields CZ gates.',
    'Atoms can be moved mid-computation, giving reconfigurable connectivity that suits transversal gates and qLDPC codes.',
    'Atom loss, slow imaging and Rydberg decay are the main challenges; some species allow erasure conversion.'],
  quiz: QZ([
    ['What traps individual neutral atoms in these processors?', ['RF electric fields', 'Tightly focused laser beams, called optical tweezers', 'Magnetic bottles only', 'Superconducting loops'], 1, 'Atoms are attracted to the intensity maximum of a red-detuned focused beam.'],
    ['Why must atoms be rearranged after loading?', ['They are too hot', 'Each tweezer loads an atom only about half the time, randomly, so arrays have defects', 'They are in the wrong state', 'They drift away immediately'], 1, 'Imaging reveals which sites are filled, and movable tweezers fill the target pattern.'],
    ['Without rearrangement, roughly what is the chance that all 49 sites of a 7 × 7 block load with p = 0.5?', ['About 50%', 'About 2 × 10⁻¹⁵', 'About 1%', 'About 10⁻³'], 1, '0.5⁴⁹ ≈ 1.8 × 10⁻¹⁵, which is why rearrangement was essential for scaling.'],
    ['What is a Rydberg state?', ['The ground state', 'A highly excited state with the outer electron in a very large orbit, giving strong long-range interactions', 'An ionized atom', 'A nuclear spin state'], 1, 'Rydberg atoms have huge dipole moments and interact over micrometres.'],
    ['What does the Rydberg blockade do?', ['Speeds up readout', 'Prevents two atoms within the blockade radius from both being excited', 'Cools the atoms', 'Stops the lasers'], 1, 'The interaction shifts the doubly excited state out of resonance with the laser.'],
    ['How does the blockade give a two-qubit gate?', ['By measurement', 'A pulse sequence picks up a phase that depends on whether the neighbour is excited, producing a controlled-phase (CZ) gate', 'By swapping atoms', 'It cannot'], 1, 'Jaksch and colleagues proposed this conditional-phase mechanism in 2000.'],
    ['What advantage does atom transport bring?', ['Faster gates', 'Reconfigurable, long-range connectivity during a computation', 'Lower temperatures', 'No need for lasers'], 1, 'Moving atoms lets any qubit meet any other, useful for transversal gates and non-local codes.'],
    ['What did Bluvstein and colleagues demonstrate in 2024?', ['Shor’s algorithm on RSA-2048', 'A neutral-atom processor operating up to 48 logical qubits using transport and transversal gates', 'Room-temperature qubits', 'A 1,000-qubit superconducting chip'], 1, 'The experiment highlighted the value of reconfigurable connectivity for error correction.'],
    ['Which problem do Rydberg arrays encode naturally as analog simulators?', ['Factoring', 'Maximum independent set, because blockaded atoms cannot be excited together', 'Sorting', 'Linear regression'], 1, 'Excited atoms form an independent set of the blockade graph.'],
    ['Which is a main challenge for neutral atoms?', ['Atoms are not identical', 'Atom loss, slow imaging and reloading, and decay of Rydberg states', 'They need millikelvin refrigerators', 'They cannot be entangled'], 1, 'Repetition rate and error from finite Rydberg lifetimes are active research areas.']
  ])
});

/* ---------- photonics: Hong–Ou–Mandel ---------- */
LESSONS.push({
  id: 'photonic', n: 19.3, stage: ST, minutes: 14, title: 'Photonic quantum computing',
  lede: 'Photons barely interact with anything, which keeps them coherent at room temperature and makes them perfect messengers. It also makes them hard to entangle on demand, and every photonic architecture is a clever way around that.',
  html: `
<h2>Qubits of light</h2>
<p>A photon can carry a qubit in its polarization, in which of two waveguides it travels (dual-rail encoding), or in its arrival time. Beam splitters and phase shifters perform any single-qubit gate, photons travel through chips and fibres with little decoherence, and the hardware can run at room temperature apart from the detectors and some sources. The catch is the two-qubit gate: photons do not interact, and optical nonlinearities at the single-photon level are far too weak.</p>
<h2>Interference instead of interaction</h2>
<p>The key resource is quantum interference between identical photons. In the <strong>Hong–Ou–Mandel effect</strong> (1987), two indistinguishable photons entering a 50:50 beam splitter from opposite sides always leave together. The two ways of getting one photon at each output, both reflected or both transmitted, have opposite signs and cancel. If the photons are made distinguishable, by delay, polarization or colour, the cancellation fails and coincidences return.</p>
${LAB('hom')}
<p>Knill, Laflamme and Milburn (KLM, 2001) showed that linear optics, single-photon sources, detectors and feed-forward suffice for universal quantum computing: entangling gates succeed probabilistically, heralded by detector clicks, and teleportation makes them near-deterministic at a large overhead. Modern designs build large entangled <strong>cluster states</strong> instead and compute by measuring them (measurement-based quantum computing). In <strong>fusion-based</strong> quantum computing (Bartolucci and colleagues, 2023), small entangled resource states from many sources are joined by probabilistic two-photon “fusion” measurements into a fault-tolerant network. Computing by measuring cluster states is covered in [[L:mbqc]].</p>
<h2>Where photonics stands</h2>
<ul>
<li><strong>Sampling experiments.</strong> Gaussian boson sampling with dozens to over a hundred detected photons (Jiuzhang, 2020; Borealis, 2022) produced some of the first claims of quantum computational advantage ([[L:advantage]]).</li>
<li><strong>Loss</strong> is the dominant error: every photon lost in a waveguide, fibre or detector is an erasure. Fault-tolerant designs must keep total loss per photon to a few percent.</li>
<li><strong>Sources</strong> must emit identical photons on demand. Probabilistic sources are multiplexed; quantum dots emit single photons deterministically but must be made identical.</li>
<li><strong>Bosonic encodings</strong> such as GKP states ([[L:bosonic]]) are pursued for continuous-variable photonic machines, and photons are the natural carrier for quantum networks between all other platforms ([[L:swapping]]).</li>
</ul>
`,
  labs: {
    hom: {
      title: 'Two photons, one beam splitter',
      cap: 'Two single photons arrive at a beam splitter from opposite sides with a relative delay, in units of the photon coherence time. The chart is the probability of a coincidence (one photon in each output detector), P = R² + T² − 2RT·|overlap|², where the overlap falls with delay and polarization mismatch. At zero delay, identical photons and a 50:50 splitter, coincidences vanish: the Hong–Ou–Mandel dip. The animation sends photon pairs and counts outcomes.',
      build(body, id) {
        let delay = 0, R = .5, pol = 0, counts = { co: 0, bunch: 0 }, flight = null, timer = 0;
        const cv = canvas('', 'height:220px'), cd = canvas('', 'height:220px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const ov2 = (d, pl) => Math.exp(-d * d) * Math.cos(pl) ** 2, Pc = (d, r, pl) => r * r + (1 - r) * (1 - r) - 2 * r * (1 - r) * ov2(d, pl);
        const q = painter(cd, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [-3, 3], y: [0, 1], xt: [-3, -2, -1, 0, 1, 2, 3], yt: [0, .25, .5, .75, 1], xl: 'delay / coherence time', yl: 'coincidence probability' }); const pts = []; for (let d = -3; d <= 3.0001; d += .03) pts.push([A.X(d), A.Y(Pc(d, R, pol))]); polyline(ctx, pts, T.cyan, 2.4); ctx.setLineDash([4, 3]); ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.moveTo(A.L, A.Y(R * R + (1 - R) ** 2)); ctx.lineTo(A.R, A.Y(R * R + (1 - R) ** 2)); ctx.stroke(); ctx.setLineDash([]); txt(ctx, 'distinguishable photons', A.R - 4, A.Y(R * R + (1 - R) ** 2) - 9, { align: 'right', font: '500 10px "JetBrains Mono",monospace' }); dot(ctx, A.X(delay), A.Y(Pc(delay, R, pol)), 6, T.copper, T.surface); });
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), cx = w / 2, cy = H / 2, L = Math.min(w, H * 1.6) * .42;
          ctx.strokeStyle = T.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - L, cy - L * .45); ctx.lineTo(cx + L, cy + L * .45); ctx.moveTo(cx - L, cy + L * .45); ctx.lineTo(cx + L, cy - L * .45); ctx.stroke();
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(PI / 4); ctx.fillStyle = rgba(T.cyan, .35); ctx.strokeStyle = T.cyan; ctx.fillRect(-18, -3, 36, 6); ctx.strokeRect(-18, -3, 36, 6); ctx.restore();
          for (const [x, y, nm, k] of [[cx + L, cy - L * .45, 'D₁', 'a'], [cx + L, cy + L * .45, 'D₂', 'b']]) { ctx.fillStyle = flight && flight.done && flight.out.includes(k) ? T.copper : T.surface2; ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 12, -PI / 2, PI / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); txt(ctx, nm, x + 22, y, { font: '600 11px "JetBrains Mono",monospace', color: T.ink }); }
          if (flight) { const t = flight.t; const sp = (from, to, tt) => [lerp(from[0], to[0], tt), lerp(from[1], to[1], tt)], inA = [cx - L, cy - L * .45], inB = [cx - L, cy + L * .45], c0 = [cx, cy], oA = [cx + L, cy - L * .45], oB = [cx + L, cy + L * .45];
            const ph = (tt, lag) => { const u = tt - lag; return u; };
            [[inA, 0], [inB, delay * .12]].forEach(([src, lag], k) => { const u = clamp(ph(t, lag), 0, 2); if (u <= 0) return; let pt; if (u < 1) pt = sp(src, c0, u); else { const dest = flight.out[k] === 'a' ? oA : oB; pt = sp(c0, dest, Math.min(1, u - 1)); } dot(ctx, pt[0], pt[1], 6, k ? T.cyan : T.copper, T.surface); }); }
          txt(ctx, `coincidences ${counts.co}   both in one detector ${counts.bunch}`, cx, H - 8, { font: '500 11px "JetBrains Mono",monospace' });
        });
        Scope.tick(() => { timer++; if (!flight || flight.t > 2.4) { if (flight && !flight.counted) { flight.counted = true; } const co = Math.random() < Pc(delay, R, pol); let out; if (co) out = Math.random() < .5 ? ['a', 'b'] : ['b', 'a']; else out = Math.random() < .5 ? ['a', 'a'] : ['b', 'b']; flight = { t: 0, out, done: false, co }; }
          flight.t += reduced() ? 2.5 : .04; if (flight.t > 2 && !flight.done) { flight.done = true; flight.co ? counts.co++ : counts.bunch++; text(); } p.inv(); });
        const text = () => { const tot = counts.co + counts.bunch; ro.innerHTML = `<span class="k">predicted coincidence probability </span>${pct(Pc(delay, R, pol), 1)}<br><span class="k">observed </span>${tot ? pct(counts.co / tot, 1) : '—'} of ${tot} pairs<br><span class="k">visibility of the dip </span>${pct(2 * R * (1 - R) * Math.cos(pol) ** 2 / (R * R + (1 - R) ** 2), 0)}`; };
        const reset = () => { counts = { co: 0, bunch: 0 }; text(); q.inv(); };
        body.append(h('div', { class: 'split' }, cv, cd), h('div', { class: 'split' }, h('div', { class: 'stack' },
          slider({ id: id('d'), label: 'Delay between photons', min: -3, max: 3, step: .05, value: delay, fmt: v => num(v, 2), on: v => { delay = v; reset(); } }),
          slider({ id: id('r'), label: 'Beam-splitter reflectivity R', min: .1, max: .9, step: .01, value: R, fmt: v => pct(v, 0), on: v => { R = v; reset(); } }),
          slider({ id: id('p'), label: 'Polarization mismatch', min: 0, max: PI / 2, step: .01, value: pol, fmt: v => num(deg(v), 0) + '°', on: v => { pol = v; reset(); } })), ro));
        text();
      }
    }
  },
  take: ['Photonic qubits are encoded in polarization, path or time; single-qubit gates are easy and photons stay coherent at room temperature.',
    'Photons do not interact, so entangling operations rely on interference, measurement and feed-forward (KLM), cluster states or fusion.',
    'Hong–Ou–Mandel interference makes identical photons on a 50:50 beam splitter always exit together; distinguishability destroys the effect.',
    'Loss is the dominant error and identical on-demand sources are essential; photons are also the natural carrier for quantum networks.'],
  quiz: QZ([
    ['Why are single-qubit gates easy for photonic qubits?', ['Photons are slow', 'Beam splitters and phase shifters implement any single-qubit operation on path or polarization qubits', 'Photons need no gates', 'They use microwaves'], 1, 'Linear optical elements act as rotations on a photon’s modes.'],
    ['What makes two-qubit gates hard for photons?', ['Photons decay quickly', 'Photons essentially do not interact, and single-photon nonlinearities are extremely weak', 'Photons are too hot', 'They need superconductors'], 1, 'Without interaction, entanglement must come from interference and measurement.'],
    ['In the Hong–Ou–Mandel effect, what happens to two identical photons on a 50:50 beam splitter?', ['They always exit separately', 'They always exit together through the same port', 'They are absorbed', 'One is reflected and one transmitted with certainty'], 1, 'The two paths to separate outputs cancel by destructive interference.'],
    ['What restores coincidences in the HOM experiment?', ['A brighter laser', 'Making the photons distinguishable, by delay, polarization or wavelength', 'Cooling the beam splitter', 'Nothing can'], 1, 'Distinguishable photons do not interfere, so the cancellation fails.'],
    ['For distinguishable photons on a 50:50 splitter, what is the coincidence probability?', ['0', '½', '1', '¼'], 1, 'Each photon independently goes either way: R² + T² = ½ with R = T = ½.'],
    ['What did the KLM scheme show?', ['Photons cannot compute', 'Linear optics with single-photon sources, detectors and feed-forward suffice for universal quantum computing', 'Nonlinear crystals are required', 'Photons must be stored in memories'], 1, 'Probabilistic heralded gates plus teleportation give scalable, if resource-hungry, universality.'],
    ['What is fusion-based quantum computing?', ['Nuclear fusion', 'Joining small entangled resource states with probabilistic two-photon fusion measurements into a fault-tolerant network', 'Merging two chips', 'A classical algorithm'], 1, 'It avoids building one giant cluster state up front.'],
    ['What is the dominant error in photonic quantum computing?', ['Bit flips', 'Photon loss, which acts as an erasure', 'Leakage to |2⟩', 'Crosstalk between ions'], 1, 'Every component loses some light, and loss budgets drive photonic architectures.'],
    ['Which photonic experiments gave early claims of quantum advantage?', ['Shor’s algorithm', 'Gaussian boson sampling, such as Jiuzhang and Borealis', 'Grover search', 'Quantum annealing'], 1, 'Sampling from many-photon interference is believed hard to simulate classically.'],
    ['Why are photons important even for other platforms?', ['They cool qubits', 'They carry quantum information between distant processors in quantum networks', 'They store qubits for years', 'They replace error correction'], 1, 'Photons travel through fibre and free space with little decoherence.']
  ])
});

/* ---------- silicon spin qubits: double-dot charge stability diagram ---------- */
LESSONS.push({
  id: 'spins', n: 19.4, stage: ST, minutes: 14, title: 'Spin qubits in silicon',
  lede: 'A single electron trapped in a quantum dot on a silicon chip is one of the smallest qubits there is, and it can be made with the same factories that make computer processors. Getting each electron in place is the first challenge.',
  html: `
<h2>One electron, one spin</h2>
<p>Loss and DiVincenzo proposed in 1998 using the spin of a single electron, confined in a semiconductor <strong>quantum dot</strong>, as a qubit. In silicon, gate electrodes a few tens of nanometres wide shape the electric potential to trap single electrons (or holes) under them. A magnetic field splits spin up and down by a frequency of order 10 to 40 GHz; microwaves rotate the spin directly or through a micromagnet that lets an oscillating electric field drive it (EDSR).</p>
<p>Silicon is a quiet host: its most common isotope, silicon-28, has no nuclear spin, and isotopically purified material removes most magnetic noise. Single-qubit fidelities above 99.9% and two-qubit fidelities above 99% were reported in 2022 by several groups.</p>
<h2>Filling the dots</h2>
<p>Each dot must hold exactly the right number of electrons. Sweeping two plunger-gate voltages and watching a nearby charge sensor produces a <strong>charge stability diagram</strong>: regions of fixed occupation ${m('(n₁, n₂)')} separated by lines where an electron enters or leaves. With no coupling between dots the regions form a square grid; capacitive coupling turns it into the honeycomb shown in the lab, with <strong>triple points</strong> where three charge states meet.</p>
${LAB('honey')}
<h2>Two-qubit gates and readout</h2>
<p>When neighbouring dots are tuned so their electrons’ wavefunctions overlap, the <strong>exchange interaction</strong> ${m('J S₁·S₂')} couples the spins. A barrier gate between the dots turns ${m('J')} on and off by orders of magnitude, giving SWAP-type and CZ gates in tens to hundreds of nanoseconds. Readout usually converts spin into charge: in <strong>Pauli spin blockade</strong>, an electron can tunnel from the (1,1) to the (0,2) charge state only if the two spins form a singlet, and the charge sensor sees whether it moved.</p>
<h2>The appeal and the obstacles</h2>
<ul>
<li><strong>Density and manufacturing.</strong> Qubits are about 100 nm apart, so millions could fit on a chip, and devices are now made on 300 mm wafers in industrial foundries; Intel’s 12-dot Tunnel Falls chip appeared in 2023.</li>
<li><strong>Warmer operation.</strong> Spin qubits have been operated above 1 K, where cooling power is far larger, easing integration with control electronics.</li>
<li><strong>Variability and noise.</strong> No two dots are identical, so every one must be tuned, and charge noise in the oxide shifts their frequencies. Wiring very dense arrays is an unsolved engineering problem.</li>
</ul>
`,
  labs: {
    honey: {
      title: 'The honeycomb of a double quantum dot',
      cap: 'In the constant-interaction model the energy of occupation (n₁, n₂) is ½E_C n₁² + ½E_C n₂² + E_m n₁n₂ − n₁V₁′ − n₂V₂′, where the effective gate voltages include cross-coupling of each gate to the other dot. The colour shows the lowest-energy occupation for every pair of plunger voltages. With zero mutual charging energy E_m the regions form squares; as E_m grows the vertices split into pairs of triple points and the cells become hexagons; near E_m = E_C the two dots behave like one. Hover to read the occupation.',
      build(body, id) {
        let em = .35, cross = .15, hov = null;
        const G = 160, cv = canvas('sq', 'max-width:420px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const occ = (V1, V2) => { const a = V1 + cross * V2, b = V2 + cross * V1; let best = [0, 0], be = Infinity; for (let n1 = 0; n1 <= 4; n1++) for (let n2 = 0; n2 <= 4; n2++) { const E = .5 * n1 * n1 + .5 * n2 * n2 + em * n1 * n2 - n1 * a - n2 * b; if (E < be - 1e-12) { be = E; best = [n1, n2]; } } return best; };
        const VM = 3.6;
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w, H) - 36, ox = (w - S) / 2 + 14, oy = 4, grid = [];
          for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) grid.push(occ(VM * i / (G - 1), VM * (1 - j / (G - 1))));
          const img = heatImage(G, G, (i, j) => { const [a, b] = grid[j * G + i], t = ((a + b) % 2 ? .35 : 0) + a * .12; return mixRGB(T.surface2, (a + b) % 2 ? T.cyan : T.copper, Math.min(.85, .25 + .12 * (a + b))); });
          drawHeat(ctx, img, ox, oy, S, S, false);
          ctx.strokeStyle = T.ink; ctx.lineWidth = 1.2; ctx.globalAlpha = .7; ctx.beginPath();
          for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const c3 = grid[j * G + i], cs = S / G; if (i < G - 1) { const r = grid[j * G + i + 1]; if (r[0] !== c3[0] || r[1] !== c3[1]) { ctx.moveTo(ox + (i + 1) * cs, oy + j * cs); ctx.lineTo(ox + (i + 1) * cs, oy + (j + 1) * cs); } } if (j < G - 1) { const d = grid[(j + 1) * G + i]; if (d[0] !== c3[0] || d[1] !== c3[1]) { ctx.moveTo(ox + i * cs, oy + (j + 1) * cs); ctx.lineTo(ox + (i + 1) * cs, oy + (j + 1) * cs); } } }
          ctx.stroke(); ctx.globalAlpha = 1;
          const seen = new Set(); for (let j = 4; j < G; j += 6) for (let i = 4; i < G; i += 6) { const c3 = grid[j * G + i], k = c3.join(','); if (seen.has(k)) continue; let sx = 0, sy = 0, n = 0; for (let jj = 0; jj < G; jj += 2) for (let ii = 0; ii < G; ii += 2) { const d = grid[jj * G + ii]; if (d[0] === c3[0] && d[1] === c3[1]) { sx += ii; sy += jj; n++; } } if (n < 40) continue; seen.add(k); txt(ctx, `(${c3[0]},${c3[1]})`, ox + sx / n * S / G, oy + sy / n * S / G, { font: '600 11px "JetBrains Mono",monospace', color: T.ink }); }
          txt(ctx, 'plunger voltage V₁ →', ox + S, oy + S + 14, { align: 'right', font: '600 10.5px "JetBrains Mono",monospace' });
          ctx.save(); ctx.translate(ox - 10, oy); ctx.rotate(-PI / 2); txt(ctx, '← plunger voltage V₂', 0, 0, { align: 'right', font: '600 10.5px "JetBrains Mono",monospace' }); ctx.restore();
          if (hov) { dot(ctx, ox + hov[0] / VM * S, oy + (1 - hov[1] / VM) * S, 5, T.ink, T.surface); }
          p.geo = { ox, oy, S };
        });
        cv.addEventListener('pointermove', e => { if (!p.geo) return; const r = cv.getBoundingClientRect(), { ox, oy, S } = p.geo, x = (e.clientX - r.left - ox) / S, y = (e.clientY - r.top - oy) / S; if (x < 0 || x > 1 || y < 0 || y > 1) return; hov = [x * VM, (1 - y) * VM]; p.inv(); text(); });
        const text = () => { const o = hov ? occ(hov[0], hov[1]) : null; ro.innerHTML = `<span class="k">mutual charging energy E_m / E_C </span>${num(em, 2)}<br><span class="k">gate cross-coupling </span>${num(cross, 2)}<br>${o ? `<span class="k">occupation at pointer </span>(${o[0]}, ${o[1]}) electrons` : '<span class="k">hover over the diagram</span>'}`; };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' },
          slider({ id: id('m'), label: 'Mutual charging energy E_m / E_C', min: 0, max: .9, step: .01, value: em, fmt: v => num(v, 2), on: v => { em = v; p.inv(); text(); } }),
          slider({ id: id('c'), label: 'Gate cross-coupling', min: 0, max: .5, step: .01, value: cross, fmt: v => num(v, 2), on: v => { cross = v; p.inv(); text(); } }), ro)));
        text();
      }
    }
  },
  take: ['A spin qubit is the spin of a single electron or hole in a gate-defined quantum dot; isotopically purified silicon-28 gives a magnetically quiet host.',
    'Charge stability diagrams map dot occupations against gate voltages; capacitive coupling turns square cells into a honeycomb with triple points.',
    'Exchange between neighbouring dots, switched by a barrier gate, gives two-qubit gates; Pauli spin blockade converts spin into a measurable charge signal.',
    'Spin qubits are tiny, foundry-compatible and can run above 1 K, but dot variability, charge noise and dense wiring are major hurdles.'],
  quiz: QZ([
    ['What physical system is a silicon spin qubit?', ['A superconducting loop', 'The spin of a single electron or hole confined in a gate-defined quantum dot', 'A trapped ion', 'A photon in a waveguide'], 1, 'Loss and DiVincenzo proposed this in 1998.'],
    ['Why is isotopically purified silicon-28 used?', ['It conducts better', 'It has no nuclear spin, removing a major source of magnetic noise', 'It is cheaper', 'It superconducts'], 1, 'Natural silicon contains about 4.7% silicon-29, whose nuclear spins cause dephasing.'],
    ['What does a charge stability diagram show?', ['Qubit frequencies', 'Which electron occupation (n₁, n₂) is stable for each pair of gate voltages', 'Gate fidelities', 'Temperature'], 1, 'Boundaries mark where an electron enters, leaves or moves between dots.'],
    ['What turns the square grid of a stability diagram into a honeycomb?', ['Magnetic field', 'Capacitive (mutual charging) coupling between the two dots', 'Spin–orbit coupling', 'Temperature'], 1, 'With E_m > 0 each crossing splits into two triple points joined by an interdot line.'],
    ['What are triple points?', ['Points with three electrons', 'Points where three charge states are degenerate, so electrons can flow through both dots', 'Defects in silicon', 'Readout errors'], 1, 'At a triple point current can pass sequentially through the double dot.'],
    ['How are two spin qubits usually entangled?', ['By photons', 'Through the exchange interaction, switched by a barrier gate that controls wavefunction overlap', 'By shuttling ions', 'Through a resonator only'], 1, 'Exchange J S₁·S₂ can be varied over orders of magnitude with gate voltages.'],
    ['What is Pauli spin blockade?', ['A gate error', 'A readout mechanism: tunnelling from (1,1) to (0,2) is allowed only for a spin singlet, converting spin into charge', 'A type of code', 'Leakage'], 1, 'The charge sensor detects whether the electron moved, revealing the spin state.'],
    ['Why is manufacturability a selling point for spin qubits?', ['They need no fabrication', 'They can be made in industrial CMOS foundries on 300 mm wafers, with qubits about 100 nm apart', 'They are naturally identical', 'They are made of light'], 1, 'Dense, foundry-made qubits could scale to large numbers if control can keep up.'],
    ['Why is operating above 1 K useful?', ['Qubits become faster', 'Refrigerators have far more cooling power there, easing integration with control electronics', 'It removes all noise', 'It is required for readout'], 1, 'Dilution refrigerators have microwatts of cooling at 10 mK but much more at 1 K.'],
    ['What is a major obstacle for spin qubits?', ['They cannot be read out', 'Dot-to-dot variability that requires tuning each qubit, charge noise, and wiring dense arrays', 'They decohere in nanoseconds', 'They need vacuum chambers'], 1, 'Automated tuning and on-chip control are active research directions.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Paul trap', 'A trap that confines charged particles with oscillating radio-frequency electric fields.', 'ions'],
  ['Mølmer–Sørensen gate', 'A trapped-ion entangling gate in which a spin-dependent force drives the shared motion around a closed phase-space loop, leaving a geometric phase.', 'ions'],
  ['QCCD architecture', 'Quantum charge-coupled device: a trapped-ion design with separate zones between which ions are shuttled.', 'ions'],
  ['Optical tweezer', 'A tightly focused laser beam that traps a single neutral atom at its focus.', 'atoms'],
  ['Rydberg blockade', 'The suppression of simultaneous excitation of two nearby atoms to Rydberg states by their strong interaction.', 'atoms'],
  ['Hong–Ou–Mandel effect', 'Two identical photons entering a 50:50 beam splitter from different sides always leave through the same output.', 'photonic'],
  ['KLM scheme', 'Knill–Laflamme–Milburn: universal quantum computing with linear optics, single photons, detectors and feed-forward.', 'photonic'],
  ['Fusion-based quantum computing', 'A photonic architecture that joins small entangled resource states with probabilistic two-photon fusion measurements.', 'photonic'],
  ['Quantum dot', 'A nanoscale region of a semiconductor that confines a small, controllable number of electrons or holes.', 'spins'],
  ['Charge stability diagram', 'A map of a quantum-dot device’s electron occupation against gate voltages.', 'spins'],
  ['Pauli spin blockade', 'A spin-to-charge conversion: an electron can tunnel into an already occupied dot only if the two spins form a singlet.', 'spins']
);
})();
