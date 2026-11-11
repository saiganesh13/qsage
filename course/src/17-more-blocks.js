/* =====================================================================
   Stage 2 additions · Rabi driving, reversible logic, distinguishing states
   ===================================================================== */
(() => {
const ST = 1;

/* ---------------- Rabi oscillations ---------------- */
LESSONS.push({
  id: 'rabi', n: 5.5, stage: ST, minutes: 15, title: 'Driving a qubit: Rabi oscillations',
  lede: 'On real hardware a gate is a pulse of microwaves or laser light. How long and how strongly you drive, and how well you are tuned to the qubit, decides which rotation you get.',
  html: `
<h2>Gates are pulses</h2>
<p>A qubit has a transition frequency ${m('ω<sub>q</sub>')}: a few gigahertz for a superconducting transmon, hundreds of terahertz for an optical transition in an ion. To rotate it you shine an oscillating field at a nearby frequency ${m('ω<sub>d</sub>')}. Viewed in a frame that rotates along with the drive, and ignoring terms that oscillate too fast to matter (the <strong>rotating-wave approximation</strong>), the qubit feels a fixed Hamiltonian</p>
${EQ('H = ½ Δ Z + ½ Ω X')}
<p>where ${m('Δ = ω<sub>q</sub> − ω<sub>d</sub>')} is the <strong>detuning</strong> and ${m('Ω')}, the <strong>Rabi frequency</strong>, is proportional to the drive amplitude. A Hamiltonian of the form ${m('½ ω n·σ')} makes the Bloch vector precess around the axis ${m('n')} at angular speed ${m('ω')}. Here the axis is ${m('(Ω, 0, Δ)')} and the speed is ${m('Ω<sub>eff</sub> = √(Ω² + Δ²)')}.</p>
<h2>On resonance</h2>
<p>With ${m('Δ = 0')} the axis is ${m('x')}, and a qubit starting in ${m('|0⟩')} swings through the poles: ${m('P(1) = sin²(Ωt/2)')}. This is a <strong>Rabi oscillation</strong>. A pulse with ${m('Ωt = π')}, a <strong>π pulse</strong>, flips ${m('|0⟩')} to ${m('|1⟩')}: an X gate. A π/2 pulse makes an equal superposition. Shifting the phase of the drive by 90° turns the rotation axis from ${m('x')} to ${m('y')}, so the duration, amplitude and phase of a pulse together choose any rotation about an axis in the equator. Rotations about ${m('z')} need no pulse at all: control software simply shifts the phase of every later pulse, a so-called virtual Z gate.</p>
${LAB('rabi')}
<h2>Off resonance</h2>
<p>When the drive is detuned, the rotation axis tilts towards ${m('z')}. The qubit oscillates faster, at ${m('Ω<sub>eff</sub>')}, but never reaches the south pole:</p>
${EQ(`P(1) = ${FR('Ω²', 'Ω² + Δ²')} sin²(Ω<sub>eff</sub> t / 2)`)}
<p>Scanning both detuning and pulse length gives the <strong>Rabi chevron</strong>, a standard calibration plot: full-contrast oscillations in the centre, and faster, weaker ones fanning out to the sides. Its axis of symmetry marks the qubit frequency, and the period at the centre gives the drive strength needed for a π pulse.</p>
<h2>Ramsey: timing a qubit against a clock</h2>
<p>To measure the qubit frequency precisely, use two π/2 pulses separated by a wait ${m('τ')}. The first pulse puts the Bloch vector on the equator. During the wait it drifts around the equator at the detuning ${m('Δ')}, relative to the drive’s clock. The second pulse converts the accumulated angle into a population:</p>
${EQ('P(1) = ½ (1 + e<sup>−τ/T₂*</sup> cos Δτ)')}
<p>These <strong>Ramsey fringes</strong> oscillate at exactly the detuning, so counting fringes measures the frequency error, and their decay measures the dephasing time ${m('T₂*')} from [[L:decoherence]]. Atomic clocks run on the same sequence.</p>
${LAB('chevron')}
${NOTE('Pulses in practice', `<p>Real pulses have smooth envelopes, usually Gaussian or cosine shapes, because sharp edges contain frequencies that can excite unwanted transitions. A transmon’s ${m('|1⟩ → |2⟩')} transition sits only a few hundred megahertz below the qubit frequency, so fast pulses also leak population into ${m('|2⟩')}; the <strong>DRAG</strong> technique adds a small out-of-phase component that cancels this leakage ([[L:pulses]] simulates both). Typical single-qubit gates last 20 to 50 ns on superconducting chips and microseconds on trapped ions, and are recalibrated many times a day as the hardware drifts.</p>`)}
`,
  labs: {
    rabi: {
      title: 'A pulse on the Bloch sphere',
      cap: 'The Bloch vector precesses around the tilted axis (dashed ring) set by the drive strength Ω and detuning Δ. The chart shows P(1) against pulse length; the dot marks the current length. With Δ = 0 the qubit reaches the south pole; detuning tilts the axis, speeds up the oscillation and lowers its peak.',
      build(body, id) {
        let Om = 10, De = 0, t = 50, anim = null;
        const sph = canvas('sq', 'max-width:310px;margin:0 auto'), bv = new BlochView(sph, { trail: false }), ch = canvas('', 'height:200px'), ro = h('div', { class: 'chipline' });
        const eff = () => Math.hypot(Om, De), axis = () => V.unit([Om, 0, De]), ang = tt => TAU * eff() * 1e-3 * tt;
        const P1 = tt => (Om * Om / (Om * Om + De * De || 1)) * Math.sin(ang(tt) / 2) ** 2;
        const chart = painter(ch, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 300], y: [0, 1.08], xt: [0, 100, 200, 300], yt: [0, .5, 1], yf: v => pct(v, 0), xl: 'pulse length (ns)', yl: 'P(1)' });
          const pts = []; for (let k = 0; k <= 300; k += 1) pts.push([A.X(k), A.Y(P1(k))]); polyline(ctx, pts, T.cyan, 2.3);
          dot(ctx, A.X(Math.min(t, 300)), A.Y(P1(t)), 6, T.copper, T.surface);
        });
        const upd = () => {
          const n = axis(), N = 120, trail = []; for (let k = 0; k <= N; k++) trail.push(V.rot([0, 0, 1], n, ang(t * k / N)));
          bv.v = trail[N]; bv.trail = trail; bv.target = n; bv.inv(); chart.inv();
          const piLen = 500 / Om;
          ro.innerHTML = `<span>Ω<sub>eff</sub>/2π <b>${num(eff(), 2)} MHz</b></span><span>peak P(1) <b>${pct(Om * Om / (Om * Om + De * De), 0)}</b></span><span>P(1) now <b>${pct(P1(t), 1)}</b></span><span>π pulse at Δ = 0 <b>${num(piLen, 0)} ns</b></span>`;
        };
        const tS = slider({ id: id('t'), label: 'Pulse length', min: 0, max: 300, step: 1, value: t, fmt: v => v + ' ns', on: v => { t = v; upd(); } });
        const play = () => { anim = anim ? null : { t0: performance.now(), end: tS.val() || 300 }; };
        Scope.tick(now => { if (!anim) return; const u = Math.min(1, (now - anim.t0) / dur(2200)); t = Math.round(u * anim.end); tS.set(t); upd(); if (u >= 1) anim = null; });
        const oS = slider({ id: id('o'), label: 'Drive strength Ω/2π', min: 1, max: 20, step: .5, value: Om, fmt: v => num(v, 1) + ' MHz', on: v => { Om = v; upd(); } });
        const dS = slider({ id: id('d'), label: 'Detuning Δ/2π', min: -20, max: 20, step: .5, value: De, fmt: v => num(v, 1) + ' MHz', on: v => { De = v; upd(); } });
        body.append(h('div', { class: 'split' }, sph, h('div', { class: 'stack' }, ch, oS, dS, tS,
          h('div', { class: 'btns' }, btn('Play the pulse', play, 'pri sm'), btn('π pulse', () => { De = 0; dS.set(0); t = Math.round(500 / Om); tS.set(t); upd(); }, 'sm'), btn('π/2 pulse', () => { De = 0; dS.set(0); t = Math.round(250 / Om); tS.set(t); upd(); }, 'sm')), ro)));
        upd();
      }
    },
    chevron: {
      title: 'Rabi chevron and Ramsey fringes',
      cap: 'Each pixel is P(1) after one experiment: detuning across, time up the page. Tap the map to choose a detuning; the chart below is the slice through it. In Ramsey mode the vertical axis is the wait between two π/2 pulses, and the fringes slow down as the detuning approaches zero.',
      build(body, id) {
        let mode = 'rabi', Om = 8, T2 = 1.5, sel = 4;
        const DMAX = 20, cv = canvas('', 'height:260px'), cut = canvas('', 'height:170px'), ro = h('div', { class: 'chipline' });
        const tmax = () => mode === 'rabi' ? 300 : 1000;
        const P = (d, tt) => mode === 'rabi' ? (Om * Om / (Om * Om + d * d)) * Math.sin(TAU * Math.hypot(Om, d) * 1e-3 * tt / 2) ** 2 : .5 * (1 + Math.exp(-tt / (T2 * 1000)) * Math.cos(TAU * d * 1e-3 * tt));
        let img = null, G = null;
        const map = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-DMAX, DMAX], y: [0, tmax()], xt: [-20, -10, 0, 10, 20], yt: mode === 'rabi' ? [0, 100, 200, 300] : [0, 250, 500, 750, 1000], xl: 'detuning Δ/2π (MHz)', yl: mode === 'rabi' ? 'pulse length (ns)' : 'wait τ (ns)', pad: { l: 50, r: 70 } });
          G = A;
          if (!img) img = heatImage(160, 120, (i, j) => seqRGB(P(-DMAX + 2 * DMAX * (i + .5) / 160, tmax() * (1 - (j + .5) / 120))));
          drawHeat(ctx, img, A.L + 1, A.T, A.R - A.L - 1, A.B - A.T, true);
          polyline(ctx, [[A.X(sel), A.T], [A.X(sel), A.B]], T.copper, 2, [5, 4]);
          for (let k = 0; k <= 20; k++) { const [r, g, b] = seqRGB(1 - k / 20); ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(A.R + 18, A.T + 10 + k * (A.B - A.T - 20) / 21, 14, (A.B - A.T - 20) / 21 + 1); }
          txt(ctx, '1', A.R + 42, A.T + 14, { align: 'left', font: '500 10px "JetBrains Mono",monospace' }); txt(ctx, '0', A.R + 42, A.B - 12, { align: 'left', font: '500 10px "JetBrains Mono",monospace' });
          txt(ctx, 'P(1)', A.R + 30, A.T, { font: '600 10px "JetBrains Mono",monospace' });
        });
        const cutP = painter(cut, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, tmax()], y: [0, 1.08], xt: mode === 'rabi' ? [0, 100, 200, 300] : [0, 250, 500, 750, 1000], yt: [0, .5, 1], yf: v => pct(v, 0), xl: mode === 'rabi' ? 'pulse length (ns)' : 'wait τ (ns)', yl: `P(1) at Δ/2π = ${num(sel, 1)} MHz` });
          const pts = []; for (let k = 0; k <= 400; k++) { const tt = tmax() * k / 400; pts.push([A.X(tt), A.Y(P(sel, tt))]); } polyline(ctx, pts, T.copper, 2.2);
          if (mode === 'ramsey') { const env = []; for (let k = 0; k <= 100; k++) { const tt = tmax() * k / 100; env.push([A.X(tt), A.Y(.5 + .5 * Math.exp(-tt / (T2 * 1000)))]); } polyline(ctx, env, T.muted, 1.2, [4, 4]); }
        });
        const upd = () => {
          img = null; map.inv(); cutP.inv();
          ro.innerHTML = mode === 'rabi' ? `<span>oscillation frequency here <b>${num(Math.hypot(Om, sel), 2)} MHz</b></span><span>contrast <b>${pct(Om * Om / (Om * Om + sel * sel), 0)}</b></span>` : `<span>fringe frequency here <b>${num(Math.abs(sel), 2)} MHz</b></span><span>fringe period <b>${Math.abs(sel) > .05 ? num(1000 / Math.abs(sel), 0) + ' ns' : 'none'}</b></span>`;
        };
        cv.addEventListener('click', e => { if (!G) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left; if (x < G.L || x > G.R) return; sel = Math.round((-DMAX + (x - G.L) / (G.R - G.L) * 2 * DMAX) * 2) / 2; upd(); });
        const ctl = h('div', { class: 'stack' });
        const mk = () => { ctl.innerHTML = ''; ctl.append(mode === 'rabi' ? slider({ id: id('o'), label: 'Drive strength Ω/2π', min: 2, max: 16, step: .5, value: Om, fmt: v => num(v, 1) + ' MHz', on: v => { Om = v; upd(); } }) : slider({ id: id('t2'), label: 'Dephasing time T₂*', min: .2, max: 5, step: .1, value: T2, fmt: v => num(v, 1) + ' µs', on: v => { T2 = v; upd(); } })); };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'rabi', label: 'Rabi chevron' }, { v: 'ramsey', label: 'Ramsey fringes' }], mode, v => { mode = v; mk(); upd(); }, 'Experiment')), cv,
          h('div', { class: 'split' }, cut, h('div', { class: 'stack' }, ctl, slider({ id: id('s'), label: 'Detuning for the slice', min: -DMAX, max: DMAX, step: .5, value: sel, fmt: v => num(v, 1) + ' MHz', on: v => { sel = v; upd(); } }), ro)));
        mk(); upd();
      }
    }
  },
  take: ['In the rotating frame a drive gives H = ½ΔZ + ½ΩX: the Bloch vector precesses about (Ω, 0, Δ) at √(Ω² + Δ²).',
    'On resonance, a π pulse is an X gate and a π/2 pulse makes a superposition; the drive phase sets the axis in the equator.',
    'Detuning tilts the axis: faster oscillations with peak P(1) = Ω²/(Ω² + Δ²), which together form the Rabi chevron.',
    'Ramsey fringes oscillate at the detuning and decay with T₂*, giving precise frequency calibration.'],
  quiz: QZ([
    ['A resonant drive has Rabi frequency Ω. How long is a π pulse?', ['t = π/Ω', 't = 2π/Ω', 't = Ω/π', 't = 1/Ω²'], 0, 'On resonance the rotation angle is Ωt. A π rotation needs Ωt = π. With Ω/2π = 10 MHz, that is 1/(2 × 10 MHz) = 50 ns.'],
    ['Starting from |0⟩, what does a resonant π/2 pulse about x produce?', ['|1⟩', 'An equal superposition of |0⟩ and |1⟩ on the equator', '|0⟩ unchanged', 'A mixed state'], 1, 'A quarter turn about x takes the north pole to the equator (to −y with this sign convention), an equal-weight superposition with a relative phase.'],
    ['What does detuning the drive do to Rabi oscillations?', ['Slows them and keeps full contrast', 'Speeds them up and reduces the maximum P(1)', 'Has no effect', 'Stops the oscillation entirely'], 1, 'The effective frequency √(Ω² + Δ²) grows, and the tilted axis means the vector never reaches the south pole: peak P(1) = Ω²/(Ω² + Δ²).'],
    ['With Ω/2π = 10 MHz and Δ/2π = 10 MHz, what is the peak excited-state probability?', ['100%', '50%', '25%', '71%'], 1, 'Ω²/(Ω² + Δ²) = 100/200 = ½. The axis sits halfway between x and z, so the vector sweeps a cone that only reaches the equator.'],
    ['How do control systems usually implement a Z rotation on superconducting qubits?', ['With a long resonant pulse', 'As a virtual Z: shifting the phase of all later pulses', 'By detuning the qubit permanently', 'It cannot be done'], 1, 'Changing the reference phase of later drives is equivalent to rotating the frame about z. It takes no time and adds no error, so Z rotations are effectively free.'],
    ['What does the drive phase control?', ['The rotation angle', 'The axis of rotation within the equatorial plane', 'The qubit frequency', 'The measurement basis only'], 1, 'Phase 0 gives rotation about x, phase 90° rotation about y. Duration and amplitude set the angle.'],
    ['In a Ramsey experiment, what sets the frequency of the fringes?', ['The Rabi frequency', 'The detuning between qubit and drive', 'The T₁ time', 'The number of shots'], 1, 'During the wait the Bloch vector drifts around the equator at the detuning Δ relative to the drive. The second π/2 pulse turns that angle into P(1) = ½(1 + cos Δτ).'],
    ['Why do Ramsey fringes decay?', ['The pulses get weaker', 'Dephasing (T₂*) shrinks the equatorial component during the wait', 'The drive heats the fridge', 'Measurement errors accumulate'], 1, 'Slow fluctuations in the qubit frequency spread the phase accumulated during the wait. Averaged over shots, the fringe contrast decays as e^(−τ/T₂*).'],
    ['What is the symmetry axis of a Rabi chevron?', ['Zero pulse length', 'Zero detuning, the qubit frequency', 'The maximum drive strength', 'The T₁ time'], 1, 'Oscillations are slowest and have full contrast exactly on resonance, and the pattern is symmetric in ±Δ. The centre line therefore locates the qubit frequency.'],
    ['What problem does DRAG pulse shaping address in transmons?', ['Cosmic rays', 'Leakage into the third energy level |2⟩ and phase errors', 'Measurement crosstalk', 'Thermal photons in the fridge'], 1, 'A transmon’s |1⟩→|2⟩ transition is only a few hundred megahertz from |0⟩→|1⟩. A short pulse has enough bandwidth to excite it; DRAG adds a derivative-shaped quadrature component that cancels this.']
  ])
});

/* ---------------- Toffoli and reversible logic ---------------- */
const CIRC = {
  AND: { wires: ['a', 'b', 'out'], anc: [2], ops: [[{ g: 'MCX', cs: [0, 1], t: 2 }]], note: 'Toffoli with the target starting at 0: out = a AND b.' },
  NAND: { wires: ['a', 'b', 'out'], anc: [2], ops: [[{ g: 'MCX', cs: [0, 1], t: 2 }], [{ g: 'X', q: 2 }]], note: 'AND followed by NOT. NAND alone is universal for ordinary logic.' },
  OR: { wires: ['a', 'b', 'out'], anc: [2], ops: [[{ g: 'X', q: 0 }, { g: 'X', q: 1 }], [{ g: 'MCX', cs: [0, 1], t: 2 }], [{ g: 'X', q: 0 }, { g: 'X', q: 1 }, { g: 'X', q: 2 }]], note: 'De Morgan: a OR b = NOT(NOT a AND NOT b). The inputs are restored afterwards.' },
  XOR: { wires: ['a', 'b', 'out'], anc: [2], ops: [[{ g: 'CX', c: 0, t: 2 }], [{ g: 'CX', c: 1, t: 2 }]], note: 'Two CNOTs: out = a ⊕ b. No Toffoli needed.' },
  'Half adder': { wires: ['a', 'b', 'sum', 'carry'], anc: [2, 3], ops: [[{ g: 'MCX', cs: [0, 1], t: 3 }], [{ g: 'CX', c: 0, t: 2 }], [{ g: 'CX', c: 1, t: 2 }]], note: 'carry = a AND b, sum = a ⊕ b.' },
  'Full adder': { wires: ['a', 'b', 'c in → sum', 'carry out'], anc: [3], ops: [[{ g: 'MCX', cs: [0, 1], t: 3 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'MCX', cs: [1, 2], t: 3 }], [{ g: 'CX', c: 1, t: 2 }], [{ g: 'CX', c: 0, t: 1 }]], note: 'Adds three bits in place. The last CNOT uncomputes the intermediate a ⊕ b on wire b, restoring it.' },
  'Uncompute': { wires: ['a', 'b', 'work', 'out'], anc: [2, 3], ops: [[{ g: 'MCX', cs: [0, 1], t: 2 }], [{ g: 'CX', c: 2, t: 3 }], [{ g: 'MCX', cs: [0, 1], t: 2 }]], note: 'Bennett’s trick: compute into a work bit, copy the result out with a CNOT, then run the computation backwards so the work bit returns to 0.' }
};
const runBits = (C, x) => { const b = x.slice(), trace = [b.slice()]; for (const col of C.ops) { for (const op of col) { if (op.g === 'X') b[op.q] ^= 1; else if (op.g === 'CX') b[op.t] ^= b[op.c]; else if (op.g === 'MCX') { if (op.cs.every(k => b[k])) b[op.t] ^= 1; } } trace.push(b.slice()); } return trace; };
LESSONS.push({
  id: 'toffoli', n: 7.3, stage: ST, minutes: 15, title: 'Toffoli, controlled gates and reversible logic',
  lede: 'Quantum circuits cannot throw information away. Classical logic can still be run on them, using the Toffoli gate and a trick for cleaning up the scrap paper afterwards.',
  html: `
<h2>Logic that forgets</h2>
<p>An AND gate takes two bits and returns one. Seeing the output 0 you cannot tell whether the inputs were 00, 01 or 10: information has been destroyed. Rolf Landauer showed in 1961 that erasing a bit has a physical price, at least ${m('k<sub>B</sub>T ln 2')} of heat. Quantum evolution is unitary and therefore reversible, so a quantum computer cannot run AND directly. The fix is to keep the inputs and write the answer into a fresh bit:</p>
${EQ('(x, y, z) → (x, y, z ⊕ f(x, y))')}
<p>Applying the same map twice returns the original bits, so the operation is its own inverse and perfectly reversible.</p>
<h2>The Toffoli gate</h2>
<p>The <strong>Toffoli</strong>, or controlled-controlled-NOT (CCX), flips its target exactly when both controls are 1. With the target starting at 0 it computes AND. With both controls fixed at 1 it is a NOT, and with one control fixed at 1 it is a CNOT, which copies a basis-state bit into a fresh 0 (fan-out). Since AND, NOT and fan-out build any Boolean circuit, the Toffoli on its own, plus a supply of constant bits, is universal for reversible classical computation. Any classical algorithm can run on a quantum computer with at most polynomial overhead.</p>
${LAB('logic')}
<h2>Garbage and uncomputation</h2>
<p>A long reversible computation leaves intermediate results, called <strong>garbage</strong>, scattered over work bits. Classically that is merely untidy. Quantumly it is fatal: if the input is in superposition, the garbage is entangled with it, and entanglement with a leftover register destroys the interference that quantum algorithms depend on. The garbage effectively measures the input.</p>
<p>Charles Bennett’s solution (1973) is to <strong>uncompute</strong>: compute ${m('f(x)')} with garbage, copy the answer into a clean register with CNOTs, then run the whole computation backwards. The work bits return to 0 and only ${m('x')} and ${m('f(x)')} remain. The price is roughly double the gates. Every oracle in Grover’s algorithm and every modular multiplication in Shor’s algorithm is built this way.</p>
${LAB('garbage')}
<h2>Inside the Toffoli</h2>
<p>The Toffoli is not a Clifford gate, so on fault-tolerant hardware it must be built from cheaper pieces. The standard decomposition uses six CNOTs, two Hadamards and seven T or T† gates. T gates are the expensive resource in error-corrected machines ([[L:magic]]), so this <strong>T count</strong> of 7 matters. When the Toffoli computes an AND into a fresh zero that will later be uncomputed, a measurement-based trick by Craig Gidney (2018) cuts the cost to four T gates for the computation and none for the uncomputation.</p>
<p>More generally, any controlled single-qubit gate ${m('C(U)')} can be built from two CNOTs and three single-qubit gates ${m('A, B, C')}, plus a phase gate on the control, using the fact that every ${m('U')} can be written as ${m('e<sup>iα</sup> AXBXC')} with ${m('ABC = I')}. Multi-controlled gates are built from Toffolis and ancillas. Arithmetic circuits, such as the ripple-carry adders inside Shor’s algorithm, are long chains of exactly these pieces.</p>
`,
  labs: {
    logic: {
      title: 'Reversible logic builder',
      cap: 'Toggle the input bits on the left. The small numbers on each wire show its value after every column. The truth table lists every input with the work bits starting at 0; the highlighted row is the current input. Notice that the inputs always survive.',
      build(body, id) {
        let name = 'AND', x = [1, 1, 0, 0];
        const circ = h('div', { class: 'circ-wrap' }), tbl = h('div', { class: 'tbl-wrap' }), inp = h('div', { class: 'btns' }), note = h('p', { class: 'hint', style: 'margin:0' });
        const render = () => {
          const C = CIRC[name], n = C.wires.length; x = x.slice(0, n); while (x.length < n) x.push(0);
          const tr = runBits(C, x), D = drawCircuit(n, C.ops, { labels: C.wires, lw: 92, cw: 60 });
          tr.forEach((b, k) => b.forEach((v, r) => { const xx = k === 0 ? D.lw - 4 : D.X(k - 1) + D.cw / 2 - 2; D.svg.append(sv('text', { x: xx, y: D.Y(r) - 12, class: 'c-sub', style: `font-size:11px;fill:${v ? 'var(--copper)' : 'var(--muted)'};font-weight:700` }, String(v))); }));
          circ.innerHTML = ''; circ.append(D.svg);
          inp.innerHTML = ''; C.wires.forEach((wn, r) => inp.append(h('button', { type: 'button', class: 'gate', title: `Toggle input ${wn}`, 'aria-label': `Input ${wn} is ${x[r]}; toggle`, onclick: () => { x[r] ^= 1; render(); } }, h('span', { style: 'font-size:11px;display:block;color:var(--muted)' }, wn.split(' ')[0]), String(x[r]))));
          const ins = [...Array(n).keys()].filter(r => !C.anc.includes(r)), rows = [];
          for (let m2 = 0; m2 < 1 << ins.length; m2++) { const b = new Array(n).fill(0); ins.forEach((r, k) => { b[r] = (m2 >> (ins.length - 1 - k)) & 1; }); const out = runBits(C, b).pop(); const cur = b.every((v, r) => v === x[r]); rows.push(`<tr${cur ? ' style="background:var(--copper-wash)"' : ''}><td>${ins.map(r => b[r]).join(' ')}</td><td>${out.join(' ')}</td></tr>`); }
          tbl.innerHTML = `<table class="tbl"><thead><tr><th>inputs ${ins.map(r => C.wires[r].split(' ')[0]).join(' ')}</th><th>outputs ${C.wires.map(w2 => w2.split(' ')[0]).join(' ')}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
          note.textContent = C.note;
        };
        body.append(h('div', { class: 'btns' }, ...Object.keys(CIRC).map(k => btn(k, () => { name = k; x = CIRC[k].wires.map((_, r) => CIRC[k].anc.includes(r) ? 0 : 1); render(); }, 'sm'))), note, circ, h('div', { class: 'split' }, field('Input bits (tap to flip)', inp), tbl));
        render();
      }
    },
    garbage: {
      title: 'Garbage destroys interference',
      cap: 'The data qubit x goes through H, then a CNOT copies it into a work qubit (a “computation” that leaves garbage), then H again. Without uncomputing, x is entangled with the garbage: its Bloch vector shrinks to the centre and the final H gives 50/50. Uncomputing first restores the interference and x returns to |0⟩.',
      build(body, id) {
        let unc = false, stp = 0;
        const circ = h('div', { class: 'circ-wrap' }), bars = h('div'), sb = stateBars(bars, 2, { height: 150 }), sph = canvas('sq', 'max-width:220px;margin:0 auto'), bv = new BlochView(sph, { labels: 'min', trail: false });
        const stat = h('div', { class: 'status' });
        const ops = () => unc ? [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'H', q: 0 }]] : [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'H', q: 0 }]];
        const render = () => {
          const O = ops(); stp = Math.min(stp, O.length); const st = new QState(2);
          for (let k = 0; k < stp; k++) for (const op of O[k]) { if (op.g === 'H') st.g('H', op.q); else st.cx(op.c, op.t); }
          circ.innerHTML = ''; circ.append(drawCircuit(2, O, { labels: ['x', 'work'], at: stp, cw: 64 }).svg);
          sb.state(st.re, st.im); bv.go(st.bloch(0)); const p0 = 1 - st.prob1(0);
          const done = stp === O.length;
          stat.className = 'status' + (done ? (unc ? ' good' : ' bad') : '');
          stat.textContent = done ? (unc ? `Finished: x is back in |0⟩ (P(0) = ${pct(p0, 0)}). Interference worked.` : `Finished: P(x = 0) = ${pct(p0, 0)}. The garbage qubit holds a copy of x, so the two paths no longer interfere.`) : `Step ${stp} of ${O.length}. Length of x’s Bloch vector: ${num(V.norm(st.bloch(0)), 2)}.`;
        };
        body.append(h('div', { class: 'btns' }, seg([{ v: false, label: 'Leave the garbage' }, { v: true, label: 'Uncompute first' }], unc, v => { unc = v; stp = 0; render(); }, 'Garbage handling'),
          btn('Back', () => { if (stp > 0) { stp--; render(); } }, 'sm'), btn('Step', () => { stp++; render(); }, 'pri sm'), btn('Run all', () => { stp = 9; render(); }, 'sm')),
          circ, h('div', { class: 'split' }, h('div', { class: 'stack' }, bars, stat), field('Data qubit x', sph)));
        render();
      }
    }
  },
  take: ['Unitary evolution is reversible, so quantum circuits compute f(x) as (x, z) → (x, z ⊕ f(x)) instead of overwriting inputs.',
    'The Toffoli (CCX) gate computes AND into a fresh 0 and, with constant bits, is universal for reversible classical logic.',
    'Leftover garbage entangled with a superposed input destroys interference; Bennett’s uncomputation (compute, copy, reverse) removes it.',
    'A Toffoli costs 7 T gates in the standard decomposition, which matters because T gates are the expensive resource in fault tolerance.'],
  quiz: QZ([
    ['Why can’t a quantum computer apply an ordinary AND gate directly?', ['AND is too slow', 'AND is irreversible, but quantum evolution is unitary and must be reversible', 'AND needs three qubits', 'AND cannot be written as a matrix of real numbers'], 1, 'AND maps four inputs onto two outputs, so it cannot be undone. Unitary operations always have an inverse, so they can only implement reversible maps.'],
    ['What does a Toffoli gate do to |1, 1, 0⟩ (controls first)?', ['Leaves it unchanged', 'Produces |1, 1, 1⟩', 'Produces |0, 0, 1⟩', 'Produces a superposition'], 1, 'Both controls are 1, so the target flips from 0 to 1. With the target starting at 0, the result is the AND of the controls.'],
    ['According to Landauer’s principle, what is the minimum heat released by erasing one bit at temperature T?', ['0', 'k_B T ln 2', 'k_B T', 'ħω'], 1, 'Erasing a bit reduces the entropy of the information-bearing system by ln 2 in units of k_B, which must be dumped into the environment as heat of at least k_B T ln 2.'],
    ['How do you build OR from a Toffoli?', ['Toffoli followed by CNOT', 'Negate both inputs, apply Toffoli, then negate the inputs back and negate the output', 'Two Toffolis in a row', 'It is impossible'], 1, 'De Morgan’s law: a OR b = NOT(NOT a AND NOT b). X gates on the inputs and output around a Toffoli implement exactly that, restoring the inputs afterwards.'],
    ['What is “garbage” in a reversible computation?', ['Wrong answers', 'Intermediate values left in work registers after computing the result', 'Qubits that have decohered', 'Unused gates'], 1, 'Reversible circuits cannot erase intermediate results, so they pile up in work bits. They must be cleaned up before the result is used in a quantum algorithm.'],
    ['Why is garbage harmful in a quantum algorithm?', ['It uses too much memory', 'It is entangled with the superposed input and destroys interference', 'It causes measurement errors', 'It makes the circuit irreversible'], 1, 'A garbage register correlated with x acts like a which-path record. The input’s amplitudes can no longer interfere, as the lab shows when x ends up 50/50 instead of returning to |0⟩.'],
    ['What are the three steps of Bennett’s uncomputation trick?', ['Measure, reset, repeat', 'Compute, copy the result with CNOTs, run the computation in reverse', 'Encode, decode, correct', 'Prepare, rotate, measure'], 1, 'Computing produces the result plus garbage; copying puts the result in a clean register; reversing the computation returns all work bits to 0.'],
    ['How many T gates does the standard Toffoli decomposition use?', ['1', '4', '7', '15'], 2, 'The textbook circuit uses six CNOTs, two Hadamards and seven T or T† gates. Measurement-based tricks reduce the cost when the Toffoli computes into a fresh ancilla that is later uncomputed.'],
    ['With one control fixed at 1, what does a Toffoli reduce to?', ['NOT', 'CNOT', 'SWAP', 'Identity'], 1, 'If one control is always 1, the target flips whenever the other control is 1: that is a CNOT. With both controls fixed at 1 it is a NOT.'],
    ['In the full adder in the lab, why is there a final CNOT from a to b?', ['To compute the carry', 'To uncompute the intermediate a ⊕ b and restore b', 'To measure the result', 'To add a fourth bit'], 1, 'The second gate wrote a ⊕ b onto wire b. Applying CNOT(a→b) again returns b to its original value, leaving only the inputs, the sum and the carry.']
  ])
});

/* ---------------- Distinguishing states ---------------- */
LESSONS.push({
  id: 'distinguish', n: 7.6, stage: ST, minutes: 14, title: 'Telling quantum states apart',
  lede: 'Two states that overlap can never be distinguished perfectly by any measurement. How well you can do is a precise number, and the limit is the reason quantum cryptography works.',
  html: `
<h2>The guessing game</h2>
<p>Someone prepares a qubit in ${m('|ψ⟩')} with probability ${m('p')} or in ${m('|φ⟩')} with probability ${m('1 − p')}, and hands it to you. You may make one measurement of your choosing, then must guess which state you were given. If the two states are orthogonal, measuring in a basis that contains both wins every time. If they overlap, ${m('⟨ψ|φ⟩ ≠ 0')}, every measurement sometimes misleads you. This is not a limitation of current technology: a measurement that could always tell overlapping states apart would let you copy unknown states, which [[L:teleportation]] showed is impossible.</p>
<h2>The Helstrom bound</h2>
<p>Carl Helstrom found the best achievable success probability in 1969:</p>
${EQ('P<sub>success</sub> = ½ (1 + √(1 − 4p(1 − p)|⟨ψ|φ⟩|²))')}
<p>For equal priors this becomes ${m('½(1 + √(1 − |⟨ψ|φ⟩|²))')}. Identical states give ½, no better than a coin; orthogonal states give 1. On the Bloch sphere the optimal measurement is along the direction of ${m('p r<sub>ψ</sub> − (1 − p) r<sub>φ</sub>')}, where the ${m('r')}’s are the Bloch vectors. For equal priors that is the axis through the two states’ difference, symmetric between them, and the success probability is ${m('½ + ¼|r<sub>ψ</sub> − r<sub>φ</sub>|')}.</p>
<p>The quantity ${m('½|r<sub>ψ</sub> − r<sub>φ</sub>|')} is the <strong>trace distance</strong> between the two states, the quantum version of the statistical distance between two probability distributions. It is the standard way to say how different two quantum states are, and it reappears whenever noise or errors are quantified.</p>
${LAB('helstrom')}
<h2>Never wrong, sometimes silent</h2>
<p>A different goal: never make a mistake, but allow yourself to answer “I don’t know”. This is <strong>unambiguous state discrimination</strong>. It needs a generalized measurement with three outcomes, called a <strong>POVM</strong>, which can be built by coupling the qubit to an ancilla and measuring both. For equal priors the smallest possible probability of the inconclusive answer is ${m('|⟨ψ|φ⟩|')}, the Ivanovic–Dieks–Peres bound. Whenever the answer is conclusive, it is certainly right.</p>
${LAB('usd')}
<h2>Why it matters</h2>
<ul>
<li><strong>Cryptography.</strong> BB84 ([[L:bb84]]) sends states from two bases that overlap. An eavesdropper cannot tell which was sent without errors, and those errors reveal her. The B92 protocol uses just two overlapping states and relies on unambiguous discrimination at the receiver.</li>
<li><strong>Quantum money and authentication.</strong> Schemes in which a bank can verify a note it issued but a forger cannot copy it rest on the same limits.</li>
<li><strong>Sensing and hypothesis testing.</strong> Deciding whether a weak signal was present is a discrimination problem. With many copies, the error falls exponentially at a rate set by the quantum Chernoff bound.</li>
</ul>
${NOTE('Copying would beat the bound', `<p>If you could clone the unknown state, you could make a thousand copies, measure them all, and identify the state almost perfectly, beating Helstrom. Equally, if you could beat Helstrom you could prepare as many copies as you liked of the state you identified. The no-cloning theorem and the limits on discrimination are two faces of the same fact.</p>`)}
`,
  labs: {
    helstrom: {
      title: 'The best single measurement',
      cap: 'A slice through the Bloch sphere containing the two states |ψ⟩ (copper) and |φ⟩ (blue). The measurement axis (black) says “guess ψ” at one end and “guess φ” at the other. Drag it, or press Optimal. The chart shows the success probability for every axis direction, with the Helstrom bound as the peak.',
      build(body, id) {
        let al = rad(70), p = .5, be = 0, G = null;
        const cv = canvas('sq', 'max-width:360px;margin:0 auto'), ch = canvas('', 'height:190px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const rP = () => [Math.sin(al / 2), Math.cos(al / 2)], rF = () => [-Math.sin(al / 2), Math.cos(al / 2)];
        const Ps = b => { const n = [Math.sin(b), Math.cos(b)], a = rP(), f = rF(); return .5 + .5 * (n[0] * (p * a[0] - (1 - p) * f[0]) + n[1] * (p * a[1] - (1 - p) * f[1])); };
        const best = () => { const a = rP(), f = rF(); return Math.atan2(p * a[0] - (1 - p) * f[0], p * a[1] - (1 - p) * f[1]); };
        const helst = () => .5 * (1 + Math.sqrt(Math.max(0, 1 - 4 * p * (1 - p) * Math.cos(al / 2) ** 2)));
        const dia = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w, H) / 2 * .6, cx = w / 2, cy = H / 2; G = { S, cx, cy };
          const P = (v, r = 1) => [cx + r * S * v[0], cy - r * S * v[1]];
          ctx.strokeStyle = T.line; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, S, 0, TAU); ctx.stroke();
          txt(ctx, '|0⟩', cx - 20, cy - S + 4, { font: MATHFONT(14) }); txt(ctx, '|1⟩', cx - 20, cy + S - 4, { font: MATHFONT(14) }); txt(ctx, '|+⟩', cx + S + 16, cy, { font: MATHFONT(14) });
          const n = [Math.sin(be), Math.cos(be)];
          ctx.strokeStyle = T.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P(n, -1.18)); ctx.lineTo(...P(n, 1.18)); ctx.stroke();
          dot(ctx, ...P(n, 1.18), 6, T.copper, T.surface); dot(ctx, ...P(n, -1.18), 6, T.cyan, T.surface);
          txt(ctx, 'guess ψ', ...P(n, 1.36), { font: '600 11px "JetBrains Mono",monospace', color: T.copper }); txt(ctx, 'guess φ', ...P(n, -1.36), { font: '600 11px "JetBrains Mono",monospace', color: T.cyan });
          arrow(ctx, cx, cy, ...P(rP()), T.copper, 3, 11); arrow(ctx, cx, cy, ...P(rF()), T.cyan, 3, 11);
          txt(ctx, 'ψ', ...P(rP(), 1.12), { font: MATHFONT(17), color: T.copper }); txt(ctx, 'φ', ...P(rF(), 1.12), { font: MATHFONT(17), color: T.cyan });
        });
        const chart = painter(ch, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-180, 180], y: [0, 1.05], xt: [-180, -90, 0, 90, 180], yt: [0, .5, 1], xf: v => v + '°', yf: v => pct(v, 0), xl: 'measurement axis angle', yl: 'P(success)' });
          polyline(ctx, [[A.X(-180), A.Y(helst())], [A.X(180), A.Y(helst())]], T.copper, 1.2, [5, 4]);
          polyline(ctx, [[A.X(-180), A.Y(Math.max(p, 1 - p))], [A.X(180), A.Y(Math.max(p, 1 - p))]], T.muted, 1.2, [2, 4]);
          const pts = []; for (let k = -180; k <= 180; k += 2) pts.push([A.X(k), A.Y(Ps(rad(k)))]); polyline(ctx, pts, T.cyan, 2.3);
          const bd = ((deg(be) + 540) % 360) - 180; dot(ctx, A.X(bd), A.Y(Ps(be)), 6, T.ink, T.surface);
        });
        const upd = () => {
          const ov = Math.cos(al / 2);
          ro.innerHTML = `<span class="k">overlap |⟨ψ|φ⟩|     </span>${num(ov, 3)}<br><span class="k">trace distance       </span>${num(Math.sin(al / 2), 3)}<br><span class="k">this measurement     </span>${pct(Ps(be), 1)} correct<br><span class="k">Helstrom bound       </span>${pct(helst(), 1)}<br><span class="k">guessing blind       </span>${pct(Math.max(p, 1 - p), 1)}`;
          dia.inv(); chart.inv();
        };
        dragHandles(cv, () => 'm', (k, x, y) => { be = Math.atan2(x - G.cx, G.cy - y); upd(); });
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, ch,
          slider({ id: id('a'), label: 'Angle between the states on the sphere', min: 0, max: 180, step: 1, value: 70, fmt: v => v + '°', on: v => { al = rad(v); upd(); } }),
          slider({ id: id('p'), label: 'Probability p of ψ', min: 0, max: 1, step: .01, value: .5, fmt: v => num(v, 2), on: v => { p = v; upd(); } }),
          h('div', { class: 'btns' }, btn('Optimal measurement', () => { be = best(); upd(); }, 'pri sm'), btn('Measure in Z', () => { be = 0; upd(); }, 'sm')), ro)));
        upd();
      }
    },
    usd: {
      title: 'Minimum error versus never wrong',
      cap: 'The same random sequence of states (equal priors) is handed to two strategies. Each tile is one trial: filled for a correct answer, crossed for a wrong one, faint for “don’t know”. Helstrom always answers and is sometimes wrong; unambiguous discrimination is never wrong but sometimes gives up.',
      build(body, id) {
        let al = rad(70), trials = [];
        const cv = canvas('', 'height:120px'), ch = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const H_ = a => .5 * (1 + Math.sin(a / 2)), U_ = a => 1 - Math.cos(a / 2);
        const run = n => { for (let k = 0; k < n; k++) { const r1 = Math.random(), r2 = Math.random(); trials.push({ h: r1 < H_(al) ? 1 : 0, u: r2 < U_(al) ? 1 : 2 }); } if (trials.length > 4000) trials = trials.slice(-4000); upd(); };
        const tiles = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), n = Math.max(10, Math.floor((w - 90) / 12)), last = trials.slice(-n);
          txt(ctx, 'Helstrom', 4, 32, { align: 'left', font: '600 11px "JetBrains Mono",monospace', color: T.ink }); txt(ctx, 'never wrong', 4, 82, { align: 'left', font: '600 11px "JetBrains Mono",monospace', color: T.ink });
          last.forEach((t, k) => {
            const x = 90 + k * 12;
            const draw = (y, kind) => { if (kind === 1) { ctx.fillStyle = T.good; ctx.fillRect(x, y, 9, 18); } else if (kind === 0) { ctx.strokeStyle = T.bad; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 9, y + 18); ctx.moveTo(x + 9, y); ctx.lineTo(x, y + 18); ctx.stroke(); } else { ctx.fillStyle = T.line; ctx.fillRect(x, y, 9, 18); } };
            draw(23, t.h); draw(73, t.u);
          });
        });
        const chart = painter(ch, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 1], y: [0, 1.05], xt: [0, .25, .5, .75, 1], yt: [0, .5, 1], yf: v => pct(v, 0), xl: 'overlap |⟨ψ|φ⟩|', yl: 'probability' });
          const L = (f, col, dash) => { const pts = []; for (let k = 0; k <= 100; k++) { const ov = k / 100; pts.push([A.X(ov), A.Y(f(ov))]); } polyline(ctx, pts, col, 2.2, dash); };
          L(ov => .5 * (1 + Math.sqrt(1 - ov * ov)), T.cyan); L(ov => .5 * (1 - Math.sqrt(1 - ov * ov)), T.bad, [5, 4]); L(ov => 1 - ov, T.copper); L(ov => ov, T.muted, [2, 4]);
          const ov = Math.cos(al / 2); polyline(ctx, [[A.X(ov), A.T], [A.X(ov), A.B]], T.ink, 1, [3, 3]);
        });
        const upd = () => {
          const n = trials.length, hc = trials.filter(t => t.h === 1).length, uc = trials.filter(t => t.u === 1).length, ui = trials.filter(t => t.u === 2).length;
          ro.innerHTML = `<span class="k">trials </span>${n}<br><span class="k">Helstrom        </span>correct ${n ? pct(hc / n, 1) : '—'} · wrong ${n ? pct(1 - hc / n, 1) : '—'} &nbsp;(theory ${pct(H_(al), 1)} / ${pct(1 - H_(al), 1)})<br><span class="k">never wrong     </span>correct ${n ? pct(uc / n, 1) : '—'} · don’t know ${n ? pct(ui / n, 1) : '—'} · wrong 0% &nbsp;(theory ${pct(U_(al), 1)} / ${pct(1 - U_(al), 1)})`;
          tiles.inv(); chart.inv();
        };
        body.append(cv, h('div', { class: 'split' }, h('div', { class: 'stack' }, ch, legendRow([['Helstrom correct', 'var(--cyan)'], ['Helstrom wrong', 'var(--bad)', 1], ['never wrong: correct', 'var(--copper)'], ['never wrong: don’t know', 'var(--muted)', 1]])), h('div', { class: 'stack' },
          slider({ id: id('a'), label: 'Angle between the states on the sphere', min: 0, max: 180, step: 1, value: 70, fmt: v => v + '°', on: v => { al = rad(v); trials = []; upd(); } }),
          h('div', { class: 'btns' }, btn('Run 1 trial', () => run(1), 'sm'), btn('Run 100', () => run(100), 'pri sm'), btn('Run 2,000', () => run(2000), 'sm')), ro)));
        run(40);
      }
    }
  },
  take: ['Overlapping states (⟨ψ|φ⟩ ≠ 0) cannot be distinguished perfectly by any measurement.',
    'Helstrom bound: P_success = ½(1 + √(1 − 4p(1−p)|⟨ψ|φ⟩|²)), reached by measuring along p r_ψ − (1−p) r_φ on the Bloch sphere.',
    'Unambiguous discrimination is never wrong but must sometimes answer “don’t know”, at least |⟨ψ|φ⟩| of the time for equal priors.',
    'These limits, closely tied to no-cloning, are what make eavesdropping on quantum key distribution detectable.'],
  quiz: QZ([
    ['When can two pure states be distinguished with certainty by a single measurement?', ['Always', 'Only when they are orthogonal', 'Only when they have the same phase', 'Only for photons'], 1, 'If ⟨ψ|φ⟩ = 0, measuring in a basis containing both states identifies them perfectly. Any overlap means some measurement outcomes are possible for both states.'],
    ['For equal priors, what is the Helstrom success probability for |0⟩ versus |+⟩?', ['50%', 'About 85%', '100%', '75%'], 1, '|⟨0|+⟩|² = ½, so P = ½(1 + √(1 − ½)) = ½(1 + 0.707) ≈ 0.854. Measuring in Z or X alone gives only 75%.'],
    ['What does the Helstrom success probability equal for two identical states?', ['0', '½', '1', 'It depends on the measurement'], 1, 'With |⟨ψ|φ⟩| = 1 the formula gives ½(1 + 0) = ½: no measurement does better than guessing.'],
    ['On the Bloch sphere, with equal priors, where should the optimal measurement axis point?', ['Along z always', 'Along the difference of the two Bloch vectors, symmetric between the states', 'Along one of the two states', 'Perpendicular to both states'], 1, 'The success probability is ½ + ½ n·(r_ψ − r_φ)/2, maximized when n points along r_ψ − r_φ. Measuring along one of the states is not optimal.'],
    ['What is the trace distance between two pure qubit states with Bloch vectors r₁ and r₂?', ['|r₁ − r₂|', '½|r₁ − r₂|', 'r₁ · r₂', '|r₁| + |r₂|'], 1, 'Half the Euclidean distance between Bloch vectors. It runs from 0 for identical states to 1 for orthogonal (antipodal) ones.'],
    ['What is unambiguous state discrimination?', ['A measurement that is always right', 'A measurement that is never wrong but sometimes returns “don’t know”', 'Measuring two copies at once', 'A classical post-processing step'], 1, 'It trades conclusiveness for certainty: conclusive results are always correct, at the price of an inconclusive outcome some of the time.'],
    ['For equal priors, what is the minimum probability of the inconclusive outcome in unambiguous discrimination?', ['|⟨ψ|φ⟩|²', '|⟨ψ|φ⟩|', '½', '0'], 1, 'The Ivanovic–Dieks–Peres bound is |⟨ψ|φ⟩|, the overlap itself, not its square. For |0⟩ versus |+⟩ that is about 71%.'],
    ['What kind of measurement does unambiguous discrimination need?', ['A projective measurement in the Z basis', 'A generalized measurement (POVM) with three outcomes', 'No measurement', 'Two sequential Z measurements'], 1, 'A qubit has only two orthogonal outcomes, but three are needed here. A POVM, implemented by coupling to an ancilla and measuring the larger system, provides them.'],
    ['Why would cloning unknown states let you beat the Helstrom bound?', ['Clones are always orthogonal', 'Many copies could be measured to identify the state with arbitrarily small error', 'Cloning reduces noise', 'It would not'], 1, 'With n copies the overlap becomes |⟨ψ|φ⟩|ⁿ, which shrinks exponentially, so the error can be made arbitrarily small. Since single-copy limits are fundamental, cloning must be impossible.'],
    ['How does BB84 use the impossibility of distinguishing overlapping states?', ['It doesn’t', 'Eve cannot identify the sent states without errors, and those errors reveal her', 'It lets Bob read every bit perfectly', 'It makes the key longer'], 1, 'The four BB84 states come from two mutually overlapping bases. Any attempt to learn them disturbs some, raising the error rate that Alice and Bob check.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Rabi frequency', 'The rate Ω at which a resonant drive rotates a qubit between |0⟩ and |1⟩; proportional to the drive amplitude.', 'rabi'],
  ['Detuning', 'The difference Δ between the qubit frequency and the drive frequency. Detuning tilts the rotation axis.', 'rabi'],
  ['π pulse', 'A drive pulse whose rotation angle is π, which flips |0⟩ and |1⟩ (an X or Y gate).', 'rabi'],
  ['Ramsey experiment', 'Two π/2 pulses separated by a wait; the resulting fringes oscillate at the detuning and decay with T₂*.', 'rabi'],
  ['Rotating-wave approximation', 'Dropping the rapidly oscillating terms of a driven qubit’s Hamiltonian in the frame rotating with the drive.', 'rabi'],
  ['Toffoli gate', 'The controlled-controlled-NOT: flips the target when both controls are 1. Universal for reversible classical logic.', 'toffoli'],
  ['Landauer’s principle', 'Erasing one bit of information releases at least k_B T ln 2 of heat.', 'toffoli'],
  ['Uncomputation', 'Running a computation backwards after copying out its result, returning work qubits to 0 so they no longer spoil interference.', 'toffoli'],
  ['Helstrom bound', 'The highest probability of correctly identifying which of two known states was prepared using one measurement.', 'distinguish'],
  ['Trace distance', 'A measure of how distinguishable two quantum states are; for qubits, half the distance between their Bloch vectors.', 'distinguish'],
  ['Unambiguous state discrimination', 'A measurement strategy that never misidentifies a state but sometimes returns an inconclusive result.', 'distinguish'],
  ['POVM', 'A generalized measurement whose outcomes need not be orthogonal projections; realized by measuring the system together with an ancilla.', 'distinguish']
);
})();
