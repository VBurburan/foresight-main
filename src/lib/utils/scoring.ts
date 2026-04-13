/**
 * Scoring utility for Path2Medic question types.
 * Handles all 6 item types (MC, MR, DD, BL, OB, CL) with
 * proper normalization for the exact JSONB formats in Supabase.
 *
 * RULES:
 * - Binary scoring only (no partial credit)
 * - Type normalization (string/int mismatches)
 * - Key normalization (different key formats between answer keys and submissions)
 */

import type { ItemType, Json } from '@/types/database';

/**
 * Score a student's answer against the correct answer for any item type.
 * Returns true if the answer is fully correct, false otherwise.
 */
export function scoreAnswer(
  itemType: ItemType,
  correctAnswer: Json,
  userAnswer: Json
): boolean {
  if (userAnswer == null || correctAnswer == null) return false;

  switch (itemType) {
    case 'MC':
      return scoreMC(correctAnswer, userAnswer);
    case 'MR':
      return scoreMR(correctAnswer, userAnswer);
    case 'DD':
      return scoreDD(correctAnswer, userAnswer);
    case 'BL':
      return scoreBL(correctAnswer, userAnswer);
    case 'OB':
      return scoreOB(correctAnswer, userAnswer);
    case 'CL':
      return scoreCL(correctAnswer, userAnswer);
    case 'HS':
      return scoreHS(correctAnswer, userAnswer);
    default:
      return false;
  }
}

/**
 * MC: exact string match on single option key.
 * correct_answer: "B" or { answer: "B" }
 * userAnswer: "B" or { answer: "B" }
 */
function scoreMC(correct: Json, user: Json): boolean {
  const c = extractString(correct);
  const u = extractString(user);
  if (c == null || u == null) return false;
  return c.trim().toUpperCase() === u.trim().toUpperCase();
}

/**
 * MR: array exact match (order-independent).
 * correct_answer: ["A", "C", "E"] or { answers: ["A","C","E"] }
 * userAnswer: ["A", "C", "E"] or { answers: ["A","C","E"] }
 */
function scoreMR(correct: Json, user: Json): boolean {
  const cArr = extractArray(correct);
  const uArr = extractArray(user);
  if (!cArr || !uArr) return false;

  const cSorted = cArr.map((s) => String(s).trim().toUpperCase()).sort();
  const uSorted = uArr.map((s) => String(s).trim().toUpperCase()).sort();

  if (cSorted.length !== uSorted.length) return false;
  return cSorted.every((val, idx) => val === uSorted[idx]);
}

/**
 * DD: all key-value pairs must match.
 * correct_answer: { "q45a": "RED (Immediate)", "q45b": "GREEN (Minor)" }
 * userAnswer: { "q45a": "RED (Immediate)", "q45b": "GREEN (Minor)" }
 *
 * Because of potential key format mismatches, we compare sorted values
 * when keys don't match between correct and user.
 */
function scoreDD(correct: Json, user: Json): boolean {
  const cObj = extractObject(correct);
  const uObj = extractObject(user);
  if (!cObj || !uObj) return false;

  const cKeys = Object.keys(cObj).sort();
  const uKeys = Object.keys(uObj).sort();

  // Try exact key match first
  if (cKeys.length === uKeys.length && cKeys.every((k, i) => k === uKeys[i])) {
    return cKeys.every(
      (key) =>
        String(cObj[key]).trim().toLowerCase() ===
        String(uObj[key]).trim().toLowerCase()
    );
  }

  // Fallback: compare sorted values only (handles key format mismatch)
  if (cKeys.length !== uKeys.length) return false;
  const cValues = cKeys.map((k) => String(cObj[k]).trim().toLowerCase()).sort();
  const uValues = uKeys.map((k) => String(uObj[k]).trim().toLowerCase()).sort();
  return cValues.every((val, idx) => val === uValues[idx]);
}

/**
 * BL: exact ordered array match with type normalization.
 * correct_answer: [2, 1, 4, 0, 3] (may be integers)
 * userAnswer: ["2", "1", "4", "0", "3"] (may be strings)
 */
function scoreBL(correct: Json, user: Json): boolean {
  const cArr = extractArray(correct);
  const uArr = extractArray(user);
  if (!cArr || !uArr) return false;
  if (cArr.length !== uArr.length) return false;

  // Normalize both to strings for comparison
  return cArr.every((val, idx) => String(val).trim() === String(uArr[idx]).trim());
}

/**
 * Normalize a string for fuzzy comparison: lowercase, collapse whitespace, trim.
 */
function normalizeOBKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Find the best matching key in `target` for a given `sourceKey`.
 * Tries: exact, normalized exact, substring containment in either direction.
 */
function findMatchingKey(
  sourceKey: string,
  target: Record<string, Json>
): string | undefined {
  if (target[sourceKey] !== undefined) return sourceKey;

  const normSource = normalizeOBKey(sourceKey);
  for (const tKey of Object.keys(target)) {
    const normTarget = normalizeOBKey(tKey);
    if (normSource === normTarget) return tKey;
    if (normSource.includes(normTarget) || normTarget.includes(normSource)) {
      return tKey;
    }
  }
  return undefined;
}

/**
 * OB: all row assignments must match (binary all-or-nothing).
 * correct_answer: { "Isolated wrist fracture": "Closest Hospital", ... }
 * userAnswer: { "Sudden onset facial droop, arm weakness...": "Stroke Center", ... }
 *
 * Keys may differ between correct_answer and userAnswer (e.g. the correct_answer
 * key may be a shortened version of the row statement used as the user key).
 * We fuzzy-match keys via normalization and substring containment.
 */
function scoreOB(correct: Json, user: Json): boolean {
  const cObj = extractObject(correct);
  const uObj = extractObject(user);
  if (!cObj || !uObj) return false;

  const cKeys = Object.keys(cObj);
  const uKeys = Object.keys(uObj);
  if (cKeys.length !== uKeys.length) return false;

  // Try exact key match first
  const sortedCKeys = [...cKeys].sort();
  const sortedUKeys = [...uKeys].sort();
  const keysMatch = sortedCKeys.every((k, i) => k === sortedUKeys[i]);
  if (keysMatch) {
    return cKeys.every(
      (key) =>
        String(cObj[key]).trim().toLowerCase() ===
        String(uObj[key]).trim().toLowerCase()
    );
  }

  // Fuzzy key match: for each user key, find the matching correct key
  for (const uKey of uKeys) {
    const matchedCKey = findMatchingKey(uKey, cObj);
    if (matchedCKey == null) return false;

    const cVal = String(cObj[matchedCKey]).trim().toLowerCase();
    const uVal = String(uObj[uKey]).trim().toLowerCase();
    if (cVal !== uVal) return false;
  }

  return true;
}

/**
 * CL: all blanks must be correct.
 * correct_answer: { "blank1": "answer1", "blank2": "answer2" }
 * userAnswer: { "blank1": "answer1", "blank2": "answer2" }
 */
function scoreCL(correct: Json, user: Json): boolean {
  const cObj = extractObject(correct);
  const uObj = extractObject(user);
  if (!cObj || !uObj) return false;

  const cKeys = Object.keys(cObj);
  if (cKeys.length === 0) return false;

  return cKeys.every(
    (key) =>
      uObj[key] != null &&
      String(cObj[key]).trim().toLowerCase() ===
        String(uObj[key]).trim().toLowerCase()
  );
}

/**
 * HS: selected region ID must match correct region ID.
 * correct_answer: { correctRegionId: "r_123" }
 * userAnswer: "r_123" or { selectedRegionId: "r_123" }
 */
function scoreHS(correct: Json, user: Json): boolean {
  const cObj = extractObject(correct);
  if (!cObj) return false;
  const correctId = String(cObj.correctRegionId || '');
  if (!correctId) return false;

  let userId: string;
  if (typeof user === 'string') {
    userId = user;
  } else if (user && typeof user === 'object' && !Array.isArray(user)) {
    userId = String((user as Record<string, Json>).selectedRegionId || '');
  } else {
    return false;
  }

  return correctId === userId;
}

// --- Helpers ---

function extractString(val: Json): string | null {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const obj = val as Record<string, Json>;
    if (typeof obj.answer === 'string') return obj.answer;
  }
  return null;
}

function extractArray(val: Json): Json[] | null {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const obj = val as Record<string, Json>;
    if (Array.isArray(obj.answers)) return obj.answers;
    if (Array.isArray(obj.order)) return obj.order;
  }
  return null;
}

function extractObject(val: Json): Record<string, Json> | null {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return val as Record<string, Json>;
  }
  return null;
}
