import path from 'node:path';
import fs from 'fs-extra';
import { renderLayer } from './render.js';
import { injectFragments } from './inject.js';
import { loadManifest, mergeManifests, emitRoutes } from './manifest.js';
import { pkgRoot } from '../utils/fs.js';
import type { ScaffoldContext, ComposedDeps } from '../types.js';

const FEATURES = [
  'landing',
  'auth',
  'user-dashboard',
  'admin-dashboard',
] as const;

const TOOLING = ['eslint-prettier', 'vitest', 'ci'] as const;

/**
 * Applies all template layers to ctx.targetDir in this fixed order:
 *   base → lang → router → ui → tooling → features
 *
 * "Later layer wins" is implemented automatically because every file write
 * uses overwrite semantics. After rendering, fragment injection runs over
 * the full output tree.
 *
 * @param templatesDir  Override the default templates root (used in tests).
 * @returns             Merged prod + dev dependency names (no versions).
 */
export async function composeProject(
  ctx: ScaffoldContext,
  templatesDir: string = pkgRoot('templates'),
): Promise<ComposedDeps> {
  await fs.ensureDir(ctx.targetDir);

  const t = (...segs: string[]) => path.join(templatesDir, ...segs);

  // 1. Base — variant-independent scaffolding
  await renderLayer(t('base'), ctx.targetDir, ctx);

  // 2. Language — tsconfig.json (TS) or jsconfig.json (JS)
  await renderLayer(t('lang', ctx.language), ctx.targetDir, ctx);

  // 3. Router — provider bootstrap + route-tree wiring
  await renderLayer(t('router', ctx.router, 'files'), ctx.targetDir, ctx);

  // 4. UI library — component primitives + theme setup
  await renderLayer(t('ui', ctx.ui), ctx.targetDir, ctx);

  // 5. Tooling — ESLint/Prettier, Vitest, GitHub Actions CI
  for (const tool of TOOLING) {
    await renderLayer(t('tooling', tool), ctx.targetDir, ctx);
  }

  // 6. Features — copy pages/components + collect manifests
  const manifests = await Promise.all(
    FEATURES.map(async (id) => {
      await renderLayer(t('features', id, 'files'), ctx.targetDir, ctx);
      return loadManifest(t('features', id));
    }),
  );

  // 7. Emit routes.generated.[ext] from merged manifests
  await emitRoutes(manifests, ctx);

  // 8. Fragment injection — replace /* @inject:* */ markers in the output tree
  await injectFragments(ctx.targetDir, ctx, templatesDir);

  return mergeManifests(manifests, ctx);
}
