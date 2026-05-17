# Foresight — MVP Roadmap & Feature Backlog

_Last updated: 2026-05-10. Blockers #1 (answer key security), #2 (RLS policies), #3 (signup & onboarding), #4 (exam time limits), and #5 (Stripe payment integration) resolved._

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

### 2. Row-Level Security Policies ~~(CRITICAL)~~ — RESOLVED

**What was done:**
- Audited every Supabase query across all instructor and student pages to map the exact access patterns needed
- Wrote `supabase/migrations/20260510_rls_policies.sql` covering all 8 tables:
  - `instructors`: own row only (SELECT/UPDATE)
  - `instructor_assessments`: instructors CRUD their own; students SELECT published + enrolled-class exams, plus any exam already completed (for results history)
  - `instructor_questions`: instructors CRUD for their assessments; students SELECT questions for exams they can take + already completed
  - `exam_sessions`: students full CRUD on their own sessions; instructors SELECT sessions for their enrolled students or own assessments
  - `session_responses`: students INSERT/SELECT their own; instructors SELECT for their assessments/students; `grade_instructor_exam` RPC is SECURITY DEFINER and bypasses RLS correctly
  - `classes`: instructors CRUD their own; students SELECT all active classes (enrollment_code is the real secret, needed for the join-class lookup flow)
  - `class_enrollments`: students INSERT/SELECT their own; instructors SELECT and DELETE for their classes
  - `students`: own SELECT/UPDATE; instructors SELECT students enrolled in their classes; `students_insert_own` INSERT policy preserved
- Dropped the overly permissive `authenticated_read_classes` policy and replaced with scoped policies

**Deployed 2026-05-10** via Supabase Dashboard SQL editor (project `kbfolxwbrjpajylkphwl`). Migration file committed to `supabase/migrations/20260510_rls_policies.sql`. The file is idempotent and safe to re-run.

**Schema notes discovered during migration:** `class_enrollments.student_id` and `session_responses.session_id` are stored as `text` (not `uuid`). Explicit `::uuid` casts were added in the policies wherever these columns are compared against uuid values. The `students_insert_own` INSERT policy (student auto-registration) was written in an earlier session and is preserved.

---

### 3. Signup & Instructor Onboarding Flow ~~(CRITICAL)~~ — RESOLVED

**What was done:**
- `/signup` page created at `src/app/signup/page.tsx` — collects full name, institution, program focus (EMT/AEMT/Paramedic), email, password, and confirm password
- `POST /api/auth/signup` route at `src/app/api/auth/signup/route.ts` handles all server-side work atomically:
  1. Calls `supabase.auth.signUp()` via the SSR server client — Supabase sends a confirmation email automatically; `emailRedirectTo` is set to `/api/auth/callback` when `NEXT_PUBLIC_SITE_URL` env var is present
  2. Creates a `students` row (`role: 'instructor'`) via service role — required for `InstructorGuard` which reads `students.role`
  3. Creates an `instructors` row via service role with `full_name`, `institution`, `role`
  4. Creates a Stripe customer (best-effort — gracefully skipped if `STRIPE_SECRET_KEY` is not configured; `stripe_customer_id` can be backfilled when Stripe is set up in step 5)
  5. Rolls back the auth user (`admin.deleteUser`) if instructor row creation fails
- `/login` page updated: added "Forgot password?" link (inline, pre-populates email from the sign-in field) and "New instructor? Create an account" link to `/signup`
- Forgot-password flow: calls `supabase.auth.resetPasswordForEmail()` from the client, shows success state, no new page required

**Schema notes:** `instructors` table does not have a `certification_level` column — program focus is stored in `students.certification_level` (where the `InstructorGuard` already reads from the `students` table).

**Prerequisite for Supabase:** Email confirmation must be enabled in Supabase Auth settings, and the Site URL must point to the production domain so confirmation email links resolve correctly.

---

### 4. Exam Time Limits ~~(CRITICAL for exam integrity)~~ — RESOLVED

**What was done:**
- Migration `supabase/migrations/20260511_exam_time_limits.sql` adds `time_limit_minutes INTEGER` (nullable) to `instructor_assessments` and `timed_out BOOLEAN DEFAULT FALSE` to `exam_sessions`
- Instructor publish dialog in `src/app/instructor/test-builder/page.tsx` now includes a time limit input (minutes, optional); the value is stored with every save draft and publish operation
- Exam player (`src/app/student/exam/[assessmentId]/page.tsx`) now:
  - Fetches `time_limit_minutes` from the assessment and stores it in state
  - Displays a countdown timer in the header when a limit is set (elapsed clock shown when no limit)
  - Timer turns amber at ≤5 minutes remaining, pulsing red at ≤1 minute
  - An amber warning banner appears at exactly 5 minutes remaining: _"5 minutes remaining — your exam will be submitted automatically when time expires."_
  - A red "Time's up — submitting your exam…" banner replaces it at 0
  - Auto-submits via `handleSubmitRef` when `elapsed >= timeLimitSeconds`; uses refs (`autoSubmitRef`, `timedOutRef`) to prevent double-submit
  - Sets `timed_out: true` on the `exam_sessions` row when auto-submitting so instructors can identify flagged sessions
- `src/types/database.ts` updated: `exam_sessions.timed_out: boolean | null` added

**Pending:** The `grade_instructor_exam` RPC should be updated in the Supabase dashboard to also server-side-validate and set `timed_out` based on `completed_at - started_at` vs `time_limit_minutes`. The migration file includes the SQL snippet for this. The migration must be run against the live Supabase project (`kbfolxwbrjpajylkphwl`) via the SQL editor.

---

### 5. Stripe Payment Integration ~~(CRITICAL for monetization)~~ — RESOLVED

**What was done:**
- `src/lib/stripe.ts` extended with `getPriceId()` and `getPlanFromPriceId()` helpers; `maxStudents` added to each product definition
- `POST /api/stripe/checkout` — creates a Stripe Checkout Session for the selected plan (Small/Medium/Large Cohort); lazily creates a Stripe customer if `stripe_customer_id` is missing on the instructor row (handles instructors who signed up before Stripe was configured)
- `POST /api/stripe/webhook` — verifies Stripe signature via `STRIPE_WEBHOOK_SECRET`; handles `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`; writes `subscription_status`, `subscription_plan`, and `max_students` to the `instructors` row
- `POST /api/stripe/portal` — creates a Stripe Customer Portal session so instructors can manage card, cancel, and view invoices
- `/instructor/billing` page — shows current plan status badge, plan selection cards ($1,999/$2,499/$2,999 per cohort), "Manage Billing" button (→ Customer Portal) for active subscribers, success/cancel flash messages from Stripe redirect
- "Billing" nav item added to the sidebar
- Test-builder Publish button now checks `subscription_status`; if not `'active'`, redirects to `/instructor/billing` instead of opening the publish dialog
- `.env.example` updated with `STRIPE_PRICE_COHORT_SMALL/MEDIUM/LARGE` and `NEXT_PUBLIC_SITE_URL`

**Pricing tiers (configure in Stripe Dashboard as recurring subscription prices):**
- Cohort Small: up to 25 students, $1,999/cohort — set `STRIPE_PRICE_COHORT_SMALL`
- Cohort Medium: up to 50 students, $2,499/cohort — set `STRIPE_PRICE_COHORT_MEDIUM`
- Cohort Large: up to 100 students, $2,999/cohort — set `STRIPE_PRICE_COHORT_LARGE`

**Required Stripe Dashboard setup before going live:**
1. Create three Products in Stripe → add a recurring Price to each → copy the `price_xxx` IDs into env vars
2. Add webhook endpoint `https://yourdomain.com/api/stripe/webhook` listening to `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` → copy signing secret into `STRIPE_WEBHOOK_SECRET`
3. Enable the Customer Portal in Stripe Dashboard (Billing → Customer Portal settings)

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
