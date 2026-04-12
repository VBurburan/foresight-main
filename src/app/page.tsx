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
import { DotPattern } from "@/components/ui/dot-pattern";

export const metadata: Metadata = {
  title: "Foresight | Assessment Infrastructure for EMS Programs",
  description:
    "Build NREMT-style TEI assessments, track cohort analytics, and identify at-risk students. The assessment platform built for EMS educators.",
};

/* ───────────────────────────── Data ───────────────────────────── */

const stats = [
  { value: "6", label: "TEI Types" },
  { value: "540+", label: "Items" },
  { value: "164", label: "ECGs" },
  { value: "32", label: "Rhythms" },
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
    desc: "All 6 NREMT item types rendered exactly as they appear on exam day — multiple response, drag-and-drop, build list, options box, and clinical judgment.",
  },
  {
    icon: Brain,
    title: "AI Test Builder",
    desc: "Three tiers of creation. Blank template for full control, AI-assisted for speed, or describe the exam you want and let autopilot build it.",
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
    desc: "Live tracking against CoAEMSP thresholds — retention rate, NREMT pass rate, and placement metrics with predictive alerts.",
  },
  {
    icon: Target,
    title: "Readiness Scoring",
    desc: "Predictive NREMT readiness powered by 27 tracked error patterns across 17 cognitive domains. Know who needs help before exam day.",
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

const credentials = [
  "National Registry Paramedic",
  "NAEMSE Level 1 Instructor",
  "4 Published NREMT Prep Books",
  "UF Critical Care Program",
];

/* ─────────────────────────── Component ────────────────────────── */

export default function HomePage() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 h-14 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Image
                src="/images/foresight-logo.png"
                alt="Foresight"
                width={22}
                height={22}
              />
            </span>
            <span className="font-heading text-[17px] font-bold tracking-tight text-slate-900">
              Foresight
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Login
            </Link>
            <a
              href="mailto:vincent@foresight.edu"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#1B4F72] hover:bg-[#164163] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-white px-6 pt-24 pb-28 sm:pt-32 sm:pb-36">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-slate-600 tracking-wide">
              Built for EMS Educators
            </span>
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl lg:text-[68px] font-bold tracking-tight text-slate-900 leading-[1.08] mb-6">
            Assessment infrastructure
            <br className="hidden sm:block" />
            {" "}for EMS programs
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            The first platform that gives EMS instructors real NREMT question
            formats, AI-powered test building, cohort analytics, and
            accreditation tracking in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-20">
            <a
              href="mailto:vincent@foresight.edu"
              className="group inline-flex items-center gap-2 bg-[#1B4F72] hover:bg-[#164163] text-white px-7 py-3 rounded-lg font-medium text-[15px] transition-colors shadow-sm"
            >
              Request Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 px-7 py-3 rounded-lg font-medium text-[15px] border border-slate-200 hover:border-slate-300 transition-colors bg-white"
            >
              See How It Works
            </a>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 sm:gap-16">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-8 sm:gap-16">
                <div className="text-center">
                  <p className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                    {s.label}
                  </p>
                </div>
                {i < stats.length - 1 && (
                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem Statement ── */}
      <section className="relative bg-slate-50 px-6 py-24 sm:py-28 overflow-hidden">
        <DotPattern
          className="fill-slate-300/40 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
          width={20}
          height={20}
          cr={0.8}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4F72] mb-4">
            The problem
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-slate-900 leading-tight mb-6">
            The exam changed.
            <br />
            Assessment tools didn&apos;t.
          </h2>
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-16">
            Since July 2024, Technology Enhanced Items are scored on the NREMT.
            Clinical Judgment accounts for 34&ndash;38% of the exam. Programs
            that can&apos;t maintain a 70% first-attempt pass rate risk losing
            CAAHEP accreditation. Most assessment tools still only offer basic
            multiple choice.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 max-w-3xl mx-auto">
            {[
              { value: "34-38%", label: "of the NREMT is now Clinical Judgment" },
              { value: "2,000+", label: "EMS programs with no TEI tools" },
              { value: "70%", label: "first-attempt pass rate for accreditation" },
            ].map((item) => (
              <div key={item.value}>
                <p className="font-heading text-4xl sm:text-5xl font-bold text-slate-900">
                  {item.value}
                </p>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-white px-6 py-24 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4F72] mb-4">
              How it works
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
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
                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-24 w-px bg-slate-200" />
                  )}
                  {/* Horizontal divider between rows (mobile) */}
                  {i < steps.length - 1 && (
                    <div className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-slate-200" />
                  )}

                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                    <Icon className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                  <p className="text-[11px] font-bold text-[#1B4F72] tracking-[0.25em] uppercase mb-2">
                    {s.num}
                  </p>
                  <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative bg-slate-50 px-6 py-24 sm:py-28 overflow-hidden">
        <DotPattern
          className="fill-slate-300/30 [mask-image:radial-gradient(800px_circle_at_top_right,white,transparent)]"
          width={24}
          height={24}
          cr={0.7}
        />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4F72] mb-4">
              Platform
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              Everything you need to assess,
              <br className="hidden sm:block" />
              {" "}track, and intervene
            </h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto">
              Six capabilities that don&apos;t exist together anywhere else in
              EMS education.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-14">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title}>
                  <div className="w-10 h-10 rounded-lg bg-[#1B4F72]/[0.08] flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                  <h3 className="font-heading text-[15px] font-bold text-slate-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="bg-white px-6 py-24 sm:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4F72] mb-4">
              Landscape
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              How Foresight compares
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              The only platform combining institutional analytics with real TEI
              rendering and AI generation.
            </p>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 pr-4 font-medium text-slate-400 text-xs uppercase tracking-wider">
                    Platform
                  </th>
                  {compCols.map((c) => (
                    <th
                      key={c.key}
                      className="text-center py-3 px-2 font-medium text-slate-400 text-xs uppercase tracking-wider"
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
                    className={`border-b border-slate-100 ${
                      idx === 0 ? "bg-[#1B4F72]/[0.03]" : ""
                    }`}
                  >
                    <td
                      className={`py-3.5 pr-4 ${
                        idx === 0
                          ? "text-[#1B4F72] font-semibold"
                          : "text-slate-600"
                      }`}
                    >
                      {comp.name}
                    </td>
                    {compCols.map((c) => (
                      <td key={c.key} className="text-center py-3.5 px-2">
                        {comp[c.key] ? (
                          <Check className="h-4 w-4 text-[#1B4F72] mx-auto" strokeWidth={2.5} />
                        ) : (
                          <Minus className="h-3.5 w-3.5 text-slate-200 mx-auto" />
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

      {/* ── Credibility ── */}
      <section className="bg-slate-50 px-6 py-24 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4F72] mb-4">
            Who built this
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-6">
            Built by a paramedic,
            <br className="hidden sm:block" />
            {" "}for paramedics
          </h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Foresight is built by a National Registry Paramedic and NAEMSE Level
            1 Instructor who uses every feature with real students. Every
            analytics screen, every error pattern, every threshold exists because
            it solved a real problem in the classroom.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {credentials.map((cred) => (
              <span
                key={cred}
                className="inline-flex items-center rounded-full bg-[#1B4F72]/[0.07] text-[#1B4F72] px-4 py-1.5 text-xs font-medium"
              >
                {cred}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0f172a] px-6 py-24 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Ready to modernize
            <br className="hidden sm:block" />
            {" "}your assessments?
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
            Currently in pilot with select EMS programs. Request access for
            early onboarding and institutional pricing.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="mailto:vincent@foresight.edu"
              className="group inline-flex items-center gap-2 bg-white text-slate-900 px-7 py-3 rounded-lg font-medium text-[15px] hover:bg-slate-100 transition-colors"
            >
              Request Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="mailto:vincent@foresight.edu?subject=Foresight Demo Request"
              className="inline-flex items-center gap-2 text-white px-7 py-3 rounded-lg font-medium text-[15px] border border-white/20 hover:bg-white/10 transition-colors"
            >
              Schedule a Demo
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0f172a] border-t border-white/[0.06] px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-white flex items-center justify-center">
              <Image
                src="/images/foresight-logo.png"
                alt="Foresight"
                width={16}
                height={16}
              />
            </span>
            <span className="text-sm font-medium text-slate-400">
              Foresight
            </span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; 2026 Foresight
          </p>
        </div>
      </footer>
    </div>
  );
}
