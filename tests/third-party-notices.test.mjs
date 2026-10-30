import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import test from 'node:test';
import { build } from 'vite';
import { createNotices, noticesFile, verifyNotices } from '../scripts/third-party-notices.mjs';

const root = resolve(import.meta.dirname, '..');
function temporary(t) {
  const path = mkdtempSync(resolve(tmpdir(), 'comic-license-test-'));
  t.after(() => {
    assert.equal(dirname(path), resolve(tmpdir()));
    assert.ok(basename(path).startsWith('comic-license-test-'));
    rmSync(path, { recursive: true, force: true });
  });
  return path;
}
function fixture(t) {
  const path = temporary(t);
  cpSync(resolve(root, 'package-lock.json'), resolve(path, 'package-lock.json'));
  cpSync(resolve(root, 'LICENSE'), resolve(path, 'LICENSE'));
  for (const name of ['react', 'react-dom', 'scheduler', 'vite']) {
    for (const file of ['package.json', name === 'vite' ? 'LICENSE.md' : 'LICENSE']) {
      const target = resolve(path, 'node_modules', name, file);
      cpSync(resolve(root, 'node_modules', name, file), target);
    }
  }
  const text = createNotices(path);
  writeFileSync(resolve(path, noticesFile), text);
  cpSync(resolve(path, noticesFile), resolve(path, 'dist', noticesFile));
  cpSync(resolve(path, 'LICENSE'), resolve(path, 'dist', 'LICENSE.txt'));
  return path;
}
function change(path, edit) { writeFileSync(path, edit(readFileSync(path, 'utf8'))); }

test('normal production build automatically ships complete, current third-party licenses', async t => {
  const dist = temporary(t);
  await build({ root, logLevel: 'silent', build: { outDir: dist, emptyOutDir: true } });
  assert.ok(existsSync(resolve(dist, noticesFile)), 'built distribution must include THIRD_PARTY_NOTICES.txt');
  assert.equal(verifyNotices(root, dist), true);
  const text = readFileSync(resolve(dist, noticesFile), 'utf8');
  for (const name of ['react', 'react-dom', 'scheduler', 'vite']) {
    const pkg = JSON.parse(readFileSync(resolve(root, 'node_modules', name, 'package.json'), 'utf8'));
    assert.ok(text.includes(name + '@' + pkg.version));
    const file = name === 'vite' ? 'LICENSE.md' : 'LICENSE';
    assert.ok(text.includes(readFileSync(resolve(root, 'node_modules', name, file), 'utf8').replace(/\r\n/g, '\n').trim()));
  }
});

test('complete notices and unchanged FURU terms pass', t => {
  const path = fixture(t);
  assert.equal(verifyNotices(path, resolve(path, 'dist')), true);
});
test('notice line ending variations remain allowed', t => {
  const path = fixture(t);
  change(resolve(path, noticesFile), text => text.replace(/\n/g, '\r\n'));
  assert.equal(verifyNotices(path, resolve(path, 'dist')), true);
});
test('missing distribution notices fail closed', t => {
  const path = fixture(t);
  rmSync(resolve(path, 'dist', noticesFile));
  assert.throws(() => verifyNotices(path, resolve(path, 'dist')), /ENOENT/);
});
test('changed package version in notices is rejected', t => {
  const path = fixture(t);
  change(resolve(path, 'dist', noticesFile), text => text.replace('react@19.2.4', 'react@19.2.3'));
  assert.throws(() => verifyNotices(path, resolve(path, 'dist')), /stale third-party notices/);
});
test('missing MIT permission text is rejected', t => {
  const path = fixture(t);
  change(resolve(path, 'dist', noticesFile), text => text.replace('Permission is hereby granted', 'omitted'));
  assert.throws(() => verifyNotices(path, resolve(path, 'dist')), /stale third-party notices/);
});
test('missing Vite notice is rejected', t => {
  const path = fixture(t);
  change(resolve(path, 'dist', noticesFile), text => text.split('===== vite@')[0]);
  assert.throws(() => verifyNotices(path, resolve(path, 'dist')), /stale third-party notices/);
});
test('installed and locked package versions must match', t => {
  const path = fixture(t);
  change(resolve(path, 'node_modules/react/package.json'), text => JSON.stringify({ ...JSON.parse(text), version: '0.0.0' }));
  assert.throws(() => createNotices(path), /version mismatch: react/);
});
test('changed upstream license metadata requires review', t => {
  const path = fixture(t);
  change(resolve(path, 'node_modules/react/package.json'), text => JSON.stringify({ ...JSON.parse(text), license: 'ISC' }));
  assert.throws(() => createNotices(path), /License review required/);
});
test('new runtime dependencies require notice coverage', t => {
  const path = fixture(t);
  change(resolve(path, 'package-lock.json'), text => { const lock = JSON.parse(text); lock.packages['node_modules/unreviewed'] = { version: '1.0.0' }; return JSON.stringify(lock); });
  assert.throws(() => createNotices(path), /Unreviewed runtime dependency/);
});
test('truncated upstream license files fail closed', t => {
  const path = fixture(t);
  writeFileSync(resolve(path, 'node_modules/scheduler/LICENSE'), 'MIT License');
  assert.throws(() => createNotices(path), /Incomplete license/);
});
test('FURU distribution license must remain complete', t => {
  const path = fixture(t);
  writeFileSync(resolve(path, 'dist', 'LICENSE.txt'), 'incomplete');
  assert.throws(() => verifyNotices(path, resolve(path, 'dist')), /preserve the original FURU license/);
});

test('stale notices in the source ZIP are rejected even when distribution notices are correct', t => {
  const path = fixture(t);
  change(resolve(path, noticesFile), text => text.replace('react@19.2.4', 'react@19.2.3'));
  assert.throws(() => verifyNotices(path, resolve(path, 'dist')), /stale third-party notices/);
});
