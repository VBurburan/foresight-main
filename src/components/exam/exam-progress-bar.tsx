'use client';

import { motion } from 'framer-motion';

interface Question {
  id: string;
}

interface Response {
  answer: any;
  is_flagged: boolean;
}

interface ExamProgressBarProps {
  questions: Question[];
  currentIndex: number;
  responses: Record<string, Response>;
  flaggedQuestions: Set<string>;
  onNavigate: (index: number) => void;
}

export default function ExamProgressBar({
  questions,
  currentIndex,
  responses,
  flaggedQuestions,
  onNavigate,
}: ExamProgressBarProps) {
  const getQuestionStatus = (questionId: string, index: number) => {
    if (index === currentIndex) return 'current';
    if (flaggedQuestions.has(questionId)) return 'flagged';
    if (responses[questionId]?.answer) return 'answered';
    return 'unseen';
  };

  return (
    <div className="border-b border-slate-200 bg-white overflow-x-auto">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2">
          {questions.map((question, index) => {
            const status = getQuestionStatus(question.id, index);

            return (
              <motion.button
                key={question.id}
                onClick={() => onNavigate(index)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`flex-shrink-0 w-10 h-10 rounded-lg font-semibold text-xs transition-all hover:shadow-md ${
                  status === 'current'
                    ? 'bg-[#E67E22] text-white ring-2 ring-[#E67E22] ring-offset-2'
                    : status === 'flagged'
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                      : status === 'answered'
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-slate-100 text-slate-600 border-2 border-slate-200'
                }`}
                title={`Question ${index + 1} - ${status}`}
              >
                {index + 1}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 flex flex-wrap gap-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 border-2 border-slate-200" />
            <span className="text-slate-600">Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-100 border-2 border-green-300" />
            <span className="text-slate-600">Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-yellow-100 border-2 border-yellow-300" />
            <span className="text-slate-600">Flagged</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#E67E22]" />
            <span className="text-slate-600">Current</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
