import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, monoFont, useResponsiveLayout } from '../theme';

export const BOOKING_WIZARD_STEPS = ['DATE & VENUE', 'REVIEW', 'REQUEST'];

export default function BookingWizardProgress({ currentStep = 1 }) {
  const layout = useResponsiveLayout();

  return (
    <View
      testID="booking-wizard-progress"
      accessibilityRole="progressbar"
      accessibilityLabel="Booking progress"
      accessibilityValue={{ min: 1, max: BOOKING_WIZARD_STEPS.length, now: currentStep, text: `${BOOKING_WIZARD_STEPS[currentStep - 1]} step` }}
      style={styles.row}
    >
      {BOOKING_WIZARD_STEPS.map((label, index) => {
        const step = index + 1;
        const active = step === currentStep;
        const complete = step < currentStep;
        return (
          <View key={label} testID={`wizard-step-${step}`} style={styles.segment}>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { fontSize: layout.wide ? 11 : 9 },
                complete && styles.completeLabel,
                active && styles.activeLabel,
              ]}
            >
              {label}
            </Text>
            <View style={[styles.track, complete && styles.completeTrack, active && styles.activeTrack]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  segment: { flex: 1, minWidth: 0 },
  label: { color: colors.muted, fontFamily: monoFont, fontWeight: '700', letterSpacing: 0.4, marginBottom: 7 },
  completeLabel: { color: colors.text },
  activeLabel: { color: colors.accent },
  track: { height: 2, backgroundColor: colors.border },
  completeTrack: { backgroundColor: colors.muted },
  activeTrack: { height: 3, backgroundColor: colors.accent },
});
