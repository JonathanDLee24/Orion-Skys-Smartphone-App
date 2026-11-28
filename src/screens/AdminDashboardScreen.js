import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import {
  formatUnavailableSlot,
  getNextScheduledSubmission,
} from '../services/bookingConflictService';
import { getReadinessStatus } from '../services/equipmentReadinessService';
import { getFleetStatusSummary } from '../services/droneDowntimeService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const QUICK_ACTIONS = [
  { label: 'View schedule', description: 'Upcoming shows and timelines', icon: '▣', route: 'AdminSchedule' },
  { label: 'Review contracts', description: 'Pending agreements', icon: '▤', route: 'AdminContracts' },
];

const DESTINATIONS = [
  { label: 'Dashboard', description: 'Overview and quick actions', icon: '▦', notice: 'You are already viewing the admin dashboard.' },
  { label: 'Schedule', description: 'Shows, rehearsals, and cues', icon: '▣', route: 'AdminSchedule' },
  { label: 'Fleet', description: 'Drones, batteries, and readiness', icon: '✣', route: 'DroneManifest', adminMode: true },
  { label: 'Contracts', description: 'Venue, crew, and vendor records', icon: '▤', route: 'AdminContracts' },
  { label: 'Crew', description: 'Staff access, gates, and roles', icon: '♙', route: 'QRCodeScanner', adminMode: true },
  { label: 'Settings', description: 'Portal, security, and preferences', icon: '⚙', route: 'AccountSettings', adminMode: true },
  { label: 'Accessibility', description: 'Text size, contrast, touch targets and motion', icon: '◍', route: 'AccessibilitySettings', adminMode: true },
  { label: 'QuickBooks Sync', description: 'ERP ledger sync and API access', icon: '⟳', notice: 'QuickBooks sync is not configured in this app yet.' },
  { label: 'Sync status', description: 'View synchronization status', icon: '▦', notice: 'No external synchronization service is connected.' },
  { label: 'Send survey', description: 'Email feedback survey', icon: '▤', notice: 'Survey delivery is not configured in this app yet.' },
  { label: 'Shared payments', description: 'Per-booking approval and disable', icon: '▤', notice: 'Shared payment management is not available in this app yet.' },
];

function ActionCard({ action, onPress, screenStyles, wide }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={onPress}
      style={({ pressed }) => [screenStyles.card, styles.cardRow, styles.destination, wide && styles.wideDestination, pressed && styles.pressed]}
    >
      <View style={styles.destinationIcon}>
        <Text style={styles.destinationIconText}>{action.icon}</Text>
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{action.label}</Text>
        <Text style={screenStyles.body} numberOfLines={1}>{action.description}</Text>
      </View>
      <View style={styles.cardArrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </Pressable>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [notice, setNotice] = useState('');
  const [, setRefreshToken] = useState(0);
  const [fleetStatus, setFleetStatus] = useState(getFleetStatusSummary);
  const nextShow = getNextScheduledSubmission();
  const readiness = getReadinessStatus();

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      setRefreshToken((value) => value + 1);
    });
    return unsubscribe;
  }, [navigation]);

  // Downtime follow-ups change the launch-ready count, so refresh when the
  // dashboard regains focus after a fleet visit.
  useEffect(() => {
    const refreshFleet = () => setFleetStatus(getFleetStatusSummary());
    const unsubscribe = navigation?.addListener?.('focus', refreshFleet);
    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
  }, [navigation]);

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
      backgroundColor="#090B10"
      onLogoPress={() => navigation.navigate('Welcome')}
      onAccount={() => navigation.navigate('AccountSettings', { adminMode: true })}
    >
      <View style={[styles.dashboard, layout.wide && styles.wideDashboard]}>
        <Text style={[s.body, styles.subtitle]}>Administrator · Operations overview</Text>

        {readiness.blocked ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View equipment alert"
            onPress={() => navigation.navigate('MissingEquipmentAlert', { adminMode: true })}
            style={({ pressed }) => [styles.readinessBanner, pressed && styles.pressed]}
          >
            <Text style={styles.readinessBannerLabel}>⚠ SHOW READINESS LOCKED</Text>
            <Text style={styles.readinessBannerText}>
              {readiness.headline}. {readiness.flaggedCount} assets need safety follow-up before launch.
            </Text>
            <Text style={styles.readinessBannerAction}>OPEN EQUIPMENT ALERT →</Text>
          </Pressable>
        ) : null}

        <View>
          <View style={styles.rowBetween}>
            <Text style={s.label}>// NEXT SCHEDULED SHOW</Text>
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
        </View>

        <View testID="fleet-readiness-strip" style={[styles.rowBetween, styles.readinessStrip]}>
          <Text style={s.label}>// FLEET READINESS</Text>
          <Text style={styles.readinessText}>
            {fleetStatus.launchReady} LAUNCH-READY · {fleetStatus.maintenance} MAINTENANCE · {fleetStatus.grounded} GROUNDED
          </Text>
        </View>

        <Text style={[s.label, styles.secureNote]}>◈ SECURE ADMIN SESSION</Text>
        <View style={styles.quickHeading}>
          <Text style={s.label}>// QUICK ACTIONS</Text>
          <Text style={[s.label, styles.onlineLabel]}>● FLEET REGISTRY</Text>
        </View>
        <View testID="admin-quick-actions" style={styles.grid}>
          {QUICK_ACTIONS.map((action) => (
            <View key={action.label} style={[styles.gridCell, layout.wide && styles.wideGridCell]}>
              <ActionCard action={action} onPress={() => openDestination(action)} screenStyles={s} wide={layout.wide} />
            </View>
          ))}
        </View>

        <View style={styles.destinationsHeading}>
          <Text style={s.label}>// ADMIN DESTINATIONS</Text>
          <Text style={[s.label, styles.onlineLabel]}>● OPERATIONS</Text>
        </View>
        {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
        <View testID="admin-operation-links" style={styles.grid}>
          {DESTINATIONS.map((destination) => (
            <View key={destination.label} style={[styles.gridCell, layout.wide && styles.wideGridCell]}>
              <ActionCard action={destination} onPress={() => openDestination(destination)} screenStyles={s} wide={layout.wide} />
            </View>
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
  readinessBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: 16,
    marginBottom: 18,
    gap: 6,
  },
  readinessBannerLabel: {
    color: colors.error,
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  readinessBannerText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  readinessBannerAction: {
    color: colors.error,
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  onlineLabel: { color: colors.green },
  showTitle: { color: colors.text, fontSize: 17, fontWeight: '600', marginTop: 16 },
  showDetails: { marginTop: 6 },
  showTime: { color: colors.text, fontSize: 14, marginTop: 16 },
  emptyShow: { marginTop: 16 },
  secureNote: { textAlign: 'center', marginTop: 16 },
  readinessStrip: { marginTop: 18 },
  readinessText: { color: colors.accent, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  quickHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 10 },
  destinationsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 10 },
  notice: { color: colors.text, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -8 },
  gridCell: { width: '100%', padding: 8 },
  wideGridCell: { width: '33.333333%' },
  destination: { minHeight: 92, width: '100%', marginBottom: 0, padding: 20, backgroundColor: '#1A1F2B' },
  wideDestination: { minHeight: 104 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  destinationIcon: { width: 40, height: 40, flexShrink: 0, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(218, 255, 2, 0.2)', backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  destinationIconText: { color: colors.accent, fontSize: 21, fontWeight: '700' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardArrow: { width: 30, height: 30, flexShrink: 0, borderRadius: 15, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: colors.accent, fontSize: 19, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
