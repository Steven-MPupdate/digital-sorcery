/**
 * app-tools.js: The two footer buttons every studio PWA has, plus service worker start-up.
 *
 * What it does:  "Download app" installs Digital Sorcery like a phone or desktop app. Chrome and
 *                Edge offer this only while the page is installable and not installed yet, so the
 *                button only shows then. Safari on iPhone and iPad has no install prompt; there the
 *                button explains Share, then "Add to Home Screen".
 *                "Hard refresh" throws away the files kept by the service worker (sw.js), checks
 *                for a new service worker and reloads, so the newest release is sure to load.
 *                It never touches the learner's draft: that lives in localStorage, not in these caches.
 * Depends on:    nothing.
 * Used by:       src/app.js (initAppTools).
 *
 * DEV NOTE: Pattern shared with mirror-hall/business-dashboard/public/app-tools.js (studio rule).
 */

const $ = (id) => document.getElementById(id);

/** The browser's "you may offer to install" event, kept until the button is pressed. */
let installOffer = null;

const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/** Safari on iPhone or iPad. DEV NOTE: iPads report themselves as a Mac, so touch points tell them apart. */
function isAppleMobileSafari() {
  const ua = navigator.userAgent;
  const appleMobile = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  return appleMobile && !/crios|fxios|edgios/i.test(ua);
}

// Fired soon after the page loads, possibly before start-up finishes, so listen as soon as this file loads.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); // no browser mini-bar; our button offers it instead
  installOffer = event;
  showInstallButton();
});

window.addEventListener('appinstalled', () => {
  installOffer = null;
  showInstallButton();
});

function showInstallButton() {
  const button = $('install-btn');
  if (button) button.hidden = isInstalled() || !(installOffer || isAppleMobileSafari());
}

async function install(setStatus) {
  if (!installOffer) {
    setStatus('On iPhone or iPad: tap the Share button, then "Add to Home Screen".');
    return;
  }
  const offer = installOffer;
  installOffer = null; // each offer can be used once
  showInstallButton();
  await offer.prompt();
}

async function hardRefresh(beforeRefresh) {
  beforeRefresh(); // save any answers still waiting, so nothing typed is lost
  const button = $('hard-refresh-btn');
  button.disabled = true;
  button.textContent = 'Refreshing…';
  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update();
  } catch {
    // Nothing kept, or the browser refused: the reload below still fetches fresh files.
  }
  // A changed query string makes the browser fetch the page itself again instead of reusing it.
  const url = new URL(location.href);
  url.searchParams.set('refresh', Date.now().toString(36));
  location.replace(url);
}

/**
 * Called once by app.js.
 * @param {object} helpers
 * @param {(text: string) => void} helpers.setStatus  shows a message next to the footer buttons
 * @param {() => void} helpers.beforeRefresh          saves anything still waiting before reloading
 */
export function initAppTools({ setStatus, beforeRefresh }) {
  // Remove the refresh marker from the address bar so it isn't bookmarked.
  const url = new URL(location.href);
  if (url.searchParams.has('refresh')) {
    url.searchParams.delete('refresh');
    history.replaceState(null, '', url);
  }
  // DEV NOTE: Service workers only run on https:// or localhost. Offline mode is a bonus.
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  $('install-btn').addEventListener('click', () => install(setStatus));
  $('hard-refresh-btn').addEventListener('click', () => hardRefresh(beforeRefresh));
  showInstallButton();
}
