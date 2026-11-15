import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import ShowAuthorizationScreen from '../src/screens/ShowAuthorizationScreen';
import { DEMO_EVENTS } from '../src/services/eventFeedService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const findButton = (tree, label) =>
  tree.root.findAll((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function')[0];

test('show authorization lists the liability clauses and pending signatures sections', async () => {
  const submission = DEMO_EVENTS[0];
  let tree;
  await act(async () => {
    tree = create(<ShowAuthorizationScreen route={{ params: { submission } }} navigation={{ navigate: jest.fn() }} />);
  });

  const text = textOf(tree);
  expect(text).toContain('Show Authorization');
  expect(text).toContain('Apex Global Summit');
  expect(text).toContain('REQ-20261114-2000');
  expect(text).toContain('Liability Clauses');
  expect(text).toContain('Pending Signatures');
  expect(tree.root.findAll((node) => node.props.testID === 'authorization-liability').length).toBeGreaterThan(0);
  expect(tree.root.findAll((node) => node.props.testID === 'authorization-signatures').length).toBeGreaterThan(0);

  await act(async () => tree.unmount());
});

test('show authorization returns to the same show in management', async () => {
  const submission = DEMO_EVENTS[0];
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<ShowAuthorizationScreen route={{ params: { submission } }} navigation={navigation} />);
  });

  await act(async () => findButton(tree, 'Back to show management').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingManage', { submission });

  await act(async () => tree.unmount());
});
