/**
 * The button rulebook (06 §Components):
 * - primary action = bronze TEXT button, never a filled attention block;
 * - "not now" / "skip" is ALWAYS visually equal in size to "yes";
 * - max one bronze use per screen — so PrimaryAction must appear at most once.
 */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { color, touchTarget, type } from './tokens';

interface ActionProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/** The screen's single primary action. Bronze text, quiet. */
export function PrimaryAction({ label, onPress, disabled }: ActionProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}>
      <Text style={[styles.label, styles.primary, disabled && styles.disabled]}>{label}</Text>
    </Pressable>
  );
}

/** "Not now" / "skip" — same size, same weight, only quieter ink (06 §Components). */
export function QuietAction({ label, onPress, disabled }: ActionProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}>
      <Text style={[styles.label, styles.quiet, disabled && styles.disabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    minWidth: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.6 },
  // Identical typography for both — equality is the design rule, not a styling accident.
  label: { ...type.body, textAlign: 'center' },
  primary: { color: color.bronze },
  quiet: { color: color.stone },
  disabled: { color: color.mist },
});
