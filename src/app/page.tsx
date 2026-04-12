import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  Brain,
  BarChart3,
  Database,
  FileText,
  Shield,
  CheckCircle2,
  ArrowRight,
  Users,
  TrendingUp,
  AlertTriangle,
  Layers,
  LogIn,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Foresight | Institutional EMS Assessment Platform",
  description:
    "The first institutional assessment platform with real NREMT TEI formats. Cohort analytics, AI-powered test builder, and accreditation tracking for EMS education programs.",
};

const capabilities = [
  {
    icon: Layers,
    title: "All 6 TEI Question Types",
    description:
      "Drag-and-drop, build list, multi-select, options box, clinical judgment scenarios, and graphical items rendered exactly as they appear on the NREMT.",
  },
  {
    icon: Brain,
    title: "AI-Powered Test Builder",
    description:
      "Create chapter quizzes, midterms, and finals with real TEI formats. Use blank templates or let AI generate items from your curriculum in minutes.",
  },
  {
    icon: BarChart3,
    title: "Cohort & Student Analytics",
    description:
      "Pre/post assessment pipelines, domain-level heatmaps, TEI-type performance, error pattern detection, and individual student drill-downs.",
  },
  {
    icon: Shield,
    title: "Accreditation Tracking",
    description:
      "Real-time cohort tracking against CoAEMSP thresholds. Retention, pass rate, and placement metrics with predictive at-risk alerts.",
  },
  {
    icon: Database,
    title: "Real ECG Strip Library",
    description:
      "164 clinical 12-lead ECGs covering 32 rhythm types including STEMI variants, integrated directly into assessments.",
  },
  {
    icon: FileText,
    title: "Readiness Scoring",
    description:
      "Predictive NREMT readiness with 27 tracked error patterns across 17 cognitive domains. Know who is ready and who needs intervention.",
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
              <Image
                src="/images/foresight-logo.png"
                alt="Foresight"
                width={28}
                height={28}
              />
            </div>
            <span className="font-heading text-lg font-bold text-slate-900 tracking-tight">Foresight</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://path2medic.vercel.app"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors hidden sm:block"
            >
              For Students
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#1B4F72] hover:bg-[#164163] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Instructor Login
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="bg-white border-b border-slate-100 py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/images/foresight-logo.png"
              alt="Foresight"
              width={120}
              height={120}
            />
          </div>

          <p className="text-sm font-medium tracking-widest uppercase text-slate-400 mb-4">
            Foresight — Instructor Portal
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            The Exam Changed.{" "}
            <span className="text-[#1B4F72]">Your Assessment Tools Should Too.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            The first institutional assessment platform that renders all NREMT TEI
            formats. Give your students real exam practice from day one &mdash; not
            just on test day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
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

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1B4F72]" />
              All 6 TEI Formats
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1B4F72]" />
              540+ Validated Items
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1B4F72]" />
              164 Real ECG Strips
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1B4F72]" />
              CoAEMSP Aligned
            </span>
          </div>
        </div>
      </section>

      {/* ─── The Problem ─── */}
      <section className="bg-[#f8fafc] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1B4F72] mb-3">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-6 tracking-tight">
            The NREMT Shifted to TEIs. Your Tools Didn&apos;t.
          </h2>
          <p className="text-base text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Since July 2024, Technology Enhanced Items are scored on the NREMT.
            Clinical Judgment accounts for 34-38% of the exam. Programs that
            can&apos;t maintain a 70% pass rate risk losing CAAHEP accreditation.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: AlertTriangle, stat: "34-38%", label: "of the exam is Clinical Judgment" },
              { icon: Users, stat: "2,000+", label: "EMS programs with zero TEI tools" },
              { icon: TrendingUp, stat: "70%", label: "pass rate required for accreditation" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.stat} className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                  <div className="w-10 h-10 rounded-lg bg-[#1B4F72]/10 text-[#1B4F72] flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-semibold text-slate-900">{item.stat}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Capabilities ─── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1B4F72] mb-3">
              Platform
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
              EMS Educators Want to Teach, Not Build Software
            </h2>
            <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
              You became an instructor to develop the next generation of
              providers &mdash; not to wrestle with exam software. Foresight gives
              you the tools so you can focus on what matters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 hover:border-[#1B4F72]/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[#1B4F72]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1 text-sm">
                        {cap.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Comparison ─── */}
      <section className="bg-[#f8fafc] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1B4F72] mb-3">
              Landscape
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
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
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1B4F72] mb-3">
            Who Built This
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-6 tracking-tight">
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
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Ready to See What Your Students Are Missing?
          </h2>
          <p className="text-base text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            Currently in pilot with select EMS programs. Contact us for early access
            and institutional pricing.
          </p>
          <a
            href="mailto:vincent@path2medic.com"
            className="group inline-flex items-center gap-2 bg-white text-[#1B4F72] px-8 py-3.5 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            Request a Demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-xs text-white/50 mt-6">
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
          <div className="flex items-center gap-6 text-xs">
            <a href="https://path2medic.vercel.app" className="hover:text-white transition-colors">Path2Medic (Students)</a>
            <Link href="/login" className="hover:text-white transition-colors">Instructor Login</Link>
          </div>
          <p className="text-xs">&copy; 2026 Foresight by Path2Medic</p>
        </div>
      </footer>
    </div>
  );
}
