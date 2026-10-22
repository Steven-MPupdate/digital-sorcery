/**
 * check-contrast.js: Checks that brand text colors are readable (WCAG AA).
 *
 * Usage:   npm run check:contrast
 * Reads:   src/styles/brand.css (both themes).
 * Rules:   Text needs at least 4.5:1 against its background (WCAG 1.4.3).
 *          Input borders and other UI edges need at least 3:1 (WCAG 1.4.11).
 * Exits with an error code if any pair fails, so CI blocks the deploy.
 */

import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/brand.css', import.meta.url), 'utf8');

/** Pull the --token: #hex pairs out of one theme block. */
function tokens(selector) {
  const start = css.indexOf(selector);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground token, background token, minimum ratio] for every text color used in
// main.css, including hover states. Keep this list in step with main.css.
const PAIRS = [
  ['ink', 'surface', 4.5], ['ink', 'surface-raised', 4.5],          // body text, hover text
  ['ink-muted', 'surface', 4.5], ['ink-muted', 'surface-raised', 4.5], ['ink-muted', 'gold-soft', 4.5],
  ['ink', 'gold-soft', 4.5],                                        // portal button hover
  ['gold-text', 'surface', 4.5], ['gold-text', 'surface-raised', 4.5], ['gold-text', 'gold-soft', 4.5],
  ['on-gold', 'gold', 4.5],                                         // primary button, skip link
  ['on-gold', 'gold-bright', 4.5],                                  // primary button hover
  ['warn', 'gold-soft', 4.5], ['warn', 'surface', 4.5],             // counsel, save warning
  ['bronze', 'surface', 3], ['bronze', 'surface-raised', 3],        // input borders (non-text)
  ['gold', 'surface', 3],                                           // focus ring (non-text)
];

let failed = 0;
for (const [name, selector] of [['Dark Ink', ":root[data-theme='dark']"], ['Light Ivory', ":root[data-theme='light']"]]) {
  const themeTokens = tokens(selector);
  console.log(`\n${name}`);
  for (const [fg, bg, minimum] of PAIRS) {
    const ratio = contrast(themeTokens[fg], themeTokens[bg]);
    const ok = ratio >= minimum;
    if (!ok) failed++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${fg} on ${bg}: ${ratio.toFixed(2)}:1 (needs ${minimum}:1)`);
  }
}
if (failed) { console.error(`\n${failed} pair(s) below their minimum`); process.exit(1); }
console.log('\nAll pairs meet WCAG AA.');
