'use strict';
// Shared helpers used by every page.

// ---------- Saved settings (per browser) ----------
const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('bwyd.' + key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('bwyd.' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  },
};

// ---------- Small DOM helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);

function h(tag, props, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return n;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const sample = (list, n) => shuffle(list.slice()).slice(0, Math.min(n, list.length));
const randomOf = list => list[Math.floor(Math.random() * list.length)];

// Picture set: 'food' (the word mat pictures – kept on this computer only, never published)
// or 'arasaac' (ARASAAC pictograms, CC BY-NC-SA – used on the website).
function pictureSet() {
  return location.protocol === 'file:' ? 'food' : 'arasaac';
}
function foodImg(f, cls = 'food-img') {
  const img = h('img', { src: `images/${pictureSet()}/${f.id}.png`, alt: f.en, class: cls, draggable: 'false' });
  // If a picture is missing, use the ARASAAC one.
  img.addEventListener('error', () => {
    if (!img.dataset.fallback) { img.dataset.fallback = '1'; img.src = `images/arasaac/${f.id}.png`; }
  });
  return img;
}
const ARASAAC_CREDIT = 'Pictograms: Sergio Palao. Origin: ARASAAC (https://arasaac.org). Licence: CC (BY-NC-SA). Owner: Government of Aragón (Spain).';

// Foods chosen on the "Geiriau" page (all of them if fewer than 3 are chosen).
function activeFoods() {
  const ids = Store.get('foods', null);
  const list = ids ? FOODS.filter(f => ids.includes(f.id)) : FOODS.slice();
  return list.length >= 3 ? list : FOODS.slice();
}

function shake(node) {
  node.classList.remove('shake');
  void node.offsetWidth;
  node.classList.add('shake');
  node.addEventListener('animationend', () => node.classList.remove('shake'), { once: true });
}

// ---------- Sounds (made in the browser, no files needed) ----------
const Sound = (() => {
  let ctx = null;
  function audio() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type = 'sine', vol = 0.18) {
    if (!Store.get('sound', true)) return;
    const c = audio();
    if (!c) return;
    const t = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  return {
    good() { tone(660, 0, 0.15); tone(880, 0.12, 0.28); },
    oops() { tone(330, 0, 0.18, 'triangle', 0.1); tone(277, 0.15, 0.25, 'triangle', 0.1); },
    tap() { tone(1100, 0, 0.06, 'sine', 0.07); },
    flip() { tone(700, 0, 0.06, 'triangle', 0.06); },
    pop() { tone(500, 0, 0.07, 'square', 0.05); tone(950, 0.04, 0.12, 'sine', 0.1); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.3)); tone(1319, 0.55, 0.7); },
  };
})();

// ---------- Voice recordings saved in this browser (IndexedDB) ----------
const Recordings = (() => {
  let dbPromise = null;
  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('bwyd-audio', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('clips');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }).catch(() => null);
    }
    return dbPromise;
  }
  async function run(mode, fn) {
    const d = await db();
    if (!d) return null;
    return new Promise(resolve => {
      try {
        const req = fn(d.transaction('clips', mode).objectStore('clips'));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }
  return {
    get: id => run('readonly', s => s.get(id)),
    set: (id, blob) => run('readwrite', s => s.put(blob, id)),
    remove: id => run('readwrite', s => s.delete(id)),
    keys: async () => (await run('readonly', s => s.getAllKeys())) || [],
  };
})();

// ---------- Speech ----------
// Welsh: 1) recording made on the Words page, 2) audio/<id>.mp3, 3) a Welsh computer voice.
function welshVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices().filter(v => /^cy\b/i.test(v.lang));
  return voices.find(v => /natural|online/i.test(v.name)) || voices[0] || null;
}
function englishVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  return voices.find(v => /^en-GB/i.test(v.lang)) || voices.find(v => /^en\b/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) speechSynthesis.getVoices(); // starts voice loading

function sayWith(voice, text) {
  if (!voice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.85;
  speechSynthesis.speak(u);
  return true;
}

let currentAudio = null;
function playUrl(url) {
  return new Promise(resolve => {
    if (currentAudio) currentAudio.pause();
    const a = new Audio(url);
    currentAudio = a;
    a.onerror = () => resolve(false);
    a.play().then(() => resolve(true), () => resolve(false));
  });
}

let warnedNoVoice = false;
// Say a food's Welsh name. Returns true if something played.
async function speakFood(f) {
  const blob = await Recordings.get(f.id);
  if (blob) {
    const url = URL.createObjectURL(blob);
    const ok = await playUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    if (ok) return true;
  }
  if (await playUrl('audio/' + f.id + '.mp3')) return true;
  if (sayWith(welshVoice(), f.cy)) return true;
  if (!warnedNoVoice) {
    warnedNoVoice = true;
    toast('Dim llais Cymraeg', 'No Welsh voice yet. Record one on the Words page.', 'oops');
  }
  return false;
}
// Any Welsh text (only a computer voice can do this).
const speakWelsh = text => sayWith(welshVoice(), text);
const speakEnglish = text => sayWith(englishVoice(), text);

// Speaks automatically during games when the 🗣️ switch is on.
function autoSay(f) { if (Store.get('speak', true)) speakFood(f); }

// A small 🗣️ button that says a food's Welsh name.
function sayButton(f) {
  return h('button', {
    class: 'say-btn', title: 'Gwrando / Listen', 'aria-label': 'Gwrando / Listen: ' + f.en,
    onpointerdown: e => e.stopPropagation(),
    onclick(e) { e.stopPropagation(); speakFood(f); },
  }, '🗣️');
}

// ---------- Page frame ----------
function setupPage({ cy, en }) {
  const soundBtn = h('button', {
    class: 'icon-btn', title: 'Sain / Sound', 'aria-label': 'Sain / Sound',
    onclick() {
      const on = !Store.get('sound', true);
      Store.set('sound', on);
      soundBtn.textContent = on ? '🔊' : '🔇';
      if (on) Sound.tap();
    },
  }, Store.get('sound', true) ? '🔊' : '🔇');

  const speakBtn = h('button', {
    class: 'icon-btn', title: 'Siarad / Speak words', 'aria-label': 'Siarad / Speak words',
    'aria-pressed': String(Store.get('speak', true)),
    onclick() {
      const on = !Store.get('speak', true);
      Store.set('speak', on);
      speakBtn.setAttribute('aria-pressed', String(on));
      toast(on ? 'Siarad: ymlaen' : 'Siarad: i ffwrdd', on ? 'Speaking on' : 'Speaking off');
    },
  }, '🗣️');

  document.body.prepend(h('header', { class: 'top' },
    h('a', { class: 'btn home', href: 'index.html' }, '🏠 ', h('span', { class: 'home-label' }, 'Adref')),
    h('div', { class: 'title' }, h('h1', {}, cy), h('div', { class: 'en' }, en)),
    speakBtn, soundBtn));
  document.title = `${cy} · ${en}`;
  document.body.append(h('footer', { class: 'credit' }, pictureSet() === 'arasaac' ? ARASAAC_CREDIT : ''));
}

// A row of big toggle buttons whose choice is remembered.
function optionGroup(parent, { key, label, labelEn, options, def, onChange }) {
  let value = Store.get(key, def);
  if (!options.some(o => o.value === value)) value = def;
  const buttons = options.map(o => {
    const b = h('button', {
      class: 'chip-btn', 'aria-pressed': String(o.value === value),
      onclick() {
        if (value === o.value) return;
        value = o.value;
        Store.set(key, value);
        buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        Sound.tap();
        if (onChange) onChange(value);
      },
    }, o.label, o.en ? h('small', {}, o.en) : null);
    return b;
  });
  parent.append(h('div', { class: 'opt', role: 'group', 'aria-label': labelEn || label },
    h('span', { class: 'opt-label' }, label, labelEn ? h('small', {}, labelEn) : null),
    ...buttons));
  const get = () => value;
  get.set = v => { const i = options.findIndex(o => o.value === v); if (i >= 0) buttons[i].click(); };
  return get;
}

// ---------- Feedback ----------
function toast(cy, en, kind = 'good') {
  let t = $('#toast');
  if (!t) {
    t = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(t);
  }
  t.className = 'toast show ' + kind;
  t.replaceChildren(h('strong', {}, cy), en ? h('span', {}, en) : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 1500);
}
function praise() {
  const [cy, en] = randomOf(PRAISE);
  toast(cy, en, 'good');
  Sound.good();
}
function tryAgain() {
  toast('Ceisia eto', 'Try again', 'oops');
  Sound.oops();
}

// End-of-round screen: adds a star for this game.
// next (optional): { cy, en, fn } shows a "next level" button.
function celebrate(game, onAgain, next) {
  const stars = Store.get('stars', {});
  stars[game] = (stars[game] || 0) + 1;
  Store.set('stars', stars);
  Sound.win();
  const [cy, en] = randomOf(PRAISE);
  if (Store.get('speak', true)) setTimeout(() => speakWelsh(cy), 900);
  const again = h('button', { class: 'btn primary big', onclick() { overlay.remove(); onAgain(); } },
    '🔁 Eto! ', h('small', {}, 'Again'));
  const overlay = h('div', { class: 'overlay' },
    h('div', { class: 'panel celebrate' },
      h('div', { class: 'big-star' }, '⭐'),
      h('h2', {}, cy),
      h('p', { class: 'en' }, en),
      h('p', { class: 'star-count' }, `Sêr / Stars: ${'⭐'.repeat(Math.min(stars[game], 10))}${stars[game] > 10 ? ' ' + stars[game] : ''}`),
      h('div', { class: 'row center' },
        next ? h('button', { class: 'btn go big', onclick() { overlay.remove(); next.fn(); } }, `➡️ ${next.cy} `, h('small', {}, next.en)) : null,
        again,
        h('a', { class: 'btn big', href: 'index.html' }, '🏠 Adref ', h('small', {}, 'Home')))));
  const colours = ['#0EA5DF', '#FFC93C', '#2FA84F', '#E0533D', '#9B5DE5'];
  for (let i = 0; i < 40; i++) {
    overlay.append(h('i', {
      class: 'confetti',
      style: `left:${Math.random() * 100}%;background:${randomOf(colours)};animation-delay:${Math.random() * 0.8}s;animation-duration:${2 + Math.random() * 2}s`,
    }));
  }
  document.body.append(overlay);
  (overlay.querySelector('.btn.go') || again).focus();
}

// ---------- Drag (mouse or touch) and click-to-place ----------
// Every draggable can also be clicked to select it, then a target clicked to place it.
const Picker = {
  sel: null,
  select(node) {
    const same = this.sel === node;
    this.clear();
    if (!same) { this.sel = node; node.classList.add('selected'); Sound.tap(); }
  },
  clear() {
    if (this.sel) this.sel.classList.remove('selected');
    this.sel = null;
  },
};

// onDrop(target, node) returns true if the drop was accepted.
// onClick(node) replaces the select-then-click behaviour when given.
function makeDraggable(node, { onDrop, onClick, enabled = () => true }) {
  node.classList.add('draggable');
  node.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !enabled()) return;
    e.preventDefault();
    const r = node.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    const sx = e.clientX, sy = e.clientY;
    let ghost = null, over = null, moved = false;

    const move = ev => {
      if (!moved) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        moved = true;
        Picker.clear();
        ghost = node.cloneNode(true);
        ghost.classList.add('ghost');
        Object.assign(ghost.style, { width: r.width + 'px', height: r.height + 'px' });
        document.body.append(ghost);
        node.classList.add('dragging');
        Sound.tap();
      }
      ghost.style.left = (ev.clientX - dx) + 'px';
      ghost.style.top = (ev.clientY - dy) + 'px';
      const hit = document.elementFromPoint(ev.clientX, ev.clientY);
      const d = hit && hit.closest('.drop');
      if (d !== over) {
        if (over) over.classList.remove('over');
        over = d;
        if (over) over.classList.add('over');
      }
    };
    const end = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (!moved) {
        if (onClick) onClick(node); else Picker.select(node);
        return;
      }
      if (over) over.classList.remove('over');
      const ok = over && ev.type === 'pointerup' ? onDrop(over, node) : false;
      if (ok) {
        ghost.remove();
        node.classList.remove('dragging');
      } else {
        ghost.classList.add('return');
        Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px' });
        setTimeout(() => { ghost.remove(); node.classList.remove('dragging'); }, 320);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  });
}

// Lets a target accept the item chosen with a click.
function makeDropTarget(target, onDrop) {
  target.classList.add('drop');
  target.addEventListener('click', () => {
    const n = Picker.sel;
    if (!n) return;
    Picker.clear();
    if (!onDrop(target, n)) shake(n);
  });
}
