import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ConfirmationPopup from '../components/ConfirmationPopup';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { getShowKey, useLiabilityAccepted } from '../services/liabilityClausesService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

// Entry point for a show's authorization paperwork, opened from Show
// Management. Pending Signatures has no screen yet, so it has no route.
const SECTIONS = [
  {
    key: 'liability',
    title: 'Liability Clauses',
    description: 'Review the liability terms that cover this show.',
    route: 'LiabilityClauses',
  },
  {
    key: 'signatures',
    title: 'Pending Signatures',
    description: 'See which authorization documents still need signing.',
  },
];

export default function ShowAuthorizationScreen({ route, navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const submission = route?.params?.submission || null;
  const adminReturn = route?.params?.adminReturn;
  const liabilityAccepted = useLiabilityAccepted(getShowKey(submission));
  // Liability Clauses sends a fresh acceptedNotice after Proceed; show the
  // popup once per notice, then clear it so a remount does not replay it.
  const acceptedNotice = route?.params?.acceptedNotice;
  const [dismissedNotice, setDismissedNotice] = useState(null);
  const showAcceptedPopup = Boolean(acceptedNotice) && acceptedNotice !== dismissedNotice;

  function hideAcceptedPopup() {
    setDismissedNotice(acceptedNotice);
    navigation.setParams?.({ acceptedNotice: undefined });
  }

  function openSection(section) {
    if (!section.route) return;
    navigation.navigate(section.route, {
      ...(submission ? { submission } : {}),
      ...(adminReturn ? { adminReturn } : {}),
    });
  }

  function backToManage() {
    navigation.navigate('BookingManage', {
      ...(submission ? { submission } : {}),
      ...(adminReturn ? { adminReturn } : {}),
    });
  }

  return (
    <ScreenLayout
      caption={adminReturn ? 'ADMIN OPERATIONS / BOOKINGS' : 'EMPLOYEE OPERATIONS / BOOKINGS'}
      label={`SHOW AUTHORIZATION // ${submission?.reference || 'BOOKING'}`}
      title="Show Authorization"
      secure
      showProgress={false}
      onBack={backToManage}
      backLabel="Back to show management"
      onAccount={() => navigation.navigate('AccountSettings')}
      overlay={(
        <ConfirmationPopup
          testID="liability-accepted-popup"
          message={showAcceptedPopup ? 'Liability Clauses accepted' : null}
          showKey={acceptedNotice}
          onHide={hideAcceptedPopup}
        />
      )}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        {submission?.eventName ? (
          <Text testID="authorization-show" style={[styles.eventName, layout.wide && styles.wideEventName]}>
            {submission.eventName}
          </Text>
        ) : null}
        <Text style={[s.body, styles.intro]}>
          Choose what to review before this show is authorized to fly.
        </Text>

        <View testID="authorization-sections" style={[styles.sections, layout.wide && styles.wideSections]}>
          {SECTIONS.map((section) => {
            const done = section.key === 'liability' && liabilityAccepted;
            return (
              <Pressable
                key={section.key}
                testID={`authorization-${section.key}`}
                accessibilityRole="button"
                accessibilityLabel={section.title}
                onPress={() => openSection(section)}
                style={({ pressed }) => [
                  s.card,
                  styles.section,
                  layout.wide && styles.wideSection,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={s.body}>{section.description}</Text>
                  {done ? <Text testID={`authorization-${section.key}-accepted`} style={styles.accepted}>✓ ACCEPTED</Text> : null}
                </View>
                <Text style={styles.chevron}>→</Text>
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
  eventName: { color: colors.accent, fontFamily: monoFont, fontSize: 12, fontWeight: '700', marginTop: -8, marginBottom: 6 },
  wideEventName: { fontSize: 13, marginTop: 0 },
  intro: { marginBottom: 16 },
  sections: { width: '100%' },
  wideSections: { flexDirection: 'row', gap: 16 },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    borderColor: colors.accent,
  },
  wideSection: { flex: 1, minWidth: 0 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  accepted: { color: colors.green, fontFamily: monoFont, fontSize: 10, fontWeight: '700', marginTop: 8 },
  chevron: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
