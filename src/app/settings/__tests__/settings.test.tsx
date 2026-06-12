import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import {
  BANDS,
  DAILY_COUNTED_CAP,
  EVIDENCE_OFFSET_CAP,
  EVIDENCE_WINDOW_DAYS,
  SMOOTHING_WEEKS,
} from '../../../core/scoring/config';
import { scoreDisclosure } from '../scoreDisclosure';
import { SettingsScreen } from '../SettingsScreen';

beforeEach(() => {
  jest
    .spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const [target] = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!target) throw new Error(`No pressable labeled "${label}" on screen.`);
  await ReactTestRenderer.act(async () => target.props.onPress());
}

describe('scoreDisclosure (NFR-P5, JRN-04)', () => {
  it('discloses exactly what the config configures', () => {
    const text = scoreDisclosure().map((s) => `${s.title}\n${s.body}`).join('\n');
    expect(text).toContain('35%'); // time weight
    expect(text).toContain('40%'); // pull weight
    expect(text).toContain('25%'); // displacement weight
    expect(text).toContain(String(EVIDENCE_OFFSET_CAP));
    expect(text).toContain(String(EVIDENCE_WINDOW_DAYS));
    expect(text).toContain(String(DAILY_COUNTED_CAP));
    expect(text).toContain(String(SMOOTHING_WEEKS));
    expect(text).toContain(String(BANDS.free.max));
    expect(text).toContain(String(BANDS.leaking.max));
    expect(text).toContain('written for the soul, not the score');
    expect(text).not.toMatch(/!/); // no urgency, even in disclosure (06 §Copy)
  });

  it('discloses the same numbers in Slovak (NFR-X2)', () => {
    const sk = scoreDisclosure('sk').map((s) => `${s.title}\n${s.body}`).join('\n');
    expect(sk).toContain('čo je index');
    expect(sk).toContain('35%');
    expect(sk).toContain(String(EVIDENCE_OFFSET_CAP));
    expect(sk).toContain('písané pre dušu, nie pre skóre');
    expect(sk).not.toMatch(/\{\w+\}/); // every placeholder resolved
  });
});

describe('SettingsScreen (INV-6)', () => {
  it('shows the disclosure behind one tap', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <SettingsScreen onEraseAll={jest.fn()} onClose={() => {}} />,
      );
    });
    expect(JSON.stringify(tree.toJSON())).not.toContain('what the index is');
    await press(tree, 'how the score works');
    expect(JSON.stringify(tree.toJSON())).toContain('what the index is');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('erasure says what it does in plain words, then does it in one tap', async () => {
    const onEraseAll = jest.fn().mockResolvedValue(undefined);
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <SettingsScreen onEraseAll={onEraseAll} onClose={() => {}} />,
      );
    });
    await press(tree, 'erase everything');
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('immediately and forever');
    expect(json).toContain('There is no undo.');
    expect(onEraseAll).not.toHaveBeenCalled(); // words first, action second

    await press(tree, 'erase it all now');
    expect(onEraseAll).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('"keep my things" backs out without erasing', async () => {
    const onEraseAll = jest.fn();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <SettingsScreen onEraseAll={onEraseAll} onClose={() => {}} />,
      );
    });
    await press(tree, 'erase everything');
    await press(tree, 'keep my things');
    expect(onEraseAll).not.toHaveBeenCalled();
    expect(JSON.stringify(tree.toJSON())).not.toContain('There is no undo.');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
