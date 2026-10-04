setupPage({ cy: 'Caffi', en: 'Café' });

const app = $('#app');
const opts = h('div', { class: 'opts' });
const status = h('div', { class: 'status' });
const customerBox = h('div', { class: 'customer' });
const plate = h('div', { class: 'plate', 'aria-label': 'Plât · Plate' });
const menu = h('div', { class: 'menu-grid' });
const serveRow = h('div', { class: 'row center', style: 'margin-top:12px' });
app.append(opts, status,
  h('div', { class: 'cafe' },
    customerBox,
    h('div', {},
      plate,
      h('p', { class: 'plate-hint' }, 'Llusga neu clicia’r bwyd · Drag or click the food. Click food on the plate to take it off.'),
      serveRow)),
  menu);

const getItems = optionGroup(opts, {
  key: 'cafe.items', label: 'Bwyd', labelEn: 'Foods to order', def: 1, onChange: () => newRound(),
  options: [1, 2, 3].map(n => ({ value: n, label: String(n) })),
});
const getHelp = optionGroup(opts, {
  key: 'cafe.help', label: 'Lefel', labelEn: 'Level', def: 'easy', onChange: () => showCustomer(false),
  options: [
    { value: 'easy', label: '⭐', en: 'pictures' },
    { value: 'medium', label: '⭐⭐', en: 'words on menu' },
    { value: 'hard', label: '⭐⭐⭐', en: 'use your sheet' },
  ],
});

const PEOPLE = ['🧑', '👩', '👨', '👵', '👴', '🧒', '👧', '👦', '🧔', '👩‍🦰', '👱'];
const CUSTOMERS = 5;
let served = 0, order = [], onPlate = [], person = '🧑';

function newRound() {
  served = 0;
  showCustomer(true);
}

function showCustomer(fresh = true) {
  if (fresh || !order.length) {
    order = sample(activeFoods(), getItems());
    person = randomOf(PEOPLE);
  }
  onPlate = [];
  const help = getHelp();

  status.replaceChildren(`Cwsmer · Customer ${served + 1} / ${CUSTOMERS}`,
    h('span', { class: 'dots' }, Array.from({ length: CUSTOMERS }, (_, i) => h('i', { class: i < served ? 'on' : '' }))));

  customerBox.replaceChildren(
    h('div', { class: 'face-emoji' }, person),
    h('div', { class: 'bubble', lang: 'cy' },
      h('p', {}, 'Helo! Ga i…'),
      h('ul', {}, order.map(f => h('li', {}, help === 'easy' ? foodImg(f) : null, f.cy, sayButton(f)))),
      h('p', {}, '…os gwelwch yn dda?'),
      h('p', { class: 'en' }, 'Hello! Can I have … please?')));

  // Menu: the ordered foods plus some others.
  const others = sample(activeFoods().filter(f => !order.includes(f)), Math.max(0, 8 - order.length));
  menu.replaceChildren(...shuffle([...order, ...others]).map(f => {
    const c = h('div', { class: 'fcard', dataset: { id: f.id } },
      foodImg(f), help === 'hard' ? null : h('span', { class: 'word cy', lang: 'cy' }, f.cy));
    makeDraggable(c, { onDrop: (t, n) => addToPlate(n), onClick: n => { if (!addToPlate(n)) shake(n); } });
    return c;
  }));
  plate.classList.add('drop');

  serveRow.replaceChildren(h('button', { class: 'btn go big', onclick: serve }, '🍽️ Gweini ', h('small', {}, 'Serve')));
  drawPlate();
  if (Store.get('speak', true) && order.length === 1) autoSay(order[0]);
}

function addToPlate(card) {
  const f = FOOD_BY_ID[card.dataset.id];
  if (onPlate.includes(f)) return false;
  onPlate.push(f);
  Sound.pop();
  drawPlate();
  return true;
}

function drawPlate(bad = []) {
  plate.replaceChildren(...onPlate.map(f => {
    const item = h('div', { class: 'on-plate pop-in' + (bad.includes(f) ? ' bad' : ''), title: f.cy },
      foodImg(f));
    item.addEventListener('click', () => {
      onPlate = onPlate.filter(x => x !== f);
      Sound.tap();
      drawPlate();
    });
    return item;
  }));
  menu.querySelectorAll('.fcard').forEach(c => c.classList.toggle('on', onPlate.some(f => f.id === c.dataset.id)));
}

function serve() {
  const wrong = onPlate.filter(f => !order.includes(f));
  const missing = order.filter(f => !onPlate.includes(f));
  if (!wrong.length && !missing.length) {
    served++;
    $('.face-emoji', customerBox).textContent = '😀';
    toast('Diolch yn fawr!', 'Thank you very much!');
    Sound.good();
    if (Store.get('speak', true)) speakWelsh('Diolch yn fawr!');
    serveRow.replaceChildren();
    if (served === CUSTOMERS) setTimeout(() => celebrate('cafe', newRound), 1200);
    else setTimeout(() => showCustomer(true), 1800);
    return;
  }
  drawPlate(wrong);
  if (wrong.length) toast('Dim diolch!', 'I didn’t ask for that – take it off', 'oops');
  else toast('Mae rhywbeth ar goll', 'Something is missing', 'oops');
  Sound.oops();
  shake(plate);
}

newRound();
