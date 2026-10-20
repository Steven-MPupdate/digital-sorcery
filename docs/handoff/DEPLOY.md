# Deploying

The site has two hosts right now: **Firebase Hosting** (where it is moving to) and
**GitHub Pages** (where it has lived since v1.0). Every passing push to `main` publishes to both,
from the same folder `_site/`, built by `npm run build:site`. Once Firebase serves the custom
domain, the Pages job gets deleted (see DECISIONS D18).

## Firebase Hosting — one-time setup (owner, ~10 minutes)

Cost: free. Hosting on the Spark (no-card) plan covers far more traffic than this site will use.

1. **Create the project:** [console.firebase.google.com](https://console.firebase.google.com/) →
   Add project → name it `digital-sorcery`. Skip Google Analytics. Write down the **project id**
   Firebase shows (it may be `digital-sorcery-1a2b3` if the plain name is taken).
2. **Add a Hosting site:** in the project, Build → Hosting → Get started. The default site id is
   the project id. That id is the **site id**.
3. **Put both ids in the repo** (this is what unlocks the publish job):
   - `.firebaserc` → `projects.default` → your project id
   - `firebase.json` → `hosting.site` → your site id
   - `package.json` → the `deploy:firebase` script → the same two ids

   Until these stop saying `CHANGE-ME`, the publish job prints "skipping" and the build stays green.
4. **Make the robot account that publishes from GitHub** (so no human key is ever used):
   - Google Cloud console → IAM & Admin → Service accounts → Create service account,
     name `github-deploy`.
   - Grant it one role: **Firebase Hosting Admin**. Nothing else, and never Owner, so a leaked key
     could only republish this site.
   - Keys → Add key → JSON → download it. Treat that file like a password.
5. **Add the key as a repo secret:** GitHub → repo → Settings → Secrets and variables → Actions →
   New repository secret → name `FIREBASE_SERVICE_ACCOUNT`, value: the whole contents of the JSON
   file. Then delete the downloaded file. The key is never committed and never printed in logs.
6. **Merge to `main`.** Tests run, then the site publishes to
   `https://<your-site-id>.web.app` (and `.firebaseapp.com`).

### Publishing by hand (only when Steven says "deploy")
```powershell
npm install -g firebase-tools   # once
firebase login                  # once, in a browser
npm run deploy:firebase         # builds _site/ and publishes, naming the exact site and project
```
Never run a bare publish command: the studio rule is to always name `--only hosting:<site>` and
`--project <project-id>`, which the npm script does for you.

### Firebase custom domain (free certificate)
Recommended: **`sorcery.butlerbuilds.dev`**.
1. Firebase console → Hosting → Add custom domain → `sorcery.butlerbuilds.dev`.
2. Add the TXT record it shows at your DNS provider (ownership check), then the two **A records**
   Firebase gives you for the subdomain. (Firebase uses A records, not a CNAME.)
3. Wait for "Connected". HTTPS is issued automatically, usually within an hour (up to 24).
4. Only after that, remove the custom domain from GitHub Pages, so one address is live at a time.
5. Saved drafts live per website address: anyone who used the old address keeps their drafts there.
   The service worker is network-first, so nobody gets stuck on the old site. Say so in the
   release note if people already use the app.

## GitHub Pages — the current host (kept until Firebase is proven)

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
