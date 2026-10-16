import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { mockBooking } from '../mockData';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const QUICK_LINKS = [
  { key: 'fees', label: 'Review booking fees', description: 'Coverage, policy and checkout', route: 'FeeReview' },
  { key: 'settings', label: 'Account settings', description: 'Notifications, language and time zone', route: 'AccountSettings' },
];

export default function DashboardScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();

  return (
    <ScreenLayout
      label="CLIENT // DASHBOARD"
      title="Client Dashboard"
      badge="● CLIENT"
      onAccount={() => navigation.navigate('AccountSettings')}
    >
      <View style={[s.card, styles.hero]}>
        <Text style={s.label}>// ACTIVE BOOKING</Text>
        <Text style={[styles.booking, layout.wide && styles.wideBooking]}>{mockBooking.name}</Text>
        <Text style={s.body}>Commercial airspace coverage and settlement for {mockBooking.policy.period}.</Text>
      </View>
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
  hero: { alignItems: 'flex-start' },
  booking: { color: colors.accent, fontFamily: monoFont, fontSize: 22, fontWeight: '700', marginVertical: 8 },
  wideBooking: { fontSize: 28 },
  wideLinks: { flexDirection: 'row', gap: 24 },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wideLink: { flex: 1 },
  linkCopy: { flex: 1 },
  linkTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  chevron: { color: colors.accent, fontSize: 16 },
  pressed: { opacity: 0.7 },
});
