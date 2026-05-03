# PLANNING.md — `create-my-react-boilerplate`

## Context

You want a `npx`-runnable CLI that scaffolds an opinionated, modern React starter, similar in feel to `create-vite` / `create-next-app`. The generated app must ship with a real **Starter Pack** (Landing, Auth UI, User Dashboard, Admin Dashboard) — not just a "Hello World." Users pick variants at prompt time (Language, Router, UI library), the CLI installs deps with their preferred package manager, and the templating system must scale as new prompts are added later (state mgmt, forms, i18n, etc.) without exploding into 2ⁿ template folders.

The hard constraints driving the design:

- **Always-latest deps** → no pinned versions in templates; resolve `latest` at install time.
- **Package-manager agnostic** → detect via `npm_config_user_agent`, fall back to prompt.
- **Future-proof templating** → composable layers + a feature manifest, not a static permutation matrix.

---

## 1. CLI Architecture

| Concern | Library | Why |
|---|---|---|
| Arg parsing | **`commander`** | Mature, tiny, supports the `npx create-my-react-boilerplate <name> [--flags]` shape cleanly. |
| Interactive prompts | **`@clack/prompts`** | Modern, beautiful TTY UX (groups, spinners, intro/outro), much nicer than `inquirer`/`prompts` and actively maintained. |
| File ops | **`fs-extra`** | `copy`, `ensureDir`, `outputFile` — fewer footguns than `node:fs/promises`. |
| Process exec | **`execa`** | Cross-platform, promise-based, used to run `pm install`, `git init`, etc. |
| Templating | **`ejs`** | Conditional logic inside template files (`<% if (isTS) { %>`), file-name interpolation, mature. |
| Colors | **`picocolors`** | ~14× smaller than `chalk`, same API surface we need. |
| Spinners | **`@clack/prompts`** built-in | Avoids extra dep. |
| Name validation | **`validate-npm-package-name`** | Standard. |
| PM detection | Read `process.env.npm_config_user_agent` | Set by npm/yarn/pnpm/bun when invoked via them. |
| Latest version resolution | **`pacote`** (`pacote.manifest('react@latest')`) | Lets us pin actual resolved versions into the generated `package.json` so installs are reproducible per-scaffold while still being "latest at scaffold time." |

**Build & distribution:** authored in TypeScript, bundled with **`tsup`** to a single ESM file in `dist/` with a `#!/usr/bin/env node` shebang. `bin` entry in `package.json` points to it. Ship to npm as `create-my-react-boilerplate` so `npx` resolves automatically.

---

## 2. Templating Strategy — "Base + Layered Overlays + Feature Manifest"

The 2 × 2 × 2 = 8 permutation problem is solved by **never materializing permutations**. Instead, the final project is *composed* at scaffold time from independent layers, each contributing files, dependencies, and code fragments.

### 2a. Layer model

```
Final project = base ⊕ lang ⊕ router ⊕ ui ⊕ features
                (each layer is an overlay that wins over earlier layers)
```

| Layer | What it contains |
|---|---|
| `templates/base/` | Vite config, Tailwind v4 setup, `index.html`, `.gitignore`, README, ESLint/Prettier config — everything variant-independent. Files are EJS templates so they can still branch on `isTS`. |
| `templates/lang/{js,ts}/` | `tsconfig.json` + types (TS only), or jsconfig (JS). |
| `templates/router/{react-router,tanstack-router}/` | Router bootstrap (`router.ts(x)`), route tree definitions, `<RouterProvider>` wiring. |
| `templates/ui/{shadcn,heroui}/` | UI lib install bits: shadcn `components.json` + initial primitives; HeroUI provider + theme setup. |
| `templates/features/{landing,auth,user-dashboard,admin-dashboard}/` | Each feature is a self-contained module with its own pages/components, written once with conditional UI imports. |

### 2b. How permutations are resolved

Every template file is an **EJS file** named with a `.ejs` suffix. The renderer receives a **context object**:

```ts
{ name, isTS, ext, router: 'react-router'|'tanstack-router', ui: 'shadcn'|'heroui', pm }
```

Three substitution mechanisms cover all cases:

1. **Filename interpolation** — `App.[ext].ejs` → `App.tsx` or `App.jsx`. Dynamic dirs like `__router__/` are renamed at copy time.
2. **In-file conditionals** — UI-component imports inside features use:
   ```ejs
   <% if (ui === 'shadcn') { %>import { Button } from '@/components/ui/button';
   <% } else { %>import { Button } from '@heroui/react';<% } %>
   ```
3. **Code-fragment injection** — the base `main.[ext].ejs` has marker comments (`/* @inject:router-provider */`) that the scaffolder replaces with router-specific snippets pulled from `templates/router/*/fragments/`. This avoids the base file having to know about every router.

### 2c. Feature manifest (the future-proofing core)

Each feature ships a `feature.json` (or `.ts`) manifest:

```jsonc
{
  "id": "auth",
  "files": ["**/*"],                  // resolved relative to feature dir
  "dependencies": {
    "any":   ["zod"],
    "shadcn": ["@radix-ui/react-label"],
    "heroui": []
  },
  "routes": [                         // injected into the router config
    { "path": "/login",  "component": "features/auth/pages/Login" },
    { "path": "/signup", "component": "features/auth/pages/Signup" }
  ],
  "navItems": [{ "label": "Sign in", "to": "/login", "scope": "public" }]
}
```

The scaffolder:
1. Composes layers in order, rendering each EJS through the context.
2. Walks enabled features, copies their files, merges declared deps into a single `package.json`, and emits a generated `routes.generated.[ext]` file consumed by the router layer.

**Adding a new prompt later** (e.g. State Management: Zustand vs Jotai) becomes:
- Add a question to `src/config/questions.ts`.
- Add `templates/state/{zustand,jotai}/` overlay.
- Optionally extend feature manifests with a `state` key for state-specific deps.
- **Zero changes** to the scaffolder core.

### 2d. Package manager handling

- Detect from `npm_config_user_agent` (`npm/...`, `yarn/...`, `pnpm/...`, `bun/...`).
- If undetectable, prompt with the detected one preselected.
- `pm.ts` exposes `install()`, `dlx()`, `addDev()` that emit the right command (`npm install`, `pnpm add -D`, `bun add`, etc.).

### 2e. "Always latest" deps

- Templates declare deps **by name only**, never with versions.
- At scaffold time, `pacote.manifest('<pkg>@latest')` resolves the current version for each dep.
- Resolved versions are written into the generated `package.json` so the user's lockfile is deterministic.
- A `--offline` / `--use-pinned` flag falls back to a checked-in `versions.lock.json` for CI / no-network runs.

---

## 3. Folder Structure (the CLI tool itself)

```
create-my-react-boilerplate/
├── bin/
│   └── cli.mjs                      # tsup output, shebang entry
├── src/
│   ├── index.ts                     # commander setup, top-level orchestration
│   ├── prompts/
│   │   ├── index.ts                 # runs @clack flow
│   │   └── questions.ts             # declarative question registry (extensible)
│   ├── scaffold/
│   │   ├── compose.ts               # layer composition engine
│   │   ├── render.ts                # EJS rendering + filename interpolation
│   │   ├── inject.ts                # marker-based fragment injection
│   │   └── manifest.ts              # feature.json loader + dep merger
│   ├── pm/
│   │   ├── detect.ts                # npm_config_user_agent parsing
│   │   └── run.ts                   # install/add/dlx wrappers via execa
│   ├── deps/
│   │   ├── resolve.ts               # pacote latest-version resolver (parallel)
│   │   └── versions.lock.json       # offline fallback
│   ├── postinstall/
│   │   ├── git.ts                   # git init + initial commit
│   │   └── shadcn.ts                # runs `npx shadcn add` for chosen primitives
│   ├── utils/
│   │   ├── logger.ts                # picocolors wrappers
│   │   ├── validate.ts              # project name validation
│   │   └── fs.ts                    # walk, copy, exists helpers
│   └── types.ts                     # shared types (Context, Question, Feature)
├── templates/
│   ├── base/                        # variant-independent files (.ejs)
│   ├── lang/
│   │   ├── js/
│   │   └── ts/
│   ├── router/
│   │   ├── react-router/
│   │   │   ├── files/
│   │   │   └── fragments/
│   │   └── tanstack-router/
│   │       ├── files/
│   │       └── fragments/
│   ├── ui/
│   │   ├── shadcn/
│   │   └── heroui/
│   ├── tooling/
│   │   ├── eslint-prettier/
│   │   ├── vitest/
│   │   └── ci/
│   └── features/
│       ├── landing/
│       │   ├── feature.json
│       │   └── files/
│       ├── auth/
│       ├── user-dashboard/
│       └── admin-dashboard/
├── tests/
│   ├── snapshot/                    # snapshot-test each permutation's file tree
│   ├── e2e/                         # spawn CLI in tmp dir, run install + build
│   └── unit/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
└── PLANNING.md                      # this file
```

---

## 4. Step-by-Step Execution Plan

### Phase A — Bootstrap the CLI repo (½ day)
- [ ] `npm init` — set `name`, `bin`, `type: module`, `engines.node >= 20`.
- [ ] Add deps: `commander`, `@clack/prompts`, `fs-extra`, `execa`, `ejs`, `picocolors`, `validate-npm-package-name`, `pacote`.
- [ ] Add devDeps: `typescript`, `tsup`, `vitest`, `@types/*`.
- [ ] Configure `tsup` to bundle ESM with shebang banner.
- [ ] Wire `bin/cli.mjs` → `dist/index.mjs`; add `npm link` for local dev.

### Phase B — CLI skeleton (1 day)
- [ ] `commander` parses `<project-name>` + flags (`--ts`, `--js`, `--router`, `--ui`, `--pm`, `--no-install`, `--no-git`).
- [ ] `prompts/questions.ts` — declarative registry; flags pre-fill answers, missing ones get prompted via `@clack`.
- [ ] `pm/detect.ts` + interactive fallback.
- [ ] Project-name validation, target-dir-empty check, conflict resolution prompt.

### Phase C — Templating engine (2 days)
- [ ] `scaffold/render.ts` — recursive EJS render with filename interpolation.
- [ ] `scaffold/compose.ts` — layer ordering, conflict rule (later layer wins).
- [ ] `scaffold/inject.ts` — `/* @inject:* */` marker replacement.
- [ ] `scaffold/manifest.ts` — load `feature.json`, merge route lists, emit `routes.generated.[ext]`.
- [ ] Unit tests for each.

### Phase D — Build the templates (3–4 days, the bulk)
- [ ] `base/` — Vite config (TS+JS), Tailwind v4 (`@import "tailwindcss"`, no PostCSS config needed), ESLint flat config, Prettier, `.gitignore`, README, `index.html`.
- [ ] `lang/ts/` & `lang/js/` — tsconfig / jsconfig + path alias (`@/*`).
- [ ] `router/react-router/` — `createBrowserRouter`, route objects consumed from `routes.generated`.
- [ ] `router/tanstack-router/` — file-based or code-based config with the same generated routes.
- [ ] `ui/shadcn/` — `components.json`, theme tokens, base CSS vars, postinstall hook lists primitives to add.
- [ ] `ui/heroui/` — provider in `main.[ext]`, theme config, plugin in Tailwind config.
- [ ] `features/landing/` — Hero + Features + CTA + Footer, using conditional UI imports.
- [ ] `features/auth/` — `/login`, `/signup`, `/forgot-password`, mock `AuthContext` + `useAuth`, route guards.
- [ ] `features/user-dashboard/` — `/dashboard` layout, sidebar, profile page, settings stub.
- [ ] `features/admin-dashboard/` — `/admin` layout, users table, role guard.
- [ ] `tooling/eslint-prettier/` — flat config with TS-aware variant, Prettier config, `lint` + `format` scripts.
- [ ] `tooling/vitest/` — `vitest.config`, RTL + `@testing-library/jest-dom` setup, sample tests per feature.
- [ ] `tooling/ci/` — `.github/workflows/ci.yml` parameterized to the chosen PM.

### Phase E — Post-scaffold actions (½ day)
- [ ] `deps/resolve.ts` — parallel `pacote.manifest` calls, write resolved versions into `package.json`.
- [ ] `pm/run.ts` — run install with chosen PM, stream output.
- [ ] `postinstall/shadcn.ts` — if `ui=shadcn`, run `dlx shadcn add button input ...`.
- [ ] `postinstall/git.ts` — `git init`, initial commit (skippable with `--no-git`).
- [ ] Final outro screen with next-steps (`cd <name> && pm dev`).

### Phase F — Testing (1–2 days)
- [ ] Snapshot tests: scaffold all 8 permutations into tmp dirs, snapshot file trees + key file contents.
- [ ] E2E: for each permutation, spawn CLI → install → `pm build` → assert exit 0. Run on Node 20 + 22 in CI.
- [ ] Unit tests for prompts, PM detection, manifest merging.

### Phase G — Polish & publish (½ day)
- [ ] README with GIF demo, all flags, troubleshooting.
- [ ] `npm publish --access public` (after `npm pack` + dry-run smoke test).
- [ ] GitHub Actions: test matrix on PR, auto-publish on tag.
- [ ] Verify `npx create-my-react-boilerplate test-app` works end-to-end from a clean machine.

---

## 5. Verification

After implementation, validate end-to-end with:

```bash
# in the CLI repo
npm run build && npm link

# in /tmp
create-my-react-boilerplate demo-ts-rr-shadcn  --ts --router react-router    --ui shadcn   --pm pnpm
create-my-react-boilerplate demo-js-tan-heroui --js --router tanstack-router --ui heroui   --pm bun

# for each generated app
pnpm dev   # (or bun dev) → confirm landing renders, /login flows, /dashboard + /admin guarded
pnpm build # confirm production build succeeds
```

Plus the automated snapshot + e2e suite from Phase F.

---

## Resolved decisions

- **Auth:** UI-only with an in-memory `AuthContext` + `useAuth` hook and route guards. No backend coupling — users can swap in any provider later.
- **Dev tooling baseline (always-on in the generated app):**
  - ESLint flat config + Prettier (with `eslint-config-prettier`).
  - Vitest + React Testing Library, with one example test per feature module.
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`) running install → lint → typecheck → test → build on PRs, matrixed on Node 20 + 22.
  - **Not included** by default: Husky / lint-staged.
- **CLI package name:** `create-my-react-boilerplate`.

These add two more layers that slot cleanly into the existing composition model:
- `templates/tooling/eslint-prettier/` — ESLint flat config (with TS plugin variant), Prettier config, scripts.
- `templates/tooling/vitest/` — `vitest.config.[ext]`, `setup.[ext]` (RTL + jest-dom), one `*.test.[ext]` per feature directory.
- `templates/tooling/ci/` — `.github/workflows/ci.yml` parameterized by chosen package manager.

Each feature manifest gains an optional `tests: [...]` field so the Vitest layer knows which example test files to drop in alongside that feature's source.

---

## Architecture Refactoring Plan (Phase H — 2026-05-03)

### Problem

The templates emitted a `src/` tree that diverged significantly from the "Generated App Architecture Standard" documented in `CLAUDE.md`:

- Auth state in React Context (`src/context/AuthContext`) instead of Zustand.
- Route guards as React wrapper components (`<ProtectedRoute>`, `<AdminRoute>`) instead of route-level middlewares.
- `cn()` utility only available in the shadcn variant (missing from HeroUI builds).
- Router entry at `src/router/` (singular file) instead of `src/routes/` (folder).
- Feature slices had only `components/` + `pages/` — missing `api/`, `data/`, `hooks/`, `layouts/`, `schemas/`, `services/`, `types/`, and `index.ts` barrel.
- Auth forms used raw `useState` despite `react-hook-form` + `zod` already declared in `feature.json`.
- The base scaffold was missing: `components/common`, `components/layouts`, `config`, `constants`, `hooks`, `lib`, `middlewares`, `models`, `providers`, `store`, `types`, `assets`.
- `landing` feature renamed to `home` to align with conventions.

### Strategy

1. **Hoist universal pieces into `templates/base/`** — no new composition layer; the `base → lang → router → ui → tooling → features` order stays intact.
2. **Replace, don't duplicate** — delete obsolete files in the same pass that introduces replacements.
3. **Path migration** — all `@/router`, `@/context/AuthContext`, `@/hooks/useAuth` references rewritten.
4. **Feature by feature** — home → auth → user-dashboard → admin-dashboard.
5. **Version bump to `0.2.0`** — breaking change for downstream consumers.

### New canonical `src/` shape (all variants)

```
src/
  assets/
  components/
    common/      Box, Container, Text, Heading, Image, Link, NotFound, ThemeToggle
    layouts/     RootLayout
    ui/          UI-lib primitives (shadcn or heroui — existing ui layer)
  config/        env.[ext]
  constants/
  features/
    home/        pages/Home + data/features + components + index.ts
    auth/        pages + schemas + hooks + api + services + layouts + types + index.ts
    user-dashboard/   pages + layouts + data + hooks + index.ts
    admin-dashboard/  pages + layouts + components + data + api + hooks + types + index.ts
  hooks/         useMobile, useTheme
  lib/           axios.[ext], utils.[ext] (cn)
  middlewares/   authMiddleware.[ext], guestMiddleware.[ext]
  models/        user.model.[ext]
  providers/     theme-provider.[ext]
  routes/        index.[ext] + routes.generated.[ext]
  store/         useAuthStore.[ext]
  types/         api.type.[ext] + models/
  index.css
  main.[ext]
```

### CLI source changes

- `src/deps/resolve.ts` — add `clsx`, `tailwind-merge`, `zustand`, `axios`, `@tanstack/react-query`, `next-themes` to base prod deps; remove them from shadcn-only branch.
- `src/deps/versions.lock.json` — pin new packages.
- `src/scaffold/manifest.ts` — `emitRoutes` output path `src/router/` → `src/routes/`.
- `src/scaffold/compose.ts` — `'landing'` → `'home'` in FEATURES array.
- `package.json` — version `0.1.2` → `0.2.0`.
