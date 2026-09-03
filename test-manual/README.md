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

## How it works

The harness imports `../dist/a11ykit.esm.js`, the artifact that actually ships.
Testing `src/` through a bundler would verify something no consumer receives,
and it would not catch a packaging regression. As a side effect, this page is a
live check on the no-build CDN path documented in the README: if the ESM bundle
ever grows a bare specifier, the page stops loading.

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

## Expected failures

One case is expected to fail today: *content added after hiding stays in the tab
order*. `ariaHide()` takes a one-time snapshot, so anything rendered into the
subtree afterwards is still tabbable. This is a documented limitation, not a
regression. The case exists so the 2.0.0 `inert` migration is measurable — it
should flip to pass with no other change.

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

Add an entry to the `CASES` array in `index.html`. Every case needs an `api`
field naming the export it exercises. `tests/harness-sync.test.ts` fails the
build if a public export has no case, so a new function in `src/index.ts`
cannot ship without one — that guard is what keeps this page from going stale.

`tests/harness-smoke.test.ts` separately loads this page against the built
bundle and checks the buttons still drive the library, so the harness cannot rot
into a page that renders but does nothing.
