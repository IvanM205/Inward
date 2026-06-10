/**
 * TerminalScreen(line) — the brand gesture: fade to night (06 §Motion).
 * Every completed primary flow ends here: night background, one serif line,
 * and no further navigation except exit (INV-3, NFR-A3).
 */
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, BackHandler, StyleSheet, View } from 'react-native';
import { color, motion, space, type } from './tokens';

export interface TerminalScreenProps {
  /** The one line. Must point outward: "now go live it", "go say it" (06 §Copy). */
  line: string;
  /**
   * Called when the flow should release the user — Android back, or the fade
   * settling. The host either exits the app or pops to the root, nothing else.
   */
  onExit: () => void;
}

export function TerminalScreen({ line, onExit }: TerminalScreenProps): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) {
        // Reduced motion: stillness instead of fades (06 §Motion).
        opacity.setValue(1);
        return;
      }
      animation = Animated.timing(opacity, {
        toValue: 1,
        duration: motion.slow,
        useNativeDriver: true,
      });
      animation.start();
    });
    return () => animation?.stop();
  }, [opacity]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onExit();
      return true;
    });
    return () => sub.remove();
  }, [onExit]);

  return (
    <View style={styles.screen} accessibilityViewIsModal>
      <Animated.Text
        style={[styles.line, { opacity }]}
        accessibilityRole="text"
        accessibilityLabel={line}>
        {line}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.night,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.x4,
  },
  line: {
    ...type.terminalLine,
    color: color.nightText,
    textAlign: 'center',
  },
});
