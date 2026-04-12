'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, BookOpen, TrendingUp, AlertTriangle, GraduationCap, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

interface StatCard {
  label: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  borderColor: string;
}

interface Activity {
  id: string;
  studentName: string;
  action: string;
  score: number | null;
  timestamp: string;
}

interface ClassPerformance {
  name: string;
  avgScore: number;
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

function DashboardContent() {
  const { user } = useUser();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [hasClasses, setHasClasses] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const supabase = createClient();

      // 1. Get instructor record
      const { data: instructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!instructor) {
        setLoading(false);
        setHasClasses(false);
        return;
      }

      // 2. Get classes for this instructor
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, is_active')
        .eq('instructor_id', instructor.id);

      const classIds = (classes ?? []).map((c) => c.id);
      const activeClasses = (classes ?? []).filter((c) => c.is_active !== false);

      if (classIds.length === 0) {
        setHasClasses(false);
        setStats([
          {
            label: 'Total Students',
            value: 0,
            change: 'No classes created yet',
            icon: <Users className="h-5 w-5" />,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            borderColor: 'border-blue-100',
          },
          {
            label: 'Active Classes',
            value: 0,
            change: 'Create your first class',
            icon: <BookOpen className="h-5 w-5" />,
            bgColor: 'bg-orange-50',
            iconColor: 'text-[#b45309]',
            borderColor: 'border-orange-100',
          },
          {
            label: 'Average Score',
            value: '--',
            change: 'No data yet',
            icon: <TrendingUp className="h-5 w-5" />,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
            borderColor: 'border-green-100',
          },
          {
            label: 'At-Risk Students',
            value: 0,
            change: 'scoring below 60%',
            icon: <AlertTriangle className="h-5 w-5" />,
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
            borderColor: 'border-red-100',
          },
        ]);
        setLoading(false);
        return;
      }

      setHasClasses(true);

      // 3. Get all enrollments across classes
      let enrollments: { class_id: string; student_id: string }[] = [];
      if (classIds.length > 0) {
        const { data: enrollData } = await supabase
          .from('class_enrollments')
          .select('class_id, student_id')
          .in('class_id', classIds);
        enrollments = enrollData ?? [];
      }

      const uniqueStudentIds = [...new Set(enrollments.map((e) => e.student_id))];
      const totalStudents = uniqueStudentIds.length;

      // 4. Get student scores from exam_sessions to calculate averages + at-risk
      let avgScore = 0;
      let atRisk = 0;
      const classScoreMap: Record<string, { name: string; scores: number[] }> = {};

      (classes ?? []).forEach((c) => {
        classScoreMap[c.id] = { name: c.name, scores: [] };
      });

      if (uniqueStudentIds.length > 0) {
        const { data: sessions } = await supabase
          .from('exam_sessions')
          .select('student_id, score_percentage')
          .in('student_id', uniqueStudentIds)
          .not('score_percentage', 'is', null);

        const studentScores: Record<string, number[]> = {};
        (sessions ?? []).forEach((s) => {
          if (s.score_percentage != null) {
            if (!studentScores[s.student_id]) studentScores[s.student_id] = [];
            studentScores[s.student_id].push(s.score_percentage);
          }
        });

        let totalScore = 0;
        let scoredStudents = 0;
        uniqueStudentIds.forEach((sid) => {
          const scores = studentScores[sid];
          if (scores && scores.length > 0) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            totalScore += avg;
            scoredStudents++;
            if (avg < 60) atRisk++;
          }
        });
        avgScore = scoredStudents > 0 ? Math.round(totalScore / scoredStudents) : 0;
        setAtRiskCount(atRisk);

        enrollments.forEach((en) => {
          const scores = studentScores[en.student_id];
          if (scores && scores.length > 0 && classScoreMap[en.class_id]) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            classScoreMap[en.class_id].scores.push(avg);
          }
        });
      }

      const perfData: ClassPerformance[] = Object.values(classScoreMap)
        .filter((c) => c.scores.length > 0)
        .map((c) => ({
          name: c.name.length > 20 ? c.name.slice(0, 18) + '...' : c.name,
          avgScore: Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length),
        }));
      setClassPerformance(perfData);

      // Determine average score color hint
      const avgScoreColor = avgScore >= 75 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : avgScore > 0 ? 'text-red-600' : 'text-green-600';
      const avgBg = avgScore >= 75 ? 'bg-green-50' : avgScore >= 60 ? 'bg-yellow-50' : avgScore > 0 ? 'bg-red-50' : 'bg-green-50';
      const avgBorder = avgScore >= 75 ? 'border-green-100' : avgScore >= 60 ? 'border-yellow-100' : avgScore > 0 ? 'border-red-100' : 'border-green-100';

      // 5. Build stats cards with proper color coding
      setStats([
        {
          label: 'Total Students',
          value: totalStudents,
          change: `across ${activeClasses.length} class${activeClasses.length !== 1 ? 'es' : ''}`,
          icon: <Users className="h-5 w-5" />,
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-100',
        },
        {
          label: 'Active Classes',
          value: activeClasses.length,
          change: `${classIds.length} total`,
          icon: <BookOpen className="h-5 w-5" />,
          bgColor: 'bg-orange-50',
          iconColor: 'text-[#b45309]',
          borderColor: 'border-orange-100',
        },
        {
          label: 'Average Score',
          value: avgScore > 0 ? `${avgScore}%` : '--',
          change: 'across all students',
          icon: <TrendingUp className="h-5 w-5" />,
          bgColor: avgBg,
          iconColor: avgScoreColor,
          borderColor: avgBorder,
        },
        {
          label: 'At-Risk Students',
          value: atRisk,
          change: 'scoring below 60%',
          icon: <AlertTriangle className="h-5 w-5" />,
          bgColor: atRisk > 0 ? 'bg-red-50' : 'bg-green-50',
          iconColor: atRisk > 0 ? 'text-red-600' : 'text-green-600',
          borderColor: atRisk > 0 ? 'border-red-100' : 'border-green-100',
        },
      ]);

      // 6. Recent activity
      if (uniqueStudentIds.length > 0) {
        const { data: recentSessions } = await supabase
          .from('exam_sessions')
          .select('id, student_id, score_percentage, completed_at, certification_level')
          .in('student_id', uniqueStudentIds)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(6);

        const { data: studentRecords } = await supabase
          .from('students')
          .select('user_id, full_name, email')
          .in('user_id', uniqueStudentIds);

        const nameMap: Record<string, string> = {};
        (studentRecords ?? []).forEach((s) => {
          nameMap[s.user_id] = s.full_name || s.email;
        });

        const activities: Activity[] = (recentSessions ?? []).map((s) => ({
          id: s.id,
          studentName: nameMap[s.student_id] || 'Unknown Student',
          action: `Completed ${s.certification_level || ''} Exam`,
          score: s.score_percentage,
          timestamp: s.completed_at
            ? formatRelativeTime(new Date(s.completed_at))
            : '',
        }));
        setRecentActivity(activities);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <Image src="/images/foresight-logo.png" alt="Foresight" width={36} height={36} />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-[#1e293b]">Instructor Dashboard</h1>
              <p className="text-sm font-medium text-[#334155]/60">Foresight by Path2Medic</p>
            </div>
          </div>
          <Link href="/instructor/classes">
            <Button className="gap-2 bg-amber-700 hover:bg-amber-600 shadow-sm">
              <Plus className="h-4 w-4" />
              New Class
            </Button>
          </Link>
        </div>

        <Separator />

        {/* Empty State */}
        {!hasClasses && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-dashed border-2 border-[#1e293b]/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Image src="/images/foresight-logo.png" alt="Foresight" width={64} height={64} className="mb-4" />
                <h3 className="font-heading text-xl font-semibold text-[#1e293b]">
                  Welcome to Foresight
                </h3>
                <p className="mt-2 text-center text-[#334155]/60 max-w-md">
                  Create your first class to start tracking student progress and building TEI assessments. Students join with an enrollment code.
                </p>
                <Link href="/instructor/classes" className="mt-6">
                  <Button className="gap-2 bg-amber-700 hover:bg-amber-600">
                    <Plus className="h-4 w-4" />
                    Create Your First Class
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`border ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#334155]/70">{stat.label}</p>
                      <p className="mt-2 text-3xl font-bold text-[#1e293b]">{stat.value}</p>
                      <p className="mt-1 text-xs text-[#334155]/50">{stat.change}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                      <div className={stat.iconColor}>{stat.icon}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Class Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">Class Performance</CardTitle>
                <CardDescription>Average scores by class -- color-coded by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                {classPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={classPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 12 }} />
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
                        {classPerformance.map((entry, index) => (
                          <Cell key={index} fill={getBarColor(entry.avgScore)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] flex-col items-center justify-center text-[#334155]/40">
                    <TrendingUp className="h-10 w-10 mb-3" />
                    <p>No score data yet. Students need to complete exams.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/instructor/classes">
                  <Button className="w-full justify-start gap-2 bg-amber-700 hover:bg-amber-600">
                    <BookOpen className="h-4 w-4" />
                    Manage Classes
                  </Button>
                </Link>
                {atRiskCount > 0 && (
                  <Link href="/instructor/classes" className="block mt-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {atRiskCount} at-risk student{atRiskCount !== 1 ? 's' : ''}
                    </Button>
                  </Link>
                )}
                <Separator className="my-3" />
                <div className="rounded-lg bg-[#1e293b]/5 p-4">
                  <p className="text-xs font-semibold uppercase text-[#1e293b]/60 mb-1">Score Legend</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-xs text-[#334155]/70">75%+ On track</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-xs text-[#334155]/70">60-74% Needs improvement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-xs text-[#334155]/70">&lt;60% At risk</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-[#1e293b]">Recent Activity</CardTitle>
              <CardDescription>Latest student assessments and submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.map((activity, idx) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between rounded-lg px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e293b]/10">
                          <span className="text-sm font-bold text-[#1e293b]">
                            {activity.studentName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#334155]">{activity.studentName}</p>
                          <p className="text-xs text-[#334155]/60">{activity.action}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {activity.score != null && (
                          <Badge className={getScoreBadgeClasses(activity.score)}>
                            {activity.score}%
                          </Badge>
                        )}
                        <span className="text-xs text-[#334155]/50 min-w-[60px] text-right">
                          {activity.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[#334155]/40">
                  <Users className="h-10 w-10 mb-3" />
                  <p>No recent activity from your students.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function InstructorDashboardPage() {
  return (
    <InstructorGuard>
      <DashboardContent />
    </InstructorGuard>
  );
}
