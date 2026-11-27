import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import ShowAuthorizationScreen from '../src/screens/ShowAuthorizationScreen';
import { resetEquipmentReadiness, resolveAsset } from '../src/services/equipmentReadinessService';
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

beforeEach(() => {
  resetEquipmentReadiness();
});

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

test('OSPSA-254 the launch gate refuses to authorize a show with flagged equipment', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<ShowAuthorizationScreen route={{ params: { submission: DEMO_EVENTS[0] } }} navigation={navigation} />);
  });

  expect(textOf(tree)).toContain('SHOW READINESS LOCKED');

  await act(async () => findButton(tree, 'Authorize launch').props.onPress());
  expect(textOf(tree)).toContain('Launch blocked:');
  expect(textOf(tree)).toContain('SF-Q-005 · MISSING');
  // The show is not authorized and the screen does not move on.
  expect(navigation.navigate).not.toHaveBeenCalled();

  await act(async () => findButton(tree, 'Review equipment alert').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('MissingEquipmentAlert', undefined);

  await act(async () => tree.unmount());
});

test('OSPSA-254 the launch gate clears once every flagged asset is verified', async () => {
  resolveAsset('SF-Q-004', { resolution: 'Battery pack replaced.' });
  resolveAsset('SF-Q-005', { resolution: 'Airframe recovered.' });
  resolveAsset('SF-Q-006', { resolution: 'Safety sign-off recorded.' });

  let tree;
  await act(async () => {
    tree = create(<ShowAuthorizationScreen route={{ params: { submission: DEMO_EVENTS[0] } }} navigation={{ navigate: jest.fn() }} />);
  });

  expect(textOf(tree)).toContain('SHOW READINESS CLEARED');

  await act(async () => findButton(tree, 'Authorize launch').props.onPress());
  expect(textOf(tree)).toContain('Launch cleared. All required equipment is verified.');
  expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'Review equipment alert')).toHaveLength(0);

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
