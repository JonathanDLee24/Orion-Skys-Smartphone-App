import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import BookingConflictScreen from '../src/screens/BookingConflictScreen';
import BookingSubmittedScreen from '../src/screens/BookingSubmittedScreen';
import {
  DATE_CONFLICT,
  clearBookingSubmissions,
  formatUnavailableSlot,
  getBookingSubmissions,
  getSubmissionForDate,
  getUnavailableSlot,
  isBookingDateTaken,
  requestBookingSlot,
} from '../src/services/bookingConflictService';
import { clearBookingSession, saveBookingDraft } from '../src/services/bookingDraftService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const findButton = (tree, label) => tree.root.findAll((node) => node.props.accessibilityLabel === label && node.props.onPress)[0];

beforeEach(() => {
  clearBookingSession();
  clearBookingSubmissions();
});

test('submitted bookings claim a whole date in a temporary ledger', () => {
  const booking = {
    id: 'booking-1',
    eventName: 'Apex Year-end Celebration',
    date: '2026-11-21',
    timeSlot: '8:00 PM',
    timeZone: 'America/Los_Angeles',
    venueName: 'Marina Bay Event Deck',
  };

  const first = requestBookingSlot(booking);
  expect(first.ok).toBe(true);
  expect(first.submission).toMatchObject({
    reference: 'REQ-20261121-2000',
    bookingId: 'booking-1',
    date: '2026-11-21',
    timeSlot: '8:00 PM',
    status: 'pending',
  });
  expect(getBookingSubmissions()).toHaveLength(1);
  expect(getSubmissionForDate('2026-11-21')).toMatchObject({ bookingId: 'booking-1' });
  expect(isBookingDateTaken('2026-11-21')).toBe(true);
  expect(isBookingDateTaken('2026-11-22')).toBe(false);

  // Re-sending the same booking is idempotent instead of a self-inflicted conflict.
  expect(requestBookingSlot(booking)).toMatchObject({ ok: true, repeated: true });
  expect(getBookingSubmissions()).toHaveLength(1);

  // One show per day: a different time on the claimed date is still a conflict.
  const conflict = requestBookingSlot({ id: 'booking-2', date: '2026-11-21', timeSlot: '9:00 PM' });
  expect(conflict.ok).toBe(false);
  expect(conflict.error).toMatchObject({
    code: DATE_CONFLICT,
    unavailableSlot: { date: '2026-11-21', timeSlot: '9:00 PM' },
  });

  // A free date still submits.
  expect(requestBookingSlot({ id: 'booking-3', date: '2026-11-22', timeSlot: '9:00 PM' }).ok).toBe(true);
  expect(getBookingSubmissions()).toHaveLength(2);

  expect(requestBookingSlot({ id: 'booking-4' }).ok).toBe(false);
});

test('the confirmation screen shows the saved request and its next actions', async () => {
  const booking = saveBookingDraft({
    eventName: 'Apex Year-end Celebration',
    date: '2026-11-21',
    dateLabel: 'SAT, 21 NOV // PST (UTC-8)',
    timeSlot: '8:00 PM',
    timeZone: 'America/Los_Angeles',
    timeZoneLabel: 'California · Pacific Time (PT)',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 200,
    durationMinutes: 10,
  });
  const submission = requestBookingSlot(booking).submission;
  const navigation = { navigate: jest.fn() };

  let tree;
  await act(async () => {
    tree = create(<BookingSubmittedScreen route={{ params: { booking, submission } }} navigation={navigation} />);
  });

  const text = textOf(tree);
  expect(text).toContain('NEW BOOKING // REQUEST SUBMITTED');
  expect(text).toContain("You're in the review queue.");
  expect(text).toContain('BOOKING REQUEST RECEIVED');
  expect(text).toContain('Your request has been sent to operations. Your show is not confirmed yet.');
  expect(text).toContain('PENDING REVIEW');
  expect(text).toContain('REQ-20261121-2000');
  expect(text).toContain('Sat, 21 Nov 2026 · 8:00 PM');
  expect(text).toContain('California · Pacific Time (PT)');
  expect(text).toContain('Marina Bay Event Deck · Singapore');
  expect(text).toContain('200 drones');
  expect(text).toContain('10 minutes');
  expect(text).toContain('WHAT HAPPENS NEXT');
  expect(text).toContain('Venue & airspace review');
  expect(text).toContain('Quote & show agreement');
  expect(text).toContain('Show confirmation');
  expect(text).toContain('A request receipt will be sent to');
  expect(text).toContain('kenneth.elliott@csus.edu');
  expect(text).toContain('temporarily saved on this device');

  const progress = tree.root.findAll((node) => node.props.accessibilityRole === 'progressbar')[0];
  expect(progress.props.accessibilityValue.now).toBe(3);

  await act(async () => findButton(tree, 'View my requests').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('EmployeeDashboard');

  await act(async () => findButton(tree, 'Schedule another show').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingDateVenue');

  await act(async () => tree.unmount());
});

test('parses and formats the exact backend slot signature', () => {
  expect(formatUnavailableSlot({ date: '2026-11-21', timeSlot: '8:00 PM' })).toBe('Sat, 21 Nov 2026 · 8:00 PM');
  expect(getUnavailableSlot({ error: { unavailableSlot: '2026-11-21T20:00:00Z' } })).toEqual({
    date: '2026-11-21',
    timeSlot: '8:00 PM',
  });
  expect(getUnavailableSlot({ unavailableSlot: { dateKey: '2026-12-05', time: '9:00 PM' } })).toEqual({
    date: '2026-12-05',
    timeSlot: '9:00 PM',
  });
});

test('the conflict screen restores cached details and routes back to scheduling or review', async () => {
  const saved = saveBookingDraft({
    eventName: 'Apex Year-end Celebration',
    date: '2026-11-21',
    dateLabel: 'SAT, 21 NOV // PST (UTC-8)',
    timeSlot: '8:00 PM',
    timeZone: 'America/Los_Angeles',
    timeZoneLabel: 'California · Pacific Time (PT)',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
  });
  const navigation = { navigate: jest.fn() };

  let tree;
  await act(async () => {
    tree = create(
      <BookingConflictScreen
        route={{ params: { booking: saved, conflict: { unavailableSlot: { date: '2026-11-21', timeSlot: '8:00 PM' } } } }}
        navigation={navigation}
      />
    );
  });

  const text = textOf(tree);
  expect(text).toContain('NEW BOOKING // SCHEDULING CONFLICT');
  expect(text).toContain('That date was just booked.');
  expect(text).toContain('No worries—your event details are still saved.');
  expect(text).toContain('DATE NO LONGER AVAILABLE');
  expect(text).toContain('Shows run once per day');
  expect(text).toContain('Sat, 21 Nov 2026');
  expect(text).toContain('YOUR EVENT DETAILS');
  expect(text).toContain('● SAVED');
  expect(text).toContain('Apex Year-end Celebration');
  expect(text).toContain('California · Pacific Time (PT)');
  expect(text).toContain('Marina Bay Event Deck');
  expect(text).toContain('10 Bayfront Avenue, Singapore 018956');
  expect(text).toContain('200 drones');
  expect(text).toContain('10 minutes');
  expect(text).toContain('Choose another date');
  expect(text).toContain('← Return to schedule');

  const progress = tree.root.findAll((node) => node.props.accessibilityRole === 'progressbar')[0];
  expect(progress.props.accessibilityValue.now).toBe(2);

  await act(async () => findButton(tree, 'BACK TO REVIEW').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingReview', { booking: saved });

  await act(async () => findButton(tree, 'Choose another date').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingDateVenue', { booking: saved, focusCalendar: true });

  await act(async () => findButton(tree, 'Return to schedule').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledTimes(3);

  await act(async () => tree.unmount());
});

test('the conflict screen falls back to the latest cached draft when no params are supplied', async () => {
  saveBookingDraft({
    eventName: 'Apex Year-end Celebration',
    date: '2026-11-21',
    dateLabel: 'SAT, 21 NOV // PST (UTC-8)',
    timeSlot: '8:00 PM',
    timeZone: 'America/Los_Angeles',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
  });

  let tree;
  await act(async () => {
    tree = create(<BookingConflictScreen route={{ params: {} }} navigation={{ navigate: jest.fn() }} />);
  });

  const text = textOf(tree);
  expect(text).toContain('Apex Year-end Celebration');
  expect(text).toContain('Sat, 21 Nov 2026');

  await act(async () => tree.unmount());
});
