import { timeZoneOptions } from '../mockData';

export const DEFAULT_TIME_ZONE = 'America/Los_Angeles';

const FALLBACK_TIME_ZONE_LABELS = {
  'America/Los_Angeles': 'California · Pacific Time (PT)',
};

export function getTimeZoneOption(timeZone) {
  return timeZoneOptions.find((option) => option.value === timeZone) || null;
}

// Full preference label, e.g. "California · Pacific Time (PT)".
export function getTimeZoneLabel(timeZone) {
  return getTimeZoneOption(timeZone)?.label || FALLBACK_TIME_ZONE_LABELS[timeZone] || timeZone;
}

function getTimeZonePart(date, timeZone, timeZoneName) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName }).formatToParts(date);
    return parts.find((part) => part.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
}

// Short suffix for a specific date, e.g. "PST (UTC-8)" in winter, "PDT (UTC-7)" in summer.
export function formatTimeZoneName(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const abbreviation = getTimeZonePart(date, timeZone, 'short');
  const offset = getTimeZonePart(date, timeZone, 'shortOffset').replace('GMT', 'UTC');

  // Some ICU builds return "GMT+9" instead of a named abbreviation. Avoid duplicates.
  if (abbreviation && offset && !abbreviation.startsWith('GMT') && !abbreviation.startsWith('UTC')) {
    return `${abbreviation} (${offset})`;
  }
  return offset || abbreviation || timeZone;
}
