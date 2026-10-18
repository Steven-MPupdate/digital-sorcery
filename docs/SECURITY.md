# Security

## Security model (v1)
Digital Sorcery v1 is a **static website with no server, no accounts and no data collection**.
Everything the learner types stays in their own browser (localStorage). The main risks are
therefore: code injection into the page (XSS), tampered saved data, a weak content policy,
stale or poisoned offline caches, leaked secrets in the public repo, and supply-chain issues.

## Protections in place
| Risk | Protection | Where |
|---|---|---|
| XSS from typed text | User text only ever set with `textContent` / `.value`, never `innerHTML`. | `src/app.js` |
| Injected scripts/styles | Strict CSP: only same-site files; no inline scripts/styles; `object-src 'none'`; `base-uri 'none'`; `form-action 'none'`. | `index.html` |
| Tampered saved draft | Parsed in try/catch, rebuilt from known keys only, every value type-checked, cleaned and length-capped. | `normalizeDraft()`, `src/storage.js` |
| Prototype pollution | `Object.hasOwn` checks; unknown keys (incl. `__proto__`) dropped. | `src/incantation.js` |
| Hidden-text tricks | Control, bidi-override and zero-width characters stripped from input; invisible-only answers don't count as content; CI fails if hidden characters appear in source code. | `cleanText()`, `hasContent()`, `scripts/check-invisible.js` |
| Prompt structure injection | Each answer is wrapped in a code fence longer than any backticks inside it, so no answer can fake headings, open code blocks or hide text. Unit-tested with 11 attack payloads. | `fenceAnswer()`, `castSpell()` |
| Huge input (memory abuse) | 2000-char cap per ingredient, 80 for the name, enforced in HTML **and** in logic. | `spellbook.js`, `index.html` |
| Unsafe download names | File name reduced to `a–z 0–9 -`, max 40 chars. | `spellFileName()` |
| Cache poisoning / stale code | Service worker only handles same-origin GETs; network-first so online visitors always get matching fresh files; caches only good `basic` responses for known shell files; unknown pages are never answered with the app; old cache versions deleted. | `sw.js` |
| Lost or overwritten drafts | Saves flush when the page hides; save failures are shown on screen; open tabs sync via the `storage` event. | `src/app.js` |
| Third-party tracking / data leaks | No third-party requests at all (fonts self-hosted). `referrer` policy `no-referrer`. Tested. | `index.html`, `tests/e2e` |
| Leaked secrets | Rule: no secrets in repo. CI runs a simple secret scan; GitHub secret scanning also applies to public repos. | `CLAUDE.md`, `ci-deploy.yml` |
| Supply chain | One dev-only dependency (Playwright), version pinned; lockfile committed; Dependabot updates; CI actions pinned to exact commit SHAs. | `package.json`, `.github/` |
| CI token abuse | Workflow defaults to `contents: read`; only the deploy job gets `pages: write` + `id-token: write`, and only on `main`; checkout doesn't keep credentials; deploys are never cancelled halfway. | `ci-deploy.yml` |
| Local server path traversal | Dev server blocks `..`, dot-files, `node_modules`, null bytes. | `scripts/serve.js` |

## Accepted risks (with reasons)
1. **Clickjacking (framing) not blocked.** `frame-ancestors` only works as an HTTP header and
   GitHub Pages cannot set headers. Impact is low: there are no accounts, payments or
   sensitive actions to trick someone into. *Revisit if* logins or payments are added — then
   host behind Cloudflare (free) or Netlify/Vercel, which can send the header.
2. **Drafts are readable by anyone with access to the unlocked phone/browser.** They are
   plain localStorage. Acceptable for brainstorming notes; we tell users not to paste secrets.
3. **Several tabs: newest save wins.** If two tabs are edited at the same moment, the last save
   is kept and shown in both tabs (with a notice). Real merging isn't worth the complexity for notes.

## Before adding AI calls, logins or a database (v2+)
- **Never** put an API key in front-end code. Call AI models from a server function
  (e.g. a Supabase Edge Function) that holds the key as a secret.
- Turn on Row Level Security for every Supabase table; only use the public "anon/publishable" key in the browser.
- Add rate limiting to any function that costs money per call.
- Update the CSP `connect-src` to the exact API origin, and record it here.
- Run the full Trial by Fire with the Red Team focused on auth and data access.

## Reporting a security issue
Please open a GitHub issue titled "Security" **without** exploit details, or contact the
owner via butlerbuilds.dev, and we will arrange a private channel.
