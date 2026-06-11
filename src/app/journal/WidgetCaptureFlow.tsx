/**
 * JRN-03 — in-the-moment capture: the widget deep-links straight here, one
 * line goes into the Living Journal as an aliveness entry, and the app
 * releases the user. Voice input (transcribed on-device, audio discarded)
 * rides the native widget bridge when it lands.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PrimaryAction } from '../../core/design/Buttons';
import { JournalPrompt } from '../../core/design/JournalPrompt';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { WIDGET_CAPTURE_FLOW } from '../../flows/registry';
import { addEntry } from './journalRepo';

export const CAPTURE_PROMPT = 'What is alive right now?';

export interface WidgetCaptureFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

export function WidgetCaptureFlow({ db, onExit }: WidgetCaptureFlowProps): React.JSX.Element {
  const [text, setText] = useState('');
  return (
    <FlowHost
      flow={WIDGET_CAPTURE_FLOW}
      onExit={onExit}
      renderers={{
        capture: (api) => (
          <View style={styles.screen}>
            <JournalPrompt prompt={CAPTURE_PROMPT} value={text} onChange={setText} />
            <View style={styles.action}>
              <PrimaryAction
                label="keep it"
                onPress={async () => {
                  const line = text.trim();
                  if (line.length > 0) {
                    await addEntry(
                      db,
                      { type: 'aliveness', text: line, channelKeys: [], origin: 'widget' },
                      new Date(),
                    );
                  }
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        kept: (api) => <TerminalScreen line="Kept. Now stay with it." onExit={api.exit} />,
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
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
