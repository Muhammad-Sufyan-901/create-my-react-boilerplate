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

## Phase D — Build the Templates

- [ ] `templates/base/` — Vite config (TS+JS), Tailwind v4 (`@import "tailwindcss"`), ESLint flat config, Prettier, `.gitignore`, README, `index.html`
- [ ] `templates/lang/ts/` & `templates/lang/js/` — `tsconfig.json` / `jsconfig.json` + `@/*` path alias
- [ ] `templates/router/react-router/` — `createBrowserRouter`, route objects consumed from `routes.generated`
- [ ] `templates/router/tanstack-router/` — code-based config consuming the same generated routes
- [ ] `templates/ui/shadcn/` — `components.json`, theme CSS vars, postinstall primitive list
- [ ] `templates/ui/heroui/` — provider in `main.[ext]`, theme config, Tailwind plugin
- [ ] `templates/features/landing/` — Hero, Features, CTA, Footer with conditional UI imports
- [ ] `templates/features/auth/` — `/login`, `/signup`, `/forgot-password`, mock `AuthContext` + `useAuth`, route guards
- [ ] `templates/features/user-dashboard/` — `/dashboard` layout, sidebar, profile, settings stub
- [ ] `templates/features/admin-dashboard/` — `/admin` layout, users table, role guard
- [ ] `templates/tooling/eslint-prettier/` — flat ESLint config (TS-aware variant), Prettier config, `lint`/`format` scripts
- [ ] `templates/tooling/vitest/` — `vitest.config`, RTL + `@testing-library/jest-dom` setup, one example test per feature
- [ ] `templates/tooling/ci/` — `.github/workflows/ci.yml` parameterized by chosen package manager

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
