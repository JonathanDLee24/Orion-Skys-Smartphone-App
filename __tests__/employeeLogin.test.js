import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import EmployeeLoginScreen from '../src/screens/EmployeeLoginScreen';
import WelcomeScreen from '../src/screens/WelcomeScreen';

const mockPopToTop = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: mockPopToTop }),
}));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

global.IS_REACT_ACT_ENVIRONMENT = true;

test('employee sign in accepts the demo credentials and opens the dashboard', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<EmployeeLoginScreen navigation={navigation} />);
  });

  const inputs = tree.root.findAllByType(TextInput);
  await act(async () => inputs[0].props.onChangeText('test'));
  await act(async () => inputs[1].props.onChangeText('1234'));
  const submit = tree.root.find(
    (node) => node.props.accessibilityLabel === 'Sign in',
  );
  await act(async () => submit.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('Dashboard');
  await act(async () => tree.unmount());
});

test('invalid employee credentials show an error without navigating', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<EmployeeLoginScreen navigation={navigation} />);
  });

  const inputs = tree.root.findAllByType(TextInput);
  await act(async () => inputs[0].props.onChangeText('wrong'));
  await act(async () => inputs[1].props.onChangeText('credentials'));
  const submit = tree.root.find(
    (node) => node.props.accessibilityLabel === 'Sign in',
  );
  await act(async () => submit.props.onPress());
  expect(tree.root.findAllByType(Text).some(
    (node) => node.props.children === 'Username or password is incorrect.',
  )).toBe(true);
  expect(navigation.navigate).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});

test('password visibility control shows and hides the password', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<EmployeeLoginScreen navigation={navigation} />);
  });

  const passwordInput = tree.root.findAllByType(TextInput)[1];
  expect(passwordInput.props.secureTextEntry).toBe(true);

  let visibilityButton = tree.root.find(
    (node) => node.props.accessibilityLabel === 'Show password',
  );
  await act(async () => visibilityButton.props.onPress());
  expect(passwordInput.props.secureTextEntry).toBe(false);

  visibilityButton = tree.root.find(
    (node) => node.props.accessibilityLabel === 'Hide password',
  );
  await act(async () => visibilityButton.props.onPress());
  expect(passwordInput.props.secureTextEntry).toBe(true);
  await act(async () => tree.unmount());
});

test('employee sign in logo returns to the home screen', async () => {
  const navigation = { navigate: jest.fn() };
  mockPopToTop.mockClear();
  let tree;
  await act(async () => {
    tree = create(<EmployeeLoginScreen navigation={navigation} />);
  });

  const logo = tree.root.find(
    (node) => node.props.accessibilityLabel === 'Return to home',
  );
  await act(async () => logo.props.onPress());
  expect(mockPopToTop).toHaveBeenCalled();
  expect(navigation.navigate).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});

test('welcome employee option opens the employee login screen', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<WelcomeScreen navigation={navigation} />);
  });

  const employeeButton = tree.root.find(
    (node) => node.props.accessibilityLabel === 'Employee Sign In',
  );
  await act(async () => employeeButton.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('EmployeeLogin');
  await act(async () => tree.unmount());
});
