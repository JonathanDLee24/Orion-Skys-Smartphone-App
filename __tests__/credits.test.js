import React from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import CreditsScreen from '../src/screens/CreditsScreen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const findButton = (tree, label) => tree.root.findAll(
  (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
)[0];

let tree;

afterEach(() => {
  if (tree) act(() => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
});

async function renderAt(width = 390, height = 844) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 1, fontScale: 1 });
  await act(async () => {
    tree = create(<CreditsScreen navigation={{ navigate: jest.fn() }} />);
  });
  return tree;
}

test('shows the credit balance, rules and recent activity', async () => {
  const screen = await renderAt();
  const text = textOf(screen);

  expect(text).toContain('CLIENT CREDITS // 2026');
  expect(text).toContain('Credits.');
  expect(text).toContain('AVAILABLE BALANCE');
  expect(text).toContain('1,120');
  expect(text).toContain('CREDITS');
  expect(text).toContain('One credit equals US$1 toward drone show production.');
  expect(text).toContain('Credits are applied only after operations confirms a show.');
  expect(text).toContain('Apex Global Summit');
  expect(text).toContain('+1,000');
  expect(text).toContain('−200');
});

test('the back link returns to events and the footer opens the booking wizard', async () => {
  const navigation = { navigate: jest.fn() };
  await act(async () => {
    tree = create(<CreditsScreen navigation={navigation} />);
  });

  await act(async () => findButton(tree, 'Back to events').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('EmployeeEvents');

  await act(async () => findButton(tree, 'Schedule a show').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingDateVenue');
});

test('stacks on phones and uses two columns on tablet and desktop', async () => {
  let screen = await renderAt(390, 844);
  let columns = StyleSheet.flatten(screen.root.findByProps({ testID: 'credits-columns' }).props.style);
  expect(columns.flexDirection).toBeUndefined();

  await act(async () => tree.unmount());
  screen = await renderAt(1024, 768);
  columns = StyleSheet.flatten(screen.root.findByProps({ testID: 'credits-columns' }).props.style);
  expect(columns.flexDirection).toBe('row');

  await act(async () => tree.unmount());
  screen = await renderAt(1440, 900);
  columns = StyleSheet.flatten(screen.root.findByProps({ testID: 'credits-columns' }).props.style);
  expect(columns.flexDirection).toBe('row');
});
