import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BookingWizardProgress from '../components/BookingWizardProgress';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { DEFAULT_BOOKING_DRAFT, getLatestBookingDraft } from '../services/bookingDraftService';
import { formatUnavailableSlot, getSubmissionForDate } from '../services/bookingConflictService';
import { mockRequestContact } from '../mockData';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const REVIEW_STEPS = [
  {
    title: 'Venue & airspace review',
    body: 'Operations checks the site and flight permissions.',
    active: true,
  },
  {
    title: 'Quote & show agreement',
    body: 'Your coordinator shares pricing and next steps.',
    active: false,
  },
  {
    title: 'Show confirmation',
    body: 'After approval and agreement, the date is confirmed.',
    active: false,
  },
];

export default function BookingSubmittedScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const booking = route?.params?.booking || getLatestBookingDraft();
  const submission =
    route?.params?.submission || (booking ? getSubmissionForDate(booking.date) : null);
  const eventName = booking?.eventName || DEFAULT_BOOKING_DRAFT.eventName;
  const droneCount = booking?.droneCount ?? DEFAULT_BOOKING_DRAFT.droneCount;
  const durationMinutes = booking?.durationMinutes ?? DEFAULT_BOOKING_DRAFT.durationMinutes;
  const schedule = booking ? formatUnavailableSlot({ date: booking.date, timeSlot: booking.timeSlot }) : '';
  const zoneLabel = booking?.timeZoneLabel || booking?.timeZone || '';
  const location = booking ? [booking.venueName, booking.city].filter(Boolean).join(' · ') : '';
  const reference = submission?.reference || 'PENDING';

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / BOOKING"
      label="NEW BOOKING // REQUEST SUBMITTED"
      title="You're in the review queue."
      badge="● CLIENT"
      showProgress={false}
      backLabel="BACK TO DASHBOARD"
      backGlyph="<"
      onBack={() => navigation.navigate('EmployeeDashboard')}
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={
        <View style={styles.footer}>
          <Text style={[s.body, styles.receiptNote]}>
            A request receipt will be sent to{' '}
            <Text style={styles.receiptEmail}>{mockRequestContact.email}</Text>
          </Text>
          <PrimaryButton
            testID="submitted-to-dashboard"
            title="View my requests"
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
      }
    >
      <BookingWizardProgress currentStep={3} />

      <View style={styles.statusBlock}>
        <View style={styles.badgeRing}>
          <View style={styles.badgeCore}>
            <Text style={styles.badgeCheck}>✓</Text>
          </View>
        </View>
        <Text style={[styles.statusLabel, layout.wide && styles.wideStatusLabel]}>
          BOOKING REQUEST RECEIVED
        </Text>
        <Text style={[s.body, styles.warning]}>
          Your request has been sent to operations. Your show is not confirmed yet.
        </Text>
      </View>

      {booking ? (
        <View testID="booking-submitted" style={[s.card, styles.receiptCard]}>
          <View style={styles.receiptHeader}>
            <Text testID="booking-reference" style={styles.reference}>
              {reference}
            </Text>
            <Text style={styles.pendingPill}>PENDING REVIEW</Text>
          </View>
          <Text style={[styles.eventName, layout.wide && styles.wideEventName]}>{eventName}</Text>

          <View style={styles.summaryRow}>
            <Text style={s.body}>Scheduled</Text>
            <Text style={styles.summaryValue}>{schedule}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={s.body}>Time zone</Text>
            <Text style={styles.summaryValue}>{zoneLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={s.body}>Drones</Text>
            <Text style={styles.summaryValue}>{`${droneCount} drones`}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={s.body}>Duration</Text>
            <Text style={styles.summaryValue}>{`${durationMinutes} minutes`}</Text>
          </View>
          <View style={[s.divider, styles.divider]} />
          <Text style={styles.location}>{location}</Text>
        </View>
      ) : (
        <View style={s.card} accessibilityRole="alert">
          <Text style={s.errorTitle}>No request to show</Text>
          <Text style={[s.body, styles.emptyMessage]}>Start a booking to send a scheduling request.</Text>
        </View>
      )}

      <View style={[s.card, styles.stepsCard]}>
        <Text style={[s.label, styles.groupLabel]}>// WHAT HAPPENS NEXT</Text>
        {REVIEW_STEPS.map((step, index) => (
          <View
            key={step.title}
            testID={`review-step-${index + 1}`}
            style={[styles.step, !step.active && styles.inactiveStep]}
          >
            <View style={[styles.stepNumber, step.active && styles.activeStepNumber]}>
              <Text style={[styles.stepNumberText, step.active && styles.activeStepNumberText]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.stepCopy}>
              <Text style={[styles.stepTitle, step.active && styles.activeStepTitle]}>{step.title}</Text>
              <Text style={s.body}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[s.card, styles.infoCard]}>
        <View style={styles.infoIcon}>
          <Text style={styles.infoGlyph}>i</Text>
        </View>
        <Text style={[s.body, styles.infoText]}>
          This request is temporarily saved on this device. Once the operations API is connected the date lock and
          confirmation will sync automatically.
        </Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statusBlock: { alignItems: 'center', marginBottom: 18, marginTop: 4 },
  badgeRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeCore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.cyan,
    backgroundColor: '#04161A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCheck: { color: colors.cyan, fontSize: 22, fontWeight: '700', lineHeight: 26 },
  statusLabel: { color: colors.cyan, fontFamily: monoFont, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  wideStatusLabel: { fontSize: 13 },
  warning: { textAlign: 'center', maxWidth: 320, lineHeight: 17 },
  receiptCard: { borderColor: colors.accent, borderWidth: 1, backgroundColor: '#121600' },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  reference: { color: colors.muted, fontFamily: monoFont, fontSize: 10, letterSpacing: 0.5, flexShrink: 1 },
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
  divider: { marginVertical: 12 },
  location: { color: colors.text, fontSize: 12, lineHeight: 18 },
  stepsCard: { gap: 14 },
  groupLabel: { marginBottom: 0 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  inactiveStep: { opacity: 0.55 },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepNumber: { borderColor: colors.cyan, backgroundColor: '#04161A' },
  stepNumberText: { color: colors.muted, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  activeStepNumberText: { color: colors.cyan },
  stepCopy: { flex: 1, minWidth: 0 },
  stepTitle: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  activeStepTitle: { color: colors.cyan },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.field },
  infoIcon: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  infoGlyph: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  infoText: { flex: 1, lineHeight: 18 },
  emptyMessage: { marginBottom: 4 },
  footer: { width: '100%', gap: 10 },
  receiptNote: { textAlign: 'center', lineHeight: 17 },
  receiptEmail: { color: colors.text, textDecorationLine: 'underline' },
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
