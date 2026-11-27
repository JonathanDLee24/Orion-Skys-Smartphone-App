import React from 'react';
import { act, create } from 'react-test-renderer';
import { AdminContractsScreen } from '../src/screens/DossierShowSelectScreen';
import DocumentDossierScreen from '../src/screens/DocumentDossierScreen';
import { AdminScheduleScreen } from '../src/screens/EmployeeEventsScreen';
import AdminDashboardScreen from '../src/screens/AdminDashboardScreen';
import { Text } from 'react-native';
import { createDowntimeRecord, resetFleetForTests } from '../src/services/droneDowntimeService';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), popToTop: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

global.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => resetFleetForTests());

test('admin action groups share the same grid and single-line card subtitles', async () => {
  let tree;
  await act(async () => {
    tree = create(<AdminDashboardScreen navigation={{ navigate: jest.fn() }} />);
  });

  const quickGrid = tree.root.findByProps({ testID: 'admin-quick-actions' });
  const destinationGrid = tree.root.findByProps({ testID: 'admin-operation-links' });
  expect(quickGrid.props.style).toEqual(destinationGrid.props.style);
  expect(quickGrid.parent).toBe(destinationGrid.parent);
  expect(quickGrid.children[0].props.style).toEqual(destinationGrid.children[0].props.style);
  const subtitle = tree.root.find((node) => node.props.children === 'Pending agreements');
  expect(subtitle.props.numberOfLines).toBe(1);
  await act(async () => tree.unmount());
});

test('admin dashboard links to Orion Skys operational screens', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<AdminDashboardScreen navigation={navigation} />);
  });

  const expectedRoutes = [
    ['View schedule', 'AdminSchedule'],
    ['Manage fleet', 'DroneManifest', { adminMode: true }],
    ['Review contracts', 'AdminContracts'],
    ['Schedule', 'AdminSchedule'],
    ['Fleet', 'DroneManifest', { adminMode: true }],
    ['Contracts', 'AdminContracts'],
    ['Crew', 'QRCodeScanner', { adminMode: true }],
    ['Settings', 'AccountSettings', { adminMode: true }],
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

  for (const [label, route, params] of expectedRoutes) {
    const link = tree.root.find((node) => node.props.accessibilityLabel === label);
    await act(async () => link.props.onPress());
    if (params) expect(navigation.navigate).toHaveBeenLastCalledWith(route, params);
    else expect(navigation.navigate).toHaveBeenLastCalledWith(route);
  }

  const accountButton = tree.root.find((node) => node.props.accessibilityLabel === 'Account settings');
  await act(async () => accountButton.props.onPress());
  expect(navigation.navigate).toHaveBeenLastCalledWith('AccountSettings', { adminMode: true });

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

test('admin dashboard surfaces fleet availability for operational staff', async () => {
  createDowntimeRecord({ droneId: 'SF-Q-003', issue: 'ESC failure', workPerformed: 'Diagnosed', staff: 'Alex', availability: 'Grounded/Downtime' });
  let tree;
  await act(async () => {
    tree = create(<AdminDashboardScreen navigation={{ navigate: jest.fn() }} />);
  });

  const strip = tree.root.find((node) => node.props.testID === 'fleet-readiness-strip');
  const text = strip.findAllByType(Text).map((node) => node.props.children).flat().join(' ').replace(/\s+/g, ' ');
  expect(text).toContain('// FLEET READINESS');
  expect(text).toContain('4 LAUNCH-READY · 1 MAINTENANCE · 1 GROUNDED');

  await act(async () => tree.unmount());
});

test('admin schedule has a back button and does not show employee bottom navigation', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<AdminScheduleScreen navigation={navigation} />);
  });

  expect(tree.root.find((node) => node.props.accessibilityLabel === 'Back to admin dashboard')).toBeTruthy();
  expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'HOME navigation')).toHaveLength(0);
  expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'EVENTS navigation')).toHaveLength(0);
  await act(async () => tree.root.find((node) => node.props.accessibilityLabel === 'Back to admin dashboard').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('AdminDashboard');

  await act(async () => tree.unmount());
});

test('admin contract selection and dossier details return within admin navigation', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<AdminContractsScreen navigation={navigation} />);
  });

  await act(async () => tree.root.find((node) => node.props.accessibilityLabel === 'Back to admin dashboard').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('AdminDashboard');
  await act(async () => tree.root.find((node) => node.props.accessibilityLabel === 'Review documents for Neon Lights Festival').props.onPress());
  expect(navigation.navigate).toHaveBeenLastCalledWith('DocumentDossier', {
    dossier: { id: 'SKY-8902-A', event: 'Neon Lights Festival' },
    adminMode: true,
  });
  await act(async () => tree.unmount());

  await act(async () => {
    tree = create(
      <DocumentDossierScreen
        route={{ params: { dossier: { id: 'SKY-8902-A', event: 'Neon Lights Festival' }, adminMode: true } }}
        navigation={navigation}
      />,
    );
  });
  const backButton = tree.root.find((node) => node.props.accessibilityLabel === 'Back to contracts');
  await act(async () => backButton.props.onPress());
  expect(navigation.navigate).toHaveBeenLastCalledWith('AdminContracts');
  await act(async () => tree.unmount());
});
