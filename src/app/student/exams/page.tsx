'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { BookOpen, ClipboardList } from 'lucide-react';
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

function getScoreColor(score: number | null): string {
  if (score == null) return 'text-zinc-400';
  if (score >= 70) return 'text-emerald-400';
  return 'text-red-400';
}

export default function StudentExamsPage() {
  const { user, loading: authLoading } = useUser();
  const supabase = createClient();

  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [sessions, setSessions] = useState<ExamSessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const assessmentMap = new Map<string, AssessmentRow>();
  assessments.forEach((a) => assessmentMap.set(a.id, a));

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchData() {
      setLoading(true);

      try {
        const { data: enrollments } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('student_id', user!.id);

        const classIds = (enrollments || []).map((e: any) => e.class_id);

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
          const { data: openAssessments } = await supabase
            .from('instructor_assessments')
            .select('id, name, certification_level, question_count, status, class_id, created_at')
            .eq('status', 'published')
            .is('class_id', null);

          if (openAssessments) {
            setAssessments(openAssessments as AssessmentRow[]);
          }
        }

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

  if (authLoading || loading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-zinc-800 rounded-md animate-pulse" />
        <div className="h-64 bg-zinc-800 rounded-md animate-pulse" />
        <div className="h-64 bg-zinc-800 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-semibold text-white">Exams</h1>

      {/* Available Assessments */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Available Assessments
        </h2>

        {assessments.length === 0 ? (
          <div className="glass-card py-12 text-center">
            <div className="inline-flex items-center justify-center surface-2 rounded-full p-3 mb-3">
              <BookOpen className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-400">No assessments available right now.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden divide-y divide-white/[0.06]">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {assessment.name}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {assessment.question_count ?? '?'} questions
                    {assessment.certification_level && (
                      <span className="ml-2 text-zinc-400">
                        {assessment.certification_level}
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/student/exam/${assessment.id}`}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap ml-4"
                >
                  Take Exam &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Attempts */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Past Attempts
        </h2>

        {sessions.length === 0 ? (
          <div className="glass-card py-12 text-center">
            <div className="inline-flex items-center justify-center surface-2 rounded-full p-3 mb-3">
              <ClipboardList className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-400">No exam attempts yet.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3">Assessment</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3">Score</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3 hidden md:table-cell">Date</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {sessions.map((session) => {
                  const a = session.assessment_id
                    ? assessmentMap.get(session.assessment_id)
                    : null;
                  const dateStr = session.completed_at || session.started_at;

                  return (
                    <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 font-medium text-white">
                        {a?.name || 'Unknown Assessment'}
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
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/student/results/${session.id}`}
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
