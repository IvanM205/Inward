/**
 * ONB-04 — the intake quiz mode. One question at a time, adaptively chosen;
 * every question skippable; "enough for now" pauses without losing anything
 * (resumable ≤ 14 days; the Mirror shows its waiting state meanwhile).
 * No progress bar, no count pressure — the quiz simply ends when it ends.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { IntakeQuestion } from '../../core/content/questionBank';
import { CASUALTY_OPTIONS } from '../../core/content/questionBank';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, touchTarget, type } from '../../core/design/tokens';
import { FlowHost, FlowScreenApi } from '../../core/navigation/FlowHost';
import { Casualty } from '../../core/scoring/config';
import { SqlDatabase } from '../../core/storage/ports';
import { setOnboardingState } from '../../core/storage/repos/profileRepo';
import { INTAKE_FLOW } from '../../flows/registry';
import { nextQuestion } from './adaptive';
import { allResponses, IntakeAnswer, saveAnswer, seenQuestionIds, skipQuestion } from './intakeRepo';

export const LIKERT_LABELS = ['never', 'rarely', 'sometimes', 'often', 'always'] as const;

export interface IntakeQuizFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

export function IntakeQuizFlow({ db, onExit }: IntakeQuizFlowProps): React.JSX.Element {
  const [question, setQuestion] = useState<IntakeQuestion | null | undefined>(undefined);
  const [hoursText, setHoursText] = useState('');
  const [picked, setPicked] = useState<Casualty[]>([]);

  const loadNext = async (): Promise<IntakeQuestion | null> => {
    const next = nextQuestion(await seenQuestionIds(db), await allResponses(db));
    setQuestion(next);
    setHoursText('');
    setPicked([]);
    return next;
  };

  useEffect(() => {
    setOnboardingState(db, 'intake_in_progress').then(loadNext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const settle = async (api: FlowScreenApi) => {
    if ((await loadNext()) === null) {
      await setOnboardingState(db, 'intake_done');
      api.advance('done');
    }
  };

  const answer = async (api: FlowScreenApi, value: IntakeAnswer) => {
    if (!question) return;
    await saveAnswer(db, question, value, new Date());
    await settle(api);
  };

  const skip = async (api: FlowScreenApi) => {
    if (!question) return;
    await skipQuestion(db, question, new Date());
    await settle(api);
  };

  return (
    <FlowHost
      flow={INTAKE_FLOW}
      onExit={onExit}
      renderers={{
        question: (api) => (
          <View style={styles.screen}>
            {question == null ? (
              <View />
            ) : (
              <>
                <Text style={styles.question} accessibilityRole="header">
                  {question.text}
                </Text>
                {question.type === 'hours' && (
                  <>
                    <TextInput
                      style={styles.hours}
                      value={hoursText}
                      onChangeText={setHoursText}
                      keyboardType="numeric"
                      placeholder="hours in a week"
                      placeholderTextColor={color.stone}
                      accessibilityLabel={question.text}
                    />
                    <PrimaryAction
                      label="go on"
                      disabled={Number.isNaN(Number(hoursText)) || hoursText.trim() === ''}
                      onPress={() =>
                        answer(api, { kind: 'hours', hoursPerWeek: Number(hoursText) })
                      }
                    />
                  </>
                )}
                {question.type === 'likert' &&
                  LIKERT_LABELS.map((label, value) => (
                    <QuietAction
                      key={label}
                      label={label}
                      onPress={() => answer(api, { kind: 'likert', value })}
                    />
                  ))}
                {question.type === 'casualties' && (
                  <>
                    {CASUALTY_OPTIONS.map((option) => {
                      const selected = picked.includes(option.key);
                      return (
                        <Pressable
                          key={option.key}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          accessibilityLabel={option.label}
                          onPress={() =>
                            setPicked(
                              selected
                                ? picked.filter((c) => c !== option.key)
                                : [...picked, option.key],
                            )
                          }
                          style={styles.casualty}>
                          <Text style={[styles.casualtyText, selected && styles.casualtyPicked]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <PrimaryAction
                      label="that is what it touched"
                      onPress={() => answer(api, { kind: 'casualties', casualties: picked })}
                    />
                  </>
                )}
                <View style={styles.quietRow}>
                  <QuietAction label="skip" onPress={() => skip(api)} />
                  <QuietAction label="enough for now" onPress={() => api.advance('paused')} />
                </View>
              </>
            )}
          </View>
        ),
        done: (api) => (
          <TerminalScreen
            line="The Mirror has what it needs. Go live — it will be ready when you return."
            onExit={api.exit}
          />
        ),
        paused: (api) => (
          <TerminalScreen
            line="Nothing is lost. The Mirror waits as long as you need."
            onExit={api.exit}
          />
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
  hours: {
    ...type.body,
    color: color.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.mist,
    paddingVertical: space.x1,
    marginBottom: space.x3,
  },
  casualty: {
    minHeight: touchTarget,
    justifyContent: 'center',
  },
  casualtyText: {
    ...type.body,
    color: color.stone,
  },
  casualtyPicked: {
    color: color.ink,
    textDecorationLine: 'underline',
  },
  quietRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.x4,
  },
});
