# CHANGELOG

All notable changes to this project are documented here. Each entry corresponds to a completed phase or task from `TASKS.md`.

---

## [Phase B] — CLI Skeleton — 2026-04-28

### Added
- `src/index.ts` — `commander` entry point; parses `<project-name>` argument and all CLI flags (`--ts`, `--js`, `--router`, `--ui`, `--pm`, `--no-install`, `--no-git`, `--offline`)
- `src/prompts/index.ts` — `runPrompts()` orchestrates the full `@clack/prompts` interactive flow; handles project-name validation, target-dir conflict detection, and variant selection
- `src/prompts/questions.ts` — declarative question registry (`language`, `router`, `ui`, `packageManager`); adding a new prompt requires only a new entry here
- `src/pm/detect.ts` — reads `npm_config_user_agent` to auto-detect the invoking package manager
- `src/pm/run.ts` — `pmInstall` and `pmDlx` wrappers for all four package managers via `execa`
- `src/utils/validate.ts` — `validateProjectName` wraps `validate-npm-package-name`
- `src/utils/fs.ts` — `isDirEmpty` and `pkgRoot` (ESM-safe, no `__dirname`)
- `src/utils/logger.ts` — `picocolors`-backed `logger.info/success/warn/error/dim`
- `src/types.ts` — `ScaffoldContext`, `FeatureManifest`, `RouteDefinition`, `NavItem`, `FeatureDependencies`, `ComposedDeps`, `Question` types

### Fixed
- Threaded `offline` flag through `CliFlags` → `runPrompts` return → `ScaffoldContext`
- Fixed `@clack/prompts` type errors: `validate` callback now guards `string | undefined` with `?? ''`; `options` array cast to `Option<T>[]` to satisfy deferred conditional type

---

## [Phase A] — Bootstrap — 2026-04-28

### Added
- `package.json` — `name`, `bin`, `type: module`, `engines.node >= 20`, all runtime and dev dependencies
- `tsconfig.json` — `Node16` module resolution, `strict`, `ES2022` target
- `tsup.config.ts` — single ESM output (`dist/index.mjs`), shebang banner, all `node_modules` external
- `PLANNING.md` — full architecture document (CLI design, templating strategy, execution plan)
- `README.md` — user-facing documentation (quick start, CLI flags, generated project structure)
- `CLAUDE.md` — guidance file for Claude Code

---

## [Chore] — Project Tracking — 2026-04-28

### Added
- `.gitignore` — excludes `node_modules/`, `dist/`, `coverage/`, logs, `.env`, OS/editor artifacts, `.claude/`, `.agents/`
- `TASKS.md` — full phase-by-phase checklist extracted from `PLANNING.md`
- `CHANGELOG.md` — this file
