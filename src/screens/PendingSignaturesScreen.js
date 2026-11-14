import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ConfirmDialog from '../components/ConfirmDialog';
import ConfirmationPopup from '../components/ConfirmationPopup';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import {
  formatTimeline,
  getFlightWindowLock,
  getOverallSignatureStatus,
  getRequiredSigners,
  needsReminder,
  resendSignatureRequest,
  SIGNATURE_STATUS,
} from '../services/pendingSignaturesService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

// Warning screen for incomplete sign-offs. Tapping a signer tints the
// compliance alert with that signer's status; tapping it again returns the
// alert to the overall status.

const STATUS_THEME = {
  [SIGNATURE_STATUS.SIGNED]: {
    label: 'SIGNED',
    color: colors.green,
    tint: '#04241C',
    alertTint: '#03140F',
    detail: 'Countersignature received.',
    alertTitle: 'COUNTERSIGNATURE RECEIVED',
    alertIcon: '✓',
  },
  [SIGNATURE_STATUS.PENDING]: {
    label: 'PENDING',
    color: colors.gold,
    tint: '#171200',
    alertTint: '#141000',
    detail: 'Signature requested and still awaiting a response.',
    alertTitle: 'AWAITING COUNTERSIGNATURE',
    alertIcon: '!',
  },
  [SIGNATURE_STATUS.OVERDUE]: {
    label: 'OVERDUE',
    color: colors.error,
    tint: '#240807',
    alertTint: '#1C0605',
    detail: 'Signature is past due and blocking launch.',
    // Only an overdue signature is a blocking audit.
    alertTitle: 'BLOCKING COMPLIANCE AUDIT',
    alertIcon: '!',
  },
};

function StatusBadge({ status, testID }) {
  const theme = STATUS_THEME[status];
  return (
    <Text
      testID={testID}
      style={[styles.badge, { color: theme.color, backgroundColor: theme.tint, borderColor: theme.color }]}
    >
      {theme.label}
    </Text>
  );
}

export default function PendingSignaturesScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const submission = route?.params?.submission || null;
  const adminReturn = route?.params?.adminReturn;
  const signers = getRequiredSigners();
  const timeline = formatTimeline(getFlightWindowLock());
  const [selectedId, setSelectedId] = useState(null);
  const [reminded, setReminded] = useState({});
  const [popup, setPopup] = useState(null);
  // The signer whose reminder is waiting on the confirm dialog.
  const [confirming, setConfirming] = useState(null);

  const selected = signers.find((signer) => signer.id === selectedId) || null;
  const alertStatus = selected ? selected.status : getOverallSignatureStatus(signers);
  const alertTheme = STATUS_THEME[alertStatus];
  const outstanding = signers.filter(needsReminder).length;

  function toggleSelected(id) {
    setSelectedId((current) => (current === id ? null : id));
  }

  function confirmResend() {
    const signer = confirming;
    setConfirming(null);
    if (!signer) return;
    const result = resendSignatureRequest(signer);
    setReminded((current) => ({ ...current, [signer.id]: result.sentAt }));
    setPopup({ message: `Reminder sent to ${signer.name}`, key: result.sentAt });
  }

  function backToAuthorization() {
    navigation.navigate('ShowAuthorization', {
      ...(submission ? { submission } : {}),
      ...(adminReturn ? { adminReturn } : {}),
    });
  }

  return (
    <ScreenLayout
      caption={adminReturn ? 'ADMIN OPERATIONS / BOOKINGS' : 'EMPLOYEE OPERATIONS / BOOKINGS'}
      label="SYSTEM HALT"
      title="Pending Signatures"
      showProgress={false}
      headerTone="danger"
      headerAction={<Text style={styles.warning}>● WARNING</Text>}
      onBack={backToAuthorization}
      backLabel="Back to show authorization"
      onAccount={() => navigation.navigate('AccountSettings')}
      overlay={(
        <>
          <ConfirmDialog
            testID="resend-dialog"
            visible={Boolean(confirming)}
            title="Resend reminder?"
            message={confirming ? `A signature reminder will be sent to ${confirming.name}, ${confirming.role} (${confirming.organization}), at:` : null}
            detail={confirming ? (
              <Text testID="resend-dialog-email" style={styles.dialogEmail}>{confirming.email}</Text>
            ) : null}
            confirmLabel="Resend"
            cancelLabel="Cancel"
            onConfirm={confirmResend}
            onCancel={() => setConfirming(null)}
          />
          <ConfirmationPopup
            testID="reminder-sent-popup"
            message={popup?.message || null}
            showKey={popup?.key}
            onHide={() => setPopup(null)}
          />
        </>
      )}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        <View
          testID="compliance-alert"
          accessibilityRole="alert"
          style={[styles.alert, { borderColor: alertTheme.color, backgroundColor: alertTheme.alertTint }]}
        >
          <View style={styles.alertHeader}>
            <View style={[styles.alertIcon, { borderColor: alertTheme.color }]}>
              <Text style={[styles.alertIconText, { color: alertTheme.color }]}>{alertTheme.alertIcon}</Text>
            </View>
            <Text testID="compliance-alert-title" style={[styles.alertTitle, { color: alertTheme.color }]}>
              {alertTheme.alertTitle}
            </Text>
          </View>
          <Text style={styles.alertBody}>
            Flight window lock is scheduled soon. Launch protocols are inhibited until countersignatures resolve.
          </Text>

          <View testID="compliance-alert-focus" style={[styles.alertFocus, { borderColor: alertTheme.color }]}>
            <Text style={[s.label, styles.alertFocusLabel]}>
              {selected ? 'SELECTED SIGNER' : 'OVERALL STATUS'}
            </Text>
            <Text style={styles.alertFocusText}>
              {selected
                ? `${selected.name} · ${alertTheme.label}`
                : `${outstanding} of ${signers.length} signatures outstanding`}
            </Text>
            <Text style={[s.body, styles.alertFocusDetail]}>
              {selected ? alertTheme.detail : 'Tap a signer to see their status here.'}
            </Text>
          </View>

          <View style={styles.timelineRow}>
            <Text style={s.label}>TIMELINE THRESHOLD:</Text>
            <Text testID="timeline-threshold" style={[styles.timeline, { color: alertTheme.color }]}>{timeline}</Text>
          </View>
        </View>

        <Text style={[s.label, styles.directoryLabel]}>SIGN-OFF DIRECTORY</Text>

        <View testID="sign-off-directory">
          {signers.map((signer) => {
            const theme = STATUS_THEME[signer.status];
            const isSelected = signer.id === selectedId;
            const overdue = signer.status === SIGNATURE_STATUS.OVERDUE;
            const sent = Boolean(reminded[signer.id]);
            // The card is a plain View so the reminder button is a sibling of the
            // select button, not nested inside it (nested <button>s are invalid on web).
            return (
              <View
                key={signer.id}
                style={[
                  s.card,
                  styles.signer,
                  overdue && { borderColor: colors.error },
                  isSelected && { borderColor: theme.color, borderWidth: 2 },
                ]}
              >
                <Pressable
                  testID={`signer-${signer.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${signer.name}, ${signer.role} (${signer.organization}), ${theme.label}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => toggleSelected(signer.id)}
                  style={({ pressed }) => [styles.signerTop, pressed && styles.pressed]}
                >
                  <View style={styles.signerCopy}>
                    <Text style={styles.signerName}>{signer.name}</Text>
                    <Text style={s.body}>{`${signer.role} (${signer.organization})`}</Text>
                  </View>
                  <StatusBadge status={signer.status} testID={`status-${signer.id}`} />
                </Pressable>

                {needsReminder(signer) ? (
                  <>
                    <View style={[s.divider, styles.signerDivider]} />
                    <View style={styles.reminderRow}>
                      <Text style={s.label}>RENOTIFICATION</Text>
                      <Pressable
                        testID={`resend-${signer.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Resend reminder to ${signer.name}`}
                        onPress={() => setConfirming(signer)}
                        style={({ pressed }) => [styles.reminder, pressed && styles.pressed]}
                      >
                        <Text style={styles.reminderText}>
                          {sent ? '✓ Reminder sent' : 'Resend reminder'}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  wideContent: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  warning: { color: colors.error, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  alert: { borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 20 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  alertIcon: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  alertIconText: { fontSize: 11, fontWeight: '900', lineHeight: 13 },
  alertTitle: { flex: 1, fontFamily: monoFont, fontSize: 12, fontWeight: '700' },
  alertBody: { color: colors.text, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  alertFocus: { borderLeftWidth: 2, paddingLeft: 10, marginBottom: 12 },
  alertFocusLabel: { marginBottom: 2 },
  alertFocusText: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  alertFocusDetail: { lineHeight: 17 },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  timeline: { fontFamily: monoFont, fontSize: 14, fontWeight: '700' },
  directoryLabel: { marginBottom: 10 },
  signer: { borderRadius: 8 },
  signerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  signerCopy: { flex: 1, minWidth: 0 },
  signerName: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 3 },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: '700',
  },
  signerDivider: { marginVertical: 12 },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  // Every reminder button looks the same, whatever the signer's status.
  reminder: {
    minHeight: 36,
    borderRadius: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderText: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  dialogEmail: {
    color: colors.accent,
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pressed: { opacity: 0.72 },
});
