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

  describe('edge cases and browser compatibility', () => {
    test('handles matchMedia not being available', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: undefined,
      });

      expect(() => {
        jest.resetModules();
        const { prefersReducedMotion } = require('../src/prefers-reduced-motion');
        prefersReducedMotion();
      }).toThrow();
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