import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { activeThread, setMicroAct, setReplacementHabit, startThread } from '../threadRepo';
import { VowWizardFlow } from '../VowWizardFlow';

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
  return storage.open();
}

const NOW = new Date(2026, 5, 12, 10, 0);

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

function typeInto(tree: ReactTestRenderer.ReactTestRenderer, question: string, text: string) {
  const input = tree.root.find(
    (n) => n.props.accessibilityLabel === question && typeof n.props.onChangeText === 'function',
  );
  ReactTestRenderer.act(() => input.props.onChangeText(text));
}

describe('threadRepo habit fields (PLAN-02)', () => {
  it('stores the loop and micro-act on the active thread', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', NOW);
    await setReplacementHabit(db, {
      cue: 'in bed at night',
      routine: 'scrolling shorts',
      reward: 'numbness before sleep',
      vowText: 'When I lie down, I will open the book on my nightstand.',
    });
    await setMicroAct(db, 'read one page');
    const thread = (await activeThread(db))!;
    expect(thread.replacementHabit!.vowText).toContain('book on my nightstand');
    expect(thread.microAct).toBe('read one page');
  });

  it('refuses without an active thread (PLAN-01 ordering)', async () => {
    const db = await openDb();
    await expect(setMicroAct(db, 'one page')).rejects.toThrow(/No active thread/);
  });
});

describe('VowWizardFlow (PLAN-02)', () => {
  it('walks cue → routine → reward → vow → micro-act and persists the vow', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', NOW);
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<VowWizardFlow db={db} onExit={() => {}} />);
    });

    typeInto(tree, 'When does the pull usually find you?', 'in bed at night');
    await press(tree, 'go on');
    typeInto(tree, 'And what happens then — the old routine?', 'scrolling shorts for an hour');
    await press(tree, 'go on');
    typeInto(tree, 'Be honest: what does it give you?', 'a rest from thinking');
    await press(tree, 'go on');

    // The vow screen echoes the mapped loop back in the person's words.
    const vowJson = JSON.stringify(tree.toJSON());
    expect(vowJson).toContain('in bed at night');
    expect(vowJson).toContain('instead of');
    typeInto(
      tree,
      'Now the vow — when the cue comes, what will you do instead?',
      'When I lie down, I will open the book on my nightstand.',
    );
    await press(tree, 'go on');
    typeInto(
      tree,
      'And the smallest daily act — under five minutes, doable on your worst day?',
      'read one page',
    );
    await press(tree, 'go on');

    expect(JSON.stringify(tree.toJSON())).toContain('The vow is made. Go live it once, today.');
    const thread = (await activeThread(db))!;
    expect(thread.replacementHabit).toEqual({
      cue: 'in bed at night',
      routine: 'scrolling shorts for an hour',
      reward: 'a rest from thinking',
      vowText: 'When I lie down, I will open the book on my nightstand.',
    });
    expect(thread.microAct).toBe('read one page');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('cannot move on with an empty answer — the loop is mapped, not skipped', async () => {
    const db = await openDb();
    await startThread(db, 'feeds', NOW);
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<VowWizardFlow db={db} onExit={() => {}} />);
    });
    const [goOn] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'go on' && typeof n.props.onPress === 'function',
    );
    expect(goOn.props.disabled).toBe(true);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
