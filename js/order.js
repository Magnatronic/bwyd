setupPage({ cy: 'Trefnu', en: 'ABC order' });

const app = $('#app');
const opts = h('div', { class: 'opts' });
const abc = h('div', { class: 'abc', lang: 'cy', 'aria-label': 'Yr wyddor Gymraeg · The Welsh alphabet' });
const slotRow = h('div', { class: 'order-slots' });
const tray = h('div', { class: 'tray' });
app.append(opts, abc, slotRow, tray);

const WELSH_ABC = ['a', 'b', 'c', 'ch', 'd', 'dd', 'e', 'f', 'ff', 'g', 'ng', 'h', 'i', 'j', 'l', 'll',
  'm', 'n', 'o', 'p', 'ph', 'r', 'rh', 's', 't', 'th', 'u', 'w', 'y'];
const TWO = ['ch', 'dd', 'ff', 'ng', 'll', 'ph', 'rh', 'th'];
const firstLetter = w => TWO.find(d => w.toLowerCase().startsWith(d)) || w[0].toLowerCase();

const getCount = optionGroup(opts, {
  key: 'order.count', label: 'Faint?', labelEn: 'How many?', def: 3, onChange: () => newRound(),
  options: [3, 4, 5].map(n => ({ value: n, label: String(n) })),
});
const getHelp = optionGroup(opts, {
  key: 'order.help', label: 'Cymorth', labelEn: 'Help', def: true, onChange: () => newRound(),
  options: [{ value: true, label: '✔', en: 'light up letters' }, { value: false, label: '✖', en: 'no help' }],
});

let placed = 0, items = [];

// Pick foods that all start with a different Welsh letter.
function pickFoods(n) {
  const pick = pool => {
    const seen = new Set(), out = [];
    for (const f of shuffle(pool.slice())) {
      const l = firstLetter(f.cy);
      if (!seen.has(l)) { seen.add(l); out.push(f); }
      if (out.length === n) break;
    }
    return out;
  };
  const got = pick(activeFoods());
  return got.length === n ? got : pick(FOODS);
}

function newRound() {
  const foods = pickFoods(getCount());
  items = foods.slice().sort((a, b) => WELSH_ABC.indexOf(firstLetter(a.cy)) - WELSH_ABC.indexOf(firstLetter(b.cy)));
  placed = 0;
  const hot = new Set(getHelp() ? foods.map(f => firstLetter(f.cy)) : []);
  abc.replaceChildren(...WELSH_ABC.map(l => h('span', { class: hot.has(l) ? 'hot' : '' }, l)));

  slotRow.replaceChildren(...items.map((f, i) => {
    const s = h('div', { class: 'oslot', dataset: { rank: i } }, h('span', { class: 'num' }, String(i + 1)));
    makeDropTarget(s, onDrop);
    return s;
  }));

  tray.replaceChildren(...foods.map(f => {
    const l = firstLetter(f.cy);
    const c = h('div', { class: 'fcard', dataset: { rank: items.indexOf(f) } },
      foodImg(f),
      h('span', { class: 'word cy', lang: 'cy' }, h('span', { class: 'first' }, f.cy.slice(0, l.length)), f.cy.slice(l.length)));
    c._food = f;
    makeDraggable(c, { onDrop, enabled: () => !c.classList.contains('placed') });
    return c;
  }));
}

function onDrop(slot, card) {
  if (slot.classList.contains('filled')) return false;
  if (slot.dataset.rank !== card.dataset.rank) {
    tryAgain();
    return false;
  }
  slot.classList.add('filled');
  card.classList.add('placed', 'pop-in');
  slot.append(card);
  autoSay(card._food);
  placed++;
  if (placed === items.length) setTimeout(() => celebrate('order', newRound), 900);
  else praise();
  return true;
}

newRound();
