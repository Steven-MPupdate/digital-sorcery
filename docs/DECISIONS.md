# Decisions Log

One entry per meaningful decision. Newest at the bottom.

### D1 — Plain HTML/CSS/JS, no framework, no build step (2026-10-18)
**Why:** readable by beginners, editable from a phone, nothing to compile, tiny and fast.
**Alternatives:** React/Vite (more power, but a build step and more to learn).
**Revisit when:** the UI grows to many screens or needs shared components.

### D2 — Host on GitHub Pages, deploy with GitHub Actions (2026-10-18)
**Why:** free, HTTPS included, custom domain supported, deploys only after tests pass.
**Alternatives:** Firebase Hosting, Vercel, Netlify (needed later only for server functions or headers).

### D3 — No AI calls, accounts or database in v1 (2026-10-18)
**Why:** keeps it free, private and secure; the learner does the thinking (the point of the app).
**Alternatives:** call an AI API from the page (rejected: the key would be public), or require logins from day one (more friction, more risk).
**Next step:** an optional AI helper — either "Log in with OpenRouter" (users pay for their own AI) or a
hosted paid tier through a Supabase Edge Function (Supabase is already connected). See D16.

### D4 — Use the Mirror Path Brand Kit v1 (2026-10-18)
**Why:** supplied by the owner as the brand for this project. Dark Ink is the default; Light Ivory is a toggle.
**Note:** for small gold text in Ivory, a darker shade of the gold (`--gold-text: #7D5E1F`) is used,
because the kit's `#A17B2F` is 3.46:1 on ivory (below WCAG AA 4.5:1). The kit gold is still used for fills and large marks.
**Alternatives:** a fresh "mystical" palette (purple/teal) — rejected, the kit forbids it.

### D5 — Self-host fonts (2026-10-18)
**Why:** no requests to Google (privacy), keeps the CSP strict, works offline.
**Alternatives:** Google Fonts link (simpler, but leaks visits to Google and loosens the CSP).

### D6 — Roman numerals as rune markers (2026-10-18)
**Why:** the brand kit forbids emoji as markers; numerals suit Cinzel and the editorial style.
**Alternatives:** alchemical Unicode symbols (some render as emoji on Android) or custom SVG runes (more work; maybe later).

### D7 — Seven ingredients, three required (2026-10-18)
**Why:** Intent, Users and Features are the minimum an AI needs to avoid guessing; the other four
(Wards, Tools, Laws, Proof) teach good practice and raise Spell Strength without blocking beginners.
**Alternatives:** all seven required (too much friction for a first try) or a free-form single box (teaches nothing).

### D8 — Trial by Fire = automated tests + five stress-test agents (2026-10-18)
**Why:** automated tests catch regressions every time; agents look for new ways to break things.
Every confirmed agent finding becomes a regression test.
**Alternatives:** manual review only (misses things, doesn't scale) or automated tests only (only finds what we thought of).

### D9 — Service worker: network-first, cache as offline backup (2026-10-18)
**Why:** the first cache-first version could mix new HTML with old JavaScript after a release, trap
visitors on the old address after a domain move, and show a broken page for unknown URLs (all found
by the PWA auditor). Network-first, with `cache: 'reload'` on install and `no-cache` on requests, avoids all three.
Only the app's own page falls back to the cached copy; other URLs get their real response or 404.
**Alternatives:** cache-first + "new version, reload" toast (faster offline-first, more moving parts).

### D10 — Playwright as the only dev dependency (2026-10-18)
**Why:** one tool for browser tests, icon rendering and stress scripts; exact version pinned (1.56.1),
Node ≥ 20. Test screens: Galaxy Note 20 (412×915) and a 360px phone, plus the `/digital-sorcery/` sub-path.
**Alternatives:** Jest/Vitest + Puppeteer (more dependencies), Cypress (heavier, weaker on mobile emulation).

### D11 — Spell Strength formula and Counsel thresholds (2026-10-18)
**Why:** answer length is a simple, explainable proxy for detail. Any real content earns 30%; full
credit at each ingredient's `fullAt` length; weights sum to 100. Counsel flags a short list of vague
words (whole words, Unicode-aware) and more than 7 Powers (advice is 3–5; we only nag when clearly too many).
**Alternatives:** AI grading (costs money, needs a server, v2 "Familiar" idea).

### D12 — Spell format: Markdown with fenced answers + Working Agreement (2026-10-18)
**Why:** Markdown pastes cleanly into every AI tool. Each learner answer sits in a ```` ```text ```` fence
longer than any backticks inside it, so no answer can fake a heading, open a code block or hide text
(the original "escape lines starting with #" approach was bypassed by the Red Team and Chaos Tester).
It also tells the AI which parts are the learner's notes. The Working Agreement makes the AI ask questions first.
**Alternatives:** plain text (loses structure), JSON (harder for beginners to read and edit).

### D13 — Colors outside brand.css (2026-10-18)
**Why:** `theme-color` meta, the manifest, the SVG icon and the icon script cannot read CSS variables.
Each carries a note naming the token it must match; `app.js` sets `theme-color` from `--surface` at runtime.

### D14 — Versioned storage keys (2026-10-18)
**Why:** `digital-sorcery:draft:v1` / `:theme:v1`. A future format reads the v1 key once, converts it,
and saves under v2, so old drafts are never lost or misread. Several open tabs sync through the
`storage` event; the newest save wins and every tab shows it.

### D15 — Project license (open)
**Status:** not chosen yet. Without a license, a public repo is "all rights reserved" (people can view
but not reuse the code). Options: MIT (anyone can reuse), CC BY-NC (no commercial reuse), or keep all rights. Owner to decide.

### D16 — Portals: copy, then open (no prompt in the link) (2026-10-18)
**Why:** the easiest way to "build the app" with the AI tools people already pay for, at no cost to us.
The latest spell is copied to the clipboard (re-cast automatically if answers changed), and only if the
copy worked does a fixed https link open the app (on phones, often the app itself).
We do NOT put the spell in the link (`?q=` or `#…`): those formats are not officially documented and have
been reported to stop working (see REFERENCES), and
anything in a URL can end up in browser history and server logs. Links use `rel="noopener noreferrer"`.
**Alternatives:** prefilled links (fragile, privacy leak); in-app AI via "Log in with OpenRouter" or
our own hosted AI (planned v2 / paid tier — see HANDOFF-LOG next ideas).

### D17 — Repo renamed to digital-sorcery (2026-10-18)
**Why:** the public name and web address should match the product: `steven-mpupdate.github.io/digital-sorcery/`.
Renamed before the site went live, so no visitor or offline cache ever used the old address.
**Alternatives:** keep `new-app` (meaningless to visitors); a custom domain later works with either name.

### D18 — Firebase Hosting becomes the home; Pages runs alongside first (2026-10-21)
**Why:** the studio's other sites already live on Firebase, so one place to look, one CLI, and room to
grow later (Cloud Functions for the planned "Familiar" AI helper, instead of a second provider).
Hosting is free at this size on the Spark plan, and Firebase can serve a custom domain with its own
free certificate.
**How:** both hosts publish the same folder, `_site/`, built by `scripts/build-site.js` from the same
tested commit, so the two sites cannot drift. The `deploy-firebase` job skips itself (and main stays
green) until the ids in `.firebaserc` / `firebase.json` stop saying `CHANGE-ME` and the
`FIREBASE_SERVICE_ACCOUNT` secret exists.
**Then:** once Firebase serves the custom domain and has been watched for a release or two, the
GitHub Pages job is deleted (one line in CHANGELOG, the Pages URL left redirecting).
**Alternatives:** stay on Pages (free, but a second place to look and no room for server code);
Cloudflare Pages or Netlify (another account to run); move to Firebase in one step (no safety net if
the first release there goes wrong).

### D19 — The published folder is built by a script, not copied inline (2026-10-21)
**Why:** two hosts copying their own file lists would drift, and an ignore-list can leak `docs/`,
`tests/` or `.claude/` onto a public site. `scripts/build-site.js` is an allow-list: a new shipping
file has to be named in it, and both publish jobs run `npm run build:site`.
**Alternatives:** `firebase.json` `ignore` globs (easy to miss a new folder); publishing the repo root
(ships the docs and tests).
