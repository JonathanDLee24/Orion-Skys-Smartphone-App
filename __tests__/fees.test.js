import { calculateTotalCents, formatUSD } from '../src/utils/fees';

const fee = (amountCents) => ({ type: 'Venue Fee', amountCents });

describe('calculateTotalCents', () => {
  test('one fee', () => expect(calculateTotalCents([fee(25000)])).toBe(25000));
  test('two fees', () => expect(calculateTotalCents([fee(25000), fee(20000)])).toBe(45000));
  test('zero fees', () => expect(calculateTotalCents([])).toBe(0));
  test('a large amount', () => expect(calculateTotalCents([fee(900000000000), fee(100000000000)])).toBe(1000000000000));
  test('rejects fractional cents', () => expect(() => calculateTotalCents([fee(1.5)])).toThrow());
  test('rejects an unsafe total', () => expect(() => calculateTotalCents([fee(Number.MAX_SAFE_INTEGER), fee(1)])).toThrow());
});

describe('formatUSD', () => {
  test.each([[45000, '$450.00'], [0, '$0.00'], [5, '$0.05']])('%i cents is %s', (cents, expected) => {
    expect(formatUSD(cents)).toBe(expected);
  });
  test('groups large dollar amounts', () => expect(formatUSD(123456789)).toBe('$1,234,567.89'));
  test('rejects negative amounts', () => expect(() => formatUSD(-1)).toThrow());
});
