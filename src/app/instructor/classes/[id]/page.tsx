'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

interface StudentRow {
  userId: string;
  fullName: string;
  email: string;
  lastActivity: string | null;
  avgScore: number | null;
  sessionsCompleted: number;
}

interface DomainPerformance {
  domain: string;
  avgScore: number;
}

interface ClassInfo {
  id: string;
  name: string;
  certification_level: string | null;
  enrollment_code: string | null;
  is_active: boolean | null;
  description: string | null;
  max_students: number | null;
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function statusDot(score: number | null): { color: string; label: string } {
  if (score === null) return { color: 'bg-zinc-600', label: '' };
  if (score < 60) return { color: 'bg-red-600', label: 'At Risk' };
  if (score < 75) return { color: 'bg-amber-400', label: 'Monitor' };
  return { color: 'bg-emerald-600', label: 'On Track' };
}

function ClassDetailContent({ classId }: { classId: string }) {
  const { user } = useUser();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [domainPerf, setDomainPerf] = useState<DomainPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const supabase = createClient();

      const { data: cls } = await supabase
        .from('classes')
        .select('id, name, certification_level, enrollment_code, is_active, description, max_students')
        .eq('id', classId)
        .single();

      if (!cls) {
        setLoading(false);
        return;
      }
      setClassInfo(cls);

      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .eq('class_id', classId);

      const studentIds = (enrollments ?? []).map((e) => e.student_id);

      if (studentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const { data: studentProfiles } = await supabase
        .from('students')
        .select('user_id, full_name, email, last_activity_date')
        .in('user_id', studentIds);

      const profileMap: Record<string, { full_name: string | null; email: string; last_activity_date: string | null }> = {};
      (studentProfiles ?? []).forEach((s) => {
        profileMap[s.user_id] = {
          full_name: s.full_name,
          email: s.email,
          last_activity_date: s.last_activity_date,
        };
      });

      const { data: sessions } = await supabase
        .from('exam_sessions')
        .select('student_id, score_percentage, completed_at, domain_stats')
        .in('student_id', studentIds)
        .not('score_percentage', 'is', null);

      const studentScores: Record<string, number[]> = {};
      const studentSessionCount: Record<string, number> = {};
      const domainScoreAccum: Record<string, { total: number; count: number }> = {};

      (sessions ?? []).forEach((s) => {
        if (s.score_percentage != null) {
          if (!studentScores[s.student_id]) studentScores[s.student_id] = [];
          studentScores[s.student_id].push(s.score_percentage);
        }
        if (s.completed_at) {
          studentSessionCount[s.student_id] = (studentSessionCount[s.student_id] || 0) + 1;
        }
        if (s.domain_stats && typeof s.domain_stats === 'object') {
          const ds = s.domain_stats as Record<string, any>;
          Object.entries(ds).forEach(([domain, val]) => {
            const score = typeof val === 'number' ? val : val?.score;
            if (typeof score === 'number') {
              if (!domainScoreAccum[domain]) domainScoreAccum[domain] = { total: 0, count: 0 };
              domainScoreAccum[domain].total += score;
              domainScoreAccum[domain].count += 1;
            }
          });
        }
      });

      const rows: StudentRow[] = studentIds.map((sid) => {
        const profile = profileMap[sid];
        const scores = studentScores[sid] ?? [];
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

        return {
          userId: sid,
          fullName: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          lastActivity: profile?.last_activity_date || null,
          avgScore: avg,
          sessionsCompleted: studentSessionCount[sid] || 0,
        };
      });

      rows.sort((a, b) => {
        const aRisk = a.avgScore !== null && a.avgScore < 60 ? 0 : 1;
        const bRisk = b.avgScore !== null && b.avgScore < 60 ? 0 : 1;
        if (aRisk !== bRisk) return aRisk - bRisk;
        return a.fullName.localeCompare(b.fullName);
      });

      setStudents(rows);

      const perfData: DomainPerformance[] = Object.entries(domainScoreAccum)
        .map(([domain, { total, count }]) => ({
          domain,
          avgScore: Math.round(total / count),
        }))
        .sort((a, b) => a.domain.localeCompare(b.domain));
      setDomainPerf(perfData);

      setLoading(false);
    }

    fetchData();
  }, [user, classId]);

  const handleCopyCode = () => {
    if (classInfo?.enrollment_code) {
      navigator.clipboard.writeText(classInfo.enrollment_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-8 w-80 rounded-md bg-zinc-100 animate-pulse" />
          <div className="h-4 w-48 rounded-md bg-zinc-100 animate-pulse" />
          <div className="h-64 rounded-xl bg-zinc-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl py-20 text-center">
          <p className="text-sm text-zinc-400">Class not found.</p>
          <Link href="/instructor/classes">
            <Button variant="outline" className="mt-4 glass-card text-zinc-600 hover:text-zinc-900">
              Back to Classes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back link */}
        <Link
          href="/instructor/classes"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          &larr; Classes
        </Link>

        {/* Class header */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">{classInfo.name}</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {classInfo.certification_level || 'All levels'} &middot;{' '}
                {students.length} student{students.length !== 1 ? 's' : ''}
                {classInfo.max_students && ` / ${classInfo.max_students} max`}
              </p>
              {classInfo.description && (
                <p className="mt-2 text-sm text-zinc-400">{classInfo.description}</p>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  classInfo.is_active !== false ? 'bg-emerald-600' : 'bg-zinc-600'
                }`}
              />
              {classInfo.is_active !== false ? 'Active' : 'Inactive'}
            </span>
          </div>

          {classInfo.enrollment_code && (
            <div className="mt-4 flex items-center gap-3 border-t border-zinc-200 pt-4">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Enrollment Code
              </span>
              <code className="rounded surface-2 px-2.5 py-1 text-sm font-mono font-medium text-zinc-700">
                {classInfo.enrollment_code}
              </code>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="surface-1 border border-zinc-200">
            <TabsTrigger value="students">
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              Domain Analytics
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="mt-4">
            <div className="glass-card overflow-hidden">
              {students.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm font-medium text-zinc-600">No students enrolled yet</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Share the enrollment code{' '}
                    <code className="font-mono font-medium text-zinc-700">{classInfo.enrollment_code}</code>
                    {' '}with your students.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-zinc-200">
                      <TableHead className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Email</TableHead>
                      <TableHead className="text-center text-xs uppercase tracking-wider text-zinc-400 font-medium">Avg Score</TableHead>
                      <TableHead className="text-center text-xs uppercase tracking-wider text-zinc-400 font-medium">Sessions</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Last Active</TableHead>
                      <TableHead className="text-center text-xs uppercase tracking-wider text-zinc-400 font-medium">Status</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wider text-zinc-400 font-medium">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const status = statusDot(student.avgScore);
                      return (
                        <TableRow key={student.userId} className="border-zinc-200 hover:bg-zinc-50">
                          <TableCell>
                            <Link
                              href={`/instructor/students/${student.userId}`}
                              className="font-medium text-zinc-900 hover:underline"
                            >
                              {student.fullName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-400">
                            {student.email}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.avgScore !== null ? (
                              <span className={`text-sm font-medium ${scoreColor(student.avgScore)}`}>
                                {student.avgScore}%
                              </span>
                            ) : (
                              <span className="text-zinc-500">--</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-zinc-400">
                            {student.sessionsCompleted}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-400">
                            {student.lastActivity
                              ? new Date(student.lastActivity).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-center">
                            {status.label && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                                <span className={`inline-block h-1.5 w-1.5 rounded-full ${status.color}`} />
                                {status.label}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/instructor/students/${student.userId}`}>
                              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-zinc-900">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4">
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-zinc-900">Domain Performance</h3>
              <p className="mt-0.5 text-xs text-zinc-400">Aggregated average scores across all students</p>

              {domainPerf.length > 0 ? (
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={domainPerf}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="domain" tick={{ fill: '#71717a', fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.08)',
                          backgroundColor: '#ffffff',
                          color: '#18181b',
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`${value}%`, 'Avg Score']}
                      />
                      <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-sm text-zinc-400">Not enough data yet. Students need to complete exams.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <InstructorGuard>
      <ClassDetailContent classId={id} />
    </InstructorGuard>
  );
}
