/**
 * ONB-03 — the honest permissions screen. Two asks, each individually
 * refusable; refusal degrades nothing except the signal that needed it. No
 * other permission is requested anywhere in v1. The OS remains the source of
 * truth for what was granted — we store nothing about it (least data).
 *
 * Asked one at a time: each ask has one bronze "yes" and an equal "not now"
 * (max one bronze per screen, 06 §Color; equality rule, 06 §Components).
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { color, space, type } from '../../core/design/tokens';
import { t } from '../../core/content/strings';

/** Native permission requests — implemented over OS APIs by the host (M1). */
export interface PermissionRequests {
  requestNotifications(): Promise<boolean>;
  requestScreenTime(): Promise<boolean>;
}

export interface PermissionsScreenProps {
  permissions: PermissionRequests;
  locale?: string;
  onDone: () => void;
}

const ASKS = [
  {
    key: 'notifications' as const,
    title: 'Two quiet lines a day',
    body:
      'Inward can remind you of the morning and evening compass — at most two ' +
      'notifications a day, silent, and you can turn each one off any time. ' +
      'Nothing else will ever notify you.',
  },
  {
    key: 'screenTime' as const,
    title: 'Seeing your screen time',
    body:
      'If you allow it, the Mirror can use your real screen time instead of ' +
      'guesses. It stays on this device. Saying no only means the Mirror ' +
      'relies on what you tell it.',
  },
];

export function PermissionsScreen({ permissions, locale = 'en', onDone }: PermissionsScreenProps): React.JSX.Element {
  const [step, setStep] = useState(0);
  const ask = ASKS[step];

  const next = () => {
    if (step + 1 < ASKS.length) setStep(step + 1);
    else onDone();
  };

  const accept = async () => {
    if (ask.key === 'notifications') await permissions.requestNotifications();
    else await permissions.requestScreenTime();
    next();
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        {ask.title}
      </Text>
      <Text style={styles.body}>{ask.body}</Text>
      <View style={styles.actions}>
        <PrimaryAction label={t('perm.yes', locale)} onPress={accept} />
        <QuietAction label={t('perm.notNow', locale)} onPress={next} />
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
  title: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x3,
  },
  body: {
    ...type.body,
    color: color.stone,
    marginBottom: space.x6,
  },
  actions: {
    alignItems: 'center',
    gap: space.x1,
  },
});
