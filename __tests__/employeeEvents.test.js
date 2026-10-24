import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import EmployeeDashboard from '../src/screens/EmployeeDashboard';
import EmployeeEventsScreen from '../src/screens/EmployeeEventsScreen';
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

const booking = (overrides = {}) => ({
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
  ...overrides,
});

test('the dashboard EVENTS tab opens the events screen', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => { tree = create(<EmployeeDashboard navigation={navigation} />); });

  const eventsTab = tree.root.find((node) => node.props.accessibilityLabel === 'EVENTS navigation');
  await act(async () => eventsTab.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('EmployeeEvents');
  await act(async () => tree.unmount());
});

test('the dashboard view all link opens the events screen', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => { tree = create(<EmployeeDashboard navigation={navigation} />); });

  const link = tree.root.find((node) => node.props.accessibilityLabel === 'View all shows');
  await act(async () => link.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('EmployeeEvents');
  await act(async () => tree.unmount());
});

test('the events screen shows an empty state without submissions', async () => {
  let tree;
  await act(async () => { tree = create(<EmployeeEventsScreen navigation={{ navigate: jest.fn() }} />); });

  const text = textOf(tree);
  expect(text).toContain('All scheduled events');
  expect(text).toContain('Nothing on the schedule yet.');
  expect(text).toContain('No shows booked yet.');
  expect(tree.root.findAll((node) => node.props.testID === 'events-list')).toHaveLength(0);
  await act(async () => tree.unmount());
});

test('the events screen lists every scheduled show in date order', async () => {
  requestBookingSlot(booking({ id: 'booking-late', eventName: 'New Year Drone Gala', date: '2026-12-31', timeSlot: '11:30 PM' }));
  requestBookingSlot(booking({ id: 'booking-early' }));

  let tree;
  await act(async () => { tree = create(<EmployeeEventsScreen navigation={{ navigate: jest.fn() }} />); });

  const text = textOf(tree);
  expect(text).toContain('02 events on the schedule.');
  expect(text).toContain('New Year Drone Gala');
  expect(text).toContain('Harbour Night Market');
  expect(text).toContain('Sat, 5 Dec 2026 · 9:00 PM');
  expect(text).toContain('Thu, 31 Dec 2026 · 11:30 PM');
  expect(text).toContain('Singapore · Singapore Time (SGT) · 10-minute show');
  expect(text).toContain('Marina Bay Event Deck');
  expect(text).toContain('Singapore 018956 · 200 drones');
  expect(text.indexOf('Harbour Night Market')).toBeLessThan(text.indexOf('New Year Drone Gala'));
  expect(tree.root.findAll((node) => node.props.testID === 'events-empty')).toHaveLength(0);

  await act(async () => tree.unmount());
});

test('managing an event from the list opens the booking management screen', async () => {
  requestBookingSlot(booking({ id: 'booking-1' }));

  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => { tree = create(<EmployeeEventsScreen navigation={navigation} />); });

  const manage = tree.root.find((node) => node.props.accessibilityLabel === 'Manage event for Harbour Night Market');
  await act(async () => manage.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingManage', {
    submission: expect.objectContaining({ id: expect.any(String), eventName: 'Harbour Night Market' }),
  });
  await act(async () => tree.unmount());
});
