# Bwyd · Food – Welsh games

Simple games based on the *Food / Bwyd* word mat. Plain HTML, CSS and JavaScript with no build step.
Open `index.html` in a browser, or host the folder on GitHub Pages.

| Page | Game |
|---|---|
| `mouse.html` | **Llygoden**: mouse practice (move, click, drag) |
| `memory.html` | **Cardiau Cof**: flip cards (picture/Welsh/English modes) |
| `match.html` | **Paru**: drag words to pictures |
| `sort.html` | **Didoli**: sort into breakfast/dinner/pudding or hot/cold |
| `order.html` | **Trefnu**: Welsh ABC order (ll comes after l, etc.) |
| `build.html` | **Adeiladu**: build the word from letter (or word) tiles |
| `typing.html` | **Teipio**: copy-typing with an on-screen keyboard |
| `cafe.html` | **Caffi**: put what the customer asks for on the plate |
| `words.html` | **Geiriau**: word list. Choose which foods the games use, and record your voice |

Every drag can also be done by clicking (click the item, then click where it goes).
Settings are saved in the browser.

## Speech
The 🗣️ button says the Welsh word. It tries these in order:
1. A recording made on the **Geiriau** page (saved in that browser only)
2. `audio/<food-id>.mp3`, if you add one (e.g. `audio/pizza.mp3`; ids are in `js/data.js`)
3. A Welsh computer voice. Microsoft Edge has these (Nia / Aled), but Chrome on Windows usually does not.

## Pictures
There are two picture sets, chosen automatically:

- `images/food/`: the pictures from the printed word mat. **Used only when the games are opened from
  this folder on your computer. Never upload this folder.**
- `images/arasaac/`: ARASAAC pictograms, used on the website. Free to share under CC BY-NC-SA with this credit (shown on every page):
  *Pictograms: Sergio Palao. Origin: ARASAAC (https://arasaac.org). Licence: CC (BY-NC-SA). Owner: Government of Aragón (Spain).*

Double-click `index.html` to use the word mat pictures. The website always uses ARASAAC.

**Printable sheet:** `sheet.html` prints an A4 word mat with ARASAAC pictures from the website (all foods, or just the
chosen ones). `word-mat-arasaac.pdf` is a ready-printed copy of the ARASAAC version.

## GitHub Pages
`.gitignore` keeps `images/food/` and the original PDF out of the repository.
Then go to Settings → Pages → Deploy from branch → `main` / root.
