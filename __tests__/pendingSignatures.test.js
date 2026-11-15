import React from 'react';
import { act, create } from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import PendingSignaturesScreen from '../src/screens/PendingSignaturesScreen';
import ShowAuthorizationScreen from '../src/screens/ShowAuthorizationScreen';
import { DEMO_EVENTS } from '../src/services/eventFeedService';
import {
  getOverallSignatureStatus,
  REQUIRED_SIGNERS,
  SIGNATURE_STATUS,
} from '../src/services/pendingSignaturesService';
import { colors } from '../src/theme';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const submission = DEMO_EVENTS[0];
const [sarah, marcus, evelyn] = REQUIRED_SIGNERS;
const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const pressable = (tree, testID) => tree.root.find((node) => node.props.testID === testID && typeof node.props.onPress === 'function');
const hostStyle = (tree, testID) => StyleSheet.flatten(
  tree.root.find((node) => node.props.testID === testID && typeof node.type === 'string').props.style
);
const alertColor = (tree) => hostStyle(tree, 'compliance-alert').borderColor;

async function render(navigation = { navigate: jest.fn() }) {
  let tree;
  await act(async () => {
    tree = create(<PendingSignaturesScreen route={{ params: { submission } }} navigation={navigation} />);
  });
  return tree;
}

test('the blocking compliance alert explains that launch is inhibited', async () => {
  const tree = await render();
  const text = textOf(tree);

  expect(text).toContain('SYSTEM HALT');
  expect(text).toContain('● WARNING');
  expect(text).toContain('Pending Signatures');
  expect(text).toContain('BLOCKING COMPLIANCE AUDIT');
  expect(text).toContain('Launch protocols are inhibited until countersignatures resolve.');
  expect(text).toContain('TIMELINE THRESHOLD:');
  expect(text).toContain('02d 14h 32m');

  await act(async () => tree.unmount());
});

test('the sign-off directory lists every signer with name, role, organization and status', async () => {
  const tree = await render();
  const text = textOf(tree);

  expect(text).toContain('SIGN-OFF DIRECTORY');
  expect(text).toContain('Sarah Chen');
  expect(text).toContain('VP of Operations (Client)');
  expect(text).toContain('Capt. Marcus Vance');
  expect(text).toContain('Pilot-in-Command (Orion Skys)');
  expect(text).toContain('Evelyn Ross');
  expect(text).toContain('FAA Flight Liaison (FAA)');

  const badge = (signer) => hostStyle(tree, `status-${signer.id}`);
  expect(textOf(tree)).toContain('SIGNED');
  expect(badge(sarah).color).toBe(colors.green);
  expect(badge(marcus).color).toBe(colors.gold);
  expect(badge(evelyn).color).toBe(colors.error);

  await act(async () => tree.unmount());
});

const dialogShown = (tree) => tree.root.findAll((node) => node.props.testID === 'resend-dialog' && node.props.onPress).length > 0;

// Opens the confirm dialog for a signer and presses Resend.
async function sendReminder(tree, signer) {
  await act(async () => pressable(tree, `resend-${signer.id}`).props.onPress());
  await act(async () => pressable(tree, 'resend-dialog-confirm').props.onPress());
}

test('only pending and overdue signers offer a resend reminder that re-sends the request', async () => {
  const tree = await render();
  const resendButtons = tree.root.findAll(
    (node) => typeof node.props.testID === 'string'
      && /^resend-signer-/.test(node.props.testID)
      && node.props.onPress
  );
  expect(resendButtons.map((node) => node.props.testID)).toEqual([`resend-${marcus.id}`, `resend-${evelyn.id}`]);

  await sendReminder(tree, marcus);
  expect(dialogShown(tree)).toBe(false);
  expect(textOf(tree)).toContain('Reminder sent to Capt. Marcus Vance');
  expect(textOf(tree)).toContain('✓ Reminder sent');
  // Re-sending does not change which signer the alert is showing.
  expect(textOf(tree)).toContain('OVERALL STATUS');

  await act(async () => tree.unmount());
});

test('every resend reminder button looks the same, with the accent text color', async () => {
  const tree = await render();
  const buttonStyle = (signer) => StyleSheet.flatten(pressable(tree, `resend-${signer.id}`).props.style({ pressed: false }));
  const labelStyle = (signer) => StyleSheet.flatten(
    pressable(tree, `resend-${signer.id}`).findByType(Text).props.style
  );

  expect(buttonStyle(marcus)).toEqual(buttonStyle(evelyn));
  expect(labelStyle(marcus)).toEqual(labelStyle(evelyn));
  expect(labelStyle(evelyn).color).toBe(colors.accent);

  await act(async () => tree.unmount());
});

test('resend reminder asks for confirmation and shows where the reminder goes', async () => {
  const tree = await render();
  expect(dialogShown(tree)).toBe(false);

  await act(async () => pressable(tree, `resend-${evelyn.id}`).props.onPress());
  expect(dialogShown(tree)).toBe(true);
  const text = textOf(tree);
  expect(text).toContain('Resend reminder?');
  expect(text).toContain('Evelyn Ross, FAA Flight Liaison (FAA)');
  expect(text).toContain(evelyn.email);
  expect(text).toContain('Resend');
  expect(text).toContain('Cancel');
  // Nothing is sent until the reminder is confirmed.
  expect(text).not.toContain('Reminder sent to');

  await act(async () => pressable(tree, 'resend-dialog-confirm').props.onPress());
  expect(dialogShown(tree)).toBe(false);
  expect(textOf(tree)).toContain('Reminder sent to Evelyn Ross');

  await act(async () => tree.unmount());
});

test('cancel, or a tap outside the dialog, closes it without sending', async () => {
  const tree = await render();

  await act(async () => pressable(tree, `resend-${marcus.id}`).props.onPress());
  expect(textOf(tree)).toContain(marcus.email);
  await act(async () => pressable(tree, 'resend-dialog-cancel').props.onPress());
  expect(dialogShown(tree)).toBe(false);

  await act(async () => pressable(tree, `resend-${marcus.id}`).props.onPress());
  await act(async () => pressable(tree, 'resend-dialog-backdrop').props.onPress());
  expect(dialogShown(tree)).toBe(false);

  const text = textOf(tree);
  expect(text).not.toContain('Reminder sent to');
  expect(text).not.toContain('✓ Reminder sent');

  await act(async () => tree.unmount());
});

test('tapping a signer recolors the compliance alert to that signer\'s status', async () => {
  const tree = await render();

  // With nothing selected the alert shows the most serious status: overdue.
  expect(getOverallSignatureStatus(REQUIRED_SIGNERS)).toBe(SIGNATURE_STATUS.OVERDUE);
  expect(alertColor(tree)).toBe(colors.error);
  expect(textOf(tree)).toContain('2 of 3 signatures outstanding');

  // Nothing selected: Evelyn is overdue, so the alert is a blocking audit.
  const alertTitle = () => tree.root.find(
    (node) => node.props.testID === 'compliance-alert-title' && typeof node.type === 'string'
  ).props.children;
  expect(alertTitle()).toBe('BLOCKING COMPLIANCE AUDIT');

  await act(async () => pressable(tree, `signer-${sarah.id}`).props.onPress());
  expect(alertTitle()).toBe('COUNTERSIGNATURE RECEIVED');
  expect(textOf(tree)).not.toContain('BLOCKING COMPLIANCE AUDIT');
  expect(alertColor(tree)).toBe(colors.green);
  expect(hostStyle(tree, 'compliance-alert-title').color).toBe(colors.green);
  expect(textOf(tree)).toContain('Sarah Chen · SIGNED');
  expect(pressable(tree, `signer-${sarah.id}`).props.accessibilityState).toEqual({ selected: true });

  await act(async () => pressable(tree, `signer-${marcus.id}`).props.onPress());
  expect(alertColor(tree)).toBe(colors.gold);
  expect(alertTitle()).toBe('AWAITING COUNTERSIGNATURE');
  expect(textOf(tree)).not.toContain('BLOCKING COMPLIANCE AUDIT');
  expect(textOf(tree)).toContain('Capt. Marcus Vance · PENDING');
  expect(pressable(tree, `signer-${sarah.id}`).props.accessibilityState).toEqual({ selected: false });

  await act(async () => pressable(tree, `signer-${evelyn.id}`).props.onPress());
  expect(alertColor(tree)).toBe(colors.error);
  expect(textOf(tree)).toContain('Evelyn Ross · OVERDUE');
  expect(alertTitle()).toBe('BLOCKING COMPLIANCE AUDIT');

  // Tapping the selected signer again returns to the overall status.
  await act(async () => pressable(tree, `signer-${evelyn.id}`).props.onPress());
  expect(textOf(tree)).toContain('OVERALL STATUS');
  expect(alertColor(tree)).toBe(colors.error);

  await act(async () => tree.unmount());
});

test('show authorization opens pending signatures, and back returns to it', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<ShowAuthorizationScreen route={{ params: { submission } }} navigation={navigation} />);
  });
  await act(async () => pressable(tree, 'authorization-signatures').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('PendingSignatures', { submission });
  await act(async () => tree.unmount());

  const screen = await render(navigation);
  const back = screen.root.find((node) => node.props.accessibilityLabel === 'Back to show authorization' && node.props.onPress);
  await act(async () => back.props.onPress());
  expect(navigation.navigate).toHaveBeenLastCalledWith('ShowAuthorization', { submission });
  await act(async () => screen.unmount());
});

test('sending another reminder while the popup is up switches it to the new signer', async () => {
  const tree = await render();
  await sendReminder(tree, marcus);
  await sendReminder(tree, evelyn);
  expect(textOf(tree)).toContain('Reminder sent to Evelyn Ross');
  expect(textOf(tree)).not.toContain('Reminder sent to Capt. Marcus Vance');
  await act(async () => tree.unmount());
});
