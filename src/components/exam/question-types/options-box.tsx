'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface Row {
  statement: string;
  options: string[];
}

interface OptionsBoxProps {
  question: {
    id: string;
    options: any;
    correct_answer: Record<string, string>;
    raw_options?: any;
  };
  response: { answer: Record<string, string> } | undefined;
  onAnswer: (answer: Record<string, string>) => void;
  showFeedback: boolean;
}

/**
 * Normalize a string for fuzzy comparison: lowercase, collapse whitespace, trim.
 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Find the correct_answer key that best matches a given row statement.
 * Tries: exact match, normalized match, substring containment in either direction.
 * Returns the matched key or undefined.
 */
function findMatchingCorrectKey(
  statement: string,
  correctAnswer: Record<string, string>
): string | undefined {
  const keys = Object.keys(correctAnswer);

  // 1. Exact match
  if (correctAnswer[statement] !== undefined) return statement;

  const normStatement = normalize(statement);

  for (const key of keys) {
    const normKey = normalize(key);

    // 2. Normalized exact match
    if (normKey === normStatement) return key;

    // 3. One contains the other (handles truncated / prefixed keys)
    if (normStatement.includes(normKey) || normKey.includes(normStatement)) {
      return key;
    }
  }

  return undefined;
}

export default function OptionsBox({
  question,
  response,
  onAnswer,
  showFeedback,
}: OptionsBoxProps) {
  // Prefer raw_options (DB format) over options (adapted format, empty [] for OB)
  // An empty array is truthy, so check explicitly for OB's object structure
  const rawOptions = (() => {
    if (question.raw_options && typeof question.raw_options === 'object' && !Array.isArray(question.raw_options)) {
      return question.raw_options;
    }
    if (question.options && typeof question.options === 'object' && !Array.isArray(question.options)) {
      return question.options;
    }
    return question.raw_options || question.options;
  })();

  // Parse rows and headers from the raw options, memoised so the reference is
  // stable across renders (fixes react-hooks/exhaustive-deps warning).
  const { rows, headers } = useMemo(() => {
    /**
     * Normalise raw DB rows into Row[].
     * Rows can be: string[] | { statement: string; options?: string[] }[]
     */
    function normaliseRows(raw: any[], hdrs: string[]): Row[] {
      return raw.map((item: any) => {
        if (typeof item === 'string') {
          return { statement: item, options: hdrs };
        }
        // Object with a statement (or text/label/condition) property
        const stmt =
          item.statement ?? item.text ?? item.label ?? item.condition ?? String(item);
        return { statement: String(stmt), options: item.options ?? hdrs };
      });
    }

    let parsedRows: Row[] = [];
    let parsedHeaders: string[] = [];

    if (rawOptions?.rows && rawOptions?.headers) {
      parsedHeaders = Array.isArray(rawOptions.headers) ? rawOptions.headers.map(String) : [];
      parsedRows = normaliseRows(rawOptions.rows, parsedHeaders);
    } else if (rawOptions?.rows && rawOptions?.columns) {
      // Common DB format: { rows: [...], columns: [...] }
      parsedHeaders = Array.isArray(rawOptions.columns) ? rawOptions.columns.map(String) : [];
      parsedRows = normaliseRows(rawOptions.rows, parsedHeaders);
    } else if (rawOptions?.conditions && rawOptions?.categories) {
      // Convert conditions/categories format to rows/headers format
      parsedHeaders = Array.isArray(rawOptions.categories) ? rawOptions.categories.map(String) : [];
      parsedRows = normaliseRows(rawOptions.conditions, parsedHeaders);
    } else if (rawOptions?.statements && rawOptions?.columns) {
      // Alternate DB format: statements + columns
      parsedHeaders = Array.isArray(rawOptions.columns) ? rawOptions.columns.map(String) : [];
      parsedRows = normaliseRows(rawOptions.statements, parsedHeaders);
    } else if (rawOptions?.statements && rawOptions?.headers) {
      // Another alternate: statements + headers
      parsedHeaders = Array.isArray(rawOptions.headers) ? rawOptions.headers.map(String) : [];
      parsedRows = normaliseRows(rawOptions.statements, parsedHeaders);
    } else if (rawOptions && typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
      // Last resort: try to extract any array properties as conditions/headers
      const keys = Object.keys(rawOptions);
      const arrayKeys = keys.filter((k) => Array.isArray(rawOptions[k]));
      if (arrayKeys.length >= 2) {
        // Heuristic: the longer array is likely the conditions/rows, shorter is categories/headers
        const sorted = arrayKeys.sort((a, b) => rawOptions[b].length - rawOptions[a].length);
        const conditionsKey = sorted[0];
        const headersKey = sorted[1];
        parsedHeaders = rawOptions[headersKey].map(String);
        parsedRows = normaliseRows(rawOptions[conditionsKey], parsedHeaders);
      }
    }

    return { rows: parsedRows, headers: parsedHeaders };
  }, [rawOptions]);

  const [selections, setSelections] = useState<Record<string, string>>(
    response?.answer || {}
  );
  const isAnswered = !!response?.answer && Object.keys(response.answer).length === rows.length;
  const correctAnswer = question.correct_answer;

  // Pre-compute the mapping: row.statement -> matching correct_answer key
  const matchedKeys = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const row of rows) {
      map[row.statement] = findMatchingCorrectKey(row.statement, correctAnswer);
    }
    return map;
  }, [rows, correctAnswer]);

  const handleSelect = (rowIndex: number, header: string) => {
    if (isAnswered) return;

    const rowKey = rows[rowIndex].statement;
    const newSelections = { ...selections, [rowKey]: header };
    setSelections(newSelections);

    // Auto-submit when all rows have selections
    if (Object.keys(newSelections).length === rows.length) {
      onAnswer(newSelections);
    }
  };

  const isAllCorrect =
    isAnswered &&
    rows.every((row) => {
      const userVal = selections[row.statement];
      const matchedKey = matchedKeys[row.statement];
      const correctVal = matchedKey != null ? correctAnswer[matchedKey] : undefined;
      return (
        userVal != null &&
        correctVal != null &&
        userVal.trim().toLowerCase() === correctVal.trim().toLowerCase()
      );
    });

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm font-medium text-blue-900">
          Select the correct option for each row
        </p>
      </div>

      {/* Desktop: Table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 w-2/5">
                Statement
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="text-center p-3 bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  {header}
                </th>
              ))}
              {showFeedback && (
                <th className="text-center p-3 bg-slate-50 border border-slate-200 w-12" />
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const userVal = selections[row.statement];
              const matchedKey = matchedKeys[row.statement];
              const correctVal = matchedKey != null ? correctAnswer[matchedKey] : undefined;
              const isRowCorrect =
                userVal != null &&
                correctVal != null &&
                userVal.trim().toLowerCase() === correctVal.trim().toLowerCase();

              return (
                <motion.tr
                  key={rowIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.05 }}
                  className={
                    showFeedback
                      ? isRowCorrect
                        ? 'bg-green-50'
                        : 'bg-red-50'
                      : ''
                  }
                >
                  <td className="p-3 border border-slate-200 text-sm text-slate-800 font-medium">
                    {row.statement}
                  </td>
                  {headers.map((header) => {
                    const isSelected = userVal === header;
                    const isCorrectOption =
                      showFeedback &&
                      correctVal != null &&
                      correctVal.trim().toLowerCase() === header.trim().toLowerCase();

                    return (
                      <td
                        key={header}
                        className="p-3 border border-slate-200 text-center"
                      >
                        <button
                          onClick={() => handleSelect(rowIndex, header)}
                          disabled={isAnswered}
                          className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                            isSelected
                              ? showFeedback && !isRowCorrect
                                ? 'border-red-400 bg-red-400'
                                : 'border-[#E67E22] bg-[#E67E22]'
                              : isCorrectOption
                                ? 'border-green-400 bg-green-400'
                                : 'border-slate-300 hover:border-slate-400'
                          } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          )}
                          {!isSelected && isCorrectOption && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                  {showFeedback && (
                    <td className="p-3 border border-slate-200 text-center">
                      {isRowCorrect ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Stacked cards */}
      <div className="md:hidden space-y-4">
        {rows.map((row, rowIndex) => {
          const userVal = selections[row.statement];
          const matchedKey = matchedKeys[row.statement];
          const correctVal = matchedKey != null ? correctAnswer[matchedKey] : undefined;
          const isRowCorrect =
            userVal != null &&
            correctVal != null &&
            userVal.trim().toLowerCase() === correctVal.trim().toLowerCase();

          return (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.08 }}
              className={`border-2 rounded-lg p-4 ${
                showFeedback
                  ? isRowCorrect
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                  : 'border-slate-200'
              }`}
            >
              <p className="text-sm font-medium text-slate-800 mb-3">
                {row.statement}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {headers.map((header) => {
                  const isSelected = userVal === header;
                  const isCorrectOption =
                    showFeedback &&
                    correctVal != null &&
                    correctVal.trim().toLowerCase() ===
                      header.trim().toLowerCase();

                  return (
                    <button
                      key={header}
                      onClick={() => handleSelect(rowIndex, header)}
                      disabled={isAnswered}
                      className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                        isSelected
                          ? showFeedback && !isRowCorrect
                            ? 'border-red-300 bg-red-100 text-red-800'
                            : 'border-[#E67E22] bg-orange-50 text-[#E67E22]'
                          : isCorrectOption
                            ? 'border-green-300 bg-green-100 text-green-800'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {header}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Result feedback */}
      {isAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-2 ${
            isAllCorrect
              ? 'border-green-300 bg-green-50'
              : 'border-red-300 bg-red-50'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              isAllCorrect ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {isAllCorrect
              ? 'Correct! All rows matched correctly.'
              : 'Incorrect. Review the highlighted rows.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
