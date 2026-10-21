import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

function NavIcon({ type, active }) {
  const color = active ? colors.cyan : colors.muted;
  if (Platform.OS === 'web') {
    const stroke = { fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const shape = {
      map: [
        React.createElement('path', { key: 'outline', d: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z', ...stroke }),
        React.createElement('path', { key: 'folds', d: 'M9 3v15M15 6v15', ...stroke }),
      ],
      airspace: [React.createElement('path', { key: 'shield', d: 'M20 13c0 5-3.5 7-8 9-4.5-2-8-4-8-9V5l8-3 8 3v8Z', ...stroke })],
      laanc: [
        React.createElement('path', { key: 'circle', d: 'M19.8 7.5A9 9 0 1 1 17.2 4.6', ...stroke }),
        React.createElement('path', { key: 'check', d: 'm8 12 3 3 9-10', ...stroke }),
      ],
      notam: [React.createElement('path', { key: 'bell', d: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4', ...stroke })],
      pair: [
        React.createElement('rect', { key: 'outer', x: 5, y: 5, width: 14, height: 14, rx: 1, ...stroke }),
        React.createElement('rect', { key: 'inner', x: 9, y: 9, width: 6, height: 6, ...stroke }),
        React.createElement('path', { key: 'pins', d: 'M9 2v3m6-3v3m-6 14v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3', ...stroke }),
      ],
    };
    return React.createElement('svg', { width: 25, height: 25, viewBox: '0 0 24 24', 'aria-hidden': true }, shape[type]);
  }
  if (type === 'map') return <View style={[styles.mapIcon, { borderColor: color }]}><View style={[styles.mapPanel, styles.mapPanelLeft, { borderColor: color }]} /><View style={[styles.mapPanel, styles.mapPanelMiddle, { borderColor: color }]} /><View style={[styles.mapPanel, styles.mapPanelRight, { borderColor: color }]} /></View>;
  if (type === 'airspace') return <View style={[styles.shieldIcon, { borderColor: color }]} />;
  if (type === 'laanc') return <View style={[styles.checkCircle, { borderColor: color }]}><Text style={[styles.checkMark, { color }]}>✓</Text></View>;
  if (type === 'notam') return <View style={[styles.bellIcon, { borderColor: color }]}><View style={[styles.bellClapper, { backgroundColor: color }]} /></View>;
  return <View style={[styles.chipIcon, { borderColor: color }]}><View style={[styles.chipCore, { borderColor: color }]} /><View style={[styles.chipPin, styles.chipPinTop, { backgroundColor: color }]} /><View style={[styles.chipPin, styles.chipPinBottom, { backgroundColor: color }]} /><View style={[styles.chipPin, styles.chipPinLeft, { backgroundColor: color }]} /><View style={[styles.chipPin, styles.chipPinRight, { backgroundColor: color }]} /></View>;
}

function FleetBottomNav() {
  const items = [
    ['MAP', 'map'],
    ['AIRSPACE', 'airspace'],
    ['LAANC', 'laanc'],
    ['NOTAM', 'notam'],
    ['PAIR', 'pair'],
  ];
  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      <View style={styles.navItems}>
        {items.map(([label, icon]) => {
          const active = label === 'AIRSPACE';
          return (
            <Pressable key={label} accessibilityRole="tab" accessibilityLabel={`${label} navigation`} accessibilityState={{ selected: active }} style={({ pressed }) => [styles.navItem, active && styles.activeNavItem, pressed && styles.pressed]}>
              <NavIcon type={icon} active={active} />
              <Text style={[styles.navLabel, active && styles.activeNavText]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.homeIndicator} />
    </View>
  );
}

export default function SerializedDroneManifestScreen() {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return fleet;
    return fleet.filter((drone) => `${drone.id} ${drone.rfid} ${drone.state}`.toLowerCase().includes(value));
  }, [query]);

  return (
    <ScreenLayout label="FLEET REGISTRY" title="DRONE FLEET MANIFEST" headerBadge="● ONLINE" showProgress={false} flushFooter plainFooter footer={<FleetBottomNav />}>
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
  bottomNav: { alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, backgroundColor: '#0B111C', minHeight: 84, paddingTop: 6, paddingBottom: 8 },
  navItems: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', flex: 1 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 56 },
  activeNavItem: {},
  mapIcon: { width: 28, height: 25, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, paddingVertical: 1, borderWidth: 3, borderRadius: 3, transform: [{ skewX: '-8deg' }] },
  mapPanel: { width: 5, borderLeftWidth: 2, borderRightWidth: 2 },
  mapPanelLeft: { transform: [{ skewY: '-16deg' }] },
  mapPanelMiddle: { transform: [{ skewY: '16deg' }] },
  mapPanelRight: { transform: [{ skewY: '-16deg' }] },
  shieldIcon: { width: 25, height: 27, borderWidth: 3, borderRadius: 10, transform: [{ rotate: '45deg' }, { scaleY: 0.9 }] },
  checkCircle: { width: 26, height: 26, borderWidth: 3, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 18, lineHeight: 19, fontWeight: '700' },
  bellIcon: { width: 25, height: 22, borderWidth: 3, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomWidth: 0, marginTop: 2 },
  bellClapper: { position: 'absolute', width: 7, height: 3, borderRadius: 2, bottom: -5, left: 4 },
  chipIcon: { width: 27, height: 27, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  chipCore: { width: 12, height: 12, borderWidth: 2 },
  chipPin: { position: 'absolute', width: 3, height: 5 },
  chipPinTop: { top: -7, left: 7 },
  chipPinBottom: { bottom: -7, left: 7 },
  chipPinLeft: { left: -7, top: 7, width: 5, height: 3 },
  chipPinRight: { right: -7, top: 7, width: 5, height: 3 },
  navLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, letterSpacing: 0.4 },
  activeNavText: { color: colors.cyan },
  homeIndicator: { width: 150, height: 6, borderRadius: 4, backgroundColor: colors.muted, opacity: 0.9, marginTop: 4 },
});
