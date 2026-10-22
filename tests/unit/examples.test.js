/**
 * examples.test.js: Checks the example spells are complete and safe to show.
 * Run with: npm run test:unit
 * Depends on: src/examples.js, src/spellbook.js, src/incantation.js.
 * DEV NOTE: The "See Examples" pop-up shows all seven answers of each example, and the picker
 * under the spell name fills in I to III, so every example must fill every ingredient.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_SPELLS, EXAMPLE_FILL_IDS } from '../../src/examples.js';
import { INGREDIENTS, MAX_FIELD_LENGTH, MAX_NAME_LENGTH } from '../../src/spellbook.js';
import { normalizeDraft, scoreSpell, getCounsel } from '../../src/incantation.js';

test('there are three examples, including the restaurant meal chooser and Night Shift Sleep', () => {
  assert.equal(EXAMPLE_SPELLS.length, 3);
  const names = EXAMPLE_SPELLS.map((example) => example.name);
  assert.ok(names.includes('Local Bites'));
  assert.ok(names.includes('Night Shift Sleep'));
  assert.equal(new Set(EXAMPLE_SPELLS.map((example) => example.id)).size, 3, 'ids are unique');
});

test('every example answers all seven ingredients, within the length caps', () => {
  for (const example of EXAMPLE_SPELLS) {
    assert.ok(example.name.length <= MAX_NAME_LENGTH, example.name);
    for (const ingredient of INGREDIENTS) {
      const answer = example.fields[ingredient.id];
      assert.ok(answer && answer.trim(), `${example.name} answers ${ingredient.id}`);
      assert.ok(answer.length <= MAX_FIELD_LENGTH);
    }
    // Normalizing changes nothing: no hidden characters or odd line endings in the examples.
    assert.deepEqual(normalizeDraft(example).fields, { ...example.fields });
  }
});

test('the picker fills the three required ingredients, enough to cast', () => {
  assert.deepEqual([...EXAMPLE_FILL_IDS], INGREDIENTS.filter((i) => i.required).map((i) => i.id));
  for (const example of EXAMPLE_SPELLS) {
    const fields = Object.fromEntries(EXAMPLE_FILL_IDS.map((id) => [id, example.fields[id]]));
    assert.equal(scoreSpell({ name: example.name, fields }).canCast, true, example.name);
  }
});

test('examples practise what they preach: no Counsel warnings', () => {
  for (const example of EXAMPLE_SPELLS) {
    assert.deepEqual(getCounsel(example), [], example.name);
  }
});

test('example text has no em dashes (studio rule)', () => {
  const emDash = String.fromCodePoint(0x2014);
  for (const example of EXAMPLE_SPELLS) {
    assert.ok(!JSON.stringify(example).includes(emDash), example.name);
  }
});
