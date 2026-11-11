/* =====================================================================
   Batch 5b: quantum arithmetic, inside the cryostat, quantum LDPC codes
   ===================================================================== */
(() => {

/* ---------- ripple-carry (Cuccaro) adder ---------- */
function cuccaro(n) {
  const b = i => 1 + 2 * i, a = i => 2 + 2 * i, z = 2 * n + 1, g = [];
  const MAJ = (x, y, w) => { g.push(['CX', w, y]); g.push(['CX', w, x]); g.push(['CCX', x, y, w]); };
  const UMA = (x, y, w) => { g.push(['CCX', x, y, w]); g.push(['CX', w, x]); g.push(['CX', x, y]); };
  MAJ(0, b(0), a(0)); for (let i = 1; i < n; i++) MAJ(a(i - 1), b(i), a(i));
  g.push(['CX', a(n - 1), z]);
  for (let i = n - 1; i >= 1; i--) UMA(a(i - 1), b(i), a(i)); UMA(0, b(0), a(0));
  const names = ['c']; for (let i = 0; i < n; i++) names.push('b' + '₀₁₂₃'[i], 'a' + '₀₁₂₃'[i]); names.push('z');
  return { g, W: 2 * n + 2, b, a, z, names };
}
const SUBS = '₀₁₂₃';

/* ---------- QFT circuits on a QState, with optional truncation ---------- */
function qftC(st, n, m, inv) {
  if (!inv) { for (let j = 0; j < n; j++) { st.g('H', j); for (let k = j + 1; k < n; k++) { const d = k - j + 1; if (d <= m) st.apply(j, Phase(TAU / 2 ** d), [k]); } } for (let q = 0; q < n >> 1; q++) st.swap(q, n - 1 - q); }
  else { for (let q = 0; q < n >> 1; q++) st.swap(q, n - 1 - q); for (let j = n - 1; j >= 0; j--) { for (let k = n - 1; k > j; k--) { const d = k - j + 1; if (d <= m) st.apply(j, Phase(-TAU / 2 ** d), [k]); } st.g('H', j); } }
  return st;
}

LESSONS.push({
  id: 'arithmetic', n: 14.5, stage: 3, minutes: 16, title: 'Quantum arithmetic: ripple-carry and Fourier adders',
  lede: 'Shor’s algorithm spends almost all of its gates on ordinary arithmetic, done reversibly and in superposition. Here is how a quantum computer adds two numbers with Toffoli and CNOT gates, how it adds in the Fourier basis with nothing but phase rotations, and what that costs.',
  html: `
<h2>Adding without forgetting</h2>
<p>A classical adder maps two inputs to one output, ${m('(a, b) → a + b')}, and throws information away. Quantum gates are reversible ([[L:toffoli]]), so a quantum adder keeps one input and overwrites the other:</p>
${EQ('|a⟩|b⟩ → |a⟩|a + b mod 2ⁿ⟩')}
<p>Because it is a reversible circuit acting on basis states, it acts on superpositions too: feed in a superposition of many values of ${m('a')} and one run produces the superposition of all the corresponding sums. That is not a shortcut to reading many sums, since measuring gives just one, but it is exactly what Shor’s algorithm needs: modular exponentiation ${m('|x⟩|1⟩ → |x⟩|aˣ mod N⟩')} on a superposition of all ${m('x')} ([[L:shor]]), built from multiplications, which are built from additions.</p>
<h2>The ripple-carry adder</h2>
<p>School addition works bit by bit, passing a carry from each column to the next. The <strong>Cuccaro adder</strong> (Cuccaro, Draper, Kutin and Moulton, 2004) does this with two small blocks. <strong>MAJ</strong> computes the majority of the incoming carry, ${m('aᵢ')} and ${m('bᵢ')}, which is the outgoing carry, and stores it in place of ${m('aᵢ')}. After the last bit the top carry is copied out, and <strong>UMA</strong> blocks run the chain backwards, “unmajority and add”, restoring ${m('a')} and the carries while leaving the sum bits in ${m('b')}. It needs one ancilla, ${m('2n + 2')} qubits in all, ${m('2n')} Toffoli gates and depth growing linearly in ${m('n')}. Uncomputing the carries matters: leftover garbage would stay entangled with the answer and spoil the interference later in the algorithm.</p>
${LAB('ripple')}
<h2>Adding in the Fourier basis</h2>
<p>Draper (2000) found an adder with no ancillas and no Toffolis. Apply the quantum Fourier transform ([[L:qft]]) to ${m('|b⟩')}. Each qubit of ${m('QFT|b⟩')} becomes ${m('(|0⟩ + e^(2πi b/2ᵏ)|1⟩)/√2')} for ${m('k = 1 … n')}: a set of clock hands turning at different speeds, the fastest flipping with every unit of ${m('b')} and the slowest turning by ${m('2π/2ⁿ')}. Adding ${m('a')} just turns every hand further:</p>
${EQ('e<sup>2πi b/2ᵏ</sup> → e<sup>2πi (a+b)/2ᵏ</sup>')}
<p>For a classical constant ${m('a')} that is ${m('n')} single-qubit phase gates; for a quantum ${m('a')} it is a pattern of controlled phase rotations. An inverse QFT then reads out ${m('|a + b⟩')}. The QFTs cost about ${m('n²/2')} controlled rotations, but tiny rotations can be dropped, the <strong>approximate QFT</strong>, with an error that falls exponentially in the number kept. Beauregard (2003) built a Shor circuit on just ${m('2n + 3')} qubits this way.</p>
${LAB('qftadd')}
<h2>What arithmetic costs</h2>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Adder</th><th>Qubits</th><th>Toffoli / rotations</th><th>Depth</th></tr></thead><tbody>
<tr><td>Vedral–Barenco–Ekert (1996)</td><td>≈ 3n</td><td>≈ 4n Toffoli</td><td>O(n)</td></tr>
<tr><td>Cuccaro ripple-carry (2004)</td><td>2n + 2</td><td>2n Toffoli</td><td>O(n)</td></tr>
<tr><td>Gidney, temporary AND (2018)</td><td>≈ 3n</td><td>≈ n Toffoli</td><td>O(n)</td></tr>
<tr><td>Carry-lookahead (Draper, Kutin, Rains, Svore, 2004)</td><td>≈ 4n</td><td>O(n) Toffoli</td><td>O(log n)</td></tr>
<tr><td>Draper QFT adder (2000)</td><td>2n (n for a constant)</td><td>≈ n² rotations</td><td>O(n) with approximation</td></tr>
</tbody></table></div>
<p>On an error-corrected machine Toffolis and small rotations are the expensive gates, because each needs magic states ([[L:magic]]) or long synthesized sequences ([[L:synthesis]]), so Toffoli count is the figure of merit. Gidney’s trick computes a logical AND with one Toffoli and uncomputes it with a measurement and a classically controlled CZ, halving the cost of addition. A schoolbook modular exponentiation for an ${m('n')}-bit number needs ${m('O(n)')} multiplications of ${m('O(n)')} additions each, ${m('O(n³)')} gates in all; windowing, approximate residue arithmetic and other tricks have cut the estimate for 2048-bit RSA from about 20 million noisy qubits running for 8 hours (Gidney and Ekerå, 2019) to fewer than a million running for under a week (Gidney, 2025). Resource estimates are mostly estimates of arithmetic ([[L:resources]]).</p>
`,
  labs: {
    ripple: {
      title: 'A ripple-carry adder, gate by gate',
      cap: 'Wires carry the ancilla c, the interleaved bits of a and b (least significant first) and the high carry z; labels show the current bit values. Step through MAJ blocks (carry rippling down) and UMA blocks (rippling back up, restoring a and leaving the sum in b). In superposition mode a starts as an equal superposition of every value, and one pass computes every sum at once.',
      build(body, id) {
        let n = 3, A = 5, B = 3, allA = false, k = 0, C = cuccaro(n), states = [], timer = 0;
        const cw = h('div', { class: 'scroll-x' }), ro = h('div', { class: 'readout', style: 'white-space:normal' }), ctl = h('div', { class: 'stack' });
        const init = () => { C = cuccaro(n); k = 0; states = []; const vals = allA ? [...Array(1 << n).keys()] : [A]; for (const av of vals) { const s = new Array(C.W).fill(0); for (let i = 0; i < n; i++) { s[C.a(i)] = av >> i & 1; s[C.b(i)] = B >> i & 1; } states.push(s); } draw(); };
        const apply = gt => { for (const s of states) { if (gt[0] === 'CX') { if (s[gt[1]]) s[gt[2]] ^= 1; } else if (s[gt[1]] && s[gt[2]]) s[gt[3]] ^= 1; } };
        const reg = (s, f) => { let v = 0; for (let i = 0; i < n; i++) v |= s[f(i)] << i; return v; };
        const draw = () => {
          const one = states.length === 1, s0 = states[0], labels = C.names.map((nm, w) => one ? `${nm} ${s0[w]}` : nm);
          const cols = C.g.map(gt => gt[0] === 'CX' ? [{ g: 'CX', c: gt[1], t: gt[2] }] : [{ g: 'MCX', cs: [gt[1], gt[2]], t: gt[3] }]);
          cw.innerHTML = ''; cw.append(drawCircuit(C.W, cols, { labels, cw: 36, rh: 32, lw: 54, at: k, aria: 'Ripple-carry adder circuit' }).svg);
          const blk = k === 0 ? 'start' : k <= 3 * n ? `MAJ block ${Math.ceil(k / 3)} of ${n}: carry rippling up` : k === 3 * n + 1 ? 'copy the top carry into z' : k < C.g.length ? `UMA block ${Math.ceil((k - 3 * n - 1) / 3)} of ${n}: restoring a, writing sum bits` : 'done';
          let s = `<span class="k">gate ${k} of ${C.g.length} (${C.g.filter(x => x[0] === 'CCX').length} Toffoli) · </span>${blk}<br>`;
          if (one) s += `<span class="k">a = </span>${reg(s0, C.a)} &nbsp; <span class="k">b register = </span>${reg(s0, C.b)} &nbsp; <span class="k">z = </span>${s0[C.z]} &nbsp; <span class="k">ancilla c = </span>${s0[0]}` + (k === C.g.length ? `<br><span class="k">result </span>z·2${sup(n)} + b = ${reg(s0, C.b) + (s0[C.z] << n)} = ${A} + ${B}` : '');
          else s += `<span class="k">${states.length} branches, amplitude 1/√${states.length} each:</span><br>` + states.map(st => `|a=${reg(st, C.a)}⟩|b=${reg(st, C.b)}⟩|z=${st[C.z]}⟩`).join(' + ') + (k === C.g.length ? `<br><span class="k">every branch now holds b + a = ${B} + a (mod ${1 << n}, overflow in z)</span>` : '');
          ro.innerHTML = s;
        };
        const step = () => { if (k < C.g.length) { apply(C.g[k]); k++; draw(); } };
        const run = () => { clearTimeout(timer); const tick = () => { if (k < C.g.length) { step(); timer = Scope.later(reduced() ? 0 : 260, tick); } }; tick(); };
        const mk = () => { ctl.innerHTML = ''; ctl.append(
          field('Register size', seg([{ v: 3, label: '3 bits' }, { v: 4, label: '4 bits' }], n, v => { n = v; A = Math.min(A, (1 << n) - 1); B = Math.min(B, (1 << n) - 1); mk(); }, 'Bits')),
          field('Input a', seg([{ v: false, label: 'One value' }, { v: true, label: 'All values in superposition' }], allA, v => { allA = v; mk(); }, 'Superposition')),
          slider({ id: id('a'), label: 'a', min: 0, max: (1 << n) - 1, step: 1, value: A, fmt: String, on: v => { A = v; init(); } }),
          slider({ id: id('b'), label: 'b', min: 0, max: (1 << n) - 1, step: 1, value: B, fmt: String, on: v => { B = v; init(); } })); init(); };
        body.append(h('div', { class: 'btns' }, btn('Step', step, 'pri'), btn('Run to the end', run), btn('Reset', () => { clearTimeout(timer); init(); }, 'sm')), cw, h('div', { class: 'split' }, ctl, ro));
        mk();
      }
    },
    qftadd: {
      title: 'Draper’s Fourier adder: turning clock hands',
      cap: 'Four qubits hold b. After the QFT each qubit is a clock hand (dial) whose angle is 2πb/2ᵏ: the left hand flips with every unit, the right one turns 1/16 of a turn. “Add a” rotates every hand by 2πa/2ᵏ; the inverse QFT turns the hands back into the number a + b mod 16. Lower the approximation level to drop small rotations from both QFTs and watch the answer blur.',
      build(body, id) {
        const n = 4, N = 16; let b = 6, a = 5, m = 4, inp = 'basis', stage = 0, st = null, st0 = null, anim = null;
        const dc = canvas('', 'height:150px'), barsEl = h('div'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const bars = stateBars(barsEl, n, { height: 120 });
        const addPh = (s, f) => { for (let q = 0; q < n; q++) s.apply(q, Phase(TAU * a * f / 2 ** (q + 1))); return s; };
        const load = () => { st = new QState(n); st.re.fill(0); if (inp === 'basis') st.re[b] = 1; else { st.re[b] = S2; st.re[(b + 5) % N] = S2; } stage = 0; anim = null; show(); };
        const nRot = () => { let c3 = 0; for (let j = 0; j < n; j++) for (let k = j + 1; k < n; k++) if (k - j + 1 <= m) c3++; return c3; };
        const show = () => {
          bars.state(st.re, st.im); p.inv(); const pr = st.probs(), want = inp === 'basis' ? [(a + b) % N] : [(a + b) % N, (a + b + 5) % N];
          const names = ['input |b⟩ loaded', 'after the QFT: Fourier basis', 'after adding a (phase rotations)', 'after the inverse QFT'];
          ro.innerHTML = `<span class="k">stage </span>${names[stage]}<br><span class="k">b = </span>${inp === 'basis' ? b : `${b} and ${(b + 5) % N} (superposed)`} &nbsp; <span class="k">a = </span>${a}<br><span class="k">controlled rotations per QFT </span>${nRot()} of 6${m < 4 ? ' (approximate)' : ' (exact)'}` +
            (stage === 3 ? `<br><span class="k">expected </span>${want.join(' and ')} <span class="k">· probability of the right answer </span>${pct(want.reduce((s, w) => s + pr[w], 0), 1)}` : '');
        };
        const p = painter(dc, ({ ctx, w, h: H }) => {
          if (!st) return; const T = Theme.get(), cwid = w / n, R = Math.min(cwid * .3, H * .3);
          for (let q = 0; q < n; q++) { const v = st.bloch(q), L = Math.hypot(v[0], v[1]); const cx = cwid * (q + .5), cy = H / 2 - 4;
            if (stage === 1 || stage === 2) drawPhasor(ctx, cx, cy, R, v[0], v[1], `q${q}`); else { ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); txt(ctx, `q${q}`, cx, cy - R - 16, { font: MATHFONT(17), color: T.ink }); const bit = st.prob1(q); txt(ctx, `P(1) = ${num(bit, 2)}`, cx, cy + R + 18, { font: '500 11px "JetBrains Mono",monospace' }); dot(ctx, cx, cy + R * (1 - 2 * bit) * .8, 6, T.copper); }
            if (stage === 1 || stage === 2) txt(ctx, `turns by 1/${2 ** (q + 1)} per unit`, cx, H - 6, { font: '500 10px "JetBrains Mono",monospace' }); }
        });
        const doQFT = () => { if (stage !== 0) load(); qftC(st, n, m, false); stage = 1; show(); };
        const doAdd = () => { if (stage !== 1) { load(); qftC(st, n, m, false); stage = 1; } st0 = st.clone(); anim = { t0: performance.now() }; };
        const doIQFT = () => { if (stage === 0) { doQFT(); addPh(st, 1); } else if (stage === 1) addPh(st, 1); if (anim) { st = addPh(st0.clone(), 1); anim = null; } if (stage === 3) return; qftC(st, n, m, true); stage = 3; show(); };
        Scope.tick(now => { if (!anim) return; const t = reduced() ? 1 : clamp((now - anim.t0) / 1100, 0, 1); st = addPh(st0.clone(), ease(t)); stage = 2; if (t >= 1) anim = null; show(); });
        const runAll = () => { load(); Scope.later(reduced() ? 0 : 500, () => { qftC(st, n, m, false); stage = 1; show(); Scope.later(reduced() ? 0 : 700, () => { doAdd(); Scope.later(reduced() ? 0 : 1500, () => { if (stage === 2 && !anim) { qftC(st, n, m, true); stage = 3; show(); } }); }); }); };
        body.append(h('div', { class: 'btns' }, btn('1 · Load b', load), btn('2 · QFT', doQFT), btn('3 · Add a', doAdd), btn('4 · Inverse QFT', doIQFT), btn('Run all', runAll, 'pri')), dc,
          h('div', { class: 'split' }, barsEl, h('div', { class: 'stack' },
            field('Input', seg([{ v: 'basis', label: '|b⟩' }, { v: 'sup', label: '(|b⟩ + |b+5⟩)/√2' }], inp, v => { inp = v; load(); }, 'Input')),
            slider({ id: id('b'), label: 'b', min: 0, max: 15, step: 1, value: b, fmt: String, on: v => { b = v; load(); } }),
            slider({ id: id('a'), label: 'a (classical constant)', min: 0, max: 15, step: 1, value: a, fmt: String, on: v => { a = v; load(); } }),
            slider({ id: id('m'), label: 'Approximation: keep rotations down to 2π/2ᵐ', min: 1, max: 4, step: 1, value: m, fmt: v => `m = ${v}` + (v === 4 ? ' (exact)' : v === 1 ? ' (no rotations)' : ''), on: v => { m = v; load(); } }), ro)));
        load();
      }
    }
  },
  take: ['A quantum adder keeps one input, |a⟩|b⟩ → |a⟩|a + b⟩, so it is reversible and acts on superpositions of inputs in one pass.',
    'The Cuccaro ripple-carry adder uses MAJ blocks to ripple carries up and UMA blocks to uncompute them, with one ancilla and 2n Toffolis.',
    'Draper’s adder works in the Fourier basis, where adding a turns each qubit’s phase by 2πa/2ᵏ; it needs no ancilla, and small rotations can be dropped.',
    'Shor’s algorithm is dominated by arithmetic; Toffoli count is the key cost, and better adders have cut RSA-2048 estimates below a million noisy qubits.'],
  quiz: QZ([
    ['Why must a quantum adder keep one of its inputs?', ['To save qubits', 'Quantum gates are reversible, and (a, b) → a + b alone would destroy information', 'For speed', 'Because of decoherence'], 1, 'Keeping a makes the map |a⟩|b⟩ → |a⟩|a+b⟩ a permutation of basis states.'],
    ['What happens when a reversible adder acts on a superposition of inputs?', ['It fails', 'It produces the superposition of all corresponding sums in one pass', 'It measures the input', 'It outputs only the largest sum'], 1, 'Linearity; but measuring returns only one sum, so the power lies in later interference.'],
    ['What does a MAJ block compute?', ['The sum bit', 'The majority of the incoming carry, aᵢ and bᵢ, which is the outgoing carry', 'The parity of all bits', 'A phase'], 1, 'The carry ripples down the chain through the MAJ blocks.'],
    ['Why does the Cuccaro adder run UMA blocks after the top carry is copied?', ['To double the result', 'To uncompute the carries and restore a, leaving only the sum in b', 'To measure the ancilla', 'To apply the QFT'], 1, 'Leftover carry garbage would stay entangled with the result and spoil interference.'],
    ['How many qubits does the Cuccaro adder need for n-bit numbers?', ['n', '2n + 2: both registers, one ancilla and the high carry', '3n²', '4n + 7'], 1, 'Its single ancilla was an improvement over earlier designs with about 3n qubits.'],
    ['After the QFT, what phase does qubit k of QFT|b⟩ carry?', ['b', '2πb/2ᵏ', 'πk', 'Zero'], 1, 'The qubits act as clock hands turning at speeds 1/2, 1/4, …, 1/2ⁿ of a turn per unit of b.'],
    ['How does Draper’s adder add a classical constant a?', ['With Toffoli gates', 'With one phase rotation per qubit in the Fourier basis, turning each phase by 2πa/2ᵏ', 'By measuring and re-preparing', 'With SWAP gates'], 1, 'Then an inverse QFT converts the phases back into the binary number a + b.'],
    ['What is the approximate QFT?', ['A QFT with fewer qubits', 'A QFT that drops controlled rotations below some small angle, with exponentially small error', 'A classical FFT', 'A QFT without Hadamards'], 1, 'Most rotations in a large QFT are tiny and contribute little.'],
    ['Why is Toffoli count the main cost metric for arithmetic on error-corrected machines?', ['Toffolis are slow to compile', 'Cliffords are cheap, while each Toffoli needs magic states', 'Toffolis need more qubits', 'CNOTs are expensive'], 1, 'Gidney’s temporary-AND trick halves the Toffoli count of addition.'],
    ['How much of Shor’s algorithm’s cost is arithmetic?', ['Almost none', 'Most of it: modular exponentiation dominates the gate count', 'Exactly half', 'Only the QFT matters'], 1, 'The final QFT is cheap compared with O(n³) gates of modular multiplication.']
  ])
});

/* ---------- inside the cryostat ---------- */
const kB = 1.380649e-23, hP = 6.62607e-34;
const nBE = (fGHz, T) => T <= 0 ? 0 : 1 / Math.expm1(hP * fGHz * 1e9 / (kB * T));
const STAGES_C = [{ n: '50 K', s: '50 K', T: 50, cap: 40, pas: 2e-3 }, { n: '4 K', s: '4 K', T: 4, cap: 1.5, pas: 2e-4 }, { n: 'Still', s: 'Still', T: .8, cap: .04, pas: 8e-6 }, { n: 'Cold plate', s: 'CP', T: .1, cap: 2e-4, pas: 4e-7 }, { n: 'Mixing chamber', s: 'MXC', T: .015, cap: 2e-5, pas: 3e-9 }];
/* approximate He-3/He-4 coexistence dome: x = 0.066 at T = 0 on the dilute side, x = 1 on the concentrated side, tricritical point (0.67, 0.867 K) */
const gDome = T => 1 - Math.sqrt(Math.max(0, 1 - (T / .867) ** 2));
const xDil = T => .066 + .604 * gDome(T), xCon = T => 1 - .33 * gDome(T);
function phaseCurves() { const dil = [], con = []; for (let i = 0; i <= 160; i++) { const T = .867 * Math.sin(PI / 2 * i / 160); dil.push([xDil(T), T]); con.push([xCon(T), T]); } return { dil, con, tc: [.67, .867] }; }

LESSONS.push({
  id: 'cryostat', n: 19.7, stage: 4, minutes: 15, title: 'Inside the cryostat: dilution refrigerators and wiring',
  lede: 'A superconducting quantum computer is mostly refrigerator. The chip sits at about 10 millikelvin at the bottom of a gold-plated chandelier, cooled by a quantum fluid mixture and fed by hundreds of carefully attenuated cables. Here is how that works and why wiring is a scaling problem.',
  html: `
<h2>Why ten millikelvin</h2>
<p>A transmon at 5 GHz has an energy gap ${m('hf')} equal to the thermal energy ${m('k<sub>B</sub>T')} at about 240 mK. Well below that, thermal excitation is suppressed exponentially: the excited-state population is roughly ${m('e^(−hf/k<sub>B</sub>T)')}, about 9% at 100 mK but a few parts per million at 20 mK ([[L:hardware]]). The aluminium of the circuit must also be deep in its superconducting state (it becomes superconducting at about 1.2 K) so that broken Cooper pairs, <strong>quasiparticles</strong>, are rare. In practice qubits show effective temperatures of 30 to 60 mK, because stray radiation and noise leak in along the wires.</p>
<h2>How a dilution refrigerator works</h2>
<p>The upper stages are cooled by a <strong>pulse-tube cooler</strong>, a closed-cycle helium-gas refrigerator that reaches about 50 K and 3 to 4 K on two plates, replacing the liquid-helium baths of older “wet” fridges. Below that the work is done by a mixture of helium-3 and helium-4. Below 0.87 K the mixture separates into two liquid phases, like oil and water: a concentrated phase of almost pure helium-3 floating on a dilute phase of superfluid helium-4 that keeps about 6.6% helium-3 even at absolute zero.</p>
<p>The <strong>still</strong>, at about 0.8 K, is connected to the dilute phase. Pumping on it removes mostly helium-3, because helium-3 evaporates far more readily. To restore equilibrium, helium-3 atoms cross the phase boundary in the <strong>mixing chamber</strong> from the concentrated to the dilute phase, and that crossing absorbs heat, much like evaporation but working down to millikelvin temperatures. The pumped helium-3 is cooled again on its way back through heat exchangers and returned to the concentrated phase, so the cycle runs continuously. The cooling power is approximately</p>
${EQ('Q̇ ≈ 84 ṅ T² &nbsp;watts')}
<p>for a helium-3 flow ${m('ṅ')} in mol/s, so it falls rapidly as temperature drops: a typical large fridge offers tens of microwatts at 20 mK and around a milliwatt at 100 mK. Heinz London proposed the principle in 1951, and the first dilution refrigerator ran in Leiden in 1965.</p>
${LAB('mixing')}
<h2>The wiring problem</h2>
<p>Every qubit needs coaxial lines for drive pulses, often a flux line, and a share of readout lines. Each line is a pipe for heat and for noise. Room temperature sends down a flood of thermal microwave photons, about ${m('k<sub>B</sub>T/hf ≈ 1,250')} per mode at 5 GHz. A matched attenuator at temperature ${m('T')} replaces part of the incoming noise with its own, colder noise:</p>
${EQ('n<sub>out</sub> = n<sub>in</sub>/A + (1 − 1/A) n(T)')}
<p>so a chain of attenuators, typically 20 dB at 4 K and 20 dB each at the cold plate and mixing chamber, cools the line step by step. Too little attenuation leaves stray photons in the readout resonators, which dephase the qubits ([[L:decoherence]]); too much makes the attenuators burn signal power as heat on the coldest plates, where cooling power is scarce. Output lines go the other way: the faint readout signal passes through circulators and isolators, a near-quantum-limited parametric amplifier at the mixing chamber, a HEMT amplifier at 4 K and more amplification at room temperature ([[L:readout]]). Infrared filters, magnetic shields and light-tight cans keep out stray radiation, which creates quasiparticles; even cosmic rays and natural radioactivity have been caught causing correlated errors across whole chips.</p>
${LAB('wiring')}
<h2>Scaling up</h2>
<ul>
<li><strong>Denser wiring.</strong> Flexible printed transmission lines carry dozens of signals in one ribbon with less heat than individual coax.</li>
<li><strong>Control electronics in the cold.</strong> Cryogenic CMOS controllers at about 4 K, such as Intel’s Horse Ridge and Google’s cryo-CMOS chip, generate pulses close to the qubits so that fewer cables come from room temperature. Their own power dissipation must fit the 4 K budget.</li>
<li><strong>Multiplexing.</strong> One readout line already serves several qubits through frequency-multiplexed resonators; time- and frequency-multiplexed control is being explored too.</li>
<li><strong>Bigger and linked fridges.</strong> IBM’s Goldeneye and Bluefors’ KIDE are fridges sized for thousands of qubits, and modular machines link several cryostats with microwave or optical connections ([[L:distributed]]).</li>
</ul>
${NOTE('Other platforms', `<p>Not every qubit needs a dilution refrigerator. Trapped ions and neutral atoms are cooled by lasers inside vacuum chambers, sometimes with a 4 K cryostat to improve the vacuum ([[L:ions]], [[L:atoms]]). Silicon spin qubits can operate at around 1 K, where coolers have hundreds of times more power ([[L:spins]]), and photonic systems need cold only for their detectors ([[L:photonic]]).</p>`)}
`,
  labs: {
    mixing: {
      title: 'The helium mixture and the cooling budget',
      cap: 'Left: the phase diagram of ³He–⁴He mixtures (shape approximate). At the still, about 0.8 K, mostly ³He evaporates from the dilute liquid. Below the tricritical point the mixture splits into a ³He-rich phase and a dilute phase that keeps about 6.6% ³He as T → 0; the mixing chamber operates on that boundary. Right: cooling power 84 ṅ T² for the chosen ³He flow, and the heat load on the mixing chamber. Where they cross is the base temperature.',
      build(body, id) {
        let flow = 600, load = 10; const PC = phaseCurves();
        const pc = canvas('', 'height:250px'), qc = canvas('', 'height:250px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const Tbase = () => Math.sqrt(.004 ** 2 + load * 1e-6 / (84 * flow * 1e-6));
        const pp = painter(pc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 1], y: [0, 2.3], xt: [0, .25, .5, .75, 1], xf: v => Math.round(v * 100) + '%', yt: [0, .5, 1, 1.5, 2], yf: v => v + ' K', xl: '³He fraction', yl: 'temperature', pad: { l: 44, b: 30 } });
          ctx.fillStyle = rgba(T.cyan, .12); ctx.beginPath(); ctx.moveTo(A.X(PC.dil[0][0]), A.Y(0)); PC.dil.forEach(p => ctx.lineTo(A.X(p[0]), A.Y(p[1]))); [...PC.con].reverse().forEach(p => ctx.lineTo(A.X(p[0]), A.Y(p[1]))); ctx.lineTo(A.X(1), A.Y(0)); ctx.closePath(); ctx.fill();
          polyline(ctx, PC.dil.map(p => [A.X(p[0]), A.Y(p[1])]), T.cyan, 2.4); polyline(ctx, PC.con.map(p => [A.X(p[0]), A.Y(p[1])]), T.cyan, 2.4);
          polyline(ctx, [[A.X(0), A.Y(2.17)], [A.X(PC.tc[0]), A.Y(PC.tc[1])]], T.muted, 1.6, [5, 4]);
          txt(ctx, 'λ-line: superfluid below', A.X(.2), A.Y(1.95), { align: 'left', font: '500 10.5px "JetBrains Mono",monospace' });
          txt(ctx, 'two phases coexist', A.X(.55), A.Y(.45), { color: T.cyan, font: '600 11px "JetBrains Mono",monospace' });
          dot(ctx, A.X(PC.tc[0]), A.Y(PC.tc[1]), 4.5, T.ink); txt(ctx, 'tricritical point 0.87 K', A.X(PC.tc[0]) + 6, A.Y(PC.tc[1]) - 14, { align: 'center', font: '500 10.5px "JetBrains Mono",monospace' });
          const tb = Tbase(); dot(ctx, A.X(xDil(tb)), A.Y(tb), 6, T.copper, T.surface); dot(ctx, A.X(1), A.Y(tb), 6, T.copper, T.surface);
          txt(ctx, '← ³He crosses here (mixing chamber)', A.X(.55), A.Y(tb) - 12, { color: T.copper, font: '600 10.5px "JetBrains Mono",monospace' });
          dot(ctx, A.X(.01), A.Y(.8), 5, T.ink); txt(ctx, 'still ≈ 0.8 K', A.X(.04), A.Y(.8), { align: 'left', font: '500 10.5px "JetBrains Mono",monospace' });
        });
        const qp = painter(qc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [.005, .2], y: [1e-8, 1e-2], xlog: true, ylog: true, xt: [.005, .01, .02, .05, .1, .2], xf: v => Math.round(v * 1000) + ' mK', yt: [1e-8, 1e-6, 1e-4, 1e-2], yf: v => fmtSI(v, 'W', 0), xl: 'mixing-chamber temperature', yl: 'power', pad: { l: 52, b: 30 } });
          const pts = []; for (let i = 0; i <= 120; i++) { const t = .005 * Math.pow(40, i / 120); pts.push([A.X(t), A.Y(Math.max(1e-8, 84 * flow * 1e-6 * t * t))]); } polyline(ctx, pts, T.cyan, 2.6);
          polyline(ctx, [[A.X(.005), A.Y(load * 1e-6)], [A.X(.2), A.Y(load * 1e-6)]], T.copper, 2.2, [6, 4]);
          const tb = Tbase(); dot(ctx, A.X(clamp(tb, .005, .2)), A.Y(load * 1e-6), 6, T.copper, T.surface);
          txt(ctx, 'cooling power 84 ṅT²', A.X(.06), A.Y(84 * flow * 1e-6 * .06 * .06) - 14, { color: T.cyan, font: '600 11px "JetBrains Mono",monospace' });
          txt(ctx, 'heat load', A.X(.006), A.Y(load * 1e-6) - 10, { align: 'left', color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
        });
        const text = () => { const tb = Tbase(); ro.innerHTML = `<span class="k">base temperature </span>${num(tb * 1000, 1)} mK<br><span class="k">cooling power at 20 mK </span>${num(84 * flow * 1e-6 * 4e-4 * 1e6, 1)} µW <span class="k">· at 100 mK </span>${num(84 * flow * 1e-6 * 1e-2 * 1e6, 0)} µW<br><span class="k">thermal population of a 5 GHz qubit at base </span>${sci(nBE(5, tb) / (1 + 2 * nBE(5, tb)), 2)}<br><span class="k">(a 4 mK floor stands in for imperfect heat exchangers)</span>`; };
        const up = () => { pp.inv(); qp.inv(); text(); };
        body.append(h('div', { class: 'split even' }, pc, qc), h('div', { class: 'split' }, h('div', { class: 'stack' },
          slider({ id: id('f'), label: '³He circulation rate ṅ', min: 100, max: 1500, step: 50, value: flow, fmt: v => v + ' µmol/s', on: v => { flow = v; up(); } }),
          slider({ id: id('q'), label: 'Heat load on the mixing chamber', min: -1, max: 2.5, step: .05, value: Math.log10(load), fmt: v => num(10 ** v, v < 0 ? 2 : 1) + ' µW', on: v => { load = 10 ** v; up(); } })), ro));
        up();
      }
    },
    wiring: {
      title: 'Design an attenuator chain',
      cap: 'Choose the attenuation at each plate of a drive line. The top plot follows the thermal photon number down the line (log scale) against the target at the chip. The bars show each plate’s heat load from all the lines, passive conduction plus power burned in attenuators, as a fraction of its cooling power (illustrative values of the right order of magnitude). More attenuation cools the noise but heats the cold plates.',
      build(body, id) {
        const att = [0, 20, 0, 20, 20]; let lines = 200, pdbm = -80, f = 5;
        const nc = canvas('', 'height:200px'), hc = canvas('', 'height:170px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const calc = () => {
          let n = nBE(f, 300); const trace = [['300 K', n]];
          STAGES_C.forEach((s, i) => { const A = 10 ** (att[i] / 10); n = n / A + (1 - 1 / A) * nBE(f, s.T); trace.push([s.s, n]); });
          const Pq = 1e-3 * 10 ** (pdbm / 10); let P = Pq; const diss = new Array(5).fill(0);
          for (let i = 4; i >= 0; i--) { const A = 10 ** (att[i] / 10), Pin = P * A; diss[i] = Pin - P; P = Pin; }
          const heat = STAGES_C.map((s, i) => lines * (s.pas + diss[i])), frac = heat.map((q, i) => q / STAGES_C[i].cap);
          return { trace, n, heat, frac, Proom: P, tot: att.reduce((s, v) => s + v, 0) };
        };
        let R = calc();
        const pn = painter(nc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 5], y: [1e-5, 1e4], ylog: true, xt: [0, 1, 2, 3, 4, 5], xf: i => R.trace[i] ? R.trace[i][0] : '', yt: [1e-4, 1e-2, 1, 1e2, 1e4], yf: v => v >= 1 ? String(v) : '10' + sup(Math.round(Math.log10(v))), yl: 'thermal photons per mode', pad: { l: 52, b: 30 } });
          ctx.fillStyle = rgba(T.good || T.cyan, .12); ctx.fillRect(A.L, A.Y(1e-3), A.R - A.L, A.B - A.Y(1e-3));
          txt(ctx, 'target < 10⁻³', A.R - 6, A.Y(1e-3) + 10, { align: 'right', font: '500 10.5px "JetBrains Mono",monospace' });
          const pts = R.trace.map((t, i) => [A.X(i), A.Y(clamp(t[1], 1e-5, 1e4))]); polyline(ctx, pts, T.copper, 2.6); pts.forEach(p => dot(ctx, p[0], p[1], 4.5, T.copper));
        });
        const ph = painter(hc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), L = 104, Wd = w - L - 70, rh = (H - 10) / 5;
          STAGES_C.forEach((s, i) => { const y = 5 + i * rh, fr = R.frac[i], bw = Math.min(1.2, fr) / 1.2 * Wd; txt(ctx, s.n, L - 8, y + rh / 2, { align: 'right', color: T.ink, font: '500 11px "JetBrains Mono",monospace' });
            ctx.fillStyle = T.surface2; ctx.fillRect(L, y + 4, Wd, rh - 8); ctx.fillStyle = fr > 1 ? T.bad : fr > .5 ? T.copper : T.cyan; ctx.fillRect(L, y + 4, bw, rh - 8);
            ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; const x1 = L + Wd / 1.2; ctx.beginPath(); ctx.moveTo(x1, y + 2); ctx.lineTo(x1, y + rh - 2); ctx.stroke();
            txt(ctx, fr > 9.99 ? '> 999%' : pct(fr, 0), L + Wd + 8, y + rh / 2, { align: 'left', color: fr > 1 ? T.bad : T.muted, font: '600 11px "JetBrains Mono",monospace' }); });
        });
        const text = () => { const Tphi = 1 / (TAU * 1e6 * Math.max(R.n, 1e-12));
          ro.innerHTML = `<span class="k">total attenuation </span>${R.tot} dB<br><span class="k">thermal photons at the chip </span>${sci(R.n, 2)} ${R.n < 1e-3 ? '✓' : '(too hot)'}<br><span class="k">dephasing limit 1/(n κ), κ/2π = 1 MHz </span>${Tphi > 1 ? '> 1 s' : fmtSI(Tphi, 's', 1)}<br><span class="k">source power needed at room temperature </span>${num(pdbm + R.tot, 0)} dBm per line<br>${R.frac.some(x => x > 1) ? `<span style="color:var(--bad)">Over budget at: ${STAGES_C.filter((s, i) => R.frac[i] > 1).map(s => s.n).join(', ')}</span>` : '<span class="k">all plates within their cooling power</span>'}`; };
        const up = () => { R = calc(); pn.inv(); ph.inv(); text(); };
        const sl = STAGES_C.map((s, i) => slider({ id: id('a' + i), label: `Attenuator at ${s.n} (${s.T >= 1 ? s.T + ' K' : Math.round(s.T * 1000) + ' mK'})`, min: 0, max: 30, step: 1, value: att[i], fmt: v => v + ' dB', on: v => { att[i] = v; up(); } }));
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, nc, hc), h('div', { class: 'stack' }, ...sl,
          slider({ id: id('n'), label: 'Number of drive lines', min: 10, max: 2000, step: 10, value: lines, fmt: String, on: v => { lines = v; up(); } }),
          slider({ id: id('p'), label: 'Average power reaching each qubit', min: -90, max: -50, step: 1, value: pdbm, fmt: v => v + ' dBm', on: v => { pdbm = v; up(); } }), ro)));
        up();
      }
    }
  },
  take: ['Qubits at 5 GHz need temperatures far below hf/k_B ≈ 240 mK; dilution refrigerators reach about 10 mK, though stray noise gives effective temperatures of 30–60 mK.',
    'Below 0.87 K a ³He–⁴He mixture separates; pumping ³He from the dilute phase at the still makes ³He cross the boundary in the mixing chamber, absorbing heat.',
    'Cooling power falls as T² (≈ 84 ṅT² W), so the coldest plate has only tens of microwatts to spare.',
    'Attenuator chains cool the thermal noise on input lines step by step, but burn power on cold plates; wiring heat and space limit scaling, motivating flex cables, cryo-CMOS and multiplexing.'],
  quiz: QZ([
    ['At what temperature does thermal energy k_BT equal the energy hf of a 5 GHz qubit?', ['About 5 K', 'About 240 mK', 'About 1 mK', 'About 77 K'], 1, 'hf/k_B ≈ 48 mK per GHz, so 5 GHz corresponds to about 240 mK.'],
    ['What cools the upper stages (about 50 K and 4 K) of a modern dry dilution refrigerator?', ['Liquid nitrogen', 'A pulse-tube cooler', 'Laser cooling', 'Thermoelectric elements'], 1, 'Closed-cycle pulse tubes replaced liquid-helium baths.'],
    ['What happens to a ³He–⁴He mixture below about 0.87 K?', ['It freezes', 'It separates into a ³He-rich phase and a dilute phase that keeps about 6.6% ³He', 'It boils', 'It becomes a gas'], 1, 'The finite solubility at T → 0 is what makes continuous dilution cooling possible.'],
    ['Where does the actual cooling happen in a dilution refrigerator?', ['At the still', 'In the mixing chamber, where ³He crosses from the concentrated into the dilute phase', 'In the pulse tube', 'In the vacuum can'], 1, 'The crossing absorbs heat, like evaporation; the still pumps ³He out to keep it going.'],
    ['Why does pumping on the still remove mostly ³He?', ['³He is heavier', '³He has a much higher vapour pressure than ⁴He at that temperature', '⁴He is a solid there', 'The pump is tuned to ³He'], 1, 'Selective evaporation of ³He keeps the dilute phase depleted, driving the cycle.'],
    ['How does the cooling power of a dilution refrigerator depend on temperature?', ['It is constant', 'It falls roughly as T², about 84 ṅ T² watts', 'It grows as T falls', 'It falls as e^(−T)'], 1, 'This is why only tens of microwatts are available at 20 mK.'],
    ['How many thermal photons per mode does room temperature send down a 5 GHz line?', ['About 0.001', 'About 1,250', 'Exactly 1', 'About 10⁹'], 1, 'k_BT/hf at 300 K and 5 GHz is about 1,250.'],
    ['What does a matched attenuator at temperature T do to incoming noise?', ['Nothing', 'Passes a fraction 1/A of it and adds (1 − 1/A) of its own thermal noise n(T)', 'Doubles it', 'Removes it entirely at any temperature'], 1, 'Placing attenuators on colder plates cools the line step by step.'],
    ['Why not simply put all the attenuation on the mixing-chamber plate?', ['It is too small', 'The attenuators would dissipate signal power there, exceeding its tiny cooling power, and the noise from upper stages is better removed early', 'Attenuators do not work at 10 mK', 'It would amplify noise'], 1, 'Heat budgets favour attenuating at warmer stages where cooling is plentiful.'],
    ['Which approach reduces the number of cables from room temperature?', ['More attenuators', 'Cryogenic CMOS control electronics and multiplexing', 'Longer cables', 'Warmer qubits only'], 1, 'Generating and routing signals inside the cryostat cuts wiring, within the 4 K power budget.']
  ])
});

/* ---------- quantum LDPC codes ---------- */
const CL = {
  rep3: { name: 'Repetition 3', H: [[1, 1, 0], [0, 1, 1]] },
  rep5: { name: 'Repetition 5', H: [[1, 1, 0, 0, 0], [0, 1, 1, 0, 0], [0, 0, 1, 1, 0], [0, 0, 0, 1, 1]] },
  ring4: { name: 'Ring 4 (cyclic)', H: [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1]] },
  ham7: { name: 'Hamming [7,4,3]', H: [[1, 0, 1, 0, 1, 0, 1], [0, 1, 1, 0, 0, 1, 1], [0, 0, 0, 1, 1, 1, 1]] }
};
function rankW(rows, W) { const r = rows.map(x => Uint32Array.from(x)); let rk = 0; for (let bit = 0; bit < W * 32 && rk < r.length; bit++) { const w = bit >> 5, mk = 1 << (bit & 31); let p = -1; for (let i = rk; i < r.length; i++) if (r[i][w] & mk) { p = i; break; } if (p < 0) continue; [r[rk], r[p]] = [r[p], r[rk]]; for (let i = 0; i < r.length; i++) if (i !== rk && (r[i][w] & mk)) for (let k = 0; k < W; k++) r[i][k] ^= r[rk][k]; rk++; } return rk; }
const toRows = M2 => { const W = Math.ceil(M2[0].length / 32) || 1; return { W, rows: M2.map(row => { const v = new Uint32Array(W); row.forEach((x, j) => { if (x) v[j >> 5] |= 1 << (j & 31); }); return v; }) }; };
const rankM = M2 => { if (!M2.length) return 0; const { W, rows } = toRows(M2); return rankW(rows, W); };
const tr = M2 => M2[0].map((_, j) => M2.map(r => r[j]));
function minDist(H) { const n = H[0].length; let best = Infinity; for (let x = 1; x < 1 << n; x++) { if (H.every(r => r.reduce((s, v, j) => s ^ (v & (x >> j & 1)), 0) === 0)) best = Math.min(best, pc32(x)); } return best; }
function classical(key) { const c3 = CL[key], H = c3.H, n = H[0].length, mm = H.length, rk = rankM(H); return { H, n, m: mm, k: n - rk, kT: mm - rk, d: minDist(H), dT: mm - rk ? minDist(tr(H)) : Infinity }; }
function hgp(c1, c2) {
  const { n: n1, m: m1, H: H1 } = c1, { n: n2, m: m2, H: H2 } = c2, NL = n1 * n2, NR = m1 * m2, N = NL + NR;
  const HX = [], HZ = [];
  for (let c = 0; c < m1; c++) for (let b2 = 0; b2 < n2; b2++) { const row = new Array(N).fill(0); for (let b1 = 0; b1 < n1; b1++) if (H1[c][b1]) row[b1 * n2 + b2] = 1; for (let c2 = 0; c2 < m2; c2++) if (H2[c2][b2]) row[NL + c * m2 + c2] = 1; HX.push(row); }
  for (let b1 = 0; b1 < n1; b1++) for (let c2 = 0; c2 < m2; c2++) { const row = new Array(N).fill(0); for (let b2 = 0; b2 < n2; b2++) if (H2[c2][b2]) row[b1 * n2 + b2] = 1; for (let c = 0; c < m1; c++) if (H1[c][b1]) row[NL + c * m2 + c2] = 1; HZ.push(row); }
  const K = N - rankM(HX) - rankM(HZ), D = Math.min(c1.d, c2.d, c1.dT, c2.dT);
  return { N, K, D, HX, HZ, NL, checks: HX.length + HZ.length };
}
const BB = {
  g72: { l: 6, m: 6, A: [[3, 0], [0, 1], [0, 2]], B: [[0, 3], [1, 0], [2, 0]], d: 6, lab: '[[72,12,6]]' },
  g90: { l: 15, m: 3, A: [[9, 0], [0, 1], [0, 2]], B: [[0, 0], [2, 0], [7, 0]], d: 10, lab: '[[90,8,10]]' },
  g108: { l: 9, m: 6, A: [[3, 0], [0, 1], [0, 2]], B: [[0, 3], [1, 0], [2, 0]], d: 10, lab: '[[108,8,10]]' },
  g144: { l: 12, m: 6, A: [[3, 0], [0, 1], [0, 2]], B: [[0, 3], [1, 0], [2, 0]], d: 12, lab: '[[144,12,12]] gross code' },
  g288: { l: 12, m: 12, A: [[3, 0], [0, 2], [0, 7]], B: [[0, 3], [1, 0], [2, 0]], d: 18, lab: '[[288,12,18]]' }
};
const monoStr = ([a, b]) => (a ? 'x' + (a > 1 ? sup(a) : '') : '') + (b ? 'y' + (b > 1 ? sup(b) : '') : '') || '1';
function bbCode(P) {
  const { l, m: mm, A, B } = P, N = l * mm, n = 2 * N, W = Math.ceil(n / 32), tgt = (r, [a, b]) => ((Math.floor(r / mm) + a) % l) * mm + (r % mm + b) % mm;
  const X = [], Z = [];
  for (let r = 0; r < N; r++) { const v = new Uint32Array(W); for (const mo of A) { const c3 = tgt(r, mo); v[c3 >> 5] ^= 1 << (c3 & 31); } for (const mo of B) { const c3 = N + tgt(r, mo); v[c3 >> 5] ^= 1 << (c3 & 31); } X.push(v); }
  for (let r = 0; r < N; r++) { const v = new Uint32Array(W); for (let c3 = 0; c3 < N; c3++) { for (const mo of B) if (tgt(c3, mo) === r) v[c3 >> 5] ^= 1 << (c3 & 31); for (const mo of A) if (tgt(c3, mo) === r) { const cc = N + c3; v[cc >> 5] ^= 1 << (cc & 31); } } Z.push(v); }
  return { n, N, k: n - rankW(X, W) - rankW(Z, W), tgt };
}

LESSONS.push({
  id: 'qldpc', n: 27.05, stage: 5, minutes: 17, title: 'Quantum LDPC codes: hypergraph products and bivariate bicycles',
  lede: 'The surface code protects one logical qubit with hundreds of physical ones. Quantum low-density parity-check codes keep every check small but allow long-range connections, and protect many logical qubits at once for a fraction of the cost. IBM’s gross code stores 12 logical qubits in 288 physical qubits.',
  html: `
<h2>The price of locality</h2>
<p>A distance-${m('d')} surface code ([[L:qec]]) encodes one logical qubit in about ${m('2d²')} physical qubits, so its encoding rate falls to zero as the distance grows. That is not bad engineering. Bravyi, Poulin and Terhal (2010) proved that any code whose checks are local in two dimensions obeys ${m('k d² = O(n)')}: more logical qubits or more distance must be paid for with many more physical qubits. To beat that bound, a code must have checks that connect distant qubits.</p>
<p>A <strong>quantum LDPC code</strong> (low-density parity check) keeps each check acting on a few qubits and each qubit in a few checks, as in the surface code, but drops geometric locality. For a CSS code ([[L:stabilizers]]) it is enough to give two sparse binary matrices ${m('H<sub>X</sub>')} and ${m('H<sub>Z</sub>')} whose rows commute: ${m('H<sub>X</sub> H<sub>Z</sub>ᵀ = 0')} mod 2. The number of logical qubits is ${m('k = n − rank H<sub>X</sub> − rank H<sub>Z</sub>')}.</p>
<h2>The hypergraph product</h2>
<p>Classical LDPC codes with constant rate and linear distance are standard in Wi-Fi and 5G, but naively combining two of them does not give commuting checks. Tillich and Zémor (2009) found a construction that always works. From classical parity-check matrices ${m('H₁')} (${m('m₁ × n₁')}) and ${m('H₂')}, the <strong>hypergraph product</strong> has two blocks of qubits, bit×bit and check×check, and</p>
${EQ('H<sub>X</sub> = [ H₁ ⊗ I | I ⊗ H₂ᵀ ], &nbsp;&nbsp; H<sub>Z</sub> = [ I ⊗ H₂ | H₁ᵀ ⊗ I ]')}
<p>The product of two repetition codes is exactly the surface code, and the product of two cyclic repetition codes is the toric code ([[L:toric]]). With good classical codes the rate stays constant while the distance grows like ${m('√n')}. Later constructions reached the ideal: <strong>good qLDPC codes</strong>, with ${m('k')} and ${m('d')} both proportional to ${m('n')}, were found by Panteleev and Kalachev (2022) and in the quantum Tanner codes of Leverrier and Zémor (2022).</p>
${LAB('hgp')}
<h2>Bivariate bicycle codes</h2>
<p>Bravyi and colleagues at IBM (Nature, 2024) found practical codes with an elegant algebraic description. Take an ${m('l × m')} grid on a torus and let ${m('x')} and ${m('y')} be the cyclic shifts along its two directions. Choose two polynomials, each a sum of three monomials, such as ${m('A = x³ + y + y²')} and ${m('B = y³ + x + x²')}. Then</p>
${EQ('H<sub>X</sub> = [ A | B ], &nbsp;&nbsp; H<sub>Z</sub> = [ Bᵀ | Aᵀ ]')}
<p>commute automatically because shifts commute. Each check touches six qubits: four nearby and two farther away. With ${m('l = 12, m = 6')} this gives the <strong>gross code</strong> ${m('[[144, 12, 12]]')}: 12 logical qubits at distance 12, using 144 data and 144 check qubits. Surface codes would need about 3,000 qubits for the same protection. Its Tanner graph splits into two planar layers, so it can be wired on a chip with two layers of couplers, and simulations show a threshold of about 0.7% under circuit-level noise, comparable to the surface code ([[L:thresholds]]).</p>
${LAB('gross')}
<h2>The catch</h2>
<ul>
<li><strong>Connectivity.</strong> Long-range couplers are hard to build in superconducting chips; IBM is developing longer “c-couplers” for this. Neutral atoms can simply move qubits around, which makes them natural hosts for qLDPC codes (Xu and colleagues, 2024; [[L:atoms]]).</li>
<li><strong>Decoding.</strong> Matching decoders ([[L:decoders]]) do not apply, because a single error can trigger more than two checks. Belief propagation with ordered-statistics post-processing (BP+OSD) and newer, faster variants are used instead.</li>
<li><strong>Computing.</strong> Many logical qubits share one block, so addressing one of them is harder. Logical operations use code automorphisms, measurements through ancillary systems (a form of lattice surgery, [[L:surgery]]) and magic states from separate factories ([[L:magic]]). IBM’s roadmap targets a machine called Starling in 2029 with about 200 logical qubits built on bivariate bicycle codes.</li>
</ul>
`,
  labs: {
    hgp: {
      title: 'Build a hypergraph product code',
      cap: 'Rows run over the bits and checks of code 1, columns over those of code 2. Circles are data qubits (bit×bit and check×check); copper squares are X checks (check×bit) and cyan squares Z checks (bit×check). Click a check to highlight the qubits it acts on. Repetition × repetition is the (unrotated) surface code; ring × ring is the toric code; Hamming × Hamming packs 16 logical qubits into 58 data qubits, with long-range checks.',
      build(body, id) {
        let k1 = 'rep3', k2 = 'rep3', sel = null, C1, C2, Q;
        const cv = canvas('', 'height:340px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const order = c3 => { const inter = c3.m >= c3.n - 1, o = []; if (inter) { for (let i = 0; i < Math.max(c3.n, c3.m); i++) { if (i < c3.n) o.push(['b', i]); if (i < c3.m) o.push(['c', i]); } } else { for (let i = 0; i < c3.n; i++) o.push(['b', i]); for (let i = 0; i < c3.m; i++) o.push(['c', i]); } return o; };
        let R1, R2;
        const support = () => { if (!sel) return new Set(); const [r, c3] = sel, a = R1[r], b = R2[c3], S = new Set(); if (a[0] === 'c' && b[0] === 'b') { for (let b1 = 0; b1 < C1.n; b1++) if (C1.H[a[1]][b1]) S.add(`b${b1},b${b[1]}`); for (let c2 = 0; c2 < C2.m; c2++) if (C2.H[c2][b[1]]) S.add(`c${a[1]},c${c2}`); } else if (a[0] === 'b' && b[0] === 'c') { for (let b2 = 0; b2 < C2.n; b2++) if (C2.H[b[1]][b2]) S.add(`b${a[1]},b${b2}`); for (let c = 0; c < C1.m; c++) if (C1.H[c][a[1]]) S.add(`c${c},c${b[1]}`); } return S; };
        const geo = (w, H) => { const cs = Math.min((w - 30) / R2.length, (H - 30) / R1.length, 56), ox = (w - cs * R2.length) / 2, oy = (H - cs * R1.length) / 2; return { cs, ox, oy }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), g = geo(w, H), S = support();
          if (sel) { const [r, c3] = sel, cx = g.ox + (c3 + .5) * g.cs, cy = g.oy + (r + .5) * g.cs; ctx.strokeStyle = R1[r][0] === 'c' ? T.copper : T.cyan; ctx.lineWidth = 1.6; ctx.globalAlpha = .75;
            R1.forEach((a, i) => R2.forEach((b, j) => { if (S.has(`${a[0]}${a[1]},${b[0]}${b[1]}`)) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(g.ox + (j + .5) * g.cs, g.oy + (i + .5) * g.cs); ctx.stroke(); } })); ctx.globalAlpha = 1; }
          R1.forEach((a, i) => R2.forEach((b, j) => { const x = g.ox + (j + .5) * g.cs, y = g.oy + (i + .5) * g.cs, s = g.cs * .32, key = `${a[0]}${a[1]},${b[0]}${b[1]}`;
            if (a[0] === b[0]) dot(ctx, x, y, s, S.has(key) ? (R1[sel[0]][0] === 'c' ? T.copper : T.cyan) : T.ink);
            else { const isX = a[0] === 'c'; ctx.fillStyle = rgba(isX ? T.copper : T.cyan, sel && sel[0] === i && sel[1] === j ? 1 : .38); ctx.fillRect(x - s, y - s, 2 * s, 2 * s); } }));
          txt(ctx, 'code 2 →', w - 6, 8, { align: 'right', font: '500 10px "JetBrains Mono",monospace' }); txt(ctx, 'code 1 ↓', 4, 8, { align: 'left', font: '500 10px "JetBrains Mono",monospace' });
        });
        cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), g = geo(r.width, r.height), j = Math.floor((e.clientX - r.left - g.ox) / g.cs), i = Math.floor((e.clientY - r.top - g.oy) / g.cs); if (i < 0 || j < 0 || i >= R1.length || j >= R2.length) return; if (R1[i][0] !== R2[j][0]) { sel = [i, j]; p.inv(); } });
        const upd = () => { C1 = classical(k1); C2 = classical(k2); Q = hgp(C1, C2); R1 = order(C1); R2 = order(C2); const i0 = R1.findIndex(a => a[0] === 'c'), j0 = R2.findIndex(b => b[0] === 'b'); sel = i0 >= 0 && j0 >= 0 ? [i0, j0] : null; p.inv();
          const tot = Q.N + Q.checks, surf = Q.K * (2 * Q.D * Q.D - 1), f = c3 => `[${c3.n},${c3.k},${c3.d}]${c3.kT ? `, transpose [${c3.m},${c3.kT},${c3.dT}]` : ''}`;
          ro.innerHTML = `<span class="k">code 1 </span>${f(C1)}<br><span class="k">code 2 </span>${f(C2)}<br><span class="k">quantum code </span>[[${Q.N}, ${Q.K}, ${Q.D}]] <span class="k">· k₁k₂ + k₁ᵀk₂ᵀ = </span>${C1.k * C2.k + C1.kT * C2.kT}<br><span class="k">physical qubits (data + checks) </span>${tot}<br><span class="k">${Q.K} rotated surface codes at distance ${Q.D} </span>${surf} qubits<br><span class="k">encoding rate k/n </span>${num(Q.K / Q.N, 3)}`; };
        const opts = Object.keys(CL).map(k => ({ v: k, label: CL[k].name }));
        body.append(h('div', { class: 'split even' }, field('Classical code 1 (rows)', seg(opts, k1, v => { k1 = v; upd(); }, 'Code 1')), field('Classical code 2 (columns)', seg(opts, k2, v => { k2 = v; upd(); }, 'Code 2'))), h('div', { class: 'split wide-l' }, cv, ro));
        upd();
      }
    },
    gross: {
      title: 'Bivariate bicycle codes on a torus',
      cap: 'Each cell of the l × m torus holds a left data qubit (upper dot), a right data qubit (lower dot) and one X and one Z check. Click a cell to see its X check: three left qubits chosen by A (copper) and three right qubits chosen by B (cyan). Some are neighbours, some far away; that reach is what lets the code beat the surface code. The number of logical qubits k is computed here from the ranks of the check matrices.',
      build(body, id) {
        let key = 'g144', C = bbCode(BB[key]), sel = 6 * 6 + 3;
        const cv = canvas('', 'height:300px'), bc = canvas('', 'height:90px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const geo = (w, H) => { const P = BB[key], cs = Math.min((w - 20) / P.l, (H - 20) / P.m), ox = (w - cs * P.l) / 2, oy = (H - cs * P.m) / 2; return { cs, ox, oy, pos: (r, R) => { const i = Math.floor(r / P.m), j = r % P.m; return [ox + (i + (R ? .66 : .34)) * cs, oy + (j + (R ? .66 : .34)) * cs]; } }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), P = BB[key], g = geo(w, H);
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; for (let i = 0; i <= P.l; i++) { ctx.beginPath(); ctx.moveTo(g.ox + i * g.cs, g.oy); ctx.lineTo(g.ox + i * g.cs, g.oy + P.m * g.cs); ctx.stroke(); } for (let j = 0; j <= P.m; j++) { ctx.beginPath(); ctx.moveTo(g.ox, g.oy + j * g.cs); ctx.lineTo(g.ox + P.l * g.cs, g.oy + j * g.cs); ctx.stroke(); }
          const i0 = Math.floor(sel / P.m), j0 = sel % P.m; ctx.fillStyle = rgba(T.copper, .18); ctx.fillRect(g.ox + i0 * g.cs, g.oy + j0 * g.cs, g.cs, g.cs);
          const cx = g.ox + (i0 + .5) * g.cs, cy = g.oy + (j0 + .5) * g.cs, LT = P.A.map(mo => C.tgt(sel, mo)), RT = P.B.map(mo => C.tgt(sel, mo));
          ctx.lineWidth = 2; for (const t of LT) { const q = g.pos(t, 0); ctx.strokeStyle = T.copper; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(q[0], q[1]); ctx.stroke(); } for (const t of RT) { const q = g.pos(t, 1); ctx.strokeStyle = T.cyan; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
          const r0 = Math.max(1.6, g.cs * .1); for (let r = 0; r < C.N; r++) { const a = g.pos(r, 0), b = g.pos(r, 1); dot(ctx, a[0], a[1], LT.includes(r) ? r0 * 2 : r0, LT.includes(r) ? T.copper : T.muted); dot(ctx, b[0], b[1], RT.includes(r) ? r0 * 2 : r0, RT.includes(r) ? T.cyan : T.muted); }
          dot(ctx, cx, cy, r0 * 1.8, T.ink);
        });
        const pb = painter(bc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), P = BB[key], bb = 2 * C.n, sc = C.k * (2 * P.d * P.d - 1), mx = Math.max(bb, sc), L = 128, Wd = w - L - 70;
          [[`bicycle (2n)`, bb, T.copper], [`surface codes`, sc, T.cyan]].forEach(([lab, v, col], i) => { const y = 14 + i * 36; txt(ctx, lab, L - 8, y + 10, { align: 'right', color: T.ink, font: '500 11px "JetBrains Mono",monospace' }); ctx.fillStyle = col; ctx.fillRect(L, y, v / mx * Wd, 20); txt(ctx, v.toLocaleString(), L + v / mx * Wd + 6, y + 10, { align: 'left', font: '600 11px "JetBrains Mono",monospace' }); });
        });
        cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), g = geo(r.width, r.height), P = BB[key], i = Math.floor((e.clientX - r.left - g.ox) / g.cs), j = Math.floor((e.clientY - r.top - g.oy) / g.cs); if (i < 0 || j < 0 || i >= P.l || j >= P.m) return; sel = i * P.m + j; p.inv(); });
        const upd = () => { const P = BB[key]; C = bbCode(P); sel = Math.floor(P.l / 2) * P.m + Math.floor(P.m / 2); p.inv(); pb.inv();
          ro.innerHTML = `<span class="k">torus </span>l = ${P.l}, m = ${P.m}<br><span class="k">A = </span>${P.A.map(monoStr).join(' + ')} &nbsp; <span class="k">B = </span>${P.B.map(monoStr).join(' + ')}<br><span class="k">code </span>[[${C.n}, ${C.k}, ${P.d}]] <span class="k">(k computed: </span>${C.k}<span class="k">; d from Bravyi et al.)</span><br><span class="k">check weight </span>6 <span class="k">· rate </span>${num(C.k / C.n, 3)}<br><span class="k">physical qubits for ${C.k} logical at distance ${P.d}: </span>${2 * C.n} vs ${(C.k * (2 * P.d * P.d - 1)).toLocaleString()} with surface codes`; };
        body.append(h('div', { class: 'btns' }, seg(Object.keys(BB).map(k => ({ v: k, label: BB[k].lab })), key, v => { key = v; upd(); }, 'Code')), h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, bc), ro));
        upd();
      }
    }
  },
  take: ['2D-local codes obey k d² = O(n) (Bravyi–Poulin–Terhal); beating it requires checks that reach across the device.',
    'A qLDPC code keeps checks small and sparse; for CSS codes, k = n − rank H_X − rank H_Z.',
    'The hypergraph product turns any two classical codes into a quantum code; repetition × repetition is the surface code, and good classical codes give constant rate.',
    'Bivariate bicycle codes such as the gross code [[144,12,12]] store 12 logical qubits in 288 physical qubits, about ten times fewer than surface codes, at the price of long-range links, harder decoding and harder logical gates.'],
  quiz: QZ([
    ['What does the Bravyi–Poulin–Terhal bound say about 2D-local codes?', ['They have no threshold', 'k d² = O(n): adding logical qubits or distance costs many more physical qubits', 'They cannot correct errors', 'They need no ancillas'], 1, 'The surface code saturates it with k = 1 and n ≈ 2d².'],
    ['What makes a code “LDPC”?', ['It has low distance', 'Each check acts on few qubits and each qubit takes part in few checks', 'It uses only Z checks', 'It is classical'], 1, 'Sparsity keeps syndrome-extraction circuits shallow; locality is not required.'],
    ['How is the number of logical qubits of a CSS code computed?', ['n − d', 'k = n − rank H_X − rank H_Z (mod 2)', 'Number of checks', 'd²'], 1, 'Each independent check removes one qubit’s worth of freedom.'],
    ['What is the hypergraph product of two repetition codes?', ['The Steane code', 'The surface code', 'A Hamming code', 'The gross code'], 1, 'Bit×bit and check×check qubits with check×bit and bit×check stabilizers give the familiar lattice.'],
    ['Why can’t two arbitrary classical codes simply be used as H_X and H_Z?', ['They are too large', 'Their checks would generally fail to commute; H_X H_Zᵀ = 0 is required', 'Classical codes have no distance', 'They need qudits'], 1, 'The hypergraph product is a recipe that guarantees commuting checks.'],
    ['What are “good” qLDPC codes?', ['Codes with distance 3', 'Families where both k and d grow linearly with n', 'Codes with weight-2 checks', 'Codes without logical qubits'], 1, 'They were found in 2022 by Panteleev–Kalachev and Leverrier–Zémor.'],
    ['What are the parameters of IBM’s gross code?', ['[[17,1,3]]', '[[144,12,12]]', '[[7,1,3]]', '[[49,1,7]]'], 1, 'With 144 check qubits it uses 288 physical qubits for 12 logical qubits.'],
    ['Why do the checks of a bivariate bicycle code commute automatically?', ['They are all Z checks', 'A and B are polynomials in commuting cyclic shifts, so AB = BA and H_X H_Zᵀ = AB + BA = 0', 'They act on disjoint qubits', 'They are measured at different times'], 1, 'Commuting circulant matrices make the construction work.'],
    ['Why are matching decoders unsuitable for most qLDPC codes?', ['They are too slow for small codes', 'A single error can flip more than two checks, so syndromes are not pairs of defects', 'They need a GPU', 'They only work for X errors'], 1, 'BP+OSD and related decoders handle the general case.'],
    ['Which hardware feature makes qLDPC codes easier on neutral-atom machines?', ['Faster gates', 'Atoms can be moved to bring distant qubits together, giving long-range connectivity', 'Lower temperatures', 'No need for measurement'], 1, 'Reconfigurable arrays avoid the need for long fixed couplers.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Ripple-carry adder', 'An adder that passes the carry bit by bit; the Cuccaro version uses MAJ and UMA blocks and one ancilla.', 'arithmetic'],
  ['Draper adder', 'An adder that adds in the Fourier basis with phase rotations, needing no ancilla.', 'arithmetic'],
  ['Approximate QFT', 'A quantum Fourier transform that drops controlled rotations below a small angle, with exponentially small error.', 'arithmetic'],
  ['Mixing chamber', 'The coldest stage of a dilution refrigerator, where ³He crosses into the dilute phase and absorbs heat.', 'cryostat'],
  ['Pulse-tube cooler', 'A closed-cycle helium refrigerator that cools the upper stages of a dry dilution refrigerator to about 50 K and 4 K.', 'cryostat'],
  ['Cryo-CMOS', 'Classical control electronics designed to run at cryogenic temperatures, near the qubits.', 'cryostat'],
  ['Hypergraph product', 'A construction (Tillich–Zémor) that turns two classical codes into a quantum CSS code with commuting checks.', 'qldpc'],
  ['BP+OSD', 'Belief propagation followed by ordered-statistics decoding, a standard decoder for quantum LDPC codes.', 'qldpc']
);
})();
