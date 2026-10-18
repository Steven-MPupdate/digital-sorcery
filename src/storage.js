/**
 * storage.js — Saves and loads the learner's draft on THEIR device only (localStorage).
 *
 * What it does:  Wraps localStorage so the app never crashes when storage is blocked
 *                (private mode, full disk, strict browser settings), and validates
 *                everything it reads back.
 * Depends on:    src/incantation.js (normalizeDraft) for validation.
 * Used by:       src/app.js.
 *
 * DEV NOTE: Nothing here talks to a server. If a cloud save is added later (e.g. Supabase),
 * create a separate module and keep this one as the offline fallback.
 */

import { normalizeDraft, emptyDraft } from './incantation.js';

/** Storage keys. Version suffix lets us change the format later without breaking old drafts. */
export const DRAFT_KEY = 'digital-sorcery:draft:v1';
export const THEME_KEY = 'digital-sorcery:theme:v1';

/** Read the saved draft. Always returns a valid, cleaned draft. */
export function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    // SECURITY: the stored value is treated as untrusted — it is parsed, then rebuilt
    // field by field by normalizeDraft(), which drops unknown keys and unsafe characters.
    return normalizeDraft(JSON.parse(raw));
  } catch {
    return emptyDraft();
  }
}

/** Save the draft. Returns false if the browser refused (the app keeps working anyway). */
export function saveDraft(draft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(normalizeDraft(draft)));
    return true;
  } catch {
    return false;
  }
}

/** Remove the saved draft. */
export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable — nothing to clear */
  }
}

/** Read the saved theme. Only "dark" or "light" are accepted; anything else → "dark". */
export function loadTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Save the theme choice. */
export function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme === 'light' ? 'light' : 'dark');
  } catch {
    /* ignore — theme just won't persist */
  }
}
