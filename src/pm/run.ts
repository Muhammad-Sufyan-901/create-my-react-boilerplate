import { execa } from 'execa';
import type { PackageManager } from '../types.js';

const cmds: Record<PackageManager, { install: string[]; add: string[]; addDev: string[]; dlx: string[] }> = {
  npm:  { install: ['install'],         add: ['install'],         addDev: ['install', '--save-dev'], dlx: ['exec', '--yes'] },
  yarn: { install: ['install'],         add: ['add'],             addDev: ['add', '--dev'],          dlx: ['dlx'] },
  pnpm: { install: ['install'],         add: ['add'],             addDev: ['add', '--save-dev'],     dlx: ['dlx'] },
  bun:  { install: ['install'],         add: ['add'],             addDev: ['add', '--dev'],          dlx: ['x'] },
};

export async function pmInstall(pm: PackageManager, cwd: string): Promise<void> {
  await execa(pm, cmds[pm].install, { cwd, stdio: 'inherit' });
}

export async function pmDlx(pm: PackageManager, cwd: string, pkg: string, args: string[]): Promise<void> {
  await execa(pm, [...cmds[pm].dlx, pkg, ...args], { cwd, stdio: 'inherit' });
}
