/**
 * PLAN-03 — the phone-redesign checklist: one-time, optional, four steps of
 * instruction (deep links arrive with the native bridges). Completion is
 * stored and NEVER nagged: once the person says "that is enough", the door
 * retires for good.
 */
import { SqlDatabase } from '../../core/storage/ports';

export const REDESIGN_STEPS = [
  {
    key: 'greyscale',
    text: 'Set the screen to greyscale. The colors are part of the bait.',
  },
  {
    key: 'dots',
    text: 'Turn off the red dots and banners for everything that is not a person.',
  },
  {
    key: 'home',
    text: 'Move every feed app off the first screen, into one folder, named honestly.',
  },
  {
    key: 'widget',
    text: 'Put the craving button where the loudest app used to live.',
  },
] as const;

export type RedesignStepKey = (typeof REDESIGN_STEPS)[number]['key'];

export interface RedesignState {
  done: Partial<Record<RedesignStepKey, boolean>>;
  /** The person closed the checklist — the door never reopens on its own. */
  retired: boolean;
}

export async function redesignState(db: SqlDatabase): Promise<RedesignState> {
  const result = await db.execute('SELECT phone_redesign FROM profile LIMIT 1');
  const raw = result.rows[0]?.phone_redesign;
  const parsed = raw ? (JSON.parse(String(raw)) as Partial<RedesignState>) : {};
  return { done: parsed.done ?? {}, retired: parsed.retired ?? false };
}

async function save(db: SqlDatabase, state: RedesignState): Promise<void> {
  await db.execute('UPDATE profile SET phone_redesign = ?', [JSON.stringify(state)]);
}

export async function markRedesignStep(
  db: SqlDatabase,
  key: RedesignStepKey,
  done: boolean,
): Promise<void> {
  const state = await redesignState(db);
  await save(db, { ...state, done: { ...state.done, [key]: done } });
}

/** "That is enough" — keep whatever was done, close the door (never nagged). */
export async function retireRedesign(db: SqlDatabase): Promise<void> {
  const state = await redesignState(db);
  await save(db, { ...state, retired: true });
}
