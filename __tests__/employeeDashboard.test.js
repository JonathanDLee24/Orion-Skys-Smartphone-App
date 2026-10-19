import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import EmployeeDashboard from '../src/screens/EmployeeDashboard';
import WelcomeScreen from '../src/screens/WelcomeScreen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');

test('welcome screen does not expose the employee dashboard directly', async () => {
  let tree;
  await act(async () => { tree = create(<WelcomeScreen navigation={{ navigate: jest.fn() }} />); });
  expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'Employee Dashboard')).toHaveLength(0);
  await act(async () => tree.unmount());
});

test('welcome admin option opens the fleet manifest', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => { tree = create(<WelcomeScreen navigation={navigation} />); });

  const button = tree.root.find((node) => node.props.accessibilityLabel === 'Admin Sign In');
  await act(async () => button.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('DroneManifest');
  await act(async () => tree.unmount());
});

test('employee dashboard renders its content and bottom navigation', async () => {
  let tree;
  await act(async () => { tree = create(<EmployeeDashboard navigation={{ navigate: jest.fn() }} />); });

  const text = textOf(tree);
  expect(text).toContain('Welcome back, Kenneth');
  expect(text).toContain('SCHEDULED SHOWS');
  expect(text).toContain('HOME');
  expect(text).toContain('ACCOUNT');
  await act(async () => tree.unmount());
});
