# Foresight — MVP Roadmap & Feature Backlog

_Last updated: 2026-05-03. Blocker #1 (answer key security) resolved._

---

## Current State Summary

The core exam platform is functionally substantial: instructors can author exams, students can take them across all 7 question types (MC, MR, DD, BL, OB, HS, CJS), grading works server-side, and analytics render. However, the platform is **not safe to sell or give to real students**. Key remaining blockers: no RLS policies on critical tables, no payment integration, and no self-service instructor signup.

**Rough readiness by area:**

| Area | Status |
|---|---|
| Exam authoring (test builder) | 80% |
| AI question generation | 80% |
| Exam player (all question types) | 90% |
| Student results & review | 90% |
| Class management & enrollment | 90% |
| Analytics | 70% |
| Auth, roles, middleware | 60% |
| Security & RLS | 45% |
| Payments & subscriptions | 10% |
| Database type definitions | 75% |

---

## Part 1 — MVP Blockers

Everything in this section must be completed before the platform can be responsibly sold to any school or used by real students. These are ordered by logical dependency.

---

### 1. Answer Key Security ~~(CRITICAL)~~ — RESOLVED

**What was done:**
- Audited the full answer key exposure surface across all question types
- `correct_answer` column was already excluded from the exam player's Supabase query (the original audit finding was confirmed as a false alarm on that specific point)
- Commit `f3beab3` (VIN-169) had already stripped `correctKey`/`correctKeys`/`correctMapping`/`correctOrder`/`correctAnswers`/`correctRegionId` from the `options` JSONB on save for non-CJS types; confirmed via SQL query that no existing DB rows retained those keys
- **CJS gap fixed (2026-05-03):** `cjs_data` was being saved with correct-answer fields embedded inside each phase question's `data` object. Fixed in `src/app/instructor/test-builder/page.tsx` — the save path now extracts phase-level correct answers into `correct_answer` as `{ phases: [{ questions: [...] }] }` and strips sensitive keys from `cjs_data` before insert
- **Exam player interfaces cleaned (2026-05-03):** Removed `correctKey`, `correctKeys`, `correctMapping`, `correctOrder`, `correctAnswers` from `MCData`/`MRData`/`DDData`/`BLData`/`OBData` interfaces and `correctRegionId` from the `HSRenderer` prop type in `src/app/student/exam/[assessmentId]/page.tsx` — the client-side type system no longer declares or expects any correct-answer fields
- Migration `supabase/migrations/20260503_cjs_extract_correct_answers.sql` created for backfilling existing CJS records; confirmed not needed (all existing `cjs_data` rows were null)

**Current state:** No correct-answer data reaches the client at any point during an exam session.

---

### 2. Row-Level Security Policies (CRITICAL)

**Problem:** The application has no verified RLS policies on the three most critical tables: `instructor_assessments`, `instructor_questions`, and `session_responses`. Client-side guards (`InstructorGuard`, `StudentGuard`) are UI-only — anyone with a valid Supabase auth token can query the API directly and read or write any row.

**Fix required — minimum set of RLS policies:**
- `instructor_assessments`: instructors can only read/write their own rows; students can read rows where they have an enrollment in the linked class
- `instructor_questions`: only readable by the owning instructor and by students during an active exam session for that assessment
- `session_responses`: student can read/write only their own rows; instructor can read rows for assessments they own
- `classes` / `class_enrollments`: instructors can only manage their own classes; students can read classes they are enrolled in
- `students`: users can only read/write their own row; instructors can read rows for students enrolled in their classes

**Note:** The `students_insert_own` and `authenticated_read_classes` policies added in recent commits are a start — audit that they exist and verify all tables above are covered.

---

### 3. Signup & Instructor Onboarding Flow (CRITICAL)

**Problem:** There is no `/signup` page. New instructors cannot create accounts without Supabase dashboard access. This makes it impossible to sell to a school — the school cannot self-onboard.

**Fix required:**
- `/signup` page with email, password, full name, institution name, and certification level focus (EMT vs. Paramedic programs)
- On signup, create: Supabase auth user + `instructors` row + Stripe customer (see section 5)
- Email confirmation flow (Supabase already supports this — verify it is enabled and the redirect URL is set)
- `/login` page should include a "forgot password" link (Supabase magic link handles this, but the UI link is missing)
- Student accounts are currently created on first login (auto-registration via RLS policy) — verify this still works after RLS changes

---

### 4. Exam Time Limits (CRITICAL for exam integrity)

**Problem:** Exams run indefinitely. The NREMT has no stated time limit per se, but practice exams at institutions typically have a limit. More importantly, an open-ended exam with no timer creates a trivially exploitable window for looking up answers. A time limit also creates urgency that simulates real exam conditions.

**Fix required:**
- Add `time_limit_minutes` field to `instructor_assessments` (nullable — null = no limit)
- Instructor can set a time limit when publishing an exam
- Exam player displays countdown timer when a limit is set
- On expiry: warn at 5 minutes remaining, auto-submit at zero (submit whatever the student has answered so far)
- Server-side validation: `grade_instructor_exam` RPC should check that the session was submitted within `time_limit_minutes` of `started_at`; flag sessions that exceed it

---

### 5. Stripe Payment Integration (CRITICAL for monetization)

**Problem:** `src/lib/stripe.ts` defines pricing tiers and initializes the Stripe client, but nothing is wired. There is no checkout flow, no webhook handler, and no subscription gating. Any user with `role='instructor'` can create unlimited exams without paying.

**Fix required — minimum viable payment loop:**

1. **Checkout endpoint:** `POST /api/stripe/checkout` — creates a Stripe Checkout Session for the selected plan, redirects instructor to Stripe-hosted checkout
2. **Webhook handler:** `POST /api/stripe/webhook` — handles `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` events; writes subscription status to `instructors.subscription_status`
3. **Subscription gating:** Check `instructors.subscription_status = 'active'` before allowing exam creation. Show upgrade prompt if not active.
4. **Billing page:** `/instructor/billing` — link to Stripe Customer Portal for the instructor to manage card, cancel, view invoices
5. **Stripe customer creation:** On instructor signup, call `stripe.customers.create()` and store the returned `customer_id` in `instructors.stripe_customer_id`

**Pricing tiers already defined in `stripe.ts`:**
- Cohort Small: up to 25 students, $1,999/cohort
- Cohort Medium: up to 50 students, $2,499/cohort
- Cohort Large: up to 100 students, $2,999/cohort

---

### 6. Subscription Tier Gating (HIGH)

**Problem:** `ai-assistant-panel.tsx` hardcodes `const CURRENT_TIER = 'professional'`, giving every instructor 50 AI-generated questions per batch regardless of their plan. Student and exam count limits are also not enforced.

**Fix required:**
- Read the instructor's tier from `instructors.subscription_plan` (or derive it from Stripe product metadata in the webhook)
- Enforce AI generation limits per tier (already defined in `TIERS` constant — just read the real tier)
- Enforce `max_students` per class based on plan tier
- Show clear upgrade path when a limit is hit

---

### 7. Database Schema Sync (HIGH)

**Problem:** `src/types/database.ts` is out of sync with the actual Supabase schema. The three most-used tables — `instructor_assessments`, `instructor_questions`, and `session_responses` — are missing from the TypeScript types. This means no type checking, no IDE autocompletion, and easy-to-introduce bugs on column names.

**Fix required:**
- Run `supabase gen types typescript --project-id kbfolxwbrjpajylkphwl > src/types/database.ts` to regenerate from live schema
- Add `'CJS'` to the `ItemType` enum — it is used throughout the code but absent from the type definition
- Review the regenerated types and confirm `instructor_assessments`, `instructor_questions`, and `session_responses` are present with correct column names

---

### 8. End-to-End Exam Flow Validation (HIGH)

**Problem:** The grading RPC and analytics pipeline have never been validated with a full browser E2E test covering all question types. There are known past bugs in correct-answer normalization (MC `correctKey` vs. `correct_answer` inconsistency), and it is not confirmed that scores appear correctly in analytics after a real submission.

**Fix required — manual E2E checklist at minimum:**
1. Instructor creates an exam with at least one question of each type: MC, MR, DD, BL, OB, HS, CJS
2. Instructor publishes exam, copies access code
3. Student logs in, enters access code, starts exam
4. Student answers all questions and submits
5. Verify: score is non-zero and reflects correct answers
6. Instructor views student detail page — verify score, domain stats, and per-question results are correct
7. Instructor views class analytics — verify aggregate charts update

This should become an automated Playwright or Cypress test suite, but the immediate requirement is a passing manual run documented in a test log.

---

### 9. Access Code Brute-Force Protection (HIGH)

**Problem:** Access codes are 6-character alphanumeric strings (~2.1 billion combinations if case-sensitive, ~56 million if lowercase). There is no rate limiting on the code lookup endpoint. A script could enumerate valid codes and gain access to private exams.

**Fix required:**
- Add rate limiting to the access code lookup: max 5 attempts per IP per hour, with exponential backoff after failures
- This can be done via Supabase Edge Function middleware or a Next.js API route with a simple Redis/Upstash counter
- Alternatively, require the student to be authenticated before code lookup (currently appears to be the case — confirm)

---

### 10. Credentials Removed from Repository (HIGH)

**Problem:** `NEXT_SESSION_PROMPT.md` contains plaintext credentials for the test accounts (`vburburan@yahoo.com / Kisses524!` and `teststudent@foresight.edu / TestStudent2026!`). These are tracked in git history.

**Fix required:**
- Remove credentials from the file (replace with `[see password manager]` or similar)
- Rotate both passwords since they are in git history
- Add a pre-commit hook or `.gitignore` pattern to catch future credential commits

---

### 11. Instructor Account Settings Page (MEDIUM — required for sales)

**Problem:** There is no `/instructor/settings` page. Instructors cannot edit their institution name, billing contact email, or logo. When selling to a school, the first thing an admin will do is update institution branding.

**Fix required:**
- `/instructor/settings` with: institution name, contact email, logo upload (Supabase Storage), timezone
- Link to Stripe billing portal from this page (see section 5)
- Password change flow (can delegate to Supabase magic link)

---

### 12. Empty State UX (MEDIUM)

**Problem:** Analytics page displays fake/demo chart data when no real student data exists. This masks the real state from new instructors setting up for the first time, and can create a misleading impression.

**Fix required:**
- Replace demo data fallback with proper empty state illustrations/copy ("No exams have been taken yet — publish your first exam and share the access code with your class")
- Apply consistent empty states to: class roster (no students enrolled), exam list (no exams published), analytics (no data), student results (no attempts)

---

## Part 2 — Post-MVP / Golden State Features

These are not required for a first paying customer, but must be completed to build a durable, competitive product. Grouped by theme.

---

### Exam Security & Integrity

- **Tab visibility / focus detection** — Detect when the student alt-tabs or opens another window; log the event and optionally pause the timer or flag the session for instructor review. This is a standard feature of any proctored online exam.
- **Exam attempt limits** — Let instructors set max attempts per student per assessment. Currently students can retake infinitely.
- **Instructor-controlled answer release** — Option for instructors to hide correct answers from students until a set date (e.g., after the exam window closes for the whole class). Currently answers are shown immediately after submission.
- **Session integrity hash** — Sign the `exam_session` with a server-side token so a student cannot manipulate their own score in the database.
- **Remote proctoring integration** — Long-term: integrate with Honorlock or ProctorU for high-stakes uses. Not required for MVP but a future enterprise differentiator.

---

### Question Bank & Authoring

- **Question bank browser** — Instructors can browse and search the 1,171 questions in the `questions` table (Path2Medic bank) and add them directly to an exam. Currently this table is inaccessible from the instructor UI.
- **Question reuse across exams** — Clone or reference a question in multiple exams. Currently each exam's questions are isolated in `instructor_questions`.
- **Bulk import** — Import questions from CSV or QTI format. Critical for schools migrating from Word documents, TestGen, or Respondus.
- **Question versioning** — Track edits to questions over time; show diff of what changed and when.
- **Draft cloud backup** — Test builder drafts currently save to localStorage only. Lost if the browser cache is cleared. Should auto-save to DB as a `draft` status assessment.
- **Question tagging / custom metadata** — Let instructors tag questions with their own labels (e.g., "week 3 lecture", "from clinical rotation") beyond the built-in NREMT domain/difficulty fields.
- **Bowtie (BW) question type** — The renderer component (`bowtie.tsx`) exists but is not wired into the exam player. The NREMT uses Bowtie items; this should be completed and included.
- **CJS multi-phase polish** — AI-generated CJS scenarios currently produce a backbone and questions but don't automatically integrate ECG strips or clinical images. Improve the generation pipeline to pull from the ECG strip library contextually.

---

### Student Experience

- **Exam preview before starting** — Show question count, estimated time, topic areas, and any instructor instructions before the student begins.
- **Pause and resume** — Allow students to save mid-exam progress and return later (within an instructor-set window). Critical for students in clinical environments who may be interrupted.
- **Adaptive question sequencing** — Full CAT simulation: track running ability estimate and adjust next-question difficulty dynamically, rather than presenting questions in creation order. This is the most technically ambitious differentiator and the closest simulation of the real NREMT.
- **Performance trends** — Show students their score trajectory across multiple attempts over time, not just the last result.
- **Readiness score** — Surface a "NREMT readiness" estimate based on domain performance relative to NREMT passing standards (70th percentile / compensatory pass model).
- **Study resources linked to rationales** — After reviewing incorrect answers, surface relevant study material (links to textbook sections, videos, related questions) contextually.
- **Student profile** — Let students set their cert level target, exam date, and cohort. Used to personalize the dashboard and track readiness over time.
- **Mobile-responsive exam player** — The player is functional on desktop but not optimized for tablet/phone. Many students study on mobile. Drag-and-drop interactions in particular need touch event handling.

---

### Analytics & Reporting

- **Pre/post assessment tracking** — Measure learning gain between an intake assessment at the start of the course and a final exam. Show delta per domain.
- **At-risk student identification** — Flag students who are statistically unlikely to pass the NREMT based on their domain performance compared to passing thresholds.
- **Data export** — CSV and PDF export of class-level and student-level reports. Required for CoAEMSP accreditation reporting.
- **Item analysis** — Show instructors which questions have poor discrimination or are too easy/hard (p-value, point-biserial correlation). Helps improve question quality over time.
- **CJ function analytics** — Report on student performance by Clinical Judgment function (recognize cues, analyze, prioritize, generate solutions, take action, evaluate outcomes) using the `cj_step_stats` data already collected.
- **Longitudinal cohort tracking** — Track a cohort across the full arc of their program (multiple exams over months), not just per-exam snapshots.

---

### Instructor / Admin Features

- **Multi-instructor institution** — Allow a program director to create an institution account and invite multiple instructors. Currently each instructor is siloed. Critical for community colleges with multiple paramedic instructors.
- **Shared question library per institution** — Instructors at the same institution can share and co-own questions.
- **Accreditation module (CoAEMSP/CAAHEP)** — Generate structured reports required for accreditation self-studies: student pass rates by domain, remediation tracking, program outcomes. This is a major upsell for serious programs and a Platinum-tier displacement story.
- **AI generation approval workflow** — After generating questions, mark each as "approved" or "rejected" before adding to the question bank. Currently all generated questions are accepted.
- **Question difficulty validation** — After enough student attempts, compare actual performance on a question to its tagged difficulty level. Flag questions where tagged and empirical difficulty diverge.

---

### Infrastructure & Compliance

- **FERPA compliance** — Privacy policy, data processing agreement (DPA) template for institutional customers, audit log of all access to student records (`audit_log` table: who accessed what, when, from what IP).
- **GDPR / data export** — Endpoint for students to download all their data; endpoint to delete account and all associated records.
- **CoAEMSP BAA** — Business Associate Agreement template for programs that handle protected health information (PHI) in their training scenarios.
- **Automated database migrations** — All schema changes tracked as versioned migration files in `supabase/migrations/`. Enables safe rollback, team collaboration, and CI/CD schema deployment.
- **LMS integration (Canvas / Blackboard / D2L)** — Allow exams to be launched from within an LMS via LTI 1.3. Scores written back to the LMS gradebook. Major procurement enabler for community colleges.
- **SCORM / xAPI export** — Package exams as SCORM 2004 or xAPI activities for import into any LMS.
- **API for institutional integrations** — REST API + API key management so institutions can pull student performance data into their own systems.
- **Uptime monitoring and alerting** — Ensure instructors and students are notified of outages; critical during exam windows.
- **Automated E2E test suite** — Playwright or Cypress covering the full exam lifecycle. Run on every deploy.

---

### Marketing & Sales

- **Interactive TEI demos on homepage** — The TEI mockups on the marketing homepage are static images. Replace with live interactive demos of drag-and-drop, bowtie, and hotspot question types. This is the primary conversion driver — educators who see the question types in action immediately understand the differentiation.
- **Pilot program landing page** — A targeted page for first-customer outreach: "Join our founding institution cohort." Captures leads, explains pricing, provides social proof.
- **Institution logo on student login** — When a student visits the platform via an institution-specific URL (e.g., `foresight.app/[institution-slug]`), show the institution's logo and branding. Increases instructor confidence when sharing with students.

---

## Appendix — Known Bugs to Fix

These are specific defects identified in the audit that should be addressed during MVP work regardless of which phase they fall in.

| Bug | Area | Severity | Status |
|---|---|---|---|
| `bowtie.tsx` renderer exists but is not imported in exam player | Exam player | Medium | Open |
| `ItemType` enum missing `'CJS'` in `database.ts` | Types | Medium | Open |
| `CURRENT_TIER` hardcoded as `'professional'` in `ai-assistant-panel.tsx` | AI generation | High | Open |
| Demo data shown in analytics when no real data exists | Analytics | Medium | Open |
| No "forgot password" link on login page | Auth | Low | Open |
| `question-adapter.ts` handles AI flat format and builder nested format inconsistently | Data model | High | Open |
| Cloze scoring is case-sensitive (breaks drug name answers) | Grading | Medium | Open |
| `service.ts` defines a service-role Supabase client that is never used but could be misused if imported | Security | Medium | Open |
| No visual feedback if a hotspot image fails to load | Exam player | Low | Open |
| Exam description/instructions not shown to student before starting | UX | Medium | Open |
| CJS `cjs_data` contained correct-answer keys exposed to exam player client | Security | Critical | **Resolved 2026-05-03** |
| Exam player interfaces (`MCData` etc.) declared `correctKey`/`correctKeys`/etc. on client | Security | High | **Resolved 2026-05-03** |
