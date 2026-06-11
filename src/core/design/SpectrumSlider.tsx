/**
 * SpectrumSlider — the spirit↔matter one-tap spectrum (06 §Components,
 * THR-03). Seven quiet stops; one tap chooses a direction between
 * −1.0 (matter) and +1.0 (spirit). No numbers shown, no precision demanded.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, space, touchTarget, type } from './tokens';

export const SPECTRUM_STOPS = 7;

/** Direction value of stop `i` (0-based): evenly spaced over −1…+1. */
export function stopDirection(i: number): number {
  return Number(((i / (SPECTRUM_STOPS - 1)) * 2 - 1).toFixed(3));
}

export interface SpectrumSliderProps {
  /** Selected direction, or null before the tap. */
  value: number | null;
  onSelect: (direction: number) => void;
}

export function SpectrumSlider({ value, onSelect }: SpectrumSliderProps): React.JSX.Element {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Which way did today lean — matter or spirit?">
      <View style={styles.track}>
        {Array.from({ length: SPECTRUM_STOPS }, (_, i) => {
          const direction = stopDirection(i);
          const selected = value !== null && Math.abs(value - direction) < 1e-6;
          return (
            <Pressable
              key={i}
              onPress={() => onSelect(direction)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={describeStop(direction)}
              style={styles.stopTouch}>
              <View style={[styles.stop, selected && styles.stopSelected]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>matter</Text>
        <Text style={styles.label}>spirit</Text>
      </View>
    </View>
  );
}

function describeStop(direction: number): string {
  if (direction === 0) return 'level — neither way';
  const side = direction > 0 ? 'spirit' : 'matter';
  const strength = Math.abs(direction) > 0.7 ? 'fully toward' : Math.abs(direction) > 0.35 ? 'toward' : 'a little toward';
  return `${strength} ${side}`;
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopTouch: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: color.stone,
  },
  // The single bronze on the screen: the chosen direction.
  stopSelected: {
    backgroundColor: color.bronze,
    borderColor: color.bronze,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.x1,
  },
  label: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
  },
});
