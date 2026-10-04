setupPage({ cy: 'Llygoden', en: 'Mouse practice' });

const app = $('#app');
const opts = h('div', { class: 'opts' });
const status = h('div', { class: 'status' });
const arena = h('div', { class: 'arena' });
app.append(opts, status, arena);

const LEVELS = [
  { value: 'move',   label: '1 · Symud',     en: 'move',          cy: 'Symuda’r llygoden dros y cylchoedd', help: 'Move the mouse over the circles to find the food' },
  { value: 'click',  label: '2 · Clicio',    en: 'click',         cy: 'Clicia ar y bwyd',                   help: 'Click on the food' },
  { value: 'double', label: '3 · Clic dwbl', en: 'double-click',  cy: 'Clicia ddwywaith yn gyflym',         help: 'Click twice, quickly, to open the box' },
  { value: 'drag',   label: '4 · Llusgo',    en: 'drag',          cy: 'Llusga’r bwyd i’r plât',             help: 'Hold the button down, move to the plate, let go' },
  { value: 'find',   label: '5 · Ble mae?',  en: 'find it',       cy: 'Clicia ar y bwyd cywir',             help: 'Click the food with this Welsh name' },
  { value: 'catch',  label: '6 · Dal!',      en: 'catch',         cy: 'Dal y bwyd sy’n symud',              help: 'Click the moving food' },
  { value: 'plates', label: '7 · Platiau',   en: 'right plate',   cy: 'Llusga i’r plât cywir',              help: 'Drag the food to the plate with its Welsh name' },
  { value: 'path',   label: '8 · Llwybr',    en: 'follow the path', cy: 'Arhosa ar y llwybr',               help: 'Drag the food along the path to the plate. Stay on the path!' },
];

const getLevel = optionGroup(opts, {
  key: 'mouse.level', label: 'Lefel', labelEn: 'Level', def: 'move', onChange: () => start(),
  options: LEVELS.map(l => ({ value: l.value, label: l.label, en: l.en })),
});
const getSize = optionGroup(opts, {
  key: 'mouse.size', label: 'Maint', labelEn: 'Size', def: 160, onChange: () => start(),
  options: [
    { value: 200, label: 'Mawr', en: 'big' },
    { value: 160, label: 'Canolig', en: 'medium' },
    { value: 110, label: 'Bach', en: 'small' },
    { value: 75, label: 'Bach iawn', en: 'tiny' },
  ],
});
const getSpeed = optionGroup(opts, {
  key: 'mouse.speed', label: 'Cyflymder', labelEn: 'Speed (levels 6 & 8)', def: 1, onChange: () => start(),
  options: [
    { value: 0.6, label: '🐢', en: 'slow' },
    { value: 1, label: '🐇', en: 'medium' },
    { value: 1.6, label: '🚀', en: 'fast' },
  ],
});

// Everything a level starts (timers, animation loops) checks this so it stops when the level changes.
let run = 0;
function later(fn, ms) { const r = run; setTimeout(() => { if (r === run) fn(); }, ms); }

function place(node, size, x, y) {
  Object.assign(node.style, { width: size + 'px', height: size + 'px', left: x + 'px', top: y + 'px' });
}
function randomSpot(size, avoid = []) {
  const w = arena.clientWidth - size, hgt = arena.clientHeight - size;
  let best = null;
  for (let i = 0; i < 60; i++) {
    const p = { x: Math.random() * Math.max(0, w), y: Math.random() * Math.max(0, hgt) };
    if (avoid.every(a => Math.hypot(a.x - p.x, a.y - p.y) > (a.size + size) / 2 + 12)) return p;
    best = p;
  }
  return best;
}
function floatWord(text, x, y) {
  const w = h('div', { class: 'floating-word', lang: 'cy', style: `left:${x}px;top:${y}px` }, text);
  arena.append(w);
  setTimeout(() => w.remove(), 1400);
}
function thing(f, cls, label = true) {
  return h('div', { class: 'thing ' + cls }, foodImg(f), label ? h('span', { class: 'lbl', lang: 'cy' }, f.cy) : null);
}
function progress(done, total, extra) {
  const lvl = LEVELS.find(l => l.value === getLevel());
  status.replaceChildren(h('strong', {}, lvl.cy), ' · ', lvl.help,
    h('span', { class: 'dots' }, Array.from({ length: total }, (_, i) => h('i', { class: i < done ? 'on' : '' }))),
    extra || '');
}
function finish() {
  const i = LEVELS.findIndex(l => l.value === getLevel());
  const nxt = LEVELS[i + 1];
  later(() => celebrate('mouse', start,
    nxt ? { cy: 'Lefel ' + (i + 2), en: nxt.en, fn: () => getLevel.set(nxt.value) } : null), 700);
}

function start() {
  run++;
  arena.replaceChildren();
  Picker.clear();
  ({ move: startMove, click: startClick, double: startDouble, drag: startDrag,
     find: startFind, catch: startCatch, plates: startPlates, path: startPath })[getLevel()]();
}

// 1. Move over hidden circles to show the food.
function startMove() {
  const size = getSize();
  const foods = sample(activeFoods(), size < 100 ? 10 : 6);
  const spots = [];
  let found = 0;
  progress(0, foods.length);
  foods.forEach(f => {
    const p = randomSpot(size, spots);
    spots.push({ ...p, size });
    const t = thing(f, 'hidden-thing');
    place(t, size, p.x, p.y);
    t.addEventListener('pointerenter', () => {
      if (!t.classList.contains('hidden-thing')) return;
      t.classList.replace('hidden-thing', 'shown');
      t.classList.add('pop-in');
      Sound.pop();
      autoSay(f);
      found++;
      progress(found, foods.length);
      if (found === foods.length) finish();
    });
    arena.append(t);
  });
}

// 2. Click the food. It gets a little smaller each time.
function startClick() {
  const total = 10;
  let done = 0;
  progress(0, total);
  const next = () => {
    const size = Math.round(getSize() * (1 - done * 0.04));
    const f = randomOf(activeFoods());
    const p = randomSpot(size);
    const t = thing(f, 'target-thing');
    place(t, size, p.x, p.y);
    t.addEventListener('click', () => {
      t.classList.add('popped');
      Sound.pop();
      floatWord(f.cy, p.x + size / 2, p.y);
      autoSay(f);
      done++;
      progress(done, total);
      later(() => t.remove(), 400);
      if (done === total) finish(); else later(next, 500);
    }, { once: true });
    arena.append(t);
  };
  next();
}

// 3. Double-click the box to open it and see the food.
function startDouble() {
  const total = 8;
  let done = 0;
  progress(0, total);
  const next = () => {
    const size = getSize();
    const f = randomOf(activeFoods());
    const p = randomSpot(size);
    const box = h('div', { class: 'thing lunchbox' }, h('span', { class: 'lid' }, '🎁'));
    place(box, size, p.x, p.y);
    let hintTimer = null;
    box.addEventListener('click', () => {
      clearTimeout(hintTimer);
      box.classList.add('wobble');
      setTimeout(() => box.classList.remove('wobble'), 300);
      hintTimer = setTimeout(() => toast('Dwywaith!', 'Click twice, quickly', 'oops'), 600);
    });
    box.addEventListener('dblclick', () => {
      clearTimeout(hintTimer);
      if (box.classList.contains('open')) return;
      box.classList.add('open');
      box.replaceChildren(foodImg(f), h('span', { class: 'lbl', lang: 'cy' }, f.cy));
      box.classList.replace('lunchbox', 'shown');
      Sound.good();
      autoSay(f);
      done++;
      progress(done, total);
      later(() => box.classList.add('popped'), 900);
      later(() => box.remove(), 1300);
      if (done === total) finish(); else later(next, 1300);
    });
    arena.append(box);
  };
  next();
}

// 4. Drag the food onto the plate.
function startDrag() {
  const total = 6;
  let done = 0;
  progress(0, total);
  const size = getSize();
  const plate = h('div', { class: 'thing plate-target drop' });
  const plateSize = Math.round(size * 1.5);
  const pp = randomSpot(plateSize);
  place(plate, plateSize, pp.x, pp.y);
  arena.append(plate);

  const next = () => {
    const f = randomOf(activeFoods());
    const p = randomSpot(size, [{ ...pp, size: plateSize }]);
    const t = thing(f, 'target-thing');
    place(t, size, p.x, p.y);
    makeDraggable(t, {
      onClick: () => toast('Dal y botwm i lawr', 'Hold the button down and move', 'oops'),
      onDrop(target) {
        if (target !== plate) return false;
        t.remove();
        plate.replaceChildren(foodImg(f));
        plate.classList.add('pop-in');
        Sound.good();
        floatWord(f.cy, pp.x + plateSize / 2, pp.y);
        autoSay(f);
        done++;
        progress(done, total);
        if (done === total) finish(); else later(next, 700);
        return true;
      },
    });
    arena.append(t);
  };
  next();
}

// 5. Find the food that matches the Welsh word. More foods appear as it goes on.
function startFind() {
  const total = 8;
  let done = 0;
  const next = () => {
    arena.replaceChildren();
    const size = getSize();
    const count = Math.min(activeFoods().length, 3 + Math.floor(done / 2));
    const foods = sample(activeFoods(), count);
    const want = randomOf(foods);
    progress(done, total, h('span', { class: 'prompt-word', lang: 'cy' }, '🔎 ', want.cy, sayButton(want)));
    autoSay(want);
    const spots = [];
    foods.forEach(f => {
      const p = randomSpot(size, spots);
      spots.push({ ...p, size });
      const t = thing(f, 'target-thing', false);
      place(t, size, p.x, p.y);
      t.addEventListener('click', () => {
        if (f !== want) {
          shake(t);
          Sound.oops();
          toast(f.cy, 'That is ' + f.en + '. Try again', 'oops');
          return;
        }
        t.classList.add('popped');
        floatWord(f.cy, p.x + size / 2, p.y);
        praise();
        done++;
        if (done === total) { progress(done, total); finish(); } else later(next, 900);
      });
      arena.append(t);
    });
  };
  next();
}

// 6. Catch the food as it moves around. It speeds up a little each time.
function startCatch() {
  const total = 8;
  let done = 0;
  progress(0, total);
  const r = run;
  const next = () => {
    const size = getSize();
    const f = randomOf(activeFoods());
    const t = thing(f, 'target-thing');
    let { x, y } = randomSpot(size);
    const speed = (90 + done * 18) * getSpeed() * (size / 160 + 0.4);
    const angle = Math.random() * Math.PI * 2;
    let vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
    let caught = false, last = performance.now();
    place(t, size, x, y);
    const step = now => {
      if (caught || r !== run) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      x += vx * dt; y += vy * dt;
      const maxX = arena.clientWidth - size, maxY = arena.clientHeight - size;
      if (x < 0) { x = 0; vx = Math.abs(vx); }
      if (x > maxX) { x = maxX; vx = -Math.abs(vx); }
      if (y < 0) { y = 0; vy = Math.abs(vy); }
      if (y > maxY) { y = maxY; vy = -Math.abs(vy); }
      t.style.left = x + 'px';
      t.style.top = y + 'px';
      requestAnimationFrame(step);
    };
    t.addEventListener('pointerdown', () => {
      if (caught) return;
      caught = true;
      t.classList.add('popped');
      Sound.pop();
      floatWord(f.cy, x + size / 2, y);
      autoSay(f);
      done++;
      progress(done, total);
      later(() => t.remove(), 400);
      if (done === total) finish(); else later(next, 700);
    });
    arena.append(t);
    requestAnimationFrame(step);
  };
  next();
}

// 7. Drag each food to the plate with its Welsh name.
function startPlates() {
  const total = 6;
  let done = 0;
  progress(0, total);
  const size = getSize();
  const plateSize = Math.round(size * 1.3);
  const foods = sample(activeFoods(), 3);
  const spots = [];
  const plates = foods.map(f => {
    const p = randomSpot(plateSize, spots);
    spots.push({ ...p, size: plateSize });
    const pl = h('div', { class: 'thing plate-target drop named-plate' }, h('span', { class: 'lbl', lang: 'cy' }, f.cy));
    pl._food = f;
    place(pl, plateSize, p.x, p.y);
    arena.append(pl);
    return pl;
  });
  const next = () => {
    const f = randomOf(foods);
    const p = randomSpot(size, spots);
    const t = thing(f, 'target-thing', false);
    place(t, size, p.x, p.y);
    makeDraggable(t, {
      onClick: () => toast('Dal y botwm i lawr', 'Hold the button down and move', 'oops'),
      onDrop(target) {
        if (!target._food) return false;
        if (target._food !== f) { tryAgain(); shake(target); return false; }
        t.remove();
        target.replaceChildren(foodImg(f), h('span', { class: 'lbl', lang: 'cy' }, f.cy));
        target.classList.add('pop-in');
        later(() => { target.classList.remove('pop-in'); target.replaceChildren(h('span', { class: 'lbl', lang: 'cy' }, f.cy)); }, 900);
        praise();
        autoSay(f);
        done++;
        progress(done, total);
        if (done === total) finish(); else later(next, 900);
        return true;
      },
    });
    arena.append(t);
  };
  next();
}

// 8. Drag the food along a wiggly path to the plate without leaving the path.
function startPath() {
  const total = 3;
  let done = 0;
  const next = () => {
    arena.replaceChildren();
    progress(done, total);
    const W = arena.clientWidth, H = arena.clientHeight;
    const size = getSize();
    const track = Math.max(50, Math.round(size * 0.75));       // path width
    const food = Math.round(track * 0.9);                       // food size
    const margin = track;
    // Wiggles get bigger with speed setting and with each path.
    const waves = 1 + done + (getSpeed() > 1 ? 1 : 0);
    const amp = Math.min(H / 2 - margin, (H / 2 - margin) * (0.5 + 0.25 * done) * getSpeed());
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      pts.push({ x: margin + t * (W - 2 * margin), y: H / 2 + Math.sin(t * Math.PI * waves) * amp });
    }
    const d = 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L');
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'path-svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    for (const [cls, w] of [['path-edge', track + 8], ['path-road', track]]) {
      const p = document.createElementNS(svgNS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', cls);
      p.setAttribute('stroke-width', w);
      svg.append(p);
    }
    arena.append(svg);

    const end = pts[pts.length - 1], startPt = pts[0];
    const plate = h('div', { class: 'thing plate-target' });
    place(plate, track * 1.4, end.x - track * 0.7, end.y - track * 0.7);
    arena.append(plate);

    const f = randomOf(activeFoods());
    const t = thing(f, 'target-thing path-food', false);
    const put = (x, y) => place(t, food, x - food / 2, y - food / 2);
    put(startPt.x, startPt.y);
    arena.append(t);

    // Distance from a point to the nearest part of the path.
    const offPath = (x, y) => {
      let best = Infinity;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const vx = b.x - a.x, vy = b.y - a.y;
        const k = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy)));
        best = Math.min(best, Math.hypot(a.x + k * vx - x, a.y + k * vy - y));
      }
      return best;
    };

    let dragging = false;
    t.style.touchAction = 'none';
    t.addEventListener('pointerdown', e => {
      e.preventDefault();
      dragging = true;
      t.setPointerCapture(e.pointerId);
      t.classList.add('lifted');
      Sound.tap();
    });
    t.addEventListener('pointermove', e => {
      if (!dragging) return;
      const r = arena.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      put(x, y);
      if (offPath(x, y) > track / 2 + 4) {
        dragging = false;
        t.classList.remove('lifted');
        shake(svg);
        toast('Arhosa ar y llwybr', 'Stay on the path – back to the start', 'oops');
        Sound.oops();
        put(startPt.x, startPt.y);
      } else if (Math.hypot(x - end.x, y - end.y) < track * 0.6) {
        dragging = false;
        t.remove();
        plate.replaceChildren(foodImg(f));
        plate.classList.add('pop-in');
        floatWord(f.cy, end.x, end.y - track);
        praise();
        autoSay(f);
        done++;
        progress(done, total);
        if (done === total) finish(); else later(next, 1400);
      }
    });
    const drop = () => {
      if (!dragging) return;
      dragging = false;
      t.classList.remove('lifted');
      // Let go on the path: the food stays where it is, so they can rest.
    };
    t.addEventListener('pointerup', drop);
    t.addEventListener('pointercancel', drop);
  };
  next();
}

// Wait for the page layout so the arena has its size.
requestAnimationFrame(start);
