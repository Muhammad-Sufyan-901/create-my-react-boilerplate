# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

The **CLI tool source** for `create-my-react-boilerplate` — not a generated app. This repo builds and publishes the generator itself.

## Commands

```bash
npm run build        # compile src/ → dist/index.mjs via tsup
npm run dev          # watch mode (rebuilds on save)
npm test             # vitest run (unit + snapshot + e2e)
npm run test:watch   # vitest interactive watch
npm run lint         # eslint src/

# local smoke-test
npm link
create-my-react-boilerplate my-test-app
```

Always run `npm run build` before running E2E tests — they execute `dist/index.mjs`.

## Architecture

User choices collected via `@clack/prompts` → `ScaffoldContext` → **layered overlay engine**.

Layers applied in order:
```
base → lang → router → ui → tooling → features
```

Each layer is a folder under `templates/` containing EJS files. The engine:
1. Renders every `.ejs` file through the context object.
2. Interpolates filenames (`App.[ext].ejs` → `App.tsx`).
3. Injects code fragments at `/* @inject:<tag> */` markers.
4. Merges `feature.json` manifests (deps, routes, navItems) into the final `package.json` and a generated route file.

This avoids the 2ⁿ permutation-folder problem — templates are never pre-materialized per combination.

## Source layout

```
src/
  index.ts              # commander entry + flag parsing
  types.ts              # ScaffoldContext, FeatureManifest, all shared types
  prompts/
    questions.ts        # declarative question registry — add new prompts here
    index.ts            # @clack flow runner
  scaffold/
    compose.ts          # layer ordering + file merging
    render.ts           # EJS render + filename interpolation
    inject.ts           # /* @inject:* */ marker replacement
    manifest.ts         # feature.json loader + dep merger
  pm/
    detect.ts           # npm_config_user_agent parser
    run.ts              # pmInstall / pmDlx per package manager
  deps/
    resolve.ts          # pacote.manifest parallel resolver
    versions.lock.json  # offline fallback (--offline flag)
  postinstall/
    git.ts              # git init + initial commit
    shadcn.ts           # dlx shadcn add <primitives>
  utils/
    logger.ts           # picocolors wrappers
    validate.ts         # project name validation
    fs.ts               # isDirEmpty, pkgRoot (ESM-safe, no __dirname)

templates/
  base/                 # variant-independent files
  lang/{js,ts}/
  router/{react-router,tanstack-router}/{files,fragments}/
  ui/{shadcn,heroui}/
  tooling/{eslint-prettier,vitest,ci}/
  features/{landing,auth,user-dashboard,admin-dashboard}/
    feature.json        # deps + routes + navItems + optional tests[]
    files/              # EJS template files

tests/
  unit/                 # scaffold engine, pm detection
  snapshot/             # file-tree snapshots for all 8 permutations
  e2e/                  # spawn CLI in tmp dir → install → build
```

## Key types (`src/types.ts`)

```ts
interface ScaffoldContext {
  name: string; targetDir: string;
  language: 'ts' | 'js'; router: 'react-router' | 'tanstack-router';
  ui: 'shadcn' | 'heroui'; pm: 'npm' | 'yarn' | 'pnpm' | 'bun';
  install: boolean; git: boolean;
  isTS: boolean;  // language === 'ts'
  ext: string;    // 'tsx' | 'jsx'
}

interface FeatureManifest {
  id: string; files: string[];
  dependencies: { any?: string[]; shadcn?: string[]; heroui?: string[]; ts?: string[]; js?: string[] };
  routes: { path: string; component: string; guard?: 'auth' | 'admin' }[];
  navItems: { label: string; to: string; scope: 'public' | 'auth' | 'admin' }[];
  tests?: string[];
}
```

## Adding a new variant (e.g. state management)

1. Add a question to `src/prompts/questions.ts`.
2. Add a flag in `src/index.ts`.
3. Add the field to `ScaffoldContext` in `src/types.ts`.
4. Create `templates/state/{zustand,jotai}/` overlay folders.
5. Wire the layer in `src/scaffold/compose.ts`.

No changes needed to `render.ts`, `inject.ts`, or `manifest.ts`.

## Adding a new Starter Pack feature (e.g. Pricing page)

1. Create `templates/features/pricing/feature.json`.
2. Create `templates/features/pricing/files/` with EJS templates that mirror the **Feature slice shape** (see "Generated App Architecture Standard" below) — `components/`, `pages/`, `hooks/`, `schemas/`, `services/`, `types/`, and an `index.ts` barrel as needed.
3. Wire routes/navItems/deps through `feature.json`, not by emitting files outside `src/features/pricing/`.

The scaffolder walks all feature directories automatically.

## EJS template conventions

- Files use `.ejs` suffix: `App.tsx.ejs`, `router.ts.ejs`.
- Filename interpolation: `main.[ext].ejs` → `main.tsx`.
- In-file branching uses `<% if (isTS) { %>` / `<% if (ui === 'shadcn') { %>`.
- Fragment markers: `/* @inject:router-provider */` — replaced by `inject.ts` with content from `templates/router/*/fragments/`.

## Coding conventions

- **ESM throughout**: all imports must use `.js` extension (Node16 resolution), even for `.ts` source files.
- **No `__dirname`**: use `pkgRoot()` from `src/utils/fs.ts` (`new URL('../../', import.meta.url).pathname`).
- **Named exports only** in `src/` — no default exports.
- **Types first**: add to `src/types.ts` before implementing.
- Test files go in `tests/`, not colocated with source.

## Documentation & Changelog

- **Mandatory Changelog Updates**: Whenever you are tasked with making structural changes, refactoring EJS templates, adding new Starter Pack features, or introducing new variants to this repository, you MUST automatically document your changes in the `CHANGELOG.md` file. Always add your updates under an `[Unreleased]` section or the current date to maintain a clear history of modifications. Do not wait for explicit instructions to update the changelog if you have modified the generator's output or source code.

## Build notes

- `tsup` bundles `src/index.ts` → `dist/index.mjs` (ESM, Node 20 target, shebang prepended).
- All `node_modules` stay **external** — do not add `noExternal` to `tsup.config.ts`.
- npm publishes `dist/` and `templates/` (per `"files"` in `package.json`).
- Do not run `npm publish` manually — use the GitHub Actions release workflow (Phase G).

## Generated App Architecture Standard

Every scaffolded app — regardless of variant combination (`language` × `router` × `ui` × `features`) — **must** produce a project that conforms to the architecture below. Templates and overlays are designed around this contract; do not introduce variants that diverge from it.

### Core principle: Feature-Based Architecture

Code is organized around **business domains**, not technical roles (no top-level `controllers/`, `views/`, etc.). Each business domain is a self-contained slice under `src/features/<feature_name>/`.

**The Golden Rule — Feature Isolation:**
- Files in `src/features/A/` **MUST NOT** import from `src/features/B/`.
- Cross-feature sharing happens only through `src/types/models/` (shared domain entities) or global primitives in `src/components/`, `src/hooks/`, `src/lib/`.
- The scaffolder enforces this implicitly: `feature.json` manifests declare their own deps and routes; they never reference other features.

### Canonical folder structure (generated output)

Every generated app — minimum (no Starter Pack features) and maximum (all features) — produces this `src/` shape:

```text
src/
├── assets/                   # Static resources (images, svgs, fonts)
├── components/
│   ├── common/               # Polymorphic core: Box, Container, Heading, Image, Link, NotFound, Text, ThemeToggle
│   ├── layouts/              # Global layout wrappers (RootLayout)
│   └── ui/                   # Primitives from the chosen UI lib (shadcn or HeroUI)
├── config/                   # env.ts and runtime config
├── constants/                # Static enums, image constants, etc.
├── features/                 # Business-domain slices (see "Feature slice shape" below)
│   ├── auth/                 # Always present when auth Starter Pack is selected
│   ├── home/                 # Always present when landing Starter Pack is selected
│   └── <feature>/            # Each Starter Pack feature lives here
├── hooks/                    # Global reusable hooks (useMobile, useTheme)
├── lib/                      # axios.ts, utils.ts (cn helper), other base libs
├── middlewares/              # Route guards (authMiddleware, guestMiddleware) — used in beforeLoad
├── models/                   # Frontend-mapped domain models (e.g. user.model.ts)
├── providers/                # React context providers (theme-provider.tsx, etc.)
├── routes/                   # TanStack Router file-based route tree (or react-router equivalent)
├── store/                    # Global Zustand stores (useAuthStore, etc.)
└── types/
    ├── api.type.ts           # Shared API envelope/response types
    └── models/               # Cross-feature shared domain entities
```

Root-level files always emitted: `index.html`, `main.tsx`, `index.css`, `routeTree.gen.ts` (when TanStack Router), `vite.config.ts`, `tsconfig*.json` (TS variant), `eslint.config.js`, `.prettierrc`, `.gitignore`.

### Feature slice shape

Every `src/features/<name>/` folder follows the same internal layout. Subfolders are included only when the feature uses them, but their **names and roles are fixed**:

```text
features/<name>/
├── api/                      # Feature-specific axios calls (when not using a service class)
├── components/               # Feature-only UI (e.g. AuthSideHero, HeroSection, FeatureCards)
├── data/                     # Static feature data (e.g. home-features.data.ts)
├── hooks/                    # Feature-only hooks (useLogin, useLogout, useRegister)
├── layouts/                  # Feature-scoped layouts (AuthLayout)
├── pages/                    # Page-level components (LoginPage, RegisterPage, HomePage)
├── schemas/                  # Zod schemas for forms/payloads (auth.schema.ts)
├── services/                 # Service classes wrapping axios (auth.service.ts)
├── types/                    # Feature-local types (auth.type.ts, home-feature.type.ts)
└── index.ts                  # Public barrel — only this file is importable from outside the feature
```

Templates for new features (`templates/features/<id>/files/`) **must** mirror this layout. The barrel `index.ts` is the feature's public API; anything not re-exported from it is private.

### State management split

Generated apps maintain a strict separation:
- **Server state** → `@tanstack/react-query`. All fetching uses `useQuery`; all mutations use `useMutation`. `useEffect` for fetching is forbidden.
- **Client state** → Zustand stores in `src/store/`. Used for transient UI state (auth token presence, multi-step flow state, UI toggles).

### Routing & guards

- **TanStack Router variant**: file-based routes in `src/routes/`. Guards live in `src/middlewares/` and run inside `beforeLoad` — never as React wrapper components.
  - Authenticated route groups use the `_auth` directory convention (e.g. `routes/_auth/login/index.tsx`).
  - `routeTree.gen.ts` is auto-generated by `@tanstack/router-plugin` (configured in `vite.config.ts`).
- **react-router variant**: routes still composed at a single boundary; guards remain in `src/middlewares/` and are applied at the route-definition layer, not via JSX wrappers in the component tree.

### UI & theming contract

- Polymorphic primitives (`Box`, `Heading`, `Text`, `Container`, etc.) live in `src/components/common/` and use `cn()` (`clsx` + `tailwind-merge`) combined with `class-variance-authority` for variants.
- The `cn()` helper is always emitted at `src/lib/utils.ts` regardless of UI variant.
- Dark mode via `next-themes`, persisted in `localStorage` under key `vite-ui-theme`. `ThemeToggle` lives in `src/components/common/`.
- Path alias `@/*` → `src/*` is configured in `tsconfig.json` (TS variant) and `vite.config.ts` (both variants).

### Forms & validation

When a feature ships forms (e.g. auth), the generated stack is fixed:
`react-hook-form` + `zod` (via `@hookform/resolvers`). Schemas live in the feature's `schemas/` folder.

### HTTP layer

A single axios instance is emitted at `src/lib/axios.ts` with interceptors wired to the auth store (token attach + 401 handling). Features call it through their own `services/` or `api/` folder — never directly from components.

### Template authoring rules (derived from the standard)

When adding or modifying templates under `templates/`:
1. **Do not invent new top-level `src/` folders.** If a file doesn't fit the canonical structure above, it likely belongs inside a feature slice or in `lib/`.
2. **Feature templates own only `templates/features/<id>/files/`** — they must not write outside `src/features/<id>/` except via `feature.json` (routes, navItems, deps).
3. **Cross-feature wiring happens through manifests, not imports.** Routes and nav items are merged by `manifest.ts`; features stay isolated in source.
4. **Polymorphic primitives and `cn()` are part of the `base` layer**, not the UI layer. The UI layer (`shadcn` vs `heroui`) only swaps the `components/ui/` primitives and feature-level UI imports, not the `common/` components.
5. **Guards belong in `templates/base/src/middlewares/`** (or the router layer's overlay), not inside feature folders.

## What NOT to do

- Do not pin versions in EJS templates — `deps/resolve.ts` handles version resolution at scaffold time via `pacote`.
- Do not create a separate template folder per permutation.
- Do not import `.ts` files without the `.js` extension.
- Do not emit cross-feature imports in templates (`features/A` importing from `features/B`).
- Do not place route protection in React component trees — guards live in `src/middlewares/` and run in `beforeLoad`.
- Do not introduce new top-level `src/` directories outside the canonical structure above without updating this document and the base layer first.
- Do not use `useEffect` for data fetching in templates — use `useQuery` / `useMutation`.