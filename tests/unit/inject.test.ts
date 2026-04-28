import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { injectFragments, resolveFragment } from '../../src/scaffold/inject.js';
import type { ScaffoldContext } from '../../src/types.js';

const CTX: ScaffoldContext = {
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

let tmpDir: string;
let targetDir: string;
let templatesDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'inject-test-'));
  targetDir = path.join(tmpDir, 'output');
  templatesDir = path.join(tmpDir, 'templates');
  await fs.ensureDir(targetDir);
  await fs.ensureDir(templatesDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

// ── resolveFragment ───────────────────────────────────────────────────────────

describe('resolveFragment', () => {
  it('returns null when no fragment files exist', async () => {
    const result = await resolveFragment('router-provider', CTX, templatesDir);
    expect(result).toBeNull();
  });

  it('finds a router fragment by ext', async () => {
    const fragDir = path.join(templatesDir, 'router', 'react-router', 'fragments');
    await fs.outputFile(path.join(fragDir, 'router-provider.tsx'), '<RouterProvider />');
    const result = await resolveFragment('router-provider', CTX, templatesDir);
    expect(result).toBe('<RouterProvider />');
  });

  it('falls back to .ts extension when ext-specific file is missing', async () => {
    const fragDir = path.join(templatesDir, 'router', 'react-router', 'fragments');
    await fs.outputFile(path.join(fragDir, 'router-provider.ts'), 'export const r = null;');
    const result = await resolveFragment('router-provider', CTX, templatesDir);
    expect(result).toBe('export const r = null;');
  });

  it('falls back to UI fragments when no router fragment found', async () => {
    const fragDir = path.join(templatesDir, 'ui', 'shadcn', 'fragments');
    await fs.outputFile(path.join(fragDir, 'theme-provider.tsx'), '<ThemeProvider />');
    const result = await resolveFragment('theme-provider', CTX, templatesDir);
    expect(result).toBe('<ThemeProvider />');
  });

  it('prefers router fragment over UI fragment', async () => {
    const routerFragDir = path.join(templatesDir, 'router', 'react-router', 'fragments');
    const uiFragDir = path.join(templatesDir, 'ui', 'shadcn', 'fragments');
    await fs.outputFile(path.join(routerFragDir, 'provider.tsx'), 'router-version');
    await fs.outputFile(path.join(uiFragDir, 'provider.tsx'), 'ui-version');
    const result = await resolveFragment('provider', CTX, templatesDir);
    expect(result).toBe('router-version');
  });
});

// ── injectFragments ───────────────────────────────────────────────────────────

describe('injectFragments', () => {
  it('leaves files without markers unchanged', async () => {
    await fs.outputFile(path.join(targetDir, 'index.ts'), 'export const x = 1;');
    await injectFragments(targetDir, CTX, templatesDir);
    const content = await fs.readFile(path.join(targetDir, 'index.ts'), 'utf8');
    expect(content).toBe('export const x = 1;');
  });

  it('replaces a single marker with fragment content', async () => {
    const fragDir = path.join(templatesDir, 'router', 'react-router', 'fragments');
    await fs.outputFile(path.join(fragDir, 'router-provider.tsx'), '<RouterProvider />');
    await fs.outputFile(
      path.join(targetDir, 'main.tsx'),
      'const app = /* @inject:router-provider */;\nexport default app;',
    );
    await injectFragments(targetDir, CTX, templatesDir);
    const content = await fs.readFile(path.join(targetDir, 'main.tsx'), 'utf8');
    expect(content).toContain('<RouterProvider />');
    expect(content).not.toContain('/* @inject:router-provider */');
  });

  it('replaces multiple different markers in one file', async () => {
    const routerFragDir = path.join(templatesDir, 'router', 'react-router', 'fragments');
    const uiFragDir = path.join(templatesDir, 'ui', 'shadcn', 'fragments');
    await fs.outputFile(path.join(routerFragDir, 'router-provider.tsx'), '<Router />');
    await fs.outputFile(path.join(uiFragDir, 'theme-provider.tsx'), '<Theme />');

    await fs.outputFile(
      path.join(targetDir, 'main.tsx'),
      '/* @inject:router-provider */\n/* @inject:theme-provider */',
    );
    await injectFragments(targetDir, CTX, templatesDir);
    const content = await fs.readFile(path.join(targetDir, 'main.tsx'), 'utf8');
    expect(content).toContain('<Router />');
    expect(content).toContain('<Theme />');
  });

  it('leaves a marker intact when no fragment is found', async () => {
    await fs.outputFile(
      path.join(targetDir, 'main.tsx'),
      '/* @inject:missing-fragment */',
    );
    await injectFragments(targetDir, CTX, templatesDir);
    const content = await fs.readFile(path.join(targetDir, 'main.tsx'), 'utf8');
    expect(content).toContain('/* @inject:missing-fragment */');
  });

  it('walks nested directories', async () => {
    const fragDir = path.join(templatesDir, 'router', 'react-router', 'fragments');
    await fs.outputFile(path.join(fragDir, 'router-provider.tsx'), '<RouterProvider />');
    await fs.outputFile(
      path.join(targetDir, 'src', 'main.tsx'),
      '/* @inject:router-provider */',
    );
    await injectFragments(targetDir, CTX, templatesDir);
    const content = await fs.readFile(path.join(targetDir, 'src', 'main.tsx'), 'utf8');
    expect(content).toContain('<RouterProvider />');
  });

  it('skips non-text files (does not throw on them)', async () => {
    await fs.outputFile(path.join(targetDir, 'icon.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    await expect(injectFragments(targetDir, CTX, templatesDir)).resolves.toBeUndefined();
  });
});
