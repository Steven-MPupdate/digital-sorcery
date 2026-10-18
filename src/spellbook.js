/**
 * spellbook.js — The ingredient definitions (pure data, no logic).
 *
 * What it does:  Lists every "ingredient" that goes into the Magic Circle, plus the
 *                teaching content for each one (why it matters, guiding questions,
 *                strong vs weak examples, quick-pick chips).
 * Depends on:    nothing.
 * Used by:       src/incantation.js (to build and score the prompt)
 *                src/app.js (to render the ingredient cards).
 *
 * DEV NOTE: To add a new ingredient, add an object to INGREDIENTS below, then add the
 * term to docs/GLOSSARY.md. The UI and the prompt pick it up automatically.
 * Keep `id` values stable — they are the keys used for saved drafts in localStorage.
 */

/** Hard cap on characters per ingredient. SECURITY: limits memory/abuse from huge pastes. */
export const MAX_FIELD_LENGTH = 2000;

/** Shorter cap for the one-line spell name. */
export const MAX_NAME_LENGTH = 80;

/**
 * @typedef {Object} Ingredient
 * @property {string}   id        Stable key (used in storage and tests).
 * @property {string}   rune      The mystical name shown in the UI.
 * @property {string}   plain     The plain-English name (always shown beside the rune).
 * @property {string}   symbol    Roman numeral drawn on the Magic Circle.
 *                                DEV NOTE: brand kit forbids emoji as markers — keep numerals.
 * @property {boolean}  required  If true, the spell cannot be cast without it.
 * @property {number}   weight    How much it adds to Spell Strength (all weights sum to 100).
 * @property {number}   fullAt    Characters needed for full strength credit.
 * @property {string}   heading   The section heading used inside the generated prompt.
 * @property {string}   why       Teaching note: why this ingredient matters.
 * @property {string[]} questions Guiding questions the learner should ask themselves.
 * @property {string}   weak      Example of a weak answer.
 * @property {string}   strong    Example of a strong answer.
 * @property {string}   placeholder Hint text inside the empty box.
 * @property {string[]} [chips]   Optional quick-pick phrases that append to the box.
 */

/** @type {Ingredient[]} */
export const INGREDIENTS = [
  {
    id: 'intent',
    rune: 'The Intent',
    plain: 'What & why',
    symbol: 'I',
    required: true,
    weight: 20,
    fullAt: 60,
    heading: 'Intent — what this app is and why it should exist',
    why: 'An AI builds exactly what you describe, not what you meant. One clear sentence of purpose stops it from guessing.',
    questions: [
      'In one sentence, what does this app do?',
      'What problem goes away when it exists?',
      'Why would someone choose this over doing nothing?',
    ],
    weak: 'A fitness app.',
    strong: 'A habit tracker that helps night-shift nurses keep a sleep routine, because normal apps assume a 9-to-5 day.',
    placeholder: 'This app helps … to … so that …',
  },
  {
    id: 'summoned',
    rune: 'The Summoned',
    plain: 'Who it serves',
    symbol: 'II',
    required: true,
    weight: 15,
    fullAt: 40,
    heading: 'Users — who this is for',
    why: 'Who uses it decides the language, the screen size, the difficulty and the tone.',
    questions: [
      'Who is the main person using it?',
      'What device are they on, and where are they when they use it?',
      'How comfortable are they with tech?',
    ],
    weak: 'Everyone.',
    strong: 'Busy nurses aged 25–50, on their phones during short breaks, low patience for setup.',
    placeholder: 'The main user is … They usually …',
  },
  {
    id: 'powers',
    rune: 'The Powers',
    plain: 'Core features',
    symbol: 'III',
    required: true,
    weight: 20,
    fullAt: 60,
    heading: 'Core features for version 1',
    why: 'Three to five powers is a spell. Twenty is a wish list. Small first versions actually ship.',
    questions: [
      'What are the 3–5 things it must do on day one?',
      'If you could only keep one, which is it?',
      'What does the user do first, second, third?',
    ],
    weak: 'Everything a habit app does.',
    strong: '1. Log sleep in two taps\n2. See a weekly chart\n3. Get one gentle reminder before shift',
    placeholder: '1. …\n2. …\n3. …',
  },
  {
    id: 'wards',
    rune: 'The Wards',
    plain: 'Not in v1',
    symbol: 'IV',
    required: false,
    weight: 10,
    fullAt: 25,
    heading: 'Out of scope for version 1 (do NOT build these yet)',
    why: 'Saying what you will NOT build protects your time and stops the AI from adding extras you then have to maintain.',
    questions: [
      'What tempting features can wait until later?',
      'Do you need logins, payments or social features right now?',
    ],
    weak: '(left blank)',
    strong: 'No accounts, no payments, no social sharing, no Apple Watch app.',
    placeholder: 'No …, no …, not yet …',
    chips: ['No user accounts yet', 'No payments yet', 'No social features yet'],
  },
  {
    id: 'tools',
    rune: 'The Tools',
    plain: 'Platform & stack',
    symbol: 'V',
    required: false,
    weight: 15,
    fullAt: 30,
    heading: 'Platform and tools',
    why: 'Naming your tools early stops the AI from picking something you cannot host, afford or maintain.',
    questions: [
      'Where will it run: phone, web, both?',
      'Where will it be hosted, and for how much?',
      'Does it need a database or logins? Which service?',
    ],
    weak: 'Whatever is best.',
    strong: 'Installable PWA, plain HTML/CSS/JS, hosted free on GitHub Pages, data saved on the device only.',
    placeholder: 'It runs on … built with … hosted on …',
    chips: ['Installable PWA', 'Plain HTML/CSS/JS', 'Hosted on GitHub Pages', 'Supabase for data & logins'],
  },
  {
    id: 'laws',
    rune: 'The Laws',
    plain: 'Rules to follow',
    symbol: 'VI',
    required: false,
    weight: 10,
    fullAt: 30,
    heading: 'Rules the builder must follow',
    why: 'Rules are how you keep quality high on every future change, not just the first one.',
    questions: [
      'How should the code be written and commented?',
      'What security and privacy rules matter?',
      'How should changes be tested?',
    ],
    weak: '(left blank)',
    strong: 'Readable code with comments. No secrets in code. Test every feature. Works on a 360px-wide phone.',
    placeholder: 'Always … Never …',
    chips: ['Readable code with comments', 'No secrets in the code', 'Write tests for each feature', 'Mobile-first and accessible'],
  },
  {
    id: 'proof',
    rune: 'The Proof',
    plain: 'How we know it works',
    symbol: 'VII',
    required: false,
    weight: 10,
    fullAt: 30,
    heading: 'Definition of done (how we know v1 works)',
    why: 'Without a finish line, a project never finishes. Proof turns "it feels done" into "it is done".',
    questions: [
      'What can a user do, start to finish, when v1 is done?',
      'How will you test that on a real phone?',
    ],
    weak: 'When it looks good.',
    strong: 'A new user can install it, log a night of sleep and see it on the chart in under one minute, offline.',
    placeholder: 'v1 is done when a user can …',
  },
];

/**
 * The Iteration Ritual — follow-up prompts to use AFTER the first answer comes back.
 * Always shown on the page (below Cast); also listed in docs/GLOSSARY.md.
 */
export const ITERATION_RITUAL = [
  { step: 'Observe', prompt: 'Before changing anything: summarize what you built and list anything you assumed that I did not tell you.' },
  { step: 'Question', prompt: 'What are the 3 biggest risks or weak spots in this plan? Ask me anything you need to decide them.' },
  { step: 'Refine', prompt: 'Let\'s change one thing only: … Keep everything else the same and tell me how to test the change.' },
  { step: 'Test', prompt: 'Give me a step-by-step checklist to test this on my phone, including what should happen at each step.' },
  { step: 'Record', prompt: 'Update the handoff notes and glossary with anything new we decided or named in this round.' },
];
