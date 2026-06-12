/**
 * DareCard (06 §Components): rung number, the dare, and a single
 * "done — how did it feel?" affordance. No chain of rungs shown, no
 * progress bar — one challenge, whole.
 */
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryAction, QuietAction } from './Buttons';
import { color, space, type } from './tokens';

export interface DareCardProps {
  rung: number;
  text: string;
  feeling: string;
  onFeelingChange: (text: string) => void;
  /** The single affordance: done, with the feeling answer (may be empty). */
  onDone: () => void;
  onNotToday: () => void;
}

export function DareCard({
  rung,
  text,
  feeling,
  onFeelingChange,
  onDone,
  onNotToday,
}: DareCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.rung}>{`dare · rung ${rung} of 7`}</Text>
      <Text style={styles.text}>{text}</Text>
      <TextInput
        style={styles.feeling}
        value={feeling}
        onChangeText={onFeelingChange}
        placeholder="done — how did it feel?"
        placeholderTextColor={color.stone}
        accessibilityLabel="done — how did it feel?"
      />
      <View style={styles.actions}>
        <PrimaryAction label="it is done" onPress={onDone} />
        <QuietAction label="not today" onPress={onNotToday} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: space.readingMargin,
  },
  rung: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
    marginBottom: space.x2,
  },
  text: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x4,
  },
  feeling: {
    ...type.body,
    color: color.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.mist,
    paddingVertical: space.x1,
    marginBottom: space.x3,
  },
  actions: {
    alignItems: 'center',
  },
});
