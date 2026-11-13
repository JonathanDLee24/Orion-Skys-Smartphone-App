import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BookingWizardProgress from '../components/BookingWizardProgress';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import SendPlaneIcon from '../components/SendPlaneIcon';
import { DEFAULT_BOOKING_DRAFT, getLatestBookingDraft, markBookingSubmitted } from '../services/bookingDraftService';
import { formatUnavailableSlot, requestBookingSlot } from '../services/bookingConflictService';
import { mockRequestContact } from '../mockData';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function shortZoneLabel(booking) {
  const label = booking?.timeZoneLabel || '';
  return label.split(' · ').pop() || booking?.timeZone || '';
}

// The draft stores its date as YYYY-MM-DD, so the calendar block can be built
// without parsing the formatted schedule line or shifting the local timezone.
function getDateBlock(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
  if (!match) return null;
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return { month: MONTH_LABELS[monthIndex], day: String(Number(match[3])) };
}

export default function BookingReviewScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  // Only desktop reviews the request in two columns. iPad keeps one stacked
  // column in both orientations, with compact cards so it still fits one
  // landscape frame without scrolling. Phones use the same reading order.
  const splitLayout = layout.mode === 'desktop';
  const tablet = layout.mode === 'tablet';
  const booking = route?.params?.booking || getLatestBookingDraft();
  const schedule = booking ? formatUnavailableSlot({ date: booking.date, timeSlot: booking.timeSlot }) : '';
  const zoneHelper = booking ? `${shortZoneLabel(booking)} · requested start time` : '';
  const address = booking
    ? [booking.streetAddress, `${booking.city || ''} ${booking.postalCode || ''}`.trim()].filter(Boolean).join(', ')
    : '';
  const dateBlock = booking ? getDateBlock(booking.date) : null;
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
      plainFooter
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={
        booking ? (
          <View
            testID="review-footer"
            style={[
              styles.footer,
              {
                paddingHorizontal: layout.padding,
                paddingTop: layout.wide ? (layout.tight ? 10 : 14) : 10,
                paddingBottom: layout.wide ? (layout.tight ? 10 : 14) : 16,
              },
            ]}
          >
            <View style={[styles.footerAccent, { left: layout.padding }]} />
            <View testID="review-footer-inner" style={[styles.footerInner, layout.wide && styles.footerInnerWide]}>
              <View testID="payment-note" style={layout.wide ? styles.paymentNoteWide : styles.paymentNotePhone}>
                <View style={layout.wide ? styles.paymentBadgeWide : styles.paymentBadgePhone}>
                  <View style={styles.paymentBadgeRing}>
                    <Text style={[styles.paymentCheck, layout.wide && styles.paymentCheckWide]}>✓</Text>
                  </View>
                </View>
                <View style={styles.paymentCopy}>
                  {layout.wide && <Text style={styles.paymentLabel}>NO PAYMENT DUE</Text>}
                  <Text style={[styles.paymentTextPhone, layout.wide && styles.paymentTextWide]}>
                    No payment is due when submitting this request.
                  </Text>
                </View>
              </View>
              {layout.wide && <View style={styles.footerDivider} />}
              <View
                testID="review-footer-action"
                style={[styles.footerAction, layout.wide && styles.footerActionWide]}
              >
                <PrimaryButton
                  testID="submit-request"
                  title="Submit booking request"
                  leadingIcon={<SendPlaneIcon size={18} color={colors.background} />}
                  onPress={submitRequest}
                />
              </View>
            </View>
          </View>
        ) : null
      }
    >
      <BookingWizardProgress currentStep={2} />

      {booking ? (
        <View style={styles.shell}>
          <View testID="review-grid" style={[styles.grid, splitLayout && styles.gridWide]}>
            <View testID="review-primary-column" style={[styles.primaryColumn, splitLayout && styles.primaryDesktop]}>
              <View style={[s.card, tablet && styles.tabletCard, splitLayout && styles.cardWide]}>
                <View style={[styles.cardHeader, tablet && styles.tabletCardHeader]}>
                  <Text style={s.label}>// DATE &amp; VENUE</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit date & venue"
                    onPress={editDateVenue}
                    style={({ pressed }) => [styles.editLink, splitLayout && styles.editLinkWide, pressed && styles.pressed]}
                  >
                    <Text style={[styles.editText, splitLayout && styles.editTextWide]}>Edit</Text>
                  </Pressable>
                </View>

                <View style={tablet ? styles.tabletDateVenueRow : undefined}>
                  <View style={tablet ? styles.tabletHalf : undefined}>
                    <Text style={[s.label, styles.subLabel]}>DATE</Text>
                    <View style={styles.dateRow}>
                      {dateBlock ? (
                        <View
                          accessibilityElementsHidden
                          importantForAccessibility="no-hide-descendants"
                          style={[styles.dateBlock, layout.wide && styles.dateBlockWide, tablet && styles.tabletDateBlock]}
                        >
                          <Text style={[styles.dateMonth, layout.wide && styles.dateMonthWide, tablet && styles.tabletDateMonth]}>
                            {dateBlock.month}
                          </Text>
                          <Text style={[styles.dateDay, layout.wide && styles.dateDayWide, tablet && styles.tabletDateDay]}>
                            {dateBlock.day}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.dateCopy}>
                        <Text style={[styles.fieldValue, splitLayout && styles.fieldValueWide]}>{schedule}</Text>
                        <Text style={[s.body, styles.helper, tablet && styles.tabletHelper]}>{zoneHelper}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={tablet ? styles.tabletVerticalDivider : [s.divider, styles.divider]} />

                  <View style={tablet ? styles.tabletHalf : undefined}>
                    <Text style={[s.label, styles.subLabel]}>VENUE</Text>
                    <Text style={[styles.venueName, splitLayout && styles.venueNameWide]}>{booking.venueName}</Text>
                    <Text style={[styles.address, splitLayout && styles.addressWide, tablet && styles.tabletAddress]}>{address}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View testID="review-secondary-column" style={[styles.secondaryColumn, splitLayout && styles.secondaryWide]}>
              <View style={[s.card, tablet && styles.tabletCard, splitLayout && styles.cardWide]}>
                <Text style={[s.label, styles.groupLabel, splitLayout && styles.groupLabelWide, tablet && styles.tabletGroupLabel]}>// EVENT SPECIFICATIONS</Text>
                {tablet ? (
                  <View style={styles.tabletSpecRow}>
                    <View style={[styles.fieldBox, styles.tabletSpecBox, styles.tabletSpecEvent]}>
                      <Text style={[s.label, styles.subLabel, styles.tabletSpecLabel]}>EVENT NAME</Text>
                      <Text style={styles.fieldValue}>{booking.eventName}</Text>
                    </View>
                    <View style={[styles.fieldBox, styles.tabletSpecBox, styles.tabletSpecCell]}>
                      <Text style={[s.label, styles.subLabel, styles.tabletSpecLabel]}>DRONE COUNT</Text>
                      <Text style={styles.fieldValue}>{`${droneCount} drones`}</Text>
                    </View>
                    <View style={[styles.fieldBox, styles.tabletSpecBox, styles.tabletSpecCell]}>
                      <Text style={[s.label, styles.subLabel, styles.tabletSpecLabel]}>SHOW DURATION</Text>
                      <Text style={styles.fieldValue}>{`${durationMinutes} minutes`}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={[styles.fieldBox, splitLayout && styles.fieldBoxWide]}>
                      <Text style={[s.label, styles.subLabel]}>EVENT NAME</Text>
                      <Text style={[styles.fieldValue, splitLayout && styles.fieldValueWide]}>{booking.eventName}</Text>
                    </View>
                    <View style={styles.specRow}>
                      <View style={[styles.fieldBox, styles.specCell, splitLayout && styles.fieldBoxWide, splitLayout && styles.specCellWide]}>
                        <Text style={[s.label, styles.subLabel]}>DRONE COUNT</Text>
                        <Text style={[styles.fieldValue, splitLayout && styles.fieldValueWide]}>{`${droneCount} drones`}</Text>
                      </View>
                      <View style={[styles.fieldBox, styles.specCell, splitLayout && styles.fieldBoxWide, splitLayout && styles.specCellWide]}>
                        <Text style={[s.label, styles.subLabel]}>SHOW DURATION</Text>
                        <Text style={[styles.fieldValue, splitLayout && styles.fieldValueWide]}>{`${durationMinutes} minutes`}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              <View style={[s.card, tablet && styles.tabletCard, splitLayout && styles.cardWide, splitLayout && styles.contactCard]}>
                <Text style={[s.label, styles.groupLabel, splitLayout && styles.groupLabelWide, tablet && styles.tabletGroupLabel]}>// REQUEST CONTACT</Text>
                <Text style={[styles.contactName, splitLayout && styles.contactNameWide, tablet && styles.tabletContactName]}>
                  {`${mockRequestContact.name} · ${mockRequestContact.organization}`}
                </Text>
                <Text style={[styles.address, splitLayout && styles.addressWide, tablet && styles.tabletAddress]}>{mockRequestContact.email}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.disclaimerCard, tablet && styles.tabletDisclaimer, !splitLayout && !tablet && s.card, splitLayout && styles.disclaimerWide]}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoGlyph}>i</Text>
            </View>
            <Text style={[s.body, styles.disclaimerText, tablet && styles.tabletDisclaimerText, splitLayout && styles.disclaimerTextWide]}>
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
  shell: { width: '100%' },
  grid: { width: '100%' },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 10 },
  primaryColumn: { width: '100%' },
  primaryDesktop: { flexBasis: '52%', flexGrow: 0, flexShrink: 0 },
  // iPad keeps one column but tightens every card so the review still fits a
  // landscape frame: Date & Venue share the card, specs sit in one row and the
  // contact and disclaimer become single compact blocks.
  tabletCard: { padding: 14, marginBottom: 8, borderRadius: 8 },
  secondaryColumn: { width: '100%' },
  secondaryWide: { flex: 1, minWidth: 0, gap: 12 },
  // Wide cards drop the shared 24 px margin because the column gap owns the
  // spacing, and a tighter padding keeps the review inside one frame.
  cardWide: { padding: 14, marginBottom: 0, borderRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  tabletCardHeader: { marginBottom: 6 },
  editLink: { minHeight: 44, justifyContent: 'center' },
  editLinkWide: { minHeight: 32 },
  editText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  editTextWide: { fontSize: 13 },
  pressed: { opacity: 0.7 },
  subLabel: { marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBlock: {
    width: 56,
    minHeight: 66,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBlockWide: { width: 66, minHeight: 76 },
  tabletDateVenueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  tabletHalf: { flex: 1, minWidth: 0 },
  tabletVerticalDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  tabletDateBlock: { width: 50, minHeight: 58 },
  tabletDateMonth: { fontSize: 9 },
  tabletDateDay: { fontSize: 20, lineHeight: 24 },
  dateMonth: { color: colors.accent, fontFamily: monoFont, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  dateMonthWide: { fontSize: 10 },
  dateDay: { color: colors.text, fontFamily: monoFont, fontSize: 24, fontWeight: '700', lineHeight: 28 },
  dateDayWide: { fontSize: 30, lineHeight: 34 },
  dateCopy: { flex: 1, minWidth: 0 },
  fieldValue: { color: colors.text, fontFamily: monoFont, fontSize: 12, lineHeight: 18 },
  fieldValueWide: { fontSize: 13, lineHeight: 20 },
  helper: { marginTop: 3 },
  tabletHelper: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  divider: { marginVertical: 12 },
  venueName: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  venueNameWide: { fontSize: 16 },
  address: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  addressWide: { fontSize: 13, lineHeight: 20 },
  tabletAddress: { fontSize: 11, lineHeight: 16 },
  groupLabel: { marginBottom: 10 },
  groupLabelWide: { marginBottom: 8 },
  tabletGroupLabel: { marginBottom: 6 },
  fieldBox: {
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  fieldBoxWide: { padding: 8, marginBottom: 6 },
  specRow: { flexDirection: 'row', gap: 10 },
  specCell: { flex: 1, minWidth: 0, marginBottom: 0 },
  specCellWide: { marginBottom: 0 },
  tabletSpecRow: { flexDirection: 'row', gap: 8 },
  tabletSpecBox: { padding: 8, marginBottom: 0 },
  tabletSpecEvent: { flex: 1.6, minWidth: 0 },
  tabletSpecCell: { flex: 1, minWidth: 0 },
  tabletSpecLabel: { fontSize: 9, lineHeight: 14 },
  contactCard: { marginTop: 0 },
  contactName: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  contactNameWide: { fontSize: 14 },
  tabletContactName: { fontSize: 12, lineHeight: 18, marginBottom: 2 },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
  },
  // The card style is dropped on wide screens, so this fully owns the frame
  // and its compact padding actually wins over the shared 24 px card padding.
  disclaimerWide: {
    alignItems: 'center',
    padding: 12,
    marginBottom: 0,
    borderRadius: 8,
  },
  tabletDisclaimer: { alignItems: 'center', padding: 9, marginBottom: 0, borderRadius: 8 },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGlyph: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  disclaimerText: { flex: 1, lineHeight: 18 },
  disclaimerTextWide: { lineHeight: 22 },
  tabletDisclaimerText: { fontSize: 12, lineHeight: 17 },
  emptyMessage: { marginBottom: 20 },
  footer: {
    width: '100%',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerAccent: { position: 'absolute', top: -1, width: 56, height: 2, backgroundColor: colors.accent, borderBottomRightRadius: 2 },
  footerInner: { width: '100%', flexDirection: 'column', gap: 6 },
  footerInnerWide: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  // Desktop and tablet keep the note airy beside the action; phones get a
  // single-line note so the footer stays as short as possible.
  paymentNotePhone: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paymentNoteWide: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  paymentBadgePhone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBadgeWide: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBadgeRing: {
    width: '72%',
    height: '72%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(218, 255, 2, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCheck: { color: colors.accent, fontFamily: monoFont, fontSize: 10, fontWeight: '700', lineHeight: 12 },
  paymentCheckWide: { fontSize: 17, lineHeight: 19 },
  paymentCopy: { flex: 1, minWidth: 0 },
  paymentLabel: { color: colors.accent, fontFamily: monoFont, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  paymentTextPhone: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  paymentTextWide: { fontSize: 12, lineHeight: 17 },
  footerDivider: { width: 1, height: 44, backgroundColor: colors.border },
  footerAction: { width: '100%' },
  footerActionWide: { width: 320, flexShrink: 0 },
});
