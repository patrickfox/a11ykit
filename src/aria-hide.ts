/**
 * Marks an element whose `inert` we set ourselves, so `ariaUnhide()` never
 * clears an `inert` the caller put there for their own reasons.
 */
const INERT_MARKER = 'data-a11ykit-inert';

/**
 * Whether the browser enforces `inert` itself.
 *
 * Detected on the prototype rather than by setting the attribute, because a
 * browser without support accepts the attribute silently and does nothing with
 * it — which would look like success while leaving the subtree fully reachable.
 */
const supportsInert = (): boolean =>
  typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;

let warnedAboutInert = false;

const warnUnsupported = (): void => {
  if (warnedAboutInert) {
    return;
  }
  warnedAboutInert = true;
  // Once, not per call. Failing silently is the worst outcome for a function
  // whose job is to hide content from assistive technology, and 1.1.x is a
  // supported answer rather than a dead end.
  console.warn('a11ykit: ariaHide() needs inert, which this browser lacks. Use 1.1.x to support it.');
};

/**
 * Hides a subtree from assistive technology and removes it from the tab order.
 *
 * Built on native `inert`, which the browser enforces continuously: content
 * rendered into the subtree after this returns is covered automatically, and
 * shadow roots are included.
 *
 * **This does not set `aria-hidden="true"`.** `inert` removes the subtree from
 * the accessibility tree without an observable attribute, so assertions on
 * `aria-hidden` need updating. See the 2.0 migration notes in the README.
 *
 * **Requires `inert`** — Chrome 102, Firefox 112, Safari 15.5 and later. On an
 * older browser this warns once and does nothing; `1.1.x` still ships the
 * `aria-hidden` plus `tabindex` implementation if you need to support them.
 *
 * An element that is already `inert` is left alone, and `ariaUnhide()` will not
 * clear it — only `inert` set by this function is reversed.
 */
export const ariaHide = (parent?: HTMLElement): void => {
  const target = parent || document.body;

  if (!supportsInert()) {
    warnUnsupported();
    return;
  }

  if (!target.inert) {
    // The attribute rather than the property: identical in the browser, and
    // observable in environments that reflect attributes without implementing
    // the behaviour.
    target.setAttribute('inert', '');
    target.setAttribute(INERT_MARKER, '');
  }
};

/**
 * Reverses `ariaHide()`.
 *
 * Clears `inert` only if this library set it, so an `inert` the caller applied
 * for their own reasons is left alone.
 */
export const ariaUnhide = (parent?: HTMLElement): void => {
  const target = parent || document.body;

  if (target.hasAttribute(INERT_MARKER)) {
    target.removeAttribute('inert');
    target.removeAttribute(INERT_MARKER);
  }
};
