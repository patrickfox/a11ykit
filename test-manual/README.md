# Manual screen reader test harness

The jsdom suite verifies DOM state. It cannot verify what a screen reader
actually says, and some of A11yKit's most important behavior is only observable
that way — a dropped first announcement, whether `polite` really waits its turn,
whether hidden content is genuinely unreachable. This page covers that gap.

## Running it

```bash
npm run test:manual
```

That builds the bundle, starts a server, and opens the page. If you have
already built and just want the server back:

```bash
npm run test:manual:serve
```

Options pass through after `--`:

```bash
npm run test:manual -- --port 3000   # start from a different port
npm run test:manual -- --no-open     # don't open a browser
```

The page must be served over HTTP — ES modules do not load from `file://`, so
opening the file directly will not work.

The server is a dependency-free Node script (`scripts/serve-harness.mjs`). It
picks the next free port if yours is taken, serves only `test-manual/`, `dist/`
and `package.json`, and sends `no-store` so a rebuild is never masked by a
cached module.

**It does not auto-reload, on purpose.** The first case depends on a controlled
page load, so a reload you did not ask for would silently invalidate it — and an
unexpected reload is disruptive when a screen reader is mid-sentence. After
changing the library, run `npm run build:only` and reload the page yourself.

## Testing from a VM or a second machine

Cross-screen-reader testing usually means Windows for NVDA and JAWS, so the
server binds all interfaces by default. The startup banner prints the address
to use:

```
  From another device or VM on this network:

    http://192.168.1.209:8080/test-manual/
```

`localhost` will not work from the VM — there it means the VM itself. Use the
host machine's LAN address, as printed.

- **Parallels, VMware, UTM** (shared or bridged networking): the LAN address
  above works as-is.
- **VirtualBox with NAT**: the host is reachable at `10.0.2.2` instead, so use
  `http://10.0.2.2:8080/test-manual/`.
- macOS may ask whether `node` should accept incoming connections the first
  time. It has to be allowed, or the VM cannot connect.

To keep the server on this machine only:

```bash
npm run test:manual -- --host 127.0.0.1
```

**Results are stored per origin.** `http://localhost:8080` and
`http://192.168.1.209:8080` are different origins, so each keeps its own
verdicts and environment fields — even in the same browser on the same machine.
That is usually what you want, since a VM run is a different environment
anyway, but it does mean switching between the two URLs on one machine will
appear to lose your results. They are not gone; they belong to the other origin.
Generate and copy the report before switching.

## How it works

The harness imports `../dist/a11ykit.esm.js`, the artifact that actually ships.
Testing `src/` through a bundler would verify something no consumer receives,
and it would not catch a packaging regression. As a side effect, this page is a
live check on the no-build CDN path documented in the README: if the ESM bundle
ever grows a bare specifier, the page stops loading.

Cases are numbered by API surface — `1.x` for `announce()`, `2.x` for
`access()`, and so on — so a result can be referred to by number rather than by
quoting its title. The numbers come from position, not from anything written
down, so inserting a case renumbers the ones after it rather than leaving a gap.

Each case states three things:

- **Do** — the action to take
- **Expect** — what you should hear
- **Fails if** — the specific symptom that means it is broken

That last line matters most. Without it, silence is ambiguous: you cannot tell a
bug from a screen reader that simply had nothing to say.

Results are kept in `localStorage`, so a reload does not lose your run. **Generate
markdown report** produces a table you can paste straight into an issue.

## Two things to know before you run it

**Work top to bottom, on a fresh load.** The first case tests whether the very
first announcement of a page session is spoken (issue #15). The live region is
created on first use, and several screen readers ignore mutations to a region
that was not already in the accessibility tree. Once anything has announced, the
case is no longer meaningful — the harness detects this and disables it, telling
you to reload.

**The harness is deliberately silent.** It declares no live regions of its own
and never announces its own state changes, so anything you hear comes from
A11yKit rather than the page around it. `tests/harness-sync.test.ts` enforces
this; please keep it true when adding cases.

## The live region initialization rig

<http://localhost:8080/test-manual/announce-init.html>

A separate, focused rig for one question: why the first
`announce()` of a page session is silent, and which fix works on real assistive
technology.

It exists because the reports so far are ambiguous in a way that changes the
fix. Every observed success involved a **manner change** — polite → assertive,
or assertive → polite. Two explanations fit:

- **Ordinality.** The region must be in the accessibility tree before any
  content write. Predicts the second announcement speaks in *every* sequence,
  including polite → polite.
- **The `aria-live` change.** Each call sets `aria-live` to `off` and back, so
  same-manner is `polite → off → polite`, which nets to no change once the AT
  coalesces the task. Predicts same-manner sequences fail on the second call
  too — a worse bug than issue #15 describes, since consecutive same-manner
  announcements are the common case.

**Part 1** runs four sequences against the unchanged implementation.
polite → polite is the deciding one.

**Part 3** tackles a separate failure: announcing the same string twice in a row
is silent on Chromium while working on WebKit and Gecko. It is not a missing DOM
change — the region empties itself after 500ms, so the second write genuinely
changes the content from empty to text. Something above the DOM suppresses text
it just spoke. Each variant pre-registers the region so registration is not a
factor, then asks only whether a second, identical announcement is heard.

**Part 2** tests candidate fixes. The last variant, *Proposed fix — two calls in
one task*, is the actual shape of the intended change rather than an isolated
timing probe: lazy creation, a macrotask before the first write, and a one-slot
queue. It makes two `announce()` calls in the same task, before the region has
registered, and asks which message you heard. Hearing the **first** one means
the queue replayed a stale message — an ordering bug — which is why it offers a
three-way verdict instead of spoke/silent.

The rest of Part 2 tests: deferring the content write by a frame, two
frames, or a macrotask; creating the region empty at load; cycling `aria-live`
during init; priming the region and clearing it; and two static regions with no
toggling at all. Each variant is marked for whether it is compatible with
`sideEffects: false`, since anything done at module load is not.

Each test needs a page with no live region on it, so selecting one reloads the
page. Run it, record what you heard, pick the next. The generated report reads
the result back for you and names the cheapest fix that works.

This page deliberately does not import the library — each variant is
implemented inline, because the point is to choose an implementation before
changing `src/announce.ts`.

## Verified results

The fix in `src/announce.ts` was chosen from these runs. `announce()` defers its
first write by 100ms; every later call is synchronous.

| Strategy | Chromium macOS / VO | WebKit macOS / VO | Chrome Win 11 / NVDA |
|---|---|---|---|
| Baseline (write on creation) | silent | silent | silent |
| One animation frame | silent | silent | silent |
| Two animation frames | spoke | spoke | spoke |
| Next macrotask (0ms) | spoke | **silent** | spoke |
| 100ms | spoke | spoke | spoke |
| Shipped fix, two calls in one task | — | — | spoke, correct message |

Tested with VoiceOver on macOS 26 (Safari 26, Chrome, Brave) and NVDA 2026.2
with Chrome on Windows 11. The shipped 100ms fix is additionally confirmed on
JAWS, which passes every case in the main harness.

WebKit is the outlier. A macrotask is sufficient everywhere else, so shipping
`setTimeout(0)` would have looked correct on two of the three pairings and been
silent in Safari. Two animation frames also works everywhere, but
`requestAnimationFrame` is paused in background tabs where it may never fire,
so the timeout is the safer primitive.

Part 1 was identical on all three: every manner sequence is silent on the first
announcement and speaks on the second, so the cause is ordinality rather than
the `aria-live` toggle.

One result is unexplained: *Empty region created at page load* was silent under
NVDA while *Two static regions* spoke, even though the two are mechanically
near-identical — both append an empty region with `aria-live` set at load and
then write `textContent` directly. A divergence between them is more likely a
missed announcement during a manual run than a real platform difference. It does
not affect the shipped fix, which creates the region lazily. Worth a re-run if
anyone revisits eager creation.

## 2.0 verification run

VoiceOver with Brave 1.94 on macOS, against the 2.0.0 build. Every case in the
main harness passes, re-confirmed after `ariaHide()` was simplified to require
`inert` outright.

The case worth calling out is *Content added after hiding is covered too*. It
was written as a deliberate expected failure to make the `inert` migration
measurable, and passes on 2.0 with no change to what it asks the tester to do —
so `inert` is confirmed working with a real screen reader, which is the one
thing jsdom cannot establish.

*The same message announced twice is spoken twice* failed on this run and was
fixed: a synchronous clear-and-rewrite of the same string is not a mutation, so
nothing was announced. Notably JAWS passed that case while VoiceOver failed it.

## Browsers without inert

2.0 requires `inert`. On an older browser `ariaHide()` warns once and does
nothing, so cases 3.1 to 3.4 will fail there by design — that is the library
telling you to use 1.1.x rather than silently leaving content reachable.

## Expected failures

None. The *content added after hiding* case was the standing exception through
1.x, where `ariaHide()` took a one-time snapshot and anything rendered into the
subtree afterwards stayed tabbable. 2.0 builds on `inert`, which the browser
enforces continuously, and the case now passes.

## Coverage worth recording

Behavior varies more across screen reader and browser pairings than across
operating systems. A useful run covers:

| Screen reader | Browser |
|---|---|
| NVDA | Firefox, Chrome |
| JAWS | Chrome |
| VoiceOver (macOS) | Safari |
| VoiceOver (iOS) | Safari |

Live region handling is the least consistent area between them, which is exactly
what most of these cases exercise.

## Adding a case

Add an entry to the `CASES` array in `index.html`, **next to the other cases for
the same API**. Numbering follows array order, so a case placed away from its
group starts a second group with the same heading — which is how the duplicate
`access` section was spotted. Every case needs an `api` field naming the export
it exercises. `tests/harness-sync.test.ts` fails the
build if a public export has no case, so a new function in `src/index.ts`
cannot ship without one — that guard is what keeps this page from going stale.

`tests/harness-smoke.test.ts` separately loads this page against the built
bundle and checks the buttons still drive the library, so the harness cannot rot
into a page that renders but does nothing.
