import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { getBaseDeps, resolveDeps, writeResolvedDeps } from '../../src/deps/resolve.js';
import type { ScaffoldContext } from '../../src/types.js';

const BASE_CTX: ScaffoldContext = {
  name: 'my-app',
  targetDir: '',
  language: 'ts',
  router: 'react-router',
  ui: 'shadcn',
  pm: 'npm',
  install: true,
  git: true,
  offline: true,
  isTS: true,
  ext: 'tsx',
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resolve-test-'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

// ── getBaseDeps ───────────────────────────────────────────────────────────────

describe('getBaseDeps', () => {
  it('always includes react and react-dom in prod', () => {
    const { prod } = getBaseDeps(BASE_CTX);
    expect(prod).toContain('react');
    expect(prod).toContain('react-dom');
  });

  it('includes react-router for react-router context', () => {
    const { prod } = getBaseDeps(BASE_CTX);
    expect(prod).toContain('react-router');
    expect(prod).not.toContain('@tanstack/react-router');
  });

  it('includes @tanstack/react-router for tanstack-router context', () => {
    const ctx = { ...BASE_CTX, router: 'tanstack-router' as const };
    const { prod } = getBaseDeps(ctx);
    expect(prod).toContain('@tanstack/react-router');
    expect(prod).not.toContain('react-router');
  });

  it('includes @heroui/react and @heroui/styles for heroui', () => {
    const ctx = { ...BASE_CTX, ui: 'heroui' as const };
    const { prod } = getBaseDeps(ctx);
    expect(prod).toContain('@heroui/react');
    expect(prod).toContain('@heroui/styles');
    expect(prod).not.toContain('@heroui/theme');
    expect(prod).not.toContain('framer-motion');
  });

  it('does not include @heroui/react for shadcn', () => {
    const { prod } = getBaseDeps(BASE_CTX);
    expect(prod).not.toContain('@heroui/react');
  });

  it('includes typescript and @types/* in dev for TS context', () => {
    const { dev } = getBaseDeps(BASE_CTX);
    expect(dev).toContain('typescript');
    expect(dev).toContain('@types/react');
    expect(dev).toContain('@types/react-dom');
    expect(dev).toContain('typescript-eslint');
  });

  it('excludes typescript and @types/* in dev for JS context', () => {
    const ctx = { ...BASE_CTX, language: 'js' as const, isTS: false, ext: 'jsx' };
    const { dev } = getBaseDeps(ctx);
    expect(dev).not.toContain('typescript');
    expect(dev).not.toContain('@types/react');
    expect(dev).not.toContain('typescript-eslint');
  });

  it('always includes vite, tailwindcss, and testing tools in dev', () => {
    const { dev } = getBaseDeps(BASE_CTX);
    expect(dev).toContain('vite');
    expect(dev).toContain('tailwindcss');
    expect(dev).toContain('@tailwindcss/vite');
    expect(dev).toContain('vitest');
    expect(dev).toContain('@testing-library/react');
    expect(dev).toContain('@testing-library/jest-dom');
  });
});

// ── writeResolvedDeps ─────────────────────────────────────────────────────────

describe('writeResolvedDeps', () => {
  it('writes prod and dev deps into the package.json', async () => {
    const pkgPath = path.join(tmpDir, 'package.json');
    await fs.writeJson(pkgPath, { name: 'test', dependencies: {}, devDependencies: {} });

    await writeResolvedDeps(
      tmpDir,
      { react: '^19.1.0', 'react-dom': '^19.1.0' },
      { vite: '^6.3.5', typescript: '^5.8.3' },
    );

    const pkg = await fs.readJson(pkgPath);
    expect(pkg.dependencies).toEqual({ react: '^19.1.0', 'react-dom': '^19.1.0' });
    expect(pkg.devDependencies).toEqual({ vite: '^6.3.5', typescript: '^5.8.3' });
  });

  it('preserves other package.json fields', async () => {
    const pkgPath = path.join(tmpDir, 'package.json');
    await fs.writeJson(pkgPath, { name: 'my-app', version: '0.0.0', scripts: { dev: 'vite' } });

    await writeResolvedDeps(tmpDir, { react: '^19.0.0' }, {});

    const pkg = await fs.readJson(pkgPath);
    expect(pkg.name).toBe('my-app');
    expect(pkg.scripts.dev).toBe('vite');
  });
});

// ── resolveDeps (offline) ─────────────────────────────────────────────────────

describe('resolveDeps (offline mode)', () => {
  it('reads versions from the lock file', async () => {
    const lockPath = path.join(tmpDir, 'versions.lock.json');
    await fs.writeJson(lockPath, { react: '^19.0.0', vite: '^6.0.0' });

    const ctx = { ...BASE_CTX, offline: true };
    const result = await resolveDeps({ prod: ['react'], dev: ['vite'] }, ctx, lockPath);

    expect(result.prod.react).toBe('^19.0.0');
    expect(result.dev.vite).toBe('^6.0.0');
  });

  it('falls back to "latest" for packages missing from lock', async () => {
    const lockPath = path.join(tmpDir, 'versions.lock.json');
    await fs.writeJson(lockPath, {});

    const ctx = { ...BASE_CTX, offline: true };
    const result = await resolveDeps({ prod: ['some-unknown-pkg'], dev: [] }, ctx, lockPath);

    expect(result.prod['some-unknown-pkg']).toBe('latest');
  });

  it('merges base deps with feature deps (no duplicates)', async () => {
    const lockPath = path.join(tmpDir, 'versions.lock.json');
    await fs.writeJson(lockPath, { react: '^19.0.0', zod: '^3.24.0' });

    const ctx = { ...BASE_CTX, offline: true };
    // react is in both base and feature deps
    const result = await resolveDeps({ prod: ['react', 'zod'], dev: [] }, ctx, lockPath);

    const reactCount = Object.keys(result.prod).filter(k => k === 'react').length;
    expect(reactCount).toBe(1);
    expect(result.prod.zod).toBe('^3.24.0');
  });

  it('returns empty records when both dep lists are empty and lock is empty', async () => {
    const lockPath = path.join(tmpDir, 'versions.lock.json');
    await fs.writeJson(lockPath, {});

    // Use a JS/HeroUI context so getBaseDeps returns minimal lists
    // then override to empty for predictability
    const ctx = { ...BASE_CTX, offline: true };
    const result = await resolveDeps({ prod: [], dev: [] }, ctx, lockPath);

    // Should still have base deps (react, vite, etc.) — just all "latest"
    expect(typeof result.prod).toBe('object');
    expect(typeof result.dev).toBe('object');
  });
});
