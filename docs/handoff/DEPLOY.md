# Deploying

## One-time setup (owner, ~3 minutes, works from a phone browser)
1. **Make the repo public:** GitHub → repo → Settings → General → Danger Zone →
   Change visibility → Public. (Free Pages hosting needs a public repo on the free plan.)
2. **Turn on Pages via Actions:** Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. **Merge to `main`.** The `Test & Deploy` workflow runs tests, then publishes.
4. Site URL: **https://steven-mpupdate.github.io/digital-sorcery/**
   (If you rename the repo, e.g. to `digital-sorcery`, the URL changes to match. Everything uses relative paths, so nothing breaks.)

## Custom domain (free on GitHub; you only pay your domain registrar)
Recommended: a subdomain such as **`sorcery.butlerbuilds.dev`**, so your main site stays where it is.
1. **Verify the domain first** (prevents someone else claiming it): GitHub → your profile
   Settings → Pages → Add a domain → `butlerbuilds.dev` → add the TXT record it shows at your DNS provider.
2. At your DNS provider, add: `CNAME  sorcery  →  steven-mpupdate.github.io`
3. Repo Settings → Pages → Custom domain → `sorcery.butlerbuilds.dev` → Save.
4. When the DNS check passes, tick **Enforce HTTPS**. (`.dev` domains require HTTPS; GitHub
   provides the certificate for free. It can take up to an hour.)
5. Existing visitors follow GitHub's redirect to the new address automatically (the service worker
   is network-first, so it doesn't trap them on the old one). Their saved drafts stay on the old
   address, though: browsers keep storage per website. Mention this if people already use the app.

## Every release
- Bump `CACHE_VERSION` in `sw.js` and the version in `package.json` + footer in `index.html`.
- Add a `CHANGELOG.md` entry.
- Run the Trial by Fire (see STRESS-TESTING.md).
