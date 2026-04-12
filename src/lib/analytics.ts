// Analytics data types and computation utilities for Foresight

export interface CJFunctionScore {
  function: string;
  shortName: string;
  pre: number | null;
  post: number | null;
  change: number | null;
}

export interface DomainPerformance {
  domain: string;
  pre: number | null;
  post: number | null;
  change: number | null;
  assessment: string;
}

export interface TEIPerformance {
  type: string;
  label: string;
  pre: number | null;
  post: number | null;
  change: number | null;
  preCorrect?: number;
  preTotal?: number;
  postCorrect?: number;
  postTotal?: number;
}

export interface HeatmapCell {
  domain: string;
  teiType: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface ErrorByCategory {
  name: string;
  value: number;
  color: string;
}

export interface SpecificError {
  questionNumber: number;
  type: string;
  domain: string;
  cjFunction: string;
  errorPattern: string;
}

export interface AnalyticsData {
  cjFunctions: CJFunctionScore[];
  domainPerformance: DomainPerformance[];
  teiPerformance: TEIPerformance[];
  heatmap: HeatmapCell[];
  errorsByDomain: ErrorByCategory[];
  errorsByTEI: ErrorByCategory[];
  specificErrors: SpecificError[];
  overallPre: number | null;
  overallPost: number | null;
  overallChange: number | null;
  readinessScore: number | null;
}

// CJ function names matching NCSBN Clinical Judgment Model
export const CJ_FUNCTIONS = [
  { key: 'recognize_cues', label: 'Recognize Cues', short: 'Recognize' },
  { key: 'analyze_cues', label: 'Analyze Cues', short: 'Analyze' },
  { key: 'prioritize_hypotheses', label: 'Prioritize Hypotheses', short: 'Hypothesize' },
  { key: 'generate_solutions', label: 'Generate Solutions', short: 'Generate' },
  { key: 'take_action', label: 'Take Action', short: 'Act' },
  { key: 'evaluate_outcomes', label: 'Evaluate Outcomes', short: 'Evaluate' },
] as const;

export const TEI_LABELS: Record<string, string> = {
  MC: 'Multiple Choice',
  MR: 'Multiple Response',
  DD: 'Drag & Drop',
  OB: 'Ordered Box',
  BL: 'Bowtie/Linking',
  CJS: 'Clinical Judgment',
};

export const DOMAIN_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
];

export const TEI_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#84cc16',
];

// Assessment label based on score change
export function getAssessmentLabel(pre: number | null, post: number | null): string {
  if (pre === null || post === null) return '--';
  const change = post - pre;
  if (post >= 90) return 'MASTERED';
  if (change >= 20) return 'STRONG GAIN';
  if (change >= 10) return 'IMPROVED';
  if (change < 0 || post < 60) return 'NEXT PRIORITY';
  return 'PROGRESSING';
}

export function getAssessmentColor(label: string): string {
  switch (label) {
    case 'MASTERED': return 'text-emerald-400';
    case 'STRONG GAIN': return 'text-emerald-400';
    case 'IMPROVED': return 'text-blue-400';
    case 'PROGRESSING': return 'text-zinc-600';
    case 'NEXT PRIORITY': return 'text-amber-400';
    default: return 'text-zinc-400';
  }
}

export function getAssessmentBg(label: string): string {
  switch (label) {
    case 'MASTERED': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
    case 'STRONG GAIN': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
    case 'IMPROVED': return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
    case 'PROGRESSING': return 'bg-zinc-100 text-zinc-600 border-zinc-300';
    case 'NEXT PRIORITY': return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
    default: return 'bg-zinc-100 text-zinc-500 border-zinc-300';
  }
}

// Heatmap cell color based on percentage
export function heatmapColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-100 text-emerald-800';
  if (pct >= 60) return 'bg-emerald-50 text-emerald-700';
  if (pct >= 40) return 'bg-amber-50 text-amber-700';
  if (pct >= 20) return 'bg-red-50 text-red-700';
  return 'bg-red-100 text-red-800';
}

export function heatmapBorder(pct: number): string {
  if (pct >= 80) return 'border-emerald-400/30';
  if (pct >= 60) return 'border-emerald-500/20';
  if (pct >= 40) return 'border-amber-400/20';
  return 'border-red-400/20';
}

// Format a change delta with sign
export function formatDelta(change: number | null): string {
  if (change === null) return '--';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

export function deltaColor(change: number | null): string {
  if (change === null) return 'text-zinc-400';
  if (change > 0) return 'text-emerald-400';
  if (change < 0) return 'text-red-400';
  return 'text-zinc-400';
}

// Generate demo data for when no real data exists
export function generateDemoData(): AnalyticsData {
  return {
    cjFunctions: [
      { function: 'Recognize Cues', shortName: 'Recognize', pre: 66.7, post: 62.5, change: -4.2 },
      { function: 'Analyze Cues', shortName: 'Analyze', pre: 72.2, post: 83.3, change: 11.1 },
      { function: 'Prioritize Hypotheses', shortName: 'Hypothesize', pre: 63.6, post: 80.0, change: 16.4 },
      { function: 'Generate Solutions', shortName: 'Generate', pre: 60.0, post: 75.0, change: 15.0 },
      { function: 'Take Action', shortName: 'Act', pre: 60.7, post: 76.7, change: 16.0 },
      { function: 'Evaluate Outcomes', shortName: 'Evaluate', pre: 50.0, post: 87.5, change: 37.5 },
    ],
    domainPerformance: [
      { domain: 'Airway, Resp. & Vent.', pre: 80, post: 100, change: 20, assessment: 'MASTERED' },
      { domain: 'Cardiology & Resus.', pre: 75, post: 80, change: 5, assessment: 'IMPROVED' },
      { domain: 'Medical/OB/GYN', pre: 50, post: 80, change: 30, assessment: 'STRONG GAIN' },
      { domain: 'Trauma', pre: 50, post: 80, change: 30, assessment: 'STRONG GAIN' },
      { domain: 'EMS Operations', pre: 60, post: 80, change: 20, assessment: 'IMPROVED' },
      { domain: 'Clinical Judgment', pre: 68, post: 53, change: -14.3, assessment: 'NEXT PRIORITY' },
    ],
    teiPerformance: [
      { type: 'MC', label: 'Multiple Choice', pre: 74, post: 88, change: 13.5, preCorrect: 57, preTotal: 77, postCorrect: 35, postTotal: 40 },
      { type: 'MR', label: 'Multiple Response', pre: 20, post: 67, change: 46.7, preCorrect: 1, preTotal: 5, postCorrect: 6, postTotal: 9 },
      { type: 'DD', label: 'Drag & Drop', pre: 38, post: 89, change: 51.4, preCorrect: 3, preTotal: 8, postCorrect: 8, postTotal: 9 },
      { type: 'OB', label: 'Ordered Box', pre: 20, post: 33, change: 13.3, preCorrect: 2, preTotal: 10, postCorrect: 3, postTotal: 9 },
    ],
    heatmap: [
      { domain: 'Airway, Resp. & Ve.', teiType: 'MC', correct: 6, total: 6, percentage: 100 },
      { domain: 'Airway, Resp. & Ve.', teiType: 'MR', correct: 1, total: 1, percentage: 100 },
      { domain: 'Airway, Resp. & Ve.', teiType: 'DD', correct: 1, total: 1, percentage: 100 },
      { domain: 'Airway, Resp. & Ve.', teiType: 'OB', correct: 2, total: 2, percentage: 100 },
      { domain: 'Cardiology & Resus.', teiType: 'MC', correct: 7, total: 7, percentage: 100 },
      { domain: 'Cardiology & Resus.', teiType: 'MR', correct: 0, total: 1, percentage: 0 },
      { domain: 'Cardiology & Resus.', teiType: 'DD', correct: 1, total: 1, percentage: 100 },
      { domain: 'Cardiology & Resus.', teiType: 'OB', correct: 0, total: 1, percentage: 0 },
      { domain: 'Clinical Judgment', teiType: 'MC', correct: 4, total: 6, percentage: 67 },
      { domain: 'Clinical Judgment', teiType: 'MR', correct: 1, total: 3, percentage: 33 },
      { domain: 'Clinical Judgment', teiType: 'DD', correct: 3, total: 3, percentage: 100 },
      { domain: 'Clinical Judgment', teiType: 'OB', correct: 0, total: 3, percentage: 0 },
      { domain: 'EMS Operations', teiType: 'MC', correct: 4, total: 5, percentage: 80 },
      { domain: 'EMS Operations', teiType: 'MR', correct: 1, total: 1, percentage: 100 },
      { domain: 'EMS Operations', teiType: 'DD', correct: 1, total: 1, percentage: 100 },
      { domain: 'EMS Operations', teiType: 'OB', correct: 2, total: 3, percentage: 67 },
      { domain: 'Trauma', teiType: 'MC', correct: 4, total: 5, percentage: 80 },
      { domain: 'Trauma', teiType: 'MR', correct: 2, total: 2, percentage: 100 },
      { domain: 'Trauma', teiType: 'DD', correct: 1, total: 1, percentage: 100 },
      { domain: 'Trauma', teiType: 'OB', correct: 1, total: 2, percentage: 50 },
      { domain: 'Medical/OB/GYN', teiType: 'MC', correct: 7, total: 7, percentage: 100 },
      { domain: 'Medical/OB/GYN', teiType: 'MR', correct: 2, total: 2, percentage: 100 },
      { domain: 'Medical/OB/GYN', teiType: 'DD', correct: 3, total: 3, percentage: 100 },
      { domain: 'Medical/OB/GYN', teiType: 'OB', correct: 0, total: 3, percentage: 0 },
    ],
    errorsByDomain: [
      { name: 'Clinical Judgment', value: 44, color: '#3b82f6' },
      { name: 'Medical/OB/GYN', value: 19, color: '#10b981' },
      { name: 'Cardiology', value: 12, color: '#f59e0b' },
      { name: 'EMS Operations', value: 12, color: '#ef4444' },
      { name: 'Trauma', value: 12, color: '#8b5cf6' },
    ],
    errorsByTEI: [
      { name: 'OB', value: 38, color: '#f97316' },
      { name: 'MC', value: 31, color: '#6366f1' },
      { name: 'MR', value: 25, color: '#ec4899' },
      { name: 'DD', value: 6, color: '#14b8a6' },
    ],
    specificErrors: [
      { questionNumber: 6, type: 'OB', domain: 'Medical/OB/GYN', cjFunction: 'Take Action', errorPattern: 'OB sequence — nuchal cord management steps swapped' },
      { questionNumber: 13, type: 'OB', domain: 'Medical/OB/GYN', cjFunction: 'Take Action', errorPattern: 'OB sequence — eclampsia management priority wrong' },
      { questionNumber: 20, type: 'DD', domain: 'Trauma', cjFunction: 'Recognize Cues', errorPattern: 'START triage: classified RR 34 as Red instead of Yellow' },
      { questionNumber: 22, type: 'MC', domain: 'Trauma', cjFunction: 'Take Action', errorPattern: 'Selected D instead of A — trauma intervention priority' },
      { questionNumber: 23, type: 'MC', domain: 'Trauma', cjFunction: 'Take Action', errorPattern: 'Selected C instead of B — spinal motion restriction' },
      { questionNumber: 29, type: 'OB', domain: 'EMS Ops', cjFunction: 'Take Action', errorPattern: 'OB sequence — ICS establishment order swapped 2 steps' },
      { questionNumber: 31, type: 'MC', domain: 'EMS Ops', cjFunction: 'Take Action', errorPattern: 'Selected C instead of B — hazmat decon priority' },
      { questionNumber: 39, type: 'OB', domain: 'Clin. Judgment', cjFunction: 'Take Action', errorPattern: 'OB sequence — assessment steps swapped' },
      { questionNumber: 43, type: 'MR', domain: 'Clin. Judgment', cjFunction: 'Gen. Solutions', errorPattern: 'Over-selected: chose 3 options, only 2 correct' },
      { questionNumber: 45, type: 'MC', domain: 'Clin. Judgment', cjFunction: 'Define Hypo.', errorPattern: 'Selected C instead of B — differential diagnosis' },
      { questionNumber: 46, type: 'OB', domain: 'Clin. Judgment', cjFunction: 'Take Action', errorPattern: 'OB sequence — intervention priority swapped' },
      { questionNumber: 47, type: 'MC', domain: 'Clin. Judgment', cjFunction: 'Eval. Outcomes', errorPattern: 'Selected D instead of B — reassessment finding' },
      { questionNumber: 48, type: 'MR', domain: 'Clin. Judgment', cjFunction: 'Recognize Cues', errorPattern: 'Missed 1 option, selected 1 wrong — cue identification' },
      { questionNumber: 50, type: 'DD', domain: 'Clin. Judgment', cjFunction: 'Recognize Cues', errorPattern: 'Hip fracture classified Priority 1 instead of 2' },
      { questionNumber: 52, type: 'MR', domain: 'Cardiology', cjFunction: 'Take Action', errorPattern: 'Selected 3 of 4 correct — missed one intervention' },
      { questionNumber: 55, type: 'OB', domain: 'Cardiology', cjFunction: 'Take Action', errorPattern: 'OB sequence — cardiac arrest algorithm order wrong' },
    ],
    overallPre: 63.0,
    overallPost: 77.1,
    overallChange: 14.1,
    readinessScore: 980,
  };
}
