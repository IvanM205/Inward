import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Animated drives fades through real timers; keep them virtual so renders
// settle deterministically under act().
jest.useFakeTimers();
import { PrimaryAction, QuietAction } from '../Buttons';
import { QuestionCard } from '../QuestionCard';
import { TerminalScreen } from '../TerminalScreen';
import { color } from '../tokens';

function flatten(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style.flat(Infinity) : [style]).filter(Boolean));
}

describe('TerminalScreen (INV-3)', () => {
  it('renders night background and the one serif line', () => {
    // Reduced motion: stillness instead of fades (06 §Motion) — and the
    // animation-free path keeps the test deterministic. TerminalScreen has no
    // React state, so synchronous act() is sufficient.
    jest
      .spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    let tree!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <TerminalScreen line="That is enough for today. Go live." onExit={() => {}} />,
      );
    });
    const root = tree.root;
    const view = root.findByProps({ accessibilityViewIsModal: true });
    expect(flatten(view.props.style).backgroundColor).toBe(color.night);
    expect(JSON.stringify(tree.toJSON())).toContain('That is enough for today. Go live.');
    ReactTestRenderer.act(() => tree.unmount());
  });
});

describe('Buttons (06 §Components)', () => {
  it('"not now" is visually equal in size to "yes" — identical base typography', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <>
          <PrimaryAction label="yes" onPress={() => {}} />
          <QuietAction label="not now" onPress={() => {}} />
        </>,
      );
    });
    const [primary, quiet] = tree.root.findAllByType(require('react-native').Text);
    const p = flatten(primary.props.style);
    const q = flatten(quiet.props.style);
    expect(p.fontSize).toBe(q.fontSize);
    expect(p.fontFamily).toBe(q.fontFamily);
    expect(p.lineHeight).toBe(q.lineHeight);
    // Only the ink differs: bronze for the primary, stone for the quiet one.
    expect(p.color).toBe(color.bronze);
    expect(q.color).toBe(color.stone);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});

describe('QuestionCard', () => {
  it('renders one question and one input', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <QuestionCard
          question="What will you give your attention to today?"
          value=""
          onChange={() => {}}
        />,
      );
    });
    const inputs = tree.root.findAllByType(require('react-native').TextInput);
    expect(inputs).toHaveLength(1);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
