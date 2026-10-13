function assertCents(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error('Amounts must be non-negative safe integer cents.');
  }
}

export function calculateTotalCents(fees) {
  return fees.reduce((total, fee) => {
    assertCents(fee.amountCents);
    const next = total + fee.amountCents;
    assertCents(next);
    return next;
  }, 0);
}

export function formatUSD(cents) {
  assertCents(cents);
  const dollars = Math.floor(cents / 100).toLocaleString('en-US');
  const remainder = String(cents % 100).padStart(2, '0');
  return `$${dollars}.${remainder}`;
}
