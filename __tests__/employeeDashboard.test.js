import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import EmployeeDashboard from '../src/screens/EmployeeDashboard';
import WelcomeScreen from '../src/screens/WelcomeScreen';
import { clearBookingSubmissions, requestBookingSlot } from '../src/services/bookingConflictService';
import { clearBookingSession } from '../src/services/bookingDraftService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  clearBookingSession();
  clearBookingSubmissions();
});

const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');

test('welcome screen does not expose the employee dashboard directly', async () => {
  let tree;
  await act(async () => { tree = create(<WelcomeScreen navigation={{ navigate: jest.fn() }} />); });
  expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'Employee Dashboard')).toHaveLength(0);
  await act(async () => tree.unmount());
});

test('welcome admin option opens the admin sign in screen', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => { tree = create(<WelcomeScreen navigation={navigation} />); });

  const button = tree.root.find((node) => node.props.accessibilityLabel === 'Admin Sign In');
  await act(async () => button.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('AdminLogin');
  await act(async () => tree.unmount());
});

test('employee dashboard renders its content and bottom navigation', async () => {
  let tree;
  await act(async () => { tree = create(<EmployeeDashboard navigation={{ navigate: jest.fn() }} />); });

  const text = textOf(tree);
  expect(text).toContain('Welcome back, Kenneth');
  expect(text).toContain('SCHEDULED SHOWS');
  expect(text).toContain('HOME');
  expect(text).toContain('ACCOUNT');
  // Nothing has been submitted yet, so the placeholder show must not appear.
  expect(text).toContain('No shows booked yet.');
  expect(text).not.toContain('Apex Global Summit');
  await act(async () => tree.unmount());
});

test('employee dashboard shows the show that was actually submitted', async () => {
  requestBookingSlot({
    id: 'booking-1',
    eventName: 'Harbour Night Market',
    date: '2026-12-05',
    timeSlot: '9:00 PM',
    timeZone: 'Asia/Singapore',
    timeZoneLabel: 'Singapore · Singapore Time (SGT)',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 200,
    durationMinutes: 10,
  });

  let tree;
  await act(async () => { tree = create(<EmployeeDashboard navigation={{ navigate: jest.fn() }} />); });

  const text = textOf(tree);
  expect(text).toContain('Harbour Night Market');
  expect(text).toContain('REQ-20261205-2100');
  expect(text).toContain('Sat, 5 Dec 2026 · 9:00 PM');
  expect(text).toContain('IN REVIEW');
  expect(text).toContain('Singapore · Singapore Time (SGT) · 10-minute show');
  expect(text).toContain('Marina Bay Event Deck');
  expect(text).toContain('Singapore · 200 drones');
  expect(text).not.toContain('Apex Global Summit');
  expect(tree.root.findAll((node) => node.props.testID === 'next-show-empty')).toHaveLength(0);

  await act(async () => tree.unmount());
});
