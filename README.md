# A11yKit

[![npm version](https://img.shields.io/npm/v/@a11yfox/a11ykit.svg)](https://www.npmjs.com/package/@a11yfox/a11ykit)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@a11yfox/a11ykit)](https://bundlephobia.com/package/@a11yfox/a11ykit)
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
- ✅ **Well Tested** - Comprehensive Jest test suite with 97%+ coverage

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
import { access, announce, ariaHide, ariaUnhide, prefersReducedMotion } from '@a11yfox/a11ykit';
```

## API Reference

### `access(element, placeFocusBefore?)`

Dynamically place focus on any element without hardcoded tabindex attributes.

**Parameters:**
- `element: HTMLElement` - The element to receive focus
- `placeFocusBefore?: string` - Optional. If `true`, creates a visually hidden span before the element and places focus on that element instead. If a string, uses that as the span's content.

**Behavior:**
- Places focus on the target element
  - If a string message is provided as a second parameter, the script will create a temporary, non-visible element that contains the message.
- Screen readers will read the contents of the target element
- Automatically cleans up on blur, and restores any original tabindex state

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
- `message: string` - The message to announce
- `manners?: 'polite' | 'assertive'` - Announcement priority (default: 'polite')

**Returns:** `HTMLElement` - The announcer element

**Behavior:**
- Creates or reuses a single `#announce-this` element
- Temporarily sets `aria-live="off"` then back to specified value for reliable announcements
- Automatically clears announcements after 500ms
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

// Hide everything (common for modals)
ariaHide(document.body);
// Don't forget to unhide when modal closes
ariaUnhide(document.body);
```

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
// NOTE: the .prm class won't be added until prefersReducedMotion() is called
/* In CSS */
.animated {
  transition: transform 0.3s ease;
}

body.prm .animated {
  transition: none;
}
```

**Why use `prefersReducedMotion()`?**
Respecting user motion preferences is crucial for accessibility, particularly for users with vestibular disorders. This provides an easy, SSR-safe way to conditionally disable animations.

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
- **64 comprehensive tests** covering all functions
- **DOM manipulation testing** with jsdom
- **Focus management and event handling**
- **Accessibility-specific assertions**
- **Edge case handling** (missing elements, no parent nodes, etc.)
- **97%+ code coverage**

### Project Structure

```
src/
├── access.ts              # Focus management
├── announce.ts            # Screen reader announcements  
├── aria-hide.ts           # ARIA state management
├── prefers-reduced-motion.ts # Motion preference detection
└── index.ts               # Main exports

tests/
├── access.test.ts         # Focus management tests
├── announce.test.ts       # Announcement tests
├── aria-hide.test.ts      # ARIA state tests
├── prefers-reduced-motion.test.ts # Motion preference tests
└── setup.ts               # Test configuration

dist/                      # Built files
├── a11ykit.esm.js        # ES Module (modern)
├── a11ykit.umd.js        # UMD (browser compatible)
├── a11ykit.umd.min.js    # Minified UMD  
└── types/                # TypeScript definitions
```

## Browser Support

- **ES Module builds**: Modern browsers with ES2018+ support
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