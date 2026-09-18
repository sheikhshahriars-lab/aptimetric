"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { DOMAIN_LABELS } from "@/lib/irt/scoring";
import Logo from "@/lib/components/Logo";

interface ProfileRow {
  full_name: string;
  plan: string;
  role: string;
}

interface ResultRow {
  id: string;
  iq_score: number;
  percentile: number;
  classification: string;
  domains: Record<string, { iq: number }>;
  status: string;
  completed_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const profileRes = await supabase
        .from("profiles")
        .select("full_name, plan, role")
        .eq("id", user.id)
        .maybeSingle();
      setProfile((profileRes.data as ProfileRow | null) ?? { full_name: "", plan: "free", role: "user" });

      const resultsRes = await supabase
        .from("assessment_results")
        .select("id, iq_score, percentile, classification, domains, status, completed_at")
        .order("completed_at", { ascending: false })
        .limit(10);
      setResults((resultsRes.data as ResultRow[]) ?? []);

      setLoading(false);
    })();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <>
        <div className="aurora" />
        <div className="noise" />
        <div className="min-h-screen grid place-items-center">
          <div className="text-slate-400 text-sm">Loading your dashboard…</div>
        </div>
      </>
    );
  }

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const latest = results[0] ?? null;
  const isPremium = profile?.plan === "premium" || profile?.role === "admin";

  return (
    <>
      <div className="aurora" />
      <div className="noise" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3" aria-label="Aptimetric home">
              <Logo size={36} />
            </Link>
            <div className="flex items-center gap-2">
              {(profile?.role === "recruiter" || profile?.role === "admin") && (
                <a
                  href="/recruiter"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass glass-hover text-sm font-semibold text-white transition"
                >
                  Recruiter
                </a>
              )}
              {profile?.role === "admin" && (
                <a
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass glass-hover text-sm font-semibold text-white transition"
                >
                  Admin
                </a>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass glass-hover text-sm font-semibold text-white transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-slate-200 mb-4">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Account active
            {profile?.plan === "premium" && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-[10px] font-semibold uppercase tracking-wide">
                Premium
              </span>
            )}
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
            Welcome back, <span className="gradient-text">{firstName}</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative overflow-hidden glass rounded-[2rem] p-8 sm:p-10">
            <div className="absolute -inset-10 bg-gradient-to-br from-indigo-600/20 to-cyan-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="relative">
              {latest ? (
                <>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                    Your latest result: <span className="gradient-text">{Math.round(latest.iq_score)} IQ</span>
                  </h2>
                  <p className="mt-3 text-slate-300 max-w-md">
                    {latest.classification} · better than {latest.percentile}% of people ·{" "}
                    {new Date(latest.completed_at).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <a
                    href={`/results?id=${latest.id}`}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-xl shadow-indigo-500/25 hover:opacity-95 transition"
                  >
                    View full report
                  </a>
                </>
              ) : (
                <>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                    You haven&apos;t taken the test yet
                  </h2>
                  <p className="mt-3 text-slate-300 max-w-md">
                    Get your full cognitive profile: IQ score, percentile, confidence interval, and a 6-domain breakdown.
                    Takes about 18 minutes.
                  </p>
                  <a
                    href="/test"
                    className="shimmer mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-xl shadow-indigo-500/25 hover:opacity-95 transition"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Start the Official Test
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="glass rounded-[2rem] p-8 flex flex-col">
            <h3 className="font-display font-bold text-lg mb-4">Your stats</h3>
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Tests completed</span>
                <span className="font-semibold">{results.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Latest IQ score</span>
                <span className="font-semibold">{latest ? Math.round(latest.iq_score) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Percentile</span>
                <span className="font-semibold">{latest ? `${latest.percentile}%` : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Certificate</span>
                <span className={isPremium ? "font-semibold text-emerald-300" : "font-semibold text-slate-500"}>
                  {isPremium ? "Premium" : "Locked"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(DOMAIN_LABELS).map(([key, label]) => {
            const domainIq = latest?.domains?.[key]?.iq;
            return (
              <div key={key} className="glass rounded-2xl p-5">
                <div className="text-sm text-slate-300">{label}</div>
                <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
                    style={{ width: domainIq ? `${Math.max(4, ((domainIq - 55) / 105) * 100)}%` : "0%" }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {domainIq ? `${Math.round(domainIq)} IQ` : "Not yet measured"}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}