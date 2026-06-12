/**
 * The Threshold — home (THR-01): at most three elements, ever — the due
 * Compass (morning or evening), Today's Opening, and one quiet line.
 * M1 slice: the quiet line and the due compass door; Today's Opening waits
 * for threads (THR-04, M3).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '../../core/content/strings';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { color, space, type } from '../../core/design/tokens';
import { CompassSlot } from './dueCompass';

export type { CompassSlot };

export interface ThresholdScreenProps {
  /** Profile locale (NFR-X2); the catalog falls back to English. */
  locale?: string;
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
  /** A Path — start one, or walk today's day (LIB-02). */
  onOpenPath?: () => void;
  pathDoorLabel?: string;
  /** The quizzes (LIB-04). */
  onOpenQuizzes: () => void;
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
  /** The Living Journal, read back (JRN-04/05). */
  onOpenJournal: () => void;
  onOpenSettings: () => void;
}

export function ThresholdScreen({
  locale = 'en',
  dueCompass,
  onOpenCompass,
  opening,
  onOpenOpening,
  onOpenQuiet,
  onOpenDetox,
  detoxDoorLabel,
  onOpenCraving,
  onOpenReading,
  onOpenPath,
  pathDoorLabel,
  onOpenQuizzes,
  onOpenRealign,
  onOpenMirror,
  onOpenVow,
  onOpenRedesign,
  onOpenBuild,
  onOpenJournal,
  onOpenSettings,
}: ThresholdScreenProps): React.JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.quietLine} accessibilityRole="text">
        {t('threshold.quietLine', locale)}
      </Text>
      {dueCompass !== null && (
        <View style={styles.compass}>
          <PrimaryAction
            label={
              dueCompass === 'morning'
                ? t('threshold.morningCompass', locale)
                : t('threshold.eveningCompass', locale)
            }
            onPress={() => onOpenCompass(dueCompass)}
          />
        </View>
      )}
      {opening != null && onOpenOpening && (
        <View style={styles.compass}>
          <QuietAction
            label={`${t('threshold.opening', locale)} — ${opening}`}
            onPress={onOpenOpening}
          />
        </View>
      )}
      <View style={styles.quietSwitch}>
        <QuietAction label={t('threshold.reading', locale)} onPress={onOpenReading} />
        {onOpenPath && (
          <QuietAction label={pathDoorLabel ?? t('threshold.path', locale)} onPress={onOpenPath} />
        )}
        <QuietAction label={t('threshold.quizzes', locale)} onPress={onOpenQuizzes} />
        <QuietAction label={t('threshold.craving', locale)} onPress={onOpenCraving} />
        {onOpenRealign && <QuietAction label={t('threshold.realign', locale)} onPress={onOpenRealign} />}
        {onOpenMirror && <QuietAction label={t('threshold.mirror', locale)} onPress={onOpenMirror} />}
        {onOpenVow && <QuietAction label={t('threshold.untangling', locale)} onPress={onOpenVow} />}
        {onOpenRedesign && (
          <QuietAction label={t('threshold.redesign', locale)} onPress={onOpenRedesign} />
        )}
        {onOpenBuild && <QuietAction label={t('threshold.build', locale)} onPress={onOpenBuild} />}
        <QuietAction label={t('threshold.unplug', locale)} onPress={onOpenQuiet} />
        {onOpenDetox && (
          <QuietAction
            label={detoxDoorLabel ?? t('threshold.detox', locale)}
            onPress={onOpenDetox}
          />
        )}
        <QuietAction label={t('threshold.journal', locale)} onPress={onOpenJournal} />
        <QuietAction label={t('threshold.settings', locale)} onPress={onOpenSettings} />
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
