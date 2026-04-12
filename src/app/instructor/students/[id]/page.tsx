'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

interface StudentProfile {
  fullName: string;
  email: string;
  certLevel: string | null;
  createdAt: string;
  totalCorrect: number | null;
  totalAnswered: number | null;
}

interface ScorePoint {
  date: string;
  score: number;
}

interface DomainBar {
  domain: string;
  score: number;
}

interface SessionRow {
  id: string;
  date: string;
  certLevel: string | null;
  score: number | null;
  timeSpent: number | null;
  questionCount: number | null;
}

interface TEIPerformance {
  itemType: string;
  score: number;
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function StudentDetailContent({ studentId }: { studentId: string }) {
  const { user } = useUser();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [scoreTrend, setScoreTrend] = useState<ScorePoint[]>([]);
  const [domainMastery, setDomainMastery] = useState<DomainBar[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [teiPerf, setTeiPerf] = useState<TEIPerformance[]>([]);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [errorPatterns, setErrorPatterns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const supabase = createClient();

      const { data: studentData } = await supabase
        .from('students')
        .select(
          'full_name, email, certification_level, created_at, total_correct, total_questions_answered'
        )
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
        totalCorrect: studentData.total_correct,
        totalAnswered: studentData.total_questions_answered,
      });

      const { data: examSessions } = await supabase
        .from('exam_sessions')
        .select(
          'id, score_percentage, completed_at, certification_level, time_spent_seconds, question_count, domain_stats, item_type_stats'
        )
        .eq('student_id', studentId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      const exams = examSessions ?? [];

      const trend: ScorePoint[] = exams
        .filter((e) => e.score_percentage != null)
        .map((e) => ({
          date: new Date(e.completed_at!).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          score: e.score_percentage!,
        }));
      setScoreTrend(trend);

      const sessionRows: SessionRow[] = [...exams]
        .reverse()
        .slice(0, 10)
        .map((e) => ({
          id: e.id,
          date: new Date(e.completed_at!).toLocaleDateString(),
          certLevel: e.certification_level,
          score: e.score_percentage,
          timeSpent: e.time_spent_seconds,
          questionCount: e.question_count,
        }));
      setSessions(sessionRows);

      const domainAccum: Record<string, { total: number; count: number }> = {};
      exams.forEach((e) => {
        if (e.domain_stats && typeof e.domain_stats === 'object') {
          const ds = e.domain_stats as Record<string, any>;
          Object.entries(ds).forEach(([domain, val]) => {
            const score = typeof val === 'number' ? val : val?.score;
            if (typeof score === 'number') {
              if (!domainAccum[domain]) domainAccum[domain] = { total: 0, count: 0 };
              domainAccum[domain].total += score;
              domainAccum[domain].count += 1;
            }
          });
        }
      });
      const domainData: DomainBar[] = Object.entries(domainAccum)
        .map(([domain, { total, count }]) => ({
          domain,
          score: Math.round(total / count),
        }))
        .sort((a, b) => a.score - b.score);
      setDomainMastery(domainData);

      const teiAccum: Record<string, { total: number; count: number }> = {};
      exams.forEach((e) => {
        if (e.item_type_stats && typeof e.item_type_stats === 'object') {
          const ts = e.item_type_stats as Record<string, any>;
          Object.entries(ts).forEach(([itemType, val]) => {
            const score = typeof val === 'number' ? val : val?.score;
            if (typeof score === 'number') {
              if (!teiAccum[itemType]) teiAccum[itemType] = { total: 0, count: 0 };
              teiAccum[itemType].total += score;
              teiAccum[itemType].count += 1;
            }
          });
        }
      });
      const teiData: TEIPerformance[] = Object.entries(teiAccum).map(([itemType, { total, count }]) => ({
        itemType: formatItemType(itemType),
        score: Math.round(total / count),
      }));
      setTeiPerf(teiData);

      const recentScores = trend.slice(-3).map((t) => t.score);
      if (recentScores.length > 0) {
        const readiness = Math.round(
          recentScores.reduce((a, b) => a + b, 0) / recentScores.length
        );
        setReadinessScore(readiness);
      }

      const { data: patterns } = await supabase
        .from('student_error_patterns')
        .select('pattern_name, category')
        .eq('student_id', studentId)
        .limit(5);

      if (patterns && patterns.length > 0) {
        setErrorPatterns(
          patterns.map((p: any) => p.pattern_name || p.category || 'Unknown pattern')
        );
      }

      setLoading(false);
    }

    fetchData();
  }, [user, studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-6 w-48 rounded bg-slate-100 animate-pulse" />
          <div className="h-32 rounded bg-slate-100 animate-pulse" />
          <div className="h-64 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center py-20">
          <p className="text-slate-400">Student not found.</p>
          <Link href="/instructor/classes" className="mt-4 inline-block text-sm text-slate-600 hover:text-slate-900">
            &larr; Classes
          </Link>
        </div>
      </div>
    );
  }

  const overallAvg =
    profile.totalAnswered && profile.totalAnswered > 0
      ? Math.round(((profile.totalCorrect ?? 0) / profile.totalAnswered) * 100)
      : null;

  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Back link */}
        <Link
          href="/instructor/classes"
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          &larr; Classes
        </Link>

        {/* Student profile row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{profile.fullName}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>{profile.email}</span>
              <span>{profile.certLevel || 'Unknown Level'}</span>
              <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              {readinessScore !== null && (
                <span className={scoreColor(readinessScore)}>
                  Readiness: {readinessScore}%
                </span>
              )}
            </div>
          </div>
          {overallAvg !== null && (
            <div className="text-right">
              <p className={`text-4xl font-bold ${scoreColor(overallAvg)}`}>{overallAvg}%</p>
              <p className="text-xs text-slate-400 mt-0.5">Overall Score</p>
            </div>
          )}
        </div>

        {/* Score Trend */}
        {scoreTrend.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Score Trend</h2>
            <p className="text-xs text-slate-400 mb-4">
              {scoreTrend.length} session{scoreTrend.length !== 1 ? 's' : ''}
              {scoreTrend.length >= 2 && (
                <>
                  {' '}&middot;{' '}
                  {scoreTrend[scoreTrend.length - 1].score > scoreTrend[0].score
                    ? 'Trending up'
                    : scoreTrend[scoreTrend.length - 1].score < scoreTrend[0].score
                    ? 'Trending down'
                    : 'Stable'}
                </>
              )}
            </p>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <ReferenceLine y={70} stroke="#cbd5e1" strokeDasharray="5 5" label={{ value: '70% pass', fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#334155"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#334155', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#1e293b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Domain Mastery */}
        {domainMastery.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Domain Mastery</h2>
            <p className="text-xs text-slate-400 mb-4">Weakest areas shown first</p>
            <div className="space-y-3">
              {domainMastery.map((d) => (
                <div key={d.domain}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{d.domain}</span>
                    <span className={`text-sm font-semibold tabular-nums ${scoreColor(d.score)}`}>
                      {d.score}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-600 transition-all"
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* TEI Performance */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">TEI Performance</h2>
            <p className="text-xs text-slate-400 mb-4">By item type</p>
            {teiPerf.length > 0 ? (
              <div className="space-y-3">
                {teiPerf.map((item) => (
                  <div key={item.itemType}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{item.itemType}</span>
                      <span className={`text-sm font-semibold tabular-nums ${scoreColor(item.score)}`}>
                        {item.score}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-600 transition-all"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">No TEI data available yet.</p>
            )}
          </div>

          {/* Error Patterns */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Error Patterns</h2>
            <p className="text-xs text-slate-400 mb-4">Identified weakness patterns</p>
            {errorPatterns.length > 0 ? (
              <ul className="space-y-2">
                {errorPatterns.map((pattern, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    {pattern}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">No error patterns identified yet.</p>
            )}
          </div>
        </div>

        {/* Exam Session History */}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Exam History</h2>
            <p className="text-xs text-slate-400 mb-4">
              Last {sessions.length} assessment{sessions.length !== 1 ? 's' : ''}
            </p>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Level</th>
                    <th className="text-center py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Score</th>
                    <th className="text-center py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Questions</th>
                    <th className="text-right py-2.5 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-700">{session.date}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-xs">{session.certLevel || '--'}</td>
                      <td className="py-2.5 px-4 text-center">
                        {session.score != null ? (
                          <span className={`font-semibold tabular-nums ${scoreColor(session.score)}`}>
                            {session.score}%
                          </span>
                        ) : (
                          <span className="text-slate-300">--</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-600 tabular-nums">
                        {session.questionCount ?? '--'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500 tabular-nums">
                        {session.timeSpent != null
                          ? `${Math.round(session.timeSpent / 60)} min`
                          : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatItemType(code: string): string {
  const map: Record<string, string> = {
    MC: 'Multiple Choice',
    MR: 'Multiple Response',
    BL: 'Bowtie / Linking',
    DD: 'Drag & Drop',
    OB: 'Ordered Blocking',
    CL: 'Cloze / Fill-in',
  };
  return map[code] || code;
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <InstructorGuard>
      <StudentDetailContent studentId={id} />
    </InstructorGuard>
  );
}
