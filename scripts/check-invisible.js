/**
 * check-invisible.js — Fails if any source file contains hidden characters.
 *
 * Usage:   npm run check:invisible   (also runs in CI)
 * Why:     Invisible characters (zero-width, bidi overrides, control codes) can make code
 *          look different from what it does ("Trojan Source"). Write them as escapes or
 *          String.fromCodePoint(...) instead.
 * Checks:  every git-tracked text file except binaries.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter((file) => file && !/\.(woff2|png|jpg|ico)$/.test(file));

// Unicode categories: Cc (control, except tab/newline/CR), Cf (format, e.g. zero-width,
// bidi), Co (private use), Cs (lone surrogates).
const HIDDEN = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}]/u;

let problems = 0;
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const char of line.replace(/[\t\r]/g, '')) {
      if (HIDDEN.test(char)) {
        problems++;
        const code = char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        console.error(`${file}:${index + 1}  hidden character U+${code}`);
      }
    }
  });
}

if (problems) {
  console.error(`\n${problems} hidden character(s) found. Replace them with escapes.`);
  process.exit(1);
}
console.log(`No hidden characters in ${files.length} files.`);
