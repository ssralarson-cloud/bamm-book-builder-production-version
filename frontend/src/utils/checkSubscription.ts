/**
 * Subscription verification utility
 * Safely checks subscription status without modifying existing application logic
 */

const BILLING_SERVER_URL = import.meta.env.VITE_BILLING_SERVER_URL || 'http://localhost:4002';

export interface SubscriptionStatus {
  hasSubscription: boolean;
  status: string | null;
  isActive: boolean;
  startDate?: number;
  endDate?: number;
}

/**
 * Check subscription status for a user principal
 * @param userPrincipal - The user's Internet Identity principal
 * @returns Subscription status information
 */
export async function checkSubscription(userPrincipal: string): Promise<SubscriptionStatus> {
  try {
    const response = await fetch(
      `${BILLING_SERVER_URL}/api/check-subscription?userPrincipal=${encodeURIComponent(userPrincipal)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      hasSubscription: false,
      status: null,
      isActive: false,
    };
  }
}

/**
 * Create a Stripe checkout session for subscription purchase (principal-based)
 */
export async function createCheckoutSession(
  userPrincipal: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  try {
    const response = await fetch(`${BILLING_SERVER_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrincipal, successUrl, cancelUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create a Stripe checkout session using email (no account required)
 */
export async function createEmailCheckoutSession(
  email: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  try {
    const response = await fetch(`${BILLING_SERVER_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, successUrl, cancelUrl }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating email checkout session:', error);
    throw error;
  }
}

/**
 * Check subscription status by email (queries Stripe directly)
 */
export async function checkSubscriptionByEmail(email: string): Promise<SubscriptionStatus> {
  try {
    const response = await fetch(
      `${BILLING_SERVER_URL}/api/check-subscription-by-email?email=${encodeURIComponent(email)}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking email subscription:', error);
    return { hasSubscription: false, status: null, isActive: false };
  }
}
