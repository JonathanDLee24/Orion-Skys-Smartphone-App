import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, monoFont, useResponsiveLayout } from '../theme';

export default function PrimaryButton({ title, onPress, disabled = false, loading = false }) {
  const layout = useResponsiveLayout();
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [styles.button, layout.wide && { minHeight: 56, padding: 16 }, unavailable && styles.disabled, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color={colors.background} /> : (
        <Text style={[styles.text, layout.wide && { fontSize: 13 }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.accent, borderRadius: 4, minHeight: 44, padding: 10, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.background, fontFamily: monoFont, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
});
