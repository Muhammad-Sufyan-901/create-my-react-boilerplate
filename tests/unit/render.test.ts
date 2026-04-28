import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { interpolateFilename, renderLayer } from '../../src/scaffold/render.js';
import type { ScaffoldContext } from '../../src/types.js';

const BASE_CTX: ScaffoldContext = {
  name: 'test-app',
  targetDir: '',
  language: 'ts',
  router: 'react-router',
  ui: 'shadcn',
  pm: 'npm',
  install: true,
  git: true,
  offline: false,
  isTS: true,
  ext: 'tsx',
};

let srcDir: string;
let targetDir: string;

beforeEach(async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'render-test-'));
  srcDir = path.join(tmp, 'src');
  targetDir = path.join(tmp, 'out');
  await fs.ensureDir(srcDir);
  await fs.ensureDir(targetDir);
});

afterEach(async () => {
  await fs.remove(path.dirname(srcDir));
});

// ── interpolateFilename ───────────────────────────────────────────────────────

describe('interpolateFilename', () => {
  it('replaces [ext]', () => {
    expect(interpolateFilename('App.[ext]', BASE_CTX)).toBe('App.tsx');
  });

  it('replaces __router__', () => {
    expect(interpolateFilename('__router__', BASE_CTX)).toBe('react-router');
  });

  it('replaces __ui__', () => {
    expect(interpolateFilename('__ui__-config.ts', BASE_CTX)).toBe('shadcn-config.ts');
  });

  it('replaces __lang__', () => {
    expect(interpolateFilename('config.__lang__.json', BASE_CTX)).toBe('config.ts.json');
  });

  it('handles multiple placeholders in one name', () => {
    expect(interpolateFilename('__router__.[ext]', BASE_CTX)).toBe('react-router.tsx');
  });

  it('leaves names without placeholders unchanged', () => {
    expect(interpolateFilename('main.tsx', BASE_CTX)).toBe('main.tsx');
  });

  it('uses js ext for JS context', () => {
    const ctx = { ...BASE_CTX, language: 'js' as const, isTS: false, ext: 'jsx' };
    expect(interpolateFilename('App.[ext]', ctx)).toBe('App.jsx');
  });
});

// ── renderLayer ───────────────────────────────────────────────────────────────

describe('renderLayer', () => {
  it('no-ops silently when srcDir does not exist', async () => {
    await expect(
      renderLayer(path.join(srcDir, 'nonexistent'), targetDir, BASE_CTX),
    ).resolves.toBeUndefined();
  });

  it('copies a plain (non-EJS) file as-is', async () => {
    await fs.outputFile(path.join(srcDir, 'hello.txt'), 'hello world');
    await renderLayer(srcDir, targetDir, BASE_CTX);
    const content = await fs.readFile(path.join(targetDir, 'hello.txt'), 'utf8');
    expect(content).toBe('hello world');
  });

  it('renders an EJS file and strips the .ejs suffix', async () => {
    await fs.outputFile(
      path.join(srcDir, 'App.[ext].ejs'),
      'const name = "<%= name %>";\nexport default App;',
    );
    await renderLayer(srcDir, targetDir, BASE_CTX);
    expect(await fs.pathExists(path.join(targetDir, 'App.tsx'))).toBe(true);
    const content = await fs.readFile(path.join(targetDir, 'App.tsx'), 'utf8');
    expect(content).toContain('"test-app"');
  });

  it('renders EJS conditionals correctly (isTS branch)', async () => {
    await fs.outputFile(
      path.join(srcDir, 'types.[ext].ejs'),
      '<% if (isTS) { %>export type Foo = string;<% } else { %>// no types<% } %>',
    );
    await renderLayer(srcDir, targetDir, BASE_CTX);
    const content = await fs.readFile(path.join(targetDir, 'types.tsx'), 'utf8');
    expect(content).toContain('export type Foo = string;');
    expect(content).not.toContain('// no types');
  });

  it('renders EJS conditionals correctly (JS branch)', async () => {
    const jsCtx = { ...BASE_CTX, language: 'js' as const, isTS: false, ext: 'jsx' };
    await fs.outputFile(
      path.join(srcDir, 'types.[ext].ejs'),
      '<% if (isTS) { %>export type Foo = string;<% } else { %>// no types<% } %>',
    );
    await renderLayer(srcDir, targetDir, jsCtx);
    const content = await fs.readFile(path.join(targetDir, 'types.jsx'), 'utf8');
    expect(content).toContain('// no types');
    expect(content).not.toContain('export type Foo');
  });

  it('interpolates directory names', async () => {
    await fs.outputFile(path.join(srcDir, '__router__', 'index.ts'), 'export {};');
    await renderLayer(srcDir, targetDir, BASE_CTX);
    expect(
      await fs.pathExists(path.join(targetDir, 'react-router', 'index.ts')),
    ).toBe(true);
  });

  it('later call overwrites earlier file (last layer wins)', async () => {
    await fs.outputFile(path.join(srcDir, 'config.ts'), 'v1');
    await renderLayer(srcDir, targetDir, BASE_CTX);

    const srcDir2 = path.join(path.dirname(srcDir), 'src2');
    await fs.outputFile(path.join(srcDir2, 'config.ts'), 'v2');
    await renderLayer(srcDir2, targetDir, BASE_CTX);

    const content = await fs.readFile(path.join(targetDir, 'config.ts'), 'utf8');
    expect(content).toBe('v2');
  });
});
