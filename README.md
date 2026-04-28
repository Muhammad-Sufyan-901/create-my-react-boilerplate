# create-my-react-boilerplate

> Scaffold a production-ready React app in seconds — choose your language, router, and UI library. Ships with a real Starter Pack out of the box.

```bash
npx create-my-react-boilerplate my-app
```

---

## What you get

Every generated app includes a **Starter Pack** of four fully wired pages:

| Page | Route | Notes |
|---|---|---|
| Landing | `/` | Hero, Features section, CTA, Footer |
| Login / Signup | `/login`, `/signup`, `/forgot-password` | Mock `AuthContext` + `useAuth` hook, ready to swap |
| User Dashboard | `/dashboard` | Layout with sidebar, profile, settings stub |
| Admin Dashboard | `/admin` | Role-guarded layout, users table |

Plus a dev-tooling baseline in every project:

- **Vite** (latest) + **Tailwind CSS v4** — zero PostCSS config
- **ESLint** (flat config) + **Prettier**
- **Vitest** + **React Testing Library** — one example test per feature
- **GitHub Actions** CI — lint → typecheck → test → build, on Node 20 + 22

---

## Variant choices

The CLI prompts you for three choices at scaffold time:

| Prompt | Options |
|---|---|
| **Language** | TypeScript *(default)* · JavaScript |
| **Router** | React Router v7 *(default)* · TanStack Router |
| **UI Components** | shadcn/ui *(default)* · HeroUI |

All combinations produce a working, buildable app.

---

## Quick start

### Interactive (recommended)

```bash
npx create-my-react-boilerplate my-app
```

Follow the prompts to pick your variants and package manager. The CLI auto-detects whichever package manager you ran it with.

### Non-interactive (CI / scripting)

Pass flags to skip all prompts:

```bash
npx create-my-react-boilerplate my-app \
  --ts \
  --router react-router \
  --ui shadcn \
  --pm pnpm
```

---

## CLI flags

| Flag | Description | Default |
|---|---|---|
| `[project-name]` | Target directory name | prompted |
| `--ts` | Use TypeScript | — |
| `--js` | Use JavaScript | — |
| `--router <name>` | `react-router` or `tanstack-router` | prompted |
| `--ui <name>` | `shadcn` or `heroui` | prompted |
| `--pm <name>` | `npm`, `yarn`, `pnpm`, or `bun` | auto-detected |
| `--no-install` | Skip dependency installation | installs |
| `--no-git` | Skip `git init` | initialises |
| `--offline` | Use pinned versions from `versions.lock.json` | resolves latest |
| `-v, --version` | Print CLI version | — |
| `-h, --help` | Print usage | — |

---

## Generated project structure

```
my-app/
├── src/
│   ├── features/
│   │   ├── landing/          # Hero, Features, CTA, Footer
│   │   ├── auth/             # Login, Signup, ForgotPassword, AuthContext
│   │   ├── user-dashboard/   # Dashboard layout + pages
│   │   └── admin-dashboard/  # Admin layout + pages
│   ├── components/           # Shared UI primitives (shadcn or HeroUI)
│   ├── router/               # Router bootstrap + generated route tree
│   ├── hooks/                # useAuth, shared hooks
│   └── main.tsx              # Entry point
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts        # HeroUI only; shadcn uses CSS vars
├── tsconfig.json             # TypeScript only
├── eslint.config.js
├── prettier.config.js
├── vitest.config.ts
└── package.json
```

---

## Requirements

- **Node.js** ≥ 20
- One of: `npm`, `yarn`, `pnpm`, or `bun`

---

## Adding new variants (for contributors)

The CLI uses a **Base + Layered Overlays + Feature Manifest** model — no static permutation folders. Adding a new prompt (e.g. state management) requires:

1. Add a question entry in [`src/prompts/questions.ts`](src/prompts/questions.ts).
2. Create `templates/state/{zustand,jotai}/` overlay folders.
3. Optionally extend `feature.json` manifests with a `state` key for variant-specific deps.

No changes to the scaffolder core are needed.

See [PLANNING.md](PLANNING.md) for the full architecture and [PRD.md](PRD.md) for the product spec.

---

## Contributing

```bash
# clone and bootstrap
git clone https://github.com/your-handle/create-my-react-boilerplate
cd create-my-react-boilerplate
npm install

# build the CLI
npm run build

# link locally so `create-my-react-boilerplate` resolves to your dev build
npm link

# run tests
npm test

# watch mode during development
npm run dev
```

---

## License

MIT
