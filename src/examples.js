/**
 * examples.js: Three finished example spells (pure data, no logic).
 *
 * What it does:  Gives learners worked examples to copy from. The chips under "Name your spell"
 *                fill in an example's name and ingredients I to III; the "See Examples" pop-up
 *                shows all seven ingredients of each one.
 * Depends on:    nothing (the field keys match the ingredient ids in spellbook.js).
 * Used by:       src/app.js (renderExamplePicker, renderExamplesDialog),
 *                tests/unit/examples.test.js.
 *
 * DEV NOTE: The examples are made up on purpose (no real restaurant, prices or people), so they
 * never go out of date or promise anything. Every example fills every ingredient, so the pop-up
 * shows a complete spell; tests/unit/examples.test.js checks that.
 */

/**
 * @typedef {Object} ExampleSpell
 * @property {string} id      Stable key (used in tests and on the buttons).
 * @property {string} name    The spell name.
 * @property {string} pitch   One line shown under the name in the pop-up.
 * @property {Record<string, string>} fields  One answer per ingredient id.
 */

/** @type {readonly ExampleSpell[]} */
export const EXAMPLE_SPELLS = Object.freeze([
  {
    id: 'local-bites',
    name: 'Local Bites',
    pitch: 'A meal chooser for one local restaurant that suggests the top three orders.',
    fields: {
      intent: 'A meal chooser for one local restaurant: answer three quick questions and get the top three orders to try, so nobody stands at the counter stuck on a long menu.',
      summoned: 'First-time and regular customers of one restaurant, on their phones while waiting in line, deciding in under a minute. Not tech experts.',
      powers: '1. Ask three quick questions: how hungry, budget, any diet needs\n2. Show the top three orders that match, with prices\n3. One tap shows the chosen order big enough to show the cashier',
      wards: 'No online ordering or payments, no accounts, no reviews or ratings.',
      tools: 'Installable PWA, plain HTML/CSS/JS, the menu kept in one data file the owner can edit, hosted free on Firebase Hosting.',
      laws: 'Works on iPhone, Android and tablet. Prices and dishes come only from the menu file, never made up. Readable code with comments.',
      proof: 'A first-time customer answers the three questions and sees three orders within their budget in under 30 seconds.',
    },
  },
  {
    id: 'night-shift-sleep',
    name: 'Night Shift Sleep',
    pitch: 'A sleep routine tracker for nurses who work nights.',
    fields: {
      intent: 'A habit tracker that helps night-shift nurses keep a sleep routine, because normal apps assume a 9-to-5 day.',
      summoned: 'Busy nurses aged 25 to 50, on their phones during short breaks, low patience for setup.',
      powers: '1. Log sleep in two taps\n2. See a weekly chart\n3. Get one gentle reminder before shift',
      wards: 'No accounts, no payments, no social sharing, no smartwatch app.',
      tools: 'Installable PWA, plain HTML/CSS/JS, data saved on the device only, hosted free.',
      laws: 'Works on iPhone, Android and tablet. No secrets in the code. Test every feature.',
      proof: 'A new user can install it, log a night of sleep and see it on the chart in under one minute, offline.',
    },
  },
  {
    id: 'plant-pal',
    name: 'Plant Pal',
    pitch: 'Watering reminders for people who keep forgetting their houseplants.',
    fields: {
      intent: 'Reminds busy plant owners which houseplants need water today, so plants stop dying from guesswork.',
      summoned: 'Renters with 3 to 15 houseplants, checking their phone at home in the morning. Not plant experts.',
      powers: '1. Add a plant with a photo and how often it needs water\n2. See today\'s list of plants to water\n3. Tap a plant to mark it watered',
      wards: 'No plant identification by camera, no social feed, no shop.',
      tools: 'Installable PWA, plain HTML/CSS/JS, plants and photos saved on the device only, hosted free.',
      laws: 'Works on iPhone, Android and tablet. Plain words, no plant jargon. Write tests for each feature.',
      proof: 'A new user adds two plants and sees tomorrow\'s watering list in under two minutes, offline.',
    },
  },
].map((example) => Object.freeze({ ...example, fields: Object.freeze({ ...example.fields }) })));

/** The ingredients an example fills in when picked under "Name your spell" (I to III). */
export const EXAMPLE_FILL_IDS = Object.freeze(['intent', 'summoned', 'powers']);
