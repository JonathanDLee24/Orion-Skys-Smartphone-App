import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import { useAccessibility, useAccessibilityColors, useTapTargets } from '../components/AccessibilityProvider';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import ToggleSwitch from '../components/ToggleSwitch';
import { TEXT_SIZE_OPTIONS } from '../services/accessibilityService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const VISUAL_AND_MOTOR_OPTIONS = [
  {
    key: 'highContrast',
    title: 'High-contrast colours',
    description: 'Brightens dim text and strengthens borders and dividers.',
  },
  {
    key: 'largeTargets',
    title: 'Large touch targets',
    description: 'Grows buttons, tabs, calendar days and switches for easier tapping.',
  },
  {
    key: 'reduceMotion',
    title: 'Reduce motion',
    description: 'Turns off fades, the drone launch and screen transition animations.',
  },
];

export default function AccessibilitySettingsScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const theme = useAccessibilityColors();
  const tapTargets = useTapTargets();
  const { preferences, setPreferences, resetPreferences, enabled, textSize } = useAccessibility();
  const adminMode = route?.params?.adminMode === true;

  function backToAccount() {
    navigation.navigate(adminMode ? 'AdminDashboard' : 'Dashboard');
  }

  return (
    <ScreenLayout
      label={adminMode ? 'ADMIN ACCOUNT // ACCESSIBILITY' : 'CLIENT ACCOUNT // ACCESSIBILITY'}
      title="Accessibility"
      onLogoPress={() => navigation.navigate(adminMode ? 'AdminDashboard' : 'EmployeeDashboard')}
      backLabel={adminMode ? 'Back to admin dashboard' : 'ACCOUNT'}
      backGlyph="<"
      onBack={backToAccount}
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset accessibility options"
          onPress={resetPreferences}
          style={({ pressed }) => [styles.reset, tapTargets.style, { borderColor: theme.border }, pressed && styles.pressed]}
        >
          <Text style={[styles.resetText, { color: theme.muted }]}>Reset accessibility options</Text>
        </Pressable>
      }
    >
      <View testID="accessibility-settings" style={styles.screen}>
        <View style={[s.card, styles.masterCard, { borderColor: enabled ? theme.accent : theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>Accessibility mode</Text>
              <Text style={s.body}>
                Turn this on to apply the options below to every screen in the app. Turn it off to return to the standard layout.
              </Text>
            </View>
            <ToggleSwitch
              testID="a11y-enabled"
              label="Accessibility mode"
              value={preferences.enabled}
              onValueChange={(value) => setPreferences({ enabled: value })}
            />
          </View>
          <Text testID="a11y-status" accessibilityLiveRegion="polite" style={[styles.status, { color: enabled ? theme.accent : theme.muted }]}>
            {enabled ? '● ACCESSIBILITY MODE ON' : '○ ACCESSIBILITY MODE OFF'}
          </Text>
        </View>

        <View testID="accessibility-columns" style={[styles.columns, { flexDirection: layout.wide ? 'row' : 'column', gap: layout.wide ? layout.gap : 0 }]}>
          <View style={[s.card, layout.wide && styles.column]}>
            <Text style={[s.label, styles.groupLabel]}>// TEXT SIZE</Text>
            <Text style={s.body}>Scales every label, heading and value in the app.</Text>
            <View accessibilityRole="radiogroup" style={[styles.sizeRow, { borderColor: theme.border }]}>
              {TEXT_SIZE_OPTIONS.map((option) => {
                const selected = textSize === option.value;
                return (
                  <Pressable
                    key={option.value}
                    testID={`a11y-text-size-${option.value}`}
                    accessibilityRole="radio"
                    accessibilityLabel={`${option.label} text`}
                    accessibilityState={{ checked: selected, selected, disabled: !enabled }}
                    accessibilityHint={option.description}
                    disabled={!enabled}
                    hitSlop={tapTargets.hitSlop}
                    onPress={() => setPreferences({ textSize: option.value })}
                    style={({ pressed }) => [
                      styles.sizeOption,
                      { borderColor: theme.border },
                      selected && styles.sizeOptionActive,
                      tapTargets.largeTargets && styles.largeSizeOption,
                      !enabled && styles.disabledOption,
                      pressed && enabled && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.sizeLabel, selected && styles.sizeLabelActive, !enabled && { color: theme.muted }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.sizeFactor, !enabled && { color: theme.muted }]}>{Math.round(option.factor * 100)}%</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text testID="a11y-text-preview" style={[styles.preview, { color: theme.text }]}>
              Preview · Apex Global Summit at 8:00 PM, Marina Bay Event Deck
            </Text>
            {!enabled && (
              <Text style={[styles.helper, { color: theme.gold }]}>Turn on Accessibility mode to change the text size.</Text>
            )}
          </View>

          <View style={[s.card, layout.wide && styles.column]}>
            <Text style={[s.label, styles.groupLabel]}>// DISPLAY, MOTION & TARGETS</Text>
            {VISUAL_AND_MOTOR_OPTIONS.map((option, index) => (
              <View key={option.key} style={[styles.row, index > 0 && styles.rowDivider, index > 0 && { borderColor: theme.border }]}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{option.title}</Text>
                  <Text style={s.body}>{option.description}</Text>
                </View>
                <ToggleSwitch
                  testID={`a11y-${option.key}`}
                  label={option.title}
                  value={preferences[option.key]}
                  disabled={!enabled}
                  onValueChange={(value) => setPreferences({ [option.key]: value })}
                />
              </View>
            ))}
            {!enabled && (
              <Text style={[styles.helper, { color: theme.gold }]}>
                These options stay saved. They apply as soon as Accessibility mode is on.
              </Text>
            )}
          </View>
        </View>

        <View style={[s.card, { borderColor: theme.border }]}>
          <Text style={[s.label, styles.groupLabel]}>// SCREEN READERS & SWITCH CONTROL</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoBadge, { color: theme.green, borderColor: theme.green }]}>● ALWAYS ON</Text>
            <Text style={styles.infoTitle}>Image descriptions</Text>
          </View>
          <Text style={s.body}>
            The company logo and every image carry a spoken description, so VoiceOver and TalkBack read them out instead of “image”.
          </Text>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoBadge, { color: theme.green, borderColor: theme.green }]}>● ALWAYS ON</Text>
            <Text style={styles.infoTitle}>Screen reader and switch control support</Text>
          </View>
          <Text style={s.body}>
            Controls announce their role, label and on/off state, and stay in a single reading order. Switch control and a Bluetooth keyboard can move through every button, tab and option here.
          </Text>
          <Text style={[styles.footnote, { borderColor: theme.border }]}>
            These options are held for this session only; they reset when the app reloads.
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  masterCard: { borderWidth: 2 },
  columns: { alignItems: 'stretch' },
  column: { flex: 1, minWidth: 0 },
  groupLabel: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10 },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  rowDivider: { borderTopWidth: 1 },
  status: { fontFamily: monoFont, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 10 },
  sizeRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 },
  sizeOption: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  largeSizeOption: { minHeight: 60 },
  sizeOptionActive: { backgroundColor: colors.accentTint, borderColor: colors.accent },
  sizeLabel: { color: colors.text, fontSize: 12, fontWeight: '700' },
  sizeLabelActive: { color: colors.accent },
  sizeFactor: { color: colors.muted, fontFamily: monoFont, fontSize: 9 },
  disabledOption: { opacity: 0.5 },
  preview: { fontSize: 13, lineHeight: 19 },
  helper: { fontSize: 11, lineHeight: 16, marginTop: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  infoBadge: { fontFamily: monoFont, fontSize: 9, fontWeight: '700', borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  infoTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  infoDivider: { height: 1, marginVertical: 12 },
  footnote: { color: colors.muted, fontSize: 11, lineHeight: 16, fontStyle: 'italic', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  reset: { minHeight: 44, borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  resetText: { fontSize: 12 },
  pressed: { opacity: 0.72 },
});
