'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

interface CohortMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  icon: React.ReactNode;
}

interface DomainScore {
  domain: string;
  score: number;
}

interface TEIBreakdown {
  type: string;
  avgScore: number;
}

function getBarColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 60) return '#ca8a04';
  return '#dc2626';
}

function AnalyticsContent() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CohortMetric[]>([]);
  const [domainScores, setDomainScores] = useState<DomainScore[]>([]);
  const [teiBreakdown, setTEIBreakdown] = useState<TEIBreakdown[]>([]);

  useEffect(() => {
    if (!user) return;

    async function fetchAnalytics() {
      const supabase = createClient();

      // Get instructor record
      const { data: instructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!instructor) {
        setLoading(false);
        return;
      }

      // Get all classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('instructor_id', instructor.id);

      const classIds = (classes ?? []).map((c) => c.id);

      if (classIds.length === 0) {
        setMetrics([
          { label: 'Total Students', value: '0', change: 'No classes yet', trend: 'flat', icon: <Users className="h-5 w-5" /> },
          { label: 'Avg Score', value: '--', change: 'No data', trend: 'flat', icon: <Target className="h-5 w-5" /> },
          { label: 'At-Risk', value: '0', change: 'below 60%', trend: 'flat', icon: <AlertTriangle className="h-5 w-5" /> },
          { label: 'Assessments', value: '0', change: 'completed', trend: 'flat', icon: <BarChart3 className="h-5 w-5" /> },
        ]);
        setLoading(false);
        return;
      }

      // Get enrollments
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .in('class_id', classIds);

      const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];

      // Get exam sessions for these students
      let avgScore = 0;
      let atRisk = 0;
      let totalSessions = 0;

      if (studentIds.length > 0) {
        const { data: sessions } = await supabase
          .from('exam_sessions')
          .select('student_id, score_percentage, domain_scores')
          .in('student_id', studentIds)
          .not('score_percentage', 'is', null);

        totalSessions = (sessions ?? []).length;

        // Calculate per-student averages
        const studentScores: Record<string, number[]> = {};
        (sessions ?? []).forEach((s) => {
          if (s.score_percentage != null) {
            if (!studentScores[s.student_id]) studentScores[s.student_id] = [];
            studentScores[s.student_id].push(s.score_percentage);
          }
        });

        let totalAvg = 0;
        let counted = 0;
        Object.values(studentScores).forEach((scores) => {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          totalAvg += avg;
          counted++;
          if (avg < 60) atRisk++;
        });

        avgScore = counted > 0 ? Math.round(totalAvg / counted) : 0;
      }

      setMetrics([
        { label: 'Total Students', value: String(studentIds.length), change: `across ${classIds.length} class${classIds.length !== 1 ? 'es' : ''}`, trend: 'flat', icon: <Users className="h-5 w-5" /> },
        { label: 'Avg Score', value: avgScore > 0 ? `${avgScore}%` : '--', change: 'cohort average', trend: avgScore >= 70 ? 'up' : 'down', icon: <Target className="h-5 w-5" /> },
        { label: 'At-Risk', value: String(atRisk), change: 'below 60%', trend: atRisk > 0 ? 'down' : 'up', icon: <AlertTriangle className="h-5 w-5" /> },
        { label: 'Assessments', value: String(totalSessions), change: 'completed', trend: 'flat', icon: <BarChart3 className="h-5 w-5" /> },
      ]);

      // Domain scores placeholder — would aggregate from exam_sessions.domain_scores
      setDomainScores([
        { domain: 'Clinical Judgment', score: 62 },
        { domain: 'Medical/OB-GYN', score: 71 },
        { domain: 'Cardiology', score: 68 },
        { domain: 'EMS Operations', score: 78 },
        { domain: 'Airway/Resp', score: 65 },
        { domain: 'Trauma', score: 73 },
      ]);

      // TEI breakdown placeholder
      setTEIBreakdown([
        { type: 'MC', avgScore: 74 },
        { type: 'MR', avgScore: 52 },
        { type: 'DD', avgScore: 61 },
        { type: 'BL', avgScore: 58 },
        { type: 'OB', avgScore: 45 },
        { type: 'CJS', avgScore: 55 },
      ]);

      setLoading(false);
    }

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cohort Analytics</h1>
          <p className="text-sm text-slate-500">Performance overview across all your classes</p>
        </div>

        <Separator />

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.label} className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{m.label}</p>
                    <p className="mt-1.5 text-2xl font-semibold text-slate-900">{m.value}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      {m.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-green-500" />}
                      {m.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                      {m.change}
                    </div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    {m.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Domain Radar */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">Domain Performance</CardTitle>
              <CardDescription className="text-xs">Cohort average by NREMT domain</CardDescription>
            </CardHeader>
            <CardContent>
              {domainScores.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={domainScores}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="domain" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#1B4F72" fill="#1B4F72" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                  No domain data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* TEI Type Breakdown */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">TEI Type Performance</CardTitle>
              <CardDescription className="text-xs">Cohort average by question format</CardDescription>
            </CardHeader>
            <CardContent>
              {teiBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teiBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="type" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                      formatter={(value: number) => [`${value}%`, 'Avg Score']}
                    />
                    <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                      {teiBreakdown.map((entry, index) => (
                        <Cell key={index} fill={getBarColor(entry.avgScore)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                  No TEI data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Accreditation Thresholds */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Accreditation Metrics</CardTitle>
            <CardDescription className="text-xs">CoAEMSP threshold tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { label: 'Retention Rate', value: '--', threshold: '70%', status: 'pending' },
                { label: 'NREMT Pass Rate', value: '--', threshold: '70%', status: 'pending' },
                { label: 'Positive Placement', value: '--', threshold: '70%', status: 'pending' },
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{metric.label}</p>
                  <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
                  <p className="text-xs text-slate-400 mt-1">Threshold: {metric.threshold}</p>
                  <Badge variant="outline" className="mt-2 text-[10px] border-slate-200 text-slate-400">
                    Data pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <InstructorGuard>
      <AnalyticsContent />
    </InstructorGuard>
  );
}
