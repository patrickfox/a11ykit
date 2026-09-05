import { setTemporaryTabindex, restoreOriginalTabindex } from './tabindex-utils';

export interface AccessOptions {
  /**
   * Focus without scrolling the element into view. Useful when the caller has
   * already positioned the viewport, or is managing focus off-screen.
   */
  preventScroll?: boolean;
}

const TEMP_EL_STYLE =
  'position: absolute;height: 1px;width: 1px;margin: -1px;padding: 0;overflow: hidden;clip: rect(0 0 0 0);border: 0;';

/**
 * Elements the browser already puts in the tab order. Disabled controls and
 * hidden inputs are excluded because they cannot take focus, so they still
 * need the tabindex treatment to be reachable.
 */
const NATIVELY_FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'summary',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])'
].join(', ');

const isNativelyFocusable = (el: HTMLElement): boolean => {
  if (typeof el.matches !== 'function') {
    return false;
  }
  try {
    return el.matches(NATIVELY_FOCUSABLE);
  } catch {
    // A selector this old engine cannot parse should fall back to the
    // tabindex path rather than throwing out of a focus call.
    return false;
  }
};

/**
 * Moves focus to an element without leaving hardcoded tabindex attributes
 * behind.
 *
 * @param el The element to receive focus.
 * @param placeFocusBefore Optional message. When given, a visually hidden span
 *   is inserted before the element and focused instead, so the message is read
 *   before the element's own content. Passing `true` rather than a string
 *   inserts an empty span that announces nothing; that form is deprecated and
 *   the type will narrow to `string` in 2.0.
 * @param options Focus options.
 * @returns The element that actually received focus — the target itself, or
 *   the temporary span when `placeFocusBefore` was used.
 */
export const access = (
  el: HTMLElement,
  placeFocusBefore?: string | boolean,
  options?: AccessOptions
): HTMLElement => {
  const focusOptions: FocusOptions | undefined =
    options && options.preventScroll ? { preventScroll: true } : undefined;

  // An element the browser already focuses needs no bookkeeping. Writing
  // tabindex="-1" onto it would pull it out of the tab order for as long as it
  // held focus, and leave a data-ogti attribute that never needed to exist.
  if (!placeFocusBefore && isNativelyFocusable(el)) {
    el.focus(focusOptions);
    return el;
  }

  let focusMethod: () => void;
  let tempEl: HTMLElement | undefined;

  const onBlurEl = (): void => {
    restoreOriginalTabindex(el);
    el.removeEventListener('focusout', focusMethod);
  };

  const onBlurTempEl = (): void => {
    if (tempEl && tempEl.parentNode) {
      tempEl.removeEventListener('focusout', focusMethod);
      tempEl.parentNode.removeChild(tempEl);
    }
  };

  const focusEl = (target: HTMLElement): void => {
    setTemporaryTabindex(target, '-1');
    target.addEventListener('focusout', focusMethod);
    target.focus(focusOptions);
  };

  focusMethod = onBlurEl;

  if (placeFocusBefore) {
    tempEl = document.createElement('span');
    if (typeof placeFocusBefore === 'string') {
      tempEl.textContent = placeFocusBefore;
    }
    tempEl.setAttribute('style', TEMP_EL_STYLE);

    if (el.parentNode) {
      tempEl = el.parentNode.insertBefore(tempEl, el) as HTMLElement;
      focusMethod = onBlurTempEl;
      focusEl(tempEl);
      return tempEl;
    }

    // No parent node, fall back to focusing the element directly
    focusMethod = onBlurEl;
    focusEl(el);
    return el;
  }

  focusEl(el);
  return el;
};
