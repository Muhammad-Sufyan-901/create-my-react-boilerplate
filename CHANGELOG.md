# CHANGELOG

---

## [0.1.2] — HeroUI v3 & TypeScript 6 compatibility — 2026-05-03

### Fixed

- **HeroUI v3 upgrade** — replaced `@heroui/react ^2.7.8` + `@heroui/theme` with `@heroui/react ^3.0.3` + `@heroui/styles ^3.0.3`; dropped `framer-motion` (no longer a peer dep in v3).
- **CSS** — `templates/ui/heroui/src/index.css`: replaced `@plugin "@heroui/theme" { … }` (incompatible with Tailwind v4) with `@import "@heroui/styles"` (v3 CSS-first approach).
- **Provider** — removed `HeroUIProvider` from `templates/base/src/main.[ext].ejs`; v3 no longer requires an app-level provider.
- **Card API** — updated all HeroUI auth/dashboard templates to use the v3 compound component pattern (`Card.Header`, `Card.Content`, `Card.Footer`, `Card.Title`, `Card.Description`) instead of the removed `CardHeader`/`CardBody`/`CardFooter` named exports.
- **Input API** — replaced `<Input label onValueChange isRequired>` (v2) with native `<label>` + `<input onChange>` elements in Login, Signup, and ForgotPassword templates; v3 `Input` is a low-level primitive that no longer accepts those props.
- **Button API** — replaced `color="primary"` with `variant="primary"`, `variant="bordered"` with `variant="outline"`, `isLoading` with `isDisabled`, and `as={Link}` with `onPress` + `useNavigate` across all HeroUI template branches.
- **TypeScript 6** — removed deprecated `baseUrl` option from `templates/lang/ts/tsconfig.app.json` (TS 6 treats it as an error; `paths` no longer requires it).
- **TS2882 CSS import error** — added `templates/lang/ts/src/vite-env.d.ts` (`/// <reference types="vite/client" />`); silences TypeScript 6's `noUncheckedSideEffectImports` error on `import '@/index.css'`.
- **Lock file** — updated `versions.lock.json` to pin `typescript ^6.0.3`, `@heroui/react ^3.0.3`, `@heroui/styles ^3.0.3`; removed `@heroui/theme` and `framer-motion`.

### Changed

- `src/deps/resolve.ts` — heroui prod deps: `['@heroui/react', '@heroui/theme', 'framer-motion']` → `['@heroui/react', '@heroui/styles']`.
- `tests/unit/resolve.test.ts` — updated heroui dep assertions to match v3 package set.
- `tests/snapshot/__snapshots__/permutations.test.ts.snap` — 24 snapshots regenerated to reflect template changes.

---

## [0.1.1] — shadcn/ui component bundling & CI improvements — 2026-04-29

### Fixed

- **shadcn runtime import error** — generated shadcn projects failed at runtime with `Failed to resolve import @/components/ui/button`. Root cause: templates imported shadcn components that didn't exist because `runShadcnAdd` postinstall is skipped with `--no-install`. Fix: bundled 7 EJS template files directly into `templates/ui/shadcn/src/`:
  - `src/lib/utils.[ext].ejs` (`cn` utility)
  - `src/components/ui/button.[ext].ejs`
  - `src/components/ui/card.[ext].ejs`
  - `src/components/ui/input.[ext].ejs`
  - `src/components/ui/label.[ext].ejs`
  - `src/components/ui/badge.[ext].ejs`
  - `src/components/ui/separator.[ext].ejs`
- Added `clsx`, `tailwind-merge`, `@radix-ui/react-slot` to shadcn prod deps and `versions.lock.json`.
- `runShadcnAdd` is retained — if it succeeds it upgrades components to official shadcn versions; if it fails the bundled versions work as a fallback.

### Changed

- `package.json` — bumped version to `0.1.1`.
- `.github/workflows/publish.yml` — switched from `NPM_TOKEN` secret to npm Trusted Publishing (OIDC); added `--provenance` flag to link the published package to its GitHub source. No `NPM_TOKEN` secret required going forward.
- `package.json` — added `author` field.
- `tests/snapshot/__snapshots__/permutations.test.ts.snap` — 4 shadcn permutation snapshots updated to include new bundled component files.

### Added

- `PUBLISH.md` — step-by-step guide for npm publishing (first manual publish, Trusted Publisher setup, and automated tag-based releases).

---

## [Phase G] — Polish & Publish — 2026-04-29

### Added
- `.github/workflows/ci.yml` — PR/push CI matrix on Node 20 + 22: `npm ci → build → test`.
- `.github/workflows/publish.yml` — Auto-publish to npm on `v*` tags via `NPM_TOKEN` secret.
- `README.md` — Troubleshooting section (shadcn failure, git init failure, Node version, registry propagation).

### Changed
- `package.json` — `files` array changed from `"dist"` to `"dist/index.mjs"` to exclude the sourcemap; package shrinks from 31.5 kB → 18.9 kB (43 files).
- `README.md` — Removed inaccurate `tailwind.config.ts` entry (Tailwind v4 is CSS-first), fixed `PRD.md` dead link, updated `git clone` URL.

### Pending (requires npm credentials)
- `npm publish --access public`
- Post-publish `npx` smoke test on a clean machine

---

## [Phase F] — Testing — 2026-04-29

### Added

- `tests/unit/pm.test.ts` — 6 tests for `detectPackageManager()`: null on missing env, correct PM for npm/yarn/pnpm/bun user agents, null for unknown agent.
- `tests/unit/questions.test.ts` — 6 tests for the `questions` registry shape: each entry has `id`, `message`, `choices`, `defaultValue`; every choice has a non-empty `value` and `label`.
- `tests/snapshot/permutations.test.ts` — 8 snapshot tests (one per permutation: ts/js × react-router/tanstack-router × shadcn/heroui); each asserts the sorted file tree, `src/main.[ext]`, and `vite.config.[sext]` against committed snapshots in `tests/snapshot/__snapshots__/`.
- `tests/e2e/cli.test.ts` — 3 E2E tests that spawn `dist/index.mjs` with `--no-install --no-git --offline`; assert exit code 0 and presence of key files (`package.json`, `index.html`, `src/main.[ext]`, `vite.config.[sext]`). Skipped automatically when `dist/index.mjs` is absent.

### Changed

- `src/utils/fs.ts` — `pkgRoot` now walks up from the current file until it finds `package.json` (uses `fileURLToPath` to handle percent-encoded paths); previously used a hardcoded `../../` relative that broke when bundled into `dist/index.mjs`.
- `vitest.config.ts` — added `testTimeout: 30_000` to accommodate snapshot and E2E tests.

**91 tests passing (68 pre-existing + 6 pm + 6 questions + 8 snapshot + 3 E2E).**

---

## [Phase E] — Post-scaffold Actions — 2026-04-29

### Added

- `src/deps/resolve.ts` — `getBaseDeps(ctx)` builds the framework-level prod/dev dep list (react, react-dom, vite, tailwindcss, router, UI lib, testing, ESLint, Prettier, TypeScript tooling conditional on `isTS`). `resolveDeps` merges base + feature deps, deduplicates, then either hits `pacote.manifest` in parallel (online) or reads `versions.lock.json` (offline). `writeResolvedDeps` patches the generated `package.json` with resolved semver ranges.
- `src/deps/versions.lock.json` — pinned versions for React 19, Vite 6, Tailwind v4, both routers, both UI libs, and all tooling.
- `src/postinstall/git.ts` — runs `git init && git add . && git commit` in `ctx.targetDir`; no-ops when `ctx.git === false`.
- `src/postinstall/shadcn.ts` — runs `<pm> dlx shadcn@latest add --yes button card input label badge separator`; no-ops when `ctx.ui !== 'shadcn'`.
- `tests/unit/resolve.test.ts` — 11 tests: `getBaseDeps` variants, `writeResolvedDeps`, offline `resolveDeps` (lock reads, missing-package fallback, deduplication).
- `tests/unit/postinstall.test.ts` — 7 tests: `initGit` skip + execa call sequence, `runShadcnAdd` skip + `pmDlx` argument assertions.

### Changed

- `src/index.ts` — replaced stub with full orchestrator: scaffold → dep resolve → install (optional) → shadcn add (optional) → git init (optional) → outro. Each step uses a `@clack/prompts` spinner; failures are caught individually so one non-critical step (shadcn add, git) doesn't abort the whole run.
- `templates/base/vite.config.[sext].ejs` — added `@tailwindcss/vite` plugin (required for Tailwind v4 + Vite).
- `templates/base/src/main.[ext].ejs` — wraps `<RouterProvider>` in `<AuthProvider>` so auth context is available app-wide.

---

## [Phase D] — Build the Templates — 2026-04-29

### Added

- `src/scaffold/render.ts` — added `[sext]` placeholder (`ts`|`js`) for config-file names; 2 new tests.
- `templates/base/` — `index.html.ejs`, `package.json.ejs` (scripts branch on `isTS`), `vite.config.[sext].ejs` (path alias `@/*`), `.gitignore`, `src/index.css` (`@import "tailwindcss"`), `src/main.[ext].ejs` (EJS branches on `router` + `ui` for all 4 combos).
- `templates/lang/ts/` — `tsconfig.json`, `tsconfig.app.json` (bundler resolution, `@/*` alias), `tsconfig.node.json`.
- `templates/lang/js/` — `jsconfig.json` (`checkJs`, `@/*` alias).
- `templates/router/react-router/files/src/router/index.[ext].ejs` — `createBrowserRouter` with layout routes for `ProtectedRoute` and `AdminRoute`.
- `templates/router/tanstack-router/files/src/router/index.[ext].ejs` — `createRouter` with `createRootRoute`; TS `declare module Register` block guarded by `isTS`.
- `templates/ui/shadcn/components.json.ejs` — `tsx` field driven by `isTS`.
- `templates/ui/shadcn/src/index.css` — full Tailwind v4 `@theme` token set for light + dark.
- `templates/ui/heroui/src/index.css` — Tailwind v4 `@plugin "@heroui/theme"`.
- `templates/tooling/eslint-prettier/eslint.config.[sext].ejs` — `typescript-eslint` config for TS, plain ESLint config for JS.
- `templates/tooling/eslint-prettier/prettier.config.js` — single quotes, trailing commas, `prettier-plugin-tailwindcss`.
- `templates/tooling/vitest/vitest.config.[sext].ejs` — jsdom environment, `@testing-library/jest-dom` setup file.
- `templates/tooling/vitest/src/test/setup.[sext].ejs` — `@testing-library/jest-dom` import.
- `templates/tooling/ci/.github/workflows/ci.yml.ejs` — GitHub Actions matrix (Node 20+22), full per-PM install/lint/typecheck/test/build pipeline.
- `templates/features/landing/feature.json` + `files/` — Landing page, Hero, FeatureSection (shadcn/HeroUI conditional), Footer.
- `templates/features/auth/feature.json` + `files/` — `AuthContext` (mock login/signup/logout, sessionStorage), `useAuth` re-export, Login/Signup/ForgotPassword pages (all router×UI EJS combos), `ProtectedRoute`, `AdminRoute`.
- `templates/features/user-dashboard/feature.json` + `files/` — Dashboard page, DashboardLayout, Sidebar (NavLink active class, logout).
- `templates/features/admin-dashboard/feature.json` + `files/` — Admin page, AdminLayout, UsersTable with mock data and role badge.

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
