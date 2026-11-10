import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// This is a UI demonstration, not an email or a security mechanism.
export default function DemoUnlock({ onUnlock }) {
  const [requested, setRequested] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Demo only: no email is sent. Account locks reset when the app reloads.</Text>
      {!requested ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Request demo unlock email" onPress={() => setRequested(true)}>
          <Text style={styles.link}>Request unlock email (demo)</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Open simulated unlock link" onPress={onUnlock}>
          <Text style={styles.link}>Open simulated email unlock link</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  text: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '600', marginTop: 10 },
});