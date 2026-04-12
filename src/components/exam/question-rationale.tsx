'use client';

import { motion } from 'framer-motion';
import { BookOpen, Brain, BarChart3 } from 'lucide-react';

interface QuestionRationaleProps {
  rationale: string;
  correctAnswer: any;
  domain: string;
  difficulty: string;
  cjStep: string;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  easy: { bg: 'bg-green-100', text: 'text-green-700', label: 'Easy' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
  hard: { bg: 'bg-red-100', text: 'text-red-700', label: 'Hard' },
};

const CJ_STEPS: Record<string, string> = {
  recognize: 'Recognize Problem',
  recognize_cues: 'Recognize Cues',
  interpret: 'Interpret Data',
  interpret_data: 'Interpret Data',
  analysis: 'Analyze Data',
  analyze: 'Analyze Data',
  analyze_cues: 'Analyze Cues',
  analyze_data: 'Analyze Data',
  synthesize: 'Synthesize & Apply',
  synthesize_apply: 'Synthesize & Apply',
  evaluate: 'Evaluate & Synthesize',
  evaluate_synthesize: 'Evaluate & Synthesize',
  generate_solutions: 'Generate Solutions',
  take_action: 'Take Action',
  prioritize: 'Prioritize Hypotheses',
  prioritize_hypotheses: 'Prioritize Hypotheses',
};

/**
 * Format a raw cj_step string into a human-readable label.
 * Falls back to title-casing the snake_case string.
 */
function formatCjStep(raw: string): string {
  if (!raw) return '';
  const mapped = CJ_STEPS[raw];
  if (mapped) return mapped;
  // Title-case fallback: analyze_cues -> Analyze Cues
  return raw
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a string looks like a UUID.
 */
function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export default function QuestionRationale({
  rationale,
  domain,
  difficulty,
  cjStep,
}: QuestionRationaleProps) {
  const difficultyInfo = DIFFICULTY_COLORS[difficulty?.toLowerCase()] || DIFFICULTY_COLORS.medium;
  const cjLabel = formatCjStep(cjStep);
  // Only show domain if it's a human-readable name, not a raw UUID
  const showDomain = domain && !isUUID(domain);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 mt-4 bg-white border-2 border-slate-200 rounded-lg p-6"
    >
      {/* Metadata Tags */}
      <div className="flex flex-wrap gap-2">
        {/* Domain — only shown if it's a readable name, not a UUID */}
        {showDomain && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">{domain}</span>
          </motion.div>
        )}

        {/* Difficulty */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${difficultyInfo.bg} ${difficultyInfo.text} border-current`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{difficultyInfo.label}</span>
        </motion.div>

        {/* Clinical Judgment Step — only shown if we have a label */}
        {cjLabel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200"
          >
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">{cjLabel}</span>
          </motion.div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Rationale Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <h3 className="text-sm font-semibold text-slate-900">Explanation</h3>
        <div className="prose prose-sm max-w-none text-slate-700">
          {(!rationale || rationale.length < 20 || rationale.toLowerCase().includes('imported from') || rationale.toLowerCase().includes('pending review') || rationale.toLowerCase().includes('tbd')) ? (
            <p className="leading-relaxed text-slate-500 italic">Detailed rationale coming soon for this question.</p>
          ) : (
            <p className="leading-relaxed whitespace-pre-wrap">{rationale}</p>
          )}
        </div>
      </motion.div>

      {/* Learning Tips — only show if there's a real rationale, not just a placeholder */}
      {rationale && rationale.length >= 20 && !rationale.toLowerCase().includes('imported from') && !rationale.toLowerCase().includes('pending review') && !rationale.toLowerCase().includes('tbd') && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded"
      >
        <p className="text-xs font-semibold text-blue-900 mb-2">Key Takeaway</p>
        <p className="text-sm text-blue-800 leading-relaxed">
          {cjLabel
            ? `This question tests your ability to ${cjLabel.toLowerCase()}. Apply the same reasoning pattern in similar clinical scenarios.`
            : 'Understanding the reasoning behind the correct answer helps with retention and application to real clinical situations.'
          }
        </p>
      </motion.div>
      )}
    </motion.div>
  );
}
