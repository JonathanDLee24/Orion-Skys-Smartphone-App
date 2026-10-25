import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BookingWizardProgress from '../components/BookingWizardProgress';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { DEFAULT_BOOKING_DRAFT, getLatestBookingDraft, markBookingSubmitted } from '../services/bookingDraftService';
import { formatUnavailableSlot, requestBookingSlot } from '../services/bookingConflictService';
import { mockRequestContact } from '../mockData';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function shortZoneLabel(booking) {
  const label = booking?.timeZoneLabel || '';
  return label.split(' · ').pop() || booking?.timeZone || '';
}

export default function BookingReviewScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const booking = route?.params?.booking || getLatestBookingDraft();
  const schedule = booking ? formatUnavailableSlot({ date: booking.date, timeSlot: booking.timeSlot }) : '';
  const zoneHelper = booking ? `${shortZoneLabel(booking)} · requested start time` : '';
  const address = booking
    ? [booking.streetAddress, `${booking.city || ''} ${booking.postalCode || ''}`.trim()].filter(Boolean).join(', ')
    : '';
  const droneCount = booking?.droneCount ?? DEFAULT_BOOKING_DRAFT.droneCount;
  const durationMinutes = booking?.durationMinutes ?? DEFAULT_BOOKING_DRAFT.durationMinutes;

  function editDateVenue() {
    navigation.navigate('BookingDateVenue', { booking });
  }

  function submitRequest() {
    const result = requestBookingSlot(booking);
    if (!result.ok) {
      navigation.navigate('BookingConflict', { booking, conflict: result.error });
      return;
    }
    const submitted = markBookingSubmitted(booking.id) || booking;
    navigation.navigate('BookingSubmitted', { booking: submitted, submission: result.submission });
  }

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / BOOKING"
      label="NEW BOOKING // REVIEW"
      title="Review your request."
      badge="● CLIENT"
      showProgress={false}
      backLabel="Back to date & venue"
      onBack={editDateVenue}
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={
        <View style={styles.footer}>
          {booking ? (
            <PrimaryButton
              testID="submit-request"
              title="Submit booking request"
              showArrow
              onPress={submitRequest}
            />
          ) : null}
          <Text style={[s.body, styles.microCopy]}>No payment is due when submitting this request.</Text>
        </View>
      }
    >
      <BookingWizardProgress currentStep={2} />

      {booking ? (
        <View style={styles.stack}>
          <View style={s.card}>
            <View style={styles.cardHeader}>
              <Text style={s.label}>// DATE &amp; VENUE</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit date & venue"
                onPress={editDateVenue}
                style={({ pressed }) => [styles.editLink, pressed && styles.pressed]}
              >
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            </View>

            <Text style={[s.label, styles.subLabel]}>DATE</Text>
            <Text style={styles.fieldValue}>{schedule}</Text>
            <Text style={[s.body, styles.helper]}>{zoneHelper}</Text>

            <View style={[s.divider, styles.divider]} />

            <Text style={[s.label, styles.subLabel]}>VENUE</Text>
            <Text style={styles.venueName}>{booking.venueName}</Text>
            <Text style={styles.address}>{address}</Text>
          </View>

          <View style={s.card}>
            <Text style={[s.label, styles.groupLabel]}>// EVENT SPECIFICATIONS</Text>
            <View style={styles.fieldBox}>
              <Text style={[s.label, styles.subLabel]}>EVENT NAME</Text>
              <Text style={styles.fieldValue}>{booking.eventName}</Text>
            </View>
            <View style={styles.specRow}>
              <View style={[styles.fieldBox, styles.specCell]}>
                <Text style={[s.label, styles.subLabel]}>DRONE COUNT</Text>
                <Text style={styles.fieldValue}>{`${droneCount} drones`}</Text>
              </View>
              <View style={[styles.fieldBox, styles.specCell]}>
                <Text style={[s.label, styles.subLabel]}>SHOW DURATION</Text>
                <Text style={styles.fieldValue}>{`${durationMinutes} minutes`}</Text>
              </View>
            </View>
          </View>

          <View style={s.card}>
            <Text style={[s.label, styles.groupLabel]}>// REQUEST CONTACT</Text>
            <Text style={styles.contactName}>
              {`${mockRequestContact.name} · ${mockRequestContact.organization}`}
            </Text>
            <Text style={styles.address}>{mockRequestContact.email}</Text>
          </View>

          <View style={[s.card, styles.disclaimerCard]}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoGlyph}>i</Text>
            </View>
            <Text style={[s.body, styles.disclaimerText]}>
              Submitting sends a request — your show is pending venue and airspace review approval before operations
              confirms the date.
            </Text>
          </View>
        </View>
      ) : (
        <View style={s.card} accessibilityRole="alert">
          <Text style={s.errorTitle}>No booking in progress</Text>
          <Text style={[s.body, styles.emptyMessage]}>Choose a date, time and venue to prepare a booking review.</Text>
          <PrimaryButton title="Start a booking" onPress={() => navigation.navigate('BookingDateVenue')} />
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column', gap: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  editLink: { minHeight: 44, justifyContent: 'center' },
  editText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  subLabel: { marginBottom: 4 },
  fieldValue: { color: colors.text, fontFamily: monoFont, fontSize: 12, lineHeight: 18 },
  helper: { marginTop: 4 },
  divider: { marginVertical: 12 },
  venueName: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  address: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  groupLabel: { marginBottom: 10 },
  fieldBox: {
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  specRow: { flexDirection: 'row', gap: 10 },
  specCell: { flex: 1, minWidth: 0, marginBottom: 0 },
  contactName: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  disclaimerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.field },
  infoIcon: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  infoGlyph: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  disclaimerText: { flex: 1, lineHeight: 18 },
  emptyMessage: { marginBottom: 20 },
  footer: { width: '100%', gap: 10 },
  microCopy: { textAlign: 'center' },
});
