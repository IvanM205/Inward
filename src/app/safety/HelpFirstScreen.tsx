/**
 * The help-first screen (SAFE-02..04): kind plain words, real people first,
 * the product second. It pauses whatever flow triggered it; the person may
 * continue when ready — the screen is never withheld and never blocks.
 * No diagnosis, no verdict, no confidentiality promises on others' behalf.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction } from '../../core/design/Buttons';
import { color, space, type } from '../../core/design/tokens';
import { t } from '../../core/content/strings';
import { helpResources } from '../../core/safety/resources';

export interface HelpFirstScreenProps {
  locale: string;
  /** The person decides when to go on (SAFE-02). */
  onContinue: () => void;
}

export function HelpFirstScreen({ locale, onContinue }: HelpFirstScreenProps): React.JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.lead} accessibilityRole="header">
        {t('help.lead', locale)}
      </Text>
      {helpResources(locale).map((r) => (
        <View key={r.name} style={styles.resource}>
          <Text style={styles.name}>{r.name}</Text>
          <Text style={styles.contact}>{r.contact}</Text>
          <Text style={styles.note}>{r.note}</Text>
        </View>
      ))}
      <Text style={styles.footer}>
        {t('help.footer', locale)}
      </Text>
      <View style={styles.action}>
        <PrimaryAction label={t('help.continue', locale)} onPress={onContinue} />
      </View>
    </View>
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
  resource: {
    marginBottom: space.x3,
  },
  name: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
  },
  contact: {
    ...type.body,
    color: color.ink,
  },
  note: {
    ...type.body,
    color: color.stone,
  },
  footer: {
    ...type.body,
    color: color.stone,
    marginTop: space.x2,
  },
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
