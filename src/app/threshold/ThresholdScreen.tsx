/**
 * The Threshold — home (THR-01): at most three elements, ever — the due
 * Compass (morning or evening), Today's Opening, and one quiet line.
 * M1 slice: the quiet line and the due compass door; Today's Opening waits
 * for threads (THR-04, M3).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { color, space, type } from '../../core/design/tokens';
import { CompassSlot } from './dueCompass';

export type { CompassSlot };

export interface ThresholdScreenProps {
  /** Which compass is due, if any — the dueCompass rule, applied by the host. */
  dueCompass: CompassSlot;
  onOpenCompass: (slot: 'morning' | 'evening') => void;
  /** The Quiet switch — a door (01 §IA chrome), not one of the 3 elements. */
  onOpenQuiet: () => void;
}

const QUIET_LINE = 'The day is on the other side of this screen.';

export function ThresholdScreen({ dueCompass, onOpenCompass, onOpenQuiet }: ThresholdScreenProps): React.JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.quietLine} accessibilityRole="text">
        {QUIET_LINE}
      </Text>
      {dueCompass !== null && (
        <View style={styles.compass}>
          <PrimaryAction
            label={dueCompass === 'morning' ? 'the morning compass' : 'the evening compass'}
            onPress={() => onOpenCompass(dueCompass)}
          />
        </View>
      )}
      <View style={styles.quietSwitch}>
        <QuietAction label="unplug" onPress={onOpenQuiet} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.readingMargin,
  },
  quietLine: {
    ...type.body,
    color: color.stone,
    textAlign: 'center',
  },
  compass: {
    marginTop: space.x6,
  },
  quietSwitch: {
    position: 'absolute',
    bottom: space.x6,
  },
});
