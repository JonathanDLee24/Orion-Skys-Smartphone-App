import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import ToggleSwitch from '../components/ToggleSwitch';
import {
  acceptLiabilityClauses,
  getCheckedClauseIds,
  getLiabilityClauses,
  getShowKey,
  saveCheckedClauses,
} from '../services/liabilityClausesService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

// Compliance check: the pilot must acknowledge every liability clause before
// the show's authorization can continue.

function Checkbox({ checked }) {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked ? <Text style={styles.checkmark}>✓</Text> : null}
    </View>
  );
}

export default function LiabilityClausesScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const submission = route?.params?.submission || null;
  const adminReturn = route?.params?.adminReturn;
  const clauses = getLiabilityClauses();
  const showKey = getShowKey(submission);
  // Each show reopens with its boxes exactly as the pilot left them.
  const [accepted, setAccepted] = useState(() => (
    Object.fromEntries(getCheckedClauseIds(showKey).map((id) => [id, true]))
  ));

  const acceptedCount = clauses.filter((clause) => accepted[clause.id]).length;
  const remaining = clauses.length - acceptedCount;
  const allAccepted = clauses.length > 0 && remaining === 0;
  const progress = clauses.length ? acceptedCount / clauses.length : 0;

  // Every change is saved straight away, so leaving the page by any route
  // keeps the boxes, and unchecking one withdraws an earlier acceptance.
  function updateChecked(next) {
    setAccepted(next);
    saveCheckedClauses(showKey, clauses.filter((clause) => next[clause.id]).map((clause) => clause.id));
  }

  function toggleClause(id) {
    updateChecked({ ...accepted, [id]: !accepted[id] });
  }

  function setAll(value) {
    updateChecked(Object.fromEntries(clauses.map((clause) => [clause.id, value])));
  }

  function returnToAuthorization(extra = {}) {
    navigation.navigate('ShowAuthorization', {
      ...(submission ? { submission } : {}),
      ...(adminReturn ? { adminReturn } : {}),
      ...extra,
    });
  }

  function proceed() {
    acceptLiabilityClauses(showKey);
    // A fresh value each time so Show Authorization shows the popup again even
    // when the route is already on the stack.
    returnToAuthorization({ acceptedNotice: Date.now() });
  }

  const proceedLabel = allAccepted
    ? 'Proceed'
    : `Proceed (${remaining} ${remaining === 1 ? 'clause remains' : 'clauses remain'})`;

  return (
    <ScreenLayout
      caption={adminReturn ? 'ADMIN OPERATIONS / BOOKINGS' : 'EMPLOYEE OPERATIONS / BOOKINGS'}
      label="COMPLIANCE CHECK"
      title="Liability Clauses"
      showProgress={false}
      headerAction={<Text style={styles.required}>● REQUIRED</Text>}
      onBack={() => returnToAuthorization()}
      backLabel="Back to show authorization"
      onAccount={() => navigation.navigate('AccountSettings')}
      footer={(
        <View style={[styles.footerInner, { paddingHorizontal: layout.wide ? 0 : 4 }]}>
          <Pressable
            testID="liability-proceed"
            accessibilityRole="button"
            accessibilityLabel={proceedLabel}
            accessibilityState={{ disabled: !allAccepted }}
            disabled={!allAccepted}
            onPress={proceed}
            style={({ pressed }) => [
              styles.proceed,
              allAccepted ? styles.proceedEnabled : styles.proceedDisabled,
              layout.wide && styles.wideProceed,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.proceedText, allAccepted && styles.proceedTextEnabled]}>{proceedLabel}</Text>
          </Pressable>
        </View>
      )}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        {submission?.eventName ? (
          <Text style={[s.body, styles.intro]}>
            Acknowledge every clause to continue authorizing {submission.eventName}.
          </Text>
        ) : null}

        <View testID="agreement-gauge" style={[s.card, styles.gauge]}>
          <View style={styles.gaugeHeader}>
            <Text style={s.label}>AGREEMENT GAUGE</Text>
            <Text testID="agreement-count" style={styles.gaugeCount}>
              {`${acceptedCount} / ${clauses.length} COMPLETED`}
            </Text>
          </View>
          <View
            style={styles.gaugeTrack}
            accessibilityRole="progressbar"
            accessibilityLabel="Agreement gauge"
            accessibilityValue={{ min: 0, max: clauses.length, now: acceptedCount }}
          >
            <View testID="agreement-fill" style={[styles.gaugeFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.selectAll}>
          <Text style={s.label}>SELECT ALL CLAUSES</Text>
          <ToggleSwitch
            testID="select-all-clauses"
            label="Select all clauses"
            value={allAccepted}
            onValueChange={setAll}
          />
        </View>

        <View testID="liability-clauses">
          {clauses.map((clause) => {
            const checked = Boolean(accepted[clause.id]);
            return (
              <Pressable
                key={clause.id}
                testID={`clause-${clause.id}`}
                accessibilityRole="checkbox"
                accessibilityLabel={clause.title}
                accessibilityState={{ checked }}
                aria-checked={checked}
                onPress={() => toggleClause(clause.id)}
                style={({ pressed }) => [
                  s.card,
                  styles.clause,
                  checked && styles.clauseChecked,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.clauseHeader}>
                  <Checkbox checked={checked} />
                  <Text style={styles.clauseTitle}>{clause.title}</Text>
                  <Text style={styles.clauseId}>{clause.id}</Text>
                </View>
                <Text style={[s.body, styles.clauseDescription]}>{clause.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  wideContent: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  required: { color: colors.gold, fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  intro: { marginTop: -8, marginBottom: 14 },
  gauge: { borderRadius: 8 },
  gaugeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gaugeCount: { color: colors.accent, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  gaugeTrack: { height: 4, borderRadius: 2, backgroundColor: colors.background, overflow: 'hidden' },
  gaugeFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  selectAll: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  clause: { borderRadius: 8 },
  clauseChecked: { borderColor: colors.accent, borderWidth: 1 },
  clauseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  clauseTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
  clauseId: { color: colors.muted, fontFamily: monoFont, fontSize: 9 },
  clauseDescription: { lineHeight: 18 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  checkmark: { color: colors.accent, fontSize: 13, fontWeight: '900', lineHeight: 15 },
  footerInner: { width: '100%' },
  proceed: {
    minHeight: 48,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  wideProceed: { minHeight: 56, maxWidth: 720, width: '100%', alignSelf: 'center' },
  proceedDisabled: { backgroundColor: colors.card, borderColor: colors.border },
  proceedEnabled: { backgroundColor: colors.accent, borderColor: colors.accent },
  proceedText: { color: colors.muted, fontFamily: monoFont, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  proceedTextEnabled: { color: colors.background },
  pressed: { opacity: 0.72 },
});
