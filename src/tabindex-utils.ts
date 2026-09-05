/**
 * Shared utilities for managing tabindex attributes across the library
 */

const OGTI_ATTR = 'data-ogti';

/**
 * Gets the original tabindex value from an element
 */
export const getTabindex = (element: HTMLElement): string | null => {
  return element.getAttribute('tabindex');
};

/**
 * Stores the original tabindex value and sets a temporary one.
 *
 * The backup is write-once: if a previous call already stored a value, it is
 * left alone so that nested or repeated calls cannot overwrite the true
 * original with a temporary one. This keeps inner calls idempotent and lets
 * the outermost restore put back the value the element started with.
 */
export const setTemporaryTabindex = (element: HTMLElement, temporaryValue: string): void => {
  if (!hasStoredTabindex(element)) {
    element.setAttribute(OGTI_ATTR, getTabindex(element) || '');
  }
  element.setAttribute('tabindex', temporaryValue);
};

/**
 * Restores the original tabindex value from stored data
 */
export const restoreOriginalTabindex = (element: HTMLElement): void => {
  const originalTabindex = element.getAttribute(OGTI_ATTR);
  if (originalTabindex && originalTabindex.length > 0) {
    element.setAttribute('tabindex', originalTabindex);
  } else {
    element.removeAttribute('tabindex');
  }
  element.removeAttribute(OGTI_ATTR);
};

/**
 * Checks if an element has stored original tabindex data
 */
export const hasStoredTabindex = (element: HTMLElement): boolean => {
  return element.hasAttribute(OGTI_ATTR);
};