import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/lib/components/Logo";

export const metadata: Metadata = {
  title: "Privacy Policy — Aptimetric",
  description: "How Aptimetric collects, uses, and protects your personal data.",
};

const SECTIONS = [
  {
    title: "1. Data we collect",
    body: "We collect the minimum necessary to deliver the service: your account email, the name you provide on sign-up, and your assessment answers and results (IQ score, cognitive profile, and test metrics). No payment details are stored on our servers — payments are processed by our payment provider (Stripe).",
  },
  {
    title: "2. How we use your data",
    body: "Your data is used solely to: operate your account, compute and display your assessment results, generate your certificate, and (if you participate in a recruiter invitation) share your final IQ score with the organization that invited you. We do not sell, rent, or trade your personal data to third parties.",
  },
  {
    title: "3. Legal basis",
    body: "We process your data on the basis of contract (providing the service you requested), your consent (as recorded when you create an account), and our legitimate interest in operating and improving the platform.",
  },
  {
    title: "4. Data sharing",
    body: "Aptimetric uses trusted subprocessors to operate the service: Supabase (hosted PostgreSQL database and authentication), Vercel (hosting), and Google Fonts (typography). Each is subject to strict data-processing terms. If you are invited by an organization, only your final IQ score and completion status are shared with them — never your raw answers.",
  },
  {
    title: "5. Data retention & deletion",
    body: "We retain your account and results for as long as your account is active. You may delete your account at any time from the dashboard; doing so permanently removes your profile and assessment results. Email us at support@aptimetric.org for manual deletion requests.",
  },
  {
    title: "6. Security",
    body: "All traffic is encrypted in transit (TLS/HTTPS), passwords are hashed and never stored in plain text by Supabase Auth, and database access is protected by row-level security so each user can only see their own data.",
  },
  {
    title: "7. Cookies",
    body: "We use strictly necessary cookies for authentication (Supabase session tokens) and functional cookies for local test-progress persistence. We do not use advertising or tracking cookies.",
  },
  {
    title: "8. Children's privacy",
    body: "The service is intended for users aged 16 and over. We do not knowingly collect data from children under 16. If you believe a child has provided us personal data, contact support@aptimetric.org and we will delete it.",
  },
  {
    title: "9. Your rights",
    body: "Depending on your jurisdiction (e.g. GDPR or CCPA), you may have rights to access, correct, export, restrict, or delete your personal data. Contact support@aptimetric.org to exercise any of these rights — we respond within 30 days.",
  },
  {
    title: "10. Changes to this policy",
    body: "We may update this policy as the service evolves. Material changes will be announced via email or an in-product notice. Continued use after changes constitutes acceptance.",
  },
];

export default function PrivacyPage() {
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
        <h1 className="font-display font-extrabold text-4xl tracking-tight">Privacy Policy</h1>
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
          Questions about your data? Reach us at <a href="mailto:support@aptimetric.org" className="text-indigo-400 hover:text-indigo-300">support@aptimetric.org</a>.
        </div>
      </main>
    </>
  );
}