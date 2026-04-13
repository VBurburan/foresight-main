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

const CHUNK_SIZE = 10;

// Tier-based generation limits (per batch request)
const TIERS = {
  standard: { label: 'Standard', maxTotal: 10, maxPerType: 10 },
  professional: { label: 'Professional', maxTotal: 50, maxPerType: 50 },
  enterprise: { label: 'Enterprise', maxTotal: 150, maxPerType: 150 },
} as const;

// TODO: Read from instructor's subscription tier. Default to professional for now.
const CURRENT_TIER: keyof typeof TIERS = 'professional';

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
  const [aiModel, setAiModel] = useState('gpt-4.1');
  const [topicHint, setTopicHint] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const tier = TIERS[CURRENT_TIER];
  const totalCount = itemCounts.reduce((sum, t) => sum + t.count, 0);

  const updateCount = (type: string, delta: number) => {
    setItemCounts((prev) => {
      const currentTotal = prev.reduce((s, t) => s + t.count, 0);
      return prev.map((t) => {
        if (t.type !== type) return t;
        let newCount = t.count + delta;
        newCount = Math.max(0, Math.min(tier.maxPerType, newCount));
        // Enforce total tier limit
        if (delta > 0 && currentTotal >= tier.maxTotal) return t;
        if (delta > 0 && newCount - t.count + currentTotal > tier.maxTotal) {
          newCount = t.count + (tier.maxTotal - currentTotal);
        }
        return { ...t, count: newCount };
      });
    });
  };

  // Generate a single chunk
  async function generateChunk(
    items: { type: string; count: number }[],
    chunkTotal: number,
    signal: AbortSignal
  ): Promise<GeneratedQuestion[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-questions`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        items,
        count: chunkTotal,
        certification_level: certLevel,
        item_type: items.length === 1 ? items[0].type : 'MC',
        domain: domain === 'any' ? undefined : domain,
        difficulty,
        topic_hint: topicHint || undefined,
        model: aiModel,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let msg = `Generation failed (${response.status})`;
      try { msg = JSON.parse(text).error || msg; } catch {}
      throw new Error(msg);
    }

    const result = await response.json();
    return Array.isArray(result?.questions) ? result.questions : [];
  }

  const handleGenerate = async () => {
    if (totalCount === 0) return;
    const controller = new AbortController();

    setGenerating(true);
    setError('');
    setProgress('');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) throw new Error('Configuration error — please reload');

      const items = itemCounts.filter((t) => t.count > 0).map((t) => ({ type: t.type, count: t.count }));

      if (totalCount <= CHUNK_SIZE) {
        // Small request — single call
        setProgress('Generating questions...');
        const questions = await generateChunk(items, totalCount, controller.signal);
        if (questions.length === 0) throw new Error('No questions generated');
        onAcceptQuestions(questions);
        onClose();
      } else {
        // Large request — chunked sequential calls
        const allQuestions: GeneratedQuestion[] = [];
        const chunks: { type: string; count: number }[][] = [];

        // Split items into chunks of CHUNK_SIZE
        let remaining = items.map((i) => ({ ...i }));
        while (remaining.some((r) => r.count > 0)) {
          const chunk: { type: string; count: number }[] = [];
          let chunkLeft = CHUNK_SIZE;
          for (const item of remaining) {
            if (item.count > 0 && chunkLeft > 0) {
              const take = Math.min(item.count, chunkLeft);
              chunk.push({ type: item.type, count: take });
              item.count -= take;
              chunkLeft -= take;
            }
          }
          if (chunk.length > 0) chunks.push(chunk);
        }

        for (let i = 0; i < chunks.length; i++) {
          const chunkTotal = chunks[i].reduce((s, c) => s + c.count, 0);
          setProgress(`Generating chunk ${i + 1}/${chunks.length} (${allQuestions.length}/${totalCount} done)...`);

          try {
            const questions = await generateChunk(chunks[i], chunkTotal, controller.signal);
            allQuestions.push(...questions);
            // Send each chunk to the main list immediately so user sees progress
            if (questions.length > 0) {
              onAcceptQuestions(questions);
            }
          } catch (chunkErr: any) {
            if (chunkErr.name === 'AbortError') throw chunkErr;
            console.error(`Chunk ${i + 1} failed:`, chunkErr);
            // Continue with remaining chunks even if one fails
          }
        }

        if (allQuestions.length === 0) throw new Error('No questions generated');
        setProgress(`Done — ${allQuestions.length} questions generated!`);
        setTimeout(() => onClose(), 1000);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generation cancelled.');
      } else {
        setError(err.message || 'Failed to generate questions');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !generating) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            AI Question Writer
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Set question counts by type. Questions go directly into your assessment.
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
                    disabled={item.count === 0 || generating}
                    className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-semibold text-zinc-900 w-8 text-center tabular-nums">
                    {item.count}
                  </span>
                  <button
                    onClick={() => updateCount(item.type, 1)}
                    disabled={item.count >= tier.maxPerType || totalCount >= tier.maxTotal || generating}
                    className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-zinc-500">
                {tier.label} plan — up to {tier.maxTotal} per batch
              </p>
              {totalCount > 0 && (
                <p className="text-xs text-zinc-500">
                  {totalCount}/{tier.maxTotal}
                  {totalCount > CHUNK_SIZE && ` · ${Math.ceil(totalCount / CHUNK_SIZE)} batches`}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 font-medium">Domain</label>
              <Select value={domain} onValueChange={setDomain} disabled={generating}>
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
              <Select value={difficulty} onValueChange={setDifficulty} disabled={generating}>
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
            <label className="text-xs text-zinc-500 font-medium">AI Model</label>
            <Select value={aiModel} onValueChange={setAiModel} disabled={generating}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4.1">GPT-4.1 (fast, reliable)</SelectItem>
                <SelectItem value="claude-opus-4">Claude Opus 4 (premium clinical)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (budget)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 font-medium">Topic Focus (optional)</label>
            <Textarea
              value={topicHint}
              onChange={(e) => setTopicHint(e.target.value)}
              placeholder="e.g., STEMI management, 12-lead interpretation, START triage..."
              rows={2}
              className="text-sm resize-none"
              disabled={generating}
            />
          </div>

          {/* Progress indicator */}
          {progress && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500 shrink-0" />
              <p className="text-xs text-zinc-600">{progress}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating} className="text-zinc-600">
            {generating ? 'Working...' : 'Cancel'}
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
