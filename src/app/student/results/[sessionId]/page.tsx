'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

const PASS_THRESHOLD = 70;

interface ExamSessionRow {
  id: string;
  student_id: string;
  assessment_id: string | null;
  status: string | null;
  score_percentage: number | null;
  total_correct: number | null;
  question_count: number | null;
  time_spent_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  certification_level: string | null;
}

interface AssessmentRow {
  id: string;
  name: string;
  certification_level: string | null;
  question_count: number | null;
  status: string | null;
}

interface ResponseRow {
  id: string;
  session_id: string;
  question_id: string;
  answer: any;
  is_correct: boolean | null;
  time_spent: number | null;
}

interface QuestionRow {
  id: string;
  stem: string;
  item_type: string;
  options: any;
  correct_answer: any;
  rationale: string | null;
  display_order: number | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  MC: 'Multiple Choice',
  MR: 'Multiple Response',
  DD: 'Drag & Drop',
  BL: 'Build List',
  OB: 'Options Box',
  CL: 'Cloze',
  CJS: 'Clinical Judgment',
};

export default function SessionResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { user, loading: authLoading } = useUser();
  const supabase = createClient();

  const [session, setSession] = useState<ExamSessionRow | null>(null);
  const [assessment, setAssessment] = useState<AssessmentRow | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRationale, setExpandedRationale] = useState<Set<string>>(new Set());

  const toggleRationale = (qId: string) => {
    setExpandedRationale((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchResults() {
      setLoading(true);
      setError(null);

      try {
        const { data: sessionData, error: sessionErr } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionErr || !sessionData) {
          setError('Session not found.');
          setLoading(false);
          return;
        }
        setSession(sessionData as ExamSessionRow);

        if (sessionData.assessment_id) {
          const { data: assessmentData } = await supabase
            .from('instructor_assessments')
            .select('id, name, certification_level, question_count, status')
            .eq('id', sessionData.assessment_id)
            .single();

          if (assessmentData) {
            setAssessment(assessmentData as AssessmentRow);
          }
        }

        const { data: responseData } = await supabase
          .from('session_responses')
          .select('*')
          .eq('session_id', sessionId);

        if (responseData) {
          setResponses(responseData as ResponseRow[]);
        }

        if (sessionData.assessment_id) {
          const { data: questionData } = await supabase
            .from('instructor_questions')
            .select('id, stem, item_type, options, correct_answer, rationale, display_order')
            .eq('assessment_id', sessionData.assessment_id)
            .order('display_order');

          if (questionData) {
            setQuestions(questionData as QuestionRow[]);
          }
        }
      } catch {
        setError('Failed to load results.');
      }

      setLoading(false);
    }

    fetchResults();
  }, [user, authLoading, sessionId, supabase]);

  if (authLoading || loading) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <div className="h-6 w-24 bg-slate-100 rounded animate-pulse" />
        <div className="h-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-96 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto">
        <div className="text-center py-16">
          <p className="text-sm text-red-600 mb-4">{error || 'Session not found'}</p>
          <Link
            href="/student/results"
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            &larr; Results
          </Link>
        </div>
      </div>
    );
  }

  const scorePercent = session.score_percentage ?? 0;
  const totalCorrect = session.total_correct ?? 0;
  const totalQuestions = session.question_count ?? questions.length ?? 0;
  const passed = scorePercent >= PASS_THRESHOLD;
  const timeSpent = session.time_spent_seconds;

  const responseMap = new Map<string, ResponseRow>();
  responses.forEach((r) => responseMap.set(r.question_id, r));

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-10">
      {/* Back link */}
      <Link
        href="/student/results"
        className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        &larr; Results
      </Link>

      {/* Score Card */}
      <div className="border border-slate-200 rounded-lg bg-white py-10 text-center">
        <p className={`text-5xl font-bold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
          {scorePercent}%
        </p>
        <p className={`text-sm font-medium mt-2 ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
          {passed ? 'Pass' : 'Needs Improvement'}
        </p>
        <p className="text-sm text-slate-500 mt-3">
          {totalCorrect} / {totalQuestions} correct
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Time spent: {formatDuration(timeSpent)}
        </p>
        {assessment && (
          <p className="text-xs text-slate-400 mt-1">{assessment.name}</p>
        )}
      </div>

      {/* Question Review */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          Question Review
        </h2>

        {questions.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            No questions found for this session.
          </p>
        ) : (
          <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
            {questions.map((q, idx) => {
              const response = responseMap.get(q.id);
              const isCorrect = response?.is_correct === true;
              const wasAnswered = response != null && response.answer != null;
              const isExpanded = expandedRationale.has(q.id);

              return (
                <div key={q.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    {/* Number */}
                    <span className="text-sm font-medium text-slate-400 w-6 flex-shrink-0 pt-0.5">
                      {idx + 1}
                    </span>

                    {/* Stem + badge */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">{q.stem}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 uppercase tracking-wide">
                        {ITEM_TYPE_LABELS[q.item_type] || q.item_type}
                      </span>

                      {/* Collapsible rationale */}
                      {q.rationale && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleRationale(q.id)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            Rationale
                          </button>
                          {isExpanded && (
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed pl-4 border-l-2 border-slate-100">
                              {q.rationale}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Correct/Incorrect indicator */}
                    <span className="flex-shrink-0 pt-0.5">
                      {!wasAnswered ? (
                        <span className="text-xs text-slate-300">--</span>
                      ) : isCorrect ? (
                        <span className="text-emerald-600 text-sm font-medium">&check;</span>
                      ) : (
                        <span className="text-red-600 text-sm font-medium">&times;</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom Actions */}
      <div className="flex items-center justify-center gap-4 pb-8">
        <Link
          href="/student/results"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          &larr; Back
        </Link>
        {session.assessment_id && (
          <Link
            href={`/student/exam/${session.assessment_id}`}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Retake Exam
          </Link>
        )}
      </div>
    </div>
  );
}
