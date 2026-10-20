# References

Official sources this project relies on, and what we used each for.

| Source | Used for |
|---|---|
| [GitHub Pages docs](https://docs.github.com/en/pages) | Hosting the site for free. |
| [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | 1 GB site size, 100 GB/month soft bandwidth, 10-minute deploy timeout. |
| [Custom domains for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) | Using a domain like `sorcery.butlerbuilds.dev`. |
| [Verifying a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages) | Preventing domain takeover. |
| [Publishing Pages with GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) | The deploy job in `ci-deploy.yml`. |
| [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) | Manifest, installability, service worker. |
| [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) | Offline caching in `sw.js`. |
| [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) | The CSP meta tag. Note: `frame-ancestors` does not work in a meta tag. |
| [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) | Using `textContent`, never `innerHTML`, for user text. |
| [OWASP Prototype Pollution Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html) | Rebuilding drafts from known keys only. |
| [Trojan Source (bidi attacks)](https://trojansource.codes/) | Stripping bidirectional override characters. |
| [WCAG 2.2 contrast (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | 4.5:1 text contrast, checked by `scripts/check-contrast.js`. |
| [web.dev: Maskable icons](https://web.dev/articles/maskable-icon) | Safe-zone padding for `icon-maskable-512.png`. |
| [Playwright docs](https://playwright.dev/docs/intro) | Browser tests. |
| [Fontsource](https://fontsource.org/) | Source of the self-hosted Cinzel, Cormorant Garamond and Montserrat files (SIL OFL 1.1). |
| [Termux on F-Droid](https://f-droid.org/packages/com.termux/) | Optional: running code on an Android phone. |
| [MDN: Web app manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest) | `id`, `scope`, `start_url`, icon `purpose` fields. |
| [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) | `copyText()` (with an `execCommand` fallback for older browsers). |
| [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent) | The Install button (non-standard, Chromium only). |
| [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | Turning off the ring animation. |
| [MDN: storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event) | Keeping several tabs in sync. |
| [WCAG 2.2: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | Cards fitting at 200% text; 3:1 input borders. |
| [CommonMark spec](https://spec.commonmark.org/) | How fenced code blocks work (answer fences in `castSpell()`). |
| [Node.js test runner](https://nodejs.org/api/test.html) | `npm run test:unit`. |
| [GitHub: Security hardening for Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) | Pinning actions to commit SHAs; least-privilege permissions. |
| [GitHub Actions used](https://github.com/actions) | `checkout`, `setup-node`, `upload-artifact`, `configure-pages`, `upload-pages-artifact`, `deploy-pages`. |
| [Dependabot configuration](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference) | `.github/dependabot.yml`. |
| [GitHub secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning) | Backup to our CI secret scan. |
| [GitHub Pages and Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll) | Why `_site/.nojekyll` is added. |
| [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Edge Function secrets](https://supabase.com/docs/guides/functions/secrets) | The v2 guidance in `docs/SECURITY.md`. |
| Portal destinations: [claude.ai](https://claude.ai/new), [chatgpt.com](https://chatgpt.com/), [gemini.google.com](https://gemini.google.com/app), [bolt.new](https://bolt.new/), [lovable.dev](https://lovable.dev/) | The five AI apps in `src/portals.js` (allowlisted in `tests/unit/portals.test.js`). |
| [MDN: rel=noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener) and [rel=noreferrer](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noreferrer) | Outbound link safety in `buildPortalLink()`. |
| [MDN: Window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) | Opening a portal only after the copy succeeds. |
| [Report: claude.ai `?q=` prefill stopped working](https://github.com/anthropics/claude-code/issues/8827) and [community prefill bookmarklets](https://www.vincentschmalbach.com/claude-chatgpt-bookmarklets/) | Why prefilled links are not relied on (DECISIONS D16). |
| [SIL Open Font License 1.1](https://openfontlicense.org/) | License of the three self-hosted fonts (copies in `assets/fonts/`). |
| Mirror Path Brand Kit v1 (2026-09-26, private PDF) | Colors, type, spacing, radius and the "doesn't do" rules. Kept privately by the owner; ask Steven for a copy. |
| [Firebase Hosting: get started](https://firebase.google.com/docs/hosting/quickstart) and [full config reference](https://firebase.google.com/docs/hosting/full-config) | `firebase.json`: `public`, `ignore`, `headers`, `trailingSlashBehavior`, `appAssociation`. |
| [Firebase Hosting: GitHub integration](https://firebase.google.com/docs/hosting/github-integration) and [CLI reference](https://firebase.google.com/docs/cli) | The `deploy-firebase` job: service-account key, `--only hosting:<site>`, `--non-interactive`. |
| [Firebase Hosting: custom domain](https://firebase.google.com/docs/hosting/custom-domain) | The DNS steps in DEPLOY.md for `sorcery.butlerbuilds.dev`. |
| [Firebase pricing (Spark plan)](https://firebase.google.com/pricing) | Why Hosting stays free at this size. |
| [GitHub: using secrets in Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) | Storing `FIREBASE_SERVICE_ACCOUNT`; never printing it. |
