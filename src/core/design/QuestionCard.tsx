/**
 * QuestionCard — one serif question, one input (06 §Components).
 * M0 ships the 'line' input; 'word-pick' and 'spectrum' variants land with the
 * flows that need them (THR-02 word answer, THR-03 SpectrumSlider).
 */
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { color, space, type } from './tokens';

export interface QuestionCardProps {
  question: string;
  value: string;
  onChange: (text: string) => void;
  /** One line is invited; longer is allowed, never asked for (JRN mechanics). */
  placeholder?: string;
}

export function QuestionCard({ question, value, onChange, placeholder }: QuestionCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.question} accessibilityRole="header">
        {question}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={color.stone}
        multiline
        accessibilityLabel={question}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: space.readingMargin,
    paddingVertical: space.x3,
    backgroundColor: color.paper,
  },
  question: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x3,
  },
  input: {
    ...type.body,
    color: color.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.mist,
    paddingVertical: space.x1,
  },
});
