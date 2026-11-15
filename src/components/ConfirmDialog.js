import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, monoFont } from '../theme';

// A centered confirm/cancel dialog over a dimmed screen. Tapping outside the
// card counts as Cancel; taps on the card itself never reach the backdrop.
export default function ConfirmDialog({
  visible,
  title,
  message,
  detail,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  testID = 'confirm-dialog',
  children,
}) {
  if (!visible) return null;

  return (
    <View style={styles.layer}>
      <Pressable
        testID={`${testID}-backdrop`}
        accessibilityLabel={cancelLabel}
        onPress={onCancel}
        style={styles.backdrop}
      >
        <Pressable
          testID={testID}
          accessibilityRole="alert"
          accessibilityViewIsModal
          aria-modal
          onPress={() => {}}
          style={styles.card}
        >
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {detail}
          {children}
          <View style={styles.actions}>
            <Pressable
              testID={`${testID}-cancel`}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              testID={`${testID}-confirm`}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={onConfirm}
              style={({ pressed }) => [styles.button, styles.confirm, pressed && styles.pressed]}
            >
              <Text style={[styles.buttonText, styles.confirmText]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Spelled out: StyleSheet.absoluteFillObject is not available in this
  // React Native version.
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 30 },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    padding: 20,
    cursor: 'auto',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  button: { flex: 1, minHeight: 44, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  cancel: { backgroundColor: colors.field, borderWidth: 1, borderColor: colors.border },
  confirm: { backgroundColor: colors.accent },
  buttonText: { fontFamily: monoFont, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  cancelText: { color: colors.text },
  confirmText: { color: colors.background },
  pressed: { opacity: 0.72 },
});
