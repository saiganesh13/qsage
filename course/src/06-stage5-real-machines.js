/* =====================================================================
   Stage 5 · 10 mK · Real machines
   ===================================================================== */
(() => {

/* ---------------- Lesson 17 · Noise and decoherence ---------------- */
LESSONS.push({
  id: 'decoherence', n: 17, stage: 4, minutes: 11, title: 'Noise and decoherence',
  lede: 'A qubit is never perfectly isolated. Its surroundings slowly learn about it, and the quantum information leaks away. Two time constants, T₁ and T₂, describe how fast.',
  html: `
<h2>Energy relaxation: T₁</h2>
<p>A qubit in its excited state ${m('|1⟩')} eventually hands its energy to the environment and drops to ${m('|0⟩')}. The excited population decays as ${m('e<sup>−t/T₁</sup>')}. On the Bloch sphere the vector is pulled toward the north pole. ${m('T₁')} is called the relaxation time.</p>
<h2>Dephasing: T₂</h2>
<p>Small random wobbles in the qubit’s frequency, from fluctuating fields or nearby defects, scramble the relative phase between ${m('|0⟩')} and ${m('|1⟩')}. Averaged over many runs, the horizontal part of the Bloch vector shrinks as ${m('e<sup>−t/T₂</sup>')}. Relaxation destroys phase as well, which is why ${m('T₂ ≤ 2T₁')} always holds.</p>
<p>Both processes shorten the Bloch vector. A shortened vector is no longer a pure state but a <strong>mixed state</strong>: a qubit that is partly random. In the lab, a small detuning makes the vector precess around the z axis while it decays, tracing the spiral seen in a Ramsey experiment.</p>
${EQ('x(t) = e<sup>−t/T₂</sup>[x₀ cos ωt − y₀ sin ωt],&nbsp;&nbsp; z(t) = 1 − (1 − z₀) e<sup>−t/T₁</sup>')}
${LAB('decay')}
<h2>Gate errors add up</h2>
<p>Every gate also has some chance of going wrong. If each gate succeeds with probability ${m('F')}, a circuit of ${m('G')} gates runs without a single error with probability about ${m('F<sup>G</sup>')}. At 99.9% per gate, 1,000 gates succeed only 37% of the time, and 10,000 gates almost never do.</p>
${LAB('budget')}
<p>This arithmetic is the reason long algorithms such as Shor’s need quantum error correction, the subject of [[L:qec]]. Physical error rates around 0.1% are good enough to make error correction work, but not to run a million-gate algorithm directly.</p>
<h2>Typical numbers</h2>
<p>Coherence times vary enormously between platforms. Superconducting qubits commonly reach tens to hundreds of microseconds, while trapped-ion and neutral-atom qubits can hold their phase for a second or longer. Gate speeds vary just as much, so a fairer figure of merit is how many gates fit inside the coherence time, together with the error per gate. [[L:hardware]] compares the platforms.</p>
`,
  labs: {
    decay: {
      title: 'Decay on the Bloch sphere',
      cap: 'Press Play to let time run. The trail shows the path of the Bloch vector. Curves on the right are its x and z components; the dashed envelope is e^(−t/T₂). T₂ cannot be set above 2T₁.',
      build(body, id) {
        let T1 = 60, T2 = 40, det = .04, t = 0, play = false, v0 = [1, 0, 0], last = 0;
        const tmax = () => 3 * Math.max(T1, T2);
        const at = tt => { const w = TAU * det * tt, e2 = Math.exp(-tt / T2); return [e2 * (v0[0] * Math.cos(w) - v0[1] * Math.sin(w)), e2 * (v0[0] * Math.sin(w) + v0[1] * Math.cos(w)), 1 - (1 - v0[2]) * Math.exp(-tt / T1)]; };
        const cv = canvas('sq'), bv = new BlochView(cv, { trail: false }), ch = canvas('', 'height:230px'), ro = h('div', { class: 'chipline' });
        const pc = painter(ch, ({ ctx, w, h: H }) => {
          const T = Theme.get(), M = tmax(), A = axes(ctx, w, H, { x: [0, M], y: [-1, 1], xt: [0, Math.round(M / 3), Math.round(2 * M / 3), Math.round(M)], xf: v => v + ' µs', yt: [-1, 0, 1], xl: 'time', yl: 'Bloch components' });
          const px = [], pz = [], env = [], envn = [];
          for (let i = 0; i <= 240; i++) { const tt = M * i / 240, v = at(tt); px.push([A.X(tt), A.Y(v[0])]); pz.push([A.X(tt), A.Y(v[2])]); const e = Math.exp(-tt / T2) * Math.hypot(v0[0], v0[1]); env.push([A.X(tt), A.Y(e)]); envn.push([A.X(tt), A.Y(-e)]); }
          polyline(ctx, env, T.muted, 1, [3, 3]); polyline(ctx, envn, T.muted, 1, [3, 3]);
          polyline(ctx, px, T.cyan, 2); polyline(ctx, pz, T.copper, 2);
          txt(ctx, '⟨X⟩ = x', A.R - 4, A.T + 8, { align: 'right', color: T.cyan, font: '600 11px "JetBrains Mono",monospace' });
          txt(ctx, '⟨Z⟩ = z', A.R - 4, A.T + 22, { align: 'right', color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
          const x = A.X(t); polyline(ctx, [[x, A.T], [x, A.B]], T.ink, 1, [2, 3]);
        });
        const show = (keepTrail) => {
          const v = at(t); bv.v = v; if (keepTrail) { bv.trail.push(v); if (bv.trail.length > 900) bv.trail.shift(); } bv.inv(); pc.inv();
          ro.innerHTML = `<span>t <b>${num(t, 1)} µs</b></span><span>vector length <b>${num(V.norm(v), 2)}</b></span><span>P(1) <b>${pct((1 - v[2]) / 2, 1)}</b></span>`;
        };
        const fullTrail = () => { bv.trail = []; for (let i = 0; i <= 300; i++) { const tt = t * i / 300; bv.trail.push(at(tt)); } };
        const restart = () => { t = 0; bv.trail = []; tS.input.max = tmax(); tS.set(0); show(false); };
        Scope.tick(now => {
          const dt = Math.min(50, now - (last || now)); last = now;
          if (!play) return; t += dt * tmax() / (reduced() ? 2500 : 7000);
          if (t >= tmax()) { t = tmax(); play = false; pb.textContent = 'Play'; }
          tS.set(t); show(true);
        });
        const pb = btn('Play', () => { if (t >= tmax()) restart(); play = !play; pb.textContent = play ? 'Pause' : 'Play'; }, 'pri');
        const tS = slider({ id: id('t'), label: 'Time', min: 0, max: tmax(), step: .1, value: 0, fmt: v => num(v, 1) + ' µs', on: v => { play = false; pb.textContent = 'Play'; t = v; fullTrail(); show(false); } });
        const s1 = slider({ id: id('t1'), label: 'T₁, relaxation time', min: 5, max: 200, step: 1, value: T1, fmt: v => v + ' µs', on: v => { T1 = v; if (T2 > 2 * T1) { T2 = 2 * T1; } s2.input.max = 2 * T1; s2.set(T2); restart(); } });
        const s2 = slider({ id: id('t2'), label: 'T₂, dephasing time', min: 2, max: 2 * T1, step: 1, value: T2, fmt: v => v + ' µs', on: v => { T2 = v; restart(); } });
        const s3 = slider({ id: id('det'), label: 'Detuning', min: 0, max: .15, step: .005, value: det, fmt: v => num(v * 1000, 0) + ' kHz', on: v => { det = v; restart(); } });
        const starts = seg([{ v: '+', label: '|+⟩' }, { v: '+i', label: '|+i⟩' }, { v: '1', label: '|1⟩' }, { v: 't', label: 'θ = 60°' }], '+', v => { v0 = v === 't' ? fromAngles(rad(60), 0) : CARD[v].slice(); restart(); }, 'Starting state');
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, field('Start in', starts), h('div', { class: 'btns' }, pb, btn('Restart', restart)), tS, s1, s2, s3, ro)), ch);
        restart();
      }
    },
    budget: {
      title: 'Error budget',
      cap: 'Probability that a circuit runs with no gate error at all, (1 − ε)^G. The faint lines are error rates of 1%, 0.1% and 0.01% for comparison.',
      build(body, id) {
        let lgE = -3, lgG = 3;
        const cv = canvas('', 'height:220px'), out = h('div', { class: 'status' });
        const ok = (e, G) => Math.exp(G * Math.log1p(-e));
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 1e6], xlog: true, y: [0, 1], xt: [1, 10, 100, 1e3, 1e4, 1e5, 1e6], xf: v => v >= 1e3 ? (v / 1e3) + 'k' : String(v), yt: [0, .5, 1], yf: v => pct(v, 0), xl: 'gates in the circuit', yl: 'P(no error)' });
          const curve = (e, col, lw, dash) => { const p = []; for (let i = 0; i <= 200; i++) { const G = Math.pow(10, 6 * i / 200); p.push([A.X(G), A.Y(ok(e, G))]); } polyline(ctx, p, col, lw, dash); };
          [1e-2, 1e-3, 1e-4].forEach(e => curve(e, T.line, 1.5, [4, 4]));
          curve(Math.pow(10, lgE), T.copper, 2.5);
          const G = Math.pow(10, lgG); dot(ctx, A.X(G), A.Y(ok(Math.pow(10, lgE), G)), 6, T.copper, T.surface);
        });
        const upd = () => { const e = Math.pow(10, lgE), G = Math.round(Math.pow(10, lgG)), p = ok(e, G); out.innerHTML = `With an error rate of <b>${pct(e, e < 1e-3 ? 3 : 2)}</b> per gate, a circuit of <b>${G.toLocaleString('en-US')}</b> gates runs cleanly <b>${p < 1e-4 ? 'almost never (' + sci(p, 1) + ')' : pct(p, 1)}</b> of the time. Expected number of errors: ${num(e * G, e * G < 10 ? 2 : 0)}.`; pc.inv(); };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('e'), label: 'Error per gate', min: -5, max: -1, step: .1, value: lgE, fmt: v => pct(Math.pow(10, v), v < -3 ? 3 : 2), on: v => { lgE = v; upd(); } }),
          slider({ id: id('g'), label: 'Number of gates', min: 0, max: 6, step: .1, value: lgG, fmt: v => Math.round(Math.pow(10, v)).toLocaleString('en-US'), on: v => { lgG = v; upd(); } }), out)));
        upd();
      }
    }
  },
  take: ['T₁ is the time for an excited qubit to relax to |0⟩; T₂ is the time for its phase to scramble.',
    'Decoherence shortens the Bloch vector, turning a pure state into a mixed one; T₂ ≤ 2T₁.',
    'A circuit of G gates with error ε per gate succeeds with probability about (1 − ε)^G.',
    'Long algorithms are impossible without error correction.'],
  quiz: [
    { q: 'If T₁ = 100 µs, what is the largest possible T₂?', o: ['50 µs', '100 µs', '200 µs', 'No limit'], a: 2, why: 'Relaxation also destroys phase, so T₂ ≤ 2T₁.' },
    { q: 'Each gate fails with probability 0.1%. Roughly how often does a 1,000-gate circuit run with no errors?', o: ['99.9%', '90%', '37%', '0.1%'], a: 2, why: 'All 1,000 gates must succeed, which happens with probability 0.999¹⁰⁰⁰. Because (1 − 1/n)ⁿ ≈ e⁻¹, that is about 37%. On average there is one error per run.' }
  ]
});

/* ---------------- Lesson 18 · Quantum error correction ---------------- */
const STAB = [
  { t: 'Z', q: [[0, 0], [0, 1], [1, 0], [1, 1]], sh: 'sq', at: [0, 0] }, { t: 'X', q: [[0, 1], [0, 2], [1, 1], [1, 2]], sh: 'sq', at: [0, 1] },
  { t: 'X', q: [[1, 0], [1, 1], [2, 0], [2, 1]], sh: 'sq', at: [1, 0] }, { t: 'Z', q: [[1, 1], [1, 2], [2, 1], [2, 2]], sh: 'sq', at: [1, 1] },
  { t: 'X', q: [[0, 0], [0, 1]], sh: 'top' }, { t: 'X', q: [[2, 1], [2, 2]], sh: 'bottom' },
  { t: 'Z', q: [[1, 0], [2, 0]], sh: 'left' }, { t: 'Z', q: [[0, 2], [1, 2]], sh: 'right' }
];
LESSONS.push({
  id: 'qec', n: 18, stage: 4, minutes: 15, title: 'Quantum error correction',
  lede: 'Error correction protects quantum information by spreading one logical qubit across many physical ones, and checks for errors without ever looking at the data.',
  html: `
<h2>Three obstacles</h2>
<p>Classical error correction copies each bit and takes a majority vote. Quantum information seems to rule that out three times over. You cannot copy an unknown state. Errors are continuous: a qubit can be rotated by a tiny angle, not just flipped. And measuring a qubit to check it destroys its superposition. Each obstacle turns out to have a way around it.</p>
<h2>The three-qubit bit-flip code</h2>
<p>Encode ${m('α|0⟩ + β|1⟩')} as ${m('α|000⟩ + β|111⟩')} with two CNOTs. This is not three copies of the state; it is a single entangled state of three qubits, so no-cloning is respected. If one qubit flips, measure two parities: does qubit 0 agree with qubit 1, and does qubit 1 agree with qubit 2? These checks are written ${m('Z₀Z₁')} and ${m('Z₁Z₂')}, and their results are the <strong>syndrome</strong>. The syndrome says which qubit flipped and nothing at all about ${m('α')} or ${m('β')}, so the superposition survives the check.</p>
<p>The parities are measured with two extra <strong>ancilla</strong> qubits. CNOTs copy each parity onto an ancilla, and only the ancillas are measured:</p>
<div class="wide" data-qec-circuit></div>
${LAB('bitflip')}
<h2>Continuous errors become discrete</h2>
<p>Suppose the error is a small rotation instead of a full flip. The state becomes a superposition of “no error” and “one qubit flipped”. Measuring the syndrome forces it to pick one: either no error at all, or one specific flip that the code then fixes. Here measurement is the hero. It turns an infinite family of small errors into a short list of correctable ones.</p>
<h2>Phase flips and the surface code</h2>
<p>The bit-flip code does nothing against phase flips, the Z errors. Peter Shor’s nine-qubit code of 1995 handles both by nesting a phase-flip code inside a bit-flip code. Most hardware efforts today use the <strong>surface code</strong>: data qubits on a square grid, with X-type and Z-type parity checks on neighbouring groups measured over and over. It needs only nearest-neighbour connections and tolerates physical error rates up to roughly 1%. A distance-${m('d')} surface code uses ${m('d²')} data qubits, and it takes at least ${m('d')} errors lined up across the grid to fool it.</p>
${LAB('surface')}
<h2>The threshold</h2>
<p>If physical errors are rare enough, below the code’s <strong>threshold</strong>, making the code bigger suppresses logical errors exponentially, roughly as ${m('(p/p<sub>th</sub>)<sup>(d+1)/2</sup>')}. Above the threshold, bigger codes make things worse, because there are more places for errors to occur. In 2024 Google reported a surface-code memory running below threshold, with the logical error rate falling by roughly half each time the code distance grew from 3 to 5 to 7.</p>
${LAB('threshold')}
${NOTE('The overhead', `<p>A useful logical qubit may need hundreds to a thousand physical qubits, plus fast classical decoding of the syndromes in real time. Some gates, such as T, cannot be done directly on surface-code qubits and need extra machinery called magic-state distillation. Much current research aims to cut this overhead with better codes and decoders.</p>`)}
${NOTE('Go deeper', `<p>The Error correction and fault tolerance track in Part II ([[TR:5]]) picks up from here: the stabilizer formalism, simulating thousand-qubit codes, real decoders, measuring thresholds yourself, fault-tolerant gadgets, magic states, qLDPC codes and resource estimation.</p>`)}
`,
  mount(root) {
    const el = root.querySelector('[data-qec-circuit]'); if (!el) return;
    const w = h('div', { class: 'circ-wrap', style: 'margin:8px 0 22px' });
    w.append(drawCircuit(5, [[{ g: 'CX', c: 0, t: 1 }], [{ g: 'CX', c: 0, t: 2 }], [{ g: 'E', q: 0 }, { g: 'E', q: 1 }, { g: 'E', q: 2 }], [{ g: 'CX', c: 0, t: 3 }], [{ g: 'CX', c: 1, t: 3 }], [{ g: 'CX', c: 1, t: 4 }], [{ g: 'CX', c: 2, t: 4 }], [{ g: 'M', q: 3 }, { g: 'M', q: 4 }]],
      { cw: 58, rh: 46, labels: ['q0 |ψ⟩', 'q1 |0⟩', 'q2 |0⟩', 'a0 |0⟩', 'a1 |0⟩'], aria: 'Encoding and syndrome measurement circuit for the bit-flip code' }).svg);
    el.append(w, h('p', { class: 'hint', style: 'margin-top:-12px' }, 'E marks where errors may strike. Ancilla a0 ends up holding the parity of q0 and q1, ancilla a1 the parity of q1 and q2.'));
  },
  labs: {
    bitflip: {
      title: 'The bit-flip code',
      cap: 'Flip one qubit, measure the syndrome, and apply the correction it points to. Then try flipping two qubits: the syndrome points to the wrong one, and the “correction” completes a logical error.',
      build(body, id) {
        let th = rad(70), e = 0, stage = 0, syn = null;
        const qs = [0, 1, 2].map(i => h('div', { class: 'qcell' }, h('span', { class: 'qc-l' }, 'qubit ' + i), h('span', { class: 'qc-v' }, '')));
        const lamps = [h('span', { class: 'lamp' }, '?'), h('span', { class: 'lamp' }, '?')];
        const ketEl = h('div', { class: 'ketline' }), stat = h('div', { class: 'status' });
        const al = () => Math.cos(th / 2), be = () => Math.sin(th / 2);
        const corr = s => s[0] && !s[1] ? 1 : s[0] && s[1] ? 2 : !s[0] && s[1] ? 4 : 0;   // masks: bit2 = qubit 0
        const bit = (mask, q) => (mask >> (2 - q)) & 1;
        const flipB = [0, 1, 2].map(q => btn('Flip qubit ' + q, () => { if (stage > 1) return; e ^= 1 << (2 - q); stage = 1; render(); }));
        const synB = btn('Measure syndrome', () => { if (stage !== 1) return; syn = [bit(e, 0) ^ bit(e, 1), bit(e, 1) ^ bit(e, 2)]; stage = 2; render(); }, 'pri');
        const fixB = btn('Apply correction', () => { if (stage !== 2) return; e ^= corr(syn); stage = 3; render(); }, 'pri');
        const render = () => {
          const a = al(), b = be(), k0 = e, k1 = e ^ 7;
          ketEl.textContent = '|ψ⟩ = ' + ketString([...Array(8)].map((_, i) => i === k0 ? a : i === k1 ? b : 0), new Array(8).fill(0), 3);
          qs.forEach((el, q) => { el.dataset.f = bit(e, q); el.querySelector('.qc-v').textContent = bit(e, q) ? 'flipped' : ''; });
          lamps.forEach((l, i) => { if (!syn || stage < 2) { l.textContent = '?'; l.removeAttribute('data-on'); } else { l.textContent = syn[i] ? '−1' : '+1'; l.dataset.on = syn[i] ? 1 : 0; } });
          const msgs = [
            `Encoded: α|000⟩ + β|111⟩ with α = ${num(a, 3)}, β = ${num(b, 3)}. Flip one or more qubits.`,
            `Errors applied. The data is damaged, and we must not measure it directly.`,
            `Syndrome: Z₀Z₁ = ${syn && syn[0] ? '−1' : '+1'}, Z₁Z₂ = ${syn && syn[1] ? '−1' : '+1'}. ` + (corr(syn || [0, 0]) ? `The table says: flip qubit ${[0, 1, 2].find(q => corr(syn) === 1 << (2 - q))} back.` : 'No error detected.'),
            e === 0 ? 'Corrected. The state is α|000⟩ + β|111⟩ again, and α and β were never revealed.' : e === 7 ? `Logical error. The state is now α|111⟩ + β|000⟩. Two flips fooled the majority vote. Overlap with the original: ${pct((2 * a * b) ** 2, 0)}.` : 'Still damaged.'
          ];
          stat.className = 'status' + (stage === 3 ? (e === 0 ? ' good' : ' bad') : '');
          stat.textContent = msgs[stage];
          flipB.forEach(b2 => b2.disabled = stage > 1); synB.disabled = stage !== 1; fixB.disabled = stage !== 2;
        };
        const sl = slider({ id: id('th'), label: 'Encoded state θ (α = cos θ/2, β = sin θ/2)', min: 0, max: 180, step: 1, value: 70, fmt: v => v + '°', on: v => { th = rad(v); render(); } });
        body.append(h('div', { class: 'split' },
          h('div', { class: 'stack' }, h('div', { class: 'qrow' }, qs[0], h('div', { class: 'qcheck' }, lamps[0], h('small', null, 'Z₀Z₁')), qs[1], h('div', { class: 'qcheck' }, lamps[1], h('small', null, 'Z₁Z₂')), qs[2]), ketEl, stat),
          h('div', { class: 'stack' }, sl, h('div', { class: 'btns' }, ...flipB), h('div', { class: 'btns' }, synB, fixB, btn('Start over', () => { e = 0; stage = 0; syn = null; render(); })),
            h('div', { class: 'hint' }, 'Decoding table: (+1, +1) no error · (−1, +1) qubit 0 · (−1, −1) qubit 1 · (+1, −1) qubit 2.'))));
        render();
      }
    },
    surface: {
      title: 'A distance-3 surface code',
      cap: 'Nine data qubits (circles) and eight parity checks: copper shapes check X-type parity and catch Z errors, blue shapes check Z-type parity and catch X errors. Tap a qubit to cycle its error through X, Z, Y and none. A check lights up when an odd number of its qubits carry an error it detects.',
      build(body, id) {
        const s = 74, x0 = 56, y0 = 50, W = x0 * 2 + 2 * s, H = y0 * 2 + 2 * s;
        const PX = [[0, 0], [1, 0], [0, 1], [1, 1]];   // code → [x-part, z-part]
        let vis = [...Array(9)].fill(0), hid = [...Array(9)].fill(0), game = false, reveal = false;
        const idx = (r, cI) => r * 3 + cI, part = (code, k) => PX[code][k];
        const tot = i => [part(vis[i], 0) ^ part(hid[i], 0), part(vis[i], 1) ^ part(hid[i], 1)];
        const box = h('div', { class: 'circ-wrap', style: 'display:grid;place-items:center;padding:8px' }), stat = h('div', { class: 'status' });
        const lit = st => st.q.reduce((acc, [r, cI]) => acc ^ tot(idx(r, cI))[st.t === 'Z' ? 0 : 1], 0);
        const render = () => {
          const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'sc', role: 'img', 'aria-label': 'Surface code lattice' });
          const P = (r, cI) => [x0 + cI * s, y0 + r * s];
          for (const st of STAB) {
            const on = lit(st), cls = 'sc-' + st.t.toLowerCase() + (on ? ' lit' : ''); let el;
            if (st.sh === 'sq') { const [x, y] = P(st.at[0], st.at[1]); el = sv('rect', { x, y, width: s, height: s, class: cls }); }
            else {
              const [a, b] = st.q.map(([r, cI]) => P(r, cI)), R = s / 2;
              const d = st.sh === 'top' ? `M${a[0]} ${a[1]} A${R} ${R} 0 0 1 ${b[0]} ${b[1]} Z` : st.sh === 'bottom' ? `M${b[0]} ${b[1]} A${R} ${R} 0 0 1 ${a[0]} ${a[1]} Z` :
                st.sh === 'left' ? `M${b[0]} ${b[1]} A${R} ${R} 0 0 1 ${a[0]} ${a[1]} Z` : `M${a[0]} ${a[1]} A${R} ${R} 0 0 1 ${b[0]} ${b[1]} Z`;
              el = sv('path', { d, class: cls });
            }
            svg.append(el);
            if (on) { const cx = st.q.reduce((acc, [r, cI]) => acc + P(r, cI)[0], 0) / st.q.length, cy = st.q.reduce((acc, [r, cI]) => acc + P(r, cI)[1], 0) / st.q.length;
              const off = { top: [0, -s / 4], bottom: [0, s / 4], left: [-s / 4, 0], right: [s / 4, 0] }[st.sh] || [0, 0];
              svg.append(sv('text', { x: cx + off[0], y: cy + off[1], class: 'sc-flag' }, '−1')); }
          }
          for (let r = 0; r < 3; r++) for (let cI = 0; cI < 3; cI++) {
            const i = idx(r, cI), [x, y] = P(r, cI), lab = ['', 'X', 'Z', 'Y'][vis[i]], hl = reveal && hid[i] ? ['', 'X', 'Z', 'Y'][hid[i]] : '';
            const g = sv('g', { class: 'sc-q', tabindex: 0, role: 'button', 'aria-label': `Data qubit ${i}${lab ? ', ' + lab + ' applied' : ''}. Tap to change.` });
            g.append(sv('circle', { cx: x, cy: y, r: 16, class: 'sc-dq' + (vis[i] ? ' on' : '') }));
            g.append(sv('text', { x, y, class: 'sc-ql' }, lab));
            if (hl) g.append(sv('text', { x: x + 18, y: y - 16, class: 'sc-hid' }, hl));
            const act = () => { vis[i] = (vis[i] + 1) % 4; render(); };
            g.addEventListener('click', act); g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act(); } });
            svg.append(g);
          }
          box.innerHTML = ''; box.append(svg);
          const n = STAB.filter(lit).length, any = [...Array(9).keys()].some(i => tot(i)[0] || tot(i)[1]);
          const lx = [0, 1, 2].reduce((a, cI) => a ^ tot(idx(0, cI))[0], 0), lz = [0, 1, 2].reduce((a, r) => a ^ tot(idx(r, 0))[1], 0);
          if (game) {
            if (n) { stat.className = 'status'; stat.textContent = `A hidden error lights ${n} check${n > 1 ? 's' : ''}. Tap qubits to apply corrections until every check reads +1.`; }
            else if (lx || lz) { stat.className = 'status bad'; stat.textContent = 'Every check reads +1, but the hidden error plus your correction form a logical operator. The encoded qubit has been flipped.'; }
            else { stat.className = 'status good'; stat.textContent = 'Fixed. Every check reads +1 and the encoded qubit is intact.'; }
          } else {
            if (!any) { stat.className = 'status'; stat.textContent = 'No errors. All eight checks read +1.'; }
            else if (n) { stat.className = 'status'; stat.textContent = `${n} check${n > 1 ? 's' : ''} light up. A decoder would use this pattern to guess where the errors are.`; }
            else if (lx || lz) { stat.className = 'status bad'; stat.textContent = 'Undetectable logical error: every check passes, yet the encoded qubit has flipped. It takes at least three errors in a line to do this, which is what distance 3 means.'; }
            else { stat.className = 'status good'; stat.textContent = 'These errors multiply to a stabilizer. Every check passes and the encoded qubit is untouched.'; }
          }
        };
        const newGame = () => { game = true; reveal = false; vis.fill(0); hid.fill(0); hid[Math.floor(Math.random() * 9)] = 1 + Math.floor(Math.random() * 3); render(); };
        body.append(h('div', { class: 'split' }, box, h('div', { class: 'stack' },
          h('div', { class: 'btns' }, btn('Find a hidden error', newGame, 'pri'), btn('Reveal it', () => { reveal = true; render(); }), btn('Free play', () => { game = false; reveal = false; vis.fill(0); hid.fill(0); render(); })),
          stat, h('p', { class: 'hint' }, 'Try X errors on the whole left column, or Z errors along the whole top row: both pass every check. Those are the logical operators of this code.'))));
        render();
      }
    },
    threshold: {
      title: 'Below and above threshold',
      cap: 'Repetition code: exact probability that a majority vote over d copies fails, with independent bit flips of probability p. Surface code: the common rule of thumb P_L ≈ 0.1·(p/1%)^((d+1)/2), meant only to show the shape.',
      build(body, id) {
        let mode = 'rep', lp = -1.3;
        const cv = canvas('', 'height:250px'), tbl = h('div', { class: 'chipline' });
        const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
        const PL = (d, p) => { if (mode === 'surf') return Math.min(.5, .1 * Math.pow(p / .01, (d + 1) / 2)); let s2 = 0; for (let k = (d + 1) / 2; k <= d; k++) s2 += C(d, k) * Math.pow(p, k) * Math.pow(1 - p, d - k); return s2; };
        const range = () => mode === 'rep' ? [-3, Math.log10(.5)] : [-4, Math.log10(.03)];
        const DS = [1, 3, 5, 7, 9];
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), [a, b] = range(), A = axes(ctx, w, H, { x: [Math.pow(10, a), Math.pow(10, b)], xlog: true, y: [1e-12, 1], ylog: true,
            xt: mode === 'rep' ? [1e-3, 1e-2, 1e-1, .5] : [1e-4, 1e-3, 1e-2, .03], xf: v => pct(v, v < .01 ? 2 : 0), yt: [1e-12, 1e-9, 1e-6, 1e-3, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'physical error rate p', yl: 'logical error rate', pad: { l: 52 } });
          if (mode === 'surf') { const x = A.X(.01); polyline(ctx, [[x, A.T], [x, A.B]], T.muted, 1, [4, 4]); txt(ctx, 'threshold ≈ 1%', x - 4, A.B - 10, { align: 'right' }); }
          DS.forEach((d, i) => { const pts = []; for (let k = 0; k <= 160; k++) { const p = Math.pow(10, a + (b - a) * k / 160); pts.push([A.X(p), A.Y(clamp(PL(d, p), 1e-12, 1))]); } polyline(ctx, pts, d === 1 ? T.muted : mixRGB(T.cyan, T.copper, i / 4).join ? `rgb(${mixRGB(T.cyan, T.copper, i / 4).join(',')})` : T.copper, d === 1 ? 1.5 : 2.2, d === 1 ? [4, 3] : null);
            const pEnd = Math.pow(10, a + (b - a) * .04); txt(ctx, 'd=' + d, A.X(pEnd), A.Y(clamp(PL(d, pEnd), 1e-12, 1)) - 8, { align: 'left', color: T.ink, font: '600 10.5px "JetBrains Mono",monospace' }); });
          const p = Math.pow(10, lp), x = A.X(p); polyline(ctx, [[x, A.T], [x, A.B]], T.copper, 1.5);
        });
        const sl = slider({ id: id('p'), label: 'Physical error rate p', min: range()[0], max: range()[1], step: .02, value: lp, fmt: v => pct(Math.pow(10, v), Math.pow(10, v) < .01 ? 3 : 1), on: v => { lp = v; upd(); } });
        const upd = () => { const p = Math.pow(10, lp); tbl.innerHTML = DS.map(d => `<span>d = ${d} <b>${sci(PL(d, p), 1)}</b></span>`).join(''); pc.inv(); };
        const ms = seg([{ v: 'rep', label: 'Repetition code' }, { v: 'surf', label: 'Surface code (rule of thumb)' }], 'rep', v => { mode = v; const [a, b] = range(); sl.input.min = a; sl.input.max = b; lp = mode === 'rep' ? -1.3 : -2.5; sl.set(lp); upd(); }, 'Code');
        body.append(h('div', { class: 'btns' }, ms), cv, h('div', { class: 'split' }, sl, tbl));
        upd();
      }
    }
  },
  take: ['A logical qubit is an entangled state of many physical qubits; nothing is copied.',
    'Parity checks (the syndrome) reveal which error happened without revealing the encoded data.',
    'Measuring the syndrome turns continuous errors into a discrete set that can be corrected.',
    'Below threshold, larger codes suppress logical errors exponentially.'],
  quiz: [
    { q: 'Bit-flip code syndrome: Z₀Z₁ = −1, Z₁Z₂ = +1. Which qubit flipped?', o: ['Qubit 0', 'Qubit 1', 'Qubit 2', 'None'], a: 0, why: 'Qubit 0 disagrees with qubit 1, while qubits 1 and 2 agree.' },
    { q: 'Below threshold, what happens to the logical error rate as the code distance grows?', o: ['It grows', 'It stays the same', 'It falls exponentially', 'It falls to exactly zero'], a: 2, why: 'Each step up in distance multiplies the logical error rate by a factor below one.' }
  ]
});

/* ---------------- Lesson 19 · Building a qubit ---------------- */
const FRIDGE = [
  { t: '300 K', n: 'Top plate', w: 240, d: 'Room temperature. Control electronics outside the fridge generate shaped microwave pulses and digitize the returning readout signals. The outer vacuum can seals against this flange.' },
  { t: '50 K', n: 'First pulse-tube stage', w: 222, d: 'The first stage of the pulse-tube cooler. A radiation shield held at this temperature blocks most of the heat radiated by the room-temperature can.' },
  { t: '4 K', n: 'Second pulse-tube stage', w: 204, d: 'The second pulse-tube stage. Low-noise HEMT amplifiers here boost the faint readout signals on their way out. Attenuators on the input lines start absorbing thermal noise that would otherwise flow down from warmer stages.' },
  { t: '≈ 800 mK', n: 'Still', w: 182, d: 'Helium-3 evaporates out of the helium mixture here and is pumped away to be recirculated. The evaporation cools the still plate.' },
  { t: '≈ 100 mK', n: 'Cold plate', w: 166, d: 'An intermediate stage that thermalizes the wiring and adds more attenuation before the coldest stage.' },
  { t: '≈ 10 mK', n: 'Mixing chamber', w: 150, d: 'Helium-3 crosses from a concentrated phase into a dilute phase rich in helium-4, and that crossing absorbs heat. This sets the base temperature. The quantum chip is mounted below this plate, usually inside magnetic shielding, often with near-quantum-limited parametric amplifiers close by.' }
];
LESSONS.push({
  id: 'hardware', n: 19, stage: 4, minutes: 13, title: 'Building a qubit',
  lede: 'A qubit can be made from almost any quantum two-level system. The hard part is making thousands of them that are controllable, connected and quiet.',
  html: `
<h2>What a good qubit needs</h2>
<p>In 2000 David DiVincenzo listed what any quantum computer needs, and the list still frames the field: a scalable system of well-defined qubits; a way to initialize them; coherence times much longer than gate times; a universal set of gates; and the ability to measure individual qubits. Quantum networks add two more: converting stationary qubits into flying ones, usually photons, and sending those faithfully.</p>
<h2>The dilution refrigerator</h2>
<p>Superconducting qubits, and many spin qubits, operate inside a dilution refrigerator that reaches about 10 mK, a hundredth of a degree above absolute zero. It cools in stages. A pulse-tube cooler takes the upper plates to about 50 K and 4 K, then a circulating mixture of helium-3 and helium-4 takes the bottom plate the rest of the way. The gold-plated copper plates hang one below the other, which is why these fridges are nicknamed chandeliers. This guide is organized around the same stages. [[L:cryostat]] looks inside in detail: how helium dilution cooling works and how the wiring is designed.</p>
${LAB('fridge')}
<h2>Why so cold?</h2>
<p>A superconducting qubit’s two levels are separated by the energy of one microwave photon, around 5 GHz. That energy, ${m('hf')}, corresponds to a temperature ${m('hf/k<sub>B</sub>')} of about 0.24 K. Unless the qubit is much colder than that, heat randomly kicks it into ${m('|1⟩')}. The thermal population of the excited state is</p>
${EQ('P(1) = 1 / (1 + e<sup>hf/k<sub>B</sub>T</sup>)')}
${LAB('thermal')}
<p>Superconductivity is the other reason: the aluminium circuits only superconduct below about 1 K, and losses fall further as the temperature drops.</p>
<h2>The main platforms</h2>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Platform</th><th>The qubit</th><th>How gates work</th><th>Strengths</th><th>Challenges</th></tr></thead><tbody>
<tr><td>Superconducting circuits</td><td>Two energy levels of a circuit built around Josephson junctions (the transmon is the most common)</td><td>Microwave pulses; gates take tens of nanoseconds</td><td>Fast gates; made with chip fabrication</td><td>Millikelvin cooling, dense wiring, mostly nearest-neighbour connections, device-to-device variation</td></tr>
<tr><td>Trapped ions</td><td>Two internal levels of single ions such as ytterbium, calcium or barium, held by electric fields in vacuum</td><td>Lasers or microwaves; shared motion of the ions couples them; gates take microseconds or longer</td><td>Very high fidelities, long coherence, any ion can talk to any other in a chain</td><td>Slower gates; scaling past one trap means shuttling ions or linking traps with photons</td></tr>
<tr><td>Neutral atoms</td><td>Atoms such as rubidium, cesium or strontium held in optical tweezers</td><td>Excitation to high-energy Rydberg states makes neighbouring atoms interact</td><td>Large, reconfigurable arrays of hundreds to thousands of atoms</td><td>Atom loss, slower cycles, demanding laser control</td></tr>
<tr><td>Photonic</td><td>Properties of single photons: path, polarization or arrival time</td><td>Linear optics plus measurement; often measurement-based computing</td><td>Photons barely decohere; natural fit for networking</td><td>Photon loss; photons do not interact easily; single-photon detectors are often cryogenic</td></tr>
<tr><td>Spin qubits</td><td>Spin of an electron or nucleus in a silicon quantum dot or donor atom</td><td>Microwave or electrical pulses; exchange interaction between neighbours</td><td>Tiny; compatible with semiconductor manufacturing; some run near 1 K</td><td>Device variability, wiring density</td></tr>
<tr><td>Topological</td><td>Non-local states of exotic quasiparticles such as Majorana zero modes</td><td>Measurements and braiding of quasiparticles</td><td>Built-in protection from local noise, in principle</td><td>Still experimental; the basic qubit is not yet established</td></tr>
</tbody></table></div>
<h2>Comparing machines</h2>
<p>Qubit count alone says little. What matters is two-qubit gate fidelity, measurement fidelity, connectivity, speed and crosstalk, and how these hold up as the system grows. Composite benchmarks such as quantum volume try to fold several of these into one number. For fault-tolerant computing the question that counts is how many good logical qubits a machine can run, and at what logical error rate.</p>
${NOTE('Each platform in depth', `<p>The next lessons look at the leading platforms one by one, each with a lab: trapped ions and their shared vibrations ([[L:ions]]), neutral-atom arrays and Rydberg gates ([[L:atoms]]), photonic quantum computing ([[L:photonic]]) and silicon spin qubits ([[L:spins]]). Superconducting control and readout are covered in [[L:pulses]] and [[L:readout]].</p>`)}
`,
  labs: {
    fridge: {
      title: 'Inside the chandelier',
      cap: 'Tap a plate to read about that stage. Copper pulses travel down the attenuated input line to the chip; the readout signal returns up the output line through the amplifier at 4 K.',
      build(body, id) {
        let sel = 5; const W = 380, Hh = 470, cx = 236, ys = [36, 104, 172, 248, 318, 388];
        const svg = sv('svg', { viewBox: `0 0 ${W} ${Hh}`, width: '100%', style: `max-width:${W}px;display:block;margin:0 auto`, class: 'fr', role: 'img', 'aria-label': 'Dilution refrigerator stages' });
        const info = h('div', { class: 'stack', style: 'gap:6px' });
        const build = () => {
          svg.innerHTML = '';
          for (const dx of [-58, 58]) svg.append(sv('line', { x1: cx + dx, y1: ys[0], x2: cx + dx, y2: ys[5], class: 'fr-rod' }));
          svg.append(sv('line', { x1: cx - 18, y1: 14, x2: cx - 18, y2: 420, class: 'fr-coax' }), sv('line', { x1: cx + 18, y1: 14, x2: cx + 18, y2: 420, class: 'fr-coax' }));
          [2, 3, 4, 5].forEach(i => svg.append(sv('rect', { x: cx - 25, y: ys[i] + 16, width: 14, height: 20, rx: 2, class: 'fr-att' })));
          svg.append(sv('path', { d: `M${cx + 9} ${ys[2] + 38} L${cx + 27} ${ys[2] + 38} L${cx + 18} ${ys[2] + 18} Z`, class: 'fr-amp' }));
          svg.append(sv('text', { x: cx - 32, y: ys[3] + 30, class: 'fr-note', 'text-anchor': 'end' }, 'attenuators'), sv('text', { x: cx + 34, y: ys[2] + 32, class: 'fr-note' }, 'HEMT amplifier'));
          svg.append(sv('text', { x: cx - 18, y: 10, class: 'fr-note', 'text-anchor': 'middle' }, 'in'), sv('text', { x: cx + 18, y: 10, class: 'fr-note', 'text-anchor': 'middle' }, 'out'));
          FRIDGE.forEach((f, i) => {
            const g = sv('g', { class: 'fr-st' + (i === sel ? ' on' : ''), tabindex: 0, role: 'button', 'aria-label': `${f.n}, ${f.t}` });
            g.append(sv('rect', { x: cx - f.w / 2, y: ys[i] - 7, width: f.w, height: 14, rx: 2, class: 'fr-plate' }));
            g.append(sv('text', { x: 6, y: ys[i] + 1, class: 'fr-t' }, f.t));
            g.append(sv('rect', { x: 0, y: ys[i] - 26, width: W, height: 50, class: 'fr-hit' }));
            const act = () => { sel = i; build(); show(); };
            g.addEventListener('click', act); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
            svg.append(g);
          });
          svg.append(sv('rect', { x: cx - 30, y: 410, width: 60, height: 30, rx: 3, class: 'fr-chip' }), sv('text', { x: cx, y: 455, class: 'fr-note', 'text-anchor': 'middle' }, 'qubit chip'));
          pulses = [0, 1, 2].map(() => sv('circle', { r: 4, class: 'fr-pulse' })); pulses.forEach(p => svg.append(p));
        };
        let pulses = [];
        const show = () => { const f = FRIDGE[sel]; info.innerHTML = ''; info.append(h('div', { class: 'eyebrow' }, f.t), h('div', { class: 'lab-title', style: 'font-size:22px' }, f.n), h('p', { style: 'margin:0' }, f.d)); };
        Scope.tick(now => {
          if (reduced() || !pulses.length) return;
          pulses.forEach((p, k) => {
            const ph = ((now / 2600) + k / 3) % 1;
            if (k < 2) { p.setAttribute('cx', cx - 18); p.setAttribute('cy', 14 + ph * 396); }
            else { p.setAttribute('cx', cx + 18); p.setAttribute('cy', 410 - ph * 396); }
          });
        });
        build(); show();
        body.append(h('div', { class: 'split' }, svg, info));
      }
    },
    thermal: {
      title: 'Thermal excitation',
      cap: 'Fraction of time a qubit at frequency f sits in |1⟩ just from heat, at temperature T. Markers show the mixing chamber, the 4 K plate and room temperature.',
      build(body, id) {
        let lgT = -2, f = 5;
        const h_ = 6.62607015e-34, kB = 1.380649e-23;
        const P1 = (T, fg) => 1 / (1 + Math.exp(h_ * fg * 1e9 / (kB * T)));
        const cv = canvas('', 'height:220px'), out = h('div', { class: 'status' });
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1e-3, 300], xlog: true, y: [0, .5], xt: [1e-3, 1e-2, .1, 1, 10, 100], xf: v => v < 1 ? (v * 1000) + ' mK' : v + ' K', yt: [0, .25, .5], yf: v => pct(v, 0), xl: 'temperature', yl: 'P(1) from heat' });
          const pts = []; for (let i = 0; i <= 240; i++) { const t = Math.pow(10, -3 + 5.477 * i / 240); pts.push([A.X(t), A.Y(P1(t, f))]); } polyline(ctx, pts, T.cyan, 2.2);
          [[.01, '10 mK'], [4, '4 K'], [300, '300 K']].forEach(([t, l]) => { const x = A.X(t); polyline(ctx, [[x, A.T + 14], [x, A.B]], T.muted, 1, [2, 3]); txt(ctx, l, x, A.T + 6, { color: T.ink }); });
          const t = Math.pow(10, lgT); dot(ctx, A.X(t), A.Y(P1(t, f)), 6, T.copper, T.surface);
        });
        const upd = () => {
          const t = Math.pow(10, lgT), p = P1(t, f), th = h_ * f * 1e9 / kB;
          out.innerHTML = `At ${t < 1 ? num(t * 1000, t < .01 ? 1 : 0) + ' mK' : num(t, t < 10 ? 2 : 0) + ' K'}, a ${num(f, 1)} GHz qubit (hf/k<sub>B</sub> = ${num(th * 1000, 0)} mK) is thermally excited <b>${p < 1e-4 ? sci(p, 1) : pct(p, 2)}</b> of the time` + (p < 1e-3 && p > 0 ? ` (about 1 run in ${sci(1 / p, 1)}).` : '.');
          pc.inv();
        };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('T'), label: 'Temperature T', min: -3, max: 2.477, step: .01, value: lgT, fmt: v => { const t = Math.pow(10, v); return t < 1 ? num(t * 1000, t < .01 ? 1 : 0) + ' mK' : num(t, t < 10 ? 2 : 0) + ' K'; }, on: v => { lgT = v; upd(); } }),
          slider({ id: id('f'), label: 'Qubit frequency f', min: 1, max: 10, step: .1, value: f, fmt: v => num(v, 1) + ' GHz', on: v => { f = v; upd(); } }), out)));
        upd();
      }
    }
  },
  take: ['DiVincenzo’s criteria: scalable qubits, initialization, long coherence, universal gates, measurement.',
    'Superconducting qubits sit at about 10 mK in a dilution refrigerator because a 5 GHz qubit corresponds to about 0.24 K.',
    'Platforms trade gate speed, fidelity, coherence, connectivity and manufacturability.',
    'The useful metric for the future is good logical qubits, not raw qubit count.'],
  quiz: [
    { q: 'Which platform holds atoms in optical tweezers?', o: ['Trapped ions', 'Neutral atoms', 'Superconducting circuits', 'Spin qubits'], a: 1, why: 'Neutral-atom machines trap individual atoms in focused laser beams and use Rydberg states for two-qubit gates.' },
    { q: 'At room temperature, roughly how often is a 5 GHz qubit thermally excited?', o: ['Almost never', 'About 1%', 'Nearly 50% of the time', 'Always'], a: 2, why: 'At 300 K, hf ≪ k_BT, so the two levels are almost equally populated.' }
  ]
});

/* ---------------- Lesson 20 · What quantum computers can and can't do ---------------- */
const PROBS = [
  { k: 'sort', n: 'Sorting', x: 262, y: 194, d: 'In P. Sorting n items takes about n log n comparisons classically, and quantum computers offer no meaningful speedup.' },
  { k: 'prime', n: 'Primality testing', x: 250, y: 160, d: 'In P since the AKS algorithm of 2002. Deciding whether a number is prime is easy; finding its factors is the hard part.' },
  { k: 'fact', n: 'Factoring', x: 306, y: 118, d: 'In NP and in BQP. Shor’s algorithm factors in polynomial time; no polynomial-time classical algorithm is known.' },
  { k: 'dlog', n: 'Discrete logarithm', x: 300, y: 232, d: 'Same status as factoring. A variant of Shor’s algorithm breaks it, which is why elliptic-curve cryptography is also vulnerable.' },
  { k: 'sim', n: 'Simulating quantum systems', x: 424, y: 165, d: 'Simulating the time evolution of a quantum system is BQP-complete: as hard as anything a quantum computer can do efficiently. There is evidence it lies outside NP. It was Feynman’s original motivation for quantum computers.' },
  { k: 'sat', n: 'Boolean satisfiability (SAT)', x: 104, y: 165, d: 'NP-complete. Not believed to be in BQP. Grover’s algorithm gives at most a quadratic speedup over brute-force search.' }
];
LESSONS.push({
  id: 'complexity', n: 20, stage: 4, minutes: 11, title: 'What quantum computers can and can’t do',
  lede: 'Quantum computers are not faster at everything. They change the cost of specific problems, sometimes dramatically, sometimes not at all.',
  html: `
<h2>The class BQP</h2>
<p>Problems a quantum computer can solve efficiently, meaning in polynomial time with a small chance of error, form the complexity class <strong>BQP</strong>. It contains everything a classical computer can do efficiently (the classes P and BPP), and it fits inside PSPACE, the problems solvable with a polynomial amount of memory. Whether BQP is strictly larger than what classical computers can do is unproven. Factoring is the strongest evidence that it is: Shor’s algorithm runs in polynomial time, and decades of work have produced no classical algorithm that does.</p>
${LAB('map')}
<h2>Speedups come in sizes</h2>
<p>An exponential speedup, like Shor’s, turns a problem that would take longer than the age of the universe into one that takes hours. A quadratic speedup, like Grover’s, turns ${m('N')} steps into ${m('√N')}. That is valuable at huge scales, but quantum operations are much slower than classical ones and error correction multiplies the cost, so quadratic speedups pay off only for very large problems.</p>
${LAB('race')}
<h2>What is unlikely</h2>
<ul>
<li><strong>NP-complete problems</strong> such as SAT or the decision version of the travelling salesman problem are not believed to be in BQP. Expect at most Grover-style quadratic gains.</li>
<li><strong>Big data.</strong> Loading a large classical data set into quantum amplitudes is expensive, and that cost erases many claimed speedups for data-heavy machine learning.</li>
<li><strong>Big outputs.</strong> Each run returns only ${m('n')} bits, so the answer has to be compact, such as a factor, an energy or a yes/no.</li>
</ul>
<h2>Where the evidence points</h2>
<p>The strongest candidates for useful quantum advantage are simulating molecules and materials, which was Richard Feynman’s motivation in 1982; cryptanalysis with Shor’s algorithm; and some structured problems in algebra and optimization. Several groups have run sampling experiments designed to be hard for classical computers. Some of those claims have since been challenged as classical simulation methods improved. That back and forth is part of how the field locates the real boundary between classical and quantum computing.</p>
${NOTE('A closing thought', `<p>A quantum computer is not a faster classical computer. It is a different kind of machine that manipulates amplitudes with interference. The lessons in this guide, from a single qubit to the surface code, are the pieces you need to judge any new claim about it for yourself.</p>`)}
`,
  labs: {
    map: {
      title: 'A map of complexity classes',
      cap: 'Believed relationships. Only some are proven: P is inside NP and BQP, and NP and BQP are inside PSPACE. Whether P equals NP, or whether BQP is larger than P, is unknown.',
      build(body, id) {
        let sel = 'fact'; const W = 520, Hh = 330;
        const svg = sv('svg', { viewBox: `0 0 ${W} ${Hh}`, width: '100%', style: `max-width:${W}px;display:block`, class: 'cx', role: 'img', 'aria-label': 'Complexity class diagram' });
        const desc = h('div', { class: 'status' }), chips = h('div', { class: 'btns' });
        const draw = () => {
          svg.innerHTML = '';
          svg.append(sv('rect', { x: 8, y: 8, width: W - 16, height: Hh - 16, rx: 18, class: 'cx-ps' }), sv('text', { x: 26, y: 34, class: 'cx-l' }, 'PSPACE'));
          svg.append(sv('ellipse', { cx: 200, cy: 168, rx: 152, ry: 124, class: 'cx-np' }), sv('ellipse', { cx: 322, cy: 168, rx: 152, ry: 112, class: 'cx-bqp' }));
          svg.append(sv('ellipse', { cx: 106, cy: 168, rx: 52, ry: 74, class: 'cx-npc' }), sv('text', { x: 106, y: 108, class: 'cx-s', 'text-anchor': 'middle' }, 'NP-complete'));
          svg.append(sv('ellipse', { cx: 258, cy: 178, rx: 46, ry: 40, class: 'cx-p' }), sv('text', { x: 258, y: 214, class: 'cx-s', 'text-anchor': 'middle' }, 'P'));
          svg.append(sv('text', { x: 92, y: 66, class: 'cx-l' }, 'NP'), sv('text', { x: 404, y: 76, class: 'cx-l' }, 'BQP'));
          for (const p of PROBS) {
            const on = p.k === sel;
            svg.append(sv('circle', { cx: p.x, cy: p.y, r: on ? 8 : 5, class: on ? 'cx-dot on' : 'cx-dot' }));
            if (on) svg.append(sv('text', { x: p.x, y: p.y - 14, class: 'cx-lab', 'text-anchor': 'middle' }, p.n));
          }
          const p = PROBS.find(q => q.k === sel); desc.innerHTML = `<b>${p.n}.</b> ${p.d}`;
          chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === sel)));
        };
        PROBS.forEach(p => chips.append(h('button', { type: 'button', class: 'btn sm', 'data-k': p.k, onclick: () => { sel = p.k; draw(); } }, p.n)));
        body.append(h('div', { class: 'scroll-x' }, svg), chips, desc);
        draw();
      }
    },
    race: {
      title: 'The scaling race',
      cap: 'Rough operation counts on a log scale, ignoring constant factors, clock speeds and error-correction overhead. For factoring, the classical curve is the general number field sieve and the quantum curve is about n³ logical operations for Shor’s algorithm.',
      build(body, id) {
        let mode = 'search', lgN = 9, bits = 2048;
        const cv = canvas('', 'height:240px'), out = h('div', { class: 'status' });
        const gnfs = n => { const L = n * Math.LN2; return (1.923 * Math.cbrt(L) * Math.pow(Math.log(L), 2 / 3)) / Math.LN10; };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get();
          if (mode === 'search') {
            const A = axes(ctx, w, H, { x: [2, 15], y: [0, 15], xt: [3, 6, 9, 12, 15], xf: v => '10' + sup(v), yt: [0, 5, 10, 15], yf: v => '10' + sup(v), xl: 'number of items N', yl: 'oracle calls' });
            const c1 = [], c2 = []; for (let x = 2; x <= 15.01; x += .1) { c1.push([A.X(x), A.Y(x - Math.log10(2))]); c2.push([A.X(x), A.Y(x / 2 + Math.log10(PI / 4))]); }
            polyline(ctx, c1, T.copper, 2.2); polyline(ctx, c2, T.cyan, 2.2);
            txt(ctx, 'classical N/2', A.X(13), A.Y(13.2), { align: 'right', color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
            txt(ctx, 'Grover (π/4)√N', A.X(14.6), A.Y(7.2) - 12, { align: 'right', color: T.cyan, font: '600 11px "JetBrains Mono",monospace' });
            polyline(ctx, [[A.X(lgN), A.T], [A.X(lgN), A.B]], T.muted, 1, [3, 3]);
          } else {
            const A = axes(ctx, w, H, { x: [64, 4096], y: [0, 50], xt: [512, 1024, 2048, 3072, 4096], yt: [0, 10, 20, 30, 40, 50], yf: v => '10' + sup(v), xl: 'key length in bits', yl: 'operations' });
            const c1 = [], c2 = []; for (let n = 64; n <= 4096; n += 16) { c1.push([A.X(n), A.Y(gnfs(n))]); c2.push([A.X(n), A.Y(3 * Math.log10(n))]); }
            polyline(ctx, c1, T.copper, 2.2); polyline(ctx, c2, T.cyan, 2.2);
            txt(ctx, 'best classical (number field sieve)', A.X(3000), A.Y(gnfs(3000)) - 12, { align: 'right', color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
            txt(ctx, 'Shor ≈ n³', A.X(4000), A.Y(3 * Math.log10(4000)) - 12, { align: 'right', color: T.cyan, font: '600 11px "JetBrains Mono",monospace' });
            polyline(ctx, [[A.X(bits), A.T], [A.X(bits), A.B]], T.muted, 1, [3, 3]);
          }
        });
        const box = h('div', { class: 'stack' });
        const upd = () => {
          box.innerHTML = '';
          if (mode === 'search') {
            box.append(slider({ id: id('n'), label: 'Items N', min: 2, max: 15, step: .1, value: lgN, fmt: v => '10' + sup(Math.round(v * 10) / 10), on: v => { lgN = v; say(); pc.inv(); } }));
          } else box.append(slider({ id: id('bits'), label: 'Key length', min: 64, max: 4096, step: 64, value: bits, fmt: v => v + ' bits', on: v => { bits = v; say(); pc.inv(); } }));
          box.append(out); say(); pc.inv();
        };
        const say = () => {
          if (mode === 'search') { const N = Math.pow(10, lgN); out.innerHTML = `Classical: about <b>${sci(N / 2, 1)}</b> checks. Grover: about <b>${sci(PI / 4 * Math.sqrt(N), 1)}</b> oracle calls. A quadratic gap.`; }
          else out.innerHTML = `For a ${bits}-bit key: number field sieve ≈ <b>10${sup(Math.round(gnfs(bits)))}</b> operations, Shor ≈ <b>10${sup(Math.round(3 * Math.log10(bits)))}</b>. An exponential gap.`;
        };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'search', label: 'Unstructured search' }, { v: 'fact', label: 'Factoring' }], 'search', v => { mode = v; upd(); }, 'Problem')),
          h('div', { class: 'split wide-l' }, cv, box));
        upd();
      }
    }
  },
  take: ['BQP is the class of problems quantum computers solve efficiently; it contains P and sits inside PSPACE.',
    'Factoring and discrete logarithms have exponential quantum speedups; unstructured search only quadratic.',
    'NP-complete problems are not believed to be efficiently solvable by quantum computers.',
    'Data loading and the n-bit output limit erase many claimed speedups.'],
  quiz: [
    { q: 'Which of these is NOT known to have an exponential quantum speedup?', o: ['Factoring', 'Discrete logarithm', 'Unstructured search', 'Simulating quantum dynamics'], a: 2, why: 'Grover’s algorithm gives a quadratic speedup, and that is provably the best possible for unstructured search.' },
    { q: 'Which class is believed to contain factoring but not the NP-complete problems?', o: ['P', 'BQP', 'NP-complete', 'None of these'], a: 1, why: 'Shor puts factoring in BQP, while NP-complete problems are believed to lie outside it.' }
  ]
});

/* ---------------- Glossary ---------------- */
window.GLOSSARY = [
  ['Amplitude', 'A complex number attached to each basis state. Its squared magnitude is the probability of that outcome.', 'superposition'],
  ['Ancilla', 'A helper qubit used during a computation, for example to measure a parity without disturbing data qubits.', 'qec'],
  ['Basis', 'A set of states that any state can be written in terms of. The computational basis is |0⟩, |1⟩ (and their strings for many qubits).', 'measurement'],
  ['Bell state', 'One of four maximally entangled two-qubit states, such as (|00⟩ + |11⟩)/√2.', 'entanglement'],
  ['Bloch sphere', 'A sphere whose surface represents every pure state of one qubit; points inside represent mixed states.', 'bloch'],
  ['Born rule', 'The probability of a measurement outcome equals the squared magnitude of its amplitude.', 'qubits'],
  ['BQP', 'Bounded-error quantum polynomial time: problems a quantum computer solves efficiently.', 'complexity'],
  ['CHSH inequality', 'A Bell inequality: |S| ≤ 2 for any local hidden-variable model, while entangled qubits reach 2√2.', 'entanglement'],
  ['CNOT', 'Controlled-NOT. Flips the target qubit when the control qubit is 1. Can create entanglement.', 'multiqubit'],
  ['Coherence time', 'How long a qubit keeps its quantum information; usually described by T₁ and T₂.', 'decoherence'],
  ['Concurrence', 'A measure of two-qubit entanglement, from 0 (product state) to 1 (maximally entangled).', 'measures'],
  ['Continued fractions', 'A way to find the best small-denominator fraction near a number; used in Shor’s algorithm to recover the period.', 'shor'],
  ['Decoherence', 'Loss of quantum information to the environment, which turns superpositions into random mixtures.', 'decoherence'],
  ['Dilution refrigerator', 'A cryostat that reaches about 10 mK using a mixture of helium-3 and helium-4.', 'cryostat'],
  ['Entanglement', 'Correlation between qubits whose joint state cannot be written as a product of individual states.', 'entanglement'],
  ['Fidelity', 'How close two quantum states or operations are, from 0 (completely different) to 1 (identical).', 'decoherence'],
  ['Gate', 'A unitary operation on one or more qubits; the quantum counterpart of a logic gate.', 'gates'],
  ['GHZ state', 'The three-or-more-qubit state (|00…0⟩ + |11…1⟩)/√2.', 'ghz'],
  ['Global phase', 'An overall factor e^{iγ} on a state. It has no observable effect.', 'bloch'],
  ['Grover’s algorithm', 'Finds a marked item among N in about (π/4)√N oracle calls.', 'grover'],
  ['Hadamard gate (H)', 'Maps |0⟩ to |+⟩ and |1⟩ to |−⟩. The most common way to create superposition.', 'gates'],
  ['Interference', 'Amplitudes for the same outcome adding (constructive) or cancelling (destructive).', 'interference'],
  ['Ket', 'Dirac’s notation |ψ⟩ for a quantum state.', 'qubits'],
  ['Logical qubit', 'A qubit encoded across many physical qubits by an error-correcting code.', 'qec'],
  ['Measurement', 'Reading out a qubit. It returns a classical result and leaves the qubit in the matching state.', 'measurement'],
  ['Mixed state', 'A statistical mixture of pure states; shown inside the Bloch ball rather than on its surface.', 'densitymatrix'],
  ['NISQ', 'Noisy intermediate-scale quantum: today’s devices with tens to thousands of qubits and no full error correction.', 'variational'],
  ['No-cloning theorem', 'No process can copy an unknown quantum state; approximate copies are limited to fidelity 5/6 for one qubit.', 'cloning'],
  ['Oracle', 'A black-box subroutine that computes a function, used to state query-complexity problems.', 'deutsch'],
  ['Parameter-shift rule', 'Exact gradients of circuit outputs from two runs with parameters shifted by ±π/2.', 'qnn'],
  ['Pauli gates', 'X, Y and Z: 180° rotations of the Bloch sphere about the x, y and z axes.', 'gates'],
  ['Phase', 'The angle of a complex amplitude. Relative phase between basis states is physical; global phase is not.', 'superposition'],
  ['Phase kickback', 'Using a target qubit in an eigenstate (such as |−⟩) so that a controlled operation writes a phase onto the control.', 'deutsch'],
  ['Product state', 'A multi-qubit state that can be written as a tensor product of single-qubit states.', 'multiqubit'],
  ['QKD', 'Quantum key distribution, such as BB84: growing a shared secret key whose security rests on measurement disturbance.', 'bb84'],
  ['Quantum Fourier transform', 'The discrete Fourier transform applied to quantum amplitudes; uses O(n²) gates.', 'qft'],
  ['Qubit', 'A two-level quantum system, the basic unit of quantum information.', 'qubits'],
  ['Shor’s algorithm', 'Factors integers in polynomial time by finding the period of aˣ mod N.', 'shor'],
  ['Shot', 'One run of a circuit ending in measurement. Probabilities are estimated from many shots.', 'measurement'],
  ['Superposition', 'A state that is a weighted sum of basis states, with complex amplitudes as weights.', 'superposition'],
  ['Surface code', 'An error-correcting code on a 2D grid with local parity checks and a threshold near 1%.', 'qec'],
  ['Syndrome', 'The results of parity-check measurements, which locate errors without revealing the encoded data.', 'qec'],
  ['T gate', 'A 45° phase rotation. Together with H and CNOT it forms a universal gate set.', 'gates'],
  ['T₁', 'Energy relaxation time: how long an excited qubit takes to decay to |0⟩.', 'decoherence'],
  ['T₂', 'Dephasing time: how long a superposition keeps a well-defined relative phase. T₂ ≤ 2T₁.', 'decoherence'],
  ['Teleportation', 'Transferring an unknown qubit state using a Bell pair and two classical bits.', 'teleportation'],
  ['Tensor product', 'The operation (⊗) that combines the state spaces of separate systems.', 'latensor'],
  ['Threshold', 'The physical error rate below which larger error-correcting codes give exponentially fewer logical errors.', 'qec'],
  ['Transmon', 'The most widely used superconducting qubit, built around Josephson junctions.', 'hardware'],
  ['Unitary', 'A matrix with U†U = I. Every quantum gate is unitary and therefore reversible.', 'launitary'],
  ['Universal gate set', 'A small set of gates, such as {H, T, CNOT}, that can approximate any quantum computation.', 'universal'],
  ['VQE', 'Variational quantum eigensolver: a hybrid loop that minimizes a measured energy over circuit parameters.', 'variational']
];

})();
