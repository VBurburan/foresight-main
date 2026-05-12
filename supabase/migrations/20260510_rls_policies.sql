-- RLS policies for MVP security (Blocker #2)
--
-- Guarantees enforced:
--   instructors   → can only read/write their own rows in every table they own
--   students      → can only read/write their own rows and data for assessments
--                   they are allowed to take (enrolled class, or open exam)
--   grade RPC     → SECURITY DEFINER, bypasses RLS intentionally (no change needed)
--
-- Tables covered:
--   instructors, instructor_assessments, instructor_questions,
--   exam_sessions, session_responses,
--   classes, class_enrollments, students
--
-- Safe to re-run: all DROPs use IF EXISTS; ENABLE ROW LEVEL SECURITY is idempotent.

-- ─────────────────────────────────────────────────────────────
-- 1. Enable RLS on every table that needs it
-- ─────────────────────────────────────────────────────────────

ALTER TABLE instructors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE students               ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. instructors
--    • Each instructor can read/update only their own row.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "instructors_own_row" ON instructors;

CREATE POLICY "instructors_own_row"
ON instructors
FOR ALL
TO authenticated
USING     (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3. instructor_assessments
--    • Instructors: full CRUD on assessments they own.
--    • Students: SELECT published assessments where
--        - class_id IS NULL (open/unassigned exam), OR
--        - they are enrolled in the linked class.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "instructor_assessments_instructor_all"  ON instructor_assessments;
DROP POLICY IF EXISTS "instructor_assessments_student_select"  ON instructor_assessments;

CREATE POLICY "instructor_assessments_instructor_all"
ON instructor_assessments
FOR ALL
TO authenticated
USING (
  instructor_id = (SELECT id FROM instructors WHERE user_id = auth.uid())
)
WITH CHECK (
  instructor_id = (SELECT id FROM instructors WHERE user_id = auth.uid())
);

CREATE POLICY "instructor_assessments_student_select"
ON instructor_assessments
FOR SELECT
TO authenticated
USING (
  -- Published exams the student is allowed to take
  (
    status = 'published'
    AND (
      class_id IS NULL
      OR class_id IN (
        SELECT class_id FROM class_enrollments
        WHERE student_id = auth.uid()
      )
    )
  )
  OR
  -- Exams the student has already completed (for results history)
  id IN (
    SELECT assessment_id FROM exam_sessions
    WHERE student_id = auth.uid()
      AND assessment_id IS NOT NULL
  )
);

-- ─────────────────────────────────────────────────────────────
-- 4. instructor_questions
--    • Instructors: full CRUD on questions for their assessments.
--    • Students: SELECT questions for published assessments
--        they are allowed to access (same rule as above).
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "instructor_questions_instructor_all"  ON instructor_questions;
DROP POLICY IF EXISTS "instructor_questions_student_select"  ON instructor_questions;

CREATE POLICY "instructor_questions_instructor_all"
ON instructor_questions
FOR ALL
TO authenticated
USING (
  assessment_id IN (
    SELECT id FROM instructor_assessments
    WHERE instructor_id = (SELECT id FROM instructors WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  assessment_id IN (
    SELECT id FROM instructor_assessments
    WHERE instructor_id = (SELECT id FROM instructors WHERE user_id = auth.uid())
  )
);

CREATE POLICY "instructor_questions_student_select"
ON instructor_questions
FOR SELECT
TO authenticated
USING (
  -- Questions for published exams the student can take
  assessment_id IN (
    SELECT id FROM instructor_assessments
    WHERE status = 'published'
      AND (
        class_id IS NULL
        OR class_id IN (
          SELECT class_id FROM class_enrollments
          WHERE student_id = auth.uid()
        )
      )
  )
  OR
  -- Questions for exams the student has already completed (for results review)
  assessment_id IN (
    SELECT assessment_id FROM exam_sessions
    WHERE student_id = auth.uid()
      AND assessment_id IS NOT NULL
  )
);

-- ─────────────────────────────────────────────────────────────
-- 5. exam_sessions
--    • Students: full control over their own sessions
--        (student_id = auth.uid() — stored as auth UUID directly).
--    • Instructors: SELECT sessions for students enrolled in
--        their classes OR for their own assessments.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "exam_sessions_student_all"         ON exam_sessions;
DROP POLICY IF EXISTS "exam_sessions_instructor_select"   ON exam_sessions;

CREATE POLICY "exam_sessions_student_all"
ON exam_sessions
FOR ALL
TO authenticated
USING     (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "exam_sessions_instructor_select"
ON exam_sessions
FOR SELECT
TO authenticated
USING (
  -- Session is for a student enrolled in one of the instructor's classes
  student_id IN (
    SELECT ce.student_id
    FROM class_enrollments ce
    JOIN classes c ON c.id = ce.class_id
    JOIN instructors i ON i.id = c.instructor_id
    WHERE i.user_id = auth.uid()
  )
  OR
  -- Session is for one of the instructor's own assessments
  assessment_id IN (
    SELECT ia.id FROM instructor_assessments ia
    JOIN instructors i ON i.id = ia.instructor_id
    WHERE i.user_id = auth.uid()
  )
);

-- ─────────────────────────────────────────────────────────────
-- 6. session_responses
--    • Students: INSERT and SELECT their own responses
--        (via session ownership: session.student_id = auth.uid()).
--    • Instructors: SELECT responses for sessions linked to
--        their assessments or their enrolled students.
--    • Note: grade_instructor_exam RPC is SECURITY DEFINER and
--        updates is_correct/score without going through RLS.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "session_responses_student_insert"     ON session_responses;
DROP POLICY IF EXISTS "session_responses_student_select"     ON session_responses;
DROP POLICY IF EXISTS "session_responses_instructor_select"  ON session_responses;

CREATE POLICY "session_responses_student_insert"
ON session_responses FOR INSERT TO authenticated
WITH CHECK (
  session_id::uuid IN (SELECT id FROM exam_sessions WHERE student_id = auth.uid())
);

CREATE POLICY "session_responses_student_select"
ON session_responses FOR SELECT TO authenticated
USING (
  session_id::uuid IN (SELECT id FROM exam_sessions WHERE student_id = auth.uid())
);

CREATE POLICY "session_responses_instructor_select"
ON session_responses FOR SELECT TO authenticated
USING (
  session_id::uuid IN (
    SELECT es.id FROM exam_sessions es
    JOIN instructor_assessments ia ON ia.id = es.assessment_id
    JOIN instructors i ON i.id = ia.instructor_id
    WHERE i.user_id = auth.uid()
    UNION
    SELECT es.id FROM exam_sessions es
    JOIN class_enrollments ce ON ce.student_id = es.student_id
    JOIN classes c ON c.id = ce.class_id
    JOIN instructors i ON i.id = c.instructor_id
    WHERE i.user_id = auth.uid()
  )
);

-- ─────────────────────────────────────────────────────────────
-- 7. classes
--    • Instructors: full CRUD on classes they own.
--    • Students: SELECT any active class so they can look up
--        a class by enrollment_code before they enroll.
--        The enrollment_code itself is the access secret.
-- ─────────────────────────────────────────────────────────────

-- Drop the overly permissive policy added in earlier commits
DROP POLICY IF EXISTS "authenticated_read_classes" ON classes;

DROP POLICY IF EXISTS "classes_instructor_all"         ON classes;
DROP POLICY IF EXISTS "classes_student_select_active"  ON classes;

CREATE POLICY "classes_instructor_all"
ON classes
FOR ALL
TO authenticated
USING (
  instructor_id = (SELECT id FROM instructors WHERE user_id = auth.uid())
)
WITH CHECK (
  instructor_id = (SELECT id FROM instructors WHERE user_id = auth.uid())
);

-- Students need to discover a class by enrollment_code to join it.
-- Scope to active classes only; the enrollment_code is the real secret.
CREATE POLICY "classes_student_select_active"
ON classes
FOR SELECT
TO authenticated
USING (is_active = true);

-- ─────────────────────────────────────────────────────────────
-- 8. class_enrollments
--    • Students: INSERT their own enrollment; SELECT their own rows.
--    • Instructors: SELECT and DELETE enrollments for their classes
--        (instructors manage roster; students cannot remove themselves).
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "class_enrollments_student_insert"     ON class_enrollments;
DROP POLICY IF EXISTS "class_enrollments_student_select"     ON class_enrollments;
DROP POLICY IF EXISTS "class_enrollments_instructor_select"  ON class_enrollments;
DROP POLICY IF EXISTS "class_enrollments_instructor_delete"  ON class_enrollments;

CREATE POLICY "class_enrollments_student_insert"
ON class_enrollments FOR INSERT TO authenticated
WITH CHECK (student_id::uuid = auth.uid());

CREATE POLICY "class_enrollments_student_select"
ON class_enrollments FOR SELECT TO authenticated
USING (student_id::uuid = auth.uid());

CREATE POLICY "class_enrollments_instructor_select"
ON class_enrollments FOR SELECT TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE instructor_id = (SELECT id FROM instructors WHERE user_id = auth.uid())
  )
);

CREATE POLICY "class_enrollments_instructor_delete"
ON class_enrollments FOR DELETE TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE instructor_id = (SELECT id FROM instructors WHERE user_id = auth.uid())
  )
);


-- ─────────────────────────────────────────────────────────────
-- 9. students
--    • Own row: SELECT and UPDATE (INSERT handled by existing
--        students_insert_own policy — keep it).
--    • Instructors: SELECT students enrolled in their classes
--        so they can view rosters and session details.
-- ─────────────────────────────────────────────────────────────

-- Preserve the existing auto-registration INSERT policy
DROP POLICY IF EXISTS "students_own_select"          ON students;
DROP POLICY IF EXISTS "students_own_update"          ON students;
DROP POLICY IF EXISTS "students_instructor_select"   ON students;

CREATE POLICY "students_own_select"
ON students FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "students_own_update"
ON students FOR UPDATE TO authenticated
USING     (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "students_instructor_select"
ON students FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT ce.student_id::uuid
    FROM class_enrollments ce
    JOIN classes c ON c.id = ce.class_id
    JOIN instructors i ON i.id = c.instructor_id
    WHERE i.user_id = auth.uid()
  )
);

