# Publishing Guide — `create-my-react-boilerplate`

Complete steps to publish this package to npm from start to finish.

---

## Pre-flight checklist

- [x] Author info added to `package.json`
- [ ] npm account created at [npmjs.com](https://www.npmjs.com)
- [ ] Logged in to npm locally (`npm login`)

---

## Step 1 — Verify everything is ready

```bash
# Ensure build and all 91 tests pass
npm run build && npm test

# Confirm what will be published (should show 43 files, ~18.9 kB)
npm pack --dry-run
```

---

## Step 2 — Log in to npm

```bash
npm login
```

You will be prompted for your npm **username**, **password**, and **email**.
Verify login succeeded:

```bash
npm whoami
# → your npm username
```

---

## Step 3 — Publish the first version

```bash
npm publish --access public
```

This automatically runs `npm run build` first (via the `prepublishOnly` hook), then uploads `dist/index.mjs` + `templates/` to the npm registry.

**Expected output:**
```
npm notice 📦  create-my-react-boilerplate@0.1.0
npm notice total files: 43
npm notice Publishing to https://registry.npmjs.org/ with tag latest
+ create-my-react-boilerplate@0.1.0
```

Verify it is live:

```bash
npm info create-my-react-boilerplate
```

---

## Step 4 — Smoke test the published package

From any directory **outside** this repo:

```bash
cd /tmp
npx create-my-react-boilerplate my-test-app

# Or non-interactive with flags
npx create-my-react-boilerplate my-test-app \
  --ts --router react-router --ui shadcn --pm npm

cd my-test-app
npm run build   # should exit 0
```

---

## Step 5 — Push code to GitHub

```bash
git remote add origin https://github.com/Muhammad-Sufyan-901/create-my-react-boilerplate.git
git branch -M main
git push -u origin main
```

---

## Step 6 — Configure Trusted Publishing on npmjs.com

This allows future releases to publish automatically via GitHub Actions — no token or secret required.

1. Go to **npmjs.com** → log in → avatar → **Packages**
2. Click **create-my-react-boilerplate** → **Settings** → **Trusted Publishers**
3. Click **Add a publisher** → select **GitHub Actions**
4. Fill in:
   - **GitHub owner:** `Muhammad-Sufyan-901`
   - **Repository name:** `create-my-react-boilerplate`
   - **Workflow filename:** `publish.yml`
5. Click **Add**

No `NPM_TOKEN` secret needed in GitHub — OIDC handles authentication automatically.

---

## Step 7 — Future releases (automated via CI)

For every subsequent release:

```bash
# Bump version (patch = 0.1.0 → 0.1.1, minor = 0.1.0 → 0.2.0, major = 0.1.0 → 1.0.0)
npm version patch

# Push the commit and the generated version tag
git push && git push --tags
```

GitHub Actions detects the `v*` tag and runs `.github/workflows/publish.yml`:
1. `npm ci`
2. `npm run build`
3. `npm test`
4. `npm publish --access public --provenance` (authenticated via OIDC)

The package page on npmjs.com will show a **provenance badge** linking it to the GitHub source.

---

## Quick reference

| Task | Command |
|---|---|
| Build | `npm run build` |
| Test | `npm test` |
| Dry-run pack | `npm pack --dry-run` |
| First publish | `npm publish --access public` |
| Bump + release | `npm version patch && git push && git push --tags` |
| Check live package | `npm info create-my-react-boilerplate` |
| Smoke test | `npx create-my-react-boilerplate test-app` |
