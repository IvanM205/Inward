/**
 * PLAN-03 — the phone-redesign checklist: four honest instructions, each a
 * toggle, all optional. "That is enough" keeps what was done and retires the
 * door for good — stored, never nagged.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryAction } from '../../core/design/Buttons';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, touchTarget, type } from '../../core/design/tokens';
import { t } from '../../core/content/strings';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { REDESIGN_FLOW } from '../../flows/registry';
import {
  markRedesignStep,
  REDESIGN_STEPS,
  RedesignStepKey,
  redesignState,
  retireRedesign,
} from './redesignRepo';

export interface RedesignFlowProps {
  db: SqlDatabase;
  locale?: string;
  onExit: () => void;
}

export function RedesignFlow({ db, locale = 'en', onExit }: RedesignFlowProps): React.JSX.Element {
  const [done, setDone] = useState<Partial<Record<RedesignStepKey, boolean>>>({});

  useEffect(() => {
    redesignState(db).then((state) => setDone(state.done));
  }, [db]);

  return (
    <FlowHost
      flow={REDESIGN_FLOW}
      onExit={onExit}
      renderers={{
        checklist: (api) => (
          <View style={styles.screen}>
            <Text style={styles.lead}>
              {t('redesign.lead', locale)}
            </Text>
            {REDESIGN_STEPS.map((step) => {
              const checked = done[step.key] === true;
              return (
                <Pressable
                  key={step.key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={step.text}
                  onPress={async () => {
                    const next = !checked;
                    setDone({ ...done, [step.key]: next });
                    await markRedesignStep(db, step.key, next);
                  }}
                  style={styles.step}>
                  <Text style={[styles.stepText, checked && styles.stepDone]}>{step.text}</Text>
                </Pressable>
              );
            })}
            <View style={styles.action}>
              <PrimaryAction
                label={t('redesign.enough', locale)}
                onPress={async () => {
                  await retireRedesign(db);
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        enough: (api) => (
          <TerminalScreen
            line={t('redesign.terminal', locale)}
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
  lead: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x4,
  },
  step: {
    minHeight: touchTarget,
    justifyContent: 'center',
    marginBottom: space.x1,
  },
  stepText: {
    ...type.body,
    color: color.stone,
  },
  stepDone: {
    color: color.ink,
    textDecorationLine: 'line-through',
  },
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
