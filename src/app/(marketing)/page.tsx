import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  Brain,
  BarChart3,
  Activity,
  Shield,
  Target,
  Pencil,
  Send,
  LineChart,
  ArrowRight,
  Check,
  Minus,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Foresight | Assessment Infrastructure for EMS Programs",
  description:
    "Build NREMT-style TEI assessments, track cohort analytics, and identify at-risk students. The assessment platform built for EMS educators.",
};

/* ───────────────────────────── Data ───────────────────────────── */

const stats = [
  { value: "1,350+", label: "Assessment Items" },
  { value: "6", label: "TEI Types" },
  { value: "185", label: "ECG Strips" },
  { value: "291", label: "RAG Chunks" },
];

const steps = [
  {
    num: "01",
    icon: Pencil,
    title: "Create",
    desc: "Build assessments with real TEI formats. Use blank templates, AI-assisted generation, or full autopilot.",
  },
  {
    num: "02",
    icon: Send,
    title: "Deliver",
    desc: "Students take exams with the same interactive question types they will face on the NREMT.",
  },
  {
    num: "03",
    icon: LineChart,
    title: "Analyze",
    desc: "Drill into performance by student, cohort, domain, or TEI type. Spot at-risk students early.",
  },
];

const features = [
  {
    icon: Layers,
    title: "TEI Question Engine",
    desc: "All 6 NREMT item types rendered exactly as they appear on exam day -- multiple response, drag-and-drop, build list, options box, and clinical judgment.",
  },
  {
    icon: Brain,
    title: "Intelligent Test Builder",
    desc: "Build assessments from scratch, use smart generation to create questions at scale, or mix both approaches. You control the content.",
  },
  {
    icon: BarChart3,
    title: "Cohort Analytics",
    desc: "Domain-level heatmaps, TEI-type breakdowns, score trends, and error pattern detection across your entire program.",
  },
  {
    icon: Activity,
    title: "ECG Strip Library",
    desc: "164 real 12-lead ECGs sourced from PhysioNet covering 32 rhythm classifications. Attach directly to any question.",
  },
  {
    icon: Shield,
    title: "Accreditation Tracking",
    desc: "Live tracking against CoAEMSP thresholds -- retention rate, NREMT pass rate, and placement metrics with predictive alerts.",
  },
  {
    icon: Target,
    title: "Readiness Scoring",
    desc: "Identify at-risk students before exam day. Track error patterns across cognitive domains to allocate your teaching time where it matters most.",
  },
];

const competitors = [
  { name: "Foresight", tei: true, ai: true, analytics: true, ecg: true, builder: true, readiness: true },
  { name: "Fisdap", tei: false, ai: false, analytics: true, ecg: false, builder: true, readiness: true },
  { name: "EMSTesting", tei: false, ai: false, analytics: true, ecg: false, builder: true, readiness: false },
  { name: "Limmer", tei: true, ai: false, analytics: false, ecg: false, builder: false, readiness: false },
  { name: "Pocket Prep", tei: false, ai: false, analytics: true, ecg: false, builder: false, readiness: false },
];

const compCols = [
  { key: "tei" as const, label: "TEI Rendering" },
  { key: "ai" as const, label: "AI Item Gen" },
  { key: "analytics" as const, label: "Cohort Analytics" },
  { key: "ecg" as const, label: "Real ECGs" },
  { key: "builder" as const, label: "Test Builder" },
  { key: "readiness" as const, label: "Readiness Score" },
];

const trustSignals = [
  "All 6 NREMT TEI Formats",
  "FERPA Compliant",
  "CoAEMSP-Aligned Reporting",
  "Real-Time Cohort Analytics",
];

/* ─────────────────────────── Component ────────────────────────── */

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative px-6 pt-24 pb-28 sm:pt-32 sm:pb-36">
        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_70%)]" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Centered logo in white container */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white shadow-elevation-3 shadow-glow-blue p-6 flex items-center justify-center">
              <Image
                src="/images/foresight-logo.png"
                alt="Foresight"
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 glass-card px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400" />
            </span>
            <span className="text-xs font-medium text-zinc-600 tracking-wide">
              Built for EMS Educators
            </span>
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 leading-[1.08] mb-6">
            The exam changed.
            <br className="hidden sm:block" />
            {" "}The preparation didn&apos;t.
          </h1>

          <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Foresight is the first institutional assessment platform that renders
            Technology Enhanced Items for EMS certification &mdash; so students
            practice the real exam format from day one.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-20">
            <a
              href="mailto:hello@foresight.edu"
              className="group inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg font-medium text-[15px] transition-colors"
            >
              Request Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 glass-card px-6 py-3 text-zinc-600 hover:text-zinc-900 border border-zinc-300 font-medium text-[15px] transition-colors"
            >
              See How It Works
            </a>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 sm:gap-16">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-8 sm:gap-16">
                <div className="text-center">
                  <p className="font-heading text-2xl font-bold text-zinc-900 tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">
                    {s.label}
                  </p>
                </div>
                {i < stats.length - 1 && (
                  <div className="h-8 w-px bg-zinc-300 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem Statement ── */}
      <section className="relative px-6 py-24 sm:py-28 border-y border-zinc-200">
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
            The problem
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-zinc-900 leading-tight mb-6">
            The exam changed.
            <br />
            Assessment tools didn&apos;t.
          </h2>
          {/* The key quote */}
          <blockquote className="text-lg sm:text-xl text-zinc-700 max-w-2xl mx-auto leading-relaxed mb-6 italic border-l-2 border-zinc-300 pl-5 text-left">
            &ldquo;Students spent 6 to 18 months practicing one format, then sat for an exam with formats they had literally never seen.&rdquo;
          </blockquote>

          <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-6">
            Since July 2024, every NREMT certification exam includes scored Technology Enhanced Items &mdash; drag-and-drop sequencing, multi-phase clinical judgment scenarios, checkbox grids, build-a-list prioritization. These interactive formats go far beyond multiple choice.
          </p>
          <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-16">
            Yet every institutional assessment platform &mdash; Fisdap, EMSTesting, JBL Navigate &mdash; still delivers questions exclusively as standard multiple choice. The first complete post-TEI accreditation review cycle finishes in 2026, and programs that can&apos;t maintain a 70% pass rate risk losing CAAHEP accreditation.
          </p>

          {/* Format Gap Visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            {/* What students practice */}
            <div className="glass-card p-6 border-l-2 border-l-red-400/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-3">What students practice</p>
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-3">
                <p className="text-sm text-zinc-700 mb-3 leading-relaxed">A 54-year-old male presents with chest pain radiating to the left arm. Which is the most appropriate initial intervention?</p>
                <div className="space-y-1.5">
                  {["A. Administer nitroglycerin", "B. Obtain a 12-lead ECG", "C. Start an IV", "D. Administer morphine"].map((opt) => (
                    <div key={opt} className="flex items-center gap-2 text-xs text-zinc-500">
                      <div className="w-3 h-3 rounded-full border border-zinc-300" />
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-400 italic">Standard multiple choice &mdash; the only format in classroom tools</p>
            </div>

            {/* What NREMT actually tests — rendered TEI mockups */}
            <div className="glass-card p-6 border-l-2 border-l-emerald-500/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-3">What the NREMT actually tests</p>
              <div className="space-y-3">
                {/* Build List / Ordered Response mockup */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-2">Build List — Ordered Response</p>
                  <p className="text-xs text-zinc-600 mb-2">Place the cardiac arrest interventions in the correct sequence:</p>
                  <div className="space-y-1">
                    {["1. Begin chest compressions", "2. Apply AED / defibrillator", "3. Establish IV/IO access", "4. Administer epinephrine 1mg IV"].map((step, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white border border-emerald-200 rounded px-2.5 py-1.5 text-xs text-zinc-700">
                        <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                        <span className="flex-1">{step.slice(3)}</span>
                        <svg className="w-3 h-3 text-zinc-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Response mockup */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-2">Multiple Response — Select All That Apply</p>
                  <p className="text-xs text-zinc-600 mb-2">Which findings indicate decompensated shock? (Select 3)</p>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { text: "Altered mental status", checked: true },
                      { text: "Hypotension", checked: true },
                      { text: "Bounding pulses", checked: false },
                      { text: "Delayed capillary refill", checked: true },
                      { text: "Warm, dry skin", checked: false },
                      { text: "Bradycardia", checked: false },
                    ].map((opt) => (
                      <div key={opt.text} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] ${opt.checked ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
                        <div className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${opt.checked ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-300'}`}>
                          {opt.checked && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                        </div>
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Options Box mockup */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-2">Options Box — Matrix Grid</p>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr>
                        <th className="text-left py-1 px-1.5 text-zinc-500 font-medium">Medication</th>
                        <th className="text-center py-1 px-1.5 text-zinc-500 font-medium">Indicated</th>
                        <th className="text-center py-1 px-1.5 text-zinc-500 font-medium">Contraindicated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { med: "Aspirin 324mg", val: "indicated" },
                        { med: "Nitroglycerin 0.4mg SL", val: "contraindicated" },
                        { med: "Epinephrine 0.3mg IM", val: "contraindicated" },
                      ].map((row) => (
                        <tr key={row.med} className="border-t border-zinc-200">
                          <td className="py-1 px-1.5 text-zinc-700">{row.med}</td>
                          <td className="text-center py-1 px-1.5">
                            <div className={`w-3 h-3 rounded-full border mx-auto ${row.val === 'indicated' ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-300'}`} />
                          </td>
                          <td className="text-center py-1 px-1.5">
                            <div className={`w-3 h-3 rounded-full border mx-auto ${row.val === 'contraindicated' ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-300'}`} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-zinc-400 italic mt-3">Interactive TEI formats &mdash; scored on every NREMT exam since 2024</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-6 max-w-3xl mx-auto">
            {[
              { value: "31-43%", label: "of the NREMT is now Clinical Judgment or Primary Assessment" },
              { value: "2,000+", label: "EMS programs with no TEI tools" },
              { value: "70%", label: "first-attempt pass rate for accreditation" },
            ].map((item) => (
              <div key={item.value} className="glass-card p-6">
                <p className="font-heading text-4xl sm:text-5xl font-bold text-zinc-900">
                  {item.value}
                </p>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="px-6 py-24 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
              How it works
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
              Create. Deliver. Analyze.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 relative">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="relative text-center px-8 py-6">
                  {/* Vertical divider between columns (desktop) */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-24 w-px bg-zinc-200" />
                  )}
                  {/* Horizontal divider between rows (mobile) */}
                  {i < steps.length - 1 && (
                    <div className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-zinc-200" />
                  )}

                  <p className="text-xs font-bold text-blue-700 tracking-[0.25em] uppercase mb-4">
                    {s.num}
                  </p>
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-5">
                    <Icon className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-zinc-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-[280px] mx-auto">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-24 sm:py-28 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
              Platform
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
              Everything you need to assess,
              <br className="hidden sm:block" />
              {" "}track, and intervene
            </h2>
            <p className="text-base text-zinc-500 max-w-xl mx-auto">
              Six capabilities that don&apos;t exist together anywhere else in
              EMS education.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 hover:border-zinc-300 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="font-heading text-[15px] font-bold text-zinc-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              View all features in detail
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="px-6 py-24 sm:py-28 border-y border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
              Landscape
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
              How Foresight compares
            </h2>
            <p className="text-base text-zinc-500 max-w-lg mx-auto">
              The only platform combining institutional analytics with real TEI
              rendering and AI generation.
            </p>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-3 pr-4 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                    Platform
                  </th>
                  {compCols.map((c) => (
                    <th
                      key={c.key}
                      className="text-center py-3 px-2 font-medium text-zinc-500 text-xs uppercase tracking-wider"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, idx) => (
                  <tr
                    key={comp.name}
                    className={`border-b border-zinc-200 ${
                      idx === 0 ? "bg-blue-50" : ""
                    }`}
                  >
                    <td
                      className={`py-3.5 pr-4 ${
                        idx === 0
                          ? "text-blue-700 font-semibold"
                          : "text-zinc-500"
                      }`}
                    >
                      {comp.name}
                    </td>
                    {compCols.map((c) => (
                      <td key={c.key} className="text-center py-3.5 px-2">
                        {comp[c.key] ? (
                          <Check className="h-4 w-4 text-blue-700 mx-auto" strokeWidth={2.5} />
                        ) : (
                          <Minus className="h-3.5 w-3.5 text-zinc-700 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Trust / Enterprise ── */}
      <section className="px-6 py-24 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
            Enterprise ready
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-6">
            Built for institutional
            <br className="hidden sm:block" />
            {" "}compliance and scale
          </h2>
          <p className="text-base text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Foresight is designed from the ground up for EMS education programs
            that need accreditation-ready assessment infrastructure. Every feature
            maps to CoAEMSP standards, and every data point feeds directly into
            your annual report.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {trustSignals.map((signal) => (
              <span
                key={signal}
                className="glass-card inline-flex items-center px-4 py-1.5 text-xs font-medium text-zinc-600"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-6 py-24 sm:py-28">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Ready to modernize
            <br className="hidden sm:block" />
            {" "}your assessments?
          </h2>
          <p className="text-base text-zinc-500 max-w-xl mx-auto leading-relaxed mb-10">
            Currently in pilot with select EMS programs. Request access for
            early onboarding and institutional pricing.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="mailto:hello@foresight.edu"
              className="group inline-flex items-center gap-2 bg-zinc-900 text-white px-7 py-3 rounded-lg font-medium text-[15px] hover:bg-zinc-800 transition-colors"
            >
              Request Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="mailto:hello@foresight.edu?subject=Foresight Demo Request"
              className="inline-flex items-center gap-2 glass-card px-7 py-3 text-zinc-600 hover:text-zinc-900 border border-zinc-300 font-medium text-[15px] transition-colors"
            >
              Schedule a Demo
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
