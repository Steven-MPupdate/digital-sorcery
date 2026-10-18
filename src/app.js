/**
 * app.js — Connects the page (index.html) to the logic (incantation.js).
 *
 * What it does:  Renders ingredient cards and the Magic Circle, reacts to typing,
 *                saves drafts, casts the spell, copies/downloads it, toggles the theme,
 *                keeps several open tabs in sync, and registers the service worker.
 * Depends on:    spellbook.js (data), incantation.js (logic), storage.js (device storage).
 * Used by:       index.html (<script type="module" src="./src/app.js">).
 *
 * SECURITY: All learner text is written with textContent or .value — never innerHTML —
 * so typed HTML/script is shown as plain text and never runs.
 */

import { INGREDIENTS, ITERATION_RITUAL, MAX_FIELD_LENGTH, MAX_NAME_LENGTH } from './spellbook.js';
import { normalizeDraft, scoreSpell, getCounsel, castSpell, spellFileName } from './incantation.js';
import { DRAFT_KEY, loadDraft, saveDraft, clearDraft, loadTheme, saveTheme } from './storage.js';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const $ = (selector, root = document) => root.querySelector(selector);
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Create an SVG element with attributes. */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
}

/** Create an HTML element with a class and text. */
function htmlEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/**
 * Wait until typing pauses before running `fn` (used for saving).
 * The returned function has .flush() to run any waiting call right now,
 * and .cancel() to throw it away.
 */
function debounce(fn, ms) {
  let timer;
  let pendingArgs = null;
  const debounced = (...args) => {
    pendingArgs = args;
    clearTimeout(timer);
    timer = setTimeout(debounced.flush, ms);
  };
  debounced.flush = () => {
    clearTimeout(timer);
    if (pendingArgs) fn(...pendingArgs);
    pendingArgs = null;
  };
  debounced.cancel = () => {
    clearTimeout(timer);
    pendingArgs = null;
  };
  return debounced;
}

/**
 * Set an element's text only if it changed.
 * DEV NOTE: Live regions are read aloud whenever their text is written, even if it is
 * the same. Skipping identical writes stops screen readers repeating themselves while
 * the learner types (found by the Trial by Fire).
 */
function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

// DEV NOTE: The form fields ARE the state. readDraft() collects them whenever needed,
// so there is no second copy of the data that could fall out of sync.
const fieldEls = new Map();  // ingredient id → <textarea>
let lastCast = null;         // { text, fileName } of the most recent spell
let lastCounselKey = '';     // to avoid re-rendering identical counsel

function readDraft() {
  const fields = {};
  for (const [id, el] of fieldEls) fields[id] = el.value;
  return normalizeDraft({ name: $('#spell-name').value, fields });
}

/** Put a draft into the form fields. */
function writeDraft(draft) {
  $('#spell-name').value = draft.name;
  for (const [id, el] of fieldEls) el.value = draft.fields[id];
}

/* ------------------------------------------------------------------ */
/* Rendering: ingredient cards                                         */
/* ------------------------------------------------------------------ */

/** Build one card per ingredient from the <template> in index.html. */
function renderIngredients() {
  const list = $('#ingredient-list');
  for (const ingredient of INGREDIENTS) list.append(buildCard(ingredient));
}

function buildCard(ingredient) {
  const card = $('#ingredient-template').content.firstElementChild.cloneNode(true);
  const fieldId = `field-${ingredient.id}`;

  card.dataset.id = ingredient.id;
  card.classList.toggle('is-required', ingredient.required);
  $('.numeral', card).textContent = ingredient.symbol;
  $('.rune', card).textContent = ingredient.rune;
  $('.plain', card).textContent = ingredient.plain;
  $('.why', card).textContent = ingredient.why;
  $('.weak', card).textContent = ingredient.weak;
  $('.strong', card).textContent = ingredient.strong;
  for (const question of ingredient.questions) $('.questions', card).append(htmlEl('li', '', question));

  const label = $('.field-label', card);
  label.textContent = `${ingredient.rune} — your answer`;
  label.htmlFor = fieldId;

  const textarea = $('textarea', card);
  textarea.id = fieldId;
  textarea.placeholder = ingredient.placeholder;
  textarea.maxLength = MAX_FIELD_LENGTH;
  textarea.required = ingredient.required;
  textarea.setAttribute('aria-describedby', `${fieldId}-count`);
  $('.char-count', card).id = `${fieldId}-count`;
  fieldEls.set(ingredient.id, textarea);

  if (ingredient.chips?.length) buildChips($('.chips', card), ingredient, textarea);
  return card;
}

function buildChips(container, ingredient, textarea) {
  container.hidden = false;
  for (const phrase of ingredient.chips) {
    const chip = htmlEl('button', 'chip', `+ ${phrase}`);
    chip.type = 'button';
    chip.setAttribute('aria-label', `Add "${phrase}" to ${ingredient.rune}`);
    chip.addEventListener('click', () => addChip(textarea, phrase));
    container.append(chip);
  }
}

/** Append a quick-pick phrase to a textarea on its own line (once, within the length cap). */
function addChip(textarea, phrase) {
  const lines = textarea.value.split('\n').map((line) => line.trim());
  if (lines.includes(phrase)) return; // already there
  const next = textarea.value.trim() ? `${textarea.value.replace(/\s+$/, '')}\n${phrase}` : phrase;
  if (next.length > MAX_FIELD_LENGTH) return;
  textarea.value = next;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ------------------------------------------------------------------ */
/* Rendering: the Magic Circle                                         */
/* ------------------------------------------------------------------ */

// DEV NOTE: CIRCLE_CENTER must match `transform-origin: 150px 150px` on .mc-orbit in main.css.
const CIRCLE_CENTER = 150;
const NODE_RADIUS = 104;

/** Draw the Magic Circle: turning outer ring, heptagram chords, and one node per ingredient. */
function renderCircle() {
  const svg = $('#magic-circle');
  const c = CIRCLE_CENTER;
  const points = INGREDIENTS.map((_, i) => {
    const angle = -Math.PI / 2 + (i / INGREDIENTS.length) * Math.PI * 2; // start at the top, go clockwise
    return { x: c + Math.cos(angle) * NODE_RADIUS, y: c + Math.sin(angle) * NODE_RADIUS };
  });

  svg.append(drawOrbit(c));
  svg.append(svgEl('circle', { class: 'mc-ring-gold', cx: c, cy: c, r: 126 }));
  svg.append(svgEl('circle', { class: 'mc-core', cx: c, cy: c, r: 36 }));
  svg.append(drawChords(points));
  drawNodes(points).forEach((node) => svg.append(node));
}

/** Outer ring with tick marks (this group slowly turns; see .mc-orbit in main.css). */
function drawOrbit(c) {
  const orbit = svgEl('g', { class: 'mc-orbit' });
  orbit.append(svgEl('circle', { class: 'mc-ring', cx: c, cy: c, r: 142 }));
  for (let i = 0; i < 56; i++) {
    const angle = (i / 56) * Math.PI * 2;
    const inner = i % 8 === 0 ? 134 : 138;
    orbit.append(svgEl('line', {
      class: 'mc-spoke',
      x1: c + Math.cos(angle) * inner, y1: c + Math.sin(angle) * inner,
      x2: c + Math.cos(angle) * 142, y2: c + Math.sin(angle) * 142,
    }));
  }
  return orbit;
}

/** Heptagram: connect each node to the one 3 steps ahead (the {7/3} star). */
function drawChords(points) {
  const chords = svgEl('g', { class: 'mc-chords' });
  INGREDIENTS.forEach((ingredient, i) => {
    const j = (i + 3) % INGREDIENTS.length;
    chords.append(svgEl('line', {
      class: 'mc-chord',
      'data-a': ingredient.id, 'data-b': INGREDIENTS[j].id,
      x1: points[i].x, y1: points[i].y, x2: points[j].x, y2: points[j].y,
    }));
  });
  return chords;
}

function drawNodes(points) {
  return INGREDIENTS.map((ingredient, i) => {
    const group = svgEl('g', { class: 'mc-rune', 'data-id': ingredient.id });
    group.append(svgEl('circle', { class: 'mc-node', cx: points[i].x, cy: points[i].y, r: 17 }));
    const label = svgEl('text', { class: 'mc-numeral', x: points[i].x, y: points[i].y });
    label.textContent = ingredient.symbol;
    group.append(label);
    return group;
  });
}

/* ------------------------------------------------------------------ */
/* Rendering: the Iteration Ritual                                     */
/* ------------------------------------------------------------------ */

function renderRitual() {
  const list = $('#ritual-list');
  for (const { step, prompt } of ITERATION_RITUAL) {
    const button = htmlEl('button', 'btn btn-quiet', 'Copy');
    button.type = 'button';
    button.setAttribute('aria-label', `Copy the ${step} prompt`);
    button.addEventListener('click', async () => {
      const ok = await copyText(prompt);
      button.textContent = ok ? 'Copied' : 'Copy failed';
      // Screen readers hear the result through the shared live region.
      $('#ritual-status').textContent = ok ? `${step} prompt copied.` : `Could not copy the ${step} prompt.`;
      setTimeout(() => { button.textContent = 'Copy'; }, 1600);
    });

    const li = document.createElement('li');
    li.append(htmlEl('p', 'ritual-step', step), htmlEl('p', 'ritual-prompt', prompt), button);
    list.append(li);
  }
}

/* ------------------------------------------------------------------ */
/* Updating the screen                                                 */
/* ------------------------------------------------------------------ */

const persist = debounce((draft) => {
  // Tell the learner if the browser refused to save (storage full or blocked).
  const saved = saveDraft(draft);
  setText($('#save-status'), saved
    ? ''
    : 'This browser could not save your answers. Copy or download your spell to keep it.');
}, 300);

/** Recalculate everything that depends on the answers. Called on every keystroke. */
function update({ save = true } = {}) {
  const draft = readDraft();
  const result = scoreSpell(draft);
  const filled = new Set(result.filled);

  renderStrength(result);
  renderCircleState(result, filled);
  renderCardState(filled);
  renderCounsel(getCounsel(draft), result);
  $('#cast-btn').disabled = !result.canCast;
  renderCastFreshness(draft);

  if (save) persist(draft);
}

function renderStrength(result) {
  const meter = $('#strength-meter');
  meter.value = result.score;
  meter.textContent = `${result.score}%`;
  const missing = result.missingRequired
    .map((id) => INGREDIENTS.find((ingredient) => ingredient.id === id).rune)
    .join(', ');
  setText($('#strength-text'), result.canCast
    ? `${result.score} / 100 — the circle is ready. Stronger answers make a stronger spell.`
    : `${result.score} / 100 — still needed: ${missing}.`);
}

function renderCircleState(result, filled) {
  const svg = $('#magic-circle');
  svg.classList.toggle('mc-ready', result.canCast);
  svg.querySelectorAll('.mc-rune').forEach((node) => node.classList.toggle('mc-lit', filled.has(node.dataset.id)));
  svg.querySelectorAll('.mc-chord').forEach((chord) => {
    chord.classList.toggle('on', filled.has(chord.dataset.a) && filled.has(chord.dataset.b));
  });
  // Screen-reader description of which runes are lit.
  const lit = INGREDIENTS.filter((ingredient) => filled.has(ingredient.id)).map((ingredient) => ingredient.symbol);
  setText($('#circle-desc'), lit.length
    ? `Magic circle: ${lit.length} of ${INGREDIENTS.length} runes lit (${lit.join(', ')}).`
    : 'Magic circle: no runes lit yet. Each rune lights up when you add its ingredient.');
}

function renderCardState(filled) {
  for (const [id, el] of fieldEls) {
    el.closest('.ingredient').classList.toggle('is-filled', filled.has(id));
    setText($(`#${el.id}-count`), `${el.value.length} / ${MAX_FIELD_LENGTH}`);
  }
}

function renderCounsel(hints, result) {
  const items = hints.length
    ? hints.map((hint) => ({ text: hint.message, cls: 'counsel-warn' }))
    : [{
        text: result.canCast
          ? 'No warnings. Read your answers once more as if you were the AI: could you build it without guessing?'
          : 'Start with The Intent. One clear sentence beats a page of ideas.',
        cls: 'counsel-ok',
      }];

  // Only rebuild the list when the advice actually changed (keeps screen readers quiet).
  const key = items.map((item) => item.text).join('\n');
  if (key === lastCounselKey) return;
  lastCounselKey = key;
  $('#counsel-list').replaceChildren(...items.map((item) => htmlEl('li', item.cls, item.text)));
}

/** Warn when the shown spell no longer matches the answers; clear the warning if it does again. */
function renderCastFreshness(draft) {
  if (!lastCast) return;
  const stale = castSpell(draft) !== lastCast.text;
  setText($('#cast-status'), stale
    ? 'Your ingredients changed. Cast again to update the prompt.'
    : 'The spell is cast. Copy it into your AI builder.');
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function cast() {
  const draft = readDraft();
  if (!scoreSpell(draft).canCast) return; // DEV NOTE: button is disabled too; double guard.
  // Remember the file name WITH the text, so a later rename can't mismatch the download.
  lastCast = { text: castSpell(draft), fileName: spellFileName(draft.name) };
  $('#spell-text').textContent = lastCast.text;
  $('#spell-output').hidden = false;
  $('#cast-status').textContent = 'The spell is cast. Copy it into your AI builder.';
  // DEV NOTE: focus the prompt; the Copy/Download buttons come right after it in tab order.
  $('#spell-text').focus();
}

/** Copy text. Uses the modern Clipboard API, with an older fallback for some browsers. */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.className = 'sr-only';
    document.body.append(helper);
    helper.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    helper.remove();
    return ok;
  }
}

function download() {
  if (!lastCast) return;
  const blob = new Blob([lastCast.text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = lastCast.fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // DEV NOTE: revoke later, not immediately — some mobile browsers start the download async.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function reset() {
  // DEV NOTE: confirm() is plain but accessible and works everywhere; fine for v1.
  if (!window.confirm('Clear every ingredient? This cannot be undone.')) return;
  persist.cancel(); // otherwise a save still waiting from typing would restore the old draft
  clearDraft();
  writeDraft(normalizeDraft({}));
  lastCast = null;
  $('#spell-output').hidden = true;
  $('#spell-text').textContent = '';
  $('#cast-status').textContent = 'The circle is clear.';
  update({ save: false });
}

/* ------------------------------------------------------------------ */
/* Several tabs & the back button                                      */
/* ------------------------------------------------------------------ */

/**
 * Keep this tab in step with the saved draft.
 * DEV NOTE: Without this, two open tabs (or a page restored by the Back button) would
 * silently overwrite each other's answers (found by the Trial by Fire). The newest save
 * wins and this tab shows it.
 */
function syncFromStorage(message) {
  persist.cancel();
  writeDraft(loadDraft());
  update({ save: false });
  if (message) $('#save-status').textContent = message;
}

/* ------------------------------------------------------------------ */
/* Theme, install & offline                                            */
/* ------------------------------------------------------------------ */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = $('#theme-btn');
  button.textContent = theme === 'light' ? 'Ink' : 'Ivory';
  button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark Ink theme' : 'Switch to light Ivory theme');
  // The phone's status-bar color follows the page background token from brand.css.
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  if (surface) $('meta[name="theme-color"]').setAttribute('content', surface);
}

function setupInstall() {
  let deferredPrompt = null;
  const button = $('#install-btn');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // show our own button instead of the browser's mini-bar
    deferredPrompt = event;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.hidden = true;
  });
}

function registerServiceWorker() {
  // DEV NOTE: Service workers only run on https:// or localhost.
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(() => {
    /* Offline mode is a bonus; the app works without it. */
  });
}

/* ------------------------------------------------------------------ */
/* Start                                                               */
/* ------------------------------------------------------------------ */

function bindEvents() {
  // One listener for every field (event delegation).
  $('main').addEventListener('input', (event) => {
    if (event.target.matches('textarea, #spell-name')) update();
  });
  $('#cast-btn').addEventListener('click', cast);
  $('#copy-btn').addEventListener('click', async () => {
    const ok = await copyText(lastCast?.text || '');
    $('#cast-status').textContent = ok ? 'Copied. Paste it into your AI builder.' : 'Copy failed. Select the text and copy it by hand.';
  });
  $('#download-btn').addEventListener('click', download);
  $('#reset-btn').addEventListener('click', reset);
  $('#theme-btn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    saveTheme(next);
  });

  // Save immediately if the page is hidden or closed mid-typing, so the last keystrokes survive.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist.flush();
  });
  window.addEventListener('pagehide', () => persist.flush());

  // Another tab saved the draft → show it here.
  window.addEventListener('storage', (event) => {
    if (event.key === DRAFT_KEY) syncFromStorage('Updated with changes from another tab.');
  });
  // Page restored from the Back/Forward cache → it may be out of date.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) syncFromStorage();
  });
}

function init() {
  applyTheme(loadTheme());
  $('#spell-name').maxLength = MAX_NAME_LENGTH;
  renderIngredients();
  writeDraft(loadDraft());
  renderCircle();
  renderRitual();
  bindEvents();
  setupInstall();
  registerServiceWorker();
  update({ save: false });
}

init();
