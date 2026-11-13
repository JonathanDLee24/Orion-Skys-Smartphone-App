import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import {
  formatUnavailableSlot,
  getNextScheduledSubmission,
} from '../services/bookingConflictService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const QUICK_ACTIONS = [
  { label: 'View schedule', route: 'AdminSchedule' },
  { label: 'Manage fleet', route: 'DroneManifest', adminMode: true },
  { label: 'Review contracts', route: 'AdminContracts' },
];

const DESTINATIONS = [
  { label: 'Dashboard', description: 'Overview and quick actions', icon: '▦', notice: 'You are already viewing the admin dashboard.' },
  { label: 'Schedule', description: 'Shows, rehearsals, and cues', icon: '▣', route: 'AdminSchedule' },
  { label: 'Fleet', description: 'Drones, batteries, and readiness', icon: '✣', route: 'DroneManifest', adminMode: true },
  { label: 'Contracts', description: 'Venue, crew, and vendor records', icon: '▤', route: 'AdminContracts' },
  { label: 'Crew', description: 'Staff access, gates, and roles', icon: '♙', route: 'QRCodeScanner', adminMode: true },
  { label: 'Settings', description: 'Portal, security, and preferences', icon: '⚙', route: 'AccountSettings', adminMode: true },
  { label: 'QuickBooks Sync', description: 'ERP ledger sync and API access', icon: '⟳', notice: 'QuickBooks sync is not configured in this app yet.' },
  { label: 'Sync status', description: 'View synchronization status', icon: '▦', notice: 'No external synchronization service is connected.' },
  { label: 'Send survey', description: 'Email feedback survey', icon: '▤', notice: 'Survey delivery is not configured in this app yet.' },
  { label: 'Shared payments', description: 'Per-booking approval and disable', icon: '▤', notice: 'Shared payment management is not available in this app yet.' },
];

export default function AdminDashboardScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [notice, setNotice] = useState('');
  const nextShow = getNextScheduledSubmission();

  function openDestination(destination) {
    if (destination.route) {
      setNotice('');
      if (destination.adminMode) navigation.navigate(destination.route, { adminMode: true });
      else navigation.navigate(destination.route);
      return;
    }
    setNotice(destination.notice);
  }

  return (
    <ScreenLayout
      label="ADMIN CONSOLE"
      title="Admin dashboard"
      headerBadge="● SECURE"
      headerTone="success"
      showProgress={false}
      caption="ADMIN OPERATIONS"
      onLogoPress={() => navigation.navigate('Welcome')}
      onAccount={() => navigation.navigate('AccountSettings', { adminMode: true })}
    >
      <View style={[styles.dashboard, layout.wide && styles.wideDashboard]}>
        <Text style={[s.body, styles.subtitle]}>Administrator · Operations overview</Text>

        <View style={[s.card, styles.overviewCard]}>
          <View style={styles.rowBetween}>
            <Text style={s.label}>// NEXT SCHEDULED SHOW</Text>
            <Text style={[s.label, styles.onlineLabel]}>● FLEET REGISTRY</Text>
          </View>
          {nextShow ? (
            <>
              <Text style={styles.showTitle}>{nextShow.eventName}</Text>
              <View style={[styles.rowBetween, styles.showDetails]}>
                <Text style={s.body}>{nextShow.venueName}</Text>
                <Text style={s.body}>Fleet details in manifest</Text>
              </View>
              <Text style={styles.showTime}>● {formatUnavailableSlot({ date: nextShow.date, timeSlot: nextShow.timeSlot })}</Text>
            </>
          ) : (
            <Text style={[s.body, styles.emptyShow]}>No shows are currently on the schedule.</Text>
          )}

          <Text style={[s.label, styles.quickLabel]}>// QUICK ACTIONS</Text>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={() => (
                  action.adminMode
                    ? navigation.navigate(action.route, { adminMode: true })
                    : navigation.navigate(action.route)
                )}
                style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}
              >
                <Text style={styles.quickButtonText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[s.label, styles.secureNote]}>◈ SECURE ADMIN SESSION</Text>
        </View>

        <View style={styles.destinationsHeading}>
          <Text style={s.label}>// ADMIN DESTINATIONS</Text>
          <Text style={[s.label, styles.onlineLabel]}>● OPERATIONS</Text>
        </View>
        {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
        <View testID="admin-operation-links" style={styles.destinations}>
          {DESTINATIONS.map((destination) => (
            <Pressable
              key={destination.label}
              accessibilityRole="button"
              accessibilityLabel={destination.label}
              onPress={() => openDestination(destination)}
              style={({ pressed }) => [
                s.card,
                styles.destination,
                layout.wide && styles.wideDestination,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.destinationIcon}>
                <Text style={styles.destinationIconText}>{destination.icon}</Text>
              </View>
              <View style={styles.destinationCopy}>
                <Text style={styles.destinationTitle}>{destination.label}</Text>
                <Text style={s.body}>{destination.description}</Text>
              </View>
              <View style={styles.destinationArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  dashboard: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  wideDashboard: { maxWidth: 1120 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  overviewCard: { padding: 18, borderRadius: 12, borderColor: colors.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  onlineLabel: { color: colors.green },
  showTitle: { color: colors.text, fontSize: 17, fontWeight: '600', marginTop: 16 },
  showDetails: { marginTop: 6 },
  showTime: { color: colors.text, fontSize: 14, marginTop: 16 },
  emptyShow: { marginTop: 16 },
  quickLabel: { marginTop: 22, marginBottom: 10 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickButton: { minHeight: 42, borderRadius: 9, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, flexGrow: 1 },
  quickButtonText: { color: colors.accent, fontFamily: monoFont, fontSize: 11 },
  secureNote: { textAlign: 'center', marginTop: 18 },
  destinationsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 10 },
  notice: { color: colors.text, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13 },
  destinations: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  destination: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 92, width: '48%', flexGrow: 1, flexBasis: 145, marginBottom: 0, padding: 12 },
  wideDestination: { flexBasis: 280, minHeight: 104 },
  destinationIcon: { width: 40, height: 40, flexShrink: 0, borderRadius: 10, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  destinationIconText: { color: colors.accent, fontSize: 21, fontWeight: '700' },
  destinationCopy: { flex: 1, minWidth: 0 },
  destinationTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  destinationArrow: { width: 30, height: 30, flexShrink: 0, borderRadius: 15, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: colors.accent, fontSize: 19, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
