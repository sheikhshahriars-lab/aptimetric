// app/invite/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Logo from "@/lib/components/Logo";

interface InviteInfo {
  org_name: string;
  candidate_email: string;
  status: string;
  iq_score: number | null;
  completed_at: string | null;
  expires_at: string;
}

type View =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "expired" }
  | { kind: "done"; invite: InviteInfo }
  | { kind: "auth"; invite: InviteInfo }
  | { kind: "mismatch"; invite: InviteInfo; email?: string }
  | { kind: "ready"; invite: InviteInfo };

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    Promise.resolve()
      .then(() => supabase.rpc("get_invitation", { p_token: token }))
      .then(({ data }) => {
        if (cancelled) return;
        if (!data || data.length === 0) {
          setView({ kind: "not-found" });
          return null as null;
        }
        const invite = data[0] as InviteInfo;
        if (invite.status === "revoked") {
          setView({ kind: "not-found" });
          return null as null;
        }
        if (new Date(invite.expires_at).getTime() < Date.now() && invite.status !== "completed") {
          setView({ kind: "expired" });
          return null as null;
        }
        if (invite.status === "completed") {
          setView({ kind: "done", invite });
          return null as null;
        }
        return invite;
      })
      .then((invite: InviteInfo | null | undefined) => {
        if (cancelled || !invite) return;
        return supabase.auth
          .getUser()
          .then(({ data: { user } }) => {
            if (cancelled) return;
            if (!user) {
              setView({ kind: "auth", invite });
              return;
            }
            if (user.email?.toLowerCase() !== invite.candidate_email.toLowerCase()) {
              setView({ kind: "mismatch", invite, email: user.email });
              return;
            }
            setView({ kind: "ready", invite });
          });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const startTest = () => router.push(`/test?token=${token}`);

  const center = (children: React.ReactNode) => (
    <>
      <div className="aurora" />
      <div className="noise" />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </>
  );

  if (view.kind === "loading" || view.kind === "not-found") {
    return center(
      <div className="text-center text-slate-400 text-sm">
        {view.kind === "loading" ? "Loading invitation…" : "This invitation link is invalid or no longer active."}
      </div>
    );
  }

  return center(
    <div className="glass rounded-[2rem] p-8 sm:p-10 fade-up">
      <div className="flex items-center justify-center mb-6">
        <Logo size={36} />
      </div>

      {view.kind === "expired" && (
        <>
          <h1 className="font-display font-bold text-2xl text-center">Invitation expired</h1>
          <p className="mt-3 text-slate-400 text-sm text-center">
            This assessment invitation has expired. Ask the organization to send you a new one.
          </p>
        </>
      )}

      {view.kind === "done" && (
        <>
          <h1 className="font-display font-bold text-2xl text-center">Assessment completed</h1>
          <p className="mt-3 text-slate-300 text-sm text-center">
            You&apos;ve completed the assessment for <strong>{view.invite.org_name}</strong>.
            {view.invite.iq_score
              ? ` Your IQ score of ${Math.round(view.invite.iq_score)} has been shared with them.`
              : ""}
          </p>
          <button
            onClick={() => router.push("/results")}
            className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-bold text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 transition"
          >
            View my results
          </button>
        </>
      )}

      {view.kind === "auth" && (
        <>
          <h1 className="font-display font-bold text-2xl text-center">
            You&apos;ve been invited
          </h1>
          <p className="mt-3 text-slate-300 text-sm text-center">
            <strong>{view.invite.org_name}</strong> has invited you to complete the Aptimetric cognitive assessment.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 text-center">
            Invited email: <strong>{view.invite.candidate_email}</strong>
          </div>
          <p className="mt-3 text-xs text-slate-500 text-center">
            Sign in or create a free account using that exact email address to begin.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <a
              href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
              className="inline-flex items-center justify-center py-3.5 rounded-2xl glass glass-hover text-white font-semibold transition"
            >
              Sign in
            </a>
            <a
              href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}
              className="inline-flex items-center justify-center py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold shadow-lg shadow-indigo-500/25 transition"
            >
              Create account
            </a>
          </div>
        </>
      )}

      {view.kind === "mismatch" && (
        <>
          <h1 className="font-display font-bold text-2xl text-center">Wrong account</h1>
          <p className="mt-3 text-slate-400 text-sm text-center">
            You&apos;re signed in as <strong>{view.email}</strong>, but this invitation is for{" "}
            <strong>{view.invite.candidate_email}</strong>. Sign out and sign in with the invited email address.
          </p>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
            }}
            className="mt-6 w-full py-3.5 rounded-2xl glass glass-hover font-bold text-white transition"
          >
            Switch account
          </button>
        </>
      )}

      {view.kind === "ready" && (
        <>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-cyan-300 font-semibold mb-2">Official assessment</div>
            <h1 className="font-display font-bold text-2xl">{view.invite.org_name}</h1>
            <p className="mt-2 text-slate-400 text-sm">
              You&apos;ve been selected to complete an adaptive cognitive assessment. It takes about 20 minutes and your
              score will be shared with {view.invite.org_name}.
            </p>
          </div>
          <button
            onClick={startTest}
            className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 font-bold text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 transition"
          >
            Start my assessment
          </button>
        </>
      )}
    </div>
  );
}