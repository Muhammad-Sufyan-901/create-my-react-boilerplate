import type { Language, Router, UI, PackageManager } from '../types.js';

export interface PromptChoice<T> {
  value: T;
  label: string;
  hint?: string;
}

export interface QuestionDef<T> {
  id: string;
  message: string;
  hint?: string;
  choices: PromptChoice<T>[];
  defaultValue: T;
}

/**
 * Declarative question registry.
 * To add a new variant (e.g. state management), push a new entry here
 * and add the matching overlay folder — zero changes to the scaffolder core.
 */
export const questions = {
  language: {
    id: 'language',
    message: 'Which language?',
    choices: [
      { value: 'ts' as Language, label: 'TypeScript', hint: 'recommended' },
      { value: 'js' as Language, label: 'JavaScript' },
    ],
    defaultValue: 'ts' as Language,
  } satisfies QuestionDef<Language>,

  router: {
    id: 'router',
    message: 'Which router?',
    choices: [
      { value: 'react-router' as Router,    label: 'React Router v7',   hint: 'battle-tested' },
      { value: 'tanstack-router' as Router, label: 'TanStack Router',   hint: 'type-safe' },
    ],
    defaultValue: 'react-router' as Router,
  } satisfies QuestionDef<Router>,

  ui: {
    id: 'ui',
    message: 'Which UI component library?',
    choices: [
      { value: 'shadcn' as UI,  label: 'shadcn/ui',  hint: 'Radix + Tailwind' },
      { value: 'heroui' as UI,  label: 'HeroUI',     hint: 'full component set' },
    ],
    defaultValue: 'shadcn' as UI,
  } satisfies QuestionDef<UI>,

  packageManager: {
    id: 'packageManager',
    message: 'Which package manager?',
    choices: [
      { value: 'pnpm' as PackageManager, label: 'pnpm', hint: 'fast, disk-efficient' },
      { value: 'bun'  as PackageManager, label: 'bun',  hint: 'fastest installs' },
      { value: 'npm'  as PackageManager, label: 'npm'  },
      { value: 'yarn' as PackageManager, label: 'yarn' },
    ],
    defaultValue: 'npm' as PackageManager,
  } satisfies QuestionDef<PackageManager>,
} as const;
