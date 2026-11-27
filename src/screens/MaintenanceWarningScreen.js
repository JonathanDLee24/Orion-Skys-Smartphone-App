import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const drone = { id: 'SF-Q-004', rfid: 'RFID: 900-11A3', hours: 120.4, threshold: 120, lastService: 'OCT 14, 2026' };

export default function MaintenanceWarningScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const adminMode = route?.params?.adminMode === true;
  const [status, setStatus] = useState('ACTION REQUIRED');

  const overdue = Math.max(0, drone.hours - drone.threshold).toFixed(1);
  const scheduled = status === 'SCHEDULED';

  return (
    <ScreenLayout
      caption={adminMode ? 'ADMIN OPERATIONS / FLIGHT EQUIPMENT' : 'EMPLOYEE OPERATIONS / FLIGHT EQUIPMENT'}
      label={`MAINTENANCE // ${drone.id}`}
      title="Maintenance Warning"
      headerBadge="● ONLINE"
      headerTone="gold"
      secure
      showProgress={false}
      onLogoPress={() => navigation.navigate(adminMode ? 'AdminDashboard' : 'Welcome')}
      onBack={() => (adminMode ? navigation.navigate('AdminDashboard') : navigation.goBack())}
      backLabel="BACK"
      footer={<PrimaryButton testID="maintenance-action" title={scheduled ? 'Maintenance scheduled' : 'Mark maintenance scheduled'} disabled={scheduled} onPress={() => setStatus('SCHEDULED')} />}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        <View testID="maintenance-warning" accessibilityRole="alert" style={styles.warningCard}>
          <View style={styles.warningIcon}><Text style={styles.warningIconText}>!</Text></View>
          <View style={styles.warningCopy}>
            <Text style={styles.warningTitle}>PREVENTATIVE MAINTENANCE DUE</Text>
            <Text style={styles.warningBody}>{drone.id} has crossed its configured flight-hour threshold by {overdue} hours.</Text>
          </View>
        </View>

        <View testID="drone-maintenance-details" style={[s.card, styles.detailCard]}>
          <View style={styles.cardHeader}>
            <Text style={[s.label, styles.sectionLabel]}>// AFFECTED DRONE</Text>
            <Text style={[styles.stateBadge, scheduled ? styles.scheduledBadge : styles.requiredBadge]}>{status}</Text>
          </View>
          <View style={styles.droneHeading}>
            <Text style={styles.droneId}>{drone.id}</Text>
            <Text style={styles.rfid}>{drone.rfid}</Text>
          </View>
          <MetricRow label="CUMULATIVE FLIGHT HOURS" value={`${drone.hours.toFixed(1)} HRS`} highlight />
          <MetricRow label="MAINTENANCE THRESHOLD" value={`${drone.threshold.toFixed(1)} HRS`} />
          <MetricRow label="LAST SERVICE" value={drone.lastService} />
        </View>

        <View testID="maintenance-follow-up" style={[styles.followUp, scheduled ? styles.followUpScheduled : styles.followUpRequired]}>
          <Text style={styles.followUpLabel}>FOLLOW-UP STATUS</Text>
          <Text style={[styles.followUpValue, scheduled ? styles.scheduledText : styles.requiredText]}>{scheduled ? 'SCHEDULED FOR SERVICE' : 'ACTION REQUIRED BY MAINTENANCE STAFF'}</Text>
          <Text style={styles.followUpBody}>{scheduled ? 'The maintenance team can now see this warning in the service queue.' : 'Do not load this airframe for the next show until service is scheduled.'}</Text>
        </View>

        <Text style={[s.label, styles.auditLabel]}>// MAINTENANCE RECORD</Text>
        <View testID="maintenance-audit" style={[s.card, styles.auditCard]}>
          <AuditRow time="OCT 14, 2026 · 10:12" message="Preventative threshold configured" actor="FLEET ADMIN" />
          <AuditRow time="NOV 20, 2026 · 09:41" message={`${drone.hours.toFixed(1)} flight hours recorded; warning raised`} actor="TELEMETRY" />
          {scheduled && <AuditRow time="NOV 20, 2026 · 09:41" message="Maintenance service scheduled" actor="SALIMAN NOORI" />}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="View maintenance policy" onPress={() => {}} style={({ pressed }) => [styles.policyLink, pressed && styles.pressed]}>
          <Text style={styles.policyText}>View preventative-maintenance policy →</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

function MetricRow({ label, value, highlight }) {
  return <View style={styles.metricRow}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, highlight && styles.metricHighlight]}>{value}</Text></View>;
}

function AuditRow({ time, message, actor }) {
  return <View style={styles.auditRow}><View style={styles.auditDot} /><View style={styles.auditCopy}><Text style={styles.auditMessage}>{message}</Text><Text style={styles.auditMeta}>{actor} · {time}</Text></View></View>;
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  wideContent: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  warningCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#171200', borderWidth: 1, borderColor: colors.gold, borderRadius: 7, padding: 14, marginBottom: 14 },
  warningIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  warningIconText: { color: colors.background, fontFamily: monoFont, fontSize: 17, fontWeight: '800' },
  warningCopy: { flex: 1 },
  warningTitle: { color: colors.gold, fontFamily: monoFont, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  warningBody: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  detailCard: { borderColor: colors.gold },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLabel: { color: colors.gold, marginBottom: 0 },
  stateBadge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3, fontFamily: monoFont, fontSize: 8, fontWeight: '700' },
  requiredBadge: { color: colors.gold, borderColor: colors.gold },
  scheduledBadge: { color: colors.green, borderColor: colors.green },
  droneHeading: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 12 },
  droneId: { color: colors.text, fontFamily: monoFont, fontSize: 20, fontWeight: '700' },
  rfid: { color: colors.muted, fontFamily: monoFont, fontSize: 10 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderColor: colors.border, paddingVertical: 10 },
  metricLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9 },
  metricValue: { color: colors.text, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  metricHighlight: { color: colors.gold },
  followUp: { borderWidth: 1, borderRadius: 5, padding: 12, marginBottom: 22 },
  followUpRequired: { backgroundColor: '#171200', borderColor: '#6B5200' },
  followUpScheduled: { backgroundColor: '#071B16', borderColor: '#1F6B57' },
  followUpLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, marginBottom: 5 },
  followUpValue: { fontFamily: monoFont, fontSize: 10, fontWeight: '700', marginBottom: 5 },
  requiredText: { color: colors.gold },
  scheduledText: { color: colors.green },
  followUpBody: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  auditLabel: { color: colors.accent, marginBottom: 8 },
  auditCard: { paddingVertical: 4 },
  auditRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  auditDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold, marginTop: 4 },
  auditCopy: { flex: 1 },
  auditMessage: { color: colors.text, fontSize: 11, marginBottom: 3 },
  auditMeta: { color: colors.muted, fontFamily: monoFont, fontSize: 8 },
  policyLink: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  policyText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
