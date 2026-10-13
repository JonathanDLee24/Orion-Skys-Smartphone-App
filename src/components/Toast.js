import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, monoFont } from '../theme';

export default function Toast({ message, onHide, duration = 2600 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!message) return undefined;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished && onHideRef.current) onHideRef.current();
      });
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, opacity]);

  if (!message) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.layer, { opacity }]}>
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, bottom: 104, alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
  toast: { width: '100%', maxWidth: 420, backgroundColor: colors.cyanTint, borderWidth: 1, borderColor: colors.cyan, borderRadius: 6, paddingVertical: 12, paddingHorizontal: 16 },
  text: { color: colors.cyan, fontFamily: monoFont, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
