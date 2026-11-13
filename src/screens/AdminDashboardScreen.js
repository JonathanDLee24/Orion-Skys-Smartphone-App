import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, useResponsiveLayout } from '../theme';

const OPERATIONS = [
  {
    key: 'shows',
    number: '01',
    title: 'Show operations',
    description: 'Review upcoming shows, booking requests, and completed events.',
    route: 'EmployeeEvents',
  },
  {
    key: 'fleet',
    number: '02',
    title: 'Drone fleet',
    description: 'Search airframes, RFID identifiers, and fleet status.',
    route: 'DroneManifest',
  },
  {
    key: 'check-in',
    number: '03',
    title: 'QR check-in',
    description: 'Scan staff and guest passes for event access.',
    route: 'QRCodeScanner',
  },
  {
    key: 'documents',
    number: '04',
    title: 'Show documents',
    description: 'Access agreements, waivers, receipts, and flight plans.',
    route: 'DossierShowSelect',
  },
];

export default function AdminDashboardScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();

  return (
    <ScreenLayout
      label="ADMIN OPERATIONS"
      title="Operations Dashboard"
      headerBadge="● ADMIN"
      showProgress={false}
      onLogoPress={() => navigation.navigate('Welcome')}
      onAccount={() => navigation.navigate('AccountSettings')}
    >
      <View style={styles.dashboard}>
        <Text style={[s.body, styles.intro]}>
          Your central hub for managing Orion Skys operations.
        </Text>
        <Text style={[s.label, styles.sectionLabel]}>// OPERATIONS CENTER</Text>
        <View testID="admin-operation-links" style={[styles.operations, layout.wide && styles.wideOperations]}>
          {OPERATIONS.map((operation) => (
            <Pressable
              key={operation.key}
              accessibilityRole="button"
              accessibilityLabel={operation.title}
              onPress={() => navigation.navigate(operation.route)}
              style={({ pressed }) => [
                s.card,
                styles.operation,
                layout.wide && styles.wideOperation,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.operationHeader}>
                <Text style={styles.number}>{operation.number}</Text>
                <Text style={styles.arrow}>↗</Text>
              </View>
              <Text style={styles.operationTitle}>{operation.title}</Text>
              <Text style={s.body}>{operation.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  dashboard: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  intro: { marginBottom: 28 },
  sectionLabel: { marginBottom: 12 },
  operations: { gap: 2 },
  wideOperations: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  operation: { minHeight: 142, marginBottom: 14 },
  wideOperation: { width: '48%', flexGrow: 1, flexBasis: 320, marginBottom: 0 },
  operationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  number: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  arrow: { color: colors.accent, fontSize: 20 },
  operationTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  pressed: { opacity: 0.72 },
});
