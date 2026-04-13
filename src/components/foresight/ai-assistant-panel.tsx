'use client';

import { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GeneratedQuestion {
  item_type: string;
  stem: string;
  options: any;
  correct_answer: any;
  rationale: string;
  domain: string;
  cj_functions: string[];
  difficulty: string;
}

interface ItemTypeCount {
  type: string;
  label: string;
  count: number;
}

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  certLevel: string;
  onAcceptQuestions: (questions: GeneratedQuestion[]) => void;
}

const ITEM_TYPES: { type: string; label: string }[] = [
  { type: 'MC', label: 'Multiple Choice' },
  { type: 'MR', label: 'Multi-Response' },
  { type: 'DD', label: 'Drag & Drop' },
  { type: 'OB', label: 'Ordered Box' },
  { type: 'BL', label: 'Build List' },
];

export function AIAssistantPanel({
  open,
  onClose,
  certLevel,
  onAcceptQuestions,
}: AIAssistantPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  // Multi-type question counts
  const [itemCounts, setItemCounts] = useState<ItemTypeCount[]>(
    ITEM_TYPES.map((t) => ({ ...t, count: t.type === 'MC' ? 3 : 0 }))
  );
  const [domain, setDomain] = useState('any');
  const [difficulty, setDifficulty] = useState('medium');
  const [topicHint, setTopicHint] = useState('');
  const [error, setError] = useState('');

  const totalCount = itemCounts.reduce((sum, t) => sum + t.count, 0);

  const updateCount = (type: string, delta: number) => {
    setItemCounts((prev) =>
      prev.map((t) =>
        t.type === type ? { ...t, count: Math.max(0, Math.min(20, t.count + delta)) } : t
      )
    );
  };

  const handleGenerate = async () => {
    if (totalCount === 0) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    setGenerating(true);
    setError('');
    setGenerated([]);
    setAccepted(new Set());

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuration error — please reload the page');
      }

      const items = itemCounts
        .filter((t) => t.count > 0)
        .map((t) => ({ type: t.type, count: t.count }));

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-questions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          items,
          count: totalCount,
          certification_level: certLevel,
          item_type: items.length === 1 ? items[0].type : 'MC',
          domain: domain === 'any' ? undefined : domain,
          difficulty,
          topic_hint: topicHint || undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let msg = `Generation failed (${response.status})`;
        try { msg = JSON.parse(text).error || msg; } catch { /* use default */ }
        throw new Error(msg);
      }

      const result = await response.json();
      const questions = Array.isArray(result?.questions) ? result.questions : [];

      if (questions.length === 0) {
        throw new Error('No questions generated — try adjusting your settings');
      }

      setGenerated(questions);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generation timed out — try fewer questions or a simpler topic.');
      } else {
        setError(err.message || 'Failed to generate questions');
      }
    } finally {
      clearTimeout(timeout);
      setGenerating(false);
    }
  };

  const toggleAccept = (idx: number) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAcceptSelected = () => {
    const selected = generated.filter((_, i) => accepted.has(i));
    if (selected.length > 0) {
      onAcceptQuestions(selected);
      setGenerated([]);
      setAccepted(new Set());
    }
  };

  const handleAcceptAll = () => {
    onAcceptQuestions(generated);
    setGenerated([]);
    setAccepted(new Set());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-lg bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-elevation-3">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">AI Question Writer</h2>
              <p className="text-xs text-zinc-500">Generate NREMT-style questions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Config */}
        <div className="px-5 py-4 space-y-4 border-b border-zinc-800 overflow-y-auto max-h-[45vh]">
          {/* Question counts by type */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Questions by Type</label>
            <div className="space-y-1.5">
              {itemCounts.map((item) => (
                <div key={item.type} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-zinc-300 w-6">{item.type}</span>
                    <span className="text-xs text-zinc-500">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCount(item.type, -1)}
                      disabled={item.count === 0}
                      className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold text-zinc-200 w-6 text-center tabular-nums">
                      {item.count}
                    </span>
                    <button
                      onClick={() => updateCount(item.type, 1)}
                      disabled={item.count >= 20}
                      className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalCount > 0 && (
              <p className="text-xs text-zinc-400 text-right">{totalCount} question{totalCount !== 1 ? 's' : ''} total</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Domain</label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger className="h-9 text-sm bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Any domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Domain</SelectItem>
                  <SelectItem value="Airway, Respiration & Ventilation">Airway, Resp & Vent</SelectItem>
                  <SelectItem value="Cardiology & Resuscitation">Cardiology & Resus</SelectItem>
                  <SelectItem value="Medical/OB/GYN">Medical/OB/GYN</SelectItem>
                  <SelectItem value="Trauma">Trauma</SelectItem>
                  <SelectItem value="EMS Operations">EMS Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-9 text-sm bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Topic Focus (optional)</label>
            <Textarea
              value={topicHint}
              onChange={(e) => setTopicHint(e.target.value)}
              placeholder="e.g., STEMI management, 12-lead interpretation, START triage..."
              rows={2}
              className="bg-zinc-950 border-zinc-800 text-sm resize-none text-zinc-200 placeholder:text-zinc-600"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || totalCount === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10 font-medium"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating {totalCount} questions...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate {totalCount} Question{totalCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>

          {error && (
            <div className="rounded-lg bg-red-950/50 border border-red-800 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Generated Questions */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {generating && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-sm text-zinc-300">Generating questions...</p>
              <p className="text-xs text-zinc-500 mt-1">This may take a moment</p>
            </div>
          )}

          {!generating && generated.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5 text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-400">Set question counts above and generate</p>
            </div>
          )}

          {generated.map((q, idx) => (
            <div
              key={idx}
              className={`rounded-lg border transition-all ${
                accepted.has(idx)
                  ? 'bg-emerald-950/20 border-emerald-800/50'
                  : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  onClick={() => toggleAccept(idx)}
                  className={`flex-shrink-0 w-5 h-5 rounded border transition-colors ${
                    accepted.has(idx)
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-zinc-600 hover:border-zinc-400'
                  } flex items-center justify-center`}
                >
                  {accepted.has(idx) && <Check className="h-3 w-3" />}
                </button>
                <span className="text-xs font-mono text-zinc-500 flex-shrink-0">Q{idx + 1}</span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 flex-shrink-0 border border-zinc-700">
                  {q.item_type}
                </span>
                <span className="text-sm text-zinc-200 truncate flex-1">{q.stem?.slice(0, 80)}...</span>
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="flex-shrink-0 p-1 rounded hover:bg-zinc-700/50 text-zinc-400"
                >
                  {expandedIdx === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {expandedIdx === idx && (
                <div className="px-3 pb-3 pt-1 border-t border-zinc-700/30 space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">Stem</p>
                    <p className="text-sm text-zinc-200 leading-relaxed">{q.stem}</p>
                  </div>
                  {q.options && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">Options</p>
                      <pre className="text-xs text-zinc-400 bg-zinc-900 rounded p-2 overflow-x-auto border border-zinc-800">
                        {JSON.stringify(q.options, null, 2)}
                      </pre>
                    </div>
                  )}
                  {q.rationale && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">Rationale</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{q.rationale}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {q.domain && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {q.domain}
                      </span>
                    )}
                    {q.difficulty && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {q.difficulty}
                      </span>
                    )}
                    {(q.cj_functions || []).map((fn: string) => (
                      <span key={fn} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {fn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        {generated.length > 0 && (
          <div className="px-5 py-4 border-t border-zinc-800 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
              className="text-zinc-300 border-zinc-700 hover:bg-zinc-800"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Regenerate
            </Button>
            <div className="flex-1" />
            {accepted.size > 0 && (
              <Button
                size="sm"
                onClick={handleAcceptSelected}
                className="bg-emerald-700 hover:bg-emerald-600 text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add {accepted.size} Selected
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="bg-zinc-100 hover:bg-white text-zinc-900"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add All {generated.length}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
