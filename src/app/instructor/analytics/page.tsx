'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, Users, AlertTriangle, Target, TrendingUp, Activity,
} from 'lucide-react';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import {
  CJRadarChart,
  DomainBars,
  TEIBars,
  DomainTEIHeatmap,
  ErrorDistribution,
  SpecificErrorTable,
  ReadinessProjection,
  ScoreSummaryCard,
} from '@/components/analytics/charts';
import {
  type AnalyticsData,
  generateDemoData,
} from '@/lib/analytics';

interface ClassOption {
  id: string;
  name: string;
}

function AnalyticsContent() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [useDemoData, setUseDemoData] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchAnalytics() {
      setLoading(true);
      const supabase = createClient();

      // Get instructor
      const { data: instructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!instructor) {
        setLoading(false);
        return;
      }

      // Get classes
      const { data: classData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('instructor_id', instructor.id);

      const classList = classData ?? [];
      setClasses(classList);

      const classIds = selectedClass === 'all'
        ? classList.map((c) => c.id)
        : [selectedClass];

      if (classIds.length === 0) {
        setUseDemoData(true);
        setData(generateDemoData());
        setLoading(false);
        return;
      }

      // Get enrollments
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .in('class_id', classIds);

      const studentIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];
      setStudentCount(studentIds.length);

      if (studentIds.length === 0) {
        setUseDemoData(true);
        setData(generateDemoData());
        setLoading(false);
        return;
      }

      // Get exam sessions
      const { data: sessions } = await supabase
        .from('exam_sessions')
        .select('id, student_id, score_percentage, domain_stats, item_type_stats, cj_step_stats, completed_at')
        .in('student_id', studentIds)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      const exams = sessions ?? [];
      setSessionCount(exams.length);

      if (exams.length === 0) {
        setUseDemoData(true);
        setData(generateDemoData());
        setLoading(false);
        return;
      }

      setUseDemoData(false);

      // Aggregate CJ step stats
      const cjAccum: Record<string, { total: number; count: number }> = {};
      exams.forEach((e) => {
        if (e.cj_step_stats && typeof e.cj_step_stats === 'object') {
          Object.entries(e.cj_step_stats as Record<string, any>).forEach(([step, val]) => {
            const score = typeof val === 'number' ? val : val?.score;
            if (typeof score === 'number') {
              if (!cjAccum[step]) cjAccum[step] = { total: 0, count: 0 };
              cjAccum[step].total += score;
              cjAccum[step].count += 1;
            }
          });
        }
      });

      const cjFunctions = [
        'Recognize Cues', 'Analyze Cues', 'Prioritize Hypotheses',
        'Generate Solutions', 'Take Action', 'Evaluate Outcomes',
      ].map((fn) => {
        const key = fn.toLowerCase().replace(/\s+/g, '_');
        const accum = cjAccum[key] || cjAccum[fn] || cjAccum[fn.toLowerCase()];
        const avg = accum ? Math.round((accum.total / accum.count) * 10) / 10 : null;
        return {
          function: fn,
          shortName: fn.split(' ')[0],
          pre: null as number | null,
          post: avg,
          change: null as number | null,
        };
      });

      // Aggregate domain stats
      const domainAccum: Record<string, { total: number; count: number }> = {};
      exams.forEach((e) => {
        if (e.domain_stats && typeof e.domain_stats === 'object') {
          Object.entries(e.domain_stats as Record<string, any>).forEach(([domain, val]) => {
            const score = typeof val === 'number' ? val : val?.score;
            if (typeof score === 'number') {
              if (!domainAccum[domain]) domainAccum[domain] = { total: 0, count: 0 };
              domainAccum[domain].total += score;
              domainAccum[domain].count += 1;
            }
          });
        }
      });

      const domainPerformance = Object.entries(domainAccum).map(([domain, { total, count }]) => {
        const avg = Math.round(total / count);
        return {
          domain,
          pre: null as number | null,
          post: avg,
          change: null as number | null,
          assessment: avg >= 90 ? 'MASTERED' : avg >= 70 ? 'PROGRESSING' : 'NEXT PRIORITY',
        };
      }).sort((a, b) => (b.post ?? 0) - (a.post ?? 0));

      // Aggregate TEI stats
      const teiAccum: Record<string, { total: number; count: number }> = {};
      exams.forEach((e) => {
        if (e.item_type_stats && typeof e.item_type_stats === 'object') {
          Object.entries(e.item_type_stats as Record<string, any>).forEach(([type, val]) => {
            const score = typeof val === 'number' ? val : val?.score;
            if (typeof score === 'number') {
              if (!teiAccum[type]) teiAccum[type] = { total: 0, count: 0 };
              teiAccum[type].total += score;
              teiAccum[type].count += 1;
            }
          });
        }
      });

      const teiLabels: Record<string, string> = {
        MC: 'Multiple Choice', MR: 'Multiple Response',
        DD: 'Drag & Drop', OB: 'Ordered Box',
        BL: 'Bowtie/Linking', CJS: 'Clinical Judgment',
      };

      const teiPerformance = Object.entries(teiAccum).map(([type, { total, count }]) => ({
        type,
        label: teiLabels[type] || type,
        pre: null as number | null,
        post: Math.round(total / count),
        change: null as number | null,
      }));

      // At-risk calculation
      const studentScores: Record<string, number[]> = {};
      exams.forEach((s) => {
        if (s.score_percentage != null) {
          if (!studentScores[s.student_id]) studentScores[s.student_id] = [];
          studentScores[s.student_id].push(Number(s.score_percentage));
        }
      });
      let risk = 0;
      Object.values(studentScores).forEach((scores) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg < 70) risk++;
      });
      setAtRiskCount(risk);

      // Overall average
      const allScores = exams.filter((e) => e.score_percentage != null).map((e) => Number(e.score_percentage));
      const overallAvg = allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
        : null;

      setData({
        cjFunctions,
        domainPerformance,
        teiPerformance,
        heatmap: [],
        errorsByDomain: [],
        errorsByTEI: [],
        specificErrors: [],
        overallPre: null,
        overallPost: overallAvg,
        overallChange: null,
        readinessScore: null,
      });

      setLoading(false);
    }

    fetchAnalytics();
  }, [user, selectedClass]);

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-8 w-48 rounded-md bg-zinc-800 animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
          <div className="h-96 rounded-xl bg-zinc-800/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center py-20">
          <p className="text-zinc-400">No analytics data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header with class selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50 font-heading">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {useDemoData ? 'Showing sample data — real data appears after students complete exams' : 'Cohort performance analysis'}
            </p>
          </div>
          {classes.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Demo data banner */}
        {useDemoData && (
          <div className="glass-subtle border-l-2 border-blue-400/60 px-4 py-3">
            <p className="text-xs text-zinc-300">
              <span className="font-semibold text-blue-400">Demo Mode</span> — Showing sample analytics from a paramedic pre/post analysis report. Your real student data will replace this automatically.
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Students', value: useDemoData ? '1' : String(studentCount), icon: Users, sub: 'enrolled', color: 'text-blue-400' },
            { label: 'Assessments', value: useDemoData ? '2' : String(sessionCount), icon: BarChart3, sub: 'completed', color: 'text-indigo-400' },
            { label: 'Avg Score', value: data.overallPost ? `${data.overallPost}%` : '--', icon: Target, sub: 'cohort average', color: (data.overallPost ?? 0) >= 70 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'At Risk', value: useDemoData ? '0' : String(atRiskCount), icon: AlertTriangle, sub: 'below 70%', color: atRiskCount > 0 ? 'text-red-400' : 'text-emerald-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5 group hover:bg-white/[0.12] transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{stat.label}</p>
                  <p className={`mt-2 text-3xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                  <p className="mt-1 text-xs text-zinc-400">{stat.sub}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg surface-2 group-hover:bg-white/[0.08] transition-colors">
                  <stat.icon className="h-5 w-5 text-zinc-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Score Summary */}
        {(data.overallPre !== null || data.overallPost !== null) && (
          <ScoreSummaryCard
            preScore={data.overallPre}
            postScore={data.overallPost}
            change={data.overallChange}
          />
        )}

        {/* Section 1: Clinical Judgment Radar */}
        <section>
          <div className="glass-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-400" />
                <h2 className="text-lg font-semibold text-zinc-50">Clinical Judgment Cognitive Functions</h2>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                Performance across the 6 NCSBN Clinical Judgment functions
              </p>
            </div>
            <div className="px-6 pb-6">
              <CJRadarChart data={data.cjFunctions} />
            </div>
          </div>
        </section>

        {/* Section 2: Domain Performance */}
        <section>
          <div className="glass-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-zinc-50">Domain Performance Analysis</h2>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                Score comparison by NREMT content domain
              </p>
            </div>
            <div className="px-6 pb-6">
              <DomainBars data={data.domainPerformance} />
            </div>
          </div>
        </section>

        {/* Section 3: TEI Performance */}
        <section>
          <div className="glass-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-zinc-50">Technology-Enhanced Item (TEI) Performance</h2>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                Accuracy by question format
              </p>
            </div>
            <div className="px-6 pb-6">
              <TEIBars data={data.teiPerformance} />
            </div>
          </div>
        </section>

        {/* Section 4: Domain × TEI Heatmap */}
        {data.heatmap.length > 0 && (
          <section>
            <div className="glass-card overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-zinc-50">Domain × TEI Format Heatmap</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Cross-tabulation showing exactly where gaps exist
                </p>
              </div>
              <div className="px-6 pb-6">
                <DomainTEIHeatmap data={data.heatmap} />
              </div>
            </div>
          </section>
        )}

        {/* Section 5: Error Distribution */}
        {(data.errorsByDomain.length > 0 || data.errorsByTEI.length > 0) && (
          <section>
            <div className="glass-card overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-zinc-50">Error Distribution</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Where errors concentrate by domain and question format
                </p>
              </div>
              <div className="px-6 pb-6">
                <ErrorDistribution byDomain={data.errorsByDomain} byTEI={data.errorsByTEI} />
              </div>
            </div>
          </section>
        )}

        {/* Section 6: Specific Error Table */}
        {data.specificErrors.length > 0 && (
          <section>
            <div className="glass-card overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-zinc-50">Specific Error Breakdown</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Granular analysis — question number, type, domain, CJ function, and error pattern
                </p>
              </div>
              <div className="px-6 pb-6">
                <SpecificErrorTable data={data.specificErrors} />
              </div>
            </div>
          </section>
        )}

        {/* Section 7: Readiness Projection */}
        {data.readinessScore !== null && (
          <section>
            <div className="glass-card overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-zinc-50">NREMT Readiness Projection</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Estimated scaled score based on practice exam performance
                </p>
              </div>
              <div className="px-6 pb-6">
                <ReadinessProjection
                  score={data.readinessScore}
                  preScore={data.overallPre}
                  postScore={data.overallPost}
                />
              </div>
            </div>
          </section>
        )}
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
