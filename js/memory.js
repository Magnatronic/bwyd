setupPage({ cy: 'Cardiau Cof', en: 'Memory cards' });

const app = $('#app');
const opts = h('div', { class: 'opts' });
const status = h('div', { class: 'status' });
const board = h('div', { class: 'mem-grid' });
app.append(opts, status, board,
  h('div', { class: 'row center', style: 'margin-top:18px' },
    h('button', { class: 'btn', onclick: () => newGame() }, '🔀 Gêm newydd ', h('small', {}, 'New game'))));

// Each mode pairs two kinds of card face.
const MODES = { 'img-img': ['img', 'img'], 'img-cy': ['img', 'cy'], 'en-cy': ['en', 'cy'], 'img-en': ['img', 'en'] };
const getMode = optionGroup(opts, {
  key: 'memory.mode', label: 'Paru', labelEn: 'Match', def: 'img-cy', onChange: () => newGame(),
  options: [
    { value: 'img-img', label: '🖼️ + 🖼️', en: 'picture + picture' },
    { value: 'img-cy', label: '🖼️ + Cymraeg', en: 'picture + Welsh' },
    { value: 'en-cy', label: 'English + Cymraeg', en: 'English + Welsh' },
    { value: 'img-en', label: '🖼️ + English', en: 'picture + English' },
  ],
});
const getPairs = optionGroup(opts, {
  key: 'memory.pairs', label: 'Parau', labelEn: 'Pairs', def: 4, onChange: () => newGame(),
  options: [3, 4, 6, 8].map(n => ({ value: n, label: String(n) })),
});

let open = [], lock = false, found = 0, total = 0;

function faceFor(f, kind) {
  if (kind === 'img') return [foodImg(f)];
  return [h('span', { class: 'word ' + kind, lang: kind }, f[kind])];
}

function newGame() {
  const foods = sample(activeFoods(), getPairs());
  total = foods.length; found = 0; open = []; lock = false;
  const [a, b] = MODES[getMode()];
  const cards = shuffle(foods.flatMap(f => [{ f, kind: a }, { f, kind: b }]));
  board.replaceChildren(...cards.map(c => {
    const btn = h('button', { class: 'card', 'aria-label': 'Cerdyn · Card' },
      h('div', { class: 'inner' },
        h('div', { class: 'face back' }, '?'),
        h('div', { class: 'face front' }, ...faceFor(c.f, c.kind))));
    btn._card = c;
    btn.addEventListener('click', () => flip(btn));
    return btn;
  }));
  updateStatus();
  layout();
}

// Choose rows × columns so the cards always make a full rectangle,
// as big as will fit on the screen.
function layout() {
  const n = board.children.length;
  if (!n) return;
  const gap = 14, ratio = 5 / 4; // card height / width
  const availW = app.clientWidth - 32;
  const availH = Math.max(320, window.innerHeight - (board.getBoundingClientRect().top + window.scrollY) - 90);
  let best = null;
  for (let cols = 2; cols <= n; cols++) {
    if (n % cols) continue;
    const rows = n / cols;
    if (cols < rows) continue; // keep it wider than tall
    const w = Math.min(190, (availW - gap * (cols - 1)) / cols, ((availH - gap * (rows - 1)) / rows) / ratio);
    if (!best || w > best.w + 1) best = { cols, w };
  }
  const w = Math.max(70, Math.floor(best.w));
  board.style.gridTemplateColumns = `repeat(${best.cols}, ${w}px)`;
  board.style.justifyContent = 'center';
  board.style.fontSize = Math.max(12, Math.min(20, w / 8)) + 'px';
}
window.addEventListener('resize', layout);

function updateStatus() {
  status.replaceChildren(`Parau · Pairs: ${found} / ${total}`,
    h('span', { class: 'dots' }, Array.from({ length: total }, (_, i) => h('i', { class: i < found ? 'on' : '' }))));
}

function flip(btn) {
  if (lock || btn.classList.contains('up')) return;
  btn.classList.add('up');
  Sound.flip();
  const c = btn._card;
  if (c.kind === 'cy') autoSay(c.f);
  else if (c.kind === 'en' && Store.get('speak', true)) speakEnglish(c.f.en);
  open.push(btn);
  if (open.length < 2) return;

  const [x, y] = open;
  open = [];
  lock = true;
  if (x._card.f.id === y._card.f.id) {
    setTimeout(() => {
      for (const card of [x, y]) {
        card.classList.add('matched');
        card.disabled = true;
        if (card._card.kind !== 'cy') $('.front', card).append(h('span', { class: 'cap', lang: 'cy' }, card._card.f.cy));
      }
      found++;
      updateStatus();
      lock = false;
      autoSay(x._card.f);
      if (found === total) setTimeout(() => celebrate('memory', newGame), 900);
      else praise();
    }, 500);
  } else {
    setTimeout(() => {
      x.classList.remove('up');
      y.classList.remove('up');
      lock = false;
    }, 1500);
  }
}

newGame();
