import type { Metadata } from "next";
import { Check, ArrowRight, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Foresight is available to EMS programs through institutional licensing. Contact our team to schedule a demo and discuss pricing for your program.",
};

/* ───────────────────────────── Data ───────────────────────────── */

const plans = [
  {
    name: "Professional",
    description:
      "Full platform access for programs ready to modernize their assessments.",
    features: [
      "Unlimited students",
      "Up to 5 instructor accounts",
      "Full analytics suite with heatmaps",
      "Unlimited AI item generation",
      "Pre/post assessment pipeline",
      "Readiness scoring & error patterns",
      "ECG strip library (185 strips)",
      "Priority email support",
      "Exportable accreditation reports",
    ],
  },
  {
    name: "Enterprise",
    description:
      "For institutions and consortiums that need control, compliance, and scale.",
    features: [
      "Unlimited students & instructors",
      "Multi-program management",
      "Custom integrations (LMS, SIS)",
      "Dedicated account manager",
      "HIPAA compliance documentation",
      "99.9% uptime SLA",
      "SSO / SAML authentication",
      "Custom RAG knowledge chunks",
      "On-demand training sessions",
    ],
  },
];

const faqs = [
  {
    question: "Is Foresight only for paramedic programs?",
    answer:
      "Foresight is designed for any EMS certification program -- EMT, AEMT, and Paramedic. The TEI item engine and content domains cover the full NREMT scope. We are also exploring expansion into nursing and allied health certifications.",
  },
  {
    question: "How does AI item generation work?",
    answer:
      "Foresight uses a retrieval-augmented generation (RAG) pipeline grounded in 291 validated knowledge chunks mapped to NREMT content domains. You describe the topic and cognitive level, the AI generates a draft item, and you review and edit before publishing. No AI-generated content reaches students without instructor approval.",
  },
  {
    question: "Can I import my existing test bank?",
    answer:
      "Yes. Foresight supports CSV and QTI import formats. Traditional multiple-choice items can be imported directly, and we provide tooling to convert them into TEI formats like drag-and-drop or clinical judgment matrix items.",
  },
  {
    question: "What data do you collect from students?",
    answer:
      "Foresight collects assessment responses, timing data, and performance metrics. We do not collect protected health information (PHI). All data is encrypted in transit and at rest. Enterprise plans include HIPAA compliance documentation for programs that require it.",
  },
  {
    question: "How does institutional licensing work?",
    answer:
      "Foresight is licensed on an annual basis per program. Pricing is based on program size and the feature tier you select. We work directly with your institution to find the right fit. Schedule a demo to get started.",
  },
  {
    question: "How long does onboarding take?",
    answer:
      "Most programs are delivering their first TEI assessment within one week. All plans include a guided onboarding session with our team to ensure your instructors are set up for success.",
  },
];

/* ─────────────────────────── Component ────────────────────────── */

export default function PricingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="px-6 pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-4">
            Pricing
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-900 leading-[1.1] mb-6">
            Built for EMS programs,
            <br className="hidden sm:block" />
            {" "}priced for institutions
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Foresight is available to EMS programs through institutional
            licensing. Contact our team to schedule a demo and discuss
            pricing for your program.
          </p>
        </div>
      </section>

      {/* ── Primary CTA ── */}
      <section className="px-6 pb-20 sm:pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-8 sm:p-12 text-center">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-zinc-900 mb-4">
              Request a Demo
            </h2>
            <p className="text-base text-zinc-600 max-w-lg mx-auto leading-relaxed mb-8">
              See how Foresight can transform your program&apos;s assessment
              workflow. We&apos;ll walk you through the platform, answer your
              questions, and discuss licensing options tailored to your
              institution.
            </p>
            <a
              href="mailto:hello@foresight.edu?subject=Schedule a Foresight Demo"
              className="group inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-3.5 rounded-lg font-medium text-[15px] hover:bg-zinc-800 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Schedule a Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <p className="text-sm text-zinc-500 mt-5">
              Have questions?{" "}
              <a
                href="mailto:hello@foresight.edu"
                className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
              >
                Email us at hello@foresight.edu
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Plan Comparison ── */}
      <section className="px-6 pb-24 sm:pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-3">
              Two tiers, one mission
            </h2>
            <p className="text-base text-zinc-600 max-w-xl mx-auto leading-relaxed">
              Whether you run a single cohort or manage a multi-site
              consortium, Foresight scales with your program.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="bg-white border border-zinc-200 rounded-xl shadow-sm p-8 flex flex-col"
              >
                {/* Plan header */}
                <div className="mb-6">
                  <h3 className="font-heading text-xl font-semibold text-zinc-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className="h-4 w-4 text-zinc-900 mt-0.5 shrink-0"
                        strokeWidth={2.5}
                      />
                      <span className="text-sm text-zinc-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={`mailto:hello@foresight.edu?subject=Foresight ${plan.name} Inquiry`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-[15px] transition-colors bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  Contact Sales
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-24 sm:py-28 bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-4">
              FAQ
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
              Common questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 sm:p-8"
              >
                <h3 className="font-heading text-base font-semibold text-zinc-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-6 py-24 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mb-4">
            Ready to see Foresight in action?
          </h2>
          <p className="text-base text-zinc-500 max-w-xl mx-auto leading-relaxed mb-10">
            Tell us about your program and we&apos;ll set up a personalized
            demo. No pressure, no obligation.
          </p>
          <a
            href="mailto:hello@foresight.edu?subject=Schedule a Foresight Demo"
            className="group inline-flex items-center gap-2 bg-zinc-900 text-white px-7 py-3 rounded-lg font-medium text-[15px] hover:bg-zinc-800 transition-colors"
          >
            Schedule a Demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>
    </>
  );
}
