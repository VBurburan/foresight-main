'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface Option {
  id: string;
  text: string;
}

interface Response {
  answer: string;
}

interface MultipleChoiceProps {
  question: {
    id: string;
    options: Option[];
    correct_answer: { answer: string };
  };
  response: Response | undefined;
  onAnswer: (answer: string) => void;
  showFeedback: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function MultipleChoice({
  question,
  response,
  onAnswer,
  showFeedback,
}: MultipleChoiceProps) {
  const isAnswered = !!response?.answer;
  const selectedId = response?.answer;
  const correctAnswerId = question.correct_answer.answer;
  const isCorrect = selectedId === correctAnswerId;

  return (
    <div className="space-y-3">
      {question.options.map((option: Option, index: number) => {
        const isSelected = selectedId === option.id;
        const isCorrectOption = option.id === correctAnswerId;
        const showCorrectFeedback = showFeedback && isCorrectOption;
        const showWrongFeedback = showFeedback && isSelected && !isCorrect;

        return (
          <motion.button
            key={option.id}
            onClick={() => !isAnswered && onAnswer(option.id)}
            disabled={isAnswered}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
              isSelected
                ? showWrongFeedback
                  ? 'border-red-300 bg-red-50'
                  : 'border-[#E67E22] bg-orange-50'
                : showCorrectFeedback
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
            } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {/* Letter Badge */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                isSelected
                  ? showWrongFeedback
                    ? 'bg-red-200 text-red-700'
                    : 'bg-[#E67E22] text-white'
                  : showCorrectFeedback
                    ? 'bg-green-200 text-green-700'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {LETTERS[index]}
            </div>

            {/* Option Text */}
            <div className="flex-1 pt-0.5">
              <p className="text-slate-900 font-medium">{option.text}</p>
            </div>

            {/* Feedback Icon */}
            {isAnswered && (
              <div className="flex-shrink-0 pt-0.5">
                {showWrongFeedback && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </motion.div>
                )}
                {showCorrectFeedback && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-5 h-5 text-green-500" />
                  </motion.div>
                )}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
