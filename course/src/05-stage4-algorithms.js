/* =====================================================================
   Stage 4 · 100 mK · Algorithms
   ===================================================================== */
(() => {

const popc = x => { let c2 = 0; while (x) { c2 += x & 1; x >>= 1; } return c2; };
const wait = ms => new Promise(r => Scope.later(ms, r));

/* ---------------- Lesson 12 · Deutsch–Jozsa ---------------- */
LESSONS.push({
  id: 'deutsch', n: 12, stage: 3, minutes: 12, title: 'Deutsch–Jozsa and phase kickback',
  lede: 'The first algorithm to show a quantum computer answering a question with fewer queries than any deterministic classical method. Its central trick, phase kickback, appears in almost every algorithm that follows.',
  html: `
<h2>The problem</h2>
<p>You are handed a black box, called an <strong>oracle</strong>, that computes a function ${m('f')} from ${m('n')}-bit strings to a single bit. You are promised that ${m('f')} is either <strong>constant</strong>, giving the same output for every input, or <strong>balanced</strong>, giving 0 on exactly half the inputs and 1 on the other half. Which is it?</p>
<p>A deterministic classical algorithm has to be careful. In the worst case it sees the same output on the first half of the inputs and still cannot tell, so it needs ${m('2<sup>n−1</sup> + 1')} queries to be certain. The quantum algorithm needs one.</p>
<h2>The oracle as a phase</h2>
<p>A quantum oracle has to be reversible, so it keeps its input and adds the answer into a spare output qubit: ${m('U<sub>f</sub>|x⟩|y⟩ = |x⟩|y ⊕ f(x)⟩')}. Now prepare the output qubit in ${m('|−⟩')}. Adding 1 to ${m('|−⟩')} just multiplies it by −1, so</p>
${EQ('U<sub>f</sub> |x⟩|−⟩ = (−1)<sup>f(x)</sup> |x⟩|−⟩')}
<p>The output qubit is unchanged and the function value has moved into the phase of the input register. This is <strong>phase kickback</strong>. Because the input register can be in a superposition of every ${m('x')} at once, one query stamps a sign on all ${m('2ⁿ')} terms.</p>
<h2>The algorithm</h2>
<ol>
<li>Start the input register in ${m('|0…0⟩')} and apply H to every qubit, giving an equal superposition of all ${m('2ⁿ')} inputs.</li>
<li>Query the oracle once. Each term picks up the sign ${m('(−1)<sup>f(x)</sup>')}.</li>
<li>Apply H to every qubit again and measure.</li>
</ol>
<p>The final amplitude of ${m('|0…0⟩')} is the average of the signs:</p>
${EQ('⟨0…0| H<sup>⊗n</sup> U<sub>f</sub> H<sup>⊗n</sup> |0…0⟩ = (1/2ⁿ) Σ<sub>x</sub> (−1)<sup>f(x)</sup>')}
<p>For a constant function the signs all agree, the average is ±1, and you measure all zeros with certainty. For a balanced function the signs cancel exactly and you never measure all zeros. One query, no error.</p>
${LAB('dj')}
${NOTE('A fair comparison', `<p>A randomized classical algorithm that queries a handful of random inputs is right with high probability, so the advantage here is only over deterministic algorithms. Deutsch–Jozsa matters for its technique. Bernstein–Vazirani and Simon’s algorithm use the same structure to get stronger separations, and Simon’s algorithm directly inspired Shor’s.</p>`)}
`,
  labs: {
    dj: {
      title: 'One query against many',
      cap: 'Bars show the real amplitudes of the three input qubits: blue for positive, orange-red for negative. Edit the truth table by tapping entries. A function that is neither constant nor balanced breaks the promise, and the final answer becomes probabilistic.',
      build(body, id) {
        let f = [0, 1, 1, 0, 1, 0, 0, 1], stp = 0, seen = new Map();
        const cv = canvas('', 'height:230px'), sb = new SignedBars(cv, 8, { labels: [...Array(8)].map((_, i) => ket(i, 3)), ymax: 1 });
        const tt = h('div', { class: 'tt', role: 'group', 'aria-label': 'Truth table of f' }), kindEl = h('div', { class: 'chipline' }), stat = h('div', { class: 'status' }), cls = h('div', { class: 'status' });
        const kind = () => { const s = f.reduce((a, b) => a + b, 0); return s === 0 || s === 8 ? 'constant' : s === 4 ? 'balanced' : 'neither'; };
        const amps = k => {
          if (k === 0) return [1, 0, 0, 0, 0, 0, 0, 0];
          if (k === 1) return new Array(8).fill(1 / Math.sqrt(8));
          if (k === 2) return f.map(v => (v ? -1 : 1) / Math.sqrt(8));
          return [...Array(8)].map((_, y) => f.reduce((s, v, x) => s + (v ? -1 : 1) * (popc(x & y) % 2 ? -1 : 1), 0) / 8);
        };
        const NAMES = ['Start in |000⟩', 'After H on every qubit', 'After one oracle query (phase kickback)', 'After H again, ready to measure'];
        const bBack = btn('Back', () => { if (stp > 0) { stp--; render(); } }), bNext = btn('Next', () => { if (stp < 3) { stp++; render(); } }, 'pri');
        const render = () => {
          sb.to(amps(stp));
          tt.innerHTML = '';
          f.forEach((v, x) => tt.append(h('button', { type: 'button', 'data-v': v, 'data-q': seen.has(x) ? 1 : 0, 'aria-label': `f(${x.toString(2).padStart(3, '0')}) = ${v}. Tap to flip.`, onclick: () => { f[x] ^= 1; seen.clear(); render(); } }, x.toString(2).padStart(3, '0'), h('b', null, String(v)))));
          const kd = kind();
          kindEl.innerHTML = `<span>f is <b>${kd}</b></span><span>outputs equal to 1: <b>${f.reduce((a, b) => a + b, 0)} of 8</b></span>`;
          const p0 = amps(3)[0] ** 2;
          stat.className = 'status' + (stp === 3 ? (kd === 'neither' ? ' bad' : ' good') : '');
          stat.textContent = stp < 3 ? `${NAMES[stp]}.` : `${NAMES[3]}. P(|000⟩) = ${pct(p0, 0)}. ` + (kd === 'constant' ? 'All zeros, every time: constant.' : kd === 'balanced' ? 'Never all zeros: balanced.' : 'The promise is broken, so the answer is only probabilistic.');
          bBack.disabled = stp === 0; bNext.disabled = stp === 3;
          const vals = [...seen.values()], diff = new Set(vals).size > 1;
          cls.className = 'status' + (diff || seen.size >= 5 ? ' good' : '');
          cls.textContent = seen.size === 0 ? 'A deterministic classical method queries inputs one at a time.' :
            diff ? `Two different outputs after ${seen.size} queries: f must be balanced.` :
              seen.size >= 5 ? `Five equal outputs: more than half the inputs agree, so f must be constant. That took 5 queries.` :
                `${seen.size} quer${seen.size > 1 ? 'ies' : 'y'}, all giving ${vals[0]}. Not enough to be sure yet.`;
        };
        const query = () => { const left = [...Array(8).keys()].filter(x => !seen.has(x)); if (!left.length) return; const x = left[Math.floor(Math.random() * left.length)]; seen.set(x, f[x]); render(); };
        const preset = arr => { f = arr.slice(); seen.clear(); stp = 0; render(); };
        const randBal = () => { const idx = [...Array(8).keys()].sort(() => Math.random() - .5); const a = new Array(8).fill(0); idx.slice(0, 4).forEach(i => a[i] = 1); return a; };
        body.append(h('div', { class: 'split' },
          h('div', { class: 'stack' }, cv, stat, h('div', { class: 'btns' }, bBack, bNext, btn('Run all', () => { stp = 3; render(); }))),
          h('div', { class: 'stack' }, field('Truth table of f (tap to edit)', tt), kindEl,
            h('div', { class: 'btns' }, btn('Constant 0', () => preset([0, 0, 0, 0, 0, 0, 0, 0]), 'sm'), btn('Constant 1', () => preset([1, 1, 1, 1, 1, 1, 1, 1]), 'sm'), btn('Random balanced', () => preset(randBal()), 'sm')),
            field('Classical race', h('div', { class: 'btns' }, btn('Query one input', query), btn('Forget queries', () => { seen.clear(); render(); }))), cls,
            h('div', { class: 'hint' }, 'Quantum queries needed: 1. Inputs a classical query has checked are outlined in blue.'))));
        sb.to(amps(0), true); render();
      }
    }
  },
  take: ['An oracle U_f|x⟩|y⟩ = |x⟩|y ⊕ f(x)⟩ becomes a phase oracle when the output qubit is |−⟩.',
    'Phase kickback writes (−1)^{f(x)} onto every term of a superposition with one query.',
    'H, oracle, H: all zeros means constant, anything else means balanced.',
    'The advantage is over deterministic classical algorithms; the technique leads to Simon and Shor.'],
  quiz: [
    { q: 'After the final Hadamards, what is the probability of |000⟩ for a balanced function?', o: ['0', '1/8', '1/2', '1'], a: 0, why: 'The amplitude of |000⟩ is the average of the signs, and a balanced function has as many −1s as +1s.' },
    { q: 'Which state on the output qubit turns the oracle into a phase?', o: ['|0⟩', '|1⟩', '|+⟩', '|−⟩'], a: 3, why: 'X|−⟩ = −|−⟩, so flipping the output qubit just multiplies the state by −1.' }
  ]
});

/* ---------------- Lesson 13 · Grover's search ---------------- */
LESSONS.push({
  id: 'grover', n: 13, stage: 3, minutes: 13, title: 'Grover’s search',
  lede: 'Grover’s algorithm finds a marked item among N possibilities in about √N steps instead of N. It works by rotating the state toward the answer a little at a time.',
  html: `
<h2>Unstructured search</h2>
<p>Suppose you have ${m('N')} candidates and an oracle that recognizes the right one, but nothing else to go on: no sorting, no structure. Classically you must check about ${m('N/2')} candidates on average. Lov Grover showed in 1996 that a quantum computer needs only about ${m('(π/4)√N')} oracle calls. For a million candidates that is roughly 785 calls instead of 500,000.</p>
<h2>Two reflections</h2>
<p>Start with every candidate in equal superposition. Then repeat two steps:</p>
<ol>
<li><strong>Oracle.</strong> Flip the sign of the marked item’s amplitude (phase kickback again).</li>
<li><strong>Diffusion.</strong> Reflect every amplitude about the average amplitude: ${m('a → 2⟨a⟩ − a')}.</li>
</ol>
<p>The oracle pushes the marked amplitude below zero, which drags the average down slightly. Reflecting about the average then lifts the marked amplitude well above all the others, which shrink a little. Each round transfers more amplitude onto the answer.</p>
${LAB('grover')}
<h2>The geometric picture</h2>
<p>The state never leaves a two-dimensional plane: the one spanned by the marked state ${m('|w⟩')} and the equal superposition of all unmarked states, ${m('|s′⟩')}. Both steps are reflections in that plane, and two reflections make a rotation. Each iteration turns the state by ${m('2θ')} toward ${m('|w⟩')}, where ${m('sin θ = 1/√N')}. After ${m('k')} iterations</p>
${EQ('P(success) = sin²((2k + 1)θ)')}
<p>The rotation does not stop at the target. Run too many iterations and the state swings past ${m('|w⟩')}, and the success probability falls again. The best number of iterations is about ${m('(π/4)√N')}. Try overshooting in the lab.</p>
<h2>What a quadratic speedup buys</h2>
<p>Grover’s speedup is provably the best possible for unstructured search: Bennett, Bernstein, Brassard and Vazirani showed in 1997 that any quantum algorithm needs on the order of ${m('√N')} queries. A quadratic speedup is real but modest. Each oracle call on a fault-tolerant machine is slow compared with a classical check, so the advantage only pays off for very large search spaces. Its most quoted consequence is for symmetric cryptography: Grover search would roughly halve the effective key length of a cipher such as AES, which is why 256-bit keys are recommended for long-term security.</p>
`,
  labs: {
    grover: {
      title: 'Amplitude amplification',
      cap: 'Tap a bar to choose which item is marked. The dashed line during diffusion is the average amplitude. The circle shows the same state as an arrow in the |w⟩, |s′⟩ plane; the chart shows the success probability for every iteration count.',
      build(body, id) {
        let n = 4, N = 16, w = 11, a = [], k = 0, half = false, token = 0;
        const cv = canvas('', 'height:250px'), sb = new SignedBars(cv, N, { ymax: 1 });
        const geo = canvas('sq', 'max-width:250px;margin:0 auto'), pch = canvas('', 'height:170px'), stat = h('div', { class: 'chipline' });
        const th0 = () => Math.asin(1 / Math.sqrt(N)), kopt = () => Math.floor(PI / 4 * Math.sqrt(N));
        const angle = () => { const o = (w + 1) % N; return Math.atan2(a[w], a[o] * Math.sqrt(N - 1)); };
        const pg = painter(geo, ({ ctx, w: W, h: H }) => {
          const T = Theme.get(), cx = W * .5, cy = H * .5, R = Math.min(W, H) * .4;
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - R - 8, cy); ctx.lineTo(cx + R + 8, cy); ctx.moveTo(cx, cy + R + 8); ctx.lineTo(cx, cy - R - 8); ctx.stroke();
          txt(ctx, '|w⟩', cx, cy - R - 16, { font: MATHFONT(15), color: T.ink }); txt(ctx, '|s′⟩', cx + R + 4, cy - 12, { font: MATHFONT(15), color: T.ink, align: 'left' });
          const t0 = th0(); ctx.setLineDash([3, 3]); ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(t0), cy - R * Math.sin(t0)); ctx.stroke(); ctx.setLineDash([]);
          const g = angle(); arrow(ctx, cx, cy, cx + R * Math.cos(g), cy - R * Math.sin(g), T.copper, 3, 11);
          txt(ctx, `angle ${num(deg(g), 1)}°`, cx, H - 8, { base: 'bottom' });
        });
        const pp = painter(pch, ({ ctx, w: W, h: H }) => {
          const T = Theme.get(), K = Math.max(6, 2 * kopt() + 2), t = th0();
          const A = axes(ctx, W, H, { x: [-.5, K + .5], y: [0, 1], xt: [...Array(K + 1).keys()].filter(i => K <= 12 || i % 2 === 0), yt: [0, .5, 1], yf: v => pct(v, 0), xl: 'iterations', yl: 'P(marked)' });
          const cur = []; for (let s = 0; s <= K; s += .05) cur.push([A.X(s), A.Y(Math.sin((2 * s + 1) * t) ** 2)]); polyline(ctx, cur, T.line, 1.5);
          for (let i = 0; i <= K; i++) dot(ctx, A.X(i), A.Y(Math.sin((2 * i + 1) * t) ** 2), i === k && !half ? 6 : 3.5, i === k && !half ? T.copper : T.cyan);
        });
        const upd = () => {
          const p = a[w] ** 2;
          stat.innerHTML = `<span>items N <b>${N}</b></span><span>iterations <b>${k}${half ? ' + oracle' : ''}</b></span><span>best count <b>${kopt()}</b></span><span>P(marked) <b>${pct(p, 1)}</b></span>`;
          pg.inv(); pp.inv();
        };
        const reset = () => {
          token++; N = 1 << n; if (w >= N) w = N - 1; a = new Array(N).fill(1 / Math.sqrt(N)); k = 0; half = false;
          sb.setN(N); sb.o.labels = N <= 16 ? [...Array(N)].map((_, i) => ket(i, n)) : null; sb.mark = w; sb.mean = null; sb.to(a, true); upd();
        };
        sb.onPick = i => { w = i; reset(); };
        const oracle = () => { a[w] *= -1; half = true; sb.to(a); upd(); };
        const diffuse = async () => {
          const t = token, mean = a.reduce((s, v) => s + v, 0) / N; sb.mean = mean; sb.p.inv(); await wait(dur(500)); if (t !== token) return;
          a = a.map(v => 2 * mean - v); if (half) { k++; half = false; } sb.to(a); upd(); await wait(dur(800)); if (t !== token) return; sb.mean = null; sb.p.inv();
        };
        const iterate = async () => { const t = token; oracle(); await wait(dur(600)); if (t !== token) return; await diffuse(); };
        const auto = async () => { const t = token; while (k < kopt() && t === token) { await iterate(); await wait(dur(200)); } };
        const nSeg = seg([2, 3, 4, 5, 6].map(v => ({ v, label: String(1 << v) })), n, v => { n = v; reset(); }, 'Number of items');
        body.append(h('div', { class: 'btns' }, field('Items N', nSeg)), cv,
          h('div', { class: 'btns' }, btn('Oracle', oracle), btn('Diffuse', diffuse), btn('One full iteration', iterate, 'pri'), btn('Run to the best count', auto), btn('Reset', reset), btn('Random marked item', () => { w = Math.floor(Math.random() * N); reset(); })),
          stat, h('div', { class: 'split even' }, geo, pch));
        reset();
      }
    }
  },
  take: ['Grover’s algorithm finds one marked item among N with about (π/4)√N oracle calls.',
    'Each iteration is an oracle sign flip followed by inversion about the average.',
    'Geometrically, each iteration rotates the state by 2θ, with sin θ = 1/√N.',
    'Too many iterations overshoot; the quadratic speedup is optimal for unstructured search.'],
  quiz: [
    { q: 'For N = 16, how many Grover iterations give the highest success probability?', o: ['1', '2', '3', '16'], a: 2, why: '(π/4)√16 ≈ 3.14, so 3 iterations, giving sin²(7θ) ≈ 96%.' },
    { q: 'What does the diffusion step do to each amplitude a?', o: ['a → −a', 'a → 2·average − a', 'a → a²', 'a → a / average'], a: 1, why: 'It reflects every amplitude about the average.' }
  ]
});

/* ---------------- Lesson 14 · Quantum Fourier transform ---------------- */
LESSONS.push({
  id: 'qft', n: 14, stage: 3, minutes: 12, title: 'The quantum Fourier transform',
  lede: 'The quantum Fourier transform turns repeating patterns in amplitudes into sharp peaks you can measure. It is the engine of phase estimation and of Shor’s algorithm.',
  html: `
<h2>Definition</h2>
<p>On ${m('n')} qubits, with ${m('N = 2ⁿ')}, the QFT maps each basis state to a superposition of all basis states with steadily turning phases:</p>
${EQ('QFT |x⟩ = (1/√N) Σ<sub>k=0</sub><sup>N−1</sup> e<sup>2πi·xk/N</sup> |k⟩')}
<p>It is the same discrete Fourier transform used in signal processing and image compression, applied to the list of ${m('N')} amplitudes.</p>
<h2>Binary clocks</h2>
<p>The output of the QFT on a basis state is a product state: every qubit lands on the equator of its Bloch sphere, with a phase that turns at its own rate as ${m('x')} increases. Writing qubit 1 as the leftmost,</p>
${EQ('QFT |x⟩ = ⊗<sub>j=1</sub><sup>n</sup> (|0⟩ + e<sup>2πi·x/2<sup>j</sup></sup> |1⟩)/√2')}
<p>The leftmost qubit turns half a revolution for every step of ${m('x')}, the next a quarter, the next an eighth, and so on. It is a set of clock hands counting in binary: the fast hand records the last bit of ${m('x')} and the slow hand the whole number.</p>
${LAB('clocks')}
<h2>Finding a period</h2>
<p>The property that makes the QFT useful is what it does to periodic inputs. If the amplitudes repeat every ${m('r')} steps, the output concentrates on multiples of ${m('N/r')}. Measuring then gives a number close to a multiple of ${m('N/r')}, and from it you can work out ${m('r')}. Shor’s algorithm ([[L:shor]]) does exactly this.</p>
${LAB('periodic')}
<h2>The circuit and its cost</h2>
<p>The QFT circuit uses one Hadamard per qubit, controlled phase rotations ${m('R<sub>k</sub>')} between pairs of qubits, where ${m('R<sub>k</sub>')} applies a phase of ${m('2π/2<sup>k</sup>')}, and swaps to reverse the qubit order at the end.</p>
<div class="wide" data-qft-circuit></div>
<p>That is ${m('n(n − 1)/2')} controlled rotations, so the gate count grows like ${m('n²')}. The classical fast Fourier transform of ${m('2ⁿ')} numbers takes about ${m('n·2ⁿ')} operations. The catch is that the QFT’s output lives in amplitudes, which cannot be read out directly. The QFT only helps inside algorithms that make the output collapse onto something useful.</p>
`,
  mount(root) {
    const el = root.querySelector('[data-qft-circuit]'); if (!el) return;
    const w = h('div', { class: 'circ-wrap', style: 'margin:8px 0 22px' });
    w.append(drawCircuit(3, [[{ g: 'H', q: 0 }], [{ g: 'CR', c: 1, t: 0, label: 'R₂' }], [{ g: 'CR', c: 2, t: 0, label: 'R₃' }], [{ g: 'H', q: 1 }], [{ g: 'CR', c: 2, t: 1, label: 'R₂' }], [{ g: 'H', q: 2 }], [{ g: 'SW', a: 0, b: 2 }]], { cw: 62, aria: 'Three-qubit QFT circuit' }).svg);
    el.append(w);
  },
  labs: {
    clocks: {
      title: 'Fourier clocks',
      cap: 'Each dial is one output qubit seen from above its Bloch sphere: the hand points at its phase. Press Count to step x upward and watch each hand turn at half the speed of the one to its left.',
      build(body, id) {
        const n = 4, NN = 16; let xs = 5, xt = 5, play = false, last = 0;
        const cv = canvas('', 'height:230px'), ro = h('div', { class: 'readout' });
        const FR_ = ['½', '¼', '⅛', '1/16'];
        const pt = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), cw = w / n, R = Math.min(cw * .36, H * .3), cy = H * .46;
          for (let j = 0; j < n; j++) {
            const cx = cw * j + cw / 2, ang = TAU * xs / 2 ** (j + 1), steps = 2 ** (j + 1);
            ctx.strokeStyle = T.line; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
            for (let s = 0; s < steps; s++) { const a = TAU * s / steps; ctx.beginPath(); ctx.moveTo(cx + R * .86 * Math.cos(a), cy - R * .86 * Math.sin(a)); ctx.lineTo(cx + R * Math.cos(a), cy - R * Math.sin(a)); ctx.stroke(); }
            arrow(ctx, cx, cy, cx + R * .92 * Math.cos(ang), cy - R * .92 * Math.sin(ang), phaseColor(ang), 3, 10); dot(ctx, cx, cy, 3, T.ink);
            txt(ctx, `qubit ${j}`, cx, cy - R - 16, { color: T.ink, font: '700 13px "Bricolage Grotesque",sans-serif' });
            txt(ctx, `${FR_[j]} turn per step`, cx, cy + R + 18);
            const xi = ((Math.round(xs) % NN) + NN) % NN;
            txt(ctx, `${xi % steps}/${steps} turn`, cx, cy + R + 34, { color: T.ink });
          }
        });
        const upd = () => {
          const xi = ((Math.round(xs) % NN) + NN) % NN;
          ro.innerHTML = `<span class="k">x  </span>${xi} = ${xi.toString(2).padStart(4, '0')}₂<br><span class="k">QFT|x⟩ </span>` + [1, 2, 3, 4].map(j => `(|0⟩ + e<sup>2πi·${xi % 2 ** j}/${2 ** j}</sup>|1⟩)`).join(' ⊗ ') + ' / 4';
        };
        const sl = slider({ id: id('x'), label: 'Input x', min: 0, max: 15, step: 1, value: 5, fmt: v => String(v), on: v => { play = false; pb.textContent = 'Count'; xt = v + NN * Math.floor(xs / NN); upd(); } });
        const pb = btn('Count', () => { play = !play; pb.textContent = play ? 'Pause' : 'Count'; if (!play) { xt = Math.round(xs); } }, 'pri');
        Scope.tick(now => {
          const dt = Math.min(50, now - (last || now)); last = now;
          if (play) { xs += dt / (reduced() ? 400 : 1100); xt = xs; const xi = ((Math.floor(xs + .5) % NN) + NN) % NN; if (+sl.val() !== xi) { sl.set(xi); upd(); } pt.inv(); }
          else if (Math.abs(xt - xs) > 1e-3) { xs += (xt - xs) * (reduced() ? 1 : .12); pt.inv(); }
        });
        body.append(cv, h('div', { class: 'split' }, h('div', { class: 'stack' }, sl, h('div', { class: 'btns' }, pb)), ro));
        upd();
      }
    },
    periodic: {
      title: 'Periodic input, sharp output',
      cap: 'Top: an input that is nonzero every r steps on N = 32 points. Bottom: the probabilities after the QFT, coloured by phase. Copper ticks mark multiples of N/r. When r divides 32 the peaks are exact; otherwise they spread slightly around the ticks.',
      build(body, id) {
        const N = 32; let r = 4, off = 0;
        const top = canvas('', 'height:140px'), bot = canvas('', 'height:170px'), info = h('div', { class: 'chipline' });
        const compute = () => {
          const xs = []; for (let x = off; x < N; x += r) xs.push(x);
          const amp = 1 / Math.sqrt(xs.length), inR = new Array(N).fill(0); xs.forEach(x => inR[x] = amp);
          const oR = [], oI = [];
          for (let k = 0; k < N; k++) { let sr = 0, si = 0; for (const x of xs) { const a = TAU * x * k / N; sr += amp * Math.cos(a); si += amp * Math.sin(a); } oR.push(sr / Math.sqrt(N)); oI.push(si / Math.sqrt(N)); }
          return { inR, oR, oI };
        };
        let D = compute();
        const draw = (ctx, w, H, re, im, marks, title) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-.5, N - .5], y: [0, 1], xt: [0, 8, 16, 24, 31], yt: [0, .5, 1], yf: v => pct(v, 0), yl: title, pad: { b: 30 } });
          const bw = (A.R - A.L) / N * .72;
          for (let i = 0; i < N; i++) { const p = re[i] ** 2 + (im ? im[i] ** 2 : 0); if (p < 1e-6) continue; ctx.fillStyle = phaseColor(Math.atan2(im ? im[i] : 0, re[i])); ctx.fillRect(A.X(i) - bw / 2, A.Y(p), bw, A.B - A.Y(p)); }
          if (marks) { ctx.fillStyle = T.copper; for (let j = 0; j * N / r < N - .01; j++) { const x = A.X(j * N / r); ctx.beginPath(); ctx.moveTo(x, A.B + 1); ctx.lineTo(x - 5, A.B + 9); ctx.lineTo(x + 5, A.B + 9); ctx.closePath(); ctx.fill(); } }
        };
        const p1 = painter(top, ({ ctx, w, h: H }) => draw(ctx, w, H, D.inR, null, false, 'input probability'));
        const p2 = painter(bot, ({ ctx, w, h: H }) => draw(ctx, w, H, D.oR, D.oI, true, 'after QFT'));
        const upd = () => { D = compute(); p1.inv(); p2.inv(); info.innerHTML = `<span>period r <b>${r}</b></span><span>N/r <b>${num(N / r, 2)}</b></span><span>${N % r === 0 ? 'r divides N: exact peaks' : 'r does not divide N: approximate peaks'}</span>`; };
        const sO = slider({ id: id('off'), label: 'Offset', min: 0, max: 3, step: 1, value: 0, fmt: String, on: v => { off = v; upd(); } });
        const sR = slider({ id: id('r'), label: 'Period r', min: 1, max: 12, step: 1, value: 4, fmt: String, on: v => { r = v; if (off >= r) { off = 0; } sO.input.max = r - 1; sO.set(off); upd(); } });
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, top, bot), h('div', { class: 'stack' }, sR, sO, info, h('p', { class: 'hint' }, 'Changing the offset shifts the input but leaves the output probabilities untouched. Only the phases change. That is why measuring after the QFT reveals the period without caring where the pattern started.'))));
        upd();
      }
    }
  },
  take: ['The QFT applies the discrete Fourier transform to the amplitudes of n qubits.',
    'On a basis state it produces a product of equator states whose phases turn at rates 1/2, 1/4, 1/8, …',
    'A period-r input turns into peaks at multiples of N/r, independent of the offset.',
    'It needs about n²/2 gates, but its output can only be read through measurement.'],
  quiz: [
    { q: 'How does the gate count of the QFT grow with the number of qubits n?', o: ['Like n', 'Like n²', 'Like 2ⁿ', 'Like n·2ⁿ'], a: 1, why: 'n Hadamards plus n(n − 1)/2 controlled rotations.' },
    { q: 'An input with period r = 4 on N = 32 points. Where are the output peaks?', o: ['0, 4, 8, … 28', '0, 8, 16, 24', 'Only at 4', 'At 32/4 = 8 only'], a: 1, why: 'A period-r input concentrates the output on multiples of N/r. Here N/r = 32/4 = 8, so the peaks are at 0, 8, 16 and 24 with equal weight, and nothing lands in between because 4 divides 32 exactly.' }
  ]
});

/* ---------------- Lesson 15 · Shor's algorithm ---------------- */
LESSONS.push({
  id: 'shor', n: 15, stage: 3, minutes: 15, title: 'Shor’s algorithm',
  lede: 'Shor’s algorithm factors whole numbers in polynomial time on a large enough fault-tolerant quantum computer. The quantum part finds a period; the rest is number theory you can do with a pencil.',
  html: `
<h2>Factoring as period finding</h2>
<p>Peter Shor’s 1994 insight was that factoring a number ${m('N')} reduces to finding the period of a simple function. The recipe:</p>
<ol>
<li>Pick a random ${m('a')} with ${m('1 < a < N')}. If ${m('gcd(a, N) > 1')} you have stumbled on a factor already.</li>
<li>Find the <strong>period</strong> ${m('r')} of ${m('f(x) = a<sup>x</sup> mod N')}: the smallest ${m('r > 0')} with ${m('a<sup>r</sup> ≡ 1 (mod N)')}. This is the hard step, and the quantum computer does it.</li>
<li>If ${m('r')} is even and ${m('a<sup>r/2</sup> ≢ −1 (mod N)')}, then ${m('gcd(a<sup>r/2</sup> − 1, N)')} and ${m('gcd(a<sup>r/2</sup> + 1, N)')} are factors of ${m('N')}.</li>
<li>Otherwise pick another ${m('a')}. For an odd ${m('N')} with at least two different prime factors, each random ${m('a')} succeeds with probability at least one half.</li>
</ol>
<p>Step 3 works because ${m('a<sup>r</sup> − 1 = (a<sup>r/2</sup> − 1)(a<sup>r/2</sup> + 1)')} is a multiple of ${m('N')}, while neither bracket is. So each bracket must share part of ${m('N')}’s factorization.</p>
${LAB('shor')}
<h2>The quantum part</h2>
<p>Use two registers. Put the first, with ${m('q')} qubits where ${m('Q = 2<sup>q</sup> ≥ N²')}, into an equal superposition of every ${m('x')}. Compute ${m('a<sup>x</sup> mod N')} into the second register; this modular exponentiation is the expensive part of the whole algorithm. Measuring the second register, or simply ignoring it, leaves the first in a superposition of ${m('x')} values spaced ${m('r')} apart: a periodic state, like the one in [[L:qft]]. Apply the QFT and measure. The result ${m('y')} lands near a multiple of ${m('Q/r')}, so ${m('y/Q ≈ j/r')} for some unknown ${m('j')}. How that arithmetic is built from reversible adders is the subject of [[L:arithmetic]].</p>
<p>The <strong>continued fraction</strong> expansion of ${m('y/Q')} finds the best fraction with a small denominator, which reveals ${m('r')} or a divisor of it. A few repetitions are enough with high probability.</p>
<h2>How big a machine?</h2>
<p>Breaking a 2048-bit RSA key needs an error-corrected machine far beyond anything built so far. Published resource estimates have come down sharply: from about 20 million noisy physical qubits running for 8 hours (Gidney and Ekerå, 2019) to under a million noisy qubits running for less than a week (Gidney, 2025). Both assume physical error rates around 0.1% and the surface code of [[L:qec]]. The numbers factored on real hardware with Shor-style circuits so far are tiny, such as 15 and 21, and several reported demonstrations used shortcuts that depend on already knowing the answer.</p>
<h2>Why it matters anyway</h2>
<p>RSA and elliptic-curve cryptography both fall to variants of Shor’s algorithm, and encrypted data recorded today could be decrypted once a large machine exists. That risk is why NIST published its first post-quantum cryptography standards (FIPS 203, 204 and 205) in August 2024, built on mathematical problems with no known efficient quantum attack.</p>
`,
  labs: {
    shor: {
      title: 'Factor a number',
      cap: 'Steps 1, 3 and 4 run on a classical computer. Step 2 is the quantum part: the chart is the exact probability of each measurement result y, computed from the formula for the QFT of a periodic state. Each Measure press samples one y.',
      build(body, id) {
        const NS = [15, 21, 33, 35, 39, 51, 55, 57, 65, 77, 85, 91]; let N = 15, a = 7, Q = 256, r = 4, dist = null, ys = [];
        const selN = h('select', { class: 'sel', id: id('N'), 'aria-label': 'Number to factor' }, ...NS.map(v => h('option', { value: v }, 'N = ' + v)));
        const selA = h('select', { class: 'sel', id: id('a'), 'aria-label': 'Base a' });
        const s1 = h('div', { class: 'status' }), seqCv = canvas('', 'height:170px'), qCv = canvas('', 'height:190px'), s3 = h('div', { class: 'stack', style: 'gap:8px' }), s4 = h('div', { class: 'status' });
        const order = () => { if (gcd(a, N) !== 1) return null; let v = a % N, k = 1; while (v !== 1 && k < 4 * N) { v = (v * a) % N; k++; } return k; };
        const build = () => {
          Q = 2 ** Math.ceil(Math.log2(N * N)); r = order(); ys = [];
          if (r) {
            const M = Math.floor((Q - 1) / r) + 1; dist = new Float64Array(Q);
            for (let y = 0; y < Q; y++) { const t = PI * r * y / Q, s = Math.sin(t); dist[y] = (Math.abs(s) < 1e-12 ? M * M : (Math.sin(M * t) / s) ** 2) / (Q * M); }
          } else dist = null;
        };
        const fillA = () => { selA.innerHTML = ''; for (let v = 2; v < N - 1; v++) selA.append(h('option', { value: v }, `a = ${v}${gcd(v, N) > 1 ? '  (shares a factor)' : ''}`)); if (a >= N - 1) a = 2; selA.value = a; };
        const ps = painter(seqCv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), X = r ? clamp(3 * r + 3, 14, 60) : 20;
          const A = axes(ctx, w, H, { x: [-.5, X + .5], y: [0, N], xt: [...Array(X + 1).keys()].filter(i => i % (X > 30 ? 5 : X > 16 ? 2 : 1) === 0), yt: [0, N], xl: 'x', yl: `${a}ˣ mod ${N}` });
          if (r) for (let j = r; j <= X; j += r) polyline(ctx, [[A.X(j), A.T], [A.X(j), A.B]], T.copper, 1.2, [3, 3]);
          const pts = []; for (let x = 0; x <= X; x++) pts.push([A.X(x), A.Y(modpow(a, x, N))]);
          polyline(ctx, pts, T.line, 1); pts.forEach(p => dot(ctx, p[0], p[1], 3.2, T.cyan));
        });
        const pq = painter(qCv, ({ ctx, w, h: H }) => {
          const T = Theme.get(); if (!dist) { txt(ctx, 'No period to find: a shares a factor with N.', w / 2, H / 2); return; }
          let mx = 0; for (const v of dist) mx = Math.max(mx, v);
          const A = axes(ctx, w, H, { x: [0, Q], y: [0, mx * 1.08], xt: [0, Q / 4, Q / 2, 3 * Q / 4, Q], yt: [0], xl: `measured y (0 to ${Q - 1})`, yl: 'probability' });
          const px = Math.max(1, Math.floor(Q / (A.R - A.L)));
          ctx.fillStyle = T.cyan;
          for (let y = 0; y < Q; y += px) { let v = 0; for (let k = y; k < Math.min(Q, y + px); k++) v = Math.max(v, dist[k]); if (v < mx * 1e-3) continue; const x = A.X(y); ctx.fillRect(x - .5, A.Y(v), Math.max(1.4, (A.R - A.L) / Q), A.B - A.Y(v)); }
          for (const y of ys.slice(-6)) { const x = A.X(y); ctx.fillStyle = T.copper; ctx.beginPath(); ctx.moveTo(x, A.T + 2); ctx.lineTo(x - 6, A.T - 8); ctx.lineTo(x + 6, A.T - 8); ctx.closePath(); ctx.fill(); }
        });
        const convergents = (p, q) => { const out = []; let h1 = 1, h0 = 0, k1 = 0, k0 = 1, x = p, z = q; while (z) { const t = Math.floor(x / z); [x, z] = [z, x - t * z]; const h2 = t * h1 + h0, k2 = t * k1 + k0; out.push([h2, k2]); h0 = h1; h1 = h2; k0 = k1; k1 = k2; } return out; };
        const finish = rr => {
          if (rr % 2) { s4.className = 'status bad'; s4.textContent = `r = ${rr} is odd, so this a does not help. Pick another a.`; return; }
          const half = modpow(a, rr / 2, N);
          if (half === N - 1) { s4.className = 'status bad'; s4.textContent = `${a}^${rr / 2} ≡ −1 (mod ${N}), so the gcds give only trivial factors. Pick another a.`; return; }
          const p = gcd(half - 1, N), q = gcd(half + 1, N), f1 = p > 1 && p < N ? p : q;
          s4.className = 'status good';
          s4.innerHTML = `${a}<sup>${rr / 2}</sup> mod ${N} = ${half}. gcd(${half} − 1, ${N}) = <b>${p}</b> and gcd(${half} + 1, ${N}) = <b>${q}</b>. So <b>${N} = ${f1} × ${N / f1}</b>.`;
        };
        const measure = () => {
          if (!dist) return; let u = Math.random(), y = 0; for (; y < Q - 1; y++) { u -= dist[y]; if (u <= 0) break; } ys.push(y); pq.inv();
          if (y === 0) { s3.innerHTML = `<div class="status">Measured y = 0. That carries no information about r. Measure again.</div>`; s4.className = 'status'; s4.textContent = 'Waiting for a period.'; return; }
          const cf = convergents(y, Q).filter(([, k]) => k > 0 && k < N); let found = null, via = null;
          for (const [hh, k] of cf) { for (let mlt = 1; mlt * k < N && !found; mlt++) if (modpow(a, mlt * k, N) === 1) { found = mlt * k; via = [hh, k]; } if (found) break; }
          s3.innerHTML = `<div class="readout" style="white-space:normal">y = ${y}, &nbsp;y/Q = ${y}/${Q} = ${num(y / Q, 5)}<br>convergents with denominator below ${N}: ${cf.map(([hh, k]) => `${hh}/${k}`).join(', ')}</div>`;
          if (found) { s3.append(h('div', { class: 'status good' }, `${via[0]}/${via[1]} suggests r = ${found}${found !== via[1] ? ' (a multiple of the denominator)' : ''}. Check: ${a}^${found} mod ${N} = 1.`)); finish(found); }
          else { s3.append(h('div', { class: 'status' }, 'No convergent gives a valid period this time. Measure again.')); s4.className = 'status'; s4.textContent = 'Waiting for a period.'; }
        };
        const render = () => {
          build(); const g = gcd(a, N);
          s1.className = 'status' + (g > 1 ? ' good' : '');
          s1.innerHTML = g > 1 ? `gcd(${a}, ${N}) = ${g}. A lucky guess: ${N} = ${g} × ${N / g} without any quantum help.` : `gcd(${a}, ${N}) = 1, so we need the period of ${a}ˣ mod ${N}. Here Q = 2<sup>${Math.log2(Q)}</sup> = ${Q}, the first power of two at least ${N}² = ${N * N}.`;
          s3.innerHTML = '<div class="hint">Press Measure to run the quantum part once.</div>';
          s4.className = 'status'; s4.textContent = g > 1 ? 'Done.' : 'Waiting for a period.';
          ps.inv(); pq.inv();
        };
        selN.addEventListener('change', () => { N = +selN.value; fillA(); a = +selA.value; render(); });
        selA.addEventListener('change', () => { a = +selA.value; render(); });
        const randA = btn('Random a', () => { a = 2 + Math.floor(Math.random() * (N - 3)); selA.value = a; render(); });
        const stepH = (k, t) => h('div', { class: 'sh-step' }, h('span', { class: 'sh-n' }, k), h('span', null, t));
        body.append(h('div', { class: 'btns' }, selN, selA, randA),
          stepH('1', 'Check for a lucky common factor'), s1,
          stepH('2', 'Find the period r. The quantum computer does this; here the sequence is shown in full so you can see the repetition.'), seqCv,
          h('div', { class: 'split wide-l' }, qCv, h('div', { class: 'stack' }, btn('Measure the first register', measure, 'pri'), s3)),
          stepH('3', 'Turn the period into factors'), s4);
        selN.value = N; fillA(); render();
      }
    }
  },
  take: ['Factoring N reduces to finding the period r of aˣ mod N.',
    'With r even and a^{r/2} ≢ −1, gcd(a^{r/2} ± 1, N) gives the factors.',
    'The quantum part prepares a periodic state, applies the QFT, and measures y ≈ j·Q/r; continued fractions recover r.',
    'Breaking RSA-2048 needs on the order of a million noisy physical qubits under current estimates.'],
  quiz: [
    { q: 'N = 15, a = 7. The sequence 7ˣ mod 15 is 1, 7, 4, 13, 1, … What is r?', o: ['2', '3', '4', '7'], a: 2, why: 'The sequence returns to 1 after 4 steps.' },
    { q: 'With r = 4, what are gcd(7² − 1, 15) and gcd(7² + 1, 15)?', o: ['1 and 15', '3 and 5', '2 and 7', '5 and 3'], a: 1, why: '7² − 1 = 48 shares 3 with 15; 7² + 1 = 50 shares 5. So 15 = 3 × 5.' }
  ]
});

/* ---------------- Lesson 16 · Variational algorithms ---------------- */
LESSONS.push({
  id: 'variational', n: 16, stage: 3, minutes: 11, title: 'Variational algorithms',
  lede: 'Today’s noisy machines cannot run long algorithms. Variational methods use short circuits with adjustable knobs and let a classical optimizer turn the knobs.',
  html: `
<h2>The hybrid loop</h2>
<ol>
<li>Prepare a short <strong>parameterized circuit</strong>, called an ansatz, ${m('|ψ(θ)⟩ = U(θ)|0⟩')}.</li>
<li>Measure the average value of a cost, usually an energy ${m('E(θ) = ⟨ψ(θ)|H|ψ(θ)⟩')} for some Hamiltonian ${m('H')}.</li>
<li>A classical optimizer proposes better parameters.</li>
<li>Repeat until the cost stops improving.</li>
</ol>
<p>The <strong>variational principle</strong> guarantees that ${m('E(θ)')} can never be lower than the true ground-state energy, so pushing it down pushes the state toward the ground state. This is the variational quantum eigensolver, VQE, aimed at chemistry and materials. QAOA, the quantum approximate optimization algorithm, uses the same loop for combinatorial problems, with a circuit structure taken from the problem.</p>
<h2>Gradients from the circuit itself</h2>
<p>For gates of the form ${m('e<sup>−iθP/2</sup>')}, where ${m('P')} is a Pauli operator, the exact derivative can be measured on the same hardware by running the circuit twice with shifted parameters. This is the <strong>parameter-shift rule</strong>:</p>
${EQ('∂E/∂θ = [ E(θ + π/2) − E(θ − π/2) ] / 2')}
<p>In the lab the Hamiltonian is ${m('H = a·Z + b·X + c·Y')} on one qubit, and the ansatz is ${m('R<sub>z</sub>(φ)R<sub>y</sub>(θ)|0⟩')}. The map shows the energy for every pair of parameters. Gradient descent, using parameter-shift gradients estimated from a finite number of shots, walks downhill toward the ground state.</p>
${LAB('vqe')}
<h2>The hard parts</h2>
<ul>
<li><strong>Shot noise.</strong> Every energy is a statistical estimate, so every gradient is noisy. Lower the shot count in the lab and watch the path wander.</li>
<li><strong>Barren plateaus.</strong> For many deep or random-looking circuits, gradients shrink exponentially with the number of qubits. The landscape becomes flat almost everywhere and the optimizer has nothing to follow.</li>
<li><strong>Hardware noise</strong> biases the measured energies and can hide the minimum.</li>
<li><strong>Classical competition.</strong> For many molecules and optimization problems, good classical methods already exist. Whether variational algorithms will give a practical advantage is still an open question.</li>
</ul>
`,
  labs: {
    vqe: {
      title: 'Walking down an energy landscape',
      cap: 'Map: blue is low energy, copper is high. The ring marks the true ground state. The sphere shows the current trial state and, as a dashed ring, the ground state it is heading for. Shots apply to each of the X, Y and Z measurements in every energy estimate.',
      build(body, id) {
        let A = 1, B = .7, Cc = 0, th = 2.5, ph = 2.3, lr = .35, lgS = 2.5, run = false, it = 0; let traj = [], Es = [], heat = null;
        const E = (t, p) => A * Math.cos(t) + Math.sin(t) * (B * Math.cos(p) + Cc * Math.sin(p));
        const Emax = () => Math.hypot(A, B, Cc) || 1;
        const shots = () => lgS >= 4.4 ? Infinity : Math.round(Math.pow(10, lgS));
        const est = (t, p) => {
          const S = shots(), v = fromAngles(t, p); if (S === Infinity) return E(t, p);
          const noisy = x => clamp(x + Math.sqrt(Math.max(0, 1 - x * x) / S) * randn(), -1, 1);
          return A * noisy(v[2]) + B * noisy(v[0]) + Cc * noisy(v[1]);
        };
        const norm = () => { if (th < 0) { th = -th; ph += PI; } if (th > PI) { th = TAU - th; ph += PI; } ph = ((ph % TAU) + TAU) % TAU; };
        const step = () => {
          const gt = (est(th + PI / 2, ph) - est(th - PI / 2, ph)) / 2, gp = (est(th, ph + PI / 2) - est(th, ph - PI / 2)) / 2;
          th -= lr * gt; ph -= lr * gp; norm(); it++; traj.push([th, ph]); Es.push([it, E(th, ph), est(th, ph)]); if (traj.length > 400) traj.shift(); upd();
        };
        const map = canvas('', 'height:260px'), cv = canvas('sq', 'max-width:250px;margin:0 auto'), ech = canvas('', 'height:160px'), stat = h('div', { class: 'chipline' });
        const bv = new BlochView(cv, { trail: false });
        const ground = () => { const e = Emax(); return [-B / e, -Cc / e, -A / e]; };
        const pm = painter(map, ({ ctx, w, h: H }) => {
          const T = Theme.get(), L = 46, R = w - 10, Tp = 10, Bt = H - 30;
          if (!heat || heat.key !== [A, B, Cc, T.dark, Math.round(R - L), Math.round(Bt - Tp)].join()) {
            const gw = Math.max(40, Math.round((R - L) / 3)), gh = Math.max(20, Math.round((Bt - Tp) / 3)), off = document.createElement('canvas'); off.width = gw; off.height = gh;
            const ox = off.getContext('2d'), img = ox.createImageData(gw, gh), lo = rgbOf(T.cyan), mid = rgbOf(T.surface2), hi = rgbOf(T.copper), em = Emax();
            for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
              const t = (j + .5) / gh * PI, p = (i + .5) / gw * TAU, u = (E(t, p) / em + 1) / 2, k = (j * gw + i) * 4;
              const c0 = u < .5 ? lo : mid, c1 = u < .5 ? mid : hi, f = u < .5 ? u * 2 : (u - .5) * 2;
              img.data[k] = c0[0] + (c1[0] - c0[0]) * f; img.data[k + 1] = c0[1] + (c1[1] - c0[1]) * f; img.data[k + 2] = c0[2] + (c1[2] - c0[2]) * f; img.data[k + 3] = 255;
            }
            ox.putImageData(img, 0, 0); heat = { key: [A, B, Cc, T.dark, Math.round(R - L), Math.round(Bt - Tp)].join(), off };
          }
          ctx.imageSmoothingEnabled = true; ctx.drawImage(heat.off, L, Tp, R - L, Bt - Tp);
          const X = p => L + p / TAU * (R - L), Y = t => Tp + t / PI * (Bt - Tp);
          txt(ctx, '0', L, Bt + 12); txt(ctx, 'π', (L + R) / 2, Bt + 12); txt(ctx, '2π', R, Bt + 12, { align: 'right' }); txt(ctx, 'φ', R - 30, Bt + 12, { color: T.ink });
          txt(ctx, '0', L - 8, Tp + 6, { align: 'right' }); txt(ctx, 'π', L - 8, Bt - 4, { align: 'right' }); txt(ctx, 'θ', L - 8, (Tp + Bt) / 2, { align: 'right', color: T.ink });
          const g = anglesOf(ground()), gph = ((g.ph % TAU) + TAU) % TAU; ctx.strokeStyle = T.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(gph), Y(g.th), 8, 0, TAU); ctx.stroke();
          ctx.strokeStyle = T.ink; ctx.lineWidth = 1.6; ctx.beginPath(); let prev = null;
          for (const [t, p] of traj) { const x = X(p), y = Y(t); if (!prev || Math.abs(prev[1] - p) > PI) ctx.moveTo(x, y); else ctx.lineTo(x, y); prev = [t, p]; }
          ctx.stroke(); dot(ctx, X(ph), Y(th), 6, T.copper, T.surface);
        });
        const pe = painter(ech, ({ ctx, w, h: H }) => {
          const T = Theme.get(), em = Emax(), K = Math.max(20, it), A_ = axes(ctx, w, H, { x: [0, K], y: [-em * 1.05, em * 1.05], xt: [0, Math.round(K / 2), K], yt: [-em, 0, em], yf: v => num(v, 2), xl: 'iteration', yl: 'energy' });
          polyline(ctx, [[A_.L, A_.Y(-em)], [A_.R, A_.Y(-em)]], T.copper, 1.5, [5, 4]);
          txt(ctx, 'ground energy', A_.R - 4, A_.Y(-em) - 9, { align: 'right', color: T.copper, font: '600 10.5px "JetBrains Mono",monospace' });
          const pts = [[A_.X(0), A_.Y(Es.length ? Es[0][1] : E(th, ph))]]; ctx.fillStyle = rgba(T.muted, .6);
          for (const [i, e, es] of Es) { pts.push([A_.X(i), A_.Y(e)]); ctx.fillRect(A_.X(i) - 1.5, A_.Y(clamp(es, -em * 1.05, em * 1.05)) - 1.5, 3, 3); }
          polyline(ctx, pts, T.cyan, 2);
        });
        const upd = () => {
          bv.go(fromAngles(th, ph), 120); bv.target = ground(); bv.inv(); pm.inv(); pe.inv();
          stat.innerHTML = `<span>iteration <b>${it}</b></span><span>energy <b>${num(E(th, ph), 3)}</b></span><span>ground energy <b>${num(-Emax(), 3)}</b></span><span>θ, φ <b>${num(deg(th), 0)}°, ${num(deg(ph), 0)}°</b></span>`;
        };
        const restart = (rand) => { if (rand) { th = .3 + Math.random() * 2.6; ph = Math.random() * TAU; } it = 0; traj = [[th, ph]]; Es = []; upd(); };
        Scope.every(130, () => { if (run) step(); });
        const runB = btn('Run', () => { run = !run; runB.textContent = run ? 'Pause' : 'Run'; }, 'pri');
        const hs = (k, l, v) => slider({ id: id(k), label: l, min: -1, max: 1, step: .05, value: v, fmt: x => num(x, 2), on: x => { if (k === 'a') A = x; else if (k === 'b') B = x; else Cc = x; heat = null; restart(false); } });
        body.append(h('div', { class: 'split wide-l' },
          h('div', { class: 'stack' }, map, ech, stat),
          h('div', { class: 'stack' }, cv,
            h('div', { class: 'btns' }, runB, btn('Step', step), btn('New random start', () => restart(true))),
            slider({ id: id('lr'), label: 'Learning rate', min: .05, max: 1, step: .05, value: lr, fmt: x => num(x, 2), on: x => { lr = x; } }),
            slider({ id: id('shots'), label: 'Shots per estimate', min: 1, max: 4.4, step: .1, value: lgS, fmt: x => x >= 4.4 ? 'exact' : Math.round(Math.pow(10, x)).toLocaleString('en-US'), on: x => { lgS = x; } }),
            h('div', { class: 'ctl-label' }, 'Hamiltonian H = a·Z + b·X + c·Y'), hs('a', 'a (Z)', A), hs('b', 'b (X)', B), hs('c', 'c (Y)', Cc))));
        restart(false);
      }
    }
  },
  take: ['Variational algorithms pair a short parameterized circuit with a classical optimizer.',
    'The measured energy is never below the true ground energy (apart from estimation error).',
    'The parameter-shift rule measures exact gradients from two shifted circuits.',
    'Shot noise, barren plateaus and hardware noise make training hard.'],
  quiz: [
    { q: 'Can a correctly measured VQE energy fall below the true ground-state energy?', o: ['Yes, often', 'Only through statistical or hardware error', 'Only for large molecules', 'Only with QAOA'], a: 1, why: 'The variational principle says ⟨ψ|H|ψ⟩ is at least the ground energy for every state; only estimation error can make a measurement dip below it.' },
    { q: 'The parameter-shift rule evaluates the energy at which parameter values?', o: ['θ ± π/2', 'θ ± 0.001', 'θ and 2θ', 'θ ± π'], a: 0, why: 'For rotations generated by a Pauli operator, ∂E/∂θ = [E(θ + π/2) − E(θ − π/2)]/2 exactly.' }
  ]
});

})();
