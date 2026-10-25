import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import BookingManageScreen from '../src/screens/BookingManageScreen';
import EmployeeDashboard from '../src/screens/EmployeeDashboard';
import {
  cancelBookingSubmission,
  clearBookingSubmissions,
  getBookedDateKeys,
  getBookingSubmissions,
  getScheduledSubmissions,
  getSubmissionForDate,
  isBookingDateTaken,
  requestBookingSlot,
} from '../src/services/bookingConflictService';
import { clearBookingSession } from '../src/services/bookingDraftService';

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
  clearBookingSession();
  clearBookingSubmissions();
});

function bookShow() {
  return requestBookingSlot({
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
  }).submission;
}

test('cancelling a booking frees its date for a new request', () => {
  const submission = bookShow();
  expect(isBookingDateTaken('2026-12-05')).toBe(true);
  expect(getBookedDateKeys()).toEqual(['2026-12-05']);

  const cancelled = cancelBookingSubmission(submission.id);
  expect(cancelled).toMatchObject({ id: submission.id, status: 'cancelled' });
  expect(isBookingDateTaken('2026-12-05')).toBe(false);
  expect(getSubmissionForDate('2026-12-05')).toBeNull();
  expect(getBookingSubmissions()).toHaveLength(0);
  expect(getScheduledSubmissions()).toHaveLength(0);
  expect(getBookedDateKeys()).toEqual([]);

  // The freed date accepts a different client's request again.
  const replacement = requestBookingSlot({
    id: 'booking-2',
    eventName: 'Marina Lights',
    date: '2026-12-05',
    timeSlot: '8:00 PM',
    venueName: 'Marina Bay Event Deck',
    city: 'Singapore',
  });
  expect(replacement.ok).toBe(true);
  expect(getBookedDateKeys()).toEqual(['2026-12-05']);

  // Cancelling twice or cancelling an unknown booking is a no-op.
  expect(cancelBookingSubmission(submission.id)).toBeNull();
  expect(cancelBookingSubmission('missing-submission')).toBeNull();
});

test('the manage screen confirms before cancelling and reports the released date', async () => {
  const submission = bookShow();
  const navigation = { navigate: jest.fn() };

  let tree;
  await act(async () => {
    tree = create(<BookingManageScreen route={{ params: { submission } }} navigation={navigation} />);
  });

  expect(textOf(tree)).toContain('Manage this show.');
  expect(textOf(tree)).toContain('Harbour Night Market');
  expect(textOf(tree)).toContain('REQ-20261205-2100');
  expect(textOf(tree)).toContain('Sat, 5 Dec 2026');
  expect(textOf(tree)).toContain('Marina Bay Event Deck');
  expect(textOf(tree)).toContain('200 drones');

  // Cancellation requires a second, explicit confirmation.
  await act(async () => findButton(tree, 'Cancel booking').props.onPress());
  expect(textOf(tree)).toContain('Cancel this booking?');
  expect(textOf(tree)).toContain('This cannot be undone.');
  expect(tree.root.findAll((node) => node.props.testID === 'cancel-confirmation').length).toBeGreaterThan(0);

  await act(async () => findButton(tree, 'Keep booking').props.onPress());
  expect(tree.root.findAll((node) => node.props.testID === 'cancel-confirmation')).toHaveLength(0);
  expect(isBookingDateTaken('2026-12-05')).toBe(true);

  await act(async () => findButton(tree, 'Cancel booking').props.onPress());
  await act(async () => findButton(tree, 'Yes, cancel booking').props.onPress());

  expect(textOf(tree)).toContain('Booking cancelled.');
  expect(textOf(tree)).toContain('● CANCELLED');
  expect(textOf(tree)).toContain('available to book again');
  expect(tree.root.findAll((node) => node.props.testID === 'cancelled-state').length).toBeGreaterThan(0);
  expect(isBookingDateTaken('2026-12-05')).toBe(false);
  expect(getBookingSubmissions()).toHaveLength(0);

  await act(async () => findButton(tree, 'Back to dashboard').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('EmployeeDashboard');

  await act(async () => findButton(tree, 'Schedule another show').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingDateVenue');

  await act(async () => tree.unmount());
});

test('the dashboard routes the booked show into the manage screen', async () => {
  const submission = bookShow();
  const navigation = { navigate: jest.fn() };

  let tree;
  await act(async () => {
    tree = create(<EmployeeDashboard navigation={navigation} />);
  });

  await act(async () => findButton(tree, 'Manage event for Harbour Night Market').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingManage', {
    submission: expect.objectContaining({ id: submission.id, eventName: 'Harbour Night Market' }),
  });

  await act(async () => tree.unmount());

  // A cancelled show drops out of the dashboard's upcoming list.
  cancelBookingSubmission(submission.id);
  await act(async () => {
    tree = create(<EmployeeDashboard navigation={{ navigate: jest.fn() }} />);
  });
  expect(textOf(tree)).toContain('No shows booked yet.');
  await act(async () => tree.unmount());
});
