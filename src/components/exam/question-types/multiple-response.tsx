'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface Option {
  id: string;
  text: string;
}

interface Response {
  answer: string[];
}

interface MultipleResponseProps {
  question: {
    id: string;
    options: Option[];
    correct_answer: { answers: string[] };
  };
  response: Response | undefined;
  onAnswer: (answers: string[]) => void;
  showFeedback: boolean;
}

export default function MultipleResponse({
  question,
  response,
  onAnswer,
  showFeedback,
}: MultipleResponseProps) {
  // Track whether the student has finalized (feedback is showing)
  const isFinalized = showFeedback && !!response?.answer && response.answer.length > 0;
  const [localSelections, setLocalSelections] = useState<Set<string>>(
    new Set(response?.answer || [])
  );

  // Reset local selections when question changes
  useEffect(() => {
    setLocalSelections(new Set(response?.answer || []));
  }, [question.id, response?.answer]);

  const selectedIds = isFinalized ? new Set(response?.answer || []) : localSelections;
  const correctIds = new Set(question.correct_answer.answers);

  const handleToggle = (optionId: string) => {
    if (isFinalized) return;

    const next = new Set(localSelections);
    if (next.has(optionId)) {
      next.delete(optionId);
    } else {
      next.add(optionId);
    }
    setLocalSelections(next);
    // Report selections to parent so Next button can commit them
    onAnswer(Array.from(next));
  };

  const allCorrect =
    isFinalized &&
    selectedIds.size === correctIds.size &&
    Array.from(selectedIds).every((id) => correctIds.has(id));

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm font-medium text-blue-900">
          Select all that apply
          {!isFinalized && localSelections.size > 0 && (
            <span className="ml-2 text-blue-600">
              ({localSelections.size} selected)
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {question.options.map((option: Option, index: number) => {
          const isSelected = selectedIds.has(option.id);
          const isLocalSelected = localSelections.has(option.id);
          const isCorrectOption = correctIds.has(option.id);
          const showCorrectFeedback = isFinalized && isCorrectOption;
          const showWrongFeedback = isFinalized && isSelected && !isCorrectOption;
          const showMissedFeedback = isFinalized && !isSelected && isCorrectOption;

          return (
            <motion.button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              disabled={isFinalized}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                isFinalized
                  ? showWrongFeedback
                    ? 'border-red-300 bg-red-50 cursor-default'
                    : showMissedFeedback
                      ? 'border-yellow-300 bg-yellow-50 cursor-default'
                      : showCorrectFeedback
                        ? 'border-green-300 bg-green-50 cursor-default'
                        : isSelected
                          ? 'border-green-300 bg-green-50 cursor-default'
                          : 'border-slate-200 bg-white cursor-default'
                  : isLocalSelected
                    ? 'border-[#E67E22] bg-orange-50 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 cursor-pointer'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                  isFinalized
                    ? showWrongFeedback
                      ? 'bg-red-200 border-red-300'
                      : showMissedFeedback
                        ? 'bg-yellow-100 border-yellow-300'
                        : (isSelected || showCorrectFeedback)
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300'
                    : isLocalSelected
                      ? 'bg-[#E67E22] border-[#E67E22]'
                      : 'border-slate-300'
                }`}
              >
                {(isLocalSelected || isSelected || showMissedFeedback) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Option Text */}
              <div className="flex-1 pt-0.5">
                <p className="text-slate-900 font-medium">{option.text}</p>
              </div>

              {/* Feedback Icon */}
              {isFinalized && (
                <div className="flex-shrink-0 pt-0.5">
                  {showWrongFeedback && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <X className="w-5 h-5 text-red-500" />
                    </motion.div>
                  )}
                  {showMissedFeedback && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <X className="w-5 h-5 text-yellow-600" />
                    </motion.div>
                  )}
                  {showCorrectFeedback && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Hint to click Next */}
      {!isFinalized && localSelections.size > 0 && (
        <p className="text-sm text-slate-500 text-center">
          Click Next when you&apos;ve selected all your answers
        </p>
      )}

      {isFinalized && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-2 ${
            allCorrect
              ? 'border-green-300 bg-green-50'
              : 'border-red-300 bg-red-50'
          }`}
        >
          <p className={`text-sm font-medium ${allCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {allCorrect ? 'Correct! All options selected.' : 'Incorrect. Check the highlighted options above.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
