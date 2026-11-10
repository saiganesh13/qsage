/* =====================================================================
   Research track · Error correction and fault tolerance (part 2)
   ===================================================================== */
(() => {
const G = 5;

/* ---------------- 25 · Fault-tolerant circuits ---------------- */
LESSONS.push({
  id: 'faulttolerance', n: 25, stage: G, minutes: 15, title: 'Fault-tolerant circuits',
  lede: 'The circuits that detect errors are themselves noisy. Fault tolerance is the discipline of designing every gadget so that one fault never grows into an error the code cannot handle.',
  html: `
<h2>Errors spread through gates</h2>
<p>A CNOT copies an X error from its control onto its target, and copies a Z error from its target back onto its control. A single fault early in a circuit can therefore end up on several qubits. If those qubits belong to the same code block, a distance-3 code that could fix any one error may now face two.</p>
${EQ('CNOT: X<sub>c</sub> → X<sub>c</sub>X<sub>t</sub>,&nbsp;&nbsp; Z<sub>t</sub> → Z<sub>c</sub>Z<sub>t</sub>,&nbsp;&nbsp; X<sub>t</sub> → X<sub>t</sub>,&nbsp;&nbsp; Z<sub>c</sub> → Z<sub>c</sub>')}
<p>A gadget is <strong>fault-tolerant</strong> if every single fault anywhere inside it leads to at most one error per code block, or more generally to an error the code can still correct. The lab measures the weight-4 X check ${m('X₀X₁X₂X₃')} with one ancilla qubit, the way surface codes do. Put a fault on the ancilla partway through and watch it spread.</p>
${LAB('hook')}
<h2>Ways to measure a syndrome safely</h2>
<ul>
<li><strong>Hook-aware ordering.</strong> In the surface code a hook error leaves two data errors, but choosing the CNOT order carefully makes that pair lie across the logical operator’s direction rather than along it, so the code distance is preserved.</li>
<li><strong>Flag qubits.</strong> Add an extra ancilla that is triggered when a dangerous fault happens, so the decoder knows to expect a correlated error (Chao and Reichardt, 2018).</li>
<li><strong>Shor, Steane and Knill methods.</strong> Use a verified cat state, an encoded ancilla block, or teleportation through an encoded Bell pair to extract the syndrome without spreading errors.</li>
</ul>
<h2>Transversal gates and their limit</h2>
<p>The simplest fault-tolerant logical gate is <strong>transversal</strong>: apply a physical gate to qubit 1 of each block, then qubit 2, and so on. No gate ever touches two qubits of the same block, so errors cannot spread within a block. The Steane code has transversal H, S (up to a correction) and CNOT, the whole Clifford group.</p>
<p>Unfortunately the Eastin–Knill theorem (2009) says no code that can detect errors has a universal set of transversal gates. Something non-transversal is always needed, and in practice it is the T gate, supplied by the magic states of [[L:magic]].</p>
<h2>The threshold theorem</h2>
<p>Several groups proved in 1996–97 (Aharonov and Ben-Or; Kitaev; Knill, Laflamme and Zurek) that if every component fails with probability below a constant threshold, arbitrarily long quantum computations can be made arbitrarily reliable with only polylogarithmic overhead. The original proofs used <strong>concatenation</strong>: encode each physical qubit of a code in another copy of the code, and so on. For a distance-3 code each level roughly squares the error rate in units of the threshold:</p>
${EQ('p<sub>k</sub> = p<sub>th</sub> (p / p<sub>th</sub>)<sup>2<sup>k</sup></sup>')}
${LAB('concat')}
<p>Doubly exponential suppression for exponential qubit cost is a good trade on paper, but concatenated codes have low thresholds and need non-local connections. Today’s hardware plans mostly use topological or qLDPC codes instead, with the same logic: stay below threshold, then grow the code.</p>
`,
  labs: {
    hook: {
      title: 'Follow a fault through a syndrome circuit',
      cap: 'The ancilla a starts in |0⟩; H, four CNOTs and a final H measure X₀X₁X₂X₃. Choose a Pauli and tap a dot on a wire to insert one fault there. Labels to the right of the fault show where it has spread.',
      build(body, id) {
        const cols = [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'CX', c: 0, t: 2 }], [{ g: 'CX', c: 0, t: 3 }], [{ g: 'CX', c: 0, t: 4 }], [{ g: 'H', q: 0 }], [{ g: 'M', q: 0 }]];
        let P = 'X', fault = { w: 0, k: 2, p: 'X' };
        const box = h('div', { class: 'circ-wrap' }), stat = h('div', { class: 'status' });
        const prop = () => {
          if (!fault) return null; const x = new Array(5).fill(0), z = new Array(5).fill(0), frames = [];
          if (fault.p !== 'Z') x[fault.w] = 1; if (fault.p !== 'X') z[fault.w] = 1;
          for (let s = fault.k; s <= 5; s++) {
            if (s > fault.k) { const op = cols[s][0]; if (op.g === 'H') { const t = x[op.q]; x[op.q] = z[op.q]; z[op.q] = t; } else { x[op.t] ^= x[op.c]; z[op.c] ^= z[op.t]; } }
            frames[s] = { x: x.slice(), z: z.slice() };
          }
          return { frames, fx: x, fz: z };
        };
        const render = () => {
          const d = drawCircuit(5, cols, { cw: 66, rh: 46, labels: ['a |0⟩', 'd0', 'd1', 'd2', 'd3'], aria: 'Syndrome measurement circuit' }), r = prop();
          for (let s = 0; s <= 5; s++) for (let w = 0; w < 5; w++) {
            const cx = d.lw + (s + 1) * d.cw, cy = d.Y(w), fr = r && r.frames[s], has = fr && (fr.x[w] || fr.z[w]), isF = fault && fault.k === s && fault.w === w;
            if (has) { const L = fr.x[w] && fr.z[w] ? 'Y' : fr.x[w] ? 'X' : 'Z'; d.svg.append(sv('circle', { cx, cy, r: 11, class: isF ? 'hk-f' : 'hk-p' }), sv('text', { x: cx, y: cy, class: 'hk-t' }, L)); }
            const hit = sv('circle', { cx, cy, r: has ? 13 : 5, class: has ? 'hk-hit' : 'hk-slot', tabindex: 0, role: 'button', 'aria-label': `Insert ${P} fault on ${w ? 'd' + (w - 1) : 'ancilla'} after step ${s + 1}` });
            const act = () => { fault = isF ? null : { w, k: s, p: P }; render(); };
            hit.addEventListener('click', act); hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
            d.svg.append(hit);
          }
          box.innerHTML = ''; box.append(d.svg);
          if (!r) { stat.className = 'status'; stat.textContent = 'No fault. Tap a dot to insert one.'; return; }
          const dx = [1, 2, 3, 4].filter(w => r.fx[w]).map(w => 'd' + (w - 1)), dz = [1, 2, 3, 4].filter(w => r.fz[w]).map(w => 'd' + (w - 1));
          const flip = r.fx[0] === 1, effX = Math.min(dx.length, 4 - dx.length);
          const parts = []; if (dx.length) parts.push(`X on ${dx.join(', ')}`); if (dz.length) parts.push(`Z on ${dz.join(', ')}`);
          const worst = Math.max(effX, dz.length);
          stat.className = 'status' + (worst >= 2 ? ' bad' : ' good');
          stat.textContent = `Data error: ${parts.length ? parts.join('; ') : 'none'}. ${dx.length ? `Up to the stabilizer X₀X₁X₂X₃ that is weight ${effX} in X. ` : ''}Syndrome bit ${flip ? 'flipped' : 'correct'}. ${worst >= 2 ? 'One fault became a two-qubit error: a hook error.' : 'At most one data qubit affected.'}`;
        };
        body.append(box, h('div', { class: 'split' }, stat, h('div', { class: 'stack' },
          field('Fault to insert', seg([{ v: 'X', label: 'X' }, { v: 'Z', label: 'Z' }, { v: 'Y', label: 'Y' }], P, v => { P = v; if (fault) { fault.p = v; render(); } }, 'Pauli')),
          h('div', { class: 'btns' }, btn('Show the hook error', () => { P = 'X'; fault = { w: 0, k: 2, p: 'X' }; render(); }, 'sm'), btn('Clear fault', () => { fault = null; render(); }, 'sm')))));
        render();
      }
    },
    concat: {
      title: 'Concatenation',
      cap: 'Each level of concatenation squares the error rate in units of the threshold, while multiplying the number of physical qubits by 7 for the Steane code (data qubits only; ancillas add more).',
      build(body, id) {
        let lp = -4, lth = -3;
        const cv = canvas('', 'height:230px'), tb = h('div', { class: 'readout' });
        const pL = k => { const p = Math.pow(10, lp), th = Math.pow(10, lth); return th * Math.pow(p / th, Math.pow(2, k)); };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-.5, 4.5], y: [1e-30, 1], ylog: true, xt: [0, 1, 2, 3, 4], xf: v => 'level ' + v, yt: [1e-30, 1e-20, 1e-10, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), yl: 'logical error rate' });
          for (let k = 0; k <= 4; k++) { const v = Math.max(1e-30, Math.min(1, pL(k))), x = A.X(k); ctx.fillStyle = Math.pow(10, lp) < Math.pow(10, lth) ? T.cyan : T.bad; ctx.fillRect(x - 16, A.Y(v), 32, A.B - A.Y(v)); txt(ctx, (7 ** k).toLocaleString('en-US') + ' q', x, A.Y(v) - 9, { color: T.ink }); }
        });
        const upd = () => { tb.innerHTML = [0, 1, 2, 3, 4].map(k => `<span class="k">level ${k} </span>${sci(Math.min(1, pL(k)), 1)} &nbsp;<span class="k">qubits </span>${(7 ** k).toLocaleString('en-US')}`).join('<br>'); pc.inv(); };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('p'), label: 'Physical error rate p', min: -5, max: -1.5, step: .05, value: lp, fmt: v => sci(Math.pow(10, v), 1), on: v => { lp = v; upd(); } }),
          slider({ id: id('th'), label: 'Threshold p_th', min: -4, max: -2, step: .05, value: lth, fmt: v => sci(Math.pow(10, v), 1), on: v => { lth = v; upd(); } }), tb,
          h('p', { class: 'hint' }, 'Set p above the threshold and the bars turn red: every level makes things worse.'))));
        upd();
      }
    }
  },
  take: ['CNOTs spread X errors from control to target and Z errors from target to control.',
    'A gadget is fault-tolerant if one fault causes at most a correctable error; hook errors and flag qubits are about this.',
    'Transversal gates are naturally fault-tolerant, but Eastin–Knill rules out a universal transversal set.',
    'The threshold theorem: below a constant error rate, concatenation suppresses errors doubly exponentially.'],
  quiz: [
    { q: 'An X error on the target of a CNOT, before the CNOT. Where is it afterwards?', o: ['On the target only', 'On control and target', 'On the control only', 'It disappears'], a: 0, why: 'X on the target commutes with CNOT; only X on the control spreads.' },
    { q: 'What does the Eastin–Knill theorem forbid?', o: ['Any transversal gate', 'A universal set of transversal gates in an error-detecting code', 'Fault-tolerant measurement', 'Codes with distance above 3'], a: 1, why: 'Some logical gate always needs a non-transversal method, usually magic states.' }
  ]
});

/* ---------------- 26 · Logical gates and magic states ---------------- */
LESSONS.push({
  id: 'magic', n: 26, stage: G, minutes: 14, title: 'Logical gates and magic states',
  lede: 'Clifford gates are cheap on an error-corrected machine. T gates are not, and supplying them dominates the cost of most fault-tolerant algorithms.',
  html: `
<h2>Cheap gates on the surface code</h2>
<ul>
<li><strong>Pauli gates</strong> are free: the control software just remembers them (a Pauli frame) and reinterprets later measurements.</li>
<li><strong>CNOT</strong> between surface-code patches is done by <strong>lattice surgery</strong>: temporarily merge two patches by measuring checks along their shared edge, then split them again. The merge measures a joint logical operator such as ${m('Z<sub>L</sub>⊗Z<sub>L</sub>')}, and two such measurements with an ancilla patch implement a CNOT.</li>
<li><strong>H and S</strong> are handled with patch deformations and a few extra surgery steps.</li>
</ul>
<p>All of these are Clifford operations, and Clifford operations alone can be simulated classically ([[L:stabsim]]). A non-Clifford gate is needed for any quantum advantage, and the standard choice is ${m('T = diag(1, e<sup>iπ/4</sup>)')}.</p>
<h2>Gate teleportation with a magic state</h2>
<p>Instead of applying T directly, prepare the <strong>magic state</strong> ${m('|T⟩ = T|+⟩ = (|0⟩ + e<sup>iπ/4</sup>|1⟩)/√2')} separately, then consume it with Clifford operations and a measurement:</p>
<div class="wide" data-tgadget></div>
<p>If the measurement reads 0, the data qubit now holds ${m('T|ψ⟩')}. If it reads 1, it holds ${m('T<sup>†</sup>|ψ⟩')}, and an S gate fixes it, since ${m('ST<sup>†</sup> = T')}. The difficult part has moved from applying a gate to preparing a state, which can be checked and purified before use.</p>
<h2>Distillation</h2>
<p>Magic states made directly on hardware are only as good as the physical qubits. Bravyi and Kitaev’s 2005 <strong>15-to-1 distillation</strong> protocol takes 15 noisy copies and, using only Clifford operations, outputs one copy with error about ${m('35p³')}, discarding the batch if a check fails. Repeat in rounds until the error is low enough for the whole algorithm. The machinery is called a <strong>magic state factory</strong>, and in early resource estimates factories took up most of the machine.</p>
${LAB('distill')}
<h2>Counting T gates</h2>
<p>Algorithms are compiled to Clifford+T. An arbitrary single-qubit rotation must be approximated by a sequence of H and T gates; optimal synthesis (Ross and Selinger) needs about ${m('3 log₂(1/ε)')} T gates for precision ${m('ε')}. So the <strong>T count</strong>, and the number of rotations behind it, is the main cost figure that resource estimates track, alongside the number of logical qubits.</p>
${NOTE('Cheaper magic', `<p>Factory costs keep falling. Litinski showed in 2019 that careful layouts make distillation far cheaper than earlier estimates assumed, and in 2024 Gidney, Shutty and Jones introduced <strong>magic state cultivation</strong>, which grows a high-quality T state inside a single surface-code patch at a cost comparable to a CNOT. This is one of the main reasons resource estimates for Shor’s algorithm dropped so sharply.</p>`)}
`,
  mount(root) {
    const el = root.querySelector('[data-tgadget]'); if (!el) return;
    const w = h('div', { class: 'circ-wrap', style: 'margin:6px 0 20px' });
    w.append(drawCircuit(2, [[{ g: 'CX', c: 0, t: 1 }], [{ g: 'M', q: 1 }], [{ g: 'CC', q: 0, from: 1, label: 'S', sup: 'm' }]], { cw: 70, labels: ['|ψ⟩', '|T⟩'], aria: 'T gate by gate teleportation' }).svg);
    el.append(w);
  },
  labs: {
    distill: {
      title: 'Magic state budget',
      cap: 'Model: rotations synthesized at precision ε = 1%/R, costing 3·log₂(1/ε) T gates each; each 15-to-1 round maps p → 35p³ and costs 15 input states per output. Rounds are added until the whole algorithm’s T gates fail with total probability under 1%.',
      build(body, id) {
        let lR = 6, lp = -3;
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const calc = () => {
          const R = Math.pow(10, lR), eps = .01 / R, perRot = Math.ceil(3 * Math.log2(1 / eps)), NT = R * perRot, target = .01 / NT;
          const ps = [Math.pow(10, lp)]; while (ps.length < 6 && ps[ps.length - 1] > target) { const nx = 35 * ps[ps.length - 1] ** 3; if (nx >= ps[ps.length - 1]) break; ps.push(nx); }
          return { R, perRot, NT, target, ps, k: ps.length - 1, ok: ps[ps.length - 1] <= target };
        };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), c2 = calc(), A = axes(ctx, w, H, { x: [-.5, 5.5], y: [1e-30, 1], ylog: true, xt: [0, 1, 2, 3, 4, 5], xf: v => v === 0 ? 'raw' : 'round ' + v, yt: [1e-30, 1e-20, 1e-10, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), yl: 'error per T state' });
          const y = A.Y(c2.target); polyline(ctx, [[A.L, y], [A.R, y]], T.copper, 1.5, [5, 4]); txt(ctx, 'needed', A.R - 4, y - 9, { align: 'right', color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
          c2.ps.forEach((p, k) => { const x = A.X(k), v = Math.max(1e-30, p); ctx.fillStyle = p <= c2.target ? T.cyan : T.muted; ctx.fillRect(x - 15, A.Y(v), 30, A.B - A.Y(v)); });
        });
        const upd = () => {
          const c2 = calc();
          ro.innerHTML = `${c2.R.toLocaleString('en-US', { maximumSignificantDigits: 3 })} rotations × ${c2.perRot} T gates each = <b>${sci(c2.NT, 1)} T gates</b>. Each must fail with probability below ${sci(c2.target, 1)}. ` +
            (c2.ok ? `That takes <b>${c2.k} round${c2.k === 1 ? '' : 's'}</b> of 15-to-1 distillation: ${(15 ** c2.k).toLocaleString('en-US')} raw states per output, ${sci(c2.NT * 15 ** c2.k, 1)} raw magic states in total.` : 'Distillation cannot get there from this input error: 15-to-1 only helps when 35p³ is smaller than p, that is p below about 17%, and too many rounds would be needed.');
          pc.inv();
        };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('R'), label: 'Arbitrary rotations in the algorithm', min: 2, max: 11, step: .1, value: lR, fmt: v => sci(Math.pow(10, v), 1), on: v => { lR = v; upd(); } }),
          slider({ id: id('p'), label: 'Error of raw (injected) magic states', min: -4, max: -1, step: .05, value: lp, fmt: v => sci(Math.pow(10, v), 1), on: v => { lp = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['On the surface code, Pauli gates are tracked in software and CNOTs are done by lattice surgery.',
    'T gates are applied by consuming a magic state |T⟩ with Clifford operations and a measurement.',
    '15-to-1 distillation maps error p to about 35p³ per round.',
    'T count, from rotation synthesis at about 3·log₂(1/ε) T gates each, drives fault-tolerant resource estimates.'],
  quiz: [
    { q: 'In T-gate teleportation the measurement gives 1. What correction is applied?', o: ['X', 'Z', 'S', 'T'], a: 2, why: 'Outcome 1 leaves the data in T†|ψ⟩ instead of T|ψ⟩. Since S = T², applying S gives S·T† = T·T·T† = T, completing the intended gate up to a global phase.' },
    { q: 'Raw magic states have error 10⁻³. After one round of 15-to-1 distillation the error is about…', o: ['10⁻⁴', '3.5 × 10⁻⁸', '10⁻⁶', '1.5 × 10⁻²'], a: 1, why: 'One 15-to-1 round outputs error about 35p³. With p = 10⁻³ that is 35 × 10⁻⁹ = 3.5 × 10⁻⁸, more than four orders of magnitude better from a single round.' }
  ]
});

/* ---------------- 27 · Beyond the surface code ---------------- */
const BB = [[72, 12, 6], [90, 8, 10], [108, 8, 10], [144, 12, 12], [288, 12, 18]];
LESSONS.push({
  id: 'codes', n: 27, stage: G, minutes: 14, title: 'Beyond the surface code',
  lede: 'The surface code is robust and needs only neighbouring connections, but it spends hundreds of physical qubits on every logical qubit. Newer code families trade connectivity for efficiency.',
  html: `
<h2>The cost of the surface code</h2>
<p>A distance-${m('d')} rotated surface code uses ${m('d²')} data qubits and ${m('d² − 1')} measurement qubits, about ${m('2d²')} in total, to protect a single logical qubit. At distance 25 that is about 1,250 physical qubits per logical qubit. Its encoding rate ${m('k/n')} goes to zero as the code grows. Information theory allows far better: there are codes where ${m('k')} and ${m('d')} both grow in proportion to ${m('n')}.</p>
<h2>Quantum LDPC codes</h2>
<p><strong>Low-density parity-check</strong> (LDPC) codes keep each check small and each qubit in few checks, like the surface code, but allow checks between distant qubits. Constructions include hypergraph product codes (Tillich and Zémor, 2009) and, since 2021, “good” qLDPC codes with constant rate and linear distance (Panteleev and Kalachev). For near-term hardware the leading family is the <strong>bivariate bicycle</strong> codes published by IBM researchers in 2024. Their best-known member, the gross code ${m('[[144, 12, 12]]')}, protects 12 logical qubits with 288 physical qubits, roughly ten times fewer than surface codes of similar strength. The price is connectivity: each qubit talks to six others, some of them far away on the chip. [[L:qldpc]] builds hypergraph products and bivariate bicycle codes interactively.</p>
${LAB('overhead')}
<p>IBM’s roadmap is built on these codes. Its Loon test processor (announced in 2025) was designed to try the long-range couplers they require, and its planned Starling system targets 200 logical qubits running 100 million gates by 2029, decoded with a fast belief-propagation variant called Relay-BP.</p>
<h2>A tour of code families</h2>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Parameters</th><th>Strengths</th><th>Costs</th></tr></thead><tbody>
<tr><td>Repetition</td><td>[[d, 1, d]] against one error type</td><td>Simplest possible; enough when noise is strongly biased</td><td>Protects against bit flips or phase flips, not both</td></tr>
<tr><td>Five-qubit code</td><td>[[5, 1, 3]]</td><td>Smallest code that corrects any single-qubit error</td><td>Not CSS; awkward gates</td></tr>
<tr><td>Steane</td><td>[[7, 1, 3]]</td><td>Transversal Clifford gates</td><td>Weight-4 checks between non-neighbours</td></tr>
<tr><td>Surface code</td><td>[[d², 1, d]]</td><td>About 1% threshold, nearest-neighbour checks, fast decoders</td><td>About 2d² qubits per logical qubit</td></tr>
<tr><td>2D colour code</td><td>[[(3d² + 1)/4, 1, d]]</td><td>Transversal Clifford gates in 2D</td><td>Weight-6 checks; harder decoding; lower threshold</td></tr>
<tr><td>Bivariate bicycle</td><td>[[144, 12, 12]] and others</td><td>About 10× fewer qubits than surface codes</td><td>Long-range couplers; logical gates are more complex</td></tr>
<tr><td>Floquet (honeycomb)</td><td>dynamic</td><td>Only two-qubit measurements needed</td><td>Logical information moves every round</td></tr>
<tr><td>Bosonic cat and GKP codes</td><td>one oscillator per qubit</td><td>Cat qubits make bit flips exponentially rare; GKP packs a qubit into an oscillator’s phase space</td><td>Need an outer code; demanding microwave control</td></tr>
</tbody></table></div>
<h2>Using the hardware’s strengths</h2>
<ul>
<li><strong>Biased noise.</strong> Cat qubits (pursued by Alice &amp; Bob and by AWS with its Ocelot chip) suppress bit flips exponentially in the oscillator’s photon number, leaving mostly phase flips. A simple repetition code against phase flips may then be enough, and tailored surface codes such as the XZZX code also exploit bias.</li>
<li><strong>Moving qubits.</strong> Neutral atoms and trapped ions can be shuttled, so any qubit can meet any other. That makes transversal gates between code blocks natural and qLDPC codes easier; Harvard and QuEra ran circuits on 48 logical qubits this way in 2023.</li>
<li><strong>Erasure qubits.</strong> If the hardware can flag where an error happened, as some atom and superconducting designs can, the decoder knows the location and the effective threshold rises substantially.</li>
</ul>
`,
  labs: {
    overhead: {
      title: 'Physical qubits for K logical qubits',
      cap: 'Surface code: K × (2d² − 1) physical qubits. Bivariate bicycle: enough blocks of the smallest published code with distance at least d, each block using 2n physical qubits (data plus checks). Codes listed: [[72,12,6]], [[90,8,10]], [[108,8,10]], [[144,12,12]], [[288,12,18]].',
      build(body, id) {
        let K = 12, D = 12;
        const cv = canvas('', 'height:250px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const surf = d => K * (2 * d * d - 1);
        const bb = d => { let best = null; for (const [n, k, dd] of BB) if (dd >= d) { const tot = Math.ceil(K / k) * 2 * n; if (!best || tot < best.tot) best = { tot, code: `[[${n},${k},${dd}]]`, blocks: Math.ceil(K / k) }; } return best; };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), ymax = Math.pow(10, Math.ceil(Math.log10(surf(21)))), A = axes(ctx, w, H, { x: [3, 21], y: [10, ymax], ylog: true, xt: [3, 6, 9, 12, 15, 18, 21], yt: [10, 100, 1e3, 1e4, 1e5, 1e6].filter(v => v <= ymax), yf: v => v >= 1e3 ? (v / 1e3) + 'k' : String(v), xl: 'code distance d', yl: 'physical qubits' });
          const s = [], b = []; for (let d = 3; d <= 21; d += .25) s.push([A.X(d), A.Y(surf(d))]); polyline(ctx, s, T.copper, 2.2);
          for (let d = 3; d <= 18; d++) { const r = bb(d); if (r) b.push([A.X(d), A.Y(r.tot)]); } b.forEach(p => dot(ctx, p[0], p[1], 3.5, T.cyan));
          const x = A.X(D); polyline(ctx, [[x, A.T], [x, A.B]], T.muted, 1, [3, 3]);
          txt(ctx, 'surface code', A.X(18), A.Y(surf(18)) - 12, { color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
          txt(ctx, 'bivariate bicycle', A.X(8), A.Y(bb(8).tot) + 14, { color: T.cyan, font: '600 11px "JetBrains Mono",monospace' });
        });
        const upd = () => {
          const r = bb(D);
          ro.innerHTML = `Surface code at d = ${D}: <b>${surf(D).toLocaleString('en-US')}</b> physical qubits.<br>` + (r ? `Bivariate bicycle: ${r.blocks} block${r.blocks > 1 ? 's' : ''} of ${r.code} = <b>${r.tot.toLocaleString('en-US')}</b> physical qubits, ${num(surf(D) / r.tot, 1)}× fewer.` : 'No listed bivariate bicycle code reaches this distance.');
          pc.inv();
        };
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          slider({ id: id('K'), label: 'Logical qubits K', min: 1, max: 120, step: 1, value: K, fmt: String, on: v => { K = v; upd(); } }),
          slider({ id: id('d'), label: 'Required distance d', min: 3, max: 21, step: 1, value: D, fmt: String, on: v => { D = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['The surface code needs about 2d² physical qubits per logical qubit; its rate vanishes as d grows.',
    'qLDPC codes keep checks small but allow long-range ones, enabling constant rate.',
    'The bivariate bicycle gross code [[144,12,12]] uses 288 qubits for 12 logical qubits.',
    'Biased noise, movable qubits and erasure detection let hardware choose cheaper codes.'],
  quiz: [
    { q: 'Roughly how many physical qubits does a distance-11 rotated surface code use for one logical qubit?', o: ['22', '121', 'About 240', 'About 1,200'], a: 2, why: 'A distance-d rotated surface code uses d² data qubits and d² − 1 measurement qubits. For d = 11 that is 121 + 120 = 241 physical qubits for a single logical qubit.' },
    { q: 'What do bivariate bicycle codes need that the surface code does not?', o: ['Magic states', 'Long-range connections between qubits', 'Measurement-free operation', 'Bosonic modes'], a: 1, why: 'Each check involves some distant qubits, so the chip needs long couplers.' }
  ]
});

/* ---------------- 28 · Resource estimation ---------------- */
LESSONS.push({
  id: 'resources', n: 28, stage: G, minutes: 12, title: 'Resource estimation',
  lede: 'How big a machine does an algorithm need, and for how long? Resource estimation connects algorithms, codes, decoders and hardware numbers into one budget.',
  html: `
<h2>The recipe</h2>
<ol>
<li><strong>Count the logical work.</strong> Compile the algorithm and count logical qubits, T gates (or rotations) and logical depth.</li>
<li><strong>Set an error budget.</strong> Decide the acceptable chance that the whole run fails, say 1%, and split it between memory errors, T states and rotation synthesis.</li>
<li><strong>Choose the code distance.</strong> Find the smallest ${m('d')} for which the logical error rate per qubit per step, multiplied by the number of qubit-steps, fits the budget.</li>
<li><strong>Lay out the chip.</strong> Add routing space for lattice surgery and magic state factories or cultivation regions.</li>
<li><strong>Estimate time.</strong> Each logical step takes about ${m('d')} syndrome rounds; multiply by the cycle time (about a microsecond for superconducting qubits, much longer for atoms and ions) and by the number of sequential steps.</li>
</ol>
<p>Tools such as Microsoft’s Azure Quantum Resource Estimator and Google’s Qualtran automate these steps with detailed models. The lab below uses a deliberately simple version so you can see how the pieces push on each other.</p>
${LAB('estimator')}
<h2>What the numbers say</h2>
<p>The physical error rate enters through ${m('(p/p<sub>th</sub>)<sup>(d+1)/2</sup>')}, so the required distance, and with it the qubit count, falls quickly as hardware improves. Halving ${m('p')} can cut the machine size by a large fraction. Time, on the other hand, is dominated by the number of sequential T gates and the cycle time, which is why platforms with slow cycles must compensate with parallelism. Gidney’s 2025 estimate for RSA-2048 (under a million qubits, under a week) assumed 0.1% physical error rates, a 1 µs cycle and a 10 µs reaction time for classical feedback, and each assumption matters.</p>
${NOTE('Reading published estimates', `<p>When comparing estimates, check the assumed physical error rate and noise model, cycle time, decoder reaction time, connectivity, whether magic states use distillation or cultivation, and which algorithmic optimizations were applied. Two estimates that differ by 100× often differ mostly in these assumptions.</p>`)}
`,
  labs: {
    estimator: {
      title: 'A back-of-envelope resource estimator',
      cap: 'Model: logical error per qubit per step ε(d) = 0.1·(p/1%)^((d+1)/2); total failure = Q × N_T × ε(d) ≤ 1%. Footprint = (2Q + 25F) patches × 2d² qubits (half the logical area for routing; each factory modeled as 25 patches). Each factory delivers one T state per 6d cycles; time = N_T × d cycles × max(1, 6/F).',
      build(body, id) {
        let lp = -3, lQ = 2.5, lT = 9, F = 8, lc = 0;
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const est = (p) => {
          const Q = Math.round(Math.pow(10, lQ)), NT = Math.pow(10, lT); if (p >= .01) return null;
          let d = 3; while (d < 101 && Q * NT * .1 * Math.pow(p / .01, (d + 1) / 2) > .01) d += 2; if (d >= 101) return null;
          const qubits = (2 * Q + 25 * F) * 2 * d * d, secs = NT * d * Math.pow(10, lc) * 1e-6 * Math.max(1, 6 / F);
          return { Q, NT, d, qubits, secs };
        };
        const tfmt = s => s < 60 ? num(s, 1) + ' s' : s < 3600 ? num(s / 60, 1) + ' min' : s < 86400 ? num(s / 3600, 1) + ' h' : s < 86400 * 365 ? num(s / 86400, 1) + ' days' : num(s / 86400 / 365, 1) + ' years';
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1e-4, 1e-2], xlog: true, y: [1e3, 1e9], ylog: true, xt: [1e-4, 1e-3, 1e-2], xf: v => pct(v, v < 1e-3 ? 2 : 1), yt: [1e3, 1e5, 1e7, 1e9], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'physical error rate', yl: 'physical qubits' });
          const pts = []; for (let i = 0; i <= 120; i++) { const p = Math.pow(10, -4 + 2 * i / 120 * .995), e = est(p); if (e) pts.push([A.X(p), A.Y(clamp(e.qubits, 1e3, 1e9))]); }
          polyline(ctx, pts, T.cyan, 2.2); const e = est(Math.pow(10, lp)); if (e) dot(ctx, A.X(Math.pow(10, lp)), A.Y(clamp(e.qubits, 1e3, 1e9)), 6, T.copper, T.surface);
        });
        const upd = () => {
          const e = est(Math.pow(10, lp));
          ro.innerHTML = !e ? 'At or above the 1% threshold no code distance works in this model.' :
            `Code distance <b>d = ${e.d}</b> · physical qubits <b>${sci(e.qubits, 2)}</b> · runtime <b>${tfmt(e.secs)}</b><br><span class="k">logical qubits </span>${e.Q.toLocaleString('en-US')} · <span class="k">T gates </span>${sci(e.NT, 1)} · <span class="k">factories </span>${F}`;
          pc.inv();
        };
        const S = (k, l, mn, mx, st, v, f, on) => slider({ id: id(k), label: l, min: mn, max: mx, step: st, value: v, fmt: f, on: x => { on(x); upd(); } });
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          S('p', 'Physical error rate p', -4, -2.05, .05, lp, v => pct(Math.pow(10, v), Math.pow(10, v) < 1e-3 ? 3 : 2), v => { lp = v; }),
          S('Q', 'Logical qubits Q', 1, 4, .05, lQ, v => Math.round(Math.pow(10, v)).toLocaleString('en-US'), v => { lQ = v; }),
          S('T', 'T gates N_T', 4, 12, .1, lT, v => sci(Math.pow(10, v), 1), v => { lT = v; }),
          S('F', 'Magic state factories F', 1, 30, 1, F, String, v => { F = v; }),
          S('c', 'Syndrome cycle time', -1, 3, .1, lc, v => fmtSI(Math.pow(10, v) * 1e-6, 's', 1), v => { lc = v; }), ro)));
        upd();
      }
    }
  },
  take: ['Resource estimates start from logical qubits and T count, then choose a code distance to fit an error budget.',
    'Footprint includes routing space and magic state production, not just data patches.',
    'Runtime is roughly sequential T steps × d rounds × cycle time.',
    'Published estimates depend heavily on assumed error rates, cycle times and magic-state methods.'],
  quiz: [
    { q: 'In the simple model, what happens to the required code distance if the physical error rate falls?', o: ['It grows', 'It falls', 'It stays the same', 'It must become even'], a: 1, why: 'Each step of distance suppresses errors by about p_th/p, so fewer steps are needed when p is smaller.' },
    { q: 'Which change mainly shortens runtime rather than footprint?', o: ['A faster syndrome cycle', 'Fewer logical qubits', 'A better code rate', 'Smaller factories'], a: 0, why: 'Runtime scales with the cycle time; qubit count does not.' }
  ]
});

window.GLOSSARY_EXTRA.push(
  ['Fault tolerance', 'Designing circuits so that a single fault never causes an uncorrectable error.', 'faulttolerance'],
  ['Hook error', 'A single fault on a syndrome ancilla that spreads to two or more data qubits.', 'faulttolerance'],
  ['Flag qubit', 'An extra ancilla that signals when a dangerous fault has occurred during syndrome extraction.', 'faulttolerance'],
  ['Transversal gate', 'A logical gate applied qubit by qubit across code blocks, so errors cannot spread within a block.', 'faulttolerance'],
  ['Eastin–Knill theorem', 'No error-detecting code has a universal set of transversal gates.', 'faulttolerance'],
  ['Concatenation', 'Encoding each physical qubit of a code in another copy of the code, level after level.', 'faulttolerance'],
  ['Magic state', 'A non-stabilizer state such as T|+⟩ that, consumed with Clifford operations, applies a non-Clifford gate.', 'magic'],
  ['Magic state distillation', 'Turning many noisy magic states into fewer, better ones, e.g. 15-to-1 with error ≈ 35p³.', 'magic'],
  ['Magic state cultivation', 'Growing a high-fidelity T state inside one surface-code patch (Gidney, Shutty and Jones, 2024).', 'magic'],
  ['Lattice surgery', 'Merging and splitting surface-code patches to measure joint logical operators and perform CNOTs.', 'surgery'],
  ['T count', 'The number of T gates in a Clifford+T circuit; the main cost driver in fault-tolerant estimates.', 'magic'],
  ['qLDPC code', 'A quantum low-density parity-check code: small checks, but possibly between distant qubits.', 'qldpc'],
  ['Bivariate bicycle code', 'A qLDPC code family; the gross code [[144,12,12]] uses 288 qubits for 12 logical qubits.', 'qldpc'],
  ['Cat qubit', 'A bosonic qubit whose bit-flip errors are suppressed exponentially in photon number.', 'bosonic'],
  ['Resource estimate', 'A calculation of physical qubits and runtime needed to run an algorithm fault-tolerantly.', 'resources']
);
})();
