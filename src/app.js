/**
 * app.js: Connects the page (index.html) to the logic (incantation.js).
 *
 * What it does:  Renders ingredient cards and the Magic Circle, reacts to typing,
 *                saves drafts, casts the spell, copies/downloads it, toggles the theme,
 *                keeps several open tabs in sync, shows the example spells, and starts the
 *                footer tools (src/app-tools.js: Download app, Hard refresh, offline mode).
 * Depends on:    spellbook.js, portals.js, examples.js (data), incantation.js (logic),
 *                storage.js (device storage), app-tools.js (footer buttons, service worker).
 * Used by:       index.html (<script type="module" src="./src/app.js">).
 *
 * SECURITY: All learner text is written with textContent or .value, never innerHTML,
 * so typed HTML/script is shown as plain text and never runs.
 */

import { INGREDIENTS, ITERATION_RITUAL, MAX_FIELD_LENGTH, MAX_NAME_LENGTH } from './spellbook.js';
import { normalizeDraft, hasContent, scoreSpell, getCounsel, castSpell, spellFileName } from './incantation.js';
import { DRAFT_KEY, loadDraft, saveDraft, clearDraft, loadTheme, saveTheme } from './storage.js';
import { PORTALS, PORTAL_GROUPS, COMING_SOON } from './portals.js';
import { EXAMPLE_SPELLS, EXAMPLE_FILL_IDS } from './examples.js';
import { initAppTools } from './app-tools.js';

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
  label.textContent = `${ingredient.rune}: your answer`;
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

/**
 * The place on the circle (0 = top, then clockwise) where ingredient number `index` sits.
 * DEV NOTE: the star line (a {7/3} heptagram) jumps three places at a time. Putting ingredient k
 * at place 3k means the line travels I, II, III ... VII and back to I in order, so the numbers
 * follow the line (Steven, 2026-10-22).
 */
function circlePlace(index) {
  return (index * 3) % INGREDIENTS.length;
}

/** Draw the Magic Circle: turning outer ring, the star line, and one node per ingredient. */
function renderCircle() {
  const svg = $('#magic-circle');
  const c = CIRCLE_CENTER;
  const points = INGREDIENTS.map((_, i) => {
    // start at the top, go clockwise
    const angle = -Math.PI / 2 + (circlePlace(i) / INGREDIENTS.length) * Math.PI * 2;
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

/** The star line: connect each ingredient to the next one (VII back to I), see circlePlace. */
function drawChords(points) {
  const chords = svgEl('g', { class: 'mc-chords' });
  INGREDIENTS.forEach((ingredient, i) => {
    const j = (i + 1) % INGREDIENTS.length;
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
/* Rendering: the Portals (open the spell in an AI app)                */
/* ------------------------------------------------------------------ */

function renderPortals() {
  const container = $('#portal-groups');
  for (const [kind, group] of Object.entries(PORTAL_GROUPS)) {
    const wrapper = htmlEl('div', 'portal-group');
    const list = htmlEl('div', 'portal-list');
    for (const portal of PORTALS.filter((p) => p.kind === kind)) list.append(buildPortalLink(portal));
    wrapper.append(htmlEl('h4', 'portal-group-title', group.title), htmlEl('p', 'hint', group.note), list);
    if (COMING_SOON.group === kind) wrapper.append(buildComingSoon());
    container.append(wrapper);
  }
}

/** The "coming soon" card for our own builder. Plain text, not a button: nothing to tap yet. */
function buildComingSoon() {
  const card = htmlEl('div', 'portal-soon');
  card.append(
    htmlEl('p', 'portal-soon-tag', 'Coming soon'),
    htmlEl('p', 'portal-soon-name', COMING_SOON.name),
    htmlEl('p', 'portal-soon-note', COMING_SOON.note),
  );
  return card;
}

/**
 * A portal link: copies the up-to-date spell first, and only opens the AI app if the copy
 * worked (so nobody lands in an AI app with the wrong text on their clipboard).
 * SECURITY: rel="noopener noreferrer" on the link, and opener cleared on the new window,
 * so the other site can't control this page. The page's no-referrer policy hides where
 * visitors came from. The URL is fixed in portals.js, never built from input.
 * DEV NOTE: it stays a real <a href> so it still works as a plain link if scripts fail,
 * and so screen readers announce it as a link.
 */
function buildPortalLink(portal) {
  const link = htmlEl('a', 'btn btn-portal', portal.name);
  // Visible name first (voice control: "tap Claude"), extra detail for screen readers only.
  link.append(htmlEl('span', 'sr-only', ', copies your spell, opens in a new tab'));
  link.href = portal.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.dataset.portal = portal.id;

  const openPortal = async (event) => {
    event.preventDefault();
    const status = $('#portal-status');
    const spell = ensureFreshCast();
    if (!spell) {
      status.textContent = 'Add the required ingredients (I–III) and cast the spell first.';
      return;
    }
    const ok = await copyText(spell.text);
    if (!ok) {
      status.textContent = `Could not copy, so ${portal.name} was not opened. Select the spell above, copy it, then try again.`;
      return;
    }
    // DEV NOTE: opened right after the quick copy, still within the tap's "user gesture" window.
    const opened = window.open(portal.url, '_blank');
    if (opened) opened.opener = null; // SECURITY: the new tab can't reach back into this page
    status.textContent = opened
      ? `Spell copied. Paste it into ${portal.name}.`
      : `Spell copied. Your browser blocked the new tab. Tap ${portal.name} again to open it.`;
  };
  link.addEventListener('click', openPortal);
  // Middle-click opens tabs without a "click" event; handle it the same way.
  link.addEventListener('auxclick', (event) => { if (event.button === 1) openPortal(event); });
  return link;
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
    ? `${result.score} / 100. The circle is ready. Stronger answers make a stronger spell.`
    : `${result.score} / 100. Still needed: ${missing}.`);
}

function renderCircleState(result, filled) {
  const svg = $('#magic-circle');
  svg.classList.toggle('mc-ready', result.canCast);
  svg.querySelectorAll('.mc-rune').forEach((node) => node.classList.toggle('mc-lit', filled.has(node.dataset.id)));
  svg.querySelectorAll('.mc-chord').forEach((chord) => {
    chord.classList.toggle('on', filled.has(chord.dataset.a) && filled.has(chord.dataset.b));
    // A line is as bright as the weaker of its two answers (0 to 1), see .mc-chord in main.css.
    // DEV NOTE: style.setProperty is allowed by the strict CSP; a style="" attribute would not be.
    const strength = Math.min(result.credits[chord.dataset.a], result.credits[chord.dataset.b]);
    chord.style.setProperty('--strength', strength.toFixed(2));
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
  // Each hint names the ingredient to fix (`target`); those become buttons that go there.
  const items = hints.length
    ? hints.map((hint) => ({ text: hint.message, cls: 'counsel-warn', target: hint.id }))
    : [{
        text: result.canCast
          ? 'No warnings. Read your answers once more as if you were the AI: could you build it without guessing?'
          : 'Start with The Intent. One clear sentence beats a page of ideas.',
        cls: 'counsel-ok',
        target: result.canCast ? null : 'intent',
      }];

  // Only rebuild the list when the advice actually changed (keeps screen readers quiet).
  const key = items.map((item) => `${item.target}:${item.text}`).join('\n');
  if (key === lastCounselKey) return;
  lastCounselKey = key;
  $('#counsel-list').replaceChildren(...items.map(buildCounselItem));
}

function buildCounselItem({ text, cls, target }) {
  const item = htmlEl('li', cls);
  if (!target) {
    item.textContent = text;
    return item;
  }
  const ingredient = INGREDIENTS.find((entry) => entry.id === target);
  const button = htmlEl('button', 'counsel-link', text);
  button.type = 'button';
  // Visible text first (voice control reads it), where it goes for screen readers only.
  button.append(htmlEl('span', 'sr-only', `. Go to ${ingredient.rune}.`));
  button.addEventListener('click', () => goToIngredient(target));
  item.append(button);
  return item;
}

/** Scroll to an ingredient card and put the cursor in its answer box. */
function goToIngredient(id) {
  const field = fieldEls.get(id);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  field.closest('.ingredient').scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  field.focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ */
/* Example spells: the picker under the name, and the pop-up           */
/* ------------------------------------------------------------------ */

function renderExamplePicker() {
  const picker = $('#example-picker');
  for (const example of EXAMPLE_SPELLS) {
    const chip = htmlEl('button', 'chip', example.name);
    chip.type = 'button';
    chip.dataset.example = example.id;
    chip.setAttribute('aria-label', `Fill in the ${example.name} example: name and ingredients I to III`);
    chip.addEventListener('click', () => useExample(example));
    picker.append(chip);
  }
}

/**
 * Fill in an example's name and ingredients I to III (IV to VII are left as they are).
 * Asks first if that would replace anything the learner typed. Returns true if it filled.
 */
function useExample(example) {
  const current = readDraft();
  const wouldReplace = [current.name, ...EXAMPLE_FILL_IDS.map((id) => current.fields[id])]
    .some((text) => hasContent(text));
  const message = `Replace your spell name and ingredients I to III with the ${example.name} example?`;
  if (wouldReplace && !window.confirm(message)) return false;

  $('#spell-name').value = example.name;
  for (const id of EXAMPLE_FILL_IDS) fieldEls.get(id).value = example.fields[id];
  update();
  goToIngredient('intent');
  return true;
}

function renderExamplesDialog() {
  const dialog = $('#examples-dialog');
  const body = $('#examples-body');
  for (const example of EXAMPLE_SPELLS) {
    const section = htmlEl('section', 'example-spell');
    const title = htmlEl('h3', 'example-name', example.name);
    title.id = `example-${example.id}`;
    section.setAttribute('aria-labelledby', title.id);

    const answers = htmlEl('dl', 'example-fields');
    for (const ingredient of INGREDIENTS) {
      answers.append(
        htmlEl('dt', '', `${ingredient.symbol} · ${ingredient.rune}`),
        htmlEl('dd', '', example.fields[ingredient.id]),
      );
    }

    const use = htmlEl('button', 'btn btn-secondary', `Use ${example.name}`);
    use.type = 'button';
    use.setAttribute('aria-label', `Use ${example.name}: fills in the name and ingredients I to III`);
    use.addEventListener('click', () => {
      dialog.close();
      useExample(example);
    });

    section.append(title, htmlEl('p', 'hint', example.pitch), answers, use);
    body.append(section);
  }

  $('#examples-btn').addEventListener('click', () => dialog.showModal());
  $('#examples-close').addEventListener('click', () => dialog.close());
  // A tap on the dimmed area around the pop-up closes it (the pop-up's own box is .dialog-inner).
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

/**
 * Make sure the spell about to be copied matches the current answers.
 * Re-casts automatically if answers changed; returns null if the spell can't be cast now
 * (e.g. required answers were removed, or another tab cleared the circle).
 * DEV NOTE: found by the Trial by Fire: copying used to send the OLD spell after edits.
 */
function ensureFreshCast() {
  if (!lastCast) return null;
  const draft = readDraft();
  if (!scoreSpell(draft).canCast) return null;
  const text = castSpell(draft);
  if (text !== lastCast.text) {
    lastCast = { text, fileName: spellFileName(draft.name) };
    $('#spell-text').textContent = text;
    $('#cast-status').textContent = 'The spell is cast. Copy it into your AI builder.';
  }
  return lastCast;
}

/** Warn when the shown spell no longer matches the answers; clear the warning if it does again. */
function renderCastFreshness(draft) {
  if (!lastCast) return;
  const stale = castSpell(draft) !== lastCast.text;
  setText($('#cast-status'), stale
    ? 'Your ingredients changed. Cast again to see the updated prompt. (Copy, Download and the AI buttons always use your latest answers.)'
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
    // DEV NOTE: the fallback moves focus to a hidden box; remember where focus was and put
    // it back afterwards, so keyboard users don't lose their place.
    const previousFocus = document.activeElement;
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.className = 'sr-only';
    document.body.append(helper);
    helper.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    helper.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
    return ok;
  }
}

function download() {
  const spell = ensureFreshCast();
  if (!spell) {
    $('#copy-status').textContent = 'Add the required ingredients (I–III) and cast the spell first.';
    return;
  }
  const blob = new Blob([spell.text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = spell.fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // DEV NOTE: revoke later, not immediately: some mobile browsers start the download async.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function reset() {
  // DEV NOTE: confirm() is plain but accessible and works everywhere; fine for v1.
  if (!window.confirm('Clear every ingredient? This cannot be undone.')) return;
  persist.cancel(); // otherwise a save still waiting from typing would restore the old draft
  clearDraft();
  writeDraft(normalizeDraft({}));
  hideSpell();
  $('#cast-status').textContent = 'The circle is clear.';
  update({ save: false });
}

/** Hide the cast spell and forget it (used by Clear, and when another tab clears). */
function hideSpell() {
  lastCast = null;
  $('#spell-output').hidden = true;
  $('#spell-text').textContent = '';
  $('#copy-status').textContent = '';
  $('#portal-status').textContent = '';
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
  const draft = loadDraft();
  writeDraft(draft);
  // If the circle was cleared elsewhere, don't keep showing (or copying) the old spell here.
  if (lastCast && !scoreSpell(draft).canCast) {
    hideSpell();
    $('#cast-status').textContent = '';
  }
  update({ save: false });
  if (message) $('#save-status').textContent = message;
}

/* ------------------------------------------------------------------ */
/* Theme                                                               */
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
    const status = $('#copy-status');
    const spell = ensureFreshCast();
    if (!spell) { status.textContent = 'Add the required ingredients (I–III) and cast the spell first.'; return; }
    const ok = await copyText(spell.text);
    status.textContent = ok ? 'Copied. Paste it into your AI builder.' : 'Copy failed. Select the text and copy it by hand.';
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
  renderExamplePicker();
  renderExamplesDialog();
  renderRitual();
  renderPortals();
  bindEvents();
  // Download app, Hard refresh and offline mode (src/app-tools.js).
  initAppTools({
    setStatus: (text) => setText($('#app-tools-status'), text),
    beforeRefresh: () => persist.flush(),
  });
  update({ save: false });
}

init();
