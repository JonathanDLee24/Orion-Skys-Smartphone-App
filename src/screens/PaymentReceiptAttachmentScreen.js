import React, { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const contract = {
  id: 'CTR-SF-2026-014',
  event: 'Neon Lights Festival',
  client: 'Apex Global Corp',
  total: '$4,674.00',
};

const initialHistory = [
  { id: 'created', time: 'NOV 18, 2026 · 14:02', message: 'Contract record created', actor: 'SYSTEM' },
  { id: 'verified', time: 'NOV 18, 2026 · 14:05', message: 'Event and client association verified', actor: 'ADMIN' },
];

export default function PaymentReceiptAttachmentScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const adminMode = route?.params?.adminMode === true;
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState(initialHistory);

  async function attachReceipt() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['application/pdf', 'image/*'],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    setReceipt(file);
    setHistory((entries) => [
      { id: `attached-${Date.now()}`, time: 'NOV 20, 2026 · 09:41', message: `Receipt attached: ${file.name}`, actor: 'SALIMAN NOORI' },
      ...entries,
    ]);
  }

  return (
    <ScreenLayout
      caption="ADMIN OPERATIONS / CONTRACTS"
      label={`CONTRACT // ${contract.id}`}
      title="Payment Receipt"
      headerBadge="● ONLINE"
      secure
      showProgress={false}
      onLogoPress={() => navigation.navigate(adminMode ? 'AdminDashboard' : 'Welcome')}
      onBack={() => (adminMode ? navigation.navigate('AdminContracts') : navigation.goBack())}
      backLabel="BACK"
      footer={<PrimaryButton testID="attach-receipt" title={receipt ? 'Replace receipt' : 'Attach itemized receipt'} onPress={attachReceipt} leadingIcon={<Text style={styles.uploadIcon}>↑</Text>} />}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        <View testID="contract-record" style={[s.card, styles.contractCard]}>
          <View style={styles.cardHeader}>
            <Text style={[s.label, styles.sectionLabel]}>// CONTRACT & EVENT RECORD</Text>
            <Text style={styles.recordStatus}>● VERIFIED</Text>
          </View>
          <InfoRow label="EVENT" value={contract.event} />
          <InfoRow label="CLIENT" value={contract.client} />
          <InfoRow label="CONTRACT TOTAL" value={contract.total} />
        </View>

        <View testID="receipt-status" accessibilityRole="status" style={[styles.statusCard, receipt ? styles.successCard : styles.missingCard]}>
          <View style={[styles.statusIcon, receipt ? styles.successIcon : styles.missingIcon]}>
            <Text style={styles.statusIconText}>{receipt ? '✓' : '!'}</Text>
          </View>
          <View style={styles.statusCopy}>
            <Text style={[styles.statusTitle, receipt ? styles.successText : styles.missingText]}>
              {receipt ? 'RECEIPT ATTACHED' : 'MISSING RECEIPT'}
            </Text>
            <Text style={styles.statusBody}>
              {receipt ? 'The receipt is linked to this contract and event record.' : 'Attach an itemized receipt before compiling the show dossier.'}
            </Text>
          </View>
        </View>

        {receipt && (
          <View testID="receipt-file" style={[s.card, styles.fileCard]}>
            <View style={styles.fileIcon}><Text style={styles.fileIconText}>PDF</Text></View>
            <View style={styles.fileCopy}>
              <Text style={styles.fileName}>{receipt.name}</Text>
              <Text style={styles.fileMeta}>{receipt.size ? `${Math.ceil(receipt.size / 1024)} KB · ` : ''}AVAILABLE FOR DOSSIER COMPILATION</Text>
            </View>
            <Text style={styles.fileCheck}>✓</Text>
          </View>
        )}

        <View testID="dossier-availability" style={[styles.availability, receipt ? styles.available : styles.unavailable]}>
          <Text style={[styles.availabilityLabel, receipt ? styles.successText : styles.missingText]}>DOSSIER AVAILABILITY</Text>
          <Text style={styles.availabilityValue}>{receipt ? 'READY FOR COMPILATION' : 'WAITING FOR RECEIPT'}</Text>
        </View>

        <Text style={[s.label, styles.auditLabel]}>// AUDIT TRAIL</Text>
        <View testID="receipt-audit" style={[s.card, styles.auditCard]}>
          {history.map((entry) => (
            <View key={entry.id} style={styles.auditRow}>
              <View style={styles.auditDot} />
              <View style={styles.auditCopy}>
                <Text style={styles.auditMessage}>{entry.message}</Text>
                <Text style={styles.auditMeta}>{entry.actor} · {entry.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScreenLayout>
  );
}

function InfoRow({ label, value }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  wideContent: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  contractCard: { borderColor: colors.accent },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { color: colors.accent, marginBottom: 0 },
  recordStatus: { color: colors.green, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 9, borderTopWidth: 1, borderColor: colors.border },
  infoLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9 },
  infoValue: { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 7, padding: 14, marginBottom: 14 },
  successCard: { backgroundColor: '#04241C', borderColor: colors.green },
  missingCard: { backgroundColor: '#231700', borderColor: colors.gold },
  statusIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  successIcon: { backgroundColor: colors.green },
  missingIcon: { backgroundColor: colors.gold },
  statusIconText: { color: colors.background, fontFamily: monoFont, fontSize: 17, fontWeight: '800' },
  statusCopy: { flex: 1 },
  statusTitle: { fontFamily: monoFont, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  successText: { color: colors.green },
  missingText: { color: colors.gold },
  statusBody: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: colors.green },
  fileIcon: { width: 42, height: 42, borderWidth: 1, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  fileIconText: { color: colors.green, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  fileCopy: { flex: 1 },
  fileName: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  fileMeta: { color: colors.muted, fontFamily: monoFont, fontSize: 8 },
  fileCheck: { color: colors.green, fontSize: 20, fontWeight: '700' },
  availability: { borderWidth: 1, borderRadius: 5, padding: 12, marginBottom: 22 },
  available: { borderColor: '#1F6B57', backgroundColor: '#071B16' },
  unavailable: { borderColor: '#6B5200', backgroundColor: '#171200' },
  availabilityLabel: { fontFamily: monoFont, fontSize: 9, fontWeight: '700', marginBottom: 5 },
  availabilityValue: { color: colors.text, fontFamily: monoFont, fontSize: 10 },
  auditLabel: { color: colors.accent, marginBottom: 8 },
  auditCard: { paddingVertical: 4 },
  auditRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  auditDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 4 },
  auditCopy: { flex: 1 },
  auditMessage: { color: colors.text, fontSize: 11, marginBottom: 3 },
  auditMeta: { color: colors.muted, fontFamily: monoFont, fontSize: 8 },
  uploadIcon: { color: colors.background, fontSize: 20, fontWeight: '800', lineHeight: 20 },
});
