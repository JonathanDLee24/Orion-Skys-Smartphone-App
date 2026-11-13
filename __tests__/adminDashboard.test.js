import React from 'react';
import { act, create } from 'react-test-renderer';
import AdminDashboardScreen from '../src/screens/AdminDashboardScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), popToTop: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

global.IS_REACT_ACT_ENVIRONMENT = true;

test('admin dashboard links to Orion Skys operational screens', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<AdminDashboardScreen navigation={navigation} />);
  });

  const expectedRoutes = [
    ['View schedule', 'EmployeeEvents'],
    ['Manage fleet', 'DroneManifest'],
    ['Review contracts', 'DossierShowSelect'],
    ['Schedule', 'EmployeeEvents'],
    ['Fleet', 'DroneManifest'],
    ['Contracts', 'DossierShowSelect'],
    ['Crew', 'QRCodeScanner'],
    ['Settings', 'AccountSettings'],
  ];

  const expectedLabels = [
    ...expectedRoutes.map(([label]) => label),
    'Dashboard',
    'QuickBooks Sync',
    'Sync status',
    'Send survey',
    'Shared payments',
  ];
  expect(expectedLabels).toHaveLength(13);

  for (const [label, route] of expectedRoutes) {
    const link = tree.root.find((node) => node.props.accessibilityLabel === label);
    await act(async () => link.props.onPress());
    expect(navigation.navigate).toHaveBeenLastCalledWith(route);
  }

  const unavailableActions = [
    ['Dashboard', 'You are already viewing the admin dashboard.'],
    ['QuickBooks Sync', 'QuickBooks sync is not configured in this app yet.'],
    ['Sync status', 'No external synchronization service is connected.'],
    ['Send survey', 'Survey delivery is not configured in this app yet.'],
    ['Shared payments', 'Shared payment management is not available in this app yet.'],
  ];
  for (const [label, message] of unavailableActions) {
    const action = tree.root.find((node) => node.props.accessibilityLabel === label);
    await act(async () => action.props.onPress());
    expect(tree.root.find((node) => node.props.accessibilityRole === 'alert').props.children).toBe(message);
  }

  await act(async () => tree.unmount());
});
