import { StyleSheet, Text, View } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { getDroneUsage } from '../services/droneUsageService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function formatMissionDate(date) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).replace(',', '').toUpperCase();
}

export default function DroneUsageScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const droneID = route?.params?.droneID || 'D1';
  const droneName = route?.params?.droneName || 'Drone D-0';
  const usage = getDroneUsage(droneID);
  const maintenanceRemaining = usage.nextMaintenanceInHours ?? 0;

  return (
    <ScreenLayout
      hideBrand
      compactHeader
      label="UNIT ANALYSIS"
      title={`${droneName.toUpperCase()} METRICS`}
      headerTone="success"
      showProgress={false}
      backLabel="Back"
      onBack={() => navigation?.goBack?.()}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        <View style={styles.metrics}>
          <View style={[styles.metricCard, layout.wide && styles.wideMetricCard]}>
            <Text style={styles.metricLabel}>TOTAL LOGGED</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{usage.hours.toFixed(1)}</Text>
              <Text style={styles.metricUnit}>HRS</Text>
            </View>
          </View>
          <View style={[styles.metricCard, layout.wide && styles.wideMetricCard]}>
            <Text style={styles.metricLabel}>MONTH FLIGHTS</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{usage.numFlights}</Text>
              <Text style={styles.metricUnit}>MISSIONS</Text>
            </View>
          </View>
        </View>

        <View style={styles.maintenanceCard}>
          <Text style={styles.sectionLabel}>// MAINTENANCE SERVICE TIMELINE</Text>
          <View style={styles.maintenanceTitleRow}>
            <Text style={styles.maintenanceTitle}>Next Overhaul</Text>
            <Text style={styles.maintenanceRemaining}>{maintenanceRemaining.toFixed(1)} hrs remaining</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.register}>
          <Text style={styles.sectionLabel}>// MISSION FLIGHT REGISTER</Text>
          {usage.missions.map((mission) => (
            <View
              key={mission.missionID}
              accessibilityLabel={`${mission.missionName}, ${mission.totalFlightTimeMins} minutes`}
              style={styles.missionRow}
            >
              <View style={styles.missionDateBlock}>
                <Text style={styles.missionDate}>{formatMissionDate(mission.date)}</Text>
                <Text style={styles.missionName}>{mission.missionName}</Text>
              </View>
              <View style={styles.missionStatusBlock}>
                <Text style={styles.flightTime}>{Number(mission.totalFlightTimeMins).toFixed(1)} min</Text>
                <Text style={styles.okStatus}>OK</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 2, paddingBottom: 32 },
  wideContent: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  metrics: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: {
    flex: 1,
    minHeight: 94,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  wideMetricCard: { minHeight: 110, padding: 20 },
  metricLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, letterSpacing: 1.5, marginBottom: 8 },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  metricValue: { color: colors.accent, fontFamily: monoFont, fontSize: 21, fontWeight: '700' },
  metricUnit: { color: colors.muted, fontFamily: monoFont, fontSize: 12, letterSpacing: 0.5 },
  maintenanceCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, letterSpacing: 1.2, marginBottom: 14 },
  maintenanceTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 },
  maintenanceTitle: { color: colors.text, fontFamily: monoFont, fontSize: 16, fontWeight: '700' },
  maintenanceRemaining: { color: colors.accent, fontFamily: monoFont, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  progressTrack: { height: 11, backgroundColor: '#1A1A1A', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', width: '94%', backgroundColor: colors.accent },
  register: { paddingTop: 4 },
  missionRow: {
    minHeight: 68,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  missionDateBlock: { flex: 1 },
  missionDate: { color: colors.text, fontFamily: monoFont, fontSize: 14, fontWeight: '700', marginBottom: 7 },
  missionName: { color: colors.muted, fontFamily: monoFont, fontSize: 12 },
  missionStatusBlock: { alignItems: 'flex-end', marginLeft: 10 },
  flightTime: { color: colors.accent, fontFamily: monoFont, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  okStatus: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});