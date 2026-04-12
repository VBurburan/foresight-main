'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

interface StatBlock {
  label: string;
  value: string | number;
  subtext: string;
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

function DashboardContent() {
  const { user } = useUser();
  const [stats, setStats] = useState<StatBlock[]>([]);
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
          { label: 'Students', value: 0, subtext: 'No classes created yet' },
          { label: 'Active Classes', value: 0, subtext: 'Create your first class' },
          { label: 'Avg Score', value: '--', subtext: 'No data yet' },
          { label: 'At Risk', value: 0, subtext: 'Scoring below 60%' },
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

      // 5. Build stats
      setStats([
        {
          label: 'Students',
          value: totalStudents,
          subtext: `Across ${activeClasses.length} class${activeClasses.length !== 1 ? 'es' : ''}`,
        },
        {
          label: 'Active Classes',
          value: activeClasses.length,
          subtext: `${classIds.length} total`,
        },
        {
          label: 'Avg Score',
          value: avgScore > 0 ? `${avgScore}%` : '--',
          subtext: 'Across all students',
        },
        {
          label: 'At Risk',
          value: atRisk,
          subtext: 'Scoring below 60%',
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
          .limit(8);

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
          action: `Completed ${s.certification_level || ''} exam`,
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
      <div className="px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="h-7 w-32 rounded-md bg-zinc-800 animate-pulse" />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-5 space-y-3">
                <div className="h-3 w-16 rounded-md bg-zinc-800 animate-pulse" />
                <div className="h-7 w-20 rounded-md bg-zinc-800 animate-pulse" />
                <div className="h-3 w-24 rounded-md bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mt-8 h-72 rounded-xl bg-zinc-800/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
          <Link href="/instructor/classes">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100">
              <Plus className="h-4 w-4" />
              New Class
            </button>
          </Link>
        </div>

        {/* Empty state for no classes */}
        {!hasClasses && (
          <div className="mt-10 text-center py-16">
            <div className="mx-auto surface-2 rounded-full p-4 w-fit mb-4">
              <Plus className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-300">No classes yet</p>
            <p className="mt-1 text-sm text-zinc-400">
              Create your first class to start tracking student progress and building assessments.
            </p>
            <Link href="/instructor/classes">
              <button className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100">
                <Plus className="h-4 w-4" />
                Create Class
              </button>
            </Link>
          </div>
        )}

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {stat.label}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-semibold text-zinc-50">{stat.value}</p>
                {stat.label === 'At Risk' && typeof stat.value === 'number' && stat.value > 0 && (
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">{stat.subtext}</p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-6 h-px bg-white/[0.06]" />

        {/* Main content */}
        {hasClasses && (
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            {/* Class Performance chart */}
            <div className="lg:col-span-3">
              <div className="glass-card">
                <div className="px-5 py-4">
                  <h2 className="text-sm font-medium text-zinc-50">Class Performance</h2>
                  <p className="mt-0.5 text-xs text-zinc-400">Average score by class</p>
                </div>
                <div className="px-5 pb-5">
                  {classPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={classPerformance} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#71717a', fontSize: 12 }}
                          axisLine={{ stroke: '#27272A' }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: '#71717a', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={32}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            backgroundColor: '#18181b',
                            color: '#e4e4e7',
                            fontSize: '13px',
                          }}
                          formatter={(value: number) => [`${value}%`, 'Avg Score']}
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        />
                        <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[280px] items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm text-zinc-400">No data yet</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Scores will appear after students complete exams.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="glass-card">
                <div className="px-5 py-4">
                  <h2 className="text-sm font-medium text-zinc-50">Recent Activity</h2>
                  <p className="mt-0.5 text-xs text-zinc-400">Latest student submissions</p>
                </div>
                <div className="px-2 pb-3">
                  {recentActivity.length > 0 ? (
                    <div>
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-white/[0.02]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full surface-2">
                            <span className="text-xs font-medium text-zinc-300">
                              {activity.studentName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-50">
                              {activity.studentName}
                            </p>
                            <p className="truncate text-xs text-zinc-400">
                              {activity.action}
                              {activity.score != null && (
                                <>
                                  {' '}
                                  <span className={
                                    activity.score >= 75
                                      ? 'text-emerald-400'
                                      : activity.score >= 60
                                      ? 'text-amber-400'
                                      : 'text-red-400'
                                  }>
                                    {activity.score}%
                                  </span>
                                  {activity.score < 60 && (
                                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400 align-middle" />
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-zinc-600">
                            {activity.timestamp}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[240px] items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm text-zinc-400">No activity yet</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Student submissions will appear here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
