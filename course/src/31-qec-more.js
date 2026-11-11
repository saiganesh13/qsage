/* =====================================================================
   Research track · error correction: colour codes, Bacon–Shor subsystem codes,
   Floquet (honeycomb) codes, erasure qubits
   ===================================================================== */
(() => {
const G = 5;
const PL = ['I', 'X', 'Y', 'Z'];
const hasX = e => e === 1 || e === 2, hasZ = e => e === 2 || e === 3;
const errCycle = e => (e + 1) % 4;

/* ---------- colour code: the 7-qubit triangle ---------- */
const CC_POS = [[.5, .07], [.07, .87], [.93, .87], [.285, .47], [.5, .87], [.715, .47], [.5, .603]];
const CC_NAMES = ['A', 'B', 'C', 'AB', 'BC', 'CA', 'O'];
const CC_FACES = [[0, 3, 6, 5], [1, 4, 6, 3], [2, 5, 6, 4]];
LESSONS.push({
  id: 'colorcode', n: 27.2, stage: G, minutes: 15, title: 'Colour codes and transversal gates',
  lede: 'Colour a tiling with three colours so that touching tiles always differ, put qubits at the corners, and every tile becomes both an X check and a Z check. The result is a code that implements every Clifford gate by acting on each qubit separately.',
  html: `
<h2>Three colours</h2>
<p>Bombín and Martin-Delgado introduced <strong>colour codes</strong> in 2006. Take a two-dimensional lattice whose faces can be three-coloured, such as the honeycomb (6.6.6) or the square-octagon (4.8.8) tiling, and in which every vertex touches exactly three faces. Put a qubit on every vertex. Each face carries two stabilizers, the product of X on its qubits and the product of Z on its qubits. Two faces share either zero or two qubits, so all stabilizers commute. A triangular patch with boundaries of the three colours encodes one logical qubit.</p>
<p>The smallest colour code is a familiar one: three four-qubit faces on seven qubits are exactly the <strong>Steane code</strong> ${m('[[7, 1, 3]]')} of [[L:stabilizers]]. The next triangle has 19 qubits and distance 5; in general a 6.6.6 triangle of distance ${m('d')} uses ${m('(3d² + 1)/4')} qubits, slightly fewer than a rotated surface code.</p>
${LAB('tri')}
<h2>Why colour codes are interesting: transversality</h2>
<p>A gate is <strong>transversal</strong> if it acts on each physical qubit separately (or on matching qubits of two code blocks). Transversal gates cannot spread one error to several qubits of the same block, so they are automatically fault tolerant ([[L:faulttolerance]]). In a colour code every face supports identical X and Z checks, so applying H to every qubit swaps the X and Z stabilizers and maps the code to itself, implementing logical H. Phase gates work too, with a twist. The qubits of a 6.6.6 colour code split into two sublattices, and every face has equal numbers from each. Applying S to one sublattice and S† to the other sends each X check to a Y-type check whose signs cancel, leaving exactly the product of the face’s X and Z checks, so the code is preserved and logical S is implemented. (Plain S on every qubit fails on hexagons: six factors of Y = iXZ give an overall −1. It works on the Steane code and the 4.8.8 code because their face weights are multiples of 4.) With the transversal CNOT that all CSS codes have, colour codes implement the whole <strong>Clifford group</strong> transversally, which the surface code cannot (its H and S need lattice surgery or code deformation, [[L:surgery]]).</p>
<p>No code can do everything transversally: the <strong>Eastin–Knill theorem</strong> (2009) says no quantum code that detects arbitrary single-qubit errors has a universal transversal gate set. Three-dimensional colour codes have a transversal T gate but lose transversal H; the missing gate is supplied by magic states ([[L:magic]]) or by switching between codes.</p>
<h2>Costs</h2>
<ul>
<li><strong>Heavier checks.</strong> Bulk faces of the 6.6.6 code have weight 6 (the 4.8.8 code has weight-8 faces), so syndrome-extraction circuits are deeper and noisier than the surface code’s weight-4 checks.</li>
<li><strong>Harder decoding.</strong> A single error lights up three faces, not two, so matching does not apply directly. Restriction and projection decoders map the problem onto matching on sub-lattices; thresholds are lower than the surface code’s.</li>
<li><strong>Recent progress.</strong> Colour codes have been demonstrated on superconducting and trapped-ion hardware, and magic-state cultivation (Gidney, Shutty and Jones, 2024) grows high-quality magic states inside small colour codes cheaply.</li>
</ul>
`,
  labs: {
    tri: {
      title: 'The smallest colour code',
      cap: 'Seven qubits, three coloured faces. Click a qubit to cycle its error through X, Y, Z and none. Each face shows two check results: the small square on the left is its Z check (detects X and Y errors), the one on the right its X check (detects Z and Y). The lookup decoder corrects any single error; two errors on a distance-3 code fool it. Below, apply a gate to every qubit and see where the stabilizers go.',
      build(body, id) {
        let err = new Array(7).fill(0), gate = 'H';
        const cv = canvas('sq', 'max-width:380px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), gt = h('div', { class: 'readout', style: 'white-space:normal' }), cq = canvas('', 'height:150px');
        const FCOL = T => [T.copper, T.good, T.cyan];
        const synd = kind => CC_FACES.map(f => f.reduce((s, q) => s ^ ((kind === 'Z' ? hasX(err[q]) : hasZ(err[q])) ? 1 : 0), 0));
        const decode = sy => { const pat = sy.map((v, i) => v ? i : -1).filter(i => i >= 0).join(','); const memb = q => CC_FACES.map((f, i) => f.includes(q) ? i : -1).filter(i => i >= 0).join(','); if (!pat) return -1; for (let q = 0; q < 7; q++) if (memb(q) === pat) return q; return -1; };
        const geo = (w, H) => { const S = Math.min(w, H) - 20, ox = (w - S) / 2, oy = 10; return { S, P: q => [ox + CC_POS[q][0] * S, oy + CC_POS[q][1] * S * .95] }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), { S, P } = geo(w, H), sz = synd('Z'), sx = synd('X');
          CC_FACES.forEach((f, i) => { ctx.fillStyle = rgba(FCOL(T)[i], .22); ctx.strokeStyle = FCOL(T)[i]; ctx.lineWidth = 2; ctx.beginPath(); f.forEach((q, k) => { const [x, y] = P(q); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
            const cx = f.reduce((s, q) => s + P(q)[0], 0) / 4, cy = f.reduce((s, q) => s + P(q)[1], 0) / 4, b = S * .045;
            [[sz[i], -1, 'Z'], [sx[i], 1, 'X']].forEach(([v, side, lab]) => { const x = cx + side * b * .9 - b / 2, y = cy - b / 2; ctx.fillStyle = v ? T.bad : T.surface; ctx.strokeStyle = T.ink; ctx.lineWidth = 1.2; ctx.fillRect(x, y, b, b); ctx.strokeRect(x, y, b, b); txt(ctx, lab, x + b / 2, y + b / 2 + .5, { font: '600 9px "JetBrains Mono",monospace', color: v ? T.surface : T.muted }); }); });
          for (let q = 0; q < 7; q++) { const [x, y] = P(q), e = err[q]; dot(ctx, x, y, 13, e ? T.ink : T.surface, T.ink); txt(ctx, e ? PL[e] : CC_NAMES[q], x, y + .5, { font: `600 ${e ? 13 : 9.5}px "JetBrains Mono",monospace`, color: e ? T.surface : T.ink }); }
        });
        dragHandles(cv, (x, y) => { const r = cv.getBoundingClientRect(), { P } = geo(r.width, r.height); for (let q = 0; q < 7; q++) { const [px, py] = P(q); if (Math.hypot(px - x, py - y) < 18) { err[q] = errCycle(err[q]); upd(); return null; } } return null; }, () => {});
        const upd = () => {
          p.inv(); const sz = synd('Z'), sx = synd('X'), qx = decode(sz), qz = decode(sx);
          const rx = err.map(hasX).map((v, q) => v !== (q === qx)), rz = err.map(hasZ).map((v, q) => v !== (q === qz)), wx = rx.filter(Boolean).length, wz = rz.filter(Boolean).length, fail = wx % 2 === 1 || wz % 2 === 1;
          const nE = err.filter(Boolean).length;
          ro.innerHTML = `<span class="k">Z checks (red, green, blue) </span>${sz.join(' ')} &nbsp; <span class="k">X checks </span>${sx.join(' ')}<br><span class="k">decoder applies </span>${qx < 0 && qz < 0 ? 'nothing' : [qx >= 0 ? 'X on ' + CC_NAMES[qx] : '', qz >= 0 ? 'Z on ' + CC_NAMES[qz] : ''].filter(Boolean).join(', ')}<br>${nE === 0 ? '<span class="k">no errors</span>' : fail ? '<span style="color:var(--bad)">logical error: the correction completed a logical operator</span>' : '<span style="color:var(--good)">corrected (any leftover is a stabilizer)</span>'}`;
        };
        const gateTxt = () => {
          const map = { H: { X: 'Z', Z: 'X' }, S: { X: 'Y', Z: 'Z' } }, face = (f, P_) => CC_NAMES.map((_, q) => f.includes(q) ? P_ : 'I').join('');
          if (gate === 'T') { gt.innerHTML = `<span class="k">T on every qubit</span><br>X on a face becomes a product of (X + Y)/√2 factors, which is not a Pauli operator at all, so the stabilizer group is not preserved and T is <span style="color:var(--bad)">not transversal</span> in this code. (Eastin–Knill: some gate must always be missing.)`; return; }
          gt.innerHTML = `<span class="k">${gate} on every qubit maps</span><br>` + CC_FACES.map((f, i) => `${face(f, 'X')} → ${face(f, map[gate].X)} &nbsp; ${face(f, 'Z')} → ${face(f, map[gate].Z)}`).join('<br>') + `<br><span style="color:var(--good)">every image is still a stabilizer</span>${gate === 'S' ? ' (Y on a face = X·Z on that face)' : ''}, so the code is preserved and logical ${gate === 'H' ? 'H' : 'S (up to a dagger)'} is applied.`;
        };
        const qq = painter(cq, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [3, 15], y: [0, 230], xt: [3, 5, 7, 9, 11, 13, 15], yt: [0, 100, 200], xl: 'code distance d', yl: 'data qubits' }); const c3 = [], s = []; for (let d = 3; d <= 15; d += 2) { c3.push([A.X(d), A.Y((3 * d * d + 1) / 4)]); s.push([A.X(d), A.Y(d * d)]); } polyline(ctx, s, T.muted, 2, [5, 4]); polyline(ctx, c3, T.copper, 2.4); c3.forEach(q => dot(ctx, q[0], q[1], 3, T.copper)); });
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, h('div', { class: 'btns' }, btn('Clear errors', () => { err.fill(0); upd(); }, 'sm'), btn('Random single error', () => { err.fill(0); err[Math.floor(Math.random() * 7)] = 1 + Math.floor(Math.random() * 3); upd(); }, 'sm'))),
          h('div', { class: 'stack' }, ro, field('Transversal gate', seg([{ v: 'H', label: 'H everywhere' }, { v: 'S', label: 'S everywhere' }, { v: 'T', label: 'T everywhere' }], gate, v => { gate = v; gateTxt(); }, 'Gate')), gt, cq, legendRow([['colour code (3d² + 1)/4', 'var(--copper)'], ['rotated surface code d²', 'var(--muted)', 1]]))));
        upd(); gateTxt();
      }
    }
  },
  take: ['Colour codes put qubits on the vertices of a three-colourable lattice; each face carries both an X and a Z stabilizer.',
    'The 7-qubit triangle is the Steane code; a 6.6.6 triangle of distance d uses (3d² + 1)/4 qubits.',
    'Because X and Z checks coincide, H and S are transversal, so the whole Clifford group is transversal, unlike the surface code.',
    'Eastin–Knill forbids a universal transversal set; colour codes pay with heavier checks and harder decoding, and power magic-state cultivation.'],
  quiz: QZ([
    ['What property must the lattice of a 2D colour code have?', ['Square faces only', 'Faces can be coloured with three colours so that adjacent faces differ, and each vertex touches three faces', 'No faces at all', 'Only one colour'], 1, 'Three-colourability is what makes the X and Z face operators commute and gives the code its gate properties.'],
    ['Which stabilizers does each face of a colour code carry?', ['Only X', 'Both the product of X and the product of Z on its qubits', 'Only Z', 'A single Y operator'], 1, 'Identical X and Z supports are the source of transversal H and S.'],
    ['Which well-known code is the smallest colour code?', ['The Shor code', 'The Steane [[7, 1, 3]] code', 'The 5-qubit code', 'The repetition code'], 1, 'Three four-qubit faces on seven vertices reproduce the Hamming-based CSS code.'],
    ['What makes a transversal gate automatically fault tolerant?', ['It is fast', 'It acts on each qubit separately, so it cannot spread one error to several qubits of the same block', 'It needs no qubits', 'It is always a Pauli'], 1, 'Errors stay localized, so a correctable error remains correctable.'],
    ['Why is H transversal in a colour code?', ['By accident', 'H on every qubit swaps X and Z, and since every face has both an X and a Z check, the stabilizer group maps to itself', 'Because H is a Pauli', 'It is not'], 1, 'In the surface code X and Z checks live on different plaquettes, so transversal H maps the code to a rotated one.'],
    ['What does the Eastin–Knill theorem state?', ['All gates are transversal', 'No code that detects arbitrary single-qubit errors has a universal set of transversal gates', 'Colour codes have no transversal gates', 'Magic states are unnecessary'], 1, 'Some gate must always be implemented another way, such as with magic states.'],
    ['What do 3D colour codes offer and lose?', ['Nothing', 'A transversal T gate, but no transversal H', 'Transversal H and T together', 'Fewer qubits'], 1, 'Code switching between 2D and 3D colour codes is one route to universality.'],
    ['Why is decoding colour codes harder than the surface code?', ['They have no syndromes', 'A single error violates three faces rather than two, so standard matching does not apply directly', 'They need no decoding', 'They use classical codes'], 1, 'Restriction and projection decoders reduce the problem to matching on sub-lattices.'],
    ['In the 7-qubit lab, why do two errors cause a logical failure?', ['The code is broken', 'With distance 3, two errors can produce the syndrome of a single different error, so the decoder completes a weight-3 logical operator', 'Errors cancel', 'Checks are noisy'], 1, 'A distance-d code corrects at most ⌊(d−1)/2⌋ errors.'],
    ['How many qubits does a distance-5 6.6.6 colour code use?', ['25', '19', '13', '49'], 1, '(3·25 + 1)/4 = 19, compared with 25 data qubits for a distance-5 rotated surface code.']
  ])
});

/* ---------- Bacon–Shor subsystem code ---------- */
LESSONS.push({
  id: 'baconshor', n: 27.1, stage: G, minutes: 14, title: 'Subsystem codes: the Bacon–Shor code',
  lede: 'What if you never measured a big stabilizer, only pairs of qubits, and multiplied the answers afterwards? Subsystem codes do exactly that, trading some protection for checks that are as simple as they can be.',
  html: `
<h2>Gauge qubits</h2>
<p>In a stabilizer code ([[L:stabilizers]]) every degree of freedom outside the logical qubit is fixed by a stabilizer. A <strong>subsystem code</strong> (Poulin, 2005; Bacon, 2006) leaves some of them free. These extra <strong>gauge qubits</strong> carry no information, so nobody cares what state they are in. The payoff is that the operators acting on them, the <strong>gauge operators</strong>, can be measured to learn about errors. Gauge operators need not commute with each other, so individual outcomes are random, but certain products of them are stabilizers with definite values.</p>
<h2>The Bacon–Shor code</h2>
<p>Place ${m('m × m')} qubits on a grid. The gauge operators are ${m('X X')} on vertically neighbouring qubits and ${m('Z Z')} on horizontally neighbouring qubits, all of weight 2. Multiplying the ${m('XX')} gauges across a pair of rows gives the stabilizer “X on both rows”, which catches Z errors, and multiplying the ${m('ZZ')} gauges across a pair of columns gives “Z on both columns”, which catches X errors.</p>
${EQ('S<sub>X</sub>(r) = Π<sub>c</sub> X<sub>r,c</sub>X<sub>r+1,c</sub>, &nbsp;&nbsp; S<sub>Z</sub>(c) = Π<sub>r</sub> Z<sub>r,c</sub>Z<sub>r,c+1</sub>, &nbsp;&nbsp; X̄ = X on one row, &nbsp; Z̄ = Z on one column')}
<p>A Z error is located only up to its row: Z on two qubits of the same row is a product of ${m('ZZ')} gauges, which acts trivially on the logical information. So decoding is a repetition code across rows for Z errors, and across columns for X errors. The code has parameters ${m('[[m², 1, m]]')}, and the 3 × 3 version is Shor’s original nine-qubit code viewed as a subsystem code.</p>
${LAB('grid')}
<h2>Trade-offs</h2>
<ul>
<li><strong>Weight-2 measurements</strong> need only one ancilla interaction per data qubit per check, which reduces how errors spread during syndrome extraction and suits hardware with limited connectivity.</li>
<li><strong>No threshold on its own.</strong> Because each stabilizer grows with ${m('m')}, large Bacon–Shor codes do not have a threshold under independent noise; they are best at small sizes or when one error type dominates (asymmetric versions of the grid help with biased noise).</li>
<li><strong>Relatives.</strong> Subsystem surface codes, the heavy-hexagon codes designed for IBM’s heavy-hex processors, and the honeycomb Floquet code ([[L:floquet]]) all build stabilizers from small gauge measurements. Bacon–Shor codes have been demonstrated on trapped ions, including fault-tolerant state preparation and measurement.</li>
</ul>
`,
  labs: {
    grid: {
      title: 'Measure pairs, infer stabilizers',
      cap: 'Click qubits to place errors (cycling X, Z, Y, none). Short bars between vertical neighbours are XX gauge outcomes, between horizontal neighbours ZZ gauge outcomes: cyan +1, copper −1. Each outcome is random (press Measure again), but the product along a row pair (right) or a column pair (below) is a stabilizer and only changes with errors. The decoder treats rows (for Z errors) and columns (for X errors) as repetition codes.',
      build(body, id) {
        let m = 3, err = null, gx = null, gz = null;
        const cv = canvas('sq', 'max-width:400px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const reset = () => { err = new Array(m * m).fill(0); measure(); };
        const rowZ = r => { let s = 0; for (let c3 = 0; c3 < m; c3++) s ^= hasZ(err[r * m + c3]) ? 1 : 0; return s; }, colX = c3 => { let s = 0; for (let r = 0; r < m; r++) s ^= hasX(err[r * m + c3]) ? 1 : 0; return s; };
        const sX = () => [...Array(m - 1)].map((_, r) => rowZ(r) ^ rowZ(r + 1)), sZ = () => [...Array(m - 1)].map((_, c3) => colX(c3) ^ colX(c3 + 1));
        const measure = () => {
          const rand = (prod) => { const a = [...Array(m)].map(() => Math.random() < .5 ? 1 : 0); let s = a.slice(0, m - 1).reduce((x, y) => x ^ y, 0); a[m - 1] = s ^ prod; return a; };
          gx = sX().map(v => rand(v)); gz = sZ().map(v => rand(v)); upd();
        };
        const rep = sy => { const z0 = [0]; for (let i = 0; i < sy.length; i++) z0.push(z0[i] ^ sy[i]); const w0 = z0.reduce((a, b) => a + b, 0); return w0 <= m - w0 ? z0 : z0.map(v => 1 - v); };
        const geo = (w, H) => { const S = Math.min(w, H) - 60, ox = (w - S) / 2 - 10, oy = 14, cs = S / (m - 1 || 1); return { S, ox, oy, cs, P: (r, c3) => [ox + c3 * cs, oy + r * cs] }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!err) return; const T = Theme.get(), { S, ox, oy, cs, P } = geo(w, H), bl = cs * .26;
          for (let r = 0; r < m - 1; r++) for (let c3 = 0; c3 < m; c3++) { const [x, y0] = P(r, c3), y1 = P(r + 1, c3)[1], v = gx[r][c3]; ctx.strokeStyle = v ? T.copper : T.cyan; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, (y0 + y1) / 2 - bl); ctx.lineTo(x, (y0 + y1) / 2 + bl); ctx.stroke(); }
          for (let c3 = 0; c3 < m - 1; c3++) for (let r = 0; r < m; r++) { const [x0, y] = P(r, c3), x1 = P(r, c3 + 1)[0], v = gz[c3][r]; ctx.strokeStyle = v ? T.copper : T.cyan; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo((x0 + x1) / 2 - bl, y); ctx.lineTo((x0 + x1) / 2 + bl, y); ctx.stroke(); }
          for (let r = 0; r < m; r++) for (let c3 = 0; c3 < m; c3++) { const [x, y] = P(r, c3), e = err[r * m + c3]; dot(ctx, x, y, Math.min(14, cs * .2), e ? T.ink : T.surface, T.ink); if (e) txt(ctx, PL[e], x, y + .5, { font: '600 12px "JetBrains Mono",monospace', color: T.surface }); }
          const sx = sX(), sz = sZ();
          sx.forEach((v, r) => { const y = (P(r, 0)[1] + P(r + 1, 0)[1]) / 2, x = ox + S + 26; ctx.fillStyle = v ? T.bad : T.good; ctx.fillRect(x - 9, y - 9, 18, 18); txt(ctx, v ? '−' : '+', x, y + .5, { font: '700 13px "JetBrains Mono",monospace', color: T.surface }); });
          sz.forEach((v, c3) => { const x = (P(0, c3)[0] + P(0, c3 + 1)[0]) / 2, y = oy + S + 26; ctx.fillStyle = v ? T.bad : T.good; ctx.fillRect(x - 9, y - 9, 18, 18); txt(ctx, v ? '−' : '+', x, y + .5, { font: '700 13px "JetBrains Mono",monospace', color: T.surface }); });
        });
        dragHandles(cv, (x, y) => { const r = cv.getBoundingClientRect(), { cs, P } = geo(r.width, r.height); for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) { const [px, py] = P(i, j); if (Math.hypot(px - x, py - y) < Math.max(14, cs * .25)) { const e = err[i * m + j]; err[i * m + j] = e === 0 ? 1 : e === 1 ? 3 : e === 3 ? 2 : 0; measure(); return null; } } return null; }, () => {});
        const upd = () => {
          p.inv(); const zr = rep(sX()), xc = rep(sZ()), resZ = [...Array(m)].map((_, r) => rowZ(r) ^ zr[r]), resX = [...Array(m)].map((_, c3) => colX(c3) ^ xc[c3]);
          const failZ = resZ.every(v => v === 1), failX = resX.every(v => v === 1), any = err.some(Boolean);
          ro.innerHTML = `<span class="k">rows to correct with one Z each </span>${zr.map((v, i) => v ? i : null).filter(v => v != null).join(', ') || 'none'}<br><span class="k">columns to correct with one X each </span>${xc.map((v, i) => v ? i : null).filter(v => v != null).join(', ') || 'none'}<br>${!any ? '<span class="k">no errors</span>' : failZ || failX ? `<span style="color:var(--bad)">logical ${failZ && failX ? 'Y' : failZ ? 'Z' : 'X'} error</span>` : '<span style="color:var(--good)">corrected up to gauge operators</span>'}`;
        };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Measure gauges again', measure, 'pri'), btn('Clear errors', reset, 'sm')),
          slider({ id: id('m'), label: 'Grid size m (code [[m², 1, m]])', min: 3, max: 6, step: 1, value: m, fmt: v => `${v} × ${v}`, on: v => { m = v; reset(); } }), ro, legendRow([['gauge outcome +1', 'var(--cyan)'], ['gauge outcome −1', 'var(--copper)']]), h('div', { class: 'hint' }, 'Squares at the right are the X stabilizers of each pair of rows; squares below are the Z stabilizers of each pair of columns.'))));
        reset();
      }
    }
  },
  take: ['Subsystem codes leave some qubits unfixed as gauge qubits; measuring non-commuting gauge operators reveals stabilizers as products of outcomes.',
    'The Bacon–Shor code on an m × m grid has weight-2 XX and ZZ gauges, stabilizers on pairs of rows and columns, and parameters [[m², 1, m]].',
    'Errors are located only up to a row or column, so decoding reduces to repetition codes; corrections are fixed up to gauge operators.',
    'Weight-2 checks simplify hardware, but large Bacon–Shor codes lack a threshold; related ideas appear in heavy-hex and Floquet codes.'],
  quiz: QZ([
    ['What is a gauge qubit in a subsystem code?', ['A logical qubit', 'A degree of freedom that carries no information and is left unfixed, so its state does not matter', 'An ancilla that is always measured', 'A broken qubit'], 1, 'Gauge freedom lets the code use simpler, non-commuting measurements.'],
    ['Why are individual gauge measurement outcomes random?', ['Hardware noise', 'Gauge operators do not commute with each other, so measuring one randomizes others; only certain products are fixed', 'Because of errors', 'They are not random'], 1, 'The products that commute with all gauges are the stabilizers, and they are deterministic.'],
    ['What are the gauge operators of the Bacon–Shor code?', ['Weight-4 plaquettes', 'XX on vertical neighbours and ZZ on horizontal neighbours', 'Single-qubit Z', 'Full rows of Y'], 1, 'All checks are measured with two-qubit operators.'],
    ['What does the X stabilizer on a pair of rows detect?', ['X errors', 'Z (and Y) errors on those rows, revealing in which row a Z error occurred', 'Nothing', 'Measurement errors only'], 1, 'X on two rows anticommutes with a Z error in either row.'],
    ['Why does the decoder only need to know the row of a Z error?', ['Columns do not exist', 'Z on two qubits in the same row is a product of ZZ gauges, which does not affect the logical qubit', 'Because Z errors are rare', 'It needs the exact qubit'], 1, 'Any qubit in the row can receive the correction.'],
    ['What are the parameters of the m × m Bacon–Shor code?', ['[[m, 1, m]]', '[[m², 1, m]]', '[[2m, 2, 2]]', '[[m², m, 1]]'], 1, 'A logical X is X along a row (weight m) and a logical Z is Z along a column (weight m).'],
    ['Which classical code underlies Bacon–Shor decoding?', ['Hamming', 'The repetition code, across rows for Z errors and across columns for X errors', 'Reed–Solomon', 'LDPC'], 1, 'Row parities of Z errors form a repetition code whose checks are the row-pair stabilizers.'],
    ['What is the main advantage of weight-2 measurements?', ['They encode more qubits', 'Simpler syndrome circuits with less error spreading and fewer connectivity demands', 'Higher distance', 'No decoding'], 1, 'Each check touches only two data qubits.'],
    ['Why do large Bacon–Shor codes lack a threshold under independent noise?', ['They have no stabilizers', 'Their stabilizers grow with m, so the chance a stabilizer is corrupted grows with the code, outpacing the benefit of distance', 'Because gauges are random', 'They do have one'], 1, 'Weight-2m stabilizers inferred from many gauge outcomes become unreliable as m grows.'],
    ['How does Shor’s nine-qubit code relate to Bacon–Shor?', ['It is unrelated', 'It is the 3 × 3 Bacon–Shor code viewed as a stabilizer code with the gauge fixed', 'It has no gauges', 'It is a colour code'], 1, 'Bacon’s construction generalizes Shor’s code by freeing its gauge degrees of freedom.']
  ])
});

/* ---------- Floquet / honeycomb code ---------- */
function honeycomb(R) {
  const key = (a, b) => a + ',' + b, inR = (a, b, r) => Math.abs(a) <= r && Math.abs(b) <= r && Math.abs(a + b) <= r;
  const faces = new Map(); for (let a = -R - 1; a <= R + 1; a++) for (let b = -R - 1; b <= R + 1; b++) if (inR(a, b, R + 1)) faces.set(key(a, b), { a, b, col: (((a - b) % 3) + 3) % 3, full: inR(a, b, R), verts: [] });
  const verts = [];
  for (let a = -R - 2; a <= R + 2; a++) for (let b = -R - 2; b <= R + 2; b++) {
    for (const tri of [[[a, b], [a + 1, b], [a, b + 1]], [[a + 1, b], [a, b + 1], [a + 1, b + 1]]]) { if (!tri.every(([x, y]) => faces.has(key(x, y)))) continue; if (!tri.some(([x, y]) => faces.get(key(x, y)).full)) continue; const v = { tri, x: tri.reduce((s, p) => s + p[0], 0) / 3, y: tri.reduce((s, p) => s + p[1], 0) / 3 }; verts.push(v); tri.forEach(([x, y]) => faces.get(key(x, y)).verts.push(verts.length - 1)); }
  }
  const edges = [];
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) {
    const sh = verts[i].tri.filter(p => verts[j].tri.some(q => q[0] === p[0] && q[1] === p[1])); if (sh.length !== 2) continue;
    const d = [sh[1][0] - sh[0][0], sh[1][1] - sh[0][1]], type = (d[1] === 0) ? 0 : (d[0] === 0) ? 1 : 2;
    const far = verts[i].tri.find(p => !sh.some(q => q[0] === p[0] && q[1] === p[1])), col = (((far[0] - far[1]) % 3) + 3) % 3;
    edges.push({ i, j, type, col });
  }
  return { faces: [...faces.values()], verts, edges };
}
const FL_COL = T => [T.copper, T.good, T.cyan];
const FL_CN = ['red', 'green', 'blue'];
LESSONS.push({
  id: 'floquet', n: 27.3, stage: G, minutes: 15, title: 'Floquet codes: the honeycomb code',
  lede: 'In a Floquet code the logical qubit is never stored in a fixed code. It lives in a code that changes every step, created and re-created by a repeating sequence of two-qubit measurements, like a juggler keeping balls in the air.',
  html: `
<h2>Codes that change in time</h2>
<p>Hastings and Haah introduced the <strong>honeycomb code</strong> in 2021, the first Floquet code. Qubits sit on the vertices of a honeycomb lattice whose hexagons are coloured red, green and blue. Each edge connects two hexagons of the same colour at its ends and takes that colour. Each edge also has one of three directions, which decides its two-qubit check: ${m('XX')}, ${m('YY')} or ${m('ZZ')}, as in Kitaev’s honeycomb model. The protocol simply measures all red edges, then all green, then all blue, and repeats.</p>
<p>No single round measures a stabilizer of weight more than two. Yet the product of the six edge checks around a hexagon is a weight-6 <strong>plaquette operator</strong> that commutes with every check, and a hexagon of one colour is surrounded alternately by edges of the other two colours. So after measuring, say, red and then green edges, every blue plaquette’s value is the product of six known outcomes. Comparing a plaquette’s value with its previous one gives a detector that fires when an error occurred in between.</p>
${EQ('round r: measure red checks → round g: measure green checks ⇒ infer blue plaquettes → round b ⇒ infer red plaquettes → …')}
<h2>Dynamically generated logical qubits</h2>
<p>At any moment the state is in the joint eigenspace of the plaquettes and of the checks just measured: the <strong>instantaneous stabilizer group</strong>. That group changes every round, yet each one defines a code (equivalent to a toric code) with logical qubits, and the measurement sequence carries the logical information from one to the next. Strikingly, the static subsystem code formed by all the checks has no logical qubits at all; the protection exists only because of the order of measurements. Logical operators also move with the period-3 schedule.</p>
${LAB('honey')}
<h2>Why hardware groups care</h2>
<ul>
<li><strong>Two-qubit measurements only.</strong> Platforms with native pair measurements, such as Majorana-based proposals, need nothing else, and on other hardware each check is a short circuit.</li>
<li><strong>Performance.</strong> Gidney, Newman, Fowler and Broughton (2021) simulated a fault-tolerant honeycomb memory and found thresholds and qubit counts competitive with the surface code when pair measurements are native. Planar versions with boundaries and many relatives, such as the CSS honeycomb code and Floquet colour codes, followed, and small Floquet codes have been demonstrated experimentally.</li>
</ul>
`,
  labs: {
    honey: {
      title: 'Measuring a honeycomb code',
      cap: 'Hexagons are coloured red, green and blue; each edge takes the colour of the two hexagons at its ends, and its direction sets its check (XX, YY or ZZ). Rounds measure red, green and blue edges in turn (thick lines). After two consecutive rounds, the plaquettes of the remaining colour are inferred from six measured checks and outlined. Click a qubit to inject an error that persists; when an inferred plaquette changes value since its last inference, it fires a detector (dark dot).',
      build(body, id) {
        const HC = honeycomb(2); let round = 0, err = new Array(HC.verts.length).fill(0), last = {}, fire = new Set(), inferred = -1, running = true, acc = 0, seen = new Set();
        const cv = canvas('sq', 'max-width:440px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const plaqVal = (fi) => { const f = HC.faces[fi]; let s = 0; for (const vi of f.verts) { const e = err[vi]; if (!e) continue; const v = HC.verts[vi], opp = v.tri.filter(p => !(p[0] === f.a && p[1] === f.b)), d = [opp[1][0] - opp[0][0], opp[1][1] - opp[0][1]], t = d[1] === 0 ? 0 : d[0] === 0 ? 1 : 2; if (e !== t + 1) s ^= 1; } return s; };
        const step = () => {
          const c3 = round % 3; round++; fire = new Set(); inferred = -1;
          if (round >= 2) { const prev = (round - 2) % 3, ic = 3 - c3 - prev; inferred = ic; HC.faces.forEach((f, fi) => { if (!f.full || f.col !== ic) return; const v = plaqVal(fi); if (fi in last && last[fi] !== v) fire.add(fi); last[fi] = v; }); }
          text(); p.inv();
        };
        const geo = (w, H) => { const S = Math.min(w, H), sc = S / 7.2, cx = w / 2, cy = H / 2; return { P: (a, b) => [cx + (a + b / 2) * sc, cy - (b * Math.sqrt(3) / 2) * sc], sc }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), { P, sc } = geo(w, H), cur = (round - 1 + 3) % 3;
          HC.faces.forEach((f, fi) => { if (!f.full) return; const vs = f.verts.map(vi => P(HC.verts[vi].x, HC.verts[vi].y)), [fx, fy] = P(f.a, f.b); vs.sort((a, b) => Math.atan2(a[1] - fy, a[0] - fx) - Math.atan2(b[1] - fy, b[0] - fx)); ctx.fillStyle = rgba(FL_COL(T)[f.col], f.col === inferred ? .42 : .14); ctx.beginPath(); vs.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); if (f.col === inferred) { ctx.strokeStyle = FL_COL(T)[f.col]; ctx.lineWidth = 2; ctx.stroke(); } if (fire.has(fi)) dot(ctx, fx, fy, 7, T.ink, T.surface); else if (f.col === inferred) txt(ctx, plaqVal(fi) ? '−1' : '+1', fx, fy, { font: '600 10px "JetBrains Mono",monospace', color: T.ink }); });
          HC.edges.forEach(e => { const a = HC.verts[e.i], b = HC.verts[e.j], [x0, y0] = P(a.x, a.y), [x1, y1] = P(b.x, b.y), on = round > 0 && e.col === cur; ctx.strokeStyle = on ? FL_COL(T)[e.col] : rgba(FL_COL(T)[e.col], .45); ctx.lineWidth = on ? 5 : 1.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); if (on && sc > 40) txt(ctx, ['XX', 'YY', 'ZZ'][e.type], (x0 + x1) / 2, (y0 + y1) / 2 - 7, { font: '600 8.5px "JetBrains Mono",monospace', color: T.ink }); });
          HC.verts.forEach((v, vi) => { const [x, y] = P(v.x, v.y), e = err[vi]; dot(ctx, x, y, e ? 8 : 3.6, e ? T.bad : T.ink, e ? T.surface : null); if (e) txt(ctx, PL[e], x, y + .5, { font: '700 9px "JetBrains Mono",monospace', color: T.surface }); });
        });
        dragHandles(cv, (x, y) => { const r = cv.getBoundingClientRect(), { P } = geo(r.width, r.height); let best = -1, bd = 196; HC.verts.forEach((v, vi) => { const [px, py] = P(v.x, v.y), d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = vi; } }); if (best >= 0) { err[best] = errCycle(err[best]); text(); p.inv(); } return null; }, () => {});
        Scope.tick(now => { if (!running) { acc = now; return; } if (now - acc > (reduced() ? 2500 : 1300)) { acc = now; step(); } });
        const text = () => { const c3 = (round - 1 + 3) % 3; ro.innerHTML = `<span class="k">round </span>${round} &nbsp; <span class="k">measured </span>${round ? FL_CN[c3] + ' edges' : '—'}<br><span class="k">inferred plaquettes </span>${inferred >= 0 ? FL_CN[inferred] : 'none yet'}<br><span class="k">instantaneous stabilizers </span>${round ? 'all plaquettes + ' + FL_CN[c3] + ' checks' : '—'}<br><span class="k">detectors fired this round </span>${fire.size}`; };
        const runB = btn('Pause', () => { running = !running; runB.textContent = running ? 'Pause' : 'Run'; }, 'sm');
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, h('div', { class: 'btns' }, runB, btn('Next round', () => { running = false; runB.textContent = 'Run'; step(); }), btn('Clear errors', () => { err.fill(0); last = {}; text(); p.inv(); }, 'sm')), ro, legendRow([['red', 'var(--copper)'], ['green', 'var(--good)'], ['blue', 'var(--cyan)']]))));
        step();
      }
    }
  },
  take: ['A Floquet code protects information with a periodic sequence of measurements; the code itself changes every round.',
    'The honeycomb code measures only two-qubit XX, YY and ZZ checks on red, green and blue edges in turn.',
    'Products of six checks give weight-6 plaquettes, inferred after two consecutive rounds; changes between inferences are detectors.',
    'The instantaneous stabilizer group defines a toric-code-like code each round; the static code of all checks has no logical qubits.'],
  quiz: QZ([
    ['What is distinctive about a Floquet code?', ['It has no measurements', 'Its logical qubits are maintained by a periodic sequence of measurements, with the effective code changing each round', 'It uses only single-qubit gates', 'It is a classical code'], 1, 'The protection is dynamical, set by the measurement schedule.'],
    ['What do the honeycomb code’s measurements look like?', ['Weight-6 stabilizers', 'Two-qubit XX, YY or ZZ checks on edges, depending on edge direction', 'Single-qubit Z', 'Three-qubit checks'], 1, 'All measurements are of weight two, which is what makes the code attractive for hardware with native pair measurements.'],
    ['How are edges coloured in the honeycomb code?', ['Randomly', 'Each edge takes the colour of the two same-coloured hexagons it connects at its ends', 'By qubit number', 'All the same'], 1, 'With three-coloured hexagons, every edge joins two hexagons of one colour.'],
    ['How are plaquette values obtained?', ['By direct weight-6 measurements', 'As products of the six two-qubit check outcomes around a hexagon, available after two consecutive rounds', 'They are never known', 'From the logical qubit'], 1, 'A hexagon is bounded by edges of the other two colours, measured in consecutive rounds.'],
    ['What is a detector in this context?', ['A photon counter', 'A comparison of a plaquette’s inferred value with its previous value, which flips when an error occurred in between', 'A logical measurement', 'A gauge operator'], 1, 'Detectors are what the decoder uses, as in any repeated-syndrome code.'],
    ['What is the instantaneous stabilizer group?', ['The full set of all checks', 'The stabilizers defining the code right after a round: the plaquettes plus the checks just measured', 'Only the logical operators', 'An empty group'], 1, 'It changes with each round, yet always encodes logical qubits.'],
    ['How many logical qubits does the static subsystem code formed by all honeycomb checks have?', ['Two', 'None; protection arises only from the measurement order', 'Infinitely many', 'One per plaquette'], 1, 'This surprising fact is what makes logical qubits “dynamically generated”.'],
    ['Why might hardware with native two-qubit measurements favour Floquet codes?', ['They need no qubits', 'Every operation is a pair measurement, so no larger stabilizer circuits are needed', 'They avoid decoding', 'They need no timing'], 1, 'Majorana-based proposals measure pairs natively, which motivated much interest.'],
    ['In the lab, why does a single error fire two detectors?', ['Detectors are noisy', 'A Pauli error anticommutes with two of the three plaquettes around its qubit, those whose outward edge has a different Pauli type', 'Errors spread', 'It fires three'], 1, 'The plaquette whose term at that vertex matches the error commutes with it.'],
    ['Who introduced the honeycomb Floquet code?', ['Shor', 'Hastings and Haah, in 2021', 'Kitaev in 1997', 'Steane'], 1, 'It builds on Kitaev’s honeycomb model but uses the checks as measurements.']
  ])
});

/* ---------- erasure qubits ---------- */
LESSONS.push({
  id: 'erasure', n: 24.5, stage: G, minutes: 13, title: 'Erasure qubits: errors that announce themselves',
  lede: 'An error you know the location of is half as bad as one you have to find. Erasure qubits are designed so that their most common failures raise a flag, and error correction can exploit that.',
  html: `
<h2>Erasures versus Pauli errors</h2>
<p>An <strong>erasure</strong> is an error at a known location: the qubit is known to have been damaged, though not how. A code of distance ${m('d')} can correct ${m('⌊(d−1)/2⌋')} unknown Pauli errors but up to ${m('d − 1')} erasures, because with the locations known the decoder only has to fill in the missing information, not find it. Logical error rates therefore fall as roughly ${m('p<sup>d</sup>')} for erasures instead of ${m('p<sup>(d+1)/2</sup>')}, effectively doubling the distance.</p>
<p>Thresholds rise too. For the surface code with perfect measurements, unknown depolarizing errors are correctable up to around 15 to 19% per qubit, while erasures are correctable up to 50%, the bond-percolation threshold of the lattice.</p>
${LAB('rep')}
<h2>Erasure conversion</h2>
<p>Real qubits do not erase themselves, but some can be designed so that their dominant error moves them into a state that can be detected without disturbing the computational states.</p>
<ul>
<li><strong>Neutral atoms.</strong> Wu, Kolkowitz, Puri and Thompson (2022) proposed encoding qubits in metastable states of ytterbium so that most gate errors leave the atom in states that fluoresce under a separate laser. Their simulations gave a surface-code threshold of about 4% when 98% of errors are erasures, compared with about 1% otherwise. Experiments with ytterbium and strontium atoms demonstrated mid-circuit erasure detection in 2023.</li>
<li><strong>Superconducting dual-rail qubits.</strong> A qubit stored as one photon shared between two resonators or transmons, ${m('|01⟩')} and ${m('|10⟩')}, turns photon loss, the dominant error, into the detectable state ${m('|00⟩')}. Demonstrations from 2023 to 2024 showed erasure detection with residual Pauli errors far below the erasure rate.</li>
<li><strong>Photonics.</strong> A lost photon is naturally an erasure, which is why photonic architectures ([[L:photonic]]) are built around loss-tolerant codes.</li>
</ul>
${NOTE('The catch', `<p>Erasure checks take time and can themselves fail, and the remaining fraction of non-erasure errors usually dominates the logical error rate at low physical error rates. The benefit depends on the erasure fraction being very high, ideally above 90 to 99%.</p>`)}
`,
  labs: {
    rep: {
      title: 'Erasures in a repetition code',
      cap: 'A repetition code of d qubits protects a bit. Each qubit fails with probability p; a fraction of failures are erasures (location known, value randomized), the rest are silent flips. The decoder ignores erased qubits and takes a majority vote of the rest. The chart shows the exact logical error rate against p for all-Pauli errors, all-erasure errors and the chosen mix. The strip shows sample code blocks: dark squares are flips, hatched squares erasures, with the decoder’s verdict.',
      build(body, id) {
        let d = 5, f = .9, p0 = .05;
        const cv = canvas('', 'height:270px'), cs = canvas('', 'height:150px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const C = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; };
        const pfail = (p, fr) => { let s = 0; for (let e = 0; e <= d; e++) for (let k = 0; k <= d - e; k++) { const left = d - e, pr = C(d, e) * C(d - e, k) * Math.pow(fr * p, e) * Math.pow((1 - fr) * p, k) * Math.pow(1 - p, d - e - k), fl = 2 * k > left ? 1 : 2 * k === left ? .5 : 0; s += pr * fl; } return s; };
        const q = painter(cv, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [1e-3, .5], y: [1e-12, 1], xlog: true, ylog: true, xt: [1e-3, 1e-2, .1, .5], yt: [1e-12, 1e-9, 1e-6, 1e-3, 1], xf: v => String(v), yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'physical failure probability p', yl: 'logical error' });
          ctx.save(); ctx.beginPath(); ctx.rect(A.L, A.T, A.R - A.L, A.B - A.T); ctx.clip();
          for (const [fr, col, dash] of [[0, T.muted, null], [1, T.cyan, [5, 4]], [f, T.copper, null]]) { const pts = []; for (let e = -3; e <= Math.log10(.5); e += .02) { const v = pfail(10 ** e, fr); if (v >= 1e-12) pts.push([A.X(10 ** e), A.Y(v)]); } polyline(ctx, pts, col, 2.3, dash); }
          const pts = []; for (let e = -3; e <= Math.log10(.5); e += .02) pts.push([A.X(10 ** e), A.Y(10 ** e)]); polyline(ctx, pts, T.ink, 1, [2, 3]); ctx.restore();
          dot(ctx, A.X(p0), A.Y(Math.max(1e-12, pfail(p0, f))), 6, T.copper, T.surface); });
        let blocks = [];
        const sample = () => { blocks = [...Array(8)].map(() => { const qs = [...Array(d)].map(() => { const u = Math.random(); return u < p0 * f ? 'E' : u < p0 ? 'F' : '.'; }); const keep = qs.filter(x => x !== 'E'), flips = keep.filter(x => x === 'F').length; const ok = 2 * flips < keep.length || (2 * flips === keep.length && Math.random() < .5); return { qs, ok }; }); qs_.inv(); };
        const qs_ = painter(cs, ({ ctx, w, h: H }) => { const T = Theme.get(), rows = blocks.length, rh = H / rows, sz = Math.min(rh - 4, (w - 120) / d - 3); blocks.forEach((b, r) => { const y = r * rh + (rh - sz) / 2; b.qs.forEach((x, i) => { const xx = 10 + i * (sz + 3); ctx.fillStyle = x === 'F' ? T.ink : T.surface2; ctx.fillRect(xx, y, sz, sz); if (x === 'E') { ctx.strokeStyle = T.copper; ctx.lineWidth = 1.5; ctx.strokeRect(xx + .5, y + .5, sz - 1, sz - 1); ctx.beginPath(); for (let t = -sz; t < sz; t += 5) { ctx.moveTo(xx + Math.max(0, t), y + Math.max(0, -t)); ctx.lineTo(xx + Math.min(sz, t + sz), y + Math.min(sz, sz - t)); } ctx.stroke(); } }); txt(ctx, b.ok ? 'decoded correctly' : 'logical error', 10 + d * (sz + 3) + 8, y + sz / 2, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace', color: b.ok ? T.good : T.bad }); }); });
        const text = () => { const a = pfail(p0, 0), b = pfail(p0, f), c3 = pfail(p0, 1); ro.innerHTML = `<span class="k">at p = ${num(p0, 3)}, d = ${d}</span><br><span class="k">all Pauli flips </span>${sci(a)}<br><span class="k">${pct(f, 0)} erasures </span>${sci(b)}<br><span class="k">all erasures </span>${sci(c3)}<br><span class="k">correctable: </span>${Math.floor((d - 1) / 2)} flips or ${d - 1} erasures`; };
        const upd = () => { q.inv(); text(); sample(); };
        body.append(h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow([['all silent flips', 'var(--muted)'], ['all erasures', 'var(--cyan)', 1], ['chosen mix', 'var(--copper)'], ['unprotected p', 'var(--ink)', 1]])),
          h('div', { class: 'stack' }, slider({ id: id('d'), label: 'Code distance d', min: 3, max: 15, step: 2, value: d, fmt: String, on: v => { d = v; upd(); } }),
            slider({ id: id('f'), label: 'Fraction of failures that are erasures', min: 0, max: 1, step: .01, value: f, fmt: v => pct(v, 0), on: v => { f = v; upd(); } }),
            slider({ id: id('p'), label: 'Failure probability p (marked point)', min: -3, max: Math.log10(.5), step: .02, value: Math.log10(p0), fmt: v => num(10 ** v, 3), on: v => { p0 = 10 ** v; upd(); } }), ro)),
          h('div', { class: 'stack' }, cs, h('div', { class: 'btns' }, btn('New samples', sample, 'sm'))));
        upd();
      }
    }
  },
  take: ['An erasure is an error at a known location; a distance-d code corrects d − 1 erasures but only ⌊(d−1)/2⌋ unknown errors.',
    'Logical error rates scale like p^d for erasures instead of p^((d+1)/2), and surface-code thresholds rise from about 15–19% to 50% at the code-capacity level.',
    'Erasure conversion designs qubits whose dominant failures land in detectable states: metastable atoms, dual-rail superconducting qubits, lost photons.',
    'The gain depends on a very high erasure fraction; residual Pauli errors and imperfect erasure checks limit it.'],
  quiz: QZ([
    ['What is an erasure error?', ['An error that deletes the code', 'An error whose location is known, though the resulting state is not', 'A measurement of the logical qubit', 'An error with probability zero'], 1, 'Knowing where the error is changes the decoding problem fundamentally.'],
    ['How many erasures can a distance-d code correct?', ['⌊(d−1)/2⌋', 'd − 1', 'd²', 'None'], 1, 'Any d − 1 known locations can be reconstructed because no logical operator fits inside them.'],
    ['How many unknown Pauli errors can a distance-d code correct?', ['d − 1', '⌊(d−1)/2⌋', 'd', '2d'], 1, 'Unknown errors must be located as well as fixed, which halves the correctable number.'],
    ['How does the logical error rate scale with p for pure erasures?', ['p^((d+1)/2)', 'About p^d', 'Linearly', 'It does not depend on p'], 1, 'Failure requires about d erasures, compared with about d/2 unknown errors.'],
    ['What is the surface code’s erasure threshold with perfect measurements?', ['1%', '50%', '10%', '100%'], 1, 'It equals the bond-percolation threshold of the square lattice.'],
    ['In the lab’s repetition code, what does the decoder do with erased qubits?', ['Counts them as 0', 'Ignores them and takes a majority vote of the remaining qubits', 'Flips them', 'Stops'], 1, 'Erased values carry no information, so they are excluded from the vote.'],
    ['What is erasure conversion?', ['Turning qubits into classical bits', 'Engineering qubits so that their dominant physical errors move them into detectable states', 'Deleting errors', 'A decoding algorithm'], 1, 'Examples include metastable atomic qubits and dual-rail superconducting qubits.'],
    ['In a dual-rail qubit, what does photon loss produce?', ['A phase flip', 'The state |00⟩, outside the code space and detectable without disturbing |01⟩ and |10⟩', 'A bit flip', 'Nothing'], 1, 'The dominant error becomes an erasure, leaving much smaller residual Pauli errors.'],
    ['What threshold did Wu and colleagues find for neutral atoms with 98% erasure conversion?', ['About 0.1%', 'About 4%, compared with about 1% without erasure conversion', 'About 50%', 'No threshold'], 1, 'Most errors becoming erasures roughly quadruples the circuit-level threshold.'],
    ['Why does a high erasure fraction matter so much?', ['It doesn’t', 'At low error rates the remaining silent errors, scaling as p^((d+1)/2), dominate the logical error rate', 'Erasures are worse than Pauli errors', 'Because of measurement speed'], 1, 'The chosen-mix curve in the lab bends towards the Pauli curve at small p unless the fraction is very high.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Colour code', 'A topological code on a three-colourable lattice with qubits on vertices and both X and Z stabilizers on every face; it has transversal Clifford gates.', 'colorcode'],
  ['Subsystem code', 'A code with unfixed gauge qubits, whose non-commuting gauge operators are measured and multiplied to obtain stabilizers.', 'baconshor'],
  ['Bacon–Shor code', 'A subsystem code on an m × m grid with weight-2 XX and ZZ gauge operators; parameters [[m², 1, m]].', 'baconshor'],
  ['Floquet code', 'A code whose logical qubits are maintained by a periodic sequence of measurements, with an instantaneous stabilizer group that changes each round.', 'floquet'],
  ['Honeycomb code', 'The first Floquet code (Hastings and Haah): two-qubit XX, YY and ZZ checks measured on red, green and blue edges of a honeycomb in turn.', 'floquet'],
  ['Erasure', 'An error at a known location; codes correct twice as many erasures as unknown errors.', 'erasure'],
  ['Erasure conversion', 'Designing qubits so that their dominant errors leave them in detectable states, turning errors into erasures.', 'erasure']
);
})();
