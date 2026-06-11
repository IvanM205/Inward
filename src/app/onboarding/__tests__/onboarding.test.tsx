import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Animated and the breath run on timers; keep them virtual and deterministic.
jest.useFakeTimers();
import { Storage } from '../../../core/storage/Storage';
import { getProfile } from '../../../core/storage/repos/profileRepo';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { BreathScreen, BREATH_TOTAL_MS, SKIP_AVAILABLE_AFTER_MS } from '../BreathScreen';
import { OnboardingFlow } from '../OnboardingFlow';
import { THE_SENTENCE } from '../SentenceScreen';

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

async function pressByLabel(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  // Match the Pressable composite (it carries onPress); host views repeat the
  // accessibility props, so filter on the handler and take the first.
  const [target] = tree.root.findAll(
    (node) =>
      node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

describe('BreathScreen (ONB-01)', () => {
  it('offers nothing tappable before 3 s, then a subtle skip', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<BreathScreen onDone={() => {}} />);
    });
    // Count Pressable composites (the onPress carriers), not their host views.
    const buttons = () =>
      tree.root.findAll(
        (n) => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function',
      );
    expect(buttons()).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(SKIP_AVAILABLE_AFTER_MS);
    });
    expect(buttons()).toHaveLength(1);
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('completes by itself after one full breath (10 s)', async () => {
    const onDone = jest.fn();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<BreathScreen onDone={onDone} />);
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(BREATH_TOTAL_MS);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});

describe('OnboardingFlow (ONB-01..03, ONB-05)', () => {
  it('walks breath → sentence → permissions → terminal, persisting progress', async () => {
    const db = await openDb();
    const permissions = {
      requestNotifications: jest.fn().mockResolvedValue(true),
      requestScreenTime: jest.fn().mockResolvedValue(false),
    };
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <OnboardingFlow db={db} permissions={permissions} onExit={() => {}} />,
      );
    });

    // No profile exists before the first breath completes (no data collected).
    expect(await getProfile(db)).toBeNull();

    // The breath completes on its own; profile appears.
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(BREATH_TOTAL_MS);
    });
    await ReactTestRenderer.act(async () => {}); // settle the async advance
    expect(JSON.stringify(tree.toJSON())).toContain(THE_SENTENCE);
    expect((await getProfile(db))!.onboardingState).toBe('breath_done');

    await pressByLabel(tree, 'go on');
    expect((await getProfile(db))!.onboardingState).toBe('sentence_done');

    // Two honest asks: notifications accepted, screen time refused (ONB-03).
    await pressByLabel(tree, 'yes');
    expect(permissions.requestNotifications).toHaveBeenCalled();
    await pressByLabel(tree, 'not now');
    expect(permissions.requestScreenTime).not.toHaveBeenCalled(); // refusal asks nothing
    expect((await getProfile(db))!.onboardingState).toBe('permissions_done');

    // The flow ends in the terminal screen (INV-3).
    expect(JSON.stringify(tree.toJSON())).toContain('That is enough for today. Go live.');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
