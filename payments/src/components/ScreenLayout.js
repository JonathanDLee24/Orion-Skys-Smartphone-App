import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function WebStatusBar() {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={styles.status} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={styles.clock}>09:41</Text>
      <View style={styles.statusIcons}>
        <View style={styles.signal}>{[4, 7, 10, 13].map((height) => <View key={height} style={[styles.signalBar, { height }]} />)}</View>
        <View style={styles.wifi}><View style={styles.wifiOuter} /><View style={styles.wifiInner} /><View style={styles.wifiDot} /></View>
        <View style={styles.battery}><View style={styles.batteryFill} /></View>
        <View style={styles.batteryTip} />
      </View>
    </View>
  );
}

export default function ScreenLayout({ label, title, phase, secure = false, onBack, backLabel = 'Back to Airspace Coverage', children, footer }) {
  const layout = useResponsiveLayout();
  return (
    <SafeAreaView style={styles.safe}>
      <View testID="responsive-frame" style={[styles.frame, { maxWidth: layout.maxWidth }]}>
        {!layout.wide && <WebStatusBar />}
        {layout.wide && <View style={[styles.brand, { paddingHorizontal: layout.padding }]}><Text style={styles.brandText}>ORION <Text style={styles.brandAccent}>SKYS</Text></Text><Text style={styles.brandCaption}>CLIENT OPERATIONS / PAYMENTS</Text></View>}
        <View style={[styles.header, { paddingHorizontal: layout.padding }, layout.wide && styles.wideHeader]}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, layout.wide && styles.wideLabel]}>// {label}</Text>
            <Text style={[styles.badge, layout.wide && styles.wideLabel, secure && styles.secure]}>{secure ? '● SECURE' : `PHASE 0${phase}/04`}</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.title, layout.wide && styles.wideTitle]}>{title}</Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel="Booking progress" accessibilityValue={{ min: 1, max: 4, now: phase, text: `Phase ${phase} of 4` }} style={styles.progress}>
            {[1, 2, 3, 4].map((segment) => (
              <View key={segment} testID={`phase-segment-${segment}`} style={[styles.segment, segment <= phase && styles.filledSegment]} />
            ))}
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { padding: layout.padding }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {onBack && (
            <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
              <Text style={[styles.backText, layout.wide && styles.wideBackText]}>← {backLabel}</Text>
            </Pressable>
          )}
          {children}
        </ScrollView>
        <View style={[styles.footer, layout.wide && { paddingHorizontal: layout.padding, paddingVertical: 24 }]}>
          <View style={[styles.footerInner, layout.wide && styles.wideFooterInner]}>{footer}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function useScreenStyles() {
  const layout = useResponsiveLayout();
  return {
    ...screenStyles,
    card: [screenStyles.card, layout.wide && { padding: 24, marginBottom: 24, borderRadius: 10 }],
    label: [screenStyles.label, { fontSize: layout.labelSize, lineHeight: layout.wide ? 20 : 16 }],
    body: [screenStyles.body, { fontSize: layout.bodySize, lineHeight: layout.wide ? 24 : 16 }],
  };
}

export const screenStyles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 7, padding: 14, marginBottom: 14 },
  label: { color: colors.muted, fontFamily: monoFont, fontSize: 10, lineHeight: 16 },
  body: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  divider: { height: 1, backgroundColor: colors.border },
  errorTitle: { color: colors.error, fontSize: 15, fontWeight: '600', marginBottom: 8 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  frame: { flex: 1, width: '100%', alignSelf: 'center', backgroundColor: colors.background },
  brand: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24, borderBottomWidth: 1, borderColor: colors.border },
  brandText: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: 3 },
  brandAccent: { color: colors.cyan },
  brandCaption: { color: colors.muted, fontFamily: monoFont, fontSize: 11, letterSpacing: 1 },
  wideHeader: { paddingTop: 28, paddingBottom: 24 },
  wideTitle: { fontSize: 32, lineHeight: 42 },
  wideLabel: { fontSize: 12 },
  wideBackText: { fontSize: 14 },
  footerInner: { width: '100%' },
  wideFooterInner: { maxWidth: 360, alignSelf: 'flex-end' },
  status: { height: 44, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clock: { color: colors.text, fontFamily: monoFont, fontSize: 12, fontWeight: '700' },
  statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  signal: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 3, backgroundColor: colors.text, borderRadius: 1 },
  wifi: { width: 16, height: 13, alignItems: 'center', overflow: 'hidden' },
  wifiOuter: { position: 'absolute', top: 1, width: 16, height: 15, borderWidth: 2, borderColor: colors.text, borderRadius: 10, borderBottomColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  wifiInner: { position: 'absolute', top: 5, width: 10, height: 10, borderWidth: 2, borderColor: colors.text, borderRadius: 7, borderBottomColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  wifiDot: { position: 'absolute', top: 10, width: 3, height: 3, backgroundColor: colors.text, borderRadius: 2 },
  battery: { width: 21, height: 10, borderWidth: 1, borderColor: colors.text, borderRadius: 3, padding: 1 },
  batteryFill: { flex: 1, backgroundColor: colors.text, borderRadius: 1 },
  batteryTip: { width: 2, height: 4, backgroundColor: colors.text, marginLeft: -4 },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 7 },
  label: { color: colors.cyan, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  badge: { color: colors.cyan, borderColor: colors.cyan, borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, fontFamily: monoFont, fontSize: 8 },
  secure: { borderWidth: 0, paddingHorizontal: 0 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', lineHeight: 24 },
  back: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', marginTop: -10, marginBottom: 8 },
  backText: { color: colors.cyan, fontSize: 12 },
  backPressed: { opacity: 0.7 },
  progress: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 2, backgroundColor: colors.border },
  filledSegment: { backgroundColor: colors.cyan },
  scroll: { flex: 1 },
  content: { padding: 18, flexGrow: 1 },
  footer: { backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 26 },
});
