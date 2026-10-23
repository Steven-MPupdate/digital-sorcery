# The Trial by Fire: Stress Testing

Two layers. Layer 1 runs on every change for free. Layer 2 costs Steven's usage, so it runs
**only when Steven approves it** (Steven, 2026-10-23: the agents ran on a share-card change and
used half a session).

## Layer 1: Automated (runs on every push in GitHub Actions)
`npm test` = `npm run check` (contrast + hidden characters) → unit tests → browser tests (Note 20 and
360px phones, plus the site served under `/digital-sorcery/` like GitHub Pages). CI also runs a secret scan.
The browser tests include attack inputs: XSS payloads, corrupted and polluted storage,
blocked storage, giant input, offline mode, no third-party requests.
For most changes, a green `npm test` is the whole check. Nothing merges to `main` without it.

## Layer 2: Stress-test agents (`.claude/agents/`), on request only
**Never run these automatically**, not at the end of a change, not before a merge, not before a deploy.
If a change looks risky enough to need one, say which agent and why in one line, and wait for
Steven's yes. Steven can also ask directly: *"Run the red team"*.

**No agents** for: copy and wording, images and icons artwork, meta / Open Graph tags, docs,
version bumps, small CSS tweaks. `npm test` covers these.

When an agent is worth proposing, pick **at most one or two**, by what changed:

| Change touches… | Agent to propose |
|---|---|
| How user input is handled, storage, CSP, dependencies, a new network call | **red-team-security** |
| Logic in `incantation.js`, new UI behaviour | **chaos-input-tester** |
| A real layout or interaction change (new screen, new control) | **mobile-a11y-auditor** |
| `sw.js` logic, manifest, file paths, workflows | **pwa-offline-auditor** |
| A large refactor or a new contributor's first big change | **grimoire-keeper** |

**All five** only for a whole new version of the app (a rewrite or a big feature set), and only
when Steven asks for it. The first live release (2026-10-18) already had all five.

**Two-week check-up:** every two weeks, offer Steven a run of **red-team-security** and
**pwa-offline-auditor** (the designated testers for this project). Ask; don't start it.

## Handling findings
1. Only **CONFIRMED** findings (reproduced) must be fixed before merge; **PLAUSIBLE** ones get a decision.
2. Each fix gets a regression test in `tests/`.
3. If a finding is accepted instead of fixed, write it in `docs/SECURITY.md` → Accepted risks, with the reason.
4. Re-check a fix once, with only the agent that found it. Stop when what's left is low severity;
   don't loop until "clean".
