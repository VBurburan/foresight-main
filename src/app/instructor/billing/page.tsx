'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, CreditCard, Users, ExternalLink, Loader2, CheckCheck } from 'lucide-react';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

interface InstructorBilling {
  subscription_status: string | null;
  subscription_plan: string | null;
  max_students: number | null;
  stripe_customer_id: string | null;
}

const PLANS = [
  {
    id: 'cohort_small',
    name: 'Small Cohort',
    price: '$1,999',
    period: 'per cohort',
    students: 'Up to 25 students',
    maxStudents: 25,
    highlighted: false,
    features: ['All 7 NREMT TEI question types', 'AI question generation', 'Class analytics', 'Student results & review'],
  },
  {
    id: 'cohort_medium',
    name: 'Medium Cohort',
    price: '$2,499',
    period: 'per cohort',
    students: 'Up to 50 students',
    maxStudents: 50,
    features: ['All 7 NREMT TEI question types', 'AI question generation', 'Class analytics', 'Student results & review'],
    highlighted: true,
  },
  {
    id: 'cohort_large',
    name: 'Large Cohort',
    price: '$2,999',
    period: 'per cohort',
    students: 'Up to 100 students',
    maxStudents: 100,
    highlighted: false,
    features: ['All 7 NREMT TEI question types', 'AI question generation', 'Class analytics', 'Student results & review'],
  },
] as const;

const PLAN_LABELS: Record<string, string> = {
  cohort_small: 'Small Cohort',
  cohort_medium: 'Medium Cohort',
  cohort_large: 'Large Cohort',
};

function BillingContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<InstructorBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setFlashMessage({ type: 'success', text: 'Payment successful — your subscription is now active.' });
    } else if (searchParams.get('canceled') === '1') {
      setFlashMessage({ type: 'info', text: 'Checkout was canceled. No charge was made.' });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('instructors')
      .select('subscription_status, subscription_plan, max_students, stripe_customer_id')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setBilling(data as InstructorBilling | null);
        setLoading(false);
      });
  }, [user]);

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setFlashMessage({ type: 'info', text: data.error ?? 'Could not start checkout.' });
        setCheckoutLoading(null);
      }
    } catch {
      setFlashMessage({ type: 'info', text: 'Something went wrong. Please try again.' });
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setFlashMessage({ type: 'info', text: data.error ?? 'Could not open billing portal.' });
        setPortalLoading(false);
      }
    } catch {
      setFlashMessage({ type: 'info', text: 'Something went wrong. Please try again.' });
      setPortalLoading(false);
    }
  };

  const isActive = billing?.subscription_status === 'active';
  const planLabel = billing?.subscription_plan ? PLAN_LABELS[billing.subscription_plan] : null;

  if (loading) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-7 w-40 rounded-md bg-zinc-100 animate-pulse" />
          <div className="h-32 rounded-xl bg-white border border-zinc-200 animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-white border border-zinc-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Billing</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your Foresight subscription</p>
        </div>

        {/* Flash message */}
        {flashMessage && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              flashMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-zinc-200 bg-zinc-50 text-zinc-700'
            }`}
          >
            {flashMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-zinc-500" />
            )}
            {flashMessage.text}
          </div>
        )}

        {/* Current plan status */}
        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                <CreditCard className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {isActive ? planLabel ?? 'Active Subscription' : 'No Active Subscription'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isActive
                    ? `Up to ${billing?.max_students ?? '—'} students per cohort`
                    : 'Subscribe to publish assessments and enroll students'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {isActive ? 'Active' : billing?.subscription_status ?? 'Inactive'}
              </span>
              {isActive && billing?.stripe_customer_id && (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                >
                  {portalLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                  Manage Billing
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Plan cards — always shown so the instructor can upgrade */}
        <div>
          <h2 className="text-sm font-medium text-zinc-700 mb-4">
            {isActive ? 'Change Plan' : 'Choose a Plan'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = billing?.subscription_plan === plan.id && isActive;
              const isLoading = checkoutLoading === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-5 flex flex-col ${
                    plan.highlighted
                      ? 'border-blue-500 bg-blue-50/40'
                      : isCurrent
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  {plan.highlighted && !isCurrent && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-medium text-white">
                      Most popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-medium text-white">
                      Current plan
                    </span>
                  )}

                  <div className="mb-4">
                    <p className="text-sm font-semibold text-zinc-900">{plan.name}</p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-zinc-900">{plan.price}</span>
                      <span className="text-xs text-zinc-500">{plan.period}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-600">
                      <Users className="h-3.5 w-3.5" />
                      {plan.students}
                    </div>
                  </div>

                  <ul className="flex-1 space-y-1.5 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-zinc-600">
                        <CheckCheck className="h-3.5 w-3.5 shrink-0 mt-px text-zinc-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !isCurrent && handleCheckout(plan.id)}
                    disabled={isCurrent || isLoading || checkoutLoading !== null}
                    className={`w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-zinc-100 text-zinc-400 cursor-default'
                        : plan.highlighted
                        ? 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Redirecting...
                      </span>
                    ) : isCurrent ? (
                      'Current plan'
                    ) : isActive ? (
                      'Switch to this plan'
                    ) : (
                      'Get started'
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-zinc-400 text-center">
            Questions about pricing?{' '}
            <a href="mailto:support@foresight.app" className="underline hover:text-zinc-600">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <InstructorGuard>
      <BillingContent />
    </InstructorGuard>
  );
}
