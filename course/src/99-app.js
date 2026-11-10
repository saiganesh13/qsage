/* =====================================================================
   QSage Learn · app shell
   Modules, routing, overview, module pages, lessons, quiz, glossary
   ===================================================================== */
const STAGES = [
  { temp: '300 K', name: 'Room temperature', title: 'Foundations', w: '62px', blurb: 'What a qubit is, complex amplitudes, measurement and the Stern–Gerlach experiment, the double slit and the quantum eraser, the Bloch sphere, the linear algebra underneath it all, mixed states and density matrices, and qudits.' },
  { temp: '4 K', name: '4 K plate', title: 'Building blocks', w: '54px', blurb: 'Gates as rotations and as microwave pulses, interference, many qubits, reversible logic with the Toffoli gate, the Pauli and Clifford groups, universal gate sets, the limits of telling states apart, and the swap test.' },
  { temp: '800 mK', name: 'Still', title: 'Entanglement and communication', w: '46px', blurb: 'Bell pairs and GHZ states, measuring entanglement, a full circuit simulator, superdense coding, teleportation, cluster states and measurement-based computing, entanglement swapping and repeaters, BB84, E91 and device-independent key distribution.' },
  { temp: '100 mK', name: 'Cold plate', title: 'Algorithms', w: '38px', blurb: 'Phase kickback, Grover’s search, quantum walks, the QFT, quantum adders and Shor’s algorithm, amplitude estimation, adiabatic computing and variational methods.' },
  { temp: '10 mK', name: 'Mixing chamber', title: 'Real machines', w: '30px', blurb: 'Noise, benchmarking, error mitigation, error correction, the hardware platforms (superconducting circuits, trapped ions, neutral atoms, photons and silicon spins), how they are read out, the dilution refrigerator and its wiring, and an honest account of what quantum computers can and cannot do.' }
];
const TRACKS = [
  { code: 'QEC', title: 'Error correction and fault tolerance', featured: true, blurb: 'The largest track. Stabilizer codes, the toric code and anyons, simulating codes at scale, matching and union–find decoders, noise models, thresholds and erasure qubits, fault-tolerant gadgets, lattice surgery, magic states, colour codes, Bacon–Shor subsystem codes, Floquet codes, hypergraph-product and bivariate-bicycle qLDPC codes, bosonic codes and resource estimates.' },
  { code: 'ALG', title: 'Algorithms and complexity', blurb: 'Query complexity and lower bounds, phase estimation and Hamiltonian simulation, quantum signal processing and QSVT, HHL and its fine print, dequantization, the hidden subgroup problem, boson sampling, quantum annealing, complexity classes and tests of quantum advantage.' },
  { code: 'SIM', title: 'Simulation methods', blurb: 'State vectors versus Feynman path sums, density matrices and noise channels, quantum trajectories, exact diagonalization with Lanczos, the sign problem in quantum Monte Carlo, tensor networks, analog simulators, discrete time crystals, light cones and the entanglement barrier.' },
  { code: 'CMP', title: 'Compilers and architecture', blurb: 'The software stack from algorithm to pulses, circuit optimization, the ZX-calculus, Clifford+T synthesis, routing, pulse-level control with DRAG, dynamic circuits, randomized compiling, distributed architectures and circuit cutting.' },
  { code: 'VQA', title: 'Chemistry and quantum machine learning', blurb: 'Electrons on qubits, Jordan–Wigner versus Bravyi–Kitaev, the VQE measurement bottleneck, ADAPT-VQE, QAOA, quantum neural networks and QCNNs, quantum kernels and QSVMs, QGANs, Born machines, quantum autoencoders, quantum reservoir computing and quantum PCA.' },
  { code: 'QIT', title: 'Information theory and cryptography', blurb: 'Entropy and Holevo’s bound, channel capacities, no-cloning and optimal copying machines, quantum metrology, classical shadows, blind computing, quantum money, contextuality and the Peres–Mermin square, entanglement purification, post-quantum cryptography and the lattices beneath it.' }
];
const TOOLKIT = [
  { code: 'LIN', title: 'Linear algebra for quantum computing', blurb: 'The mathematics underneath every lesson, built from scratch with pictures: vectors and Dirac notation, inner products and orthogonality, matrices as maps, eigenvalues and eigenvectors, Hermitian and unitary matrices, tensor products, outer products, projectors and the trace, matrix exponentials, and the singular value and Schmidt decompositions.' }
];
/* Group indices: 0–4 core-path stages, 5–10 research tracks, 11 the math toolkit (shown first). */
const GROUPS = STAGES.map(s => Object.assign({ part: 1, code: s.temp }, s)).concat(TRACKS.map(t => Object.assign({ part: 2, temp: t.code }, t))).concat(TOOLKIT.map(t => Object.assign({ part: 0, temp: t.code }, t)));
const GRANK = i => GROUPS[i].part === 0 ? i - 100 : i;
const GORDER = GROUPS.map((g, i) => i).sort((a, b) => GRANK(a) - GRANK(b));
const PART_LABEL = { 0: 'Part 1 · Math toolkit', 1: 'Part 2 · Core path', 2: 'Part 3 · Research tracks' };
const PART_NO = { 0: 1, 1: 2, 2: 3 }, PART_OF_NO = { 1: 0, 2: 1, 3: 2 };
const PART_NAME = { 0: 'Math toolkit', 1: 'Core path', 2: 'Research tracks' };
const PART_SUB = { 0: 'Start with the math', 1: 'From 300 K to 10 mK', 2: 'Into current research' };
window.GLOSSARY = window.GLOSSARY.concat(window.GLOSSARY_EXTRA || []).sort((a, b) => a[0].localeCompare(b[0]));

/* n is only a sort key inside a group; lessons are renumbered 1…N, and cross-references
   written as [[L:id]], [[N:id]] or [[TR:group]] are resolved to the final numbers. */
LESSONS.sort((a, b) => GRANK(a.stage) - GRANK(b.stage) || a.n - b.n);
LESSONS.forEach((l, i) => { l.n = i + 1; });
(function resolveRefs() {
  const byId = {}; LESSONS.forEach(l => { byId[l.id] = l; });
  const res = (s, link) => typeof s !== 'string' ? s : s.replace(/\[\[(L|N|TR):([a-z0-9]+)\]\]/g, (all, k, v) => {
    if (k === 'TR') { const ls = LESSONS.filter(l => l.stage === +v); if (!ls.length) return all; const t = `Lessons ${ls[0].n}–${ls[ls.length - 1].n}`; return link ? `<a href="#${ls[0].id}">${t}</a>` : t; }
    const L = byId[v]; if (!L) { console.warn('Unknown lesson reference', v); return all; }
    const t = k === 'L' ? `Lesson ${L.n}` : String(L.n);
    return link ? `<a href="#${L.id}">${t}</a>` : t;
  });
  LESSONS.forEach(l => {
    l.html = res(l.html, true); l.lede = res(l.lede); l.take = l.take.map(t => res(t));
    l.quiz.forEach(q => { q.q = res(q.q); q.o = q.o.map(o => res(o)); q.why = res(q.why, true); });
    Object.values(l.labs).forEach(d => { d.cap = res(d.cap); });
  });
})();

/* ---------- modules ---------- */
const MODULES = GORDER.map((gi, k) => {
  const g = GROUPS[gi], ls = LESSONS.filter(l => l.stage === gi);
  return { gi, no: k + 1, g, ls,
    labs: ls.reduce((s, l) => s + Object.keys(l.labs).length, 0),
    minutes: ls.reduce((s, l) => s + (l.minutes || 0), 0),
    qs: ls.reduce((s, l) => s + l.quiz.length, 0) };
});
const MOD_OF = {}; MODULES.forEach(m => m.ls.forEach(l => { MOD_OF[l.id] = m; }));
const LAB_COUNT = MODULES.reduce((s, m) => s + m.labs, 0);
const Q_COUNT = MODULES.reduce((s, m) => s + m.qs, 0);
const pad2 = n => String(n).padStart(2, '0');
const modTag = m => m.g.part === 1 ? m.g.temp : m.g.code;
const modKind = m => m.g.part === 1 ? (m.g.name.includes(m.g.temp) ? m.g.name : `${m.g.temp} · ${m.g.name}`) : m.g.part === 2 ? 'Research track' : 'Math toolkit';
function fmtDur(min) { const hh = Math.floor(min / 60), mm = min % 60; return hh ? `${hh} h${mm ? ' ' + mm + ' min' : ''}` : `${mm} min`; }
const fmtInt = n => n.toLocaleString('en-US');

/* ---------- progress (stored only in this browser) ---------- */
const Prog = {
  key: 'qsage-progress-v1', d: { seen: {}, done: {}, best: {}, notes: {}, last: null },
  load() {
    try { const s = localStorage.getItem(this.key); if (s) { const o = JSON.parse(s); this.d = { seen: o.seen || {}, done: o.done || {}, best: o.best || {}, notes: o.notes || {}, last: o.last || null }; } }
    catch (e) { /* storage unavailable */ }
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.d)); } catch (e) { /* storage unavailable */ } },
  seen(id) { this.d.seen[id] = 1; this.d.last = id; this.save(); },
  done(id) { this.d.done[id] = 1; this.save(); },
  best(id, s) { if (!(this.d.best[id] >= s)) { this.d.best[id] = s; this.save(); } },
  state(id) { return this.d.done[id] ? 'done' : this.d.seen[id] ? 'seen' : ''; },
  count(ls = LESSONS) { return ls.filter(l => this.d.done[l.id]).length; },
  note(id, qi) { return (this.d.notes[id] && this.d.notes[id][qi]) || ''; },
  setNote(id, qi, text) {
    if (!this.d.notes[id]) this.d.notes[id] = {};
    if (text.trim()) this.d.notes[id][qi] = text; else delete this.d.notes[id][qi];
    clearTimeout(this.t); this.t = setTimeout(() => this.save(), 400);
  }
};
const STATE_LABEL = { done: 'Completed', seen: 'Started', '': 'Not started' };
function continueLesson() {
  const last = LESSONS.find(l => l.id === Prog.d.last);
  if (last && !Prog.d.done[last.id]) return last;
  const from = last ? LESSONS.indexOf(last) : 0;
  return LESSONS.slice(from).find(l => !Prog.d.done[l.id]) || LESSONS.find(l => !Prog.d.done[l.id]) || LESSONS[0];
}

/* ---------- small UI pieces ---------- */
const ICONS = {
  check: '<path d="M4.5 12.5l5 5L19.5 7"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  chevR: '<path d="M9 6l6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  lab: '<path d="M9.5 3h5M10.5 3v6.2L5 18.6A1.6 1.6 0 0 0 6.4 21h11.2a1.6 1.6 0 0 0 1.4-2.4L13.5 9.2V3"/><path d="M7.4 15h9.2"/>',
  quiz: '<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.6a2.4 2.4 0 1 1 3.3 2.2c-.6.3-1 .8-1 1.5v.3"/><path d="M12 16.6v.1"/>',
  book: '<path d="M12 6.5C10.3 5.2 8 4.5 4 4.5v13c4 0 6.3.7 8 2 1.7-1.3 4-2 8-2v-13c-4 0-6.3.7-8 2z"/><path d="M12 6.5v13"/>',
  read: '<path d="M5 5h14M5 9.5h14M5 14h9M5 18.5h6"/>',
  bulb: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.4 10.9c.6.5.9 1.1.9 1.8v.3h5v-.3c0-.7.3-1.3.9-1.8A6 6 0 0 0 12 3z"/>',
  pen: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 7.5l2 2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  retry: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  abc: '<path d="M4 17l3.5-10L11 17M5.2 13.6h4.6"/><path d="M14 7h3.2a2.4 2.4 0 0 1 0 4.8H14zm0 4.8h3.8a2.6 2.6 0 0 1 0 5.2H14z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'
};
function ico(name, size = 18) {
  const s = document.createElement('span'); s.className = 'ico'; s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return s;
}
function ring(frac, size = 64, stroke = 6, text = '', label = '') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, mid = size / 2;
  const el = h('span', { class: 'ring', style: `width:${size}px;height:${size}px`, role: label ? 'img' : null, 'aria-label': label || null });
  el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
    <circle class="fg" cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke="var(--brand)" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - Math.max(0, Math.min(1, frac)))).toFixed(2)}" transform="rotate(-90 ${mid} ${mid})"/></svg>`;
  if (text) el.append(h('b', { 'aria-hidden': label ? 'true' : null, style: size > 90 ? 'font-size:26px' : '' }, text));
  return el;
}
const pbar = (frac, label) => h('span', { class: 'pbar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(frac * 100)), 'aria-label': label || 'Progress' },
  h('i', { style: `width:${(frac * 100).toFixed(1)}%` }));
const sdot = (l, text) => h('span', { class: 'sdot', 'data-s': Prog.state(l.id), title: STATE_LABEL[Prog.state(l.id)] }, Prog.d.done[l.id] ? ico('check', 14) : text);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function scrollToEl(el) { if (el) el.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); }

/* ---------- theme toggle ---------- */
document.getElementById('themeBtn').addEventListener('click', () => {
  const root = document.documentElement, next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('qsage-theme', next); } catch (e) { /* storage unavailable */ }
});

/* ---------- side panel + drawer ---------- */
const learnEl = document.getElementById('learn'), sideEl = document.getElementById('modSide'), drawerNav = document.getElementById('navDrawer');
const drawer = document.getElementById('drawer');
let drawerReturn = null;
function openDrawer(from) { drawerReturn = from || null; drawer.hidden = false; const a = drawer.querySelector('[aria-current="page"]') || drawer.querySelector('a'); a && a.focus(); }
function closeDrawer() { if (drawer.hidden) return; drawer.hidden = true; if (drawerReturn && drawerReturn.isConnected) drawerReturn.focus(); drawerReturn = null; }
drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDrawer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });

function buildSide(m, cur) {
  const d = Prog.count(m.ls);
  const sel = h('select', { class: 'side-sel', 'aria-label': 'Switch module' },
    ...[0, 1, 2].map(p => h('optgroup', { label: PART_LABEL[p] },
      ...MODULES.filter(x => x.g.part === p).map(x => h('option', { value: String(x.no), selected: x === m }, `Module ${pad2(x.no)} · ${x.g.title}`)))));
  sel.addEventListener('change', () => { location.hash = 'module/' + sel.value; });
  return h('div', null,
    h('a', { class: 'side-back', href: '#' }, ico('grid', 16), 'All modules'),
    partNav(m.g.part, true),
    sel,
    h('div', { class: 'side-mod' },
      h('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px' }, h('span', { class: 'mcard-no' }, `Module ${pad2(m.no)}`), h('span', { class: 'tag' }, modTag(m))),
      h('h2', null, h('a', { href: '#module/' + m.no, style: 'text-decoration:none;color:inherit' }, m.g.title)),
      h('div', { class: 'row' }, pbar(d / m.ls.length, `${d} of ${m.ls.length} lessons complete`), `${d}/${m.ls.length}`)),
    h('ol', { class: 'side-list' }, ...m.ls.map((l, i) => h('li', null,
      h('a', { href: '#' + l.id, 'aria-current': cur && cur.id === l.id ? 'page' : false },
        sdot(l, String(i + 1)), h('span', null, l.title), h('span', { class: 'min' }, l.minutes + 'm'))))),
    h('div', { class: 'side-foot' },
      h('a', { href: '#glossary' }, ico('abc', 18), 'Glossary'),
      h('a', { href: '#module/' + m.no }, ico('book', 18), 'Module overview')));
}
function setSide(m, cur) {
  learnEl.classList.toggle('has-side', !!m);
  sideEl.innerHTML = ''; drawerNav.innerHTML = '';
  if (!m) return;
  sideEl.append(buildSide(m, cur)); drawerNav.append(buildSide(m, cur));
}

/* ---------- part navigation (Part 1 · 2 · 3) ---------- */
function partLink(p) { return '#part/' + PART_NO[p]; }
function partNav(cur, compact) {
  return h('nav', { class: 'partnav' + (compact ? ' compact' : ''), 'aria-label': 'Course parts' }, ...[0, 1, 2].map(p => {
    const ms = MODULES.filter(m => m.g.part === p), nls = ms.reduce((s, m) => s + m.ls.length, 0);
    const done = ms.reduce((s, m) => s + Prog.count(m.ls), 0);
    return h('a', { href: partLink(p), 'data-part': String(p), 'aria-current': cur === p ? 'true' : 'false' },
      h('small', null, `Part ${PART_NO[p]}`),
      h('b', null, PART_NAME[p]),
      compact ? null : h('span', { class: 'pn-meta' }, `${ms.length} module${ms.length > 1 ? 's' : ''} · ${nls} lessons`),
      compact ? null : h('span', { class: 'pbar', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.round(done / nls * 100)}%` })));
  }));
}

/* ---------- overview ---------- */
function modCard(m) {
  const d = Prog.count(m.ls), n = m.ls.length, first = m.ls.find(l => !Prog.d.done[l.id]) || m.ls[0];
  return h('article', { class: 'mcard' + (m.g.featured ? ' feat' : '') + (d === n ? ' done' : '') },
    h('div', { class: 'mcard-top' }, h('span', { class: 'mcard-no' }, `Module ${pad2(m.no)}`), h('span', { class: 'tag' }, modTag(m))),
    h('h3', null, h('a', { href: '#module/' + m.no }, m.g.title)),
    h('p', { class: 'mcard-blurb' }, m.g.blurb),
    h('div', { class: 'meta' }, h('span', null, ico('book', 16), `${n} lessons`), h('span', null, ico('lab', 16), `${m.labs} labs`), h('span', null, ico('clock', 16), fmtDur(m.minutes))),
    h('div', { class: 'mcard-prog' }, pbar(d / n, `${m.g.title}: ${d} of ${n} lessons complete`), `${d}/${n}`),
    h('div', { class: 'mcard-actions' },
      h('a', { class: 'btn pri sm', href: '#' + first.id }, d === 0 ? 'Start module' : d === n ? 'Review' : 'Continue', ico('arrowR', 16)),
      h('a', { class: 'btn ghost sm', href: '#module/' + m.no }, 'All lessons')));
}
function renderOverview(main) {
  setSide(null);
  const done = Prog.count(), total = LESSONS.length, up = continueLesson(), started = Object.keys(Prog.d.seen).length > 0;

  const cv = canvas('sq'), bv = new BlochView(cv, { aria: 'Interactive Bloch sphere' }); let st = [0, 0, 1];
  const ketEl = h('div', { class: 'ketline', style: 'text-align:center' });
  const show = () => { ketEl.textContent = '|ψ⟩ = ' + ketOfBloch(st); };
  const gate = g => { st = V.rot(st, ROT[g].axis, ROT[g].ang); bv.rotate(ROT[g].axis, ROT[g].ang, 700); show(); };
  bv.set(st); show();
  const tryBox = h('div', { class: 'try' },
    h('div', { class: 'try-head' }, h('b', null, 'Try it: rotate a qubit'), h('span', { class: 'tag' }, 'Live lab')),
    cv,
    h('div', { class: 'btns', style: 'justify-content:center' }, ...['H', 'X', 'Y', 'Z', 'S', 'T'].map(g => gateBtn(g, () => gate(g), 'Apply ' + g)),
      btn('Reset', () => { st = [0, 0, 1]; bv.cancel(); bv.moveTo(st, 500).then(() => bv.clearTrail()); show(); }, 'sm')),
    ketEl, h('p', { class: 'hint', style: 'text-align:center;margin:0' }, 'Tap a gate to rotate the qubit. Drag the sphere to look around.'));

  main.append(h('section', { class: 'ov-hero' },
    h('div', null,
      h('span', { class: 'eyebrow' }, ico('book', 16), 'QSage Learn'),
      h('h1', null, 'Quantum computing, module by module'),
      h('p', { class: 'ov-lede' }, 'Twelve modules that follow a quantum computer from room temperature down to ten millikelvin, then out into current research. Every lesson mixes live labs with a ten-question check, and every answer comes with its reasoning.'),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', null, String(MODULES.length)), h('span', null, 'modules')),
        h('div', { class: 'stat' }, h('b', null, String(total)), h('span', null, 'lessons')),
        h('div', { class: 'stat' }, h('b', null, String(LAB_COUNT)), h('span', null, 'live labs')),
        h('div', { class: 'stat' }, h('b', null, fmtInt(Q_COUNT)), h('span', null, 'questions'))),
      h('div', { class: 'resume' },
        ring(done / total, 64, 6, `${Math.round(done / total * 100)}%`, `${done} of ${total} lessons complete`),
        h('div', { class: 'resume-text' }, h('small', null, started ? `${done} of ${total} lessons complete · ${MOD_OF[up.id].g.title}` : 'New here? Start with the math toolkit, or jump straight to 300 K.'),
          h('b', null, started ? up.title : 'Begin with Module 01')),
        h('div', { class: 'btns' },
          h('a', { class: 'btn pri', href: '#' + up.id }, started ? 'Continue' : 'Start learning', ico('arrowR', 16)),
          started ? null : h('a', { class: 'btn', href: '#' + MODULES[1].ls[0].id }, 'Start at 300 K')))),
    tryBox));

  const partHead = (eyebrow, title, text) => h('div', { class: 'part-head' }, h('div', null, h('span', { class: 'eyebrow' }, eyebrow), h('h2', null, title)), h('p', null, text));
  const byPart = p => MODULES.filter(m => m.g.part === p);

  const pnav = partNav(-1);
  main.append(h('div', { class: 'partnav-wrap' }, pnav));
  main.append(h('section', { class: 'part', id: 'part-1', 'aria-label': PART_LABEL[0] },
    partHead(PART_LABEL[0], PART_SUB[0], 'Linear algebra is the language of quantum computing. If vectors, matrices or tensor products feel rusty, begin here. If not, skip ahead and come back when you need a refresher.'),
    h('div', { class: 'mgrid' }, ...byPart(0).map(m => { const c = modCard(m); c.classList.add('feat'); return c; }))));

  const descent = h('div', { class: 'descent' });
  byPart(1).forEach(m => descent.append(h('div', { class: 'dsc' },
    h('div', { class: 'dsc-temp' }, h('b', null, m.g.temp), h('small', null, m.g.name)),
    h('div', { class: 'dsc-rail', 'aria-hidden': 'true' }, h('span', { class: 'dsc-plate', style: `--w:${m.g.w}` }), h('i')),
    modCard(m))));
  main.append(h('section', { class: 'part', id: 'part-2', 'aria-label': PART_LABEL[1] },
    partHead(PART_LABEL[1], PART_SUB[1], 'Five modules follow the same route as the qubits in a real machine. Each stage is colder than the last and each module goes a little deeper, from a single qubit to error-corrected hardware.'),
    descent));

  main.append(h('section', { class: 'part', id: 'part-3', 'aria-label': PART_LABEL[2] },
    partHead(PART_LABEL[2], PART_SUB[2], 'Six tracks into where the field is working now. They assume the core path and use the same live labs, with the most room given to error correction and fault tolerance.'),
    h('div', { class: 'mgrid tracks' }, ...byPart(2).map(modCard))));

  const legBloch = canvas('sq', 'max-width:150px'), lb = new BlochView(legBloch, { labels: 'min', drag: false, trail: false }); lb.set([S2 * .9, S2 * .9 * .3, .55]);
  const circ = h('div', { class: 'circ-wrap', style: 'background:var(--bg)' }); circ.append(drawCircuit(2, [[{ g: 'H', q: 0 }], [{ g: 'CX', c: 0, t: 1 }]], { cw: 60, aria: 'Example circuit' }).svg);
  const wheel = h('div', { class: 'wheel', style: wheelStyle() }); Scope.theme(() => { wheel.style.cssText = wheelStyle(); });
  main.append(h('section', { class: 'part', 'aria-label': 'Reading the pictures' },
    partHead('Reading the pictures', 'Three conventions used everywhere', 'The labs share one visual language. Learn these three and every picture in the course reads the same way.'),
    h('div', { class: 'legend-grid' },
      h('div', { class: 'legend-item' }, h('div', { style: 'display:flex;gap:12px;align-items:center' }, wheel, h('h3', null, 'Colour is phase')),
        h('p', null, 'Bar heights show probability. Colour shows the phase of the amplitude: blue for positive real numbers, orange-red for negative ones, other hues for complex phases.')),
      h('div', { class: 'legend-item' }, legBloch, h('h3', null, 'The copper arrow is the state'),
        h('p', null, 'On every Bloch sphere the north pole is |0⟩ and the south pole is |1⟩. An arrow shorter than the radius means the qubit is noisy or entangled.')),
      h('div', { class: 'legend-item' }, circ, h('h3', null, 'Circuits read left to right'),
        h('p', null, 'Each wire is a qubit starting in |0⟩. The top wire, q0, is the leftmost digit of every ket, so |10⟩ means q0 = 1 and q1 = 0.'))),
    h('div', { class: 'cta-card' },
      h('div', null, h('h3', null, 'Glossary'), h('p', null, `${window.GLOSSARY.length} short definitions, each linked to the lesson that explains it.`)),
      h('a', { class: 'btn', href: '#glossary' }, 'Open the glossary', ico('arrowR', 16)))));

  const secs = [0, 1, 2].map(p => document.getElementById('part-' + PART_NO[p]));
  const onScroll = () => {
    const y = ((document.querySelector('.qs-top') || {}).offsetHeight || 68) + 140;
    let cur = -1; secs.forEach((s, p) => { if (s && s.getBoundingClientRect().top <= y) cur = p; });
    pnav.querySelectorAll('a').forEach(a => a.setAttribute('aria-current', String(+a.dataset.part === cur)));
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  spyOff = () => window.removeEventListener('scroll', onScroll);
}
function scrollToPart(n) {
  const el = document.getElementById('part-' + n); if (!el) return;
  const off = ((document.querySelector('.qs-top') || {}).offsetHeight || 68) + 96;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

/* ---------- module page ---------- */
function renderModule(m, main) {
  setSide(null);
  const d = Prog.count(m.ls), n = m.ls.length, next = m.ls.find(l => !Prog.d.done[l.id]) || m.ls[0];
  const prev = MODULES[m.no - 2], after = MODULES[m.no];
  main.append(h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#' }, 'Learn'), ico('chevR', 14), h('a', { href: partLink(m.g.part) }, PART_LABEL[m.g.part]), ico('chevR', 14), h('span', { 'aria-current': 'page' }, `Module ${pad2(m.no)}`)));
  main.append(h('header', { class: 'mhero' },
    h('div', { class: 'mhero-copy' },
      h('div', { class: 'lh-eyebrow' }, h('span', { class: 'eyebrow' }, `Module ${pad2(m.no)} · ${PART_LABEL[m.g.part]}`), h('span', { class: 'tag' }, modKind(m))),
      h('h1', null, m.g.title),
      h('p', null, m.g.blurb),
      h('div', { class: 'meta' }, h('span', null, ico('book', 16), `${n} lessons`), h('span', null, ico('lab', 16), `${m.labs} live labs`), h('span', null, ico('quiz', 16), `${m.qs} questions`), h('span', null, ico('clock', 16), fmtDur(m.minutes))),
      h('div', { class: 'btns', style: 'margin-top:6px' }, h('a', { class: 'btn pri lg', href: '#' + next.id }, d === 0 ? 'Start the first lesson' : d === n ? 'Review from the start' : `Continue: ${next.title}`, ico('arrowR', 18)))),
    h('div', { class: 'mhero-prog' }, ring(d / n, 132, 10, `${d}/${n}`, `${d} of ${n} lessons complete`), h('span', null, 'lessons complete'))));
  main.append(h('ol', { class: 'steps', 'aria-label': 'Lessons in this module' }, ...m.ls.map((l, i) => {
    const nl = Object.keys(l.labs).length, best = Prog.d.best[l.id];
    return h('li', null, h('a', { class: 'step', href: '#' + l.id },
      sdot(l, pad2(i + 1)),
      h('div', { style: 'min-width:0' }, h('h3', null, l.title), h('p', null, l.lede),
        h('div', { class: 'meta' }, h('span', null, ico('clock', 15), `${l.minutes} min`), h('span', null, ico('lab', 15), `${nl} lab${nl > 1 ? 's' : ''}`),
          h('span', null, ico('quiz', 15), best != null ? `Best ${best}/${l.quiz.length}` : `${l.quiz.length}-question check`),
          Prog.d.done[l.id] ? h('span', { style: 'color:var(--good)' }, ico('check', 15), 'Complete') : null)),
      ico('arrowR', 20)));
  })));
  main.append(h('nav', { class: 'pn', 'aria-label': 'Other modules' },
    prev ? h('a', { href: '#module/' + prev.no }, h('small', null, ico('arrowL', 14), `Module ${pad2(prev.no)}`), h('span', null, prev.g.title)) : h('a', { href: '#' }, h('small', null, ico('arrowL', 14), 'Back to'), h('span', null, 'All modules')),
    after ? h('a', { class: 'next', href: '#module/' + after.no }, h('small', null, `Module ${pad2(after.no)}`, ico('arrowR', 14)), h('span', null, after.g.title)) : h('a', { class: 'next', href: '#glossary' }, h('small', null, 'Reference', ico('arrowR', 14)), h('span', null, 'Glossary'))));
}

/* ---------- lesson page ---------- */
let spyOff = null;
function renderLesson(L, main) {
  const m = MOD_OF[L.id], idx = m.ls.indexOf(L), nl = Object.keys(L.labs).length;
  setSide(m, L);
  const barBtn = h('button', { class: 'mod-bar', type: 'button', 'aria-controls': 'drawer' }, ico('menu', 20),
    h('span', null, h('small', null, `Module ${pad2(m.no)} · ${m.g.title}`), h('b', null, `Lesson ${idx + 1} of ${m.ls.length}`)), ico('chevD', 18));
  barBtn.addEventListener('click', () => openDrawer(barBtn));
  main.append(barBtn);
  main.append(h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#' }, 'Learn'), ico('chevR', 14),
    h('a', { href: partLink(m.g.part) }, `Part ${PART_NO[m.g.part]}`), ico('chevR', 14),
    h('a', { href: '#module/' + m.no }, `Module ${pad2(m.no)} · ${m.g.title}`), ico('chevR', 14), h('span', { 'aria-current': 'page' }, `Lesson ${idx + 1}`)));
  main.append(h('header', { class: 'lh' },
    h('div', { class: 'lh-eyebrow' }, h('span', { class: 'eyebrow' }, `Lesson ${idx + 1} of ${m.ls.length}`), h('span', { class: 'tag' }, modTag(m)),
      Prog.d.done[L.id] ? h('span', { class: 'tag', style: 'background:var(--good-soft);color:var(--good)' }, ico('check', 14), 'Complete') : null),
    h('h1', null, L.title), h('p', { class: 'lede' }, L.lede),
    h('div', { class: 'chips' }, h('span', { class: 'chip' }, ico('clock', 16), `${L.minutes} min`), h('span', { class: 'chip' }, ico('lab', 16), `${nl} live lab${nl > 1 ? 's' : ''}`),
      h('span', { class: 'chip' }, ico('quiz', 16), `${L.quiz.length}-question check`), h('span', { class: 'chip' }, 'By ', h('b', null, 'Sai Ganesh Chidambaram')))));

  const prose = h('article', { class: 'prose', html: L.html });
  prose.querySelectorAll('[data-lab]').forEach((el, i) => {
    const key = el.dataset.lab, def = L.labs[key]; if (!def) { el.remove(); return; }
    const body = h('div', { class: 'lab-body' });
    const fig = h('figure', { class: 'lab' }, h('div', { class: 'lab-head' }, h('span', { class: 'lab-tag' }, ico('lab', 14), `Lab ${i + 1}`), h('span', { class: 'lab-title' }, def.title)), body, h('figcaption', { class: 'lab-cap' }, def.cap));
    el.replaceWith(fig);
    try { def.build(body, n => `${L.id}-${key}-${n}`); } catch (e) { console.error(e); body.innerHTML = ''; body.append(h('p', { class: 'hint' }, 'This lab could not start. Reload the page to try again.')); }
  });
  if (L.mount) try { L.mount(prose); } catch (e) { console.error(e); }
  const ideas = h('section', { class: 'ideas', id: 'ideas' }, h('h2', null, ico('bulb', 24), 'Key ideas'), h('ol', null, ...L.take.map(t => h('li', null, h('span', null, t)))));
  prose.append(ideas);
  const quiz = renderQuiz(L);
  prose.append(quiz);

  const all = LESSONS, gi = all.indexOf(L), prev = all[gi - 1], next = all[gi + 1];
  const pm = prev && MOD_OF[prev.id], nm = next && MOD_OF[next.id];
  prose.append(h('nav', { class: 'pn', 'aria-label': 'Previous and next lesson' },
    prev ? h('a', { href: '#' + prev.id }, h('small', null, ico('arrowL', 14), pm === m ? 'Previous lesson' : `Back to Module ${pad2(pm.no)}`), h('span', null, prev.title))
      : h('a', { href: '#' }, h('small', null, ico('arrowL', 14), 'Back to'), h('span', null, 'All modules')),
    next ? h('a', { class: 'next', href: '#' + next.id }, h('small', null, nm === m ? 'Next lesson' : `Next module · Module ${pad2(nm.no)}`, ico('arrowR', 14)), h('span', null, nm === m ? next.title : nm.g.title))
      : h('a', { class: 'next', href: '#glossary' }, h('small', null, 'Reference', ico('arrowR', 14)), h('span', null, 'Glossary'))));

  // in-page section switcher (buttons, because the URL hash is used for routing)
  const firstLab = () => prose.querySelector('.lab');
  const targets = [['read', 'Read', 'Reading', 'read', () => main.querySelector('.lh')], ['lab', 'Labs', `Labs (${nl})`, 'lab', firstLab], ['ideas', 'Ideas', 'Key ideas', 'bulb', () => ideas], ['check', 'Check', `Check (${L.quiz.length})`, 'quiz', () => quiz]];
  const jbtns = {};
  const jump = h('nav', { class: 'jump', 'aria-label': 'Jump to a part of this lesson' }, ...targets.map(([k, short, long, icn, get]) => {
    const b = h('button', { type: 'button', 'aria-current': 'false' }, ico(icn, 16), h('span', { class: 'lbl-short' }, short), h('span', { class: 'lbl-long' }, long));
    b.addEventListener('click', () => { const t = get(); scrollToEl(t); });
    jbtns[k] = b; return b;
  }));
  main.append(jump, prose);

  // scroll spy + reading progress
  const rp = document.getElementById('readProgress'); rp.hidden = false;
  const onScroll = () => {
    const y = window.scrollY + window.innerHeight * .35;
    const pos = { read: 0, lab: firstLab() ? firstLab().getBoundingClientRect().top + window.scrollY : Infinity, ideas: ideas.getBoundingClientRect().top + window.scrollY, check: quiz.getBoundingClientRect().top + window.scrollY };
    let curK = 'read'; for (const k of ['lab', 'ideas', 'check']) if (y >= pos[k]) curK = k;
    for (const k in jbtns) jbtns[k].setAttribute('aria-current', k === curK ? 'true' : 'false');
    const max = document.documentElement.scrollHeight - window.innerHeight;
    rp.firstElementChild.style.width = (max > 0 ? Math.min(1, window.scrollY / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  spyOff = () => { window.removeEventListener('scroll', onScroll); rp.hidden = true; };
  Scope.later(50, onScroll);
}

/* ---------- quiz: one question at a time, with room for reasoning ---------- */
function renderQuiz(L) {
  const n = L.quiz.length, need = Math.ceil(n * 0.7), letters = 'ABCDEF';
  const items = L.quiz.map(q => ({ q, order: shuffle(q.o.map((_, i) => i)), sel: null, picked: null }));
  let cur = 0, results = false, recorded = false;
  const uid = 'qz-' + L.id;
  const sec = h('section', { class: 'qz', id: 'check', 'aria-labelledby': uid + '-title' });
  const scoreEl = h('div', { class: 'qz-score', 'aria-live': 'polite' });
  const dots = h('ol', { class: 'qz-dots', 'aria-label': 'Questions' });
  const stage = h('div');
  const right = () => items.filter(it => it.picked !== null && it.picked === it.q.a).length;
  const answered = () => items.filter(it => it.picked !== null).length;
  const nextOpen = from => { for (let k = 1; k <= n; k++) { const j = (from + k) % n; if (items[j].picked === null) return j; } return -1; };

  sec.append(h('div', { class: 'qz-head' },
    h('div', null, h('span', { class: 'eyebrow' }, ico('quiz', 16), 'Check yourself'), h('h2', { id: uid + '-title' }, `${n} questions on this lesson`),
      h('p', null, `Pick an answer, write down your reasoning if it helps, then check it and read the explanation. Get ${need} of ${n} right on the first try to complete the lesson.`)),
    scoreEl));
  if (Prog.d.done[L.id]) sec.append(h('p', { class: 'qz-done' }, ico('check', 18), 'You have completed this lesson. Retaking the check will not undo that.'));
  sec.append(dots, stage);

  function finalize() {
    if (recorded || answered() < n) return;
    recorded = true;
    const s = right(); Prog.best(L.id, s);
    if (s >= need) Prog.done(L.id);
    const m = MOD_OF[L.id]; setSide(m, L);
  }
  function paint(focusSel) {
    scoreEl.innerHTML = '';
    scoreEl.append(h('span', null, h('b', null, String(right())), ' correct'), h('span', null, h('b', null, `${answered()}/${n}`), ' answered'));
    dots.innerHTML = '';
    items.forEach((it, i) => {
      const s = it.picked === null ? '' : it.picked === it.q.a ? 'right' : 'wrong';
      dots.append(h('li', null, h('button', { type: 'button', class: 'qz-dot', 'data-s': s, 'aria-current': !results && i === cur ? 'step' : false,
        'aria-label': `Question ${i + 1}${s === 'right' ? ', correct' : s === 'wrong' ? ', incorrect' : ''}`,
        onclick: () => { results = false; cur = i; paint('.qz-card'); } }, String(i + 1))));
    });
    if (answered() === n) dots.append(h('li', null, h('button', { type: 'button', class: 'qz-dot res', 'aria-current': results ? 'step' : false, onclick: () => { results = true; paint('.qz-res'); } }, ico('flag', 15), 'Results')));
    stage.innerHTML = '';
    stage.append(results ? resultsView() : cardView());
    if (focusSel) { const el = stage.querySelector(focusSel); if (el) el.focus({ preventScroll: true }); }
  }
  function check() {
    const it = items[cur]; if (it.sel === null || it.picked !== null) return;
    it.picked = it.sel; finalize(); paint('.qz-fb');
  }
  function cardView() {
    const it = items[cur], q = it.q, checked = it.picked !== null, qid = `${uid}-q${cur}`;
    const card = h('div', { class: 'qz-card', tabindex: '-1', 'aria-labelledby': qid });
    card.append(h('div', { class: 'qz-card-top' }, h('span', { class: 'qz-count' }, `Question ${cur + 1} of ${n}`),
      h('span', { class: 'qz-prog' }, pbar(answered() / n, `${answered()} of ${n} answered`))));
    card.append(h('p', { class: 'qz-q', id: qid }, q.q));
    const opts = h('div', { class: 'qz-opts', role: 'radiogroup', 'aria-labelledby': qid });
    it.order.forEach((oi, k) => {
      let s = '';
      if (checked) s = oi === q.a ? 'right' : oi === it.picked ? 'wrong' : 'dim';
      else if (it.sel === oi) s = 'sel';
      const b = h('button', { type: 'button', class: 'qz-opt', role: 'radio', 'data-s': s, 'data-k': String(k),
        'aria-checked': (checked ? oi === it.picked : it.sel === oi) ? 'true' : 'false', 'aria-disabled': checked ? 'true' : null },
        h('span', { class: 'qz-letter' }, letters[k]), h('span', null, q.o[oi]), s === 'right' ? ico('check', 20) : s === 'wrong' ? ico('x', 20) : h('span'));
      if (!checked) b.addEventListener('click', () => { it.sel = oi; paint(`.qz-opt[data-k="${k}"]`); });
      else b.disabled = true;
      opts.append(b);
    });
    card.append(opts);
    const mine = Prog.note(L.id, cur);
    if (!checked) {
      const taId = `${uid}-ta${cur}`;
      const ta = h('textarea', { class: 'qz-ta', id: taId, rows: '3', placeholder: 'Optional. Work it out here before you check, for example which amplitudes add and which cancel. Your notes are saved in this browser and shown next to the explanation.' });
      ta.value = mine;
      ta.addEventListener('input', () => Prog.setNote(L.id, cur, ta.value));
      ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); check(); } });
      card.append(h('div', { class: 'qz-reason' }, h('label', { class: 'qz-label', for: taId }, ico('pen', 16), 'Your reasoning ', h('small', null, '(optional)')), ta));
      const chk = btn('Check answer', check, 'pri lg', { disabled: it.sel === null });
      card.append(h('div', { class: 'qz-actions' },
        h('span', { class: 'qz-hint' }, 'Keys:', h('kbd', null, 'A'), '–', h('kbd', null, letters[it.order.length - 1]), 'choose ·', h('kbd', null, 'Enter'), 'check'),
        h('div', { class: 'btns' }, cur > 0 ? btn('Previous', () => { cur--; paint('.qz-card'); }, 'ghost') : null, chk)));
    } else {
      const ok = it.picked === q.a, letter = letters[it.order.indexOf(q.a)];
      card.append(h('div', { class: 'qz-fb ' + (ok ? 'good' : 'bad'), tabindex: '-1', role: 'status' },
        h('div', { class: 'qz-fb-head' }, ico(ok ? 'check' : 'x', 22), ok ? 'Correct.' : `Not quite. The answer is ${letter}.`),
        h('div', { class: 'qz-why-grid' + (mine.trim() ? ' two' : '') },
          mine.trim() ? h('div', { class: 'qz-mine' }, h('span', { class: 'qz-label' }, ico('pen', 16), 'Your reasoning'), h('p', null, mine)) : null,
          h('div', { class: 'qz-why' }, h('span', { class: 'qz-label' }, ico('bulb', 16), 'Why'), h('div', { class: 'qz-why-text', html: q.why })))));
      const nx = nextOpen(cur);
      card.append(h('div', { class: 'qz-actions' },
        h('span', { class: 'qz-hint' }, `${answered()} of ${n} answered`),
        h('div', { class: 'btns' },
          cur > 0 ? btn('Previous', () => { cur--; paint('.qz-card'); }, 'ghost') : null,
          nx === -1 ? btn('See your results', () => { results = true; paint('.qz-res'); }, 'pri lg')
            : btn(nx === cur + 1 ? 'Next question' : `Go to question ${nx + 1}`, () => { cur = nx; paint('.qz-card'); }, 'pri lg'))));
      const last = card.querySelector('.qz-actions .btn.pri'); if (last) last.append(ico('arrowR', 18));
    }
    return card;
  }
  function resultsView() {
    const s = right(), pass = s >= need, i = LESSONS.indexOf(L), next = LESSONS[i + 1];
    const res = h('div', { class: 'qz-res', tabindex: '-1' });
    res.append(h('div', { class: 'qz-res-top' },
      ring(s / n, 132, 11, `${s}/${n}`, `${s} of ${n} correct`),
      h('div', null,
        h('h3', null, pass ? 'Lesson complete' : 'Nearly there'),
        h('p', null, pass ? `You got ${s} of ${n} right on the first try. This lesson is now marked complete in your module.` : `You got ${s} of ${n}. Score ${need} or more to complete the lesson. Read the reasoning below, then retake the check with the options shuffled.`),
        h('div', { class: 'btns' },
          pass && next ? h('a', { class: 'btn pri', href: '#' + next.id }, 'Next lesson', ico('arrowR', 16)) : null,
          btn('Retake with shuffled options', () => { const fresh = renderQuiz(L); sec.replaceWith(fresh); scrollToEl(fresh); }, pass ? '' : 'pri'),
          h('a', { class: 'btn ghost', href: '#module/' + MOD_OF[L.id].no }, 'Module overview')))));
    res.append(h('div', { class: 'qz-rev-list' }, ...items.map((it, k) => {
      const ok = it.picked === it.q.a, mine = Prog.note(L.id, k);
      const L2 = idx => `${letters[it.order.indexOf(idx)]}. ${it.q.o[idx]}`;
      return h('details', { class: 'qz-rev' },
        h('summary', null, h('span', { class: 'rv-icon ' + (ok ? 'good' : 'bad') }, ico(ok ? 'check' : 'x', 15)), h('span', null, h('b', null, `${k + 1}. `), it.q.q), h('span', { class: 'chev' }, ico('chevD', 18))),
        h('div', { class: 'qz-rev-body' },
          h('dl', null, h('dt', null, 'Your answer'), h('dd', { style: `color:var(${ok ? '--good' : '--bad'})` }, L2(it.picked)),
            ok ? null : h('dt', null, 'Correct answer'), ok ? null : h('dd', null, L2(it.q.a)),
            mine.trim() ? h('dt', null, 'Your reasoning') : null, mine.trim() ? h('dd', { style: 'white-space:pre-wrap' }, mine) : null),
          h('div', { class: 'qz-why' }, h('span', { class: 'qz-label' }, ico('bulb', 16), 'Why'), h('div', { class: 'qz-why-text', html: it.q.why }))));
    })));
    return res;
  }
  sec.addEventListener('keydown', e => {
    if (results || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target; if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') return;
    const it = items[cur]; if (!it || it.picked !== null) return;
    const k = 'ABCDEF'.indexOf(e.key.toUpperCase()), d = '123456'.indexOf(e.key), pick = k >= 0 && e.key.length === 1 ? k : d;
    if (pick >= 0 && pick < it.order.length) { e.preventDefault(); it.sel = it.order[pick]; paint(`.qz-opt[data-k="${pick}"]`); }
    else if (e.key === 'Enter' && !t.classList.contains('btn')) {
      if (t.classList.contains('qz-opt')) it.sel = it.order[+t.dataset.k];
      if (it.sel !== null) { e.preventDefault(); check(); }
    }
  });
  paint();
  return sec;
}

/* ---------- glossary ---------- */
function renderGlossary(main) {
  setSide(null);
  const q = h('input', { type: 'search', id: 'glossary-search', class: 'gl-search', placeholder: 'Filter terms, for example “phase”', 'aria-label': 'Filter glossary terms' });
  const list = h('dl', { class: 'gl' }), count = h('p', { class: 'hint', 'aria-live': 'polite' });
  const items = window.GLOSSARY.map(([t, d, link]) => {
    const L = LESSONS.find(l => l.id === link), m = L && MOD_OF[L.id];
    const el = h('div', { class: 'gl-item' }, h('dt', null, t), h('dd', null, d + ' ', L ? h('a', { href: '#' + L.id }, `Module ${pad2(m.no)} · ${L.title} →`) : null));
    list.append(el); return { el, s: (t + ' ' + d).toLowerCase() };
  });
  const filt = () => { const v = q.value.trim().toLowerCase(); let k = 0; items.forEach(it => { const on = !v || it.s.includes(v); it.el.hidden = !on; if (on) k++; }); count.textContent = `${k} of ${items.length} terms`; };
  q.addEventListener('input', filt);
  main.append(h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: '#' }, 'Learn'), ico('chevR', 14), h('span', { 'aria-current': 'page' }, 'Glossary')),
    h('header', { class: 'gl-head' }, h('span', { class: 'eyebrow' }, ico('abc', 16), 'Reference'), h('h1', null, 'Glossary'),
      h('p', null, 'Short definitions of the terms used in the course, each linked to the lesson that explains it properly.'), q, count), list);
  filt();
}

/* ---------- router ---------- */
let firstRoute = true, lastView = '';
function route() {
  const id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  const partNo = /^part\/[123]$/.test(id) ? +id.slice(5) : 0;
  if (partNo && lastView === 'overview') { scrollToPart(partNo); document.title = `${PART_LABEL[PART_OF_NO[partNo]]} · QSage`; return; }
  const main = document.getElementById('main');
  if (spyOff) { spyOff(); spyOff = null; }
  Scope.reset(); main.innerHTML = '';
  let title = 'Learn';
  const L = LESSONS.find(l => l.id === id);
  if (L) { Prog.seen(L.id); renderLesson(L, main); title = L.title; }
  else if (id.startsWith('module/') && MODULES[+id.slice(7) - 1]) { const m = MODULES[+id.slice(7) - 1]; renderModule(m, main); title = `Module ${pad2(m.no)} · ${m.g.title}`; }
  else if (id === 'glossary') { renderGlossary(main); title = 'Glossary'; }
  else { renderOverview(main); if (partNo) title = PART_LABEL[PART_OF_NO[partNo]]; }
  lastView = L ? 'lesson' : id.startsWith('module/') ? 'module' : id === 'glossary' ? 'glossary' : 'overview';
  document.title = `${title} · QSage`;
  closeDrawer();
  if (partNo) requestAnimationFrame(() => { window.scrollTo(0, 0); scrollToPart(partNo); });
  else if (!firstRoute) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  firstRoute = false;
}
Prog.load();
window.addEventListener('hashchange', route);
route();
