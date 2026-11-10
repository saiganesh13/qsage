/* =====================================================================
   Research tracks · Compilers · Variational, QML and chemistry · Information theory and cryptography
   ===================================================================== */
(() => {
const CMP = 8, VQA = 9, QIT = 10;

/* ---------------- 34 · Circuit optimization ---------------- */
const PH = { T: 1, S: 2, Z: 4, Sdg: 6, Tdg: 7 }, PH_SEQ = { 0: [], 1: ['T'], 2: ['S'], 4: ['Z'], 6: ['Sdg'], 7: ['Tdg'] };
const wires = g => g.g === 'CX' ? [g.c, g.t] : g.g === 'CZ' ? [g.a, g.b] : [g.q];
const isPh = g => g.g in PH, isDiag = g => isPh(g) || g.g === 'CZ';
const share = (a, b) => wires(a).some(w => wires(b).includes(w));
const sameCZ = (a, b) => (a.a === b.a && a.b === b.b) || (a.a === b.b && a.b === b.a);
const cancels = (a, b) => a.g === b.g && (['H', 'X', 'Y', 'Z'].includes(a.g) ? a.q === b.q : a.g === 'CX' ? a.c === b.c && a.t === b.t : a.g === 'CZ' ? sameCZ(a, b) : false);
function commuteG(a, b) {
  if (isDiag(a) && isDiag(b)) return true;
  const cx = a.g === 'CX' ? a : b.g === 'CX' ? b : null, o = cx === a ? b : a;
  if (cx && o.g === 'CX') return (cx.c === o.c && cx.t !== o.t && cx.t !== o.c && o.t !== cx.c) || (cx.t === o.t && cx.c !== o.c && cx.c !== o.t && o.c !== cx.t);
  if (cx && o.g === 'CZ') return ![o.a, o.b].includes(cx.t);
  if (cx && isPh(o)) return o.q === cx.c;
  if (cx && o.g === 'X') return o.q === cx.t;
  return false;
}
function rewrite(gs) {
  for (let i = 0; i < gs.length; i++) {
    const g = gs[i];
    for (let j = i - 1; j >= 0; j--) {
      const hh = gs[j]; if (!share(hh, g)) continue;
      if (cancels(hh, g)) { const out = gs.filter((_, k) => k !== i && k !== j); return { gs: out, msg: `Cancelled ${lbl(hh)} · ${lbl(g)}` }; }
      if (isPh(hh) && isPh(g) && hh.q === g.q) {
        const k = (PH[hh.g] + PH[g.g]) % 8; if (!(k in PH_SEQ)) break;
        const out = gs.slice(); out.splice(i, 1); out.splice(j, 1, ...PH_SEQ[k].map(x => ({ g: x, q: g.q })));
        return { gs: out, msg: `Merged ${lbl(hh)} · ${lbl(g)} into ${PH_SEQ[k].length ? PH_SEQ[k].map(x => GATE_LABEL[x]).join('') : 'nothing'} on q${g.q}` };
      }
      if (commuteG(hh, g)) continue; break;
    }
  }
  for (let i = 0; i < gs.length; i++) {
    if (gs[i].g !== 'H') continue; const q = gs[i].q, nx = k => { for (let m2 = k + 1; m2 < gs.length; m2++) if (wires(gs[m2]).includes(q)) return m2; return -1; };
    const j = nx(i); if (j < 0 || !['X', 'Z'].includes(gs[j].g) || wires(gs[j]).length > 1) continue; const k = nx(j); if (k < 0 || gs[k].g !== 'H') continue;
    const out = gs.slice(), sw = gs[j].g === 'X' ? 'Z' : 'X'; out[j] = { g: sw, q }; out.splice(k, 1); out.splice(i, 1);
    return { gs: out, msg: `Replaced H ${gs[j].g} H by ${sw} on q${q}` };
  }
  return null;
}
const lbl = g => g.g === 'CX' ? `CX(${g.c}→${g.t})` : g.g === 'CZ' ? `CZ(${g.a},${g.b})` : `${GATE_LABEL[g.g]}${g.q}`;
function layer(gs, n) { const top = new Array(n).fill(0), cols = []; for (const g of gs) { const ws = wires(g), lo = Math.min(...ws), hi = Math.max(...ws); let c2 = 0; for (let w = lo; w <= hi; w++) c2 = Math.max(c2, top[w]); (cols[c2] = cols[c2] || []).push(g.g === 'CZ' ? { g: 'CZ', a: g.a, b: g.b } : Object.assign({}, g)); for (let w = lo; w <= hi; w++) top[w] = c2 + 1; } return cols; }
function unitary(gs, n) {
  const N = 1 << n, cols = [];
  for (let b = 0; b < N; b++) { const s = new QState(n).basis(b); for (const g of gs) { if (g.g === 'CX') s.cx(g.c, g.t); else if (g.g === 'CZ') s.cz(g.a, g.b); else s.g(g.g, g.q); } cols.push(s); }
  return cols;
}
function sameUnitary(A, B) { let re = 0, im = 0; for (let b = 0; b < A.length; b++) for (let i = 0; i < A[b].N; i++) { re += A[b].re[i] * B[b].re[i] + A[b].im[i] * B[b].im[i]; im += A[b].re[i] * B[b].im[i] - A[b].im[i] * B[b].re[i]; } return Math.hypot(re, im) / A.length; }
LESSONS.push({
  id: 'optimize', n: 34, stage: CMP, minutes: 13, title: 'Circuit optimization',
  lede: 'Every gate costs fidelity on today’s machines and time on tomorrow’s. Compilers rewrite circuits into cheaper equivalents, a classical problem about quantum programs.',
  html: `
<h2>What to minimize</h2>
<p>On noisy hardware the main costs are two-qubit gates, which are roughly ten times noisier than single-qubit ones, and circuit depth, which sets how long qubits sit idle and decohere. On fault-tolerant machines the cost shifts to T count and T depth ([[L:magic]]), while Clifford gates become comparatively cheap. A compiler’s objective changes with the target.</p>
<h2>Peephole rewriting</h2>
<p>The simplest optimizations look at a few gates at a time:</p>
<ul>
<li><strong>Cancellation.</strong> Self-inverse gates cancel when they meet: ${m('HH = I')}, two identical CNOTs cancel, ${m('SS<sup>†</sup> = I')}.</li>
<li><strong>Merging rotations.</strong> Phase gates on the same qubit add up: ${m('T·T = S')}, ${m('S·S = Z')}, ${m('Rz(a)Rz(b) = Rz(a + b)')}.</li>
<li><strong>Commutation.</strong> Gates can slide past each other when they commute, which brings cancellable pairs together. Phase gates commute with a CNOT’s control, X commutes with its target, and diagonal gates all commute.</li>
<li><strong>Templates.</strong> Known identities such as ${m('HXH = Z')} or ${m('HZH = X')} replace a pattern with something shorter.</li>
</ul>
${LAB('opt')}
<h2>Bigger moves</h2>
<ul>
<li><strong>Resynthesis.</strong> Collect a block of gates on two qubits, compute its 4×4 unitary, and rebuild it optimally. Any two-qubit unitary needs at most three CNOTs (the KAK, or Cartan, decomposition).</li>
<li><strong>Phase polynomials.</strong> Circuits of CNOT and phase gates have a compact algebraic form; optimizing it reduces T count, which matters most for fault tolerance.</li>
<li><strong>ZX-calculus.</strong> A graphical language for quantum circuits with a complete set of rewrite rules. Tools such as PyZX simplify circuits as graphs and extract them back, often finding reductions that gate-by-gate methods miss.</li>
<li><strong>Verification.</strong> Checking that two circuits are equivalent is hard in general, so compilers rely on provably correct rewrite rules, and some, such as VOQC, are formally verified in a proof assistant. The lab checks equivalence by brute force, which only works for a few qubits.</li>
</ul>
<p>In practice these passes live in compiler frameworks: the Qiskit transpiler’s optimization levels, Quantinuum’s tket, Google’s Cirq transformers, and research tools such as PyZX and BQSKit.</p>
`,
  labs: {
    opt: {
      title: 'A peephole optimizer',
      cap: 'The optimizer repeatedly applies one rewrite: cancel inverse pairs, merge phase gates, or replace H·X·H and H·Z·H, sliding gates past others only when they commute. After every step the brute-force check compares the full 8 × 8 unitaries.',
      build(body, id) {
        const n = 3; let orig, cur, log, seed = 11;
        const gen = () => {
          const R = rng(seed), gs = [], pick = arr => arr[Math.floor(R() * arr.length)], q = () => Math.floor(R() * n);
          for (let k = 0; k < 22; k++) {
            const r = R(); if (r < .14) gs.push({ g: 'H', q: q() }); else if (r < .26) gs.push({ g: pick(['T', 'Tdg']), q: q() }); else if (r < .34) gs.push({ g: pick(['S', 'Sdg', 'Z']), q: q() }); else if (r < .42) gs.push({ g: 'X', q: q() });
            else if (r < .74) { const c2 = q(); let t = q(); while (t === c2) t = q(); gs.push({ g: 'CX', c: c2, t }); } else if (r < .84) { const a = q(); let b = q(); while (b === a) b = q(); gs.push({ g: 'CZ', a, b }); }
            else { const w = q(), pat = pick([['H', 'H'], ['T', 'T'], ['S', 'Sdg'], ['H', 'Z', 'H'], ['X', 'X']]); pat.forEach(g => gs.push({ g, q: w })); }
            if (R() < .18 && gs.length && gs[gs.length - 1].g === 'CX') { const last = gs[gs.length - 1]; if (R() < .5) gs.push({ g: pick(['T', 'S']), q: last.c }); gs.push(Object.assign({}, last)); }
          }
          orig = gs; cur = gs.slice(); log = []; render();
        };
        const before = h('div', { class: 'circ-wrap' }), after = h('div', { class: 'circ-wrap' }), logEl = h('ol', { class: 'hint', style: 'margin:0;padding-left:20px;display:grid;gap:2px;max-height:180px;overflow:auto' }), stats = h('div', { class: 'readout', style: 'white-space:normal' }), ver = h('div', { class: 'status' });
        const metrics = gs => ({ total: gs.length, twoq: gs.filter(g => g.g === 'CX' || g.g === 'CZ').length, t: gs.filter(g => g.g === 'T' || g.g === 'Tdg').length, depth: layer(gs, n).length });
        const render = () => {
          before.innerHTML = ''; before.append(drawCircuit(n, layer(orig, n), { cw: 42, rh: 46, lw: 40, aria: 'Original circuit' }).svg);
          after.innerHTML = ''; after.append(drawCircuit(n, layer(cur, n), { cw: 42, rh: 46, lw: 40, aria: 'Optimized circuit' }).svg);
          const a = metrics(orig), b = metrics(cur);
          stats.innerHTML = `<span class="k">gates </span>${a.total} → <b>${b.total}</b> · <span class="k">two-qubit </span>${a.twoq} → <b>${b.twoq}</b> · <span class="k">T count </span>${a.t} → <b>${b.t}</b> · <span class="k">depth </span>${a.depth} → <b>${b.depth}</b>`;
          logEl.innerHTML = ''; log.forEach(m2 => logEl.append(h('li', null, m2)));
          const f = sameUnitary(unitary(orig, n), unitary(cur, n)); ver.className = 'status ' + (f > 1 - 1e-9 ? 'good' : 'bad');
          ver.textContent = f > 1 - 1e-9 ? 'Verified: the optimized circuit has the same 8 × 8 unitary (up to global phase).' : `Mismatch: overlap ${num(f, 4)}.`;
        };
        const step = () => { const r = rewrite(cur); if (!r) { log.push('No further rewrite applies.'); render(); return false; } cur = r.gs; log.push(r.msg); render(); return true; };
        body.append(field('Original circuit', before), field('After optimization', after), stats,
          h('div', { class: 'split' }, h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Apply one rewrite', step), btn('Optimize fully', () => { let k = 0; while (k++ < 200 && rewrite(cur)) step(); }, 'pri'), btn('New random circuit', () => { seed = Math.floor(Math.random() * 1e9); gen(); })), ver),
            field('Rewrite log', logEl)));
        gen();
      }
    }
  },
  take: ['Noisy machines minimize two-qubit gates and depth; fault-tolerant machines minimize T count.',
    'Peephole passes cancel inverses, merge rotations and use commutation and templates.',
    'Resynthesis, phase polynomials and the ZX-calculus find larger savings.',
    'Equivalence checking is hard in general, so compilers rely on sound rewrite rules.'],
  quiz: [
    { q: 'What do T · T · T · T equal?', o: ['T', 'S', 'Z', 'The identity'], a: 2, why: 'Four eighth-turns make a half turn about z: Z.' },
    { q: 'At most how many CNOTs does an arbitrary two-qubit unitary need?', o: ['1', '2', '3', '6'], a: 2, why: 'The KAK decomposition shows three CNOTs always suffice.' }
  ]
});

/* ---------------- 35 · Mapping, routing and scheduling ---------------- */
const TOPO = {
  line: { name: 'Line', pos: [...Array(6)].map((_, i) => [i / 5, .5]), e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  ring: { name: 'Ring', pos: [...Array(6)].map((_, i) => [.5 + .42 * Math.cos(TAU * i / 6 - PI / 2), .5 + .42 * Math.sin(TAU * i / 6 - PI / 2)]), e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]] },
  grid: { name: '2 × 3 grid', pos: [[0, .2], [.5, .2], [1, .2], [0, .8], [.5, .8], [1, .8]], e: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]] },
  all: { name: 'All-to-all', pos: [...Array(6)].map((_, i) => [.5 + .42 * Math.cos(TAU * i / 6 - PI / 2), .5 + .42 * Math.sin(TAU * i / 6 - PI / 2)]), e: [] }
};
for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) TOPO.all.e.push([i, j]);
LESSONS.push({
  id: 'routing', n: 35, stage: CMP, minutes: 14, title: 'Mapping, routing and scheduling',
  lede: 'A program assumes any two qubits can interact. Real chips connect each qubit to only a few neighbours, so the compiler must place qubits and move them around, without wrecking the circuit.',
  html: `
<h2>The connectivity problem</h2>
<p>Superconducting chips connect each qubit to two to four neighbours on a grid or, in IBM’s case, a heavy-hexagon lattice. Trapped ions in one chain are fully connected, and neutral atoms can be moved. When a CNOT is needed between qubits that are not neighbours, the compiler inserts <strong>SWAP</strong> gates, each costing three CNOTs, to bring them together.</p>
<p>Two decisions interact. The <strong>initial layout</strong> chooses which physical qubit hosts each logical qubit, and the <strong>routing</strong> decides which SWAPs to insert as the circuit runs. Finding the optimal combination is NP-hard, so compilers use heuristics. The widely used SABRE algorithm (Li, Ding and Xie, 2019) looks ahead at upcoming gates when choosing each SWAP, and runs forwards and backwards through the circuit to improve the starting layout.</p>
${LAB('route')}
<h2>Scheduling</h2>
<p>Once gates are fixed, they must be placed in time. <strong>As soon as possible</strong> (ASAP) scheduling starts each gate as early as its inputs allow; <strong>as late as possible</strong> (ALAP) delays gates so qubits are prepared just before they are needed, which reduces idle time spent decohering. Idle qubits can be protected with <strong>dynamical decoupling</strong>, short pulse sequences that echo away slow noise. Schedulers also avoid running gates side by side when they cause crosstalk.</p>
<h2>The compilation stack</h2>
<ol>
<li>A program in a high-level framework: Qiskit, Cirq, PennyLane, Q#, NVIDIA’s CUDA-Q, or Quantinuum’s Guppy.</li>
<li>An intermediate representation such as OpenQASM 3 or QIR, which can express loops, classical logic and mid-circuit measurement.</li>
<li>Transpilation: decompose to the native gate set, choose a layout, route, optimize, schedule.</li>
<li>Translation into calibrated control pulses for the hardware.</li>
</ol>
${CODE('openqasm 3', `
OPENQASM 3.0;
include "stdgates.inc";

qubit[3] q;
bit[3] c;

h q[0];
cx q[0], q[1];
cx q[1], q[2];
c = measure q;
`)}
${CODE('python · qiskit transpiler', `
from qiskit import QuantumCircuit, transpile
from qiskit.transpiler import CouplingMap

qc = QuantumCircuit(6)
for i in range(6):
    for j in range(i + 1, 6):
        qc.cz(i, j)            # every pair interacts once

line = CouplingMap.from_line(6)
out = transpile(qc, coupling_map=line,
                basis_gates=["cz", "rz", "sx", "x"],
                optimization_level=3, seed_transpiler=1)
print(out.count_ops(), out.depth())
`)}
<p>The Circuit lab in [[L:circuits]] can now export your circuit as OpenQASM 3, so you can paste it into any of these tools.</p>
`,
  labs: {
    route: {
      title: 'Route a circuit on a chip',
      cap: 'Six logical qubits (L0–L5) sit on six physical qubits. Each two-qubit gate needs its qubits to be neighbours; the greedy router swaps the first qubit along a shortest path until they are. Step through to watch the qubits move.',
      build(body, id) {
        let topo = 'line', circ = 'all', layoutMode = 'id', ops = [], at = 0, l2p0 = [0, 1, 2, 3, 4, 5], seed = 5;
        const cv = canvas('', 'height:220px'), stat = h('div', { class: 'status' }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const pairs = () => { if (circ === 'chain') return [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]; if (circ === 'all') { const o = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) o.push([i, j]); return o; } const R = rng(seed), o = []; for (let k = 0; k < 14; k++) { const a = Math.floor(R() * 6); let b = Math.floor(R() * 6); while (b === a) b = Math.floor(R() * 6); o.push([a, b]); } return o; };
        const adj = () => { const A = [...Array(6)].map(() => []); for (const [a, b] of TOPO[topo].e) { A[a].push(b); A[b].push(a); } return A; };
        const route = (l2pIn) => {
          const A = adj(), l2p = l2pIn.slice(), p2l = []; l2p.forEach((p, l) => p2l[p] = l); const out = []; let swaps = 0;
          for (const [a, b] of pairs()) {
            for (;;) {
              const pa = l2p[a], pb = l2p[b]; if (A[pa].includes(pb)) break;
              const par = new Array(6).fill(-1), Q = [pa]; par[pa] = pa; while (Q.length) { const u = Q.shift(); for (const v of A[u]) if (par[v] < 0) { par[v] = u; Q.push(v); } }
              let v = pb, path = [v]; while (v !== pa) { v = par[v]; path.unshift(v); }
              const nxt = path[1], la = p2l[pa], lb = p2l[nxt]; out.push({ k: 'swap', p: [pa, nxt], map: null }); swaps++;
              l2p[la] = nxt; l2p[lb] = pa; p2l[nxt] = la; p2l[pa] = lb; out[out.length - 1].map = l2p.slice();
            }
            out.push({ k: 'gate', p: [l2p[a], l2p[b]], l: [a, b], map: l2p.slice() });
          }
          return { out, swaps };
        };
        const best = () => { let bestL = l2p0, bs = Infinity; const R = rng(seed * 7 + 1); for (let k = 0; k < 400; k++) { const L = [0, 1, 2, 3, 4, 5]; for (let i = 5; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; } const r = route(L).swaps; if (r < bs) { bs = r; bestL = L; } } return bestL; };
        const plan = () => { l2p0 = layoutMode === 'id' ? [0, 1, 2, 3, 4, 5] : best(); const r = route(l2p0); ops = r.out; at = 0; upd(); };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), P = TOPO[topo].pos.map(([x, y]) => [40 + x * (w - 80), 26 + y * (H - 52)]), op = ops[at - 1], map = op ? op.map : l2p0, p2l = []; map.forEach((p, l) => p2l[p] = l);
          for (const [a, b] of TOPO[topo].e) { const hot = op && ((op.p[0] === a && op.p[1] === b) || (op.p[0] === b && op.p[1] === a)); ctx.strokeStyle = hot ? (op.k === 'swap' ? T.bad : T.copper) : T.line; ctx.lineWidth = hot ? 5 : 2; ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke(); }
          for (let p = 0; p < 6; p++) { dot(ctx, P[p][0], P[p][1], 19, T.surface, T.ink); txt(ctx, 'L' + p2l[p], P[p][0], P[p][1], { color: T.ink, font: '700 13px "JetBrains Mono",monospace' }); txt(ctx, 'p' + p, P[p][0], P[p][1] + 30, { font: '500 10px "JetBrains Mono",monospace' }); }
        });
        const upd = () => {
          const g = ops.filter(o => o.k === 'gate').length, s = ops.length - g, op = ops[at - 1];
          ro.innerHTML = `<span class="k">gates </span>${g} · <span class="k">SWAPs inserted </span><b>${s}</b> · <span class="k">two-qubit gates after routing </span><b>${g + 3 * s}</b> (each SWAP = 3 CNOTs)<br><span class="k">initial layout </span>${l2p0.map((p, l) => `L${l}→p${p}`).join(', ')}`;
          stat.className = 'status'; stat.textContent = at === 0 ? `Step 0 of ${ops.length}. Press Next or Play.` : `Step ${at} of ${ops.length}: ` + (op.k === 'swap' ? `SWAP physical qubits p${op.p[0]} and p${op.p[1]}.` : `gate between L${op.l[0]} and L${op.l[1]} on neighbours p${op.p[0]}, p${op.p[1]}.`);
          pc.inv();
        };
        let play = false; Scope.every(dur(650) || 120, () => { if (play && at < ops.length) { at++; upd(); } else if (play) { play = false; pb.textContent = 'Play'; } });
        const pb = btn('Play', () => { if (at >= ops.length) at = 0; play = !play; pb.textContent = play ? 'Pause' : 'Play'; }, 'pri');
        body.append(cv, h('div', { class: 'split' }, h('div', { class: 'stack' }, stat, ro, h('div', { class: 'btns' }, btn('Back', () => { if (at) { at--; upd(); } }), btn('Next', () => { if (at < ops.length) { at++; upd(); } }), pb, btn('Restart', () => { at = 0; upd(); }))),
          h('div', { class: 'stack' },
            field('Chip', seg(Object.entries(TOPO).map(([v, t]) => ({ v, label: t.name })), topo, v => { topo = v; plan(); }, 'Topology')),
            field('Circuit', seg([{ v: 'all', label: 'Every pair' }, { v: 'rand', label: 'Random 14 gates' }, { v: 'chain', label: 'Neighbour chain' }], circ, v => { circ = v; plan(); }, 'Circuit')),
            field('Initial layout', seg([{ v: 'id', label: 'L i on p i' }, { v: 'best', label: 'Best of 400 random' }], layoutMode, v => { layoutMode = v; plan(); }, 'Layout')),
            btn('New random circuit', () => { seed = Math.floor(Math.random() * 1e6); if (circ === 'rand') plan(); }, 'sm'))));
        plan();
      }
    }
  },
  take: ['Limited connectivity forces SWAP insertion, each costing three CNOTs.',
    'Initial layout and routing interact; optimal routing is NP-hard, so heuristics such as SABRE are used.',
    'Schedulers reduce idle time (ALAP), add dynamical decoupling and avoid crosstalk.',
    'Programs flow through an intermediate representation such as OpenQASM 3 down to calibrated pulses.'],
  quiz: [
    { q: 'How many CNOTs does one SWAP cost?', o: ['1', '2', '3', '4'], a: 2, why: 'SWAP = three alternating CNOTs, as in the Circuit lab example.' },
    { q: 'On which topology does the “every pair” circuit need no SWAPs?', o: ['Line', 'Ring', '2 × 3 grid', 'All-to-all'], a: 3, why: 'Only full connectivity, as in a trapped-ion chain, makes every pair adjacent.' }
  ]
});

/* ---------------- 36 · Quantum chemistry ---------------- */
const HUB_TERMS = U => [[-.5, 'XZXI'], [-.5, 'YZYI'], [-.5, 'IXZX'], [-.5, 'IYZY'], [U / 2, 'IIII'], [-U / 4, 'ZIII'], [-U / 4, 'IZII'], [-U / 4, 'IIZI'], [-U / 4, 'IIIZ'], [U / 4, 'ZZII'], [U / 4, 'IIZZ']];
function pauliMatrix(terms, n) {
  const N = 1 << n, Hm = new Float64Array(N * N);
  for (const [cf, p] of terms) for (let i = 0; i < N; i++) {
    let j = i, pr = 1, pi = 0;
    for (let q = 0; q < n; q++) { const b = (i >> (n - 1 - q)) & 1, ch = p[q]; if (ch === 'X') j ^= 1 << (n - 1 - q); else if (ch === 'Y') { j ^= 1 << (n - 1 - q); const nr = -pi * (b ? -1 : 1), ni = pr * (b ? -1 : 1); pr = nr; pi = ni; } else if (ch === 'Z' && b) { pr = -pr; pi = -pi; } }
    Hm[j * N + i] += cf * pr;
  }
  return Hm;
}
LESSONS.push({
  id: 'chemistry', n: 36, stage: VQA, minutes: 15, title: 'Quantum chemistry on qubits',
  lede: 'Chemistry is the application Feynman had in mind: electrons are quantum particles, and their correlations are what classical methods struggle with. The first step is translating electrons into qubits.',
  html: `
<h2>The electronic structure problem</h2>
<p>Most chemistry comes down to the lowest energy of a molecule’s electrons for fixed nuclei. In second quantization, with creation and annihilation operators ${m('a<sub>p</sub><sup>†</sup>, a<sub>p</sub>')} for a set of spin orbitals,</p>
${EQ('H = Σ<sub>pq</sub> h<sub>pq</sub> a<sub>p</sub><sup>†</sup>a<sub>q</sub> + ½ Σ<sub>pqrs</sub> h<sub>pqrs</sub> a<sub>p</sub><sup>†</sup>a<sub>q</sub><sup>†</sup>a<sub>r</sub>a<sub>s</sub>')}
<p>The coefficients come from integrals that classical software computes routinely. The hard part is the ground state, whose size grows exponentially with the number of orbitals. Chemists aim for <strong>chemical accuracy</strong>, about 1.6 millihartree (1 kcal/mol), the precision needed to predict reaction rates.</p>
<h2>From fermions to qubits</h2>
<p>Each spin orbital is either occupied or empty, so it maps naturally to one qubit. The subtlety is that fermion operators anticommute. The <strong>Jordan–Wigner</strong> transformation keeps track of this with strings of Z operators:</p>
${EQ('a<sub>j</sub><sup>†</sup> = Z₀ ⋯ Z<sub>j−1</sub> · ½(X<sub>j</sub> − iY<sub>j</sub>)')}
<p>The Bravyi–Kitaev and parity mappings shorten those strings ([[L:mappings]]), and symmetries such as particle number and spin let you remove qubits. After mapping, the Hamiltonian is a weighted sum of Pauli strings, which a quantum computer measures term by term in VQE, at a cost in shots covered in [[L:measure]], or exponentiates for phase estimation ([[L:qpe]]).</p>
<h2>A model you can solve exactly</h2>
<p>The two-site Hubbard model, two electrons hopping between two sites with hopping strength ${m('t')} and an energy cost ${m('U')} for doubly occupying a site, is the smallest model of a chemical bond. It has four spin orbitals, so four qubits. Jordan–Wigner gives</p>
${EQ('H = −(t/2)(X₀Z₁X₂ + Y₀Z₁Y₂ + X₁Z₂X₃ + Y₁Z₂Y₃) + (U/4)(2 − ΣZ<sub>i</sub> + Z₀Z₁ + Z₂Z₃)')}
<p>Its exact ground energy is ${m('E₀ = (U − √(U² + 16t²))/2')}, while the mean-field Hartree–Fock approximation gives ${m('−2t + U/2')}. The gap between them is the <strong>correlation energy</strong>, and it grows as ${m('U/t')} grows, the regime of stretched bonds and strongly correlated materials where classical approximations struggle.</p>
${LAB('hubbard')}
<h2>Where things stand</h2>
<p>Variational demonstrations have computed small molecules such as H₂, LiH and BeH₂, all of which classical computers handle easily. Problems of real interest, such as the FeMoco cofactor in nitrogen fixation or the active sites of catalysts, need on the order of a hundred or more logical qubits and phase estimation on error-corrected hardware. Meanwhile classical methods (coupled cluster, DMRG, quantum Monte Carlo) keep improving, so careful benchmarks matter: a quantum chemistry advantage needs a problem that is both important and genuinely hard classically.</p>
`,
  labs: {
    hubbard: {
      title: 'The Hubbard dimer',
      cap: 'Top: exact ground energy and Hartree–Fock energy as the repulsion U grows (t = 1). Bottom: the energy of the one-parameter variational state cos θ |covalent⟩ + sin θ |ionic⟩; its minimum equals the exact answer. The check button builds the 16 × 16 matrix from the Pauli strings and diagonalizes it numerically.',
      build(body, id) {
        let U = 4, th = PI / 4;
        const top = canvas('', 'height:200px'), bot = canvas('', 'height:170px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), chk = h('div', { class: 'status' });
        const E0 = u => (u - Math.sqrt(u * u + 16)) / 2, HF = u => -2 + u / 2, Eth = (u, t2) => u * Math.sin(t2) ** 2 - 2 * Math.sin(2 * t2);
        const pt = painter(top, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 12], y: [-2.2, 4.2], xt: [0, 2, 4, 6, 8, 10, 12], yt: [-2, 0, 2, 4], xl: 'U / t', yl: 'energy / t' });
          const e = [], hf = []; for (let u = 0; u <= 12; u += .1) { e.push([A.X(u), A.Y(E0(u))]); hf.push([A.X(u), A.Y(HF(u))]); }
          polyline(ctx, hf, T.copper, 2, [6, 4]); polyline(ctx, e, T.cyan, 2.4);
          txt(ctx, 'Hartree–Fock', A.X(9), A.Y(HF(9)) - 12, { color: T.copper, font: '600 11px "JetBrains Mono",monospace' }); txt(ctx, 'exact', A.X(10), A.Y(E0(10)) + 14, { color: T.cyan, font: '600 11px "JetBrains Mono",monospace' });
          polyline(ctx, [[A.X(U), A.T], [A.X(U), A.B]], T.muted, 1, [3, 3]);
        });
        const pb = painter(bot, ({ ctx, w, h: H }) => {
          const T = Theme.get(), lo = Math.min(E0(U), -2.2), A = axes(ctx, w, H, { x: [0, PI / 2], y: [lo - .2, Math.max(U, 1) + .2], xt: [0, PI / 8, PI / 4, 3 * PI / 8, PI / 2], xf: v => num(deg(v), 0) + '°', yt: [Math.round(lo), 0, Math.round(Math.max(U, 1))], xl: 'ansatz angle θ', yl: 'E(θ) / t' });
          const pts = []; for (let t2 = 0; t2 <= PI / 2; t2 += .01) pts.push([A.X(t2), A.Y(Eth(U, t2))]); polyline(ctx, pts, T.cyan, 2.2);
          polyline(ctx, [[A.L, A.Y(E0(U))], [A.R, A.Y(E0(U))]], T.muted, 1, [4, 4]); dot(ctx, A.X(th), A.Y(Eth(U, th)), 6, T.copper, T.surface);
          dot(ctx, A.X(PI / 4), A.Y(HF(U)), 4, T.copper); txt(ctx, 'HF', A.X(PI / 4) + 8, A.Y(HF(U)) + 10, { align: 'left', color: T.copper });
        });
        const upd = () => {
          ro.innerHTML = `<span class="k">exact E₀ </span>${num(E0(U), 4)} · <span class="k">Hartree–Fock </span>${num(HF(U), 4)} · <span class="k">correlation energy </span>${num(E0(U) - HF(U), 4)}<br><span class="k">variational E(θ) </span>${num(Eth(U, th), 4)} at θ = ${num(deg(th), 1)}° · best θ = ${num(deg(Math.atan2(4, U) / 2), 1)}°`;
          chk.className = 'status'; chk.textContent = 'Press the check to diagonalize the qubit Hamiltonian at this U.'; pt.inv(); pb.inv();
        };
        const check = () => {
          const Hm = pauliMatrix(HUB_TERMS(U), 4), idx = []; for (let i = 0; i < 16; i++) { const b = q => (i >> (3 - q)) & 1; if (b(0) + b(2) === 1 && b(1) + b(3) === 1) idx.push(i); }
          const sub = new Float64Array(16); idx.forEach((a, r) => idx.forEach((b, c2) => { sub[r * 4 + c2] = Hm[a * 16 + b]; }));
          const ev = eigSym(sub, 4), e0 = ev[ev.length - 1];
          chk.className = 'status good'; chk.textContent = `Lowest eigenvalue of the 4-qubit Hamiltonian with one up and one down electron: ${num(e0, 6)}. Formula: ${num(E0(U), 6)}. All four levels in this sector: ${ev.slice().reverse().map(x => num(x, 3)).join(', ')}.`;
        };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, top, bot), h('div', { class: 'stack' },
          slider({ id: id('U'), label: 'On-site repulsion U / t', min: 0, max: 12, step: .1, value: U, fmt: v => num(v, 1), on: v => { U = v; upd(); } }),
          slider({ id: id('th'), label: 'Ansatz angle θ', min: 0, max: 90, step: .5, value: 45, fmt: v => num(v, 1) + '°', on: v => { th = rad(v); upd(); } }),
          btn('Minimize E(θ)', () => { th = Math.atan2(4, U) / 2; body.querySelector('#' + id('th')).value = deg(th); body.querySelector('#' + id('th')).dispatchEvent(new Event('input')); }, 'pri'),
          ro, btn('Check against exact diagonalization', check), chk)));
        upd();
      }
    }
  },
  take: ['Electronic structure needs the ground state of a fermionic Hamiltonian; chemical accuracy is about 1.6 mHa.',
    'Jordan–Wigner maps each spin orbital to a qubit, with Z strings enforcing fermionic signs.',
    'The Hubbard dimer shows correlation energy growing as U/t grows, where mean-field theory fails.',
    'Useful chemistry advantage likely needs error-corrected phase estimation on carefully chosen hard problems.'],
  quiz: [
    { q: 'How many qubits does Jordan–Wigner need for 4 spin orbitals?', o: ['2', '4', '8', '16'], a: 1, why: 'One qubit per spin orbital, before any symmetry reduction.' },
    { q: 'At U = 0, what is the correlation energy of the Hubbard dimer?', o: ['0', '−2t', '−4t', 'U/2'], a: 0, why: 'E₀ = −2t and Hartree–Fock gives −2t + 0: without interaction, mean field is exact.' }
  ]
});

/* ---------------- 37 · Quantum machine learning ---------------- */
LESSONS.push({
  id: 'qml', n: 37, stage: VQA, minutes: 15, title: 'Quantum machine learning',
  lede: 'Quantum machine learning asks whether parameterized circuits can learn from data better than classical models. Most of it is prototyped in simulation, and its hardest questions are about training and data loading.',
  html: `
<h2>Models from circuits</h2>
<p>A quantum model encodes an input ${m('x')} into a circuit, applies trainable gates, and measures an expectation value as its output. Common encodings are <strong>angle encoding</strong>, where features become rotation angles, and <strong>amplitude encoding</strong>, which packs ${m('2ⁿ')} numbers into ${m('n')} qubits but usually costs many gates to prepare. <strong>Data re-uploading</strong> (Pérez-Salinas and colleagues, 2020) interleaves encoding and trainable layers, so even a single qubit can represent a complicated function of its input.</p>
${LAB('reupload')}
<h2>Kernels</h2>
<p>A feature map ${m('x → |φ(x)⟩')} defines a kernel ${m('k(x, x′) = |⟨φ(x)|φ(x′)⟩|²')} that a classical support vector machine can use. If the kernel is hard to compute classically and matches the structure of the data, it could help. Havlíček and colleagues demonstrated the idea on hardware in 2019 ([[L:qsvm]] trains one); whether natural data sets have that kind of structure is unsettled.</p>
<h2>Barren plateaus</h2>
<p>McClean and colleagues showed in 2018 that for random, deep enough circuits, the gradient of the cost vanishes exponentially in the number of qubits. The landscape is flat almost everywhere, and estimating such tiny gradients would take exponentially many shots. Later work showed the problem also hits shallow circuits when the cost is global, that is, when it depends on all qubits at once.</p>
${LAB('barren')}
<p>There is an uncomfortable twist. Recent work argues that many models <em>provably free</em> of barren plateaus have enough structure to be simulated, or at least approximated, efficiently on a classical computer. Trainability and quantum advantage may pull in opposite directions, and finding models with both is an open research problem.</p>
<h2>Reasons for caution and for optimism</h2>
<ul>
<li><strong>Data loading.</strong> Getting a large classical data set into amplitudes can cost as much as the computation it was meant to speed up.</li>
<li><strong>Dequantization.</strong> Several proposed exponential speedups for linear algebra in machine learning were matched by classical randomized algorithms once both sides assumed the same kind of data access.</li>
<li><strong>Quantum data.</strong> The clearest advantages so far are for learning about quantum systems themselves: experiments that store quantum outputs and process them on a quantum computer can need exponentially fewer runs than measure-then-analyse approaches (Huang and colleagues, 2022).</li>
</ul>
${CODE('python · pennylane', `
import pennylane as qml
from pennylane import numpy as np

dev = qml.device("default.qubit", wires=1)

@qml.qnode(dev, diff_method="parameter-shift")
def energy(theta):
    qml.RY(theta, wires=0)
    return qml.expval(qml.PauliZ(0) + 0.7 * qml.PauliX(0))

theta = np.array(2.5, requires_grad=True)
print(energy(theta), qml.grad(energy)(theta))
`)}
${NOTE('More models in this track', `<p>Each of these has its own lesson and lab: quantum neural networks and the parameter-shift rule ([[L:qnn]]), quantum convolutional networks ([[L:qcnn]]), quantum kernels ([[L:kernels]]) and support vector machines ([[L:qsvm]]), quantum GANs ([[L:qgan]]), Born machines ([[L:born]]) quantum autoencoders ([[L:qae]]), quantum reservoir computing ([[L:qrc]]) and quantum PCA ([[L:qpca]]). Dequantization ([[L:dequant]]) explains when classical sampling can match such models.</p>`)}
`,
  labs: {
    reupload: {
      title: 'A one-qubit classifier with data re-uploading',
      cap: 'Each layer rotates the qubit by Rz(w₁x₁ + b₁), then Ry(w₂x₂ + b₂), then Rz(b₃). The model predicts “inside” (copper) when the probability of measuring 0 exceeds one half. Training uses central-difference gradients and the Adam optimizer on 160 points.',
      build(body, id) {
        let L = 3, P, mA, vA, step = 0, run = false, data = [], seed = 2;
        const mkData = () => { const R = rng(seed); data = []; for (let i = 0; i < 160; i++) { const x = R() * 2 - 1, y = R() * 2 - 1; data.push([x, y, x * x + y * y < .6 ? 1 : 0]); } };
        const init = () => { const R = rng(seed + 99); P = new Float64Array(5 * L).map(() => (R() - .5) * 2); mA = new Float64Array(5 * L); vA = new Float64Array(5 * L); step = 0; };
        const F = (pp, x, y) => { let v = [0, 0, 1]; for (let l = 0; l < L; l++) { const k = 5 * l; v = V.rot(v, [0, 0, 1], pp[k] * x + pp[k + 1]); v = V.rot(v, [0, 1, 0], pp[k + 2] * y + pp[k + 3]); v = V.rot(v, [0, 0, 1], pp[k + 4]); } return (1 + v[2]) / 2; };
        const loss = pp => { let s = 0; for (const [x, y, c2] of data) s += (F(pp, x, y) - c2) ** 2; return s / data.length; };
        const acc = () => data.filter(([x, y, c2]) => (F(P, x, y) > .5 ? 1 : 0) === c2).length / data.length;
        const train = () => {
          const g = new Float64Array(P.length), e = 1e-3;
          for (let i = 0; i < P.length; i++) { const a = P.slice(), b = P.slice(); a[i] += e; b[i] -= e; g[i] = (loss(a) - loss(b)) / (2 * e); }
          step++; for (let i = 0; i < P.length; i++) { mA[i] = .9 * mA[i] + .1 * g[i]; vA[i] = .999 * vA[i] + .001 * g[i] * g[i]; P[i] -= .08 * (mA[i] / (1 - .9 ** step)) / (Math.sqrt(vA[i] / (1 - .999 ** step)) + 1e-8); }
        };
        const cv = canvas('sq', 'max-width:360px;margin:0 auto'), ro = h('div', { class: 'readout' });
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), G = 56, off = document.createElement('canvas'); off.width = G; off.height = G; const ox = off.getContext('2d'), img = ox.createImageData(G, G), A = rgbOf(T.cyan), B = rgbOf(T.copper), M = rgbOf(T.surface);
          for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const f = F(P, (i + .5) / G * 2 - 1, 1 - (j + .5) / G * 2), c0 = f > .5 ? B : A, t = Math.min(1, Math.abs(f - .5) * 2) * .55, k = (j * G + i) * 4; for (let z = 0; z < 3; z++) img.data[k + z] = M[z] + (c0[z] - M[z]) * t; img.data[k + 3] = 255; }
          ox.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, w, H);
          ctx.strokeStyle = T.ink; ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(w / 2, H / 2, Math.sqrt(.6) * w / 2, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          for (const [x, y, c2] of data) { const px = (x + 1) / 2 * w, py = (1 - y) / 2 * H, ok = (F(P, x, y) > .5 ? 1 : 0) === c2; dot(ctx, px, py, 3.6, c2 ? T.copper : T.cyan, ok ? T.surface : T.ink); }
        });
        const upd = () => { ro.innerHTML = `<span class="k">layers </span>${L} · <span class="k">parameters </span>${5 * L} · <span class="k">steps </span>${step}<br><span class="k">loss </span>${num(loss(P), 4)} · <span class="k">accuracy </span><b>${pct(acc(), 1)}</b>`; pc.inv(); };
        Scope.tick(() => { if (!run) return; train(); train(); if (step % 4 === 0) upd(); if (step >= 600) { run = false; rb.textContent = 'Train'; upd(); } });
        const rb = btn('Train', () => { run = !run; rb.textContent = run ? 'Pause' : 'Train'; }, 'pri');
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' },
          field('Layers', seg([1, 2, 3, 4, 6].map(v => ({ v, label: String(v) })), L, v => { L = v; init(); upd(); }, 'Layers')),
          h('div', { class: 'btns' }, rb, btn('Reset weights', () => { seed++; init(); upd(); }), btn('New data', () => { seed += 7; mkData(); init(); upd(); })), ro,
          h('p', { class: 'hint' }, 'Points with a dark ring are misclassified; the dashed circle is the true boundary. One layer cannot draw a circle; three or more usually can.'))));
        mkData(); init(); upd();
      }
    },
    barren: {
      title: 'Watching gradients vanish',
      cap: 'Hardware-efficient circuits: each layer applies random Ry and Rz rotations to every qubit, then a ladder of CZ gates. For 40 random parameter settings per point, the gradient with respect to the first angle is computed exactly by parameter shift, and its variance is plotted on a log scale.',
      build(body, id) {
        const NS = [2, 4, 6, 8, 10], S = 40; let depth = 'shallow', res = {}, queue = [], run = true;
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'chipline' });
        const circuit = (n, Lr, pp) => { const s = new QState(n); let k = 0; for (let l = 0; l < Lr; l++) { for (let q = 0; q < n; q++) { s.apply(q, Ry(pp[k++])); s.apply(q, Rz(pp[k++])); } for (let q = 0; q + 1 < n; q++) s.cz(q, q + 1); } return s; };
        const costs = s => { const p = s.probs(); let loc = 0; for (let i = 0; i < p.length; i++) loc += p[i] * (((i >> (s.n - 1)) ^ (i >> (s.n - 2))) & 1 ? -1 : 1); return [loc, p[0]]; };
        const reset = () => { res = {}; queue = []; for (const n of NS) { res[n] = { loc: [], glob: [] }; for (let k = 0; k < S; k++) queue.push(n); } pc.inv(); };
        const variance = a => { if (a.length < 2) return null; const mu = a.reduce((x, y) => x + y, 0) / a.length; return a.reduce((x, y) => x + (y - mu) ** 2, 0) / a.length; };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1.5, 10.5], y: [1e-7, 1], ylog: true, xt: NS, yt: [1e-6, 1e-4, 1e-2, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'qubits n', yl: 'Var(∂C/∂θ₁)' });
          for (const [k, col, lab] of [['loc', T.cyan, 'local cost ⟨Z₀Z₁⟩'], ['glob', T.copper, 'global cost P(00…0)']]) {
            const pts = []; for (const n of NS) { const v = variance(res[n][k]); if (v != null && v > 0) pts.push([A.X(n), A.Y(clamp(v, 1e-7, 1))]); }
            polyline(ctx, pts, col, 2.2); pts.forEach(p => dot(ctx, p[0], p[1], 4, col)); if (pts.length) txt(ctx, lab, A.L + 8, k === 'loc' ? A.T + 26 : A.T + 42, { align: 'left', color: col, font: '600 11px "JetBrains Mono",monospace' });
          }
        });
        Scope.tick(() => {
          if (!run || !queue.length) return; const t0 = performance.now();
          while (queue.length && performance.now() - t0 < 12) {
            const n = queue.shift(), Lr = depth === 'shallow' ? 2 : n, pp = new Float64Array(2 * n * Lr).map(() => Math.random() * TAU);
            const a = pp.slice(), b = pp.slice(); a[0] += PI / 2; b[0] -= PI / 2;
            const [la, ga] = costs(circuit(n, Lr, a)), [lb, gb] = costs(circuit(n, Lr, b));
            res[n].loc.push((la - lb) / 2); res[n].glob.push((ga - gb) / 2);
          }
          ro.innerHTML = `<span>samples done <b>${NS.reduce((s, n) => s + res[n].loc.length, 0)} of ${NS.length * S}</b></span>`;
          pc.inv();
        });
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' },
          field('Circuit depth', seg([{ v: 'shallow', label: '2 layers' }, { v: 'deep', label: 'n layers' }], depth, v => { depth = v; reset(); }, 'Depth')),
          btn('Sample again', reset), ro,
          h('p', { class: 'hint' }, 'With 2 layers, the local cost keeps a healthy gradient while the global cost’s gradient collapses exponentially. With n layers both start to vanish.'))));
        reset();
      }
    }
  },
  take: ['Quantum models encode data into circuits and train gate parameters; re-uploading increases expressivity.',
    'Quantum kernels help only if they are hard to compute classically and match the data.',
    'Barren plateaus make gradients vanish exponentially for deep random circuits and for global costs.',
    'The clearest advantages so far involve quantum data, not classical data sets.'],
  quiz: [
    { q: 'Which cost function is most prone to barren plateaus in shallow circuits?', o: ['A local cost on two qubits', 'A global cost depending on all qubits', 'Any classical loss', 'None; shallow circuits never have them'], a: 1, why: 'Global costs concentrate exponentially even at low depth.' },
    { q: 'What often erases claimed QML speedups on classical data?', o: ['Too few qubits', 'The cost of loading data into amplitudes', 'Measurement being too fast', 'Lack of entanglement'], a: 1, why: 'State preparation for large data sets can cost as much as the computation itself.' }
  ]
});

/* ---------------- 38 · Quantum information theory ---------------- */
LESSONS.push({
  id: 'infotheory', n: 38, stage: QIT, minutes: 14, title: 'Quantum information theory',
  lede: 'How much information does a qubit carry, how is entanglement measured, and how much can a noisy channel transmit? These are questions with exact, often surprising, mathematical answers.',
  html: `
<h2>Entropy</h2>
<p>The von Neumann entropy ${m('S(ρ) = −Tr ρ log₂ ρ')} is the quantum version of Shannon entropy: zero for pure states, one bit for a maximally mixed qubit. Schumacher’s theorem says it is the number of qubits per copy needed to compress a quantum source, just as Shannon entropy counts bits for a classical source. For a pure state of two parts, the entropy of either part is the <strong>entanglement entropy</strong>, the measure used in [[L:tensornet]].</p>
<h2>How much a qubit can carry</h2>
<p>A qubit has infinitely many states, but <strong>Holevo’s bound</strong> limits what can be extracted: ${m('n')} qubits sent from one party to another convey at most ${m('n')} classical bits. Entanglement changes the accounting. With a Bell pair shared in advance, one transmitted qubit carries two bits, <strong>superdense coding</strong>. Teleportation is the mirror image: two classical bits plus a Bell pair carry one qubit.</p>
${LAB('dense')}
<h2>Entangled is not the same as nonlocal</h2>
<p>Mix a Bell state with white noise: ${m('ρ = p|Φ⁺⟩⟨Φ⁺| + (1 − p) I/4')}. This <strong>Werner state</strong> is entangled for every ${m('p > 1/3')}, but it violates the CHSH inequality only for ${m('p > 1/√2 ≈ 0.71')}. Werner showed in 1989 that some entangled states can be reproduced by local hidden-variable models for all measurements. Entanglement, Bell nonlocality and usefulness for particular tasks are related but distinct resources.</p>
${LAB('werner')}
<h2>Further results worth knowing</h2>
<ul>
<li><strong>Monogamy.</strong> If two qubits are maximally entangled, neither can be entangled with anything else. This is the deep reason QKD ([[L:bb84]]) can certify that an eavesdropper knows nothing.</li>
<li><strong>Data processing.</strong> No local operation increases the distinguishability of states or the information between two parties.</li>
<li><strong>Channel capacities.</strong> A noisy quantum channel has several capacities: for classical bits, for qubits, and for bits with entanglement assistance. The quantum capacity is given by the coherent information, optimized over many uses of the channel.</li>
<li><strong>Superactivation.</strong> Smith and Yard showed in 2008 that two channels which each have zero quantum capacity can have positive capacity when used together. Nothing like it happens classically.</li>
</ul>
`,
  labs: {
    dense: {
      title: 'Superdense coding',
      cap: 'Alice and Bob share |Φ⁺⟩. Alice applies Xᵇ and then Zᵃ to her qubit only, and sends it. Bob undoes the entangling circuit (CNOT, then H) and reads both bits with certainty.',
      build(body, id) {
        let a = 1, b = 0, stp = 0;
        const circ = h('div', { class: 'circ-wrap' }), ketEl = h('div', { class: 'ketline' }), stat = h('div', { class: 'status' }), barsEl = h('div'), bars = stateBars(barsEl, 2, { height: 120 });
        const COLS = [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'Xᵇ', q: 0 }], [{ g: 'Zᵃ', q: 0 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'H', q: 0 }], [{ g: 'M', q: 0 }, { g: 'M', q: 1 }]];
        const TX = ['Alice (q0) and Bob (q1) start in |00⟩.', 'Shared Bell pair being made.', 'They share |Φ⁺⟩. Bob takes q1 away.', `Alice applies ${b ? 'X' : 'nothing'} (bit b = ${b}).`, `Alice applies ${a ? 'Z' : 'nothing'} (bit a = ${a}) and sends q0 to Bob.`, 'Bob applies CNOT.', 'Bob applies H.', `Bob measures: ${a}${b}. Two bits from one transmitted qubit.`];
        const state = () => { const s = new QState(2); const k = stp; if (k >= 1) s.g('H', 0); if (k >= 2) s.cx(0, 1); if (k >= 3 && b) s.g('X', 0); if (k >= 4 && a) s.g('Z', 0); if (k >= 5) s.cx(0, 1); if (k >= 6) s.g('H', 0); return s; };
        const render = () => {
          circ.innerHTML = ''; circ.append(drawCircuit(2, COLS, { at: Math.min(stp, 7), cw: 58, labels: ['q0 Alice', 'q1 Bob'], lw: 74 }).svg);
          const s = state(); bars.state(s.re, s.im); ketEl.textContent = '|ψ⟩ = ' + ketString(s.re, s.im, 2);
          TX[3] = `Alice applies ${b ? 'X' : 'nothing'} (bit b = ${b}).`; TX[4] = `Alice applies ${a ? 'Z' : 'nothing'} (bit a = ${a}) and sends q0 to Bob.`; TX[7] = `Bob measures |${a}${b}⟩ with certainty: two bits from one transmitted qubit.`;
          stat.className = 'status' + (stp >= 6 ? ' good' : ''); stat.textContent = TX[Math.min(stp + (stp >= 6 ? 1 : 0), 7)];
        };
        body.append(circ, h('div', { class: 'split' }, h('div', { class: 'stack' }, barsEl, ketEl, stat),
          h('div', { class: 'stack' }, field('Message ab', seg(['00', '01', '10', '11'].map(v => ({ v, label: v })), '10', v => { a = +v[0]; b = +v[1]; render(); }, 'Message')),
            h('div', { class: 'btns' }, btn('Back', () => { if (stp) { stp--; render(); } }), btn('Next', () => { if (stp < 6) { stp++; render(); } }, 'pri'), btn('Run all', () => { stp = 6; render(); })))));
        render();
      }
    },
    werner: {
      title: 'The Werner state',
      cap: 'Mixing |Φ⁺⟩ with white noise. The bar shows three regimes: separable (p ≤ 1/3), entangled but explainable by local hidden variables for CHSH (1/3 < p ≤ 1/√2), and Bell-violating (p > 1/√2). The chart shows the best CHSH value 2√2·p.',
      build(body, id) {
        let p = .6;
        const cv = canvas('', 'height:200px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), band = h('div', { class: 'wband' });
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 1], y: [0, 3], xt: [0, 1 / 3, .5, S2, 1], xf: v => num(v, 2), yt: [0, 1, 2, 3], xl: 'mixing p', yl: 'best CHSH value S' });
          ctx.fillStyle = rgba(T.cyan, .12); ctx.fillRect(A.X(1 / 3), A.T, A.X(S2) - A.X(1 / 3), A.B - A.T); ctx.fillStyle = rgba(T.copper, .14); ctx.fillRect(A.X(S2), A.T, A.R - A.X(S2), A.B - A.T);
          polyline(ctx, [[A.L, A.Y(2)], [A.R, A.Y(2)]], T.muted, 1.2, [5, 4]); txt(ctx, 'classical limit 2', A.L + 6, A.Y(2) - 9, { align: 'left' });
          polyline(ctx, [[A.X(0), A.Y(0)], [A.X(1), A.Y(2 * Math.SQRT2)]], T.copper, 2.4); dot(ctx, A.X(p), A.Y(2 * Math.SQRT2 * p), 6, T.ink, T.surface);
        });
        const upd = () => {
          const l1 = (1 + 3 * p) / 4, l2 = (1 - p) / 4, S = -(l1 > 0 ? l1 * Math.log2(l1) : 0) - 3 * (l2 > 0 ? l2 * Math.log2(l2) : 0), C = Math.max(0, (3 * p - 1) / 2), F = l1;
          ro.innerHTML = `<span class="k">fidelity with |Φ⁺⟩ </span>${num(F, 3)} · <span class="k">concurrence </span>${num(C, 3)} · <span class="k">entropy </span>${num(S, 3)} bits · <span class="k">max CHSH </span>${num(2 * Math.SQRT2 * p, 3)}`;
          band.innerHTML = `<span style="width:33.3%">separable</span><span style="width:${(S2 - 1 / 3) * 100}%">entangled, local</span><span style="width:${(1 - S2) * 100}%">violates CHSH</span><i style="left:${p * 100}%"></i>`;
          pc.inv();
        };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, band), h('div', { class: 'stack' },
          slider({ id: id('p'), label: 'Weight p of the Bell state', min: 0, max: 1, step: .01, value: p, fmt: v => num(v, 2), on: v => { p = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['Von Neumann entropy measures quantum information; for pure bipartite states it measures entanglement.',
    'Holevo: n qubits carry at most n classical bits, but superdense coding sends 2 bits per qubit with shared entanglement.',
    'Werner states are entangled for p > 1/3 but violate CHSH only for p > 1/√2.',
    'Monogamy, data processing and channel capacities (with superactivation) shape what quantum networks can do.'],
  quiz: [
    { q: 'With a shared Bell pair, how many classical bits can one transmitted qubit carry?', o: ['1', '2', '4', 'Unlimited'], a: 1, why: 'Superdense coding: the four Bell states encode two bits.' },
    { q: 'A Werner state with p = 0.5 is…', o: ['Separable', 'Entangled but cannot violate CHSH', 'Bell-violating', 'Pure'], a: 1, why: '1/3 < 0.5 < 0.707: entangled, yet its maximum CHSH value is 2√2 × 0.5 ≈ 1.41.' }
  ]
});

/* ---------------- 39 · Post-quantum cryptography ---------------- */
LESSONS.push({
  id: 'pqc', n: 39, stage: QIT, minutes: 14, title: 'Post-quantum cryptography',
  lede: 'Shor’s algorithm breaks the public-key cryptography the internet runs on. Post-quantum cryptography replaces it with classical algorithms built on problems that quantum computers are not known to solve.',
  html: `
<h2>What breaks and what doesn’t</h2>
<ul>
<li><strong>Broken by Shor’s algorithm:</strong> RSA, finite-field Diffie–Hellman and elliptic-curve cryptography (ECDH, ECDSA, Ed25519). All rest on factoring or discrete logarithms.</li>
<li><strong>Weakened by Grover’s algorithm:</strong> symmetric ciphers and hash functions, by at most a square-root factor. Grover search parallelizes poorly, so the practical impact is smaller still; using 256-bit keys, such as AES-256, keeps a wide margin.</li>
</ul>
<p>The urgency comes from <strong>harvest now, decrypt later</strong>: encrypted traffic recorded today can be decrypted once a large enough quantum computer exists. Data that must stay secret for decades is already exposed.</p>
<h2>The NIST standards</h2>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Standard</th><th>Use</th><th>Based on</th><th>Public key</th><th>Ciphertext or signature</th></tr></thead><tbody>
<tr><td>ML-KEM-768 (FIPS 203)</td><td>Key exchange</td><td>Module lattices (Kyber)</td><td>1,184 bytes</td><td>1,088 bytes</td></tr>
<tr><td>ML-DSA-65 (FIPS 204)</td><td>Signatures</td><td>Module lattices (Dilithium)</td><td>1,952 bytes</td><td>3,309 bytes</td></tr>
<tr><td>SLH-DSA-128s (FIPS 205)</td><td>Signatures</td><td>Hash functions only (SPHINCS+)</td><td>32 bytes</td><td>7,856 bytes</td></tr>
<tr><td>FN-DSA-512 (draft FIPS 206)</td><td>Signatures</td><td>NTRU lattices (Falcon)</td><td>897 bytes</td><td>about 666 bytes</td></tr>
<tr><td>HQC (selected 2025)</td><td>Key exchange, backup</td><td>Error-correcting codes</td><td colspan="2">Chosen so KEMs do not all rely on lattices</td></tr>
<tr><td>X25519 (today)</td><td>Key exchange</td><td>Elliptic curves</td><td>32 bytes</td><td>32 bytes</td></tr>
<tr><td>ECDSA P-256 (today)</td><td>Signatures</td><td>Elliptic curves</td><td>64 bytes</td><td>64 bytes</td></tr>
</tbody></table></div>
<p>NIST published FIPS 203, 204 and 205 in August 2024. Falcon is being standardized as FN-DSA in FIPS 206, and HQC was selected in March 2025 as a code-based alternative to ML-KEM. Post-quantum keys and signatures are larger, which matters for constrained devices and for protocols that send many certificates.</p>
<h2>Learning with errors</h2>
<p>Most of these schemes rest on <strong>learning with errors</strong> (LWE), introduced by Oded Regev in 2005. Given many noisy linear equations ${m('b = As + e (mod q)')}, with small random errors ${m('e')}, find the secret ${m('s')}. Without the errors, Gaussian elimination solves it instantly. With them, the best known classical and quantum algorithms take exponential time, and Regev showed that solving LWE would solve worst-case lattice problems. ML-KEM uses a structured version over polynomial rings (module-LWE), with ${m('q = 3329')}, for efficiency.</p>
${LAB('lwe')}
<h2>Migration</h2>
<p>Large deployments already use <strong>hybrid</strong> key exchange, combining X25519 with ML-KEM so that security holds if either one survives; major browsers and content networks enabled this for TLS in 2024. NIST’s draft transition guidance (IR 8547) proposes deprecating quantum-vulnerable public-key algorithms by 2030 and disallowing them by 2035. Hybrids are a sensible hedge: SIKE, an isogeny-based finalist in NIST’s process, was broken in 2022 by a classical attack that ran in about an hour on a laptop.</p>
${NOTE('Two different answers to one threat', `<p>Post-quantum cryptography (this lesson) runs on ordinary computers and replaces vulnerable mathematics. Quantum key distribution ([[L:bb84]]) uses quantum hardware and physics. They are complementary, and most organizations will rely on post-quantum cryptography because it works over existing networks.</p>`)}
`,
  labs: {
    lwe: {
      title: 'A toy LWE encryption scheme',
      cap: 'Regev-style encryption with n = 6, q = 97 and 12 public samples. To encrypt a bit, add up a random subset of the public samples and add ⌊q/2⌋ for a 1. Decryption subtracts ⟨u, s⟩ and checks whether the result is near 0 (bit 0, blue arc) or near q/2 (bit 1, copper arc). The leftover error is the sum of the chosen e values; when it grows past q/4, decryption fails.',
      build(body, id) {
        const n = 6, q = 97, m2 = 12; let B = 3, s, A, e, b, runs = [], last = null;
        const R = Math.random, mod = x => ((x % q) + q) % q;
        const keys = () => { s = [...Array(n)].map(() => Math.floor(R() * q)); A = [...Array(m2)].map(() => [...Array(n)].map(() => Math.floor(R() * q))); e = [...Array(m2)].map(() => Math.floor(R() * (2 * B + 1)) - B); b = A.map((row, i) => mod(row.reduce((acc, a2, j) => acc + a2 * s[j], 0) + e[i])); runs = []; last = null; };
        const enc = mu => { let S = []; while (!S.length) S = [...Array(m2).keys()].filter(() => R() < .5); const u = [...Array(n)].map((_, j) => mod(S.reduce((acc, i) => acc + A[i][j], 0))), v = mod(S.reduce((acc, i) => acc + b[i], 0) + mu * Math.floor(q / 2)); return { mu, S, u, v }; };
        const dec = c2 => { const d = mod(c2.v - c2.u.reduce((acc, x, j) => acc + x * s[j], 0)); return { d, bit: d > q / 4 && d < 3 * q / 4 ? 1 : 0 }; };
        const cv = canvas('sq', 'max-width:300px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal;font-size:12px' }), stat = h('div', { class: 'status' });
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), cx = w / 2, cy = H / 2, R0 = Math.min(w, H) * .38, ang = x => -PI / 2 + TAU * x / q;
          ctx.lineWidth = 14; ctx.strokeStyle = rgba(T.cyan, .35); ctx.beginPath(); ctx.arc(cx, cy, R0, ang(-q / 4), ang(q / 4)); ctx.stroke();
          ctx.strokeStyle = rgba(T.copper, .35); ctx.beginPath(); ctx.arc(cx, cy, R0, ang(q / 4), ang(3 * q / 4)); ctx.stroke();
          txt(ctx, '0', cx, cy - R0 - 18, { color: T.ink, font: '700 13px "JetBrains Mono",monospace' }); txt(ctx, '⌊q/2⌋', cx, cy + R0 + 18, { color: T.ink, font: '700 13px "JetBrains Mono",monospace' });
          for (const r of runs.slice(-250)) { const a = ang(r.d), jit = R0 + (r.mu ? -26 : 26) + (r.k % 7) - 3; dot(ctx, cx + jit * Math.cos(a), cy + jit * Math.sin(a), 3, r.mu ? T.copper : T.cyan, r.bit !== r.mu ? T.bad : null); }
          txt(ctx, 'decrypted values', cx, cy, { color: T.muted });
        });
        const upd = () => {
          const bad = runs.filter(r => r.bit !== r.mu).length;
          ro.innerHTML = `<span class="k">secret s </span>(${s.join(', ')})<br><span class="k">errors e </span>(${e.join(', ')})<br><span class="k">public b </span>(${b.join(', ')})` + (last ? `<br><span class="k">last ciphertext </span>u = (${last.u.join(', ')}), v = ${last.v} · encrypted ${last.mu}, decrypted ${dec(last).bit} (value ${dec(last).d})` : '');
          stat.className = 'status' + (runs.length ? (bad ? ' bad' : ' good') : ''); stat.textContent = runs.length ? `${runs.length} encryptions, ${bad} decryption failure${bad === 1 ? '' : 's'} (${pct(bad / runs.length, 1)}). ${bad ? 'The accumulated error sometimes crossed q/4.' : 'Errors stayed well below q/4.'}` : 'Encrypt some bits.';
          pc.inv();
        };
        const go = k => { for (let i = 0; i < k; i++) { const mu = R() < .5 ? 1 : 0, c2 = enc(mu), dd = dec(c2); runs.push({ mu, d: dd.d, bit: dd.bit, k: runs.length }); last = c2; } upd(); };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' },
          slider({ id: id('B'), label: 'Error size: each eᵢ between −B and B', min: 0, max: 12, step: 1, value: B, fmt: String, on: v => { B = v; keys(); upd(); } }),
          h('div', { class: 'btns' }, btn('Encrypt 1 bit', () => go(1)), btn('Encrypt 200 bits', () => go(200), 'pri'), btn('New keys', () => { keys(); upd(); })), stat, ro)));
        keys(); go(60);
      }
    }
  },
  take: ['Shor breaks RSA, Diffie–Hellman and elliptic curves; Grover only modestly weakens symmetric crypto.',
    'NIST’s standards: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), with FN-DSA and HQC to follow.',
    'Learning with errors is easy without noise and believed hard with it, for classical and quantum computers alike.',
    'Migration is under way with hybrid key exchange; harvest-now-decrypt-later makes it urgent for long-lived secrets.'],
  quiz: [
    { q: 'Which of these does Shor’s algorithm NOT break?', o: ['RSA', 'ECDSA', 'ML-KEM', 'Diffie–Hellman'], a: 2, why: 'ML-KEM rests on module lattices, for which no efficient quantum algorithm is known.' },
    { q: 'Why is LWE easy without the error term?', o: ['Because q is prime', 'Gaussian elimination solves exact linear equations', 'Because s is small', 'Because Grover applies'], a: 1, why: 'Noise-free linear equations mod q are solved directly; the small errors are what make it hard.' }
  ]
});

window.GLOSSARY_EXTRA.push(
  ['Peephole optimization', 'Rewriting a few adjacent gates at a time: cancellations, merges and template substitutions.', 'optimize'],
  ['ZX-calculus', 'A graphical language for quantum circuits with complete rewrite rules, used for optimization.', 'zx'],
  ['Routing', 'Inserting SWAP gates so that every two-qubit gate acts on physically connected qubits.', 'routing'],
  ['SABRE', 'A widely used heuristic for qubit layout and SWAP routing with look-ahead.', 'routing'],
  ['OpenQASM', 'An assembly-like language for quantum circuits; version 3 adds classical control and timing.', 'routing'],
  ['Dynamical decoupling', 'Pulse sequences applied to idle qubits that echo away slow noise.', 'routing'],
  ['Jordan–Wigner transformation', 'Maps fermionic modes to qubits, using strings of Z operators to keep fermionic signs.', 'chemistry'],
  ['Correlation energy', 'The difference between the exact ground energy and the Hartree–Fock (mean-field) energy.', 'chemistry'],
  ['Chemical accuracy', 'About 1.6 millihartree (1 kcal/mol), the precision needed for useful chemical predictions.', 'chemistry'],
  ['Data re-uploading', 'Encoding the same input several times between trainable layers to make a quantum model more expressive.', 'qml'],
  ['Barren plateau', 'A cost landscape whose gradients vanish exponentially with the number of qubits.', 'qml'],
  ['Quantum kernel', 'A similarity measure k(x, x′) = |⟨φ(x)|φ(x′)⟩|² computed with a quantum feature map.', 'kernels'],
  ['Von Neumann entropy', 'S(ρ) = −Tr ρ log ρ, the quantum generalization of Shannon entropy.', 'infotheory'],
  ['Holevo bound', 'n qubits can convey at most n classical bits without pre-shared entanglement.', 'infotheory'],
  ['Superdense coding', 'Sending two classical bits with one qubit, using a pre-shared Bell pair.', 'superdense'],
  ['Werner state', 'A Bell state mixed with white noise; entangled for p > 1/3, Bell-violating only for p > 1/√2.', 'infotheory'],
  ['Post-quantum cryptography', 'Classical cryptography designed to resist attacks by quantum computers.', 'pqc'],
  ['Learning with errors (LWE)', 'Recovering a secret from noisy linear equations mod q; the basis of ML-KEM and ML-DSA.', 'pqc'],
  ['ML-KEM', 'The NIST lattice-based key-encapsulation standard (FIPS 203), derived from Kyber.', 'pqc'],
  ['Harvest now, decrypt later', 'Recording encrypted data today to decrypt it once a quantum computer exists.', 'pqc']
);
})();
