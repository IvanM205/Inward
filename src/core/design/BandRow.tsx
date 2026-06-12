/**
 * BandRow — channel band display (06 §Components, MIR-01): the band in words,
 * never a chart. Tappable: raw numbers and the person's own answers live
 * behind one tap (handled by the host — in place, no navigation cycle).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Band } from '../scoring/config';
import { color, space, touchTarget, type } from './tokens';

export const BAND_WORDS: Record<Band, string> = {
  free: 'free',
  leaking: 'leaking',
  caught: 'caught',
};

export interface BandRowProps {
  channelName: string;
  band: Band;
  /** Opens the explanation: which of your own answers built this (MIR-03). */
  onPress: () => void;
  expanded?: boolean;
}

export function BandRow({ channelName, band, onPress, expanded }: BandRowProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${channelName} — ${BAND_WORDS[band]}. Tap to see which of your answers built this.`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Text style={styles.name}>{channelName.toLowerCase()}</Text>
      <View style={styles.bandHolder}>
        <Text style={[styles.band, expanded && styles.bandExpanded]}>{BAND_WORDS[band]}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.mist,
    paddingVertical: space.x1 / 2,
  },
  pressed: { opacity: 0.6 },
  name: {
    ...type.body,
    color: color.ink,
  },
  bandHolder: {
    minWidth: 72,
    alignItems: 'flex-end',
  },
  band: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
  },
  bandExpanded: {
    color: color.ink,
  },
});
