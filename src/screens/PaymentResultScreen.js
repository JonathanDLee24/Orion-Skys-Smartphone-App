import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import PrimaryButton from '../components/PrimaryButton';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const paymentColors = {
  panel: '#111622',
  cyan: '#00F0FF',
  green: '#10B981',
  gold: '#FFB800',
  red: '#FF3B30',
};

function parseUSD(value) {
  const parsed = Number.parseFloat(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function formatUSD(cents) {
  return `$${(Math.max(0, cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ActionButton({ title, tone = 'outline', onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.actionButton, tone === 'filled' && styles.filledAction, tone === 'gold' && styles.goldAction, tone === 'danger' && styles.dangerAction, pressed && styles.pressed]}>
      <Text style={[styles.actionText, tone === 'danger' ? styles.dangerActionText : tone !== 'outline' && styles.filledActionText]}>{title}</Text>
    </Pressable>
  );
}

function ResultFooter({ actions, onHome }) {
  return (
    <View style={styles.footer}>
      <View style={styles.footerActions}>{actions.map((action) => <ActionButton key={action.title} {...action} />)}</View>
      <View style={styles.homeIndicator} />
      <Pressable accessibilityRole="button" accessibilityLabel="Return to flight desk" onPress={onHome} style={styles.footerHome}><Text style={styles.footerHomeText}>FLIGHT DESK</Text></Pressable>
    </View>
  );
}

function MetadataCard({ payment }) {
  const paymentMethod = payment?.paymentMethod || 'Stripe Card (•••• 9010)';
  return (
    <View style={styles.metadataCard}>
      <Text style={styles.sectionLabel}>// TRANSACTION_METADATA</Text>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Transaction ID</Text><Text style={styles.metaValue}>{payment?.transactionId || 'TXN-SF-8849204'}</Text></View>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Payment Method</Text><Text style={[styles.metaValue, paymentMethod.startsWith('Stripe Card') && styles.stripeValue]}>{paymentMethod}</Text></View>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Timestamp</Text><Text style={styles.metaValue}>{payment?.timestamp || '2026-10-24 14:32 UTC'}</Text></View>
    </View>
  );
}

export default function PaymentResultScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const previewOutcome = Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('outcome') : null;
  const outcome = route.params?.outcome || previewOutcome || 'success';
  const payment = route.params?.payment;
  const booking = route.params?.booking;
  const total = route.params?.total || '$4,674.00';

  if (outcome === 'partial') {
    const totalCents = payment?.amountCents || parseUSD(total) || 467400;
    const paidCents = Math.min(payment?.paidAmountCents || 150000, totalCents);
    const remainingCents = totalCents - paidCents;
    const completionPercent = totalCents ? Math.round((paidCents / totalCents) * 100) : 0;
    return (
      <ScreenLayout hideBrand showProgress={false} label="ESCROW: LEDGER_BALANCED" headerBadge="PARTIAL_OK" headerTone="gold" title="Partial Settlement" footer={<ResultFooter onHome={() => navigation.navigate('Dashboard')} actions={[{ title: 'VIEW PAYMENT SCHEDULE', onPress: () => {} }, { title: 'PAY REMAINING BALANCE', tone: 'gold', onPress: () => navigation.navigate('Checkout', { booking }) }]} />}>
        <View style={styles.resultContent}>
          <View style={[styles.progressCard, layout.wide && styles.wideCard]}>
            <Text style={styles.sectionLabel}>// PORTAL_PROGRESS</Text>
            <View style={styles.amountLine}><Text style={styles.partialAmount}>{formatUSD(paidCents)}</Text><Text style={styles.paidText}>{`of ${formatUSD(totalCents)} paid`}</Text></View>
            <View style={styles.progressTrack}><View style={[styles.partialProgress, { width: `${completionPercent}%` }]} /></View>
            <View style={styles.progressLabels}><Text style={styles.metaLabel}>{completionPercent}% Completed</Text><Text style={[styles.metaLabel, styles.goldText]}>{formatUSD(remainingCents)} Remaining</Text></View>
          </View>
          <View style={[styles.metadataCard, layout.wide && styles.wideCard]}>
            <Text style={styles.sectionLabel}>// SCHEDULED_PAYMENT_PLAN</Text>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Next Payment Date</Text><Text style={styles.metaValue}>NOV 15, 2026</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Installment Amount</Text><Text style={styles.metaValue}>$1,587.00 USD</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Status code</Text><Text style={[styles.metaValue, styles.goldText]}>ACTIVE_SPLIT_AGREEMENT</Text></View>
          </View>
        </View>
      </ScreenLayout>
    );
  }

  if (outcome === 'declined') {
    return (
    <ScreenLayout hideBrand showProgress={false} label="GATEWAY: TRANSACTION_ERR" headerBadge="REJECTED" headerTone="danger" title="Payment Declined" footer={<ResultFooter onHome={() => navigation.navigate('Dashboard')} actions={[{ title: 'USE ANOTHER CARD', onPress: () => navigation.navigate('Checkout', { booking }) }, { title: 'RETRY TRANSACTION', tone: 'danger', onPress: () => navigation.navigate('Checkout', { booking, retryPayment: true }) }]} />}>
        <View style={styles.resultContent}>
          <View style={[styles.declineCard, layout.wide && styles.wideCard]}>
            <View style={styles.warningIcon}><Text style={styles.warningIconText}>!</Text></View>
            <Text style={styles.errorCode}>// BANK_DEC_ERR_CODE_54_EXPIRED</Text>
            <Text style={styles.declineTitle}>EXPIRED_CARD_DETECTED</Text>
            <Text style={styles.declineCopy}>Stripe reports expiration date mismatch or card out-of-date. Expiry provided: 12/29.</Text>
          </View>
          <View style={[styles.metadataCard, layout.wide && styles.wideCard]}>
            <Text style={styles.sectionLabel}>// SUGGESTED_RESOLUTION_STEPS</Text>
            <View style={styles.stepRow}><View style={[styles.stepDot, styles.dangerDot]} /><Text style={styles.stepText}>Update Expiration Year / Month details</Text></View>
            <View style={styles.stepRow}><View style={styles.stepDot} /><Text style={styles.stepText}>Coordinate override with issuer bank</Text></View>
          </View>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout hideBrand showProgress={false} label="DEBIT: TRANSMISSION_OK" headerBadge="SUCCESS" headerTone="success" title="Payment Authorized" footer={<ResultFooter onHome={() => navigation.navigate('Dashboard')} actions={[{ title: 'DOWNLOAD DIGITAL COPY', onPress: () => { if (Platform.OS === 'web') window.alert('Digital payment receipt ready.'); } }, { title: 'RETURN TO FLIGHT DESK', tone: 'filled', onPress: () => navigation.navigate('Dashboard') }]} />}>
      <View style={styles.resultContent}>
        <View style={[styles.successCard, layout.wide && styles.wideCard]}>
          <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
          <Text style={styles.sectionLabel}>// TRANS_COMPLETE_ESCROW_RELEASED</Text>
          <Text accessibilityLabel={`Payment total ${total}`} style={styles.successAmount}>{total}</Text>
          <Text style={styles.successCopy}>Funds deposited successfully into the FAA stadium-escrow account.</Text>
        </View>
        <MetadataCard payment={payment} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  resultContent: { flex: 1 },
  wideCard: { padding: 24 },
  successCard: { backgroundColor: paymentColors.panel, borderWidth: 1, borderColor: paymentColors.green, borderRadius: 6, padding: 18, alignItems: 'center', marginBottom: 14 },
  successIcon: { width: 38, height: 38, borderRadius: 20, backgroundColor: paymentColors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successIconText: { color: colors.background, fontSize: 26, lineHeight: 30, fontWeight: '700' },
  sectionLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, letterSpacing: 0.4, marginBottom: 12 },
  successAmount: { color: colors.text, fontFamily: monoFont, fontSize: 28, fontWeight: '700', marginVertical: 10 },
  successCopy: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  metadataCard: { backgroundColor: paymentColors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 14, marginBottom: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1F293D' },
  metaLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, lineHeight: 14 },
  metaValue: { color: colors.text, fontFamily: monoFont, fontSize: 9, lineHeight: 14, textAlign: 'right', flexShrink: 1 },
  stripeValue: { color: paymentColors.cyan },
  progressCard: { backgroundColor: paymentColors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 14, marginBottom: 14 },
  amountLine: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  partialAmount: { color: paymentColors.gold, fontFamily: monoFont, fontSize: 25, fontWeight: '700' },
  paidText: { color: '#7B8498', fontFamily: monoFont, fontSize: 10, lineHeight: 14 },
  progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  partialProgress: { width: '32%', height: '100%', backgroundColor: paymentColors.gold },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  goldText: { color: paymentColors.gold },
  declineCard: { backgroundColor: '#17131A', borderWidth: 1, borderColor: paymentColors.red, borderRadius: 6, padding: 18, alignItems: 'center', marginBottom: 14 },
  warningIcon: { width: 34, height: 34, borderRadius: 18, backgroundColor: paymentColors.red, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  warningIconText: { color: colors.text, fontSize: 23, fontWeight: '700' },
  errorCode: { color: paymentColors.red, fontFamily: monoFont, fontSize: 9, marginBottom: 12 },
  declineTitle: { color: colors.text, fontFamily: monoFont, fontSize: 11, fontWeight: '700', marginBottom: 10 },
  declineCopy: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#1F293D', paddingVertical: 11 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.muted },
  dangerDot: { backgroundColor: paymentColors.red },
  stepText: { color: colors.text, fontFamily: monoFont, fontSize: 9, flex: 1 },
  footer: { backgroundColor: paymentColors.panel, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  footerActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, minHeight: 38, borderWidth: 1, borderColor: colors.muted, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  actionText: { color: colors.text, fontFamily: monoFont, fontSize: 8, fontWeight: '700', textAlign: 'center' },
  filledAction: { backgroundColor: paymentColors.cyan, borderColor: paymentColors.cyan },
  goldAction: { backgroundColor: paymentColors.gold, borderColor: paymentColors.gold },
  dangerAction: { backgroundColor: paymentColors.red, borderColor: paymentColors.red },
  dangerActionText: { color: '#FFFFFF' },
  filledActionText: { color: colors.background },
  pressed: { opacity: 0.72 },
  homeIndicator: { alignSelf: 'center', width: 150, height: 5, borderRadius: 4, backgroundColor: colors.muted, marginTop: 14, opacity: 0.9 },
  footerHome: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  footerHomeText: { color: colors.text },
});
