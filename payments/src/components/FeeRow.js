import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatUSD } from '../utils/fees';
import { colors, monoFont, useResponsiveLayout } from '../theme';

export default function FeeRow({ label, amountCents, refundable = false, tax = false }) {
  const layout = useResponsiveLayout();
  return (
    <View style={[styles.row, layout.wide && { paddingVertical: 14, gap: 12 }, tax && styles.tax]}>
      <Text style={[styles.label, { fontSize: layout.bodySize, lineHeight: layout.wide ? 24 : 16 }, tax && styles.muted]}>{label}</Text>
      <View style={styles.value}>
        <Text style={[styles.amount, { fontSize: layout.bodySize }, refundable && styles.refundable]}>{formatUSD(amountCents)}</Text>
        {refundable && <Text style={[styles.note, layout.wide && { fontSize: 11 }]}>(Refundable)</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3, paddingVertical: 6 },
  label: { flexShrink: 1, color: colors.text, fontSize: 11, lineHeight: 16 },
  value: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 5, maxWidth: '49%' },
  amount: { color: colors.text, fontFamily: monoFont, fontSize: 11, textAlign: 'right' },
  refundable: { color: colors.green },
  note: { color: colors.muted, fontFamily: monoFont, fontSize: 9 },
  tax: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 11, marginTop: 5 },
  muted: { color: colors.muted },
});
