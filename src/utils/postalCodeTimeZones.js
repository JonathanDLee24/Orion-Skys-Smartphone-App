// Offline postal-code lookup for the booking venue form. A production build
// should replace this with GET /api/geo/postal-code/:code, which can resolve
// every international postal code. These rules cover the markets the mock app
// currently serves.
const US_ZIP_TIME_ZONES = [
  { min: 0, max: 499, timeZone: 'America/New_York' },
  { min: 500, max: 799, timeZone: 'America/Chicago' },
  { min: 800, max: 899, timeZone: 'America/Denver' },
  { min: 900, max: 999, timeZone: 'America/Los_Angeles' },
];

// Greater London postcodes begin with one of these outward-code prefixes.
const LONDON_POSTAL_PREFIXES = ['EC', 'WC', 'NW', 'SE', 'SW', 'E', 'N', 'W'];

function getUsZipTimeZone(zip) {
  const numeric = Number(zip);
  return US_ZIP_TIME_ZONES.find((range) => numeric >= range.min && numeric <= range.max)?.timeZone || null;
}

function startsWithLondonPrefix(code) {
  return LONDON_POSTAL_PREFIXES.some((prefix) => code.startsWith(prefix) && /\d/.test(code.charAt(prefix.length)));
}

// Returns an IANA time zone for a recognized postal code, or null when the
// code is incomplete or outside the supported markets.
export function getTimeZoneForPostalCode(postalCode) {
  const raw = String(postalCode ?? '').trim().toUpperCase();
  if (!raw) return null;

  // Singapore: six digits, e.g. 018956.
  if (/^\d{6}$/.test(raw)) return 'Asia/Singapore';

  // Japan: seven digits, with or without the conventional hyphen, e.g. 100-0001.
  if (/^\d{3}-?\d{4}$/.test(raw)) return 'Asia/Tokyo';

  // United States ZIP and ZIP+4, e.g. 10001 or 10001-1234.
  const zipMatch = raw.match(/^(\d{5})(?:-\d{4})?$/);
  if (zipMatch) return getUsZipTimeZone(zipMatch[1].slice(0, 3));

  // Australia: four digits; Sydney and New South Wales use 2000-2999.
  if (/^\d{4}$/.test(raw)) {
    const numeric = Number(raw);
    return numeric >= 2000 && numeric <= 2999 ? 'Australia/Sydney' : null;
  }

  // United Kingdom London outward codes, e.g. SW1A 1AA or E14 5AB.
  if (startsWithLondonPrefix(raw.replace(/\s+/g, ''))) return 'Europe/London';

  return null;
}
