'use client';

import { useState } from 'react';
import {
  Sparkles,
  Loader2,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

      // Send questions directly to the main list and close
      onAcceptQuestions(questions);
      onClose();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generation timed out — try fewer questions.');
      } else {
        setError(err.message || 'Failed to generate questions');
      }
    } finally {
      clearTimeout(timeout);
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            AI Question Writer
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Set the count for each question type and generate. Questions go directly into your assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Question counts by type */}
          <div className="space-y-1.5">
            {itemCounts.map((item) => (
              <div key={item.type} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-50 border border-zinc-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-zinc-700 w-6">{item.type}</span>
                  <span className="text-xs text-zinc-500">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateCount(item.type, -1)}
                    disabled={item.count === 0}
                    className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-semibold text-zinc-900 w-6 text-center tabular-nums">
                    {item.count}
                  </span>
                  <button
                    onClick={() => updateCount(item.type, 1)}
                    disabled={item.count >= 20}
                    className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            {totalCount > 0 && (
              <p className="text-xs text-zinc-500 text-right">{totalCount} question{totalCount !== 1 ? 's' : ''} total</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 font-medium">Domain</label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger className="h-9 text-sm">
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
              <label className="text-xs text-zinc-500 font-medium">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-9 text-sm">
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
            <label className="text-xs text-zinc-500 font-medium">Topic Focus (optional)</label>
            <Textarea
              value={topicHint}
              onChange={(e) => setTopicHint(e.target.value)}
              placeholder="e.g., STEMI management, 12-lead interpretation, START triage..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating} className="text-zinc-600">
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || totalCount === 0}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate {totalCount} Question{totalCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
