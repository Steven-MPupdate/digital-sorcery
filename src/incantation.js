/**
 * incantation.js — The brain of the app. Pure functions only (no DOM, no storage).
 *
 * What it does:  1. Cleans and validates a draft (the learner's answers).
 *                2. Scores "Spell Strength" (0–100) and decides if the spell can be cast.
 *                3. Gives "Counsel" — teaching hints about weak answers.
 *                4. Casts the spell: turns the draft into a Markdown starter prompt.
 * Depends on:    src/spellbook.js (ingredient definitions).
 * Used by:       src/app.js (UI) and tests/unit/incantation.test.js.
 *
 * DEV NOTE: Keeping this file free of DOM code means it can be tested in Node with no
 * browser, and the same logic could later run in a server function or another app.
 */

import { INGREDIENTS, MAX_FIELD_LENGTH, MAX_NAME_LENGTH } from './spellbook.js';

/* ------------------------------------------------------------------ */
/* 1. Cleaning                                                         */
/* ------------------------------------------------------------------ */

// SECURITY: Characters we strip from all input.
//  - C0 control chars except tab (\t) and newline (\n)
//  - DEL and C1 control chars
//  - Bidirectional override/isolate chars (U+202A–U+202E, U+2066–U+2069). These can make
//    text display in a different order than it really is ("Trojan Source" trick), which
//    could hide instructions inside a copied prompt.
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‪-‮⁦-⁩]/g;

/**
 * Turn any value into a safe, length-limited string.
 * @param {unknown} value  Anything (user input or parsed JSON).
 * @param {number}  max    Maximum length to keep.
 * @returns {string}
 */
export function cleanText(value, max = MAX_FIELD_LENGTH) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n') // Windows/old-Mac line endings → \n
    .replace(UNSAFE_CHARS, '')
    .slice(0, max);
}

/**
 * Build a clean draft from untrusted data (e.g. something read back from localStorage).
 * Only known keys are copied, so unexpected keys like "__proto__" are ignored.
 *
 * @param {unknown} raw
 * @returns {{ name: string, fields: Record<string, string> }}
 */
export function normalizeDraft(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const rawFields = source.fields && typeof source.fields === 'object' ? source.fields : {};

  const fields = {};
  for (const ingredient of INGREDIENTS) {
    // SECURITY: Object.hasOwn avoids reading inherited values from a polluted prototype.
    const value = Object.hasOwn(rawFields, ingredient.id) ? rawFields[ingredient.id] : '';
    fields[ingredient.id] = cleanText(value, MAX_FIELD_LENGTH);
  }

  const name = Object.hasOwn(source, 'name') ? cleanText(source.name, MAX_NAME_LENGTH) : '';
  // DEV NOTE: The name is a single line — fold any newlines into spaces.
  return { name: name.replace(/\n+/g, ' '), fields };
}

/** An empty draft. */
export function emptyDraft() {
  return normalizeDraft({});
}

/* ------------------------------------------------------------------ */
/* 2. Spell Strength                                                   */
/* ------------------------------------------------------------------ */

/**
 * How much credit (0–1) an answer earns.
 * Any real content earns at least 30%; full credit at `fullAt` characters.
 * DEV NOTE: Length is a rough proxy for detail. It is a nudge, not a grade.
 */
export function ingredientCredit(text, fullAt) {
  const length = text.trim().length;
  if (length === 0) return 0;
  return Math.min(1, Math.max(0.3, length / fullAt));
}

/**
 * Score a draft.
 * @param {{ fields: Record<string, string> }} draft  A normalized draft.
 * @returns {{ score: number, filled: string[], missingRequired: string[], canCast: boolean }}
 */
export function scoreSpell(draft) {
  let total = 0;
  const filled = [];
  const missingRequired = [];

  for (const ingredient of INGREDIENTS) {
    const text = draft.fields[ingredient.id] || '';
    const credit = ingredientCredit(text, ingredient.fullAt);
    total += credit * ingredient.weight;
    if (credit > 0) filled.push(ingredient.id);
    else if (ingredient.required) missingRequired.push(ingredient.id);
  }

  return {
    score: Math.round(total),
    filled,
    missingRequired,
    canCast: missingRequired.length === 0,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Counsel (teaching hints)                                         */
/* ------------------------------------------------------------------ */

// Words that usually mean "I haven't decided". Matched as whole words, case-insensitive.
const VAGUE_WORDS = ['whatever', 'everything', 'anything', 'everyone', 'anyone', 'stuff', 'etc', 'best', 'tbd'];

/**
 * Teaching hints for the current draft. Each hint points at one ingredient.
 * @param {{ fields: Record<string, string> }} draft
 * @returns {{ id: string, message: string }[]}
 */
export function getCounsel(draft) {
  const hints = [];
  const f = draft.fields;

  for (const ingredient of INGREDIENTS) {
    const text = (f[ingredient.id] || '').toLowerCase();
    const vague = VAGUE_WORDS.find((word) => new RegExp(`\\b${word}\\b`).test(text));
    if (vague) {
      hints.push({
        id: ingredient.id,
        message: `${ingredient.rune}: "${vague}" is vague. Name something specific so the AI doesn't guess.`,
      });
    }
  }

  const powerLines = (f.powers || '').split('\n').filter((line) => line.trim()).length;
  if (powerLines > 7) {
    hints.push({
      id: 'powers',
      message: `The Powers: ${powerLines} features is a lot for v1. Keep 3–5 and move the rest to The Wards.`,
    });
  }

  if ((f.intent || '').trim() && !(f.wards || '').trim()) {
    hints.push({
      id: 'wards',
      message: 'The Wards: say what you will NOT build yet. It keeps v1 small enough to finish.',
    });
  }

  return hints;
}

/* ------------------------------------------------------------------ */
/* 4. Casting                                                          */
/* ------------------------------------------------------------------ */

/**
 * Stop a learner's line that starts with "#" from becoming a Markdown heading,
 * which would break the structure of the prompt.
 */
function protectMarkdown(text) {
  return text
    .trim()
    .split('\n')
    .map((line) => (/^\s*#/.test(line) ? line.replace('#', '\\#') : line))
    .join('\n');
}

const NOT_DECIDED =
  '_Not decided yet._ Suggest 2–3 sensible options with their trade-offs, recommend one, and ask me to choose.';

/** The closing instructions included in every spell. Exported so the glossary/tests can reference it. */
export const WORKING_AGREEMENT = [
  'Read everything above. List any assumptions you are making.',
  'Ask me up to 5 clarifying questions — the ones that would change the design most. Wait for my answers.',
  'Propose a small v1 plan: screens, what data is stored and where, file structure, and tools. Wait for my OK.',
  'Build in small steps. After each step, tell me exactly how to test it on my phone.',
  'Write readable code with comments, and keep a short glossary of any names or terms we invent.',
  'Keep a handoff note so someone else could continue the project.',
  'Never put passwords, API keys or other secrets in the code.',
];

/**
 * Turn a draft into the Markdown starter prompt.
 * @param {{ name: string, fields: Record<string, string> }} draft  A normalized draft.
 * @returns {string}
 */
export function castSpell(draft) {
  const title = draft.name.trim() || 'Untitled app';
  const lines = [
    `# Spell: ${protectMarkdown(title)}`,
    '',
    '_A starter prompt cast with Digital Sorcery._',
    '',
    'You are my app-building partner. Below are the ingredients for a new app.',
    'Your first job is NOT to write code. Your first job is to make sure we understand each other.',
    '',
  ];

  for (const ingredient of INGREDIENTS) {
    const text = (draft.fields[ingredient.id] || '').trim();
    lines.push(`## ${ingredient.heading}`, text ? protectMarkdown(text) : NOT_DECIDED, '');
  }

  lines.push('## How we will work together');
  WORKING_AGREEMENT.forEach((rule, index) => lines.push(`${index + 1}. ${rule}`));

  return lines.join('\n') + '\n';
}

/**
 * Make a safe file name for downloading the spell, e.g. "spell-night-shift-sleep.md".
 * SECURITY: only a-z, 0-9 and dashes survive, so no paths or odd characters.
 */
export function spellFileName(name) {
  const slug = cleanText(name, MAX_NAME_LENGTH)
    .normalize('NFKD')            // "é" → "e" + accent mark
    .replace(/\p{M}/gu, '')       // drop the accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `spell-${slug || 'untitled'}.md`;
}
