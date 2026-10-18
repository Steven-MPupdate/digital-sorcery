# Glossary — The Compendium

Every brand term, ritual name and technical word used in Digital Sorcery.
**Rule:** any new term gets an entry here in the same change that introduces it (CLAUDE.md §4).

Format: **Term** — plain-English meaning. *Where:* file(s) where it lives.

## Brand & ritual terms

- **Digital Sorcery** — The app and the method: building apps by asking the right questions and iterating with an AI. *Where:* `index.html` hero, `manifest.webmanifest`.
- **Spell** — The starter prompt the learner builds. It is plain Markdown. *Where:* `castSpell()` in `src/incantation.js`.
- **Casting / Cast the spell** — Turning the ingredients into the spell. Only allowed when the required ingredients are present. *Where:* `cast()` in `src/app.js`.
- **Ingredient** — One decision the app needs before building starts. There are seven. *Where:* `INGREDIENTS` in `src/spellbook.js`.
- **Rune** — The mystical name of an ingredient (e.g. "The Intent"). Always shown next to its plain name. *Where:* `rune` field in `src/spellbook.js`.
- **The Intent (I)** — What the app does and why it should exist. Required.
- **The Summoned (II)** — Who the app is for. Required.
- **The Powers (III)** — The 3–5 core features of version 1. Required.
- **The Wards (IV)** — What will NOT be built in version 1 (scope protection).
- **The Tools (V)** — Platform, stack and hosting.
- **The Laws (VI)** — Rules the AI builder must follow (code style, security, testing).
- **The Proof (VII)** — Definition of done: how we know v1 works.
- **Magic Circle** — The SVG diagram of seven runes joined in a seven-point star. A rune lights up when its ingredient has content; the circle turns gold when the spell can be cast. *Where:* `renderCircle()` in `src/app.js`, `.mc-*` classes in `src/styles/main.css`.
- **Heptagram** — The seven-pointed star (pattern {7/3}) drawn inside the Magic Circle and the app icon.
- **Spell Strength** — A 0–100 score: each ingredient's weight × how complete its answer is. A nudge, not a grade. *Where:* `scoreSpell()` in `src/incantation.js`.
- **Counsel** — Teaching hints about vague words, too many features, or missing Wards. *Where:* `getCounsel()` in `src/incantation.js`.
- **Iteration Ritual** — The five follow-up prompts to use after the first AI answer: Observe, Question, Refine, Test, Record. *Where:* `ITERATION_RITUAL` in `src/spellbook.js`.
- **Working Agreement** — The "How we will work together" rules added to the end of every spell (ask questions first, small steps, no secrets…). *Where:* `WORKING_AGREEMENT` in `src/incantation.js`.
- **Quick-pick chips** — Buttons that add a common phrase to an ingredient. *Where:* `chips` in `src/spellbook.js`, `addChip()` in `src/app.js`.
- **Clear the circle** — Erase every ingredient from the device. *Where:* `reset()` in `src/app.js`.
- **Grimoire** — (1) The short glossary section inside the app. (2) The project's documentation set as a whole (this folder).
- **Ink / Ivory** — The dark and light themes from the brand kit. *Where:* `src/styles/brand.css`.
- **Trial by Fire** — The stress-testing stage before deploy: automated tests plus the stress-test agents. *Where:* `.claude/agents/`, `docs/handoff/STRESS-TESTING.md`.

## Stress-test agents (the Trial by Fire team)

- **Red Team** (`red-team-security`) — tries to break security.
- **Chaos Tester** (`chaos-input-tester`) — throws strange input and usage at the app.
- **Mobile & Accessibility Auditor** (`mobile-a11y-auditor`) — checks phones, screen readers, contrast, brand rules.
- **PWA & Deploy Auditor** (`pwa-offline-auditor`) — checks install, offline, caching and deployment.
- **Grimoire Keeper** (`grimoire-keeper`) — checks code clarity and that these docs are up to date.

## Technical terms

- **PWA (Progressive Web App)** — A website that can be installed on a phone's home screen and work offline.
- **Service worker** — A background script that caches the app's files so it works offline. *Where:* `sw.js`.
- **App shell** — The list of files the service worker saves for offline use. *Where:* `APP_SHELL` in `sw.js`.
- **Cache version** — A label in `sw.js`; changing it makes phones download fresh files.
- **Manifest** — A small JSON file that tells the phone the app's name, icon and colors. *Where:* `manifest.webmanifest`.
- **localStorage** — Storage inside the browser on the user's device. Drafts live here; nothing is sent anywhere.
- **CSP (Content Security Policy)** — A rule list telling the browser which files the page may load. Blocks injected scripts. *Where:* meta tag in `index.html`.
- **XSS (Cross-site scripting)** — An attack where typed text sneaks in as code. Prevented by never using `innerHTML` with user text.
- **Prototype pollution** — An attack using keys like `__proto__` to tamper with every object in the app. Prevented in `normalizeDraft()`.
- **Bidi override characters** — Invisible characters that reverse how text displays; used to hide instructions. Stripped in `cleanText()`.
- **GitHub Pages** — GitHub's free static website hosting. Our live site.
- **GitHub Actions** — GitHub's automation. Runs our tests and deploys. *Where:* `.github/workflows/ci-deploy.yml`.
- **Playwright** — The tool that drives a real browser in our tests. *Where:* `tests/e2e/`, `playwright.config.js`.
- **Debounce** — Waiting until typing pauses before saving, to avoid saving on every key press. *Where:* `debounce()` in `src/app.js`.
- **WCAG AA** — The common accessibility standard; text needs a contrast ratio of at least 4.5:1. *Where:* `scripts/check-contrast.js`.
