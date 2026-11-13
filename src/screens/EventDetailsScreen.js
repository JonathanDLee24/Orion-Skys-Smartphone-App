import React, { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import EmployeeIcon from '../components/EmployeeIcon';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { getEventDetails } from '../services/eventDetailsService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

function DetailRow({ icon, title, detail, children }) {
  return (
    <View style={styles.detailRow}>
      <EmployeeIcon type={icon} color={colors.accent} size={21} />
      <View style={styles.detailCopy}>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailDetail}>{detail}</Text>
        {children}
      </View>
    </View>
  );
}

function ManageRow({ icon, title, description, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.manageRow, pressed && styles.pressed]}
    >
      <EmployeeIcon type={icon} color={colors.accent} size={20} />
      <View style={styles.manageCopy}>
        <Text style={styles.manageTitle}>{title}</Text>
        <Text style={styles.manageDescription}>{description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function EventDetailsScreen({ route, navigation }) {
  const s = useScreenStyles();
  const layout = useResponsiveLayout();
  const event = getEventDetails(route?.params?.submission || route?.params?.event);
  const [selectedFile, setSelectedFile] = useState(null);

  async function chooseBrief() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: '*/*',
    });
    if (!result.canceled && result.assets?.[0]) setSelectedFile(result.assets[0]);
  }

  function openAction(title, description) {
    navigation.navigate('EventAction', { title, description, event });
  }

  return (
    <ScreenLayout
      label={`EVENT // ${event.id}`}
      caption="CLIENT OPERATIONS / EVENTS"
      title={event.title}
      headerBadge={`● ${event.status}`}
      headerTone={event.status === 'CANCELLED' ? 'danger' : 'success'}
      onLogoPress={() => navigation.navigate('Welcome')}
      onBack={() => navigation.goBack()}
      backLabel="BACK"
      showProgress={false}
      onAccount={() => navigation.navigate('Dashboard')}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        <View testID="event-details-card" style={[s.card, styles.detailsCard]}>
          <View style={styles.cardHeader}>
            <Text style={[s.label, styles.sectionLabel]}>SHOW DETAILS</Text>
            <Text style={styles.confirmed}>• {event.status}</Text>
          </View>
          <DetailRow icon="calendar" title={`${event.date} · ${event.time}`} detail={`${event.timeZone} · ${event.duration}`} />
          <DetailRow icon="pin" title={event.venue} detail={event.address} />
          <DetailRow icon="document" title={`${event.droneCount} drones · ${event.choreography}`} detail={`Client: ${event.client}`} />
        </View>

        <View testID="brief-warning" style={styles.warning}>
          <EmployeeIcon type="document" color={colors.gold} size={23} />
          <View style={styles.warningCopy}>
            <Text style={styles.warningTitle}>Your show brief is still needed</Text>
            <Text style={styles.warningText}>Upload logos and creative direction by {event.briefDue}.</Text>
          </View>
        </View>

        <PrimaryButton
          testID="upload-show-brief"
          title={selectedFile ? 'Replace show brief' : 'Upload show brief'}
          onPress={chooseBrief}
          leadingIcon={<Text style={styles.uploadIcon}>↑</Text>}
        />
        {selectedFile && (
          <Text testID="selected-brief" style={styles.selectedFile}>SELECTED // {selectedFile.name}</Text>
        )}

        <Text style={[s.label, styles.manageLabel]}>MANAGE YOUR EVENT</Text>
        <View testID="event-management" style={styles.manageList}>
          <ManageRow icon="calendar" title="Request date or time change" description="Changes require operations review" onPress={() => openAction('Request date or time change', 'Changes require operations review.')} />
          <ManageRow icon="pin" title="Update venue details" description="Site changes may require a new review" onPress={() => openAction('Update venue details', 'Site changes may require a new review.')} />
          <ManageRow icon="document" title="Contracts & documents" description="View your signed show agreement" onPress={() => openAction('Contracts & documents', 'View your signed show agreement.')} />
        </View>

        <View style={styles.footerLinks}>
          <Pressable accessibilityRole="button" accessibilityLabel="Message show coordinator" onPress={() => openAction('Message show coordinator', 'Send a message to your show coordinator.')} style={({ pressed }) => pressed && styles.pressed}>
            <Text style={styles.messageLink}>Message show coordinator</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Request cancellation" onPress={() => navigation.navigate('BookingManage', { submission: route?.params?.submission })} style={({ pressed }) => pressed && styles.pressed}>
            <Text style={styles.cancelLink}>Request cancellation</Text>
          </Pressable>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  wideContent: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  detailsCard: { borderColor: colors.accent },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sectionLabel: { color: colors.accent, marginBottom: 0 },
  confirmed: { color: colors.green, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  detailCopy: { flex: 1 },
  detailTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  detailDetail: { color: colors.muted, fontFamily: monoFont, fontSize: 10, lineHeight: 16 },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#171200', borderWidth: 1, borderColor: '#6B5200', borderRadius: 7, padding: 14, marginBottom: 14 },
  warningCopy: { flex: 1 },
  warningTitle: { color: colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  warningText: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  uploadIcon: { color: colors.background, fontSize: 20, fontWeight: '800', lineHeight: 20 },
  selectedFile: { color: colors.green, fontFamily: monoFont, fontSize: 10, marginTop: 10, marginBottom: 3 },
  manageLabel: { color: colors.accent, marginTop: 26, marginBottom: 8 },
  manageList: { borderTopWidth: 1, borderColor: colors.border },
  manageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 70, borderBottomWidth: 1, borderColor: colors.border },
  manageCopy: { flex: 1 },
  manageTitle: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  manageDescription: { color: colors.muted, fontSize: 11 },
  chevron: { color: colors.accent, fontSize: 25, lineHeight: 25 },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 24, paddingBottom: 8 },
  messageLink: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  cancelLink: { color: colors.error, fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
