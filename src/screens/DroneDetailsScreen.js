import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, monoFont } from '../theme';
import { droneFleet, isDroneReadyToFly } from '../data/droneFleet';

export default function DroneDetailsScreen({ navigation, route }) {
  const s = useScreenStyles();
  const { droneId, qrData } = route?.params || {};
  const drone = droneFleet.find((item) => item.id === droneId);
  const ready = drone ? isDroneReadyToFly(drone) : false;

  return (
    <ScreenLayout
      label="DRONE FLEET"
      title="DRONE DETAILS"
      headerBadge={ready ? '● READY TO FLY' : '● NOT READY'}
      headerTone={ready ? 'success' : 'danger'}
      showProgress={false}
      onBack={() => navigation.goBack()}
      backLabel="Back to scanner"
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.identifier}>{drone?.id || 'UNREGISTERED DRONE'}</Text>
          <Text style={s.label}>{drone ? 'FLEET RECORD' : 'NO MATCHING FLEET RECORD'}</Text>
          <View style={s.divider} />
          <DetailRow label="FLIGHT READINESS" value={ready ? 'READY TO FLY' : 'NOT READY TO FLY'} tone={ready ? 'ready' : 'notReady'} />
          <DetailRow label="AIRFRAME STATUS" value={drone?.state || 'UNKNOWN'} />
          <DetailRow label="BATTERY" value={drone?.battery || 'UNKNOWN'} />
          <DetailRow label="RFID" value={drone?.rfid || 'NOT REGISTERED'} />
          {!drone && qrData ? <DetailRow label="SCANNED QR DATA" value={qrData} /> : null}
        </View>
        {!drone && <Text style={s.body}>This QR code is not in the temporary fleet records, so the drone cannot be confirmed ready to fly.</Text>}
        <Text style={s.body}>Readiness is based on the temporary fleet manifest. Live status will be connected when the fleet database is available.</Text>
      </View>
    </ScreenLayout>
  );
}

function DetailRow({ label, value, tone }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tone === 'ready' && styles.ready, tone === 'notReady' && styles.notReady]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: 12, width: '100%', maxWidth: 680, alignSelf: 'center' },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 6, padding: 18, gap: 16 },
  identifier: { color: colors.text, fontFamily: monoFont, fontSize: 21, fontWeight: '700' },
  row: { gap: 5 },
  label: { color: colors.muted, fontFamily: monoFont, fontSize: 9 },
  value: { color: colors.text, fontSize: 14, fontWeight: '600' },
  ready: { color: colors.green },
  notReady: { color: colors.gold },
});
