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
const findButton = (tree, label) => tree.root.findAll(
  (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
)[0];
const findTab = (tree, key) => tree.root.findAll((node) => node.props.testID === `events-filter-${key}`)[0];

const booking = (overrides = {}) => ({
  id: 'booking-1',
  eventName: 'Harbour Night Market',
  date: '2027-01-09',
  timeSlot: '9:00 PM',
  timeZone: 'Asia/Singapore',
  timeZoneLabel: 'Singapore · SGT (UTC+8)',
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

test('the events feed shows the aggregate metrics, confirmed shows and pending review', async () => {
  let tree;
  await act(async () => { tree = create(<EmployeeEventsScreen navigation={{ navigate: jest.fn() }} />); });

  const text = textOf(tree);
  expect(text).toContain('CLIENT SCHEDULE // 2026');
  expect(text).toContain('Your events');
  expect(text).toContain('2 scheduled shows • 1 request in review');
  expect(text).toContain('UPCOMING // VENUE LOCAL TIME • UTC+8');
  expect(text).toContain('Apex Global Summit');
  expect(text).toContain('CONFIRMED');
  expect(text).toContain('Sat, 14 Nov 2026 • 8:00 PM SGT');
  expect(text).toContain('Marina Bay Event Deck • Singapore');
  expect(text).toContain('NOV');
  expect(text).toContain('14');
  expect(text).toContain('Apex Partner Night');
  expect(text).toContain('Sat, 12 Dec 2026 • 8:30 PM SGT');
  expect(text).toContain('Apex Product Launch • 5 Dec');
  expect(text).toContain('Venue & airspace review pending.');
  expect(findTab(tree, 'upcoming').props.accessibilityState).toEqual({ selected: true });
  expect(findButton(tree, 'Upcoming (2)')).toBeTruthy();
  expect(findButton(tree, 'Requests (1)')).toBeTruthy();
  expect(findButton(tree, 'Past')).toBeTruthy();
  expect(tree.root.findAll((node) => node.props.testID === 'events-empty')).toHaveLength(0);
  expect(tree.root.find((node) => node.props.accessibilityLabel === 'EVENTS navigation').props.accessibilityState.selected).toBe(true);

  await act(async () => tree.unmount());
});

test('switching filters swaps the feed and its time-zone helper without a reload', async () => {
  let tree;
  await act(async () => { tree = create(<EmployeeEventsScreen navigation={{ navigate: jest.fn() }} />); });

  await act(async () => findButton(tree, 'Requests (1)').props.onPress());
  let text = textOf(tree);
  expect(text).toContain('REQUESTS // VENUE LOCAL TIME • UTC+8');
  expect(text).toContain('Apex Product Launch');
  expect(text).toContain('PENDING REVIEW');
  expect(text).toContain('Sat, 5 Dec 2026 • 8:00 PM SGT');
  expect(text).not.toContain('Apex Global Summit');
  expect(findTab(tree, 'requests').props.accessibilityState).toEqual({ selected: true });

  await act(async () => findButton(tree, 'Past').props.onPress());
  text = textOf(tree);
  expect(text).toContain('PAST // VENUE LOCAL TIME • UTC+8');
  expect(text).toContain('Apex Summer Showcase');
  expect(text).toContain('COMPLETED');
  expect(text).toContain('Sat, 22 Aug 2026 • 9:00 PM SGT');
  expect(text).not.toContain('Apex Partner Night');

  await act(async () => findButton(tree, 'Upcoming (2)').props.onPress());
  text = textOf(tree);
  expect(text).toContain('UPCOMING // VENUE LOCAL TIME • UTC+8');
  expect(text).toContain('Apex Global Summit');
  expect(text).toContain('Apex Partner Night');

  await act(async () => tree.unmount());
});

test('a card link and its arrow both open that show in management', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => { tree = create(<EmployeeEventsScreen navigation={navigation} />); });

  await act(async () => findButton(tree, 'View event & manage for Apex Global Summit').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingManage', {
    submission: expect.objectContaining({ id: 'demo-apex-summit', eventName: 'Apex Global Summit' }),
  });

  navigation.navigate.mockClear();
  await act(async () => findButton(tree, 'Open event dashboard for Apex Partner Night').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingManage', {
    submission: expect.objectContaining({ id: 'demo-apex-partner-night', eventName: 'Apex Partner Night' }),
  });

  await act(async () => tree.unmount());
});

test('the pending alert and Credits button use their existing routes', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => { tree = create(<EmployeeEventsScreen navigation={navigation} />); });

  await act(async () => findButton(tree, 'Review request for Apex Product Launch').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingManage', {
    submission: expect.objectContaining({ id: 'demo-apex-product-launch' }),
  });

  await act(async () => findButton(tree, 'Credits').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('Credits');

  // The schedule wizard is reached from the SCHEDULE tab, not a feed CTA.
  expect(findButton(tree, '+ Schedule another show')).toBeUndefined();

  await act(async () => tree.unmount());
});

test('confirmed cards show clock and location icons in their logistics rows', async () => {
  let tree;
  await act(async () => { tree = create(<EmployeeEventsScreen navigation={{ navigate: jest.fn() }} />); });

  const card = tree.root.findByProps({ testID: 'event-card-demo-apex-summit' });
  const icons = card.findAll((node) => node.props.type === 'clock' || node.props.type === 'pin');
  expect(icons.map((icon) => icon.props.type).sort()).toEqual(['clock', 'pin']);
  expect(card.findAllByProps({ testID: 'event-schedule-demo-apex-summit' }).length).toBeGreaterThan(0);
  expect(card.findAllByProps({ testID: 'event-venue-demo-apex-summit' }).length).toBeGreaterThan(0);

  await act(async () => tree.unmount());
});

test('the metrics and request list follow ledger submissions instead of demo fixtures', async () => {
  requestBookingSlot(booking({ id: 'booking-late', eventName: 'New Year Drone Gala', date: '2027-02-14', timeSlot: '11:30 PM' }));
  requestBookingSlot(booking({ id: 'booking-early', date: '2027-01-09', timeSlot: '9:00 PM' }));

  let tree;
  await act(async () => {
    tree = create(<EmployeeEventsScreen seedDemoData={false} navigation={{ navigate: jest.fn() }} />);
  });

  expect(textOf(tree)).toContain('0 scheduled shows • 2 requests in review');
  expect(findButton(tree, 'Requests (2)')).toBeTruthy();

  await act(async () => findButton(tree, 'Requests (2)').props.onPress());
  const text = textOf(tree);
  expect(text).toContain('Harbour Night Market');
  expect(text).toContain('New Year Drone Gala');
  expect(text.indexOf('Harbour Night Market')).toBeLessThan(text.indexOf('New Year Drone Gala'));
  expect(text).toContain('Sat, 9 Jan 2027 • 9:00 PM SGT');
  expect(text).toContain('Sun, 14 Feb 2027 • 11:30 PM SGT');

  await act(async () => tree.unmount());
});

test('each filter has its own empty state', async () => {
  let tree;
  await act(async () => {
    tree = create(<EmployeeEventsScreen seedDemoData={false} navigation={{ navigate: jest.fn() }} />);
  });

  expect(textOf(tree)).toContain('0 scheduled shows • 0 requests in review');
  expect(textOf(tree)).toContain('No upcoming shows.');
  expect(tree.root.findAll((node) => node.props.testID === 'events-empty').length).toBeGreaterThan(0);

  await act(async () => findButton(tree, 'Requests (0)').props.onPress());
  expect(textOf(tree)).toContain('No open requests.');

  await act(async () => findButton(tree, 'Past').props.onPress());
  expect(textOf(tree)).toContain('No past shows.');

  await act(async () => tree.unmount());
});
