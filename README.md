# Foresight — Institutional EMS Assessment Platform

## What It Is

Foresight is a B2B SaaS platform for educators in the EMT and Paramedic space. Schools, community colleges, and private training programs subscribe to access a bank of NREMT-aligned exam questions, build practice exams, and track student performance through detailed analytics.

The core value proposition is fidelity to the real NREMT exam — not just content coverage, but format. The NREMT uses a **Computerized Adaptive Test (CAT)** that includes question types far more complex than standard multiple choice. Foresight models these accurately so students practice in an environment that closely mirrors the actual licensure exam.

## The NREMT Context

The National Registry of Emergency Medical Technicians (NREMT) exam is the primary pathway to EMT and Paramedic certification in the United States. It is required for licensure in most states.

Key characteristics of the exam that Foresight models:

- **Computerized Adaptive Testing (CAT):** Questions are presented one at a time. The difficulty of each subsequent question adjusts based on the test taker's running performance. Students cannot go back to previous questions.
- **Technology-Enhanced Items (TEI):** Beyond standard multiple choice, the NREMT includes several specialized question types that require more complex interaction and clinical reasoning.
- **Domain coverage:** Questions are organized by clinical domain (Airway, Cardiology, Trauma, Medical, etc.) at both EMT and Paramedic certification levels.

## Question Types Supported

| Type | Code | Description |
|------|------|-------------|
| Multiple Choice | MC | Single correct answer from 4 options |
| Multiple Response | MR | Select all that apply |
| Drag and Drop | DD | Order or categorize items by dragging |
| Bowtie | BL | Cause → intervention → effect clinical reasoning |
| Ordered Buckets | OB | Sort items into labeled categories |
| Hotspot | HS | Click to identify a region on an image (e.g., ECG strip, anatomy diagram) |

TEI question types (MR, DD, BL, OB, HS) are a key differentiator — most competing study tools only offer MC.

## Who Uses It

**Instructors / Educators** — subscribe to Foresight, build and publish practice exams, share access codes with enrolled students, and review class-level and individual analytics.

**Students** — receive access codes from their instructor, take exams in a Pearson-style isolated exam player, and see their own performance data.

Both sides have first-class accounts. Student data is tracked per-student for CoAEMSP accreditation compliance purposes.

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS v3, shadcn/ui |
| Charts | Recharts |
| Backend / DB | Supabase (Postgres, RLS, Edge Functions) |
| Auth | Supabase Auth |
| AI Generation | Supabase Edge Function (`generate-questions` v9) — GPT-4.1 default, Claude Opus 4, GPT-4o |
| Payments | Stripe (Invoicing + checkout) |
| Deployment | Vercel |
| Fonts | Inter / Manrope |

## Key Architecture Decisions

- **Server-side grading** via `grade_instructor_exam` Postgres RPC (SECURITY DEFINER) — clients never see answer keys
- **Correct-answer keys stripped from client** — options JSONB sent to frontend has `is_correct` removed
- **Forward-only navigation** default ON in the exam player to match NREMT CAT behavior (instructor-configurable)
- **Student accounts required** — no anonymous link-based access; per-student tracking is required for CoAEMSP accreditation
- **AI generation pipeline** — 3-step edge function (backbone → questions → review), scope and formulary always injected
- **No "AI-powered" language** on marketing — do not reveal the AI/RAG pipeline to the public
- **Objective data presentation** — no gamified labels or scores (e.g., no letter grades, no "Great job!" copy); college-level institutional tool
- **Design** — dark sidebar, light content area, no neon colors, WCAG contrast minimums enforced

## Database Quick Reference

- **Questions bank:** 1,171 questions (Path2Medic source bank)
- **Domains:** 17 total — 5 EMT, 6 AEMT, 6 Paramedic (exact NREMT domain names)
- **ECG strips:** 185 strips from PTB-XL v1.0.3 dataset (CC BY 4.0)
- **RAG chunks:** 291 chunks with embeddings for AI generation context
- **`instructor_questions`:** `options` (JSONB), `correct_answer` (JSONB), `metadata` (JSONB: domain, cj\_functions, difficulty)
- **`instructor_assessments`:** `access_code` (unique 6-char alphanumeric), `settings` JSONB (forward\_only, assessment\_type)

## Environment

| Resource | Value |
|----------|-------|
| Production URL | https://foresight-main.vercel.app |
| Supabase project | kbfolxwbrjpajylkphwl (us-east-1) |
| Vercel project | foresight-main |
| Contact email | hello@foresight.edu |

## Open Compliance Notes

- **FERPA** — privacy policy, BAA template, and audit logging are planned but not yet implemented (VIN-164)
- **CoAEMSP** — accreditation compliance module is on the roadmap (VIN-150/151)
- **Stripe** — supports PO / net-30 invoicing for institutional procurement under the $15K micro-purchase threshold
