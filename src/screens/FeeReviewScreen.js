import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { getBookingFees } from '../services/feeService';
import { calculateTotalCents, formatUSD } from '../utils/fees';
import { colors, monoFont, useResponsiveLayout } from '../theme';

export default function FeeReviewScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverage, setCoverage] = useState(true);
  const mounted = useRef(false);

  async function loadFees() {
    setLoading(true);
    setError(null);
    try {
      const result = await getBookingFees(1);
      calculateTotalCents(result.fees);
      formatUSD(result.policy.premiumCents);
      if (mounted.current) setBooking(result);
    } catch (err) {
      if (mounted.current) setError(err.message || 'Unable to load booking fees. Please try again.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    loadFees();
    return () => { mounted.current = false; };
  }, []);

  function previousPage() {
    const message = 'Previous page coming soon';
    if (Platform.OS === 'web') window.alert(message);
    else Alert.alert(message);
  }

  function continueToCheckout() {
    const selectedBooking = {
      ...booking,
      fees: coverage ? booking.fees : booking.fees.filter((fee) => fee.type !== 'Aviation Airspace Liability'),
    };
    navigation.navigate('Checkout', { booking: selectedBooking });
  }

  return (
    <ScreenLayout
      label="RISK: LIABILITY_INS"
      phase={3}
      backLabel="Back to Previous Step"
      onBack={previousPage}
      onAccount={() => navigation.navigate('AccountSettings')}
      title="Commercial Airspace Coverage"
      footer={<PrimaryButton title="Proceed to Checkout" loading={loading} disabled={!!error || !booking} onPress={continueToCheckout} />}
    >
      {loading ? (
        <View style={[s.card, styles.loading]} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={s.body}>Loading your booking fees…</Text>
        </View>
      ) : error ? (
        <View style={s.card} accessibilityRole="alert">
          <Text style={s.errorTitle}>Fees unavailable</Text>
          <Text style={[s.body, styles.errorMessage]}>{error}</Text>
          <PrimaryButton title="Try again" onPress={loadFees} />
        </View>
      ) : booking ? (
        <View testID="coverage-columns" style={[styles.columns, { flexDirection: layout.wide ? 'row' : 'column', gap: layout.wide ? layout.gap : 0 }]}>
          <View style={layout.wide && styles.column}>
          <View style={[s.card, styles.premiumCard, layout.wide && styles.widePremiumCard]}>
            <Text style={s.label}>// RISK LEVEL B PREVENTATIVE POLICY</Text>
            <Text style={[styles.premium, layout.wide && styles.widePremium]}>{formatUSD(booking.policy.premiumCents)}</Text>
            <Text style={s.body}>Premium per 24H Operation Bracket</Text>
          </View>
          <View style={[s.card, styles.coverageCard, !coverage && styles.coverageOff]}>
            <View style={styles.coverageCopy}>
              <Text style={[styles.coverageTitle, layout.wide && styles.wideCoverageTitle]}>Comprehensive Coverage</Text>
              <Text style={s.body}>$5M Aggregate Liability Limit</Text>
            </View>
            <Pressable accessibilityRole="switch" accessibilityLabel="Comprehensive Coverage" accessibilityState={{ checked: coverage }} aria-checked={coverage} onPress={() => setCoverage(!coverage)} style={styles.toggleTouch}>
              <View style={[styles.toggleTrack, !coverage && styles.toggleOff]}>
                <View style={[styles.toggleThumb, coverage && styles.toggleChecked]} />
              </View>
            </Pressable>
          </View>
          </View>
          <View style={[s.card, layout.wide && styles.column]}>
            <Text style={[s.label, styles.policyLabel]}>// POLICY PARAMETERS</Text>
            <View style={styles.parameter}>
              <Text style={s.body}>Carrier</Text>
              <Text style={[styles.parameterValue, layout.wide && styles.wideParameterValue]}>{booking.policy.carrier}</Text>
            </View>
            <View style={styles.parameter}>
              <Text style={s.body}>Period of Cover</Text>
              <Text style={[styles.parameterValue, layout.wide && styles.wideParameterValue]}>{booking.policy.period}</Text>
            </View>
            <View style={[s.divider, styles.divider]} />
            <Text style={s.body}>Covers mid-air structural separation, flight interruption anomalies, and localized spectrum interference recovery.</Text>
          </View>
        </View>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  columns: { alignItems: 'stretch' },
  column: { flex: 1, minWidth: 0 },
  widePremiumCard: { paddingVertical: 32 },
  widePremium: { fontSize: 52, marginVertical: 16 },
  wideCoverageTitle: { fontSize: 16 },
  wideParameterValue: { fontSize: 14, lineHeight: 24 },
  loading: { alignItems: 'center', paddingVertical: 48, gap: 16 },
  errorMessage: { marginBottom: 20 },
  premiumCard: { alignItems: 'center', paddingVertical: 18 },
  premium: { color: colors.accent, fontFamily: monoFont, fontSize: 36, fontWeight: '700', marginTop: 8, marginBottom: 9 },
  coverageCard: { borderColor: colors.accent, backgroundColor: colors.field, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  coverageOff: { borderColor: colors.border },
  coverageCopy: { flex: 1 },
  toggleTouch: { minHeight: 44, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  toggleTrack: { width: 46, height: 28, borderRadius: 16, backgroundColor: colors.accent, padding: 2 },
  toggleOff: { backgroundColor: colors.border },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background },
  toggleChecked: { alignSelf: 'flex-end' },
  coverageTitle: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  policyLabel: { marginBottom: 10 },
  parameter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6, marginBottom: 10 },
  parameterValue: { color: colors.text, fontFamily: monoFont, fontSize: 11, lineHeight: 16, flexShrink: 1, textAlign: 'right' },
  divider: { marginBottom: 10 },
});
