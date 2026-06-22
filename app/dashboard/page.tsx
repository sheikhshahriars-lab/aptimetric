"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const supabase = createClient();
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      setLoading(false);
    };
    loadUser();
  }, [router]);

  const handleLogout = async () => {
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

  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <>
      <div className="aurora" />
      <div className="noise" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 grid place-items-center shadow-lg shadow-indigo-500/25">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-lg leading-none tracking-tight">
                  aptimetric<span className="text-indigo-400">.org</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Cognitive Labs</div>
              </div>
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass glass-hover text-sm font-semibold text-white transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-slate-200 mb-4">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Account active
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
            Welcome back, <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="mt-2 text-slate-400">{user?.email}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative overflow-hidden glass rounded-[2rem] p-8 sm:p-10">
            <div className="absolute -inset-10 bg-gradient-to-br from-indigo-600/20 to-cyan-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                You haven&apos;t taken the test yet
              </h2>
              <p className="mt-3 text-slate-300 max-w-md">
                Get your full cognitive profile: IQ score, percentile, confidence interval, and a 5-domain
                breakdown. Takes about 18 minutes.
              </p>
              <button className="shimmer mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-xl shadow-indigo-500/25 hover:opacity-95 transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Start the Official Test
              </button>
            </div>
          </div>

          <div className="glass rounded-[2rem] p-8 flex flex-col">
            <h3 className="font-display font-bold text-lg mb-4">Your stats</h3>
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Tests completed</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Latest IQ score</span>
                <span className="font-semibold text-slate-500">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Percentile</span>
                <span className="font-semibold text-slate-500">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Certificate</span>
                <span className="font-semibold text-slate-500">Not available</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "Fluid Reasoning",
            "Quantitative Reasoning",
            "Visual-Spatial Ability",
            "Working Memory",
            "Verbal Reasoning",
            "Processing Speed",
          ].map((domain) => (
            <div key={domain} className="glass rounded-2xl p-5">
              <div className="text-sm text-slate-300">{domain}</div>
              <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-0 bg-gradient-to-r from-indigo-500 to-cyan-400" />
              </div>
              <div className="mt-2 text-xs text-slate-500">Not yet measured</div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}