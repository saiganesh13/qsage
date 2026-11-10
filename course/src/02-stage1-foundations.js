/* =====================================================================
   Stage 1 · 300 K · Foundations
   ===================================================================== */
(() => {

/* ---------------- Lesson 1 · Bits and qubits ---------------- */
LESSONS.push({
  id: 'qubits', n: 1, stage: 0, minutes: 9, title: 'Bits and qubits',
  lede: 'A classical bit is either 0 or 1. A qubit has two basis states too, but its state is described by two complex numbers, and that changes what a computer can do.',
  html: `
<h2>The classical bit</h2>
<p>Every digital device stores information in bits. A bit is a physical system with two states that are easy to tell apart: a transistor that is on or off, a patch of magnetic film pointing up or down, a pit or a flat spot on a disc. At any moment the bit has one definite value, and reading it does not change it.</p>
<h2>The quantum bit</h2>
<p>A qubit is also a two-level physical system. It might be the spin of an electron, the polarization of a photon, or two energy levels of an atom or of a superconducting circuit. We label the two levels ${m('|0⟩')} and ${m('|1⟩')}. The angled brackets are Dirac’s <em>ket</em> notation and simply mean “the state called 0”.</p>
<p>The difference is that a qubit can be in any combination of those two states:</p>
${EQ('|ψ⟩ = α|0⟩ + β|1⟩,&nbsp;&nbsp;&nbsp; |α|² + |β|² = 1')}
<p>The numbers ${m('α')} and ${m('β')} are complex numbers called <strong>amplitudes</strong>. When you measure the qubit you get 0 with probability ${m('|α|²')} and 1 with probability ${m('|β|²')}. Afterwards the qubit is left in the state you saw. So a qubit can sit in a continuum of states, but a single measurement only ever returns one bit.</p>
${LAB('switch')}
<h2>Why amplitudes and not just probabilities?</h2>
<p>It is tempting to read ${m('α|0⟩ + β|1⟩')} as “the qubit is secretly 0 or 1, and we just don’t know which”. That picture fails. Amplitudes can be negative or complex, and when two routes lead to the same outcome their amplitudes add before you square them. They can cancel each other out. Probabilities are never negative, so they can never cancel.</p>
<p>This cancellation is called <strong>interference</strong>, and it is the engine of every quantum algorithm. [[L:interference]] shows it with a single photon.</p>
${NOTE('Common misconception', `<p>People often say a qubit “is 0 and 1 at the same time”, as if it held two values you could read out. You can’t. You get one bit per measurement. The power of a quantum computer comes from steering amplitudes so that wrong answers cancel and right answers reinforce before you measure.</p>`)}
<h2>The size of the description</h2>
<p>To describe ${m('n')} classical bits you need ${m('n')} numbers, each 0 or 1. To describe the general state of ${m('n')} qubits you need ${m('2ⁿ')} complex amplitudes, one for every string of ${m('n')} bits. The count doubles with every qubit you add.</p>
${LAB('doubling')}
<p>This is why simulating quantum systems on ordinary computers gets hard so quickly, and it is the first hint of why a machine built from qubits might do things classical machines cannot. It is not the whole story, though. You cannot read ${m('2ⁿ')} numbers out of ${m('n')} qubits. Holevo’s theorem caps what you can extract at ${m('n')} classical bits. A useful quantum algorithm has to arrange for the answer to show up in the few bits a measurement returns.</p>
`,
  labs: {
    switch: {
      title: 'A switch and a qubit',
      cap: 'Each qubit measurement uses a freshly prepared qubit with the same amplitudes. The bit gives the same answer every time you read it; the qubit gives a random answer whose odds are set by the amplitudes.',
      build(body, id) {
        let bit = 0;
        const digit = h('div', { class: 'bigdigit', 'aria-live': 'polite' }, '0');
        const cStrip = h('div', { class: 'strip', 'aria-label': 'Readings of the bit' });
        const pushStrip = (s, v) => { s.append(h('i', { class: 'c' + v })); while (s.children.length > 64) s.firstChild.remove(); };
        const left = h('div', { class: 'stack' },
          h('div', { class: 'ctl-label' }, 'Classical bit'), digit,
          h('div', { class: 'btns' }, btn('Flip the bit', () => { bit ^= 1; digit.textContent = bit; cStrip.innerHTML = ''; }),
            btn('Read it 10 times', () => { for (let i = 0; i < 10; i++) pushStrip(cStrip, bit); })),
          cStrip, h('p', { class: 'hint' }, 'Reading a bit never changes it.'));
        let p1 = .5; const counts = [0, 0];
        const disc = h('div', { class: 'qdisc' }); const discLab = h('span', null, '?'); disc.append(discLab);
        const amp = h('div', { class: 'ketline' }), stats = h('div', { class: 'chipline' }), qStrip = h('div', { class: 'strip' });
        const paintDisc = out => {
          if (out == null) { disc.style.background = `conic-gradient(var(--cyan) 0 ${(1 - p1) * 360}deg, var(--copper) 0)`; discLab.textContent = '?'; }
          else { disc.style.background = out ? 'var(--copper)' : 'var(--cyan)'; discLab.textContent = out; }
        };
        const upd = () => {
          amp.textContent = `|ψ⟩ = ${num(Math.sqrt(1 - p1), 3)}|0⟩ + ${num(Math.sqrt(p1), 3)}|1⟩`;
          const n = counts[0] + counts[1];
          stats.innerHTML = `<span>0 seen <b>${counts[0]}</b></span><span>1 seen <b>${counts[1]}</b></span><span>observed share of 1 <b>${n ? pct(counts[1] / n, 0) : '—'}</b></span><span>predicted <b>${pct(p1, 0)}</b></span>`;
        };
        let tmr = null;
        const measure = k => {
          let last = 0;
          for (let i = 0; i < k; i++) { last = Math.random() < p1 ? 1 : 0; counts[last]++; pushStrip(qStrip, last); }
          upd(); paintDisc(last); clearTimeout(tmr); tmr = setTimeout(() => paintDisc(null), dur(700) || 300);
        };
        Scope.clean(() => clearTimeout(tmr));
        const sl = slider({ id: id('p1'), label: 'Chance of reading 1, |β|²', min: 0, max: 1, step: .01, value: .5, fmt: v => pct(v, 0),
          on: v => { p1 = v; counts[0] = counts[1] = 0; qStrip.innerHTML = ''; upd(); paintDisc(null); } });
        const right = h('div', { class: 'stack' }, h('div', { class: 'ctl-label' }, 'Qubit'),
          h('div', { style: 'display:flex;gap:18px;align-items:center;flex-wrap:wrap' }, disc, amp), sl,
          h('div', { class: 'btns' }, btn('Measure a fresh qubit', () => measure(1), 'pri'), btn('Measure 50 more', () => measure(50))),
          qStrip, stats);
        upd(); paintDisc(null);
        body.append(h('div', { class: 'split even' }, left, right));
      }
    },
    doubling: {
      title: 'How much it takes to write down n qubits',
      cap: 'Each amplitude is stored here as a pair of double-precision numbers, 16 bytes. The copper squares are the amplitudes added by the newest qubit; the grid stops drawing at 12 qubits (4,096 squares).',
      build(body, id) {
        let n = 3;
        const cv = canvas('', 'height:230px');
        const out = h('div', { class: 'readout' }), say = h('div', { class: 'status' });
        const lg = n => Math.log10(16) + n * Math.log10(2);
        const bytes = n => { const L = lg(n), u = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'], k = Math.floor(L / 3); if (k < u.length) { const v = Math.pow(10, L - 3 * k); return (v < 10 ? num(v, 1) : num(v, 0)) + ' ' + u[k]; } return '10' + sup(Math.floor(L)) + ' bytes'; };
        const amps = n => n <= 64 ? (2n ** BigInt(n)).toLocaleString('en-US') : '≈ ' + num(Math.pow(10, n * Math.log10(2) % 1), 2) + ' × 10' + sup(Math.floor(n * Math.log10(2)));
        const cmp = n => { const L = lg(n);
          if (n >= 266) return 'More amplitudes than there are atoms in the observable universe (roughly 10⁸⁰).';
          if (L < 4) return 'About the size of a short text message.'; if (L < 7) return 'About the size of a photo.';
          if (L < 9.5) return 'About the size of a video file.'; if (L < 10.6) return 'Fits in a laptop’s memory.';
          if (L < 13) return 'Needs a large server or a rack of disks.';
          if (L < 16.5) return 'Around the total memory of the largest supercomputers. Brute-force simulation runs out of room near here.';
          return 'Far beyond the memory of any computer ever built.'; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get();
          if (n <= 12) {
            const N = 2 ** n, cols = Math.ceil(Math.sqrt(N * w / H)), rows = Math.ceil(N / cols), s = Math.min(w / cols, H / rows);
            const gap = s > 8 ? 2 : s > 4 ? 1 : 0, ox = (w - cols * s) / 2, oy = (H - rows * s) / 2;
            for (let i = 0; i < N; i++) { const r = Math.floor(i / cols), cc = i % cols; ctx.fillStyle = (n > 1 && i >= N / 2) || n === 1 ? (i >= N / 2 ? T.copper : T.cyan) : T.cyan; ctx.fillRect(ox + cc * s + gap / 2, oy + r * s + gap / 2, s - gap, s - gap); }
          } else {
            ctx.fillStyle = rgba(T.cyan, .18); ctx.fillRect(0, 0, w / 2, H); ctx.fillStyle = rgba(T.copper, .2); ctx.fillRect(w / 2, 0, w / 2, H);
            for (let y = 3; y < H; y += 5) for (let x = 3; x < w; x += 5) { ctx.fillStyle = x < w / 2 ? rgba(T.cyan, .5) : rgba(T.copper, .5); ctx.fillRect(x, y, 2, 2); }
            txt(ctx, `2${sup(n)} squares: too many to draw`, w / 2, H / 2, { font: '600 15px "Bricolage Grotesque",sans-serif', color: T.ink });
          }
        });
        const upd = () => {
          out.innerHTML = `<span class="k">qubits    </span>${n}<br><span class="k">amplitudes</span> ${amps(n)}<br><span class="k">memory    </span>${bytes(n)}`;
          say.textContent = cmp(n); p.inv();
        };
        const sl = slider({ id: id('n'), label: 'Number of qubits, n', min: 1, max: 300, step: 1, value: n, fmt: v => String(v), on: v => { n = v; upd(); } });
        const quick = h('div', { class: 'btns' }, ...[2, 10, 30, 50, 300].map(k => btn(k + ' qubits', () => { n = k; sl.set(k); upd(); }, 'sm')));
        upd();
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, sl, quick, out, say)));
      }
    }
  },
  take: ['A qubit is a two-level system whose state is α|0⟩ + β|1⟩, with |α|² + |β|² = 1.',
    'Measuring gives 0 with probability |α|² and 1 with probability |β|², and leaves the qubit in the state you saw.',
    'Amplitudes can cancel; probabilities cannot. That is interference.',
    'Describing n qubits takes 2ⁿ amplitudes, but measuring them returns only n bits.'],
  quiz: [
    { q: 'A qubit is in the state 0.6|0⟩ + 0.8|1⟩. What is the probability of measuring 1?', o: ['0.8', '0.64', '0.36', '0.5'], a: 1, why: 'Square the amplitude: 0.8² = 0.64. The two probabilities, 0.36 and 0.64, add up to 1 as they must.' },
    { q: 'How many complex amplitudes describe a general state of 10 qubits?', o: ['10', '20', '100', '1,024'], a: 3, why: 'One amplitude per 10-bit string, and there are 2¹⁰ = 1,024 of them.' }
  ]
});

/* ---------------- Lesson 2 · Superposition ---------------- */
LESSONS.push({
  id: 'superposition', n: 2, stage: 0, minutes: 10, title: 'Superposition',
  lede: 'Superposition means a state is a weighted sum of basis states. The weights are amplitudes, and each one has both a size and a phase.',
  html: `
<h2>Amplitudes have a size and a direction</h2>
<p>A complex number can be drawn as an arrow in a plane. Its length is its <strong>magnitude</strong> and its angle is its <strong>phase</strong>. Each amplitude of a qubit is such an arrow. The Born rule only looks at the length: ${m('P(0) = |α|²')} and ${m('P(1) = |β|²')}.</p>
<p>Multiplying the whole state by the same phase changes nothing you could ever measure, so we are free to make ${m('α')} a real, non-negative number. Then any qubit state needs just two angles:</p>
${EQ('|ψ⟩ = cos(θ/2)|0⟩ + e<sup>iφ</sup> sin(θ/2)|1⟩')}
<p>The angle ${m('θ')} sets how the probability is split between 0 and 1. The angle ${m('φ')} is the <strong>relative phase</strong> between the two parts. Changing ${m('φ')} never changes ${m('P(0)')} or ${m('P(1)')}, which makes it easy to dismiss. It starts to matter as soon as a gate mixes ${m('|0⟩')} and ${m('|1⟩')} together. The colour of each arrow below follows the phase wheel used across this guide: blue for positive real amplitudes, orange-red for negative ones.</p>
${LAB('dials')}
<p>Try the presets ${m('|+⟩')} and ${m('|−⟩')}. Measured directly they both give 50/50. Switch to “Apply H, then measure” and they give opposite, certain answers. The relative phase was there all along; the Hadamard gate turned it into something a measurement can see.</p>
<h2>A superposition is not a mixture</h2>
<p>Compare two ways of preparing a qubit. In the first you prepare ${m('|+⟩ = (|0⟩ + |1⟩)/√2')}. In the second you flip a fair coin and prepare ${m('|0⟩')} or ${m('|1⟩')} depending on the result. Measure either one in the 0/1 basis and you get 0 half the time and 1 half the time.</p>
<p>The difference shows up when you apply a Hadamard gate first. The superposition ${m('|+⟩')} turns into ${m('|0⟩')} every time. The coin-flip mixture still gives 0 or 1 at random. The superposition had a definite relative phase between its two parts; the mixture had none.</p>
${LAB('mixture')}
<h2>Four states worth knowing by name</h2>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>State</th><th>Measured in the 0/1 basis</th></tr></thead><tbody>
<tr><td>|+⟩</td><td>(|0⟩ + |1⟩)/√2</td><td>50% / 50%</td></tr>
<tr><td>|−⟩</td><td>(|0⟩ − |1⟩)/√2</td><td>50% / 50%</td></tr>
<tr><td>|+i⟩</td><td>(|0⟩ + i|1⟩)/√2</td><td>50% / 50%</td></tr>
<tr><td>|−i⟩</td><td>(|0⟩ − i|1⟩)/√2</td><td>50% / 50%</td></tr>
</tbody></table></div>
<p>All four give identical statistics in the 0/1 basis, and all four are different states. They differ only in relative phase.</p>
${NOTE('Common misconception', `<p>Superposition does not mean the qubit is flickering between 0 and 1, and it does not mean it is secretly one of them. ${m('|+⟩')} is a perfectly definite state. Ask it the right question, “are you ${m('|+⟩')} or ${m('|−⟩')}?”, and it answers the same way every time.</p>`)}
`,
  labs: {
    dials: {
      title: 'Amplitude dials',
      cap: 'Each dial is an amplitude drawn as an arrow: length is magnitude, angle is phase. Dashed lines on the bars show the predicted probabilities; the bars fill in as you measure fresh copies of the state.',
      build(body, id) {
        let th = PI / 2, ph = 0, mode = 'z', counts = [0, 0], job = 0;
        const cv = canvas('', 'height:220px'), ketEl = h('div', { class: 'ketline' }), barsEl = h('div'), bars = new Bars(barsEl, ['0', '1'], { height: 150 });
        const amps = () => ({ ar: Math.cos(th / 2), br: Math.sin(th / 2) * Math.cos(ph), bi: Math.sin(th / 2) * Math.sin(ph) });
        const pred = () => { const p0 = mode === 'z' ? Math.cos(th / 2) ** 2 : (1 + Math.sin(th) * Math.cos(ph)) / 2; return [p0, 1 - p0]; };
        const pt = painter(cv, ({ ctx, w, h: H }) => {
          const { ar, br, bi } = amps(), R = Math.min(w / 4 - 16, H / 2 - 34);
          drawPhasor(ctx, w * .27, H / 2 + 4, R, ar, 0, 'α  (amplitude of |0⟩)');
          drawPhasor(ctx, w * .73, H / 2 + 4, R, br, bi, 'β  (amplitude of |1⟩)');
        });
        const readout = h('div', { class: 'chipline' });
        const upd = () => {
          const { ar, br, bi } = amps();
          ketEl.textContent = '|ψ⟩ = ' + ketString([ar, br], [0, bi], 1);
          const [p0, p1] = pred(), n = counts[0] + counts[1];
          bars.set(n ? [counts[0] / n, counts[1] / n] : [0, 0], { colors: ['var(--cyan)', 'var(--copper)'], texts: [n ? String(counts[0]) : '', n ? String(counts[1]) : ''], marks: [p0, p1] });
          readout.innerHTML = `<span>predicted P(0) <b>${pct(p0, 1)}</b></span><span>P(1) <b>${pct(p1, 1)}</b></span><span>shots <b>${n}</b></span>`;
          pt.inv();
        };
        const clear = () => { counts = [0, 0]; job = 0; upd(); };
        const sTh = slider({ id: id('th'), label: 'θ, how the probability is split', min: 0, max: 180, step: 1, value: 90, fmt: v => v + '°', on: v => { th = rad(v); clear(); } });
        const sPh = slider({ id: id('ph'), label: 'φ, relative phase', min: 0, max: 360, step: 1, value: 0, fmt: v => v + '°', on: v => { ph = rad(v); clear(); } });
        const presets = h('div', { class: 'btns' }, ...[['0', 0, 0], ['1', 180, 0], ['+', 90, 0], ['-', 90, 180], ['+i', 90, 90], ['-i', 90, 270]].map(([k, t, p]) =>
          btn(CARD_LABEL[k], () => { sTh.set(t); sPh.set(p); th = rad(t); ph = rad(p); clear(); }, 'sm')));
        const modeSeg = seg([{ v: 'z', label: 'Measure directly' }, { v: 'h', label: 'Apply H, then measure' }], 'z', v => { mode = v; clear(); }, 'Measurement');
        const shoot = k => { const [p0] = pred(); for (let i = 0; i < k; i++) counts[Math.random() < p0 ? 0 : 1]++; upd(); };
        Scope.tick(() => { if (job > 0) { const k = Math.min(job, 40); job -= k; shoot(k); } });
        body.append(h('div', { class: 'split' },
          h('div', { class: 'stack' }, cv, ketEl, barsEl, readout),
          h('div', { class: 'stack' }, sTh, sPh, field('Presets', presets), field('Measurement', modeSeg),
            h('div', { class: 'btns' }, btn('Measure 1', () => shoot(1)), btn('Measure 1,000', () => { if (reduced()) shoot(1000); else job += 1000; }, 'pri'), btn('Clear', clear)))));
        upd();
      }
    },
    mixture: {
      title: 'Superposition versus coin flip',
      cap: 'Both sources look identical when measured directly. Only the superposition responds to the Hadamard gate, because only it has a definite relative phase.',
      build(body, id) {
        let mode = 'z'; const cnt = { sup: [0, 0], mix: [0, 0] };
        const mk = (name, sub) => { const el = h('div'); const b = new Bars(el, ['0', '1'], { height: 140 }); return { b, el: h('div', { class: 'stack' }, h('div', null, h('div', { class: 'lab-title' }, name), h('div', { class: 'hint' }, sub)), el) }; };
        const A = mk('Superposition |+⟩', 'One definite state, (|0⟩ + |1⟩)/√2'), B = mk('Coin-flip mixture', 'Half the time |0⟩, half the time |1⟩');
        const paint = () => { for (const [k, P] of [['sup', A], ['mix', B]]) { const c2 = cnt[k], n = c2[0] + c2[1]; P.b.set(n ? [c2[0] / n, c2[1] / n] : [0, 0], { colors: ['var(--cyan)', 'var(--copper)'], texts: c2.map(String) }); } };
        const run = () => {
          for (let i = 0; i < 200; i++) {
            cnt.sup[mode === 'z' ? (Math.random() < .5 ? 0 : 1) : 0]++;
            cnt.mix[Math.random() < .5 ? 0 : 1]++;   // H on |0⟩ or |1⟩ still gives 50/50
          }
          paint();
        };
        const sg = seg([{ v: 'z', label: 'Measure directly' }, { v: 'h', label: 'Apply H, then measure' }], 'z', v => { mode = v; cnt.sup = [0, 0]; cnt.mix = [0, 0]; paint(); }, 'Measurement');
        body.append(h('div', { class: 'btns' }, sg, btn('Run 200 trials', run, 'pri'), btn('Clear', () => { cnt.sup = [0, 0]; cnt.mix = [0, 0]; paint(); })),
          h('div', { class: 'split even' }, A.el, B.el));
        paint();
      }
    }
  },
  take: ['An amplitude has a magnitude and a phase; probabilities depend only on the magnitude.',
    'Any qubit state can be written cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩.',
    'Relative phase is invisible to a direct measurement but becomes visible after a gate such as H.',
    'A superposition is a single definite state, unlike a random mixture of |0⟩ and |1⟩.'],
  quiz: [
    { q: 'Measuring directly in the 0/1 basis, which angle affects P(0)?', o: ['θ', 'φ', 'Both θ and φ', 'Neither'], a: 0, why: 'P(0) = cos²(θ/2). The relative phase φ never changes direct measurement statistics.' },
    { q: '|+⟩ and |−⟩ give identical statistics in the 0/1 basis. How can you tell them apart?', o: ['Measure many more times', 'Apply H, then measure', 'You can’t', 'Measure twice in a row'], a: 1, why: 'H maps |+⟩ to |0⟩ and |−⟩ to |1⟩, so one measurement after H tells them apart with certainty.' }
  ]
});

/* ---------------- Lesson 3 · Measurement ---------------- */
LESSONS.push({
  id: 'measurement', n: 3, stage: 0, minutes: 9, title: 'Measurement',
  lede: 'Measurement is how a quantum computer hands you an answer. It also changes the state it measures, and it only ever answers one question at a time.',
  html: `
<h2>The Born rule and collapse</h2>
<p>Measuring a qubit in the computational basis returns 0 with probability ${m('|α|²')} or 1 with probability ${m('|β|²')}. Immediately afterwards the qubit is in ${m('|0⟩')} or ${m('|1⟩')} to match the result. Measure again in the same basis and you get the same answer every time. The amplitudes that were there before are gone; one copy of a state is never enough to recover them.</p>
<h2>Choosing a basis</h2>
<p>The 0/1 basis is not special. You can measure along any axis. Measuring “in the X basis” asks whether the qubit is ${m('|+⟩')} or ${m('|−⟩')}. Most hardware can only measure in the 0/1 basis directly, so you rotate first: apply H, measure, and read 0 as “+” and 1 as “−”.</p>
<p>[[L:bloch]] introduces the Bloch sphere properly, but you can already use its geometric rule. Every state is a point on a sphere. The chance of getting the “+” result along an axis is</p>
${EQ('P(+) = (1 + cos γ) / 2')}
<p>where ${m('γ')} is the angle between the state and that axis. After the measurement the state jumps to whichever end of the axis matched.</p>
${LAB('measure')}
<h2>Measurement erases incompatible information</h2>
<p>Measurements along X and along Z are incompatible. Once you measure along X, whatever the qubit held about Z is gone. Try it above: start from ${m('|0⟩')}, measure Z (always 0), then X (random), then Z again. The last result is random, even though the first Z measurement was certain. This is the single-qubit version of Heisenberg’s uncertainty principle.</p>
<h2>Statistics need many runs</h2>
<p>A single run, called a <strong>shot</strong>, returns one bit. To estimate a probability you repeat the whole computation many times and count. The typical error of the estimate shrinks like ${m('1/√N')} for ${m('N')} shots:</p>
${EQ('σ = √( p(1 − p) / N )')}
<p>At ${m('p = 0.5')}, 100 shots give an uncertainty of about ±5 percentage points and 10,000 shots about ±0.5. Halving the error costs four times as many shots, which is why real quantum experiments often run tens of thousands of shots per circuit.</p>
${LAB('shots')}
`,
  labs: {
    measure: {
      title: 'Measure along an axis',
      cap: 'Drag the sphere to change your viewpoint. The highlighted axis is the one you are measuring along. Each measurement snaps the state to one end of that axis.',
      build(body, id) {
        const cv = canvas('sq'), bv = new BlochView(cv, { trail: false }); bv.hi = 'z';
        let st = [0, 0, 1], basis = 'z', prep = '0';
        const AX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }, LAB_ = { x: ['+', '−'], y: ['+i', '−i'], z: ['0', '1'] };
        const prob = h('div', { class: 'chipline' }), log = h('ol', { class: 'hint', style: 'margin:0;padding-left:20px;display:grid;gap:2px' });
        const updProb = () => { const p = (1 + V.dot(st, AX[basis])) / 2; prob.innerHTML = `<span>state <b>${ketOfBloch(st)}</b></span><span>P(${LAB_[basis][0]}) <b>${pct(p, 1)}</b></span><span>P(${LAB_[basis][1]}) <b>${pct(1 - p, 1)}</b></span>`; };
        const prepare = k => { prep = k; st = k === 'rand' ? fromAngles(Math.acos(2 * Math.random() - 1), Math.random() * TAU) : CARD[k].slice(); bv.moveTo(st, 500); log.innerHTML = ''; updProb(); };
        const measure = () => {
          const a = AX[basis], p = (1 + V.dot(st, a)) / 2, plus = Math.random() < p;
          st = V.scale(a, plus ? 1 : -1); bv.moveTo(st, 420); updProb();
          log.prepend(h('li', null, `${basis.toUpperCase()} basis → ${LAB_[basis][plus ? 0 : 1]}  (chance was ${pct(plus ? p : 1 - p, 0)})`));
          while (log.children.length > 8) log.lastChild.remove();
        };
        const presets = h('div', { class: 'btns' }, ...['0', '1', '+', '-', '+i', '-i'].map(k => btn(CARD_LABEL[k], () => prepare(k), 'sm')), btn('Random', () => prepare('rand'), 'sm'));
        const bs = seg([{ v: 'z', label: 'Z  (0 / 1)' }, { v: 'x', label: 'X  (+ / −)' }, { v: 'y', label: 'Y  (+i / −i)' }], 'z', v => { basis = v; bv.hi = v; bv.inv(); updProb(); }, 'Measurement basis');
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, field('Prepare a state', presets), field('Measure along', bs),
          h('div', { class: 'btns' }, btn('Measure', measure, 'pri'), btn('Prepare again', () => prepare(prep))), prob, field('Results, newest first', log))));
        bv.set(st); updProb();
      }
    },
    shots: {
      title: 'Shot noise',
      cap: 'Each of the 200 experiments estimates the probability from a fixed number of shots. The shaded band is ±1 standard deviation predicted by σ = √(p(1 − p)/N).',
      build(body, id) {
        let p = .5, lgN = 2, ests = [];
        const cv = canvas('', 'height:240px'), out = h('div', { class: 'chipline' });
        const N = () => Math.round(Math.pow(10, lgN));
        const run = () => { const n = N(); ests = []; for (let k = 0; k < 200; k++) ests.push(binom(n, p) / n); pt.inv(); stats(); };
        const stats = () => {
          const n = N(), sd = Math.sqrt(p * (1 - p) / n);
          let obs = '—'; if (ests.length) { const mu = ests.reduce((a, b) => a + b, 0) / ests.length; obs = pct(Math.sqrt(ests.reduce((a, b) => a + (b - mu) ** 2, 0) / ests.length), 2); }
          out.innerHTML = `<span>shots per experiment <b>${n.toLocaleString('en-US')}</b></span><span>predicted σ <b>${pct(sd, 2)}</b></span><span>observed σ <b>${obs}</b></span>`;
        };
        const pt = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), bins = new Array(101).fill(0); ests.forEach(e => bins[Math.round(e * 100)]++);
          const ymax = Math.max(10, ...bins) * 1.1;
          const A = axes(ctx, w, H, { x: [0, 1], y: [0, ymax], xt: [0, .25, .5, .75, 1], xf: v => pct(v, 0), yt: [0, Math.round(ymax / 2), Math.round(ymax)], xl: 'estimated probability', yl: 'experiments' });
          const sd = Math.sqrt(p * (1 - p) / N());
          ctx.fillStyle = rgba(T.copper, .14); ctx.fillRect(A.X(Math.max(0, p - sd)), A.T, A.X(Math.min(1, p + sd)) - A.X(Math.max(0, p - sd)), A.B - A.T);
          const bw = Math.max(1.5, (A.R - A.L) / 101 - .5);
          bins.forEach((c2, i) => { if (!c2) return; ctx.fillStyle = T.cyan; const x = A.X(i / 100) - bw / 2; ctx.fillRect(x, A.Y(c2), bw, A.B - A.Y(c2)); });
          polyline(ctx, [[A.X(p), A.T], [A.X(p), A.B]], T.copper, 2);
          txt(ctx, 'true p', A.X(p) + 4, A.T + 8, { align: 'left', color: T.copper, font: '600 11px "JetBrains Mono",monospace' });
        });
        const sP = slider({ id: id('p'), label: 'True probability p', min: .05, max: .95, step: .01, value: .5, fmt: v => pct(v, 0), on: v => { p = v; run(); } });
        const sN = slider({ id: id('n'), label: 'Shots per experiment', min: 1, max: 4, step: .25, value: 2, fmt: v => Math.round(Math.pow(10, v)).toLocaleString('en-US'), on: v => { lgN = v; run(); } });
        body.append(h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' }, sP, sN, btn('Run 200 experiments again', run, 'pri'), out)));
        run();
      }
    }
  },
  take: ['Measuring gives one bit and leaves the qubit in the matching basis state.',
    'You can measure along any axis; in practice you rotate first and then measure in the 0/1 basis.',
    'Along an axis at angle γ from the state, P(+) = (1 + cos γ)/2.',
    'Estimating a probability takes many shots, and the error falls only as 1/√N.'],
  quiz: [
    { q: 'You measure |+⟩ in the 0/1 basis and get 1. You measure it again in the same basis. What do you get?', o: ['0 or 1 at random', 'Always 1', 'Always 0', '|+⟩'], a: 1, why: 'The first measurement left the qubit in |1⟩, so repeating it gives 1 every time.' },
    { q: 'Roughly how many shots give a ±1 percentage-point uncertainty (one standard deviation) when p ≈ 0.5?', o: ['100', '2,500', '10,000', '1,000,000'], a: 1, why: 'The standard error is σ = √(p(1 − p)/N). With p = 0.5 that is √(0.25/N); setting it equal to 0.01 gives N = 0.25/0.0001 = 2,500. Halving the error again would take four times as many shots.' }
  ]
});

/* ---------------- Lesson 4 · The Bloch sphere ---------------- */
LESSONS.push({
  id: 'bloch', n: 4, stage: 0, minutes: 9, title: 'The Bloch sphere',
  lede: 'Every pure state of a single qubit is a point on a sphere. Gates turn the sphere, and measurement projects the point onto an axis.',
  html: `
<h2>From two amplitudes to two angles</h2>
<p>Start from ${m('|ψ⟩ = cos(θ/2)|0⟩ + e<sup>iφ</sup> sin(θ/2)|1⟩')}. Read ${m('θ')} as a polar angle measured down from the north pole and ${m('φ')} as an angle around the equator. Every qubit state becomes a point on a sphere of radius 1:</p>
${EQ('(x, y, z) = (sin θ cos φ,&nbsp; sin θ sin φ,&nbsp; cos θ)')}
<p>The north pole is ${m('|0⟩')} and the south pole is ${m('|1⟩')}. The equator holds every equal superposition: ${m('|+⟩')} on the x axis, ${m('|+i⟩')} on the y axis, and their opposites on the far side.</p>
${LAB('explorer')}
<h2>Why θ/2?</h2>
<p>States that can be told apart with certainty, called <strong>orthogonal</strong> states, sit at opposite ends of a diameter: ${m('|0⟩')} and ${m('|1⟩')}, or ${m('|+⟩')} and ${m('|−⟩')}. On the sphere the trip from ${m('|0⟩')} to ${m('|1⟩')} is 180°, but inside the cosine and sine it is only 90°. The factor of one half reconciles the two pictures.</p>
<h2>What the sphere leaves out, and what it adds</h2>
<p>Multiplying a state by an overall phase, ${m('e<sup>iγ</sup>|ψ⟩')}, gives identical predictions for every experiment, so the sphere ignores it. Relative phase is physical, and it is the longitude on the sphere.</p>
<p>Points <em>inside</em> the ball mean something too. A qubit that is entangled with another system, or that has been disturbed by noise, is described by a vector shorter than 1. The exact center is the completely random state: every measurement axis gives 50/50. You will meet these short vectors in Lessons [[N:entanglement]] and [[N:decoherence]].</p>
<h2>Reading off probabilities</h2>
<p>For a measurement in the 0/1 basis you only need the height of the point:</p>
${EQ('P(0) = (1 + z)/2,&nbsp;&nbsp; P(1) = (1 − z)/2')}
<p>The same rule works along any axis: the probability of the “+” outcome is one plus the projection onto that axis, divided by two.</p>
${NOTE('Keep in mind', `<p>The Bloch sphere is a picture of one qubit. Two or more entangled qubits cannot be drawn as several independent spheres; most of their information lives in correlations that no single sphere shows.</p>`)}
`,
  labs: {
    explorer: {
      title: 'Bloch sphere explorer',
      cap: 'Drag the sphere, or focus it and use the arrow keys, to change the view. The dashed lines drop the state onto the equator so you can judge its height.',
      build(body, id) {
        const cv = canvas('sq'), bv = new BlochView(cv, { trail: false });
        let th = 0, ph = 0;
        const ketEl = h('div', { class: 'ketline' }), ro = h('div', { class: 'readout' });
        const upd = () => {
          const v = fromAngles(th, ph); bv.set(v);
          ketEl.textContent = '|ψ⟩ = ' + ketOfBloch(v);
          ro.innerHTML = `<span class="k">α </span>${num(Math.cos(th / 2))}<br><span class="k">β </span>${cstr(Math.sin(th / 2) * Math.cos(ph), Math.sin(th / 2) * Math.sin(ph))}<br>` +
            `<span class="k">x, y, z </span>${num(v[0])}, ${num(v[1])}, ${num(v[2])}<br><span class="k">P(0), P(1) </span>${pct((1 + v[2]) / 2)}, ${pct((1 - v[2]) / 2)}`;
        };
        const sTh = slider({ id: id('th'), label: 'θ, polar angle', min: 0, max: 180, step: 1, value: 0, fmt: v => v + '°', on: v => { th = rad(v); upd(); } });
        const sPh = slider({ id: id('ph'), label: 'φ, longitude (relative phase)', min: 0, max: 360, step: 1, value: 0, fmt: v => v + '°', on: v => { ph = rad(v); upd(); } });
        const go = (t, p) => { th = rad(t); ph = rad(p); sTh.set(t); sPh.set(p); bv.moveTo(fromAngles(th, ph), 600).then(upd); };
        const presets = h('div', { class: 'btns' }, ...[['0', 0, 0], ['1', 180, 0], ['+', 90, 0], ['-', 90, 180], ['+i', 90, 90], ['-i', 90, 270]].map(([k, t, p]) => btn(CARD_LABEL[k], () => go(t, p), 'sm')));
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, ketEl, sTh, sPh, field('Jump to', presets), ro)));
        upd();
      }
    }
  },
  take: ['A pure qubit state is a point (sin θ cos φ, sin θ sin φ, cos θ) on the unit sphere.',
    'Orthogonal states are antipodal: |0⟩ and |1⟩ are the poles, |+⟩ and |−⟩ opposite points on the equator.',
    'Global phase is invisible; relative phase is longitude.',
    'P(0) = (1 + z)/2. Points inside the ball describe noisy or entangled qubits.'],
  quiz: [
    { q: 'Where on the Bloch sphere is (|0⟩ − i|1⟩)/√2?', o: ['+x', '−x', '+y', '−y'], a: 3, why: 'It is |−i⟩: on the equator with φ = −90°, which is the −y direction.' },
    { q: 'A state has Bloch coordinates (0.6, 0, 0.8). What is P(0)?', o: ['0.8', '0.9', '0.64', '0.6'], a: 1, why: 'For a 0/1 measurement only the height matters: P(0) = (1 + z)/2 = (1 + 0.8)/2 = 0.9. The x coordinate of 0.6 describes the relative phase and does not change these odds.' }
  ]
});

})();
