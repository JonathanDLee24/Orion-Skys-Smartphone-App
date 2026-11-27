import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import ScreenLayout from '../components/ScreenLayout';
import { colors, monoFont } from '../theme';
import {
  AVAILABILITY_STATES,
  createDowntimeRecord,
  getDowntimeRecords,
  getFleet,
  getLaunchReadyFleet,
  updateDowntimeRecord,
} from '../services/droneDowntimeService';

// Child flow of the fleet manifest: capture the issue, the work performed, the
// responsible staff member and the resulting operational state. A grounded or
// in-maintenance drone with an open follow-up is never launch-ready.

const STATE_HELP = {
  Available: 'Work finished on the spot. The drone stays launch-ready.',
  Maintenance: 'Scheduled or ongoing service. Excluded from launch-ready until the follow-up is closed.',
  'Grounded/Downtime': 'Out of service. Excluded from launch-ready until the follow-up is closed.',
};

function formatTime(value) {
  return value ? new Date(value).toLocaleString() : '';
}

export default function DroneDowntimeScreen({ navigation, route }) {
  const droneId = route?.params?.droneId;
  const [, setVersion] = useState(0);
  const [issue, setIssue] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [staff, setStaff] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState(() => {
    const current = getFleet().find(item => item.id === droneId)?.availability;
    return AVAILABILITY_STATES.includes(current) && current !== 'Available' ? current : 'Maintenance';
  });

  const drone = getFleet().find(item => item.id === droneId);
  const records = getDowntimeRecords(droneId).reverse();
  const open = records.find(item => item.status === 'Open');
  const launchReady = getLaunchReadyFleet().some(item => item.id === droneId);
  const finishedOnTheSpot = availability === 'Available';

  function refresh() { setVersion(version => version + 1); }

  function save(close = false) {
    try {
      if (open) {
        updateDowntimeRecord({ id: open.id, staff, workPerformed, availability, close });
      } else {
        createDowntimeRecord({ droneId, issue, workPerformed, staff, availability, scheduledFor: finishedOnTheSpot ? '' : scheduledFor.trim() });
      }
      setIssue('');
      setWorkPerformed('');
      setScheduledFor('');
      setError('');
      refresh();
    } catch (e) { setError(e.message); }
  }

  const actionLabel = open ? 'Save follow-up' : finishedOnTheSpot ? 'Log on-the-spot maintenance' : 'Flag drone for service';

  return (
    <ScreenLayout
      label="FLIGHT OPERATIONS / EQUIPMENT"
      title="Drone downtime & maintenance"
      caption="FLEET OPERATIONS / EQUIPMENT"
      showProgress={false}
      onBack={() => navigation.goBack()}
      backLabel="Back to fleet manifest"
    >
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.droneId}>{droneId || 'UNKNOWN DRONE'}</Text>
            <Text testID="drone-availability" style={[styles.badge, stateBadgeStyle(drone?.availability)]}>{drone?.availability || 'Unknown'}</Text>
          </View>
          <Text testID="launch-ready" style={[styles.launchReady, !launchReady && styles.blocked]}>
            {launchReady ? '● LAUNCH-READY' : '✕ NOT LAUNCH-READY'}
          </Text>
          {drone?.rfid && <Text style={styles.meta}>{drone.rfid}</Text>}
          {open ? (
            <Text testID="open-follow-up" style={styles.openFollowUp}>
              OPEN FOLLOW-UP · {open.issue} · opened {formatTime(open.createdAt)} by {open.history[0]?.staff}
            </Text>
          ) : (
            <Text style={styles.meta}>No open follow-up. Flagging this drone removes it from launch-ready inventory.</Text>
          )}
          <Text style={styles.note}>Session-only demo. Do not use this information for flight safety decisions.</Text>
        </View>

        <Text style={styles.heading}>{open ? 'Log follow-up work' : 'Create downtime or maintenance record'}</Text>

        {!open && (
          <>
            <Text style={styles.label}>Issue / downtime reason</Text>
            <TextInput accessibilityLabel="Issue" value={issue} onChangeText={setIssue} style={styles.input} multiline />
            {!finishedOnTheSpot && (
              <>
                <Text style={styles.label}>Scheduled service time (optional, local time)</Text>
                <TextInput
                  accessibilityLabel="Scheduled service time"
                  value={scheduledFor}
                  onChangeText={setScheduledFor}
                  placeholder="YYYY-MM-DDTHH:mm"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  style={styles.input}
                />
                <Text style={styles.note}>The drone is flagged immediately, even if service is scheduled for later. Enter work already performed or "None yet".</Text>
              </>
            )}
          </>
        )}

        <Text style={styles.label}>Work performed</Text>
        <TextInput accessibilityLabel="Work performed" value={workPerformed} onChangeText={setWorkPerformed} style={styles.input} multiline />

        <Text style={styles.label}>Responsible staff member</Text>
        <TextInput accessibilityLabel="Responsible staff member" value={staff} onChangeText={setStaff} style={styles.input} />

        <Text style={styles.label}>Operational state</Text>
        {AVAILABILITY_STATES.map(state => {
          const selected = availability === state;
          return (
            <Pressable
              key={state}
              testID={`state-option-${state}`}
              accessibilityRole="radio"
              accessibilityLabel={state}
              accessibilityState={{ checked: selected }}
              onPress={() => setAvailability(state)}
              style={[styles.choice, selected && styles.selected]}
            >
              <Text style={styles.choiceTitle}>{selected ? '◉ ' : '○ '}{state}</Text>
              <Text style={[styles.text, styles.choiceHelp]}>{STATE_HELP[state]}</Text>
            </Pressable>
          );
        })}
        {open && finishedOnTheSpot && (
          <Text style={styles.note}>Closing this follow-up with Available returns the drone to launch-ready inventory.</Text>
        )}

        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => save(false)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
        {open && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close follow-up"
            onPress={() => save(true)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Close follow-up with selected state</Text>
          </Pressable>
        )}

        <Text style={styles.heading}>Follow-up & audit history</Text>
        {records.length === 0 && <Text style={styles.text}>No downtime records.</Text>}
        {records.map(record => (
          <View key={record.id} testID={`downtime-record-${record.id}`} style={styles.card}>
            <Text style={styles.cardTitle}>{record.status.toUpperCase()} · {record.issue}</Text>
            <Text style={styles.text}>Created: {formatTime(record.createdAt)}</Text>
            {record.scheduledAt && <Text style={styles.text}>Scheduled service: {formatTime(record.scheduledAt)}</Text>}
            <Text style={styles.text}>Last updated: {formatTime(record.updatedAt)}</Text>
            {record.closedAt && <Text style={styles.text}>Closed: {formatTime(record.closedAt)}</Text>}
            {record.history.map((event, index) => (
              <View key={index} style={styles.historyEntry}>
                <Text style={styles.historyAction}>{event.action.toUpperCase()} · {formatTime(event.timestamp)}</Text>
                <Text style={styles.text}>{event.staff} · set {event.availability}</Text>
                <Text style={styles.text}>Work: {event.workPerformed}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}

function stateBadgeStyle(state) {
  if (state === 'Available') return styles.badgeAvailable;
  if (state === 'Maintenance') return styles.badgeMaintenance;
  return styles.badgeGrounded;
}

const styles = StyleSheet.create({
  container: { maxWidth: 720, width: '100%', alignSelf: 'center', gap: 8 },
  statusCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, gap: 6 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  droneId: { color: colors.text, fontFamily: monoFont, fontSize: 16, fontWeight: '700' },
  badge: { borderRadius: 3, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  badgeAvailable: { color: colors.green, backgroundColor: '#04241C' },
  badgeMaintenance: { color: colors.gold, backgroundColor: '#171200' },
  badgeGrounded: { color: '#FFFFFF', backgroundColor: '#9B221B' },
  launchReady: { color: colors.green, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  blocked: { color: colors.error },
  openFollowUp: { color: colors.gold, fontSize: 13, lineHeight: 20 },
  heading: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  text: { color: colors.text, lineHeight: 22 },
  meta: { color: colors.muted, lineHeight: 20 },
  note: { color: colors.gold, lineHeight: 20 },
  label: { color: colors.text, marginTop: 8 },
  input: { color: colors.text, backgroundColor: colors.field, borderWidth: 1, borderColor: colors.border, borderRadius: 6, minHeight: 48, padding: 10 },
  choice: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, gap: 4, marginBottom: 8 },
  selected: { borderColor: colors.gold },
  choiceTitle: { color: colors.text, fontWeight: '600' },
  choiceHelp: { fontSize: 12, color: colors.muted },
  error: { color: colors.error },
  button: { backgroundColor: colors.accent, borderRadius: 6, minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#111600', fontWeight: '700' },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 6, padding: 12, gap: 8 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  historyEntry: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, gap: 2 },
  historyAction: { color: colors.gold, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
});
