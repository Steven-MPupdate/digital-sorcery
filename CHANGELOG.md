# Changelog

## 1.2.1 (2026-10-23)
Share card: a shared link now shows a picture instead of a blank preview.
- **Open Graph and X tags** in `index.html` (`og:type`, `og:site_name`, `og:url`, `og:title`,
  `og:description`, `og:image` with its size and alt text, `twitter:card`) plus a canonical link.
  All addresses are absolute, because social scrapers do not resolve relative paths.
- **The picture:** `assets/social/og-image.png`, 1200x630, drawn by `scripts/og-card.html` and
  written by `npm run og` (`scripts/make-og-image.js`). The artwork links `src/styles/brand.css`,
  so its colors and fonts are the brand tokens themselves. The PNG is a snapshot: re-run
  `npm run og` after changing `brand.css` or the card (DECISIONS D22).
- **Nothing is loaded from another site:** the tags are read by apps that fetch the page, so the
  strict Content-Security-Policy is unchanged.
- `firebase.json` caches `/assets/social/**` for a day, like the icons.
- New test `tests/unit/share-card.test.js`: the tags exist, every URL is absolute, and the PNG is
  really 1200x630.
- **GitHub Pages job deleted** from `.github/workflows/ci-deploy.yml`: Firebase serves the one
  address, and the second live copy never carried the `firebase.json` security headers. The
  workflow now needs no `pages: write` or `id-token: write`. New test
  `tests/unit/workflow.test.js` keeps it from coming back (DECISIONS D23).
- Version 1.2.1, cache `digital-sorcery-v1.2.1`.

## 1.2.0 (2026-10-22)
Steven's first round of changes (docs/ROADMAP.md Phase 1).
- **Example spells:** three finished examples (Local Bites, Night Shift Sleep, Plant Pal). The
  picker under "Name your spell" fills in an example's name and I to III, asking first if that
  would replace your words. "See Examples" beside The Ingredients opens a pop-up with all seven
  answers of each, and a "Use" button.
- **Magic Circle:** the numerals now follow the star line in order (I, II, III ... VII), and each
  lit line brightens and thickens with the weaker of the two answers it joins.
- **Counsel:** every hint is a button that jumps to the ingredient it is about.
- **Phones:** body text uses Cormorant's semibold cut below 720px wide, so it is easier to read.
- **The Laws:** new quick-pick chip "Works on iPhone, Android and tablet".
- **Build it for me:** "Digital Sorcery Spell Forge (DSSF)" shown as coming soon (not a link).
- **Footer tools (studio rule):** "Download app" replaces the header Install button and, on iPhone
  and iPad, explains Share, then "Add to Home Screen"; "Hard refresh" clears the offline copies and
  reloads, saving the draft first.
- **No em dashes** anywhere: page, spell text, docs and tooling.
- Version 1.2.0, cache `digital-sorcery-v1.2.0`. New docs: `docs/ROADMAP.md` (the phase list).
- **Firebase cache fix:** the home page address `/` is now `no-cache` like `/index.html`. Firebase
  matches header rules against the address asked for, so `/` had fallen back to a 1-hour browser
  cache. New unit test `tests/unit/firebase-config.test.js` guards it.
- **Tests:** the portal tests bring their tab to the front before reading the clipboard. They timed
  out now and then on CI because Chromium only lets the focused tab read it. The app is unchanged.
- **Tooling:** GitHub Actions updated (checkout 7.0.1, setup-node 7.1.0, configure-pages 6.0.0,
  upload-pages-artifact 5.0.0, deploy-pages 5.0.1) and Playwright 1.64.1, from Dependabot PRs #2 to #7.
  upload-pages-artifact 4+ leaves out dotfiles, so `.nojekyll` is no longer built (Pages
  deploys through Actions never run Jekyll, and Firebase ignored it).
- **Hosting:** the site can now also be published to Firebase Hosting, next to GitHub Pages.
  Nothing in the app itself changed.
- Firebase site `digital-sorcery-butlerbuilds` created in the studio's `mp-soul-stats` project and
  its ids filled in. Firebase is published by hand on "deploy"; no publish key is added, because a
  key on the shared project could reach every site in it (DECISIONS D20).
- `npm run build:site` (`scripts/build-site.js`) builds `_site/` with only the files the website
  needs; both hosts publish that same folder, so they cannot drift.
- `firebase.json` adds cache headers (service worker, page and `src/` never cached; fonts cached for
  a year) and `nosniff` / `no-referrer` / same-origin-opener headers.
- The Firebase job skips itself while the `FIREBASE_SERVICE_ACCOUNT` secret is missing
  (see `docs/handoff/DEPLOY.md`).

## 1.1.1: 2026-10-18
- Repository renamed to `digital-sorcery`; the site lives at `/digital-sorcery/` on GitHub Pages.
  Docs and the sub-folder browser test updated to match.

## 1.1.0: 2026-10-18
- **Portals:** after casting, one tap copies the spell and opens Claude, ChatGPT or Gemini
  ("Talk it through"), or the app builders Bolt and Lovable ("Build it for me").
- The spell is never put in the link (privacy, reliability); links can't control this page.
- Copy, Download and the portals always use your latest answers (auto re-cast), and an AI app only
  opens after the copy worked. Result messages appear next to the buttons; keyboard focus is kept.

## 1.0.0: 2026-10-18
First version.
- Seven ingredients with teaching notes, guiding questions, weak-vs-strong examples and quick-pick chips.
- Magic Circle (heptagram) lights up as ingredients are added; Spell Strength meter (0–100).
- Counsel hints for vague words, too many features and missing Wards.
- Cast the spell → Markdown starter prompt with a built-in Working Agreement; copy and download.
- Iteration Ritual: five follow-up prompts with copy buttons.
- Mirror Path brand kit: Ink (dark) default, Ivory (light) toggle; self-hosted fonts.
- Installable PWA, works offline; drafts saved on the device only.
- Security: strict CSP, no innerHTML for user text, validated storage, input caps.
- Trial by Fire: unit + browser tests (incl. attack inputs) and five stress-test agents.
- GitHub Actions: checks and tests on every push; deploy `main` to GitHub Pages (actions pinned to SHAs).
- Hardened after the first Trial by Fire (see docs/handoff/HANDOFF-LOG.md): answers fenced in the
  prompt, zero-width/invisible input handled, network-first offline worker, tabs kept in sync,
  visible save-failure warning, large-text layout, focus order, contrast of hover states and borders,
  hidden-character check for source code.
