import React from 'react';
import { act, create } from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import LaancDashboardScreen from '../src/screens/LaancDashboardScreen';
import { LAANC_STATUS, approveCohort, resetLaancAuthorization } from '../src/services/laancService';
import { colors } from '../src/theme';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => resetLaancAuthorization());

async function renderScreen(navigation = { navigate: jest.fn() }) {
  let tree;
  await act(async () => {
    tree = create(<LaancDashboardScreen navigation={navigation} />);
  });
  // The dashboard fetches its authorization payload on mount.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
  return tree;
}

const allText = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const styleOf = (tree, testID) => StyleSheet.flatten(tree.root.findByProps({ testID }).props.style);
const pressable = (tree, testID) => tree.root
  .findAllByProps({ testID })
  .find((node) => typeof node.props.onPress === 'function');
const tab = (tree, label) => tree.root
  .findAllByProps({ accessibilityLabel: `${label} navigation` })
  .find((node) => node.props.accessibilityState);

test('OSPSA-63 renders the authorization metadata from the LAANC payload', async () => {
  const tree = await renderScreen();
  const text = allText(tree);

  expect(text).toContain('LAANC Dashboard');
  expect(text).toContain('COORDINATION PORTAL');
  expect(text).toContain('AUTHORIZED');
  expect(text).toContain('L-0498321');
  expect(text).toContain('APPROVED');
  expect(text).toContain('200 FT AGL');
  expect(text).toContain('19:00 - 21:00 PDT');
  expect(text).toContain('LAANC (Low Altitude Authorization and Notification Capability)');

  await act(async () => tree.unmount());
});

test('OSPSA-63 styles each cohort by its compliance status', async () => {
  const tree = await renderScreen();

  const text = allText(tree);
  expect(text).toContain('S-01 to S-48');
  expect(text).toContain('Show Drones (Primary)');
  expect(text).toContain('S-49 to S-96');
  expect(text).toContain('R-01 to R-08');
  expect(text).toContain('RTK Anchor Transponders');
  expect(text).toContain('CAM-01');
  expect(text).toContain('Gimbal Observer Unit');

  expect(tree.root.findByProps({ testID: 'laanc-status-S-01' }).props.children).toBe(LAANC_STATUS.APPROVED);
  expect(styleOf(tree, 'laanc-status-S-01').color).toBe(colors.accent);

  expect(tree.root.findByProps({ testID: 'laanc-status-R-01' }).props.children).toBe(LAANC_STATUS.PENDING);
  expect(styleOf(tree, 'laanc-status-R-01').color).toBe(colors.gold);

  await act(async () => tree.unmount());
});

test('OSPSA-63 blocks flight initiation while a required cohort is pending', async () => {
  const tree = await renderScreen();
  expect(allText(tree)).toContain('FLIGHT INITIATION LOCKED');

  await act(async () => pressable(tree, 'laanc-request-initiation').props.onPress());
  expect(tree.root.findByProps({ testID: 'laanc-initiation-notice' }).props.children)
    .toBe('Flight initiation blocked: RTK Anchor Transponders pending LAANC safety evaluation.');

  await act(async () => tree.unmount());

  approveCohort('R-01');
  const cleared = await renderScreen();
  expect(allText(cleared)).toContain('FLIGHT INITIATION CLEARED');

  await act(async () => pressable(cleared, 'laanc-request-initiation').props.onPress());
  expect(cleared.root.findByProps({ testID: 'laanc-initiation-notice' }).props.children)
    .toBe('Flight initiation cleared. Every required cohort is approved.');

  await act(async () => cleared.unmount());
});

test('OSPSA-63 lights the LAANC tab and leaves the shell tabs on their own sections', async () => {
  const navigate = jest.fn();
  const tree = await renderScreen({ navigate });

  expect(tab(tree, 'LAANC').props.accessibilityState.selected).toBe(true);
  expect(tab(tree, 'AIRSPACE').props.accessibilityState.selected).toBe(false);
  expect(tab(tree, 'NOTAM').props.accessibilityState.selected).toBe(false);

  await act(async () => tab(tree, 'AIRSPACE').props.onPress());
  expect(navigate).toHaveBeenCalledWith('DroneManifest');

  await act(async () => tree.unmount());
});
