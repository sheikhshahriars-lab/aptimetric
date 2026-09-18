import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/lib/components/Logo";

export const metadata: Metadata = {
  title: "Terms of Service — Aptimetric",
  description: "The terms that govern your use of the Aptimetric assessment platform.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: "By creating an account or using aptimetric.org ('the Service'), you agree to these Terms of Service. If you are under 16 years old, you may not use the Service. If you do not agree, please do not use the Service.",
  },
  {
    title: "2. Description of service",
    body: "Aptimetric provides scientifically oriented online cognitive assessments. Results are estimates of cognitive ability based on your responses and should not be treated as a formal clinical diagnosis or a decision-making instrument for employment, medical, or legal purposes unless used through our certified recruiter offering.",
  },
  {
    title: "3. Accounts",
    body: "You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must provide accurate registration information. We may suspend or terminate accounts that violate these terms.",
  },
  {
    title: "4. Test conduct",
    body: "Your results are valid only if you complete the assessment yourself, without assistance, in a quiet environment, and without switching applications or tabs during the assessment. The Service monitors session focus and may flag or void results we reasonably believe were obtained improperly.",
  },
  {
    title: "5. Retake policy",
    body: "To preserve result validity, the same account may complete the full assessment at most once every 90 days. Invited candidate assessments follow the organizer's instructions.",
  },
  {
    title: "6. Payments & refunds",
    body: "Premium features (full report, certificate) are one-time purchases. Payment is processed by our payment provider. You may request a refund within 30 days of purchase if you are unsatisfied, by contacting support@aptimetric.org.",
  },
  {
    title: "7. Intellectual property",
    body: "The Service, including its question bank, scoring algorithms, software, design, and content, is owned by Aptimetric Labs and protected by intellectual property laws. You may not copy, reproduce, resell, or scrape the Service or its content.",
  },
  {
    title: "8. Acceptable use",
    body: "You agree not to: attempt to gain unauthorized access to the Service; reverse engineer the scoring engine; upload malicious software; interfere with other users; or use the Service for unlawful purposes.",
  },
  {
    title: "9. Disclaimer of warranties",
    body: "The Service is provided 'as is' and 'as available' without warranties of any kind. While we aim for high psychometric quality, we do not warrant that results are error-free or that the Service will be uninterrupted.",
  },
  {
    title: "10. Limitation of liability",
    body: "To the maximum extent permitted by law, Aptimetric Labs shall not be liable for indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the preceding 12 months.",
  },
  {
    title: "11. Recruiter accounts",
    body: "Recruiters agree that they are responsible for obtaining any consents required from candidates under applicable law before inviting them, and that only scores and completion status are shared with their organization. Recruiters must not use the Service to discriminate in a manner prohibited by law.",
  },
  {
    title: "12. Termination",
    body: "You may delete your account at any time. We may terminate or suspend access for breach of these terms. Sections that by nature survive termination (payment, IP, liability, disputes) will survive.",
  },
  {
    title: "13. Governing law & disputes",
    body: "These terms are governed by the laws of the jurisdiction in which Aptimetric Labs is established. Any disputes shall be resolved exclusively in the courts of that jurisdiction.",
  },
  {
    title: "14. Changes to terms",
    body: "We may revise these terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised terms.",
  },
];

export default function TermsPage() {
  return (
    <>
      <div className="aurora" />
      <div className="noise" />
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/" aria-label="Aptimetric home">
            <Logo size={32} />
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-400">Last updated: September 2026</p>
        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-display font-bold text-xl">{s.title}</h2>
              <p className="mt-2 text-slate-300 leading-relaxed text-sm">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 glass rounded-2xl p-6 text-sm text-slate-300">
          Questions? Reach us at <a href="mailto:support@aptimetric.org" className="text-indigo-400 hover:text-indigo-300">support@aptimetric.org</a>.
        </div>
      </main>
    </>
  );
}