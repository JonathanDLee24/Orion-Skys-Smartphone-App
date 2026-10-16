import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors } from '../theme';

const DEMO_USERNAME = 'test';
const DEMO_PASSWORD = 'password1234';

export default function EmployeeLoginScreen({ navigation }) {
  const s = useScreenStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  const signIn = () => {
    if (username.trim() !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      setError('Username or password is incorrect.');
      return;
    }
    setError('');
    navigation.navigate('Dashboard');
  };

  return (
    <ScreenLayout
      label="EMPLOYEE ACCESS"
      title="Employee Sign In"
    >
      <View style={styles.form}>
        <Text style={s.body}>
          Sign in with your employee account to continue.
        </Text>
        <Text style={styles.label}>Username</Text>
        <TextInput
          accessibilityLabel="Username"
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect={false}
          onChangeText={(value) => {
            setUsername(value);
            setError('');
          }}
          placeholder="Enter your username"
          placeholderTextColor={colors.muted}
          returnKeyType="next"
          style={styles.input}
          value={username}
        />
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordField}>
          <TextInput
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete="current-password"
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            onSubmitEditing={signIn}
            placeholder="Enter your password"
            placeholderTextColor={colors.muted}
            returnKeyType="done"
            secureTextEntry={!isPasswordVisible}
            style={[styles.input, styles.passwordInput]}
            value={password}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityState={{ pressed: isPasswordVisible }}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={({ pressed }) => [
              styles.visibilityButton,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.eyeIcon} accessible={false}>
              <View style={styles.eyePupil} />
              {!isPasswordVisible ? <View style={styles.eyeSlash} /> : null}
            </View>
          </Pressable>
        </View>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          onPress={signIn}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
        <Text style={styles.demoNote}>
          Demo login: username test · password password1234
        </Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    marginTop: 12,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 7,
  },
  input: {
    minHeight: 48,
    color: colors.text,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  passwordField: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  visibilityButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 20,
    height: 14,
    borderWidth: 1.5,
    borderColor: colors.muted,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyePupil: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.muted,
  },
  eyeSlash: {
    position: 'absolute',
    width: 23,
    height: 1.5,
    backgroundColor: colors.muted,
    transform: [{ rotate: '-38deg' }],
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: 12,
  },
  button: {
    minHeight: 48,
    marginTop: 22,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#111600',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
  demoNote: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
  },
});
