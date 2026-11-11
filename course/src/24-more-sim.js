/* =====================================================================
   Research track · simulation methods:
   Schrödinger versus Feynman simulation, exact diagonalization
   ===================================================================== */
(() => {
const SIM = 7;

/* ---------- Feynman path enumeration for small circuits ---------- */
/* gates: {g:'H'|'X'|'Z'|'S'|'T'|'P', q, phi} | {g:'CX', c, t} | {g:'CZ', a, b}; qubit 0 is the leftmost bit of a ket */
function feynmanPaths(n, gates, input) {
  let paths = [{ s: [input], re: 1, im: 0 }];
  for (const g of gates) {
    const nx = [];
    for (const p of paths) {
      const s = p.s[p.s.length - 1], msk = q => 1 << (n - 1 - q), bit = q => (s >> (n - 1 - q)) & 1;
      const push = (s2, fr, fi) => nx.push({ s: p.s.concat([s2]), re: p.re * fr - p.im * fi, im: p.re * fi + p.im * fr });
      if (g.g === 'H') { push(s & ~msk(g.q), S2, 0); push(s | msk(g.q), bit(g.q) ? -S2 : S2, 0); }
      else if (g.g === 'X') push(s ^ msk(g.q), 1, 0);
      else if (g.g === 'Z') push(s, bit(g.q) ? -1 : 1, 0);
      else if (g.g === 'S') push(s, bit(g.q) ? 0 : 1, bit(g.q) ? 1 : 0);
      else if (g.g === 'T') push(s, bit(g.q) ? S2 : 1, bit(g.q) ? S2 : 0);
      else if (g.g === 'P') push(s, bit(g.q) ? Math.cos(g.phi) : 1, bit(g.q) ? Math.sin(g.phi) : 0);
      else if (g.g === 'CX') push(bit(g.c) ? s ^ msk(g.t) : s, 1, 0);
      else if (g.g === 'CZ') push(s, bit(g.a) && bit(g.b) ? -1 : 1, 0);
    }
    paths = nx;
  }
  return paths;
}
const gateName = g => g.g === 'CX' ? `CX${sub2(g.c)}${sub2(g.t)}` : g.g === 'CZ' ? `CZ${sub2(g.a)}${sub2(g.b)}` : (g.g === 'P' ? 'P' : g.g) + sub2(g.q);
const sub2 = k => '₀₁₂₃₄₅₆₇₈₉'[k];

LESSONS.push({
  id: 'pathsum', n: 31.8, stage: SIM, minutes: 16, title: 'Schrödinger, Feynman and the cost of simulating circuits',
  lede: 'A classical computer can simulate a circuit in two classic ways: store the entire state, or add up the contributions of every path through the circuit. One costs memory, the other costs time, and every serious simulator mixes the two.',
  html: `
<h2>Two ways to get an amplitude</h2>
<p>The obvious way to simulate ${m('n')} qubits is the <strong>Schrödinger</strong> method: keep all ${m('2ⁿ')} amplitudes in memory and update them gate by gate. Each gate touches every amplitude once, so ${m('g')} gates cost about ${m('g · 2ⁿ')} operations, and the memory is ${m('16 · 2ⁿ')} bytes in double precision. That is 16 GB at 30 qubits and 18 petabytes at 50.</p>
<p>The <strong>Feynman</strong> method writes one amplitude as a sum over intermediate basis states, inserting a complete set of states between every pair of gates:</p>
${EQ('⟨x|U<sub>g</sub> ⋯ U₂U₁|0⟩ = Σ<sub>s₁, …, s<sub>g−1</sub></sub> ⟨x|U<sub>g</sub>|s<sub>g−1</sub>⟩ ⋯ ⟨s₂|U₂|s₁⟩⟨s₁|U₁|0⟩')}
<p>Most terms vanish. A gate that only permutes basis states or multiplies them by phases, such as X, CNOT, Toffoli, Z, S, T and CZ, sends each basis state to exactly one other, so it does not branch. A Hadamard sends ${m('|0⟩')} to both ${m('|0⟩')} and ${m('|1⟩')}, so every Hadamard doubles the number of paths. With ${m('h')} branching gates there are ${m('2ʰ')} paths, and each one needs only ${m('n')} bits of memory to follow. The amplitude is the sum of their contributions, which for circuits of Hadamards and phase gates is</p>
${EQ('⟨x|U|0⟩ = 2<sup>−h/2</sup> Σ<sub>paths ending at x</sub> e<sup>iφ(path)</sup>')}
<p>This is Feynman’s rule of arrows from [[L:interference]], made literal: interference is cancellation between paths. The lab draws every path through a small circuit. Pick an output on the right and its paths light up, coloured by phase; on the far right their arrows are laid head to tail, and the arrow from start to finish is the amplitude.</p>
${LAB('paths')}
<h2>Why exact path sums are hard</h2>
<p>For Hadamard, phase and Toffoli gates, which together are universal, every path contributes a term of the same size, so an amplitude is a count: the number of paths with one phase minus the number with another, divided by ${m('2<sup>h/2</sup>')}. Dawson and colleagues (2005) showed that this turns amplitudes into counting solutions of polynomial equations over ${m('ℤ₂')}. Counting problems of this kind are #P-hard, which is a precise sense in which computing amplitudes exactly is believed to be intractable classically, even though each path is trivial to follow.</p>
<h2>Mixing the two</h2>
<p>Memory and time can be traded against each other. In the <strong>Schrödinger–Feynman hybrid</strong> (Aaronson and Chen, 2017; Markov and colleagues, 2018), the qubits are split into two halves. A two-qubit gate across the cut is written as a sum of products, for example</p>
${EQ('CZ = |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ Z')}
<p>so each crossing gate doubles the number of terms. Each term is simulated as two separate state vectors of ${m('n/2')} qubits. With ${m('c')} crossing gates the cost is about ${m('2ᶜ')} runs, each needing only ${m('2 · 2<sup>n/2</sup>')} amplitudes of memory. Google used simulators of this kind, alongside tensor-network methods, to estimate the classical cost of its 2019 random-circuit experiment, and tensor-network contraction ([[L:tensornet]]) generalizes the idea to arbitrary cuts.</p>
<h2>Paying only for magic</h2>
<p>Clifford circuits are simulable in polynomial time ([[L:stabsim]]), so the cost of a near-Clifford circuit should depend on its non-Clifford gates. <strong>Stabilizer-rank</strong> methods make that precise. Each T gate can be implemented by consuming the magic state ${m('|T⟩ = (|0⟩ + e<sup>iπ/4</sup>|1⟩)/√2')}, and ${m('|T⟩<sup>⊗t</sup>')} can be written as a sum of ${m('χ')} stabilizer states. Each term is simulated by Gottesman–Knill and the results are added. Trivially ${m('χ ≤ 2ᵗ')}; Bravyi, Smith and Smolin (2016) found decompositions with ${m('χ ≈ 2<sup>0.47t</sup>')}, and Bravyi and Gosset (2016) showed that approximate simulation needs only about ${m('2<sup>0.23t</sup>')} terms. Circuits with hundreds of qubits but a few dozen T gates are within reach.</p>
${LAB('cost')}
${NOTE('Choosing a method', `<p>Each method is exponential in a different resource: qubits (state vector), branching gates (path sums), gates across a cut (hybrids), entanglement (tensor networks, [[L:tensornet]]), or non-Clifford gates (stabilizer rank). A claim of quantum advantage has to beat all of them at once, which is why such claims are usually followed by improved classical algorithms that target whichever resource the experiment was short on.</p>`)}
`,
  labs: {
    paths: {
      title: 'Every path through a circuit',
      cap: 'Columns are the moments between gates and rows are basis states. Every path starts at |0…0⟩ and doubles at each Hadamard. Grey lines are all paths; the highlighted ones end at the output you choose (click a row, or a bar below), coloured by the phase of their contribution. The right panel lays those contributions head to tail: their sum is the amplitude, and the bars show the resulting probabilities, which match an ordinary state-vector simulation.',
      build(body, id) {
        let preset = 'bv', phi = PI / 2, gates = [], n = 3, paths = [], sel = 0, reveal = 0, rgates = null;
        const circ = h('div', { class: 'circ-wrap' }), cv = canvas('', 'height:270px'), ph = canvas('sq', 'max-width:300px;margin:0 auto'), barsEl = h('div'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        let sb = null;
        const randomCircuit = () => {
          const rnd = Math.random, gs = [{ g: 'H', q: 0 }, { g: 'H', q: 1 }, { g: 'H', q: 2 }], slots = shuffled([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3);
          for (let k = 0; k < 9; k++) {
            if (slots.includes(k)) { gs.push({ g: 'H', q: Math.floor(rnd() * 3) }); continue; }
            const r = rnd(), a = Math.floor(rnd() * 3), b = (a + 1 + Math.floor(rnd() * 2)) % 3;
            gs.push(r < .35 ? { g: 'T', q: a } : r < .55 ? { g: 'S', q: a } : r < .8 ? { g: 'CZ', a: Math.min(a, b), b: Math.max(a, b) } : { g: 'CX', c: a, t: b });
          }
          return gs;
        };
        const setup = () => {
          if (preset === 'hh') { n = 1; gates = [{ g: 'H', q: 0 }, { g: 'H', q: 0 }]; }
          else if (preset === 'phase') { n = 1; gates = [{ g: 'H', q: 0 }, { g: 'P', q: 0, phi }, { g: 'H', q: 0 }]; }
          else if (preset === 'bv') { n = 3; gates = [{ g: 'H', q: 0 }, { g: 'H', q: 1 }, { g: 'H', q: 2 }, { g: 'Z', q: 0 }, { g: 'Z', q: 2 }, { g: 'H', q: 0 }, { g: 'H', q: 1 }, { g: 'H', q: 2 }]; }
          else if (preset === 'ghz') { n = 3; gates = [{ g: 'H', q: 0 }, { g: 'CX', c: 0, t: 1 }, { g: 'CX', c: 1, t: 2 }]; }
          else { n = 3; if (!rgates) rgates = randomCircuit(); gates = rgates; }
          paths = feynmanPaths(n, gates, 0);
          circ.innerHTML = '';
          circ.append(drawCircuit(n, gates.map(g => [g.g === 'P' ? { g: 'P(φ)', q: g.q } : g]), { cw: 48, labels: [...Array(n)].map((_, i) => 'q' + i) }).svg);
          cv.style.height = (n === 1 ? 170 : 290) + 'px';
          barsEl.innerHTML = ''; const be = h('div'); barsEl.append(be); sb = stateBars(be, n, { height: 110 });
          const amp = amps(); let best = 0; for (let x = 1; x < (1 << n); x++) if (amp.p[x] > amp.p[best] + 1e-9) best = x;
          if (preset !== 'phase' || sel >= (1 << n)) sel = best;
          sb.state(amp.re, amp.im);
          hookBars(); restart();
        };
        const amps = () => { const N = 1 << n, re = new Float64Array(N), im = new Float64Array(N), p = new Float64Array(N); for (const pa of paths) { const x = pa.s[pa.s.length - 1]; re[x] += pa.re; im[x] += pa.im; } for (let x = 0; x < N; x++) p[x] = re[x] * re[x] + im[x] * im[x]; return { re, im, p }; };
        const hookBars = () => { barsEl.querySelectorAll('.b-col').forEach((col, x) => { col.style.cursor = 'pointer'; col.addEventListener('click', () => { sel = x; restart(); }); }); };
        const mine = () => paths.filter(pa => pa.s[pa.s.length - 1] === sel);
        const restart = () => { reveal = reduced() ? 1e9 : 0; p.inv(); pp.inv(); text(); };
        const text = () => {
          const my = mine(), sre = my.reduce((s, pa) => s + pa.re, 0), sim = my.reduce((s, pa) => s + pa.im, 0), pr = sre * sre + sim * sim, hb = gates.filter(g => g.g === 'H').length;
          ro.innerHTML = `<span class="k">branching gates </span>${hb} &nbsp; <span class="k">paths </span>2${sup(hb)} = ${paths.length}<br><span class="k">ending at ${ket(sel, n)} </span>${my.length}, each of size 2<sup>−h/2</sup> = ${num(Math.pow(2, -hb / 2), 3)}<br><span class="k">their sum </span>${cfmt(sre, sim, 3)} &nbsp; <span class="k">probability </span>${pct(pr, 1)}`;
        };
        Scope.tick(() => { const tot = mine().length; if (reveal < tot) { reveal = Math.min(tot, reveal + Math.max(.12, tot / 70)); pp.inv(); } });
        const geom = (w, H) => { const L0 = n === 1 ? 46 : 58, R0 = 16, top = 26, bot = 10, N = 1 << n, L = gates.length, X = k => L0 + k * (w - L0 - R0) / L, Y = r => top + (r + .5) * (H - top - bot) / N; return { L0, R0, top, bot, N, L, X, Y }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), G = geom(w, H);
          ctx.lineWidth = 1;
          for (let r = 0; r < G.N; r++) { ctx.strokeStyle = r === sel ? T.copper : T.line; ctx.globalAlpha = r === sel ? .5 : .7; ctx.beginPath(); ctx.moveTo(G.X(0), G.Y(r)); ctx.lineTo(G.X(G.L), G.Y(r)); ctx.stroke(); ctx.globalAlpha = 1; txt(ctx, ket(r, n), G.L0 - 8, G.Y(r), { align: 'right', font: MATHFONT(n === 1 ? 15 : 13), color: r === sel ? T.copper : T.ink }); }
          gates.forEach((g, k) => txt(ctx, gateName(g), (G.X(k) + G.X(k + 1)) / 2, 11, { font: '600 10.5px "JetBrains Mono",monospace', color: g.g === 'H' ? T.copper : T.muted }));
          const draw = (pa, col, lw, al) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.globalAlpha = al; ctx.beginPath(); pa.s.forEach((s, k) => k ? ctx.lineTo(G.X(k), G.Y(s)) : ctx.moveTo(G.X(k), G.Y(s))); ctx.stroke(); ctx.globalAlpha = 1; };
          for (const pa of paths) draw(pa, T.muted, 1, paths.length > 16 ? .22 : .4);
          for (const pa of mine()) draw(pa, phaseColor(Math.atan2(pa.im, pa.re)), 2.2, .9);
          const seen = new Set(); for (const pa of paths) pa.s.forEach((s, k) => { const key = k * 64 + s; if (seen.has(key)) return; seen.add(key); dot(ctx, G.X(k), G.Y(s), 2.6, T.ink); });
          dot(ctx, G.X(G.L), G.Y(sel), 5, T.copper, T.surface);
        });
        cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), G = geom(r.width, r.height); let best = 0, bd = 1e9; for (let s = 0; s < G.N; s++) { const d = Math.abs(e.clientY - r.top - G.Y(s)); if (d < bd) { bd = d; best = s; } } sel = best; restart(); });
        cv.style.cursor = 'pointer';
        const pp = painter(ph, ({ ctx, w, h: H }) => {
          const T = Theme.get(), my = mine(), k = Math.min(my.length, Math.floor(reveal + 1e-9));
          const pts = [[0, 0]]; for (const pa of my) { const [x, y] = pts[pts.length - 1]; pts.push([x + pa.re, y + pa.im]); }
          let x0 = -.15, x1 = .15, y0 = -.15, y1 = .15; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
          const span = Math.max(x1 - x0, y1 - y0) * 1.25, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, sc = Math.min(w, H - 36) / span, PX = x => w / 2 + (x - cx) * sc, PY = y => (H - 24) / 2 - (y - cy) * sc;
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, PY(0)); ctx.lineTo(w, PY(0)); ctx.moveTo(PX(0), 0); ctx.lineTo(PX(0), H - 30); ctx.stroke();
          txt(ctx, 'Re', w - 10, PY(0) - 9, { font: '500 10px "JetBrains Mono",monospace' }); txt(ctx, 'Im', PX(0) + 12, 9, { font: '500 10px "JetBrains Mono",monospace' });
          for (let i = 0; i < k; i++) { const pa = my[i]; arrow(ctx, PX(pts[i][0]), PY(pts[i][1]), PX(pts[i + 1][0]), PY(pts[i + 1][1]), phaseColor(Math.atan2(pa.im, pa.re)), 2.2, 8); }
          if (k >= my.length && my.length) { const [fx, fy] = pts[pts.length - 1]; if (Math.hypot(fx, fy) > 1e-6) arrow(ctx, PX(0), PY(0), PX(fx), PY(fy), T.copper, 3.4, 12); else dot(ctx, PX(0), PY(0), 5, T.copper, T.surface); }
          dot(ctx, PX(0), PY(0), 3, T.ink);
          txt(ctx, `${my.length} arrows → amplitude of ${ket(sel, n)}`, w / 2, H - 9, { font: '500 11px "JetBrains Mono",monospace' });
        });
        const phiSl = slider({ id: id('phi'), label: 'Phase φ between the Hadamards', min: 0, max: TAU, step: .01, value: phi, fmt: v => num(deg(v), 0) + '°', on: v => { phi = v; setup(); } });
        const newB = btn('New random circuit', () => { rgates = randomCircuit(); setup(); }, 'sm');
        const vis = () => { phiSl.hidden = preset !== 'phase'; newB.hidden = preset !== 'rand'; };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'hh', label: 'H then H' }, { v: 'phase', label: 'H, phase, H' }, { v: 'ghz', label: 'GHZ' }, { v: 'bv', label: 'Bernstein–Vazirani' }, { v: 'rand', label: 'Random H, T, CZ' }], preset, v => { preset = v; vis(); setup(); }, 'Circuit'), newB),
          circ, h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, barsEl), h('div', { class: 'stack' }, ph, phiSl, ro)));
        vis(); setup();
      }
    },
    cost: {
      title: 'Memory against time',
      cap: 'Rough cost models for computing amplitudes of one circuit: state vector (16·2ⁿ bytes, g·2ⁿ operations), Feynman paths (a few bytes per gate, g·2ʰ operations for h branching gates), the Schrödinger–Feynman hybrid (2·16·2^(n/2) bytes, g·2^(c+n/2) operations for c gates across the cut) and approximate stabilizer-rank simulation (about n² bytes, g·n²·2^(0.23t) operations for t non-Clifford gates). The shaded box is what a laptop can do in a day; the dashed lines are roughly what the largest supercomputers can do in a day. Constants are crude; the exponents are what matter.',
      build(body, id) {
        const P = { wide: { n: 60, g: 600, hb: 300, c: 14, t: 300 }, deep: { n: 30, g: 20000, hb: 9000, c: 1500, t: 9000 }, clif: { n: 120, g: 8000, hb: 3000, c: 400, t: 40 }, small: { n: 24, g: 240, hb: 100, c: 10, t: 80 } };
        let S = Object.assign({}, P.wide), pre = 'wide';
        const L2 = Math.log10(2);
        const methods = () => [
          { k: 'State vector', mem: Math.log10(16) + S.n * L2, time: Math.log10(S.g) + S.n * L2, col: 'copper' },
          { k: 'Feynman paths', mem: Math.log10(8 * (S.n + S.g)), time: Math.log10(S.g) + S.hb * L2, col: 'muted' },
          { k: 'S–F hybrid', mem: Math.log10(32) + S.n / 2 * L2, time: Math.log10(S.g) + (S.c + S.n / 2) * L2, col: 'cyan' },
          { k: 'Stabilizer rank', mem: Math.log10(S.n * S.n / 4 + 64), time: Math.log10(S.g * S.n * S.n) + .23 * S.t * L2, col: 'ink' }
        ];
        const cv = canvas('', 'height:300px'), tbl = h('div', { class: 'scroll-x' });
        const XM = 26, YM = 44;
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, XM], y: [0, YM], xt: [0, 4, 8, 12, 16, 20, 24], yt: [0, 10, 20, 30, 40], xf: v => '10' + sup(v), yf: v => '10' + sup(v), xl: 'memory (bytes)', yl: 'operations' });
          ctx.fillStyle = rgba(T.cyan, .1); ctx.fillRect(A.L, A.Y(14), A.X(10.2) - A.L, A.B - A.Y(14));
          ctx.strokeStyle = T.cyan; ctx.globalAlpha = .7; ctx.lineWidth = 1.2; ctx.strokeRect(A.L + .5, A.Y(14) + .5, A.X(10.2) - A.L, A.B - A.Y(14)); ctx.globalAlpha = 1;
          txt(ctx, 'laptop, one day', A.L + 6, A.Y(14) + 11, { align: 'left', font: '600 10px "JetBrains Mono",monospace', color: T.cyan });
          ctx.setLineDash([5, 4]); ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.moveTo(A.X(16), A.T); ctx.lineTo(A.X(16), A.B); ctx.moveTo(A.L, A.Y(23)); ctx.lineTo(A.R, A.Y(23)); ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, '~10 PB', A.X(16) + 4, A.T + 22, { align: 'left', font: '500 10px "JetBrains Mono",monospace' }); txt(ctx, 'exascale, one day', A.X(16) - 6, A.Y(23) - 9, { align: 'right', font: '500 10px "JetBrains Mono",monospace' });
          const ms = methods();
          ms.forEach((m_, i) => {
            const off = m_.time > YM, x = A.X(clamp(m_.mem, 0, XM)), y = A.Y(clamp(m_.time, 0, YM)), col = T[m_.col];
            if (off) { arrow(ctx, x, A.T + 26, x, A.T + 4, col, 2.2, 8); } else dot(ctx, x, y, 7, col, T.surface);
            const right = x < w - 130;
            txt(ctx, m_.k + (off ? ' (off chart)' : ''), right ? x + 11 : x - 11, (off ? A.T + 22 : y) + (i % 2 ? 11 : -11), { align: right ? 'left' : 'right', font: '600 11px "JetBrains Mono",monospace', color: col });
          });
        });
        const verdict = m_ => m_.mem <= 10.2 && m_.time <= 14 ? ['laptop, a day', 'good'] : m_.mem <= 16 && m_.time <= 23 ? ['supercomputer', ''] : ['out of reach', 'err'];
        const fmtE = e => e > 300 ? '10' + sup(Math.round(e)) : e < 3 ? String(Math.round(10 ** e)) : '10' + sup(Math.round(e));
        const upd = () => {
          p.inv();
          tbl.innerHTML = `<table class="mini-tbl"><tr><th>method</th><th>memory</th><th>operations</th><th>verdict</th></tr>${methods().map(m_ => { const [v, cl] = verdict(m_); return `<tr><td style="text-align:left">${m_.k}</td><td>${fmtE(m_.mem)} B</td><td>${fmtE(m_.time)}</td><td class="${cl === 'err' ? 'err' : ''}" style="${cl === 'good' ? 'color:var(--good);font-weight:700' : ''}">${v}</td></tr>`; }).join('')}</table>`;
        };
        const sl = {};
        const mk = (k, label, min, max, step, log) => sl[k] = slider({ id: id(k), label, min, max, step, value: log ? Math.log10(S[k]) : S[k], fmt: v => (log ? Math.round(10 ** v) : v).toLocaleString('en-US'), on: v => { S[k] = log ? Math.round(10 ** v) : v; preSeg.set(null); upd(); } });
        const preSeg = seg([{ v: 'wide', label: 'Wide and shallow' }, { v: 'deep', label: 'Narrow and deep' }, { v: 'clif', label: 'Nearly Clifford' }, { v: 'small', label: 'Small' }], pre, v => { S = Object.assign({}, P[v]); for (const k of ['n', 'hb', 'c', 't']) sl[k].set(S[k]); sl.g.set(Math.log10(S.g)); upd(); }, 'Example circuit');
        body.append(h('div', { class: 'btns' }, preSeg),
          h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, tbl),
            h('div', { class: 'stack' }, mk('n', 'Qubits n', 4, 150, 1), mk('g', 'Total gates g', 1, 5, null, true), mk('hb', 'Branching gates h (e.g. Hadamards)', 0, 10000, 10), mk('c', 'Two-qubit gates across the cut c', 0, 2000, 2), mk('t', 'Non-Clifford gates t', 0, 10000, 5))));
        upd();
      }
    }
  },
  take: ['Schrödinger simulation stores all 2ⁿ amplitudes: memory and time both grow as 2ⁿ.',
    'Feynman simulation sums over paths: tiny memory, but every branching gate such as a Hadamard doubles the number of paths, so time grows as 2ʰ.',
    'Interference is cancellation between path contributions; exact amplitudes are counting problems that are #P-hard in general.',
    'Hybrids trade memory for time (cuts across the qubits), and stabilizer-rank methods pay only for non-Clifford gates, about 2^(0.23t) for approximate simulation.'],
  quiz: QZ([
    ['How much memory does a double-precision state vector of 40 qubits need?', ['About 40 kilobytes', 'About 16 terabytes (16 bytes × 2⁴⁰)', 'About 16 gigabytes', 'About 16 megabytes'], 1, 'Each complex amplitude takes 16 bytes and there are 2⁴⁰ ≈ 1.1 × 10¹² of them, about 17.6 TB.'],
    ['Which gate makes the number of Feynman paths double?', ['CNOT', 'A Hadamard, which sends a basis state to a superposition of two basis states', 'A T gate', 'A CZ gate'], 1, 'Permutation and diagonal gates map each basis state to one basis state (with a phase); a Hadamard branches it into two.'],
    ['Why does a T gate not add paths?', ['It is not a quantum gate', 'It is diagonal: it multiplies |1⟩ by a phase and leaves each basis state as a single basis state', 'It is the same as a Hadamard', 'It removes paths'], 1, 'Diagonal gates only change the phase carried by each path.'],
    ['How much memory does a Feynman path sum need?', ['2ⁿ amplitudes', 'Only enough to follow one path at a time: about n bits plus a running sum', '4ⁿ numbers', 'It depends only on the number of T gates'], 1, 'Paths are enumerated one after another, so memory is polynomial; the price is exponential time.'],
    ['In the Hadamard-then-Hadamard circuit, why is the probability of |1⟩ zero?', ['Because the gates are noisy', 'The two paths to |1⟩ have equal size and opposite sign, so they cancel', 'There is only one path to |1⟩', 'Because H is its own inverse only for |0⟩'], 1, 'One path picks up the minus sign of ⟨1|H|1⟩ and the other does not; their contributions sum to zero.'],
    ['For circuits of Hadamard, phase and Toffoli gates, what does an amplitude reduce to?', ['A single matrix element', 'A signed count of paths (solutions of a polynomial equation over ℤ₂), divided by 2^(h/2)', 'A probability', 'A determinant'], 1, 'All paths have the same magnitude, so the amplitude is a difference of counts, a #P-hard quantity in general.'],
    ['How does the Schrödinger–Feynman hybrid work?', ['It runs two quantum computers', 'It splits the qubits into halves, decomposes each gate across the cut into a sum of products, and simulates each term as two half-size state vectors', 'It stores the state on disk', 'It ignores entanglement'], 1, 'Memory drops to about 2·2^(n/2) amplitudes, while time grows as 2ᶜ for c crossing gates.'],
    ['A CZ gate across the cut contributes how many terms?', ['One', 'Two: |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ Z', 'Four', 'Sixteen'], 1, 'Its operator Schmidt rank is 2, so each crossing CZ doubles the number of independent half-simulations.'],
    ['What does the stabilizer rank of |T⟩^⊗t measure?', ['The number of qubits', 'How many stabilizer states are needed to write it as a sum, which sets the cost of near-Clifford simulation', 'The depth of the circuit', 'The number of measurements'], 1, 'Each stabilizer term is simulated efficiently, so the cost scales with the number of terms χ.'],
    ['Approximate stabilizer-rank simulation costs about 2^(0.23t). Roughly how many T gates make it as hard as a 46-qubit state vector (2⁴⁶)?', ['10', 'About 200', '46', '2000'], 1, '0.23 t ≈ 46 gives t ≈ 200: circuits with a few hundred T gates are the frontier for this method, regardless of qubit count.']
  ])
});

/* ---------- transverse-field Ising chain: sparse matvec and Lanczos ---------- */
const TFIM = {
  zz(n) { const N = 1 << n, d = new Float64Array(N); for (let b = 0; b < N; b++) { let s = 0; for (let i = 0; i < n; i++) s += (((b >> i) ^ (b >> ((i + 1) % n))) & 1) ? 1 : -1; d[b] = s; } return d; },
  mul(n, d, hx, v, out) { const N = 1 << n; for (let b = 0; b < N; b++) { let s = 0; for (let i = 0; i < n; i++) s += v[b ^ (1 << i)]; out[b] = d[b] * v[b] - hx * s; } },
  /* exact ground energy (free fermions, even sector, periodic chain, J = 1) */
  E0(n, hx) { let E = 0; for (let m = 0; m < n; m++) E -= Math.sqrt(1 + hx * hx - 2 * hx * Math.cos((2 * m + 1) * PI / n)); return E; }
};
const ZZC = {};
const zzOf = n => ZZC[n] || (ZZC[n] = TFIM.zz(n));
/* eigenvalues of a symmetric tridiagonal matrix by Sturm bisection; only the lowest `want` if given */
function triEig(al, be, m, want) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < m; i++) { const r = (i > 0 ? Math.abs(be[i - 1]) : 0) + (i < m - 1 ? Math.abs(be[i]) : 0); lo = Math.min(lo, al[i] - r); hi = Math.max(hi, al[i] + r); }
  const count = x => { let c3 = 0, d = 1; for (let i = 0; i < m; i++) { d = al[i] - x - (i > 0 ? be[i - 1] * be[i - 1] / d : 0); if (d === 0) d = -1e-300; if (d < 0) c3++; } return c3; };
  const out = [], K = Math.min(m, want || m);
  for (let k = 0; k < K; k++) { let a = lo, b = hi; for (let it = 0; it < 200 && b - a > 1e-14 * Math.max(1, Math.abs(a)); it++) { const mid = (a + b) / 2; if (count(mid) > k) b = mid; else a = mid; } out.push((a + b) / 2); }
  return out;
}
class Lanczos {
  constructor(n, hx, sector, seed, maxit = 80) {
    this.n = n; this.hx = hx; this.sector = sector; this.max = maxit; this.d = zzOf(n); const N = this.N = 1 << n, r = rng(seed);
    const v = new Float64Array(N); for (let b = 0; b < N; b++) v[b] = r() - .5; this.proj(v); this.norm(v);
    this.Q = [v]; this.al = []; this.be = []; this.low = []; this.ritz = []; this.done = false; this.w = new Float64Array(N); this.stall = 0;
  }
  proj(v) { if (!this.sector) return; const N = this.N, mk = N - 1, s = this.sector; for (let b = 0; b < N; b++) { const c3 = b ^ mk; if (b < c3) { const a = (v[b] + s * v[c3]) / 2; v[b] = a; v[c3] = s * a; } } }
  norm(v) { let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * v[i]; s = Math.sqrt(s); for (let i = 0; i < v.length; i++) v[i] /= s; return s; }
  step(allRitz) {
    if (this.done) return; const k = this.al.length, q = this.Q[k], w = this.w, N = this.N;
    TFIM.mul(this.n, this.d, this.hx, q, w);
    let a = 0; for (let i = 0; i < N; i++) a += w[i] * q[i]; this.al.push(a);
    for (const u of this.Q) { let c3 = 0; for (let i = 0; i < N; i++) c3 += w[i] * u[i]; for (let i = 0; i < N; i++) w[i] -= c3 * u[i]; }
    this.proj(w);
    let b = 0; for (let i = 0; i < N; i++) b += w[i] * w[i]; b = Math.sqrt(b);
    const r = triEig(this.al, this.be, k + 1, allRitz ? 0 : 1); if (allRitz) this.ritz.push(r); this.low.push(r[0]);
    if (k > 4 && Math.abs(this.low[k] - this.low[k - 1]) < 1e-13 * Math.max(1, Math.abs(r[0]))) this.stall++; else this.stall = 0;
    if (b < 1e-10 || k + 1 >= this.max || (!allRitz && this.stall >= 2)) { this.done = true; return; }
    this.be.push(b); const nq = new Float64Array(N); for (let i = 0; i < N; i++) nq[i] = w[i] / b; this.Q.push(nq);
  }
  run() { while (!this.done) this.step(false); return this.low[this.low.length - 1]; }
}

LESSONS.push({
  id: 'exactdiag', n: 32.8, stage: SIM, minutes: 16, title: 'Exact diagonalization and Krylov methods',
  lede: 'Before any approximation there is brute force: write down the Hamiltonian and find its lowest eigenvalues. Krylov methods make brute force go remarkably far, and show exactly where it stops.',
  html: `
<h2>The benchmark everything else is checked against</h2>
<p>Most questions about a quantum many-body system start with its ground state and lowest excitations. For ${m('n')} spins the Hamiltonian is a ${m('2ⁿ × 2ⁿ')} matrix. Diagonalizing it densely takes ${m('O(8ⁿ)')} operations and ${m('8 · 4ⁿ')} bytes, which already means 2 GB at 14 spins and 8 TB at 20. Yet the matrix is extremely sparse: a Hamiltonian with local terms has only about ${m('n')} non-zero entries per row, so multiplying it by a vector costs about ${m('n · 2ⁿ')} operations and needs no stored matrix at all.</p>
<h2>Krylov subspaces</h2>
<p>The <strong>Lanczos algorithm</strong> (1950) exploits this. Starting from a random vector ${m('v')}, it builds an orthonormal basis ${m('q₁, q₂, …, q<sub>m</sub>')} of the <strong>Krylov subspace</strong> spanned by ${m('v, Hv, H²v, …, H<sup>m−1</sup>v')}. In that basis the Hamiltonian becomes a small tridiagonal matrix:</p>
${EQ('H Q<sub>m</sub> = Q<sub>m</sub> T<sub>m</sub> + β<sub>m</sub> q<sub>m+1</sub> e<sub>m</sub><sup>T</sup>, &nbsp;&nbsp; T<sub>m</sub> = tridiag(β, α, β)')}
<p>The eigenvalues of ${m('T<sub>m</sub>')}, called <strong>Ritz values</strong>, approximate eigenvalues of ${m('H')}. The extreme ones converge first and fast: usually a few dozen to a hundred matrix-vector products give the ground-state energy to machine precision, largely independent of the matrix size when the ground state is well separated from the rest (near-degenerate or critical ground states need more). Powers of ${m('H')} amplify the extreme parts of the spectrum, which is why the edges are found first.</p>
<p>In exact arithmetic Lanczos needs only three vectors at a time. In floating point the basis slowly loses orthogonality and spurious copies of converged eigenvalues appear, so practical codes reorthogonalize, fully or selectively, at the cost of storing more vectors. The lab uses full reorthogonalization on the transverse-field Ising chain.</p>
${EQ('H = −J Σ<sub>i</sub> Z<sub>i</sub>Z<sub>i+1</sub> − h Σ<sub>i</sub> X<sub>i</sub>&nbsp;&nbsp;&nbsp; (periodic chain, J = 1)')}
<p>This model is a good test because it is secretly solvable: a Jordan–Wigner transformation ([[L:mappings]]) turns it into free fermions, giving ${m('E₀ = −Σ<sub>k</sub> √(1 + h² − 2h cos k)')} with ${m('k = (2m+1)π/n')}. The lab compares Lanczos with that exact answer.</p>
${LAB('lanczos')}
<h2>Symmetry is half the battle</h2>
<p>Symmetries split the Hamiltonian into independent blocks. The Ising chain conserves the parity ${m('P = Π X<sub>i</sub>')}, which halves the problem; translation symmetry divides it by ${m('n')} more, and spin-rotation or point-group symmetries add further factors. With every symmetry exploited and distributed memory on a supercomputer, Wietek and Läuchli (2018) determined low-energy states of systems of up to 50 spin-½ particles, a symmetry-reduced dimension of about ${m('3 × 10¹¹')}. That is roughly where exact diagonalization stops, and why approximate methods (tensor networks, quantum Monte Carlo) and eventually quantum computers are needed for larger systems.</p>
<h2>Seeing a phase transition in small systems</h2>
<p>For ${m('h < J')} the chain is a ferromagnet: its two lowest states, one in each parity sector, are split by an energy that shrinks exponentially with ${m('n')}. For ${m('h > J')} it is a paramagnet with a gap of about ${m('2(h − J)')}. Exactly at ${m('h = J')} the system is critical, and the gap closes as ${m('1/n')}. <strong>Finite-size scaling</strong> uses this: plot ${m('n · Δ')} against ${m('h')} for several sizes, and the curves cross at the critical point. Exact diagonalization of only 6 to 12 spins locates the transition this way.</p>
${LAB('gap')}
${NOTE('Krylov methods elsewhere', `<p>The same idea computes time evolution ${m('e<sup>−iHt</sup>v')} without ever forming the exponential, and gives spectral functions through continued fractions. Quantum Krylov methods build the subspace from time-evolved states prepared on quantum hardware and diagonalize the small projected matrix classically, a candidate near-term algorithm for ground-state energies.</p>`)}
`,
  labs: {
    lanczos: {
      title: 'Lanczos on an Ising chain',
      cap: 'Each column shows the Ritz values after that many Lanczos steps (the eigenvalues of the small tridiagonal matrix). The lowest is copper and the highest cyan; the dashed line is the exact ground energy from the free-fermion solution. The lower chart shows the error of the lowest Ritz value on a log scale. Interior Ritz values form a cloud that converges much later.',
      build(body, id) {
        let n = 12, hx = 1, LZ = null, running = false, acc = 0, seed = 7;
        const MAXIT = 60;
        const cv = canvas('', 'height:260px'), cv2 = canvas('', 'height:170px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const reset = () => { LZ = new Lanczos(n, hx, 0, seed++, MAXIT); running = false; runB.textContent = 'Run'; LZ.step(true); upd(); };
        const E0 = () => TFIM.E0(n, hx);
        const ticksFor = (a, b) => { const st = b - a > 40 ? 10 : 5, out = []; for (let v = Math.ceil(a / st) * st; v <= b; v += st) out.push(v); return out; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!LZ) return; const T = Theme.get(), e0 = E0(), span = Math.abs(e0) * 2.25 + 1, ylo = e0 - .08 * span, yhi = -e0 + .08 * span;
          const A = axes(ctx, w, H, { x: [0, MAXIT + 1], y: [ylo, yhi], xt: [1, 10, 20, 30, 40, 50, 60], yt: ticksFor(ylo, yhi), xl: 'Lanczos step', yl: 'Ritz values' });
          ctx.setLineDash([5, 4]); ctx.strokeStyle = T.copper; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(A.L, A.Y(e0)); ctx.lineTo(A.R, A.Y(e0)); ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, 'exact E₀ = ' + num(e0, 4), A.R - 4, A.Y(e0) - 9, { align: 'right', font: '600 10.5px "JetBrains Mono",monospace', color: T.copper });
          LZ.ritz.forEach((r, k) => { const x = A.X(k + 1); r.forEach((v, j) => { const c3 = j === 0 ? T.copper : j === r.length - 1 ? T.cyan : T.muted; ctx.fillStyle = c3; ctx.globalAlpha = j === 0 || j === r.length - 1 ? 1 : .55; ctx.beginPath(); ctx.arc(x, A.Y(v), j === 0 || j === r.length - 1 ? 2.8 : 1.7, 0, TAU); ctx.fill(); }); ctx.globalAlpha = 1; });
        });
        const p2 = painter(cv2, ({ ctx, w, h: H }) => {
          if (!LZ) return; const T = Theme.get(), e0 = E0(), A = axes(ctx, w, H, { x: [0, MAXIT + 1], y: [1e-15, 1e2], ylog: true, xt: [1, 10, 20, 30, 40, 50, 60], yt: [1e-14, 1e-10, 1e-6, 1e-2, 1e2], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'Lanczos step', yl: '|E_Ritz − E₀|' });
          const pts = LZ.low.map((v, k) => [A.X(k + 1), A.Y(clamp(Math.abs(v - e0), 1e-15, 1e2))]); polyline(ctx, pts, T.copper, 2); pts.forEach(q => dot(ctx, q[0], q[1], 2.4, T.copper));
        });
        const upd = () => {
          const k = LZ.low.length, e0 = E0(), N = 1 << n, err = Math.abs(LZ.low[k - 1] - e0), memV = 8 * N * LZ.Q.length;
          ro.innerHTML = `<span class="k">dimension </span>2${sup(n)} = ${N.toLocaleString('en-US')} &nbsp; <span class="k">steps </span>${k}<br><span class="k">lowest Ritz value </span>${num(LZ.low[k - 1], 10)} &nbsp; <span class="k">error </span>${sci(err)}<br><span class="k">dense matrix would need </span>${fmtBytes(8 * N * N)} &nbsp; <span class="k">Lanczos vectors stored </span>${fmtBytes(memV)}`;
          p.inv(); p2.inv();
        };
        const fmtBytes = b => b >= 1e9 ? num(b / 1e9, 1) + ' GB' : b >= 1e6 ? num(b / 1e6, 1) + ' MB' : num(b / 1e3, 0) + ' kB';
        const stepOnce = () => { if (!LZ.done) { LZ.step(true); upd(); } if (LZ.done) { running = false; runB.textContent = 'Run'; } };
        Scope.tick(now => { if (!running) { acc = now; return; } if (now - acc > (reduced() ? 0 : 110)) { acc = now; stepOnce(); } });
        const runB = btn('Run', () => { if (LZ.done) reset(); running = !running; runB.textContent = running ? 'Pause' : 'Run'; }, 'pri');
        body.append(h('div', { class: 'btns' }, seg([8, 10, 12, 14].map(v => ({ v, label: `n = ${v}` })), n, v => { n = v; reset(); }, 'Chain length'), runB, btn('Step', () => { running = false; runB.textContent = 'Run'; stepOnce(); }), btn('Restart', reset)),
          h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, cv2), h('div', { class: 'stack' }, slider({ id: id('h'), label: 'Transverse field h (J = 1)', min: 0, max: 2, step: .05, value: hx, fmt: v => num(v, 2), on: v => { hx = v; reset(); } }), ro)));
        reset();
      }
    },
    gap: {
      title: 'Finding the critical point from small chains',
      cap: 'For each chain length, Lanczos finds the lowest energy in the even and odd parity sectors; Δ is their difference. Left: Δ on a log scale. In the ferromagnet (h < 1) it vanishes exponentially with n; in the paramagnet it approaches 2(h − 1) (dashed). Right: n·Δ, which is independent of n at a critical point, so the curves cross near h = 1. The computation runs in the background and fills in as it goes.',
      build(body, id) {
        const SIZES = [6, 8, 10, 12], HS = []; for (let x = .3; x <= 2.0001; x += .05) HS.push(+x.toFixed(2));
        const res = SIZES.map(() => HS.map(() => null)), cols = T => [T.muted, T.copperLo || T.copper, T.copper, T.cyan], jobs = [];
        SIZES.forEach((n, si) => HS.forEach((hx, hi) => jobs.push([si, hi])));
        let mark = 1, jdx = 0;
        const c1 = canvas('', 'height:250px'), c2 = canvas('', 'height:250px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), st = h('div', { class: 'status' });
        Scope.tick(() => {
          if (jdx >= jobs.length) return; const t0 = performance.now();
          while (jdx < jobs.length && performance.now() - t0 < 12) { const [si, hi] = jobs[jdx++], n = SIZES[si], hx = HS[hi]; const ee = new Lanczos(n, hx, 1, 11 + jdx, 90).run(), eo = new Lanczos(n, hx, -1, 99 + jdx, 90).run(); res[si][hi] = Math.max(1e-12, eo - ee); }
          q1.inv(); q2.inv(); text();
        });
        const lines = (ctx, A, f, T) => { ctx.save(); ctx.beginPath(); ctx.rect(A.L, A.T - 2, A.R - A.L, A.B - A.T + 2); ctx.clip(); SIZES.forEach((n, si) => { const pts = []; HS.forEach((hx, hi) => { const g = res[si][hi]; if (g != null) pts.push([A.X(hx), A.Y(f(g, n))]); }); polyline(ctx, pts, cols(T)[si], 2.2); }); ctx.restore(); };
        const vline = (ctx, A, T) => { ctx.strokeStyle = T.ink; ctx.globalAlpha = .35; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(A.X(mark), A.T); ctx.lineTo(A.X(mark), A.B); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; };
        const q1 = painter(c1, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [.3, 2], y: [1e-7, 4], ylog: true, xt: [.5, 1, 1.5, 2], yt: [1e-6, 1e-4, 1e-2, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'field h', yl: 'gap Δ' });
          const ref = []; for (let x = 1.01; x <= 2; x += .01) ref.push([A.X(x), A.Y(2 * (x - 1))]); polyline(ctx, ref, T.ink, 1.3, [5, 4]);
          lines(ctx, A, g => clamp(g, 1e-7, 4), T); vline(ctx, A, T);
        });
        const q2 = painter(c2, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [.3, 2], y: [0, 6], xt: [.5, 1, 1.5, 2], yt: [0, 2, 4, 6], xl: 'field h', yl: 'n · Δ' });
          lines(ctx, A, (g, n) => g * n, T); vline(ctx, A, T);
          ctx.strokeStyle = T.copper; ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(A.X(1), A.T); ctx.lineTo(A.X(1), A.B); ctx.stroke(); ctx.globalAlpha = 1; txt(ctx, 'h = J', A.X(1) + 5, A.T + 10, { align: 'left', font: '600 10px "JetBrains Mono",monospace', color: T.copper });
        });
        const text = () => {
          const hi = HS.findIndex(x => Math.abs(x - mark) < 1e-6);
          st.className = jdx >= jobs.length ? 'status good' : 'status'; st.textContent = jdx >= jobs.length ? `Done: ${jobs.length * 2} Lanczos runs.` : `Computing… ${Math.round(100 * jdx / jobs.length)}%`;
          ro.innerHTML = `<span class="k">at h = ${num(mark, 2)}</span><br>` + SIZES.map((n, si) => { const g = res[si][hi]; return `<span class="k">n = ${String(n).padStart(2)} </span>${g == null ? '…' : `Δ = ${g < 1e-3 ? sci(g) : num(g, 4)} &nbsp; n·Δ = ${num(g * n, 3)}`}`; }).join('<br>');
        };
        body.append(h('div', { class: 'split even' }, h('div', { class: 'stack' }, c1), h('div', { class: 'stack' }, c2)),
          legendRow(SIZES.map((n, si) => [`n = ${n}`, ['var(--muted)', 'var(--copper-lo)', 'var(--copper)', 'var(--cyan)'][si]]).concat([['2(h − 1), infinite chain', 'var(--ink)', 1]])),
          h('div', { class: 'split' }, slider({ id: id('m'), label: 'Read off values at h', min: .3, max: 2, step: .05, value: mark, fmt: v => num(v, 2), on: v => { mark = v; q1.inv(); q2.inv(); text(); } }), h('div', { class: 'stack' }, st, ro)));
        text();
      }
    }
  },
  take: ['Dense diagonalization costs O(8ⁿ) time and O(4ⁿ) memory; sparse local Hamiltonians need only matrix-vector products of cost about n·2ⁿ.',
    'Lanczos builds a Krylov subspace in which H is tridiagonal; its extreme Ritz values converge to the ground and highest energies in tens of steps.',
    'Finite precision destroys orthogonality and creates spurious copies of eigenvalues, so practical codes reorthogonalize.',
    'Symmetries block-diagonalize H; with all of them, exact diagonalization reaches about 50 spins, and finite-size scaling of small systems already locates phase transitions.'],
  quiz: QZ([
    ['Why is dense diagonalization of a 20-spin Hamiltonian impractical?', ['The matrix is not Hermitian', 'The matrix is 2²⁰ × 2²⁰: about 8 TB of memory and O(8²⁰) operations', 'It has no ground state', 'Spins cannot be simulated'], 1, 'A million-by-million dense matrix of doubles takes 8 × 10¹² bytes, and full diagonalization scales as the cube of the dimension.'],
    ['What makes Lanczos practical for large spin systems?', ['It uses random numbers', 'It only needs matrix-vector products, which are cheap for sparse local Hamiltonians, plus a few stored vectors', 'It stores the whole matrix', 'It works only for two spins'], 1, 'Each step applies H once (about n·2ⁿ operations here) and never forms the matrix.'],
    ['What is a Krylov subspace?', ['The span of the eigenvectors', 'The span of v, Hv, H²v, …, H^(m−1)v for a starting vector v', 'The null space of H', 'The set of product states'], 1, 'Lanczos builds an orthonormal basis of this space, in which H becomes tridiagonal.'],
    ['What are Ritz values?', ['Exact eigenvalues', 'Eigenvalues of the projected tridiagonal matrix T_m, which approximate eigenvalues of H', 'Diagonal entries of H', 'Random numbers'], 1, 'As m grows they converge to eigenvalues of H, the extreme ones first.'],
    ['Which eigenvalues does Lanczos find first?', ['The ones in the middle of the spectrum', 'The extreme ones, lowest and highest', 'Only degenerate ones', 'All at the same rate'], 1, 'Polynomials in H, which is what a Krylov space contains, separate the edges of the spectrum most quickly.'],
    ['Why do practical Lanczos codes reorthogonalize?', ['To speed up matrix products', 'Rounding errors destroy the orthogonality of the basis and create spurious duplicate eigenvalues', 'Because H is not sparse', 'To find excited states only'], 1, 'Loss of orthogonality is tied to convergence: converged eigenvectors creep back in, producing “ghost” copies.'],
    ['How does the parity symmetry P = ΠXᵢ help for the Ising chain?', ['It removes the field', 'H commutes with P, so the problem splits into two independent blocks of half the size', 'It makes H diagonal', 'It has no effect'], 1, 'Working in one parity sector halves memory and work, and labels the states.'],
    ['Roughly how large are the largest exact diagonalizations of spin-½ systems?', ['10 spins', 'About 50 spins, using all symmetries on a supercomputer', '1000 spins', '10⁶ spins'], 1, 'Wietek and Läuchli (2018) reached 50 sites with symmetry-reduced dimensions of about 3 × 10¹¹.'],
    ['In the lab, what happens to the gap Δ for h < J as n grows?', ['It grows', 'It shrinks exponentially: the two parity sectors become degenerate, reflecting the two ferromagnetic ground states', 'It stays at 2J', 'It oscillates'], 1, 'Tunnelling between the two ordered states requires flipping the whole chain, an amplitude of order (h/J)ⁿ.'],
    ['Why do the n·Δ curves cross near h = J?', ['By coincidence', 'At a critical point the gap scales as 1/n, so n·Δ is independent of size there', 'Because Lanczos fails there', 'Because the gap is zero at all h'], 1, 'Away from criticality n·Δ goes to 0 (ordered) or grows like n (gapped), so the crossing locates the transition.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Schrödinger simulation', 'Classical simulation that stores all 2ⁿ amplitudes and updates them gate by gate.', 'pathsum'],
  ['Feynman path sum', 'Computing an amplitude as a sum over paths through intermediate basis states: little memory, but time doubling with each branching gate.', 'pathsum'],
  ['Schrödinger–Feynman hybrid', 'A simulator that splits qubits into groups, simulates each with a state vector, and sums over the terms of gates crossing the cut.', 'pathsum'],
  ['Stabilizer rank', 'The number of stabilizer states needed to write a state as a sum; it sets the cost of simulating near-Clifford circuits.', 'pathsum'],
  ['Exact diagonalization', 'Numerically finding eigenvalues and eigenvectors of a Hamiltonian in its full Hilbert space, without approximations.', 'exactdiag'],
  ['Lanczos algorithm', 'A Krylov method that builds a tridiagonal projection of a Hermitian matrix using only matrix-vector products; its extreme eigenvalues converge quickly.', 'exactdiag'],
  ['Krylov subspace', 'The space spanned by v, Av, A²v, …, A^(m−1)v; the basis of Lanczos and related methods.', 'exactdiag'],
  ['Ritz value', 'An eigenvalue of a matrix projected onto a subspace, used as an approximation to an eigenvalue of the full matrix.', 'exactdiag'],
  ['Transverse-field Ising model', 'Spins with ZZ couplings in a perpendicular field X; it has a quantum phase transition at h = J and is solvable by free fermions in one dimension.', 'exactdiag'],
  ['Finite-size scaling', 'Extracting properties of an infinite system, such as a critical point, from how quantities change with system size.', 'exactdiag']
);
})();
