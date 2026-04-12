'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { BarChart3, Eye, Clock, Trophy, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
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

function getScoreBadgeVariant(score: number | null): 'success' | 'destructive' | 'secondary' {
  if (score == null) return 'secondary';
  if (score >= 70) return 'success';
  return 'destructive';
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
        // 1. Fetch all exam sessions with an assessment_id
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

        // 2. Collect unique assessment IDs and fetch their names
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

        // 3. Merge into display rows
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

  // Summary stats
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

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A] flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          My Results
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your past exam scores and performance.
        </p>
      </div>

      {/* Summary Stats */}
      {completedSessions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Exams Taken</p>
                <p className="text-xl font-bold text-slate-900">{completedSessions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Best Score</p>
                <p className="text-xl font-bold text-green-600">{bestScore ?? '--'}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Avg Score</p>
                <p className="text-xl font-bold text-slate-900">{avgScore ?? '--'}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No Results Yet</h2>
            <p className="text-sm text-slate-500 mb-6">
              Once you complete an exam, your results will appear here.
            </p>
            <Button asChild>
              <Link href="/student/exams">Browse Exams</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Correct</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const dateStr = session.completed_at || session.started_at;

                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium text-slate-900">
                      {session.assessment_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {session.score_percentage != null ? (
                        <Badge variant={getScoreBadgeVariant(session.score_percentage)}>
                          {session.score_percentage}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-slate-600 hidden sm:table-cell">
                      {session.total_correct != null && session.question_count != null
                        ? `${session.total_correct}/${session.question_count}`
                        : '--'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm hidden md:table-cell">
                      {dateStr
                        ? format(new Date(dateStr), 'MMM d, yyyy h:mm a')
                        : '--'}
                    </TableCell>
                    <TableCell className="text-center text-slate-500 text-sm hidden sm:table-cell">
                      {formatDuration(session.time_spent_seconds)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/student/results/${session.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
