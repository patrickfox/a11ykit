import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guards the manual screen reader harness against drift.
 *
 * The harness in test-manual/ verifies behavior that jsdom cannot observe, so
 * nothing else will notice if it falls behind the API. These tests fail the
 * build when an export has no coverage there, which is the only thing that
 * reliably keeps a manual test page current.
 */

const ROOT = join(__dirname, '..');
const indexSrc = readFileSync(join(ROOT, 'src/index.ts'), 'utf8');
const harness = readFileSync(join(ROOT, 'test-manual/index.html'), 'utf8');

const publicExports = (): string[] => {
  const names = new Set<string>();
  const re = /export\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(indexSrc)) !== null) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name);
    }
  }
  return [...names];
};

describe('manual test harness stays in sync with the public API', () => {
  const exports = publicExports();

  test('src/index.ts exports were parsed', () => {
    expect(exports.length).toBeGreaterThan(0);
  });

  test.each(publicExports())('%s has at least one harness case', (name) => {
    // Cases declare the export they exercise via `api:`, which is mirrored
    // onto the rendered section as data-api.
    const declared = new RegExp(`api:\\s*['"]${name}['"]`).test(harness);
    expect(declared).toBe(true);
  });

  test('harness imports the built bundle, not the TypeScript source', () => {
    // Testing src/ through a bundler would verify something users never receive.
    expect(harness).toContain('../dist/a11ykit.esm.js');
    expect(harness).not.toMatch(/from\s+['"]\.\.\/src\//);
  });

  test('harness imports every public export', () => {
    const importBlock = harness.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/dist/);
    expect(importBlock).not.toBeNull();
    const imported = importBlock![1].split(',').map((s) => s.trim());
    for (const name of exports) {
      expect(imported).toContain(name);
    }
  });

  test('harness declares no live regions of its own', () => {
    // Anything the harness announces would contaminate the measurement, since
    // the tester cannot tell A11yKit's output from the page's own.
    expect(harness).not.toMatch(/aria-live=/);
    expect(harness).not.toMatch(/role="status"/);
    // role="alert" is permitted on the bundle-load error only, which is a
    // hard failure state where no test can run anyway.
    const alerts = harness.match(/role="alert"/g) || [];
    expect(alerts.length).toBeLessThanOrEqual(1);
  });
});
