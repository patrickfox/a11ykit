/**
 * @jest-environment jsdom
 */
import { prefersReducedMotion } from '../src/prefers-reduced-motion';

// We need to import the module to trigger the initialization
describe('prefers-reduced-motion', () => {
  let mockMatchMedia: jest.Mock;
  let mockMediaQueryList: any;

  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
    document.body.className = '';

    // Create a more complete mock of MediaQueryList
    mockMediaQueryList = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(), // Deprecated but still used by some browsers
      removeListener: jest.fn(), // Deprecated but still used by some browsers
      dispatchEvent: jest.fn(),
      onchange: null
    };

    mockMatchMedia = jest.fn().mockReturnValue(mockMediaQueryList);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('does not call matchMedia until function is called (SSR-safe)', () => {
      jest.resetModules();
      require('../src/prefers-reduced-motion');

      // matchMedia should not be called on module load
      expect(mockMatchMedia).not.toHaveBeenCalled();
    });

    test('calls matchMedia with correct query on first function call', () => {
      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      // Call the function to trigger initialization
      prefersReducedMotion();

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    test('adds event listener for media query changes on first call', () => {
      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      prefersReducedMotion();

      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    test('only initializes once even with multiple calls', () => {
      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      prefersReducedMotion();
      prefersReducedMotion();
      prefersReducedMotion();

      expect(mockMatchMedia).toHaveBeenCalledTimes(1);
      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledTimes(1);
    });

    test('applies initial body class on first function call', () => {
      document.body.className = '';

      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      prefersReducedMotion();

      // Since mockMediaQueryList.matches is false, no 'prm' class should be added
      expect(document.body.classList.contains('prm')).toBe(false);
    });
  });

  describe('media query handling', () => {
    test('adds prm class when prefers-reduced-motion is enabled', () => {
      mockMediaQueryList.matches = true;

      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      const result = prefersReducedMotion();

      expect(document.body.classList.contains('prm')).toBe(true);
      expect(result).toBe(true);
    });

    test('does not add prm class when prefers-reduced-motion is disabled', () => {
      mockMediaQueryList.matches = false;

      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      const result = prefersReducedMotion();

      expect(document.body.classList.contains('prm')).toBe(false);
      expect(result).toBe(false);
    });

    test('removes prm class when preference changes from enabled to disabled', () => {
      // Start with reduced motion enabled
      mockMediaQueryList.matches = true;

      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      prefersReducedMotion();

      expect(document.body.classList.contains('prm')).toBe(true);

      // Simulate change event with reduced motion disabled
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'change')[1];

      const mockEvent = { matches: false };
      changeHandler(mockEvent);

      expect(document.body.classList.contains('prm')).toBe(false);
    });

    test('adds prm class when preference changes from disabled to enabled', () => {
      // Start with reduced motion disabled
      mockMediaQueryList.matches = false;

      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      prefersReducedMotion();

      expect(document.body.classList.contains('prm')).toBe(false);

      // Simulate change event with reduced motion enabled
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'change')[1];

      const mockEvent = { matches: true };
      changeHandler(mockEvent);

      expect(document.body.classList.contains('prm')).toBe(true);
    });
  });

  describe('prefersReducedMotion export value', () => {
    test('reflects current reduced motion preference', () => {
      mockMediaQueryList.matches = true;

      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      expect(prefersReducedMotion()).toBe(true);
    });

    test('updates when preference changes', () => {
      // Start disabled
      mockMediaQueryList.matches = false;

      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      expect(prefersReducedMotion()).toBe(false);

      // Trigger change to enabled
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'change')[1];

      changeHandler({ matches: true });

      // Function should return updated value without re-import
      expect(prefersReducedMotion()).toBe(true);
    });
  });

  describe('watchReducedMotion', () => {
    const changeHandler = (): ((e: any) => void) =>
      mockMediaQueryList.addEventListener.mock.calls
        .filter((call: any[]) => call[0] === 'change')
        .slice(-1)[0][1];

    test('applies the class for the current preference', () => {
      mockMediaQueryList.matches = true;
      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');

      watchReducedMotion();

      expect(document.body.classList.contains('prm')).toBe(true);
    });

    test('keeps the class in sync with changes', () => {
      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');
      watchReducedMotion();

      expect(document.body.classList.contains('prm')).toBe(false);

      changeHandler()({ matches: true });
      expect(document.body.classList.contains('prm')).toBe(true);

      changeHandler()({ matches: false });
      expect(document.body.classList.contains('prm')).toBe(false);
    });

    test('teardown removes the listener and the class', () => {
      mockMediaQueryList.matches = true;
      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');

      const stop = watchReducedMotion();
      expect(document.body.classList.contains('prm')).toBe(true);

      stop();

      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
      // Leaving the class would freeze the page in its last watched state.
      expect(document.body.classList.contains('prm')).toBe(false);
    });

    test('ignores a change delivered after teardown', () => {
      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');

      const stop = watchReducedMotion();
      const handler = changeHandler();

      stop();
      expect(document.body.classList.contains('prm')).toBe(false);

      // Anyone still holding the handler must not be able to resurrect the
      // class after the caller has torn the watcher down.
      handler({ matches: true });
      expect(document.body.classList.contains('prm')).toBe(false);
    });

    test('teardown is safe to call more than once', () => {
      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');
      const stop = watchReducedMotion();

      stop();
      expect(() => stop()).not.toThrow();
      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledTimes(1);
    });

    test('accepts a custom class name', () => {
      mockMediaQueryList.matches = true;
      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');

      const stop = watchReducedMotion({ className: 'reduce-motion' });

      expect(document.body.classList.contains('reduce-motion')).toBe(true);
      expect(document.body.classList.contains('prm')).toBe(false);

      stop();
      expect(document.body.classList.contains('reduce-motion')).toBe(false);
    });

    test('accepts a custom target element', () => {
      mockMediaQueryList.matches = true;
      const target = document.createElement('div');
      document.body.appendChild(target);
      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');

      const stop = watchReducedMotion({ target });

      expect(target.classList.contains('prm')).toBe(true);
      expect(document.body.classList.contains('prm')).toBe(false);

      stop();
      expect(target.classList.contains('prm')).toBe(false);
    });

    test('preserves other classes on the target', () => {
      document.body.className = 'existing other';
      mockMediaQueryList.matches = true;
      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');

      const stop = watchReducedMotion();
      expect(document.body.className).toContain('existing');
      expect(document.body.className).toContain('other');

      stop();
      expect(document.body.className).toContain('existing');
      expect(document.body.className).toContain('other');
    });

    describe('when document.body does not exist yet', () => {
      // A script in <head> runs before <body>. The documented promise is that
      // the class is applied once the document is ready, rather than silently
      // skipped — so it needs a test, not just a comment.
      let originalBody: HTMLElement;

      beforeEach(() => {
        originalBody = document.body;
        Object.defineProperty(document, 'body', {
          configurable: true,
          get: () => null
        });
      });

      afterEach(() => {
        Object.defineProperty(document, 'body', {
          configurable: true,
          get: () => originalBody
        });
      });

      test('does not throw', () => {
        mockMediaQueryList.matches = true;
        jest.resetModules();
        const { watchReducedMotion } = require('../src/prefers-reduced-motion');

        expect(() => watchReducedMotion()).not.toThrow();
      });

      test('applies the class once the document is ready', () => {
        mockMediaQueryList.matches = true;
        jest.resetModules();
        const { watchReducedMotion } = require('../src/prefers-reduced-motion');

        watchReducedMotion();

        // Body exists by the time the document fires.
        Object.defineProperty(document, 'body', {
          configurable: true,
          get: () => originalBody
        });
        document.dispatchEvent(new Event('DOMContentLoaded'));

        expect(originalBody.classList.contains('prm')).toBe(true);
      });

      test('teardown before the document is ready cancels the pending apply', () => {
        mockMediaQueryList.matches = true;
        jest.resetModules();
        const { watchReducedMotion } = require('../src/prefers-reduced-motion');

        const stop = watchReducedMotion();
        stop();

        Object.defineProperty(document, 'body', {
          configurable: true,
          get: () => originalBody
        });
        document.dispatchEvent(new Event('DOMContentLoaded'));

        expect(originalBody.classList.contains('prm')).toBe(false);
      });

      test('prefersReducedMotion still reports the value', () => {
        mockMediaQueryList.matches = true;
        jest.resetModules();
        const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

        // Reading the preference must not depend on there being a body to mark.
        expect(prefersReducedMotion()).toBe(true);
      });
    });

    test('multiple watchers can run and be torn down independently', () => {
      const target = document.createElement('div');
      document.body.appendChild(target);
      mockMediaQueryList.matches = true;
      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');

      const stopBody = watchReducedMotion();
      const stopTarget = watchReducedMotion({ target, className: 'rm' });

      expect(document.body.classList.contains('prm')).toBe(true);
      expect(target.classList.contains('rm')).toBe(true);

      stopBody();

      expect(document.body.classList.contains('prm')).toBe(false);
      expect(target.classList.contains('rm')).toBe(true);

      stopTarget();
      expect(target.classList.contains('rm')).toBe(false);
    });
  });

  describe('edge cases and browser compatibility', () => {
    test('handles matchMedia not being available', () => {
      // Previously this threw. A utility whose whole job is to answer a
      // question should not crash the caller when it cannot; it reports no
      // preference, which is what the media query itself defaults to.
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: undefined,
      });

      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      expect(() => prefersReducedMotion()).not.toThrow();
      expect(prefersReducedMotion()).toBe(false);
    });

    test('watchReducedMotion returns a usable teardown without matchMedia', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: undefined,
      });

      jest.resetModules();
      const { watchReducedMotion } = require('../src/prefers-reduced-motion');

      let stop: () => void = () => undefined;
      expect(() => { stop = watchReducedMotion(); }).not.toThrow();
      expect(() => stop()).not.toThrow();
    });

    test('handles MediaQueryListEvent with matches property', () => {
      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      prefersReducedMotion();

      const changeHandler = mockMediaQueryList.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'change')[1];

      // Test with matches: true
      changeHandler({ matches: true });
      expect(document.body.classList.contains('prm')).toBe(true);

      // Test with matches: false
      changeHandler({ matches: false });
      expect(document.body.classList.contains('prm')).toBe(false);
    });

    test('preserves other classes on document.body', () => {
      document.body.className = 'existing-class another-class';

      mockMediaQueryList.matches = true;
      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      prefersReducedMotion();

      expect(document.body.classList.contains('existing-class')).toBe(true);
      expect(document.body.classList.contains('another-class')).toBe(true);
      expect(document.body.classList.contains('prm')).toBe(true);

      // Test removal doesn't affect other classes
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'change')[1];

      changeHandler({ matches: false });

      expect(document.body.classList.contains('existing-class')).toBe(true);
      expect(document.body.classList.contains('another-class')).toBe(true);
      expect(document.body.classList.contains('prm')).toBe(false);
    });
  });

  describe('CSS class management', () => {
    test('toggles prm class correctly', () => {
      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      prefersReducedMotion();

      const changeHandler = mockMediaQueryList.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'change')[1];

      // Enable reduced motion
      changeHandler({ matches: true });
      expect(document.body.classList.contains('prm')).toBe(true);

      // Disable reduced motion
      changeHandler({ matches: false });
      expect(document.body.classList.contains('prm')).toBe(false);

      // Enable again
      changeHandler({ matches: true });
      expect(document.body.classList.contains('prm')).toBe(true);
    });

    test('handles multiple rapid changes', () => {
      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');

      prefersReducedMotion();

      const changeHandler = mockMediaQueryList.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'change')[1];

      // Rapid changes
      changeHandler({ matches: true });
      changeHandler({ matches: false });
      changeHandler({ matches: true });
      changeHandler({ matches: false });

      expect(document.body.classList.contains('prm')).toBe(false);
    });
  });
});