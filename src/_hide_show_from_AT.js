const hideFromAT = function(el){
  const { body } = document;
  let currentEl = el;

  // If there are any nodes with oldAriaHiddenVal set, we should
  // bail, since it has already been done.
  const hiddenEl = document.querySelector(`[${this.oldAriaHiddenVal}]`);

  if (hiddenEl !== null) {
    // eslint-disable-next-line no-console
    console.warn('Attempted to run hideFromAT() twice in a row.  unhideFromAT() must be executed before it run again.');
    return;
  }
  do {
    const siblings = currentEl.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling !== currentEl && sibling.setAttribute) {
        sibling.setAttribute(this.oldAriaHiddenVal, sibling.ariaHidden || 'null');
        sibling.setAttribute('aria-hidden', 'true');
      }
    }
    currentEl = currentEl.parentNode;
  } while (currentEl !== body);
};

const unhideFromAT = function() {
  const elsToReset = document.querySelectorAll(`[${this.oldAriaHiddenVal}]`);

  for (let i = 0; i < elsToReset.length; i++) {
    const el = elsToReset[i];
    const ariaHiddenVal = el.getAttribute(this.oldAriaHiddenVal);
    if (ariaHiddenVal === 'null') {
      el.removeAttribute('aria-hidden');
    } else {
      el.setAttribute('aria-hidden', ariaHiddenVal);
    }
    el.removeAttribute(this.oldAriaHiddenVal);
  }
};