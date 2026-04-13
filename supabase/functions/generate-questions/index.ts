import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") || '';

const GEN_MODEL = 'gpt-4.1';
const REVIEW_MODEL = 'gpt-4o';
const CLAUDE_MODEL = 'claude-opus-4-20250514';
type ModelOption = 'gpt-4.1' | 'claude-opus-4' | 'gpt-4o';

interface ItemSpec { type: string; count: number; }
interface GenerateRequest {
  items?: ItemSpec[]; count?: number; item_type?: string; item_types?: ItemSpec[];
  certification_level?: string; domain?: string; difficulty?: string;
  cj_functions?: string[]; topic_hint?: string; model?: ModelOption;
  generate_mode?: 'standard' | 'cjs';
}

// Standard CJ function names (must match analytics aggregation)
const CJ_FUNCTION_NAMES = [
  'Recognize Cues', 'Analyze Cues', 'Prioritize Hypotheses',
  'Generate Solutions', 'Take Actions', 'Evaluate Outcomes'
];

async function embed(text: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST", headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) })
  });
  if (!r.ok) throw new Error(`Embedding error`);
  return (await r.json()).data[0].embedding;
}

// Fetch exact NREMT domain names from the domains table for the requested level
async function fetchDomainNames(sb: any, level: string): Promise<string[]> {
  const { data } = await sb.from('domains').select('name').eq('level', level).order('display_order');
  return data ? data.map((d: any) => d.name) : [];
}

async function fetchScopeAndFormulary(sb: any, level: string): Promise<string> {
  const parts: string[] = [];
  const { data: scope } = await sb.from('rag_chunks').select('content')
    .eq('category', 'scope_verification').eq('subcategory', level);
  if (scope?.length) {
    parts.push(`=== ${level.toUpperCase()} SCOPE OF PRACTICE (MANDATORY) ===`);
    scope.forEach((r: any) => parts.push(r.content));
  }
  const levelHierarchy: Record<string, string[]> = {
    'Paramedic': ['Paramedic', 'AEMT', 'EMT'],
    'AEMT': ['AEMT', 'EMT'],
    'EMT': ['EMT'],
  };
  for (const lv of (levelHierarchy[level] || [level])) {
    const { data: meds } = await sb.from('rag_chunks').select('title, content')
      .eq('category', 'reference_content').eq('subcategory', 'medications')
      .ilike('title', `%${lv}%`);
    if (meds?.length) {
      parts.push(`=== ${lv.toUpperCase()} MEDICATION FORMULARY ===`);
      meds.forEach((r: any) => parts.push(r.content));
    }
  }
  return parts.join('\n\n');
}

async function fetchRAG(sb: any, topic: string, level: string, domain: string): Promise<string> {
  const parts: string[] = [];
  try {
    const emb = await embed(topic);
    const { data } = await sb.rpc('match_rag_chunks', { query_embedding: emb, match_threshold: 0.2, match_count: 12, filter_category: null, filter_level: level || null });
    if (data?.length) { parts.push('--- Clinical Content ---'); data.forEach((c: any) => parts.push(`[${c.category}] ${c.content}`)); }
  } catch (e) { console.error('RAG topic error:', e); }
  if (domain && domain !== topic) {
    try {
      const emb2 = await embed(`${domain} ${level} EMS protocols`);
      const { data } = await sb.rpc('match_rag_chunks', { query_embedding: emb2, match_threshold: 0.25, match_count: 8, filter_category: null, filter_level: level || null });
      if (data?.length) { parts.push('--- Domain Content ---'); data.forEach((c: any) => parts.push(`[${c.category}] ${c.content}`)); }
    } catch (e) { console.error('RAG domain error:', e); }
  }
  try {
    const emb4 = await embed(`${topic} protocol algorithm treatment steps ${level}`);
    const { data } = await sb.rpc('match_rag_chunks', { query_embedding: emb4, match_threshold: 0.25, match_count: 5, filter_category: null, filter_level: null });
    if (data?.length) { parts.push('--- Protocols ---'); data.forEach((c: any) => parts.push(`[${c.category}] ${c.content}`)); }
  } catch {}
  return parts.join('\n\n');
}

async function fetchRules(sb: any, types: string[]): Promise<string> {
  const parts: string[] = [];
  const queries = [
    sb.from('rag_chunks').select('content').eq('category', 'item_analysis').is('subcategory', null).limit(15),
    sb.from('rag_chunks').select('content').eq('category', 'item_analysis').eq('subcategory', 'distractor_quality'),
    sb.from('rag_chunks').select('content').eq('category', 'item_analysis').eq('subcategory', 'scoring').limit(5),
    sb.from('rag_chunks').select('content').eq('category', 'item_analysis').eq('subcategory', 'clinical_content').limit(8),
    sb.from('rag_chunks').select('content').eq('category', 'grading').limit(5),
  ];
  const results = await Promise.all(queries);
  const labels = ['ITEM WRITING RULES', 'DISTRACTOR QUALITY', 'SCORING', 'CLINICAL INSIGHTS', 'GRADING'];
  results.forEach((r, i) => { if (r.data?.length) { parts.push(`=== ${labels[i]} ===`); r.data.forEach((d: any) => parts.push(d.content)); } });
  for (const t of types) {
    const { data } = await sb.from('rag_chunks').select('content').eq('category', 'item_analysis').eq('subcategory', 'item_format').ilike('content', `%${t}%`).limit(5);
    if (data?.length) { parts.push(`=== ${t} FORMAT RULES ===`); data.forEach((r: any) => parts.push(r.content)); }
  }
  return parts.join('\n\n');
}

async function fetchGuidance(sb: any, types: string[]): Promise<string> {
  const parts: string[] = [];
  const { data: cj } = await sb.from('v_cj_guidance').select('cj_step, guidance');
  if (cj?.length) { parts.push('=== CJ FRAMEWORK ==='); cj.forEach((r: any) => parts.push(`[${r.cj_step}] ${r.guidance}`)); }
  for (const t of types) {
    const { data } = await sb.from('v_tei_strategies').select('strategy').eq('tei_format', t);
    if (data?.length) { parts.push(`=== ${t} STRATEGIES ===`); data.forEach((r: any) => parts.push(r.strategy)); }
  }
  const { data: err } = await sb.from('v_diagnostic_context').select('content').limit(8);
  if (err?.length) { parts.push('=== ERROR PATTERNS ==='); err.forEach((r: any) => parts.push(r.content)); }
  return parts.join('\n\n');
}

async function fetchExamples(sb: any, types: string[], level: string): Promise<string> {
  const parts: string[] = [];
  for (const t of types) {
    let { data } = await sb.from('questions').select('stem, options, correct_answer, rationale_correct, cj_steps, difficulty').eq('item_type', t).eq('level', level).eq('is_active', true).limit(3);
    if (!data?.length) { const fb = await sb.from('questions').select('stem, options, correct_answer, rationale_correct, cj_steps, difficulty').eq('item_type', t).eq('is_active', true).limit(3); data = fb.data; }
    if (data?.length) { parts.push(`=== ${t} EXAMPLES ===`); data.forEach((q: any, i: number) => parts.push(`Ex${i+1}: Stem: ${q.stem}\nOptions: ${JSON.stringify(q.options)}\nCorrect: ${JSON.stringify(q.correct_answer)}\nRationale: ${q.rationale_correct}\nCJ: ${q.cj_steps}\nDiff: ${q.difficulty}`)); }
  }
  return parts.join('\n\n');
}

function schema(t: string): string {
  const s: Record<string, string> = {
    MC: 'MC: 4 options A-D, 1 correct. {"options":[{"key":"A","text":"..."},...],correctKey":"B"}.',
    MR: 'MR: 5-6 options, 2-3 correct. {"options":[{"key":"A","text":"..."},...],correctKeys":["A","C"]}.',
    DD: 'DD: 4-6 items into 2-3 DISTINCT categories. {"items":[{"id":"i1","text":"..."},...],categories":["Cat1","Cat2"],"correctMapping":{"i1":"Cat1",...}}.',
    OB: 'OB: 3-4 rows x 2-3 columns matrix. {"rows":["Scenario1",...],columns":["Option1","Option2",...],correctAnswers":{"Scenario1":"Option2",...}}.',
    BL: 'BL: 3-5 items to sequence. {"items":["item1",...],correctOrder":[0,1,2]}.',
  };
  return s[t] || s.MC;
}

function extractJSON(text: string): string {
  const m = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  return m ? m[1].trim() : text.trim();
}

async function callOpenAI(system: string, user: string, model: string, jsonMode = true): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], ...(jsonMode ? { response_format: { type: "json_object" } } : {}), temperature: 0.7, max_tokens: 16384 })
  });
  if (!r.ok) throw new Error(`OpenAI error (${model}): ${await r.text()}`);
  return (await r.json()).choices[0].message.content;
}

async function callClaude(system: string, user: string): Promise<string> {
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set');
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 16384, system: system + "\n\nReturn ONLY valid JSON.", messages: [{ role: "user", content: user }] })
  });
  if (!r.ok) throw new Error(`Anthropic error: ${await r.text()}`);
  return extractJSON((await r.json()).content[0].text);
}

async function callAI(system: string, user: string, model: ModelOption): Promise<string> {
  return model === 'claude-opus-4' ? callClaude(system, user) : callOpenAI(system, user, model, true);
}

async function reviewAndFix(questions: any[], rules: string, scopeFormulary: string, types: string[], level: string, domainNames: string[], reviewModel: ModelOption): Promise<any[]> {
  const domainList = domainNames.length > 0 ? `\nVALID DOMAINS (use EXACT names): ${domainNames.join(', ')}` : '';
  const cjList = `\nVALID CJ FUNCTIONS (use EXACT names): ${CJ_FUNCTION_NAMES.join(', ')}`;
  const reviewPrompt = `You are a senior EMS psychometrician reviewing AI-generated exam questions.\n\nReview EACH question:\n1. STEM: 200+ chars, full clinical vignette.\n2. DISTRACTORS: Each wrong for ONE reason.\n3. CORRECT ANSWER: Clinically defensible.\n4. RATIONALE: Plain text string.\n5. SCOPE: Within ${level} scope only.\n6. FORMAT: Must match schema.\n7. CJ FUNCTIONS: 1-2 per question from valid list.\n8. DOMAIN: Must be one of the valid NREMT domains.\n9. DIFFICULTY: easy/medium/hard.\n10. BIAS: No stigmatizing language.\n${domainList}\n${cjList}\n\n${scopeFormulary}\n\n${rules}\n\nReturn JSON: {"questions": [...]} with ALL fields fixed.`;
  const userMsg = `Review and fix these ${questions.length} questions for ${level}:\n\n${JSON.stringify(questions, null, 2)}`;
  try {
    const raw = await callAI(reviewPrompt, userMsg, reviewModel);
    const parsed = JSON.parse(raw);
    const reviewed = parsed.questions || parsed;
    if (Array.isArray(reviewed) && reviewed.length > 0) {
      return reviewed.map((q: any) => ({ ...q, rationale: typeof q.rationale === 'string' ? q.rationale : JSON.stringify(q.rationale || '', null, 2) }));
    }
  } catch (e) { console.error('Review failed:', e); }
  return questions.map((q: any) => ({ ...q, rationale: typeof q.rationale === 'string' ? q.rationale : JSON.stringify(q.rationale || '', null, 2) }));
}

function normalize(p: GenerateRequest): ItemSpec[] {
  if (p.items?.length) return p.items.filter(i => i.count > 0);
  if (p.item_types?.length) return p.item_types.filter(i => i.count > 0);
  return [{ type: p.item_type || 'MC', count: p.count || 5 }];
}

function resolveModels(requested?: ModelOption): { genModel: ModelOption; reviewModel: ModelOption; label: string } {
  switch (requested) {
    case 'claude-opus-4': return { genModel: 'claude-opus-4', reviewModel: 'claude-opus-4', label: `${CLAUDE_MODEL} (gen+review)` };
    case 'gpt-4o': return { genModel: 'gpt-4o', reviewModel: 'gpt-4o', label: 'gpt-4o (gen+review)' };
    default: return { genModel: 'gpt-4.1', reviewModel: 'gpt-4o', label: 'gpt-4.1 (gen) + gpt-4o (review)' };
  }
}

// ─── CJS Multi-Phase Generation Pipeline ─────────────────────────
async function generateCJS(
  sb: any, level: string, diff: string, domain: string, topic: string,
  genModel: ModelOption, reviewModel: ModelOption
): Promise<{ scenario: any; metadata: any }> {
  const [scopeFormulary, domainNames, rag, rules, guidance, examples] = await Promise.all([
    fetchScopeAndFormulary(sb, level),
    fetchDomainNames(sb, level),
    fetchRAG(sb, topic, level, domain),
    fetchRules(sb, ['MC', 'MR', 'DD', 'BL', 'OB']),
    fetchGuidance(sb, ['MC', 'MR', 'DD', 'BL', 'OB']),
    fetchExamples(sb, ['MC', 'MR', 'DD', 'BL', 'OB'], level),
  ]);

  const domainConstraint = domainNames.length > 0
    ? `\nNREMT CONTENT DOMAINS for ${level}: ${domainNames.join(', ')}` : '';
  const cjConstraint = `\nCLINICAL JUDGMENT FUNCTIONS: ${CJ_FUNCTION_NAMES.join(', ')}`;

  // ── STEP 1: Generate Scenario Backbone ──
  console.log(`[generate-cjs] Step 1: Generating scenario backbone...`);
  const backboneSystem = `You are an expert EMS psychometrician creating an NREMT-style Clinical Judgment Scenario (CJS) for ${level} certification.

A CJS is a multi-phase patient encounter with 3 phases: En Route, Scene, Post Scene.
- En Route: Dispatch information, patient history, medications received while responding. No vitals yet.
- Scene: On-scene assessment with full vitals, physical exam findings, diagnostics (ECG findings if relevant).
- Post Scene: Post-treatment reassessment. Vitals change in response to interventions. Condition may improve or worsen.

The scenario must follow ONE patient throughout all 3 phases with clinically realistic progression.

CRITICAL: All medications, interventions, and procedures MUST be within ${level} scope of practice.
${scopeFormulary}
${domainConstraint}

${rag ? '=== CLINICAL CONTEXT ===\n' + rag : ''}

Return JSON:
{
  "patient": { "age": number, "sex": "M"|"F", "location": "string", "chief_complaint": "string" },
  "phases": [
    {
      "label": "En Route",
      "content": "Dispatch narrative with patient history and medications (200+ chars)",
      "history": "PMH, medications, allergies",
      "vitals": null
    },
    {
      "label": "Scene",
      "content": "On-scene assessment narrative with physical exam findings (300+ chars)",
      "history": "Additional history gathered on scene",
      "vitals": { "hr": "string", "bp": "string", "rr": "string", "spo2": "string", "etco2": "string", "temp": "string", "bgl": "string", "map": "string" },
      "ecgFindings": "ECG interpretation if relevant, or null"
    },
    {
      "label": "Post Scene",
      "content": "Post-treatment narrative describing interventions performed and reassessment (300+ chars)",
      "history": "Treatment administered",
      "vitals": { "hr": "string", "bp": "string", "rr": "string", "spo2": "string", "etco2": "string", "temp": "string", "bgl": "string", "map": "string" },
      "ecgFindings": "Updated ECG if changed, or null"
    }
  ]
}`;

  const backboneUser = `Create a CJS scenario backbone for ${level}, difficulty: ${diff}.
${domain ? 'Primary domain: ' + domain : 'Choose an appropriate NREMT domain.'}
${topic !== 'EMS patient assessment' ? 'Topic focus: ' + topic : ''}
The patient condition MUST evolve realistically across all 3 phases with measurable changes in vitals after interventions.`;

  const backboneRaw = await callAI(backboneSystem, backboneUser, genModel);
  let backbone: any;
  try { backbone = JSON.parse(backboneRaw); } catch { backbone = JSON.parse(extractJSON(backboneRaw)); }
  if (!backbone?.phases || backbone.phases.length < 3) throw new Error('CJS backbone generation failed — invalid phase structure');
  console.log(`[generate-cjs] Step 1 done: ${backbone.patient?.chief_complaint || 'scenario'}`);

  // ── STEP 2: Generate Phase Questions ──
  console.log(`[generate-cjs] Step 2: Generating phase questions...`);
  const schemas = ['MC', 'MR', 'DD', 'BL', 'OB'].map(t => schema(t)).join('\n');

  const questionsSystem = `You are an expert EMS psychometrician generating questions for a Clinical Judgment Scenario (CJS).

You will receive a 3-phase patient scenario. Generate questions for EACH phase that test clinical reasoning appropriate to the information available at that phase.

RULES:
1. En Route (2-3 questions): Test anticipatory thinking, medication knowledge, differential diagnosis. Use DD, MC, or MR.
2. Scene (2-3 questions): Test assessment interpretation, prioritization. Use MC, BL, or MR.
3. Post Scene (2-3 questions): Test treatment evaluation, reassessment decisions, pharmacology. Use OB, MR, or MC.
4. Total: 7-9 questions across all 3 phases.
5. Each stem: 150+ chars with specific reference to the scenario information available at that phase.
6. Distribute TEI types — do NOT make all questions MC. Use at least 3 different types.
7. Each distractor must be wrong for exactly ONE clinical reason.
8. All medications/interventions within ${level} scope.
${domainConstraint}
${cjConstraint}

SCHEMAS:
${schemas}

${scopeFormulary}
${rules}
${guidance}
${examples}

Return JSON:
{
  "phases": [
    {
      "questions": [
        {
          "stem": "Based on the dispatch information, ...",
          "type": "DD",
          "data": { ... matching schema ... },
          "domain": "exact NREMT domain name",
          "cj_functions": ["Recognize Cues"],
          "difficulty": "medium",
          "rationale": "Explanation string"
        }
      ]
    },
    { "questions": [...] },
    { "questions": [...] }
  ]
}`;

  const scenarioContext = backbone.phases.map((p: any, i: number) =>
    `=== PHASE ${i+1}: ${p.label} ===\n${p.content}\n${p.history ? 'History: ' + p.history : ''}${p.vitals ? '\nVitals: ' + JSON.stringify(p.vitals) : ''}${p.ecgFindings ? '\nECG: ' + p.ecgFindings : ''}`
  ).join('\n\n');

  const questionsUser = `Patient: ${backbone.patient?.age}yo ${backbone.patient?.sex}, ${backbone.patient?.chief_complaint} at ${backbone.patient?.location}

${scenarioContext}

Generate 7-9 questions distributed across the 3 phases. Use at least 3 different TEI types (MC, MR, DD, BL, OB).
REMINDER: "domain" MUST be one of: ${domainNames.join(', ')}
REMINDER: "cj_functions" MUST use: ${CJ_FUNCTION_NAMES.join(', ')}`;

  const questionsRaw = await callAI(questionsSystem, questionsUser, genModel);
  let questionData: any;
  try { questionData = JSON.parse(questionsRaw); } catch { questionData = JSON.parse(extractJSON(questionsRaw)); }
  if (!questionData?.phases || questionData.phases.length < 3) throw new Error('CJS question generation failed');

  const totalQs = questionData.phases.reduce((s: number, p: any) => s + (p.questions?.length || 0), 0);
  console.log(`[generate-cjs] Step 2 done: ${totalQs} questions across 3 phases`);

  // ── STEP 3: Clinical Review ──
  console.log(`[generate-cjs] Step 3: Reviewing clinical consistency...`);
  const reviewSystem = `You are a senior EMS psychometrician reviewing an AI-generated Clinical Judgment Scenario (CJS) for ${level}.

Review the ENTIRE scenario for:
1. CLINICAL CONSISTENCY: Do vitals evolve realistically? Are interventions appropriate? Do reassessment findings match treatment?
2. SCOPE COMPLIANCE: All medications/interventions within ${level} scope.
3. QUESTION QUALITY: Each stem 150+ chars, distractors wrong for one reason, correct answers defensible.
4. FORMAT VALIDITY: Each question's data matches its type schema.
5. DOMAIN ACCURACY: Domains must be exact NREMT names: ${domainNames.join(', ')}
6. CJ FUNCTIONS: Must use exact names: ${CJ_FUNCTION_NAMES.join(', ')}
7. RATIONALE: Must be a plain text string for each question.

${scopeFormulary}

Fix any issues and return the complete corrected scenario.

Return JSON:
{
  "phases": [
    {
      "label": "string",
      "content": "string",
      "history": "string",
      "vitals": { ... } | null,
      "ecgFindings": "string" | null,
      "questions": [
        { "stem": "string", "type": "MC|MR|DD|BL|OB", "data": { ... }, "domain": "string", "cj_functions": ["string"], "difficulty": "string", "rationale": "string" }
      ]
    }
  ]
}`;

  // Merge backbone + questions for review
  const mergedPhases = backbone.phases.map((phase: any, i: number) => ({
    ...phase,
    questions: questionData.phases[i]?.questions || [],
  }));

  const reviewUser = `Review and fix this CJS scenario for ${level}:\n\nPatient: ${JSON.stringify(backbone.patient)}\n\n${JSON.stringify({ phases: mergedPhases }, null, 2)}`;

  const reviewRaw = await callAI(reviewSystem, reviewUser, reviewModel);
  let reviewed: any;
  try { reviewed = JSON.parse(reviewRaw); } catch { reviewed = JSON.parse(extractJSON(reviewRaw)); }

  const finalPhases = (reviewed?.phases || mergedPhases).map((p: any) => ({
    label: p.label,
    content: p.content,
    history: p.history || '',
    vitals: p.vitals || null,
    ecgFindings: p.ecgFindings || null,
    questions: (p.questions || []).map((q: any) => ({
      stem: q.stem,
      type: q.type || 'MC',
      data: q.data || q.options || {},
      domain: q.domain,
      cj_functions: q.cj_functions || [],
      difficulty: q.difficulty || diff,
      rationale: typeof q.rationale === 'string' ? q.rationale : JSON.stringify(q.rationale || ''),
    })),
  }));

  const finalTotal = finalPhases.reduce((s: number, p: any) => s + p.questions.length, 0);
  console.log(`[generate-cjs] Step 3 done: ${finalTotal} reviewed questions`);

  return {
    scenario: { phases: finalPhases, patient: backbone.patient },
    metadata: {
      total_questions: finalTotal,
      level, difficulty: diff, domain: domain || 'mixed',
      gen_model: genModel === 'claude-opus-4' ? CLAUDE_MODEL : genModel,
      review_model: reviewModel === 'claude-opus-4' ? CLAUDE_MODEL : reviewModel,
      valid_domains: domainNames,
      pipeline: 'cjs-v1',
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });

  try {
    const params: GenerateRequest = await req.json();
    const { genModel, reviewModel, label } = resolveModels(params.model);
    const sb = createClient(supabaseUrl, supabaseServiceKey);
    const level = params.certification_level || 'Paramedic';
    const diff = params.difficulty || 'medium';
    const domain = params.domain || '';
    const topic = params.topic_hint || domain || 'EMS patient assessment';

    // ── CJS Pipeline ──
    if (params.generate_mode === 'cjs') {
      console.log(`[generate-cjs] Starting CJS pipeline, level=${level}, models=${label}`);
      const result = await generateCJS(sb, level, diff, domain, topic, genModel, reviewModel);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // ── Standard Question Pipeline ──
    const items = normalize(params);
    const total = items.reduce((s, i) => s + i.count, 0);
    if (total < 1 || total > 30) return new Response(JSON.stringify({ error: 'Count must be 1-30' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    const types = [...new Set(items.map(i => i.type))];
    console.log(`[generate-v8] ${total} questions (${types.join(',')}), level=${level}, models=${label}`);

    // STEP 1: Gather context — scope/formulary + domain names ALWAYS loaded
    const [scopeFormulary, domainNames, rag, rules, guidance, examples] = await Promise.all([
      fetchScopeAndFormulary(sb, level),
      fetchDomainNames(sb, level),
      fetchRAG(sb, topic, level, domain),
      fetchRules(sb, types),
      fetchGuidance(sb, types),
      fetchExamples(sb, types, level),
    ]);
    const ragCount = rag ? rag.split('\n\n').length : 0;
    console.log(`[generate-v8] Domains: ${domainNames.join(', ')}, RAG: ${ragCount} chunks`);

    const breakdown = items.map(i => `${i.count}x ${i.type}`).join(', ');
    const schemas = types.map(t => schema(t)).join('\n');

    const domainConstraint = domainNames.length > 0
      ? `\n\nNREMT CONTENT DOMAINS for ${level} (use EXACT names for the "domain" field):\n${domainNames.map((d, i) => `${i+1}. ${d}`).join('\n')}`
      : '';
    const cjConstraint = `\n\nCLINICAL JUDGMENT FUNCTIONS (use EXACT names for "cj_functions"):\n${CJ_FUNCTION_NAMES.map((f, i) => `${i+1}. ${f}`).join('\n')}`;

    const systemPrompt = `You are an expert EMS psychometrician creating NREMT-style questions for ${level} certification.\n\nCRITICAL: This is PREHOSPITAL emergency medicine, NOT hospital medicine. All medications, interventions, and procedures MUST be within ${level} scope of practice.\n\n${scopeFormulary}${domainConstraint}${cjConstraint}\n\nRULES:\n1. Every stem 200+ chars with clinical vignette: age+sex+complaint+history+vitals+lead-in.\n2. Each distractor wrong for exactly ONE clinical reason.\n3. No bias. Distribute correct answers evenly.\n4. Use AHA, NAEMSP, PHTLS, NRP, NHTSA guidelines.\n5. "domain" MUST be one of the NREMT domains listed above.\n6. "cj_functions" MUST use names from the CJ functions list above.\n7. Rationale = plain text string. Difficulty = easy/medium/hard.\n8. ALL medications from ${level} formulary ONLY.\n\nSCHEMAS:\n${schemas}\n\n${rules}\n\n${guidance}\n\n${examples}\n\n${rag ? '=== CLINICAL CONTEXT ===\n' + rag : ''}\n\nReturn JSON: {"questions":[...]} Each: {item_type, stem, options, correct_answer:{}, rationale(STRING), domain, cj_functions(array), difficulty}`;

    const userPrompt = `Generate exactly ${total} questions (${breakdown}) for ${level}.\nDifficulty: ${diff}\n${domain ? 'Domain: '+domain : ''}\n${topic !== 'EMS patient assessment' ? 'Topic: '+topic : ''}\n\nREMINDER: "domain" MUST be one of: ${domainNames.join(', ')}\nREMINDER: "cj_functions" MUST use: ${CJ_FUNCTION_NAMES.join(', ')}`;

    const raw = await callAI(systemPrompt, userPrompt, genModel);
    let draft: any[];
    try { const p = JSON.parse(raw); draft = Array.isArray(p) ? p : (p.questions || []); } catch { draft = []; }
    if (!draft.length) return new Response(JSON.stringify({ error: 'Generation failed' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    console.log(`[generate-v8] Draft: ${draft.length}. Reviewing...`);
    const reviewed = await reviewAndFix(draft, rules, scopeFormulary, types, level, domainNames, reviewModel);
    console.log(`[generate-v8] Final: ${reviewed.length} questions`);

    return new Response(JSON.stringify({
      questions: reviewed,
      metadata: { total: reviewed.length, types, level, diff, domain: domain || 'mixed', model_requested: params.model || 'gpt-4.1', gen_model: genModel === 'claude-opus-4' ? CLAUDE_MODEL : genModel, review_model: reviewModel === 'claude-opus-4' ? CLAUDE_MODEL : reviewModel, rag_chunks: ragCount, scope_chars: scopeFormulary.length, reviewed: true, valid_domains: domainNames }
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

  } catch (error) {
    console.error('generate-questions error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
});
