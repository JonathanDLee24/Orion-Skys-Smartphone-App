import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, monoFont } from '../theme';

// react-native-web has no native animated module, so fall back to the JS driver there.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// A small centered confirmation with a checkmark. It fades in, closes itself
// after `duration`, and a tap anywhere on screen closes it early. `showKey` replays it
// when the same message is confirmed again.
export default function ConfirmationPopup({ message, showKey, onHide, duration = 2200, testID = 'confirmation-popup' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!message) return undefined;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }).start(({ finished }) => {
        if (finished && onHideRef.current) onHideRef.current();
      });
    }, duration);
    return () => clearTimeout(timer);
  }, [message, showKey, duration, opacity]);

  if (!message) return null;

  const hide = () => onHideRef.current && onHideRef.current();

  // The whole screen is the tap target: a tap or click anywhere closes the
  // popup, and that tap is not passed on to whatever sits underneath.
  return (
    <Animated.View style={[styles.layer, { opacity }]}>
      <Pressable
        testID={testID}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={message}
        accessibilityHint="Tap anywhere to dismiss"
        onPress={hide}
        style={styles.backdrop}
      >
        <View style={styles.popup}>
          <View style={styles.badge}>
            <Text style={styles.check}>✓</Text>
          </View>
          <Text style={styles.text}>{message}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Spelled out: StyleSheet.absoluteFillObject is not available in this
  // React Native version.
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20 },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    cursor: 'pointer',
  },
  popup: {
    minWidth: 220,
    maxWidth: 320,
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 22,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: colors.accent, fontSize: 24, fontWeight: '900', lineHeight: 28 },
  text: { color: colors.text, fontFamily: monoFont, fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
