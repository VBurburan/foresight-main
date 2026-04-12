import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Brain,
  BarChart3,
  Database,
  FileText,
  Shield,
  CheckCircle2,
  ArrowRight,
  Layers,
  LogIn,
  Pencil,
  Send,
  LineChart,
  GraduationCap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Foresight | Institutional EMS Assessment Platform",
  description:
    "Build NREMT-style TEI assessments, track cohort analytics, and identify at-risk students. The assessment platform built for EMS educators.",
};

const features = [
  {
    icon: Layers,
    title: "All 6 TEI Question Types",
    description:
      "Multiple choice, multiple response, drag-and-drop, build list, options box, and clinical judgment scenarios — rendered exactly as they appear on the NREMT.",
  },
  {
    icon: Brain,
    title: "AI-Powered Test Builder",
    description:
      "Create assessments with blank templates, AI-assisted generation, or full autopilot. Build a 50-question midterm in minutes, not weeks.",
  },
  {
    icon: BarChart3,
    title: "Cohort Analytics",
    description:
      "Domain-level heatmaps, TEI-type performance breakdowns, score trends, and error pattern detection across your entire cohort.",
  },
  {
    icon: Shield,
    title: "Accreditation Tracking",
    description:
      "Real-time tracking against CoAEMSP thresholds. Retention rate, NREMT pass rate, and placement metrics with predictive at-risk alerts.",
  },
  {
    icon: Database,
    title: "Clinical ECG Library",
    description:
      "164 real 12-lead ECGs from PhysioNet covering 32 rhythm types. Attach directly to any assessment question.",
  },
  {
    icon: FileText,
    title: "Readiness Scoring",
    description:
      "Predictive NREMT readiness with 27 tracked error patterns across 17 cognitive domains. Know who needs intervention before exam day.",
  },
];

const steps = [
  {
    icon: Pencil,
    step: "01",
    title: "Create",
    description: "Build assessments using real TEI formats. Fill in templates, use AI generation, or describe the exam you want.",
  },
  {
    icon: Send,
    step: "02",
    title: "Deliver",
    description: "Students take assessments with the same interactive question types they'll face on the NREMT. Enrollment codes, class rosters, scheduled exams.",
  },
  {
    icon: LineChart,
    step: "03",
    title: "Analyze",
    description: "Drill down by student, class, domain, or TEI type. Identify at-risk students. Generate accreditation reports.",
  },
];

const competitors = [
  { name: "Foresight", tei: true, ai: true, analytics: true, ecg: true, builder: true, readiness: true },
  { name: "Fisdap", tei: false, ai: false, analytics: true, ecg: false, builder: true, readiness: true },
  { name: "EMSTesting", tei: false, ai: false, analytics: true, ecg: false, builder: true, readiness: false },
  { name: "Limmer", tei: true, ai: false, analytics: false, ecg: false, builder: false, readiness: false },
  { name: "Pocket Prep", tei: false, ai: false, analytics: true, ecg: false, builder: false, readiness: false },
];

const compColumns = [
  { key: "tei" as const, label: "TEI Rendering" },
  { key: "ai" as const, label: "AI Item Gen" },
  { key: "analytics" as const, label: "Cohort Analytics" },
  { key: "ecg" as const, label: "Real ECGs" },
  { key: "builder" as const, label: "Test Builder" },
  { key: "readiness" as const, label: "Readiness Scoring" },
];

export default function HomePage() {
  return (
    <div className="w-full">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-white border border-slate-200 flex items-center justify-center">
              <Image src="/images/foresight-logo.png" alt="Foresight" width={28} height={28} />
            </div>
            <span className="font-heading text-lg font-bold text-slate-900 tracking-tight">Foresight</span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#1B4F72] hover:bg-[#164163] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Instructor Login
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="bg-white py-24 sm:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600 mb-8">
            <GraduationCap className="w-3.5 h-3.5 mr-2 text-[#1B4F72]" />
            Built for EMS Educators
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Build Real TEI Assessments.{" "}
            <span className="text-[#1B4F72]">Track Real Student Readiness.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            The assessment platform that gives EMS instructors real NREMT question
            formats, cohort analytics, and accreditation tracking — so you can focus
            on teaching, not wrestling with software.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a
              href="mailto:vincent@path2medic.com"
              className="group inline-flex items-center gap-2 bg-[#1B4F72] hover:bg-[#164163] text-white px-8 py-3.5 rounded-lg font-medium transition-colors"
            >
              Request Early Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-8 py-3.5 rounded-lg font-medium border border-slate-200 hover:border-slate-300 transition-colors"
            >
              Instructor Login
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: "6", label: "TEI Question Types" },
              { value: "540+", label: "Validated Items" },
              { value: "164", label: "Clinical ECGs" },
              { value: "70%", label: "CoAEMSP Threshold" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-[#1B4F72]">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The Problem ─── */}
      <section className="bg-slate-50 border-y border-slate-100 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1B4F72] mb-3">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            The NREMT Shifted to TEIs. Assessment Tools Didn&apos;t.
          </h2>
          <p className="text-base text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Since July 2024, Technology Enhanced Items are scored on the NREMT.
            Clinical Judgment accounts for 34-38% of the exam. Programs that
            can&apos;t maintain a 70% first-attempt pass rate risk losing CAAHEP accreditation.
            Yet most assessment tools still only offer basic multiple choice.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { stat: "34-38%", label: "of the NREMT is now Clinical Judgment", color: "bg-amber-50 border-amber-200 text-amber-900" },
              { stat: "2,000+", label: "EMS programs with no TEI assessment tools", color: "bg-red-50 border-red-200 text-red-900" },
              { stat: "70%", label: "first-attempt pass rate required for accreditation", color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
            ].map((item) => (
              <div key={item.stat} className={`rounded-xl border p-6 text-center ${item.color}`}>
                <p className="text-3xl font-bold">{item.stat}</p>
                <p className="text-sm mt-2 opacity-80">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1B4F72] mb-3">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Create. Deliver. Analyze.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#1B4F72]/10 flex items-center justify-center mx-auto mb-5">
                    <Icon className="h-6 w-6 text-[#1B4F72]" />
                  </div>
                  <p className="text-xs font-bold text-[#1B4F72] tracking-widest uppercase mb-2">{s.step}</p>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="bg-slate-50 border-y border-slate-100 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1B4F72] mb-3">
              Platform
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Everything You Need to Assess, Track, and Intervene
            </h2>
            <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Built by a Nationally Registered Paramedic and NAEMSE Level 1 Instructor
              who uses every feature with real students.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 hover:border-[#1B4F72]/30 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{cap.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{cap.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Comparison ─── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1B4F72] mb-3">
              Landscape
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              How Foresight Compares
            </h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto">
              The only platform combining institutional analytics with real TEI rendering.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 bg-slate-50">Platform</th>
                  {compColumns.map((col) => (
                    <th key={col.key} className="text-center py-3 px-3 font-semibold text-slate-700 text-xs bg-slate-50">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, idx) => (
                  <tr
                    key={comp.name}
                    className={
                      idx === 0
                        ? "bg-[#1B4F72]/[0.03] border-b border-slate-100"
                        : "border-b border-slate-100"
                    }
                  >
                    <td className={`py-3 px-4 ${idx === 0 ? "text-[#1B4F72] font-semibold" : "text-slate-600"}`}>
                      {comp.name}
                    </td>
                    {compColumns.map((col) => (
                      <td key={col.key} className="text-center py-3 px-3">
                        {comp[col.key] ? (
                          <CheckCircle2 className="h-4 w-4 text-[#1B4F72] mx-auto" />
                        ) : (
                          <span className="text-slate-300">&mdash;</span>
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

      {/* ─── Credibility ─── */}
      <section className="bg-slate-50 border-y border-slate-100 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1B4F72] mb-3">
            Who Built This
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
            Built by an Educator, for Educators
          </h2>
          <p className="text-base text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Foresight is built by Vincent Burburan, NRP &mdash; a National Registry
            Paramedic, NAEMSE Level 1 Instructor, published author of 4 NREMT prep
            books, and active 1-on-1 tutor. Every analytics feature exists because he
            uses it with real students.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              "National Registry Paramedic",
              "NAEMSE Level 1 Instructor",
              "4 Published Books",
              "UF Critical Care Program",
            ].map((cred) => (
              <span
                key={cred}
                className="inline-flex items-center rounded-md bg-[#1B4F72]/10 text-[#1B4F72] px-3 py-1.5 text-xs font-medium"
              >
                {cred}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-[#1B4F72] text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to Give Your Students Real TEI Practice?
          </h2>
          <p className="text-base text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            Currently in pilot with select EMS programs. Contact us for early access
            and institutional pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:vincent@path2medic.com"
              className="group inline-flex items-center gap-2 bg-white text-[#1B4F72] px-8 py-3.5 rounded-lg font-medium hover:bg-slate-100 transition-colors"
            >
              Request Early Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="mailto:vincent@path2medic.com?subject=Foresight Demo Request"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-lg font-medium border border-white/20 transition-colors"
            >
              Schedule a Demo
            </a>
          </div>
          <p className="text-xs text-white/40 mt-8">
            vincent@path2medic.com
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
              <Image src="/images/foresight-logo.png" alt="Foresight" width={18} height={18} />
            </div>
            <span className="text-sm font-medium text-slate-300">Foresight</span>
          </div>
          <p className="text-xs">&copy; 2026 Foresight. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
