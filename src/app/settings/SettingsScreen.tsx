/**
 * Settings — deliberately small: how the score works (NFR-P5, JRN-04) and
 * the one-tap total erasure (INV-6), in plain words. No toggles for things
 * that should not exist, no account, nothing to manage.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { color, space, type } from '../../core/design/tokens';
import { t } from '../../core/content/strings';
import { scoreDisclosure } from './scoreDisclosure';

export interface SettingsScreenProps {
  locale?: string;
  /** Performs the irrevocable erasure; the host then returns to first run. */
  onEraseAll: () => Promise<void>;
  onClose: () => void;
}

const ERASE_PLAIN_WORDS =
  'This deletes everything Inward knows — your answers, your journal, your ' +
  'reflections, your scores — immediately and forever. Nothing is kept ' +
  'anywhere. There is no undo.';

export function SettingsScreen({ locale = 'en', onEraseAll, onClose }: SettingsScreenProps): React.JSX.Element {
  const [showScore, setShowScore] = useState(false);
  const [confirmingErase, setConfirmingErase] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView bounces={false}>
        <QuietAction
          label={showScore ? t('settings.howScoreClose', locale) : t('settings.howScore', locale)}
          onPress={() => setShowScore(!showScore)}
        />
        {showScore &&
          scoreDisclosure().map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

        <QuietAction
          label={t('settings.erase', locale)}
          onPress={() => setConfirmingErase(!confirmingErase)}
        />
        {confirmingErase && (
          <View style={styles.section}>
            <Text style={styles.sectionBody}>{ERASE_PLAIN_WORDS}</Text>
            <View style={styles.eraseAction}>
              <PrimaryAction label={t('settings.eraseNow', locale)} onPress={() => onEraseAll()} />
              <QuietAction label={t('settings.keepThings', locale)} onPress={() => setConfirmingErase(false)} />
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.close}>
        <QuietAction label={t('common.backToThreshold', locale)} onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
    paddingTop: space.x6,
    paddingHorizontal: space.readingMargin,
  },
  section: {
    paddingVertical: space.x2,
  },
  sectionTitle: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
    marginBottom: space.x1,
  },
  sectionBody: {
    ...type.body,
    color: color.ink,
  },
  eraseAction: {
    marginTop: space.x2,
    alignItems: 'center',
  },
  close: {
    alignItems: 'center',
    paddingVertical: space.x2,
  },
});
