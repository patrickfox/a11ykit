import { ariaHide, ariaUnhide } from '../src/aria-hide';

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
});