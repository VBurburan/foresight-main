'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flag, CheckCircle2, ZoomIn } from 'lucide-react';
import ExamTimer from './exam-timer';
import ExamProgressBar from './exam-progress-bar';
import QuestionRationale from './question-rationale';
import MultipleChoice from './question-types/multiple-choice';
import MultipleResponse from './question-types/multiple-response';
import DragAndDrop from './question-types/drag-and-drop';
import OrderedResponse from './question-types/ordered-response';
import BowTie from './question-types/bowtie';
import OptionsBox from './question-types/options-box';
import Cloze from './question-types/cloze';
import { scoreAnswer } from '@/lib/utils/scoring';
import { responseToDbFormat } from '@/lib/utils/question-adapter';
import type { ItemType } from '@/types/database';

interface Question {
  id: string;
  stem: string;
  item_type: string;
  options: any;
  correct_answer: any;
  rationale: string;
  rationales_distractors?: Record<string, string> | null;
  domain_id: string;
  difficulty: string;
  cj_step: string;
  clinical_scenario?: string;
  image_url?: string;
  ecg_strip_id?: string;
  ecg_strip?: {
    image_url: string;
    rhythm_label: string;
    source_dataset: string;
    source_license: string;
  };
  // Raw DB fields for scoring
  raw_item_type?: ItemType;
  raw_correct_answer?: any;
  raw_options?: any;
}

interface Session {
  id: string;
  assessment_id?: string;
  created_at: string;
  started_at?: string;
}

interface Response {
  id: string;
  question_id: string;
  answer: any;
  is_flagged: boolean;
  time_spent: number;
  is_correct?: boolean;
}

interface QuestionPlayerProps {
  sessionId: string;
  questions: Question[];
  initialResponses: Map<string, any> | Record<string, any>;
  session: Session;
  feedbackMode?: 'immediate' | 'end';
  showTimer?: boolean;
  timerMinutes?: number;
  onComplete?: (results: ExamResults) => void;
}

export interface ExamResults {
  totalQuestions: number;
  totalCorrect: number;
  scorePercentage: number;
  responses: Record<string, Response>;
  timeSpentSeconds: number;
  domainBreakdown: Record<string, { correct: number; total: number }>;
  itemTypeBreakdown: Record<string, { correct: number; total: number }>;
}

export default function QuestionPlayer({
  sessionId,
  questions,
  initialResponses,
  session,
  feedbackMode = 'immediate',
  showTimer = true,
  timerMinutes,
  onComplete,
}: QuestionPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>(
    initialResponses instanceof Map ? Object.fromEntries(initialResponses) : initialResponses || {}
  );
  const [showRationale, setShowRationale] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [sessionStartTime] = useState(Date.now());
  const [timerPaused, setTimerPaused] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isComplete, setIsComplete] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentResponse = responses[currentQuestion?.id];
  const isAnswered = !!currentResponse?.answer;
  const isImmediate = feedbackMode === 'immediate';

  // Track time spent on current question
  useEffect(() => {
    if (!currentQuestion || timerPaused) return;

    const interval = setInterval(() => {
      setTimeSpent((prev) => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion, timerPaused]);

  // Auto-save response via server API (bypasses RLS)
  useEffect(() => {
    if (!currentResponse || !sessionId || sessionId.startsWith('local-')) return;

    const saveResponse = async () => {
      try {
        const res = await fetch('/api/exam-session/response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            question_id: currentQuestion.id,
            answer: currentResponse.answer,
            is_flagged: currentResponse.is_flagged,
            is_correct: currentResponse.is_correct,
            time_spent: timeSpent[currentQuestion.id] || 0,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error('Error saving response:', errData);
        }
      } catch (err) {
        console.error('Error saving response:', err);
      }
    };

    const debounce = setTimeout(saveResponse, 1000);
    return () => clearTimeout(debounce);
  }, [currentResponse, sessionId, timeSpent, currentQuestion?.id]);

  const handleAnswer = useCallback(
    (answer: any) => {
      if (!currentQuestion) return;

      // Score the answer
      const rawType = (currentQuestion.raw_item_type || currentQuestion.item_type) as ItemType;
      const rawCorrect = currentQuestion.raw_correct_answer || currentQuestion.correct_answer;
      const dbAnswer = responseToDbFormat(rawType, answer);
      const correct = scoreAnswer(rawType, rawCorrect, dbAnswer);

      setResponses((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          id: prev[currentQuestion.id]?.id || '',
          question_id: currentQuestion.id,
          answer,
          is_flagged: prev[currentQuestion.id]?.is_flagged || false,
          time_spent: timeSpent[currentQuestion.id] || 0,
          is_correct: correct,
        },
      }));

      // In immediate mode, auto-show the rationale panel.
      // For multi-interaction TEI types (MR, DD, BL, OB), defer rationale
      // until Next is clicked because students need to complete all
      // selections/placements/reordering before committing.
      const isMC = rawType === 'MC' || currentQuestion.item_type === 'multiple_choice';
      if (isImmediate && isMC) {
        setShowRationale(true);
      }
    },
    [currentQuestion, timeSpent, isImmediate]
  );

  const handleFlag = useCallback(() => {
    if (!currentQuestion) return;

    setFlaggedQuestions((prev) => {
      const updated = new Set(prev);
      if (updated.has(currentQuestion.id)) {
        updated.delete(currentQuestion.id);
      } else {
        updated.add(currentQuestion.id);
      }
      return updated;
    });

    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        id: prev[currentQuestion.id]?.id || '',
        question_id: currentQuestion.id,
        answer: prev[currentQuestion.id]?.answer || null,
        is_flagged: !prev[currentQuestion.id]?.is_flagged,
        time_spent: timeSpent[currentQuestion.id] || 0,
      },
    }));
  }, [currentQuestion, timeSpent]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection('backward');
      setShowRationale(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    const hasResponse = currentQuestion && responses[currentQuestion.id]?.answer;

    // In immediate mode, the student must see the rationale before advancing.
    // Show rationale and block if it's not visible yet. This covers:
    //   - MR questions (handleAnswer defers rationale until Next is clicked)
    //   - Race condition where Next is clicked before handleAnswer's
    //     setShowRationale(true) has committed to state
    if (isImmediate && hasResponse && !showRationale) {
      setShowRationale(true);
      return;
    }

    if (currentIndex < questions.length - 1) {
      setDirection('forward');
      setShowRationale(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFinishExam = () => {
    const totalCorrect = questions.filter(
      (q) => responses[q.id]?.is_correct
    ).length;
    const totalSeconds = Math.round((Date.now() - sessionStartTime) / 1000);

    // Domain breakdown
    const domainBreakdown: Record<string, { correct: number; total: number }> = {};
    const itemTypeBreakdown: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q) => {
      const domain = q.domain_id;
      const type = q.raw_item_type || q.item_type;

      if (!domainBreakdown[domain]) domainBreakdown[domain] = { correct: 0, total: 0 };
      domainBreakdown[domain].total++;
      if (responses[q.id]?.is_correct) domainBreakdown[domain].correct++;

      if (!itemTypeBreakdown[type]) itemTypeBreakdown[type] = { correct: 0, total: 0 };
      itemTypeBreakdown[type].total++;
      if (responses[q.id]?.is_correct) itemTypeBreakdown[type].correct++;
    });

    const results: ExamResults = {
      totalQuestions: questions.length,
      totalCorrect,
      scorePercentage: Math.round((totalCorrect / questions.length) * 100),
      responses,
      timeSpentSeconds: totalSeconds,
      domainBreakdown,
      itemTypeBreakdown,
    };

    setIsComplete(true);
    onComplete?.(results);
  };

  const handleNavigateToQuestion = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 'forward' : 'backward');
    setShowRationale(false);
    setCurrentIndex(index);
  };

  // Get distractor rationale for current wrong answer
  const getDistractorRationale = (): string | null => {
    if (!currentQuestion || !currentResponse || currentResponse.is_correct) return null;
    const distractors = currentQuestion.rationales_distractors;
    if (!distractors) return null;

    const userAnswer = currentResponse.answer;
    if (typeof userAnswer === 'string' && distractors[userAnswer]) {
      return distractors[userAnswer];
    }
    return null;
  };

  const renderQuestionType = () => {
    const itemType = currentQuestion?.item_type;
    // MC: show green/red highlights immediately when answered (decoupled from rationale toggle).
    // MR and other TEI types: defer feedback until Next is clicked (showRationale),
    // because the student may still be selecting/rearranging answers.
    const isMcType = itemType === 'multiple_choice' || itemType === 'MC';
    const feedbackVisible = isImmediate
      ? isMcType
        ? isAnswered          // MC: instant feedback on click
        : showRationale       // MR/TEI: feedback after Next commits
      : false;

    const props = {
      question: currentQuestion,
      response: currentResponse,
      onAnswer: handleAnswer,
      showFeedback: feedbackVisible,
    };

    switch (itemType) {
      case 'multiple_choice':
      case 'MC':
        return <MultipleChoice {...props} />;
      case 'multiple_response':
      case 'MR':
        return <MultipleResponse {...props} />;
      case 'drag_and_drop':
      case 'DD':
        return <DragAndDrop {...props} />;
      case 'ordered_response':
      case 'BL':
        return <OrderedResponse {...props} />;
      case 'bowtie':
        return <BowTie {...props} />;
      case 'options_box':
      case 'OB':
        return <OptionsBox {...props} />;
      case 'cloze':
      case 'CL':
        return <Cloze {...props} />;
      default:
        return (
          <div className="p-4 text-center text-slate-500">
            <p>Unsupported question type: {currentQuestion?.item_type}</p>
          </div>
        );
    }
  };

  const answeredCount = questions.filter((q) => responses[q.id]?.answer).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const distractorRationale = getDistractorRationale();

  // Determine if the question asks the student to IDENTIFY the rhythm.
  // If so, the rhythm_label must NOT be shown anywhere (alt text, labels, etc.).
  const isRhythmIdentificationQuestion = (() => {
    if (!currentQuestion?.stem) return false;
    const stemLower = currentQuestion.stem.toLowerCase();
    return (
      /\bidentify\b/.test(stemLower) ||
      /\bwhat rhythm\b/.test(stemLower) ||
      /\bwhat is this rhythm\b/.test(stemLower) ||
      /\bname this rhythm\b/.test(stemLower) ||
      /\bwhat is the rhythm\b/.test(stemLower) ||
      /\bwhich rhythm\b/.test(stemLower)
    );
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <h1 className="text-base sm:text-lg font-semibold text-slate-900">
              {isImmediate ? 'Self-Guided Practice' : 'Practice Exam'}
            </h1>
            <div className="h-6 w-px bg-slate-200" />
            <span className="text-sm text-slate-600">
              Q {currentIndex + 1} of {questions.length}
            </span>
            {isImmediate && (
              <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                Immediate Feedback
              </span>
            )}
          </div>
          {showTimer && (
            <ExamTimer
              totalMinutes={timerMinutes}
              onPause={(paused) => setTimerPaused(paused)}
            />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <ExamProgressBar
        questions={questions}
        currentIndex={currentIndex}
        responses={responses}
        flaggedQuestions={flaggedQuestions}
        onNavigate={handleNavigateToQuestion}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion?.id}
                  initial={{
                    opacity: 0,
                    x: direction === 'forward' ? 100 : -100,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{
                    opacity: 0,
                    x: direction === 'forward' ? -100 : 100,
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-6 sm:space-y-8"
                >
                  {/* Clinical Scenario — only show if NOT already embedded in the stem */}
                  {(() => {
                    const scenario = currentQuestion?.clinical_scenario;
                    const stem = currentQuestion?.stem || '';
                    const showScenario = scenario &&
                      !stem.includes(scenario.substring(0, Math.min(50, scenario.length)));
                    return showScenario ? (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border-l-4 border-[#1B4F72] rounded-lg p-4"
                      >
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Clinical Scenario
                        </p>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          {scenario}
                        </p>
                      </motion.div>
                    ) : null;
                  })()}

                  {/* ECG/Image Display with zoom */}
                  {(currentQuestion?.ecg_strip?.image_url ||
                    currentQuestion?.image_url) && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                    >
                      <div
                        className="relative w-full cursor-pointer group"
                        onClick={() => setImageZoom(true)}
                      >
                        <img
                          src={
                            currentQuestion.ecg_strip?.image_url ||
                            currentQuestion.image_url
                          }
                          alt={
                            currentQuestion.ecg_strip
                              ? 'ECG Strip'
                              : 'Clinical Image'
                          }
                          className="w-full h-auto object-contain"
                          loading="eager"
                        />
                        <div className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      {currentQuestion.ecg_strip && (
                        <div className="px-3 py-1 bg-slate-50 border-t border-slate-100">
                          <p className="text-[9px] text-slate-300">
                            PhysioNet &bull; CC BY 4.0
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Image Zoom Modal */}
                  {imageZoom && (
                    <div
                      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                      onClick={() => setImageZoom(false)}
                    >
                      <img
                        src={
                          currentQuestion?.ecg_strip?.image_url ||
                          currentQuestion?.image_url
                        }
                        alt="Zoomed clinical image"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Question Stem — deduplicate if clinical_scenario overlaps */}
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 sm:mb-6 leading-relaxed">
                      {(() => {
                        // Fix common encoding issues (SpO₂, etc.)
                        const fixEncoding = (s: string) =>
                          s.replace(/SpOâ[,.][:;]?/g, 'SpO₂:')
                           .replace(/SpO2/g, 'SpO₂')
                           .replace(/â€[™"]/g, "'")
                           .replace(/â€œ/g, '"')
                           .replace(/â€\u009d/g, '"');
                        const stem = fixEncoding(currentQuestion?.stem || '');
                        const scenario = currentQuestion?.clinical_scenario || '';
                        if (!scenario || !stem) return stem;
                        // If the stem starts with the scenario text, show only the remainder
                        if (stem.startsWith(scenario)) {
                          const remainder = stem.slice(scenario.length).replace(/^\s*/, '');
                          return remainder || stem;
                        }
                        // If they are essentially the same, show a generic prompt
                        if (stem.trim() === scenario.trim()) {
                          return '';
                        }
                        return stem;
                      })()}
                    </h2>
                  </div>

                  {/* Question Type Component */}
                  <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
                    {renderQuestionType()}
                  </div>

                  {/* Immediate Feedback: Correct/Incorrect banner + Rationale */}
                  {isImmediate && isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                      data-testid="immediate-feedback"
                    >
                      {/* Correct / Incorrect banner — always visible once answered */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-lg border-2 ${
                          currentResponse?.is_correct
                            ? 'border-green-300 bg-green-50'
                            : 'border-red-300 bg-red-50'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${
                          currentResponse?.is_correct ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {currentResponse?.is_correct ? 'Correct!' : 'Incorrect'}
                        </p>
                      </motion.div>

                      {/* Why your answer is incorrect — distractor-specific */}
                      {distractorRationale && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 rounded-lg border-2 border-red-200 bg-red-50"
                        >
                          <p className="text-xs font-semibold text-red-700 uppercase mb-1">
                            Why your answer is incorrect
                          </p>
                          <p className="text-sm text-red-800 leading-relaxed">
                            {distractorRationale}
                          </p>
                        </motion.div>
                      )}

                      {/* Explanation toggle + rationale panel */}
                      <button
                        onClick={() => setShowRationale(!showRationale)}
                        className="w-full text-left px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {showRationale ? '\u25BC' : '\u25B6'} Explanation
                        </span>
                      </button>

                      {showRationale && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                        >
                          <QuestionRationale
                            rationale={currentQuestion?.rationale}
                            correctAnswer={currentQuestion?.correct_answer}
                            domain={currentQuestion?.domain_id}
                            difficulty={currentQuestion?.difficulty}
                            cjStep={currentQuestion?.cj_step}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* End mode: collapsible explanation */}
                  {!isImmediate && isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <button
                        onClick={() => setShowRationale(!showRationale)}
                        className="w-full text-left px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {showRationale ? '\u25BC' : '\u25B6'} Explanation
                        </span>
                      </button>

                      {showRationale && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                        >
                          <QuestionRationale
                            rationale={currentQuestion?.rationale}
                            correctAnswer={currentQuestion?.correct_answer}
                            domain={currentQuestion?.domain_id}
                            difficulty={currentQuestion?.difficulty}
                            cjStep={currentQuestion?.cj_step}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="border-t border-slate-200 bg-white p-4 sm:p-6">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-700 font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFlag}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors font-medium text-sm ${
                    flaggedQuestions.has(currentQuestion?.id)
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {flaggedQuestions.has(currentQuestion?.id)
                      ? 'Flagged'
                      : 'Flag'}
                  </span>
                </button>

                {/* Finish Exam button — show when on last question and it's answered, OR all questions answered */}
                {((isLastQuestion && isAnswered) || answeredCount === questions.length) && (
                  <button
                    onClick={handleFinishExam}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-white font-medium text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Finish Exam</span>
                    <span className="sm:hidden">Finish</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleNext}
                disabled={isLastQuestion}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#E67E22] hover:bg-[#D35400] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-medium text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Progress text */}
            <div className="max-w-4xl mx-auto mt-3 text-center">
              <p className="text-xs text-slate-500">
                {answeredCount} of {questions.length} answered
                {isImmediate && (
                  <span className="ml-2">
                    &middot;{' '}
                    {questions.filter((q) => responses[q.id]?.is_correct).length}{' '}
                    correct
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
