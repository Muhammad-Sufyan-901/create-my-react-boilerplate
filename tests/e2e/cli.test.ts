import { describe, it, expect } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { pkgRoot } from '../../src/utils/fs.js';

const CLI_PATH = path.join(pkgRoot(), 'dist', 'index.mjs');
const CLI_BUILT = fs.existsSync(CLI_PATH);

interface Case {
  label: string;
  args: string[];
  keyFiles: string[];
}

const CASES: Case[] = [
  {
    label: 'ts-react-router-shadcn',
    args: ['--ts', '--router', 'react-router', '--ui', 'shadcn', '--pm', 'npm'],
    keyFiles: ['package.json', 'index.html', 'src/main.tsx', 'vite.config.ts'],
  },
  {
    label: 'ts-tanstack-router-heroui',
    args: ['--ts', '--router', 'tanstack-router', '--ui', 'heroui', '--pm', 'npm'],
    keyFiles: ['package.json', 'index.html', 'src/main.tsx', 'vite.config.ts'],
  },
  {
    label: 'js-react-router-heroui',
    args: ['--js', '--router', 'react-router', '--ui', 'heroui', '--pm', 'npm'],
    keyFiles: ['package.json', 'index.html', 'src/main.jsx', 'vite.config.js'],
  },
];

describe.skipIf(!CLI_BUILT)('CLI end-to-end (requires npm run build)', () => {
  it.each(CASES)('scaffolds $label with exit 0', async ({ label, args, keyFiles }) => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-e2e-'));
    try {
      const result = await execa(
        'node',
        [CLI_PATH, label, ...args, '--no-install', '--no-git', '--offline'],
        {
          cwd: tmpDir,
          reject: false,
          stdin: 'ignore',
          timeout: 30_000,
        },
      );

      expect(result.exitCode).toBe(0);

      const projDir = path.join(tmpDir, label);
      for (const file of keyFiles) {
        expect(
          await fs.pathExists(path.join(projDir, file)),
          `Expected ${file} to exist`,
        ).toBe(true);
      }
    } finally {
      await fs.remove(tmpDir);
    }
  });
});
