import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import PrimaryButton from '../components/PrimaryButton';
import FleetBottomNav from '../components/FleetBottomNav';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import {
  LAANC_DISCLAIMER,
  LAANC_STATUS,
  fetchLaancAuthorization,
  getFlightInitiationClearance,
  requestFlightInitiation,
} from '../services/laancService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

export default function LaancDashboardScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [authorization, setAuthorization] = useState(null);
  const [clearance, setClearance] = useState(() => getFlightInitiationClearance());
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchLaancAuthorization().then((payload) => {
      if (cancelled) return;
      setAuthorization(payload);
      setClearance(getFlightInitiationClearance());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function initiateFlight() {
    const result = requestFlightInitiation();
    setClearance(result);
    setNotice(result.message);
  }

  return (
    <ScreenLayout
      label="COORDINATION PORTAL"
      title="LAANC Dashboard"
      headerBadge="● AUTHORIZED"
      caption="FLIGHT OPERATIONS / AIRSPACE"
      showProgress={false}
      flushFooter
      plainFooter
      footer={(
        <FleetBottomNav
          active="LAANC"
          onSelect={(tab) => {
            if (tab === 'AIRSPACE') navigation.navigate('DroneManifest');
          }}
        />
      )}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        {!authorization ? (
          <Text style={s.body}>Loading LAANC authorization…</Text>
        ) : (
          <>
            <View testID="laanc-authorization" style={[s.card, styles.authorizationCard]}>
              <View style={styles.authorizationTop}>
                <Text style={styles.certificateId}>ID: {authorization.certificateId}</Text>
                <Text style={styles.approvedBadge}>{authorization.status}</Text>
              </View>
              <View style={[s.divider, styles.divider]} />
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Max Grid Altitude</Text>
                <Text style={styles.metricValue}>{authorization.maxAltitude}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Time Window</Text>
                <Text style={styles.metricValue}>{authorization.timeWindow}</Text>
              </View>
            </View>

            <View style={[s.card, styles.complianceCard]}>
              <Text style={s.label}>// FLEET COMPLIANCE STATUS</Text>
              {authorization.cohorts.map((cohort) => (
                <View key={cohort.id} testID={`laanc-cohort-${cohort.id}`} style={styles.cohortRow}>
                  <View style={styles.cohortCopy}>
                    <Text style={styles.cohortRange}>{cohort.range}</Text>
                    <Text style={styles.cohortLabel}>{cohort.label}</Text>
                  </View>
                  <Text
                    testID={`laanc-status-${cohort.id}`}
                    style={[styles.cohortStatus, cohort.status === LAANC_STATUS.PENDING && styles.cohortPending]}
                  >
                    {cohort.status}
                  </Text>
                </View>
              ))}
            </View>

            <View
              testID="laanc-initiation-status"
              style={[styles.initiationCard, clearance.allowed ? styles.initiationCleared : styles.initiationBlocked]}
            >
              <Text style={[styles.initiationTitle, clearance.allowed ? styles.initiationTitleCleared : styles.initiationTitleBlocked]}>
                {clearance.allowed ? 'FLIGHT INITIATION CLEARED' : 'FLIGHT INITIATION LOCKED'}
              </Text>
              <Text style={styles.initiationBody}>{clearance.message}</Text>
            </View>

            <PrimaryButton title="Request flight initiation" onPress={initiateFlight} testID="laanc-request-initiation" />

            {notice ? (
              <Text accessibilityRole="alert" testID="laanc-initiation-notice" style={styles.notice}>
                {notice}
              </Text>
            ) : null}

            <View style={styles.disclaimerBlock}>
              <Text style={s.label}>// REGULATORY DISCLAIMER</Text>
              <Text style={[s.body, styles.disclaimer]}>{LAANC_DISCLAIMER}</Text>
            </View>
          </>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  wideContent: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  authorizationCard: { borderWidth: 1, borderColor: colors.accent, borderRadius: 6, padding: 16, gap: 4 },
  authorizationTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  certificateId: { color: colors.accent, fontFamily: monoFont, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  approvedBadge: { color: colors.background, backgroundColor: colors.accent, fontFamily: monoFont, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3, overflow: 'hidden' },
  divider: { marginVertical: 10 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 34 },
  metricLabel: { color: colors.muted, fontSize: 13, flexShrink: 1 },
  metricValue: { color: colors.text, fontFamily: monoFont, fontSize: 13, fontWeight: '700' },
  complianceCard: { borderRadius: 6, paddingHorizontal: 14, paddingVertical: 14, gap: 4 },
  cohortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 9, minHeight: 52 },
  cohortCopy: { flexShrink: 1, gap: 2 },
  cohortRange: { color: colors.text, fontFamily: monoFont, fontSize: 13, fontWeight: '700' },
  cohortLabel: { color: colors.muted, fontSize: 12 },
  cohortStatus: { color: colors.accent, fontFamily: monoFont, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cohortPending: { color: colors.gold },
  initiationCard: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12, gap: 5 },
  initiationCleared: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  initiationBlocked: { borderColor: colors.gold, backgroundColor: colors.goldTint },
  initiationTitle: { fontFamily: monoFont, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  initiationTitleCleared: { color: colors.accent },
  initiationTitleBlocked: { color: colors.gold },
  initiationBody: { color: colors.text, fontSize: 13, lineHeight: 19 },
  notice: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  disclaimerBlock: { gap: 6, marginTop: 4 },
  disclaimer: { fontSize: 12, lineHeight: 18 },
});
