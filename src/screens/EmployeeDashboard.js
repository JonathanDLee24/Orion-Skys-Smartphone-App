import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import PrimaryButton from '../components/PrimaryButton';
import EmployeeBottomNav from '../components/EmployeeBottomNav';
import EmployeeIcon from '../components/EmployeeIcon';
import {
  formatUnavailableSlot,
  getNextScheduledSubmission,
  getScheduledSubmissions,
} from '../services/bookingConflictService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

// Show data comes from the booking ledger; Schedule and the show actions route
// to the booking wizard and management screens.

function showStatus(submission) {
  return String(submission.status || 'pending').replace(/_/g, ' ').toUpperCase();
}

function showTiming(submission) {
  return [
    submission.timeZoneLabel || submission.timeZone,
    submission.durationMinutes ? `${submission.durationMinutes}-minute show` : null,
  ].filter(Boolean).join(' · ');
}

function showLocation(submission) {
  return [
    submission.city,
    submission.droneCount ? `${submission.droneCount} drones` : null,
  ].filter(Boolean).join(' · ');
}

export default function EmployeeDashboard({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [submissions, setSubmissions] = useState(getScheduledSubmissions);

  // Submissions are kept in a session ledger, so refresh when the dashboard
  // regains focus after a booking is sent from the review step.
  useEffect(() => {
    const refreshSubmissions = () => setSubmissions(getScheduledSubmissions());
    refreshSubmissions();
    const unsubscribe = navigation?.addListener?.('focus', refreshSubmissions);
    return typeof unsubscribe === 'function' ? unsubscribe : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextShow = getNextScheduledSubmission() || submissions[0] || null;
  const stats = [
    { key: 'scheduled', value: String(submissions.length).padStart(2, '0'), label: 'SCHEDULED SHOWS' },
    {
      key: 'review',
      value: String(submissions.filter((submission) => submission.status === 'pending').length).padStart(2, '0'),
      label: 'IN REVIEW',
    },
  ];

  return (
    <ScreenLayout
      label="EMPLOYEE PORTAL"
      caption="EMPLOYEE OPERATIONS / PAYMENTS"
      onLogoPress={() => navigation.navigate('Welcome')}
      title="Welcome back, Kenneth"
      secure
      showProgress={false}
      plainFooter
      footer={(
        <EmployeeBottomNav
          active="HOME"
          onHome={() => navigation.navigate('EmployeeDashboard')}
          onSchedule={() => navigation.navigate('BookingDateVenue')}
          onEvents={() => navigation.navigate('EmployeeEvents')}
          onAccount={() => navigation.navigate('Dashboard')}
        />
      )}
    >
      <View style={[styles.dashboard, layout.wide && styles.wideDashboard]}>
        <Text style={[s.body, styles.intro]}>Plan your next show. Keep every detail in view.</Text>

        <View style={styles.stats}>
          {stats.map((stat) => (
            <View key={stat.key} style={[s.card, styles.stat]}>
              <Text testID={`stat-${stat.key}`} style={[styles.statValue, layout.wide && styles.wideStatValue]}>{stat.value}</Text>
              <Text style={s.label}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton title="+ Schedule a show" onPress={() => navigation.navigate('BookingDateVenue')} />

        <View style={styles.sectionHeading}>
          <Text style={s.label}>// NEXT SCHEDULED SHOW</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all shows"
            onPress={() => navigation.navigate('EmployeeEvents')}
            style={({ pressed }) => [styles.inlineLink, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>View all →</Text>
          </Pressable>
        </View>

        {nextShow ? (
          <View testID="next-show" style={[s.card, styles.showCard]}>
            <View style={styles.showTop}>
              <Text style={s.label}>{nextShow.reference || nextShow.id}</Text>
              <Text style={[styles.statusBadge, nextShow.status === 'pending' && styles.pendingBadge]}>● {showStatus(nextShow)}</Text>
            </View>
            <Text testID="next-show-name" style={[styles.showName, layout.wide && styles.wideShowName]}>{nextShow.eventName}</Text>
            <View style={styles.detail}>
              <EmployeeIcon type="calendar" color={colors.accent} size={20} />
              <View style={styles.detailCopy}>
                <Text testID="next-show-date" style={styles.detailTitle}>
                  {formatUnavailableSlot({ date: nextShow.date, timeSlot: nextShow.timeSlot })}
                </Text>
                <Text style={s.body}>{showTiming(nextShow)}</Text>
              </View>
            </View>
            <View style={styles.detail}>
              <EmployeeIcon type="pin" color={colors.accent} size={20} />
              <View style={styles.detailCopy}>
                <Text testID="next-show-venue" style={styles.detailTitle}>{nextShow.venueName}</Text>
                <Text style={s.body}>{showLocation(nextShow)}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Manage event for ${nextShow.eventName}`}
              onPress={() => navigation.navigate('BookingManage', { submission: nextShow })}
              style={({ pressed }) => [styles.manage, pressed && styles.pressed]}
            >
              <Text style={styles.linkText}>Manage event</Text>
              <Text style={styles.chevron}>→</Text>
            </Pressable>
          </View>
        ) : (
          <View testID="next-show-empty" style={[s.card, styles.emptyCard]}>
            <Text style={styles.emptyTitle}>No shows booked yet.</Text>
            <Text style={s.body}>
              Your next show will appear here as soon as a booking request is submitted.
            </Text>
          </View>
        )}

        {nextShow && (
          <>
            <Text style={[s.label, styles.sectionLabel]}>// YOUR NEXT ACTION</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Review your show brief for ${nextShow.eventName}`}
              style={({ pressed }) => [s.card, styles.action, pressed && styles.pressed]}
            >
              <EmployeeIcon type="document" color={colors.accent} size={20} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailTitle}>Review your show brief</Text>
                <Text style={s.body}>{nextShow.eventName} · {nextShow.reference}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </>
        )}

        <Pressable accessibilityRole="button" accessibilityLabel="Contact your show coordinator" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
          <EmployeeIcon type="chat" color={colors.accent} size={18} />
          <Text style={[s.body, styles.helpText]}>Need help? Contact your show coordinator</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  dashboard: { flex: 1 },
  wideDashboard: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  intro: { marginTop: -8, marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1 },
  statValue: { color: colors.accent, fontFamily: monoFont, fontSize: 26, fontWeight: '700', marginBottom: 6 },
  wideStatValue: { fontSize: 34 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  sectionLabel: { marginTop: 6, marginBottom: 8 },
  inlineLink: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  showCard: { borderColor: colors.accent },
  showTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  statusBadge: { color: colors.green, backgroundColor: '#04241C', borderRadius: 10, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  pendingBadge: { color: colors.gold, backgroundColor: '#171200' },
  showName: { color: colors.text, fontSize: 20, fontWeight: '600', marginTop: 12, marginBottom: 12 },
  wideShowName: { fontSize: 24 },
  detail: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  detailCopy: { flex: 1 },
  detailTitle: { color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  manage: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  chevron: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  emptyCard: { borderStyle: 'dashed' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  help: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  helpText: { fontSize: 13 },
  pressed: { opacity: 0.72 },
});
