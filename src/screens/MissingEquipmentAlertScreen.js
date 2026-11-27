import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import {
  getAuditTrail,
  getFlaggedAssets,
  getOpenFollowUps,
  getReadinessStatus,
  logAlertAction,
  openSafetyFollowUp,
  resolveAsset,
} from '../services/equipmentReadinessService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function StatusBadge({ status }) {
  const tone = status === 'MISSING'
    ? styles.missingBadge
    : status === 'FAILED'
      ? styles.failedBadge
      : styles.unverifiedBadge;
  return <Text style={[styles.statusBadge, tone]}>{status}</Text>;
}

export default function MissingEquipmentAlertScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const adminMode = route?.params?.adminMode === true;
  const [version, setVersion] = useState(0);
  const [selectedAssetId, setSelectedAssetId] = useState(route?.params?.assetId || null);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const readiness = useMemo(() => getReadinessStatus(), [version]);
  const assets = useMemo(() => getFlaggedAssets(), [version]);
  const audit = useMemo(() => getAuditTrail(), [version]);
  const openFollowUps = useMemo(() => getOpenFollowUps(), [version]);
  const selectedAsset = assets.find((asset) => asset.assetId === selectedAssetId) || null;

  function refresh() {
    setVersion((value) => value + 1);
  }

  function selectAsset(assetId) {
    setSelectedAssetId(assetId);
    setNote('');
    setFeedback('');
    setError('');
  }

  function saveFollowUp() {
    if (!selectedAsset) {
      setError('Select a flagged asset first.');
      return;
    }
    try {
      openSafetyFollowUp(selectedAsset.assetId, { note });
      setFeedback(`Follow-up logged for ${selectedAsset.assetId}. Safety staff have been notified.`);
      setError('');
      setNote('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function resolveSelectedAsset() {
    if (!selectedAsset) {
      setError('Select a flagged asset first.');
      return;
    }
    try {
      resolveAsset(selectedAsset.assetId, {
        resolution: note.trim() || 'Verified on site by safety staff.',
      });
      setFeedback(`${selectedAsset.assetId} is verified and back in the launch manifest.`);
      setError('');
      setNote('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleAlertAction(action) {
    try {
      logAlertAction(action);
      setFeedback(
        action === 'PING'
          ? 'Transceiver ping broadcast to every flagged asset.'
          : 'Local audio beacon triggered for recovery crews.',
      );
      setError('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function goBack() {
    if (adminMode) navigation.navigate('AdminDashboard');
    else navigation.navigate('DroneManifest');
  }

  return (
    <ScreenLayout
      label="SECURITY ALERT"
      title="MISSING HARDWARE DETECTED"
      headerBadge="● CRITICAL"
      headerTone="danger"
      caption="FLIGHT OPERATIONS / EQUIPMENT"
      showProgress={false}
      onLogoPress={adminMode ? () => navigation.navigate('AdminDashboard') : undefined}
      onBack={goBack}
      backLabel={adminMode ? 'Back to admin dashboard' : 'Back to fleet manifest'}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        <View accessibilityRole="alert" style={styles.alertCard}>
          <View style={styles.alertHeading}>
            <Text style={styles.alertGlyph}>⚠</Text>
            <Text style={styles.alertHeadline}>{readiness.headline}</Text>
          </View>
          <View style={styles.alertDivider} />
          <Text style={styles.alertDetail}>{readiness.detail}</Text>
        </View>

        <View style={[styles.readinessCard, !readiness.blocked && styles.readinessClear]}>
          <Text style={styles.sectionLabel}>// SHOW READINESS</Text>
          <Text style={[styles.readinessTitle, !readiness.blocked && styles.readinessTitleClear]}>
            {readiness.blocked ? 'SHOW READINESS LOCKED' : 'SHOW READINESS CLEARED'}
          </Text>
          <Text style={s.body}>
            {readiness.blocked
              ? 'Launch is blocked. Every required asset needs a verified serialized scan and a closed safety follow-up.'
              : 'All required equipment is verified. Launch checks can continue.'}
          </Text>
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {readiness.verifiedCount}/{readiness.requiredCount} VERIFIED
            </Text>
            <Text style={styles.countText}>
              {readiness.missingCount} MISSING · {readiness.failedCount} FAILED · {readiness.unverifiedCount} UNVERIFIED
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ping active transceivers"
            onPress={() => handleAlertAction('PING')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>PING ACTIVE TRANSCEIVERS</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trigger local audio beacon"
            onPress={() => handleAlertAction('BEACON')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>TRIGGER LOCAL AUDIO BEACON</Text>
          </Pressable>
        </View>

        {feedback ? (
          <Text accessibilityRole="alert" style={styles.feedback}>{feedback}</Text>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
        ) : null}

        <Text style={[styles.sectionLabel, styles.registerLabel]}>// TARGET COMPONENT REGISTER</Text>
        {assets.length === 0 ? (
          <Text style={[s.body, styles.empty]}>
            No missing, failed, or unverified assets. Show readiness is clear.
          </Text>
        ) : null}
        {assets.map((asset) => {
          const followUpOpen = openFollowUps.some(
            (followUp) => followUp.assetId === asset.assetId,
          );
          return (
            <Pressable
              key={asset.assetId}
              accessibilityRole="button"
              accessibilityLabel={`Open follow-up for ${asset.assetId}`}
              onPress={() => selectAsset(asset.assetId)}
              style={({ pressed }) => [
                styles.assetCard,
                selectedAssetId === asset.assetId && styles.assetCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.assetTop}>
                <View style={styles.assetIdentity}>
                  <Text style={styles.assetId}>{asset.assetId}</Text>
                  <Text style={styles.assetLabel}>{asset.label}</Text>
                </View>
                <StatusBadge status={asset.status} />
              </View>
              <Text style={styles.assetIssue}>{asset.issue}</Text>
              <View style={styles.assetBottom}>
                <Text style={styles.assetMeta}>LAST KNOWN: {asset.lastSeen}</Text>
                <Text style={styles.assetMeta}>BATTERY {asset.battery}</Text>
              </View>
              <Text style={styles.assetAction}>
                {followUpOpen ? 'FOLLOW-UP OPEN · TAP TO UPDATE' : 'NEXT ACTION: LOG SAFETY FOLLOW-UP'}
              </Text>
            </Pressable>
          );
        })}

        {selectedAsset ? (
          <View style={styles.followUpCard}>
            <Text style={styles.sectionLabel}>// SAFETY FOLLOW-UP — {selectedAsset.assetId}</Text>
            <TextInput
              accessibilityLabel="Follow-up note"
              value={note}
              onChangeText={setNote}
              placeholder="CONTAINMENT, RECOVERY STEP, OR SIGN-OFF NOTE"
              placeholderTextColor={colors.muted}
              multiline
              style={styles.noteInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save safety follow-up"
              onPress={saveFollowUp}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>SAVE SAFETY FOLLOW-UP</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark resolved and verify"
              onPress={resolveSelectedAsset}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>MARK RESOLVED & VERIFY</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[s.body, styles.hint]}>
            Select a flagged asset to log a safety follow-up or verify it.
          </Text>
        )}

        <Text style={[styles.sectionLabel, styles.registerLabel]}>// FOLLOW-UP AUDIT TRAIL</Text>
        {audit.map((entry) => (
          <View
            key={entry.id}
            accessibilityLabel={`Audit ${entry.id}`}
            style={styles.auditRow}
          >
            <View style={styles.auditTop}>
              <Text style={styles.auditAction}>{entry.action}</Text>
              <Text style={styles.auditTime}>{entry.at.slice(11, 16)} UTC</Text>
            </View>
            <Text style={styles.auditNote}>
              {entry.assetId ? `${entry.assetId} · ` : ''}{entry.note}
            </Text>
            <Text style={styles.auditActor}>{entry.actor} · {entry.id}</Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 2, paddingBottom: 32 },
  wideContent: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  alertCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
  },
  alertHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertGlyph: { color: colors.error, fontSize: 22, fontWeight: '700' },
  alertHeadline: {
    flex: 1,
    color: colors.error,
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  alertDivider: { height: 1, backgroundColor: 'rgba(255, 59, 48, 0.35)', marginVertical: 12 },
  alertDetail: { color: colors.text, fontSize: 12, lineHeight: 18 },
  readinessCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
  },
  readinessClear: { borderColor: colors.green },
  readinessTitle: {
    color: colors.error,
    fontFamily: monoFont,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 6,
  },
  readinessTitleClear: { color: colors.green },
  sectionLabel: {
    color: colors.muted,
    fontFamily: monoFont,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  countRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  countText: { color: colors.cyan, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  actionRow: { gap: 10, marginBottom: 14 },
  primaryButton: {
    minHeight: 48,
    borderRadius: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  feedback: {
    color: colors.green,
    fontFamily: monoFont,
    fontSize: 10,
    marginBottom: 12,
  },
  error: { color: colors.error, fontSize: 11, marginBottom: 12 },
  registerLabel: { marginTop: 18 },
  empty: { paddingVertical: 20, textAlign: 'center' },
  assetCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    padding: 14,
    marginBottom: 10,
  },
  assetCardSelected: { borderColor: colors.error },
  assetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  assetIdentity: { flex: 1, minWidth: 0 },
  assetId: { color: colors.text, fontFamily: monoFont, fontSize: 13, fontWeight: '700' },
  assetLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, marginTop: 3 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 3,
    fontFamily: monoFont,
    fontSize: 8,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  missingBadge: { color: colors.error, borderColor: colors.error },
  failedBadge: { color: colors.gold, borderColor: colors.gold },
  unverifiedBadge: { color: colors.cyan, borderColor: colors.cyan },
  assetIssue: { color: colors.text, fontSize: 11, lineHeight: 16, marginTop: 10 },
  assetBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#1A2636',
  },
  assetMeta: { color: colors.muted, fontFamily: monoFont, fontSize: 8 },
  assetAction: {
    color: colors.gold,
    fontFamily: monoFont,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 8,
  },
  followUpCard: {
    backgroundColor: '#0B111C',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    padding: 14,
    marginTop: 6,
    marginBottom: 14,
  },
  noteInput: {
    color: colors.text,
    fontFamily: monoFont,
    fontSize: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    borderRadius: 4,
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  hint: { paddingVertical: 6, marginBottom: 10 },
  auditRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    padding: 12,
    marginBottom: 8,
  },
  auditTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  auditAction: { color: colors.cyan, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  auditTime: { color: colors.muted, fontFamily: monoFont, fontSize: 8 },
  auditNote: { color: colors.text, fontSize: 11, lineHeight: 16, marginTop: 6 },
  auditActor: { color: colors.muted, fontFamily: monoFont, fontSize: 8, marginTop: 6 },
  pressed: { opacity: 0.72 },
});
