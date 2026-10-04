setupPage({ cy: 'Bwyd', en: 'Food · Welsh games' });
$('header.top .home').style.visibility = 'hidden';

const app = $('#app');
const stars = Store.get('stars', {});

const GAMES = [
  { href: 'mouse.html',  key: 'mouse',  cy: 'Llygoden',   en: 'Mouse practice', pics: ['🖱️'],               about: '8 levels: move, click, double-click, drag, find, catch, sort, follow the path', start: true },
  { href: 'memory.html', key: 'memory', cy: 'Cardiau Cof', en: 'Memory cards',  pics: ['pizza', 'pizza'],  about: 'Flip the cards and find the pairs' },
  { href: 'match.html',  key: 'match',  cy: 'Paru',        en: 'Match up',      pics: ['soup'],            about: 'Drag each word to its picture' },
  { href: 'sort.html',   key: 'sort',   cy: 'Didoli',      en: 'Sorting',       pics: ['cereal', 'ice-cream'], about: 'Breakfast, dinner or pudding? Hot or cold?' },
  { href: 'order.html',  key: 'order',  cy: 'Trefnu',      en: 'ABC order',     pics: ['🔤'],               about: 'Put the words in Welsh ABC order' },
  { href: 'build.html',  key: 'build',  cy: 'Adeiladu',    en: 'Build the word', pics: ['🧱'],              about: 'Build the Welsh word from letters' },
  { href: 'typing.html', key: 'typing', cy: 'Teipio',      en: 'Typing',        pics: ['⌨️'],               about: 'Copy-type the Welsh words' },
  { href: 'cafe.html',   key: 'cafe',   cy: 'Caffi',       en: 'Café',          pics: ['fish-and-chips'],  about: 'Make the food the customer asks for' },
];

function tile(g) {
  const pics = g.pics.map(p => FOOD_BY_ID[p] ? foodImg(FOOD_BY_ID[p]) : h('span', {}, p));
  const n = stars[g.key] || 0;
  return h('a', { class: 'tile' + (g.start ? ' start' : ''), href: g.href },
    h('div', { class: 'pics' }, pics),
    h('h2', {}, g.cy),
    h('div', { class: 'en' }, g.en),
    h('p', {}, g.about),
    h('div', { class: 'stars' }, n ? '⭐'.repeat(Math.min(n, 8)) + (n > 8 ? ` ${n}` : '') : ''));
}

app.append(
  h('p', { class: 'intro' }, 'Dewis gêm · Choose a game'),
  h('div', { class: 'menu' }, GAMES.map(tile)),
  h('h2', { class: 'section-title' }, 'Mwy · More'),
  h('div', { class: 'menu' },
    h('a', { class: 'tile', href: 'words.html' },
      h('div', { class: 'pics' }, foodImg(FOOD_BY_ID['sandwiches']), foodImg(FOOD_BY_ID['fruit'])),
      h('h2', {}, 'Geiriau'),
      h('div', { class: 'en' }, 'Words'),
      h('p', {}, 'See every word, choose which foods the games use, and record your voice')),
    h('a', { class: 'tile', href: 'sheet.html' },
      h('div', { class: 'pics' }, '🖨️'),
      h('h2', {}, 'Taflen'),
      h('div', { class: 'en' }, 'Printable sheet'),
      h('p', {}, 'Print a word mat that matches the pictures in the games'))),
);
