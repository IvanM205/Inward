/**
 * ONB-02 — one sentence, then one question.
 *
 * The answer is deliberately NOT stored: nothing in the spec needs it, and
 * when a decision is not covered, we choose the option that collects the
 * least data (specs/README §How agents use this pack #3). The question is for
 * the person, not for the database.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction } from '../../core/design/Buttons';
import { QuestionCard } from '../../core/design/QuestionCard';
import { color, space, type } from '../../core/design/tokens';
import { t } from '../../core/content/strings';

export const THE_SENTENCE = 'You were not made to be harvested.';

export interface SentenceScreenProps {
  locale?: string;
  onDone: () => void;
}

export function SentenceScreen({ locale = 'en', onDone }: SentenceScreenProps): React.JSX.Element {
  const [answer, setAnswer] = useState('');
  return (
    <View style={styles.screen}>
      <Text style={styles.sentence} accessibilityRole="header">
        {t('onb.sentence', locale)}
      </Text>
      <QuestionCard
        question={t('onb.question', locale)}
        value={answer}
        onChange={setAnswer}
        placeholder={t('onb.questionHint', locale)}
      />
      <View style={styles.action}>
        <PrimaryAction label={t('common.goOn', locale)} onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
    justifyContent: 'center',
    paddingVertical: space.x6,
  },
  sentence: {
    ...type.terminalLine,
    color: color.ink,
    textAlign: 'center',
    paddingHorizontal: space.readingMargin,
    marginBottom: space.x6,
  },
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
