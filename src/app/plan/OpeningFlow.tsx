/**
 * THR-04 — Today's Opening: exactly one act a day from the active thread,
 * finishable today. For now the act is the thread's micro-act; dares,
 * practices, and people-to-reach join the rotation with the M3 content work.
 * Completing writes Evidence (a care entry on the thread's channel) and ends
 * in a terminal screen. Leaving it costs nothing and is said kindly (INV-7).
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { DareCard } from '../../core/design/DareCard';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { localDateKey } from '../../core/storage/time';
import { localizedDareText } from '../../core/content/dareTemplates';
import { t } from '../../core/content/strings';
import { OPENING_FLOW } from '../../flows/registry';
import { addEntry } from '../journal/journalRepo';
import { completeDare, Dare, dueDare, skipDare } from './dareRepo';
import { markOpeningDone, Thread } from './threadRepo';

export interface OpeningFlowProps {
  db: SqlDatabase;
  thread: Thread;
  locale?: string;
  /**
   * `completed` is true only when the act actually happened — the host's
   * ask rules depend on the difference (OPEN-02: a skipped opening is not
   * a good moment).
   */
  onExit: (completed: boolean) => void;
}

export function OpeningFlow({ db, thread, locale = 'en', onExit }: OpeningFlowProps): React.JSX.Element {
  // THR-04: the one act is a dare when one is due (roughly weekly), else the
  // daily micro-act. undefined = still deciding.
  const [dare, setDare] = useState<Dare | null | undefined>(undefined);
  const [feeling, setFeeling] = useState('');
  const completed = useRef(false);

  useEffect(() => {
    dueDare(db, thread.id, new Date()).then(setDare);
  }, [db, thread.id]);

  return (
    <FlowHost
      flow={OPENING_FLOW}
      onExit={() => onExit(completed.current)}
      renderers={{
        act: (api) =>
          dare === undefined ? (
            <View style={styles.screen} />
          ) : dare !== null ? (
            <View style={styles.screen}>
              <DareCard
                locale={locale}
                rung={dare.rung}
                text={localizedDareText(thread.channelKey, dare.rung, dare.text, dare.source, locale)}
                feeling={feeling}
                onFeelingChange={setFeeling}
                onDone={async () => {
                  const now = new Date();
                  await completeDare(db, dare, thread, feeling, now); // dare_done Evidence
                  await markOpeningDone(db, localDateKey(now));
                  completed.current = true;
                  api.advance('done');
                }}
                onNotToday={async () => {
                  await skipDare(db, dare, new Date()); // the ladder waits (INV-7)
                  api.advance('left');
                }}
              />
            </View>
          ) : (
            <View style={styles.screen}>
              <Text style={styles.label}>{t('morning.openingLabel', locale)}</Text>
              <Text style={styles.act}>{thread.microAct}</Text>
              <View style={styles.actions}>
                <PrimaryAction
                  label={t('opening.done', locale)}
                  onPress={async () => {
                    const now = new Date();
                    // Evidence: the act done instead of the old routine (04 §2.1).
                    await addEntry(
                      db,
                      {
                        type: 'care',
                        text: thread.microAct ?? 'the daily act',
                        channelKeys: [thread.channelKey],
                        origin: 'auto',
                      },
                      now,
                    );
                    await markOpeningDone(db, localDateKey(now));
                    completed.current = true;
                    api.advance('done');
                  }}
                />
                <QuietAction label={t('opening.notToday', locale)} onPress={() => api.advance('left')} />
              </View>
            </View>
          ),
        done: (api) => (
          <TerminalScreen line={t('opening.doneTerminal', locale)} onExit={api.exit} />
        ),
        left: (api) => (
          <TerminalScreen line={t('opening.leftTerminal', locale)} onExit={api.exit} />
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
    paddingHorizontal: space.readingMargin,
  },
  label: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
    marginBottom: space.x2,
  },
  act: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x6,
  },
  actions: {
    alignItems: 'center',
  },
});
