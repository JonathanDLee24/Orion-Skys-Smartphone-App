import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Text from '../components/AppText';
import ConfirmDialog from '../components/ConfirmDialog';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import Toast from '../components/Toast';
import { useAccessibilityColors, useTapTargets } from '../components/AccessibilityProvider';
import {
  createReceiptPdfUrl,
  describeAuditEntry,
  downloadArchivedReceiptPdf,
  downloadReceiptPdf,
  fetchDossierReceipt,
  fetchReceiptAuditLog,
  formatReceiptAmount,
  removeDossierReceipt,
  replaceDossierReceipt,
} from '../services/paymentReceiptsService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const FALLBACK_DOSSIER = { id: 'SKY-8902-A', event: 'Neon Lights Festival' };

function showError(message) {
  // React Native Alert has no web implementation; use the browser equivalent.
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert(message);
}

function ReceiptGlyph() {
  return (
    <View style={styles.glyph} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={styles.glyphText}>$</Text>
    </View>
  );
}

function RecordRow({ label, value, valueStyle, icon, last }) {
  const s = useScreenStyles();
  return (
    <>
      <View style={styles.recordRow}>
        <Text style={[s.body, styles.recordLabel]}>{label}</Text>
        <View style={styles.recordValueWrap}>
          {icon ? <Text style={styles.recordIcon}>{icon}</Text> : null}
          <Text style={[styles.recordValue, valueStyle]}>{value}</Text>
        </View>
      </View>
      {!last && <View style={s.divider} />}
    </>
  );
}

function ActionButton({ label, onPress, danger = false, disabled = false, testID }) {
  const theme = useAccessibilityColors();
  const tapTargets = useTapTargets();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={tapTargets.hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        danger ? styles.dangerAction : { backgroundColor: theme.field, borderColor: theme.border },
        tapTargets.style,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.actionText}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

// Embeds the receipt PDF itself. On web the browser's PDF viewer renders it
// in an iframe; native builds need a WebView/PDF package before they can embed.
function EmbeddedPdf({ receipt, dossier }) {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const { url, revoke } = createReceiptPdfUrl(receipt, dossier);
    setPdfUrl(url);
    return revoke;
  }, [receipt, dossier]);

  if (Platform.OS !== 'web') {
    return (
      <View testID="receipt-pdf-unavailable" style={styles.pdfFallback}>
        <Text style={styles.pdfFallbackText}>Embedded PDF preview is not available on this device yet. Use Download to open the receipt.</Text>
      </View>
    );
  }
  if (!pdfUrl) return null;
  // react-native-web renders through react-dom, so a plain iframe works here.
  return React.createElement('iframe', {
    'data-testid': 'receipt-pdf-frame',
    title: receipt.fileName,
    src: `${pdfUrl}#view=FitH`,
    style: { flex: 1, width: '100%', height: '100%', border: 0, borderRadius: 4, backgroundColor: '#FFFFFF' },
  });
}

function ReceiptPreview({ receipt, dossier, onClose }) {
  const theme = useAccessibilityColors();
  const tapTargets = useTapTargets();
  const { height } = useWindowDimensions();
  if (!receipt) return null;
  return (
    <View style={styles.previewLayer}>
      <View style={styles.previewBackdrop}>
        <View testID="receipt-preview" accessibilityViewIsModal style={[styles.previewSheet, { height: Math.round(height * 0.82), backgroundColor: theme.card, borderColor: theme.accent }]}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewFile} numberOfLines={1}>{receipt.fileName}</Text>
            <Pressable
              testID="close-preview"
              accessibilityRole="button"
              accessibilityLabel="Close preview"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, { borderColor: theme.border }, tapTargets.largeTargets && tapTargets.style, pressed && styles.pressed]}
            >
              <Text style={styles.closeText}>✕ CLOSE</Text>
            </Pressable>
          </View>
          <View style={styles.pdfFrame}>
            <EmbeddedPdf receipt={receipt} dossier={dossier} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function PaymentReceiptScreen({ navigation, route }) {
  const s = useScreenStyles();
  const layout = useResponsiveLayout();
  const theme = useAccessibilityColors();
  const dossier = route?.params?.dossier || FALLBACK_DOSSIER;
  const adminMode = route?.params?.adminMode !== false;
  const [receipt, setReceipt] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextReceipt, nextLog] = await Promise.all([fetchDossierReceipt(dossier.id), fetchReceiptAuditLog(dossier.id)]);
      setReceipt(nextReceipt);
      setAuditLog(nextLog);
      setError('');
    } catch (err) {
      setError('Unable to load the payment receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dossier.id]);

  useEffect(() => { load(); }, [load]);

  async function download() {
    setBusy(true);
    try {
      await downloadReceiptPdf(receipt, dossier);
    } catch (err) {
      showError(err.message || 'We could not download the receipt. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadArchived(entry) {
    setBusy(true);
    try {
      await downloadArchivedReceiptPdf(dossier, entry.id);
    } catch (err) {
      showError(err.message || 'We could not download the archived receipt. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function replace() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false, type: 'application/pdf' });
      if (result.canceled || !result.assets?.[0]) return;
      setBusy(true);
      const updated = await replaceDossierReceipt(dossier.id, result.assets[0]);
      setReceipt(updated);
      setAuditLog(await fetchReceiptAuditLog(dossier.id));
      setToast(receipt ? 'Receipt replaced' : 'Receipt attached');
    } catch (err) {
      showError(err.message || 'We could not replace the receipt. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    setConfirmingRemove(false);
    setBusy(true);
    try {
      await removeDossierReceipt(dossier.id);
      setReceipt(null);
      setAuditLog(await fetchReceiptAuditLog(dossier.id));
      setToast('Receipt removed from dossier');
    } catch (err) {
      showError(err.message || 'We could not remove the receipt. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenLayout
      caption={adminMode ? 'ADMIN OPERATIONS / CONTRACTS' : 'EMPLOYEE OPERATIONS / PAYMENTS'}
      label="INVOICE & RECEIPTS"
      title={receipt?.title || 'Payment Receipts'}
      headerBadge="● ONLINE"
      secure
      showProgress={false}
      onLogoPress={adminMode ? () => navigation.navigate('AdminDashboard') : undefined}
      onBack={() => navigation.goBack()}
      backLabel="Back to dossier"
      overlay={(
        <>
          {previewing && <ReceiptPreview receipt={receipt} dossier={dossier} onClose={() => setPreviewing(false)} />}
          <ConfirmDialog
            testID="remove-receipt-dialog"
            visible={confirmingRemove}
            title="Remove receipt?"
            message={receipt ? `${receipt.fileName} will be detached from dossier ${dossier.id}. This is recorded in the audit log.` : null}
            confirmLabel="Remove"
            cancelLabel="Cancel"
            onConfirm={confirmRemove}
            onCancel={() => setConfirmingRemove(false)}
          />
          <Toast message={toast} onHide={() => setToast('')} />
        </>
      )}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        <Text style={[s.label, styles.sectionLabel]}>// DOSSIER: {dossier.id} · {dossier.event.toUpperCase()}</Text>
        {loading && <Text style={s.body}>Loading payment receipt…</Text>}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        {!loading && !error && receipt && (
          <>
            <Pressable
              testID="receipt-file"
              accessibilityRole="button"
              accessibilityLabel={`Download ${receipt.fileName}`}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={download}
              style={({ pressed }) => [s.card, styles.fileCard, pressed && styles.pressed]}
            >
              <ReceiptGlyph />
              <Text style={styles.fileName}>{receipt.fileName}</Text>
            </Pressable>

            <View testID="financial-record" style={s.card}>
              <Text style={[s.label, styles.recordHeading]}>// FINANCIAL RECORD</Text>
              <RecordRow label="Transaction ID" value={receipt.transactionId} valueStyle={styles.mono} />
              <RecordRow label="Amount Paid" value={formatReceiptAmount(receipt.amount, receipt.currency)} valueStyle={[styles.mono, styles.amount]} />
              <RecordRow label="Payment Method" value={receipt.paymentMethod} icon="▭" />
              <RecordRow label="Payer" value={`${receipt.payer.name} (${receipt.payer.role})`} valueStyle={styles.bold} last />
            </View>

            <View style={styles.actions}>
              <ActionButton testID="preview-receipt" label="Preview" disabled={busy} onPress={() => setPreviewing(true)} />
              <ActionButton testID="download-receipt" label="Download" disabled={busy} onPress={download} />
              <ActionButton testID="replace-receipt" label="Replace" disabled={busy} onPress={replace} />
              <ActionButton testID="remove-receipt" label="Remove" danger disabled={busy} onPress={() => setConfirmingRemove(true)} />
            </View>
          </>
        )}

        {!loading && !error && !receipt && (
          <View testID="no-receipt" style={s.card}>
            <Text style={styles.emptyTitle}>No receipt attached</Text>
            <Text style={[s.body, styles.emptyCopy]}>This dossier has no payment receipt. Attach a PDF to restore the financial record.</Text>
            <ActionButton testID="attach-receipt" label="Attach receipt" disabled={busy} onPress={replace} />
          </View>
        )}

        {!loading && !error && (
          <View testID="receipt-audit-log">
            <Text style={[s.label, styles.sectionLabel, styles.auditHeading]}>// AUDIT LOG</Text>
            {auditLog.length === 0 ? (
              <Text style={s.body}>No changes have been made to this receipt.</Text>
            ) : (
              <View style={s.card}>
                {auditLog.map((entry, index) => (
                  <View key={entry.id}>
                    {index > 0 && <View style={[s.divider, styles.auditDivider]} />}
                    <View style={styles.auditRow}>
                      <Text style={[styles.auditAction, entry.action === 'REMOVED' && styles.auditRemoved]}>{entry.action}</Text>
                      <Text style={styles.auditTime}>{new Date(entry.at).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.auditDetail}>{describeAuditEntry(entry)}</Text>
                    <Text style={styles.auditActor}>BY {entry.actor.toUpperCase()}</Text>
                    {entry.archivedReceipt && (
                      <View testID="archived-receipt" style={[styles.archived, { borderColor: theme.border, backgroundColor: theme.field }]}>
                        <View style={styles.archivedCopy}>
                          <Text style={styles.archivedTag}>ARCHIVED · NOT ACTIVE</Text>
                          <Text style={styles.archivedFile} numberOfLines={1}>{entry.archivedReceipt.fileName}</Text>
                        </View>
                        <Pressable
                          testID={`download-archived-${entry.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Download archived ${entry.archivedReceipt.fileName}`}
                          accessibilityState={{ disabled: busy }}
                          disabled={busy}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          onPress={() => downloadArchived(entry)}
                          style={({ pressed }) => [styles.smallButton, { borderColor: theme.border }, busy && styles.disabled, pressed && styles.pressed]}
                        >
                          <Text style={styles.smallButtonText}>↓ DOWNLOAD</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {},
  wideContent: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  sectionLabel: { marginBottom: 12 },
  error: { color: colors.error, marginBottom: 12 },
  fileCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 18 },
  glyph: { width: 40, height: 50, borderWidth: 2, borderColor: colors.green, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  glyphText: { color: colors.green, fontSize: 24, fontWeight: '700' },
  fileName: { color: colors.green, fontFamily: monoFont, fontSize: 12, textAlign: 'center' },
  recordHeading: { marginBottom: 6 },
  recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12 },
  recordLabel: { flexShrink: 0 },
  recordValueWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  recordIcon: { color: colors.text, fontSize: 13 },
  recordValue: { color: colors.text, fontSize: 13, textAlign: 'right', flexShrink: 1 },
  mono: { fontFamily: monoFont },
  amount: { color: colors.green },
  bold: { fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  action: { flexBasis: '45%', flexGrow: 1, minHeight: 44, borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  dangerAction: { backgroundColor: colors.error, borderColor: colors.error },
  actionText: { color: colors.text, fontFamily: monoFont, fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.72 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyCopy: { marginBottom: 14 },
  auditHeading: { marginTop: 18 },
  auditDivider: { marginVertical: 10 },
  auditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  auditAction: { color: colors.gold, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  auditRemoved: { color: colors.error },
  auditTime: { color: colors.muted, fontFamily: monoFont, fontSize: 10 },
  auditDetail: { color: colors.text, fontSize: 13, marginBottom: 2 },
  auditActor: { color: colors.muted, fontFamily: monoFont, fontSize: 10 },
  archived: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8 },
  archivedCopy: { flex: 1, minWidth: 0 },
  archivedTag: { color: colors.muted, fontFamily: monoFont, fontSize: 9, fontWeight: '700', marginBottom: 2 },
  archivedFile: { color: colors.text, fontFamily: monoFont, fontSize: 11 },
  smallButton: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  smallButtonText: { color: colors.text, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  // Spelled out: StyleSheet.absoluteFillObject is not available in this React Native version.
  previewLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 30 },
  previewBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(0, 0, 0, 0.75)' },
  previewSheet: { width: '100%', maxWidth: 760, borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  previewFile: { flex: 1, color: colors.green, fontFamily: monoFont, fontSize: 11 },
  closeButton: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  closeText: { color: colors.text, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  pdfFrame: { flex: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  pdfFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.field },
  pdfFallbackText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
