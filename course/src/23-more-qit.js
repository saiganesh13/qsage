/* =====================================================================
   Research track · information theory and cryptography additions:
   classical shadows, entanglement purification, lattices
   ===================================================================== */
(() => {
const QIT = 10;

/* ---------------- Classical shadows ---------------- */
const SH_STATES = {
  ghz: { label: 'GHZ', make: n => { const s = new QState(n); s.g('H', 0); for (let q = 1; q < n; q++) s.cx(0, q); return s; } },
  cluster: { label: 'Cluster', make: n => { const s = new QState(n); for (let q = 0; q < n; q++) s.g('H', q); for (let q = 0; q < n - 1; q++) s.cz(q, q + 1); return s; } },
  w: { label: 'W', make: n => { const s = new QState(n); s.re[0] = 0; for (let q = 0; q < n; q++) s.re[1 << q] = 1 / Math.sqrt(n); return s; } },
  random: { label: 'Random circuit', make: n => { const s = new QState(n), r = rng(42); for (let l = 0; l < 4; l++) { for (let q = 0; q < n; q++) { s.apply(q, Ry(TAU * r())); s.apply(q, Rz(TAU * r())); } for (let q = l % 2; q + 1 < n; q += 2) s.cz(q, q + 1); } return s; } }
};
const pauliExp = (st, P) => { const t = st.clone(); P.forEach((p, q) => { if (p !== 'I') t.g(p, q); }); let r = 0; for (let i = 0; i < st.N; i++) r += st.re[i] * t.re[i] + st.im[i] * t.im[i]; return r; };
LESSONS.push({
  id: 'shadows', n: 38.3, stage: QIT, minutes: 15, title: 'Classical shadows: learning a state from random snapshots',
  lede: 'Reconstructing a whole quantum state takes exponentially many measurements. But if you only want many simple properties, random single-qubit measurements and a little arithmetic predict them all at once.',
  html: `
<h2>Tomography is expensive</h2>
<p>A state of ${m('n')} qubits has about ${m('4ⁿ')} real parameters. Full <strong>state tomography</strong>, which estimates all of them, needs a number of measurements that grows at least that fast: thousands for a handful of qubits, impossible for fifty. Yet most questions about a state are narrow: the energy of a local Hamiltonian, the correlations between nearby qubits, the fidelity with a target. Do we need the whole state to answer them?</p>
<h2>Shadows from random measurements</h2>
<p>Hsin-Yuan Huang, Richard Kueng and John Preskill showed in 2020 that we do not. Repeat this many times:</p>
<ol>
<li>For each qubit independently, pick X, Y or Z at random and measure it in that basis, getting ±1.</li>
<li>Record the bases and outcomes: one <strong>snapshot</strong>, ${m('n')} letters and ${m('n')} signs.</li>
</ol>
<p>Each snapshot defines a crude, unbiased estimate of the density matrix, ${m('ρ̂ = ⊗<sub>q</sub> (3 U<sub>q</sub><sup>†</sup>|b<sub>q</sub>⟩⟨b<sub>q</sub>|U<sub>q</sub> − I)')}, whose average over snapshots is exactly ${m('ρ')}. The collection is a <strong>classical shadow</strong>. For a Pauli observable such as ${m('X₂Z₅')}, the rule is simple: a snapshot contributes ${m('3<sup>k</sup>')} times the product of the recorded signs if it happened to measure every qubit of the observable in the right basis, and 0 otherwise.</p>
${EQ('snapshots needed ≈ 3<sup>k</sup> · log(M) / ε²')}
<p>for ${m('M')} observables, each acting on at most ${m('k')} qubits, to precision ${m('ε')}. The count does not depend on ${m('n')} at all, and only logarithmically on how many properties you want. Averaging with the <strong>median of means</strong> guards against rare large outliers.</p>
${LAB('shadow')}
<h2>What shadows are used for</h2>
<ul>
<li><strong>Energies and correlations</strong> of local Hamiltonians in variational algorithms, from one data set instead of one measurement setting per term group.</li>
<li><strong>Entanglement</strong>: the second Rényi entropy of a subsystem can be estimated from shadows by comparing pairs of snapshots, as in [[L:lightcone]].</li>
<li><strong>Fidelity and verification</strong> of prepared states, using random Clifford rather than Pauli measurements for global properties.</li>
<li><strong>Learning theory</strong>: shadows underpin proofs that some properties of quantum systems can be learned efficiently, and that machines with quantum memory can learn exponentially faster than those without.</li>
</ul>
${LAB('scaling')}
`,
  labs: {
    shadow: {
      title: 'Predicting 63 properties from the same snapshots',
      cap: 'Each snapshot measures all six qubits in random Pauli bases. From the accumulated shadow we estimate every single-qubit Pauli and every XX, YY and ZZ correlation (63 observables) and plot the estimates against the exact values; points on the diagonal are perfect. Add snapshots and watch the cloud tighten. The lower chart tracks the typical error, which falls like 1/√T.',
      build(body, id) {
        const n = 6; let sk = 'ghz', st = null, snaps = [], obs = [], hist = [];
        const cv = canvas('sq', 'max-width:330px;margin:0 auto'), ec = canvas('', 'height:170px'), snapEl = h('div', { class: 'readout', style: 'white-space:normal' }), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const init = () => {
          st = SH_STATES[sk].make(n); snaps = []; hist = []; obs = [];
          for (let q = 0; q < n; q++) for (const p of 'XYZ') { const P = new Array(n).fill('I'); P[q] = p; obs.push({ P, k: 1, ex: pauliExp(st, P) }); }
          for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (const p of 'XYZ') { const P = new Array(n).fill('I'); P[a] = p; P[b] = p; obs.push({ P, k: 2, ex: pauliExp(st, P) }); }
          obs.forEach(o => { o.sum = 0; }); upd();
        };
        const snap = () => {
          const t = st.clone(), bases = [...Array(n)].map(() => 'XYZ'[Math.floor(Math.random() * 3)]);
          bases.forEach((b, q) => { if (b === 'X') t.g('H', q); if (b === 'Y') { t.g('Sdg', q); t.g('H', q); } });
          const out = [...Array(n)].map((_, q) => t.measure(q) ? -1 : 1);
          snaps.push({ bases, out });
          for (const o of obs) { let v = 1; for (let q = 0; q < n; q++) { if (o.P[q] === 'I') continue; if (bases[q] !== o.P[q]) { v = 0; break; } v *= 3 * out[q]; } o.sum += v; }
        };
        const est = o => snaps.length ? o.sum / snaps.length : 0;
        const rms = () => Math.sqrt(obs.reduce((s, o) => s + (est(o) - o.ex) ** 2, 0) / obs.length);
        const add = k => { for (let i = 0; i < k; i++) snap(); hist.push([snaps.length, rms()]); upd(); };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-1.1, 1.1], y: [-1.6, 1.6], xt: [-1, 0, 1], yt: [-1.5, -1, 0, 1, 1.5], yf: v => num(v, 1), xl: 'exact value', yl: 'shadow estimate', pad: { l: 40 } });
          polyline(ctx, [[A.X(-1.1), A.Y(-1.1)], [A.X(1.1), A.Y(1.1)]], T.muted, 1.2, [4, 4]);
          if (snaps.length) obs.forEach(o => dot(ctx, A.X(o.ex) + (Math.random() - .5) * 3, A.Y(clamp(est(o), -1.6, 1.6)), 3.5, o.k === 1 ? T.cyan : T.copper));
        });
        const ep = painter(ec, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 1e5], y: [.003, 3], xlog: true, ylog: true, xt: [1, 10, 100, 1e3, 1e4, 1e5], yt: [.01, .1, 1], yf: v => String(v), xl: 'snapshots T', yl: 'RMS error' });
          const ref = []; for (let e = 0; e <= 5; e += .1) { const t = 10 ** e; ref.push([A.X(t), A.Y(clamp(Math.sqrt(5 / t), .003, 3))]); } polyline(ctx, ref, T.muted, 1.2, [4, 4]);
          polyline(ctx, hist.map(([t, e]) => [A.X(t), A.Y(clamp(e, .003, 3))]), T.copper, 2.2); hist.forEach(([t, e]) => dot(ctx, A.X(t), A.Y(clamp(e, .003, 3)), 3, T.copper));
        });
        const upd = () => {
          const last = snaps[snaps.length - 1];
          snapEl.innerHTML = last ? `<span class="k">last snapshot </span>${last.bases.map((b, q) => b + (last.out[q] > 0 ? '+' : '−')).join(' ')}` : '<span class="k">no snapshots yet</span>';
          if (snaps.length) { let mx = 0; obs.forEach(o => { mx = Math.max(mx, Math.abs(est(o) - o.ex)); }); ro.innerHTML = `<span class="k">snapshots </span>${snaps.length.toLocaleString()}<br><span class="k">RMS error </span>${num(rms(), 3)} &nbsp; <span class="k">worst </span>${num(mx, 3)}<br><span class="k">full tomography of 6 qubits </span>3⁶ = 729 measurement settings`; } else ro.innerHTML = 'Take some snapshots.';
          p.inv(); ep.inv();
        };
        body.append(h('div', { class: 'btns' }, seg(Object.entries(SH_STATES).map(([k, v]) => ({ v: k, label: v.label })), sk, v => { sk = v; init(); }, 'State'),
          btn('+10 snapshots', () => add(10), 'sm'), btn('+100', () => add(100), 'pri sm'), btn('+1,000', () => add(1000), 'sm'), btn('+10,000', () => add(10000), 'sm'), btn('Reset', init, 'sm')),
          h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['single-qubit Paulis', 'var(--cyan)'], ['two-qubit correlations', 'var(--copper)']])), h('div', { class: 'stack' }, ec, snapEl, ro)));
        init(); add(10); add(20); add(70);
      }
    },
    scaling: {
      title: 'Shadows versus tomography',
      cap: 'Measurements needed to estimate all k-local Pauli observables of n qubits to precision 0.05, on a logarithmic scale: a classical-shadow estimate of order 3ᵏ·log(M)/ε², with constants of the size appearing in Huang, Kueng and Preskill’s bounds, against a lower bound of 4ⁿ/ε² for full tomography. The shadow curve grows only logarithmically in n, through the number of observables M.',
      build(body, id) {
        let k = 2, nsel = 20;
        const cv = canvas('', 'height:240px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), eps = .05;
        const binomC = (n, r) => { let c3 = 1; for (let i = 0; i < r; i++) c3 = c3 * (n - i) / (i + 1); return c3; };
        const shadowN = n => { const M = binomC(n, k) * 3 ** k; return 34 * 3 ** k * Math.log(2 * M / .01) / (eps * eps); }, tomoN = n => 4 ** n / (eps * eps);
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [2, 60], y: [1e2, 1e40], ylog: true, xt: [2, 10, 20, 30, 40, 50, 60], yt: [1e4, 1e10, 1e16, 1e22, 1e28, 1e34, 1e40], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'qubits n', yl: 'measurements' });
          const L = (f, col) => { const pts = []; for (let n = Math.max(2, k); n <= 60; n++) { const v = f(n); if (v > 1e40) break; pts.push([A.X(n), A.Y(v)]); } polyline(ctx, pts, col, 2.4); };
          L(tomoN, T.copper); L(shadowN, T.cyan); polyline(ctx, [[A.X(nsel), A.T], [A.X(nsel), A.B]], T.ink, 1, [3, 3]);
        });
        const upd = () => { ro.innerHTML = `<span class="k">n = ${nsel}, k = ${k} </span>observables M = ${Math.round(binomC(nsel, k) * 3 ** k).toLocaleString()}<br><span class="k">shadows </span>${sci(shadowN(nsel))} &nbsp; <span class="k">tomography ≥ </span>${sci(tomoN(nsel))}`; p.inv(); };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['full tomography ≥ 4ⁿ/ε²', 'var(--copper)'], ['classical shadows', 'var(--cyan)']])),
          h('div', { class: 'stack' }, field('Locality k', seg([1, 2, 3, 4].map(v => ({ v, label: String(v) })), k, v => { k = v; upd(); }, 'Locality')), slider({ id: id('n'), label: 'Qubits n', min: 4, max: 60, step: 1, value: nsel, fmt: String, on: v => { nsel = v; upd(); } }), ro)));
        upd();
      }
    }
  },
  take: ['Full tomography needs measurements growing at least like 4ⁿ; most questions only need a few local properties.',
    'A classical shadow is built from random single-qubit Pauli measurements; each snapshot gives an unbiased estimate of ρ.',
    'A k-local Pauli observable is estimated from snapshots that happen to match its bases, weighted by 3ᵏ; about 3ᵏ log(M)/ε² snapshots suffice for M observables, independent of n.',
    'Shadows estimate energies, correlations, Rényi entropies and fidelities, and underpin results in quantum learning theory.'],
  quiz: QZ([
    ['Roughly how many real parameters describe an n-qubit density matrix?', ['n', '2n', 'About 4ⁿ', 'n²'], 2, 'A 2ⁿ × 2ⁿ Hermitian matrix with unit trace has 4ⁿ − 1 real parameters, which full tomography must estimate.'],
    ['What does one classical-shadow snapshot consist of?', ['A full density matrix', 'A random Pauli basis for each qubit and the ±1 outcome measured in it', 'One expectation value', 'A Bell measurement'], 1, 'Each qubit is measured in X, Y or Z chosen at random; the record is the bases plus outcomes.'],
    ['Why is each snapshot useful on its own?', ['It is exact', 'It defines an unbiased estimator of ρ, so averages of snapshots converge to the true expectation values', 'It identifies the state uniquely', 'It needs no measurement'], 1, 'The inverted measurement channel makes the snapshot’s expectation equal ρ, although a single snapshot is very noisy.'],
    ['How does a snapshot contribute to the estimate of X₁Z₃?', ['Always +1', '9 times the product of the two outcomes if qubit 1 was measured in X and qubit 3 in Z, otherwise 0', 'The average of all outcomes', 'Only qubit 1 matters'], 1, 'A weight-k Pauli gets 3ᵏ × product of signs when all its bases match (probability 3⁻ᵏ), keeping the estimator unbiased.'],
    ['How does the number of snapshots scale with system size n for fixed k-local observables?', ['Exponentially in n', 'It does not depend on n except through log M', 'Linearly in n', 'Like 4ⁿ'], 1, 'The bound 3ᵏ log(M)/ε² depends on locality and the number of observables, not directly on n.'],
    ['How does the cost depend on the number M of observables?', ['Linearly', 'Logarithmically', 'Exponentially', 'Quadratically'], 1, 'The same snapshots serve every observable, and a union bound adds only log M.'],
    ['Why are weight-k observables harder to estimate than single-qubit ones?', ['They are not', 'Only a fraction 3⁻ᵏ of snapshots match all their bases, so variance grows like 3ᵏ', 'They need entangled measurements', 'They are always zero'], 1, 'Fewer snapshots contribute and each contribution is scaled by 3ᵏ, so the variance grows exponentially in k (but not in n).'],
    ['What does median of means protect against?', ['Systematic bias', 'Rare large outliers in the estimates, giving good confidence with few samples', 'Decoherence', 'Measurement crosstalk'], 1, 'Splitting data into batches, averaging each and taking the median gives exponentially small failure probability despite heavy tails.'],
    ['Which property can be estimated from Pauli shadows by comparing pairs of snapshots?', ['The global phase', 'The second Rényi entropy of a small subsystem', 'The exact state vector', 'The T₁ time'], 1, 'Tr ρ_A² is quadratic in ρ, so it is estimated from pairs of distinct snapshots restricted to subsystem A.'],
    ['When are random Clifford measurements preferred to random Pauli measurements?', ['Never', 'For global properties such as fidelity with an entangled target state', 'For single-qubit observables', 'When n = 1'], 1, 'Pauli shadows are efficient for local observables; Clifford shadows have variance independent of locality and suit low-rank global observables.']
  ])
});

/* ---------------- Entanglement purification ---------------- */
const bbp = F => { const e = (1 - F) / 3, ps = F * F + 2 * F * e + 5 * e * e; return { F2: (F * F + e * e) / ps, p: ps }; };
LESSONS.push({
  id: 'purification', n: 38.6, stage: QIT, minutes: 15, title: 'Entanglement purification',
  lede: 'Noisy Bell pairs can be turned into fewer, cleaner ones using only local operations and phone calls. It is how quantum networks will fight the noise that every link and swap adds.',
  html: `
<h2>Concentrating entanglement</h2>
<p>A network link delivers Bell pairs, but noisy ones: with fidelity ${m('F')} the pair is ${m('|Φ⁺⟩')}, and otherwise one of the other three Bell states. Alice and Bob cannot repair a single pair with local operations and classical communication (LOCC), because LOCC cannot create entanglement. They can, however, <strong>concentrate</strong> it: sacrifice some pairs to learn about, and improve, others. This is <strong>entanglement purification</strong>, or distillation.</p>
<h2>The recurrence protocol</h2>
<p>Bennett, Brassard, Popescu, Schumacher, Smolin and Wootters (BBPSSW, 1996) proposed the first protocol; Deutsch, Ekert and colleagues (DEJMPS) improved it the same year. Take two pairs:</p>
<ol>
<li>Alice applies a CNOT from her half of pair 1 to her half of pair 2; Bob does the same on his side (a <strong>bilateral CNOT</strong>).</li>
<li>Both measure their halves of pair 2 in Z and compare results by phone.</li>
<li>If the results agree, keep pair 1; if not, discard it.</li>
</ol>
<p>The bilateral CNOT copies bit-flip errors from pair 1 onto pair 2, where disagreeing results reveal them. Some error combinations still slip through, but if ${m('F > ½')}, the kept pair is better on average. For Werner states, with errors spread evenly among the three bad Bell states,</p>
${EQ(`F′ = ${FR('F² + ((1 − F)/3)²', 'F² + 2F(1 − F)/3 + 5((1 − F)/3)²')}`)}
<p>with the denominator equal to the success probability. Between rounds the pairs are randomly rotated (twirled) back into Werner form. Iterating drives ${m('F → 1')}, but each round consumes at least two pairs per survivor, so the cost grows exponentially in the number of rounds.</p>
${LAB('map')}
<h2>Better rates</h2>
<ul>
<li><strong>DEJMPS</strong> alternates the roles of bit and phase errors with local rotations instead of full twirling, and converges in fewer rounds.</li>
<li><strong>Hashing</strong> protocols act on many pairs at once and, for Werner states with high enough fidelity, produce a constant fraction of perfect pairs: a positive yield ${m('1 − S(ρ)')}, where ${m('S')} is the entropy of the Bell-diagonal distribution.</li>
<li>The best possible yield is the <strong>distillable entanglement</strong>. Some entangled states have none at all: <strong>bound entanglement</strong>, entangled but useless for distillation.</li>
</ul>
${LAB('factory')}
${NOTE('Purification and error correction', `<p>Purification is closely related to error correction: a one-way purification protocol on ${m('n')} pairs is equivalent to a code applied to Bob’s halves, and syndrome measurement corresponds to comparing results. Second-generation quantum repeaters replace purification with error-correcting codes on the links, and magic state distillation ([[L:magic]]) applies the same concentrate-by-sacrifice idea to non-Clifford resource states.</p>`)}
`,
  labs: {
    map: {
      title: 'The purification map and its staircase',
      cap: 'The curve is the BBPSSW map F → F′; the diagonal is “no change”. Starting from F₀, the copper staircase (a cobweb plot) follows repeated rounds. Above F = ½ it climbs towards 1; below, it falls to ¼. The table counts how many raw pairs, on average, each final pair costs.',
      build(body, id) {
        let F0 = .75, target = .99;
        const cv = canvas('sq', 'max-width:330px;margin:0 auto'), tbl = h('div', { class: 'tbl-wrap' });
        const rounds = () => { const out = []; let F = F0, cost = 1; for (let r = 0; r < 12; r++) { const { F2, p } = bbp(F); cost *= 2 / p; out.push({ r: r + 1, F: F2, p, cost }); F = F2; if (F >= target || F < .26) break; } return out; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [.25, 1], y: [.25, 1], xt: [.25, .5, .75, 1], yt: [.25, .5, .75, 1], yf: v => num(v, 2), xf: v => num(v, 2), xl: 'fidelity F', yl: 'F′ after a round' });
          polyline(ctx, [[A.X(.25), A.Y(.25)], [A.X(1), A.Y(1)]], T.muted, 1.2, [4, 4]);
          const c3 = []; for (let k = 0; k <= 150; k++) { const F = .25 + .75 * k / 150; c3.push([A.X(F), A.Y(bbp(F).F2)]); } polyline(ctx, c3, T.cyan, 2.4);
          let F = F0; const st = [[A.X(F), A.Y(.25)]];
          for (const r of rounds()) { st.push([A.X(F), A.Y(r.F)]); st.push([A.X(r.F), A.Y(r.F)]); F = r.F; }
          polyline(ctx, st, T.copper, 1.8); dot(ctx, A.X(F0), A.Y(.25), 5, T.copper, T.surface);
          polyline(ctx, [[A.X(.5), A.T], [A.X(.5), A.B]], T.line, 1, [2, 4]);
        });
        const upd = () => {
          const R = rounds();
          tbl.innerHTML = `<table class="tbl"><thead><tr><th>round</th><th>fidelity</th><th>success</th><th>raw pairs per output</th></tr></thead><tbody>${R.map(r => `<tr><td>${r.r}</td><td>${num(r.F, 4)}</td><td>${pct(r.p, 1)}</td><td>${r.cost < 1e5 ? num(r.cost, 1) : sci(r.cost)}</td></tr>`).join('')}</tbody></table>`;
          p.inv();
        };
        body.append(h('div', { class: 'split' }, cv, h('div', { class: 'stack' },
          slider({ id: id('f'), label: 'Starting fidelity F₀', min: .3, max: .98, step: .01, value: F0, fmt: v => num(v, 2), on: v => { F0 = v; upd(); } }),
          slider({ id: id('t'), label: 'Target fidelity', min: .9, max: .999, step: .001, value: target, fmt: v => num(v, 3), on: v => { target = v; upd(); } }), tbl)));
        upd();
      }
    },
    factory: {
      title: 'A purification factory',
      cap: 'A pool of noisy pairs, each drawn as a tile coloured by its Bell state: green for the wanted |Φ⁺⟩, copper for a bit flip (Ψ⁺), blue for a phase flip (Φ⁻), red for both (Ψ⁻). Each round twirls the pairs, matches them two by two, runs the bilateral CNOT and keeps the first pair only when the comparison agrees. The pool shrinks and turns green; the readout compares the measured fidelity with the formula.',
      build(body, id) {
        let F0 = .8, pool = [], round = 0, histF = [];
        const cv = canvas('', 'height:230px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const draw0 = () => { pool = [...Array(512)].map(() => Math.random() < F0 ? 0 : 1 + Math.floor(Math.random() * 3)); round = 0; histF = [[0, fid()]]; upd(); };
        const fid = () => pool.length ? pool.filter(t => t === 0).length / pool.length : 0;
        const step = () => {
          if (pool.length < 2) return;
          pool = shuffled(pool.map(t => t ? 1 + Math.floor(Math.random() * 3) : 0));
          const out = [];
          for (let i = 0; i + 1 < pool.length; i += 2) { const c3 = pool[i], t = pool[i + 1], ca = c3 & 1, cp = c3 >> 1, ta = t & 1, tp = t >> 1; if ((ta ^ ca) === 0) out.push(((cp ^ tp) << 1) | ca); }
          pool = out; round++; histF.push([round, fid()]); upd();
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), cols = [T.good, T.copper, T.cyan, T.bad], n = pool.length, per = Math.ceil(Math.sqrt(512 * (w / H))), sz = Math.min((w - 10) / per, (H - 10) / Math.ceil(512 / per));
          pool.forEach((t, k) => { const x = 5 + (k % per) * sz, y = 5 + Math.floor(k / per) * sz; ctx.fillStyle = cols[t]; ctx.fillRect(x + .5, y + .5, sz - 1.5, sz - 1.5); });
          if (!n) txt(ctx, 'no pairs left', w / 2, H / 2, { font: '600 13px "JetBrains Mono",monospace' });
        });
        const upd = () => {
          let Fp = F0, cost = 1; const preds = [F0]; for (let r = 0; r < round; r++) { const b = bbp(Fp); Fp = b.F2; cost *= 2 / b.p; preds.push(Fp); }
          ro.innerHTML = `<span class="k">round </span>${round} &nbsp; <span class="k">pairs left </span>${pool.length} of 512<br><span class="k">measured fidelity </span>${num(fid(), 3)} &nbsp; <span class="k">formula </span>${num(Fp, 3)}<br><span class="k">expected survivors </span>${num(512 / cost, 1)}`;
          p.inv();
        };
        body.append(cv, h('div', { class: 'split' }, h('div', { class: 'stack' }, slider({ id: id('f'), label: 'Starting fidelity', min: .4, max: .95, step: .01, value: F0, fmt: v => num(v, 2), on: v => { F0 = v; draw0(); } }),
          h('div', { class: 'btns' }, btn('Run one round', step, 'pri sm'), btn('New pool', draw0, 'sm')), legendRow([['|Φ⁺⟩', 'var(--good)'], ['bit flip', 'var(--copper)'], ['phase flip', 'var(--cyan)'], ['both', 'var(--bad)']])), ro));
        draw0();
      }
    }
  },
  take: ['LOCC cannot create entanglement, but purification concentrates it by sacrificing some noisy pairs to improve others.',
    'In the recurrence protocol, a bilateral CNOT and a comparison of measurement results reveal bit-flip errors; disagreeing pairs are discarded.',
    'For Werner states with F > ½, iterating drives F → 1, at a cost that grows exponentially with the number of rounds.',
    'DEJMPS converges faster, hashing gives a constant yield, and purification is closely related to error correction and magic state distillation.'],
  quiz: QZ([
    ['Why can’t Alice and Bob improve a single noisy pair with local operations and classical communication?', ['They can', 'LOCC cannot increase entanglement on average, so it cannot repair one pair', 'Because of the speed of light', 'Because the pair is mixed'], 1, 'Entanglement is a resource that LOCC can only move or concentrate, never create. Improvement requires sacrificing other pairs.'],
    ['What is the first step of the BBPSSW recurrence protocol?', ['Measure both pairs', 'A bilateral CNOT: each party applies a CNOT from their half of pair 1 to their half of pair 2', 'Teleport one pair', 'Apply Hadamards'], 1, 'The bilateral CNOT transfers information about pair 1’s bit-flip errors onto pair 2, which is then measured.'],
    ['When is pair 1 kept?', ['Always', 'When Alice’s and Bob’s Z results on pair 2 agree', 'When they disagree', 'When both results are 0'], 1, 'Agreement means no bit-flip error was detected in the combination; disagreement reveals one and the pair is discarded.'],
    ['Above what starting fidelity does the BBPSSW recurrence improve Werner states?', ['¼', '½', '¾', '0.9'], 1, 'For F > ½ the map F → F′ lies above the diagonal, so iteration climbs towards 1. Below ½ it falls towards ¼.'],
    ['What is the success probability of one BBPSSW round at fidelity F?', ['F²', 'F² + 2F(1−F)/3 + 5((1−F)/3)²', 'F', '½'], 1, 'It is the probability that the two pairs’ bit-flip components agree, which is also the denominator of the fidelity formula.'],
    ['Why are pairs twirled between rounds?', ['To speed up the protocol', 'To randomize the error type back into Werner form, so the same formula applies each round', 'To add entanglement', 'To measure them'], 1, 'Random bilateral rotations spread errors evenly over the three bad Bell states without changing the fidelity.'],
    ['How does the number of raw pairs per output pair scale with the number of rounds?', ['Linearly', 'Exponentially, since each round consumes at least two pairs per survivor', 'It is constant', 'Logarithmically'], 1, 'Each round halves the pool at best, and discards reduce it further, so cost ≥ 2^rounds.'],
    ['What advantage does the hashing protocol have?', ['It needs no communication', 'It acts on many pairs at once and yields a constant fraction of perfect pairs when fidelity is high enough', 'It works below F = ½ for all states', 'It needs only one pair'], 1, 'Hashing achieves a positive asymptotic yield 1 − S, unlike recurrence protocols whose yield goes to zero.'],
    ['What is bound entanglement?', ['Entanglement between bound electrons', 'Entanglement that cannot be distilled into any Bell pairs', 'The maximum entanglement', 'Entanglement of GHZ states'], 1, 'Some entangled mixed states have zero distillable entanglement: no LOCC protocol extracts pure Bell pairs from them.'],
    ['How is purification related to error correction?', ['Unrelated', 'One-way purification protocols correspond to error-correcting codes applied to one party’s halves, with comparisons playing the role of syndromes', 'Error correction is a special case of teleportation', 'Purification replaces error correction entirely'], 1, 'This correspondence (Bennett, DiVincenzo, Smolin and Wootters, 1996) links distillation yields and code rates, and inspires second-generation repeaters.']
  ])
});

/* ---------------- Lattices ---------------- */
const lll = (B, delta = .99) => {
  const n = B.length, m = B[0].length, dot2 = (a, b) => { let s = 0; for (let i = 0; i < m; i++) s += a[i] * b[i]; return s; };
  const mu = [...Array(n)].map(() => new Float64Array(n)), Bn = new Float64Array(n), Bs = [];
  for (let i = 0; i < n; i++) { const v = Float64Array.from(B[i]); for (let j = 0; j < i; j++) { mu[i][j] = dot2(B[i], Bs[j]) / Bn[j]; for (let t = 0; t < m; t++) v[t] -= mu[i][j] * Bs[j][t]; } Bs.push(v); Bn[i] = dot2(v, v); }
  let k = 1, iter = 0;
  while (k < n && iter < 200000) {
    iter++;
    for (let j = k - 1; j >= 0; j--) { const q = Math.round(mu[k][j]); if (q) { for (let t = 0; t < m; t++) B[k][t] -= q * B[j][t]; for (let l = 0; l < j; l++) mu[k][l] -= q * mu[j][l]; mu[k][j] -= q; } }
    if (Bn[k] >= (delta - mu[k][k - 1] ** 2) * Bn[k - 1]) k++;
    else {
      [B[k], B[k - 1]] = [B[k - 1], B[k]]; const mk = mu[k][k - 1], Bnew = Bn[k] + mk * mk * Bn[k - 1];
      mu[k][k - 1] = mk * Bn[k - 1] / Bnew; Bn[k] = Bn[k - 1] * Bn[k] / Bnew; Bn[k - 1] = Bnew;
      for (let j = 0; j < k - 1; j++) { const t = mu[k - 1][j]; mu[k - 1][j] = mu[k][j]; mu[k][j] = t; }
      for (let i = k + 1; i < n; i++) { const t = mu[i][k]; mu[i][k] = mu[i][k - 1] - mk * t; mu[i][k - 1] = t + mu[k][k - 1] * mu[i][k]; }
      k = Math.max(1, k - 1);
    }
  }
  return B;
};
LESSONS.push({
  id: 'lattices', n: 39.5, stage: QIT, minutes: 17, title: 'Lattices: the geometry behind post-quantum cryptography',
  lede: 'The new post-quantum standards rest on a deceptively simple picture: a regular grid of points that can be described by a good basis or a terrible one. Finding nearby points is easy with the first and hopeless with the second.',
  html: `
<h2>Points on a grid</h2>
<p>A <strong>lattice</strong> is the set of all integer combinations of some basis vectors ${m('b₁, …, bₙ')}. In two dimensions it is a slanted grid of points. The same lattice has infinitely many bases: multiply the basis matrix by any integer matrix with determinant ±1 and you get the same points. Some bases are <strong>good</strong>, with short, nearly perpendicular vectors; others are <strong>bad</strong>, with long vectors pointing in almost the same direction. The volume of the fundamental cell, the determinant, is the same for all of them.</p>
<h2>Hard problems</h2>
<ul>
<li><strong>Shortest Vector Problem (SVP)</strong>: find the shortest nonzero lattice vector.</li>
<li><strong>Closest Vector Problem (CVP)</strong>: given a target point, find the nearest lattice point.</li>
</ul>
<p>In two dimensions both are easy. In hundreds of dimensions, the best known algorithms, classical or quantum, take time exponential in the dimension to solve them, or even to approximate them within small polynomial factors. Oded Regev showed in 2005 that the <strong>learning with errors</strong> problem behind ML-KEM ([[L:pqc]]) is as hard as approximate worst-case lattice problems, the security foundation of the new standards.</p>
<h2>Babai’s algorithm: good bases are trapdoors</h2>
<p>László Babai’s 1986 rounding method solves CVP approximately: write the target in the basis, round each coordinate to the nearest integer, and convert back. Geometrically, each lattice point “owns” a parallelogram-shaped cell spanned by the basis vectors around it. With a good basis the cells are nearly square and the answer is the true closest point; with a bad basis they are long thin slivers and the answer can be far off. A secret good basis is therefore a <strong>trapdoor</strong>: whoever has it can decode, while everyone else, holding only a bad basis of the same lattice, cannot. Signature schemes such as FN-DSA (Falcon) use exactly this idea, with careful randomization so that signatures do not leak the trapdoor.</p>
${LAB('babai')}
<h2>Basis reduction</h2>
<p>Can a bad basis be turned into a good one? In two dimensions, yes: Lagrange and Gauss’s reduction repeatedly subtracts the best integer multiple of the shorter vector from the longer one and swaps them, and finishes with the shortest vectors. In 1982 Lenstra, Lenstra and Lovász generalized this to any dimension: the <strong>LLL algorithm</strong> runs in polynomial time and finds a vector at most about ${m('2<sup>n/2</sup>')} times longer than the shortest. In practice it does much better, a factor of about ${m('1.02ⁿ')}, but that exponential gap is what protects cryptography. The <strong>BKZ</strong> algorithm trades running time, exponential in a block size ${m('β')}, for a smaller factor; the security analysis of ML-KEM-512 corresponds to block sizes around 400, far beyond feasibility.</p>
${LAB('reduce')}
${NOTE('And quantum computers?', `<p>Shor’s algorithm solves the abelian hidden subgroup problem; lattice problems are linked instead to a non-abelian (dihedral) version for which no efficient quantum algorithm is known. A 2024 preprint claiming a polynomial-time quantum algorithm for LWE was retracted by its author after a bug was found. The best known quantum speedups for lattice problems are modest, through Grover-style search inside sieving algorithms, and they are already accounted for in the parameter choices.</p>`)}
`,
  labs: {
    babai: {
      title: 'Good basis, bad basis',
      cap: 'Lattice points (dots), the current basis vectors (copper arrows) and the decoding cell they define around each point (shaded). Drag the blue target. Babai rounding returns the copper ring; the green ring is the true closest point. Scramble the basis to make it long and skewed: the cells become slivers and Babai fails. Then run Gauss reduction to recover a good basis, one step at a time.',
      build(body, id) {
        const G0 = [[1, .18], [.32, .95]]; let Bv = G0.map(v => v.slice()), tgt = [.62, .3], stepping = null, G = null, succ = null;
        const cv = canvas('', 'height:330px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), stat = h('div', { class: 'status' });
        const det = M => M[0][0] * M[1][1] - M[0][1] * M[1][0];
        const coords = (M, t) => { const d = det(M); return [(t[0] * M[1][1] - t[1] * M[1][0]) / d, (-t[0] * M[0][1] + t[1] * M[0][0]) / d]; };
        const comb = (M, c3) => [c3[0] * M[0][0] + c3[1] * M[1][0], c3[0] * M[0][1] + c3[1] * M[1][1]];
        const babai = (M, t) => comb(M, coords(M, t).map(Math.round));
        const closest = t => { const c0 = coords(G0, t).map(Math.round); let best = null, bd = 1e9; for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const p = comb(G0, [c0[0] + i, c0[1] + j]), d = Math.hypot(p[0] - t[0], p[1] - t[1]); if (d < bd) { bd = d; best = p; } } return best; };
        const rate = () => { let ok = 0; for (let k = 0; k < 600; k++) { const t = [Math.random() * 6 - 3, Math.random() * 4 - 2], a = babai(Bv, t), b = closest(t); if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) ok++; } return ok / 600; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), S = Math.min(w / 6.4, H / 4.4), cx = w / 2, cy = H / 2; G = { S, cx, cy };
          const X = v => cx + v[0] * S, Y = v => cy - v[1] * S;
          const bb = babai(Bv, tgt), cell = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]].map(c3 => comb(Bv, c3));
          ctx.fillStyle = rgba(T.copper, .14); ctx.strokeStyle = rgba(T.copper, .6); ctx.lineWidth = 1.2; ctx.beginPath(); cell.forEach((c3, k) => { const q = [bb[0] + c3[0], bb[1] + c3[1]]; k ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q)); }); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = rgba(T.cyan, .08); ctx.beginPath(); [[0, 0], [1, 0], [1, 1], [0, 1]].map(c3 => comb(Bv, c3)).forEach((q, k) => k ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q))); ctx.closePath(); ctx.fill();
          for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) { const q = comb(G0, [i, j]); if (Math.abs(q[0]) < 3.3 && Math.abs(q[1]) < 2.3) dot(ctx, X(q), Y(q), 3.2, T.ink); }
          for (const v of Bv) { const L = Math.hypot(...v), f = Math.min(1, 3.1 / L); arrow(ctx, X([0, 0]), Y([0, 0]), X([v[0] * f, v[1] * f]), Y([v[0] * f, v[1] * f]), T.copper, 2.6, 10); if (f < 1) txt(ctx, '…', X([v[0] * f, v[1] * f]) + 10, Y([v[0] * f, v[1] * f]), { font: '700 14px "JetBrains Mono",monospace', color: T.copper }); }
          const cl = closest(tgt);
          ctx.strokeStyle = T.good; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(cl), Y(cl), 11, 0, TAU); ctx.stroke();
          ctx.strokeStyle = T.copper; ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(X(bb), Y(bb), 15, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          dot(ctx, X(tgt), Y(tgt), 7, T.cyan, T.surface);
        });
        const upd = (full) => {
          const L1 = Math.hypot(...Bv[0]), L2 = Math.hypot(...Bv[1]), d = Math.abs(det(Bv)), bb = babai(Bv, tgt), cl = closest(tgt);
          if (full || succ == null) succ = rate();
          ro.innerHTML = `<span class="k">basis lengths </span>${num(L1, 2)}, ${num(L2, 2)} &nbsp; <span class="k">area </span>${num(d, 3)} (never changes)<br><span class="k">orthogonality defect |b₁||b₂|/area </span>${num(L1 * L2 / d, 2)}<br><span class="k">Babai on this target </span>${Math.hypot(bb[0] - cl[0], bb[1] - cl[1]) < 1e-6 ? 'correct' : 'wrong'} &nbsp; <span class="k">success over 600 random targets </span>${pct(succ, 0)}`;
          p.inv();
        };
        const scramble = () => { if (stepping) return; for (let k = 0; k < 6; k++) { const q = (Math.random() < .5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2)); if (k % 2) Bv[0] = [Bv[0][0] + q * Bv[1][0], Bv[0][1] + q * Bv[1][1]]; else Bv[1] = [Bv[1][0] + q * Bv[0][0], Bv[1][1] + q * Bv[0][1]]; } if (Math.hypot(...Bv[0]) + Math.hypot(...Bv[1]) < 8) return scramble(); stat.className = 'status bad'; stat.textContent = 'Basis scrambled with integer row operations: same lattice, terrible basis.'; upd(true); };
        const reduce = () => {
          if (stepping) return; let n = 0;
          const one = () => {
            const [a, b] = Bv, la = a[0] ** 2 + a[1] ** 2, lb = b[0] ** 2 + b[1] ** 2;
            if (lb < la - 1e-12) { Bv = [b, a]; stat.textContent = `Step ${++n}: swap so that b₁ is the shorter vector.`; upd(true); return true; }
            const mu = Math.round((a[0] * b[0] + a[1] * b[1]) / la);
            if (mu) { Bv = [a, [b[0] - mu * a[0], b[1] - mu * a[1]]]; stat.textContent = `Step ${++n}: subtract ${mu} × b₁ from b₂.`; upd(true); return true; }
            return false;
          };
          stat.className = 'status';
          stepping = Scope.every(dur(650) || 1, () => { if (!one()) { clearInterval(stepping); stepping = null; stat.className = 'status good'; stat.textContent = `Reduced in ${n} steps: the basis is short and nearly perpendicular again, and Babai succeeds.`; upd(true); } });
        };
        dragHandles(cv, () => 't', (k, x, y) => { if (!G) return; tgt = [clamp((x - G.cx) / G.S, -3.1, 3.1), clamp((G.cy - y) / G.S, -2.1, 2.1)]; upd(false); });
        body.append(cv, h('div', { class: 'split' }, h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Scramble the basis', scramble, 'sm'), btn('Reduce (Gauss)', reduce, 'pri sm'), btn('Good basis', () => { if (stepping) return; Bv = G0.map(v => v.slice()); stat.className = 'status'; stat.textContent = 'The original good basis.'; upd(true); }, 'sm')), stat), ro));
        stat.textContent = 'A good basis: decoding cells are nearly square.'; upd(true);
      }
    },
    reduce: {
      title: 'LLL in higher dimensions',
      cap: 'Real LLL runs, in your browser, on random q-ary lattices like those behind LWE (q = 3329, the ML-KEM modulus), of dimension n. Copper: length of the shortest vector LLL finds. Blue: the expected length of the true shortest vector (Gaussian heuristic). The gap between them grows exponentially with n, and the readout fits the root Hermite factor δ in |b₁| ≈ δⁿ det^(1/n); it comes out close to the value of about 1.02 typical of LLL.',
      build(body, id) {
        let res = [], job = null;
        const cv = canvas('', 'height:250px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), stat = h('div', { class: 'status' }), q = 3329;
        const one = (n, seed) => { const k = n / 2, r = rng(seed), B = []; for (let i = 0; i < k; i++) { const v = new Array(n).fill(0); v[i] = q; B.push(v); } for (let i = 0; i < k; i++) { const v = new Array(n).fill(0); for (let j = 0; j < k; j++) v[j] = Math.floor(r() * q); v[k + i] = 1; B.push(v); } const t0 = performance.now(); lll(B); const ms = performance.now() - t0; let best = Infinity; for (const v of B) { const L = Math.hypot(...v); if (L > 0 && L < best) best = L; } return { n, L: best, gh: Math.sqrt(n / (2 * PI * Math.E)) * Math.sqrt(q), ms }; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [4, 48], y: [10, 400], ylog: true, xt: [4, 12, 20, 28, 36, 44], yt: [10, 30, 100, 300], yf: v => String(v), xl: 'lattice dimension n', yl: 'vector length' });
          if (!res.length) return; polyline(ctx, res.map(r => [A.X(r.n), A.Y(r.gh)]), T.cyan, 2.2); polyline(ctx, res.map(r => [A.X(r.n), A.Y(r.L)]), T.copper, 2.4); res.forEach(r => dot(ctx, A.X(r.n), A.Y(r.L), 4, T.copper));
        });
        const fit = () => { const pts = res.filter(r => r.n >= 16).map(r => [r.n, Math.log(r.L / Math.sqrt(q))]); if (pts.length < 2) return null; let sx = 0, sy = 0, sxy = 0, sxx = 0; for (const [x, y] of pts) { sx += x; sy += y; sxy += x * y; sxx += x * x; } const N = pts.length, b = (N * sxy - sx * sy) / (N * sxx - sx * sx); return Math.exp(b); };
        const run = () => {
          if (job) return; res = []; stat.className = 'status'; stat.textContent = 'Reducing…'; let n = 4;
          job = Scope.every(30, () => { const r = one(n, 1000 + n); res.push(r); p.inv(); const d = fit(); ro.innerHTML = res.slice(-4).map(x => `<span class="k">n = ${x.n} </span>LLL ${num(x.L, 1)} vs shortest ≈ ${num(x.gh, 1)} (ratio ${num(x.L / x.gh, 2)}) · ${num(x.ms, 0)} ms`).join('<br>') + (d ? `<br><span class="k">fitted root Hermite factor δ </span>${num(d, 4)}` : ''); n += 4; if (n > 48) { clearInterval(job); job = null; stat.className = 'status good'; stat.textContent = 'Done. LLL’s output drifts further from the shortest vector as the dimension grows; cryptographic lattices use dimensions in the hundreds.'; } });
        };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['LLL output', 'var(--copper)'], ['shortest vector (Gaussian heuristic)', 'var(--cyan)']])), h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Run LLL again', run, 'pri sm')), stat, ro)));
        Scope.later(80, run);
      }
    }
  },
  take: ['A lattice is all integer combinations of a basis; many bases describe the same lattice, some short and nearly orthogonal, others long and skewed.',
    'SVP and CVP are believed hard in high dimension even for quantum computers, and LWE reduces to worst-case lattice problems.',
    'Babai rounding decodes well with a good basis and badly with a bad one, so a secret good basis acts as a trapdoor.',
    'LLL reduces bases in polynomial time but only to within about 1.02ⁿ of the shortest vector; BKZ does better at exponential cost in its block size.'],
  quiz: QZ([
    ['What is a lattice?', ['A random set of points', 'All integer linear combinations of a set of basis vectors', 'A grid with only right angles', 'A quantum error-correcting code'], 1, 'Lattices are discrete additive subgroups of ℝⁿ generated by a basis; integer combinations give a regular array of points.'],
    ['How are two bases of the same lattice related?', ['By any invertible matrix', 'By an integer matrix with determinant ±1 (a unimodular matrix)', 'By a rotation', 'They cannot be related'], 1, 'Unimodular transformations map integer combinations to integer combinations bijectively, preserving the lattice and its determinant.'],
    ['What does the Closest Vector Problem ask?', ['Find the shortest basis', 'Given a target point, find the nearest lattice point', 'Count the lattice points', 'Find the determinant'], 1, 'CVP is the decoding problem; it and SVP are believed hard in high dimensions.'],
    ['What does Babai’s rounding algorithm do?', ['Enumerates all points', 'Expresses the target in the basis, rounds each coefficient, and converts back', 'Runs LLL', 'Uses Grover search'], 1, 'Rounding coordinates is fast, but the quality of the answer depends entirely on how good the basis is.'],
    ['Why does Babai rounding fail with a bad basis?', ['It never fails', 'The decoding cells become long thin parallelograms, so nearby targets get assigned to distant lattice points', 'The lattice changes', 'Rounding is too slow'], 1, 'Each point owns the parallelogram spanned by the basis around it; skewed bases make these cells reach far from the point.'],
    ['How can a good basis serve as a cryptographic trapdoor?', ['It cannot', 'Only the holder of a good basis can decode efficiently, while the public bad basis of the same lattice is useless for decoding', 'It encrypts messages directly', 'It makes the lattice smaller'], 1, 'Schemes publish a bad basis and keep a good one secret; signing or decryption uses the good basis to solve CVP-like problems.'],
    ['What does the LLL algorithm guarantee?', ['The exact shortest vector', 'A reduced basis in polynomial time whose first vector is within about 2^(n/2) of the shortest', 'An exponential-time exact solution', 'Nothing in high dimensions'], 1, 'LLL runs in polynomial time with an exponential worst-case approximation factor; in practice the factor is about 1.02ⁿ.'],
    ['What is the root Hermite factor δ?', ['The lattice determinant', 'The constant in |b₁| ≈ δⁿ det^(1/n) describing how short a reduction algorithm’s output vector is', 'The LWE noise rate', 'The quantum speedup'], 1, 'Smaller δ means stronger reduction; LLL achieves about 1.02, stronger BKZ variants approach 1.005 at much higher cost.'],
    ['Why is LWE believed secure against quantum computers?', ['Because it is classical', 'It reduces to worst-case lattice problems, and no efficient quantum algorithm is known for them; Shor’s methods do not apply', 'Because quantum computers cannot do arithmetic', 'Because it uses large primes'], 1, 'Lattice problems relate to non-abelian hidden subgroup problems, which have resisted quantum attacks; known quantum speedups are modest.'],
    ['In two dimensions, how does Gauss (Lagrange) reduction work?', ['Random sampling', 'Repeatedly swap so the first vector is shorter and subtract the nearest integer multiple of it from the second', 'Gram–Schmidt only', 'Exhaustive search over all bases'], 1, 'This Euclid-like loop terminates with a basis containing the two shortest independent vectors.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Classical shadow', 'A classical record of randomized single-qubit measurements from which many properties of a quantum state can be predicted.', 'shadows'],
  ['State tomography', 'Reconstructing a full quantum state from measurements; the cost grows exponentially with the number of qubits.', 'shadows'],
  ['Median of means', 'A robust estimator that averages batches of samples and takes their median, giving high confidence despite outliers.', 'shadows'],
  ['Entanglement purification', 'Using local operations and classical communication on several noisy entangled pairs to produce fewer pairs of higher fidelity.', 'purification'],
  ['Bilateral CNOT', 'CNOTs applied by both parties between their halves of two shared pairs, the core step of recurrence purification.', 'purification'],
  ['Distillable entanglement', 'The best asymptotic rate at which pure Bell pairs can be extracted from many copies of a state by LOCC.', 'purification'],
  ['Lattice', 'The set of all integer combinations of a set of basis vectors in ℝⁿ.', 'lattices'],
  ['Shortest Vector Problem', 'Finding the shortest nonzero vector in a lattice; believed hard in high dimension for classical and quantum computers.', 'lattices'],
  ['LLL algorithm', 'The Lenstra–Lenstra–Lovász polynomial-time lattice basis reduction algorithm.', 'lattices'],
  ['Babai’s algorithm', 'Approximate closest-vector decoding by rounding a target’s coordinates in a given basis.', 'lattices']
);
})();
