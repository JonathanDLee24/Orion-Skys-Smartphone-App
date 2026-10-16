import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import AccountSettingsScreen from '../src/screens/AccountSettingsScreen';
import DashboardScreen from '../src/screens/DashboardScreen';
import { saveNotificationSettings } from '../src/services/settingsService';

jest.mock('../src/services/settingsService', () => ({ saveNotificationSettings: jest.fn() }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;
let tree;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

async function render(element) {
  await act(async () => { tree = create(element); });
}
const text = () => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const switches = () => tree.root.findAll((node) => node.props.accessibilityRole === 'switch');
const switchFor = (label) => switches().find((node) => node.props.accessibilityLabel === label);
const press = (label, role) => act(async () => tree.root.findAll((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function' && (!role || node.props.accessibilityRole === role))[0].props.onPress());

test('renders the specified defaults and helper copy', async () => {
  await render(<AccountSettingsScreen navigation={{ navigate: jest.fn() }} />);
  const state = {};
  switches().forEach((node) => { state[node.props.accessibilityLabel] = node.props.accessibilityState.checked; });
  expect(state['Email notifications']).toBe(true);
  expect(state['Push notifications']).toBe(false);
  expect(state['Show updates']).toBe(true);
  expect(state['Billing messages']).toBe(true);
  expect(text()).toContain('English');
  expect(text()).toContain('Singapore · SGT (UTC+8)');
  expect(text()).toContain('Essential security alerts and contractual notices are always sent by email, regardless of these preferences.');
  expect(text()).toContain("Event schedules always show the venue's local time.");
  expect(text()).toContain('Save preferences');
  expect(text()).toContain('Cancel · Back to account');
});

test('a toggle flips state and renders an animated track', async () => {
  await render(<AccountSettingsScreen navigation={{ navigate: jest.fn() }} />);
  expect(tree.root.findAll((node) => node.props.testID === 'push-track').length).toBeGreaterThan(0);
  expect(tree.root.findAll((node) => node.props.testID === 'push-thumb').length).toBeGreaterThan(0);
  await act(async () => switchFor('Push notifications').props.onPress());
  expect(switchFor('Push notifications').props.accessibilityState.checked).toBe(true);
  await act(async () => switchFor('Push notifications').props.onPress());
  expect(switchFor('Push notifications').props.accessibilityState.checked).toBe(false);
});

test('the language dropdown expands into a scrollable overlay and selects', async () => {
  await render(<AccountSettingsScreen navigation={{ navigate: jest.fn() }} />);
  expect(tree.root.findAll((node) => node.props.testID === 'language-select-panel')).toHaveLength(0);
  await press('Language', 'button');
  expect(tree.root.findAll((node) => node.props.testID === 'language-select-panel').length).toBeGreaterThan(0);
  expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'Deutsch (German)' && typeof node.props.onPress === 'function')).toHaveLength(1);
  await press('Deutsch (German)', 'button');
  expect(text()).toContain('Deutsch (German)');
  expect(tree.root.findAll((node) => node.props.testID === 'language-select-panel')).toHaveLength(0);
});

test('the time zone picker defaults to Singapore and updates', async () => {
  await render(<AccountSettingsScreen navigation={{ navigate: jest.fn() }} />);
  await press('Time zone', 'button');
  await press('Tokyo · JST (UTC+9)', 'button');
  expect(text()).toContain('Tokyo · JST (UTC+9)');
});

test('saving pushes the payload to the settings service and shows a success toast', async () => {
  saveNotificationSettings.mockResolvedValue({});
  await render(<AccountSettingsScreen navigation={{ navigate: jest.fn() }} />);
  await act(async () => switchFor('Push notifications').props.onPress());
  await press('Save preferences', 'button');
  expect(saveNotificationSettings).toHaveBeenCalledTimes(1);
  expect(saveNotificationSettings).toHaveBeenCalledWith({
    notifications: { email: true, push: true, shows: true, billing: true },
    language: 'en',
    timeZone: 'Asia/Singapore',
  });
  expect(text()).toContain('Preferences saved');
});

test('a failed save surfaces an error and no toast', async () => {
  saveNotificationSettings.mockRejectedValueOnce(new Error('Settings service offline'));
  await render(<AccountSettingsScreen navigation={{ navigate: jest.fn() }} />);
  await press('Save preferences', 'button');
  expect(text()).toContain('Settings service offline');
  expect(text()).not.toContain('Preferences saved');
});

test('cancel and the account breadcrumb return to the dashboard without saving', async () => {
  const navigation = { navigate: jest.fn() };
  await render(<AccountSettingsScreen navigation={navigation} />);
  await press('Cancel and go back to account', 'button');
  await press('ACCOUNT', 'button');
  expect(navigation.navigate).toHaveBeenCalledTimes(2);
  expect(navigation.navigate).toHaveBeenNthCalledWith(1, 'Dashboard');
  expect(navigation.navigate).toHaveBeenNthCalledWith(2, 'Dashboard');
  expect(saveNotificationSettings).not.toHaveBeenCalled();
});

test('dashboard links route to fees and to account settings', async () => {
  const navigation = { navigate: jest.fn() };
  await render(<DashboardScreen navigation={navigation} />);
  expect(text()).toContain('My Account');
  await press('Review booking fees', 'button');
  await press('Account settings', 'button');
  expect(navigation.navigate).toHaveBeenNthCalledWith(1, 'FeeReview');
  expect(navigation.navigate).toHaveBeenNthCalledWith(2, 'AccountSettings');
});
