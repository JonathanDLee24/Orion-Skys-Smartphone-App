import { getTimeZoneForPostalCode } from '../src/utils/postalCodeTimeZones';

test('recognizes Singapore postal codes', () => {
  expect(getTimeZoneForPostalCode('018956')).toBe('Asia/Singapore');
  expect(getTimeZoneForPostalCode(' 018956 ')).toBe('Asia/Singapore');
});

test('maps US ZIP prefixes to their time zones', () => {
  expect(getTimeZoneForPostalCode('10001')).toBe('America/New_York');
  expect(getTimeZoneForPostalCode('60601')).toBe('America/Chicago');
  expect(getTimeZoneForPostalCode('80202')).toBe('America/Denver');
  expect(getTimeZoneForPostalCode('90001')).toBe('America/Los_Angeles');
  expect(getTimeZoneForPostalCode('10001-1234')).toBe('America/New_York');
});

test('recognizes London, Sydney and Tokyo codes', () => {
  expect(getTimeZoneForPostalCode('SW1A 1AA')).toBe('Europe/London');
  expect(getTimeZoneForPostalCode('E14 5AB')).toBe('Europe/London');
  expect(getTimeZoneForPostalCode('2000')).toBe('Australia/Sydney');
  expect(getTimeZoneForPostalCode('100-0001')).toBe('Asia/Tokyo');
  expect(getTimeZoneForPostalCode('1000001')).toBe('Asia/Tokyo');
});

test('returns null for incomplete or unsupported codes', () => {
  expect(getTimeZoneForPostalCode('')).toBeNull();
  expect(getTimeZoneForPostalCode('0189')).toBeNull();
  expect(getTimeZoneForPostalCode('UNKNOWN')).toBeNull();
  expect(getTimeZoneForPostalCode('9999')).toBeNull();
});
