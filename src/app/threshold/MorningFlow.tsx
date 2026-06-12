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
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { markMorningDone } from '../../core/storage/repos/profileRepo';
import { localDateKey } from '../../core/storage/time';
import { MORNING_FLOW } from '../../flows/registry';

export const MORNING_QUESTION = 'What will you give your attention to today?';

export interface MorningFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

export function MorningFlow({ db, onExit }: MorningFlowProps): React.JSX.Element {
  const [answer, setAnswer] = useState('');
  return (
    <FlowHost
      flow={MORNING_FLOW}
      onExit={onExit}
      renderers={{
        question: (api) => (
          <View style={styles.screen}>
            <QuestionCard
              question={MORNING_QUESTION}
              value={answer}
              onChange={setAnswer}
              placeholder="one line, or one word"
            />
            <View style={styles.action}>
              <PrimaryAction label="go on" onPress={() => api.advance()} />
            </View>
          </View>
        ),
        opening: (api) => (
          <View style={styles.screen}>
            <Text style={styles.openingLabel}>today’s opening</Text>
            <Text style={styles.openingLine}>
              No thread is being loosened yet. Today is open — give it to what
              you just named.
            </Text>
            <View style={styles.action}>
              <PrimaryAction
                label="i will"
                onPress={async () => {
                  await markMorningDone(db, localDateKey(new Date()));
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        'go-live': (api) => (
          <TerminalScreen line="Now go give it your attention." onExit={api.exit} />
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
