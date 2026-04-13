'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  Eye,
  CheckCircle2,
  X,
  Sparkles,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InstructorGuard } from '@/components/auth/instructor-guard';
import { useUser } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import ECGStripPicker from '@/components/foresight/ecg-strip-picker';
import { AIAssistantPanel } from '@/components/foresight/ai-assistant-panel';

type TEIType = 'MC' | 'MR' | 'DD' | 'BL' | 'OB' | 'CJS';

// Rich data model matching actual DB question structures
interface MCData { options: { key: string; text: string }[]; correctKey: string; }
interface MRData { options: { key: string; text: string }[]; correctKeys: string[]; }
interface DDData { items: { id: string; text: string }[]; categories: string[]; correctMapping: Record<string, string>; }
interface BLData { items: string[]; correctOrder: number[]; }
interface OBData { rows: string[]; columns: string[]; correctAnswers: Record<string, string>; }
interface CJSPhaseQuestion { stem: string; type: TEIType; data: MCData | MRData | DDData | BLData | OBData; ecgStripId?: string; }
interface CJSVitals { hr: string; bp: string; rr: string; spo2: string; etco2: string; temp: string; bgl: string; map: string; }
interface CJSData { phases: { label: string; content: string; vitals?: CJSVitals; history?: string; ecgFindings?: string; questions: CJSPhaseQuestion[] }[]; }

interface QuestionTemplate {
  id: string;
  type: TEIType;
  stem: string;
  data: MCData | MRData | DDData | BLData | OBData | CJSData;
  rationale: string;
  expanded: boolean;
  // AI-generated metadata
  domain?: string;
  cjFunctions?: string[];
  difficulty?: string;
}

const TEI_LABELS: Record<TEIType, string> = {
  MC: 'Multiple Choice',
  MR: 'Multiple Response (SATA)',
  DD: 'Drag & Drop',
  BL: 'Build List / Ordered Response',
  OB: 'Options Box / Matrix',
  CJS: 'Clinical Judgment Scenario',
};

const TEI_DESCRIPTIONS: Record<TEIType, string> = {
  MC: '4 options, 1 correct answer',
  MR: 'Select all that apply — 5-6 options, 2-3 correct',
  DD: 'Sort items into categories (e.g., medications by class)',
  BL: 'Arrange steps in correct order (e.g., treatment priority)',
  OB: 'Table with row statements and column choices (e.g., effective vs ineffective)',
  CJS: 'Multi-phase patient scenario with evolving information',
};

function phaseQuestionDataForType(type: TEIType): MCData | MRData | DDData | BLData | OBData {
  const map: Record<string, any> = {
    MC: { options: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }], correctKey: '' },
    MR: { options: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }, { key: 'E', text: '' }], correctKeys: [] },
    DD: { items: [{ id: 'i1', text: '' }, { id: 'i2', text: '' }], categories: ['', ''], correctMapping: {} },
    BL: { items: ['', '', ''], correctOrder: [0, 1, 2] },
    OB: { rows: ['', ''], columns: ['', ''], correctAnswers: {} },
  };
  return map[type] || map.MC;
}

function newPhaseQuestion(type: TEIType): CJSPhaseQuestion {
  return { stem: '', type, data: phaseQuestionDataForType(type) };
}

function createBlankQuestion(type: TEIType): QuestionTemplate {
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const dataByType: Record<TEIType, any> = {
    MC: { options: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }], correctKey: '' } as MCData,
    MR: { options: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }, { key: 'E', text: '' }, { key: 'F', text: '' }], correctKeys: [] } as MRData,
    DD: { items: [{ id: 'item1', text: '' }, { id: 'item2', text: '' }, { id: 'item3', text: '' }], categories: ['', ''], correctMapping: {} } as DDData,
    BL: { items: ['', '', '', ''], correctOrder: [0, 1, 2, 3] } as BLData,
    OB: { rows: ['', '', ''], columns: ['', ''], correctAnswers: {} } as OBData,
    CJS: { phases: [
      { label: 'En Route', content: '', questions: [newPhaseQuestion('MC')] },
      { label: 'On Scene', content: '', questions: [newPhaseQuestion('MC')] },
      { label: 'Post-Scene', content: '', questions: [newPhaseQuestion('MC')] },
    ] } as CJSData,
  };

  return {
    id,
    type,
    stem: '',
    data: dataByType[type],
    rationale: '',
    expanded: true,
  };
}

/** Inline ECG strip preview for the preview modal */
function ECGPreviewInline({ stripId }: { stripId: string }) {
  const [strip, setStrip] = useState<{ image_url: string; rhythm_label: string } | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.from('ecg_strips').select('image_url, rhythm_label').eq('id', stripId).single()
      .then(({ data }) => { if (data) setStrip(data); });
  }, [stripId]);
  if (!strip) return null;
  return (
    <div className="rounded-lg surface-1 ring-1 ring-zinc-200 overflow-hidden mb-4">
      <img src={strip.image_url} alt="ECG Strip" className="w-full h-auto object-contain" />
      <p className="text-[9px] text-zinc-500 px-2 py-1">PhysioNet - CC BY 4.0</p>
    </div>
  );
}

const STORAGE_KEY = 'foresight_test_builder_draft';

interface SavedDraft {
  assessmentName: string;
  certLevel: string;
  questions: QuestionTemplate[];
  savedAt: string;
}

function loadDraft(): SavedDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migrate old format: questions with options[] instead of data{}
    if (parsed.questions) {
      parsed.questions = parsed.questions.map((q: any) => {
        if (q.data) return q; // Already new format
        // Old format — clear it, can't reliably migrate
        return createBlankQuestion(q.type || 'MC');
      });
    }
    return parsed;
  } catch {
    // Corrupt data — clear it
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveDraft(draft: SavedDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch { /* storage full or unavailable */ }
}

function TestBuilderContent() {
  const { user } = useUser();
  const [assessmentName, setAssessmentName] = useState('');
  const [certLevel, setCertLevel] = useState<string>('Paramedic');
  const [assessmentType, setAssessmentType] = useState<string>('quiz');
  const [questions, setQuestions] = useState<QuestionTemplate[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<TEIType>('MC');
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([]);

  // Load classes for publishing
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from('instructors').select('id').eq('user_id', user.id).single()
      .then(({ data: inst }) => {
        if (!inst) return;
        supabase.from('classes').select('id, name').eq('instructor_id', inst.id)
          .then(({ data }) => setAvailableClasses(data ?? []));
      });
  }, [user]);

  const handlePublish = async () => {
    if (!user || !assessmentId) return;
    setPublishing(true);
    try {
      const supabase = createClient();
      await supabase.from('instructor_assessments').update({
        status: 'published',
        class_id: selectedClassId || null,
      }).eq('id', assessmentId);
      setSaveMessage('Published!');
      setPublishOpen(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('Error publishing');
      setTimeout(() => setSaveMessage(''), 3000);
    }
    setPublishing(false);
  };

  const handleGenerateAI = async (questionId?: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    setGenerating(true);
    setSaveMessage('Generating with AI...');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuration error — please reload the page');
      }

      const existingQuestion = questionId ? questions.find((q) => q.id === questionId) : null;
      const targetType = existingQuestion?.type || 'MC';

      // For CJS, generate MC instead — CJS multi-phase structure is too complex for single-shot generation
      const generateType = targetType === 'CJS' ? 'MC' : targetType;

      // Build topic hint including existing question context for better refinement
      let topicContext = assessmentName || 'EMS patient assessment';
      if (existingQuestion?.stem) {
        topicContext = `Improve this ${targetType} question about: ${existingQuestion.stem.slice(0, 200)}`;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-questions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          count: 1,
          certification_level: certLevel,
          item_type: generateType,
          difficulty: 'medium',
          topic_hint: topicContext,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let msg = `Generation failed (${response.status})`;
        try { msg = JSON.parse(text).error || msg; } catch { /* use default msg */ }
        throw new Error(msg);
      }

      const result = await response.json();
      const generated = Array.isArray(result?.questions) ? result.questions : [];

      if (generated.length === 0) {
        throw new Error('No questions generated — try again');
      }

      if (questionId && existingQuestion) {
        const q = generated[0];

        if (existingQuestion.type === 'CJS') {
          // For CJS: only update the stem (scenario context), preserve the phase structure
          setQuestions((prev) =>
            prev.map((existing) =>
              existing.id === questionId
                ? { ...existing, stem: q.stem || existing.stem }
                : existing
            )
          );
          setSaveMessage('CJS scenario context updated!');
        } else {
          // Refine mode: MERGE AI data with existing — only fill empty fields
          const rationale = typeof q.rationale === 'string'
            ? q.rationale
            : (q.rationale ? JSON.stringify(q.rationale, null, 2) : '');

          setQuestions((prev) =>
            prev.map((existing) => {
              if (existing.id !== questionId) return existing;

              // Only update stem if current one is empty or very short
              const newStem = (!existing.stem || existing.stem.length < 20) ? (q.stem || existing.stem) : existing.stem;

              // Only update rationale if current one is empty
              const newRationale = (!existing.rationale || existing.rationale.length < 5) ? (rationale || existing.rationale) : existing.rationale;

              // For options data: merge — only fill in empty fields, preserve filled ones
              let newData = existing.data;
              if (q.options && typeof q.options === 'object') {
                const existData = existing.data as any;

                if (existing.type === 'DD') {
                  // DD: preserve filled categories/items, only fill empty ones
                  const existCats = existData?.categories || [];
                  const existItems = existData?.items || [];
                  const aiCats = Array.isArray(q.options.categories) ? q.options.categories : [];
                  const aiItems = Array.isArray(q.options.items) ? q.options.items : [];

                  newData = {
                    ...existData,
                    // Keep existing categories if they have content, otherwise use AI
                    categories: existCats.some((c: string) => c.trim()) ? existCats : aiCats,
                    // Keep existing items if they have content, otherwise use AI
                    items: existItems.some((it: any) => (it?.text || it)?.toString().trim()) ? existItems :
                      aiItems.map((it: any, idx: number) => typeof it === 'string' ? { id: `i${idx+1}`, text: it } : it),
                    // Always update correctMapping from AI if we don't have one
                    correctMapping: Object.keys(existData?.correctMapping || {}).length > 0
                      ? existData.correctMapping
                      : (q.options.correctMapping || {}),
                  };
                } else if ((existing.type === 'MC' || existing.type === 'MR') && Array.isArray(q.options.options)) {
                  // MC/MR: only overwrite if existing options are all empty
                  const existOpts = existData?.options || [];
                  const hasContent = existOpts.some((o: any) => o?.text?.trim());
                  if (!hasContent) {
                    newData = q.options;
                  }
                  // else keep existing options
                } else if ((existing.type === 'OB' || existing.type === 'BL') && Array.isArray(q.options.items)) {
                  const existItems = existData?.items || [];
                  const hasContent = existItems.some((it: any) => it?.toString().trim());
                  if (!hasContent) {
                    newData = q.options;
                  }
                }
              }

              return {
                ...existing,
                stem: newStem,
                data: newData,
                rationale: newRationale,
                // Store AI metadata if we don't have it yet
                domain: existing.domain || q.domain || undefined,
                cjFunctions: existing.cjFunctions?.length ? existing.cjFunctions : (q.cj_functions || undefined),
                difficulty: existing.difficulty || q.difficulty || undefined,
              };
            })
          );
          setSaveMessage('Question refined with AI!');
        }
      } else {
        const newQuestions: QuestionTemplate[] = generated.map((q: any) => {
          const type = (q.item_type || 'MC') as TEIType;
          const base = createBlankQuestion(type);
          const rat = typeof q.rationale === 'string' ? q.rationale : (q.rationale ? JSON.stringify(q.rationale, null, 2) : '');
          return {
            ...base,
            stem: q.stem || '',
            data: q.options && typeof q.options === 'object' ? q.options : base.data,
            rationale: rat,
            expanded: false,
            domain: q.domain || undefined,
            cjFunctions: q.cj_functions || undefined,
            difficulty: q.difficulty || undefined,
          };
        });
        setQuestions((prev) => [...prev, ...newQuestions]);
        setSaveMessage(`Generated ${generated.length} question${generated.length !== 1 ? 's' : ''}!`);
      }
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error('AI generation error:', err);
      if (err.name === 'AbortError') {
        setSaveMessage('Generation timed out — try a simpler topic');
      } else {
        setSaveMessage(err.message || 'AI generation failed');
      }
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      clearTimeout(timeout);
      setGenerating(false);
    }
  };

  // Load draft on mount — try Supabase first, fall back to localStorage
  useEffect(() => {
    async function loadFromSupabase() {
      if (!user) { setDraftsLoaded(true); return; }
      const supabase = createClient();

      // Get instructor ID
      const { data: instructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!instructor) {
        // Fall back to localStorage
        const draft = loadDraft();
        if (draft && draft.questions.length > 0) {
          setAssessmentName(draft.assessmentName);
          setCertLevel(draft.certLevel);
          setQuestions(draft.questions);
        }
        setDraftsLoaded(true);
        return;
      }

      // Check for existing draft assessment
      const { data: drafts } = await supabase
        .from('instructor_assessments')
        .select('id, name, certification_level')
        .eq('instructor_id', instructor.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (drafts && drafts.length > 0) {
        const draft = drafts[0];
        setAssessmentId(draft.id);
        setAssessmentName(draft.name);
        setCertLevel(draft.certification_level);

        // Load questions
        const { data: savedQuestions } = await supabase
          .from('instructor_questions')
          .select('*')
          .eq('assessment_id', draft.id)
          .order('display_order');

        if (savedQuestions && savedQuestions.length > 0) {
          const loaded: QuestionTemplate[] = savedQuestions.map((sq) => {
            const type = (sq.item_type || 'MC') as TEIType;
            let data;
            try {
              if (type === 'CJS') {
                data = sq.cjs_data || createBlankQuestion('CJS').data;
              } else if (sq.options && typeof sq.options === 'object' && !Array.isArray(sq.options) && sq.options.options) {
                data = sq.options; // Already in new format
              } else {
                data = createBlankQuestion(type).data; // Fall back to blank
              }
            } catch {
              data = createBlankQuestion(type).data;
            }
            return { id: sq.id, type, stem: sq.stem || '', data, rationale: sq.rationale || '', expanded: false };
          });
          setQuestions(loaded);
        }
      } else {
        // Fall back to localStorage
        const draft = loadDraft();
        if (draft && draft.questions.length > 0) {
          setAssessmentName(draft.assessmentName);
          setCertLevel(draft.certLevel);
          setQuestions(draft.questions);
        }
      }
      setDraftsLoaded(true);
    }
    loadFromSupabase();
  }, [user]);

  // Auto-save to localStorage on changes (debounced)
  useEffect(() => {
    if (!draftsLoaded) return;
    const timeout = window.setTimeout(() => {
      if (questions.length > 0 || assessmentName) {
        saveDraft({ assessmentName, certLevel, questions, savedAt: new Date().toISOString() });
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [assessmentName, certLevel, questions, draftsLoaded]);

  const handleSaveDraft = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMessage('Saving...');

    try {
      const supabase = createClient();

      // Get instructor ID
      const { data: instructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!instructor) {
        // Fall back to localStorage
        saveDraft({ assessmentName, certLevel, questions, savedAt: new Date().toISOString() });
        setSaveMessage('Saved locally (no instructor record)');
        setTimeout(() => setSaveMessage(''), 3000);
        setSaving(false);
        return;
      }

      let currentAssessmentId = assessmentId;

      // Create or update assessment
      if (!currentAssessmentId) {
        const { data: newAssessment, error } = await supabase
          .from('instructor_assessments')
          .insert({
            instructor_id: instructor.id,
            name: assessmentName || 'Untitled Assessment',
            certification_level: certLevel,
            question_count: questions.length,
            status: 'draft',
          })
          .select('id')
          .single();

        if (error || !newAssessment) {
          setSaveMessage('Error saving — try again');
          setTimeout(() => setSaveMessage(''), 3000);
          setSaving(false);
          return;
        }
        currentAssessmentId = newAssessment.id;
        setAssessmentId(currentAssessmentId);
      } else {
        await supabase
          .from('instructor_assessments')
          .update({
            name: assessmentName || 'Untitled Assessment',
            certification_level: certLevel,
            question_count: questions.length,
          })
          .eq('id', currentAssessmentId);
      }

      // Delete existing questions and re-insert
      await supabase
        .from('instructor_questions')
        .delete()
        .eq('assessment_id', currentAssessmentId);

      if (questions.length > 0) {
        const questionRows = questions.map((q, idx) => {
          const data = q.data as any;
          // Extract correct answer from the options data structure
          let correctAnswer: any = {};
          if (q.type === 'MC' && data?.correctKey) {
            correctAnswer = { correctKey: data.correctKey };
          } else if (q.type === 'MR' && Array.isArray(data?.correctKeys)) {
            correctAnswer = { correctKeys: data.correctKeys };
          } else if (q.type === 'DD' && data?.correctMapping) {
            correctAnswer = { correctMapping: data.correctMapping };
          } else if (q.type === 'OB' && data?.correctAnswers && Object.keys(data.correctAnswers).length > 0) {
            correctAnswer = { correctAnswers: data.correctAnswers };
          } else if (q.type === 'BL' && Array.isArray(data?.correctOrder)) {
            correctAnswer = { correctOrder: data.correctOrder };
          }

          return {
            assessment_id: currentAssessmentId,
            display_order: idx,
            item_type: q.type,
            stem: q.stem,
            options: q.type === 'CJS' ? {} : q.data,
            correct_answer: correctAnswer,
            rationale: q.rationale,
            cjs_data: q.type === 'CJS' ? q.data : null,
            metadata: {
              certification_level: certLevel,
              assessment_type: assessmentType,
              domain: q.domain || null,
              cj_functions: q.cjFunctions || null,
              difficulty: q.difficulty || null,
            },
          };
        });

        await supabase.from('instructor_questions').insert(questionRows);
      }

      // Also save to localStorage as backup
      saveDraft({ assessmentName, certLevel, questions, savedAt: new Date().toISOString() });

      setSaveMessage('Saved to Foresight!');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch {
      setSaveMessage('Error saving');
      setTimeout(() => setSaveMessage(''), 3000);
    }
    setSaving(false);
  };

  const handleClearDraft = () => {
    if (window.confirm('Clear all questions and start fresh?')) {
      setAssessmentName('');
      setQuestions([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const addQuestion = (type: TEIType) => {
    setQuestions((prev) => [...prev, createBlankQuestion(type)]);
    setShowNewDialog(false);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const toggleExpand = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, expanded: !q.expanded } : q))
    );
  };

  const updateQuestion = (id: string, field: keyof QuestionTemplate, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateData = (qId: string, updater: (data: any) => any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, data: updater(q.data) } : q))
    );
  };

  const filledCount = questions.filter((q) => q.stem.trim() !== '').length;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Test Builder</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Create and manage assessments with real TEI formats</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {saveMessage && (
              <span className="text-xs text-emerald-700 font-medium animate-fade-in">{saveMessage}</span>
            )}
            {questions.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearDraft} className="text-zinc-400 hover:text-red-600 text-xs">
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={questions.length === 0}
              onClick={() => setPreviewIndex(0)}
              className="section-card text-zinc-600 hover:text-zinc-900"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Preview
            </Button>
            <Button
              size="sm"
              className="bg-white hover:bg-zinc-50 text-zinc-900"
              disabled={questions.length === 0 || saving}
              onClick={handleSaveDraft}
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save Draft
            </Button>
            {assessmentId && (
              <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                    <Send className="h-4 w-4 mr-1.5" />
                    Publish
                  </Button>
                </DialogTrigger>
                <DialogContent className="section-card border-zinc-300 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-zinc-900">Publish Assessment</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Published assessments become available for students to take. Assign to a class to make it visible on their dashboard.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Assign to Class (optional)</label>
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger><SelectValue placeholder="Select a class..." /></SelectTrigger>
                        <SelectContent>
                          {availableClasses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="glass-subtle p-3 text-xs text-zinc-400">
                      <p><span className="font-medium text-zinc-600">{questions.length} questions</span> will be published as &ldquo;{assessmentName || 'Untitled'}&rdquo;</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPublishOpen(false)} className="text-zinc-600">Cancel</Button>
                    <Button onClick={handlePublish} disabled={publishing} className="bg-blue-600 hover:bg-blue-500 text-white">
                      {publishing ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Publishing...</> : 'Publish Assessment'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* New Assessment empty state — shown when no draft is loaded */}
        {!assessmentName && questions.length === 0 && draftsLoaded && (
          <div className="section-card">
            <div className="text-center py-16 px-6">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-5">
                <Plus className="h-6 w-6 text-zinc-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900">Create a New Assessment</h2>
              <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
                Build exams with real NREMT TEI formats. Set up the basics, then add questions manually or generate them with AI.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
                    <Plus className="h-4 w-4" />
                    New Assessment
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-zinc-900">New Assessment</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                      Set up the basics for your assessment. You can change these later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-zinc-700 font-medium">Assessment Name</Label>
                      <Input
                        value={assessmentName}
                        onChange={(e) => setAssessmentName(e.target.value)}
                        placeholder="e.g., Cardiology Midterm — Spring 2026"
                        className="h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-700 font-medium">Certification Level</Label>
                        <Select value={certLevel} onValueChange={setCertLevel}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMT">EMT</SelectItem>
                            <SelectItem value="AEMT">AEMT</SelectItem>
                            <SelectItem value="Paramedic">Paramedic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-700 font-medium">Assessment Type</Label>
                        <Select value={assessmentType} onValueChange={setAssessmentType}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quiz">Quiz (10–25q)</SelectItem>
                            <SelectItem value="chapter">Chapter Test (25–50q)</SelectItem>
                            <SelectItem value="midterm">Midterm Exam (50–100q)</SelectItem>
                            <SelectItem value="final">Final Exam (100–150q)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-zinc-700 font-medium">Number of Questions</Label>
                      <Input
                        type="number"
                        min={1}
                        max={200}
                        placeholder="e.g., 50"
                        className="h-11"
                      />
                      <p className="text-xs text-zinc-400">You can always add or remove questions later.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-zinc-600">Cancel</Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                      <Button className="bg-zinc-900 hover:bg-zinc-800 text-white" disabled={!assessmentName.trim()}>
                        Create Assessment
                      </Button>
                    </DialogTrigger>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Assessment Setup — shown when an assessment is active */}
        {(assessmentName || questions.length > 0) && (
        <div className="section-card p-5 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-md surface-2 flex items-center justify-center text-xs font-bold text-zinc-600">1</div>
            <h2 className="text-sm font-semibold text-zinc-700">Assessment Setup</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="assessment-name" className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                Assessment Name
              </label>
              <Input
                id="assessment-name"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                placeholder="e.g., Cardiology Midterm"
                className="bg-surface-1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Certification Level</label>
              <Select value={certLevel} onValueChange={setCertLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMT">EMT</SelectItem>
                  <SelectItem value="AEMT">AEMT</SelectItem>
                  <SelectItem value="Paramedic">Paramedic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Assessment Type</label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz (10–25 questions)</SelectItem>
                  <SelectItem value="chapter">Chapter Test (25–50)</SelectItem>
                  <SelectItem value="midterm">Midterm Exam (50–100)</SelectItem>
                  <SelectItem value="final">Final Exam (100–150)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TEI Mix guide */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
            <p className="text-xs font-medium text-zinc-600 mb-2">Suggested TEI Mix</p>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'MC', pct: '55–65%', desc: 'Foundation' },
                { type: 'MR', pct: '10–15%', desc: 'Select All' },
                { type: 'DD', pct: '8–12%', desc: 'Matching' },
                { type: 'OB', pct: '8–12%', desc: 'Sequencing' },
                { type: 'BL', pct: '5–8%', desc: 'Linking' },
              ].map((item) => (
                <div key={item.type} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-xs">
                  <span className="font-mono font-semibold text-zinc-700">{item.type}</span>
                  <span className="text-zinc-400">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* AI Generation Section */}
        <div className="section-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md surface-2 flex items-center justify-center text-xs font-bold text-zinc-600">2</div>
              <h2 className="text-sm font-semibold text-zinc-700">Question Assembly</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setAiPanelOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-elevation-1"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                AI Question Writer
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Add questions manually, use AI to generate them from your curriculum, or mix both approaches.
          </p>
        </div>

        {/* Question Count Summary */}
        {questions.length > 0 && (
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="flex items-center gap-3 text-zinc-400">
              <span className="font-semibold text-zinc-900">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
              <span className="text-zinc-500">|</span>
              <span>{filledCount} completed</span>
              <span className="text-zinc-500">|</span>
              <span>{questions.length - filledCount} blank</span>
            </div>
            <span className="text-xs text-zinc-400 font-mono tabular-nums">
              {(['MC', 'MR', 'DD', 'BL', 'OB', 'CJS'] as TEIType[])
                .map((type) => {
                  const count = questions.filter((q) => q.type === type).length;
                  return count > 0 ? `${type} ${count}` : null;
                })
                .filter(Boolean)
                .join(' \u00b7 ')}
            </span>
          </div>
        )}

        {/* Question Cards */}
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="section-card">
              {/* Collapsed row */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50/30 transition-colors rounded-xl"
                onClick={() => toggleExpand(q.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-zinc-400 tabular-nums flex-shrink-0">Q{idx + 1}</span>
                  <span className="surface-2 text-zinc-600 font-mono text-xs rounded px-1.5 py-0.5 flex-shrink-0">
                    {q.type}
                  </span>
                  {q.stem ? (
                    <span className="text-sm text-zinc-600 truncate">{q.stem}</span>
                  ) : (
                    <span className="text-sm text-zinc-500 italic">Blank — click to edit</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {q.stem && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                    className="p-1 rounded hover:bg-zinc-50/50 text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {q.expanded ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Expanded Form */}
              {q.expanded && (
                <div className="px-4 pb-4 pt-0 border-t border-zinc-200">
                  <div className="space-y-4 mt-4">
                    {/* AI assist — works on blank or partial questions */}
                    <button
                      onClick={() => handleGenerateAI(q.id)}
                      disabled={generating}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-zinc-300 text-zinc-500 text-xs hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {q.stem ? 'Refine with AI' : 'Generate with AI'}
                    </button>

                    {/* Stem */}
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Question Stem</label>
                      <Textarea
                        value={q.stem}
                        onChange={(e) => updateQuestion(q.id, 'stem', e.target.value)}
                        placeholder="Enter the question text..."
                        rows={3}
                        className="bg-surface-1 text-sm"
                      />
                    </div>

                    {/* MC Editor */}
                    {q.type === 'MC' && (() => {
                      const raw = q.data as any;
                      const d: MCData = {
                        options: Array.isArray(raw?.options) ? raw.options : (Array.isArray(raw?.options?.options) ? raw.options.options : [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }]),
                        correctKey: raw?.correctKey || raw?.options?.correctKey || '',
                      };
                      return (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Options — click the radio to mark correct</label>
                          {d.options.map((opt, oi) => (
                            <div key={opt.key} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateData(q.id, (prev: MCData) => ({ ...prev, correctKey: opt.key }))}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  d.correctKey === opt.key ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-transparent' : 'border-zinc-600 hover:border-zinc-400'
                                }`}
                              >
                                {d.correctKey === opt.key && <div className="w-3 h-3 rounded-full bg-emerald-600" />}
                              </button>
                              <span className="text-xs font-mono text-zinc-400 w-4">{opt.key}.</span>
                              <Input
                                value={opt.text}
                                onChange={(e) => updateData(q.id, (prev: MCData) => ({
                                  ...prev,
                                  options: prev.options.map((o, i) => i === oi ? { ...o, text: e.target.value } : o),
                                }))}
                                placeholder={`Option ${opt.key}`}
                                className="bg-surface-1 text-sm flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* MR Editor */}
                    {q.type === 'MR' && (() => {
                      const raw = q.data as any;
                      const d: MRData = {
                        options: Array.isArray(raw?.options) ? raw.options : (Array.isArray(raw?.options?.options) ? raw.options.options : [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }, { key: 'E', text: '' }]),
                        correctKeys: Array.isArray(raw?.correctKeys) ? raw.correctKeys : (Array.isArray(raw?.options?.correctKeys) ? raw.options.correctKeys : []),
                      };
                      return (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Options — check all correct answers</label>
                          {d.options.map((opt, oi) => (
                            <div key={opt.key} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateData(q.id, (prev: MRData) => ({
                                  ...prev,
                                  correctKeys: prev.correctKeys.includes(opt.key)
                                    ? prev.correctKeys.filter(k => k !== opt.key)
                                    : [...prev.correctKeys, opt.key],
                                }))}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  d.correctKeys.includes(opt.key) ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-transparent' : 'border-zinc-600 hover:border-zinc-400'
                                }`}
                              >
                                {d.correctKeys.includes(opt.key) && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              </button>
                              <span className="text-xs font-mono text-zinc-400 w-4">{opt.key}.</span>
                              <Input
                                value={opt.text}
                                onChange={(e) => updateData(q.id, (prev: MRData) => ({
                                  ...prev,
                                  options: prev.options.map((o, i) => i === oi ? { ...o, text: e.target.value } : o),
                                }))}
                                placeholder={`Option ${opt.key}`}
                                className="bg-surface-1 text-sm flex-1"
                              />
                            </div>
                          ))}
                          {d.correctKeys.length > 0 && (
                            <p className="text-[10px] text-emerald-600">{d.correctKeys.length} correct answer{d.correctKeys.length !== 1 ? 's' : ''} selected</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* DD Editor */}
                    {q.type === 'DD' && (() => {
                      const raw = q.data as any;
                      const d: DDData = {
                        items: Array.isArray(raw?.items) ? raw.items : [{ id: 'i1', text: '' }, { id: 'i2', text: '' }],
                        categories: Array.isArray(raw?.categories) ? raw.categories : ['', ''],
                        correctMapping: raw?.correctMapping || {},
                      };
                      return (
                        <div className="space-y-4">
                          {/* Categories */}
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Categories (drop zones)</label>
                            {d.categories.map((cat, ci) => (
                              <div key={ci} className="flex items-center gap-2">
                                <span className="surface-2 text-zinc-600 font-mono text-[10px] rounded px-1.5 py-0.5">Cat {ci + 1}</span>
                                <Input
                                  value={cat}
                                  onChange={(e) => updateData(q.id, (prev: DDData) => ({
                                    ...prev,
                                    categories: prev.categories.map((c, i) => i === ci ? e.target.value : c),
                                  }))}
                                  placeholder={`e.g., "Cardiac", "Respiratory", "Neurological"`}
                                  className="bg-surface-1 text-sm flex-1"
                                />
                                {d.categories.length > 2 && (
                                  <button onClick={() => updateData(q.id, (prev: DDData) => ({
                                    ...prev, categories: prev.categories.filter((_, i) => i !== ci),
                                  }))} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                )}
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => updateData(q.id, (prev: DDData) => ({
                              ...prev, categories: [...prev.categories, ''],
                            }))} className="text-xs section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-3 w-3 mr-1" />Add Category</Button>
                          </div>

                          {/* Items */}
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Draggable Items — select which category each belongs to</label>
                            {d.items.map((item, ii) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <Input
                                  value={item.text}
                                  onChange={(e) => updateData(q.id, (prev: DDData) => ({
                                    ...prev,
                                    items: prev.items.map((it, i) => i === ii ? { ...it, text: e.target.value } : it),
                                  }))}
                                  placeholder={`Item ${ii + 1} (e.g., "Albuterol", "Nitroglycerin")`}
                                  className="bg-surface-1 text-sm flex-1"
                                />
                                <select
                                  value={d.correctMapping[item.id] || ''}
                                  onChange={(e) => updateData(q.id, (prev: DDData) => ({
                                    ...prev,
                                    correctMapping: { ...prev.correctMapping, [item.id]: e.target.value },
                                  }))}
                                  className="text-xs border border-zinc-200 rounded px-2 py-1.5 surface-1 text-zinc-600 min-w-[160px]"
                                >
                                  <option value="">Select category...</option>
                                  {d.categories.filter(c => c.trim()).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                                {d.items.length > 2 && (
                                  <button onClick={() => updateData(q.id, (prev: DDData) => ({
                                    ...prev, items: prev.items.filter((_, i) => i !== ii),
                                  }))} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                )}
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => updateData(q.id, (prev: DDData) => ({
                              ...prev, items: [...prev.items, { id: `item${prev.items.length + 1}`, text: '' }],
                            }))} className="text-xs section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-3 w-3 mr-1" />Add Item</Button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* BL Editor */}
                    {q.type === 'BL' && (() => {
                      const raw = q.data as any;
                      const d: BLData = {
                        items: Array.isArray(raw?.items) ? raw.items : ['', '', ''],
                        correctOrder: Array.isArray(raw?.correctOrder) ? raw.correctOrder : [0, 1, 2],
                      };
                      return (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                            Enter items in the CORRECT order — they will be shuffled when delivered to students
                          </label>
                          {d.items.map((item, ii) => (
                            <div key={ii} className="flex items-center gap-2">
                              <span className="text-xs font-mono text-zinc-400 w-5 text-center flex-shrink-0">{ii + 1}</span>
                              <Input
                                value={item}
                                onChange={(e) => updateData(q.id, (prev: BLData) => ({
                                  ...prev,
                                  items: prev.items.map((it, i) => i === ii ? e.target.value : it),
                                }))}
                                placeholder={`Step ${ii + 1} (e.g., "Assess scene safety")`}
                                className="bg-surface-1 text-sm flex-1"
                              />
                              {d.items.length > 2 && (
                                <button onClick={() => updateData(q.id, (prev: BLData) => ({
                                  ...prev, items: prev.items.filter((_, i) => i !== ii),
                                }))} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                              )}
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => updateData(q.id, (prev: BLData) => ({
                            ...prev, items: [...prev.items, ''],
                          }))} className="text-xs section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-3 w-3 mr-1" />Add Step</Button>
                        </div>
                      );
                    })()}

                    {/* OB Editor (Matrix / Options Box) */}
                    {q.type === 'OB' && (() => {
                      const raw = q.data as any;
                      const d: OBData = {
                        rows: Array.isArray(raw?.rows) ? raw.rows : ['', ''],
                        columns: Array.isArray(raw?.columns) ? raw.columns : ['', ''],
                        correctAnswers: raw?.correctAnswers || {},
                      };
                      return (
                        <div className="space-y-4">
                          {/* Column headers */}
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Column Headers</label>
                            <div className="flex gap-2 flex-wrap">
                              {d.columns.map((col, ci) => (
                                <div key={ci} className="flex items-center gap-1">
                                  <Input
                                    value={col}
                                    onChange={(e) => updateData(q.id, (prev: OBData) => ({
                                      ...prev,
                                      columns: prev.columns.map((c, i) => i === ci ? e.target.value : c),
                                    }))}
                                    placeholder={ci === 0 ? 'e.g., Effective' : ci === 1 ? 'e.g., Ineffective' : `Column ${ci + 1}`}
                                    className="bg-surface-1 text-sm w-36"
                                  />
                                  {d.columns.length > 2 && (
                                    <button onClick={() => updateData(q.id, (prev: OBData) => ({
                                      ...prev, columns: prev.columns.filter((_, i) => i !== ci),
                                    }))} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                                  )}
                                </div>
                              ))}
                              <Button variant="outline" size="sm" onClick={() => updateData(q.id, (prev: OBData) => ({
                                ...prev, columns: [...prev.columns, ''],
                              }))} className="text-xs h-9 section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-3 w-3 mr-1" />Col</Button>
                            </div>
                          </div>

                          {/* Row statements with correct answer selectors */}
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Row Statements — select the correct column for each</label>
                            {d.rows.map((row, ri) => (
                              <div key={ri} className="flex items-center gap-2">
                                <Input
                                  value={row}
                                  onChange={(e) => updateData(q.id, (prev: OBData) => ({
                                    ...prev,
                                    rows: prev.rows.map((r, i) => i === ri ? e.target.value : r),
                                  }))}
                                  placeholder={`Row statement ${ri + 1} (e.g., "HR 128, BP 94/62, RR 26")`}
                                  className="bg-surface-1 text-sm flex-1"
                                />
                                <select
                                  value={d.correctAnswers[row] || ''}
                                  onChange={(e) => updateData(q.id, (prev: OBData) => ({
                                    ...prev,
                                    correctAnswers: { ...prev.correctAnswers, [row]: e.target.value },
                                  }))}
                                  className="text-xs border border-zinc-200 rounded px-2 py-1.5 surface-1 text-zinc-600 min-w-[160px]"
                                >
                                  <option value="">Select column...</option>
                                  {d.columns.filter(c => c.trim()).map((col) => (
                                    <option key={col} value={col}>{col}</option>
                                  ))}
                                </select>
                                {d.rows.length > 2 && (
                                  <button onClick={() => updateData(q.id, (prev: OBData) => ({
                                    ...prev, rows: prev.rows.filter((_, i) => i !== ri),
                                  }))} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                )}
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => updateData(q.id, (prev: OBData) => ({
                              ...prev, rows: [...prev.rows, ''],
                            }))} className="text-xs section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-3 w-3 mr-1" />Add Row</Button>
                          </div>

                          {/* Live preview */}
                          {d.columns.some(c => c.trim()) && d.rows.some(r => r.trim()) && (
                            <div className="rounded-lg surface-1 ring-1 ring-zinc-200 overflow-hidden">
                              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide px-3 pt-2">Preview</p>
                              <table className="w-full text-xs mt-1">
                                <thead>
                                  <tr className="border-b border-zinc-200">
                                    <th className="text-left px-3 py-1.5 text-zinc-400 font-medium">Statement</th>
                                    {d.columns.filter(c => c.trim()).map((col) => (
                                      <th key={col} className="text-center px-3 py-1.5 text-zinc-400 font-medium">{col}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {d.rows.filter(r => r.trim()).map((row, ri) => (
                                    <tr key={ri} className="border-b border-zinc-200/50">
                                      <td className="px-3 py-1.5 text-zinc-600">{row}</td>
                                      {d.columns.filter(c => c.trim()).map((col) => (
                                        <td key={col} className="text-center px-3 py-1.5">
                                          <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                                            d.correctAnswers[row] === col ? 'border-white bg-white' : 'border-zinc-600'
                                          }`} />
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* CJS Editor */}
                    {q.type === 'CJS' && (() => {
                      const raw = q.data as any;
                      const d: CJSData = {
                        phases: Array.isArray(raw?.phases) ? raw.phases : [
                          { label: 'En Route', content: '', questions: [] },
                          { label: 'On Scene', content: '', questions: [] },
                          { label: 'Post-Scene', content: '', questions: [] },
                        ],
                      };
                      return (
                        <div className="space-y-4">
                          <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                            Clinical Judgment Scenario — each phase reveals new patient info and has associated questions
                          </label>
                          {d.phases.map((phase, pi) => (
                            <div key={pi} className="rounded-lg surface-1 ring-1 ring-zinc-200 p-4 space-y-3">
                              {/* Phase header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="surface-2 text-zinc-600 font-mono text-[10px] rounded px-2 py-0.5">Phase {pi + 1}</span>
                                  <Input
                                    value={phase.label}
                                    onChange={(e) => updateData(q.id, (prev: CJSData) => ({
                                      ...prev,
                                      phases: prev.phases.map((p, i) => i === pi ? { ...p, label: e.target.value } : p),
                                    }))}
                                    className="bg-surface-1 text-sm font-semibold w-36 h-8"
                                    placeholder="Phase name"
                                  />
                                </div>
                                {d.phases.length > 2 && (
                                  <button onClick={() => updateData(q.id, (prev: CJSData) => ({
                                    ...prev, phases: prev.phases.filter((_, i) => i !== pi),
                                  }))} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                )}
                              </div>

                              {/* Phase context */}
                              <div>
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Patient Information</label>
                                <Textarea
                                  value={phase.content}
                                  onChange={(e) => updateData(q.id, (prev: CJSData) => ({
                                    ...prev,
                                    phases: prev.phases.map((p, i) => i === pi ? { ...p, content: e.target.value } : p),
                                  }))}
                                  placeholder={
                                    pi === 0 ? 'Dispatch: 72M, chest pain, hx of MI, on aspirin and metoprolol...'
                                    : pi === 1 ? 'On scene: VS HR 110, BP 88/60, SpO\u2082 94%, diaphoretic, JVD present...'
                                    : 'Post-treatment: after NTG and IV fluid bolus, BP now 96/64...'
                                  }
                                  rows={2}
                                  className="bg-surface-1 text-sm mt-1"
                                />
                              </div>

                              {/* Vitals (Scene/Post-Scene phases) */}
                              {pi >= 1 && (
                                <div>
                                  <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Vitals (optional)</label>
                                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                                    {[
                                      { key: 'hr', label: 'HR', placeholder: '110/min' },
                                      { key: 'bp', label: 'BP', placeholder: '88/60' },
                                      { key: 'rr', label: 'RR', placeholder: '24/min' },
                                      { key: 'spo2', label: 'SpO\u2082', placeholder: '91%' },
                                      { key: 'etco2', label: 'EtCO\u2082', placeholder: '32' },
                                      { key: 'temp', label: 'Temp', placeholder: '98.4\u00B0F' },
                                      { key: 'bgl', label: 'BGL', placeholder: '142' },
                                      { key: 'map', label: 'MAP', placeholder: '69' },
                                    ].map((v) => (
                                      <div key={v.key} className="flex flex-col">
                                        <span className="text-[9px] font-medium text-zinc-400">{v.label}</span>
                                        <Input
                                          value={(phase.vitals as any)?.[v.key] || ''}
                                          onChange={(e) => updateData(q.id, (prev: CJSData) => ({
                                            ...prev,
                                            phases: prev.phases.map((p, i) => i === pi ? {
                                              ...p,
                                              vitals: { ...(p.vitals || {} as CJSVitals), [v.key]: e.target.value },
                                            } : p),
                                          }))}
                                          placeholder={v.placeholder}
                                          className="bg-surface-1 text-xs h-7 px-1.5"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* History & ECG (Scene/Post-Scene) */}
                              {pi >= 1 && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">History / Meds</label>
                                    <Input
                                      value={phase.history || ''}
                                      onChange={(e) => updateData(q.id, (prev: CJSData) => ({
                                        ...prev,
                                        phases: prev.phases.map((p, i) => i === pi ? { ...p, history: e.target.value } : p),
                                      }))}
                                      placeholder="HTN, DM2, metformin, lisinopril..."
                                      className="bg-surface-1 text-xs mt-1"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">ECG Findings</label>
                                    <Input
                                      value={phase.ecgFindings || ''}
                                      onChange={(e) => updateData(q.id, (prev: CJSData) => ({
                                        ...prev,
                                        phases: prev.phases.map((p, i) => i === pi ? { ...p, ecgFindings: e.target.value } : p),
                                      }))}
                                      placeholder="ST elevation in II, III, aVF..."
                                      className="bg-surface-1 text-xs mt-1"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Phase questions */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                                  Questions for this phase ({(phase.questions || []).length})
                                </label>
                                {(phase.questions || []).map((pq, qi) => (
                                  <div key={qi} className="rounded surface-2 ring-1 ring-zinc-200 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-400">Q{qi + 1}</span>
                                        <select
                                          value={pq.type}
                                          onChange={(e) => {
                                            const newType = e.target.value as TEIType;
                                            updateData(q.id, (prev: CJSData) => ({
                                              ...prev,
                                              phases: prev.phases.map((p, i) => i === pi ? {
                                                ...p,
                                                questions: p.questions.map((qq, j) => j === qi ? {
                                                  ...qq, type: newType, data: phaseQuestionDataForType(newType),
                                                } : qq),
                                              } : p),
                                            }));
                                          }}
                                          className="text-[10px] border border-zinc-200 rounded px-1.5 py-0.5 surface-1 text-zinc-600"
                                        >
                                          <option value="MC">MC</option>
                                          <option value="MR">MR (SATA)</option>
                                          <option value="BL">BL (Order)</option>
                                          <option value="DD">DD (Categorize)</option>
                                          <option value="OB">OB (Matrix)</option>
                                        </select>
                                      </div>
                                      {phase.questions.length > 1 && (
                                        <button onClick={() => updateData(q.id, (prev: CJSData) => ({
                                          ...prev,
                                          phases: prev.phases.map((p, i) => i === pi ? {
                                            ...p, questions: p.questions.filter((_, j) => j !== qi),
                                          } : p),
                                        }))} className="text-zinc-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                                      )}
                                    </div>
                                    <Input
                                      value={pq.stem}
                                      onChange={(e) => updateData(q.id, (prev: CJSData) => ({
                                        ...prev,
                                        phases: prev.phases.map((p, i) => i === pi ? {
                                          ...p,
                                          questions: p.questions.map((qq, j) => j === qi ? { ...qq, stem: e.target.value } : qq),
                                        } : p),
                                      }))}
                                      placeholder="Question for this phase..."
                                      className="bg-surface-1 text-sm"
                                    />
                                    {/* Type-specific editor for phase question */}
                                    {(() => {
                                      const updatePQ = (updater: (d: any) => any) => {
                                        updateData(q.id, (prev: CJSData) => ({
                                          ...prev,
                                          phases: prev.phases.map((p, i) => i === pi ? {
                                            ...p,
                                            questions: p.questions.map((qq, j) => j === qi ? { ...qq, data: updater(qq.data) } : qq),
                                          } : p),
                                        }));
                                      };

                                      if (pq.type === 'MC' || pq.type === 'MR') {
                                        const d = pq.data as (MCData | MRData);
                                        const isMR = pq.type === 'MR';
                                        return (
                                          <div className="space-y-1.5">
                                            {(d.options || []).map((opt: any, oi: number) => (
                                              <div key={oi} className="flex items-center gap-1.5">
                                                {isMR ? (
                                                  <button type="button" onClick={() => updatePQ((prev: MRData) => ({
                                                    ...prev, correctKeys: prev.correctKeys.includes(opt.key)
                                                      ? prev.correctKeys.filter((k: string) => k !== opt.key)
                                                      : [...prev.correctKeys, opt.key],
                                                  }))} className={`w-4 h-4 rounded border-2 flex-shrink-0 ${(d as MRData).correctKeys?.includes(opt.key) ? 'border-emerald-600 ring-1 ring-emerald-600/20' : 'border-zinc-600'}`} />
                                                ) : (
                                                  <button type="button" onClick={() => updatePQ((prev: MCData) => ({ ...prev, correctKey: opt.key }))}
                                                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${(d as MCData).correctKey === opt.key ? 'border-emerald-600 ring-1 ring-emerald-600/20' : 'border-zinc-600'}`} />
                                                )}
                                                <span className="text-[10px] font-mono text-zinc-400">{opt.key}.</span>
                                                <Input value={opt.text} onChange={(e) => updatePQ((prev: any) => ({
                                                  ...prev, options: prev.options.map((o: any, i: number) => i === oi ? { ...o, text: e.target.value } : o),
                                                }))} placeholder={`Option ${opt.key}`} className="bg-surface-1 text-xs h-8 flex-1" />
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      }

                                      if (pq.type === 'DD') {
                                        const d = pq.data as DDData;
                                        return (
                                          <div className="space-y-2">
                                            <p className="text-[10px] text-zinc-400 font-medium">Categories:</p>
                                            {d.categories.map((cat, ci) => (
                                              <Input key={ci} value={cat} onChange={(e) => updatePQ((prev: DDData) => ({
                                                ...prev, categories: prev.categories.map((c, i) => i === ci ? e.target.value : c),
                                              }))} placeholder={`Category ${ci + 1}`} className="bg-surface-1 text-xs h-8" />
                                            ))}
                                            <p className="text-[10px] text-zinc-400 font-medium mt-2">Items to categorize:</p>
                                            {d.items.map((item, ii) => (
                                              <div key={ii} className="flex items-center gap-1.5">
                                                <Input value={item.text} onChange={(e) => updatePQ((prev: DDData) => ({
                                                  ...prev, items: prev.items.map((it, i) => i === ii ? { ...it, text: e.target.value } : it),
                                                }))} placeholder={`Item ${ii + 1}`} className="bg-surface-1 text-xs h-8 flex-1" />
                                                <select value={d.correctMapping[item.id] || ''} onChange={(e) => updatePQ((prev: DDData) => ({
                                                  ...prev, correctMapping: { ...prev.correctMapping, [item.id]: e.target.value },
                                                }))} className="text-[10px] border border-zinc-200 rounded px-1 py-1 surface-1 text-zinc-600 min-w-[100px]">
                                                  <option value="">Category...</option>
                                                  {d.categories.filter(c => c.trim()).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                              </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => updatePQ((prev: DDData) => ({
                                              ...prev, items: [...prev.items, { id: `i${prev.items.length + 1}`, text: '' }],
                                            }))} className="text-[10px] h-6 section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-2.5 w-2.5 mr-1" />Item</Button>
                                          </div>
                                        );
                                      }

                                      if (pq.type === 'BL') {
                                        const d = pq.data as BLData;
                                        return (
                                          <div className="space-y-1.5">
                                            <p className="text-[10px] text-zinc-400 font-medium">Steps in correct order:</p>
                                            {d.items.map((item, ii) => (
                                              <div key={ii} className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-mono text-zinc-400 w-4 text-center flex-shrink-0">{ii + 1}</span>
                                                <Input value={item} onChange={(e) => updatePQ((prev: BLData) => ({
                                                  ...prev, items: prev.items.map((it, i) => i === ii ? e.target.value : it),
                                                }))} placeholder={`Step ${ii + 1}`} className="bg-surface-1 text-xs h-8 flex-1" />
                                              </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => updatePQ((prev: BLData) => ({
                                              ...prev, items: [...prev.items, ''],
                                            }))} className="text-[10px] h-6 section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-2.5 w-2.5 mr-1" />Step</Button>
                                          </div>
                                        );
                                      }

                                      if (pq.type === 'OB') {
                                        const d = pq.data as OBData;
                                        return (
                                          <div className="space-y-2">
                                            <p className="text-[10px] text-zinc-400 font-medium">Columns:</p>
                                            <div className="flex gap-1.5 flex-wrap">
                                              {d.columns.map((col, ci) => (
                                                <Input key={ci} value={col} onChange={(e) => updatePQ((prev: OBData) => ({
                                                  ...prev, columns: prev.columns.map((c, i) => i === ci ? e.target.value : c),
                                                }))} placeholder={`Col ${ci + 1}`} className="bg-surface-1 text-xs h-8 w-28" />
                                              ))}
                                              <Button variant="outline" size="sm" onClick={() => updatePQ((prev: OBData) => ({
                                                ...prev, columns: [...prev.columns, ''],
                                              }))} className="text-[10px] h-8 section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-2.5 w-2.5" /></Button>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-medium">Rows — select correct column:</p>
                                            {d.rows.map((row, ri) => (
                                              <div key={ri} className="flex items-center gap-1.5">
                                                <Input value={row} onChange={(e) => updatePQ((prev: OBData) => ({
                                                  ...prev, rows: prev.rows.map((r, i) => i === ri ? e.target.value : r),
                                                }))} placeholder={`Row ${ri + 1}`} className="bg-surface-1 text-xs h-8 flex-1" />
                                                <select value={d.correctAnswers[row] || ''} onChange={(e) => updatePQ((prev: OBData) => ({
                                                  ...prev, correctAnswers: { ...prev.correctAnswers, [row]: e.target.value },
                                                }))} className="text-[10px] border border-zinc-200 rounded px-1 py-1 surface-1 text-zinc-600 min-w-[100px]">
                                                  <option value="">Column...</option>
                                                  {d.columns.filter(c => c.trim()).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                              </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => updatePQ((prev: OBData) => ({
                                              ...prev, rows: [...prev.rows, ''],
                                            }))} className="text-[10px] h-6 section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-2.5 w-2.5 mr-1" />Row</Button>
                                          </div>
                                        );
                                      }

                                      return null;
                                    })()}

                                    {/* ECG strip picker per phase question */}
                                    <ECGStripPicker
                                      onSelect={(strip) => updateData(q.id, (prev: CJSData) => ({
                                        ...prev,
                                        phases: prev.phases.map((p, i) => i === pi ? {
                                          ...p,
                                          questions: p.questions.map((qq, j) => j === qi ? { ...qq, ecgStripId: strip?.id || undefined } : qq),
                                        } : p),
                                      }))}
                                    />
                                  </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => updateData(q.id, (prev: CJSData) => ({
                                  ...prev,
                                  phases: prev.phases.map((p, i) => i === pi ? {
                                    ...p,
                                    questions: [...p.questions, newPhaseQuestion('MC')],
                                  } : p),
                                }))} className="text-xs h-7 section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-3 w-3 mr-1" />Add Question to Phase</Button>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => updateData(q.id, (prev: CJSData) => ({
                            ...prev, phases: [...prev.phases, { label: `Phase ${prev.phases.length + 1}`, content: '', questions: [newPhaseQuestion('MC')] }],
                          }))} className="text-xs section-card text-zinc-600 hover:text-zinc-900"><Plus className="h-3 w-3 mr-1" />Add Phase</Button>
                        </div>
                      );
                    })()}

                    {/* ECG Strip Attachment */}
                    {q.type !== 'CJS' && (
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">ECG Strip (optional)</label>
                        <ECGStripPicker
                          onSelect={(strip) => updateQuestion(q.id, 'ecgStripId' as any, strip?.id || null)}
                        />
                      </div>
                    )}

                    {/* Rationale */}
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Rationale (shown after answering)</label>
                      <Textarea
                        value={q.rationale}
                        onChange={(e) => updateQuestion(q.id, 'rationale', e.target.value)}
                        placeholder="Explain why the correct answer is correct..."
                        rows={2}
                        className="bg-surface-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state / Add button */}
        {questions.length === 0 ? (
          <div className="section-card flex flex-col items-center justify-center py-16">
            <div className="surface-2 rounded-full p-4 mb-4">
              <Plus className="h-6 w-6 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-600">
              No questions yet
            </h3>
            <p className="mt-2 text-center text-zinc-400 max-w-sm text-sm">
              Start building your assessment by adding questions. Choose from any of the
              6 NREMT TEI formats.
            </p>
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button className="mt-6 gap-2 bg-white hover:bg-zinc-50 text-zinc-900">
                  <Plus className="h-4 w-4" />
                  Add First Question
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Select Question Type</DialogTitle>
                  <DialogDescription>
                    Choose the TEI format for this question.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
                  {(Object.keys(TEI_LABELS) as TEIType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => addQuestion(type)}
                      className="flex items-start gap-3 rounded-lg surface-1 ring-1 ring-zinc-200 p-4 text-left hover:ring-zinc-300 hover:bg-zinc-50/30 transition-colors"
                    >
                      <span className="surface-2 text-zinc-600 font-mono text-sm font-bold rounded px-2 py-1 leading-none">{type}</span>
                      <div>
                        <span className="text-sm font-medium text-zinc-700 block">{TEI_LABELS[type]}</span>
                        <span className="text-xs text-zinc-400 mt-0.5 block">{TEI_DESCRIPTIONS[type]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <button className="w-full rounded-lg border-2 border-dashed border-zinc-200 py-4 text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select Question Type</DialogTitle>
                <DialogDescription>
                  Choose the TEI format for this question.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2 py-4">
                {(Object.keys(TEI_LABELS) as TEIType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => addQuestion(type)}
                    className="flex flex-col items-start rounded-lg surface-1 ring-1 ring-zinc-200 p-3 text-left hover:ring-zinc-300 hover:bg-zinc-50/30 transition-colors"
                  >
                    <span className="surface-2 text-zinc-600 font-mono text-xs font-semibold rounded px-1.5 py-0.5">{type}</span>
                    <span className="text-xs text-zinc-400 mt-0.5">{TEI_DESCRIPTIONS[type]}</span>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Preview Modal */}
        {previewIndex !== null && questions.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewIndex(null)}>
            <div className="surface-1 ring-1 ring-zinc-200 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="surface-2 text-zinc-600 font-mono text-xs rounded px-2 py-0.5">{questions[previewIndex].type}</span>
                  <span className="text-sm text-zinc-400">Question {previewIndex + 1} of {questions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={previewIndex === 0}
                    onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                    className="section-card text-zinc-600 hover:text-zinc-900"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={previewIndex === questions.length - 1}
                    onClick={() => setPreviewIndex(Math.min(questions.length - 1, previewIndex + 1))}
                    className="section-card text-zinc-600 hover:text-zinc-900"
                  >
                    Next
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewIndex(null)} className="text-zinc-400 hover:text-zinc-900">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="border-t border-zinc-200" />
              {/* Render the question stem + ECG if attached */}
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 mb-4 leading-relaxed">
                  {questions[previewIndex].stem || '(No stem entered)'}
                </h2>
                {/* ECG strip preview */}
                {(questions[previewIndex] as any).ecgStripId && (
                  <ECGPreviewInline stripId={(questions[previewIndex] as any).ecgStripId} />
                )}
                {/* Preview based on type */}
                {(() => {
                  const q = questions[previewIndex];
                  const d = q.data;

                  if (q.type === 'MC') {
                    const mc = d as MCData;
                    return (
                      <div className="space-y-2">
                        {mc.options.map((opt) => (
                          <div key={opt.key} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                            mc.correctKey === opt.key ? 'border-emerald-600/30 bg-emerald-600/5' : 'border-zinc-200'
                          }`}>
                            <span className="text-sm font-mono font-bold text-zinc-400">{opt.key}.</span>
                            <span className="text-sm text-zinc-700">{opt.text || '(empty)'}</span>
                            {mc.correctKey === opt.key && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (q.type === 'MR') {
                    const mr = d as MRData;
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-400 font-medium mb-2">Select all that apply</p>
                        {mr.options.map((opt) => (
                          <div key={opt.key} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                            mr.correctKeys.includes(opt.key) ? 'border-emerald-600/30 bg-emerald-600/5' : 'border-zinc-200'
                          }`}>
                            <span className="text-sm font-mono font-bold text-zinc-400">{opt.key}.</span>
                            <span className="text-sm text-zinc-700">{opt.text || '(empty)'}</span>
                            {mr.correctKeys.includes(opt.key) && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (q.type === 'BL') {
                    const bl = d as BLData;
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-400 font-medium mb-2">Arrange in correct order</p>
                        {bl.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3">
                            <span className="text-xs font-mono font-semibold text-zinc-400 w-5 text-center">{i + 1}</span>
                            <span className="text-sm text-zinc-700">{item || '(empty)'}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (q.type === 'DD') {
                    const dd = d as DDData;
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {dd.items.map((item) => (
                            <span key={item.id} className="px-3 py-1.5 rounded surface-2 ring-1 ring-zinc-200 text-xs font-medium text-zinc-600">
                              {item.text || '(empty)'}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {dd.categories.filter(c => c.trim()).map((cat) => (
                            <div key={cat} className="rounded border-2 border-dashed border-zinc-300 p-4 text-center min-h-[60px]">
                              <p className="text-xs font-semibold text-zinc-400">{cat}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (q.type === 'OB') {
                    const ob = d as OBData;
                    return (
                      <div className="rounded-lg surface-2 ring-1 ring-zinc-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-200">
                              <th className="text-left py-2 px-3 font-medium text-zinc-400">Statement</th>
                              {ob.columns.filter(c => c.trim()).map((col) => (
                                <th key={col} className="text-center py-2 px-3 font-medium text-zinc-400">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ob.rows.filter(r => r.trim()).map((row, ri) => (
                              <tr key={ri} className="border-t border-zinc-200/50">
                                <td className="py-2 px-3 text-zinc-600">{row}</td>
                                {ob.columns.filter(c => c.trim()).map((col) => (
                                  <td key={col} className="text-center py-2 px-3">
                                    <div className={`w-5 h-5 rounded-full border-2 mx-auto ${
                                      ob.correctAnswers[row] === col ? 'border-white bg-white' : 'border-zinc-600'
                                    }`} />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  return <p className="text-sm text-zinc-400 italic">Preview not available for {q.type} type yet</p>;
                })()}
              </div>
              {/* Rationale */}
              {questions[previewIndex].rationale && (
                <>
                  <div className="border-t border-zinc-200" />
                  <div className="border-l-2 border-zinc-300 pl-4">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Rationale</p>
                    <p className="text-sm text-zinc-400">{questions[previewIndex].rationale}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* AI Question Writer Panel */}
        <AIAssistantPanel
          open={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          certLevel={certLevel}
          onAcceptQuestions={(acceptedQuestions) => {
            const newQuestions = acceptedQuestions.map((q: any) => {
              const type = (q.item_type || 'MC') as TEIType;
              const base = createBlankQuestion(type);
              return {
                ...base,
                stem: q.stem || '',
                data: q.options || base.data,
                rationale: q.rationale || '',
                expanded: false,
              };
            });
            setQuestions((prev) => [...prev, ...newQuestions]);
            setAiPanelOpen(false);
            setSaveMessage(`Added ${newQuestions.length} AI-generated question${newQuestions.length !== 1 ? 's' : ''}!`);
            setTimeout(() => setSaveMessage(''), 3000);
          }}
        />
      </div>
    </div>
  );
}

export default function TestBuilderPage() {
  return (
    <InstructorGuard>
      <TestBuilderContent />
    </InstructorGuard>
  );
}
