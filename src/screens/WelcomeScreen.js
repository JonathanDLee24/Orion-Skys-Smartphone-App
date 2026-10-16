import React from 'react';
import { Pressable, StyleSheet, Text, Image} from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, useResponsiveLayout } from '../theme';

// Sign-in buttons lead to the dashboard and Drone Manifest for now; they can route to sign-in screens later.

export default function WelcomeScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const logoWidth = layout.wide ? 360 : 260;

  return (
    <ScreenLayout label="WELCOME" title="Welcome">
      <Image
        source={require('../../assets/orion-skys-logo.png')}
        accessibilityLabel="Orion Skys Logo"
        resizeMode="contain"
        style={{ width: logoWidth, height: logoWidth * (174 / 1035), alignSelf: 'center', marginBottom: 20,}}
      />
      <Text style={[s.body, { fontSize: 16, marginBottom: 20, alignSelf: 'center' }]}>
        Choose how you would like to sign in.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Dashboard')}
         style={styles.button}
      >
        <Text style={styles.buttonText}>Employee Sign In</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('DroneManifest')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Admin Sign In</Text>
      </Pressable>
    </ScreenLayout>
  );
}

  const styles = StyleSheet.create({
    button: {
        marginVertical: 12,
        borderWidth: 1,
        borderColor: colors.accent,
        padding: 14,
        borderRadius: 8,
        width: 200,
        alignItems: 'center',
        alignSelf: 'center',
    },
    buttonText: {
        color: colors.text,
        fontWeight: '600',
    },
  });