import { setTemporaryTabindex, restoreOriginalTabindex, hasStoredTabindex } from './tabindex-utils';

export const ariaHide = (parent?: HTMLElement): void => {
  const targetParent = parent || document.body;

  // An element with no parent cannot have a hidden ancestor. Comparing with
  // `!== null` treated the `undefined` from optional chaining as a match and
  // skipped the tabindex work entirely for detached elements.
  const hasHiddenParent = Boolean(targetParent.parentElement?.closest('[aria-hidden="true"]'));

  targetParent.setAttribute('aria-hidden', 'true');

  if (hasHiddenParent) {
    return;
  }

  const focusableElements = targetParent.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

  for (let i = 0; i < focusableElements.length; i++) {
    const el = focusableElements[i] as HTMLElement;
    setTemporaryTabindex(el, '-1');
  }
};

export const ariaUnhide = (parent?: HTMLElement): void => {
  const targetParent = parent || document.body;
  targetParent.removeAttribute('aria-hidden');

  const elsToRevert = targetParent.querySelectorAll('[data-ogti]');

  for (let i = 0; i < elsToRevert.length; i++) {
    const el = elsToRevert[i] as HTMLElement;
    if (hasStoredTabindex(el)) {
      restoreOriginalTabindex(el);
    }
  }
};