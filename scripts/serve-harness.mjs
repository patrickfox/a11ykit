#!/usr/bin/env node
/**
 * Serves the manual screen reader harness.
 *
 * Node rather than `python3 -m http.server`, because python3 is not present by
 * default on Windows and this is an npm project — node is the one runtime every
 * contributor is guaranteed to have. No dependencies; the library has none and
 * a dev server is not worth breaking that.
 *
 * Deliberately does NOT live-reload. The first-announce case depends on a
 * controlled page load, so a reload the tester did not ask for would silently
 * invalidate it, and an unexpected reload mid-run is disruptive when a screen
 * reader is reading the page.
 *
 * Usage: node scripts/serve-harness.mjs [--port 8080] [--no-open]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const ENTRY = '/test-manual/';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const startPort = Number(value('port', process.env.PORT || 8080));
const shouldOpen = !flag('no-open');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8'
};

// The harness only ever needs these. Everything else — .git, node_modules,
// dotfiles — stays unreachable rather than being exposed on a listening port.
const ALLOWED = ['test-manual', 'dist', 'package.json'];

const isAllowed = (abs) => {
  const rel = relative(ROOT, abs);
  if (rel.startsWith('..') || rel.includes(`${sep}..${sep}`)) return false;
  const top = rel.split(sep)[0];
  return ALLOWED.includes(top);
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    // The whole point is to retest a freshly built bundle; a cached module here
    // would have you testing the previous build without any sign of it.
    'Cache-Control': 'no-store, must-revalidate',
    ...headers
  });
  res.end(body);
};

const isFile = async (abs) => {
  const info = await stat(abs).catch(() => null);
  return Boolean(info && info.isFile());
};

const guidance = (pathname) => `Not found: ${pathname}

The harness pages live under /test-manual/:

  ${ENTRY}                       main harness
  ${ENTRY}announce-init.html     live region initialization rig
`;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = ENTRY;
    if (pathname.endsWith('/')) pathname += 'index.html';

    const abs = resolve(join(ROOT, pathname));

    if (!isAllowed(abs)) {
      // A bare filename almost always means the harness directory — someone
      // dropped the /test-manual/ prefix. Send them where they meant to go
      // rather than answering a typo with "Forbidden", which reads as a
      // permissions fault in the server rather than a wrong path.
      const inHarness = resolve(join(ROOT, 'test-manual', pathname));
      if (isAllowed(inHarness) && (await isFile(inHarness))) {
        const target = `/test-manual${pathname}${url.search}`;
        return send(res, 302, `Redirecting to ${target}`, { Location: target });
      }
      // Genuinely outside the allowlist. Say which, so it is clear this is the
      // allowlist doing its job and not a broken path.
      const exists = await isFile(abs);
      return send(res, exists ? 403 : 404, exists
        ? `Forbidden: ${pathname}\n\nThis server only exposes ${ALLOWED.join(', ')}.\n`
        : guidance(pathname));
    }

    if (!(await isFile(abs))) return send(res, 404, guidance(pathname));

    const body = await readFile(abs);
    send(res, 200, body, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
  } catch (err) {
    send(res, 500, `Server error: ${err.message}`);
  }
});

const openBrowser = (url) => {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start'
    : 'xdg-open';
  try {
    spawn(cmd, [url], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' })
      .on('error', () => {})
      .unref();
  } catch { /* opening is a convenience, never a failure */ }
};

// Registered once, not per attempt: passing a callback to server.listen() adds
// a 'listening' listener that survives a failed bind, so retrying would leave
// one banner queued per attempt, each closing over a port it never got.
server.once('listening', () => {
  const { port } = server.address();
  const url = `http://localhost:${port}${ENTRY}`;
  console.log(`
  A11yKit screen reader harness

    ${url}
    ${url}announce-init.html   (live region initialization rig)

  Turn your screen reader on before you start, and work top to bottom —
  the first case is only valid on a fresh page load.

  This server does not auto-reload. After changing the library, run
  'npm run build:only' and reload the page yourself.

  Ctrl+C to stop.
`);
  if (shouldOpen) openBrowser(url);
});

// Claiming a fixed port fails outright when something else holds it, which is
// a poor reason to be unable to run the tests.
const listen = (port, attemptsLeft = 10) => {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`  port ${port} is in use, trying ${port + 1}...`);
      return listen(port + 1, attemptsLeft - 1);
    }
    console.error(`\n  Could not start the server: ${err.message}\n`);
    process.exit(1);
  });
  server.listen(port);
};

if (!existsSync(join(ROOT, 'dist/a11ykit.esm.js'))) {
  console.error(`
  dist/a11ykit.esm.js is missing.

  The harness tests the built bundle, not src/. Run:

    npm run build:only
`);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close();
    console.log('\n  Harness server stopped.\n');
    process.exit(0);
  });
}

listen(startPort);
