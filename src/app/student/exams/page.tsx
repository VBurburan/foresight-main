'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
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
  if (score == null) return 'text-slate-400';
  if (score >= 70) return 'text-emerald-600';
  return 'text-red-600';
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
        <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-semibold text-slate-900">Exams</h1>

      {/* Available Assessments */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          Available Assessments
        </h2>

        {assessments.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            No assessments available right now.
          </p>
        ) : (
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {assessment.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {assessment.question_count ?? '?'} questions
                    {assessment.certification_level && (
                      <span className="ml-2 text-slate-400">
                        {assessment.certification_level}
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/student/exam/${assessment.id}`}
                  className="text-sm font-medium text-slate-900 hover:text-slate-600 transition-colors whitespace-nowrap ml-4"
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
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          Past Attempts
        </h2>

        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            No exam attempts yet.
          </p>
        ) : (
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left font-medium text-slate-500 px-5 py-3">Assessment</th>
                  <th className="text-left font-medium text-slate-500 px-5 py-3">Score</th>
                  <th className="text-left font-medium text-slate-500 px-5 py-3 hidden md:table-cell">Date</th>
                  <th className="text-right font-medium text-slate-500 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((session) => {
                  const a = session.assessment_id
                    ? assessmentMap.get(session.assessment_id)
                    : null;
                  const dateStr = session.completed_at || session.started_at;

                  return (
                    <tr key={session.id}>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {a?.name || 'Unknown Assessment'}
                      </td>
                      <td className="px-5 py-3">
                        {session.score_percentage != null ? (
                          <span className={`font-semibold ${getScoreColor(session.score_percentage)}`}>
                            {session.score_percentage}%
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 hidden md:table-cell">
                        {dateStr
                          ? format(new Date(dateStr), 'MMM d, yyyy')
                          : '--'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/student/results/${session.id}`}
                          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
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
