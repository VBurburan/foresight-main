'use client';

import { Layers } from 'lucide-react';
import { InstructorGuard } from '@/components/auth/instructor-guard';

const TEI_EXAMPLES = [
  {
    type: 'MC',
    label: 'Multiple Choice',
    description: 'Standard 4-option, single correct answer. Tests recall and application.',
    example: {
      stem: 'A 62-year-old patient presents with acute onset chest pain radiating to the left arm, diaphoresis, and nausea. The 12-lead ECG shows ST elevation in leads II, III, and aVF. Which coronary artery is MOST likely occluded?',
      options: ['A. Left anterior descending (LAD)', 'B. Left circumflex (LCx)', 'C. Right coronary artery (RCA)', 'D. Left main coronary artery'],
      correct: 'C',
      rationale: 'ST elevation in leads II, III, and aVF indicates an inferior STEMI, which is most commonly caused by occlusion of the right coronary artery (RCA). The RCA supplies the inferior wall of the heart in approximately 85% of patients.',
    },
  },
  {
    type: 'MR',
    label: 'Multiple Response (SATA)',
    description: 'Select all that apply. 5-6 options, 2-3 correct. Tests comprehensive knowledge.',
    example: {
      stem: 'Which of the following are appropriate initial interventions for a patient presenting with signs and symptoms of acute pulmonary edema? (Select 3)',
      options: [
        'A. CPAP at 5-10 cmH\u2082O',
        'B. Furosemide 40mg IV',
        'C. Nitroglycerin 0.4mg SL',
        'D. Normal saline 500mL bolus',
        'E. Position patient upright',
        'F. Morphine 10mg IV push',
      ],
      correct: ['A', 'C', 'E'],
      rationale: 'CPAP reduces preload and afterload while improving oxygenation. Nitroglycerin provides vasodilation to reduce preload. Upright positioning reduces venous return. IV fluids would worsen pulmonary edema. High-dose morphine is no longer recommended.',
    },
  },
  {
    type: 'DD',
    label: 'Drag & Drop',
    description: 'Categorize items into groups. Tests classification and pattern recognition.',
    example: {
      stem: 'Classify each medication by its mechanism of action in the treatment of anaphylaxis:',
      categories: ['Sympathomimetic', 'Antihistamine', 'Corticosteroid'],
      items: ['Epinephrine', 'Diphenhydramine', 'Methylprednisolone', 'Albuterol', 'Famotidine', 'Dexamethasone'],
    },
  },
  {
    type: 'BL',
    label: 'Build List / Ordered Response',
    description: 'Arrange steps in correct order. Tests procedural knowledge and prioritization.',
    example: {
      stem: 'Place the following steps of rapid sequence intubation (RSI) in the correct order:',
      items: [
        '1. Preoxygenation with 100% O\u2082 for 3-5 minutes',
        '2. Administer induction agent (e.g., ketamine)',
        '3. Administer neuromuscular blocker (e.g., succinylcholine)',
        '4. Perform direct laryngoscopy and intubate',
        '5. Confirm placement with waveform capnography',
        '6. Secure tube and initiate post-intubation management',
      ],
    },
  },
  {
    type: 'OB',
    label: 'Options Box / Matrix',
    description: 'Match each row statement to a column. Tests differentiation and clinical reasoning.',
    example: {
      stem: 'For a patient presenting with an inferior STEMI and BP of 88/60, classify each intervention as Indicated or Contraindicated:',
      columns: ['Indicated', 'Contraindicated'],
      rows: [
        { statement: 'Aspirin 324 mg PO', correct: 'Indicated' },
        { statement: 'Nitroglycerin 0.4 mg SL', correct: 'Contraindicated' },
        { statement: 'Normal saline 250 mL IV bolus', correct: 'Indicated' },
        { statement: 'Morphine 2-4 mg IV for pain', correct: 'Contraindicated' },
        { statement: 'Right-sided 12-lead ECG (V4R)', correct: 'Indicated' },
      ],
    },
  },
  {
    type: 'CJS',
    label: 'Clinical Judgment Scenario',
    description: 'Multi-phase evolving patient scenario. Tests clinical reasoning across En Route, Scene, and Post-Scene phases with multiple question types.',
    example: {
      phases: [
        {
          label: 'En Route',
          context: 'You are dispatched to a residential address for a 58-year-old male complaining of chest pain and difficulty breathing. The caller (wife) states the pain started 30 minutes ago. He is conscious, alert, diaphoretic. Response time: ~8 minutes.',
          questions: ['MC: What equipment should you prioritize?', 'MR: Which differential diagnoses should you consider? (Select 2)'],
        },
        {
          label: 'Scene',
          context: 'Patient sitting upright, diaphoretic, clutching chest. Crushing substernal pressure radiating to left arm and jaw, 9/10 pain. VS: HR 110 irregular, BP 88/60, RR 24, SpO\u2082 91%. Hx: HTN, DM2, hyperlipidemia. Meds: metformin, lisinopril. 12-Lead: ST elevation II, III, aVF with reciprocal depression I, aVL.',
          questions: ['MC: Which coronary artery is most likely occluded?', 'BL: Prioritize initial interventions', 'OB: Classify interventions as Indicated vs Contraindicated'],
        },
        {
          label: 'Post-Scene',
          context: 'After aspirin, IV access, and fluid bolus: BP improved to 96/68, HR 100, SpO\u2082 94% on NRB. Patient reports pain 6/10 (improved). En route to PCI center, ETA 15 minutes.',
          questions: ['MC: What is the MOST appropriate next intervention?', 'MR: Which findings indicate need for immediate cath lab activation? (Select 3)'],
        },
      ],
    },
  },
];

function ExamplesContent() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">TEI Reference</h1>
          <p className="text-sm text-zinc-400 mt-1">Reference guide for creating NREMT-style assessment items</p>
        </div>

        <p className="text-sm text-zinc-400">
          These examples show how each Technology Enhanced Item (TEI) type appears to students.
          Use them as reference when building your own assessments in the Test Builder.
        </p>

        {/* TEI Examples */}
        <div className="space-y-8">
          {TEI_EXAMPLES.map((tei) => (
            <div key={tei.type} className="border-l-2 border-zinc-700 pl-6">
              {/* Type header */}
              <div className="flex items-center gap-3 mb-2">
                <span className="surface-2 text-zinc-300 font-mono text-xs font-semibold rounded px-2 py-0.5">
                  {tei.type}
                </span>
                <span className="text-base font-semibold text-zinc-50">{tei.label}</span>
              </div>
              <p className="text-sm text-zinc-400 mb-4">{tei.description}</p>

              {/* MC/MR Example */}
              {(tei.type === 'MC' || tei.type === 'MR') && tei.example && 'options' in tei.example && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300">{tei.example.stem}</p>
                  <div className="space-y-1.5">
                    {(tei.example.options || []).map((opt: string) => {
                      const key = opt.charAt(0);
                      const isCorrect = Array.isArray(tei.example.correct)
                        ? tei.example.correct.includes(key)
                        : tei.example.correct === key;
                      return (
                        <div
                          key={opt}
                          className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
                            isCorrect ? 'surface-1 ring-1 ring-white/[0.06] font-medium text-zinc-50' : 'text-zinc-400'
                          }`}
                        >
                          {isCorrect && <span className="text-emerald-400 text-xs font-bold">&#10003;</span>}
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                  {tei.example.rationale && (
                    <div className="border-l-2 border-zinc-700 pl-4 mt-3">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Rationale</p>
                      <p className="text-sm text-zinc-400">{tei.example.rationale}</p>
                    </div>
                  )}
                </div>
              )}

              {/* DD Example */}
              {tei.type === 'DD' && tei.example && 'categories' in tei.example && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300">{tei.example.stem}</p>
                  <div className="flex gap-2 flex-wrap">
                    {((tei.example as any).items || []).map((item: string) => (
                      <span key={item} className="px-3 py-1.5 rounded surface-1 ring-1 ring-white/[0.06] text-xs font-medium text-zinc-300">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {((tei.example as any).categories || []).map((cat: string) => (
                      <div key={cat} className="rounded border-2 border-dashed border-zinc-700 p-3 text-center">
                        <p className="text-xs font-semibold text-zinc-400">{cat}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BL Example */}
              {tei.type === 'BL' && tei.example && 'items' in tei.example && !('categories' in tei.example) && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300">{tei.example.stem}</p>
                  <div className="space-y-1.5">
                    {((tei.example as any).items || []).map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 rounded surface-1 ring-1 ring-white/[0.06] px-3 py-2">
                        <span className="text-xs font-mono font-semibold text-zinc-400 w-5 text-center">{i + 1}</span>
                        <span className="text-sm text-zinc-300">{item.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OB Example */}
              {tei.type === 'OB' && tei.example && 'columns' in tei.example && 'rows' in tei.example && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300">{tei.example.stem}</p>
                  <div className="rounded-lg surface-1 ring-1 ring-white/[0.06] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left py-2 px-3 font-medium text-zinc-400">Intervention</th>
                          {((tei.example as any).columns || []).map((col: string) => (
                            <th key={col} className="text-center py-2 px-3 font-medium text-zinc-400">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {((tei.example as any).rows || []).map((row: any, ri: number) => (
                          <tr key={ri} className="border-b border-white/[0.04]">
                            <td className="py-2 px-3 text-zinc-300">{row.statement}</td>
                            {((tei.example as any).columns || []).map((col: string) => (
                              <td key={col} className="text-center py-2 px-3">
                                <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                                  row.correct === col ? 'border-white bg-white' : 'border-zinc-600'
                                }`} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CJS Example */}
              {tei.type === 'CJS' && tei.example && 'phases' in tei.example && (
                <div className="space-y-4">
                  {(tei.example.phases as any[]).map((phase: any, pi: number) => (
                    <div key={pi} className="border-l-2 border-zinc-700 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-zinc-400">Phase {pi + 1}</span>
                        <span className="text-sm font-semibold text-zinc-300">{phase.label}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-2 leading-relaxed">{phase.context}</p>
                      <div className="space-y-1">
                        {phase.questions.map((q: string, qi: number) => (
                          <div key={qi} className="flex items-center gap-2 text-xs text-zinc-400">
                            <Layers className="h-3 w-3 flex-shrink-0" />
                            {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExamplesPage() {
  return (
    <InstructorGuard>
      <ExamplesContent />
    </InstructorGuard>
  );
}
