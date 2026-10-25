import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import EmployeeBottomNav from '../components/EmployeeBottomNav';
import EmployeeIcon from '../components/EmployeeIcon';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { formatUnavailableSlot, getScheduledSubmissions } from '../services/bookingConflictService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function statusLabel(submission) {
  return String(submission.status || 'pending').replace(/_/g, ' ').toUpperCase();
}

function timing(submission) {
  return [
    submission.timeZoneLabel || submission.timeZone,
    submission.durationMinutes ? `${submission.durationMinutes}-minute show` : null,
  ].filter(Boolean).join(' · ');
}

function location(submission) {
  const address = [submission.city, submission.postalCode ? submission.postalCode : null]
    .filter(Boolean)
    .join(' ');
  return [
    address,
    submission.droneCount ? `${submission.droneCount} drones` : null,
  ].filter(Boolean).join(' · ');
}

export default function EmployeeEventsScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [submissions, setSubmissions] = useState(getScheduledSubmissions);

  // The ledger lives for the session, so pick up bookings and cancellations
  // when the user comes back to this tab.
  useEffect(() => {
    const refreshSubmissions = () => setSubmissions(getScheduledSubmissions());
    refreshSubmissions();
    const unsubscribe = navigation?.addListener?.('focus', refreshSubmissions);
    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = submissions.length;

  return (
    <ScreenLayout
      label="EMPLOYEE PORTAL // EVENTS"
      caption="EMPLOYEE OPERATIONS / SCHEDULING"
      onLogoPress={() => navigation.navigate('Welcome')}
      title="All scheduled events"
      secure
      showProgress={false}
      plainFooter
      footer={(
        <EmployeeBottomNav
          active="EVENTS"
          onHome={() => navigation.navigate('EmployeeDashboard')}
          onSchedule={() => navigation.navigate('BookingDateVenue')}
          onEvents={() => navigation.navigate('EmployeeEvents')}
          onAccount={() => navigation.navigate('Dashboard')}
        />
      )}
    >
      <View style={[styles.list, layout.wide && styles.wideList]}>
        <View style={styles.heading}>
          <Text style={[s.body, styles.intro]}>
            {count === 0
              ? 'Nothing on the schedule yet.'
              : `${String(count).padStart(2, '0')} ${count === 1 ? 'event' : 'events'} on the schedule.`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Schedule a show"
            onPress={() => navigation.navigate('BookingDateVenue')}
            style={({ pressed }) => [styles.inlineLink, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>+ New</Text>
          </Pressable>
        </View>

        {count === 0 ? (
          <View testID="events-empty" style={[s.card, styles.emptyCard]}>
            <Text style={styles.emptyTitle}>No shows booked yet.</Text>
            <Text style={[s.body, styles.emptyCopy]}>
              Submitted booking requests appear here, and you can manage or cancel any show from this list.
            </Text>
            <PrimaryButton title="+ Schedule a show" onPress={() => navigation.navigate('BookingDateVenue')} />
          </View>
        ) : (
          <View testID="events-list">
            {submissions.map((submission) => (
              <View key={submission.id} testID={`event-card-${submission.id}`} style={[s.card, styles.eventCard]}>
                <View style={styles.eventTop}>
                  <Text style={s.label}>{submission.reference || submission.id}</Text>
                  <Text style={[styles.statusBadge, submission.status === 'pending' ? styles.pendingBadge : styles.confirmedBadge]}>
                    ● {statusLabel(submission)}
                  </Text>
                </View>
                <Text style={[styles.eventName, layout.wide && styles.wideEventName]}>
                  {submission.eventName || 'Untitled show'}
                </Text>

                <View style={styles.detail}>
                  <EmployeeIcon type="calendar" color={colors.accent} size={20} />
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailTitle}>
                      {formatUnavailableSlot({ date: submission.date, timeSlot: submission.timeSlot })}
                    </Text>
                    {!!timing(submission) && <Text style={s.body}>{timing(submission)}</Text>}
                  </View>
                </View>

                <View style={styles.detail}>
                  <EmployeeIcon type="pin" color={colors.accent} size={20} />
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailTitle}>{submission.venueName || 'Venue to be confirmed'}</Text>
                    {!!location(submission) && <Text style={s.body}>{location(submission)}</Text>}
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Manage event for ${submission.eventName || 'show'}`}
                  onPress={() => navigation.navigate('BookingManage', { submission })}
                  style={({ pressed }) => [styles.manage, pressed && styles.pressed]}
                >
                  <Text style={styles.linkText}>Manage event</Text>
                  <Text style={styles.chevron}>→</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  wideList: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: -8, marginBottom: 12 },
  intro: { flex: 1 },
  inlineLink: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  eventCard: { borderColor: colors.border },
  eventTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  statusBadge: { borderRadius: 10, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  pendingBadge: { color: colors.gold, backgroundColor: '#171200' },
  confirmedBadge: { color: colors.green, backgroundColor: '#04241C' },
  eventName: { color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 12 },
  wideEventName: { fontSize: 21 },
  detail: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  detailCopy: { flex: 1 },
  detailTitle: { color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  manage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 6,
  },
  chevron: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  emptyCard: { borderStyle: 'dashed' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  emptyCopy: { marginBottom: 14 },
  pressed: { opacity: 0.72 },
});
