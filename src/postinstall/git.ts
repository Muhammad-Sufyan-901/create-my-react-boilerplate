import { execa } from 'execa';
import type { ScaffoldContext } from '../types.js';

/**
 * Initialises a git repository in the generated project directory and creates
 * an initial commit.  Skipped entirely when ctx.git is false (--no-git).
 */
export async function initGit(ctx: ScaffoldContext): Promise<void> {
  if (!ctx.git) return;

  await execa('git', ['init'], { cwd: ctx.targetDir });
  await execa('git', ['add', '.'], { cwd: ctx.targetDir });
  await execa('git', ['commit', '-m', 'chore: initial commit from create-my-react-boilerplate'], {
    cwd: ctx.targetDir,
  });
}
