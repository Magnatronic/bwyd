setupPage({ cy: 'Paru', en: 'Match up' });

const app = $('#app');
const opts = h('div', { class: 'opts' });
const help = h('p', { class: 'status' });
const tray = h('div', { class: 'tray' });
const targets = h('div', { class: 'targets' });
app.append(opts, help, tray, targets);

// [what you move, what you drop it on]
const MODES = {
  'cy-img': ['cy', 'img'],
  'img-cy': ['img', 'cy'],
  'cy-en': ['cy', 'en'],
};
const getMode = optionGroup(opts, {
  key: 'match.mode', label: 'Symud', labelEn: 'Move', def: 'cy-img', onChange: () => newRound(),
  options: [
    { value: 'cy-img', label: 'Cymraeg → 🖼️', en: 'Welsh to picture' },
    { value: 'img-cy', label: '🖼️ → Cymraeg', en: 'picture to Welsh' },
    { value: 'cy-en', label: 'Cymraeg → English', en: 'Welsh to English' },
  ],
});
const getCount = optionGroup(opts, {
  key: 'match.count', label: 'Faint?', labelEn: 'How many?', def: 4, onChange: () => newRound(),
  options: [3, 4, 6, 8].map(n => ({ value: n, label: String(n) })),
});

let left = 0;

function content(f, kind) {
  if (kind === 'img') return foodImg(f);
  return h('span', { class: 'word ' + kind, lang: kind }, f[kind]);
}

function newRound() {
  const foods = sample(activeFoods(), getCount());
  const [moveKind, dropKind] = MODES[getMode()];
  left = foods.length;
  help.textContent = 'Llusga neu clicia · Drag, or click then click';

  tray.replaceChildren(...shuffle(foods.slice()).map(f => {
    const chip = h('div', { class: 'chip ' + (moveKind === 'img' ? 'pic' : moveKind), dataset: { id: f.id } }, content(f, moveKind));
    makeDraggable(chip, { onDrop, enabled: () => !chip.classList.contains('placed') });
    return chip;
  }));

  targets.replaceChildren(...foods.map(f => {
    const t = h('div', { class: 'target', dataset: { id: f.id } },
      h('div', { class: 'face' }, content(f, dropKind)),
      h('div', { class: 'slot' }, '?'));
    makeDropTarget(t, onDrop);
    return t;
  }));
}

function onDrop(target, chip) {
  if (target.classList.contains('done')) return false;
  if (target.dataset.id !== chip.dataset.id) {
    tryAgain();
    shake(target);
    return false;
  }
  target.classList.add('done');
  chip.classList.add('placed');
  $('.slot', target).replaceChildren(chip);
  chip.classList.add('pop-in');
  const f = FOOD_BY_ID[chip.dataset.id];
  autoSay(f);
  left--;
  if (left === 0) setTimeout(() => celebrate('match', newRound), 900);
  else praise();
  return true;
}

newRound();
