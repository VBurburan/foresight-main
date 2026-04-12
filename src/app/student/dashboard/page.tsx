'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, BookOpen, BarChart3 } from 'lucide-react';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnrolledClass {
  id: string;
  name: string;
  certification_level: string | null;
}

interface AvailableAssessment {
  id: string;
  name: string;
  certification_level: string | null;
  question_count: number | null;
  class_name: string;
}

interface ExamResult {
  id: string;
  assessment_id: string | null;
  assessment_name: string;
  score_percentage: number | null;
  completed_at: string | null;
  certification_level: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StudentDashboardPage() {
  const { user, loading: authLoading } = useUser();
  const [studentName, setStudentName] = useState<string>('');
  const [classes, setClasses] = useState<EnrolledClass[]>([]);
  const [assessments, setAssessments] = useState<AvailableAssessment[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Join-class state
  const [enrollCode, setEnrollCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  /* ---- data fetch ---- */
  const fetchData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    // 1. Get student record for display name
    const { data: student } = await supabase
      .from('students')
      .select('full_name, email')
      .eq('user_id', user.id)
      .single();

    setStudentName(student?.full_name || student?.email || user.email || 'Student');

    // 2. Get enrolled classes
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('student_id', user.id);

    const classIds = (enrollments ?? []).map((e) => e.class_id);

    if (classIds.length === 0) {
      setClasses([]);
      setAssessments([]);
      setResults([]);
      setLoading(false);
      return;
    }

    // Fetch class details
    const { data: classData } = await supabase
      .from('classes')
      .select('id, name, certification_level')
      .in('id', classIds);

    const enrolledClasses: EnrolledClass[] = (classData ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      certification_level: c.certification_level,
    }));
    setClasses(enrolledClasses);

    const classNameMap: Record<string, string> = {};
    enrolledClasses.forEach((c) => {
      classNameMap[c.id] = c.name;
    });

    // 3. Published assessments for these classes
    const { data: assessmentData } = await supabase
      .from('instructor_assessments')
      .select('id, name, certification_level, question_count, class_id')
      .in('class_id', classIds)
      .eq('status', 'published');

    const availableAssessments: AvailableAssessment[] = (assessmentData ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      certification_level: a.certification_level,
      question_count: a.question_count,
      class_name: classNameMap[a.class_id] || 'Unknown Class',
    }));
    setAssessments(availableAssessments);

    // 4. Past exam sessions
    const { data: sessionData } = await supabase
      .from('exam_sessions')
      .select('id, assessment_id, score_percentage, completed_at, certification_level')
      .eq('student_id', user.id)
      .not('assessment_id', 'is', null)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20);

    // Build name lookup for assessments referenced in sessions
    const sessionAssessmentIds = [
      ...new Set((sessionData ?? []).map((s) => s.assessment_id).filter(Boolean)),
    ];

    let assessmentNameMap: Record<string, string> = {};
    if (sessionAssessmentIds.length > 0) {
      const { data: aNames } = await supabase
        .from('instructor_assessments')
        .select('id, name')
        .in('id', sessionAssessmentIds);
      (aNames ?? []).forEach((a) => {
        assessmentNameMap[a.id] = a.name;
      });
    }

    const examResults: ExamResult[] = (sessionData ?? []).map((s) => ({
      id: s.id,
      assessment_id: s.assessment_id,
      assessment_name: assessmentNameMap[s.assessment_id] || 'Practice Exam',
      score_percentage: s.score_percentage,
      completed_at: s.completed_at,
      certification_level: s.certification_level,
    }));
    setResults(examResults);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchData]);

  /* ---- join class handler ---- */
  const handleJoinClass = async () => {
    if (!user || !enrollCode.trim()) return;
    setEnrolling(true);
    setEnrollError(null);
    setEnrollSuccess(null);

    const supabase = createClient();
    const code = enrollCode.trim().toUpperCase();

    // Look up the class by enrollment code
    const { data: matchedClass, error: lookupError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('enrollment_code', code)
      .single();

    if (lookupError || !matchedClass) {
      setEnrollError('No class found with that enrollment code. Check the code and try again.');
      setEnrolling(false);
      return;
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', matchedClass.id)
      .eq('student_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      setEnrollError('You are already enrolled in this class.');
      setEnrolling(false);
      return;
    }

    // Insert enrollment
    const { error: insertError } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: matchedClass.id,
        student_id: user.id,
      });

    if (insertError) {
      setEnrollError('Failed to join class. Please try again.');
      setEnrolling(false);
      return;
    }

    setEnrollSuccess(`Joined "${matchedClass.name}" successfully!`);
    setEnrollCode('');
    setEnrolling(false);

    // Refresh data
    setLoading(true);
    fetchData();
  };

  /* ---- computed stats ---- */
  const examsTaken = results.length;
  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + (r.score_percentage ?? 0), 0) / results.length
        )
      : null;
  const bestScore =
    results.length > 0
      ? Math.max(...results.map((r) => r.score_percentage ?? 0))
      : null;

  const firstName = studentName.split(' ')[0];

  /* ---- loading skeleton ---- */
  if (authLoading || loading) {
    return (
      <div className="px-6 py-8 lg:px-10 md:pt-8 pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="h-7 w-48 rounded-md bg-zinc-800 animate-pulse" />
          <div className="mt-8 grid grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded-md bg-zinc-800 animate-pulse" />
                <div className="h-7 w-20 rounded-md bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mt-8 h-px bg-white/[0.06]" />
          <div className="mt-8 h-72 rounded-xl bg-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 md:pt-0 pt-20">
        <div className="text-center">
          <p className="text-sm text-zinc-400">Please sign in to view your dashboard.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10 md:pt-8 pt-20">
      <div className="mx-auto max-w-6xl">
        {/* ---- Header ---- */}
        <h1 className="text-2xl font-semibold text-zinc-50">
          Welcome back, {firstName}
        </h1>

        {/* ---- Join a Class (no classes enrolled) ---- */}
        {classes.length === 0 && (
          <div className="mt-8">
            <div className="glass-card px-5 py-5">
              <p className="text-sm font-medium text-zinc-50">Join a class</p>
              <p className="mt-1 text-xs text-zinc-400">
                Enter the enrollment code provided by your instructor to get started.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enrollment code"
                  value={enrollCode}
                  onChange={(e) => {
                    setEnrollCode(e.target.value.toUpperCase());
                    setEnrollError(null);
                    setEnrollSuccess(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinClass()}
                  className="h-9 w-48 rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 font-mono text-sm tracking-wider uppercase text-zinc-50 placeholder:text-zinc-400 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                  maxLength={12}
                />
                <button
                  onClick={handleJoinClass}
                  disabled={enrolling || !enrollCode.trim()}
                  className="inline-flex h-9 items-center rounded-lg bg-white px-3.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
                </button>
              </div>
              {enrollError && (
                <p className="mt-2 text-sm text-red-400">{enrollError}</p>
              )}
              {enrollSuccess && (
                <p className="mt-2 text-sm text-emerald-400">{enrollSuccess}</p>
              )}
            </div>
          </div>
        )}

        {/* ---- Quick Stats (only if student has results) ---- */}
        {results.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-3 gap-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Exams Taken
                </p>
                <p className="mt-1 text-2xl font-semibold text-zinc-50">{examsTaken}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Avg Score
                </p>
                <p className="mt-1 text-2xl font-semibold text-zinc-50">
                  {avgScore != null ? `${avgScore}%` : '--'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Best Score
                </p>
                <p className="mt-1 text-2xl font-semibold text-zinc-50">
                  {bestScore != null ? `${bestScore}%` : '--'}
                </p>
              </div>
            </div>
            <div className="mt-6 h-px bg-white/[0.06]" />
          </>
        )}

        {/* ---- Two-column layout ---- */}
        {classes.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-5">
            {/* Left: Available Assessments */}
            <div className="lg:col-span-3">
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h2 className="text-sm font-medium text-zinc-50">Available Assessments</h2>
                </div>

                {assessments.length > 0 ? (
                  <div>
                    {assessments.map((a, idx) => (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors ${
                          idx !== 0 ? 'border-t border-white/[0.06]' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-50 truncate">
                            {a.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-3">
                            {a.question_count != null && (
                              <span className="text-xs text-zinc-400">
                                {a.question_count} question{a.question_count !== 1 ? 's' : ''}
                              </span>
                            )}
                            {a.certification_level && (
                              <span className="inline-flex items-center rounded-full border border-white/[0.08] px-2 py-0.5 text-xs text-zinc-400">
                                {a.certification_level}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/student/exam/${a.id}`}
                          className="shrink-0 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Take Exam &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <div className="inline-flex items-center justify-center surface-2 rounded-full p-3 mb-3">
                      <BookOpen className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-400">No assessments available yet.</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Your instructor will publish assessments when they are ready.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Recent Results */}
            <div className="lg:col-span-2">
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h2 className="text-sm font-medium text-zinc-50">Recent Results</h2>
                </div>

                {results.length > 0 ? (
                  <div>
                    {results.slice(0, 10).map((r, idx) => (
                      <div
                        key={r.id}
                        className={`flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors ${
                          idx !== 0 ? 'border-t border-white/[0.06]' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-50 truncate">
                            {r.assessment_name}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {r.completed_at ? formatDate(r.completed_at) : '--'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {r.score_percentage != null ? (
                            <span
                              className={`text-sm font-semibold ${
                                r.score_percentage >= 70
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {r.score_percentage}%
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-400">--</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <div className="inline-flex items-center justify-center surface-2 rounded-full p-3 mb-3">
                      <BarChart3 className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-400">No results yet.</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Complete an assessment to see your scores here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- Join a Class (inline, when already enrolled) ---- */}
        {classes.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Join another class
              </p>
              <input
                type="text"
                placeholder="Code"
                value={enrollCode}
                onChange={(e) => {
                  setEnrollCode(e.target.value.toUpperCase());
                  setEnrollError(null);
                  setEnrollSuccess(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinClass()}
                className="h-8 w-28 rounded-lg border border-zinc-700 bg-zinc-900/50 px-2.5 font-mono text-xs tracking-wider uppercase text-zinc-50 placeholder:text-zinc-400 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                maxLength={12}
              />
              <button
                onClick={handleJoinClass}
                disabled={enrolling || !enrollCode.trim()}
                className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {enrolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Join'}
              </button>
            </div>
            {enrollError && (
              <p className="mt-2 text-sm text-red-400">{enrollError}</p>
            )}
            {enrollSuccess && (
              <p className="mt-2 text-sm text-emerald-400">{enrollSuccess}</p>
            )}
          </div>
        )}

        {/* ---- Your Classes ---- */}
        {classes.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Your Classes
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {classes.map((cls) => (
                <span
                  key={cls.id}
                  className="inline-flex items-center rounded-full surface-2 border border-white/[0.08] px-3 py-1 text-sm text-zinc-300"
                >
                  {cls.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
