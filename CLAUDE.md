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
2. Create `templates/features/pricing/files/` with EJS templates.

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

## Build notes

- `tsup` bundles `src/index.ts` → `dist/index.mjs` (ESM, Node 20 target, shebang prepended).
- All `node_modules` stay **external** — do not add `noExternal` to `tsup.config.ts`.
- npm publishes `dist/` and `templates/` (per `"files"` in `package.json`).
- Do not run `npm publish` manually — use the GitHub Actions release workflow (Phase G).

## What NOT to do

- Do not pin versions in EJS templates — `deps/resolve.ts` handles version resolution at scaffold time via `pacote`.
- Do not create a separate template folder per permutation.
- Do not import `.ts` files without the `.js` extension.
