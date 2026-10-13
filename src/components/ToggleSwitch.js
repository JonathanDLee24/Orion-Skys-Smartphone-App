import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme';

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - 6;

export default function ToggleSwitch({ value, onValueChange, label, testID }) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const trackColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.cyan] });
  const thumbOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => onValueChange(!value)}
      style={styles.touch}
    >
      <Animated.View testID={`${testID}-track`} style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View testID={`${testID}-thumb`} style={[styles.thumb, { transform: [{ translateX: thumbOffset }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { minHeight: 44, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  track: { width: TRACK_WIDTH, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, padding: 3, justifyContent: 'center' },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2, backgroundColor: colors.background },
});
