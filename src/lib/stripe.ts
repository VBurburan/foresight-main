import Stripe from "stripe";

// Lazy init to avoid build-time errors when env vars aren't set
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil" as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

// Foresight institutional pricing (to be configured in Stripe Dashboard)
export const FORESIGHT_PRODUCTS = {
  cohort_small: { name: "Foresight — Small Cohort (up to 25 students)", price: 199900 },
  cohort_medium: { name: "Foresight — Medium Cohort (up to 50 students)", price: 249900 },
  cohort_large: { name: "Foresight — Large Cohort (up to 100 students)", price: 299900 },
} as const;

export type ForesightProductId = keyof typeof FORESIGHT_PRODUCTS;
