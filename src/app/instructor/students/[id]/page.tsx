'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Mail, Calendar, Award, ArrowLeft, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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

function getScoreBadgeClasses(score: number): string {
  if (score >= 75) return 'bg-green-100 text-green-800 border border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return 'bg-red-100 text-red-800 border border-red-200';
}

function getReadinessBadge(score: number): { classes: string; label: string } {
  if (score >= 80) return { classes: 'bg-green-100 text-green-800 border border-green-200', label: 'Ready' };
  if (score >= 70) return { classes: 'bg-green-100 text-green-700 border border-green-200', label: 'Near Ready' };
  if (score >= 60) return { classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200', label: 'Progressing' };
  return { classes: 'bg-red-100 text-red-800 border border-red-200', label: 'At Risk' };
}

function getBarColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 60) return '#eab308';
  return '#dc2626';
}

function getProgressColor(score: number): string {
  if (score >= 75) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
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
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center py-20">
          <p className="text-[#334155]/60">Student not found.</p>
          <Link href="/instructor/classes">
            <Button className="mt-4 bg-[#b45309] hover:bg-[#92400e]">Back to Classes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const overallAvg =
    profile.totalAnswered && profile.totalAnswered > 0
      ? Math.round(((profile.totalCorrect ?? 0) / profile.totalAnswered) * 100)
      : null;

  const readiness = readinessScore !== null ? getReadinessBadge(readinessScore) : null;

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

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e293b] text-white shadow-md">
                    <span className="text-xl font-bold">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h1 className="font-heading text-3xl font-bold text-[#1e293b]">{profile.fullName}</h1>
                    <p className="mt-1 text-[#334155]/70">
                      {profile.certLevel || 'Unknown Level'} Student
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#334155]/60">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  {overallAvg !== null && (
                    <div className="text-center sm:text-right">
                      <p className="text-4xl font-bold text-[#b45309]">{overallAvg}%</p>
                      <p className="text-xs text-[#334155]/50">Overall Score</p>
                    </div>
                  )}
                  {readinessScore !== null && readiness && (
                    <Badge className={`${readiness.classes} px-3 py-1.5 text-sm`}>
                      {readiness.label}: {readinessScore}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Trend */}
        {scoreTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">Score Trend</CardTitle>
                <CardDescription>
                  Progress over {scoreTrend.length} completed session{scoreTrend.length !== 1 ? 's' : ''}
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
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fill: '#334155', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#334155', fontSize: 12 }} />
                    <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="5 5" label={{ value: '70% pass', fill: '#16a34a', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px rgba(27, 58, 92, 0.15)',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#b45309"
                      strokeWidth={2.5}
                      dot={{ r: 5, fill: '#b45309', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#92400e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Domain Mastery - horizontal bars */}
        {domainMastery.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">Domain Mastery</CardTitle>
                <CardDescription>Performance across clinical domains -- weakest areas shown first</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {domainMastery.map((d, idx) => (
                  <motion.div
                    key={d.domain}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-[#334155]">{d.domain}</span>
                      <Badge className={getScoreBadgeClasses(d.score)}>
                        {d.score}%
                      </Badge>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.score}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className={`h-full rounded-full ${getProgressColor(d.score)}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* TEI Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">TEI Performance</CardTitle>
                <CardDescription>Scores by technology-enhanced item type</CardDescription>
              </CardHeader>
              <CardContent>
                {teiPerf.length > 0 ? (
                  <div className="space-y-4">
                    {teiPerf.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-[#334155]">{item.itemType}</span>
                          <span className="text-sm font-bold" style={{ color: getBarColor(item.score) }}>
                            {item.score}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className={`h-full rounded-full ${getProgressColor(item.score)}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-[#334155]/40">
                    <TrendingUp className="h-8 w-8 mb-2" />
                    <p className="text-sm">No TEI data available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Error Patterns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">Error Patterns</CardTitle>
                <CardDescription>Identified weakness patterns from exam analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {errorPatterns.length > 0 ? (
                  <div className="space-y-2">
                    {errorPatterns.map((pattern, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3"
                      >
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-[#b45309] flex-shrink-0" />
                        <p className="text-sm text-orange-900">{pattern}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-[#334155]/40">
                    <Award className="h-8 w-8 mb-2" />
                    <p className="text-sm">No error patterns identified yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Exam Session History */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-[#1e293b]">Exam Session History</CardTitle>
                <CardDescription>
                  Last {sessions.length} completed assessment{sessions.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-[#1e293b]">Date</TableHead>
                      <TableHead className="font-semibold text-[#1e293b]">Level</TableHead>
                      <TableHead className="text-center font-semibold text-[#1e293b]">Score</TableHead>
                      <TableHead className="text-center font-semibold text-[#1e293b]">Questions</TableHead>
                      <TableHead className="text-right font-semibold text-[#1e293b]">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session, idx) => (
                      <motion.tr
                        key={session.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b transition-colors hover:bg-slate-50"
                      >
                        <TableCell className="text-[#334155]">{session.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {session.certLevel || '--'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {session.score != null ? (
                            <Badge className={getScoreBadgeClasses(session.score)}>
                              {session.score}%
                            </Badge>
                          ) : (
                            <span className="text-[#334155]/40">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-[#334155]">
                          {session.questionCount ?? '--'}
                        </TableCell>
                        <TableCell className="text-right text-[#334155]/70">
                          {session.timeSpent != null
                            ? `${Math.round(session.timeSpent / 60)} min`
                            : '--'}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
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
