/**
 * THR-04 — Today's Opening: exactly one act a day from the active thread,
 * finishable today. For now the act is the thread's micro-act; dares,
 * practices, and people-to-reach join the rotation with the M3 content work.
 * Completing writes Evidence (a care entry on the thread's channel) and ends
 * in a terminal screen. Leaving it costs nothing and is said kindly (INV-7).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { localDateKey } from '../../core/storage/time';
import { OPENING_FLOW } from '../../flows/registry';
import { addEntry } from '../journal/journalRepo';
import { markOpeningDone, Thread } from './threadRepo';

export interface OpeningFlowProps {
  db: SqlDatabase;
  thread: Thread;
  onExit: () => void;
}

export function OpeningFlow({ db, thread, onExit }: OpeningFlowProps): React.JSX.Element {
  return (
    <FlowHost
      flow={OPENING_FLOW}
      onExit={onExit}
      renderers={{
        act: (api) => (
          <View style={styles.screen}>
            <Text style={styles.label}>today’s opening</Text>
            <Text style={styles.act}>{thread.microAct}</Text>
            <View style={styles.actions}>
              <PrimaryAction
                label="done — it happened"
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
                  api.advance('done');
                }}
              />
              <QuietAction label="not today" onPress={() => api.advance('left')} />
            </View>
          </View>
        ),
        done: (api) => (
          <TerminalScreen line="It counts because it happened. Go on with your day." onExit={api.exit} />
        ),
        left: (api) => (
          <TerminalScreen line="The opening waits, without keeping score." onExit={api.exit} />
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
