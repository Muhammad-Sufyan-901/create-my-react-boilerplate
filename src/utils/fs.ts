import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** True if the directory doesn't exist or is completely empty. */
export async function isDirEmpty(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return true;
  const entries = await readdir(dir);
  return entries.length === 0;
}

/** Resolve a path relative to the CLI package root (works in source and after bundling). */
export function pkgRoot(...segments: string[]): string {
  // Walk up from the current file until we find package.json.
  // This handles both dev (src/utils/fs.ts) and production (dist/index.mjs).
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (!existsSync(path.join(dir, 'package.json'))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('pkgRoot: could not locate package.json');
    dir = parent;
  }
  return path.join(dir, ...segments);
}
