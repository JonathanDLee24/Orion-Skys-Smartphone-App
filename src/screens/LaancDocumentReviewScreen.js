import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Text from '../components/AppText';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { mockRequestContact } from '../mockData';
import { recordDossierDelivery } from '../services/dossierDeliveryService';
import { colors, monoFont, useResponsiveLayout } from '../theme';

const ATTACHMENTS = [
  { id: 'flight-plans', name: 'FAA flight plans', files: 4, status: 'Ready' },
  { id: 'agreement', name: 'Drone show service agreement', files: 1, status: 'Ready' },
  { id: 'receipts', name: 'Payment receipts', files: 2, status: 'Ready' },
  { id: 'waivers', name: 'Liability waivers', files: 12, status: 'Pending' },
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LaancDocumentReviewScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const s = useScreenStyles();
  const dossier = route?.params?.dossier;
  const booking = route?.params?.booking || dossier?.booking;
  const contact = dossier?.requestContact || mockRequestContact;
  const siteAddress = booking
    ? [booking.venueName, booking.streetAddress, [booking.city, booking.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    : '';
  const hasLocation = Boolean(booking?.streetAddress?.trim() && booking?.city?.trim() && booking?.postalCode?.trim());
  const [subject, setSubject] = useState(`LAANC and flight documents - ${dossier?.event || 'Drone show'}`);
  const [selectedIds, setSelectedIds] = useState(() => ATTACHMENTS.filter((item) => item.status === 'Ready').map((item) => item.id));
  const [checks, setChecks] = useState(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [laancVerified, setLaancVerified] = useState(false);

  useEffect(() => {
    setSubject(`LAANC and flight documents - ${dossier?.event || 'Drone show'}`);
    setSelectedIds(ATTACHMENTS.filter((item) => item.status === 'Ready').map((item) => item.id));
    setChecks(null);
    setReviewConfirmed(false);
    setLaancVerified(false);
  }, [dossier?.id, dossier?.event, contact?.email, booking?.streetAddress, booking?.city, booking?.postalCode]);

  function invalidateReview() {
    setChecks(null);
    setReviewConfirmed(false);
    setLaancVerified(false);
  }

  function toggleAttachment(id) {
    setSelectedIds((previous) => (
      previous.includes(id) ? previous.filter((selectedId) => selectedId !== id) : [...previous, id]
    ));
    invalidateReview();
  }

  function validatePackage() {
    const selected = ATTACHMENTS.filter((item) => selectedIds.includes(item.id));
    const nextChecks = [
      {
        label: 'Event booking location',
        passed: hasLocation,
        detail: hasLocation
          ? 'Using the venue address saved with this event booking.'
          : 'No complete venue address is linked to this event. Select its submitted booking first.',
      },
      {
        label: 'Event requester recipient',
        passed: Boolean(dossier?.id && dossier?.event && contact?.name && isValidEmail(contact?.email)),
        detail: 'Recipient is taken from the event request contact.',
      },
      {
        label: 'Email subject',
        passed: subject.trim().length > 0,
        detail: 'A subject is required before preparing the package.',
      },
      {
        label: 'Attachments selected',
        passed: selected.length > 0,
        detail: 'Select at least one document to include.',
      },
      {
        label: 'Attachment readiness',
        passed: selected.length > 0 && selected.every((item) => item.status === 'Ready'),
        detail: 'Pending documents must be resolved or excluded.',
      },
    ];
    setChecks(nextChecks);
    setReviewConfirmed(false);
  }

  function createPreview() {
    const selected = ATTACHMENTS.filter((item) => selectedIds.includes(item.id));
    const delivery = recordDossierDelivery(dossier.id, {
      id: `laanc-preview-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sentAt: new Date().toISOString(),
      preview: true,
      subject: subject.trim(),
      location: siteAddress,
      laancAssessment: 'Undetermined - verify in an FAA-approved LAANC service',
      attachments: selected.map((item) => `${item.name} (${item.files} ${item.files === 1 ? 'file' : 'files'})`),
      recipients: [{ type: 'To', email: contact.email, status: 'Preview only' }],
    });
    navigation.navigate('DossierDelivery', { dossier, deliveryId: delivery.id });
  }

  const selectedCount = selectedIds.length;
  const validationPassed = checks !== null && checks.every((check) => check.passed);

  return (
    <ScreenLayout
      caption="ADMIN OPERATIONS / LAANC"
      label={`DOSSIER: ${dossier?.id || 'UNASSIGNED'}`}
      title="Review flight documents"
      headerBadge="DEMO ONLY"
      headerTone="gold"
      showProgress={false}
      onLogoPress={() => navigation.navigate('AdminDashboard')}
      onBack={() => navigation.goBack()}
      backLabel="Back to dossier"
      footer={(
        <View style={styles.footer}>
          <PrimaryButton title="Validate recipient & documents" onPress={validatePackage} testID="validate-laanc-package" />
          {validationPassed && (
            <>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Confirm LAANC requirement verified with an official FAA source"
                accessibilityState={{ checked: laancVerified }}
                onPress={() => setLaancVerified((value) => !value)}
                style={styles.confirm}
              >
                <View style={[styles.checkbox, laancVerified && styles.checkboxChecked]}>
                  {laancVerified && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={s.body}>I verified the LAANC requirement for this location in an official FAA-approved source.</Text>
              </Pressable>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Confirm recipient, subject, and attachments reviewed"
                accessibilityState={{ checked: reviewConfirmed }}
                onPress={() => setReviewConfirmed((value) => !value)}
                style={styles.confirm}
              >
                <View style={[styles.checkbox, reviewConfirmed && styles.checkboxChecked]}>
                  {reviewConfirmed && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={s.body}>I reviewed the recipient, subject, and included documents.</Text>
              </Pressable>
              <PrimaryButton
                title="Create delivery preview (no email sent)"
                disabled={!reviewConfirmed || !laancVerified}
                onPress={createPreview}
                testID="create-delivery-preview"
              />
            </>
          )}
        </View>
      )}
    >
      <View style={[styles.content, layout.wide && styles.wideContent]}>
        <View style={styles.demoNotice} accessibilityRole="alert">
          <Text style={styles.demoTitle}>LAANC requirement: undetermined</Text>
          <Text style={styles.demoCopy}>The venue address is shown below, but this app has no FAA airspace data connection. It cannot say whether LAANC is required. Check the location in an FAA-approved LAANC service before proceeding. No authorization or email is sent here.</Text>
        </View>

        <View style={[s.card, styles.sectionCard]}>
          <Text style={[s.label, styles.sectionLabel]}>// EVENT REQUEST</Text>
          <Text style={styles.eventTitle}>{dossier?.event || 'Drone show'}</Text>
          <Text style={styles.metadata}>DOSSIER {dossier?.id || 'UNASSIGNED'}</Text>
          <View style={styles.rule} />
          <Text style={styles.fieldLabel}>VENUE LOCATION FROM SUBMITTED BOOKING</Text>
          <Text accessibilityLabel="Event venue location" style={styles.locationValue}>
            {siteAddress || 'No submitted booking with a venue address is linked to this dossier.'}
          </Text>
          <Text style={styles.helper}>
            {hasLocation ? 'Address provided for screening. LAANC requirement still needs official FAA airspace verification.' : 'A complete saved booking address is required before package review can pass.'}
          </Text>
        </View>

        <View style={[s.card, styles.sectionCard]}>
          <Text style={[s.label, styles.sectionLabel]}>// RECIPIENTS</Text>
          <View style={styles.recipientRow}>
            <View style={styles.recipientTag}><Text style={styles.recipientTagText}>TO</Text></View>
            <View style={styles.recipientDetails}>
              <Text style={styles.recipientName}>{contact?.name || 'Missing request contact'}</Text>
              {contact?.organization ? <Text style={styles.helper}>{contact.organization}</Text> : null}
              <Text accessibilityLabel="Client recipient email" style={styles.recipientEmail}>{contact?.email || 'No email on event request'}</Text>
              <Text style={styles.helper}>Event request contact</Text>
            </View>
          </View>
        </View>

        <View style={[s.card, styles.sectionCard]}>
          <Text style={[s.label, styles.sectionLabel]}>// SUBJECT</Text>
          <TextInput
            accessibilityLabel="Email subject"
            value={subject}
            onChangeText={(value) => {
              setSubject(value);
              invalidateReview();
            }}
            placeholder="Enter an email subject"
            placeholderTextColor={colors.muted}
            style={styles.subjectInput}
          />
        </View>

        <View style={[s.card, styles.sectionCard]}>
          <View style={styles.attachmentHeading}>
            <Text style={[s.label, styles.sectionLabel]}>// ATTACHMENTS</Text>
            <Text style={styles.metadata}>{selectedCount} SELECTED</Text>
          </View>
          {ATTACHMENTS.map((attachment) => {
            const selected = selectedIds.includes(attachment.id);
            const ready = attachment.status === 'Ready';
            return (
              <Pressable
                key={attachment.id}
                accessibilityRole="checkbox"
                accessibilityLabel={`${attachment.name} attachment`}
                accessibilityState={{ checked: selected }}
                onPress={() => toggleAttachment(attachment.id)}
                style={({ pressed }) => [styles.attachmentRow, pressed && styles.pressed]}
              >
                <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                  {selected && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <View style={styles.attachmentDetails}>
                  <Text style={styles.attachmentName}>{attachment.name}</Text>
                  <Text style={styles.helper}>{attachment.files} {attachment.files === 1 ? 'file' : 'files'}</Text>
                </View>
                <Text style={[styles.attachmentStatus, ready ? styles.ready : styles.pending]}>{attachment.status.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>

        {checks && (
          <View testID="package-validation" accessibilityRole="alert" style={[styles.validationCard, validationPassed ? styles.validationPassed : styles.validationFailed]}>
            <Text style={[styles.validationTitle, validationPassed ? styles.ready : styles.pending]}>
              {validationPassed ? 'LOCAL PACKAGE CHECKS PASSED' : 'REVIEW REQUIRED'}
            </Text>
            {checks.map((check) => (
              <View key={check.label} style={styles.checkRow}>
                <Text style={[styles.checkMark, check.passed ? styles.ready : styles.pending]}>{check.passed ? 'PASS' : 'FIX'}</Text>
                <View style={styles.checkCopy}>
                  <Text style={styles.attachmentName}>{check.label}</Text>
                  <Text style={styles.helper}>{check.detail}</Text>
                </View>
              </View>
            ))}
            {validationPassed && <Text style={styles.demoCopy}>Package review is complete for this demo only. It is not LAANC approval.</Text>}
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingBottom: 24 },
  wideContent: { maxWidth: 900 },
  footer: { gap: 10 },
  demoNotice: { padding: 14, marginBottom: 14, borderRadius: 6, borderWidth: 1, borderColor: colors.gold, backgroundColor: '#231700' },
  demoTitle: { color: colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 5 },
  demoCopy: { color: colors.text, fontSize: 12, lineHeight: 18 },
  sectionCard: { marginBottom: 12 },
  sectionLabel: { marginBottom: 12 },
  eventTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 5 },
  metadata: { color: colors.muted, fontFamily: monoFont, fontSize: 10, letterSpacing: 0.6 },
  rule: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  fieldLabel: { color: colors.muted, fontFamily: monoFont, fontSize: 9, marginBottom: 5 },
  locationValue: { color: colors.text, fontSize: 14, lineHeight: 20, marginBottom: 5 },
  helper: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  recipientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  recipientTag: { minWidth: 42, borderRadius: 4, backgroundColor: colors.accentTint, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  recipientTagText: { color: colors.accent, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  recipientDetails: { flex: 1, gap: 3 },
  recipientName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  recipientEmail: { color: colors.text, fontSize: 13 },
  subjectInput: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 5, backgroundColor: colors.field, color: colors.text, paddingHorizontal: 12, fontSize: 14 },
  attachmentHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 58, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 8 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: colors.muted, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkboxMark: { color: colors.background, fontSize: 15, fontWeight: '800', lineHeight: 18 },
  attachmentDetails: { flex: 1, gap: 2 },
  attachmentName: { color: colors.text, fontSize: 12, fontWeight: '600' },
  attachmentStatus: { fontFamily: monoFont, fontSize: 9, fontWeight: '700' },
  ready: { color: colors.green },
  pending: { color: colors.gold },
  validationCard: { borderWidth: 1, borderRadius: 6, padding: 14, marginBottom: 8 },
  validationPassed: { borderColor: colors.green, backgroundColor: '#04241C' },
  validationFailed: { borderColor: colors.gold, backgroundColor: '#231700' },
  validationTitle: { fontFamily: monoFont, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  checkMark: { fontFamily: monoFont, fontSize: 9, fontWeight: '700', minWidth: 34, paddingTop: 2 },
  checkCopy: { flex: 1, gap: 2 },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 4 },
  pressed: { opacity: 0.72 },
});
