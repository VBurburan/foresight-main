/**
 * Adapts raw Supabase question data to the format expected by
 * question-type components and the question player.
 *
 * DB format:  options: {"A": "text", "B": "text"}
 * Component:  options: [{id: "A", text: "text"}, ...]
 *
 * DB format:  correct_answer: "B" (MC) | ["A","C"] (MR) | {"q1":"cat"} (DD) | [2,1,4] (BL)
 * Component:  correct_answer: {answer: "B"} | {answers: ["A","C"]} | {categories: {...}} | {order: [...]}
 */

import type { Question, ItemType, Json } from '@/types/database';

export interface AdaptedOption {
  id: string;
  text: string;
  section?: 'causes' | 'interventions' | 'condition';
}

export interface AdaptedQuestion {
  id: string;
  stem: string;
  item_type: string;
  options: AdaptedOption[];
  correct_answer: any;
  rationale: string;
  rationales_distractors: Record<string, string> | null;
  domain_id: string;
  difficulty: string;
  cj_step: string;
  clinical_scenario?: string;
  image_url?: string;
  ecg_strip_id?: string;
  ecg_strip?: {
    image_url: string;
    rhythm_label: string;
    source_dataset: string;
    source_license: string;
  };
  // Raw DB fields for scoring
  raw_item_type: ItemType;
  raw_correct_answer: Json;
  raw_options: Json;
}

/**
 * Adapt a raw DB question to the format expected by components.
 */
export function adaptQuestion(q: Question, ecgStrip?: any): AdaptedQuestion {
  const itemType = q.item_type;
  const options = adaptOptions(itemType, q.options);
  const correctAnswer = adaptCorrectAnswer(itemType, q.correct_answer, q.options);

  return {
    id: q.id,
    stem: q.stem,
    item_type: mapItemTypeToComponent(itemType),
    options,
    correct_answer: correctAnswer,
    rationale: q.rationale_correct,
    rationales_distractors: q.rationales_distractors as Record<string, string> | null,
    domain_id: q.domain_id,
    difficulty: q.difficulty || 'medium',
    cj_step: q.cj_steps?.[0] || '',
    clinical_scenario: q.scenario_context || undefined,
    image_url: q.image_url || undefined,
    ecg_strip_id: q.ecg_strip_id || undefined,
    ecg_strip: ecgStrip
      ? {
          image_url: ecgStrip.image_url,
          rhythm_label: ecgStrip.rhythm_label,
          source_dataset: ecgStrip.source_dataset || 'PTB-XL',
          source_license: ecgStrip.source_license || 'CC-BY-4.0',
        }
      : undefined,
    raw_item_type: itemType,
    raw_correct_answer: q.correct_answer,
    raw_options: q.options,
  };
}

/**
 * Map DB item_type enum to component switch-case string.
 */
function mapItemTypeToComponent(itemType: ItemType): string {
  switch (itemType) {
    case 'MC':
      return 'multiple_choice';
    case 'MR':
      return 'multiple_response';
    case 'DD':
      return 'drag_and_drop';
    case 'BL':
      return 'ordered_response';
    case 'OB':
      return 'options_box';
    case 'CL':
      return 'cloze';
    default:
      return 'multiple_choice';
  }
}

/**
 * Adapt options from DB format to component format.
 */
function adaptOptions(itemType: ItemType, rawOptions: Json): AdaptedOption[] {
  if (!rawOptions) return [];

  // Already in array format [{id, text}]
  if (Array.isArray(rawOptions)) {
    return rawOptions.map((opt: any) => ({
      id: opt.id || String(opt),
      text: opt.text || opt.description || String(opt),
      section: opt.section,
    }));
  }

  // Object format {"A": "text", "B": "text"}
  if (typeof rawOptions === 'object') {
    const obj = rawOptions as Record<string, any>;

    // DD format: { patients: [...], categories: [...] } OR { items: [...], categories: [...] }
    if (itemType === 'DD') {
      const ddItems = obj.patients || obj.items;
      if (ddItems && Array.isArray(ddItems)) {
        return (ddItems as any[]).map((p: any) => {
          // Handle string items directly
          if (typeof p === 'string') return { id: p, text: p };
          // Handle object items — extract text from any reasonable property
          const text = p.text || p.description || p.name || p.label || p.scenario || p.condition || p.statement ||
            // Last resort: join all string values from the object
            Object.values(p).filter((v: any) => typeof v === 'string' && v.length > 2).join(' — ') ||
            JSON.stringify(p);
          const id = p.id || text;
          return { id, text };
        });
      }
      // Fallback: if DD options are a flat object like {"item1": "Category1", ...}
      // the items might be the keys of correct_answer
      return [];
    }

    // OB format: { rows: [...], headers/columns: [...] } OR { conditions: [...], categories: [...] }
    // Return empty — OptionsBox reads raw_options directly to avoid data loss.
    if (itemType === 'OB') {
      return [];
    }

    // BL format: { "0": "text", "1": "text" }
    if (itemType === 'BL') {
      return Object.entries(obj).map(([key, val]) => ({
        id: key,
        text: String(val),
      }));
    }

    // CL format: handled by CLCloze component
    if (itemType === 'CL') {
      return [];
    }

    // Default: MC/MR format {"A": "text", "B": "text"}
    return Object.entries(obj).map(([key, val]) => ({
      id: key,
      text: String(val),
    }));
  }

  return [];
}

/**
 * Adapt correct_answer from DB format to component format.
 */
function adaptCorrectAnswer(itemType: ItemType, rawAnswer: Json, rawOptions: Json): any {
  switch (itemType) {
    case 'MC':
      // DB: "B" -> Component: { answer: "B" }
      return { answer: typeof rawAnswer === 'string' ? rawAnswer : String(rawAnswer) };

    case 'MR':
      // DB: ["A", "C", "E"] -> Component: { answers: ["A", "C", "E"] }
      return { answers: Array.isArray(rawAnswer) ? rawAnswer.map(String) : [] };

    case 'DD': {
      // DB: {"q45a": "RED", "q45b": "GREEN"} -> Component: { categories: {...} }
      // Need to invert: group by category value
      if (typeof rawAnswer === 'object' && !Array.isArray(rawAnswer)) {
        const obj = rawAnswer as Record<string, any>;
        const categories: Record<string, string[]> = {};
        for (const [itemId, categoryName] of Object.entries(obj)) {
          const cat = String(categoryName);
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(itemId);
        }
        return { categories };
      }
      return { categories: {} };
    }

    case 'BL':
      // DB: [2, 1, 4, 0, 3] -> Component: { order: ["2", "1", "4", "0", "3"] }
      return {
        order: Array.isArray(rawAnswer)
          ? rawAnswer.map(String)
          : [],
      };

    case 'OB':
      // Passed through as-is, OBMatrix handles it
      return rawAnswer;

    case 'CL':
      // Passed through as-is, CLCloze handles it
      return rawAnswer;

    default:
      return rawAnswer;
  }
}

/**
 * Convert a component response back to DB format for scoring.
 */
export function responseToDbFormat(
  itemType: ItemType,
  componentResponse: any
): Json {
  if (componentResponse == null) return null;

  switch (itemType) {
    case 'MC':
      return typeof componentResponse === 'string'
        ? componentResponse
        : componentResponse?.answer || componentResponse;

    case 'MR':
      return Array.isArray(componentResponse)
        ? componentResponse
        : componentResponse?.answers || componentResponse;

    case 'DD': {
      // Component: { categories: { "RED": ["q1","q2"], "GREEN": ["q3"] } }
      // DB: { "q1": "RED", "q2": "RED", "q3": "GREEN" }
      if (componentResponse?.categories) {
        const result: Record<string, string> = {};
        for (const [category, items] of Object.entries(componentResponse.categories)) {
          for (const itemId of items as string[]) {
            result[itemId] = category;
          }
        }
        return result;
      }
      return componentResponse;
    }

    case 'BL':
      return Array.isArray(componentResponse)
        ? componentResponse.map(String)
        : componentResponse?.order
          ? (componentResponse.order as any[]).map(String)
          : componentResponse;

    case 'OB':
    case 'CL':
      return componentResponse;

    default:
      return componentResponse;
  }
}
