import React from 'react';
import { Text, TextInput } from 'react-native';
import { act, create } from 'react-test-renderer';
import LaancDocumentReviewScreen from '../src/screens/LaancDocumentReviewScreen';
import DocumentDossierScreen from '../src/screens/DocumentDossierScreen';
import DossierShowSelectScreen from '../src/screens/DossierShowSelectScreen';
import { clearBookingSubmissions, requestBookingSlot } from '../src/services/bookingConflictService';
import { clearDossierDeliverySession, fetchEventEmailHistory } from '../src/services/dossierDeliveryService';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), popToTop: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

global.IS_REACT_ACT_ENVIRONMENT = true;

const dossier = { id: 'SKY-8902-A', event: 'Neon Lights Festival' };
const booking = {
  id: 'booking-1',
  eventName: dossier.event,
  venueName: 'Harbor Airfield',
  streetAddress: '100 Runway Road',
  city: 'Los Angeles',
  postalCode: '90045',
};
const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const press = async (tree, label) => {
  const control = tree.root.find((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');
  await act(async () => control.props.onPress());
  return control;
};
const previewButtons = (tree) => tree.root.findAll((node) => (
  node.props.accessibilityLabel === 'Create delivery preview (no email sent)'
  && node.props.accessibilityRole === 'button'
  && typeof node.props.onPress === 'function'
));

beforeEach(() => {
  clearDossierDeliverySession();
  clearBookingSubmissions();
});

test('admin dossier opens the LAANC and delivery review for the selected event', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<DocumentDossierScreen route={{ params: { dossier, adminMode: true } }} navigation={navigation} />);
  });

  await press(tree, 'Review LAANC & delivery');
  expect(navigation.navigate).toHaveBeenCalledWith('LaancDocumentReview', { dossier });
  await act(async () => tree.unmount());
});

test('review validates request recipient and attachments before creating a preview', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<LaancDocumentReviewScreen route={{ params: { dossier, booking } }} navigation={navigation} />);
  });

  expect(textOf(tree)).toContain('kenneth.elliott@csus.edu');
  expect(textOf(tree)).toContain('LAANC requirement: undetermined');
  expect(textOf(tree)).toContain('100 Runway Road');
  expect(textOf(tree)).toContain('FAA flight plans');
  const subject = tree.root.findByType(TextInput);
  await act(async () => subject.props.onChangeText('Neon Lights Festival - LAANC package'));
  await press(tree, 'Validate recipient & documents');
  expect(textOf(tree)).toContain('LOCAL PACKAGE CHECKS PASSED');
  expect(textOf(tree)).toContain('LAANC requirement still needs official FAA airspace verification.');

  expect(previewButtons(tree)[0].props.disabled).toBe(true);
  await press(tree, 'Confirm LAANC requirement verified with an official FAA source');
  await press(tree, 'Confirm recipient, subject, and attachments reviewed');
  const previewButton = previewButtons(tree)[0];
  expect(previewButton.props.disabled).toBe(false);
  await act(async () => previewButton.props.onPress());

  const history = await fetchEventEmailHistory(dossier.id);
  expect(history).toHaveLength(1);
  expect(history[0]).toMatchObject({
    preview: true,
    subject: 'Neon Lights Festival - LAANC package',
    location: 'Harbor Airfield, 100 Runway Road, Los Angeles 90045',
    laancAssessment: 'Undetermined - verify in an FAA-approved LAANC service',
    recipients: [{ type: 'To', email: 'kenneth.elliott@csus.edu', status: 'Preview only' }],
  });
  expect(history[0].attachments).toEqual(expect.arrayContaining([
    'FAA flight plans (4 files)',
    'Drone show service agreement (1 file)',
  ]));
  expect(navigation.navigate).toHaveBeenCalledWith('DossierDelivery', { dossier, deliveryId: history[0].id });
  await act(async () => tree.unmount());
});

test('validation blocks pending attachments and requires a fresh review after edits', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<LaancDocumentReviewScreen route={{ params: { dossier, booking } }} navigation={navigation} />);
  });

  await press(tree, 'Liability waivers attachment');
  await press(tree, 'Validate recipient & documents');
  expect(textOf(tree)).toContain('Pending documents must be resolved or excluded.');
  expect(previewButtons(tree)).toHaveLength(0);

  await press(tree, 'Liability waivers attachment');
  await press(tree, 'Validate recipient & documents');
  expect(previewButtons(tree)).toHaveLength(1);

  const subject = tree.root.findByType(TextInput);
  await act(async () => subject.props.onChangeText(''));
  expect(previewButtons(tree)).toHaveLength(0);
  expect(navigation.navigate).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});

test('location screening blocks review when no saved booking address is linked', async () => {
  let tree;
  await act(async () => {
    tree = create(<LaancDocumentReviewScreen route={{ params: { dossier } }} navigation={{ navigate: jest.fn() }} />);
  });

  expect(textOf(tree)).toContain('No submitted booking with a venue address is linked to this dossier.');
  expect(textOf(tree)).toContain('LAANC requirement: undetermined');
  await press(tree, 'Validate recipient & documents');
  expect(textOf(tree)).toContain('No complete venue address is linked to this event.');
  expect(tree.root.findAll((node) => node.props.testID === 'create-delivery-preview' && node.props.accessibilityRole === 'button')).toHaveLength(0);
  await act(async () => tree.unmount());
});

test('admin show selection passes the matching submitted booking address into its dossier', async () => {
  const savedBooking = {
    id: 'booking-site-check',
    eventName: dossier.event,
    venueName: booking.venueName,
    streetAddress: booking.streetAddress,
    city: booking.city,
    postalCode: booking.postalCode,
    date: '2026-12-01',
    timeSlot: '8:00 PM',
  };
  requestBookingSlot(savedBooking);
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<DossierShowSelectScreen navigation={navigation} adminMode />);
  });

  await press(tree, `Review documents for ${dossier.event}`);
  const [route, params] = navigation.navigate.mock.calls[0];
  expect(route).toBe('DocumentDossier');
  expect(params.dossier.booking).toMatchObject({
    eventName: dossier.event,
    streetAddress: booking.streetAddress,
    city: booking.city,
    postalCode: booking.postalCode,
  });
  await act(async () => tree.unmount());
});
