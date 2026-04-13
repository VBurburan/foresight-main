'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Minus } from 'lucide-react';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

const ITEM_TYPE_LABELS: Record<string, string> = {
  MC: 'Multiple Choice',
  MR: 'Multiple Response',
  DD: 'Drag & Drop',
  BL: 'Build List',
  OB: 'Options Box',
  CL: 'Cloze',
  CJS: 'Clinical Judgment',
};

interface SessionInfo {
  id: string;
  studentName: string;
  studentId: string;
  assessmentName: string;
  score: number | null;
  totalCorrect: number | null;
  questionCount: number | null;
  timeSpent: number | null;
  completedAt: string | null;
}

interface ResponseDetail {
  questionId: string;
  stem: string;
  itemType: string;
  domain: string;
  cjFunctions: string[];
  difficulty: string;
  isCorrect: boolean | null;
  timeSpent: number | null;
  rationale: string | null;
}

function ExamDetailContent({ studentId, sessionId }: { studentId: string; sessionId: string }) {
  const { user } = useUser();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [responses, setResponses] = useState<ResponseDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const supabase = createClient();

      // Fetch session
      const { data: sessionData } = await supabase
        .from('exam_sessions')
        .select('id, student_id, assessment_id, score_percentage, total_correct, question_count, time_spent_seconds, completed_at')
        .eq('id', sessionId)
        .single();

      if (!sessionData) { setLoading(false); return; }

      // Fetch student name
      const { data: student } = await supabase
        .from('students')
        .select('full_name')
        .eq('user_id', sessionData.student_id)
        .single();

      // Fetch assessment name
      let assessmentName = 'Untitled Assessment';
      if (sessionData.assessment_id) {
        const { data: assessment } = await supabase
          .from('instructor_assessments')
          .select('name')
          .eq('id', sessionData.assessment_id)
          .single();
        if (assessment) assessmentName = assessment.name;
      }

      setSession({
        id: sessionData.id,
        studentName: student?.full_name || 'Unknown',
        studentId: sessionData.student_id,
        assessmentName,
        score: sessionData.score_percentage ? Number(sessionData.score_percentage) : null,
        totalCorrect: sessionData.total_correct,
        questionCount: sessionData.question_count,
        timeSpent: sessionData.time_spent_seconds,
        completedAt: sessionData.completed_at,
      });

      // Fetch responses with question details
      const { data: responseData } = await supabase
        .from('session_responses')
        .select('question_id, is_correct, time_spent')
        .eq('session_id', sessionId);

      if (responseData && responseData.length > 0) {
        const qIds = responseData.map((r: any) => r.question_id);
        const { data: questions } = await supabase
          .from('instructor_questions')
          .select('id, stem, item_type, metadata, rationale')
          .in('id', qIds);

        const qMap = new Map((questions ?? []).map((q: any) => [q.id, q]));

        const details: ResponseDetail[] = responseData.map((r: any) => {
          const q = qMap.get(r.question_id);
          const meta = (q?.metadata || {}) as any;
          return {
            questionId: r.question_id,
            stem: q?.stem || 'Question not found',
            itemType: q?.item_type || 'MC',
            domain: meta.domain || 'Unknown',
            cjFunctions: meta.cj_functions || [],
            difficulty: meta.difficulty || 'medium',
            isCorrect: r.is_correct,
            timeSpent: r.time_spent,
            rationale: q?.rationale || null,
          };
        });

        // Sort by display order (use question order from the assessment)
        setResponses(details);
      }

      setLoading(false);
    }

    fetchData();
  }, [user, sessionId, studentId]);

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-6 w-32 rounded-md bg-zinc-100 animate-pulse" />
          <div className="h-32 rounded-xl bg-zinc-100 animate-pulse" />
          <div className="h-96 rounded-xl bg-zinc-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8 text-center py-20">
        <p className="text-zinc-500">Session not found.</p>
        <Link href={`/instructor/students/${studentId}`} className="mt-4 inline-block text-sm text-zinc-500 hover:text-zinc-900">
          &larr; Back
        </Link>
      </div>
    );
  }

  const passed = (session.score ?? 0) >= 70;
  const correct = responses.filter((r) => r.isCorrect === true).length;
  const incorrect = responses.filter((r) => r.isCorrect === false).length;
  const unanswered = responses.filter((r) => r.isCorrect === null).length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Back */}
        <Link
          href={`/instructor/students/${studentId}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {session.studentName}
        </Link>

        {/* Session Header */}
        <div className="section-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-900 font-heading">{session.assessmentName}</h1>
              <p className="text-sm text-zinc-500 mt-1">
                {session.studentName} &middot; {session.completedAt ? new Date(session.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'In progress'}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-bold tabular-nums ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                {session.score ?? '--'}%
              </p>
              <p className={`text-sm font-medium ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                {passed ? 'Pass' : 'Needs Improvement'}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-zinc-900 tabular-nums">{session.totalCorrect ?? correct}/{session.questionCount ?? responses.length}</p>
              <p className="text-xs text-zinc-500">Correct</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-600 tabular-nums">{correct}</p>
              <p className="text-xs text-zinc-500">Right</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-red-600 tabular-nums">{incorrect}</p>
              <p className="text-xs text-zinc-500">Wrong</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-900 tabular-nums">
                {session.timeSpent ? `${Math.round(session.timeSpent / 60)}m` : '--'}
              </p>
              <p className="text-xs text-zinc-500">Time</p>
            </div>
          </div>
        </div>

        {/* Question-by-Question Breakdown */}
        <section className="section-card overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold text-zinc-900">Question Breakdown</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {responses.length} questions &middot; {correct} correct &middot; {incorrect} incorrect
            </p>
          </div>
          <div className="divide-y divide-zinc-100">
            {responses.map((r, idx) => (
              <div key={r.questionId} className="px-6 py-4 flex items-start gap-4">
                {/* Status icon */}
                <div className="flex-shrink-0 pt-0.5">
                  {r.isCorrect === true ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : r.isCorrect === false ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-zinc-300" />
                  )}
                </div>

                {/* Question content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-zinc-500">Q{idx + 1}</span>
                    <span className="text-[10px] font-medium text-zinc-500 border border-zinc-200 rounded px-1.5 py-0.5 uppercase tracking-wide">
                      {ITEM_TYPE_LABELS[r.itemType] || r.itemType}
                    </span>
                    <span className="text-[10px] text-zinc-400 border border-zinc-100 rounded px-1.5 py-0.5">
                      {r.domain}
                    </span>
                    {r.difficulty && (
                      <span className={`text-[10px] rounded px-1.5 py-0.5 ${
                        r.difficulty === 'hard' ? 'bg-red-50 text-red-600' :
                        r.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-zinc-50 text-zinc-500'
                      }`}>
                        {r.difficulty}
                      </span>
                    )}
                    {r.timeSpent != null && r.timeSpent > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400">
                        <Clock className="h-2.5 w-2.5" />
                        {r.timeSpent}s
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed line-clamp-2">{r.stem}</p>
                  {r.cjFunctions.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.cjFunctions.map((fn) => (
                        <span key={fn} className="text-[9px] text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">
                          {fn}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.rationale && r.isCorrect === false && (
                    <details className="mt-2">
                      <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700">Show rationale</summary>
                      <p className="mt-1 text-xs text-zinc-500 leading-relaxed pl-3 border-l-2 border-zinc-200">
                        {r.rationale}
                      </p>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ExamDetailPage({ params }: { params: Promise<{ id: string; sessionId: string }> }) {
  const { id, sessionId } = use(params);
  return (
    <InstructorGuard>
      <ExamDetailContent studentId={id} sessionId={sessionId} />
    </InstructorGuard>
  );
}
