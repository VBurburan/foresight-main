'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { BookOpen, ClipboardList, KeyRound, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  if (score >= 70) return 'text-emerald-600';
  return 'text-red-600';
}

export default function StudentExamsPage() {
  const { user, loading: authLoading } = useUser();
  const supabase = createClient();
  const router = useRouter();

  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [sessions, setSessions] = useState<ExamSessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Access code state
  const [accessCode, setAccessCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleAccessCode = async () => {
    if (!accessCode.trim()) return;
    setCodeLoading(true);
    setCodeError(null);
    try {
      const { data, error } = await supabase
        .from('instructor_assessments')
        .select('id, name, status')
        .eq('access_code', accessCode.trim().toUpperCase())
        .single();
      if (error || !data) {
        setCodeError('No exam found with that code. Check with your instructor.');
      } else if (data.status !== 'published') {
        setCodeError('That exam is not yet published.');
      } else {
        router.push(`/student/exam/${data.id}`);
      }
    } catch {
      setCodeError('Something went wrong. Try again.');
    }
    setCodeLoading(false);
  };

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
        <div className="h-8 w-32 bg-zinc-100 rounded-md animate-pulse" />
        <div className="h-64 bg-zinc-100 rounded-md animate-pulse" />
        <div className="h-64 bg-zinc-100 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Exams</h1>

      {/* Access Code Entry */}
      <section className="glass-card p-5">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="w-4 h-4 text-zinc-500" />
          <p className="text-sm font-medium text-zinc-700">Have an access code?</p>
        </div>
        <p className="text-xs text-zinc-400 mb-3">Enter the code provided by your instructor to start an exam.</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Access code"
            value={accessCode}
            onChange={(e) => { setAccessCode(e.target.value.toUpperCase()); setCodeError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && accessCode.trim() && handleAccessCode()}
            className="h-9 w-40 rounded-lg border border-zinc-300 bg-zinc-50 px-3 font-mono text-sm tracking-wider uppercase text-zinc-900 placeholder:text-zinc-400 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            maxLength={8}
          />
          <button
            onClick={handleAccessCode}
            disabled={codeLoading || !accessCode.trim()}
            className="inline-flex h-9 items-center rounded-lg bg-[#1a365d] hover:bg-[#2d4a7a] px-4 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
          </button>
        </div>
        {codeError && <p className="mt-2 text-xs text-red-600">{codeError}</p>}
      </section>

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
          <div className="glass-card overflow-hidden divide-y divide-zinc-200">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 truncate">
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
                <tr className="border-b border-zinc-200">
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3">Assessment</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3">Score</th>
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3 hidden md:table-cell">Date</th>
                  <th className="text-right text-xs font-medium uppercase tracking-wider text-zinc-400 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {sessions.map((session) => {
                  const a = session.assessment_id
                    ? assessmentMap.get(session.assessment_id)
                    : null;
                  const dateStr = session.completed_at || session.started_at;

                  return (
                    <tr key={session.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-zinc-900">
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
