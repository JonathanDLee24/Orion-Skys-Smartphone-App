const payments = new Map();

export const paymentServiceConfig = {
  simulateFailure: process.env.EXPO_PUBLIC_SIMULATE_PAYMENT_FAILURE === 'true',
};

export function createPayment({ bookingId = 1, amountCents = 0, outcome = 'success' } = {}) {
  if (!['success', 'partial', 'declined'].includes(outcome)) throw new Error('Unsupported payment outcome.');
  const payment = {
    id: `pay_${bookingId}_demo`,
    bookingId,
    amountCents,
    outcome,
    status: 'processing',
    transactionId: 'TXN-SF-8849204',
    paymentMethod: 'Stripe Card (•••• 9010)',
    timestamp: '2026-10-24 14:32 UTC',
  };
  payments.set(payment.id, payment);
  return { ...payment };
}

export async function submitPayment(payment) {
  await new Promise((resolve) => setTimeout(resolve, 120));
  if (paymentServiceConfig.simulateFailure) throw new Error('Payment provider unavailable. Please try again.');
  const result = { ...payment, status: payment.outcome };
  payments.set(result.id, result);
  return result;
}

// This is the client-side contract for the backend Stripe webhook. The production
// endpoint must verify Stripe's signature before passing a normalized event here.
export function handleStripeWebhook(event) {
  if (event?.provider !== 'stripe' || event?.signatureVerified !== true) return null;
  const paymentId = event?.data?.object?.metadata?.paymentId || event?.paymentId;
  const status = event?.type === 'payment_intent.succeeded' ? 'success'
    : event?.type === 'payment_intent.partially_paid' ? 'partial'
      : event?.type === 'payment_intent.payment_failed' ? 'declined' : null;
  if (!paymentId || !status || !payments.has(paymentId)) return null;
  const updated = { ...payments.get(paymentId), status };
  payments.set(paymentId, updated);
  return { ...updated };
}

export function getPayment(paymentId) {
  const payment = payments.get(paymentId);
  return payment ? { ...payment } : null;
}
