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
- **The Intent (I)** — What the app does and why it should exist. Required. *Where:* `INGREDIENTS` id `intent`, `src/spellbook.js`.
- **The Summoned (II)** — Who the app is for. Required. *Where:* id `summoned`.
- **The Powers (III)** — The 3–5 core features of version 1. Required. *Where:* id `powers`.
- **The Wards (IV)** — What will NOT be built in version 1 (scope protection). *Where:* id `wards`.
- **The Tools (V)** — Platform, stack and hosting. *Where:* id `tools`.
- **The Laws (VI)** — Rules the AI builder must follow (code style, security, testing). *Where:* id `laws`.
- **The Proof (VII)** — Definition of done: how we know v1 works. *Where:* id `proof`.
- **Magic Circle** — The SVG diagram of seven runes joined in a seven-point star. A rune lights up when its ingredient has content; the circle turns gold when the spell can be cast. *Where:* `renderCircle()` in `src/app.js`, `.mc-*` classes in `src/styles/main.css`.
- **Heptagram** — The seven-pointed star (pattern {7/3}) drawn inside the Magic Circle and the app icon. *Where:* `drawChords()` in `src/app.js`, `assets/icons/icon.svg`.
- **Spell Strength** — A 0–100 score: each ingredient's weight × how complete its answer is. A nudge, not a grade. *Where:* `scoreSpell()` in `src/incantation.js`.
- **Counsel** — Teaching hints about vague words, too many features, or missing Wards. *Where:* `getCounsel()` in `src/incantation.js`.
- **Portals** — The buttons shown after casting that copy the spell and open an AI app. *Where:* `src/portals.js`, `renderPortals()` in `src/app.js`.
- **Talk it through / Build it for me** — The two kinds of portal: chat AIs (Claude, ChatGPT, Gemini) that plan and code with you, and app builders (Bolt, Lovable) that build and host the app. *Where:* `PORTAL_GROUPS` in `src/portals.js`.
- **The portal apps** — *Where:* `PORTALS` in `src/portals.js`.
  - **Claude** (Anthropic), **ChatGPT** (OpenAI), **Gemini** (Google) — chat AIs ("Talk it through").
  - **Bolt**, **Lovable** — app builders that turn a prompt into a hosted app ("Build it for me").
- **App builder** — An AI service that writes, runs and hosts an app from a prompt, rather than chatting about it.
- **"Open it in your AI"** — The heading of the Portals section shown after casting. *Where:* `index.html`.
- **Fresh cast** — Copy, Download and the portals always re-cast from your latest answers first, so they never send an old spell. *Where:* `ensureFreshCast()` in `src/app.js`.
- **Iteration Ritual** — The five follow-up prompts to use after the first AI answer: Observe, Question, Refine, Test, Record. *Where:* `ITERATION_RITUAL` in `src/spellbook.js`.
- **Working Agreement** — The "How we will work together" rules added to the end of every spell (ask questions first, small steps, no secrets…). *Where:* `WORKING_AGREEMENT` in `src/incantation.js`.
- **Quick-pick chips** — Buttons that add a common phrase to an ingredient. *Where:* `chips` in `src/spellbook.js`, `addChip()` in `src/app.js`.
- **Clear the circle** — Erase every ingredient from the device. *Where:* `reset()` in `src/app.js`.
- **Grimoire** — (1) The short glossary section inside the app (*Where:* `#grimoire-title` section of `index.html`). (2) The project's documentation set as a whole (this folder).
- **Ink / Ivory** — The dark and light themes from the brand kit. *Where:* `src/styles/brand.css`.
- **Draft** — The learner's saved answers: `{ name, fields }`. *Where:* `normalizeDraft()` in `src/incantation.js`, `DRAFT_KEY` in `src/storage.js`.
- **Spellbook** — The content module listing the ingredients and ritual. *Where:* `src/spellbook.js`.
- **Incantation** — The pure logic module (clean, score, counsel, cast). *Where:* `src/incantation.js`.
- **"Not decided yet"** — What a spell says for an empty optional ingredient: it asks the AI to suggest options. *Where:* `NOT_DECIDED` in `src/incantation.js`.
- **Answer fence** — Each learner answer is wrapped in a ```` ```text ```` block in the spell, so it can't change the prompt's structure. *Where:* `fenceAnswer()` in `src/incantation.js`.
- **Taglines** — "Every app starts as a spell." and "The formula to a solid start." *Where:* `index.html` hero, `README.md`.
- **Butler Builds** — The brand and business behind the app (Steven Cruz). *Where:* `.brand-mark` and footer in `index.html`, `README.md`.
- **Mirror Path Brand Kit v1** — The design system the app uses: colors, fonts, spacing, radius and "doesn't do" rules. *Where:* `src/styles/brand.css` header, `docs/DECISIONS.md` D4. The PDF is kept privately by the owner (ask Steven).
- **Familiar** *(planned)* — An optional AI helper that reviews a spell and asks follow-up questions. *Where:* `docs/handoff/ARCHITECTURE.md`.
- **Quests** *(planned)* — Guided lessons that teach one ingredient at a time. *Where:* `docs/handoff/ARCHITECTURE.md`.
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
- **Cache version** — The `CACHE_VERSION` label in `sw.js`; changing it clears old offline copies on phones.
- **Network-first** — The offline strategy: always try the internet first, use the saved copy only when offline. *Where:* `sw.js`, DECISIONS D9.
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
- **Maskable icon** — An app icon with padding so phones can crop it into circles or squircles. *Where:* `icon-maskable-512.png`, `scripts/make-icons.js`.
- **Clickjacking** — Tricking someone into clicking a hidden framed page. An accepted risk for v1. *Where:* `docs/SECURITY.md`.
- **Hidden characters / Trojan Source** — Invisible characters that make code or text look different from what it is. *Where:* `cleanText()`, `scripts/check-invisible.js`.
- **Dependabot** — GitHub's bot that opens PRs to update dependencies and pinned actions. *Where:* `.github/dependabot.yml`.
- **PR (pull request)** — A request to merge a branch's changes into `main`, where they are reviewed and tested first.
- **Supabase** — A hosted database + login + server-function service (planned for v2). **Row Level Security** = per-row access rules in its database. **Edge Function** = a small server function that can hold secret keys. *Where:* `docs/SECURITY.md`, a Tools chip in `src/spellbook.js`.
- **OpenRouter** *(idea)* — A service where people log in and pay for their own AI use across many models; a possible v2 way to put AI inside the app. *Where:* DECISIONS D16, HANDOFF-LOG.
- **noopener / noreferrer** — Link settings that stop an opened site from controlling this page or seeing where the visitor came from. *Where:* `buildPortalLink()` in `src/app.js`.
- **WCAG AA** — The common accessibility standard; text needs a contrast ratio of at least 4.5:1. *Where:* `scripts/check-contrast.js`.

## Hosting terms

- **Firebase Hosting** — Google's static web host. From v1.2 it serves the site; a Firebase *project* holds one or more *sites*, each with its own id. *Where:* `firebase.json`, `.firebaserc`, the `deploy-firebase` job in `.github/workflows/ci-deploy.yml`.
- **GitHub Pages** — The host used since v1.0, free with a public repo. Kept running next to Firebase until Firebase is proven, then switched off. *Where:* the `deploy` job in `.github/workflows/ci-deploy.yml`.
- **`_site/`** — The built folder that gets published: only `index.html`, `manifest.webmanifest`, `sw.js`, `src/`, `assets/` and `.nojekyll`. Never committed (it is in `.gitignore`). *Where:* `scripts/build-site.js`, `npm run build:site`.
- **Site id / project id** — The two names Firebase needs. Both live in the repo (`firebase.json` → `hosting.site`, `.firebaserc` → `projects.default`) and start as `CHANGE-ME-…` until the project exists. *Where:* read by the `deploy-firebase` job and `npm run deploy:firebase`.
- **Service account** — A robot Google account whose key lets GitHub Actions publish Hosting, and nothing else. The key is a repo secret named `FIREBASE_SERVICE_ACCOUNT`; it is never in the repo. *Where:* `docs/handoff/DEPLOY.md`.
