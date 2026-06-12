/**
 * CRAVE-01..03 — the Craving Button. The whole flow is under three minutes,
 * every step skippable, and nothing here ever blocks the phone: the person
 * is free to leave at any screen via the terminal exits of the OS.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { JournalPrompt } from '../../core/design/JournalPrompt';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost, FlowScreenApi } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { CRAVING_FLOW } from '../../flows/registry';
import { BreathScreen } from '../onboarding/BreathScreen';
import { Thread } from '../plan/threadRepo';
import { recordCraving } from './cravingRepo';
import { Hunger, HUNGERS, suggestAction } from './suggestions';

/** 90 s of 4-6 breathing, animation only (CRAVE-02). */
export const CRAVING_BREATH_MS = 90_000;

export interface CravingFlowProps {
  db: SqlDatabase;
  /** The active thread, if any — names the channel the craving belongs to. */
  thread: Thread | null;
  onExit: () => void;
}

export function CravingFlow({ db, thread, onExit }: CravingFlowProps): React.JSX.Element {
  const [hunger, setHunger] = useState<Hunger>('unsure');
  const [suggested, setSuggested] = useState('');
  const [actionTaken, setActionTaken] = useState(false);
  const [note, setNote] = useState('');

  const pickHunger = (api: FlowScreenApi) => (key: Hunger) => {
    setHunger(key);
    setSuggested(suggestAction(key, new Date()));
    api.advance();
  };

  const finish = async (api: FlowScreenApi) => {
    await recordCraving(
      db,
      {
        channelKey: thread?.channelKey ?? null,
        hunger,
        actionSuggested: suggested,
        actionTaken,
        note: note.trim() || null,
      },
      new Date(),
    );
    api.advance();
  };

  return (
    <FlowHost
      flow={CRAVING_FLOW}
      onExit={onExit}
      renderers={{
        breath: (api) => (
          <BreathScreen durationMs={CRAVING_BREATH_MS} onDone={() => api.advance()} />
        ),
        hunger: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>What are you actually hungry for?</Text>
            {HUNGERS.map(({ key, label }) => (
              <QuietAction key={key} label={label} onPress={() => pickHunger(api)(key)} />
            ))}
          </View>
        ),
        action: (api) => (
          <View style={styles.screen}>
            <Text style={styles.suggestion}>{suggested}</Text>
            <View style={styles.actions}>
              <PrimaryAction
                label="i’ll do it"
                onPress={() => {
                  setActionTaken(true);
                  api.advance();
                }}
              />
              <QuietAction label="not this one" onPress={() => api.advance()} />
            </View>
          </View>
        ),
        note: (api) => (
          <View style={styles.screen}>
            <JournalPrompt
              prompt="A line about it, if you wish."
              value={note}
              onChange={setNote}
            />
            <View style={styles.actions}>
              <PrimaryAction label="done" onPress={() => finish(api)} />
            </View>
          </View>
        ),
        decoded: (api) => (
          <TerminalScreen line="The hunger was real. The feed was not the food. Go." onExit={api.exit} />
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
  question: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x4,
  },
  suggestion: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x6,
  },
  actions: {
    marginTop: space.x2,
    alignItems: 'center',
  },
});
