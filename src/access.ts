import { setTemporaryTabindex, restoreOriginalTabindex } from './tabindex-utils';

export const access = (el: HTMLElement, placeFocusBefore?: string | boolean): void => {
  let focusEl: (element: HTMLElement) => void;
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

  focusEl = (el: HTMLElement): void => {
    setTemporaryTabindex(el, '-1');
    el.addEventListener('focusout', focusMethod);
    el.focus();
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
      focusMethod = onBlurEl;
      focusEl(el);
    }
  } else {
    focusEl(el);
  }
};