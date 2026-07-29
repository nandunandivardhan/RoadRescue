/**
 * Payment Service — Stripe Integration (Mocked Backend)
 *
 * In production, the PaymentIntent should be created on a secure server.
 * This file mocks that backend call for the MVP.
 */

const STRIPE_BACKEND_URL = process.env.STRIPE_BACKEND_URL || 'http://localhost:3000';

/**
 * Create a payment intent (MOCKED for MVP)
 * In production, this calls your secure backend
 */
export const createPaymentIntent = async (amount, currency = 'inr') => {
  // MOCK: Simulate a backend response
  // In production, replace this with:
  // const response = await fetch(`${STRIPE_BACKEND_URL}/create-payment-intent`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ amount, currency }),
  // });
  // const data = await response.json();
  // return data.clientSecret;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2)}`,
        paymentIntentId: `pi_mock_${Date.now()}`,
        amount,
        currency,
      });
    }, 1000); // Simulate network delay
  });
};

/**
 * Confirm payment (MOCKED)
 */
export const confirmPayment = async (clientSecret) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        paymentId: `pay_${Date.now()}`,
        status: 'succeeded',
        message: 'Payment completed successfully',
      });
    }, 1500);
  });
};

/**
 * Get estimated service cost
 */
export const getServiceEstimate = (issueType, distanceKm = 5) => {
  const basePrices = {
    flat_tire: 350,
    battery: 500,
    engine: 800,
    fuel: 250,
    lockout: 400,
    accident: 1200,
    towing: 1500,
    other: 600,
  };

  const basePrice = basePrices[issueType] || 600;
  const distanceSurcharge = Math.max(0, (distanceKm - 3) * 30); // ₹30/km after 3km
  const total = basePrice + distanceSurcharge;

  return {
    basePrice,
    distanceSurcharge: Math.round(distanceSurcharge),
    total: Math.round(total),
    currency: 'INR',
  };
};
