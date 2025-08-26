# A11yKit

## Essential TypeScript utilities that empower modern accessibility

A11yKit is a lightweight, TypeScript-first accessibility library that provides essential utilities for managing focus, screen reader announcements, ARIA states, and motion preferences. Built with modern web development in mind, it offers a clean API with full type safety and comprehensive browser support.

## Features

- 🎯 **Focus Management** - Dynamically focus any element without hardcoded tabindex
- 📢 **Screen Reader Announcements** - Reliable ARIA live region management  
- 🔒 **ARIA State Management** - Hide/show content from assistive technology
- 🎨 **Motion Preferences** - Detect and respond to `prefers-reduced-motion`
- 📦 **TypeScript First** - Full type definitions included
- 🌐 **Browser Compatible** - Works in all modern browsers (ES5+ UMD builds)
- ⚡ **Lightweight** - Minimal footprint, no dependencies
- ✅ **Well Tested** - Comprehensive Jest test suite with 97%+ coverage

## Installation

### NPM

```bash
npm install a11ykit
```

### CDN

```html
<!-- ES Module -->
<script type="module">
  import { access, announce, ariaHide, ariaUnhide, prefersReducedMotion } from 'https://unpkg.com/a11ykit/dist/a11ykit.esm.js';
</script>

<!-- UMD (Browser Global) -->
<script src="https://unpkg.com/a11ykit/dist/a11ykit.umd.min.js"></script>
<script>
  const { access, announce, ariaHide, ariaUnhide, prefersReducedMotion } = A11yKit;
</script>
```

## Usage

### ES Modules

```typescript
import { access, announce, ariaHide, ariaUnhide, prefersReducedMotion } from 'a11ykit';

// Focus management
const button = document.querySelector('button')!;
access(button);

// Screen reader announcements
announce('Your changes have been saved', 'polite');

// Hide content from screen readers
const modal = document.querySelector('#modal')!;
ariaHide(document.body); // Hide everything except modal
ariaUnhide(document.body); // Restore visibility

// Check motion preferences
if (prefersReducedMotion) {
  // Skip animations
}
```

### CommonJS

```javascript
const { access, announce, ariaHide, ariaUnhide, prefersReducedMotion } = require('a11ykit');
```

## API Reference

### `access(element, placeFocusBefore?)`

Dynamically focus any element without hardcoded tabindex attributes.

**Parameters:**
- `element: HTMLElement` - The element to receive focus
- `placeFocusBefore?: string | boolean` - Optional. If `true`, creates a visually hidden span before the element and focuses that instead. If a string, uses that as the span's content.

**Behavior:**
- Temporarily adds `tabindex="-1"` to make element focusable
- Automatically cleans up on blur, restoring original tabindex state  
- Preserves existing tabindex values using `data-ogti` attribute
- Handles elements without parent nodes gracefully

**Example:**
```typescript
const heading = document.querySelector('h2')!;

// Focus the heading directly
access(heading);

// Focus with a screen reader announcement
access(heading, 'Skip to main content');

// Focus invisibly before the heading
access(heading, true);
```

**Why use `access()`?**
Hardcoded tabindex values make pages brittle and can cause accessibility issues. The `access()` function provides dynamic focus management without permanent DOM changes.

---

### `announce(message, manners?)`

Announce messages to screen readers via ARIA live regions.

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

### `prefersReducedMotion`

Boolean value indicating user's motion preference.

**Type:** `boolean`

**Behavior:**
- Automatically updates based on `(prefers-reduced-motion: reduce)` media query
- Adds/removes `prm` class on `document.body`  
- Updates when user changes system preferences

**Example:**
```typescript
// Check preference
if (prefersReducedMotion) {
  // Skip or reduce animations
  element.style.transition = 'none';
} else {
  // Use full animations
  element.style.transition = 'transform 0.3s ease';
}

// Or use CSS with the body class
/* In CSS */
.animated {
  transition: transform 0.3s ease;
}

body.prm .animated {
  transition: none;
}
```

**Why use `prefersReducedMotion`?**
Respecting user motion preferences is crucial for accessibility, particularly for users with vestibular disorders. This provides an easy way to conditionally disable animations.

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

---

## Migration from v0.x

The library has been completely rewritten in TypeScript with a modern API:

**Old (jQuery-based):**
```javascript
$(element).access(true);
$.announce('message', 'polite');
```

**New (TypeScript/Vanilla JS):**
```typescript  
import { access, announce } from 'a11ykit';

access(element, true);
announce('message', 'polite');
```

Key changes:
- ✅ TypeScript with full type safety
- ✅ No jQuery dependency  
- ✅ ES modules and tree shaking support
- ✅ Modern build system (Rollup + Jest)
- ✅ Comprehensive test coverage
- ✅ Better browser compatibility