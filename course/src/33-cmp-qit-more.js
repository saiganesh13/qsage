/* =====================================================================
   Research tracks · compilers: ZX-calculus and phase folding, the software stack, distributed computing
                   · information theory: metrology, blind computing, quantum money, channel capacities
   ===================================================================== */
(() => {
const CMP = 8, QIT = 10;
const h2b = p => p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
const Hs = ps => ps.reduce((s, p) => s - (p > 1e-15 ? p * Math.log2(p) : 0), 0);

/* ---------- ZX-calculus and phase folding ---------- */
const ZX_SVG = `<div class="fig" style="margin:18px 0"><svg viewBox="0 0 560 120" style="width:100%;max-width:560px;display:block;margin:0 auto" role="img" aria-label="Spider fusion: two connected green spiders with phases alpha and beta merge into one green spider with phase alpha plus beta">
<g fill="none" stroke="var(--ink)" stroke-width="2"><line x1="20" y1="40" x2="90" y2="60"/><line x1="20" y1="80" x2="90" y2="60"/><line x1="90" y1="60" x2="180" y2="60"/><line x1="180" y1="60" x2="250" y2="30"/><line x1="180" y1="60" x2="250" y2="90"/><line x1="340" y1="40" x2="430" y2="60"/><line x1="340" y1="80" x2="430" y2="60"/><line x1="430" y1="60" x2="520" y2="30"/><line x1="430" y1="60" x2="520" y2="90"/></g>
<circle cx="90" cy="60" r="20" fill="var(--good)" stroke="var(--ink)" stroke-width="2"/><circle cx="180" cy="60" r="20" fill="var(--good)" stroke="var(--ink)" stroke-width="2"/><circle cx="430" cy="60" r="24" fill="var(--good)" stroke="var(--ink)" stroke-width="2"/>
<g font-family="STIX Two Text, serif" font-size="17" text-anchor="middle" fill="var(--surface)"><text x="90" y="66">α</text><text x="180" y="66">β</text><text x="430" y="66">α+β</text></g>
<text x="295" y="66" font-family="JetBrains Mono, monospace" font-size="20" text-anchor="middle" fill="var(--ink)">=</text></svg></div>`;
function phaseFold(n, gates) {
  const mask = [...Array(n)].map((_, q) => 1 << q), terms = new Map(); let tBefore = 0;
  for (const g of gates) { if (g.g === 'CX') mask[g.t] ^= mask[g.c]; else { const k = { T: 1, Tdg: 7, S: 2, Sdg: 6, Z: 4 }[g.g]; if (k % 2) tBefore++; terms.set(mask[g.q], ((terms.get(mask[g.q]) || 0) + k) % 8); } }
  const list = [...terms.entries()].filter(([, k]) => k).sort((a, b) => a[0] - b[0]);
  return { list, tBefore, tAfter: list.filter(([, k]) => k % 2).length, out: mask };
}
const parityStr = (m, n) => [...Array(n).keys()].filter(q => m >> q & 1).map(q => 'x' + '₀₁₂₃₄'[q]).join(' ⊕ ');
const kStr = k => ['0', 'π/4', 'π/2', '3π/4', 'π', '5π/4', '3π/2', '7π/4'][k];

LESSONS.push({
  id: 'zx', n: 34.2, stage: CMP, minutes: 15, title: 'The ZX-calculus and phase folding',
  lede: 'The ZX-calculus replaces circuits with diagrams of green and red dots joined by wires, and a handful of rewrite rules. Simplifying the diagram simplifies the circuit, and it has become one of the best tools for cutting T counts.',
  html: `
<h2>Spiders</h2>
<p>Coecke and Duncan introduced the ZX-calculus in 2008 as a graphical language for quantum processes. A diagram has two kinds of node. A <strong>Z spider</strong> (green) with phase ${m('α')} maps ${m('|0…0⟩ → |0…0⟩')} and ${m('|1…1⟩ → e<sup>iα</sup>|1…1⟩')} between its input and output wires; an <strong>X spider</strong> (red) does the same in the ${m('|+⟩, |−⟩')} basis. A Z rotation is a green spider with one input and one output; a CNOT is a green spider on the control joined to a red spider on the target; a Hadamard is a yellow box or a dashed edge.</p>
<h2>Only connectivity matters</h2>
<p>The rules are few. Wires can be bent and nodes moved freely: only the graph matters. Adjacent spiders of the same colour <strong>fuse</strong>, adding their phases. Hadamards change a spider’s colour. A few more rules (the π-copy rule, bialgebra and the Euler decomposition of the Hadamard) complete the set, and the calculus is <em>complete</em> for Clifford+T: any two diagrams describing the same linear map can be rewritten into each other (Jeandel, Perdrix and Vilmart, 2018).</p>
${ZX_SVG}
<h2>Why compilers care</h2>
<p>Spider fusion lets phases that sit on different gates of a circuit meet and merge, even when gates in between seem to block them. Kissinger and van de Wetering’s PyZX (2019) turns a circuit into a ZX diagram, simplifies it with graph-theoretic rules (local complementation and pivoting), and extracts an equivalent circuit, cutting T counts by double-digit percentages on standard benchmarks. The same idea in circuit language is <strong>phase folding</strong> (Amy, Maslov and Mosca): in a circuit of CNOTs and Z rotations every qubit at every moment holds a parity of the inputs, every rotation applies a phase to that parity, and rotations on the same parity can be merged wherever they occur.</p>
${EQ('U |x₀x₁x₂⟩ = e<sup>i Σ<sub>k</sub> θ<sub>k</sub> · (parity<sub>k</sub> of x)</sup> |A x⟩ &nbsp;&nbsp; (a phase polynomial and a linear map)')}
${LAB('fold')}
${NOTE('Beyond T counts', `<p>ZX diagrams are also used to verify that two circuits are equivalent, to design lattice surgery ([[L:surgery]]) and measurement-based protocols, to analyse fault tolerance (Floquet codes and spacetime codes are naturally drawn as ZX diagrams), and to optimize circuits for routing ([[L:routing]]). Circuit extraction from an arbitrary diagram is hard in general, which is why practical tools restrict the rewrites they apply.</p>`)}
`,
  labs: {
    fold: {
      title: 'Folding phases in a CNOT + T circuit',
      cap: 'A random circuit of CNOTs and phase gates (T = π/4, T† = −π/4, S = π/2, Z = π) on three qubits. Phase folding tracks which parity of the inputs each wire carries, collects every rotation applied to each parity, and adds them modulo 2π. Terms with odd multiples of π/4 need one T gate each; the others are Clifford. The final linear map of CNOTs is unchanged. The table lists the merged phase polynomial.',
      build(body, id) {
        let ng = 18, seed = 4, C = null;
        const n = 3, circ = h('div', { class: 'circ-wrap' }), tbl = h('div', { class: 'scroll-x' }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const gen = () => { const r = rng(seed), gs = []; for (let k = 0; k < ng; k++) { if (r() < .45) { const c3 = Math.floor(r() * n); let t = Math.floor(r() * (n - 1)); if (t >= c3) t++; gs.push({ g: 'CX', c: c3, t }); } else gs.push({ g: ['T', 'Tdg', 'T', 'Tdg', 'S', 'Z'][Math.floor(r() * 6)], q: Math.floor(r() * n) }); } return gs; };
        const run = () => {
          const gs = gen(); C = phaseFold(n, gs); circ.innerHTML = ''; circ.append(drawCircuit(n, gs.map(g => [g]), { cw: 40, labels: ['x₀', 'x₁', 'x₂'] }).svg);
          tbl.innerHTML = `<table class="mini-tbl"><tr><th>parity</th><th>total phase</th><th>T gates</th></tr>${C.list.map(([m_, k]) => `<tr><td style="text-align:left">${parityStr(m_, n)}</td><td>${kStr(k)}</td><td>${k % 2 ? 1 : 0}</td></tr>`).join('')}</table>`;
          ro.innerHTML = `<span class="k">T count before </span>${C.tBefore} &nbsp; <span class="k">after phase folding </span>${C.tAfter}<br><span class="k">distinct parities with a phase </span>${C.list.length}<br><span class="k">output wires carry </span>${C.out.map(m_ => parityStr(m_, n)).join(' | ')}`;
        };
        body.append(h('div', { class: 'btns' }, btn('New random circuit', () => { seed++; run(); }, 'pri')), circ,
          h('div', { class: 'split' }, h('div', { class: 'stack' }, slider({ id: id('g'), label: 'Gates in the circuit', min: 8, max: 40, step: 1, value: ng, fmt: String, on: v => { ng = v; run(); } }), ro), tbl));
        run();
      }
    }
  },
  take: ['ZX diagrams are made of green (Z) and red (X) spiders with phases; only the connectivity of the graph matters.',
    'Same-colour spiders fuse by adding phases, Hadamards change colour, and the calculus is complete for Clifford+T.',
    'PyZX simplifies circuits by rewriting their ZX diagrams and extracting new circuits, reducing T counts substantially.',
    'Phase folding is the circuit-level view: CNOT + phase circuits are phase polynomials, and rotations on the same parity merge.'],
  quiz: QZ([
    ['What is a Z spider in the ZX-calculus?', ['A measurement', 'A node that leaves |0…0⟩ unchanged and multiplies |1…1⟩ by e^(iα), connecting its input and output wires', 'A two-qubit gate only', 'A classical bit'], 1, 'Spiders generalize Z rotations, copying in the computational basis.'],
    ['What does the spider-fusion rule say?', ['Spiders cannot touch', 'Two connected spiders of the same colour merge into one, with their phases added', 'Spiders change colour', 'Spiders disappear'], 1, 'Fusion is what lets distant phases combine.'],
    ['What does a Hadamard do to a spider?', ['Doubles its phase', 'Changes its colour, swapping the Z and X bases', 'Removes it', 'Nothing'], 1, 'H maps the computational basis to the |±⟩ basis.'],
    ['What does completeness of the ZX-calculus for Clifford+T mean?', ['It is fast', 'Any two diagrams representing the same linear map can be transformed into each other by the rules', 'It only works for Cliffords', 'Diagrams are unique'], 1, 'Jeandel, Perdrix and Vilmart proved completeness for this fragment in 2018.'],
    ['How does PyZX optimize circuits?', ['By random search', 'By converting to a ZX diagram, simplifying with rewrite rules such as local complementation and pivoting, and extracting a new circuit', 'By adding T gates', 'By measuring qubits'], 1, 'The extracted circuit implements the same unitary with fewer T gates.'],
    ['In a CNOT + phase-gate circuit, what does each wire carry at every moment?', ['A random value', 'A parity (XOR) of the input bits', 'The input bit only', 'A superposition of outputs'], 1, 'CNOTs update parities linearly; phase gates add phases to the current parity.'],
    ['Why can phase folding merge two T gates far apart in a circuit?', ['They commute with everything', 'If they act on wires carrying the same parity of the inputs, their phases add to one term of the phase polynomial', 'Because T² = S always nearby', 'It cannot'], 1, 'The phase polynomial only cares which parity receives which phase.'],
    ['After folding, which terms need a T gate?', ['All of them', 'Those whose total phase is an odd multiple of π/4', 'Those with phase π', 'None'], 1, 'Even multiples of π/4 are Clifford rotations (S, Z, S†).'],
    ['Why does T count matter so much for compilers?', ['T gates are slow to type', 'In fault-tolerant machines each T gate consumes an expensive magic state', 'T gates are not unitary', 'T gates cannot be simulated'], 1, 'Reducing T count directly reduces magic-state factory costs ([[L:magic]]).'],
    ['Besides T-count reduction, what is ZX used for?', ['Only drawing', 'Equivalence checking, designing lattice surgery and measurement-based protocols, and analysing fault-tolerant circuits', 'Replacing error correction', 'Generating random numbers'], 1, 'Its graphical rules make many structural arguments short.']
  ])
});

/* ---------- the software stack: from algorithm to pulses ---------- */
const TOF = [{ g: 'H', q: 2 }, { g: 'CX', c: 1, t: 2 }, { g: 'Tdg', q: 2 }, { g: 'CX', c: 0, t: 2 }, { g: 'T', q: 2 }, { g: 'CX', c: 1, t: 2 }, { g: 'Tdg', q: 2 }, { g: 'CX', c: 0, t: 2 }, { g: 'T', q: 1 }, { g: 'T', q: 2 }, { g: 'H', q: 2 }, { g: 'CX', c: 0, t: 1 }, { g: 'T', q: 0 }, { g: 'Tdg', q: 1 }, { g: 'CX', c: 0, t: 1 }];
function routeLine(gates, layout) {
  const pos = layout.slice(), out = []; /* pos[logical] = physical on a line 0–1–2 */
  const phys = g => g.g === 'CX' ? { g: 'CX', c: pos[g.c], t: pos[g.t] } : { g: g.g, q: pos[g.q] };
  for (const g of gates) { if (g.g === 'CX' && Math.abs(pos[g.c] - pos[g.t]) > 1) { const a = pos[g.c], mid = (pos[g.c] + pos[g.t]) / 2; const lo = pos.indexOf(mid); out.push({ g: 'SW', a, b: mid }); const tmp = pos[g.c]; pos[g.c] = mid; pos[lo] = tmp; } out.push(phys(g)); }
  return { out, final: pos };
}
function toNative(gates) { const o = []; const H = q => { o.push({ g: 'RZ', q, a: 'π/2' }, { g: 'SX', q }, { g: 'RZ', q, a: 'π/2' }); }; for (const g of gates) { if (g.g === 'H') H(g.q); else if (g.g === 'T') o.push({ g: 'RZ', q: g.q, a: 'π/4' }); else if (g.g === 'Tdg') o.push({ g: 'RZ', q: g.q, a: '−π/4' }); else if (g.g === 'CX') { H(g.t); o.push({ g: 'CZ', a: g.c, b: g.t }); H(g.t); } else if (g.g === 'SW') { for (const [c3, t] of [[g.a, g.b], [g.b, g.a], [g.a, g.b]]) { H(t); o.push({ g: 'CZ', a: c3, b: t }); H(t); } } } return o; }
function simplifyNative(gs) { const o = []; for (const g of gs) { const last = o[o.length - 1]; if (g.g === 'RZ' && last && last.g === 'RZ' && last.q === g.q) { last.a = last.a + ' + ' + g.a; last.merged = true; continue; } o.push(Object.assign({}, g)); } return o; }
const qasmOf = (gs, nm) => gs.map(g => g.g === 'CX' ? `cx q[${g.c}], q[${g.t}];` : g.g === 'CZ' ? `cz q[${g.a}], q[${g.b}];` : g.g === 'SW' ? `swap q[${g.a}], q[${g.b}];` : g.g === 'RZ' ? `rz(${g.a}) q[${g.q}];` : `${{ H: 'h', T: 't', Tdg: 'tdg', SX: 'sx' }[g.g]} q[${g.q}];`).join('\n');
LESSONS.push({
  id: 'stack', n: 34.1, stage: CMP, minutes: 14, title: 'The quantum software stack: from algorithm to pulses',
  lede: 'Between an algorithm on paper and microwaves in a cryostat sit half a dozen layers of software: languages, intermediate representations, optimizing passes, routing, native-gate translation and scheduling. Following one small program through all of them shows what each layer is for.',
  html: `
<h2>The layers</h2>
<ol>
<li><strong>Algorithm and SDK.</strong> Programs are written in Python frameworks (Qiskit, Cirq, PennyLane, CUDA-Q) or dedicated languages (Q#, Silq, Quipper) with high-level operations such as multi-controlled gates, arithmetic and Hamiltonian evolution.</li>
<li><strong>Intermediate representation.</strong> The program is lowered to a hardware-independent form. <strong>OpenQASM 3</strong> describes circuits with classical control flow, timing and calibrations; <strong>QIR</strong> builds on LLVM; MLIR-based dialects support whole-program optimization.</li>
<li><strong>Decomposition and optimization.</strong> High-level gates become a universal gate set, and passes cancel and merge gates ([[L:optimize]]), resynthesize rotations ([[L:synthesis]]) and fold phases ([[L:zx]]).</li>
<li><strong>Mapping and routing.</strong> Logical qubits are placed on physical ones and SWAPs are inserted where the chip lacks a connection ([[L:routing]]).</li>
<li><strong>Native translation.</strong> Every gate becomes the device’s calibrated operations, for example virtual RZ, √X and CZ or ECR.</li>
<li><strong>Scheduling and pulses.</strong> Operations are timed, crosstalk and idle periods are managed (dynamical decoupling inserts echo pulses on waiting qubits) and each gate becomes a calibrated waveform ([[L:pulses]]).</li>
</ol>
<p>Then the runtime executes the schedule many times, applies error mitigation ([[L:mitigation]]) and returns counts or expectation values. In error-corrected machines additional layers appear: logical compilation to lattice surgery ([[L:surgery]]), magic-state scheduling and a real-time decoder.</p>
${LAB('lower')}
<h2>Why so many layers?</h2>
<p>Each layer has its own cost model. Early stages minimize T count or logical depth; routing minimizes SWAPs on a particular coupling graph; native translation exploits free virtual Z gates; scheduling minimizes idle time and crosstalk. Separating them lets hardware vendors change the bottom of the stack without rewriting algorithms, and lets compiler research improve one layer at a time, though the best results increasingly come from passes that look across layers.</p>
`,
  labs: {
    lower: {
      title: 'One Toffoli through the stack',
      cap: 'A Toffoli gate on three logical qubits, compiled for a three-qubit chip wired in a line (0–1–2), whose native gates are virtual RZ rotations, √X (SX) pulses of 35 ns and CZ pulses of 200 ns. Step through the stages. Routing must bring qubits next to each other for every CNOT; this simple router swaps a control into the middle whenever its partner is two sites away, which here costs three SWAPs. The pulse view schedules every native operation as early as possible; RZ gates are virtual and take no time.',
      build(body, id) {
        let stage = 0;
        const dec = TOF, rt = routeLine(TOF, [0, 1, 2]), nat = simplifyNative(toNative(rt.out));
        const circ = h('div', { class: 'circ-wrap' }), code = h('div', { style: 'min-width:0;max-width:100%' }), cv = canvas('', 'height:170px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const cnt = gs => { const two = gs.filter(g => ['CX', 'CZ', 'SW'].includes(g.g)).length, t = gs.filter(g => g.g === 'T' || g.g === 'Tdg').length; return { two, t, n: gs.length }; };
        const sched = gs => { const free = [0, 0, 0], items = []; for (const g of gs) { if (g.g === 'RZ') { items.push({ q: g.q, t0: free[g.q], d: 0, g }); continue; } const qs = g.g === 'CZ' ? [g.a, g.b] : [g.q], d = g.g === 'CZ' ? 200 : 35, t0 = Math.max(...qs.map(q => free[q])); qs.forEach(q => { free[q] = t0 + d; }); items.push({ qs, t0, d, g }); } return { items, total: Math.max(...free) }; };
        const S = sched(nat);
        const q = painter(cv, ({ ctx, w, h: H }) => {
          if (stage !== 5) return; const T = Theme.get(), L0 = 40, R0 = w - 10, X = t => L0 + t / S.total * (R0 - L0), Y = q2 => 24 + q2 * (H - 50) / 2;
          for (let q2 = 0; q2 < 3; q2++) { ctx.strokeStyle = T.line; ctx.beginPath(); ctx.moveTo(L0, Y(q2)); ctx.lineTo(R0, Y(q2)); ctx.stroke(); txt(ctx, 'Q' + q2, 4, Y(q2), { align: 'left', font: '600 10.5px "JetBrains Mono",monospace' }); }
          for (const it of S.items) { if (it.d === 0) { ctx.strokeStyle = T.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(it.t0), Y(it.q) - 9); ctx.lineTo(X(it.t0), Y(it.q) + 9); ctx.stroke(); continue; }
            if (it.g.g === 'CZ') { const a = Math.min(...it.qs), b = Math.max(...it.qs); ctx.fillStyle = rgba(T.copper, .35); ctx.strokeStyle = T.copper; ctx.fillRect(X(it.t0), Y(a) - 8, X(it.t0 + it.d) - X(it.t0), Y(b) - Y(a) + 16); ctx.strokeRect(X(it.t0), Y(a) - 8, X(it.t0 + it.d) - X(it.t0), Y(b) - Y(a) + 16); }
            else { const x0 = X(it.t0), x1 = X(it.t0 + it.d), y = Y(it.qs[0]); ctx.fillStyle = T.cyan; ctx.beginPath(); ctx.moveTo(x0, y); for (let k = 0; k <= 20; k++) { const u = k / 20; ctx.lineTo(x0 + (x1 - x0) * u, y - 12 * Math.exp(-((u - .5) ** 2) / .03)); } ctx.lineTo(x1, y); ctx.closePath(); ctx.fill(); } }
          txt(ctx, `0 ns`, L0, H - 6, { align: 'left', font: '500 10px "JetBrains Mono",monospace' }); txt(ctx, `${S.total} ns`, R0, H - 6, { align: 'right', font: '500 10px "JetBrains Mono",monospace' });
        });
        const STG = [
          ['Algorithm', 'python · qiskit', `from qiskit import QuantumCircuit\nqc = QuantumCircuit(3)\nqc.ccx(0, 1, 2)   # flip qubit 2 if qubits 0 and 1 are both 1`, [[{ g: 'MCX', cs: [0, 1], t: 2 }]], { two: '1 (three-qubit)', t: '—', n: 1 }],
          ['OpenQASM 3', 'openqasm 3', `OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[3] q;\nccx q[0], q[1], q[2];`, [[{ g: 'MCX', cs: [0, 1], t: 2 }]], { two: '1 (three-qubit)', t: '—', n: 1 }],
          ['Decomposed', 'openqasm 3 · Clifford+T', qasmOf(dec), dec.map(g => [g]), cnt(dec)],
          ['Routed', 'openqasm 3 · line 0–1–2', qasmOf(rt.out), rt.out.map(g => [g]), cnt(rt.out)],
          ['Native gates', 'openqasm 3 · rz, sx, cz', qasmOf(nat), null, cnt(nat)],
          ['Pulses', 'schedule', `// ${S.items.filter(i => i.g.g === 'SX').length} SX pulses × 35 ns, ${S.items.filter(i => i.g.g === 'CZ').length} CZ pulses × 200 ns, ${S.items.filter(i => i.g.g === 'RZ').length} virtual RZ frame changes\n// total duration ${S.total} ns`, null, cnt(nat)]];
        const show = () => {
          const [nm, lang, src, draw, c3] = STG[stage]; circ.innerHTML = ''; circ.hidden = !draw; if (draw) circ.append(drawCircuit(3, draw, { cw: 40, labels: stage >= 3 ? ['Q0', 'Q1', 'Q2'] : ['q0', 'q1', 'q2'] }).svg);
          code.innerHTML = CODE(lang, src.split('\n').slice(0, 40).join('\n') + (src.split('\n').length > 40 ? `\n// … ${src.split('\n').length - 40} more lines` : '')); cv.hidden = stage !== 5; q.inv();
          ro.innerHTML = `<span class="k">stage </span>${stage + 1}. ${nm}<br><span class="k">operations </span>${c3.n} &nbsp; <span class="k">two-qubit gates </span>${c3.two} &nbsp; <span class="k">T gates </span>${c3.t}${stage === 3 ? `<br><span class="k">SWAPs inserted </span>${rt.out.filter(g => g.g === 'SW').length} &nbsp; <span class="k">final placement </span>${rt.final.map((p, l) => `q${l}→Q${p}`).join(', ')}` : ''}${stage >= 4 ? `<br><span class="k">schedule length </span>${S.total} ns` : ''}`;
        };
        body.append(h('div', { class: 'btns' }, seg(STG.map((s, i) => ({ v: i, label: `${i + 1}. ${s[0]}` })), stage, v => { stage = v; show(); }, 'Stage')), h('div', { class: 'split wide-l' }, h('div', { class: 'stack', style: 'min-width:0' }, circ, cv, code), ro));
        show();
      }
    }
  },
  take: ['A program passes through an SDK, an intermediate representation such as OpenQASM 3 or QIR, decomposition and optimization, routing, native translation and pulse scheduling.',
    'Each layer has its own cost model: T count and depth early, SWAPs during routing, calibrated native operations and timing at the bottom.',
    'A Toffoli becomes 6 CNOTs and 7 T gates; on a line it needs a SWAP; natively it becomes dozens of RZ, SX and CZ operations.',
    'Fault-tolerant machines add logical compilation, magic-state scheduling and real-time decoding layers.'],
  quiz: QZ([
    ['What is OpenQASM 3?', ['A quantum computer', 'An intermediate representation for circuits with classical control flow, timing and calibrations', 'A decoder', 'A cryptographic standard'], 1, 'It sits between high-level SDKs and hardware-specific compilation.'],
    ['What is QIR?', ['A qubit type', 'A quantum intermediate representation based on LLVM', 'A routing algorithm', 'A pulse shape'], 1, 'Building on LLVM lets quantum programs reuse classical compiler infrastructure.'],
    ['How many CNOTs and T gates does the standard Toffoli decomposition use?', ['1 and 1', '6 CNOTs and 7 T or T† gates', '3 and 3', '10 and 0'], 1, 'That decomposition is optimal in T count without ancillas.'],
    ['Why does routing insert SWAP gates?', ['To add entanglement', 'Two-qubit gates can only act on physically connected qubits, so states must be moved next to each other', 'To reduce T count', 'To measure qubits'], 1, 'Each SWAP costs three CNOTs, so placement matters.'],
    ['What are native gates?', ['Any gate', 'The operations the hardware implements directly with calibrated pulses, such as RZ, √X and CZ', 'Only T gates', 'Gates written in Python'], 1, 'Everything else must be translated into them.'],
    ['Why do RZ gates take no time on many superconducting devices?', ['They are skipped', 'They are virtual: implemented as phase shifts of later pulses', 'They are implemented in software after measurement', 'They are faster than light'], 1, 'Virtual Z gates are free and error-free ([[L:pulses]]).'],
    ['What does dynamical decoupling do during scheduling?', ['Speeds up gates', 'Inserts echo pulses on idle qubits to cancel slow noise', 'Removes measurements', 'Routes qubits'], 1, 'Idle qubits otherwise accumulate phase errors and crosstalk.'],
    ['In the lab, which stage first increases the two-qubit gate count beyond 6?', ['Decomposition', 'Routing, by adding SWAPs', 'Native translation', 'Pulses'], 1, 'SWAPs add two-qubit operations because the logical qubits that must interact are not always neighbours on the line.'],
    ['Why separate the stack into layers?', ['Tradition', 'Each layer has a distinct cost model, and separation lets hardware and algorithms evolve independently', 'Layers make code slower', 'It is required by physics'], 1, 'Cross-layer optimization is increasingly used, but the abstractions remain valuable.'],
    ['Which extra layer does a fault-tolerant machine need?', ['None', 'Logical compilation to lattice surgery, magic-state scheduling and a real-time decoder', 'A second SDK', 'Analog control only'], 1, 'Error correction adds its own compilation and control problems.']
  ])
});

/* ---------- distributed quantum computing: partitioning ---------- */
LESSONS.push({
  id: 'distributed', n: 35.9, stage: CMP, minutes: 14, title: 'Distributed and modular quantum computing',
  lede: 'No single chip or trap will hold millions of qubits. Linking modules with photons, and teleporting gates between them, turns many medium-sized processors into one machine. The price is entanglement, which must be generated, purified and spent.',
  html: `
<h2>Why modularity</h2>
<p>Every platform runs into limits on how many qubits one module can hold: wiring and refrigerator space for superconducting chips, mode crowding for ion chains ([[L:ions]]), field of view for atom arrays. Modular architectures connect several modules with <strong>quantum links</strong>, usually photons converted from or entangled with the stationary qubits, and treat the whole as one computer. Trapped-ion modules have been linked by photonic entanglement, and microwave or optical links between superconducting processors are an active research area.</p>
<h2>Teleporting gates</h2>
<p>A CNOT between qubits in different modules does not need the qubits to meet. Given one shared Bell pair (an <strong>ebit</strong>), local CNOTs and measurements on each side, and two classical bits of communication, the CNOT can be applied remotely (Eisert, Jacobs, Papadopoulos and Plenio, 2000). Teleporting a whole qubit across ([[L:teleportation]]) also costs one ebit. So the bill for a distributed computation is set by how many two-qubit gates cross module boundaries.</p>
${EQ('remote CNOT = 1 Bell pair + 2 local CNOTs + 2 measurements + 2 classical bits')}
<h2>Partitioning circuits</h2>
<p>Assigning qubits to modules to minimize crossing gates is graph partitioning of the circuit’s interaction graph, NP-hard in general but well served by heuristics such as Kernighan–Lin. Remote gates are slower and noisier than local ones, because link rates are typically thousands of ebits per second or less and raw link fidelities are lower than local gates, so links are buffered and purified ([[L:purification]]). Fault-tolerant designs aim to run error-corrected logical qubits within modules and use links for lattice surgery or teleportation between them, where the code can absorb lower-fidelity links. Without a quantum link, a circuit can instead be cut and its fragments run separately, at a sampling cost ([[L:cutting]]).</p>
${LAB('cut')}
`,
  labs: {
    cut: {
      title: 'Split a circuit between two modules',
      cap: 'Nodes are the 10 qubits of a circuit; edge thickness is the number of two-qubit gates between them. Click a qubit to move it between module A (copper) and module B (cyan); each module holds at most 6. Every gate that crosses between modules needs one Bell pair. The estimate multiplies a 99.9% local two-qubit gate fidelity by the chosen Bell-pair fidelity for every crossing gate, and divides crossing gates by the link rate for the time spent waiting on entanglement.',
      build(body, id) {
        let seed = 6, side = null, Fb = .98, rate = 1000, E = null;
        const n = 10, cv = canvas('sq', 'max-width:400px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const gen = () => { const r = rng(seed), W = new Map(); const add = (a, b) => { const k = Math.min(a, b) + ',' + Math.max(a, b); W.set(k, (W.get(k) || 0) + 1); }; for (let k = 0; k < 46; k++) { const cl = r() < .5 ? 0 : 1, base = cl ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4]; if (r() < .8) { const a = base[Math.floor(r() * 5)]; let b = base[Math.floor(r() * 5)]; if (a === b) continue; add(a, b); } else add(Math.floor(r() * 5), 5 + Math.floor(r() * 5)); } E = [...W.entries()].map(([k, w]) => { const [a, b] = k.split(',').map(Number); return { a, b, w }; }); const perm = shuffled([...Array(n).keys()], r); side = perm.map((p, i) => p < 5 ? 0 : 1); };
        const cut = s => E.reduce((t, e) => t + (s[e.a] !== s[e.b] ? e.w : 0), 0), tot = () => E.reduce((t, e) => t + e.w, 0);
        const opt = () => { let improved = true; while (improved) { improved = false; let best = 0, bi = -1, bj = -1; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (side[i] !== 0 || side[j] !== 1) continue; const s = side.slice(); s[i] = 1; s[j] = 0; const d = cut(side) - cut(s); if (d > best) { best = d; bi = i; bj = j; } } if (bi >= 0) { side[bi] = 1; side[bj] = 0; improved = true; } } upd(); };
        const pos = (i, w, H) => { const a = -PI / 2 + TAU * i / n, R = Math.min(w, H) / 2 - 30; return [w / 2 + R * Math.cos(a), H / 2 + R * Math.sin(a)]; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!E) return; const T = Theme.get();
          for (const e of E) { const [x1, y1] = pos(e.a, w, H), [x2, y2] = pos(e.b, w, H), cross = side[e.a] !== side[e.b]; ctx.strokeStyle = cross ? T.bad : T.muted; ctx.globalAlpha = cross ? .9 : .45; ctx.lineWidth = 1 + 1.6 * e.w; if (cross) ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); }
          ctx.globalAlpha = 1; for (let i = 0; i < n; i++) { const [x, y] = pos(i, w, H); dot(ctx, x, y, 15, side[i] ? T.cyan : T.copper, T.surface); txt(ctx, 'q' + i, x, y + .5, { font: '600 11px "JetBrains Mono",monospace', color: T.surface }); }
        });
        dragHandles(cv, (x, y) => { const r = cv.getBoundingClientRect(); for (let i = 0; i < n; i++) { const [px, py] = pos(i, r.width, r.height); if (Math.hypot(px - x, py - y) < 18) { const to = 1 - side[i]; if (side.filter(s => s === to).length < 6) { side[i] = to; upd(); } return null; } } return null; }, () => {});
        const upd = () => { p.inv(); const c3 = cut(side), T_ = tot(), F = Math.pow(.999, T_ - c3) * Math.pow(Fb, c3); ro.innerHTML = `<span class="k">two-qubit gates </span>${T_} &nbsp; <span class="k">crossing modules </span>${c3}<br><span class="k">Bell pairs needed </span>${c3} &nbsp; <span class="k">waiting for entanglement </span>${num(c3 / rate * 1000, 1)} ms<br><span class="k">estimated circuit fidelity </span>${pct(F, 1)}<br><span class="k">module sizes </span>A ${side.filter(s => !s).length}, B ${side.filter(s => s).length}`; };
        body.append(h('div', { class: 'btns' }, btn('Optimize (pair swaps)', opt, 'pri'), btn('New circuit', () => { seed++; gen(); upd(); }, 'sm')),
          h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, slider({ id: id('f'), label: 'Bell-pair fidelity', min: .9, max: .999, step: .001, value: Fb, fmt: v => pct(v, 1), on: v => { Fb = v; upd(); } }),
            slider({ id: id('r'), label: 'Link rate (Bell pairs per second)', min: 1, max: 5, step: .1, value: Math.log10(rate), fmt: v => Math.round(10 ** v).toLocaleString('en-US'), on: v => { rate = 10 ** v; upd(); } }), ro, legendRow([['local gates', 'var(--muted)'], ['crossing gates', 'var(--bad)', 1]]))));
        gen(); upd();
      }
    }
  },
  take: ['Module size is limited on every platform, so large machines will link modules with quantum interconnects.',
    'A remote CNOT costs one Bell pair, local operations, measurements and two classical bits; teleporting a qubit also costs one ebit.',
    'Partitioning qubits to minimize crossing gates is graph partitioning; heuristics such as Kernighan–Lin work well.',
    'Links are slower and noisier than local gates, so entanglement is buffered and purified, and fault-tolerant designs keep logical qubits within modules.'],
  quiz: QZ([
    ['Why will large quantum computers likely be modular?', ['Modules are cheaper to name', 'Every platform limits how many qubits one module can hold, through wiring, mode crowding, field of view or refrigerator space', 'Because entanglement only works in small systems', 'For marketing'], 1, 'Linking modules sidesteps these single-module limits.'],
    ['What resources does a remote CNOT consume?', ['A SWAP gate', 'One Bell pair, local gates and measurements, and two classical bits', 'Three Bell pairs', 'Nothing'], 1, 'This gate teleportation protocol was described by Eisert and colleagues in 2000.'],
    ['What determines the entanglement cost of a distributed computation?', ['The number of single-qubit gates', 'The number of two-qubit gates crossing module boundaries (or qubits teleported)', 'The number of measurements', 'The depth only'], 1, 'Each crossing gate needs one ebit, so the cut size of the interaction graph sets the entanglement bill.'],
    ['What kind of problem is assigning qubits to modules?', ['Sorting', 'Graph partitioning of the interaction graph, NP-hard in general', 'Linear regression', 'Factoring'], 1, 'Heuristics like Kernighan–Lin find good partitions quickly.'],
    ['Why are remote gates more costly than local ones?', ['They are not', 'Entanglement generation is slow and raw link fidelity is lower than local gate fidelity', 'They need more qubits locally', 'They require error-free hardware'], 1, 'Link rates are often well below local gate rates.'],
    ['How can low-fidelity Bell pairs be improved?', ['By measuring them twice', 'By entanglement purification, which distils fewer high-fidelity pairs from many noisy ones', 'By cloning', 'By cooling'], 1, 'Purification trades rate for fidelity ([[L:purification]]).'],
    ['In the lab, why does the optimizer only swap pairs of qubits?', ['To save time', 'Swapping keeps module sizes balanced within capacity while reducing crossing gates', 'Because single moves are illegal physics', 'It moves all qubits'], 1, 'Kernighan–Lin-style swaps respect module capacities.'],
    ['How do fault-tolerant modular designs use links?', ['For every physical gate', 'For logical operations such as lattice surgery or teleportation between error-corrected modules, where the code tolerates noisier links', 'Not at all', 'Only for readout'], 1, 'Keeping logical qubits inside modules limits traffic on the links.'],
    ['Which platform has demonstrated photonic links between modules?', ['None', 'Trapped ions, among others', 'Only classical computers', 'Only annealers'], 1, 'Remote entanglement of ions in separate traps has been shown repeatedly.'],
    ['What does teleporting a qubit between modules cost?', ['Three ebits', 'One ebit plus two classical bits', 'Nothing', 'A SWAP gate'], 1, 'Teleportation consumes one Bell pair and two bits of communication ([[L:teleportation]]).']
  ])
});

/* ---------- quantum metrology ---------- */
LESSONS.push({
  id: 'metrology', n: 38.25, stage: QIT, minutes: 14, title: 'Quantum metrology and the Heisenberg limit',
  lede: 'Entangled probes can measure a phase faster than independent ones, beating the standard quantum limit that applies to N separate particles. Gravitational-wave detectors already use quantum tricks, and atomic clocks push them hard. Noise sets strict limits on the gain.',
  html: `
<h2>Measuring a phase</h2>
<p>Many precision measurements reduce to estimating a phase ${m('φ')} picked up by a probe: an atom’s spin precessing in a magnetic field, the arms of an interferometer, a clock transition relative to a laser. With ${m('N')} independent probes, each measured once, the errors average down as</p>
${EQ('Δφ<sub>SQL</sub> = 1/√N &nbsp;&nbsp; (standard quantum limit) &nbsp;&nbsp; versus &nbsp;&nbsp; Δφ<sub>HL</sub> = 1/N &nbsp;&nbsp; (Heisenberg limit)')}
<p>The <strong>Heisenberg limit</strong> is the best quantum mechanics allows for ${m('N')} probes, and it can be reached with entanglement. A GHZ state ([[L:ghz]]) ${m('(|0…0⟩ + |1…1⟩)/√2')} picks up the phase ${m('Nφ')}, so its interference fringe oscillates ${m('N')} times faster and a single measurement is ${m('N')} times as sensitive to small changes. The quantum Cramér–Rao bound ${m('Δφ ≥ 1/√(ν F<sub>Q</sub>)')}, in terms of the quantum Fisher information ${m('F<sub>Q</sub>')} and ${m('ν')} repetitions, makes both limits precise: ${m('F<sub>Q</sub> = N')} for independent probes and ${m('N²')} for the GHZ state.</p>
${LAB('fringe')}
<h2>Noise takes most of it back</h2>
<p>The GHZ state is also ${m('N')} times as fragile: dephasing at rate ${m('γ')} per particle destroys its coherence at rate ${m('Nγ')}. Huelga and colleagues showed in 1997 that, when the total measurement time is fixed and each particle dephases independently, an optimally used GHZ state gives exactly the same precision as independent particles. More general results (Escher, de Matos Filho and Davidovich; Demkowicz-Dobrzański, Kołodyński and Guţă, 2011–2012) show that for most noise models the quantum gain shrinks to a constant factor at large ${m('N')}. Error-correction-inspired schemes can recover Heisenberg scaling only when the noise has the right structure relative to the signal.</p>
<h2>Where it is used</h2>
<ul>
<li><strong>Gravitational-wave detectors.</strong> LIGO and Virgo inject <strong>squeezed light</strong>, which reduces quantum noise in one quadrature, into their interferometers, improving sensitivity and the rate of detected events.</li>
<li><strong>Atomic clocks and magnetometers.</strong> Spin-squeezed and entangled atomic states have improved clock stability beyond the standard quantum limit in laboratory demonstrations.</li>
<li><strong>Quantum sensing</strong> more broadly uses single spins such as nitrogen-vacancy centres in diamond for nanoscale magnetic imaging, where the gain comes from small size and long coherence rather than entanglement.</li>
</ul>
`,
  labs: {
    fringe: {
      title: 'Entangled probes and the cost of noise',
      cap: 'Left: Ramsey fringe P(φ) for a single qubit and for an N-qubit GHZ state with contrast reduced by dephasing during the interrogation time. Right: frequency uncertainty after a fixed total time T, for N independent qubits and for a GHZ state, each with the best interrogation time t ≤ T. Without noise the GHZ state follows the Heisenberg 1/N line; with dephasing rate γ the two strategies converge once Nγ T is large, as Huelga and colleagues showed.',
      build(body, id) {
        let N = 8, lgG = -2;
        const c1 = canvas('', 'height:230px'), c2 = canvas('', 'height:230px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const best = (n, g, ghz) => { let bv = Infinity, bt = 1; for (let k = 0; k <= 400; k++) { const t = Math.pow(10, -4 + 4 * k / 400); const v = ghz ? Math.exp(n * g * t) / (n * Math.sqrt(t)) : Math.exp(g * t) / Math.sqrt(n * t); if (v < bv) { bv = v; bt = t; } } return [bv, bt]; };
        const q1 = painter(c1, ({ ctx, w, h: H }) => { const T = Theme.get(), g = 10 ** lgG, [, tg] = best(N, g, true), A = axes(ctx, w, H, { x: [-PI, PI], y: [0, 1], xt: [-PI, 0, PI], xf: v => v < -1 ? '−π' : v > 1 ? 'π' : '0', yt: [0, .5, 1], xl: 'phase φ per qubit', yl: 'P(0)' }); const a = [], b = []; const cg = Math.exp(-N * g * tg); for (let f = -PI; f <= PI + 1e-9; f += .01) { a.push([A.X(f), A.Y((1 + Math.cos(f)) / 2)]); b.push([A.X(f), A.Y((1 + cg * Math.cos(N * f)) / 2)]); } polyline(ctx, a, T.muted, 2); polyline(ctx, b, T.cyan, 2); });
        const q2 = painter(c2, ({ ctx, w, h: H }) => { const T = Theme.get(), g = 10 ** lgG, A = axes(ctx, w, H, { x: [1, 1000], y: [1e-3, 2], xlog: true, ylog: true, xt: [1, 10, 100, 1000], yt: [1e-3, 1e-2, .1, 1], yf: v => String(v), xl: 'number of qubits N', yl: 'frequency uncertainty' }); const si = [], gh = [], hl = [], sq = []; for (let e = 0; e <= 3.001; e += .03) { const n = 10 ** e; si.push([A.X(n), A.Y(best(n, g, false)[0])]); gh.push([A.X(n), A.Y(best(n, g, true)[0])]); hl.push([A.X(n), A.Y(1 / n)]); sq.push([A.X(n), A.Y(1 / Math.sqrt(n))]); } polyline(ctx, sq, T.muted, 1.2, [3, 3]); polyline(ctx, hl, T.ink, 1.2, [3, 3]); polyline(ctx, si, T.copper, 2.4); polyline(ctx, gh, T.cyan, 2.4); dot(ctx, A.X(N), A.Y(best(N, g, true)[0]), 6, T.cyan, T.surface); });
        const upd = () => { q1.inv(); q2.inv(); const g = 10 ** lgG, [vi] = best(N, g, false), [vg, tg] = best(N, g, true); ro.innerHTML = `<span class="k">N = ${N}, γT = ${num(g, 4)}</span><br><span class="k">independent qubits </span>${sci(vi)} &nbsp; <span class="k">GHZ </span>${sci(vg)}<br><span class="k">GHZ gain </span>×${num(vi / vg, 2)} <span class="k">(noiseless ideal ×${num(Math.sqrt(N), 2)})</span><br><span class="k">best GHZ interrogation time </span>${num(tg, 3)} T`; };
        body.append(h('div', { class: 'split even' }, h('div', { class: 'stack' }, c1, legendRow([['one qubit', 'var(--muted)'], [`GHZ, N qubits`, 'var(--cyan)']])), h('div', { class: 'stack' }, c2, legendRow([['independent', 'var(--copper)'], ['GHZ', 'var(--cyan)'], ['1/√N', 'var(--muted)', 1], ['1/N', 'var(--ink)', 1]]))),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, slider({ id: id('n'), label: 'Number of qubits N', min: 1, max: 40, step: 1, value: N, fmt: String, on: v => { N = v; upd(); } }), slider({ id: id('g'), label: 'Dephasing rate × total time (γT)', min: -4, max: 1, step: .1, value: lgG, fmt: v => num(10 ** v, 4), on: v => { lgG = v; upd(); } })), ro));
        upd();
      }
    }
  },
  take: ['N independent probes estimate a phase with error 1/√N (standard quantum limit); entangled probes can reach 1/N (Heisenberg limit).',
    'A GHZ state accumulates phase Nφ, so its fringe oscillates N times faster; the quantum Fisher information is N² instead of N.',
    'GHZ states dephase N times faster; with independent dephasing and fixed total time the advantage vanishes, and most noise reduces it to a constant factor.',
    'Squeezed light improves gravitational-wave detectors, and entangled atoms improve clocks and magnetometers.'],
  quiz: QZ([
    ['What is the standard quantum limit for N independent probes?', ['Δφ ∝ 1/N', 'Δφ ∝ 1/√N', 'Δφ ∝ 1/N²', 'Δφ independent of N'], 1, 'Independent errors average down as the square root of the number of probes.'],
    ['What is the Heisenberg limit?', ['Δφ ∝ 1/√N', 'Δφ ∝ 1/N, the best quantum mechanics allows with N probes', 'Δφ = 0', 'Δφ ∝ N'], 1, 'It requires quantum correlations between the probes.'],
    ['Why is a GHZ state more sensitive to a phase?', ['It has more energy', 'Its two branches differ by N excitations, so it accumulates phase Nφ and its fringe oscillates N times faster', 'It is classical', 'It never decoheres'], 1, 'Faster fringes give a larger slope, hence more sensitivity per measurement.'],
    ['What is the quantum Fisher information of an N-qubit GHZ state for this phase?', ['N', 'N²', '√N', '1'], 1, 'Independent qubits give N; the GHZ state reaches N², saturating the Heisenberg bound.'],
    ['Why are GHZ states fragile?', ['They are not', 'Independent dephasing of each qubit destroys their coherence N times faster', 'They have no phase', 'They require photons'], 1, 'The coherence between |0…0⟩ and |1…1⟩ decays as e^(−Nγt).'],
    ['What did Huelga and colleagues show in 1997?', ['GHZ states always win', 'With independent dephasing and fixed total time, optimally used GHZ states give the same precision as independent particles', 'Squeezing is impossible', 'Clocks cannot be improved'], 1, 'Shorter optimal interrogation times exactly cancel the GHZ advantage in that model.'],
    ['What do general noisy-metrology bounds show for most noise models?', ['Exponential gains', 'The quantum advantage shrinks to a constant factor at large N', 'No advantage at all ever', 'Heisenberg scaling always'], 1, 'Results by Escher et al. and Demkowicz-Dobrzański et al. bound the asymptotic gain.'],
    ['How do gravitational-wave detectors use quantum metrology?', ['With GHZ states of mirrors', 'By injecting squeezed light to reduce quantum noise in the measured quadrature', 'By cooling the Earth', 'By error correction'], 1, 'Squeezing has increased the detection range of LIGO and Virgo.'],
    ['In the lab, why does the GHZ fringe lose contrast?', ['Measurement error', 'Dephasing during the interrogation time reduces its contrast by e^(−Nγt)', 'Because N is too small', 'It does not'], 1, 'Contrast loss is the price of the faster fringe.'],
    ['Where does the advantage of NV-centre sensors mainly come from?', ['Entanglement of many centres', 'The small size and long coherence of a single spin, enabling nanoscale sensing', 'Squeezed light', 'Superconductivity'], 1, 'Not every quantum sensor relies on entanglement; spatial resolution is the key there.']
  ])
});

/* ---------- blind quantum computing ---------- */
LESSONS.push({
  id: 'blind', n: 38.7, stage: QIT, minutes: 13, title: 'Blind and verifiable quantum computing',
  lede: 'Suppose the only quantum computer is in someone else’s data centre. Can you use it without revealing your input, your algorithm or your output, and can you check that it computed correctly? With a little quantum power on your side, yes.',
  html: `
<h2>Delegating computation privately</h2>
<p>In <strong>universal blind quantum computation</strong> (Broadbent, Fitzsimons and Kashefi, 2009), a client who can only prepare single qubits delegates a computation to a server with a full quantum computer. The protocol uses measurement-based quantum computing: the server builds a large entangled “brickwork” state from the client’s qubits and measures each qubit at an angle the client tells it. The measurement-based model it relies on is explained in [[L:mbqc]].</p>
<p>The trick is one-time padding of the angles. The client sends each qubit as ${m('|+<sub>θ</sub>⟩ = (|0⟩ + e<sup>iθ</sup>|1⟩)/√2')} with a secret random ${m('θ ∈ {0, π/4, …, 7π/4}')}. To have the server measure at the angle ${m('φ')} her computation needs, she instead announces</p>
${EQ('δ = φ + θ + rπ &nbsp; (mod 2π), &nbsp;&nbsp; θ and r ∈ {0, 1} secret and random')}
<p>The θ inside the qubit cancels the θ in δ, so the measurement acts as if made at ${m('φ')}, while the random ${m('rπ')} flips the outcome, which the client undoes. From the server’s side, δ is uniformly random whatever ${m('φ')} is, and every outcome is a random bit: it learns the size of the computation and nothing else.</p>
${LAB('pad')}
<h2>Verification</h2>
<p>Blindness also enables verification. The client hides <strong>trap qubits</strong>, whose measurement results she can predict, among the computation qubits. A server that deviates from the protocol cannot tell traps from real qubits, so any cheating risks being caught; repeating or error-correcting the computation makes undetected cheating exponentially unlikely (Fitzsimons and Kashefi, 2017). Remarkably, Mahadev (2018) showed that a purely classical client can verify a quantum computation, assuming the post-quantum hardness of learning with errors ([[L:pqc]]), though with large overheads. Blind protocols have been demonstrated with photons and trapped ions, and they are a likely component of a future quantum internet ([[L:swapping]]).</p>
`,
  labs: {
    pad: {
      title: 'What the server sees',
      cap: 'The client wants one qubit measured at angle φ (a step of a measurement-based computation; the correct answer is 0 with probability cos²(φ/2)). Each round she picks secret θ and r, sends |+_θ⟩ and announces δ = φ + θ + rπ. Left: histogram of the angles δ the server sees. Middle: the raw outcomes the server sees. Right: the client’s decoded outcomes (raw outcome XOR r), which follow cos²(φ/2). Switch off the padding to see how much the server would learn.',
      build(body, id) {
        let phi = 2, pad = true, dh = new Array(8).fill(0), raw = [0, 0], dec = [0, 0];
        const c1 = canvas('', 'height:190px'), c2 = canvas('', 'height:190px'), c3 = canvas('', 'height:190px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const runN = k => { for (let i = 0; i < k; i++) { const th = pad ? Math.floor(Math.random() * 8) : 0, r = pad ? (Math.random() < .5 ? 1 : 0) : 0, d = (phi + th + 4 * r) % 8; dh[d]++; const p0 = Math.cos((d - th) * PI / 8) ** 2, b = Math.random() < p0 ? 0 : 1; raw[b]++; dec[b ^ r]++; } inv(); };
        const reset = () => { dh.fill(0); raw = [0, 0]; dec = [0, 0]; runN(400); };
        const bars = (cv_, vals, labels, col, title) => painter(cv_, ({ ctx, w, h: H }) => { const T = Theme.get(), v = vals(), tot = v.reduce((a, b) => a + b, 0) || 1, A = axes(ctx, w, H, { x: [-.5, v.length - .5], y: [0, 1], xt: v.map((_, i) => i), xf: i => labels[i], yt: [0, .5, 1], xl: '', yl: title, pad: { b: 26 } }), bw = (A.X(1) - A.X(0)) * .7; v.forEach((c4, i) => { ctx.fillStyle = T[col]; ctx.fillRect(A.X(i) - bw / 2, A.Y(c4 / tot), bw, A.B - A.Y(c4 / tot)); }); });
        const q1 = bars(c1, () => dh, ['0', 'π/4', 'π/2', '3π/4', 'π', '5π/4', '3π/2', '7π/4'], 'muted', 'server sees δ'), q2 = bars(c2, () => raw, ['0', '1'], 'muted', 'server sees outcome'), q3 = bars(c3, () => dec, ['0', '1'], 'cyan', 'client decodes');
        const inv = () => { q1.inv(); q2.inv(); q3.inv(); const tot = dec[0] + dec[1]; ro.innerHTML = `<span class="k">client’s angle φ </span>${['0', 'π/4', 'π/2', '3π/4', 'π', '5π/4', '3π/2', '7π/4'][phi]} &nbsp; <span class="k">rounds </span>${tot}<br><span class="k">client’s P(0) </span>${pct(dec[0] / tot, 1)} <span class="k">(expected ${pct(Math.cos(phi * PI / 8) ** 2, 1)})</span><br><span class="k">server’s P(0) </span>${pct(raw[0] / tot, 1)}${pad ? ' <span class="k">(always about 50%)</span>' : ''}`; };
        body.append(h('div', { class: 'btns' }, seg([{ v: true, label: 'Blind (θ and r random)' }, { v: false, label: 'Not blind' }], pad, v => { pad = v; reset(); }, 'Padding'), btn('400 more rounds', () => runN(400), 'sm')),
          h('div', { class: 'split even' }, c1, h('div', { class: 'split even' }, c2, c3)), h('div', { class: 'split' }, slider({ id: id('p'), label: 'Client’s secret measurement angle φ', min: 0, max: 7, step: 1, value: phi, fmt: v => ['0', 'π/4', 'π/2', '3π/4', 'π', '5π/4', '3π/2', '7π/4'][v], on: v => { phi = v; reset(); } }), ro));
        reset();
      }
    }
  },
  take: ['Blind quantum computing lets a client with single-qubit preparation delegate a computation while hiding input, algorithm and output.',
    'Measurement angles are one-time padded: δ = φ + θ + rπ is uniformly random for the server, and outcomes are flipped by the secret r.',
    'Hidden trap qubits make the protocol verifiable: a cheating server cannot avoid them and is caught with high probability.',
    'Mahadev showed classical verification is possible under the hardness of LWE, at large cost; blind protocols suit a future quantum internet.'],
  quiz: QZ([
    ['What does the client need in the Broadbent–Fitzsimons–Kashefi protocol?', ['A full quantum computer', 'Only the ability to prepare single qubits in rotated states and send them, plus classical computation', 'Nothing quantum at all', 'Entangled photons from a satellite'], 1, 'The server does all the entangling operations.'],
    ['Which model of quantum computation does blind computing use?', ['The circuit model only', 'Measurement-based quantum computing on an entangled brickwork state', 'Adiabatic computing', 'Annealing'], 1, 'Computation is driven by a sequence of single-qubit measurement angles.'],
    ['Why is the announced angle δ uninformative to the server?', ['It is encrypted with RSA', 'It includes a secret uniformly random θ (and rπ), so δ is uniform whatever the true angle φ', 'It is always zero', 'The server cannot read numbers'], 1, 'This is a one-time pad over the eight allowed angles.'],
    ['Why does the qubit sent by the client cancel θ?', ['It does not', 'The client prepared it as |+_θ⟩, so measuring at δ acts like measuring |+⟩ at φ + rπ', 'Because θ is zero', 'Because of decoherence'], 1, 'The rotation hidden in the state and the rotation in the angle offset each other.'],
    ['What is the role of the random bit r?', ['None', 'It flips the measurement outcome, hiding the result from the server; the client undoes it', 'It selects the qubit', 'It sets the computation size'], 1, 'Outcomes seen by the server are uniformly random bits.'],
    ['What does the server learn in blind computing?', ['The input', 'Essentially only the size of the computation', 'The algorithm', 'The output'], 1, 'Everything else is hidden information-theoretically.'],
    ['How does verification work?', ['By trusting the server', 'Trap qubits with predictable outcomes are hidden among computation qubits; deviations are detected with high probability', 'By repeating on a classical computer', 'It is impossible'], 1, 'Blindness prevents the server from knowing which qubits are traps.'],
    ['What did Mahadev show in 2018?', ['Verification needs a quantum client', 'A purely classical client can verify a quantum computation, assuming learning with errors is hard for quantum computers', 'Blind computing is impossible', 'Traps are unnecessary'], 1, 'It uses post-quantum cryptography to force the server to commit to its state.'],
    ['In the lab, what happens without padding?', ['Nothing changes', 'The server sees δ = φ every time and its outcome statistics reveal cos²(φ/2)', 'The client loses the answer', 'The qubit is destroyed'], 1, 'Without the pad the measurement angles and results leak.'],
    ['Why is blind computing relevant to a quantum internet?', ['It replaces fibres', 'Clients will access remote quantum computers over networks and may need privacy and verification', 'It speeds up classical networks', 'It removes the need for entanglement'], 1, 'Delegated, private quantum computation is a flagship network application.']
  ])
});

/* ---------- quantum money ---------- */
LESSONS.push({
  id: 'money', n: 38.75, stage: QIT, minutes: 13, title: 'Quantum money',
  lede: 'The first idea in quantum cryptography was not key distribution but money that cannot be forged. Its security comes straight from the no-cloning theorem, and the open problem of making it publicly verifiable is still one of the field’s big challenges.',
  html: `
<h2>Wiesner’s banknotes</h2>
<p>Stephen Wiesner wrote around 1970, and published in 1983, a proposal for <strong>quantum money</strong>. Each banknote carries a serial number and ${m('n')} qubits, each prepared in one of the four BB84 states ${m('|0⟩, |1⟩, |+⟩, |−⟩')} at random. Only the bank knows, for each serial number, which states were used. To verify a note, the bank measures each qubit in the correct basis and checks the results; a genuine note always passes.</p>
<p>A counterfeiter who wants two notes that both pass must, in effect, clone unknown BB84 states, which the no-cloning theorem ([[L:cloning]]) forbids. The best attack, found by Molina, Vidick and Watrous (2012), succeeds on each qubit with probability exactly ${m('3/4')}, so a forged pair of ${m('n')}-qubit notes passes with probability ${m('(3/4)ⁿ')}: about ${m('10⁻¹³')} for ${m('n = 100')}. Simply measuring each qubit in a random basis and re-preparing two copies does worse, ${m('5/8')} per qubit.</p>
${LAB('note')}
<h2>Pitfalls and public keys</h2>
<ul>
<li><strong>Returning the note.</strong> If the bank hands back a failed note or tells the counterfeiter which qubits failed, repeated queries can reveal the secret states (an adaptive attack based on the bomb-tester idea). Notes must be destroyed or re-minted after failing.</li>
<li><strong>The bank must verify.</strong> Wiesner’s money is private-key: only the bank can check it. <strong>Public-key quantum money</strong>, which anyone can verify but nobody can copy, needs computational assumptions, and several proposed schemes have been broken. Constructions based on quantum lightning, knots and group actions, and recent lattice-based ideas, remain under study; Zhandry (2019) connected the problem to deep questions in cryptography.</li>
<li><strong>Legacy.</strong> Wiesner’s conjugate coding inspired Bennett and Brassard’s BB84 protocol ([[L:bb84]]), and its descendants include quantum tokens, one-shot signatures and copy-protected software.</li>
</ul>
`,
  labs: {
    note: {
      title: 'Try to forge a quantum banknote',
      cap: 'A note of n qubits, each a secret BB84 state. A forger tries to turn one note into two, then the bank checks both. Honest notes always pass. The measure-and-prepare forger guesses a basis for each qubit (right half the time; when wrong, each copy passes with probability ½), so both copies pass a qubit with probability 5/8; the optimal forger reaches 3/4. Every qubit must pass, so success falls exponentially with n.',
      build(body, id) {
        let n = 12, strat = 'mp', tries = 0, wins = 0, last = null, secret = null;
        const cv = canvas('', 'height:150px'), cc = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const SYM = ['0', '1', '+', '−'];
        const mint = () => { secret = [...Array(n)].map(() => Math.floor(Math.random() * 4)); tries = 0; wins = 0; last = null; q.inv(); qc.inv(); text(); };
        const attempt = k => { for (let i = 0; i < k; i++) { const fails = [[], []]; secret.forEach((s, j) => { if (strat === 'mp') { const right = Math.random() < .5; if (!right) { if (Math.random() < .5) fails[0].push(j); if (Math.random() < .5) fails[1].push(j); } } else { if (Math.random() > .75) fails[Math.random() < .5 ? 0 : 1].push(j); } }); const ok = !fails[0].length && !fails[1].length; tries++; if (ok) wins++; last = fails; } q.inv(); text(); };
        const per = () => strat === 'mp' ? 5 / 8 : 3 / 4;
        const q = painter(cv, ({ ctx, w, h: H }) => { if (!secret) return; const T = Theme.get(), cs = Math.min(36, (w - 120) / n - 4); for (let row = 0; row < 2; row++) { const y = 20 + row * (cs + 30); txt(ctx, `copy ${row + 1}`, 0, y + cs / 2, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace' }); secret.forEach((s, j) => { const x = 70 + j * (cs + 4), bad = last && last[row].includes(j); ctx.fillStyle = bad ? T.bad : s < 2 ? rgba(T.copper, .25) : rgba(T.cyan, .25); ctx.fillRect(x, y, cs, cs); ctx.strokeStyle = T.ink; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, cs - 1, cs - 1); txt(ctx, SYM[s], x + cs / 2, y + cs / 2 + .5, { font: MATHFONT(Math.min(16, cs * .5)), color: bad ? T.surface : T.ink }); }); } });
        const qc = painter(cc, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 40], y: [1e-8, 1], ylog: true, xt: [1, 10, 20, 30, 40], yt: [1e-8, 1e-6, 1e-4, 1e-2, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'qubits per note n', yl: 'forgery succeeds' }); for (const [pp, col] of [[5 / 8, T.copper], [3 / 4, T.cyan]]) { const pts = []; for (let k = 1; k <= 40; k++) pts.push([A.X(k), A.Y(Math.max(1e-8, pp ** k))]); polyline(ctx, pts, col, 2.2); } dot(ctx, A.X(n), A.Y(Math.max(1e-8, per() ** n)), 6, T.ink, T.surface); });
        const text = () => { ro.innerHTML = `<span class="k">attempts </span>${tries} &nbsp; <span class="k">successful forgeries </span>${wins}<br><span class="k">predicted success </span>(${strat === 'mp' ? '5/8' : '3/4'})${sup(n)} = ${sci(per() ** n)}<br>${last ? (last[0].length || last[1].length ? `<span class="k">last attempt caught on </span>${last[0].length + last[1].length} qubit check${last[0].length + last[1].length > 1 ? 's' : ''}` : '<span style="color:var(--bad)">last attempt passed!</span>') : '<span class="k">press Forge</span>'}`; };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'mp', label: 'Measure and re-prepare (5/8)' }, { v: 'opt', label: 'Optimal attack (3/4)' }], strat, v => { strat = v; tries = 0; wins = 0; last = null; q.inv(); qc.inv(); text(); }, 'Forger'), btn('Forge once', () => attempt(1), 'pri'), btn('Forge 1,000 times', () => attempt(1000), 'sm'), btn('New note', mint, 'sm')),
          cv, h('div', { class: 'split' }, h('div', { class: 'stack' }, cc, legendRow([['measure and re-prepare', 'var(--copper)'], ['optimal attack', 'var(--cyan)']])), h('div', { class: 'stack' }, slider({ id: id('n'), label: 'Qubits per note n', min: 2, max: 20, step: 1, value: n, fmt: String, on: v => { n = v; mint(); } }), ro)));
        mint();
      }
    }
  },
  take: ['Wiesner’s quantum money stores random BB84 states on a note; the bank, knowing them, verifies by measuring in the right bases.',
    'Forging requires cloning unknown states; the optimal attack passes each qubit with probability 3/4, so forgery succeeds with (3/4)ⁿ.',
    'Failed notes must not be returned, or adaptive attacks reveal the secret; and only the bank can verify.',
    'Public-key quantum money remains an open problem; Wiesner’s idea inspired BB84 and many later primitives.'],
  quiz: QZ([
    ['What does each qubit on a Wiesner banknote hold?', ['A random computational state only', 'One of the four BB84 states |0⟩, |1⟩, |+⟩, |−⟩, chosen at random and recorded by the bank', 'An entangled pair', 'A classical bit'], 1, 'The bank keeps the list of bases and values for each serial number.'],
    ['How does the bank verify a note?', ['By weighing it', 'By measuring each qubit in the basis it was prepared in and checking the result', 'By measuring in random bases', 'By cloning it'], 1, 'Genuine notes always pass because each measurement is in the right basis.'],
    ['Why can’t a forger copy the note?', ['The note is encrypted', 'Copying unknown non-orthogonal states is forbidden by the no-cloning theorem', 'Notes are too small', 'Copying is illegal'], 1, 'BB84 states from two bases cannot be cloned perfectly.'],
    ['What is the optimal per-qubit success probability for producing two passing copies?', ['1/2', '3/4', '5/6', '1'], 1, 'Molina, Vidick and Watrous showed 3/4 is optimal for Wiesner’s scheme.'],
    ['With the measure-and-re-prepare strategy, why is the success per qubit 5/8?', ['By accident', 'Half the time the basis guess is right and both copies pass; otherwise each copy passes with probability ½, giving ½ + ½ · ¼', 'Because there are 8 states', 'Because of noise'], 1, 'Wrong-basis copies are random in the correct basis.'],
    ['Roughly what is (3/4)¹⁰⁰?', ['About 0.3', 'About 3 × 10⁻¹³', 'About 10⁻³', 'About 0.5'], 1, 'Exponential decay makes forging a 100-qubit note hopeless.'],
    ['Why must failed notes not be returned?', ['Paperwork', 'Repeated verification attempts with feedback let an attacker learn the secret states adaptively', 'Because they are radioactive', 'It does not matter'], 1, 'Adaptive attacks exploit the verification oracle.'],
    ['What is the main limitation of Wiesner’s scheme?', ['It is insecure', 'Only the bank can verify notes (private-key money)', 'It needs entanglement', 'It uses classical bits'], 1, 'Public verification would need different, computationally secure constructions.'],
    ['What is public-key quantum money?', ['Money printed by anyone', 'Money anyone can verify but nobody can copy, which requires computational assumptions and is an open problem', 'A kind of QKD', 'A classical signature'], 1, 'Several proposals have been broken; secure constructions remain an active research area.'],
    ['Which protocol did Wiesner’s conjugate coding inspire?', ['RSA', 'BB84 quantum key distribution', 'Shor’s algorithm', 'Grover’s algorithm'], 1, 'Bennett and Brassard built BB84 on Wiesner’s idea.']
  ])
});

/* ---------- channel capacities ---------- */
LESSONS.push({
  id: 'capacity', n: 38.15, stage: QIT, minutes: 15, title: 'Quantum channel capacities',
  lede: 'How much information can a noisy quantum channel carry? Unlike the classical case there are several answers, for classical bits, for qubits and with help from entanglement, and some of them are still unknown even for the simplest channels.',
  html: `
<h2>Several capacities</h2>
<p>Shannon showed that a classical channel has one capacity, a single number computed from one use. A quantum channel ${m('𝒩')} has several, depending on what is sent and what help is allowed:</p>
<ul>
<li><strong>Classical capacity ${m('C')}</strong>: bits per use. The Holevo–Schumacher–Westmoreland theorem gives it as the regularized Holevo information ([[L:infotheory]]). For many channels, including the depolarizing channel (King, 2003), one use suffices, but Hastings (2009) proved that in general the Holevo information is not additive.</li>
<li><strong>Quantum capacity ${m('Q')}</strong>: qubits per use, the rate of reliable quantum communication or, equivalently, of an error-correcting code for that noise. The Lloyd–Shor–Devetak theorem gives it as the regularized <strong>coherent information</strong> ${m('max I<sub>c</sub> = S(B) − S(E)')}.</li>
<li><strong>Entanglement-assisted capacity ${m('C<sub>E</sub>')}</strong>: bits per use when sender and receiver share unlimited entanglement. Bennett, Shor, Smolin and Thapliyal (2002) showed it is the maximal quantum mutual information, a single-letter formula, the exact analogue of Shannon’s theorem. Superdense coding is the extreme case: up to 2 bits per qubit.</li>
</ul>
<h2>Strange behaviour of Q</h2>
<p>The quantum capacity is computable only for special channels. For <strong>degradable</strong> channels, such as dephasing and erasure, one use suffices. For the depolarizing channel the exact value is unknown: the coherent information of one use (the <strong>hashing bound</strong>) is beaten by multi-use codes (DiVincenzo, Shor and Smolin, 1998), so ${m('Q')} is <em>superadditive</em>. Smith and Yard (2008) found something even stranger, <strong>superactivation</strong>: two channels that each have zero quantum capacity can carry quantum information when used together.</p>
${LAB('cap')}
<h2>Why it matters</h2>
<p>The quantum capacity is the ultimate rate of error-correcting codes for a given noise: the hashing bound for depolarizing noise, about 18.9% Pauli error rate, is the error rate at which random stabilizer codes stop working, close to the best surface-code thresholds at the code-capacity level ([[L:thresholds]]). Capacities of lossy bosonic channels (the PLOB bound, [[L:swapping]]) set the limits of quantum communication over optical fibre and the case for quantum repeaters.</p>
`,
  labs: {
    cap: {
      title: 'Capacities of three qubit channels',
      cap: 'Curves show the capacities against the noise parameter. Depolarizing ρ → (1 − p)ρ + p I/2: C = 1 − h(p/2) (exact, additive), C_E = 2 − H(Pauli probabilities), and for Q the hashing lower bound (solid) with Q = 0 proven for p ≥ 1/3 (the channel is anti-degradable there); the true Q between is unknown. Dephasing (Z applied with probability p): C = 1, Q = 1 − h(p), C_E = 2 − h(p). Erasure (qubit lost with probability ε): C = 1 − ε, Q = max(0, 1 − 2ε), C_E = 2(1 − ε).',
      build(body, id) {
        let ch = 'dep', p = .1;
        const cv = canvas('', 'height:280px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const caps = (c3, x) => { if (c3 === 'dep') { const pI = 1 - 3 * x / 4, pp = x / 4, H = Hs([pI, pp, pp, pp]); return { C: 1 - h2b(x / 2), Q: Math.max(0, 1 - H), CE: 2 - H }; } if (c3 === 'deph') { const xx = Math.min(x, 1 - x); return { C: 1, Q: Math.max(0, 1 - h2b(xx)), CE: 2 - h2b(x) }; } return { C: 1 - x, Q: Math.max(0, 1 - 2 * x), CE: 2 * (1 - x) }; };
        const q = painter(cv, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 1], y: [0, 2.05], xt: [0, .25, .5, .75, 1], yt: [0, .5, 1, 1.5, 2], xl: ch === 'era' ? 'erasure probability ε' : 'noise p', yl: 'capacity per use' });
          if (ch === 'dep') { ctx.fillStyle = rgba(T.copper, .1); const x0 = A.X(.2524), x1 = A.X(1 / 3); ctx.fillRect(x0, A.T, x1 - x0, A.B - A.T); txt(ctx, 'Q unknown', (x0 + x1) / 2, A.T + 10, { font: '600 9.5px "JetBrains Mono",monospace', color: T.copper }); }
          for (const [k, col, dash] of [['CE', T.muted, [5, 4]], ['C', T.copper, null], ['Q', T.cyan, null]]) { const pts = []; for (let x = 0; x <= 1.0001; x += .005) pts.push([A.X(x), A.Y(caps(ch, x)[k])]); polyline(ctx, pts, col, 2.4, dash); }
          const c3 = caps(ch, p); for (const [k, col] of [['CE', T.muted], ['C', T.copper], ['Q', T.cyan]]) dot(ctx, A.X(p), A.Y(c3[k]), 5, col, T.surface); });
        const upd = () => { q.inv(); const c3 = caps(ch, p); ro.innerHTML = `<span class="k">classical capacity C </span>${num(c3.C, 4)} bits<br><span class="k">quantum capacity Q </span>${ch === 'dep' ? (p >= 1 / 3 ? '0 (proven)' : p >= .2524 ? 'unknown, ≥ 0' : '≥ ' + num(c3.Q, 4) + ' qubits (hashing bound)') : num(c3.Q, 4) + ' qubits'}<br><span class="k">entanglement-assisted C_E </span>${num(c3.CE, 4)} bits`; };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'dep', label: 'Depolarizing' }, { v: 'deph', label: 'Dephasing' }, { v: 'era', label: 'Erasure' }], ch, v => { ch = v; upd(); }, 'Channel')),
          h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow([['classical C', 'var(--copper)'], ['quantum Q', 'var(--cyan)'], ['entanglement-assisted C_E', 'var(--muted)', 1]])), h('div', { class: 'stack' }, slider({ id: id('p'), label: 'Noise parameter', min: 0, max: 1, step: .005, value: p, fmt: v => num(v, 3), on: v => { p = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['A quantum channel has several capacities: classical C, quantum Q and entanglement-assisted C_E.',
    'C is the regularized Holevo information (HSW), Q the regularized coherent information (LSD); C_E has a single-letter formula, the quantum mutual information.',
    'Q is superadditive for the depolarizing channel and can even be superactivated; it is known exactly only for special channels such as dephasing and erasure.',
    'Capacities set the limits of error correction (the 18.9% hashing bound) and of quantum communication over fibre.'],
  quiz: QZ([
    ['Which theorem gives the classical capacity of a quantum channel?', ['Shannon’s theorem alone', 'The Holevo–Schumacher–Westmoreland theorem, via the regularized Holevo information', 'The no-cloning theorem', 'Bell’s theorem'], 1, 'It generalizes Shannon’s coding theorem to quantum channels.'],
    ['What did Hastings prove in 2009?', ['All capacities are additive', 'The Holevo information is not additive in general, so entangled inputs across uses can help', 'Q is always zero', 'C_E is unknown'], 1, 'This settled a long-standing additivity conjecture.'],
    ['What quantity gives the quantum capacity?', ['The mutual information', 'The regularized coherent information S(B) − S(E) (Lloyd–Shor–Devetak)', 'The Holevo information', 'The fidelity'], 1, 'Regularization over many uses is needed in general.'],
    ['What is special about the entanglement-assisted capacity?', ['It is always zero', 'It has a single-letter formula, the maximal quantum mutual information, like Shannon’s theorem', 'It is uncomputable', 'It is smaller than C'], 1, 'Bennett, Shor, Smolin and Thapliyal proved this in 2002.'],
    ['What is the quantum capacity of an erasure channel with erasure probability ε?', ['1 − ε', 'max(0, 1 − 2ε)', '2(1 − ε)', 'ε'], 1, 'For ε ≥ ½ the channel is anti-degradable, so no quantum information gets through, consistent with no-cloning.'],
    ['What does superadditivity of Q mean?', ['Q adds linearly', 'Codes using many channel uses together can beat the single-use coherent information', 'Q is infinite', 'Q is negative'], 1, 'DiVincenzo, Shor and Smolin showed this for the depolarizing channel.'],
    ['What is superactivation?', ['A hardware effect', 'Two channels with zero quantum capacity each can have positive capacity when used together', 'Cloning a channel', 'A decoding algorithm'], 1, 'Smith and Yard discovered it in 2008, combining a channel with positive private capacity and an erasure channel.'],
    ['Why is Q = 0 for the depolarizing channel at p ≥ 1/3 in the lab’s parametrization?', ['By convention', 'The channel is then anti-degradable: the environment could reconstruct the output, so sending quantum information would violate no-cloning', 'The channel is noiseless', 'Because C = 0'], 1, 'At p = 1/3 the channel equals one output of the optimal universal cloner.'],
    ['What is the hashing bound for depolarizing noise, in Pauli error probability?', ['1%', 'About 18.9%', '50%', '75%'], 1, 'Random stabilizer codes achieve positive rate up to this error rate.'],
    ['Why do channel capacities matter for networks?', ['They do not', 'Capacities of lossy optical channels, such as the PLOB bound, limit repeaterless quantum communication and motivate repeaters', 'They set processor clock speeds', 'They replace QKD'], 1, 'The PLOB bound falls exponentially with fibre length ([[L:swapping]]).']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Phase folding', 'Optimizing CNOT + phase circuits by merging rotations that act on the same parity of the inputs.', 'zx'],
  ['OpenQASM 3', 'An intermediate representation for quantum circuits with classical control flow, timing and calibration.', 'stack'],
  ['Native gate', 'An operation a device implements directly with calibrated pulses.', 'stack'],
  ['Remote gate', 'A two-qubit gate between modules implemented with a shared Bell pair, local operations and classical communication.', 'distributed'],
  ['Heisenberg limit', 'The best possible scaling of measurement precision with N probes, Δφ ∝ 1/N, reachable with entangled states.', 'metrology'],
  ['Standard quantum limit', 'The precision Δφ ∝ 1/√N achievable with N independent probes.', 'metrology'],
  ['Quantum Fisher information', 'The quantity that bounds achievable estimation precision through the quantum Cramér–Rao bound.', 'metrology'],
  ['Blind quantum computing', 'Delegating a quantum computation to a server that learns nothing about input, algorithm or output.', 'blind'],
  ['Quantum money', 'Banknotes containing quantum states that cannot be copied; Wiesner’s scheme is the original example.', 'money'],
  ['Quantum capacity', 'The maximal rate of reliable qubit transmission through a channel, given by the regularized coherent information.', 'capacity'],
  ['Coherent information', 'S(B) − S(E) for a channel output and environment; its regularized maximum is the quantum capacity.', 'capacity'],
  ['Superactivation', 'The phenomenon that two zero-capacity quantum channels can transmit quantum information when used together.', 'capacity']
);
})();
