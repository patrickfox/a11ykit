/**
 * @jest-environment node
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';

/**
 * Smoke-tests the manual harness against the built bundle.
 *
 * The sync guard checks the harness has a case per export; this checks the page
 * still runs and that its buttons actually drive the library. Without it the
 * harness can rot into a page that renders but does nothing, which is worse than
 * no harness at all — you would record passes against a dead page.
 *
 * Skipped when dist/ is absent, since `npm run build` runs tests before rollup.
 */

const ROOT = join(__dirname, '..');
const BUNDLE = join(ROOT, 'dist/a11ykit.esm.js');
const HARNESS = join(ROOT, 'test-manual/index.html');

const describeIfBuilt = existsSync(BUNDLE) ? describe : describe.skip;

describeIfBuilt('manual harness runs against the built bundle', () => {
  let doc: Document;
  let win: Window & typeof globalThis;
  const errors: string[] = [];

  beforeAll(() => {
    // jsdom does not resolve ES imports, so inline the bundle. It is minified,
    // so its export statement aliases mangled names — rewrite those into
    // declarations rather than stripping them, or nothing is reachable.
    const raw = readFileSync(BUNDLE, 'utf8').replace(/^\/\/# sourceMappingURL=.*$/m, '');
    const inlined = raw.replace(/export\s*\{([^}]*)\};?/, (_m, body: string) =>
      body
        .split(',')
        .map((pair) => {
          const [internal, external] = pair.split(/\s+as\s+/).map((s) => s.trim());
          return `const ${external || internal} = ${internal};`;
        })
        .join('\n')
    );

    const html = readFileSync(HARNESS, 'utf8')
      .replace(/import \{[^}]+\}\s*from\s*'\.\.\/dist\/a11ykit\.esm\.js';/, inlined)
      .replace(/<script type="module">\s*\/\/ Surfaces[\s\S]*?<\/script>/, '')
      .replace(/<script type="module">/g, '<script>');

    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (e: Error) => errors.push(e.message));

    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      virtualConsole,
      url: 'http://localhost:8080/test-manual/'
    });
    win = dom.window as unknown as Window & typeof globalThis;
    doc = dom.window.document;
  });

  const button = (caseId: string, label: string): HTMLButtonElement => {
    const scope = doc.querySelector(`[data-case="${caseId}"]`)!;
    const found = [...scope.querySelectorAll('.controls button')].find(
      (b) => b.textContent === label
    );
    if (!found) throw new Error(`No "${label}" button in case ${caseId}`);
    return found as HTMLButtonElement;
  };

  test('page executes without script errors', () => {
    expect(errors).toEqual([]);
  });

  test('renders a case for every public export', () => {
    // Derived from index.ts rather than hardcoded, so adding an export fails
    // this for the right reason instead of needing the list updated by hand.
    const indexSrc = readFileSync(join(ROOT, 'src/index.ts'), 'utf8');
    const expected = new Set<string>();
    const re = /export\s*\{([^}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(indexSrc)) !== null) {
      if (/export\s+type/.test(indexSrc.slice(Math.max(0, match.index - 7), match.index + 7))) {
        continue; // type-only exports have no runtime behaviour to exercise
      }
      for (const part of match[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop()?.trim();
        if (name) expected.add(name);
      }
    }

    const apis = new Set([...doc.querySelectorAll('.case')].map((c) => (c as HTMLElement).dataset.api));
    expect(apis).toEqual(expected);
  });

  test('every case states what to do, what to expect, and what fails', () => {
    for (const c of doc.querySelectorAll('.case')) {
      const dds = [...c.querySelectorAll('dl.spec dd')];
      expect(dds).toHaveLength(3);
      for (const dd of dds) expect(dd.textContent!.trim()).not.toBe('');
    }
  });

  test('no live region exists before a test is run', () => {
    // The first-announce case is only meaningful on a page that has not yet
    // created the region, so nothing may create it during load.
    expect(doc.getElementById('announce-this')).toBeNull();
  });

  test('announce case populates the live region with literal text', async () => {
    // The first announcement is deferred so the region can register in the
    // accessibility tree; see REGISTRATION_DELAY in src/announce.ts. Real
    // timers here, so wait it out rather than assert synchronously.
    button('announce-first', 'Announce').click();
    const region = doc.getElementById('announce-this')!;
    expect(region.textContent).toBe('');

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(region.textContent).toBe('First announcement after load');

    // Registered now, so this one writes immediately.
    button('announce-escaping', 'Announce markup').click();
    expect(region.querySelector('strong')).toBeNull();
    expect(region.textContent).toBe('<strong>Saved</strong>');
  });

  test('ariaHide and ariaUnhide cases drive the real functions', () => {
    const sandbox = doc.querySelector('[data-case="ariahide-basic"] [data-sandbox]')!;
    const link = sandbox.querySelector('a')!;

    button('ariahide-basic', 'Hide').click();
    expect(sandbox.getAttribute('aria-hidden')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');

    button('ariahide-basic', 'Unhide').click();
    expect(sandbox.hasAttribute('aria-hidden')).toBe(false);
    expect(link.hasAttribute('tabindex')).toBe(false);
  });

  test('recording a verdict updates state and reaches the report', () => {
    const radio = doc.querySelector<HTMLInputElement>(
      'input[name="v-announce-first"][value="pass"]'
    )!;
    radio.checked = true;
    radio.dispatchEvent(new win.Event('change', { bubbles: true }));

    const section = doc.querySelector<HTMLElement>('[data-case="announce-first"]')!;
    expect(section.dataset.result).toBe('pass');

    doc.getElementById('btn-report')!.click();
    const report = doc.querySelector<HTMLTextAreaElement>('#report')!.value;
    expect(report).toContain('| Case | Result | Notes |');
    expect(report).toContain('✅ pass');
  });
});
