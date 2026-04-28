export type Language = 'ts' | 'js';
export type Router = 'react-router' | 'tanstack-router';
export type UI = 'shadcn' | 'heroui';
export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

/** Resolved user selections passed to every scaffold layer. */
export interface ScaffoldContext {
  name: string;
  targetDir: string;
  language: Language;
  router: Router;
  ui: UI;
  pm: PackageManager;
  /** false when --no-install is passed */
  install: boolean;
  /** false when --no-git is passed */
  git: boolean;
  /** Use pinned versions.lock.json instead of resolving from npm registry */
  offline: boolean;
  /** Derived from language */
  isTS: boolean;
  /** 'tsx' | 'jsx' */
  ext: string;
}

/** Returned by composeProject — dep names only, no versions. */
export interface ComposedDeps {
  prod: string[];
  dev: string[];
}

export interface RouteDefinition {
  path: string;
  component: string;
  guard?: 'auth' | 'admin';
}

export interface NavItem {
  label: string;
  to: string;
  scope: 'public' | 'auth' | 'admin';
}

export interface FeatureDependencies {
  any?: string[];
  shadcn?: string[];
  heroui?: string[];
  ts?: string[];
  js?: string[];
}

export interface FeatureManifest {
  id: string;
  files: string[];
  dependencies: FeatureDependencies;
  devDependencies?: FeatureDependencies;
  routes: RouteDefinition[];
  navItems: NavItem[];
  /** Relative paths to test files within the feature dir */
  tests?: string[];
}

export interface Question<T = string> {
  id: string;
  /** @clack select/confirm label */
  label: string;
  hint?: string;
  options?: Array<{ value: T; label: string; hint?: string }>;
  /** If provided, skip the prompt and use this value */
  flagValue?: T;
  defaultValue?: T;
}
