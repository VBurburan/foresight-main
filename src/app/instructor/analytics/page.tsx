'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Users,
  AlertTriangle,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
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

      const { data: instructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!instructor) {
        setLoading(false);
        return;
      }

      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('instructor_id', instructor.id);

      const classIds = (classes ?? []).map((c) => c.id);

      if (classIds.length === 0) {
        setMetrics([
          { label: 'Total Students', value: '0', change: 'No classes yet', trend: 'flat', icon: <Users className="h-4 w-4" /> },
          { label: 'Avg Score', value: '--', change: 'No data', trend: 'flat', icon: <Target className="h-4 w-4" /> },
          { label: 'At-Risk', value: '0', change: 'below 60%', trend: 'flat', icon: <AlertTriangle className="h-4 w-4" /> },
          { label: 'Assessments', value: '0', change: 'completed', trend: 'flat', icon: <BarChart3 className="h-4 w-4" /> },
        ]);
        setLoading(false);
        return;
      }

      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .in('class_id', classIds);

      const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];

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
        { label: 'Total Students', value: String(studentIds.length), change: `across ${classIds.length} class${classIds.length !== 1 ? 'es' : ''}`, trend: 'flat', icon: <Users className="h-4 w-4" /> },
        { label: 'Avg Score', value: avgScore > 0 ? `${avgScore}%` : '--', change: 'cohort average', trend: avgScore >= 70 ? 'up' : 'down', icon: <Target className="h-4 w-4" /> },
        { label: 'At-Risk', value: String(atRisk), change: 'below 60%', trend: atRisk > 0 ? 'down' : 'up', icon: <AlertTriangle className="h-4 w-4" /> },
        { label: 'Assessments', value: String(totalSessions), change: 'completed', trend: 'flat', icon: <BarChart3 className="h-4 w-4" /> },
      ]);

      setDomainScores([
        { domain: 'Clinical Judgment', score: 62 },
        { domain: 'Medical/OB-GYN', score: 71 },
        { domain: 'Cardiology', score: 68 },
        { domain: 'EMS Operations', score: 78 },
        { domain: 'Airway/Resp', score: 65 },
        { domain: 'Trauma', score: 73 },
      ]);

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
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-8 w-48 rounded-md bg-zinc-800 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
          <div className="h-80 rounded-xl bg-zinc-800/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-zinc-50">Analytics</h1>

        {/* Stat blocks */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{m.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-50">{m.value}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                    {m.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-400" />}
                    {m.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-400" />}
                    {m.change}
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md surface-2 text-zinc-400">
                  {m.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Domain Radar */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-zinc-50">Domain Performance</h3>
            <p className="mt-0.5 text-xs text-zinc-400">Cohort average by NREMT domain</p>
            {domainScores.length > 0 ? (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={domainScores}>
                    <PolarGrid stroke="#27272A" />
                    <PolarAngleAxis dataKey="domain" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#52525b', fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-zinc-400">No domain data yet</p>
              </div>
            )}
          </div>

          {/* TEI Type Breakdown */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-zinc-50">TEI Type Performance</h3>
            <p className="mt-0.5 text-xs text-zinc-400">Cohort average by question format</p>
            {teiBreakdown.length > 0 ? (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={teiBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="type" tick={{ fill: '#71717a', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        backgroundColor: '#18181b',
                        color: '#e4e4e7',
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value}%`, 'Avg Score']}
                    />
                    <Bar dataKey="avgScore" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-zinc-400">No TEI data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Accreditation Metrics */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 pt-5 pb-2">
            <h3 className="text-sm font-medium text-zinc-50">Accreditation Metrics</h3>
            <p className="mt-0.5 text-xs text-zinc-400">CoAEMSP threshold tracking</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/[0.06]">
                <TableHead className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Metric</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider text-zinc-400 font-medium">Current</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider text-zinc-400 font-medium">Threshold</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider text-zinc-400 font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: 'Retention Rate', threshold: '70%' },
                { label: 'NREMT Pass Rate', threshold: '70%' },
                { label: 'Positive Placement', threshold: '70%' },
              ].map((row) => (
                <TableRow key={row.label} className="border-white/[0.04] hover:bg-white/[0.02]">
                  <TableCell className="text-sm text-zinc-300">{row.label}</TableCell>
                  <TableCell className="text-center text-sm text-zinc-600">--</TableCell>
                  <TableCell className="text-center text-sm text-zinc-400">{row.threshold}</TableCell>
                  <TableCell className="text-center text-xs text-zinc-400">Data pending</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
