// app/certificate/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Certificate, { CertificateData } from "@/lib/components/Certificate";
import Logo from "@/lib/components/Logo";

interface ResultRow {
  id: string;
  iq_score: number;
  iq_ci_lower: number;
  iq_ci_upper: number;
  percentile: number;
  classification: string;
  domains: Record<string, { iq: number }>;
  completed_at: string;
}

const UPGRADE_URL = process.env.NEXT_PUBLIC_UPGRADE_URL ?? "";

export default function CertificatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [data, setData] = useState<CertificateData | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const profileRes = await supabase
        .from("profiles")
        .select("plan, role, full_name")
        .eq("id", user.id)
        .maybeSingle();
      const profile = profileRes.data as { plan: string; role: string; full_name: string } | null;
      const premium = profile?.plan === "premium" || profile?.role === "admin";

      const resultRes = await supabase
        .from("assessment_results")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();
      const result = resultRes.data as ResultRow | null;

      if (!premium) {
        setLocked(true);
        setLoading(false);
        return;
      }

      if (!result) {
        setLoading(false);
        router.replace("/dashboard");
        return;
      }

      const domainIq: Record<string, number> = {};
      for (const [k, v] of Object.entries(result.domains)) domainIq[k] = v.iq;

      setData({
        fullName: profile?.full_name ?? "",
        iq: result.iq_score,
        percentile: result.percentile,
        classification: result.classification,
        ciLow: result.iq_ci_lower,
        ciHigh: result.iq_ci_upper,
        completedAt: result.completed_at,
        certificateId: result.id,
        domainIq,
      });
      setLoading(false);
    })();
  }, [params.id, router]);

  if (loading) {
    return (
      <>
        <div className="aurora" />
        <div className="noise" />
        <div className="min-h-screen grid place-items-center">
          <div className="text-slate-400 text-sm">Preparing certificate…</div>
        </div>
      </>
    );
  }

  if (locked) {
    return (
      <>
        <div className="aurora" />
        <div className="noise" />
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="font-display font-bold text-2xl">Upgrade to unlock your certificate</h1>
          <p className="mt-3 text-slate-400 max-w-md text-sm">
            Your premium report and printable certificate are one step away. One-time purchase, yours forever.
          </p>
          <div className="mt-6 flex gap-3">
            {UPGRADE_URL ? (
              <a
                href={UPGRADE_URL}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-lg shadow-indigo-500/25"
              >
                Upgrade now
              </a>
            ) : (
              <span className="px-6 py-3 rounded-2xl glass text-slate-300 text-sm">Upgrade coming soon</span>
            )}
            <button
              onClick={() => router.push("/results")}
              className="px-6 py-3 rounded-2xl glass glass-hover text-white font-semibold transition"
            >
              Back to results
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="aurora" />
      <div className="noise" />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <header className="flex items-center justify-between mb-8 no-print">
          <Link href="/" aria-label="Aptimetric home">
            <Logo size={32} />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/results")}
              className="px-5 py-2.5 rounded-2xl glass glass-hover text-white text-sm font-semibold transition"
            >
              Back to results
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-95 transition"
            >
              Print / Save PDF
            </button>
          </div>
        </header>

        <Certificate data={data} />

        <p className="mt-6 text-center text-xs text-slate-500 no-print">
          Tip: choose “Save as PDF” in the print dialog for a shareable digital copy. This certificate can be verified
          by its unique Certification ID.
        </p>
      </div>
    </>
  );
}