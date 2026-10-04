setupPage({ cy: 'Taflen', en: 'Printable word mat' });

const app = $('#app');
const opts = h('div', { class: 'opts no-print' });
const sheet = h('div', { class: 'sheet' });
app.append(opts, sheet);

const getWhich = optionGroup(opts, {
  key: 'sheet.which', label: 'Bwyd', labelEn: 'Foods', def: 'all', onChange: () => render(),
  options: [
    { value: 'all', label: 'Pob un', en: 'all 23' },
    { value: 'chosen', label: 'Wedi dewis', en: 'chosen on Words page' },
  ],
});
opts.append(h('button', { class: 'btn primary', onclick: () => window.print() }, '🖨️ Argraffu ', h('small', {}, 'Print')));

function render() {
  const foods = getWhich() === 'chosen' ? activeFoods() : FOODS;
  sheet.replaceChildren(
    h('div', { class: 'sheet-head' }, h('div', { class: 't-en' }, 'Food'), h('div', { class: 't-cy', lang: 'cy' }, 'Bwyd')),
    h('div', { class: 'sheet-grid' }, foods.map(f =>
      h('div', { class: 'sheet-item' },
        foodImg(f),
        h('div', { class: 's-en' }, f.en),
        h('div', { class: 's-cy', lang: 'cy' }, f.cy)))),
    h('div', { class: 'credit-line' }, pictureSet() === 'arasaac' ? ARASAAC_CREDIT : ''));
  $('footer.credit').textContent = pictureSet() === 'arasaac' ? ARASAAC_CREDIT : '';
}

render();
