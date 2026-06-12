import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { Storage } from '../../../core/storage/Storage';
import { ensureProfile } from '../../../core/storage/repos/profileRepo';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { localDateKey } from '../../../core/storage/time';
import { entriesOn } from '../../journal/journalRepo';
import { BuildNameFlow } from '../BuildNameFlow';
import { buildCheckin, buildCheckinDue, buildThing, nameBuildThing } from '../buildRepo';
import { RedesignFlow } from '../RedesignFlow';
import { markRedesignStep, redesignState, retireRedesign } from '../redesignRepo';

beforeEach(() => {
  jest
    .spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  const db = await storage.open();
  await ensureProfile(db, new Date(2026, 5, 1));
  return db;
}

const NOW = new Date(2026, 5, 12, 10, 0);
const NEXT_WEEK = new Date(2026, 5, 19, 10, 0);

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

describe('redesignRepo (PLAN-03)', () => {
  it('stores steps and retires for good — never nagged', async () => {
    const db = await openDb();
    await markRedesignStep(db, 'greyscale', true);
    let state = await redesignState(db);
    expect(state.done.greyscale).toBe(true);
    expect(state.retired).toBe(false);

    await retireRedesign(db);
    state = await redesignState(db);
    expect(state.retired).toBe(true);
    expect(state.done.greyscale).toBe(true); // what was done is kept
  });
});

describe('RedesignFlow (PLAN-03)', () => {
  it('toggles steps and ends with a promise of silence', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<RedesignFlow db={db} onExit={() => {}} />);
    });
    await ReactTestRenderer.act(async () => {});
    await press(tree, 'Set the screen to greyscale. The colors are part of the bait.');
    await press(tree, 'that is enough');
    expect(JSON.stringify(tree.toJSON())).toContain('will not ask you about this again');
    const state = await redesignState(db);
    expect(state.done.greyscale).toBe(true);
    expect(state.retired).toBe(true);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});

describe('buildRepo (PLAN-05)', () => {
  it('one named thing per season; naming again begins a new season', async () => {
    const db = await openDb();
    expect(await buildThing(db)).toBeNull();
    await nameBuildThing(db, 'sourdough bread', NOW);
    expect((await buildThing(db))!.name).toBe('sourdough bread');
    await nameBuildThing(db, 'a garden bench', NOW);
    expect((await buildThing(db))!.name).toBe('a garden bench');
    const count = await db.execute('SELECT COUNT(*) AS n FROM build_thing');
    expect(count.rows[0].n).toBe(1);
  });

  it('asks weekly; a yes becomes aliveness Evidence on abandoned_skills', async () => {
    const db = await openDb();
    await nameBuildThing(db, 'sourdough bread', NOW);
    expect(await buildCheckinDue(db, NOW)).toBe(true);

    await buildCheckin(db, 'the starter finally rose overnight', NOW);
    expect(await buildCheckinDue(db, NOW)).toBe(false); // settled this week
    expect(await buildCheckinDue(db, NEXT_WEEK)).toBe(true); // asks again next week

    const entries = await entriesOn(db, localDateKey(NOW));
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('aliveness');
    expect(entries[0].channelKeys).toEqual(['abandoned_skills']);
  });

  it('an empty answer settles the week without an entry or a comment', async () => {
    const db = await openDb();
    await nameBuildThing(db, 'sourdough bread', NOW);
    await buildCheckin(db, '', NOW);
    expect(await buildCheckinDue(db, NOW)).toBe(false);
    expect(await entriesOn(db, localDateKey(NOW))).toHaveLength(0);
  });
});

describe('BuildNameFlow (PLAN-05)', () => {
  it('names the thing and promises only the weekly question', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<BuildNameFlow db={db} onExit={() => {}} />);
    });
    const input = tree.root.find(
      (n) =>
        typeof n.props.accessibilityLabel === 'string' &&
        n.props.accessibilityLabel.startsWith('One thing your hands') &&
        typeof n.props.onChangeText === 'function',
    );
    ReactTestRenderer.act(() => input.props.onChangeText('sourdough bread'));
    await press(tree, 'name it');
    expect(JSON.stringify(tree.toJSON())).toContain('did your hands learn something?');
    expect((await buildThing(db))!.name).toBe('sourdough bread');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
