/* =====================================================================
   Stage 3 · 800 mK · Entanglement and communication
   ===================================================================== */
(() => {

const mini = (label) => { const c2 = canvas(); const v = new BlochView(c2, { labels: 'min', drag: false, trail: false }); return { v, el: h('div', { class: 'mini' }, c2, label) }; };

/* ---------------- Lesson 8 · Entanglement ---------------- */
LESSONS.push({
  id: 'entanglement', n: 8, stage: 2, minutes: 13, title: 'Entanglement',
  lede: 'Two qubits can share a state that neither has on its own. Measure one and you learn about the other, however far apart they are.',
  html: `
<h2>Bell states</h2>
<p>The four <strong>Bell states</strong> are the simplest maximally entangled states of two qubits:</p>
${EQ('|Φ<sup>±</sup>⟩ = (|00⟩ ± |11⟩)/√2,&nbsp;&nbsp;&nbsp; |Ψ<sup>±</sup>⟩ = (|01⟩ ± |10⟩)/√2')}
<p>You make ${m('|Φ⁺⟩')} with two gates: a Hadamard on the first qubit, then a CNOT. Measure either qubit and the result is random, 50/50. Measure both and the results always agree. Start from the other three basis states and the same circuit produces the other three Bell states.</p>
${LAB('bell')}
<h2>Each half alone is completely random</h2>
<p>Look at either qubit of a Bell pair by itself and there is no preferred direction at all. Its Bloch vector has length zero; the qubit sits at the center of the ball, and every measurement axis gives 50/50. All the information is in the correlations between the two qubits. That is what entanglement means in practice: the pair is in a definite state, and neither part is.</p>
<h2>Correlations are not signals</h2>
<p>Alice’s results are 50/50 whatever Bob does to his qubit, including measuring it or not. She only sees the correlation when the two of them compare notes over an ordinary channel. Entanglement cannot be used to send a message faster than light. That is also why the teleportation protocol in [[L:teleportation]] needs two classical bits.</p>
<h2>Stronger than any classical correlation</h2>
<p>Classical shared randomness can also produce perfectly matching results: seal the same card in two envelopes and post one to each person. In 1964 John Bell showed that entangled particles do something envelopes cannot. Let Alice choose between two measurement directions, ${m('a')} and ${m('a′')}, and Bob between ${m('b')} and ${m('b′')}. Write ${m('E')} for the average of the product of their ±1 results. Combine four averages into</p>
${EQ('S = E(a, b) + E(a, b′) + E(a′, b) − E(a′, b′)')}
<p>Any model in which the outcomes are fixed in advance by shared instructions gives ${m('|S| ≤ 2')}. This is the CHSH inequality, named after Clauser, Horne, Shimony and Holt. Quantum mechanics predicts values up to ${m('2√2 ≈ 2.83')}. Experiments agree with quantum mechanics, including the loophole-free tests of 2015, and the 2022 Nobel Prize in Physics went to Alain Aspect, John Clauser and Anton Zeilinger for this line of work.</p>
${LAB('chsh')}
${NOTE('About the angles', `<p>In the lab, angles are directions in the x–z plane of the Bloch sphere, where the Bell pair’s correlation is ${m('E = cos(a − b)')}. For photons the physical polarizer angles are half of these, which is why textbook CHSH settings for polarization are 0°, 45°, 22.5° and 67.5°.</p>`)}
`,
  labs: {
    bell: {
      title: 'Bell pair factory',
      cap: 'Step through the circuit and watch the two small spheres. After the CNOT both shrink to their centers: each qubit alone is random, yet the measured pairs always match the Bell state.',
      build(body, id) {
        let inp = 0, stp = 0; const cnt = [0, 0, 0, 0];
        const circ = h('div', { class: 'circ-wrap' }), barsEl = h('div'), bars = stateBars(barsEl, 2, { height: 150 });
        const ketEl = h('div', { class: 'ketline' }), stat = h('div', { class: 'status' });
        const mn = [mini('qubit 0'), mini('qubit 1')];
        const lamps = [h('span', { class: 'lamp' }, '–'), h('span', { class: 'lamp' }, '–')];
        const tEl = h('div'), tally = new Bars(tEl, ['00', '01', '10', '11'], { height: 110 });
        const NAMES = ['|Φ⁺⟩ = (|00⟩ + |11⟩)/√2', '|Ψ⁺⟩ = (|01⟩ + |10⟩)/√2', '|Φ⁻⟩ = (|00⟩ − |11⟩)/√2', '|Ψ⁻⟩ = (|01⟩ − |10⟩)/√2'];
        const state = () => { const s = new QState(2).basis(inp); if (stp >= 1) s.g('H', 0); if (stp >= 2) s.cx(0, 1); return s; };
        const bBack = btn('Back', () => { if (stp > 0) { stp--; render(); } }), bNext = btn('Next gate', () => { if (stp < 2) { stp++; render(); } }, 'pri');
        const paintTally = () => { const n = cnt.reduce((a, b) => a + b, 0); tally.set(cnt.map(c2 => n ? c2 / n : 0), { colors: 'var(--copper)', texts: cnt.map(String) }); };
        const render = () => {
          const s = state(); circ.innerHTML = '';
          circ.append(drawCircuit(2, [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }]], { at: stp, cw: 70, labels: [`q0 |${inp >> 1}⟩`, `q1 |${inp & 1}⟩`] }).svg);
          bars.state(s.re, s.im); ketEl.textContent = '|ψ⟩ = ' + ketString(s.re, s.im, 2);
          mn.forEach((x, i) => x.v.go(s.bloch(i), 450));
          stat.className = 'status' + (stp === 2 ? ' good' : '');
          stat.textContent = stp === 0 ? `Start in ${ket(inp, 2)}. Nothing is entangled yet.` : stp === 1 ? 'After H on qubit 0: still a product state. Qubit 0 is on the equator, qubit 1 at a pole.' : `After CNOT: the Bell state ${NAMES[inp]}. Each qubit on its own now sits at the center of its sphere.`;
          bBack.disabled = stp === 0; bNext.disabled = stp === 2;
          cnt.fill(0); paintTally(); lamps.forEach(l => { l.textContent = '–'; l.removeAttribute('data-on'); });
        };
        const measure = k => {
          const s = state(), out = s.sample(k);
          out.forEach((c2, i) => cnt[i] += c2);
          let lastI = 0; for (let i = 0; i < 4; i++) if (out[i]) lastI = i;
          if (k === 1) lastI = out.indexOf(1);
          [lastI >> 1, lastI & 1].forEach((b, i) => { lamps[i].textContent = b; lamps[i].dataset.on = b; });
          paintTally();
        };
        const inSeg = seg([0, 1, 2, 3].map(i => ({ v: i, label: ket(i, 2) })), 0, v => { inp = v; stp = 0; render(); }, 'Input state');
        body.append(h('div', { class: 'btns' }, h('span', { class: 'ctl-label' }, 'Input'), inSeg), circ,
          h('div', { class: 'split' },
            h('div', { class: 'stack' }, barsEl, ketEl, stat),
            h('div', { class: 'stack' }, h('div', { class: 'btns' }, bBack, bNext), h('div', { class: 'minis' }, mn.map(x => x.el)),
              field('Measure both qubits', h('div', { class: 'btns' }, btn('Measure once', () => measure(1)), btn('Measure 100 pairs', () => measure(100)), lamps[0], lamps[1])), tEl)));
        render();
      }
    },
    chsh: {
      title: 'The CHSH game',
      cap: 'Each round, Alice and Bob each pick one of their two settings at random and record a result of +1 or −1. Switch the source to “Hidden instructions”, where every pair carries a pre-written answer sheet, and S never climbs above 2.',
      build(body, id) {
        const ang = { a: 0, ap: 90, b: 45, bp: 315 }; let src = 'q', anim = null;
        const acc = { ab: [0, 0], abp: [0, 0], apb: [0, 0], apbp: [0, 0] };
        const wrap = d => { d = ((d + PI) % TAU + TAU) % TAU - PI; return d; };
        const Eth = d => src === 'q' ? Math.cos(d) : 1 - 2 * Math.abs(wrap(d)) / PI;
        const key = (A, B) => (A === 'a' ? 'a' : 'ap') + (B === 'b' ? 'b' : 'bp');
        const round = () => {
          const A = Math.random() < .5 ? 'a' : 'ap', B = Math.random() < .5 ? 'b' : 'bp', da = rad(ang[A] - ang[B]);
          let ra, rb;
          if (src === 'q') { ra = Math.random() < .5 ? 1 : -1; rb = Math.random() < (1 + Math.cos(da)) / 2 ? ra : -ra; }
          else { const lam = Math.random() * TAU; ra = Math.cos(rad(ang[A]) - lam) >= 0 ? 1 : -1; rb = Math.cos(rad(ang[B]) - lam) >= 0 ? 1 : -1; }
          const k = key(A, B); acc[k][0] += ra * rb; acc[k][1]++;
          return { A, B, ra, rb };
        };
        const cv = canvas('', 'height:180px'), chart = canvas('', 'height:220px'), tb = h('tbody'), sEl = h('div', { class: 'status' });
        const pairs = [['a', 'b', 'ab', 1], ['a', 'bp', 'abp', 1], ['ap', 'b', 'apb', 1], ['ap', 'bp', 'apbp', -1]];
        const NM = { a: 'a', ap: 'a′', b: 'b', bp: 'b′' };
        const upd = () => {
          let S = 0, Sp = 0, var_ = 0, have = true; tb.innerHTML = '';
          for (const [A, B, k, sg] of pairs) {
            const [s, n] = acc[k], e = n ? s / n : null, ep = Eth(rad(ang[A] - ang[B]));
            if (e == null) have = false; else { S += sg * e; var_ += (1 - e * e) / n; }
            Sp += sg * ep;
            tb.append(h('tr', null, h('td', null, `E(${NM[A]}, ${NM[B]})`), h('td', null, Math.round(((ang[A] - ang[B]) % 360 + 540) % 360 - 180) + '°'), h('td', null, num(ep, 2)), h('td', null, e == null ? '—' : num(e, 2)), h('td', null, String(n))));
          }
          const tot = Object.values(acc).reduce((a, b) => a + b[1], 0);
          sEl.className = 'status' + (have && Math.abs(S) > 2 + 2 * Math.sqrt(var_) ? ' good' : '');
          sEl.innerHTML = have ? `Measured S = <b>${num(S, 2)} ± ${num(Math.sqrt(var_), 2)}</b> after ${tot} rounds. Predicted ${num(Sp, 2)}. Classical limit 2, quantum limit 2.83.` : `Predicted S = <b>${num(Sp, 2)}</b>. Run some rounds to measure it. Classical limit 2, quantum limit 2.83.`;
          pc.inv();
        };
        const pa = painter(cv, ({ ctx, w, h: hh }) => {
          const T = Theme.get(), cy = hh / 2 - 6, xa = 70, xb = w - 70, xs = w / 2;
          ctx.strokeStyle = T.line; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(xa, cy); ctx.lineTo(xb, cy); ctx.stroke(); ctx.setLineDash([]);
          dot(ctx, xs, cy, 14, T.surface2, T.muted); txt(ctx, 'source', xs, cy + 30);
          txt(ctx, src === 'q' ? 'entangled pairs' : 'hidden instructions', xs, cy - 28, { color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
          const station = (x, who, setting, val) => {
            ctx.fillStyle = T.surface; ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, cy, 26, 0, TAU); ctx.fill(); ctx.stroke();
            if (setting) { const a = rad(ang[setting]); arrow(ctx, x - 20 * Math.sin(a), cy + 20 * Math.cos(a), x + 20 * Math.sin(a), cy - 20 * Math.cos(a), T.copper, 2.5, 8);
              txt(ctx, `setting ${NM[setting]} = ${ang[setting]}°`, x, cy + 44, { color: T.ink }); }
            txt(ctx, who, x, cy - 42, { color: T.ink, font: '700 14px "Bricolage Grotesque",sans-serif' });
            if (val != null) { dot(ctx, x + (x < xs ? 44 : -44), cy, 15, val > 0 ? T.copper : T.cyan); txt(ctx, val > 0 ? '+1' : MINUS + '1', x + (x < xs ? 44 : -44), cy, { color: T.surface, font: '700 12px "JetBrains Mono",monospace' }); }
          };
          let f = 1; if (anim) f = clamp((performance.now() - anim.t0) / dur(650), 0, 1);
          station(xa, 'Alice', anim && anim.A, anim && f >= 1 ? anim.ra : null);
          station(xb, 'Bob', anim && anim.B, anim && f >= 1 ? anim.rb : null);
          if (anim && f < 1) { const d = (xs - xa - 26) * f; dot(ctx, xs - d, cy, 6, T.copper); dot(ctx, xs + d, cy, 6, T.copper); }
        });
        Scope.tick(() => { if (anim && performance.now() - anim.t0 < dur(650) + 40) pa.inv(); });
        const pc = painter(chart, ({ ctx, w, h: hh }) => {
          const T = Theme.get(), A = axes(ctx, w, hh, { x: [-180, 180], y: [-1, 1], xt: [-180, -90, 0, 90, 180], xf: v => v + '°', yt: [-1, 0, 1], xl: 'angle difference', yl: 'correlation E' });
          const q = [], cl = []; for (let d = -180; d <= 180; d += 3) { q.push([A.X(d), A.Y(Math.cos(rad(d)))]); cl.push([A.X(d), A.Y(1 - 2 * Math.abs(rad(d)) / PI)]); }
          polyline(ctx, cl, T.copper, 2, [6, 4]); polyline(ctx, q, T.cyan, 2.2);
          txt(ctx, 'quantum: cos Δ', A.L + 8, A.T + 26, { align: 'left', color: T.cyan, font: '600 11px "JetBrains Mono",monospace' });
          txt(ctx, 'hidden instructions: 1 − 2|Δ|/π', A.L + 8, A.T + 42, { align: 'left', color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
          for (const [Aa, B, k] of pairs) { const [s, n] = acc[k]; if (!n) continue; const d = deg(wrap(rad(ang[Aa] - ang[B]))); dot(ctx, A.X(d), A.Y(s / n), 5.5, T.ink, T.surface); }
        });
        const reset = () => { for (const k in acc) acc[k] = [0, 0]; anim = null; pa.inv(); upd(); };
        const sliders = [['a', 'Alice setting a'], ['ap', 'Alice setting a′'], ['b', 'Bob setting b'], ['bp', 'Bob setting b′']].map(([k, l]) =>
          slider({ id: id(k), label: l, min: 0, max: 359, step: 1, value: ang[k], fmt: v => v + '°', on: v => { ang[k] = v; reset(); } }));
        const setAll = arr => { ['a', 'ap', 'b', 'bp'].forEach((k, i) => { ang[k] = arr[i]; sliders[i].set(arr[i]); }); reset(); };
        body.append(cv, h('div', { class: 'split' },
          h('div', { class: 'stack' }, chart, h('div', { class: 'scroll-x' }, h('table', { class: 'mini-tbl' }, h('thead', null, h('tr', null, ...['Pair', 'Δ', 'Predicted', 'Measured', 'Rounds'].map(t => h('th', null, t)))), tb)), sEl),
          h('div', { class: 'stack' },
            field('Source', seg([{ v: 'q', label: 'Entangled pair' }, { v: 'c', label: 'Hidden instructions' }], 'q', v => { src = v; reset(); }, 'Source')),
            h('div', { class: 'btns' }, btn('Play 1 round', () => { const r = round(); anim = Object.assign(r, { t0: performance.now() }); pa.inv(); upd(); }), btn('Run 2,000 rounds', () => { let r; for (let i = 0; i < 2000; i++) r = round(); anim = Object.assign(r, { t0: performance.now() - 2000 }); pa.inv(); upd(); }, 'pri'), btn('Clear', reset)),
            ...sliders,
            h('div', { class: 'btns' }, btn('Best quantum settings', () => setAll([0, 90, 45, 315]), 'sm'), btn('All aligned', () => setAll([0, 0, 0, 0]), 'sm')))));
        upd();
      }
    }
  },
  take: ['Bell states such as (|00⟩ + |11⟩)/√2 are made with H followed by CNOT.',
    'Each qubit of a Bell pair, on its own, is completely random: its Bloch vector has length zero.',
    'Entanglement gives correlations but cannot carry a message.',
    'Entangled pairs violate the CHSH inequality, reaching S = 2√2 where any pre-arranged scheme stops at 2.'],
  quiz: [
    { q: 'Alice measures her half of |Φ⁺⟩ in the 0/1 basis and gets 1. What will Bob get in the same basis?', o: ['0', '1', '0 or 1 at random', 'It depends on the distance'], a: 1, why: '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2 contains only matching outcomes.' },
    { q: 'What is the largest value of S that any hidden-instruction (local) model can reach?', o: ['1', '2', '2√2', '4'], a: 1, why: 'That bound is the CHSH inequality. Quantum mechanics reaches 2√2 ≈ 2.83.' }
  ]
});

/* ---------------- Lesson 9 · Circuit lab ---------------- */
LESSONS.push({
  id: 'circuits', n: 9, stage: 2, minutes: 15, title: 'Circuit lab',
  lede: 'Put the pieces together. Build circuits on up to four qubits and watch the full state change, gate by gate.',
  html: `
<h2>Reading a circuit</h2>
<p>A quantum circuit is read left to right like a musical score. Each horizontal wire is a qubit, starting in ${m('|0⟩')}. Boxes are single-qubit gates. A dot joined to a ${m('⊕')} is a CNOT, with the dot as control. Two joined dots are a CZ, and two crosses are a SWAP. Gates in the same column act at the same time, on different qubits.</p>
<p>The simulator below keeps the entire state vector, all ${m('2ⁿ')} amplitudes, after every column. Bar height is probability and bar colour is phase, using the wheel from [[L:superposition]]. The small spheres show each qubit on its own; a vector shorter than the radius means that qubit is entangled with the others.</p>
${LAB('circuit')}
<h2>Things to try</h2>
<ul>
<li><strong>Bell pair</strong> and <strong>GHZ state</strong>: drag the step slider to watch entanglement spread one CNOT at a time. In the GHZ state ${m('(|000⟩ + |111⟩)/√2')}, every qubit’s sphere collapses to its center.</li>
<li><strong>H Z H</strong>: the interferometer from [[L:interference]] in one wire. The phase flip in the middle becomes a bit flip at the output.</li>
<li><strong>Phase kickback</strong>: the target of a CNOT is prepared in ${m('|−⟩')}, so the CNOT changes the control qubit instead of the target. This trick powers Deutsch–Jozsa, Grover and Shor.</li>
<li><strong>SWAP from CNOTs</strong>: three alternating CNOTs exchange two qubits. Compare the result with the SWAP gate in the palette.</li>
<li><strong>Deutsch–Jozsa</strong>: a four-qubit circuit that decides, with one oracle query, that ${m('f(x) = x₀ ⊕ x₁')} is balanced. [[L:deutsch]] explains why.</li>
</ul>
${NOTE('A note on cost', `<p>This simulator stores ${m('2ⁿ')} amplitudes and updates every one of them for each gate. That is fine for four qubits. At 50 qubits the same approach would need petabytes of memory, which is the point [[L:qubits]] made with the doubling lab.</p>`)}
`,
  labs: {
    circuit: {
      title: 'Circuit lab',
      cap: 'Pick a gate, then tap a cell to place it. For CNOT, CZ and SWAP, tap the first qubit and then the second in the same column. Tap a placed gate to remove it. The step slider shows the state after any column.',
      build(body, id) {
        const NC = 10; let n = 3, cols = [...Array(NC)].map(() => []), tool = 'H', pend = null, at = NC;
        const TOOLS = [['H', 'H'], ['X', 'X'], ['Y', 'Y'], ['Z', 'Z'], ['S', 'S'], ['T', 'T'], ['Sdg', 'S†'], ['Tdg', 'T†'], ['CX', 'CNOT'], ['CZ', 'CZ'], ['SW', 'SWAP']];
        const PRE = {
          bell: { n: 2, c: [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }]] },
          ghz: { n: 3, c: [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'CX', c: 1, t: 2 }]] },
          uni: { n: 3, c: [[{ g: 'H', q: 0 }, { g: 'H', q: 1 }, { g: 'H', q: 2 }]] },
          hzh: { n: 1, c: [[{ g: 'H', q: 0 }], [{ g: 'Z', q: 0 }], [{ g: 'H', q: 0 }]] },
          kick: { n: 2, c: [[{ g: 'X', q: 1 }], [{ g: 'H', q: 0 }, { g: 'H', q: 1 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'H', q: 0 }]] },
          swap: { n: 2, c: [[{ g: 'X', q: 0 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'CX', c: 1, t: 0 }], [{ g: 'CX', c: 0, t: 1 }]] },
          dj: { n: 4, c: [[{ g: 'X', q: 3 }], [{ g: 'H', q: 0 }, { g: 'H', q: 1 }, { g: 'H', q: 2 }, { g: 'H', q: 3 }], [{ g: 'CX', c: 0, t: 3 }], [{ g: 'CX', c: 1, t: 3 }], [{ g: 'H', q: 0 }, { g: 'H', q: 1 }, { g: 'H', q: 2 }]] },
          phase: { n: 2, c: [[{ g: 'H', q: 0 }, { g: 'H', q: 1 }], [{ g: 'T', q: 0 }, { g: 'S', q: 1 }], [{ g: 'CZ', a: 0, b: 1 }]] }
        };
        const span = op => { const r = opRows(op); return [Math.min(...r), Math.max(...r)]; };
        const pal = h('div', { class: 'btns' });
        const palBtns = TOOLS.map(([k, l]) => { const b = h('button', { type: 'button', class: 'gate', 'aria-pressed': String(k === tool), title: l, onclick: () => { tool = k; pend = null; palBtns.forEach(([kk, bb]) => bb.setAttribute('aria-pressed', String(kk === k))); render(); } }, l); pal.append(b); return [k, b]; });
        const circ = h('div', { class: 'circ-wrap' }), ketEl = h('div', { class: 'ketline' }), minisEl = h('div', { class: 'minis' });
        const barsBox = h('div'), shotsBox = h('div'); let bars, shots, minis = [];
        const stepS = slider({ id: id('at'), label: 'Show the state after step', min: 0, max: NC, step: 1, value: NC, fmt: v => v === 0 ? 'start' : String(v), on: v => { at = v; render(); } });
        const shotInfo = h('div', { class: 'hint' });
        const qasm = h('details', { class: 'qasm' }, h('summary', null, 'Export this circuit as OpenQASM 3'), h('div'));
        const QN = { H: 'h', X: 'x', Y: 'y', Z: 'z', S: 's', T: 't', Sdg: 'sdg', Tdg: 'tdg' };
        const toQasm = () => {
          const L = ['OPENQASM 3.0;', 'include "stdgates.inc";', '', `qubit[${n}] q;`, `bit[${n}] c;`, ''];
          for (const col of cols) for (const op of col) L.push(op.g === 'CX' ? `cx q[${op.c}], q[${op.t}];` : op.g === 'CZ' ? `cz q[${op.a}], q[${op.b}];` : op.g === 'SW' ? `swap q[${op.a}], q[${op.b}];` : `${QN[op.g]} q[${op.q}];`);
          L.push('', 'c = measure q;'); return L.join('\n');
        };
        const rebuild = () => {
          barsBox.innerHTML = ''; const be = h('div'); barsBox.append(be); bars = stateBars(be, n, { height: 170 });
          shotsBox.innerHTML = ''; const se = h('div'); shotsBox.append(se); shots = new Bars(se, [...Array(1 << n)].map((_, i) => ket(i, n)), { height: 110 });
          minisEl.innerHTML = ''; minis = []; for (let q = 0; q < n; q++) { const mm = mini('q' + q); minis.push(mm); minisEl.append(mm.el); }
          shotInfo.textContent = 'Shots sample the state shown above.';
        };
        const simulate = () => {
          let s = new QState(n); const out = [s];
          for (const col of cols) { s = s.clone(); for (const op of col) { if (op.g === 'CX') s.cx(op.c, op.t); else if (op.g === 'CZ') s.cz(op.a, op.b); else if (op.g === 'SW') s.swap(op.a, op.b); else s.g(op.g, op.q); } out.push(s); }
          return out;
        };
        const click = (r, cI) => {
          const occ = cols[cI].find(op => { const [lo, hi] = span(op); return r >= lo && r <= hi; });
          if (occ) { cols[cI] = cols[cI].filter(o => o !== occ); pend = null; render(); return; }
          if (!['CX', 'CZ', 'SW'].includes(tool)) { cols[cI].push({ g: tool, q: r }); render(); return; }
          if (!pend || pend.c !== cI) { pend = { r, c: cI }; render(); return; }
          if (pend.r === r) { pend = null; render(); return; }
          const lo = Math.min(pend.r, r), hi = Math.max(pend.r, r);
          cols[cI] = cols[cI].filter(op => { const [a, b] = span(op); return b < lo || a > hi; });
          cols[cI].push(tool === 'CX' ? { g: 'CX', c: pend.r, t: r } : tool === 'CZ' ? { g: 'CZ', a: pend.r, b: r } : { g: 'SW', a: pend.r, b: r });
          pend = null; render();
        };
        const render = () => {
          const d = drawCircuit(n, cols, { at, labels: [...Array(n)].map((_, i) => `q${i} |0⟩`), cw: 54, rh: 54, aria: 'Circuit editor' });
          if (pend) d.svg.append(sv('rect', { x: d.lw + pend.c * d.cw + 4, y: pend.r * d.rh + 6, width: d.cw - 8, height: d.rh - 6, rx: 6, class: 'c-pend' }));
          for (let r = 0; r < n; r++) for (let cI = 0; cI < NC; cI++) {
            const hit = sv('rect', { x: d.lw + cI * d.cw, y: r * d.rh + 3, width: d.cw, height: d.rh, class: 'c-hit', tabindex: 0, role: 'button', 'aria-label': `Qubit ${r}, step ${cI + 1}` });
            hit.addEventListener('click', () => click(r, cI));
            hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); click(r, cI); } });
            d.svg.append(hit);
          }
          circ.innerHTML = ''; circ.append(d.svg);
          const s = simulate()[at];
          bars.state(s.re, s.im); ketEl.textContent = '|ψ⟩ = ' + ketString(s.re, s.im, n, 6);
          minis.forEach((mm, q) => mm.v.go(s.bloch(q), 350));
          shots.set(new Array(1 << n).fill(0), { colors: 'var(--copper)' });
          qasm.lastChild.innerHTML = CODE('openqasm 3', toQasm());
        };
        const runShots = () => {
          const s = simulate()[at], k = s.sample(1024);
          shots.set(k.map(v => v / 1024), { colors: 'var(--copper)', texts: k.map(v => v ? String(v) : '') });
          shotInfo.textContent = `1,024 shots of the state after ${at === 0 ? 'the start' : 'step ' + at}. Counts above each bar.`;
        };
        const nSeg = seg([1, 2, 3, 4].map(v => ({ v, label: v + (v > 1 ? ' qubits' : ' qubit') })), n, v => { n = v; cols = cols.map(col => col.filter(op => opRows(op).every(r => r < n))); pend = null; rebuild(); render(); }, 'Number of qubits');
        const presetSel = h('select', { class: 'sel', id: id('preset'), 'aria-label': 'Load an example circuit' },
          h('option', { value: '' }, 'Load an example…'), ...[['bell', 'Bell pair'], ['ghz', 'GHZ state'], ['uni', 'Uniform superposition'], ['hzh', 'H Z H'], ['kick', 'Phase kickback'], ['swap', 'SWAP from CNOTs'], ['phase', 'Phases and CZ'], ['dj', 'Deutsch–Jozsa, balanced f']].map(([v, l]) => h('option', { value: v }, l)));
        presetSel.addEventListener('change', () => {
          const p = PRE[presetSel.value]; if (!p) return;
          n = p.n; nSeg.set(n); cols = [...Array(NC)].map((_, i) => (p.c[i] || []).map(o => Object.assign({}, o))); at = NC; stepS.set(NC); pend = null; rebuild(); render();
        });
        body.append(h('div', { class: 'btns' }, nSeg, presetSel, btn('Clear circuit', () => { cols = [...Array(NC)].map(() => []); pend = null; presetSel.value = ''; render(); })),
          field('Gate palette', pal), circ, stepS,
          h('div', { class: 'split' }, h('div', { class: 'stack' }, barsBox, ketEl),
            h('div', { class: 'stack' }, minisEl, h('div', { class: 'btns' }, btn('Run 1,024 shots', runShots, 'pri')), shotsBox, shotInfo)), qasm);
        rebuild();
        presetSel.value = 'ghz'; presetSel.dispatchEvent(new Event('change'));
      }
    }
  },
  take: ['Circuits are read left to right; each wire is a qubit starting in |0⟩.',
    'Gates in one column on different qubits act simultaneously and commute.',
    'A Bloch vector shorter than the radius means that qubit is entangled with others.',
    'Brute-force simulation stores and updates all 2ⁿ amplitudes, which is why it stops scaling.'],
  quiz: [
    { q: 'Three alternating CNOTs (0→1, then 1→0, then 0→1) are equivalent to which gate?', o: ['CZ', 'SWAP', 'The identity', 'Two Hadamards'], a: 1, why: 'Load “SWAP from CNOTs”: |10⟩ becomes |01⟩. It works for every input, so the three CNOTs are a SWAP.' },
    { q: 'In the GHZ state (|000⟩ + |111⟩)/√2, where does each single qubit’s Bloch vector point?', o: ['North pole', 'Along +x', 'It has length zero', 'South pole'], a: 2, why: 'Each qubit alone is an even mixture of |0⟩ and |1⟩ with no phase coherence, so its Bloch vector sits at the center.' }
  ]
});

/* ---------------- Lesson 10 · Teleportation ---------------- */
LESSONS.push({
  id: 'teleportation', n: 10, stage: 2, minutes: 13, title: 'Quantum teleportation',
  lede: 'Teleportation moves an unknown qubit state from Alice to Bob using one shared Bell pair and two classical bits. No matter travels, and nothing goes faster than light.',
  html: `
<h2>Why it is needed: you cannot copy a qubit</h2>
<p>The <strong>no-cloning theorem</strong> says no device can take an unknown state ${m('|ψ⟩')} and a blank qubit and produce two copies of ${m('|ψ⟩')} ([[L:cloning]] proves it and finds the best approximate copier). Alice cannot simply measure her qubit and send a description either: one measurement reveals one bit and destroys the rest. Teleportation is the way around both problems.</p>
${NOTE('Why cloning fails', `<p>Suppose a gate ${m('U')} copied basis states: ${m('U|0⟩|0⟩ = |0⟩|0⟩')} and ${m('U|1⟩|0⟩ = |1⟩|1⟩')}. Because ${m('U')} is linear, it must send ${m('|+⟩|0⟩')} to ${m('(|00⟩ + |11⟩)/√2')}. A true copy would be ${m('|+⟩|+⟩ = (|00⟩ + |01⟩ + |10⟩ + |11⟩)/2')}. They differ, so no such ${m('U')} exists.</p>`)}
<h2>The protocol</h2>
<ol>
<li>Alice and Bob share a Bell pair ${m('|Φ⁺⟩')}: Alice holds qubit 1, Bob holds qubit 2.</li>
<li>Alice applies a CNOT from her message qubit (qubit 0) to qubit 1, then a Hadamard to qubit 0.</li>
<li>Alice measures qubits 0 and 1 and gets two bits, ${m('m₀')} and ${m('m₁')}.</li>
<li>She sends the two bits to Bob over an ordinary channel: a phone line, an email, a laser pulse.</li>
<li>Bob applies X if ${m('m₁ = 1')}, then Z if ${m('m₀ = 1')}. His qubit is now ${m('|ψ⟩')}.</li>
</ol>
${LAB('teleport')}
<h2>Why it works</h2>
<p>Just before Alice measures, the three-qubit state can be regrouped according to Alice’s two qubits:</p>
${EQ('½ [ |00⟩(α|0⟩ + β|1⟩) + |01⟩(α|1⟩ + β|0⟩) + |10⟩(α|0⟩ − β|1⟩) + |11⟩(α|1⟩ − β|0⟩) ]')}
<p>Each of Alice’s four outcomes has probability 1/4, whatever ${m('|ψ⟩')} is, so her results reveal nothing about the message. Each outcome leaves Bob holding ${m('|ψ⟩')} up to a known correction: nothing, X, Z, or both. The two bits tell him which.</p>
<h2>What teleportation is not</h2>
<p>Alice’s original is destroyed by her measurement, so the no-cloning theorem is respected. Until the two bits arrive, Bob’s qubit is, on average, completely random; in the lab his Bloch vector sits at the center between the CNOT and his correction. The bits travel no faster than light, so neither does the state.</p>
<p>Teleportation is not just a thought experiment. It has been demonstrated with photons, trapped ions and superconducting circuits, and in 2017 the Micius satellite teleported photon states from the ground to orbit over distances of up to about 1,400 km. Inside quantum computers, teleportation-based tricks are used to move qubits and to apply certain gates in error-corrected machines.</p>
`,
  labs: {
    teleport: {
      title: 'Teleport a qubit',
      cap: 'Set the message with the sliders, then step through. The dashed blue ring on Bob’s sphere marks the message state. Each run draws new random measurement results, and the protocol works for all four.',
      build(body, id) {
        let th = rad(60), ph = rad(45), stp = 0, ms = null; const snaps = [];
        const COLS = [[{ g: 'H', q: 1 }], [{ g: 'CX', c: 1, t: 2 }], [{ g: 'CX', c: 0, t: 1 }], [{ g: 'H', q: 0 }], [{ g: 'M', q: 0 }, { g: 'M', q: 1 }], [{ g: 'CC', q: 2, from: 1, label: 'X', sup: 'm₁' }], [{ g: 'CC', q: 2, from: 0, label: 'Z', sup: 'm₀' }]];
        const HI = [-1, 0, 1, 2, 3, 4, 4, 5, 6];
        const TXT = [
          'Alice holds the message |ψ⟩ on qubit 0. Qubits 1 and 2 start in |0⟩.',
          'Hadamard on qubit 1.',
          'CNOT from qubit 1 to qubit 2. Alice (qubit 1) and Bob (qubit 2) now share the Bell pair (|00⟩ + |11⟩)/√2. Bob takes his qubit far away.',
          'Alice applies a CNOT from her message qubit to her half of the pair. Bob’s qubit is still at the center of his sphere.',
          'Alice applies a Hadamard to qubit 0. The state now splits into four branches, one for each of her possible results.',
          'Alice measures qubits 0 and 1.',
          'Alice sends her two bits to Bob over an ordinary channel.',
          'Bob applies X if m₁ = 1.',
          'Bob applies Z if m₀ = 1. His qubit is now exactly the message |ψ⟩.'
        ];
        const circ = h('div', { class: 'circ-wrap' }), stat = h('div', { class: 'status' }), barsEl = h('div'), bars = stateBars(barsEl, 3, { height: 150 });
        const chan = h('div', { class: 'chipline' }), fid = h('div', { class: 'chipline' });
        const mn = [mini('q0 · Alice’s message'), mini('q1 · Alice’s half'), mini('q2 · Bob')];
        const init = () => { const s = new QState(3); s.apply(0, Ry(th)); s.apply(0, Phase(ph)); return s; };
        const advance = () => {
          const s = snaps[stp].clone(), k = stp + 1;
          if (k === 1) s.g('H', 1); else if (k === 2) s.cx(1, 2); else if (k === 3) s.cx(0, 1); else if (k === 4) s.g('H', 0);
          else if (k === 5) ms = [s.measure(0), s.measure(1)];
          else if (k === 7 && ms[1]) s.g('X', 2); else if (k === 8 && ms[0]) s.g('Z', 2);
          snaps[k] = s; stp = k;
        };
        const target = () => fromAngles(th, ph);
        const render = () => {
          const s = snaps[stp];
          circ.innerHTML = ''; circ.append(drawCircuit(3, COLS, { hi: HI[stp], cw: 60, labels: ['q0 |ψ⟩', 'q1 |0⟩', 'q2 |0⟩'] }).svg);
          bars.state(s.re, s.im);
          stat.className = 'status' + (stp === 8 ? ' good' : ''); stat.textContent = `Step ${stp} of 8. ` + TXT[stp];
          mn.forEach((x, i) => x.v.go(s.bloch(i), 500)); mn[2].v.target = target(); mn[2].v.inv();
          chan.innerHTML = ms && stp >= 5 ? `<span>Alice’s results <b>m₀ = ${ms[0]}, m₁ = ${ms[1]}</b></span><span>${stp >= 6 ? 'bits delivered to Bob' : 'bits not yet sent'}</span>` : '<span>No measurement yet</span>';
          const vb = s.bloch(2), F = (1 + V.dot(vb, target())) / 2;
          fid.innerHTML = `<span>Bob’s Bloch vector length <b>${num(V.norm(vb), 2)}</b></span><span>overlap with |ψ⟩ <b>${pct(F, 0)}</b></span>`;
          sTh.disable(stp > 0); sPh.disable(stp > 0); bBack.disabled = stp === 0; bNext.disabled = stp === 8;
        };
        const restart = () => { stp = 0; ms = null; snaps.length = 0; snaps[0] = init(); render(); };
        const sTh = slider({ id: id('th'), label: 'Message θ', min: 0, max: 180, step: 1, value: 60, fmt: v => v + '°', on: v => { th = rad(v); restart(); } });
        const sPh = slider({ id: id('ph'), label: 'Message φ', min: 0, max: 360, step: 1, value: 45, fmt: v => v + '°', on: v => { ph = rad(v); restart(); } });
        const bBack = btn('Back', () => { if (stp > 0) { stp--; if (stp < 5) ms = null; render(); } });
        const bNext = btn('Next step', () => { if (stp < 8) { advance(); render(); } }, 'pri');
        body.append(circ, h('div', { class: 'split' },
          h('div', { class: 'stack' }, h('div', { class: 'minis' }, mn.map(x => x.el)), stat, chan, fid, barsEl),
          h('div', { class: 'stack' }, sTh, sPh, h('div', { class: 'btns' }, bBack, bNext), h('div', { class: 'btns' }, btn('Run to the end', () => { while (stp < 8) advance(); render(); }), btn('New run', restart)))));
        restart();
      }
    }
  },
  take: ['An unknown quantum state cannot be copied (no-cloning).',
    'Teleportation uses one Bell pair, a CNOT, an H, two measurements and two classical bits.',
    'Bob’s correction is X if m₁ = 1 and Z if m₀ = 1.',
    'Until the bits arrive Bob’s qubit is, on average, completely random, so nothing travels faster than light.'],
  quiz: [
    { q: 'How many classical bits must Alice send to Bob?', o: ['None', '1', '2', 'Enough to describe α and β'], a: 2, why: 'Two bits select one of four Pauli corrections.' },
    { q: 'Alice gets m₀ = 1, m₁ = 0. What does Bob apply?', o: ['Nothing', 'X', 'Z', 'X then Z'], a: 2, why: 'Outcome |10⟩ leaves Bob with α|0⟩ − β|1⟩ = Z|ψ⟩, so he applies Z.' }
  ]
});

/* ---------------- Lesson 11 · Quantum key distribution (BB84) ---------------- */
LESSONS.push({
  id: 'bb84', n: 11, stage: 2, minutes: 12, title: 'Quantum key distribution',
  lede: 'Quantum key distribution lets two people grow a shared secret key and notice any eavesdropper, using the fact that measuring a quantum state disturbs it.',
  html: `
<h2>The BB84 protocol</h2>
<p>Charles Bennett and Gilles Brassard proposed the first quantum key distribution scheme in 1984. It needs no entanglement, just single photons and two measurement bases.</p>
<ol>
<li>For each photon, Alice picks a random bit and a random basis. In the rectilinear basis (+), 0 is horizontal ↔ and 1 is vertical ↕. In the diagonal basis (×), 0 is 45° ⤢ and 1 is 135° ⤡. She sends the photon.</li>
<li>Bob picks a random basis for each photon and measures. If his basis matches Alice’s he gets her bit. If not, his result is a coin toss.</li>
<li>Over a public channel they announce their bases, never their bits, and keep only the positions where the bases matched. This <strong>sifted key</strong> is about half the photons.</li>
<li>They publish a random sample of the sifted bits to estimate the error rate, then throw that sample away.</li>
<li>If the error rate is low enough, they run error correction and <strong>privacy amplification</strong>, which squeezes the key down to a shorter one that an eavesdropper knows essentially nothing about.</li>
</ol>
${LAB('bb84')}
<h2>Catching Eve</h2>
<p>An eavesdropper, traditionally called Eve, cannot copy the photons (no-cloning, [[L:cloning]]) and does not know which basis each one used. Suppose she measures every photon in a random basis and sends on a fresh photon matching her result. Half the time she picks the wrong basis, and each of those photons then gives Bob the wrong bit half the time, even when Bob’s basis matches Alice’s. The result is an error rate of 25% in the sifted key, which Alice and Bob will spot.</p>
<p>Real channels have some noise too, so Alice and Bob cannot demand zero errors. Security proofs for BB84 with one-way error correction tolerate error rates up to about 11%. Above that threshold they abort and try again.</p>
<h2>In practice</h2>
<p>QKD has been run over fibre networks and satellite links. Its security rests on physics rather than on a problem being hard to compute, which makes it immune to Shor’s algorithm. Real devices have imperfections, such as pulses that occasionally hold two photons and detectors that can be blinded, and modern protocols such as decoy-state and measurement-device-independent QKD close many of these gaps. QKD also needs an authenticated classical channel, so in practice it works alongside classical cryptography.</p>
`,
  labs: {
    bb84: {
      title: 'BB84 simulator',
      cap: 'Highlighted rows are kept in the sifted key. Errors in the sifted key are marked in red. With Eve listening, the error rate settles near 25%; without her, it stays at zero on this noiseless channel.',
      build(body, id) {
        let eve = false, seq = 0; const rows = [], fly = []; const st = { sent: 0, kept: 0, err: 0 }; let key = [];
        const SYM = { '+0': '↔', '+1': '↕', 'x0': '⤢', 'x1': '⤡' }, ANG = { '+0': 0, '+1': 90, 'x0': 45, 'x1': 135 };
        const cv = canvas('', 'height:170px'), tb = h('tbody'), stats = h('div', { class: 'chipline' }), stat = h('div', { class: 'status' }), keyEl = h('div', { class: 'readout', style: 'white-space:normal;word-break:break-all' });
        const mk = () => {
          const ab = Math.random() < .5 ? 0 : 1, aB = Math.random() < .5 ? '+' : 'x';
          let pb = ab, pB = aB, eB = null, eb = null;
          if (eve) { eB = Math.random() < .5 ? '+' : 'x'; eb = eB === pB ? pb : (Math.random() < .5 ? 0 : 1); pb = eb; pB = eB; }
          const bB = Math.random() < .5 ? '+' : 'x', bb = bB === pB ? pb : (Math.random() < .5 ? 0 : 1);
          return { i: ++seq, ab, aB, eB, eb, bB, bb, keep: aB === bB, err: aB === bB && bb !== ab, eve };
        };
        const record = r => {
          st.sent++; if (r.keep) { st.kept++; if (r.err) st.err++; key.push(r); if (key.length > 96) key.shift(); }
          rows.unshift(r); if (rows.length > 12) rows.pop();
        };
        const paint = () => {
          tb.innerHTML = '';
          for (const r of rows) tb.append(h('tr', { class: r.keep ? 'kept' : '' },
            h('td', null, String(r.i)), h('td', null, String(r.ab)), h('td', null, r.aB === '+' ? '+' : '×'), h('td', null, SYM[r.aB + r.ab]),
            h('td', null, r.eve ? (r.eB === '+' ? '+' : '×') : '—'), h('td', null, r.bB === '+' ? '+' : '×'), h('td', null, String(r.bb)),
            h('td', null, r.keep ? 'yes' : 'no'), h('td', { class: r.err ? 'err' : '' }, r.keep ? String(r.bb) : '')));
          const q = st.kept ? st.err / st.kept : 0;
          stats.innerHTML = `<span>photons sent <b>${st.sent}</b></span><span>sifted key bits <b>${st.kept}</b></span><span>errors <b>${st.err}</b></span><span>error rate <b>${st.kept ? pct(q, 1) : '—'}</b></span>`;
          if (st.kept < 30) { stat.className = 'status'; stat.textContent = 'Send more photons to get a reliable error estimate (at least 30 sifted bits).'; }
          else if (q > .11) { stat.className = 'status bad'; stat.textContent = `Error rate ${pct(q, 1)} is above the 11% threshold. Alice and Bob conclude someone is listening and abort.`; }
          else { stat.className = 'status good'; stat.textContent = `Error rate ${pct(q, 1)} is below 11%. Alice and Bob can distil a secret key.`; }
          keyEl.innerHTML = key.length ? key.map(r => r.err ? `<span style="color:var(--bad);font-weight:700;text-decoration:underline">${r.bb}</span>` : String(r.bb)).join('') : '<span class="k">sifted key appears here</span>';
        };
        const pa = painter(cv, ({ ctx, w, h: hh }) => {
          const T = Theme.get(), cy = hh / 2, xa = 54, xb = w - 54, xe = w / 2, now = performance.now();
          ctx.strokeStyle = T.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xa, cy); ctx.lineTo(xb, cy); ctx.stroke();
          const box = (x, label, col) => { ctx.fillStyle = T.surface; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.fillRect(x - 32, cy - 24, 64, 48); ctx.strokeRect(x - 32, cy - 24, 64, 48); txt(ctx, label, x, cy - 38, { color: T.ink, font: '700 13px "Bricolage Grotesque",sans-serif' }); };
          box(xa, 'Alice', T.ink); box(xb, 'Bob', T.ink); if (eve) box(xe, 'Eve', T.bad);
          const pol = (x, y, key2, col) => { const a = rad(ANG[key2]), L = 13; arrow(ctx, x, y, x + L * Math.cos(a), y - L * Math.sin(a), col, 2.4, 6); arrow(ctx, x, y, x - L * Math.cos(a), y + L * Math.sin(a), col, 2.4, 6); };
          const D = dur(1500) || 1;
          for (const f of fly) {
            if (now < f.t0) continue;
            const t = clamp((now - f.t0) / D, 0, 1), x = lerp(xa + 34, xb - 34, t);
            let k2 = f.r.aB + f.r.ab; if (f.r.eve && x > xe) k2 = f.r.eB + f.r.eb;
            pol(x, cy, k2, T.copper);
            if (t >= 1) { txt(ctx, `basis ${f.r.bB === '+' ? '+' : '×'} → ${f.r.bb}`, xb, cy + 38, { color: T.ink }); }
          }
          const live = fly.filter(f => now >= f.t0), last = live[live.length - 1];
          if (last) { txt(ctx, `bit ${last.r.ab}, basis ${last.r.aB === '+' ? '+' : '×'}`, xa, cy + 38, { color: T.ink }); if (last.r.eve) txt(ctx, `measures ${last.r.eB === '+' ? '+' : '×'}`, xe, cy + 38, { color: T.bad }); }
        });
        Scope.tick(now => {
          let busy = false;
          for (const f of fly) { if (!f.done && now - f.t0 >= dur(1500)) { f.done = true; record(f.r); paint(); } if (!f.done || now - f.t0 < dur(1500) + 600) busy = true; }
          while (fly.length > 1 && fly[0].done) fly.shift();
          if (busy) pa.inv();
        });
        const send = k => { const now = performance.now(); for (let i = 0; i < k; i++) fly.push({ r: mk(), t0: now + i * dur(260) }); };
        const batch = k => { for (let i = 0; i < k; i++) record(mk()); paint(); };
        const reset = () => { rows.length = 0; key = []; fly.length = 0; st.sent = st.kept = st.err = 0; seq = 0; paint(); pa.inv(); };
        body.append(h('div', { class: 'btns' }, field('Eavesdropper', seg([{ v: false, label: 'Eve absent' }, { v: true, label: 'Eve intercepts' }], false, v => { eve = v; reset(); }, 'Eavesdropper')),
          btn('Send 1 photon', () => send(1)), btn('Send 12', () => send(12)), btn('Send 500 instantly', () => batch(500), 'pri'), btn('Reset', reset)),
          cv,
          h('div', { class: 'split' },
            h('div', { class: 'scroll-x' }, h('table', { class: 'mini-tbl' }, h('thead', null, h('tr', null, ...['#', 'Alice bit', 'Alice basis', 'Photon', 'Eve basis', 'Bob basis', 'Bob bit', 'Bases match', 'Key bit'].map(t => h('th', null, t)))), tb)),
            h('div', { class: 'stack' }, stats, stat, field('Sifted key (latest 96 bits)', keyEl))));
        paint();
      }
    }
  },
  take: ['BB84 encodes bits in two incompatible bases; Bob keeps only the bits where his basis matched Alice’s.',
    'About half the photons survive sifting.',
    'An intercept-and-resend eavesdropper causes about 25% errors in the sifted key.',
    'Below about 11% error, error correction and privacy amplification yield a secure key.'],
  quiz: [
    { q: 'On average, what fraction of photons survives sifting?', o: ['1/4', '1/2', '3/4', 'All of them'], a: 1, why: 'Bob’s random basis matches Alice’s half the time.' },
    { q: 'Eve measures every photon in a random basis and resends it. What error rate appears in the sifted key?', o: ['0%', '11%', '25%', '50%'], a: 2, why: 'She picks the wrong basis half the time, and each of those photons gives Bob a wrong bit half the time: ½ × ½ = ¼.' }
  ]
});

})();
