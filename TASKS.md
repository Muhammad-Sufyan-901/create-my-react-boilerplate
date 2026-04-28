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

## Phase E — Post-scaffold Actions

- [ ] `src/deps/resolve.ts` — parallel `pacote.manifest` calls, write resolved versions into the generated `package.json`
- [ ] `src/deps/versions.lock.json` — offline fallback pinned versions file
- [ ] `src/pm/run.ts` — `pmInstall` runs install with chosen PM, streaming output (already scaffolded; wire into orchestrator)
- [ ] `src/postinstall/shadcn.ts` — if `ui === 'shadcn'`, run `dlx shadcn add <primitives>`
- [ ] `src/postinstall/git.ts` — `git init` + initial commit (skippable via `--no-git`)
- [ ] Final outro screen with next-steps (`cd <name> && <pm> run dev`)
- [ ] Wire everything into `src/index.ts` orchestrator (replacing current stub)

---

## Phase F — Testing

- [ ] Snapshot tests: scaffold all 8 permutations into tmp dirs, snapshot file trees + key file contents
- [ ] E2E tests: spawn CLI → install → `<pm> build` → assert exit 0 (Node 20 + 22 matrix)
- [ ] Unit tests: prompts flow, PM detection, manifest merging, dep resolver

---

## Phase G — Polish & Publish

- [ ] README — GIF demo, full flag reference, troubleshooting section
- [ ] `npm pack` dry-run smoke test
- [ ] `npm publish --access public`
- [ ] GitHub Actions: PR test matrix, auto-publish on version tag
- [ ] Verify `npx create-my-react-boilerplate test-app` works end-to-end from a clean machine
