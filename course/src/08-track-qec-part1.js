/* =====================================================================
   Research track · Error correction and fault tolerance (part 1)
   ===================================================================== */
(() => {
const G = 5;
const PCOL = { I: 'var(--muted)', X: 'var(--copper)', Y: 'var(--ink)', Z: 'var(--cyan)' };
const pauliHTML = s => `<span class="pstr">${s.split('').map(ch => /[IXYZ]/.test(ch) ? `<b style="color:${PCOL[ch]}">${ch}</b>` : ch).join('')}</span>`;

/* ---------------- 21 · The stabilizer formalism ---------------- */
LESSONS.push({
  id: 'stabilizers', n: 21, stage: G, minutes: 16, title: 'The stabilizer formalism',
  lede: 'Most of quantum error correction is written in one language: describe a state, or a code, by the Pauli operators that leave it unchanged. It turns exponentially large vectors into short lists of strings.',
  html: `
<h2>Describing a state by what leaves it alone</h2>
<p>An operator ${m('P')} <strong>stabilizes</strong> a state when ${m('P|ψ⟩ = |ψ⟩')}. Z stabilizes ${m('|0⟩')}, X stabilizes ${m('|+⟩')}, and the Bell state ${m('|Φ⁺⟩')} is stabilized by both ${m('X⊗X')} and ${m('Z⊗Z')}. In fact ${m('|Φ⁺⟩')} is the only two-qubit state stabilized by both, so the pair ${m('{XX, ZZ}')} is a complete description of it.</p>
<p>In general, an ${m('n')}-qubit <strong>stabilizer state</strong> is pinned down by ${m('n')} independent, commuting Pauli strings, called generators. That is ${m('n')} strings of length ${m('n')}, about ${m('2n²')} bits, instead of ${m('2ⁿ')} complex amplitudes. Every product of generators is also a stabilizer, so the generators define a group of ${m('2ⁿ')} elements.</p>
<h2>Commuting and anticommuting</h2>
<p>Two Pauli strings either commute or anticommute. Count the positions where both strings have a non-identity letter and the letters differ. An even count means they commute; an odd count means they anticommute. Writing each string as a pair of bit vectors ${m('(x | z)')}, with X = (1|0), Z = (0|1) and Y = (1|1), turns this into a one-line formula, the <strong>symplectic product</strong>:</p>
${EQ('⟨P, P′⟩ = x·z′ + z·x′ &nbsp;(mod 2)')}
${LAB('pauli')}
<h2>Clifford gates move generators around</h2>
<p>The gates H, S and CNOT, and everything built from them, form the <strong>Clifford group</strong>. They map Pauli strings to Pauli strings under conjugation: ${m('HXH = Z')}, ${m('SXS<sup>†</sup> = Y')}, and a CNOT copies an X on its control onto its target while copying a Z on its target back onto its control. So to follow a Clifford circuit you never need the amplitudes. You just rewrite the generators gate by gate.</p>
${LAB('tableau')}
<h2>Stabilizer codes</h2>
<p>A <strong>stabilizer code</strong> uses ${m('n − k')} commuting generators on ${m('n')} physical qubits. The states stabilized by all of them form a ${m('2<sup>k</sup>')}-dimensional <strong>codespace</strong>: room for ${m('k')} logical qubits. The bit-flip code from [[L:qec]] is the simplest example, with generators ${m('Z₀Z₁')} and ${m('Z₁Z₂')}.</p>
<ul>
<li>An error that anticommutes with a generator flips that generator’s measured value from +1 to −1. The list of flipped generators is the <strong>syndrome</strong>.</li>
<li><strong>Logical operators</strong> commute with every generator but are not products of generators. They move the encoded state around inside the codespace, and no syndrome can see them.</li>
<li>The <strong>distance</strong> ${m('d')} is the weight of the lightest logical operator. A code written ${m('[[n, k, d]]')} corrects any error on up to ${m('⌊(d − 1)/2⌋')} qubits.</li>
</ul>
<p>Two classical facts carry over with a twist. Errors that differ by a stabilizer act identically on the code, so the decoder only has to find the right <em>class</em> of errors, not the exact one. This is called <strong>degeneracy</strong>, and it has no classical counterpart. And the quantum Singleton bound limits every code: ${m('n − k ≥ 2(d − 1)')}.</p>
<h2>CSS codes and the Steane code</h2>
<p>Calderbank, Shor and Steane showed how to build quantum codes from two classical ones: one supplies Z-type generators that catch X errors, the other X-type generators that catch Z errors. The Steane code ${m('[[7, 1, 3]]')} uses the classical Hamming code for both. Its three Z-type generators are the rows of the Hamming parity-check matrix, and so are its three X-type generators. A single X error lights up the Z checks in a pattern that spells out, in binary, which qubit flipped.</p>
${LAB('steane')}
${NOTE('Knill–Laflamme conditions', `<p>A code can correct a set of errors ${m('{E<sub>a</sub>}')} exactly when ${m('⟨i|E<sub>a</sub><sup>†</sup>E<sub>b</sub>|j⟩ = C<sub>ab</sub> δ<sub>ij</sub>')} for all codewords ${m('|i⟩, |j⟩')}. In words: errors may move codewords around, but they must not reveal which codeword is present, and they must not make two codewords look alike.</p>`)}
`,
  labs: {
    pauli: {
      title: 'Do these Paulis commute?',
      cap: 'Tap a letter to cycle it through I, X, Y and Z. Positions where the strings clash (both non-identity and different) are outlined. The bit vectors underneath are the binary symplectic form used inside every stabilizer simulator.',
      build(body, id) {
        const L = ['I', 'X', 'Y', 'Z']; let a = 'XXXX'.split(''), b = 'ZZZZ'.split(''); const n = 4;
        const rowA = h('div', { class: 'btns' }), rowB = h('div', { class: 'btns' }), bits = h('div', { class: 'readout' }), stat = h('div', { class: 'status' });
        const enc = s => [s.map(ch => ch === 'X' || ch === 'Y' ? 1 : 0), s.map(ch => ch === 'Z' || ch === 'Y' ? 1 : 0)];
        const render = () => {
          const clash = a.map((ch, i) => ch !== 'I' && b[i] !== 'I' && ch !== b[i]);
          for (const [row, s] of [[rowA, a], [rowB, b]]) {
            row.innerHTML = '';
            s.forEach((ch, i) => row.append(h('button', { type: 'button', class: 'gate', style: `color:${PCOL[ch]};${clash[i] ? 'box-shadow:0 0 0 3px var(--copper-wash),0 0 0 4.5px var(--copper)' : ''}`, 'aria-label': `Qubit ${i}: ${ch}. Tap to change.`, onclick: () => { s[i] = L[(L.indexOf(ch) + 1) % 4]; render(); } }, ch)));
          }
          const [xa, za] = enc(a), [xb, zb] = enc(b), sp = (xa.reduce((s, v, i) => s + v * zb[i], 0) + za.reduce((s, v, i) => s + v * xb[i], 0)) % 2;
          bits.innerHTML = `<span class="k">P  = </span>(${xa.join('')} | ${za.join('')})<br><span class="k">P′ = </span>(${xb.join('')} | ${zb.join('')})<br><span class="k">x·z′ + z·x′ = </span>${sp}`;
          const k = clash.filter(Boolean).length;
          stat.className = 'status' + (sp ? ' bad' : ' good');
          stat.textContent = `${k} clashing position${k === 1 ? '' : 's'}: the two strings ${sp ? 'anticommute' : 'commute'}.`;
        };
        const pre = (x, y) => btn(`${x} · ${y}`, () => { a = x.split(''); b = y.split(''); render(); }, 'sm');
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, field('P', rowA), field('P′', rowB), stat),
          h('div', { class: 'stack' }, bits, field('Try', h('div', { class: 'btns' }, pre('XXXX', 'ZZZZ'), pre('XIII', 'ZIII'), pre('XXII', 'IZZI'), pre('YYII', 'XXII'), pre('XZZX', 'ZXXZ'))))));
        render();
      }
    },
    tableau: {
      title: 'Follow a Clifford circuit with generators',
      cap: 'The same circuit runs twice: on the full state vector (left) and on the stabilizer tableau (right). The generators are shown in a reduced echelon form. Measurement outcomes come from the tableau and are fed to the state vector so the two stay in step.',
      build(body, id) {
        const n = 3; let tab, sv_, hist; let q = 0, t2 = 1;
        const ketEl = h('div', { class: 'ketline' }), gens = h('div', { class: 'readout', style: 'font-size:16px;line-height:1.8' }), strip = h('div', { class: 'gstrip' }), msg = h('div', { class: 'status' });
        const reset = () => { tab = new Tableau(n); sv_ = new QState(n); hist = []; msg.className = 'status'; msg.textContent = 'All qubits start in |0⟩, stabilized by Z on each qubit.'; render(); };
        const render = () => {
          ketEl.textContent = '|ψ⟩ = ' + ketString(sv_.re, sv_.im, n);
          gens.innerHTML = tab.canonical().map(pauliHTML).join('<br>');
          strip.innerHTML = ''; strip.append(h('span', { class: 'gs0' }, '|000⟩'));
          hist.slice(-16).forEach(g => strip.append(h('span', { class: 'gs', html: g })));
        };
        const one = (g, label) => () => {
          if (g === 'H') { tab.H(q); sv_.g('H', q); } else if (g === 'S') { tab.S(q); sv_.g('S', q); } else if (g === 'X') { tab.Xg(q); sv_.g('X', q); } else { tab.Zg(q); sv_.g('Z', q); }
          hist.push(`${label}<sub>${q}</sub>`); render();
        };
        const cx = () => { if (q === t2) { msg.className = 'status bad'; msg.textContent = 'Pick two different qubits for the CNOT.'; return; } tab.CX(q, t2); sv_.cx(q, t2); hist.push(`CX<sub>${q}${t2}</sub>`); render(); };
        const meas = () => {
          const r = tab.measure(q); sv_.measure(q, r.out ? 0 : 1); hist.push(`M<sub>${q}</sub>`);
          msg.className = 'status'; msg.textContent = `Measured qubit ${q}: ${r.out}. ${r.random ? 'The outcome was random: Z on this qubit anticommuted with a generator.' : 'The outcome was certain: ±Z on this qubit was already in the stabilizer group.'}`; render();
        };
        const qSeg = seg([0, 1, 2].map(v => ({ v, label: 'q' + v })), 0, v => { q = v; }, 'Qubit'), tSeg = seg([0, 1, 2].map(v => ({ v, label: 'q' + v })), 1, v => { t2 = v; }, 'CNOT target');
        const preset = (ops) => () => { reset(); for (const [g, a1, b1] of ops) { if (g === 'CX') { tab.CX(a1, b1); sv_.cx(a1, b1); hist.push(`CX<sub>${a1}${b1}</sub>`); } else { q = a1; qSeg.set(a1); one(g, g)(); } } q = 0; qSeg.set(0); render(); };
        body.append(h('div', { class: 'split' },
          h('div', { class: 'stack' }, h('div', { class: 'ctl-label' }, 'State vector (8 amplitudes)'), ketEl, h('div', { class: 'ctl-label' }, 'Stabilizer generators (3 strings)'), gens, msg),
          h('div', { class: 'stack' }, field('Act on qubit', qSeg),
            h('div', { class: 'btns' }, ...['H', 'S', 'X', 'Z'].map(g => gateBtn(g, one(g, g), 'Apply ' + g)), btn('Measure Z', meas)),
            field('CNOT from the qubit above to', h('div', { class: 'btns' }, tSeg, btn('Apply CNOT', cx, 'pri'))),
            field('Circuit so far', strip),
            h('div', { class: 'btns' }, btn('GHZ state', preset([['H', 0], ['CX', 0, 1], ['CX', 1, 2]]), 'sm'), btn('Bell pair + |+⟩', preset([['H', 0], ['CX', 0, 1], ['H', 2]]), 'sm'), btn('Reset', reset, 'sm')))));
        reset();
      }
    },
    steane: {
      title: 'The Steane code',
      cap: 'Seven qubits on a triangle; each coloured face is both an X-type and a Z-type check on its four qubits. Tap qubits to place X, Z or Y errors. Each check pattern, read as a 3-bit number (bottom face = 1, right face = 2, top face = 4), names the qubit to fix.',
      build(body, id) {
        const P = { 1: [42, 236], 2: [258, 236], 3: [150, 236], 4: [150, 42], 5: [96, 139], 6: [204, 139], 7: [150, 168] };
        const FACES = [{ k: 'C', bit: 1, q: [1, 3, 7, 5], label: [110, 200] }, { k: 'B', bit: 2, q: [2, 6, 7, 3], label: [190, 200] }, { k: 'A', bit: 4, q: [4, 5, 7, 6], label: [150, 118] }];
        const err = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };   // 0 I, 1 X, 2 Z, 3 Y
        const box = h('div', { style: 'display:grid;place-items:center' }), stat = h('div', { class: 'status' }), ro = h('div', { class: 'readout' });
        const xp = e => e === 1 || e === 3, zp = e => e === 2 || e === 3;
        const render = () => {
          const sx = FACES.reduce((s, f) => s + (f.q.reduce((a, qq) => a ^ (xp(err[qq]) ? 1 : 0), 0) ? f.bit : 0), 0);
          const sz = FACES.reduce((s, f) => s + (f.q.reduce((a, qq) => a ^ (zp(err[qq]) ? 1 : 0), 0) ? f.bit : 0), 0);
          const svg = sv('svg', { viewBox: '0 0 300 280', width: 300, height: 280, class: 'sc', role: 'img', 'aria-label': 'Steane code' });
          FACES.forEach(f => {
            const litZ = (sx & f.bit) !== 0, litX = (sz & f.bit) !== 0;
            svg.append(sv('polygon', { points: f.q.map(qq => P[qq].join(',')).join(' '), class: 'sc-x' + (litZ || litX ? ' lit' : ''), style: 'fill:var(--copper)' }));
            svg.append(sv('text', { x: f.label[0], y: f.label[1], class: 'sc-flag', style: 'font-size:11px' }, `${litZ ? 'Z✗' : 'Z✓'} ${litX ? 'X✗' : 'X✓'}`));
          });
          Object.entries(P).forEach(([qq, [x, y]]) => {
            const e = err[qq], g = sv('g', { class: 'sc-q', tabindex: 0, role: 'button', 'aria-label': `Qubit ${qq}${e ? ', error ' + 'IXZY'[e] : ''}` });
            g.append(sv('circle', { cx: x, cy: y, r: 16, class: 'sc-dq' + (e ? ' on' : '') }), sv('text', { x, y, class: 'sc-ql' }, e ? 'IXZY'[e] : qq));
            if (e) g.append(sv('text', { x: x + 19, y: y - 15, class: 'sc-hid', style: 'fill:var(--muted)' }, 'q' + qq));
            const act = () => { err[qq] = (err[qq] + 1) % 4; render(); };
            g.addEventListener('click', act); g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act(); } });
            svg.append(g);
          });
          box.innerHTML = ''; box.append(svg);
          let rx = 0, rz = 0; for (let qq = 1; qq <= 7; qq++) { rx += (xp(err[qq]) ? 1 : 0) ^ (qq === sx ? 1 : 0); rz += (zp(err[qq]) ? 1 : 0) ^ (qq === sz ? 1 : 0); }
          ro.innerHTML = `<span class="k">Z checks (catch X): </span>${sx.toString(2).padStart(3, '0')} → ${sx ? 'flip X on qubit ' + sx : 'no X error'}<br><span class="k">X checks (catch Z): </span>${sz.toString(2).padStart(3, '0')} → ${sz ? 'flip Z on qubit ' + sz : 'no Z error'}`;
          const any = Object.values(err).some(Boolean), bad = rx % 2 === 1 || rz % 2 === 1;
          stat.className = 'status' + (!any ? '' : bad ? ' bad' : ' good');
          stat.textContent = !any ? 'No errors. Tap a qubit.' : bad ? 'After the decoder’s correction, the leftover error has odd weight: a logical error. Two errors on a distance-3 code can fool it.' : 'After the decoder’s correction, the leftover error is a stabilizer or nothing at all. The logical qubit is safe.';
        };
        body.append(h('div', { class: 'split' }, box, h('div', { class: 'stack' }, ro, stat,
          h('div', { class: 'btns' }, btn('Clear errors', () => { for (const k in err) err[k] = 0; render(); }), btn('Random single error', () => { for (const k in err) err[k] = 0; err[1 + Math.floor(Math.random() * 7)] = 1 + Math.floor(Math.random() * 3); render(); })),
          h('p', { class: 'hint' }, 'Hamming parity checks: qubits 4–7 (top face), 2, 3, 6, 7 (right face), 1, 3, 5, 7 (bottom face). Each qubit’s set of faces is its number in binary.'))));
        render();
      }
    }
  },
  take: ['A stabilizer state is the unique state fixed by n commuting Pauli generators: O(n²) bits instead of 2ⁿ amplitudes.',
    'Two Pauli strings commute when they clash in an even number of positions (symplectic product 0).',
    'Clifford gates map Paulis to Paulis, so a Clifford circuit can be tracked by rewriting generators.',
    'An [[n, k, d]] stabilizer code has n − k generators; the syndrome is the set of generators an error anticommutes with.'],
  quiz: [
    { q: 'Do XZZX and ZXXZ commute?', o: ['Yes', 'No', 'Only up to a sign', 'It depends on the state'], a: 0, why: 'They clash at all four positions. Four is even, so they commute.' },
    { q: 'A single X error on qubit 6 of the Steane code. What do the Z checks read (top, right, bottom)?', o: ['0 1 1', '1 1 0', '1 0 1', '1 1 1'], a: 1, why: 'Qubit 6 = 110 in binary: it sits in the top and right faces only.' }
  ]
});

/* ---------------- 22 · Simulating stabilizer circuits ---------------- */
LESSONS.push({
  id: 'stabsim', n: 22, stage: G, minutes: 12, title: 'Simulating stabilizer circuits',
  lede: 'Clifford circuits can be simulated efficiently on an ordinary computer, even with thousands of qubits. That one fact is why most error-correction research happens on laptops.',
  html: `
<h2>The Gottesman–Knill theorem</h2>
<p>A circuit made only of state preparation in ${m('|0⟩')}, Clifford gates (H, S, CNOT) and Pauli measurements can be simulated classically in polynomial time. The state may be massively entangled, so this is not about entanglement being easy. It is about the stabilizer description staying small: ${m('n')} generators of length ${m('n')} at every step. The Clifford group itself is explored in [[L:clifford]].</p>
<p>Aaronson and Gottesman’s 2004 <strong>tableau</strong> algorithm stores ${m('2n')} Pauli strings, the ${m('n')} stabilizer generators plus ${m('n')} “destabilizers” that make measurements fast, each as two bit vectors and a sign. A gate updates one or two columns of bits, costing ${m('O(n)')}. A measurement whose outcome is random costs ${m('O(n²)')}, and one whose outcome is already determined is found by multiplying generators together.</p>
${LAB('ghz')}
<h2>Why error-correction research depends on it</h2>
<p>Syndrome extraction circuits are Clifford circuits. Common noise models, such as depolarizing noise, are random Pauli errors, which keep everything inside the stabilizer world. So you can simulate a distance-25 surface code with more than a thousand qubits, through dozens of noisy rounds, millions of times, and measure its logical error rate directly.</p>
<p>The current standard tool is <strong>Stim</strong>, Craig Gidney’s stabilizer simulator. It simulates the noiseless circuit once to get a reference, then samples shots by pushing random Pauli errors through the circuit as bit masks, called <strong>Pauli frames</strong>, many shots in parallel using wide machine words. Combined with a decoder such as PyMatching, a short Python script estimates a surface code’s logical error rate:</p>
${CODE('python · stim + pymatching', `
import numpy as np, stim, pymatching

circuit = stim.Circuit.generated(
    "surface_code:rotated_memory_z",
    distance=5, rounds=5,
    after_clifford_depolarization=0.001)

sampler = circuit.compile_detector_sampler()
dets, obs = sampler.sample(100_000, separate_observables=True)

dem = circuit.detector_error_model(decompose_errors=True)
matcher = pymatching.Matching.from_detector_error_model(dem)
pred = matcher.decode_batch(dets)
print("logical error rate:", np.mean(np.any(pred != obs, axis=1)))
`)}
<h2>Where it stops</h2>
<p>Add T gates and the stabilizer description no longer fits. Extended methods write the state as a sum of stabilizer states; their cost grows exponentially in the number of T gates (roughly ${m('2<sup>0.23t</sup>')} for ${m('t')} T gates in the best known stabilizer-rank methods), not in the number of qubits. This gives a precise sense in which T gates, or “magic”, are the resource that makes quantum computing hard to simulate, and it is why [[L:magic]] treats them as the expensive part of fault-tolerant computing.</p>
`,
  labs: {
    ghz: {
      title: 'A thousand-qubit simulation in your browser',
      cap: 'A real bit-packed tableau simulator runs here. The GHZ circuit is one H and a chain of CNOTs; every measured qubit then agrees. A random Clifford circuit shows which measurement outcomes were random and which were already fixed by earlier results.',
      build(body, id) {
        let n = 1000, mode = 'ghz', depth = 20, busy = false;
        const out = h('div', { class: 'readout', style: 'white-space:normal' }), strip = h('div', { class: 'strip', style: 'max-height:120px;overflow:hidden' }), stat = h('div', { class: 'status' });
        const lg = n * Math.log10(2) + Math.log10(16);
        const run = async () => {
          if (busy) return; busy = true; stat.className = 'status'; stat.textContent = 'Simulating…'; await new Promise(r => setTimeout(r, 30));
          const t0 = performance.now(), T = new Tableau(n); let ng = 0;
          if (mode === 'ghz') { T.H(0); for (let i = 0; i < n - 1; i++) T.CX(i, i + 1); ng = n; }
          else { const R = rng(Date.now() & 0xffff); for (let l = 0; l < depth; l++) { for (let i = 0; i < n; i++) { const r = R(); if (r < .33) { T.H(i); ng++; } else if (r < .66) { T.S(i); ng++; } } const off = l % 2; for (let i = off; i + 1 < n; i += 2) { if (R() < .5) T.CX(i, i + 1); else T.CX(i + 1, i); ng++; } } }
          const t1 = performance.now(), res = []; let rand = 0;
          for (let i = 0; i < n; i++) { const r = T.measure(i); res.push(r.out); if (r.random) rand++; if (i % 200 === 199) await new Promise(r2 => setTimeout(r2, 0)); }
          const t2 = performance.now();
          strip.innerHTML = ''; res.slice(0, 480).forEach(v => strip.append(h('i', { class: 'c' + v, style: 'width:7px;height:7px' })));
          const ones = res.reduce((a, b) => a + b, 0), L = Math.log10(16) + n * Math.log10(2);
          out.innerHTML = `<span class="k">qubits </span>${n.toLocaleString('en-US')} · <span class="k">gates </span>${ng.toLocaleString('en-US')} · <span class="k">build </span>${num(t1 - t0, 0)} ms · <span class="k">measure all </span>${num(t2 - t1, 0)} ms<br>` +
            `<span class="k">tableau memory </span>${num((2 * n + 1) * Math.ceil(n / 32) * 8 / 1024, 0)} KB · <span class="k">state vector would need </span>10${sup(Math.floor(L))} bytes`;
          stat.className = 'status good';
          stat.textContent = mode === 'ghz' ? `All ${n.toLocaleString('en-US')} outcomes are ${res[0]}. Only the first measurement was random (${rand} random in total); every later one was fixed by it.` : `${rand} of ${n} outcomes were random and ${n - rand} were fixed by earlier results. ${ones} ones in total.`;
          busy = false;
        };
        const sN = slider({ id: id('n'), label: 'Qubits', min: 10, max: 2000, step: 10, value: n, fmt: v => v.toLocaleString('en-US'), on: v => { n = v; } });
        const sD = slider({ id: id('d'), label: 'Random circuit depth', min: 1, max: 60, step: 1, value: depth, fmt: String, on: v => { depth = v; } });
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, field('First 480 measured bits', strip), out, stat),
          h('div', { class: 'stack' }, field('Circuit', seg([{ v: 'ghz', label: 'GHZ state' }, { v: 'rand', label: 'Random Clifford' }], 'ghz', v => { mode = v; sD.disable(v === 'ghz'); }, 'Circuit')), sN, sD, btn('Run the simulation', run, 'pri'))));
        sD.disable(true); stat.textContent = 'Press Run. A 1,000-qubit GHZ state takes well under a second.';
        void lg;
      }
    }
  },
  take: ['Gottesman–Knill: Clifford circuits with Pauli measurements are classically simulable in polynomial time.',
    'The tableau stores 2n Pauli strings; gates cost O(n), measurements at most O(n²).',
    'Stim samples noisy syndrome circuits with Pauli frames, which is how most QEC thresholds are measured.',
    'Simulation cost grows exponentially only with the number of non-Clifford (T) gates.'],
  quiz: [
    { q: 'Which gate set takes a circuit outside efficient stabilizer simulation?', o: ['H and S', 'CNOT and CZ', 'Pauli measurements', 'T'], a: 3, why: 'T is not a Clifford gate; it maps X to a non-Pauli operator.' },
    { q: 'Why can most surface-code experiments be simulated exactly at large size?', o: ['They use few qubits', 'Their circuits are Clifford and their noise is modelled as random Paulis', 'They avoid entanglement', 'They use tensor networks'], a: 1, why: 'Syndrome extraction is Clifford and Pauli noise keeps the state a stabilizer state.' }
  ]
});

/* ---------------- 23 · Decoders ---------------- */
const ckPos = (s, d) => s.kind === 'bulk' ? [s.j + .5, s.i + .5] : s.kind === 'left' ? [-.38, s.i + .5] : s.kind === 'right' ? [d - 1 + .38, s.i + .5] : s.kind === 'top' ? [s.j + .5, -.38] : [s.j + .5, d - 1 + .38];
function drawSC(code, err, res, o = {}) {
  const d = code.d, S = o.s || (d <= 3 ? 64 : d <= 5 ? 50 : 40), pad = S * .8, W = pad * 2 + (d - 1) * S, H = W;
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'sc', role: 'img', 'aria-label': `Distance ${d} surface code` });
  const P = qi => [pad + (qi % d) * S, pad + Math.floor(qi / d) * S], C = s => { const [x, y] = ckPos(s, d); return [pad + x * S, pad + y * S]; };
  const shape = (s, cls) => {
    const qs = s.qs.map(P);
    if (s.kind === 'bulk') return sv('rect', { x: qs[0][0], y: qs[0][1], width: S, height: S, class: cls });
    const [a, b] = qs, R = S / 2;
    const dd = s.kind === 'top' || s.kind === 'right' ? `M${a[0]} ${a[1]} A${R} ${R} 0 0 1 ${b[0]} ${b[1]} Z` : `M${b[0]} ${b[1]} A${R} ${R} 0 0 1 ${a[0]} ${a[1]} Z`;
    return sv('path', { d: dd, class: cls });
  };
  code.Xs.forEach(s => svg.append(shape(s, 'sc-x')));
  code.Zs.forEach((s, i) => svg.append(shape(s, 'sc-z' + (res && res.lit[i] ? ' lit' : ''))));
  if (res) for (const [i, j] of res.pairs) {
    const a = C(code.Zs[res.def[i]]);
    if (j >= 0) { const b = C(code.Zs[res.def[j]]); svg.append(sv('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'sc-match' })); }
    else { const path = code.path(res.def[i], code.B), last = P(path[path.length - 1]), y2 = Math.floor(path[path.length - 1] / d) === 0 ? 4 : H - 4; svg.append(sv('line', { x1: a[0], y1: a[1], x2: last[0], y2: y2, class: 'sc-match' })); }
  }
  for (let qi = 0; qi < code.n; qi++) {
    const [x, y] = P(qi), on = err[qi], cr = res && res.corr[qi];
    const g = sv('g', { class: 'sc-q', tabindex: o.click ? 0 : null, role: o.click ? 'button' : null, 'aria-label': o.click ? `Qubit ${qi}${on ? ', X error' : ''}` : null });
    g.append(sv('circle', { cx: x, cy: y, r: S * .2, class: 'sc-dq' + (on ? ' on' : '') }));
    if (on) g.append(sv('text', { x, y, class: 'sc-ql', style: `font-size:${S * .22}px` }, 'X'));
    if (cr) g.append(sv('circle', { cx: x, cy: y, r: S * .3, class: 'sc-corr' }));
    if (o.click) { g.addEventListener('click', () => o.click(qi)); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.click(qi); } }); }
    svg.append(g);
  }
  if (res) res.def.forEach(si => { const [x, y] = C(code.Zs[si]); svg.append(sv('circle', { cx: x, cy: y, r: S * .14, class: 'sc-def' })); });
  return svg;
}
LESSONS.push({
  id: 'decoders', n: 23, stage: G, minutes: 15, title: 'Decoders',
  lede: 'A syndrome says something went wrong; a decoder has to guess what. Decoders are classical algorithms, and they have to be both accurate and fast enough to keep up with the hardware.',
  html: `
<h2>The decoding problem</h2>
<p>Given the syndrome, choose a correction that returns the system to the codespace without applying a logical error. Thanks to degeneracy ([[L:stabilizers]]), the decoder does not need the exact error, only an error in the same equivalence class. The best possible decoder picks the most likely class. For general stabilizer codes that maximum-likelihood problem is computationally hard, so practical decoders use structure and approximations.</p>
<h2>Errors as chains, syndromes as endpoints</h2>
<p>In the surface code, each data qubit touches at most two Z checks. An X error on one qubit lights the checks on either side of it, and a string of neighbouring X errors lights only the two checks at its ends: the middle ones are flipped twice. So the syndrome is a set of lit checks, called <strong>defects</strong>, and the job is to pair them up with short chains, or join a defect to the edge of the code. If independent errors are rare, the shortest total pairing is the most likely explanation. This is <strong>minimum-weight perfect matching</strong> (MWPM), proposed for the surface code by Dennis, Kitaev, Landahl and Preskill in 2002, and solved efficiently by Edmonds’ blossom algorithm.</p>
${LAB('match')}
<h2>When the decoder gets it wrong</h2>
<p>A correction that, together with the actual errors, forms a chain from one boundary to the opposite one is a logical operator. Every check is satisfied and the logical qubit has silently flipped. That needs at least ${m('(d + 1)/2')} errors arranged the right way, which is why larger distances help so much when errors are rare.</p>
<h2>The decoder landscape</h2>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Decoder</th><th>Idea</th><th>Where it is used</th></tr></thead><tbody>
<tr><td>Matching</td><td>Pair defects with minimum total weight (blossom algorithm). PyMatching’s sparse blossom handles large codes quickly.</td><td>Surface codes and repetition codes; the standard baseline</td></tr>
<tr><td>Union-find</td><td>Grow clusters around defects until each cluster can be neutralized, then peel a correction. Almost linear time.</td><td>Surface codes when speed matters most</td></tr>
<tr><td>Belief propagation + OSD</td><td>Pass probability messages on the code’s check graph, then fix the remaining ambiguity with ordered-statistics decoding.</td><td>qLDPC codes, where matching does not apply</td></tr>
<tr><td>Relay-BP</td><td>A belief-propagation variant designed by IBM to run on FPGAs or ASICs.</td><td>Bivariate bicycle codes</td></tr>
<tr><td>Tensor networks</td><td>Contract a network that sums the probability of each error class: close to maximum likelihood.</td><td>Benchmarks; too slow for real time</td></tr>
<tr><td>Neural networks</td><td>Learn the mapping from syndromes to corrections from data. Google DeepMind’s AlphaQubit (2024) beat matching on Sycamore data.</td><td>Research; speed is the open problem</td></tr>
</tbody></table></div>
<h2>Real time</h2>
<p>A superconducting surface code produces a new round of syndromes about every microsecond. If the decoder is slower than that on average, unprocessed syndromes pile up without limit, the <strong>backlog problem</strong>, and the computation stalls whenever a decision depends on a decoded result. Fast decoders are therefore a hardware problem as much as an algorithms problem, with dedicated FPGA and ASIC decoders now part of most roadmaps.</p>
`,
  labs: {
    match: {
      title: 'Decode a surface code',
      cap: 'Only X errors and their Z checks (blue) are shown. Lit checks are defects (copper dots). Copper lines show how the decoder paired them, and rings mark the qubits it flips back. Exact matching is used for up to 16 defects.',
      build(body, id) {
        let d = 5, p = .08, err, dec = 'mwpm', res = null; const box = h('div', { class: 'scroll-x', style: 'display:grid;place-items:center' }), stat = h('div', { class: 'status' }), info = h('div', { class: 'chipline' });
        const code = () => surfaceCode(d);
        const fresh = () => { err = new Uint8Array(d * d); res = null; render(); };
        const decode = () => { res = scDecode(code(), err, dec === 'mwpm' ? 16 : 0); render(); };
        const render = () => {
          const C = code(), lit = C.Zs.map(s => s.qs.reduce((a, qi) => a ^ err[qi], 0)), shown = res || { lit, def: [], pairs: [], corr: new Uint8Array(C.n) };
          box.innerHTML = ''; box.append(drawSC(C, err, shown, { click: qi => { err[qi] ^= 1; res = null; render(); } }));
          const ne = err.reduce((a, b) => a + b, 0), nd = lit.reduce((a, b) => a + b, 0);
          info.innerHTML = `<span>distance <b>${d}</b></span><span>X errors <b>${ne}</b></span><span>defects <b>${nd}</b></span>`;
          if (!res) { stat.className = 'status'; stat.textContent = ne ? 'Press Decode to let the decoder choose a correction.' : 'Tap qubits to add X errors, or add random ones.'; }
          else { stat.className = 'status ' + (res.logical ? 'bad' : 'good'); stat.textContent = res.logical ? 'Logical error: the errors plus the correction stretch from the top edge to the bottom edge.' : `Success: the errors plus the correction form a harmless loop or nothing. Correction weight ${res.corr.reduce((a, b) => a + b, 0)}.`; }
        };
        const randomize = () => { err = new Uint8Array(d * d); for (let i = 0; i < d * d; i++) err[i] = Math.random() < p ? 1 : 0; res = null; render(); };
        body.append(h('div', { class: 'split' }, box, h('div', { class: 'stack' },
          field('Distance', seg([3, 5, 7].map(v => ({ v, label: 'd = ' + v })), d, v => { d = v; fresh(); }, 'Code distance')),
          field('Decoder', seg([{ v: 'mwpm', label: 'Minimum-weight matching' }, { v: 'greedy', label: 'Greedy' }], dec, v => { dec = v; if (res) decode(); }, 'Decoder')),
          slider({ id: id('p'), label: 'Error probability for random errors', min: .01, max: .2, step: .01, value: p, fmt: v => pct(v, 0), on: v => { p = v; } }),
          h('div', { class: 'btns' }, btn('Random errors', randomize), btn('Decode', decode, 'pri'), btn('Clear', fresh)), info, stat,
          h('p', { class: 'hint' }, 'Greedy pairs the closest defects first. Try a few random patterns at 10% on d = 7 and compare the two decoders on the same errors.'))));
        fresh(); for (const qi of [7, 8, 12]) err[qi] = 1; render();
      }
    }
  },
  take: ['A decoder maps a syndrome to a correction; only the error’s equivalence class matters.',
    'In the surface code, error chains light defects only at their ends; matching pairs defects with short chains.',
    'A logical error happens when errors plus correction span the code from one boundary to the other.',
    'Decoders must keep pace with about one syndrome round per microsecond on superconducting hardware.'],
  quiz: [
    { q: 'Three neighbouring X errors in a line in the bulk of the surface code light how many Z checks?', o: ['1', '2', '3', '6'], a: 1, why: 'Interior checks along the chain are flipped twice; only the two ends stay lit.' },
    { q: 'Why does the decoder only need the error’s equivalence class?', o: ['Because errors are rare', 'Errors that differ by a stabilizer act identically on the codespace', 'Because measurement is perfect', 'Because X and Z commute'], a: 1, why: 'Multiplying by a stabilizer does nothing to a code state, so any error in the right class is a valid correction.' }
  ]
});

/* ---------------- 24 · Noise models and thresholds ---------------- */
LESSONS.push({
  id: 'thresholds', n: 24, stage: G, minutes: 16, title: 'Noise models and thresholds',
  lede: 'A threshold is not a single number. It depends on what is allowed to go wrong, and measuring it is a large-scale simulation experiment.',
  html: `
<h2>Three noise models</h2>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Model</th><th>What can fail</th><th>Surface code threshold with matching</th></tr></thead><tbody>
<tr><td>Code capacity</td><td>Data qubits only; syndromes are read perfectly</td><td>about 10% (independent X and Z errors)</td></tr>
<tr><td>Phenomenological</td><td>Data qubits plus syndrome measurement errors</td><td>about 3%</td></tr>
<tr><td>Circuit level</td><td>Every gate, idle step, preparation and measurement in the syndrome circuit</td><td>about 0.5–1%</td></tr>
</tbody></table></div>
<p>Each step closer to real hardware lowers the threshold, because there are more places for faults and some faults spread ([[L:faulttolerance]]). Circuit-level numbers are the ones hardware is judged against.</p>
<h2>Measurement errors and detection events</h2>
<p>If a syndrome bit can be wrong, a single readout cannot be trusted. The fix is to measure the checks repeatedly, usually for about ${m('d')} rounds, and look at <strong>detection events</strong>: places where a check’s value changes from one round to the next. A data error between rounds creates a pair of detection events side by side in space. A measurement error creates a pair in time: the check reads wrong once and right again in the next round. Decoding then becomes matching in space and time.</p>
${LAB('spacetime')}
<h2>Finding a threshold</h2>
<p>To find a threshold, sample many random errors at each physical error rate ${m('p')}, decode them, and count logical failures for several code distances. Below threshold, bigger codes fail less; above it, bigger codes fail more. The threshold is where the curves cross. The simulation below does exactly this for code-capacity X noise, with the matching decoder from [[L:decoders]].</p>
${LAB('mc')}
<h2>Below threshold, and how far below</h2>
<p>Close to threshold, increasing the distance barely helps. Far below it, each step ${m('d → d + 2')} divides the logical error rate by a factor usually called ${m('Λ')}, roughly ${m('p<sub>th</sub>/p')}. Google’s 2024 below-threshold experiment measured ${m('Λ ≈ 2')}. Larger ${m('Λ')} means far fewer qubits for the same protection, which is why each improvement in physical error rates is worth so much.</p>
<p>Real devices add problems the standard models leave out: <strong>leakage</strong> out of the qubit subspace ([[L:pulses]]), correlated errors from cosmic rays and other bursts that hit many qubits at once, drifting error rates, and crosstalk. Much current research models these effects and designs codes, circuits and decoders that tolerate them. Stim ([[L:stabsim]]) lets you write such noise directly into the circuit and measure the result.</p>
`,
  labs: {
    spacetime: {
      title: 'Detection events in space and time',
      cap: 'A distance-7 repetition code: 7 data qubits (rows q) and 6 parity checks (rows c), measured for 6 noisy rounds and then read out perfectly. Tap a data cell to flip that qubit before that round (marked X), or a grey check cell to make that one measurement wrong (outlined red). Dots are detection events; copper lines are the matching.',
      build(body, id) {
        const d = 7, T = 6; let dataE, measE, p = .06, decoded = false;
        const box = h('div', { class: 'scroll-x' }), stat = h('div', { class: 'status' });
        const reset = () => { dataE = [...Array(d)].map(() => new Uint8Array(T + 1)); measE = [...Array(d - 1)].map(() => new Uint8Array(T)); decoded = false; render(); };
        const analyse = () => {
          const D = [...Array(d)].map(() => 0), s = [...Array(d - 1)].map(() => []), ev = [];
          for (let t = 0; t <= T; t++) { for (let i = 0; i < d; i++) D[i] ^= dataE[i][t]; for (let i = 0; i < d - 1; i++) s[i][t] = D[i] ^ D[i + 1] ^ (t < T ? measE[i][t] : 0); }
          for (let i = 0; i < d - 1; i++) for (let t = 0; t <= T; t++) if (s[i][t] ^ (t ? s[i][t - 1] : 0)) ev.push([i, t]);
          return { D, ev };
        };
        const decode = () => {
          const { D, ev } = analyse(), k = ev.length;
          const dist = ev.map(a => ev.map(b => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]))), bd = ev.map(([i]) => Math.min(i + 1, d - 1 - i));
          const pairs = matchDefects(k, dist, bd, 16), corr = new Array(d).fill(0);
          for (const [a, b] of pairs) {
            if (b >= 0) { const lo = Math.min(ev[a][0], ev[b][0]), hi = Math.max(ev[a][0], ev[b][0]); for (let q = lo + 1; q <= hi; q++) corr[q] ^= 1; }
            else { const i = ev[a][0]; if (i + 1 <= d - 1 - i) for (let q = 0; q <= i; q++) corr[q] ^= 1; else for (let q = i + 1; q < d; q++) corr[q] ^= 1; }
          }
          const resid = D.map((v, i) => v ^ corr[i]);
          return { ev, pairs, logical: resid.every(v => v === 1), clean: resid.every(v => v === 0) };
        };
        const render = () => {
          const cw = 52, rh = 24, lw = 40, W = lw + (T + 1) * cw + 10, H = (2 * d - 1) * rh + 34;
          const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'st', role: 'img', 'aria-label': 'Space-time detection events' });
          const X = t => lw + t * cw + cw / 2, Y = r => 22 + r * rh + rh / 2;
          svg.append(sv('text', { x: 4, y: 10, class: 'c-lab' }, 'round'));
          for (let t = 0; t <= T; t++) svg.append(sv('text', { x: X(t), y: 10, class: 'c-lab', 'text-anchor': 'middle' }, t < T ? String(t + 1) : 'final'));
          for (let r = 0; r < 2 * d - 1; r++) svg.append(sv('text', { x: 4, y: Y(r), class: 'c-lab' }, r % 2 ? 'c' + (r - 1) / 2 : 'q' + r / 2));
          const { ev } = analyse(), res = decoded ? decode() : null;
          for (let r = 0; r < 2 * d - 1; r++) for (let t = 0; t <= T; t++) {
            const isData = r % 2 === 0, i = isData ? r / 2 : (r - 1) / 2; if (!isData && t === T) continue;
            const on = isData ? dataE[i][t] : measE[i][t];
            const cell = sv('rect', { x: X(t) - cw / 2 + 3, y: Y(r) - rh / 2 + 2, width: cw - 6, height: rh - 4, rx: 4, class: 'st-cell' + (isData ? ' d' : ' m') + (on ? ' on' : ''), tabindex: 0, role: 'button', 'aria-label': `${isData ? 'Data qubit ' + i + ' flip before' : 'Check ' + i + ' measurement error in'} ${t < T ? 'round ' + (t + 1) : 'final readout'}` });
            const act = () => { if (isData) dataE[i][t] ^= 1; else measE[i][t] ^= 1; decoded = false; render(); };
            cell.addEventListener('click', act); cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
            svg.append(cell);
            if (on && isData) svg.append(sv('text', { x: X(t), y: Y(r), class: 'st-mark', 'text-anchor': 'middle' }, 'X'));
          }
          if (res) for (const [a, b] of res.pairs) {
            const A = res.ev[a]; if (b >= 0) { const B = res.ev[b]; svg.append(sv('line', { x1: X(A[1]), y1: Y(2 * A[0] + 1), x2: X(B[1]), y2: Y(2 * B[0] + 1), class: 'sc-match' })); }
            else { const top = A[0] + 1 <= d - 1 - A[0]; svg.append(sv('line', { x1: X(A[1]), y1: Y(2 * A[0] + 1), x2: X(A[1]), y2: top ? 20 : H - 2, class: 'sc-match' })); }
          }
          ev.forEach(([i, t]) => svg.append(sv('circle', { cx: X(t), cy: Y(2 * i + 1), r: 7, class: 'sc-def' })));
          box.innerHTML = ''; box.append(svg);
          if (!res) { stat.className = 'status'; stat.textContent = `${ev.length} detection event${ev.length === 1 ? '' : 's'}. Press Decode to match them.`; }
          else { stat.className = 'status ' + (res.logical ? 'bad' : 'good'); stat.textContent = res.logical ? 'Logical error: the matching chose the complementary set of flips, so every data qubit ends up wrong.' : 'Decoded correctly. Pairs that run along time explain measurement errors; pairs across space explain data errors.'; }
        };
        const rand = () => { reset(); for (let i = 0; i < d; i++) for (let t = 0; t < T; t++) dataE[i][t] = Math.random() < p ? 1 : 0; for (let i = 0; i < d - 1; i++) for (let t = 0; t < T; t++) measE[i][t] = Math.random() < p ? 1 : 0; render(); };
        body.append(box, h('div', { class: 'split' }, h('div', { class: 'stack' }, stat),
          h('div', { class: 'stack' }, slider({ id: id('p'), label: 'Error probability per cell (random noise)', min: .01, max: .2, step: .01, value: p, fmt: v => pct(v, 0), on: v => { p = v; } }),
            h('div', { class: 'btns' }, btn('Random noise', rand), btn('Decode', () => { decoded = true; render(); }, 'pri'), btn('Clear', reset)))));
        reset(); dataE[3][2] = 1; measE[1][4] = 1; render();
      }
    },
    mc: {
      title: 'Measure a threshold',
      cap: 'Each point is the fraction of random error patterns that the matching decoder turned into a logical error. Points fill in as the simulation runs; bars are one standard error. Curves for different distances cross near the threshold.',
      build(body, id) {
        const DS = [3, 5, 7], PS = [.03, .05, .07, .08, .09, .1, .11, .12, .14, .16], st = {}; let run = true, total = 0;
        DS.forEach(d => PS.forEach(p => { st[d + ':' + p] = { n: 0, f: 0 }; }));
        const cv = canvas('', 'height:280px'), info = h('div', { class: 'chipline' });
        const COL = () => { const T = Theme.get(); return { 3: T.muted, 5: T.cyan, 7: T.copper }; };
        const pc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [.02, .17], y: [0, .6], xt: [.04, .08, .12, .16], xf: v => pct(v, 0), yt: [0, .2, .4, .6], yf: v => pct(v, 0), xl: 'physical error rate p', yl: 'logical error rate' }), cl = COL();
          DS.forEach(d => {
            const pts = []; PS.forEach(p => { const s = st[d + ':' + p]; if (s.n < 20) return; const f = s.f / s.n, e = Math.sqrt(f * (1 - f) / s.n); pts.push([A.X(p), A.Y(f)]); ctx.strokeStyle = cl[d]; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(A.X(p), A.Y(f - e)); ctx.lineTo(A.X(p), A.Y(f + e)); ctx.stroke(); });
            polyline(ctx, pts, cl[d], 2.2); pts.forEach(q => dot(ctx, q[0], q[1], 3.5, cl[d]));
            if (pts.length) txt(ctx, 'd = ' + d, pts[pts.length - 1][0] + 6, pts[pts.length - 1][1], { align: 'left', color: cl[d], font: '600 11px "JetBrains Mono",monospace' });
          });
        });
        const crossing = () => {
          let prev = null;
          for (const p of PS) { const a = st['3:' + p], b = st['7:' + p]; if (a.n < 200 || b.n < 200) return null; const dlt = b.f / b.n - a.f / a.n; if (prev && prev[1] < 0 && dlt >= 0) return prev[0] + (p - prev[0]) * (-prev[1]) / (dlt - prev[1]); prev = [p, dlt]; }
          return null;
        };
        Scope.tick(() => {
          if (!run) return; const t0 = performance.now();
          while (performance.now() - t0 < 10) {
            let best = null; for (const k in st) if (!best || st[k].n < st[best].n) best = k;
            const [dS, pS] = best.split(':'), d = +dS, p = +pS, C = surfaceCode(d), e = new Uint8Array(d * d);
            for (let i = 0; i < d * d; i++) e[i] = Math.random() < p ? 1 : 0;
            const r = scDecode(C, e, 14); st[best].n++; if (r.logical) st[best].f++; total++;
          }
          if (total % 4 === 0) { pc.inv(); const x = crossing(); info.innerHTML = `<span>samples <b>${total.toLocaleString('en-US')}</b></span><span>crossing of d = 3 and d = 7 <b>${x ? pct(x, 1) : 'not yet resolved'}</b></span><span>published value with matching <b>≈ 10.3%</b></span>`; }
        });
        const pb = btn('Pause', () => { run = !run; pb.textContent = run ? 'Pause' : 'Resume'; });
        body.append(cv, h('div', { class: 'btns' }, pb, btn('Start over', () => { for (const k in st) st[k] = { n: 0, f: 0 }; total = 0; pc.inv(); })), info);
      }
    }
  },
  take: ['Thresholds depend on the noise model: roughly 10% (code capacity), 3% (phenomenological) and under 1% (circuit level) for the surface code with matching.',
    'Repeated syndrome rounds turn measurement errors into detection-event pairs in time.',
    'A threshold is measured by sampling, decoding and finding where curves for different distances cross.',
    'Far below threshold, each distance step d → d + 2 divides the logical error rate by Λ.'],
  quiz: [
    { q: 'A single syndrome measurement error produces detection events where?', o: ['At two neighbouring checks in the same round', 'At the same check in two consecutive rounds', 'Nowhere', 'At every check'], a: 1, why: 'The check reads wrong once and then reverts, so its value changes twice in time.' },
    { q: 'Above threshold, what does increasing the code distance do?', o: ['Lowers the logical error rate', 'Raises it', 'Leaves it unchanged', 'Removes measurement errors'], a: 1, why: 'More qubits mean more opportunities for errors than the extra distance can correct.' }
  ]
});

window.GLOSSARY_EXTRA.push(
  ['Stabilizer', 'A Pauli operator P with P|ψ⟩ = |ψ⟩. A stabilizer code is defined by a commuting group of them.', 'stabilizers'],
  ['Clifford group', 'Gates generated by H, S and CNOT; they map Pauli operators to Pauli operators.', 'clifford'],
  ['[[n, k, d]]', 'Notation for a quantum code with n physical qubits, k logical qubits and distance d.', 'stabilizers'],
  ['CSS code', 'A stabilizer code built from two classical codes, with separate X-type and Z-type checks.', 'stabilizers'],
  ['Steane code', 'The [[7,1,3]] CSS code built from the classical Hamming code.', 'stabilizers'],
  ['Degeneracy', 'Different errors that differ by a stabilizer act identically on a code, so decoders need only the error class.', 'stabilizers'],
  ['Gottesman–Knill theorem', 'Clifford circuits with Pauli measurements can be simulated efficiently on a classical computer.', 'stabsim'],
  ['Tableau', 'The table of stabilizer and destabilizer Pauli strings used to simulate Clifford circuits.', 'stabsim'],
  ['Pauli frame', 'A record of Pauli errors pushed through a Clifford circuit, used to sample many noisy shots cheaply.', 'stabsim'],
  ['Defect', 'A check whose value is −1 (or a detection event); decoders pair defects up.', 'decoders'],
  ['Minimum-weight perfect matching', 'A decoder that pairs defects with the smallest total chain length, solved by the blossom algorithm.', 'decoders'],
  ['Detection event', 'A change in a check’s measured value between consecutive rounds.', 'thresholds'],
  ['Code capacity noise', 'A noise model with errors on data qubits only and perfect syndrome measurement.', 'thresholds'],
  ['Circuit-level noise', 'A noise model where every operation in the syndrome extraction circuit can fail.', 'thresholds'],
  ['Λ (lambda)', 'The factor by which the logical error rate falls when the code distance grows by two.', 'thresholds']
);
})();
