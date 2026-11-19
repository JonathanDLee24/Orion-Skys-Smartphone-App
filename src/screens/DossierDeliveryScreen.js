import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { fetchDossierDelivery, fetchEventEmailHistory } from '../services/dossierDeliveryService';
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

function Recipients({ recipients }) {
  return recipients.map((recipient, index) => (
    <View key={`${recipient.type}-${recipient.email}-${index}`} style={styles.row}>
      <View style={styles.recipient}>
        <Text style={styles.role}>{recipient.type}</Text>
        <Text style={styles.email}>{recipient.email}</Text>
      </View>
      <Text style={[styles.status, recipient.status === 'Bounced' && styles.bounced]}>{recipient.status || 'Unknown'}</Text>
    </View>
  ));
}

export default function DossierDeliveryScreen({ route, navigation }) {
  const s = useScreenStyles();
  const { dossier, deliveryId } = route.params;
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDossierDelivery(dossier.id, deliveryId);
      setDelivery(result);
      setError(result ? '' : 'Delivery record not found.');
    } catch (err) { setError('Unable to load delivery status. Please try again.'); }
    finally { setLoading(false); }
  }, [dossier.id, deliveryId]);
  useEffect(() => { load(); }, [load]);
  return (
    <ScreenLayout caption="ADMIN OPERATIONS / CONTRACTS" label={`DOSSIER: ${dossier.id}`} title="Delivery details" onBack={() => navigation.goBack()} backLabel="Back to dossier">
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
          <View style={s.card}><Recipients recipients={delivery.recipients} /></View>
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