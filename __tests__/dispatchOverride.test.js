import React from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import DispatchOverrideScreen from '../src/screens/DispatchOverrideScreen';
import DossierDeliveryScreen from '../src/screens/DossierDeliveryScreen';
import {
  clearDossierDeliverySession,
  fetchDossierDelivery,
  fetchEventAuditLog,
  isValidEmail,
  recordDossierDelivery,
  resendDossierOverride,
  validateDispatchOverride,
} from '../src/services/dossierDeliveryService';

jest.mock('@react-navigation/native', () => ({ ...jest.requireActual('@react-navigation/native'), useNavigation: () => ({ popToTop: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
global.IS_REACT_ACT_ENVIRONMENT = true;

const dossier = { id: 'event-1', event: 'Test show' };
const delivery = { id: 'mail-1', sentAt: '2026-11-18T12:00:00Z', preview: true, recipients: [
  { type: 'To', email: 'to@example.com', status: 'Success' },
  { type: 'CC', email: 'cc@example.com', status: 'Opened' },
  { type: 'BCC', email: 'bcc@example.com', status: 'Bounced' },
] };
const BOUNCED = 2;
const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat(Infinity).join(' ');
const pressable = (tree, id) => tree.root.findAll((node) => node.props.testID === id && node.props.onPress)[0];
const input = (tree, id) => tree.root.findAll((node) => node.props.testID === id && node.props.onChangeText)[0];
const has = (tree, id) => tree.root.findAll((node) => node.props.testID === id).length > 0;

async function renderOverride(navigation) {
  let tree;
  await act(async () => {
    tree = create(<DispatchOverrideScreen navigation={navigation} route={{ params: { dossier, deliveryId: delivery.id, recipientIndex: BOUNCED } }} />);
  });
  return tree;
}

beforeEach(() => {
  clearDossierDeliverySession();
  recordDossierDelivery(dossier.id, delivery);
});

test('email and notes validation', () => {
  expect(isValidEmail('name@example.com')).toBe(true);
  for (const bad of ['', 'name', 'name@', 'name@example', 'na me@example.com']) expect(isValidEmail(bad)).toBe(false);
  expect(validateDispatchOverride({ email: 'bad', reason: 'bounced', notes: '' })).toEqual({
    email: expect.any(String), notes: expect.any(String),
  });
  expect(validateDispatchOverride({ email: 'bcc@example.com', reason: 'bounced', notes: 'Long enough note', previousEmail: 'BCC@example.com', previousFailed: true }).email).toMatch(/different/);
  expect(validateDispatchOverride({ email: 'to@example.com', reason: 'resendRequest', notes: 'Long enough note', previousEmail: 'to@example.com', previousFailed: false })).toEqual({});
  expect(validateDispatchOverride({ email: 'new@example.com', reason: 'nope', notes: 'Long enough note' }).reason).toBeDefined();
  expect(validateDispatchOverride({ email: 'new@example.com', reason: 'bounced', notes: 'Long enough note' })).toEqual({});
});

test('delivery details offers a resend on every recipient and opens the override screen', async () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  let tree;
  await act(async () => { tree = create(<DossierDeliveryScreen route={{ params: { dossier, deliveryId: delivery.id } }} navigation={navigation} />); });
  for (const index of [0, 1, BOUNCED]) expect(has(tree, `override-recipient-${index}`)).toBe(true);
  expect(textOf(tree)).toContain('OVERRIDE & RESEND');
  expect(textOf(tree)).toContain('RESEND');
  expect(textOf(tree)).toContain('No overrides have been recorded');
  await act(async () => pressable(tree, 'override-recipient-0').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('DispatchOverride', { dossier, deliveryId: delivery.id, recipientIndex: 0 });
  await act(async () => pressable(tree, `override-recipient-${BOUNCED}`).props.onPress());
  expect(navigation.navigate).toHaveBeenLastCalledWith('DispatchOverride', { dossier, deliveryId: delivery.id, recipientIndex: BOUNCED });
  await act(async () => tree.unmount());
});

test('a working recipient is pre-filled and can be re-sent to the same address', async () => {
  const navigation = { goBack: jest.fn(), popTo: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<DispatchOverrideScreen navigation={navigation} route={{ params: { dossier, deliveryId: delivery.id, recipientIndex: 0 } }} />);
  });
  expect(textOf(tree)).toContain('CURRENT RECIPIENT');
  expect(input(tree, 'override-email').props.value).toBe('to@example.com');
  await act(async () => input(tree, 'override-notes').props.onChangeText('Client deleted the original email.'));
  await act(async () => pressable(tree, 'send-override').props.onPress());

  const [entry] = await fetchEventAuditLog(dossier.id, delivery.id);
  expect(entry).toMatchObject({ reason: 'resendRequest', recipientType: 'To', previousRecipient: 'to@example.com', newRecipient: 'to@example.com' });
  const updated = await fetchDossierDelivery(dossier.id, delivery.id);
  expect(updated.recipients[0]).toMatchObject({ email: 'to@example.com', status: 'Resent' });
  expect(updated.recipients[0].replacedEmail).toBeUndefined();
  expect(navigation.popTo).toHaveBeenCalled();
  await act(async () => tree.unmount());
});

test('invalid input shows errors and sends nothing', async () => {
  const navigation = { goBack: jest.fn(), popTo: jest.fn() };
  const tree = await renderOverride(navigation);
  expect(textOf(tree)).toContain('bcc@example.com');
  await act(async () => input(tree, 'override-email').props.onChangeText('not-an-email'));
  await act(async () => pressable(tree, 'send-override').props.onPress());
  expect(has(tree, 'override-email-error')).toBe(true);
  expect(has(tree, 'override-notes-error')).toBe(true);
  expect(navigation.popTo).not.toHaveBeenCalled();
  expect(await fetchEventAuditLog(dossier.id)).toEqual([]);
  await act(async () => tree.unmount());
});

test('Cancel Bypass closes the screen without sending', async () => {
  const navigation = { goBack: jest.fn(), popTo: jest.fn() };
  const tree = await renderOverride(navigation);
  await act(async () => input(tree, 'override-email').props.onChangeText('new@example.com'));
  await act(async () => input(tree, 'override-notes').props.onChangeText('Client confirmed a new address.'));
  await act(async () => pressable(tree, 'cancel-bypass').props.onPress());
  expect(navigation.goBack).toHaveBeenCalled();
  expect(navigation.popTo).not.toHaveBeenCalled();
  expect((await fetchDossierDelivery(dossier.id, delivery.id)).recipients[BOUNCED].email).toBe('bcc@example.com');
  expect(await fetchEventAuditLog(dossier.id)).toEqual([]);
  await act(async () => tree.unmount());
});

test('re-sending replaces the bounced address and records the audit entry', async () => {
  const navigation = { goBack: jest.fn(), popTo: jest.fn() };
  const tree = await renderOverride(navigation);
  await act(async () => input(tree, 'override-email').props.onChangeText(' new@example.com '));
  await act(async () => input(tree, 'override-notes').props.onChangeText('Archive mailbox was retired last week.'));
  await act(async () => pressable(tree, 'send-override').props.onPress());

  const [entry] = await fetchEventAuditLog(dossier.id, delivery.id);
  expect(entry).toMatchObject({
    action: 'DISPATCH_OVERRIDE', admin: 'Admin', reason: 'bounced', notes: 'Archive mailbox was retired last week.',
    recipientType: 'BCC', previousRecipient: 'bcc@example.com', newRecipient: 'new@example.com', deliveryId: delivery.id,
  });
  expect(Number.isNaN(Date.parse(entry.at))).toBe(false);
  expect(navigation.popTo).toHaveBeenCalledWith('DossierDelivery', { dossier, deliveryId: delivery.id, overrideId: entry.id });

  const updated = await fetchDossierDelivery(dossier.id, delivery.id);
  expect(updated.recipients.map((recipient) => recipient.email)).toEqual(['to@example.com', 'cc@example.com', 'new@example.com']);
  expect(updated.recipients[BOUNCED]).toMatchObject({ status: 'Resent', replacedEmail: 'bcc@example.com' });
  await act(async () => tree.unmount());
});

test('delivery details shows the audit log after an override', async () => {
  await resendDossierOverride(dossier.id, delivery.id, { recipientIndex: BOUNCED, email: 'new@example.com', reason: 'clientRequest', notes: 'Client asked for a new inbox.' });
  let tree;
  await act(async () => { tree = create(<DossierDeliveryScreen route={{ params: { dossier, deliveryId: delivery.id } }} navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />); });
  const text = textOf(tree);
  for (const value of ['DISPATCH OVERRIDE', 'bcc@example.com', 'new@example.com', 'CLIENT REQUESTED A NEW ADDRESS', 'Client asked for a new inbox.', 'Resent']) {
    expect(text).toContain(value);
  }
  expect(text).toMatch(/BY\s+ADMIN/);
  // The re-sent recipient can be re-sent again.
  expect(has(tree, `override-recipient-${BOUNCED}`)).toBe(true);
  await act(async () => tree.unmount());
});

test('service re-sends to any recipient but a failed one needs a new address', async () => {
  await expect(resendDossierOverride(dossier.id, delivery.id, { recipientIndex: BOUNCED, email: 'bcc@example.com', reason: 'bounced', notes: 'Long enough note' }))
    .rejects.toThrow(/different/);
  await resendDossierOverride(dossier.id, delivery.id, { recipientIndex: 1, email: 'ops2@example.com', reason: 'wrongRecipient', notes: 'Operations moved inboxes.' });
  let updated = await fetchDossierDelivery(dossier.id, delivery.id);
  expect(updated.recipients[1]).toMatchObject({ email: 'ops2@example.com', status: 'Resent', replacedEmail: 'cc@example.com' });

  // A later resend keeps the original replaced address.
  await resendDossierOverride(dossier.id, delivery.id, { recipientIndex: 1, email: 'ops3@example.com', reason: 'wrongRecipient', notes: 'Second inbox change.' });
  updated = await fetchDossierDelivery(dossier.id, delivery.id);
  expect(updated.recipients[1]).toMatchObject({ email: 'ops3@example.com', replacedEmail: 'cc@example.com' });
  expect(await fetchEventAuditLog(dossier.id, delivery.id)).toHaveLength(2);
  expect(await resendDossierOverride(dossier.id, delivery.id, { recipientIndex: 9, email: 'x@example.com', reason: 'other', notes: 'Long enough note' }).catch((err) => err.message))
    .toMatch(/not found/);
});
