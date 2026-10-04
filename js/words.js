setupPage({ cy: 'Geiriau', en: 'Words' });

const app = $('#app');
let chosen = new Set(Store.get('foods', null) || FOODS.map(f => f.id));
let recorded = new Set();

function save() {
  Store.set('foods', chosen.size === FOODS.length ? null : [...chosen]);
  count.textContent = `${chosen.size} / ${FOODS.length} yn y gemau · in the games`
    + (chosen.size < 3 ? ' — dewiswch 3 o leiaf · choose at least 3 (all are used until then)' : '');
}

const count = h('strong', {});
const voiceInfo = h('p', {});
function showVoiceInfo() {
  const v = welshVoice();
  voiceInfo.textContent = v
    ? `✅ Welsh computer voice found: ${v.name}. Words without a recording will use it.`
    : '⚠️ No Welsh computer voice on this browser. Microsoft Edge on Windows has Welsh voices (Nia and Aled). Or record yourself below with 🎙️. Recordings stay in this browser on this computer.';
}
showVoiceInfo();
if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', showVoiceInfo);

app.append(
  h('div', { class: 'note' },
    h('p', {}, 'Tap ✅ to choose which foods appear in the games. Start small (4–6 foods) and add more as they are learnt.'),
    voiceInfo),
  h('div', { class: 'opts', id: 'pics' }),
  h('div', { class: 'opts' },
    count,
    h('button', { class: 'chip-btn', onclick() { chosen = new Set(FOODS.map(f => f.id)); render(); } }, 'Pob un', h('small', {}, 'All')),
    h('button', { class: 'chip-btn', onclick() { chosen = new Set(); render(); } }, 'Dim', h('small', {}, 'None'))),
  h('div', { class: 'words-grid', id: 'grid' }));

$('#pics').append(h('a', { class: 'btn', href: 'sheet.html' }, '🖨️ Taflen ', h('small', {}, 'Printable sheet')));

// ---------- Recording ----------
let rec = null; // { id, recorder, button }
async function toggleRecord(f, btn) {
  if (rec && rec.id === f.id) { rec.recorder.stop(); return; }
  if (rec) rec.recorder.stop();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    toast('Dim meicroffon', 'Microphone not available or not allowed', 'oops');
    return;
  }
  const chunks = [];
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    rec = null;
    const blob = new Blob(chunks, { type: recorder.mimeType });
    if (blob.size > 0) {
      await Recordings.set(f.id, blob);
      recorded.add(f.id);
      speakFood(f);
    }
    render();
  };
  rec = { id: f.id, recorder };
  recorder.start();
  btn.classList.add('recording');
  btn.textContent = '⏹️ Stop';
  // Stops by itself after 5 seconds.
  setTimeout(() => { if (rec && rec.recorder === recorder) recorder.stop(); }, 5000);
}

function render() {
  save();
  $('#grid').replaceChildren(...FOODS.map(f => {
    const on = chosen.has(f.id);
    const card = h('div', { class: 'wcard' + (on ? ' on' : '') },
      h('button', {
        class: 'chip-btn pick', 'aria-pressed': String(on), 'aria-label': 'Use in games: ' + f.en,
        onclick() { on ? chosen.delete(f.id) : chosen.add(f.id); Sound.tap(); render(); },
      }, on ? '✅' : '➕'),
      foodImg(f),
      h('div', { class: 'word cy', lang: 'cy' }, f.cy),
      h('div', { class: 'word en' }, f.en),
      h('div', { class: 'tools' },
        sayButton(f),
        h('button', { class: 'rec-btn', onclick(e) { toggleRecord(f, e.currentTarget); } }, '🎙️ Recordio'),
        recorded.has(f.id)
          ? h('button', { class: 'rec-btn', title: 'Delete recording', onclick: async () => { await Recordings.remove(f.id); recorded.delete(f.id); render(); } }, '🗑️')
          : null),
      recorded.has(f.id) ? h('div', { class: 'has-rec' }, '✔ your voice') : null);
    return card;
  }));
}

Recordings.keys().then(keys => { recorded = new Set(keys); render(); });
render();
