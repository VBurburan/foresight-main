'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowLeft, Clock, Target, RotateCcw, Trophy, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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

function formatCorrectAnswer(answer: any): string {
  if (answer == null) return '--';
  if (typeof answer === 'string') return answer;
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'object') {
    // Handle { answer: "B" } or { answers: [...] } or key-value maps
    if (answer.answer) return String(answer.answer);
    if (answer.answers && Array.isArray(answer.answers)) return answer.answers.join(', ');
    return Object.entries(answer)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
  }
  return String(answer);
}

function formatUserAnswer(answer: any): string {
  if (answer == null) return 'No answer';
  if (typeof answer === 'string') return answer;
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'object') {
    if (answer.answer) return String(answer.answer);
    if (answer.answers && Array.isArray(answer.answers)) return answer.answers.join(', ');
    return Object.entries(answer)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
  }
  return String(answer);
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

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchResults() {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch the exam session
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

        // 2. Fetch assessment info (if linked)
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

        // 3. Fetch responses
        const { data: responseData } = await supabase
          .from('session_responses')
          .select('*')
          .eq('session_id', sessionId);

        if (responseData) {
          setResponses(responseData as ResponseRow[]);
        }

        // 4. Fetch questions
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

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              {error || 'Session not found'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              This exam session could not be loaded.
            </p>
            <Button asChild>
              <Link href="/student/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate derived values
  const scorePercent = session.score_percentage ?? 0;
  const totalCorrect = session.total_correct ?? 0;
  const totalQuestions = session.question_count ?? questions.length ?? 0;
  const passed = scorePercent >= PASS_THRESHOLD;
  const timeSpent = session.time_spent_seconds;

  // Build a response lookup by question_id
  const responseMap = new Map<string, ResponseRow>();
  responses.forEach((r) => responseMap.set(r.question_id, r));

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">
            Exam Results
          </h1>
          {assessment && (
            <p className="text-sm text-slate-500 mt-1">
              {assessment.name}
              {assessment.certification_level && (
                <span className="ml-2 text-slate-400">
                  ({assessment.certification_level})
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/student/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          {session.assessment_id && (
            <Button asChild>
              <Link href={`/student/exam/${session.assessment_id}`}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Score Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Big Score */}
        <Card className={`col-span-1 sm:col-span-2 border-2 ${passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
          <CardContent className="p-6 flex items-center gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${
              passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {scorePercent}%
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {passed ? (
                  <Badge variant="success" className="text-xs">PASS</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">BELOW PASSING</Badge>
                )}
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {totalCorrect} of {totalQuestions} correct
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {passed
                  ? 'Great work! You met the passing threshold.'
                  : `You need ${PASS_THRESHOLD}% to pass. Review the questions below.`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Time Spent */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Time Spent</p>
              <p className="text-xl font-bold text-slate-900">{formatDuration(timeSpent)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pass Threshold */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Threshold</p>
              <p className="text-xl font-bold text-slate-900">{PASS_THRESHOLD}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Question-by-Question Review */}
      <div>
        <h2 className="text-lg font-semibold text-[#0D1B2A] mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Question Review
        </h2>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              <p>No questions found for this session.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const response = responseMap.get(q.id);
              const isCorrect = response?.is_correct === true;
              const wasAnswered = response != null && response.answer != null;

              return (
                <Card
                  key={q.id}
                  className={`border-l-4 ${
                    !wasAnswered
                      ? 'border-l-slate-300'
                      : isCorrect
                      ? 'border-l-green-500'
                      : 'border-l-red-500'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-500">
                          Q{idx + 1}
                        </span>
                        {wasAnswered ? (
                          isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )
                        ) : (
                          <span className="text-xs text-slate-400 italic">skipped</span>
                        )}
                        <CardTitle className="text-sm font-medium text-slate-900 leading-relaxed">
                          {q.stem}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {ITEM_TYPE_LABELS[q.item_type] || q.item_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className={`p-3 rounded-lg ${
                        !wasAnswered
                          ? 'bg-slate-50 border border-slate-200'
                          : isCorrect
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <p className="text-xs font-medium text-slate-500 mb-1">Your Answer</p>
                        <p className={`font-medium ${
                          !wasAnswered
                            ? 'text-slate-400 italic'
                            : isCorrect
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}>
                          {wasAnswered ? formatUserAnswer(response!.answer) : 'No answer'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs font-medium text-slate-500 mb-1">Correct Answer</p>
                        <p className="font-medium text-green-700">
                          {formatCorrectAnswer(q.correct_answer)}
                        </p>
                      </div>
                    </div>

                    {/* Rationale */}
                    {q.rationale && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-xs font-medium text-[#0D1B2A] mb-1">Rationale</p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {q.rationale}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-center gap-4 pb-8">
        <Button variant="outline" asChild>
          <Link href="/student/results">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Results
          </Link>
        </Button>
        {session.assessment_id && (
          <Button asChild>
            <Link href={`/student/exam/${session.assessment_id}`}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Exam
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
