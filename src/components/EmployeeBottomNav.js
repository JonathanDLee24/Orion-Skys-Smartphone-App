import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import EmployeeIcon from './EmployeeIcon';
import { colors, monoFont, useResponsiveLayout } from '../theme';

// Shared employee portal navigation so every tab screen routes the same way and
// marks the tab it is currently showing.
export default function EmployeeBottomNav({ active = 'HOME', onHome, onSchedule, onEvents, onAccount }) {
  const layout = useResponsiveLayout();
  const items = [
    { label: 'HOME', icon: 'home', onPress: onHome },
    { label: 'SCHEDULE', icon: 'schedule', onPress: onSchedule },
    { label: 'EVENTS', icon: 'events', onPress: onEvents },
    { label: 'ACCOUNT', icon: 'account', onPress: onAccount },
  ];
  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      <View style={styles.navItems}>
        {items.map((item) => {
          const selected = item.label === active;
          const color = selected ? colors.accent : colors.muted;
          return (
            <Pressable
              key={item.label}
              accessibilityRole="tab"
              accessibilityLabel={`${item.label} navigation`}
              accessibilityState={{ selected }}
              onPress={item.onPress}
              style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
            >
              <EmployeeIcon type={item.icon} color={color} />
              <Text style={[styles.navLabel, { color }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {Platform.OS === 'web' && !layout.wide && <View style={styles.homeIndicator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: { width: '100%', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingTop: 6, paddingBottom: 8 },
  navItems: { width: '100%', maxWidth: 560, flexDirection: 'row', justifyContent: 'space-around' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 56 },
  navLabel: { fontFamily: monoFont, fontSize: 9, letterSpacing: 0.4 },
  homeIndicator: { width: 150, height: 6, borderRadius: 4, backgroundColor: colors.muted, opacity: 0.9, marginTop: 4 },
  pressed: { opacity: 0.72 },
});
