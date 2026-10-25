# Deploying

The site lives on **Firebase Hosting** at **https://digitalsorcery.butlerbuilds.dev**, published by
hand on Steven's "deploy" (see below, and DECISIONS D20). **GitHub is only the code backup**
(Steven, 2026-10-25): nothing is published from it, and pushing to `main` changes nothing live.

## Firebase Hosting (set up 2026-10-22)

Cost: free. Hosting on the Spark (no-card) plan covers far more traffic than this site will use.

- **Project:** `mp-soul-stats`, the studio's shared project (Soul Stats, butlerbuilds.dev, the client
  portal, the resume site). This repo only ever touches its own Hosting site, never Firestore,
  rules or functions: `firebase.json` holds a `hosting` block and nothing else.
- **Site id:** `digital-sorcery-butlerbuilds` (the plain `digital-sorcery` id belongs to someone
  else's project). Default address: `https://digital-sorcery-butlerbuilds.web.app`.
- The ids live in `.firebaserc` (`projects.default`), `firebase.json` (`hosting.site`) and the
  `deploy:firebase` script in `package.json`.

**Never add a Firebase key to GitHub** (no `FIREBASE_SERVICE_ACCOUNT` secret). GitHub is the backup,
not a publisher, and the GitHub job that used that key was deleted (DECISIONS D26).
SECURITY: a Firebase Hosting Admin key cannot be limited to one site, so a leaked key could republish
every site in the shared project, client sites included.

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

## GitHub Pages: gone (do not bring it back)

The site was published to GitHub Pages until 2026-10-23, when the `deploy` job was deleted from
`ci-deploy.yml` (DECISIONS D23) and Steven removed the site from Pages. Firebase serves the one
address, `digitalsorcery.butlerbuilds.dev`. A second live copy was a second thing to keep in step,
and it never carried the security headers in `firebase.json`. The old Pages setup steps were
deleted on 2026-10-25 (D26); git history keeps them if they are ever needed as a record.

## GitHub: backup only

The repo on GitHub is the backup of this code, so any earlier version can be restored from its
history. After every deploy (or on Steven's "push it"), push `main` to GitHub. Merges happen on the
laptop after `npm test` passes; no pull request is needed. The GitHub `Tests` workflow only runs the
tests on each push, to flag a broken backup early. It publishes nothing.

## Every release
- Bump `CACHE_VERSION` in `sw.js` and the version in `package.json` + footer in `index.html`.
- Add a `CHANGELOG.md` entry.
- Run `npm test`. Do NOT run the stress-test agents as a release step; they run only when Steven
  approves them (see STRESS-TESTING.md).
- After the publish: open both Firebase addresses (`.web.app` and the custom domain), hard-refresh,
  and check the footer version. If they differ, something published from a different commit.
- If the share card changed (`assets/social/og-image.png` or the `og:` tags in `index.html`), ask
  the networks to re-read the page, or they keep showing their cached copy for days:
  [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) and the
  [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) both re-scrape on
  demand. iMessage, Slack and Discord refresh on their own within a day or so.
- A redesigned card is safest under a new file name (`og-image-2.png`), because networks keep an
  old preview far longer than the one-day cache header, and links already shared point at the
  name in the tags.
