/* =====================================================================
   Track · Superconducting circuits
   LC oscillators, Josephson junctions, the transmon, fluxonium,
   materials, losses and fabrication
   ===================================================================== */

/* ---------- shared numerics for the hardware tracks ---------- */
/* Lowest k eigenvalues of a real symmetric tridiagonal matrix (diagonal d, off-diagonal e,
   e[i] couples rows i and i + 1), by Sturm-sequence bisection. */
function scTriEigs(d, e, k) {
  const n = d.length; let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < n; i++) { const r = (i > 0 ? Math.abs(e[i - 1]) : 0) + (i < n - 1 ? Math.abs(e[i]) : 0); lo = Math.min(lo, d[i] - r); hi = Math.max(hi, d[i] + r); }
  const below = x => { let c = 0, q = 1; for (let i = 0; i < n; i++) { q = d[i] - x - (i > 0 ? e[i - 1] * e[i - 1] / q : 0); if (q === 0) q = -1e-300; if (q < 0) c++; } return c; };
  const out = [];
  for (let j = 0; j < k; j++) { let a = lo, b = hi; for (let it = 0; it < 56; it++) { const mid = (a + b) / 2; if (below(mid) > j) b = mid; else a = mid; } out.push((a + b) / 2); lo = out[j] - 1e-9; }
  return out;
}
/* Eigenvector of the same tridiagonal matrix for an eigenvalue lam, by inverse iteration (Thomas algorithm). */
function scTriVec(d, e, lam) {
  const n = d.length, sh = lam + 1e-10 * (Math.abs(lam) + 1);
  let x = Float64Array.from({ length: n }, (_, i) => 1 + .37 * Math.sin(1.73 * i + .4));
  for (let it = 0; it < 3; it++) {
    const c = new Float64Array(n), y = new Float64Array(n);
    let b = d[0] - sh; c[0] = n > 1 ? e[0] / b : 0; y[0] = x[0] / b;
    for (let i = 1; i < n; i++) { b = d[i] - sh - e[i - 1] * c[i - 1]; if (Math.abs(b) < 1e-300) b = 1e-300; c[i] = i < n - 1 ? e[i] / b : 0; y[i] = (x[i] - e[i - 1] * y[i - 1]) / b; }
    for (let i = n - 2; i >= 0; i--) y[i] -= c[i] * y[i + 1];
    let s = 0; for (let i = 0; i < n; i++) s += y[i] * y[i]; s = Math.sqrt(s) || 1; for (let i = 0; i < n; i++) x[i] = y[i] / s;
  }
  return x;
}
/* Transmon / Cooper-pair box H = 4 E_C (n − n_g)² − E_J cos φ in the charge basis; returns the lowest k energies. */
function scTransmon(EJ, EC, ng, k = 4, N = 14) {
  const d = [], e = [];
  for (let n = -N; n <= N; n++) { d.push(4 * EC * (n - ng) ** 2); if (n < N) e.push(-EJ / 2); }
  return scTriEigs(d, e, k);
}
/* A circuit with a junction and an inductor, H = 4E_C n² − E_J cos(φ − φ_ext) + ½E_L φ², on a phase grid. */
function scPhaseGrid(EJ, EC, EL, phiExt, k = 4, vecs = false, M = 360, span = 4 * Math.PI) {
  const hgr = 2 * span / (M - 1), d = new Float64Array(M), e = new Float64Array(M - 1), ph = new Float64Array(M), U = new Float64Array(M);
  for (let i = 0; i < M; i++) { const p = -span + i * hgr; ph[i] = p; U[i] = -EJ * Math.cos(p - phiExt) + .5 * EL * p * p; d[i] = 8 * EC / (hgr * hgr) + U[i]; if (i < M - 1) e[i] = -4 * EC / (hgr * hgr); }
  const E = scTriEigs(Array.from(d), Array.from(e), k);
  return { E, ph, U, psi: vecs ? E.map(l => scTriVec(d, e, l)) : null };
}

(() => {
const SCQ = 12;
const EC_PER_FF = 19.37;   /* E_C/h in GHz = 19.37 / C[fF]  (E_C = e²/2C) */
const EL_PER_NH = 163.5;   /* E_L/h in GHz = 163.5 / L[nH]  (E_L = (Φ₀/2π)²/L) */
const EJ_PER_UA = 497;     /* E_J/h in GHz = 497 × I_c[µA]  (E_J = Φ₀I_c/2π) */
const KB_GHZ = 20.84;      /* k_B/h in GHz per kelvin */

function hermiteFns(nmax, x) {
  /* normalized harmonic-oscillator wavefunctions ψ_n(x) for x in units of the zero-point width */
  const out = [], p0 = Math.pow(Math.PI, -.25) * Math.exp(-x * x / 2); out.push(p0);
  if (nmax > 0) out.push(Math.SQRT2 * x * p0);
  for (let n = 2; n <= nmax; n++) out.push(Math.sqrt(2 / n) * x * out[n - 1] - Math.sqrt((n - 1) / n) * out[n - 2]);
  return out;
}

/* ===================================================================== */
LESSONS.push({
  id: 'lccircuit', n: 40.1, stage: SCQ, minutes: 14, title: 'A circuit as a quantum oscillator',
  lede: 'An inductor and a capacitor make a resonator. Cool it below a tenth of a kelvin and it behaves like a single quantum particle in a parabolic well, with flux and charge as its position and momentum.',
  html: `
<h2>Circuits can be quantum</h2>
<p>Superconducting qubits are electrical circuits: metal patterns on a chip, a few millimetres across. That a circuit you can see under a microscope behaves quantum mechanically was not obvious. The 2025 Nobel Prize in Physics went to John Clarke, Michel Devoret and John Martinis for showing, in 1984–85, that a superconducting circuit tunnels and has discrete energy levels like an atom. Every superconducting quantum processor builds on that result.</p>
<p>Two things make it possible. <strong>Superconductivity</strong> removes resistance, so energy stored in the circuit does not leak away as heat; aluminium superconducts below about 1.2 K, niobium below 9.2 K and tantalum below 4.4 K. And the <strong>dilution refrigerator</strong> ([[L:cryostat]]) cools the chip to about 10 mK, far below the energy of one microwave photon, so the circuit sits in its quantum ground state.</p>
<h2>Flux and charge</h2>
<p>Take an inductor ${m('L')} in parallel with a capacitor ${m('C')}. Describe it by the <strong>node flux</strong> ${m('Φ')}, the time integral of the voltage across it, and the <strong>charge</strong> ${m('Q')} on the capacitor. The energy is</p>
${EQ('H = Q²/2C + Φ²/2L')}
<p>This is exactly a mass on a spring: ${m('Φ')} plays the position, ${m('Q')} the momentum, ${m('C')} the mass and ${m('1/L')} the spring constant. Quantum mechanics enters through one commutator, ${m('[Φ, Q] = iħ')}, and the rest follows from the textbook harmonic oscillator. The circuit has a ladder of levels</p>
${EQ('E<sub>n</sub> = ħω (n + ½),&nbsp;&nbsp; ω = 1/√(LC)')}
<p>With ${m('L = 10')} nH and ${m('C = 100')} fF, ${m('ω/2π ≈ 5')} GHz, a microwave frequency. Even the ground state is not still: flux and charge fluctuate by the <strong>zero-point</strong> amounts ${m('Φ<sub>zpf</sub> = √(ħZ/2)')} and ${m('Q<sub>zpf</sub> = √(ħ/2Z)')}, where ${m('Z = √(L/C)')} is the circuit’s impedance.</p>
<h2>The units superconducting engineers use</h2>
<p>Charge in a superconductor moves in <strong>Cooper pairs</strong>, so it is natural to count it as ${m('n = Q/2e')}, and to measure flux as a phase, ${m('φ = 2πΦ/Φ₀')}, where ${m('Φ₀ = h/2e ≈ 2.07 × 10⁻¹⁵')} Wb is the superconducting flux quantum. With the charging energy ${m('E<sub>C</sub> = e²/2C')} and the inductive energy ${m('E<sub>L</sub> = (Φ₀/2π)²/L')},</p>
${EQ('H = 4E<sub>C</sub> n² + ½ E<sub>L</sub> φ²,&nbsp;&nbsp; ħω = √(8 E<sub>L</sub> E<sub>C</sub>)')}
<p>The same Hamiltonian, written this way, will reappear in every lesson of this track, with one extra term each time.</p>
${LAB('lc')}
<h2>Why a resonator is not a qubit</h2>
<p>All the gaps in the ladder are the same, ${m('ħω')}. A microwave pulse tuned to take the circuit from ${m('|0⟩')} to ${m('|1⟩')} is equally resonant with ${m('|1⟩ → |2⟩')}, ${m('|2⟩ → |3⟩')} and so on, so the state spreads up the ladder into a classical-looking coherent state instead of staying in a two-level subspace. To make a qubit, the levels must be unevenly spaced: the circuit needs a <strong>nonlinear</strong> element. That element is the Josephson junction ([[L:josephson]]).</p>
${NOTE('Resonators are still essential', `<p>Linear resonators are everywhere on a quantum chip: they read qubits out ([[L:readout]]), filter their decay, carry interactions between them ([[L:cqedcouple]]) and, in 3D form, can even store quantum information themselves ([[L:cavities]]).</p>`)}
`,
  labs: {
    lc: {
      title: 'An LC circuit in its quantum ground state',
      cap: 'The potential energy ½E_Lφ² is a parabola. The horizontal lines are the energy levels, evenly spaced by hf, and the curves are the wavefunctions of the lowest four levels plotted against the phase φ. The dashed line marks the thermal energy k_BT at the chosen temperature: when it is far below the first gap the circuit stays in its ground state.',
      build(body, id) {
        let L = 10, C = 100, Tm = 10;
        const cv = canvas('', 'height:300px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const vals = () => { const EC = EC_PER_FF / C, EL = EL_PER_NH / L, f = Math.sqrt(8 * EL * EC), Z = Math.sqrt(L * 1e-9 / (C * 1e-15)), zpf = Math.pow(2 * EC / EL, .25); return { EC, EL, f, Z, zpf }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), v = vals(), Emax = 4.6 * v.f, xm = Math.max(3.2 * v.zpf, Math.sqrt(2 * Emax / v.EL) * 1.08);
          const A = axes(ctx, w, H, { x: [-xm, xm], y: [0, Emax], xt: [-xm, 0, xm].map(x => +x.toFixed(2)), xf: x => num(x, 2), yt: [0, v.f, 2 * v.f, 3 * v.f, 4 * v.f].map(x => +x.toFixed(3)), yf: y => num(y, 1), xl: 'phase φ (rad)', yl: 'energy / h (GHz)' });
          const pts = []; for (let k = 0; k <= 200; k++) { const x = -xm + 2 * xm * k / 200; pts.push([A.X(x), A.Y(Math.min(Emax, .5 * v.EL * x * x))]); }
          polyline(ctx, pts, T.muted, 2);
          for (let n = 0; n < 4; n++) {
            const E = v.f * (n + .5), xt = Math.sqrt(2 * E / v.EL);
            polyline(ctx, [[A.X(-xt), A.Y(E)], [A.X(xt), A.Y(E)]], rgba(T.ink, .5), 1.2);
            const wf = []; for (let k = 0; k <= 200; k++) { const x = -xm + 2 * xm * k / 200, y = hermiteFns(n, x / (Math.SQRT2 * v.zpf))[n]; wf.push([A.X(x), A.Y(E + y * v.f * .42)]); }
            polyline(ctx, wf, n === 0 ? T.copper : T.cyan, 2);
            txt(ctx, `n = ${n}`, A.R - 6, A.Y(E) - 8, { align: 'right', font: '600 10.5px "JetBrains Mono",monospace' });
          }
          const kT = KB_GHZ * Tm / 1000; if (kT < Emax) polyline(ctx, [[A.L, A.Y(kT)], [A.R, A.Y(kT)]], T.bad, 1.4, [5, 4]);
          txt(ctx, `k_BT at ${Tm} mK`, A.L + 8, A.Y(Math.min(kT, Emax * .97)) - 9, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace', color: T.bad });
        });
        const upd = () => {
          const v = vals(), pth = 1 / (Math.exp(v.f / (KB_GHZ * Tm / 1000)) - 1);
          ro.innerHTML = `<span class="k">frequency f = 1/(2π√LC) </span>${num(v.f, 3)} GHz<br><span class="k">impedance Z = √(L/C)     </span>${num(v.Z, 0)} Ω<br><span class="k">E_C/h, E_L/h             </span>${num(v.EC * 1000, 0)} MHz, ${num(v.EL, 2)} GHz<br><span class="k">zero-point phase φ_zpf   </span>${num(v.zpf, 3)} rad<br><span class="k">thermal photons at ${Tm} mK </span>${sci(pth, 2)}`;
          p.inv();
        };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('L'), label: 'Inductance L', min: 1, max: 40, step: .5, value: L, fmt: v => num(v, 1) + ' nH', on: v => { L = v; upd(); } }),
          slider({ id: id('C'), label: 'Capacitance C', min: 20, max: 500, step: 5, value: C, fmt: v => v + ' fF', on: v => { C = v; upd(); } }),
          slider({ id: id('T'), label: 'Temperature', min: 10, max: 400, step: 5, value: Tm, fmt: v => v + ' mK', on: v => { Tm = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['An LC circuit is a harmonic oscillator: flux plays position, charge plays momentum, and [Φ, Q] = iħ.',
    'Its levels are evenly spaced by ħω with ω = 1/√(LC), a few gigahertz for nanohenries and tens of femtofarads.',
    'In superconducting units, H = 4E_C n² + ½E_Lφ² with n = Q/2e, φ = 2πΦ/Φ₀ and ħω = √(8E_LE_C).',
    'Equal spacing means a pulse cannot single out two levels, so a qubit needs a nonlinear element: the Josephson junction.'],
  quiz: QZ([
    ['In the analogy between an LC circuit and a mass on a spring, what plays the role of position?', ['The charge Q', 'The node flux Φ', 'The current', 'The capacitance'], 1, 'With H = Q²/2C + Φ²/2L, flux sits where position does (in the potential term) and charge where momentum does (in the kinetic term), with C as the mass.'],
    ['What is the resonance frequency of an LC circuit with L = 10 nH and C = 100 fF?', ['About 50 MHz', 'About 5 GHz', 'About 500 GHz', 'About 5 THz'], 1, '1/(2π√(10⁻⁸ × 10⁻¹³)) = 1/(2π × 3.16 × 10⁻¹¹) ≈ 5.0 × 10⁹ Hz.'],
    ['Why must the circuit be superconducting?', ['To make it smaller', 'So that energy is not lost to resistance, which would destroy coherence', 'To raise its frequency', 'To make it magnetic'], 1, 'Resistance dissipates energy as heat and couples the circuit to an environment that decoheres it. Superconductors carry current without loss.'],
    ['Which commutator quantizes the circuit?', ['[L, C] = iħ', '[Φ, Q] = iħ', '[V, I] = iħ', '[E, t] = iħ'], 1, 'Flux and charge are canonically conjugate, like position and momentum, so [Φ, Q] = iħ.'],
    ['What is the flux quantum Φ₀?', ['h/e', 'h/2e, about 2.07 × 10⁻¹⁵ Wb', 'e/h', '2e/h'], 1, 'Superconducting charge carriers are Cooper pairs of charge 2e, so the flux quantum is h/2e.'],
    ['What is the charging energy E_C in the convention used here?', ['e²/C', 'e²/2C', '2e²/C', 'Φ₀²/2L'], 1, 'E_C = e²/2C is the energy to add one electron. A Cooper pair costs (2e)²/2C = 4E_C, which is why the Hamiltonian reads 4E_C n².'],
    ['In these units, the oscillator frequency is', ['ħω = E_L + E_C', 'ħω = √(8E_LE_C)', 'ħω = E_L/E_C', 'ħω = 4E_C'], 1, 'Matching 4E_C n² + ½E_Lφ² to p²/2m + ½mω²x² gives ħω = √(8E_LE_C), which equals ħ/√(LC).'],
    ['Why is a plain LC resonator not a good qubit?', ['Its frequency is too high', 'Its levels are evenly spaced, so a pulse that drives 0→1 also drives 1→2 and higher', 'It cannot be cooled', 'It has no ground state'], 1, 'Equal spacing makes every transition resonant with the same pulse, so the state leaves the two-level subspace.'],
    ['Why is a temperature of about 10 mK needed for a 5 GHz circuit?', ['So the metal does not melt', 'Because hf/k_B ≈ 0.24 K, and the circuit must be much colder than that to stay in its ground state', 'To make the circuit faster', 'Because aluminium only superconducts below 10 mK'], 1, 'The thermal population of the first excited state goes like exp(−hf/k_BT). At 10 mK and 5 GHz it is about 4 × 10⁻¹¹.'],
    ['What did Clarke, Devoret and Martinis demonstrate in 1984–85?', ['The first transmon', 'That a macroscopic superconducting circuit shows quantum tunnelling and discrete energy levels', 'The first quantum error correction', 'High-temperature superconductivity'], 1, 'Their experiments on a current-biased Josephson junction showed macroscopic quantum tunnelling and energy quantization, the basis of superconducting qubits (Nobel Prize 2025).']
  ])
});

/* ===================================================================== */
LESSONS.push({
  id: 'josephson', n: 40.2, stage: SCQ, minutes: 15, title: 'The Josephson junction: a nonlinear inductor',
  lede: 'Two superconductors separated by a nanometre of oxide let Cooper pairs tunnel through. The result behaves like an inductor whose inductance depends on the current, and that one nonlinearity is what turns a resonator into a qubit.',
  html: `
<h2>Tunnelling Cooper pairs</h2>
<p>A superconductor is described by a single macroscopic wavefunction with a well-defined phase. A <strong>Josephson junction</strong> is two superconducting electrodes, almost always aluminium, separated by an insulating barrier of aluminium oxide about 1–2 nm thick. Cooper pairs tunnel coherently through it, and the junction is described by one variable, the <strong>phase difference</strong> ${m('φ')} across it. Brian Josephson predicted in 1962 that</p>
${EQ('I = I<sub>c</sub> sin φ,&nbsp;&nbsp; dφ/dt = 2eV/ħ')}
<p>where ${m('I<sub>c</sub>')} is the junction’s <strong>critical current</strong>, typically 10–50 nA for a qubit junction.</p>
<h2>An inductor that depends on the current</h2>
<p>Combine the two relations: a changing current gives ${m('dI/dt = I<sub>c</sub> cos φ · dφ/dt')}, and so a voltage ${m('V = L<sub>J</sub> dI/dt')} with</p>
${EQ('L<sub>J</sub>(φ) = Φ₀ / (2π I<sub>c</sub> cos φ)')}
<p>The junction is an inductor, but a nonlinear one: its inductance grows as more current flows. Its stored energy is ${m('U(φ) = −E<sub>J</sub> cos φ')}, with the <strong>Josephson energy</strong> ${m('E<sub>J</sub> = Φ₀I<sub>c</sub>/2π')}, about 15 GHz × ${m('h')} for 30 nA. Near ${m('φ = 0')}, ${m('L<sub>J</sub> ≈ Φ₀/2πI<sub>c</sub> ≈ 11')} nH, comparable to the inductor in [[L:lccircuit]]. Importantly, a junction has essentially no loss: it is a non-dissipative nonlinearity, which almost nothing else at microwave frequencies is.</p>
<h2>Replacing the inductor</h2>
<p>Put a junction where the inductor was and the Hamiltonian becomes</p>
${EQ('H = 4E<sub>C</sub> n² − E<sub>J</sub> cos φ')}
<p>Expanding the cosine, ${m('−E<sub>J</sub> cos φ ≈ −E<sub>J</sub> + E<sub>J</sub>φ²/2 − E<sub>J</sub>φ⁴/24')}. The first two terms are an LC oscillator with frequency ${m('√(8E<sub>J</sub>E<sub>C</sub>)')}, the <strong>plasma frequency</strong>. The quartic term softens the well, so higher levels sit lower than the harmonic ladder predicts. The gap from ${m('|1⟩')} to ${m('|2⟩')} is smaller than the gap from ${m('|0⟩')} to ${m('|1⟩')} by the <strong>anharmonicity</strong> ${m('α')}, which in the transmon regime is close to ${m('−E<sub>C</sub>')}, a couple of hundred megahertz. That is enough for a pulse at ${m('f₀₁')} to leave ${m('|2⟩')} alone.</p>
${LAB('well')}
<h2>Setting the junction: Ambegaokar–Baratoff</h2>
<p>The critical current is set by the oxide thickness and the junction area, typically 0.01–0.05 µm². A convenient fact makes fabrication manageable: ${m('I<sub>c</sub> R<sub>n</sub> = πΔ/2e')}, where ${m('R<sub>n</sub>')} is the junction’s normal-state resistance and ${m('Δ')} the superconducting gap (about 180 µeV for thin aluminium). Measuring the resistance at room temperature, before the chip is ever cooled, predicts ${m('E<sub>J</sub>')} and so the qubit frequency to within a few per cent.</p>
<h2>Tuning with a SQUID</h2>
<p>Two junctions in a small loop form a <strong>SQUID</strong> (superconducting quantum interference device). Magnetic flux ${m('Φ')} threading the loop makes the two junctions interfere, and the pair acts like one junction with a tunable energy</p>
${EQ('E<sub>J</sub>(Φ) = E<sub>JΣ</sub> |cos(πΦ/Φ₀)| √(1 + d² tan²(πΦ/Φ₀))')}
<p>where ${m('d')} measures the asymmetry between the two junctions. A current in a nearby on-chip flux line sets the qubit frequency, which is how flux-tunable processors bring qubits into resonance for two-qubit gates ([[L:cqedcouple]]). The price is sensitivity to <strong>flux noise</strong>, which has a 1/f spectrum of a few µΦ₀ and comes from magnetic defects on surfaces. At the top of the tuning curve, the <strong>sweet spot</strong>, the frequency is first-order insensitive to flux; away from it, flux noise dephases the qubit.</p>
${LAB('squid')}
`,
  labs: {
    well: {
      title: 'A cosine well and its uneven ladder',
      cap: 'The junction potential −E_J cos φ (solid) compared with the parabola of a linear inductor with the same inductance at φ = 0 (dashed). Solid lines are the transmon levels found by diagonalizing H = 4E_C n² − E_J cos φ; dashed lines are the evenly spaced levels of the matching LC oscillator. The softer cosine pulls every level down, and more so the higher it is.',
      build(body, id) {
        let r = 50, EC = .22;
        const cv = canvas('', 'height:300px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), EJ = r * EC, E = scTransmon(EJ, EC, 0, 5), wp = Math.sqrt(8 * EJ * EC), top = E[4] + EJ + .5 * wp;
          const A = axes(ctx, w, H, { x: [-Math.PI, Math.PI], y: [0, top], xt: [-3, -2, -1, 0, 1, 2, 3], yt: [0, Math.round(top / 2), Math.round(top)], yf: y => num(y, 0), xl: 'phase φ (rad)', yl: 'energy above the well bottom / h (GHz)' });
          const cosP = [], harP = []; for (let k = 0; k <= 240; k++) { const x = -Math.PI + TAU * k / 240; cosP.push([A.X(x), A.Y(EJ * (1 - Math.cos(x)))]); harP.push([A.X(x), A.Y(Math.min(top, EJ * x * x / 2))]); }
          polyline(ctx, harP, T.muted, 1.4, [5, 4]); polyline(ctx, cosP, T.ink, 2.2);
          for (let n = 0; n < 5; n++) {
            const Eh = wp * (n + .5), xh = Math.sqrt(2 * Eh / EJ); if (Eh < top) polyline(ctx, [[A.X(-xh), A.Y(Eh)], [A.X(xh), A.Y(Eh)]], T.muted, 1.2, [4, 3]);
            const Et = E[n] + EJ, c = 1 - Et / EJ, xt = Math.abs(c) <= 1 ? Math.acos(c) : Math.PI;
            polyline(ctx, [[A.X(-xt), A.Y(Et)], [A.X(xt), A.Y(Et)]], n < 2 ? T.copper : T.cyan, 2.4);
            txt(ctx, `|${n}⟩`, A.X(xt) + 8, A.Y(Et), { align: 'left', font: MATHFONT(14), color: T.ink });
          }
        });
        const upd = () => {
          const EJ = r * EC, E = scTransmon(EJ, EC, 0, 4), f01 = E[1] - E[0], f12 = E[2] - E[1];
          ro.innerHTML = `<span class="k">E_J/h                   </span>${num(EJ, 2)} GHz<br><span class="k">plasma frequency √(8E_JE_C) </span>${num(Math.sqrt(8 * EJ * EC), 3)} GHz<br><span class="k">f₀₁ (exact)             </span>${num(f01, 3)} GHz<br><span class="k">f₁₂ (exact)             </span>${num(f12, 3)} GHz<br><span class="k">anharmonicity α = f₁₂ − f₀₁ </span>${num((f12 - f01) * 1000, 0)} MHz &nbsp;(−E_C = ${num(-EC * 1000, 0)} MHz)`;
          p.inv();
        };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('r'), label: 'E_J / E_C', min: 5, max: 120, step: 1, value: r, fmt: v => String(v), on: v => { r = v; upd(); } }),
          slider({ id: id('c'), label: 'Charging energy E_C/h', min: .1, max: .4, step: .01, value: EC, fmt: v => num(v * 1000, 0) + ' MHz', on: v => { EC = v; upd(); } }), ro)));
        upd();
      }
    },
    squid: {
      title: 'Tuning a qubit with flux',
      cap: 'The qubit frequency f₀₁ against the flux through the SQUID loop, computed exactly from the transmon Hamiltonian with E_J(Φ). Drag the operating point along the curve. The slope sets how much a typical flux-noise fluctuation of 2 µΦ₀ moves the frequency: zero at the sweet spot, large on the flanks. A larger asymmetry d narrows the tuning range but keeps the slope small everywhere.',
      build(body, id) {
        let EJS = 22, EC = .22, dA = 0, phi = .15;
        const cv = canvas('', 'height:280px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const EJf = x => { const c = Math.cos(Math.PI * x), t = Math.tan(Math.PI * x); return EJS * Math.abs(c) * Math.sqrt(1 + dA * dA * t * t); };
        const f01 = x => { const E = scTransmon(EJf(x), EC, .25, 2); return E[1] - E[0]; };
        let curve = [];
        const recompute = () => { curve = []; for (let k = 0; k <= 160; k++) { const x = -1 + 2 * k / 160, xx = Math.abs(Math.abs(x) - .5) < 1e-6 ? x + 1e-6 : x; curve.push([x, f01(xx)]); } };
        let G = null;
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), fmax = Math.max(...curve.map(c => c[1])) * 1.06;
          const A = axes(ctx, w, H, { x: [-1, 1], y: [0, fmax], xt: [-1, -.5, 0, .5, 1], yt: [0, 2, 4, 6, 8].filter(v => v < fmax), xl: 'flux Φ / Φ₀', yl: 'f₀₁ (GHz)' }); G = A;
          polyline(ctx, curve.map(([x, f]) => [A.X(x), A.Y(f)]), T.cyan, 2.4);
          const f = f01(phi); dot(ctx, A.X(phi), A.Y(f), 7, T.copper, T.surface);
          const s = (f01(phi + 1e-3) - f01(phi - 1e-3)) / 2e-3, dx = .18; polyline(ctx, [[A.X(phi - dx), A.Y(f - s * dx)], [A.X(phi + dx), A.Y(f + s * dx)]], T.copper, 1.4, [4, 3]);
          txt(ctx, 'sweet spot', A.X(0), A.Y(curve[80][1]) - 12, { font: '600 10.5px "JetBrains Mono",monospace', color: T.good });
        });
        const upd = () => {
          const f = f01(phi), s = Math.abs(f01(phi + 1e-3) - f01(phi - 1e-3)) / 2e-3, df = s * 2e-6 * 1e6;
          ro.innerHTML = `<span class="k">operating point Φ/Φ₀ </span>${num(phi, 3)}<br><span class="k">f₀₁                  </span>${num(f, 3)} GHz<br><span class="k">slope |∂f/∂Φ|        </span>${num(s, 2)} GHz/Φ₀<br><span class="k">shift for 2 µΦ₀      </span>${num(df, 1)} kHz<br><span class="k">dephasing time scale ~1/(2π·shift) </span>${df < .05 ? 'flux-insensitive' : fmtSI(1 / (TAU * df * 1e3), 's', 1)}`;
          p.inv();
        };
        dragHandles(cv, () => 'p', (k, x) => { if (!G) return; phi = clamp(-1 + (x - G.L) / (G.R - G.L) * 2, -1, 1); if (Math.abs(Math.abs(phi) - .5) < .002) phi += .003; upd(); });
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('j'), label: 'Total E_JΣ/h', min: 8, max: 40, step: .5, value: EJS, fmt: v => num(v, 1) + ' GHz', on: v => { EJS = v; recompute(); upd(); } }),
          slider({ id: id('d'), label: 'Junction asymmetry d', min: 0, max: .7, step: .01, value: dA, fmt: v => num(v, 2), on: v => { dA = v; recompute(); upd(); } }),
          slider({ id: id('ph'), label: 'Operating flux Φ/Φ₀', min: -1, max: 1, step: .005, value: phi, fmt: v => num(v, 3), on: v => { phi = Math.abs(Math.abs(v) - .5) < .002 ? v + .003 : v; upd(); } }), ro)));
        recompute(); upd();
      }
    }
  },
  take: ['A Josephson junction is two superconductors separated by a thin oxide; Cooper pairs tunnel through it, giving I = I_c sin φ and dφ/dt = 2eV/ħ.',
    'It behaves as a lossless nonlinear inductor, L_J = Φ₀/(2πI_c cos φ), with energy −E_J cos φ.',
    'Replacing the inductor of an LC circuit with a junction softens the well, so levels are unevenly spaced; the anharmonicity is about −E_C.',
    'Two junctions in a loop (a SQUID) give a flux-tunable E_J; the sweet spot at the top of the tuning curve is first-order insensitive to flux noise.'],
  quiz: QZ([
    ['What is a Josephson junction in a superconducting qubit?', ['A semiconductor diode', 'Two superconducting electrodes separated by a thin insulating barrier', 'A small capacitor', 'A coil of wire'], 1, 'Qubit junctions are aluminium electrodes separated by about 1–2 nm of aluminium oxide, through which Cooper pairs tunnel.'],
    ['Which pair of relations describes an ideal junction?', ['V = IR and P = IV', 'I = I_c sin φ and dφ/dt = 2eV/ħ', 'Q = CV and Φ = LI', 'I = I_c φ and V = 0'], 1, 'These are the two Josephson relations: the supercurrent depends sinusoidally on the phase difference, and a voltage makes the phase wind.'],
    ['Why is the junction called a nonlinear inductor?', ['It has resistance', 'Its inductance L_J = Φ₀/(2πI_c cos φ) depends on the phase, and hence on the current', 'Its capacitance changes', 'It only works at high frequency'], 1, 'For a linear inductor L is constant. For a junction L_J changes with φ, so the energy is −E_J cos φ rather than a parabola.'],
    ['What is the Josephson energy E_J?', ['Φ₀I_c/2π', 'e²/2C', 'I_c R_n', '2eV'], 0, 'E_J = Φ₀I_c/2π = ħI_c/2e. For I_c = 30 nA this is about h × 15 GHz.'],
    ['What does the quartic term in the expansion of −E_J cos φ do to the levels?', ['Raises all of them equally', 'Softens the well, so higher levels sit progressively lower and the spacing shrinks', 'Makes them evenly spaced', 'Removes the ground state'], 1, 'The −E_Jφ⁴/24 term lowers the potential at larger φ. Higher levels, which spread further, are lowered more, giving negative anharmonicity.'],
    ['In the transmon regime the anharmonicity α is approximately', ['+E_J', '−E_C', '0', '−E_J'], 1, 'First-order perturbation theory in the quartic term gives α ≈ −E_C, typically −200 to −300 MHz.'],
    ['What does the Ambegaokar–Baratoff relation let fabricators do?', ['Measure T₁ at room temperature', 'Predict a junction’s critical current, and so the qubit frequency, from its room-temperature resistance', 'Avoid using aluminium', 'Remove flux noise'], 1, 'I_cR_n = πΔ/2e, so measuring R_n at room temperature gives I_c and E_J before the chip is cooled.'],
    ['What does a SQUID add to a transmon?', ['Higher anharmonicity', 'A flux-tunable Josephson energy, and therefore a tunable frequency', 'Lower temperature', 'A readout resonator'], 1, 'Flux through the loop makes the two junctions interfere: E_J(Φ) = E_JΣ|cos(πΦ/Φ₀)| for a symmetric SQUID.'],
    ['Why do flux-tunable qubits like to sit at the sweet spot?', ['It gives the highest anharmonicity', 'There ∂f/∂Φ = 0, so flux noise does not shift the frequency to first order', 'The qubit is easiest to read out there', 'It is the only frequency that works'], 1, 'Dephasing from flux noise scales with the slope of the tuning curve, which vanishes at its maximum.'],
    ['What does making the SQUID asymmetric (d > 0) do?', ['Removes the sweet spot', 'Limits the tuning range but lowers the slope away from the sweet spot, reducing flux-noise sensitivity', 'Doubles the frequency', 'Makes the qubit harmonic'], 1, 'With asymmetric junctions E_J never goes to zero, so the curve is flatter: less tunability but less flux-noise dephasing at most operating points.']
  ])
});

/* ===================================================================== */
LESSONS.push({
  id: 'transmon', n: 40.3, stage: SCQ, minutes: 16, title: 'From Cooper-pair box to transmon',
  lede: 'The first superconducting qubits were exquisitely sensitive to stray charges. Shunting the junction with a large capacitor fixed that, at the cost of a little anharmonicity, and produced the transmon, the workhorse of today’s processors.',
  html: `
<h2>The Cooper-pair box</h2>
<p>The first superconducting qubit with coherent oscillations (Nakamura, Pashkin and Tsai, 1999) was a <strong>Cooper-pair box</strong>: a tiny superconducting island connected to a reservoir through a junction, with a gate electrode nearby. Its Hamiltonian is</p>
${EQ('H = 4E<sub>C</sub> (n − n<sub>g</sub>)² − E<sub>J</sub> cos φ')}
<p>Here ${m('n')} counts Cooper pairs that have tunnelled onto the island and ${m('n<sub>g</sub>')} is the <strong>offset charge</strong>, set by the gate voltage and by any stray charges nearby, measured in units of ${m('2e')}. In the Cooper-pair box ${m('E<sub>J</sub>')} and ${m('E<sub>C</sub>')} are comparable, the energy levels depend strongly on ${m('n<sub>g</sub>')}, and the qubit frequency jumps whenever a charged defect in the substrate fluctuates. Coherence times were nanoseconds.</p>
<h2>Diagonalizing in the charge basis</h2>
<p>Since ${m('e<sup>iφ</sup>')} moves one Cooper pair across the junction, ${m('cos φ = ½ Σ (|n⟩⟨n+1| + |n+1⟩⟨n|)')}. In the basis of charge states ${m('|n⟩')}, the Hamiltonian is a tridiagonal matrix with ${m('4E<sub>C</sub>(n − n<sub>g</sub>)²')} on the diagonal and ${m('−E<sub>J</sub>/2')} beside it. A few dozen charge states are enough to compute the levels exactly, which is what the lab below does.</p>
<h2>The transmon idea</h2>
<p>Koch and colleagues (2007) noticed that the two quantities that matter scale very differently with ${m('E<sub>J</sub>/E<sub>C</sub>')}. The <strong>charge dispersion</strong>, how far a level moves as ${m('n<sub>g</sub>')} varies, falls exponentially:</p>
${EQ('ε<sub>m</sub> ∝ e<sup>−√(8E<sub>J</sub>/E<sub>C</sub>)</sup>')}
<p>while the anharmonicity falls only slowly, approaching ${m('α ≈ −E<sub>C</sub>')}. So add a large shunt capacitor, which lowers ${m('E<sub>C</sub>')} to about 200–300 MHz, and raise ${m('E<sub>J</sub>/E<sub>C</sub>')} to about 50. The charge sensitivity of the qubit frequency drops by many orders of magnitude, from gigahertz to around ten kilohertz (and below a kilohertz by E<sub>J</sub>/E<sub>C</sub> ≈ 80), and the anharmonicity is still large enough to address ${m('|0⟩ ↔ |1⟩')} selectively. The circuit became the <strong>transmon</strong> (transmission-line shunted plasma oscillation qubit).</p>
${LAB('koch')}
<h2>The transmon in numbers</h2>
<ul>
<li><strong>Frequency.</strong> ${m('f₀₁ ≈ √(8E<sub>J</sub>E<sub>C</sub>) − E<sub>C</sub>')}, typically 4–6 GHz.</li>
<li><strong>Anharmonicity.</strong> ${m('α ≈ −E<sub>C</sub>')}, about −200 to −300 MHz. It limits how fast gates can be before they leak into ${m('|2⟩')}; DRAG pulses push that limit ([[L:pulses]]).</li>
<li><strong>Shape.</strong> The shunt capacitor is two large metal pads or a cross (the <strong>Xmon</strong>), with total capacitance of 70–100 fF. Its electric field spreads through the substrate and surfaces, which is where most loss now comes from ([[L:scmaterials]]).</li>
<li><strong>Coherence.</strong> Early transmons reached about 1 µs; today ${m('T₁')} of 100–500 µs is routine and the best devices exceed a millisecond.</li>
</ul>
${NOTE('Why the transmon won', `<p>The transmon is simple: one junction (or a SQUID for tunability), a capacitor and nothing else. It is insensitive to charge noise, needs no bias at its sweet spot, and its weak anharmonicity is a manageable engineering problem. Google, IBM, Rigetti, the Chinese Zuchongzhi processors and many others are built on transmons or close relatives.</p>`)}
`,
  labs: {
    koch: {
      title: 'Charge dispersion against E_J / E_C',
      cap: 'Left: the lowest four levels against the offset charge n_g, computed exactly in the charge basis and normalized by the 0→1 energy at n_g = ½. At small E_J/E_C (a Cooper-pair box) the bands swing wildly with n_g; at E_J/E_C ≈ 50 (a transmon) they are flat. Right: on a log scale, the charge dispersion of the 0→1 transition falls exponentially while the anharmonicity barely changes.',
      build(body, id) {
        let lr = Math.log10(1), EC = .25;
        const cv = canvas('', 'height:290px'), cs = canvas('', 'height:290px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        let bands = null, scan = null;
        const disp = (r) => { const EJ = r * EC, a = scTransmon(EJ, EC, 0, 3), b = scTransmon(EJ, EC, .5, 3); return { e01: Math.abs((a[1] - a[0]) - (b[1] - b[0])), alpha: Math.abs((b[2] - b[1]) - (b[1] - b[0])), f01: (b[1] - b[0] + a[1] - a[0]) / 2 }; };
        const compute = () => {
          const r = 10 ** lr, EJ = r * EC, ref = scTransmon(EJ, EC, .5, 2), E01 = ref[1] - ref[0];
          bands = []; for (let k = 0; k <= 120; k++) { const ng = -1 + 2 * k / 120, E = scTransmon(EJ, EC, ng, 4); bands.push([ng, E.map(x => (x - ref[0]) / E01)]); }
          if (!scan) { scan = []; for (let k = 0; k <= 60; k++) { const rr = 10 ** (-.3 + 2.3 * k / 60); scan.push([rr, disp(rr)]); } }
        };
        const p1 = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), ymax = 4.2, ymin = Math.max(-1.6, Math.min(-.4, Math.min(...bands.map(b => b[1][0]))));
          const A = axes(ctx, w, H, { x: [-1, 1], y: [ymin, ymax], xt: [-1, -.5, 0, .5, 1], yt: [0, 1, 2, 3, 4], xl: 'offset charge n_g', yl: 'E_m / E₀₁' });
          const cols = [T.copper, T.cyan, T.muted, T.muted];
          ctx.save(); ctx.beginPath(); ctx.rect(A.L, A.T, A.R - A.L, A.B - A.T); ctx.clip();
          for (let m2 = 0; m2 < 4; m2++) polyline(ctx, bands.map(([ng, E]) => [A.X(ng), A.Y(E[m2])]), cols[m2], m2 < 2 ? 2.4 : 1.6);
          ctx.restore();
        });
        const p2 = painter(cs, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [.5, 200], y: [1e-6, 10], xlog: true, ylog: true, xt: [1, 10, 100], yt: [1e-6, 1e-4, 1e-2, 1], yf: v => v >= 1 ? String(v) : '10' + sup(Math.round(Math.log10(v))), xl: 'E_J / E_C', yl: 'GHz' });
          polyline(ctx, scan.map(([r, d]) => [A.X(r), A.Y(clamp(d.e01, 1e-6, 10))]), T.copper, 2.3);
          polyline(ctx, scan.map(([r, d]) => [A.X(r), A.Y(clamp(d.alpha, 1e-6, 10))]), T.cyan, 2.3);
          const r = 10 ** lr; polyline(ctx, [[A.X(r), A.T], [A.X(r), A.B]], T.ink, 1.2, [4, 3]);
          txt(ctx, 'charge dispersion', A.X(30), A.Y(3e-5), { font: '600 10.5px "JetBrains Mono",monospace', color: T.copper });
          txt(ctx, '|anharmonicity|', A.X(30), A.Y(.6), { font: '600 10.5px "JetBrains Mono",monospace', color: T.cyan });
        });
        const upd = () => {
          compute(); const r = 10 ** lr, d = disp(r);
          ro.innerHTML = `<span class="k">E_J/E_C </span>${num(r, r < 10 ? 2 : 1)} &nbsp; <span class="k">E_J/h </span>${num(r * EC, 2)} GHz<br><span class="k">f₀₁ (averaged over n_g)    </span>${num(d.f01, 3)} GHz<br><span class="k">anharmonicity |α|          </span>${num(d.alpha * 1000, 0)} MHz<br><span class="k">charge dispersion of f₀₁   </span>${d.e01 * 1e3 >= 1 ? num(d.e01 * 1000, 1) + ' MHz' : num(d.e01 * 1e6, d.e01 * 1e6 < 1 ? 3 : 1) + ' kHz'}<br><span class="k">regime </span>${r < 3 ? 'Cooper-pair box' : r < 20 ? 'in between' : 'transmon'}`;
          p1.inv(); p2.inv();
        };
        body.append(h('div', { class: 'split even' }, cv, cs), h('div', { class: 'split even' },
          h('div', { class: 'stack' }, slider({ id: id('r'), label: 'E_J / E_C (log scale)', min: -.3, max: 2.3, step: .01, value: lr, fmt: v => num(10 ** v, 10 ** v < 10 ? 2 : 1), on: v => { lr = v; upd(); } }),
            slider({ id: id('c'), label: 'Charging energy E_C/h', min: .15, max: .4, step: .01, value: EC, fmt: v => num(v * 1000, 0) + ' MHz', on: v => { EC = v; scan = null; upd(); } }),
            h('div', { class: 'btns' }, btn('Cooper-pair box (1)', () => { lr = 0; body.querySelector('input[type=range]').value = 0; body.querySelector('input[type=range]').dispatchEvent(new Event('input')); }, 'sm'),
              btn('Transmon (50)', () => { lr = Math.log10(50); const s = body.querySelector('input[type=range]'); s.value = lr; s.dispatchEvent(new Event('input')); }, 'sm'))), ro));
        upd();
      }
    }
  },
  take: ['The Cooper-pair box, H = 4E_C(n − n_g)² − E_J cos φ with E_J ≈ E_C, has levels that move with the offset charge n_g, so charge noise dephases it.',
    'In the charge basis the Hamiltonian is tridiagonal and easy to diagonalize exactly.',
    'Charge dispersion falls exponentially in √(8E_J/E_C) while the anharmonicity only approaches −E_C, so a large shunt capacitor (E_J/E_C ≈ 50) makes a charge-insensitive qubit: the transmon.',
    'Typical transmons have f₀₁ of 4–6 GHz, α of −200 to −300 MHz and T₁ of hundreds of microseconds.'],
  quiz: QZ([
    ['What does the offset charge n_g represent?', ['The number of qubits', 'The charge induced on the island by gate voltages and stray charges, in units of 2e', 'The Josephson energy', 'The temperature'], 1, 'n_g enters as 4E_C(n − n_g)²: it shifts the electrostatic energy. Stray charges in the environment make it fluctuate.'],
    ['Why did early Cooper-pair boxes have very short coherence times?', ['They were too cold', 'Their energy levels depended strongly on n_g, so fluctuating background charges shifted the qubit frequency', 'They had no junction', 'They were made of copper'], 1, 'With E_J ≈ E_C the charge dispersion is a sizeable fraction of the qubit frequency, so charge noise caused rapid dephasing.'],
    ['In the charge basis, what does cos φ do?', ['It is diagonal', 'It moves one Cooper pair across the junction: ½ Σ (|n⟩⟨n+1| + h.c.)', 'It measures the charge', 'It is zero'], 1, 'e^{iφ} shifts the charge by one Cooper pair, so cos φ couples neighbouring charge states with amplitude ½.'],
    ['How does charge dispersion scale with E_J/E_C?', ['Linearly', 'Exponentially down, as e^{−√(8E_J/E_C)}', 'It grows', 'Like 1/(E_J/E_C)'], 1, 'Koch et al. showed ε_m ∝ e^{−√(8E_J/E_C)}: tunnelling between neighbouring minima of the cosine is suppressed exponentially.'],
    ['How does the anharmonicity behave as E_J/E_C grows large?', ['It vanishes exponentially', 'It approaches −E_C, decreasing only slowly relative to the qubit frequency', 'It grows without bound', 'It becomes positive'], 1, 'The relative anharmonicity falls like (8E_J/E_C)^{−1/2}, algebraically, while the charge dispersion falls exponentially. That asymmetry is the transmon trade.'],
    ['What design change turns a Cooper-pair box into a transmon?', ['Removing the junction', 'Adding a large shunt capacitance to lower E_C', 'Adding a resistor', 'Cooling to 1 K'], 1, 'A big shunt capacitor reduces E_C = e²/2C_Σ to a few hundred megahertz, pushing E_J/E_C to around 50.'],
    ['Approximately, what is a transmon’s 0→1 frequency?', ['E_J', '√(8E_JE_C) − E_C', '4E_C', 'E_J/E_C'], 1, 'The plasma frequency √(8E_JE_C) minus a correction of about E_C from the quartic term.'],
    ['Which transmon property most directly limits single-qubit gate speed?', ['Its charge dispersion', 'Its anharmonicity, since short pulses have broad spectra that also drive 1→2', 'Its temperature', 'The flux quantum'], 1, 'A pulse much shorter than about 1/|α| excites |2⟩. DRAG and similar shaping allow gates of about 20 ns despite |α| ≈ 250 MHz.'],
    ['What is an Xmon?', ['A flux qubit', 'A transmon whose shunt capacitor is a cross shape, convenient for connecting to couplers and readout', 'A readout amplifier', 'A type of resonator'], 1, 'The Xmon (Barends et al., 2013) uses a cross-shaped capacitor whose arms couple to neighbouring qubits, a resonator and control lines.'],
    ['What are typical transmon T₁ times today?', ['About 1 ns', 'About 1 µs', 'Hundreds of microseconds, and above a millisecond in the best devices', 'About a minute'], 2, 'Better materials, surface treatment and geometry have pushed T₁ from about 1 µs in 2007 to hundreds of microseconds routinely.']
  ])
});

/* ===================================================================== */
LESSONS.push({
  id: 'fluxonium', n: 40.4, stage: SCQ, minutes: 15, title: 'Beyond the transmon: flux qubits and fluxonium',
  lede: 'Add a large inductance in parallel with the junction and the potential becomes a parabola with cosine ripples. Thread half a flux quantum through the loop and you get a double well with a low-frequency, strongly anharmonic and very long-lived qubit.',
  html: `
<h2>A junction in a loop</h2>
<p>Close a junction into a superconducting loop with an inductance ${m('L')}. External flux ${m('Φ<sub>ext</sub>')} through the loop enters the Hamiltonian as a phase offset ${m('φ<sub>ext</sub> = 2πΦ<sub>ext</sub>/Φ₀')}:</p>
${EQ('H = 4E<sub>C</sub> n² − E<sub>J</sub> cos(φ − φ<sub>ext</sub>) + ½ E<sub>L</sub> φ²')}
<p>This is an LC circuit ([[L:lccircuit]]) with a junction ([[L:josephson]]) added. The potential is a parabola with cosine ripples on it, and the flux slides the ripples sideways. At ${m('Φ<sub>ext</sub> = Φ₀/2')} the potential becomes a symmetric <strong>double well</strong>: the two lowest states are the symmetric and antisymmetric combinations of a fluxon sitting in the left or right well, which correspond to persistent current circulating clockwise or anticlockwise around the loop.</p>
<h2>Flux qubits</h2>
<p>The first circuits built on this idea (Mooij, Orlando and colleagues, 1999) were <strong>persistent-current flux qubits</strong>: a small loop interrupted by three junctions, with the double well formed by the junctions alone. They have large anharmonicity and strong coupling to magnetic fields, which makes them excellent for quantum annealers ([[L:annealing]]), where D-Wave uses related rf-SQUID qubits, but also sensitive to flux noise.</p>
<h2>Fluxonium</h2>
<p>Fluxonium (Manucharyan and colleagues, 2009) shunts a small junction with a <strong>superinductance</strong>: a chain of about a hundred larger junctions, or a strip of granular aluminium, whose inductance (hundreds of nanohenries) gives an impedance above the resistance quantum ${m('h/(2e)² ≈ 6.5')} kΩ. A large inductance means a small ${m('E<sub>L</sub>')}, typically below 1 GHz, alongside ${m('E<sub>J</sub>')} of a few gigahertz and ${m('E<sub>C</sub>')} near 1 GHz.</p>
<ul>
<li><strong>Low frequency.</strong> At half flux the qubit frequency is set by tunnelling through the barrier between the wells, often only 100 MHz to 1 GHz.</li>
<li><strong>Huge anharmonicity.</strong> The next transition is several gigahertz higher, so leakage is not a concern and gates can be fast relative to the qubit frequency.</li>
<li><strong>Long coherence.</strong> The two qubit states have little overlap, so their transition matrix elements are small and dielectric loss at low frequency is weak. ${m('T₁')} and ${m('T₂')} above a millisecond have been reported, along with single-qubit gate fidelities above 99.99%.</li>
<li><strong>Trade-offs.</strong> A qubit at a few hundred megahertz has a non-negligible thermal population even at 10 mK, so active reset matters, and two-qubit gates usually go through higher levels or a coupler.</li>
</ul>
${LAB('flux')}
<h2>Towards protected qubits</h2>
<p>Pushing the same ideas further leads to circuits whose qubit states are protected by symmetry from both charge and flux noise, such as the <strong>0–π qubit</strong>, which needs two degrees of freedom and very precise parameters. They are experimentally young, but they show the breadth of the design space: the transmon is one point in it, chosen for simplicity.</p>
`,
  labs: {
    flux: {
      title: 'Fluxonium potential, levels and spectrum',
      cap: 'Left: the potential −E_J cos(φ − φ_ext) + ½E_Lφ², the lowest four levels and the first three wavefunctions, computed on a fine phase grid. At Φ_ext = Φ₀/2 the lowest well splits into two equal halves and the ground and first excited states become even and odd combinations across them. Right: the 0→1 and 1→2 transition frequencies against external flux; the dot marks the current flux.',
      build(body, id) {
        let EJ = 5, EC = 1, EL = .8, fx = .5;
        const cv = canvas('', 'height:300px'), cs = canvas('', 'height:300px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        let R = null, spec = null;
        const span = 3 * Math.PI;
        const compute = (full) => {
          R = scPhaseGrid(EJ, EC, EL, TAU * fx, 4, true, 320, span);
          if (full) { spec = []; for (let k = 0; k <= 40; k++) { const x = k / 40, E = scPhaseGrid(EJ, EC, EL, TAU * x, 3, false, 220, span).E; spec.push([x, E[1] - E[0], E[2] - E[1]]); } }
        };
        const p1 = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), Umin = Math.min(...R.U), top = R.E[3] + .8 * (R.E[3] - R.E[0]) + .5;
          const A = axes(ctx, w, H, { x: [-span, span], y: [Umin - .3, top], xt: [-2, -1, 0, 1, 2].map(k => k * Math.PI), xf: v => { const k = Math.round(v / Math.PI); return k === 0 ? '0' : (k === 1 ? '' : k === -1 ? '−' : (k < 0 ? '−' : '') + Math.abs(k)) + 'π'; }, yt: [], xl: 'phase φ', yl: 'energy' });
          const pts = []; for (let i = 0; i < R.ph.length; i++) if (R.U[i] < top) pts.push([A.X(R.ph[i]), A.Y(R.U[i])]); else if (pts.length) { polyline(ctx, pts.splice(0), T.ink, 2); }
          polyline(ctx, pts, T.ink, 2);
          const sc = .9 * (R.E[1] - R.E[0] + .3);
          for (let n = 0; n < 4; n++) {
            const E = R.E[n]; let a = 0, b = R.ph.length - 1; while (a < b && R.U[a] > E) a++; while (b > a && R.U[b] > E) b--;
            polyline(ctx, [[A.X(R.ph[a]), A.Y(E)], [A.X(R.ph[b]), A.Y(E)]], rgba(T.ink, .45), 1.1);
            if (n < 3) { const psi = R.psi[n], mx = Math.max(...psi.map(Math.abs)) || 1, col = [T.copper, T.cyan, T.good][n]; polyline(ctx, Array.from(psi, (v, i) => [A.X(R.ph[i]), A.Y(E + v / mx * sc * .5)]), col, 2); }
            txt(ctx, `|${n}⟩`, A.R - 4, A.Y(E) - 8, { align: 'right', font: MATHFONT(13), color: T.ink });
          }
        });
        const p2 = painter(cs, ({ ctx, w, h: H }) => {
          const T = Theme.get(), ym = Math.max(...spec.map(s => s[2])) * 1.08;
          const A = axes(ctx, w, H, { x: [0, 1], y: [0, ym], xt: [0, .25, .5, .75, 1], yt: [0, 2, 4, 6, 8, 10].filter(v => v < ym), xl: 'Φ_ext / Φ₀', yl: 'frequency (GHz)' });
          polyline(ctx, spec.map(s => [A.X(s[0]), A.Y(s[1])]), T.copper, 2.4); polyline(ctx, spec.map(s => [A.X(s[0]), A.Y(s[2])]), T.cyan, 2);
          dot(ctx, A.X(fx), A.Y(R.E[1] - R.E[0]), 6, T.copper, T.surface);
          txt(ctx, 'f₀₁', A.X(.08), A.Y(spec[3][1]) - 12, { font: '600 11px "JetBrains Mono",monospace', color: T.copper }); txt(ctx, 'f₁₂', A.X(.08), A.Y(spec[3][2]) + 12, { font: '600 11px "JetBrains Mono",monospace', color: T.cyan });
        });
        const upd = full => {
          compute(full); const f01 = R.E[1] - R.E[0], f12 = R.E[2] - R.E[1], pth = Math.exp(-f01 / (KB_GHZ * .02));
          ro.innerHTML = `<span class="k">f₀₁              </span>${f01 < 1 ? num(f01 * 1000, 0) + ' MHz' : num(f01, 3) + ' GHz'}<br><span class="k">f₁₂              </span>${num(f12, 3)} GHz<br><span class="k">anharmonicity f₁₂ − f₀₁ </span>${num(f12 - f01, 2)} GHz<br><span class="k">thermal |1⟩ population at 20 mK </span>${pct(pth / (1 + pth), 1)}`;
          p1.inv(); p2.inv();
        };
        body.append(h('div', { class: 'split even' }, cv, cs), h('div', { class: 'split even' },
          h('div', { class: 'stack' },
            slider({ id: id('f'), label: 'External flux Φ_ext / Φ₀', min: 0, max: 1, step: .01, value: fx, fmt: v => num(v, 2), on: v => { fx = v; upd(false); } }),
            slider({ id: id('j'), label: 'E_J/h', min: 1, max: 9, step: .1, value: EJ, fmt: v => num(v, 1) + ' GHz', on: v => { EJ = v; upd(true); } })),
          h('div', { class: 'stack' },
            slider({ id: id('l'), label: 'E_L/h', min: .2, max: 3, step: .05, value: EL, fmt: v => num(v, 2) + ' GHz', on: v => { EL = v; upd(true); } }),
            slider({ id: id('c'), label: 'E_C/h', min: .5, max: 2, step: .05, value: EC, fmt: v => num(v, 2) + ' GHz', on: v => { EC = v; upd(true); } }), ro)));
        upd(true);
      }
    }
  },
  take: ['A junction in a loop with inductance L has H = 4E_C n² − E_J cos(φ − φ_ext) + ½E_Lφ²: a parabola with cosine ripples that external flux slides sideways.',
    'At half a flux quantum the potential is a symmetric double well; the qubit states are even and odd superpositions of persistent currents in opposite directions.',
    'Fluxonium uses a superinductance (small E_L) to get a low qubit frequency, multi-gigahertz anharmonicity and millisecond coherence.',
    'Its costs are thermal population at low frequency and more complex two-qubit gates; protected qubits such as the 0–π circuit push the same ideas further.'],
  quiz: QZ([
    ['How does external flux enter the Hamiltonian of a junction in a loop?', ['As a change in E_C', 'As a phase offset φ_ext = 2πΦ_ext/Φ₀ inside the cosine', 'It does not', 'As a new capacitor'], 1, 'Flux quantization around the loop ties the junction phase to the inductor phase and the applied flux, giving −E_J cos(φ − φ_ext).'],
    ['What happens to the potential at Φ_ext = Φ₀/2?', ['It becomes a single parabola', 'It becomes a symmetric double well', 'It disappears', 'It becomes flat'], 1, 'Half a flux quantum makes the cosine’s minima straddle φ = 0 symmetrically, so the lowest region of the potential has two equal wells.'],
    ['Physically, what are the two lowest states of a flux qubit at half flux?', ['Two charge states', 'Superpositions of persistent current flowing clockwise and anticlockwise around the loop', 'Two photons', 'Two spins'], 1, 'Each well corresponds to a fluxon on one side, which means a circulating current; tunnelling mixes them into even and odd states.'],
    ['What is a superinductance?', ['A very small inductor', 'An inductance large enough that its impedance exceeds the resistance quantum h/(2e)² ≈ 6.5 kΩ', 'A normal metal coil', 'A capacitor'], 1, 'Fluxonium needs hundreds of nanohenries with little stray capacitance, built from junction arrays or granular aluminium.'],
    ['Why is fluxonium’s frequency at half flux low?', ['Because E_C is huge', 'Because it is set by tunnelling between the two wells, which is exponentially suppressed by the barrier', 'Because it is cold', 'Because E_J = 0'], 1, 'The splitting between even and odd states is the tunnelling rate through the barrier between the wells, often 100 MHz to 1 GHz.'],
    ['What advantage does fluxonium’s large anharmonicity give?', ['Faster readout', 'Leakage to |2⟩ is negligible, so gates are not limited by leakage', 'It removes the need for cooling', 'It makes it harmonic'], 1, 'With f₁₂ several gigahertz above f₀₁, pulses at f₀₁ are far detuned from the next transition.'],
    ['Why can fluxonium have very long T₁?', ['It has no junction', 'The qubit states barely overlap, so transition matrix elements are small, and dielectric loss is weak at low frequency', 'It is made of copper', 'It is not coupled to anything'], 1, 'Small matrix elements of the charge operator between |0⟩ and |1⟩ and a low frequency reduce the decay rate from dielectric loss.'],
    ['What is a drawback of a qubit at a few hundred megahertz?', ['It cannot be measured', 'Its thermal excited-state population at 10–20 mK is not negligible, so it needs active reset', 'It decays instantly', 'It is charge sensitive'], 1, 'At 300 MHz, hf/k_B ≈ 14 mK, comparable to the fridge temperature, so the excited state holds roughly 20–30% of the population at 10–20 mK without reset.'],
    ['Which platform uses rf-SQUID flux qubits at large scale?', ['Trapped-ion computers', 'D-Wave quantum annealers', 'Photonic processors', 'NMR'], 1, 'D-Wave’s annealers are built from thousands of coupled rf-SQUID flux qubits.'],
    ['What is the 0–π qubit?', ['A transmon variant with one junction', 'A circuit with two degrees of freedom whose qubit states are protected by symmetry from both charge and flux noise', 'A readout amplifier', 'A fluxonium at zero flux'], 1, 'The 0–π circuit encodes states localized at φ = 0 and φ = π with disjoint support, giving intrinsic protection, at the price of demanding parameters.']
  ])
});

/* ===================================================================== */
LESSONS.push({
  id: 'scmaterials', n: 40.5, stage: SCQ, minutes: 16, title: 'Building the chip: materials, losses and frequency crowding',
  lede: 'A transmon’s lifetime is set by the tiny fraction of its electric field that sits in lossy surfaces, and a processor’s yield by how precisely hundreds of junctions hit their target frequencies.',
  html: `
<h2>How a qubit chip is made</h2>
<p>A superconducting processor starts as a wafer of high-resistivity silicon or sapphire. A superconducting film, aluminium, niobium or increasingly tantalum, is deposited and patterned into the capacitor pads, resonators and wiring. The junctions come last: electron-beam lithography opens a resist mask, aluminium is evaporated from one angle, the surface is oxidized in a controlled oxygen atmosphere, and a second layer is evaporated from another angle so the two overlap across the oxide (the <strong>Dolan bridge</strong> or <strong>Manhattan</strong> technique). Large processors add airbridges that tie ground planes together, through-silicon vias, and <strong>flip-chip</strong> bonding that puts qubits on one chip and wiring on another.</p>
<h2>Where the energy goes</h2>
<p>A qubit’s ${m('T₁')} is set by the sum of every loss channel:</p>
${EQ('1/T₁ = ω Σ<sub>i</sub> p<sub>i</sub> tan δ<sub>i</sub> + Γ<sub>Purcell</sub> + Γ<sub>qp</sub> + …')}
<p>The first term is <strong>dielectric loss</strong>. Each material ${m('i')} that the qubit’s electric field passes through stores a fraction ${m('p<sub>i</sub>')} of the energy, its <strong>participation ratio</strong>, and dissipates a fraction ${m('tan δ<sub>i</sub>')} per radian. The bulk substrate holds most of the energy but is very clean. The damage is done by nanometre-thin layers: the metal–air, metal–substrate and substrate–air interfaces, with native oxides and residues full of <strong>two-level systems</strong> (TLS), atomic-scale defects that absorb microwave photons. Their participation is only ${m('10⁻⁵')}–${m('10⁻⁴')}, but their loss tangent is about ${m('10⁻³')}.</p>
<p>Engineers attack both factors. Larger gaps between pads spread the field and lower surface participation. Better materials lower the loss tangent: switching to <strong>tantalum</strong>, whose native oxide is much less lossy than aluminium’s or niobium’s, gave transmons with ${m('T₁')} of 300–500 µs (Place et al., 2021; Wang et al., 2022). Other channels matter too: <strong>Purcell</strong> decay through the readout resonator, non-equilibrium <strong>quasiparticles</strong> (broken Cooper pairs) tunnelling through junctions, and even cosmic rays and natural radioactivity, which create bursts of quasiparticles that hit many qubits at once.</p>
${LAB('loss')}
<h2>Hitting the right frequency</h2>
<p>Junction critical currents vary from one junction to the next by a few per cent, because the oxide thickness and area fluctuate. For a transmon, ${m('f ∝ √E<sub>J</sub>')}, so a 2% spread in ${m('I<sub>c</sub>')} becomes about a 1% spread in frequency, roughly 50 MHz. That matters most for <strong>fixed-frequency</strong> architectures driven by cross-resonance ([[L:crossres]]), where neighbouring qubits must avoid specific frequency relations, called <strong>collisions</strong>: equal frequencies, one qubit’s ${m('f₀₁')} matching a neighbour’s ${m('f₁₂')}, and two-photon resonances. With hundreds of qubits, the chance that none collide falls quickly with the spread. IBM’s answer, through its Heron generation, combined a <strong>heavy-hex</strong> lattice, where each qubit has at most three neighbours, with laser annealing of junctions after fabrication, which trims their resistance and cuts the spread to about 15 MHz (Hertzberg et al., 2021). Tunable architectures avoid the problem with flux, at the cost of flux noise and wiring.</p>
${LAB('collide')}
`,
  labs: {
    loss: {
      title: 'A T₁ loss budget',
      cap: 'Each bar is the T₁ the qubit would have if that were the only loss channel (longer is better). Dielectric channels are ω·p·tan δ; Purcell and quasiparticle limits are set directly. The total T₁ combines the rates, so the shortest bar dominates. The participation ratios and loss tangents are representative values, not a specific device.',
      build(body, id) {
        const GEO = { compact: { SA: 4e-4, MS: 2e-4, MA: 2e-5, sub: .9 }, std: { SA: 1e-4, MS: 5e-5, MA: 5e-6, sub: .9 }, large: { SA: 3e-5, MS: 1.5e-5, MA: 1.5e-6, sub: .9 } };
        const MAT = { al: { SA: 1e-3, MS: 1e-3, MA: 3e-3, sub: 5e-8, name: 'Al on silicon' }, ta: { SA: 5e-4, MS: 5e-4, MA: 5e-4, sub: 1e-8, name: 'Ta on sapphire' } };
        let geo = 'std', mat = 'al', f = 5, Tp = 2, Tq = 1;
        const cv = canvas('', 'height:260px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const chans = () => { const g = GEO[geo], mt = MAT[mat], w = TAU * f * 1e9; return [
          ['substrate', 1 / (w * g.sub * mt.sub)], ['substrate–air', 1 / (w * g.SA * mt.SA)], ['metal–substrate', 1 / (w * g.MS * mt.MS)], ['metal–air', 1 / (w * g.MA * mt.MA)], ['Purcell', Tp * 1e-3], ['quasiparticles', Tq * 1e-3]]; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), cs = chans(), tot = 1 / cs.reduce((s, c) => s + 1 / c[1], 0);
          const rows = cs.concat([['total T₁', tot]]), L0 = 128, R0 = w - 70, X = v => L0 + (Math.log10(v) + 5) / 3.3 * (R0 - L0), rh = (H - 30) / rows.length;
          ctx.font = '500 10.5px "JetBrains Mono",monospace';
          [1e-5, 1e-4, 1e-3, 1e-2].forEach((v, i) => { const x = X(v); ctx.strokeStyle = T.line; ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, H - 26); ctx.stroke(); if (R0 - L0 < 260 && i % 2 === 0) return; txt(ctx, fmtSI(v, 's', 0), x, H - 14, { font: '500 10px "JetBrains Mono",monospace' }); });
          rows.forEach(([nm, t], i) => { const y = 6 + i * rh, last = i === rows.length - 1, xv = clamp(X(t), L0, R0); ctx.fillStyle = last ? T.copper : rgba(T.cyan, .75); ctx.fillRect(L0, y + 3, Math.max(2, xv - L0), rh - 8);
            txt(ctx, nm, L0 - 8, y + rh / 2, { align: 'right', font: (last ? '700' : '500') + ' 11px "JetBrains Mono",monospace', color: last ? T.ink : T.muted }); txt(ctx, fmtSI(t, 's', t < 1e-3 ? 0 : 1), xv + 6, y + rh / 2, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace', color: T.ink }); });
        });
        const upd = () => { const cs = chans(), tot = 1 / cs.reduce((s, c) => s + 1 / c[1], 0), worst = cs.reduce((a, b) => a[1] < b[1] ? a : b); ro.innerHTML = `<span class="k">total T₁ </span>${fmtSI(tot, 's', 0)} &nbsp; <span class="k">quality factor Q = ωT₁ </span>${sci(TAU * f * 1e9 * tot, 2)}<br><span class="k">largest loss </span>${worst[0]}`; p.inv(); };
        body.append(cv, h('div', { class: 'split even' },
          h('div', { class: 'stack' }, field('Materials', seg([{ v: 'al', label: 'Al on silicon' }, { v: 'ta', label: 'Ta on sapphire' }], mat, v => { mat = v; upd(); }, 'Materials')),
            field('Pad geometry', seg([{ v: 'compact', label: 'Compact' }, { v: 'std', label: 'Standard' }, { v: 'large', label: 'Large gaps' }], geo, v => { geo = v; upd(); }, 'Geometry')),
            slider({ id: id('f'), label: 'Qubit frequency', min: 3, max: 7, step: .1, value: f, fmt: v => num(v, 1) + ' GHz', on: v => { f = v; upd(); } })),
          h('div', { class: 'stack' }, slider({ id: id('p'), label: 'Purcell limit', min: .1, max: 10, step: .1, value: Tp, fmt: v => num(v, 1) + ' ms', on: v => { Tp = v; upd(); } }),
            slider({ id: id('q'), label: 'Quasiparticle limit', min: .1, max: 10, step: .1, value: Tq, fmt: v => num(v, 1) + ' ms', on: v => { Tq = v; upd(); } }), ro)));
        upd();
      }
    },
    collide: {
      title: 'Frequency collisions and yield',
      cap: 'A square grid of fixed-frequency transmons is designed with three frequencies repeating so that neighbours always differ. Fabrication adds Gaussian scatter. A chip counts as good only if every neighbouring pair avoids the collisions |Δ| < 17 MHz, |Δ| within 4 MHz of |α|/2 and |Δ| within 25 MHz of |α|, and stays close enough (|Δ| < |α|) for a fast cross-resonance gate. The curves show the fraction of good chips (Monte Carlo) against the scatter for three chip sizes. Real criteria include more conditions, so real yields are lower.',
      build(body, id) {
        let sigma = 30, step = 60, Lsel = 5;
        const alpha = .33, cv = canvas('', 'height:260px'), map = canvas('sq', 'max-width:240px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const collide = (a, b) => { const d = Math.abs(a - b); return d < .017 || Math.abs(d - alpha / 2) < .004 || Math.abs(d - alpha) < .025 || d > alpha; };
        const design = (i, j) => 5 + step / 1000 * ((i + 2 * j) % 3);
        const sample = (L, s) => { const f = []; for (let j = 0; j < L; j++) for (let i = 0; i < L; i++) f.push(design(i, j) + s / 1000 * randn()); return f; };
        const bad = (L, f) => { const out = []; for (let j = 0; j < L; j++) for (let i = 0; i < L; i++) { const k = j * L + i; if (i < L - 1 && collide(f[k], f[k + 1])) out.push([k, k + 1]); if (j < L - 1 && collide(f[k], f[k + L])) out.push([k, k + L]); } return out; };
        const yieldOf = (L, s, N = 260) => { let ok = 0; for (let t = 0; t < N; t++) if (!bad(L, sample(L, s)).length) ok++; return ok / N; };
        let curves = null, demo = null;
        const recompute = () => { curves = [3, 5, 8].map(L => { const pts = []; for (let s = 0; s <= 80; s += 5) pts.push([s, yieldOf(L, s)]); return [L, pts]; }); newDemo(); };
        const newDemo = () => { const f = sample(Lsel, sigma); demo = { f, bad: bad(Lsel, f) }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 80], y: [0, 1], xt: [0, 20, 40, 60, 80], yt: [0, .25, .5, .75, 1], yf: v => pct(v, 0), xl: 'frequency scatter σ (MHz)', yl: 'chips with no collisions' });
          const cols = { 3: T.cyan, 5: T.copper, 8: T.bad };
          curves.forEach(([L, pts]) => { polyline(ctx, pts.map(([s, y]) => [A.X(s), A.Y(y)]), cols[L], 2.3); txt(ctx, `${L * L} qubits`, A.X(pts[3][0]) + 4, A.Y(pts[3][1]) - 10, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace', color: cols[L] }); });
          polyline(ctx, [[A.X(sigma), A.T], [A.X(sigma), A.B]], T.ink, 1.3, [4, 3]);
        });
        const pm = painter(map, ({ ctx, w, h: H }) => {
          const T = Theme.get(), L = Lsel, g = Math.min(w, H) / (L + .5), o = (Math.min(w, H) - g * (L - 1)) / 2, P = k => [o + (k % L) * g, o + Math.floor(k / L) * g];
          const badSet = new Set(demo.bad.map(([a, b]) => a + ',' + b));
          for (let k = 0; k < L * L; k++) { const [x, y] = P(k); [[k + 1, k % L < L - 1], [k + L, k + L < L * L]].forEach(([q, ok]) => { if (!ok) return; const [x2, y2] = P(q), b = badSet.has(k + ',' + q); ctx.strokeStyle = b ? T.bad : T.line; ctx.lineWidth = b ? 4 : 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); }); }
          const cl = [T.cyan, T.copper, T.good]; for (let k = 0; k < L * L; k++) { const [x, y] = P(k), c = (k % L + 2 * Math.floor(k / L)) % 3; dot(ctx, x, y, Math.min(11, g * .26), cl[c], T.surface); }
        });
        const upd = full => { if (full) recompute(); else newDemo(); const y = yieldOf(Lsel, sigma, 500); ro.innerHTML = `<span class="k">this chip </span>${demo.bad.length ? `<b style="color:var(--bad)">${demo.bad.length} collision${demo.bad.length > 1 ? 's' : ''}</b>` : '<b style="color:var(--good)">no collisions</b>'}<br><span class="k">yield for ${Lsel * Lsel} qubits at σ = ${sigma} MHz </span>${pct(y, 0)}`; p.inv(); pm.inv(); };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' }, map, legendRow([['collision', 'var(--bad)']]))), h('div', { class: 'split even' },
          h('div', { class: 'stack' }, slider({ id: id('s'), label: 'Frequency scatter σ', min: 0, max: 80, step: 1, value: sigma, fmt: v => v + ' MHz', on: v => { sigma = v; upd(false); } }),
            slider({ id: id('d'), label: 'Design spacing between frequency groups', min: 30, max: 120, step: 5, value: step, fmt: v => v + ' MHz', on: v => { step = v; upd(true); } })),
          h('div', { class: 'stack' }, slider({ id: id('L'), label: 'Chip size (side)', min: 3, max: 8, step: 1, value: Lsel, fmt: v => `${v} × ${v}`, on: v => { Lsel = v; upd(false); } }), h('div', { class: 'btns' }, btn('Fabricate another chip', () => upd(false), 'sm')), ro)));
        upd(true);
      }
    }
  },
  take: ['Junctions are made by double-angle evaporation of aluminium with a controlled oxidation step; large processors add airbridges, vias and flip-chip bonding.',
    'Dielectric loss is ω Σ p_i tan δ_i: thin interface layers hold a tiny fraction of the energy but have large loss tangents from two-level-system defects.',
    'Wider gaps lower surface participation and better materials such as tantalum lower loss tangents; Purcell decay, quasiparticles and radiation add further channels.',
    'Junction scatter of a few per cent gives tens of megahertz of frequency spread; fixed-frequency lattices must avoid collisions, helped by sparse heavy-hex connectivity and laser annealing.'],
  quiz: QZ([
    ['How are the Josephson junctions in most superconducting qubits fabricated?', ['By ion implantation', 'By double-angle evaporation of aluminium with an oxidation step in between', 'By 3D printing', 'By growing a crystal'], 1, 'A suspended resist bridge (Dolan) or crossed trenches (Manhattan) let two evaporations from different angles overlap, with a thin oxide between them.'],
    ['What is a participation ratio p_i?', ['The fraction of qubits that work', 'The fraction of the qubit’s electric-field energy stored in material i', 'The junction transparency', 'The readout fidelity'], 1, 'Dielectric loss from a material is weighted by how much of the mode’s energy lives in it.'],
    ['Why do nanometre-thin surface layers dominate loss?', ['They hold most of the energy', 'Despite tiny participation (10⁻⁵–10⁻⁴), their loss tangents are large (about 10⁻³) because of two-level-system defects', 'They are superconducting', 'They are too cold'], 1, 'The product p·tan δ for surfaces exceeds that of the much cleaner bulk substrate.'],
    ['What are two-level systems (TLS) in this context?', ['The qubits themselves', 'Atomic-scale defects in amorphous oxides and interfaces that absorb microwave energy', 'Readout resonators', 'Pairs of qubits'], 1, 'Tunnelling atoms or electrons in disordered materials form two-level defects that couple to the qubit’s electric field and absorb energy.'],
    ['How does widening the gap between capacitor pads affect T₁?', ['It reduces T₁', 'It spreads the field out, lowering surface participation and usually raising T₁', 'It has no effect', 'It changes the qubit into a fluxonium'], 1, 'Surface participation scales roughly inversely with the gap, at the cost of a larger qubit footprint.'],
    ['Why did tantalum films improve transmon coherence?', ['Tantalum has no oxide', 'Its native oxide is much less lossy than those of aluminium or niobium', 'It is a better conductor at room temperature', 'It raises the qubit frequency'], 1, 'Tantalum-based transmons showed T₁ of 300–500 µs, attributed to a lower-loss surface oxide.'],
    ['What are quasiparticles, and why do they matter?', ['Photons in the resonator', 'Broken Cooper pairs that can tunnel through a junction and cause the qubit to decay', 'Magnetic vortices', 'Phonons in the substrate only'], 1, 'Non-equilibrium quasiparticles, generated by stray radiation or high-energy events, cause T₁ decay and correlated errors.'],
    ['Why do cosmic rays and natural radioactivity concern error correction?', ['They heat the fridge', 'They deposit energy that creates quasiparticles across the chip, causing correlated errors on many qubits at once', 'They change the flux quantum', 'They only affect readout'], 1, 'Correlated bursts violate the independent-error assumption of codes; mitigations include phonon traps, gap engineering and shielding.'],
    ['Why does junction scatter matter most for fixed-frequency architectures?', ['Because they cannot be read out', 'Because their frequencies cannot be tuned after fabrication, so neighbours that land in collision conditions stay broken', 'Because they use more flux lines', 'Because they have higher anharmonicity'], 1, 'Cross-resonance gates require specific detunings between neighbours. Without tunability, a collision can only be fixed by trimming the junction.'],
    ['How does IBM reduce frequency collisions?', ['By using more neighbours per qubit', 'With a heavy-hex lattice (at most three neighbours) and laser annealing to trim junctions after fabrication', 'By cooling below 1 mK', 'By using fluxonium only'], 1, 'Fewer neighbours means fewer collision conditions, and laser annealing cuts the frequency scatter to about 15 MHz.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['LC oscillator', 'An inductor and capacitor in a loop; quantized, a harmonic oscillator with flux as position and charge as momentum.', 'lccircuit'],
  ['Flux quantum', 'Φ₀ = h/2e ≈ 2.07 × 10⁻¹⁵ Wb, the unit of magnetic flux in superconducting loops.', 'lccircuit'],
  ['Charging energy', 'E_C = e²/2C, the electrostatic energy scale of a circuit; a Cooper pair costs 4E_C.', 'lccircuit'],
  ['Josephson junction', 'Two superconductors separated by a thin barrier through which Cooper pairs tunnel; a lossless nonlinear inductor.', 'josephson'],
  ['Josephson energy', 'E_J = Φ₀I_c/2π, the energy scale of the junction potential −E_J cos φ.', 'josephson'],
  ['SQUID', 'Two junctions in a loop; the flux through the loop tunes the effective Josephson energy.', 'josephson'],
  ['Sweet spot', 'An operating point where a qubit’s frequency is first-order insensitive to a noise source such as flux.', 'josephson'],
  ['Cooper-pair box', 'A small superconducting island coupled through a junction, with E_J ≈ E_C; the first coherent superconducting qubit, very charge sensitive.', 'transmon'],
  ['Transmon', 'A Josephson junction shunted by a large capacitor (E_J/E_C ≈ 50), making it insensitive to charge noise with anharmonicity near −E_C.', 'transmon'],
  ['Charge dispersion', 'How much a superconducting qubit’s energy levels move with offset charge; suppressed exponentially in √(8E_J/E_C).', 'transmon'],
  ['Fluxonium', 'A small junction shunted by a superinductance; at half flux, a low-frequency, highly anharmonic qubit with long coherence.', 'fluxonium'],
  ['Superinductance', 'An inductance whose impedance exceeds h/(2e)² ≈ 6.5 kΩ, built from junction arrays or granular aluminium.', 'fluxonium'],
  ['Participation ratio', 'The fraction of a mode’s electric-field energy stored in a given material or interface.', 'scmaterials'],
  ['Two-level system (TLS)', 'An atomic-scale defect in an amorphous material that absorbs microwave energy and limits qubit coherence.', 'scmaterials'],
  ['Frequency collision', 'A forbidden frequency relation between neighbouring fixed-frequency qubits that spoils gates or causes crosstalk.', 'scmaterials']
);
})();
