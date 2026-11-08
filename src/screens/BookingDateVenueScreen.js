import React, { useEffect, useState } from 'react';
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
import { getBookedDateKeys } from '../services/bookingConflictService';
import { useTimeZonePreference } from '../services/settingsService';
import { colors, monoFont, useResponsiveLayout } from '../theme';
import {
  buildTimeSlots,
  formatSelectedDate,
  isSameDay,
  isTimeSlotPast,
  parseDateKey,
  toDateKey,
} from '../utils/bookingCalendar';
import { getTimeZoneForPostalCode } from '../utils/postalCodeTimeZones';
import { getTimeZoneLabel } from '../utils/timeZones';

const TIME_SLOTS = buildTimeSlots();

function findTimeSlot(value) {
  return TIME_SLOTS.find((slot) => slot.value === value) || null;
}

export default function BookingDateVenueScreen({ navigation, route, now }) {
  const layout = useResponsiveLayout();
  // Tests can pin the clock; the app always reads the device clock on render.
  const deviceNow = now || new Date();
  const s = useScreenStyles();
  const preferredTimeZone = useTimeZonePreference();
  // The conflict screen hands the cached draft back so nothing has to be retyped.
  const cachedDraft = route?.params?.booking || route?.params?.draft;
  const returningFromConflict = Boolean(route?.params?.focusCalendar);
  // A fresh booking starts with nothing highlighted: the green "selected" day
  // only appears after the user taps it. A draft handed back after a conflict
  // keeps its date so the choice is not lost.
  const [selectedDate, setSelectedDate] = useState(() => (cachedDraft?.date ? parseDateKey(cachedDraft.date) : null));
  const [selectedTime, setSelectedTime] = useState(cachedDraft?.timeSlot || DEFAULT_BOOKING_DRAFT.timeSlot);
  // One show per day: dates already claimed by a submission cannot be picked again.
  const [bookedDates, setBookedDates] = useState(getBookedDateKeys);
  const [form, setForm] = useState(() => ({
    eventName: cachedDraft?.eventName ?? DEFAULT_BOOKING_DRAFT.eventName,
    venueName: cachedDraft?.venueName ?? DEFAULT_BOOKING_DRAFT.venueName,
    streetAddress: cachedDraft?.streetAddress ?? DEFAULT_BOOKING_DRAFT.streetAddress,
    city: cachedDraft?.city ?? DEFAULT_BOOKING_DRAFT.city,
    postalCode: cachedDraft?.postalCode ?? DEFAULT_BOOKING_DRAFT.postalCode,
  }));

  useEffect(() => {
    const refreshBookedDates = () => setBookedDates(getBookedDateKeys());
    refreshBookedDates();
    const unsubscribe = navigation?.addListener?.('focus', refreshBookedDates);
    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
    // Refreshing only needs to subscribe once; navigation identity is stable in the app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desktop gets all three cards on one row so the whole step fits a laptop
  // viewport without scrolling. Tablets put the calendar and time side by side
  // and let Venue & Address span the full width underneath.
  const splitLayout = layout.mode === 'desktop';
  const errors = validateVenueDetails(form);
  const complete = isVenueDetailsComplete(form);
  const selectedDateBooked = Boolean(selectedDate) && bookedDates.includes(toDateKey(selectedDate));
  // The venue postal code decides how show times are interpreted; the profile
  // preference is only a fallback for codes we cannot resolve yet.
  const venueTimeZone = getTimeZoneForPostalCode(form.postalCode);
  const timeZone = venueTimeZone || preferredTimeZone;
  const dateLabel = selectedDate ? formatSelectedDate(selectedDate, timeZone) : 'SELECT A TIME';

  const selectedSlot = findTimeSlot(selectedTime);
  const selectedTimePast = Boolean(selectedDate && selectedSlot && isTimeSlotPast(selectedSlot.hour, selectedDate, deviceNow));
  const selectedDateIsToday = Boolean(selectedDate && isSameDay(selectedDate, deviceNow));
  const noTimeSlotsLeftToday = selectedDateIsToday && TIME_SLOTS.every((slot) => isTimeSlotPast(slot.hour, selectedDate, deviceNow));
  const canContinue = complete && Boolean(selectedDate) && !selectedDateBooked && Boolean(selectedTime) && !selectedTimePast;

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function selectDate(date) {
    setSelectedDate(date);
    const tapNow = now || new Date();
    if (isSameDay(date, tapNow)) {
      const currentSlot = findTimeSlot(selectedTime);
      if (!currentSlot || isTimeSlotPast(currentSlot.hour, date, tapNow)) {
        const nextSlot = TIME_SLOTS.find((slot) => !isTimeSlotPast(slot.hour, date, tapNow));
        setSelectedTime(nextSlot ? nextSlot.value : null);
      }
      return;
    }
    // Moving off today restores a default time if every slot had already passed.
    if (!selectedTime) setSelectedTime(DEFAULT_BOOKING_DRAFT.timeSlot);
  }

  function continueToReview() {
    if (!canContinue) return;
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
          disabled={!canContinue}
          onPress={continueToReview}
        />
      )}
    >
      <View testID="booking-shell" style={styles.bookingShell}>
        <BookingWizardProgress currentStep={1} />

        {returningFromConflict && (
          <View testID="conflict-return-notice" accessibilityRole="alert" style={[s.card, styles.conflictNotice]}>
            <Text style={[s.label, styles.groupLabel]}>// DATE NO LONGER AVAILABLE</Text>
            <Text style={s.body}>Your event details are saved. Pick another date below to continue.</Text>
          </View>
        )}

        <View
          testID="booking-columns"
          style={[
            styles.columns,
            splitLayout ? styles.splitColumns : layout.wide && styles.tabletColumns,
          ]}
        >
          <View
            testID="booking-calendar-column"
            style={[
              s.card,
              styles.calendarCard,
              layout.tight && styles.tightCalendarCard,
              splitLayout ? styles.splitCalendarColumn : layout.wide && styles.tabletCalendarColumn,
            ]}
          >
            <CalendarPicker value={selectedDate} onChange={selectDate} today={deviceNow} unavailableDates={bookedDates} />
          </View>

          <View
            testID="booking-time-card"
            style={[s.card, layout.wide && styles.compactCard, layout.wide && (splitLayout ? styles.splitTimeColumn : styles.tabletTimeColumn)]}
          >
            <Text style={[s.label, styles.groupLabel]}>// SHOW TIME · 24 HOURS</Text>
            <Text testID="selected-date-label" style={[styles.timezone, layout.wide && styles.wideTimezone]}>
              {dateLabel}
            </Text>
            {selectedDateBooked && (
              <Text accessibilityLiveRegion="polite" style={styles.unavailableHint}>
                This date already has a show. Pick another date to continue.
              </Text>
            )}
            {!selectedDateBooked && noTimeSlotsLeftToday && (
              <Text testID="no-time-slots-hint" accessibilityLiveRegion="polite" style={styles.pastTimeHint}>
                No time slots remain today. Choose another date.
              </Text>
            )}
            {!selectedDateBooked && selectedTimePast && !noTimeSlotsLeftToday && (
              <Text testID="past-time-hint" accessibilityLiveRegion="polite" style={styles.pastTimeHint}>
                That start time has passed today. Pick a later time.
              </Text>
            )}
            <View accessibilityRole="radiogroup" style={styles.timeRow}>
              {TIME_SLOTS.map((slot) => {
                const active = slot.value === selectedTime;
                const slotPast = isTimeSlotPast(slot.hour, selectedDate, deviceNow);
                return (
                  <Pressable
                    key={slot.value}
                    testID={slot.testID}
                    accessibilityRole="radio"
                    accessibilityLabel={slot.value}
                    accessibilityState={slotPast ? { checked: active, disabled: true } : { checked: active }}
                    aria-checked={active}
                    disabled={slotPast}
                    onPress={() => setSelectedTime(slot.value)}
                    style={({ pressed }) => [
                      styles.slot,
                      layout.wide && styles.wideSlot,
                      layout.tight && styles.tightSlot,
                      active && styles.activeSlot,
                      slotPast && styles.disabledSlot,
                      pressed && !slotPast && styles.pressed,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.slotText,
                        layout.wide && styles.wideSlotText,
                        active && styles.activeSlotText,
                        slotPast && styles.disabledSlotText,
                      ]}
                    >
                      {slot.value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            testID="booking-venue-card"
            style={[s.card, layout.wide && styles.compactCard, layout.wide && (splitLayout ? styles.splitVenueColumn : styles.tabletVenueColumn)]}
          >
            <Text style={[s.label, styles.groupLabel]}>// VENUE & ADDRESS</Text>

            <View style={layout.wide ? styles.splitRow : undefined}>
              <View style={layout.wide ? styles.half : undefined}>
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
              </View>
              <View style={layout.wide ? styles.half : undefined}>
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
              </View>
            </View>

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
  bookingShell: { width: '100%' },
  tabletColumns: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 },
  tabletCalendarColumn: { flexBasis: '48%', flexGrow: 1, flexShrink: 0, marginBottom: 0 },
  tabletTimeColumn: { flexBasis: '48%', flexGrow: 1, flexShrink: 0, marginBottom: 0 },
  tabletVenueColumn: { flexBasis: '100%', flexGrow: 0, flexShrink: 0, marginBottom: 0 },
  // A tighter desktop gutter gives the show-time card the room it needs while
  // the venue card keeps its original width.
  splitColumns: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  splitCalendarColumn: { flexBasis: '29%', flexGrow: 0, flexShrink: 0, marginBottom: 0 },
  splitTimeColumn: { flexBasis: '27%', flexGrow: 0, flexShrink: 0, marginBottom: 0 },
  splitVenueColumn: { flexBasis: '42%', flexGrow: 1, flexShrink: 1, minWidth: 0, marginBottom: 0 },
  // Wide cards use a slightly tighter padding than the shared card default so
  // three columns can share one row without overflowing vertically.
  compactCard: { padding: 16 },
  calendarCard: { padding: 8 },
  tightCalendarCard: { padding: 6 },
  conflictNotice: { borderColor: colors.gold },
  groupLabel: { marginBottom: 10 },
  timezone: { color: colors.text, fontFamily: monoFont, fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 10 },
  wideTimezone: { fontSize: 13 },
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
  wideSlot: { minHeight: 44, flexBasis: '21%', paddingHorizontal: 2 },
  tightSlot: { minHeight: 40 },
  activeSlot: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  disabledSlot: { opacity: 0.35 },
  slotText: { color: colors.muted, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  wideSlotText: { fontSize: 11 },
  activeSlotText: { color: colors.accent },
  disabledSlotText: { color: colors.muted },
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
  wideInput: { minHeight: 44, fontSize: 13 },
  invalidInput: { borderColor: colors.error },
  splitRow: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, minWidth: 0 },
  validationHint: { color: colors.error, fontSize: 11, lineHeight: 16, marginTop: -2 },
  unavailableHint: { color: colors.gold, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  pastTimeHint: { color: colors.gold, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  timeZoneHint: { color: colors.muted, fontFamily: monoFont, fontSize: 9, letterSpacing: 0.3, lineHeight: 14, marginTop: -8, marginBottom: 12 },
  disclaimerDivider: { marginTop: 14, marginBottom: 10 },
  wideDisclaimer: { fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.7 },
});
