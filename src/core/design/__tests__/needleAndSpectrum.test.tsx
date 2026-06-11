import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { describeNeedle, needleAngleDeg, NeedleView, NEEDLE_MAX_LEAN_DEG } from '../NeedleView';
import { SpectrumSlider, SPECTRUM_STOPS, stopDirection } from '../SpectrumSlider';
import { color } from '../tokens';

function flatten(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style.flat(Infinity) : [style]).filter(Boolean));
}

describe('NeedleView — the only data viz (04 §5)', () => {
  it('maps direction to a bounded lean', () => {
    expect(needleAngleDeg(null)).toBe(0);
    expect(needleAngleDeg(0)).toBe(0);
    expect(needleAngleDeg(1)).toBe(NEEDLE_MAX_LEAN_DEG);
    expect(needleAngleDeg(-1)).toBe(-NEEDLE_MAX_LEAN_DEG);
    expect(needleAngleDeg(2)).toBe(NEEDLE_MAX_LEAN_DEG); // clamped
  });

  it('describes the drift in words for screen readers', () => {
    expect(describeNeedle(null)).toMatch(/rests/);
    expect(describeNeedle(0.05)).toMatch(/level/);
    expect(describeNeedle(0.3)).toMatch(/drifts toward spirit/);
    expect(describeNeedle(-0.8)).toMatch(/well toward matter/);
  });

  it('rotates the needle by the computed angle', () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<NeedleView direction={0.5} />);
    });
    const needle = tree.root.findByProps({ testID: 'needle' });
    const transform = flatten(needle.props.style).transform as { rotate: string }[];
    expect(transform[0].rotate).toBe(`${0.5 * NEEDLE_MAX_LEAN_DEG}deg`);
    ReactTestRenderer.act(() => tree.unmount());
  });
});

describe('SpectrumSlider — one tap, seven stops (THR-03)', () => {
  it('spans −1 to +1 with 0 in the middle', () => {
    expect(stopDirection(0)).toBe(-1);
    expect(stopDirection(SPECTRUM_STOPS - 1)).toBe(1);
    expect(stopDirection((SPECTRUM_STOPS - 1) / 2)).toBe(0);
  });

  it('selects a direction with a single tap and shows it in bronze', () => {
    const onSelect = jest.fn();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<SpectrumSlider value={null} onSelect={onSelect} />);
    });
    const stops = tree.root.findAll(
      (n) => n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function',
    );
    expect(stops).toHaveLength(SPECTRUM_STOPS);
    ReactTestRenderer.act(() => stops[SPECTRUM_STOPS - 1].props.onPress());
    expect(onSelect).toHaveBeenCalledWith(1);

    // Re-render with the selection: exactly one bronze stop.
    ReactTestRenderer.act(() => {
      tree.update(<SpectrumSlider value={1} onSelect={onSelect} />);
    });
    const bronzeStops = tree.root
      .findAllByType(require('react-native').View)
      .filter((v) => flatten(v.props.style).backgroundColor === color.bronze);
    expect(bronzeStops).toHaveLength(1);
    ReactTestRenderer.act(() => tree.unmount());
  });
});
