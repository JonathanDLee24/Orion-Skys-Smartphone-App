import { createPayment, getPayment, handleStripeWebhook, submitPayment } from '../src/services/paymentService';

test('payment lifecycle updates status from processing through a Stripe webhook', async () => {
  const payment = createPayment({ bookingId: 1, amountCents: 467400, outcome: 'success' });
  expect(payment.status).toBe('processing');
  const submitted = await submitPayment(payment);
  expect(submitted.status).toBe('success');
  const declined = handleStripeWebhook({ type: 'payment_intent.payment_failed', paymentId: payment.id });
  expect(declined.status).toBe('declined');
  expect(getPayment(payment.id).status).toBe('declined');
});
