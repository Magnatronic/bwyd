setupPage({ cy: 'Didoli', en: 'Sorting' });

const app = $('#app');
const opts = h('div', { class: 'opts' });
const tray = h('div', { class: 'tray' });
const bins = h('div', { class: 'bins' });
app.append(opts, tray, bins);

const BINS = {
  meal: [
    { key: 'brecwast', cy: 'Brecwast', en: 'Breakfast', icon: '🌅' },
    { key: 'cinio', cy: 'Cinio', en: 'Lunch / dinner', icon: '🍽️' },
    { key: 'pwdin', cy: 'Pwdin', en: 'Pudding', icon: '🍨' },
  ],
  temp: [
    { key: 'poeth', cy: 'Poeth', en: 'Hot', icon: '🔥' },
    { key: 'oer', cy: 'Oer', en: 'Cold', icon: '❄️' },
  ],
};

const getMode = optionGroup(opts, {
  key: 'sort.mode', label: 'Didoli', labelEn: 'Sort by', def: 'meal', onChange: () => newRound(),
  options: [
    { value: 'meal', label: '🌅 🍽️ 🍨', en: 'meal' },
    { value: 'temp', label: '🔥 ❄️', en: 'hot or cold' },
  ],
});
const getCount = optionGroup(opts, {
  key: 'sort.count', label: 'Faint?', labelEn: 'How many?', def: 6, onChange: () => newRound(),
  options: [4, 6, 9, 12].map(n => ({ value: n, label: String(n) })),
});

let left = 0;

function newRound() {
  const mode = getMode();
  const foods = sample(activeFoods(), getCount());
  left = foods.length;

  tray.replaceChildren(...foods.map(f => {
    const c = h('div', { class: 'fcard', dataset: { id: f.id } },
      foodImg(f), h('span', { class: 'word cy', lang: 'cy' }, f.cy));
    makeDraggable(c, { onDrop });
    return c;
  }));

  bins.replaceChildren(...BINS[mode].map(b => {
    const bin = h('div', { class: 'bin', dataset: { key: b.key } },
      h('div', { class: 'icon' }, b.icon),
      h('h2', {}, b.cy),
      h('div', { class: 'en' }, b.en),
      h('div', { class: 'bin-items' }));
    makeDropTarget(bin, onDrop);
    return bin;
  }));
}

function onDrop(bin, card) {
  const f = FOOD_BY_ID[card.dataset.id];
  if (!f[getMode()].includes(bin.dataset.key)) {
    tryAgain();
    shake(bin);
    return false;
  }
  $('.bin-items', bin).append(h('div', { class: 'mini pop-in' }, foodImg(f), f.cy));
  card.remove();
  autoSay(f);
  left--;
  if (left === 0) setTimeout(() => celebrate('sort', newRound), 900);
  else praise();
  return true;
}

newRound();
