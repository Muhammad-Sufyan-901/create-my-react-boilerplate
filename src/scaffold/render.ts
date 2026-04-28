import ejs from 'ejs';
import fs from 'fs-extra';
import path from 'node:path';
import type { ScaffoldContext } from '../types.js';

/**
 * Replaces context-specific placeholders in a single filename or dir-name segment.
 *   [ext]        → "tsx" | "jsx"
 *   __router__   → "react-router" | "tanstack-router"
 *   __ui__       → "shadcn" | "heroui"
 *   __lang__     → "ts" | "js"
 */
export function interpolateFilename(name: string, ctx: ScaffoldContext): string {
  return name
    .replace(/\[ext\]/g, ctx.ext)
    .replace(/__router__/g, ctx.router)
    .replace(/__ui__/g, ctx.ui)
    .replace(/__lang__/g, ctx.language);
}

/**
 * Renders one template layer directory into targetDir.
 *
 * Rules:
 * - Directories: created with their name interpolated.
 * - *.ejs files: rendered via EJS with the full ScaffoldContext, then written
 *   with the ".ejs" suffix removed and the remaining name interpolated.
 * - All other files: copied as-is (binary-safe) with the name interpolated.
 *
 * Calling renderLayer multiple times for different layers naturally implements
 * "later layer wins" because fs.outputFile / fs.copy use overwrite semantics.
 *
 * Silently no-ops if srcDir does not exist, so optional layers never throw.
 */
export async function renderLayer(
  srcDir: string,
  targetDir: string,
  ctx: ScaffoldContext,
): Promise<void> {
  if (!(await fs.pathExists(srcDir))) return;
  await renderDir(srcDir, targetDir, ctx);
}

async function renderDir(
  srcDir: string,
  targetDir: string,
  ctx: ScaffoldContext,
): Promise<void> {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(srcDir, entry.name);

      if (entry.isDirectory()) {
        const outDir = path.join(targetDir, interpolateFilename(entry.name, ctx));
        await renderDir(srcPath, outDir, ctx);
      } else if (entry.name.endsWith('.ejs')) {
        const baseName = interpolateFilename(entry.name.slice(0, -4), ctx);
        const content = await ejs.renderFile(srcPath, { ...ctx });
        await fs.outputFile(path.join(targetDir, baseName), content);
      } else {
        const outName = interpolateFilename(entry.name, ctx);
        await fs.copy(srcPath, path.join(targetDir, outName), { overwrite: true });
      }
    }),
  );
}
