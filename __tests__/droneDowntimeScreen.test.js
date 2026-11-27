import React from 'react';
import { act, create } from 'react-test-renderer';
import { TextInput } from 'react-native';
import DroneDowntimeScreen from '../src/screens/DroneDowntimeScreen';
import {
  getDowntimeRecords,
  getLaunchReadyFleet,
  resetFleetForTests,
} from '../src/services/droneDowntimeService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => resetFleetForTests());

const navigation = { goBack: jest.fn(), navigate: jest.fn() };

async function renderScreen(droneId) {
  let tree;
  await act(async () => {
    tree = create(<DroneDowntimeScreen navigation={navigation} route={{ params: { droneId } }} />);
  });
  return tree;
}

function byLabel(tree, label) {
  return tree.root.find((node) => node.props.accessibilityLabel === label);
}

function testId(tree, id) {
  return tree.root.find((node) => node.props.testID === id);
}

async function type(tree, label, value) {
  await act(async () => byLabel(tree, label).props.onChangeText(value));
}

async function press(tree, label) {
  await act(async () => byLabel(tree, label).props.onPress());
}

test('the flag area offers available, maintenance and grounded downtime for every drone', async () => {
  const tree = await renderScreen('SF-Q-001');

  expect(testId(tree, 'drone-availability').props.children).toBe('Available');
  expect(testId(tree, 'launch-ready').props.children).toBe('● LAUNCH-READY');
  for (const state of ['Available', 'Maintenance', 'Grounded/Downtime']) {
    expect(testId(tree, `state-option-${state}`)).toBeTruthy();
    expect(byLabel(tree, state).props.accessibilityRole).toBe('radio');
  }

  await press(tree, 'Back to fleet manifest');
  expect(navigation.goBack).toHaveBeenCalled();

  await act(async () => tree.unmount());
});

test('flagging a drone for grounded downtime removes it from launch-ready until the follow-up is closed', async () => {
  const tree = await renderScreen('SF-Q-001');

  await type(tree, 'Issue', 'Damaged arm');
  await type(tree, 'Work performed', 'Inspected arm');
  await type(tree, 'Responsible staff member', 'Alex');
  await press(tree, 'Grounded/Downtime');
  await press(tree, 'Flag drone for service');

  expect(getLaunchReadyFleet().some((drone) => drone.id === 'SF-Q-001')).toBe(false);
  expect(testId(tree, 'drone-availability').props.children).toBe('Grounded/Downtime');
  expect(testId(tree, 'launch-ready').props.children).toBe('✕ NOT LAUNCH-READY');
  expect(testId(tree, 'open-follow-up').props.children.join('')).toContain('Damaged arm');
  expect(testId(tree, 'open-follow-up').props.children.join('')).toContain('Alex');
  const [record] = getDowntimeRecords('SF-Q-001');
  expect(record).toMatchObject({ status: 'Open', issue: 'Damaged arm' });
  expect(record.createdAt).toBeTruthy();
  expect(record.history[0]).toMatchObject({ staff: 'Alex', workPerformed: 'Inspected arm', availability: 'Grounded/Downtime' });

  // Saving follow-up work without closing keeps the drone parked.
  await type(tree, 'Work performed', 'Awaiting replacement arm');
  await press(tree, 'Save follow-up');
  expect(testId(tree, 'launch-ready').props.children).toBe('✕ NOT LAUNCH-READY');

  await type(tree, 'Work performed', 'Arm replaced');
  await type(tree, 'Responsible staff member', 'Sam');
  await press(tree, 'Available');
  await press(tree, 'Close follow-up');
  expect(testId(tree, 'launch-ready').props.children).toBe('● LAUNCH-READY');
  expect(getLaunchReadyFleet().some((drone) => drone.id === 'SF-Q-001')).toBe(true);
  const [closed] = getDowntimeRecords('SF-Q-001');
  expect(closed.history.map((event) => event.action)).toEqual(['Created', 'Updated', 'Closed']);
  expect(closed.history[2]).toMatchObject({ staff: 'Sam', workPerformed: 'Arm replaced', availability: 'Available' });

  await act(async () => tree.unmount());
});

test('on-the-spot maintenance is captured with staff and timestamp and leaves the drone launch-ready', async () => {
  const tree = await renderScreen('SF-Q-002');

  await type(tree, 'Issue', 'Chipped propeller');
  await type(tree, 'Work performed', 'Replaced propeller');
  await type(tree, 'Responsible staff member', 'Riley');
  await press(tree, 'Available');
  // A finished job does not ask for a future service time.
  expect(tree.root.findAllByType(TextInput).some((input) => input.props.accessibilityLabel === 'Scheduled service time')).toBe(false);
  await press(tree, 'Log on-the-spot maintenance');

  expect(testId(tree, 'drone-availability').props.children).toBe('Available');
  expect(testId(tree, 'launch-ready').props.children).toBe('● LAUNCH-READY');
  const [record] = getDowntimeRecords('SF-Q-002');
  expect(record).toMatchObject({ status: 'Closed', issue: 'Chipped propeller' });
  expect(record.history[0]).toMatchObject({ staff: 'Riley', workPerformed: 'Replaced propeller' });
  expect(getLaunchReadyFleet().some((drone) => drone.id === 'SF-Q-002')).toBe(true);

  await act(async () => tree.unmount());
});
