# Changelog

## Unreleased
- **Tests:** the portal tests bring their tab to the front before reading the clipboard. They timed
  out now and then on CI because Chromium only lets the focused tab read it. The app is unchanged.
- **Tooling:** GitHub Actions updated (checkout 7.0.1, setup-node 7.1.0, configure-pages 6.0.0,
  upload-pages-artifact 5.0.0, deploy-pages 5.0.1) and Playwright 1.64.1, from Dependabot PRs #2 to #7.
  upload-pages-artifact 4+ leaves out dotfiles, so `.nojekyll` no longer ships to Pages; Pages
  deploys through Actions never run Jekyll, so it is not needed there.
- **Hosting:** the site now also publishes to Firebase Hosting on every passing push to `main`,
  next to GitHub Pages. Nothing in the app itself changed.
- `npm run build:site` (`scripts/build-site.js`) builds `_site/` with only the files the website
  needs; both hosts publish that same folder, so they cannot drift.
- `firebase.json` adds cache headers (service worker, page and `src/` never cached; fonts cached for
  a year) and `nosniff` / `no-referrer` / same-origin-opener headers.
- The Firebase job skips itself until the project ids are filled in and the
  `FIREBASE_SERVICE_ACCOUNT` secret is added (see `docs/handoff/DEPLOY.md`).

## 1.1.1 — 2026-10-18
- Repository renamed to `digital-sorcery`; the site lives at `/digital-sorcery/` on GitHub Pages.
  Docs and the sub-folder browser test updated to match.

## 1.1.0 — 2026-10-18
- **Portals:** after casting, one tap copies the spell and opens Claude, ChatGPT or Gemini
  ("Talk it through"), or the app builders Bolt and Lovable ("Build it for me").
- The spell is never put in the link (privacy, reliability); links can't control this page.
- Copy, Download and the portals always use your latest answers (auto re-cast), and an AI app only
  opens after the copy worked. Result messages appear next to the buttons; keyboard focus is kept.

## 1.0.0 — 2026-10-18
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
