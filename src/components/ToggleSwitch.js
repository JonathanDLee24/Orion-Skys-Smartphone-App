import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useAccessibility, useAccessibilityColors, useTapTargets } from './AccessibilityProvider';
import { colors } from '../theme';

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - 6;

export default function ToggleSwitch({ value, onValueChange, label, testID, disabled = false }) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const { reduceMotion } = useAccessibility();
  const theme = useAccessibilityColors();
  const tapTargets = useTapTargets();

  useEffect(() => {
    // Reduced motion jumps straight to the new position instead of sliding.
    if (reduceMotion) {
      progress.stopAnimation();
      progress.setValue(value ? 1 : 0);
      return;
    }
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, progress, reduceMotion]);

  const trackColor = progress.interpolate({ inputRange: [0, 1], outputRange: [theme.border, theme.accent] });
  const thumbOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, ...(disabled ? { disabled: true } : {}) }}
      aria-checked={value}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      hitSlop={tapTargets.hitSlop}
      onPress={() => onValueChange(!value)}
      style={[styles.touch, tapTargets.style, disabled && styles.disabled]}
    >
      <Animated.View testID={`${testID}-track`} style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          testID={`${testID}-thumb`}
          style={[styles.thumb, { backgroundColor: theme.background, transform: [{ translateX: thumbOffset }] }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { minHeight: 44, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  track: { width: TRACK_WIDTH, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, padding: 3, justifyContent: 'center' },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2, backgroundColor: colors.background },
});
