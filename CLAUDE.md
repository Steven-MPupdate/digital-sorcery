# CLAUDE.md: House Rules for Digital Sorcery

These are the standing rules for anyone (human or AI) working in this repo.
Read this file first. If a rule here conflicts with a one-off request, ask before breaking it.

## 1. What this project is
**Digital Sorcery** is a free, public PWA that teaches people to start an app the right way:
gather the right "ingredients" (intent, users, features, limits, tools, rules, proof of done),
then "cast" them into a strong starter prompt for an AI builder, then improve it in rounds.
Brand owner: Steven Cruz / Butler Builds.

## 2. Tech rules
- **No build step.** Plain HTML, CSS and JavaScript (ES modules). Anyone can open a file and read it.
- **No secrets in the repo, ever.** No API keys, tokens or passwords in code, commits or docs.
  The site is public and static: anything shipped to the browser is visible to everyone.
- **No user data leaves the device in v1.** Drafts live in the browser's localStorage only.
- **All paths are relative** (`./src/app.js`, not `/src/app.js`), so the site works from any
  folder (the browser tests still serve it under `/digital-sorcery/` to prove it).
  Exception: the canonical link and the `og:` share-card URLs in `index.html` are absolute,
  because social scrapers do not resolve relative paths (DECISIONS D22).
- **Brand values live in one place:** `src/styles/brand.css`. Never hard-code colors or fonts elsewhere.
  Exceptions (they cannot read CSS): the `theme-color` meta tag in `index.html`, `manifest.webmanifest`,
  `assets/icons/icon.svg` and `scripts/make-icons.js`. Each has a note saying which token it must match.

## 3. Code-writing rules
- **Human-readable first.** Clear names over clever code. Short functions.
- **Every file starts with a header comment**: what it does, what it depends on, who calls it.
  JSON files (`package.json`, `manifest.webmanifest`) can't hold comments; `docs/INDEX.md` describes them.
- **Dev notes** use the `// DEV NOTE:` prefix for "why" explanations, gotchas and future ideas.
  Use `// SECURITY:` for anything that protects users. Use `// TODO(vX):` for planned work.
- **Never put user text into `innerHTML`.** Use `textContent` or `createElement`. (See docs/SECURITY.md.)
- **Never type invisible characters into source code.** Use escapes or `String.fromCodePoint(...)`.
  `npm run check:invisible` enforces this.
- Every user input has a max length, and every saved value is validated when loaded back.

## 4. Documentation rules (the "Grimoire")
Every change must keep these up to date:
- `docs/INDEX.md`: map of every doc and important file.
- `docs/GLOSSARY.md`: the compendium. **Any new term, brand phrase or ritual name gets an entry**
  with: the term, plain-English meaning, and where it appears in code.
- `docs/REFERENCES.md`: links to official docs we relied on (with what we used them for).
- `docs/handoff/`: how to pick up the project cold: setup, architecture, how to deploy,
  open questions. Update `docs/handoff/HANDOFF-LOG.md` at the end of every work session.
- `docs/DECISIONS.md`: one short entry per meaningful decision (what, why, alternatives).
- `CHANGELOG.md`: what changed, per version.

## 5. Testing & stress-test rules (the "Trial by Fire")
Nothing reaches `main` (and therefore production) until it passes step 1; step 2 only when Steven asks:
1. `npm test`: contrast + hidden-character checks, unit tests (logic) and browser tests
   (real Chromium, phone-sized screens, also served under a `/digital-sorcery/` sub-folder).
2. **The Trial by Fire (on request)**: the stress-test agents in `.claude/agents/` try to break the build.
   They run ONLY when Steven approves them, never automatically or as a routine before merge or
   deploy (they cost his usage). Most changes need only step 1. See `docs/handoff/STRESS-TESTING.md`.
   Every confirmed finding is fixed, or written into `docs/SECURITY.md` as an accepted risk with a reason.
3. A regression test is added for every bug a stress agent finds.

## 6. Git & deploy rules
- **GitHub is only the code backup** (Steven, 2026-10-25), so any earlier version can be restored.
  Nothing is published from it and no review happens there.
- Work on a feature branch; merge it into `main` on the laptop once `npm test` passes (no pull
  request needed), then push `main` to GitHub after a deploy or on Steven's "push it".
- Pushing to `main` publishes nothing: `.github/workflows/ci-deploy.yml` only runs the tests.
  Firebase Hosting is published by hand on Steven's "deploy" (`npm run deploy:firebase`), which
  names the exact site and project. Never add a publish job or a Firebase key to GitHub.
- Bump the cache version in `sw.js` whenever app-shell files change, or users get stale files.
- Commit messages: short imperative summary line, then why.

## 7. Accessibility & mobile rules
- Design for a phone first (360px wide). No horizontal scrolling.
- Text contrast meets WCAG AA. Everything works with a keyboard and a screen reader.
- Respect `prefers-reduced-motion`: the magic animations turn off.
