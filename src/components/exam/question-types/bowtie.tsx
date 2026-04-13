'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface BowTieItem {
  id: string;
  text: string;
  section: 'causes' | 'interventions' | 'condition';
}

interface Response {
  answer: {
    condition?: string;
    causes?: string[];
    interventions?: string[];
  };
}

interface BowTieProps {
  question: {
    id: string;
    options: BowTieItem[];
    correct_answer: {
      condition?: string;
      causes?: string[];
      interventions?: string[];
    };
  };
  response: Response | undefined;
  onAnswer: (answer: any) => void;
  showFeedback: boolean;
}

export default function BowTie({
  question,
  response,
  onAnswer,
  showFeedback,
}: BowTieProps) {
  const isAnswered = !!response?.answer;
  const [answer, setAnswer] = useState<{
    condition?: string;
    causes?: string[];
    interventions?: string[];
  }>(response?.answer || { causes: [], interventions: [] });

  const causes = question.options.filter((opt) => opt.section === 'causes');
  const interventions = question.options.filter((opt) => opt.section === 'interventions');
  const condition = question.options.find((opt) => opt.section === 'condition');

  const handleCauseToggle = (causeId: string) => {
    if (isAnswered) return;

    const causes = answer.causes || [];
    const newCauses = causes.includes(causeId)
      ? causes.filter((id) => id !== causeId)
      : [...causes, causeId];

    const newAnswer = { ...answer, causes: newCauses };
    setAnswer(newAnswer);
    onAnswer(newAnswer);
  };

  const handleInterventionToggle = (interventionId: string) => {
    if (isAnswered) return;

    const interventions = answer.interventions || [];
    const newInterventions = interventions.includes(interventionId)
      ? interventions.filter((id) => id !== interventionId)
      : [...interventions, interventionId];

    const newAnswer = { ...answer, interventions: newInterventions };
    setAnswer(newAnswer);
    onAnswer(newAnswer);
  };

  const correctCauses = question.correct_answer.causes || [];
  const correctInterventions = question.correct_answer.interventions || [];
  const isCorrect =
    isAnswered &&
    answer.causes?.length === correctCauses.length &&
    answer.interventions?.length === correctInterventions.length &&
    answer.causes?.every((id) => correctCauses.includes(id)) &&
    answer.interventions?.every((id) => correctInterventions.includes(id));

  return (
    <div className="space-y-6">
      {/* Bowtie Visualization */}
      <div className="flex items-center gap-4 py-8">
        {/* Left Side - Causes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 space-y-3"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Causes</h3>
          {causes.map((cause, idx) => {
            const isSelected = answer.causes?.includes(cause.id);
            const isCorrectCause = correctCauses.includes(cause.id);
            const showCorrect = showFeedback && isCorrectCause;
            const showWrong = showFeedback && isSelected && !isCorrectCause;

            return (
              <motion.button
                key={cause.id}
                onClick={() => handleCauseToggle(cause.id)}
                disabled={isAnswered}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                  isSelected
                    ? showWrong
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#E67E22] bg-orange-50'
                    : showCorrect
                      ? 'border-green-300 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 ${
                      isSelected
                        ? showWrong
                          ? 'border-red-300 bg-red-100'
                          : 'border-[#E67E22] bg-[#E67E22]'
                        : showCorrect
                          ? 'border-green-400 bg-green-200'
                          : 'border-slate-300'
                    }`}
                  />
                  <span className="font-medium text-slate-900">{cause.text}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Center - Condition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-shrink-0 text-center px-6"
        >
          <div className="relative w-24 h-24">
            {/* Bowtie shape using SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <path
                d="M 0 30 L 50 50 L 0 70 Z"
                fill="none"
                stroke="#E67E22"
                strokeWidth="2"
              />
              <path
                d="M 100 30 L 50 50 L 100 70 Z"
                fill="none"
                stroke="#E67E22"
                strokeWidth="2"
              />
              <circle cx="50" cy="50" r="8" fill="#E67E22" />
            </svg>
            {condition && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-[#1B4F72] rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white text-center px-1">
                    {condition.text.split('\n')[0]}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Side - Interventions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 space-y-3"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Interventions</h3>
          {interventions.map((intervention, idx) => {
            const isSelected = answer.interventions?.includes(intervention.id);
            const isCorrectIntervention = correctInterventions.includes(intervention.id);
            const showCorrect = showFeedback && isCorrectIntervention;
            const showWrong = showFeedback && isSelected && !isCorrectIntervention;

            return (
              <motion.button
                key={intervention.id}
                onClick={() => handleInterventionToggle(intervention.id)}
                disabled={isAnswered}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                  isSelected
                    ? showWrong
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#E67E22] bg-orange-50'
                    : showCorrect
                      ? 'border-green-300 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 ${
                      isSelected
                        ? showWrong
                          ? 'border-red-300 bg-red-100'
                          : 'border-[#E67E22] bg-[#E67E22]'
                        : showCorrect
                          ? 'border-green-400 bg-green-200'
                          : 'border-slate-300'
                    }`}
                  />
                  <span className="font-medium text-slate-900">{intervention.text}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Feedback */}
      {isAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-2 ${
            isCorrect
              ? 'border-green-300 bg-green-50'
              : 'border-red-300 bg-red-50'
          }`}
        >
          <p className={`text-sm font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect
              ? 'Correct! All causes and interventions identified.'
              : 'Incorrect. Review the causes and interventions.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
