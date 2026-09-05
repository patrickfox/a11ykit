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

  /** A heading is not focusable on its own, so it takes the tabindex path. */
  const nonFocusable = (): HTMLElement => {
    const heading = document.createElement('h2');
    heading.textContent = 'Order confirmed';
    parentElement.appendChild(heading);
    return heading;
  };

  describe('natively focusable elements', () => {
    test('focuses without touching tabindex', () => {
      // The browser already puts a button in the tab order. Writing
      // tabindex="-1" would remove it for as long as it held focus.
      const focusSpy = jest.spyOn(element, 'focus');

      access(element);

      expect(focusSpy).toHaveBeenCalled();
      expect(element.hasAttribute('tabindex')).toBe(false);
      expect(element.hasAttribute('data-ogti')).toBe(false);
    });

    test('leaves an existing tabindex alone', () => {
      element.setAttribute('tabindex', '2');

      access(element);

      expect(element.getAttribute('tabindex')).toBe('2');
      expect(element.hasAttribute('data-ogti')).toBe(false);
    });

    test.each([
      ['a[href]', () => { const a = document.createElement('a'); a.href = '/x'; return a; }],
      ['input', () => document.createElement('input')],
      ['select', () => document.createElement('select')],
      ['textarea', () => document.createElement('textarea')],
      ['summary', () => document.createElement('summary')],
      ['contenteditable', () => {
        const d = document.createElement('div');
        d.setAttribute('contenteditable', '');
        return d;
      }]
    ])('%s skips the tabindex round-trip', (_name, make) => {
      const el = make() as HTMLElement;
      parentElement.appendChild(el);

      access(el);

      expect(el.hasAttribute('data-ogti')).toBe(false);
    });

    test('a disabled control still gets the tabindex treatment', () => {
      // A disabled button cannot take focus, so the early return would leave
      // it unreachable.
      const disabled = document.createElement('button');
      disabled.disabled = true;
      parentElement.appendChild(disabled);

      access(disabled);

      expect(disabled.getAttribute('tabindex')).toBe('-1');
    });

    test('contenteditable="false" is not treated as focusable', () => {
      const el = document.createElement('div');
      el.setAttribute('contenteditable', 'false');
      parentElement.appendChild(el);

      access(el);

      expect(el.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('basic focus functionality', () => {
    test('sets tabindex to -1 and focuses element', () => {
      const el = nonFocusable();
      const focusSpy = jest.spyOn(el, 'focus');

      access(el);

      expect(el.getAttribute('tabindex')).toBe('-1');
      expect(focusSpy).toHaveBeenCalled();
    });

    test('preserves original tabindex in data-ogti', () => {
      const el = nonFocusable();
      el.setAttribute('tabindex', '2');

      access(el);

      expect(el.getAttribute('data-ogti')).toBe('2');
      expect(el.getAttribute('tabindex')).toBe('-1');
    });

    test('handles element with no original tabindex', () => {
      const el = nonFocusable();

      access(el);

      expect(el.hasAttribute('data-ogti')).toBe(true);
      expect(el.getAttribute('data-ogti')).toBe('');
      expect(el.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('focusability detection fallbacks', () => {
    test('treats an element without matches() as not natively focusable', () => {
      // Very old engines, and some mock objects in consumer test suites.
      const el = document.createElement('button');
      parentElement.appendChild(el);
      (el as any).matches = undefined;

      access(el);

      expect(el.getAttribute('tabindex')).toBe('-1');
    });

    test('falls back to the tabindex path if the selector throws', () => {
      const el = document.createElement('button');
      parentElement.appendChild(el);
      el.matches = () => {
        throw new Error('unsupported selector');
      };

      expect(() => access(el)).not.toThrow();
      expect(el.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('focus options', () => {
    test('passes preventScroll through on a natively focusable element', () => {
      const focusSpy = jest.spyOn(element, 'focus');

      access(element, undefined, { preventScroll: true });

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    });

    test('passes preventScroll through on the tabindex path', () => {
      const el = nonFocusable();
      const focusSpy = jest.spyOn(el, 'focus');

      access(el, undefined, { preventScroll: true });

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    });

    test('passes preventScroll to the temporary element', () => {
      access(element, 'Three items removed', { preventScroll: true });

      const tempEl = parentElement.querySelector('span');
      expect(tempEl).not.toBeNull();
      expect(document.activeElement).toBe(tempEl);
    });

    test('omits focus options when none are given', () => {
      const focusSpy = jest.spyOn(element, 'focus');

      access(element);

      expect(focusSpy).toHaveBeenCalledWith(undefined);
    });

    test('omits focus options when preventScroll is false', () => {
      const focusSpy = jest.spyOn(element, 'focus');

      access(element, undefined, { preventScroll: false });

      expect(focusSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('return value', () => {
    test('returns the element that received focus', () => {
      expect(access(element)).toBe(element);
    });

    test('returns the element on the tabindex path', () => {
      const el = nonFocusable();
      expect(access(el)).toBe(el);
    });

    test('returns the temporary span when placeFocusBefore is used', () => {
      const returned = access(element, 'Three items removed');

      expect(returned.tagName).toBe('SPAN');
      expect(returned.textContent).toBe('Three items removed');
      expect(returned).toBe(parentElement.querySelector('span'));
    });

    test('returns the target when there is no parent to insert before', () => {
      const orphan = document.createElement('h2');

      expect(access(orphan, 'A message')).toBe(orphan);
    });
  });

  describe('focus cleanup on blur', () => {
    // These must use a non-focusable element. On a button access() now returns
    // early without writing tabindex at all, so the assertions would pass
    // without the cleanup path ever running.
    test('restores original tabindex on focusout', () => {
      const el = nonFocusable();
      el.setAttribute('tabindex', '3');
      access(el);
      expect(el.getAttribute('tabindex')).toBe('-1');

      el.dispatchEvent(new FocusEvent('focusout'));

      expect(el.getAttribute('tabindex')).toBe('3');
      expect(el.hasAttribute('data-ogti')).toBe(false);
    });

    test('removes tabindex if none existed originally on focusout', () => {
      const el = nonFocusable();
      access(el);
      expect(el.getAttribute('tabindex')).toBe('-1');

      el.dispatchEvent(new FocusEvent('focusout'));

      expect(el.hasAttribute('tabindex')).toBe(false);
      expect(el.hasAttribute('data-ogti')).toBe(false);
    });

    test('a natively focusable element registers no cleanup at all', () => {
      element.setAttribute('tabindex', '3');
      access(element);

      element.dispatchEvent(new FocusEvent('focusout'));

      // Nothing was changed, so nothing is restored or removed.
      expect(element.getAttribute('tabindex')).toBe('3');
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