/* =====================================================================
   Stage 1 additions · complex numbers, Stern–Gerlach, linear algebra
   ===================================================================== */
(() => {
const ST = 0;
const polar = v => `${num(Math.hypot(v[0], v[1]), 2)} ∠ ${num(deg(Math.atan2(v[1], v[0])), 0)}°`;

/* ---------------- Complex numbers and phasors ---------------- */
LESSONS.push({
  id: 'complex', n: 1.5, stage: ST, minutes: 13, title: 'Complex numbers and phasors',
  lede: 'Quantum amplitudes are complex numbers. Picture each one as an arrow with a length and a direction, and the rules of quantum mechanics become rules about adding and turning arrows.',
  html: `
${NOTE('New to linear algebra?', `<p>The math toolkit at the start of the guide ([[TR:11]]) introduces vectors, matrices and the rest of the linear algebra used in these lessons, one idea at a time.</p>`)}
<h2>Why amplitudes need a direction</h2>
<p>A probability is a single non-negative number. An amplitude carries more: a size and a direction. Real numbers have only two directions, positive and negative, and that is enough for some interference effects. But quantum gates such as S and T turn amplitudes by 90° and 45°, and the time evolution of every physical system turns them continuously. The natural home for an amplitude is the <strong>complex plane</strong>.</p>
<h2>Numbers as arrows</h2>
<p>A complex number ${m('z = a + bi')} is a point in a plane: ${m('a')} along the real axis, ${m('b')} along the imaginary axis, where ${m('i² = −1')}. Draw an arrow from the origin to that point. Its length is the <strong>modulus</strong> ${m('|z| = √(a² + b²)')}, and its angle from the positive real axis is the <strong>argument</strong> or <strong>phase</strong> ${m('θ')}. Euler’s formula ties the two descriptions together:</p>
${EQ('e<sup>iθ</sup> = cos θ + i sin θ,&nbsp;&nbsp;&nbsp; z = |z| e<sup>iθ</sup>')}
<p>So ${m('e<sup>iθ</sup>')} is the arrow of length 1 at angle ${m('θ')}. As ${m('θ')} grows, it walks around the unit circle. ${m('e<sup>iπ/2</sup> = i')}, ${m('e<sup>iπ</sup> = −1')} and ${m('e<sup>2πi</sup> = 1')}.</p>
<h2>Multiplying turns and stretches</h2>
<p>Multiplication is where the polar form pays off. Multiply two complex numbers and their lengths multiply while their angles add: ${m('r₁e<sup>iθ₁</sup> · r₂e<sup>iθ₂</sup> = r₁r₂ e<sup>i(θ₁+θ₂)</sup>')}. Multiplying by ${m('i')} is a quarter turn. Multiplying by ${m('e<sup>iφ</sup>')} turns an arrow by ${m('φ')} without changing its length, which is exactly what a phase gate does to the ${m('|1⟩')} amplitude.</p>
<p>The <strong>complex conjugate</strong> ${m('z* = a − bi')} is the mirror image in the real axis, with the angle reversed. Multiplying a number by its own conjugate cancels the angle and leaves the squared length: ${m('z z* = |z|²')}. That is how probabilities come out of amplitudes.</p>
${LAB('plane')}
<h2>Adding is where interference happens</h2>
<p>When a quantum system can reach the same outcome in two indistinguishable ways, the two amplitudes add as arrows, tip to tail. The probability is the squared length of the sum:</p>
${EQ('|a + b|² = |a|² + |b|² + 2|a||b| cos Δθ')}
<p>The first two terms are what you would get by adding probabilities, as for two independent coin flips. The last term is <strong>interference</strong>. It depends only on the angle between the arrows, ${m('Δθ')}. Aligned arrows reinforce; opposite arrows cancel. With two equal arrows of length ½, the probability runs from 0 to 1 as ${m('Δθ')} goes from 180° to 0°. This is the photon interferometer of [[L:interference]] in one line of algebra.</p>
${LAB('phasors')}
<h2>Global phase and relative phase</h2>
<p>Turn every arrow in a state by the same angle and nothing measurable changes, because every probability is a squared length and every interference term depends only on angle differences. This common turn is a <strong>global phase</strong>, and physicists treat ${m('|ψ⟩')} and ${m('e<sup>iφ</sup>|ψ⟩')} as the same state. The angle between amplitudes, the <strong>relative phase</strong>, is physical: it decides how they interfere later. A single qubit therefore has two real numbers’ worth of freedom, which is why its states fit on the surface of a sphere ([[L:bloch]]).</p>
${NOTE('Reading the colours', `<p>Throughout this guide the colour of a bar shows the phase of its amplitude: blue for positive real numbers (0°), orange-red for negative ones (180°), and the hues in between for complex phases. A bar that changes colour has been turned; a bar that changes height has been stretched.</p>`)}
`,
  labs: {
    plane: {
      title: 'The complex plane',
      cap: 'Drag the copper arrow z and the blue arrow w, or use the buttons. In multiply mode the lengths multiply and the angles add, so multiplying by i turns z a quarter turn. In add mode the arrows go tip to tail. The conjugate mirrors z in the real axis.',
      build(body, id) {
        let z = [.9, .45], w = [.35, .8], mode = 'mul', G = null;
        const cv = canvas('sq', 'max-width:430px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const result = () => mode === 'add' ? [z[0] + w[0], z[1] + w[1]] : mode === 'mul' ? C2.mul(z, w) : [z[0], -z[1]];
        const p = painter(cv, ({ ctx, w: W, h: H }) => {
          const T = Theme.get(), S = Math.min(W, H) / 2 / 2.35, cx = W / 2, cy = H / 2; G = { S, cx, cy };
          const X = a => cx + a * S, Y = b => cy - b * S;
          ctx.lineWidth = 1;
          for (let k = -2; k <= 2; k++) { ctx.strokeStyle = k ? T.line : T.muted; ctx.globalAlpha = k ? .6 : .9; ctx.beginPath(); ctx.moveTo(X(k), Y(-2.3)); ctx.lineTo(X(k), Y(2.3)); ctx.moveTo(X(-2.3), Y(k)); ctx.lineTo(X(2.3), Y(k)); ctx.stroke(); }
          ctx.globalAlpha = 1; ctx.setLineDash([4, 4]); ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.arc(cx, cy, S, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          const f = '500 11px "JetBrains Mono",monospace';
          txt(ctx, 'Re', X(2.2), Y(0) - 10, { font: f }); txt(ctx, 'Im', X(0) + 14, Y(2.2), { font: f });
          txt(ctx, '1', X(1) + 7, Y(0) + 10, { font: f }); txt(ctx, 'i', X(0) + 8, Y(1) - 8, { font: f }); txt(ctx, MINUS + '1', X(-1) - 10, Y(0) + 10, { font: f }); txt(ctx, MINUS + 'i', X(0) + 11, Y(-1) + 9, { font: f });
          const r = result();
          if (mode === 'mul') {
            const arc = (v, rr, col) => { const a = Math.atan2(v[1], v[0]); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, rr * S, 0, -a, a > 0); ctx.stroke(); };
            arc(z, .3, T.copper); arc(w, .42, T.cyan); arc(r, .56, T.ink);
          }
          if (mode === 'add') { ctx.globalAlpha = .55; arrow(ctx, X(z[0]), Y(z[1]), X(r[0]), Y(r[1]), T.cyan, 2, 9); ctx.globalAlpha = 1; }
          arrow(ctx, cx, cy, X(z[0]), Y(z[1]), T.copper, 3, 11);
          if (mode !== 'conj') arrow(ctx, cx, cy, X(w[0]), Y(w[1]), T.cyan, 3, 11);
          if (Math.hypot(r[0], r[1]) > .02) arrow(ctx, cx, cy, X(clamp(r[0], -2.3, 2.3)), Y(clamp(r[1], -2.3, 2.3)), T.ink, 2.4, 10);
          dot(ctx, X(z[0]), Y(z[1]), 6, T.copper, T.surface); if (mode !== 'conj') dot(ctx, X(w[0]), Y(w[1]), 6, T.cyan, T.surface);
          const lab = (v, s, col) => txt(ctx, s, X(v[0]) + (v[0] >= 0 ? 16 : -16), Y(v[1]) - 12, { font: MATHFONT(16), color: col });
          lab(z, 'z', T.copper); if (mode !== 'conj') lab(w, 'w', T.cyan);
          lab([clamp(r[0], -2.2, 2.2), clamp(r[1], -2.2, 2.2)], mode === 'add' ? 'z + w' : mode === 'mul' ? 'z·w' : 'z*', T.ink);
        });
        const upd = () => {
          const r = result(), mz = Math.hypot(...z), mw = Math.hypot(...w);
          let s = `<span class="k">z   </span>= ${cfmt(z[0], z[1])} = ${polar(z)}<br>`;
          if (mode !== 'conj') s += `<span class="k">w   </span>= ${cfmt(w[0], w[1])} = ${polar(w)}<br>`;
          s += `<span class="k">${mode === 'add' ? 'z + w' : mode === 'mul' ? 'z · w' : 'z*   '} </span>= ${cfmt(r[0], r[1])} = ${polar(r)}`;
          if (mode === 'mul') s += `<br><span class="k">check </span>lengths ${num(mz, 2)} × ${num(mw, 2)} = ${num(mz * mw, 2)}, angles ${num(deg(Math.atan2(z[1], z[0])), 0)}° + ${num(deg(Math.atan2(w[1], w[0])), 0)}°`;
          if (mode === 'conj') s += `<br><span class="k">z · z* </span>= ${num(mz * mz, 3)} = |z|²`;
          ro.innerHTML = s; p.inv();
        };
        dragHandles(cv, (x, y) => {
          if (!G) return null; const pt = h2 => [G.cx + h2[0] * G.S, G.cy - h2[1] * G.S], dz = Math.hypot(x - pt(z)[0], y - pt(z)[1]), dw = Math.hypot(x - pt(w)[0], y - pt(w)[1]);
          return mode === 'conj' || dz <= dw ? 'z' : 'w';
        }, (k, x, y) => { const v = [clamp((x - G.cx) / G.S, -2.2, 2.2), clamp((G.cy - y) / G.S, -2.2, 2.2)]; if (k === 'z') z = v; else w = v; upd(); });
        const setW = v => { w = v; if (mode === 'conj') { mode = 'mul'; ms.set('mul'); } upd(); };
        const ms = seg([{ v: 'add', label: 'Add' }, { v: 'mul', label: 'Multiply' }, { v: 'conj', label: 'Conjugate' }], mode, v => { mode = v; upd(); }, 'Operation');
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, field('Operation', ms),
          field('Set w to', h('div', { class: 'btns' }, btn('i', () => setW([0, 1]), 'sm'), btn(MINUS + '1', () => setW([-1, 0]), 'sm'), btn('e^(iπ/4)', () => setW([S2, S2]), 'sm'), btn('½', () => setW([.5, 0]), 'sm'))), ro)));
        upd();
      }
    },
    phasors: {
      title: 'Two paths, two arrows',
      cap: 'Amplitude a (copper) and amplitude b (blue) are added tip to tail. The chart shows the probability |a + b|² against the angle between them; the dashed line is what adding probabilities would give. Switch on the spin to turn both arrows together: a global phase never changes the length of the sum.',
      build(body, id) {
        let dphi = PI / 3, r2 = .5, spin = false, g = 0, last = performance.now();
        const r1 = .5, cv = canvas('sq', 'max-width:330px;margin:0 auto'), ch = canvas('', 'height:220px'), ro = h('div', { class: 'chipline' });
        const P = d => r1 * r1 + r2 * r2 + 2 * r1 * r2 * Math.cos(d);
        const dia = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w, H) / 2 / 1.12, cx = w / 2, cy = H / 2;
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, S, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(cx - S, cy); ctx.lineTo(cx + S, cy); ctx.moveTo(cx, cy - S); ctx.lineTo(cx, cy + S); ctx.stroke(); ctx.globalAlpha = 1;
          const a = [r1 * Math.cos(g), r1 * Math.sin(g)], b = [r2 * Math.cos(g + dphi), r2 * Math.sin(g + dphi)], s = [a[0] + b[0], a[1] + b[1]];
          const X = v => cx + v * S, Y = v => cy - v * S;
          arrow(ctx, cx, cy, X(a[0]), Y(a[1]), T.copper, 3, 11);
          if (r2 > .01) arrow(ctx, X(a[0]), Y(a[1]), X(s[0]), Y(s[1]), T.cyan, 3, 11);
          if (Math.hypot(...s) > .015) arrow(ctx, cx, cy, X(s[0]), Y(s[1]), T.ink, 2, 9);
          txt(ctx, 'a + b', X(s[0] * 1.08) + 16, Y(s[1] * 1.08), { font: MATHFONT(15), color: T.ink });
        });
        const chart = painter(ch, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 360], y: [0, 1.12], xt: [0, 90, 180, 270, 360], yt: [0, .5, 1], xf: v => v + '°', yf: v => pct(v, 0), xl: 'angle between a and b', yl: '|a + b|²' });
          const pts = []; for (let k = 0; k <= 180; k++) { const d = k * 2; pts.push([A.X(d), A.Y(P(rad(d)))]); }
          polyline(ctx, [[A.X(0), A.Y(r1 * r1 + r2 * r2)], [A.X(360), A.Y(r1 * r1 + r2 * r2)]], T.muted, 1.5, [5, 4]);
          polyline(ctx, pts, T.cyan, 2.5);
          dot(ctx, A.X(deg(dphi)), A.Y(P(dphi)), 6, T.copper, T.surface);
        });
        Scope.tick(now => { const dt = now - last; last = now; if (spin && !reduced()) { g = (g + dt * .0012) % TAU; dia.inv(); } });
        const upd = () => {
          ro.innerHTML = `<span>|a|² <b>${num(r1 * r1, 3)}</b></span><span>|b|² <b>${num(r2 * r2, 3)}</b></span><span>interference <b>${num(2 * r1 * r2 * Math.cos(dphi), 3)}</b></span><span>|a + b|² <b>${num(P(dphi), 3)}</b></span>`;
          dia.inv(); chart.inv();
        };
        const spinBtn = btn('Spin both arrows', () => { spin = !spin; spinBtn.setAttribute('aria-pressed', String(spin)); spinBtn.textContent = spin ? 'Stop spinning' : 'Spin both arrows'; }, 'sm', { 'aria-pressed': 'false' });
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, ch,
          slider({ id: id('d'), label: 'Angle between a and b', min: 0, max: 360, step: 1, value: 60, fmt: v => v + '°', on: v => { dphi = rad(v); upd(); } }),
          slider({ id: id('r'), label: 'Length of b', min: 0, max: .5, step: .01, value: .5, fmt: v => num(v, 2), on: v => { r2 = v; upd(); } }),
          h('div', { class: 'btns' }, spinBtn), ro)));
        upd();
      }
    }
  },
  take: ['A complex number is an arrow: a length (modulus) and an angle (phase), with e^(iθ) the unit arrow at angle θ.',
    'Multiplying multiplies lengths and adds angles; multiplying by e^(iφ) is a pure turn, like a phase gate.',
    'Amplitudes for indistinguishable paths add as arrows, and |a + b|² contains an interference term 2|a||b|cos Δθ.',
    'Only relative phases are physical; a global phase turns every arrow together and changes nothing measurable.'],
  quiz: QZ([
    ['What is the modulus of z = 3 + 4i?', ['7', '5', '25', '1'], 1, 'The modulus is the length of the arrow, √(3² + 4²) = √25 = 5. The squared modulus, 25, would be the corresponding “probability weight” before normalization.'],
    ['Euler’s formula says e^(iθ) equals…', ['cos θ + i sin θ', 'sin θ + i cos θ', '1 + iθ', 'θ·i'], 0, 'e^(iθ) is the unit-length arrow at angle θ, whose real part is cos θ and imaginary part is sin θ. 1 + iθ is only its first-order approximation for small θ.'],
    ['What does multiplying a complex number by i do to its arrow?', ['Doubles its length', 'Turns it by 90° anticlockwise', 'Reflects it in the real axis', 'Turns it by 180°'], 1, 'i = e^(iπ/2) has length 1 and angle 90°. Multiplication adds angles and multiplies lengths, so the arrow turns a quarter turn and keeps its length.'],
    ['For z = r e^(iθ), what is z·z*?', ['r²', 'r² e^(2iθ)', '2r', '0'], 0, 'The conjugate z* = r e^(−iθ) has the opposite angle. Multiplying adds the angles to zero and multiplies the lengths, leaving the real number r². That is how |amplitude|² is computed.'],
    ['Two amplitudes of length ½ each point in opposite directions. What is the probability of the outcome they both lead to?', ['½', '¼', '0', '1'], 2, 'Opposite arrows cancel: the sum has length 0, so |a + b|² = 0. This is destructive interference, the effect behind the dark port of an interferometer.'],
    ['Two amplitudes of length ½ each point in the same direction. What is the probability of their shared outcome?', ['½', '1', '¼', '2'], 1, 'Aligned arrows add to an arrow of length 1, so the probability is 1. Adding the probabilities instead would give only ¼ + ¼ = ½; the extra ½ is the interference term 2|a||b|cos 0.'],
    ['Which change to a qubit state cannot be detected by any measurement?', ['Changing the relative phase between |0⟩ and |1⟩', 'Multiplying the whole state by e^(iφ)', 'Swapping the amplitudes of |0⟩ and |1⟩', 'Making the |1⟩ amplitude larger'], 1, 'A global phase turns every amplitude by the same angle. Squared lengths and angle differences are unchanged, so no probability in any basis changes. The other changes alter what some measurement would see.'],
    ['The T gate multiplies the |1⟩ amplitude by e^(iπ/4). What happens to the probability of measuring 1?', ['It is multiplied by e^(iπ/4)', 'It does not change', 'It drops by half', 'It becomes complex'], 1, 'Multiplying by a unit-length phase only turns the arrow, so |amplitude|² is unchanged. The phase still matters, because later gates can make it interfere.'],
    ['In |a + b|² = |a|² + |b|² + 2|a||b| cos Δθ, what does the last term represent?', ['Measurement noise', 'Interference between the two paths', 'The global phase', 'The normalization constant'], 1, 'The first two terms are what adding probabilities would give. The cross term depends on the angle between the arrows and can be positive or negative: that is interference.'],
    ['Why do quantum amplitudes need complex numbers rather than only real ones?', ['Probabilities can be negative', 'Physical evolution and gates turn amplitudes continuously, by any angle, not just between + and −', 'Complex numbers are easier to measure', 'Real numbers cannot be squared'], 1, 'Time evolution multiplies amplitudes by phases e^(−iEt) that sweep through every angle, and gates such as S and T apply 90° and 45° turns. Real numbers only allow 0° and 180°, which cannot describe these.']
  ])
});

/* ---------------- Stern–Gerlach ---------------- */
LESSONS.push({
  id: 'sterngerlach', n: 3.5, stage: ST, minutes: 14, title: 'Stern–Gerlach: spin in sequence',
  lede: 'In 1922 a beam of silver atoms split cleanly in two inside a magnet. Sending atoms through magnets in a row shows, with real hardware, everything the last lessons claimed about measurement.',
  html: `
<h2>Silver atoms and a magnet</h2>
<p>Otto Stern and Walther Gerlach heated silver in an oven, let the escaping atoms through a narrow slit, and passed the beam through a magnet whose field was much stronger near one pole than the other. In such an uneven field, a tiny magnet feels a sideways force proportional to the component of its magnetic moment along the field direction. Atoms leave the oven with their moments pointing every which way, so classical physics predicts a continuous band on the detector plate, from “pointing fully up” to “pointing fully down”.</p>
<p>The plate showed two separate spots and nothing in between. The magnetic moment along the field direction takes only two values. A few years later this was traced to the <strong>spin</strong> of silver’s single outer electron, an intrinsic angular momentum of ½ in units of ħ, which can only be found “up” or “down” along whatever axis you measure.</p>
${LAB('screen')}
<h2>Devices in a row</h2>
<p>Now take the atoms from the “up” spot of one magnet and send them into a second. The results are a direct experiment on the rules from [[L:measurement]]:</p>
<ul>
<li><strong>z, then z.</strong> Every atom comes out up again. A repeated measurement repeats its answer.</li>
<li><strong>z, then x.</strong> Turn the second magnet by 90°. The beam splits 50/50 between “x up” and “x down”. Knowing the spin along z tells you nothing about it along x.</li>
<li><strong>z, then x, then z.</strong> Keep only the “x up” atoms and measure z again. You might expect them all to be “z up”, since they were selected that way at the start. Instead they split 50/50. The x measurement erased the z information.</li>
</ul>
<p>The third result is the important one. It is not explained by clumsy magnets that knock atoms about: the same pattern appears however gently the experiment is done. Spin along z and spin along x are <strong>incompatible observables</strong>. A state can have a definite value of one or the other, never both, and measuring one prepares a state of definite value for it alone.</p>
<h2>Any angle</h2>
<p>Tilt the second magnet by an angle ${m('θ')} from the first. The fraction of “up” atoms that come out “up” again is</p>
${EQ('P(up) = cos²(θ/2)')}
<p>This is the Bloch-sphere rule. For spin-½, the direction of the spin in ordinary space <em>is</em> the Bloch vector: “up along z” is ${m('|0⟩')}, “down along z” is ${m('|1⟩')}, and “up along x” is ${m('|+⟩')}. A spin is a qubit you can point with a magnet.</p>
${LAB('chain')}
${NOTE('Why the angle is halved', `<p>Up and down along z are 180° apart in space, yet they are orthogonal states, as different as two states can be. Up along z and up along x are 90° apart in space, and they overlap with probability ½. The angle between state vectors in the qubit’s mathematical space is half the angle between the spin directions, which is why the formula has θ/2. [[L:linalg]] shows the same halving from the vector side.</p>`)}
<h2>From atoms to qubits</h2>
<p>Spin is now one of the main ways to build qubits. Electron spins trapped in silicon quantum dots are qubits in exactly this sense; they are read out not with a beam and a plate but by converting spin to charge, which a nearby sensor detects. Trapped-ion and neutral-atom qubits use pairs of atomic energy levels that behave in the same way. The mathematics on these pages does not care which.</p>
`,
  labs: {
    screen: {
      title: 'What the plate shows',
      cap: 'Atoms leave the oven with random orientations and cross the magnet (left, side view). On the plate (right, front view), a classical magnet would land anywhere in a band set by the vertical component of its moment. Silver atoms land in two spots, and the histogram at the far right has two peaks.',
      build(body, id) {
        let mode = 'q', hits = [], flying = [], auto = true, lastLaunch = 0;
        const cv = canvas('', 'height:270px'), ro = h('div', { class: 'chipline' });
        const launch = (n, now) => { for (let k = 0; k < n; k++) flying.push({ t0: now + k * 22, s: mode === 'q' ? (Math.random() < .5 ? 1 : -1) : 2 * Math.random() - 1, x: randn() * .33, j: randn() * .055 }); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), now = performance.now(), L = Math.round(w * .6), cy = H / 2, D = H * .3;
          const xo = 18, xs = 34, xm0 = L * .32, xm1 = L * .66, xp = L - 8;
          ctx.fillStyle = T.surface2; ctx.fillRect(xo - 10, cy - 18, 24, 36); ctx.strokeStyle = T.muted; ctx.strokeRect(xo - 10 + .5, cy - 18 + .5, 24, 36);
          txt(ctx, 'oven', xo + 2, cy + 30, { font: '500 10px "JetBrains Mono",monospace' });
          ctx.fillStyle = T.line; ctx.fillRect(xs, cy - 22, 3, 18); ctx.fillRect(xs, cy + 4, 3, 18);
          ctx.fillStyle = T.surface2; ctx.strokeStyle = T.muted;
          ctx.beginPath(); ctx.moveTo(xm0, cy - 52); ctx.lineTo(xm1, cy - 52); ctx.lineTo(xm1, cy - 30); ctx.lineTo((xm0 + xm1) / 2, cy - 14); ctx.lineTo(xm0, cy - 30); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(xm0, cy + 52); ctx.lineTo(xm1, cy + 52); ctx.lineTo(xm1, cy + 22); ctx.lineTo(xm0, cy + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
          txt(ctx, 'N', (xm0 + xm1) / 2, cy - 40, { font: '600 12px "JetBrains Mono",monospace', color: T.ink }); txt(ctx, 'S', (xm0 + xm1) / 2, cy + 38, { font: '600 12px "JetBrains Mono",monospace', color: T.ink });
          ctx.strokeStyle = T.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xp, cy - D - 30); ctx.lineTo(xp, cy + D + 30); ctx.stroke();
          txt(ctx, 'plate', xp - 18, cy + D + 38, { font: '500 10px "JetBrains Mono",monospace' });
          const yAt = (x, s) => x < xm0 ? cy : cy - s * D * ((x - xm0) / (xp - xm0)) ** 1.6;
          const keep = [];
          for (const a of flying) {
            const u = (now - a.t0) / 650; if (u < 0) { keep.push(a); continue; }
            if (u >= 1) { hits.push(a); continue; }
            const x = xo + u * (xp - xo); dot(ctx, x, yAt(x, a.s), 2.6, T.copper); keep.push(a);
          }
          flying = keep; if (hits.length > 4000) hits.splice(0, hits.length - 4000);
          const fx = L + 22, fw = w - L - 70, fcx = fx + fw / 2;
          ctx.fillStyle = T.surface2; ctx.fillRect(fx, cy - D - 30, fw, 2 * D + 60); ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.strokeRect(fx + .5, cy - D - 30 + .5, fw - 1, 2 * D + 59);
          txt(ctx, 'plate, front view', fcx, cy - D - 40, { font: '500 10px "JetBrains Mono",monospace' });
          const bins = new Array(30).fill(0);
          ctx.fillStyle = T.cyan; ctx.globalAlpha = .55;
          for (const a of hits) { const y = cy - a.s * D + a.j * H, x = fcx + a.x * fw * .38; if (y > cy - D - 28 && y < cy + D + 28) ctx.fillRect(x - 1, y - 1, 2.2, 2.2); const b = Math.floor((y - (cy - D - 30)) / ((2 * D + 60) / 30)); if (b >= 0 && b < 30) bins[b]++; }
          ctx.globalAlpha = 1;
          const mx = Math.max(1, ...bins), hx = w - 44;
          bins.forEach((v, b) => { const y0 = cy - D - 30 + b * (2 * D + 60) / 30; ctx.fillStyle = T.cyan; ctx.fillRect(hx, y0 + 1, v / mx * 40, (2 * D + 60) / 30 - 2); });
          if (flying.length) p.inv();
        });
        Scope.tick(now => { if (auto && !reduced() && now - lastLaunch > 90) { lastLaunch = now; launch(1, now); p.inv(); } });
        Scope.every(400, () => { const top = hits.filter(a => a.s > 0).length; ro.innerHTML = `<span>atoms on the plate <b>${hits.length}</b></span><span>upper half <b>${hits.length ? pct(top / hits.length, 0) : '—'}</b></span>`; });
        const autoBtn = btn('Pause beam', () => { auto = !auto; autoBtn.textContent = auto ? 'Pause beam' : 'Resume beam'; }, 'sm');
        body.append(cv, h('div', { class: 'btns' }, seg([{ v: 'c', label: 'Classical prediction' }, { v: 'q', label: 'Silver atoms (observed)' }], mode, v => { mode = v; hits = []; flying = []; p.inv(); }, 'What to show'),
          btn('Fire 200 atoms', () => { launch(200, performance.now()); p.inv(); }, 'pri sm'), autoBtn, btn('Clear plate', () => { hits = []; p.inv(); }, 'sm')), ro);
        if (reduced()) { auto = false; autoBtn.textContent = 'Resume beam'; for (let k = 0; k < 600; k++) hits.push({ s: Math.random() < .5 ? 1 : -1, x: randn() * .33, j: randn() * .055 }); }
      }
    },
    chain: {
      title: 'Magnets in a row',
      cap: 'Each device measures the spin along its own axis (0° is z, 90° is x) and splits the beam. The beam you choose continues; the other ends at a stopper. Atoms decide their outcome as they cross each device, using P(up) = cos²(Δθ/2), where Δθ is the angle between their current spin and the device axis.',
      build(body, id) {
        let nd = 3, ang = [0, 90, 0], pass = [0, 0], atoms = [], last = 0, running = true;
        const cnt = { in: 0, through: [0, 0, 0], up: 0, down: 0 };
        const cv = canvas('', 'height:250px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), ctl = h('div', { class: 'stack' });
        const reset = () => { atoms = []; cnt.in = 0; cnt.through = [0, 0, 0]; cnt.up = 0; cnt.down = 0; };
        const geo = (w, H) => {
          const s = Math.min(26, H * .1), xs = [], ys = []; let y = H / 2;
          for (let k = 0; k < nd; k++) { xs.push(nd === 1 ? w * .45 : w * (.2 + k * .58 / (nd - 1))); ys.push(y); if (k < nd - 1) y += pass[k] ? s : -s; }
          const off = H / 2 - (Math.min(...ys) + Math.max(...ys)) / 2; for (let k = 0; k < nd; k++) ys[k] += off;
          return { s, xs, ys, x0: 26, xe: w - 34, dw: Math.min(54, w * .09) };
        };
        const yOf = (a, x, G) => {
          let y = G.ys[0];
          for (let k = 0; k < nd; k++) {
            const xa = G.xs[k] + G.dw / 2; if (x <= xa || a.outs[k] == null) return y;
            const o = a.outs[k], xb = k < nd - 1 ? G.xs[k + 1] - G.dw / 2 : G.xe, yb = G.ys[k] + (o ? G.s : -G.s) * (k < nd - 1 && o === pass[k] ? 1 : 1.25);
            if (x <= xb) return lerp(G.ys[k], yb, (x - xa) / (xb - xa));
            y = yb;
          }
          return y;
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), G = geo(w, H), now = performance.now(), dt = Math.min(50, now - (p.t || now)); p.t = now;
          ctx.fillStyle = T.surface2; ctx.fillRect(4, G.ys[0] - 14, 22, 28); txt(ctx, 'oven', 15, G.ys[0] + 26, { font: '500 10px "JetBrains Mono",monospace' });
          ctx.lineWidth = 1.5; ctx.strokeStyle = T.line;
          for (let k = 0; k < nd; k++) {
            const xa = G.xs[k] + G.dw / 2, xb = k < nd - 1 ? G.xs[k + 1] - G.dw / 2 : G.xe;
            for (const o of [0, 1]) {
              const blocked = k < nd - 1 && o !== pass[k], yb = G.ys[k] + (o ? G.s : -G.s) * (blocked ? 1.25 : 1), xe = blocked ? lerp(xa, xb, .45) : xb;
              ctx.strokeStyle = blocked ? T.line : T.muted; ctx.beginPath(); ctx.moveTo(xa, G.ys[k]); ctx.lineTo(xe, lerp(G.ys[k], yb, (xe - xa) / (xb - xa))); ctx.stroke();
              if (blocked) { ctx.fillStyle = T.ink; ctx.fillRect(xe, lerp(G.ys[k], yb, (xe - xa) / (xb - xa)) - 7, 4, 14); }
            }
          }
          ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.moveTo(26, G.ys[0]); ctx.lineTo(G.xs[0] - G.dw / 2, G.ys[0]); ctx.stroke();
          for (let k = 0; k < nd; k++) {
            const x = G.xs[k], y = G.ys[k];
            ctx.fillStyle = T.surface; ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.fillRect(x - G.dw / 2, y - 22, G.dw, 44); ctx.strokeRect(x - G.dw / 2 + .5, y - 22 + .5, G.dw - 1, 43);
            const a = rad(ang[k]); arrow(ctx, x - 9 * Math.sin(a), y + 9 * Math.cos(a), x + 11 * Math.sin(a), y - 11 * Math.cos(a), T.copper, 2, 7);
            txt(ctx, ang[k] + '°', x, y + 34, { font: '600 11px "JetBrains Mono",monospace', color: T.ink });
          }
          const xl = G.xe; for (const o of [0, 1]) { const y = G.ys[nd - 1] + (o ? G.s : -G.s) * 1.25; ctx.fillStyle = o ? T.cyan : T.copper; ctx.fillRect(xl, y - 10, 8, 20); txt(ctx, o ? String(cnt.down) : String(cnt.up), xl + 20, y, { font: '600 11px "JetBrains Mono",monospace', color: T.ink, align: 'left' }); }
          const v = (G.xe - G.x0) / 1500, keep = [];
          for (const a of atoms) {
            a.x += v * dt;
            for (let k = 0; k < nd; k++) if (a.outs[k] == null && a.x >= G.xs[k] && !a.dead) {
              const pu = Math.cos((a.al - rad(ang[k])) / 2) ** 2, o = Math.random() < pu ? 0 : 1; a.outs[k] = o; a.al = rad(ang[k]) + (o ? PI : 0);
              if (k < nd - 1) { if (o !== pass[k]) a.stopX = lerp(G.xs[k] + G.dw / 2, G.xs[k + 1] - G.dw / 2, .45); else cnt.through[k]++; }
            }
            if (a.stopX != null && a.x >= a.stopX) continue;
            if (a.x >= G.xe) { if (a.outs[nd - 1]) cnt.down++; else cnt.up++; continue; }
            dot(ctx, a.x, yOf(a, a.x, G), 2.8, a.outs.filter(o => o != null).length ? (a.outs[a.outs.length - 1] ? T.cyan : T.copper) : T.muted);
            keep.push(a);
          }
          atoms = keep; if (atoms.length) p.inv();
        });
        const spawn = () => { atoms.push({ x: 26, al: Math.random() * TAU, outs: new Array(nd).fill(null) }); cnt.in++; };
        Scope.tick(now => { if (running && now - last > (reduced() ? 1e9 : 60)) { last = now; spawn(); p.inv(); } });
        const predict = () => {
          let reach = .5, up = .5;
          for (let k = 1; k < nd; k++) { const al = rad(ang[k - 1]) + (pass[k - 1] ? PI : 0), pu = Math.cos((al - rad(ang[k])) / 2) ** 2; if (k < nd - 1) reach *= pass[k] ? 1 - pu : pu; else up = pu; }
          if (nd === 1) up = .5; return { up, reach };
        };
        Scope.every(300, () => {
          const tot = cnt.up + cnt.down, pr = predict();
          let s = `<span class="k">atoms from the oven  </span>${cnt.in}<br>`;
          for (let k = 0; k < nd - 1; k++) s += `<span class="k">passed device ${k + 1} (${pass[k] ? 'down' : 'up'} beam) </span>${cnt.through[k]}<br>`;
          s += `<span class="k">last device: up / down </span>${cnt.up} / ${cnt.down}${tot ? ` &nbsp;(${pct(cnt.up / tot, 0)} up)` : ''}<br><span class="k">prediction             </span>${pct(pr.up, 0)} up`;
          ro.innerHTML = s;
        });
        const buildCtl = () => {
          ctl.innerHTML = '';
          ctl.append(field('Number of devices', seg([1, 2, 3].map(v => ({ v, label: String(v) })), nd, v => { nd = v; while (ang.length < 3) ang.push(0); reset(); buildCtl(); p.inv(); }, 'Number of devices')));
          for (let k = 0; k < nd; k++) {
            ctl.append(slider({ id: id('a' + k), label: `Device ${k + 1} axis`, min: 0, max: 360, step: 15, value: ang[k], fmt: v => v + '°', on: v => { ang[k] = v; reset(); p.inv(); } }));
            if (k < nd - 1) ctl.append(field(`Keep from device ${k + 1}`, seg([{ v: 0, label: 'Up beam' }, { v: 1, label: 'Down beam' }], pass[k], v => { pass[k] = v; reset(); p.inv(); }, `Beam kept after device ${k + 1}`)));
          }
        };
        const preset = (a, ps) => { nd = a.length; ang = a.concat([0, 0, 0]).slice(0, 3); pass = ps.concat([0, 0]).slice(0, 2); reset(); buildCtl(); p.inv(); };
        const runBtn = btn('Pause', () => { running = !running; runBtn.textContent = running ? 'Pause' : 'Resume'; }, 'sm');
        body.append(cv, h('div', { class: 'btns' }, btn('z then z', () => preset([0, 0], [0]), 'sm'), btn('z then x', () => preset([0, 90], [0]), 'sm'), btn('z, x, z', () => preset([0, 90, 0], [0, 0]), 'sm'), btn('z then 60°', () => preset([0, 60], [0]), 'sm'), btn('Fire 50 atoms', () => { for (let k = 0; k < 50; k++) Scope.later(k * 40, spawn); }, 'sm'), runBtn),
          h('div', { class: 'split' }, ctl, ro));
        buildCtl(); if (reduced()) { running = false; runBtn.textContent = 'Resume'; }
      }
    }
  },
  take: ['A Stern–Gerlach magnet sorts spin-½ particles into exactly two beams: the spin along any axis is found only up or down.',
    'Repeating a measurement along the same axis repeats the result; measuring along a perpendicular axis gives 50/50.',
    'Measuring x after z erases the z information: incompatible observables cannot both have definite values.',
    'For a device tilted by θ, P(up) = cos²(θ/2): the spin direction in space is the qubit’s Bloch vector.'],
  quiz: QZ([
    ['What did classical physics predict for the Stern–Gerlach plate?', ['Two spots', 'A continuous band', 'Nothing, because neutral atoms feel no force', 'One spot in the centre'], 1, 'Atoms leave the oven with randomly oriented moments, and the deflection is proportional to the component along the field. Classically that component can take any value between the extremes, so the hits should form a continuous band.'],
    ['What did Stern and Gerlach actually observe with silver atoms?', ['A continuous band', 'Two separate spots', 'Three spots', 'A ring'], 1, 'The beam split into two spots. The magnetic moment along the field takes only two values, which was later traced to the spin-½ of silver’s outer electron.'],
    ['Atoms selected as “up along z” enter a second magnet also oriented along z. What fraction comes out up?', ['50%', '100%', '0%', '25%'], 1, 'A state with a definite value along z keeps it: repeating the same measurement gives the same answer every time.'],
    ['Atoms selected as “up along z” enter a magnet oriented along x. What happens?', ['All go x-up', 'All go x-down', 'They split 50/50', 'They are absorbed'], 2, '“Up along z” is |0⟩, which is an equal superposition of |+⟩ and |−⟩. On the Bloch sphere the x axis is 90° from z, so P = cos²(45°) = ½.'],
    ['In the sequence z → keep up → x → keep up → z, what fraction of atoms reaching the last magnet comes out z-up?', ['100%', '50%', '0%', '75%'], 1, 'After the x measurement the atoms are in |+⟩, a state with no memory of the earlier z result. Measuring z on |+⟩ gives 50/50. The intermediate measurement erased the z information.'],
    ['A second magnet is tilted 60° from the first. What fraction of “up” atoms comes out up again?', ['50%', '75%', '25%', '87%'], 1, 'P(up) = cos²(θ/2) = cos²(30°) = 3/4. Halving the angle is the hallmark of spin-½.'],
    ['Up and down along z are 180° apart in space. What is the angle between the corresponding state vectors in the qubit’s state space?', ['180°', '90°', '360°', '45°'], 1, 'They are orthogonal states, which is 90° in state space. The state-space angle is always half the angle between spin directions.'],
    ['Which statement best explains the z, x, z result?', ['The magnets are too strong and scramble the atoms', 'Spin along z and spin along x are incompatible observables; measuring one prepares a state with no definite value of the other', 'The atoms remember their original z value but hide it', 'Silver atoms lose their spin in the second magnet'], 1, 'The effect persists however gently the measurement is made. It is a property of quantum states, not of clumsy apparatus: no state has definite values of both.'],
    ['How is the spin direction of a spin-½ particle related to the Bloch sphere?', ['It is unrelated', 'The spin direction in ordinary space is the Bloch vector', 'The Bloch vector is always along z', 'The spin points opposite to the Bloch vector by convention'], 1, 'For spin-½ the identification is exact: up along z is |0⟩, up along x is |+⟩, and so on. That is why the Bloch-sphere rule predicts every Stern–Gerlach outcome.'],
    ['Which present-day qubit is most directly an electron spin?', ['A transmon', 'A spin qubit in a silicon quantum dot', 'A photon’s polarization', 'A superconducting resonator'], 1, 'Silicon spin qubits store information in the spin of a single trapped electron (or hole), read out by spin-to-charge conversion. Transmons use circuit energy levels, and photons use polarization or path.']
  ])
});

/* ---------------- Linear algebra for qubits ---------------- */
LESSONS.push({
  id: 'linalg', n: 4.5, stage: ST, minutes: 16, title: 'Vectors and matrices: the qubit’s algebra',
  lede: 'States are vectors, measurements are projections, gates are matrices and observables are matrices with special properties. This lesson builds the toolkit the rest of the guide quietly relies on.',
  html: `
${NOTE('Want more depth?', `<p>This lesson is a compact summary. The math toolkit at the start of the guide ([[TR:11]]) builds each idea here from scratch, with its own labs: vectors and bases, inner products, matrices, eigenvalues, unitary and Hermitian matrices, tensor products, projectors and the trace, matrix exponentials and the singular value decomposition.</p>`)}
<h2>States are vectors</h2>
<p>The state ${m('|ψ⟩ = α|0⟩ + β|1⟩')} is a column of two complex numbers, with the basis states as the two unit columns:</p>
${EQ(`|ψ⟩ = ${MX([['α'], ['β']])},&nbsp;&nbsp; |0⟩ = ${MX([['1'], ['0']])},&nbsp;&nbsp; |1⟩ = ${MX([['0'], ['1']])}`)}
<p>The <strong>bra</strong> ${m('⟨φ|')} is the row you get by transposing a ket and conjugating each entry. A bra times a ket is a single complex number, the <strong>inner product</strong> ${m('⟨φ|ψ⟩ = φ₀*ψ₀ + φ₁*ψ₁')}. It measures how much two states overlap. Every state has ${m('⟨ψ|ψ⟩ = 1')}, and two states are <strong>orthogonal</strong> when ${m('⟨φ|ψ⟩ = 0')}: then no measurement confuses them.</p>
<h2>Measuring is projecting</h2>
<p>The Born rule in its general form says: pick any orthonormal basis ${m('{|b₀⟩, |b₁⟩}')}; measuring in that basis gives outcome ${m('k')} with probability</p>
${EQ('P(k) = |⟨b<sub>k</sub>|ψ⟩|²')}
<p>Geometrically, drop a perpendicular from the tip of ${m('|ψ⟩')} onto each basis direction. The lengths of the shadows are the amplitudes in the new basis, and their squares are the probabilities. Writing the same state in a different basis is a <strong>change of basis</strong>: the vector does not move, only the axes you describe it with. The lab uses real amplitudes, so the state space can be drawn as an ordinary plane.</p>
${LAB('project')}
${NOTE('Two pictures of one qubit', `<p>In the plane, ${m('|0⟩')} and ${m('|1⟩')} are 90° apart, and ${m('|+⟩')} sits at 45°. On the Bloch sphere the same states are 180° and 90° apart. Every angle in the plane is doubled on the sphere. Both pictures are correct; the plane shows amplitudes, the sphere shows measurable directions.</p>`)}
<h2>Gates are matrices</h2>
<p>A gate is a 2 × 2 matrix acting on the column. Its first column is where it sends ${m('|0⟩')} and its second column is where it sends ${m('|1⟩')}. For example:</p>
${EQ(`X = ${MX([['0', '1'], ['1', '0']])},&nbsp; Z = ${MX([['1', '0'], ['0', MINUS + '1']])},&nbsp; H = ${FR('1', '√2')}${MX([['1', '1'], ['1', MINUS + '1']])}`)}
<p>Quantum gates are <strong>unitary</strong>: ${m('U†U = I')}, where the dagger means conjugate transpose. Unitary matrices preserve every inner product, so lengths stay 1 and orthogonal states stay orthogonal. Equivalently, their columns are orthonormal. Unitaries are the rotations of state space, and every one has an inverse, ${m('U†')}.</p>
<h2>Observables, eigenvalues and expectation values</h2>
<p>A measurable quantity is represented by a <strong>Hermitian</strong> matrix, one equal to its own conjugate transpose, ${m('A = A†')}. Hermitian matrices have real <strong>eigenvalues</strong> and orthogonal <strong>eigenvectors</strong>: special directions that the matrix only stretches, ${m('A|k⟩ = λ<sub>k</sub>|k⟩')}. The eigenvalues are the possible measurement results and the eigenvectors are the states that give each result with certainty. Every Hermitian matrix can be written as</p>
${EQ('A = Σ<sub>k</sub> λ<sub>k</sub> |k⟩⟨k|,&nbsp;&nbsp;&nbsp; ⟨A⟩ = ⟨ψ|A|ψ⟩ = Σ<sub>k</sub> λ<sub>k</sub> |⟨k|ψ⟩|²')}
<p>The matrices ${m('|k⟩⟨k|')} are <strong>projectors</strong>: they keep the part of a vector along ${m('|k⟩')} and discard the rest. The <strong>expectation value</strong> ${m('⟨A⟩')} is the average result over many repetitions. ${m('Z')} has eigenvalues ${m('+1')} and ${m('−1')} with eigenvectors ${m('|0⟩')} and ${m('|1⟩')}; ${m('X')} has the same eigenvalues with eigenvectors ${m('|+⟩')} and ${m('|−⟩')}. The Pauli matrices are both Hermitian and unitary, which is why they appear as both observables and gates.</p>
${LAB('matrix')}
<h2>Tensor products</h2>
<p>Two qubits live in a four-dimensional space whose basis is ${m('|00⟩, |01⟩, |10⟩, |11⟩')}. Independent states combine by the <strong>tensor product</strong>: multiply every amplitude of the first by every amplitude of the second:</p>
${EQ('(α|0⟩ + β|1⟩) ⊗ (γ|0⟩ + δ|1⟩) = αγ|00⟩ + αδ|01⟩ + βγ|10⟩ + βδ|11⟩')}
<p>Operators combine the same way: ${m('X ⊗ I')} flips the first qubit and leaves the second alone. Dimensions multiply, so ${m('n')} qubits need ${m('2ⁿ')} amplitudes. A state that cannot be written as a single tensor product is entangled ([[L:entanglement]]).</p>
`,
  labs: {
    project: {
      title: 'Measuring in any basis',
      cap: 'The state |ψ⟩ = cos θ |0⟩ + sin θ |1⟩ (copper) and a measurement basis rotated by φ (blue). Dashed lines drop perpendiculars onto the two basis directions; their lengths are the amplitudes ⟨b₀|ψ⟩ and ⟨b₁|ψ⟩. The small sphere shows the same state and basis axis with every angle doubled. Drag either arrow.',
      build(body, id) {
        let th = rad(30), ph = rad(0), G = null;
        const cv = canvas('sq', 'max-width:400px;margin:0 auto'), bs = canvas('sq', 'max-width:190px;margin:0 auto'), bv = new BlochView(bs, { labels: 'min', drag: true, trail: false });
        const bars = h('div'), b = new Bars(bars, ['|b₀⟩', '|b₁⟩'], { height: 120 }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w, H) / 2 * .8, cx = w / 2, cy = H / 2; G = { S, cx, cy };
          const P = (a, r = 1) => [cx + r * S * Math.cos(a), cy - r * S * Math.sin(a)];
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, S, 0, TAU); ctx.stroke();
          ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(cx - S * 1.15, cy); ctx.lineTo(cx + S * 1.15, cy); ctx.moveTo(cx, cy - S * 1.15); ctx.lineTo(cx, cy + S * 1.15); ctx.stroke(); ctx.globalAlpha = 1;
          txt(ctx, '|0⟩', cx + S * 1.06, cy + 15, { font: MATHFONT(14), color: T.muted }); txt(ctx, '|1⟩', cx - 18, cy - S * 1.06, { font: MATHFONT(14), color: T.muted });
          for (const [a, lab] of [[ph, '|b₀⟩'], [ph + PI / 2, '|b₁⟩']]) {
            const e = P(a), f = P(a + PI); ctx.strokeStyle = T.cyan; ctx.globalAlpha = .45; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...f); ctx.lineTo(...e); ctx.stroke(); ctx.globalAlpha = 1;
            arrow(ctx, cx, cy, ...e, T.cyan, 2.5, 10); txt(ctx, lab, ...P(a, 1.16), { font: MATHFONT(15), color: T.cyan });
            const amp = Math.cos(th - a), foot = P(a, amp), tip = P(th);
            ctx.setLineDash([4, 4]); ctx.strokeStyle = T.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...tip); ctx.lineTo(...foot); ctx.stroke(); ctx.setLineDash([]);
            ctx.strokeStyle = T.copper; ctx.lineWidth = 5; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(...foot); ctx.stroke(); ctx.globalAlpha = 1;
          }
          arrow(ctx, cx, cy, ...P(th), T.copper, 3.2, 12); dot(ctx, ...P(th), 6, T.copper, T.surface);
          txt(ctx, '|ψ⟩', ...P(th, 1.14), { font: MATHFONT(17), color: T.copper });
        });
        const upd = () => {
          const a0 = Math.cos(th - ph), a1 = Math.sin(th - ph);
          b.set([a0 * a0, a1 * a1], { colors: [phaseColor(a0 >= 0 ? 0 : PI), phaseColor(a1 >= 0 ? 0 : PI)], texts: [pct(a0 * a0, 0), pct(a1 * a1, 0)] });
          ro.innerHTML = `<span class="k">in the 0/1 basis  </span>|ψ⟩ = ${num(Math.cos(th), 3)} |0⟩ + ${num(Math.sin(th), 3)} |1⟩<br><span class="k">in the b basis    </span>|ψ⟩ = ${num(a0, 3)} |b₀⟩ + ${num(a1, 3)} |b₁⟩<br><span class="k">angle in the plane </span>${num(deg(th - ph), 0)}° &nbsp;→&nbsp; on the sphere ${num(deg(2 * (th - ph)), 0)}°`;
          bv.set([Math.sin(2 * th), 0, Math.cos(2 * th)]); bv.target = [Math.sin(2 * ph), 0, Math.cos(2 * ph)]; bv.extra = [{ v: [-Math.sin(2 * ph), 0, -Math.cos(2 * ph)], r: 4, color: Theme.get().cyan }]; bv.inv(); p.inv();
        };
        dragHandles(cv, (x, y) => {
          if (!G) return null; const a = Math.atan2(G.cy - y, x - G.cx), dpsi = Math.abs(Math.atan2(Math.sin(a - th), Math.cos(a - th)));
          let db = PI, bk = 0; for (const k of [0, 1, 2, 3]) { const d = Math.abs(Math.atan2(Math.sin(a - ph - k * PI / 2), Math.cos(a - ph - k * PI / 2))); if (d < db) { db = d; bk = k; } }
          return dpsi <= db ? 'psi' : bk;
        }, (k, x, y) => { const a = Math.atan2(G.cy - y, x - G.cx); if (k === 'psi') th = a; else { ph = a - k * PI / 2; ph = Math.atan2(Math.sin(ph), Math.cos(ph)); } upd(); });
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, h('div', { class: 'split even' }, bars, bs),
          h('div', { class: 'btns' }, btn('Z basis', () => { ph = 0; upd(); }, 'sm'), btn('X basis', () => { ph = PI / 4; upd(); }, 'sm'), btn('ψ = |+⟩', () => { th = PI / 4; upd(); }, 'sm'), btn('ψ = −|0⟩', () => { th = PI; upd(); }, 'sm')), ro)));
        upd();
      }
    },
    matrix: {
      title: 'What a matrix does to the plane',
      cap: 'The dashed circle holds every real unit vector; the copper curve is its image under the matrix. Blue lines are eigenvector directions, which the matrix only stretches (by the eigenvalue). Drag the test vector v to see Av. Unitary matrices map the circle to itself; Hermitian ones have perpendicular eigenvectors and real eigenvalues.',
      build(body, id) {
        const PRE = { Z: [1, 0, 0, -1], X: [0, 1, 1, 0], H: [S2, S2, S2, -S2], 'Rotate 30°': [Math.cos(PI / 6), -Math.sin(PI / 6), Math.sin(PI / 6), Math.cos(PI / 6)], 'Observable': [.8, .5, .5, -.4], 'Stretch': [1.4, .3, .3, .6] };
        let A = PRE.Observable.slice(), name = 'Observable', v = [Math.cos(.9), Math.sin(.9)], G = null;
        const cv = canvas('sq', 'max-width:400px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), sl = h('div', { class: 'stack' });
        const eig = () => {
          const [a, b, c2, d] = A, tr = a + d, det = a * d - b * c2, disc = tr * tr / 4 - det;
          if (disc < -1e-12) return { complex: true, re: tr / 2, im: Math.sqrt(-disc) };
          const l1 = tr / 2 + Math.sqrt(Math.max(0, disc)), l2 = tr / 2 - Math.sqrt(Math.max(0, disc));
          const vec = l => Math.abs(b) > 1e-9 ? V.unit([b, l - a, 0]) : Math.abs(c2) > 1e-9 ? V.unit([l - d, c2, 0]) : (Math.abs(l - a) < 1e-9 ? [1, 0, 0] : [0, 1, 0]);
          return { complex: false, l: [l1, l2], v: [vec(l1), vec(l2)] };
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w, H) / 2 / 1.75, cx = w / 2, cy = H / 2; G = { S, cx, cy };
          const X = x => cx + x * S, Y = y => cy - y * S, mul = u => [A[0] * u[0] + A[1] * u[1], A[2] * u[0] + A[3] * u[1]];
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(X(-1.7), Y(0)); ctx.lineTo(X(1.7), Y(0)); ctx.moveTo(X(0), Y(-1.7)); ctx.lineTo(X(0), Y(1.7)); ctx.stroke(); ctx.globalAlpha = 1;
          ctx.setLineDash([4, 4]); ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.arc(cx, cy, S, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          const e = eig();
          if (!e.complex) for (let k = 0; k < 2; k++) { const u = e.v[k]; ctx.strokeStyle = T.cyan; ctx.lineWidth = 1.5; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(X(-1.7 * u[0]), Y(-1.7 * u[1])); ctx.lineTo(X(1.7 * u[0]), Y(1.7 * u[1])); ctx.stroke(); ctx.globalAlpha = 1; }
          const pts = []; for (let k = 0; k <= 120; k++) { const t = k / 120 * TAU, q = mul([Math.cos(t), Math.sin(t)]); pts.push([X(q[0]), Y(q[1])]); }
          polyline(ctx, pts, T.copper, 2.4);
          for (let k = 0; k < 12; k++) { const t = k / 12 * TAU, u = [Math.cos(t), Math.sin(t)], q = mul(u); ctx.globalAlpha = .35; arrow(ctx, X(u[0]), Y(u[1]), X(q[0]), Y(q[1]), T.muted, 1, 6); ctx.globalAlpha = 1; }
          const Av = mul(v); arrow(ctx, cx, cy, X(v[0]), Y(v[1]), T.ink, 2.4, 10); arrow(ctx, cx, cy, X(clamp(Av[0], -1.7, 1.7)), Y(clamp(Av[1], -1.7, 1.7)), T.copper, 3, 11);
          dot(ctx, X(v[0]), Y(v[1]), 6, T.ink, T.surface);
          txt(ctx, 'v', X(v[0] * 1.18), Y(v[1] * 1.18), { font: MATHFONT(16), color: T.ink }); txt(ctx, 'Av', X(clamp(Av[0], -1.6, 1.6) * 1.1) + 10, Y(clamp(Av[1], -1.6, 1.6) * 1.1), { font: MATHFONT(16), color: T.copper });
        });
        const upd = () => {
          const [a, b, c2, d] = A, e = eig(), herm = Math.abs(b - c2) < 1e-9, uni = Math.abs(a * a + c2 * c2 - 1) < 1e-6 && Math.abs(b * b + d * d - 1) < 1e-6 && Math.abs(a * b + c2 * d) < 1e-6;
          const ex = v[0] * (a * v[0] + b * v[1]) + v[1] * (c2 * v[0] + d * v[1]);
          let s = `<span class="k">A </span>= [[${num(a, 2)}, ${num(b, 2)}], [${num(c2, 2)}, ${num(d, 2)}]]<br><span class="k">Hermitian </span>${herm ? 'yes' : 'no'} &nbsp; <span class="k">unitary </span>${uni ? 'yes' : 'no'}<br>`;
          s += e.complex ? `<span class="k">eigenvalues </span>${num(e.re, 3)} ± ${num(e.im, 3)}i: no real eigenvector, every direction turns<br>` : `<span class="k">eigenvalues </span>${num(e.l[0], 3)} and ${num(e.l[1], 3)}<br>`;
          s += `<span class="k">⟨v|A|v⟩ </span>${num(ex, 3)}${herm ? ' (expectation value for state v)' : ''}`;
          ro.innerHTML = s; p.inv();
        };
        const sliders = () => {
          sl.innerHTML = '';
          if (name !== 'Custom') return;
          [['a', 0], ['b', 1], ['d', 3]].forEach(([lab, k]) => sl.append(slider({ id: id('m' + lab), label: lab === 'b' ? 'Off-diagonal b (both corners)' : `Diagonal ${lab}`, min: -1.5, max: 1.5, step: .05, value: A[k], fmt: v2 => num(v2, 2), on: v2 => { A[k] = v2; if (k === 1) A[2] = v2; upd(); } })));
        };
        dragHandles(cv, () => 'v', (k, x, y) => { const u = [(x - G.cx) / G.S, (G.cy - y) / G.S], r = Math.hypot(...u) || 1; v = [u[0] / r, u[1] / r]; upd(); });
        const names = Object.keys(PRE).concat(['Custom']);
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, field('Matrix', h('div', { class: 'btns' }, ...names.map(nm => btn(nm, () => { name = nm; if (PRE[nm]) A = PRE[nm].slice(); else A = [1, .4, .4, -.5]; sliders(); upd(); }, 'sm')))), sl, ro)));
        sliders(); upd();
      }
    }
  },
  take: ['A ket is a column vector, a bra is its conjugate transpose, and ⟨φ|ψ⟩ measures overlap; orthogonal states have zero overlap.',
    'Measuring in a basis {|b_k⟩} gives outcome k with probability |⟨b_k|ψ⟩|²: the squared length of a projection.',
    'Gates are unitary matrices (U†U = I) that preserve lengths and angles; observables are Hermitian matrices whose eigenvalues are the possible results.',
    'Composite systems use tensor products, so dimensions multiply: n qubits need 2ⁿ amplitudes.'],
  quiz: QZ([
    ['What is ⟨0|1⟩?', ['1', '0', '1/√2', 'i'], 1, '|0⟩ = (1, 0) and |1⟩ = (0, 1). Their inner product is 1·0 + 0·1 = 0: the basis states are orthogonal, which is why a Z measurement never confuses them.'],
    ['What is the probability of outcome + when |0⟩ is measured in the X basis {|+⟩, |−⟩}?', ['0', '½', '1', '1/√2'], 1, '⟨+|0⟩ = (1/√2)(1·1 + 1·0) = 1/√2, and its square is ½. The amplitude is 1/√2, but the probability is its squared magnitude.'],
    ['Which property defines a unitary matrix U?', ['U = U†', 'U†U = I', 'All entries are real', 'Its determinant is 0'], 1, 'U†U = I means U preserves inner products, so normalized states stay normalized. U = U† is the Hermitian condition, which describes observables.'],
    ['The first column of a gate’s matrix tells you…', ['Where the gate sends |0⟩', 'Where it sends |1⟩', 'Its eigenvalues', 'Its determinant'], 0, 'Multiplying the matrix by (1, 0) picks out the first column, so that column is the image of |0⟩. The second column is the image of |1⟩.'],
    ['Why must observables be Hermitian?', ['So their eigenvalues are real, matching real measurement results', 'So they can be applied as gates', 'So they commute with every gate', 'So they have determinant 1'], 0, 'Measurement results are real numbers. Hermitian matrices are exactly the ones guaranteed to have real eigenvalues and an orthonormal set of eigenvectors, one for each result.'],
    ['What are the eigenvalues of the Pauli X matrix?', ['0 and 1', '+1 and −1', 'i and −i', '1 and 1'], 1, 'X|+⟩ = |+⟩ and X|−⟩ = −|−⟩, so the eigenvalues are +1 and −1, with eigenvectors |+⟩ and |−⟩. Every Pauli matrix has eigenvalues ±1.'],
    ['What is the expectation value ⟨Z⟩ for the state |+⟩?', ['1', '−1', '0', '½'], 2, '|+⟩ gives +1 and −1 with probability ½ each, so the average is 0. Directly: ⟨+|Z|+⟩ = ⟨+|−⟩ = 0.'],
    ['In the real-amplitude plane, the state is at 30° and the measurement basis vector b₀ is at 0°. What is P(b₀)?', ['cos²30° = 0.75', 'cos²15° ≈ 0.93', 'cos30° ≈ 0.87', '0.5'], 0, 'The amplitude is the projection cos(30°), and the probability is its square, 0.75. On the Bloch sphere the same pair is 60° apart, and cos²(60°/2) gives the same 0.75.'],
    ['How many complex amplitudes describe 5 qubits in general?', ['5', '10', '25', '32'], 3, 'Dimensions multiply under the tensor product: 2⁵ = 32. That exponential growth is why classical simulation of many qubits is expensive.'],
    ['Which matrix is a projector?', ['|0⟩⟨0|', 'X', 'H', 'The rotation by 30°'], 0, '|0⟩⟨0| = [[1, 0], [0, 0]] keeps the |0⟩ component and discards the rest, and applying it twice equals applying it once (P² = P). X, H and rotations are unitary, not projectors.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Complex conjugate', 'The mirror image a − bi of a complex number a + bi. Multiplying a number by its conjugate gives its squared modulus.', 'complex'],
  ['Euler’s formula', 'e^(iθ) = cos θ + i sin θ: the unit-length complex number at angle θ.', 'complex'],
  ['Relative phase', 'The angle between the amplitudes of different basis states. Unlike a global phase, it changes how amplitudes interfere.', 'complex'],
  ['Stern–Gerlach experiment', 'The 1922 experiment in which silver atoms passing through an uneven magnetic field split into two beams, revealing quantized spin.', 'sterngerlach'],
  ['Spin', 'An intrinsic angular momentum of particles. For spin-½, measuring along any axis gives only up or down, so a spin is a natural qubit.', 'sterngerlach'],
  ['Incompatible observables', 'Quantities, such as spin along z and along x, that no state can have definite values of at the same time.', 'sterngerlach'],
  ['Inner product', 'The complex number ⟨φ|ψ⟩ measuring the overlap of two states; its squared magnitude is the probability of finding one state when measuring for the other.', 'lainner'],
  ['Hermitian matrix', 'A matrix equal to its own conjugate transpose. Observables are Hermitian, so their eigenvalues are real.', 'launitary'],
  ['Eigenvalue', 'A number λ with A|v⟩ = λ|v⟩ for some nonzero vector |v⟩ (an eigenvector). For an observable, the eigenvalues are the possible results.', 'laeigen'],
  ['Expectation value', 'The average result ⟨ψ|A|ψ⟩ of measuring observable A on many copies of |ψ⟩.', 'linalg'],
  ['Projector', 'A matrix P with P² = P, such as |k⟩⟨k|, that keeps the component of a vector along a subspace.', 'laouter']
);
})();
