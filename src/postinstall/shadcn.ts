import { pmDlx } from '../pm/run.js';
import type { ScaffoldContext } from '../types.js';

/** shadcn primitives consumed by the auth, dashboard, and admin templates. */
const SHADCN_COMPONENTS = ['button', 'card', 'input', 'label', 'badge', 'separator'];

/**
 * Runs `<pm> dlx shadcn@latest add --yes <components>` in the generated
 * project directory.  No-ops when ui !== 'shadcn'.
 */
export async function runShadcnAdd(ctx: ScaffoldContext): Promise<void> {
  if (ctx.ui !== 'shadcn') return;
  await pmDlx(ctx.pm, ctx.targetDir, 'shadcn@latest', [
    'add',
    '--yes',
    ...SHADCN_COMPONENTS,
  ]);
}
