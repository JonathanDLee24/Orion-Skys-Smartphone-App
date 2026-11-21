import React from 'react';
import { act, create } from 'react-test-renderer';
import { Dimensions, StyleSheet, Text } from 'react-native';
import BookingDateVenueScreen from '../src/screens/BookingDateVenueScreen';
import BookingManageScreen from '../src/screens/BookingManageScreen';
import BookingReviewScreen from '../src/screens/BookingReviewScreen';
import BookingSubmittedScreen from '../src/screens/BookingSubmittedScreen';
import EmployeeDashboard from '../src/screens/EmployeeDashboard';
import ScreenLayout from '../src/components/ScreenLayout';
import { getResponsiveLayout } from '../src/theme';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('responsive layout', () => {
  test.each([
    [320, 'phone', false, 767, 18],
    [390, 'phone', false, 767, 18],
    [767, 'phone', false, 767, 18],
    [768, 'tablet', true, 1200, 32],
    [834, 'tablet', true, 1200, 32],
    [1199, 'tablet', true, 1200, 32],
    [1200, 'desktop', true, 1440, 48],
    [1440, 'desktop', true, 1440, 48],
  ])('%i selects %s mode', (width, mode, wide, maxWidth, padding) => {
    expect(getResponsiveLayout(width)).toMatchObject({ mode, wide, maxWidth, padding });
  });

  test('only short laptop windows use compact vertical chrome', () => {
    expect(getResponsiveLayout(1280, 768).tight).toBe(true);
    expect(getResponsiveLayout(1280, 800).tight).toBe(false);
    expect(getResponsiveLayout(390, 600).tight).toBe(false);
  });
});

describe('footer actions', () => {
  let tree;

  afterEach(() => {
    if (tree) act(() => tree.unmount());
    tree = null;
    jest.restoreAllMocks();
  });

  function renderFooter(width) {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
    act(() => {
      tree = create(<ScreenLayout title="Schedule a show" footer={<Text>Continue</Text>} />);
    });
    return StyleSheet.flatten(tree.root.findAll((node) => node.props.testID === 'footer-actions')[0].props.style);
  }

  test('are centered in a readable column on wide screens', () => {
    const style = renderFooter(1280);
    expect(style.alignSelf).toBe('center');
    expect(style.maxWidth).toBe(360);
  });

  test('span the full width on phones', () => {
    const style = renderFooter(390);
    expect(style.width).toBe('100%');
    expect(style.maxWidth).toBeUndefined();
  });

  test('the frame fills ordinary desktop widths without phone-width gutters', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    act(() => {
      tree = create(<ScreenLayout title="Schedule a show" />);
    });
    const frame = tree.root.findAll((node) => node.props.testID === 'responsive-frame')[0];
    expect(StyleSheet.flatten(frame.props.style).maxWidth).toBe(1440);
  });
});

describe('employee portal layout', () => {
  let tree;

  afterEach(() => {
    if (tree) act(() => tree.unmount());
    tree = null;
    jest.restoreAllMocks();
  });

  test('splits stats and the next show into two columns on large screens', async () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    await act(async () => { tree = create(<EmployeeDashboard navigation={{ navigate: jest.fn() }} />); });

    const columns = tree.root.findAll((node) => node.props.testID === 'dashboard-columns')[0];
    expect(StyleSheet.flatten(columns.props.style).flexDirection).toBe('row');
  });

  test.each([390, 834])('keeps the previous single column on %i-wide phones and tablets', async (width) => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
    await act(async () => { tree = create(<EmployeeDashboard navigation={{ navigate: jest.fn() }} />); });

    const columns = tree.root.findAll((node) => node.props.testID === 'dashboard-columns')[0];
    expect(StyleSheet.flatten(columns.props.style).flexDirection).toBeUndefined();
  });
});

describe('booking review layout', () => {
  let tree;

  const booking = {
    id: 'review-demo',
    eventName: 'Apex Year-end Celebration',
    date: '2026-11-21',
    timeSlot: '8:00 PM',
    timeZone: 'Asia/Singapore',
    timeZoneLabel: 'Singapore · Singapore Time (SGT)',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 200,
    durationMinutes: 10,
  };

  afterEach(() => {
    if (tree) act(() => tree.unmount());
    tree = null;
    jest.restoreAllMocks();
  });

  async function renderAt(width, height = 900) {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 1, fontScale: 1 });
    await act(async () => {
      tree = create(
        <BookingReviewScreen route={{ params: { booking } }} navigation={{ navigate: jest.fn() }} />
      );
    });
    return (testID) => StyleSheet.flatten(tree.root.findAll((node) => node.props.testID === testID)[0].props.style);
  }

  test('keeps the date and venue ahead of the specs in a wide primary column on desktop', async () => {
    const find = await renderAt(1440);
    expect(find('review-grid').flexDirection).toBe('row');
    expect(find('review-primary-column').flexBasis).toBe('52%');
    expect(find('review-secondary-column').flex).toBe(1);
  });

  test.each([834, 1024])('keeps a single-column review on %i-wide tablets', async (width) => {
    const find = await renderAt(width, 1112);
    expect(find('review-grid').flexDirection).toBeUndefined();
    expect(find('review-primary-column').width).toBe('100%');
    expect(find('review-secondary-column').width).toBe('100%');
  });

  test('stacks every review card on phones', async () => {
    const find = await renderAt(390, 844);
    expect(find('review-grid').flexDirection).toBeUndefined();
    expect(find('review-primary-column').width).toBe('100%');
  });

  test('places the payment note beside the button on wide screens and stacks it on phones', async () => {
    const wide = await renderAt(1440);
    expect(wide('review-footer-inner').flexDirection).toBe('row');
    expect(wide('review-footer-action').width).toBe(320);

    await act(async () => tree.unmount());
    const phone = await renderAt(390, 844);
    expect(phone('review-footer-inner').flexDirection).toBe('column');
    expect(phone('review-footer-action').width).toBe('100%');
  });
});

describe('booking request receipt layout', () => {
  let tree;

  const booking = {
    id: 'submitted-demo',
    eventName: 'Apex Year-end Celebration',
    date: '2026-11-21',
    timeSlot: '8:00 PM',
    timeZone: 'Asia/Singapore',
    timeZoneLabel: 'Singapore · Singapore Time (SGT)',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 200,
    durationMinutes: 10,
  };
  const submission = { reference: 'REQ-20261121-2000' };

  afterEach(() => {
    if (tree) act(() => tree.unmount());
    tree = null;
    jest.restoreAllMocks();
  });

  async function renderAt(width, height = 900) {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 1, fontScale: 1 });
    await act(async () => {
      tree = create(
        <BookingSubmittedScreen
          route={{ params: { booking, submission } }}
          navigation={{ navigate: jest.fn() }}
        />
      );
    });
    return (testID) => StyleSheet.flatten(tree.root.findAll((node) => node.props.testID === testID)[0].props.style);
  }

  test('centres the status above two desktop columns and a wide footer', async () => {
    const find = await renderAt(1440);
    expect(find('submitted-status').width).toBe('100%');
    expect(find('submitted-status').alignItems).toBe('center');
    expect(find('submitted-grid').flexDirection).toBe('row');
    expect(find('submitted-primary-column').flexBasis).toBe('52%');
    expect(find('submitted-secondary-column').flex).toBe(1);
    expect(find('submitted-footer-inner').flexDirection).toBe('row');
    expect(find('submitted-footer-action').width).toBe(320);
    expect(find('submitted-info').width).toBe('100%');
    expect(find('submitted-info').marginTop).toBe(12);
  });

  test.each([834, 1024])('uses two receipt columns and a wide footer on %i-wide tablets', async (width) => {
    const find = await renderAt(width, 1112);
    expect(find('submitted-status').width).toBe('100%');
    expect(find('submitted-status').alignItems).toBe('center');
    expect(find('submitted-grid').flexDirection).toBe('row');
    expect(find('submitted-primary-column').flexBasis).toBe('52%');
    expect(find('submitted-secondary-column').flex).toBe(1);
    expect(find('submitted-summary-grid').flexWrap).toBe('wrap');
    expect(find('submitted-footer-inner').flexDirection).toBe('row');
    expect(find('submitted-footer-action').width).toBe(240);
    expect(find('submitted-info').width).toBe('100%');
    expect(find('submitted-info').marginTop).toBe(12);
  });

  test('keeps the phone footer on one compact action row', async () => {
    const find = await renderAt(390, 844);
    expect(find('submitted-grid').flexDirection).toBeUndefined();
    expect(find('submitted-primary-column').width).toBe('100%');
    expect(find('submitted-footer-inner').flexDirection).toBe('column');
    expect(find('submitted-footer-actions').flexDirection).toBe('row');
    expect(find('submitted-footer-actions').alignItems).toBe('stretch');
    expect(find('submitted-footer').paddingTop).toBe(17);
    expect(find('submitted-footer').paddingBottom).toBe(32);
    expect(find('submitted-footer-action').flex).toBe(1);
    expect(find('submitted-footer-action').flexBasis).toBe(0);
    expect(find('submitted-footer-action').minWidth).toBe(0);
    expect(find('submitted-info').width).toBe('100%');
  });

  test('tightens the header height on phones only', async () => {
    const phone = await renderAt(390, 844);
    expect(phone('screen-header').paddingTop).toBe(2);
    expect(phone('screen-header').paddingBottom).toBe(6);

    await act(async () => tree.unmount());
    const wide = await renderAt(1440);
    expect(wide('screen-header').paddingTop).toBe(14);
    expect(wide('screen-header').paddingBottom).toBe(10);
  });

  test('keeps the compact action row even on 320-wide phones', async () => {
    const find = await renderAt(320, 568);
    expect(find('submitted-footer-inner').flexDirection).toBe('column');
    expect(find('submitted-footer-actions').flexDirection).toBe('row');
    expect(find('submitted-footer-action').flex).toBe(1);
    expect(find('submitted-footer-action').flexBasis).toBe(0);
  });
});

describe('manage show layout', () => {
  let tree;

  const submission = {
    id: 'manage-demo',
    reference: 'REQ-20261121-2000',
    status: 'pending',
    eventName: 'Apex Global Summit',
    date: '2026-11-21',
    timeSlot: '8:00 PM',
    timeZone: 'Asia/Singapore',
    timeZoneLabel: 'Singapore · Singapore Time (SGT)',
    venueName: 'Marina Bay Event Deck',
    streetAddress: '10 Bayfront Avenue',
    city: 'Singapore',
    postalCode: '018956',
    droneCount: 200,
    durationMinutes: 10,
  };

  afterEach(() => {
    if (tree) act(() => tree.unmount());
    tree = null;
    jest.restoreAllMocks();
  });

  async function renderAt(width, height = 900, data = submission) {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 1, fontScale: 1 });
    await act(async () => {
      tree = create(
        <BookingManageScreen route={{ params: { submission: data } }} navigation={{ navigate: jest.fn() }} />
      );
    });
    return (testID) => StyleSheet.flatten(tree.root.findAll((node) => node.props.testID === testID)[0].props.style);
  }

  test('splits the event details and venue logistics on desktop', async () => {
    const find = await renderAt(1440);
    expect(find('manage-grid').flexDirection).toBe('row');
    expect(find('manage-primary-column').flexBasis).toBe('52%');
    expect(find('manage-secondary-column').flex).toBe(1);
    expect(find('manage-footer-inner').flexDirection).toBe('row');
    expect(find('manage-footer-actions').flexDirection).toBe('row');
    expect(find('manage-info').width).toBe('100%');
    expect(find('manage-info').marginTop).toBe(12);
  });

  test.each([834, 1024])('uses the same two columns and full-width note on %i-wide tablets', async (width) => {
    const find = await renderAt(width, 1112);
    expect(find('manage-grid').flexDirection).toBe('row');
    expect(find('manage-primary-column').flexBasis).toBe('52%');
    expect(find('manage-secondary-column').flex).toBe(1);
    expect(find('manage-footer-inner').flexDirection).toBe('row');
    expect(find('manage-info').width).toBe('100%');
    expect(find('manage-info').marginTop).toBe(12);
  });

  test('stacks the columns and keeps a compact phone action row', async () => {
    const find = await renderAt(390, 844);
    expect(find('manage-grid').flexDirection).toBeUndefined();
    expect(find('manage-primary-column').width).toBe('100%');
    expect(find('manage-footer-inner').flexDirection).toBe('column');
    expect(find('manage-footer-actions').flexDirection).toBe('row');
    expect(find('manage-footer').paddingTop).toBe(17);
    expect(find('manage-footer').paddingBottom).toBe(17);
    expect(find('manage-info').width).toBe('100%');
    expect(tree.root.findAll((node) => node.props.testID === 'manage-footer-note')).toHaveLength(0);
  });

  test('keeps the two footer actions on one row at 320 wide', async () => {
    const find = await renderAt(320, 568);
    expect(find('manage-footer-inner').flexDirection).toBe('column');
    expect(find('manage-footer-actions').flexDirection).toBe('row');
    expect(tree.root.findAll((node) => node.props.testID === 'manage-footer-note')).toHaveLength(0);
  });

  test('hides the archived footer note on phones and keeps the swapped action order', async () => {
    const completed = { ...submission, status: 'completed' };
    await renderAt(390, 844, completed);
    expect(tree.root.findAll((node) => node.props.testID === 'manage-footer-note')).toHaveLength(0);

    const actions = tree.root.findAll((node) => node.props.testID === 'manage-footer-actions')[0];
    const labels = actions
      .findAll(
        (node) =>
          node.props.accessibilityRole === 'button' &&
          node.props.accessibilityLabel &&
          typeof node.props.onPress === 'function'
      )
      .map((node) => node.props.accessibilityLabel);
    expect(labels).toEqual(['Schedule another show', 'Back to dashboard']);

    await act(async () => tree.unmount());
    tree = null;
    await renderAt(1440, 900, completed);
    expect(tree.root.findAll((node) => node.props.testID === 'manage-footer-note').length).toBeGreaterThan(0);
  });
});

describe('desktop booking layout', () => {
  let tree;

  afterEach(() => {
    if (tree) act(() => tree.unmount());
    tree = null;
    jest.restoreAllMocks();
  });

  test('places the calendar, time and venue cards side by side', async () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    await act(async () => {
      tree = create(<BookingDateVenueScreen navigation={{ navigate: jest.fn() }} />);
    });

    const find = (testID) => tree.root.findAll((node) => node.props.testID === testID)[0];
    const columns = StyleSheet.flatten(find('booking-columns').props.style);
    const calendarColumn = StyleSheet.flatten(find('booking-calendar-column').props.style);
    const timeCard = StyleSheet.flatten(find('booking-time-card').props.style);
    const venueCard = StyleSheet.flatten(find('booking-venue-card').props.style);

    expect(columns.flexDirection).toBe('row');
    expect(calendarColumn.flexBasis).toBe('29%');
    expect(timeCard.flexBasis).toBe('27%');
    expect(venueCard.flexBasis).toBe('42%');
    expect(find('booking-form-column')).toBeUndefined();
  });

  test.each([1024, 834])('tablets put Venue & Address full width below the calendar and time at %i', async (width) => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 1112, scale: 1, fontScale: 1 });
    await act(async () => {
      tree = create(<BookingDateVenueScreen navigation={{ navigate: jest.fn() }} />);
    });

    const find = (testID) => tree.root.findAll((node) => node.props.testID === testID)[0];
    const columns = StyleSheet.flatten(find('booking-columns').props.style);
    expect(columns.flexDirection).toBe('row');
    expect(columns.flexWrap).toBe('wrap');
    expect(StyleSheet.flatten(find('booking-calendar-column').props.style).flexBasis).toBe('48%');
    expect(StyleSheet.flatten(find('booking-time-card').props.style).flexBasis).toBe('48%');
    expect(StyleSheet.flatten(find('booking-venue-card').props.style).flexBasis).toBe('100%');
  });
});
