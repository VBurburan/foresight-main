'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Copy, ArrowLeft, Users, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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

function getScoreBadgeClasses(score: number): string {
  if (score >= 75) return 'bg-green-100 text-green-800 border border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return 'bg-red-100 text-red-800 border border-red-200';
}

function getBarColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 60) return '#eab308';
  return '#dc2626';
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
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center py-20">
          <p className="text-[#334155]/60">Class not found.</p>
          <Link href="/instructor/classes">
            <Button variant="outline" className="mt-4">
              Back to Classes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const atRiskStudents = students.filter((s) => s.avgScore !== null && s.avgScore < 60);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Back link */}
        <Link
          href="/instructor/classes"
          className="inline-flex items-center gap-1.5 text-sm text-[#334155]/60 hover:text-[#1e293b] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-heading text-3xl font-bold text-[#1e293b]">{classInfo.name}</h1>
                  <p className="mt-2 text-[#334155]/70">
                    {classInfo.certification_level || 'All levels'} &middot;{' '}
                    {students.length} student{students.length !== 1 ? 's' : ''}
                    {classInfo.max_students && ` / ${classInfo.max_students} max`}
                  </p>
                  {classInfo.description && (
                    <p className="mt-2 text-sm text-[#334155]/60">{classInfo.description}</p>
                  )}
                </div>
                <Badge className={classInfo.is_active !== false ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}>
                  {classInfo.is_active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {classInfo.enrollment_code && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#334155]/50 mb-1">Enrollment Code</p>
                      <div className="flex items-center gap-2">
                        <code className="rounded-lg bg-slate-100 px-3 py-1.5 text-lg font-mono font-bold text-[#1e293b]">
                          {classInfo.enrollment_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyCode}
                          className="gap-1.5 text-[#334155]/60 hover:text-[#1e293b]"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 text-xs">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span className="text-xs">Copy</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {atRiskStudents.length > 0 && (
                      <div className="ml-auto">
                        <Badge className="bg-red-100 text-red-800 border border-red-200 px-3 py-1">
                          {atRiskStudents.length} at-risk student{atRiskStudents.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border shadow-sm">
            <TabsTrigger
              value="students"
              className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white font-medium"
            >
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white font-medium"
            >
              Domain Analytics
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="mt-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">Class Roster</CardTitle>
                <CardDescription>Student performance and activity -- at-risk students appear first</CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[#334155]/40">
                    <Users className="h-10 w-10 mb-3" />
                    <p className="font-medium">No students enrolled yet</p>
                    <p className="text-sm mt-1">
                      Share the enrollment code{' '}
                      <code className="font-mono font-bold text-[#1e293b]">{classInfo.enrollment_code}</code>
                      {' '}with your students.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-[#1e293b]">Name</TableHead>
                        <TableHead className="font-semibold text-[#1e293b]">Email</TableHead>
                        <TableHead className="text-center font-semibold text-[#1e293b]">Avg Score</TableHead>
                        <TableHead className="text-center font-semibold text-[#1e293b]">Sessions</TableHead>
                        <TableHead className="font-semibold text-[#1e293b]">Last Active</TableHead>
                        <TableHead className="text-center font-semibold text-[#1e293b]">Status</TableHead>
                        <TableHead className="text-right font-semibold text-[#1e293b]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => {
                        const isAtRisk = student.avgScore !== null && student.avgScore < 60;
                        return (
                          <motion.tr
                            key={student.userId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`border-b transition-colors hover:bg-slate-50 ${
                              isAtRisk ? 'bg-red-50/50' : ''
                            }`}
                          >
                            <TableCell>
                              <Link
                                href={`/instructor/students/${student.userId}`}
                                className="font-medium text-[#334155] hover:text-[#1e293b] hover:underline transition-colors"
                              >
                                {student.fullName}
                              </Link>
                            </TableCell>
                            <TableCell className="text-[#334155]/60 text-xs">
                              {student.email}
                            </TableCell>
                            <TableCell className="text-center">
                              {student.avgScore !== null ? (
                                <Badge className={getScoreBadgeClasses(student.avgScore)}>
                                  {student.avgScore}%
                                </Badge>
                              ) : (
                                <span className="text-[#334155]/40">--</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-[#334155]">
                              {student.sessionsCompleted}
                            </TableCell>
                            <TableCell className="text-[#334155]/60 text-xs">
                              {student.lastActivity
                                ? new Date(student.lastActivity).toLocaleDateString()
                                : 'Never'}
                            </TableCell>
                            <TableCell className="text-center">
                              {isAtRisk ? (
                                <Badge className="bg-red-100 text-red-700 border border-red-200">
                                  At Risk
                                </Badge>
                              ) : student.avgScore !== null && student.avgScore >= 75 ? (
                                <Badge className="bg-green-100 text-green-700 border border-green-200">
                                  On Track
                                </Badge>
                              ) : student.avgScore !== null ? (
                                <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">
                                  Monitor
                                </Badge>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/instructor/students/${student.userId}`}>
                                <Button size="sm" variant="outline" className="text-[#1e293b] border-[#1e293b]/30 hover:bg-[#1e293b]/5">
                                  Drill Down
                                </Button>
                              </Link>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">Domain Performance</CardTitle>
                <CardDescription>Aggregated average scores across all students -- color-coded by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                {domainPerf.length > 0 ? (
                  <div className="space-y-8">
                    {/* Horizontal bar chart visualization */}
                    <div className="space-y-3">
                      {domainPerf.map((d, idx) => (
                        <motion.div
                          key={d.domain}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-4"
                        >
                          <span className="w-32 text-sm font-medium text-[#334155] text-right truncate">
                            {d.domain}
                          </span>
                          <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${d.avgScore}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.1 }}
                              className="h-full rounded-full flex items-center justify-end pr-3"
                              style={{ backgroundColor: getBarColor(d.avgScore) }}
                            >
                              {d.avgScore >= 20 && (
                                <span className="text-xs font-bold text-white">{d.avgScore}%</span>
                              )}
                            </motion.div>
                          </div>
                          {d.avgScore < 20 && (
                            <span className="text-xs font-bold text-[#334155]">{d.avgScore}%</span>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <Separator />

                    {/* Recharts bar chart */}
                    <div>
                      <h3 className="text-sm font-semibold text-[#334155]/60 uppercase mb-4">Chart View</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={domainPerf}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="domain" tick={{ fill: '#334155', fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#334155', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 6px rgba(27, 58, 92, 0.15)',
                            }}
                            formatter={(value: number) => [`${value}%`, 'Avg Score']}
                          />
                          <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                            {domainPerf.map((entry, index) => (
                              <Cell key={index} fill={getBarColor(entry.avgScore)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[300px] flex-col items-center justify-center text-[#334155]/40">
                    <Users className="h-10 w-10 mb-3" />
                    <p>Not enough data yet. Students need to complete exams.</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
