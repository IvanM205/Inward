import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { Storage } from '../../../core/storage/Storage';
import { reflectionForDate } from '../../../core/storage/repos/reflectionRepo';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { localDateKey } from '../../../core/storage/time';
import { entriesOn } from '../../journal/journalRepo';
import { EveningFlow } from '../EveningFlow';
import { MorningFlow, MORNING_QUESTION } from '../MorningFlow';

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

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

function typeInto(tree: ReactTestRenderer.ReactTestRenderer, label: string, text: string) {
  const input = tree.root.find(
    (n) =>
      n.props.accessibilityLabel === label && typeof n.props.onChangeText === 'function',
  );
  ReactTestRenderer.act(() => input.props.onChangeText(text));
}

describe('MorningFlow (THR-02)', () => {
  it('asks the one question, reveals the opening, ends in a terminal screen', async () => {
    const onExit = jest.fn();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<MorningFlow onExit={onExit} />);
    });
    expect(JSON.stringify(tree.toJSON())).toContain(MORNING_QUESTION);

    typeInto(tree, MORNING_QUESTION, 'my daughter');
    await press(tree, 'go on');
    expect(JSON.stringify(tree.toJSON())).toContain('today’s opening');

    await press(tree, 'i will');
    expect(JSON.stringify(tree.toJSON())).toContain('Now go give it your attention.');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});

describe('EveningFlow (THR-03, JRN-02)', () => {
  it('walks direction → gratitudes → fold → needle → rest, persisting everything', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<EveningFlow db={db} onExit={() => {}} />);
    });

    // One tap on the spectrum: fully toward spirit.
    await press(tree, 'fully toward spirit');
    typeInto(tree, 'A line about it, if you wish.', 'a slow day, mostly off the phone');
    await press(tree, 'go on');

    // One gratitude of up to three.
    typeInto(tree, 'Up to three things — or none.', 'Eva cooked for us');
    await press(tree, 'go on');

    // The fold: answer one prompt of three (any/all/none — JRN-02).
    typeInto(
      tree,
      'Was there a kindness in your day — given or received?',
      'carried the neighbour’s groceries up the stairs',
    );
    await press(tree, 'fold the day');

    // The needle shows the drift of the one reflection: fully spirit.
    expect(JSON.stringify(tree.toJSON())).toContain('The needle leans well toward spirit.');

    const today = localDateKey(new Date());
    const reflection = await reflectionForDate(db, today);
    expect(reflection!.direction).toBeCloseTo(1);
    expect(reflection!.line).toBe('a slow day, mostly off the phone');
    expect(reflection!.gratitudes).toEqual(['Eva cooked for us']);

    const entries = await entriesOn(db, today);
    expect(entries.map((e) => e.type).sort()).toEqual(['gratitude', 'kindness']);
    expect(entries.every((e) => e.origin === 'evening')).toBe(true);
    const kindness = entries.find((e) => e.type === 'kindness')!;
    expect(kindness.counted).toBe(true); // concrete + past tense + named thing

    await press(tree, 'good night');
    expect(JSON.stringify(tree.toJSON())).toContain('That is enough for today. Rest now.');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('cannot continue before the one tap that is the whole ask', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<EveningFlow db={db} onExit={() => {}} />);
    });
    const [goOn] = tree.root.findAll(
      (n) => n.props.accessibilityLabel === 'go on' && typeof n.props.onPress === 'function',
    );
    expect(goOn.props.disabled).toBe(true);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
