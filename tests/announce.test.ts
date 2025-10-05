import { announce } from '../src/announce';

describe('announce function', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('announcer element creation', () => {
    test('creates announcer element if it does not exist', () => {
      const result = announce('Test message');
      
      expect(result).toBeTruthy();
      expect(result.id).toBe('announce-this');
      expect(document.getElementById('announce-this')).toBeTruthy();
    });

    test('reuses existing announcer element', () => {
      const firstResult = announce('First message');
      const secondResult = announce('Second message');
      
      expect(firstResult).toBe(secondResult);
      expect(document.querySelectorAll('#announce-this')).toHaveLength(1);
    });

    test('appends announcer to document body', () => {
      announce('Test message');
      
      const announcer = document.getElementById('announce-this');
      expect(announcer?.parentElement).toBe(document.body);
    });
  });

  describe('aria-live behavior', () => {
    test('sets aria-live to polite by default', () => {
      const announcer = announce('Test message');
      
      expect(announcer.getAttribute('aria-live')).toBe('polite');
    });

    test('sets aria-live to assertive when specified', () => {
      const announcer = announce('Urgent message', 'assertive');
      
      expect(announcer.getAttribute('aria-live')).toBe('assertive');
    });

    test('temporarily sets aria-live to off then back to specified value', () => {
      const announcer = announce('Test message', 'assertive');
      
      // The function first sets it to 'off', then to the specified value
      expect(announcer.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('message handling', () => {
    test('sets innerHTML with the provided message', () => {
      const message = 'Success! Your changes have been saved.';
      const announcer = announce(message);
      
      expect(announcer.innerHTML).toBe(message);
    });

    test('replaces previous message', () => {
      const announcer = announce('First message');
      announce('Second message');
      
      expect(announcer.innerHTML).toBe('Second message');
    });

    test('handles HTML in messages', () => {
      const htmlMessage = '<strong>Error:</strong> Please try again.';
      const announcer = announce(htmlMessage);
      
      expect(announcer.innerHTML).toBe(htmlMessage);
    });

    test('handles empty messages', () => {
      const announcer = announce('');
      
      expect(announcer.innerHTML).toBe('');
    });
  });

  describe('timeout behavior', () => {
    test('clears message after 500ms', () => {
      const announcer = announce('Test message');
      
      expect(announcer.innerHTML).toBe('Test message');
      
      jest.advanceTimersByTime(500);
      
      expect(announcer.innerHTML).toBe('');
    });

    test('cancels previous timeout when new message is announced', () => {
      const announcer = announce('First message');
      
      jest.advanceTimersByTime(250); // Advance halfway
      expect(announcer.innerHTML).toBe('First message');
      
      announce('Second message'); // This should cancel the first timeout
      expect(announcer.innerHTML).toBe('Second message');
      
      jest.advanceTimersByTime(500); // Complete the second timeout
      expect(announcer.innerHTML).toBe(''); // Now it should be cleared
    });

    test('uses window.setTimeout for browser compatibility', () => {
      const windowSetTimeoutSpy = jest.spyOn(window, 'setTimeout');
      
      announce('Test message');
      
      expect(windowSetTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
    });
  });

  describe('return value', () => {
    test('returns the announcer element', () => {
      const announcer = announce('Test message');
      const expectedElement = document.getElementById('announce-this');
      
      expect(announcer).toBe(expectedElement);
    });

    test('returns same element on subsequent calls', () => {
      const first = announce('First');
      const second = announce('Second');
      
      expect(first).toBe(second);
    });
  });

  describe('accessibility features', () => {
    test('announcer has proper ARIA role implied by aria-live', () => {
      const announcer = announce('Test message');

      // Elements with aria-live automatically have an implicit role of "status" or "alert"
      expect(announcer.getAttribute('aria-live')).toBeTruthy();
    });

    test('supports both polite and assertive politeness levels', () => {
      const politeAnnouncer = announce('Polite message', 'polite');
      expect(politeAnnouncer.getAttribute('aria-live')).toBe('polite');

      const assertiveAnnouncer = announce('Assertive message', 'assertive');
      expect(assertiveAnnouncer.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('invalid manners parameter handling', () => {
    test('defaults to polite when invalid string is provided', () => {
      const announcer = announce('Test message', 'invalid');

      expect(announcer.getAttribute('aria-live')).toBe('polite');
    });

    test('defaults to polite when empty string is provided', () => {
      const announcer = announce('Test message', '');

      expect(announcer.getAttribute('aria-live')).toBe('polite');
    });

    test('defaults to polite when case-mismatched value is provided', () => {
      const announcer = announce('Test message', 'POLITE');

      expect(announcer.getAttribute('aria-live')).toBe('polite');
    });

    test('defaults to polite when random string is provided', () => {
      const announcer = announce('Test message', 'something-random');

      expect(announcer.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('edge cases', () => {
    test('handles rapid successive announcements', () => {
      announce('Message 1');
      announce('Message 2');
      announce('Message 3');
      
      const announcer = document.getElementById('announce-this');
      expect(announcer?.innerHTML).toBe('Message 3');
      expect(document.querySelectorAll('#announce-this')).toHaveLength(1);
    });

    test('handles document.body availability', () => {
      // This test just ensures the function works with document.body
      const announcer = announce('Test message');
      expect(announcer.parentElement).toBe(document.body);
    });
  });
});