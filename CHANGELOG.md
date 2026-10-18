# Changelog

## 1.1.0 — 2026-10-18
- **Portals:** after casting, one tap copies the spell and opens Claude, ChatGPT or Gemini
  ("Talk it through"), or the app builders Bolt and Lovable ("Build it for me").
- The spell is never put in the link (privacy, reliability); links can't control this page.

## 1.0.0 — 2026-10-18
First version.
- Seven ingredients with teaching notes, guiding questions, weak-vs-strong examples and quick-pick chips.
- Magic Circle (heptagram) lights up as ingredients are added; Spell Strength meter (0–100).
- Counsel hints for vague words, too many features and missing Wards.
- Cast the spell → Markdown starter prompt with a built-in Working Agreement; copy and download.
- Iteration Ritual: five follow-up prompts with copy buttons.
- Mirror Path brand kit: Ink (dark) default, Ivory (light) toggle; self-hosted fonts.
- Installable PWA, works offline; drafts saved on the device only.
- Security: strict CSP, no innerHTML for user text, validated storage, input caps.
- Trial by Fire: unit + browser tests (incl. attack inputs) and five stress-test agents.
- GitHub Actions: checks and tests on every push; deploy `main` to GitHub Pages (actions pinned to SHAs).
- Hardened after the first Trial by Fire (see docs/handoff/HANDOFF-LOG.md): answers fenced in the
  prompt, zero-width/invisible input handled, network-first offline worker, tabs kept in sync,
  visible save-failure warning, large-text layout, focus order, contrast of hover states and borders,
  hidden-character check for source code.
