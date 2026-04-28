import { program } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { runPrompts } from './prompts/index.js';
import { composeProject } from './scaffold/compose.js';
import { resolveDeps, writeResolvedDeps } from './deps/resolve.js';
import { pmInstall } from './pm/run.js';
import { runShadcnAdd } from './postinstall/shadcn.js';
import { initGit } from './postinstall/git.js';
import { logger } from './utils/logger.js';
import type { Language, Router, UI, PackageManager } from './types.js';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

program
  .name('create-my-react-boilerplate')
  .description('Scaffold a modern React app with Landing, Auth, User Dashboard, and Admin Dashboard')
  .version(version, '-v, --version')
  .argument('[project-name]', 'Name of the project to create')
  .option('--ts',              'Use TypeScript (default)')
  .option('--js',              'Use JavaScript')
  .option('--router <router>', 'Router: react-router | tanstack-router')
  .option('--ui <ui>',         'UI library: shadcn | heroui')
  .option('--pm <pm>',         'Package manager: npm | yarn | pnpm | bun')
  .option('--no-install',      'Skip dependency installation')
  .option('--no-git',          'Skip git init')
  .option('--offline',         'Use pinned versions from versions.lock.json (no network)')
  .action(async (projectName: string | undefined, opts) => {
    try {
      // ── Parse flags ───────────────────────────────────────────────────────
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

      // ── Prompts ───────────────────────────────────────────────────────────
      const ctx = await runPrompts(projectName, {
        language,
        router,
        ui,
        pm,
        install: opts.install !== false,
        git:     opts.git !== false,
        offline: opts.offline === true,
      });

      // ── Phase 1: Scaffold ─────────────────────────────────────────────────
      const scaffoldSpin = p.spinner();
      scaffoldSpin.start('Scaffolding project files…');
      let featureDeps;
      try {
        featureDeps = await composeProject(ctx);
        scaffoldSpin.stop('Project files created');
      } catch (err) {
        scaffoldSpin.stop('Scaffold failed', 1);
        throw err;
      }

      // ── Phase 2: Resolve deps ─────────────────────────────────────────────
      const resolveSpin = p.spinner();
      resolveSpin.start(
        ctx.offline
          ? 'Writing pinned dependency versions…'
          : 'Resolving latest dependency versions…',
      );
      try {
        const resolved = await resolveDeps(featureDeps, ctx);
        await writeResolvedDeps(ctx.targetDir, resolved.prod, resolved.dev);
        resolveSpin.stop('Dependencies resolved');
      } catch (err) {
        resolveSpin.stop('Dep resolution failed', 1);
        throw err;
      }

      // ── Phase 3: Install ──────────────────────────────────────────────────
      if (ctx.install) {
        const installSpin = p.spinner();
        installSpin.start(`Installing with ${ctx.pm}…`);
        try {
          await pmInstall(ctx.pm, ctx.targetDir);
          installSpin.stop('Dependencies installed');
        } catch (err) {
          installSpin.stop('Install failed', 1);
          throw err;
        }

        // ── Phase 4: shadcn postinstall ─────────────────────────────────
        if (ctx.ui === 'shadcn') {
          const shadcnSpin = p.spinner();
          shadcnSpin.start('Adding shadcn/ui components…');
          try {
            await runShadcnAdd(ctx);
            shadcnSpin.stop('shadcn/ui components added');
          } catch {
            shadcnSpin.stop('shadcn add failed — run manually', 1);
            logger.warn(`Run manually: npx shadcn@latest add button card input label badge separator`);
          }
        }
      }

      // ── Phase 5: Git ──────────────────────────────────────────────────────
      if (ctx.git) {
        const gitSpin = p.spinner();
        gitSpin.start('Initialising git repository…');
        try {
          await initGit(ctx);
          gitSpin.stop('Git repository initialised');
        } catch {
          gitSpin.stop('git init failed — initialise manually', 1);
        }
      }

      // ── Outro ─────────────────────────────────────────────────────────────
      const devCmd = ctx.pm === 'npm' ? 'npm run dev' : `${ctx.pm} run dev`;
      const installNote = ctx.install ? '' : `\n  ${pc.dim(`${ctx.pm} install`)}  ← run first`;

      p.outro(
        `${pc.green('✔')} ${pc.bold(ctx.name)} is ready!${installNote}\n\n` +
        `  ${pc.dim('cd')} ${ctx.name}\n` +
        `  ${pc.cyan(devCmd)}\n`,
      );
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
