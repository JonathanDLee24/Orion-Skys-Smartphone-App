import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import Toast from '../components/Toast';
import {
  fetchDossierDelivery,
  fetchEventAuditLog,
  fetchEventEmailHistory,
  getOverrideReasonLabel,
  isFailedRecipient,
} from '../services/dossierDeliveryService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function DestinationAction({ label, description, icon, onPress }) {
  const s = useScreenStyles();
  const layout = useResponsiveLayout();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.card, styles.destination, layout.wide && styles.wideDestination, pressed && styles.pressed]}>
      <View style={styles.destinationIcon}><Text style={styles.destinationIconText}>{icon}</Text></View>
      <View style={styles.destinationCopy}><Text style={styles.destinationTitle}>{label}</Text><Text style={s.body}>{description}</Text></View>
      <View style={styles.destinationArrow}><Text style={styles.arrowText}>→</Text></View>
    </Pressable>
  );
}

function Recipients({ recipients, onOverride }) {
  return recipients.map((recipient, index) => {
    const failed = isFailedRecipient(recipient);
    return (
      <View key={`${recipient.type}-${recipient.email}-${index}`} style={styles.row}>
        <View style={styles.recipient}>
          <Text style={styles.role}>{recipient.type}</Text>
          <Text style={styles.email}>{recipient.email}</Text>
          {!!recipient.replacedEmail && <Text style={styles.replaced}>Replaces {recipient.replacedEmail}</Text>}
        </View>
        <View style={styles.statusColumn}>
          <Text style={[styles.status, failed && styles.bounced, recipient.status === 'Resent' && styles.resent]}>{recipient.status || 'Unknown'}</Text>
          {onOverride && (
            <Pressable
              testID={`override-recipient-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Override and resend to ${recipient.type} recipient`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => onOverride(index)}
              style={({ pressed }) => [styles.overrideButton, !failed && styles.overrideButtonQuiet, pressed && styles.pressed]}
            >
              <Text style={[styles.overrideText, !failed && styles.overrideTextQuiet]}>{failed ? 'OVERRIDE & RESEND' : 'RESEND'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  });
}

function AuditLog({ entries }) {
  const s = useScreenStyles();
  if (entries.length === 0) return <Text style={s.body}>No overrides have been recorded for this delivery.</Text>;
  return (
    <View style={s.card}>
      {entries.map((entry, index) => (
        <View key={entry.id} testID="delivery-audit-entry">
          {index > 0 && <View style={[s.divider, styles.auditDivider]} />}
          <View style={styles.auditHeader}>
            <Text style={styles.auditAction}>DISPATCH OVERRIDE{entry.preview ? ' (PREVIEW)' : ''}</Text>
            <Text style={styles.auditTime}>{new Date(entry.at).toLocaleString()}</Text>
          </View>
          <Text style={styles.auditDetail}>
            {entry.previousRecipient.toLowerCase() === entry.newRecipient.toLowerCase()
              ? `${entry.recipientType}: re-sent to ${entry.newRecipient}`
              : `${entry.recipientType}: ${entry.previousRecipient} → ${entry.newRecipient}`}
          </Text>
          <Text style={styles.auditMeta}>REASON: {getOverrideReasonLabel(entry.reason).toUpperCase()}</Text>
          <Text style={styles.auditNotes}>“{entry.notes}”</Text>
          <Text style={styles.auditMeta}>BY {entry.admin.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

export default function DossierDeliveryScreen({ route, navigation }) {
  const s = useScreenStyles();
  const { dossier, deliveryId, overrideId } = route.params;
  const [delivery, setDelivery] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, log] = await Promise.all([fetchDossierDelivery(dossier.id, deliveryId), fetchEventAuditLog(dossier.id, deliveryId)]);
      setDelivery(result);
      setAuditLog(log);
      setError(result ? '' : 'Delivery record not found.');
    } catch (err) { setError('Unable to load delivery status. Please try again.'); }
    finally { setLoading(false); }
  }, [dossier.id, deliveryId]);
  useEffect(() => { load(); }, [load]);
  // Reload when returning from the dispatch override screen.
  useEffect(() => (navigation.addListener ? navigation.addListener('focus', load) : undefined), [navigation, load]);
  useEffect(() => {
    if (!overrideId) return;
    fetchEventAuditLog(dossier.id, deliveryId).then((log) => {
      const entry = log.find((item) => item.id === overrideId);
      if (entry) setToast(`Dossier re-sent to ${entry.newRecipient}`);
    });
  }, [overrideId, dossier.id, deliveryId]);
  const openOverride = (recipientIndex) => navigation.navigate('DispatchOverride', { dossier, deliveryId, recipientIndex });
  return (
    <ScreenLayout caption="ADMIN OPERATIONS / CONTRACTS" label={`DOSSIER: ${dossier.id}`} title="Delivery details" onBack={() => navigation.goBack()} backLabel="Back to dossier" overlay={<Toast message={toast} onHide={() => setToast('')} />}>
      {loading && <Text style={s.body}>Loading delivery status…</Text>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {delivery && (
        <View testID="delivery-details">
          <View accessibilityRole="alert" style={styles.banner}>
            <Text style={styles.bannerTitle}>{delivery.preview ? 'Preview: dossier sent' : 'Dossier sent'}</Text>
            <Text style={styles.copy}>{delivery.preview ? 'Demo only — no email was sent and these statuses are simulated.' : 'The operations package was sent.'}</Text>
          </View>
          <Text style={styles.heading}>{dossier.event}</Text>
          <Text style={styles.copy}>Sent: {new Date(delivery.sentAt).toLocaleString()}</Text>
          <Text style={[s.label, styles.section]}>// RECIPIENT DELIVERY STATUS</Text>
          <View style={s.card}><Recipients recipients={delivery.recipients} onOverride={openOverride} /></View>
          <Text style={[s.label, styles.section]}>// AUDIT LOG</Text>
          <View testID="delivery-audit-log"><AuditLog entries={auditLog} /></View>
          <View style={styles.destinations}>
            <DestinationAction label="Refresh delivery status" description="Check the latest recipient statuses" icon="⟳" onPress={load} />
            <DestinationAction label="View Sent Log" description="Open this event’s email history" icon="▤" onPress={() => navigation.navigate('DossierSentLog', { dossier })} />
          </View>
        </View>
      )}
      {!!error && <View style={styles.destinations}><DestinationAction label="Retry" description="Reload delivery status" icon="⟳" onPress={load} /></View>}
      <View style={styles.destinations}><DestinationAction label="Dismiss" description="Return to the dossier" icon="✕" onPress={() => navigation.goBack()} /></View>
    </ScreenLayout>
  );
}

export function DossierSentLogScreen({ route, navigation }) {
  const s = useScreenStyles();
  const { dossier } = route.params;
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetchEventEmailHistory(dossier.id).then((entries) => { if (active) setHistory(entries); }).catch(() => { if (active) setError('Unable to load email history.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dossier.id]);
  return (
    <ScreenLayout caption="ADMIN OPERATIONS / CONTRACTS" label={`EVENT: ${dossier.id}`} title="Email history" onBack={() => navigation.goBack()} backLabel="Back">
      <Text style={styles.heading}>{dossier.event}</Text>
      {loading && <Text style={s.body}>Loading email history…</Text>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!loading && !error && history.length === 0 && <Text style={s.body}>No sent emails for this event.</Text>}
      {history.map((entry) => <View key={entry.id} style={s.card} testID="sent-log-entry"><Text style={styles.heading}>{entry.preview ? 'Operations package (preview)' : 'Operations package'}</Text><Text style={styles.copy}>Sent: {new Date(entry.sentAt).toLocaleString()}</Text><Recipients recipients={entry.recipients} /></View>)}
      <View style={styles.destinations}><DestinationAction label="Back" description="Return to delivery details" icon="←" onPress={() => navigation.goBack()} /></View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 16, backgroundColor: '#04241C', borderColor: colors.green, borderWidth: 1, borderRadius: 4, marginBottom: 20 },
  bannerTitle: { color: colors.green, fontSize: 18, fontWeight: '700', marginBottom: 5 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  heading: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  section: { marginTop: 22, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10 },
  recipient: { flex: 1 },
  role: { color: colors.muted, fontFamily: monoFont, fontSize: 10, marginBottom: 4 },
  email: { color: colors.text, fontSize: 13 },
  status: { color: colors.green, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  bounced: { color: colors.error },
  resent: { color: colors.cyan },
  replaced: { color: colors.muted, fontSize: 11, marginTop: 2, textDecorationLine: 'line-through' },
  statusColumn: { alignItems: 'flex-end', gap: 6 },
  overrideButton: { borderWidth: 1, borderColor: colors.error, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  overrideText: { color: colors.error, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  overrideButtonQuiet: { borderColor: colors.border },
  overrideTextQuiet: { color: colors.muted },
  auditDivider: { marginVertical: 10 },
  auditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  auditAction: { color: colors.gold, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  auditTime: { color: colors.muted, fontFamily: monoFont, fontSize: 10 },
  auditDetail: { color: colors.text, fontSize: 13, marginBottom: 4 },
  auditNotes: { color: colors.text, fontSize: 12, fontStyle: 'italic', lineHeight: 18, marginVertical: 4 },
  auditMeta: { color: colors.muted, fontFamily: monoFont, fontSize: 10 },
  destinations: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 10 },
  destination: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 92, width: '48%', flexGrow: 1, flexBasis: 145, marginBottom: 0, padding: 12 },
  wideDestination: { flexBasis: 280, minHeight: 104 },
  destinationIcon: { width: 40, height: 40, flexShrink: 0, borderRadius: 10, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  destinationIconText: { color: colors.accent, fontSize: 21, fontWeight: '700' },
  destinationCopy: { flex: 1, minWidth: 0 },
  destinationTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  destinationArrow: { width: 30, height: 30, flexShrink: 0, borderRadius: 15, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: colors.accent, fontSize: 19, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  error: { color: colors.error, marginBottom: 12 },
});