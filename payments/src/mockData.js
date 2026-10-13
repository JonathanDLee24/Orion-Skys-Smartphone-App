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
