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
  // Desktop and iPad mirror the review/receipt screens: event identity on the
  // left, venue and logistics on the right, then a full-width note. Phones
  // stack the same order.
  const splitLayout = layout.wide;
  const tablet = layout.mode === 'tablet';
  const adminReturn = route?.params?.adminReturn;
  const [record, setRecord] = useState(
    () => route?.params?.submission || route?.params?.booking || getNextScheduledSubmission()
  );
  const [confirming, setConfirming] = useState(false);
  const status = record?.status || 'pending';
  const cancelled = status === CANCELLED_STATUS;
  const confirmed = status === 'confirmed';
  const completed = status === 'completed';
  const statusPill = cancelled
    ? '● CANCELLED'
    : confirmed
      ? '● CONFIRMED'
      : completed
        ? '● COMPLETED'
        : '● IN REVIEW';

  function backToDashboard() {
    navigation.navigate(adminReturn || 'EmployeeDashboard');
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
        caption={adminReturn ? 'ADMIN OPERATIONS / BOOKINGS' : 'EMPLOYEE OPERATIONS / BOOKINGS'}
        label="SHOW MANAGEMENT // BOOKING"
        title="Booking not found."
        secure
        showProgress={false}
        onBack={backToDashboard}
        backLabel={adminReturn ? 'Back to admin schedule' : 'Back to dashboard'}
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
  const hasMetrics = droneCount > 0 || durationMinutes > 0;

  const footerNote = cancelled
    ? 'The date is available to book again.'
    : completed
      ? 'Archived show — details stay available.'
      : confirming
        ? 'Cancelling releases the date and cannot be undone.'
        : confirmed
          ? 'This show is confirmed. Cancelling releases its date.'
          : 'Venue & airspace review is still pending.';

  const firstAction =
    completed || cancelled ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Schedule another show"
        onPress={() => navigation.navigate('BookingDateVenue')}
        style={({ pressed }) => [
          styles.secondary,
          !layout.wide && styles.actionPhone,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={1} style={[styles.secondaryText, !layout.wide && styles.actionTextPhone]}>
          + Schedule another show
        </Text>
      </Pressable>
    ) : confirming ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Yes, cancel booking"
        onPress={confirmCancellation}
        style={({ pressed }) => [
          styles.destructive,
          !layout.wide && styles.actionPhone,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={1} style={[styles.destructiveText, !layout.wide && styles.actionTextPhone]}>
          Yes, cancel booking
        </Text>
      </Pressable>
    ) : (
      <PrimaryButton
        title="Keep booking"
        compact={!layout.wide}
        onPress={backToDashboard}
      />
    );

  const secondAction =
    completed || cancelled ? (
      <PrimaryButton
        title="Back to dashboard"
        showArrow
        compact={!layout.wide}
        onPress={backToDashboard}
      />
    ) : confirming ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Keep booking"
        onPress={() => setConfirming(false)}
        style={({ pressed }) => [
          styles.secondary,
          !layout.wide && styles.actionPhone,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={1} style={[styles.secondaryText, !layout.wide && styles.actionTextPhone]}>
          Keep booking
        </Text>
      </Pressable>
    ) : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel booking"
        onPress={() => setConfirming(true)}
        style={({ pressed }) => [
          styles.destructiveOutline,
          !layout.wide && styles.actionPhone,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={1} style={[styles.destructiveOutlineText, !layout.wide && styles.actionTextPhone]}>
          Cancel booking
        </Text>
      </Pressable>
    );

  return (
    <ScreenLayout
      caption={adminReturn ? 'ADMIN OPERATIONS / BOOKINGS' : 'EMPLOYEE OPERATIONS / BOOKINGS'}
      label={`SHOW MANAGEMENT // ${record.reference || 'BOOKING'}`}
      title={cancelled ? undefined : completed ? 'Past show.' : 'Manage this show.'}
      badge={statusPill}
      headerTone={cancelled ? 'danger' : confirmed ? 'success' : completed ? undefined : 'gold'}
      secure
      showProgress={false}
      plainFooter
      onBack={backToDashboard}
      backLabel={adminReturn ? 'Back to admin schedule' : 'Back to dashboard'}
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={
        <View
          testID="manage-footer"
          style={[
            styles.footer,
            {
              paddingHorizontal: layout.padding,
              paddingTop: layout.wide ? (layout.tight ? 8 : 12) : 17,
              paddingBottom: layout.wide ? (layout.tight ? 8 : 12) : 17,
            },
          ]}
        >
          <View style={[styles.footerAccent, { left: layout.padding }]} />
          <View testID="manage-footer-inner" style={[styles.footerInner, layout.wide && styles.footerInnerWide]}>
            {layout.wide && (
              <View testID="manage-footer-note" style={styles.footerNoteWide}>
                <View style={styles.footerBadgeWide}>
                  <Text style={[styles.footerGlyph, styles.footerGlyphWide]}>i</Text>
                </View>
                <View style={styles.footerCopy}>
                  <Text style={styles.footerLabel}>SHOW STATUS</Text>
                  <Text style={styles.footerNoteTextWide}>{footerNote}</Text>
                </View>
              </View>
            )}
            {layout.wide && <View style={styles.footerDivider} />}
            <View
              testID="manage-footer-actions"
              style={[
                styles.footerActions,
                layout.wide ? styles.footerActionsWide : styles.footerActionsPhone,
                layout.wide && { width: layout.mode === 'desktop' ? 508 : 440 },
              ]}
            >
              <View style={styles.footerActionSlot}>{firstAction}</View>
              <View style={styles.footerActionSlot}>{secondAction}</View>
            </View>
          </View>
        </View>
      }
    >
      {cancelled ? (
        <View
          testID="cancelled-state"
          accessibilityRole="alert"
          style={[styles.statusBlock, layout.wide && styles.statusBlockWide, tablet && styles.statusBlockTablet]}
        >
          <View
            style={[
              styles.statusRing,
              layout.wide && styles.statusRingWide,
              tablet && styles.statusRingTablet,
            ]}
          >
            <View
              style={[
                styles.statusCore,
                layout.wide && styles.statusCoreWide,
                tablet && styles.statusCoreTablet,
              ]}
            >
              <Text
                style={[
                  styles.statusMark,
                  layout.wide && styles.statusMarkWide,
                  tablet && styles.statusMarkTablet,
                ]}
              >
                ✕
              </Text>
            </View>
          </View>
          <View style={styles.statusCopy}>
            <Text style={[styles.statusLabel, layout.wide && styles.statusLabelWide]}>BOOKING CANCELLED</Text>
            <Text style={[s.body, styles.statusWarning, layout.wide && styles.statusWarningWide]}>
              Your booking has been cancelled. This date is available to book again.
            </Text>
          </View>
        </View>
      ) : null}

      {!cancelled && (
        <Text style={[s.body, styles.intro, splitLayout && styles.introWide]}>
          {completed
            ? 'This show has completed. Its details remain available in your event archive.'
            : 'Review the booked show below. Cancelling releases its date immediately.'}
        </Text>
      )}

      <View
        testID="manage-grid"
        style={[styles.grid, splitLayout && styles.gridWide, confirming && styles.gridDimmed]}
      >
        <View testID="manage-primary-column" style={[styles.primaryColumn, splitLayout && styles.primaryWide]}>
          <View
            testID="manage-booking"
            style={[
              s.card,
              tablet && styles.tabletCard,
              splitLayout && styles.cardWide,
              cancelled && styles.cancelledCard,
            ]}
          >
            <View style={[styles.cardHeader, tablet && styles.tabletCardHeader]}>
              <Text style={[s.label, styles.groupLabel]}>// YOUR EVENT DETAILS</Text>
              <Text
                style={[
                  styles.pendingPill,
                  confirmed && styles.confirmedPill,
                  completed && styles.completedPill,
                  cancelled && styles.cancelledPill,
                ]}
              >
                {statusPill}
              </Text>
            </View>
            <Text style={[styles.eventName, layout.wide && styles.wideEventName]}>{record.eventName}</Text>
            <SummaryRow s={s} label="Reference" value={record.reference || '—'} />
            <SummaryRow s={s} label="Date" value={date} />
            <SummaryRow s={s} label="Time" value={record.timeSlot} />
            <SummaryRow s={s} label="Time zone" value={record.timeZoneLabel || record.timeZone || '—'} />
          </View>
        </View>

        <View testID="manage-secondary-column" style={[styles.secondaryColumn, splitLayout && styles.secondaryWide]}>
          <View style={[s.card, tablet && styles.tabletCard, splitLayout && styles.cardWide]}>
            <Text style={[s.label, styles.groupLabel, tablet && styles.tabletGroupLabel]}>
              // VENUE &amp; LOGISTICS
            </Text>
            <Text style={[styles.venueName, layout.wide && styles.wideVenueName]}>
              {record.venueName || '—'}
            </Text>
            <Text style={[styles.address, layout.wide && styles.wideAddress]}>{address || '—'}</Text>

            {hasMetrics ? (
              <>
                <View style={[s.divider, styles.metricsDivider]} />
                <View style={styles.metrics}>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, layout.wide && styles.wideMetricValue]}>
                      {`${droneCount} drones`}
                    </Text>
                    <Text style={s.label}>FLEET SIZE</Text>
                  </View>
                  <View style={[styles.metric, styles.metricDivider]}>
                    <Text style={[styles.metricValue, layout.wide && styles.wideMetricValue]}>
                      {`${durationMinutes} minutes`}
                    </Text>
                    <Text style={s.label}>SHOW DURATION</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {confirming ? (
        <View
          testID="cancel-confirmation"
          accessibilityRole="alert"
          style={[
            s.card,
            styles.confirmCard,
            tablet && styles.tabletCard,
            splitLayout && styles.cardWide,
            splitLayout && styles.infoAfterGrid,
          ]}
        >
          <Text style={styles.confirmTitle}>Cancel this booking?</Text>
          <Text style={[s.body, styles.confirmCopy]}>
            This releases {date} so another client can book it. Your show brief and crew assignments for this
            request will be removed. This cannot be undone.
          </Text>
        </View>
      ) : (
        <View
          testID="manage-info"
          style={[
            s.card,
            styles.infoCard,
            tablet && styles.tabletCard,
            splitLayout && styles.cardWide,
            splitLayout && styles.infoAfterGrid,
          ]}
        >
          <View style={styles.infoIcon}>
            <Text style={styles.infoGlyph}>i</Text>
          </View>
          <Text style={[s.body, styles.infoText]}>
            {cancelled
              ? 'Every detail stays visible for your records. Schedule another show whenever you are ready.'
              : completed
                ? 'This event is archived. Completed shows stay available for your records.'
                : `Cancelling frees ${date}. Every detail stays visible until you confirm.`}
          </Text>
        </View>
      )}

      {!cancelled && !confirming ? (
        // Not wired to a screen yet; the Show Authorization page is built next.
        <Pressable
          testID="show-authorization"
          accessibilityRole="button"
          accessibilityLabel="Show Authorization"
          style={({ pressed }) => [
            styles.authorization,
            tablet && styles.authorizationTablet,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.authorizationText}>Show Authorization</Text>
          <Text style={styles.authorizationChevron}>→</Text>
        </Pressable>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  grid: { width: '100%' },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 0 },
  gridDimmed: { opacity: 0.6 },
  primaryColumn: { width: '100%' },
  primaryWide: { flexBasis: '52%', flexGrow: 0, flexShrink: 0 },
  secondaryColumn: { width: '100%' },
  secondaryWide: { flex: 1, minWidth: 0 },
  tabletCard: { padding: 10, marginBottom: 6, borderRadius: 8 },
  cardWide: { padding: 14, marginBottom: 0, borderRadius: 8 },
  intro: { marginTop: -8, marginBottom: 14 },
  introWide: { marginTop: 0, marginBottom: 10 },
  emptyCopy: { marginBottom: 20 },
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
  statusRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusRingWide: { width: 48, height: 48, borderRadius: 24, marginBottom: 10 },
  statusRingTablet: { width: 46, height: 46, borderRadius: 23, marginBottom: 8 },
  statusCore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: '#240807',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCoreWide: { width: 36, height: 36, borderRadius: 18 },
  statusCoreTablet: { width: 34, height: 34, borderRadius: 17 },
  statusMark: { color: colors.error, fontSize: 22, fontWeight: '700', lineHeight: 26 },
  statusMarkWide: { fontSize: 16, lineHeight: 19 },
  statusMarkTablet: { fontSize: 15, lineHeight: 18 },
  statusCopy: { alignItems: 'center' },
  statusLabel: {
    color: colors.error,
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
  statusLabelWide: { fontSize: 12 },
  statusWarning: { textAlign: 'center', maxWidth: 340, lineHeight: 17 },
  statusWarningWide: { textAlign: 'center', maxWidth: 520, fontSize: 11, lineHeight: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  tabletCardHeader: { marginBottom: 7 },
  groupLabel: { marginBottom: 0 },
  tabletGroupLabel: { marginBottom: 6 },
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
  confirmedPill: {
    color: colors.green,
    backgroundColor: '#04241C',
    borderColor: colors.green,
  },
  completedPill: {
    color: colors.muted,
    backgroundColor: colors.field,
    borderColor: colors.border,
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
  eventName: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  wideEventName: { fontSize: 22, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 9 },
  summaryValue: { color: colors.text, fontFamily: monoFont, fontSize: 12, lineHeight: 17, flexShrink: 1, textAlign: 'right' },
  venueName: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 5 },
  wideVenueName: { fontSize: 17 },
  address: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  wideAddress: { fontSize: 13, lineHeight: 20 },
  metricsDivider: { marginVertical: 12 },
  metrics: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, minWidth: 0 },
  metricDivider: { borderLeftWidth: 1, borderColor: colors.border, paddingLeft: 14 },
  metricValue: { color: colors.accent, fontFamily: monoFont, fontSize: 16, fontWeight: '700', marginBottom: 5 },
  wideMetricValue: { fontSize: 20 },
  confirmCard: { borderColor: colors.error, borderWidth: 1, backgroundColor: '#170807' },
  confirmTitle: { color: colors.error, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  confirmCopy: { lineHeight: 18 },
  cancelledCard: { borderColor: colors.error, borderWidth: 1, backgroundColor: '#170807' },
  infoCard: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.field },
  infoAfterGrid: { width: '100%', marginTop: 12, marginBottom: 0 },
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
  footer: {
    width: '100%',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerAccent: { position: 'absolute', top: -1, width: 56, height: 2, backgroundColor: colors.accent, borderBottomRightRadius: 2 },
  footerInner: { width: '100%', flexDirection: 'column', gap: 4 },
  footerInnerWide: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  footerNoteWide: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  footerBadgeWide: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerGlyph: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700', lineHeight: 14 },
  footerGlyphWide: { fontSize: 13, lineHeight: 16 },
  footerCopy: { flex: 1, minWidth: 0 },
  footerLabel: { color: colors.accent, fontFamily: monoFont, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  footerNoteTextWide: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  footerDivider: { width: 1, height: 40, backgroundColor: colors.border },
  footerActions: { width: '100%' },
  footerActionsWide: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  footerActionsPhone: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  footerActionSlot: { flex: 1, flexBasis: 0, minWidth: 0 },
  actionPhone: { minHeight: 38, paddingHorizontal: 6 },
  actionTextPhone: { fontSize: 11 },
  destructive: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  destructiveOutline: {
    minHeight: 56,
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
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  authorization: {
    width: '100%',
    minHeight: 52,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 4,
    backgroundColor: colors.accentTint,
    paddingHorizontal: 16,
  },
  authorizationTablet: { minHeight: 44, marginTop: 8 },
  authorizationText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  authorizationChevron: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
