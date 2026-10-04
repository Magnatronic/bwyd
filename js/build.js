setupPage({ cy: 'Adeiladu', en: 'Build the word' });

const app = $('#app');
const opts = h('div', { class: 'opts' });
const status = h('div', { class: 'status' });
const stage = h('div', { class: 'build-card' });
app.append(opts, status, stage);

const getMode = optionGroup(opts, {
  key: 'build.mode', label: 'Adeiladu', labelEn: 'Build with', def: 'letters', onChange: () => newRound(),
  options: [
    { value: 'letters', label: 'a b c', en: 'letters' },
    { value: 'words', label: 'Geiriau', en: 'words' },
  ],
});
const getHelp = optionGroup(opts, {
  key: 'build.help', label: 'Cymorth', labelEn: 'Help', def: true, onChange: () => showWord(),
  options: [{ value: true, label: '✔', en: 'show word' }, { value: false, label: '✖', en: 'use sheet' }],
});

// Welsh letters that are written with two characters (ng is left out: it is ambiguous).
const DIGRAPHS = ['ch', 'dd', 'ff', 'll', 'ph', 'rh', 'th'];
function letterTokens(word) {
  const out = [];
  for (let i = 0; i < word.length;) {
    if (word[i] === ' ') { out.push(' '); i++; continue; }
    const two = word.slice(i, i + 2);
    if (DIGRAPHS.includes(two.toLowerCase())) { out.push(two); i += 2; }
    else { out.push(word[i]); i++; }
  }
  return out;
}
function tokens(f) {
  return getMode() === 'words' ? f.cy.split(' ') : letterTokens(f.cy);
}
function fits(f) {
  if (getMode() === 'words') return f.cy.includes(' ');
  return letterTokens(f.cy).filter(t => t !== ' ').length <= 9;
}

const ROUNDS = 5;
let words = [], idx = 0, slots = [];

function newRound() {
  let pool = activeFoods().filter(fits);
  if (pool.length < 3) pool = FOODS.filter(fits);
  words = sample(pool, ROUNDS);
  idx = 0;
  showWord();
}

function showWord() {
  const f = words[idx];
  const toks = tokens(f);
  status.replaceChildren(`${idx + 1} / ${words.length}`,
    h('span', { class: 'dots' }, words.map((_, i) => h('i', { class: i < idx ? 'on' : '' }))));

  slots = [];
  const slotRow = h('div', { class: 'slots', lang: 'cy' });
  const pieces = [];
  toks.forEach(t => {
    if (t === ' ') { slotRow.append(h('span', { class: 'gap' })); return; }
    const s = h('div', { class: 'bslot' }, getHelp() ? t : '');
    s._t = t;
    makeDropTarget(s, onDrop);
    slots.push(s);
    slotRow.append(s);
    pieces.push(t);
  });

  // Shuffle the pieces, making sure they are not already in order.
  let mixed = shuffle(pieces.slice());
  for (let i = 0; i < 5 && pieces.length > 1 && mixed.join() === pieces.join(); i++) mixed = shuffle(mixed);

  const tray = h('div', { class: 'tray', lang: 'cy' }, mixed.map(t => {
    const tile = h('div', { class: 'tile-l' }, t);
    tile._t = t;
    makeDraggable(tile, {
      onDrop,
      // Clicking a tile puts it in the next empty space.
      onClick: () => {
        const next = slots.find(s => !s.classList.contains('filled'));
        if (next && !onDrop(next, tile)) shake(tile);
      },
      enabled: () => !tile.classList.contains('used'),
    });
    return tile;
  }));

  stage.replaceChildren(
    foodImg(f),
    h('div', { class: 'row center' }, h('span', { class: 'en' }, f.en), sayButton(f)),
    slotRow,
    tray,
    h('div', { class: 'row center next-row', id: 'next' }));
}

function onDrop(slot, tile) {
  if (slot.classList.contains('filled') || !slot._t) return false;
  if (slot._t.toLowerCase() !== tile._t.toLowerCase()) {
    tryAgain();
    return false;
  }
  slot.textContent = slot._t;
  slot.classList.add('filled', 'pop-in');
  tile.classList.add('used');
  Sound.tap();
  if (slots.every(s => s.classList.contains('filled'))) wordDone();
  return true;
}

function wordDone() {
  const f = words[idx];
  praise();
  setTimeout(() => autoSay(f), 400);
  const last = idx === words.length - 1;
  const next = h('button', {
    class: 'btn go big',
    onclick() { if (last) celebrate('build', newRound); else { idx++; showWord(); } },
  }, last ? '⭐ Gorffen ' : '➡️ Nesaf ', h('small', {}, last ? 'Finish' : 'Next'));
  $('#next').replaceChildren(next);
  next.focus();
}

newRound();
