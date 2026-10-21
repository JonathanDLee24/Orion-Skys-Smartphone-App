import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import {
  CANCELLED_STATUS,
  cancelBookingSubmission,
  formatUnavailableSlot,
  getNextScheduledSubmission,
} from '../services/bookingConflictService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function SummaryRow({ label, value, s }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={s.body}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function BookingManageScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [record, setRecord] = useState(
    () => route?.params?.submission || route?.params?.booking || getNextScheduledSubmission()
  );
  const [confirming, setConfirming] = useState(false);
  const cancelled = record?.status === CANCELLED_STATUS;

  function backToDashboard() {
    navigation.navigate('EmployeeDashboard');
  }

  function confirmCancellation() {
    const cancelledRecord = cancelBookingSubmission(record.id);
    // Copy so the screen re-renders; the ledger mutates the original record.
    setRecord(cancelledRecord ? { ...cancelledRecord } : { ...record, status: CANCELLED_STATUS });
    setConfirming(false);
  }

  if (!record) {
    return (
      <ScreenLayout
        caption="EMPLOYEE OPERATIONS / BOOKINGS"
        label="SHOW MANAGEMENT // BOOKING"
        title="Booking not found."
        secure
        showProgress={false}
        backLabel="Back to dashboard"
        onBack={backToDashboard}
        onAccount={() => navigation.navigate('AccountSettings')}
      >
        <View style={s.card} accessibilityRole="alert">
          <Text style={s.errorTitle}>Nothing to manage</Text>
          <Text style={[s.body, styles.emptyCopy]}>
            Pick a show from the dashboard to view or cancel its booking.
          </Text>
          <PrimaryButton title="Back to dashboard" onPress={backToDashboard} />
        </View>
      </ScreenLayout>
    );
  }

  const date = formatUnavailableSlot({ date: record.date, timeSlot: '' });
  const schedule = formatUnavailableSlot({ date: record.date, timeSlot: record.timeSlot });
  const address = [record.streetAddress, `${record.city || ''} ${record.postalCode || ''}`.trim()]
    .filter(Boolean)
    .join(', ');
  const droneCount = record.droneCount ?? 0;
  const durationMinutes = record.durationMinutes ?? 0;

  return (
    <ScreenLayout
      caption="EMPLOYEE OPERATIONS / BOOKINGS"
      label={`SHOW MANAGEMENT // ${record.reference || 'BOOKING'}`}
      title={cancelled ? 'Booking cancelled.' : 'Manage this show.'}
      badge={cancelled ? '● CANCELLED' : '● IN REVIEW'}
      secure
      showProgress={false}
      backLabel="Back to dashboard"
      onBack={backToDashboard}
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={
        cancelled ? (
          <View style={styles.actions}>
            <PrimaryButton title="Back to dashboard" showArrow onPress={backToDashboard} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Schedule another show"
              onPress={() => navigation.navigate('BookingDateVenue')}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>+ Schedule another show</Text>
            </Pressable>
          </View>
        ) : confirming ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yes, cancel booking"
              onPress={confirmCancellation}
              style={({ pressed }) => [styles.destructive, pressed && styles.pressed]}
            >
              <Text style={styles.destructiveText}>Yes, cancel booking</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keep booking"
              onPress={() => setConfirming(false)}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>Keep booking</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            <PrimaryButton title="Keep booking" onPress={backToDashboard} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel booking"
              onPress={() => setConfirming(true)}
              style={({ pressed }) => [styles.destructiveOutline, pressed && styles.pressed]}
            >
              <Text style={styles.destructiveOutlineText}>Cancel booking</Text>
            </Pressable>
          </View>
        )
      }
    >
      {cancelled ? (
        <>
          <View testID="cancelled-state" accessibilityRole="alert" style={[s.card, styles.cancelledCard]}>
            <View style={styles.cardHeader}>
              <Text style={[s.label, styles.groupLabel]}>// BOOKING CANCELLED</Text>
              <Text style={styles.cancelledPill}>● CANCELLED</Text>
            </View>
            <Text style={[styles.eventName, layout.wide && styles.wideEventName]}>{record.eventName}</Text>
            <SummaryRow s={s} label="Reference" value={record.reference || '—'} />
            <SummaryRow s={s} label="Date" value={date} />
            <SummaryRow s={s} label="Time" value={record.timeSlot} />
            <SummaryRow s={s} label="Venue" value={record.venueName} />
          </View>
          <View style={[s.card, styles.infoCard]}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoGlyph}>i</Text>
            </View>
            <Text style={[s.body, styles.infoText]}>
              {date} is available to book again. Shows run once per day, so another client can now claim this date.
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={[s.body, styles.intro]}>
            Review the booked show below. Cancelling releases its date immediately.
          </Text>

          <View testID="manage-booking" style={[s.card, confirming ? styles.cardDimmed : null]}>
            <View style={styles.cardHeader}>
              <Text style={[s.label, styles.groupLabel]}>// YOUR EVENT DETAILS</Text>
              <Text style={styles.pendingPill}>● IN REVIEW</Text>
            </View>
            <Text style={[styles.eventName, layout.wide && styles.wideEventName]}>{record.eventName}</Text>
            <SummaryRow s={s} label="Reference" value={record.reference || '—'} />
            <SummaryRow s={s} label="Date" value={date} />
            <SummaryRow s={s} label="Time" value={record.timeSlot} />
            <SummaryRow s={s} label="Time zone" value={record.timeZoneLabel || record.timeZone || '—'} />
            <SummaryRow s={s} label="Venue" value={record.venueName || '—'} />
            <SummaryRow s={s} label="Address" value={address || '—'} />

            {(droneCount > 0 || durationMinutes > 0) && (
              <>
                <View style={[s.divider, styles.metricsDivider]} />
                <View style={styles.metrics}>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, layout.wide && styles.wideMetricValue]}>{`${droneCount} drones`}</Text>
                    <Text style={s.label}>FLEET SIZE</Text>
                  </View>
                  <View style={[styles.metric, styles.metricDivider]}>
                    <Text style={[styles.metricValue, layout.wide && styles.wideMetricValue]}>{`${durationMinutes} minutes`}</Text>
                    <Text style={s.label}>SHOW DURATION</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {confirming ? (
            <View testID="cancel-confirmation" accessibilityRole="alert" style={[s.card, styles.confirmCard]}>
              <Text style={styles.confirmTitle}>Cancel this booking?</Text>
              <Text style={[s.body, styles.confirmCopy]}>
                This releases {date} so another client can book it. Your show brief and crew assignments for this
                request will be removed. This cannot be undone.
              </Text>
            </View>
          ) : (
            <View style={[s.card, styles.infoCard]}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoGlyph}>i</Text>
              </View>
              <Text style={[s.body, styles.infoText]}>
                Cancelling frees {date}. Every detail stays visible until you confirm.
              </Text>
            </View>
          )}
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: -8, marginBottom: 14 },
  emptyCopy: { marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  groupLabel: { marginBottom: 0 },
  pendingPill: {
    color: colors.gold,
    backgroundColor: '#171200',
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: '700',
  },
  cancelledPill: {
    color: colors.error,
    backgroundColor: '#240807',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: '700',
  },
  eventName: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  wideEventName: { fontSize: 23 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 9 },
  summaryValue: { color: colors.text, fontFamily: monoFont, fontSize: 12, lineHeight: 17, flexShrink: 1, textAlign: 'right' },
  metricsDivider: { marginVertical: 14 },
  metrics: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, minWidth: 0 },
  metricDivider: { borderLeftWidth: 1, borderColor: colors.border, paddingLeft: 14 },
  metricValue: { color: colors.accent, fontFamily: monoFont, fontSize: 16, fontWeight: '700', marginBottom: 5 },
  wideMetricValue: { fontSize: 22 },
  cardDimmed: { opacity: 0.6 },
  confirmCard: { borderColor: colors.error, borderWidth: 1, backgroundColor: '#170807' },
  confirmTitle: { color: colors.error, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  confirmCopy: { lineHeight: 18 },
  cancelledCard: { borderColor: colors.error, borderWidth: 1 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.field },
  infoIcon: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  infoGlyph: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  infoText: { flex: 1, lineHeight: 18 },
  actions: { width: '100%', gap: 10 },
  destructive: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  destructiveOutline: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 4,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  destructiveText: { color: colors.text, fontFamily: monoFont, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  destructiveOutlineText: { color: colors.error, fontFamily: monoFont, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  secondary: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.72 },
});
