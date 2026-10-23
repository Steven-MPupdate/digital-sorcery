# Handoff Log

Newest session at the top. Each entry: what was done, the state it was left in, and open questions.

## 2026-10-24, the flaky portal test
**Who:** Steven (owner) with Claude Code (desktop, local checkout). Branch `fix-flaky-portal-test`,
merged as PR #19.

**Done:** `middle-click on a portal still copies the spell first` had hung on CI three times.
The first two readings blamed the clipboard and moved the hang from `page.bringToFront()` into
the `page.evaluate()` that replaced it. The cause is the round-trip itself: asking the opener tab
anything, after a portal tab has opened and closed, can hang for the full 30 seconds. The portal
tests now have the page push each copy out through `exposeFunction` and assert on an array on the
test's side, and the middle-click test leaves the portal tab for the context to close
(DECISIONS D24). Ran the portal and copy tests five times over on both device profiles: 110
passed. CLAUDE.md section 6 no longer promises a GitHub Pages deploy on a green `main`.

**State:** merged, `main` green. Nothing shipped changed, so no version or cache bump and no
deploy: the live site is still v1.2.1.

**Open questions:** `X-Frame-Options: DENY` in `firebase.json` would close accepted risk 1, now
that Firebase sends the headers. The share-card preview still wants re-scraping in
LinkedIn's Post Inspector and Facebook's Sharing Debugger.

## 2026-10-23, v1.2.1: social share card
**Who:** Steven (owner) with Claude Code (desktop, local checkout). Branch `og-share-card`.

**Done:** shared links showed a blank preview, so `index.html` now carries Open Graph and X card
tags with a canonical link, and `assets/social/og-image.png` (1200x630) is committed next to the
icons. The artwork lives in `scripts/og-card.html` and links `brand.css`, so the card is drawn from
the real brand tokens; `npm run og` re-renders it with the Playwright Chromium. `firebase.json`
caches `/assets/social/**` for a day. New test `tests/unit/share-card.test.js`. Version and cache
bumped to 1.2.1 (DECISIONS D22).

**State:** published. On Steven's "deploy" (2026-10-23) the branch was published to Firebase with
`npm run deploy:firebase` after CI passed on PR #17. Checked live: the page serves the new tags,
the picture returns 200 as `image/png` with the one-day cache header, and the footer reads v1.2.1.
Steven then asked for the Pages job itself to go, so PR #17 also deletes it from
`ci-deploy.yml` (DECISIONS D23) with `tests/unit/workflow.test.js` to keep it from coming back,
and the stale clickjacking reason in SECURITY.md is corrected. PR #17 merged to `main` after CI
passed. Pushing to `main` no longer publishes anything: Firebase is published by hand.

**Open questions:** after the deploy, the preview should be re-scraped in LinkedIn's Post Inspector
and X's Card Validator so the networks drop their cached blank copy. The wording on the card
("Gather the ingredients. Cast one clear prompt. Build the app right.") is a draft; Steven may
want his own line.

## 2026-10-22, v1.2.0 published; new address
**Done:** on Steven's "deploy", merged PR #13 and published v1.2.0 to Firebase
(`--only hosting:digital-sorcery-butlerbuilds --project mp-soul-stats`). Live files match the build;
the other nine sites in `mp-soul-stats` kept their live releases. Steven connected
**digitalsorcery.butlerbuilds.dev** (certificate still being issued that day) and retired GitHub
Pages. The app was added to butlerbuilds.dev/work and the resume site (their own repos).

**State:** live at https://digital-sorcery-butlerbuilds.web.app, and at the custom domain once its
certificate is ready. GitHub Pages: no longer checked or linked (see DEPLOY.md).

## 2026-10-22, v1.2.0: Steven's first round of changes
**Who:** Steven (owner) with Claude Code (desktop, local checkout).

**Done:** wrote the phase list (`docs/ROADMAP.md`) and built Phase 1 on branch
`steven-ui-round-1`: em dashes removed everywhere; three example spells (picker under the name,
"See Examples" pop-up); circle numerals follow the star line and lines brighten with answer
strength; Counsel hints are buttons; semibold body text on phones; Laws chip for iPhone, Android
and tablet; Spell Forge (DSSF) "coming soon" card; footer "Download app" (iPhone instructions)
and "Hard refresh" (studio rule). New tests: `tests/unit/examples.test.js`,
`tests/e2e/v1-2.spec.js`. Clicked through on a 375px phone view.

**State:** PR open, **not merged and not published** (merging to `main` publishes GitHub Pages;
Firebase waits for Steven's "deploy"). No Trial by Fire this round (Steven: the first deployment
already happened). The flaky portal test from earlier today is still open (needs a second opinion).

**Open questions:** Phases 2 to 6 in `docs/ROADMAP.md` (Spellbook naming, modules, accounts and
which Firebase project, $5 a month, in-app AI, Spell Forge).

## 2026-10-22: first Firebase publish, home page cache fix
**Who:** Steven (owner) with Claude Code (desktop, local checkout).

**Done:** on Steven's "deploy", published `main` (1fc065f) with `npm run deploy:firebase` to
`https://digital-sorcery-butlerbuilds.web.app`. Live files match the build; the other nine sites in
`mp-soul-stats` kept the same live release. Then fixed `/` being served with Firebase's default
1-hour cache (header rules match the address asked for; only `/index.html` was listed) and added
`tests/unit/firebase-config.test.js`.

**State:** the cache fix is on a PR, tested but **not published**: it waits for Steven's "deploy".
Checked with Firebase's own header matcher (from firebase-tools), which reproduces today's live
headers for the old config. The local Hosting emulator is no use for this on Windows: its path
helper turns `/` into `\`, so it sends no custom headers at all.

**Open questions:** custom domain `sorcery.butlerbuilds.dev`; when to retire GitHub Pages.

## 2026-10-22: Firebase site in mp-soul-stats
**Who:** Steven (owner) with Claude Code (desktop, local checkout).

**Done:** on Steven's request, created Hosting site `digital-sorcery-butlerbuilds` in the shared
`mp-soul-stats` project (`digital-sorcery` was taken by another project) and filled in the ids in
`.firebaserc`, `firebase.json` and `package.json`. DEPLOY.md, DECISIONS D20, GLOSSARY, INDEX,
CHANGELOG and the workflow comments updated.

**State:** nothing published to Firebase yet; `https://digital-sorcery-butlerbuilds.web.app` shows
Firebase's "Site Not Found" page until the first `npm run deploy:firebase` on Steven's "deploy". No
`FIREBASE_SERVICE_ACCOUNT` secret on purpose (D20), so the CI job keeps skipping.

**Open questions:** custom domain `sorcery.butlerbuilds.dev` on Firebase; when to retire Pages.

## 2026-10-22: Dependabot updates and flaky portal tests
**Who:** Steven (owner) with Claude Code (desktop, local checkout).

**Done:** reviewed Dependabot PRs #2 to #7 (each pinned commit checked against its official tag,
release notes read; nothing breaks this repo) and merged them on one branch. Two of them had a
failed CI run that passed on the same commit: the portal tests read the clipboard after a portal
tab opened, and Chromium only lets the focused tab read it. The tests now bring their tab to the
front first. `.nojekyll` removed: upload-pages-artifact 4+ leaves dotfiles out anyway.

**State:** `npm test` passes on Windows with Playwright 1.64.1 (contrast, hidden chars, 28 unit,
68 browser). The flake never showed locally (80 repeat runs, before and after), so the proof is
repeated CI runs on the PR. The new Pages actions only run on `main`, so the first deploy after the
merge is their first real test.

## 2026-10-18: Session 1c: repo renamed, first deploy
**Who:** Steven (owner) with Claude Code (cloud session, from a Galaxy Note 20).

**Done:** PR #1 (v1.1.0) merged to `main`; repo made public; repo renamed `new-app` → `digital-sorcery`.
Every reference updated (docs, sub-path test server, sw.js comment). Version 1.1.1.

**State:** all checks pass locally. Live address: https://steven-mpupdate.github.io/digital-sorcery/
(needs Settings → Pages → Source: GitHub Actions). GitHub redirects the old repo address.

**Open questions:** license (D15); custom domain; v2 AI path. Dependabot has opened update PRs to review.

## 2026-10-18: Session 1b: v1.1.0 Portals
**Who:** Steven (owner) with Claude Code (cloud session, from a Galaxy Note 20).

**Done:** added Portals: after casting, one tap copies the latest spell and opens Claude, ChatGPT,
Gemini, Bolt or Lovable. Version 1.1.0, cache bumped.

**Trial by Fire results (Red Team, Mobile & A11y, Grimoire Keeper)**
| Agent | Result | Fixed |
|---|---|---|
| Red Team | No opener/referrer leaks, no spell in URLs, CSP intact. Low: old spell copied after edits; middle-click skipped the copy; URL tests missed `#fragments` and lookalike hosts. | Fresh cast before every copy; middle-click handled; host allowlist + no-fragment test; frozen lists. |
| Mobile & A11y | No high findings. Medium: copy result shown off-screen and the app opened even when copy failed; focus lost when the copy fallback ran. Low: link names, no visible "new tab" hint, stale copy, missing contrast pair. | Status line next to the buttons; app opens only after a successful copy; focus restored; visible-name-first links; hint text; contrast pair added. |
| Grimoire Keeper | One wrong header line; glossary/references/security/log gaps; D16 above D15. | All fixed. |

**State:** all checks pass (contrast, hidden characters, 28 unit, 68 browser tests). PR #1 open to `main`.

**Owner direction:** interested in a hosted, paid AI tier (v2+) if demand exists. Suggested first step:
a "join the waitlist" button to measure interest. Cost estimates are in the session chat summary:
roughly $1.50–3 per active user per month on Claude Opus 5.5, about half on Sonnet 5.5.

**Open questions:** same as Session 1, plus: which AI path for v2 (OpenRouter login vs hosted paid tier)?

**Next ideas:** Familiar (AI helper) via OpenRouter login or a hosted paid tier (Supabase Auth + Edge
Function + payments + usage limits); waitlist button; Quests (guided lessons); share-a-spell link.

## 2026-10-18: Session 1: v1.0.0 built and stress-tested
**Who:** Steven (owner) with Claude Code (cloud session, from a Galaxy Note 20).

**Done**
- Built Digital Sorcery v1.0.0: seven ingredients, Magic Circle, Spell Strength, Counsel,
  cast/copy/download, Iteration Ritual, Ink/Ivory themes, installable offline PWA.
- Applied the Mirror Path Brand Kit v1 (self-hosted Cinzel / Cormorant Garamond / Montserrat).
- Wrote the house rules (`CLAUDE.md`), the Grimoire docs and the five Trial by Fire agents.
- GitHub Actions: checks + unit + browser tests on every push; deploy `main` to Pages.

**Trial by Fire results (all five agents)**
| Agent | Result | Fixed |
|---|---|---|
| Red Team | No XSS, pollution, traversal or secret leaks. 2 low: underline-style headings and zero-width characters slipped past prompt protection. | Answers now fenced; zero-width stripped. |
| Chaos Tester | 0 crashes. 3 medium: tabs overwriting each other, silent save failure, Markdown structure breaks. 8 low (invisible-only answers, Unicode word match, filename dash, emoji split, stale download name, deep-path page, throws on raw input). | All fixed, each with a regression test. |
| Mobile & A11y | 1 high: cards cut off at 200% text. Medium: focus order after Cast, light-theme hover contrast, skip link at large text, header wrap, ritual copy not announced, faint input borders, noisy live regions. Low: pre role, toggle label, 32px disclosures, circle description. | All fixed. Contrast script now covers hover and border pairs. |
| PWA & Deploy | No blockers. Cache-first worker could mix old/new files, trap users after a domain move, and serve a broken page for unknown URLs. CI hardening items. | Worker now network-first; actions pinned to SHAs; deploy permissions/concurrency fixed; sub-path test added. |
| Grimoire Keeper | Docs gaps: glossary, references, decisions, header fields, notes, invisible characters typed into source. | Docs filled in; `check:invisible` added to CI. |

**State:** all checks pass locally (contrast, hidden characters, 25 unit, 52 browser tests). PR open to `main`.

**Open questions (owner)**
1. **License** for the public repo (see DECISIONS D15).
2. ~~**Repo name / URL**~~: resolved: renamed to `digital-sorcery` (Session 1c).
3. **Custom domain:** e.g. `sorcery.butlerbuilds.dev` (steps in DEPLOY.md).
4. **One-time setup:** make the repo public; Settings → Pages → Source: GitHub Actions.
5. **Brand kit PDF** is labelled Mirror Path; confirm it is the right kit for Butler Builds products.

**Next ideas:** Familiar (AI helper via Supabase Edge Function), Quests (guided lessons), share-a-spell link.

## 2026-10-21: Session 3: Firebase Hosting added next to GitHub Pages
**Who:** Steven (owner) with Claude Code (desktop app, branch `add-firebase-hosting`).

**Why:** the studio's other sites live on Firebase; GitHub Pages goes away once Firebase is proven
(DECISIONS D18). Steven chose "publish to both for now".

**Done**
- `scripts/build-site.js` + `npm run build:site`: builds `_site/` from an allow-list of shipping
  files. Both publish jobs use it, so the two hosts cannot drift (D19).
- `firebase.json` (cache + security headers, publishes `_site/`) and `.firebaserc`.
- `npm run deploy:firebase` for publishing by hand; it always names the exact site and project.
- New `deploy-firebase` job in `ci-deploy.yml`, parallel to the Pages job, same tested commit.
  It writes the service-account key outside the repo, uses it once, deletes it, and skips itself
  (build still green) while the ids say `CHANGE-ME` or the secret is missing.
- Docs: DEPLOY.md rewritten for both hosts, INDEX, GLOSSARY (hosting terms), REFERENCES,
  DECISIONS D18/D19, CHANGELOG (Unreleased).

**Not done / waiting on the owner**
1. Create the Firebase project and Hosting site, then fill the ids into `.firebaserc`,
   `firebase.json` and the `deploy:firebase` script (steps in DEPLOY.md).
2. Add the `FIREBASE_SERVICE_ACCOUNT` repo secret.
3. Nothing has been published: no deploy was run (studio rule: deploys wait for "deploy").
4. **7 open PRs on GitHub were never merged**, including #8 (renames the leftover `new-app`
   references to `digital-sorcery`) and six Dependabot pin bumps. The `/new-app/` URLs in these
   docs are left for PR #8 to fix, to avoid a conflict.

**Next:** once Firebase serves `sorcery.butlerbuilds.dev`, delete the Pages job and the Pages
section of DEPLOY.md.
