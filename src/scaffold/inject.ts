import fs from 'fs-extra';
import path from 'node:path';
import { pkgRoot } from '../utils/fs.js';
import type { ScaffoldContext } from '../types.js';

const MARKER = /\/\* @inject:([a-z0-9-]+) \*\//g;

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx',
  '.css', '.html', '.json', '.md',
  '.yaml', '.yml', '.env', '.txt', '.gitignore',
]);

/**
 * Walks targetDir and replaces every  /* @inject:<tag> *\/  marker in text files
 * with the contents of the matching fragment file.
 *
 * Fragment lookup order (first match wins):
 *   templates/router/{router}/fragments/{tag}.{ext}
 *   templates/router/{router}/fragments/{tag}.ts   (TS-universal fallback)
 *   templates/router/{router}/fragments/{tag}.js   (JS-universal fallback)
 *   templates/ui/{ui}/fragments/{tag}.{ext}
 *   templates/ui/{ui}/fragments/{tag}.ts
 *   templates/ui/{ui}/fragments/{tag}.js
 *
 * If no fragment is found the marker is left intact so it is easy to spot
 * during template development.
 */
export async function injectFragments(
  targetDir: string,
  ctx: ScaffoldContext,
  templatesDir: string = pkgRoot('templates'),
): Promise<void> {
  await walkDir(targetDir, ctx, templatesDir);
}

async function walkDir(
  dir: string,
  ctx: ScaffoldContext,
  templatesDir: string,
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkDir(fullPath, ctx, templatesDir);
      } else if (isTextFile(entry.name)) {
        await processFile(fullPath, ctx, templatesDir);
      }
    }),
  );
}

async function processFile(
  filePath: string,
  ctx: ScaffoldContext,
  templatesDir: string,
): Promise<void> {
  const src = await fs.readFile(filePath, 'utf8');

  // Quick bail-out: avoid building the fragment map for files with no markers.
  if (!src.includes('/* @inject:')) return;

  // Collect unique tags
  const tags = new Set<string>();
  for (const m of src.matchAll(MARKER)) tags.add(m[1]);

  // Resolve all fragments in parallel
  const fragmentMap = new Map<string, string>();
  await Promise.all(
    [...tags].map(async (tag) => {
      const content = await resolveFragment(tag, ctx, templatesDir);
      if (content !== null) fragmentMap.set(tag, content);
    }),
  );

  // Replace markers (MARKER.lastIndex resets because we use matchAll above, not exec)
  const result = src.replace(MARKER, (_match, tag: string) => fragmentMap.get(tag) ?? _match);

  if (result !== src) {
    await fs.writeFile(filePath, result, 'utf8');
  }
}

export async function resolveFragment(
  tag: string,
  ctx: ScaffoldContext,
  templatesDir: string = pkgRoot('templates'),
): Promise<string | null> {
  const candidates = [
    path.join(templatesDir, 'router', ctx.router, 'fragments', `${tag}.${ctx.ext}`),
    path.join(templatesDir, 'router', ctx.router, 'fragments', `${tag}.ts`),
    path.join(templatesDir, 'router', ctx.router, 'fragments', `${tag}.js`),
    path.join(templatesDir, 'ui', ctx.ui, 'fragments', `${tag}.${ctx.ext}`),
    path.join(templatesDir, 'ui', ctx.ui, 'fragments', `${tag}.ts`),
    path.join(templatesDir, 'ui', ctx.ui, 'fragments', `${tag}.js`),
  ];

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return fs.readFile(candidate, 'utf8');
    }
  }
  return null;
}

function isTextFile(name: string): boolean {
  return TEXT_EXTENSIONS.has(path.extname(name).toLowerCase());
}
