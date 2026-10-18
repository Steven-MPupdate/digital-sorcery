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
| Mirror Path Brand Kit v1 (2026-09-26, private PDF) | Colors, type, spacing, radius and the "doesn't do" rules. |
