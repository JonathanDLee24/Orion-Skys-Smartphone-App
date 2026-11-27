import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { act, create } from 'react-test-renderer';
import EmployeeEventsScreen from '../src/screens/EmployeeEventsScreen';
import { clearBookingSubmissions } from '../src/services/bookingConflictService';
import { clearBookingSession } from '../src/services/bookingDraftService';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ popToTop: jest.fn(), navigate: jest.fn() }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

let tree;

// The confirmed demo card only exists while its show is still upcoming, so the
// clock is pinned inside the 2026 demo season.
const DEMO_NOW = new Date('2026-10-01T12:00:00.000Z');
const REAL_TIMERS = [
  'hrtime', 'nextTick', 'performance', 'queueMicrotask',
  'requestAnimationFrame', 'cancelAnimationFrame',
  'requestIdleCallback', 'cancelIdleCallback',
  'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval',
  'setTimeout', 'clearTimeout',
];

beforeEach(() => {
  jest.useFakeTimers({ now: DEMO_NOW, doNotFake: REAL_TIMERS });
  clearBookingSession();
  clearBookingSubmissions();
});

afterEach(() => {
  if (tree) act(() => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const styleOf = (testID) => StyleSheet.flatten(tree.root.findByProps({ testID }).props.style);

test.each([320, 390, 768, 1440])(
  'keeps the confirmed card readable without horizontal overflow at %i px',
  async (width) => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
    await act(async () => {
      tree = create(<EmployeeEventsScreen navigation={{ navigate: jest.fn() }} />);
    });

    expect(styleOf('event-card-main-demo-apex-summit').flexDirection).toBe('row');
    expect(styleOf('event-date-block-demo-apex-summit').width).toBe(56);
    expect(styleOf('event-card-copy-demo-apex-summit').flex).toBe(1);
    expect(styleOf('event-card-copy-demo-apex-summit').minWidth).toBe(0);
    expect(styleOf('event-title-row-demo-apex-summit').flexWrap).toBe('wrap');
    expect(styleOf('event-name-demo-apex-summit').flexShrink).toBe(1);
    expect(styleOf('event-schedule-row-demo-apex-summit').flexDirection).toBe('row');
    expect(styleOf('event-venue-row-demo-apex-summit').flexDirection).toBe('row');
    expect(styleOf('event-schedule-demo-apex-summit').flexShrink).toBe(1);
    expect(styleOf('event-venue-demo-apex-summit').flexShrink).toBe(1);

    // Long labels wrap rather than truncate on narrow phones.
    expect(tree.root.findByProps({ testID: 'event-name-demo-apex-summit' }).props.numberOfLines).toBeUndefined();
    expect(tree.root.findByProps({ testID: 'event-schedule-demo-apex-summit' }).props.numberOfLines).toBeUndefined();
    expect(tree.root.findByProps({ testID: 'event-venue-demo-apex-summit' }).props.numberOfLines).toBeUndefined();
  }
);
