// app/recruiter/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/lib/components/Logo";

interface OrgInfo {
  id: string;
  name: string;
  created_at: string;
  invite_count: number;
  completed_count: number;
}

interface Invitation {
  email: string;
  status: string;
  token: string;
  iq_score: number | null;
  invited_at: string;
  completed_at: string | null;
}

export default function RecruiterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const [orgRes, invitesRes] = await Promise.all([
      supabase.rpc("get_my_org"),
      supabase.rpc("list_my_invitations"),
    ]);
    const orgData = orgRes.data as OrgInfo[];
    setOrg(orgData && orgData.length > 0 ? orgData[0] : null);
    setInvitations((invitesRes.data as Invitation[]) ?? []);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const roleRes = await supabase.rpc("app_role");
      if (roleRes.data !== "recruiter" && roleRes.data !== "admin") {
        setForbidden(true);
        setLoading(false);
        return;
      }
      await refresh();
      setLoading(false);
    })();
  }, [router, refresh]);

  const createOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("create_organization", { p_name: orgName.trim() });
    setBusy(false);
    if (error) {
      setFeedback(`Error: ${error.message}`);
      return;
    }
    setOrgName("");
    setFeedback("Organization created — you can now invite candidates.");
    await refresh();
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_invitation", { p_email: email.trim() });
    setBusy(false);
    if (error) {
      setFeedback(`Error: ${error.message}`);
      return;
    }
    setEmail("");
    setFeedback(`Invitation created! Copy the link and send it to your candidate.`);
    await refresh();
    const base = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof window !== "undefined" && data) {
      navigator.clipboard?.writeText(`${base}/invite/${data}`).catch(() => {});
      setCopied(String(data));
    }
  };

  const copyLink = async (token: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    await navigator.clipboard.writeText(`${base}/invite/${token}`);
    setCopied(token);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const revoke = async (token: string) => {
    const supabase = createClient();
    await supabase.rpc("revoke_invitation", { p_token: token });
    await refresh();
  };

  if (loading) {
    return (
      <>
        <div className="aurora" />
        <div className="noise" />
        <div className="min-h-screen grid place-items-center">
          <div className="text-slate-400 text-sm">Loading recruiter portal…</div>
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
          <div className="text-slate-400 text-sm">Recruiter access required. Create an organization to begin.</div>
        </div>
      </>
    );
  }

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
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 text-xs font-semibold">
              Recruiter
            </span>
          </div>
          <a href="/dashboard" className="px-4 py-2 rounded-full glass glass-hover text-white text-sm font-semibold transition">
            Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!org ? (
          <div className="glass rounded-[2rem] p-8 sm:p-12 max-w-xl mx-auto fade-up">
            <h1 className="font-display font-extrabold text-3xl tracking-tight">
              Run assessments for <span className="gradient-text">your hiring pipeline</span>
            </h1>
            <p className="mt-3 text-slate-400 text-sm">
              Create your organization, invite candidates, and compare cognitive profiles side-by-side.
            </p>
            <form onSubmit={createOrg} className="mt-8 space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Organization name</label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Corp"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 focus:border-cyan-400 outline-none text-white"
                />
              </div>
              {feedback && <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">{feedback}</div>}
              <button
                type="submit"
                disabled={busy || !orgName.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-bold text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 transition disabled:opacity-60"
              >
                {busy ? "Creating…" : "Create organization"}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-extrabold text-3xl tracking-tight">{org.name}</h1>
                <p className="mt-1 text-slate-400 text-sm">
                  {org.invite_count} invitations sent · {org.completed_count} completed
                </p>
              </div>
            </div>

            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {[
                { label: "Invitations sent", value: org.invite_count, accent: "from-indigo-500/20 to-transparent" },
                { label: "Completed", value: org.completed_count, accent: "from-cyan-400/20 to-transparent" },
                {
                  label: "Completion rate",
                  value: org.invite_count ? `${Math.round((org.completed_count / org.invite_count) * 100)}%` : "—",
                  accent: "from-violet-500/20 to-transparent",
                },
              ].map((s) => (
                <div key={s.label} className="glass rounded-2xl p-5 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-b ${s.accent} pointer-events-none`} />
                  <div className="relative">
                    <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">{s.label}</div>
                    <div className="font-display font-bold text-3xl mt-2">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 glass rounded-[2rem] p-6 sm:p-8">
              <h3 className="font-display font-bold text-lg">Invite a candidate</h3>
              <p className="mt-1 text-sm text-slate-400">
                We&apos;ll send them an assessment link by email. Their score lands here automatically.
              </p>
              <form onSubmit={invite} className="mt-4 flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@company.com"
                  required
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 focus:border-cyan-400 outline-none text-white"
                />
                <button
                  type="submit"
                  disabled={busy || !email.trim()}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-95 transition disabled:opacity-60"
                >
                  {busy ? "Creating…" : "Create invite link"}
                </button>
              </form>
              {feedback && <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">{feedback}</div>}
              {copied && (
                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                  Invite link copied to clipboard.
                </div>
              )}
            </div>

            <div className="mt-6 glass rounded-[2rem] p-6 overflow-x-auto">
              <h3 className="font-display font-bold text-lg mb-4">Candidates</h3>
              {invitations.length === 0 ? (
                <p className="text-sm text-slate-500">No invitations yet. Create your first invite above.</p>
              ) : (
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pr-4">Candidate</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">IQ</th>
                      <th className="pb-3 pr-4">Invited</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invitations.map((inv) => (
                      <tr key={inv.token}>
                        <td className="py-3 pr-4 font-semibold text-slate-200">{inv.email}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              inv.status === "completed"
                                ? "bg-emerald-400/10 text-emerald-300"
                                : inv.status === "revoked"
                                ? "bg-slate-400/10 text-slate-400"
                                : "bg-amber-400/10 text-amber-300"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-display font-bold text-base">
                          {inv.iq_score ? Math.round(inv.iq_score) : "—"}
                        </td>
                        <td className="py-3 pr-4 text-slate-400">
                          {new Date(inv.invited_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </td>
                        <td className="py-3 flex gap-2">
                          <button
                            onClick={() => copyLink(inv.token)}
                            className="px-3 py-1.5 rounded-lg glass glass-hover text-xs font-semibold text-slate-200 transition"
                          >
                            Copy link
                          </button>
                          {inv.status !== "revoked" && (
                            <button
                              onClick={() => revoke(inv.token)}
                              className="px-3 py-1.5 rounded-lg glass glass-hover text-xs font-semibold text-rose-300 transition"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}