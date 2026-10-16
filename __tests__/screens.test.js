import React from 'react';
import { act, create } from 'react-test-renderer';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import FeeReviewScreen from '../src/screens/FeeReviewScreen';
import PaymentCheckoutScreen from '../src/screens/PaymentCheckoutScreen';
import PrimaryButton from '../src/components/PrimaryButton';
import FeeRow from '../src/components/FeeRow';
import { getBookingFees } from '../src/services/feeService';
import { mockBooking } from '../src/mockData';
import { colors } from '../src/theme';

jest.mock('../src/services/feeService', () => ({ getBookingFees: jest.fn() }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

global.IS_REACT_ACT_ENVIRONMENT = true;
let tree;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

async function render(element) {
  await act(async () => { tree = create(element); });
}
const text = () => tree.root.findAllByType(Text).map((node) => node.props.children).flat().join(' ');

test('policy review loads, shows the premium, and passes booking to checkout', async () => {
  let resolve;
  getBookingFees.mockReturnValue(new Promise((done) => { resolve = done; }));
  const navigation = { navigate: jest.fn() };
  await render(<FeeReviewScreen navigation={navigation} />);
  expect(getBookingFees).toHaveBeenCalledWith(1);
  expect(text()).toContain('Loading your booking fees');
  expect(tree.root.findByType(PrimaryButton).props.loading).toBe(true);
  await act(async () => resolve(mockBooking));
  expect(text()).toContain('Commercial Airspace Coverage');
  expect(text()).toContain('$450.00');
  expect(text()).toContain(mockBooking.policy.carrier);
  expect(tree.root.findAll((node) => node.props.accessibilityRole === 'switch')[0].props.accessibilityState.checked).toBe(true);
  await act(async () => tree.root.findByType(PrimaryButton).props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('Checkout', { booking: mockBooking });
});

test('failed request shows an error and Try again refetches', async () => {
  getBookingFees.mockRejectedValueOnce(new Error('Request failed')).mockResolvedValueOnce(mockBooking);
  await render(<FeeReviewScreen navigation={{ navigate: jest.fn() }} />);
  expect(text()).toContain('Request failed');
  const retry = tree.root.findAllByType(PrimaryButton).find((node) => node.props.title === 'Try again');
  await act(async () => retry.props.onPress());
  expect(getBookingFees).toHaveBeenCalledTimes(2);
  expect(text()).toContain('Comprehensive Coverage');
  expect(text()).toContain('$450.00');
});

test('checkout total is the sum of the fee rows and proceeds with a Sprint 2 alert', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await render(<PaymentCheckoutScreen route={{ params: { booking: mockBooking } }} navigation={{ navigate: jest.fn() }} />);
  expect(text()).toContain('Grand Total');
  expect(text()).toContain('$4,674.00');
  expect(tree.root.findAllByType(FeeRow)).toHaveLength(5);
  expect(tree.root.findAllByType(FeeRow).map((node) => node.props.amountCents).reduce((sum, cents) => sum + cents, 0)).toBe(467400);
  const button = tree.root.findByType(PrimaryButton);
  expect(button.props.disabled).toBe(false);
  await act(async () => button.props.onPress());
  expect(alert).toHaveBeenCalledWith('Payment screen coming in Sprint 2');
});

test('coverage switch removes the liability fee from the next summary', async () => {
  getBookingFees.mockResolvedValue(mockBooking);
  const navigation = { navigate: jest.fn() };
  await render(<FeeReviewScreen navigation={navigation} />);
  await act(async () => tree.root.findAll((node) => node.props.accessibilityRole === 'switch')[0].props.onPress());
  expect(tree.root.findAll((node) => node.props.accessibilityRole === 'switch')[0].props.accessibilityState.checked).toBe(false);
  await act(async () => tree.root.findByType(PrimaryButton).props.onPress());
  const nextBooking = navigation.navigate.mock.calls[0][1].booking;
  expect(nextBooking.fees.some((fee) => fee.type === 'Aviation Airspace Liability')).toBe(false);
  expect(nextBooking.fees.reduce((sum, fee) => sum + fee.amountCents, 0)).toBe(422400);
  expect(mockBooking.fees).toHaveLength(5);
});

test('promo and split-payment controls give honest frontend-only feedback', async () => {
  await render(<PaymentCheckoutScreen route={{ params: { booking: mockBooking } }} navigation={{ navigate: jest.fn() }} />);
  const press = async (label) => act(async () => tree.root.findAll((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function')[0].props.onPress());
  await press('Apply promo code');
  expect(text()).toContain('Enter a promo code to apply.');
  await act(async () => tree.root.findByType(TextInput).props.onChangeText('ORION'));
  await press('Apply promo code');
  expect(text()).toContain('Promo codes will be available in Sprint 2.');
  await press('Select split payment');
  expect(text()).toContain('SELECTED');
  expect(text()).toContain('$4,674.00');
});

test('empty fee list shows zero total and disables checkout', async () => {
  await render(<PaymentCheckoutScreen route={{ params: { booking: { ...mockBooking, fees: [] } } }} navigation={{ navigate: jest.fn() }} />);
  expect(text()).toContain('$0.00');
  expect(tree.root.findByType(PrimaryButton).props.disabled).toBe(true);
});

test('coverage divider has four segments with three filled and a back link to the dashboard', async () => {
  getBookingFees.mockResolvedValue(mockBooking);
  const navigation = { navigate: jest.fn() };
  await render(<FeeReviewScreen navigation={navigation} />);
  const progress = tree.root.findAll((node) => node.props.accessibilityRole === 'progressbar')[0];
  expect(progress.props.accessibilityValue.now).toBe(3);
  for (let index = 1; index <= 4; index++) {
    const segment = tree.root.findAll((node) => node.props.testID === `phase-segment-${index}`)[0];
    expect(StyleSheet.flatten(segment.props.style).backgroundColor).toBe(index <= 3 ? colors.accent : colors.border);
  }
  const back = tree.root.findAll((node) => node.props.accessibilityLabel === 'Back to Dashboard' && node.props.onPress)[0];
  await act(async () => back.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('Dashboard');
});

test('checkout fills all four divider segments and its back link returns to coverage', async () => {
  const navigation = { navigate: jest.fn() };
  await render(<PaymentCheckoutScreen route={{ params: { booking: mockBooking } }} navigation={navigation} />);
  expect(tree.root.findAll((node) => node.props.accessibilityRole === 'progressbar')[0].props.accessibilityValue.now).toBe(4);
  for (let index = 1; index <= 4; index++) {
    const segment = tree.root.findAll((node) => node.props.testID === `phase-segment-${index}`)[0];
    expect(StyleSheet.flatten(segment.props.style).backgroundColor).toBe(colors.accent);
  }
  const back = tree.root.findAll((node) => node.props.accessibilityLabel === 'Back to Airspace Coverage' && node.props.onPress)[0];
  await act(async () => back.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('FeeReview');
});

test('missing booking shows a recovery action and disables checkout', async () => {
  await render(<PaymentCheckoutScreen route={{}} navigation={{ navigate: jest.fn() }} />);
  expect(text()).toContain('Summary unavailable');
  const buttons = tree.root.findAllByType(PrimaryButton);
  expect(buttons.find((node) => node.props.title === 'Continue to Payment Portal').props.disabled).toBe(true);
  expect(buttons.some((node) => node.props.title === 'Return to fee review')).toBe(true);
});
