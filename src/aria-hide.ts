import { setTemporaryTabindex, restoreOriginalTabindex, hasStoredTabindex } from './tabindex-utils';

/**
 * Marks an element whose `inert` we set ourselves, so `ariaUnhide()` never
 * clears an `inert` the caller put there for their own reasons.
 */
const INERT_MARKER = 'data-a11ykit-inert';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Whether the browser enforces `inert` itself.
 *
 * Detected on the prototype rather than by setting the attribute, because a
 * browser without support accepts the attribute silently and does nothing with
 * it — which would look like success while leaving the subtree fully reachable.
 */
const supportsInert = (): boolean =>
  typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;

/**
 * The pre-2.0 implementation, kept as the fallback for browsers without
 * `inert`. It is a one-time snapshot: anything added to the subtree afterwards
 * stays in the tab order, and it does not descend into shadow roots. Those are
 * the limitations `inert` exists to remove.
 */
const legacyHide = (target: HTMLElement): void => {
  // An element with no parent cannot have a hidden ancestor. Comparing with
  // `!== null` treated the `undefined` from optional chaining as a match and
  // skipped the tabindex work entirely for detached elements.
  const hasHiddenParent = Boolean(target.parentElement?.closest('[aria-hidden="true"]'));

  target.setAttribute('aria-hidden', 'true');

  if (hasHiddenParent) {
    return;
  }

  const focusableElements = target.querySelectorAll(FOCUSABLE);

  for (let i = 0; i < focusableElements.length; i++) {
    setTemporaryTabindex(focusableElements[i] as HTMLElement, '-1');
  }
};

const legacyUnhide = (target: HTMLElement): void => {
  target.removeAttribute('aria-hidden');

  const elsToRevert = target.querySelectorAll('[data-ogti]');

  for (let i = 0; i < elsToRevert.length; i++) {
    const el = elsToRevert[i] as HTMLElement;
    if (hasStoredTabindex(el)) {
      restoreOriginalTabindex(el);
    }
  }
};

/**
 * Hides a subtree from assistive technology and removes it from the tab order.
 *
 * Where `inert` is supported — every major browser since 2023 — the browser
 * enforces this continuously: content rendered into the subtree afterwards is
 * covered automatically, and shadow roots are included. Neither was true of the
 * previous implementation, which took a one-time snapshot of the focusable
 * elements it could see.
 *
 * **This no longer sets `aria-hidden="true"`.** `inert` removes the subtree
 * from the accessibility tree without an observable attribute, so assertions on
 * `aria-hidden` need updating. See the 2.0 migration notes in the README.
 *
 * An element that is already `inert` is left alone, and `ariaUnhide()` will not
 * clear it — only `inert` set by this function is reversed.
 */
export const ariaHide = (parent?: HTMLElement): void => {
  const target = parent || document.body;

  if (supportsInert()) {
    if (!target.inert) {
      // The attribute rather than the property: identical in the browser, and
      // observable in environments that reflect attributes without
      // implementing the behaviour.
      target.setAttribute('inert', '');
      target.setAttribute(INERT_MARKER, '');
    }
    return;
  }

  legacyHide(target);
};

/**
 * Reverses `ariaHide()`.
 *
 * Clears `inert` only if this library set it, and always runs the pre-2.0
 * restore as well, so a subtree hidden by the fallback path — or by an older
 * version of the library still in the page — is cleaned up either way.
 */
export const ariaUnhide = (parent?: HTMLElement): void => {
  const target = parent || document.body;

  if (target.hasAttribute(INERT_MARKER)) {
    target.removeAttribute('inert');
    target.removeAttribute(INERT_MARKER);
  }

  legacyUnhide(target);
};
