import { ariaHide, ariaUnhide } from '../src/aria-hide';

/**
 * jsdom does not implement `inert`: the property is absent from
 * HTMLElement.prototype, and assigning it creates a plain expando with no
 * attribute reflection and no behaviour. Every suite below therefore exercises
 * the pre-2.0 fallback path unless it installs this shim, which reflects the
 * attribute the way a supporting browser does.
 */
const withInertSupport = (): void => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'inert', {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute('inert');
      },
      set(this: HTMLElement, value: boolean) {
        if (value) {
          this.setAttribute('inert', '');
        } else {
          this.removeAttribute('inert');
        }
      }
    });
  });

  afterEach(() => {
    delete (HTMLElement.prototype as any).inert;
  });
};

describe('aria-hide functions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('aria-hidden');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('aria-hidden');
  });

  describe('ariaHide function', () => {
    describe('basic functionality', () => {
      test('sets aria-hidden=true on target element', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        
        ariaHide(container);
        
        expect(container.getAttribute('aria-hidden')).toBe('true');
      });

      test('uses document.body as default when no parent provided', () => {
        ariaHide();
        
        expect(document.body.getAttribute('aria-hidden')).toBe('true');
      });

      test('exits early if element already has hidden parent', () => {
        const outerContainer = document.createElement('div');
        const innerContainer = document.createElement('div');
        const button = document.createElement('button');
        
        outerContainer.setAttribute('aria-hidden', 'true');
        outerContainer.appendChild(innerContainer);
        innerContainer.appendChild(button);
        document.body.appendChild(outerContainer);
        
        ariaHide(innerContainer);
        
        // Button should not have been modified since parent is already hidden
        expect(button.hasAttribute('data-ogti')).toBe(false);
        expect(button.getAttribute('tabindex')).toBe(null);
      });
    });

    describe('focusable element handling', () => {
      test('sets tabindex=-1 on buttons', () => {
        const container = document.createElement('div');
        const button = document.createElement('button');
        container.appendChild(button);
        document.body.appendChild(container);
        
        ariaHide(container);
        
        expect(button.getAttribute('tabindex')).toBe('-1');
        expect(button.getAttribute('data-ogti')).toBe('');
      });

      test('handles links with href', () => {
        const container = document.createElement('div');
        const link = document.createElement('a');
        link.href = 'https://example.com';
        container.appendChild(link);
        document.body.appendChild(container);
        
        ariaHide(container);
        
        expect(link.getAttribute('tabindex')).toBe('-1');
        expect(link.getAttribute('data-ogti')).toBe('');
      });

      test('handles form inputs', () => {
        const container = document.createElement('div');
        const input = document.createElement('input');
        const select = document.createElement('select');
        const textarea = document.createElement('textarea');
        
        container.appendChild(input);
        container.appendChild(select);
        container.appendChild(textarea);
        document.body.appendChild(container);
        
        ariaHide(container);
        
        expect(input.getAttribute('tabindex')).toBe('-1');
        expect(select.getAttribute('tabindex')).toBe('-1');
        expect(textarea.getAttribute('tabindex')).toBe('-1');
      });

      test('handles elements with existing tabindex', () => {
        const container = document.createElement('div');
        const customElement = document.createElement('div');
        customElement.setAttribute('tabindex', '2');
        container.appendChild(customElement);
        document.body.appendChild(container);
        
        ariaHide(container);
        
        expect(customElement.getAttribute('tabindex')).toBe('-1');
        expect(customElement.getAttribute('data-ogti')).toBe('2');
      });

      test('ignores elements with tabindex=-1', () => {
        const container = document.createElement('div');
        const hiddenElement = document.createElement('div');
        hiddenElement.setAttribute('tabindex', '-1');
        container.appendChild(hiddenElement);
        document.body.appendChild(container);
        
        ariaHide(container);
        
        // Should not be modified since it's already unfocusable
        expect(hiddenElement.getAttribute('tabindex')).toBe('-1');
        expect(hiddenElement.hasAttribute('data-ogti')).toBe(false);
      });

      test('handles mixed focusable elements', () => {
        const container = document.createElement('div');
        const button = document.createElement('button');
        const link = document.createElement('a');
        const input = document.createElement('input');
        const customDiv = document.createElement('div');
        
        link.href = '#';
        customDiv.setAttribute('tabindex', '0');
        
        container.appendChild(button);
        container.appendChild(link);
        container.appendChild(input);
        container.appendChild(customDiv);
        document.body.appendChild(container);
        
        ariaHide(container);
        
        expect(button.getAttribute('tabindex')).toBe('-1');
        expect(link.getAttribute('tabindex')).toBe('-1');
        expect(input.getAttribute('tabindex')).toBe('-1');
        expect(customDiv.getAttribute('tabindex')).toBe('-1');
        expect(customDiv.getAttribute('data-ogti')).toBe('0');
      });
    });
  });

  describe('ariaUnhide function', () => {
    describe('basic functionality', () => {
      test('removes aria-hidden attribute', () => {
        const container = document.createElement('div');
        container.setAttribute('aria-hidden', 'true');
        document.body.appendChild(container);
        
        ariaUnhide(container);
        
        expect(container.hasAttribute('aria-hidden')).toBe(false);
      });

      test('uses document.body as default when no parent provided', () => {
        document.body.setAttribute('aria-hidden', 'true');
        
        ariaUnhide();
        
        expect(document.body.hasAttribute('aria-hidden')).toBe(false);
      });
    });

    describe('tabindex restoration', () => {
      test('removes tabindex when original was empty', () => {
        const container = document.createElement('div');
        const button = document.createElement('button');
        button.setAttribute('tabindex', '-1');
        button.setAttribute('data-ogti', '');
        container.appendChild(button);
        document.body.appendChild(container);
        
        ariaUnhide(container);
        
        expect(button.hasAttribute('tabindex')).toBe(false);
        expect(button.hasAttribute('data-ogti')).toBe(false);
      });

      test('restores original tabindex value', () => {
        const container = document.createElement('div');
        const customElement = document.createElement('div');
        customElement.setAttribute('tabindex', '-1');
        customElement.setAttribute('data-ogti', '3');
        container.appendChild(customElement);
        document.body.appendChild(container);
        
        ariaUnhide(container);
        
        expect(customElement.getAttribute('tabindex')).toBe('3');
        expect(customElement.hasAttribute('data-ogti')).toBe(false);
      });

      test('handles multiple elements with different original tabindex values', () => {
        const container = document.createElement('div');
        const button = document.createElement('button');
        const customDiv = document.createElement('div');
        const link = document.createElement('a');
        
        // Simulate ariaHide having been called
        button.setAttribute('tabindex', '-1');
        button.setAttribute('data-ogti', '');
        
        customDiv.setAttribute('tabindex', '-1');
        customDiv.setAttribute('data-ogti', '2');
        
        link.setAttribute('tabindex', '-1');
        link.setAttribute('data-ogti', '0');
        
        container.appendChild(button);
        container.appendChild(customDiv);
        container.appendChild(link);
        document.body.appendChild(container);
        
        ariaUnhide(container);
        
        expect(button.hasAttribute('tabindex')).toBe(false);
        expect(customDiv.getAttribute('tabindex')).toBe('2');
        expect(link.getAttribute('tabindex')).toBe('0');
        
        expect(button.hasAttribute('data-ogti')).toBe(false);
        expect(customDiv.hasAttribute('data-ogti')).toBe(false);
        expect(link.hasAttribute('data-ogti')).toBe(false);
      });
    });
  });

  describe('ariaHide and ariaUnhide integration', () => {
    test('complete hide/unhide cycle preserves original state', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      const customDiv = document.createElement('div');
      const link = document.createElement('a');
      
      // Set up initial state
      customDiv.setAttribute('tabindex', '1');
      link.href = '#test';
      
      container.appendChild(button);
      container.appendChild(customDiv);
      container.appendChild(link);
      document.body.appendChild(container);
      
      // Store original state
      const originalButtonTabindex = button.getAttribute('tabindex');
      const originalCustomDivTabindex = customDiv.getAttribute('tabindex');
      const originalLinkTabindex = link.getAttribute('tabindex');
      
      // Hide
      ariaHide(container);
      expect(container.getAttribute('aria-hidden')).toBe('true');
      expect(button.getAttribute('tabindex')).toBe('-1');
      expect(customDiv.getAttribute('tabindex')).toBe('-1');
      expect(link.getAttribute('tabindex')).toBe('-1');
      
      // Unhide
      ariaUnhide(container);
      expect(container.hasAttribute('aria-hidden')).toBe(false);
      expect(button.getAttribute('tabindex')).toBe(originalButtonTabindex);
      expect(customDiv.getAttribute('tabindex')).toBe(originalCustomDivTabindex);
      expect(link.getAttribute('tabindex')).toBe(originalLinkTabindex);
    });

    test('handles nested containers', () => {
      const outerContainer = document.createElement('div');
      const innerContainer = document.createElement('div');
      const button = document.createElement('button');
      
      innerContainer.appendChild(button);
      outerContainer.appendChild(innerContainer);
      document.body.appendChild(outerContainer);
      
      ariaHide(outerContainer);
      
      expect(outerContainer.getAttribute('aria-hidden')).toBe('true');
      expect(button.getAttribute('tabindex')).toBe('-1');
      
      ariaUnhide(outerContainer);
      
      expect(outerContainer.hasAttribute('aria-hidden')).toBe(false);
      expect(button.hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('handles empty containers', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      expect(() => ariaHide(container)).not.toThrow();
      expect(() => ariaUnhide(container)).not.toThrow();
      
      ariaHide(container);
      expect(container.getAttribute('aria-hidden')).toBe('true');
      ariaUnhide(container);
      expect(container.hasAttribute('aria-hidden')).toBe(false);
    });

    test('handles elements not in DOM', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      container.appendChild(button);
      
      expect(() => ariaHide(container)).not.toThrow();
      expect(() => ariaUnhide(container)).not.toThrow();
    });

    test('unhide works even if hide was not called first', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      container.appendChild(button);
      document.body.appendChild(container);
      
      expect(() => ariaUnhide(container)).not.toThrow();
    });
  });

  describe('with native inert support', () => {
    withInertSupport();

    const sandbox = (): HTMLElement => {
      const container = document.createElement('div');
      container.innerHTML =
        '<a href="/x">A link</a><button type="button">A button</button><input aria-label="f">';
      document.body.appendChild(container);
      return container;
    };

    test('marks the subtree inert', () => {
      const container = sandbox();

      ariaHide(container);

      expect(container.hasAttribute('inert')).toBe(true);
      expect(container.inert).toBe(true);
    });

    test('does not set aria-hidden', () => {
      // The 2.0 breaking change. inert removes the subtree from the
      // accessibility tree without an observable attribute.
      const container = sandbox();

      ariaHide(container);

      expect(container.hasAttribute('aria-hidden')).toBe(false);
    });

    test('writes no tabindex bookkeeping at all', () => {
      // The browser enforces inert continuously, so there is nothing to
      // snapshot and nothing to restore.
      const container = sandbox();

      ariaHide(container);

      expect(container.querySelectorAll('[data-ogti]')).toHaveLength(0);
      expect(container.querySelectorAll('[tabindex]')).toHaveLength(0);
    });

    test('covers content added after hiding', () => {
      // The limitation that motivated the rewrite: the old implementation
      // snapshotted once, so late-rendered content stayed tabbable.
      const container = sandbox();
      ariaHide(container);

      const late = document.createElement('button');
      late.textContent = 'Added after hiding';
      container.appendChild(late);

      // Nothing needs doing to the new child — inert is inherited from the
      // subtree root and enforced by the browser.
      expect(late.hasAttribute('tabindex')).toBe(false);
      expect(container.hasAttribute('inert')).toBe(true);
    });

    test('unhide clears inert', () => {
      const container = sandbox();

      ariaHide(container);
      ariaUnhide(container);

      expect(container.hasAttribute('inert')).toBe(false);
      expect(container.inert).toBe(false);
    });

    test('hiding twice is idempotent, and one unhide reverses it', () => {
      const container = sandbox();

      ariaHide(container);
      ariaHide(container);
      ariaUnhide(container);

      expect(container.hasAttribute('inert')).toBe(false);
    });

    test('defaults to document.body', () => {
      ariaHide();
      expect(document.body.hasAttribute('inert')).toBe(true);

      ariaUnhide();
      expect(document.body.hasAttribute('inert')).toBe(false);
    });

    test('leaves an inert the caller set alone', () => {
      // Someone else's inert is not ours to clear.
      const container = sandbox();
      container.setAttribute('inert', '');

      ariaHide(container);
      ariaUnhide(container);

      expect(container.hasAttribute('inert')).toBe(true);
    });

    test('cleans up a subtree left behind by the fallback path', () => {
      // A page can be hidden by an older version of the library, or by the
      // fallback before a browser upgrade. Unhide has to restore that too.
      const container = sandbox();
      const link = container.querySelector('a')!;
      container.setAttribute('aria-hidden', 'true');
      link.setAttribute('data-ogti', '2');
      link.setAttribute('tabindex', '-1');

      ariaUnhide(container);

      expect(container.hasAttribute('aria-hidden')).toBe(false);
      expect(link.getAttribute('tabindex')).toBe('2');
      expect(link.hasAttribute('data-ogti')).toBe(false);
    });
  });

  describe('detached elements', () => {
    test('still updates focusable children when the element has no parent', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      container.appendChild(button);

      ariaHide(container);

      expect(container.getAttribute('aria-hidden')).toBe('true');
      expect(button.getAttribute('tabindex')).toBe('-1');
      expect(button.getAttribute('data-ogti')).toBe('');
    });

    test('restores focusable children of a detached element', () => {
      const container = document.createElement('div');
      const link = document.createElement('a');
      link.setAttribute('href', '/x');
      link.setAttribute('tabindex', '0');
      container.appendChild(link);

      ariaHide(container);
      expect(link.getAttribute('tabindex')).toBe('-1');

      ariaUnhide(container);

      expect(link.getAttribute('tabindex')).toBe('0');
      expect(link.hasAttribute('data-ogti')).toBe(false);
    });
  });

  describe('nested and repeated hides', () => {
    test('a second hide does not overwrite the original tabindex backup', () => {
      const sidebar = document.createElement('div');
      const link = document.createElement('a');
      link.setAttribute('href', '/x');
      sidebar.appendChild(link);
      document.body.appendChild(sidebar);

      ariaHide(sidebar);
      expect(link.getAttribute('data-ogti')).toBe('');
      expect(link.getAttribute('tabindex')).toBe('-1');

      ariaHide(document.body);
      // The backup must still describe the element's true original state,
      // not the temporary -1 written by the first call.
      expect(link.getAttribute('data-ogti')).toBe('');
    });

    test('outermost unhide restores the true original tabindex', () => {
      const sidebar = document.createElement('div');
      const link = document.createElement('a');
      link.setAttribute('href', '/x');
      sidebar.appendChild(link);
      document.body.appendChild(sidebar);

      ariaHide(sidebar);
      ariaHide(document.body);
      ariaUnhide(document.body);

      expect(link.hasAttribute('tabindex')).toBe(false);
      expect(link.hasAttribute('data-ogti')).toBe(false);
    });

    test('preserves an explicit tabindex across nested hides', () => {
      const sidebar = document.createElement('div');
      const link = document.createElement('a');
      link.setAttribute('href', '/x');
      link.setAttribute('tabindex', '0');
      sidebar.appendChild(link);
      document.body.appendChild(sidebar);

      ariaHide(sidebar);
      ariaHide(document.body);
      ariaUnhide(document.body);

      expect(link.getAttribute('tabindex')).toBe('0');
      expect(link.hasAttribute('data-ogti')).toBe(false);
    });

    test('hiding the same subtree twice is idempotent', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      button.setAttribute('tabindex', '2');
      container.appendChild(button);
      document.body.appendChild(container);

      ariaHide(container);
      ariaHide(container);
      ariaUnhide(container);

      expect(button.getAttribute('tabindex')).toBe('2');
      expect(button.hasAttribute('data-ogti')).toBe(false);
    });
  });
});