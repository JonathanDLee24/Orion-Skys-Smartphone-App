import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import BookingWizardProgress from '../components/BookingWizardProgress';
import CalendarPicker from '../components/CalendarPicker';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import {
  DEFAULT_BOOKING_DRAFT,
  isVenueDetailsComplete,
  saveBookingDraft,
  validateVenueDetails,
} from '../services/bookingDraftService';
import { useTimeZonePreference } from '../services/settingsService';
import { colors, monoFont, useResponsiveLayout } from '../theme';
import { buildTimeSlots, formatSelectedDate, parseDateKey, toDateKey } from '../utils/bookingCalendar';
import { getTimeZoneForPostalCode } from '../utils/postalCodeTimeZones';
import { getTimeZoneLabel } from '../utils/timeZones';

const TIME_SLOTS = buildTimeSlots();

export default function BookingDateVenueScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const preferredTimeZone = useTimeZonePreference();
  // The conflict screen hands the cached draft back so nothing has to be retyped.
  const cachedDraft = route?.params?.booking || route?.params?.draft;
  const returningFromConflict = Boolean(route?.params?.focusCalendar);
  const [selectedDate, setSelectedDate] = useState(() => parseDateKey(cachedDraft?.date || DEFAULT_BOOKING_DRAFT.date));
  const [selectedTime, setSelectedTime] = useState(cachedDraft?.timeSlot || DEFAULT_BOOKING_DRAFT.timeSlot);
  const [form, setForm] = useState(() => ({
    eventName: cachedDraft?.eventName ?? DEFAULT_BOOKING_DRAFT.eventName,
    venueName: cachedDraft?.venueName ?? DEFAULT_BOOKING_DRAFT.venueName,
    streetAddress: cachedDraft?.streetAddress ?? DEFAULT_BOOKING_DRAFT.streetAddress,
    city: cachedDraft?.city ?? DEFAULT_BOOKING_DRAFT.city,
    postalCode: cachedDraft?.postalCode ?? DEFAULT_BOOKING_DRAFT.postalCode,
  }));

  const errors = validateVenueDetails(form);
  const complete = isVenueDetailsComplete(form);
  // The venue postal code decides how show times are interpreted; the profile
  // preference is only a fallback for codes we cannot resolve yet.
  const venueTimeZone = getTimeZoneForPostalCode(form.postalCode);
  const timeZone = venueTimeZone || preferredTimeZone;

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function continueToReview() {
    if (!complete) return;
    const saved = saveBookingDraft({
      eventName: form.eventName,
      droneCount: cachedDraft?.droneCount ?? DEFAULT_BOOKING_DRAFT.droneCount,
      durationMinutes: cachedDraft?.durationMinutes ?? DEFAULT_BOOKING_DRAFT.durationMinutes,
      date: toDateKey(selectedDate),
      dateLabel: formatSelectedDate(selectedDate, timeZone),
      timeSlot: selectedTime,
      timeZone,
      timeZoneLabel: getTimeZoneLabel(timeZone),
      ...form,
    });
    navigation.navigate('BookingReview', { booking: saved });
  }

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / BOOKING"
      label="NEW BOOKING // DATE & VENUE"
      title="Schedule a show."
      badge="● CLIENT"
      showProgress={false}
      backLabel="Back to dashboard"
      onBack={() => navigation.navigate('EmployeeDashboard')}
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={(
        <PrimaryButton
          testID="continue-to-review"
          title="Continue to booking review"
          showArrow
          disabled={!complete}
          onPress={continueToReview}
        />
      )}
    >
      <BookingWizardProgress currentStep={1} />

      {returningFromConflict && (
        <View testID="conflict-return-notice" accessibilityRole="alert" style={[s.card, styles.conflictNotice]}>
          <Text style={[s.label, styles.groupLabel]}>// TIME NO LONGER AVAILABLE</Text>
          <Text style={s.body}>Your event details are saved. Pick a new date or time below to continue.</Text>
        </View>
      )}

      <View testID="booking-columns" style={[styles.columns, layout.wide && styles.wideColumns]}>
        <View style={[s.card, styles.calendarCard, layout.wide && styles.column]}>
          <CalendarPicker value={selectedDate} onChange={setSelectedDate} />
        </View>

        <View style={[layout.wide && styles.column]}>
          <View style={s.card}>
            <Text style={[s.label, styles.groupLabel]}>// SHOW TIME · 24 HOURS</Text>
            <Text testID="selected-date-label" style={[styles.timezone, layout.wide && styles.wideTimezone]}>
              {formatSelectedDate(selectedDate, timeZone)}
            </Text>
            <View accessibilityRole="radiogroup" style={styles.timeRow}>
              {TIME_SLOTS.map((slot) => {
                const active = slot.value === selectedTime;
                return (
                  <Pressable
                    key={slot.value}
                    testID={slot.testID}
                    accessibilityRole="radio"
                    accessibilityLabel={slot.value}
                    accessibilityState={{ checked: active }}
                    aria-checked={active}
                    onPress={() => setSelectedTime(slot.value)}
                    style={({ pressed }) => [
                      styles.slot,
                      layout.wide && styles.wideSlot,
                      active && styles.activeSlot,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.slotText, layout.wide && styles.wideSlotText, active && styles.activeSlotText]}
                    >
                      {slot.value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={s.card}>
            <Text style={[s.label, styles.groupLabel]}>// VENUE & ADDRESS</Text>

            <Text style={styles.fieldLabel}>EVENT NAME</Text>
            <TextInput
              accessibilityLabel="Event name"
              testID="event-name-input"
              value={form.eventName}
              onChangeText={(value) => updateField('eventName', value)}
              placeholder="Apex Year-end Celebration"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              autoCorrect={false}
              style={[styles.input, layout.wide && styles.wideInput]}
            />

            <Text style={styles.fieldLabel}>VENUE NAME</Text>
            <TextInput
              accessibilityLabel="Venue name"
              testID="venue-name-input"
              value={form.venueName}
              onChangeText={(value) => updateField('venueName', value)}
              placeholder="Marina Bay Event Deck"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              autoCorrect={false}
              style={[styles.input, layout.wide && styles.wideInput, errors.venueName && styles.invalidInput]}
            />

            <Text style={styles.fieldLabel}>STREET ADDRESS</Text>
            <TextInput
              accessibilityLabel="Street address"
              testID="street-address-input"
              value={form.streetAddress}
              onChangeText={(value) => updateField('streetAddress', value)}
              placeholder="10 Bayfront Avenue"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              autoCorrect={false}
              style={[styles.input, layout.wide && styles.wideInput, errors.streetAddress && styles.invalidInput]}
            />

            <View style={styles.splitRow}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>CITY / COUNTRY</Text>
                <TextInput
                  accessibilityLabel="City or country"
                  testID="city-input"
                  value={form.city}
                  onChangeText={(value) => updateField('city', value)}
                  placeholder="Singapore"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[styles.input, layout.wide && styles.wideInput, errors.city && styles.invalidInput]}
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>POSTAL CODE</Text>
                <TextInput
                  accessibilityLabel="Postal code"
                  testID="postal-code-input"
                  value={form.postalCode}
                  onChangeText={(value) => updateField('postalCode', value)}
                  placeholder="018956"
                  placeholderTextColor={colors.muted}
                  autoCorrect={false}
                  style={[styles.input, layout.wide && styles.wideInput, errors.postalCode && styles.invalidInput]}
                />
                <Text testID="venue-time-zone" style={styles.timeZoneHint}>
                  {venueTimeZone
                    ? `TIME ZONE · ${getTimeZoneLabel(venueTimeZone)}`
                    : `TIME ZONE · ${getTimeZoneLabel(timeZone)} · from profile`}
                </Text>
              </View>
            </View>

            {!complete && (
              <Text accessibilityLiveRegion="polite" style={styles.validationHint}>
                Complete venue name, street address, city and postal code to continue.
              </Text>
            )}

            <View style={[s.divider, styles.disclaimerDivider]} />
            <Text style={[s.body, layout.wide && styles.wideDisclaimer]}>
              All dates and times are illustrative. Operations will review venue suitability and airspace before confirming.
            </Text>
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  columns: { alignItems: 'stretch' },
  wideColumns: { flexDirection: 'row', gap: 24 },
  column: { flex: 1, minWidth: 0 },
  calendarCard: { paddingVertical: 14 },
  conflictNotice: { borderColor: colors.gold },
  groupLabel: { marginBottom: 10 },
  timezone: { color: colors.text, fontFamily: monoFont, fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 10 },
  wideTimezone: { fontSize: 14 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.field,
  },
  wideSlot: { minHeight: 50, flexBasis: '22%' },
  activeSlot: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  slotText: { color: colors.muted, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  wideSlotText: { fontSize: 13 },
  activeSlotText: { color: colors.accent },
  fieldLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, letterSpacing: 0.5, marginBottom: 6 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.field,
    color: colors.text,
    fontFamily: monoFont,
    fontSize: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginBottom: 12,
  },
  wideInput: { minHeight: 48, fontSize: 14 },
  invalidInput: { borderColor: colors.error },
  splitRow: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, minWidth: 0 },
  validationHint: { color: colors.error, fontSize: 11, lineHeight: 16, marginTop: -2 },
  timeZoneHint: { color: colors.muted, fontFamily: monoFont, fontSize: 9, letterSpacing: 0.3, lineHeight: 14, marginTop: -8, marginBottom: 12 },
  disclaimerDivider: { marginTop: 14, marginBottom: 10 },
  wideDisclaimer: { fontSize: 13, lineHeight: 20 },
  pressed: { opacity: 0.7 },
});
