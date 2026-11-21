import React from 'react';
import { act, create } from 'react-test-renderer';
import PaymentReceiptAttachmentScreen from '../src/screens/PaymentReceiptAttachmentScreen';
import MaintenanceWarningScreen from '../src/screens/MaintenanceWarningScreen';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: false, assets: [{ name: 'receipt-neon-lights.pdf', size: 2048 }] })),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

function textOf(tree) {
  return tree.root.findAllByType('Text').map((node) => node.props.children).flat().join(' ').replace(/\s+/g, ' ').trim();
}

function navigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

test('receipt attachment flow shows missing state, file identity, dossier availability, and audit history', async () => {
  let tree;
  act(() => { tree = create(<PaymentReceiptAttachmentScreen navigation={navigation()} />); });
  expect(textOf(tree)).toContain('MISSING RECEIPT');
  expect(textOf(tree)).toContain('WAITING FOR RECEIPT');
  expect(textOf(tree)).toContain('AUDIT TRAIL');

  await act(async () => tree.root.findByProps({ testID: 'attach-receipt' }).props.onPress());
  expect(textOf(tree)).toContain('RECEIPT ATTACHED');
  expect(textOf(tree)).toContain('receipt-neon-lights.pdf');
  expect(textOf(tree)).toContain('READY FOR COMPILATION');
  expect(textOf(tree)).toContain('Receipt attached: receipt-neon-lights.pdf');
});

test('maintenance warning compares current hours with threshold and records follow-up status', async () => {
  let tree;
  act(() => { tree = create(<MaintenanceWarningScreen navigation={navigation()} />); });
  expect(textOf(tree)).toContain('PREVENTATIVE MAINTENANCE DUE');
  expect(textOf(tree)).toContain('SF-Q-004');
  expect(textOf(tree)).toContain('120.4 HRS');
  expect(textOf(tree)).toContain('120.0 HRS');
  expect(textOf(tree)).toContain('ACTION REQUIRED BY MAINTENANCE STAFF');

  await act(async () => tree.root.findByProps({ testID: 'maintenance-action' }).props.onPress());
  expect(textOf(tree)).toContain('SCHEDULED FOR SERVICE');
  expect(textOf(tree)).toContain('Maintenance service scheduled');
});
