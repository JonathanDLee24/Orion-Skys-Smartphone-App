import { createPayment, getPayment, handleStripeWebhook, submitPayment } from '../src/services/paymentService';

test('payment lifecycle updates status from processing through a Stripe webhook', async () => {
  const payment = createPayment({ bookingId: 1, amountCents: 467400, outcome: 'success' });
  expect(payment.status).toBe('processing');
  const submitted = await submitPayment(payment);
  expect(submitted.status).toBe('success');
  const declined = handleStripeWebhook({ provider: 'stripe', signatureVerified: true, type: 'payment_intent.payment_failed', paymentId: payment.id });
  expect(declined.status).toBe('declined');
  expect(getPayment(payment.id).status).toBe('declined');
});

test('ignores webhook events that are not verified as Stripe events', () => {
  const payment = createPayment({ bookingId: 2, amountCents: 467400, outcome: 'success' });
  expect(handleStripeWebhook({ type: 'payment_intent.succeeded', paymentId: payment.id })).toBeNull();
  expect(getPayment(payment.id).status).toBe('processing');
  expect(handleStripeWebhook({ provider: 'stripe', signatureVerified: false, type: 'payment_intent.succeeded', paymentId: payment.id })).toBeNull();
  expect(getPayment(payment.id).status).toBe('processing');
});
