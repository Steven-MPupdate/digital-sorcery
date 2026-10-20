# Architecture

```
index.html ──loads──> src/styles/brand.css (tokens) + main.css (layout)
     │
     └──loads──> src/app.js  (UI: DOM, events, clipboard, download, theme, install)
                    │
                    ├── src/spellbook.js   (DATA: ingredients, ritual — no logic)
                    ├── src/portals.js     (DATA: AI apps to open the spell in)
                    ├── src/incantation.js (LOGIC: clean, score, counsel, cast — pure, no DOM)
                    ├── src/storage.js     (DEVICE STORAGE: safe localStorage wrapper)
                    └── registers sw.js    (OFFLINE: network-first, cached copy when offline)
```

## Data flow
1. On load, `storage.loadDraft()` reads localStorage → `normalizeDraft()` validates it.
2. `app.js` renders a card per ingredient from `spellbook.js` and draws the Magic Circle.
3. Each keystroke → `update()`: read fields → `scoreSpell()` + `getCounsel()` → update
   meter, circle, cards, counsel, Cast button → save (debounced 300 ms; flushed when the page hides;
   a visible warning if the browser refuses). Other tabs receive the save through the `storage` event.
4. Cast → `castSpell()` builds Markdown → shown with `textContent` → Copy / Download / Portals
   (a portal copies the spell, then its link opens the AI app in a new tab).

## Design principles
- **The form is the state.** No second copy of the data to fall out of sync.
- **Logic is pure.** `incantation.js` has no DOM, so it is unit-tested in Node and could move to a server later.
- **Content is data.** Teaching content lives in `spellbook.js` so non-coders can edit it.
- **Relative paths everywhere** so the site works at `/digital-sorcery/` and at a custom domain root.

## Future seams (v2 ideas)
- **AI helper ("Familiar"):** reviews a spell and asks follow-up questions. Two paths (DECISIONS D16):
  "Log in with OpenRouter" (users pay for their own AI, no server needed) or a hosted paid tier
  (a Supabase Edge Function holds our key; needs logins, usage limits, payments). Either way, add the
  API origin to the CSP `connect-src` and run the full Trial by Fire.
- **Accounts & saved spells:** Supabase Auth + a `spells` table with Row Level Security.
  Keep `storage.js` as the offline fallback.
- **Lessons:** guided "quests" that teach one ingredient at a time.
