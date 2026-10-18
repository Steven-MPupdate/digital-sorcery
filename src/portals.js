/**
 * portals.js — The "Portals": AI apps a cast spell can be taken to (pure data, no logic).
 *
 * What it does:  Lists the AI chat apps and app builders shown after casting. Tapping a
 *                portal copies the spell, then opens that app in a new tab (or its phone app).
 * Depends on:    nothing.
 * Used by:       src/app.js (renderPortals, buildPortalLink), tests/unit/portals.test.js
 *                and tests/e2e/app.spec.js (which counts the buttons).
 *
 * DEV NOTE: We deliberately do NOT put the prompt inside the link (e.g. "?q=..."):
 *   1. Those link formats are unofficial and have broken before.
 *   2. Anything in a URL can end up in browser history and server logs, and spells may
 *      contain private plans. Copy-then-open keeps the spell on the learner's clipboard.
 * See docs/DECISIONS.md D16.
 * SECURITY: every URL must be a fixed https:// address. Never build one from user input.
 * DEV NOTE: To add a portal: add an object below, add its host to ALLOWED_PORTAL_HOSTS in
 * tests/unit/portals.test.js, and add a line to docs/GLOSSARY.md and docs/REFERENCES.md.
 * The lists are frozen so no other code can change them while the app runs.
 */

/**
 * @typedef {Object} Portal
 * @property {string} id     Stable key (used in tests).
 * @property {string} name   Shown on the button.
 * @property {string} url    Fixed https:// address to open.
 * @property {'chat'|'builder'} kind  Chat AI (talk it through) or app builder (builds & hosts).
 */

/** @type {readonly Portal[]} */
export const PORTALS = Object.freeze([
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', kind: 'chat' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', kind: 'chat' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', kind: 'chat' },
  { id: 'bolt', name: 'Bolt', url: 'https://bolt.new/', kind: 'builder' },
  { id: 'lovable', name: 'Lovable', url: 'https://lovable.dev/', kind: 'builder' },
].map((portal) => Object.freeze(portal)));

/** Headings and teaching notes for each group of portals. */
export const PORTAL_GROUPS = Object.freeze({
  chat: {
    title: 'Talk it through',
    note: 'Chat AIs ask questions, plan with you and write code you control. Best for learning.',
  },
  builder: {
    title: 'Build it for me',
    note: 'App builders turn the spell straight into a running app they host. Fastest to see results.',
  },
});
