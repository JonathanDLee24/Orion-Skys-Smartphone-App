import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const tabs = [
  { label: 'Scan', icon: 'scan' },
  { label: 'Back', icon: 'back' },
];

function ScanIcon({ color }) {
  return (
    <View style={styles.scanIcon} accessibilityElementsHidden>
      <View style={[styles.iconCorner, styles.scanTopLeft, { borderColor: color }]} />
      <View style={[styles.iconCorner, styles.scanTopRight, { borderColor: color }]} />
      <View style={[styles.iconCorner, styles.scanBottomLeft, { borderColor: color }]} />
      <View style={[styles.iconCorner, styles.scanBottomRight, { borderColor: color }]} />
    </View>
  );
}

function TabIcon({ icon, color }) {
  if (icon === 'scan') return <ScanIcon color={color} />;
  return <Text style={[styles.backIcon, { color }]} accessibilityElementsHidden>←</Text>;
}

export default function QRCodeScannerScreen({ navigation }) {
  const layout = useResponsiveLayout();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={[styles.screen, layout.wide && styles.wideScreen]}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>Staff QR Scanner</Text>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.frameCorner, styles.frameTopLeft]} />
            <View style={[styles.frameCorner, styles.frameTopRight]} />
            <View style={[styles.frameCorner, styles.frameBottomLeft]} />
            <View style={[styles.frameCorner, styles.frameBottomRight]} />
            <View style={styles.scanLine} />
          </View>
          <Text style={styles.instruction}>ALIGN QR CODE</Text>
        </View>

        <View style={styles.controlPanel}>
          <View style={styles.statusRow}>
            <View style={styles.statusTitle}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Ready to Scan</Text>
            </View>
          </View>

          <View style={styles.eventCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Target Event</Text>
              <Text numberOfLines={1} style={styles.infoValue}>Test Event</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Today's Scans</Text>
              <Text style={styles.scanCount}>47 verified</Text>
            </View>
          </View>

          <View style={styles.tabBar} accessibilityRole="tablist">
            {tabs.map((tab) => {
              const isBack = tab.icon === 'back';
              const selected = !isBack;
              const color = selected ? colors.accent : '#98A6BC';
              return (
                <Pressable
                  key={tab.label}
                  accessibilityRole={isBack ? 'button' : 'tab'}
                  accessibilityLabel={tab.label}
                  accessibilityState={isBack ? undefined : { selected }}
                  onPress={isBack ? () => navigation?.navigate('EmployeeDashboard') : undefined}
                  style={({ pressed }) => [
                    styles.tab,
                    selected && styles.selectedTab,
                    pressed && styles.pressed,
                  ]}
                >
                  <TabIcon icon={tab.icon} color={color} />
                  <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#070912',
  },
  screen: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#070912',
  },
  wideScreen: {
    maxWidth: 680,
  },
  header: {
    minHeight: 75,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#243148',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#F5F7FC',
    fontSize: 20,
    fontWeight: '700',
  },
  caption: {
    color: '#91A0B8',
    fontFamily: monoFont,
    fontSize: 12,
    marginTop: 4,
  },
  scanArea: {
    flex: 1,
    minHeight: 270,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05070E',
  },
  scanFrame: {
    width: '62%',
    maxWidth: 280,
    aspectRatio: 1,
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 39,
    height: 39,
    borderColor: '#FFFFFF',
  },
  frameTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
  },
  frameTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
  },
  frameBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
  },
  frameBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: '2%',
    right: '2%',
    height: 4,
    marginTop: -2,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  instruction: {
    color: colors.accent,
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
  },
  controlPanel: {
    flexBasis: '39%',
    minHeight: 320,
    paddingHorizontal: 24,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#243148',
    backgroundColor: '#131D30',
  },
  statusRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#08C995',
    shadowColor: '#08C995',
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 3,
  },
  statusText: {
    color: '#F4F6FB',
    fontSize: 20,
    fontWeight: '700',
  },
  eventBadge: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  eventBadgeText: {
    color: colors.accent,
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: '700',
  },
  eventCard: {
    marginTop: 18,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#293750',
    borderRadius: 7,
    backgroundColor: '#080E1A',
  },
  infoRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    color: '#9BAAC0',
    fontSize: 16,
  },
  infoValue: {
    flex: 1,
    color: '#F2F4F8',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  scanCount: {
    color: colors.accent,
    fontFamily: monoFont,
    fontSize: 15,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 28,
  },
  tab: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 7,
  },
  selectedTab: {
    borderColor: colors.accent,
    backgroundColor: '#103145',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  scanIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  iconCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  scanTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  scanTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  scanBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  scanBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  backIcon: {
    height: 22,
    fontSize: 24,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.72,
  },
});