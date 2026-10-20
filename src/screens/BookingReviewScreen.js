import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import BookingWizardProgress from '../components/BookingWizardProgress';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { getLatestBookingDraft } from '../services/bookingDraftService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

export default function BookingReviewScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [noticeVisible, setNoticeVisible] = useState(false);
  const booking = route?.params?.booking || getLatestBookingDraft();
  // The date row stays a single line; the zone is already shown on its own row.
  const dateOnly = booking?.dateLabel ? String(booking.dateLabel).split(' // ')[0] : booking?.date;

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / BOOKING"
      label="NEW BOOKING // REVIEW"
      title="Booking review."
      badge="● CLIENT"
      showProgress={false}
      backLabel="Back to date & venue"
      onBack={() => navigation.navigate('BookingDateVenue')}
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={
        <View style={styles.footerActions}>
          <PrimaryButton title="Edit date & venue" onPress={() => navigation.navigate('BookingDateVenue')} />
          {booking ? (
            <PrimaryButton
              testID="submit-request"
              title="Submit request"
              showArrow
              onPress={() => setNoticeVisible(true)}
            />
          ) : null}
        </View>
      }
    >
      <BookingWizardProgress currentStep={2} />

      {booking ? (
        <View style={[styles.columns, layout.wide && styles.wideColumns]}>
          <View style={[s.card, layout.wide && styles.column]}>
            <Text style={[s.label, styles.groupLabel]}>// REQUEST PARAMETERS</Text>
            <View style={styles.parameter}>
              <Text style={s.body}>Date</Text>
              <Text style={styles.value}>{dateOnly}</Text>
            </View>
            <View style={styles.parameter}>
              <Text style={s.body}>Time block</Text>
              <Text style={styles.value}>{booking.timeSlot}</Text>
            </View>
            <View style={styles.parameter}>
              <Text style={s.body}>Time zone</Text>
              <Text style={styles.value}>{booking.timeZoneLabel || booking.timeZone}</Text>
            </View>
          </View>

          <View style={[s.card, layout.wide && styles.column]}>
            <Text style={[s.label, styles.groupLabel]}>// VENUE</Text>
            <Text style={[styles.venueName, layout.wide && styles.wideVenueName]}>{booking.venueName}</Text>
            <Text style={styles.address}>{booking.streetAddress}</Text>
            <Text style={styles.address}>{booking.city} {booking.postalCode}</Text>
            <View style={[s.divider, styles.divider]} />
            <Text style={s.body}>
              Operations will review venue suitability and airspace before confirming this request.
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

      <Modal visible={noticeVisible} transparent animationType="fade" onRequestClose={() => setNoticeVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View testID="submit-request-notice" accessibilityRole="alert" style={[s.card, styles.modalCard]}>
            <Text style={[s.label, styles.groupLabel]}>// SUBMIT REQUEST</Text>
            <Text style={styles.modalTitle}>Part of task OSPSA-57</Text>
            <PrimaryButton title="Close" onPress={() => setNoticeVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  columns: { alignItems: 'stretch' },
  wideColumns: { flexDirection: 'row', gap: 24 },
  column: { flex: 1, minWidth: 0 },
  groupLabel: { marginBottom: 10 },
  parameter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 },
  value: { color: colors.text, fontFamily: monoFont, fontSize: 12, lineHeight: 18, flexShrink: 1, textAlign: 'right' },
  venueName: { color: colors.accent, fontSize: 16, fontWeight: '700', marginBottom: 5 },
  wideVenueName: { fontSize: 20 },
  address: { color: colors.text, fontSize: 12, lineHeight: 19 },
  divider: { marginVertical: 12 },
  emptyMessage: { marginBottom: 20 },
  footerActions: { width: '100%', gap: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, marginBottom: 0 },
  modalTitle: { color: colors.text, fontFamily: monoFont, fontSize: 14, lineHeight: 21, marginBottom: 16 },
});
