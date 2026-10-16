import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AccountSettingsScreen from './src/screens/AccountSettingsScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EmployeeDashboard from './src/screens/EmployeeDashboard';
import FeeReviewScreen from './src/screens/FeeReviewScreen';
import EmployeeLoginScreen from './src/screens/EmployeeLoginScreen';
import PaymentCheckoutScreen from './src/screens/PaymentCheckoutScreen';
import SerializedDroneManifestScreen from './src/screens/SerializedDroneManifestScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const navigationTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: colors.accent, background: colors.background, card: colors.card, text: colors.text, border: colors.border },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
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
    </SafeAreaProvider>
  );
}
