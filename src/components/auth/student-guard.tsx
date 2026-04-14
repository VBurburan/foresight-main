'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentGuardProps {
  children: React.ReactNode;
}

/**
 * Guards student-only routes. If the user is an instructor/admin,
 * redirects them to the instructor dashboard. If not authenticated,
 * redirects to login.
 */
export function StudentGuard({ children }: StudentGuardProps) {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    async function checkRole() {
      const supabase = createClient();
      const { data } = await supabase
        .from('students')
        .select('role')
        .eq('user_id', user!.id)
        .single();

      // If the user is an instructor/admin, redirect to instructor dashboard
      if (data?.role === 'instructor' || data?.role === 'admin') {
        router.replace('/instructor/dashboard');
        return;
      }

      // Otherwise allow — students and users with no role or role='student'
      setAuthorized(true);
      setChecking(false);
    }

    checkRole();
  }, [user, authLoading, router]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
