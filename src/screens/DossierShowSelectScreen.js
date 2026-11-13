import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, monoFont, useResponsiveLayout } from '../theme';

// Mock content for now; shows will load from the client's bookings once the document service exists.

const SHOWS = [
  { id: 'SKY-8902-A', event: 'Neon Lights Festival' },
];

export default function DossierShowSelectScreen({ navigation, adminMode = false }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();

  return (
    <ScreenLayout
      caption={adminMode ? 'ADMIN OPERATIONS / CONTRACTS' : 'EMPLOYEE OPERATIONS / PAYMENTS'}
      label={adminMode ? 'ADMIN CONTRACT REVIEW' : 'DOCUMENT REVIEW'}
      title={adminMode ? 'Review contracts' : 'Select a show'}
      onLogoPress={adminMode ? () => navigation.navigate('AdminDashboard') : undefined}
      onBack={() => navigation.navigate(adminMode ? 'AdminDashboard' : 'Dashboard')}
      backLabel={adminMode ? 'Back to admin dashboard' : 'Back to account'}
    >
      <View style={[styles.list, layout.wide && styles.wideList]}>
        <Text style={[s.body, styles.intro]}>Choose a drone show to review its operations documents.</Text>
        <Text style={[s.label, styles.sectionLabel]}>// {String(SHOWS.length).padStart(2, '0')} {SHOWS.length === 1 ? 'SHOW' : 'SHOWS'}</Text>
        <View testID="dossier-shows">
          {SHOWS.map((show) => (
            <Pressable
              key={show.id}
              accessibilityRole="button"
              accessibilityLabel={`Review documents for ${show.event}`}
              onPress={() => navigation.navigate('DocumentDossier', {
                dossier: show,
                ...(adminMode ? { adminMode: true } : {}),
              })}
              style={({ pressed }) => [s.card, pressed && styles.pressed]}
            >
              <Text style={styles.dossierId}>DOSSIER: {show.id}</Text>
              <Text style={[styles.eventName, layout.wide && styles.wideEventName]}>{show.event}</Text>
              <View style={[s.divider, styles.divider]} />
              <View style={styles.review}>
                <Text style={styles.reviewText}>Review documents</Text>
                <Text style={styles.chevron}>→</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenLayout>
  );
}

export function AdminContractsScreen({ navigation }) {
  return <DossierShowSelectScreen navigation={navigation} adminMode />;
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  wideList: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  intro: { marginBottom: 12 },
  sectionLabel: { marginBottom: 12 },
  dossierId: { color: colors.accent, fontFamily: monoFont, fontSize: 10, fontWeight: '700', marginBottom: 6 },
  eventName: { color: colors.text, fontSize: 17, fontWeight: '600' },
  wideEventName: { fontSize: 21 },
  divider: { marginVertical: 12 },
  review: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  chevron: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
