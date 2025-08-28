import { access } from '../src/access';

describe('access function', () => {
  let element: HTMLElement;
  let parentElement: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    parentElement = document.createElement('div');
    element = document.createElement('button');
    element.textContent = 'Test Button';
    parentElement.appendChild(element);
    document.body.appendChild(parentElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('basic focus functionality', () => {
    test('sets tabindex to -1 and focuses element', () => {
      const focusSpy = jest.spyOn(element, 'focus');
      
      access(element);
      
      expect(element.getAttribute('tabindex')).toBe('-1');
      expect(focusSpy).toHaveBeenCalled();
    });

    test('preserves original tabindex in data-ogti', () => {
      element.setAttribute('tabindex', '2');
      
      access(element);
      
      expect(element.getAttribute('data-ogti')).toBe('2');
      expect(element.getAttribute('tabindex')).toBe('-1');
    });

    test('handles element with no original tabindex', () => {
      access(element);
      
      expect(element.hasAttribute('data-ogti')).toBe(true);
      expect(element.getAttribute('data-ogti')).toBe('');
      expect(element.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('focus cleanup on blur', () => {
    test('restores original tabindex on focusout', () => {
      element.setAttribute('tabindex', '3');
      access(element);
      
      // Simulate focusout event
      const focusoutEvent = new FocusEvent('focusout');
      element.dispatchEvent(focusoutEvent);
      
      expect(element.getAttribute('tabindex')).toBe('3');
      expect(element.hasAttribute('data-ogti')).toBe(false);
    });

    test('removes tabindex if none existed originally on focusout', () => {
      access(element);
      
      // Simulate focusout event
      const focusoutEvent = new FocusEvent('focusout');
      element.dispatchEvent(focusoutEvent);
      
      expect(element.hasAttribute('tabindex')).toBe(false);
      expect(element.hasAttribute('data-ogti')).toBe(false);
    });
  });

  describe('placeFocusBefore functionality', () => {
    test('creates temporary element when placeFocusBefore is true', () => {
      access(element, true);
      
      const tempElement = parentElement.querySelector('span');
      expect(tempElement).toBeTruthy();
      expect(tempElement?.getAttribute('tabindex')).toBe('-1');
      expect(tempElement?.nextSibling).toBe(element);
    });

    test('sets innerHTML when placeFocusBefore is a string', () => {
      const message = 'Skip to content';
      access(element, message);
      
      const tempElement = parentElement.querySelector('span');
      expect(tempElement?.innerHTML).toBe(message);
    });

    test('applies screen reader only styles to temporary element', () => {
      access(element, true);
      
      const tempElement = parentElement.querySelector('span') as HTMLElement;
      const style = tempElement.getAttribute('style');
      
      expect(style).toContain('position: absolute');
      expect(style).toContain('height: 1px');
      expect(style).toContain('width: 1px');
      expect(style).toContain('margin: -1px');
      expect(style).toContain('overflow: hidden');
      expect(style).toContain('clip: rect(0 0 0 0)');
    });

    test('removes temporary element on focusout', () => {
      access(element, true);
      
      const tempElement = parentElement.querySelector('span');
      expect(tempElement).toBeTruthy();
      
      // Simulate focusout event on temp element
      const focusoutEvent = new FocusEvent('focusout');
      tempElement?.dispatchEvent(focusoutEvent);
      
      expect(parentElement.querySelector('span')).toBeNull();
    });

    test('focuses temporary element instead of target element', () => {
      const tempElementFocusSpy = jest.fn();
      const originalElementFocusSpy = jest.spyOn(element, 'focus');
      
      // Mock focus on the temp element that will be created
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockImplementation((tagName: string) => {
        const el = originalCreateElement.call(document, tagName);
        if (tagName === 'span') {
          el.focus = tempElementFocusSpy;
        }
        return el;
      });
      
      access(element, true);
      
      expect(tempElementFocusSpy).toHaveBeenCalled();
      expect(originalElementFocusSpy).not.toHaveBeenCalled();
      
      // Restore original createElement
      document.createElement = originalCreateElement;
    });
  });

  describe('edge cases', () => {
    test('handles element without parent node', () => {
      const orphanElement = document.createElement('div');
      
      expect(() => access(orphanElement, true)).not.toThrow();
      expect(orphanElement.getAttribute('tabindex')).toBe('-1');
    });

    test('handles multiple access calls on same element', () => {
      access(element);
      const firstTabindex = element.getAttribute('tabindex');
      
      access(element);
      
      expect(element.getAttribute('tabindex')).toBe(firstTabindex);
    });
  });
});