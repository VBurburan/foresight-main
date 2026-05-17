import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe, FORESIGHT_PRODUCTS, getPriceId } from '@/lib/stripe'
import type { ForesightProductId } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { plan } = body as { plan: string }

  if (!plan || !(plan in FORESIGHT_PRODUCTS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const priceId = getPriceId(plan as ForesightProductId)
  if (!priceId) {
    return NextResponse.json(
      { error: 'Stripe price not configured for this plan — set STRIPE_PRICE_COHORT_* env vars' },
      { status: 500 }
    )
  }

  const service = createServiceClient()
  const { data: instructor } = await service
    .from('instructors')
    .select('id, stripe_customer_id, email, full_name, institution')
    .eq('user_id', user.id)
    .single()

  if (!instructor) {
    return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
  }

  const stripe = getStripe()

  // Ensure a Stripe customer exists (may have been skipped at signup if Stripe wasn't configured)
  let customerId = instructor.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: instructor.email,
      name: instructor.full_name ?? undefined,
      metadata: {
        supabase_user_id: user.id,
        institution: instructor.institution ?? '',
      },
    })
    customerId = customer.id
    await service
      .from('instructors')
      .update({ stripe_customer_id: customerId })
      .eq('id', instructor.id)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/instructor/billing?success=1`,
    cancel_url: `${siteUrl}/instructor/billing?canceled=1`,
    metadata: { instructor_id: instructor.id, plan },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
