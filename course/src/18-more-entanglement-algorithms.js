/* =====================================================================
   Stage 3 additions · GHZ and the Mermin game, entanglement swapping
   Stage 4 additions · quantum walks, amplitude estimation, adiabatic computing
   ===================================================================== */
(() => {
const ENT = 2, ALGS = 3;
const tile = (ctx, x, y, w, hh, ok) => { const T = Theme.get(); if (ok) { ctx.fillStyle = T.good; ctx.fillRect(x, y, w, hh); } else { ctx.strokeStyle = T.bad; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + hh); ctx.moveTo(x + w, y); ctx.lineTo(x, y + hh); ctx.stroke(); } };

/* ---------------- GHZ and the Mermin game ---------------- */
const ghzState = () => { const s = new QState(3); s.g('H', 0); s.cx(0, 1); s.cx(0, 2); return s; };
const wState = () => { const s = new QState(3); s.re[0] = 0; s.re[1] = s.re[2] = s.re[4] = 1 / Math.sqrt(3); return s; };
LESSONS.push({
  id: 'ghz', n: 8.5, stage: ENT, minutes: 15, title: 'GHZ states and the Mermin game',
  lede: 'With three entangled qubits the clash with local realism stops being statistical. A single, perfectly predictable set of results is enough, and it turns into a game that quantum players always win.',
  html: `
<h2>Three-way entanglement</h2>
<p>The <strong>GHZ state</strong>, named after Daniel Greenberger, Michael Horne and Anton Zeilinger, is</p>
${EQ('|GHZ⟩ = (|000⟩ + |111⟩) / √2')}
<p>Measure any one qubit in Z and the other two are fixed to the same value. It is the three-qubit cousin of a Bell pair and is prepared the same way: a Hadamard on the first qubit followed by CNOTs fanning out to the others. A second family, the <strong>W state</strong> ${m('(|001⟩ + |010⟩ + |100⟩)/√3')}, shares one excitation among three qubits. In 2000, Dür, Vidal and Cirac showed that GHZ and W are genuinely different kinds of entanglement: no local operations and classical communication can turn one into the other, even with a small chance of success.</p>
<h2>Contradiction without statistics</h2>
<p>CHSH ([[L:entanglement]]) shows that quantum correlations beat local hidden variables on average, after many runs. David Mermin’s 1990 version of the GHZ argument needs no averaging. The GHZ state is an eigenstate of four products of Pauli operators:</p>
${EQ('XXX = +1,&nbsp;&nbsp; XYY = −1,&nbsp;&nbsp; YXY = −1,&nbsp;&nbsp; YYX = −1')}
<p>Each of these is certain: measure X on all three qubits and the product of the three ±1 results is always +1. Now suppose each qubit secretly carried predetermined answers ${m('x<sub>i</sub>')} and ${m('y<sub>i</sub>')} (each ±1) for an X or Y measurement. Multiply the last three equations: every ${m('y<sub>i</sub>')} appears twice and squares to 1, leaving ${m('x₁x₂x₃ = (−1)³ = −1')}. That contradicts the first equation. No assignment of hidden answers can reproduce all four certainties.</p>
<h2>The Mermin game</h2>
<p>The same argument becomes a cooperative game. A referee sends each of three separated players one bit, ${m('x, y, z')}, chosen uniformly from 000, 011, 101 and 110. Each player returns a bit, ${m('a, b, c')}, without communicating. They win if ${m('a ⊕ b ⊕ c = x ∨ y ∨ z')}: even parity for the input 000, odd parity for the other three.</p>
<p>Any classical strategy, even with shared randomness, wins at most 3 of the 4 input cases, so 75% on average. Players sharing a GHZ state win every round: each measures X if their bit is 0 and Y if it is 1, and answers 0 for a +1 result and 1 for −1. The four inputs correspond to exactly the four certain products above.</p>
${LAB('mermin')}
${NOTE('A cousin with no entanglement needed', `<p>The Mermin game uses entanglement between three players. The Peres–Mermin square makes a similar point about predetermined values with just two qubits and any state at all, and turns into a two-player game that entangled players always win ([[L:contextuality]]).</p>`)}
<h2>Fragile and robust entanglement</h2>
<p>GHZ entanglement is all or nothing. Look at any two of the three qubits and ignore the third, and the pair is not entangled at all; the correlation lives only in the whole. Measure one qubit in Z and the rest collapse to ${m('|00⟩')} or ${m('|11⟩')}. But measure it in X and the other two are left in a Bell pair: the observer’s choice of measurement on one qubit decides whether the others stay entangled. The W state behaves the other way round. Every pair is partly entangled, and losing one qubit leaves the other two entangled.</p>
${LAB('fragile')}
<h2>Uses</h2>
<ul>
<li><strong>Sensing.</strong> In an ${m('N')}-qubit GHZ state a phase ${m('φ')} on each qubit adds up to a collective phase ${m('Nφ')}, which can improve precision from ${m('1/√N')} to the Heisenberg limit ${m('1/N')}, at the cost of extreme fragility.</li>
<li><strong>Error correction.</strong> GHZ states are the codewords of the repetition code and the “cat states” used in some fault-tolerant syndrome measurements.</li>
<li><strong>Benchmarks.</strong> Preparing a large GHZ state and verifying its coherence is a demanding whole-chip test; processors now produce GHZ states spanning dozens of qubits.</li>
</ul>
`,
  labs: {
    mermin: {
      title: 'Play the Mermin game',
      cap: 'Choose a classical strategy by setting each player’s answer for input 0 and input 1, or switch to the quantum strategy. The table checks the four possible inputs. Played rounds appear as tiles: filled for a win, crossed for a loss. Quantum rounds are sampled from a simulated GHZ state.',
      build(body, id) {
        let mode = 'q', tab = [[0, 0], [0, 0], [0, 0]], log = [];
        const INS = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]];
        const tbl = h('div', { class: 'tbl-wrap' }), cv = canvas('', 'height:56px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), last = h('div', { class: 'status' }), strat = h('div', { class: 'stack' });
        const quantum = inp => { const s = ghzState(); inp.forEach((b, q) => { if (b) { s.g('Sdg', q); } s.g('H', q); }); return [0, 1, 2].map(q => s.measure(q)); };
        const classical = inp => inp.map((b, q) => tab[q][b]);
        const play = n => {
          for (let k = 0; k < n; k++) { const inp = INS[Math.floor(Math.random() * 4)], out = mode === 'q' ? quantum(inp) : classical(inp), need = inp[0] | inp[1] | inp[2]; log.push({ inp, out, win: ((out[0] ^ out[1] ^ out[2]) === need) }); }
          if (log.length > 5000) log = log.slice(-5000); render();
        };
        const tiles = painter(cv, ({ ctx, w, h: H }) => { const n = Math.floor((w - 4) / 11), L = log.slice(-n); L.forEach((r, k) => tile(ctx, 2 + k * 11, 14, 8, 26, r.win)); });
        const render = () => {
          const rows = INS.map(inp => { const need = inp[0] | inp[1] | inp[2]; if (mode === 'q') { const ops = inp.map(b => b ? 'Y' : 'X').join(''); return `<tr><td>${inp.join('')}</td><td>${need ? 'odd' : 'even'}</td><td>measure ${ops}: product ${ops === 'XXX' ? '+1' : '−1'}</td><td style="color:var(--good)">always wins</td></tr>`; }
            const out = classical(inp), par = out[0] ^ out[1] ^ out[2], ok = par === need; return `<tr><td>${inp.join('')}</td><td>${need ? 'odd' : 'even'}</td><td>answers ${out.join('')} (${par ? 'odd' : 'even'})</td><td style="color:var(${ok ? '--good' : '--bad'})">${ok ? 'win' : 'lose'}</td></tr>`; });
          const cw = mode === 'c' ? INS.filter(inp => { const o = classical(inp); return (o[0] ^ o[1] ^ o[2]) === (inp[0] | inp[1] | inp[2]); }).length : 4;
          tbl.innerHTML = `<table class="tbl"><thead><tr><th>input xyz</th><th>needed parity</th><th>${mode === 'q' ? 'quantum players' : 'your strategy'}</th><th>result</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
          const n = log.length, wins = log.filter(r => r.win).length, lr = log[n - 1];
          ro.innerHTML = `<span class="k">rounds </span>${n} &nbsp; <span class="k">win rate </span>${n ? pct(wins / n, 1) : '—'} &nbsp; <span class="k">this strategy covers </span>${cw} of 4 inputs (${pct(cw / 4, 0)})`;
          last.className = 'status' + (lr ? (lr.win ? ' good' : ' bad') : ''); last.textContent = lr ? `Last round: inputs ${lr.inp.join('')}, answers ${lr.out.join('')}, parity ${(lr.out[0] ^ lr.out[1] ^ lr.out[2]) ? 'odd' : 'even'}: ${lr.win ? 'win' : 'loss'}.` : 'Play a round.';
          tiles.inv();
        };
        const mkStrat = () => {
          strat.innerHTML = ''; if (mode === 'q') { strat.append(h('p', { class: 'hint', style: 'margin:0' }, 'Each player measures X on input 0 and Y on input 1, then answers 0 for +1 and 1 for −1.')); return; }
          ['Alice', 'Bob', 'Charlie'].forEach((nm, q) => strat.append(h('div', { class: 'btns' }, h('span', { class: 'ctl-label', style: 'min-width:64px' }, nm),
            ...[0, 1].map(b => h('button', { type: 'button', class: 'btn sm', onclick: () => { tab[q][b] ^= 1; log = []; mkStrat(); render(); } }, `input ${b} → ${tab[q][b]}`)))));
        };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'q', label: 'Quantum (shared GHZ)' }, { v: 'c', label: 'Classical strategy' }], mode, v => { mode = v; log = []; mkStrat(); render(); }, 'Strategy'),
          btn('Play 1 round', () => play(1), 'sm'), btn('Play 100 rounds', () => play(100), 'pri sm'), btn('Clear', () => { log = []; render(); }, 'sm')),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, strat, tbl), h('div', { class: 'stack' }, cv, last, ro)));
        mkStrat(); render();
      }
    },
    fragile: {
      title: 'Lose one qubit, keep the entanglement?',
      cap: 'Choose a three-qubit state and decide what happens to qubit A. The diagram shows how entangled the remaining pair B–C is, measured by the concurrence (0 for none, 1 for a Bell pair). Measurement results are random; press the button again to resample.',
      build(body, id) {
        let which = 'ghz', act = 'ignore', outcome = null;
        const cv = canvas('', 'height:200px'), bars = h('div'), sb = stateBars(bars, 3, { height: 140 }), ro = h('div', { class: 'status' });
        let C = 0;
        const dia = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), P = { A: [w * .5, 46], B: [w * .3, H - 46], C: [w * .7, H - 46] };
          const lineAB = act === 'ignore' || act === 'trace' ? .25 : 0;
          if (which === 'ghz' && act === 'ignore') { ctx.fillStyle = T.wash; ctx.beginPath(); ctx.moveTo(...P.A); ctx.lineTo(...P.B); ctx.lineTo(...P.C); ctx.closePath(); ctx.fill(); }
          if (lineAB) { ctx.strokeStyle = T.line; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(...P.A); ctx.lineTo(...P.B); ctx.moveTo(...P.A); ctx.lineTo(...P.C); ctx.stroke(); ctx.setLineDash([]); }
          if (C > .005) { ctx.strokeStyle = T.copper; ctx.lineWidth = 2 + 10 * C; ctx.beginPath(); ctx.moveTo(...P.B); ctx.lineTo(...P.C); ctx.stroke(); }
          else { ctx.strokeStyle = T.line; ctx.lineWidth = 1.5; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.moveTo(...P.B); ctx.lineTo(...P.C); ctx.stroke(); ctx.setLineDash([]); }
          txt(ctx, `concurrence ${num(C, 3)}`, w / 2, H - 22, { font: '600 12px "JetBrains Mono",monospace', color: T.ink });
          for (const [k, p] of Object.entries(P)) {
            const gone = k === 'A' && act !== 'ignore';
            ctx.globalAlpha = gone ? .45 : 1; dot(ctx, ...p, 20, gone ? T.surface2 : T.surface, T.ink); ctx.globalAlpha = 1;
            txt(ctx, k, ...p, { font: '700 15px "Bricolage Grotesque",sans-serif', color: T.ink });
          }
          const lab = act === 'ignore' ? 'A is still here' : act === 'trace' ? 'A lost' : `A measured in ${act === 'z' ? 'Z' : 'X'}: ${outcome}`;
          txt(ctx, lab, P.A[0] + 30, P.A[1], { align: 'left', font: '500 11px "JetBrains Mono",monospace' });
        });
        const render = (resample) => {
          const s = which === 'ghz' ? ghzState() : wState();
          if (act === 'x') s.g('H', 0);
          if ((act === 'z' || act === 'x') && (resample || outcome == null)) outcome = s.measure(0); else if (act === 'z' || act === 'x') { const p1 = s.prob1(0); if (p1 < 1e-9) outcome = 0; else if (p1 > 1 - 1e-9) outcome = 1; s.measure(0, outcome ? 0 : 1); }
          if (act === 'ignore' || act === 'trace') outcome = null;
          const r = rho2(s, 1, 2); C = concurrenceReal(r.re);
          sb.state(s.re, s.im);
          const msg = {
            ghz: { ignore: 'GHZ: no two qubits are entangled with each other on their own. The entanglement belongs to all three together.', trace: 'GHZ with A lost: B and C are left in a 50/50 mixture of |00⟩ and |11⟩, correlated but not entangled.', z: 'GHZ with A measured in Z: B and C collapse to |00⟩ or |11⟩, a product state.', x: 'GHZ with A measured in X: B and C are left in a Bell state (|00⟩ ± |11⟩)/√2, fully entangled.' },
            w: { ignore: 'W: every pair is partly entangled, with concurrence 2/3.', trace: 'W with A lost: B and C remain entangled (concurrence 2/3).', z: outcome ? 'W with A found as 1: the excitation was on A, so B and C are |00⟩.' : 'W with A found as 0: B and C share the excitation, (|01⟩ + |10⟩)/√2, a Bell state.', x: 'W with A measured in X: B and C keep some entanglement whichever result appears.' }
          }[which][act];
          ro.textContent = msg; dia.inv();
        };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'ghz', label: 'GHZ' }, { v: 'w', label: 'W' }], which, v => { which = v; outcome = null; render(); }, 'State'),
          seg([{ v: 'ignore', label: 'Ignore A' }, { v: 'trace', label: 'Lose A' }, { v: 'z', label: 'Measure A in Z' }, { v: 'x', label: 'Measure A in X' }], act, v => { act = v; outcome = null; render(true); }, 'What happens to A'),
          btn('Measure again', () => render(true), 'sm')),
          h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, bars, ro)));
        render();
      }
    }
  },
  take: ['GHZ = (|000⟩ + |111⟩)/√2 and W = (|001⟩ + |010⟩ + |100⟩)/√3 are inequivalent kinds of three-qubit entanglement.',
    'GHZ is an eigenstate of XXX (+1) and XYY, YXY, YYX (−1); no predetermined local values can satisfy all four.',
    'In the Mermin game classical players win at most 75%; players sharing GHZ win every round.',
    'GHZ pairs are unentangled on their own and the state collapses if one qubit is lost; W keeps pairwise entanglement.'],
  quiz: QZ([
    ['Which circuit prepares a three-qubit GHZ state from |000⟩?', ['H on every qubit', 'H on qubit 0, then CNOTs from qubit 0 to qubits 1 and 2', 'Three CNOTs in a ring', 'A Toffoli gate'], 1, 'The Hadamard makes (|0⟩ + |1⟩)/√2 on the first qubit, and each CNOT copies its basis value onto another qubit, giving (|000⟩ + |111⟩)/√2.'],
    ['What is the eigenvalue of XXX on the GHZ state?', ['−1', '+1', '0', 'i'], 1, 'XXX swaps |000⟩ and |111⟩, leaving their equal-weight sum unchanged, so the eigenvalue is +1.'],
    ['Why can’t predetermined ±1 values for X and Y on each qubit explain the GHZ predictions?', ['They can', 'Multiplying the XYY, YXY and YYX constraints forces x₁x₂x₃ = −1, contradicting XXX = +1', 'Because Y is not Hermitian', 'Because three qubits cannot be entangled'], 1, 'Each y appears twice in the product and squares to 1, so the three −1 constraints imply x₁x₂x₃ = −1. Quantum mechanics predicts +1 with certainty: no assignment works.'],
    ['What is the best classical win probability in the Mermin game?', ['50%', '75%', '85%', '100%'], 1, 'Any deterministic strategy fails on at least one of the four input cases (by the same parity argument), and shared randomness only mixes deterministic strategies, so 3/4 is the maximum.'],
    ['In the quantum strategy, what does a player measure on input 1?', ['Z', 'X', 'Y', 'Nothing'], 2, 'Input 0 means measure X, input 1 means measure Y. The inputs 011, 101, 110 then correspond to XYY, YXY and YYX, each with product −1, giving the required odd parity.'],
    ['Take a GHZ state and ignore qubit A. Are B and C entangled?', ['Yes, maximally', 'No: they are in a classical mixture of |00⟩ and |11⟩', 'Partly, with concurrence 2/3', 'It depends on the phase'], 1, 'Tracing out A leaves ½(|00⟩⟨00| + |11⟩⟨11|): perfectly correlated in Z but with no coherence, so the concurrence is 0.'],
    ['What happens to B and C if A (of a GHZ state) is measured in the X basis?', ['They become a product state', 'They are left in a Bell state', 'They become a W state', 'They decohere completely'], 1, 'Writing |GHZ⟩ in A’s X basis gives (|+⟩(|00⟩ + |11⟩) + |−⟩(|00⟩ − |11⟩))/2, so either outcome leaves a Bell state on B and C.'],
    ['What is the pairwise concurrence of any two qubits in the W state?', ['0', '1/3', '2/3', '1'], 2, 'Tracing out one qubit of W leaves a state with concurrence 2/3, so W entanglement survives the loss of a qubit.'],
    ['Why can an N-qubit GHZ state improve phase sensing?', ['It has no noise', 'A phase φ per qubit becomes a collective phase Nφ', 'It stores N classical bits', 'It is easier to prepare than product states'], 1, 'The |00…0⟩ and |11…1⟩ branches pick up a relative phase Nφ, so phase changes are N times more visible, approaching the Heisenberg limit 1/N.'],
    ['What did Dür, Vidal and Cirac show about GHZ and W states?', ['They are identical', 'They cannot be converted into each other by local operations and classical communication, even probabilistically', 'W cannot be prepared', 'GHZ is not entangled'], 1, 'They identified two inequivalent classes of genuine three-qubit entanglement under stochastic LOCC: GHZ-type and W-type.']
  ])
});

/* ---------------- Entanglement swapping and repeaters ---------------- */
LESSONS.push({
  id: 'swapping', n: 10.5, stage: ENT, minutes: 15, title: 'Entanglement swapping and quantum repeaters',
  lede: 'Two particles that have never met can be entangled by measuring their partners. Chained over a network, this is how a quantum internet could cross continents.',
  html: `
<h2>Teleporting entanglement</h2>
<p>Alice shares a Bell pair with Bob, and Bob shares another with Charlie. Bob holds two qubits, one from each pair. He performs a Bell measurement on them, exactly as Alice did in teleportation ([[L:teleportation]]): a CNOT, a Hadamard, and two Z measurements. In effect he teleports his half of the first pair onto Charlie’s side. Afterwards Alice’s and Charlie’s qubits form a Bell pair, although they never interacted.</p>
<p>Which Bell pair they share depends on Bob’s two random results. Until Bob sends those two classical bits, Alice and Charlie hold one of four Bell states with equal probability, which together look completely mixed: nothing travels faster than light. With the bits, Charlie applies ${m('X<sup>m₂</sup>')} and ${m('Z<sup>m₁</sup>')} and the pair becomes exactly ${m('|Φ⁺⟩')}. This is <strong>entanglement swapping</strong>, first demonstrated with photons in 1998.</p>
${LAB('swap')}
<h2>Why fibre alone cannot do it</h2>
<p>Optical fibre loses about 0.2 dB per kilometre at telecom wavelengths, so the fraction of photons that survive ${m('L')} km is ${m('η = 10<sup>−0.02L</sup>')}. After 100 km, 1 in 100 arrives. After 1,000 km, 1 in ${m('10²⁰')}: with a gigahertz source you would wait thousands of years for one photon. Classical networks fix loss with amplifiers, but an amplifier would have to copy the quantum state, which no-cloning forbids. Pirandola, Laurenza, Ottaviani and Banchi proved in 2017 that without intermediate stations, no protocol can distribute entanglement or secret key at more than about ${m('1.44 η')} bits per channel use (the <strong>PLOB bound</strong>).</p>
<h2>Quantum repeaters</h2>
<p>A <strong>quantum repeater</strong> splits the distance into ${m('N')} short links. Each link makes entanglement locally, trying again until it succeeds, and stores it in a quantum memory. When neighbouring links are ready, the stations between them perform entanglement swaps, stitching short pairs into one long one. Because each link only has to overcome the loss of ${m('L/N')} kilometres, the rate falls polynomially with distance instead of exponentially.</p>
<p>Swapping copies noise along with entanglement. If each link delivers a Werner state with fidelity ${m('F₀')}, the end-to-end fidelity after joining ${m('N')} links drops towards ¼. Repeaters therefore also need <strong>entanglement purification</strong>, which turns several noisy pairs into fewer better ones ([[L:purification]]), or full quantum error correction on the links.</p>
${LAB('chain')}
${NOTE('Generations of repeaters', `<p>First-generation designs herald entanglement with photons and correct errors by purification; they need memories that last for the round-trip signalling time. Second-generation designs encode each node in a small error-correcting code. Third-generation designs send encoded photons that are corrected at each station, like a classical relay, and need no long-lived memories. Metropolitan testbeds have linked memory nodes over tens of kilometres of deployed fibre; a continental quantum internet remains a long-term goal.</p>`)}
`,
  labs: {
    swap: {
      title: 'Entanglement swapping step by step',
      cap: 'Four qubits: Alice’s A, Bob’s B₁ and B₂, Charlie’s C. Copper links show which qubits are entangled. The fidelity is how close A and C are to the Bell state |Φ⁺⟩: ¼ means completely uncorrelated, 1 means a perfect Bell pair. Measurement results are random; corrections depend on them.',
      build(body, id) {
        let stp = 0, m1 = 0, m2 = 0;
        const N = 6, cv = canvas('', 'height:150px'), circ = h('div', { class: 'circ-wrap' }), ro = h('div', { class: 'readout', style: 'white-space:normal' }), stat = h('div', { class: 'status' });
        const cols = () => [[{ g: 'H', q: 0 }, { g: 'H', q: 2 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'CX', c: 2, t: 3 }], [{ g: 'CX', c: 1, t: 2 }], [{ g: 'H', q: 1 }], [{ g: 'M', q: 1 }, { g: 'M', q: 2 }], [{ g: 'CC', q: 3, from: 2, label: 'X', sup: m2 ? '1' : '0' }], [{ g: 'CC', q: 3, from: 1, label: 'Z', sup: m1 ? '1' : '0' }]];
        const stepCols = [0, 3, 5, 6, 8];
        const TXT = ['Start: four qubits in |0⟩.', 'Bell pairs made: A with B₁, and B₂ with C.', 'Bob’s Bell measurement: CNOT and H on B₁, B₂, then measure both.', 'Alice and Charlie are now entangled, but which Bell state they share depends on Bob’s bits.', 'Charlie applies X and Z according to Bob’s bits: A and C share |Φ⁺⟩.'];
        let st = null;
        const sim = () => {
          st = new QState(4); const C = cols(), upto = stepCols[stp];
          for (let k = 0; k < upto; k++) for (const op of C[k]) {
            if (op.g === 'H') st.g('H', op.q); else if (op.g === 'CX') st.cx(op.c, op.t);
            else if (op.g === 'M') { if (op.q === 1) st.measure(1, m1 ? 0 : 1); else st.measure(2, m2 ? 0 : 1); }
            else if (op.g === 'CC') { if (op.label === 'X' && m2) st.g('X', 3); if (op.label === 'Z' && m1) st.g('Z', 3); }
          }
        };
        const links = () => stp === 0 ? [] : stp === 1 || stp === 2 ? [[0, 1, 1], [2, 3, 1]] : stp === 3 ? [[0, 3, .5]] : [[0, 3, 1]];
        const dia = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), xs = [w * .12, w * .42, w * .58, w * .88], y = H / 2 + 8;
          [['Alice', .12], ['Bob', .5], ['Charlie', .88]].forEach(([s, f]) => txt(ctx, s, w * f, 18, { font: '600 12px "JetBrains Mono",monospace', color: T.ink }));
          for (const [a, b, s] of links()) {
            ctx.strokeStyle = T.copper; ctx.lineWidth = s < 1 ? 3 : 5; ctx.setLineDash(s < 1 ? [8, 6] : []);
            ctx.beginPath(); const mx = (xs[a] + xs[b]) / 2, hh = Math.abs(xs[b] - xs[a]) * .28; ctx.moveTo(xs[a], y); ctx.quadraticCurveTo(mx, y - hh, xs[b], y); ctx.stroke(); ctx.setLineDash([]);
          }
          ['A', 'B₁', 'B₂', 'C'].forEach((s, k) => { const meas = stp >= 3 && (k === 1 || k === 2); dot(ctx, xs[k], y, 17, meas ? T.surface2 : T.surface, T.ink); txt(ctx, s, xs[k], y, { font: '700 14px "Bricolage Grotesque",sans-serif', color: T.ink }); if (meas) txt(ctx, 'result ' + (k === 1 ? m1 : m2), xs[k], y + 32, { font: '600 11px "JetBrains Mono",monospace', color: T.copper }); });
        });
        const render = () => {
          sim(); circ.innerHTML = ''; circ.append(drawCircuit(4, cols(), { labels: ['A', 'B₁', 'B₂', 'C'], at: stepCols[stp], cw: 54 }).svg);
          const r = rho2(st, 0, 3), F = (r.re[0] + r.re[3] + r.re[12] + r.re[15]) / 2, Cc = concurrenceReal(r.re);
          ro.innerHTML = `<span class="k">fidelity of A–C with |Φ⁺⟩ </span>${num(F, 3)}<br><span class="k">concurrence of A–C       </span>${num(Cc, 3)}${stp >= 3 ? `<br><span class="k">Bob’s results m₁ m₂      </span>${m1} ${m2}` : ''}`;
          stat.className = 'status' + (stp === 4 ? ' good' : ''); stat.textContent = TXT[stp]; dia.inv();
        };
        body.append(cv, h('div', { class: 'btns' }, btn('Back', () => { if (stp) { stp--; render(); } }, 'sm'), btn('Next step', () => { if (stp < 4) { stp++; if (stp === 2) { m1 = Math.random() < .5 ? 1 : 0; m2 = Math.random() < .5 ? 1 : 0; } render(); } }, 'pri sm'), btn('Restart', () => { stp = 0; render(); }, 'sm')),
          circ, h('div', { class: 'split' }, stat, ro));
        render();
      }
    },
    chain: {
      title: 'Direct fibre versus a repeater chain',
      cap: 'Entangled pairs per second over distance (logarithmic scale). Direct transmission uses a 1 GHz source; the dashed line is the PLOB bound for any repeaterless scheme. The repeater model assumes ideal memories and swaps: each of N links retries at the light-travel rate until it succeeds, and waiting for all of them costs a factor of about the N-th harmonic number. The readout tracks how swapping dilutes link fidelity.',
      build(body, id) {
        let N = 8, F0 = .98, Lsel = 600;
        const cv = canvas('', 'height:260px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const eta = L => Math.pow(10, -.02 * L), cF = 2e5, R0 = 1e9;
        const Hn = n => { let s = 0; for (let k = 1; k <= n; k++) s += 1 / k; return s; };
        const direct = L => R0 * eta(L), plob = L => R0 * -Math.log1p(-eta(L)) / Math.LN2, rep = (L, n) => { const L0 = Math.max(1, L / n); return (cF / L0) * eta(L0) / Hn(n); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 1500], y: [1e-12, 1e10], ylog: true, xt: [0, 250, 500, 750, 1000, 1250, 1500], yt: [1e-12, 1e-8, 1e-4, 1, 1e4, 1e8], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'distance (km)', yl: 'pairs per second', pad: { l: 52 } });
          const curve = (f, col, lw, dash) => { const pts = []; for (let L = 1; L <= 1500; L += 5) { const v = f(L); if (v < 1e-12) break; pts.push([A.X(L), A.Y(Math.min(v, 1e10))]); } polyline(ctx, pts, col, lw, dash); };
          curve(plob, T.muted, 1.5, [5, 4]); curve(direct, T.cyan, 2.4); curve(L => rep(L, N), T.copper, 2.6);
          polyline(ctx, [[A.X(Lsel), A.T], [A.X(Lsel), A.B]], T.ink, 1, [3, 3]);
          const lg = [['direct fibre', T.cyan], ['PLOB bound', T.muted], [`repeater, ${N} links`, T.copper]];
          lg.forEach(([s, c3], k) => { ctx.fillStyle = c3; ctx.fillRect(A.R - 140, A.T + 6 + k * 15, 14, 3); txt(ctx, s, A.R - 120, A.T + 8 + k * 15, { align: 'left', font: '500 10.5px "JetBrains Mono",monospace' }); });
        });
        const upd = () => {
          const w0 = (4 * F0 - 1) / 3, wN = Math.pow(w0, N), FN = (1 + 3 * wN) / 4;
          ro.innerHTML = `<span class="k">at ${Lsel} km  direct </span>${sci(direct(Lsel))} /s &nbsp; <span class="k">repeater </span>${sci(rep(Lsel, N))} /s<br><span class="k">link length </span>${num(Lsel / N, 0)} km, link success ${pct(eta(Lsel / N), 2)}<br><span class="k">end-to-end fidelity after ${N - 1} swaps </span>${num(FN, 3)} ${FN > .5 ? '(still distillable)' : '(below ½: not usable without purification)'}`;
          p.inv();
        };
        body.append(cv, h('div', { class: 'split even' },
          h('div', { class: 'stack' }, field('Number of links N', seg([1, 2, 4, 8, 16, 32].map(v => ({ v, label: String(v) })), N, v => { N = v; upd(); }, 'Number of links')),
            slider({ id: id('L'), label: 'Distance to read off', min: 50, max: 1500, step: 50, value: Lsel, fmt: v => v + ' km', on: v => { Lsel = v; upd(); } })),
          h('div', { class: 'stack' }, slider({ id: id('f'), label: 'Fidelity of each link F₀', min: .8, max: 1, step: .005, value: F0, fmt: v => num(v, 3), on: v => { F0 = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['A Bell measurement on the inner halves of two Bell pairs entangles the outer qubits, which never interacted.',
    'Until the two measurement bits arrive, the swapped pair looks completely mixed, so no signal travels faster than light.',
    'Fibre loss grows exponentially with distance and cannot be amplified (no-cloning); the PLOB bound caps every repeaterless scheme.',
    'Repeaters store and swap entanglement over short links for polynomial scaling, but need purification or error correction to fight accumulated noise.'],
  quiz: QZ([
    ['In entanglement swapping, which qubits does Bob measure?', ['A and C', 'His two qubits, one from each Bell pair', 'Only C', 'All four'], 1, 'Bob performs a Bell measurement on B₁ and B₂. That projects A and C, which he never touches, into a Bell state.'],
    ['Before Bob’s results reach Charlie, what does the A–C pair look like to them?', ['A perfect |Φ⁺⟩', 'One of four Bell states with equal probability, which averages to a completely mixed state', 'A product state |00⟩', 'A GHZ state'], 1, 'Each of Bob’s four outcomes leaves a different Bell state. Averaged over outcomes the A–C state is I/4, so no information arrives before the classical bits do.'],
    ['What corrections does Charlie apply?', ['None', 'X if m₂ = 1 and Z if m₁ = 1', 'A Hadamard', 'A SWAP with Alice'], 1, 'As in teleportation, the two bits identify which Pauli turns the shared Bell state into |Φ⁺⟩: X for the parity bit and Z for the phase bit.'],
    ['Roughly what fraction of photons survives 500 km of telecom fibre at 0.2 dB/km?', ['1%', '10⁻¹⁰', '10⁻⁵', '50%'], 1, 'The loss is 0.2 × 500 = 100 dB, which is a factor of 10¹⁰.'],
    ['Why can’t quantum signals simply be amplified like classical ones?', ['Amplifiers are too noisy', 'Amplifying an unknown quantum state would copy it, which the no-cloning theorem forbids', 'Photons cannot be detected', 'Fibres do not support amplifiers'], 1, 'An ideal amplifier would make extra copies of the incoming state. No-cloning rules this out, so loss must be fought differently.'],
    ['What does the PLOB bound limit?', ['The speed of light in fibre', 'The rate of entanglement or key per channel use for any protocol without repeaters, about 1.44η', 'The fidelity of Bell measurements', 'The number of qubits in a memory'], 1, 'Pirandola, Laurenza, Ottaviani and Banchi proved that a lossy channel of transmissivity η supports at most −log₂(1 − η) ≈ 1.44η ebits or secret bits per use without intermediate nodes.'],
    ['How does a repeater improve on direct transmission?', ['By sending brighter pulses', 'By creating entanglement over short links, storing it, and swapping, so only the loss of one short link must be overcome at a time', 'By cloning photons', 'By using classical relays'], 1, 'Each link succeeds with probability η(L/N), retried independently. Swapping joins successful links, giving polynomial instead of exponential scaling.'],
    ['What happens to fidelity when noisy links are swapped together?', ['It increases', 'It decreases towards ¼', 'It stays the same', 'It becomes exactly ½'], 1, 'For Werner states the Werner parameters multiply under swapping, so the end-to-end state gets noisier with each swap. Purification or error correction is needed.'],
    ['What role do quantum memories play in a first-generation repeater?', ['They amplify photons', 'They hold successful link entanglement while waiting for neighbouring links to succeed', 'They measure Bell states', 'They replace the fibre'], 1, 'Links succeed at random times. Without memories all links would have to succeed simultaneously, which is as unlikely as direct transmission.'],
    ['Which technique turns several noisy entangled pairs into fewer, higher-fidelity pairs?', ['Swapping', 'Entanglement purification (distillation)', 'Teleportation', 'Amplitude amplification'], 1, 'Purification protocols use local operations and classical communication to concentrate entanglement, consuming pairs to raise fidelity.']
  ])
});

/* ---------------- Quantum walks ---------------- */
const walkRows = (T, kind) => {
  const W = 2 * T + 1, rows = [];
  if (kind === 'dec') {
    let p0 = new Float64Array(W), p1 = new Float64Array(W); p0[T] = 1;
    rows.push(Float64Array.from(p0));
    for (let t = 1; t <= T; t++) { const n0 = new Float64Array(W), n1 = new Float64Array(W); for (let x = 0; x < W; x++) { const s = (p0[x] + p1[x]) / 2; if (x > 0) n0[x - 1] += s; if (x < W - 1) n1[x + 1] += s; } p0 = n0; p1 = n1; const r = new Float64Array(W); for (let x = 0; x < W; x++) r[x] = p0[x] + p1[x]; rows.push(r); }
    return rows;
  }
  let a0r = new Float64Array(W), a0i = new Float64Array(W), a1r = new Float64Array(W), a1i = new Float64Array(W);
  if (kind === 'sym') { a0r[T] = S2; a1i[T] = S2; } else a0r[T] = 1;
  const prob = () => { const r = new Float64Array(W); for (let x = 0; x < W; x++) r[x] = a0r[x] ** 2 + a0i[x] ** 2 + a1r[x] ** 2 + a1i[x] ** 2; return r; };
  rows.push(prob());
  for (let t = 1; t <= T; t++) {
    const b0r = new Float64Array(W), b0i = new Float64Array(W), b1r = new Float64Array(W), b1i = new Float64Array(W);
    for (let x = 0; x < W; x++) {
      const ur = (a0r[x] + a1r[x]) * S2, ui = (a0i[x] + a1i[x]) * S2, vr = (a0r[x] - a1r[x]) * S2, vi = (a0i[x] - a1i[x]) * S2;
      if (x > 0) { b0r[x - 1] += ur; b0i[x - 1] += ui; } if (x < W - 1) { b1r[x + 1] += vr; b1i[x + 1] += vi; }
    }
    a0r = b0r; a0i = b0i; a1r = b1r; a1i = b1i; rows.push(prob());
  }
  return rows;
};
const sdev = (row, T) => { let m1 = 0, m2 = 0; row.forEach((p, x) => { const z = x - T; m1 += p * z; m2 += p * z * z; }); return Math.sqrt(Math.max(0, m2 - m1 * m1)); };
LESSONS.push({
  id: 'qwalk', n: 13.5, stage: ALGS, minutes: 15, title: 'Quantum walks',
  lede: 'A random walker spreads slowly because its steps cancel out. A quantum walker’s paths interfere instead, and it races outwards. On the right graph, the difference becomes exponential.',
  html: `
<h2>From coin flips to amplitudes</h2>
<p>A classical random walker on a line flips a coin each step and moves left or right. After ${m('t')} steps its position is spread over about ${m('√t')} sites: diffusion. A <strong>discrete-time quantum walk</strong> keeps a coin qubit alongside the position. Each step applies a Hadamard to the coin, then moves the walker left if the coin is ${m('|0⟩')} and right if it is ${m('|1⟩')}, in superposition. Nothing is measured until the end.</p>
<p>Because the walker’s paths carry amplitudes, they interfere. Paths that wander back and forth largely cancel, while paths that keep going in one direction reinforce. The walker spreads <strong>ballistically</strong>, with standard deviation growing in proportion to ${m('t')} (about ${m('0.54 t')} for the Hadamard walk), and its distribution piles up near ${m('±t/√2')} instead of at the centre.</p>
${LAB('walk')}
<p>Measuring the coin after every step destroys the interference and turns the quantum walk back into the classical one. The quadratic gain in spreading speed is the root of the quadratic speedups that walks give for search problems.</p>
<h2>Continuous-time walks</h2>
<p>Edward Farhi and Sam Gutmann introduced a coin-free version in 1998: let the walker evolve under ${m('e<sup>−iAt</sup>')}, where ${m('A')} is the adjacency matrix of a graph. Amplitude flows along edges like a wave rather than diffusing like heat. Andrew Childs later showed that continuous-time walks can perform any quantum computation, so they are a complete model of quantum computing in their own right.</p>
<h2>An exponential speedup: glued trees</h2>
<p>Take two binary trees of depth ${m('d')} and glue their leaves together with a random cycle. Start at the root on the left; the goal is to reach the root on the right, with the graph only accessible through an oracle that lists a vertex’s neighbours. A classical walker drifts towards the middle, where there are ${m('2<sup>d</sup>')} vertices, and gets lost: it reaches the exit with exponentially small probability. Childs, Cleve, Deotto, Farhi, Gutmann and Spielman proved in 2003 that every classical algorithm needs exponentially many queries, while a quantum walk crosses in time linear in ${m('d')}.</p>
<p>The quantum walk succeeds because of symmetry. Starting from the root, the amplitude stays spread evenly over each column of the graph, so the walk is really a walk on a line of ${m('2d + 2')} columns with a defect at the middle, and a wave crosses a line quickly.</p>
${LAB('glued')}
<h2>Algorithms built from walks</h2>
<ul>
<li><strong>Element distinctness</strong> (Ambainis, 2004): deciding whether ${m('N')} numbers are all different takes ${m('O(N<sup>2/3</sup>)')} queries, optimal and better than both classical and Grover-based methods.</li>
<li><strong>Spatial search</strong>: Grover-like search on a two-dimensional grid of ${m('N')} sites in about ${m('√(N log N)')} steps (Tulsi, 2008, improving the earlier ${m('√N log N')}).</li>
<li><strong>Formula evaluation</strong> (Farhi, Goldstone and Gutmann, 2007): evaluating a balanced NAND tree with ${m('N')} leaves in about ${m('√N')} time, by scattering a wave packet off the tree.</li>
</ul>
`,
  labs: {
    walk: {
      title: 'Quantum walk versus random walk',
      cap: 'Top: probability of each position after t steps, quantum (bars) against classical (copper line). Bottom: the whole history, time running down the page, with each row scaled to its own maximum. Measuring the coin every step (decohered) turns the quantum walk back into a classical one.',
      build(body, id) {
        const TM = 80; let t = 50, kind = 'sym', rowsQ = walkRows(TM, kind), rowsC = walkRows(TM, 'dec'), img = null;
        const cv = canvas('', 'height:200px'), hm = canvas('', 'height:230px'), ro = h('div', { class: 'chipline' });
        const top = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), rq = rowsQ[t], rc = rowsC[t], mx = Math.max(.02, ...rq, ...rc) * 1.1;
          const A = axes(ctx, w, H, { x: [-TM, TM], y: [0, mx], xt: [-80, -40, 0, 40, 80], yt: [0, mx / 2.2, mx / 1.1], yf: v => num(v, 2), xl: 'position', yl: 'probability' });
          const bw = Math.max(1, (A.R - A.L) / (2 * TM + 1) * 1.6);
          for (let x = 0; x <= 2 * TM; x++) if (rq[x] > 1e-6) { ctx.fillStyle = T.cyan; ctx.fillRect(A.X(x - TM) - bw / 2, A.Y(rq[x]), bw, A.B - A.Y(rq[x])); }
          const pts = []; for (let x = (t % 2); x <= 2 * TM; x += 2) if (Math.abs(x - TM) <= t + 1) pts.push([A.X(x - TM), A.Y(rc[x])]); polyline(ctx, pts, T.copper, 2);
        });
        const heat = painter(hm, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-TM, TM], y: [TM, 0], xt: [-80, -40, 0, 40, 80], yt: [0, 20, 40, 60, 80], xl: 'position', yl: 'step', pad: { b: 30 } });
          if (!img) img = heatImage(2 * TM + 1, TM + 1, (i, j) => { const r = rowsQ[j], m2 = Math.max(...r); return seqRGB(Math.sqrt(r[i] / m2)); });
          drawHeat(ctx, img, A.L + 1, A.T, A.R - A.L - 1, A.B - A.T, false);
          polyline(ctx, [[A.L, A.Y(t)], [A.R, A.Y(t)]], T.copper, 1.5, [5, 4]);
        });
        const upd = () => {
          const sq = sdev(rowsQ[t], TM), sc = sdev(rowsC[t], TM);
          ro.innerHTML = `<span>step <b>${t}</b></span><span>spread, this walk <b>${num(sq, 1)}</b></span><span>spread, random walk <b>${num(sc, 1)}</b> (√t = ${num(Math.sqrt(t), 1)})</span>`;
          top.inv(); heat.inv();
        };
        const tS = slider({ id: id('t'), label: 'Steps t', min: 0, max: TM, step: 1, value: t, fmt: String, on: v => { t = v; upd(); } });
        let anim = null; Scope.tick(now => { if (!anim) return; const u = Math.min(1, (now - anim) / dur(3000)); t = Math.round(u * TM); tS.set(t); upd(); if (u >= 1) anim = null; });
        body.append(cv, hm, h('div', { class: 'split' }, h('div', { class: 'stack' }, tS, h('div', { class: 'btns' }, btn('Play', () => { anim = performance.now(); }, 'pri sm'))),
          h('div', { class: 'stack' }, field('Coin', seg([{ v: 'sym', label: 'Symmetric start' }, { v: 'asym', label: 'Start in |0⟩' }, { v: 'dec', label: 'Decohered' }], kind, v => { kind = v; rowsQ = walkRows(TM, kind); img = null; upd(); }, 'Coin')), ro)));
        upd();
      }
    },
    glued: {
      title: 'Crossing the glued trees',
      cap: 'Left: the glued-trees graph for depth 3, with each column shaded by the quantum walker’s probability at the current time. Right: probability of each column over time for the quantum walk (top) and the classical random walk (bottom). The exit is the last column. Increase the depth to see the classical chance of escape collapse.',
      build(body, id) {
        let d = 6, t = 0, Q = null;
        const gcv = canvas('', 'height:230px'), qcv = canvas('', 'height:150px'), ccv = canvas('', 'height:150px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const setup = () => {
          const n = 2 * d + 2, A = new Float64Array(n * n);
          for (let j = 0; j < n - 1; j++) { const v = j === d ? 2 : Math.SQRT2; A[j * n + j + 1] = A[(j + 1) * n + j] = v; }
          const { w, V } = eigSymV(A, n), tmax = .8 * n;
          const at = tt => { const out = new Float64Array(n); for (let j = 0; j < n; j++) { let re = 0, im = 0; for (let k = 0; k < n; k++) { const c3 = V[j * n + k] * V[k], ph = -w[k] * tt; re += c3 * Math.cos(ph); im += c3 * Math.sin(ph); } out[j] = re * re + im * im; } return out; };
          const qrows = []; for (let s = 0; s <= 160; s++) qrows.push(at(tmax * s / 160));
          const steps = 40 * n, crows = []; let p = new Float64Array(n); p[0] = 1; crows.push(p);
          for (let s = 1; s <= steps; s++) { const q = new Float64Array(n); for (let j = 0; j < n; j++) { if (!p[j]) continue; if (j === 0) q[1] += p[j]; else if (j === n - 1) q[n - 2] += p[j]; else if (j <= d) { q[j - 1] += p[j] / 3; q[j + 1] += 2 * p[j] / 3; } else { q[j - 1] += 2 * p[j] / 3; q[j + 1] += p[j] / 3; } } p = q; crows.push(p); }
          let qbest = 0, qbt = 0; qrows.forEach((r, s) => { if (r[n - 1] > qbest) { qbest = r[n - 1]; qbt = tmax * s / 160; } });
          let cbest = 0; crows.forEach(r => { cbest = Math.max(cbest, r[n - 1]); });
          Q = { n, at, qrows, crows, tmax, steps, qbest, qbt, cbest, qimg: null, cimg: null };
        };
        const gp = painter(gcv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), dd = 3, n = 2 * dd + 2, xs = j => 20 + j * (w - 40) / (n - 1);
          const pr = Q.at(t), probs3 = [];
          for (let j = 0; j < n; j++) { const jj = Math.min(Q.n - 1, Math.round(j * (Q.n - 1) / (n - 1))); probs3.push(pr[jj]); }
          const ys = j => { const sz = j <= dd ? 2 ** j : 2 ** (2 * dd + 1 - j); return [...Array(sz).keys()].map(k => H / 2 + (k - (sz - 1) / 2) * Math.min(26, (H - 30) / sz)); };
          for (let j = 0; j < n; j++) { const a = clamp(probs3[j] * 2.2, 0, 1); ctx.fillStyle = rgba(T.cyan, a * .55); ctx.fillRect(xs(j) - (w - 40) / (n - 1) / 2, 6, (w - 40) / (n - 1), H - 12); }
          ctx.strokeStyle = T.muted; ctx.lineWidth = 1;
          for (let j = 0; j < n - 1; j++) {
            const A0 = ys(j), A1 = ys(j + 1);
            if (j < dd) A1.forEach((y1, k) => { ctx.beginPath(); ctx.moveTo(xs(j), A0[k >> 1]); ctx.lineTo(xs(j + 1), y1); ctx.stroke(); });
            else if (j > dd) A0.forEach((y0, k) => { ctx.beginPath(); ctx.moveTo(xs(j), y0); ctx.lineTo(xs(j + 1), A1[k >> 1]); ctx.stroke(); });
            else { const perm = [0, 3, 6, 1, 4, 7, 2, 5]; A0.forEach((y0, k) => { for (const o of [0, 1]) { ctx.beginPath(); ctx.moveTo(xs(j), y0); ctx.lineTo(xs(j + 1), A1[perm[(k + o) % 8]]); ctx.stroke(); } }); }
          }
          for (let j = 0; j < n; j++) ys(j).forEach(y => dot(ctx, xs(j), y, j === 0 || j === n - 1 ? 6 : 3.5, j === 0 ? T.copper : j === n - 1 ? T.good : T.ink));
          txt(ctx, 'start', xs(0), H - 10, { font: '600 10px "JetBrains Mono",monospace', color: T.copper }); txt(ctx, 'exit', xs(n - 1), H - 10, { font: '600 10px "JetBrains Mono",monospace', color: T.good });
        });
        const hp = (cv2, which) => painter(cv2, ({ ctx, w, h: H }) => {
          const T = Theme.get(), q = which === 'q', tm = q ? Q.tmax : Q.steps;
          const A = axes(ctx, w, H, { x: [0, Q.n - 1], y: [tm, 0], xt: [0, d, Q.n - 1], xf: v => v === 0 ? 'start' : v === Q.n - 1 ? 'exit' : 'middle', yt: [0, tm], yf: v => num(v, 0), xl: 'column', yl: q ? 'quantum time' : 'classical steps', pad: { b: 30, l: 46 } });
          const rows = q ? Q.qrows : Q.crows, key = q ? 'qimg' : 'cimg';
          if (!Q[key]) { const R = rows.length, step = Math.max(1, Math.floor(R / 160)); const sub = []; for (let r = 0; r < R; r += step) sub.push(q || r + 1 >= R ? rows[r] : rows[r].map((v, j) => (v + rows[r + 1][j]) / 2)); Q[key] = heatImage(Q.n, sub.length, (i, j) => seqRGB(Math.sqrt(sub[j][i]))); }
          drawHeat(ctx, Q[key], A.L + 1, A.T, A.R - A.L - 1, A.B - A.T, false);
          if (q) polyline(ctx, [[A.L, A.Y(t)], [A.R, A.Y(t)]], T.copper, 1.5, [5, 4]);
        });
        const qp = hp(qcv, 'q'), cp = hp(ccv, 'c');
        const upd = () => {
          const pe = Q.at(t)[Q.n - 1];
          ro.innerHTML = `<span class="k">vertices in the graph   </span>${(2 ** (d + 2) - 2).toLocaleString()}<br><span class="k">quantum, at exit now    </span>${pct(pe, 1)}<br><span class="k">quantum, best           </span>${pct(Q.qbest, 1)} at time ${num(Q.qbt, 1)}<br><span class="k">classical, best in ${Q.steps} steps </span>${sci(Q.cbest)}`;
          gp.inv(); qp.inv(); cp.inv();
        };
        setup();
        const tS = slider({ id: id('t'), label: 'Quantum time', min: 0, max: 100, step: .5, value: 0, fmt: v => num(v * Q.tmax / 100, 1), on: v => { t = v * Q.tmax / 100; upd(); } });
        let anim = null; Scope.tick(now => { if (!anim) return; const u = Math.min(1, (now - anim) / dur(4000)); t = u * Q.tmax; tS.set(u * 100); upd(); if (u >= 1) anim = null; });
        body.append(h('div', { class: 'split' }, gcv, h('div', { class: 'stack' }, qcv, ccv)),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, slider({ id: id('d'), label: 'Tree depth d', min: 3, max: 10, step: 1, value: d, fmt: String, on: v => { d = v; t = 0; tS.set(0); setup(); upd(); } }), tS, h('div', { class: 'btns' }, btn('Play', () => { anim = performance.now(); }, 'pri sm'))), ro));
        upd();
      }
    }
  },
  take: ['A discrete-time quantum walk uses a coin qubit and a conditional shift; its paths interfere instead of averaging out.',
    'Quantum walks spread ballistically (∝ t), random walks diffusively (∝ √t); measuring the coin each step removes the difference.',
    'On the glued-trees graph a quantum walk reaches the exit in linear time while every classical algorithm needs exponentially many queries.',
    'Walk-based algorithms include element distinctness in N^(2/3), spatial search and NAND-tree evaluation.'],
  quiz: QZ([
    ['How does the spread of a classical random walk grow with the number of steps t?', ['Like t', 'Like √t', 'Like t²', 'Like log t'], 1, 'Each step adds independent ±1, so the variance grows like t and the standard deviation like √t: diffusion.'],
    ['How does the spread of the Hadamard quantum walk grow?', ['Like √t', 'Linearly in t (about 0.54t)', 'Exponentially', 'It does not spread'], 1, 'Interference suppresses back-and-forth paths, so the walker moves ballistically: the standard deviation is proportional to t.'],
    ['What are the two parts of each step of a discrete-time quantum walk?', ['Measure the position, then flip a coin', 'Apply a coin operator to the coin qubit, then shift the position conditioned on the coin', 'Apply H to the position', 'Swap coin and position'], 1, 'The coin operator (often a Hadamard) creates a superposition of directions, and the conditional shift moves each branch accordingly.'],
    ['What happens if the coin is measured after every step?', ['The walk becomes faster', 'Interference is destroyed and the walk becomes a classical random walk', 'The walker stops', 'Nothing changes'], 1, 'Measuring the coin records which way the walker went, removing coherence between paths. The distribution becomes binomial.'],
    ['Where does the Hadamard walk’s probability concentrate after many steps?', ['At the starting point', 'Near ±t/√2, far from the centre', 'Uniformly over all sites', 'Only at the edges ±t'], 1, 'The distribution is spread out with peaks near ±t/√2, quite unlike the bell curve of a random walk centred on the start.'],
    ['What drives a continuous-time quantum walk?', ['A coin qubit', 'The unitary e^(−iAt) with A the graph’s adjacency matrix', 'Repeated measurement', 'A classical Markov chain'], 1, 'Farhi and Gutmann’s continuous-time walk uses the adjacency matrix as a Hamiltonian; amplitude flows along edges like a wave.'],
    ['Why does a classical walker fail on the glued-trees graph?', ['It moves too slowly', 'It drifts into the exponentially large middle and rarely finds the exit', 'It cannot see the edges', 'It gets stuck at the start'], 1, 'In the left tree two of three edges point towards the middle, and in the right tree two of three point back to it. The walker wanders among 2^d middle vertices and reaches the exit with exponentially small probability.'],
    ['What symmetry lets the quantum walk cross the glued trees quickly?', ['Time reversal', 'The amplitude stays uniform over each column, reducing the walk to a line of 2d + 2 sites', 'Rotation symmetry of the tree', 'The graph is bipartite'], 1, 'Starting from the root, the evolution never leaves the subspace of column-uniform states, in which the problem is a walk on a short line, which a wave crosses in linear time.'],
    ['What query complexity does Ambainis’s walk algorithm achieve for element distinctness?', ['O(N)', 'O(√N)', 'O(N^(2/3))', 'O(log N)'], 2, 'Ambainis used a quantum walk on a Johnson graph to solve element distinctness with O(N^(2/3)) queries, which is optimal.'],
    ['What did Childs show about continuous-time quantum walks in 2009?', ['They are classically simulable', 'They are universal for quantum computation', 'They only work on lines', 'They need a coin'], 1, 'By scattering walkers on specially designed graphs, any quantum circuit can be encoded, so walks are a universal model of computation.']
  ])
});

/* ---------------- Amplitude amplification and estimation ---------------- */
const fejer = (phi, t) => { const M = 1 << t, P = new Float64Array(M); for (let y = 0; y < M; y++) { const dl = phi - y / M, s = Math.sin(PI * dl); P[y] = Math.abs(s) < 1e-12 ? 1 : (Math.sin(PI * M * dl) / (M * s)) ** 2; } let z = 0; P.forEach(v => { z += v; }); return P.map(v => v / z); };
const sampleFrom = P => { let r = Math.random(), k = 0; for (; k < P.length - 1; k++) { r -= P[k]; if (r <= 0) break; } return k; };
LESSONS.push({
  id: 'ampest', n: 15.3, stage: ALGS, minutes: 16, title: 'Amplitude amplification and estimation',
  lede: 'Grover’s trick works on any algorithm that sometimes succeeds. Run backwards through phase estimation, it also estimates probabilities quadratically faster than sampling, the basis of quantum Monte Carlo.',
  html: `
<h2>Amplifying any algorithm</h2>
<p>Suppose a procedure ${m('A')}, quantum or classical made reversible, produces a good outcome with probability ${m('a')}. Classically you would repeat it about ${m('1/a')} times. Write ${m('A|0⟩ = sin θ |good⟩ + cos θ |bad⟩')}, so ${m('a = sin²θ')}. Brassard, Høyer, Mosca and Tapp’s <strong>amplitude amplification</strong> uses two reflections, exactly as in Grover’s algorithm ([[L:grover]]): flip the sign of the good part, then reflect about the state ${m('A|0⟩')}. Together they rotate the state by ${m('2θ')} towards ${m('|good⟩')}:</p>
${EQ('P(good after k rounds) = sin²((2k + 1)θ)')}
<p>About ${m('π/(4θ) ≈ π/(4√a)')} rounds suffice, a quadratic saving. Grover search is the special case where ${m('A')} is a layer of Hadamards and ${m('a = 1/N')}.</p>
${LAB('amplify')}
<h2>Estimating instead of finding</h2>
<p>Often the goal is not to find a good outcome but to know ${m('a')}: the probability that a portfolio loses money, the fraction of solutions to a constraint problem, the average of a function. Sampling ${m('A')} ${m('M')} times estimates ${m('a')} with error about ${m('√(a(1−a)/M)')}, the familiar Monte Carlo rate.</p>
<p>The amplification step ${m('Q')} is a rotation by ${m('2θ')}, so its eigenvalues are ${m('e<sup>±2iθ</sup>')}. Running phase estimation ([[L:qpe]]) on ${m('Q')} reads out ${m('θ')}, and hence ${m('a = sin²θ')}. With ${m('M')} applications of ${m('Q')} the error is</p>
${EQ('|ã − a| ≤ 2π√(a(1 − a)) / M + π² / M²')}
<p>with probability at least ${m('8/π² ≈ 81%')}. That is error ${m('1/M')} instead of ${m('1/√M')}: to gain one more decimal digit, sampling needs a hundred times more runs, amplitude estimation ten times more. This is the Heisenberg scaling of [[L:qpe]] applied to probabilities.</p>
${LAB('estimate')}
<h2>Applications and fine print</h2>
<ul>
<li><strong>Monte Carlo pricing and risk.</strong> Loading a probability distribution into amplitudes and encoding a payoff function lets amplitude estimation compute expected values. This is the most studied financial application of quantum computing.</li>
<li><strong>Counting.</strong> Estimating the number of marked items, <strong>quantum counting</strong>, follows directly; it also tells Grover’s algorithm how many rounds to run.</li>
<li><strong>Lighter versions.</strong> Maximum-likelihood and iterative amplitude estimation replace the phase-estimation circuit with many shorter runs at different depths and classical post-processing, keeping the quadratic advantage with fewer qubits.</li>
</ul>
<p>The speedup is quadratic, not exponential, and both the distribution loading and the payoff circuit must be cheap for it to survive. Fault-tolerant resource estimates for realistic derivative pricing have come out at thousands of logical qubits and T-depths in the tens of millions, so a practical advantage needs large, fast error-corrected machines.</p>
`,
  labs: {
    amplify: {
      title: 'Amplification is a rotation',
      cap: 'The state lives in the plane spanned by |bad⟩ (across) and |good⟩ (up). Each round reflects it about |bad⟩ (faint arrow) and then about the starting state A|0⟩ (dashed line), a net rotation by 2θ. The chart compares the success probability after k rounds with simply repeating A the same number of times.',
      build(body, id) {
        let a = .04, k = 0, ghost = null;
        const cv = canvas('sq', 'max-width:330px;margin:0 auto'), ch = canvas('', 'height:210px'), ro = h('div', { class: 'chipline' });
        const th = () => Math.asin(Math.sqrt(a)), Pk = kk => Math.sin((2 * kk + 1) * th()) ** 2, Pc = kk => 1 - Math.pow(1 - a, 2 * kk + 1);
        const dia = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w, H) * .78, ox = w * .12, oy = H * .88;
          const P = ang => [ox + S * Math.cos(ang), oy - S * Math.sin(ang)];
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ox, oy, S, -PI / 2 - .05, .05); ctx.stroke();
          arrow(ctx, ox, oy, ox + S * 1.05, oy, T.muted, 1.2, 7); arrow(ctx, ox, oy, ox, oy - S * 1.05, T.muted, 1.2, 7);
          txt(ctx, '|bad⟩', ox + S * 1.02, oy + 14, { font: MATHFONT(14) }); txt(ctx, '|good⟩', ox + 4, oy - S * 1.1, { font: MATHFONT(14), align: 'left' });
          ctx.setLineDash([5, 4]); ctx.strokeStyle = T.cyan; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(...P(th())); ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, 'A|0⟩', ...P(th() - .02).map((v, i) => v + (i ? 14 : 22)), { font: MATHFONT(13), color: T.cyan });
          if (ghost != null) { ctx.globalAlpha = .35; arrow(ctx, ox, oy, ...P(ghost), T.copper, 2.5, 10); ctx.globalAlpha = 1; }
          const ang = (2 * k + 1) * th(); arrow(ctx, ox, oy, ...P(ang), T.copper, 3.2, 12);
          txt(ctx, `after ${k} round${k === 1 ? '' : 's'}`, ...P(ang + .06).map((v, i) => v + (i ? -12 : 6)), { font: '600 11px "JetBrains Mono",monospace', color: T.copper, align: 'left' });
        });
        const K = () => Math.max(6, Math.ceil(PI / (2 * th())));
        const chart = painter(ch, ({ ctx, w, h: H }) => {
          const T = Theme.get(), kk = K(), A = axes(ctx, w, H, { x: [0, kk], y: [0, 1.05], xt: [0, Math.round(kk / 2), kk], yt: [0, .5, 1], yf: v => pct(v, 0), xl: 'rounds k (2k + 1 calls to A)', yl: 'P(good)' });
          const cp = []; for (let i = 0; i <= kk; i++) cp.push([A.X(i), A.Y(Pc(i))]); polyline(ctx, cp, T.muted, 1.6, [5, 4]);
          for (let i = 0; i <= kk; i++) dot(ctx, A.X(i), A.Y(Pk(i)), i === k ? 6 : 3.5, i === k ? T.copper : T.cyan, i === k ? T.surface : null);
        });
        const upd = () => {
          const kopt = Math.max(0, Math.round(PI / (4 * th()) - .5));
          ro.innerHTML = `<span>θ <b>${num(deg(th()), 1)}°</b></span><span>best k <b>${kopt}</b> → <b>${pct(Pk(kopt), 1)}</b></span><span>now <b>${pct(Pk(k), 1)}</b> vs repeating <b>${pct(Pc(k), 1)}</b></span>`;
          dia.inv(); chart.inv();
        };
        const round = () => { const th0 = (2 * k + 1) * th(); ghost = -th0; dia.inv(); Scope.later(dur(450), () => { ghost = null; k++; upd(); }); };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, ch,
          slider({ id: id('a'), label: 'Success probability of A', min: .005, max: .5, step: .005, value: a, fmt: v => pct(v, 1), on: v => { a = v; k = 0; upd(); } }),
          h('div', { class: 'btns' }, btn('One round', round, 'pri sm'), btn('Reset', () => { k = 0; upd(); }, 'sm')), ro)));
        upd();
      }
    },
    estimate: {
      title: 'Estimation error: sampling versus amplitude estimation',
      cap: 'Each method gets the same budget of calls to A. Classical sampling counts successes. Amplitude estimation samples a phase-estimation outcome from its exact distribution and converts it to ã = sin²(πy/2ᵗ). The histograms show 400 repeated estimates; the chart shows how the median error falls with the budget, with slopes −½ and −1 on these log scales. (Phase estimation has rare far-off outliers, which is why practical versions take the median of several runs.)',
      build(body, id) {
        let a = .3, t = 6, res = null, scal = null;
        const hcv = canvas('', 'height:200px'), scv = canvas('', 'height:220px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const qae = (aa, tt) => { const th = Math.asin(Math.sqrt(aa)), P = fejer(th / PI, tt); return () => Math.sin(PI * sampleFrom(P) / (1 << tt)) ** 2; };
        const runs = (aa, tt, R) => { const calls = 2 ** (tt + 1), s = qae(aa, tt), C = [], Qv = []; for (let r = 0; r < R; r++) { C.push(binom(calls, aa) / calls); Qv.push(s()); } return { C, Q: Qv, calls }; };
        const rms = (v, aa) => { const e = v.map(x => Math.abs(x - aa)).sort((x, y) => x - y); return e[Math.floor(e.length / 2)]; };
        const hist = painter(hcv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), lo = Math.max(0, a - .25), hi = Math.min(1, a + .25), nb = 50, bc = new Array(nb).fill(0), bq = new Array(nb).fill(0);
          res.C.forEach(x => { const b = Math.floor((x - lo) / (hi - lo) * nb); if (b >= 0 && b < nb) bc[b]++; }); res.Q.forEach(x => { const b = Math.floor((x - lo) / (hi - lo) * nb); if (b >= 0 && b < nb) bq[b]++; });
          const mx = Math.max(...bc, ...bq, 1), A = axes(ctx, w, H, { x: [lo, hi], y: [0, mx * 1.1], xt: [lo, a, hi].map(v => Math.round(v * 100) / 100), yt: [0], xl: 'estimate of a', yl: 'count' });
          const bw = (A.R - A.L) / nb;
          for (let b = 0; b < nb; b++) { const x = A.L + b * bw; ctx.fillStyle = rgba(T.copper, .55); ctx.fillRect(x + 1, A.Y(bc[b]), bw - 2, A.B - A.Y(bc[b])); ctx.fillStyle = rgba(T.cyan, .75); ctx.fillRect(x + bw * .25, A.Y(bq[b]), bw * .5, A.B - A.Y(bq[b])); }
          polyline(ctx, [[A.X(a), A.T], [A.X(a), A.B]], T.ink, 1.5, [4, 3]);
        });
        const sc = painter(scv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [8, 16384], y: [1e-4, .5], xlog: true, ylog: true, xt: [8, 64, 512, 4096], yt: [1e-4, 1e-3, 1e-2, .1], yf: v => String(v), xl: 'calls to A', yl: 'median error' });
          const ln = (f, col, dash) => { const pts = []; for (let e = 3; e <= 14; e += .1) { const Nc = 2 ** e; pts.push([A.X(Nc), A.Y(clamp(f(Nc), 1e-4, .5))]); } polyline(ctx, pts, col, 1.6, dash); };
          ln(Nc => .674 * Math.sqrt(a * (1 - a) / Nc), T.copper, [5, 4]); ln(Nc => PI * Math.sqrt(a * (1 - a)) / (Nc / 2), T.cyan, [5, 4]);
          if (scal) scal.forEach(r => { dot(ctx, A.X(r.calls), A.Y(clamp(r.c, 1e-4, .5)), 4.5, T.copper); dot(ctx, A.X(r.calls), A.Y(clamp(r.q, 1e-4, .5)), 4.5, T.cyan); });
        });
        const run = () => { res = runs(a, t, 400); const ec = rms(res.C, a), eq = rms(res.Q, a);
          ro.innerHTML = `<span class="k">budget </span>${res.calls} calls to A<br><span class="k">sampling, median error   </span>${num(ec, 4)}<br><span class="k">amplitude estimation     </span>${num(eq, 4)}<br><span class="k">ratio </span>${num(ec / Math.max(eq, 1e-9), 1)}×`; hist.inv(); };
        const scaling = () => { scal = []; for (let tt = 2; tt <= 12; tt++) { const r = runs(a, tt, 300); scal.push({ calls: r.calls, c: rms(r.C, a), q: rms(r.Q, a) }); } sc.inv(); };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, hcv, legendRow([['sampling', 'var(--copper)'], ['amplitude estimation', 'var(--cyan)'], ['true a', 'var(--ink)', 1]])), h('div', { class: 'stack' }, scv, legendRow([['sampling ∝ 1/√N', 'var(--copper)', 1], ['estimation ∝ 1/N', 'var(--cyan)', 1]]))),
          h('div', { class: 'split' }, h('div', { class: 'stack' },
            slider({ id: id('a'), label: 'True probability a', min: .02, max: .98, step: .01, value: a, fmt: v => num(v, 2), on: v => { a = v; run(); scal = null; sc.inv(); } }),
            slider({ id: id('t'), label: 'Budget (calls to A)', min: 3, max: 11, step: 1, value: t, fmt: v => String(2 ** (v + 1)), on: v => { t = v; run(); } }),
            h('div', { class: 'btns' }, btn('Repeat 400 estimates', run, 'pri sm'), btn('Measure the scaling', scaling, 'sm'))), ro));
        run(); scaling();
      }
    }
  },
  take: ['Amplitude amplification boosts any procedure with success probability a = sin²θ: k rounds give sin²((2k+1)θ), needing about π/(4√a) rounds.',
    'The amplification operator is a rotation by 2θ with eigenvalues e^(±2iθ); phase estimation on it estimates a.',
    'Amplitude estimation reaches error ~1/M with M calls, versus 1/√M for sampling: a quadratic Monte Carlo speedup.',
    'The advantage is only quadratic and requires cheap state loading, so practical uses need large fault-tolerant machines.'],
  quiz: QZ([
    ['A procedure succeeds with probability a = sin²θ. What is the success probability after k rounds of amplitude amplification?', ['sin²(kθ)', 'sin²((2k + 1)θ)', '1 − (1 − a)ᵏ', 'k·a'], 1, 'Each round rotates the state by 2θ in the good/bad plane, starting from angle θ, so after k rounds the angle is (2k + 1)θ.'],
    ['Roughly how many rounds are needed when a is small?', ['1/a', 'π/(4√a)', 'log(1/a)', 'a²'], 1, 'Reaching angle π/2 from θ ≈ √a takes about π/(4θ) ≈ π/(4√a) rounds, a quadratic improvement over the 1/a repetitions needed classically.'],
    ['Which two reflections make up one round of amplitude amplification?', ['Two Hadamards', 'A sign flip on the good part and a reflection about the state A|0⟩', 'Two measurements', 'A QFT and its inverse'], 1, 'Reflecting about |bad⟩ (flipping the sign of good components) and then about A|0⟩ composes to a rotation by twice the angle between them, 2θ.'],
    ['How is Grover’s algorithm a special case?', ['A is a QFT', 'A is a layer of Hadamards, giving a = M/N for M marked items', 'A is a measurement', 'It is not related'], 1, 'Grover starts from the uniform superposition H^⊗n|0⟩, in which the marked items have total probability M/N, and amplifies it.'],
    ['What are the eigenvalues of the amplification operator Q?', ['±1', 'e^(±2iθ)', 'e^(±iθ/2)', '0 and 1'], 1, 'Q acts as a rotation by 2θ in a two-dimensional plane, so its eigenvalues are e^(±2iθ). Phase estimation can read off θ from them.'],
    ['How does the error of classical Monte Carlo sampling scale with the number of samples M?', ['1/M', '1/√M', '1/M²', 'e^(−M)'], 1, 'The standard deviation of a sample mean shrinks like √(a(1 − a)/M).'],
    ['How does amplitude estimation’s error scale with M applications of Q?', ['1/√M', '1/M', '1/log M', 'It does not improve'], 1, 'Phase estimation on Q achieves Heisenberg scaling: error O(1/M), a quadratic improvement.'],
    ['To gain one more decimal digit of precision, roughly how much more work does each method need?', ['Both 10×', 'Sampling 100×, amplitude estimation 10×', 'Sampling 10×, estimation 100×', 'Both 100×'], 1, 'Error ∝ 1/√M means 100× more samples per digit; error ∝ 1/M means 10× more applications.'],
    ['What do maximum-likelihood and iterative amplitude estimation avoid?', ['Using A at all', 'The full phase-estimation circuit with its ancillas and inverse QFT', 'Measurement', 'The good/bad decomposition'], 1, 'They run amplification at several depths, measure directly, and combine the results classically, keeping the quadratic scaling with shallower circuits.'],
    ['Why is a practical advantage in financial Monte Carlo still far off?', ['The speedup is exponential but unproven', 'The speedup is only quadratic, and loading distributions plus fault-tolerance overheads require very large, fast machines', 'Finance does not use Monte Carlo', 'Amplitude estimation only works for a = ½'], 1, 'With quadratic gains, constant-factor overheads of error correction matter a lot. Resource estimates call for thousands of logical qubits and very deep circuits.']
  ])
});

/* ---------------- Adiabatic computing ---------------- */
const INST = {
  'Easy chain': { n: 4, E: x => { let e = 0; for (let i = 0; i < 3; i++) e -= ((x >> i) & 1) === ((x >> (i + 1)) & 1) ? 1 : -1; return e - .5 * (((x >> 3) & 1) ? -1 : 1); } },
  'Random Ising': { n: 4, E: x => { const J = [[0, 1, -1, 1], [0, 0, 1, -1], [0, 0, 0, 1], [0, 0, 0, 0]], hh = [.3, -.2, .1, -.4], s = i => ((x >> i) & 1) ? -1 : 1; let e = 0; for (let i = 0; i < 4; i++) { e += hh[i] * s(i); for (let j = i + 1; j < 4; j++) e += J[i][j] * s(i) * s(j); } return e; } },
  'Hidden trap': { n: 4, E: x => { const w = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4][x]; return [-.9, -.55, 0, .6, -1][w]; } }
};
LESSONS.push({
  id: 'adiabatic', n: 15.6, stage: ALGS, minutes: 16, title: 'Adiabatic quantum computing and annealing',
  lede: 'Prepare an easy ground state, then slowly change the Hamiltonian into one whose ground state encodes the answer. Go slowly enough and the system follows. How slow is slow enough is the whole question.',
  html: `
<h2>The adiabatic theorem</h2>
<p>A quantum system in the ground state of a Hamiltonian stays in the instantaneous ground state if the Hamiltonian changes slowly enough. Farhi, Goldstone, Gutmann and Sipser turned this into an algorithm in 2000. Encode a problem in a <strong>problem Hamiltonian</strong> ${m('H<sub>P</sub>')}, diagonal in the computational basis, whose lowest-energy basis state is the solution: an Ising model for an optimization problem, for instance. Start with a <strong>driver Hamiltonian</strong> whose ground state is easy, usually ${m('H<sub>B</sub> = −Σ X<sub>i</sub>')} with ground state ${m('|+⟩<sup>⊗n</sup>')}, and interpolate:</p>
${EQ('H(s) = (1 − s) H<sub>B</sub> + s H<sub>P</sub>,&nbsp;&nbsp;&nbsp; s = t/T')}
<p>At the end, measure. If the evolution was slow enough, the result is the solution.</p>
<h2>The gap sets the price</h2>
<p>The adiabatic condition is roughly ${m('T ≫ 1/g<sub>min</sub>²')}, where ${m('g<sub>min</sub>')} is the smallest energy gap between the ground state and the first excited state along the path. Near a small gap the two lowest levels approach in an <strong>avoided crossing</strong>, and a fast sweep jumps across it into the excited state. If the minimum gap shrinks only polynomially with problem size, the algorithm is efficient. For hard instances it can shrink exponentially, for example when a wide, shallow false minimum competes with a narrow true one. Quantum fluctuations favour the wide basin early on, and the system must tunnel late in the anneal through a tiny gap.</p>
${LAB('spectrum')}
<h2>The two-level picture: Landau–Zener</h2>
<p>Near an avoided crossing only two levels matter. Sweep their energy difference linearly at rate ${m('α')} past a minimum gap ${m('Δ')}; the chance of jumping to the excited level is the <strong>Landau–Zener</strong> formula</p>
${EQ('P<sub>jump</sub> = exp(−π Δ² / 2α)')}
<p>Halving the gap means sweeping four times more slowly for the same success probability, which is where the ${m('1/g²')} rule comes from.</p>
${LAB('lz')}
<h2>Universality and annealing</h2>
<ul>
<li><strong>Universality.</strong> Aharonov, van Dam, Kempe, Landau, Lloyd and Regev showed in 2004 that adiabatic computing with suitably general Hamiltonians is polynomially equivalent to the circuit model. It is a full model of quantum computation, not a special-purpose trick.</li>
<li><strong>Grover, adiabatically.</strong> A linear schedule for unstructured search takes time of order ${m('N')}. Roland and Cerf (2002) showed that slowing down only near the minimum gap recovers Grover’s ${m('√N')}: the schedule matters as much as the endpoints.</li>
<li><strong>Quantum annealing.</strong> Commercial annealers with thousands of superconducting qubits run the transverse-field Ising version of this process at finite temperature, with fixed schedules and noise. They are heuristic optimizers: coherent quantum dynamics has been demonstrated in large annealers, but no scaling advantage over the best classical algorithms has been established for practical optimization problems.</li>
</ul>
`,
  labs: {
    spectrum: {
      title: 'An anneal through the energy spectrum',
      cap: 'Lowest energy levels of H(s) for a four-qubit problem (exact diagonalization). The copper markers point to the minimum gap. Below, the probability of staying in the instantaneous ground state during an anneal of total time T, from an exact simulation of the Schrödinger equation. The “hidden trap” instance has a wide false minimum and a tiny late gap.',
      build(body, id) {
        let name = 'Easy chain', Tt = 10, S = null, path = null;
        const scv = canvas('', 'height:240px'), pcv = canvas('', 'height:170px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const Hs = (s, n, E) => { const N = 1 << n, A = new Float64Array(N * N); for (let x = 0; x < N; x++) { A[x * N + x] = s * E(x); for (let i = 0; i < n; i++) { const y = x ^ (1 << i); A[x * N + y] -= (1 - s); } } return A; };
        const prep = () => {
          const I = INST[name], N = 1 << I.n, ss = [], lv = [], gv = []; let gmin = 1e9, sg = 0;
          for (let k = 0; k <= 100; k++) { const s = k / 100, { w, V } = eigSymV(Hs(s, I.n, I.E), N); ss.push(s); lv.push(Array.from(w.slice(0, 6))); const g = new Float64Array(N); for (let x = 0; x < N; x++) g[x] = V[x * N]; gv.push(g); if (k > 0 && k < 100 && w[1] - w[0] < gmin) { gmin = w[1] - w[0]; sg = s; } }
          let sol = 0, eb = 1e9; for (let x = 0; x < N; x++) if (I.E(x) < eb) { eb = I.E(x); sol = x; }
          S = { ss, lv, gv, gmin, sg, sol, N, n: I.n, E: I.E, emin: Math.min(...lv.map(l => l[0])), emax: Math.max(...lv.map(l => l[5])) };
        };
        const evolve = () => {
          const { N, n, E, gv } = S; let re = new Float64Array(N).fill(1 / Math.sqrt(N)), im = new Float64Array(N);
          const steps = Math.max(400, Math.ceil(Tt / .02)), dt = Tt / steps, out = [];
          const Hv = (s, xr, xi) => { const yr = new Float64Array(N), yi = new Float64Array(N); for (let x = 0; x < N; x++) { const d = s * E(x); yr[x] += d * xr[x]; yi[x] += d * xi[x]; for (let i = 0; i < n; i++) { const y = x ^ (1 << i); yr[x] -= (1 - s) * xr[y]; yi[x] -= (1 - s) * xi[y]; } } return [yr, yi]; };
          const f = (s, xr, xi) => { const [hr, hi] = Hv(s, xr, xi); return [hi, hr.map(v => -v)]; };
          let next = 0;
          for (let k = 0; k <= steps; k++) {
            const s = k / steps;
            if (s >= next / 100 - 1e-9) { const g = gv[next]; let pr = 0, pi = 0; for (let x = 0; x < N; x++) { pr += g[x] * re[x]; pi += g[x] * im[x]; } out.push(pr * pr + pi * pi); next++; }
            if (k === steps) break;
            const s2 = (k + .5) / steps, s3 = (k + 1) / steps;
            const [k1r, k1i] = f(s, re, im), [k2r, k2i] = f(s2, re.map((v, x) => v + dt / 2 * k1r[x]), im.map((v, x) => v + dt / 2 * k1i[x]));
            const [k3r, k3i] = f(s2, re.map((v, x) => v + dt / 2 * k2r[x]), im.map((v, x) => v + dt / 2 * k2i[x])), [k4r, k4i] = f(s3, re.map((v, x) => v + dt * k3r[x]), im.map((v, x) => v + dt * k3i[x]));
            re = re.map((v, x) => v + dt / 6 * (k1r[x] + 2 * k2r[x] + 2 * k3r[x] + k4r[x])); im = im.map((v, x) => v + dt / 6 * (k1i[x] + 2 * k2i[x] + 2 * k3i[x] + k4i[x]));
          }
          path = { pg: out, psol: re[S.sol] ** 2 + im[S.sol] ** 2 };
        };
        const sp = painter(scv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), lo = Math.floor(S.emin), hi = Math.ceil(Math.min(S.emax, lo + 6)), A = axes(ctx, w, H, { x: [0, 1], y: [lo, hi], xt: [0, .25, .5, .75, 1], yt: [lo, Math.round((lo + hi) / 2), hi], xl: 's = t/T', yl: 'energy' });
          for (let l = 5; l >= 0; l--) { const pts = S.ss.map((s, k) => [A.X(s), A.Y(clamp(S.lv[k][l], lo, hi))]); polyline(ctx, pts, l === 0 ? T.cyan : l === 1 ? T.copper : T.muted, l < 2 ? 2.4 : 1.1); }
          const k = Math.round(S.sg * 100); arrow(ctx, A.X(S.sg), A.Y(S.lv[k][1]) - 26, A.X(S.sg), A.Y(S.lv[k][1]) - 4, T.copper, 1.6, 7); arrow(ctx, A.X(S.sg), A.Y(S.lv[k][0]) + 26, A.X(S.sg), A.Y(S.lv[k][0]) + 4, T.copper, 1.6, 7);
          txt(ctx, `min gap ${num(S.gmin, 3)}`, A.X(S.sg) + (S.sg > .7 ? -8 : 8), A.Y(S.lv[k][1]) - 32, { align: S.sg > .7 ? 'right' : 'left', font: '600 11px "JetBrains Mono",monospace', color: T.copper });
        });
        const pp = painter(pcv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 1], y: [0, 1.05], xt: [0, .25, .5, .75, 1], yt: [0, .5, 1], yf: v => pct(v, 0), xl: 's = t/T', yl: 'P(ground state)' });
          polyline(ctx, path.pg.map((v, k) => [A.X(k / 100), A.Y(v)]), T.copper, 2.4);
          polyline(ctx, [[A.X(S.sg), A.T], [A.X(S.sg), A.B]], T.muted, 1, [3, 3]);
        });
        const upd = (re) => {
          if (re) prep(); evolve();
          ro.innerHTML = `<span class="k">solution             </span>|${S.sol.toString(2).padStart(S.n, '0')}⟩<br><span class="k">minimum gap          </span>${num(S.gmin, 4)} at s = ${num(S.sg, 2)}<br><span class="k">adiabatic scale 1/g² </span>${num(1 / S.gmin ** 2, 1)}<br><span class="k">P(solution) at the end </span>${pct(path.psol, 1)}`;
          sp.inv(); pp.inv();
        };
        body.append(h('div', { class: 'btns' }, ...Object.keys(INST).map(k => btn(k, () => { name = k; upd(true); }, 'sm'))), scv,
          h('div', { class: 'split' }, pcv, h('div', { class: 'stack' }, slider({ id: id('T'), label: 'Total anneal time T', min: -.5, max: 3, step: .05, value: 1, fmt: v => num(10 ** v, v < 0 ? 2 : 1), on: v => { Tt = 10 ** v; upd(false); } }), ro)));
        upd(true);
      }
    },
    lz: {
      title: 'Landau–Zener: jumping a gap',
      cap: 'Two levels are swept past each other at rate α with a minimum gap Δ (solid curves; the dashed lines are the levels without coupling). The dot follows the simulated state: its height mixes the two levels by their populations. The right chart compares the simulated jump probability with the Landau–Zener formula.',
      build(body, id) {
        let gap = .6, la = 0;
        const cv = canvas('', 'height:230px'), ch = canvas('', 'height:230px'), ro = h('div', { class: 'chipline' });
        const sim = (D, al) => {
          const L = Math.max(10 * D / al, 12 / Math.sqrt(al)), steps = 3000, dt = 2 * L / steps; let ar = 1, ai = 0, br = 0, bi = 0; const tr = [];
          const f = (t, ar2, ai2, br2, bi2) => { const e = al * t / 2, c3 = D / 2; return [e * ai2 + c3 * bi2, -(e * ar2 + c3 * br2), c3 * ai2 - e * bi2, -(c3 * ar2 - e * br2)]; };
          for (let k = 0; k <= steps; k++) {
            const t = -L + k * dt;
            if (k % 30 === 0) { const E = Math.sqrt((al * t) ** 2 + D * D) / 2, th = Math.atan2(D, al * t), g = [Math.sin(th / 2), -Math.cos(th / 2)]; const pg = (g[0] * ar + g[1] * br) ** 2 + (g[0] * ai + g[1] * bi) ** 2; tr.push([t, pg, E]); }
            if (k === steps) break;
            const k1 = f(t, ar, ai, br, bi), k2 = f(t + dt / 2, ar + dt / 2 * k1[0], ai + dt / 2 * k1[1], br + dt / 2 * k1[2], bi + dt / 2 * k1[3]);
            const k3 = f(t + dt / 2, ar + dt / 2 * k2[0], ai + dt / 2 * k2[1], br + dt / 2 * k2[2], bi + dt / 2 * k2[3]), k4 = f(t + dt, ar + dt * k3[0], ai + dt * k3[1], br + dt * k3[2], bi + dt * k3[3]);
            ar += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); ai += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); br += dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]); bi += dt / 6 * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
          }
          return { tr, jump: ar * ar + ai * ai, L };
        };
        let R = null;
        const lev = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), al = 10 ** la, Lw = 3, A = axes(ctx, w, H, { x: [-Lw, Lw], y: [-2, 2], xt: [-3, 0, 3], yt: [-2, 0, 2], xl: 'time', yl: 'energy' });
          polyline(ctx, [[A.X(-Lw), A.Y(-al * -Lw / 2)], [A.X(Lw), A.Y(-al * Lw / 2)]].map(([x, y]) => [x, clamp(y, A.T, A.B)]), T.muted, 1, [4, 4]);
          polyline(ctx, [[A.X(-Lw), A.Y(al * -Lw / 2)], [A.X(Lw), A.Y(al * Lw / 2)]].map(([x, y]) => [x, clamp(y, A.T, A.B)]), T.muted, 1, [4, 4]);
          for (const sg of [1, -1]) { const pts = []; for (let k = 0; k <= 200; k++) { const t = -Lw + 2 * Lw * k / 200, E = sg * Math.sqrt((al * t) ** 2 + gap * gap) / 2; pts.push([A.X(t), A.Y(clamp(E, -2, 2))]); } polyline(ctx, pts, sg < 0 ? T.cyan : T.copper, 2.4); }
          const pts = R.tr.filter(([t]) => Math.abs(t) <= Lw).map(([t, pg, E]) => [A.X(t), A.Y(clamp(-E * pg + E * (1 - pg), -2, 2))]); polyline(ctx, pts, T.ink, 1.6, [2, 3]);
          const lastp = pts[pts.length - 1]; if (lastp) dot(ctx, ...lastp, 6, T.ink, T.surface);
        });
        const cmp = painter(ch, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [.01, 100], y: [0, 1.05], xlog: true, xt: [.01, .1, 1, 10, 100], yt: [0, .5, 1], yf: v => pct(v, 0), xl: 'sweep rate α / Δ²', yl: 'P(jump)' });
          const pts = []; for (let e = -2; e <= 2; e += .02) { const r = 10 ** e; pts.push([A.X(r), A.Y(Math.exp(-PI / (2 * r)))]); } polyline(ctx, pts, T.cyan, 2.2);
          const r = 10 ** la / (gap * gap); if (r >= .01 && r <= 100) dot(ctx, A.X(r), A.Y(R.jump), 6, T.copper, T.surface);
        });
        const upd = () => { const al = 10 ** la; R = sim(gap, al); ro.innerHTML = `<span>simulated jump <b>${pct(R.jump, 1)}</b></span><span>formula <b>${pct(Math.exp(-PI * gap * gap / (2 * al)), 1)}</b></span><span>stays in ground <b>${pct(1 - R.jump, 1)}</b></span>`; lev.inv(); cmp.inv(); };
        body.append(h('div', { class: 'split even' }, cv, ch), h('div', { class: 'split even' },
          h('div', { class: 'stack' }, slider({ id: id('g'), label: 'Minimum gap Δ', min: .1, max: 1.5, step: .05, value: gap, fmt: v => num(v, 2), on: v => { gap = v; upd(); } }),
            slider({ id: id('a'), label: 'Sweep rate α', min: -1.5, max: 1.5, step: .05, value: la, fmt: v => num(10 ** v, 2), on: v => { la = v; upd(); } })), ro));
        upd();
      }
    }
  },
  take: ['Adiabatic computing interpolates H(s) = (1−s)H_B + sH_P from an easy ground state to one encoding the solution.',
    'The run time must exceed roughly 1/g_min², where g_min is the smallest gap between ground and first excited state.',
    'Landau–Zener: sweeping past a gap Δ at rate α jumps with probability exp(−πΔ²/2α).',
    'Adiabatic computing is universal in general; quantum annealers are heuristic, noisy versions with no proven practical speedup.'],
  quiz: QZ([
    ['What is the usual starting Hamiltonian in adiabatic optimization, and its ground state?', ['H_B = −ΣZᵢ with ground state |0…0⟩', 'H_B = −ΣXᵢ with ground state |+⟩^⊗n', 'H_B = 0', 'The problem Hamiltonian itself'], 1, 'The transverse field −ΣXᵢ has the easily prepared ground state |+⟩^⊗n, an equal superposition of all candidate solutions.'],
    ['What does the adiabatic theorem guarantee?', ['Any evolution ends in the ground state', 'A slowly changing Hamiltonian keeps the system in its instantaneous ground state', 'Energy is conserved', 'The gap never closes'], 1, 'If the change is slow compared with the inverse squared gap, transitions to excited states are suppressed and the system tracks the ground state.'],
    ['What quantity mainly determines how long an adiabatic algorithm must run?', ['The number of qubits only', 'The minimum energy gap along the path, through T ≫ 1/g_min²', 'The final energy', 'The temperature of the fridge'], 1, 'Small gaps are where the system is most likely to jump. The required time scales roughly with the inverse square of the smallest gap.'],
    ['In the Landau–Zener formula, what happens to the jump probability if the gap is halved at fixed sweep rate?', ['It halves', 'The exponent shrinks by a factor of 4, so jumping becomes much more likely', 'It doubles exactly', 'Nothing'], 1, 'P = exp(−πΔ²/2α). Halving Δ divides the exponent by four, so you must sweep four times more slowly to keep the same success.'],
    ['Why can a wide, shallow false minimum be dangerous for annealing?', ['It has lower energy', 'Quantum fluctuations favour it early, forcing a late tunnelling transition through a tiny gap', 'It cannot be measured', 'It makes the driver Hamiltonian fail'], 1, 'States with many low-energy neighbours gain more from the transverse field. The ground state starts near the false minimum and must switch late, at an exponentially small gap.'],
    ['What did Aharonov and colleagues prove in 2004?', ['Adiabatic computing is classically simulable', 'Adiabatic computing with general Hamiltonians is polynomially equivalent to the circuit model', 'Annealing solves NP-complete problems efficiently', 'The gap is always polynomial'], 1, 'They showed any quantum circuit can be simulated adiabatically with polynomial overhead, and vice versa: adiabatic computing is universal.'],
    ['How did Roland and Cerf recover Grover’s speedup adiabatically?', ['By using more qubits', 'By slowing the schedule only near the minimum gap', 'By measuring halfway', 'By adding noise'], 1, 'A linear schedule wastes time where the gap is large. Adapting the speed to the local gap reduces the run time from O(N) to O(√N).'],
    ['What is the main difference between quantum annealers and ideal adiabatic computing?', ['Annealers use photons', 'Annealers run at finite temperature with noise, fixed schedules and stoquastic Hamiltonians, as heuristics', 'Annealers use the circuit model', 'There is no difference'], 1, 'Real annealers are open systems with limited control. They are best viewed as heuristic optimizers, not as fault-tolerant universal machines.'],
    ['What happens if an anneal is run much too fast?', ['The answer is always correct', 'The system ends in a superposition close to the initial uniform state, giving near-random answers', 'The qubits overheat', 'The gap grows'], 1, 'A sudden change leaves the state almost unchanged, the uniform superposition, so measurement gives roughly random bit strings.'],
    ['Has quantum annealing been shown to give a scaling advantage over the best classical algorithms for practical optimization?', ['Yes, exponentially', 'No such advantage has been established', 'Yes, for all problems', 'Only for factoring'], 1, 'Coherent dynamics has been observed in large annealers, but on practical optimization benchmarks no scaling advantage over the best classical methods has been convincingly shown.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['W state', 'The three-qubit state (|001⟩ + |010⟩ + |100⟩)/√3, whose entanglement survives the loss of one qubit.', 'ghz'],
  ['Mermin game', 'A three-player game won with certainty using a shared GHZ state but at most 75% of the time classically.', 'ghz'],
  ['Entanglement swapping', 'A Bell measurement on the inner halves of two entangled pairs that leaves the outer, never-interacting qubits entangled.', 'swapping'],
  ['Quantum repeater', 'A chain of stations that creates, stores and swaps entanglement over short links to cover long distances.', 'swapping'],
  ['PLOB bound', 'The maximum rate of entanglement or secret key a lossy channel supports without repeaters, about 1.44 bits per use times the transmissivity.', 'swapping'],
  ['Quantum walk', 'A quantum analogue of a random walk in which paths interfere; it spreads ballistically rather than diffusively.', 'qwalk'],
  ['Glued trees', 'A graph on which a quantum walk finds the exit exponentially faster than any classical algorithm.', 'qwalk'],
  ['Amplitude amplification', 'The generalization of Grover’s algorithm that boosts the success probability of any procedure quadratically faster than repetition.', 'ampest'],
  ['Amplitude estimation', 'Phase estimation applied to amplitude amplification, estimating a probability with error ~1/M instead of 1/√M.', 'ampest'],
  ['Adiabatic theorem', 'A system stays in its instantaneous ground state if its Hamiltonian changes slowly compared with the inverse squared energy gap.', 'adiabatic'],
  ['Landau–Zener formula', 'The probability exp(−πΔ²/2α) of jumping across an avoided crossing of gap Δ swept at rate α.', 'adiabatic'],
  ['Quantum annealing', 'A heuristic, noisy, finite-temperature form of adiabatic optimization run on special-purpose hardware.', 'annealing']
);
})();
