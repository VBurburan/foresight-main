'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  FlagOff,
  Send,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

/* ------------------------------------------------------------------ */
/*  Types mirroring the test-builder data model                       */
/* ------------------------------------------------------------------ */

type TEIType = 'MC' | 'MR' | 'DD' | 'BL' | 'OB' | 'CJS';

interface MCData {
  options: { key: string; text: string }[];
  correctKey: string;
}
interface MRData {
  options: { key: string; text: string }[];
  correctKeys: string[];
}
interface DDData {
  items: { id: string; text: string }[];
  categories: string[];
  correctMapping: Record<string, string>;
}
interface BLData {
  items: string[];
  correctOrder: number[];
}
interface OBData {
  rows: string[];
  columns: string[];
  correctAnswers: Record<string, string>;
}

interface CJSVitals {
  hr: string; bp: string; rr: string; spo2: string;
  etco2: string; temp: string; bgl: string; map: string;
}
interface CJSPhaseQuestion {
  stem: string;
  type: TEIType;
  data: MCData | MRData | DDData | BLData | OBData;
  ecgStripId?: string;
}
interface CJSPhase {
  label: string;
  content: string;
  vitals?: CJSVitals;
  history?: string;
  ecgFindings?: string;
  questions: CJSPhaseQuestion[];
}
interface CJSData {
  phases: CJSPhase[];
}

interface ExamQuestion {
  id: string;
  display_order: number;
  item_type: TEIType;
  stem: string;
  options: MCData | MRData | DDData | BLData | OBData | Record<string, never>;
  cjs_data: CJSData | null;
  ecg_strip_id: string | null;
}

interface Assessment {
  id: string;
  name: string;
  certification_level: string | null;
  question_count: number;
}

/* Answer types per question */
type MCAnswer = string;
type MRAnswer = string[];
type DDAnswer = Record<string, string>;
type BLAnswer = number[];
type OBAnswer = Record<string, string>;
type CJSAnswer = Record<string, any>;

type AnyAnswer = MCAnswer | MRAnswer | DDAnswer | BLAnswer | OBAnswer | CJSAnswer;

/* ------------------------------------------------------------------ */
/*  Timer helper                                                       */
/* ------------------------------------------------------------------ */

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  ECG Strip inline preview                                          */
/* ------------------------------------------------------------------ */

function ECGStripPreview({ stripId }: { stripId: string }) {
  const [strip, setStrip] = useState<{ image_url: string; rhythm_label: string } | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('ecg_strips')
      .select('image_url, rhythm_label')
      .eq('id', stripId)
      .single()
      .then(({ data }) => {
        if (data) setStrip(data);
      });
  }, [stripId]);
  if (!strip) return null;
  return (
    <div className="rounded-lg border border-white/[0.06] surface-1 overflow-hidden mb-4">
      <img src={strip.image_url} alt="ECG Strip" className="w-full h-auto object-contain" />
      <p className="text-[9px] text-zinc-600 px-2 py-1">PhysioNet - CC BY 4.0</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Question renderers (MC, MR, DD, BL, OB)                          */
/* ------------------------------------------------------------------ */

function MCRenderer({
  data,
  answer,
  onChange,
}: {
  data: MCData;
  answer: MCAnswer;
  onChange: (val: MCAnswer) => void;
}) {
  return (
    <div className="space-y-2">
      {data.options.map((opt) => {
        const selected = answer === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`w-full text-left rounded-lg border px-4 py-3 transition-colors flex items-start gap-3 ${
              selected
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-white/[0.06] surface-1 hover:border-white/[0.12]'
            }`}
          >
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                selected
                  ? 'bg-blue-500 text-white'
                  : 'surface-2 text-zinc-400'
              }`}
            >
              {opt.key}
            </span>
            <span className={`text-sm pt-0.5 ${selected ? 'text-white font-medium' : 'text-zinc-400'}`}>
              {opt.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MRRenderer({
  data,
  answer,
  onChange,
}: {
  data: MRData;
  answer: MRAnswer;
  onChange: (val: MRAnswer) => void;
}) {
  const toggle = (key: string) => {
    if (answer.includes(key)) {
      onChange(answer.filter((k) => k !== key));
    } else {
      onChange([...answer, key]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wide">
        Select all that apply
      </p>
      {data.options.map((opt) => {
        const selected = answer.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggle(opt.key)}
            className={`w-full text-left rounded-lg border px-4 py-3 transition-colors flex items-start gap-3 ${
              selected
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-white/[0.06] surface-1 hover:border-white/[0.12]'
            }`}
          >
            <span
              className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-sm font-semibold ${
                selected
                  ? 'bg-blue-500 text-white'
                  : 'surface-2 text-zinc-400'
              }`}
            >
              {selected ? <CheckCircle2 className="w-4 h-4" /> : opt.key}
            </span>
            <span className={`text-sm pt-0.5 ${selected ? 'text-white font-medium' : 'text-zinc-400'}`}>
              {opt.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DDRenderer({
  data,
  answer,
  onChange,
}: {
  data: DDData;
  answer: DDAnswer;
  onChange: (val: DDAnswer) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wide">
        Assign each item to a category
      </p>
      {data.items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-lg border border-white/[0.06] px-4 py-3 surface-1"
        >
          <span className="flex-1 text-sm text-zinc-300 font-medium">{item.text}</span>
          <select
            value={answer[item.id] || ''}
            onChange={(e) => onChange({ ...answer, [item.id]: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-sm text-white focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/40 outline-none"
          >
            <option value="">-- Select --</option>
            {data.categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function BLRenderer({
  data,
  answer,
  onChange,
}: {
  data: BLData;
  answer: BLAnswer;
  onChange: (val: BLAnswer) => void;
}) {
  const currentOrder = answer.length === data.items.length ? answer : data.items.map((_, i) => i);

  const setPosition = (itemOrigIdx: number, newPos: number) => {
    const updated = [...currentOrder];
    const currentPos = updated.indexOf(itemOrigIdx);
    if (currentPos === -1) return;
    updated.splice(currentPos, 1);
    updated.splice(newPos, 0, itemOrigIdx);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wide">
        Arrange in correct order (use dropdown to set position)
      </p>
      {currentOrder.map((origIdx, pos) => (
        <div
          key={origIdx}
          className="flex items-center gap-3 rounded-lg border border-white/[0.06] px-4 py-3 surface-1"
        >
          <select
            value={pos}
            onChange={(e) => setPosition(origIdx, parseInt(e.target.value))}
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-2 py-1 text-sm text-white w-16 text-center font-mono font-bold focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/40 outline-none"
          >
            {data.items.map((_, i) => (
              <option key={i} value={i}>
                {i + 1}
              </option>
            ))}
          </select>
          <span className="flex-1 text-sm text-zinc-300">{data.items[origIdx]}</span>
        </div>
      ))}
    </div>
  );
}

function OBRenderer({
  data,
  answer,
  onChange,
}: {
  data: OBData;
  answer: OBAnswer;
  onChange: (val: OBAnswer) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-zinc-400 mb-3 font-medium uppercase tracking-wide">
        Select one option per row
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium uppercase tracking-wider text-zinc-400 py-2 px-3 border-b border-white/[0.06]">
              Statement
            </th>
            {data.columns.map((col, idx) => (
              <th
                key={idx}
                className="text-center text-xs font-medium uppercase tracking-wider text-zinc-400 py-2 px-3 border-b border-white/[0.06] min-w-[100px]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
              <td className="text-sm text-zinc-300 py-3 px-3">{row}</td>
              {data.columns.map((col, colIdx) => (
                <td key={colIdx} className="text-center py-3 px-3">
                  <button
                    type="button"
                    onClick={() => onChange({ ...answer, [row]: col })}
                    className={`w-6 h-6 rounded-full border-2 transition-colors mx-auto flex items-center justify-center ${
                      answer[row] === col
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-zinc-600 hover:border-zinc-500'
                    }`}
                  >
                    {answer[row] === col && (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CJS Renderer                                                       */
/* ------------------------------------------------------------------ */

function CJSRenderer({
  data,
  answer,
  onChange,
}: {
  data: CJSData;
  answer: CJSAnswer;
  onChange: (val: CJSAnswer) => void;
}) {
  const updateSubAnswer = (phaseIdx: number, qIdx: number, val: any) => {
    onChange({ ...answer, [`${phaseIdx}_${qIdx}`]: val });
  };

  return (
    <div className="space-y-6">
      {data.phases.map((phase, phaseIdx) => (
        <div key={phaseIdx} className="rounded-lg border border-white/[0.06] surface-1 overflow-hidden">
          {/* Phase header */}
          <div className="bg-blue-500/10 border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
              Phase {phaseIdx + 1}
            </span>
            <h4 className="text-sm font-semibold text-white">{phase.label}</h4>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-sm text-zinc-400 leading-relaxed">{phase.content}</p>

            {phase.vitals && (
              <div className="rounded-lg surface-2 border border-white/[0.06] p-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">Vitals</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {phase.vitals.hr && (
                    <div>
                      <span className="font-semibold text-zinc-400">HR:</span>{' '}
                      <span className="text-zinc-300">{phase.vitals.hr}</span>
                    </div>
                  )}
                  {phase.vitals.bp && (
                    <div>
                      <span className="font-semibold text-zinc-400">BP:</span>{' '}
                      <span className="text-zinc-300">{phase.vitals.bp}</span>
                    </div>
                  )}
                  {phase.vitals.rr && (
                    <div>
                      <span className="font-semibold text-zinc-400">RR:</span>{' '}
                      <span className="text-zinc-300">{phase.vitals.rr}</span>
                    </div>
                  )}
                  {phase.vitals.spo2 && (
                    <div>
                      <span className="font-semibold text-zinc-400">SpO2:</span>{' '}
                      <span className="text-zinc-300">{phase.vitals.spo2}</span>
                    </div>
                  )}
                  {phase.vitals.etco2 && (
                    <div>
                      <span className="font-semibold text-zinc-400">EtCO2:</span>{' '}
                      <span className="text-zinc-300">{phase.vitals.etco2}</span>
                    </div>
                  )}
                  {phase.vitals.temp && (
                    <div>
                      <span className="font-semibold text-zinc-400">Temp:</span>{' '}
                      <span className="text-zinc-300">{phase.vitals.temp}</span>
                    </div>
                  )}
                  {phase.vitals.bgl && (
                    <div>
                      <span className="font-semibold text-zinc-400">BGL:</span>{' '}
                      <span className="text-zinc-300">{phase.vitals.bgl}</span>
                    </div>
                  )}
                  {phase.vitals.map && (
                    <div>
                      <span className="font-semibold text-zinc-400">MAP:</span>{' '}
                      <span className="text-zinc-300">{phase.vitals.map}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {phase.history && (
              <div className="rounded-lg surface-2 border border-white/[0.06] p-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">History</p>
                <p className="text-sm text-zinc-300">{phase.history}</p>
              </div>
            )}

            {phase.ecgFindings && (
              <div className="rounded-lg surface-2 border border-white/[0.06] p-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">ECG Findings</p>
                <p className="text-sm text-zinc-300">{phase.ecgFindings}</p>
              </div>
            )}

            {phase.questions.map((pq, qIdx) => {
              const subKey = `${phaseIdx}_${qIdx}`;
              const subAnswer = answer[subKey];

              return (
                <div key={qIdx} className="border-t border-white/[0.06] pt-4">
                  {pq.ecgStripId && <ECGStripPreview stripId={pq.ecgStripId} />}
                  <p className="text-sm font-medium text-white mb-3">{pq.stem}</p>
                  {renderSubQuestion(pq, subAnswer, (val: any) => updateSubAnswer(phaseIdx, qIdx, val))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderSubQuestion(
  pq: CJSPhaseQuestion,
  answer: any,
  onChange: (val: any) => void
) {
  const data = pq.data;
  switch (pq.type) {
    case 'MC':
      return <MCRenderer data={data as MCData} answer={answer || ''} onChange={onChange} />;
    case 'MR':
      return <MRRenderer data={data as MRData} answer={answer || []} onChange={onChange} />;
    case 'DD':
      return <DDRenderer data={data as DDData} answer={answer || {}} onChange={onChange} />;
    case 'BL':
      return <BLRenderer data={data as BLData} answer={answer || []} onChange={onChange} />;
    case 'OB':
      return <OBRenderer data={data as OBData} answer={answer || {}} onChange={onChange} />;
    default:
      return <p className="text-sm text-red-400">Unknown question type: {pq.type}</p>;
  }
}

/* ------------------------------------------------------------------ */
/*  Scoring helpers                                                    */
/* ------------------------------------------------------------------ */

function arraysEqualSorted(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function scoreQuestion(question: ExamQuestion, answer: AnyAnswer): boolean {
  const type = question.item_type;
  const opts = question.options;

  if (type === 'MC') {
    const data = opts as MCData;
    return (answer as MCAnswer) === data.correctKey;
  }

  if (type === 'MR') {
    const data = opts as MRData;
    return arraysEqualSorted(answer as MRAnswer, data.correctKeys);
  }

  if (type === 'DD') {
    const data = opts as DDData;
    const studentMapping = answer as DDAnswer;
    return data.items.every((item) => studentMapping[item.id] === data.correctMapping[item.id]);
  }

  if (type === 'BL') {
    const data = opts as BLData;
    const studentOrder = answer as BLAnswer;
    const expected = data.correctOrder.length > 0 ? data.correctOrder : data.items.map((_, i) => i);
    return expected.every((v, i) => studentOrder[i] === v);
  }

  if (type === 'OB') {
    const data = opts as OBData;
    const studentAnswers = answer as OBAnswer;
    return data.rows.every((row) => studentAnswers[row] === data.correctAnswers[row]);
  }

  return false;
}

function scoreCJSQuestion(question: ExamQuestion, answer: CJSAnswer): [number, number] {
  const cjs = question.cjs_data;
  if (!cjs || !cjs.phases) return [0, 0];

  let correct = 0;
  let total = 0;

  cjs.phases.forEach((phase, phaseIdx) => {
    phase.questions.forEach((pq, qIdx) => {
      total++;
      const subKey = `${phaseIdx}_${qIdx}`;
      const subAnswer = answer[subKey];
      if (!subAnswer) return;

      const data = pq.data;
      const type = pq.type;

      if (type === 'MC') {
        if ((subAnswer as MCAnswer) === (data as MCData).correctKey) correct++;
      } else if (type === 'MR') {
        if (arraysEqualSorted(subAnswer as MRAnswer, (data as MRData).correctKeys)) correct++;
      } else if (type === 'DD') {
        const dd = data as DDData;
        const sa = subAnswer as DDAnswer;
        if (dd.items.every((item) => sa[item.id] === dd.correctMapping[item.id])) correct++;
      } else if (type === 'BL') {
        const bl = data as BLData;
        const so = subAnswer as BLAnswer;
        const expected = bl.correctOrder.length > 0 ? bl.correctOrder : bl.items.map((_, i) => i);
        if (expected.every((v, i) => so[i] === v)) correct++;
      } else if (type === 'OB') {
        const ob = data as OBData;
        const sa = subAnswer as OBAnswer;
        if (ob.rows.every((row) => sa[row] === ob.correctAnswers[row])) correct++;
      }
    });
  });

  return [correct, total];
}

/* ------------------------------------------------------------------ */
/*  Navigation overview sidebar component                              */
/* ------------------------------------------------------------------ */

function QuestionNav({
  questions,
  answers,
  flagged,
  current,
  onJump,
}: {
  questions: ExamQuestion[];
  answers: Record<string, AnyAnswer>;
  flagged: Set<string>;
  current: number;
  onJump: (idx: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q, idx) => {
        const answered = answers[q.id] !== undefined && answers[q.id] !== '' &&
          !(Array.isArray(answers[q.id]) && (answers[q.id] as any[]).length === 0) &&
          !(typeof answers[q.id] === 'object' && !Array.isArray(answers[q.id]) && Object.keys(answers[q.id] as object).length === 0);
        const isFlagged = flagged.has(q.id);
        const isCurrent = idx === current;

        return (
          <button
            key={q.id}
            onClick={() => onJump(idx)}
            className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors relative ${
              isCurrent
                ? 'ring-2 ring-blue-400 surface-1 text-white'
                : answered
                ? 'surface-2 text-zinc-300 hover:bg-zinc-700'
                : 'surface-1 text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04]'
            }`}
          >
            {idx + 1}
            {isFlagged && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main exam component                                                */
/* ------------------------------------------------------------------ */

function ExamContent({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnyAnswer>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch assessment + questions
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError('Please sign in to take this exam.');
      setLoading(false);
      return;
    }

    async function loadExam() {
      const supabase = createClient();

      const { data: assessData, error: assessErr } = await supabase
        .from('instructor_assessments')
        .select('id, name, certification_level, question_count')
        .eq('id', assessmentId)
        .single();

      if (assessErr || !assessData) {
        setError('Assessment not found.');
        setLoading(false);
        return;
      }

      setAssessment(assessData);

      const { data: questionData, error: qErr } = await supabase
        .from('instructor_questions')
        .select('id, display_order, item_type, stem, options, cjs_data, ecg_strip_id')
        .eq('assessment_id', assessmentId)
        .order('display_order');

      if (qErr || !questionData || questionData.length === 0) {
        setError('No questions found for this assessment.');
        setLoading(false);
        return;
      }

      setQuestions(questionData as unknown as ExamQuestion[]);

      const { data: sessionData, error: sessionErr } = await supabase
        .from('exam_sessions')
        .insert({
          student_id: user!.id,
          assessment_id: assessmentId,
          certification_level: assessData.certification_level,
          question_count: questionData.length,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (sessionErr || !sessionData) {
        console.error('Failed to create session:', sessionErr);
        setError('Could not start exam session. Please try again.');
        setLoading(false);
        return;
      }

      setSessionId(sessionData.id);
      setLoading(false);
    }

    loadExam();
  }, [user, authLoading, assessmentId]);

  // Timer
  useEffect(() => {
    if (!sessionId) return;
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  // Track time per question
  const recordQuestionTime = useCallback(() => {
    if (questions.length === 0) return;
    const qId = questions[currentIndex]?.id;
    if (!qId) return;
    const spent = Math.round((Date.now() - questionStartTime) / 1000);
    setQuestionTimes((prev) => ({
      ...prev,
      [qId]: (prev[qId] || 0) + spent,
    }));
  }, [currentIndex, questionStartTime, questions]);

  // Navigation
  const goToQuestion = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= questions.length) return;
      recordQuestionTime();
      setCurrentIndex(idx);
      setQuestionStartTime(Date.now());
    },
    [questions.length, recordQuestionTime]
  );

  const goPrev = () => goToQuestion(currentIndex - 1);
  const goNext = () => goToQuestion(currentIndex + 1);

  const toggleFlag = () => {
    const qId = questions[currentIndex]?.id;
    if (!qId) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const updateAnswer = (val: AnyAnswer) => {
    const qId = questions[currentIndex]?.id;
    if (!qId) return;
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  // Submit exam
  const handleSubmit = async () => {
    if (!sessionId || !user || submitting) return;
    setSubmitting(true);
    setShowConfirm(false);
    recordQuestionTime();

    if (timerRef.current) clearInterval(timerRef.current);

    const supabase = createClient();

    let totalCorrect = 0;
    let totalPossible = 0;
    const responses: {
      session_id: string;
      question_id: string;
      answer: any;
      is_correct: boolean;
      time_spent: number;
    }[] = [];

    for (const q of questions) {
      const studentAnswer = answers[q.id];

      if (q.item_type === 'CJS') {
        const [correct, total] = scoreCJSQuestion(q, (studentAnswer as CJSAnswer) || {});
        totalCorrect += correct;
        totalPossible += total;
        responses.push({
          session_id: sessionId,
          question_id: q.id,
          answer: studentAnswer || {},
          is_correct: correct === total && total > 0,
          time_spent: questionTimes[q.id] || 0,
        });
      } else {
        totalPossible++;
        const isCorrect = studentAnswer ? scoreQuestion(q, studentAnswer) : false;
        if (isCorrect) totalCorrect++;
        responses.push({
          session_id: sessionId,
          question_id: q.id,
          answer: studentAnswer ?? null,
          is_correct: isCorrect,
          time_spent: questionTimes[q.id] || 0,
        });
      }
    }

    const scorePercentage = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;

    await supabase
      .from('exam_sessions')
      .update({
        score_percentage: scorePercentage,
        total_correct: totalCorrect,
        completed_at: new Date().toISOString(),
        status: 'completed',
        time_spent_seconds: elapsed,
        question_count: totalPossible,
      })
      .eq('id', sessionId);

    if (responses.length > 0) {
      await supabase.from('session_responses').insert(responses);
    }

    router.push(`/student/results/${sessionId}`);
  };

  // Derived state
  const currentQuestion = questions[currentIndex] || null;
  const answeredCount = Object.keys(answers).filter((qId) => {
    const a = answers[qId];
    if (a === undefined || a === '') return false;
    if (Array.isArray(a) && a.length === 0) return false;
    if (typeof a === 'object' && !Array.isArray(a) && Object.keys(a).length === 0) return false;
    return true;
  }).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentFlagged = currentQuestion ? flagged.has(currentQuestion.id) : false;

  /* ---- Loading / error states ---- */

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mx-auto" />
          <p className="text-zinc-400 text-sm">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-zinc-400 mx-auto" />
          <p className="text-sm text-zinc-300">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            &larr; Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!assessment || !currentQuestion) return null;

  /* ---- Render ---- */

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-50 surface-1 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">{assessment.name}</h1>
            </div>

            <div className="inline-flex items-center rounded-md surface-2 px-2.5 py-1 text-sm text-zinc-400">
              Q {currentIndex + 1} of {questions.length}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-zinc-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{formatTime(elapsed)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
          {/* Question area */}
          <div className="space-y-4">
            <div className="space-y-6">
              {/* Question header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="inline-block mb-3 text-[10px] font-medium text-zinc-400 border border-white/[0.08] rounded px-1.5 py-0.5 uppercase tracking-wider">
                    {currentQuestion.item_type === 'MC' && 'Multiple Choice'}
                    {currentQuestion.item_type === 'MR' && 'Select All That Apply'}
                    {currentQuestion.item_type === 'DD' && 'Drag & Drop'}
                    {currentQuestion.item_type === 'BL' && 'Ordered Response'}
                    {currentQuestion.item_type === 'OB' && 'Matrix / Options Box'}
                    {currentQuestion.item_type === 'CJS' && 'Clinical Judgment Scenario'}
                  </span>
                  <h2 className="text-lg font-medium text-white leading-relaxed">
                    {currentQuestion.stem}
                  </h2>
                </div>
                <button
                  onClick={toggleFlag}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                    currentFlagged
                      ? 'text-orange-500 hover:text-orange-400'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                  title={currentFlagged ? 'Remove flag' : 'Flag for review'}
                >
                  {currentFlagged ? <Flag className="w-5 h-5" /> : <FlagOff className="w-5 h-5" />}
                </button>
              </div>

              {/* ECG strip */}
              {currentQuestion.ecg_strip_id && (
                <ECGStripPreview stripId={currentQuestion.ecg_strip_id} />
              )}

              <div className="border-t border-white/[0.06] pt-6">
                {/* Question content by type */}
                {currentQuestion.item_type === 'MC' && (
                  <MCRenderer
                    data={currentQuestion.options as MCData}
                    answer={(answers[currentQuestion.id] as MCAnswer) || ''}
                    onChange={updateAnswer}
                  />
                )}
                {currentQuestion.item_type === 'MR' && (
                  <MRRenderer
                    data={currentQuestion.options as MRData}
                    answer={(answers[currentQuestion.id] as MRAnswer) || []}
                    onChange={updateAnswer}
                  />
                )}
                {currentQuestion.item_type === 'DD' && (
                  <DDRenderer
                    data={currentQuestion.options as DDData}
                    answer={(answers[currentQuestion.id] as DDAnswer) || {}}
                    onChange={updateAnswer}
                  />
                )}
                {currentQuestion.item_type === 'BL' && (
                  <BLRenderer
                    data={currentQuestion.options as BLData}
                    answer={(answers[currentQuestion.id] as BLAnswer) || []}
                    onChange={updateAnswer}
                  />
                )}
                {currentQuestion.item_type === 'OB' && (
                  <OBRenderer
                    data={currentQuestion.options as OBData}
                    answer={(answers[currentQuestion.id] as OBAnswer) || {}}
                    onChange={updateAnswer}
                  />
                )}
                {currentQuestion.item_type === 'CJS' && currentQuestion.cjs_data && (
                  <CJSRenderer
                    data={currentQuestion.cjs_data}
                    answer={(answers[currentQuestion.id] as CJSAnswer) || {}}
                    onChange={updateAnswer}
                  />
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex gap-3">
                {isLastQuestion ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Exam
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question navigation sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Questions
                </h3>
                <QuestionNav
                  questions={questions}
                  answers={answers}
                  flagged={flagged}
                  current={currentIndex}
                  onJump={goToQuestion}
                />
                <div className="border-t border-white/[0.06] pt-3 text-[10px] text-zinc-400 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded surface-2" />
                    Answered
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded surface-1 border border-white/[0.06]" />
                    Unanswered
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    Flagged
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card shadow-2xl">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Submit Exam?</h3>

              <div className="space-y-2 text-sm text-zinc-400">
                <p>
                  You have answered <strong className="text-white">{answeredCount}</strong> of{' '}
                  <strong className="text-white">{questions.length}</strong> questions.
                </p>
                {answeredCount < questions.length && (
                  <p className="text-red-400">
                    {questions.length - answeredCount} question
                    {questions.length - answeredCount !== 1 ? 's are' : ' is'} unanswered.
                  </p>
                )}
                {flagged.size > 0 && (
                  <p className="text-orange-400">
                    {flagged.size} question{flagged.size !== 1 ? 's are' : ' is'} flagged for review.
                  </p>
                )}
                <p className="text-xs text-zinc-400 mt-2">
                  Time elapsed: {formatTime(elapsed)}
                </p>
              </div>

              <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
                <button
                  className="flex-1 rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                  onClick={() => setShowConfirm(false)}
                >
                  Keep Working
                </button>
                <button
                  className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export with params unwrap                                     */
/* ------------------------------------------------------------------ */

export default function StudentExamPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = use(params);
  return <ExamContent assessmentId={assessmentId} />;
}
