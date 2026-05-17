import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: instructor } = await service
    .from('instructors')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!instructor?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: instructor.stripe_customer_id,
    return_url: `${siteUrl}/instructor/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
