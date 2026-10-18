/**
 * app.spec.js — End-to-end tests in a real browser.
 *
 * Covers: the main learn → cast → copy flow, saved drafts, hostile input (XSS),
 * corrupted/blocked storage, offline mode, layout on small phones and privacy
 * (no requests to other sites).
 * DEV NOTE: Each "attack" test here exists because the Trial by Fire agents look for it.
 */

import { test, expect } from '@playwright/test';

const REQUIRED = {
  intent: 'A habit tracker that helps night-shift nurses keep a sleep routine',
  summoned: 'Night-shift nurses on their phones during short breaks',
  powers: '1. Log sleep in two taps\n2. Weekly chart\n3. One reminder',
};

const DRAFT_KEY = 'digital-sorcery:draft:v1';

/** Fill the three required ingredients. */
async function fillRequired(page) {
  for (const [id, value] of Object.entries(REQUIRED)) await page.fill(`#field-${id}`, value);
}

/** Collect console errors, page errors and CSP violations for a test. */
function watchErrors(page) {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test('loads cleanly: title, seven ingredients, no errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page).toHaveTitle('Digital Sorcery');
  await expect(page.locator('.ingredient')).toHaveCount(7);
  await expect(page.locator('#magic-circle .mc-rune')).toHaveCount(7);
  await expect(page.locator('#ritual-list li')).toHaveCount(5);
  expect(errors).toEqual([]);
});

test('privacy: every request stays on this site', async ({ page }) => {
  const outside = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'data:' && url.protocol !== 'blob:') outside.push(req.url());
  });
  await page.goto('/');
  await fillRequired(page);
  await page.click('#cast-btn');
  expect(outside).toEqual([]);
});

test('cast is locked until the required ingredients are added', async ({ page }) => {
  await page.goto('/');
  const cast = page.locator('#cast-btn');
  await expect(cast).toBeDisabled();
  await page.fill('#field-intent', REQUIRED.intent);
  await page.fill('#field-summoned', REQUIRED.summoned);
  await expect(cast).toBeDisabled();
  await page.fill('#field-powers', REQUIRED.powers);
  await expect(cast).toBeEnabled();
  await expect(page.locator('#magic-circle .mc-lit')).toHaveCount(3);
});

test('main flow: name → fill → cast → copy', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.fill('#spell-name', 'Night Shift Sleep');
  await fillRequired(page);
  await page.click('#cast-btn');
  const output = page.locator('#spell-text');
  await expect(output).toBeVisible();
  await expect(output).toContainText('# Spell: Night Shift Sleep');
  await expect(output).toContainText(REQUIRED.intent);
  await page.click('#copy-btn');
  await expect(page.locator('#cast-status')).toContainText('Copied');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('# Spell: Night Shift Sleep');
});

test('editing after casting warns that the prompt is stale', async ({ page }) => {
  await page.goto('/');
  await fillRequired(page);
  await page.click('#cast-btn');
  await page.fill('#field-proof', 'Works offline');
  await expect(page.locator('#cast-status')).toContainText('Cast again');
});

test('download gives a safe .md file name', async ({ page }) => {
  await page.goto('/');
  await page.fill('#spell-name', '../../Evil <Name>');
  await fillRequired(page);
  await page.click('#cast-btn');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download-btn')]);
  expect(download.suggestedFilename()).toBe('spell-evil-name.md');
});

test('SECURITY: typed HTML/script is shown as text and never runs', async ({ page }) => {
  const errors = watchErrors(page);
  const payloads = [
    '<img src=x onerror="window.__xss=1">',
    '<script>window.__xss=1</script>',
    '"><svg onload="window.__xss=1">',
    'javascript:window.__xss=1',
    '{{constructor.constructor("window.__xss=1")()}}',
  ].join('\n');
  await page.goto('/');
  await page.fill('#spell-name', '<img src=x onerror="window.__xss=1">');
  for (const id of ['intent', 'summoned', 'powers', 'wards', 'tools', 'laws', 'proof']) await page.fill(`#field-${id}`, payloads);
  await page.click('#cast-btn');
  await page.reload(); // also exercise the saved-draft path
  await page.click('#cast-btn');
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  await expect(page.locator('#spell-text img, #spell-text script, #spell-text svg')).toHaveCount(0);
  await expect(page.locator('#spell-text')).toContainText('<script>window.__xss=1</script>');
  expect(errors).toEqual([]);
});

test('SECURITY: corrupted saved drafts cannot break or pollute the app', async ({ page }) => {
  const bad = [
    'not json{{{',
    JSON.stringify({ fields: { intent: { nested: true }, __proto__: { polluted: 1 } } }),
    '{"__proto__":{"polluted":"yes"},"fields":{"constructor":{"prototype":{"polluted":"yes"}}}}',
    JSON.stringify({ name: 12345, fields: ['a', 'b'] }),
    JSON.stringify({ name: 'x'.repeat(100000), fields: { intent: 'y'.repeat(500000) } }),
    'null',
  ];
  for (const value of bad) {
    await page.goto('/');
    await page.evaluate(([key, v]) => localStorage.setItem(key, v), [DRAFT_KEY, value]);
    const errors = watchErrors(page);
    await page.reload();
    await expect(page.locator('.ingredient')).toHaveCount(7);
    expect(await page.evaluate(() => ({}).polluted)).toBeUndefined();
    expect((await page.inputValue('#field-intent')).length).toBeLessThanOrEqual(2000);
    expect((await page.inputValue('#spell-name')).length).toBeLessThanOrEqual(80);
    expect(errors).toEqual([]);
  }
});

test('works when the browser blocks storage entirely', async ({ page }) => {
  await page.addInitScript(() => {
    const boom = () => { throw new Error('storage blocked'); };
    Object.defineProperty(window, 'localStorage', { get: boom });
  });
  const errors = watchErrors(page);
  await page.goto('/');
  await fillRequired(page);
  await page.click('#cast-btn');
  await expect(page.locator('#spell-text')).toContainText(REQUIRED.intent);
  await page.click('#theme-btn');
  expect(errors).toEqual([]);
});

test('drafts and theme survive a reload', async ({ page }) => {
  await page.goto('/');
  await fillRequired(page);
  await page.click('#theme-btn');
  await page.waitForTimeout(500); // saving waits for typing to pause (300ms)
  await page.reload();
  await expect(page.locator('#field-intent')).toHaveValue(REQUIRED.intent);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('chips add a phrase once and respect the length cap', async ({ page }) => {
  await page.goto('/');
  const chip = page.locator('.ingredient[data-id="wards"] .chip').first();
  await chip.click();
  await chip.click();
  await expect(page.locator('#field-wards')).toHaveValue('No user accounts yet');
  await page.fill('#field-tools', 'x'.repeat(1995));
  await page.locator('.ingredient[data-id="tools"] .chip').first().click();
  expect((await page.inputValue('#field-tools')).length).toBe(1995);
});

test('textareas cannot exceed 2000 characters', async ({ page }) => {
  await page.goto('/');
  await page.fill('#field-intent', 'z'.repeat(5000)); // fill() bypasses maxlength like a paste attack
  await page.click('#field-summoned');
  await page.fill('#field-summoned', REQUIRED.summoned);
  await page.fill('#field-powers', REQUIRED.powers);
  await page.click('#cast-btn');
  const text = await page.textContent('#spell-text');
  expect((text.match(/z/g) || []).length).toBeLessThanOrEqual(2000);
});

test('clear the circle wipes everything after confirming', async ({ page }) => {
  await page.goto('/');
  await fillRequired(page);
  page.once('dialog', (dialog) => dialog.accept());
  await page.click('#reset-btn');
  await expect(page.locator('#field-intent')).toHaveValue('');
  await expect(page.locator('#cast-btn')).toBeDisabled();
  await page.reload();
  await expect(page.locator('#field-intent')).toHaveValue('');
});

test('layout: no sideways scrolling on a phone, even with long unbroken text', async ({ page }) => {
  await page.goto('/');
  await page.fill('#spell-name', 'W'.repeat(80));
  await page.fill('#field-intent', 'A'.repeat(400));
  await fillRequired(page);
  await page.fill('#field-intent', 'B'.repeat(400));
  await page.click('#cast-btn');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('accessibility basics: skip link, labels, focusable output', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  for (const id of ['intent', 'summoned', 'powers', 'wards', 'tools', 'laws', 'proof']) {
    await expect(page.getByLabel(new RegExp(`your answer`)).and(page.locator(`#field-${id}`))).toHaveCount(1);
  }
  await fillRequired(page);
  await page.click('#cast-btn');
  await expect(page.locator('#spell-text')).toBeFocused();
});

test('offline: the app still opens after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the worker take control
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.ingredient')).toHaveCount(7);
  await expect(page.locator('h1')).toHaveText('Digital Sorcery');
  await context.setOffline(false);
});

test('PWA manifest is valid and icons load', async ({ page, request }) => {
  await page.goto('/');
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) {
    const res = await request.get(new URL(icon.src, 'http://localhost/').pathname);
    expect(res.ok(), icon.src).toBeTruthy();
  }
});
