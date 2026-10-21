import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BookingWizardProgress from '../components/BookingWizardProgress';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { DEFAULT_BOOKING_DRAFT, getLatestBookingDraft } from '../services/bookingDraftService';
import { formatConflictDate, getUnavailableSlot } from '../services/bookingConflictService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function CalendarGlyph({ color = colors.gold, size = 22 }) {
  return (
    <View style={[styles.calendarIcon, { width: size, height: size, borderColor: color }]}>
      <View style={[styles.calendarBar, { backgroundColor: color }]} />
      <View style={styles.calendarDots}>
        {[0, 1, 2].map((dot) => (
          <View key={dot} style={[styles.calendarDot, { backgroundColor: color }]} />
        ))}
      </View>
    </View>
  );
}

export default function BookingConflictScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const booking = route?.params?.booking || getLatestBookingDraft() || DEFAULT_BOOKING_DRAFT;
  const unavailableSlot = getUnavailableSlot(route?.params?.conflict || route?.params?.unavailableSlot, {
    date: booking.date,
    timeSlot: booking.timeSlot,
  });
  const conflictDate = formatConflictDate(unavailableSlot);
  const droneCount = booking.droneCount ?? DEFAULT_BOOKING_DRAFT.droneCount;
  const durationMinutes = booking.durationMinutes ?? DEFAULT_BOOKING_DRAFT.durationMinutes;
  const address = [booking.streetAddress, `${booking.city} ${booking.postalCode}`.trim()]
    .filter(Boolean)
    .join(', ');

  function returnToReview() {
    navigation.navigate('BookingReview', { booking });
  }

  function returnToSchedule() {
    navigation.navigate('BookingDateVenue', { booking, focusCalendar: true });
  }

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / BOOKING"
      label="NEW BOOKING // SCHEDULING CONFLICT"
      title="That date was just booked."
      badge="● CLIENT"
      showProgress={false}
      backLabel="BACK TO REVIEW"
      backGlyph="<"
      onBack={returnToReview}
      onAccount={() => navigation.navigate('AccountSettings')}
    >
      <Text style={[s.body, styles.reassurance]}>No worries—your event details are still saved.</Text>
      <BookingWizardProgress currentStep={2} />

      <View testID="scheduling-conflict" accessibilityRole="alert" style={[s.card, styles.conflictCard]}>
        <View style={styles.conflictHeader}>
          <CalendarGlyph />
          <Text style={styles.conflictFlag}>DATE NO LONGER AVAILABLE</Text>
        </View>
        <Text testID="conflict-slot" style={[styles.conflictSlot, layout.wide && styles.wideConflictSlot]}>
          {conflictDate}
        </Text>
        <Text style={[s.body, styles.conflictCopy]}>
          This date was booked by another client before your request was submitted. Shows run once per day, so choose a
          different date to continue.
        </Text>
      </View>

      <View testID="preserved-event-details" style={s.card}>
        <View style={styles.detailsHeader}>
          <Text style={[s.label, styles.groupLabel]}>// YOUR EVENT DETAILS</Text>
          <Text style={styles.savedPill}>● SAVED</Text>
        </View>
        <Text style={[styles.eventName, layout.wide && styles.wideEventName]}>
          {booking.eventName || DEFAULT_BOOKING_DRAFT.eventName}
        </Text>

        <View style={styles.summaryRow}>
          <Text style={s.body}>Date</Text>
          <Text style={styles.summaryValue}>{conflictDate}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={s.body}>Time</Text>
          <Text style={styles.summaryValue}>{booking.timeSlot}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={s.body}>Time zone</Text>
          <Text style={styles.summaryValue}>{booking.timeZoneLabel || booking.timeZone}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={s.body}>Venue</Text>
          <Text style={styles.summaryValue}>{booking.venueName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={s.body}>Address</Text>
          <Text style={styles.summaryValue}>{address}</Text>
        </View>

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
      </View>

      <View style={[s.card, styles.infoCard]}>
        <View style={styles.infoIcon}>
          <Text style={styles.infoGlyph}>i</Text>
        </View>
        <Text style={[s.body, styles.infoText]}>
          Only the date needs changing. Every other event detail stays cached for this request.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          testID="choose-another-date"
          title="Choose another date"
          leadingIcon={<CalendarGlyph color={colors.background} size={18} />}
          onPress={returnToSchedule}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to schedule"
          onPress={returnToSchedule}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>← Return to schedule</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  reassurance: { marginBottom: 14, marginTop: -4 },
  conflictCard: { borderColor: colors.gold, borderWidth: 1, backgroundColor: '#171200' },
  conflictHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  conflictFlag: { color: colors.gold, fontFamily: monoFont, fontSize: 10, fontWeight: '700', letterSpacing: 0.7, flexShrink: 1 },
  conflictSlot: { color: colors.gold, fontFamily: monoFont, fontSize: 17, fontWeight: '700', lineHeight: 24, marginBottom: 8 },
  wideConflictSlot: { fontSize: 21, lineHeight: 29 },
  conflictCopy: { lineHeight: 18 },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  groupLabel: { marginBottom: 0 },
  savedPill: {
    color: colors.green,
    backgroundColor: '#04241C',
    borderColor: colors.green,
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
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.field },
  infoIcon: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  infoGlyph: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  infoText: { flex: 1, lineHeight: 18 },
  actions: { width: '100%', gap: 10, marginTop: 2, marginBottom: 8 },
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
  calendarIcon: { borderWidth: 1.5, borderRadius: 3, paddingTop: 4, alignItems: 'center' },
  calendarBar: { position: 'absolute', top: 4, left: 0, right: 0, height: 1.5 },
  calendarDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  calendarDot: { width: 2, height: 2, borderRadius: 1 },
});
