import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ScaffoldContext } from '../../src/types.js';

// ── Shared mock context ───────────────────────────────────────────────────────

const BASE_CTX: ScaffoldContext = {
  name: 'my-app',
  targetDir: '/tmp/my-app',
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

// ── git.ts ────────────────────────────────────────────────────────────────────

vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../src/pm/run.js', () => ({
  pmInstall: vi.fn().mockResolvedValue(undefined),
  pmDlx: vi.fn().mockResolvedValue(undefined),
}));

describe('initGit', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('skips all execa calls when ctx.git is false', async () => {
    const { execa } = await import('execa');
    const { initGit } = await import('../../src/postinstall/git.js');
    await initGit({ ...BASE_CTX, git: false });
    expect(execa).not.toHaveBeenCalled();
  });

  it('calls git init, add, and commit when ctx.git is true', async () => {
    const { execa } = await import('execa');
    const { initGit } = await import('../../src/postinstall/git.js');
    await initGit(BASE_CTX);

    const calls = (execa as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0]).toEqual(['git', ['init'],      { cwd: BASE_CTX.targetDir }]);
    expect(calls[1]).toEqual(['git', ['add', '.'],  { cwd: BASE_CTX.targetDir }]);
    expect(calls[2][0]).toBe('git');
    expect(calls[2][1][0]).toBe('commit');
  });
});

// ── shadcn.ts ─────────────────────────────────────────────────────────────────

describe('runShadcnAdd', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('skips pmDlx when ctx.ui is not shadcn', async () => {
    const { pmDlx } = await import('../../src/pm/run.js');
    const { runShadcnAdd } = await import('../../src/postinstall/shadcn.js');
    await runShadcnAdd({ ...BASE_CTX, ui: 'heroui' });
    expect(pmDlx).not.toHaveBeenCalled();
  });

  it('calls pmDlx with shadcn@latest add --yes <components> when ui is shadcn', async () => {
    const { pmDlx } = await import('../../src/pm/run.js');
    const { runShadcnAdd } = await import('../../src/postinstall/shadcn.js');
    await runShadcnAdd(BASE_CTX);

    expect(pmDlx).toHaveBeenCalledOnce();
    const [pmArg, cwdArg, pkgArg, argsArg] = (pmDlx as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(pmArg).toBe('npm');
    expect(cwdArg).toBe(BASE_CTX.targetDir);
    expect(pkgArg).toBe('shadcn@latest');
    expect(argsArg).toContain('add');
    expect(argsArg).toContain('--yes');
    expect(argsArg).toContain('button');
    expect(argsArg).toContain('card');
    expect(argsArg).toContain('input');
    expect(argsArg).toContain('label');
  });
});
