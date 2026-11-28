import React from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import DocumentDossierScreen from '../src/screens/DocumentDossierScreen';
import PaymentReceiptScreen from '../src/screens/PaymentReceiptScreen';
import {
  buildReceiptPdf,
  clearPaymentReceiptsSession,
  fetchDossierReceipt,
  fetchReceiptAuditLog,
  formatReceiptAmount,
  removeDossierReceipt,
  replaceDossierReceipt,
} from '../src/services/paymentReceiptsService';

jest.mock('@react-navigation/native', () => ({ ...jest.requireActual('@react-navigation/native'), useNavigation: () => ({ popToTop: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  File: jest.fn().mockImplementation((dir, name) => ({ uri: `file:///${dir}/${name}`, write: jest.fn() })),
}));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(async () => true), shareAsync: jest.fn(async () => {}) }));
global.IS_REACT_ACT_ENVIRONMENT = true;

const dossier = { id: 'SKY-8902-A', event: 'Neon Lights Festival' };
const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat(Infinity).join(' ');
const button = (tree, label) => tree.root.findAll((node) => node.props.accessibilityLabel === label && node.props.onPress)[0];
const byTestId = (tree, id) => tree.root.findAll((node) => node.props.testID === id && node.props.onPress)[0];

async function render(navigation = { navigate: jest.fn(), goBack: jest.fn() }) {
  let tree;
  await act(async () => { tree = create(<PaymentReceiptScreen navigation={navigation} route={{ params: { dossier, adminMode: true } }} />); });
  return tree;
}

beforeEach(() => {
  clearPaymentReceiptsSession();
  DocumentPicker.getDocumentAsync.mockReset();
});

test('admin dossier opens the payment receipts page from the receipts card', async () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  let tree;
  await act(async () => { tree = create(<DocumentDossierScreen navigation={navigation} route={{ params: { dossier, adminMode: true } }} />); });
  await act(async () => button(tree, 'Open payment receipts').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('PaymentReceipt', { dossier, adminMode: true });
  await act(async () => tree.unmount());
});

test('shows the attached file and financial record', async () => {
  const tree = await render();
  const text = textOf(tree);
  for (const value of ['Staging Downpayment', 'TXN_SKY_99218_RECEIPT.pdf', 'Transaction ID', 'TXN_SKY_99218', '$12,450.00 USD', 'Wire Transfer', 'Sarah Chen (Client)']) {
    expect(text).toContain(value);
  }
  await act(async () => tree.unmount());
});

test('preview opens the receipt in-app and closes again', async () => {
  const tree = await render();
  await act(async () => byTestId(tree, 'preview-receipt').props.onPress());
  expect(tree.root.findAll((node) => node.props.testID === 'receipt-preview').length).toBeGreaterThan(0);
  await act(async () => byTestId(tree, 'close-preview').props.onPress());
  expect(tree.root.findAll((node) => node.props.testID === 'receipt-preview')).toHaveLength(0);
  await act(async () => tree.unmount());
});

test('remove asks for confirmation, detaches the receipt and is audited', async () => {
  const tree = await render();
  await act(async () => byTestId(tree, 'remove-receipt').props.onPress());
  expect(await fetchDossierReceipt(dossier.id)).not.toBeNull();
  await act(async () => byTestId(tree, 'remove-receipt-dialog-cancel').props.onPress());
  expect(await fetchDossierReceipt(dossier.id)).not.toBeNull();

  await act(async () => byTestId(tree, 'remove-receipt').props.onPress());
  await act(async () => byTestId(tree, 'remove-receipt-dialog-confirm').props.onPress());
  expect(await fetchDossierReceipt(dossier.id)).toBeNull();
  expect(textOf(tree)).toContain('No receipt attached');
  expect(textOf(tree)).toContain('Removed TXN_SKY_99218_RECEIPT.pdf');
  await act(async () => tree.unmount());
});

test('replace swaps the file and records the change in the audit log', async () => {
  DocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: false, assets: [{ name: 'NEW_RECEIPT.pdf', uri: 'file:///new.pdf' }] });
  const tree = await render();
  await act(async () => byTestId(tree, 'replace-receipt').props.onPress());
  expect((await fetchDossierReceipt(dossier.id)).fileName).toBe('NEW_RECEIPT.pdf');
  expect(textOf(tree)).toContain('Replaced TXN_SKY_99218_RECEIPT.pdf with NEW_RECEIPT.pdf');
  await act(async () => tree.unmount());
});

test('receipt PDF contains the receipt details and a valid cross-reference table', async () => {
  const receipt = await fetchDossierReceipt(dossier.id);
  const pdf = buildReceiptPdf({ ...receipt, title: 'Deposit (staging)' }, dossier);
  for (const value of ['PAYMENT RECEIPT', 'TXN_SKY_99218', '$12,450.00 USD', 'Wire Transfer', 'Sarah Chen \\(Client\\)', 'Deposit \\(staging\\)', 'SKY-8902-A']) {
    expect(pdf).toContain(value);
  }
  const xrefStart = Number(pdf.match(/startxref\n(\d+)/)[1]);
  expect(pdf.slice(xrefStart, xrefStart + 4)).toBe('xref');
  const offsets = [...pdf.slice(xrefStart).matchAll(/^(\d{10}) 00000 n $/gm)].map((match) => Number(match[1]));
  expect(offsets).toHaveLength(6);
  offsets.forEach((offset, index) => expect(pdf.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true));
  const [, length, body] = pdf.match(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/);
  expect(body.length).toBe(Number(length));
});

test('preview shows a fallback on native and a small close control', async () => {
  const tree = await render();
  await act(async () => byTestId(tree, 'preview-receipt').props.onPress());
  expect(tree.root.findAll((node) => node.props.testID === 'receipt-pdf-unavailable').length).toBeGreaterThan(0);
  expect(textOf(tree)).toContain('✕ CLOSE');
  await act(async () => tree.unmount());
});

test('audit log keeps inactive copies that can still be downloaded', async () => {
  Sharing.shareAsync.mockClear();
  DocumentPicker.getDocumentAsync
    .mockResolvedValueOnce({ canceled: false, assets: [{ name: 'FIRST.pdf', uri: 'file:///first.pdf' }] })
    .mockResolvedValueOnce({ canceled: false, assets: [{ name: 'SECOND.pdf', uri: 'file:///second.pdf' }] });
  const tree = await render();
  await act(async () => byTestId(tree, 'replace-receipt').props.onPress());
  await act(async () => byTestId(tree, 'replace-receipt').props.onPress());
  await act(async () => byTestId(tree, 'remove-receipt').props.onPress());
  await act(async () => byTestId(tree, 'remove-receipt-dialog-confirm').props.onPress());

  const log = await fetchReceiptAuditLog(dossier.id);
  expect(log.map((entry) => entry.archivedReceipt.fileName)).toEqual(['SECOND.pdf', 'FIRST.pdf', 'TXN_SKY_99218_RECEIPT.pdf']);
  expect(tree.root.findAll((node) => node.props.testID === 'archived-receipt' && node.props.style).length).toBeGreaterThanOrEqual(3);
  expect(textOf(tree)).toContain('ARCHIVED · NOT ACTIVE');

  // A picked file is shared from its own uri; the original placeholder is regenerated.
  await act(async () => byTestId(tree, `download-archived-${log[1].id}`).props.onPress());
  expect(Sharing.shareAsync).toHaveBeenLastCalledWith('file:///first.pdf', expect.objectContaining({ dialogTitle: 'FIRST.pdf' }));
  await act(async () => byTestId(tree, `download-archived-${log[2].id}`).props.onPress());
  expect(Sharing.shareAsync).toHaveBeenLastCalledWith('file:///cache/TXN_SKY_99218_RECEIPT.pdf', expect.objectContaining({ mimeType: 'application/pdf' }));
  await act(async () => tree.unmount());
});

test('tapping the receipt file card downloads the active PDF', async () => {
  Sharing.shareAsync.mockClear();
  const tree = await render();
  await act(async () => byTestId(tree, 'receipt-file').props.onPress());
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/TXN_SKY_99218_RECEIPT.pdf', expect.objectContaining({ dialogTitle: 'TXN_SKY_99218_RECEIPT.pdf' }));
  await act(async () => tree.unmount());
});

test('service keeps audit entries newest first and re-attaches after removal', async () => {
  await replaceDossierReceipt(dossier.id, { name: 'A.pdf' }, { actor: 'Tester', at: new Date('2026-11-01T00:00:00Z') });
  await removeDossierReceipt(dossier.id, { actor: 'Tester', at: new Date('2026-11-02T00:00:00Z') });
  await replaceDossierReceipt(dossier.id, { name: 'B.pdf' }, { at: new Date('2026-11-03T00:00:00Z') });
  const log = await fetchReceiptAuditLog(dossier.id);
  expect(log.map((entry) => entry.action)).toEqual(['REPLACED', 'REMOVED', 'REPLACED']);
  expect(log[0].previousFileName).toBeNull();
  expect(log[1].actor).toBe('Tester');
  expect(formatReceiptAmount(12450, 'USD')).toBe('$12,450.00 USD');
});
