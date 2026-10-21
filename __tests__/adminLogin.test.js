import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import AdminLoginScreen from '../src/screens/AdminLoginScreen';
import {
  isAdminAccountLocked,
  resetAdminLoginAttempts,
} from '../src/services/adminAuthService';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

global.IS_REACT_ACT_ENVIRONMENT = true;

test('admin account locks after five incorrect passwords and can be explicitly reset', async () => {
  const navigation = { navigate: jest.fn() };
  resetAdminLoginAttempts('admin');
  let tree;
  await act(async () => {
    tree = create(<AdminLoginScreen navigation={navigation} />);
  });

  const inputs = tree.root.findAllByType(TextInput);
  await act(async () => inputs[0].props.onChangeText('admin'));
  await act(async () => inputs[1].props.onChangeText('wrong-password'));
  const submit = tree.root.find(
    (node) => node.props.accessibilityLabel === 'Sign in',
  );
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await act(async () => submit.props.onPress());
  }

  expect(isAdminAccountLocked('admin')).toBe(true);
  expect(tree.root.findAllByType(Text).some(
    (node) => node.props.children === 'Account locked after 5 incorrect password attempts. Contact an administrator to reset access.',
  )).toBe(true);
  expect(navigation.navigate).not.toHaveBeenCalled();

  resetAdminLoginAttempts('admin');
  expect(isAdminAccountLocked('admin')).toBe(false);
  await act(async () => inputs[1].props.onChangeText('admin1234'));
  await act(async () => submit.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('DroneManifest');
  await act(async () => tree.unmount());
});

test('enterprise SSO is displayed as a button and does not navigate', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<AdminLoginScreen navigation={navigation} />);
  });

  const ssoButton = tree.root.find(
    (node) => node.props.accessibilityLabel === 'Enterprise SSO',
  );
  expect(ssoButton.findByType(Text).props.children).toBe('Enterprise SSO');
  await act(async () => ssoButton.props.onPress());
  expect(navigation.navigate).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});
