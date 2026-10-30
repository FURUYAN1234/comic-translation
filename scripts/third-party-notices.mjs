import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const noticesFile = 'THIRD_PARTY_NOTICES.txt';
const packages = [
  ['react', 'LICENSE'],
  ['react-dom', 'LICENSE'],
  ['scheduler', 'LICENSE'],
  ['vite', 'LICENSE.md'],
];
const normalize = text => text.replace(/\r\n/g, '\n');

export function createNotices(root = process.cwd()) {
  const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
  const covered = new Set(packages.map(([name]) => `node_modules/${name}`));
  for (const [path, metadata] of Object.entries(lock.packages)) {
    if (path && !metadata.dev && !covered.has(path)) {
      throw new Error(`Unreviewed runtime dependency: ${path}`);
    }
  }
  const sections = packages.map(([name, licenseFile]) => {
    const directory = resolve(root, 'node_modules', name);
    const pkg = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
    if (pkg.name !== name || !pkg.version || pkg.version !== lock.packages[`node_modules/${name}`]?.version) {
      throw new Error(`Installed/locked version mismatch: ${name}`);
    }
    if (pkg.license !== 'MIT') throw new Error(`License review required: ${name}`);
    const license = normalize(readFileSync(resolve(directory, licenseFile), 'utf8')).trim();
    if (!license.includes('Permission is hereby granted') || !license.includes('THE SOFTWARE IS PROVIDED')) {
      throw new Error(`Incomplete license: ${name}`);
    }
    return `===== ${name}@${pkg.version} =====\nSource: ${name}/${licenseFile}\n\n${license}`;
  });
  return 'Third-party software notices\n\n'
    + 'These terms apply to the third-party software listed below.\n'
    + 'FURU-authored code remains subject to the existing LICENSE / LICENSE.txt.\n'
    + 'Vite notices cover code inserted into the browser build; its bundled notices are retained in full.\n\n'
    + sections.join('\n\n') + '\n';
}

export function verifyNotices(root = process.cwd(), dist = resolve(root, 'dist')) {
  const expected = createNotices(root);
  for (const path of [resolve(root, noticesFile), resolve(dist, noticesFile)]) {
    if (normalize(readFileSync(path, 'utf8')) !== expected) {
      throw new Error(`Missing, changed or stale third-party notices: ${path}`);
    }
  }
  if (!readFileSync(resolve(root, 'LICENSE')).equals(readFileSync(resolve(dist, 'LICENSE.txt')))) {
    throw new Error('Distribution must preserve the original FURU license');
  }
  return true;
}

export function thirdPartyNotices() {
  let root;
  return {
    name: 'third-party-notices',
    configResolved(config) { root = config.root; },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: noticesFile, source: createNotices(root) });
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] === '--write-source') {
    writeFileSync(noticesFile, createNotices());
    console.log('THIRD_PARTY_SOURCE_NOTICES_WRITTEN');
  } else if (process.argv[2] === '--verify-dist') {
    verifyNotices(process.cwd(), resolve(process.argv[3] || 'dist'));
    console.log('THIRD_PARTY_NOTICES_VERIFIED');
  } else {
    throw new Error('Use --write-source or --verify-dist [distribution-directory]');
  }
}
