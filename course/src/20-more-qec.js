/* =====================================================================
   Research track · Error correction additions:
   toric code and anyons, union–find decoding, lattice surgery, bosonic codes
   ===================================================================== */
(() => {
const G = 5;

/* ---------- toric code geometry on an L × L torus (qubits on edges) ---------- */
const torus = L => {
  const hE = (x, y) => ((y + L) % L) * L + ((x + L) % L), vE = (x, y) => L * L + ((y + L) % L) * L + ((x + L) % L);
  const star = (x, y) => [hE(x, y), hE(x - 1, y), vE(x, y), vE(x, y - 1)];
  const plaq = (x, y) => [hE(x, y), hE(x, y + 1), vE(x, y), vE(x + 1, y)];
  const ends = e => e < L * L ? [[e % L, Math.floor(e / L)], [(e % L + 1) % L, Math.floor(e / L)]] : [[(e - L * L) % L, Math.floor((e - L * L) / L)], [(e - L * L) % L, (Math.floor((e - L * L) / L) + 1) % L]];
  const eAny = z => { const out = []; for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) if (star(x, y).reduce((s, e) => s ^ z[e], 0)) out.push([x, y]); return out; };
  const mAny = xe => { const out = []; for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) if (plaq(x, y).reduce((s, e) => s ^ xe[e], 0)) out.push([x, y]); return out; };
  const zWind = z => { let a = 0, b = 0; for (let y = 0; y < L; y++) a ^= z[hE(0, y)]; for (let x = 0; x < L; x++) b ^= z[vE(x, 0)]; return [a, b]; };
  const xWind = xe => { let a = 0, b = 0; for (let x = 0; x < L; x++) a ^= xe[hE(x, 0)]; for (let y = 0; y < L; y++) b ^= xe[vE(0, y)]; return [a, b]; };
  return { L, n: 2 * L * L, hE, vE, star, plaq, ends, eAny, mAny, zWind, xWind };
};
/* shortest path of edges between two vertices on the torus (x first, then y) */
const torPath = (T, a, b) => {
  const L = T.L, out = []; let [x, y] = a;
  let dx = ((b[0] - x) % L + L) % L; if (dx > L / 2) dx -= L; let dy = ((b[1] - y) % L + L) % L; if (dy > L / 2) dy -= L;
  while (dx) { if (dx > 0) { out.push(T.hE(x, y)); x = (x + 1) % L; dx--; } else { x = (x - 1 + L) % L; out.push(T.hE(x, y)); dx++; } }
  while (dy) { if (dy > 0) { out.push(T.vE(x, y)); y = (y + 1) % L; dy--; } else { y = (y - 1 + L) % L; out.push(T.vE(x, y)); dy++; } }
  return out;
};
const torDist = (L, a, b) => { const dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]); return Math.min(dx, L - dx) + Math.min(dy, L - dy); };

LESSONS.push({
  id: 'toric', n: 21.5, stage: G, minutes: 18, title: 'The toric code and anyons',
  lede: 'Kitaev’s toric code stores two qubits in the topology of a doughnut. Errors become particles that wander and annihilate, and a logical error is a particle that has gone all the way round.',
  html: `
<h2>Qubits on the edges of a torus</h2>
<p>In 1997 Alexei Kitaev placed qubits on the edges of an ${m('L × L')} square grid whose opposite sides are joined, so the grid wraps into a torus. There are ${m('2L²')} qubits and two kinds of stabilizers ([[L:stabilizers]]):</p>
<ul>
<li>a <strong>star</strong> operator ${m('A<sub>v</sub>')} for every vertex: X on the four edges meeting there;</li>
<li>a <strong>plaquette</strong> operator ${m('B<sub>p</sub>')} for every square face: Z on its four edges.</li>
</ul>
<p>A star and a plaquette share either zero or two edges, so all of them commute. The product of all stars is the identity, as is the product of all plaquettes, so only ${m('2L² − 2')} are independent. That leaves ${m('2L² − (2L² − 2) = 2')} logical qubits, however large the lattice. The surface code of [[L:qec]] is the same construction cut open, with boundaries in place of the wrap-around; it stores one qubit.</p>
<h2>Errors are particles</h2>
<p>Apply Z to one edge. The two stars at its ends now return −1: the error has created a pair of point-like excitations, called <strong>e particles</strong>, at those vertices. Apply Z to a neighbouring edge and one of them hops along; a string of Z errors has e particles only at its two ends. X errors behave the same way on the <strong>dual lattice</strong>: a chain of X errors, drawn across the edges it flips, creates <strong>m particles</strong> on the plaquettes at its ends. The syndrome reveals where the particles are, not where the strings run.</p>
<p>If a string closes into a loop that could be shrunk to a point, it equals a product of plaquettes (or stars), so it is a stabilizer and does nothing to the stored information. Decoding means pairing up particles with strings that, together with the actual errors, form such harmless loops.</p>
<h2>Logical operators wrap around</h2>
<p>A loop that runs all the way around the torus cannot be shrunk. It commutes with every stabilizer, so it creates no particles, but it is not a product of stabilizers: it is a <strong>logical operator</strong>. Z loops around the two directions of the torus act as ${m('Z̄₁')} and ${m('Z̄₂')}; X loops on the dual lattice give ${m('X̄₁')} and ${m('X̄₂')}. Their length is ${m('L')}, so the code distance is ${m('L')}. A logical error happens when particles created by noise wander apart and meet again “the long way round”.</p>
${LAB('anyons')}
<h2>Anyons and topological order</h2>
<p>Drag an m particle once around an e particle and the state picks up a factor of −1, even though the two never touch. The closed X loop it traces is the product of the stars it encloses, and one of those stars sits on the e particle and has value −1. Particles whose exchange gives phases other than the ±1 of bosons and fermions in this sense are called <strong>anyons</strong>; the toric code is the simplest system with <strong>topological order</strong>. The stored information is encoded in global properties, which no local disturbance can read or change.</p>
<p>The same physics shows up in the energy. Take ${m('H = −Σ A<sub>v</sub> − Σ B<sub>p</sub>')}: its four degenerate ground states are the codewords, and every anyon costs energy. But creating a pair costs a fixed amount and moving it costs nothing, so at any nonzero temperature thermal anyons appear, wander and eventually wrap the torus. A two-dimensional toric code is not a self-correcting memory; it needs active decoding.</p>
${LAB('thermal')}
${NOTE('Beyond the toric code', `<p>Kitaev’s 2003 paper proposed going further: <strong>non-abelian anyons</strong>, whose braiding acts as a unitary on a degenerate space and could perform gates by itself, protected by topology. Majorana zero modes in superconducting nanowires are one candidate, and Google and Quantinuum have demonstrated non-abelian braiding statistics in simulated topological phases on their processors. Engineering a topological qubit in materials remains an open challenge.</p>`)}
`,
  labs: {
    anyons: {
      title: 'Anyons on a torus',
      cap: 'A 5 × 5 toric code. Opposite sides of the frame are the same edge (arrows). In Z mode, tap an edge to flip it with Z (copper) and create or move e particles on vertices; tap a square to apply a plaquette stabilizer, which deforms strings without creating particles. X mode does the same for X errors (blue, drawn on the dual lattice) and m particles on squares; tap a vertex to apply a star. Braid moves an m particle around an e particle.',
      build(body, id) {
        const L = 5, T = torus(L); let z = new Uint8Array(T.n), xe = new Uint8Array(T.n), mode = 'Z', hl = null, busy = false;
        const box = h('div', { class: 'circ-wrap', style: 'background:var(--surface);display:grid;place-items:center;padding:8px' }), ro = h('div', { class: 'readout', style: 'white-space:normal' }), stat = h('div', { class: 'status' });
        const S = 64, M = 34, W = M * 2 + L * S;
        const P = (x, y) => [M + x * S, M + y * S];
        const render = () => {
          const svg = sv('svg', { viewBox: `0 0 ${W} ${W}`, width: W, height: W, class: 'sc', role: 'img', 'aria-label': 'Toric code lattice', style: `max-width:${W}px;width:100%` });
          svg.append(sv('rect', { x: M, y: M, width: L * S, height: L * S, fill: 'none', stroke: 'var(--line)', 'stroke-dasharray': '4 4' }));
          for (const [x1, y1, x2, y2] of [[M + L * S / 2 - 10, M - 14, M + L * S / 2 + 10, M - 14], [M + L * S / 2 - 10, M + L * S + 14, M + L * S / 2 + 10, M + L * S + 14]]) svg.append(sv('path', { d: `M${x1} ${y1} L${x2} ${y2} M${x2 - 6} ${y2 - 4} L${x2} ${y2} L${x2 - 6} ${y2 + 4}`, stroke: 'var(--muted)', fill: 'none', 'stroke-width': 1.5 }));
          for (const [x1, y1, x2, y2] of [[M - 14, M + L * S / 2 - 10, M - 14, M + L * S / 2 + 10], [M + L * S + 14, M + L * S / 2 - 10, M + L * S + 14, M + L * S / 2 + 10]]) svg.append(sv('path', { d: `M${x1} ${y1} L${x2} ${y2} M${x2 - 4} ${y2 - 6} L${x2} ${y2} L${x2 + 4} ${y2 - 6}`, stroke: 'var(--muted)', fill: 'none', 'stroke-width': 1.5 }));
          const plaqEl = [];
          for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) { const [px, py] = P(x, y), r = sv('rect', { x: px + 4, y: py + 4, width: S - 8, height: S - 8, rx: 6, fill: hl && hl.p && hl.p[0] === x && hl.p[1] === y ? 'var(--copper-wash)' : 'transparent', style: 'cursor:pointer' }); r.addEventListener('click', () => click('p', x, y)); svg.append(r); plaqEl.push(r); }
          for (let e = 0; e < T.n; e++) {
            const [[x1, y1]] = T.ends(e), horiz = e < L * L, [ax, ay] = P(x1, y1), bx = horiz ? ax + S : ax, by = horiz ? ay : ay + S;
            svg.append(sv('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: 'var(--line)', 'stroke-width': 1.5 }));
            if (z[e]) svg.append(sv('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: 'var(--copper)', 'stroke-width': 6, 'stroke-linecap': 'round' }));
            if (xe[e]) { const mx = (ax + bx) / 2, my = (ay + by) / 2; svg.append(sv('line', horiz ? { x1: mx, y1: my - S / 2, x2: mx, y2: my + S / 2 } : { x1: mx - S / 2, y1: my, x2: mx + S / 2, y2: my }, null)); svg.lastChild.setAttribute('stroke', 'var(--cyan)'); svg.lastChild.setAttribute('stroke-width', 5); svg.lastChild.setAttribute('stroke-linecap', 'round'); }
            const hit = sv('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: 'transparent', 'stroke-width': 18, style: 'cursor:pointer' }); hit.addEventListener('click', () => click('e', e)); svg.append(hit);
          }
          for (let y = 0; y <= L; y++) for (let x = 0; x <= L; x++) { const [px, py] = P(x, y), ghost = x === L || y === L, c3 = sv('circle', { cx: px, cy: py, r: ghost ? 2.5 : 4, fill: ghost ? 'var(--line)' : 'var(--ink)', style: ghost ? '' : 'cursor:pointer' }); if (!ghost) { const hitv = sv('circle', { cx: px, cy: py, r: 11, fill: 'transparent', style: 'cursor:pointer' }); hitv.addEventListener('click', () => click('v', x, y)); svg.append(c3, hitv); } else svg.append(c3); }
          for (const [x, y] of T.eAny(z)) for (const [gx, gy] of [[x, y]].concat(x === 0 ? [[L, y]] : []).concat(y === 0 ? [[x, L]] : []).concat(x === 0 && y === 0 ? [[L, L]] : [])) { const [px, py] = P(gx, gy); svg.append(sv('circle', { cx: px, cy: py, r: 10, fill: 'var(--copper)', stroke: 'var(--surface)', 'stroke-width': 2.5 })); svg.append(sv('text', { x: px, y: py + 1, class: 'c-sub', style: 'fill:var(--on-copper);font-size:11px;font-weight:700;text-anchor:middle;dominant-baseline:middle' }, 'e')); }
          for (const [x, y] of T.mAny(xe)) { const [px, py] = P(x + .5, y + .5); svg.append(sv('rect', { x: px - 10, y: py - 10, width: 20, height: 20, rx: 3, fill: 'var(--cyan)', stroke: 'var(--surface)', 'stroke-width': 2.5 })); svg.append(sv('text', { x: px, y: py + 1, class: 'c-sub', style: 'fill:var(--surface);font-size:11px;font-weight:700;text-anchor:middle;dominant-baseline:middle' }, 'm')); }
          box.innerHTML = ''; box.append(svg);
          const ne = T.eAny(z).length, nm = T.mAny(xe).length, zw = T.zWind(z), xw = T.xWind(xe);
          const effect = (n2, w, a, b) => n2 ? `${n2} particle${n2 > 1 ? 's' : ''} present: a decoder must pair them` : (w[0] || w[1]) ? `closed strings wrap the torus: logical ${[w[0] ? a : '', w[1] ? b : ''].filter(Boolean).join(' and ')} applied` : 'no particles, no wrapping: the stored qubits are untouched';
          ro.innerHTML = `<span class="k">Z errors </span>${z.reduce((s, v) => s + v, 0)} · ${effect(ne, zw, 'Z̄₁', 'Z̄₂')}<br><span class="k">X errors </span>${xe.reduce((s, v) => s + v, 0)} · ${effect(nm, xw, 'X̄₁', 'X̄₂')}`;
        };
        const click = (kind, a, b) => {
          if (busy) return;
          if (kind === 'e') { if (mode === 'Z') z[a] ^= 1; else xe[a] ^= 1; stat.textContent = mode === 'Z' ? 'Z on an edge flips the two stars at its ends.' : 'X on an edge flips the two squares on either side.'; }
          else if (kind === 'p' && mode === 'Z') { for (const e of T.plaq(a, b)) z[e] ^= 1; stat.textContent = 'Applied a plaquette stabilizer: the Z string is deformed, but no particle appears and nothing logical changes.'; }
          else if (kind === 'v' && mode === 'X') { for (const e of T.star(a, b)) xe[e] ^= 1; stat.textContent = 'Applied a star stabilizer: the X string is deformed on the dual lattice, with no new particles.'; }
          else stat.textContent = mode === 'Z' ? 'In Z mode, tap edges (errors) or squares (plaquette stabilizers).' : 'In X mode, tap edges (errors) or vertices (star stabilizers).';
          stat.className = 'status'; render();
        };
        const braid = () => {
          if (busy) return; busy = true; z = new Uint8Array(T.n); xe = new Uint8Array(T.n); z[T.hE(2, 2)] = 1;
          const seq = [T.hE(2, 2), T.vE(2, 2), T.hE(1, 2), T.vE(2, 1)], msgs = ['A Z error made two e particles. Now an X error creates a pair of m particles beside one of them…', '…one m particle moves around the e particle…', '…and further round…', '…until the pair meets and annihilates. The X loop equals the star operator at the enclosed vertex, which is −1 because an e particle sits there: the state picked up a factor of −1.'];
          stat.className = 'status'; stat.textContent = 'Start: one Z error, two e particles.'; render();
          seq.forEach((e, k) => Scope.later(dur(900) * (k + 1), () => { xe[e] ^= 1; stat.textContent = msgs[k]; if (k === 3) { stat.className = 'status good'; busy = false; } render(); }));
          if (!dur(900)) busy = false;
        };
        const rnd = () => { for (let e = 0; e < T.n; e++) { if (Math.random() < .07) z[e] ^= 1; if (Math.random() < .05) xe[e] ^= 1; } stat.textContent = 'Random errors added. Where are the strings? The particles alone do not tell you.'; stat.className = 'status'; render(); };
        const logical = () => { z = new Uint8Array(T.n); for (let x = 0; x < L; x++) z[T.hE(x, 2)] = 1; stat.textContent = 'A Z loop around the torus: no particles anywhere, yet a logical operator has been applied. Try deforming it with plaquettes.'; stat.className = 'status bad'; render(); };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'Z', label: 'Z mode (e particles)' }, { v: 'X', label: 'X mode (m particles)' }], mode, v => { mode = v; stat.textContent = v === 'Z' ? 'Z mode: tap edges or squares.' : 'X mode: tap edges or vertices.'; stat.className = 'status'; }, 'Error type'),
          btn('Random errors', rnd, 'sm'), btn('Logical Z̄ loop', logical, 'sm'), btn('Braid m around e', braid, 'pri sm'), btn('Clear', () => { z = new Uint8Array(T.n); xe = new Uint8Array(T.n); stat.textContent = 'Cleared.'; render(); }, 'sm')),
          h('div', { class: 'split wide-l' }, box, h('div', { class: 'stack' }, stat, ro)));
        stat.textContent = 'Tap an edge to add a Z error.'; render();
      }
    },
    thermal: {
      title: 'A toric code in a warm bath',
      cap: 'Z errors appear and disappear by Metropolis dynamics at temperature T (each particle costs energy 2). Particles are copper dots; error strings are faint. After every sweep a simple decoder pairs the particles by shortest paths and checks whether that would restore the stored qubit. The strip shows the verdict over time. The time to the first failure barely grows with lattice size: the 2D code needs active correction.',
      build(body, id) {
        let L = 8, Tt = .5, T = torus(L), z = new Uint8Array(T.n), sweeps = 0, hist = [], firstFail = null, run = true;
        const cv = canvas('sq', 'max-width:340px;margin:0 auto'), strip = canvas('', 'height:46px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const decodeOK = () => {
          const an = T.eAny(z), left = an.slice(), corr = new Uint8Array(T.n);
          while (left.length) { let bi = 0, bj = 1, bd = 1e9; for (let i = 0; i < left.length; i++) for (let j = i + 1; j < left.length; j++) { const dd = torDist(L, left[i], left[j]); if (dd < bd) { bd = dd; bi = i; bj = j; } } for (const e of torPath(T, left[bi], left[bj])) corr[e] ^= 1; left.splice(bj, 1); left.splice(bi, 1); }
          const w = T.zWind(z.map((v, e) => v ^ corr[e])); return !(w[0] || w[1]);
        };
        const sweep = () => {
          for (let k = 0; k < T.n; k++) {
            const e = Math.floor(Math.random() * T.n), [a, b] = T.ends(e); let dN = 0;
            for (const [x, y] of [a, b]) dN += T.star(x, y).reduce((s, f) => s ^ z[f], 0) ? -1 : 1;
            const dE = 2 * dN; if (dE <= 0 || Math.random() < Math.exp(-dE / Tt)) z[e] ^= 1;
          }
          sweeps++; const ok = decodeOK(); hist.push(ok); if (hist.length > 400) hist.shift(); if (!ok && firstFail == null) firstFail = sweeps;
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const Th = Theme.get(), S = (Math.min(w, H) - 20) / L, ox = (w - S * L) / 2, oy = (H - S * L) / 2;
          ctx.strokeStyle = Th.line; ctx.lineWidth = 1; for (let i = 0; i <= L; i++) { ctx.beginPath(); ctx.moveTo(ox, oy + i * S); ctx.lineTo(ox + L * S, oy + i * S); ctx.moveTo(ox + i * S, oy); ctx.lineTo(ox + i * S, oy + L * S); ctx.stroke(); }
          ctx.strokeStyle = rgba(Th.copper, .55); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
          for (let e = 0; e < T.n; e++) if (z[e]) { const [[x1, y1]] = T.ends(e), hz = e < L * L; ctx.beginPath(); ctx.moveTo(ox + x1 * S, oy + y1 * S); ctx.lineTo(ox + (x1 + (hz ? 1 : 0)) * S, oy + (y1 + (hz ? 0 : 1)) * S); ctx.stroke(); }
          ctx.lineCap = 'butt';
          for (const [x, y] of T.eAny(z)) dot(ctx, ox + x * S, oy + y * S, Math.max(4, S * .16), Th.copper, Th.surface);
        });
        const sp = painter(strip, ({ ctx, w, h: H }) => { const Th = Theme.get(), bw = w / 400; hist.forEach((ok, k) => { ctx.fillStyle = ok ? Th.good : Th.bad; ctx.globalAlpha = ok ? .55 : 1; ctx.fillRect(k * bw, 8, Math.max(1, bw), H - 16); }); ctx.globalAlpha = 1; });
        let last = 0;
        Scope.tick(now => { if (!run || reduced() || now - last < 70) return; last = now; for (let k = 0; k < 2; k++) sweep(); upd(); });
        const upd = () => {
          const na = T.eAny(z).length, rate = hist.length ? hist.filter(v => !v).length / hist.length : 0;
          ro.innerHTML = `<span class="k">sweeps </span>${sweeps} &nbsp; <span class="k">particles now </span>${na}<br><span class="k">decoding would succeed now </span>${hist.length ? (hist[hist.length - 1] ? 'yes' : 'no') : '—'}<br><span class="k">first failure </span>${firstFail == null ? 'not yet' : 'after ' + firstFail + ' sweeps'}<br><span class="k">failing fraction (recent) </span>${pct(rate, 0)}`;
          p.inv(); sp.inv();
        };
        const reset = () => { T = torus(L); z = new Uint8Array(T.n); sweeps = 0; hist = []; firstFail = null; upd(); };
        const runBtn = btn('Pause', () => { run = !run; runBtn.textContent = run ? 'Pause' : 'Resume'; }, 'sm');
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, strip,
          slider({ id: id('T'), label: 'Temperature T', min: .3, max: 1.2, step: .05, value: Tt, fmt: v => num(v, 2), on: v => { Tt = v; } }),
          field('Lattice size L', seg([4, 6, 8, 12].map(v => ({ v, label: String(v) })), L, v => { L = v; reset(); }, 'Lattice size')),
          h('div', { class: 'btns' }, runBtn, btn('Step 20 sweeps', () => { for (let k = 0; k < 20; k++) sweep(); upd(); }, 'sm'), btn('Restart', reset, 'sm')), ro)));
        if (reduced()) { run = false; runBtn.textContent = 'Resume'; }
        upd();
      }
    }
  },
  take: ['The toric code puts qubits on edges of a torus, with commuting star (XXXX) and plaquette (ZZZZ) stabilizers; it encodes 2 logical qubits at distance L.',
    'Error strings create anyons at their endpoints: e particles on vertices (Z strings) and m particles on plaquettes (X strings on the dual lattice).',
    'Contractible loops are stabilizers; loops that wrap the torus are logical operators, so logical errors are anyons that went the long way round.',
    'Braiding m around e gives −1 (topological order); thermal anyons make the 2D code a non-self-correcting memory.'],
  quiz: QZ([
    ['How many logical qubits does the toric code on an L × L torus encode?', ['1', '2', 'L', 'L²'], 1, 'There are 2L² qubits and 2L² − 2 independent stabilizers (the product of all stars and of all plaquettes is the identity), leaving two logical qubits for any L.'],
    ['What do star operators A_v consist of?', ['Z on the four edges around a face', 'X on the four edges meeting at a vertex', 'Y on all edges', 'X on one edge'], 1, 'Stars are X-type on the edges at a vertex; plaquettes are Z-type on the edges around a face. They overlap on zero or two edges, so they commute.'],
    ['A single Z error on one edge creates…', ['One e particle', 'Two e particles at the edge’s endpoints', 'Two m particles', 'Nothing detectable'], 1, 'The Z anticommutes with the two star operators at the edge’s ends, so both flip to −1: a pair of e particles.'],
    ['Where do m particles live?', ['On vertices', 'On plaquettes, at the ends of X strings on the dual lattice', 'On edges', 'Outside the lattice'], 1, 'X errors anticommute with the plaquette operators containing them. A chain of X errors is naturally drawn on the dual lattice, with m particles on the faces at its ends.'],
    ['What is a closed Z loop that can be shrunk to a point?', ['A logical error', 'A product of plaquette stabilizers, harmless to the encoded information', 'A pair of anyons', 'An X error'], 1, 'A contractible loop encloses a set of plaquettes, and their product is exactly the loop. Stabilizers act trivially on codewords.'],
    ['What is a Z loop that wraps all the way around the torus?', ['A stabilizer', 'A logical operator', 'Impossible', 'A detectable error'], 1, 'It commutes with all stabilizers (no particles), but is not a product of them, so it changes the encoded state: a logical Z̄.'],
    ['What is the code distance of the L × L toric code?', ['2', '4', 'L', '2L²'], 2, 'The shortest non-contractible loop has L edges, so the minimum weight of a logical operator is L.'],
    ['What happens when an m particle is moved once around an e particle?', ['Nothing', 'The state picks up a factor of −1', 'They annihilate', 'Both particles disappear'], 1, 'The closed X loop equals the product of enclosed star operators, one of which is −1 because of the e particle. This mutual phase is the hallmark of anyonic statistics.'],
    ['Why is the 2D toric code not a self-correcting memory at finite temperature?', ['It has no logical qubits', 'Creating an anyon pair costs fixed energy and moving them is free, so thermal anyons can wander and wrap the torus', 'Its stabilizers do not commute', 'It only works at zero temperature in theory'], 1, 'The energy barrier to a logical error does not grow with system size, so the memory lifetime does not grow with L. Active syndrome measurement and decoding are needed.'],
    ['How is the surface code related to the toric code?', ['They are unrelated', 'It is the toric code cut open, with boundaries replacing the wrap-around, encoding one logical qubit', 'It is the toric code with Y stabilizers', 'It needs non-abelian anyons'], 1, 'Cutting the torus open and giving it two kinds of boundary keeps the local structure but leaves one logical qubit, with logical strings running between boundaries.']
  ])
});

/* ---------- planar-code matching graph for X errors (code capacity) ---------- */
const planar = d => {
  const C = d - 1, nodes = d * C, B = nodes, edges = [];
  const id2 = (r, c2) => r * C + c2;
  for (let r = 0; r < d; r++) {
    edges.push({ u: B, v: id2(r, 0), left: true, g: [r, -1, r, 0] });
    for (let c2 = 0; c2 < C - 1; c2++) edges.push({ u: id2(r, c2), v: id2(r, c2 + 1), g: [r, c2, r, c2 + 1] });
    edges.push({ u: id2(r, C - 1), v: B, g: [r, C - 1, r, C] });
  }
  for (let r = 0; r < d - 1; r++) for (let c2 = 0; c2 < C; c2++) edges.push({ u: id2(r, c2), v: id2(r + 1, c2), g: [r, c2, r + 1, c2] });
  const adj = [...Array(nodes + 1)].map(() => []); edges.forEach((e, k) => { adj[e.u].push(k); adj[e.v].push(k); });
  return { d, C, nodes, B, edges, adj, id2 };
};
const syndromeOf = (P, err) => { const s = new Uint8Array(P.nodes + 1); P.edges.forEach((e, k) => { if (err[k]) { s[e.u] ^= 1; s[e.v] ^= 1; } }); s[P.B] = 0; return s; };
const logicalOf = (P, err, corr) => { let par = 0; P.edges.forEach((e, k) => { if (e.left) par ^= err[k] ^ corr[k]; }); return par === 1; };
/* union–find decoder, recording every growth round for animation */
function unionFind(P, syn, record) {
  const N = P.nodes + 1, par = [...Array(N).keys()], odd = new Uint8Array(N), bnd = new Uint8Array(N), inC = new Uint8Array(N), sup = new Uint8Array(P.edges.length), from = new Int32Array(P.edges.length).fill(-1);
  const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  const unite = (a, b) => { a = find(a); b = find(b); if (a === b) return; par[b] = a; odd[a] ^= odd[b]; bnd[a] |= bnd[b]; };
  for (let v = 0; v < P.nodes; v++) if (syn[v]) { inC[v] = 1; odd[v] = 1; }
  inC[P.B] = 1; bnd[P.B] = 1;
  const frames = [];
  const snap = () => { if (record) frames.push({ sup: Uint8Array.from(sup), from: Int32Array.from(from), inC: Uint8Array.from(inC), act: [...Array(N).keys()].map(v => inC[v] && odd[find(v)] && !bnd[find(v)] ? 1 : 0) }); };
  snap();
  const active = v => inC[v] && odd[find(v)] && !bnd[find(v)];
  for (let round = 0; round < 4 * P.d + 4; round++) {
    let any = false; const grow = [];
    P.edges.forEach((e, k) => { if (sup[k] >= 2) return; const a = active(e.u) ? 1 : 0, b = active(e.v) ? 1 : 0; if (a || b) { grow.push([k, a + b, a ? e.u : e.v]); any = true; } });
    if (!any) break;
    for (const [k, inc, fr] of grow) { sup[k] = Math.min(2, sup[k] + inc); if (sup[k] === 1) from[k] = fr; }
    for (const [k] of grow) if (sup[k] === 2) { const e = P.edges[k]; inC[e.u] = 1; inC[e.v] = 1; unite(e.u, e.v); }
    snap();
  }
  /* peeling: spanning forest of fully grown edges, leaves first */
  const corr = new Uint8Array(P.edges.length), mark = Uint8Array.from(syn), seen = new Uint8Array(N), parentE = new Int32Array(N).fill(-1), parentV = new Int32Array(N).fill(-1);
  const roots = [P.B].concat([...Array(P.nodes).keys()]);
  for (const r of roots) {
    if (seen[r] || !inC[r]) continue; const order = [r]; seen[r] = 1;
    for (let i = 0; i < order.length; i++) { const u = order[i]; for (const k of P.adj[u]) { if (sup[k] < 2) continue; const e = P.edges[k], v = e.u === u ? e.v : e.u; if (!seen[v]) { seen[v] = 1; parentE[v] = k; parentV[v] = u; order.push(v); } } }
    for (let i = order.length - 1; i > 0; i--) { const v = order[i]; if (mark[v]) { corr[parentE[v]] ^= 1; mark[v] = 0; mark[parentV[v]] ^= 1; } }
  }
  return { corr, frames };
}
const mwpm = (P, syn) => {
  const def = []; for (let v = 0; v < P.nodes; v++) if (syn[v]) def.push(v);
  const rc = v => [Math.floor(v / P.C), v % P.C], corr = new Uint8Array(P.edges.length);
  if (def.length > 14) return null;
  const dist = def.map(a => def.map(b => { const [r1, c1] = rc(a), [r2, c2] = rc(b); return Math.abs(r1 - r2) + Math.abs(c1 - c2); })), bd = def.map(a => { const c2 = rc(a)[1]; return Math.min(c2 + 1, P.C - c2); });
  const edgeAt = (r1, c1, r2, c2) => P.edges.findIndex(e => (e.g[0] === r1 && e.g[1] === c1 && e.g[2] === r2 && e.g[3] === c2) || (e.g[0] === r2 && e.g[1] === c2 && e.g[2] === r1 && e.g[3] === c1));
  for (const [i, j] of matchDefects(def.length, dist, bd, 14)) {
    let [r, c2] = rc(def[i]);
    if (j < 0) { if (c2 + 1 <= P.C - c2) { while (c2 >= 0) { corr[edgeAt(r, c2 - 1, r, c2)] ^= 1; c2--; } } else { while (c2 <= P.C - 1) { corr[edgeAt(r, c2, r, c2 + 1)] ^= 1; c2++; } } continue; }
    const [r2, c3] = rc(def[j]);
    while (c2 !== c3) { const nc = c2 + Math.sign(c3 - c2); corr[edgeAt(r, c2, r, nc)] ^= 1; c2 = nc; }
    while (r !== r2) { const nr = r + Math.sign(r2 - r); corr[edgeAt(r, c2, nr, c2)] ^= 1; r = nr; }
  }
  return corr;
};

LESSONS.push({
  id: 'unionfind', n: 23.5, stage: G, minutes: 16, title: 'The union–find decoder',
  lede: 'A decoder has about a microsecond to digest each round of syndromes. Union–find trades a sliver of accuracy for speed by growing clusters around defects until every cluster can be explained.',
  html: `
<h2>Decoding against the clock</h2>
<p>A superconducting surface code produces a fresh round of syndrome data roughly every microsecond. The decoder must keep up on average, or a <strong>backlog</strong> builds: unprocessed syndromes pile up, and any operation that depends on a decoded result, such as a T gate needing a correction ([[L:magic]]), has to wait for them. Barbara Terhal pointed out that a decoder that is too slow by any constant factor makes the computation slow down exponentially in its depth. Minimum-weight perfect matching ([[L:decoders]]) is accurate, and modern implementations such as sparse blossom are fast, but simpler decoders are attractive for hardware.</p>
<h2>Union–find in three steps</h2>
<p>Nicolas Delfosse and Naomi Nickerson introduced the <strong>union–find decoder</strong> in 2017:</p>
<ol>
<li><strong>Grow.</strong> Every cluster that contains an odd number of defects and has not reached a boundary grows by half an edge in every direction.</li>
<li><strong>Merge.</strong> When growth completes an edge between two clusters, they join. A cluster stops growing once its defect count is even, since its defects can then be paired among themselves, or once it touches a boundary, which can absorb one defect.</li>
<li><strong>Peel.</strong> Inside each finished cluster, take a spanning tree and walk it from the leaves inwards, adding an edge to the correction whenever a leaf holds a defect and passing that defect up to its parent.</li>
</ol>
<p>Merging uses the union–find data structure, whose operations take almost constant time, so the whole decoder runs in time ${m('O(n α(n))')} for ${m('n')} qubits, where ${m('α')} is the inverse Ackermann function, below 5 for any conceivable ${m('n')}.</p>
${LAB('grow')}
<h2>How much accuracy does it give up?</h2>
<p>Clusters grow uniformly, so union–find sometimes pairs defects in a way matching would not. Under independent bit-flip noise its threshold is about 9.9%, against 10.3% for matching; with noisy measurements, roughly 2.6% against 2.9%. Weighting the growth by edge probabilities closes much of the gap. Because its operations are simple and local, union–find has been built into FPGAs and custom chips that decode in well under a microsecond.</p>
${LAB('ufthresh')}
<h2>The decoder landscape</h2>
<ul>
<li><strong>Matching</strong> (PyMatching, sparse blossom): the accurate baseline for surface codes; correlated matching adds Y-error information.</li>
<li><strong>Belief propagation with ordered-statistics post-processing</strong>: the standard for qLDPC codes ([[L:codes]]), where matching does not apply.</li>
<li><strong>Neural network decoders</strong>: trained on experimental data, they can learn hardware-specific correlations; Google DeepMind’s AlphaQubit (2024) outperformed matching on Sycamore data, though running such networks within a microsecond is still a challenge.</li>
<li><strong>Tensor-network decoders</strong>: near-optimal maximum-likelihood decoding, far too slow for real time, used as a benchmark.</li>
</ul>
`,
  labs: {
    grow: {
      title: 'Clusters growing',
      cap: 'A distance-7 planar code under bit-flip noise, drawn as its matching graph: nodes are Z checks, edges are data qubits, and the stubs at the sides lead to the boundaries. Red crosses mark the hidden errors, copper discs the defects. Step through the growth: half-grown edges are half-drawn; active clusters (odd, not touching a boundary) are copper, finished ones blue. Peeling then gives the correction (thick blue).',
      build(body, id) {
        const d = 7, P = planar(d); let err, syn, res, fr = 0, showErr = true, peeled = false, pe = .08;
        const box = h('div', { class: 'circ-wrap', style: 'background:var(--surface);display:grid;place-items:center;padding:6px' }), ro = h('div', { class: 'readout', style: 'white-space:normal' }), stat = h('div', { class: 'status' });
        const S = 56, M = 40, W = M * 2 + P.C * S + S * .7, H = M * 2 + (d - 1) * S;
        const XY = (r, c2) => [M + S * .35 + c2 * S, M + r * S];
        const fresh = () => { err = new Uint8Array(P.edges.length).map(() => Math.random() < pe ? 1 : 0); syn = syndromeOf(P, err); res = unionFind(P, syn, true); fr = 0; peeled = false; render(); };
        const render = () => {
          const F = res.frames[Math.min(fr, res.frames.length - 1)], svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'sc', role: 'img', 'aria-label': 'Union–find decoding on a matching graph', style: `max-width:${W}px;width:100%` });
          P.edges.forEach((e, k) => {
            const [r1, c1, r2, c2] = e.g, [ax, ay] = XY(r1, c1 < 0 ? -.55 : c1), [bx, by] = XY(r2, c2 >= P.C ? P.C - .45 : c2);
            svg.append(sv('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: 'var(--line)', 'stroke-width': 1.5 }));
            const s = F.sup[k];
            if (s === 2) svg.append(sv('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: 'var(--copper-hi)', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: .8 }));
            else if (s === 1) { const fu = F.from[k] === e.u, [sx, sy] = fu ? [ax, ay] : [bx, by]; svg.append(sv('line', { x1: sx, y1: sy, x2: (ax + bx) / 2, y2: (ay + by) / 2, stroke: 'var(--copper-hi)', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: .8 })); }
            if (peeled && res.corr[k]) svg.append(sv('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: 'var(--cyan)', 'stroke-width': 4.5, 'stroke-linecap': 'round' }));
            if (showErr && err[k]) { const mx = (ax + bx) / 2, my = (ay + by) / 2; svg.append(sv('path', { d: `M${mx - 6} ${my - 6} L${mx + 6} ${my + 6} M${mx + 6} ${my - 6} L${mx - 6} ${my + 6}`, stroke: 'var(--bad)', 'stroke-width': 2.5 })); }
          });
          for (let r = 0; r < d; r++) for (let c2 = 0; c2 < P.C; c2++) {
            const v = P.id2(r, c2), [x, y] = XY(r, c2), inC = F.inC[v], act = F.act[v];
            svg.append(sv('circle', { cx: x, cy: y, r: syn[v] ? 9 : 5, fill: syn[v] ? 'var(--copper)' : inC ? (act ? 'var(--copper-hi)' : 'var(--cyan)') : 'var(--surface)', stroke: inC ? (act ? 'var(--copper)' : 'var(--cyan)') : 'var(--muted)', 'stroke-width': inC ? 2.5 : 1.2 }));
          }
          svg.append(sv('text', { x: 8, y: H / 2, class: 'c-sub', style: 'font-size:10px;fill:var(--muted)', transform: `rotate(-90 12 ${H / 2})` }, 'boundary'));
          box.innerHTML = ''; box.append(svg);
          const nd = syn.reduce((s, v) => s + v, 0), last = fr >= res.frames.length - 1;
          stat.className = 'status' + (peeled ? (logicalOf(P, err, res.corr) ? ' bad' : ' good') : '');
          stat.textContent = peeled ? (logicalOf(P, err, res.corr) ? 'Peeled. The correction plus the errors forms a chain from boundary to boundary: a logical error.' : 'Peeled. The correction cancels the syndrome and only harmless loops remain: success.') : last ? `Growth finished after ${res.frames.length - 1} round${res.frames.length === 2 ? '' : 's'}: every cluster is even or touches a boundary. Press Peel.` : `Round ${fr}: ${F.act.filter(Boolean).length ? 'odd clusters keep growing.' : 'nothing left to grow.'}`;
          const mw = mwpm(P, syn);
          ro.innerHTML = `<span class="k">errors </span>${err.reduce((s, v) => s + v, 0)} &nbsp; <span class="k">defects </span>${nd} &nbsp; <span class="k">growth rounds </span>${res.frames.length - 1}<br><span class="k">union–find </span>${logicalOf(P, err, res.corr) ? 'logical error' : 'success'} &nbsp; <span class="k">matching </span>${mw ? (logicalOf(P, err, mw) ? 'logical error' : 'success') : 'too many defects for the exact matcher here'}`;
        };
        body.append(h('div', { class: 'btns' }, btn('New errors', fresh, 'sm'), btn('Grow one round', () => { if (fr < res.frames.length - 1) { fr++; render(); } }, 'pri sm'), btn('Grow to the end', () => { fr = res.frames.length - 1; render(); }, 'sm'), btn('Peel', () => { fr = res.frames.length - 1; peeled = true; render(); }, 'sm'),
          btn('Show or hide errors', () => { showErr = !showErr; render(); }, 'sm')),
          box, h('div', { class: 'split' }, h('div', { class: 'stack' }, stat, slider({ id: id('p'), label: 'Error rate', min: .02, max: .16, step: .01, value: pe, fmt: v => pct(v, 0), on: v => { pe = v; fresh(); } })), ro));
        fresh();
      }
    },
    ufthresh: {
      title: 'Threshold of union–find',
      cap: 'Monte Carlo estimate of the logical error rate of the union–find decoder for planar codes under independent bit flips. Curves for different distances cross near the threshold (literature value about 9.9%; dashed line). Below it, bigger codes win. The readout times the decoder in this browser: the cost per decode grows roughly in proportion to the number of qubits.',
      build(body, id) {
        const DS = [3, 5, 7, 9, 11], PS = [.04, .06, .08, .09, .1, .11, .12, .14, .16], res = {}, cnt = {}, tm = {};
        let job = null, trials = 0;
        const cv = canvas('', 'height:270px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), stat = h('div', { class: 'status' });
        const cols = () => { const Th = Theme.get(); return [Th.muted, Th.cyan, Th.copper, Th.ink, Th.good]; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const Th = Theme.get(), A = axes(ctx, w, H, { x: [.03, .17], y: [1e-3, 1], ylog: true, xt: [.04, .08, .12, .16], yt: [1e-3, 1e-2, .1, 1], xf: v => pct(v, 0), yf: v => String(v), xl: 'physical error rate p', yl: 'logical error rate' });
          polyline(ctx, [[A.X(.099), A.T], [A.X(.099), A.B]], Th.muted, 1, [4, 4]);
          DS.forEach((d, k) => { const pts = []; PS.forEach(pp => { const key = d + ':' + pp; if (cnt[key]) { const v = Math.max(res[key] / cnt[key], 1e-3); pts.push([A.X(pp), A.Y(v)]); } }); polyline(ctx, pts, cols()[k], 2.2); pts.forEach(q => dot(ctx, ...q, 3.5, cols()[k])); });
        });
        const upd = () => {
          const lines = DS.map(d => `<span class="k">d = ${String(d).padEnd(2)} (${planar(d).edges.length} qubits) </span>${tm[d] ? num(tm[d].t / tm[d].n * 1000, 1) + ' µs per decode' : '—'}`);
          ro.innerHTML = lines.join('<br>'); p.inv();
        };
        const start = () => {
          if (job) return; trials = 0; const per = 600; stat.textContent = 'Sampling…'; stat.className = 'status';
          const queue = []; for (const d of DS) for (const pp of PS) queue.push([d, pp]);
          job = Scope.every(16, () => {
            const t0 = performance.now();
            while (performance.now() - t0 < 12 && queue.length) {
              const [d, pp] = queue[0], key = d + ':' + pp, P = planar(d);
              for (let k = 0; k < 20; k++) { const err = new Uint8Array(P.edges.length).map(() => Math.random() < pp ? 1 : 0), syn = syndromeOf(P, err), a = performance.now(), r = unionFind(P, syn, false), b = performance.now(); (tm[d] = tm[d] || { t: 0, n: 0 }).t += b - a; tm[d].n++; res[key] = (res[key] || 0) + (logicalOf(P, err, r.corr) ? 1 : 0); cnt[key] = (cnt[key] || 0) + 1; trials++; }
              if (cnt[key] >= per) queue.shift();
            }
            upd();
            if (!queue.length) { clearInterval(job); job = null; stat.textContent = `Done: ${trials.toLocaleString()} decodes.`; stat.className = 'status good'; }
          });
        };
        body.append(cv, legendRow(DS.map((d, k) => ['d = ' + d, ['var(--muted)', 'var(--cyan)', 'var(--copper)', 'var(--ink)', 'var(--good)'][k]])), h('div', { class: 'split' }, h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Run the Monte Carlo', start, 'pri sm')), stat), ro));
        upd(); start();
      }
    }
  },
  take: ['Real-time decoding must keep pace with syndrome rounds (about 1 µs); falling behind causes a backlog that slows computation exponentially.',
    'Union–find grows odd clusters by half-edges, merges them, stops when they are even or touch a boundary, then peels a spanning tree to get the correction.',
    'It runs in almost linear time, O(n α(n)), with a threshold near 9.9% versus 10.3% for matching under bit-flip noise.',
    'Matching, belief propagation with OSD, neural networks and tensor networks span the speed–accuracy trade-off.'],
  quiz: QZ([
    ['Why must a surface-code decoder keep up with the syndrome rate?', ['To save memory only', 'Otherwise a backlog builds, and operations that need decoded results wait ever longer, slowing the computation exponentially', 'Because qubits stop working', 'It doesn’t need to'], 1, 'Terhal’s backlog argument: if decoding is slower than syndrome generation, each feed-forward step waits for an ever-growing queue.'],
    ['When does a union–find cluster stop growing?', ['After one round', 'When it contains an even number of defects or touches a boundary', 'When it reaches size d', 'When it merges with any cluster'], 1, 'An even cluster can pair its defects internally, and a boundary can absorb a single defect; either way the cluster can be explained.'],
    ['How much does an odd cluster grow per round?', ['One full edge in one direction', 'Half an edge in every direction along its boundary', 'Until it hits a boundary', 'It doubles in size'], 1, 'Uniform half-edge growth means two clusters approaching each other complete the edge between them in one round.'],
    ['What happens when growth completes an edge between two clusters?', ['Both are deleted', 'They merge into one cluster, with defect parities added', 'The edge is flipped', 'Decoding stops'], 1, 'The union–find structure joins them; the new cluster’s parity is the sum of the two, and it touches a boundary if either did.'],
    ['What does the peeling step do?', ['Removes errors at random', 'Walks a spanning tree of each cluster from leaves to root, adding an edge whenever a leaf holds a defect', 'Measures the qubits again', 'Runs matching inside each cluster'], 1, 'Peeling resolves defects pairwise along the tree, pushing parity towards the root, which is a boundary or ends up even.'],
    ['What is the time complexity of the union–find decoder?', ['O(n³)', 'O(n α(n)), almost linear', 'O(2ⁿ)', 'O(log n)'], 1, 'With path compression and union by size, union–find operations cost α(n), the inverse Ackermann function, which is tiny for all practical n.'],
    ['How does union–find’s threshold compare with matching under independent bit flips?', ['Much higher', 'Slightly lower: about 9.9% versus 10.3%', 'Exactly the same', 'Half as large'], 1, 'Uniform growth occasionally makes worse pairings than minimum-weight matching, costing a small fraction of threshold.'],
    ['Why is union–find attractive for hardware decoders?', ['It needs no syndrome', 'Its operations are simple and local, suiting FPGAs and custom chips with sub-microsecond latency', 'It corrects all errors', 'It only needs one qubit'], 1, 'Cluster growth and merging map naturally onto parallel, local logic, which is hard to do for general matching.'],
    ['Which decoder family is standard for qLDPC codes, where matching does not apply?', ['Union–find on planar graphs', 'Belief propagation with ordered-statistics post-processing (BP+OSD)', 'Lookup tables', 'Majority vote'], 1, 'qLDPC checks create hypergraph-like syndromes. BP gives soft information quickly; OSD fixes cases where BP fails to converge.'],
    ['What did AlphaQubit (2024) demonstrate?', ['A new code', 'A neural network decoder that beat matching on experimental surface-code data', 'A threshold of 50%', 'A decoder that needs no training'], 1, 'Trained on simulated and then real Sycamore data, the recurrent transformer decoder learned hardware-specific noise, though real-time speed remains a challenge.']
  ])
});

/* ---------------- Lattice surgery ---------------- */
const parityMeasure = (st, qa, qb, basis) => {
  if (basis === 'X') { st.g('H', qa); st.g('H', qb); }
  const ma = st.mask(qa), mb = st.mask(qb); let pe = 0; for (let i = 0; i < st.N; i++) if (!(((i & ma) ? 1 : 0) ^ ((i & mb) ? 1 : 0))) pe += st.re[i] ** 2 + st.im[i] ** 2;
  const out = Math.random() < pe ? 0 : 1, nrm = Math.sqrt(out ? 1 - pe : pe) || 1;
  for (let i = 0; i < st.N; i++) { const par = ((i & ma) ? 1 : 0) ^ ((i & mb) ? 1 : 0); if (par !== out) { st.re[i] = 0; st.im[i] = 0; } else { st.re[i] /= nrm; st.im[i] /= nrm; } }
  if (basis === 'X') { st.g('H', qa); st.g('H', qb); }
  return out;
};
const patchSVG = (cfg) => {
  const { d, cols, seamCols, merged, signs, S, M, zl, labels } = cfg, W = M * 2 + (cols - 1) * S, H = M * 2 + (d - 1) * S + 18;
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'sc', role: 'img', 'aria-label': 'Surface code patches for lattice surgery', style: `max-width:${W}px;width:100%` });
  const X = c2 => M + c2 * S, Y = r => M + r * S, inSeam = c2 => seamCols.includes(c2);
  const blocks = merged ? [[0, cols - 1]] : (() => { const out = []; let s = null; for (let c2 = 0; c2 < cols; c2++) { if (inSeam(c2)) { if (s != null) { out.push([s, c2 - 1]); s = null; } } else if (s == null) s = c2; } if (s != null) out.push([s, cols - 1]); return out; })();
  const newChecks = [];
  for (const [a, b] of blocks) {
    for (let i = 0; i < d - 1; i++) for (let j = a; j < b; j++) {
      const t = (i + j) % 2 === 0 ? 'X' : 'Z', isNew = merged && (inSeam(j) || inSeam(j + 1));
      svg.append(sv('rect', { x: X(j), y: Y(i), width: S, height: S, fill: t === 'X' ? 'var(--cyan)' : 'var(--copper)', opacity: isNew ? .5 : .2, stroke: isNew && t === 'Z' ? 'var(--copper)' : 'none', 'stroke-width': 2 }));
      if (isNew && t === 'Z') newChecks.push([X(j) + S / 2, Y(i) + S / 2]);
    }
    for (let i = 0; i < d - 1; i++) { if ((i + a) % 2 === 1) svg.append(sv('path', { d: `M${X(a)} ${Y(i)} A ${S / 2} ${S / 2} 0 0 0 ${X(a)} ${Y(i + 1)} Z`, fill: 'var(--cyan)', opacity: .2 })); if ((i + b - 1) % 2 === 1) svg.append(sv('path', { d: `M${X(b)} ${Y(i)} A ${S / 2} ${S / 2} 0 0 1 ${X(b)} ${Y(i + 1)} Z`, fill: 'var(--cyan)', opacity: .2 })); }
    for (let j = a; j < b; j++) {
      if (j % 2 === 0) { const isNew = merged && (inSeam(j) || inSeam(j + 1)); svg.append(sv('path', { d: `M${X(j)} ${Y(0)} A ${S / 2} ${S / 2} 0 0 1 ${X(j + 1)} ${Y(0)} Z`, fill: 'var(--copper)', opacity: isNew ? .5 : .2, stroke: isNew ? 'var(--copper)' : 'none', 'stroke-width': 2 })); if (isNew) newChecks.push([X(j) + S / 2, Y(0) - S * .22]); }
      if ((d - 2 + j) % 2 === 0) { const isNew = merged && (inSeam(j) || inSeam(j + 1)); svg.append(sv('path', { d: `M${X(j)} ${Y(d - 1)} A ${S / 2} ${S / 2} 0 0 0 ${X(j + 1)} ${Y(d - 1)} Z`, fill: 'var(--copper)', opacity: isNew ? .5 : .2, stroke: isNew ? 'var(--copper)' : 'none', 'stroke-width': 2 })); if (isNew) newChecks.push([X(j) + S / 2, Y(d - 1) + S * .22]); }
    }
  }
  for (const c2 of zl || []) svg.append(sv('line', { x1: X(c2), y1: Y(0) - 6, x2: X(c2), y2: Y(d - 1) + 6, stroke: 'var(--copper)', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  for (let r = 0; r < d; r++) for (let c2 = 0; c2 < cols; c2++) { const seam = inSeam(c2); svg.append(sv('circle', { cx: X(c2), cy: Y(r), r: seam ? 6 : 6.5, fill: seam ? (merged ? 'var(--surface)' : 'var(--surface-2)') : 'var(--ink)', stroke: seam ? 'var(--muted)' : 'none', 'stroke-width': 1.5, 'stroke-dasharray': seam && !merged ? '2 2' : null })); }
  if (signs) newChecks.forEach(([x, y], k) => { const s = signs[k % signs.length]; svg.append(sv('text', { x, y: y + 1, class: 'c-sub', style: `font-size:13px;font-weight:700;text-anchor:middle;dominant-baseline:middle;fill:${s > 0 ? 'var(--ink)' : 'var(--bad)'}` }, s > 0 ? '+1' : MINUS + '1')); });
  (labels || []).forEach(([c2, s]) => svg.append(sv('text', { x: X(c2), y: H - 6, class: 'c-sub', style: 'font-size:12px;font-weight:700;text-anchor:middle;fill:var(--ink)' }, s)));
  return { svg, nNew: newChecks.length };
};
LESSONS.push({
  id: 'surgery', n: 25.5, stage: G, minutes: 17, title: 'Lattice surgery: computing with patches',
  lede: 'Surface-code qubits are square patches on a chip. Logical gates between them are performed by stitching patches together and cutting them apart, which measures joint properties without ever touching a single physical qubit across the seam.',
  html: `
<h2>Patches as logical qubits</h2>
<p>In a planar architecture each logical qubit is a distance-${m('d')} surface-code patch: ${m('d × d')} data qubits with two kinds of boundary. Logical Z is a string of Z’s running along one pair of opposite edges, logical X a string of X’s along the other pair. Transversal CNOTs between patches would need long-range couplers. <strong>Lattice surgery</strong>, introduced by Horsman, Fowler, Devitt and Van Meter in 2012, needs only the nearest-neighbour couplings the patches already have.</p>
<h2>Merge and split</h2>
<p>Place two patches side by side so that their logical Z strings run parallel to the gap between them. Then:</p>
<ol>
<li><strong>Prepare</strong> the column of data qubits in the gap in ${m('|+⟩')}.</li>
<li><strong>Merge</strong>: start measuring the stabilizers of one big patch that covers both and the gap. The new checks that straddle the seam give random individual results, but the product of the new Z checks equals ${m('Z̄<sub>A</sub> Z̄<sub>B</sub>')}, because each gap qubit appears in exactly two of them and cancels out. Repeating the measurement for about ${m('d')} rounds protects the result against measurement errors.</li>
<li><strong>Split</strong>: measure the gap qubits in the X basis. The big patch falls apart into the original two, and the X results fix a Pauli correction that software tracks (the Pauli frame).</li>
</ol>
<p>The net effect is a measurement of the joint parity ${m('Z̄<sub>A</sub> ⊗ Z̄<sub>B</sub>')}, with nothing learned about either qubit alone. Rotating the patches so that the X strings face each other, and preparing the gap in ${m('|0⟩')} instead, measures ${m('X̄<sub>A</sub> ⊗ X̄<sub>B</sub>')}. In general a merge measures the product of the logical operators that run along the seam.</p>
${LAB('merge')}
<h2>A CNOT from three measurements</h2>
<p>Joint parity measurements are enough to build a CNOT. Add an ancilla patch prepared in ${m('|+⟩')}, then:</p>
${EQ('M<sub>ZZ</sub>(C, A) → m₁,&nbsp;&nbsp; M<sub>XX</sub>(A, T) → m₂,&nbsp;&nbsp; M<sub>Z</sub>(A) → m₃')}
<p>Afterwards apply ${m('X')} to the target if ${m('m₁ ⊕ m₃ = 1')} and ${m('Z')} to the control if ${m('m₂ = 1')}, both just updates of the Pauli frame. The control and target end up exactly as if a CNOT had acted, and the ancilla is free to reuse. Each merge takes about ${m('d')} rounds, so a CNOT costs a few ${m('d')} code cycles of time and the area of three patches.</p>
${LAB('cnot')}
<h2>From gates to layouts</h2>
<p>Because everything reduces to measuring Pauli products, a fault-tolerant program can be compiled into a sequence of multi-patch Pauli measurements, with T gates supplied as magic states from factories ([[L:magic]]). Daniel Litinski’s “Game of Surface Codes” (2019) laid out such architectures as tile layouts trading space for time. The surface-code resource estimates of [[L:resources]], such as factoring RSA-2048, assume exactly this model, and its speed is set by the code cycle time and by how fast the decoder can return results that later measurements depend on.</p>
`,
  labs: {
    merge: {
      title: 'Merge, measure, split',
      cap: 'Two distance-3 patches (data qubits black; Z checks copper, X checks blue). Their logical Z strings (thick copper) face the seam. Merging measures the new checks across it: their individual results are random, but the product of the four new Z checks is the joint parity Z̄_A Z̄_B. The bars show the two logical qubits before and after.',
      build(body, id) {
        const PRE = { '|0⟩|0⟩': [0, 0], '|0⟩|1⟩': [0, 1], '|+⟩|+⟩': ['+', '+'], '|+⟩|0⟩': ['+', 0] };
        let inp = '|+⟩|+⟩', stp = 0, st = null, out = null, signs = null;
        const box = h('div', { class: 'circ-wrap', style: 'background:var(--surface);display:grid;place-items:center;padding:8px' }), before = h('div'), after = h('div'), bB = stateBars(before, 2, { height: 120 }), bA = stateBars(after, 2, { height: 120 }), stat = h('div', { class: 'status' });
        const init = () => { st = new QState(2); PRE[inp].forEach((v, q) => { if (v === 1) st.g('X', q); if (v === '+') st.g('H', q); }); bB.state(st.re, st.im); bA.state(st.re, st.im); out = null; signs = null; };
        const render = () => {
          const cfg = { d: 3, cols: 7, seamCols: [3], merged: stp === 2, signs: stp === 2 ? signs : null, S: 54, M: 34, zl: stp === 2 ? [] : [2, 4], labels: [[1, 'A'], [5, 'B']] };
          const r = patchSVG(cfg); box.innerHTML = ''; box.append(r.svg);
          const T_ = ['Two separate patches. Choose the logical inputs, then prepare the seam.', 'Seam qubits prepared in |+⟩ (dashed). Nothing has been measured yet.', `Merged. The four new Z checks gave ${signs ? signs.map(s => s > 0 ? '+1' : '−1').join(', ') : ''}; their product, ${out ? '−1' : '+1'}, is the measured value of Z̄_A Z̄_B.`, `Split. The seam was measured in X and the patches are separate again. The logical state stays as the merge left it: ${out ? 'odd' : 'even'} parity.`];
          stat.className = 'status' + (stp >= 2 ? ' good' : ''); stat.textContent = T_[stp];
        };
        const next = () => {
          if (stp === 0) stp = 1;
          else if (stp === 1) { out = parityMeasure(st, 0, 1, 'Z'); const s = [0, 1, 2].map(() => Math.random() < .5 ? 1 : -1); s.push((out ? -1 : 1) * s[0] * s[1] * s[2]); signs = shuffled(s); bA.state(st.re, st.im); stp = 2; }
          else if (stp === 2) stp = 3;
          render();
        };
        body.append(h('div', { class: 'btns' }, field('Logical inputs', seg(Object.keys(PRE).map(k => ({ v: k, label: k })), inp, v => { inp = v; stp = 0; init(); render(); }, 'Logical inputs')),
          btn('Next step', next, 'pri sm'), btn('Start again', () => { stp = 0; init(); render(); }, 'sm')),
          box, stat, h('div', { class: 'split even' }, field('Logical state before', before), field('Logical state after', after)));
        init(); render();
      }
    },
    cnot: {
      title: 'A CNOT from three measurements',
      cap: 'Control C, ancilla A and target T as three patches. Each step is a merge (highlighted) or a single-patch measurement, with random outcomes. After the Pauli-frame corrections, the control and target match an ideal CNOT applied to the input, whatever the outcomes were. Bars show the three logical qubits, in the order C, A, T.',
      build(body, id) {
        const INP = { '|+⟩|0⟩': [[PI / 2, 0], [0, 0]], '|1⟩|0⟩': [[PI, 0], [0, 0]], '|1⟩|1⟩': [[PI, 0], [PI, 0]], 'random': null };
        let inp = '|+⟩|0⟩', ang = null, stp = 0, st = null, ms = [];
        const cv = canvas('', 'height:250px'), bars = h('div'), sb = stateBars(bars, 3, { height: 130 }), stat = h('div', { class: 'status' }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const prep = () => { ang = INP[inp] || [[Math.acos(2 * Math.random() - 1), TAU * Math.random()], [Math.acos(2 * Math.random() - 1), TAU * Math.random()]]; st = new QState(3); st.apply(0, Ry(ang[0][0])); st.apply(0, Rz(ang[0][1])); st.g('H', 1); st.apply(2, Ry(ang[1][0])); st.apply(2, Rz(ang[1][1])); ms = []; };
        const ideal = () => { const s = new QState(2); s.apply(0, Ry(ang[0][0])); s.apply(0, Rz(ang[0][1])); s.apply(1, Ry(ang[1][0])); s.apply(1, Rz(ang[1][1])); s.cx(0, 1); return s; };
        const dia = painter(cv, ({ ctx, w, h: H }) => {
          const Th = Theme.get(), s = Math.min(64, H * .26), P = { C: [w * .28, H * .27], A: [w * .64, H * .27], T: [w * .64, H * .72] };
          const hl = stp === 1 ? ['C', 'A'] : stp === 2 ? ['A', 'T'] : [];
          if (hl.length) { const [a, b] = hl.map(k => P[k]); ctx.fillStyle = rgba(stp === 1 ? Th.copper : Th.cyan, .25); ctx.fillRect(Math.min(a[0], b[0]) - s / 2 - 6, Math.min(a[1], b[1]) - s / 2 - 6, Math.abs(a[0] - b[0]) + s + 12, Math.abs(a[1] - b[1]) + s + 12); txt(ctx, stp === 1 ? 'merge: Z̄Z̄' : 'merge: X̄X̄', (a[0] + b[0]) / 2 + (stp === 2 ? s * .9 : 0), (a[1] + b[1]) / 2 + (stp === 1 ? -s * .75 : 0), { font: '700 12px "JetBrains Mono",monospace', color: stp === 1 ? Th.copper : Th.cyan, align: stp === 2 ? 'left' : 'center' }); }
          for (const [k, p] of Object.entries(P)) {
            const done = k === 'A' && stp >= 3; ctx.fillStyle = done ? Th.surface2 : Th.surface; ctx.strokeStyle = Th.ink; ctx.lineWidth = 2; ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s); ctx.strokeRect(p[0] - s / 2, p[1] - s / 2, s, s);
            for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) dot(ctx, p[0] - s / 3 + j * s / 3, p[1] - s / 3 + i * s / 3, 2.5, Th.muted);
            txt(ctx, k === 'C' ? 'control' : k === 'A' ? 'ancilla' : 'target', p[0], p[1] + s / 2 + 12, { font: '600 11px "JetBrains Mono",monospace', color: Th.ink });
          }
          ms.forEach((m2, k) => txt(ctx, `m${k + 1} = ${m2}`, 10, 18 + k * 18, { align: 'left', font: '600 12px "JetBrains Mono",monospace', color: Th.ink }));
        });
        const render = () => {
          sb.state(st.re, st.im);
          const T_ = ['Ancilla prepared in |+⟩. Control and target hold the input.', `Measured Z̄_C Z̄_A: m₁ = ${ms[0]}.`, `Measured X̄_A X̄_T: m₂ = ${ms[1]}.`, `Measured the ancilla in Z: m₃ = ${ms[2]}.`, `Corrections applied: ${(ms[0] ^ ms[2]) ? 'X on the target' : 'no X'}, ${ms[1] ? 'Z on the control' : 'no Z'}.`];
          stat.className = 'status' + (stp === 4 ? ' good' : ''); stat.textContent = T_[stp];
          if (stp === 4) { const m3 = ms[2], am = st.mask(1), id2 = ideal(); let re = 0, im = 0, nn = 0; for (let i = 0; i < 8; i++) { if (((i & am) ? 1 : 0) !== m3) continue; const j = ((i >> 2) << 1) | (i & 1); re += id2.re[j] * st.re[i] + id2.im[j] * st.im[i]; im += id2.re[j] * st.im[i] - id2.im[j] * st.re[i]; nn += st.re[i] ** 2 + st.im[i] ** 2; } ro.innerHTML = `<span class="k">fidelity of C, T with CNOT|input⟩ </span>${num((re * re + im * im) / nn, 4)}`; }
          else ro.innerHTML = '<span class="k">fidelity check </span>after the corrections';
          dia.inv();
        };
        const next = () => {
          if (stp === 0) { ms[0] = parityMeasure(st, 0, 1, 'Z'); stp = 1; }
          else if (stp === 1) { ms[1] = parityMeasure(st, 1, 2, 'X'); stp = 2; }
          else if (stp === 2) { ms[2] = st.measure(1); stp = 3; }
          else if (stp === 3) { if (ms[0] ^ ms[2]) st.g('X', 2); if (ms[1]) st.g('Z', 0); stp = 4; }
          render();
        };
        body.append(h('div', { class: 'btns' }, field('Input (control, target)', seg(Object.keys(INP).map(k => ({ v: k, label: k })), inp, v => { inp = v; stp = 0; prep(); render(); }, 'Input')),
          btn('Next step', next, 'pri sm'), btn('Run again', () => { stp = 0; prep(); render(); }, 'sm')),
          h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, bars, stat, ro)));
        prep(); render();
      }
    }
  },
  take: ['Each logical qubit is a surface-code patch; lattice surgery performs logical operations with only nearest-neighbour couplings.',
    'Merging two patches measures the product of the logical operators running along the seam (Z̄Z̄ or X̄X̄); splitting separates them again.',
    'A CNOT follows from M_ZZ(C, A), M_XX(A, T) and M_Z(A) on an ancilla in |+⟩, with Pauli-frame corrections X_T^(m₁⊕m₃) and Z_C^(m₂).',
    'Fault-tolerant programs compile to sequences of multi-patch Pauli measurements plus magic states, laid out like tiles.'],
  quiz: QZ([
    ['What does merging two patches along a seam measure?', ['Each logical qubit separately', 'The product of the logical operators that run along the seam, such as Z̄_A Z̄_B', 'Nothing', 'The physical qubits in the seam only'], 1, 'In the merged code the two parallel logical strings become equivalent, so their product becomes a stabilizer and is measured, revealing only the joint parity.'],
    ['For a Z̄Z̄ merge, in what state are the seam qubits prepared?', ['|0⟩', '|+⟩', '|1⟩', 'A random state'], 1, 'With the seam in |+⟩, each new Z check is individually random, and only the product, which cancels the seam qubits, carries the logical parity.'],
    ['Why do the individual new checks give random results?', ['They are faulty', 'Each includes seam qubits prepared in an X eigenstate, so only their product has a definite value', 'Measurement is always random', 'Because of the decoder'], 1, 'Each seam qubit appears in two new Z checks. Individually the checks are random; their product is Z̄_A Z̄_B times squares of seam Z’s, which is deterministic for a parity eigenstate.'],
    ['Why is the merged stabilizer measurement repeated for about d rounds?', ['To heat the qubits', 'To protect the joint-parity result against measurement errors', 'To make the patches bigger', 'It is not repeated'], 1, 'A single faulty check could flip the inferred parity. Repeating d rounds lets the decoder correct measurement errors in time as well as space.'],
    ['How is a split performed after a Z̄Z̄ merge?', ['By measuring the seam qubits in the X basis', 'By applying a CNOT', 'By waiting', 'By resetting all qubits'], 0, 'Measuring the seam in the basis it was prepared in removes it and separates the patches; the outcomes define a Pauli correction tracked in software.'],
    ['Starting from |+⟩|+⟩, what does a Z̄Z̄ measurement produce?', ['|0⟩|0⟩', 'A Bell state, (|00⟩ + |11⟩)/√2 or (|01⟩ + |10⟩)/√2', '|+⟩|+⟩ unchanged', 'A product state'], 1, '|+⟩|+⟩ is an equal superposition of even- and odd-parity strings. Measuring the parity keeps one half, which is maximally entangled.'],
    ['Which sequence implements a CNOT via lattice surgery?', ['M_XX(C, T) only', 'M_ZZ(C, A), then M_XX(A, T), then M_Z(A), with the ancilla starting in |+⟩', 'Three transversal CNOTs', 'A T gate and a Hadamard'], 1, 'The ZZ measurement copies the control’s Z value onto the ancilla, the XX measurement transfers it to the target, and measuring the ancilla in Z disentangles it.'],
    ['After the three measurements, what corrections are needed?', ['None', 'X on the target if m₁ ⊕ m₃ = 1, and Z on the control if m₂ = 1', 'A Hadamard on every qubit', 'A new round of merges'], 1, 'The outcomes determine Pauli corrections that are applied in the Pauli frame, without physical gates.'],
    ['Why is lattice surgery attractive for planar hardware?', ['It needs no stabilizer measurements', 'It needs only nearest-neighbour interactions, unlike transversal gates between distant patches', 'It is faster than any other method in all cases', 'It removes the need for magic states'], 1, 'Patches only interact through their shared boundary, using the same local couplings as ordinary stabilizer measurements.'],
    ['What supplies the non-Clifford gates in a lattice-surgery architecture?', ['Merges alone', 'Magic states produced in distillation or cultivation factories and consumed by Pauli measurements', 'Transversal T gates', 'Readout errors'], 1, 'Pauli measurements and Cliffords are not universal. T gates are implemented by consuming magic states, which take up much of the chip in resource estimates.']
  ])
});

/* ---------------- Bosonic codes ---------------- */
const lag = (n, x) => { let a = 1, b = 1 - x; if (n === 0) return 1; for (let k = 1; k < n; k++) { const c3 = ((2 * k + 1 - x) * b - k * a) / (k + 1); a = b; b = c3; } return b; };
const WSTATES = {
  coherent: { label: 'Coherent state', peaks: a => ({ q: [Math.SQRT2 * a], c: [1], D: 1 }) },
  even: { label: 'Even cat', peaks: a => ({ q: [Math.SQRT2 * a, -Math.SQRT2 * a], c: [1, 1], D: 1 }) },
  odd: { label: 'Odd cat', peaks: a => ({ q: [Math.SQRT2 * a, -Math.SQRT2 * a], c: [1, -1], D: 1 }) },
  fock: { label: 'Fock state' },
  gkp0: { label: 'GKP |0⟩', gkp: 0 }, gkp1: { label: 'GKP |1⟩', gkp: 1 }, gkpp: { label: 'GKP |+⟩', gkp: 2 }
};
const gkpPeaks = (kind, D) => { const q = [], c3 = [], sp = Math.sqrt(PI); for (let s = -12; s <= 12; s++) { const x = kind === 2 ? s * sp : (2 * s + kind) * sp; if (Math.abs(x) > 4 / D + 2) continue; q.push(x); c3.push(Math.exp(-D * D * x * x / 2)); } return { q, c: c3, D }; };
const wigner = (P, x, p) => { let s = 0; for (let i = 0; i < P.q.length; i++) for (let j = 0; j < P.q.length; j++) { const qb = (P.q[i] + P.q[j]) / 2; s += P.c[i] * P.c[j] * Math.exp(-((x - qb) ** 2) / (P.D * P.D)) * Math.cos(p * (P.q[i] - P.q[j])); } return s * Math.exp(-p * p * P.D * P.D) / PI / P.nrm; };
const withNorm = P => { let z = 0; for (let i = 0; i < P.q.length; i++) for (let j = 0; j < P.q.length; j++) z += P.c[i] * P.c[j] * Math.exp(-((P.q[i] - P.q[j]) ** 2) / (4 * P.D * P.D)); P.nrm = z; return P; };
LESSONS.push({
  id: 'bosonic', n: 27.5, stage: G, minutes: 17, title: 'Bosonic codes: cats and grids',
  lede: 'Instead of many two-level qubits, a single microwave cavity has an infinite ladder of levels. Clever states in that ladder, pictured as shapes in phase space, can protect a qubit with far fewer parts.',
  html: `
<h2>Room in an oscillator</h2>
<p>A superconducting microwave cavity is a harmonic oscillator: its states are photon numbers ${m('|0⟩, |1⟩, |2⟩, …')} or superpositions of them. Cavities can store photons for milliseconds, much longer than transmons, and their main error is simple: <strong>photon loss</strong>. <strong>Bosonic codes</strong> encode a logical qubit in carefully chosen oscillator states so that likely errors move them in recognizable ways. One oscillator, plus a transmon for control, does the job of several physical qubits.</p>
<h2>Pictures in phase space</h2>
<p>An oscillator state is conveniently drawn as its <strong>Wigner function</strong> ${m('W(q, p)')} over position ${m('q')} and momentum ${m('p')}. It behaves like a probability distribution: integrating over ${m('p')} gives the probability of ${m('q')}. But it can go negative, and negative regions are a signature of genuinely quantum states. A <strong>coherent state</strong> ${m('|α⟩')}, the closest thing to a classical oscillation, is a round Gaussian blob displaced from the origin.</p>
<h2>Cat codes</h2>
<p>The two-component <strong>cat code</strong> uses ${m('|α⟩')} and ${m('|−α⟩')}, two blobs on opposite sides of phase space, as logical ${m('|0⟩')} and ${m('|1⟩')}. Their superpositions, the cat states ${m('|α⟩ ± |−α⟩')}, show interference fringes between the blobs. The protection is lopsided:</p>
<ul>
<li>A <strong>bit flip</strong> would have to move the state from one blob to the other. With the blobs held in place by engineered two-photon driving and dissipation, the bit-flip rate falls exponentially with the mean photon number ${m('|α|²')}.</li>
<li>A <strong>phase flip</strong> happens whenever a photon is lost, because losing a photon swaps the even and odd cats. Its rate grows in proportion to ${m('|α|²')}.</li>
</ul>
<p>The result is a qubit with strongly <strong>biased noise</strong>. Experiments with stabilized cats have pushed bit-flip times to seconds and beyond, many orders of magnitude longer than their phase-flip times. A simple repetition code against phase flips then finishes the job, which needs far fewer qubits than a surface code. AWS’s Ocelot chip (2025) used five cat qubits in such a repetition code.</p>
${LAB('wigner')}
<h2>Correcting photon loss directly</h2>
<p>Four-component cats and <strong>binomial codes</strong> use codewords whose photon numbers are all even. Losing one photon makes the number odd, so measuring photon-number <strong>parity</strong> with a transmon detects the loss without revealing the logical state, and a corrective pulse undoes it. Codes of this kind were among the first to reach or exceed the break-even point, where the encoded qubit outlives the best unencoded component.</p>
<h2>GKP: a grid in phase space</h2>
<p>Gottesman, Kitaev and Preskill proposed in 2001 to encode a qubit in grid states: ${m('|0̄⟩')} is a comb of sharp peaks in ${m('q')} at even multiples of ${m('√π')}, ${m('|1̄⟩')} at odd multiples. Small shifts in ${m('q')} or ${m('p')}, the generic effect of many noise processes including loss, are detected by measuring each coordinate modulo ${m('√π')} and pushed back. Ideal grids need infinite energy; real ones are finite combs of squeezed peaks under a Gaussian envelope, characterized by their squeezing in decibels. Yale experiments created GKP states in microwave cavities in 2020 and, with reinforcement-learning-tuned feedback, beat break-even in 2023; optical GKP states are being developed for photonic machines.</p>
${LAB('bias')}
${NOTE('Why concatenate', `<p>A bosonic code alone protects against small or biased errors, not everything. Practical designs concatenate: cat qubits inside a repetition or thin surface code that exploits their bias, or GKP qubits as the physical layer of a surface code, whose decoder can use the continuous measurement results as soft information. The aim is the same as everywhere in this track: reach a target logical error rate with as little hardware as possible.</p>`)}
`,
  labs: {
    wigner: {
      title: 'Wigner functions of code states',
      cap: 'Exact Wigner functions: blue where positive, copper where negative, on a scale fixed at the largest value any state can reach (1/π). The strip below is the position distribution, the Wigner function integrated over momentum. Lose a photon flips an even cat into an odd one: the fringes shift, which is a phase flip of the cat qubit.',
      build(body, id) {
        let kind = 'even', al = 2, n = 3, sq = 10, img = null, Pk = null;
        const cv = canvas('sq', 'max-width:420px;margin:0 auto'), mc = canvas('', 'height:90px;max-width:420px;margin:0 auto'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), ctl = h('div', { class: 'stack' });
        const R = 6, NG = 170;
        const Wf = (x, p) => kind === 'fock' ? ((n % 2 ? -1 : 1) / PI) * Math.exp(-(x * x + p * p)) * lag(n, 2 * (x * x + p * p)) : wigner(Pk, x, p);
        const prep = () => { Pk = kind === 'fock' ? null : WSTATES[kind].gkp != null ? withNorm(gkpPeaks(WSTATES[kind].gkp, Math.pow(10, -sq / 20))) : withNorm(WSTATES[kind].peaks(al)); img = null; };
        let grid = null;
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-R, R], y: [-R, R], xt: [-6, -3, 0, 3, 6], yt: [-6, -3, 0, 3, 6], xl: 'q', yl: 'p', pad: { l: 30, b: 28, t: 8, r: 8 } });
          if (!img) {
            grid = new Float64Array(NG * NG); const xs = [...Array(NG)].map((_, i) => -R + 2 * R * (i + .5) / NG), ps = [...Array(NG)].map((_, j) => R - 2 * R * (j + .5) / NG);
            if (kind === 'fock') { for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) grid[j * NG + i] = Wf(xs[i], ps[j]); }
            else {
              const D = Pk.D, cmax = Math.max(...Pk.c.map(Math.abs));
              for (let a = 0; a < Pk.q.length; a++) for (let b = 0; b < Pk.q.length; b++) {
                const wgt = Pk.c[a] * Pk.c[b], qb = (Pk.q[a] + Pk.q[b]) / 2; if (Math.abs(wgt) < 1e-7 * cmax * cmax || Math.abs(qb) > R + 5 * D) continue;
                const gx = xs.map(x => Math.exp(-((x - qb) ** 2) / (D * D))), cp = ps.map(pp => Math.cos(pp * (Pk.q[a] - Pk.q[b])));
                for (let j = 0; j < NG; j++) { const f = wgt * cp[j], row = j * NG; for (let i = 0; i < NG; i++) grid[row + i] += f * gx[i]; }
              }
              for (let j = 0; j < NG; j++) { const env = Math.exp(-ps[j] * ps[j] * D * D) / PI / Pk.nrm; for (let i = 0; i < NG; i++) grid[j * NG + i] *= env; }
            }
            img = heatImage(NG, NG, (i, j) => divRGB(grid[j * NG + i] * PI));
          }
          drawHeat(ctx, img, A.L + 1, A.T, A.R - A.L - 1, A.B - A.T, true);
          ctx.strokeStyle = rgba(T.ink, .25); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A.X(0), A.T); ctx.lineTo(A.X(0), A.B); ctx.moveTo(A.L, A.Y(0)); ctx.lineTo(A.R, A.Y(0)); ctx.stroke();
          marg.inv();
        });
        const marg = painter(mc, ({ ctx, w, h: H }) => {
          if (!grid) return; const T = Theme.get(), L0 = 30, R0 = w - 8, P2 = new Float64Array(NG); let mx = 0; for (let i = 0; i < NG; i++) { let s = 0; for (let j = 0; j < NG; j++) s += grid[j * NG + i]; P2[i] = Math.max(0, s * 2 * R / NG); mx = Math.max(mx, P2[i]); }
          ctx.fillStyle = rgba(T.cyan, .35); ctx.strokeStyle = T.cyan; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(L0, H - 14);
          for (let i = 0; i < NG; i++) ctx.lineTo(L0 + (R0 - L0) * (i + .5) / NG, H - 14 - (H - 24) * P2[i] / (mx || 1)); ctx.lineTo(R0, H - 14); ctx.closePath(); ctx.fill(); ctx.stroke();
          txt(ctx, 'P(q)', L0 + 4, 8, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace' });
        });
        const upd = () => {
          prep(); p.inv(); let s = '';
          if (kind === 'coherent') s = `mean photon number ${num(al * al, 2)}`;
          else if (kind === 'even' || kind === 'odd') { const x = al * al; s = `mean photon number ${num(kind === 'even' ? x * Math.tanh(x) : x / Math.tanh(x), 2)} · photon number is always ${kind === 'even' ? 'even' : 'odd'}`; }
          else if (kind === 'fock') s = `exactly ${n} photon${n === 1 ? '' : 's'} · W(0, 0) = ${n % 2 ? '−' : '+'}1/π`;
          else { const D = Math.pow(10, -sq / 20); s = `squeezing ${num(sq, 1)} dB (peak width ${num(D, 2)}) · mean photon number about ${num(Math.max(0, 1 / (2 * D * D) - .5), 1)}`; }
          let neg = 0; if (grid) for (const v of grid) if (v < 0) neg -= v; ro.innerHTML = s + `<br><span class="k">negative volume </span>${num(neg * (2 * R / NG) ** 2, 3)}`;
        };
        const mk = () => {
          ctl.innerHTML = '';
          if (kind === 'coherent' || kind === 'even' || kind === 'odd') ctl.append(slider({ id: id('a'), label: 'Amplitude α', min: 0, max: 3, step: .05, value: al, fmt: v => num(v, 2), on: v => { al = v; upd(); } }));
          if (kind === 'fock') ctl.append(slider({ id: id('n'), label: 'Photon number n', min: 0, max: 8, step: 1, value: n, fmt: String, on: v => { n = v; upd(); } }));
          if (WSTATES[kind].gkp != null) ctl.append(slider({ id: id('s'), label: 'Squeezing', min: 4, max: 14, step: .5, value: sq, fmt: v => num(v, 1) + ' dB', on: v => { sq = v; upd(); } }));
          if (kind === 'even' || kind === 'odd') ctl.append(h('div', { class: 'btns' }, btn('Lose a photon', () => { kind = kind === 'even' ? 'odd' : 'even'; ks.set(kind); mk(); upd(); }, 'pri sm')));
        };
        const ks = seg(Object.entries(WSTATES).map(([k, v]) => ({ v: k, label: v.label })), kind, v => { kind = v; mk(); upd(); }, 'State');
        body.append(ks, h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, mc), h('div', { class: 'stack' }, ctl, ro, legendRow([['positive', 'var(--cyan)'], ['negative', 'var(--copper)']]))));
        mk(); upd(); Scope.later(60, upd);
      }
    },
    bias: {
      title: 'Biased noise in a cat qubit',
      cap: 'Illustrative error rates for a stabilized cat qubit, relative to the single-photon loss rate κ (logarithmic scale). Phase flips grow in proportion to the mean photon number; bit flips fall exponentially. The bias, their ratio, grows enormously, which is why only phase flips need a code. The prefactors here are representative, not those of a particular device.',
      build(body, id) {
        let nb = 4;
        const cv = canvas('', 'height:250px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const gp = x => x, gb = x => .5 * Math.exp(-2 * x);
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 10], y: [1e-9, 100], ylog: true, xt: [0, 2, 4, 6, 8, 10], yt: [1e-9, 1e-6, 1e-3, 1, 100], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'mean photon number |α|²', yl: 'rate / κ' });
          const ln = (f, col) => { const pts = []; for (let x = .05; x <= 10; x += .05) pts.push([A.X(x), A.Y(clamp(f(x), 1e-9, 100))]); polyline(ctx, pts, col, 2.4); };
          ln(gp, T.copper); ln(gb, T.cyan); polyline(ctx, [[A.X(nb), A.T], [A.X(nb), A.B]], T.ink, 1, [3, 3]);
          dot(ctx, A.X(nb), A.Y(gp(nb)), 5, T.copper, T.surface); dot(ctx, A.X(nb), A.Y(clamp(gb(nb), 1e-9, 100)), 5, T.cyan, T.surface);
        });
        const upd = () => { ro.innerHTML = `<span class="k">phase flips </span>${num(gp(nb), 2)} κ &nbsp; <span class="k">bit flips </span>${sci(gb(nb))} κ<br><span class="k">bias (phase / bit) </span>${sci(gp(nb) / gb(nb))}`; p.inv(); };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['phase flips ∝ |α|²', 'var(--copper)'], ['bit flips ∝ e^(−2|α|²)', 'var(--cyan)']])),
          h('div', { class: 'stack' }, slider({ id: id('n'), label: 'Mean photon number', min: 0, max: 10, step: .1, value: nb, fmt: v => num(v, 1), on: v => { nb = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['Bosonic codes store a qubit in an oscillator’s many levels; the dominant error, photon loss, is simple and structured.',
    'Wigner functions picture oscillator states in phase space; negative regions mark non-classical states such as cats, Fock states and GKP grids.',
    'Cat qubits suppress bit flips exponentially in |α|² while phase flips grow linearly, giving biased noise that a repetition code can finish off.',
    'Parity-based codes detect photon loss directly; GKP codes correct small shifts in q and p; practical designs concatenate them with outer codes.'],
  quiz: QZ([
    ['What is the dominant error in a superconducting microwave cavity?', ['Bit flips from cosmic rays', 'Photon loss', 'Leakage to |2⟩', 'Crosstalk'], 1, 'Cavity photons leak out at a rate κ. Bosonic codes are designed around this simple, well-characterized error.'],
    ['What does a negative region in a Wigner function indicate?', ['A measurement error', 'A genuinely non-classical state', 'Negative energy', 'A coherent state'], 1, 'Classical-like states such as coherent and thermal states have non-negative Wigner functions. Negativity is a witness of quantum interference.'],
    ['How do a cat qubit’s logical |0⟩ and |1⟩ look in phase space?', ['Concentric rings', 'Two blobs, |α⟩ and |−α⟩, on opposite sides of the origin', 'A single blob at the origin', 'A grid of peaks'], 1, 'The two coherent states are far apart for large |α|, so noise rarely turns one into the other.'],
    ['How does the bit-flip rate of a stabilized cat qubit scale with mean photon number |α|²?', ['Linearly', 'It falls exponentially', 'It is constant', 'Quadratically'], 1, 'A bit flip requires moving across the whole phase-space distance between the blobs, which is exponentially suppressed in |α|².'],
    ['What effect does losing one photon have on a cat qubit?', ['A bit flip', 'It swaps even and odd cats, a phase flip', 'Nothing', 'It destroys the qubit'], 1, 'The annihilation operator maps |α⟩ + |−α⟩ to a multiple of |α⟩ − |−α⟩, flipping the relative sign: a phase flip, at a rate proportional to |α|².'],
    ['Why is biased noise useful?', ['It is easier to measure', 'A code only needs to correct the dominant error type, for example a repetition code against phase flips, saving qubits', 'It removes the need for decoders', 'It increases T₁'], 1, 'With bit flips negligible, a one-dimensional repetition code suffices instead of a two-dimensional surface code.'],
    ['How do binomial and four-component cat codes detect photon loss?', ['By counting photons exactly', 'By measuring photon-number parity, which changes when a photon is lost without revealing the logical state', 'By measuring the transmon’s T₁', 'By homodyne detection of q'], 1, 'Their codewords contain only even photon numbers; a single loss makes the parity odd, a syndrome that a transmon can measure.'],
    ['What do GKP code states look like?', ['Two blobs', 'A grid of sharp peaks in phase space, spaced by multiples of √π', 'A ring', 'A single Fock state'], 1, 'Logical |0⟩ has peaks in q at even multiples of √π and |1⟩ at odd multiples; small shifts are detected by measuring q and p modulo √π.'],
    ['Why must real GKP states be approximate?', ['Ideal grids require infinite energy, so real states use finitely many squeezed peaks under an envelope', 'Because of the uncertainty principle they cannot exist at all', 'They decay instantly', 'They cannot be measured'], 0, 'Perfect delta-function combs are unnormalizable. Finite squeezing, quoted in decibels, sets the peak width and the code’s quality.'],
    ['What does the Wigner function of the Fock state |1⟩ look like at the origin?', ['Positive maximum', 'Negative: W(0, 0) = −1/π', 'Zero', 'Undefined'], 1, 'Odd Fock states have W(0, 0) = −1/π, the most negative value possible, a clear sign of non-classicality.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Toric code', 'Kitaev’s stabilizer code with qubits on the edges of a torus, encoding two logical qubits in its topology.', 'toric'],
  ['Anyon', 'A quasi-particle in two dimensions whose exchange or braiding produces phases beyond those of bosons and fermions; toric-code e and m particles are anyons.', 'toric'],
  ['Topological order', 'A phase of matter in which information is stored in global properties that no local operation can access or change.', 'toric'],
  ['Union–find decoder', 'A decoder that grows clusters around defects, merges them with a union–find structure and peels spanning trees; almost linear time.', 'unionfind'],
  ['Decoding backlog', 'A growing queue of unprocessed syndrome data that slows a fault-tolerant computation when the decoder is too slow.', 'unionfind'],
  ['Merge and split', 'The lattice-surgery operations that join two code patches to measure a joint logical operator and then separate them.', 'surgery'],
  ['Bosonic code', 'A code that stores a qubit in the many levels of a harmonic oscillator, such as a microwave cavity mode.', 'bosonic'],
  ['Wigner function', 'A quasi-probability distribution over phase space that fully describes an oscillator state and can take negative values.', 'bosonic'],
  ['GKP code', 'Gottesman–Kitaev–Preskill code: grid states in phase space that correct small displacements in position and momentum.', 'bosonic'],
  ['Biased noise', 'Noise in which one error type, such as phase flips, is far more likely than another; codes can exploit it to save qubits.', 'bosonic']
);
})();
