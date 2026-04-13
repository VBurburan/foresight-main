# Foresight — Next Session Prompt

Continue building the Foresight institutional assessment platform at C:\Users\VINCENT\foresight-main.

## Environment
- **Live:** https://foresight-main.vercel.app
- **Repo:** https://github.com/VBurburan/foresight-main
- **Supabase:** kbfolxwbrjpajylkphwl (us-east-1)
- **Auth:** vburburan@yahoo.com / Kisses524! (role: admin → /instructor/dashboard)
- **Student test:** teststudent@foresight.edu / TestStudent2026! (enrolled in Paramedic Pilot Cohort)
- **Edge Function:** generate-questions v9 (GPT-4.1 default, Claude Opus 4, GPT-4o) — includes CJS pipeline
- **Vercel project:** foresight-main (prj_vFkn1KcbQXuu9ylBFdhEnYUDroux)
- **Stack:** Next.js 15, React 19, Tailwind v3, shadcn/ui, Recharts, Inter/Manrope

## Memory Files (check all of these first)
- `feedback_foresight_tone.md` — No gamified labels, objective data only, college-level institutional tool
- `feedback_foresight_marketing.md` — No founder mention, enterprise feel, MC vs TEI is the sell
- `feedback_foresight_analytics_ux.md` — No pre/post, class+student+exam views, FERPA
- `feedback_foresight_design.md` — No neon, contrast minimums, dark sidebar + light content
- `feedback_foresight_two_sided.md` — Students are first-class users with accounts
- `feedback_use_component_tools.md` — Use shadcn MCP + 21st.dev for frontend work
- `project_foresight_nremt_reference.md` — NREMT sample exams, CJS structure, hotspot rollout spring 2026
- `project_foresight_accreditation.md` — CoAEMSP compliance module, Platinum displacement
- `project_foresight_procurement.md` — Stripe Invoicing, PO/net-30, $15K micro-purchase
- `project_foresight_analytics_spec.md` — AI pipeline, grading architecture, Linear issues
- `project_foresight_vision.md` — Two-sided SaaS architecture
- `project_exam_access_flow.md` — Enrollment + access codes, Pearson-style player, no intake forms

## What's Been Accomplished (April 13 sessions — 14 commits)

### Features Built
- **Analytics charts rewrite** (VIN-163 DONE): Horizontal bars, 70% passing threshold, correct/total counts, objective insight boxes, dark slate headers
- **CJS AI generation** (VIN-161 DONE): 3-step edge function pipeline (backbone > questions > review), deployed v9, enabled in AI panel + test builder
- **Hotspot question type** (VIN-162 DONE): HS builder (image + region editor), exam player renderer, scoring logic, question adapter
- **Homepage TEI mockups** (VIN-160 IN PROGRESS): Visual BL/MR/OB mockups in MC vs TEI comparison, more polish needed
- **Pearson-style exam player** (VIN-166 DONE): Navy header, fixed footer, isolated mode (no sidebar), progress bar, type badges
- **Forward-only navigation toggle**: Instructor controls back button via settings JSONB
- **Access codes**: Auto-generated on publish, student enters on Exams page
- **ECG attribution**: Shows PTB-XL dataset + CC BY 4.0 from ecg_strips metadata
- **Student auto-registration** (VIN-170 DONE): Auto-create students row on first login

### Critical Bugs Fixed
- **AI question grading (CRITICAL)**: onAcceptQuestions now normalizes AI response into test builder data model. MC correctKey is top-level on AI response (not in correct_answer). MR/DD/BL/OB correct answers properly extracted and merged.
- **Exam TEI renderers**: Defensive data parsing handles both nested and flat-array formats
- **Publish dialog**: Replaced shadcn Select with native select to fix portal conflict
- **RLS**: Added policies for student enrollment code lookup and student self-registration
- **OB renderer**: Fixed remaining data.columns reference

### Infrastructure
- Edge function v9 deployed with CJS pipeline
- access_code column added to instructor_assessments
- students_insert_own RLS policy for auto-registration
- authenticated_read_classes RLS policy for enrollment
- Student test account created and enrolled
- PR: VBurburan/foresight-main#1 — all commits pushed

## Open Linear Issues

### HIGH Priority
- **VIN-167** [In Progress] — E2E test pass: grading validated at data level, needs full browser E2E to confirm scores display correctly
- **VIN-169** [Backlog] — Security audit: RLS policies, edge function auth (verify_jwt: false), OWASP basics, exam integrity
- **VIN-160** [In Progress] — Homepage marketing: TEI mockups done, still needs hero polish, interactive demos, logo

### MEDIUM Priority
- **VIN-165** [In Progress] — Edge function metadata: question preview cards need domain badge, difficulty, CJ functions
- **VIN-168** [Backlog] — Exam player: calculator widget, help modal, flag review screen, keyboard nav
- **VIN-164** [Backlog] — FERPA compliance: privacy policy, BAA, audit logging

### LOWER Priority
- **VIN-150/151** [Backlog] — Accreditation compliance module (CoAEMSP/CAAHEP)

## Suggested Priority for Next Session
1. **Merge PR #1** and deploy to Vercel — test on production
2. **Full browser E2E test** (VIN-167) — Create AI exam > take as student > verify non-zero score > check analytics
3. **Exam player enhancements** (VIN-168) — Calculator widget, help modal (reference P2M pre-tests at p2m-pretests-v2.vercel.app)
4. **Marketing polish** (VIN-160) — Hero section, features, use shadcn/21st.dev
5. **Security audit** (VIN-169) — Lock down edge function JWT, review RLS

## Key Architecture Decisions (don't change)
- Student accounts required (not anonymous links) — CoAEMSP needs per-student tracking
- Server-side grading via SECURITY DEFINER RPC (grade_instructor_exam)
- Scope/formulary always force-injected in AI generation
- Frontend chunking for batch generation (10 per chunk)
- Light theme + dark sidebar (no neon colors)
- Domains table has exact NREMT names per cert level
- Path2Medic and Foresight share the same Supabase project
- hello@foresight.edu for all public-facing emails
- No gamified labels — objective data presentation only
- Don't reveal IP (no RAG mentions, no "AI-powered" language on marketing)
- Forward-only navigation default ON (matches NREMT)
- Edge function source tracked in repo: supabase/functions/generate-questions/index.ts

## Database Quick Reference
- 1,171 questions in questions table (Path2Medic bank)
- instructor_questions: options (JSONB), correct_answer (JSONB), metadata (JSONB w/ domain, cj_functions, difficulty)
- 291 RAG chunks with embeddings
- 185 ECG strips (PTB-XL v1.0.3, CC BY 4.0)
- 17 domains (5 EMT, 6 AEMT, 6 Paramedic)
- Grade RPC: grade_instructor_exam (SECURITY DEFINER) — handles MC, MR, DD, BL, OB
- access_code (unique, 6-char alphanumeric) on instructor_assessments
- settings JSONB on instructor_assessments (forward_only, assessment_type)
