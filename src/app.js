/**
 * app.js — Connects the page (index.html) to the logic (incantation.js).
 *
 * What it does:  Renders ingredient cards and the Magic Circle, reacts to typing,
 *                saves drafts, casts the spell, copies/downloads it, toggles the theme,
 *                and registers the service worker for offline use.
 * Depends on:    spellbook.js (data), incantation.js (logic), storage.js (device storage).
 * Used by:       index.html (<script type="module" src="./src/app.js">).
 *
 * SECURITY: All learner text is written with textContent or .value — never innerHTML —
 * so typed HTML/script is shown as plain text and never runs.
 */

import { INGREDIENTS, ITERATION_RITUAL, MAX_FIELD_LENGTH } from './spellbook.js';
import { normalizeDraft, scoreSpell, getCounsel, castSpell, spellFileName } from './incantation.js';
import { loadDraft, saveDraft, clearDraft, loadTheme, saveTheme } from './storage.js';

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

/** Show a short message in a live region (read aloud by screen readers). */
function announce(el, message) {
  el.textContent = message;
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

// DEV NOTE: The form fields ARE the state. readDraft() collects them whenever needed,
// so there is no second copy of the data that could fall out of sync.
const fieldEls = new Map(); // ingredient id → <textarea>
let lastCastText = '';      // the most recent spell, for copy/download

function readDraft() {
  const fields = {};
  for (const [id, el] of fieldEls) fields[id] = el.value;
  return normalizeDraft({ name: $('#spell-name').value, fields });
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

/** Build one card per ingredient from the <template> in index.html. */
function renderIngredients(draft) {
  const list = $('#ingredient-list');
  const template = $('#ingredient-template');

  for (const ingredient of INGREDIENTS) {
    const card = template.content.firstElementChild.cloneNode(true);
    const fieldId = `field-${ingredient.id}`;

    card.dataset.id = ingredient.id;
    card.classList.toggle('is-required', ingredient.required);
    $('.numeral', card).textContent = ingredient.symbol;
    $('.rune', card).textContent = ingredient.rune;
    $('.plain', card).textContent = ingredient.plain;
    $('.why', card).textContent = ingredient.why;
    $('.weak', card).textContent = ingredient.weak;
    $('.strong', card).textContent = ingredient.strong;

    const questions = $('.questions', card);
    for (const question of ingredient.questions) {
      const li = document.createElement('li');
      li.textContent = question;
      questions.append(li);
    }

    const label = $('.field-label', card);
    label.textContent = `${ingredient.rune} — your answer`;
    label.htmlFor = fieldId;

    const textarea = $('textarea', card);
    textarea.id = fieldId;
    textarea.placeholder = ingredient.placeholder;
    textarea.maxLength = MAX_FIELD_LENGTH;
    textarea.value = draft.fields[ingredient.id];
    if (ingredient.required) textarea.required = true;
    textarea.setAttribute('aria-describedby', `${fieldId}-count`);
    $('.char-count', card).id = `${fieldId}-count`;
    fieldEls.set(ingredient.id, textarea);

    if (ingredient.chips?.length) {
      const chips = $('.chips', card);
      chips.hidden = false;
      for (const phrase of ingredient.chips) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = `+ ${phrase}`;
        chip.setAttribute('aria-label', `Add "${phrase}" to ${ingredient.rune}`);
        chip.addEventListener('click', () => addChip(textarea, phrase));
        chips.append(chip);
      }
    }

    list.append(card);
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

/**
 * Draw the Magic Circle: an outer turning ring, a heptagram of chords between the
 * seven ingredient nodes, and a numeral on each node.
 */
function renderCircle() {
  const svg = $('#magic-circle');
  const cx = 150;
  const cy = 150;
  const nodeRadius = 104;
  const count = INGREDIENTS.length;

  // Outer ring with tick marks (this group slowly turns; see .mc-orbit in main.css).
  const orbit = svgEl('g', { class: 'mc-orbit' });
  orbit.append(svgEl('circle', { class: 'mc-ring', cx, cy, r: 142 }));
  for (let i = 0; i < 56; i++) {
    const angle = (i / 56) * Math.PI * 2;
    const inner = i % 8 === 0 ? 134 : 138;
    orbit.append(svgEl('line', {
      class: 'mc-spoke',
      x1: cx + Math.cos(angle) * inner, y1: cy + Math.sin(angle) * inner,
      x2: cx + Math.cos(angle) * 142, y2: cy + Math.sin(angle) * 142,
    }));
  }
  svg.append(orbit);
  svg.append(svgEl('circle', { class: 'mc-ring-gold', cx, cy, r: 126 }));
  svg.append(svgEl('circle', { class: 'mc-core', cx, cy, r: 36 }));

  // Node positions, starting at the top and going clockwise.
  const points = INGREDIENTS.map((_, i) => {
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
    return { x: cx + Math.cos(angle) * nodeRadius, y: cy + Math.sin(angle) * nodeRadius };
  });

  // Heptagram chords: connect each node to the one 3 steps ahead ({7/3} star).
  const chords = svgEl('g', { class: 'mc-chords' });
  INGREDIENTS.forEach((ingredient, i) => {
    const j = (i + 3) % count;
    chords.append(svgEl('line', {
      class: 'mc-chord',
      'data-a': ingredient.id, 'data-b': INGREDIENTS[j].id,
      x1: points[i].x, y1: points[i].y, x2: points[j].x, y2: points[j].y,
    }));
  });
  svg.append(chords);

  // Nodes.
  INGREDIENTS.forEach((ingredient, i) => {
    const group = svgEl('g', { class: 'mc-rune', 'data-id': ingredient.id });
    group.append(svgEl('circle', { class: 'mc-node', cx: points[i].x, cy: points[i].y, r: 17 }));
    const label = svgEl('text', { class: 'mc-numeral', x: points[i].x, y: points[i].y });
    label.textContent = ingredient.symbol;
    group.append(label);
    svg.append(group);
  });
}

/** Fill the Iteration Ritual list, each with its own copy button. */
function renderRitual() {
  const list = $('#ritual-list');
  for (const { step, prompt } of ITERATION_RITUAL) {
    const li = document.createElement('li');
    const title = document.createElement('p');
    title.className = 'ritual-step';
    title.textContent = step;
    const text = document.createElement('p');
    text.className = 'ritual-prompt';
    text.textContent = prompt;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-quiet';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', `Copy the ${step} prompt`);
    button.addEventListener('click', async () => {
      const ok = await copyText(prompt);
      button.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(() => { button.textContent = 'Copy'; }, 1600);
    });
    li.append(title, text, button);
    list.append(li);
  }
}

/* ------------------------------------------------------------------ */
/* Updating the screen                                                 */
/* ------------------------------------------------------------------ */

const persist = debounce((draft) => saveDraft(draft), 300);

/** Recalculate everything that depends on the answers. Called on every keystroke. */
function update({ save = true } = {}) {
  const draft = readDraft();
  const result = scoreSpell(draft);
  const filled = new Set(result.filled);

  // Strength meter + message.
  $('#strength-meter').value = result.score;
  $('#strength-meter').textContent = `${result.score}%`;
  const missing = result.missingRequired
    .map((id) => INGREDIENTS.find((ingredient) => ingredient.id === id).rune)
    .join(', ');
  $('#strength-text').textContent = result.canCast
    ? `${result.score} / 100 — the circle is ready. Stronger answers make a stronger spell.`
    : `${result.score} / 100 — still needed: ${missing}.`;

  // Circle nodes and chords.
  const svg = $('#magic-circle');
  svg.classList.toggle('mc-ready', result.canCast);
  svg.querySelectorAll('.mc-rune').forEach((node) => {
    node.classList.toggle('mc-lit', filled.has(node.dataset.id));
  });
  svg.querySelectorAll('.mc-chord').forEach((chord) => {
    chord.classList.toggle('on', filled.has(chord.dataset.a) && filled.has(chord.dataset.b));
  });

  // Cards + character counts.
  for (const [id, el] of fieldEls) {
    el.closest('.ingredient').classList.toggle('is-filled', filled.has(id));
    $(`#${el.id}-count`).textContent = `${el.value.length} / ${MAX_FIELD_LENGTH}`;
  }

  // Counsel.
  renderCounsel(getCounsel(draft), result);

  // Cast button.
  $('#cast-btn').disabled = !result.canCast;

  // If a spell was already cast, warn that it no longer matches the answers.
  if (lastCastText && castSpell(draft) !== lastCastText) {
    announce($('#cast-status'), 'Your ingredients changed. Cast again to update the prompt.');
  }

  if (save) persist(draft);
}

function renderCounsel(hints, result) {
  const list = $('#counsel-list');
  list.replaceChildren();
  const items = hints.length
    ? hints.map((hint) => ({ text: hint.message, cls: 'counsel-warn' }))
    : [{
        text: result.canCast
          ? 'No warnings. Read your answers once more as if you were the AI: could you build it without guessing?'
          : 'Start with The Intent. One clear sentence beats a page of ideas.',
        cls: 'counsel-ok',
      }];
  for (const item of items) {
    const li = document.createElement('li');
    li.className = item.cls;
    li.textContent = item.text;
    list.append(li);
  }
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function cast() {
  const draft = readDraft();
  if (!scoreSpell(draft).canCast) return; // DEV NOTE: button is disabled too; double guard.
  lastCastText = castSpell(draft);
  $('#spell-text').textContent = lastCastText;
  $('#spell-output').hidden = false;
  announce($('#cast-status'), 'The spell is cast. Copy it into your AI builder.');
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
  if (!lastCastText) return;
  const blob = new Blob([lastCastText], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = spellFileName(readDraft().name);
  document.body.append(link);
  link.click();
  link.remove();
  // DEV NOTE: revoke later, not immediately — some mobile browsers start the download async.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function reset() {
  // DEV NOTE: confirm() is plain but accessible and works everywhere; fine for v1.
  if (!window.confirm('Clear every ingredient? This cannot be undone.')) return;
  persist.cancel(); // DEV NOTE: otherwise a save still waiting from typing would restore the old draft
  clearDraft();
  $('#spell-name').value = '';
  for (const el of fieldEls.values()) el.value = '';
  lastCastText = '';
  $('#spell-output').hidden = true;
  $('#spell-text').textContent = '';
  announce($('#cast-status'), 'The circle is clear.');
  update({ save: false });
}

/* ------------------------------------------------------------------ */
/* Theme, install & offline                                            */
/* ------------------------------------------------------------------ */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = $('#theme-btn');
  button.textContent = theme === 'light' ? 'Ink' : 'Ivory';
  button.setAttribute('aria-pressed', String(theme === 'light'));
  button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark Ink theme' : 'Switch to light Ivory theme');
  $('meta[name="theme-color"]').setAttribute('content', theme === 'light' ? '#F6F1E7' : '#0E0D0B');
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

function init() {
  applyTheme(loadTheme());
  const draft = loadDraft();
  $('#spell-name').value = draft.name;

  renderIngredients(draft);
  renderCircle();
  renderRitual();

  // One listener for every field (event delegation).
  $('main').addEventListener('input', (event) => {
    if (event.target.matches('textarea, #spell-name')) update();
  });
  $('#cast-btn').addEventListener('click', cast);
  $('#copy-btn').addEventListener('click', async () => {
    const ok = await copyText(lastCastText);
    announce($('#cast-status'), ok ? 'Copied. Paste it into your AI builder.' : 'Copy failed. Select the text and copy it by hand.');
  });
  $('#download-btn').addEventListener('click', download);
  $('#reset-btn').addEventListener('click', reset);
  $('#theme-btn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    saveTheme(next);
  });

  // DEV NOTE: Save immediately if the page is hidden or closed mid-typing, so the last
  // few keystrokes are not lost (found by the Trial by Fire tests).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist.flush();
  });
  window.addEventListener('pagehide', () => persist.flush());

  setupInstall();
  registerServiceWorker();
  update({ save: false });
}

init();
