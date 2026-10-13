import { mockBooking } from '../mockData';

export const feeServiceConfig = {
  simulateFailure: process.env.EXPO_PUBLIC_SIMULATE_FEE_FAILURE === 'true',
};

export async function getBookingFees(bookingId) {
  // Replace this mock with GET /api/bookings/:id/fees when the backend exists.
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (feeServiceConfig.simulateFailure) {
    throw new Error('We could not load your booking fees. Please try again.');
  }
  if (bookingId !== mockBooking.id) {
    throw new Error('Booking not found. Please check your booking and try again.');
  }
  return { ...mockBooking, fees: mockBooking.fees.map((fee) => ({ ...fee })) };
}
