# Roadmap: the phase list

Steven's wish list from 2026-10-22, sorted into phases. Phase 1 works with what the app already
is (one static page, nothing leaves the device). Everything after it needs a decision from Steven
first; the open questions are listed with each phase.

Status: `done`, `in progress`, `next`, `to discuss`.

## Phase 1: polish with what we have (v1.2.0, published 2026-10-22)
| # | Item | Status |
|---|---|---|
| 1.1 | Remove every em dash (app, prompt text, docs) | done |
| 1.2 | Spell name: three example spells to pick from (Local Bites, Night Shift Sleep, Plant Pal) that fill in the name and ingredients I to III | done |
| 1.3 | "See Examples" button next to The Ingredients: a small pop-up with the three examples, all seven ingredients each | done |
| 1.4 | Mobile: body text heavier and easier to read | done |
| 1.5 | Magic Circle numbered in the order the star line travels (I to VII around the trail) | done |
| 1.6 | Star lines brighten with how strong the answers on both ends are | done |
| 1.7 | Counsel hints become buttons that jump to the ingredient to fix | done |
| 1.8 | The Laws: quick-pick chip "Works on iPhone, Android and tablet" | done |
| 1.9 | Install: iPhone gets "Share, then Add to Home Screen" instructions; studio footer controls (Download app, Hard refresh) | done |
| 1.10 | Build it for me: "Digital Sorcery Spell Forge (DSSF), coming soon" card next to Bolt and Lovable | done |

## Phase 2: the Spellbook on this device (next, no accounts)
Save many spells instead of one draft: list, open, rename, delete, export and import. Still
device-only, so the "your words never leave this device" promise stays true.
- **To discuss:** the page already has a "Grimoire" section (the glossary). Name the saved-spells
  feature "Spellbook" and keep Grimoire for the glossary, or rename the glossary?

## Phase 3: spell modules (to discuss)
Like building blocks: pull reusable parts out of a spell (a set of Laws, a Tools stack, a Wards
list) and combine them into new spells later.
- **To discuss:** what counts as a module (one ingredient, or any named snippet?), and whether
  modules come with the app (starter packs) or only from the learner's own spells.

## Phase 4: accounts (to discuss)
Two options Steven named, can be combined:
- **Free accounts by email invitation link** (only invited people can sign up).
- **$5 a month** for an account with the Spellbook synced across devices and other low-cost extras.

Things to decide before building:
- **Which Firebase project.** Firestore rules for `mp-soul-stats` may only be published from the
  `soul-stats` repo (studio rule), and its sign-in list is shared with Soul Stats and the client
  portal. A project of its own for Digital Sorcery is cleaner once it stores accounts.
- **The privacy promise.** "Your words never leave this device" stops being true for synced
  spells. The page copy, a privacy note and docs/SECURITY.md change with it.
- **Payments.** Stripe links and prices are set up by Steven (studio rule); agents draft only.
- **Cost.** Firebase Auth and Firestore are free at small sizes; say the numbers before switching on.

## Phase 5: "Talk it through" inside Digital Sorcery (to discuss)
Log in to Digital Sorcery and talk the spell through with a built-in AI helper (the "Familiar"
idea), next to the Claude, ChatGPT and Gemini buttons that stay. AI calls cost money per use, so
this belongs with the paid tier (Phase 4) and needs usage limits.

## Phase 6: Digital Sorcery Spell Forge, DSSF (to discuss)
Our own "build it for me" app builder (in place of Bolt or Lovable). A large product of its own,
probably a separate project. Phase 1.10 only adds a "coming soon" card.
