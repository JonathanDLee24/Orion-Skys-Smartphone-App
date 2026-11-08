import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import EmployeeBottomNav from '../components/EmployeeBottomNav';
import EmployeeIcon from '../components/EmployeeIcon';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import {
  formatUnavailableSlot,
  getScheduledSubmissions,
} from '../services/bookingConflictService';
import { seedDemoEvents } from '../services/eventFeedService';
import { colors, monoFont, useResponsiveLayout } from '../theme';
import { MONTH_NAMES, MONTH_SHORT, parseDateKey, toDateKey } from '../utils/bookingCalendar';
import { formatTimeZoneName } from '../utils/timeZones';

const FILTERS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'requests', label: 'Requests' },
  { key: 'past', label: 'Past' },
];

const FILTER_HELPERS = {
  upcoming: 'UPCOMING',
  requests: 'REQUESTS',
  past: 'PAST',
};

const EMPTY_STATES = {
  upcoming: {
    title: 'No upcoming shows.',
    body: 'Confirmed shows and pending venue reviews appear here as soon as they are on your schedule.',
  },
  requests: {
    title: 'No open requests.',
    body: 'New booking requests appear here while venue and airspace review is in progress.',
  },
  past: {
    title: 'No past shows.',
    body: 'Completed shows move here after their event date so you can look back at the archive.',
  },
};

function statusLabel(status) {
  if (status === 'pending') return 'PENDING REVIEW';
  if (status === 'completed') return 'COMPLETED';
  return 'CONFIRMED';
}

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
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

function offsetLabel(submission) {
  if (!submission) return 'UTC+8';
  const formatted = submission.timeZone
    ? formatTimeZoneName(parseDateKey(submission.date), submission.timeZone)
    : '';
  const match = formatted.match(/UTC[+-]\d{1,2}(?::\d{2})?/)
    || String(submission.timeZoneLabel || '').match(/UTC[+-]\d{1,2}(?::\d{2})?/);
  return match ? match[0] : 'UTC+8';
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

function alertDate(submission) {
  const date = parseDateKey(submission.date);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)}`;
}

export default function EmployeeEventsScreen({ navigation, seedDemoData = true }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [submissions, setSubmissions] = useState(() => {
    if (seedDemoData) seedDemoEvents();
    return getScheduledSubmissions();
  });

  // The ledger lives for the session, so pick up bookings and cancellations
  // when the user comes back to this tab.
  useEffect(() => {
    const refreshSubmissions = () => setSubmissions(getScheduledSubmissions());
    refreshSubmissions();
    const unsubscribe = navigation?.addListener?.('focus', refreshSubmissions);
    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayKey = toDateKey(new Date());
  const upcoming = submissions.filter(
    (submission) => submission.status === 'confirmed' && submission.date >= todayKey
  );
  const requests = submissions.filter((submission) => submission.status === 'pending');
  const past = submissions.filter(
    (submission) => submission.status === 'completed'
      || (submission.date < todayKey && submission.status !== 'pending')
  );
  const futureRequests = requests.filter((submission) => submission.date >= todayKey);

  const activeItems = activeFilter === 'upcoming'
    ? [...upcoming, ...futureRequests]
    : activeFilter === 'requests'
      ? requests
      : past;
  const timezoneHelper = `${FILTER_HELPERS[activeFilter]} // VENUE LOCAL TIME • ${offsetLabel(activeItems[0] || submissions[0])}`;

  const summary = `${upcoming.length} scheduled ${pluralize(upcoming.length, 'show', 'shows')} • `
    + `${requests.length} ${pluralize(requests.length, 'request', 'requests')} in review`;

  function openEvent(submission) {
    navigation.navigate('BookingManage', { submission });
  }

  function openSchedule() {
    navigation.navigate('BookingDateVenue');
  }

  function renderEventCard(submission, tone) {
    const date = parseDateKey(submission.date);
    const name = submission.eventName || 'Untitled show';
    const confirmed = tone === 'confirmed';
    const pending = tone === 'pending';
    return (
      <View
        key={submission.id}
        testID={`event-card-${submission.id}`}
        style={[s.card, styles.eventCard, layout.mode === 'desktop' && styles.desktopFeedCard]}
      >
        <View style={styles.cardMain}>
          <View
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

          <View style={styles.cardCopy}>
            <View style={styles.titleRow}>
              <Text style={[styles.eventName, layout.wide && styles.wideEventName]}>{name}</Text>
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
            <Text testID={`event-schedule-${submission.id}`} style={styles.schedule}>
              {eventSchedule(submission)}
            </Text>
            <Text style={styles.venue}>{eventVenue(submission)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View event & manage for ${name}`}
            onPress={() => openEvent(submission)}
            style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>View event &amp; manage</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open event dashboard for ${name}`}
            onPress={() => openEvent(submission)}
            style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
          >
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderPendingAlert(submission) {
    const name = submission.eventName || 'Untitled show';
    return (
      <Pressable
        key={`pending-${submission.id}`}
        testID={`event-pending-${submission.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Review request for ${name}`}
        onPress={() => openEvent(submission)}
        style={({ pressed }) => [
          s.card,
          styles.alertCard,
          layout.mode === 'desktop' && styles.desktopFeedCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.alertIcon}>
          <EmployeeIcon type="clock" color={colors.gold} size={18} />
        </View>
        <View style={styles.alertCopy}>
          <Text style={styles.alertTitle}>{`${name} • ${alertDate(submission)}`}</Text>
          <Text style={[s.body, styles.alertBody]}>Venue &amp; airspace review pending.</Text>
        </View>
        <Text style={styles.alertChevron}>›</Text>
      </Pressable>
    );
  }

  function renderEmptyState() {
    const copy = EMPTY_STATES[activeFilter];
    return (
      <View testID="events-empty" style={[s.card, styles.emptyCard]}>
        <Text style={styles.emptyTitle}>{copy.title}</Text>
        <Text style={[s.body, styles.emptyCopy]}>{copy.body}</Text>
      </View>
    );
  }

  function renderFeed() {
    if (activeFilter === 'upcoming') {
      if (upcoming.length === 0 && futureRequests.length === 0) return renderEmptyState();
      return (
        <>
          {upcoming.map((submission) => renderEventCard(submission, 'confirmed'))}
          {futureRequests.map(renderPendingAlert)}
        </>
      );
    }

    const items = activeFilter === 'requests' ? requests : past;
    if (items.length === 0) return renderEmptyState();
    return items.map((submission) => renderEventCard(submission, activeFilter === 'past' ? 'past' : 'pending'));
  }

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / SCHEDULE"
      label="CLIENT SCHEDULE // 2026"
      title="Your events"
      onLogoPress={() => navigation.navigate('Welcome')}
      headerAction={(
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Credits"
          onPress={() => navigation.navigate('Dashboard')}
          style={({ pressed }) => [styles.credits, pressed && styles.pressed]}
        >
          <Text style={styles.creditsText}>Credits</Text>
        </Pressable>
      )}
      showProgress={false}
      plainFooter
      footer={(
        <EmployeeBottomNav
          active="EVENTS"
          onHome={() => navigation.navigate('EmployeeDashboard')}
          onSchedule={openSchedule}
          onEvents={() => navigation.navigate('EmployeeEvents')}
          onAccount={() => navigation.navigate('Dashboard')}
        />
      )}
    >
      <View style={styles.list}>
        <Text testID="events-summary" accessibilityLiveRegion="polite" style={[s.body, styles.summary]}>
          {summary}
        </Text>

        <View accessibilityRole="tablist" style={styles.tabs}>
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter.key;
            const count = filter.key === 'upcoming'
              ? upcoming.length
              : filter.key === 'requests'
                ? requests.length
                : null;
            const label = count == null ? filter.label : `${filter.label} (${count})`;
            return (
              <Pressable
                key={filter.key}
                testID={`events-filter-${filter.key}`}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                onPress={() => setActiveFilter(filter.key)}
                style={({ pressed }) => [
                  styles.tab,
                  selected && styles.tabActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>{label}</Text>
                {selected ? <View style={styles.tabUnderline} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Text testID="events-timezone-helper" style={styles.helper}>
          {timezoneHelper}
        </Text>

        <View
          testID="events-list"
          style={[styles.feed, layout.mode === 'desktop' && styles.desktopFeed]}
        >
          {renderFeed()}
        </View>

      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { width: '100%' },
  feed: { width: '100%' },
  desktopFeed: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  desktopFeedCard: { flexBasis: '48%', flexGrow: 1, marginBottom: 0 },
  summary: { marginTop: -6, marginBottom: 12, color: colors.text },
  tabs: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tabActive: { backgroundColor: colors.accentTint },
  tabText: { color: colors.muted, fontFamily: monoFont, fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  tabTextActive: { color: colors.accent },
  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    backgroundColor: colors.accent,
  },
  helper: {
    color: colors.muted,
    fontFamily: monoFont,
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  credits: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsText: { color: colors.text, fontFamily: monoFont, fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  eventCard: { borderColor: colors.border },
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
  schedule: { color: colors.text, fontFamily: monoFont, fontSize: 11, lineHeight: 17, marginBottom: 3 },
  venue: { color: colors.muted, fontFamily: monoFont, fontSize: 10, lineHeight: 15 },
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#171200',
    borderColor: colors.gold,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCopy: { flex: 1, minWidth: 0 },
  alertTitle: { color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 18, marginBottom: 3 },
  alertBody: { lineHeight: 16 },
  alertChevron: { color: colors.gold, fontSize: 20, fontWeight: '700' },
  emptyCard: { borderStyle: 'dashed' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  emptyCopy: { lineHeight: 17 },
  pressed: { opacity: 0.72 },
});
