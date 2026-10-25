import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, monoFont, useResponsiveLayout } from '../theme';

// Mock content for now; the dossier will load from the booking once the document service exists.

const dossier = { id: 'SKY-8902-A', event: 'Neon Lights Festival' };

const DOCUMENT_GROUPS = [
  { key: 'agreement', icon: '▤', title: 'Drone Show Service Agreement', status: 'VERIFIED', count: 1, updated: '2H AGO' },
  { key: 'waivers', icon: '⚇', title: 'Liability Waivers', status: 'PENDING', count: 12, updated: '5M AGO' },
  { key: 'receipts', icon: '▭', title: 'Payment Receipts', status: 'VERIFIED', count: 2, updated: '1D AGO' },
  { key: 'flightPlans', icon: '➤', title: 'FAA Flight Plans', status: 'VERIFIED', count: 4, updated: '12H AGO' },
];

export default function DocumentDossierScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();

  return (
    <ScreenLayout
      caption="EMPLOYEE OPERATIONS / PAYMENTS"
      label={`DOSSIER: ${dossier.id}`}
      title={dossier.event}
      headerBadge="● ONLINE"
      secure
      onBack={() => navigation.navigate('Dashboard')}
      backLabel="Back to account"
      footer={<PrimaryButton title="Reconcile & Generate Complete PDF" onPress={() => Alert.alert('PDF generation coming soon')} />}
    >
      <Text style={[s.label, styles.sectionLabel]}>// COMPILED OPERATIONS PACKAGE</Text>
      <View testID="document-groups" style={[styles.groups, layout.wide && styles.wideGroups]}>
        {DOCUMENT_GROUPS.map((group) => {
          const verified = group.status === 'VERIFIED';
          return (
            <View key={group.key} style={[s.card, layout.wide && styles.wideGroup]}>
              <View style={styles.groupHeader}>
                <Text style={styles.icon}>{group.icon}</Text>
                <Text style={[styles.groupTitle, layout.wide && styles.wideGroupTitle]}>{group.title.toUpperCase()}</Text>
                <Text style={[styles.status, verified ? styles.verified : styles.pending]}>{group.status}</Text>
              </View>
              <View style={[s.divider, styles.divider]} />
              <View style={styles.groupMeta}>
                <Text style={styles.metaText}>{group.count} {group.count === 1 ? 'DOC' : 'DOCS'}</Text>
                <Text style={styles.metaText}>UPDATED: {group.updated}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginBottom: 12 },
  groups: {},
  wideGroups: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  wideGroup: { flexBasis: '45%', flexGrow: 1 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { color: colors.accent, fontSize: 16, width: 18, textAlign: 'center' },
  groupTitle: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' },
  wideGroupTitle: { fontSize: 15 },
  status: { borderWidth: 1, borderRadius: 3, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 2, fontFamily: monoFont, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  verified: { color: colors.green, borderColor: colors.green, backgroundColor: '#04241C' },
  pending: { color: colors.gold, borderColor: colors.gold, backgroundColor: '#231700' },
  divider: { marginVertical: 12 },
  groupMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  metaText: { color: colors.muted, fontFamily: monoFont, fontSize: 10 },
});
