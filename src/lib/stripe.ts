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
  cohort_small: { name: "Foresight — Small Cohort (up to 25 students)", price: 199900, maxStudents: 25 },
  cohort_medium: { name: "Foresight — Medium Cohort (up to 50 students)", price: 249900, maxStudents: 50 },
  cohort_large: { name: "Foresight — Large Cohort (up to 100 students)", price: 299900, maxStudents: 100 },
} as const;

export type ForesightProductId = keyof typeof FORESIGHT_PRODUCTS;

// Stripe Price IDs — create these in the Stripe Dashboard and set the env vars
export function getPriceId(plan: ForesightProductId): string | null {
  const map: Record<ForesightProductId, string | undefined> = {
    cohort_small: process.env.STRIPE_PRICE_COHORT_SMALL,
    cohort_medium: process.env.STRIPE_PRICE_COHORT_MEDIUM,
    cohort_large: process.env.STRIPE_PRICE_COHORT_LARGE,
  };
  return map[plan] ?? null;
}

// Reverse-lookup: given a Stripe price ID, return the plan key
export function getPlanFromPriceId(priceId: string): ForesightProductId | null {
  for (const [plan, envPriceId] of [
    ["cohort_small", process.env.STRIPE_PRICE_COHORT_SMALL],
    ["cohort_medium", process.env.STRIPE_PRICE_COHORT_MEDIUM],
    ["cohort_large", process.env.STRIPE_PRICE_COHORT_LARGE],
  ] as [ForesightProductId, string | undefined][]) {
    if (envPriceId && envPriceId === priceId) return plan;
  }
  return null;
}
