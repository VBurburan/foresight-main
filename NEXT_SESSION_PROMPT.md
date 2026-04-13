# Foresight — Next Session Prompt

Continue building the Foresight institutional assessment platform at C:\Users\VINCENT\foresight-main.

## Environment
- **Live:** https://foresight-main.vercel.app
- **Repo:** https://github.com/VBurburan/foresight-main
- **Supabase:** kbfolxwbrjpajylkphwl (us-east-1)
- **Auth:** vburburan@yahoo.com / Kisses524! (role: admin → /instructor/dashboard)
- **Edge Function:** generate-questions v8 (GPT-4.1 default, Claude Opus 4, GPT-4o)
- **Vercel project:** foresight-main (prj_vFkn1KcbQXuu9ylBFdhEnYUDroux)
- **Stack:** Next.js 15, React 19, Tailwind v3, shadcn/ui, Recharts, Inter/Manrope

## Memory Files (check all of these first)
- `feedback_foresight_tone.md` — No gamified labels, objective data only, college-level institutional tool
- `feedback_foresight_marketing.md` — No founder mention, enterprise feel, MC vs TEI is the sell
- `feedback_foresight_analytics_ux.md` — No pre/post, class+student+exam views, FERPA
- `feedback_foresight_design.md` — No neon, contrast minimums, dark sidebar + light content
- `feedback_foresight_two_sided.md` — Students are first-class users with accounts
- `project_foresight_nremt_reference.md` — NREMT sample exams, CJS structure, hotspot rollout spring 2026
- `project_foresight_accreditation.md` — CoAEMSP compliance module, Platinum displacement
- `project_foresight_procurement.md` — Stripe Invoicing, PO/net-30, $15K micro-purchase
- `project_foresight_analytics_spec.md` — AI pipeline, grading architecture, Linear issues
- `project_foresight_vision.md` — Two-sided SaaS architecture

## Critical Context Files (outside this repo)
These contain scraped NREMT exam intelligence, question player specs, and pre-test implementations:
- `C:\Users\VINCENT\Path2Medic\.claude\worktrees\xenodochial-lehmann\NREMT_SAMPLE_EXAM_REFERENCE.md` — All 3 NREMT sample exams scraped (EMT 15Q, AEMT 16Q, Paramedic 16Q), UI layout specs, TEI implementation CSS/HTML details, form field structures
- `C:\Users\VINCENT\Path2Medic\.claude\worktrees\xenodochial-lehmann\NREMT_VS_PARAMEDIC_COMPARISON.md` — Side-by-side comparison of NREMT vs Path2Medic V2, gap analysis, TEI distribution targets, specific conversion suggestions
- `C:\Users\VINCENT\Path2Medic\.claude\worktrees\xenodochial-lehmann\NREMT_HOTSPOT_PODCAST_TRANSCRIPT.md` — Official NREMT podcast confirming hotspot rollout for AEMT/Paramedic spring 2026
- Path2Medic pre-tests live at: https://p2m-pretests-v2.vercel.app/paramedic.html and https://p2m-pretests-v2.vercel.app/emt.html — reference these for question player implementation patterns
- Look for `QUESTION_PLAYER_BUILD.md` in the Path2Medic GitHub repo for player implementation specs
- The Path2Medic codebase at `C:\Users\VINCENT\Path2Medic` has the shared Supabase schema, question metadata patterns, and working CJS scenario implementation

## What's Been Accomplished (April 13 session — 13 commits)

### Infrastructure (solid, shouldn't need to revisit)
- E2E exam flow working: 7 blocking bugs fixed (OB grading, 3 FK constraints, 7+ RLS policies, session_responses FK, double-session guard)
- Grade RPC v2: OB uses key-value matching, removed early-return bug
- Edge function v8: fetches exact NREMT domain names from `domains` table per cert level, injects standardized CJ function names into gen + review prompts
- AI Question Writer: CJS marked "(manual only)" with guard, dynamic domain dropdown from DB with NREMT % ranges, tier gating (Standard ≤10, Professional ≤50, Enterprise ≤150)
- Test data: 4 students (Vincent + Sarah Chen + Marcus Johnson + Aisha Patel), 9 exam sessions, 35 session_responses with correct NREMT domain names
- WCAG contrast fixes across marketing + student pages
- Marketing: founder mentions removed, hello@foresight.edu, enterprise trust signals, MC vs TEI format gap comparison

### Pages That Exist
- **Instructor:** Dashboard, Classes, Class Detail, Test Builder (all 6 TEI + CJS), Analytics (5 charts), TEI Reference, Student Detail (8 chart sections + score trend + exam history), Exam Session Detail (question-by-question breakdown)
- **Student:** Dashboard (enroll by code), Exams (published assessments), Exam Player (MC/MR/DD/BL/OB renderers), Results (score + question review)
- **Marketing:** Home, Features, Pricing, About (all enterprise-focused, no founder mentions)

## Open Linear Issues

### HIGH Priority
- **VIN-163** [In Progress] — Analytics chart rewrite + AI insights
  - Charts are sloppy: donut with clipped labels, sparse heatmap, no written insights
  - Need: horizontal bar charts instead of donuts, proper color gradients, correct/total counts, objective data tables
  - Reference Austin Huggins PDF (`C:\Users\VINCENT\Downloads\Austin_Huggins_PrePost_Analysis (1).pdf`) for chart quality targets — domain bars, TEI stacked bars, written analytical insights
  - Need class-level analytics (where instructor teaching creates gaps)
  - IMPORTANT: No gamified labels (MASTERED/STRONG GAIN/etc.) — present objective data, let instructor draw conclusions
  
- **VIN-161** [Backlog] — CJS (Clinical Judgment Scenario) AI generation
  - Current edge function can't generate CJS — too complex for single-shot
  - Need multi-phase pipeline: Step 1 generate scenario backbone (patient, chief complaint, 3 phases with evolving vitals), Step 2 generate 2-3 questions per phase of specified TEI types, Step 3 review for clinical consistency
  - Reference: NREMT_SAMPLE_EXAM_REFERENCE.md (CJS structure: 3 phases, split screen, wraps MC/MR/BL/DD/OB), Path2Medic V2 paramedic pre-test has 1 working CJS scenario
  - This is the biggest product differentiator — no competitor can do this

- **VIN-160** [In Progress] — Homepage + marketing polish
  - MC vs TEI comparison section exists but needs to be much bigger/more impactful — show actual rendered TEI examples, not just text descriptions
  - Overall design needs more visual wow (modern glass UI, professional) without looking vibe-coded
  - Logo was made bigger but could still use design polish
  - Use shadcn/21st.dev/magic-ui for component inspiration

- **VIN-162** [Backlog] — Hotspot question type
  - NREMT piloting spring 2026 for AEMT (capnogram) and Paramedic (ECG)
  - Need: HS item_type, hotspot builder (upload image, define clickable regions), hotspot renderer in exam player, grading logic
  - Reference: NREMT_SAMPLE_EXAM_REFERENCE.md hotspot specs, NREMT_HOTSPOT_PODCAST_TRANSCRIPT.md
  - Path2Medic V2 has 2 hotspot items (HS1: ECG ST segment, HS2: capnogram)

### MEDIUM Priority
- **VIN-165** [Backlog] — Edge function v8 metadata verification + question preview polish
  - Need to test live generation and verify domain names come through correctly
  - OB schema was fixed in v8 but needs testing
  - Question preview cards in test builder need better visual hierarchy (domain badge, difficulty, CJ functions)

- **VIN-164** [Backlog] — FERPA compliance
  - Privacy policy, BAA template, data processing agreement, audit logging
  - Not blocking MVP pilot but required before institutional contracts

- **VIN-150/151** [Backlog] — Accreditation compliance module (CoAEMSP/CAAHEP)
  - New tables: institutions, programs, cohorts, validation_records
  - CAAHEP annual report auto-generation from student data
  - Site visit prep checklist
  - Competitive displacement of Platinum Educational Group's AccredAssist ($500/school)

## Key Architecture Decisions (don't change)
- Student accounts required (not anonymous links) — CoAEMSP needs per-student tracking
- Server-side grading via SECURITY DEFINER RPC (grade_instructor_exam)
- Scope/formulary always force-injected in AI generation
- Frontend chunking for batch generation (10 per chunk)
- Light theme + dark sidebar (no neon colors)
- Domains table has exact NREMT names per cert level (EMT ≠ AEMT ≠ Paramedic)
- Path2Medic and Foresight share the same Supabase project
- hello@foresight.edu for all public-facing emails
- No gamified labels — objective data presentation only
- Don't reveal IP (no RAG mentions, no "AI-powered" language on marketing)
- Edge function source tracked in repo: supabase/functions/generate-questions/index.ts

## Database Quick Reference
- 1,171 questions in `questions` table (Path2Medic bank)
- 7 questions in `instructor_questions` (5 E2E test + 2 from test builder)
- 291 RAG chunks with embeddings
- 185 ECG strips
- 17 domains (5 EMT, 6 AEMT, 6 Paramedic) in `domains` table
- 4 enrolled students, 9 completed exam sessions
- Grade RPC: grade_instructor_exam (SECURITY DEFINER)
- Edge functions: generate-questions v8, semantic-search, serve-exam, generate-embeddings, intake-submit, posttest-submit

## Suggested Priority for Next Session
1. **Charts rewrite** (VIN-163) — biggest visual quality gap. Replace donut with horizontal bars, add color gradients to heatmap, show correct/total in domain tables, remove empty Assessment column
2. **CJS generation** (VIN-161) — biggest product differentiator. Design and deploy multi-phase edge function
3. **Test live generation** (VIN-165) — verify edge function v8 produces correct NREMT domain names
4. **Marketing** (VIN-160) — bigger TEI comparison visual, interactive demos
5. **Hotspot** (VIN-162) — new TEI type
