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
  // Desktop and iPad hold the receipt and the next steps side by side, with
  // the centred check status above both columns. Phones keep the stacked
  // order.
  const splitLayout = layout.wide;
  const tablet = layout.mode === 'tablet';
  // Every phone keeps both footer actions on one shallow row; the labels stay
  // at 11 px so they remain readable instead of shrinking to fit.
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
  const summaryItems = [
    { label: 'Scheduled', value: schedule },
    { label: 'Time zone', value: zoneLabel },
    { label: 'Drones', value: `${droneCount} drones` },
    { label: 'Duration', value: `${durationMinutes} minutes` },
  ];

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / BOOKING"
      label="NEW BOOKING // REQUEST SUBMITTED"
      badge="● CLIENT"
      showProgress={false}
      plainFooter
      compactHeader
      backLabel="BACK TO DASHBOARD"
      backGlyph="<"
      onBack={() => navigation.navigate('EmployeeDashboard')}
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={
        <View
          testID="submitted-footer"
          style={[
            styles.footer,
            {
              paddingHorizontal: layout.padding,
              paddingTop: layout.wide ? (layout.tight ? 8 : 12) : 17,
              paddingBottom: layout.wide ? (layout.tight ? 8 : 12) : 32,
            },
          ]}
        >
          <View style={[styles.footerAccent, { left: layout.padding }]} />
          <View
            testID="submitted-footer-inner"
            style={[styles.footerInner, !layout.wide && styles.footerInnerPhone, layout.wide && styles.footerInnerWide]}
          >
            <View style={layout.wide ? styles.receiptNoteWide : styles.receiptNotePhone}>
              <View style={layout.wide ? styles.receiptBadgeWide : styles.receiptBadgePhone}>
                <Text style={[styles.receiptGlyph, layout.wide && styles.receiptGlyphWide]}>✉</Text>
              </View>
              <View style={styles.receiptCopy}>
                {layout.wide && <Text style={styles.receiptLabel}>RECEIPT BY EMAIL</Text>}
                <Text style={[styles.receiptNote, layout.wide && styles.receiptTextWide]}>
                  A request receipt will be sent to{' '}
                  <Text style={styles.receiptEmail}>{mockRequestContact.email}</Text>
                </Text>
              </View>
            </View>
            {layout.wide && <View style={styles.footerDivider} />}
            <View
              testID="submitted-footer-actions"
              style={[
                styles.actionsGroup,
                layout.wide && styles.actionsGroupWide,
                !layout.wide && styles.phoneActionsRow,
              ]}
            >
              <View style={!layout.wide ? styles.footerActionSlot : undefined}>
                <Pressable
                  testID="submitted-schedule-again"
                  accessibilityRole="button"
                  accessibilityLabel="Schedule another show"
                  onPress={() => navigation.navigate('BookingDateVenue')}
                  style={({ pressed }) => [
                    styles.secondary,
                    layout.wide && styles.secondaryLinkWide,
                    !layout.wide && styles.secondaryPhone,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text numberOfLines={1} style={[styles.secondaryText, !layout.wide && styles.secondaryTextPhone]}>
                    + Schedule another show
                  </Text>
                </Pressable>
              </View>
              <View
                testID="submitted-footer-action"
                style={[
                  layout.wide && styles.footerActionWide,
                  tablet && styles.footerActionTablet,
                  !layout.wide && styles.footerActionSlot,
                ]}
              >
                <PrimaryButton
                  testID="submitted-to-dashboard"
                  title="View my requests"
                  showArrow
                  compact={!layout.wide}
                  onPress={() => navigation.navigate('EmployeeDashboard')}
                />
              </View>
            </View>
          </View>
        </View>
      }
    >
      <BookingWizardProgress currentStep={3} />

      <View
        testID="submitted-status"
        style={[
          styles.statusBlock,
          layout.wide && styles.statusBlockWide,
          tablet && styles.statusBlockTablet,
        ]}
      >
        <View
          style={[
            styles.badgeRing,
            layout.wide && styles.badgeRingWide,
            tablet && styles.badgeRingTablet,
          ]}
        >
          <View
            style={[
              styles.badgeCore,
              layout.wide && styles.badgeCoreWide,
              tablet && styles.badgeCoreTablet,
            ]}
          >
            <Text
              style={[
                styles.badgeCheck,
                layout.wide && styles.badgeCheckWide,
                tablet && styles.badgeCheckTablet,
              ]}
            >
              ✓
            </Text>
          </View>
        </View>
        <View style={styles.statusCopy}>
          <Text style={[styles.statusLabel, layout.wide && styles.wideStatusLabel]}>
            BOOKING REQUEST RECEIVED
          </Text>
          <Text style={[s.body, styles.warning, layout.wide && styles.warningWide]}>
            Your request has been sent to operations. Your show is not confirmed yet.
          </Text>
        </View>
      </View>

      <View testID="submitted-grid" style={[styles.grid, splitLayout && styles.gridWide]}>
        <View testID="submitted-primary-column" style={[styles.primaryColumn, splitLayout && styles.primaryDesktop]}>
          {booking ? (
            <View
              testID="booking-submitted"
              style={[
                s.card,
                styles.receiptCard,
                tablet && styles.tabletCard,
                splitLayout && styles.cardWide,
              ]}
            >
              <View style={[styles.receiptHeader, tablet && styles.tabletReceiptHeader]}>
                <Text testID="booking-reference" style={styles.reference}>
                  {reference}
                </Text>
                <Text style={styles.pendingPill}>PENDING REVIEW</Text>
              </View>
              <Text
                style={[
                  styles.eventName,
                  layout.wide && styles.wideEventName,
                  tablet && styles.tabletEventName,
                ]}
              >
                {eventName}
              </Text>

              {layout.wide ? (
                <View
                  testID="submitted-summary-grid"
                  style={styles.summaryGrid}
                >
                  {summaryItems.map((item) => (
                    <View key={item.label} style={styles.summaryCell}>
                      <Text style={[s.body, styles.summaryLabelWide]}>{item.label}</Text>
                      <Text style={styles.summaryValueLeft}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <>
                  {summaryItems.map((item) => (
                    <View key={item.label} style={styles.summaryRow}>
                      <Text style={s.body}>{item.label}</Text>
                      <Text style={styles.summaryValue}>{item.value}</Text>
                    </View>
                  ))}
                </>
              )}

              <View style={[s.divider, styles.divider, layout.wide && styles.dividerWide]} />
              <Text style={styles.location}>{location}</Text>
            </View>
          ) : (
            <View style={[s.card, tablet && styles.tabletCard, splitLayout && styles.cardWide]} accessibilityRole="alert">
              <Text style={s.errorTitle}>No request to show</Text>
              <Text style={[s.body, styles.emptyMessage]}>Start a booking to send a scheduling request.</Text>
            </View>
          )}
        </View>

        <View testID="submitted-secondary-column" style={[styles.secondaryColumn, splitLayout && styles.secondaryWide]}>
          <View
            style={[
              s.card,
              styles.stepsCard,
              tablet && styles.tabletCard,
              tablet && styles.tabletStepsCard,
              splitLayout && styles.cardWide,
            ]}
          >
            <Text style={[s.label, styles.groupLabel]}>// WHAT HAPPENS NEXT</Text>
            <View style={styles.stepsList}>
              {REVIEW_STEPS.map((step, index) => (
                <View
                  key={step.title}
                  testID={`review-step-${index + 1}`}
                  style={[styles.step, !step.active && styles.inactiveStep]}
                >
                  <View
                    style={[
                      styles.stepNumber,
                      step.active && styles.activeStepNumber,
                      tablet && styles.tabletStepNumber,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNumberText,
                        step.active && styles.activeStepNumberText,
                        tablet && styles.tabletStepNumberText,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.stepCopy}>
                    <Text
                      style={[
                        styles.stepTitle,
                        step.active && styles.activeStepTitle,
                        tablet && styles.tabletStepTitle,
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={[s.body, layout.wide && styles.wideStepBody]}>{step.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View
        testID="submitted-info"
        style={[
          s.card,
          styles.infoCard,
          tablet && styles.tabletInfoCard,
          splitLayout && styles.cardWide,
          splitLayout && styles.infoAfterGrid,
        ]}
      >
        <View style={styles.infoIcon}>
          <Text style={styles.infoGlyph}>i</Text>
        </View>
        <Text style={[s.body, styles.infoText, layout.wide && styles.infoTextWide]}>
          This request is temporarily saved on this device. Once the operations API is connected the date lock and
          confirmation will sync automatically.
        </Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  grid: { width: '100%' },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 0 },
  primaryColumn: { width: '100%' },
  primaryDesktop: { flexBasis: '52%', flexGrow: 0, flexShrink: 0 },
  secondaryColumn: { width: '100%' },
  secondaryWide: { flex: 1, minWidth: 0, gap: 12 },
  tabletCard: { padding: 10, marginBottom: 6, borderRadius: 8 },
  cardWide: { padding: 14, marginBottom: 0, borderRadius: 8 },
  statusBlock: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBlockWide: { marginTop: 0, marginBottom: 16, paddingVertical: 8 },
  statusBlockTablet: { marginBottom: 12 },
  statusCopy: { alignItems: 'center' },
  badgeRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeRingWide: { width: 48, height: 48, borderRadius: 24, marginBottom: 10 },
  badgeRingTablet: { width: 46, height: 46, borderRadius: 23, marginBottom: 8 },
  badgeCore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCoreWide: { width: 36, height: 36, borderRadius: 18 },
  badgeCoreTablet: { width: 34, height: 34, borderRadius: 17 },
  badgeCheck: { color: colors.accent, fontSize: 22, fontWeight: '700', lineHeight: 26 },
  badgeCheckWide: { fontSize: 16, lineHeight: 19 },
  badgeCheckTablet: { fontSize: 15, lineHeight: 18 },
  statusLabel: {
    color: colors.accent,
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
  wideStatusLabel: { fontSize: 12 },
  warning: { textAlign: 'center', maxWidth: 320, lineHeight: 17 },
  warningWide: { textAlign: 'center', maxWidth: 520, fontSize: 11, lineHeight: 16 },
  receiptCard: { borderColor: colors.accent, borderWidth: 1, backgroundColor: '#121600' },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  tabletReceiptHeader: { marginBottom: 6 },
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
  wideEventName: { fontSize: 20, marginBottom: 10 },
  tabletEventName: { fontSize: 17, marginBottom: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 9, marginBottom: 2 },
  summaryCell: { flexBasis: '47%', flexGrow: 1, minWidth: 0 },
  summaryLabelWide: { fontSize: 9, lineHeight: 13, marginBottom: 2 },
  summaryValueLeft: { color: colors.text, fontFamily: monoFont, fontSize: 12, lineHeight: 17 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 9,
  },
  summaryValue: {
    color: colors.text,
    fontFamily: monoFont,
    fontSize: 12,
    lineHeight: 17,
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: { marginVertical: 12 },
  dividerWide: { marginVertical: 8 },
  location: { color: colors.text, fontSize: 12, lineHeight: 18 },
  stepsCard: { gap: 14 },
  tabletStepsCard: { gap: 8, padding: 10, marginBottom: 6 },
  stepsList: { gap: 14 },
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
  tabletStepNumber: { width: 22, height: 22, borderRadius: 11 },
  activeStepNumber: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  stepNumberText: { color: colors.muted, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  tabletStepNumberText: { fontSize: 10 },
  activeStepNumberText: { color: colors.accent },
  stepCopy: { flex: 1, minWidth: 0 },
  stepTitle: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  tabletStepTitle: { fontSize: 11, lineHeight: 15 },
  wideStepBody: { fontSize: 12, lineHeight: 17 },
  activeStepTitle: { color: colors.gold },
  infoCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.field,
  },
  // On tablet and desktop the note spans both columns as a single full-width
  // row underneath them, rather than being pinned inside one column.
  infoAfterGrid: { width: '100%', marginTop: 12, marginBottom: 0 },
  tabletInfoCard: { alignItems: 'center', padding: 8, marginBottom: 0, borderRadius: 8 },
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
  infoText: { flex: 1, lineHeight: 18 },
  infoTextWide: { fontSize: 12, lineHeight: 17 },
  emptyMessage: { marginBottom: 4 },
  footer: {
    width: '100%',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerAccent: {
    position: 'absolute',
    top: -1,
    width: 56,
    height: 2,
    backgroundColor: colors.accent,
    borderBottomRightRadius: 2,
  },
  footerInner: { width: '100%', flexDirection: 'column', gap: 8 },
  footerInnerPhone: { gap: 4 },
  footerInnerWide: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  receiptNotePhone: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  receiptNoteWide: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  receiptBadgePhone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptBadgeWide: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptGlyph: { color: colors.accent, fontSize: 11, lineHeight: 14 },
  receiptGlyphWide: { fontSize: 14, lineHeight: 17 },
  receiptCopy: { flex: 1, minWidth: 0 },
  receiptLabel: {
    color: colors.accent,
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  receiptNote: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  receiptTextWide: { fontSize: 12, lineHeight: 16 },
  receiptEmail: { color: colors.text, textDecorationLine: 'underline' },
  footerDivider: { width: 1, height: 44, backgroundColor: colors.border },
  actionsGroup: { width: '100%' },
  actionsGroupWide: {
    width: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
    flexShrink: 0,
  },
  // Both phone actions sit in equal slots, matching the manage-show footer.
  phoneActionsRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  footerActionSlot: { flex: 1, flexBasis: 0, minWidth: 0 },
  footerActionWide: { width: 320, flexShrink: 0 },
  footerActionTablet: { width: 240 },
  secondary: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  secondaryLinkWide: { minHeight: 44, flexShrink: 0 },
  secondaryPhone: {
    width: '100%',
    minHeight: 38,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.field,
  },
  secondaryText: { color: colors.accent, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  secondaryTextPhone: { color: colors.text, fontSize: 11 },
  pressed: { opacity: 0.72 },
});
