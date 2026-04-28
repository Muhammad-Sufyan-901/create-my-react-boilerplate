import { describe, it, expect } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { composeProject } from '../../src/scaffold/compose.js';
import { pkgRoot } from '../../src/utils/fs.js';
import type { ScaffoldContext, Language, Router, UI } from '../../src/types.js';

const TEMPLATES_DIR = path.join(pkgRoot(), 'templates');

interface Permutation {
  language: Language;
  router: Router;
  ui: UI;
  isTS: boolean;
  ext: 'tsx' | 'jsx';
  sext: 'ts' | 'js';
}

const PERMUTATIONS: Permutation[] = [
  { language: 'ts', router: 'react-router',    ui: 'shadcn',  isTS: true,  ext: 'tsx', sext: 'ts' },
  { language: 'ts', router: 'react-router',    ui: 'heroui',  isTS: true,  ext: 'tsx', sext: 'ts' },
  { language: 'ts', router: 'tanstack-router', ui: 'shadcn',  isTS: true,  ext: 'tsx', sext: 'ts' },
  { language: 'ts', router: 'tanstack-router', ui: 'heroui',  isTS: true,  ext: 'tsx', sext: 'ts' },
  { language: 'js', router: 'react-router',    ui: 'shadcn',  isTS: false, ext: 'jsx', sext: 'js' },
  { language: 'js', router: 'react-router',    ui: 'heroui',  isTS: false, ext: 'jsx', sext: 'js' },
  { language: 'js', router: 'tanstack-router', ui: 'shadcn',  isTS: false, ext: 'jsx', sext: 'js' },
  { language: 'js', router: 'tanstack-router', ui: 'heroui',  isTS: false, ext: 'jsx', sext: 'js' },
];

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFiles(fullPath)));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

describe('scaffold permutations', () => {
  it.each(PERMUTATIONS)(
    '$language-$router-$ui',
    async ({ language, router, ui, isTS, ext, sext }) => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'perm-test-'));
      try {
        const targetDir = path.join(tmpDir, 'output');
        const ctx: ScaffoldContext = {
          name: 'my-app',
          targetDir,
          language,
          router,
          ui,
          pm: 'npm',
          install: false,
          git: false,
          offline: true,
          isTS,
          ext,
        };

        await composeProject(ctx, TEMPLATES_DIR);

        // Snapshot the sorted file tree
        const allFiles = await listFiles(targetDir);
        const relFiles = allFiles.map(f => path.relative(targetDir, f));
        expect(relFiles).toMatchSnapshot('file-tree');

        // Snapshot key file contents
        const mainPath = path.join(targetDir, 'src', `main.${ext}`);
        expect(await fs.readFile(mainPath, 'utf8')).toMatchSnapshot('main');

        const vitePath = path.join(targetDir, `vite.config.${sext}`);
        expect(await fs.readFile(vitePath, 'utf8')).toMatchSnapshot('vite-config');
      } finally {
        await fs.remove(tmpDir);
      }
    },
  );
});
