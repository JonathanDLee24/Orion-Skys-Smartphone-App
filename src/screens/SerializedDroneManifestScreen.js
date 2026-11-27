import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import FleetBottomNav from '../components/FleetBottomNav';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const fleet = [
  { id: 'SF-Q-001', rfid: 'RFID: 900-11A0', state: 'ACTIVE', battery: '98%' },
  { id: 'SF-Q-002', rfid: 'RFID: 900-11A1', state: 'ACTIVE', battery: '92%' },
  { id: 'SF-Q-003', rfid: 'RFID: 900-11A2', state: 'STANDBY', battery: '45%' },
  { id: 'SF-Q-004', rfid: 'RFID: 900-11A3', state: 'SERVICE', battery: '12%' },
  { id: 'SF-Q-005', rfid: 'RFID: 900-11A4', state: 'ACTIVE', battery: '88%' },
  { id: 'SF-Q-006', rfid: 'RFID: 900-11A5', state: 'ACTIVE', battery: '76%' },
];

function StateBadge({ state }) {
  const style = state === 'ACTIVE' ? styles.active : state === 'STANDBY' ? styles.standby : styles.service;
  return <Text style={[styles.state, style]}>{state}</Text>;
}

export default function SerializedDroneManifestScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const adminMode = route?.params?.adminMode === true;
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return fleet;
    return fleet.filter((drone) => `${drone.id} ${drone.rfid} ${drone.state}`.toLowerCase().includes(value));
  }, [query]);

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
        <View style={styles.manifestHeading}>
          <Text style={s.label}>// SYSTEM HARDWARE MANIFEST</Text>
          <Text style={styles.total}>TOTAL: 120 UNITS</Text>
        </View>
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
            <Pressable key={drone.id} accessibilityRole="button" accessibilityLabel={`View ${drone.id}`} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.rowTop}>
                <View style={styles.identity}>
                  <Text style={styles.droneId}>{drone.id}</Text>
                  <Text style={styles.rfid}>{drone.rfid}</Text>
                </View>
                <StateBadge state={drone.state} />
              </View>
              <View style={styles.telemetry}>
                <Text style={styles.telemetryLabel}>BATTERY TELEMETRY</Text>
                <Text style={[styles.battery, drone.state === 'SERVICE' && styles.criticalBattery]}>{drone.battery}</Text>
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
  manifestHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 },
  total: { color: colors.cyan, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  search: { color: colors.text, fontFamily: monoFont, fontSize: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 3, minHeight: 42, paddingHorizontal: 12, marginBottom: 14 },
  list: { gap: 8 },
  row: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 10, minHeight: 76 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  identity: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexShrink: 1 },
  droneId: { color: colors.text, fontFamily: monoFont, fontSize: 12, fontWeight: '700' },
  rfid: { color: colors.muted, fontFamily: monoFont, fontSize: 8 },
  state: { borderWidth: 1, borderRadius: 3, fontFamily: monoFont, fontSize: 8, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 4 },
  active: { color: '#041A15', borderColor: colors.green, backgroundColor: colors.green },
  standby: { color: '#001A20', borderColor: colors.cyan, backgroundColor: colors.cyan },
  service: { color: '#231700', borderColor: colors.gold, backgroundColor: colors.gold },
  telemetry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, paddingTop: 7, borderTopWidth: 1, borderColor: '#1A2636' },
  telemetryLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 8 },
  battery: { color: colors.text, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  criticalBattery: { color: colors.error },
  empty: { paddingVertical: 24, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
