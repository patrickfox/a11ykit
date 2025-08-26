export const ariaHide = (parent?: HTMLElement): void => {
  const targetParent = parent || document.body;

  const hasHiddenParent = targetParent.parentElement?.closest('[aria-hidden="true"]') !== null;

  targetParent.setAttribute('aria-hidden', 'true');

  if (hasHiddenParent) {
    return;
  }

  const focusableElements = targetParent.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

  for (let i = 0; i < focusableElements.length; i++) {
    const el = focusableElements[i] as HTMLElement;
    el.setAttribute('data-ogti', el.getAttribute('tabindex') || '');
    el.setAttribute('tabindex', '-1');
  }
};

export const ariaUnhide = (parent?: HTMLElement): void => {
  const targetParent = parent || document.body;
  targetParent.removeAttribute('aria-hidden');

  const elsToRevert = targetParent.querySelectorAll('[data-ogti]');

  for (let i = 0; i < elsToRevert.length; i++) {
    const el = elsToRevert[i] as HTMLElement;
    const elOgti = el.getAttribute('data-ogti');
    if (elOgti?.length === 0) {
      el.removeAttribute('tabindex');
    } else if (elOgti) {
      el.setAttribute('tabindex', elOgti);
    }
    el.removeAttribute('data-ogti');
  }
};