import type { Metadata } from "next";
import {
  Layers,
  Brain,
  Wrench,
  GitCompareArrows,
  Activity,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description:
    "TEI rendering, AI item generation, test builder, pre/post assessments, real ECG strips, and readiness scoring. Everything EMS programs need.",
};

/* ───────────────────────────── Data ───────────────────────────── */

const features = [
  {
    icon: Layers,
    title: "TEI Item Rendering Engine",
    description:
      "Foresight is the only institutional platform that renders all six NREMT Technology Enhanced Item formats exactly as they appear on exam day. Students interact with multiple response, drag-and-drop ordering, build list / place in order, hot spot, dropdown / cloze, and clinical judgment matrix items in a testing environment that mirrors the real certification exam.",
    stats: [
      "6 TEI item types fully rendered",
      "Pixel-accurate exam-day formatting",
      "Partial-credit scoring logic built in",
      "Accessible on desktop and tablet",
    ],
  },
  {
    icon: Brain,
    title: "RAG-Powered AI Item Generation",
    description:
      "Generate high-quality TEI assessment items in seconds using a retrieval-augmented generation pipeline grounded in 291 validated knowledge chunks. Each chunk maps to specific NREMT content domains and cognitive levels, ensuring generated items are clinically accurate and aligned to national standards. No hallucinated content makes it into student-facing assessments.",
    stats: [
      "291 validated knowledge chunks",
      "17 NREMT content domains covered",
      "3 cognitive levels per domain",
      "Human-in-the-loop review before publish",
    ],
  },
  {
    icon: Wrench,
    title: "TEI Test Builder",
    description:
      "Three tiers of assessment creation designed for different workflows. Use blank templates for full editorial control over each item. Use AI-assisted mode to generate a draft and refine it. Or describe the exam you need in plain language and let autopilot build a complete assessment across all six TEI types.",
    stats: [
      "Blank, AI-assisted, and autopilot modes",
      "Template-based editors for all 6 TEI types",
      "Drag-and-drop item reordering",
      "Shareable assessment links for cohorts",
    ],
  },
  {
    icon: GitCompareArrows,
    title: "Pre/Post Assessment Pipeline",
    description:
      "Measure true learning gains by delivering matched pre- and post-assessments on each TEI item type. The pipeline isolates growth by question format, content domain, and cognitive level so program directors can see exactly where instruction moved the needle and where gaps remain.",
    stats: [
      "Matched pre/post item pairs",
      "Growth measured per TEI type",
      "Domain-level gain analysis",
      "Exportable reports for accreditation",
    ],
  },
  {
    icon: Activity,
    title: "Real ECG Strip Library",
    description:
      "Attach real clinical ECG strips to any assessment item. The library contains 185 12-lead ECGs sourced from PhysioNet and clinical databases covering 40 rhythm classifications. No more hand-drawn strips or screenshots of textbook figures. Students interpret the same waveforms they will encounter in the field.",
    stats: [
      "185 real 12-lead ECG strips",
      "40 rhythm classifications",
      "PhysioNet and clinical sourcing",
      "Attach to any TEI item type",
    ],
  },
  {
    icon: TrendingUp,
    title: "Readiness Scoring & Error Pattern Analysis",
    description:
      "Every student receives a predictive NREMT readiness score computed from 27 tracked error patterns across 17 cognitive domains. Program directors see cohort-level heatmaps that surface at-risk students early enough to intervene. Error patterns reveal whether students struggle with content knowledge, clinical reasoning, or TEI format mechanics.",
    stats: [
      "27 tracked error patterns",
      "17 cognitive domains scored",
      "Predictive readiness algorithm",
      "Early-warning alerts for at-risk students",
    ],
  },
];

/* ─────────────────────────── Component ────────────────────────── */

export default function FeaturesPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
            Platform
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.1] mb-6">
            Built for program directors.
            <br className="hidden sm:block" />
            {" "}Powered by AI.
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Six core capabilities that don&apos;t exist together anywhere else
            in EMS education. Each one was built to solve a real problem we saw
            in the classroom.
          </p>
        </div>
      </section>

      {/* ── Feature Sections ── */}
      {features.map((feature, i) => {
        const Icon = feature.icon;
        const isAlt = i % 2 === 1;

        return (
          <section
            key={feature.title}
            className={`px-6 py-20 sm:py-28 ${isAlt ? "bg-zinc-50" : "bg-white"}`}
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-1">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    {feature.title}
                  </h2>
                </div>
              </div>

              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed mb-10 max-w-3xl">
                {feature.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {feature.stats.map((stat) => (
                  <div
                    key={stat}
                    className="bg-white border border-zinc-200 rounded-xl shadow-sm px-5 py-4 flex items-start gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-700 mt-2 shrink-0" />
                    <p className="text-sm font-medium text-zinc-700">{stat}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* ── CTA ── */}
      <section className="px-6 py-24 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            See it in action
          </h2>
          <p className="text-base text-zinc-500 max-w-xl mx-auto leading-relaxed mb-10">
            Request a walkthrough and we&apos;ll show you every feature with
            real data from a pilot program.
          </p>
          <a
            href="mailto:hello@foresight.edu?subject=Foresight Feature Demo"
            className="group inline-flex items-center gap-2 bg-zinc-900 text-white px-7 py-3 rounded-lg font-medium text-[15px] hover:bg-zinc-800 transition-colors"
          >
            Request a Demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>
    </>
  );
}
