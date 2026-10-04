// The 23 foods from the "Food / Bwyd" word mat.
// meal: brecwast (breakfast), cinio (lunch/dinner), pwdin (pudding)
// temp: poeth (hot), oer (cold). Foods that could go either way list both.
const FOODS = [
  { id: 'sandwiches',       en: 'sandwiches',       cy: 'brechdanau',               meal: ['cinio'],             temp: ['oer'] },
  { id: 'spaghetti',        en: 'spaghetti',        cy: 'sbageti',                  meal: ['cinio'],             temp: ['poeth'] },
  { id: 'fried-eggs',       en: 'fried eggs',       cy: 'wyau wedi ffrio',          meal: ['brecwast'],          temp: ['poeth'] },
  { id: 'sausages',         en: 'sausages',         cy: 'selsig',                   meal: ['brecwast', 'cinio'], temp: ['poeth'] },
  { id: 'soup',             en: 'soup',             cy: 'cawl',                     meal: ['cinio'],             temp: ['poeth'] },
  { id: 'pizza',            en: 'pizza',            cy: 'pitsa',                    meal: ['cinio'],             temp: ['poeth'] },
  { id: 'fish-fingers',     en: 'fish fingers',     cy: 'bysedd pysgod',            meal: ['cinio'],             temp: ['poeth'] },
  { id: 'ice-cream',        en: 'ice cream',        cy: 'hufen iâ',                 meal: ['pwdin'],             temp: ['oer'] },
  { id: 'chocolate',        en: 'chocolate',        cy: 'siocled',                  meal: ['pwdin'],             temp: ['oer'] },
  { id: 'bacon',            en: 'bacon',            cy: 'cig moch',                 meal: ['brecwast'],          temp: ['poeth'] },
  { id: 'beans',            en: 'beans',            cy: 'ffa',                      meal: ['brecwast', 'cinio'], temp: ['poeth'] },
  { id: 'cereal',           en: 'cereal',           cy: 'grawnfwyd',                meal: ['brecwast'],          temp: ['oer'] },
  { id: 'fruit',            en: 'fruit',            cy: 'ffrwythau',                meal: ['brecwast', 'pwdin'], temp: ['oer'] },
  { id: 'steak-pie',        en: 'steak pie',        cy: 'pastai cig eidion',        meal: ['cinio'],             temp: ['poeth'] },
  { id: 'pasta',            en: 'pasta',            cy: 'pasta',                    meal: ['cinio'],             temp: ['poeth'] },
  { id: 'cherry-pie',       en: 'cherry pie',       cy: 'pastai ceirios',           meal: ['pwdin'],             temp: ['poeth', 'oer'] },
  { id: 'vegetables',       en: 'vegetables',       cy: 'llysiau',                  meal: ['cinio'],             temp: ['poeth', 'oer'] },
  { id: 'lasagne',          en: 'lasagne',          cy: 'lasania',                  meal: ['cinio'],             temp: ['poeth'] },
  { id: 'bangers-and-mash', en: 'bangers and mash', cy: 'selsig a thatws',          meal: ['cinio'],             temp: ['poeth'] },
  { id: 'chinese-food',     en: 'Chinese food',     cy: 'bwyd Tseiniaidd',          meal: ['cinio'],             temp: ['poeth'] },
  { id: 'fish-and-chips',   en: 'fish and chips',   cy: 'pysgod a sglodion',        meal: ['cinio'],             temp: ['poeth'] },
  { id: 'toast',            en: 'toast',            cy: 'brechdan wedi ei thostio', meal: ['brecwast'],          temp: ['poeth'] },
  { id: 'sunday-roast',     en: 'Sunday roast',     cy: 'cinio rhost Dydd Sul',     meal: ['cinio'],             temp: ['poeth'] },
];

const FOOD_BY_ID = Object.fromEntries(FOODS.map(f => [f.id, f]));

const PRAISE = [
  ['Da iawn!', 'Well done!'],
  ['Gwych!', 'Great!'],
  ['Ardderchog!', 'Excellent!'],
  ['Bendigedig!', 'Wonderful!'],
  ['Campus!', 'Brilliant!'],
  ['Ffantastig!', 'Fantastic!'],
];
