/* =====================================================================
   Track · Circuit quantum electrodynamics
   Jaynes–Cummings physics, the dispersive regime, coupling qubits,
   cross-resonance gates and bosonic modes in 3D cavities
   ===================================================================== */
(() => {
const CQED = 13;
const lf = (n) => { let s = 0; for (let k = 2; k <= n; k++) s += Math.log(k); return s; };
const poisson = (nb, n) => nb <= 0 ? (n === 0 ? 1 : 0) : Math.exp(-nb + n * Math.log(nb) - lf(n));
const thermalP = (nb, n) => Math.pow(nb, n) / Math.pow(1 + nb, n + 1);

/* ===================================================================== */
LESSONS.push({
  id: 'jaynes', n: 41.1, stage: CQED, minutes: 15, title: 'An atom and a photon on a chip: the Jaynes–Cummings model',
  lede: 'Put a qubit inside a microwave resonator and it behaves like an atom in a mirrored cavity, except that the coupling is enormous. Single photons and the qubit trade energy back and forth hundreds of times before either is lost.',
  html: `
<h2>Cavity QED, moved onto a chip</h2>
<p>In <strong>cavity quantum electrodynamics</strong> an atom sits between two mirrors and exchanges energy with a single mode of light. Serge Haroche (with Rydberg atoms in microwave cavities) and David Wineland (with trapped ions) shared the 2012 Nobel Prize for experiments of this kind. In 2004 Blais and colleagues proposed doing the same with a superconducting qubit and an on-chip resonator, and Wallraff and colleagues demonstrated it the same year. The field is called <strong>circuit QED</strong>, and it is how every superconducting qubit is controlled, coupled and measured.</p>
<p>The resonator is usually a stretch of coplanar waveguide, a centre conductor between two ground planes, a few millimetres long, resonating at 4–8 GHz ([[L:lccircuit]]). The qubit is a transmon ([[L:transmon]]) placed at a voltage antinode. Two things make the coupling strong: the transmon is a huge “atom”, with a dipole moment thousands of times larger than a real atom’s, and the one-dimensional resonator squeezes the field into a tiny volume.</p>
<h2>The Jaynes–Cummings Hamiltonian</h2>
<p>Treat the qubit as a two-level atom with frequency ${m('ω<sub>q</sub>')} and the resonator as a harmonic oscillator with frequency ${m('ω<sub>r</sub>')}. Coupled by an exchange term of strength ${m('g')}, they obey</p>
${EQ('H/ħ = ω<sub>r</sub> a†a + ω<sub>q</sub> σ<sub>+</sub>σ<sub>−</sub> + g (a†σ<sub>−</sub> + a σ<sub>+</sub>)')}
<p>The coupling either moves an excitation from the qubit into the resonator (${m('a†σ<sub>−</sub>')}) or back (${m('aσ<sub>+</sub>')}). It conserves the total number of excitations, so the Hamiltonian splits into two-by-two blocks spanned by ${m('|e, n−1⟩')} and ${m('|g, n⟩')}. Within each block the coupling is ${m('g√n')}, and with detuning ${m('Δ = ω<sub>q</sub> − ω<sub>r</sub>')} the two energies are</p>
${EQ('E<sub>n,±</sub> = nω<sub>r</sub> + Δ/2 ± √(Δ²/4 + n g²)')}
<h2>Strong coupling</h2>
<p>At resonance, ${m('Δ = 0')}, the states ${m('|e,0⟩')} and ${m('|g,1⟩')} hybridize into two dressed states split by ${m('2g')}, the <strong>vacuum Rabi splitting</strong>. In time, an excitation placed in the qubit oscillates into the resonator and back at frequency ${m('2g')}. This is only visible if ${m('g')} beats both the resonator’s photon loss rate ${m('κ')} and the qubit’s decay rate ${m('γ')}: the <strong>strong-coupling regime</strong>. Circuit QED reaches ${m('g/2π')} of 50–300 MHz with ${m('κ/2π')} below a megahertz, ratios of hundreds that atomic cavity QED struggles to reach.</p>
<p>The ${m('√n')} in the splitting is the signature of a quantized field. A classical field would make the splitting grow smoothly with amplitude; with photons it climbs the <strong>Jaynes–Cummings ladder</strong> in steps of ${m('√1, √2, √3, …')}, which Fink and colleagues observed directly in 2008. Start the qubit excited with a coherent field in the resonator and the different photon numbers oscillate at incommensurate rates: the oscillations <strong>collapse</strong> and, because the photon numbers are discrete, later <strong>revive</strong>.</p>
${LAB('jc')}
${NOTE('When the model breaks', `<p>The Jaynes–Cummings form drops terms like ${m('a†σ<sub>+</sub>')} (the rotating-wave approximation), valid while ${m('g ≪ ω')}. Circuits can reach the <strong>ultrastrong</strong> regime, ${m('g/ω > 0.1')}, where those terms matter. A transmon also has more than two levels, which changes the dispersive physics in [[L:dispersive]].</p>`)}
`,
  labs: {
    jc: {
      title: 'Vacuum Rabi splitting and the Jaynes–Cummings ladder',
      cap: 'Left: the two dressed energies of the n-excitation block, measured from nω_r, against the qubit–resonator detuning; dashed lines are the uncoupled states. The gap at resonance is 2g√n. Right: the probability that the qubit is excited over time, starting from |e⟩ with either an exact photon number or a coherent field. With a coherent field the oscillations collapse and then revive. Losses (κ, γ) are left out.',
      build(body, id) {
        let g = 50, Dl = 0, nb = 0, mode = 'fock', man = 1;
        const cs = canvas('', 'height:260px'), ct = canvas('', 'height:260px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const Pe = t => {
          if (mode === 'fock') { const n = nb, Om = Math.sqrt(Dl * Dl / 4 + (n + 1) * g * g); return 1 - (n + 1) * g * g / (Om * Om) * Math.sin(TAU * Om * t) ** 2; }
          let s = 0, nmax = Math.ceil(nb + 7 * Math.sqrt(nb) + 8);
          for (let n = 0; n <= nmax; n++) { const p = poisson(nb, n); if (p < 1e-9) continue; const Om = Math.sqrt(Dl * Dl / 4 + (n + 1) * g * g); s += p * (1 - (n + 1) * g * g / (Om * Om) * Math.sin(TAU * Om * t) ** 2); }
          return s;
        };
        const tmax = () => mode === 'coh' && nb >= 1 ? 1.35 * Math.sqrt(nb) / g : 3 / (2 * Math.sqrt(Dl * Dl / 4 + (nb + 1) * g * g));
        const p1 = painter(cs, ({ ctx, w, h: H }) => {
          const T = Theme.get(), X = 400, Ym = Math.max(260, g * Math.sqrt(man) * 1.6 + 200);
          const A = axes(ctx, w, H, { x: [-X, X], y: [-Ym, Ym], xt: [-400, -200, 0, 200, 400], yt: [-200, 0, 200].filter(v => Math.abs(v) < Ym), xl: 'detuning Δ/2π (MHz)', yl: 'E − nω_r (MHz)' });
          polyline(ctx, [[A.X(-X), A.Y(0)], [A.X(X), A.Y(0)]], T.muted, 1.2, [5, 4]); polyline(ctx, [[A.X(-X), A.Y(-X)], [A.X(X), A.Y(X)]], T.muted, 1.2, [5, 4]);
          for (const sgn of [1, -1]) { const pts = []; for (let k = 0; k <= 200; k++) { const d = -X + 2 * X * k / 200; pts.push([A.X(d), A.Y(d / 2 + sgn * Math.sqrt(d * d / 4 + man * g * g))]); } polyline(ctx, pts, sgn > 0 ? T.copper : T.cyan, 2.4); }
          const gap = 2 * Math.sqrt(Dl * Dl / 4 + man * g * g); arrow(ctx, A.X(Dl), A.Y(Dl / 2), A.X(Dl), A.Y(Dl / 2 + gap / 2) + 2, T.ink, 1.4, 6); arrow(ctx, A.X(Dl), A.Y(Dl / 2), A.X(Dl), A.Y(Dl / 2 - gap / 2) - 2, T.ink, 1.4, 6);
          txt(ctx, `|g,${man}⟩`, A.X(-X) + 30, A.Y(0) - 10, { font: MATHFONT(13), color: T.ink }); txt(ctx, `|e,${man - 1}⟩`, A.X(-X) + 40, A.Y(-X + 40) - 14, { font: MATHFONT(13), color: T.ink });
        });
        const p2 = painter(ct, ({ ctx, w, h: H }) => {
          const T = Theme.get(), tm = tmax(), A = axes(ctx, w, H, { x: [0, tm * 1000], y: [0, 1], xt: [0, tm * 250, tm * 500, tm * 750, tm * 1000].map(v => +v.toFixed(0)), yt: [0, .5, 1], yf: v => num(v, 1), xl: 'time (ns)', yl: 'P(qubit excited)' });
          const pts = []; for (let k = 0; k <= 700; k++) { const t = tm * k / 700; pts.push([A.X(t * 1000), A.Y(Pe(t))]); } polyline(ctx, pts, T.copper, 1.8);
          if (mode === 'coh' && nb >= 1) { const tr = Math.sqrt(nb) / g; polyline(ctx, [[A.X(tr * 1000), A.T], [A.X(tr * 1000), A.B]], T.good, 1.2, [4, 3]); txt(ctx, 'revival', A.X(tr * 1000), A.T + 8, { font: '600 10.5px "JetBrains Mono",monospace', color: T.good }); }
        });
        const upd = () => {
          const split = 2 * Math.sqrt(Dl * Dl / 4 + man * g * g);
          ro.innerHTML = `<span class="k">splitting in block n = ${man} </span>${num(split, 1)} MHz &nbsp;(2g√n = ${num(2 * g * Math.sqrt(man), 1)} at resonance)<br><span class="k">vacuum Rabi period 1/(2g) </span>${num(1000 / (2 * g), 1)} ns` + (mode === 'coh' && nb >= 1 ? `<br><span class="k">revival time ≈ 2π√n̄ / g    </span>${num(1000 * Math.sqrt(nb) / g, 0)} ns` : '');
          p1.inv(); p2.inv();
        };
        const nbS = slider({ id: id('n'), label: 'Photons n (or mean n̄)', min: 0, max: 12, step: 1, value: nb, fmt: v => String(v), on: v => { nb = v; upd(); } });
        body.append(h('div', { class: 'split even' }, cs, ct), h('div', { class: 'split even' },
          h('div', { class: 'stack' }, slider({ id: id('g'), label: 'Coupling g/2π', min: 10, max: 200, step: 1, value: g, fmt: v => v + ' MHz', on: v => { g = v; upd(); } }),
            slider({ id: id('d'), label: 'Detuning Δ/2π', min: -400, max: 400, step: 5, value: Dl, fmt: v => v + ' MHz', on: v => { Dl = v; upd(); } }),
            field('Block shown on the left', seg([1, 2, 3, 4].map(v => ({ v, label: 'n = ' + v })), man, v => { man = v; upd(); }, 'Excitation block'))),
          h('div', { class: 'stack' }, field('Field in the resonator', seg([{ v: 'fock', label: 'Exact photon number' }, { v: 'coh', label: 'Coherent field' }], mode, v => { mode = v; if (v === 'coh' && nb < 4) { nb = 6; nbS.set(6); } upd(); }, 'Field')), nbS, ro)));
        upd();
      }
    }
  },
  take: ['Circuit QED puts a superconducting qubit in an on-chip microwave resonator; the transmon’s large dipole and the resonator’s small mode volume make the coupling g very strong.',
    'The Jaynes–Cummings Hamiltonian conserves excitations, splitting into blocks {|e,n−1⟩, |g,n⟩} coupled by g√n.',
    'At resonance the dressed states are split by 2g√n; the vacuum Rabi splitting 2g is resolved when g exceeds the loss rates κ and γ (strong coupling).',
    'The √n ladder and the collapse and revival of Rabi oscillations with a coherent field show that the resonator field is quantized.'],
  quiz: QZ([
    ['What plays the role of the atom and the cavity in circuit QED?', ['A laser and a mirror', 'A superconducting qubit and an on-chip microwave resonator', 'An ion and a trap', 'Two resonators'], 1, 'The transmon is an artificial atom and a coplanar-waveguide resonator is the cavity.'],
    ['Why is the coupling in circuit QED so much stronger than in atomic cavity QED?', ['The fridge is colder', 'The transmon has an enormous dipole moment and the 1D resonator confines the field to a tiny volume', 'Microwaves are faster than light', 'Superconductors amplify the field'], 1, 'g scales with the dipole moment times the vacuum field; both are large on a chip.'],
    ['What does the term g(a†σ₋ + aσ₊) do?', ['Measures the qubit', 'Exchanges an excitation between qubit and resonator while conserving the total number', 'Creates two photons', 'Heats the resonator'], 1, 'a†σ₋ moves an excitation from qubit to resonator, aσ₊ moves it back.'],
    ['Within the block {|e,n−1⟩, |g,n⟩}, what is the coupling?', ['g', 'g√n', 'gn', 'g/n'], 1, 'The resonator matrix element ⟨n|a†|n−1⟩ = √n multiplies g.'],
    ['What is the vacuum Rabi splitting?', ['The splitting of |g,0⟩', 'The 2g splitting between dressed states of |e,0⟩ and |g,1⟩ at resonance', 'The qubit anharmonicity', 'The readout shift'], 1, 'With one excitation and Δ = 0, the dressed states (|e,0⟩ ± |g,1⟩)/√2 are separated by 2g.'],
    ['What defines the strong-coupling regime?', ['g > ω', 'g larger than the photon loss rate κ and the qubit decay rate γ', 'g = 0', 'κ > g'], 1, 'Only then can an excitation swap between qubit and resonator several times before it is lost.'],
    ['Why is the √n spacing of the Jaynes–Cummings ladder important?', ['It proves the qubit has two levels', 'It is a signature of a quantized field: splittings grow in discrete √n steps', 'It sets the readout frequency', 'It is a fabrication error'], 1, 'A classical field would give smoothly varying splittings; observing √1, √2, √3 shows photons.'],
    ['Why do Rabi oscillations collapse when the resonator holds a coherent field?', ['The qubit decays', 'Each photon number oscillates at its own frequency g√(n+1), and the mixture dephases', 'The field disappears', 'The detuning grows'], 1, 'A coherent state is a superposition of photon numbers with Poisson weights, each with a different Rabi frequency.'],
    ['Why do the oscillations later revive?', ['Because energy is added', 'Because photon numbers are discrete, the phases of neighbouring terms realign after a time of order 2π√n̄/g', 'Because the qubit is reset', 'They never revive'], 1, 'Discreteness means the terms rephase. A classical continuous field would collapse forever.'],
    ['When does the rotating-wave approximation behind the Jaynes–Cummings model fail?', ['When g ≪ ω', 'In the ultrastrong regime, g/ω above about 0.1', 'At zero temperature', 'When Δ = 0'], 1, 'Counter-rotating terms like a†σ₊ become important when the coupling is a sizeable fraction of the bare frequencies.']
  ])
});

/* ===================================================================== */
LESSONS.push({
  id: 'dispersive', n: 41.2, stage: CQED, minutes: 16, title: 'The dispersive regime: χ, Stark shifts and photon counting',
  lede: 'Detune the qubit far from the resonator and they stop exchanging energy, but each still shifts the other’s frequency. That one effect underlies readout, photon counting, and some of the most important noise in a processor.',
  html: `
<h2>Far from resonance</h2>
<p>When the detuning is large, ${m('|Δ| ≫ g')}, an excitation cannot hop between qubit and resonator without violating energy conservation. It still borrows energy briefly, and the result, worked out by a unitary transformation that removes the exchange term to first order, is the <strong>dispersive Hamiltonian</strong>:</p>
${EQ('H/ħ ≈ (ω<sub>r</sub> + χσ<sub>z</sub>) a†a + ½ (ω<sub>q</sub> + χ) σ<sub>z</sub>,&nbsp;&nbsp; χ = g²/Δ')}
<p>Read it two ways. Grouped with ${m('a†a')}: the resonator frequency is ${m('ω<sub>r</sub> ± χ')} depending on the qubit state. That is <strong>dispersive readout</strong> ([[L:readout]]). Grouped with ${m('σ<sub>z</sub>')}: the qubit frequency shifts by ${m('2χ')} for every photon in the resonator, the <strong>ac Stark shift</strong>, and by ${m('χ')} even in the vacuum, the <strong>Lamb shift</strong>.</p>
<h2>A transmon is not a two-level atom</h2>
<p>The transmon’s third level matters, because its ${m('|1⟩ → |2⟩')} transition is only ${m('|α|')} away from ${m('|0⟩ → |1⟩')}. Including it (Koch et al., 2007) gives</p>
${EQ('χ = g² α / (Δ (Δ + α))')}
<p>For large detuning this is much smaller than ${m('g²/Δ')}, by about ${m('|α|/Δ')}. Between the two transitions, when the resonator frequency lies between ${m('f₁₂')} and ${m('f₀₁')}, the <strong>straddling regime</strong>, χ changes sign and becomes large. Typical readout designs use ${m('g/2π ≈ 50–150')} MHz and ${m('Δ/2π ≈ 1–2')} GHz, giving ${m('χ/2π')} of 0.5–5 MHz.</p>
${LAB('chi')}
<h2>Costs of being coupled</h2>
<ul>
<li><strong>Purcell decay.</strong> The qubit keeps a small resonator component, of weight ${m('(g/Δ)²')}, so it inherits a share of the resonator’s loss: ${m('γ<sub>P</sub> ≈ κ (g/Δ)²')}. Purcell filters block this channel ([[L:readout]]).</li>
<li><strong>Measurement-induced dephasing.</strong> Photons in the resonator carry information about the qubit, so they dephase it. For a resonator holding ${m('n̄')} photons, ${m('Γ<sub>m</sub> = 2κχ²n̄/(κ²/4 + χ²)')}, which is ${m('8χ²n̄/κ')} when ${m('χ ≪ κ')}. This is the useful part of measurement, but it also means stray photons are harmful.</li>
<li><strong>Thermal photons.</strong> Even 0.1% of a thermal photon in the readout resonator randomly Stark-shifts the qubit and is often a leading source of dephasing; it is why readout lines are heavily attenuated and filtered ([[L:cryostat]]).</li>
<li><strong>The dispersive approximation breaks down</strong> as the photon number approaches the critical value ${m('n<sub>crit</sub> = Δ²/4g²')}; drive harder and the measurement causes unwanted transitions.</li>
</ul>
<h2>Counting photons with a qubit</h2>
<p>If ${m('2χ')} exceeds the resonator linewidth ${m('κ')} and the qubit linewidth, the <strong>strong dispersive regime</strong>, the qubit’s spectrum splits into separate lines, one for each photon number, at ${m('ω<sub>q</sub> + 2χn')}. The height of each line is the probability of that photon number (Schuster et al., 2007). The qubit becomes a photon counter, and a pulse at one of those lines flips the qubit only if the resonator holds exactly ${m('n')} photons. That conditional control is the basis of the bosonic encodings in [[L:cavities]].</p>
${LAB('pns')}
`,
  labs: {
    chi: {
      title: 'Dispersive shift: two-level atom versus transmon',
      cap: 'The dispersive shift χ against the qubit–resonator detuning Δ = ω_q − ω_r, for a two-level atom (g²/Δ, dashed) and a transmon (g²α/(Δ(Δ+α)), solid). The shaded band is the straddling regime, where χ is large and changes sign. Near Δ = 0 and Δ = −α the formulas break down (the qubit is no longer dispersive) and the curves are clipped. Move the marker to read χ, the Purcell limit and the critical photon number.',
      build(body, id) {
        let g = 80, al = -250, D = 1200, kap = 1;
        const cv = canvas('', 'height:280px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const chiT = d => g * g * al / (d * (d + al)), chi2 = d => g * g / d;
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), Ym = 12, A = axes(ctx, w, H, { x: [-2000, 2000], y: [-Ym, Ym], xt: [-2000, -1000, 0, 1000, 2000], yt: [-10, -5, 0, 5, 10], xl: 'Δ/2π = (ω_q − ω_r)/2π (MHz)', yl: 'χ/2π (MHz)' });
          ctx.fillStyle = rgba(T.good, .12); ctx.fillRect(A.X(0), A.T, A.X(-al) - A.X(0), A.B - A.T);
          txt(ctx, 'straddling', (A.X(0) + A.X(-al)) / 2, A.T + 10, { font: '600 10px "JetBrains Mono",monospace', color: T.good });
          polyline(ctx, [[A.L, A.Y(0)], [A.R, A.Y(0)]], T.line, 1);
          const curve = (f, col, dash) => { let seg2 = []; for (let k = 0; k <= 800; k++) { const d = -2000 + 4000 * k / 800, y = f(d), ok = isFinite(y) && Math.abs(y) < Ym && Math.abs(d) > g && Math.abs(d + al) > g * .7; if (ok) seg2.push([A.X(d), A.Y(y)]); else if (seg2.length) { polyline(ctx, seg2, col, 2.2, dash); seg2 = []; } } polyline(ctx, seg2, col, 2.2, dash); };
          curve(chi2, T.muted, [5, 4]); curve(chiT, T.copper);
          const y = chiT(D); if (Math.abs(y) < Ym) dot(ctx, A.X(D), A.Y(y), 6, T.copper, T.surface);
        });
        const upd = () => {
          const c = chiT(D), tP = 1 / (TAU * kap * 1e6 * (g / D) ** 2), nc = D * D / (4 * g * g), disp = Math.abs(g / D) < .1;
          ro.innerHTML = `<span class="k">transmon χ/2π       </span>${num(c, 3)} MHz &nbsp;<span class="k">(two-level g²/Δ: ${num(chi2(D), 2)})</span><br><span class="k">full shift 2χ/2π    </span>${num(2 * c, 3)} MHz<br><span class="k">Purcell limit (no filter) </span>${fmtSI(tP, 's', 0)}<br><span class="k">critical photon number Δ²/4g² </span>${num(nc, 0)}<br><span class="k">g/|Δ| </span>${num(Math.abs(g / D), 3)} ${disp ? '' : '<b style="color:var(--bad)">· not dispersive</b>'}`;
          p.inv();
        };
        body.append(cv, h('div', { class: 'split even' },
          h('div', { class: 'stack' }, slider({ id: id('D'), label: 'Detuning Δ/2π', min: -2000, max: 2000, step: 10, value: D, fmt: v => v + ' MHz', on: v => { D = v === 0 ? 10 : v; upd(); } }),
            slider({ id: id('g'), label: 'Coupling g/2π', min: 20, max: 200, step: 1, value: g, fmt: v => v + ' MHz', on: v => { g = v; upd(); } })),
          h('div', { class: 'stack' }, slider({ id: id('a'), label: 'Anharmonicity α/2π', min: -400, max: -100, step: 5, value: al, fmt: v => v + ' MHz', on: v => { al = v; upd(); } }),
            slider({ id: id('k'), label: 'Resonator linewidth κ/2π', min: .2, max: 10, step: .1, value: kap, fmt: v => num(v, 1) + ' MHz', on: v => { kap = v; upd(); } }), ro)));
        upd();
      }
    },
    pns: {
      title: 'Photon-number splitting of the qubit line',
      cap: 'A simulated qubit spectroscopy trace with photons in the resonator. Each photon number n adds a Lorentzian line at 2χn, weighted by the probability of n (Poisson for a coherent drive, Bose–Einstein for thermal photons) and broadened by roughly γ₂ + nκ. When 2χ is well above κ the lines separate and the qubit counts photons; when it is below, they merge into one shifted, broadened line. The grey bars are the true photon-number distribution; note that each line’s area, not its height, follows it, because higher-n lines are broader.',
      build(body, id) {
        let chi2 = 4, kap = .5, nb = 1.5, dist = 'coh';
        const g2 = .2, cv = canvas('', 'height:260px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const P = n => dist === 'coh' ? poisson(nb, n) : thermalP(nb, n);
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), nmax = Math.ceil(nb + 5 * Math.sqrt(nb + .5) + 4), xm = Math.max(4 * chi2, chi2 * (nmax * .8)) + 3;
          const S = x => { let s = 0; for (let n = 0; n <= nmax; n++) { const gam = (g2 + n * kap) / 2; s += P(n) * gam / Math.PI / ((x - chi2 * n) ** 2 + gam * gam); } return s; };
          let mx = 0; const xs = []; for (let k = 0; k <= 900; k++) { const x = -3 + (xm + 3) * k / 900, y = S(x); xs.push([x, y]); mx = Math.max(mx, y); }
          const A = axes(ctx, w, H, { x: [-3, xm], y: [0, 1.08], xt: [0, ...[1, 2, 3, 4, 5, 6, 8, 10].map(n => n * chi2).filter(v => v < xm)].map(v => +v.toFixed(1)), yt: [0, .5, 1], yf: v => num(v, 1), xl: 'probe frequency − ω_q (MHz)', yl: 'qubit response (normalized)' });
          for (let n = 0; n <= nmax; n++) { const x = chi2 * n; if (x > xm) break; const hgt = P(n) / Math.max(...[...Array(nmax + 1)].map((_, k) => P(k))); polyline(ctx, [[A.X(x), A.Y(0)], [A.X(x), A.Y(hgt)]], rgba(T.ink, .35), 6); if (P(n) > .02) txt(ctx, 'n=' + n, A.X(x), A.Y(hgt) - 9, { font: '500 9.5px "JetBrains Mono",monospace' }); }
          polyline(ctx, xs.map(([x, y]) => [A.X(x), A.Y(y / mx)]), T.copper, 2.2);
        });
        const upd = () => {
          const c = chi2 / 2, Gm = 2 * kap * c * c * nb / (kap * kap / 4 + c * c);
          ro.innerHTML = `<span class="k">2χ / κ </span>${num(chi2 / kap, 1)} ${chi2 > 2 * kap ? '<b style="color:var(--good)">· resolved</b>' : chi2 > kap ? '· marginal' : '<b style="color:var(--bad)">· unresolved</b>'}<br><span class="k">mean Stark shift 2χn̄ </span>${num(chi2 * nb, 2)} MHz<br><span class="k">measurement-induced dephasing time 1/Γ_m </span>${nb > 0 ? fmtSI(1 / (TAU * 1e6 * Gm), 's', 1) : '—'}`;
          p.inv();
        };
        body.append(cv, h('div', { class: 'split even' },
          h('div', { class: 'stack' }, slider({ id: id('c'), label: 'Full dispersive shift 2χ/2π', min: .2, max: 10, step: .1, value: chi2, fmt: v => num(v, 1) + ' MHz', on: v => { chi2 = v; upd(); } }),
            slider({ id: id('k'), label: 'Resonator linewidth κ/2π', min: .1, max: 6, step: .05, value: kap, fmt: v => num(v, 2) + ' MHz', on: v => { kap = v; upd(); } })),
          h('div', { class: 'stack' }, slider({ id: id('n'), label: 'Mean photon number n̄', min: 0, max: 6, step: .1, value: nb, fmt: v => num(v, 1), on: v => { nb = v; upd(); } }),
            field('Photon statistics', seg([{ v: 'coh', label: 'Coherent (driven)' }, { v: 'th', label: 'Thermal' }], dist, v => { dist = v; upd(); }, 'Photon statistics')), ro)));
        upd();
      }
    }
  },
  take: ['For |Δ| ≫ g the qubit and resonator stop exchanging energy but shift each other: H ≈ (ω_r + χσ_z)a†a + ½(ω_q + χ)σ_z.',
    'For a transmon χ = g²α/(Δ(Δ+α)), much smaller than g²/Δ at large detuning and large with a sign flip in the straddling regime.',
    'The coupling costs Purcell decay κ(g/Δ)², measurement-induced dephasing 8χ²n̄/κ and dephasing from stray thermal photons; dispersive physics fails near n_crit = Δ²/4g².',
    'In the strong dispersive regime (2χ > κ, γ) the qubit line splits by photon number, so the qubit counts photons and can be controlled conditionally on them.'],
  quiz: QZ([
    ['What characterizes the dispersive regime?', ['Δ = 0', 'The qubit–resonator detuning is much larger than the coupling, |Δ| ≫ g', 'g ≫ ω', 'The resonator is removed'], 1, 'With large detuning, energy exchange is suppressed and only state-dependent frequency shifts remain.'],
    ['For a two-level atom, what is the dispersive shift?', ['g/Δ', 'g²/Δ', 'Δ²/g', 'gΔ'], 1, 'Second-order perturbation theory in g gives χ = g²/Δ.'],
    ['What is the ac Stark shift in circuit QED?', ['A shift of the resonator by the qubit', 'A shift of the qubit frequency by 2χ per photon in the resonator', 'A shift caused by temperature', 'The anharmonicity'], 1, 'Grouping the dispersive Hamiltonian by σ_z shows the qubit frequency depends on a†a.'],
    ['Why is a transmon’s χ smaller than g²/Δ at large detuning?', ['Its coupling is weaker', 'The |1⟩→|2⟩ transition contributes a shift of opposite sign that nearly cancels, leaving χ ≈ g²α/Δ²', 'It has no second level', 'Because κ is large'], 1, 'χ = χ₀₁ − χ₁₂/2 = g²/Δ − g²/(Δ+α) = g²α/(Δ(Δ+α)).'],
    ['What is the straddling regime?', ['When the qubit is below 1 GHz', 'When the resonator frequency lies between the qubit’s f₁₂ and f₀₁, where χ is large and changes sign', 'When two qubits share a resonator', 'When κ = χ'], 1, 'For 0 < Δ < |α| the transmon χ formula has the opposite sign and a large magnitude.'],
    ['What is Purcell decay?', ['Decay of the resonator into the qubit', 'Decay of the qubit through its small resonator component, at rate about κ(g/Δ)²', 'Thermal excitation', 'Dephasing from flux noise'], 1, 'The dressed qubit state contains (g/Δ)² of a photon, which leaks out at rate κ.'],
    ['For χ ≪ κ, what is the measurement-induced dephasing rate for n̄ photons?', ['χn̄', '8χ²n̄/κ', 'κn̄', 'χ/κ'], 1, 'Γ_m = 2κχ²n̄/(κ²/4 + χ²) reduces to 8χ²n̄/κ for small χ.'],
    ['Why are thermal photons in the readout resonator harmful?', ['They heat the qubit to 1 K', 'They randomly Stark-shift the qubit frequency, causing dephasing', 'They improve readout', 'They are not harmful'], 1, 'Each thermal photon shifts the qubit by 2χ; fluctuating photon number means fluctuating frequency.'],
    ['What is the critical photon number?', ['The number of qubits', 'n_crit = Δ²/4g², above which the dispersive approximation fails', 'One photon', 'κ/χ'], 1, 'As photon number approaches Δ²/4g², higher-order terms grow and measurement can induce transitions.'],
    ['What happens in the strong dispersive regime?', ['The qubit cannot be read', 'The qubit spectrum splits into separate lines for each photon number, weighted by its probability', 'χ becomes zero', 'The resonator stops ringing'], 1, 'When 2χ exceeds κ and the qubit linewidth, lines at ω_q + 2χn are resolved: photon-number splitting.']
  ])
});

/* ===================================================================== */
LESSONS.push({
  id: 'cqedcouple', n: 41.3, stage: CQED, minutes: 16, title: 'Coupling qubits: buses, tunable couplers and the CZ gate',
  lede: 'Two transmons talk through a capacitor or a shared resonator. Tune them into resonance and they swap; tune |11⟩ near |20⟩ and they pick up a conditional phase. The hard part is making them stop talking when they should be quiet.',
  html: `
<h2>Exchange coupling</h2>
<p>Two transmons connected by a small capacitor, or both coupled to a common resonator bus, feel an exchange interaction</p>
${EQ('H<sub>int</sub>/ħ = J (a†b + a b†)')}
<p>where ${m('a')} and ${m('b')} lower each transmon. With a direct capacitor ${m('J/2π')} is typically 5–20 MHz. Through a resonator, the qubits exchange virtual photons and ${m('J = (g₁g₂/2)(1/Δ₁ + 1/Δ₂)')} (Majer et al., 2007). Like the Jaynes–Cummings coupling, the exchange term conserves excitations, so the two-qubit levels group into blocks: ${m('|00⟩')}; ${m('|01⟩, |10⟩')}; and ${m('|11⟩, |20⟩, |02⟩')}.</p>
<h2>Two ways to entangle</h2>
<ul>
<li><strong>iSWAP.</strong> Bring the two qubits to the same frequency. ${m('|01⟩')} and ${m('|10⟩')} are then resonant and swap at rate ${m('2J')}; stopping after ${m('t = π/2J')} gives an iSWAP. Stopping halfway gives ${m('√iSWAP')}.</li>
<li><strong>CZ.</strong> Tune one qubit so that ${m('|11⟩')} approaches ${m('|20⟩')} (or ${m('|02⟩')}), which happens when the detuning equals the anharmonicity. The repulsion between those levels pushes ${m('|11⟩')} by an amount that ${m('|01⟩')} and ${m('|10⟩')} do not feel. Going in and out adiabatically, so no population is left in ${m('|20⟩')}, accumulates a conditional phase; choosing the pulse so it reaches π gives a <strong>controlled-Z</strong> (DiCarlo et al., 2009). Modern versions use fast, net-zero flux pulses that are robust to slow drifts.</li>
</ul>
<h2>The problem of always-on ZZ</h2>
<p>Even when the qubits are far detuned, the same level repulsion leaves a small residual shift of ${m('|11⟩')}:</p>
${EQ('ζ = E<sub>11</sub> − E<sub>10</sub> − E<sub>01</sub> + E<sub>00</sub> ≈ 2J²(α₁ + α₂) / ((Δ + α₁)(Δ − α₂))')}
<p>This <strong>ZZ coupling</strong>, tens to hundreds of kilohertz for fixed couplings, makes each qubit’s frequency depend on its neighbour’s state. It dephases idle qubits and spoils parallel gates.</p>
${LAB('twoq')}
<h2>Tunable couplers</h2>
<p>The fix used by most current processors is a <strong>tunable coupler</strong>: a third, flux-tunable transmon between the two qubits (Yan et al., 2018). The qubits couple to each other directly and through the coupler, and the two paths interfere: ${m('J<sub>eff</sub> ≈ g₁₂ + g₁g₂/Δ<sub>c</sub>')}. At one coupler frequency the paths cancel and the qubits are isolated, with ZZ close to zero; moving the coupler switches the interaction on for a gate. Google’s Sycamore and Willow processors, and many others, use this architecture, reaching two-qubit gate errors below 0.5%.</p>
${NOTE('All-microwave alternatives', `<p>Flux-tunable qubits pay for their flexibility with flux noise and extra wiring. Fixed-frequency qubits avoid both and entangle with microwaves alone, using the cross-resonance gate ([[L:crossres]]). Parametric gates, which modulate a coupler at the difference frequency of two qubits, are a third option.</p>`)}
`,
  labs: {
    twoq: {
      title: 'Two coupled transmons: avoided crossings and ZZ',
      cap: 'Energies of two transmons coupled by J(a†b + ab†), computed exactly in each excitation block, against the frequency of qubit 1 relative to qubit 2 (Δ = ω₁ − ω₂). Top left: the single-excitation block, with the iSWAP crossing at Δ = 0. Top right: the two-excitation block (|11⟩, |20⟩, |02⟩), measured from ω₁ + ω₂; |11⟩ meets |20⟩ at Δ = −α and |02⟩ at Δ = +α, where CZ gates are done. Bottom: the size of the residual ZZ coupling, on a log scale.',
      build(body, id) {
        let J = 12, al = -250, D = 600;
        const c1 = canvas('', 'height:220px'), c2 = canvas('', 'height:220px'), c3 = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const blocks = d => {
          const one = [d / 2 + Math.sqrt(d * d / 4 + J * J), d / 2 - Math.sqrt(d * d / 4 + J * J)];
          const s2 = Math.SQRT2 * J, Hm = [d, s2, s2, s2, 2 * d + al, 0, s2, 0, al], R = eigSymV(Hm, 3);
          let k11 = 0; for (let k = 1; k < 3; k++) if (R.V[0 * 3 + k] ** 2 > R.V[0 * 3 + k11] ** 2) k11 = k;
          const e10 = Math.abs(one[0] - d) < Math.abs(one[1] - d) ? one[0] : one[1], e01 = one[0] + one[1] - e10;
          return { one, two: Array.from(R.w), zz: R.w[k11] - e10 - e01 };
        };
        let scan = [];
        const recompute = () => { scan = []; const X = Math.max(700, 2 * Math.abs(al) + 200); for (let k = 0; k <= 300; k++) { const d = -X + 2 * X * k / 300; scan.push([d, blocks(Math.abs(d) < 1e-6 ? 1e-6 : d)]); } };
        const X = () => scan[scan.length - 1][0];
        const p1 = painter(c1, ({ ctx, w, h: H }) => {
          const T = Theme.get(), xm = X(), A = axes(ctx, w, H, { x: [-xm, xm], y: [-xm * .6, xm * .6], xt: [-xm, 0, xm].map(v => Math.round(v)), yt: [0], xl: 'Δ/2π (MHz)', yl: 'single-excitation energies' });
          for (let b = 0; b < 2; b++) polyline(ctx, scan.map(([d, r]) => [A.X(d), A.Y(r.one[b] - d / 2)]), b ? T.cyan : T.copper, 2.2);
          polyline(ctx, [[A.X(D), A.T], [A.X(D), A.B]], T.ink, 1.1, [4, 3]); txt(ctx, 'iSWAP', A.X(0), A.T + 8, { font: '600 10px "JetBrains Mono",monospace', color: T.good });
        });
        const p2 = painter(c2, ({ ctx, w, h: H }) => {
          const T = Theme.get(), xm = X(), A = axes(ctx, w, H, { x: [-xm, xm], y: [-xm * 1.2, xm * 1.2], xt: [-xm, 0, xm].map(v => Math.round(v)), yt: [0], xl: 'Δ/2π (MHz)', yl: 'two-excitation energies − (ω₁+ω₂)' });
          const cols = [T.cyan, T.copper, T.good]; for (let b = 0; b < 3; b++) polyline(ctx, scan.map(([d, r]) => [A.X(d), A.Y(r.two[b] - d)]), cols[b], 2);
          [[-al, 'CZ via |20⟩'], [al, 'CZ via |02⟩']].forEach(([x, s]) => { polyline(ctx, [[A.X(x), A.T], [A.X(x), A.B]], T.muted, 1, [2, 4]); txt(ctx, s, A.X(x), A.B - 10, { font: '600 10px "JetBrains Mono",monospace', color: T.good }); });
          polyline(ctx, [[A.X(D), A.T], [A.X(D), A.B]], T.ink, 1.1, [4, 3]);
        });
        const p3 = painter(c3, ({ ctx, w, h: H }) => {
          const T = Theme.get(), xm = X(), A = axes(ctx, w, H, { x: [-xm, xm], y: [1e-3, 100], ylog: true, xt: [-xm, -Math.round(Math.abs(al)), 0, Math.round(Math.abs(al)), xm].map(v => Math.round(v)), yt: [1e-3, 1e-2, .1, 1, 10, 100], yf: v => v >= 1 ? v + ' MHz' : num(v * 1000, 0) + ' kHz', xl: 'Δ/2π (MHz)', yl: '|ζ|/2π' });
          polyline(ctx, scan.map(([d, r]) => [A.X(d), A.Y(clamp(Math.abs(r.zz), 1e-3, 100))]), T.copper, 2.2);
          const r = blocks(D); dot(ctx, A.X(D), A.Y(clamp(Math.abs(r.zz), 1e-3, 100)), 6, T.copper, T.surface);
        });
        const upd = full => {
          if (full) recompute(); const r = blocks(D), z = Math.abs(r.zz), near = Math.abs(D) < 3 * J ? 'near the iSWAP resonance' : Math.abs(Math.abs(D) - Math.abs(al)) < 4 * J ? 'near a CZ resonance' : 'idle (far detuned)';
          ro.innerHTML = `<span class="k">Δ/2π </span>${D} MHz · ${near}<br><span class="k">residual ZZ |ζ|/2π </span>${z >= 1 ? num(z, 2) + ' MHz' : num(z * 1000, 1) + ' kHz'}<br><span class="k">iSWAP time π/2J </span>${num(1000 / (4 * J), 1)} ns`;
          p1.inv(); p2.inv(); p3.inv();
        };
        body.append(h('div', { class: 'split even' }, c1, c2), c3, h('div', { class: 'split even' },
          h('div', { class: 'stack' }, slider({ id: id('D'), label: 'Detuning Δ/2π = (ω₁ − ω₂)/2π', min: -900, max: 900, step: 5, value: D, fmt: v => v + ' MHz', on: v => { D = v === 0 ? .5 : v; upd(false); } }),
            slider({ id: id('J'), label: 'Coupling J/2π', min: 1, max: 40, step: .5, value: J, fmt: v => num(v, 1) + ' MHz', on: v => { J = v; upd(true); } })),
          h('div', { class: 'stack' }, slider({ id: id('a'), label: 'Anharmonicity α/2π (both)', min: -350, max: -150, step: 5, value: al, fmt: v => v + ' MHz', on: v => { al = v; upd(true); } }), ro)));
        upd(true);
      }
    }
  },
  take: ['Capacitive or resonator-mediated coupling gives an exchange term J(a†b + ab†), with J/2π typically 5–20 MHz; levels group into excitation blocks.',
    'iSWAP: tune the qubits into resonance so |01⟩ and |10⟩ swap at rate 2J. CZ: tune |11⟩ near |20⟩ (detuning equal to the anharmonicity) and return adiabatically to pick up a conditional phase of π.',
    'Fixed couplings leave an always-on ZZ shift ζ ≈ 2J²(α₁+α₂)/((Δ+α₁)(Δ−α₂)) that dephases idle qubits and spoils parallel gates.',
    'Tunable couplers make two coupling paths interfere, switching the interaction off when idle and on for gates.'],
  quiz: QZ([
    ['What interaction does a coupling capacitor between two transmons produce?', ['A ZZ term only', 'An exchange term J(a†b + ab†)', 'A measurement', 'A magnetic field'], 1, 'Capacitive coupling of the two charge variables gives, in the rotating frame, an exchange of excitations.'],
    ['How do two qubits couple through a shared resonator bus?', ['By real photons only', 'By exchanging virtual photons, giving J = (g₁g₂/2)(1/Δ₁ + 1/Δ₂)', 'They cannot', 'Through the fridge'], 1, 'With both qubits detuned from the bus, second-order processes create an effective qubit–qubit exchange.'],
    ['How is an iSWAP gate performed with tunable transmons?', ['By measuring both qubits', 'By bringing them into resonance so |01⟩ and |10⟩ swap, for a time π/2J', 'By detuning them far apart', 'By driving |2⟩'], 1, 'On resonance the exchange term fully swaps a single excitation; stopping at π/2J gives iSWAP.'],
    ['At what detuning are CZ gates usually performed?', ['Δ = 0', 'When the detuning equals the anharmonicity, so |11⟩ is resonant with |20⟩ or |02⟩', 'Δ = 10 GHz', 'Any detuning'], 1, '|11⟩ has energy ω₁ + ω₂ and |20⟩ has 2ω₁ + α₁; they meet at ω₂ − ω₁ = α₁.'],
    ['Why must the CZ flux pulse be adiabatic with respect to the |11⟩–|20⟩ crossing?', ['To heat the qubit', 'So population returns fully to |11⟩ with only a phase, rather than leaking into |20⟩', 'To read out the qubit', 'To lower J'], 1, 'A diabatic passage would leave population in |20⟩, a leakage error; adiabatic passage keeps only the accumulated phase.'],
    ['What is residual ZZ coupling?', ['A readout error', 'An always-on shift of |11⟩ relative to |01⟩ + |10⟩, from level repulsion with |20⟩ and |02⟩', 'Flux noise', 'A decay channel'], 1, 'ζ = E₁₁ − E₁₀ − E₀₁ + E₀₀ is non-zero whenever J ≠ 0 and the qubits have finite anharmonicity.'],
    ['Why is always-on ZZ harmful?', ['It raises T₁', 'Each qubit’s frequency depends on its neighbour’s state, which dephases idle qubits and corrupts simultaneous gates', 'It makes readout faster', 'It is not harmful'], 1, 'An uncontrolled conditional phase accumulates during idling and other gates.'],
    ['How does a tunable coupler turn the interaction off?', ['By cooling the qubits', 'The direct coupling and the coupling through the coupler interfere and can be made to cancel', 'By disconnecting a wire', 'By measuring the coupler'], 1, 'J_eff ≈ g₁₂ + g₁g₂/Δ_c; choosing the coupler frequency so the terms cancel gives zero effective coupling.'],
    ['Which processors use flux-tunable qubits with tunable couplers?', ['Trapped-ion machines', 'Google’s Sycamore and Willow, among others', 'Photonic chips', 'Only annealers'], 1, 'Google’s architecture uses tunable transmons with tunable couplers between them.'],
    ['What is the cost of flux tunability?', ['Lower anharmonicity', 'Sensitivity to flux noise away from sweet spots, plus extra control wiring', 'No readout', 'It forbids CZ gates'], 1, 'Every tunable element needs a flux line and is exposed to 1/f flux noise when biased off its sweet spot.']
  ])
});

/* ===================================================================== */
LESSONS.push({
  id: 'crossres', n: 41.4, stage: CQED, minutes: 15, title: 'Cross-resonance: entangling fixed-frequency qubits with microwaves',
  lede: 'Drive one qubit at its neighbour’s frequency and the neighbour rotates at a speed that depends on the first qubit’s state. That conditional rotation is a CNOT in disguise, and it needs no flux at all.',
  html: `
<h2>The idea</h2>
<p>Fixed-frequency transmons have the best coherence: no SQUID, no flux line, no flux noise. But they cannot be tuned into resonance for an iSWAP or a CZ. The <strong>cross-resonance</strong> (CR) gate (Paraoanu 2006; Rigetti and Devoret 2010; Chow et al., 2011) works around this. Two qubits, a <strong>control</strong> at ${m('ω<sub>c</sub>')} and a <strong>target</strong> at ${m('ω<sub>t</sub>')}, share a weak fixed coupling ${m('J')}. A microwave drive of amplitude ${m('Ω')} applied to the control, but at the <em>target’s</em> frequency, leaks through the coupling and rotates the target, and the size of the leak depends on the state of the control.</p>
<h2>The effective Hamiltonian</h2>
<p>To first order in the drive, the two-qubit dynamics in the rotating frame is described by</p>
${EQ('H<sub>CR</sub> ≈ ½ (ν<sub>ZX</sub> Z⊗X + ν<sub>IX</sub> I⊗X + ν<sub>ZI</sub> Z⊗I + ν<sub>ZZ</sub> Z⊗Z + …)')}
<p>The useful term is ${m('ZX')}: the target rotates about X one way if the control is ${m('|0⟩')} and the other way if it is ${m('|1⟩')}. For transmons, with ${m('Δ = ω<sub>c</sub> − ω<sub>t</sub>')} and control anharmonicity ${m('α')},</p>
${EQ('ν<sub>ZX</sub> ≈ −(JΩ/Δ) · α/(Δ + α)')}
<p>(Magesan and Gambetta, 2020). Running the ZX interaction for a quarter period gives ${m('ZX<sub>90</sub>')}, which single-qubit rotations turn into a CNOT. With ${m('J/2π ≈ 3')} MHz, ${m('Δ/2π ≈ −100')} MHz and ${m('Ω/2π ≈ 50')} MHz, ${m('ν<sub>ZX</sub>')} is about 1 MHz and the gate takes about 200–300 ns.</p>
<h2>Cleaning up the unwanted terms</h2>
<ul>
<li><strong>IX</strong> rotates the target regardless of the control, from classical crosstalk and the transmon level structure. It is removed by an extra <strong>cancellation tone</strong> on the target, or by echoing.</li>
<li><strong>ZI</strong> is a Stark shift of the control, and <strong>ZZ</strong> the static coupling of [[L:cqedcouple]].</li>
<li>The <strong>echoed CR</strong> sequence, CR⁺, then an X on the control, then CR⁻ (the drive with its sign flipped), then X on the control, keeps ZX, which flips sign twice, and cancels IX, ZI and ZZ to first order.</li>
</ul>
${LAB('cr')}
<h2>The frequency-planning problem</h2>
<p>The formula shows where CR works. At ${m('Δ → 0')} and ${m('Δ → −α')} the rate blows up and the perturbative picture fails: those are collisions, where the drive excites the wrong transitions. Far from both, ${m('ν<sub>ZX</sub>')} falls like ${m('1/Δ²')} and the gate becomes slow. The sweet range is a detuning comparable to the anharmonicity, which is why fixed-frequency lattices need careful frequency allocation and tight fabrication control ([[L:scmaterials]]). IBM’s Eagle, Heron and later processors are built on this all-microwave approach, with tunable couplers added in Heron to switch off ZZ.</p>
`,
  labs: {
    cr: {
      title: 'A conditional rotation of the target',
      cap: 'Left: the target qubit’s Bloch vector in the Y–Z plane after a CR drive of the chosen duration, starting from |0⟩, for the control in |0⟩ (blue) and |1⟩ (copper). ZX rotates them in opposite directions; IX rotates both the same way. At the ZX₉₀ time with no IX, they point in opposite directions: the gate has entangled the qubits. Turn on the echo to cancel IX. Right: the ZX rate against control–target detuning, with the collisions marked.',
      build(body, id) {
        let J = 3, D = -100, al = -330, Om = 50, ix = .3, tg = 0, echo = false;
        const cb = canvas('sq', 'max-width:280px;margin:0 auto'), cr2 = canvas('', 'height:260px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const zx = d => -(J * Om / d) * al / (d + al);
        const angles = t => { const z = zx(D), us = [1, -1].map(s => echo ? TAU * s * z * t : TAU * (ix + s * z) * t); return us; };
        const tCnot = () => 1 / (4 * Math.abs(zx(D)));
        const p1 = painter(cb, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w, H), R = S * .38, cx = w / 2, cy = H / 2;
          ctx.strokeStyle = T.line; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - R - 10, cy); ctx.lineTo(cx + R + 10, cy); ctx.moveTo(cx, cy - R - 10); ctx.lineTo(cx, cy + R + 10); ctx.stroke();
          txt(ctx, '|0⟩', cx, cy - R - 18, { font: MATHFONT(14), color: T.ink }); txt(ctx, '|1⟩', cx, cy + R + 18, { font: MATHFONT(14), color: T.ink }); txt(ctx, '−Y', cx + R + 22, cy, { font: '600 11px "JetBrains Mono",monospace' }); txt(ctx, '+Y', cx - R - 22, cy, { font: '600 11px "JetBrains Mono",monospace' });
          const t = tg / 1000; angles(t).forEach((th, i) => { const col = i ? T.copper : T.cyan; arrow(ctx, cx, cy, cx + R * Math.sin(th), cy - R * Math.cos(th), col, 3, 10); });
        });
        const p2 = painter(cr2, ({ ctx, w, h: H }) => {
          const T = Theme.get(), Xm = 500, A = axes(ctx, w, H, { x: [-Xm, Xm], y: [0, 4], xt: [-400, -200, 0, 200, 400], yt: [0, 1, 2, 3, 4], xl: 'Δ/2π = (ω_c − ω_t)/2π (MHz)', yl: '|ν_ZX| (MHz)' });
          let segp = []; for (let k = 0; k <= 800; k++) { const d = -Xm + 2 * Xm * k / 800, y = Math.abs(zx(d)); if (Math.abs(d) > 15 && Math.abs(d + al) > 15 && y < 4) segp.push([A.X(d), A.Y(y)]); else if (segp.length) { polyline(ctx, segp, T.copper, 2.2); segp = []; } } polyline(ctx, segp, T.copper, 2.2);
          [[0, 'Δ = 0'], [-al, 'Δ = −α']].forEach(([x, s]) => { if (Math.abs(x) > Xm) return; ctx.fillStyle = rgba(T.bad, .14); ctx.fillRect(A.X(x - 25), A.T, A.X(x + 25) - A.X(x - 25), A.B - A.T); txt(ctx, s, A.X(x), A.T + 8, { font: '600 10px "JetBrains Mono",monospace', color: T.bad }); });
          const y = Math.abs(zx(D)); if (y < 4) dot(ctx, A.X(D), A.Y(y), 6, T.copper, T.surface);
        });
        const tS = slider({ id: id('t'), label: 'Gate duration', min: 0, max: 800, step: 2, value: tg, fmt: v => v + ' ns', on: v => { tg = v; upd(); } });
        const upd = () => {
          const z = zx(D), tc = tCnot(), a = angles(tg / 1000), sep = Math.abs(((a[0] - a[1]) / Math.PI) % 2);
          ro.innerHTML = `<span class="k">ν_ZX/2π </span>${num(Math.abs(z), 3)} MHz &nbsp;<span class="k">ZX₉₀ (CNOT) time </span>${num(tc * 1000, 0)} ns<br><span class="k">angle between the two target vectors </span>${num(sep * 180, 0)}° &nbsp;(180° = maximally entangling)<br><span class="k">IX drift of both vectors </span>${echo ? 'cancelled by the echo' : num(360 * ix * tg / 1000, 0) + '°'}`;
          p1.inv(); p2.inv();
        };
        body.append(h('div', { class: 'split' }, cb, cr2), h('div', { class: 'split even' },
          h('div', { class: 'stack' }, tS, h('div', { class: 'btns' }, btn('Go to the CNOT time', () => { tS.set(Math.min(800, Math.round(tCnot() * 1000)), true); }, 'pri sm')),
            field('Echo', seg([{ v: false, label: 'Plain CR' }, { v: true, label: 'Echoed CR' }], echo, v => { echo = v; upd(); }, 'Echo')),
            slider({ id: id('ix'), label: 'Unwanted IX rate', min: 0, max: 1.5, step: .05, value: ix, fmt: v => num(v, 2) + ' MHz', on: v => { ix = v; upd(); } })),
          h('div', { class: 'stack' }, slider({ id: id('D'), label: 'Detuning Δ/2π', min: -500, max: 500, step: 5, value: D, fmt: v => v + ' MHz', on: v => { D = Math.abs(v) < 5 ? 5 : v; upd(); } }),
            slider({ id: id('O'), label: 'Drive amplitude Ω/2π', min: 5, max: 120, step: 1, value: Om, fmt: v => v + ' MHz', on: v => { Om = v; upd(); } }),
            slider({ id: id('J'), label: 'Coupling J/2π', min: .5, max: 8, step: .1, value: J, fmt: v => num(v, 1) + ' MHz', on: v => { J = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['The cross-resonance gate drives the control qubit at the target’s frequency; through a fixed coupling J, the target rotates at a rate that depends on the control state.',
    'The effective Hamiltonian contains the useful ZX term, ν_ZX ≈ −(JΩ/Δ)·α/(Δ+α), plus unwanted IX, ZI and ZZ terms.',
    'Echoed CR (CR⁺, X on control, CR⁻, X on control) and cancellation tones keep ZX and remove the others; ZX₉₀ plus single-qubit gates makes a CNOT in about 200–400 ns.',
    'The rate diverges at collisions (Δ = 0, Δ = −α) and falls off far away, so fixed-frequency lattices need careful frequency allocation.'],
  quiz: QZ([
    ['Why use fixed-frequency transmons?', ['They are faster to read', 'No flux line or SQUID means no flux noise and simpler wiring, giving better coherence', 'They have larger anharmonicity', 'They need no cooling'], 1, 'Removing tunability removes the main dephasing source of tunable transmons and their flux control lines.'],
    ['In a cross-resonance gate, which qubit is driven, and at which frequency?', ['The target at its own frequency', 'The control, at the target’s frequency', 'Both at the resonator frequency', 'The coupler at the sum frequency'], 1, 'The drive goes on the control line at ω_t, and reaches the target through the coupling J.'],
    ['Which term in the effective Hamiltonian does the entangling work?', ['IX', 'ZX', 'ZI', 'IZ'], 1, 'Z⊗X rotates the target about X in a direction set by the control’s Z value.'],
    ['How does the ZX rate depend on the coupling and drive at weak drive?', ['It is independent of both', 'It is proportional to JΩ', 'It is proportional to J/Ω', 'It depends only on Δ'], 1, 'ν_ZX ≈ −(JΩ/Δ)·α/(Δ+α), linear in both the coupling and the drive amplitude.'],
    ['What does the echoed CR sequence cancel?', ['ZX', 'IX, ZI and ZZ to first order, while keeping ZX', 'Readout errors', 'T₁ decay'], 1, 'Flipping the control and the drive sign reverses the unwanted terms between halves while ZX keeps its sign.'],
    ['How is ZX₉₀ turned into a CNOT?', ['It already is one', 'By adding single-qubit rotations before and after', 'By measuring the control', 'By adding a third qubit'], 1, 'ZX₉₀ is locally equivalent to CNOT; single-qubit Z and X rotations complete it.'],
    ['Where does the cross-resonance rate diverge?', ['At large detuning', 'At Δ = 0 and Δ = −α, which are frequency collisions', 'Never', 'At Δ = α/2 only'], 1, 'The perturbative denominators Δ and Δ + α vanish there, where the drive resonantly excites unwanted transitions.'],
    ['How does the ZX rate behave far from those points?', ['It grows', 'It falls off roughly like 1/Δ², so gates get slow', 'It stays constant', 'It oscillates'], 1, 'For |Δ| ≫ |α|, ν_ZX ≈ −JΩα/Δ², small and slow.'],
    ['Typical CR gate durations are', ['About 1 ns', 'About 200–400 ns', 'About 1 ms', 'About 1 s'], 1, 'With ν_ZX of order 1 MHz, a quarter period of ZX takes a few hundred nanoseconds.'],
    ['Which company built its processors around cross-resonance gates?', ['Google', 'IBM', 'IonQ', 'D-Wave'], 1, 'IBM’s fixed-frequency transmon processors use echoed cross-resonance gates.']
  ])
});

/* ===================================================================== */
LESSONS.push({
  id: 'cavities', n: 41.5, stage: CQED, minutes: 16, title: 'Resonators as qubits: 3D cavities, Kerr and cat states',
  lede: 'A superconducting cavity can hold a photon for milliseconds, far longer than any transmon. Give it a little nonlinearity through a transmon ancilla, and the oscillator itself becomes a quantum memory, a source of cat states and a qubit with built-in protection.',
  html: `
<h2>Why store information in an oscillator</h2>
<p>A transmon’s field lives partly in lossy surfaces. A <strong>3D cavity</strong>, a machined block of high-purity aluminium or niobium with a hollow inside, stores its field in vacuum. Single-photon lifetimes of 1–10 ms are routine in aluminium, and niobium cavities borrowed from particle accelerators, treated for very high quality factors, have kept photons for over a second. A popular shape is the <strong>coaxial stub cavity</strong> (Reagor et al., 2016), a post sticking up into a cylindrical hole, which needs no seams in the high-field region.</p>
<p>An oscillator also has room: instead of two levels, it has many photon-number states, and photon loss, its dominant error, is a single, well-understood process. That combination is what <strong>bosonic codes</strong> exploit ([[L:bosonic]]).</p>
<h2>Borrowing nonlinearity from a transmon</h2>
<p>A cavity alone is linear and cannot be controlled beyond displacements ([[L:lccircuit]]). Coupling it dispersively to a transmon adds two things. The cross term ${m('χ a†a σ<sub>z</sub>')} lets the transmon detect and act on photon number ([[L:dispersive]]). And the cavity inherits a small <strong>self-Kerr</strong> nonlinearity,</p>
${EQ('H<sub>Kerr</sub>/ħ = −(K/2) a†a†a a,&nbsp;&nbsp; K ≈ χ²/4|α|')}
<p>which makes each photon number pick up phase at its own rate, typically tens of kilohertz. Combining photon-number-selective phase gates (<strong>SNAP</strong>) with displacements gives universal control of the oscillator (Krastanov et al., 2015; Heeres et al., 2015), and numerically optimized pulses or echoed conditional displacements now prepare almost any state in a few microseconds.</p>
<h2>A cat from Kerr alone</h2>
<p>Kerr evolution turns a coherent state into a cat. Each photon number ${m('n')} gains phase ${m('Kt·n(n−1)/2')}. At ${m('Kt = π')} the phases fall into a repeating pattern that makes the state a superposition of two coherent states on opposite sides of phase space, ${m('|iα⟩')} and ${m('|−iα⟩')} (a quarter turn from where it started, because ${m('a†a†aa')} also contains a term linear in ${m('n')}): a <strong>two-component cat</strong>. At ${m('Kt = π/2')} it is a four-component cat, at ${m('2π/q')} a ${m('q')}-component one, and at ${m('Kt = 2π')} the original coherent state revives. Kirchmair and colleagues watched exactly this happen in 2013.</p>
${LAB('kerr')}
<h2>Cat qubits</h2>
<p>A <strong>cat qubit</strong> uses the two coherent states ${m('|α⟩')} and ${m('|−α⟩')}, or their even and odd superpositions, as its basis. An engineered process removes photons in pairs from the cavity and replaces them, <strong>two-photon dissipation</strong>, so the cavity is continuously pulled back towards the two-state manifold. Two consequences follow (Leghtas et al., 2015; Lescanne et al., 2020):</p>
<ul>
<li><strong>Bit flips are exponentially suppressed.</strong> To turn ${m('|α⟩')} into ${m('|−α⟩')}, noise must move the state across phase space, and the rate falls like ${m('e<sup>−2|α|²</sup>')}. Bit-flip times of seconds to minutes have been measured.</li>
<li><strong>Phase flips grow only linearly.</strong> Losing a single photon flips the parity, so phase flips occur at about ${m('κ₁|α|²')}.</li>
</ul>
<p>The result is a <strong>biased-noise qubit</strong>: one error type is nearly absent, so a simple repetition code against the other suffices, saving most of the overhead of a surface code ([[L:thresholds]]). Alice &amp; Bob and AWS (whose Ocelot chip, announced in 2025, uses cat qubits with a repetition code) are pursuing this route.</p>
${LAB('cat')}
`,
  labs: {
    kerr: {
      title: 'A coherent state under the Kerr effect',
      cap: 'The Husimi Q function, the probability of finding the state at each point of phase space, for a coherent state of mean photon number n̄ evolving under H = −(K/2)a†a†aa. The photon-number distribution never changes, but the phases do: the state smears into a crescent, splits into a four-component cat at Kt = π/2 and a two-component cat at Kt = π, and revives at Kt = 2π. Press Play, or drag the time slider.',
      build(body, id) {
        let nb = 4, th = 0, playing = false, last = 0;
        const NG = 66, cv = canvas('sq', 'max-width:340px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        let img = null, key = '';
        const compute = () => {
          const R = Math.sqrt(nb) + 2.6, nmax = Math.ceil(nb + 6 * Math.sqrt(nb) + 6), a0 = Math.sqrt(nb), cr = [], ci = [];
          for (let n = 0; n <= nmax; n++) { const amp = Math.exp(-nb / 2 + n * Math.log(a0 || 1e-300) - lf(n) / 2), ph = -th * n * (n - 1) / 2; cr.push(amp * Math.cos(ph)); ci.push(amp * Math.sin(ph)); }
          const Q = new Float64Array(NG * NG); let mx = 0;
          for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
            const x = -R + 2 * R * (i + .5) / NG, y = R - 2 * R * (j + .5) / NG; let tr = 1, ti = 0, sr = 0, si = 0;
            for (let n = 0; n <= nmax; n++) { if (n > 0) { const s = 1 / Math.sqrt(n), nr = (tr * x + ti * y) * s, ni = (ti * x - tr * y) * s; tr = nr; ti = ni; } sr += tr * cr[n] - ti * ci[n]; si += tr * ci[n] + ti * cr[n]; }
            const q = (sr * sr + si * si) * Math.exp(-(x * x + y * y)); Q[j * NG + i] = q; if (q > mx) mx = q;
          }
          img = heatImage(NG, NG, (i, j) => seqRGB(Q[j * NG + i] / mx)); return R;
        };
        let Rg = 3;
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const k2 = nb + '|' + th.toFixed(4) + '|' + Theme.get().dark; if (k2 !== key || !img) { Rg = compute(); key = k2; }
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-Rg, Rg], y: [-Rg, Rg], xt: [-3, 0, 3].filter(v => Math.abs(v) < Rg), yt: [-3, 0, 3].filter(v => Math.abs(v) < Rg), xl: 'Re β', yl: 'Im β', pad: { l: 30, b: 28, t: 8, r: 8 } });
          drawHeat(ctx, img, A.L + 1, A.T, A.R - A.L - 1, A.B - A.T, true);
          ctx.strokeStyle = rgba(T.ink, .2); ctx.beginPath(); ctx.moveTo(A.X(0), A.T); ctx.lineTo(A.X(0), A.B); ctx.moveTo(A.L, A.Y(0)); ctx.lineTo(A.R, A.Y(0)); ctx.stroke();
        });
        const label = () => { const r = th / Math.PI, near = v => Math.abs(r - v) < .015; return near(0) ? 'coherent state' : near(2) ? 'revival: coherent state again' : near(1) ? 'two-component cat (|iα⟩ and |−iα⟩)' : near(.5) || near(1.5) ? 'four-component cat' : near(2 / 3) || near(4 / 3) ? 'three-component cat' : near(.4) ? 'five-component cat' : r < .3 ? 'crescent: phase spreading with photon number' : 'superposition of several coherent states'; };
        const tS = slider({ id: id('t'), label: 'Kerr phase Kt', min: 0, max: 2, step: .005, value: 0, fmt: v => num(v, 3) + ' π', on: v => { th = v * Math.PI; upd(); } });
        const playB = btn('Play', () => { playing = !playing; playB.textContent = playing ? 'Pause' : 'Play'; last = performance.now(); }, 'pri sm');
        const upd = () => { const Kt = th, tK = Kt / (TAU * 50e3); ro.innerHTML = `<span class="k">state </span>${label()}<br><span class="k">time needed for K/2π = 50 kHz </span>${fmtSI(tK, 's', 1)}<br><span class="k">mean photon number (unchanged) </span>${num(nb, 1)}`; p.inv(); };
        Scope.tick(now => { if (!playing) return; const dt = (now - last) / 1000; last = now; let v = th / Math.PI + dt * .2; if (v > 2) v = 0; tS.set(+v.toFixed(3)); th = v * Math.PI; upd(); });
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, tS, h('div', { class: 'btns' }, playB,
          btn('Kt = π/2', () => { tS.set(.5, true); }, 'sm'), btn('Kt = π', () => { tS.set(1, true); }, 'sm'), btn('Kt = 2π', () => { tS.set(2, true); }, 'sm')),
          slider({ id: id('n'), label: 'Mean photon number n̄ = |α|²', min: 1, max: 8, step: .5, value: nb, fmt: v => num(v, 1), on: v => { nb = v; upd(); } }), ro)));
        upd();
      }
    },
    cat: {
      title: 'Bias in a cat qubit',
      cap: 'Illustrative error times for a dissipatively stabilized cat qubit against its size |α|²: bit-flip time growing like e^{2|α|²} (blue) and phase-flip time 1/(κ₁|α|²) falling (copper), where 1/κ₁ is the cavity’s single-photon lifetime. Real devices see the exponential growth level off at large |α|², from effects left out here. The noise bias is the ratio of the two times.',
      build(body, id) {
        let tl = 100, n0 = 4;
        const G0 = 1e4, cv = canvas('', 'height:250px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const Tb = n => Math.exp(2 * n) / G0, Tp = n => tl * 1e-6 / Math.max(n, .05);
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 10], y: [1e-7, 1e4], ylog: true, xt: [0, 2, 4, 6, 8, 10], yt: [1e-6, 1e-3, 1, 1e3], yf: v => fmtSI(v, 's', 0), xl: 'cat size |α|²', yl: 'error time' });
          const b = [], ph = []; for (let k = 0; k <= 200; k++) { const n = .05 + 9.95 * k / 200; b.push([A.X(n), A.Y(clamp(Tb(n), 1e-7, 1e4))]); ph.push([A.X(n), A.Y(clamp(Tp(n), 1e-7, 1e4))]); }
          polyline(ctx, b, T.cyan, 2.4); polyline(ctx, ph, T.copper, 2.4);
          txt(ctx, 'bit flip', A.X(8.4), A.Y(clamp(Tb(8.4), 1e-7, 1e4)) + 14, { font: '600 10.5px "JetBrains Mono",monospace', color: T.cyan }); txt(ctx, 'phase flip', A.X(8.4), A.Y(Tp(8.4)) - 12, { font: '600 10.5px "JetBrains Mono",monospace', color: T.copper });
          polyline(ctx, [[A.X(n0), A.T], [A.X(n0), A.B]], T.ink, 1.2, [4, 3]);
        });
        const upd = () => { const b = Tb(n0), q = Tp(n0); ro.innerHTML = `<span class="k">bit-flip time </span>${fmtSI(b, 's', 1)} &nbsp; <span class="k">phase-flip time </span>${fmtSI(q, 's', 1)}<br><span class="k">noise bias (ratio) </span>${sci(b / q, 1)}`; p.inv(); };
        body.append(cv, h('div', { class: 'split even' },
          slider({ id: id('n'), label: 'Cat size |α|²', min: .5, max: 10, step: .1, value: n0, fmt: v => num(v, 1), on: v => { n0 = v; upd(); } }),
          h('div', { class: 'stack' }, slider({ id: id('l'), label: 'Single-photon lifetime 1/κ₁', min: 10, max: 1000, step: 10, value: tl, fmt: v => v + ' µs', on: v => { tl = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['3D superconducting cavities store photons for milliseconds or longer because their field lives in vacuum rather than in lossy surfaces.',
    'A dispersively coupled transmon gives the cavity photon-number-dependent control (χa†aσ_z) and a small self-Kerr K ≈ χ²/4|α|; SNAP gates plus displacements are universal.',
    'Under Kerr evolution a coherent state becomes a q-component cat at Kt = 2π/q and revives at Kt = 2π.',
    'Cat qubits stabilized by two-photon dissipation have bit flips suppressed like e^{−2|α|²} and phase flips growing like κ₁|α|², a strongly biased qubit suited to repetition codes.'],
  quiz: QZ([
    ['Why do 3D cavities have much longer photon lifetimes than transmons?', ['They are colder', 'Their field is stored mostly in vacuum, with very little in lossy surfaces and dielectrics', 'They use copper', 'They have no photons'], 1, 'Surface participation in a 3D cavity is tiny, so dielectric and two-level-system losses are much weaker.'],
    ['What is an advantage of encoding a qubit in an oscillator?', ['It needs no cooling', 'Many levels give room for redundancy, and the dominant error (photon loss) is a single, well-understood process', 'It cannot decay', 'It is classical'], 1, 'Bosonic codes use the large Hilbert space of one oscillator to detect and correct photon loss.'],
    ['How does a cavity get nonlinearity?', ['It is intrinsically nonlinear', 'From a dispersively coupled transmon, which adds χa†aσ_z and a small self-Kerr term', 'From the fridge', 'From the readout amplifier'], 1, 'The cavity inherits part of the transmon’s Josephson nonlinearity through the coupling.'],
    ['What is a SNAP gate?', ['A displacement', 'A selective number-dependent arbitrary phase: each photon number gets its own phase', 'A measurement', 'A two-qubit gate'], 1, 'Using the photon-number-split transmon lines, SNAP imprints chosen phases on chosen Fock states; with displacements it is universal.'],
    ['Under the Kerr Hamiltonian, what happens to the photon-number distribution?', ['It spreads out', 'It stays the same; only the phases of the number states change', 'It becomes thermal', 'It collapses to vacuum'], 1, 'The Kerr term is diagonal in photon number, so populations are untouched.'],
    ['At what Kerr phase does a coherent state become a two-component cat?', ['Kt = π/2', 'Kt = π', 'Kt = 2π', 'Kt = π/4'], 1, 'At Kt = π the phases repeat with period four in n, giving a superposition of two coherent states on opposite sides of phase space.'],
    ['What happens at Kt = 2π?', ['The state is lost', 'The coherent state revives', 'It becomes a Fock state', 'It becomes a four-component cat'], 1, 'n(n−1)/2 is an integer, so every phase is a multiple of 2π: the original state returns.'],
    ['What stabilizes a dissipative cat qubit?', ['Single-photon loss', 'Engineered two-photon dissipation that removes and replaces photons in pairs', 'Measuring the transmon', 'A magnetic field'], 1, 'Two-photon processes conserve parity and pull the state back to the manifold spanned by |α⟩ and |−α⟩.'],
    ['How does the cat qubit’s bit-flip rate depend on its size?', ['Grows linearly', 'Falls exponentially, like e^{−2|α|²}', 'Is constant', 'Grows exponentially'], 1, 'Noise has to carry the state across phase space from α to −α, which is exponentially unlikely in the separation.'],
    ['Why is a biased-noise qubit useful for error correction?', ['It needs no correction', 'With one error type nearly absent, a simple repetition code against the other can replace a full surface code, saving overhead', 'It can only do Clifford gates', 'It is easier to read'], 1, 'Correcting only phase flips with a 1D repetition code is far cheaper than a 2D code correcting both.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Circuit QED', 'Circuit quantum electrodynamics: superconducting qubits coupled to on-chip microwave resonators, the framework for controlling and measuring them.', 'jaynes'],
  ['Jaynes–Cummings model', 'A two-level atom coupled to one oscillator mode by g(a†σ₋ + aσ₊); it conserves excitations and gives a √n ladder of splittings.', 'jaynes'],
  ['Vacuum Rabi splitting', 'The 2g splitting between the dressed states of |e,0⟩ and |g,1⟩ at resonance.', 'jaynes'],
  ['Strong coupling', 'The regime in which the coupling g exceeds both the resonator and qubit loss rates.', 'jaynes'],
  ['Dispersive regime', 'Qubit and resonator far detuned (|Δ| ≫ g): no energy exchange, but state-dependent frequency shifts χ.', 'dispersive'],
  ['ac Stark shift', 'The shift of a qubit’s frequency by 2χ per photon in a dispersively coupled resonator.', 'dispersive'],
  ['Purcell effect', 'Decay of a qubit through a coupled resonator, at rate about κ(g/Δ)² in the dispersive regime.', 'dispersive'],
  ['Photon-number splitting', 'In the strong dispersive regime, the qubit line splits into separate lines for each resonator photon number.', 'dispersive'],
  ['Tunable coupler', 'A flux-tunable element between two qubits whose coupling paths interfere, switching the interaction on and off.', 'cqedcouple'],
  ['ZZ coupling', 'An always-on shift of |11⟩ relative to |01⟩ + |10⟩ between coupled qubits, from level repulsion with higher states.', 'cqedcouple'],
  ['Cross-resonance gate', 'An entangling gate for fixed-frequency qubits: drive the control at the target’s frequency to get a ZX interaction.', 'crossres'],
  ['3D cavity', 'A machined superconducting cavity whose photons live for milliseconds or longer, used as a quantum memory or bosonic qubit.', 'cavities'],
  ['Kerr effect', 'A photon-number-dependent frequency shift, H = −(K/2)a†a†aa, that turns coherent states into cat states over time.', 'cavities'],
  ['Cat qubit', 'A qubit encoded in coherent states |α⟩ and |−α⟩ of an oscillator, often stabilized by two-photon dissipation; strongly biased noise.', 'cavities'],
  ['SNAP gate', 'Selective number-dependent arbitrary phase gate on an oscillator; with displacements, universal for bosonic control.', 'cavities']
);
})();
