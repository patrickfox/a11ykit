export const access = (el: HTMLElement, placeFocusBefore?: string | boolean): void => {
  let focusEl: (element: HTMLElement) => void;
  let focusMethod: () => void;
  let ogti: string | null;
  let tempEl: HTMLElement | undefined;

  const onBlurEl = (): void => {
    if (el.getAttribute('data-ogti')) {
      el.setAttribute('tabindex', ogti || '');
    } else {
      el.removeAttribute('tabindex');
    }
    el.removeAttribute('data-ogti');
    el.removeEventListener('focusout', focusMethod);
  };

  const onBlurTempEl = (): void => {
    if (tempEl && tempEl.parentNode) {
      tempEl.removeEventListener('focusout', focusMethod);
      tempEl.parentNode.removeChild(tempEl);
    }
  };

  focusEl = (theEl: HTMLElement): void => {
    theEl.setAttribute('tabindex', '-1');
    theEl.addEventListener('focusout', focusMethod);
    theEl.focus();
  };

  focusMethod = onBlurEl;
  
  if (placeFocusBefore) {
    tempEl = document.createElement('span');
    if (typeof placeFocusBefore === 'string') {
      tempEl.innerHTML = placeFocusBefore;
    }
    tempEl.setAttribute('style', 'position: absolute;height: 1px;width: 1px;margin: -1px;padding: 0;overflow: hidden;clip: rect(0 0 0 0);border: 0;');
    if (el.parentNode) {
      tempEl = el.parentNode.insertBefore(tempEl, el) as HTMLElement;
      focusMethod = onBlurTempEl;
      focusEl(tempEl);
    } else {
      // No parent node, fall back to focusing the element directly
      ogti = el.getAttribute('tabindex'); 
      if (ogti) { 
        el.setAttribute('data-ogti', ogti); 
      }
      focusEl(el);
    }
  } else {
    ogti = el.getAttribute('tabindex'); 
    if (ogti) { 
      el.setAttribute('data-ogti', ogti); 
    }
    focusEl(el);
  }
};