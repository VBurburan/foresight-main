'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  BookOpen,
  Clock,
  GraduationCap,
  PlayCircle,
  Eye,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

interface AssessmentRow {
  id: string;
  name: string;
  certification_level: string | null;
  question_count: number | null;
  status: string | null;
  class_id: string | null;
  created_at: string | null;
}

interface ExamSessionRow {
  id: string;
  student_id: string;
  assessment_id: string | null;
  status: string | null;
  score_percentage: number | null;
  total_correct: number | null;
  question_count: number | null;
  time_spent_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function getScoreColor(score: number | null): string {
  if (score == null) return 'text-slate-400';
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBadgeVariant(score: number | null): 'success' | 'destructive' | 'secondary' {
  if (score == null) return 'secondary';
  if (score >= 70) return 'success';
  return 'destructive';
}

export default function StudentExamsPage() {
  const { user, loading: authLoading } = useUser();
  const supabase = createClient();

  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [sessions, setSessions] = useState<ExamSessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Build a lookup: assessment_id -> assessment name for the table
  const assessmentMap = new Map<string, AssessmentRow>();
  assessments.forEach((a) => assessmentMap.set(a.id, a));

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchData() {
      setLoading(true);

      try {
        // 1. Get student's enrolled class IDs
        const { data: enrollments } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('student_id', user!.id);

        const classIds = (enrollments || []).map((e: any) => e.class_id);

        // 2. Fetch published assessments for those classes
        if (classIds.length > 0) {
          const { data: assessmentData } = await supabase
            .from('instructor_assessments')
            .select('id, name, certification_level, question_count, status, class_id, created_at')
            .eq('status', 'published')
            .in('class_id', classIds);

          if (assessmentData) {
            setAssessments(assessmentData as AssessmentRow[]);
          }
        } else {
          // No class enrollments - also try fetching any published assessments
          // that have no class restriction (open assessments)
          const { data: openAssessments } = await supabase
            .from('instructor_assessments')
            .select('id, name, certification_level, question_count, status, class_id, created_at')
            .eq('status', 'published')
            .is('class_id', null);

          if (openAssessments) {
            setAssessments(openAssessments as AssessmentRow[]);
          }
        }

        // 3. Fetch past exam sessions
        const { data: sessionData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('student_id', user!.id)
          .not('assessment_id', 'is', null)
          .order('completed_at', { ascending: false });

        if (sessionData) {
          setSessions(sessionData as ExamSessionRow[]);
        }
      } catch (err) {
        console.error('Error fetching exam data:', err);
      }

      setLoading(false);
    }

    fetchData();
  }, [user, authLoading, supabase]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A] flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          My Exams
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View available assessments and your past attempts.
        </p>
      </div>

      {/* Available Assessments Section */}
      <section>
        <h2 className="text-lg font-semibold text-[#0D1B2A] mb-4 flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-[#0D1B2A]" />
          Available Assessments
        </h2>

        {assessments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                No assessments are available right now. Check back after your instructor publishes one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map((assessment) => {
              // Count how many times this assessment has been attempted
              const attemptCount = sessions.filter(
                (s) => s.assessment_id === assessment.id
              ).length;
              const bestScore = sessions
                .filter((s) => s.assessment_id === assessment.id && s.score_percentage != null)
                .reduce((best, s) => Math.max(best, s.score_percentage!), 0);

              return (
                <Card
                  key={assessment.id}
                  className="hover:shadow-md transition-shadow border-t-4 border-t-[#0D1B2A]"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-slate-900 leading-tight">
                        {assessment.name}
                      </CardTitle>
                      {assessment.certification_level && (
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                          {assessment.certification_level}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {assessment.question_count ?? '?'} questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {attemptCount > 0 && (
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{attemptCount} attempt{attemptCount !== 1 ? 's' : ''}</span>
                        <span className="text-slate-300">|</span>
                        <span>
                          Best: <span className={`font-semibold ${getScoreColor(bestScore)}`}>{bestScore}%</span>
                        </span>
                      </div>
                    )}
                    <Button className="w-full bg-[#0D1B2A] hover:bg-[#1B4F72]" asChild>
                      <Link href={`/student/exam/${assessment.id}`}>
                        <GraduationCap className="w-4 h-4 mr-2" />
                        {attemptCount > 0 ? 'Retake Exam' : 'Take Exam'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* Past Attempts Section */}
      <section>
        <h2 className="text-lg font-semibold text-[#0D1B2A] mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#0D1B2A]" />
          Past Attempts
        </h2>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                You have not taken any exams yet. Start one from the list above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const a = session.assessment_id
                    ? assessmentMap.get(session.assessment_id)
                    : null;
                  const dateStr = session.completed_at || session.started_at;

                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium text-slate-900">
                        {a?.name || 'Unknown Assessment'}
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
                      <TableCell className="text-center hidden sm:table-cell">
                        <Badge
                          variant={session.status === 'completed' ? 'secondary' : 'outline'}
                          className="text-[10px]"
                        >
                          {session.status || 'unknown'}
                        </Badge>
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
                            View
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
      </section>
    </div>
  );
}
