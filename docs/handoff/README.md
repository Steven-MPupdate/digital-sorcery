# Handoff Guide — Picking Up Digital Sorcery Cold

## In one minute
- **What:** a free PWA that teaches people to start an app well: answer seven "ingredients",
  cast them into a starter prompt, then iterate with an AI. Brand: Butler Builds / Mirror Path kit.
- **Stack:** plain HTML, CSS, JavaScript modules. No framework, no build step, no server.
- **Hosting:** GitHub Pages, deployed automatically from `main` after tests pass.
- **Data:** stays in the user's browser. No accounts, no tracking.

## Setup (laptop or cloud session)
```bash
npm ci                          # installs Playwright (test tool only)
npx playwright install chromium # first time only, if no browser is installed
npm start                       # preview at http://localhost:4173
npm test                        # unit + browser tests
npm run check:contrast          # brand colors pass WCAG AA
```
From a phone: use the Claude app (Claude Code) connected to this GitHub repo; it runs all of
the above in a cloud sandbox.

## Where to start reading
1. `CLAUDE.md` — the rules.
2. `docs/handoff/ARCHITECTURE.md` — how it fits together.
3. `src/spellbook.js` — the content (easiest place to make changes).
4. `docs/handoff/HANDOFF-LOG.md` — the latest state and open questions.

## Common tasks
| Task | Where |
|---|---|
| Change wording, questions or examples | `src/spellbook.js` |
| Add an ingredient | `src/spellbook.js` (weights must still sum to 100), then `docs/GLOSSARY.md` |
| Add or remove an AI app button (Portal) | `src/portals.js`, then `docs/GLOSSARY.md` |
| Change the generated prompt | `castSpell()` / `WORKING_AGREEMENT` in `src/incantation.js` |
| Change colors/fonts | `src/styles/brand.css` only, then `npm run check:contrast` |
| Ship a change | Branch → PR → tests green → merge. Bump `CACHE_VERSION` in `sw.js` if app files changed. |
| Stress test | `docs/handoff/STRESS-TESTING.md` |
| Deploy / custom domain | `docs/handoff/DEPLOY.md` |
