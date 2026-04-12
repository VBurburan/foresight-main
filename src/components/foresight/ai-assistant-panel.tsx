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

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  certLevel: string;
  onAcceptQuestions: (questions: GeneratedQuestion[]) => void;
}

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

  // Config state
  const [count, setCount] = useState('5');
  const [itemType, setItemType] = useState('MC');
  const [domain, setDomain] = useState('any');
  const [difficulty, setDifficulty] = useState('medium');
  const [topicHint, setTopicHint] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setGenerated([]);
    setAccepted(new Set());

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          count: parseInt(count) || 5,
          certification_level: certLevel,
          item_type: itemType,
          domain: domain === 'any' ? undefined : domain,
          difficulty,
          topic_hint: topicHint || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }

      const result = await response.json();
      setGenerated(result.questions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions');
    }
    setGenerating(false);
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
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">AI Question Writer</h2>
              <p className="text-xs text-zinc-500">Generate NREMT-style questions with AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Config */}
        <div className="px-5 py-4 space-y-3 border-b border-zinc-800">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Count</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="bg-zinc-950 border-zinc-800 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Item Type</label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger className="h-9 text-sm bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MC">MC</SelectItem>
                  <SelectItem value="MR">MR (SATA)</SelectItem>
                  <SelectItem value="DD">DD</SelectItem>
                  <SelectItem value="OB">OB</SelectItem>
                  <SelectItem value="BL">BL</SelectItem>
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
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Domain (optional)</label>
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
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Topic Focus (optional)</label>
            <Textarea
              value={topicHint}
              onChange={(e) => setTopicHint(e.target.value)}
              placeholder="e.g., STEMI management, 12-lead interpretation, START triage..."
              rows={2}
              className="bg-zinc-950 border-zinc-800 text-sm resize-none"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white h-10 font-medium shadow-elevation-1"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating {count} questions...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate {count} Questions
              </>
            )}
          </Button>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Generated Questions */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {generating && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
              </div>
              <p className="text-sm text-zinc-300 font-medium">Generating questions...</p>
              <p className="text-xs text-zinc-500 mt-1">Using RAG context + item writing rules</p>
            </div>
          )}

          {!generating && generated.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-400">Configure settings above and generate</p>
              <p className="text-xs text-zinc-500 mt-1">AI uses your curriculum&apos;s RAG knowledge base</p>
            </div>
          )}

          {generated.map((q, idx) => (
            <div
              key={idx}
              className={`rounded-lg border transition-all ${
                accepted.has(idx)
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
              }`}
            >
              {/* Question header */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  onClick={() => toggleAccept(idx)}
                  className={`flex-shrink-0 w-5 h-5 rounded border transition-colors ${
                    accepted.has(idx)
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : 'border-zinc-600 hover:border-zinc-400'
                  } flex items-center justify-center`}
                >
                  {accepted.has(idx) && <Check className="h-3 w-3" />}
                </button>
                <span className="text-xs font-mono text-zinc-500 flex-shrink-0">Q{idx + 1}</span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 flex-shrink-0 border border-zinc-700">
                  {q.item_type}
                </span>
                <span className="text-sm text-zinc-200 truncate flex-1">{q.stem.slice(0, 80)}...</span>
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="flex-shrink-0 p-1 rounded hover:bg-zinc-700/50 text-zinc-400"
                >
                  {expandedIdx === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Expanded detail */}
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {q.domain}
                      </span>
                    )}
                    {q.difficulty && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {q.difficulty}
                      </span>
                    )}
                    {(q.cj_functions || []).map((fn: string) => (
                      <span key={fn} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
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
              className="text-zinc-300 border-zinc-700"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Regenerate
            </Button>
            <div className="flex-1" />
            {accepted.size > 0 && (
              <Button
                size="sm"
                onClick={handleAcceptSelected}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add {accepted.size} Selected
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="bg-blue-600 hover:bg-blue-500 text-white"
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
