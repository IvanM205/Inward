/**
 * LIB-01 — One Deep Thing: today's reading in book-like typesetting (serif,
 * generous margins, a visible end), the closing question, and the terminal:
 * now go live it. No related readings, no next, no archive door here.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Reading } from '../../core/content/readings';
import { PrimaryAction } from '../../core/design/Buttons';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { READING_FLOW } from '../../flows/registry';
import { t } from '../../core/content/strings';
import { logReadingRead } from './libraryRepo';

export interface ReadingFlowProps {
  db: SqlDatabase;
  reading: Reading;
  locale?: string;
  onExit: () => void;
}

export function ReadingFlow({ db, reading, locale = 'en', onExit }: ReadingFlowProps): React.JSX.Element {
  return (
    <FlowHost
      flow={READING_FLOW}
      onExit={onExit}
      renderers={{
        reading: (api) => (
          <View style={styles.screen}>
            <ScrollView bounces={false} contentContainerStyle={styles.page}>
              <Text style={styles.title}>{reading.title}</Text>
              <Text style={styles.author}>{reading.author}</Text>
              {reading.body.map((paragraph, i) => (
                <Text key={i} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
              <Text style={styles.closing}>{reading.closingQuestion}</Text>
              <View style={styles.action}>
                <PrimaryAction
                  label={t('reading.read', locale)}
                  onPress={async () => {
                    await logReadingRead(db, reading, new Date());
                    api.advance();
                  }}
                />
              </View>
            </ScrollView>
          </View>
        ),
        'live-it': (api) => <TerminalScreen line={t('reading.liveIt', locale)} onExit={api.exit} />,
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
  },
  page: {
    paddingHorizontal: space.readingMargin,
    paddingVertical: space.x6,
  },
  title: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x1,
  },
  author: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
    marginBottom: space.x4,
  },
  paragraph: {
    ...type.body,
    color: color.ink,
    marginBottom: space.x3,
  },
  closing: {
    ...type.body,
    color: color.stone,
    fontStyle: 'italic',
    marginTop: space.x2,
    marginBottom: space.x4,
  },
  action: {
    alignItems: 'center',
  },
});
