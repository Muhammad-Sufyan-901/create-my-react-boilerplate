import { program } from 'commander';
import { runPrompts } from './prompts/index.js';
import { logger } from './utils/logger.js';
import type { Language, Router, UI, PackageManager } from './types.js';

// Read version from package.json at runtime
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

program
  .name('create-my-react-boilerplate')
  .description('Scaffold a modern React app with Landing, Auth, User Dashboard, and Admin Dashboard')
  .version(version, '-v, --version')
  .argument('[project-name]', 'Name of the project to create')
  // Language flags
  .option('--ts', 'Use TypeScript (default)')
  .option('--js', 'Use JavaScript')
  // Variant flags
  .option('--router <router>', 'Router to use: react-router | tanstack-router')
  .option('--ui <ui>',         'UI library: shadcn | heroui')
  // Package manager
  .option('--pm <pm>',         'Package manager: npm | yarn | pnpm | bun')
  // Install / git toggles
  .option('--no-install',      'Skip dependency installation')
  .option('--no-git',          'Skip git init')
  // Offline / pinned deps
  .option('--offline',         'Use pinned versions from versions.lock.json (no network)')
  .action(async (projectName: string | undefined, opts) => {
    try {
      const language: Language | undefined =
        opts.ts ? 'ts' : opts.js ? 'js' : undefined;

      const router: Router | undefined =
        opts.router === 'react-router' || opts.router === 'tanstack-router'
          ? opts.router
          : opts.router
          ? (logger.error(`Unknown router "${opts.router}". Must be react-router or tanstack-router.`), process.exit(1))
          : undefined;

      const ui: UI | undefined =
        opts.ui === 'shadcn' || opts.ui === 'heroui'
          ? opts.ui
          : opts.ui
          ? (logger.error(`Unknown UI "${opts.ui}". Must be shadcn or heroui.`), process.exit(1))
          : undefined;

      const pm: PackageManager | undefined =
        opts.pm === 'npm' || opts.pm === 'yarn' || opts.pm === 'pnpm' || opts.pm === 'bun'
          ? opts.pm
          : opts.pm
          ? (logger.error(`Unknown package manager "${opts.pm}". Must be npm | yarn | pnpm | bun.`), process.exit(1))
          : undefined;

      const ctx = await runPrompts(projectName, {
        language,
        router,
        ui,
        pm,
        install: opts.install !== false,
        git: opts.git !== false,
        offline: opts.offline === true,
      });

      // Phase B+ will fill in scaffold / install / git steps here.
      logger.info(`Context ready: ${JSON.stringify({ ...ctx, targetDir: ctx.targetDir }, null, 2)}`);
      logger.warn('Scaffolding engine not yet implemented — coming in Phase B/C.');
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
