import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for every EMS program size. Start free with up to 25 students, then scale with Professional or Enterprise plans.",
};

/* ───────────────────────────── Data ───────────────────────────── */

const tiers = [
  {
    name: "Pilot",
    price: "Free",
    priceNote: "No credit card required",
    description: "Perfect for trying Foresight with a single cohort.",
    features: [
      "Up to 25 students",
      "1 instructor account",
      "All 6 TEI item types",
      "Basic cohort analytics",
      "Limited AI item generation (50/month)",
      "Community support",
    ],
    cta: "Get Started",
    ctaHref: "mailto:vincent@foresight.edu?subject=Foresight Pilot Access",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "Custom",
    priceNote: "Per-program annual pricing",
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
    cta: "Contact Sales",
    ctaHref: "mailto:sales@foresight.edu?subject=Foresight Professional Pricing",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceNote: "Multi-program volume pricing",
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
    cta: "Contact Sales",
    ctaHref: "mailto:sales@foresight.edu?subject=Foresight Enterprise Inquiry",
    highlighted: false,
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
    question: "How long does onboarding take?",
    answer:
      "Most programs are delivering their first TEI assessment within one week. Pilot accounts are self-service. Professional and Enterprise plans include a guided onboarding session with our team.",
  },
];

/* ─────────────────────────── Component ────────────────────────── */

export default function PricingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
            Pricing
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.1] mb-6">
            Simple pricing for
            <br className="hidden sm:block" />
            {" "}every program size
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Start free with up to 25 students. Scale when you&apos;re ready.
            No surprise charges, no per-student fee traps.
          </p>
        </div>
      </section>

      {/* ── Pricing Grid ── */}
      <section className="px-6 pb-24 sm:pb-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-white border rounded-xl shadow-sm p-8 flex flex-col ${
                tier.highlighted
                  ? "border-zinc-900 ring-1 ring-zinc-900"
                  : "border-zinc-200"
              }`}
            >
              {/* Tier header */}
              <div className="mb-6">
                {tier.highlighted && (
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-3">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-xl font-bold text-zinc-900">
                  {tier.name}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">{tier.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <p className="font-heading text-4xl font-bold text-zinc-900">
                  {tier.price}
                </p>
                <p className="text-xs text-zinc-400 mt-1">{tier.priceNote}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-10 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm text-zinc-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={tier.ctaHref}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-[15px] transition-colors ${
                  tier.highlighted
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "bg-white text-zinc-900 border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-24 sm:py-28 bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 mb-4">
              FAQ
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
              Common questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 sm:p-8"
              >
                <h3 className="font-heading text-base font-bold text-zinc-900 mb-3">
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

      {/* ── CTA ── */}
      <section className="px-6 py-24 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Not sure which plan fits?
          </h2>
          <p className="text-base text-zinc-500 max-w-xl mx-auto leading-relaxed mb-10">
            Tell us about your program and we&apos;ll recommend the right setup.
            No pressure, no sales pitch.
          </p>
          <a
            href="mailto:sales@foresight.edu?subject=Pricing Question"
            className="group inline-flex items-center gap-2 bg-zinc-900 text-white px-7 py-3 rounded-lg font-medium text-[15px] hover:bg-zinc-800 transition-colors"
          >
            Talk to Us
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>
    </>
  );
}
