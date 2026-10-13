import { mockBooking } from '../src/mockData';
import { feeServiceConfig, getBookingFees } from '../src/services/feeService';

beforeEach(() => {
  jest.useFakeTimers();
  feeServiceConfig.simulateFailure = false;
});
afterEach(() => { jest.useRealTimers(); });

async function finishDelay() {
  await jest.advanceTimersByTimeAsync(600);
}

test('returns the booking after the fake delay', async () => {
  const request = getBookingFees(1);
  await finishDelay();
  await expect(request).resolves.toEqual(mockBooking);
});

test('can simulate failure and then retry successfully', async () => {
  feeServiceConfig.simulateFailure = true;
  const failure = expect(getBookingFees(1)).rejects.toThrow('could not load');
  await finishDelay();
  await failure;
  feeServiceConfig.simulateFailure = false;
  const retry = getBookingFees(1);
  await finishDelay();
  await expect(retry).resolves.toHaveProperty('id', 1);
});

test('unknown booking has a clear error', async () => {
  const failure = expect(getBookingFees(2)).rejects.toThrow('Booking not found');
  await finishDelay();
  await failure;
});

test('responses do not mutate the shared mock', async () => {
  const first = getBookingFees(1);
  await finishDelay();
  (await first).fees[0].amountCents = 5;
  const second = getBookingFees(1);
  await finishDelay();
  expect((await second).fees[0].amountCents).toBe(125000);
});
