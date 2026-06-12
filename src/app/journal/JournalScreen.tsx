/**
 * The Living Journal, read back (JRN-04/05): the person's own words, newest
 * first, searchable, with a visible end — "the beginning" is a line you can
 * reach, not a fiction. Entries that did not count are marked gently:
 * written for the soul, not the score. Nothing here is content; it is a
 * life, finite by nature (INV-1 needs no cap that the truth provides).
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { t } from '../../core/content/strings';
import { QuietAction } from '../../core/design/Buttons';
import { color, space, type } from '../../core/design/tokens';
import { SqlDatabase } from '../../core/storage/ports';
import { JournalEntry, recentEntries, searchEntries } from './journalRepo';

export interface JournalScreenProps {
  db: SqlDatabase;
  locale?: string;
  onClose: () => void;
}

export function JournalScreen({ db, locale = 'en', onClose }: JournalScreenProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    const search = query.trim();
    (search.length > 0 ? searchEntries(db, search) : recentEntries(db)).then(setEntries);
  }, [db, query]);

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={t('journal.search', locale)}
        placeholderTextColor={color.stone}
        accessibilityLabel={t('journal.search', locale)}
      />
      <ScrollView bounces={false}>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.entry}>
            <Text style={styles.date}>
              {`${entry.createdAt.slice(0, 10)} · ${entry.type.replace('_', ' ')}`}
            </Text>
            <Text style={styles.text}>{entry.text}</Text>
            {!entry.counted && <Text style={styles.soul}>{t('journal.soulNotScore', locale)}</Text>}
          </View>
        ))}
        <Text style={styles.end}>
          {entries.length === 0 ? t('journal.empty', locale) : t('journal.beginning', locale)}
        </Text>
      </ScrollView>
      <View style={styles.close}>
        <QuietAction label={t('common.backToThreshold', locale)} onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
    paddingTop: space.x6,
    paddingHorizontal: space.readingMargin,
  },
  search: {
    ...type.body,
    color: color.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.mist,
    paddingVertical: space.x1,
    marginBottom: space.x3,
  },
  entry: {
    marginBottom: space.x3,
  },
  date: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
    marginBottom: space.x1 / 2,
  },
  text: {
    ...type.body,
    color: color.ink,
  },
  soul: {
    ...type.label,
    color: color.stone,
    marginTop: space.x1 / 2,
  },
  end: {
    ...type.label,
    color: color.stone,
    textAlign: 'center',
    textTransform: 'uppercase',
    paddingVertical: space.x4,
  },
  close: {
    alignItems: 'center',
    paddingVertical: space.x2,
  },
});
