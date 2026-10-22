/**
 * v1-2.spec.js: Browser tests for the v1.2 round (Steven's list of 2026-10-22).
 *
 * Covers: Magic Circle order and line brightness, Counsel buttons, the example picker and the
 * "See Examples" pop-up, the Laws phone chip, the Spell Forge "coming soon" card, the footer
 * tools (Download app on iPhone, Hard refresh), heavier body text on phones, and no em dashes.
 * Depends on: playwright.config.js (servers), src/spellbook.js, src/examples.js, src/portals.js.
 */

import { test, expect } from '@playwright/test';
import { INGREDIENTS } from '../../src/spellbook.js';
import { EXAMPLE_SPELLS, EXAMPLE_FILL_IDS } from '../../src/examples.js';
import { COMING_SOON } from '../../src/portals.js';

const EXAMPLE = Object.fromEntries(EXAMPLE_SPELLS.map((example) => [example.id, example]));
const EM_DASH = String.fromCodePoint(0x2014); // written as a code point: no em dashes in source
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 '
  + '(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/** The circle's numerals in clockwise order, starting at the top. */
async function numeralsClockwise(page) {
  return page.locator('#magic-circle .mc-rune').evaluateAll((groups) => groups
    .map((group) => {
      const node = group.querySelector('circle');
      const x = Number(node.getAttribute('cx')) - 150;
      const y = Number(node.getAttribute('cy')) - 150;
      const degrees = (Math.round((Math.atan2(y, x) * 180) / Math.PI) + 90 + 360) % 360; // 0 = top
      return { degrees, label: group.textContent };
    })
    .sort((a, b) => a.degrees - b.degrees)
    .map((node) => node.label));
}

test('magic circle: the numbers follow the star line, I to VII', async ({ page }) => {
  await page.goto('/');
  // Steven's mapping: the old places i, iv, vii, iii, vi, ii, v now read I to VII.
  expect(await numeralsClockwise(page)).toEqual(['I', 'VI', 'IV', 'II', 'VII', 'V', 'III']);
  // Each line joins one ingredient to the next, and VII back to I.
  const lines = await page.locator('.mc-chord').evaluateAll((all) => all.map((l) => [l.dataset.a, l.dataset.b]));
  const ids = INGREDIENTS.map((ingredient) => ingredient.id);
  expect(lines).toEqual(ids.map((id, i) => [id, ids[(i + 1) % ids.length]]));
});

test('magic circle: a line brightens with the weaker of its two answers', async ({ page }) => {
  await page.goto('/');
  const line = page.locator('.mc-chord[data-a="intent"][data-b="summoned"]');
  const strength = () => line.evaluate((el) => Number(el.style.getPropertyValue('--strength')));
  const opacity = () => line.evaluate((el) => Number(getComputedStyle(el).strokeOpacity));

  await page.fill('#field-summoned', 'x'.repeat(40)); // full credit
  await page.fill('#field-intent', 'Short');          // minimum credit
  await expect(line).toHaveClass(/\bon\b/);
  expect(await strength()).toBeCloseTo(0.3, 2);
  await expect.poll(opacity).toBeLessThan(0.6);

  await page.fill('#field-intent', 'y'.repeat(60));
  expect(await strength()).toBe(1);
  await expect.poll(opacity).toBeGreaterThan(0.99);
});

test('counsel: a hint is a button that takes you to the ingredient', async ({ page }) => {
  await page.goto('/');
  await page.fill('#field-powers', 'everything');
  await page.locator('#counsel-list .counsel-link', { hasText: 'The Powers' }).click();
  await expect(page.locator('#field-powers')).toBeFocused();
  // The empty-page tip points at The Intent.
  await page.fill('#field-powers', '');
  await page.locator('#counsel-list .counsel-link', { hasText: 'Start with The Intent' }).click();
  await expect(page.locator('#field-intent')).toBeFocused();
});

test('example picker fills the name and I to III only, and asks before replacing', async ({ page }) => {
  await page.goto('/');
  await page.fill('#field-wards', 'My own wards');
  await page.getByRole('button', { name: /Local Bites example/ }).click();

  const bites = EXAMPLE['local-bites'];
  await expect(page.locator('#spell-name')).toHaveValue(bites.name);
  for (const id of EXAMPLE_FILL_IDS) await expect(page.locator(`#field-${id}`)).toHaveValue(bites.fields[id]);
  await expect(page.locator('#field-wards')).toHaveValue('My own wards'); // IV to VII untouched
  await expect(page.locator('#field-intent')).toBeFocused();
  await expect(page.locator('#cast-btn')).toBeEnabled();

  // Now there is text: another example asks first, and "Cancel" keeps everything.
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: /Plant Pal example/ }).click();
  await expect(page.locator('#spell-name')).toHaveValue(bites.name);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /Plant Pal example/ }).click();
  await expect(page.locator('#spell-name')).toHaveValue('Plant Pal');
});

test('See Examples: pop-up with three full spells, Escape and backdrop close it, Use fills I to III', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'See Examples' });
  const dialog = page.locator('#examples-dialog');
  await expect(dialog).toBeHidden();

  await opener.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.example-spell')).toHaveCount(3);
  for (const spell of await dialog.locator('.example-spell').all()) {
    await expect(spell.locator('dd')).toHaveCount(INGREDIENTS.length);
  }
  // Fits a phone: nothing sticks out sideways.
  const sticking = await dialog.evaluate((el) => [...el.querySelectorAll('*')]
    .filter((child) => child.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length);
  expect(sticking).toBe(0);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await page.mouse.click(3, 3); // the dimmed backdrop
  await expect(dialog).toBeHidden();

  await opener.click();
  await dialog.getByRole('button', { name: /Use Night Shift Sleep/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#spell-name')).toHaveValue('Night Shift Sleep');
  await expect(page.locator('#field-intent')).toHaveValue(EXAMPLE['night-shift-sleep'].fields.intent);
});

test('The Laws offers an iPhone, Android and tablet chip', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add "Works on iPhone, Android and tablet" to The Laws' }).click();
  await expect(page.locator('#field-laws')).toHaveValue('Works on iPhone, Android and tablet');
});

test('Build it for me shows the Spell Forge as coming soon, not as a link', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Night Shift Sleep example/ }).click();
  await page.click('#cast-btn');
  const soon = page.locator('.portal-soon');
  await expect(soon).toContainText(COMING_SOON.name);
  await expect(soon).toContainText('Coming soon');
  await expect(soon.locator('a, button')).toHaveCount(0);
});

test('footer: Download app stays hidden where the browser cannot install', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#install-btn')).toBeHidden();
  await expect(page.locator('#hard-refresh-btn')).toBeVisible();
});

test.describe('on an iPhone', () => {
  test.use({ userAgent: IPHONE_UA });

  test('Download app explains Share, then Add to Home Screen', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('#install-btn');
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator('#app-tools-status')).toContainText('tap the Share button, then "Add to Home Screen"');
  });
});

test('Hard refresh keeps the answers, clears the offline copies and reloads', async ({ page }) => {
  await page.goto('/');
  await page.fill('#field-intent', 'Keep me'); // still waiting to be saved when the button is pressed
  await page.evaluate(async () => {
    window.beforeRefresh = true; // gone once the page has really reloaded
    const cache = await caches.open('probe');
    await cache.put('./probe', new Response('old'));
  });
  await page.click('#hard-refresh-btn');

  // While the page is reloading, evaluate() throws; count that as "not reloaded yet" and ask again.
  const reloaded = () => page.evaluate(() => window.beforeRefresh === undefined).catch(() => false);
  await expect.poll(reloaded).toBe(true);
  await page.waitForLoadState('load');
  await expect(page.locator('#field-intent')).toHaveValue('Keep me');
  expect(new URL(page.url()).searchParams.has('refresh')).toBe(false);
  expect(await page.evaluate(() => caches.has('probe'))).toBe(false);
});

test('phones get the heavier body text; wide screens the regular one', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontWeight)).toBe('600');
  await page.setViewportSize({ width: 1024, height: 800 });
  expect(await page.evaluate(() => getComputedStyle(document.body).fontWeight)).toBe('400');
});

test('no em dashes on the page, in the pop-up or in a cast spell', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Local Bites example/ }).click();
  await page.click('#cast-btn');
  const text = await page.evaluate(() => document.documentElement.textContent);
  expect(text.includes(EM_DASH)).toBe(false);
  expect((await page.locator('#spell-text').textContent()).includes(EM_DASH)).toBe(false);
});
