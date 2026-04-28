# CHANGELOG

---

## [Phase C] — Templating Engine — 2026-04-28

### Added
- `src/scaffold/render.ts` — `renderLayer(srcDir, targetDir, ctx)` walks a template layer directory; `.ejs` files are rendered via EJS and the suffix stripped, other files are copied as-is; filenames and directory names are interpolated (`[ext]`, `__router__`, `__ui__`, `__lang__`). Exported `interpolateFilename` for testing.
- `src/scaffold/inject.ts` — `injectFragments(targetDir, ctx, templatesDir?)` walks the rendered output tree and replaces `/* @inject:<tag> */` markers with the content of matching fragment files; looks in `router/{router}/fragments/` then `ui/{ui}/fragments/`; leaves unresolvable markers intact. Exported `resolveFragment` for testing.
- `src/scaffold/manifest.ts` — `loadManifest(featureDir)` parses `feature.json`; `mergeManifests(manifests, ctx)` deduplicates and filters deps by UI + language; `emitRoutes(manifests, ctx)` writes `src/router/routes.generated.[ext]` aggregating all feature routes and navItems.
- `src/scaffold/compose.ts` — `composeProject(ctx, templatesDir?)` orchestrates the full layer pipeline: base → lang → router → ui → tooling → features, then runs fragment injection and returns `ComposedDeps`. Accepts an optional `templatesDir` override to support unit testing without real template files.
- `vitest.config.ts` — configures vitest to find tests under `tests/**/*.test.ts` with v8 coverage.
- `tests/unit/render.test.ts` — 16 tests covering `interpolateFilename` and `renderLayer` (EJS rendering, filename interpolation, directory interpolation, overwrite semantics, no-op on missing dir).
- `tests/unit/inject.test.ts` — 12 tests covering `resolveFragment` (lookup order, fallback, null on miss) and `injectFragments` (single/multi marker, unknown marker preserved, nested dirs, non-text files skipped).
- `tests/unit/manifest.test.ts` — 13 tests covering `loadManifest`, `mergeManifests` (dep filtering by UI/lang, deduplication, multi-manifest merge), and `emitRoutes` (output path, content, JS/TS variants).
- `tests/unit/compose.test.ts` — 7 tests covering `composeProject` end-to-end with minimal test fixture templates (dir creation, layer ordering, routes emission, dep return, JS context).

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
