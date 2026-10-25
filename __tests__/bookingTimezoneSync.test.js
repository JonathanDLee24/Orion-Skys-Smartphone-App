import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import AccountSettingsScreen from '../src/screens/AccountSettingsScreen';
import BookingDateVenueScreen from '../src/screens/BookingDateVenueScreen';
import { resetSettingsPreferences } from '../src/services/settingsService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const press = (tree, label) => tree.root.findAll(
  (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
)[0].props.onPress();
const monthLabel = (tree) => tree.root.findAll((node) => node.props.testID === 'calendar-month-label')[0].props.children;

let tree;
beforeEach(() => {
  resetSettingsPreferences();
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
});

test('the postal code picks the venue time zone and the saved preference is the fallback', async () => {
  await act(async () => {
    tree = create(<AccountSettingsScreen navigation={{ navigate: jest.fn() }} />);
  });

  await act(async () => press(tree, 'Time zone'));
  await act(async () => press(tree, 'Tokyo · JST (UTC+9)'));

  await act(async () => {
    press(tree, 'Save preferences');
    await new Promise((resolve) => setTimeout(resolve, 550));
  });

  expect(textOf(tree)).toContain('Preferences saved');
  await act(async () => tree.unmount());
  tree = null;

  await act(async () => {
    tree = create(<BookingDateVenueScreen navigation={{ navigate: jest.fn() }} />);
  });

  // The default Singapore venue postal code overrides the Tokyo preference.
  expect(textOf(tree)).toContain('TIME ZONE · Singapore · SGT (UTC+8)');

  // Pick a day so the label can show that date in the venue time zone.
  while (monthLabel(tree) !== 'November 2026') {
    await act(async () => press(tree, 'Next month'));
  }
  const novemberDay = tree.root.findAll((node) => node.props.testID === 'calendar-day-2026-11-21')[0];
  await act(async () => novemberDay.props.onPress());
  expect(textOf(tree)).toContain('SAT, 21 NOV // UTC+8');

  const postalInput = tree.root.findAll((node) => node.props.accessibilityLabel === 'Postal code' && typeof node.props.onChangeText === 'function')[0];
  await act(async () => postalInput.props.onChangeText('UNKNOWN'));
  expect(textOf(tree)).toContain('SAT, 21 NOV // UTC+9');

  await act(async () => postalInput.props.onChangeText('10001'));
  expect(textOf(tree)).toContain('SAT, 21 NOV // EST (UTC-5)');
});
