import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import FleetBottomNav from '../components/FleetBottomNav';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import {
  getFlaggedAssets,
  getReadinessStatus,
} from '../services/equipmentReadinessService';
import { getFleet, getFleetStatusSummary } from '../services/droneDowntimeService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function StateBadge({ state }) {
  const style = state === 'Available' ? styles.active : state === 'Maintenance' ? styles.service : styles.grounded;
  return <Text style={[styles.state, style]}>{state}</Text>;
}

function IssueBadge({ status }) {
  const tone = status === 'MISSING'
    ? styles.missingTag
    : status === 'FAILED'
      ? styles.failedTag
      : styles.unverifiedTag;
  return <Text style={[styles.statusTag, tone]}>{status}</Text>;
}

export default function SerializedDroneManifestScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const adminMode = route?.params?.adminMode === true;
  const [query, setQuery] = useState('');
  const [fleet, setFleet] = useState(getFleet);
  const [refreshToken, setRefreshToken] = useState(0);

  // Downtime follow-ups change availability and equipment follow-ups change the
  // readiness flags, so both ledgers refresh when the screen regains focus.
  useEffect(() => {
    const refresh = () => {
      setFleet(getFleet());
      setRefreshToken((value) => value + 1);
    };
    const unsubscribe = navigation?.addListener?.('focus', refresh);
    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
  }, [navigation]);

  const status = getFleetStatusSummary();
  const readiness = useMemo(() => getReadinessStatus(), [refreshToken]);
  const flaggedById = useMemo(() => getFlaggedAssets().reduce((next, asset) => {
    next[asset.assetId] = asset;
    return next;
  }, {}), [refreshToken]);

  const rows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return fleet;
    return fleet.filter((drone) => `${drone.id} ${drone.rfid} ${drone.availability}`.toLowerCase().includes(value));
  }, [query, fleet]);

  return (
    <ScreenLayout
      label={adminMode ? 'ADMIN FLEET REGISTRY' : 'FLEET REGISTRY'}
      title="DRONE FLEET MANIFEST"
      headerBadge="● ONLINE"
      showProgress={false}
      onLogoPress={adminMode ? () => navigation.navigate('AdminDashboard') : undefined}
      onBack={adminMode ? () => navigation.navigate('AdminDashboard') : undefined}
      backLabel="Back to admin dashboard"
      flushFooter
      plainFooter
      footer={<FleetBottomNav active="AIRSPACE" onSelect={(tab) => { if (tab === 'LAANC') navigation.navigate('LaancDashboard'); }} />}
    >
      <View style={[styles.manifest, layout.wide && styles.wideManifest]}>
        {readiness.blocked ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View equipment alert"
            onPress={() => navigation.navigate('MissingEquipmentAlert', adminMode ? { adminMode: true } : undefined)}
            style={({ pressed }) => [styles.alertBanner, pressed && styles.pressed]}
          >
            <View style={styles.alertBannerCopy}>
              <Text style={styles.alertBannerLabel}>⚠ EQUIPMENT ALERT · {readiness.level}</Text>
              <Text style={styles.alertBannerText}>
                {readiness.headline} — show readiness is locked until safety follow-up.
              </Text>
            </View>
            <Text style={styles.alertBannerArrow}>→</Text>
          </Pressable>
        ) : null}
        <View style={styles.manifestHeading}>
          <Text style={s.label}>// SYSTEM HARDWARE MANIFEST</Text>
          <Text style={styles.total}>TOTAL: {fleet.length} UNITS</Text>
        </View>
        <Text testID="fleet-readiness" style={styles.readiness}>
          LAUNCH-READY: {status.launchReady} UNITS · MAINTENANCE: {status.maintenance} · GROUNDED: {status.grounded}
        </Text>
        <TextInput
          accessibilityLabel="Search fleet manifest"
          value={query}
          onChangeText={setQuery}
          placeholder="SEARCH AIRFRAME OR RFID"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.search}
        />
        <View style={styles.list}>
          {rows.map((drone) => (
            <Pressable
              key={drone.id}
              accessibilityRole="button"
              accessibilityLabel={`Manage status for ${drone.id}`}
              accessibilityHint="Opens downtime and maintenance records"
              onPress={() => navigation.navigate('DroneDowntime', { droneId: drone.id })}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowTop}>
                <View style={styles.identity}>
                  <Text style={styles.droneId}>{drone.id}</Text>
                  <Text style={styles.rfid}>{drone.rfid}</Text>
                </View>
                <View style={styles.badgeRow}>
                  {flaggedById[drone.id] ? <IssueBadge status={flaggedById[drone.id].status} /> : null}
                  <StateBadge state={drone.availability} />
                </View>
              </View>
              <View style={styles.telemetry}>
                <Text style={styles.telemetryLabel}>BATTERY TELEMETRY</Text>
                <Text style={[styles.battery, drone.availability !== 'Available' && styles.criticalBattery]}>{drone.battery}</Text>
              </View>
              <View style={styles.rowAction}>
                <Text style={styles.rowActionText}>FLAG / SERVICE</Text>
                <Text style={styles.rowActionChevron}>→</Text>
              </View>
            </Pressable>
          ))}
          {rows.length === 0 && <Text style={[s.body, styles.empty]}>No fleet records match your search.</Text>}
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  manifest: { flex: 1 },
  wideManifest: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  alertBannerCopy: { flex: 1, minWidth: 0 },
  alertBannerLabel: { color: colors.error, fontFamily: monoFont, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  alertBannerText: { color: colors.text, fontSize: 10, lineHeight: 15, marginTop: 3 },
  alertBannerArrow: { color: colors.error, fontSize: 18, fontWeight: '700' },
  manifestHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 },
  total: { color: colors.accent, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  readiness: { color: colors.accent, fontFamily: monoFont, fontSize: 9, fontWeight: '700', marginBottom: 14 },
  rowAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7, paddingTop: 6, borderTopWidth: 1, borderColor: colors.border },
  rowActionText: { color: colors.gold, fontFamily: monoFont, fontSize: 8, fontWeight: '700' },
  rowActionChevron: { color: colors.gold, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  search: { color: colors.text, fontFamily: monoFont, fontSize: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 3, minHeight: 42, paddingHorizontal: 12, marginBottom: 14 },
  list: { gap: 8 },
  row: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 10, minHeight: 76 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  identity: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexShrink: 1 },
  droneId: { color: colors.text, fontFamily: monoFont, fontSize: 12, fontWeight: '700' },
  rfid: { color: colors.muted, fontFamily: monoFont, fontSize: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusTag: { borderWidth: 1, borderRadius: 3, fontFamily: monoFont, fontSize: 8, fontWeight: '700', paddingHorizontal: 5, paddingVertical: 3 },
  missingTag: { color: colors.error, borderColor: colors.error },
  failedTag: { color: colors.gold, borderColor: colors.gold },
  unverifiedTag: { color: colors.cyan, borderColor: colors.cyan },
  state: { borderWidth: 1, borderRadius: 3, fontFamily: monoFont, fontSize: 8, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 4 },
  active: { color: '#041A15', borderColor: colors.green, backgroundColor: colors.green },
  service: { color: '#231700', borderColor: colors.gold, backgroundColor: colors.gold },
  grounded: { color: '#FFFFFF', borderColor: colors.error, backgroundColor: '#9B221B' },
  telemetry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, paddingTop: 7, borderTopWidth: 1, borderColor: colors.border },
  telemetryLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 8 },
  battery: { color: colors.text, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  criticalBattery: { color: colors.error },
  empty: { paddingVertical: 24, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
