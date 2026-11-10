/* =====================================================================
   Research track · compilers and architecture:
   pulse-level control (leakage and DRAG), randomized compiling
   ===================================================================== */
(() => {
const CMP = 8;

/* ---------- three-level transmon driven in the qubit's rotating frame ----------
   H = α|2⟩⟨2| + (Ωx/2)(a + a†) + (Ωy/2)(i a† − i a),  a = |0⟩⟨1| + √2 |1⟩⟨2|,  times in ns, rates in rad/ns */
function pulseShape(tau, alpha, beta, shape) {
  if (shape === 'square') { const a = PI / tau; return { ox: () => a, oy: () => 0 }; }
  const sig = tau / 4, t0 = tau / 2, g = t => Math.exp(-((t - t0) ** 2) / (2 * sig * sig)), off = g(0);
  let area = 0; const K = 600; for (let k = 0; k < K; k++) area += (g((k + .5) * tau / K) - off) * tau / K;
  const amp = PI / area;
  return { ox: t => amp * (g(t) - off), oy: t => beta * amp * ((t - t0) / (sig * sig)) * g(t) / alpha };
}
function transmonRun(tau, alpha, beta, shape, rec, dtMax = .004) {
  const P = pulseShape(tau, alpha, beta, shape), n = Math.max(240, Math.ceil(tau / dtMax)), dt = tau / n, r2 = Math.SQRT2;
  const s = new Float64Array([1, 0, 0, 0, 0, 0]), k1 = new Float64Array(6), k2 = new Float64Array(6), k3 = new Float64Array(6), k4 = new Float64Array(6), tmp = new Float64Array(6);
  const f = (t, x, d) => {
    const u = P.ox(t) / 2, v = P.oy(t) / 2;
    const h0r = u * x[2] + v * x[3], h0i = u * x[3] - v * x[2];
    const h1r = u * x[0] - v * x[1] + r2 * (u * x[4] + v * x[5]), h1i = u * x[1] + v * x[0] + r2 * (u * x[5] - v * x[4]);
    const h2r = r2 * (u * x[2] - v * x[3]) + alpha * x[4], h2i = r2 * (u * x[3] + v * x[2]) + alpha * x[5];
    d[0] = h0i; d[1] = -h0r; d[2] = h1i; d[3] = -h1r; d[4] = h2i; d[5] = -h2r;
  };
  const out = rec ? { t: [0], p: [[1, 0, 0]] } : null, every = rec ? Math.max(1, Math.round(n / rec)) : 0;
  let maxP2 = 0, t = 0;
  for (let k = 0; k < n; k++) {
    f(t, s, k1); for (let i = 0; i < 6; i++) tmp[i] = s[i] + dt / 2 * k1[i];
    f(t + dt / 2, tmp, k2); for (let i = 0; i < 6; i++) tmp[i] = s[i] + dt / 2 * k2[i];
    f(t + dt / 2, tmp, k3); for (let i = 0; i < 6; i++) tmp[i] = s[i] + dt * k3[i];
    f(t + dt, tmp, k4); for (let i = 0; i < 6; i++) s[i] += dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    t += dt; const p2 = s[4] * s[4] + s[5] * s[5]; if (p2 > maxP2) maxP2 = p2;
    if (rec && ((k + 1) % every === 0 || k === n - 1)) { out.t.push(t); out.p.push([s[0] * s[0] + s[1] * s[1], s[2] * s[2] + s[3] * s[3], p2]); }
  }
  return { fin: [s[0] * s[0] + s[1] * s[1], s[2] * s[2] + s[3] * s[3], s[4] * s[4] + s[5] * s[5]], maxP2, rec: out, P };
}
const MHz = w => w / TAU * 1000;

LESSONS.push({
  id: 'pulses', n: 35.2, stage: CMP, minutes: 16, title: 'Pulse-level control: from gates to microwaves',
  lede: 'The last stage of a compiler turns each gate into a shaped microwave pulse. The shape decides how fast a gate can run before the qubit leaks out of its two-level world.',
  html: `
<h2>Below the gate level</h2>
<p>A compiled circuit ends as a <strong>pulse schedule</strong>: for every control line, a list of waveforms with start times, frequencies and phases. On a superconducting chip a single-qubit gate is a microwave burst at the qubit frequency, typically 20 to 50 ns long. Its envelope sets the rotation angle and its phase sets the rotation axis in the ${m('xy')} plane ([[L:rabi]]). Rotations about ${m('z')} usually cost nothing at all: they are <strong>virtual Z gates</strong> (McKay and colleagues, 2017), implemented by shifting the phase of every later pulse on that qubit in software. Two-qubit gates are longer flux or cross-resonance pulses, and readout is yet another pulse ([[L:readout]]). Formats such as OpenQASM 3 let a program attach pulse-level calibrations to gate names, and the gate set a compiler targets is really a table of calibrated pulses.</p>
<h2>A transmon is not quite a qubit</h2>
<p>A transmon is an anharmonic oscillator. Its lowest two levels form the qubit, but the next level sits only a little closer: the ${m('1→2')} transition is lower than the ${m('0→1')} transition by the <strong>anharmonicity</strong> ${m('|α|/2π')}, typically 200 to 300 MHz. A drive tuned to the qubit is therefore only slightly off-resonant with the ${m('1→2')} transition, and it couples to it √2 times more strongly. In the frame rotating with the qubit,</p>
${EQ('H = α|2⟩⟨2| + ½Ω<sub>x</sub>(t)(a + a†) + ½Ω<sub>y</sub>(t)(i a† − i a), &nbsp;&nbsp; a = |0⟩⟨1| + √2 |1⟩⟨2|')}
<p>Population that ends in ${m('|2⟩')} has <strong>leaked</strong>: it is outside the computational space, error-correcting codes designed for qubits do not see it properly, and it has to be removed with dedicated leakage-reduction operations. Even population that returns from ${m('|2⟩')} by the end of the pulse leaves a trace, because the off-resonant coupling shifts the qubit’s frequency during the pulse (an <strong>AC Stark shift</strong>) and tilts the rotation axis. The lab simulates a π pulse on this three-level system.</p>
${LAB('pulse')}
<h2>The speed limit is spectral</h2>
<p>A pulse of length ${m('τ')} contains frequencies spread over a band of width about ${m('1/τ')}. A square pulse has a sinc spectrum whose sidelobes decay slowly, so even fairly long square pulses put power at the ${m('1→2')} frequency. A Gaussian envelope concentrates the spectrum, but once ${m('1/τ')} approaches ${m('|α|/2π')}, which is about 4 ns for 250 MHz, leakage grows quickly. That is the basic reason single-qubit gates on transmons take tens of nanoseconds rather than a few.</p>
<h2>DRAG: cancel the leakage, keep the speed</h2>
<p>Motzoi, Gambetta, Rebentrost and Wilhelm (2009) proposed <strong>DRAG</strong>, Derivative Removal by Adiabatic Gate: add a component in the other quadrature proportional to the time derivative of the main envelope,</p>
${EQ('Ω<sub>y</sub>(t) = −β · Ω̇<sub>x</sub>(t) / α')}
<p>In the frequency domain a derivative multiplies the spectrum by ${m('iω')}, so the complex envelope ${m('Ω<sub>x</sub> + iΩ<sub>y</sub>')} has spectrum ${m('F(ω)(1 − βω/α)')}, which vanishes at ${m('ω = α')} when ${m('β = 1')}: a notch exactly at the leakage transition. In the lab ${m('β ≈ 1')} minimizes leakage, while ${m('β ≈ 0.5')} instead best cancels the Stark-shift phase error. Experiments calibrate ${m('β')} and fix the remaining error with a small detuning or a virtual Z rotation. DRAG pulses, or variants of them, are the default single-qubit pulses on most superconducting processors.</p>
${LAB('spectrum')}
${NOTE('Optimal control', `<p>DRAG is the first-order analytic answer to a general question: what pulse implements a target unitary as fast and accurately as possible, given the real Hamiltonian? Numerical optimal control, such as GRAPE (Khaneja and colleagues, 2005), optimizes thousands of piecewise-constant amplitudes directly, and is used for faster two-qubit gates, qudit gates and gates that avoid known crosstalk. The price is calibration: an optimized pulse is only as good as the model of the device it was optimized for, which is why closed-loop calibration on the hardware itself is common.</p>`)}
`,
  labs: {
    pulse: {
      title: 'A π pulse on a three-level transmon',
      cap: 'A Gaussian π pulse (truncated at ±2σ, area π) drives |0⟩ → |1⟩. Top left: the in-phase envelope Ωₓ (copper) and the DRAG quadrature Ω_y (cyan). Bottom left: populations of |0⟩, |1⟩ and |2⟩ during the pulse. Right: the leaked population on a log scale. Short pulses push population into |2⟩; most of it returns by the end, but the final leakage and the error 1 − P(|1⟩) both rise steeply as the pulse gets shorter. Try β = 0.5 and β = 1.',
      build(body, id) {
        let tau = 10, aM = -250, beta = 0, R = null;
        const c1 = canvas('', 'height:150px'), c2 = canvas('', 'height:170px'), c3 = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const run = () => { R = transmonRun(tau, TAU * aM / 1000, beta, 'gauss', 260); q1.inv(); q2.inv(); q3.inv(); text(); };
        const q1 = painter(c1, ({ ctx, w, h: H }) => {
          if (!R) return; const T = Theme.get(), K = 200, xs = [...Array(K + 1)].map((_, k) => k * tau / K), ox = xs.map(t => MHz(R.P.ox(t))), oy = xs.map(t => MHz(R.P.oy(t)));
          const ym = Math.max(...ox.map(Math.abs), ...oy.map(Math.abs)) * 1.15, st = ym > 150 ? 100 : ym > 60 ? 40 : 20;
          const A = axes(ctx, w, H, { x: [0, tau], y: [-ym, ym], xt: [0, tau / 2, tau].map(v => +v.toFixed(1)), yt: [-st, 0, st].filter(v => Math.abs(v) < ym), xl: 't (ns)', yl: 'drive / 2π (MHz)' });
          polyline(ctx, xs.map((t, k) => [A.X(t), A.Y(ox[k])]), T.copper, 2.2); polyline(ctx, xs.map((t, k) => [A.X(t), A.Y(oy[k])]), T.cyan, 2, [5, 3]);
        });
        const q2 = painter(c2, ({ ctx, w, h: H }) => {
          if (!R) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [0, tau], y: [0, 1], xt: [0, tau / 2, tau].map(v => +v.toFixed(1)), yt: [0, .5, 1], xl: 't (ns)', yl: 'population' });
          [[0, T.muted], [1, T.cyan], [2, T.copper]].forEach(([k, col]) => polyline(ctx, R.rec.t.map((t, i) => [A.X(t), A.Y(R.rec.p[i][k])]), col, 2.2));
        });
        const q3 = painter(c3, ({ ctx, w, h: H }) => {
          if (!R) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [0, tau], y: [1e-8, 1], ylog: true, xt: [0, tau / 2, tau].map(v => +v.toFixed(1)), yt: [1e-8, 1e-6, 1e-4, 1e-2, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 't (ns)', yl: 'P(|2⟩)' });
          polyline(ctx, R.rec.t.map((t, i) => [A.X(t), A.Y(clamp(R.rec.p[i][2], 1e-8, 1))]), T.copper, 2.2);
          const yf = A.Y(clamp(R.fin[2], 1e-8, 1)); ctx.setLineDash([4, 3]); ctx.strokeStyle = T.ink; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(A.L, yf); ctx.lineTo(A.R, yf); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
          txt(ctx, 'final leakage', A.L + 6, yf - 9, { align: 'left', font: '500 10px "JetBrains Mono",monospace' });
        });
        const text = () => { const pk = Math.max(...[...Array(201)].map((_, k) => Math.abs(R.P.ox(k * tau / 200)))); ro.innerHTML = `<span class="k">error 1 − P(|1⟩) </span>${sci(1 - R.fin[1])}<br><span class="k">final leakage P(|2⟩) </span>${sci(R.fin[2])}<br><span class="k">peak leakage during pulse </span>${sci(R.maxP2)}<br><span class="k">peak drive Ωₓ/2π </span>${num(MHz(pk), 0)} MHz`; };
        const bs = slider({ id: id('b'), label: 'DRAG coefficient β', min: 0, max: 1.5, step: .05, value: beta, fmt: v => num(v, 2), on: v => { beta = v; run(); } });
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, c1, legendRow([['Ωₓ (in phase)', 'var(--copper)'], ['Ω_y (DRAG quadrature)', 'var(--cyan)', 1]]), c2, legendRow([['|0⟩', 'var(--muted)'], ['|1⟩', 'var(--cyan)'], ['|2⟩ (leaked)', 'var(--copper)']])),
          h('div', { class: 'stack' }, c3,
            slider({ id: id('t'), label: 'Pulse length τ', min: 3, max: 40, step: .5, value: tau, fmt: v => num(v, 1) + ' ns', on: v => { tau = v; run(); } }),
            slider({ id: id('a'), label: 'Anharmonicity α/2π', min: -400, max: -100, step: 10, value: aM, fmt: v => num(v, 0) + ' MHz', on: v => { aM = v; run(); } }),
            bs, h('div', { class: 'btns' }, btn('No DRAG', () => bs.set(0, true), 'sm'), btn('β = 0.5', () => bs.set(.5, true), 'sm'), btn('β = 1', () => bs.set(1, true), 'sm')), ro)));
        run();
      }
    },
    spectrum: {
      title: 'Pulse spectra and leakage',
      cap: 'Left: power spectrum of the complex envelope Ωₓ + iΩ_y for a square pulse, a Gaussian pulse and a Gaussian with DRAG (β = 1), relative to the qubit frequency. The dashed marker is the 1→2 transition at α/2π. Right: leakage at the end of a π pulse against pulse length, from the three-level simulation (computed in the background). The DRAG notch sits on the leakage transition, which is why its leakage falls orders of magnitude faster.',
      build(body, id) {
        let tau = 6, aM = -250, jobs = [], jdx = 0, curves = null;
        const SH = [['square', 'Square', 0], ['gauss', 'Gaussian', 0], ['drag', 'Gaussian + DRAG', 1]], DUR = []; for (let d = 2; d <= 40; d += 1) DUR.push(d);
        const c1 = canvas('', 'height:250px'), c2 = canvas('', 'height:250px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), st = h('div', { class: 'status' });
        const colOf = (T, k) => [T.muted, T.copper, T.cyan][k];
        const spec = (shape, beta) => {
          const al = TAU * aM / 1000, P = pulseShape(tau, al, beta, shape === 'drag' ? 'gauss' : shape), K = 500, dt = tau / K, out = [];
          const sr = [], si = []; for (let k = 0; k < K; k++) { const t = (k + .5) * dt; sr.push(P.ox(t)); si.push(P.oy(t)); }
          let n0 = 0; for (let k = 0; k < K; k++) n0 += sr[k] * dt; n0 = n0 * n0;
          for (let f = -700; f <= 400; f += 4) { const wv = TAU * f / 1000; let re = 0, im = 0; for (let k = 0; k < K; k++) { const t = (k + .5) * dt, cs = Math.cos(wv * t), sn = Math.sin(wv * t); re += (sr[k] * cs - si[k] * sn) * dt; im += (sr[k] * sn + si[k] * cs) * dt; } out.push([f, 10 * Math.log10(Math.max(1e-12, (re * re + im * im) / n0))]); }
          return out;
        };
        const atA = s => { let best = s[0]; for (const q of s) if (Math.abs(q[0] - aM) < Math.abs(best[0] - aM)) best = q; return best[1]; };
        let specs = null;
        const reSpec = () => { specs = SH.map(([k, , b]) => spec(k, b)); q1.inv(); text(); };
        const restartJobs = () => { curves = SH.map(() => DUR.map(() => null)); jobs = []; SH.forEach((s, si) => DUR.forEach((d, di) => jobs.push([si, di]))); jdx = 0; q2.inv(); };
        Scope.tick(() => {
          if (jdx >= jobs.length) return; const t0 = performance.now(), al = TAU * aM / 1000;
          while (jdx < jobs.length && performance.now() - t0 < 10) { const [si, di] = jobs[jdx++], [k, , b] = SH[si]; curves[si][di] = transmonRun(DUR[di], al, b, k === 'drag' ? 'gauss' : k, 0, .005).fin[2]; }
          q2.inv(); text();
        });
        const q1 = painter(c1, ({ ctx, w, h: H }) => {
          if (!specs) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [-700, 400], y: [-80, 5], xt: [-600, -400, -200, 0, 200, 400], yt: [-80, -60, -40, -20, 0], xl: 'frequency offset (MHz)', yl: 'power (dB)' });
          ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2; ctx.strokeStyle = T.ink; ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(A.X(0), A.T); ctx.lineTo(A.X(0), A.B); ctx.stroke(); ctx.strokeStyle = T.copper; ctx.globalAlpha = .9; ctx.beginPath(); ctx.moveTo(A.X(aM), A.T); ctx.lineTo(A.X(aM), A.B); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
          txt(ctx, '0→1', A.X(0) + 4, A.T + 26, { align: 'left', font: '600 10px "JetBrains Mono",monospace', color: T.ink }); txt(ctx, '1→2', A.X(aM) + 4, A.T + 26, { align: 'left', font: '600 10px "JetBrains Mono",monospace', color: T.copper });
          ctx.save(); ctx.beginPath(); ctx.rect(A.L, A.T, A.R - A.L, A.B - A.T); ctx.clip();
          specs.forEach((s, k) => polyline(ctx, s.map(([f, db]) => [A.X(f), A.Y(Math.max(-90, db))]), colOf(T, k), k === 2 ? 2.4 : 1.8)); ctx.restore();
        });
        const q2 = painter(c2, ({ ctx, w, h: H }) => {
          if (!curves) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [2, 40], y: [1e-12, 1], ylog: true, xt: [2, 10, 20, 30, 40], yt: [1e-12, 1e-9, 1e-6, 1e-3, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'pulse length τ (ns)', yl: 'final leakage' });
          curves.forEach((cvs, k) => { const pts = []; cvs.forEach((v, i) => { if (v != null) pts.push([A.X(DUR[i]), A.Y(clamp(v, 1e-12, 1))]); }); polyline(ctx, pts, colOf(T, k), k === 2 ? 2.4 : 1.8); });
          ctx.strokeStyle = T.ink; ctx.globalAlpha = .35; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(A.X(tau), A.T); ctx.lineTo(A.X(tau), A.B); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        });
        const text = () => {
          if (!specs) return; const done = jdx >= jobs.length;
          st.className = done ? 'status good' : 'status'; st.textContent = done ? 'Leakage curves computed.' : `Simulating pulses… ${Math.round(100 * jdx / Math.max(1, jobs.length))}%`;
          ro.innerHTML = `<span class="k">spectral power at the 1→2 line, τ = ${num(tau, 0)} ns</span><br>` + SH.map(([, nm], k) => `<span class="k">${nm.padEnd(16)} </span>${num(atA(specs[k]), 1)} dB`).join('<br>');
        };
        body.append(h('div', { class: 'split even' }, c1, c2), legendRow(SH.map(([, nm], k) => [nm, ['var(--muted)', 'var(--copper)', 'var(--cyan)'][k]])),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, slider({ id: id('t'), label: 'Pulse length τ (spectrum)', min: 2, max: 40, step: 1, value: tau, fmt: v => v + ' ns', on: v => { tau = v; reSpec(); q2.inv(); } }),
            slider({ id: id('a'), label: 'Anharmonicity α/2π', min: -400, max: -100, step: 10, value: aM, fmt: v => num(v, 0) + ' MHz', on: v => { aM = v; reSpec(); restartJobs(); } }), st), ro));
        reSpec(); restartJobs();
      }
    }
  },
  take: ['A compiler’s final output is a pulse schedule; Z rotations are usually virtual, implemented as phase shifts of later pulses.',
    'A transmon’s 1→2 transition is only a few hundred megahertz from the qubit, so fast pulses leak population out of the qubit space and Stark-shift the qubit.',
    'A pulse of length τ has spectral width about 1/τ; square pulses leak badly, smooth Gaussian pulses less so.',
    'DRAG adds a derivative component in the other quadrature that notches the spectrum at the leakage transition; β is calibrated, around 1 for leakage and 0.5 for phase errors.'],
  quiz: QZ([
    ['What is a virtual Z gate?', ['A Z gate that is never applied', 'A Z rotation implemented in software by shifting the phase of all later pulses on that qubit, taking zero time', 'A Z gate on a simulator', 'A gate that measures Z'], 1, 'Since drive phase sets the rotation axis, rotating the reference frame is equivalent to a perfect, instantaneous Z rotation.'],
    ['What is the anharmonicity of a transmon?', ['Its qubit frequency', 'The difference between the 1→2 and 0→1 transition frequencies, typically −200 to −300 MHz', 'Its coherence time', 'The coupling to the resonator'], 1, 'Without anharmonicity the levels would be equally spaced and a drive could not address the qubit transition alone.'],
    ['What is leakage?', ['Loss of photons from the cable', 'Population leaving the computational |0⟩, |1⟩ subspace, for example into |2⟩', 'A phase error', 'Readout error'], 1, 'Leaked population is invisible to standard qubit error models and must be pumped back by leakage-reduction operations.'],
    ['Why do short pulses leak more?', ['They are louder', 'A pulse of length τ spreads its power over a bandwidth of about 1/τ, which reaches the nearby 1→2 transition', 'They heat the fridge', 'Short pulses are not unitary'], 1, 'The spectrum broadens as the pulse shortens, putting more power at the frequency that drives |1⟩ → |2⟩.'],
    ['Why does the 1→2 transition couple more strongly than 0→1?', ['It doesn’t', 'The ladder operator gives ⟨2|a†|1⟩ = √2 versus ⟨1|a†|0⟩ = 1', 'Because it is at higher frequency', 'Because of the resonator'], 1, 'For an oscillator, matrix elements grow as √(n+1), so higher transitions are driven more strongly.'],
    ['What does DRAG add to a pulse?', ['More amplitude in the same quadrature', 'A component in the other quadrature proportional to the derivative of the main envelope', 'A longer tail', 'A second frequency at 2ω'], 1, 'Ω_y = −βΩ̇ₓ/α, which shapes the spectrum and cancels leakage to first order.'],
    ['How does DRAG suppress leakage in the frequency domain?', ['It shifts the qubit frequency', 'The derivative term multiplies the spectrum by (1 − βω/α), creating a zero at the 1→2 transition when β = 1', 'It removes all frequencies', 'It doubles the pulse length'], 1, 'A time derivative is multiplication by iω, so the combined envelope has a notch at ω = α/β.'],
    ['In the lab, which β best cancels the phase error from the AC Stark shift?', ['0', 'About 0.5', 'About 2', 'Any β gives the same result'], 1, 'β ≈ 0.5 maximizes P(|1⟩), while β ≈ 1 minimizes leakage; in practice β is calibrated and a small detuning or virtual Z fixes the rest.'],
    ['Without DRAG, why is 1 − P(|1⟩) much larger than the final leakage for long pulses?', ['The simulation is wrong', 'The off-resonant level Stark-shifts the qubit during the pulse, tilting the rotation axis so the state misses the pole', 'Because of T1', 'Because the pulse area is wrong'], 1, 'Even when population returns from |2⟩, the dispersive shift acts like a detuning that causes a phase error.'],
    ['What is the main cost of numerically optimized pulses such as GRAPE?', ['They are always slower', 'They depend on an accurate model of the device and need careful calibration, often in closed loop on the hardware', 'They cannot be run on hardware', 'They only work for one qubit'], 1, 'Optimized pulses exploit details of the Hamiltonian; model errors and drift erase the gains unless the pulses are recalibrated.']
  ])
});

/* ---------- Pauli twirling and randomized compiling ---------- */
const PAULI = [[[1, 0], [0, 0], [0, 0], [1, 0]], [[0, 0], [1, 0], [1, 0], [0, 0]], [[0, 0], [0, -1], [0, 1], [0, 0]], [[1, 0], [0, 0], [0, 0], [-1, 0]]];
const CLIFF1 = (() => {
  const nrm = U => { let k = 0; while (C2.abs2(U[k]) < 1e-12) k++; const a = U[k], r = Math.hypot(a[0], a[1]), ph = [a[0] / r, -a[1] / r]; return U.map(z => C2.mul(z, ph)); };
  const key = U => nrm(U).map(z => z.map(v => (Math.round(v * 1e6) / 1e6 + 0).toFixed(5)).join(',')).join(';');
  const Hm = [[S2, 0], [S2, 0], [S2, 0], [-S2, 0]], Sm = [[1, 0], [0, 0], [0, 0], [0, 1]], out = [PAULI[0]], seen = new Set([key(PAULI[0])]);
  for (let i = 0; i < out.length; i++) for (const g of [Hm, Sm]) { const M = C2.mm(g, out[i]), k = key(M); if (!seen.has(k)) { seen.add(k); out.push(M); } }
  return out;
})();
/* Pauli transfer matrix (3×3, row-major) of a single-qubit unitary */
function ptm3(U) {
  const R = [], Ud = C2.dag(U);
  for (let i = 1; i <= 3; i++) for (let j = 1; j <= 3; j++) { const M = C2.mm(C2.mm(PAULI[i], U), C2.mm(PAULI[j], Ud)); R.push((M[0][0] + M[3][0]) / 2); }
  return R;
}
const m3 = (A, B) => { const C = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j]; return C; };
const m3v = (A, v) => [0, 1, 2].map(i => A[i * 3] * v[0] + A[i * 3 + 1] * v[1] + A[i * 3 + 2] * v[2]);
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

LESSONS.push({
  id: 'randcomp', n: 35.8, stage: CMP, minutes: 15, title: 'Randomized compiling: taming coherent errors',
  lede: 'A tiny miscalibration repeated a thousand times can add up to a disaster. Randomized compiling inserts random Pauli gates that cancel logically but scramble the error, so it builds up like noise instead of like a rotation.',
  html: `
<h2>Two kinds of small error</h2>
<p>Suppose every gate in a long circuit over-rotates by a small angle ${m('ε')}. That is a <strong>coherent</strong> error: a unitary ${m('e<sup>−iεX/2</sup>')} applied after each gate. Repeated ${m('d')} times in the same direction, the angles add, and the infidelity grows as the square of the depth. Compare a <strong>stochastic</strong> error that applies X with probability ${m('p')}: probabilities add, so the infidelity grows linearly.</p>
${EQ('coherent: 1 − F ≈ sin²(dε/2) ≈ d²ε²/4 &nbsp;&nbsp;&nbsp; stochastic: 1 − F ≈ d · p, &nbsp; p = sin²(ε/2) ≈ ε²/4')}
<p>Both errors have the same infidelity for one gate, and randomized benchmarking ([[L:rb]]) cannot tell them apart. But after 100 gates the coherent one is up to 100 times worse. Worse still, the worst-case error rate of a coherent error, measured by the diamond norm that fault-tolerance proofs use, scales like the square root of its average infidelity: an error that looks like ${m('10⁻⁶')} on average can act like ${m('10⁻³')} in the worst case.</p>
<h2>The Pauli twirl</h2>
<p>Averaging a channel over conjugation by random Paulis turns it into a Pauli channel. For the over-rotation,</p>
${EQ('¼ Σ<sub>P ∈ {I,X,Y,Z}</sub> P · e<sup>−iεX/2</sup> P ρ P e<sup>iεX/2</sup> · P = cos²(ε/2) ρ + sin²(ε/2) XρX')}
<p>The twirled error has exactly the same average fidelity, but it is stochastic: it applies X with probability ${m('sin²(ε/2)')}. In the language of Pauli transfer matrices, twirling keeps the diagonal and deletes everything else.</p>
<h2>Randomized compiling</h2>
<p>Wallman and Emerson (2016) showed how to twirl the errors of a real circuit without changing what it computes. Split the circuit into layers of “easy” single-qubit gates and “hard” gates, usually Clifford two-qubit gates such as CNOT or CZ. Before each hard layer ${m('G')}, insert a random Pauli ${m('P')}; after it, insert the correction ${m('P′ = G P G†')}, which is again a Pauli because ${m('G')} is Clifford. Logically ${m('P′GP = G')}. Physically the error ${m('E')} of the hard layer is sandwiched as ${m('P′E P′')}, a random Pauli conjugation. The inserted Paulis are merged into the neighbouring single-qubit gates, so the circuit gets no deeper. Running many random compilations of the same circuit and pooling their shots averages the error into a Pauli channel.</p>
${LAB('twirl')}
<p>Hashim and colleagues (2021) demonstrated the method on a superconducting processor, with markedly better and more predictable algorithm performance. Pauli twirling of every two-qubit layer is now a standard ingredient of error mitigation, for example in IBM’s 2023 “utility” experiment, because methods such as probabilistic error cancellation and zero-noise extrapolation ([[L:mitigation]]) assume noise that a Pauli model describes. It also helps error correction: decoders and threshold estimates are built for Pauli noise ([[L:thresholds]]).</p>
<h2>What it does not do</h2>
<p>Twirling does not reduce the error per layer; it changes its character. If a circuit happens to cancel its own coherent errors, as an echo sequence does, twirling destroys the cancellation and makes things worse: try the X gate with detuning in the lab. Randomized compiling replaces a worst case, which can be catastrophic and is hard to predict, with an average case that is well modelled and grows slowly.</p>
${LAB('ptm')}
`,
  labs: {
    twirl: {
      title: 'Coherent build-up versus twirled noise',
      cap: 'A depth-d circuit repeats one gate layer with a small error rotation after each. Copper: the bare circuit, whose coherent error accumulates (and eventually wraps around as the angle passes π). Cyan dots: 24 independent randomized compilations, each a different but logically equivalent circuit; the cyan line is their average and the dashed line the exact Pauli-twirled prediction (a few instances cancel their own errors exactly and sit on the bottom axis). With idle or X layers and an x over-rotation, the bare error grows as d² while the twirled error grows as d. Random Clifford layers already scramble coherent errors; X layers with a z detuning echo them away, and twirling then hurts.',
      build(body, id) {
        let gate = 'idle', axis = 'x', eps = .03, seq = null, data = null;
        const D = 1000, K = 24, SAMP = [1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000];
        const cv = canvas('', 'height:300px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const PT = CLIFF1.map(ptm3), PX = ptm3(PAULI[1]);
        const newSeq = () => { seq = []; for (let d = 0; d < D; d++) seq.push(gate === 'cliff' ? Math.floor(Math.random() * 24) : gate === 'x' ? -1 : 0); };
        const G = k => k === -1 ? PAULI[1] : CLIFF1[k], GR = k => k === -1 ? PX : PT[k];
        const compute = () => {
          if (!seq) newSeq();
          const E = Rn2(axis === 'x' ? [1, 0, 0] : [0, 0, 1], eps), RE = ptm3(E), Dg = [RE[0], 0, 0, 0, RE[4], 0, 0, 0, RE[8]];
          const bare = new Float64Array(D + 1), U0s = [PAULI[0]]; let U = PAULI[0], U0 = PAULI[0];
          for (let d = 1; d <= D; d++) { const g = G(seq[d - 1]); U = C2.mm(E, C2.mm(g, U)); U0 = C2.mm(g, U0); U0s.push(U0); bare[d] = 1 - C2.overlap(U0, U) ** 2; }
          const inst = [], mean = new Float64Array(D + 1);
          for (let k = 0; k < K; k++) { let V = PAULI[0]; const row = new Float64Array(D + 1); for (let d = 1; d <= D; d++) { const g = G(seq[d - 1]), P = PAULI[Math.floor(Math.random() * 4)], Pp = C2.mm(C2.mm(g, P), C2.dag(g)); V = C2.mm(C2.mm(Pp, C2.mm(E, C2.mm(g, P))), V); row[d] = 1 - C2.overlap(U0s[d], V) ** 2; mean[d] += row[d] / K; } inst.push(row); }
          const theo = new Float64Array(D + 1); let M = I3, R0 = I3;
          for (let d = 1; d <= D; d++) { const RG = GR(seq[d - 1]); M = m3(Dg, m3(RG, M)); R0 = m3(RG, R0); let tr = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) tr += R0[j * 3 + i] * M[j * 3 + i]; theo[d] = 1 - (1 + tr) / 4; }
          data = { bare, inst, mean, theo }; p.inv(); text();
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!data) return; const T = Theme.get(), lo = 1e-7, A = axes(ctx, w, H, { x: [1, D], y: [lo, 1], xlog: true, ylog: true, xt: [1, 10, 100, 1000], yt: [1e-6, 1e-4, 1e-2, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'depth d', yl: 'process infidelity' });
          const Yc = v => A.Y(clamp(v, lo, 1));
          const bp = []; for (let d = 1; d <= D; d++) bp.push([A.X(d), Yc(data.bare[d])]); polyline(ctx, bp, T.copper, 1.8);
          ctx.fillStyle = rgba(T.cyan, .38); for (const row of data.inst) for (const d of SAMP) { ctx.beginPath(); ctx.arc(A.X(d) + (Math.random() - .5) * 3, Yc(row[d]), 2.1, 0, TAU); ctx.fill(); }
          const mp = [], tp = []; for (let d = 1; d <= D; d++) { mp.push([A.X(d), Yc(data.mean[d])]); tp.push([A.X(d), Yc(data.theo[d])]); }
          polyline(ctx, mp, T.cyan, 2.4); polyline(ctx, tp, T.ink, 1.3, [5, 4]);
        });
        const text = () => { const pl = Math.sin(eps / 2) ** 2, at = d => `<span class="k">d = ${String(d).padStart(4)} </span>bare ${sci(data.bare[d])} &nbsp; twirled ${sci(data.mean[d])}`; ro.innerHTML = `<span class="k">per-layer infidelity sin²(ε/2) </span>${sci(pl)}<br>${at(10)}<br>${at(100)}<br>${at(1000)}`; };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'idle', label: 'Idle layers' }, { v: 'x', label: 'X gates' }, { v: 'cliff', label: 'Random Cliffords' }], gate, v => { gate = v; seq = null; compute(); }, 'Layer'),
          seg([{ v: 'x', label: 'Over-rotation (x)' }, { v: 'z', label: 'Detuning (z)' }], axis, v => { axis = v; compute(); }, 'Error'), btn('New random compilations', compute, 'sm')),
          h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow([['bare circuit', 'var(--copper)'], ['twirled, average of 24', 'var(--cyan)'], ['Pauli-twirl prediction', 'var(--ink)', 1]])),
            h('div', { class: 'stack' }, slider({ id: id('e'), label: 'Error angle ε per layer', min: .002, max: .1, step: .002, value: eps, fmt: v => num(v, 3) + ' rad', on: v => { eps = v; compute(); } }), ro)));
        compute();
      }
    },
    ptm: {
      title: 'Rotate or shrink: the error on the Bloch sphere',
      cap: 'Dots are 150 states spread over the Bloch sphere, coloured by their original longitude; the arrow follows one chosen state. Left: d repetitions of the coherent error rotate the whole sphere, keeping every state pure. Right: the Pauli-twirled channel keeps only the diagonal of the transfer matrix, shrinking the sphere towards the error axis into a cigar. For d = 1 both have the same average fidelity; they part ways as d grows.',
      build(body, id) {
        let d = 12, eps = .2, axis = 'x', inp = '+i';
        const sL = canvas('sq', 'max-width:270px;margin:0 auto'), sR = canvas('sq', 'max-width:270px;margin:0 auto'), bL = new BlochView(sL, { labels: 'min', trail: false }), bR = new BlochView(sR, { labels: 'min', trail: false });
        const rL = h('div', { class: 'readout', style: 'white-space:normal' }), rR = h('div', { class: 'readout', style: 'white-space:normal' });
        const pts = []; const NP = 150; for (let i = 0; i < NP; i++) { const z = 1 - 2 * (i + .5) / NP, r = Math.sqrt(1 - z * z), ph = i * 2.399963; pts.push([r * Math.cos(ph), r * Math.sin(ph), z]); }
        const upd = () => {
          const R = ptm3(Rn2(axis === 'x' ? [1, 0, 0] : [0, 0, 1], eps)); let Rd = I3; for (let k = 0; k < d; k++) Rd = m3(R, Rd);
          const Dd = [R[0] ** d, 0, 0, 0, R[4] ** d, 0, 0, 0, R[8] ** d], v0 = CARD[inp];
          const cloud = M => pts.map(q => ({ v: m3v(M, q), r: 1.8, color: phaseColor(Math.atan2(q[1], q[0]), .85) }));
          bL.extra = cloud(Rd); bR.extra = cloud(Dd); bL.v = m3v(Rd, v0); bR.v = m3v(Dd, v0); bL.inv(); bR.inv();
          const fa = M => (3 + M[0] + M[4] + M[8]) / 6, len = v => Math.hypot(...v);
          rL.innerHTML = `<span class="k">total angle dε </span>${num(d * eps, 2)} rad<br><span class="k">chosen state length </span>${num(len(bL.v), 3)}<br><span class="k">average fidelity </span>${num(fa(Rd), 5)}`;
          rR.innerHTML = `<span class="k">sphere squeezed to </span>${num(Math.min(Dd[0], Dd[4], Dd[8]), 3)}<br><span class="k">chosen state length </span>${num(len(bR.v), 3)}<br><span class="k">average fidelity </span>${num(fa(Dd), 5)}`;
        };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'x', label: 'Over-rotation (x)' }, { v: 'z', label: 'Detuning (z)' }], axis, v => { axis = v; upd(); }, 'Error'), seg([{ v: '0', label: '|0⟩' }, { v: '+', label: '|+⟩' }, { v: '+i', label: '|+i⟩' }], inp, v => { inp = v; upd(); }, 'Follow state')),
          h('div', { class: 'split even' }, h('div', { class: 'stack' }, h('div', { class: 'ctl-label', style: 'text-align:center' }, 'Coherent error, d times'), sL, rL), h('div', { class: 'stack' }, h('div', { class: 'ctl-label', style: 'text-align:center' }, 'Pauli-twirled, d times'), sR, rR)),
          h('div', { class: 'split' }, slider({ id: id('d'), label: 'Depth d', min: 1, max: 60, step: 1, value: d, fmt: String, on: v => { d = v; upd(); } }), slider({ id: id('e'), label: 'Error angle ε', min: 0, max: .4, step: .01, value: eps, fmt: v => num(v, 2) + ' rad', on: v => { eps = v; upd(); } })));
        upd();
      }
    }
  },
  take: ['Coherent errors add as amplitudes, so their infidelity can grow as d²; stochastic Pauli errors add as probabilities and grow as d.',
    'Twirling a channel over the Pauli group turns it into a Pauli channel with the same average fidelity, keeping only the diagonal of its transfer matrix.',
    'Randomized compiling inserts random Paulis and their Clifford-conjugated corrections around hard gates, merges them into single-qubit gates, and averages over many compilations at no extra depth.',
    'It does not lower the error per gate; it makes errors predictable and Pauli-like, which mitigation and error correction assume, and it can undo beneficial echo cancellation.'],
  quiz: QZ([
    ['A gate over-rotates by ε each time. Roughly how does the infidelity of d repetitions grow?', ['Linearly in d', 'As d²ε²/4, because the rotation angles add coherently', 'It stays constant', 'Exponentially in d'], 1, 'The total error is a rotation by dε, with infidelity sin²(dε/2) ≈ (dε)²/4 while dε is small.'],
    ['Why can randomized benchmarking hide the danger of coherent errors?', ['RB uses no gates', 'RB averages over random Cliffords, which scramble coherent errors and report only the average infidelity, the same for coherent and stochastic errors', 'RB measures only T1', 'RB is noise-free'], 1, 'Random gate sequences already twirl the error, so RB cannot reveal how errors would add up in a structured circuit.'],
    ['What does Pauli twirling do to a channel?', ['Removes it', 'Averages it over conjugation by random Paulis, producing a Pauli channel with the same average fidelity', 'Makes it unitary', 'Doubles its error'], 1, 'Only the diagonal of the Pauli transfer matrix survives the average.'],
    ['What does the twirl of an over-rotation e^(−iεX/2) become?', ['The identity', 'Apply X with probability sin²(ε/2), otherwise nothing', 'A Z error', 'A depolarizing channel with probability ε'], 1, 'Cross terms between ρ and XρX average to zero, leaving cos²(ε/2)ρ + sin²(ε/2)XρX.'],
    ['In randomized compiling, why is the correction P′ = GPG† a Pauli?', ['Every gate is a Pauli', 'Because the hard gate G is a Clifford, and Cliffords map Paulis to Paulis', 'Because P is the identity', 'It is not; it is a T gate'], 1, 'That is the defining property of the Clifford group, and it is why hard layers are chosen to be Clifford.'],
    ['Why does randomized compiling not increase circuit depth?', ['It removes gates', 'The random Paulis and corrections are merged into the existing single-qubit gates on either side of each hard layer', 'It uses extra qubits instead', 'It does increase depth a lot'], 1, 'A product of single-qubit gates is one single-qubit gate, so each easy layer simply gets a different, equivalent gate.'],
    ['How are the random compilations used in an experiment?', ['Only the best one is kept', 'Many logically equivalent circuits are run and their shots pooled, so the average behaves as if the noise were twirled', 'They are run on different devices', 'They are simulated classically'], 1, 'Each instance is a valid compilation; averaging over instances realizes the twirled channel.'],
    ['In the lab, why does twirling make X gates with a z detuning worse?', ['Because X gates are noisy', 'Consecutive X gates echo the z error away in the bare circuit, and twirling destroys that cancellation', 'Because detuning is not an error', 'It makes them better'], 1, 'X R_z(ε) X = R_z(−ε), so pairs cancel; the twirled channel accumulates stochastically instead.'],
    ['Why do error-mitigation methods such as probabilistic error cancellation like twirled noise?', ['It is noise-free', 'They need an accurate, simple noise model, and twirling makes the noise a Pauli channel that can be learned and inverted', 'They do not care about noise', 'It removes the need for shots'], 1, 'A Pauli channel has few parameters and composes predictably, which makes learning and cancelling it practical.'],
    ['For a coherent error with average infidelity r, how does its worst-case (diamond-norm) error scale?', ['As r', 'As roughly √r, much larger than r when r is small', 'As r²', 'It is always zero'], 1, 'Coherent errors can add constructively in the worst case, so their diamond distance is of order √r, which matters for fault-tolerance thresholds.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Virtual Z gate', 'A Z rotation implemented by shifting the phase of all subsequent drive pulses, taking no time and adding no error.', 'pulses'],
  ['Anharmonicity', 'The difference between a transmon’s 1→2 and 0→1 transition frequencies, which lets a drive address the qubit transition.', 'pulses'],
  ['Leakage', 'Population leaving the computational subspace of a qubit, for example into a transmon’s |2⟩ level.', 'pulses'],
  ['DRAG', 'Derivative Removal by Adiabatic Gate: adding a derivative-shaped component in the other quadrature to suppress leakage and phase errors.', 'pulses'],
  ['AC Stark shift', 'A shift of a transition frequency caused by an off-resonant drive.', 'pulses'],
  ['Coherent error', 'A systematic unitary error, such as a small over-rotation, whose effects can add up constructively over a circuit.', 'randcomp'],
  ['Pauli twirling', 'Averaging a noise channel over conjugation by random Pauli operators, which turns it into a Pauli channel.', 'randcomp'],
  ['Randomized compiling', 'Inserting random Paulis and their corrections around hard gates and averaging over compilations, so coherent errors act as stochastic Pauli noise.', 'randcomp'],
  ['Pauli transfer matrix', 'The matrix describing how a channel maps Pauli operators (or Bloch vectors); for unitaries it is a rotation.', 'randcomp']
);
})();
