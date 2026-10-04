setupPage({ cy: 'Teipio', en: 'Typing' });

const app = $('#app');
const opts = h('div', { class: 'opts' });
const status = h('div', { class: 'status' });
const card = h('div', { class: 'type-card' });
app.append(opts, status, card);

const getLevel = optionGroup(opts, {
  key: 'typing.level', label: 'Lefel', labelEn: 'Level', def: 'copy', onChange: () => newRound(),
  options: [
    { value: 'copy', label: '👀 Copïo', en: 'copy the word' },
    { value: 'sheet', label: '📄 Taflen', en: 'use your sheet' },
  ],
});
const getLength = optionGroup(opts, {
  key: 'typing.length', label: 'Geiriau', labelEn: 'Words', def: 'short', onChange: () => newRound(),
  options: [
    { value: 'short', label: 'Byr', en: 'short' },
    { value: 'all', label: 'Pob un', en: 'all' },
  ],
});
const getCount = optionGroup(opts, {
  key: 'typing.count', label: 'Faint?', labelEn: 'How many?', def: 5, onChange: () => newRound(),
  options: [3, 5, 8].map(n => ({ value: n, label: String(n) })),
});
const getKeyboard = optionGroup(opts, {
  key: 'typing.kb', label: 'Bysellfwrdd', labelEn: 'Keyboard', def: true, onChange: () => showWord(),
  options: [{ value: true, label: '✔', en: 'show' }, { value: false, label: '✖', en: 'hide' }],
});

// Ignore accents and capitals: â can be typed as a.
const norm = c => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

let words = [], idx = 0, pos = 0, misses = 0, finished = false;
let boxes = [], keys = {};

function newRound() {
  let pool = activeFoods();
  if (getLength() === 'short') {
    const short = pool.filter(f => f.cy.length <= 8);
    pool = short.length >= 3 ? short : FOODS.filter(f => f.cy.length <= 8);
  }
  words = sample(pool, getCount());
  idx = 0;
  showWord();
}

function showWord() {
  const f = words[idx];
  pos = 0; misses = 0; finished = false;
  const copy = getLevel() === 'copy';

  status.replaceChildren(`Gair · Word ${idx + 1} / ${words.length}`,
    h('span', { class: 'dots' }, words.map((_, i) => h('i', { class: i < idx ? 'on' : '' }))));

  // Letter boxes, grouped per word so long phrases wrap neatly.
  boxes = [];
  const groups = f.cy.split(' ').map((w, wi, all) => {
    const g = h('div', { class: 'wordgroup' });
    for (const ch of w) {
      const b = h('div', { class: 'box' }, copy ? ch : '');
      b._ch = ch;
      boxes.push(b);
      g.append(b);
    }
    if (wi < all.length - 1) {
      // The space is typed too.
      const s = h('div', { class: 'box', style: 'width:34px', title: 'space' }, copy ? '␣' : '');
      s._ch = ' ';
      boxes.push(s);
      g.append(s);
    }
    return g;
  });

  const kb = getKeyboard() ? keyboard() : null;
  const nextRow = h('div', { class: 'row center next-row' },
    copy ? null : h('button', { class: 'btn', onclick: hint }, '💡 Help'));

  card.replaceChildren(
    foodImg(f),
    h('div', { class: 'en' }, f.en, sayButton(f)),
    h('div', { class: 'boxes', lang: 'cy', 'aria-label': copy ? f.cy : 'Welsh word' }, groups),
    nextRow,
    kb);
  card._next = nextRow;
  mark();
  autoSay(f);
}

function keyboard() {
  keys = {};
  const make = (k, label, cls = 'key') => {
    const b = h('button', { class: cls, tabindex: '-1', onclick: () => type(k) }, label);
    keys[k] = b;
    return b;
  };
  return h('div', { class: 'keyboard', 'aria-hidden': 'true' },
    ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map(row => h('div', { class: 'krow' }, [...row].map(k => make(k, k)))),
    h('div', { class: 'krow' }, make(' ', 'bwlch · space', 'key space')));
}

// Highlight the box (and key) to type next.
function mark(showHint = false) {
  boxes.forEach((b, i) => b.classList.toggle('now', i === pos && !finished));
  Object.values(keys).forEach(k => k.classList.remove('next'));
  if (finished) return;
  const want = norm(boxes[pos]._ch);
  if ((getLevel() === 'copy' || showHint) && keys[want]) keys[want].classList.add('next');
}

function hint() {
  if (finished) return;
  const b = boxes[pos];
  b.textContent = b._ch === ' ' ? '␣' : b._ch;
  b.classList.add('hint');
  mark(true);
}

function type(k) {
  if (finished) return;
  const b = boxes[pos];
  if (norm(k) === norm(b._ch)) {
    b.textContent = b._ch === ' ' ? '' : b._ch;
    b.classList.remove('hint', 'wrong');
    b.classList.add('done');
    pos++;
    Sound.tap();
    if (pos === boxes.length) return wordDone();
    mark();
  } else {
    misses++;
    b.classList.add('wrong');
    shake(b);
    setTimeout(() => b.classList.remove('wrong'), 500);
    Sound.oops();
    // After a few tries, show the letter.
    if (misses >= 3 && getLevel() !== 'copy') hint();
  }
}

function wordDone() {
  finished = true;
  mark();
  const f = words[idx];
  praise();
  setTimeout(() => autoSay(f), 400);
  const last = idx === words.length - 1;
  const next = h('button', { class: 'btn go big', onclick: goNext },
    last ? '⭐ Gorffen ' : '➡️ Nesaf ', h('small', {}, last ? 'Finish' : 'Next'));
  card._next.replaceChildren(next);
  next.focus();
}

function goNext() {
  if (idx === words.length - 1) return celebrate('typing', newRound);
  idx++;
  showWord();
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) return;
  if ($('.overlay')) return;
  if (e.key === 'Enter') {
    if (finished) { e.preventDefault(); goNext(); }
    return;
  }
  if (e.key.length !== 1) return;
  e.preventDefault();
  type(e.key);
});

newRound();
