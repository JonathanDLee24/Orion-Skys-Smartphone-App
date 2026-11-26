import React, { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, monoFont, useResponsiveLayout } from '../theme';
import { droneFleet, findDroneByQrData, isDroneReadyToFly } from '../data/droneFleet';

export default function DronePairingScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const openDroneDetails = (droneId, qrData) => {
    navigation.navigate('DroneDetails', { droneId, qrData });
  };
  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    openDroneDetails(findDroneByQrData(data)?.id, data);
  };

  return (
    <ScreenLayout
      label="DRONE FLEET"
      title="PAIR A DRONE"
      headerBadge="● SCANNER READY"
      showProgress={false}
      onBack={() => navigation.goBack()}
      backLabel="Back to fleet manifest"
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        <Text style={s.body}>Scan a drone QR code to view its identity and flight readiness.</Text>
        <View style={styles.scanner} accessibilityLabel="Drone QR code scanner">
          {permission?.granted ? (
            <>
              <CameraView
                testID="drone-camera-preview"
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />
              <View pointerEvents="none" style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanHint}>ALIGN DRONE QR CODE</Text>
            </>
          ) : (
            <View style={styles.permission}>
              <Text style={styles.permissionText}>Camera access is needed to scan a drone.</Text>
              <Pressable accessibilityRole="button" onPress={requestPermission} style={styles.permissionButton}>
                <Text style={styles.permissionButtonText}>Allow camera</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bypass scanner and view test drone"
          onPress={() => openDroneDetails('SF-Q-001')}
          style={({ pressed }) => [styles.bypassButton, pressed && styles.pressed]}
        >
          <Text style={styles.bypassText}>BYPASS SCANNER · VIEW TEST DRONE</Text>
        </Pressable>

        <View style={styles.fleetHeading}>
          <Text style={styles.sectionTitle}>FLEET FLIGHT READINESS</Text>
          <Text style={styles.count}>{droneFleet.length} DRONES</Text>
        </View>
        <View style={styles.list}>
          {droneFleet.map((drone) => {
            const ready = isDroneReadyToFly(drone);
            return (
              <Pressable
                key={drone.id}
                accessibilityRole="button"
                accessibilityLabel={`View ${drone.id}, ${ready ? 'ready to fly' : 'not ready to fly'}`}
                onPress={() => openDroneDetails(drone.id)}
                style={({ pressed }) => [styles.droneRow, pressed && styles.pressed]}
              >
                <View>
                  <Text style={styles.droneId}>{drone.id}</Text>
                  <Text style={styles.droneState}>{drone.state} · BATTERY {drone.battery}</Text>
                </View>
                <Text style={[styles.readiness, ready ? styles.ready : styles.notReady]}>
                  {ready ? 'READY TO FLY' : 'NOT READY'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: 14 },
  wideContent: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  scanner: {
    height: 260,
    overflow: 'hidden',
    backgroundColor: '#05070E',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: { alignItems: 'center', gap: 12, padding: 20 },
  permissionText: { color: colors.text, textAlign: 'center', fontSize: 14 },
  permissionButton: { backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 10 },
  permissionButtonText: { color: colors.background, fontWeight: '700' },
  scanFrame: { width: 190, height: 190 },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: colors.text },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scanHint: { position: 'absolute', bottom: 12, color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  bypassButton: { minHeight: 48, borderWidth: 1, borderColor: colors.cyan, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  bypassText: { color: colors.cyan, fontFamily: monoFont, fontWeight: '700', fontSize: 10, textAlign: 'center' },
  fleetHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  count: { color: colors.muted, fontFamily: monoFont, fontSize: 9 },
  list: { gap: 8, paddingBottom: 8 },
  droneRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 4, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10 },
  droneId: { color: colors.text, fontFamily: monoFont, fontSize: 12, fontWeight: '700' },
  droneState: { color: colors.muted, fontFamily: monoFont, fontSize: 8, marginTop: 5 },
  readiness: { fontFamily: monoFont, fontSize: 8, fontWeight: '700', textAlign: 'right' },
  ready: { color: colors.green },
  notReady: { color: colors.gold },
  pressed: { opacity: 0.72 },
});
