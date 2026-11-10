/* =====================================================================
   Stage 2 · 4 K · Building blocks
   ===================================================================== */
(() => {

const MXS = {
  X: MX([['0', '1'], ['1', '0']]), Y: MX([['0', '−i'], ['i', '0']]), Z: MX([['1', '0'], ['0', '−1']]),
  H: FR('1', '√2') + MX([['1', '1'], ['1', '−1']]), S: MX([['1', '0'], ['0', 'i']]), Sdg: MX([['1', '0'], ['0', '−i']]),
  T: MX([['1', '0'], ['0', 'e<sup>iπ/4</sup>']]), Tdg: MX([['1', '0'], ['0', 'e<sup>−iπ/4</sup>']])
};

/* ---------------- Lesson 5 · Single-qubit gates ---------------- */
LESSONS.push({
  id: 'gates', n: 5, stage: 1, minutes: 11, title: 'Single-qubit gates',
  lede: 'Gates change a qubit’s state without measuring it. For a single qubit, every gate is a rotation of the Bloch sphere.',
  html: `
<h2>Gates are unitary matrices</h2>
<p>A gate acts on the pair of amplitudes ${m('(α, β)')} by matrix multiplication. To keep the total probability equal to 1, the matrix must be <strong>unitary</strong>: ${m('U<sup>†</sup>U = I')}, where ${m('U<sup>†</sup>')} is the conjugate transpose. Unitary matrices are always reversible, so any gate can be undone by applying ${m('U<sup>†</sup>')}. Measurement is the only irreversible step in a quantum computation.</p>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Gate</th><th>Matrix</th><th>On the Bloch sphere</th><th>What it does</th></tr></thead><tbody>
<tr><td>X</td><td>${MXS.X}</td><td>180° about x</td><td>Swaps |0⟩ and |1⟩. The quantum NOT.</td></tr>
<tr><td>Y</td><td>${MXS.Y}</td><td>180° about y</td><td>A bit flip combined with a phase flip.</td></tr>
<tr><td>Z</td><td>${MXS.Z}</td><td>180° about z</td><td>Flips the sign of |1⟩. Maps |+⟩ to |−⟩.</td></tr>
<tr><td>H</td><td>${MXS.H}</td><td>180° about the axis halfway between x and z</td><td>Maps |0⟩ to |+⟩ and |1⟩ to |−⟩, and back.</td></tr>
<tr><td>S</td><td>${MXS.S}</td><td>90° about z</td><td>Quarter turn of phase. S² = Z.</td></tr>
<tr><td>T</td><td>${MXS.T}</td><td>45° about z</td><td>Eighth turn of phase. T² = S.</td></tr>
</tbody></table></div>
<p>The rotation gates ${m('R<sub>x</sub>(θ)')}, ${m('R<sub>y</sub>(θ)')} and ${m('R<sub>z</sub>(θ)')} turn the sphere by any angle ${m('θ')} about one axis. In matrix form ${m('R<sub>n</sub>(θ) = e<sup>−iθ n·σ/2</sup>')}, where ${m('σ')} stands for the Pauli matrices X, Y and Z. Every gate in the table is one of these rotations, up to a global phase that no experiment can detect.</p>
${LAB('playground')}
<h2>Order matters</h2>
<p>Rotations about different axes do not commute, so the order of gates changes the result. Starting from ${m('|0⟩')}, X then H gives ${m('|−⟩')}, while H then X gives ${m('|+⟩')}. Some useful identities:</p>
${EQ('HXH = Z,&nbsp;&nbsp; HZH = X,&nbsp;&nbsp; HYH = −Y,&nbsp;&nbsp; XYZ = iI')}
<h2>A small set builds everything</h2>
<p>Any single-qubit gate can be written as three rotations, ${m('R<sub>z</sub>(α) R<sub>y</sub>(β) R<sub>z</sub>(γ)')}, so hardware only needs a few native rotations to offer every possible gate. In fault-tolerant machines the menu is smaller still. The gates H and T together approximate any single-qubit gate to any accuracy you like, and the Solovay–Kitaev theorem guarantees the number of gates needed grows only polylogarithmically as the accuracy improves. Add the two-qubit CNOT gate from [[L:multiqubit]] and the set ${m('{H, T, CNOT}')} is <strong>universal</strong>: it can approximate any quantum computation.</p>
${LAB('challenges')}
`,
  labs: {
    playground: {
      title: 'Gate playground',
      cap: 'Every button turns the sphere. The copper trail shows the path the state took. Undo applies the inverse rotation, which always exists because gates are unitary.',
      build(body, id) {
        const cv = canvas('sq'), bv = new BlochView(cv); let st = [0, 0, 1]; const hist = [];
        const ketEl = h('div', { class: 'ketline' }), strip = h('div', { class: 'gstrip', 'aria-label': 'Gates applied so far' }), mxEl = h('div', { class: 'mxbox' });
        let axisR = 'x', angR = 90;
        const upd = (label, mx) => {
          ketEl.textContent = '|ψ⟩ = ' + ketOfBloch(st);
          strip.innerHTML = ''; strip.append(h('span', { class: 'gs0' }, '|0⟩'));
          hist.slice(-14).forEach(g => strip.append(h('span', { class: 'gs', html: g.label })));
          if (label) mxEl.innerHTML = `<span class="ctl-label">Last gate · ${label}</span><div class="m" style="font-size:19px;margin-top:6px">${mx}</div>`;
        };
        const apply = (axis, ang, label, mx) => { st = V.rot(st, axis, ang); hist.push({ axis, ang, label }); bv.rotate(axis, ang, 750); upd(label, mx); };
        const gates = h('div', { class: 'btns' }, ...['X', 'Y', 'Z', 'H', 'S', 'Sdg', 'T', 'Tdg'].map(g =>
          gateBtn(GATE_LABEL[g], () => apply(ROT[g].axis, ROT[g].ang, GATE_LABEL[g], MXS[g]), 'Apply ' + GATE_LABEL[g])));
        const rMx = () => {
          const t = rad(angR), cs = num(Math.cos(t / 2), 3), sn = num(Math.sin(t / 2), 3), nsn = num(-Math.sin(t / 2), 3);
          if (axisR === 'x') return MX([[cs, nsn + 'i'], [nsn + 'i', cs]]);
          if (axisR === 'y') return MX([[cs, nsn], [sn, cs]]);
          return MX([['e<sup>' + MINUS + 'iθ/2</sup>', '0'], ['0', 'e<sup>iθ/2</sup>']]);
        };
        const axSeg = seg([{ v: 'x', label: 'Rx' }, { v: 'y', label: 'Ry' }, { v: 'z', label: 'Rz' }], 'x', v => { axisR = v; }, 'Rotation axis');
        const angS = slider({ id: id('ang'), label: 'Rotation angle θ', min: -180, max: 180, step: 5, value: 90, fmt: v => v + '°', on: v => { angR = v; } });
        const applyR = btn('Apply rotation', () => { const ax = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[axisR]; apply(ax, rad(angR), `R<sub>${axisR}</sub>(${angR}°)`, rMx()); });
        const undo = btn('Undo', () => { const g = hist.pop(); if (!g) return; st = V.rot(st, g.axis, -g.ang); bv.rotate(g.axis, -g.ang, 600); upd(); });
        const reset = btn('Reset to |0⟩', () => { hist.length = 0; st = [0, 0, 1]; bv.cancel(); bv.clearTrail(); bv.moveTo(st, 500).then(() => bv.clearTrail()); mxEl.innerHTML = ''; upd(); });
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, ketEl, field('Fixed gates', gates),
          field('Any rotation', h('div', { class: 'stack', style: 'gap:8px' }, axSeg, angS, h('div', { class: 'btns' }, applyR))),
          h('div', { class: 'btns' }, undo, reset), field('Circuit so far', strip), mxEl)));
        bv.set(st); upd();
      }
    },
    challenges: {
      title: 'Reach the target',
      cap: 'Use the six gates to move the copper arrow onto the dashed blue ring. “Par” is the fewest gates that solve it.',
      build(body, id) {
        const CH = [
          { name: 'Flip it', from: '0', to: CARD['1'], par: 1, hint: 'One rotation of 180° about a horizontal axis.' },
          { name: 'Minus', from: '0', to: CARD['-'], par: 2, hint: 'Get to the equator first, then think about which way to turn.' },
          { name: 'Onto the y axis', from: '0', to: CARD['+i'], par: 2, hint: 'H takes you to the equator; a phase gate turns you around it.' },
          { name: 'Back to the north', from: '-i', to: CARD['0'], par: 2, hint: 'Rotate around z until you sit on +x, then use H.' },
          { name: 'An eighth of a turn', from: '0', to: fromAngles(PI / 2, PI / 4), par: 2, hint: 'T turns the equator by 45°.' },
          { name: 'Tilted 45°', from: '0', to: fromAngles(PI / 4, 0), par: 4, hint: 'Try H, T, H and then one more phase gate.' }
        ];
        const cv = canvas('sq'), bv = new BlochView(cv); let k = 0, st, moves = 0;
        const stat = h('div', { class: 'status' }), info = h('div', { class: 'stack', style: 'gap:4px' });
        const load = i => {
          k = i; const c2 = CH[k]; st = CARD[c2.from].slice(); moves = 0; bv.cancel(); bv.set(st); bv.target = c2.to; bv.inv();
          info.innerHTML = `<div class="lab-title">${k + 1}. ${c2.name}</div><div class="hint">Start at ${CARD_LABEL[c2.from]}. Target: ${ketOfBloch(c2.to)}. Par ${c2.par}.</div>`;
          stat.className = 'status'; stat.textContent = 'Gates used: 0';
        };
        const press = g => {
          st = V.rot(st, ROT[g].axis, ROT[g].ang); moves++; bv.rotate(ROT[g].axis, ROT[g].ang, 650);
          const ok = V.dot(st, CH[k].to) > .999;
          stat.className = 'status' + (ok ? ' good' : ''); stat.textContent = ok ? `Solved in ${moves} gate${moves > 1 ? 's' : ''}${moves <= CH[k].par ? ', which is par.' : `. Par is ${CH[k].par}.`}` : `Gates used: ${moves}`;
        };
        const picker = seg(CH.map((_, i) => ({ v: i, label: String(i + 1) })), 0, v => load(v), 'Challenge');
        const gates = h('div', { class: 'btns' }, ...['X', 'Y', 'Z', 'H', 'S', 'T'].map(g => gateBtn(GATE_LABEL[g], () => press(g), 'Apply ' + g)));
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, field('Challenge', picker), info, field('Gates', gates), stat,
          h('div', { class: 'btns' }, btn('Start over', () => load(k)), btn('Show a hint', () => { stat.className = 'status'; stat.textContent = CH[k].hint; })))));
        load(0);
      }
    }
  },
  take: ['Gates are unitary matrices, so every gate is reversible.',
    'On one qubit, every gate is a rotation of the Bloch sphere (up to an undetectable global phase).',
    'Gate order matters: HXH = Z, but XH ≠ HX.',
    'H, T and CNOT together form a universal gate set.'],
  quiz: [
    { q: 'Which gate maps |+⟩ to |−⟩?', o: ['X', 'Z', 'H', 'S'], a: 1, why: 'Z flips the sign of |1⟩, turning (|0⟩ + |1⟩)/√2 into (|0⟩ − |1⟩)/√2. On the sphere it is a 180° turn about z.' },
    { q: 'Applying S twice is the same as which gate?', o: ['T', 'X', 'Z', 'The identity'], a: 2, why: 'S is a 90° turn about z, so two of them make 180° about z, which is Z.' }
  ]
});

/* ---------------- Lesson 6 · Phase and interference ---------------- */
LESSONS.push({
  id: 'interference', n: 6, stage: 1, minutes: 11, title: 'Phase and interference',
  lede: 'Quantum algorithms arrange for amplitudes to cancel on wrong answers and add up on right ones. An interferometer shows the effect with one photon at a time.',
  html: `
<h2>Two paths, one photon</h2>
<p>A Mach–Zehnder interferometer sends light into a beam splitter, along two arms, and into a second beam splitter with a detector on each output. Turn the source down until it emits one photon at a time. Each photon is detected whole, at one detector or the other, never split between them. Yet after the first beam splitter it is in an equal superposition of travelling along the upper arm and the lower arm.</p>
<p>With the two arms exactly balanced, every single photon arrives at detector D0. The two routes to D1 have amplitudes of equal size and opposite sign, and they cancel. Add a phase shift ${m('φ')} to one arm and the odds become</p>
${EQ('P(D0) = cos²(φ/2),&nbsp;&nbsp;&nbsp; P(D1) = sin²(φ/2)')}
${LAB('mzi')}
<h2>Looking destroys the pattern</h2>
<p>Switch on the which-path detector. It records which arm each photon took, and the interference disappears: each detector clicks half the time whatever the phase. The record is a measurement of the path, and as [[L:measurement]] showed, measurement wipes out the relative phase that interference relies on. The detector does not need to disturb the photon’s motion. It only has to make the path knowable in principle. The double-slit version, with a quantum eraser, is in [[L:doubleslit]].</p>
<h2>Adding arrows</h2>
<p>Richard Feynman described the rule this way: for each outcome, draw one arrow per path that leads to it, add the arrows head to tail, and square the length of the result. Arrows that point the same way reinforce. Arrows that point in opposite directions cancel.</p>
${LAB('arrows')}
<h2>The same thing as a circuit</h2>
<p>A balanced beam splitter acts on the photon’s path much like a Hadamard gate acts on a qubit (up to phase conventions). The whole interferometer is the circuit H, then a phase, then H. With no phase shift, ${m('H·H = I')} and the photon comes out where it went in. A phase of π is a Z gate, and ${m('HZH = X')} sends every photon to the other detector.</p>
${NOTE('Why this matters for algorithms', `<p>Every quantum algorithm in Stage 4 is an elaborate interferometer. Deutsch–Jozsa, Grover and Shor all spread the state over many computational paths, stamp phases on them that depend on the problem, and then recombine the paths so that the phases cancel on wrong answers.</p>`)}
`,
  labs: {
    mzi: {
      title: 'A single-photon interferometer',
      cap: 'Each glowing dot is one photon. Between the beam splitters it travels both arms as a superposition (two faint dots). The chart compares the measured fractions with cos²(φ/2).',
      build(body, id) {
        let phi = 0, wp = false, fast = false, cnt = [0, 0], fl = [0, 0], last = 0; const ph = [];
        const cv = canvas('', 'height:310px'), chart = canvas('', 'height:170px'), stats = h('div', { class: 'chipline' });
        const P = { src: [.07, .76], bs1: [.25, .76], m1: [.25, .28], m2: [.69, .76], bs2: [.69, .28], d0: [.92, .28], d1: [.69, .06], ps: [.47, .76] };
        const up = [P.bs1, P.m1, P.bs2], lo = [P.bs1, P.m2, P.bs2];
        let W = 1, H = 1; const S = p => [p[0] * W, p[1] * H];
        const along = (pts, f) => {
          const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const a = S(pts[i - 1]), b = S(pts[i]), l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, l]); L += l; }
          let d = f * L; for (const [a, b, l] of seg) { if (d <= l) return [a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]; d -= l; } return S(pts[pts.length - 1]);
        };
        const lin = (a, b, f) => { const A = S(a), B = S(b); return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]; };
        const p0 = () => wp ? .5 : Math.cos(phi / 2) ** 2;
        const pt = painter(cv, ({ ctx, w, h: hh }) => {
          W = w; H = hh; const T = Theme.get();
          ctx.strokeStyle = T.line; ctx.lineWidth = 2;
          const L = (a, b) => { const A = S(a), B = S(b); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); };
          L(P.src, P.bs1); L(P.bs1, P.m1); L(P.m1, P.bs2); L(P.bs1, P.m2); L(P.m2, P.bs2); L(P.bs2, P.d0); L(P.bs2, P.d1);
          const diag = (p, col, lw2) => { const [x, y] = S(p); ctx.strokeStyle = col; ctx.lineWidth = lw2; ctx.beginPath(); ctx.moveTo(x - 15, y + 15); ctx.lineTo(x + 15, y - 15); ctx.stroke(); };
          for (const b of [P.bs1, P.bs2]) { const [x, y] = S(b); ctx.fillStyle = T.surface; ctx.strokeStyle = T.ink; ctx.lineWidth = 1.2; ctx.fillRect(x - 15, y - 15, 30, 30); ctx.strokeRect(x - 15, y - 15, 30, 30); diag(b, T.copper, 3); }
          diag(P.m1, T.ink, 5); diag(P.m2, T.ink, 5);
          { const [x, y] = S(P.ps); ctx.fillStyle = T.wash; ctx.strokeStyle = T.copper; ctx.lineWidth = 1.5; ctx.fillRect(x - 12, y - 18, 24, 36); ctx.strokeRect(x - 12, y - 18, 24, 36);
            txt(ctx, 'φ = ' + Math.round(deg(phi)) + '°', x, y + 32, { font: MATHFONT(15), color: T.ink }); }
          { const [x, y] = S(P.src); ctx.fillStyle = T.surface2; ctx.strokeStyle = T.muted; ctx.lineWidth = 1; ctx.fillRect(x - 30, y - 16, 44, 32); ctx.strokeRect(x - 30, y - 16, 44, 32);
            txt(ctx, 'source', x - 8, y + 30, { font: '500 11px "JetBrains Mono",monospace' }); }
          if (wp) { const [x, y] = along(up, .25); ctx.strokeStyle = T.copper; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke(); dot(ctx, x, y, 4, T.copper);
            txt(ctx, 'which-path', x + 18, y, { align: 'left', color: T.copper, font: '600 11px "JetBrains Mono",monospace' }); }
          const now = performance.now();
          const det = (p, k, lab, dir) => {
            const [x, y] = S(p), f = clamp(1 - (now - fl[k]) / 500, 0, 1);
            ctx.fillStyle = f > 0 ? rgba(T.copper, .25 + .75 * f) : T.surface; ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5;
            ctx.beginPath(); if (dir === 'r') ctx.arc(x, y, 16, -PI / 2, PI / 2); else ctx.arc(x, y, 16, PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
            txt(ctx, `${lab}  ${cnt[k]}`, dir === 'r' ? x : x + 24, dir === 'r' ? y + 30 : y, { align: dir === 'r' ? 'center' : 'left', color: T.ink, font: '600 12px "JetBrains Mono",monospace' });
          };
          det(P.d0, 0, 'D0', 'r'); det(P.d1, 1, 'D1', 'u');
          for (const f of ph) {
            const glow = (p, a) => { ctx.globalAlpha = a * .25; dot(ctx, p[0], p[1], 11, T.copper); ctx.globalAlpha = a; dot(ctx, p[0], p[1], 5.5, T.copper); ctx.globalAlpha = 1; };
            if (f.s < 1) glow(lin(P.src, P.bs1, f.s), 1);
            else if (f.s < 2) { const g = f.s - 1; if (!f.path || f.path === 'u') glow(along(up, g), f.path ? 1 : .5); if (!f.path || f.path === 'l') glow(along(lo, g), f.path ? 1 : .5); }
            else glow(lin(P.bs2, f.out ? P.d1 : P.d0, Math.min(1, f.s - 2)), 1);
          }
        });
        const pc = painter(chart, ({ ctx, w, h: hh }) => {
          const T = Theme.get(), A = axes(ctx, w, hh, { x: [0, 360], y: [0, 1], xt: [0, 90, 180, 270, 360], xf: v => v + '°', yt: [0, .5, 1], yf: v => pct(v, 0), xl: 'phase φ', yl: 'P(detector)' });
          const c0 = [], c1 = []; for (let d = 0; d <= 360; d += 3) { const q = wp ? .5 : Math.cos(rad(d) / 2) ** 2; c0.push([A.X(d), A.Y(q)]); c1.push([A.X(d), A.Y(1 - q)]); }
          polyline(ctx, c0, T.cyan, 2); polyline(ctx, c1, T.copper, 2, wp ? [6, 4] : null);
          const x = A.X(deg(phi)); polyline(ctx, [[x, A.T], [x, A.B]], T.muted, 1, [3, 3]);
          const n = cnt[0] + cnt[1]; if (n) { dot(ctx, x, A.Y(cnt[0] / n), 5, T.cyan, T.surface); dot(ctx, x, A.Y(cnt[1] / n), 5, T.copper, T.surface); }
          txt(ctx, 'D0', A.R - 4, A.Y(wp ? .5 : 1) + (wp ? -10 : 10), { align: 'right', color: T.cyan, font: '600 11px "JetBrains Mono",monospace' });
        });
        const upd = () => { const n = cnt[0] + cnt[1]; stats.innerHTML = `<span>D0 <b>${cnt[0]}</b> ${n ? '(' + pct(cnt[0] / n, 0) + ')' : ''}</span><span>D1 <b>${cnt[1]}</b> ${n ? '(' + pct(cnt[1] / n, 0) + ')' : ''}</span><span>predicted P(D0) <b>${pct(p0(), 1)}</b></span>`; pc.inv(); };
        const resetC = () => { cnt = [0, 0]; upd(); };
        Scope.tick(now => {
          const dt = Math.min(50, now - (last || now)); last = now;
          const speed = (fast ? 1 / 380 : 1 / 700) * (reduced() ? 4 : 1), gap = fast ? 160 : 950;
          if (!ph.length || now - ph[ph.length - 1].t0 > gap) ph.push({ s: 0, t0: now, path: null, out: null });
          for (const f of ph) {
            const prev = f.s; f.s += dt * speed;
            if (wp && prev < 1.25 && f.s >= 1.25) f.path = Math.random() < .5 ? 'u' : 'l';
            if (prev < 2 && f.s >= 2) f.out = Math.random() < p0() ? 0 : 1;
            if (f.s >= 3 && !f.done) { f.done = true; cnt[f.out]++; fl[f.out] = now; upd(); }
          }
          while (ph.length && ph[0].done) ph.shift();
          pt.inv();
        });
        const sPhi = slider({ id: id('phi'), label: 'Phase shift φ on the lower arm', min: 0, max: 360, step: 1, value: 0, fmt: v => v + '°', on: v => { phi = rad(v); resetC(); } });
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, chart),
          h('div', { class: 'stack' }, sPhi,
            field('Which-path detector', seg([{ v: false, label: 'Off' }, { v: true, label: 'On' }], false, v => { wp = v; resetC(); }, 'Which-path detector')),
            field('Photon rate', seg([{ v: false, label: 'One at a time' }, { v: true, label: 'Fast' }], false, v => { fast = v; }, 'Photon rate')),
            stats, h('div', { class: 'btns' }, btn('Clear counts', resetC), btn('φ = 0', () => { sPhi.set(0, true); }, 'sm'), btn('φ = 90°', () => { sPhi.set(90, true); }, 'sm'), btn('φ = 180°', () => { sPhi.set(180, true); }, 'sm')))));
        upd();
      }
    },
    arrows: {
      title: 'Adding arrows',
      cap: 'Each output collects one arrow from each arm. The blue arrow is the upper arm, the coloured arrow is the lower arm with its phase, and the copper arrow is their sum. Probability is the squared length of the sum.',
      build(body, id) {
        let phi = rad(60);
        const cv = canvas('', 'height:240px'), out = h('div', { class: 'chipline' });
        const pt = painter(cv, ({ ctx, w, h: hh }) => {
          const T = Theme.get(), half = w / 2, s = Math.min(half * .36, hh * .34);
          [[0, 'Output D0', 1], [1, 'Output D1', -1]].forEach(([k, title, sgn]) => {
            const ox = half * k + half * .25, oy = hh * .55;
            ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(half * k + 12, oy); ctx.lineTo(half * (k + 1) - 12, oy); ctx.stroke();
            ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.arc(ox, oy, s, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
            const ax = ox + s * .5, ay = oy;
            const bx = ax + sgn * s * .5 * Math.cos(phi), by = ay - sgn * s * .5 * Math.sin(phi);
            arrow(ctx, ox, oy, ax, ay, phaseColor(0), 3);
            arrow(ctx, ax, ay, bx, by, phaseColor(sgn > 0 ? phi : phi + PI), 3);
            arrow(ctx, ox, oy, bx, by, T.copper, 3.5, 11);
            const re = .5 + sgn * .5 * Math.cos(phi), im = sgn * .5 * Math.sin(phi), p = re * re + im * im;
            txt(ctx, title, half * k + half / 2, 16, { color: T.ink, font: '700 14px "Bricolage Grotesque",sans-serif' });
            txt(ctx, `P = |sum|² = ${pct(p, 0)}`, half * k + half / 2, hh - 14, { color: T.ink, font: '500 12px "JetBrains Mono",monospace' });
          });
          ctx.strokeStyle = T.line; ctx.beginPath(); ctx.moveTo(half, 8); ctx.lineTo(half, hh - 8); ctx.stroke();
        });
        const upd = () => { out.innerHTML = `<span>P(D0) = cos²(φ/2) = <b>${pct(Math.cos(phi / 2) ** 2, 1)}</b></span><span>P(D1) = sin²(φ/2) = <b>${pct(Math.sin(phi / 2) ** 2, 1)}</b></span>`; pt.inv(); };
        const sl = slider({ id: id('phi'), label: 'Phase difference φ', min: 0, max: 360, step: 1, value: 60, fmt: v => v + '°', on: v => { phi = rad(v); upd(); } });
        body.append(cv, h('div', { class: 'split even' }, sl, out));
        upd();
      }
    }
  },
  take: ['Interference happens when several paths lead to the same outcome: add their amplitudes, then square.',
    'In a balanced interferometer one photon at a time still interferes with itself.',
    'Recording which path was taken destroys the interference.',
    'The interferometer is the circuit H · phase · H; HZH = X.'],
  quiz: [
    { q: 'In a balanced interferometer (φ = 0) a which-path detector is added. What fraction of photons now reach D1?', o: ['0', '1/4', '1/2', '1'], a: 2, why: 'Knowing the path removes the interference, so each detector gets half the photons.' },
    { q: 'What does HZH equal?', o: ['Z', 'X', 'H', 'The identity'], a: 1, why: 'H swaps the roles of the x and z axes, so a phase flip in the middle becomes a bit flip.' }
  ]
});

/* ---------------- Lesson 7 · Multiple qubits ---------------- */
LESSONS.push({
  id: 'multiqubit', n: 7, stage: 1, minutes: 10, title: 'Multiple qubits',
  lede: 'Put qubits side by side and their state space multiplies. Two qubits have four basis states, three have eight, and n have 2ⁿ.',
  html: `
<h2>The tensor product</h2>
<p>The joint state of two independent qubits is their <strong>tensor product</strong>, written with ${m('⊗')}. You multiply out the brackets the ordinary way, keeping track of which qubit each factor belongs to:</p>
${EQ('(a₀|0⟩ + a₁|1⟩) ⊗ (b₀|0⟩ + b₁|1⟩) = a₀b₀|00⟩ + a₀b₁|01⟩ + a₁b₀|10⟩ + a₁b₁|11⟩')}
<p>In this guide the left digit of a ket belongs to qubit 0, which is the top wire in circuit diagrams. Some software, Qiskit for example, writes the digits in the opposite order, so check the convention whenever you compare results across tools.</p>
${LAB('twoq')}
<h2>Two-qubit gates</h2>
<p>The workhorse two-qubit gate is the <strong>controlled-NOT</strong>, or CNOT. It flips the target qubit when the control qubit is 1 and leaves it alone when the control is 0:</p>
<div class="tbl-wrap" style="max-width:420px"><table class="tbl"><thead><tr><th>Input</th><th>Output</th></tr></thead><tbody>
<tr><td>|00⟩</td><td>|00⟩</td></tr><tr><td>|01⟩</td><td>|01⟩</td></tr><tr><td>|10⟩</td><td>|11⟩</td></tr><tr><td>|11⟩</td><td>|10⟩</td></tr></tbody></table></div>
<p>On basis states CNOT behaves exactly like a classical XOR gate. On superpositions it does something no classical gate can: it can turn a product state into an entangled one. Try it in the lab above. Put qubit 0 on the equator, leave qubit 1 at ${m('|0⟩')}, and switch on CNOT. Both small Bloch vectors shrink to nothing, and the entanglement meter jumps to 1.</p>
<p>Two other common gates are <strong>CZ</strong>, which flips the sign of ${m('|11⟩')} and is symmetric between its two qubits, and <strong>SWAP</strong>, which exchanges two qubits’ states.</p>
<h2>Most states are not products</h2>
<p>A product state of ${m('n')} qubits needs only ${m('2n')} complex numbers to describe, two per qubit. A general state needs ${m('2ⁿ')}. For two qubits there is a quick test. Write the amplitudes as ${m('a<sub>00</sub>, a<sub>01</sub>, a<sub>10</sub>, a<sub>11</sub>')}; the state is a product exactly when</p>
${EQ('a<sub>00</sub> a<sub>11</sub> − a<sub>01</sub> a<sub>10</sub> = 0')}
<p>Twice the size of the left-hand side is called the <strong>concurrence</strong>. It runs from 0 for a product state to 1 for a maximally entangled state. Everything with a nonzero value is entangled, which is the subject of [[L:entanglement]].</p>
`,
  labs: {
    twoq: {
      title: 'Two qubits, side by side',
      cap: 'Bar height is probability and colour is phase. The small spheres show each qubit on its own. When the state is entangled, the individual Bloch vectors get shorter: part of the information now lives only in the pair.',
      build(body, id) {
        const q = [{ th: rad(90), ph: 0 }, { th: 0, ph: 0 }]; let cn = false;
        const barsEl = h('div'), bars = stateBars(barsEl, 2), formula = h('div', { class: 'readout' }), meter = h('div', { class: 'status' });
        const minis = [0, 1].map(i => { const c2 = canvas(); const v = new BlochView(c2, { labels: 'min', drag: false, trail: false }); return { c: c2, v, el: h('div', { class: 'mini' }, c2, 'qubit ' + i) }; });
        const upd = () => {
          const a = q.map(({ th, ph }) => [[Math.cos(th / 2), 0], [Math.sin(th / 2) * Math.cos(ph), Math.sin(th / 2) * Math.sin(ph)]]);
          const s = new QState(2);
          for (let i = 0; i < 4; i++) { const x = a[0][i >> 1], y = a[1][i & 1]; s.re[i] = x[0] * y[0] - x[1] * y[1]; s.im[i] = x[0] * y[1] + x[1] * y[0]; }
          const prod = s.clone(); if (cn) s.cx(0, 1);
          bars.state(s.re, s.im);
          const fq = k => ketString([a[k][0][0], a[k][1][0]], [a[k][0][1], a[k][1][1]], 1);
          formula.innerHTML = `<span class="k">qubit 0 </span>${fq(0)}<br><span class="k">qubit 1 </span>${fq(1)}<br><span class="k">product </span>${ketString(prod.re, prod.im, 2)}` + (cn ? `<br><span class="k">CNOT →  </span>${ketString(s.re, s.im, 2)}` : '');
          const dr = s.re[0] * s.re[3] - s.im[0] * s.im[3] - (s.re[1] * s.re[2] - s.im[1] * s.im[2]);
          const di = s.re[0] * s.im[3] + s.im[0] * s.re[3] - (s.re[1] * s.im[2] + s.im[1] * s.re[2]);
          const C = 2 * Math.hypot(dr, di);
          meter.className = 'status' + (C > .01 ? ' good' : ''); meter.textContent = C > .01 ? `Entangled. Concurrence ${num(C, 2)}.` : 'Product state. Concurrence 0.';
          minis.forEach((mn, i) => mn.v.go(s.bloch(i), 380));
        };
        const sl = (k, which, label, max, val) => slider({ id: id(which + k), label, min: 0, max, step: 1, value: val, fmt: v => v + '°', on: v => { q[k][which] = rad(v); upd(); } });
        const ctl = h('div', { class: 'stack' },
          h('div', { class: 'ctl-label' }, 'Qubit 0'), sl(0, 'th', 'θ₀', 180, 90), sl(0, 'ph', 'φ₀', 360, 0),
          h('div', { class: 'ctl-label' }, 'Qubit 1'), sl(1, 'th', 'θ₁', 180, 0), sl(1, 'ph', 'φ₁', 360, 0),
          field('Then apply', seg([{ v: false, label: 'Nothing' }, { v: true, label: 'CNOT, qubit 0 controls 1' }], false, v => { cn = v; upd(); }, 'Two-qubit gate')));
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, barsEl, h('div', { class: 'minis' }, minis.map(x => x.el)), meter, formula), ctl));
        upd();
      }
    }
  },
  take: ['n qubits have 2ⁿ basis states; their joint state is a vector of 2ⁿ amplitudes.',
    'Independent qubits combine by the tensor product.',
    'CNOT flips the target when the control is 1, and can create entanglement.',
    'A two-qubit state is a product exactly when a₀₀a₁₁ = a₀₁a₁₀.'],
  quiz: [
    { q: 'What is |1⟩ ⊗ |0⟩ written as one ket (left digit = qubit 0)?', o: ['|01⟩', '|10⟩', '|11⟩', '|1⟩ + |0⟩'], a: 1, why: 'The first factor is qubit 0, written on the left: |10⟩.' },
    { q: 'CNOT with qubit 0 as control acts on |+⟩ ⊗ |0⟩. What is the result?', o: ['|+⟩ ⊗ |+⟩', '(|00⟩ + |11⟩)/√2', '(|00⟩ + |10⟩)/√2', '|11⟩'], a: 1, why: '|+⟩|0⟩ = (|00⟩ + |10⟩)/√2, and CNOT turns |10⟩ into |11⟩. The result is the Bell state |Φ⁺⟩.' }
  ]
});

})();
