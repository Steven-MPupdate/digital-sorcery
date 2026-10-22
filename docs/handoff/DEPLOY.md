# Deploying

The site lives on **Firebase Hosting** at **https://digitalsorcery.butlerbuilds.dev**, published by
hand on Steven's "deploy" (see below, and DECISIONS D20). **GitHub Pages is being retired** (Steven,
2026-10-22: "Don't work on the github page anymore"); he takes that copy down himself. Until the
`deploy` (Pages) job is removed from `.github/workflows/ci-deploy.yml`, a passing push to `main`
still republishes it; nobody checks or links that copy any more.

## Firebase Hosting (set up 2026-10-22)

Cost: free. Hosting on the Spark (no-card) plan covers far more traffic than this site will use.

- **Project:** `mp-soul-stats`, the studio's shared project (Soul Stats, butlerbuilds.dev, the client
  portal, the resume site). This repo only ever touches its own Hosting site, never Firestore,
  rules or functions: `firebase.json` holds a `hosting` block and nothing else.
- **Site id:** `digital-sorcery-butlerbuilds` (the plain `digital-sorcery` id belongs to someone
  else's project). Default address: `https://digital-sorcery-butlerbuilds.web.app`.
- The ids live in `.firebaserc` (`projects.default`), `firebase.json` (`hosting.site`) and the
  `deploy:firebase` script in `package.json`.

**Do not add the `FIREBASE_SERVICE_ACCOUNT` secret while the site lives in `mp-soul-stats`.**
SECURITY: a Firebase Hosting Admin key cannot be limited to one site, so a leaked key could republish
every site in the shared project, client sites included. Without the secret the `deploy-firebase`
job prints "skipping" and the build stays green. If this site ever moves to a project of its own,
a key with only the **Firebase Hosting Admin** role (never Owner) can be added as that secret, and
merging to `main` then publishes to Firebase too.

### Publishing by hand (only when Steven says "deploy")
```powershell
npm install -g firebase-tools   # once
firebase login                  # once, in a browser
npm run deploy:firebase         # builds _site/ and publishes, naming the exact site and project
```
Never run a bare publish command: the studio rule is to always name `--only hosting:<site>` and
`--project <project-id>`, which the npm script does for you.

### Firebase custom domain (free certificate)
**`digitalsorcery.butlerbuilds.dev`**, connected by Steven on 2026-10-22 (a CNAME to
`digital-sorcery-butlerbuilds.web.app`). Firebase's free certificate was issued by 2026-10-23:
HTTPS works, and plain http redirects to https.
Saved drafts live per website address: anyone who used the GitHub Pages address keeps their
drafts there. The service worker is network-first, so nobody gets stuck on the old site.

## GitHub Pages: being retired (do not work on it)

### One-time setup (owner, ~3 minutes, works from a phone browser)
1. **Make the repo public:** GitHub → repo → Settings → General → Danger Zone →
   Change visibility → Public. (Free Pages hosting needs a public repo on the free plan.)
2. **Turn on Pages via Actions:** Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. **Merge to `main`.** The `Test & Deploy` workflow runs tests, then publishes.
4. Site URL: **https://steven-mpupdate.github.io/digital-sorcery/**
   (If you rename the repo, e.g. to `digital-sorcery`, the URL changes to match. Everything uses relative paths, so nothing breaks.)

### Custom domain on GitHub Pages (only if Firebase is not used)
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
- After the publish: open both addresses (`.web.app` and the Pages URL), hard-refresh, and check
  the footer version. If they differ, something published from a different commit.
