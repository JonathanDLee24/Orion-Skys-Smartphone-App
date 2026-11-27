import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { colors, monoFont } from '../theme';

const ITEMS = [
  ['MAP', 'map'],
  ['AIRSPACE', 'airspace'],
  ['LAANC', 'laanc'],
  ['NOTAM', 'notam'],
  ['PAIR', 'pair'],
];

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

// The five-tab tactical shell shared by the airspace screens. Each screen names
// the tab that is lit so the bar always reflects where the operator is, and can
// optionally handle a tab press to move between sections.
export default function FleetBottomNav({ active = 'AIRSPACE', onSelect }) {
  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      <View style={styles.navItems}>
        {ITEMS.map(([label, icon]) => {
          const selected = label === active;
          return (
            <Pressable
              key={label}
              accessibilityRole="tab"
              accessibilityLabel={`${label} navigation`}
              accessibilityState={{ selected }}
              onPress={onSelect ? () => onSelect(label) : undefined}
              style={({ pressed }) => [styles.navItem, selected && styles.activeNavItem, pressed && styles.pressed]}
            >
              <NavIcon type={icon} active={selected} />
              <Text style={[styles.navLabel, selected && styles.activeNavText]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.homeIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  pressed: { opacity: 0.72 },
});
