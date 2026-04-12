'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface InstructorGuardProps {
  children: React.ReactNode;
}

export function InstructorGuard({ children }: InstructorGuardProps) {
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
      const { data, error } = await supabase
        .from('students')
        .select('role')
        .eq('user_id', user!.id)
        .single();

      if (error || !data || (data.role !== 'instructor' && data.role !== 'admin')) {
        // Not authorized -- redirect to login
        router.replace('/login');
        return;
      }

      setAuthorized(true);
      setChecking(false);
    }

    checkRole();
  }, [user, authLoading, router]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
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

export function useStudentRole() {
  const { user, loading: authLoading } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchRole() {
      const supabase = createClient();
      const { data } = await supabase
        .from('students')
        .select('role')
        .eq('user_id', user!.id)
        .single();

      setRole(data?.role ?? null);
      setLoading(false);
    }

    fetchRole();
  }, [user, authLoading]);

  const isInstructor = role === 'instructor' || role === 'admin';

  return { role, isInstructor, loading };
}
