'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface ClozeBlank {
  id: string;
  options: string[];
  correctAnswer: string;
}

interface ClozeProps {
  question: {
    id: string;
    options: any;
    correct_answer: Record<string, string>;
    raw_options?: any;
  };
  response: { answer: Record<string, string> } | undefined;
  onAnswer: (answer: Record<string, string>) => void;
  showFeedback: boolean;
}

/**
 * Parse the stem text and raw options to extract blanks.
 * Expected raw_options format:
 *   { blanks: [{ id: "blank1", options: ["opt1","opt2","opt3"] }] }
 * Or simpler:
 *   { "blank1": ["opt1","opt2","opt3"], "blank2": ["opt1","opt2"] }
 */
function parseBlanks(rawOptions: any, correctAnswer: Record<string, string>): ClozeBlank[] {
  if (!rawOptions) return [];

  // Format: { blanks: [{id, options}] }
  if (rawOptions.blanks && Array.isArray(rawOptions.blanks)) {
    return rawOptions.blanks.map((b: any) => ({
      id: b.id,
      options: b.options || [],
      correctAnswer: correctAnswer[b.id] || '',
    }));
  }

  // Format: { "blank1": ["opt1","opt2"], "blank2": ["opt1","opt2"] }
  return Object.entries(rawOptions)
    .filter(([, val]) => Array.isArray(val))
    .map(([key, val]) => ({
      id: key,
      options: val as string[],
      correctAnswer: correctAnswer[key] || '',
    }));
}

export default function Cloze({
  question,
  response,
  onAnswer,
  showFeedback,
}: ClozeProps) {
  const rawOptions = question.raw_options || question.options;
  const correctAnswer = question.correct_answer || {};
  const blanks = parseBlanks(rawOptions, correctAnswer);

  const [selections, setSelections] = useState<Record<string, string>>(
    response?.answer || {}
  );
  const isAnswered =
    !!response?.answer &&
    blanks.length > 0 &&
    blanks.every((b) => response.answer[b.id] != null && response.answer[b.id] !== '');

  const handleSelect = (blankId: string, value: string) => {
    if (isAnswered) return;

    const newSelections = { ...selections, [blankId]: value };
    setSelections(newSelections);

    // Auto-submit when all blanks filled
    if (blanks.every((b) => newSelections[b.id] != null && newSelections[b.id] !== '')) {
      onAnswer(newSelections);
    }
  };

  const isAllCorrect =
    isAnswered &&
    blanks.every(
      (b) =>
        selections[b.id]?.trim().toLowerCase() ===
        correctAnswer[b.id]?.trim().toLowerCase()
    );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm font-medium text-blue-900">
          Fill in each blank with the correct option
        </p>
      </div>

      <div className="space-y-4">
        {blanks.map((blank, index) => {
          const userVal = selections[blank.id];
          const isCorrectBlank =
            showFeedback &&
            userVal?.trim().toLowerCase() ===
              blank.correctAnswer.trim().toLowerCase();
          const isWrong = showFeedback && userVal && !isCorrectBlank;

          return (
            <motion.div
              key={blank.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                isCorrectBlank
                  ? 'border-green-300 bg-green-50'
                  : isWrong
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white'
              }`}
            >
              <span className="text-sm font-semibold text-slate-500 w-16 flex-shrink-0">
                Blank {index + 1}
              </span>

              <select
                value={userVal || ''}
                onChange={(e) => handleSelect(blank.id, e.target.value)}
                disabled={isAnswered}
                className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  isCorrectBlank
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : isWrong
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : userVal
                        ? 'border-[#E67E22] bg-orange-50 text-slate-900'
                        : 'border-slate-200 text-slate-600'
                } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <option value="">Select...</option>
                {blank.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {showFeedback && (
                <div className="flex-shrink-0">
                  {isCorrectBlank ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-5 h-5 text-green-500" />
                    </motion.div>
                  ) : isWrong ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </motion.div>
                  ) : null}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Show correct answers when wrong */}
      {showFeedback && !isAllCorrect && isAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border-2 border-green-200 bg-green-50"
        >
          <p className="text-sm font-semibold text-green-800 mb-2">
            Correct Answers:
          </p>
          {blanks.map((blank, i) => (
            <p key={blank.id} className="text-sm text-green-700">
              Blank {i + 1}: <strong>{blank.correctAnswer}</strong>
            </p>
          ))}
        </motion.div>
      )}

      {isAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-2 ${
            isAllCorrect
              ? 'border-green-300 bg-green-50'
              : 'border-red-300 bg-red-50'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              isAllCorrect ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {isAllCorrect
              ? 'Correct! All blanks filled correctly.'
              : 'Incorrect. Check the highlighted blanks.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
