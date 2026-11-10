/* =====================================================================
   Research track · chemistry and machine learning:
   fermion-to-qubit mappings, measurement grouping and shot budgets
   ===================================================================== */
(() => {
const VQA = 9;

/* ---------- Pauli algebra on strings of digits 0 I, 1 X, 2 Y, 3 Z; operators are Maps string → [re, im] ---------- */
const PA = (() => {
  const MT = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[1, 0], [0, 0], [3, 1], [2, 3]], [[2, 0], [3, 3], [0, 0], [1, 1]], [[3, 0], [2, 1], [1, 3], [0, 0]]];
  const IP = [[1, 0], [0, 1], [-1, 0], [0, -1]], cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const clean = R => { for (const [k, c3] of R) if (Math.hypot(c3[0], c3[1]) < 1e-12) R.delete(k); return R; };
  const mul = (A, B) => { const R = new Map(); for (const [ka, ca] of A) for (const [kb, cb] of B) { let ph = 0, s = ''; for (let i = 0; i < ka.length; i++) { const e = MT[ka.charCodeAt(i) - 48][kb.charCodeAt(i) - 48]; s += e[0]; ph += e[1]; } const c3 = cm(cm(ca, cb), IP[ph & 3]), o = R.get(s) || [0, 0]; R.set(s, [o[0] + c3[0], o[1] + c3[1]]); } return clean(R); };
  const add = (A, B, sg = 1) => { const R = new Map(A); for (const [k, c3] of B) { const o = R.get(k) || [0, 0]; R.set(k, [o[0] + sg * c3[0], o[1] + sg * c3[1]]); } return clean(R); };
  const dag = A => new Map([...A].map(([k, c3]) => [k, [c3[0], -c3[1]]]));
  const single = (N, set, d) => { const a = new Array(N).fill('0'); for (const i of set) a[i] = d; return new Map([[a.join(''), [1, 0]]]); };
  const weight = A => { let w = 0; for (const [k] of A) { let x = 0; for (let i = 0; i < k.length; i++) if (k.charCodeAt(i) !== 48) x++; w = Math.max(w, x); } return w; };
  return { mul, add, dag, single, weight, ident: N => new Map([['0'.repeat(N), [1, 0]]]) };
})();

/* ---------- linear fermion encodings q = A·n (mod 2): Jordan–Wigner, parity, Bravyi–Kitaev (Fenwick tree) ---------- */
const lowbit = x => x & -x;
function encMatrix(kind, N) { return [...Array(N)].map((_, i) => [...Array(N)].map((_, j) => kind === 'jw' ? +(i === j) : kind === 'parity' ? +(j <= i) : +(j <= i && j >= i - lowbit(i + 1) + 1))); }
function inv2(A, N) {
  const M = A.map((r, i) => r.concat([...Array(N)].map((_, j) => +(i === j))));
  for (let c3 = 0; c3 < N; c3++) { let p = c3; while (!M[p][c3]) p++; [M[c3], M[p]] = [M[p], M[c3]]; for (let r = 0; r < N; r++) if (r !== c3 && M[r][c3]) for (let k = 0; k < 2 * N; k++) M[r][k] ^= M[c3][k]; }
  return M.map(r => r.slice(N));
}
const ENC = {};
/* a_j = X_U · Z_P · ½(1 − Z_S): U = qubits storing n_j, P = qubits whose parity is n_0 ⊕ … ⊕ n_(j−1), S = qubits whose parity is n_j */
function encoding(kind, N) {
  const key = kind + N; if (ENC[key]) return ENC[key];
  const A = encMatrix(kind, N), Ai = inv2(A, N), sets = [], ops = [];
  for (let j = 0; j < N; j++) {
    const U = [], P = [], S = [];
    for (let i = 0; i < N; i++) { if (A[i][j]) U.push(i); let p = 0; for (let k = 0; k < j; k++) p ^= Ai[k][i]; if (p) P.push(i); if (Ai[j][i]) S.push(i); }
    sets.push({ U, P, S });
    const half = new Map([...PA.add(PA.ident(N), PA.single(N, S, '3'), -1)].map(([k, c3]) => [k, [c3[0] / 2, c3[1] / 2]]));
    ops.push(PA.mul(PA.mul(PA.single(N, U, '1'), PA.single(N, P, '3')), half));
  }
  return ENC[key] = { A, sets, ops };
}
const hopping = (E, i, j) => PA.add(PA.mul(PA.dag(E.ops[i]), E.ops[j]), PA.mul(PA.dag(E.ops[j]), E.ops[i]));
const numberOp = (E, j) => PA.mul(PA.dag(E.ops[j]), E.ops[j]);
const MAPS = [['jw', 'Jordan–Wigner'], ['parity', 'Parity'], ['bk', 'Bravyi–Kitaev']];

LESSONS.push({
  id: 'mappings', n: 36.2, stage: VQA, minutes: 16, title: 'Fermions to qubits: Jordan–Wigner, parity and Bravyi–Kitaev',
  lede: 'Electrons are fermions: swapping two of them flips the sign of the wavefunction. Qubits do not behave that way, so every chemistry or materials simulation starts by choosing how to encode that sign, and the choice changes the cost of everything that follows.',
  html: `
<h2>Occupation numbers and a sign</h2>
<p>In second quantization a state of electrons is a list of occupation numbers ${m('|n₀ n₁ … n<sub>N−1</sub>⟩')}, one per spin orbital, each 0 or 1. That looks exactly like a qubit register, and it is, up to one detail. The annihilation operators ${m('a<sub>j</sub>')} must <em>anticommute</em>: ${m('{a<sub>i</sub>, a<sub>j</sub><sup>†</sup>} = δ<sub>ij</sub>')} and ${m('{a<sub>i</sub>, a<sub>j</sub>} = 0')}. Concretely, removing an electron from orbital ${m('j')} picks up a sign that depends on how many occupied orbitals come before it:</p>
${EQ('a<sub>j</sub> |n⟩ = δ<sub>n<sub>j</sub>,1</sub> · (−1)<sup>n₀ + n₁ + ⋯ + n<sub>j−1</sub></sup> · |n with n<sub>j</sub> → 0⟩')}
<p>Qubit operators on different qubits commute, so a mapping has to compute that parity somewhere. Chemistry Hamiltonians ([[L:chemistry]]) are built from products such as ${m('a<sub>p</sub><sup>†</sup>a<sub>q</sub>')} and ${m('a<sub>p</sub><sup>†</sup>a<sub>q</sub><sup>†</sup>a<sub>r</sub>a<sub>s</sub>')}, and after mapping each becomes a sum of Pauli strings. How long those strings are, their <strong>Pauli weight</strong>, sets the cost of simulating and measuring them.</p>
<h2>One recipe, three encodings</h2>
<p>Store some binary function of the occupations in the qubits. For the common mappings it is linear: ${m('q = A n')} modulo 2, for an invertible binary matrix ${m('A')}. Then any annihilation operator can be read off from three sets of qubits:</p>
<ul>
<li>the <strong>update set</strong> U(j): every qubit whose stored value includes ${m('n<sub>j</sub>')} must flip when ${m('n<sub>j</sub>')} changes, an X on each;</li>
<li>the <strong>parity set</strong> P(j): the qubits whose sum gives ${m('n₀ + ⋯ + n<sub>j−1</sub>')}, a Z on each for the sign;</li>
<li>the <strong>occupation set</strong> S(j): the qubits whose sum gives ${m('n<sub>j</sub>')} itself, for the projector onto “occupied”.</li>
</ul>
${EQ('a<sub>j</sub> = X<sub>U(j)</sub> · Z<sub>P(j)</sub> · ½(1 − Z<sub>S(j)</sub>)')}
<p><strong>Jordan–Wigner</strong> (1928) stores occupations directly (${m('A = I')}). Occupation and update are local, but the parity set is every earlier qubit: weight up to ${m('N')}. The <strong>parity mapping</strong> stores running parities ${m('q<sub>j</sub> = n₀ ⊕ ⋯ ⊕ n<sub>j</sub>')}. Now the sign is local, but changing ${m('n<sub>j</sub>')} flips every later qubit: weight still up to ${m('N')}. The <strong>Bravyi–Kitaev</strong> mapping (2002; worked out for chemistry by Seeley, Richard and Love in 2012) stores partial sums over the nodes of a binary tree, a Fenwick tree. Both the parity and the update information are spread over about ${m('log₂N')} qubits, so every operator has weight ${m('O(log N)')}.</p>
${LAB('strings')}
<h2>Why weight matters</h2>
<p>Simulating a term ${m('e<sup>−iθP</sup>')} for a Pauli string of weight ${m('w')} takes a ladder of about ${m('2(w − 1)')} CNOTs around one rotation, so long strings mean deep circuits. Long strings also touch more qubits during measurement and spread errors further. For a one-dimensional chain with nearest-neighbour hopping, Jordan–Wigner is perfect: ${m('a<sub>j</sub><sup>†</sup>a<sub>j+1</sub>')} has weight 2. For two-dimensional lattices and for molecules, where every orbital interacts with every other, the ${m('O(N)')} strings hurt, and logarithmic mappings help.</p>
${LAB('weights')}
<h2>Beyond these three</h2>
<ul>
<li><strong>Ternary-tree mappings</strong> (Jiang, Kalev, Mruczkiewicz and Neven, 2020) reach the provably optimal average weight of about ${m('log₃(2N)')} for single Majorana operators.</li>
<li><strong>Local encodings</strong> for lattices, such as Verstraete–Cirac, the Bravyi–Kitaev superfast encoding and the compact encoding of Derby and Klassen, use extra qubits to make every hopping term constant weight, at the price of stabilizer constraints that must be enforced.</li>
<li><strong>Symmetry tapering</strong> (Bravyi and colleagues, 2017) removes one qubit for each ${m('ℤ₂')} symmetry, such as particle-number parity per spin. H₂ in a minimal basis goes from four qubits to one.</li>
</ul>
`,
  labs: {
    strings: {
      title: 'The same operator in three encodings',
      cap: 'Each row is one Pauli string with its coefficient; X is copper, Y cyan, Z dark, identity blank. Columns are qubits, and the shaded columns are the modes i and j. The table lists, for mode j, the update set U (qubits that flip), the parity set P (qubits that give the sign) and the occupation set S (qubits that give nⱼ). Watch the Jordan–Wigner Z string grow with the distance between i and j, the parity mapping’s X string run to the end, and Bravyi–Kitaev stay short throughout.',
      build(body, id) {
        let N = 8, op = 'hop', i = 1, j = 6;
        const cv = canvas('', 'height:360px'), tbl = h('div', { class: 'scroll-x' }), ctl = h('div', { class: 'stack' });
        const opsFor = () => MAPS.map(([k, nm]) => { const E = encoding(k, N), O = op === 'hop' ? hopping(E, i, j) : op === 'num' ? numberOp(E, j) : E.ops[j]; return { k, nm, O, E, terms: [...O].sort((a, b) => a[0] < b[0] ? 1 : -1) }; });
        const coef = c3 => { const [re, im] = c3, f = x => nice(Math.abs(x), 3); return Math.abs(im) < 1e-12 ? (re < 0 ? MINUS : '+') + f(re) : Math.abs(re) < 1e-12 ? (im < 0 ? MINUS : '+') + f(im) + 'i' : cfmt(re, im); };
        const ROW = 24, HEAD = 22, GAP = 14;
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), all = opsFor(), L0 = 62, cs = Math.min(26, (w - L0 - 6) / N);
          let y = 4;
          const hiCols = op === 'hop' ? [i, j] : [j];
          for (const blk of all) {
            txt(ctx, blk.nm, 0, y + 9, { align: 'left', font: '600 12px "JetBrains Mono",monospace', color: T.ink });
            txt(ctx, `${blk.terms.length} term${blk.terms.length === 1 ? '' : 's'} · weight ${PA.weight(blk.O)}`, w - 4, y + 9, { align: 'right', font: '500 11px "JetBrains Mono",monospace' });
            y += HEAD;
            const top = y, bh = Math.max(1, blk.terms.length) * ROW;
            ctx.fillStyle = T.wash; for (const q of hiCols) ctx.fillRect(L0 + q * cs, top - 2, cs, bh + 2);
            blk.terms.forEach(([k, c3], r) => {
              const yy = top + r * ROW;
              txt(ctx, coef(c3), L0 - 8, yy + ROW / 2 - 1, { align: 'right', font: '500 11.5px "JetBrains Mono",monospace', color: T.ink });
              for (let q = 0; q < N; q++) {
                const d = k.charCodeAt(q) - 48, x = L0 + q * cs + 1.5, ww = cs - 3, hh = ROW - 5;
                if (d === 0) { ctx.strokeStyle = T.line; ctx.lineWidth = 1; ctx.strokeRect(x + .5, yy + .5, ww - 1, hh - 1); continue; }
                ctx.fillStyle = d === 1 ? T.copper : d === 2 ? T.cyan : T.ink; ctx.fillRect(x, yy, ww, hh);
                if (cs >= 13) txt(ctx, 'IXYZ'[d], x + ww / 2, yy + hh / 2 + .5, { font: `600 ${cs >= 20 ? 12 : 10}px "JetBrains Mono",monospace`, color: T.surface });
              }
            });
            y = top + bh + GAP;
          }
          for (let q = 0; q < N; q++) if (cs >= 14 || q % 2 === 0) txt(ctx, String(q), L0 + q * cs + cs / 2, y - 4, { font: '500 10px "JetBrains Mono",monospace' });
        });
        const resize = () => { const all = opsFor(), hh = all.reduce((s, b) => s + HEAD + Math.max(1, b.terms.length) * ROW + GAP, 0) + 16; cv.style.height = hh + 'px'; };
        const upd = () => {
          resize(); p.inv(); const all = opsFor();
          tbl.innerHTML = `<table class="mini-tbl"><tr><th>mapping</th><th>U(${j})</th><th>P(${j})</th><th>S(${j})</th></tr>${all.map(b => { const s = b.E.sets[j], f = a => a.length ? '{' + a.join(', ') + '}' : '∅'; return `<tr><td style="text-align:left">${{ jw: 'JW', parity: 'Parity', bk: 'BK' }[b.k]}</td><td>${f(s.U)}</td><td>${f(s.P)}</td><td>${f(s.S)}</td></tr>`; }).join('')}</table>`;
        };
        const mk = () => {
          ctl.innerHTML = ''; i = Math.min(i, N - 1); j = Math.min(j, N - 1); if (op === 'hop' && i === j) j = (i + 1) % N;
          if (op === 'hop') ctl.append(slider({ id: id('i'), label: 'Mode i', min: 0, max: N - 1, step: 1, value: i, fmt: String, on: v => { i = v; if (i === j) { j = (i + 1) % N; jS.set(j); } upd(); } }));
          const jS = slider({ id: id('j'), label: op === 'hop' ? 'Mode j' : 'Mode j', min: 0, max: N - 1, step: 1, value: j, fmt: String, on: v => { j = v; if (op === 'hop' && i === j) { j = (i + 1) % N; jS.set(j); } upd(); } });
          ctl.append(jS); upd();
        };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'hop', label: 'Hopping a†ᵢaⱼ + a†ⱼaᵢ' }, { v: 'ann', label: 'Annihilation aⱼ' }, { v: 'num', label: 'Number a†ⱼaⱼ' }], op, v => { op = v; mk(); }, 'Operator'),
          seg([4, 8, 16].map(v => ({ v, label: `${v} modes` })), N, v => { N = v; if (N === 4) { i = 0; j = 3; } else if (N === 8) { i = 1; j = 6; } else { i = 2; j = 13; } mk(); }, 'Modes')),
          h('div', { class: 'split wide-l' }, cv, h('div', { class: 'stack' }, ctl, tbl)));
        mk();
      }
    },
    weights: {
      title: 'Pauli weight as the system grows',
      cap: 'For every number of modes N up to 64, every operator is mapped exactly and its Pauli weight (the number of non-identity factors in its longest string) recorded. “All pairs” averages or maximizes over all hopping terms a†ᵢaⱼ + h.c., as in a molecule; “Neighbours on a line” uses only j = i + 1, as in a one-dimensional chain. The dotted curve is log₂N. Computed in the background.',
      build(body, id) {
        let metric = 'avg';
        const NS = []; for (let n = 2; n <= 64; n += 2) NS.push(n);
        const res = MAPS.map(() => NS.map(() => null)); let job = 0;
        const cv = canvas('', 'height:290px'), ro = h('div', { class: 'readout', style: 'white-space:normal' }), st = h('div', { class: 'status' });
        Scope.tick(() => {
          if (job >= NS.length * 3) return; const t0 = performance.now();
          while (job < NS.length * 3 && performance.now() - t0 < 12) {
            const ni = Math.floor(job / 3), mi = job % 3, N = NS[ni], E = encoding(MAPS[mi][0], N); job++;
            let sum = 0, cnt = 0, mx = 0, nn = 0, am = 0;
            for (let a = 0; a < N; a++) { am = Math.max(am, PA.weight(E.ops[a])); for (let b = a + 1; b < N; b++) { const wt = PA.weight(hopping(E, a, b)); sum += wt; cnt++; mx = Math.max(mx, wt); if (b === a + 1) nn = Math.max(nn, wt); } }
            res[mi][ni] = { avg: sum / cnt, max: mx, nn, ann: am };
          }
          p.inv(); text();
        });
        const p = painter(cv, ({ ctx, w, h: H }) => {
          const T = Theme.get(), A = axes(ctx, w, H, { x: [0, 64], y: [0, 66], xt: [0, 16, 32, 48, 64], yt: [0, 16, 32, 48, 64], xl: 'modes N', yl: 'Pauli weight' });
          const lg = []; for (let n = 2; n <= 64; n += 1) lg.push([A.X(n), A.Y(Math.log2(n))]); polyline(ctx, lg, T.ink, 1.2, [2, 3]);
          MAPS.forEach((_, mi) => { const pts = []; NS.forEach((n, ni) => { const r = res[mi][ni]; if (r) pts.push([A.X(n), A.Y(r[metric])]); }); polyline(ctx, pts, [T.copper, T.muted, T.cyan][mi], mi === 1 ? 1.8 : 2.4, mi === 1 ? [6, 4] : null); });
        });
        const text = () => {
          const done = job >= NS.length * 3, last = (() => { for (let ni = NS.length - 1; ni >= 0; ni--) if (res.every(r => r[ni])) return ni; return -1; })();
          st.className = done ? 'status good' : 'status'; st.textContent = done ? 'All mappings computed up to 64 modes.' : `Mapping operators… N = ${NS[Math.min(NS.length - 1, Math.floor(job / 3))]}`;
          if (last < 0) { ro.innerHTML = ''; return; }
          const N = NS[last]; ro.innerHTML = `<span class="k">at N = ${N}</span><br>` + MAPS.map(([, nm], mi) => { const r = res[mi][last]; return `<span class="k">${nm.padEnd(14)} </span>avg ${num(r.avg, 1)} · max ${r.max} · neighbour ${r.nn} · aⱼ ${r.ann}`; }).join('<br>');
        };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'avg', label: 'All pairs: average' }, { v: 'max', label: 'All pairs: worst' }, { v: 'nn', label: 'Neighbours on a line' }, { v: 'ann', label: 'Single aⱼ: worst' }], metric, v => { metric = v; p.inv(); }, 'Measure')),
          h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, legendRow([['Jordan–Wigner', 'var(--copper)'], ['Parity', 'var(--muted)', 1], ['Bravyi–Kitaev', 'var(--cyan)'], ['log₂N', 'var(--ink)', 1]])), h('div', { class: 'stack' }, st, ro)));
        text();
      }
    }
  },
  take: ['Fermionic operators anticommute; a mapping to qubits must reproduce the sign (−1)^(n₀+⋯+n_(j−1)) somewhere.',
    'For linear encodings, a_j = X on the update set × Z on the parity set × ½(1 − Z on the occupation set).',
    'Jordan–Wigner keeps occupation local but parity non-local (weight O(N)); the parity mapping does the reverse; Bravyi–Kitaev balances both with weight O(log N).',
    'Pauli weight drives circuit depth and measurement cost; local encodings and ternary trees improve it further, and symmetry tapering removes qubits.'],
  quiz: QZ([
    ['Why can’t occupation numbers simply be copied into qubits with no extra structure?', ['Qubits cannot store 0 or 1', 'Fermion operators anticommute and carry signs depending on earlier occupations, while operators on different qubits commute', 'There are too many orbitals', 'Electrons have spin'], 1, 'The mapping must reproduce the sign (−1)^(n₀+⋯+n_(j−1)), which needs information about other modes.'],
    ['What does the Jordan–Wigner Z string do?', ['Measures the qubit', 'Computes the parity of all earlier modes, giving the fermionic sign', 'Applies a phase of i', 'Removes a qubit'], 1, 'Z₀⋯Z_(j−1) has eigenvalue (−1)^(n₀+⋯+n_(j−1)) on an occupation basis state.'],
    ['Under Jordan–Wigner, what is the weight of nearest-neighbour hopping a†ⱼa_(j+1) + h.c.?', ['N', '2', 'log₂N', '1'], 1, 'The Z strings of the two operators cancel except between the neighbours, leaving XX + YY on qubits j and j+1.'],
    ['What does the parity mapping store in qubit j?', ['n_j', 'The parity n₀ ⊕ n₁ ⊕ ⋯ ⊕ n_j', 'The total number of electrons', 'A random bit'], 1, 'With running parities the sign of a_j needs only qubit j−1, but changing n_j flips every later qubit.'],
    ['What is the Pauli weight of a single aⱼ in the Bravyi–Kitaev mapping?', ['O(N)', 'O(log N)', 'Always 1', 'O(N²)'], 1, 'The Fenwick-tree structure means both the update and parity sets have about log₂N members.'],
    ['In the general recipe, what is the update set U(j)?', ['The qubits that store the parity of earlier modes', 'The qubits whose stored value includes n_j, which must flip when n_j changes', 'The qubits that are measured', 'All qubits'], 1, 'They are the non-zero entries of column j of the encoding matrix A, and each receives an X.'],
    ['Why does Pauli weight matter for simulation?', ['It doesn’t', 'Exponentiating a weight-w Pauli string needs about 2(w − 1) CNOTs, so long strings mean deep circuits and more error', 'It sets the number of electrons', 'It determines the basis set'], 1, 'Each term of a Trotter step or a VQE ansatz built from such strings costs a CNOT ladder proportional to its weight.'],
    ['For which systems is Jordan–Wigner already efficient?', ['Molecules with all-to-all interactions', 'One-dimensional chains with nearest-neighbour hopping', '3D lattices', 'None'], 1, 'Neighbouring modes give weight-2 terms; problems arise in 2D lattices and molecules, where distant modes interact.'],
    ['What do local encodings such as Verstraete–Cirac or the compact encoding trade?', ['Accuracy for speed', 'Extra qubits and stabilizer constraints in exchange for constant-weight hopping terms on lattices', 'Fewer qubits for longer strings', 'Fermions for bosons'], 1, 'Auxiliary qubits carry the sign information locally, and the physical states must satisfy extra stabilizer conditions.'],
    ['What does qubit tapering exploit?', ['Noise', 'ℤ₂ symmetries of the Hamiltonian, such as particle-number parity per spin; each removes one qubit', 'Entanglement', 'The Pauli weight'], 1, 'Conserved Pauli symmetries can be rotated onto single qubits and fixed to their eigenvalues, shrinking the problem.']
  ])
});

/* ---------- H₂ in STO-3G at 0.7414 Å, Jordan–Wigner, 4 qubits (energies in hartree, nuclear repulsion included) ---------- */
const H2 = [['IIII', -0.09706626816762845], ['ZIII', 0.17141282644776884], ['IZII', 0.17141282644776884], ['IIZI', -0.22343153690813597], ['IIIZ', -0.22343153690813597],
  ['ZZII', 0.16868898170361207], ['ZIZI', 0.12062523483390425], ['ZIIZ', 0.16592785033770352], ['IZZI', 0.16592785033770352], ['IZIZ', 0.12062523483390425], ['IIZZ', 0.17441287612261583],
  ['XXYY', -0.045302615503799264], ['XYYX', 0.045302615503799264], ['YXXY', 0.045302615503799264], ['YYXX', -0.045302615503799264]];
const H2_EXACT = -1.137283834;
/* real 16×16 matrix of a Pauli string with an even number of Y (qubit 0 = most significant bit) */
function pauliReal(s) {
  const n = s.length, N = 1 << n, M = new Float64Array(N * N);
  for (let col = 0; col < N; col++) { let row = col, re = 1, im = 0; for (let q = 0; q < n; q++) { const b = (col >> (n - 1 - q)) & 1, c3 = s[q]; if (c3 === 'X') row ^= 1 << (n - 1 - q); else if (c3 === 'Y') { row ^= 1 << (n - 1 - q); const fr = 0, fi = b ? -1 : 1; [re, im] = [re * fr - im * fi, re * fi + im * fr]; } else if (c3 === 'Z' && b) { re = -re; im = -im; } } M[row * N + col] = re; }
  return M;
}
const qwcOK = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== 'I' && b[i] !== 'I' && a[i] !== b[i]) return false; return true; };
function sortedInsertion(terms, compat) {
  const order = terms.map((_, i) => i).sort((a, b) => Math.abs(terms[b][1]) - Math.abs(terms[a][1])), groups = [];
  for (const i of order) { const g = groups.find(gr => gr.every(k => compat(terms[k][0], terms[i][0]))); if (g) g.push(i); else groups.push([i]); }
  return groups;
}
const basisOf = (terms, g) => { const n = terms[g[0]][0].length; let s = ''; for (let q = 0; q < n; q++) { let c3 = 'Z'; for (const k of g) if (terms[k][0][q] !== 'I') { c3 = terms[k][0][q]; break; } s += c3; } return s; };
const groupColor = (k, G) => phaseColor(-TAU * k / Math.max(G, 3));

LESSONS.push({
  id: 'measure', n: 36.3, stage: VQA, minutes: 16, title: 'The measurement bottleneck: grouping terms and budgeting shots',
  lede: 'A variational energy is a weighted sum of many Pauli expectation values, each estimated from repeated measurements. For molecules, the number of shots rather than the number of qubits is often what makes the calculation impractical.',
  html: `
<h2>Energies come from counts</h2>
<p>After a fermion-to-qubit mapping ([[L:mappings]]) a molecular Hamiltonian is a sum ${m('H = Σ<sub>i</sub> c<sub>i</sub>P<sub>i</sub>')} of Pauli strings. A quantum computer cannot read out ${m('⟨H⟩')} directly. Instead each ${m('⟨P<sub>i</sub>⟩')} is estimated by rotating every qubit into the eigenbasis of its Pauli factor (H for X, S†H for Y) and averaging the ±1 outcomes of many shots ([[L:measurement]]). If term ${m('i')} gets ${m('N<sub>i</sub>')} shots, the variance of the energy estimate is</p>
${EQ('Var(Ê) = Σ<sub>i</sub> c<sub>i</sub>² σ<sub>i</sub>² / N<sub>i</sub>, &nbsp;&nbsp; σ<sub>i</sub>² = 1 − ⟨P<sub>i</sub>⟩²')}
<p>Chemistry needs <strong>chemical accuracy</strong>, about 1.6 millihartree, so the statistical error must be at least that small. The number of terms grows as the fourth power of the number of orbitals, from 15 for H₂ in a minimal basis to hundreds of thousands for modest molecules in realistic bases, and the shot count grows with it.</p>
<h2>Measuring many terms at once</h2>
<p>Pauli strings that commute share an eigenbasis, so one set of shots can estimate all of them. The simplest kind is <strong>qubit-wise commuting</strong> (QWC): on every qubit the two strings either agree or one has the identity. ${m('ZIZI')} and ${m('ZZII')} qualify, and both are read from a computational-basis measurement. ${m('XXYY')} and ${m('YYXX')} commute as whole strings but not qubit by qubit; measuring them together needs an entangling Clifford circuit that rotates their common eigenbasis to the computational one.</p>
<p>Partitioning terms into the fewest compatible groups is graph colouring on a conflict graph whose edges join incompatible terms. That is NP-hard in general, but greedy heuristics work well. The lab uses <strong>sorted insertion</strong> (Crawford and colleagues, 2021): take terms in order of decreasing ${m('|c<sub>i</sub>|')} and put each into the first group it is compatible with.</p>
${LAB('groups')}
<h2>Spending shots wisely</h2>
<p>For a fixed total ${m('N')}, minimizing the variance with a Lagrange multiplier gives ${m('N<sub>i</sub> ∝ |c<sub>i</sub>| σ<sub>i</sub>')}: spend more shots on big, uncertain terms. The resulting variance is ${m('(Σ<sub>i</sub>|c<sub>i</sub>|σ<sub>i</sub>)²/N')}, so the shots needed for precision ${m('ε')} are</p>
${EQ('N<sub>shots</sub> = (Σ<sub>i</sub> |c<sub>i</sub>| σ<sub>i</sub>)² / ε²')}
<p>With groups, the same formula applies with ${m('σ<sub>g</sub>² = Var(H<sub>g</sub>)')} for the group sum ${m('H<sub>g</sub>')}, which includes the covariances between its terms. Grouping always cuts the number of distinct circuits, but whether it cuts shots depends on those covariances: positively correlated terms gain little. In H₂ near its ground state the terms inside each group are almost perfectly correlated, as the lab shows.</p>
${LAB('shots')}
<h2>The bigger picture</h2>
<ul>
<li><strong>Factorized measurements</strong> (Huggins and colleagues, 2021) rotate the orbital basis so that each group of terms becomes diagonal, needing only about ${m('N')} measurement bases for ${m('N')} orbitals instead of ${m('N⁴')} terms.</li>
<li><strong>Classical shadows</strong> ([[L:shadows]]) estimate many observables from random measurements, with costs set by the observables’ locality.</li>
<li>Resource analyses of variational chemistry, such as Gonthier and colleagues (2022), concluded that even with the best grouping strategies then available, the number of measurements needed for combustion energies of small organic molecules was too large for practical advantage. Measurement cost is one reason attention has shifted towards phase estimation on fault-tolerant hardware ([[L:qpe]]), where precision ε costs about ${m('1/ε')} rather than ${m('1/ε²')}.</li>
</ul>
`,
  labs: {
    groups: {
      title: 'Grouping Pauli terms by colouring a graph',
      cap: 'Each node is a Pauli term of the Hamiltonian; a grey line joins two terms that cannot be measured together under the chosen rule. Colours are the groups found by sorted insertion, so no line joins two nodes of the same colour. Click a node to highlight its conflicts. Each group is one measurement setting: for qubit-wise commuting groups the setting is a basis letter per qubit, while general commuting groups need an entangling rotation.',
      build(body, id) {
        let pre = 'h2', mode = 'qwc', terms = null, sel = -1;
        const cv = canvas('sq', 'max-width:400px;margin:0 auto'), list = h('div', { class: 'readout', style: 'white-space:normal;max-height:330px;overflow:auto' }), stat = h('div', { class: 'status' });
        const randomH = () => { const out = [], seen = new Set(), n = 6; while (out.length < 36) { const w = 1 + Math.floor(Math.random() * 4), pos = shuffled([0, 1, 2, 3, 4, 5]).slice(0, w), a = Array(n).fill('I'); for (const q of pos) a[q] = 'XYZ'[Math.floor(Math.random() * 3)]; const s = a.join(''); if (seen.has(s)) continue; seen.add(s); out.push([s, randn() / w]); } return out; };
        const setup = () => { terms = pre === 'h2' ? H2.slice(1) : randomH(); sel = -1; upd(); };
        const compat = () => mode === 'qwc' ? qwcOK : mode === 'comm' ? commutes : (a, b) => a === b;
        let groups = [], gof = [];
        const pos = (k, w, H) => { const n = terms.length, R = Math.min(w, H) / 2 - (pre === 'h2' ? 46 : 18), a = -PI / 2 + TAU * k / n; return [w / 2 + R * Math.cos(a), H / 2 + R * Math.sin(a), a]; };
        const p = painter(cv, ({ ctx, w, h: H }) => {
          if (!terms) return; const T = Theme.get(), f = compat(), n = terms.length;
          for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { if (f(terms[a][0], terms[b][0])) continue; const hi = sel === a || sel === b, [x1, y1] = pos(a, w, H), [x2, y2] = pos(b, w, H); ctx.strokeStyle = hi ? T.copper : T.muted; ctx.globalAlpha = hi ? .9 : sel >= 0 ? .08 : .2; ctx.lineWidth = hi ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
          ctx.globalAlpha = 1;
          for (let k = 0; k < n; k++) {
            const [x, y, a] = pos(k, w, H), g = gof[k], same = sel >= 0 && gof[sel] === g;
            dot(ctx, x, y, pre === 'h2' ? 9 : 7, groupColor(g, groups.length), k === sel ? T.ink : same ? T.ink : T.surface);
            if (pre === 'h2' || k === sel) txt(ctx, terms[k][0], x + Math.cos(a) * 34, y + Math.sin(a) * 20, { font: '600 10.5px "JetBrains Mono",monospace', color: k === sel ? T.copper : T.ink });
          }
        });
        dragHandles(cv, (x, y) => { const r = cv.getBoundingClientRect(); let best = -1, bd = 400; for (let k = 0; k < terms.length; k++) { const [px, py] = pos(k, r.width, r.height), d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = k; } } sel = best === sel ? -1 : best; p.inv(); return null; }, () => {});
        const upd = () => {
          groups = sortedInsertion(terms, compat()); gof = []; groups.forEach((g, gi) => g.forEach(k => { gof[k] = gi; }));
          stat.className = 'status good'; stat.textContent = `${terms.length} terms → ${groups.length} measurement setting${groups.length === 1 ? '' : 's'}`;
          list.innerHTML = groups.map((g, gi) => { const isQ = g.every(a => g.every(b => qwcOK(terms[a][0], terms[b][0]))); return `<div style="margin-bottom:6px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${groupColor(gi, groups.length)};margin-right:6px"></span><span class="k">group ${gi + 1} · ${g.length} term${g.length === 1 ? '' : 's'} · ${isQ ? 'measure in ' + basisOf(terms, g) : 'needs an entangling basis change'}</span><br>${g.map(k => terms[k][0]).join(' ')}</div>`; }).join('');
          p.inv();
        };
        body.append(h('div', { class: 'btns' }, seg([{ v: 'h2', label: 'H₂ (4 qubits, 14 terms)' }, { v: 'rand', label: 'Random 6-qubit (36 terms)' }], pre, v => { pre = v; setup(); }, 'Hamiltonian'), btn('New random Hamiltonian', () => { if (pre === 'rand') setup(); }, 'sm')),
          h('div', { class: 'btns' }, seg([{ v: 'none', label: 'One term at a time' }, { v: 'qwc', label: 'Qubit-wise commuting' }, { v: 'comm', label: 'Commuting' }], mode, v => { mode = v; sel = -1; upd(); }, 'Grouping rule')),
          h('div', { class: 'split' }, cv, h('div', { class: 'stack' }, stat, list)));
        setup();
      }
    },
    shots: {
      title: 'How many shots for chemical accuracy?',
      cap: 'The trial state is cos θ|1100⟩ − sin θ|0011⟩, the form of the H₂ ground state; the default θ gives the exact ground energy. Each run of the experiment spends the chosen number of shots according to the strategy and produces one energy estimate; the histogram shows 600 runs. The green band is ±1.6 mHa (chemical accuracy) around the state’s true energy. The bars show, for each strategy, the shots needed for a standard error of 1.6 mHa and the number of distinct circuits.',
      build(body, id) {
        let th = .1128, lgN = 4.5, strat = 'opt';
        const T0 = H2.slice(1), c0 = H2[0][1], MS = T0.map(([s]) => pauliReal(s)), NT = T0.length, EPS = 1.6e-3;
        const GQ = sortedInsertion(T0, qwcOK), GC = sortedInsertion(T0, commutes);
        const groupInfo = gs => gs.map(g => { const M = new Float64Array(256); for (const k of g) for (let i = 0; i < 256; i++) M[i] += T0[k][1] * MS[k][i]; const { w, V } = eigSymV(M, 16); return { g, M, w, V }; });
        const IQ = groupInfo(GQ), IC = groupInfo(GC);
        const cv = canvas('', 'height:240px'), cb = canvas('', 'height:170px'), ro = h('div', { class: 'readout', style: 'white-space:normal' });
        let S = null, hist = null;
        const exp = (M, v) => { let s = 0; for (let i = 0; i < 16; i++) { let r = 0; for (let j = 0; j < 16; j++) r += M[i * 16 + j] * v[j]; s += v[i] * r; } return s; };
        const stats = () => {
          const v = new Float64Array(16); v[12] = Math.cos(th); v[3] = -Math.sin(th);
          const e = MS.map(M => exp(M, v)), sg = e.map(x => Math.sqrt(Math.max(0, 1 - x * x))), E = c0 + T0.reduce((s, t, i) => s + t[1] * e[i], 0);
          const gstat = I => I.map(G => { const mu = exp(G.M, v), M2 = new Float64Array(256); for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { let s = 0; for (let k = 0; k < 16; k++) s += G.M[i * 16 + k] * G.M[k * 16 + j]; M2[i * 16 + j] = s; } const var_ = Math.max(0, exp(M2, v) - mu * mu), pk = []; for (let k = 0; k < 16; k++) { let a = 0; for (let i = 0; i < 16; i++) a += G.V[i * 16 + k] * v[i]; pk.push(a * a); } return { mu, sd: Math.sqrt(var_), pk, w: G.w }; });
          const gq = gstat(IQ), gc = gstat(IC);
          const sumC = T0.reduce((s, t, i) => s + Math.abs(t[1]) * sg[i], 0), sumC2 = T0.reduce((s, t, i) => s + (t[1] * sg[i]) ** 2, 0);
          const need = { eq: NT * sumC2 / EPS ** 2, opt: sumC ** 2 / EPS ** 2, qwc: gq.reduce((s, g) => s + g.sd, 0) ** 2 / EPS ** 2, comm: gc.reduce((s, g) => s + g.sd, 0) ** 2 / EPS ** 2 };
          S = { v, e, sg, E, gq, gc, sumC, need };
        };
        const binomS = (n, pr) => { if (pr <= 0) return 0; if (pr >= 1) return n; if (n <= 200) { let k = 0; for (let i = 0; i < n; i++) if (Math.random() < pr) k++; return k; } return clamp(Math.round(n * pr + Math.sqrt(n * pr * (1 - pr)) * randn()), 0, n); };
        const sampleGroups = (gs, N) => { const tot = gs.reduce((s, g) => s + g.sd, 0) || 1; let E = c0; for (const g of gs) { const n = Math.max(1, Math.round(N * g.sd / tot)); if (n > 200) { E += g.mu + g.sd / Math.sqrt(n) * randn(); continue; } let acc = 0; for (let r = 0; r < n; r++) { let u = Math.random(), k = 0; while (k < 15 && u > g.pk[k]) { u -= g.pk[k]; k++; } acc += g.w[k]; } E += acc / n; } return E; };
        const sampleTerms = (N, opt) => { let E = c0; for (let i = 0; i < NT; i++) { const n = Math.max(1, Math.round(opt ? N * Math.abs(T0[i][1]) * S.sg[i] / S.sumC : N / NT)), k = binomS(n, (1 + S.e[i]) / 2); E += T0[i][1] * (2 * k / n - 1); } return E; };
        const run = () => { const N = Math.round(10 ** lgN), R = 600, out = []; for (let r = 0; r < R; r++) out.push(strat === 'eq' ? sampleTerms(N, false) : strat === 'opt' ? sampleTerms(N, true) : sampleGroups(strat === 'qwc' ? S.gq : S.gc, N)); hist = out; q1.inv(); q2.inv(); text(); };
        const sdOf = k => Math.sqrt(S.need[k] * EPS ** 2 / 10 ** lgN);
        const q1 = painter(cv, ({ ctx, w, h: H }) => {
          if (!hist) return; const T = Theme.get(), sd = sdOf(strat) * 1e3, span = Math.max(4 * sd, 2.6), B = 41, bins = new Array(B).fill(0), lo = -span, bw = 2 * span / B;
          for (const x of hist) { const k = Math.floor(((x - S.E) * 1e3 - lo) / bw); if (k >= 0 && k < B) bins[k]++; }
          const ymax = Math.max(...bins) * 1.15 || 1, st = span > 20 ? 10 : span > 8 ? 4 : span > 4 ? 2 : 1, xt = []; for (let v = -Math.floor(span / st) * st; v <= span; v += st) xt.push(v);
          const A = axes(ctx, w, H, { x: [-span, span], y: [0, ymax], xt, yt: [], xl: 'estimate − true energy (mHa)', yl: 'runs', pad: { l: 18 } });
          ctx.fillStyle = rgba(T.good, .16); ctx.fillRect(A.X(-1.6), A.T, A.X(1.6) - A.X(-1.6), A.B - A.T);
          ctx.fillStyle = rgba(T.cyan, .85); bins.forEach((c3, k) => { if (!c3) return; const x0 = A.X(lo + k * bw), x1 = A.X(lo + (k + 1) * bw); ctx.fillRect(x0 + .5, A.Y(c3), Math.max(1, x1 - x0 - 1), A.B - A.Y(c3)); });
          ctx.strokeStyle = T.copper; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A.X(0), A.T); ctx.lineTo(A.X(0), A.B); ctx.stroke();
          const dg = (H2_EXACT - S.E) * 1e3; if (Math.abs(dg) > .05 && Math.abs(dg) < span) { ctx.setLineDash([4, 3]); ctx.strokeStyle = T.ink; ctx.beginPath(); ctx.moveTo(A.X(dg), A.T); ctx.lineTo(A.X(dg), A.B); ctx.stroke(); ctx.setLineDash([]); txt(ctx, 'exact E₀', A.X(dg) + 4, A.T + 22, { align: 'left', font: '500 10px "JetBrains Mono",monospace' }); }
          txt(ctx, '±1.6 mHa', A.X(1.6) + 4, A.T + 10, { align: 'left', font: '600 10px "JetBrains Mono",monospace', color: T.good });
        });
        const SN = [['eq', 'Each term, equal shots', NT, 'Equal'], ['opt', 'Each term, optimal shots', NT, 'Optimal'], ['qwc', 'QWC groups', GQ.length, 'QWC'], ['comm', 'Commuting groups', GC.length, 'Commuting']];
        const q2 = painter(cb, ({ ctx, w, h: H }) => {
          if (!S) return; const T = Theme.get(), L = w < 460 ? 92 : Math.min(190, w * .42), R = w - 62, x0 = 3, x1 = 6, X = v => L + (Math.log10(clamp(v, 10 ** x0, 10 ** x1)) - x0) / (x1 - x0) * (R - L), rh = (H - 24) / 4;
          for (let e = x0; e <= x1; e++) { ctx.strokeStyle = T.line; ctx.beginPath(); ctx.moveTo(X(10 ** e) + .5, 4); ctx.lineTo(X(10 ** e) + .5, H - 18); ctx.stroke(); txt(ctx, '10' + sup(e), X(10 ** e), H - 8, { font: '500 10px "JetBrains Mono",monospace' }); }
          const short = w < 460; SN.forEach(([k, nm0, nc, sh], r) => { const nm = short ? sh : nm0, y = 4 + r * rh, on = k === strat; ctx.fillStyle = on ? T.copper : rgba(T.muted, .45); ctx.fillRect(L, y + 5, X(S.need[k]) - L, rh - 10); txt(ctx, nm, L - 8, y + rh / 2 - 6, { align: 'right', font: `${on ? 700 : 500} 11px "JetBrains Mono",monospace`, color: on ? T.copper : T.ink }); txt(ctx, `${nc} circuit${nc === 1 ? '' : 's'}`, L - 8, y + rh / 2 + 7, { align: 'right', font: '500 10px "JetBrains Mono",monospace' }); txt(ctx, Math.round(S.need[k]).toLocaleString('en-US'), X(S.need[k]) + 6, y + rh / 2, { align: 'left', font: '600 10.5px "JetBrains Mono",monospace', color: T.ink }); });
        });
        const text = () => { const sd = sdOf(strat), hsd = Math.sqrt(hist.reduce((s, x) => s + (x - S.E) ** 2, 0) / hist.length), inside = hist.filter(x => Math.abs(x - S.E) <= EPS).length / hist.length; ro.innerHTML = `<span class="k">state energy E(θ) </span>${num(S.E, 5)} Ha <span class="k">(exact E₀ ${num(H2_EXACT, 5)})</span><br><span class="k">predicted standard error </span>${num(sd * 1e3, 2)} mHa &nbsp; <span class="k">observed </span>${num(hsd * 1e3, 2)} mHa<br><span class="k">runs within chemical accuracy </span>${pct(inside, 0)}`; };
        const refresh = () => { stats(); run(); };
        body.append(h('div', { class: 'btns' }, seg(SN.map(([v, label]) => ({ v, label })), strat, v => { strat = v; run(); }, 'Strategy'), btn('Run again', run, 'sm')),
          h('div', { class: 'split wide-l' }, h('div', { class: 'stack' }, cv, cb), h('div', { class: 'stack' },
            slider({ id: id('n'), label: 'Total shots per energy estimate', min: 2, max: 6.5, step: .1, value: lgN, fmt: v => Math.round(10 ** v).toLocaleString('en-US'), on: v => { lgN = v; run(); } }),
            slider({ id: id('th'), label: 'Trial-state angle θ', min: 0, max: .5, step: .002, value: th, fmt: v => num(v, 3), on: v => { th = v; refresh(); } }), ro)));
        refresh();
      }
    }
  },
  take: ['VQE energies are sums of Pauli expectation values, each estimated from shots; the variance is Σ cᵢ²σᵢ²/Nᵢ.',
    'Commuting terms can share shots; qubit-wise commuting groups need only single-qubit rotations, general commuting groups need entangling basis changes but are fewer.',
    'Grouping is graph colouring on a conflict graph; greedy sorted insertion works well in practice.',
    'Optimal allocation Nᵢ ∝ |cᵢ|σᵢ gives N = (Σ|cᵢ|σᵢ)²/ε² shots; for real molecules this can be prohibitive, motivating factorized measurements, shadows and phase estimation.'],
  quiz: QZ([
    ['How is ⟨XXYY⟩ measured on hardware?', ['Directly, with no extra gates', 'Rotate qubits 0 and 1 with H and qubits 2 and 3 with S†H, measure in the computational basis, and average the product of the ±1 outcomes', 'By measuring only qubit 0', 'It cannot be measured'], 1, 'Single-qubit rotations map each Pauli factor to Z, and the eigenvalue of the string is the product of the four outcomes.'],
    ['If term i receives Nᵢ shots, what is its contribution to the variance of the energy estimate?', ['cᵢ/Nᵢ', 'cᵢ²(1 − ⟨Pᵢ⟩²)/Nᵢ', '1/Nᵢ²', 'cᵢ²Nᵢ'], 1, 'A ±1 outcome has variance 1 − ⟨P⟩², and averaging Nᵢ shots divides it by Nᵢ.'],
    ['When do two Pauli strings qubit-wise commute?', ['When they are equal', 'When on every qubit their factors are equal or one of them is the identity', 'When they commute as whole operators', 'Always'], 1, 'Then a single product basis, one letter per qubit, diagonalizes both.'],
    ['XXYY and YYXX commute but are not qubit-wise commuting. What does measuring them together require?', ['Nothing', 'An entangling Clifford circuit that rotates their joint eigenbasis to the computational basis', 'A T gate on every qubit', 'Separate experiments'], 1, 'They anticommute on each of the four qubits, an even number in total, so they commute, but no product basis diagonalizes both.'],
    ['How does sorted insertion build groups?', ['Randomly', 'Take terms in order of decreasing |cᵢ| and put each into the first existing group it is compatible with, or start a new group', 'By solving graph colouring exactly', 'By grouping terms of equal weight'], 1, 'It is a greedy colouring that favours putting large terms together, which tends to reduce variance.'],
    ['What is the optimal shot allocation across terms for a fixed total budget?', ['Equal shots for every term', 'Nᵢ ∝ |cᵢ|σᵢ', 'Nᵢ ∝ cᵢ²', 'All shots on the largest term'], 1, 'Minimizing Σcᵢ²σᵢ²/Nᵢ subject to ΣNᵢ = N with a Lagrange multiplier gives this rule.'],
    ['How do the shots needed scale with the target precision ε?', ['1/ε', '1/ε²', 'log(1/ε)', 'Independent of ε'], 1, 'Statistical errors fall as 1/√N, so halving ε costs four times as many shots; phase estimation scales as 1/ε instead.'],
    ['In the H₂ lab, why does grouping barely reduce the shots needed even though it reduces circuits?', ['Grouping is broken', 'Terms inside each group are almost perfectly correlated in this state, so measuring them together gives little extra information', 'H₂ has no commuting terms', 'Because chemical accuracy is too strict'], 1, 'With positive covariance, Var(Σcᵢ Pᵢ) is close to (Σ|cᵢ|σᵢ)², the same as measuring terms separately with optimal allocation.'],
    ['How does the number of Hamiltonian terms grow with the number of orbitals N?', ['Linearly', 'As about N⁴, from the two-electron integrals', 'Logarithmically', 'It is constant'], 1, 'Terms a†ₚa†_qa_ra_s have four indices, so their number grows quartically before symmetries and truncation.'],
    ['Which approach reduces the number of measurement bases for chemistry to about N?', ['Measuring every term separately', 'Factorizing the two-electron integrals and rotating the orbital basis so groups of terms become diagonal', 'Using more qubits', 'Lowering the precision'], 1, 'Basis-rotation grouping (Huggins and colleagues, 2021) uses low-rank factorizations to need only O(N) distinct measurement settings.']
  ])
});

window.GLOSSARY_EXTRA.push(
  ['Pauli weight', 'The number of non-identity factors in a Pauli string; it sets the cost of exponentiating or measuring the string.', 'mappings'],
  ['Parity mapping', 'A fermion-to-qubit encoding in which qubit j stores the parity of modes 0 to j.', 'mappings'],
  ['Bravyi–Kitaev transformation', 'A fermion-to-qubit encoding based on a binary (Fenwick) tree, giving operators of weight O(log N).', 'mappings'],
  ['Qubit tapering', 'Removing qubits from a mapped Hamiltonian by fixing the eigenvalues of its ℤ₂ Pauli symmetries.', 'mappings'],
  ['Qubit-wise commuting', 'Two Pauli strings whose factors agree or are the identity on every qubit, so one product basis measures both.', 'measure'],
  ['Measurement grouping', 'Partitioning Hamiltonian terms into sets that can be measured with the same circuit, usually by graph colouring.', 'measure'],
  ['Sorted insertion', 'A greedy grouping heuristic: take terms by decreasing coefficient and add each to the first compatible group.', 'measure'],
  ['Shot allocation', 'Distributing a fixed number of measurements among terms or groups to minimize the variance of an estimate; optimally Nᵢ ∝ |cᵢ|σᵢ.', 'measure']
);
})();
