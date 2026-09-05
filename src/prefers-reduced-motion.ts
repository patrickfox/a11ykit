const QUERY = '(prefers-reduced-motion: reduce)';
const DEFAULT_CLASS = 'prm';

export interface WatchReducedMotionOptions {
  /** Class toggled on the target. Defaults to `prm`. */
  className?: string;
  /** Element to toggle the class on. Defaults to `document.body`. */
  target?: HTMLElement;
}

const canMatchMedia = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

let _prefersReducedMotion: boolean = false;
let _initialized: boolean = false;

function setBodyClass(matches: boolean): void {
  // document.body is null for a script in <head>. Toggling the class is a
  // convenience; failing to read the preference because of it is not.
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle(DEFAULT_CLASS, matches);
  }
}

function updatePRM(e: MediaQueryListEvent): void {
  _prefersReducedMotion = e.matches;
  setBodyClass(_prefersReducedMotion);
}

/**
 * Returns whether the user has asked for reduced motion.
 *
 * On its first call this also toggles a `prm` class on `document.body` and
 * registers a listener that keeps the class in sync. Those side effects are
 * kept for backwards compatibility through 1.x; `watchReducedMotion()` is the
 * explicit, configurable, teardown-able version and is preferred for new code.
 *
 * Most reduced-motion handling needs no JavaScript at all — a CSS
 * `@media (prefers-reduced-motion: reduce)` block covers the majority of
 * cases. Reach for this when you need to branch in JS, or want to avoid
 * repeating the media query across many rules.
 */
function prefersReducedMotion(): boolean {
  if (!_initialized) {
    _initialized = true;

    if (!canMatchMedia()) {
      return _prefersReducedMotion;
    }

    const mql = window.matchMedia(QUERY);
    _prefersReducedMotion = mql.matches;

    mql.addEventListener('change', updatePRM);

    setBodyClass(_prefersReducedMotion);
  }

  return _prefersReducedMotion;
}

/**
 * Keeps a class in sync with the user's reduced-motion preference, and returns
 * a function that stops watching and removes the class.
 *
 * This is the side effect half of `prefersReducedMotion()`, separated so it can
 * be opted into, configured, and torn down — which matters for tests, for
 * single-page apps, and for hot reload, where the older function's permanent
 * listener cannot be removed.
 *
 * Safe to call before `document.body` exists: the class is applied once the
 * document is ready rather than being silently skipped.
 *
 * ```js
 * const stop = watchReducedMotion({ className: 'reduce-motion' });
 * // ...later
 * stop();
 * ```
 */
const watchReducedMotion = (options: WatchReducedMotionOptions = {}): (() => void) => {
  const className = options.className || DEFAULT_CLASS;

  // No matchMedia means SSR or a very old browser. Return a working no-op so
  // callers never have to guard the teardown.
  if (!canMatchMedia()) {
    return (): void => {
      /* nothing was ever registered */
    };
  }

  const mql = window.matchMedia(QUERY);
  let stopped = false;
  let onDomReady: (() => void) | null = null;

  const resolveTarget = (): HTMLElement | null => {
    if (options.target) {
      return options.target;
    }
    return typeof document !== 'undefined' ? document.body : null;
  };

  const apply = (matches: boolean): void => {
    const target = resolveTarget();
    if (target) {
      target.classList.toggle(className, matches);
      return;
    }

    // Called from <head>, before there is a body to mark. Wait for the
    // document rather than doing nothing at all.
    if (!onDomReady && typeof document !== 'undefined') {
      onDomReady = (): void => {
        onDomReady = null;
        if (!stopped) {
          apply(mql.matches);
        }
      };
      // once: true — the handler is only ever needed for the first apply, and
      // without it the listener outlives the watcher that registered it.
      document.addEventListener('DOMContentLoaded', onDomReady, { once: true });
    }
  };

  const onChange = (event: MediaQueryListEvent): void => {
    // removeEventListener normally makes this unreachable after teardown. The
    // guard makes the contract explicit: once stopped, this watcher never
    // touches the DOM again, whoever is still holding the handler.
    if (stopped) {
      return;
    }
    apply(event.matches);
  };

  apply(mql.matches);
  mql.addEventListener('change', onChange);

  return (): void => {
    if (stopped) {
      return;
    }
    stopped = true;

    mql.removeEventListener('change', onChange);

    if (onDomReady && typeof document !== 'undefined') {
      document.removeEventListener('DOMContentLoaded', onDomReady);
      onDomReady = null;
    }

    // Leaving the class behind would freeze the page in whatever state it was
    // in when watching stopped, which is worse than no class at all.
    const target = resolveTarget();
    if (target) {
      target.classList.remove(className);
    }
  };
};

export { prefersReducedMotion, watchReducedMotion };
