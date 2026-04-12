'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

interface SessionWithAssessment {
  id: string;
  assessment_id: string | null;
  assessment_name: string;
  score_percentage: number | null;
  total_correct: number | null;
  question_count: number | null;
  time_spent_seconds: number | null;
  status: string | null;
  completed_at: string | null;
  started_at: string | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function getScoreColor(score: number | null): string {
  if (score == null) return 'text-zinc-400';
  if (score >= 70) return 'text-emerald-400';
  return 'text-red-400';
}

export default function StudentResultsPage() {
  const { user, loading: authLoading } = useUser();
  const supabase = createClient();

  const [sessions, setSessions] = useState<SessionWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchResults() {
      setLoading(true);

      try {
        const { data: sessionData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('student_id', user!.id)
          .not('assessment_id', 'is', null)
          .order('completed_at', { ascending: false });

        if (!sessionData || sessionData.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }

        const assessmentIds = [
          ...new Set(
            sessionData
              .map((s: any) => s.assessment_id)
              .filter(Boolean) as string[]
          ),
        ];

        const assessmentMap = new Map<string, string>();

        if (assessmentIds.length > 0) {
          const { data: assessmentData } = await supabase
            .from('instructor_assessments')
            .select('id, name')
            .in('id', assessmentIds);

          if (assessmentData) {
            assessmentData.forEach((a: any) => assessmentMap.set(a.id, a.name));
          }
        }

        const merged: SessionWithAssessment[] = sessionData.map((s: any) => ({
          id: s.id,
          assessment_id: s.assessment_id,
          assessment_name: assessmentMap.get(s.assessment_id) || 'Unknown Assessment',
          score_percentage: s.score_percentage,
          total_correct: s.total_correct,
          question_count: s.question_count,
          time_spent_seconds: s.time_spent_seconds,
          status: s.status,
          completed_at: s.completed_at,
          started_at: s.started_at,
        }));

        setSessions(merged);
      } catch (err) {
        console.error('Error fetching results:', err);
      }

      setLoading(false);
    }

    fetchResults();
  }, [user, authLoading, supabase]);

  const completedSessions = sessions.filter((s) => s.score_percentage != null);
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((sum, s) => sum + (s.score_percentage ?? 0), 0) /
            completedSessions.length
        )
      : null;
  const bestScore =
    completedSessions.length > 0
      ? Math.max(...completedSessions.map((s) => s.score_percentage ?? 0))
      : null;

  if (authLoading || loading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-zinc-800 rounded-md animate-pulse" />
        <div className="h-16 bg-zinc-800 rounded-md animate-pulse" />
        <div className="h-64 bg-zinc-800 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-semibold text-white">Results</h1>

      {/* Summary Stats */}
      {completedSessions.length > 0 && (
        <div className="glass-card flex items-center gap-8 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Exams</p>
            <p className="text-lg font-semibold text-white">{completedSessions.length}</p>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Average Score</p>
            <p className="text-lg font-semibold text-white">{avgScore ?? '--'}%</p>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Best Score</p>
            <p className={`text-lg font-semibold ${getScoreColor(bestScore)}`}>
              {bestScore ?? '--'}%
            </p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {sessions.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <div className="inline-flex items-center justify-center surface-2 rounded-full p-3 mb-3">
            <ClipboardList className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-400 mb-4">No results yet.</p>
          <Link
            href="/student/exams"
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Browse Exams
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3">Assessment</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3">Score</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3 hidden md:table-cell">Date</th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3 hidden sm:table-cell">Time</th>
                <th className="text-right text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {sessions.map((session) => {
                const dateStr = session.completed_at || session.started_at;

                return (
                  <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-medium text-white">
                      {session.assessment_name}
                    </td>
                    <td className="px-5 py-3">
                      {session.score_percentage != null ? (
                        <span className={`font-semibold ${getScoreColor(session.score_percentage)}`}>
                          {session.score_percentage}%
                        </span>
                      ) : (
                        <span className="text-zinc-400">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-400 hidden md:table-cell">
                      {dateStr
                        ? format(new Date(dateStr), 'MMM d, yyyy')
                        : '--'}
                    </td>
                    <td className="px-5 py-3 text-zinc-400 hidden sm:table-cell">
                      {formatDuration(session.time_spent_seconds)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/student/results/${session.id}`}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Details &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
