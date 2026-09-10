import { announce } from '../src/announce';

/**
 * The first announcement of a page session is deferred so the live region can
 * register in the accessibility tree before it is written to; see the comment
 * on REGISTRATION_DELAY in src/announce.ts. Tests that assert on content must
 * therefore let that delay elapse.
 */
const REGISTRATION_DELAY = 100;
const flushRegistration = (): void => {
  jest.advanceTimersByTime(REGISTRATION_DELAY);
};

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
    test('sets the provided message as text', () => {
      const message = 'Success! Your changes have been saved.';
      const announcer = announce(message);
      flushRegistration();

      expect(announcer.textContent).toBe(message);
    });

    test('replaces previous message', () => {
      const announcer = announce('First message');
      flushRegistration();
      announce('Second message');

      expect(announcer.textContent).toBe('Second message');
    });

    test('treats markup in messages as literal text', () => {
      const htmlMessage = '<strong>Error:</strong> Please try again.';
      const announcer = announce(htmlMessage);
      flushRegistration();

      expect(announcer.textContent).toBe(htmlMessage);
      expect(announcer.children.length).toBe(0);
    });

    test('does not execute markup passed as a message', () => {
      const announcer = announce('<img src=x onerror="window.__xss = true">');

      expect(announcer.querySelector('img')).toBeNull();
      expect((window as any).__xss).toBeUndefined();
    });

    test('handles empty messages', () => {
      const announcer = announce('');
      
      expect(announcer.innerHTML).toBe('');
    });
  });

  describe('timeout behavior', () => {
    test('clears message after 500ms', () => {
      const announcer = announce('Test message');
      flushRegistration();

      expect(announcer.textContent).toBe('Test message');

      jest.advanceTimersByTime(500);

      expect(announcer.textContent).toBe('');
    });

    test('cancels previous timeout when new message is announced', () => {
      const announcer = announce('First message');
      flushRegistration();

      jest.advanceTimersByTime(250); // Advance partway through the clear delay
      expect(announcer.textContent).toBe('First message');

      announce('Second message'); // This should cancel the first timeout
      expect(announcer.textContent).toBe('Second message');

      jest.advanceTimersByTime(500); // Complete the second timeout
      expect(announcer.textContent).toBe(''); // Now it should be cleared
    });

    test('uses window.setTimeout for browser compatibility', () => {
      const windowSetTimeoutSpy = jest.spyOn(window, 'setTimeout');

      announce('Test message');
      expect(windowSetTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), REGISTRATION_DELAY);

      flushRegistration();
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
      flushRegistration();

      const announcer = document.getElementById('announce-this');
      expect(announcer?.textContent).toBe('Message 3');
      expect(document.querySelectorAll('#announce-this')).toHaveLength(1);
    });

    test('handles document.body availability', () => {
      // This test just ensures the function works with document.body
      const announcer = announce('Test message');
      expect(announcer.parentElement).toBe(document.body);
    });
  });

  describe('live region registration', () => {
    test('does not write the first message in the creating task', () => {
      // Writing on creation is what made the first announcement of a page
      // session silent: the AT sees a node appear with content already in it,
      // which is an insertion rather than a change to a live region.
      const announcer = announce('First announcement');

      expect(announcer.textContent).toBe('');
      expect(document.getElementById('announce-this')).toBe(announcer);
    });

    test('writes the first message once the region has registered', () => {
      const announcer = announce('First announcement');
      flushRegistration();

      expect(announcer.textContent).toBe('First announcement');
    });

    test('writes synchronously once registered', () => {
      announce('First');
      flushRegistration();

      const announcer = announce('Second');
      expect(announcer.textContent).toBe('Second');
    });

    test('marks the region live before it is inserted', () => {
      // The region has to enter the accessibility tree already live, rather
      // than being upgraded afterwards.
      const announcer = announce('Message', 'assertive');

      expect(announcer.getAttribute('aria-live')).toBe('assertive');
    });

    test('announces the latest message when several arrive before registration', () => {
      // A single shared region replaces rather than accumulates. Announcing a
      // stale message after the caller has moved on would be worse than
      // dropping it, so the most recent one wins.
      announce('Stale');
      announce('Also stale');
      announce('Current');
      flushRegistration();

      expect(document.getElementById('announce-this')?.textContent).toBe('Current');
    });

    test('honours the manner of the latest pre-registration message', () => {
      announce('Polite one', 'polite');
      announce('Urgent one', 'assertive');
      flushRegistration();

      const announcer = document.getElementById('announce-this');
      expect(announcer?.textContent).toBe('Urgent one');
      expect(announcer?.getAttribute('aria-live')).toBe('assertive');
    });

    test('waits again if the region is removed from the DOM', () => {
      announce('First');
      flushRegistration();
      expect(document.getElementById('announce-this')?.textContent).toBe('First');

      // A framework teardown, or a test resetting the body, detaches the
      // region. The replacement is a new node and has to register again.
      document.body.innerHTML = '';

      const replacement = announce('After teardown');
      expect(replacement.textContent).toBe('');

      flushRegistration();
      expect(replacement.textContent).toBe('After teardown');
    });

    const MARKER = '\u00a0';

    test('a repeated message is never the same string twice running', () => {
      // Screen readers suppress text they have just spoken, independently of
      // the DOM — so the repeat has to differ textually, not just be re-written.
      announce('Item added to cart');
      flushRegistration();
      const announcer = document.getElementById('announce-this')!;
      expect(announcer.textContent).toBe('Item added to cart');

      announce('Item added to cart');
      expect(announcer.textContent).toBe('Item added to cart' + MARKER);

      // Alternating, not accumulating: a third repeat must differ from the
      // second, which means dropping the marker again rather than adding one.
      announce('Item added to cart');
      expect(announcer.textContent).toBe('Item added to cart');
    });

    test('the marker is a single non-breaking space, and is not visible text', () => {
      announce('Saved');
      flushRegistration();
      announce('Saved');

      const announcer = document.getElementById('announce-this')!;
      expect(announcer.textContent).toBe('Saved' + MARKER);
      // Trimmed, it is the message the caller passed.
      expect(announcer.textContent!.trim()).toBe('Saved');
    });

    test('a different message is written plainly', () => {
      announce('First');
      flushRegistration();
      const announcer = document.getElementById('announce-this')!;

      announce('Second');

      expect(announcer.textContent).toBe('Second');
    });

    test('a different message resets the alternation', () => {
      announce('A');
      flushRegistration();
      const announcer = document.getElementById('announce-this')!;

      announce('A');
      expect(announcer.textContent).toBe('A' + MARKER);

      announce('B');
      expect(announcer.textContent).toBe('B');

      // Back to A: a fresh message, so no marker.
      announce('A');
      expect(announcer.textContent).toBe('A');
    });

    test('a repeat still applies a changed manner', () => {
      announce('Connection lost');
      flushRegistration();
      const announcer = document.getElementById('announce-this')!;

      announce('Connection lost', 'assertive');

      expect(announcer.textContent).toBe('Connection lost' + MARKER);
      expect(announcer.getAttribute('aria-live')).toBe('assertive');
    });

    test('a repeat is written immediately, with no added delay', () => {
      announce('Saved');
      flushRegistration();
      const announcer = document.getElementById('announce-this')!;

      announce('Saved');

      // Nothing to wait for — the text already differs.
      expect(announcer.textContent).toBe('Saved' + MARKER);
    });

    test('a repeat still clears itself after the usual delay', () => {
      announce('Saved');
      flushRegistration();
      const announcer = document.getElementById('announce-this')!;

      announce('Saved');
      jest.advanceTimersByTime(500);

      expect(announcer.textContent).toBe('');
    });

    test('a repeat after the region has emptied still differs', () => {
      // The case that failed in the wild: the auto-clear runs, so the second
      // write is a real DOM change — and was still suppressed.
      announce('Item added to cart');
      flushRegistration();
      const announcer = document.getElementById('announce-this')!;

      jest.advanceTimersByTime(500);
      expect(announcer.textContent).toBe('');

      announce('Item added to cart');
      expect(announcer.textContent).toBe('Item added to cart' + MARKER);
    });

    test('restarts the delay if the region is replaced mid-wait', () => {
      // The pending timer belongs to the region that scheduled it. If that
      // region is torn down before it fires, the replacement is a brand-new
      // node that has to register from scratch — letting the original timer
      // fire on the new region would write to it too early and be silent,
      // which is the very bug being fixed.
      announce('First');
      jest.advanceTimersByTime(REGISTRATION_DELAY - 50);

      document.body.innerHTML = '';
      const replacement = announce('Second');

      // The original timer's deadline passes here; nothing may be written yet.
      jest.advanceTimersByTime(50);
      expect(replacement.textContent).toBe('');

      jest.advanceTimersByTime(50);
      expect(replacement.textContent).toBe('Second');
    });

    test('only the first announcement pays the delay', () => {
      const spy = jest.spyOn(window, 'setTimeout');

      announce('First');
      flushRegistration();
      spy.mockClear();

      announce('Second');
      const delays = spy.mock.calls.map((call) => call[1]);
      expect(delays).not.toContain(REGISTRATION_DELAY);
      expect(delays).toContain(500);
    });

    test('a message announced before registration is not spoken twice', () => {
      announce('Only once');
      flushRegistration();

      const announcer = document.getElementById('announce-this')!;
      expect(announcer.textContent).toBe('Only once');

      // Nothing further should be pending; advancing time must not rewrite it.
      jest.advanceTimersByTime(REGISTRATION_DELAY);
      expect(announcer.textContent).toBe('Only once');
    });
  });
});