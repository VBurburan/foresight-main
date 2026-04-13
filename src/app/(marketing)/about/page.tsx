import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Foresight was built by a paramedic and NAEMSE instructor who watched students fail an exam they were ready for. Learn the story behind the platform.",
};

/* ───────────────────────────── Data ───────────────────────────── */

const credentials = [
  { label: "National Registry Paramedic", detail: "NRP" },
  { label: "NAEMSE Level 1 Instructor", detail: "Certified Educator" },
  { label: "UF Critical Care Program", detail: "University of Florida" },
  { label: "4 Published Books", detail: "NREMT Exam Preparation" },
];

const marketStats = [
  {
    value: "2,000+",
    label: "EMS programs in the United States",
  },
  {
    value: "July 2024",
    label: "TEI items began scoring on the NREMT",
  },
  {
    value: "Up to 38%",
    label: "of the Paramedic NREMT is Clinical Judgment",
  },
  {
    value: "70%",
    label: "first-attempt pass rate required for accreditation",
  },
];

/* ─────────────────────────── Component ────────────────────────── */

export default function AboutPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
            Our story
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.1] mb-6">
            I watched students fail an exam
            <br className="hidden sm:block" />
            {" "}they were ready for.
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            The NREMT changed. The tools didn&apos;t. So I built Foresight.
          </p>
        </div>
      </section>

      {/* ── Founder Story ── */}
      <section className="px-6 py-20 sm:py-28 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-6">
              The Origin
            </p>

            <div className="space-y-6 text-base sm:text-lg text-zinc-600 leading-relaxed">
              <p>
                In July 2024, the NREMT began scoring Technology Enhanced Items
                on the certification exam. These aren&apos;t traditional
                multiple-choice questions. They are drag-and-drop ordering, clinical
                judgment matrices, hot spots, build-list items, and multi-select
                formats that require a fundamentally different kind of
                preparation.
              </p>

              <p>
                I was teaching paramedic students who knew the material. They
                could explain pathophysiology, recite pharmacology, and reason
                through clinical scenarios on the whiteboard. But when they sat
                down for the exam, they froze. Not because they lacked
                knowledge, but because they had never interacted with the
                question formats they were being tested on.
              </p>

              <p>
                I looked for tools to help them practice. There were none.
                Existing assessment platforms offered multiple-choice items only.
                Some marketed themselves as &ldquo;TEI-ready&rdquo; but rendered
                nothing close to the real exam experience. Students were being
                asked to demonstrate competency in formats they had never seen.
              </p>

              <p>
                That gap became Foresight. I started building a rendering engine
                for every TEI format the NREMT uses. Then I added an AI pipeline
                to generate items at scale. Then analytics to track where
                students struggle. Then a readiness algorithm to predict who
                needs help before exam day.
              </p>

              <p className="text-zinc-900 font-medium">
                Every feature in Foresight exists because it solved a real
                problem I encountered as an instructor. Nothing was built on
                speculation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Founder Credentials ── */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
            Founder
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Vincent Burburan
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed mb-10 max-w-3xl">
            National Registry Paramedic, NAEMSE Level 1 Instructor, University
            of Florida Critical Care program, and author of four published
            NREMT exam preparation books. I build every feature with real
            students, real data, and real accreditation pressure.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {credentials.map((cred) => (
              <div
                key={cred.label}
                className="bg-white border border-zinc-200 rounded-xl shadow-sm px-5 py-4"
              >
                <p className="text-sm font-semibold text-zinc-900">
                  {cred.label}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{cred.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Market Context ── */}
      <section className="px-6 py-20 sm:py-28 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
            Market
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            The accreditation clock is ticking
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed mb-12 max-w-3xl">
            Programs that can&apos;t maintain a 70% first-attempt NREMT pass
            rate risk losing CAAHEP accreditation. With TEI items now scored,
            programs need tools that match the exam format. Most don&apos;t
            have them.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {marketStats.map((stat) => (
              <div
                key={stat.value}
                className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6"
              >
                <p className="font-heading text-3xl sm:text-4xl font-bold text-zinc-900">
                  {stat.value}
                </p>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vision ── */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
            Vision
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-6">
            EMS is the beachhead.
            <br className="hidden sm:block" />
            {" "}Healthcare certification is the market.
          </h2>

          <div className="space-y-6 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-3xl">
            <p>
              The problem Foresight solves is not unique to EMS. Nursing boards,
              respiratory therapy exams, and dozens of other healthcare
              certifications are moving toward technology-enhanced item formats.
              The same gap -- students trained on multiple choice, tested on
              interactive formats -- exists across the entire credentialing
              landscape.
            </p>

            <p>
              We start with EMS because it is where we have the deepest domain
              expertise, the strongest relationships, and the most urgent
              accreditation pressure. Once the platform proves itself with
              2,000+ EMS programs, the same rendering engine, AI pipeline, and
              analytics framework extend directly into adjacent healthcare
              verticals.
            </p>

            <p className="text-zinc-900 font-medium">
              Foresight is not a test bank. It is assessment infrastructure for
              any certification that demands more than multiple choice.
            </p>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="relative px-6 py-24 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Let&apos;s talk
          </h2>
          <p className="text-base text-zinc-500 max-w-xl mx-auto leading-relaxed mb-10">
            Whether you are a program director exploring options or an investor
            evaluating the space, I am happy to walk you through Foresight.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="mailto:vincent@foresight.edu"
              className="group inline-flex items-center gap-2 bg-zinc-900 text-white px-7 py-3 rounded-lg font-medium text-[15px] hover:bg-zinc-800 transition-colors"
            >
              Email Vincent
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="mailto:vincent@foresight.edu?subject=Foresight Demo Request"
              className="inline-flex items-center gap-2 bg-white border border-zinc-300 px-7 py-3 rounded-lg text-zinc-600 hover:text-zinc-900 hover:border-zinc-400 font-medium text-[15px] transition-colors"
            >
              Schedule a Demo
            </a>
          </div>

          <p className="text-sm text-zinc-400 mt-8">
            vincent@foresight.edu
          </p>
        </div>
      </section>
    </>
  );
}
