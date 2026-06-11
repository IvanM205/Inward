/**
 * NeedleView — the ONLY data visualization in the app (04 §5, 06 §Components):
 * a compass needle drifting with the 90-day mean of evening directions.
 * No numbers, no axes, no history — just which way a life is leaning.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, space, type } from './tokens';

/** Degrees the needle leans at |direction| = 1 — well short of horizontal. */
export const NEEDLE_MAX_LEAN_DEG = 75;

export interface NeedleViewProps {
  /** 90-day mean direction (−1 matter … +1 spirit), or null with no data yet. */
  direction: number | null;
}

export function needleAngleDeg(direction: number | null): number {
  if (direction === null) return 0;
  const clamped = Math.min(1, Math.max(-1, direction));
  return clamped * NEEDLE_MAX_LEAN_DEG;
}

export function describeNeedle(direction: number | null): string {
  if (direction === null) return 'The needle rests — no evenings reflected yet.';
  if (Math.abs(direction) < 0.1) return 'The needle stands level between matter and spirit.';
  const side = direction > 0 ? 'spirit' : 'matter';
  return Math.abs(direction) > 0.5
    ? `The needle leans well toward ${side}.`
    : `The needle drifts toward ${side}.`;
}

export function NeedleView({ direction }: NeedleViewProps): React.JSX.Element {
  const angle = needleAngleDeg(direction);
  return (
    <View style={styles.compass} accessibilityRole="image" accessibilityLabel={describeNeedle(direction)}>
      <View style={styles.dial}>
        <View
          testID="needle"
          style={[styles.needle, { transform: [{ rotate: `${angle}deg` }] }]}
        />
        <View style={styles.pivot} />
      </View>
      <View style={styles.poles}>
        <Text style={styles.pole}>matter</Text>
        <Text style={styles.pole}>spirit</Text>
      </View>
    </View>
  );
}

const DIAL = 180;

const styles = StyleSheet.create({
  compass: {
    alignItems: 'center',
  },
  dial: {
    width: DIAL,
    height: DIAL,
    borderRadius: DIAL / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.mist,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: DIAL / 2,
  },
  needle: {
    position: 'absolute',
    bottom: DIAL / 2,
    width: 2,
    height: DIAL / 2 - space.x2,
    backgroundColor: color.ink,
    transformOrigin: 'bottom center',
  },
  pivot: {
    position: 'absolute',
    bottom: DIAL / 2 - 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.stone,
  },
  poles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: DIAL,
    marginTop: space.x2,
  },
  pole: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
  },
});
