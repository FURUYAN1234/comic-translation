import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('application version changes leave registry dependency versions consistent with their tarballs', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  for (const [path, dependency] of Object.entries(lock.packages)) {
    if (!dependency.resolved?.startsWith('https://registry.npmjs.org/')) continue;
    const name = path.split('/').at(-1);
    const archive = decodeURIComponent(new URL(dependency.resolved).pathname.split('/').at(-1));
    assert.equal(archive, `${name}-${dependency.version}.tgz`, `${path}: version metadata must describe the actual registry tarball`);
  }
});
