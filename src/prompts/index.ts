import * as p from '@clack/prompts';
import type { Option } from '@clack/prompts';
import pc from 'picocolors';
import path from 'node:path';
import { questions } from './questions.js';
import { detectPackageManager } from '../pm/detect.js';
import { validateProjectName } from '../utils/validate.js';
import { isDirEmpty } from '../utils/fs.js';
import type { ScaffoldContext, Language, Router, UI, PackageManager } from '../types.js';

interface CliFlags {
  language?: Language;
  router?: Router;
  ui?: UI;
  pm?: PackageManager;
  install: boolean;
  git: boolean;
  offline: boolean;
}

export async function runPrompts(projectNameArg: string | undefined, flags: CliFlags): Promise<ScaffoldContext> {
  p.intro(pc.bgCyan(pc.black(' create-my-react-boilerplate ')));

  // ── Project name ──────────────────────────────────────────────────────────
  let name: string;
  if (projectNameArg) {
    const valid = validateProjectName(projectNameArg);
    if (valid !== true) {
      p.cancel(valid);
      process.exit(1);
    }
    name = projectNameArg;
  } else {
    const answer = await p.text({
      message: 'Project name?',
      placeholder: 'my-react-app',
      validate: (v) => {
        const r = validateProjectName(v ?? '');
        return r === true ? undefined : r;
      },
    });
    if (p.isCancel(answer)) { p.cancel('Cancelled.'); process.exit(0); }
    name = answer as string;
  }

  const targetDir = path.resolve(process.cwd(), name);
  const empty = await isDirEmpty(targetDir);
  if (!empty) {
    const overwrite = await p.confirm({
      message: `${pc.yellow(name)} already exists and is not empty. Continue anyway?`,
      initialValue: false,
    });
    if (p.isCancel(overwrite) || !overwrite) { p.cancel('Cancelled.'); process.exit(0); }
  }

  // ── Variant prompts (skip if flag provided) ───────────────────────────────
  const language = flags.language ?? await ask<Language>(questions.language);
  const router   = flags.router   ?? await ask<Router>(questions.router);
  const ui       = flags.ui       ?? await ask<UI>(questions.ui);

  // ── Package manager ───────────────────────────────────────────────────────
  const detectedPm = detectPackageManager();
  const pm = flags.pm ?? await ask<PackageManager>({
    ...questions.packageManager,
    // Pre-select detected PM as first option
    choices: detectedPm
      ? [
          questions.packageManager.choices.find((c) => c.value === detectedPm)!,
          ...questions.packageManager.choices.filter((c) => c.value !== detectedPm),
        ]
      : [...questions.packageManager.choices],
    defaultValue: detectedPm ?? questions.packageManager.defaultValue,
  });

  p.outro(pc.green('✔ Configuration locked in — scaffolding now...'));

  const isTS = language === 'ts';

  return {
    name,
    targetDir,
    language,
    router,
    ui,
    pm,
    install: flags.install,
    git: flags.git,
    offline: flags.offline,
    isTS,
    ext: isTS ? 'tsx' : 'jsx',
  };
}

async function ask<T>(q: { message: string; hint?: string; choices: Array<{ value: T; label: string; hint?: string }>; defaultValue: T }): Promise<T> {
  const answer = await p.select<T>({
    message: q.message,
    options: q.choices.map((c) => ({ value: c.value, label: c.label, hint: c.hint })) as Option<T>[],
    initialValue: q.defaultValue,
  });
  if (p.isCancel(answer)) { p.cancel('Cancelled.'); process.exit(0); }
  return answer as T;
}
