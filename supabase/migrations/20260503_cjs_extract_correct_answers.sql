-- Backfill: extract CJS correct answers out of cjs_data into correct_answer.
--
-- Before the f3beab3 / CJS-fix patch, CJS questions were saved with correct
-- answers embedded inside cjs_data->phases->questions->data (correctKey,
-- correctKeys, correctMapping, correctOrder, correctAnswers). The exam page
-- fetches cjs_data, so those answers were visible to students in DevTools.
--
-- This migration:
--   1. Reads correct answers from each phase question's data
--   2. Writes them to correct_answer as { phases: [ { questions: [...] } ] }
--   3. Strips the sensitive keys from cjs_data
--
-- Only touches rows where item_type = 'CJS' AND correct_answer is empty,
-- so it is safe to re-run.

DO $$
DECLARE
  r                 RECORD;
  i                 int;
  j                 int;
  phase             jsonb;
  pq                jsonb;
  pq_answer         jsonb;
  phase_answers     jsonb;
  all_phase_answers jsonb;
  stripped_pq       jsonb;
  stripped_qs       jsonb;
  stripped_phase    jsonb;
  stripped_phases   jsonb;
BEGIN
  FOR r IN
    SELECT id, cjs_data
    FROM instructor_questions
    WHERE item_type = 'CJS'
      AND cjs_data IS NOT NULL
      AND (correct_answer IS NULL OR correct_answer = '{}'::jsonb)
  LOOP
    all_phase_answers := '[]'::jsonb;
    stripped_phases   := '[]'::jsonb;

    FOR i IN 0 .. jsonb_array_length(r.cjs_data -> 'phases') - 1 LOOP
      phase         := r.cjs_data -> 'phases' -> i;
      phase_answers := '[]'::jsonb;
      stripped_qs   := '[]'::jsonb;

      FOR j IN 0 .. jsonb_array_length(phase -> 'questions') - 1 LOOP
        pq        := phase -> 'questions' -> j;
        pq_answer := '{}'::jsonb;

        CASE pq ->> 'type'
          WHEN 'MC' THEN
            IF (pq -> 'data') ? 'correctKey' THEN
              pq_answer := jsonb_build_object('correctKey', pq -> 'data' -> 'correctKey');
            END IF;
          WHEN 'MR' THEN
            IF (pq -> 'data') ? 'correctKeys' THEN
              pq_answer := jsonb_build_object('correctKeys', pq -> 'data' -> 'correctKeys');
            END IF;
          WHEN 'DD' THEN
            IF (pq -> 'data') ? 'correctMapping' THEN
              pq_answer := jsonb_build_object('correctMapping', pq -> 'data' -> 'correctMapping');
            END IF;
          WHEN 'OB' THEN
            IF (pq -> 'data') ? 'correctAnswers' THEN
              pq_answer := jsonb_build_object('correctAnswers', pq -> 'data' -> 'correctAnswers');
            END IF;
          WHEN 'BL' THEN
            IF (pq -> 'data') ? 'correctOrder' THEN
              pq_answer := jsonb_build_object('correctOrder', pq -> 'data' -> 'correctOrder');
            END IF;
          ELSE NULL;
        END CASE;

        phase_answers := phase_answers || jsonb_build_array(pq_answer);

        stripped_pq := pq || jsonb_build_object(
          'data',
          (pq -> 'data')
            - 'correctKey'
            - 'correctKeys'
            - 'correctMapping'
            - 'correctOrder'
            - 'correctAnswers'
            - 'correctRegionId'
        );
        stripped_qs := stripped_qs || jsonb_build_array(stripped_pq);
      END LOOP;

      all_phase_answers := all_phase_answers
        || jsonb_build_array(jsonb_build_object('questions', phase_answers));

      stripped_phase  := phase || jsonb_build_object('questions', stripped_qs);
      stripped_phases := stripped_phases || jsonb_build_array(stripped_phase);
    END LOOP;

    UPDATE instructor_questions
    SET
      correct_answer = jsonb_build_object('phases', all_phase_answers),
      cjs_data       = r.cjs_data || jsonb_build_object('phases', stripped_phases)
    WHERE id = r.id;

  END LOOP;
END $$;
