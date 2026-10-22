import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, monoFont, useResponsiveLayout } from '../theme';

export default function PrimaryButton({ title, onPress, disabled = false, loading = false, showArrow = false, leadingIcon = null, testID }) {
  const layout = useResponsiveLayout();
  const unavailable = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [styles.button, layout.wide && { minHeight: 56, padding: 16 }, unavailable && styles.disabled, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color={colors.background} /> : (
        <View style={styles.content}>
          {leadingIcon}
          {showArrow && <Text style={[styles.arrow, layout.wide && { fontSize: 16 }]}>→</Text>}
          <Text style={[styles.text, layout.wide && { fontSize: 13 }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.accent, borderRadius: 4, minHeight: 44, padding: 10, alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: '100%' },
  arrow: { color: colors.background, fontSize: 14, fontWeight: '700' },
  text: { color: colors.background, fontFamily: monoFont, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0, flexShrink: 1, textAlign: 'center' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
});
