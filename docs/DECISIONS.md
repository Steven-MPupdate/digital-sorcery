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
**Next step:** an optional AI helper through a Supabase Edge Function (Supabase is already connected).

### D4 — Use the Mirror Path Brand Kit v1 (2026-10-18)
**Why:** supplied by the owner as the brand for this project. Dark Ink is the default; Light Ivory is a toggle.
**Note:** for small gold text in Ivory, a darker shade of the gold (`--gold-text: #7D5E1F`) is used,
because the kit's `#A17B2F` is 3.46:1 on ivory (below WCAG AA 4.5:1). The kit gold is still used for fills and large marks.

### D5 — Self-host fonts (2026-10-18)
**Why:** no requests to Google (privacy), keeps the CSP strict, works offline.

### D6 — Roman numerals as rune markers (2026-10-18)
**Why:** the brand kit forbids emoji as markers; numerals suit Cinzel and the editorial style.

### D7 — Seven ingredients, three required (2026-10-18)
**Why:** Intent, Users and Features are the minimum an AI needs to avoid guessing; the other four
(Wards, Tools, Laws, Proof) teach good practice and raise Spell Strength without blocking beginners.

### D8 — Trial by Fire = automated tests + five stress-test agents (2026-10-18)
**Why:** automated tests catch regressions every time; agents look for new ways to break things.
Every confirmed agent finding becomes a regression test.
