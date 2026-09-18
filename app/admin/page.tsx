// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/lib/components/Logo";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  role: string;
  created_at: string;
}

interface ResultRow {
  id: string;
  user_id: string;
  iq_score: number;
  percentile: number;
  classification: string;
  status: string;
  completed_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "results">("overview");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const roleRes = await supabase.rpc("app_role");
      if (roleRes.data !== "admin") {
        setForbidden(true);
        setLoading(false);
        return;
      }

      const [usersRes, resultsRes] = await Promise.all([
        supabase.rpc("admin_users"),
        supabase.from("assessment_results").select("*").order("completed_at", { ascending: false }).limit(200),
      ]);

      setUsers((usersRes.data as AdminUser[]) ?? []);
      setResults((resultsRes.data as ResultRow[]) ?? []);
      setLoading(false);
    })();
  }, [router]);

  const togglePremium = async (u: AdminUser) => {
    const supabase = createClient();
    await supabase.rpc("admin_set_profile", {
      p_user_id: u.id,
      p_plan: u.plan === "premium" ? "free" : "premium",
    });
    window.location.reload();
  };

  const toggleRole = async (u: AdminUser) => {
    const supabase = createClient();
    const next = u.role === "admin" ? "user" : u.role === "recruiter" ? "admin" : "recruiter";
    await supabase.rpc("admin_set_profile", {
      p_user_id: u.id,
      p_role: next,
    });
    window.location.reload();
  };

  if (loading) {
    return (
      <>
        <div className="aurora" />
        <div className="noise" />
        <div className="min-h-screen grid place-items-center">
          <div className="text-slate-400 text-sm">Loading admin panel…</div>
        </div>
      </>
    );
  }

  if (forbidden) {
    return (
      <>
        <div className="aurora" />
        <div className="noise" />
        <div className="min-h-screen grid place-items-center">
          <div className="text-slate-400 text-sm">Access denied. Admins only.</div>
        </div>
      </>
    );
  }

  const avgIq = results.length
    ? Math.round(results.reduce((s, r) => s + r.iq_score, 0) / results.length)
    : 0;
  const flaggedCount = results.filter((r) => r.status !== "completed").length;
  const premiumCount = users.filter((u) => u.plan === "premium").length;
  const recruiterCount = users.filter((u) => u.role === "recruiter").length;

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "users" as const, label: `Users (${users.length})` },
    { key: "results" as const, label: `Results (${results.length})` },
  ];

  return (
    <>
      <div className="aurora" />
      <div className="noise" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Aptimetric home">
              <Logo size={32} />
            </Link>
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-semibold">
              Admin
            </span>
          </div>
          <a href="/dashboard" className="px-4 py-2 rounded-full glass glass-hover text-white text-sm font-semibold transition">
            Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Admin portal</h1>
        <p className="mt-1 text-slate-400 text-sm">Users, results, and platform analytics.</p>

        <div className="mt-6 flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === t.key
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25"
                  : "glass glass-hover text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
          <a
            href="/admin/questions"
            className="px-4 py-2 rounded-full glass glass-hover text-sm font-semibold text-slate-300 transition"
          >
            Question bank →
          </a>
        </div>

        {activeTab === "overview" && (
          <div className="mt-8">
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { label: "Total users", value: users.length, accent: "from-indigo-500/20 to-transparent" },
                { label: "Tests completed", value: results.length, accent: "from-cyan-400/20 to-transparent" },
                { label: "Average IQ", value: results.length ? avgIq : "—", accent: "from-violet-500/20 to-transparent" },
                { label: "Flagged results", value: flaggedCount, accent: "from-rose-500/20 to-transparent", warn: flaggedCount > 0 },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-5 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-b ${stat.accent} pointer-events-none`} />
                  <div className="relative">
                    <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">{stat.label}</div>
                    <div className={`font-display font-bold text-3xl mt-2 ${stat.warn ? "text-rose-300" : "text-white"}`}>
                      {stat.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Premium subscribers</div>
                <div className="font-display font-bold text-2xl mt-2">{premiumCount}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Potential revenue: ${(premiumCount * 19).toLocaleString()}
                </div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Recruiter accounts</div>
                <div className="font-display font-bold text-2xl mt-2">{recruiterCount}</div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Conversion rate</div>
                <div className="font-display font-bold text-2xl mt-2">
                  {users.length ? Math.round((results.length / users.length) * 100) : 0}%
                </div>
              </div>
            </div>

            {results.length > 0 && (
              <div className="mt-8 glass rounded-[2rem] p-6">
                <h3 className="font-display font-bold text-lg mb-4">Latest results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">IQ</th>
                        <th className="pb-3 pr-4">Percentile</th>
                        <th className="pb-3 pr-4">Classification</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {results.slice(0, 10).map((r) => (
                        <tr key={r.id}>
                          <td className="py-2.5 pr-4 text-slate-300">
                            {new Date(r.completed_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-2.5 pr-4 font-semibold">{Math.round(r.iq_score)}</td>
                          <td className="py-2.5 pr-4 text-slate-300">{r.percentile}%</td>
                          <td className="py-2.5 pr-4 text-slate-300">{r.classification}</td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                r.status === "completed"
                                  ? "bg-emerald-400/10 text-emerald-300"
                                  : "bg-rose-400/10 text-rose-300"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="mt-8 glass rounded-[2rem] p-6 overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Plan</th>
                  <th className="pb-3 pr-4">Joined</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-200">{u.full_name || "—"}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-violet-400/10 text-violet-300"
                            : u.role === "recruiter"
                            ? "bg-cyan-400/10 text-cyan-300"
                            : "bg-slate-400/10 text-slate-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.plan === "premium" ? "bg-amber-400/10 text-amber-300" : "bg-slate-400/10 text-slate-400"
                        }`}
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-3 flex gap-2">
                      <button
                        onClick={() => togglePremium(u)}
                        className="px-3 py-1.5 rounded-lg glass glass-hover text-xs font-semibold text-slate-200 transition"
                      >
                        {u.plan === "premium" ? "Remove premium" : "Grant premium"}
                      </button>
                      <button
                        onClick={() => toggleRole(u)}
                        className="px-3 py-1.5 rounded-lg glass glass-hover text-xs font-semibold text-slate-200 transition"
                      >
                        {u.role === "admin" ? "Demote" : u.role === "recruiter" ? "Make admin" : "Make recruiter"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "results" && (
          <div className="mt-8 glass rounded-[2rem] p-6 overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">IQ</th>
                  <th className="pb-3 pr-4">CI</th>
                  <th className="pb-3 pr-4">Percentile</th>
                  <th className="pb-3 pr-4">Duration</th>
                  <th className="pb-3 pr-4">Tabs</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 text-slate-300">
                      {new Date(r.completed_at).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-3 pr-4 font-semibold">{Math.round(r.iq_score)}</td>
                    <td className="py-3 pr-4 text-slate-400 tabular-nums">
                      {(r as unknown as { iq_ci_lower: number }).iq_ci_lower ?? "—"}–
                      {(r as unknown as { iq_ci_upper: number }).iq_ci_upper ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{r.percentile}%</td>
                    <td className="py-3 pr-4 text-slate-300">{r.classification}</td>
                    <td className="py-3 pr-4 text-slate-400">
                      {(r as unknown as { tab_switches: number }).tab_switches ?? 0}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "completed"
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-rose-400/10 text-rose-300"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}