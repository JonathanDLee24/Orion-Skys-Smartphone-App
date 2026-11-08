import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { formatCredits, getCreditAccount } from '../services/creditsService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const CREDIT_RULES = [
  'One credit equals US$1 toward drone show production.',
  'Credits are applied only after operations confirms a show.',
  'Pending requests and venue review never charge your balance.',
];

export default function CreditsScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const account = getCreditAccount();

  return (
    <ScreenLayout
      caption="CLIENT OPERATIONS / CREDITS"
      label="CLIENT CREDITS // 2026"
      title="Credits."
      badge="● CLIENT"
      onLogoPress={() => navigation.navigate('EmployeeDashboard')}
      backLabel="Back to events"
      backGlyph="<"
      onBack={() => navigation.navigate('EmployeeEvents')}
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={
        <PrimaryButton
          title="Schedule a show"
          showArrow
          onPress={() => navigation.navigate('BookingDateVenue')}
        />
      }
    >
      <View
        testID="credits-columns"
        style={[styles.columns, layout.wide && styles.columnsWide, { gap: layout.wide ? layout.gap : 0 }]}
      >
        <View style={[styles.column, layout.wide && styles.wideColumn]}>
          <View
            testID="credits-balance"
            style={[s.card, styles.balanceCard, layout.wide && styles.balanceCardWide]}
          >
            <View style={styles.balanceCopy}>
              <Text style={[s.label, styles.balanceLabel]}>// AVAILABLE BALANCE</Text>
              <View style={styles.balanceRow}>
                <Text
                  testID="credits-available"
                  style={[styles.balanceValue, layout.wide && styles.balanceValueWide]}
                >
                  {formatCredits(account.availableCredits)}
                </Text>
                <Text style={styles.balanceUnit}>CREDITS</Text>
              </View>
              <Text style={[s.body, styles.balanceNote]}>
                US${account.usdPerCredit} per credit toward drone show production.
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>● ACTIVE</Text>
            </View>
          </View>

          <View style={[s.card, layout.wide && styles.rulesCardWide]}>
            <Text style={[s.label, styles.groupLabel]}>// HOW CREDITS WORK</Text>
            {CREDIT_RULES.map((rule, index) => (
              <View key={rule} style={[styles.rule, index > 0 && styles.ruleDivider]}>
                <View style={styles.ruleNumber}>
                  <Text style={styles.ruleNumberText}>{index + 1}</Text>
                </View>
                <Text style={[s.body, styles.ruleText]}>{rule}</Text>
              </View>
            ))}
            <Text style={styles.footnote}>
              Need more? Credits can be added to your account before scheduling your next show.
            </Text>
          </View>
        </View>

        <View style={[styles.column, layout.wide && styles.wideColumn]}>
          <View style={s.card}>
            <Text style={[s.label, styles.groupLabel]}>// RECENT ACTIVITY</Text>
            {account.activity.map((entry, index) => (
              <View
                key={entry.id}
                testID={`credit-entry-${entry.id}`}
                style={[styles.activityRow, index > 0 && styles.activityDivider]}
              >
                <View style={styles.activityCopy}>
                  <Text style={styles.activityTitle}>{entry.label}</Text>
                  <Text style={s.body}>
                    {entry.date} · {entry.detail}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    entry.amount > 0 ? styles.amountPositive : styles.amountSpent,
                  ]}
                >
                  {`${entry.amount > 0 ? '+' : '−'}${formatCredits(Math.abs(entry.amount))}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 18,
  },
  balanceCardWide: { paddingVertical: 16, marginBottom: 16 },
  balanceCopy: { flex: 1, minWidth: 0 },
  balanceLabel: { color: colors.accent, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 },
  balanceValue: {
    color: colors.accent,
    fontFamily: monoFont,
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
  },
  balanceValueWide: { fontSize: 52, lineHeight: 56 },
  balanceUnit: {
    color: colors.muted,
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceNote: { marginTop: 6 },
  statusPill: {
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { color: colors.green, fontFamily: monoFont, fontSize: 8, fontWeight: '700' },
  columns: { width: '100%' },
  columnsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { width: '100%' },
  wideColumn: { width: 'auto', flex: 1, minWidth: 0 },
  rulesCardWide: { paddingVertical: 16, marginBottom: 0 },
  groupLabel: { marginBottom: 8 },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  ruleDivider: { borderTopWidth: 1, borderColor: colors.border },
  ruleNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumberText: { color: colors.accent, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  ruleText: { flex: 1, minWidth: 0, lineHeight: 18 },
  footnote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  activityDivider: { borderTopWidth: 1, borderColor: colors.border },
  activityCopy: { flex: 1, minWidth: 0 },
  activityTitle: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  amount: { fontFamily: monoFont, fontSize: 12, fontWeight: '700' },
  amountPositive: { color: colors.green },
  amountSpent: { color: colors.text },
});
