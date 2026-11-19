import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import EmployeeIcon from './EmployeeIcon';
import { useAccessibilityColors, useTapTargets } from './AccessibilityProvider';
import { colors, monoFont, useResponsiveLayout } from '../theme';

// Shared employee portal navigation so every tab screen routes the same way and
// marks the tab it is currently showing.
export default function EmployeeBottomNav({ active = 'HOME', onHome, onSchedule, onEvents, onAccount }) {
  const layout = useResponsiveLayout();
  const theme = useAccessibilityColors();
  const tapTargets = useTapTargets();
  const items = [
    { label: 'HOME', icon: 'home', onPress: onHome },
    { label: 'SCHEDULE', icon: 'schedule', onPress: onSchedule },
    { label: 'EVENTS', icon: 'events', onPress: onEvents },
    { label: 'ACCOUNT', icon: 'account', onPress: onAccount },
  ];
  return (
    <View style={[styles.bottomNav, { borderColor: theme.border, backgroundColor: theme.background }]} accessibilityRole="tablist">
      <View style={styles.navItems}>
        {items.map((item) => {
          const selected = item.label === active;
          const color = selected ? theme.accent : theme.muted;
          return (
            <Pressable
              key={item.label}
              accessibilityRole="tab"
              accessibilityLabel={`${item.label} navigation`}
              accessibilityState={{ selected }}
              hitSlop={tapTargets.hitSlop}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.navItem,
                tapTargets.largeTargets && styles.largeNavItem,
                pressed && styles.pressed,
              ]}
            >
              <EmployeeIcon type={item.icon} color={color} />
              <Text style={[styles.navLabel, { color }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {Platform.OS === 'web' && !layout.wide && <View style={[styles.homeIndicator, { backgroundColor: theme.muted }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: { width: '100%', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingTop: 6, paddingBottom: 8 },
  navItems: { width: '100%', maxWidth: 560, flexDirection: 'row', justifyContent: 'space-around' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 56 },
  largeNavItem: { minHeight: 72, gap: 8 },
  navLabel: { fontFamily: monoFont, fontSize: 9, letterSpacing: 0.4 },
  homeIndicator: { width: 150, height: 6, borderRadius: 4, backgroundColor: colors.muted, opacity: 0.9, marginTop: 4 },
  pressed: { opacity: 0.72 },
});
