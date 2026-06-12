/**
 * QUIET-03 — designing the Stillness Switch: one weekly window of protected
 * rest, chosen once, defended by the app from then on. While it holds, the
 * veil covers everything except one line; the wind-down may run over it.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { STILLNESS_FLOW } from '../../flows/registry';
import { setStillness } from './quietRepo';

export const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export interface StillnessFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

export function StillnessFlow({ db, onExit }: StillnessFlowProps): React.JSX.Element {
  const [weekday, setWeekday] = useState(0);
  const [startHour, setStartHour] = useState('8');
  const [hours, setHours] = useState('3');

  return (
    <FlowHost
      flow={STILLNESS_FLOW}
      onExit={onExit}
      renderers={{
        weekday: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>
              One window a week, kept for stillness. Which day?
            </Text>
            {WEEKDAYS.map((name, i) =>
              i === 0 ? (
                <PrimaryAction
                  key={name}
                  label={name}
                  onPress={() => {
                    setWeekday(i);
                    api.advance();
                  }}
                />
              ) : (
                <QuietAction
                  key={name}
                  label={name}
                  onPress={() => {
                    setWeekday(i);
                    api.advance();
                  }}
                />
              ),
            )}
          </View>
        ),
        window: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>From which hour, and for how long?</Text>
            <Text style={styles.fieldLabel}>starting hour (0–23)</Text>
            <TextInput
              style={styles.field}
              value={startHour}
              onChangeText={setStartHour}
              keyboardType="numeric"
              accessibilityLabel="starting hour (0–23)"
              placeholderTextColor={color.stone}
            />
            <Text style={styles.fieldLabel}>hours of stillness</Text>
            <TextInput
              style={styles.field}
              value={hours}
              onChangeText={setHours}
              keyboardType="numeric"
              accessibilityLabel="hours of stillness"
              placeholderTextColor={color.stone}
            />
            <View style={styles.action}>
              <PrimaryAction
                label="keep this window"
                onPress={async () => {
                  await setStillness(db, {
                    weekday,
                    startHour: Number(startHour),
                    hours: Number(hours),
                  });
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        kept: (api) => (
          <TerminalScreen
            line="The window is kept. The app will defend it — you only have to arrive."
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
  fieldLabel: {
    ...type.body,
    color: color.stone,
    marginBottom: space.x1 / 2,
  },
  field: {
    ...type.body,
    color: color.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.mist,
    paddingVertical: space.x1,
    marginBottom: space.x3,
  },
  action: {
    marginTop: space.x2,
    alignItems: 'center',
  },
});
