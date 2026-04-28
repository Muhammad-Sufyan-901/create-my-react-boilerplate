import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  target: 'node20',
  platform: 'node',
  clean: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Leave node_modules as externals — they're installed alongside the CLI.
  // This keeps the bundle small and avoids CJS/ESM interop issues.
});
