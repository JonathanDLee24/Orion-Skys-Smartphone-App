import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import AccountSettingsScreen from './src/screens/AccountSettingsScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EmployeeDashboard from './src/screens/EmployeeDashboard';
import FeeReviewScreen from './src/screens/FeeReviewScreen';
import EmployeeLoginScreen from './src/screens/EmployeeLoginScreen';
import PaymentCheckoutScreen from './src/screens/PaymentCheckoutScreen';
import SerializedDroneManifestScreen from './src/screens/SerializedDroneManifestScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { colors } from './src/theme';

NetInfo.configure({
  reachabilityShortTimeout: 1000,
  reachabilityLongTimeout: 5000,
  reachabilityRequestTimeout: 2000,
});

const Stack = createNativeStackNavigator();
const navigationTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: colors.accent, background: colors.background, card: colors.card, text: colors.text, border: colors.border },
};

export default function App() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected === false || state.isInternetReachable === false) {
        setIsOffline(true);
      } else if (state.isConnected === true) {
        setIsOffline(false);
      }
    });

    // Browsers emit these events as soon as the device loses or regains its link.
    if (typeof window !== 'undefined') {
      const handleOffline = () => setIsOffline(true);
      const handleOnline = () => setIsOffline(false);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);
      setIsOffline(!window.navigator.onLine);

      return () => {
        unsubscribe();
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
      };
    }

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.app}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboard} />
            <Stack.Screen name="EmployeeLogin" component={EmployeeLoginScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="DroneManifest" component={SerializedDroneManifestScreen} />
            <Stack.Screen name="FeeReview" component={FeeReviewScreen} />
            <Stack.Screen name="Checkout" component={PaymentCheckoutScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        {isOffline && (
          <View accessibilityRole="alert" style={styles.offlineOverlay}>
            <View style={styles.offlineCard}>
              <Text style={styles.offlineTitle}>Connection lost</Text>
              <Text style={styles.offlineMessage}>Check your internet connection. This screen will close when you’re back online.</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  offlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  offlineCard: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  offlineTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  offlineMessage: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
