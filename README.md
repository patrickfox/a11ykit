# A11yKit

[![npm version](https://img.shields.io/npm/v/@a11yfox/a11ykit.svg)](https://www.npmjs.com/package/@a11yfox/a11ykit)
[![Bundle Size](https://deno.bundlejs.com/?q=@a11yfox/a11ykit&badge)](https://bundlejs.com/?q=@a11yfox/a11ykit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/patrickfox/a11ykit/blob/master/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@a11yfox/a11ykit.svg)](https://www.npmjs.com/package/@a11yfox/a11ykit)

## Essential JavaScript utilities that empower modern accessibility

A11yKit is a lightweight, JS accessibility (a11y) library that provides essential UI utilities for managing focus, announcing screen reader (SR) messages, hiding content from SR's, and managing motion/animation preferences. Built with modern web development in mind, it offers a clean API with full type safety and comprehensive browser support.

## Features

- 🎯 **Focus Management** - Dynamically place focus on any element without hardcoded tabindex
- 📢 **Screen Reader Announcements** - Announce messages to improve understanding for SR users
- 🔒 **ARIA State Management** - Hide/show content from screen readers
- 🎨 **Motion Preferences** - Detect and respond to `prefers-reduced-motion`
- ⚡ **Lightweight** - Minimal footprint, no dependencies
- ✅ **Well Tested** - Comprehensive Jest test suite, plus a manual screen reader harness

## Why does A11yKit exist?

When auditing web sites for accessibility compliance, I often find well-meaning attempts to make the experience more accessible, but they are often ad-hoc, one-off fixes that clutter the HTML with unnecessary, redundant, and even detrimental code. Examples:
- Harcoded `tabindex` attributes on elements that should not be focusable
- Overzealous and unmanageable use of `aria-live` that creates a broken experience

I firmly believe that accessibility solutions should be simple and elegant, minimze code clutter (and potential for future issues), and rely on a foundation of semantic HTML and minimal  `aria-*` and `role` attributes to improve the accessible experience. A11yKit provides a set of tools that makes managing announcing important messages to SR users and managing focus easy and manageable.

With that said - A11yKit is not a cure-all for your accessibility challenges.  While the goal of A11yKit is to make these techniques easier to manage, missuse can lead to an inaccessible experience. Use these functions minimally and with great care - and **always test your experiences using screen readers**.

Questions? Thoughts? Submit a issue/question on the [A11yKit GitHub page](https://github.com/patrickfox/a11ykit/issues).

## Getting Started

```bash
npm install @a11yfox/a11ykit
```

```js
import { access, announce, ariaHide, ariaUnhide, prefersReducedMotion, watchReducedMotion } from '@a11yfox/a11ykit';
```

### No build step

A11yKit has no dependencies, so both builds run directly from a CDN in a plain
HTML page with no tooling at all.

#### ES module

```html
<script type="module">
  import { access, announce, ariaHide, ariaUnhide, prefersReducedMotion }
    from 'https://cdn.jsdelivr.net/npm/@a11yfox/a11ykit@1.1.1/dist/a11ykit.esm.js';

  announce('Settings saved');
</script>
```

Repeating that URL in every module gets unwieldy, and changing the pinned
version means editing each one. An import map lets you declare it once:

```html
<script type="importmap">
{
  "imports": {
    "@a11yfox/a11ykit": "https://cdn.jsdelivr.net/npm/@a11yfox/a11ykit@1.1.1/dist/a11ykit.esm.js"
  }
}
</script>

<script type="module">
  import { announce } from '@a11yfox/a11ykit';
</script>
```

Import maps apply to ES modules only — they resolve bare specifiers for
`import` statements, so they have no effect on the UMD build below, which
loads as a classic script. The import map must also appear before the first
module that relies on it.

#### UMD global

For classic scripts, inline handlers, or anywhere `type="module"` is not an
option:

```html
<script src="https://cdn.jsdelivr.net/npm/@a11yfox/a11ykit@1.1.1/dist/a11ykit.umd.min.js"></script>
<script>
  A11yKit.announce('Settings saved');
</script>
```

The UMD build exposes everything on a global named `A11yKit`.

## API Reference

### `access(element, placeFocusBefore?, options?)`

Dynamically place focus on any element without hardcoded tabindex attributes.

**Parameters:**
- `element: HTMLElement` - The element to receive focus
- `placeFocusBefore?: string` - Optional. When provided, creates a visually hidden span before the element, uses the string as its text content, and places focus there instead of on the element itself.

  The parameter is currently typed `string | boolean`. Passing `true` inserts an *empty* hidden span, which announces nothing — pass the message you want read instead. The `boolean` half of the type is deprecated and will be removed in a future release.

  The message is inserted as text, not markup.
- `options?: { preventScroll?: boolean }` - Optional. `preventScroll: true` focuses without scrolling the element into view, for when you have already positioned the viewport yourself.

**Returns:** `HTMLElement` - The element that actually received focus: the target, or the temporary span when `placeFocusBefore` was used.

**Behavior:**
- Places focus on the target element
  - If a string message is provided as a second parameter, the script will create a temporary, non-visible element that contains the message.
- Screen readers will read the contents of the target element
- Automatically cleans up on blur, and restores any original tabindex state
- Elements the browser already focuses — links, buttons, form controls, `summary`, `iframe`, media with controls, `contenteditable` — are focused directly, with no `tabindex` or `data-ogti` written at all. Only elements that are not natively focusable take the tabindex path.

**Example:**
```typescript
const heading = document.querySelector('h2')!;

// Place focus on the heading directly
access(heading);

// Place focus on a hidden, temporary element with a screen reader announcement
access(heading, 'File deleted');
```

**Why use `access()`?**
The unchecked use of `tabindex` by development teams can lead to:
- Inefficient and cluttered code
- Unintended consequences, including accessibility issues

As a best practice, teams should avoid hardcoding tabindex attributes, and instead use `access()` for focus management.

#### What is focus management?

Focus management is act of placing keyboard focus on a DOM element for the purpose of improving the accessible experience. Generally, focus should be left alone for the user to manage via their own actions. In some cases though, typically due to dynamic UI updates, focus can be lost and must be placed on another element in order to avoid the loss of focus. Placing focus on a non-focusable element (e.g. a heading) is not possible - unless it has a `tabindex`. A more efficient and flexible solution is to dynamically place focus using `access()`. `access()` works by dynamically adding a `tabindex="-1"` to the traget element, then calling `focus()` on that element. Once the user moves focus away, the `tabindex` attribute is removed (or restored to it's original state).

#### Use Cases

Certain scenarios merit focus management:
- Deletion: If an item is deleted via a delete button, and the delete button is removed from the UI, focus can be placed on a nearby heading.

---

### `announce(message, manners?)`

Announce any message to screen readers users

**Parameters:**
- `message: string` - The message to announce. Inserted as text, so markup in the string is read literally rather than rendered — safe to pass user- or server-supplied content.
- `manners?: 'polite' | 'assertive'` - Announcement priority (default: 'polite')

**Returns:** `HTMLElement` - The announcer element

**Behavior:**
- Creates or reuses a single `#announce-this` element
- Temporarily sets `aria-live="off"` then back to specified value for reliable announcements
- Automatically clears announcements after 500ms
- Delays the **first** announcement of a page session by 100ms, so the live
  region is registered in the accessibility tree before it is written to.
  Without that wait the first announcement is silently dropped. Every later
  call writes immediately. If several announcements are made before the region
  registers, the most recent one is spoken.
- Appends a non-breaking space to every other repeat of the same message.
  Screen readers suppress text they have just spoken, so announcing an
  identical string twice is otherwise silent even after the region has emptied
  itself. The character is not spoken; it only makes consecutive announcements
  textually distinct. `announce()` returns the region, so note that its
  `textContent` may carry that trailing character — compare with `.trim()` if
  you assert on it.
- Cancels previous announcements when new ones are made

**Example:**
```typescript
// Polite announcement (won't interrupt screen reader)
announce('Form saved successfully');

// Assertive announcement (interrupts current speech)
announce('Error: Please correct the highlighted fields', 'assertive');

// Chained announcements (cancels previous)
announce('Loading...', 'polite');
// Later...
announce('Content loaded', 'polite');
```

**Why use `announce()`?**
Multiple live regions create debugging complexity and conflicts. A single, managed live region with the `announce()` function is more reliable and maintainable.

---

### `ariaHide(parent?)` and `ariaUnhide(parent?)`

Manage ARIA visibility to hide/show content from assistive technology.

**Parameters:**
- `parent?: HTMLElement` - Element to hide/unhide (default: `document.body`)

**`ariaHide()` Behavior:**
- Sets `aria-hidden="true"` on the parent element
- Finds all focusable elements and sets `tabindex="-1"`
- Preserves original tabindex values in `data-ogti` attributes
- Skips processing if parent already has a hidden ancestor

**`ariaUnhide()` Behavior:**
- Removes `aria-hidden` attribute from parent
- Restores original tabindex values from `data-ogti` attributes
- Removes temporary `data-ogti` attributes

**Example:**
```typescript
const modal = document.querySelector('#modal')!;
const sidebar = document.querySelector('#sidebar')!;

// Hide sidebar when modal opens
ariaHide(sidebar);

// Show sidebar when modal closes  
ariaUnhide(sidebar);

```

**Hiding the page behind a modal**

Hide the content *beside* the dialog, not a common ancestor of both. Calling
`ariaHide(document.body)` hides the dialog along with everything else, which is
the opposite of the intent. Current versions of Chrome also refuse to apply
`aria-hidden` to an element containing the focused element, and log a console
warning, so the pattern misbehaves as soon as focus moves into the dialog.

```html
<body>
  <div id="app"><!-- page content --></div>
  <div id="modal-root"><!-- dialog renders here --></div>
</body>
```

```typescript
// Open
ariaHide(document.querySelector('#app')!);

// Close
ariaUnhide(document.querySelector('#app')!);
```

**When not to reach for `ariaHide()`**

For most modal dialogs in 2026, `<dialog>.showModal()` is the better answer: the
browser makes the rest of the page inert for you, with no bookkeeping and no
attribute to remember to remove. Reach for `ariaHide()` when you need to hide a
region that isn't a modal, or when you can't use a native dialog.

Note also that `ariaHide()` takes a one-time snapshot of the focusable elements
in the subtree. Anything rendered into that subtree afterwards stays in the tab
order, and elements inside shadow roots are not traversed.

**Why use `ariaHide()`/`ariaUnhide()`?**
Properly managing ARIA states and focus trapping requires careful coordination of multiple attributes. These functions handle the complexity automatically and reversibly.

---

### `prefersReducedMotion()`

A utility function that 1) toggles a CSS class (`prm`) on the body tag based on the system's reduced motion setting, and 2) returns the the current reduced motion setting's value. The function also creates a change event listener that updates the `prm` class dynamically.

**Type:** `() => boolean`

**Behavior:**
- SSR-safe with lazy initialization (only accesses `window` when first called)
- Returns current value based on `(prefers-reduced-motion: reduce)` media query
- Adds/removes `prm` class on `document.body`
- Automatically updates when user changes system preferences

**Example:**
```typescript
// Check preference
if (prefersReducedMotion()) {
  // Skip or reduce animations
  element.style.transition = 'none';
} else {
  // Use full animations
  element.style.transition = 'transform 0.3s ease';
}

// Or use CSS with the body class
// NOTE: the .prm class won't be added until prefersReducedMotion() is called, preferably on DOMContentLoaded

// Initialize when DOM is ready to enable the CSS approach
document.addEventListener('DOMContentLoaded', () => {
  prefersReducedMotion();
});

/* In CSS, create your animations: */
.animated {
  transition: transform 0.3s ease;
}

/* ...and reset/disable them when the .prm class is present: */
body.prm .animated {
  transition: none;
}

```

**Why use `prefersReducedMotion()`?**
Respecting user motion preferences is crucial for accessibility, particularly for users with vestibular disorders. This provides an easy, SSR-safe way to conditionally disable animations.

---

### `watchReducedMotion(options?)`

The side effect half of `prefersReducedMotion()`, separated so it can be opted
into, configured, and torn down.

**Parameters:**
- `options?.className?: string` - Class to toggle. Defaults to `prm`.
- `options?.target?: HTMLElement` - Element to toggle it on. Defaults to `document.body`.

**Returns:** `() => void` - Stops watching and removes the class.

**Example:**
```typescript
const stop = watchReducedMotion();

// In a single-page app or a test, release it when you are done:
stop();
```

```typescript
// Avoid a collision, or mark something other than the body
const stop = watchReducedMotion({
  className: 'reduce-motion',
  target: document.querySelector('#app')!
});
```

**Why this exists alongside `prefersReducedMotion()`:**
`prefersReducedMotion()` reads like a getter but also mutates the DOM and
registers a listener that can never be removed — awkward in single-page apps,
tests, and hot reload. `watchReducedMotion()` makes the side effects explicit
and reversible. Calling it before `document.body` exists is safe: the class is
applied once the document is ready rather than being silently skipped.

`prefersReducedMotion()` keeps its current behavior through 1.x, so nothing
breaks. New code should prefer the pair: `prefersReducedMotion()` when you just
need the value, `watchReducedMotion()` when you want the class.

**When you need neither:** CSS `@media (prefers-reduced-motion: reduce)` handles
the majority of cases with no JavaScript at all. The class is for when you need
to branch in JS, or want to avoid repeating the media query across many rules.

## Development

### Building the Project

```bash
# Install dependencies
npm install

# Run tests (required before build)
npm test

# Build all formats
npm run build

# Build without tests
npm run build:only

# Watch mode for development
npm run build:watch
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI mode (coverage + no watch)
npm run test:ci
```

The test suite includes:
- **140 tests** covering all functions
- **DOM manipulation testing** with jsdom
- **Focus management and event handling**
- **Accessibility-specific assertions**
- **Edge case handling** (missing elements, no parent nodes, etc.)
- **100% statement coverage**

#### Screen reader testing

jsdom verifies DOM state, not what a screen reader says. Behavior that only
assistive technology can confirm — whether the first announcement of a page
session is spoken, whether `polite` waits its turn, whether hidden content is
genuinely unreachable — is covered by a manual harness:

```bash
npm run test:manual   # builds, serves, and opens the harness
```

The server binds all interfaces so a Windows VM or a second machine can reach
it for NVDA and JAWS testing; the banner prints the address. Use
`-- --host 127.0.0.1` to keep it local.

Each case states what to do, what you should hear, and what specifically counts
as a failure, and the results export as a markdown table. See
[`test-manual/README.md`](test-manual/README.md).

### Project Structure

```
src/
├── access.ts              # Focus management
├── announce.ts            # Screen reader announcements
├── aria-hide.ts           # ARIA state management
├── prefers-reduced-motion.ts # Motion preference detection
├── tabindex-utils.ts      # Shared tabindex bookkeeping
└── index.ts               # Main exports

scripts/
└── serve-harness.mjs      # Dependency-free server for the manual harness

tests/
├── access.test.ts         # Focus management tests
├── announce.test.ts       # Announcement tests
├── aria-hide.test.ts      # ARIA state tests
├── prefers-reduced-motion.test.ts # Motion preference tests
├── harness-sync.test.ts   # Fails if an export has no manual test case
├── harness-smoke.test.ts  # Checks the manual harness drives the real bundle
└── setup.ts               # Test configuration

test-manual/               # Manual screen reader harness
├── index.html             # Test cases, run against dist/
└── README.md              # How to run it, and what to record

dist/                      # Built files
├── a11ykit.esm.js        # ES Module (modern)
├── a11ykit.umd.js        # UMD (browser compatible)
├── a11ykit.umd.min.js    # Minified UMD  
└── types/                # TypeScript definitions
```

## Browser Support

- **ES Module builds**: Modern browsers with ES2020+ support (Chrome 80, Safari 13.1, Firefox 74 and later)
- **UMD builds**: All browsers supporting ES5+ (IE11+)
- **TypeScript**: Full type definitions included
- **Source maps**: Available for all builds

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes with tests: `npm test`
4. Build the project: `npm run build`  
5. Submit a pull request

## License

MIT © Patrick Fox