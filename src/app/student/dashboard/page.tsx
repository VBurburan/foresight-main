'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ClipboardList,
  Clock,
  GraduationCap,
  KeyRound,
  Loader2,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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

function scoreBadgeClasses(score: number): string {
  if (score >= 75) return 'bg-green-100 text-green-800 border border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return 'bg-red-100 text-red-800 border border-red-200';
}

function certBadgeClasses(cert: string | null): string {
  switch (cert) {
    case 'Paramedic':
      return 'bg-[#1B4F72]/10 text-[#1B4F72] border border-[#1B4F72]/20';
    case 'AEMT':
      return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    case 'EMT':
      return 'bg-sky-100 text-sky-800 border border-sky-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
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

  /* ---- loading skeleton ---- */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 md:pt-8 pt-20">
        <div className="mx-auto max-w-5xl space-y-8">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 md:pt-0 pt-20">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">Please sign in to view your dashboard.</p>
            <Link href="/login" className="mt-4 block">
              <Button className="bg-[#1B4F72] hover:bg-[#163d5a]">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 md:pt-8 pt-20">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* ---- Header ---- */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-[#1B4F72]">
            Welcome back, {studentName.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your learning dashboard — classes, assessments, and results in one place.
          </p>
        </motion.div>

        <Separator />

        {/* ---- No Classes: Join a Class ---- */}
        {classes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-dashed border-[#1B4F72]/20">
              <CardContent className="flex flex-col items-center justify-center py-14">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1B4F72]/10 mb-4">
                  <KeyRound className="h-7 w-7 text-[#1B4F72]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1B4F72]">
                  Join Your First Class
                </h3>
                <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
                  Enter the enrollment code provided by your instructor to get started.
                </p>
                <div className="mt-6 flex w-full max-w-sm gap-2">
                  <Input
                    placeholder="Enrollment code"
                    value={enrollCode}
                    onChange={(e) => {
                      setEnrollCode(e.target.value.toUpperCase());
                      setEnrollError(null);
                      setEnrollSuccess(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinClass()}
                    className="font-mono tracking-wider text-center uppercase"
                    maxLength={12}
                  />
                  <Button
                    onClick={handleJoinClass}
                    disabled={enrolling || !enrollCode.trim()}
                    className="bg-[#1B4F72] hover:bg-[#163d5a] shrink-0"
                  >
                    {enrolling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Join'
                    )}
                  </Button>
                </div>
                {enrollError && (
                  <p className="mt-3 text-sm text-red-600">{enrollError}</p>
                )}
                {enrollSuccess && (
                  <p className="mt-3 text-sm text-green-700">{enrollSuccess}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ---- Your Classes ---- */}
        {classes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#1B4F72]" />
                <h2 className="text-lg font-semibold text-[#1e293b]">Your Classes</h2>
              </div>

              {/* Inline join input when already enrolled in at least one class */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Join code"
                  value={enrollCode}
                  onChange={(e) => {
                    setEnrollCode(e.target.value.toUpperCase());
                    setEnrollError(null);
                    setEnrollSuccess(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinClass()}
                  className="h-9 w-32 font-mono text-xs tracking-wider text-center uppercase"
                  maxLength={12}
                />
                <Button
                  size="sm"
                  onClick={handleJoinClass}
                  disabled={enrolling || !enrollCode.trim()}
                  className="bg-[#1B4F72] hover:bg-[#163d5a] h-9"
                >
                  {enrolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Join'}
                </Button>
              </div>
            </div>

            {enrollError && (
              <p className="text-sm text-red-600">{enrollError}</p>
            )}
            {enrollSuccess && (
              <p className="text-sm text-green-700">{enrollSuccess}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls, idx) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                >
                  <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1B4F72]/10">
                          <BookOpen className="h-5 w-5 text-[#1B4F72]" />
                        </div>
                        {cls.certification_level && (
                          <Badge className={certBadgeClasses(cls.certification_level)}>
                            {cls.certification_level}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-3 font-semibold text-[#1e293b] leading-snug">
                        {cls.name}
                      </h3>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ---- Available Assessments ---- */}
        {classes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#1B4F72]" />
              <h2 className="text-lg font-semibold text-[#1e293b]">Available Assessments</h2>
            </div>

            {assessments.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {assessments.map((a, idx) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                  >
                    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#1e293b] truncate">
                              {a.name}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">{a.class_name}</p>
                          </div>
                          {a.certification_level && (
                            <Badge className={certBadgeClasses(a.certification_level)}>
                              {a.certification_level}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {a.question_count != null && (
                              <span className="flex items-center gap-1">
                                <ClipboardList className="h-3.5 w-3.5" />
                                {a.question_count} question{a.question_count !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <Link href={`/student/exam/${a.id}`}>
                            <Button
                              size="sm"
                              className="bg-[#1B4F72] hover:bg-[#163d5a] text-white"
                            >
                              Take Exam
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <ClipboardList className="h-10 w-10 mb-3" />
                  <p className="text-sm">No assessments available yet.</p>
                  <p className="text-xs mt-1">Your instructor will publish assessments when they are ready.</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ---- Recent Results ---- */}
        {classes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#1B4F72]" />
              <h2 className="text-lg font-semibold text-[#1e293b]">Recent Results</h2>
            </div>

            {results.length > 0 ? (
              <Card className="shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50/80">
                        <th className="px-5 py-3 text-left font-medium text-slate-500">Assessment</th>
                        <th className="px-5 py-3 text-left font-medium text-slate-500">Level</th>
                        <th className="px-5 py-3 text-left font-medium text-slate-500">Score</th>
                        <th className="px-5 py-3 text-left font-medium text-slate-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, idx) => (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + idx * 0.03 }}
                          className="border-b last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-medium text-[#1e293b]">
                            {r.assessment_name}
                          </td>
                          <td className="px-5 py-3.5">
                            {r.certification_level ? (
                              <Badge className={certBadgeClasses(r.certification_level)}>
                                {r.certification_level}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {r.score_percentage != null ? (
                              <Badge className={scoreBadgeClasses(r.score_percentage)}>
                                {r.score_percentage}%
                              </Badge>
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {r.completed_at ? formatDate(r.completed_at) : '--'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Trophy className="h-10 w-10 mb-3" />
                  <p className="text-sm">No exam results yet.</p>
                  <p className="text-xs mt-1">Complete an assessment to see your scores here.</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
