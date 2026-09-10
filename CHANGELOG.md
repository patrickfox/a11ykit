# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — 2026-09-10

### ⚠️ Breaking

**`ariaHide()` no longer sets `aria-hidden="true"`** in browsers that support
`inert`. It sets the `inert` attribute instead, which removes the subtree from
the accessibility tree and the tab order in one step. The API is unchanged —
same functions, same arguments — but assertions and CSS selectors targeting
`aria-hidden` need updating. See [Migrating to 2.0](README.md#migrating-to-20).

Browsers without `inert` (pre Chrome 102 / Firefox 112 / Safari 15.5) fall back
to the 1.x implementation automatically.

### Fixed

- Announcing the same message twice in a row was silent. Screen readers
  suppress text they have just spoken, independently of the DOM — the region
  empties itself after 500ms, so the second write is a genuine change and was
  dropped anyway. `announce()` now appends a non-breaking space to every other
  repeat, which is not spoken but makes consecutive announcements textually
  distinct. Measured on VoiceOver: rewriting the string, emptying and rewriting
  it on a later task, cycling `aria-live`, and replacing the child node were
  all silent; a zero-width space was silent too, being stripped from the
  accessible name.
## [1.1.1] — 2026-09-10

The final 1.x release. Backports the repeated-announcement fix from 2.0 so it is
available without the breaking `inert` change. Nothing else differs from 1.1.0.

### Fixed

- Announcing the same message twice in a row was silent. Screen readers suppress
  text they have just spoken, independently of the DOM — the region empties
  itself after 500ms, so the second write is a genuine change and was dropped
  anyway. `announce()` now appends a non-breaking space to every other repeat,
  which is not spoken but makes consecutive announcements textually distinct.

  Measured on VoiceOver: rewriting the string, emptying and rewriting it on a
  later task, cycling `aria-live`, and replacing the child node were all silent.
  A zero-width space was silent too, being stripped from the accessible name.

  `announce()` returns the live region, so its `textContent` may carry that
  trailing character. Compare with `.trim()` if you assert on it.

### Changed

- `ariaHide()` and `ariaUnhide()` are built on native `inert` ([#16]). This
  fixes two limitations that could not be solved in the previous approach:
  - Content rendered into the subtree **after** `ariaHide()` was called stayed
    fully tabbable while sitting under `aria-hidden="true"`. Async-rendered
    modal content hit this routinely. The browser now enforces `inert`
    continuously.
  - `querySelectorAll` does not descend into shadow roots, so web components
    kept their focusable children in the tab order. Shadow DOM is now covered.
- `ariaHide()` writes no `tabindex` or `data-ogti` on descendants. There is no
  bookkeeping to corrupt.
- An element that is already `inert` is left alone, and `ariaUnhide()` clears
  `inert` only when `ariaHide()` set it.

### Note for jsdom users

jsdom does not implement `inert` — the property is absent from
`HTMLElement.prototype` — so the library detects no support and takes the 1.x
fallback path there. Existing `aria-hidden` assertions will keep passing in
jsdom, which means jsdom cannot tell you whether your app is correct in a real
browser. This library's own suite shims the property to test both paths.
### Upgrading

Staying on 1.x is fine — pin `"^1.1.1"`. 2.0 changes `ariaHide()` to use native
`inert`, which fixes limitations that cannot be addressed in the 1.x approach
(content added after hiding, and shadow DOM), but changes what it writes to the
DOM. See [Migrating to 2.0](README.md#migrating-to-20) if you want those fixes.

## [1.1.0] — 2026-09-05

### ⚠️ Behaviour changes

Neither is an API break, but both are visible to existing consumers.

- **`announce()` defers its first message by 100ms.** The first announcement of
  a page session was previously dropped silently by screen readers; it now waits
  for the live region to register in the accessibility tree. Every later call is
  synchronous. Tests that assert synchronously on a first announcement will need
  to await it.
- **`announce()` and `access()` use `textContent` instead of `innerHTML`.**
  Markup passed as a message is now read as literal text rather than rendered.

### Fixed

- Nested `ariaHide()` permanently removed elements from the tab order. The
  tabindex backup was written unconditionally, so a second hide over an
  already-hidden element stored the temporary `-1` instead of the original
  value. The backup is now write-once. ([#12])
- `ariaHide()` silently skipped detached elements. An inverted null check
  treated an element with no parent as already hidden, so `aria-hidden` was set
  while every focusable child stayed tabbable. ([#13])
- `announce()` and `access()` assigned caller-supplied strings to `innerHTML`.
  ([#14])
- The first `announce()` of a page session was silently dropped. Screen readers
  only announce mutations to a live region already present in the accessibility
  tree; creating and populating it in one task is an insertion, not a change.
  ([#15])
- `prefersReducedMotion()` threw when `document.body` or `matchMedia` was
  absent. ([#19])

### Added

- `watchReducedMotion(options?)` — the side effect half of
  `prefersReducedMotion()`, separated so it can be configured and torn down.
  Returns a function that removes both the listener and the class. ([#19])
- `access()` accepts an options argument with `preventScroll`, and returns the
  element that actually received focus. ([#20])
- A manual screen reader test harness under `test-manual/`, for behaviour jsdom
  cannot observe. Run with `npm run test:manual`.

### Changed

- `access()` no longer round-trips tabindex on natively focusable elements.
  `access(someButton)` used to write `tabindex="-1"` onto an element the browser
  already focuses, removing it from the tab order for as long as it held focus.
  ([#20])
- The ESM build targets ES2020 (Chrome 80, Safari 13.1, Firefox 74 and later) so
  optional chaining is emitted natively. The UMD build stays at ES5.

### Packaging

- `sideEffects: false`, so bundlers can drop unused exports. A consumer
  importing only `announce()` ships roughly 445 gzipped bytes rather than the
  whole library. ([#21])
- `unpkg` and `jsdelivr` fields, so the bare CDN URL serves the minified UMD
  build rather than the unminified one. ([#21])
- `./dist/*` and `./package.json` subpath exports. Deep imports previously
  failed with `ERR_PACKAGE_PATH_NOT_EXPORTED`. ([#21])
- rollup 2 → 4 and `@rollup/plugin-terser` 0.4 → 1. Dev-dependency advisories
  go from 12 to 0.

### Documentation

- Corrected the `ariaHide(document.body)` modal example, which hid the dialog
  along with everything else. Current Chrome also refuses to apply `aria-hidden`
  to an ancestor of the focused element. ([#17])
- Added a no-build / CDN section. The UMD global name (`A11yKit`) was not
  documented anywhere. ([#18])

### On the 100ms delay

Measured across three screen reader and engine pairings rather than guessed:

| | Chromium macOS / VO | WebKit macOS / VO | Chrome Win 11 / NVDA |
|---|---|---|---|
| one animation frame | silent | silent | silent |
| two animation frames | spoke | spoke | spoke |
| next macrotask (0ms) | spoke | **silent** | spoke |
| 100ms | spoke | spoke | spoke |

WebKit is the outlier — `setTimeout(0)` would have looked correct on two of the
three pairings and been broken in Safari. `requestAnimationFrame` works
everywhere but is paused in background tabs, where an announcement could never
fire at all. JAWS is not yet tested.

## [1.0.5] — 2026-02-05

- Updated the bundle size badge from bundlephobia.com to bundlejs.com.

## [1.0.4] — 2026-01-14

- `prefersReducedMotion` changed from an auto-initialized boolean to a
  `prefersReducedMotion()` function that must be called explicitly, preferably
  on `DOMContentLoaded`.

## [1.0.3] — 2025-10-05

- Added the missing visually hidden styles for the announcer.
- `announce()` now accepts only `polite` or `assertive`, defaulting to `polite`
  for a missing or invalid value.
- README updates.

## [1.0.2] — 2025-10-02

- Converted the library to TypeScript.
- Split into modules and added a rollup build.
- Added automated testing.

[2.0.0]: https://github.com/patrickfox/a11ykit/releases/tag/v2.0.0
[1.1.1]: https://github.com/patrickfox/a11ykit/releases/tag/v1.1.1
[1.1.0]: https://github.com/patrickfox/a11ykit/releases/tag/v1.1.0
[1.0.5]: https://github.com/patrickfox/a11ykit/releases/tag/v1.0.5
[1.0.4]: https://github.com/patrickfox/a11ykit/releases/tag/v1.0.4
[1.0.3]: https://github.com/patrickfox/a11ykit/releases/tag/v1.0.3
[1.0.2]: https://github.com/patrickfox/a11ykit/releases/tag/v1.0.2
[#12]: https://github.com/patrickfox/a11ykit/issues/12
[#16]: https://github.com/patrickfox/a11ykit/issues/16
[#13]: https://github.com/patrickfox/a11ykit/issues/13
[#14]: https://github.com/patrickfox/a11ykit/issues/14
[#15]: https://github.com/patrickfox/a11ykit/issues/15
[#17]: https://github.com/patrickfox/a11ykit/issues/17
[#18]: https://github.com/patrickfox/a11ykit/issues/18
[#19]: https://github.com/patrickfox/a11ykit/issues/19
[#20]: https://github.com/patrickfox/a11ykit/issues/20
[#21]: https://github.com/patrickfox/a11ykit/issues/21
