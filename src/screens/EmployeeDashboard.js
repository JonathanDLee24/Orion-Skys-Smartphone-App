import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import PrimaryButton from '../components/PrimaryButton';
import { colors, monoFont, useResponsiveLayout } from '../theme';

// Mock content for now; Schedule, Events and the show actions can route to real screens later.

const STATS = [
  { key: 'scheduled', value: '02', label: 'SCHEDULED SHOWS' },
  { key: 'review', value: '01', label: 'IN REVIEW' },
];

const nextShow = {
  id: 'DSO-EVT-261114',
  status: 'CONFIRMED',
  name: 'Apex Global Summit',
  date: 'Sat, 14 Nov 2026 · 8:00 PM',
  timing: 'SGT (UTC+8) · 10-minute show',
  venue: 'Marina Bay Event Deck',
  location: 'Singapore · 200 drones',
};

const nextAction = { title: 'Share your show brief', detail: 'Apex Global Summit · due 24 Oct' };

function Icon({ type, color, size = 22 }) {
  if (Platform.OS === 'web') {
    const stroke = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const calendar = [
      React.createElement('rect', { key: 'body', x: 3, y: 4, width: 18, height: 18, rx: 2, ...stroke }),
      React.createElement('path', { key: 'rings', d: 'M16 2v4M8 2v4M3 10h18', ...stroke }),
    ];
    const shape = {
      home: [3, 14].flatMap((x) => [3, 14].map((y) => React.createElement('rect', { key: `${x}-${y}`, x, y, width: 7, height: 7, rx: 1, ...stroke }))),
      schedule: [...calendar, React.createElement('path', { key: 'plus', d: 'M12 13v6M9 16h6', ...stroke })],
      events: [...calendar, React.createElement('path', { key: 'dots', d: 'M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01', ...stroke })],
      calendar,
      account: [
        React.createElement('circle', { key: 'head', cx: 12, cy: 8, r: 4, ...stroke }),
        React.createElement('path', { key: 'body', d: 'M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1', ...stroke }),
      ],
      pin: [
        React.createElement('path', { key: 'pin', d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', ...stroke }),
        React.createElement('circle', { key: 'dot', cx: 12, cy: 10, r: 3, ...stroke }),
      ],
      document: [
        React.createElement('path', { key: 'page', d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', ...stroke }),
        React.createElement('path', { key: 'lines', d: 'M14 2v6h6M16 13H8M16 17H8M10 9H8', ...stroke }),
      ],
      chat: [React.createElement('path', { key: 'bubble', d: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z', ...stroke })],
    };
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true }, shape[type]);
  }
  if (type === 'home') return <View style={styles.gridIcon}>{[0, 1, 2, 3].map((cell) => <View key={cell} style={[styles.gridCell, { borderColor: color }]} />)}</View>;
  if (type === 'account') return <View style={styles.personIcon}><View style={[styles.personHead, { borderColor: color }]} /><View style={[styles.personBody, { borderColor: color }]} /></View>;
  if (type === 'pin') return <View style={[styles.pinIcon, { borderColor: color }]}><View style={[styles.pinDot, { borderColor: color }]} /></View>;
  if (type === 'document') return <View style={[styles.docIcon, { borderColor: color }]}>{[0, 1, 2].map((line) => <View key={line} style={[styles.docLine, { backgroundColor: color }]} />)}</View>;
  if (type === 'chat') return <View style={[styles.chatIcon, { borderColor: color }]} />;
  return (
    <View style={[styles.calendarIcon, { borderColor: color }]}>
      <View style={[styles.calendarBar, { backgroundColor: color }]} />
      {type === 'schedule' && <Text style={[styles.calendarGlyph, { color }]}>+</Text>}
    </View>
  );
}

function EmployeeBottomNav({ onHome, onSchedule, onAccount }) {
  const layout = useResponsiveLayout();
  const items = [
    { label: 'HOME', icon: 'home', onPress: onHome },
    { label: 'SCHEDULE', icon: 'schedule', onPress: onSchedule },
    { label: 'EVENTS', icon: 'events' },
    { label: 'ACCOUNT', icon: 'account', onPress: onAccount },
  ];
  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      <View style={styles.navItems}>
        {items.map((item) => {
          const active = item.label === 'HOME';
          const color = active ? colors.accent : colors.muted;
          return (
            <Pressable key={item.label} accessibilityRole="tab" accessibilityLabel={`${item.label} navigation`} accessibilityState={{ selected: active }} onPress={item.onPress} style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
              <Icon type={item.icon} color={color} />
              <Text style={[styles.navLabel, { color }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {Platform.OS === 'web' && !layout.wide && <View style={styles.homeIndicator} />}
    </View>
  );
}

export default function EmployeeDashboard({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();

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
          onHome={() => navigation.navigate('EmployeeDashboard')}
          onSchedule={() => navigation.navigate('BookingDateVenue')}
          onAccount={() => navigation.navigate('Dashboard')}
        />
      )}
    >
      <View style={[styles.dashboard, layout.wide && styles.wideDashboard]}>
        <Text style={[s.body, styles.intro]}>Plan your next show. Keep every detail in view.</Text>

        <View style={styles.stats}>
          {STATS.map((stat) => (
            <View key={stat.key} style={[s.card, styles.stat]}>
              <Text style={[styles.statValue, layout.wide && styles.wideStatValue]}>{stat.value}</Text>
              <Text style={s.label}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton title="+ Schedule a show" onPress={() => navigation.navigate('BookingDateVenue')} />

        <View style={styles.sectionHeading}>
          <Text style={s.label}>// NEXT SCHEDULED SHOW</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="View all shows" style={({ pressed }) => [styles.inlineLink, pressed && styles.pressed]}>
            <Text style={styles.linkText}>View all →</Text>
          </Pressable>
        </View>

        <View style={[s.card, styles.showCard]}>
          <View style={styles.showTop}>
            <Text style={s.label}>{nextShow.id}</Text>
            <Text style={styles.statusBadge}>● {nextShow.status}</Text>
          </View>
          <Text style={[styles.showName, layout.wide && styles.wideShowName]}>{nextShow.name}</Text>
          <View style={styles.detail}>
            <Icon type="calendar" color={colors.accent} size={20} />
            <View style={styles.detailCopy}>
              <Text style={styles.detailTitle}>{nextShow.date}</Text>
              <Text style={s.body}>{nextShow.timing}</Text>
            </View>
          </View>
          <View style={styles.detail}>
            <Icon type="pin" color={colors.accent} size={20} />
            <View style={styles.detailCopy}>
              <Text style={styles.detailTitle}>{nextShow.venue}</Text>
              <Text style={s.body}>{nextShow.location}</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Manage event" style={({ pressed }) => [styles.manage, pressed && styles.pressed]}>
            <Text style={styles.linkText}>Manage event</Text>
            <Text style={styles.chevron}>→</Text>
          </Pressable>
        </View>

        <Text style={[s.label, styles.sectionLabel]}>// YOUR NEXT ACTION</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={nextAction.title} style={({ pressed }) => [s.card, styles.action, pressed && styles.pressed]}>
          <Icon type="document" color={colors.accent} size={20} />
          <View style={styles.detailCopy}>
            <Text style={styles.detailTitle}>{nextAction.title}</Text>
            <Text style={s.body}>{nextAction.detail}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable accessibilityRole="button" accessibilityLabel="Contact your show coordinator" style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
          <Icon type="chat" color={colors.accent} size={18} />
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
  showName: { color: colors.text, fontSize: 20, fontWeight: '600', marginTop: 12, marginBottom: 12 },
  wideShowName: { fontSize: 24 },
  detail: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  detailCopy: { flex: 1 },
  detailTitle: { color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  manage: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  chevron: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  help: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  helpText: { fontSize: 13 },
  pressed: { opacity: 0.72 },
  bottomNav: { width: '100%', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingTop: 6, paddingBottom: 8 },
  navItems: { width: '100%', maxWidth: 560, flexDirection: 'row', justifyContent: 'space-around' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 56 },
  navLabel: { fontFamily: monoFont, fontSize: 9, letterSpacing: 0.4 },
  homeIndicator: { width: 150, height: 6, borderRadius: 4, backgroundColor: colors.muted, opacity: 0.9, marginTop: 4 },
  gridIcon: { width: 22, height: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridCell: { width: 9, height: 9, borderWidth: 2, borderRadius: 2 },
  calendarIcon: { width: 20, height: 20, borderWidth: 2, borderRadius: 3, alignItems: 'center', justifyContent: 'center', paddingTop: 3 },
  calendarBar: { position: 'absolute', top: 4, left: 0, right: 0, height: 2 },
  calendarGlyph: { fontSize: 12, lineHeight: 13, fontWeight: '700' },
  personIcon: { width: 22, height: 22, alignItems: 'center' },
  personHead: { width: 9, height: 9, borderWidth: 2, borderRadius: 5 },
  personBody: { width: 18, height: 10, borderWidth: 2, borderBottomWidth: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9, marginTop: 2 },
  pinIcon: { width: 16, height: 16, borderWidth: 2, borderRadius: 8, borderBottomRightRadius: 0, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  pinDot: { width: 5, height: 5, borderWidth: 1.5, borderRadius: 3 },
  docIcon: { width: 16, height: 20, borderWidth: 2, borderRadius: 2, paddingHorizontal: 2, paddingTop: 4, gap: 2 },
  docLine: { height: 1.5 },
  chatIcon: { width: 17, height: 17, borderWidth: 2, borderRadius: 9, borderBottomLeftRadius: 2 },
});
