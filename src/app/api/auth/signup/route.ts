import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, full_name, institution, certification_level } = body

  if (!email || !password || !full_name || !institution) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = await createClient()

  // 1. Create auth user — Supabase sends the confirmation email automatically
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...(process.env.NEXT_PUBLIC_SITE_URL && {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
      }),
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // signUp returns a user even when email confirmation is pending
  const user = authData.user
  if (!user) {
    // Edge case: Supabase returns null user when the email already has an unconfirmed signup
    return NextResponse.json(
      { error: 'An account with this email may already exist. Check your inbox for a confirmation email.' },
      { status: 409 }
    )
  }

  const service = createServiceClient()

  // 2. Create students row — required for role-based auth guard (InstructorGuard reads students.role)
  const { error: studentError } = await service.from('students').insert({
    user_id: user.id,
    email,
    full_name,
    certification_level: certification_level ?? null,
    role: 'instructor',
  })

  if (studentError) {
    await service.auth.admin.deleteUser(user.id)
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }

  // 3. Create instructors row
  const { data: instructorRow, error: instructorError } = await service
    .from('instructors')
    .insert({ user_id: user.id, email, full_name, institution, role: 'instructor' })
    .select('id')
    .single()

  if (instructorError) {
    await service.auth.admin.deleteUser(user.id)
    return NextResponse.json({ error: 'Failed to create instructor profile' }, { status: 500 })
  }

  // 4. Create Stripe customer (best-effort — can be backfilled if Stripe isn't configured yet)
  try {
    const stripe = getStripe()
    const customer = await stripe.customers.create({
      email,
      name: full_name,
      metadata: { supabase_user_id: user.id, institution },
    })
    await service
      .from('instructors')
      .update({ stripe_customer_id: customer.id })
      .eq('id', instructorRow.id)
  } catch {
    // Stripe not configured or unavailable — not fatal, stripe_customer_id can be set later
  }

  return NextResponse.json({ success: true })
}
