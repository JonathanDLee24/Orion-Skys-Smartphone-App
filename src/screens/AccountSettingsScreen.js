import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DropdownSelect from '../components/DropdownSelect';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import Toast from '../components/Toast';
import ToggleSwitch from '../components/ToggleSwitch';
import { languageOptions, timeZoneOptions } from '../mockData';
import { getSettingsPreferences, saveNotificationSettings } from '../services/settingsService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const NOTIFICATION_STREAMS = [
  { key: 'email', title: 'Email notifications', description: 'Updates to account email' },
  { key: 'push', title: 'Push notifications', description: 'Alerts on this device' },
  { key: 'shows', title: 'Show updates', description: 'Schedule, review, and show brief reminders' },
  { key: 'billing', title: 'Billing messages', description: 'Invoices and payment reminders' },
];

export default function AccountSettingsScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const [notifications, setNotifications] = useState(() => ({ ...getSettingsPreferences().notifications }));
  const [language, setLanguage] = useState(() => getSettingsPreferences().language);
  const [timeZone, setTimeZone] = useState(() => getSettingsPreferences().timeZone);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);

  function backToDashboard() {
    navigation.navigate('Dashboard');
  }

  function toggleStream(key, value) {
    setNotifications((previous) => ({ ...previous, [key]: value }));
  }

  async function savePreferences() {
    setSaving(true);
    setSaveError(null);
    try {
      await saveNotificationSettings({ notifications, language, timeZone });
      setSavedMessage('Preferences saved');
    } catch (err) {
      setSavedMessage(null);
      setSaveError(err.message || 'We could not save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenLayout
      label="CLIENT ACCOUNT // SETTINGS"
      title="Notification Preferences"
      onLogoPress={() => navigation.navigate('EmployeeDashboard')}
      backLabel="ACCOUNT"
      backGlyph="<"
      onBack={backToDashboard}
      overlay={<Toast message={savedMessage} onHide={() => setSavedMessage(null)} />}
      footer={
        <>
          {!!saveError && <Text accessibilityRole="alert" style={styles.saveError}>{saveError}</Text>}
          <PrimaryButton title="Save preferences" loading={saving} onPress={savePreferences} />
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel and go back to account" onPress={backToDashboard} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>Cancel · Back to account</Text>
          </Pressable>
        </>
      }
    >
      <View testID="settings-columns" style={[styles.columns, { flexDirection: layout.wide ? 'row' : 'column', gap: layout.wide ? layout.gap : 0 }]}>
        <View style={[s.card, layout.wide && styles.column]}>
          <Text style={[s.label, styles.groupLabel]}>// NOTIFICATION STREAMS</Text>
          {NOTIFICATION_STREAMS.map((stream, index) => (
            <View key={stream.key} style={[styles.stream, index > 0 && styles.streamDivider]}>
              <View style={styles.streamCopy}>
                <Text style={styles.streamTitle}>{stream.title}</Text>
                <Text style={s.body}>{stream.description}</Text>
              </View>
              <ToggleSwitch testID={stream.key} label={stream.title} value={notifications[stream.key]} onValueChange={(value) => toggleStream(stream.key, value)} />
            </View>
          ))}
          <Text style={styles.footnote}>Essential security alerts and contractual notices are always sent by email, regardless of these preferences.</Text>
        </View>
        <View style={[s.card, layout.wide && styles.column]}>
          <Text style={[s.label, styles.groupLabel]}>// LOCALIZATION</Text>
          <Text style={styles.fieldLabel}>LANGUAGE</Text>
          <DropdownSelect testID="language-select" label="Language" value={language} options={languageOptions} onChange={setLanguage} />
          <Text style={styles.fieldLabel}>TIME ZONE</Text>
          <DropdownSelect testID="timezone-select" label="Time zone" value={timeZone} options={timeZoneOptions} onChange={setTimeZone} />
          <Text style={s.body}>Booking schedules use this time zone, including all date and time selections.</Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  columns: { alignItems: 'stretch' },
  column: { flex: 1, minWidth: 0 },
  groupLabel: { marginBottom: 12 },
  stream: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10 },
  streamDivider: { borderTopWidth: 1, borderColor: colors.border },
  streamCopy: { flex: 1 },
  streamTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  footnote: { color: colors.muted, fontSize: 11, lineHeight: 16, fontStyle: 'italic', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border },
  fieldLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 10, marginBottom: 6 },
  saveError: { color: colors.error, fontSize: 12, lineHeight: 16, marginBottom: 8, textAlign: 'center' },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  cancelText: { color: colors.muted, fontSize: 12 },
  pressed: { opacity: 0.7 },
});
