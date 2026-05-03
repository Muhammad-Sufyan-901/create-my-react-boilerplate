# TASKS.md — `create-my-react-boilerplate`

Extracted from `PLANNING.md`. Check off each item as it is completed; update `CHANGELOG.md` and commit after every phase.

---

## Phase A — Bootstrap the CLI repo ✅

- [x] `npm init` — set `name`, `bin`, `type: module`, `engines.node >= 20`
- [x] Add deps: `commander`, `@clack/prompts`, `fs-extra`, `execa`, `ejs`, `picocolors`, `validate-npm-package-name`, `pacote`
- [x] Add devDeps: `typescript`, `tsup`, `vitest`, `@types/*`
- [x] Configure `tsup` to bundle ESM with `#!/usr/bin/env node` shebang banner
- [x] Wire `bin` entry in `package.json` → `dist/index.mjs`; `npm link` for local dev

---

## Phase B — CLI Skeleton ✅

- [x] `commander` parses `<project-name>` + flags (`--ts`, `--js`, `--router`, `--ui`, `--pm`, `--no-install`, `--no-git`, `--offline`)
- [x] `src/prompts/questions.ts` — declarative question registry; flags pre-fill answers, missing ones prompted via `@clack`
- [x] `src/pm/detect.ts` — `npm_config_user_agent` parser + interactive PM fallback
- [x] Project-name validation (`validate-npm-package-name`), target-dir-empty check, conflict-resolution confirm prompt
- [x] `ScaffoldContext` fully wired through `runPrompts` return value

---

## Phase C — Templating Engine ✅

- [x] `src/scaffold/render.ts` — recursive EJS render with filename interpolation (`[ext]`, `__router__/`, etc.)
- [x] `src/scaffold/compose.ts` — layer ordering (`base → lang → router → ui → tooling → features`), later layer wins
- [x] `src/scaffold/inject.ts` — `/* @inject:<tag> */` marker replacement with router/ui fragments
- [x] `src/scaffold/manifest.ts` — load `feature.json`, merge route lists, emit `routes.generated.[ext]`
- [x] Unit tests for `render`, `compose`, `inject`, `manifest` (48 tests, all passing)

---

## Phase D — Build the Templates ✅

- [x] `templates/base/` — `index.html`, `package.json`, `vite.config.[sext]`, `.gitignore`, `src/index.css`, `src/main.[ext]` (EJS, covers all 4 router×UI combos)
- [x] `templates/lang/ts/` & `templates/lang/js/` — `tsconfig.json`/`tsconfig.app.json`/`tsconfig.node.json` and `jsconfig.json` with `@/*` alias
- [x] `templates/router/react-router/` — `createBrowserRouter` with ProtectedRoute/AdminRoute layout routes
- [x] `templates/router/tanstack-router/` — code-based router with `createRootRoute`, TS `Register` declaration
- [x] `templates/ui/shadcn/` — `components.json.ejs` + full Tailwind v4 CSS variable theme (light/dark)
- [x] `templates/ui/heroui/` — Tailwind v4 `@plugin "@heroui/theme"` CSS; provider wired in `main.[ext]` via EJS
- [x] `templates/features/landing/` — Landing page with Hero, FeatureSection, Footer; shadcn/HeroUI conditional imports
- [x] `templates/features/auth/` — `AuthContext`, `useAuth`, Login/Signup/ForgotPassword pages, `ProtectedRoute`, `AdminRoute`; all 4 combos via EJS
- [x] `templates/features/user-dashboard/` — Dashboard page, DashboardLayout, Sidebar with NavLink and logout
- [x] `templates/features/admin-dashboard/` — Admin page, AdminLayout, UsersTable with role badge
- [x] `templates/tooling/eslint-prettier/` — flat ESLint config (TS `typescript-eslint` vs JS variant), `prettier.config.js`
- [x] `templates/tooling/vitest/` — `vitest.config.[sext]` (jsdom, `@testing-library/jest-dom` setup)
- [x] `templates/tooling/ci/` — `.github/workflows/ci.yml` parameterised per package manager (npm/yarn/pnpm/bun) and TS/JS
- [x] Added `[sext]` interpolation to `render.ts` (`ts`|`js` for config files); 2 new tests (50 total)

---

## Phase E — Post-scaffold Actions ✅

- [x] `src/deps/resolve.ts` — `getBaseDeps(ctx)` builds framework dep lists; `resolveDeps` parallel-resolves via `pacote.manifest`; offline path reads `versions.lock.json`; `writeResolvedDeps` writes to generated `package.json`
- [x] `src/deps/versions.lock.json` — pinned versions for all packages (React 19, Vite 6, Tailwind v4, etc.)
- [x] `src/pm/run.ts` — `pmInstall` already implemented; wired into orchestrator
- [x] `src/postinstall/shadcn.ts` — runs `dlx shadcn@latest add --yes button card input label badge separator`
- [x] `src/postinstall/git.ts` — `git init` + `git add .` + initial commit; skips if `ctx.git === false`
- [x] Final outro screen with `cd <name>` + `<pm> run dev` next steps
- [x] `src/index.ts` fully wired: scaffold → resolve → install → shadcn → git → outro (spinners throughout)
- [x] Template fixes: `vite.config.[sext].ejs` adds `@tailwindcss/vite` plugin; `main.[ext].ejs` wraps app in `<AuthProvider>`
- [x] 18 new unit tests (resolve × 11, postinstall × 7); 68 total passing

---

## Phase F — Testing ✅

- [x] Snapshot tests: scaffold all 8 permutations into tmp dirs, snapshot file trees + key file contents
- [x] E2E tests: spawn CLI → install → `<pm> build` → assert exit 0 (Node 20 + 22 matrix)
- [x] Unit tests: prompts flow, PM detection, manifest merging, dep resolver

---

## Phase G — Polish & Publish

- [x] README — full flag reference + troubleshooting section added; GIF demo is a post-publish manual step
- [x] `npm pack` dry-run smoke test — 43 files, 18.9 kB (sourcemap excluded via `files` field)
- [ ] `npm publish --access public` — **requires npm credentials; run manually:** `npm publish --access public`
- [x] GitHub Actions: PR test matrix (Node 20+22) in `.github/workflows/ci.yml`; auto-publish on `v*` tag in `.github/workflows/publish.yml` (uses `NPM_TOKEN` secret)
- [ ] Verify `npx create-my-react-boilerplate test-app` works end-to-end — **run after publishing**

---

## Phase H — Architecture Refactoring

### H1 — Bookkeeping & CLI Source

- [x] Append `## Architecture Refactoring Plan` to `PLANNING.md`
- [x] Append `## Phase H` checklist to `TASKS.md`
- [x] Bump `package.json` version to `0.2.0`
- [x] `src/deps/resolve.ts` — add `clsx`, `tailwind-merge`, `zustand`, `axios`, `@tanstack/react-query`, `next-themes` to base prod deps; remove from shadcn-only branch
- [x] `src/deps/versions.lock.json` — pin all new packages
- [x] `src/scaffold/manifest.ts` — change `emitRoutes` output path to `src/routes/routes.generated.[ext]`
- [x] `src/scaffold/compose.ts` — rename `'landing'` → `'home'` in FEATURES array

### H2 — Base Layer Additions

- [x] `templates/base/src/lib/utils.[ext].ejs` — `cn()` helper (moved from shadcn layer; now universal)
- [x] `templates/base/src/lib/axios.[ext].ejs` — Axios instance with auth interceptor
- [x] `templates/base/src/config/env.[ext].ejs` — typed env loader
- [x] `templates/base/src/constants/index.[ext].ejs` — placeholder constants barrel
- [x] `templates/base/src/models/user.model.[ext].ejs` — `User` domain shape
- [x] `templates/base/src/types/api.type.[ext].ejs` — shared API envelope type
- [x] `templates/base/src/store/useAuthStore.[ext].ejs` — Zustand auth store with sessionStorage persist
- [x] `templates/base/src/middlewares/authMiddleware.[ext].ejs` — route guard (beforeLoad / loader)
- [x] `templates/base/src/middlewares/guestMiddleware.[ext].ejs` — guest-only guard
- [x] `templates/base/src/providers/theme-provider.[ext].ejs` — next-themes wrapper
- [x] `templates/base/src/hooks/useMobile.[ext].ejs` + `useTheme.[ext].ejs`
- [x] `templates/base/src/components/common/` — Box, Container, Text, Heading, Image, Link, NotFound, ThemeToggle
- [x] `templates/base/src/components/layouts/RootLayout.[ext].ejs`
- [x] `.gitkeep` scaffolds for `assets/`, `routes/`, `features/`, `constants/`, `types/models/`

### H3 — Base Layer Rewrites

- [x] `templates/base/src/main.[ext].ejs` — drop AuthProvider; add ThemeProvider + QueryClientProvider; import from `@/routes`
- [x] `templates/base/src/index.css` — add CSS variables / theme tokens
- [x] `templates/base/vite.config.[sext].ejs` — expanded alias map + Vitest test block

### H4 — Lang Layer

- [x] `templates/lang/ts/tsconfig.app.json` — extend `paths` with all new `@/<folder>/*` aliases
- [x] `templates/lang/ts/src/vite-env.d.ts` — add `ImportMetaEnv` interface
- [x] `templates/lang/js/jsconfig.json` — mirror alias map

### H5 — UI Layer

- [x] Delete `templates/ui/shadcn/src/lib/utils.[ext].ejs` (moved to base)

### H6 — Router Layer

- [x] Move `templates/router/react-router/files/src/router/` → `src/routes/`; rewrite to use loader-based guards
- [x] Move `templates/router/tanstack-router/files/src/router/` → `src/routes/`; rewrite to use `beforeLoad` guards

### H7 — Features

- [x] Rename `templates/features/landing/` → `templates/features/home/`; update `feature.json`
- [x] `home`: restructure to `pages/Home`, `data/features`, `index.ts` barrel
- [x] `auth`: delete AuthContext, useAuth, ProtectedRoute, AdminRoute; add schemas, api, hooks, services, types, layouts/AuthLayout, barrel
- [x] `auth` pages: rewrite Login/Signup/ForgotPassword to use react-hook-form + zod
- [x] `user-dashboard`: move DashboardLayout → layouts; extract stats → data; update imports; add barrel
- [x] `admin-dashboard`: move AdminLayout → layouts; split UsersTable into data/types/api/hooks; add barrel

### H8 — Tests & Verification

- [x] `tests/unit/resolve.test.ts` — assert new base prod deps
- [x] `tests/unit/manifest.test.ts` — update `emitRoutes` path assertion
- [x] `tests/unit/compose.test.ts` — update FEATURES `landing` → `home`
- [x] Delete snapshot file; run `npm run build && npm test` to regenerate (93 tests passing, 24 snapshots written)
- [x] `tests/e2e/cli.test.ts` — no changes needed (no old path references)

### H9 — Documentation

- [x] `CHANGELOG.md` — add `[0.2.0]` entry documenting all structural changes
