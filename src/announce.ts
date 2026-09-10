type Manners = 'polite' | 'assertive';

const ANNOUNCER_ID = 'announce-this';
const ANNOUNCER_STYLE =
  'position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;';

/** How long a message stays in the region before it is cleared. */
const CLEAR_DELAY = 500;

/**
 * How long to wait after creating the live region before writing to it.
 *
 * Screen readers only announce mutations to a live region that was already in
 * the accessibility tree when the mutation happened. Creating the region and
 * writing to it in the same task announces nothing at all: the AT sees a node
 * appear with content already inside it, which is an insertion, not a change
 * to a live region. That is why the first announce() of a page session was
 * silent while every later one worked.
 *
 * The delay was measured rather than guessed:
 *
 *                          Chromium      WebKit        Chromium
 *                          macOS / VO    macOS / VO    Win 11 / NVDA
 *   one animation frame      silent        silent        silent
 *   two animation frames     spoke         spoke         spoke
 *   next macrotask (0ms)     spoke        SILENT         spoke
 *   100ms                    spoke         spoke         spoke
 *
 * (VoiceOver on macOS 26 with Safari 26 and Chrome; NVDA 2026.2 with Chrome
 * on Windows 11.) WebKit is the outlier: a macrotask is enough everywhere
 * else, so shipping setTimeout(0) would have looked correct on two of the
 * three pairings and been silent in Safari.
 *
 * The 100ms value is additionally confirmed on JAWS, which announces correctly
 * across the manual harness.
 *
 * A timeout is used rather than two animation frames because
 * requestAnimationFrame is paused in background and hidden tabs, where it may
 * never fire — an announcement that is never spoken is a worse failure than
 * one delayed by 100ms, which is below the perceptual threshold for speech
 * onset and is paid once per page session.
 *
 * Only the first announcement waits. Once the region is registered every
 * later call writes synchronously.
 */
const REGISTRATION_DELAY = 100;

const isValidManners = (value: any): value is Manners => {
  return value === 'polite' || value === 'assertive';
};

/**
 * Appended to every other repeat of the same message, so two consecutive
 * announcements are never the same string.
 *
 * Screen readers suppress text they have just spoken, independently of the DOM.
 * The region empties itself 500ms after each announcement, so a later repeat is
 * a genuine change from empty to text — and is still dropped. Nothing done to
 * the DOM alone fixes it: measured on VoiceOver with Brave, writing the same
 * string again, emptying and rewriting it on a later task, cycling aria-live
 * off and back, and replacing the child node were all silent. Alternating two
 * live regions appeared to work but only gives each region one pass before it
 * hits the same suppression.
 *
 * A non-breaking space is used rather than a zero-width space, which was also
 * measured and also silent — U+200B is treated as formatting and stripped from
 * the accessible name, while U+00A0 counts as content. It is not spoken.
 */
const REPEAT_MARKER = '\u00a0';

let clearTimer: number | null = null;
let registrationTimer: number | null = null;
let lastMessage: string | null = null;
let markerApplied = false;
let pending: { message: string; manners: Manners } | null = null;

/**
 * The region we have already waited for, compared by identity so that a region
 * removed from the DOM — a test resetting document.body, a framework tearing
 * down — is correctly treated as needing to register again.
 */
let registered: HTMLElement | null = null;

const applyMessage = (announcer: HTMLElement, message: string, manners: Manners): void => {
  // Alternate, rather than always append: two repeats in a row would otherwise
  // both end in the marker and be identical to each other again.
  markerApplied = message === lastMessage ? !markerApplied : false;
  lastMessage = message;

  announcer.setAttribute('aria-live', manners);
  announcer.textContent = markerApplied ? message + REPEAT_MARKER : message;

  if (clearTimer) {
    clearTimeout(clearTimer);
  }
  clearTimer = window.setTimeout(() => {
    announcer.textContent = '';
    clearTimer = null;
  }, CLEAR_DELAY);
};

const writeMessage = (announcer: HTMLElement, message: string, manners: Manners): void => {
  applyMessage(announcer, message, manners);
};

export const announce = (message: string, manners?: string): HTMLElement => {
  const validManners: Manners = isValidManners(manners) ? manners : 'polite';

  let announcer = document.getElementById(ANNOUNCER_ID) as HTMLElement | null;

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = ANNOUNCER_ID;
    announcer.setAttribute('style', ANNOUNCER_STYLE);
    // Set before insertion so the region enters the accessibility tree already
    // marked live, rather than being upgraded a moment later.
    announcer.setAttribute('aria-live', validManners);
    document.body.appendChild(announcer);

    registered = null;
    pending = null;
    lastMessage = null;
    markerApplied = false;
    if (registrationTimer) {
      clearTimeout(registrationTimer);
      registrationTimer = null;
    }
  }

  if (registered === announcer) {
    writeMessage(announcer, message, validManners);
    return announcer;
  }

  // Hold the message until the region has had time to register. Calls made in
  // the meantime replace it rather than queueing, matching the
  // replace-don't-accumulate behaviour of a single shared region — announcing
  // a stale message after the caller has already moved on would be worse than
  // dropping it.
  announcer.setAttribute('aria-live', validManners);
  pending = { message, manners: validManners };

  if (registrationTimer === null) {
    registrationTimer = window.setTimeout(() => {
      registrationTimer = null;
      const el = document.getElementById(ANNOUNCER_ID) as HTMLElement | null;
      const queued = pending;
      pending = null;
      if (!el || !queued) {
        return;
      }
      registered = el;
      writeMessage(el, queued.message, queued.manners);
    }, REGISTRATION_DELAY);
  }

  return announcer;
};
