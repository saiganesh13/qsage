/* =====================================================================
   Stage 5 additions · benchmarking, error mitigation, readout
   ===================================================================== */
(() => {
const ST = 4;

/* single-qubit Clifford group as the 24 rotations of the Bloch sphere (signed permutation matrices, det +1) */
const CLIFF = (() => {
  const out = [], perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  for (const p of perms) for (let sg = 0; sg < 8; sg++) {
    const R = [0, 0, 0, 0, 0, 0, 0, 0, 0]; for (let i = 0; i < 3; i++) R[i * 3 + p[i]] = (sg >> i) & 1 ? -1 : 1;
    const det = R[0] * (R[4] * R[8] - R[5] * R[7]) - R[1] * (R[3] * R[8] - R[5] * R[6]) + R[2] * (R[3] * R[7] - R[4] * R[6]);
    if (det > 0) out.push(R);
  }
  return out;
})();
const mv3 = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
const mtv3 = (R, v) => [R[0] * v[0] + R[3] * v[1] + R[6] * v[2], R[1] * v[0] + R[4] * v[1] + R[7] * v[2], R[2] * v[0] + R[5] * v[1] + R[8] * v[2]];
const mm3 = (A, B) => { const C = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j]; return C; };

/* ---------------- Randomized benchmarking ---------------- */
LESSONS.push({
  id: 'rb', n: 17.3, stage: ST, minutes: 16, title: 'Benchmarking: how good is a gate?',
  lede: 'A gate that is 99.9% good fails once in a thousand uses. Measuring that number honestly, when preparation and measurement are themselves a hundred times worse, takes a clever trick with random sequences.',
  html: `
<h2>What a fidelity number means</h2>
<p>When a lab reports a “99.9% two-qubit gate fidelity”, it usually means the <strong>average gate fidelity</strong>: prepare a random pure input, apply the noisy gate, and ask how much the output overlaps with the ideal output, averaged over all inputs. One minus this is the <strong>error per gate</strong>, here ${m('r = 10<sup>−3</sup>')}. Error rates set everything downstream: how deep a circuit can run before its output is noise, and whether error correction is below threshold ([[L:qec]]).</p>
<h2>Why not just measure it?</h2>
<p>Process tomography reconstructs the full noisy operation by preparing many input states and measuring in many bases. It needs a number of settings that grows exponentially with qubit count, and it has a subtler flaw: state preparation and measurement (<strong>SPAM</strong>) errors of a percent or so are mixed into the result, swamping a gate error of 0.1%.</p>
<h2>Randomized benchmarking</h2>
<p>Randomized benchmarking (Emerson, Alicki and Życzkowski 2005; Knill and colleagues 2008; Magesan, Gambetta and Emerson 2011) sidesteps both problems:</p>
<ol>
<li>Pick ${m('m')} Clifford gates at random and apply them in sequence.</li>
<li>Append the single Clifford that undoes the whole sequence; thanks to Gottesman–Knill it is easy to compute. Ideally the qubit returns to ${m('|0⟩')}.</li>
<li>Measure the survival probability, average over many random sequences, and repeat for many lengths ${m('m')}.</li>
</ol>
<p>Averaging over random Cliffords <strong>twirls</strong> any noise into simple depolarizing noise, so the average survival decays as a single exponential:</p>
${EQ('F(m) = A p<sup>m</sup> + B,&nbsp;&nbsp;&nbsp; r = (1 − p)(d − 1)/d')}
<p>where ${m('d = 2ⁿ')}. SPAM errors only change ${m('A')} and ${m('B')}, the starting height and the floor, and leave the decay rate ${m('p')} untouched. That is why RB numbers can be trusted at the 0.01% level.</p>
${LAB('rb')}
<h2>Interleaved RB and its relatives</h2>
<p>To benchmark one particular gate ${m('G')}, insert it after every random Clifford. The extra decay rate ${m('p<sub>G</sub>')} relative to the reference ${m('p')} estimates its error: ${m('r<sub>G</sub> ≈ (d − 1)(1 − p<sub>G</sub>/p)/d')}. Variants handle leakage out of the qubit space, crosstalk between simultaneous gates, and non-Clifford gates.</p>
<h2>Benchmarking whole processors</h2>
<ul>
<li><strong>Cross-entropy benchmarking (XEB)</strong> runs random circuits and checks how often the device produces outputs that are likely under the ideal distribution: ${m('F<sub>XEB</sub> = 2ⁿ⟨p<sub>ideal</sub>(x)⟩ − 1')}. For deep random circuits it estimates the whole circuit’s fidelity. It was the yardstick of the quantum advantage experiments ([[L:advantage]]).</li>
<li><strong>Quantum volume</strong> is the largest square random circuit (width = depth) whose outputs pass a “heavy output” test; <strong>layer fidelity</strong> measures the error of a full layer of simultaneous two-qubit gates on a large chip.</li>
<li><strong>Gate set tomography</strong> builds a complete, self-consistent model of every gate, preparation and measurement at once, at the cost of many more experiments.</li>
</ul>
${LAB('xeb')}
${NOTE('What averages hide', `<p>RB reports an average. A coherent error, such as a slight over-rotation, looks like ordinary depolarizing noise to RB, but in a circuit that repeats the same gate it can add up in amplitude rather than probability, so the worst-case error grows like ${m('√r')} per gate rather than ${m('r')}; randomized compiling ([[L:randcomp]]) is the standard remedy. Leakage, correlated errors and slow drifts are also partly invisible. Good error budgets combine RB with targeted calibration experiments.</p>`)}
`,
  labs: {
    rb: {
      title: 'Randomized benchmarking simulator',
      cap: 'Each faint dot is one random Clifford sequence of length m (its survival probability, estimated from 200 shots). Solid dots are averages; the curve is a fit of A·pᵐ + ½. Raise the SPAM errors: the curve starts lower but decays at the same rate. Switch on interleaving to benchmark one extra gate.',
      build(body, id) {
        let pd = .002, eps = 0, ep = .02, em = .03, inter = false, q = .004, data = null;
        const LENS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024], K = 25, SH = 200;
        const cv = canvas('', 'height:260px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const Xg = CLIFF.find(R => R[0] === 1 && R[4] === -1 && R[8] === -1);
        const survive = (m, withG) => {
          let v = [0, 0, 1 - 2 * ep], Rtot = [1, 0, 0, 0, 1, 0, 0, 0, 1];
          const noise = (u, extra) => { const f = (1 - pd) * (1 - (extra || 0)); u = [u[0] * f, u[1] * f, u[2] * f]; if (eps) { const cs = Math.cos(eps), sn = Math.sin(eps); u = [cs * u[0] - sn * u[1], sn * u[0] + cs * u[1], u[2]]; } return u; };
          for (let k = 0; k < m; k++) {
            const C = CLIFF[Math.floor(Math.random() * 24)]; v = noise(mv3(C, v)); Rtot = mm3(C, Rtot);
            if (withG) { v = noise(mv3(Xg, v), q); Rtot = mm3(Xg, Rtot); }
          }
          v = noise(mtv3(Rtot, v));
          const P = (1 + (1 - 2 * em) * v[2]) / 2; return binom(SH, clamp(P, 0, 1)) / SH;
        };
        const fit = pts => { let best = null; for (let i = 0; i <= 2000; i++) { const p = .9 + .1 * i / 2000; let sxy = 0, sxx = 0; for (const [m, y] of pts) { const x = Math.pow(p, m); sxy += x * (y - .5); sxx += x * x; } const A = sxy / sxx; let e = 0; for (const [m, y] of pts) e += (y - .5 - A * Math.pow(p, m)) ** 2; if (!best || e < best.e) best = { p, A, e }; } return best; };
        const run = () => {
          const ref = [], itl = [];
          for (const m of LENS) { const ys = [], yi = []; for (let k = 0; k < K; k++) { ys.push(survive(m, false)); if (inter) yi.push(survive(m, true)); } ref.push([m, ys]); if (inter) itl.push([m, yi]); }
          const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
          data = { ref, itl, fr: fit(ref.map(([m, ys]) => [m, mean(ys)])), fi: inter ? fit(itl.map(([m, ys]) => [m, mean(ys)])) : null, mean };
          upd();
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!data) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [1, 1024], y: [.4, 1.02], xlog: true, xt: [1, 4, 16, 64, 256, 1024], yt: [.5, .75, 1], yf: v => pct(v, 0), xl: 'sequence length m (Cliffords)', yl: 'survival probability' });
          const draw = (set, ft, col) => {
            for (const [m, ys] of set) for (const y of ys) { ctx.globalAlpha = .25; dot(ctx, A.X(m) + (Math.random() - .5) * 6, A.Y(y), 2, col); ctx.globalAlpha = 1; }
            for (const [m, ys] of set) dot(ctx, A.X(m), A.Y(data.mean(ys)), 4.5, col, Theme.get().surface);
            const pts = []; for (let e = 0; e <= 10; e += .05) { const m = 2 ** e; pts.push([A.X(m), A.Y(.5 + ft.A * Math.pow(ft.p, m))]); } polyline(ctx, pts, col, 2);
          };
          polyline(ctx, [[A.L, A.Y(.5)], [A.R, A.Y(.5)]], T.muted, 1, [3, 4]);
          draw(data.ref, data.fr, T.cyan); if (data.fi) draw(data.itl, data.fi, T.copper);
        });
        const upd = () => {
          const rTrue = pd / 2 + 2 * Math.sin(eps / 2) ** 2 / 3, rFit = (1 - data.fr.p) / 2;
          let s = `<span class="k">error per Clifford, model </span>${sci(rTrue)}<br><span class="k">error per Clifford, RB fit </span>${sci(rFit)}<br><span class="k">fitted A (SPAM sets this)  </span>${num(data.fr.A, 3)}`;
          if (data.fi) { const rg = (1 - data.fi.p / data.fr.p) / 2; s += `<br><span class="k">interleaved X: estimated error </span>${sci(rg)} &nbsp;(<span class="k">extra error put in </span>${sci(q / 2)})`; }
          ro.innerHTML = s; p.inv();
        };
        body.append(cv, h('div', { class: 'split even' },
          h('div', { class: 'stack' },
            slider({ id: id('pd'), label: 'Depolarizing error per gate', min: 0, max: .02, step: .0005, value: pd, fmt: v => pct(v, 2), on: v => { pd = v; } }),
            slider({ id: id('eps'), label: 'Coherent over-rotation per gate', min: 0, max: .15, step: .005, value: eps, fmt: v => num(deg(v), 1) + '°', on: v => { eps = v; } }),
            slider({ id: id('spam'), label: 'Preparation and measurement errors', min: 0, max: .1, step: .005, value: em, fmt: v => pct(v, 1), on: v => { em = v; ep = v * .7; } })),
          h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('Run benchmark', run, 'pri sm'), seg([{ v: false, label: 'Reference only' }, { v: true, label: 'Interleave X' }], inter, v => { inter = v; run(); }, 'Interleaving')),
            slider({ id: id('q'), label: 'Extra error on the interleaved X', min: 0, max: .02, step: .0005, value: q, fmt: v => pct(v, 2), on: v => { q = v; } }), ro)));
        run();
      }
    },
    xeb: {
      title: 'Cross-entropy benchmarking',
      cap: 'An 8-qubit random circuit of √X, √Y, √W gates and CZ layers. Left: the ideal output probabilities, scaled by 2ⁿ, follow the exponential Porter–Thomas shape (curve) once the circuit is deep enough. Right: a noisy device returns the ideal distribution with probability F and uniform noise otherwise. The raw estimate 2ⁿ⟨p⟩ − 1 is exact only for perfect Porter–Thomas statistics; dividing by 2ⁿΣp² − 1, computed from the ideal simulation, removes the bias. Try a shallow circuit to see the difference.',
      build(body, id) {
        const n = 8, N = 256; let D = 10, e = .005, shots = 3000, ideal = null, res = null;
        const hc = canvas('', 'height:220px'), bc = canvas('', 'height:220px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const G1 = [Rx(PI / 2), Ry(PI / 2), Rn2([S2, S2, 0], PI / 2)];
        const build = () => { const s = new QState(n); let g = 0, last = new Array(n).fill(-1); for (let l = 0; l < D; l++) { for (let qq = 0; qq < n; qq++) { let k; do { k = Math.floor(Math.random() * 3); } while (k === last[qq]); last[qq] = k; s.apply(qq, G1[k]); g++; } for (let qq = l % 2; qq + 1 < n; qq += 2) { s.cz(qq, qq + 1); g++; } } ideal = { p: s.probs(), g }; };
        const sample = () => {
          const F = Math.pow(1 - e, ideal.g), cum = []; let acc = 0; for (const v of ideal.p) { acc += v; cum.push(acc); }
          let sum = 0; for (let k = 0; k < shots; k++) { let x; if (Math.random() < F) { const r = Math.random() * acc; let lo = 0, hi = N - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < r) lo = mid + 1; else hi = mid; } x = lo; } else x = Math.floor(Math.random() * N); sum += ideal.p[x]; }
          let m2 = 0; ideal.p.forEach(v => { m2 += N * v * v; }); const raw = N * sum / shots - 1; res = { F, fx: raw / (m2 - 1), raw, se: Math.sqrt(2) / Math.sqrt(shots) / (m2 - 1) }; upd();
        };
        const hist = painter(hc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), nb = 24, xm = 6, b = new Array(nb).fill(0); ideal.p.forEach(v => { const k = Math.floor(N * v / xm * nb); if (k < nb) b[k]++; });
          const dens = b.map(v => v / N / (xm / nb)), A = axes(ctx, w, H, { x: [0, xm], y: [0, 1.1], xt: [0, 2, 4, 6], yt: [0, .5, 1], yf: v => num(v, 1), xl: '2ⁿ · p(x)', yl: 'density' });
          const bw = (A.R - A.L) / nb; dens.forEach((v, k) => { ctx.fillStyle = T.cyan; ctx.fillRect(A.L + k * bw + 1, A.Y(Math.min(v, 1.1)), bw - 2, A.B - A.Y(Math.min(v, 1.1))); });
          const pts = []; for (let x = 0; x <= xm; x += .05) pts.push([A.X(x), A.Y(Math.exp(-x))]); polyline(ctx, pts, T.copper, 2.2);
        });
        const bars = painter(bc, ({ ctx, w, h: H }) => {
          if (!res) return; const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 3], y: [0, 1.05], xt: [], yt: [0, .25, .5, .75, 1], yf: v => pct(v, 0), yl: 'fidelity' });
          const bar = (i, v, col, lab, err) => { const x = A.X(i + .5), bw = (A.R - A.L) / 3 * .5; ctx.fillStyle = col; ctx.fillRect(x - bw / 2, A.Y(clamp(v, 0, 1.05)), bw, A.B - A.Y(clamp(v, 0, 1.05))); if (err) { ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, A.Y(clamp(v + err, 0, 1.05))); ctx.lineTo(x, A.Y(clamp(v - err, 0, 1.05))); ctx.stroke(); } txt(ctx, lab, x, A.B + 14, { font: '500 11px "JetBrains Mono",monospace' }); };
          bar(0, res.F, T.copper, 'true F'); bar(1, res.fx, T.cyan, 'normalized XEB', res.se); bar(2, res.raw, T.muted, 'raw 2ⁿ⟨p⟩ − 1');
        });
        const upd = () => {
          let m2 = 0; ideal.p.forEach(v => { m2 += (N * v) ** 2; }); m2 /= N;
          ro.innerHTML = `<span class="k">gates in the circuit </span>${ideal.g}<br><span class="k">⟨(2ⁿp)²⟩ </span>${num(m2, 2)} (Porter–Thomas predicts 2)<br>${res ? `<span class="k">true fidelity </span>${num(res.F, 3)} &nbsp; <span class="k">normalized XEB </span>${num(res.fx, 3)} ± ${num(res.se, 3)} &nbsp; <span class="k">raw </span>${num(res.raw, 3)}` : ''}`;
          hist.inv(); bars.inv();
        };
        body.append(h('div', { class: 'split even' }, hc, bc), h('div', { class: 'split even' },
          h('div', { class: 'stack' }, slider({ id: id('D'), label: 'Circuit depth (layers)', min: 1, max: 20, step: 1, value: D, fmt: String, on: v => { D = v; build(); sample(); } }),
            slider({ id: id('e'), label: 'Error per gate', min: 0, max: .02, step: .0005, value: e, fmt: v => pct(v, 2), on: v => { e = v; sample(); } }),
            slider({ id: id('s'), label: 'Shots', min: 2, max: 4.3, step: .1, value: Math.log10(shots), fmt: v => Math.round(10 ** v).toLocaleString(), on: v => { shots = Math.round(10 ** v); sample(); } })),
          h('div', { class: 'stack' }, h('div', { class: 'btns' }, btn('New random circuit', () => { build(); sample(); }, 'pri sm'), btn('Resample', sample, 'sm')), ro)));
        build(); sample();
      }
    }
  },
  take: ['Error per gate is one minus the average gate fidelity; process tomography is costly and contaminated by SPAM errors.',
    'Randomized benchmarking applies random Clifford sequences plus an inverse; the survival decays as A·pᵐ + B, with r = (1 − p)(d − 1)/d.',
    'SPAM errors change A and B but not the decay rate p, so RB isolates the gate error; interleaved RB targets a single gate.',
    'XEB, quantum volume and layer fidelity benchmark whole processors; averages can hide coherent and correlated errors.'],
  quiz: QZ([
    ['What does “error per gate” usually mean in benchmarking?', ['The probability that the gate is never applied', 'One minus the average gate fidelity over all pure input states', 'The measurement error rate', 'The T₁ time divided by the gate time'], 1, 'Average gate fidelity averages the overlap between noisy and ideal outputs over all pure inputs; the error per gate r is one minus that.'],
    ['Why is process tomography unreliable for measuring a 0.1% gate error?', ['It is too fast', 'SPAM errors of about 1% contaminate the reconstruction, and the cost grows exponentially', 'It only works for two-qubit gates', 'It requires error correction'], 1, 'Tomography folds preparation and measurement errors into the estimated process, which can swamp a small gate error, and needs exponentially many settings.'],
    ['What is appended to each random Clifford sequence in RB?', ['A measurement in the X basis', 'The Clifford that inverts the whole sequence', 'A T gate', 'Nothing'], 1, 'The inverse returns the ideal state to |0⟩. Because Cliffords form a group and are efficiently simulable, that inverse is a single, easily computed Clifford.'],
    ['What form does the average survival probability take in standard RB?', ['Linear in m', 'A·pᵐ + B, a single exponential decay', 'Oscillating in m', 'Constant'], 1, 'Twirling over the Clifford group turns the average noise into a depolarizing channel, which gives a single exponential decay in sequence length.'],
    ['How do SPAM errors affect an RB curve?', ['They change the decay rate p', 'They change A and B but not p', 'They make the curve oscillate', 'They have no effect at all'], 1, 'Preparation and measurement happen once per sequence, so they scale and offset the curve; the per-gate decay rate p is unaffected.'],
    ['For a single qubit, how is the error per Clifford related to the RB decay parameter p?', ['r = 1 − p', 'r = (1 − p)/2', 'r = p/2', 'r = 2(1 − p)'], 1, 'r = (1 − p)(d − 1)/d with d = 2, giving (1 − p)/2.'],
    ['How does interleaved RB estimate the error of a specific gate G?', ['By measuring G alone many times', 'By inserting G after each random Clifford and comparing the decay with the reference', 'By running G backwards', 'By tomography of G'], 1, 'The extra decay caused by G gives r_G ≈ (d − 1)(1 − p_G/p)/d.'],
    ['In cross-entropy benchmarking, what estimates the circuit fidelity?', ['The most frequent output', '2ⁿ times the average ideal probability of the sampled outputs, minus 1', 'The number of gates', 'The variance of the outputs'], 1, 'Ideal outputs are biased towards high-probability strings; noise flattens the distribution. For Porter–Thomas statistics, 2ⁿ⟨p_ideal(x)⟩ − 1 equals the fidelity of a global-depolarizing model.'],
    ['What distribution do the ideal output probabilities of deep random circuits follow?', ['Uniform', 'Porter–Thomas (exponential in 2ⁿp)', 'Gaussian', 'Poisson'], 1, 'Random states have amplitudes like complex Gaussian variables, so scaled probabilities 2ⁿp are exponentially distributed, the Porter–Thomas law.'],
    ['Why can RB underestimate the impact of coherent errors in some circuits?', ['RB cannot detect any errors', 'RB averages them into depolarizing noise, but repeated coherent errors can add in amplitude, growing like √r per gate in the worst case', 'Coherent errors only occur in measurement', 'They are always corrected automatically'], 1, 'Random Cliffords scramble the direction of a coherent over-rotation, so RB sees an average. In structured circuits the rotations can line up and accumulate much faster.']
  ])
});

/* ---------------- Error mitigation ---------------- */
LESSONS.push({
  id: 'mitigation', n: 17.6, stage: ST, minutes: 16, title: 'Error mitigation: less wrong without correction',
  lede: 'Before full error correction is available, extra runs and careful arithmetic can remove much of the bias that noise puts into measured averages. The price is paid in samples, and it grows quickly.',
  html: `
<h2>Mitigation versus correction</h2>
<p>Quantum error correction ([[L:qec]]) protects a computation as it runs, at the price of many physical qubits per logical one. <strong>Error mitigation</strong> uses no extra qubits. Instead it runs more, or slightly different, circuits and post-processes the results to estimate what a noiseless device would have reported for an expectation value ${m('⟨O⟩')}. It cannot repair individual output bit strings, only averages, and its sampling cost grows exponentially with the total amount of noise in the circuit, roughly ${m('λ')} = error per gate × number of gates. It is useful while ${m('λ')} is of order one.</p>
<h2>Zero-noise extrapolation</h2>
<p>If you cannot turn the noise down, turn it up in controlled steps and extrapolate back (Temme, Bravyi and Gambetta; Li and Benjamin, 2017). Two common ways to amplify noise by a factor ${m('c')}:</p>
<ul>
<li><strong>Pulse stretching</strong>: run every pulse ${m('c')} times longer at proportionally lower amplitude, so the same rotation picks up ${m('c')} times more decoherence.</li>
<li><strong>Gate folding</strong>: replace a gate ${m('G')} by ${m('G G<sup>†</sup> G')}, which is the same operation with three times the noise, giving ${m('c = 1, 3, 5, …')}.</li>
</ul>
<p>Fit the measured values ${m('E(c)')} and evaluate the fit at ${m('c = 0')}. With three points at ${m('c = 1, 2, 3')}, <strong>Richardson extrapolation</strong> fits a parabola, giving ${m('E(0) ≈ 3E(1) − 3E(2) + E(3)')}. The coefficients are large, so statistical noise in the measured points is amplified: removing bias costs variance.</p>
${LAB('zne')}
<h2>Probabilistic error cancellation</h2>
<p>If the noise of each layer is known precisely, its inverse can be written as a combination of implementable operations with some negative weights, a <strong>quasi-probability distribution</strong>. Sample circuits from it, multiply each result by the sign of its weight, and average: the result is an unbiased estimate of the noiseless value. The catch is the sampling overhead ${m('γ²')}, where ${m('γ')} grows like ${m('e<sup>2λ</sup>')} for Pauli noise of total strength ${m('λ')}. Learning the noise accurately, for example as a sparse Pauli–Lindblad model, is a large part of the work.</p>
<h2>Readout error mitigation</h2>
<p>Measurement errors are often the largest single error source, and the simplest to fix on average. Prepare each basis state, record how often it is read as each outcome, and assemble the <strong>confusion matrix</strong> ${m('A')}, where ${m('A<sub>ij</sub>')} is the probability of reading ${m('i')} when ${m('j')} was prepared. Measured frequencies satisfy ${m('p<sub>meas</sub> = A p<sub>true</sub>')}, so applying ${m('A<sup>−1</sup>')} undoes the bias. For many qubits, a tensor product of per-qubit matrices keeps this tractable.</p>
${LAB('meas')}
<h2>More tools</h2>
<ul>
<li><strong>Symmetry verification</strong>: discard shots that violate a known conservation law, such as particle number in chemistry.</li>
<li><strong>Virtual distillation</strong>: use several copies of the state to estimate ${m('Tr(ρᴹO)/Tr(ρᴹ)')}, which suppresses errors exponentially in ${m('M')}.</li>
<li><strong>Pauli twirling and dynamical decoupling</strong>: randomize coherent errors into stochastic ones ([[L:randcomp]]) that extrapolation handles better, and refocus idle qubits with pulse sequences.</li>
</ul>
${NOTE('The utility debate', `<p>In 2023 an IBM team used zero-noise extrapolation on a 127-qubit processor to estimate magnetizations in a kicked Ising model, beyond brute-force classical simulation. Within weeks several groups reproduced the results classically with tensor networks and other approximations that exploit the problem’s structure. The episode showed both how far mitigation can reach and how hard it is to stay ahead of clever classical methods. Mitigation is a bridge to error correction, and is expected to be used on top of it too.</p>`)}
`,
  labs: {
    zne: {
      title: 'Zero-noise extrapolation',
      cap: 'The noisy expectation value decays as the noise is scaled up (dashed curve, unknown to the experimenter). Each measured point has shot noise, shown as an error bar. Three fits extrapolate back to zero noise. The table repeats the whole experiment 300 times to show each method’s typical bias and spread.',
      build(body, id) {
        let lam = .4, shots = 4000, sc = [1, 2, 3], pts = null; const O0 = .8;
        const cv = canvas('', 'height:260px'), ro = h('div', { class: 'tbl-wrap' }), ro2 = h('div', { class: 'chipline' });
        const E = c2 => O0 * Math.exp(-lam * c2);
        const meas = () => sc.map(c2 => { const e = E(c2), pp = (1 + e) / 2; return [c2, 2 * binom(shots, pp) / shots - 1, Math.sqrt((1 - e * e) / shots)]; });
        const fits = P => {
          const xs = P.map(p2 => p2[0]), ys = P.map(p2 => p2[1]), n = xs.length, mx = xs.reduce((s, x) => s + x, 0) / n, my = ys.reduce((s, y) => s + y, 0) / n;
          let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; } const b = sxy / sxx, lin = c2 => my + b * (c2 - mx);
          const rich = c2 => { let s = 0; for (let i = 0; i < n; i++) { let L = 1; for (let j = 0; j < n; j++) if (j !== i) L *= (c2 - xs[j]) / (xs[i] - xs[j]); s += ys[i] * L; } return s; };
          let ex = null; if (ys.every(y => y > 0)) { const ly = ys.map(Math.log), mly = ly.reduce((s, y) => s + y, 0) / n; let s2 = 0; for (let i = 0; i < n; i++) s2 += (xs[i] - mx) * (ly[i] - mly); const b2 = s2 / sxx; ex = c2 => Math.exp(mly + b2 * (c2 - mx)); }
          return { lin, rich, ex };
        };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 5.5], y: [0, 1], xt: [0, 1, 2, 3, 4, 5], yt: [0, .25, .5, .75, 1], yf: v => num(v, 2), xl: 'noise scale factor c', yl: '⟨O⟩' });
          const tc = []; for (let x = 0; x <= 5.5; x += .05) tc.push([A.X(x), A.Y(E(x))]); polyline(ctx, tc, T.muted, 1.4, [5, 4]);
          const F = fits(pts), cmax = Math.max(...sc) + .3;
          const ln = (f, col, dash) => { if (!f) return; const q = []; for (let x = 0; x <= cmax; x += .05) q.push([A.X(x), A.Y(clamp(f(x), 0, 1))]); polyline(ctx, q, col, 2, dash); dot(ctx, A.X(0), A.Y(clamp(f(0), 0, 1)), 5, col, T.surface); };
          ln(F.lin, T.ink, [2, 3]); ln(F.rich, T.copper); ln(F.ex, T.cyan);
          dot(ctx, A.X(0), A.Y(O0), 6, T.good); txt(ctx, 'ideal', A.X(0) + 10, A.Y(O0) - 10, { align: 'left', font: '600 11px "JetBrains Mono",monospace', color: T.good });
          for (const [x, y, s] of pts) { ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(A.X(x), A.Y(y + 2 * s)); ctx.lineTo(A.X(x), A.Y(y - 2 * s)); ctx.stroke(); dot(ctx, A.X(x), A.Y(y), 4.5, T.ink, T.surface); }
        });
        const stats = () => {
          const acc = { lin: [], rich: [], ex: [] };
          for (let r = 0; r < 300; r++) { const F = fits(meas()); acc.lin.push(F.lin(0)); acc.rich.push(F.rich(0)); if (F.ex) acc.ex.push(F.ex(0)); }
          const st = a => { const m2 = a.reduce((s, x) => s + x, 0) / a.length, sd = Math.sqrt(a.reduce((s, x) => s + (x - m2) ** 2, 0) / a.length); return [m2 - O0, sd]; };
          const row = (nm, a, col) => { const [b, sd] = st(a); return `<tr><td style="color:${col}">${nm}</td><td>${num(b, 3)}</td><td>${num(sd, 3)}</td><td>${num(Math.hypot(b, sd), 3)}</td></tr>`; };
          const F = fits(pts);
          ro.innerHTML = `<table class="tbl"><thead><tr><th>estimate of the ideal ${num(O0, 2)}</th><th>bias</th><th>spread</th><th>total error</th></tr></thead><tbody>
            <tr><td>No mitigation (c = 1)</td><td>${num(E(1) - O0, 3)}</td><td>${num(Math.sqrt((1 - E(1) ** 2) / shots), 3)}</td><td>${num(Math.hypot(E(1) - O0, Math.sqrt((1 - E(1) ** 2) / shots)), 3)}</td></tr>
            ${row('Linear fit', acc.lin, 'var(--ink)')}${row('Richardson', acc.rich, 'var(--copper)')}${acc.ex.length ? row('Exponential fit', acc.ex, 'var(--cyan)') : ''}</tbody></table>`;
          ro2.innerHTML = `<span>this run: linear <b>${num(F.lin(0), 3)}</b></span><span>Richardson <b>${num(F.rich(0), 3)}</b></span><span>exponential <b>${F.ex ? num(F.ex(0), 3) : '—'}</b></span>`;
        };
        const go = () => { pts = meas(); stats(); p.inv(); };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['true decay', 'var(--muted)', 1], ['linear', 'var(--ink)', 1], ['Richardson', 'var(--copper)'], ['exponential', 'var(--cyan)']]), ro2),
          h('div', { class: 'stack' },
            slider({ id: id('l'), label: 'Total circuit noise λ', min: .05, max: 1.5, step: .05, value: lam, fmt: v => num(v, 2), on: v => { lam = v; go(); } }),
            slider({ id: id('s'), label: 'Shots per point', min: 2.5, max: 5, step: .1, value: Math.log10(shots), fmt: v => Math.round(10 ** v).toLocaleString(), on: v => { shots = Math.round(10 ** v); go(); } }),
            field('Noise scale factors', seg([{ v: '123', label: '1, 2, 3' }, { v: '135', label: '1, 3, 5 (folding)' }], '123', v => { sc = v === '123' ? [1, 2, 3] : [1, 3, 5]; go(); }, 'Scale factors')),
            h('div', { class: 'btns' }, btn('Measure again', go, 'pri sm')))), ro);
        go();
      }
    },
    meas: {
      title: 'Undoing readout errors',
      cap: 'A three-qubit GHZ state should give only 000 and 111. Each qubit is misread with the probabilities you set. Bars show the true distribution, the raw measured one and the mitigated one after inverting the confusion matrix. With few shots the inversion can produce small negative values, which are clipped.',
      build(body, id) {
        let e0 = .03, e1 = .08, shots = 2000;
        const cv = canvas('', 'height:230px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const truth = [.5, 0, 0, 0, 0, 0, 0, .5]; let meas = null, mit = null;
        const run = () => {
          const cnt = new Array(8).fill(0);
          for (let k = 0; k < shots; k++) { let x = Math.random() < .5 ? 0 : 7, y = 0; for (let b = 0; b < 3; b++) { const bit = (x >> b) & 1, flip = Math.random() < (bit ? e1 : e0); y |= (bit ^ (flip ? 1 : 0)) << b; } cnt[y]++; }
          meas = cnt.map(v => v / shots);
          const det = 1 - e0 - e1, Ainv = [[(1 - e1) / det, -e1 / det], [-e0 / det, (1 - e0) / det]];
          let v = meas.slice();
          for (let b = 0; b < 3; b++) { const nv = new Array(8).fill(0); for (let y = 0; y < 8; y++) { const yb = (y >> b) & 1; for (const xb of [0, 1]) { const x = (y & ~(1 << b)) | (xb << b); nv[x] += Ainv[xb][yb] * v[y]; } } v = nv; }
          const neg = v.some(x => x < -1e-9); v = v.map(x => Math.max(0, x)); const z = v.reduce((s, x) => s + x, 0); mit = { v: v.map(x => x / z), neg };
          upd();
        };
        const fid = q => q.reduce((s, x, i) => s + Math.sqrt(x * truth[i]), 0) ** 2;
        const zz = q => q.reduce((s, x, i) => s + x * ((((i >> 2) ^ (i >> 1)) & 1) ? -1 : 1), 0);
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 8], y: [0, .6], xt: [], yt: [0, .25, .5], yf: v => pct(v, 0), yl: 'probability' }), bw = (A.R - A.L) / 8;
          for (let i = 0; i < 8; i++) {
            const x0 = A.L + i * bw; [[truth[i], T.muted], [meas[i], T.copper], [mit.v[i], T.cyan]].forEach(([v, col], k) => { ctx.fillStyle = col; ctx.fillRect(x0 + bw * (.12 + k * .26), A.Y(Math.min(v, .6)), bw * .24, A.B - A.Y(Math.min(v, .6))); });
            txt(ctx, i.toString(2).padStart(3, '0'), x0 + bw / 2, A.B + 12, { font: '500 11px "JetBrains Mono",monospace', color: T.ink });
          }
        });
        const upd = () => {
          ro.innerHTML = `<span class="k">fidelity with the truth   </span>raw ${num(fid(meas), 3)} → mitigated ${num(fid(mit.v), 3)}<br><span class="k">⟨Z₀Z₁⟩ (ideal 1)          </span>raw ${num(zz(meas), 3)} → mitigated ${num(zz(mit.v), 3)}${mit.neg ? '<br><span class="k">note </span>negative quasi-probabilities were clipped' : ''}`;
          p.inv();
        };
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, legendRow([['true', 'var(--muted)'], ['measured', 'var(--copper)'], ['mitigated', 'var(--cyan)']])),
          h('div', { class: 'stack' },
            slider({ id: id('e0'), label: 'P(read 1 | qubit is 0)', min: 0, max: .2, step: .005, value: e0, fmt: v => pct(v, 1), on: v => { e0 = v; run(); } }),
            slider({ id: id('e1'), label: 'P(read 0 | qubit is 1)', min: 0, max: .25, step: .005, value: e1, fmt: v => pct(v, 1), on: v => { e1 = v; run(); } }),
            slider({ id: id('s'), label: 'Shots', min: 2, max: 5, step: .1, value: Math.log10(shots), fmt: v => Math.round(10 ** v).toLocaleString(), on: v => { shots = Math.round(10 ** v); run(); } }),
            h('div', { class: 'btns' }, btn('Measure again', run, 'pri sm')), ro)));
        run();
      }
    }
  },
  take: ['Mitigation estimates noiseless expectation values with extra runs and post-processing, not extra qubits; its cost grows exponentially with total noise λ.',
    'Zero-noise extrapolation amplifies noise (pulse stretching, gate folding G G† G) and extrapolates to zero, trading bias for variance.',
    'Probabilistic error cancellation inverts a learned noise model with a quasi-probability distribution; unbiased, with overhead γ² ≈ e^(4λ).',
    'Readout mitigation inverts a confusion matrix; symmetry checks, virtual distillation and twirling complete the toolbox.'],
  quiz: QZ([
    ['What does error mitigation fix that error correction does not, and vice versa?', ['Mitigation fixes individual shots; correction fixes averages', 'Mitigation removes bias from expectation values without extra qubits; correction protects the computation itself at large qubit overhead', 'They are the same', 'Mitigation only works for one qubit'], 1, 'Mitigation post-processes many runs to estimate averages; it cannot clean a single output. Correction detects and fixes errors during the computation.'],
    ['How does gate folding amplify noise by a factor of 3?', ['By running the circuit three times', 'By replacing G with G G† G, which is logically G but has three times the noise', 'By lowering the temperature', 'By adding three idle qubits'], 1, 'G G† G = G in the ideal case, but each gate contributes its noise, roughly tripling the error of that layer.'],
    ['With measurements at noise scales 1, 2, 3, what is the Richardson estimate of the zero-noise value?', ['E(1)', '3E(1) − 3E(2) + E(3)', '(E(1) + E(2) + E(3))/3', '2E(1) − E(2)'], 1, 'Fitting a quadratic through three equally spaced points and evaluating at 0 gives the weights 3, −3, 1.'],
    ['Why does extrapolation increase statistical error?', ['It doesn’t', 'The extrapolation weights are large (like 3 and −3), amplifying the shot noise of each measured point', 'Higher noise scales use fewer shots', 'Because of measurement errors only'], 1, 'Variance adds with the squared weights: 9 + 9 + 1 = 19 times a single point’s variance for Richardson with three points.'],
    ['Why can a linear fit be biased when the true decay is exponential?', ['Linear fits are always unbiased', 'A straight line through points on a convex curve undershoots the value at c = 0', 'Exponentials cannot be fitted', 'Because the noise is quantum'], 1, 'An exponential decay is convex, so the secant line through measured points lies below the curve near c = 0, underestimating the ideal value.'],
    ['What does probabilistic error cancellation require?', ['A noiseless reference device', 'An accurate model of the noise, to write its inverse as a quasi-probability distribution', 'Error-correcting codes', 'Only readout calibration'], 1, 'The inverse noise map has negative weights; sampling it with signs yields an unbiased estimate, but only if the noise model is accurate.'],
    ['How does the sampling overhead of PEC scale with total noise strength λ?', ['Linearly', 'Exponentially, roughly e^(4λ)', 'It is constant', 'Logarithmically'], 1, 'Each layer’s inverse has norm γ_layer slightly above 1, and these multiply: γ ≈ e^(2λ), with sample overhead γ².'],
    ['In readout mitigation, what does the confusion matrix entry A_ij represent?', ['The gate error between qubits i and j', 'The probability of reading outcome i when state j was prepared', 'The correlation between two measurements', 'The T₁ of qubit i'], 1, 'Calibrating with known prepared states gives A; measured frequencies are A times the true distribution, so A⁻¹ undoes the bias on average.'],
    ['Why can readout mitigation produce negative “probabilities”?', ['A bug', 'Applying A⁻¹ to noisy finite-shot frequencies can give small negative entries, which must be clipped or constrained', 'Quantum states have negative probabilities', 'Because of entanglement'], 1, 'A⁻¹ has negative entries, so statistical fluctuations can push some estimates below zero. Constrained least squares or clipping fixes this.'],
    ['What did the 2023 utility experiment and its aftermath illustrate?', ['That mitigation is useless', 'That mitigation can reach beyond brute-force simulation, but structured problems can still be matched by clever classical methods', 'That error correction is solved', 'That 127 qubits are classically impossible to simulate in all cases'], 1, 'The ZNE results were striking, yet tensor-network and other approximate classical methods soon reproduced them, showing the difficulty of claiming advantage.']
  ])
});

/* ---------------- Dispersive readout ---------------- */
LESSONS.push({
  id: 'readout', n: 19.5, stage: ST, minutes: 15, title: 'Reading out a superconducting qubit',
  lede: 'A superconducting qubit is measured by listening to a microwave resonator whose pitch depends on the qubit’s state. Every shot is a point in a plane, and the art is telling two fuzzy clouds apart quickly.',
  html: `
<h2>Listening to a resonator</h2>
<p>A transmon ([[L:hardware]]) is coupled to a microwave resonator whose frequency is detuned from the qubit’s by much more than the coupling strength. In this <strong>dispersive regime</strong> the two exchange no energy, but each shifts the other’s frequency. The resonator rings at ${m('ω<sub>r</sub> + χ')} if the qubit is in ${m('|0⟩')} and at ${m('ω<sub>r</sub> − χ')} if it is in ${m('|1⟩')}, where the <strong>dispersive shift</strong> ${m('χ')} is a few hundred kilohertz to a few megahertz.</p>
<p>To measure, send a short microwave tone near ${m('ω<sub>r</sub>')} through the resonator and record what comes out. The transmitted signal’s amplitude and phase depend on which frequency the resonator has, and so on the qubit state. The qubit is not driven at its own frequency and, ideally, its Z value is unchanged by the measurement: a <strong>quantum non-demolition</strong> measurement, which can be repeated with the same answer.</p>
${LAB('resp')}
<h2>From microwaves to bits</h2>
<p>The returning signal carries only a handful of photons. It is amplified first at the mixing chamber by a near-quantum-limited <strong>parametric amplifier</strong> (a Josephson parametric amplifier or a travelling-wave parametric amplifier), then at 4 K by a transistor amplifier, then at room temperature. The electronics compare it with a reference tone and integrate it over a time ${m('τ')}, producing two numbers, the in-phase (I) and quadrature (Q) components. Each shot is a point in the <strong>IQ plane</strong>. Repeated shots from ${m('|0⟩')} and ${m('|1⟩')} form two Gaussian clouds, blurred by amplifier noise, and a threshold line between them turns each point into a bit.</p>
<h2>Speed versus accuracy</h2>
<p>Integrating longer averages away more noise: the separation between the clouds measured in units of their width grows like ${m('√τ')}. But the qubit can relax during the measurement. A shot that starts in ${m('|1⟩')} and decays halfway through lands between the clouds, and if it decays early it is read as 0. With ${m('T₁')} in the tens to hundreds of microseconds and readout taking a few hundred nanoseconds to a microsecond, the best compromise typically gives <strong>assignment fidelities</strong> of 98 to 99.5%.</p>
${LAB('iq')}
<h2>Engineering details that matter</h2>
<ul>
<li><strong>Purcell filters.</strong> The qubit can leak energy through its resonator into the output line. A filter that passes the resonator frequency but blocks the qubit’s keeps ${m('T₁')} high while allowing fast readout.</li>
<li><strong>Photon number.</strong> More probe photons separate the clouds faster, but too many cause measurement-induced transitions and dephase neighbours.</li>
<li><strong>Multiplexing.</strong> Each qubit gets a resonator at a different frequency on a shared feed line, so one amplifier chain reads many qubits at once.</li>
<li><strong>Mid-circuit measurement and reset.</strong> Error correction reads out ancillas every cycle, about a microsecond, without disturbing data qubits, and resets them for reuse, often by measuring and flipping those found in ${m('|1⟩')} (active reset).</li>
</ul>
${NOTE('Other platforms', `<p>Trapped ions and neutral atoms are read by <strong>state-dependent fluorescence</strong>: a laser makes one state scatter many photons and leaves the other dark, so a camera or photon counter sees bright or dark. Spin qubits in silicon use <strong>spin-to-charge conversion</strong>: only one spin state can tunnel onto a nearby reservoir, and a charge sensor detects the move. In every case the physics differs but the task is the same: separate two noisy signal distributions quickly and reliably.</p>`)}
`,
  labs: {
    resp: {
      title: 'Resonator response',
      cap: 'Left: transmitted amplitude across frequency for the qubit in |0⟩ (blue) and |1⟩ (copper); the dashed line is the probe frequency. Right: the same responses in the IQ plane, where each resonance traces a circle; the dots are the two signals at the probe frequency. Their distance is what readout must detect. It is largest when 2χ is about equal to the linewidth κ.',
      build(body, id) {
        let chi = 1, kap = 2, fp = 0;
        const fc = canvas('', 'height:230px'), ic = canvas('sq', 'max-width:270px;margin:0 auto'), ro = h('div', { class: 'chipline' });
        const S = (f, f0) => { const x = 2 * (f - f0) / kap, d = 1 + x * x; return [1 - .9 / d, .9 * x / d]; };
        const S0 = f => S(f, chi), S1 = f => S(f, -chi);
        const fq = painter(fc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-8, 8], y: [0, 1.05], xt: [-8, -4, 0, 4, 8], yt: [0, .5, 1], yf: v => num(v, 1), xl: 'probe frequency − ω_r (MHz)', yl: '|S₂₁|' });
          for (const [f, col] of [[S0, T.cyan], [S1, T.copper]]) { const pts = []; for (let x = -8; x <= 8; x += .04) { const s = f(x); pts.push([A.X(x), A.Y(Math.hypot(s[0], s[1]))]); } polyline(ctx, pts, col, 2.3); }
          polyline(ctx, [[A.X(fp), A.T], [A.X(fp), A.B]], T.ink, 1.3, [4, 3]);
        });
        const iq = painter(ic, ({ ctx, w, h: H }) => {
          const T = Theme.get(), R = Math.min(w, H) * .42, cx = w / 2 - R * .1, cy = H / 2, X = v => cx + (v - .55) * R * 1.9, Y = v => cy - v * R * 1.9;
          ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(0), cy); ctx.lineTo(X(1.05), cy); ctx.moveTo(X(.55), Y(-.5)); ctx.lineTo(X(.55), Y(.5)); ctx.stroke();
          txt(ctx, 'I', X(1.05), cy + 12, { font: '600 11px "JetBrains Mono",monospace' }); txt(ctx, 'Q', X(.55) + 10, Y(.5), { font: '600 11px "JetBrains Mono",monospace' });
          for (const [f, col] of [[S0, T.cyan], [S1, T.copper]]) { const pts = []; for (let x = -40; x <= 40; x += .1) { const s = f(x); pts.push([X(s[0]), Y(s[1])]); } ctx.globalAlpha = .5; polyline(ctx, pts, col, 1.6); ctx.globalAlpha = 1; }
          const a = S0(fp), b = S1(fp); ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); ctx.stroke(); ctx.setLineDash([]);
          dot(ctx, X(a[0]), Y(a[1]), 6, T.cyan, T.surface); dot(ctx, X(b[0]), Y(b[1]), 6, T.copper, T.surface);
        });
        const sep = f => { const a = S0(f), b = S1(f); return Math.hypot(a[0] - b[0], a[1] - b[1]); };
        const upd = () => { let best = -8, bs = 0; for (let x = -8; x <= 8; x += .02) if (sep(x) > bs) { bs = sep(x); best = x; } ro.innerHTML = `<span>separation now <b>${num(sep(fp), 3)}</b></span><span>best probe <b>${num(best, 2)} MHz</b> → <b>${num(bs, 3)}</b></span><span>2χ/κ <b>${num(2 * chi / kap, 2)}</b></span>`; fq.inv(); iq.inv(); };
        body.append(h('div', { class: 'split' }, fc, ic), h('div', { class: 'split even' },
          h('div', { class: 'stack' }, slider({ id: id('c'), label: 'Dispersive shift χ/2π', min: .1, max: 3, step: .05, value: chi, fmt: v => num(v, 2) + ' MHz', on: v => { chi = v; upd(); } }),
            slider({ id: id('k'), label: 'Resonator linewidth κ/2π', min: .5, max: 6, step: .1, value: kap, fmt: v => num(v, 1) + ' MHz', on: v => { kap = v; upd(); } })),
          h('div', { class: 'stack' }, slider({ id: id('f'), label: 'Probe frequency', min: -8, max: 8, step: .05, value: fp, fmt: v => num(v, 2) + ' MHz', on: v => { fp = v; upd(); } }), ro)));
        upd();
      }
    },
    iq: {
      title: 'Single shots in the IQ plane',
      cap: 'Each dot is one integrated measurement: blue for qubits prepared in |0⟩, copper for |1⟩. Shots that relaxed during the measurement streak towards the |0⟩ cloud. The histogram projects the shots onto the I axis; the vertical line is the threshold (drag it, or press Optimal). The chart scans the integration time with the best threshold at each point.',
      build(body, id) {
        let tau = 400, T1 = 50, thr = 0, pts = null;
        const NS = 900, tref = 25, cv = canvas('', 'height:240px'), hc = canvas('', 'height:120px'), fc = canvas('', 'height:220px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const sig = t => Math.sqrt(tref / t);
        const gen = () => { const s = sig(tau), A0 = [], A1 = []; for (let k = 0; k < NS; k++) { A0.push([-.5 + s * randn(), s * randn()]); const td = -T1 * 1000 * Math.log(Math.random()), fr = td >= tau ? 1 : td / tau; A1.push([-.5 + fr + s * randn(), s * randn()]); } pts = { A0, A1 }; };
        const err = (t, th) => { const s = sig(t), p10 = 1 - normCdf((th + .5) / s); const pd = Math.exp(-t / (T1 * 1000)); let p01 = pd * normCdf((th - .5) / s); const M = 60; for (let k = 0; k < M; k++) { const td = (k + .5) / M * t, wgt = Math.exp(-td / (T1 * 1000)) / (T1 * 1000) * t / M; p01 += wgt * normCdf((th - (-.5 + td / t)) / s); } return { p10, p01 }; };
        const bestThr = t => { let b = 0, be = 9; for (let k = 0; k <= 80; k++) { const th = -.4 + .8 * k / 80, e = err(t, th); if (e.p10 + e.p01 < be) { be = e.p10 + e.p01; b = th; } } return b; };
        let G = null;
        const sc = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-1.3, 1.3], y: [-.8, .8], xt: [-1, 0, 1], yt: [-.5, 0, .5], yf: v => num(v, 1), xl: 'I', yl: 'Q' }); G = A;
          ctx.globalAlpha = .45; for (const [x, y] of pts.A0) { ctx.fillStyle = T.cyan; ctx.fillRect(A.X(x) - 1, A.Y(y) - 1, 2.2, 2.2); } for (const [x, y] of pts.A1) { ctx.fillStyle = T.copper; ctx.fillRect(A.X(x) - 1, A.Y(y) - 1, 2.2, 2.2); } ctx.globalAlpha = 1;
          polyline(ctx, [[A.X(thr), A.T], [A.X(thr), A.B]], T.ink, 2);
          txt(ctx, 'read 0', A.X(thr) - 8, A.T + 8, { align: 'right', font: '600 11px "JetBrains Mono",monospace', color: T.ink }); txt(ctx, 'read 1', A.X(thr) + 8, A.T + 8, { align: 'left', font: '600 11px "JetBrains Mono",monospace', color: T.ink });
        });
        const hs = painter(hc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [-1.3, 1.3], y: [0, 1], xt: [-1, 0, 1], yt: [], xl: 'I (projected)', pad: { t: 6, b: 28 } }), nb = 60, b0 = new Array(nb).fill(0), b1 = new Array(nb).fill(0);
          const bin = x => Math.floor((x + 1.3) / 2.6 * nb); pts.A0.forEach(([x]) => { const k = bin(x); if (k >= 0 && k < nb) b0[k]++; }); pts.A1.forEach(([x]) => { const k = bin(x); if (k >= 0 && k < nb) b1[k]++; });
          const mx = Math.max(...b0, ...b1), bw = (A.R - A.L) / nb;
          for (let k = 0; k < nb; k++) { ctx.fillStyle = rgba(T.cyan, .6); ctx.fillRect(A.L + k * bw, A.Y(b0[k] / mx), bw - .5, A.B - A.Y(b0[k] / mx)); ctx.fillStyle = rgba(T.copper, .6); ctx.fillRect(A.L + k * bw, A.Y(b1[k] / mx), bw - .5, A.B - A.Y(b1[k] / mx)); }
          polyline(ctx, [[A.X(thr), A.T], [A.X(thr), A.B]], T.ink, 2);
        });
        const fs = painter(fc, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [40, 4000], y: [.9, 1], xlog: true, xt: [50, 100, 300, 1000, 3000], yt: [.9, .95, 1], yf: v => pct(v, 0), xl: 'integration time τ (ns)', yl: 'assignment fidelity' });
          const ptsF = []; let bx = 0, bf = 0; for (let e = Math.log10(40); e <= Math.log10(4000); e += .03) { const t = 10 ** e, th = bestThr(t), r = err(t, th), F = 1 - (r.p10 + r.p01) / 2; ptsF.push([A.X(t), A.Y(clamp(F, .9, 1))]); if (F > bf) { bf = F; bx = t; } }
          polyline(ctx, ptsF, T.cyan, 2.3); dot(ctx, A.X(bx), A.Y(bf), 5, T.good); txt(ctx, `best ${num(bx, 0)} ns`, A.X(bx), A.Y(bf) - 12, { font: '600 11px "JetBrains Mono",monospace', color: T.good });
          const r = err(tau, thr); dot(ctx, A.X(tau), A.Y(clamp(1 - (r.p10 + r.p01) / 2, .9, 1)), 6, T.copper, T.surface);
        });
        const upd = (regen) => {
          if (regen) gen();
          const r = err(tau, thr), emp10 = pts.A0.filter(([x]) => x > thr).length / NS, emp01 = pts.A1.filter(([x]) => x <= thr).length / NS;
          ro.innerHTML = `<span class="k">P(read 1 | prepared 0) </span>${pct(r.p10, 2)} &nbsp;(these shots ${pct(emp10, 1)})<br><span class="k">P(read 0 | prepared 1) </span>${pct(r.p01, 2)} &nbsp;(these shots ${pct(emp01, 1)})<br><span class="k">assignment fidelity    </span>${pct(1 - (r.p10 + r.p01) / 2, 2)}<br><span class="k">decays during readout  </span>${pct(1 - Math.exp(-tau / (T1 * 1000)), 2)}`;
          sc.inv(); hs.inv(); fs.inv();
        };
        dragHandles(cv, () => 't', (k, x) => { if (!G) return; thr = clamp(-1.3 + (x - G.L) / (G.R - G.L) * 2.6, -1, 1); upd(false); });
        body.append(h('div', { class: 'split' }, h('div', { class: 'stack' }, cv, hc), h('div', { class: 'stack' }, fc,
          slider({ id: id('t'), label: 'Integration time τ', min: 40, max: 3000, step: 10, value: tau, fmt: v => v + ' ns', on: v => { tau = v; upd(true); } }),
          slider({ id: id('T1'), label: 'Qubit T₁', min: 5, max: 200, step: 5, value: T1, fmt: v => v + ' µs', on: v => { T1 = v; upd(true); } }),
          h('div', { class: 'btns' }, btn('Optimal threshold', () => { thr = bestThr(tau); upd(false); }, 'pri sm'), btn('New shots', () => upd(true), 'sm')), ro)));
        gen(); thr = bestThr(tau); upd(false);
      }
    }
  },
  take: ['In the dispersive regime the resonator frequency shifts by ±χ with the qubit state, so a probe tone’s amplitude and phase reveal it without exchanging energy.',
    'Signals are amplified by near-quantum-limited parametric amplifiers, demodulated into I and Q, and integrated; each shot is a point in the IQ plane.',
    'Longer integration separates the clouds like √τ, but T₁ decay during readout smears |1⟩ towards |0⟩, giving an optimal readout time.',
    'Purcell filters, multiplexing and active reset make fast, repeated mid-circuit measurement possible for error correction.'],
  quiz: QZ([
    ['In dispersive readout, what depends on the qubit state?', ['The qubit’s T₁', 'The resonator frequency, shifted by ±χ', 'The fridge temperature', 'The number of qubits'], 1, 'The qubit–resonator coupling shifts the resonator frequency up or down by the dispersive shift χ depending on whether the qubit is in |0⟩ or |1⟩.'],
    ['Why is dispersive readout called quantum non-demolition?', ['It destroys the qubit', 'Ideally it does not change the measured Z value, so repeating it gives the same result', 'It does not use microwaves', 'It works without amplifiers'], 1, 'The probe does not drive qubit transitions; the measured observable commutes with the interaction, so a repeat measurement agrees with the first.'],
    ['What are I and Q?', ['Two qubits', 'The in-phase and quadrature components of the demodulated signal', 'Input and output ports', 'Current and charge'], 1, 'Comparing the returning signal with a reference tone gives two numbers, the components in phase and 90° out of phase, which form the IQ plane.'],
    ['Why is the first amplifier a parametric amplifier at the mixing chamber?', ['It is cheaper', 'It adds close to the minimum noise allowed by quantum mechanics, which matters because the signal has only a few photons', 'It cools the qubit', 'It measures T₁'], 1, 'The first amplifier sets the noise floor of the whole chain. Josephson parametric and travelling-wave amplifiers approach the quantum limit.'],
    ['How does the separation between IQ clouds (in units of their width) scale with integration time τ?', ['Linearly', 'Like √τ', 'Like τ²', 'It does not change'], 1, 'Signal accumulates linearly in τ while white noise grows like √τ, so the signal-to-noise ratio grows like √τ.'],
    ['Why can’t readout simply be made very long?', ['Electronics cannot integrate long', 'The qubit may relax from |1⟩ to |0⟩ during the measurement, causing errors', 'Long readout heats the fridge', 'The resonator stops ringing'], 1, 'With T₁ decay, a longer readout gives more time for |1⟩ to decay, which pulls shots towards the |0⟩ cloud. The best fidelity comes at an intermediate τ.'],
    ['What does a Purcell filter prevent?', ['Readout crosstalk', 'The qubit decaying through its resonator into the output line', 'Thermal photons in the resonator', 'Leakage to |2⟩'], 1, 'The resonator opens a decay channel for the qubit (the Purcell effect). A filter blocks the qubit frequency while passing the resonator’s.'],
    ['How do processors read many qubits with few amplifiers?', ['By measuring them one at a time', 'Frequency multiplexing: each qubit’s resonator has a different frequency on a shared line', 'By using optical fibres', 'They do not'], 1, 'Distinct resonator frequencies let one feed line and one amplifier chain carry many readout signals at once.'],
    ['When is the resonator response separation largest for a fixed χ?', ['When κ is as small as possible', 'When the linewidth κ is about 2χ and the probe sits between the two resonances', 'When the probe is far off resonance', 'When χ = 0'], 1, 'If κ ≪ 2χ the probe sits off both narrow resonances; if κ ≫ 2χ the responses overlap. The phase difference is largest around κ ≈ 2χ, probing midway.'],
    ['How are trapped-ion qubits typically read out?', ['With microwave resonators', 'By state-dependent fluorescence: one state scatters photons, the other stays dark', 'By spin-to-charge conversion', 'By measuring current'], 1, 'A laser tuned to a cycling transition makes one qubit state fluoresce brightly while the other does not, detected with a camera or photon counter.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Randomized benchmarking', 'Measuring average gate error from the decay of survival probability over random Clifford sequences of increasing length; insensitive to SPAM errors.', 'rb'],
  ['SPAM error', 'State preparation and measurement error, which contaminates naive estimates of gate quality.', 'rb'],
  ['Average gate fidelity', 'The overlap between a noisy gate’s output and the ideal output, averaged over all pure inputs.', 'rb'],
  ['Quantum volume', 'A whole-device benchmark: the largest square random circuit whose outputs pass a heavy-output test.', 'rb'],
  ['Error mitigation', 'Techniques that reduce the bias of measured expectation values with extra runs and post-processing, without extra qubits.', 'mitigation'],
  ['Zero-noise extrapolation', 'Measuring at deliberately amplified noise levels and extrapolating the results back to zero noise.', 'mitigation'],
  ['Probabilistic error cancellation', 'Inverting a learned noise model as a quasi-probability distribution over circuits; unbiased but with exponential sampling overhead.', 'mitigation'],
  ['Confusion matrix', 'The table of probabilities of reading each outcome given each prepared state, used to correct readout errors.', 'mitigation'],
  ['Dispersive readout', 'Measuring a qubit through the state-dependent frequency shift of a coupled, detuned resonator.', 'readout'],
  ['IQ plane', 'The plane of in-phase and quadrature signal components in which each readout shot appears as a point.', 'readout'],
  ['Assignment fidelity', 'One minus the average probability of misreading |0⟩ as 1 or |1⟩ as 0.', 'readout'],
  ['Quantum non-demolition measurement', 'A measurement that leaves the measured observable unchanged, so repeating it gives the same result.', 'readout'],
  ['Parametric amplifier', 'A Josephson-junction amplifier that adds close to the minimum quantum noise, used as the first stage of readout.', 'readout']
);
})();
