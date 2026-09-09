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
 * How long the region stays empty before a repeated message is written back.
 *
 * A screen reader observes the DOM after a task completes, not during it, so a
 * synchronous clear-and-rewrite of the same string is not a mutation at all —
 * the end state is identical to the start state and nothing is announced. The
 * clear has to land in its own task to be seen.
 */
const REPEAT_DELAY = 100;

let clearTimer: number | null = null;
let registrationTimer: number | null = null;
let repeatTimer: number | null = null;
let pending: { message: string; manners: Manners } | null = null;

/**
 * The region we have already waited for, compared by identity so that a region
 * removed from the DOM — a test resetting document.body, a framework tearing
 * down — is correctly treated as needing to register again.
 */
let registered: HTMLElement | null = null;

const applyMessage = (announcer: HTMLElement, message: string, manners: Manners): void => {
  announcer.setAttribute('aria-live', manners);
  announcer.textContent = message;

  if (clearTimer) {
    clearTimeout(clearTimer);
  }
  clearTimer = window.setTimeout(() => {
    announcer.textContent = '';
    clearTimer = null;
  }, CLEAR_DELAY);
};

const writeMessage = (announcer: HTMLElement, message: string, manners: Manners): void => {
  if (repeatTimer) {
    clearTimeout(repeatTimer);
    repeatTimer = null;
  }

  // Writing the same string the region already holds is not a change, so the
  // announcement is dropped. Empty it now and write back on a later task, which
  // the screen reader sees as two distinct mutations.
  if (announcer.textContent === message) {
    announcer.setAttribute('aria-live', 'off');
    announcer.textContent = '';

    repeatTimer = window.setTimeout(() => {
      repeatTimer = null;
      const el = document.getElementById(ANNOUNCER_ID) as HTMLElement | null;
      if (el) {
        applyMessage(el, message, manners);
      }
    }, REPEAT_DELAY);
    return;
  }

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
    if (repeatTimer) {
      clearTimeout(repeatTimer);
      repeatTimer = null;
    }
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
