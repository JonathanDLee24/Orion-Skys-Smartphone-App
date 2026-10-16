export const defaultNotificationSettings = {
  notifications: {
    email: true,
    push: false,
    shows: true,
    billing: true,
  },
  language: 'en',
  timeZone: 'Asia/Singapore',
};

export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol (Spanish)' },
  { value: 'fr', label: 'Francais (French)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'zh', label: 'Zhongwen (Simplified Chinese)' },
  { value: 'ja', label: 'Japanese' },
  { value: 'id', label: 'Bahasa Indonesia' },
];

export const timeZoneOptions = [
  { value: 'Asia/Singapore', label: 'Singapore · SGT (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo · JST (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney · AEDT (UTC+11)' },
  { value: 'Asia/Dubai', label: 'Dubai · GST (UTC+4)' },
  { value: 'Europe/London', label: 'London · GMT (UTC+0)' },
  { value: 'America/New_York', label: 'New York · EDT (UTC-4)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles · PDT (UTC-7)' },
];

export const mockBooking = {
  id: 1,
  name: 'Neon Lights Festival',
  policy: {
    premiumCents: 45000,
    carrier: "Lloyd's Sky Aviation",
    period: '24 Hours (OCT 24, 2026)',
  },
  fees: [
    { type: 'Show Entry Fee', amountCents: 125000 },
    { type: 'Logistics Security LZ Deposit', amountCents: 250000, refundable: true },
    { type: 'Per-Drone Vol. Surcharge (250)', amountCents: 30000 },
    { type: 'Aviation Airspace Liability', amountCents: 45000 },
    { type: 'State Sales Tax (8.7%)', amountCents: 17400, tax: true },
  ],
};
