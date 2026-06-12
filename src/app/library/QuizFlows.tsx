/**
 * LIB-04 — the quizzes. Values: what you say matters, held next to what
 * received your hours this week — the gap written with mercy, ending in one
 * suggested step, never a pitch. Funnel: five channel-free questions and a
 * coarse phrase, the product's only shareable artifact (opt-in; the share
 * sheet itself rides the native bridges).
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, touchTarget, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { setChosenValues } from '../../core/storage/repos/profileRepo';
import { FUNNEL_QUIZ_FLOW, VALUES_QUIZ_FLOW } from '../../flows/registry';
import { FUNNEL_QUESTIONS, funnelQuestionText, funnelResultCopy, funnelVerdict } from './funnel';
import { t } from '../../core/content/strings';

/** The canonical values list (03 §Profile). */
export const CANONICAL_VALUES = [
  'love',
  'family',
  'compassion',
  'friendship',
  'home',
  'nature',
  'kindness',
  'empathy',
  'craft',
  'faith',
  'health',
];

const LIKERT = ['never', 'rarely', 'sometimes', 'often', 'always'] as const;

function PickList({
  options,
  picked,
  onToggle,
}: {
  options: string[];
  picked: string[];
  onToggle: (value: string) => void;
}): React.JSX.Element {
  return (
    <View>
      {options.map((value) => {
        const selected = picked.includes(value);
        return (
          <Pressable
            key={value}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={value}
            onPress={() => onToggle(value)}
            style={styles.pick}>
            <Text style={[styles.pickText, selected && styles.pickSelected]}>{value}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export interface ValuesQuizFlowProps {
  db: SqlDatabase;
  locale?: string;
  onExit: () => void;
}

export function ValuesQuizFlow({ db, locale = 'en', onExit }: ValuesQuizFlowProps): React.JSX.Element {
  const [stated, setStated] = useState<string[]>([]);
  const [lived, setLived] = useState<string[]>([]);
  const toggle = (list: string[], set: (v: string[]) => void) => (value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const unlived = stated.filter((v) => !lived.includes(v));

  return (
    <FlowHost
      flow={VALUES_QUIZ_FLOW}
      onExit={onExit}
      renderers={{
        stated: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>{t('quiz.statedQuestion', locale)}</Text>
            <PickList options={CANONICAL_VALUES} picked={stated} onToggle={toggle(stated, setStated)} />
            <View style={styles.action}>
              <PrimaryAction
                label={t('quiz.statedDone', locale)}
                disabled={stated.length === 0}
                onPress={async () => {
                  await setChosenValues(db, stated); // 03 §Profile.chosen_values
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        lived: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>
              {t('quiz.livedQuestion', locale)}
            </Text>
            <PickList options={stated} picked={lived} onToggle={toggle(lived, setLived)} />
            <View style={styles.action}>
              <PrimaryAction label={t('quiz.livedDone', locale)} onPress={() => api.advance()} />
            </View>
          </View>
        ),
        gap: (api) => (
          <View style={styles.screen}>
            {/* The gap, with mercy: no verdict, one observation (LIB-04). */}
            <Text style={styles.question}>
              {unlived.length === 0
                ? 'What you say and what you live are close together this week. Keep them close.'
                : `Some of what you love waited this week: ${unlived.join(', ')}. Not a failing — a direction.`}
            </Text>
            <View style={styles.action}>
              <PrimaryAction label={t('common.iSeeIt', locale)} onPress={() => api.advance()} />
            </View>
          </View>
        ),
        step: (api) => (
          <TerminalScreen
            line={
              unlived.length === 0
                ? 'Then nothing needs fixing. Go be with it.'
                : `Give ${unlived[0]} one unhurried hour this week. That is the whole step.`
            }
            onExit={api.exit}
          />
        ),
      }}
    />
  );
}

export interface FunnelQuizFlowProps {
  locale?: string;
  onExit: () => void;
}

export function FunnelQuizFlow({ locale = 'en', onExit }: FunnelQuizFlowProps): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  return (
    <FlowHost
      flow={FUNNEL_QUIZ_FLOW}
      onExit={onExit}
      renderers={{
        questions: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>{funnelQuestionText(index, locale)}</Text>
            {LIKERT.map((label, value) => (
              <QuietAction
                key={label}
                label={t(`likert.${label}` as never, locale)}
                onPress={() => {
                  const next = [...answers, value];
                  if (next.length === FUNNEL_QUESTIONS.length) {
                    setAnswers(next);
                    api.advance();
                  } else {
                    setAnswers(next);
                    setIndex(index + 1);
                  }
                }}
              />
            ))}
          </View>
        ),
        result: (api) => {
          const copy = funnelResultCopy(funnelVerdict(answers), locale);
          return <TerminalScreen line={`${copy.line} ${copy.nextStep}`} onExit={api.exit} />;
        },
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
    marginBottom: space.x3,
  },
  pick: {
    minHeight: touchTarget,
    justifyContent: 'center',
  },
  pickText: {
    ...type.body,
    color: color.stone,
  },
  pickSelected: {
    color: color.ink,
    textDecorationLine: 'underline',
  },
  action: {
    marginTop: space.x3,
    alignItems: 'center',
  },
});
