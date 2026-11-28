import DroneDowntimeScreen from './src/screens/DroneDowntimeScreen';
import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StyleSheet, View } from 'react-native';
import Text from './src/components/AppText';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import AccessibilitySettingsScreen from './src/screens/AccessibilitySettingsScreen';
import AccountSettingsScreen from './src/screens/AccountSettingsScreen';
import BookingDateVenueScreen from './src/screens/BookingDateVenueScreen';
import BookingConflictScreen from './src/screens/BookingConflictScreen';
import BookingManageScreen from './src/screens/BookingManageScreen';
import BookingReviewScreen from './src/screens/BookingReviewScreen';
import BookingSubmittedScreen from './src/screens/BookingSubmittedScreen';
import CreditsScreen from './src/screens/CreditsScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DocumentDossierScreen from './src/screens/DocumentDossierScreen';
import DossierDeliveryScreen, { DossierSentLogScreen } from './src/screens/DossierDeliveryScreen';
import DossierShowSelectScreen, { AdminContractsScreen } from './src/screens/DossierShowSelectScreen';
import EmployeeDashboard from './src/screens/EmployeeDashboard';
import EmployeeEventsScreen, { AdminScheduleScreen } from './src/screens/EmployeeEventsScreen';
import EventActionScreen from './src/screens/EventActionScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import EmployeeSuccessfulScanScreen from './src/screens/EmployeeSuccessfulScanScreen';
import FeeReviewScreen from './src/screens/FeeReviewScreen';
import EmployeeLoginScreen from './src/screens/EmployeeLoginScreen';
import PaymentCheckoutScreen from './src/screens/PaymentCheckoutScreen';
import SerializedDroneManifestScreen from './src/screens/SerializedDroneManifestScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ClientSignOffScreen from './src/screens/ClientSignOffScreen';
import ShowAuthorizationScreen from './src/screens/ShowAuthorizationScreen';
import LiabilityClausesScreen from './src/screens/LiabilityClausesScreen';
import PendingSignaturesScreen from './src/screens/PendingSignaturesScreen';
import CustomerSuccessfulScanScreen from './src/screens/CustomerSuccessfulScanScreen';
import UnsuccessfulQRCodeScanScreen from './src/screens/UnsuccessfulQRCodeScanScreen';
import QRCodeScannerScreen from './src/screens/QRCodeScannerScreen';
import EmployeeQRCodeScreen from './src/screens/EmployeeQRCode';
import PaymentResultScreen from './src/screens/PaymentResultScreen';
import DroneUsageScreen from './src/screens/DroneUsageScreen';
import MissingEquipmentAlertScreen from './src/screens/MissingEquipmentAlertScreen';
import LaancDashboardScreen from './src/screens/LaancDashboardScreen';
import { DroneLaunchProvider } from './src/components/DroneLaunchTransition';
import { AccessibilityProvider, useAccessibility, useAccessibilityColors } from './src/components/AccessibilityProvider';

NetInfo.configure({
  reachabilityShortTimeout: 1000,
  reachabilityLongTimeout: 5000,
  reachabilityRequestTimeout: 2000,
});

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <DroneLaunchProvider>
          <AppShell />
        </DroneLaunchProvider>
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}

// Inside the accessibility provider so the palette and reduced-motion choice
// reach the navigation container and the offline overlay too.
function AppShell() {
  const [isOffline, setIsOffline] = useState(false);
  const theme = useAccessibilityColors();
  const { reduceMotion } = useAccessibility();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected === false || state.isInternetReachable === false) {
        setIsOffline(true);
      } else if (state.isConnected === true) {
        setIsOffline(false);
      }
    });

    // Browsers emit these events as soon as the device loses or regains its link.
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function'
    ) {
      const handleOffline = () => setIsOffline(true);
      const handleOnline = () => setIsOffline(false);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);
      setIsOffline(window.navigator.onLine === false);

      return () => {
        unsubscribe();
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
      };
    }

    return unsubscribe;
  }, []);

  const navigationTheme = useMemo(() => ({
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.accent,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  }), [theme]);

  return (
    <>
      <StatusBar style="light" />
      <View style={[styles.app, { backgroundColor: theme.background }]}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false,
              animation: reduceMotion ? 'none' : 'default',
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboard} />
            <Stack.Screen name="EmployeeSuccessfulScan" component={EmployeeSuccessfulScanScreen} />
            <Stack.Screen name="CustomerSuccessfulScan" component={CustomerSuccessfulScanScreen} />
            <Stack.Screen name="QRCodeScanner" component={QRCodeScannerScreen} />
            <Stack.Screen name="EmployeeQRCode" component={EmployeeQRCodeScreen} />
            <Stack.Screen name="UnsuccessfulQRCodeScan" component={UnsuccessfulQRCodeScanScreen} />
            <Stack.Screen name="EmployeeEvents" component={EmployeeEventsScreen} />
            <Stack.Screen name="Credits" component={CreditsScreen} />
            <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            <Stack.Screen name="EventAction" component={EventActionScreen} />
            <Stack.Screen name="EmployeeLogin" component={EmployeeLoginScreen} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminSchedule" component={AdminScheduleScreen} />
            <Stack.Screen name="AdminContracts" component={AdminContractsScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="BookingDateVenue" component={BookingDateVenueScreen} />
            <Stack.Screen name="BookingReview" component={BookingReviewScreen} />
            <Stack.Screen name="BookingConflict" component={BookingConflictScreen} />
            <Stack.Screen name="BookingManage" component={BookingManageScreen} />
            <Stack.Screen name="ShowAuthorization" component={ShowAuthorizationScreen} />
            <Stack.Screen name="LiabilityClauses" component={LiabilityClausesScreen} />
            <Stack.Screen name="PendingSignatures" component={PendingSignaturesScreen} />
            <Stack.Screen name="BookingSubmitted" component={BookingSubmittedScreen} />
            <Stack.Screen name="DroneManifest" component={SerializedDroneManifestScreen} />
            <Stack.Screen name="DroneDowntime" component={DroneDowntimeScreen} />
            <Stack.Screen name="DroneUsage" component={DroneUsageScreen} />
            <Stack.Screen name="LaancDashboard" component={LaancDashboardScreen} />
            <Stack.Screen name="MissingEquipmentAlert" component={MissingEquipmentAlertScreen} />
            <Stack.Screen name="FeeReview" component={FeeReviewScreen} />
            <Stack.Screen name="Checkout" component={PaymentCheckoutScreen} />
            <Stack.Screen name="PaymentStatus" component={PaymentResultScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="AccessibilitySettings" component={AccessibilitySettingsScreen} />
            <Stack.Screen name="DossierShowSelect" component={DossierShowSelectScreen} />
            <Stack.Screen name="DocumentDossier" component={DocumentDossierScreen} />
            <Stack.Screen name="DossierDelivery" component={DossierDeliveryScreen} />
            <Stack.Screen name="DossierSentLog" component={DossierSentLogScreen} />
            <Stack.Screen name="ClientSignOff" component={ClientSignOffScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        {isOffline && (
          <View accessibilityRole="alert" style={styles.offlineOverlay}>
            <View style={[styles.offlineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.offlineTitle, { color: theme.text }]}>Connection lost</Text>
              <Text style={[styles.offlineMessage, { color: theme.muted }]}>Check your internet connection. This screen will close when you’re back online.</Text>
            </View>
          </View>
        )}
      </View>
    </>
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
    alignItems: 'center',
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  offlineMessage: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
