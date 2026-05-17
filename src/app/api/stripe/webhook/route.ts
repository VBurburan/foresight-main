import { NextRequest, NextResponse } from 'next/server'
import { getStripe, FORESIGHT_PRODUCTS, getPlanFromPriceId } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import type Stripe from 'stripe'

const MAX_STUDENTS: Record<string, number> = Object.fromEntries(
  Object.entries(FORESIGHT_PRODUCTS).map(([key, val]) => [key, val.maxStudents])
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const service = createServiceClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const status =
        sub.status === 'active' || sub.status === 'trialing' ? 'active' : sub.status
      const priceId = sub.items.data[0]?.price.id ?? null
      const plan = priceId ? getPlanFromPriceId(priceId) : null
      const maxStudents = plan ? (MAX_STUDENTS[plan] ?? null) : null

      await service
        .from('instructors')
        .update({
          subscription_status: status,
          subscription_plan: plan,
          max_students: maxStudents,
        } as any)
        .eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await service
        .from('instructors')
        .update({
          subscription_status: 'canceled',
          subscription_plan: null,
          max_students: null,
        } as any)
        .eq('stripe_customer_id', sub.customer as string)
      break
    }
  }

  return NextResponse.json({ received: true })
}
