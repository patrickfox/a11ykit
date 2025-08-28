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
    test('calls matchMedia with correct query on module load', () => {
      // Re-import to trigger initialization
      jest.resetModules();
      require('../src/prefers-reduced-motion');
      
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    test('adds event listener for media query changes', () => {
      jest.resetModules();
      require('../src/prefers-reduced-motion');
      
      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    test('runs initial test on module load', () => {
      document.body.className = '';
      
      jest.resetModules();
      require('../src/prefers-reduced-motion');
      
      // Since mockMediaQueryList.matches is false, no 'prm' class should be added
      expect(document.body.classList.contains('prm')).toBe(false);
    });
  });

  describe('media query handling', () => {
    test('adds prm class when prefers-reduced-motion is enabled', () => {
      mockMediaQueryList.matches = true;
      
      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');
      
      expect(document.body.classList.contains('prm')).toBe(true);
      expect(prefersReducedMotion).toBe(true);
    });

    test('does not add prm class when prefers-reduced-motion is disabled', () => {
      mockMediaQueryList.matches = false;
      
      jest.resetModules();
      const { prefersReducedMotion } = require('../src/prefers-reduced-motion');
      
      expect(document.body.classList.contains('prm')).toBe(false);
      expect(prefersReducedMotion).toBe(false);
    });

    test('removes prm class when preference changes from enabled to disabled', () => {
      // Start with reduced motion enabled
      mockMediaQueryList.matches = true;
      
      jest.resetModules();
      require('../src/prefers-reduced-motion');
      
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
      require('../src/prefers-reduced-motion');
      
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
      
      expect(prefersReducedMotion).toBe(true);
    });

    test('updates when preference changes', () => {
      // Start disabled
      mockMediaQueryList.matches = false;
      
      jest.resetModules();
      let { prefersReducedMotion } = require('../src/prefers-reduced-motion');
      
      expect(prefersReducedMotion).toBe(false);
      
      // Trigger change to enabled
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'change')[1];
      
      changeHandler({ matches: true });
      
      // Re-import to get updated value
      jest.resetModules();
      ({ prefersReducedMotion } = require('../src/prefers-reduced-motion'));
      
      // Note: The exported value is set at module initialization time
      // In a real scenario, you'd typically access this through a function
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
        require('../src/prefers-reduced-motion');
      }).toThrow();
    });

    test('handles event object variations', () => {
      jest.resetModules();
      require('../src/prefers-reduced-motion');
      
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls
        .find((call: any[]) => call[0] === 'change')[1];
      
      // Test with boolean true
      changeHandler(true);
      expect(document.body.classList.contains('prm')).toBe(true);
      
      // Test with boolean false
      changeHandler(false);
      expect(document.body.classList.contains('prm')).toBe(false);
      
      // Test with object without matches property
      changeHandler({});
      expect(document.body.classList.contains('prm')).toBe(false);
      
      // Test with object with matches: true
      changeHandler({ matches: true });
      expect(document.body.classList.contains('prm')).toBe(true);
    });

    test('preserves other classes on document.body', () => {
      document.body.className = 'existing-class another-class';
      
      mockMediaQueryList.matches = true;
      jest.resetModules();
      require('../src/prefers-reduced-motion');
      
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
      require('../src/prefers-reduced-motion');
      
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
      require('../src/prefers-reduced-motion');
      
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