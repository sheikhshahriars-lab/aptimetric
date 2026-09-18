// app/results/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { DOMAIN_LABELS } from "@/lib/irt/scoring";
import RadarChart from "@/lib/components/RadarChart";
import Logo from "@/lib/components/Logo";

interface ResultRow {
  id: string;
  iq_score: number;
  iq_ci_lower: number;
  iq_ci_upper: number;
  percentile: number;
  overall_theta: number;
  overall_sem: number;
  classification: string;
  domains: Record<string, { iq: number; theta: number; sem: number; percentile: number; ciLow: number; ciHigh: number }>;
  answers: { domain: string; subdomain: string; difficulty: number; correct: boolean; timeMs: number }[];
  domain_counts: Record<string, number>;
  duration_ms: number;
  status: string;
  completed_at: string;
}

interface ProfileRow {
  plan: string;
  role: string;
  full_name: string;
}

const UPGRADE_URL = process.env.NEXT_PUBLIC_UPGRADE_URL ?? "";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center"><div className="text-sm text-slate-400">Loading…</div></div>}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const invited = searchParams.get("invited");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<ResultRow | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [history, setHistory] = useState<ResultRow[]>([]);

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
      setProfile((profileRes.data as ProfileRow | null) ?? { plan: "free", role: "user", full_name: "" });

      const historyRes = await supabase
        .from("assessment_results")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(10);
      setHistory((historyRes.data as ResultRow[]) ?? []);

      if (requestedId) {
        const { data } = await supabase
          .from("assessment_results")
          .select("*")
          .eq("id", requestedId)
          .maybeSingle();
        if (data) {
          setResult(data as ResultRow);
        } else {
          setNotFound(true);
        }
      } else if (historyRes.data && historyRes.data.length > 0) {
        setResult(historyRes.data[0] as ResultRow);
      } else {
        setNotFound(true);
      }

      setLoading(false);
    })();
  }, [router, requestedId]);

  if (loading) {
    return (
      <>
        <div className="aurora" />
        <div className="noise" />
        <div className="min-h-screen grid place-items-center">
          <div className="text-slate-400 text-sm">Loading results…</div>
        </div>
      </>
    );
  }

  if (notFound || !result) {
    return (
      <>
        <div className="aurora" />
        <div className="noise" />
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h1 className="font-display font-bold text-2xl">No results yet</h1>
          <p className="mt-2 text-slate-400 max-w-sm">
            You haven&apos;t completed the full assessment. It takes about 18 minutes.
          </p>
          <button
            onClick={() => router.push("/test")}
            className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-lg shadow-indigo-500/25"
          >
            Start the assessment
          </button>
        </div>
      </>
    );
  }

  const isPremium = profile?.plan === "premium" || profile?.role === "admin";
  const accuracy = Math.round(
    (result.answers.filter((a) => a.correct).length / Math.max(result.answers.length, 1)) * 100
  );
  const avgTime = Math.round(
    result.answers.reduce((sum, a) => sum + a.timeMs, 0) / Math.max(result.answers.length, 1)
  );
  const fmtDuration =
    result.duration_ms >= 3_600_000
      ? `${Math.floor(result.duration_ms / 3_600_000)}h ${Math.round((result.duration_ms % 3_600_000) / 60_000)}m`
      : `${Math.max(1, Math.round(result.duration_ms / 60_000))}m`;

  const radarData = Object.entries(DOMAIN_LABELS)
    .filter(([key]) => result.domains?.[key])
    .map(([key, label]) => ({ key, label, iq: result.domains[key].iq }));

  const ringPercent = Math.max(0, Math.min(1, (result.iq_score - 55) / (160 - 55)));

  return (
    <>
      <div className="aurora" />
      <div className="noise" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" aria-label="Aptimetric home">
            <Logo size={32} />
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <a href="/dashboard" className="px-4 py-2 rounded-full glass glass-hover text-white font-semibold transition">
              Dashboard
            </a>
            {isPremium && (
              <a
                href={`/certificate/${result.id}`}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold transition hover:opacity-95"
              >
                View certificate
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {invited === "1" && (
          <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            Your score has been shared with the organization that invited you.
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Score hero */}
          <div className="glass rounded-[2rem] p-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div
              className="absolute -inset-16 opacity-40 pointer-events-none"
              style={{
                background: `conic-gradient(from -90deg, rgba(34,211,238,0.0) 0deg, rgba(99,102,241,0.5) ${ringPercent * 360}deg, rgba(255,255,255,0.03) ${ringPercent * 360}deg, rgba(255,255,255,0.03) 360deg)`,
                borderRadius: "50%",
              }}
            />
            <div className="relative">
              <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-2">
                {result.status === "flagged" ? "Flagged result" : "Overall IQ"}
              </div>
              <div
                className="font-display font-extrabold text-7xl sm:text-8xl tracking-tight gradient-text"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.06)" }}
              >
                {Math.round(result.iq_score)}
              </div>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm font-semibold text-slate-100">
                {result.classification}
              </div>
              <div className="mt-4 text-sm text-slate-400">
                Better than <span className="text-cyan-300 font-semibold">{result.percentile}%</span> of people
              </div>
              <div className="mt-1 text-xs text-slate-500">
                95% confidence: {result.iq_ci_lower} – {result.iq_ci_upper}
              </div>
            </div>
          </div>

          {/* Radar */}
          <div className="glass rounded-[2rem] p-6 flex flex-col items-center justify-center">
            <h3 className="font-display font-bold text-lg self-start mb-2">Cognitive profile</h3>
            <RadarChart data={radarData} />
          </div>

          {/* Domain bars */}
          <div className="glass rounded-[2rem] p-6 sm:p-8 flex flex-col">
            <h3 className="font-display font-bold text-lg mb-1">Domain breakdown</h3>
            <div className="text-[11px] text-slate-500 mb-5">Scale: 0–160 (100 = average). Dashed line marks the mean.</div>
            <div className="space-y-4 flex-1">
              {radarData.map((d) => (
                <div key={d.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300">{d.label}</span>
                    <span className="font-semibold tabular-nums">{Math.round(d.iq)}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-[62.5%] w-px bg-slate-400/70"
                      title="Average (100)"
                    />
                    <div
                      className="relative h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 bar-fill"
                      style={{ width: `${Math.max(2, Math.min(100, (d.iq / 160) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
              <div>
                <div className="font-display font-bold text-xl">{accuracy}%</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wide mt-1">Accuracy</div>
              </div>
              <div>
                <div className="font-display font-bold text-xl">{fmtDuration}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wide mt-1">Duration</div>
              </div>
              <div>
                <div className="font-display font-bold text-xl">{avgTime}s</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wide mt-1">Avg / answer</div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate / upgrade */}
        <div className="mt-6 glass rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <h3 className="font-display font-bold text-xl">
              {isPremium ? "Your certificate is ready" : "Unlock your certificate & full report"}
            </h3>
            <p className="mt-2 text-slate-400 text-sm max-w-xl">
              {isPremium
                ? "A professionally designed, verifiable certificate with your IQ score, percentile, and full cognitive profile."
                : "Get a printable certificate with your score, full report, and detailed domain analysis to share with employers and universities."}
            </p>
          </div>
          {isPremium ? (
            <a
              href={`/certificate/${result.id}`}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-xl shadow-indigo-500/25 hover:opacity-95 transition"
            >
              View certificate →
            </a>
          ) : (
            <div className="shrink-0 flex flex-col items-end gap-2">
              {UPGRADE_URL ? (
                <a
                  href={UPGRADE_URL}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-xl shadow-indigo-500/25 hover:opacity-95 transition"
                >
                  Upgrade · $19
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass text-slate-300 text-sm">
                  Upgrade coming soon
                </span>
              )}
              <div className="text-xs text-slate-500">One-time purchase · lifetime access</div>
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 1 && (
          <div className="mt-6 glass rounded-[2rem] p-6 sm:p-8">
            <h3 className="font-display font-bold text-lg mb-4">Test history</h3>
            <div className="divide-y divide-white/5">
              {history.map((r) => (
                <a
                  key={r.id}
                  href={`/results?id=${r.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:bg-white/[0.03] rounded-lg px-2 -mx-2 transition"
                >
                  <div>
                    <div className="font-semibold text-slate-200">
                      {new Date(r.completed_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.status === "flagged" ? "Flagged" : `${r.answers.length} questions`}
                    </div>
                  </div>
                  <div className="font-display font-bold text-lg">{Math.round(r.iq_score)}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}