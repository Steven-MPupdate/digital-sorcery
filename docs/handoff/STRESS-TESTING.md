# The Trial by Fire — Stress Testing

Nothing merges to `main` until it survives this. Two layers:

## Layer 1 — Automated (runs on every push in GitHub Actions)
`npm test` = `npm run check` (contrast + hidden characters) → unit tests → browser tests (Note 20 and
360px phones, plus the site served under `/new-app/` like GitHub Pages). CI also runs a secret scan.
The browser tests include attack inputs: XSS payloads, corrupted and polluted storage,
blocked storage, giant input, offline mode, no third-party requests.

## Layer 2 — Stress-test agents (`.claude/agents/`)
Ask Claude Code: *"Run the Trial by Fire"* (or name specific agents). Pick by what changed:

| Change touches… | Run these agents |
|---|---|
| Any input, storage, CSP, `sw.js`, dependencies, network calls | **red-team-security** (always) |
| Logic in `incantation.js`, UI behaviour, storage | **chaos-input-tester** |
| HTML, CSS, layout, interaction, brand | **mobile-a11y-auditor** |
| `sw.js`, manifest, icons, paths, workflows | **pwa-offline-auditor** |
| Anything (end of every change) | **grimoire-keeper** |
| Release to production | **all five** |

## Handling findings
1. Only **CONFIRMED** findings (reproduced) must be fixed before merge; **PLAUSIBLE** ones get a decision.
2. Each fix gets a regression test in `tests/`.
3. If a finding is accepted instead of fixed, write it in `docs/SECURITY.md` → Accepted risks, with the reason.
4. Re-run the agent(s) that found it until clean.
