# Handoff Log

Newest session at the top. Each entry: what was done, the state it was left in, and open questions.

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

## 2026-10-18 — Session 1c: repo renamed, first deploy
**Who:** Steven (owner) with Claude Code (cloud session, from a Galaxy Note 20).

**Done:** PR #1 (v1.1.0) merged to `main`; repo made public; repo renamed `new-app` → `digital-sorcery`.
Every reference updated (docs, sub-path test server, sw.js comment). Version 1.1.1.

**State:** all checks pass locally. Live address: https://steven-mpupdate.github.io/digital-sorcery/
(needs Settings → Pages → Source: GitHub Actions). GitHub redirects the old repo address.

**Open questions:** license (D15); custom domain; v2 AI path. Dependabot has opened update PRs to review.

## 2026-10-18 — Session 1b: v1.1.0 Portals
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

## 2026-10-18 — Session 1: v1.0.0 built and stress-tested
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
2. ~~**Repo name / URL**~~ — resolved: renamed to `digital-sorcery` (Session 1c).
3. **Custom domain:** e.g. `sorcery.butlerbuilds.dev` (steps in DEPLOY.md).
4. **One-time setup:** make the repo public; Settings → Pages → Source: GitHub Actions.
5. **Brand kit PDF** is labelled Mirror Path; confirm it is the right kit for Butler Builds products.

**Next ideas:** Familiar (AI helper via Supabase Edge Function), Quests (guided lessons), share-a-spell link.

## 2026-10-21 — Session 3: Firebase Hosting added next to GitHub Pages
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
