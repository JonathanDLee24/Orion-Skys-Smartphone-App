import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import EmployeeIcon from './EmployeeIcon';
import { useScreenStyles } from './ScreenLayout';
import { colors, monoFont, useResponsiveLayout } from '../theme';
import { formatUnavailableSlot } from '../services/bookingConflictService';
import { MONTH_SHORT, parseDateKey } from '../utils/bookingCalendar';
import { formatTimeZoneName } from '../utils/timeZones';

function statusLabel(status) {
  if (status === 'pending') return 'PENDING REVIEW';
  if (status === 'completed') return 'COMPLETED';
  return 'CONFIRMED';
}

function zoneAbbreviation(submission) {
  const labelSegment = String(submission.timeZoneLabel || '').split(' · ').pop() || '';
  const leading = labelSegment.match(/^([A-Z]{2,5})\b/);
  if (leading) return leading[1];
  const parenthesized = labelSegment.match(/\(([A-Z]{2,5})\)/);
  if (parenthesized) return parenthesized[1];

  if (submission.timeZone) {
    const formatted = formatTimeZoneName(parseDateKey(submission.date), submission.timeZone);
    const abbreviation = formatted.split(' ')[0].replace(/[()]/g, '');
    if (abbreviation && !/^UTC/.test(abbreviation)) return abbreviation;
    return abbreviation;
  }
  return '';
}

function eventSchedule(submission) {
  const schedule = formatUnavailableSlot({
    date: submission.date,
    timeSlot: submission.timeSlot,
  }).replace(' · ', ' • ');
  const abbreviation = zoneAbbreviation(submission);
  return abbreviation ? `${schedule} ${abbreviation}` : schedule;
}

function eventVenue(submission) {
  return [submission.venueName, submission.city].filter(Boolean).join(' • ');
}

// Shared event feed node used by the Upcoming, Requests and Past views. It
// keeps the date block, status badge and logistics rows identical everywhere
// while the events screen decides which tone and record to pass in.
export default function EventFeedCard({ submission, tone = 'confirmed', onOpen }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const date = parseDateKey(submission.date);
  const name = submission.eventName || 'Untitled show';
  const confirmed = tone === 'confirmed';
  const pending = tone === 'pending';

  return (
    <View
      testID={`event-card-${submission.id}`}
      style={[s.card, styles.eventCard, layout.mode === 'desktop' && styles.desktopFeedCard]}
    >
      <View testID={`event-card-main-${submission.id}`} style={styles.cardMain}>
        <View
          testID={`event-date-block-${submission.id}`}
          style={[
            styles.dateBlock,
            confirmed && styles.dateBlockConfirmed,
            pending && styles.dateBlockPending,
            tone === 'past' && styles.dateBlockPast,
          ]}
        >
          <Text
            style={[
              styles.dateMonth,
              confirmed && styles.dateMonthConfirmed,
              pending && styles.dateMonthPending,
              tone === 'past' && styles.dateMonthPast,
            ]}
          >
            {MONTH_SHORT[date.getMonth()]}
          </Text>
          <Text style={[styles.dateDay, tone === 'past' && styles.dateDayPast]}>{date.getDate()}</Text>
        </View>

        <View testID={`event-card-copy-${submission.id}`} style={styles.cardCopy}>
          <View testID={`event-title-row-${submission.id}`} style={styles.titleRow}>
            <Text testID={`event-name-${submission.id}`} style={[styles.eventName, layout.wide && styles.wideEventName]}>{name}</Text>
            <Text
              style={[
                styles.statusBadge,
                confirmed && styles.confirmedBadge,
                pending && styles.pendingBadge,
                tone === 'past' && styles.pastBadge,
              ]}
            >
              ● {statusLabel(submission.status)}
            </Text>
          </View>
          <View testID={`event-schedule-row-${submission.id}`} style={styles.logisticsRow}>
            <EmployeeIcon type="clock" color={colors.muted} size={13} />
            <Text testID={`event-schedule-${submission.id}`} style={styles.schedule}>
              {eventSchedule(submission)}
            </Text>
          </View>
          <View testID={`event-venue-row-${submission.id}`} style={styles.logisticsRow}>
            <EmployeeIcon type="pin" color={colors.muted} size={13} />
            <Text testID={`event-venue-${submission.id}`} style={styles.venue}>{eventVenue(submission)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View event & manage for ${name}`}
          onPress={() => onOpen(submission)}
          style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}
        >
          <Text style={styles.linkText}>View event &amp; manage</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open event dashboard for ${name}`}
          onPress={() => onOpen(submission)}
          style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
        >
          <Text style={styles.arrow}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eventCard: { borderColor: colors.border },
  desktopFeedCard: { flexBasis: '48%', flexGrow: 1, marginBottom: 0 },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dateBlock: {
    width: 56,
    minHeight: 66,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBlockConfirmed: { backgroundColor: colors.accentTint, borderColor: colors.accent },
  dateBlockPending: { backgroundColor: '#171200', borderColor: colors.gold },
  dateBlockPast: { backgroundColor: colors.field, borderColor: colors.border },
  dateMonth: { fontFamily: monoFont, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  dateMonthConfirmed: { color: colors.accent },
  dateMonthPending: { color: colors.gold },
  dateMonthPast: { color: colors.muted },
  dateDay: { color: colors.text, fontFamily: monoFont, fontSize: 24, fontWeight: '700', lineHeight: 28 },
  dateDayPast: { color: colors.muted },
  cardCopy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 6, marginBottom: 7 },
  eventName: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 21, flexShrink: 1 },
  wideEventName: { fontSize: 19, lineHeight: 24 },
  statusBadge: {
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontFamily: monoFont,
    fontSize: 8,
    fontWeight: '700',
  },
  confirmedBadge: { color: colors.green, backgroundColor: '#04241C' },
  pendingBadge: { color: colors.gold, backgroundColor: '#171200' },
  pastBadge: { color: colors.muted, backgroundColor: colors.field },
  logisticsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 3 },
  schedule: { color: colors.text, fontFamily: monoFont, fontSize: 11, lineHeight: 17, flexShrink: 1, minWidth: 0 },
  venue: { color: colors.muted, fontFamily: monoFont, fontSize: 10, lineHeight: 15, flexShrink: 1, minWidth: 0 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 13,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 4,
  },
  footerLink: { flex: 1, minHeight: 44, justifyContent: 'center' },
  linkText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { color: colors.accent, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  pressed: { opacity: 0.72 },
});
