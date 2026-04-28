import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** True if the directory doesn't exist or is completely empty. */
export async function isDirEmpty(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return true;
  const entries = await readdir(dir);
  return entries.length === 0;
}

/** Resolve a path relative to the CLI package root (works after bundling). */
export function pkgRoot(...segments: string[]): string {
  // __dirname is unavailable in ESM; use import.meta.url
  const root = new URL('../../', import.meta.url).pathname;
  return path.join(root, ...segments);
}
