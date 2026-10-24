import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, useResponsiveLayout } from '../theme';

const QUICK_LINKS = [
  { key: 'booking', label: 'Schedule a drone show', description: 'Pick a date, time and venue', route: 'BookingDateVenue' },
  { key: 'fees', label: 'Review booking fees', description: 'Coverage, policy and checkout', route: 'FeeReview' },
  { key: 'settings', label: 'Account settings', description: 'Notifications, language and time zone', route: 'AccountSettings' },
  { key: 'qrScanner', label: 'Scan QR codes', description: 'Check-in staff and guests', route: 'QRCodeScanner' },
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
      <View testID="dashboard-links" style={[styles.links, layout.wide && styles.wideLinks]}>
        {QUICK_LINKS.map((link) => (
          <Pressable
            key={link.key}
            accessibilityRole="button"
            accessibilityLabel={link.label}
            onPress={() => navigation.navigate(link.route)}
            style={({ pressed }) => [s.card, styles.link, layout.wide && styles.wideLink, pressed && styles.pressed]}
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
  wideLinks: { flexDirection: 'row', gap: 24 },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wideLink: { flex: 1 },
  linkCopy: { flex: 1 },
  linkTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  chevron: { color: colors.accent, fontSize: 16 },
  pressed: { opacity: 0.7 },
});
