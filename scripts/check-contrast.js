/**
 * check-contrast.js — Checks that brand text colors are readable (WCAG AA).
 *
 * Usage:   npm run check:contrast
 * Reads:   src/styles/brand.css (both themes).
 * Rule:    Normal text needs a contrast ratio of at least 4.5:1 against its background.
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

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [text token, background token] pairs actually used for text in main.css.
const PAIRS = [
  ['ink', 'surface'], ['ink', 'surface-raised'],
  ['ink-muted', 'surface'], ['ink-muted', 'surface-raised'],
  ['gold-text', 'surface'], ['gold-text', 'surface-raised'], ['gold-text', 'gold-soft'],
  ['on-gold', 'gold'], ['warn', 'gold-soft'],
];

let failed = 0;
for (const [name, selector] of [['Dark Ink', ":root[data-theme='dark']"], ['Light Ivory', ":root[data-theme='light']"]]) {
  const t = tokens(selector);
  console.log(`\n${name}`);
  for (const [fg, bg] of PAIRS) {
    const ratio = contrast(t[fg], t[bg]);
    const ok = ratio >= 4.5;
    if (!ok) failed++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
  }
}
if (failed) { console.error(`\n${failed} pair(s) below 4.5:1`); process.exit(1); }
console.log('\nAll text pairs meet WCAG AA.');
