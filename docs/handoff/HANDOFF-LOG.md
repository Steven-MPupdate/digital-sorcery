# Handoff Log

Newest session at the top. Each entry: what was done, the state it was left in, and open questions.

## 2026-10-18 — Session 1b: v1.1.0 Portals
**Done:** added Portals (copy the spell + open Claude / ChatGPT / Gemini / Bolt / Lovable). Version 1.1.0,
cache bumped. Tests: portal list safety (unit), copy + open + no `window.opener` + keyboard order (browser).
**Trial by Fire:** see the PR thread for this round's agent results.
**Owner direction:** likes a hosted, paid AI option (v2+). Needs: logins, usage limits, payments, server
function holding the AI key. See "Next ideas".

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
2. **Repo name / URL:** keep `new-app` or rename to `digital-sorcery`?
3. **Custom domain:** e.g. `sorcery.butlerbuilds.dev` (steps in DEPLOY.md).
4. **One-time setup:** make the repo public; Settings → Pages → Source: GitHub Actions.
5. **Brand kit PDF** is labelled Mirror Path; confirm it is the right kit for Butler Builds products.

**Next ideas:** Familiar (AI helper), either "Log in with OpenRouter" (users pay their own AI) or a hosted paid tier (Supabase Auth + Edge Function + payments + usage limits); Quests (guided lessons); share-a-spell link.
