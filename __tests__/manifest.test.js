import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import SerializedDroneManifestScreen from '../src/screens/SerializedDroneManifestScreen';
import { resetFleetForTests } from '../src/services/droneDowntimeService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => resetFleetForTests());

test('OSPSA-258 renders the fleet manifest and filters airframes', async () => {
  let tree;
  await act(async () => {
    tree = create(<SerializedDroneManifestScreen navigation={{ navigate: jest.fn() }} />);
  });

  const text = tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
  expect(text).toContain('DRONE FLEET MANIFEST');
  expect(text).toMatch(/TOTAL:\s+6\s+UNITS/);
  expect(text).toContain('SF-Q-001');
  expect(text).toContain('SF-Q-006');
  expect(text).toContain('PAIR');
  expect(text).toContain('AIRSPACE');
  expect(text).toContain('LAANC');
  expect(text).toContain('NOTAM');

  await act(async () => tree.root.findByType(TextInput).props.onChangeText('SF-Q-003'));
  const filteredText = tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
  expect(filteredText).toContain('SF-Q-003');
  expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'Manage status for SF-Q-001')).toHaveLength(0);

  await act(async () => tree.unmount());
});

test('manifest shows readiness and opens the downtime child flow for a drone', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<SerializedDroneManifestScreen navigation={navigation} />);
  });

  const readiness = tree.root.find((node) => node.props.testID === 'fleet-readiness');
  expect([].concat(readiness.props.children).join('')).toMatch(/LAUNCH-READY: 5 UNITS · MAINTENANCE: 1 · GROUNDED: 0/);

  const row = tree.root.find((node) => node.props.accessibilityLabel === 'Manage status for SF-Q-001');
  await act(async () => row.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('DroneDowntime', { droneId: 'SF-Q-001' });

  await act(async () => tree.unmount());
});
