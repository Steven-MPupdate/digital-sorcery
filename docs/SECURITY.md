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
| Hidden-text tricks in prompts | Control and bidi-override characters stripped. Lines starting with `#` escaped so text can't fake prompt sections. | `cleanText()`, `protectMarkdown()` |
| Huge input (memory abuse) | 2000-char cap per ingredient, 80 for the name, enforced in HTML **and** in logic. | `spellbook.js`, `index.html` |
| Unsafe download names | File name reduced to `a–z 0–9 -`, max 40 chars. | `spellFileName()` |
| Cache poisoning / stale code | Service worker only handles same-origin GETs; caches only good `basic` responses for known files; versioned cache with old versions deleted. | `sw.js` |
| Third-party tracking / data leaks | No third-party requests at all (fonts self-hosted). `referrer` policy `no-referrer`. Tested. | `index.html`, `tests/e2e` |
| Leaked secrets | Rule: no secrets in repo. CI runs a simple secret scan; GitHub secret scanning also applies to public repos. | `CLAUDE.md`, `ci-deploy.yml` |
| Supply chain | One dev-only dependency (Playwright), version pinned; lockfile committed; Dependabot updates; CI actions pinned to major versions. | `package.json`, `.github/` |
| CI token abuse | Workflow defaults to `contents: read`; only the deploy job gets `pages: write` + `id-token: write`, and only on `main`. | `ci-deploy.yml` |
| Local server path traversal | Dev server blocks `..`, dot-files, `node_modules`, null bytes. | `scripts/serve.js` |

## Accepted risks (with reasons)
1. **Clickjacking (framing) not blocked.** `frame-ancestors` only works as an HTTP header and
   GitHub Pages cannot set headers. Impact is low: there are no accounts, payments or
   sensitive actions to trick someone into. *Revisit if* logins or payments are added — then
   host behind Cloudflare (free) or Netlify/Vercel, which can send the header.
2. **Drafts are readable by anyone with access to the unlocked phone/browser.** They are
   plain localStorage. Acceptable for brainstorming notes; we tell users not to paste secrets.
3. **GitHub Actions pinned by major version tag (e.g. `@v4`), not commit SHA.** These are
   official GitHub-owned actions; Dependabot watches them. *Revisit* if third-party actions are added.

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
