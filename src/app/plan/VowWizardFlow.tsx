/**
 * PLAN-02 — the thread setup wizard. Five quiet steps, all in the person's
 * own words: the cue, the old routine, what it gave them (the loop's reward,
 * named honestly), the when–then vow, and a micro-act under five minutes.
 * The dare ladder is picked separately (templates arrive with the content
 * work). Ends, like everything, in a terminal screen.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction } from '../../core/design/Buttons';
import { QuestionCard } from '../../core/design/QuestionCard';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost, FlowScreenApi } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { VOW_FLOW } from '../../flows/registry';
import { seedLadder } from './dareRepo';
import { activeThread, setMicroAct, setReplacementHabit } from './threadRepo';

export interface VowWizardFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

const STEPS = {
  cue: {
    question: 'When does the pull usually find you?',
    placeholder: 'in bed, after dinner, the moment I wake…',
  },
  routine: {
    question: 'And what happens then — the old routine?',
    placeholder: 'I open the feed and an hour disappears…',
  },
  'what-it-gives': {
    question: 'Be honest: what does it give you?',
    placeholder: 'a rest from thinking, company, numbness…',
  },
  vow: {
    question: 'Now the vow — when the cue comes, what will you do instead?',
    placeholder: 'When I reach for my phone in bed, I will open the book on my nightstand.',
  },
  'micro-act': {
    question: 'And the smallest daily act — under five minutes, doable on your worst day?',
    placeholder: 'one page, one stretch, one message to a friend…',
  },
} as const;

type StepId = keyof typeof STEPS;

export function VowWizardFlow({ db, onExit }: VowWizardFlowProps): React.JSX.Element {
  const [answers, setAnswers] = useState<Record<StepId, string>>({
    cue: '',
    routine: '',
    'what-it-gives': '',
    vow: '',
    'micro-act': '',
  });

  const step = (id: StepId, api: FlowScreenApi, onDone?: () => Promise<void>) => (
    <View style={styles.screen}>
      <QuestionCard
        question={STEPS[id].question}
        value={answers[id]}
        onChange={(text) => setAnswers({ ...answers, [id]: text })}
        placeholder={STEPS[id].placeholder}
      />
      <View style={styles.action}>
        <PrimaryAction
          label="go on"
          disabled={answers[id].trim().length === 0}
          onPress={async () => {
            await onDone?.();
            api.advance();
          }}
        />
      </View>
    </View>
  );

  return (
    <FlowHost
      flow={VOW_FLOW}
      onExit={onExit}
      renderers={{
        cue: (api) => step('cue', api),
        routine: (api) => step('routine', api),
        'what-it-gives': (api) => step('what-it-gives', api),
        vow: (api) => (
          <View style={styles.screen}>
            <Text style={styles.loopEcho}>
              When {answers.cue.trim()} — instead of {answers.routine.trim()} —
            </Text>
            {step('vow', api, async () =>
              setReplacementHabit(db, {
                cue: answers.cue.trim(),
                routine: answers.routine.trim(),
                reward: answers['what-it-gives'].trim(),
                vowText: answers.vow.trim(),
              }),
            )}
          </View>
        ),
        'micro-act': (api) =>
          step('micro-act', api, async () => {
            await setMicroAct(db, answers['micro-act'].trim());
            // PLAN-02: the 7-rung ladder, seeded from templates; editing and
            // custom dares arrive with the Companion (M4).
            const thread = await activeThread(db);
            if (thread) await seedLadder(db, thread);
          }),
        held: (api) => (
          <TerminalScreen line="The vow is made. Go live it once, today." onExit={api.exit} />
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
  loopEcho: {
    ...type.label,
    color: color.stone,
    paddingHorizontal: space.readingMargin,
    marginBottom: space.x1,
  },
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
