/**
 * JournalPrompt — one evening-fold prompt and a one-line invitation
 * (06 §Components, JRN-02). Answering is optional by design: any, all, or
 * none. The mic affordance (on-device transcription, JRN-03) arrives with the
 * native voice bridge; the counted/uncounted gentle marking is JRN-04 (M2).
 */
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { color, space, type } from './tokens';

export interface JournalPromptProps {
  prompt: string;
  value: string;
  onChange: (text: string) => void;
}

export function JournalPrompt({ prompt, value, onChange }: JournalPromptProps): React.JSX.Element {
  return (
    <View style={styles.block}>
      <Text style={styles.prompt}>{prompt}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="one sentence, if you wish"
        placeholderTextColor={color.stone}
        accessibilityLabel={prompt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: space.x3,
  },
  prompt: {
    ...type.body,
    color: color.ink,
    marginBottom: space.x1,
  },
  input: {
    ...type.body,
    color: color.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.mist,
    paddingVertical: space.x1,
  },
});
