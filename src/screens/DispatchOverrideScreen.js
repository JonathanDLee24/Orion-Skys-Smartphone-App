import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import DropdownSelect from '../components/DropdownSelect';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { useAccessibilityColors, useTapTargets } from '../components/AccessibilityProvider';
import {
  DEFAULT_OVERRIDE_ADMIN,
  MIN_OVERRIDE_NOTES_LENGTH,
  OVERRIDE_REASONS,
  fetchDossierDelivery,
  isFailedRecipient,
  resendDossierOverride,
  validateDispatchOverride,
} from '../services/dossierDeliveryService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function defaultReason(recipient) {
  if (recipient?.status === 'Bounced') return 'bounced';
  return isFailedRecipient(recipient) ? 'other' : 'resendRequest';
}

// Admin bypass for re-sending a dossier to one recipient, optionally at a new
// address. Failed recipients must get a new address.
// Route params: { dossier, deliveryId, recipientIndex }.
export default function DispatchOverrideScreen({ navigation, route }) {
  const s = useScreenStyles();
  const layout = useResponsiveLayout();
  const theme = useAccessibilityColors();
  const tapTargets = useTapTargets();
  const { dossier, deliveryId, recipientIndex } = route.params;

  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('other');
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState({ email: false, notes: false });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    let active = true;
    fetchDossierDelivery(dossier.id, deliveryId)
      .then((delivery) => {
        if (!active) return;
        const current = delivery?.recipients?.[recipientIndex];
        if (!current) {
          setLoadError('Recipient not found on this delivery.');
          return;
        }
        setRecipient(current);
        setReason(defaultReason(current));
        // A working address is the likely target; a failed one has to change.
        if (!isFailedRecipient(current)) setEmail(current.email);
      })
      .catch(() => { if (active) setLoadError('Unable to load the delivery. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dossier.id, deliveryId, recipientIndex]);

  const failed = isFailedRecipient(recipient);
  const errors = validateDispatchOverride({ email, reason, notes, previousEmail: recipient?.email, previousFailed: failed });
  const showEmailError = (touched.email || submitted) && errors.email;
  const showNotesError = (touched.notes || submitted) && errors.notes;
  const notesLength = notes.trim().length;

  // Closes the screen without sending or recording anything.
  function cancelBypass() {
    navigation.goBack();
  }

  async function send() {
    setSubmitted(true);
    setSendError('');
    if (Object.keys(errors).length) return;
    setSending(true);
    try {
      const { auditEntry } = await resendDossierOverride(dossier.id, deliveryId, { recipientIndex, email, reason, notes });
      const params = { dossier, deliveryId, overrideId: auditEntry.id };
      if (navigation.popTo) navigation.popTo('DossierDelivery', params);
      else navigation.goBack();
    } catch (err) {
      setSendError(err.message || 'The dossier could not be re-sent. Please try again.');
      setSending(false);
    }
  }

  return (
    <ScreenLayout
      caption="ADMIN OPERATIONS / CONTRACTS"
      label={`DISPATCH OVERRIDE // ${dossier.id}`}
      title="Re-send Dossier"
      headerBadge="● BYPASS"
      headerTone="danger"
      showProgress={false}
      onBack={cancelBypass}
      backLabel="Back to delivery details"
      footer={recipient ? (
        <View style={[styles.footer, layout.wide && styles.wideFooter]}>
          <Pressable
            testID="cancel-bypass"
            accessibilityRole="button"
            accessibilityLabel="Cancel Bypass"
            hitSlop={tapTargets.hitSlop}
            onPress={cancelBypass}
            style={({ pressed }) => [styles.cancel, { borderColor: theme.border, backgroundColor: theme.field }, tapTargets.style, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>CANCEL BYPASS</Text>
          </Pressable>
          <View style={styles.sendWrap}>
            <PrimaryButton testID="send-override" title="Re-send dossier" loading={sending} onPress={send} />
          </View>
        </View>
      ) : null}
    >
      <View style={[styles.form, layout.wide && styles.wideForm]}>
        <Text style={styles.event}>{dossier.event}</Text>
        {loading && <Text style={s.body}>Loading delivery…</Text>}
        {!!loadError && (
          <>
            <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text>
            <PrimaryButton title="Back to delivery details" onPress={cancelBypass} />
          </>
        )}

        {recipient && (
          <>
            <View testID="current-recipient" style={[styles.recipientBox, failed ? styles.failed : { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.recipientLabel, failed && styles.failedText]}>
                // {failed ? 'FAILED DELIVERY' : 'CURRENT RECIPIENT'} · {recipient.type.toUpperCase()}
              </Text>
              <View style={styles.recipientRow}>
                <Text style={[styles.recipientEmail, failed && styles.failedEmail]} numberOfLines={1}>{recipient.email}</Text>
                <Text style={[styles.recipientStatus, failed && styles.failedText]}>{String(recipient.status || 'Unknown').toUpperCase()}</Text>
              </View>
              <Text style={styles.copy}>
                {failed
                  ? `Enter a new address. It replaces this ${recipient.type} recipient, and the dossier is re-sent to it.`
                  : `The dossier is re-sent to the address below. Change it to replace this ${recipient.type} recipient.`}
              </Text>
            </View>

            <Text style={styles.label}>Destination email</Text>
            <TextInput
              testID="override-email"
              accessibilityLabel="Destination email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              placeholder="name@example.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              style={[styles.input, { backgroundColor: theme.field, borderColor: showEmailError ? colors.error : theme.border }]}
            />
            {!!showEmailError && <Text testID="override-email-error" accessibilityRole="alert" style={styles.error}>{errors.email}</Text>}

            <Text style={styles.label}>Reason</Text>
            <DropdownSelect testID="override-reason" label="Reason" value={reason} options={OVERRIDE_REASONS} onChange={setReason} />

            <Text style={styles.label}>Audit trail notes</Text>
            <TextInput
              testID="override-notes"
              accessibilityLabel="Audit trail notes"
              multiline
              textAlignVertical="top"
              placeholder="Explain why this delivery is being overridden"
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              onBlur={() => setTouched((prev) => ({ ...prev, notes: true }))}
              style={[styles.input, styles.notes, { backgroundColor: theme.field, borderColor: showNotesError ? colors.error : theme.border }]}
            />
            <View style={styles.notesMeta}>
              {showNotesError
                ? <Text testID="override-notes-error" accessibilityRole="alert" style={[styles.error, styles.notesError]}>{errors.notes}</Text>
                : <Text style={styles.hint}>Required. Saved to the event audit log.</Text>}
              <Text style={styles.hint}>{notesLength}/{MIN_OVERRIDE_NOTES_LENGTH} min</Text>
            </View>

            <Text style={styles.hint}>Recorded as {DEFAULT_OVERRIDE_ADMIN} with the time of sending.</Text>
            {!!sendError && <Text accessibilityRole="alert" style={styles.error}>{sendError}</Text>}
          </>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  wideForm: { maxWidth: 640, alignSelf: 'center' },
  event: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  recipientBox: { padding: 14, borderWidth: 1, borderRadius: 4, marginBottom: 6 },
  failed: { backgroundColor: '#2A0A08', borderColor: colors.error },
  recipientLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 10, fontWeight: '700', marginBottom: 8 },
  recipientRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  recipientEmail: { flex: 1, color: colors.text, fontSize: 14 },
  recipientStatus: { color: colors.green, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  failedEmail: { textDecorationLine: 'line-through' },
  failedText: { color: colors.error },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 7 },
  input: { minHeight: 48, color: colors.text, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontSize: 15 },
  notes: { minHeight: 110, paddingTop: 12, paddingBottom: 12 },
  notesMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginTop: 6, marginBottom: 12 },
  notesError: { flex: 1, marginTop: 0 },
  hint: { color: colors.muted, fontFamily: monoFont, fontSize: 10 },
  error: { color: colors.error, fontSize: 13, marginTop: 6 },
  footer: { flexDirection: 'row', gap: 10 },
  wideFooter: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  cancel: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  cancelText: { color: colors.text, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  sendWrap: { flex: 1 },
  pressed: { opacity: 0.72 },
});
