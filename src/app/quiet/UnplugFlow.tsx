/**
 * QUIET-01 — Unplug Mode: one tap on a duration (1–4 h, default 2) and the
 * app goes dark except one line. The window ends silently; reopening the app
 * while it runs lands on the veil (the host checks quietRepo). OS focus-mode
 * integration arrives with the native bridges.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { QuietVeil } from '../../core/design/QuietVeil';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { UNPLUG_FLOW } from '../../flows/registry';
import { startUnplug, UNPLUG_DEFAULT_HOURS } from './quietRepo';

export const VEIL_LINE = 'Unplugged. The world is on.';

const CHOICES = [1, 2, 3, 4];

export interface UnplugFlowProps {
  db: SqlDatabase;
  onExit: () => void;
  /** Door to designing the weekly stillness window (QUIET-03). */
  onDesignStillness?: () => void;
}

export function UnplugFlow({ db, onExit, onDesignStillness }: UnplugFlowProps): React.JSX.Element {
  const choose = (api: { advance: () => void }) => async (hours: number) => {
    await startUnplug(db, hours, new Date());
    api.advance();
  };

  return (
    <FlowHost
      flow={UNPLUG_FLOW}
      onExit={onExit}
      renderers={{
        choose: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>How long do you want to be gone?</Text>
            <View style={styles.choices}>
              {CHOICES.map((hours) =>
                hours === UNPLUG_DEFAULT_HOURS ? (
                  <PrimaryAction
                    key={hours}
                    label={`${hours} hours`}
                    onPress={() => choose(api)(hours)}
                  />
                ) : (
                  <QuietAction
                    key={hours}
                    label={hours === 1 ? '1 hour' : `${hours} hours`}
                    onPress={() => choose(api)(hours)}
                  />
                ),
              )}
            </View>
            {onDesignStillness && (
              <View style={styles.stillness}>
                <QuietAction label="design the stillness window" onPress={onDesignStillness} />
              </View>
            )}
          </View>
        ),
        veil: (api) => <QuietVeil line={VEIL_LINE} onLeave={api.exit} />,
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
    textAlign: 'center',
    marginBottom: space.x4,
  },
  choices: {
    alignItems: 'center',
    gap: space.x1,
  },
  stillness: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
