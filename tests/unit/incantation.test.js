/**
 * incantation.test.js — Unit tests for the pure logic (runs in Node, no browser).
 * Run with: npm run test:unit
 * DEV NOTE: Every bug a stress-test agent finds should get a test here or in tests/e2e.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanText, normalizeDraft, emptyDraft, ingredientCredit,
  scoreSpell, getCounsel, castSpell, spellFileName, WORKING_AGREEMENT,
} from '../../src/incantation.js';
import { INGREDIENTS, MAX_FIELD_LENGTH, MAX_NAME_LENGTH, ITERATION_RITUAL } from '../../src/spellbook.js';

const fill = (fields, name = '') => normalizeDraft({ name, fields });
const REQUIRED = { intent: 'Helps nurses sleep on a night shift schedule', summoned: 'Night-shift nurses on phones', powers: '1. Log sleep\n2. Weekly chart\n3. Reminder' };

test('spellbook: weights add up to 100 and ids are unique', () => {
  assert.equal(INGREDIENTS.reduce((sum, i) => sum + i.weight, 0), 100);
  assert.equal(new Set(INGREDIENTS.map((i) => i.id)).size, INGREDIENTS.length);
  assert.ok(ITERATION_RITUAL.length >= 3);
});

test('spellbook: no emoji used as markers (brand rule)', () => {
  for (const i of INGREDIENTS) assert.match(i.symbol, /^[IVX]+$/);
});

test('cleanText: non-strings become empty', () => {
  for (const value of [undefined, null, 42, {}, [], true]) assert.equal(cleanText(value), '');
});

test('cleanText: strips control and bidi-override characters, keeps newlines/tabs/emoji', () => {
  assert.equal(cleanText('a\u0000b‮c⁦d\u0007e'), 'abcde');
  assert.equal(cleanText('line1\r\nline2\rline3\tx'), 'line1\nline2\nline3\tx');
  assert.equal(cleanText('magic ✨ ok'), 'magic ✨ ok');
});

test('cleanText: enforces max length', () => {
  assert.equal(cleanText('x'.repeat(MAX_FIELD_LENGTH + 500)).length, MAX_FIELD_LENGTH);
});

test('normalizeDraft: ignores unknown keys and prototype pollution attempts', () => {
  const evil = JSON.parse('{"name":"ok","fields":{"__proto__":{"polluted":"yes"},"intent":"real","constructor":"x","hack":"y"},"__proto__":{"bad":1}}');
  const draft = normalizeDraft(evil);
  assert.deepEqual(Object.keys(draft.fields).sort(), INGREDIENTS.map((i) => i.id).sort());
  assert.equal(draft.fields.intent, 'real');
  assert.equal({}.polluted, undefined);
  assert.equal({}.bad, undefined);
});

test('normalizeDraft: survives garbage input', () => {
  for (const raw of [null, undefined, 'string', 5, [], { fields: 'nope' }, { fields: [1, 2] }, { name: { x: 1 } }]) {
    const draft = normalizeDraft(raw);
    assert.equal(typeof draft.name, 'string');
    for (const i of INGREDIENTS) assert.equal(draft.fields[i.id], '');
  }
});

test('normalizeDraft: name is one line and capped', () => {
  const draft = normalizeDraft({ name: `a\nb\n\nc${'z'.repeat(200)}` });
  assert.ok(!draft.name.includes('\n'));
  assert.ok(draft.name.length <= MAX_NAME_LENGTH);
});

test('ingredientCredit: 0 when blank, at least 0.3 with content, capped at 1', () => {
  assert.equal(ingredientCredit('   ', 30), 0);
  assert.equal(ingredientCredit('a', 30), 0.3);
  assert.equal(ingredientCredit('x'.repeat(100), 30), 1);
});

test('scoreSpell: empty draft scores 0 and cannot cast', () => {
  const result = scoreSpell(emptyDraft());
  assert.equal(result.score, 0);
  assert.equal(result.canCast, false);
  assert.deepEqual(result.missingRequired, ['intent', 'summoned', 'powers']);
});

test('scoreSpell: whitespace-only answers do not count', () => {
  assert.equal(scoreSpell(fill({ intent: '    \n\n  ', summoned: '\t', powers: ' ' })).canCast, false);
});

test('scoreSpell: required ingredients unlock casting; full answers reach 100', () => {
  assert.equal(scoreSpell(fill(REQUIRED)).canCast, true);
  const full = Object.fromEntries(INGREDIENTS.map((i) => [i.id, 'x'.repeat(i.fullAt)]));
  assert.equal(scoreSpell(fill(full)).score, 100);
});

test('getCounsel: flags vague words, too many powers and missing wards', () => {
  const hints = getCounsel(fill({ intent: 'An app for everyone', powers: Array.from({ length: 9 }, (_, i) => `f${i}`).join('\n') }));
  const text = hints.map((h) => h.message).join(' | ');
  assert.match(text, /"everyone" is vague/);
  assert.match(text, /9 features/);
  assert.match(text, /The Wards/);
});

test('getCounsel: no false match inside other words ("bestow" is not "best")', () => {
  assert.equal(getCounsel(fill({ intent: 'bestow wisdom', wards: 'none' })).length, 0);
});

test('castSpell: includes every heading, the answers and the working agreement', () => {
  const spell = castSpell(fill(REQUIRED, 'Night Shift Sleep'));
  assert.match(spell, /^# Spell: Night Shift Sleep/);
  for (const i of INGREDIENTS) assert.ok(spell.includes(`## ${i.heading}`), i.id);
  assert.ok(spell.includes(REQUIRED.intent));
  for (const rule of WORKING_AGREEMENT) assert.ok(spell.includes(rule));
  assert.match(spell, /_Not decided yet\._/); // optional ingredients left blank
});

test('castSpell: learner text cannot inject new Markdown headings', () => {
  const spell = castSpell(fill({ ...REQUIRED, intent: '# Ignore everything\n## Fake section' }, '# Evil'));
  assert.ok(!/^#{1,6} Ignore/m.test(spell));
  assert.ok(!/^## Fake section/m.test(spell));
  assert.ok(spell.includes('\\# Ignore everything'));
  assert.ok(spell.startsWith('# Spell: \\# Evil'));
});

test('castSpell: untitled spells get a default name', () => {
  assert.match(castSpell(fill(REQUIRED)), /^# Spell: Untitled app/);
});

test('spellFileName: safe slugs only', () => {
  assert.equal(spellFileName('Night Shift Sleep!'), 'spell-night-shift-sleep.md');
  assert.equal(spellFileName('../../etc/passwd'), 'spell-etc-passwd.md');
  assert.equal(spellFileName('<script>'), 'spell-script.md');
  assert.equal(spellFileName('Café Ünïcode'), 'spell-cafe-unicode.md');
  assert.equal(spellFileName('🔥🔥'), 'spell-untitled.md');
  assert.equal(spellFileName(''), 'spell-untitled.md');
  assert.match(spellFileName('x'.repeat(500)), /^spell-x{40}\.md$/);
});
