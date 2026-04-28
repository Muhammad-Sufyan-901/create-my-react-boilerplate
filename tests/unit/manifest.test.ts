import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { loadManifest, mergeManifests, emitRoutes } from '../../src/scaffold/manifest.js';
import type { ScaffoldContext, FeatureManifest } from '../../src/types.js';

const TS_CTX: ScaffoldContext = {
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

const JS_CTX: ScaffoldContext = { ...TS_CTX, language: 'js', isTS: false, ext: 'jsx' };
const HEROUI_CTX: ScaffoldContext = { ...TS_CTX, ui: 'heroui' };

const SAMPLE_MANIFEST: FeatureManifest = {
  id: 'auth',
  files: ['**/*'],
  dependencies: {
    any: ['zod'],
    shadcn: ['@radix-ui/react-label'],
    heroui: ['@heroui/react'],
    ts: ['@types/zod'],
    js: [],
  },
  devDependencies: {
    any: ['@testing-library/react'],
  },
  routes: [
    { path: '/login', component: 'features/auth/pages/Login' },
    { path: '/signup', component: 'features/auth/pages/Signup', guard: 'auth' },
  ],
  navItems: [
    { label: 'Sign in', to: '/login', scope: 'public' },
  ],
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'manifest-test-'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

// ── loadManifest ──────────────────────────────────────────────────────────────

describe('loadManifest', () => {
  it('loads and parses a valid feature.json', async () => {
    await fs.outputJson(path.join(tmpDir, 'feature.json'), SAMPLE_MANIFEST);
    const manifest = await loadManifest(tmpDir);
    expect(manifest.id).toBe('auth');
    expect(manifest.routes).toHaveLength(2);
    expect(manifest.navItems).toHaveLength(1);
  });

  it('throws when feature.json is missing', async () => {
    await expect(loadManifest(tmpDir)).rejects.toThrow();
  });
});

// ── mergeManifests ────────────────────────────────────────────────────────────

describe('mergeManifests', () => {
  it('includes "any" deps for all contexts', () => {
    const result = mergeManifests([SAMPLE_MANIFEST], TS_CTX);
    expect(result.prod).toContain('zod');
  });

  it('includes shadcn deps when ui === shadcn', () => {
    const result = mergeManifests([SAMPLE_MANIFEST], TS_CTX);
    expect(result.prod).toContain('@radix-ui/react-label');
    expect(result.prod).not.toContain('@heroui/react');
  });

  it('includes heroui deps when ui === heroui', () => {
    const result = mergeManifests([SAMPLE_MANIFEST], HEROUI_CTX);
    expect(result.prod).toContain('@heroui/react');
    expect(result.prod).not.toContain('@radix-ui/react-label');
  });

  it('includes TS-specific deps for TS context', () => {
    const result = mergeManifests([SAMPLE_MANIFEST], TS_CTX);
    expect(result.prod).toContain('@types/zod');
  });

  it('excludes TS-specific deps for JS context', () => {
    const result = mergeManifests([SAMPLE_MANIFEST], JS_CTX);
    expect(result.prod).not.toContain('@types/zod');
  });

  it('collects devDependencies separately', () => {
    const result = mergeManifests([SAMPLE_MANIFEST], TS_CTX);
    expect(result.dev).toContain('@testing-library/react');
    expect(result.prod).not.toContain('@testing-library/react');
  });

  it('deduplicates packages across manifests', () => {
    const result = mergeManifests([SAMPLE_MANIFEST, SAMPLE_MANIFEST], TS_CTX);
    const zodCount = result.prod.filter((p) => p === 'zod').length;
    expect(zodCount).toBe(1);
  });

  it('returns empty arrays when manifests list is empty', () => {
    const result = mergeManifests([], TS_CTX);
    expect(result.prod).toHaveLength(0);
    expect(result.dev).toHaveLength(0);
  });

  it('merges deps from multiple manifests', () => {
    const second: FeatureManifest = {
      id: 'landing',
      files: [],
      dependencies: { any: ['framer-motion'] },
      routes: [],
      navItems: [],
    };
    const result = mergeManifests([SAMPLE_MANIFEST, second], TS_CTX);
    expect(result.prod).toContain('zod');
    expect(result.prod).toContain('framer-motion');
  });
});

// ── emitRoutes ────────────────────────────────────────────────────────────────

describe('emitRoutes', () => {
  it('writes routes.generated.tsx for TS context', async () => {
    const ctx = { ...TS_CTX, targetDir: tmpDir };
    await emitRoutes([SAMPLE_MANIFEST], ctx);
    const outPath = path.join(tmpDir, 'src', 'router', 'routes.generated.tsx');
    expect(await fs.pathExists(outPath)).toBe(true);
  });

  it('writes routes.generated.jsx for JS context', async () => {
    const ctx = { ...JS_CTX, targetDir: tmpDir };
    await emitRoutes([SAMPLE_MANIFEST], ctx);
    const outPath = path.join(tmpDir, 'src', 'router', 'routes.generated.jsx');
    expect(await fs.pathExists(outPath)).toBe(true);
  });

  it('emits all routes from all manifests', async () => {
    const ctx = { ...TS_CTX, targetDir: tmpDir };
    const second: FeatureManifest = {
      id: 'landing',
      files: [],
      dependencies: {},
      routes: [{ path: '/', component: 'features/landing/pages/Landing' }],
      navItems: [],
    };
    await emitRoutes([SAMPLE_MANIFEST, second], ctx);
    const content = await fs.readFile(
      path.join(tmpDir, 'src', 'router', 'routes.generated.tsx'),
      'utf8',
    );
    expect(content).toContain('/login');
    expect(content).toContain('/signup');
    expect(content).toContain('/');
  });

  it('includes guard fields when present', async () => {
    const ctx = { ...TS_CTX, targetDir: tmpDir };
    await emitRoutes([SAMPLE_MANIFEST], ctx);
    const content = await fs.readFile(
      path.join(tmpDir, 'src', 'router', 'routes.generated.tsx'),
      'utf8',
    );
    expect(content).toContain('"guard": "auth"');
  });

  it('emits navItems', async () => {
    const ctx = { ...TS_CTX, targetDir: tmpDir };
    await emitRoutes([SAMPLE_MANIFEST], ctx);
    const content = await fs.readFile(
      path.join(tmpDir, 'src', 'router', 'routes.generated.tsx'),
      'utf8',
    );
    expect(content).toContain('navItems');
    expect(content).toContain('Sign in');
  });

  it('handles empty manifests without throwing', async () => {
    const ctx = { ...TS_CTX, targetDir: tmpDir };
    await expect(emitRoutes([], ctx)).resolves.toBeUndefined();
  });
});
