'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Calendar, Award, Clock } from 'lucide-react';
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
import type {
  AnalyticsData,
  CJFunctionScore,
  DomainPerformance,
  TEIPerformance,
  HeatmapCell,
  ErrorByCategory,
  SpecificError,
} from '@/lib/analytics';
import { generateDemoData } from '@/lib/analytics';

interface StudentProfile {
  fullName: string;
  email: string;
  certLevel: string | null;
  createdAt: string;
}

interface SessionRow {
  id: string;
  date: string;
  assessmentName: string | null;
  score: number | null;
  timeSpent: number | null;
  questionCount: number | null;
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function StudentDetailContent({ studentId }: { studentId: string }) {
  const { user } = useUser();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [useDemoData, setUseDemoData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const supabase = createClient();

      // Fetch student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('full_name, email, certification_level, created_at')
        .eq('user_id', studentId)
        .single();

      if (!studentData) {
        setLoading(false);
        return;
      }

      setProfile({
        fullName: studentData.full_name || 'Unknown',
        email: studentData.email,
        certLevel: studentData.certification_level,
        createdAt: studentData.created_at,
      });

      // Fetch exam sessions
      const { data: examSessions } = await supabase
        .from('exam_sessions')
        .select(
          'id, score_percentage, completed_at, time_spent_seconds, question_count, domain_stats, item_type_stats, cj_step_stats, assessment_id'
        )
        .eq('student_id', studentId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      const exams = examSessions ?? [];

      if (exams.length === 0) {
        setUseDemoData(true);
        setData(generateDemoData());
        setSessions([]);
        setLoading(false);
        return;
      }

      setUseDemoData(false);

      // Build session rows
      const sessionRows: SessionRow[] = [...exams].reverse().slice(0, 15).map((e) => ({
        id: e.id,
        date: new Date(e.completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        assessmentName: null,
        score: e.score_percentage ? Number(e.score_percentage) : null,
        timeSpent: e.time_spent_seconds,
        questionCount: e.question_count,
      }));
      setSessions(sessionRows);

      // CJ function analysis
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

      const cjFunctionNames = [
        'Recognize Cues', 'Analyze Cues', 'Prioritize Hypotheses',
        'Generate Solutions', 'Take Action', 'Evaluate Outcomes',
      ];

      const cjFunctions: CJFunctionScore[] = cjFunctionNames.map((fn) => {
        const key = fn.toLowerCase().replace(/\s+/g, '_');
        const accum = cjAccum[key] || cjAccum[fn] || cjAccum[fn.toLowerCase()];
        const avg = accum ? Math.round((accum.total / accum.count) * 10) / 10 : null;
        return {
          function: fn,
          shortName: fn.split(' ')[0],
          pre: null,
          post: avg,
          change: null,
        };
      });

      // Domain analysis
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

      const domainPerformance: DomainPerformance[] = Object.entries(domainAccum)
        .map(([domain, { total, count }]) => {
          const avg = Math.round(total / count);
          return {
            domain,
            pre: null,
            post: avg,
            change: null,
            assessment: avg >= 90 ? 'MASTERED' : avg >= 70 ? 'PROGRESSING' : 'NEXT PRIORITY',
          };
        })
        .sort((a, b) => (b.post ?? 0) - (a.post ?? 0));

      // TEI analysis
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

      const teiPerformance: TEIPerformance[] = Object.entries(teiAccum).map(([type, { total, count }]) => ({
        type,
        label: teiLabels[type] || type,
        pre: null,
        post: Math.round(total / count),
        change: null,
      }));

      // Overall scores
      const allScores = exams.filter((e) => e.score_percentage != null).map((e) => Number(e.score_percentage));
      const overallAvg = allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
        : null;

      // Readiness estimate based on recent scores
      const recentScores = allScores.slice(-3);
      let readiness: number | null = null;
      if (recentScores.length > 0) {
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        // Map practice score to scaled score (rough estimate)
        readiness = Math.round(700 + (recentAvg / 100) * 400);
      }

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
        readinessScore: readiness,
      });

      setLoading(false);
    }

    fetchData();
  }, [user, studentId]);

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-6 w-32 rounded-md bg-zinc-100 animate-pulse" />
          <div className="h-32 rounded-xl bg-zinc-100 animate-pulse" />
          <div className="h-96 rounded-xl bg-zinc-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center py-20">
          <p className="text-zinc-400">Student not found.</p>
          <Link href="/instructor/classes" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-900 transition-colors">
            &larr; Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Back link */}
        <Link
          href="/instructor/classes"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Link>

        {/* Student profile header */}
        <div className="section-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full surface-2 border border-zinc-200">
                <User className="h-6 w-6 text-zinc-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 font-heading">{profile.fullName}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                  <span>{profile.email}</span>
                  {profile.certLevel && (
                    <span className="inline-flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      {profile.certLevel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            {data?.overallPost !== null && data?.overallPost !== undefined && (
              <div className="text-right">
                <p className={`text-5xl font-bold tabular-nums ${scoreColor(data.overallPost)}`}>
                  {data.overallPost}%
                </p>
                <p className="text-xs text-zinc-400 mt-1">Overall Average</p>
              </div>
            )}
          </div>
        </div>

        {/* Demo data banner */}
        {useDemoData && (
          <div className="glass-subtle border-l-2 border-blue-400/60 px-4 py-3">
            <p className="text-xs text-zinc-600">
              <span className="font-semibold text-blue-400">Demo Mode</span> — No exam data yet for this student. Showing sample analytics for preview.
            </p>
          </div>
        )}

        {/* Overall Score Summary */}
        {data && (data.overallPre !== null || data.overallPost !== null) && (
          <ScoreSummaryCard
            preScore={data.overallPre}
            postScore={data.overallPost}
            change={data.overallChange}
          />
        )}

        {/* CJ Radar */}
        {data && data.cjFunctions.some((f) => f.pre !== null || f.post !== null) && (
          <section className="section-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">Clinical Judgment Cognitive Functions</h2>
              <p className="mt-1 text-sm text-zinc-400">Individual performance across the 6 NCSBN CJ functions</p>
            </div>
            <div className="px-6 pb-6">
              <CJRadarChart data={data.cjFunctions} />
            </div>
          </section>
        )}

        {/* Domain Performance */}
        {data && data.domainPerformance.length > 0 && (
          <section className="section-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">Domain Performance</h2>
              <p className="mt-1 text-sm text-zinc-400">Score by NREMT content domain</p>
            </div>
            <div className="px-6 pb-6">
              <DomainBars data={data.domainPerformance} />
            </div>
          </section>
        )}

        {/* TEI Performance */}
        {data && data.teiPerformance.length > 0 && (
          <section className="section-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">TEI Format Performance</h2>
              <p className="mt-1 text-sm text-zinc-400">Accuracy by question type</p>
            </div>
            <div className="px-6 pb-6">
              <TEIBars data={data.teiPerformance} />
            </div>
          </section>
        )}

        {/* Heatmap */}
        {data && data.heatmap.length > 0 && (
          <section className="section-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">Domain × TEI Heatmap</h2>
              <p className="mt-1 text-sm text-zinc-400">Pinpoint exactly where this student struggles</p>
            </div>
            <div className="px-6 pb-6">
              <DomainTEIHeatmap data={data.heatmap} />
            </div>
          </section>
        )}

        {/* Error Distribution */}
        {data && (data.errorsByDomain.length > 0 || data.errorsByTEI.length > 0) && (
          <section className="section-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">Error Distribution</h2>
              <p className="mt-1 text-sm text-zinc-400">Where this student&apos;s errors concentrate</p>
            </div>
            <div className="px-6 pb-6">
              <ErrorDistribution byDomain={data.errorsByDomain} byTEI={data.errorsByTEI} />
            </div>
          </section>
        )}

        {/* Specific Errors */}
        {data && data.specificErrors.length > 0 && (
          <section className="section-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">Specific Error Breakdown</h2>
              <p className="mt-1 text-sm text-zinc-400">Question-level error analysis</p>
            </div>
            <div className="px-6 pb-6">
              <SpecificErrorTable data={data.specificErrors} />
            </div>
          </section>
        )}

        {/* Readiness */}
        {data && data.readinessScore !== null && (
          <section className="section-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">NREMT Readiness Projection</h2>
              <p className="mt-1 text-sm text-zinc-400">Estimated scaled score</p>
            </div>
            <div className="px-6 pb-6">
              <ReadinessProjection
                score={data.readinessScore}
                preScore={data.overallPre}
                postScore={data.overallPost}
              />
            </div>
          </section>
        )}

        {/* Exam History Table */}
        {sessions.length > 0 && (
          <section className="section-card overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">Exam History</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {sessions.length} assessment{sessions.length !== 1 ? 's' : ''} completed
              </p>
            </div>
            <div className="px-6 pb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                      <th className="text-center py-2.5 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Score</th>
                      <th className="text-center py-2.5 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Questions</th>
                      <th className="text-right py-2.5 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                        <td className="py-2.5 px-3 text-zinc-600">{session.date}</td>
                        <td className="py-2.5 px-3 text-center">
                          {session.score != null ? (
                            <span className={`font-semibold tabular-nums ${scoreColor(session.score)}`}>
                              {session.score}%
                            </span>
                          ) : (
                            <span className="text-zinc-9000">--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-400 tabular-nums">
                          {session.questionCount ?? '--'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-400 tabular-nums">
                          {session.timeSpent != null ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.round(session.timeSpent / 60)} min
                            </span>
                          ) : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <InstructorGuard>
      <StudentDetailContent studentId={id} />
    </InstructorGuard>
  );
}
