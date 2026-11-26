import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { AccessibilityProvider } from '../src/components/AccessibilityProvider';
import DocumentDossierScreen from '../src/screens/DocumentDossierScreen';
import DossierDeliveryScreen, { DossierSentLogScreen } from '../src/screens/DossierDeliveryScreen';
import { resetAccessibilityPreferences, setAccessibilityPreferences } from '../src/services/accessibilityService';
import { clearDossierDeliverySession, fetchDossierDelivery, fetchEventEmailHistory, recordDossierDelivery } from '../src/services/dossierDeliveryService';

jest.mock('@react-navigation/native', () => ({ ...jest.requireActual('@react-navigation/native'), useNavigation: () => ({ popToTop: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
global.IS_REACT_ACT_ENVIRONMENT = true;

const dossier = { id: 'event-1', event: 'Test show' };
const delivery = { id: 'mail-1', sentAt: '2026-11-18T12:00:00Z', recipients: [
  { type: 'To', email: 'to@example.com', status: 'Success' },
  { type: 'CC', email: 'cc@example.com', status: 'Opened' },
  { type: 'BCC', email: 'bcc@example.com', status: 'Bounced' },
] };
const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const button = (tree, label) => tree.root.findAll((node) => node.props.accessibilityLabel === label && node.props.onPress)[0];
beforeEach(() => {
  clearDossierDeliverySession();
  resetAccessibilityPreferences();
});

test('delivery updates are retained in the correct event history', async () => {
  recordDossierDelivery(dossier.id, delivery);
  recordDossierDelivery(dossier.id, { ...delivery, recipients: [{ ...delivery.recipients[0], status: 'Opened' }] });
  expect(await fetchEventEmailHistory('other-event')).toEqual([]);
  expect(await fetchEventEmailHistory(dossier.id)).toHaveLength(1);
  expect((await fetchDossierDelivery(dossier.id, delivery.id)).recipients[0].status).toBe('Opened');
});

test('confirmation fetches all recipients, opens event history and dismisses', async () => {
  recordDossierDelivery(dossier.id, delivery);
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  let tree;
  await act(async () => { tree = create(<DossierDeliveryScreen route={{ params: { dossier, deliveryId: delivery.id } }} navigation={navigation} />); });
  for (const value of ['Dossier sent', 'To', 'CC', 'BCC', 'to@example.com', 'cc@example.com', 'bcc@example.com', 'Success', 'Opened', 'Bounced']) expect(textOf(tree)).toContain(value);
  await act(async () => button(tree, 'View Sent Log').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('DossierSentLog', { dossier });
  await act(async () => button(tree, 'Dismiss').props.onPress());
  expect(navigation.goBack).toHaveBeenCalled();
  await act(async () => tree.unmount());
  await act(async () => { tree = create(<DossierSentLogScreen route={{ params: { dossier } }} navigation={navigation} />); });
  expect(textOf(tree)).toContain('bcc@example.com');
  await act(async () => tree.unmount());
});

test('delivery preview displays the reviewed subject, LAANC demo reference and attachments', async () => {
  const reviewedDelivery = {
    ...delivery,
    preview: true,
    subject: 'Test show flight documents',
    laancReference: 'DEMO-event-1',
    attachments: ['Flight plans (4 files)', 'Service agreement (1 file)'],
  };
  recordDossierDelivery(dossier.id, reviewedDelivery);
  let tree;
  await act(async () => {
    tree = create(
      <DossierDeliveryScreen
        route={{ params: { dossier, deliveryId: reviewedDelivery.id } }}
        navigation={{ navigate: jest.fn(), goBack: jest.fn() }}
      />,
    );
  });

  for (const value of ['Test show flight documents', 'DEMO-event-1', 'demo only', 'Flight plans (4 files)', 'Service agreement (1 file)']) {
    expect(textOf(tree)).toContain(value);
  }
  await act(async () => tree.unmount());
});

test('delivery details follow the accessibility text size and expose labels', async () => {
  recordDossierDelivery(dossier.id, delivery);
  setAccessibilityPreferences({ enabled: true, textSize: 'large' });
  let tree;
  await act(async () => {
    tree = create(
      <AccessibilityProvider>
        <DossierDeliveryScreen route={{ params: { dossier, deliveryId: delivery.id } }} navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />
      </AccessibilityProvider>,
    );
  });

  const heading = tree.root.find((node) => node.type === 'Text' && node.props.children === 'Test show');
  expect(StyleSheet.flatten(heading.props.style).fontSize).toBe(20); // 16px heading × 1.25
  expect(tree.root.findAll((node) => node.props.accessibilityRole === 'alert').length).toBeGreaterThan(0);
  for (const label of ['Refresh delivery status', 'View Sent Log', 'Dismiss']) {
    const action = button(tree, label);
    expect(action.props.accessibilityRole).toBe('button');
    expect(StyleSheet.flatten(action.props.style({ pressed: false })).minHeight).toBeGreaterThanOrEqual(56);
  }

  await act(async () => tree.unmount());
});

test('admin dossier opens a clearly labeled simulated preview', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => { tree = create(<DocumentDossierScreen route={{ params: { dossier, adminMode: true } }} navigation={navigation} />); });
  await act(async () => button(tree, 'Preview delivery status').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('DossierDelivery', { dossier, deliveryId: expect.any(String) });
  expect((await fetchEventEmailHistory(dossier.id))[0].preview).toBe(true);
  await act(async () => tree.unmount());
});