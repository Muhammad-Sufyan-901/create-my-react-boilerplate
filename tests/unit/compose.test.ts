import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { composeProject } from '../../src/scaffold/compose.js';
import type { ScaffoldContext } from '../../src/types.js';

const CTX: ScaffoldContext = {
  name: 'my-app',
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
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compose-test-'));
  targetDir = path.join(tmpDir, 'output');
  templatesDir = path.join(tmpDir, 'templates');
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

/** Build a minimal but valid templates directory for a given context. */
async function buildMinimalTemplates(
  tDir: string,
  ctx: ScaffoldContext,
  features: string[],
): Promise<void> {
  // base
  await fs.outputFile(path.join(tDir, 'base', 'index.html'), '<html></html>');

  // lang
  await fs.outputFile(
    path.join(tDir, 'lang', ctx.language, 'tsconfig.json'),
    '{}',
  );

  // router/files (empty is fine)
  await fs.ensureDir(path.join(tDir, 'router', ctx.router, 'files'));

  // ui (empty is fine)
  await fs.ensureDir(path.join(tDir, 'ui', ctx.ui));

  // tooling
  for (const tool of ['eslint-prettier', 'vitest', 'ci']) {
    await fs.ensureDir(path.join(tDir, 'tooling', tool));
  }

  // features with minimal feature.json
  for (const id of features) {
    await fs.ensureDir(path.join(tDir, 'features', id, 'files'));
    await fs.outputJson(path.join(tDir, 'features', id, 'feature.json'), {
      id,
      files: ['**/*'],
      dependencies: { any: [`${id}-dep`] },
      routes: [{ path: `/${id}`, component: `features/${id}/Page` }],
      navItems: [{ label: id, to: `/${id}`, scope: 'public' }],
    });
  }
}

describe('composeProject', () => {
  it('creates the target directory', async () => {
    const ctx = { ...CTX, targetDir };
    await buildMinimalTemplates(templatesDir, ctx, ['landing', 'auth', 'user-dashboard', 'admin-dashboard']);
    await composeProject(ctx, templatesDir);
    expect(await fs.pathExists(targetDir)).toBe(true);
  });

  it('copies base layer files into targetDir', async () => {
    const ctx = { ...CTX, targetDir };
    await buildMinimalTemplates(templatesDir, ctx, ['landing', 'auth', 'user-dashboard', 'admin-dashboard']);
    await composeProject(ctx, templatesDir);
    expect(await fs.pathExists(path.join(targetDir, 'index.html'))).toBe(true);
  });

  it('copies lang layer files (later layer wins over base)', async () => {
    const ctx = { ...CTX, targetDir };
    await buildMinimalTemplates(templatesDir, ctx, ['landing', 'auth', 'user-dashboard', 'admin-dashboard']);
    // Also put tsconfig in base — lang layer should win
    await fs.outputFile(path.join(templatesDir, 'base', 'tsconfig.json'), '{"base":true}');
    await fs.outputFile(path.join(templatesDir, 'lang', ctx.language, 'tsconfig.json'), '{"lang":true}');
    await composeProject(ctx, templatesDir);
    const content = await fs.readJson(path.join(targetDir, 'tsconfig.json'));
    expect(content).toEqual({ lang: true });
  });

  it('emits routes.generated.[ext] from feature manifests', async () => {
    const ctx = { ...CTX, targetDir };
    await buildMinimalTemplates(templatesDir, ctx, ['landing', 'auth', 'user-dashboard', 'admin-dashboard']);
    await composeProject(ctx, templatesDir);
    const routesPath = path.join(targetDir, 'src', 'router', 'routes.generated.tsx');
    expect(await fs.pathExists(routesPath)).toBe(true);
    const content = await fs.readFile(routesPath, 'utf8');
    expect(content).toContain('/landing');
    expect(content).toContain('/auth');
  });

  it('returns merged ComposedDeps from all feature manifests', async () => {
    const ctx = { ...CTX, targetDir };
    await buildMinimalTemplates(templatesDir, ctx, ['landing', 'auth', 'user-dashboard', 'admin-dashboard']);
    const deps = await composeProject(ctx, templatesDir);
    expect(deps.prod).toContain('landing-dep');
    expect(deps.prod).toContain('auth-dep');
  });

  it('works with JS context (ext = jsx)', async () => {
    const jsCtx = { ...CTX, targetDir, language: 'js' as const, isTS: false, ext: 'jsx' };
    await buildMinimalTemplates(templatesDir, jsCtx, ['landing', 'auth', 'user-dashboard', 'admin-dashboard']);
    await composeProject(jsCtx, templatesDir);
    const routesPath = path.join(targetDir, 'src', 'router', 'routes.generated.jsx');
    expect(await fs.pathExists(routesPath)).toBe(true);
  });
});
