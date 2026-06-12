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
  /** Today's Opening — the one act, if a thread offers one today (THR-04). */
  opening?: string | null;
  onOpenOpening?: () => void;
  /** The Quiet switch — a door (01 §IA chrome), not one of the 3 elements. */
  onOpenQuiet: () => void;
  /** Dopamine Detox: start when none runs; the day's check-in while one does. */
  onOpenDetox?: () => void;
  detoxDoorLabel?: string;
  /** The Craving Button — always reachable from the Threshold (CRAVE-01). */
  onOpenCraving: () => void;
  /** One Deep Thing — today's reading (LIB-01). */
  onOpenReading: () => void;
  /** The weekly realignment — shown while this week's is unwritten (RLG-01). */
  onOpenRealign?: () => void;
  /** The Mirror door — shown while the intake is open or unfinished (ONB-04). */
  onOpenMirror?: () => void;
  /** The Plan door — shown while the active thread's vow is unwritten (PLAN-02). */
  onOpenVow?: () => void;
  /** One-time phone redesign — retires forever once closed (PLAN-03). */
  onOpenRedesign?: () => void;
  /** Build One Thing — shown until the season's thing is named (PLAN-05). */
  onOpenBuild?: () => void;
  onOpenSettings: () => void;
}

const QUIET_LINE = 'The day is on the other side of this screen.';

export function ThresholdScreen({
  dueCompass,
  onOpenCompass,
  opening,
  onOpenOpening,
  onOpenQuiet,
  onOpenDetox,
  detoxDoorLabel,
  onOpenCraving,
  onOpenReading,
  onOpenRealign,
  onOpenMirror,
  onOpenVow,
  onOpenRedesign,
  onOpenBuild,
  onOpenSettings,
}: ThresholdScreenProps): React.JSX.Element {
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
      {opening != null && onOpenOpening && (
        <View style={styles.compass}>
          <QuietAction label={`today’s opening — ${opening}`} onPress={onOpenOpening} />
        </View>
      )}
      <View style={styles.quietSwitch}>
        <QuietAction label="one deep thing" onPress={onOpenReading} />
        <QuietAction label="i feel the pull" onPress={onOpenCraving} />
        {onOpenRealign && <QuietAction label="the weekly realignment" onPress={onOpenRealign} />}
        {onOpenMirror && <QuietAction label="the mirror" onPress={onOpenMirror} />}
        {onOpenVow && <QuietAction label="the untangling" onPress={onOpenVow} />}
        {onOpenRedesign && <QuietAction label="redesign the phone" onPress={onOpenRedesign} />}
        {onOpenBuild && <QuietAction label="build one thing" onPress={onOpenBuild} />}
        <QuietAction label="unplug" onPress={onOpenQuiet} />
        {onOpenDetox && (
          <QuietAction label={detoxDoorLabel ?? 'dopamine detox'} onPress={onOpenDetox} />
        )}
        <QuietAction label="settings" onPress={onOpenSettings} />
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
