import pacote from 'pacote';
import fs from 'fs-extra';
import path from 'node:path';
import { pkgRoot } from '../utils/fs.js';
import type { ScaffoldContext, ComposedDeps } from '../types.js';

// ── Base dependency sets ──────────────────────────────────────────────────────

/**
 * Returns the framework-level prod + dev deps that every generated project
 * needs, independent of feature manifests.  Router- and UI-specific packages
 * are included here; feature-level packages come from feature.json manifests.
 */
export function getBaseDeps(ctx: ScaffoldContext): ComposedDeps {
  const prod: string[] = [
    'react',
    'react-dom',
    ctx.router === 'react-router' ? 'react-router' : '@tanstack/react-router',
  ];

  if (ctx.ui === 'heroui') {
    prod.push('@heroui/react', 'framer-motion');
  }

  const dev: string[] = [
    'vite',
    '@vitejs/plugin-react',
    'tailwindcss',
    '@tailwindcss/vite',
    // ESLint
    'eslint',
    '@eslint/js',
    'globals',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
    // Prettier
    'prettier',
    'prettier-plugin-tailwindcss',
    // Testing
    'vitest',
    '@testing-library/react',
    '@testing-library/jest-dom',
    'jsdom',
  ];

  if (ctx.isTS) {
    dev.push(
      'typescript',
      '@types/react',
      '@types/react-dom',
      '@types/node',
      'typescript-eslint',
    );
  }

  return { prod, dev };
}

// ── Version resolution ────────────────────────────────────────────────────────

/**
 * Resolves exact latest versions for all prod + dev deps (base + feature).
 * In offline mode, reads pinned versions from the lock file instead of
 * hitting the npm registry. Any package not in the lock file falls back
 * to "latest" as the version specifier.
 *
 * @param lockPath  Override the path to versions.lock.json (used in tests).
 */
export async function resolveDeps(
  featureDeps: ComposedDeps,
  ctx: ScaffoldContext,
  lockPath: string = pkgRoot('src', 'deps', 'versions.lock.json'),
): Promise<{ prod: Record<string, string>; dev: Record<string, string> }> {
  const base = getBaseDeps(ctx);

  const allProd = [...new Set([...base.prod, ...featureDeps.prod])];
  const allDev  = [...new Set([...base.dev,  ...featureDeps.dev])];

  if (ctx.offline) {
    const lock = await loadLock(lockPath);
    return {
      prod: resolveFromLock(allProd, lock),
      dev:  resolveFromLock(allDev,  lock),
    };
  }

  const [prodEntries, devEntries] = await Promise.all([
    resolveFromRegistry(allProd),
    resolveFromRegistry(allDev),
  ]);

  return {
    prod: Object.fromEntries(prodEntries),
    dev:  Object.fromEntries(devEntries),
  };
}

/**
 * Merges resolved dep maps into the generated project's package.json.
 */
export async function writeResolvedDeps(
  targetDir: string,
  prod: Record<string, string>,
  dev: Record<string, string>,
): Promise<void> {
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = await fs.readJson(pkgPath) as Record<string, unknown>;
  pkg.dependencies    = prod;
  pkg.devDependencies = dev;
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveFromRegistry(
  names: string[],
): Promise<[string, string][]> {
  return Promise.all(
    names.map(async (name): Promise<[string, string]> => {
      try {
        const manifest = await pacote.manifest(`${name}@latest`);
        return [name, `^${manifest.version}`];
      } catch {
        return [name, 'latest'];
      }
    }),
  );
}

async function loadLock(lockPath: string): Promise<Record<string, string>> {
  try {
    return await fs.readJson(lockPath) as Record<string, string>;
  } catch {
    return {};
  }
}

function resolveFromLock(
  names: string[],
  lock: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, lock[n] ?? 'latest']));
}
