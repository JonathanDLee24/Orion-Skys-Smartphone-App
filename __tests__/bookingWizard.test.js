import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import BookingDateVenueScreen from '../src/screens/BookingDateVenueScreen';
import BookingReviewScreen from '../src/screens/BookingReviewScreen';
import EmployeeDashboard from '../src/screens/EmployeeDashboard';
import {
  bookingSession,
  clearBookingSession,
  isVenueDetailsComplete,
  saveBookingDraft,
  validateVenueDetails,
} from '../src/services/bookingDraftService';
import { clearBookingSubmissions, requestBookingSlot } from '../src/services/bookingConflictService';
import {
  buildMonthGrid,
  formatMonthYear,
  formatSelectedDate,
  getEarliestBookableDate,
} from '../src/utils/bookingCalendar';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const textOf = (tree) => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');
const findButton = (tree, label) => tree.root.findAll((node) => node.props.accessibilityLabel === label)[0];
const findInput = (tree, label) => tree.root.findAll((node) => node.props.accessibilityLabel === label)[0];
const visibleMonthLabel = (tree) => tree.root.findAll((node) => node.props.testID === 'calendar-month-label')[0].props.children;

// Page forward until the month the test wants to tap in is on screen.
async function goToMonth(tree, target) {
  for (let attempt = 0; attempt < 24 && visibleMonthLabel(tree) !== target; attempt += 1) {
    await act(async () => findButton(tree, 'Next month').props.onPress());
  }
  expect(visibleMonthLabel(tree)).toBe(target);
}

async function pressDay(tree, dateKey) {
  const day = tree.root.findAll((node) => node.props.testID === `calendar-day-${dateKey}`)[0];
  await act(async () => day.props.onPress());
}

beforeEach(() => {
  clearBookingSession();
  clearBookingSubmissions();
});

test('the grid allows Sundays and opens dates seven days out', () => {
  const cells = buildMonthGrid(2026, 10, new Date(2026, 9, 19));
  expect(cells).toHaveLength(42);
  expect(cells[0]).toMatchObject({ day: 1, inMonth: true, available: true });
  expect(cells[1]).toMatchObject({ day: 2, inMonth: true, available: true });
  expect(cells.find((cell) => cell.day === 21 && cell.inMonth)).toMatchObject({ available: true });
  expect(cells.find((cell) => cell.day === 22 && cell.inMonth)).toMatchObject({ available: true });
  expect(cells.some((cell) => !cell.inMonth && cell.available)).toBe(false);

  const october = buildMonthGrid(2026, 9, new Date(2026, 9, 19));
  expect(october.find((cell) => cell.day === 25 && cell.inMonth)).toMatchObject({ available: false });
  expect(october.find((cell) => cell.day === 26 && cell.inMonth)).toMatchObject({ available: true });
  expect(formatSelectedDate(new Date(2026, 10, 21))).toBe('SAT, 21 NOV // PST (UTC-8)');
});

test('venue validation requires every location string', () => {
  expect(validateVenueDetails({})).toEqual({
    venueName: 'Required',
    streetAddress: 'Required',
    city: 'Required',
    postalCode: 'Required',
  });
  expect(validateVenueDetails({ venueName: 'Deck', streetAddress: '1 Bay', city: 'Singapore', postalCode: '018956' })).toEqual({});
  expect(isVenueDetailsComplete({ venueName: '  ', streetAddress: '1 Bay', city: 'Singapore', postalCode: '018956' })).toBe(false);
});

test('drafts are trimmed and appended to the session cache', () => {
  const saved = saveBookingDraft({
    date: '2026-11-21',
    timeSlot: '8:00 PM',
    venueName: '  Marina Bay Event Deck ',
    streetAddress: ' 10 Bayfront Avenue ',
    city: ' Singapore ',
    postalCode: ' 018956 ',
  });
  expect(saved).toMatchObject({
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    status: 'review',
  });
  expect(bookingSession.bookings).toHaveLength(1);
  expect(bookingSession.bookings[0].id).toBe(saved.id);
});

test('date and venue step opens with nothing selected until a day is tapped', async () => {
  let tree;
  await act(async () => {
    tree = create(<BookingDateVenueScreen navigation={{ navigate: jest.fn() }} />);
  });

  const text = textOf(tree);
  expect(text).toContain('NEW BOOKING // DATE & VENUE');
  expect(text).toContain('Schedule a show.');
  expect(text).toContain('DATE & VENUE');
  expect(text).toContain('REVIEW');
  expect(text).toContain('REQUEST');
  expect(text).toContain(formatMonthYear(getEarliestBookableDate()));
  expect(text).toContain('SELECT A DATE');
  expect(text).toContain('12:00 AM');
  expect(text).toContain('8:00 PM');
  expect(text).toContain('11:00 PM');
  expect(tree.root.findAll((node) => node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function')).toHaveLength(24);
  expect(findInput(tree, 'Venue name').props.value).toBe('Marina Bay Event Deck');
  expect(findInput(tree, 'Street address').props.value).toBe('10 Bayfront Avenue');
  expect(findInput(tree, 'City or country').props.value).toBe('Singapore');
  expect(findInput(tree, 'Postal code').props.value).toBe('018956');
  expect(text).toContain('Continue to booking review');
  expect(text).toContain('All dates and times are illustrative.');
  expect(findButton(tree, '8:00 PM').props.accessibilityState).toEqual({ checked: true });

  // No day is highlighted before the user chooses one.
  const dayCells = tree.root.findAll((node) => typeof node.props.testID === 'string'
    && node.props.testID.startsWith('calendar-day-')
    && typeof node.props.onPress === 'function');
  expect(dayCells.length).toBeGreaterThan(0);
  expect(dayCells.every((node) => node.props.accessibilityState.selected === false)).toBe(true);
  expect(findButton(tree, 'Continue to booking review').props.accessibilityState.disabled).toBe(true);

  await goToMonth(tree, 'November 2026');
  await pressDay(tree, '2026-11-21');

  expect(textOf(tree)).toContain('SAT, 21 NOV // UTC+8');
  const chosenDay = tree.root.findAll((node) => node.props.testID === 'calendar-day-2026-11-21')[0];
  expect(chosenDay.props.accessibilityState.selected).toBe(true);
  expect(findButton(tree, 'Continue to booking review').props.accessibilityState.disabled).toBe(false);

  await act(async () => tree.unmount());
});

test('calendar pages across months and updates the selected time label', async () => {
  let tree;
  await act(async () => {
    tree = create(<BookingDateVenueScreen navigation={{ navigate: jest.fn() }} />);
  });

  await goToMonth(tree, 'December 2026');
  await pressDay(tree, '2026-12-05');
  expect(textOf(tree)).toContain('SAT, 5 DEC // UTC+8');
  expect(textOf(tree)).toContain('December 2026');

  await act(async () => findButton(tree, 'Previous month').props.onPress());
  expect(textOf(tree)).toContain('November 2026');

  await act(async () => tree.unmount());
});

test('the month and year picker jumps straight to a future month', async () => {
  let tree;
  await act(async () => {
    tree = create(<BookingDateVenueScreen navigation={{ navigate: jest.fn() }} />);
  });

  await act(async () => findButton(tree, 'Select month and year').props.onPress());
  expect(tree.root.findAll((node) => node.props.testID === 'calendar-month-year-panel').length).toBeGreaterThan(0);

  await act(async () => tree.root.findAll((node) => node.props.testID === 'calendar-year-2027')[0].props.onPress());
  await act(async () => tree.root.findAll((node) => node.props.testID === 'calendar-month-2027-03')[0].props.onPress());

  expect(textOf(tree)).toContain('March 2027');
  expect(tree.root.findAll((node) => node.props.testID === 'calendar-month-year-panel')).toHaveLength(0);

  await act(async () => tree.unmount());
});

test('the venue postal code selects the booking time zone', async () => {
  let tree;
  await act(async () => {
    tree = create(<BookingDateVenueScreen navigation={{ navigate: jest.fn() }} />);
  });

  expect(textOf(tree)).toContain('SELECT A DATE');
  expect(textOf(tree)).toContain('TIME ZONE · Singapore · SGT (UTC+8)');

  await goToMonth(tree, 'November 2026');
  await pressDay(tree, '2026-11-21');
  expect(textOf(tree)).toContain('SAT, 21 NOV // UTC+8');

  await act(async () => findInput(tree, 'Postal code').props.onChangeText('10001'));
  expect(textOf(tree)).toContain('SAT, 21 NOV // EST (UTC-5)');
  expect(textOf(tree)).toContain('TIME ZONE · New York · EDT (UTC-4)');

  await act(async () => tree.unmount());
});

test('the back link from date and venue returns to the dashboard, not the review', async () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true };
  let tree;
  await act(async () => {
    tree = create(<BookingDateVenueScreen navigation={navigation} />);
  });

  await act(async () => findButton(tree, 'Back to dashboard').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('EmployeeDashboard');
  expect(navigation.goBack).not.toHaveBeenCalled();

  await act(async () => tree.unmount());
});

test('continue stays disabled until all venue fields are populated, then saves and routes', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<BookingDateVenueScreen navigation={navigation} />);
  });

  await act(async () => findInput(tree, 'Venue name').props.onChangeText('   '));
  expect(findButton(tree, 'Continue to booking review').props.accessibilityState.disabled).toBe(true);
  expect(textOf(tree)).toContain('Complete venue name, street address, city and postal code to continue.');

  await act(async () => findInput(tree, 'Venue name').props.onChangeText('Marina Bay Event Deck'));
  // Every field is filled in, but the date still has to be tapped.
  expect(findButton(tree, 'Continue to booking review').props.accessibilityState.disabled).toBe(true);

  await goToMonth(tree, 'November 2026');
  await pressDay(tree, '2026-11-21');
  expect(findButton(tree, 'Continue to booking review').props.accessibilityState.disabled).toBe(false);

  await act(async () => findButton(tree, '9:00 PM').props.onPress());
  await act(async () => findButton(tree, 'Continue to booking review').props.onPress());

  expect(navigation.navigate).toHaveBeenCalledWith('BookingReview', {
    booking: expect.objectContaining({
      date: '2026-11-21',
      dateLabel: 'SAT, 21 NOV // UTC+8',
      timeSlot: '9:00 PM',
      timeZone: 'Asia/Singapore',
      venueName: 'Marina Bay Event Deck',
      streetAddress: '10 Bayfront Avenue',
      city: 'Singapore',
      postalCode: '018956',
      status: 'review',
    }),
  });
  expect(bookingSession.bookings).toHaveLength(1);

  await act(async () => tree.unmount());
});

test('employee dashboard opens the booking wizard from the schedule ribbon and the schedule button', async () => {
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<EmployeeDashboard navigation={navigation} />);
  });

  await act(async () => findButton(tree, 'SCHEDULE navigation').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingDateVenue');

  await act(async () => findButton(tree, '+ Schedule a show').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledTimes(2);

  await act(async () => tree.unmount());
});

test('review step renders the saved session draft and lights stage two', async () => {
  const saved = saveBookingDraft({
    date: '2026-11-21',
    dateLabel: 'SAT, 21 NOV // PST (UTC-8)',
    timeSlot: '8:00 PM',
    timeZone: 'America/Los_Angeles',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
  });

  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(<BookingReviewScreen navigation={navigation} />);
  });

  const text = textOf(tree);
  expect(text).toContain('Review your request.');
  expect(text).toContain('Sat, 21 Nov 2026 · 8:00 PM');
  expect(text).not.toContain('// PST');
  expect(text).toContain('Marina Bay Event Deck');
  expect(text).toContain('10 Bayfront Avenue');
  expect(text).toContain(saved.postalCode);
  expect(text).toContain('200 drones');
  expect(text).toContain('10 minutes');
  expect(text).toContain('REQUEST CONTACT');
  expect(text).toContain('Kenneth Elliott · Apex Global Corp');
  expect(text).toContain('kenneth.elliott@csus.edu');
  expect(text).toContain('No payment is due when submitting this request.');

  const editLink = findButton(tree, 'Edit date & venue');
  await act(async () => editLink.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingDateVenue', { booking: expect.objectContaining({ id: saved.id }) });

  await act(async () => tree.unmount());
});

test('submitting the review claims the slot and routes to the confirmation screen', async () => {
  const saved = saveBookingDraft({
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
  const navigation = { navigate: jest.fn() };

  let tree;
  await act(async () => {
    tree = create(<BookingReviewScreen navigation={navigation} />);
  });

  await act(async () => findButton(tree, 'Submit booking request').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingSubmitted', {
    booking: expect.objectContaining({ id: saved.id, eventName: 'Apex Year-end Celebration', status: 'submitted' }),
    submission: expect.objectContaining({
      reference: 'REQ-20261121-2000',
      bookingId: saved.id,
      date: '2026-11-21',
      timeSlot: '8:00 PM',
      status: 'pending',
    }),
  });

  await act(async () => tree.unmount());
});

test('another booking on the same date is routed to the conflict screen', async () => {
  const first = saveBookingDraft({
    eventName: 'Apex Year-end Celebration',
    date: '2026-11-21',
    timeSlot: '8:00 PM',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
  });
  const second = saveBookingDraft({
    eventName: 'Harbour Night Market',
    date: '2026-11-21',
    timeSlot: '9:00 PM',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
  });
  const navigation = { navigate: jest.fn() };

  let firstTree;
  await act(async () => {
    firstTree = create(<BookingReviewScreen route={{ params: { booking: first } }} navigation={navigation} />);
  });
  await act(async () => findButton(firstTree, 'Submit booking request').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingSubmitted', expect.anything());
  await act(async () => firstTree.unmount());

  let secondTree;
  await act(async () => {
    secondTree = create(<BookingReviewScreen route={{ params: { booking: second } }} navigation={navigation} />);
  });
  await act(async () => findButton(secondTree, 'Submit booking request').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingConflict', {
    booking: expect.objectContaining({ id: second.id, eventName: 'Harbour Night Market' }),
    conflict: expect.objectContaining({
      code: 'DATE_CONFLICT',
      unavailableSlot: { date: '2026-11-21', timeSlot: '9:00 PM' },
    }),
  });

  await act(async () => secondTree.unmount());
});

test('the date and venue step restores the cached draft after a conflict', async () => {
  const cached = {
    eventName: 'Apex Year-end Celebration',
    date: '2026-12-05',
    timeSlot: '9:00 PM',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 200,
    durationMinutes: 10,
  };
  const navigation = { navigate: jest.fn() };
  let tree;
  await act(async () => {
    tree = create(
      <BookingDateVenueScreen
        navigation={navigation}
        route={{ params: { booking: cached, focusCalendar: true } }}
      />
    );
  });

  const text = textOf(tree);
  expect(text).toContain('December 2026');
  expect(text).toContain('SAT, 5 DEC // UTC+8');
  expect(text).toContain('DATE NO LONGER AVAILABLE');
  expect(findInput(tree, 'Event name').props.value).toBe('Apex Year-end Celebration');
  expect(findInput(tree, 'Venue name').props.value).toBe('Marina Bay Event Deck');
  expect(findButton(tree, '9:00 PM').props.accessibilityState).toEqual({ checked: true });

  await act(async () => findButton(tree, 'Continue to booking review').props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('BookingReview', {
    booking: expect.objectContaining({
      eventName: 'Apex Year-end Celebration',
      droneCount: 200,
      durationMinutes: 10,
      date: '2026-12-05',
      timeSlot: '9:00 PM',
    }),
  });

  await act(async () => tree.unmount());
});

test('a booked date is disabled in the calendar and cannot continue', async () => {
  requestBookingSlot({
    id: 'booking-held',
    eventName: 'Apex Year-end Celebration',
    date: '2026-11-21',
    timeSlot: '8:00 PM',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
  });

  let tree;
  await act(async () => {
    tree = create(
      <BookingDateVenueScreen
        navigation={{ navigate: jest.fn() }}
        route={{ params: { booking: { date: '2026-11-21', timeSlot: '8:00 PM' } } }}
      />
    );
  });

  const bookedDay = tree.root.findAll((node) => node.props.testID === 'calendar-day-2026-11-21')[0];
  expect(bookedDay.props.accessibilityState).toMatchObject({ disabled: true });
  expect(bookedDay.props.accessibilityLabel).toContain('booked');
  expect(tree.root.findAll((node) => node.props.testID === 'calendar-legend').length).toBeGreaterThan(0);
  expect(textOf(tree)).toContain('BOOKED');
  expect(textOf(tree)).toContain('Red days are already booked.');
  expect(textOf(tree)).toContain('This date already has a show. Pick another date to continue.');
  expect(findButton(tree, 'Continue to booking review').props.accessibilityState.disabled).toBe(true);

  await act(async () => tree.unmount());
});
