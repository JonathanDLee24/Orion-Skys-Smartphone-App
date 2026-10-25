import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import SerializedDroneManifestScreen from '../src/screens/SerializedDroneManifestScreen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

test('OSPSA-258 renders the fleet manifest and filters airframes', async () => {
  let tree;
  await act(async () => {
    tree = create(<SerializedDroneManifestScreen navigation={{ navigate: jest.fn() }} />);
  });

  const text = tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
  expect(text).toContain('DRONE FLEET MANIFEST');
  expect(text).toContain('TOTAL: 120 UNITS');
  expect(text).toContain('SF-Q-001');
  expect(text).toContain('SF-Q-006');
  expect(text).toContain('PAIR');
  expect(text).toContain('AIRSPACE');
  expect(text).toContain('LAANC');
  expect(text).toContain('NOTAM');

  await act(async () => tree.root.findByType(TextInput).props.onChangeText('SF-Q-003'));
  const filteredText = tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
  expect(filteredText).toContain('SF-Q-003');
  expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'View SF-Q-001')).toHaveLength(0);

  await act(async () => tree.unmount());
});
