import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import SignaturePad from '../components/SignaturePad';
import Toast from '../components/Toast';
import {
  countPoints,
  formatSignatureTimestamp,
  formatVerificationDate,
  getCredentialProfile,
  hasSignature,
  signatureErrorMessage,
  submitSignature,
} from '../services/signOffService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function ProfileRow({ label, value, testID }) {
  const s = useScreenStyles();
  return (
    <View style={styles.profileRow}>
      <Text style={s.label}>{label}</Text>
      <Text testID={testID} accessibilityLabel={`${label}: ${value}`} style={styles.profileValue}>{value}</Text>
    </View>
  );
}

export default function ClientSignOffScreen({ route, navigation }) {
  const s = useScreenStyles();
  const layout = useResponsiveLayout();
  const profile = useMemo(() => getCredentialProfile(route?.params?.profile), [route?.params?.profile]);
  const [strokes, setStrokes] = useState([]);
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState(null);
  const [toast, setToast] = useState('');

  const signed = Boolean(record);
  const verificationDate = formatVerificationDate(profile.verifiedAt);
  // A drawn signature wins when both inputs contain something, so the saved
  // method always matches what the signer actually drew.
  const signatureMode = countPoints(strokes) > 0 ? 'draw' : 'keypad';
  const signatureReady = hasSignature({ mode: signatureMode, strokes, typedName });

  function clearSignature() {
    setStrokes([]);
    setTypedName('');
    setError('');
  }

  function updateStrokes(next) {
    setStrokes(next);
    setError('');
  }

  function updateTypedName(value) {
    setTypedName(value);
    setError('');
  }

  async function sign() {
    if (signed || saving) return;
    if (!signatureReady) {
      setError('Please draw or type your signature before submitting.');
      return;
    }
    setSaving(true);
    try {
      const saved = await submitSignature({ profile, mode: signatureMode, strokes, typedName });
      setRecord(saved);
      setError('');
      setToast(`Signature saved · ${formatSignatureTimestamp(saved.timestamp)}`);
    } catch (err) {
      setError(err.message || signatureErrorMessage(signatureMode));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / AUTHORIZATION"
      label="AUTHORIZATION // SIGN-OFF"
      title="Client sign-off."
      badge="● CLIENT"
      onBack={() => navigation.navigate('Dashboard')}
      backLabel="Back to dashboard"
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={
        <PrimaryButton
          testID="submit-sign"
          title="Submit & Sign"
          disabled={signed || !signatureReady}
          loading={saving}
          onPress={sign}
        />
      }
      overlay={<Toast message={toast} onHide={() => setToast('')} />}
    >
      <View style={[s.card, layout.wide && styles.wideCard]}>
        <View style={styles.cardHeader}>
          <Text style={s.label}>// CREDENTIAL PROFILE</Text>
          <Text style={styles.verifiedBadge}>VERIFIED</Text>
        </View>
        <ProfileRow label="SIGNER NAME" value={profile.signerName} testID="credential-signer-name" />
        <View style={s.divider} />
        <ProfileRow label="TITLE" value={profile.title} testID="credential-title" />
        <View style={s.divider} />
        <ProfileRow label="COMPANY" value={profile.company} testID="credential-company" />
        <View style={s.divider} />
        <ProfileRow label="VERIFICATION DATE" value={verificationDate} testID="credential-verification-date" />
        <Text style={[s.body, styles.readOnlyNote]}>
          These details are pre-filled from the verified authorization record and cannot be edited here.
        </Text>
      </View>

      {signed ? (
        <View style={[s.card, styles.receiptCard]} accessibilityRole="alert">
          <Text style={s.label}>// SIGNATURE ON FILE</Text>
          <Text style={styles.receiptTitle}>Authorization signed</Text>
          <ProfileRow label="SIGNED BY" value={`${record.signerName} · ${record.title}`} testID="signed-by" />
          <View style={s.divider} />
          <ProfileRow label="METHOD" value={record.signatureType === 'draw' ? 'Drawn signature' : 'Keypad input'} testID="signed-method" />
          <View style={s.divider} />
          <ProfileRow label="SIGNED AT" value={formatSignatureTimestamp(record.timestamp)} testID="signed-timestamp" />
          <View style={s.divider} />
          <ProfileRow label="RECORD ID" value={record.id} testID="signed-record-id" />
        </View>
      ) : null}

      <View style={s.card}>
        <View style={styles.cardHeader}>
          <Text style={s.label}>// AUTHORIZED SIGNATURE</Text>
          <Text accessibilityLiveRegion="polite" style={styles.modeStatus}>
            {signatureReady ? 'SIGNATURE CAPTURED' : 'AWAITING SIGNATURE'}
          </Text>
        </View>
        <Text style={[s.body, styles.helpText]}>
          Draw your signature by touch, or type your full legal name below. Either method can be submitted.
        </Text>

        <Text style={styles.fieldLabel}>SIGNATURE PAD</Text>
        <SignaturePad
          testID="signature-pad"
          strokes={strokes}
          onChange={updateStrokes}
          disabled={signed}
          placeholder="Draw your signature here"
        />

        <View style={styles.nameField}>
          <Text style={styles.fieldLabel}>TYPE FULL NAME</Text>
          <TextInput
            testID="typed-signature"
            accessibilityLabel="Typed signature"
            accessibilityHint="Type your full legal name to sign, or draw above"
            placeholder="Type your full legal name"
            placeholderTextColor={colors.muted}
            value={typedName}
            editable={!signed}
            onChangeText={updateTypedName}
            autoCapitalize="words"
            autoCorrect={false}
            style={[styles.typedInput, layout.wide && styles.wideTypedInput]}
          />
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}

        {signed ? (
          <Text style={[s.body, styles.lockedNote]}>This authorization is signed and locked. Contact support to amend it.</Text>
        ) : (
          <View style={[styles.actions, layout.wide && styles.wideActions]}>
            <Pressable
              testID="clear-pad"
              accessibilityRole="button"
              accessibilityLabel="Clear Signature"
              onPress={clearSignature}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>Clear Signature</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text style={[s.body, styles.legalNote]}>
        By submitting, you confirm that this signature represents your authorization.
      </Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  wideCard: { padding: 24 },
  verifiedBadge: {
    color: colors.green,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontFamily: monoFont,
    fontSize: 8,
    fontWeight: '700',
  },
  profileRow: { paddingVertical: 6 },
  profileValue: { color: colors.text, fontFamily: monoFont, fontSize: 13, lineHeight: 20, marginTop: 2 },
  readOnlyNote: { marginTop: 10 },
  helpText: { marginBottom: 12 },
  modeStatus: { color: colors.accent, fontFamily: monoFont, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  fieldLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  nameField: { marginTop: 14 },
  typedInput: {
    minHeight: 52,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.field,
    color: colors.text,
    fontSize: 20,
    fontStyle: 'italic',
    fontFamily: 'serif',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  wideTypedInput: { minHeight: 56 },
  errorText: { color: colors.error, fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 10 },
  actions: { flexDirection: 'column', gap: 10, marginTop: 14 },
  wideActions: { flexDirection: 'row' },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryText: { color: colors.text, fontFamily: monoFont, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  pressed: { opacity: 0.7 },
  lockedNote: { marginTop: 12 },
  receiptCard: { borderColor: colors.green },
  receiptTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 4, marginBottom: 10 },
  legalNote: { textAlign: 'center' },
});
