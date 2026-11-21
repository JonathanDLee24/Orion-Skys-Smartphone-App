import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { useTapTargets } from './AccessibilityProvider';
import { colors } from '../theme';

// This is a UI demonstration, not an email or a security mechanism.
export default function DemoUnlock({ onUnlock }) {
  const [requested, setRequested] = useState(false);
  const tapTargets = useTapTargets();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Demo only: no email is sent. Account locks reset when the app reloads.</Text>
      {!requested ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Request demo unlock email"
          hitSlop={tapTargets.hitSlop}
          onPress={() => setRequested(true)}
          style={[styles.linkButton, tapTargets.style]}
        >
          <Text style={styles.link}>Request unlock email (demo)</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open simulated unlock link"
          hitSlop={tapTargets.hitSlop}
          onPress={onUnlock}
          style={[styles.linkButton, tapTargets.style]}
        >
          <Text style={styles.link}>Open simulated email unlock link</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  linkButton: { justifyContent: 'center' },
  text: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '600', marginTop: 10 },
});