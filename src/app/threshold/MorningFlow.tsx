/**
 * THR-02 — the morning compass: one question, Today's Opening, release.
 * Total target ≤ 60 s. The answer is an orientation, not a record — it is
 * deliberately not stored (least data, specs/README §3); completing the flow
 * leaves only today's date on the profile so the Threshold lets the morning
 * rest (ADR-004). Today's Opening draws from the active thread once threads
 * exist (THR-04, M3); until then the morning offers the day itself.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction } from '../../core/design/Buttons';
import { QuestionCard } from '../../core/design/QuestionCard';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { t } from '../../core/content/strings';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { markMorningDone } from '../../core/storage/repos/profileRepo';
import { localDateKey } from '../../core/storage/time';
import { MORNING_FLOW } from '../../flows/registry';

export const MORNING_QUESTION = 'What will you give your attention to today?';

export interface MorningFlowProps {
  db: SqlDatabase;
  /** Today's Opening text, when the active thread offers one (THR-02/04). */
  opening?: string | null;
  locale?: string;
  onExit: () => void;
}

export function MorningFlow({ db, opening, locale = 'en', onExit }: MorningFlowProps): React.JSX.Element {
  const [answer, setAnswer] = useState('');
  return (
    <FlowHost
      flow={MORNING_FLOW}
      onExit={onExit}
      renderers={{
        question: (api) => (
          <View style={styles.screen}>
            <QuestionCard
              question={t('morning.question', locale)}
              value={answer}
              onChange={setAnswer}
              placeholder={t('morning.questionHint', locale)}
            />
            <View style={styles.action}>
              <PrimaryAction label={t('common.goOn', locale)} onPress={() => api.advance()} />
            </View>
          </View>
        ),
        opening: (api) => (
          <View style={styles.screen}>
            <Text style={styles.openingLabel}>{t('morning.openingLabel', locale)}</Text>
            <Text style={styles.openingLine}>{opening ?? t('morning.noThread', locale)}</Text>
            <View style={styles.action}>
              <PrimaryAction
                label={t('morning.iWill', locale)}
                onPress={async () => {
                  await markMorningDone(db, localDateKey(new Date()));
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        'go-live': (api) => (
          <TerminalScreen line={t('morning.terminal', locale)} onExit={api.exit} />
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
    justifyContent: 'center',
    paddingVertical: space.x6,
  },
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
  openingLabel: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: space.x2,
  },
  openingLine: {
    ...type.question,
    color: color.ink,
    textAlign: 'center',
    paddingHorizontal: space.readingMargin,
  },
});
