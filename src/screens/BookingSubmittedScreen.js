import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BookingWizardProgress from '../components/BookingWizardProgress';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { DEFAULT_BOOKING_DRAFT, getLatestBookingDraft } from '../services/bookingDraftService';
import { getSubmissionForSlot } from '../services/bookingConflictService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

export default function BookingSubmittedScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const booking = route?.params?.booking || getLatestBookingDraft();
  const submission =
    route?.params?.submission || (booking ? getSubmissionForSlot(booking.date, booking.timeSlot) : null);
  const dateLabel = booking?.dateLabel ? String(booking.dateLabel).split(' // ')[0] : booking?.date;

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / BOOKING"
      label="NEW BOOKING // REQUEST SUBMITTED"
      title="Your show is in the queue."
      badge="● CLIENT"
      showProgress={false}
      backLabel="BACK TO DASHBOARD"
      backGlyph="<"
      onBack={() => navigation.navigate('EmployeeDashboard')}
      onAccount={() => navigation.navigate('AccountSettings')}
    >
      <Text style={[s.body, styles.reassurance]}>
        Your slot is held while operations reviews the venue and airspace.
      </Text>
      <BookingWizardProgress currentStep={3} />

      {booking ? (
        <View testID="booking-submitted" style={[s.card, styles.receiptCard]}>
          <View style={styles.receiptHeader}>
            <Text style={[s.label, styles.groupLabel]}>// REQUEST RECEIVED</Text>
            <Text style={styles.pendingPill}>● IN REVIEW</Text>
          </View>
          <Text style={[styles.eventName, layout.wide && styles.wideEventName]}>
            {booking.eventName || DEFAULT_BOOKING_DRAFT.eventName}
          </Text>

          <View style={styles.summaryRow}>
            <Text style={s.body}>Reference</Text>
            <Text testID="booking-reference" style={styles.summaryValue}>
              {submission?.reference || 'PENDING'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={s.body}>Date</Text>
            <Text style={styles.summaryValue}>{dateLabel}</Text>
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
            <Text style={styles.summaryValue}>
              {[booking.streetAddress, `${booking.city} ${booking.postalCode}`.trim()].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={s.card} accessibilityRole="alert">
          <Text style={s.errorTitle}>No request to show</Text>
          <Text style={[s.body, styles.emptyMessage]}>Start a booking to send a scheduling request.</Text>
        </View>
      )}

      <View style={[s.card, styles.infoCard]}>
        <View style={styles.infoIcon}>
          <Text style={styles.infoGlyph}>i</Text>
        </View>
        <Text style={[s.body, styles.infoText]}>
          This request is temporarily saved on this device. Once the operations API is connected the slot lock and
          confirmation will sync automatically.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          testID="submitted-to-dashboard"
          title="Back to dashboard"
          showArrow
          onPress={() => navigation.navigate('EmployeeDashboard')}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Schedule another show"
          onPress={() => navigation.navigate('BookingDateVenue')}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>+ Schedule another show</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  reassurance: { marginBottom: 14, marginTop: -4 },
  receiptCard: { borderColor: colors.accent, borderWidth: 1, backgroundColor: '#121600' },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
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
  eventName: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  wideEventName: { fontSize: 23 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 9 },
  summaryValue: { color: colors.text, fontFamily: monoFont, fontSize: 12, lineHeight: 17, flexShrink: 1, textAlign: 'right' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.field },
  infoIcon: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  infoGlyph: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  infoText: { flex: 1, lineHeight: 18 },
  emptyMessage: { marginBottom: 4 },
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
});
