import type { Metadata } from "next";
import {
  ArrowRight,
  Mail,
  Lock,
  KeyRound,
  FileText,
  Sparkles,
  GraduationCap,
  Stethoscope,
  ShieldCheck,
  Award,
  ScrollText,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Trust & Compliance",
  description:
    "Foresight is engineered to meet the security, privacy, and compliance standards institutional procurement, IT, and accreditation teams require. Document Version 1.0 — May 12, 2026.",
};

/* ───────────────────────────── Data ───────────────────────────── */

type Status = "aligned" | "in-progress" | "roadmap" | "not-applicable";

const statusDot: Record<Status, { label: string; dotClass: string }> = {
  aligned: {
    label: "Aligned",
    dotClass: "bg-emerald-600",
  },
  "in-progress": {
    label: "In progress",
    dotClass: "bg-amber-500",
  },
  roadmap: {
    label: "On roadmap",
    dotClass: "bg-zinc-400",
  },
  "not-applicable": {
    label: "Not applicable",
    dotClass: "bg-zinc-200 border border-zinc-300",
  },
};

const complianceMatrix: {
  framework: string;
  status: Status;
  detail: string;
}[] = [
  {
    framework: "FERPA (34 CFR Part 99)",
    status: "aligned",
    detail:
      "Operating as a “school official” under § 99.31(a)(1)(i)(B). Data Processing Agreement available on request.",
  },
  {
    framework: "Encryption at rest",
    status: "aligned",
    detail:
      "AES-256 on Postgres and object storage. Keys rotated and audited by infrastructure provider.",
  },
  {
    framework: "Encryption in transit",
    status: "aligned",
    detail:
      "TLS 1.2+ enforced on every endpoint. HSTS on the marketing surface.",
  },
  {
    framework: "Row-Level Security (multi-tenant isolation)",
    status: "aligned",
    detail:
      "Postgres RLS policies on every table containing student records. Tenant boundary enforced at the database, not the application.",
  },
  {
    framework: "Audit logging",
    status: "aligned",
    detail:
      "Every instructor publish, enrollment change, role grant, and admin action written to an immutable audit log.",
  },
  {
    framework: "Data Processing Agreement (DPA)",
    status: "aligned",
    detail:
      "Standard template available on request. Customer paper also accepted.",
  },
  {
    framework: "Accessibility (Section 508 / WCAG 2.1 AA)",
    status: "aligned",
    detail:
      "Conformance to WCAG 2.1 AA — the technical standard referenced by Section 508 for institutions receiving federal funds.",
  },
  {
    framework: "HIPAA Business Associate Agreement",
    status: "not-applicable",
    detail:
      "Foresight does not ingest Protected Health Information. Educational records only under FERPA.",
  },
];

const dataProtection = [
  {
    icon: Lock,
    title: "Encryption everywhere",
    body: "Data encrypted at rest with AES-256 on Postgres and object storage. TLS 1.2+ in transit on every connection. Encryption keys managed by our infrastructure provider with rotation and audit.",
  },
  {
    icon: KeyRound,
    title: "Strict access controls",
    body: "Row-Level Security policies on every table that contains student records. Tenant boundaries are enforced at the database layer, not just in the application. Service-role keys never reach the client.",
  },
  {
    icon: ScrollText,
    title: "Audit logging",
    body: "Every instructor publish, enrollment change, role grant, and admin action writes to an immutable audit log. Retained for the life of your contract and available on accreditation request.",
  },
  {
    icon: Sparkles,
    title: "AI you can audit",
    body: "Student exam responses are never sent to AI providers and never used to train models. AI is invoked only when an instructor clicks “Generate” — and only the instructor’s topic prompt is sent to OpenAI or Anthropic.",
  },
];

const subprocessors = [
  {
    name: "Supabase",
    purpose: "Database (Postgres), authentication, file storage",
    region: "AWS us-east-1 (Virginia)",
    data: "Student educational records, exam responses, instructor accounts",
  },
  {
    name: "Vercel",
    purpose: "Application hosting and edge network",
    region: "United States edge regions",
    data: "Application traffic; no persistent student records",
  },
  {
    name: "Stripe",
    purpose: "Subscription billing and invoicing",
    region: "United States",
    data: "Institutional billing contacts and payment instruments; no student data",
  },
  {
    name: "OpenAI",
    purpose: "AI question generation (instructor-initiated only)",
    region: "United States",
    data: "Instructor-supplied prompts and generated draft items; no student PII",
  },
  {
    name: "Anthropic",
    purpose: "AI question generation (alternate model option)",
    region: "United States",
    data: "Instructor-supplied prompts and generated draft items; no student PII",
  },
];

const audiences = [
  {
    icon: GraduationCap,
    title: "K–12 and under-18 students",
    body: "Some EMT programs admit 16–17 year-old students through high-school CTE pipelines and fire-cadet programs. For minors, Foresight applies heightened controls: no advertising, no behavioral profiling, no commercial use of student data, and parental-consent workflows where state law requires them. We align with SOPIPA (CA), AB 1584 (CA), Education Law § 2-d (NY), and SOPPA (IL).",
  },
  {
    icon: Stethoscope,
    title: "Hospital-based programs",
    body: "Foresight does not process Protected Health Information. Exam content uses fictional patient vignettes only; no clinical records, no PHI fields, no integration with patient-data systems. No HIPAA BAA is required for normal use. Your privacy office can route us through a standard FERPA-only review.",
  },
  {
    icon: ShieldCheck,
    title: "Federal and military programs",
    body: "FERPA + signed Data Processing Agreement + United States data residency. Sufficient for education-side training programs and Government Purchase Card purchases under the $15,000 micro-purchase threshold raised October 2025. For direct DoD contracts requiring FedRAMP authorization, contact us before issuing an RFP.",
  },
];

const accreditation = [
  {
    icon: Award,
    title: "Accreditation evidence, ready when you need it",
    body: "Foresight’s analytics map directly to the CoAEMSP outcome thresholds — Retention, NREMT first-attempt pass rate, and Positive Placement — each tracked against the 70% threshold required for paramedic-program reaccreditation. Raw data exports in CSV and JSON. Audit log retained for the life of your contract. We will write a letter to your site visitors on request.",
  },
  {
    icon: FileText,
    title: "Data portability if we cease operations",
    body: "Customer data is your data. In any wind-down or change-of-control scenario, we commit to (1) a 90-day data export window, (2) full CSV and JSON exports of all assessments, responses, and analytics, and (3) advance written notice. This commitment is in the standard Data Processing Agreement.",
  },
];

const faqs = [
  {
    q: "Where is student data stored?",
    a: "All student educational records are stored in Supabase’s us-east-1 region (AWS, Virginia). Application hosting is on Vercel’s United States edge network. We do not store or process student data outside the United States.",
  },
  {
    q: "Is student data used to train AI models?",
    a: "No. Student exam responses, scores, and identifying information are never sent to AI providers and never used to train any model. AI is invoked only when an instructor explicitly clicks “Generate questions” — and only the instructor’s topic and domain prompt is sent to OpenAI or Anthropic. No student data leaves Foresight’s infrastructure for AI purposes.",
  },
  {
    q: "Will you sign our institution’s DPA, or do we have to use yours?",
    a: "Both. Our standard DPA is available on request and most institutional procurement teams sign it as-is. If your institution requires its own paper, we accept reasonable customer DPA language.",
  },
  {
    q: "What happens to our data if Foresight is acquired or shuts down?",
    a: "Customer data is your data. We commit in the standard DPA to (1) a 90-day data export window in any wind-down scenario, (2) full CSV and JSON exports of all assessments, responses, and analytics, and (3) advance written notice in any acquisition where the data controller would change.",
  },
  {
    q: "How do we report a security concern?",
    a: "Email security@foresight.edu. We acknowledge within one business day and provide a status update within five business days. Coordinated disclosure is appreciated for responsibly reported vulnerabilities.",
  },
];

const documents = [
  {
    name: "Data Processing Agreement (DPA)",
    note: "Standard template; customer paper also accepted",
  },
  {
    name: "Subprocessor list",
    note: "Published below; updated within 30 days of any change",
  },
  {
    name: "Privacy Policy and Terms of Service",
    note: "Published documents",
  },
  {
    name: "Security implementation summary",
    note: "Controls, encryption posture, audit log scope — under NDA",
  },
  {
    name: "Certificate of Insurance",
    note: "Available on request",
  },
  {
    name: "Accessibility statement",
    note: "Available on request",
  },
];

/* ───────────── Components ───────────── */

function StatusPill({ status }: { status: Status }) {
  const { label, dotClass } = statusDot[status];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden
        className={`inline-block w-2 h-2 rounded-full ${dotClass}`}
      />
      <span className="text-sm text-zinc-700">{label}</span>
    </span>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function CompliancePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="px-6 pt-20 pb-16 sm:pt-28 sm:pb-20 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-5">
                Trust Disclosure &middot; Document v1.0
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-900 leading-[1.15] mb-5">
                Built for institutional review
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
                Foresight is engineered to meet the security, privacy, and
                compliance standards your IT, procurement, and accreditation
                teams require. This document discloses exactly what we have
                today, what is in progress, and what is on our roadmap.
              </p>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-1 gap-x-6 gap-y-3 text-sm shrink-0 sm:text-right">
              <div>
                <dt className="text-zinc-500 text-xs uppercase tracking-wider">
                  Last updated
                </dt>
                <dd className="text-zinc-900 font-medium mt-0.5">
                  May 12, 2026
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 text-xs uppercase tracking-wider">
                  Operated by
                </dt>
                <dd className="text-zinc-900 font-medium mt-0.5">
                  Path2Medic LLC (FL)
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ── Compliance Matrix ── */}
      <section className="px-6 py-20 sm:py-24 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-3">
              § 1 &middot; Status at a glance
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-4">
              Where we stand on every framework that matters
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              We do not list a framework unless we have a position on it. Every
              row below reflects what is configured in our production
              environment today. We will not market a certification we do not
              hold.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-lg">
            <ul className="divide-y divide-zinc-200">
              {complianceMatrix.map((item) => (
                <li
                  key={item.framework}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-8 items-start sm:items-center px-5 py-4 sm:px-6 sm:py-5"
                >
                  <div>
                    <p className="text-[15px] font-semibold text-zinc-900 leading-snug">
                      {item.framework}
                    </p>
                    <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                  <div className="sm:min-w-[7.5rem] sm:flex sm:justify-end">
                    <StatusPill status={item.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Data Protection ── */}
      <section className="px-6 py-20 sm:py-24 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-3">
              § 2 &middot; Data protection
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-4">
              What we do with student data &mdash; and what we don&rsquo;t
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              The four controls below are non-negotiable. Every Foresight
              environment ships with all of them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border border-zinc-200 rounded-lg overflow-hidden">
            {dataProtection.map((item, idx) => (
              <div
                key={item.title}
                className={`p-6 sm:p-7 ${
                  idx % 2 === 0
                    ? "md:border-r md:border-zinc-200"
                    : ""
                } ${idx < 2 ? "md:border-b md:border-zinc-200" : ""} ${
                  idx > 0 && idx % 2 === 0
                    ? "border-t border-zinc-200 md:border-t-0"
                    : ""
                } ${
                  idx === 1
                    ? "border-t border-zinc-200 md:border-t-0"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <item.icon
                    className="w-4 h-4 text-zinc-700"
                    strokeWidth={2}
                  />
                  <h3 className="font-heading text-base font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subprocessors ── */}
      <section className="px-6 py-20 sm:py-24 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-3">
              § 3 &middot; Subprocessors
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-4">
              Every third party that touches your data
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              No more, no less. We update this list within 30 days of any
              change and notify customers under the Data Processing Agreement.
              All listed parties are United States entities with United States
              data residency.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-zinc-200">
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Provider
                  </TableHead>
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Purpose
                  </TableHead>
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Region
                  </TableHead>
                  <TableHead className="h-11 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Data exchanged
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subprocessors.map((sp) => (
                  <TableRow
                    key={sp.name}
                    className="hover:bg-zinc-50/60 border-b border-zinc-100 last:border-b-0"
                  >
                    <TableCell className="px-5 py-4 align-top font-semibold text-zinc-900">
                      {sp.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 align-top text-sm text-zinc-600">
                      {sp.purpose}
                    </TableCell>
                    <TableCell className="px-5 py-4 align-top text-sm text-zinc-600">
                      {sp.region}
                    </TableCell>
                    <TableCell className="px-5 py-4 align-top text-sm text-zinc-600">
                      {sp.data}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* ── For Your Specific Context ── */}
      <section className="px-6 py-20 sm:py-24 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-3">
              § 4 &middot; For your context
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-4">
              Three buyer contexts, three direct answers
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              Different institutions live under different regulatory regimes.
              Here is where Foresight fits each one today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-zinc-200 rounded-lg overflow-hidden">
            {audiences.map((item, idx) => (
              <div
                key={item.title}
                className={`p-6 sm:p-7 ${
                  idx > 0 ? "border-t border-zinc-200 md:border-t-0" : ""
                } ${idx > 0 ? "md:border-l md:border-zinc-200" : ""}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <item.icon
                    className="w-4 h-4 text-zinc-700"
                    strokeWidth={2}
                  />
                  <h3 className="font-heading text-base font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Accreditation & Continuity ── */}
      <section className="px-6 py-20 sm:py-24 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-3">
              § 5 &middot; Accreditation &amp; continuity
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-4">
              For the long arc, not just the demo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border border-zinc-200 rounded-lg overflow-hidden">
            {accreditation.map((item, idx) => (
              <div
                key={item.title}
                className={`p-6 sm:p-7 ${
                  idx > 0 ? "border-t border-zinc-200 md:border-t-0" : ""
                } ${idx > 0 ? "md:border-l md:border-zinc-200" : ""}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <item.icon
                    className="w-4 h-4 text-zinc-700"
                    strokeWidth={2}
                  />
                  <h3 className="font-heading text-base font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-20 sm:py-24 border-b border-zinc-200">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-3">
              § 6 &middot; Frequently asked
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
              Questions your IT team will ask
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full border-t border-zinc-200">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`q-${i}`}
                className="border-b border-zinc-200"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-zinc-900 hover:no-underline hover:text-zinc-700">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-600 leading-relaxed pb-5 pr-8">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Documents & Contact ── */}
      <section className="px-6 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-3">
              § 7 &middot; Documents &amp; contact
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 mb-4">
              Documents available on request
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              Email us and we will respond within one business day with
              whatever your procurement or IT team needs to complete its
              review.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-lg overflow-hidden mb-10">
            <ul className="divide-y divide-zinc-200">
              {documents.map((doc) => (
                <li
                  key={doc.name}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-8 items-start sm:items-center px-5 py-4 sm:px-6"
                >
                  <div className="flex items-start gap-3">
                    <FileText
                      className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400"
                      strokeWidth={2}
                    />
                    <span className="text-[15px] font-semibold text-zinc-900">
                      {doc.name}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500 sm:text-right pl-7 sm:pl-0">
                    {doc.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="mb-10 bg-zinc-200" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-2">
                Procurement &amp; compliance docs
              </p>
              <a
                href="mailto:compliance@foresight.edu?subject=Foresight compliance documents request"
                className="group inline-flex items-center gap-2 text-zinc-900 font-medium text-[15px] hover:text-zinc-700 transition-colors"
              >
                <Mail className="w-4 h-4" strokeWidth={2} />
                compliance@foresight.edu
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <p className="text-sm text-zinc-500 mt-2">
                Acknowledged within one business day.
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 mb-2">
                Report a security concern
              </p>
              <a
                href="mailto:security@foresight.edu?subject=Foresight security inquiry"
                className="group inline-flex items-center gap-2 text-zinc-900 font-medium text-[15px] hover:text-zinc-700 transition-colors"
              >
                <Mail className="w-4 h-4" strokeWidth={2} />
                security@foresight.edu
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <p className="text-sm text-zinc-500 mt-2">
                Coordinated disclosure appreciated. Status update within five
                business days.
              </p>
            </div>
          </div>

          <Separator className="mt-12 mb-6 bg-zinc-200" />

          <p className="text-xs text-zinc-500 leading-relaxed">
            Foresight is built and operated by Path2Medic LLC, a Florida
            limited-liability company. This document is provided for
            informational purposes and is not a substitute for the binding
            Data Processing Agreement. For general inquiries:{" "}
            <a
              href="mailto:hello@foresight.edu"
              className="text-zinc-700 hover:text-zinc-900 underline underline-offset-2"
            >
              hello@foresight.edu
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
