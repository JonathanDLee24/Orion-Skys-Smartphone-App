import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, useResponsiveLayout } from '../theme';

const QUICK_LINKS = [
  { key: 'booking', label: 'Schedule a drone show', description: 'Pick a date, time and venue', route: 'BookingDateVenue' },
  { key: 'fees', label: 'Review booking fees', description: 'Coverage, policy and checkout', route: 'FeeReview' },
  { key: 'settings', label: 'Account settings', description: 'Notifications, language and time zone', route: 'AccountSettings' },
  { key: 'documents', label: 'Review documents', description: 'Agreements, waivers, receipts and flight plans', route: 'DossierShowSelect' },
  { key: 'signOff', label: 'Client sign-off', description: 'Confirm your credentials and sign authorization', route: 'ClientSignOff' },
  { key: 'qrScanner', label: 'Scan QR codes', description: 'Check-in staff and guests', route: 'QRCodeScanner' },
  { key: 'employeeQRCode', label: 'Employee QR Code', description: 'View your personal QR code', route: 'EmployeeQRCode' },
];

export default function DashboardScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();

  return (
    <ScreenLayout
      caption="EMPLOYEE OPERATIONS / PAYMENTS"
      title="My Account"
      badge="● CLIENT"
      onAccount={() => navigation.navigate('AccountSettings')}
      onBack={() => navigation.navigate('EmployeeDashboard')}
      backLabel="Back to dashboard"
    >
      <View
        testID="dashboard-links"
        style={[
          styles.links,
          layout.mode === 'tablet' && styles.tabletLinks,
          layout.mode === 'desktop' && styles.desktopLinks,
        ]}
      >
        {QUICK_LINKS.map((link) => (
          <Pressable
            key={link.key}
            accessibilityRole="button"
            accessibilityLabel={link.label}
            onPress={() => navigation.navigate(link.route)}
            style={({ pressed }) => [
              s.card,
              styles.link,
              layout.mode === 'tablet' && styles.tabletLink,
              layout.mode === 'desktop' && styles.desktopLink,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.linkCopy}>
              <Text style={styles.linkTitle}>{link.label}</Text>
              <Text style={s.body}>{link.description}</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </Pressable>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  links: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tabletLinks: { maxWidth: 880, alignSelf: 'center', gap: 16 },
  desktopLinks: { maxWidth: 1120, alignSelf: 'center', gap: 16 },
  link: {
    width: '100%',
    minHeight: 76,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tabletLink: { width: '48%', minHeight: 118 },
  desktopLink: { width: '23.5%', minHeight: 142 },
  linkCopy: { flex: 1 },
  linkTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  chevron: { color: colors.accent, fontSize: 16 },
  pressed: { opacity: 0.7 },
});
