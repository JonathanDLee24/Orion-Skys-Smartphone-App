import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import MissingEquipmentAlertScreen from '../src/screens/MissingEquipmentAlertScreen';
import {
  getReadinessStatus,
  resetEquipmentReadiness,
} from '../src/services/equipmentReadinessService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

function screenText(tree) {
  return tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
}

beforeEach(() => {
  resetEquipmentReadiness();
});

test('OSPSA-254 missing equipment alert isolates flagged assets and blocks readiness', async () => {
  let tree;
  await act(async () => {
    tree = create(<MissingEquipmentAlertScreen navigation={{ navigate: jest.fn() }} />);
  });

  const text = screenText(tree);
  expect(text).toContain('MISSING HARDWARE DETECTED');
  expect(text).toContain('3 HARDWARE SEGMENTS UNACCOUNTED FOR');
  expect(text).toContain('SHOW READINESS LOCKED');
  expect(text).toContain('SF-Q-004');
  expect(text).toContain('SF-Q-005');
  expect(text).toContain('SF-Q-006');
  expect(text).toContain('MISSING');
  expect(text).toContain('FAILED');
  expect(text).toContain('UNVERIFIED');
  expect(text).toContain('FOLLOW-UP AUDIT TRAIL');

  await act(async () => tree.unmount());
});

test('OSPSA-254 safety follow-up and resolution update the audit trail', async () => {
  let tree;
  await act(async () => {
    tree = create(<MissingEquipmentAlertScreen navigation={{ navigate: jest.fn() }} />);
  });

  await act(async () => {
    tree.root
      .find((node) => node.props.accessibilityLabel === 'Open follow-up for SF-Q-005')
      .props.onPress();
  });
  await act(async () => {
    tree.root
      .find((node) => node.props.accessibilityLabel === 'Follow-up note')
      .props.onChangeText('Recovery crew searching the NE sector.');
  });
  await act(async () => {
    tree.root
      .find((node) => node.props.accessibilityLabel === 'Save safety follow-up')
      .props.onPress();
  });

  let text = screenText(tree);
  expect(text).toContain('Follow-up logged for SF-Q-005');
  expect(text).toContain('FOLLOW_UP');

  await act(async () => {
    tree.root
      .find((node) => node.props.accessibilityLabel === 'Mark resolved and verify')
      .props.onPress();
  });

  text = screenText(tree);
  expect(text).toContain('SF-Q-005 is verified');
  expect(text).toContain('RESOLVED');
  expect(getReadinessStatus().flaggedCount).toBe(2);

  await act(async () => tree.unmount());
});

test('OSPSA-254 alert actions are available to safety staff', async () => {
  let tree;
  await act(async () => {
    tree = create(<MissingEquipmentAlertScreen navigation={{ navigate: jest.fn() }} />);
  });

  await act(async () => {
    tree.root
      .find((node) => node.props.accessibilityLabel === 'Ping active transceivers')
      .props.onPress();
  });

  const text = screenText(tree);
  expect(text).toContain('Transceiver ping broadcast');
  expect(text).toContain('PING');

  await act(async () => tree.unmount());
});
