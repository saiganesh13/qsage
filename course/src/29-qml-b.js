/* =====================================================================
   Research track · quantum machine learning (part B):
   quantum GANs, Born machines, quantum autoencoders
   ===================================================================== */
(() => {
const VQA = 9;
const sigm = z => 1 / (1 + Math.exp(-z));
const probsOf = v => Array.from(v, a => a * a);

/* ---------- QGAN ---------- */
const QG_TARGETS = {
  lognormal: () => { const t = [...Array(8)].map((_, x) => { const xx = x + .5; return Math.exp(-((Math.log(xx) - 1) ** 2) / 2) / xx; }); const Z = t.reduce((a, b) => a + b); return t.map(v => v / Z); },
  bimodal: () => { const t = [...Array(8)].map((_, x) => Math.exp(-((x - 1.5) ** 2) / 1.2) + .8 * Math.exp(-((x - 5.5) ** 2) / 1.2)); const Z = t.reduce((a, b) => a + b); return t.map(v => v / Z); },
  triangle: () => { const t = [...Array(8)].map((_, x) => 4 - Math.abs(x - 3.5)); const Z = t.reduce((a, b) => a + b); return t.map(v => v / Z); }
};

LESSONS.push({
  id: 'qgan', n: 37.7, stage: VQA, minutes: 15, title: 'Quantum generative adversarial networks (QGAN)',
  lede: 'A GAN pits a generator that invents samples against a discriminator that tries to tell them from real data. In a quantum GAN the generator is a quantum circuit, and the distribution it learns is written into its measurement probabilities.',
  html: `
<h2>Generative adversarial networks</h2>
<p>A generative adversarial network (Goodfellow and colleagues, 2014) trains two models against each other. The <strong>generator</strong> ${m('G')} produces samples; the <strong>discriminator</strong> ${m('D')} outputs the probability that a sample is real. ${m('D')} is trained to maximize its accuracy, and ${m('G')} to fool it:</p>
${EQ('min<sub>G</sub> max<sub>D</sub> &nbsp; E<sub>x ∼ data</sub>[log D(x)] + E<sub>x ∼ G</sub>[log(1 − D(x))]')}
<p>At the equilibrium the generator reproduces the data distribution and the discriminator can do no better than guessing, ${m('D = ½')} everywhere. In practice training oscillates, and the generator often minimizes ${m('−log D')} instead, which gives stronger gradients early on.</p>
<h2>Quantum GANs</h2>
<p>Lloyd and Weedbrook, and Dallaire-Demers and Killoran, proposed quantum GANs in 2018, with quantum generators, discriminators or both. The most practical variant keeps the discriminator classical and makes the generator a parametrized circuit: measuring it in the computational basis samples from its <strong>Born distribution</strong> ${m('p<sub>θ</sub>(x) = |⟨x|ψ(θ)⟩|²')}. Gradients of the generator’s loss come from the parameter-shift rule ([[L:qnn]]) applied to those probabilities.</p>
<p>Zoufal, Lucchi and Woerner (npj Quantum Information, 2019) used exactly this to <strong>load a probability distribution</strong> into a quantum state: a three-qubit generator learned a log-normal distribution of asset prices, which then served as the input to amplitude estimation for option pricing ([[L:ampest]]). Loading data is a bottleneck for many quantum algorithms, and a generator with ${m('O(poly(n))')} gates that approximates a smooth distribution over ${m('2ⁿ')} values avoids writing every amplitude explicitly.</p>
${LAB('gan')}
<h2>Caveats</h2>
<p>Adversarial training is notoriously unstable, and quantum generators add shot noise to the probability estimates. For loading, the trained state must be accurate enough that the subsequent algorithm’s quadratic speedup is not eaten up by the loading error and training cost. And as with all generative quantum models, a convincing advantage needs distributions that are hard to sample classically yet learnable, a combination that has not yet been shown for practical data.</p>
`,
  labs: {
    gan: {
      title: 'Train a quantum GAN',
      cap: 'The generator is a 3-qubit circuit (layers of R_y rotations and CNOT gates) whose measurement distribution over 8 values is shown as filled bars; the target is outlined. The discriminator is classical, one logistic weight per value, and its output D(x) is the line of dots (0.5 means “cannot tell”). Each iteration updates D three times by gradient ascent, then G once with the non-saturating loss using parameter-shift gradients of the exact probabilities. The lower chart tracks the Kullback–Leibler divergence from target to generator.',
      build(body, id) {
        let tgtK = 'lognormal', tgt = null, P = null, w = null, opt = null, it = 0, running = false, kl = [], seed = 4;
        const n = 3, L = 3;
        const cv = canvas('', 'height:240px'), ck = canvas('', 'height:160px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const gen = P_ => probsOf(RSIM.hea(n, L, P_, 'cx'));
        const KL = p => tgt.reduce((s, t, x) => s + t * Math.log(t / Math.max(p[x], 1e-12)), 0);
        const reset = () => { tgt = QG_TARGETS[tgtK](); const r = rng(seed); P = Array.from({ length: n * (L + 1) }, (_, i) => (i < n ? PI / 2 : 0) + (r() - .5) * .4); w = new Array(8).fill(0); opt = makeAdam(P.length, .02); it = 0; kl = [KL(gen(P))]; running = false; runB.textContent = 'Train'; q.inv(); qk.inv(); text(); };
        const iter = () => {
          const pg = gen(P);
          for (let s = 0; s < 3; s++) for (let x = 0; x < 8; x++) { const D = sigm(w[x]); w[x] += 4 * (tgt[x] * (1 - D) - pg[x] * D); }
          const lD = w.map(v => -Math.log(sigm(v)));
          const g = P.map((_, k) => { const Pp = P.slice(), Pm = P.slice(); Pp[k] += PI / 2; Pm[k] -= PI / 2; const pp = gen(Pp), pm = gen(Pm); let s = 0; for (let x = 0; x < 8; x++) s += lD[x] * (pp[x] - pm[x]) / 2; return s; });
          opt.step(P, g); it++; kl.push(KL(gen(P)));
        };
        Scope.tick(() => { if (!running) return; for (let k = 0; k < 4; k++) iter(); if (it >= 800) { running = false; runB.textContent = 'Train more'; } q.inv(); qk.inv(); text(); });
        const q = painter(cv, ({ ctx, w: W, h: H }) => {
          if (!P) return; const T = Theme.get(), pg = gen(P), A = axes(ctx, W, H, { x: [-.5, 7.5], y: [0, .5], xt: [0, 1, 2, 3, 4, 5, 6, 7], xf: v => ket(v, 3), yt: [0, .25, .5], xl: 'measured value', yl: 'probability' }), bw = (A.X(1) - A.X(0)) * .6;
          for (let x = 0; x < 8; x++) { ctx.fillStyle = rgba(T.cyan, .8); ctx.fillRect(A.X(x) - bw / 2, A.Y(Math.min(pg[x], .5)), bw, A.B - A.Y(Math.min(pg[x], .5))); ctx.strokeStyle = T.ink; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.strokeRect(A.X(x) - bw / 2, A.Y(tgt[x]), bw, A.B - A.Y(tgt[x])); ctx.setLineDash([]); }
          const Ds = w.map(v => sigm(v)), Y2 = v => A.B - v * (A.B - A.T); polyline(ctx, Ds.map((d, x) => [A.X(x), Y2(d)]), T.copper, 1.6); Ds.forEach((d, x) => dot(ctx, A.X(x), Y2(d), 4, T.copper, T.surface));
          ctx.setLineDash([2, 3]); ctx.strokeStyle = T.copper; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(A.L, Y2(.5)); ctx.lineTo(A.R, Y2(.5)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
          txt(ctx, 'D = ½', A.R - 4, Y2(.5) - 8, { align: 'right', font: '500 10px "JetBrains Mono",monospace', color: T.copper });
        });
        const qk = painter(ck, ({ ctx, w: W, h: H }) => { const T = Theme.get(), A = axes(ctx, W, H, { x: [0, 800], y: [1e-4, 2], ylog: true, xt: [0, 200, 400, 600, 800], yt: [1e-4, 1e-3, 1e-2, .1, 1], yf: v => String(v), xl: 'iteration', yl: 'KL(target ‖ generator)' }); polyline(ctx, kl.map((v, i) => [A.X(i), A.Y(clamp(v, 1e-4, 2))]), T.cyan, 1.8); });
        const text = () => { const pg = gen(P); ro.innerHTML = `<span class="k">iteration </span>${it}<br><span class="k">KL divergence </span>${num(kl[kl.length - 1], 4)} <span class="k">(best so far ${num(Math.min(...kl), 4)})</span><br><span class="k">total variation distance </span>${num(pg.reduce((s, p, x) => s + Math.abs(p - tgt[x]), 0) / 2, 4)}<br><span class="k">generator parameters </span>${P.length}`; };
        const runB = btn('Train', () => { running = !running; runB.textContent = running ? 'Pause' : 'Train more'; }, 'pri');
        body.append(h('div', { class: 'btns' }, seg([{ v: 'lognormal', label: 'Log-normal' }, { v: 'bimodal', label: 'Bimodal' }, { v: 'triangle', label: 'Triangle' }], tgtK, v => { tgtK = v; reset(); }, 'Target'), runB, btn('New random start', () => { seed++; reset(); }, 'sm')),
          h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow([['generator p_θ(x)', 'var(--cyan)'], ['target', 'var(--ink)', 1], ['discriminator D(x)', 'var(--copper)']])), h('div', { class: 'stack' }, ck, ro)));
        reset();
      }
    }
  },
  take: ['A GAN trains a generator to fool a discriminator; at equilibrium the generator matches the data and D = ½ everywhere.',
    'In a quantum GAN the generator is a parametrized circuit whose Born distribution p_θ(x) = |⟨x|ψ(θ)⟩|² is the model; gradients come from parameter shifts.',
    'A main use is loading distributions into quantum states, for example a log-normal for amplitude-estimation option pricing.',
    'Training is unstable and shot-noise limited, and advantage needs distributions that are both hard to sample classically and learnable.'],
  quiz: QZ([
    ['What are the two players in a GAN?', ['Two discriminators', 'A generator that produces samples and a discriminator that tries to tell them from real data', 'An encoder and a decoder', 'Two optimizers'], 1, 'They are trained in alternation in a minimax game.'],
    ['What does the discriminator output at the ideal equilibrium?', ['1 everywhere', '½ everywhere, because real and generated samples are indistinguishable', '0 everywhere', 'The data distribution'], 1, 'When p_G = p_data, the optimal discriminator D = p_data/(p_data + p_G) equals ½.'],
    ['In the common quantum GAN design, which part is quantum?', ['The discriminator only', 'The generator, a parametrized circuit sampled by measurement', 'Neither', 'The loss function'], 1, 'Keeping the discriminator classical makes training simple while the quantum circuit represents the distribution.'],
    ['What is the Born distribution of a circuit?', ['A thermal distribution', 'p_θ(x) = |⟨x|ψ(θ)⟩|², the probability of measuring bit string x', 'A uniform distribution', 'The distribution of parameters'], 1, 'Measuring the output state in the computational basis samples from it.'],
    ['How are generator gradients computed?', ['By backpropagation through the hardware', 'With the parameter-shift rule applied to the measurement probabilities', 'By random search only', 'They are not needed'], 1, 'Each probability is an expectation value of a projector, so parameter shifts give exact derivatives.'],
    ['What did Zoufal, Lucchi and Woerner use a qGAN for?', ['Image generation', 'Loading a log-normal distribution of asset prices into a quantum state for option pricing with amplitude estimation', 'Factoring', 'Error correction'], 1, 'Efficient distribution loading is a prerequisite for the quadratic speedup of quantum Monte Carlo methods.'],
    ['Why do generators often minimize −log D instead of log(1 − D)?', ['It is required by quantum mechanics', 'It gives stronger gradients when the discriminator easily rejects the generator early in training', 'It removes the discriminator', 'It changes the equilibrium'], 1, 'The non-saturating loss has the same fixed point but avoids vanishing gradients at the start.'],
    ['Why is data loading important for quantum algorithms?', ['It isn’t', 'Writing 2ⁿ amplitudes explicitly costs exponential time and would erase many speedups', 'Because qubits are classical', 'Because of no-cloning'], 1, 'A compact trained circuit can approximate smooth distributions with polynomially many gates.'],
    ['What makes QGAN training hard in practice?', ['Too few parameters', 'Adversarial dynamics oscillate, and shot noise affects probability estimates and gradients', 'Gradients are always exact', 'There is no loss function'], 1, 'Even classical GANs need careful tuning; quantum sampling noise adds to the instability.'],
    ['What would a convincing quantum advantage for generative models require?', ['Any dataset', 'Distributions that are hard to sample classically yet learnable from data by the quantum model', 'Only classical discriminators', 'More than 1,000 qubits regardless of task'], 1, 'Hardness alone is not enough; the distribution must also be trainable and useful.']
  ])
});

/* ---------- Born machine (MMD) on 2×2 bars and stripes ---------- */
const BAS = [0b0000, 0b1111, 0b0011, 0b1100, 0b0101, 0b1010];
LESSONS.push({
  id: 'born', n: 37.75, stage: VQA, minutes: 14, title: 'Quantum circuit Born machines',
  lede: 'Measurement makes every quantum circuit a sampler. A Born machine is trained so that its samples look like data, and because no discriminator is needed, it is the simplest quantum generative model.',
  html: `
<h2>Sampling as a model</h2>
<p>A <strong>quantum circuit Born machine</strong> (Benedetti and colleagues, 2019; Liu and Wang, 2018) is a parametrized circuit whose output distribution ${m('p<sub>θ</sub>(x) = |⟨x|ψ(θ)⟩|²')} is the model, named after Born’s rule. Unlike a classical Boltzmann machine, it needs no Markov chain to sample: every shot is an independent sample. Unlike a QGAN ([[L:qgan]]), it is trained directly against a distance between distributions.</p>
<h2>Training without likelihoods</h2>
<p>The model can be sampled, but its probabilities cannot be read out efficiently, so likelihood-based training is unavailable. A convenient alternative is the <strong>maximum mean discrepancy</strong> (MMD), which compares the two distributions through a kernel ${m('K')}:</p>
${EQ('MMD²(p<sub>θ</sub>, π) = E<sub>x,y∼p</sub>[K(x,y)] − 2 E<sub>x∼p, y∼π</sub>[K(x,y)] + E<sub>x,y∼π</sub>[K(x,y)]')}
<p>Every term can be estimated from samples, and its gradient follows from the parameter-shift rule applied to the probabilities, as Liu and Wang showed. The lab trains a four-qubit Born machine on the classic <strong>bars-and-stripes</strong> benchmark: 2×2 images in which every row, or every column, is uniform. Six of the sixteen patterns qualify.</p>
${LAB('bas')}
<h2>Architecture matters</h2>
<p>The lab offers two entangling layouts with the same number of parameters. A ladder of CNOTs learns the target to high accuracy, while a ring of CZ gates with real rotations stalls with a few percent of probability on invalid patterns, however long it trains. Expressivity is not only a matter of depth: the choice of gates restricts which states are reachable.</p>
${NOTE('Why care?', `<p>Born machines are candidates for quantum advantage in generative modelling because sampling from many circuit families is believed hard classically, the basis of random-circuit sampling experiments ([[L:advantage]]). Whether that hardness can coexist with learnability from data, and with useful target distributions, is an open question; Born machines have been used as testbeds for it, including on trapped-ion and superconducting hardware.</p>`)}
`,
  labs: {
    bas: {
      title: 'A Born machine learns bars and stripes',
      cap: 'Sixteen 2×2 patterns, with the six valid bars-and-stripes images outlined in copper; the bar under each shows its probability under the model. Training minimizes the MMD with a mixture of Gaussian kernels on Hamming distance, using parameter-shift gradients and Adam. The strip at the bottom shows twelve fresh samples from the current model. Compare the two entanglers.',
      build(body, id) {
        let ent = 'cx', P = null, opt = null, it = 0, running = false, hist = [], seed = 21, samples = [];
        const n = 4, L = 4, K = 16, tgt = [...Array(K)].map((_, x) => BAS.includes(x) ? 1 / 6 : 0);
        const ham = (a, b) => { let x = a ^ b, c3 = 0; while (x) { c3 += x & 1; x >>= 1; } return c3; }, sigs = [.25, .5, 1];
        const Km = [...Array(K)].map((_, a) => [...Array(K)].map((_, b) => sigs.reduce((s, sg) => s + Math.exp(-ham(a, b) / (2 * sg * sg)), 0) / sigs.length));
        const gen = P_ => probsOf(RSIM.hea(n, L, P_, ent));
        const mmd = p => { let s = 0; for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) s += (p[a] - tgt[a]) * Km[a][b] * (p[b] - tgt[b]); return s; };
        const cv = canvas('', 'height:250px'), cs = canvas('', 'height:62px'), cm = canvas('', 'height:170px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const draw12 = () => { const p = gen(P); samples = []; for (let k = 0; k < 12; k++) { let u = Math.random(), x = 0; while (x < 15 && u > p[x]) { u -= p[x]; x++; } samples.push(x); } };
        const reset = () => { const r = rng(seed); P = Array.from({ length: n * (L + 1) }, () => (r() - .5) * TAU); opt = makeAdam(P.length, .05); it = 0; hist = [mmd(gen(P))]; running = false; runB.textContent = 'Train'; draw12(); inv(); };
        const inv = () => { q.inv(); qs.inv(); qm.inv(); text(); };
        const iter = () => { const p = gen(P), d = p.map((x, a) => x - tgt[a]), Kd = d.map((_, a) => Km[a].reduce((s, v, b) => s + v * d[b], 0)); const g = P.map((_, k) => { const Pp = P.slice(), Pm = P.slice(); Pp[k] += PI / 2; Pm[k] -= PI / 2; const pp = gen(Pp), pm = gen(Pm); let s = 0; for (let a = 0; a < K; a++) s += Kd[a] * (pp[a] - pm[a]); return s; }); opt.step(P, g); it++; hist.push(mmd(gen(P))); };
        Scope.tick(() => { if (!running) return; for (let k = 0; k < 3; k++) iter(); if (it % 15 === 0) draw12(); if (it >= 450) { running = false; runB.textContent = 'Train more'; draw12(); } inv(); });
        const tile = (ctx, x0, y0, s, pat, T, hi) => { for (let b = 0; b < 4; b++) { const on = (pat >> (3 - b)) & 1, cx = x0 + (b % 2) * s / 2, cy = y0 + Math.floor(b / 2) * s / 2; ctx.fillStyle = on ? T.ink : T.surface2; ctx.fillRect(cx + 1, cy + 1, s / 2 - 2, s / 2 - 2); } ctx.strokeStyle = hi ? T.copper : T.line; ctx.lineWidth = hi ? 2.2 : 1; ctx.strokeRect(x0 - 1, y0 - 1, s + 2, s + 2); };
        const q = painter(cv, ({ ctx, w, h: H }) => {
          if (!P) return; const T = Theme.get(), p = gen(P), cols = 8, cw = w / cols, s = Math.min(cw * .55, 40), rowH = H / 2;
          for (let x = 0; x < K; x++) { const c3 = x % cols, r = Math.floor(x / cols), x0 = c3 * cw + (cw - s) / 2, y0 = r * rowH + 6, valid = BAS.includes(x); tile(ctx, x0, y0, s, x, T, valid);
            const bh = rowH - s - 30, by = y0 + s + 8 + bh; ctx.fillStyle = rgba(T.line, .6); ctx.fillRect(x0, y0 + s + 8, s, bh); ctx.fillStyle = valid ? T.cyan : T.copper; const hh = bh * Math.min(1, p[x] / .3); ctx.fillRect(x0, by - hh, s, hh); txt(ctx, num(p[x] * 100, 0) + '%', x0 + s / 2, by + 9, { font: '500 9.5px "JetBrains Mono",monospace' }); }
        });
        const qs = painter(cs, ({ ctx, w, h: H }) => { if (!samples.length) return; const T = Theme.get(), s = Math.min(36, (w - 90) / 12 - 6); txt(ctx, 'samples:', 0, H / 2, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace' }); samples.forEach((x, k) => tile(ctx, 74 + k * (s + 6), (H - s) / 2, s, x, T, BAS.includes(x))); });
        const qm = painter(cm, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 450], y: [1e-7, .2], ylog: true, xt: [0, 150, 300, 450], yt: [1e-6, 1e-4, 1e-2], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'iteration', yl: 'MMD²' }); polyline(ctx, hist.map((v, i) => [A.X(i), A.Y(clamp(v, 1e-7, .2))]), T.copper, 2); });
        const text = () => { const p = gen(P); ro.innerHTML = `<span class="k">iteration </span>${it} &nbsp; <span class="k">MMD² </span>${sci(hist[hist.length - 1])}<br><span class="k">probability on valid patterns </span>${pct(BAS.reduce((s, x) => s + p[x], 0), 1)}<br><span class="k">valid samples in strip </span>${samples.filter(x => BAS.includes(x)).length} / 12`; };
        const runB = btn('Train', () => { running = !running; runB.textContent = running ? 'Pause' : 'Train more'; }, 'pri');
        body.append(h('div', { class: 'btns' }, seg([{ v: 'cx', label: 'Entangler: CNOT ladder' }, { v: 'cz', label: 'Entangler: CZ ring' }], ent, v => { ent = v; reset(); }, 'Entangler'), runB, btn('New random start', () => { seed++; reset(); }, 'sm')),
          cv, cs, h('div', { class: 'split' }, cm, ro));
        reset();
      }
    }
  },
  take: ['A Born machine is a parametrized circuit whose measurement distribution is the generative model; every shot is an independent sample.',
    'Its probabilities cannot be read out efficiently, so it is trained with sample-based distances such as the maximum mean discrepancy.',
    'MMD gradients follow from parameter shifts of the output probabilities.',
    'Gate choice limits reachable states, and advantage depends on combining classical hardness of sampling with learnability.'],
  quiz: QZ([
    ['What defines the model distribution of a Born machine?', ['A Boltzmann factor', 'Born’s rule: p_θ(x) = |⟨x|ψ(θ)⟩|²', 'A neural network softmax', 'The parameters directly'], 1, 'Measuring the circuit’s output state in the computational basis samples from this distribution.'],
    ['Why does a Born machine not need a Markov chain to sample?', ['It does need one', 'Each measurement shot is an independent sample from p_θ', 'Because it is classical', 'Because samples are deterministic'], 1, 'Classical Boltzmann machines need slow MCMC sampling; quantum measurement gives direct samples.'],
    ['Why can’t a Born machine simply be trained by maximum likelihood?', ['Likelihood is undefined', 'Individual probabilities p_θ(x) cannot be read out efficiently; only samples are available', 'Because there are no parameters', 'Because the data are continuous'], 1, 'Estimating a small probability to useful precision would take many samples, so sample-based losses are used.'],
    ['What is the maximum mean discrepancy?', ['A classification accuracy', 'A kernel-based distance between two distributions, estimable from samples of each', 'The KL divergence', 'A learning rate schedule'], 1, 'MMD² compares mean embeddings of the two distributions in the kernel’s feature space.'],
    ['How are MMD gradients obtained for a quantum circuit?', ['Finite differences only', 'By parameter-shift rules applied to the output probabilities, combined with the product rule because the MMD is quadratic in them', 'They cannot be computed', 'By backpropagation'], 1, 'Liu and Wang derived unbiased gradient estimators: the MMD is quadratic in the model probabilities, so each gradient term pairs samples from a parameter-shifted circuit with samples from the unshifted one.'],
    ['How many of the 16 possible 2×2 images are valid bars-and-stripes patterns?', ['16', '6', '4', '2'], 1, 'Two uniform-row patterns, two uniform-column patterns, plus all-white and all-black, which are both.'],
    ['In the lab, why does the CZ-ring Born machine stall?', ['It trains too slowly', 'With real R_y rotations and that entangling pattern, the target state is not exactly reachable, so a few percent of probability remains on invalid patterns', 'Because the kernel is wrong', 'Because CZ gates are noisy'], 1, 'The gate set constrains reachable states; architecture matters as much as depth.'],
    ['How does a Born machine differ from a QGAN?', ['It uses no quantum circuit', 'It is trained directly against a distance between distributions, without a discriminator', 'It only works classically', 'It has no parameters'], 1, 'Removing the adversary simplifies and stabilizes training.'],
    ['Why are Born machines candidates for quantum advantage?', ['They are faster to train', 'Sampling from many circuit families is believed classically hard', 'They need no qubits', 'They avoid measurement'], 1, 'The same hardness underlies random-circuit sampling demonstrations.'],
    ['What is the main open question for quantum generative advantage?', ['Whether circuits can be measured', 'Whether classical hardness of sampling can coexist with learnability from data and useful target distributions', 'Whether MMD exists', 'Whether qubits can be entangled'], 1, 'A model that is hard to sample but impossible to train, or trained only on easy distributions, gives no advantage.']
  ])
});

/* ---------- quantum autoencoder: 3 qubits → 1 latent qubit ---------- */
LESSONS.push({
  id: 'qae', n: 37.8, stage: VQA, minutes: 14, title: 'Quantum autoencoders',
  lede: 'An autoencoder squeezes data through a bottleneck and learns to rebuild it. A quantum autoencoder does the same with quantum states: it learns a circuit that packs a family of states into fewer qubits, leaving the rest in a blank state that can be thrown away.',
  html: `
<h2>Compression as learning</h2>
<p>A classical autoencoder is a network trained to reproduce its input through a narrow middle layer, so it must discover a compact description of the data. Romero, Olson and Aspuru-Guzik (2017) proposed the quantum version. An encoder circuit ${m('U(θ)')} acts on ${m('n')} qubits; afterwards ${m('k')} of them, the <strong>latent</strong> qubits, are kept and the other ${m('n − k')}, the <strong>trash</strong> qubits, are discarded. If the trash qubits always end in ${m('|0…0⟩')}, nothing was lost, and the decoder ${m('U(θ)<sup>†</sup>')} with fresh ${m('|0⟩')}s rebuilds the input exactly.</p>
${EQ('U(θ)|ψᵢ⟩ = |ψᵢ<sup>latent</sup>⟩ ⊗ |0…0⟩<sub>trash</sub> &nbsp; for every state ψᵢ in the family')}
<p>This gives a cost that is easy to measure: the average probability that the trash qubits read ${m('|0…0⟩')}. It can also be estimated with a swap test against reference qubits. Maximizing it trains the encoder. The trash fidelity is an upper bound on the reconstruction fidelity (for a trash fidelity p, reconstruction can be as low as p²), and the two reach 1 together, when compression is perfect.</p>
<h2>When compression is possible</h2>
<p>Compression works only if the states span a small subspace. A family of states on ${m('n')} qubits can be compressed losslessly into ${m('k')} qubits exactly when all its members lie in a ${m('2ᵏ')}-dimensional subspace, and the best achievable average fidelity is set by the largest eigenvalues of the family’s average density matrix, as in Schumacher compression ([[L:infotheory]]). The lab has a family that secretly lives in a two-dimensional subspace of three qubits, and a set of random states that does not.</p>
${LAB('ae')}
<h2>Uses</h2>
<ul>
<li><strong>Compressing simulation outputs</strong>, such as ground states of a molecule along a bond-stretching path, which share structure.</li>
<li><strong>Denoising</strong>: training on noisy copies so that the bottleneck keeps the signal and discards noise (Bondarenko and Feldmann, 2020).</li>
<li><strong>Feature extraction</strong> for quantum data before a classifier, and experiments on photonic and superconducting hardware that compress qubit and qutrit states.</li>
</ul>
`,
  labs: {
    ae: {
      title: 'Compress three qubits into one',
      cap: 'Ten states of three qubits are fed to an encoder made of layers of R_y rotations and CNOTs; the cost is the average probability that the two trash qubits end in |00⟩. Left: one minus that fidelity during training (log scale). Right: the latent qubit of each training state on the Bloch sphere; for the compressible family they line up on a great circle, as a one-parameter family should. Bars: trash fidelity for each state. The hidden family was made by a two-layer circuit, so two encoder layers can compress it exactly; one layer cannot, and three layers have more local minima to get stuck in.',
      build(body, id) {
        let fam = 'hidden', L = 2, P = null, opt = null, it = 0, running = false, hist = [], data = null, seed = 7;
        const n = 3, N = 8;
        const cv = canvas('', 'height:220px'), sph = canvas('sq', 'max-width:250px;margin:0 auto'), bv = new BlochView(sph, { labels: 'min', trail: false }), bars = canvas('', 'height:90px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        const makeData = () => { const r = rng(99); if (fam === 'hidden') { const VP = Array.from({ length: 9 }, () => (r() - .5) * TAU); return [...Array(10)].map((_, i) => { const a = PI * i / 10, v = new Float64Array(N); v[0] = Math.cos(a); v[4] = Math.sin(a); let k = 9; for (let q2 = n - 1; q2 >= 0; q2--) RSIM.ry(v, n, q2, -VP[--k]); for (let l = 1; l >= 0; l--) { RSIM.cx(v, n, 2, 0); RSIM.cx(v, n, 1, 2); RSIM.cx(v, n, 0, 1); for (let q2 = n - 1; q2 >= 0; q2--) RSIM.ry(v, n, q2, -VP[--k]); } return v; }); }
          return [...Array(10)].map(() => { const v = Float64Array.from({ length: N }, () => randnS(r)); const s = Math.hypot(...v); return v.map(x => x / s); }); };
        const randnS = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
        const enc = (v0, P_) => { const v = Float64Array.from(v0); let k = 0; for (let l = 0; l < L; l++) { for (let q2 = 0; q2 < n; q2++) RSIM.ry(v, n, q2, P_[k++]); RSIM.cx(v, n, 0, 1); RSIM.cx(v, n, 1, 2); RSIM.cx(v, n, 2, 0); } for (let q2 = 0; q2 < n; q2++) RSIM.ry(v, n, q2, P_[k++]); return v; };
        const trash = v => v[0] * v[0] + v[4] * v[4];
        const cost = P_ => 1 - data.reduce((s, v) => s + trash(enc(v, P_)), 0) / data.length;
        const best = () => { const rho = new Float64Array(64); for (const v of data) for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) rho[i * 8 + j] += v[i] * v[j] / data.length; const w = eigSymV(rho, 8).w; return w[7] + w[6]; };
        const reset = () => { data = makeData(); const r = rng(seed + 10 * L); P = Array.from({ length: n * (L + 1) }, () => (r() - .5) * TAU); opt = makeAdam(P.length, .05); it = 0; hist = [cost(P)]; running = false; runB.textContent = 'Train'; inv(); };
        const inv = () => { q.inv(); qb.inv(); latent(); text(); };
        const iter = () => { const g = P.map((_, k) => { const Pp = P.slice(), Pm = P.slice(); Pp[k] += PI / 2; Pm[k] -= PI / 2; return (cost(Pp) - cost(Pm)) / 2; }); opt.step(P, g); it++; hist.push(cost(P)); };
        Scope.tick(() => { if (!running) return; for (let k = 0; k < 3; k++) iter(); if (it >= 400) { running = false; runB.textContent = 'Train more'; } inv(); });
        const latent = () => { bv.extra = data.map((v0, i) => { const v = enc(v0, P), a = v[0], b = v[4], nr = Math.hypot(a, b) || 1; return { v: [2 * a * b / nr / nr, 0, (a * a - b * b) / nr / nr], r: 4, color: phaseColor(TAU * i / 10, .95) }; }); bv.v = [0, 0, 0]; bv.inv(); };
        const q = painter(cv, ({ ctx, w, h: H }) => { const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 400], y: [1e-5, 1], ylog: true, xt: [0, 100, 200, 300, 400], yt: [1e-5, 1e-4, 1e-3, 1e-2, .1, 1], yf: v => '10' + sup(Math.round(Math.log10(v))), xl: 'training step', yl: '1 − trash fidelity' });
          const lim = 1 - best(); if (lim > 1e-5) { ctx.setLineDash([5, 4]); ctx.strokeStyle = T.ink; ctx.beginPath(); ctx.moveTo(A.L, A.Y(lim)); ctx.lineTo(A.R, A.Y(lim)); ctx.stroke(); ctx.setLineDash([]); txt(ctx, 'best possible', A.R - 4, A.Y(lim) - 8, { align: 'right', font: '500 10px "JetBrains Mono",monospace' }); }
          polyline(ctx, hist.map((v, i) => [A.X(i), A.Y(clamp(v, 1e-5, 1))]), T.copper, 2.2); });
        const qb = painter(bars, ({ ctx, w, h: H }) => { const T = Theme.get(), bw = (w - 20) / 10; data.forEach((v, i) => { const f = trash(enc(v, P)), x = 10 + i * bw; ctx.fillStyle = rgba(T.line, .6); ctx.fillRect(x + bw * .15, 6, bw * .7, H - 28); ctx.fillStyle = phaseColor(TAU * i / 10, .9); ctx.fillRect(x + bw * .15, 6 + (H - 28) * (1 - f), bw * .7, (H - 28) * f); txt(ctx, num(f * 100, 0) + '%', x + bw / 2, H - 10, { font: '500 9.5px "JetBrains Mono",monospace' }); }); });
        const text = () => { ro.innerHTML = `<span class="k">encoder layers </span>${L} &nbsp; <span class="k">parameters </span>${P.length}<br><span class="k">average trash fidelity </span>${num(1 - hist[hist.length - 1], 5)}<br><span class="k">best possible (top two eigenvalues) </span>${num(best(), 5)}`; };
        const runB = btn('Train', () => { running = !running; runB.textContent = running ? 'Pause' : 'Train more'; }, 'pri');
        body.append(h('div', { class: 'btns' }, seg([{ v: 'hidden', label: 'Hidden two-dimensional family' }, { v: 'random', label: 'Random states' }], fam, v => { fam = v; reset(); }, 'Data'), runB, btn('New random start', () => { seed++; reset(); }, 'sm')),
          h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, bars), h('div', { class: 'stack' }, sph, slider({ id: id('l'), label: 'Encoder layers', min: 1, max: 3, step: 1, value: L, fmt: String, on: v => { L = v; reset(); } }), ro)));
        reset();
      }
    }
  },
  take: ['A quantum autoencoder trains an encoder so that a family of n-qubit states ends with its trash qubits in |0…0⟩, keeping only k latent qubits.',
    'The cost, the probability that the trash qubits read zero, is easy to measure, bounds the reconstruction fidelity from above, and reaches 1 exactly when compression is perfect.',
    'Lossless compression to k qubits is possible only if the states span at most a 2ᵏ-dimensional subspace; otherwise the top eigenvalues of the average state bound the fidelity.',
    'Uses include compressing families of simulated states, denoising and feature extraction from quantum data.'],
  quiz: QZ([
    ['What does a quantum autoencoder try to achieve?', ['Copy quantum states', 'Map a family of states so that some qubits always end in |0⟩, compressing the information into the remaining latent qubits', 'Measure all qubits', 'Increase entanglement'], 1, 'If the trash qubits are reliably blank, they carry no information and can be discarded.'],
    ['How is the encoder trained?', ['By tomography of every state', 'By maximizing the average probability that the trash qubits are measured in |0…0⟩', 'By minimizing the number of gates', 'By random sampling of circuits'], 1, 'This cost is a simple measurement and directly measures compression quality.'],
    ['How is a compressed state decompressed?', ['It cannot be', 'Add fresh |0⟩ qubits in place of the trash and apply the inverse encoder U(θ)†', 'Measure the latent qubit', 'Apply a Hadamard to every qubit'], 1, 'If the trash was exactly |0…0⟩, U† restores the original state perfectly.'],
    ['When is lossless compression of a family to k qubits possible?', ['Always', 'When all the states lie in a subspace of dimension at most 2ᵏ', 'Only for product states', 'Only for one state'], 1, 'A unitary can rotate that subspace onto the latent qubits with trash in |0…0⟩.'],
    ['In the lab, why can the random states not be compressed well?', ['The encoder is too short', 'Ten random states span many dimensions, so no unitary can fit them into a two-dimensional subspace', 'Random states are classical', 'Because of measurement noise'], 1, 'The dashed line, from the top two eigenvalues of the average state, bounds what any encoder can do.'],
    ['What bounds the best average fidelity for compressing a set of states?', ['The number of layers', 'The sum of the largest eigenvalues of the average density matrix, as in Schumacher compression', 'The number of shots', 'The entanglement entropy of one state'], 1, 'Keeping the dominant eigenspace is optimal; the rest of the weight is lost.'],
    ['For the compressible family, why do latent states lie on a great circle?', ['By coincidence', 'The family has one real parameter, so its compressed states trace a one-parameter curve of real states, a great circle in the xz-plane', 'Because the trash is mixed', 'Because of the Hadamard gate'], 1, 'Real one-qubit states have Bloch vectors with zero y-component.'],
    ['In the lab, one encoder layer cannot compress the hidden family but two can. Why can three layers sometimes do worse?', ['Three layers are less expressive', 'More parameters give a more complicated landscape, and gradient descent can stop in a local minimum', 'The data change with depth', 'Deeper circuits always fail'], 1, 'Expressivity is necessary but not sufficient: training must also find the good parameters.'],
    ['How can the trash fidelity be estimated besides direct measurement?', ['By counting gates', 'With a swap test between the trash qubits and fresh reference qubits in |0⟩', 'It cannot be', 'By classical shadows only'], 1, 'The swap test estimates overlaps between states without measuring them in a basis.'],
    ['Which is a proposed application of quantum autoencoders?', ['Factoring', 'Denoising quantum states by training a bottleneck that discards noise', 'Generating random numbers', 'Replacing error correction entirely'], 1, 'Bondarenko and Feldmann showed autoencoders can remove certain noise from families of entangled states.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['QGAN', 'A quantum generative adversarial network, usually a parametrized-circuit generator trained against a classical discriminator.', 'qgan'],
  ['Born machine', 'A generative model whose samples are measurement outcomes of a parametrized quantum circuit, distributed by Born’s rule.', 'born'],
  ['Maximum mean discrepancy', 'A kernel distance between two probability distributions that can be estimated from samples.', 'born'],
  ['Quantum autoencoder', 'A trained circuit that compresses a family of quantum states into fewer qubits, leaving discarded “trash” qubits in |0⟩.', 'qae']
);
})();
