-- MVP Blocker 4: Exam time limits
-- Adds time_limit_minutes to instructor_assessments (nullable; null = no limit)
-- Adds timed_out flag to exam_sessions to mark sessions submitted after the limit

ALTER TABLE instructor_assessments
  ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER;

ALTER TABLE exam_sessions
  ADD COLUMN IF NOT EXISTS timed_out BOOLEAN DEFAULT FALSE;

-- NOTE: The grade_instructor_exam RPC should also validate that the session was
-- submitted within time_limit_minutes of started_at and flag timed_out sessions.
-- To add server-side enforcement, update the RPC body to include:
--
--   UPDATE exam_sessions
--   SET timed_out = TRUE
--   WHERE id = p_session_id
--     AND (
--       SELECT ia.time_limit_minutes FROM instructor_assessments ia
--       JOIN exam_sessions es ON es.assessment_id = ia.id
--       WHERE es.id = p_session_id
--     ) IS NOT NULL
--     AND EXTRACT(EPOCH FROM (completed_at - started_at)) / 60
--         > (SELECT ia.time_limit_minutes FROM instructor_assessments ia
--            JOIN exam_sessions es ON es.assessment_id = ia.id
--            WHERE es.id = p_session_id);
