import { ariaHide, ariaUnhide } from '../src/aria-hide';

/**
 * jsdom does not implement `inert`: the property is absent from
 * HTMLElement.prototype, and assigning it creates a plain expando with no
 * attribute reflection and no behaviour. Most suites here install this shim,
 * which reflects the attribute the way a supporting browser does. The
 * unsupported-browser suite deliberately does not.
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
    document.body.removeAttribute('inert');
    document.body.removeAttribute('data-a11ykit-inert');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('inert');
    document.body.removeAttribute('data-a11ykit-inert');
  });

  const sandbox = (markup?: string): HTMLElement => {
    const container = document.createElement('div');
    container.innerHTML =
      markup === undefined
        ? '<a href="/x">A link</a><button type="button">A button</button>' +
          '<input aria-label="Email"><select aria-label="Pick"></select>'
        : markup;
    document.body.appendChild(container);
    return container;
  };

  describe('ariaHide', () => {
    withInertSupport();

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

    test('leaves an existing tabindex untouched', () => {
      const container = sandbox('<a href="/x" tabindex="2">Link</a>');

      ariaHide(container);

      expect(container.querySelector('a')!.getAttribute('tabindex')).toBe('2');
    });

    test('covers content added after hiding', () => {
      // The limitation that motivated the rewrite: the 1.x implementation
      // snapshotted once, so late-rendered content stayed tabbable.
      const container = sandbox();
      ariaHide(container);

      const late = document.createElement('button');
      container.appendChild(late);

      expect(late.hasAttribute('tabindex')).toBe(false);
      expect(container.hasAttribute('inert')).toBe(true);
    });

    test('uses document.body as default when no parent provided', () => {
      ariaHide();

      expect(document.body.hasAttribute('inert')).toBe(true);
    });

    test('handles a container with nothing focusable in it', () => {
      const container = sandbox('<p>Just text.</p>');

      expect(() => ariaHide(container)).not.toThrow();
      expect(container.hasAttribute('inert')).toBe(true);
    });

    test('handles an empty container', () => {
      const container = sandbox('');

      expect(() => ariaHide(container)).not.toThrow();
      expect(container.hasAttribute('inert')).toBe(true);
    });

    test('handles a detached element', () => {
      const container = document.createElement('div');
      container.innerHTML = '<button>b</button>';

      ariaHide(container);

      expect(container.hasAttribute('inert')).toBe(true);
    });

    test('nested containers each track their own state', () => {
      const outer = sandbox('<div data-inner><a href="/x">Inner</a></div>');
      const inner = outer.querySelector('[data-inner]') as HTMLElement;

      ariaHide(inner);
      ariaHide(outer);

      expect(inner.hasAttribute('inert')).toBe(true);
      expect(outer.hasAttribute('inert')).toBe(true);

      ariaUnhide(outer);

      expect(outer.hasAttribute('inert')).toBe(false);
      expect(inner.hasAttribute('inert')).toBe(true);

      ariaUnhide(inner);

      expect(inner.hasAttribute('inert')).toBe(false);
    });

    test('hiding twice is idempotent, and one unhide reverses it', () => {
      const container = sandbox();

      ariaHide(container);
      ariaHide(container);
      ariaUnhide(container);

      expect(container.hasAttribute('inert')).toBe(false);
    });
  });

  describe('ariaUnhide', () => {
    withInertSupport();

    test('clears inert', () => {
      const container = sandbox();

      ariaHide(container);
      ariaUnhide(container);

      expect(container.hasAttribute('inert')).toBe(false);
      expect(container.inert).toBe(false);
    });

    test('removes its own marker attribute', () => {
      const container = sandbox();

      ariaHide(container);
      ariaUnhide(container);

      expect(container.hasAttribute('data-a11ykit-inert')).toBe(false);
    });

    test('leaves an inert the caller set alone', () => {
      // Someone else's inert is not ours to clear.
      const container = sandbox();
      container.setAttribute('inert', '');

      ariaHide(container);
      ariaUnhide(container);

      expect(container.hasAttribute('inert')).toBe(true);
    });

    test('uses document.body as default when no parent provided', () => {
      ariaHide();
      ariaUnhide();

      expect(document.body.hasAttribute('inert')).toBe(false);
    });

    test('is safe when hide was never called', () => {
      const container = sandbox();

      expect(() => ariaUnhide(container)).not.toThrow();
      expect(container.hasAttribute('inert')).toBe(false);
    });

    test('a complete cycle leaves no attributes behind', () => {
      const container = sandbox();
      const before = container.outerHTML;

      ariaHide(container);
      ariaUnhide(container);

      expect(container.outerHTML).toBe(before);
    });
  });

  describe('without inert support', () => {
    // No shim here: jsdom's own lack of inert is exactly the condition under
    // test. 1.1.x remains the supported option for these browsers, so the
    // library says so rather than failing silently.
    let warn: jest.SpyInstance;

    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      warn.mockRestore();
    });

    test('warns rather than failing silently', () => {
      ariaHide(sandbox());

      expect(warn).toHaveBeenCalled();
      expect(warn.mock.calls[0][0]).toMatch(/inert/);
      expect(warn.mock.calls[0][0]).toMatch(/1\.1\.x/);
    });

    test('does not write inert, since the browser would ignore it', () => {
      // Setting the attribute would look like success while leaving the
      // subtree fully reachable.
      const container = sandbox();

      ariaHide(container);

      expect(container.hasAttribute('inert')).toBe(false);
      expect(container.hasAttribute('data-a11ykit-inert')).toBe(false);
    });

    test('does not throw', () => {
      const container = sandbox();

      expect(() => ariaHide(container)).not.toThrow();
      expect(() => ariaUnhide(container)).not.toThrow();
    });
  });
});
