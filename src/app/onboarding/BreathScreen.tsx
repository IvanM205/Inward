/**
 * ONB-01 — the first thing a person ever sees: a black screen and one guided
 * breath, 4 s in / 6 s out (06 §Motion). Nothing is tappable until the breath
 * completes; a subtle skip appears after 3 s. No permission prompts before it.
 * The first asked action of the whole product is one breath (01 §users).
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { QuietAction } from '../../core/design/Buttons';
import { color, motion, space, type } from '../../core/design/tokens';

export const BREATH_TOTAL_MS = motion.breathInMs + motion.breathOutMs;
export const SKIP_AVAILABLE_AFTER_MS = 3000;

export interface BreathScreenProps {
  /** The breath is complete (or skipped) — the flow may move on. */
  onDone: () => void;
}

export function BreathScreen({ onDone }: BreathScreenProps): React.JSX.Element {
  const scale = useRef(new Animated.Value(0.55)).current;
  const [skippable, setSkippable] = useState(false);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) {
        scale.setValue(1); // stillness instead of motion (06 §Motion)
        return;
      }
      animation = Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: motion.breathInMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.55,
          duration: motion.breathOutMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);
      animation.start();
    });
    return () => animation?.stop();
  }, [scale]);

  useEffect(() => {
    const skipTimer = setTimeout(() => setSkippable(true), SKIP_AVAILABLE_AFTER_MS);
    const doneTimer = setTimeout(onDone, BREATH_TOTAL_MS);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[styles.pulse, { transform: [{ scale }] }]}
        accessibilityLabel="One slow breath — four seconds in, six seconds out"
      />
      <Text style={styles.invitation} accessibilityRole="text">
        breathe in… and out
      </Text>
      <View style={styles.skipArea}>
        {skippable && <QuietAction label="skip" onPress={onDone} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.night,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: color.nightText,
  },
  invitation: {
    ...type.label,
    color: color.nightText,
    marginTop: space.x4,
    textTransform: 'lowercase',
  },
  // Reserved space so the skip's appearance does not shift the breath.
  skipArea: {
    position: 'absolute',
    bottom: space.x6,
    minHeight: space.x6,
    justifyContent: 'center',
  },
});
