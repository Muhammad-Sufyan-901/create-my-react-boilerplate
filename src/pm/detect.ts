import type { PackageManager } from '../types.js';

/** Reads the package manager from the npm_config_user_agent env var. */
export function detectPackageManager(): PackageManager | null {
  const agent = process.env.npm_config_user_agent;
  if (!agent) return null;
  if (agent.startsWith('bun')) return 'bun';
  if (agent.startsWith('pnpm')) return 'pnpm';
  if (agent.startsWith('yarn')) return 'yarn';
  if (agent.startsWith('npm')) return 'npm';
  return null;
}
