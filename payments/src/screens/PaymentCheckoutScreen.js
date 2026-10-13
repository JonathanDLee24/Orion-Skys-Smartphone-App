import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import FeeRow from '../components/FeeRow';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { calculateTotalCents, formatUSD } from '../utils/fees';
import { colors, monoFont, useResponsiveLayout } from '../theme';

export default function PaymentCheckoutScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const booking = route.params?.booking;
  const [promo, setPromo] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [splitPayment, setSplitPayment] = useState(false);
  let totalCents = 0;
  let error = null;
  try {
    if (!booking || !Array.isArray(booking.fees) || !booking.name) {
      throw new Error('Your booking summary is unavailable. Return to fee review to reload it.');
    }
    totalCents = calculateTotalCents(booking.fees);
  } catch (err) {
    error = err.message;
  }

  function proceed() {
    const message = 'Payment screen coming in Sprint 2';
    // React Native Alert has no web implementation; use the browser equivalent.
    if (Platform.OS === 'web') window.alert(message);
    else Alert.alert(message);
  }

  return (
    <ScreenLayout
      label="SYSTEM: INVOICE_CHECKOUT"
      secure
      title="Operations Summary"
      phase={4}
      onBack={() => navigation.navigate('FeeReview')}
      footer={<PrimaryButton title="Continue to Payment Portal" disabled={!!error || !booking?.fees?.length} onPress={proceed} />}
    >
      {error ? (
        <View style={s.card} accessibilityRole="alert">
          <Text style={s.errorTitle}>Summary unavailable</Text>
          <Text style={[s.body, styles.errorMessage]}>{error}</Text>
          <PrimaryButton title="Return to fee review" onPress={() => navigation.navigate('FeeReview')} />
        </View>
      ) : (
        <View testID="checkout-columns" style={[styles.columns, { flexDirection: layout.wide ? 'row' : 'column', gap: layout.wide ? layout.gap : 0 }]}>
          <View style={[s.card, layout.wide && styles.feesColumn]}>
            <Text style={[s.label, styles.summaryLabel]}>// CONFIRMED DEBITS & DEPOSITS</Text>
            {booking.fees.map((fee, index) => <FeeRow key={`${fee.type}-${index}`} label={fee.type} amountCents={fee.amountCents} refundable={fee.refundable} tax={fee.tax} />)}
            {booking.fees.length === 0 && <Text style={s.body}>No fees available. Checkout will be enabled when fees are added.</Text>}
          </View>
          <View style={layout.wide && styles.actionsColumn}>
          <View style={[s.card, styles.controlRow]}>
            <TextInput
              accessibilityLabel="Promo code"
              placeholder="PROMO_CODE_INPUT"
              placeholderTextColor={colors.muted}
              value={promo}
              onChangeText={(value) => { setPromo(value); setPromoMessage(''); }}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[styles.input, layout.wide && styles.wideInput]}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Apply promo code" onPress={() => setPromoMessage(promo.trim() ? 'Promo codes will be available in Sprint 2.' : 'Enter a promo code to apply.')} style={({ pressed }) => [styles.apply, pressed && styles.pressed]}>
              <Text style={styles.applyText}>APPLY</Text>
            </Pressable>
          </View>
          {!!promoMessage && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{promoMessage}</Text>}
          <View style={[s.card, styles.splitRow]}>
            <Text style={styles.splitLabel}>SPLIT PAYMENT</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Select split payment" accessibilityState={{ selected: splitPayment }} onPress={() => setSplitPayment(!splitPayment)} style={({ pressed }) => [styles.select, pressed && styles.pressed]}>
              <Text style={styles.selectText}>{splitPayment ? 'SELECTED' : 'SELECT'}</Text>
            </Pressable>
          </View>
          {splitPayment && <Text accessibilityLiveRegion="polite" style={styles.feedback}>Split payment selected for this preview. Processing arrives in Sprint 2.</Text>}
          <View style={[s.card, styles.totalCard]}>
            <View style={styles.escrowRow}>
              <Text style={s.label}>PAYABLE TO SKYFORGE</Text>
              <Text style={styles.escrow}>STADIUM BOND ESCROW</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <View style={styles.totalValue}>
                <Text accessibilityLabel={`Total due ${formatUSD(totalCents)}`} style={[styles.total, layout.wide && styles.wideTotal]}>{formatUSD(totalCents)}</Text>
                <Text style={styles.usd}>USD</Text>
              </View>
            </View>
          </View>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  columns: { alignItems: 'stretch' },
  feesColumn: { flex: 1.35, minWidth: 0, alignSelf: 'flex-start' },
  actionsColumn: { flex: 1, minWidth: 0 },
  wideInput: { fontSize: 14, minHeight: 40 },
  wideTotal: { fontSize: 34 },
  errorMessage: { marginBottom: 20 },
  summaryLabel: { marginBottom: 5 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10 },
  input: { flex: 1, minWidth: 0, fontFamily: monoFont, color: colors.text, fontSize: 12, paddingVertical: 5 },
  apply: { backgroundColor: '#202B3D', borderRadius: 3, paddingHorizontal: 11, minHeight: 44, justifyContent: 'center' },
  applyText: { color: colors.cyan, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  feedback: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 14, marginTop: -6 },
  splitRow: { borderColor: colors.gold, backgroundColor: '#171719', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  splitLabel: { color: colors.gold, fontFamily: monoFont, fontSize: 12, fontWeight: '700' },
  select: { backgroundColor: colors.gold, borderRadius: 3, paddingHorizontal: 11, minHeight: 44, justifyContent: 'center' },
  selectText: { color: colors.background, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  totalCard: { borderColor: colors.cyan, backgroundColor: '#0A1B24', paddingVertical: 12 },
  escrowRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6, marginBottom: 10 },
  escrow: { color: colors.green, fontFamily: monoFont, fontSize: 10, lineHeight: 16, fontWeight: '700' },
  totalRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  totalLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  totalValue: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  total: { color: colors.cyan, fontFamily: monoFont, fontSize: 28, fontWeight: '700' },
  usd: { color: colors.text, fontFamily: monoFont, fontSize: 12 },
});
