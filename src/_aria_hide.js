const ariaHide = function(parent) {
  parent = parent? parent : document.body;
  parent.setAttribute('aria-hidden', 'true');

  const hasHiddenParent = parent.closest('[aria-hidden="true"]') !== null;

  if (hasHiddenParent) {
    return;
  }

  const focusableElements = parent.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

  for (let i = 0; i < focusableElements.length; i++) {
    const el = focusableElements[i];
    el.setAttribute('data-ogti', el.getAttribute('tabindex') || '');
    el.setAttribute('tabindex', '-1');
  }
};

const ariaUnhide = function(parent) {
  parent = parent? parent : document.body;
  parent.removeAttribute('aria-hidden');

  const elsToRevert = parent.querySelectorAll('[data-ogti]');

  for (let i = 0; i < elsToRevert.length; i++) {
    const el = elsToRevert[i];
    const elOgti = el.getAttribute('data-ogti');
    if (elOgti.length === 0) {
      el.removeAttribute('tabindex');
    } else {
      el.setAttribute('tabindex', elOgti);
    }
    el.removeAttribute('data-ogti');
  }
};

export {ariaHide, ariaUnhide};